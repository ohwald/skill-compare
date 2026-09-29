import os
import subprocess

import pytest

from pipeline.versions import extract_versions, load_tags


@pytest.fixture()
def git_repo(tmp_path):
    repo = tmp_path / "repo"
    repo.mkdir()
    def git(*args, **kw):
        env = kw.pop("env", None)
        full = {**os.environ, **(env or {})}
        return subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=True, check=True, env=full, **kw)
    git("init", "-b", "main")
    git("config", "user.email", "t@t")
    git("config", "user.name", "t")
    skill = repo / "skills" / "demo"
    skill.mkdir(parents=True)
    versions = ["v1 content\n", "v1 content\n", "v2 content\nmore\n", "v2 content\nmore\n", "v3\n"]
    for i, content in enumerate(versions):
        (skill / "SKILL.md").write_text(content, encoding="utf-8")
        git("add", "-A")
        date = "2025-01-0%dT00:00:00" % (i + 1)
        git("commit", "--allow-empty", "-m", f"c{i}", "--date=" + date,
            env={"GIT_AUTHOR_DATE": date, "GIT_COMMITTER_DATE": date})
    git("tag", "v2.0.0", "HEAD~1")
    return repo


def test_extract_versions_dedupes_and_orders(git_repo):
    vs = extract_versions(git_repo, "skills/demo/SKILL.md")
    assert len(vs) == 3                                   # 5 个 commit,相邻同内容去重后 3 个时间点
    assert [v["lines"] for v in vs] == [2, 3, 2]          # 旧 → 新
    assert vs[0]["date"] == "2025-01-01" and vs[-1]["date"] == "2025-01-05"


def test_extract_versions_attaches_tags(git_repo):
    vs = extract_versions(git_repo, "skills/demo/SKILL.md")
    tagged = [v for v in vs if v["tags"]]
    assert len(tagged) == 1 and tagged[0]["tags"] == ["v2.0.0"]
    assert tagged[0] is vs[1]


def test_load_tags_maps_both_ref_and_peeled(git_repo):
    tags = load_tags(git_repo)
    assert any("v2.0.0" in t for t in tags.values())


def test_missing_path_returns_empty(git_repo):
    assert extract_versions(git_repo, "skills/nope/SKILL.md") == []
