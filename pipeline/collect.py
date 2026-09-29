"""真实内容源采集:clone/fetch 仓库 + 辅助数据(marketplace 分类、skills.sh 安装量、stars)。

所有网络请求都是尽力而为:失败时记日志、返回 None,不阻断构建。
"""

import json
import subprocess
import urllib.request
from pathlib import Path

from . import config


def _git(*args, cwd=None):
    r = subprocess.run(["git", *([f"-C", str(cwd)] if cwd else []), *args],
                       capture_output=True, text=True, check=True)
    return r.stdout


def _fetch_json(url, timeout=15):
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def ensure_repo(source, sources_dir):
    """clone(单分支全历史,供版本轴)或更新已有仓库,返回仓库目录。"""
    sources_dir = Path(sources_dir); sources_dir.mkdir(parents=True, exist_ok=True)
    d = sources_dir / source["id"]
    if (d / ".git").is_dir():
        _git("fetch", "origin", "--prune", cwd=d)
        _git("reset", "--hard", f"origin/{source['branch']}", cwd=d)
    else:
        _git("clone", "--single-branch", "--branch", source["branch"], source["repo"], str(d))
    return d


def load_cache(cache_dir):
    f = Path(cache_dir) / "aux.json"
    if f.is_file():
        return json.loads(f.read_text())
    return {}


def save_cache(cache_dir, cache):
    f = Path(cache_dir); f.mkdir(parents=True, exist_ok=True)
    (f / "aux.json").write_text(json.dumps(cache, ensure_ascii=False, indent=1))


def fetch_stars(repos, cache):
    out = cache.setdefault("stars", {})
    for repo in repos:
        if repo in out:
            continue
        try:
            out[repo] = _fetch_json(config.AUX["github_repo_api"].format(repo=repo))["stargazers_count"]
        except Exception as e:
            print(f"[aux] stars 获取失败 {repo}: {e}")
            out[repo] = None
    return out


def fetch_installs(items, cache):
    """items: [(skill 名, 来源 repo slug)]。按 source+skillId 精确匹配,取不到为 None。"""
    out = cache.setdefault("installs", {})
    import time
    for name, repo in items:
        key = f"{name}@{repo}"
        if key in out:
            continue
        val = None
        for attempt in range(3):
            try:
                time.sleep(1.2 * attempt)
                data = _fetch_json(config.AUX["skills_sh_search"].format(query=name))
                entries = data.get("skills", []) if isinstance(data, dict) else data
                hit = next((e for e in entries
                            if isinstance(e, dict) and e.get("skillId") == name
                            and (not repo or e.get("source") == repo)), None)
                # 命中才缓存;未命中与失败都不缓存,避免把限流误当成「无数据」
                if hit is not None:
                    val = hit.get("installs")
                break
            except Exception as e:
                if attempt == 2:
                    print(f"[aux] installs 获取失败 {name}: {e}")
                time.sleep(1.5)
        out[key] = val
    return out


def fetch_categories(cache):
    out = cache.setdefault("categories", {})
    if out:
        return out
    try:
        data = _fetch_json(config.AUX["marketplace_json"])
        for entry in data if isinstance(data, list) else data.get("plugins", []):
            nm, cat = entry.get("name"), entry.get("category")
            if nm and cat:
                out.setdefault(nm, cat)
    except Exception as e:
        print(f"[aux] marketplace 获取失败: {e}")
    return out


def gather_aux(source_cfgs, skill_items, repos, cache_dir):
    cache = load_cache(cache_dir)
    stars = fetch_stars(repos, cache)
    installs = fetch_installs(skill_items, cache)
    categories = fetch_categories(cache)
    save_cache(cache_dir, cache)
    return {"stars": stars, "installs": installs, "categories": categories}


def main(argv=None):
    for src in config.SOURCES:
        d = ensure_repo(src, ".sources")
        print(f"[collect] {src['id']} 就绪 → {d}")


if __name__ == "__main__":
    main()
