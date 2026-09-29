"""构建站点:python3 -m pipeline.build [--fixtures DIR | --real] [--out site] [--fetch-aux]

两种模式:
  --fixtures DIR  从本地 fixtures 目录构建(测试 / 演示,无网络)
  --real          从 .sources/ 下已克隆的三个内容源构建(先跑 python3 -m pipeline.collect)
"""

import argparse
import datetime
import json
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
          fetch_aux=False, cache_dir=".cache"):
    themes_path = THEMES_JSON
    themes = json.loads(themes_path.read_text())["themes"]
    entries, repo_dirs = [], {}
    if fixtures_dir:
        cfg = {"id": "fixtures", "repo": "local/fixtures", "branch": "-", "subdir": "",
               "priority": 1, "exclude": []}
        entries = M.collect_source_entries(cfg, fixtures_dir)
    else:
        for src in config.SOURCES:
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
    # 版本轴(真实源:git 历史;fixtures:单一合成时间点)
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
        s["versions"] = versions
        s["versions_count"] = len(versions)
    manifest = {"generated": datetime.datetime.now(datetime.timezone.utc)
                .strftime("%Y-%m-%d %H:%M UTC"),
                "count": len(skills), "skills": skills,
                "featured": [p for p in config.DEFAULT_FEATURED
                             if all(x in {s["id"] for s in skills} for x in p)]}
    validate.validate_manifest(manifest, bodies)
    out_dir = Path(out)
    bodies_dir = out_dir / "bodies"
    if out_dir.exists():
        shutil.rmtree(out_dir)
    bodies_dir.mkdir(parents=True)
    for fp, text in bodies.items():
        (bodies_dir / f"{fp}.md").write_text(text, encoding="utf-8")
    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    html = TEMPLATE.read_text()
    payload = json.dumps(manifest, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html = html.replace("__THEME_CSS__", theme_css(themes))
    html = html.replace("__THEME_LIST__", theme_list(themes))
    html = html.replace("__MANIFEST__", payload)
    (out_dir / "index.html").write_text(html, encoding="utf-8")
    print(f"构建完成:{manifest['count']} skills,{len(bodies)} 份正文 → {out_dir}/")


def main(argv=None):
    ap = argparse.ArgumentParser(prog="python3 -m pipeline.build")
    ap.add_argument("--fixtures", help="fixtures 目录(测试/演示模式)")
    ap.add_argument("--real", action="store_true", help="从 .sources 内容源构建")
    ap.add_argument("--sources", default=".sources")
    ap.add_argument("--out", default="site")
    ap.add_argument("--fetch-aux", action="store_true", help="联网拉取辅助数据(stars/installs/分类)")
    ap.add_argument("--cache", default=".cache")
    args = ap.parse_args(argv)
    if not args.fixtures and not args.real:
        ap.error("需要 --fixtures DIR 或 --real 之一")
    build(args.fixtures, args.real, args.sources, args.out, args.fetch_aux, args.cache)


if __name__ == "__main__":
    main()
