"use strict";
/* Skill History v2 — 单库历史对比(spec #21 / ADR-0001)。
 * 唯一交互模型:选 skill → 时间轴选两个时间点 → 并排 diff。
 * 无双槽、无模式切换、无跨 skill 对比(旧 slot/mode 代码路径已整体移除,
 * 残留由 tests/test_frontend_bindings.py 源级守卫拦截)。
 */
const INLINE = JSON.parse(document.getElementById("manifest").textContent);
let MANIFEST = INLINE;
let fullReady = INLINE.lite
  ? fetch("manifest.json").then(r => r.json()).then(full => {
      const byId = Object.fromEntries(full.skills.map(s => [s.id, s]));
      for (const s of INLINE.skills) { const f = byId[s.id]; if (f) {
        s.versions = f.versions; s.files = f.files; s.head = f.head;
        s.rel_path = f.rel_path; s.url = f.url; s.category = f.category; } }
      MANIFEST = full; render();
    })
  : Promise.resolve();
const BY = () => Object.fromEntries(MANIFEST.skills.map(s => [s.id, s]));

const I18N = {
  zh:{search:"搜索 skill…",featured:"✨ 精选组合",all:"全部 skill",empty:"没有匹配的 skill",
      lock:"专有许可 · 不转载原文",view:"查看原文 ↗",
      count:n=>`共 ${n} 个时间点`,full:"全文可比",deg:"专有 · 仅摘要",latest:"最新",
      viewSec:"结构对比",viewRaw:"原文 diff",lines:"行",
      namesakeOf:"同名 · 来自",resident:"常驻",trigger:"触发",
      est:"静态估算,非实测",bindCC:"绑定 Claude Code",bindPort:"跨 harness 通用",
      styleProc:"流程型",stylePrin:"原则型",styleMix:"混合型",
      popular:"🔥 热门",hint:"拖动双柄或点击刻度选择基线/对比时间点 · 滚轮缩放 · 空白处拖动平移",
      sideA:"基线",sideB:"对比",tagGroup:"落 tag",commitGroup:"普通提交",singleTp:"仅一个时间点",
      absent:"该时间点无此章节",tlQuick:"快捷",tlAll:"全部",tlDays:"天",tlNoPrev:"—",
      mmLabel:"变更缩略图",
      tlHandleA:"基线时间点",tlHandleB:"对比时间点"},
  en:{search:"Search skills…",featured:"✨ Featured pairs",all:"All skills",empty:"No matching skills",
      lock:"Proprietary license · original text not reproduced",view:"View source ↗",
      count:n=>`${n} timepoints`,full:"Full text",deg:"Proprietary · summary",latest:"Latest",
      viewSec:"Structure",viewRaw:"Raw diff",lines:"lines",
      namesakeOf:"namesake · from",resident:"Resident",trigger:"Trigger",
      est:"static estimate, not measured",bindCC:"Claude Code bound",bindPort:"Harness-portable",
      styleProc:"Procedural",stylePrin:"Principled",styleMix:"Mixed",
      popular:"🔥 Popular",hint:"Drag the dual handles or click a tick to pick baseline/compare · wheel to zoom · drag empty space to pan",
      sideA:"Baseline",sideB:"Compare",tagGroup:"Tagged",commitGroup:"Commits",singleTp:"single timepoint",
      absent:"absent at this timepoint",tlQuick:"Quick",tlAll:"All",tlDays:"d",tlNoPrev:"—",
      mmLabel:"change overview",
      tlHandleA:"Baseline timepoint",tlHandleB:"Compare timepoint"}
};
const THEMES = [{"id": "tokyo-night", "label": "Tokyo Night"}, {"id": "catppuccin-mocha", "label": "Catppuccin Mocha"}, {"id": "one-dark-pro", "label": "One Dark Pro"}, {"id": "github-light", "label": "GitHub Light"}, {"id": "one-light", "label": "One Light"}, {"id": "solarized-light", "label": "Solarized Light"}];

const q = new URLSearchParams(location.search);
function defaultSkillId() {
  const multi = MANIFEST.skills.find(s => (s.versions_count || (s.versions || []).length || 0) >= 2);
  return ((multi || MANIFEST.skills[0]) || {}).id || "";
}
/* 旧链接兼容:?a=<id> 曾是双槽左侧,静默映射到 ?s= */
const state = {
  sk: q.get("s") || q.get("a") || defaultSkillId(),
  ia: 0, ib: 0,               // 由 selRefs() 惰性解析(_refsFor 防重复)
  _refsFor: null,
  _ra: parseInt(q.get("ra"), 10), _rb: parseInt(q.get("rb"), 10),
  lang: localStorage.getItem("lang") || "zh",
  theme: q.get("theme") || localStorage.getItem("theme") || "tokyo-night",
  view: q.get("v") === "raw" ? "raw" : "sections",
  picker: null,                // "lib" | "A" | "B"
  query: "", tagFilter: null
};
const t = k => { const v = I18N[state.lang][k]; return typeof v === "function" ? v(0) : v; };
const tf = (k, ...args) => { const v = I18N[state.lang][k]; return typeof v === "function" ? v(...args) : v; };

function skill() { return BY()[state.sk] || null; }
function versionsOf(s) { return (s && s.versions) || []; }
function selRefs() {
  /* 惰性解析:首个带版本数据的渲染才落地(初始 INLINE 是 lite,无 versions,
   * fetch 升级后重解析);默认基线 = 最新-1,对比 = 最新。 */
  if (state._refsFor === state.sk) return;
  const vs = versionsOf(skill());
  const n = vs.length;
  if (!n) { state.ia = state.ib = 0; return; }   // 数据未到,等下一次渲染
  let ia = Number.isInteger(state._ra) ? Math.max(0, Math.min(state._ra, n - 1)) : Math.max(0, n - 2);
  let ib = Number.isInteger(state._rb) ? Math.max(0, Math.min(state._rb, n - 1)) : n - 1;
  if (n >= 2 && ia === ib) ia = Math.max(0, ib - 1);
  state.ia = ia; state.ib = ib;
  state._refsFor = state.sk;
  state._ra = state._rb = null;
}
function syncURL() {
  const p = new URLSearchParams({s: state.sk, lang: state.lang, theme: state.theme});
  const n = versionsOf(skill()).length;
  if (n >= 2) { p.set("ra", state.ia); p.set("rb", state.ib); }
  if (state.view === "raw") p.set("v", "raw");
  history.replaceState(null, "", "?" + p.toString());
}
function selectSkill(id) {
  state.sk = id; state._ra = state._rb = null;
  state._refsFor = null;               // 重新解析为 最新-1 / 最新
  state.picker = null; state.query = "";
  selRefs(); syncURL(); render();
}
function setTime(side, idx) {
  const n = versionsOf(skill()).length;
  if (n < 2) return;
  /* 基线必须早于对比:越界选择钳到另一侧的紧邻位 */
  if (side === "A") state.ia = Math.min(Math.max(0, idx), state.ib - 1);
  else state.ib = Math.max(Math.min(n - 1, idx), state.ia + 1);
  state.picker = null;
  syncURL(); render();
}
function setLang(l) { state.lang = l; localStorage.setItem("lang", l); syncURL(); render(); }
function setTheme(th) { state.theme = th; localStorage.setItem("theme", th);
  document.documentElement.setAttribute("data-theme", th); syncURL(); }
function setView(v) { state.view = v; syncURL(); render(); }

const IC = {
  logo:'<path d="M13 5h6M13 9h6M6 15h6M6 19h6"/><circle cx="6" cy="7" r="2"/><circle cx="18" cy="17" r="2"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  chev:'<path d="m6 9 6 6 6-6"/>',
  gh:'<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  lock:'<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  spark:'<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L21 12z"/>',
  hist:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  check:'<path d="M20 6 9 17l-5-5"/>', arrowr:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  coins:'<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>'
};
function icon(name, s, fill) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${fill || "currentColor"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none">${IC[name] || ""}</svg>`;
}
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
function fmt(n) { return n == null ? "—" : (n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(n)); }
function licBadge(lic) {
  return lic === "full" ? "" : `<span class="lic-badge deg">${esc(t("deg"))}</span>`;
}
function costChip(s) {
  const cc = s.context_cost; if (!cc) return "";
  return `<span class="costchip" title="${esc(t("est"))}">${icon("coins", 11, "var(--dim)")}${t("resident")} ~${fmt(cc.resident)} · ${t("trigger")} ~${fmt(cc.trigger)} tok</span>`;
}
function compatChip(s) {
  const c = s.compat; if (!c) return "";
  const bind = c.binding === "claude-code"
    ? `<span class="bindchip cc" title="${esc((c.harness_fields || []).join(", "))}">${esc(t("bindCC"))}</span>`
    : `<span class="bindchip port">${esc(t("bindPort"))}</span>`;
  const sk = {procedural: "styleProc", principled: "stylePrin", mixed: "styleMix"}[c.style] || "styleMix";
  return `${bind}<span class="stylechip">${esc(t(sk))}</span>`;
}

/* ── 控制台:库选择器 + 两个版本下拉(单行紧凑,全部定顶) ── */
function tpLabel(vs, i) {
  const v = vs[i];
  if (!v) return "—";
  return v.date.slice(5) + " · " + String(v.sha).slice(0, 7) + (i === vs.length - 1 ? " · " + t("latest") : "");
}
function tagChipHtml(v) {
  if (!v.tags || !v.tags.length) return "";
  const name = v.tags.find(x => /^skill-|^v/.test(x)) || v.tags[0];
  const extra = v.tags.length > 1 ? "+" + (v.tags.length - 1) : "";
  return `<span class="vt">${esc(name + extra)}</span>`;
}
function libSlotEl() {
  const s = skill();
  const open = state.picker === "lib";
  const warn = s && s.license_status === "degraded" ? `<span class="warn">${esc(t("deg"))}</span>` : "";
  const inner = open
    ? `${icon("search", 15, "var(--blue)")}<input id="picker-input" placeholder="${esc(t("search"))}" autocomplete="off">`
    : `<span class="name">${esc(s ? s.name : "—")}</span>${warn}<span class="spacer"></span>
       <span class="vcount">${s ? tf("count", versionsOf(s).length || s.versions_count || 1) : ""}</span>${icon("chev", 16, "var(--blue)")}`;
  return `<div class="libslot" data-lib>${inner}${open ? libPickerEl() : ""}</div>`;
}
function vbtnEl(side) {
  const s = skill();
  const vs = versionsOf(s);
  const i = side === "A" ? state.ia : state.ib;
  const open = state.picker === side;
  const label = vs.length ? tpLabel(vs, i) : t("singleTp");
  return `<div class="vbtn ${side.toLowerCase()}${open ? " open" : ""}" data-vbtn="${side}">
    <span class="badge">${side}</span>
    ${vs.length ? tagChipHtml(vs[i]) : ""}
    <span class="vsum">${esc(label)}</span><span class="spacer"></span>${icon("chev", 15, "var(--dim)")}
    ${open ? vpanelEl(side, vs) : ""}</div>`;
}
function vrowHtml(side, vs, i, cur) {
  const v = vs[i];
  const chg = v.change
    ? `<span class="chg"><b class="up">+${v.change.added}</b><b class="dn">−${v.change.removed}</b></span>`
    : `<span class="chg dimchg">${esc(t("tlNoPrev"))}</span>`;
  return `<div class="vrow${i === cur ? " cur" : ""}" data-vpick="${i}">
    ${tagChipHtml(v) || '<span class="vdot"></span>'}
    <span class="vd">${esc(v.date)} · ${esc(String(v.sha).slice(0, 7))}${i === vs.length - 1 ? " · " + esc(t("latest")) : ""}</span>
    ${chg}<span class="spacer"></span>
    <span class="meta">${v.lines == null ? "" : v.lines + " " + t("lines")}</span>
    ${i === cur ? `<span class="chk">${icon("check", 13, side === "A" ? "var(--blue)" : "var(--purple)")}</span>` : ""}</div>`;
}
function vpanelEl(side, vs) {
  const cur = side === "A" ? state.ia : state.ib;
  const tagged = [], plain = [];
  vs.forEach((v, i) => (v.tags && v.tags.length ? tagged : plain).push(i));
  const groups = [];
  if (tagged.length) groups.push(`<div class="vg-label">${esc(t("tagGroup"))}</div>` +
    tagged.slice().reverse().map(i => vrowHtml(side, vs, i, cur)).join(""));
  groups.push(`<div class="vg-label">${esc(t("commitGroup"))}</div>` +
    plain.slice().reverse().map(i => vrowHtml(side, vs, i, cur)).join(""));
  return `<div class="vpanel" data-stop="1">${groups.join('<div class="divider"></div>')}</div>`;
}

/* ── 库选择面板 ── */
function libPickerEl() {
  const qq = state.query.trim();
  let hits;
  if (!qq) {
    hits = MANIFEST.skills.map(s => ({s, sc: (s.installs || 0) + (s.stars || 0) / 10}))
      .sort((a, b) => b.sc - a.sc).slice(0, 12).map(x => x.s);
  } else {
    const fs = s => {
      const lc = s.name.toLowerCase(), l = qq.toLowerCase();
      if (lc === l) return 100;
      if (lc.startsWith(l)) return 90;
      const i = lc.indexOf(l);
      if (i >= 0) return 70 - Math.min(i, 20);
      if ((s.desc || "").toLowerCase().includes(l)) return 40;
      let k = 0; for (const chr of l) { k = lc.indexOf(chr, k); if (k === -1) return -1; k += 1; }
      return 20;
    };
    hits = MANIFEST.skills.map(s => ({s, sc: fs(s)})).filter(x => x.sc >= 0)
      .sort((a, b) => b.sc - a.sc).map(x => x.s);
  }
  if (state.tagFilter) hits = hits.filter(s => (s.tags || []).includes(state.tagFilter));
  /* 精选组合 = 策展的自比对推荐(同一 skill 的两个版本);跨 skill 组合已随 ADR-0001 废弃 */
  const feats = (MANIFEST.featured || []).filter(p => p[0] === p[1] && BY()[p[0]])
    .map(p => `<div class="feat" data-feat="${esc(p[0])}">${icon("spark", 12, "var(--orange)")}
     <span class="t">${esc((BY()[p[0]] || {}).name)}</span><span class="fmeta">${esc(t("sideA"))} × ${esc(t("sideB"))}</span>
     ${icon("arrowr", 13, "var(--gutter)")}</div>`).join("");
  const allTags = {};
  MANIFEST.skills.forEach(s => (s.tags || []).forEach(tg => allTags[tg] = (allTags[tg] || 0) + 1));
  const tagChips = `<div class="tagsec"><div class="tagrow">
    <button class="tagchip ${!state.tagFilter ? "on" : ""}" data-tag="">${esc(t("all"))}</button>
    ${Object.entries(allTags).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tg, n]) =>
      `<button class="tagchip ${state.tagFilter === tg ? "on" : ""}" data-tag="${esc(tg)}">${esc(tg)} ${n}</button>`).join("")}
  </div></div>`;
  const rows = hits.map(s => {
    const sel = s.id === state.sk;
    let nm = esc(s.name);
    if (qq) {
      const i = s.name.toLowerCase().indexOf(qq.toLowerCase());
      if (i >= 0) nm = esc(s.name.slice(0, i)) + "<b>" + esc(s.name.slice(i, i + qq.length)) + "</b>" + esc(s.name.slice(i + qq.length));
    }
    const conflicts = (s.name_conflicts || []);
    const cfTip = conflicts.map(id => (BY()[id] || {}).source).filter(Boolean).join(" / ");
    return `<div class="row" data-pick="${esc(s.id)}">
      ${sel ? `<span class="selbar"></span>` : ""}
      <span class="nm">${nm}</span>${licBadge(s.license_status)}
      ${conflicts.length ? `<span class="cf" title="${esc(t("namesakeOf") + " " + cfTip)}">⚠ ${esc(cfTip)}</span>` : ""}
      <span class="spacer"></span>
      ${(s.set && s.set.id !== s.source_id) ? `<span class="setchip">${esc(s.set.label)}</span>` : ""}
      <span class="meta">${esc(s.source)}</span>
      <span class="meta">${s.stars == null ? "" : "★" + fmt(s.stars)} ${s.installs == null ? "" : "⬇" + fmt(s.installs)} ${s.lines}${t("lines")}${s.context_cost ? ` · ${t("resident")}~${fmt(s.context_cost.resident)}` : ""}</span>
      ${sel ? icon("check", 13, "var(--blue)") : ""}</div>`;
  }).join("");
  return `<div class="picker" data-stop="1">
    ${tagChips}
    ${feats ? `<div class="sec"><div class="sec-label">${esc(t("featured"))}</div>${feats}</div><div class="divider"></div>` : ""}
    <div class="sec"><div class="sec-label">${esc(qq ? t("all") : t("popular"))} · ${hits.length}${qq ? "" : " / " + MANIFEST.skills.length}</div>
    ${rows || `<div class="empty">${esc(t("empty"))}</div>`}</div></div>`;
}

/* ── 渲染 ── */
let renderSeq = 0, monacoEd = null;
const app = document.getElementById("app");
function topbar() {
  const opts = THEMES.map(th => `<option value="${th.id}" ${th.id === state.theme ? "selected" : ""}>${esc(th.label)}</option>`).join("");
  return `<div class="topbar">
    <div class="brand">${icon("logo", 17, "var(--blue)")}<span class="bn">Skill History</span></div>
    <div class="topright">
      <div class="lang">
        <button class="${state.lang === "zh" ? "on" : ""}" data-act="lang-zh">中文</button>
        <button class="${state.lang === "en" ? "on" : ""}" data-act="lang-en">EN</button>
      </div>
      <select class="theme-sel" data-act="theme">${opts}</select>
      <a href="https://github.com/ohwald/skill-history" target="_blank" rel="noopener">${icon("gh", 17, "var(--dim)")}</a>
    </div></div>`;
}
function consoleEl() {
  return `<div class="console">${libSlotEl()}${vbtnEl("A")}${vbtnEl("B")}</div>`;
}
function timelineEl() {
  const s = skill();
  const vs = versionsOf(s);
  if (!vs.length || vs.length < 2) return "";
  return `<div class="tlwrap"><div id="timeline"></div>
    <div class="tlhint">${esc(t("hint"))}</div></div>`;
}
function render() {
  renderSeq++;
  selRefs();
  document.documentElement.setAttribute("data-theme", state.theme);
  document.documentElement.lang = state.lang === "zh" ? "zh" : "en";
  document.body.className = "view-" + state.view;
  const s = skill();
  let heads = "", inner = "";
  if (!s) {
    inner = `<div class="diffbody"></div>`;
  } else {
    const vs = versionsOf(s);
    const nmA = `${esc(tpLabel(vs, state.ia))}`;
    const nmB = `${esc(tpLabel(vs, state.ib))}`;
    heads = `<div class="colheads">` +
      colhead("A", nmA, licBadge(s.license_status) + costChip(s) + compatChip(s)) +
      colhead("B", nmB, "") + `</div>`;
    if (s.license_status === "full" && vs.length)
      inner = viewbar() + `<div class="diffbody"><div class="loading" style="width:100%">…</div></div>`;
    else
      inner = `<div class="diffbody">${degradedPane(s)}</div>`;
  }
  app.innerHTML = topbar() + consoleEl() + timelineEl() +
    `<div class="hero-wrap"><div class="hero">${heads}${inner}</div></div>`;
  bind();
  mountTimeline();
  mountContent();
}
function colhead(side, labelHtml, metaHtml) {
  const color = side === "A" ? "var(--blue)" : "var(--purple)";
  return `<div class="colhead" data-side="${side}"><div class="accent ${side === "A" ? "a" : "b"}"></div>
    <div class="in"><span class="dot" style="background:${color}"></span>
    <span class="nm">${labelHtml}</span>
    ${metaHtml || ""}</div></div>`;
}
function degradedPane(s) {
  return `<div class="lockcol"><div class="circle">${icon("lock", 20, "var(--orange)")}</div>
     <div class="note">${esc(t("lock"))}</div>
     <button class="ghost" data-src="${esc(s.url)}">${esc(t("view"))}</button></div>`;
}
function viewbar() {
  return `<div class="viewbar">
    <div class="vtoggle">
      <button class="${state.view === "sections" ? "on" : ""}" data-view="sections">${esc(t("viewSec"))}</button>
      <button class="${state.view === "raw" ? "on" : ""}" data-view="raw">${esc(t("viewRaw"))}</button>
    </div></div>`;
}

/* ── 时间轴(独立组件,见 timeline.js) ── */
function mountTimeline() {
  const el = document.getElementById("timeline");
  const vs = versionsOf(skill());
  if (!el || vs.length < 2) return;
  SkillTimeline.mount(el, {
    versions: vs, ia: state.ia, ib: state.ib,
    onChange(a, b) { state.ia = a; state.ib = b; syncURL(); render(); },
    labels: {quick: t("tlQuick"), all: t("tlAll"), days: t("tlDays"), latest: t("latest"),
             noPrev: t("tlNoPrev"), singleTp: t("singleTp"),
             handleA: t("tlHandleA"), handleB: t("tlHandleB")}
  });
}

/* ── 正文加载与 diff ── */
const bodyCache = new Map();
  let bodiesMap = null;
  function fetchBody(fp) {
    if (!fp) return Promise.resolve("");
    if (bodyCache.has(fp)) return bodyCache.get(fp);
    let p;
    if (bodiesMap) {
      const url = bodiesMap[fp];
      p = url ? fetch(url).then(r => r.ok ? r.text() : "") : Promise.resolve("");
    } else {
      p = fetch("bodies/" + fp + ".md").then(r => {
        if (r.status === 404) {
          /* bodies-link 模式:404 → 拉指纹→raw URL 映射再取正文 */
          return fetch("bodies.json").then(m => m.ok ? m.json() : null).then(map => {
            if (!map) return "";
            bodiesMap = map;
            const u = bodiesMap[fp];
            return u ? fetch(u).then(r2 => r2.ok ? r2.text() : "") : "";
          });
        }
        return r.ok ? r.text() : "";
      });
    }
    bodyCache.set(fp, p); return p;
  }
function mountContent() {
  const s = skill();
  const vs = versionsOf(s);
  const va = vs[state.ia], vb = vs[state.ib];
  if (!s || !va || !vb || s.license_status !== "full") return;
  const my = renderSeq;
  Promise.all([fetchBody(va.fp), fetchBody(vb.fp)]).then(([ra, rb]) => {
    if (my !== renderSeq) return;
    if (state.view === "raw") { mountRaw(ra, rb, my); return; }
    mountSections(ra, rb, my);
  });
}

/* 章节切分:按官方 SKILL.md 结构(frontmatter + 标题层级) */
function splitSections(raw) {
  const lines = raw.split("\n");
  const secs = []; let cur = null, inFence = false, fm = false;
  if (lines.length && lines[0].trim() === "---") {
    fm = true; cur = {key: "fm|frontmatter", level: 0, title: "Frontmatter", lvl: "FM", lines: []};
  }
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (fm) {
      if (i > 0 && l.trim() === "---") { secs.push(cur); cur = null; fm = false; continue; }
      if (cur) cur.lines.push(l);
      continue;
    }
    const h = l.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (h && !inFence) {
      if (cur) secs.push(cur);
      cur = {key: h[1].length + "|" + h[2], level: h[1].length, title: h[2], lvl: "H" + h[1].length, lines: [l]};
      continue;
    }
    if (/^\s*(```|~~~)/.test(l)) inFence = !inFence;
    if (!cur) cur = {key: "0|preamble", level: 0, title: state.lang === "zh" ? "(前言)" : "(Preamble)", lvl: "P", lines: []};
    cur.lines.push(l);
  }
  if (cur) secs.push(cur);
  return secs.filter(s => s.lines.some(l => l.trim()));
}
function pairSections(secA, secB) {
  /* 按层级+标题配对,两侧取并集;行级 opcodes 供对齐渲染与缩略图复用 */
  const mapA = new Map(secA.map(s => [s.key, s]));
  const mapB = new Map(secB.map(s => [s.key, s]));
  const order = secA.map(s => s.key).concat(secB.map(s => s.key).filter(k => !mapA.has(k)));
  return order.map(k => {
    const a = mapA.get(k) || null, b = mapB.get(k) || null;
    if (a && b) {
      const ops = diffOpcodes(a.lines, b.lines);
      let added = 0, removed = 0;
      for (const op of ops) {
        if (op.tag === "insert" || op.tag === "replace") added += op.b1 - op.b0;
        if (op.tag === "delete" || op.tag === "replace") removed += op.a1 - op.a0;
      }
      return {key: k, a, b, ops, added, removed};
    }
    const one = a || b;
    return {key: k, a, b, ops: null,
            added: a ? 0 : one.lines.length, removed: a ? one.lines.length : 0};
  });
}
/* 行级 diff:difflib 语义的 opcodes(equal/delete/insert/replace),行按 rstrip 比较
 * (与管线 +N −M 统计口径一致)。先裁公共前后缀,LCS DP + 贪心回溯取匹配链,再由链分段。 */
function diffOpcodes(aLines, bLines) {
  const ra = aLines.map(l => l.replace(/\s+$/, "")), rb = bLines.map(l => l.replace(/\s+$/, ""));
  let lo = 0;
  while (lo < ra.length && lo < rb.length && ra[lo] === rb[lo]) lo++;
  let ha = ra.length, hb = rb.length;
  while (ha > lo && hb > lo && ra[ha - 1] === rb[hb - 1]) { ha--; hb--; }
  const ops = [];
  if (lo) ops.push({tag: "equal", a0: 0, a1: lo, b0: 0, b1: lo});
  const N = ha - lo, M = hb - lo;
  let chain = [];
  if (N > 0 && M > 0) {
    const dp = Array.from({length: N + 1}, () => new Uint32Array(M + 1));
    for (let i = N - 1; i >= 0; i--)
      for (let j = M - 1; j >= 0; j--)
        dp[i][j] = ra[lo + i] === rb[lo + j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    let i = 0, j = 0;
    while (i < N && j < M) {
      if (ra[lo + i] === rb[lo + j]) { chain.push([lo + i, lo + j]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
      else j++;
    }
  }
  let pa = lo, pb = lo;
  const gap = (ea, eb) => {
    const na = ea - pa, nb = eb - pb;
    if (na && nb) ops.push({tag: "replace", a0: pa, a1: ea, b0: pb, b1: eb});
    else if (na) ops.push({tag: "delete", a0: pa, a1: ea, b0: pb, b1: pb});
    else if (nb) ops.push({tag: "insert", a0: pa, a1: pa, b0: pb, b1: eb});
    pa = ea; pb = eb;
  };
  for (const [ai, bj] of chain) {
    gap(ai, bj);
    ops.push({tag: "equal", a0: ai, a1: ai + 1, b0: bj, b1: bj + 1});
    pa = ai + 1; pb = bj + 1;
  }
  gap(ha, hb);
  const merged = [];
  for (const op of ops) {
    const last = merged[merged.length - 1];
    if (last && last.tag === op.tag && last.a1 === op.a0 && last.b1 === op.b0) {
      last.a1 = op.a1; last.b1 = op.b1;
    } else merged.push(op);
  }
  return merged;
}
/* 行内词级 diff:token(空白/非空白段)LCS,差异段包 <b class="hl">;
 * 行过长(token>160)退化为整行底色,避免 O(n·m) 放大。 */
function wordDiff(oldLine, newLine) {
  const plain = {a: esc(oldLine) || " ", b: esc(newLine) || " "};
  const ta = oldLine.match(/\s+|\S+/g) || [], tb = newLine.match(/\s+|\S+/g) || [];
  if (!ta.length || !tb.length || ta.length > 160 || tb.length > 160) return plain;
  const N = ta.length, M = tb.length;
  const dp = Array.from({length: N + 1}, () => new Uint16Array(M + 1));
  for (let i = N - 1; i >= 0; i--)
    for (let j = M - 1; j >= 0; j--)
      dp[i][j] = ta[i] === tb[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  let ca = "", cb = "", i = 0, j = 0;
  const put = (s, tok, hl) => s + (hl ? `<b class="hl">${esc(tok)}</b>` : esc(tok));
  while (i < N && j < M) {
    if (ta[i] === tb[j]) { ca = put(ca, ta[i], false); cb = put(cb, tb[j], false); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ca = put(ca, ta[i], true); i++; }
    else { cb = put(cb, tb[j], true); j++; }
  }
  while (i < N) { ca = put(ca, ta[i], true); i++; }
  while (j < M) { cb = put(cb, tb[j], true); j++; }
  return {a: ca || " ", b: cb || " "};
}
/* 单侧行渲染:与对侧逐行对齐 —— 删除/新增在对侧留 .gap 占位行(行号灰显),
 * replace 行配对做行内高亮;整节缺失侧渲染一行说明 + 占位。 */
function rowsForSide(pair, side) {
  const out = [];
  const row = (cls, gno, gdim, html) => out.push(
    `<div class="dr${cls}">${gno == null ? `<span class="g"></span>` :
      `<span class="g${gdim ? " gg" : ""}">${gno}</span>`}<span class="t">${html}</span></div>`);
  const el = l => esc(l) || " ";
  const {a, b, ops} = pair;
  if (!ops) {
    const src = side === "A" ? a : b;
    if (!src) {
      const other = side === "A" ? b : a;
      out.push(`<div class="dr absent">${esc(t("absent"))}</div>`);
      for (let i = 1; i < other.lines.length; i++) row(" gap", i + 1, true, " ");
    } else {
      const cls = side === "A" ? " mod-a" : " mod-b";
      src.lines.forEach((l, i) => row(cls, i + 1, false, el(l)));
    }
    return out;
  }
  for (const op of ops) {
    if (op.tag === "equal") {
      const n = op.a1 - op.a0;
      for (let k = 0; k < n; k++) {
        const li = side === "A" ? a.lines[op.a0 + k] : b.lines[op.b0 + k];
        row("", (side === "A" ? op.a0 : op.b0) + k + 1, false, el(li));
      }
    } else {
      const nA = op.a1 - op.a0, nB = op.b1 - op.b0, paired = Math.min(nA, nB);
      for (let k = 0; k < Math.max(nA, nB); k++) {
        if (k < paired) {
          const w = wordDiff(a.lines[op.a0 + k], b.lines[op.b0 + k]);
          if (side === "A") row(" mod-a", op.a0 + k + 1, false, w.a);
          else row(" mod-b", op.b0 + k + 1, false, w.b);
        } else if (k < nA) {          /* replace 里多出的旧行 */
          if (side === "A") row(" mod-a", op.a0 + k + 1, false, el(a.lines[op.a0 + k]));
          else row(" gap", op.a0 + k + 1, true, " ");
        } else {                       /* replace 里多出的新行 */
          if (side === "A") row(" gap", op.b0 + k + 1, true, " ");
          else row(" mod-b", op.b0 + k + 1, false, el(b.lines[op.b0 + k]));
        }
      }
    }
  }
  return out;
}
/* 变更缩略条:标记直接取自渲染后的变更行(mod-a 左半红 / mod-b 右半绿),
 * 折叠/展开后重算 —— 缩略图反映的是"可见表面",不是文档模型(折叠节不占高)。 */
function mountMinimap(bd, a, b) {
  bd.insertAdjacentHTML("beforeend",
    `<div class="minimap" role="scrollbar" aria-label="${esc(t("mmLabel"))}">
      <div class="mm-marks"></div><div class="mm-view"></div></div>`);
  const mm = bd.querySelector(".minimap");
  const mmMarks = mm.querySelector(".mm-marks");
  const mmView = mm.querySelector(".mm-view");
  const markCol = col => {
    const cr = col.getBoundingClientRect(), sh = col.scrollHeight || 1;
    col.querySelectorAll(".dr.mod-a,.dr.mod-b").forEach(row => {
      if (row.closest(".sec.collapsed")) return;
      const rr = row.getBoundingClientRect();
      const pct = Math.min(99.5, Math.max(0, (rr.top - cr.top + col.scrollTop) / sh * 100));
      const m = document.createElement("div");
      m.className = "mm-mark " + (row.classList.contains("mod-a") ? "del" : "ins");
      m.style.top = pct.toFixed(2) + "%";
      mmMarks.appendChild(m);
    });
  };
  const rebuild = () => { mmMarks.innerHTML = ""; markCol(a); markCol(b); updateView(); };
  const updateView = () => {
    const sh = a.scrollHeight, ch = a.clientHeight;
    if (sh <= ch) { mmView.style.display = "none"; return; }
    mmView.style.display = "";
    mmView.style.top = (a.scrollTop / sh * 100).toFixed(2) + "%";
    mmView.style.height = Math.max(4, ch / sh * 100).toFixed(2) + "%";
  };
  mm.onclick = e => {
    const r = mm.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    a.scrollTop = ratio * ((a.scrollHeight - a.clientHeight) || 1);   // 比例同步带动 B 列
  };
  a.addEventListener("scroll", updateView, {passive: true});
  b.addEventListener("scroll", updateView, {passive: true});
  rebuild();
  return rebuild;
}
function secHtml(side, pair) {
  const changed = pair.added + pair.removed > 0;
  const collapsed = changed ? "" : " collapsed";
  const chgBadge = changed
    ? `<span class="chg"><b class="up">+${pair.added}</b><b class="dn">−${pair.removed}</b></span>` : "";
  const head = pair.a || pair.b;
  const own = side === "A" ? pair.a : pair.b;
  const enc = esc(head.key.replace(/\|/, " / "));
  return `<div class="sec${collapsed}${changed ? " changed" : ""}" data-sec="${enc}">
    <div class="sec-band" data-toggle="${enc}"><span class="tw">${icon("chev", 12, "var(--faint)")}</span>
      <span class="lvl">${head.lvl}</span><span class="st">${esc(head.title)}</span>
      ${chgBadge}
      <span class="cnt">${own ? own.lines.length + " " + t("lines") : "—"}</span></div>
    <div class="sec-body">${rowsForSide(pair, side).join("")}</div></div>`;
}
function mountSections(ra, rb, my) {
  const pairs = pairSections(splitSections(ra), splitSections(rb));
  const bd = document.querySelector(".diffbody");
  if (!bd || my !== renderSeq) return;
  bd.innerHTML = "";
  const a = document.createElement("div"); a.className = "diffcol"; a.id = "diffcol-A"; a.setAttribute("data-side", "A");
  const b = document.createElement("div"); b.className = "diffcol"; b.id = "diffcol-B"; b.setAttribute("data-side", "B");
  pairs.forEach(p => { a.insertAdjacentHTML("beforeend", secHtml("A", p)); b.insertAdjacentHTML("beforeend", secHtml("B", p)); });
  bd.appendChild(a); bd.appendChild(b);
  const rebuildMm = mountMinimap(bd, a, b);
  /* 手风琴:章节为异步加载,绑定须在创建之后;同一章节两侧同步折叠;折叠改变
   * 可见高度,缩略条随之重算 */
  bd.querySelectorAll(".sec-band[data-toggle]").forEach(band => band.onclick = () => {
    const key = band.getAttribute("data-toggle");
    const first = app.querySelector(`.sec[data-sec="${CSS.escape(key)}"]`);
    const collapsing = first && !first.classList.contains("collapsed");
    app.querySelectorAll(`.sec[data-sec="${CSS.escape(key)}"]`).forEach(sec =>
      sec.classList.toggle("collapsed", collapsing));
    rebuildMm();
  });
  attachSync();
}
let syncing = false;
function attachSync() {
  const a = document.getElementById("diffcol-A"), b = document.getElementById("diffcol-B");
  if (!a || !b) return;
  a.onscroll = () => { if (syncing) return; syncing = true;
    b.scrollTop = a.scrollTop / ((a.scrollHeight - a.clientHeight) || 1) * ((b.scrollHeight - b.clientHeight) || 1);
    requestAnimationFrame(() => syncing = false); };
  b.onscroll = () => { if (syncing) return; syncing = true;
    a.scrollTop = b.scrollTop / ((b.scrollHeight - b.clientHeight) || 1) * ((a.scrollHeight - a.clientHeight) || 1);
    requestAnimationFrame(() => syncing = false); };
}
function mountRaw(ra, rb, my) {
  const bd = document.querySelector(".diffbody");
  if (!bd || my !== renderSeq) return;
  bd.innerHTML = `<div id="monaco" style="width:100%"></div>`;
  initMonaco(ra, rb, my);
}
function initMonaco(ta, tb, my) {
  const el = document.getElementById("monaco");
  if (!el || my !== renderSeq) return;
  const fail = () => { if (my !== renderSeq) return;
    el.outerHTML = `<div class="fallback"><pre>${esc(ta)}</pre><pre>${esc(tb)}</pre></div>`; };
  try {
    if (window.require) { init(); return; }
    const sc = document.createElement("script");
    sc.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.min.js";
    sc.onload = () => { require.config({paths:{vs:"https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs"}}); init(); };
    sc.onerror = fail; document.head.appendChild(sc);
    setTimeout(() => { if (!window.monaco && my === renderSeq && !document.querySelector(".monaco-editor")) fail(); }, 5000);
    function init() {
    if (my !== renderSeq || !document.getElementById("monaco")) return;
    require(["vs/editor/editor.main"], () => {
      if (my !== renderSeq || !document.getElementById("monaco")) return;
      if (monacoEd) { try { const ms=[monacoEd.getOriginalModel(),monacoEd.getModifiedModel()]; monacoEd.dispose(); ms.forEach(m=>m&&m.dispose&&m.dispose()); } catch(e){} }
      const mo = monaco.editor.createModel(ta, "markdown"), mm = monaco.editor.createModel(tb, "markdown");
      monacoEd = monaco.editor.createDiffEditor(el, {readOnly:true, originalEditable:false,
        renderSideBySide:true, wordWrap:"on", automaticLayout:true, diffAlgorithm:"advanced", theme:"vs-dark"});
      monacoEd.setModel({original:mo, modified:mm});
    }, fail);
  }
  } catch (e) { fail(); }
}

/* ── 绑定(守卫:渲染出的 data-* 必须在此接线) ── */
function bind() {
  app.querySelectorAll("[data-act]").forEach(el => {
    const act = el.getAttribute("data-act");
    if (act === "lang-zh") el.onclick = () => setLang("zh");
    if (act === "lang-en") el.onclick = () => setLang("en");
    if (act === "theme") { el.value = state.theme; el.onchange = e => setTheme(e.target.value); }
  });
  app.querySelectorAll("[data-view]").forEach(b => b.onclick = () => setView(b.getAttribute("data-view")));
  const lib = app.querySelector("[data-lib]");
  if (lib) {
    lib.onclick = e => { if (e.target.closest(".picker")) return;
      state.picker = state.picker === "lib" ? null : "lib"; state.query = ""; render(); };
    const inp = lib.querySelector("input");
    if (inp) {
      inp.value = state.query; inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
      inp.oninput = () => { state.query = inp.value; render(); };
      inp.onkeydown = e => { if (e.key === "Escape") { state.picker = null; state.query = ""; render(); } };
    }
    const pk = lib.querySelector(".picker");
    if (pk) {
      pk.onclick = e => e.stopPropagation();
      pk.querySelectorAll("[data-pick]").forEach(r => r.onclick = () => selectSkill(r.getAttribute("data-pick")));
      pk.querySelectorAll("[data-tag]").forEach(btn => btn.onclick = () => {
        state.tagFilter = btn.getAttribute("data-tag") || null; render();
        const i2 = app.querySelector("#picker-input"); if (i2) i2.focus();
      });
      pk.querySelectorAll("[data-feat]").forEach(r => r.onclick = () => selectSkill(r.getAttribute("data-feat")));
    }
  }
  app.querySelectorAll("[data-vbtn]").forEach(el => {
    const side = el.getAttribute("data-vbtn");
    el.onclick = e => { if (e.target.closest(".vpanel")) return;
      state.picker = state.picker === side ? null : side; render(); };
    const panel = el.querySelector(".vpanel");
    if (panel) {
      panel.onclick = e => e.stopPropagation();
      panel.querySelectorAll("[data-vpick]").forEach(r => r.onclick = () =>
        setTime(side, parseInt(r.getAttribute("data-vpick"), 10)));
    }
  });
  /* 章节手风琴绑定见 mountSections(章节体异步加载后才存在) */
  document.onclick = e => {
    if (state.picker && !e.target.closest("[data-lib]") && !e.target.closest("[data-vbtn]")) {
      state.picker = null; state.query = ""; render();
    }
  };
  document.onkeydown = e => {
    if (e.key === "Escape" && state.picker) { state.picker = null; state.query = ""; render(); }
  };
  app.querySelectorAll("[data-src]").forEach(b => b.onclick = () => window.open(b.getAttribute("data-src"), "_blank"));
}
document.documentElement.setAttribute("data-theme", state.theme);
document.body.className = "view-" + state.view;
render();
