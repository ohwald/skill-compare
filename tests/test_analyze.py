from pipeline.analyze import analyze_compat, analyze_context_cost

RAW = """---
name: demo
description: Does things when asked.
license: MIT
disable-model-invocation: true
custom-thing: x
---

# Demo

## Steps
1. First run the tests.
2. Then write code. Never skip red.
- Check everything.

## Philosophy
Prefer small steps, consider trade-offs.
"""
RAW_PORTABLE = RAW.replace("disable-model-invocation: true\n", "").replace("custom-thing: x\n", "")


def test_context_cost_resident_only_counts_name_and_description():
    c = analyze_context_cost(RAW)
    assert c["resident"] > 0
    desc_len = len("description: Does things when asked.")
    assert abs(c["resident"] - (len("name: demo") + desc_len + 3) // 4) <= 2


def test_context_cost_trigger_counts_body_not_fm():
    c = analyze_context_cost(RAW)
    body = RAW.split("---", 2)[2]
    assert c["trigger"] >= len(body) // 4
    assert c["trigger"] > c["resident"]


def test_context_cost_counts_aux_files(tmp_path):
    (tmp_path / "scripts").mkdir()
    (tmp_path / "scripts" / "run.py").write_text("x")
    (tmp_path / "reference.md").write_text("y")
    (tmp_path / "SKILL.md").write_text("z")
    (tmp_path / ".hidden").write_text("q")
    c = analyze_context_cost("---\\nname: x\\n---\\nbody", skill_dir=tmp_path)
    assert c["files"] == 2            # 脚本+参考文档;SKILL.md 与隐藏文件不计


def test_compat_detects_claude_code_binding():
    c = analyze_compat({"name": "d", "disable-model-invocation": "true", "custom-thing": "x"}, RAW)
    assert c["binding"] == "claude-code"
    assert c["harness_fields"] == ["Claude Code"]
    assert c["unknown_fields"] == ["custom-thing"]


def test_compat_portable_when_only_spec_fields():
    c = analyze_compat({"name": "d", "description": "x", "license": "MIT"}, RAW_PORTABLE)
    assert c["binding"] == "portable" and c["harness_fields"] == []


def test_style_procedural_vs_principled():
    proc = analyze_compat({"name": "d", "description": "x"}, RAW)
    assert proc["style"] == "procedural"   # 步骤+祈使密集
    prin_body = "Prefer small steps. Consider trade-offs. Generally balance the two. Ideally aim for clarity. When in doubt, keep it simple."
    prin = analyze_compat({"name": "d", "description": "x"}, "---\\nname: d\\n---\\n" + prin_body)
    assert prin["style"] == "principled"


def test_style_mixed_when_sparse():
    c = analyze_compat({"name": "d", "description": "x"}, "---\\nname: d\\n---\\nJust a title.\\n")
    assert c["style"] == "mixed"
