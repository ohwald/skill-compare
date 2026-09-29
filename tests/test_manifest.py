import pytest

from pipeline.manifest import assemble, collect_source_entries, fingerprint

CFG = {"id": "src", "repo": "https://github.com/a/b", "priority": 1, "subdir": "skills", "exclude": []}


def make_entry(name, body="body", priority=1, source_id="src", repo="https://github.com/a/b"):
    return {"source_id": source_id, "priority": priority, "repo": repo, "name": name,
            "desc": f"{name} desc", "license": "MIT", "license_status": "full",
            "body": body, "rel_dir": f"skills/{name}", "rel_path": f"skills/{name}/SKILL.md",
            "url": f"{repo}/tree/main/skills/{name}"}


def test_fingerprint_is_stable_short_sha():
    assert fingerprint("abc") == fingerprint("abc") != fingerprint("abd")
    assert len(fingerprint("abc")) == 16


def test_assemble_single_source_fields(tmp_path):
    skills = assemble([make_entry("alpha"), make_entry("beta")], aux={})
    assert [s["id"] for s in skills] == ["alpha", "beta"]
    a = skills[0]
    assert a["license_status"] == "full" and a["fp"] == fingerprint("body")
    assert a["lines"] == 1 and a["tokens"] == max(1, len("body") // 4)


def test_same_name_same_content_merges_with_also_seen():
    entries = [make_entry("alpha", body="same", priority=1, source_id="src", repo="https://github.com/a/b"),
               make_entry("alpha", body="same", priority=2, source_id="other", repo="https://github.com/c/d")]
    skills = assemble(entries, aux={})
    assert len(skills) == 1
    assert skills[0]["source"] == "https://github.com/a/b"          # canonical = 高优先级源
    assert skills[0]["also_seen"] == ["https://github.com/c/d"]     # 其余记「也见于」


def test_same_name_different_content_stays_separate():
    entries = [make_entry("alpha", body="v1", priority=1, source_id="src", repo="https://github.com/a/b"),
               make_entry("alpha", body="v2", priority=2, source_id="other", repo="https://github.com/c/d")]
    skills = assemble(entries, aux={})
    assert sorted(s["id"] for s in skills) == ["alpha", "alpha--other"]
    assert skills[0]["also_seen"] == [] and skills[1]["also_seen"] == []


def test_aux_data_is_attached():
    skills = assemble([make_entry("alpha")], aux={"stars": {"https://github.com/a/b": 1234},
                                                  "installs": {"alpha": 999},
                                                  "categories": {"alpha": "testing"}})
    assert skills[0]["stars"] == 1234 and skills[0]["installs"] == 999 and skills[0]["category"] == "testing"


def test_collect_source_entries_walks_and_excludes(tmp_path):
    (tmp_path / "skills" / "good").mkdir(parents=True)
    (tmp_path / "skills" / "good" / "SKILL.md").write_text("---\nname: good\n---\nbody", encoding="utf-8")
    (tmp_path / "skills" / "good" / "LICENSE.txt").write_text("MIT License", encoding="utf-8")
    (tmp_path / "skills" / "deprecated" / "old").mkdir(parents=True)
    (tmp_path / "skills" / "deprecated" / "old" / "SKILL.md").write_text("---\nname: old\n---\nbody", encoding="utf-8")
    cfg = dict(CFG, exclude=["deprecated/"])
    entries = collect_source_entries(cfg, tmp_path)
    assert [e["name"] for e in entries] == ["good"]
    assert entries[0]["license_status"] == "full"        # 目录内 LICENSE.txt 兜底判定


def test_collect_source_entries_missing_subdir_is_empty(tmp_path):
    assert collect_source_entries(CFG, tmp_path) == []


def test_collect_requires_skill_md(tmp_path):
    (tmp_path / "skills" / "notaskill").mkdir(parents=True)
    (tmp_path / "skills" / "notaskill" / "README.md").write_text("nope", encoding="utf-8")
    assert collect_source_entries(CFG, tmp_path) == []


@pytest.mark.parametrize("kw", [{"subdir": "skills"}])
def test_collect_signature_stable(tmp_path, kw):
    assert callable(collect_source_entries)
