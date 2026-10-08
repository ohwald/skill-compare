"""无头浏览器 e2e — spec #21 验收门槛(ADR-0001 第 4 条)。

- 时间轴双柄拖动后 A/B 时间点变化;快捷范围点击生效
- 控制台零错误;页面无 data-mode="cmp" 等双槽残留
- 版本下拉选点 / 碰撞钳制;章节角标 + 自动展开 + 手风琴同步

CI(ci.yml/capture.yml)显式安装 playwright;本地未安装时跳过本文件。
站点夹具见 e2e_fixtures.py(fixtures 构建 + 多版本演示 skill)。
"""
import http.server
import pathlib
import re
import threading
import urllib.parse

import pytest

playwright = pytest.importorskip("playwright")
from playwright.sync_api import expect  # noqa: E402

import e2e_fixtures  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[1]
URL_BASE = "http://127.0.0.1:{port}/?s=" + e2e_fixtures.DEMO_ID


@pytest.fixture(scope="session")
def site_url(tmp_path_factory):
    site = e2e_fixtures.build(tmp_path_factory.mktemp("e2e-site"))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0),
                                          lambda *a, **kw: http.server.SimpleHTTPRequestHandler(
                                              *a, directory=str(site), **kw))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield URL_BASE.format(port=srv.server_address[1])
    srv.shutdown()


@pytest.fixture(scope="session")
def browser():
    with playwright.sync_api.sync_playwright() as p:
        yield p.chromium.launch()


@pytest.fixture
def page(browser, site_url):
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    errors = []
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: errors.append(f"[console.{m.type}] {m.text}") if m.type == "error" else None)
    pg.goto(site_url)
    pg.wait_for_selector(".tl-tick")
    pg.wait_for_selector(".sec-band")
    pg._errors = errors
    yield pg
    assert not errors, f"控制台/页面错误: {errors}"
    ctx.close()


def tick_dates(pg):
    return (pg.locator(".tl-dates .da").inner_text().split(" · ")[0],
            pg.locator(".tl-dates .db").inner_text().split(" · ")[0])


def test_initial_state_defaults(page):
    """默认 A = 最新-1、B = 最新;刻度数 = 时间点数;区间累计 +N −M 正确。"""
    a, b = tick_dates(page)
    assert (a, b) == ("2026-09-30", "2026-10-06")
    assert page.locator(".tl-tick").count() == len(e2e_fixtures.DEMO_VERSIONS)
    mid = page.locator(".tl-dates .mid").inner_text().replace("\n", "")
    assert "+8" in mid and "−1" in mid            # demo 最新一版 change = {added:8, removed:1}
    assert page.locator(".vbtn.a .vsum").inner_text().startswith("09-30")
    assert "最新" in page.locator(".vbtn.b .vsum").inner_text()


def test_drag_handle_changes_points(page):
    """双柄拖动:基线柄拖向左侧后,A 时间点与 URL ra 变化,章节角标随之重算。"""
    before = tick_dates(page)
    box = page.locator(".tl-handle.ha").bounding_box()
    page.mouse.move(box["x"] + 14, box["y"] + 14)
    page.mouse.down()
    for x in range(int(box["x"]) + 14, 420, -30):
        page.mouse.move(x, box["y"] + 14)
    page.mouse.up()
    page.wait_for_timeout(250)
    a, b = tick_dates(page)
    assert a < before[0], f"A 应前移:{before[0]} → {a}"
    assert b == before[1]
    assert re.search(r"ra=\d+", page.url)
    assert page.locator(".vbtn.a .vsum").inner_text().split(" · ")[0] != before[0]


def test_drag_ordering_constraint(page):
    """对比柄不许拖过基线柄:先把 A 拖到最左,B 再硬拖到最左 → B 停在 A 的下一个时间点。"""
    for handle in (".tl-handle.ha", ".tl-handle.hb"):
        box = page.locator(handle).bounding_box()
        page.mouse.move(box["x"] + 14, box["y"] + 14)
        page.mouse.down()
        for x in range(int(box["x"]) + 14, 60, -40):
            page.mouse.move(x, box["y"] + 14)
        page.mouse.up()
        page.wait_for_timeout(250)
    assert tick_dates(page) == ("2026-05-10", "2026-05-12")


def test_quick_range_click(page):
    """快捷范围 30 天:窗口收窄到锚点(B)附近,按钮进入激活态。"""
    stage = page.locator(".tl-stage")
    w0, w1 = stage.get_attribute("data-win-start"), stage.get_attribute("data-win-end")
    page.locator('.tl-quick [data-range="30"]').click()
    page.wait_for_timeout(200)
    n0, n1 = stage.get_attribute("data-win-start"), stage.get_attribute("data-win-end")
    assert (n0, n1) != (w0, w1)
    assert "30" in page.locator(".tl-quick button.on").first.inner_text()
    # 「全部」回到全域
    page.locator('.tl-quick [data-range="all"]').click()
    page.wait_for_timeout(200)
    assert (stage.get_attribute("data-win-start"), stage.get_attribute("data-win-end")) == (w0, w1)


def test_version_dropdown_pick_and_collision(page):
    """版本下拉选点生效;在 A 面板选 B 当前点(最新)被钳到 最新-1。"""
    page.locator(".vbtn.a").click()
    rows = page.locator(".vpanel .vrow")
    expect(rows.first).to_be_visible()
    rows.nth(3).click()                       # 落 tag 组倒序第 4 行 = skill-v0.9.0(2026-05-12)
    page.wait_for_timeout(250)
    assert tick_dates(page)[0] == "2026-05-12"
    page.locator(".vbtn.a").click()
    page.locator(".vpanel .vrow").first.click()   # 最新 = B 当前点 → A 钳到 09-30
    page.wait_for_timeout(250)
    assert tick_dates(page) == ("2026-09-30", "2026-10-06")


def test_section_badges_and_accordion(page):
    """有变更的章节带 +N −M 角标且自动展开;未变更默认折叠;手风琴两侧同步。"""
    bands = page.locator("#diffcol-A .sec-band")
    tips = page.locator('#diffcol-A .sec[data-sec="1 / Tips"]')
    chg = tips.locator(".chg").inner_text().replace("\n", "")
    assert "+2" in chg and "−1" in chg
    assert "changed" in tips.get_attribute("class")
    assert "collapsed" not in tips.get_attribute("class")          # 变更章节自动展开
    overview_a = page.locator('#diffcol-A .sec[data-sec="1 / Overview"]')
    overview_b = page.locator('#diffcol-B .sec[data-sec="1 / Overview"]')
    assert "collapsed" in overview_a.get_attribute("class")        # 未变更默认折叠
    overview_a.locator(".sec-band").click()
    page.wait_for_timeout(150)
    assert "collapsed" not in overview_a.get_attribute("class")    # 两侧同步展开
    assert "collapsed" not in overview_b.get_attribute("class")


def test_scroll_sync(page):
    """左右滚动联动:展开全部章节并压缩列高制造滚动,滚动 A 列 B 列按比例跟随。"""
    page.evaluate("""() => document.querySelectorAll('.sec.collapsed')
        .forEach(s => s.classList.remove('collapsed'))""")
    page.wait_for_timeout(150)
    page.evaluate("""() => {
      const a = document.getElementById('diffcol-A'), b = document.getElementById('diffcol-B');
      a.style.height = b.style.height = '160px';   // 制造可滚动条件
    }""")
    page.wait_for_timeout(100)
    page.evaluate("document.getElementById('diffcol-A').scrollTop = 40")
    page.wait_for_timeout(200)
    sb = page.evaluate("document.getElementById('diffcol-B').scrollTop")
    assert sb > 0, "B 列应随 A 列滚动而联动"


def test_no_dualslot_residue_and_featured(page):
    """页面无 data-mode/swap/模式 tabs/冲突横幅;精选组合为自比对(单 skill)。"""
    html = page.content()
    assert page.locator("[data-mode]").count() == 0
    for banned in ("data-mode", "m=cmp", ".swap", "mode-tabs", "conflict-banner"):
        assert banned not in html, f"双槽残留:{banned}"
    page.locator("[data-lib]").click()
    page.wait_for_selector(".picker .feat")
    feats = page.locator(".picker .feat").count()
    assert feats >= 1
    page.locator(".picker .feat").first.click()
    page.wait_for_timeout(300)
    assert tick_dates(page) == ("2026-09-30", "2026-10-06")        # 自比对默认对


def test_lang_toggle_keeps_state(page):
    """切换语言后时间点选择保持(URL ra/rb 不丢)。"""
    page.locator('.tl-quick [data-range="14"]').click()
    page.wait_for_timeout(150)
    box = page.locator(".tl-handle.ha").bounding_box()
    page.mouse.move(box["x"] + 14, box["y"] + 14)
    page.mouse.down()
    for x in range(int(box["x"]) + 14, 620, -30):
        page.mouse.move(x, box["y"] + 14)
    page.mouse.up()
    page.wait_for_timeout(250)
    url_before = page.url
    page.locator("[data-act='lang-en']").click()
    page.wait_for_timeout(250)
    assert "lang=en" in page.url
    q = urllib.parse.parse_qs(urllib.parse.urlparse(page.url).query)
    qb = urllib.parse.parse_qs(urllib.parse.urlparse(url_before).query)
    assert q.get("ra") == qb.get("ra") and q.get("rb") == qb.get("rb")


def test_single_version_skill_no_timeline(page):
    """单时间点 skill:不渲染时间轴,不报错(fixtures 里的 skill 均为单版本)。"""
    page.locator("[data-lib]").click()
    page.wait_for_selector(".picker .row[data-pick]")
    page.locator(".picker .row[data-pick]").nth(1).click()
    page.wait_for_timeout(400)
    assert page.locator(".tl-tick").count() == 0
    assert page.locator(".vbtn.a .vsum").count() == 1
