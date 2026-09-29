from pipeline.parse import classify_license, parse_frontmatter


def test_parses_flat_frontmatter():
    meta, body = parse_frontmatter('---\nname: pdf\ndescription: "Handle PDFs"\nlicense: MIT\n---\n\n# Body\n')
    assert meta == {"name": "pdf", "description": "Handle PDFs", "license": "MIT"}
    assert body.strip() == "# Body"


def test_no_frontmatter_returns_original_text():
    text = "# Just markdown\nwith lines\n"
    meta, body = parse_frontmatter(text)
    assert meta == {} and body == text


def test_malformed_lines_are_skipped_not_fatal():
    text = "---\nname: ok\nthis line has no colon\n  nested: value\n- item\n---\nBody\n"
    meta, body = parse_frontmatter(text)
    assert meta["name"] == "ok"          # 合法行保留
    assert "nested" in meta              # 缩进行剥掉缩进后仍解析
    assert body.strip() == "Body"


def test_unknown_fields_are_preserved():
    meta, _ = parse_frontmatter("---\nname: x\ndisable-model-invocation: true\nweird_field: y\n---\n")
    assert meta["disable-model-invocation"] == "true" and meta["weird_field"] == "y"


def test_classify_lenient_licenses():
    for lic in ("MIT", "Apache-2.0", "BSD-3-Clause", "ISC"):
        assert classify_license(lic, "")[0] == "full"


def test_classify_proprietary_and_undisclosed():
    assert classify_license("Proprietary. LICENSE.txt has complete terms", "")[0] == "degraded"
    assert classify_license("", "") == ("degraded", "undisclosed")


def test_classify_license_txt_fallback():
    # fm 写「见 LICENSE.txt」:目录内 LICENSE 文本决定宽松与否
    assert classify_license("Complete terms in LICENSE.txt", "MIT License\n") == ("full", "Complete terms in LICENSE.txt")
    assert classify_license("Complete terms in LICENSE.txt", "All rights reserved.\n")[0] == "degraded"


def test_classify_repo_license_fallback():
    assert classify_license("", "Apache License Version 2.0")[0] == "full"
