"""Skill 适配度与上下文成本的静态分析。

两个公开指标(全部为**静态估算**,非模型实测):
- context_cost:常驻 token(FM name+description,渐进披露的常驻部分)+ 触发 token(正文)+ 附属文件数
- compat:harness 绑定(专属 frontmatter 字段)+ 指令风格倾向(流程型 ⇄ 原则型)
"""

import os
import re

# Claude Code 等特定 harness 的私有 frontmatter 字段(agentskills.io 规范之外)。
HARNESS_FIELDS = {
    "disable-model-invocation": "Claude Code",
    "argument-hint": "Claude Code",
    "allowed-tools": "Claude Code(实验性)",
    "user-invocable": "Claude Code",
    "model": "Claude Code",
    "context": "Claude Code",
    "agent": "Claude Code",
    "requires": "第三方集成声明",
}

# 官方规范:name+description 必填、无 license 降级;这些字段出现即视为「规范内」。
SPEC_FIELDS = {"name", "description", "license", "compatibility", "metadata"}

PROC = re.compile(
    r"^\s*(?:\d+[.)]|[-*+])\s+", re.M)                 # 有序/无序步骤项
IMPER = re.compile(
    r"\b(?:never|always|must|do not|don't|avoid|before you|first|then|stop|check|ensure|run|write|test)\b", re.I)
PRIN = re.compile(
    r"\b(?:prefer|consider|aim|balance|in general|generally|ideally|typically|when in doubt)\b", re.I)


def _tokens(text):
    return max(1, (len(text or "") + 3) // 4)


def analyze_context_cost(raw_text, skill_dir=None):
    """context_cost:resident(常驻 FM)+ trigger(正文)+ files(附属文件计数)。"""
    m = re.match(r"\A---\s*\n(.*?)\n---\s*\n?", raw_text, re.S)
    fm_block = m.group(1) if m else ""
    body = raw_text[m.end():] if m else raw_text
    resident = 0
    for line in fm_block.splitlines():
        key = line.split(":", 1)[0].strip().lower()
        if key in ("name", "description"):
            resident += _tokens(line)
    files = 0
    if skill_dir and os.path.isdir(skill_dir):
        for root, _dirs, fs in os.walk(skill_dir):
            for f in fs:
                if f != "SKILL.md" and not f.startswith("."):
                    files += 1
    return {
        "resident": resident,
        "trigger": _tokens(body),
        "files": files,
    }


def analyze_compat(meta, body):
    """compat:harness 绑定 + 风格倾向(启发式,阈值判定)。

    binding: portable(纯规范字段)/ claude-code(出现其专属字段)
    style:   procedural(步骤祈使为主)/ principled(权衡表述为主)/ mixed
    """
    harness = sorted({HARNESS_FIELDS[k] for k in meta if k in HARNESS_FIELDS})
    binding = "claude-code" if harness else "portable"
    steps = len(PROC.findall(body))
    imper = len(IMPER.findall(body))
    prin = len(PRIN.findall(body))
    proc_score = min(steps, 40) + imper          # 步骤项截断,防止长文档 bullet 淹没信号
    prin_score = prin * 3                        # 原则表述是更强的风格信号
    if proc_score + prin_score < 10:
        style = "mixed"
    elif prin_score >= 12 and prin_score >= proc_score:
        style = "principled"      # 原则表述既要密(≥4 处)又要占优
    else:
        style = "procedural"      # 生态现实:指令式为主,含混合
    if proc_score + prin_score < 10:
        style = "mixed"
    unknown = sorted(k for k in meta if k not in SPEC_FIELDS and k not in HARNESS_FIELDS)
    return {
        "binding": binding,
        "harness_fields": harness,
        "style": style,
        "unknown_fields": unknown,
    }
