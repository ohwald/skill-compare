import pytest

from pipeline.validate import validate_manifest


def base_skill(sid="a", fp="fp-a", status="full", versions=None):
    return {"id": sid, "name": sid, "desc": "d", "source": "x/y", "source_id": "x",
            "license": "MIT", "license_status": status, "stars": 1, "installs": None,
            "lines": 1, "tokens": 1, "fp": fp, "also_seen": [], "url": "u",
            "versions": versions or []}


def manifest(skills, featured=None):
    return {"generated": "t", "skills": skills, "featured": featured or []}


def test_valid_manifest_passes():
    validate_manifest(manifest([base_skill()], featured=[["a", "a"]]), {"fp-a": "text"})


def test_missing_required_field_fails():
    s = base_skill(); del s["fp"]
    with pytest.raises(ValueError, match="缺少字段"):
        validate_manifest(manifest([s]), {})


def test_duplicate_id_fails():
    with pytest.raises(ValueError, match="重复"):
        validate_manifest(manifest([base_skill(), base_skill()]), {})


def test_full_skill_requires_body():
    with pytest.raises(ValueError, match="缺少正文"):
        validate_manifest(manifest([base_skill(fp="gone")]), {})


def test_degraded_skill_body_not_required():
    validate_manifest(manifest([base_skill(fp="gone", status="degraded")]), {})


def test_version_timepoint_body_required():
    v = {"sha": "abc123", "date": "2025-01-01", "fp": "nope", "lines": 1, "tags": []}
    with pytest.raises(ValueError, match="版本正文缺失"):
        validate_manifest(manifest([base_skill(versions=[v])]), {"fp-a": "x"})


def test_featured_unknown_reference_fails():
    with pytest.raises(ValueError, match="未知 skill"):
        validate_manifest(manifest([base_skill()], featured=[["a", "ghost"]]), {})


def test_empty_skills_fails():
    with pytest.raises(ValueError, match="没有任何"):
        validate_manifest(manifest([]), {})
