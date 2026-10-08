"""每日更新循环端到端验证:本地 bare 仓库模拟上游推进,
collect(fetch+reset)→ build 是否正确反映最新内容、新 skill 与 tag。"""
import json
import subprocess
from pathlib import Path

import pytest

from pipeline import collect
from pipeline.build import build


def git(d, *args):
    subprocess.run(["git", "-C", str(d), *args], check=True, capture_output=True, text=True)


@pytest.fixture()
def upstream(tmp_path):
    """bare 仓库模拟远端上游,seed 一个 demo skill。"""
    bare = tmp_path / "origin.git"
    seed = tmp_path / "seed"
    seed.mkdir()
    subprocess.run(["git", "init", "--bare", "-b", "main", str(bare)], check=True, capture_output=True)
    git(seed, "init", "-b", "main")
    git(seed, "config", "user.email", "t@t")
    git(seed, "config", "user.name", "t")
    sk = seed / "skills" / "demo"
    sk.mkdir(parents=True)
    (sk / "SKILL.md").write_text("---\nname: demo\ndescription: seed\nlicense: MIT\n---\n# demo\nseed\n",
                                 encoding="utf-8")
    git(seed, "add", "-A")
    git(seed, "commit", "-m", "seed")
    git(seed, "push", str(bare), "main")
    return bare


def push_change(seed_repo, bare, skills):
    """skills: {name: (正文, tag 或 None)}——有变更就 commit(含空 commit 以造 no-op tag 点)。"""
    for name, (content, tag) in skills.items():
        d = seed_repo / "skills" / name
        d.mkdir(parents=True, exist_ok=True)
        (d / "SKILL.md").write_text(
            f"---\nname: {name}\ndescription: {name}\nlicense: MIT\n---\n{content}", encoding="utf-8")
        git(seed_repo, "add", "-A")
        git(seed_repo, "commit", "--allow-empty", "-m", f"update {name}")
        if tag:
            git(seed_repo, "tag", tag)
    git(seed_repo, "push", bare, "main")
    git(seed_repo, "push", bare, "--tags")   # 上游发布 tag 需显式推送


def run_build(tmp_path, upstream, sources_dir):
    print("\n[run_build] out =", tmp_path / "site", "| sources_dir =", sources_dir)
    cfg = {"id": "up", "repo": str(upstream), "branch": "main", "subdir": "skills",
           "priority": 1, "exclude": []}
    out = tmp_path / "site"
    build(real=True, sources=[cfg], sources_dir=str(sources_dir), out=str(out))
    return json.loads((out / "manifest.json").read_text())


def test_daily_update_loop(tmp_path, upstream):
    seed = tmp_path / "seed"
    sources_dir = tmp_path / "sources"

    # 第一天:首次采集 + 构建
    print("[seed exists]", (tmp_path / "seed" / ".git").exists())
    m1 = run_build(tmp_path, upstream, sources_dir)
    assert [s["id"] for s in m1["skills"]] == ["demo"]
    demo1 = m1["skills"][0]
    assert demo1["versions_count"] == 1
    assert "seed" in (tmp_path / "site" / "bodies" / f"{demo1['fp']}.md").read_text()

    # 第二天:上游推进——demo 内容更新并打 tag,另新增一个 skill
    push_change(seed, upstream, {
        "demo": ("demo v2 content\nwith a new section\n", "v2.0.0"),
        "fresh": ("fresh skill content\n", None),
    })
    m2 = run_build(tmp_path, upstream, sources_dir)

    # 断言:fetch+reset 拉到了新状态
    ids = [s["id"] for s in m2["skills"]]
    assert "fresh" in ids                                  # 新 skill 被发现
    demo2 = next(s for s in m2["skills"] if s["id"] == "demo")
    assert demo2["versions_count"] == 2                    # 版本轴增长
    tagged = [v for v in demo2["versions"] if v["tags"]]
    assert tagged and tagged[-1]["tags"] == ["v2.0.0"]     # tag 落点标注
    new_body = (tmp_path / "site" / "bodies" / f"{demo2['fp']}.md").read_text()
    assert "demo v2 content" in new_body                   # 正文已是最新
    assert (tmp_path / "site" / "bodies" / f"{demo1['fp']}.md").exists()  # 旧版本正文保留

    # build stamp + 资源缓存指纹:线上 vs 本地一键核对,杜绝"浏览器缓存"式误诊
    html = (tmp_path / "site" / "index.html").read_text(encoding="utf-8")
    assert '<meta name="build" content="' in html and "__BUILD_STAMP__" not in html
    assert "app.js?v=" in html
