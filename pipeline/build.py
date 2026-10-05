"""构建站点:python3 -m pipeline.build [--fixtures DIR | --real] [--out site] [--fetch-aux]

两种模式:
  --fixtures DIR  从本地 fixtures 目录构建(测试 / 演示,无网络)
  --real          从 .sources/ 下已克隆的三个内容源构建(先跑 python3 -m pipeline.collect)
"""

import argparse
import datetime
import json
import re
import shutil
import sys
from pathlib import Path

from . import collect, config, validate
from . import manifest as M
from . import versions as V

THEMES_JSON = Path("design-preview/themes.json")
TEMPLATE = Path("template/index.html")
THEME_LABELS = {"tokyo-night": "Tokyo Night", "catppuccin-mocha": "Catppuccin Mocha",
                "one-dark-pro": "One Dark Pro", "github-light": "GitHub Light",
                "one-light": "One Light", "solarized-light": "Solarized Light"}


def theme_css(themes):
    blocks = []
    for tid, t in themes.items():
        decl = ";\n".join(f"--{k.replace('_', '-')}:{v}" for k, v in t["colors"].items())
        decl += f";\ncolor-scheme:{t.get('mode', 'dark')}"
        blocks.append(f'[data-theme="{tid}"]{{\n{decl}\n}}')
    return "\n".join(blocks)


def theme_list(themes):
    return json.dumps([{"id": tid, "label": THEME_LABELS.get(tid, tid)} for tid in themes])


def build(fixtures_dir=None, real=False, sources_dir=".sources", out="site",
          fetch_aux=False, cache_dir=".cache", sources=None, bodies_mode="copy"):
    themes_path = THEMES_JSON
    themes = json.loads(themes_path.read_text())["themes"]
    entries, repo_dirs = [], {}
    if fixtures_dir:
        cfg = {"id": "fixtures", "repo": "local/fixtures", "branch": "-", "subdir": "",
               "priority": 1, "exclude": []}
        entries = M.collect_source_entries(cfg, fixtures_dir)
    else:
        for src in (sources or config.SOURCES):
            d = collect.ensure_repo(src, sources_dir)
            repo_dirs[src["id"]] = d
            entries += M.collect_source_entries(src, str(d))
    bodies = {}
    skills = M.assemble(entries, bodies=bodies)
    aux = {"stars": {}, "installs": {}, "categories": {}}
    if real or fetch_aux:
        repos = sorted({e["repo"] for e in entries})
        items = sorted({(e["name"], e["repo"].removeprefix("https://github.com/")) for e in entries})
        aux = collect.gather_aux(config.SOURCES, items, repos, cache_dir)
    for s in skills:
        s["stars"] = aux["stars"].get(s["source"])
        s["installs"] = aux["installs"].get(f'{s["name"]}@{s["source"]}')
        s["category"] = aux["categories"].get(s["name"])
    # 版本轴 + 逐版本 diff 预计算(相对时间轴上前一版本,git 风格 +added/−removed)
    import difflib
    def line_diff(prev_text, text):
        a = [l for l in prev_text.split("\n")]
        b = [l for l in text.split("\n")]
        sm = difflib.SequenceMatcher(a=[l.rstrip() for l in a], b=[l.rstrip() for l in b], autojunk=False)
        added = removed = 0
        for tag, i1, i2, j1, j2 in sm.get_opcodes():
            if tag in ("replace", "delete"):
                removed += i2 - i1
            if tag in ("replace", "insert"):
                added += j2 - j1
        return added, removed

    tag_cache = {}
    today = datetime.date.today().isoformat()
    for s in skills:
        repo_dir = s.pop("_repo_dir", None)
        versions = []
        if repo_dir and (Path(repo_dir) / ".git").is_dir():
            tags = tag_cache.setdefault(repo_dir, V.load_tags(repo_dir))
            versions = V.extract_versions(Path(repo_dir), s["rel_path"], tags=tags)
            for v in versions:
                try:
                    bodies[v["fp"]] = V._git(Path(repo_dir), "show", f'{v["sha"]}:{s["rel_path"]}')
                except Exception as e:
                    print(f"[versions] 正文读取失败 {s['id']}@{v['sha']}: {e}")
        if not versions:
            versions = [{"sha": "0000000000", "date": today, "fp": s["fp"], "lines": s["lines"], "tags": []}]
            bodies.setdefault(s["fp"], "")
        prev_text = None
        for v in versions:
            if prev_text is None:
                v["change"] = None                      # 最早版本无前驱
            else:
                added, removed = line_diff(prev_text, bodies.get(v["fp"], ""))
                v["change"] = None if (added == 0 and removed == 0) else {"added": added, "removed": removed}
            prev_text = bodies.get(v["fp"], "")
        s["versions"] = versions
        s["versions_count"] = len(versions)
    manifest = {"generated": datetime.datetime.now(datetime.timezone.utc)
                .strftime("%Y-%m-%d %H:%M UTC"),
                "count": len(skills), "skills": skills,
                "featured": [p for p in config.DEFAULT_FEATURED
                             if all(x in {s["id"] for s in skills} for x in p)]}
    validate.validate_manifest(manifest, bodies)
    out_dir = Path(out)
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)
    if bodies_mode == "link":
        # 零拷贝:指纹 → GitHub raw URL 映射,内容由前端按需从源仓库拉取。
        # 版本锁定用各时间点自己的 commit;当前版用 skill.head。
        mapping = {}
        for s in manifest["skills"]:
            info = {"repo": s["source"], "dir": s["rel_path"].rsplit("/", 1)[0]}
            base = f"https://raw.githubusercontent.com/{info['repo']}"
            if s.get("head"):
                mapping[s["fp"]] = f"{base}/{s['head']}/{info['dir']}/SKILL.md"
            for v in s.get("versions") or []:
                if v["fp"] not in mapping:
                    mapping[v["fp"]] = f"{base}/{v['sha']}/{info['dir']}/SKILL.md"
        (out_dir / "bodies.json").write_text(
            json.dumps(mapping, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    else:
        bodies_dir = out_dir / "bodies"
        bodies_dir.mkdir(parents=True)
        for fp, text in bodies.items():
            (bodies_dir / f"{fp}.md").write_text(text, encoding="utf-8")
    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    html = TEMPLATE.read_text()
    # 内联 lite 版:选择器/对比只需元数据;versions 与 files 清单按需 fetch 完整版
    LITE_FIELDS = ("id", "name", "desc", "source", "source_id", "license", "license_status",
                   "stars", "installs", "lines", "tokens", "context_cost", "compat",
                   "also_seen", "name_conflicts", "versions_count")
    lite = {**manifest, "lite": True,
            "skills": [{k: s[k] for k in LITE_FIELDS if k in s} for s in manifest["skills"]]}
    payload = json.dumps(lite, ensure_ascii=False, separators=(",", ":")).replace("</", "<\/")
    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    html = html.replace("__THEME_CSS__", theme_css(themes))
    html = html.replace("__THEME_LIST__", theme_list(themes))
    html = html.replace("__MANIFEST__", payload)
    (out_dir / "index.html").write_text(html, encoding="utf-8")
    app_js = (TEMPLATE.parent / "app.js").read_text()
    app_js = app_js.replace("__THEME_LIST__", theme_list(themes))
    (out_dir / "app.js").write_text(app_js, encoding="utf-8")
    # 防回归:任何产物里残留占位符 = 模板替换遗漏,直接构建失败
    leftovers = []
    for f in ("index.html", "app.js"):
        found = re.findall(r"__[A-Z_]+__", (out_dir / f).read_text())
        if found:
            leftovers.append(f"{f}: {sorted(set(found))}")
    if leftovers:
        raise ValueError("构建产物残留占位符 → " + "; ".join(leftovers))
    print(f"构建完成:{manifest['count']} skills,{len(bodies)} 份正文 → {out_dir}/")


def main(argv=None):
    ap = argparse.ArgumentParser(prog="python3 -m pipeline.build")
    ap.add_argument("--fixtures", help="fixtures 目录(测试/演示模式)")
    ap.add_argument("--real", action="store_true", help="从 .sources 内容源构建")
    ap.add_argument("--sources", default=".sources")
    ap.add_argument("--out", default="site")
    ap.add_argument("--fetch-aux", action="store_true", help="联网拉取辅助数据(stars/installs/分类)")
    ap.add_argument("--cache", default=".cache")
    ap.add_argument("--bodies-mode", choices=["copy", "link"], default="copy",
                    help="copy=产物自带正文;link=指纹→GitHub raw 映射(零拷贝,前端按需拉)")

    args = ap.parse_args(argv)
    if not args.fixtures and not args.real:
        ap.error("需要 --fixtures DIR 或 --real 之一")
    build(args.fixtures, args.real, args.sources, args.out, args.fetch_aux, args.cache,
          bodies_mode=args.bodies_mode)


if __name__ == "__main__":
    main()
