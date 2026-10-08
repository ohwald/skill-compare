"""e2e 夹具:在 fixtures 构建产物上叠加一个多版本演示 skill。

fixtures 目录不是 git 仓库,`build --fixtures` 里每个 skill 只有 1 个时间点,
而 e2e 要验收时间轴双柄/下拉/章节角标,需要真实的多版本数据 —— 用确定性
的构造数据补上(日期跨度、tag、同日爆发、逐版本 +N −M 都有)。
"""
import json
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

DEMO_ID = "demo-history"
# (date, sha, tags, change, lines)  旧 → 新;含 3 个同日 commit 的爆发段
DEMO_VERSIONS = [
    ("2026-05-10", "a100000001", [], None, 20),
    ("2026-05-12", "a100000002", [], {"added": 5, "removed": 0}, 22),
    ("2026-05-12", "a100000003", ["skill-v0.9.0"], {"added": 2, "removed": 1}, 23),
    ("2026-06-01", "a100000004", [], {"added": 10, "removed": 2}, 31),
    ("2026-06-20", "a100000005", ["skill-v1.0.0"], {"added": 0, "removed": 3}, 28),
    ("2026-07-05", "a100000006", [], {"added": 4, "removed": 4}, 28),
    ("2026-07-05", "a100000007", [], {"added": 1, "removed": 0}, 29),
    ("2026-07-05", "a100000008", [], {"added": 6, "removed": 2}, 33),
    ("2026-08-14", "a100000009", ["skill-v1.1.0"], {"added": 3, "removed": 1}, 35),
    ("2026-09-02", "a100000010", [], {"added": 0, "removed": 6}, 29),
    ("2026-09-30", "a100000011", [], {"added": 2, "removed": 0}, 31),
    ("2026-10-06", "a100000012", ["skill-v2.0.0"], {"added": 8, "removed": 1}, 38),
]
BASE_BODY = ("---\nname: demo-history\ndescription: e2e demo skill\n---\n\n"
             "# Overview\n\nDemo body line 1.\nDemo body line 2.\n\n"
             "# Usage\n\nRun the demo.\n\n# Tips\n\nBe careful.\n")


def demo_body(i):
    body = BASE_BODY
    if i >= 3:
        body = body.replace("# Overview\n\nDemo body line 1.\n",
                            "# Overview\n\nDemo body line 1.\nOverview added line A.\nOverview added line B.\n")
    if i >= 4:
        body = body.replace("Demo body line 2.\n", "")
    if i >= 8:
        body += "\n# Advanced\n\nAdvanced section content.\n"
    if i >= 9:
        body = body.replace("Run the demo.\n", "Run the newer demo.\n")
    if i >= 11:
        body = body.replace("# Tips\n\nBe careful.\n", "# Tips\n\nBe careful. Extra tip.\nMore tips here.\n")
    return body


def build(out_dir: pathlib.Path) -> pathlib.Path:
    """构建带演示 skill 的站点到 out_dir,返回站点根目录。"""
    out_dir = pathlib.Path(out_dir)
    if out_dir.exists():
        shutil.rmtree(out_dir)
    subprocess.run([sys.executable, "-m", "pipeline.build", "--fixtures", "fixtures",
                    "--out", str(out_dir)], cwd=ROOT, check=True, capture_output=True)
    manifest = json.loads((out_dir / "manifest.json").read_text())
    versions = [{"sha": s, "date": d, "fp": f"demo-{s}", "lines": l, "tags": tg, "change": ch}
                for d, s, tg, ch, l in DEMO_VERSIONS]
    demo = {"id": DEMO_ID, "name": DEMO_ID, "desc": "e2e demo", "source": "demo/repo",
            "source_id": "demo", "license": "MIT", "license_status": "full", "stars": 42,
            "installs": 100, "category": None, "lines": 38, "tokens": 800, "fp": "demo-head",
            "also_seen": [], "url": "u",
            "context_cost": {"resident": 10, "trigger": 100, "files": 0},
            "compat": {"binding": "portable", "harness_fields": [], "style": "mixed",
                       "unknown_fields": []},
            "head": "deadbeef", "files": [], "tags": [], "set": None,
            "rel_path": "skills/demo/SKILL.md",
            "versions": versions, "versions_count": len(versions), "name_conflicts": []}
    manifest["skills"].insert(0, demo)
    manifest["featured"] = [[DEMO_ID, DEMO_ID]]
    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, separators=(",", ":")))
    for i, (d, s, tg, ch, l) in enumerate(DEMO_VERSIONS):
        (out_dir / "bodies" / f"demo-{s}.md").write_text(demo_body(i))
    return out_dir
