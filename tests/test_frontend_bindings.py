"""前端绑定守卫:template/*.js 渲染出的交互属性(data-*)必须被选中或读取。

防的是"渲染了但没绑定"的死 UI——2026-10-06 feat/timeline-enhanced-v2(83ce9f4)渲染了
快捷范围按钮(data-range)与刻度点(data-dot),但没有任何事件处理器,CI 的
node --check 只查语法,全绿上线。

附带源级残留守卫:ADR-0001 废弃的双槽词汇不得回到模板源码。
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "template"
JS_FILES = sorted(TEMPLATE.glob("*.js"))
INDEX_HTML = TEMPLATE / "index.html"

# 有意不绑定的属性写在这里(裸名,不带 data- 前缀)并注明理由;除此之外一律视为事故
ALLOWED_UNBOUND = {
    "stop": "picker/vpanel 面板的静态标记,无交互意图",
}

# ADR-0001 已废弃的双槽词汇(模板源码层面拦截;词汇表见 CONTEXT.md)。
# 词边界匹配,避免误伤 setModel 之类的合法标识符。
BANNED_RESIDUE = [r"data-mode", r"\bsetMode\b", r"mode-tabs", r"conflict-banner",
                  r"\bswap\b", r"m=cmp"]


def test_template_js_inventory():
    """扫描目标存在:app.js 与 timeline.js 都在守卫范围内。"""
    names = {f.name for f in JS_FILES}
    assert {"app.js", "timeline.js"} <= names, f"template/*.js 应含 {names}"


def test_every_rendered_data_attr_is_bound():
    for js in JS_FILES:
        src = js.read_text(encoding="utf-8")
        css = INDEX_HTML.read_text(encoding="utf-8")
        names = sorted(set(re.findall(r"data-([a-z][a-z0-9-]*)", src)))
        assert names, f"{js.name} 里应当存在 data-* 交互属性,扫描为空说明正则失效"

        unbound = []
        for name in names:
            attr = f"data-{name}"
            bound = (
                re.search(rf"\[{re.escape(attr)}[\]=]", src)        # JS 选择器 [data-foo]
                or f'getAttribute("{attr}")' in src                 # 显式读取
                or f'setAttribute("{attr}"' in src                  # CSS 钩子写入(如 data-theme)
                or f'"{attr}="' in src                              # 模板字符串选择器 [data-dot="i"]
                or re.search(rf"\[{re.escape(attr)}[\]=]", css)     # 模板 CSS 引用(如 data-side)
            )
            if not bound and name not in ALLOWED_UNBOUND:
                unbound.append(f"{js.name}:{attr}")

        assert not unbound, (
            "渲染了但从未绑定的交互属性,点击/输入将无响应: "
            + ", ".join(unbound)
            + " —— 在事件绑定里补处理器,或列入 ALLOWED_UNBOUND 并写明理由"
        )


def test_no_dualslot_residue_in_template_sources():
    """双槽时代的词汇不得回到模板源(app.js / timeline.js / index.html)。"""
    for f in [*JS_FILES, INDEX_HTML]:
        src = f.read_text(encoding="utf-8")
        hits = [w for w in BANNED_RESIDUE if re.search(w, src)]
        assert not hits, f"{f.name} 含已废弃的双槽词汇:{hits}(ADR-0001)"
    # 源码层面:不得再出现 state.a / state.b 形态的双槽状态
    app = (TEMPLATE / "app.js").read_text(encoding="utf-8")
    assert not re.search(r"\bstate\.a\b|\bstate\.b\b", app), "app.js 不得使用 state.a/state.b 双槽状态"
