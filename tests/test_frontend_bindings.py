"""前端绑定守卫:template/app.js 渲染出的交互属性(data-*)必须被选中或读取。

防的是"渲染了但没绑定"的死 UI——2026-10-06 feat/timeline-enhanced-v2(83ce9f4)渲染了
快捷范围按钮(data-range)与刻度点(data-dot),但 bind() 里没有任何处理器,CI 的
node --check 只查语法,全绿上线。
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP_JS = ROOT / "template" / "app.js"
INDEX_HTML = ROOT / "template" / "index.html"

# 有意不绑定的属性写在这里(裸名,不带 data- 前缀)并注明理由;除此之外一律视为事故
ALLOWED_UNBOUND = {
    "stop": "picker 面板的静态标记,无交互意图",
}


def test_every_rendered_data_attr_is_bound():
    src = APP_JS.read_text(encoding="utf-8")
    css = INDEX_HTML.read_text(encoding="utf-8")
    names = sorted(set(re.findall(r"data-([a-z][a-z0-9-]*)", src)))
    assert names, "app.js 里应当存在 data-* 交互属性,扫描结果为空说明正则失效了"

    unbound = []
    for name in names:
        attr = f"data-{name}"
        bound = (
            re.search(rf"\[{re.escape(attr)}[\]=]", src)        # JS 选择器 [data-foo]
            or f'getAttribute("{attr}")' in src                 # 显式读取
            or f'setAttribute("{attr}"' in src                  # CSS 钩子写入(如 data-theme)
            or re.search(rf"\[{re.escape(attr)}[\]=]", css)     # 模板 CSS 引用(如 data-side)
        )
        if not bound and name not in ALLOWED_UNBOUND:
            unbound.append(attr)

    assert not unbound, (
        "渲染了但从未绑定的交互属性,点击/输入将无响应: "
        + ", ".join(unbound)
        + " —— 在 bind() 里补处理器,或列入 ALLOWED_UNBOUND 并写明理由"
    )
