"use strict";
const MANIFEST = JSON.parse(document.getElementById("manifest").textContent);
const BY = Object.fromEntries(MANIFEST.skills.map(s => [s.id, s]));

/* ---------- i18n(UI 文案;skill 内容一律原文) ---------- */
const I18N = {
  zh:{search:"搜索 skill…",featured:"✨ 精选组合",all:"全部 skill",empty:"没有匹配的 skill",
      lock:"专有许可 · 不转载原文",view:"查看原文 ↗",mode:"版本模式",
      count:n=>`共 ${n} 个版本`,hint:"点击时间轴圆点切换 B 侧时间点;A 侧在槽位面板「时间点」区切换;★ 为上游 tag",
      full:"全文可比",deg:"专有 · 仅摘要",latest:"最新",times:"时间点",
      viewSec:"结构对比",viewRaw:"原文 diff",toc:"结构",lines:"行",
      conflictWarn:(name,n)=>`重名提醒:「${name}」还有 ${n} 个同名不同源的版本,同时安装会互相覆盖:`,
      compareNamesake:"对比同名版本",conflict:"重名"},
  en:{search:"Search skills…",featured:"✨ Featured pairs",all:"All skills",empty:"No matching skills",
      lock:"Proprietary license · original text not reproduced",view:"View source ↗",mode:"Version mode",
      count:n=>`${n} versions total`,
      hint:"Click timeline dots to switch side B; switch side A in the slot panel's Time points; ★ marks upstream tags",
      full:"Full text",deg:"Proprietary · summary",latest:"Latest",times:"Time points",
      viewSec:"Structure",viewRaw:"Raw diff",toc:"Structure",lines:"lines",
      conflictWarn:(name,n)=>`Name conflict: "${name}" has ${n} same-named variant(s) from other sources — installing both would collide:`,
      compareNamesake:"Compare namesakes",conflict:"name conflict"},
};
/* ---------- 主题 ---------- */
const THEMES = [{"id": "tokyo-night", "label": "Tokyo Night"}, {"id": "catppuccin-mocha", "label": "Catppuccin Mocha"}, {"id": "one-dark-pro", "label": "One Dark Pro"}, {"id": "github-light", "label": "GitHub Light"}, {"id": "one-light", "label": "One Light"}, {"id": "solarized-light", "label": "Solarized Light"}];
/* ---------- 状态:槽位 = skill @ 时间点 ---------- */
const q = new URLSearchParams(location.search);
const state = {
  a: q.get("a") || (MANIFEST.skills[0] && MANIFEST.skills[0].id) || "",
  b: q.get("b") || (MANIFEST.skills[1] && MANIFEST.skills[1].id) || "",
  refA: q.get("ra") || "latest", refB: q.get("rb") || "latest",
  lang: localStorage.getItem("lang") || "zh",
  theme: q.get("theme") || localStorage.getItem("theme") || "tokyo-night",
  view: q.get("v") === "raw" ? "raw" : "sections",
  picker: null, query: ""
};
const t = k => { const v = I18N[state.lang][k]; return typeof v === "function" ? v(0) : v; };
const tf = (k, ...args) => { const v = I18N[state.lang][k]; return typeof v === "function" ? v(...args) : v; };

function syncURL() {
  const p = new URLSearchParams({a: state.a, b: state.b, lang: state.lang, theme: state.theme});
  if (state.refA !== "latest") p.set("ra", state.refA);
  if (state.refB !== "latest") p.set("rb", state.refB);
  if (state.view === "raw") p.set("v", "raw");
  history.replaceState(null, "", "?" + p.toString());
}
function isVersion() { return state.a && state.a === state.b; }
function skill(id) { return BY[id] || null; }
function slotSkill(side) { return skill(side === "A" ? state.a : state.b); }
function refIdx(s, ref) {
  const n = (s.versions || []).length;
  if (!n) return 0;
  if (ref === "latest") return n - 1;
  const i = parseInt(ref, 10);
  return isNaN(i) ? n - 1 : Math.max(0, Math.min(n - 1, i));
}
function resolveV(side) {
  const s = slotSkill(side); if (!s) return null;
  return (s.versions || [])[refIdx(s, side === "A" ? state.refA : state.refB)] || null;
}
function refLabel(s, ref) {
  if (ref === "latest" || s.versions.length < 2) return "";
  const v = s.versions[refIdx(s, ref)];
  return v.tags && v.tags.length ? "★" + v.tags.join(",") : v.date.slice(5) + " · " + v.sha.slice(0, 6);
}
function setSlot(side, id) {
  const cur = side === "A" ? state.a : state.b;
  if (cur !== id) { if (side === "A") { state.a = id; state.refA = "latest"; } else { state.b = id; state.refB = "latest"; } }
  if (isVersion()) {
    const s = skill(state.a);
    if (refIdx(s, state.refA) === refIdx(s, state.refB)) { state.refA = 0; state.refB = "latest"; }
  }
  syncURL(); render();
}
function setTime(side, ref) {
  if (side === "A") state.refA = ref; else state.refB = ref;
  if (isVersion()) {
    const s = skill(state.a);
    if (refIdx(s, state.refA) === refIdx(s, state.refB)) {
      if (ref === "latest") state.refA = 0; else state.refB = "latest";
    }
  }
  syncURL(); render();
}
function setLang(l) { state.lang = l; localStorage.setItem("lang", l); syncURL(); render(); }
function setTheme(th) { state.theme = th; localStorage.setItem("theme", th);
  document.documentElement.setAttribute("data-theme", th); syncURL(); }
function setView(v) { state.view = v; syncURL(); render(); }

/* ---------- 图标 ---------- */
const IC = {
  logo:'<path d="M13 5h6M13 9h6M6 15h6M6 19h6"/><circle cx="6" cy="7" r="2"/><circle cx="18" cy="17" r="2"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  chev:'<path d="m6 9 6 6 6-6"/>', swap:'<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
  gh:'<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  lock:'<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  spark:'<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L21 12z"/>',
  hist:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  check:'<path d="M20 6 9 17l-5-5"/>', arrowr:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'
};
function icon(name, s, fill) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${fill || "currentColor"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none">${IC[name] || ""}</svg>`;
}
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
function fmt(n) { return n == null ? "—" : (n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(n)); }
function licBadge(lic) {
  const full = lic === "full";
  return `<span class="lic-badge ${full ? "full" : "deg"}">${esc(full ? t("full") : t("deg"))}</span>`;
}
function timeChip(s, ref) {
  const lb = refLabel(s, ref);
  return lb ? `<span class="timechip">${icon("clock", 10, "var(--dim)")}${esc(lb)}</span>` : "";
}

/* ---------- SKILL.md 标准结构分段 ----------
   官方约定:SKILL.md = YAML frontmatter + Markdown 正文(标题层级组织)。
   分段规则:① frontmatter 单独成段;② 正文按 ATX 标题(#+)切节,代码围栏内不切;
   ③ 标题前的前言单独成段。 */
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-").replace(/^-+|-+$/g, "") || "sec";
}
function splitSections(raw) {
  const lines = raw.split("\n");
  const secs = []; let cur = null, inFence = false, fm = false;
  if (lines.length && lines[0].trim() === "---") {
    fm = true; cur = {slug: "frontmatter", level: 0, title: "Frontmatter", lvl: "FM", lines: []};
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
      cur = {slug: slugify(h[2]), level: h[1].length, title: h[2], lvl: "H" + h[1].length, lines: [l]};
      continue;
    }
    if (/^\s*(```|~~~)/.test(l)) inFence = !inFence;
    if (!cur) cur = {slug: "preamble", level: 0, title: state.lang === "zh" ? "(前言)" : "(Preamble)", lvl: "P", lines: []};
    cur.lines.push(l);
  }
  if (cur) secs.push(cur);
  const seen = {};
  for (const s of secs) {
    if (!s.lines.some(l => l.trim())) continue;              // 全空段丢弃
    let k = s.slug;
    while (seen[k]) { k += "-x"; }
    seen[k] = 1; s.slug = k;
  }
  return secs.filter(s => seen[s.slug]);
}
function secHtml(side, sec) {
  const start = sec.start || 0;
  const rows = sec.lines.map((l, j) =>
    `<div class="dr"><span class="g">${start + j + 1}</span><span class="t">${esc(l) || " "}</span></div>`).join("");
  return `<div class="sec" id="sec-${side}-${sec.slug}">
    <div class="sec-band"><span class="lvl">${sec.lvl}</span>
      <span class="st">${esc(sec.title)}</span>
      <span class="cnt">${sec.lines.length} ${t("lines")}</span></div>
    <div class="sec-body">${rows}</div></div>`;
}

/* ---------- 渲染 ---------- */
let renderSeq = 0, monacoEd = null;
const app = document.getElementById("app");
function topbar() {
  const opts = THEMES.map(th => `<option value="${th.id}" ${th.id === state.theme ? "selected" : ""}>${esc(th.label)}</option>`).join("");
  return `<div class="topbar">
    <div class="brand">${icon("logo", 17, "var(--blue)")}<span>Skill Compare</span></div>
    <div class="topright">
      <div class="lang">
        <button class="${state.lang === "zh" ? "on" : ""}" data-act="lang-zh">中文</button>
        <button class="${state.lang === "en" ? "on" : ""}" data-act="lang-en">EN</button>
      </div>
      <select class="theme-sel" data-act="theme">${opts}</select>
      <a href="https://github.com/ohwald/skills-comparison" target="_blank" rel="noopener">${icon("gh", 17, "var(--dim)")}</a>
    </div></div>`;
}
function slotEl(side) {
  const s = slotSkill(side);
  const color = side === "A" ? "var(--blue)" : "var(--purple)";
  const open = state.picker === side.toLowerCase();
  const warn = s && s.license_status === "degraded" ? `<span class="warn">${esc(t("deg"))}</span>` : "";
  const chip = s ? timeChip(s, side === "A" ? state.refA : state.refB) : "";
  const inner = open
    ? `<span class="badge">${side}</span>${icon("search", 15, color)}
       <input id="picker-input" placeholder="${esc(t("search"))}" autocomplete="off">`
    : `<span class="badge">${side}</span>${icon(s && isVersion() ? "hist" : "search", 15, color)}
       <span class="name">${esc(s ? s.name : "—")}</span>${chip}${warn}<span class="spacer"></span>${icon("chev", 16, color)}`;
  return `<div class="slot" data-side="${side}" data-slot="${side.toLowerCase()}">${inner}
    ${open ? pickerPanel(side) : ""}</div>`;
}
function pickerPanel(side) {
  const cur = slotSkill(side);
  const ref = side === "A" ? state.refA : state.refB;
  const qq = state.query.toLowerCase();
  const hits = MANIFEST.skills.filter(s => !qq || s.name.toLowerCase().includes(qq) || (s.desc || "").toLowerCase().includes(qq));
  const feats = MANIFEST.featured.map(p =>
    `<div class="feat" data-feat="${esc(p.join(" "))}">${icon("spark", 12, "var(--orange)")}
     <span class="t">${esc(p.join(" × "))}</span>${icon("arrowr", 13, "var(--gutter)")}</div>`).join("");
  let timeSec = "";
  if (cur && (cur.versions || []).length >= 2) {
    const curIdx = refIdx(cur, ref);
    const newest = cur.versions[cur.versions.length - 1];
    const rows = [{idx: "latest", label: `★ ${t("latest")} · ${newest.date}`}
      ].concat(cur.versions.slice(0, -1).reverse().map((v, ri) => {
        const idx = cur.versions.length - 1 - ri;
        return {idx: String(idx), label: (v.tags.length ? "★ " + v.tags.join(",") + " · " : "") + v.date + " · " + v.sha};
      }));
    timeSec = `<div class="divider"></div>
      <div class="sec"><div class="sec-label">${icon("hist", 11, "var(--faint)")}<span>${esc(t("times"))} · ${esc(cur.name)}</span></div>
      ${rows.map(r => `<div class="row ${String(curIdx) === r.idx ? "sel" : ""}" data-time="${r.idx}">
        <span class="nm">${esc(r.label)}</span><span class="spacer"></span>
        ${String(curIdx) === r.idx ? icon("check", 13, "var(--blue)") : ""}</div>`).join("")}</div>
      <div class="divider"></div>`;
  }
  const rows = hits.map(s => {
    const sel = s.id === state.a || s.id === state.b;
    return `<div class="row" data-pick="${esc(s.id)}">
      ${sel ? `<span class="selbar"></span>` : ""}
      <span class="nm">${esc(s.name)}</span>${licBadge(s.license_status)}
      ${(s.name_conflicts || []).length ? `<span class="cf" title="${esc(t("conflict"))}">⚠ ${s.name_conflicts.length}</span>` : ""}
      <span class="spacer"></span><span class="meta">${esc(s.source)}</span>
      <span class="meta">${s.stars == null ? "" : "★" + fmt(s.stars)} ${s.installs == null ? "" : "⬇" + fmt(s.installs)} ${s.lines}${t("lines")}</span>
      ${sel ? icon("check", 13, "var(--blue)") : ""}</div>`;
  }).join("");
  return `<div class="picker" data-stop="1">
    <div class="sec"><div class="sec-label">${esc(t("featured"))}</div>${feats}</div>
    <div class="divider"></div>
    ${timeSec}
    <div class="sec"><div class="sec-label">${esc(t("all"))} · ${MANIFEST.skills.length}</div>
    ${rows || `<div class="empty">${esc(t("empty"))}</div>`}</div></div>`;
}
function timelineEl(sk) {
  const vs = sk.versions || [];
  const n = vs.length;
  if (n < 2) return "";
  const ia = refIdx(sk, state.refA), ib = refIdx(sk, state.refB);
  const pos = i => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const dots = vs.map((v, i) => {
    const cls = i === ia ? "sel-a" : (i === ib ? "sel-b" : "");
    const star = v.tags && v.tags.length ? " ★" : "";
    return `<button class="t-dot ${cls}" data-dot="${i}" style="left:${pos(i)}%" title="${esc(v.date + " · " + v.sha + star)}"></button>`;
  }).join("");
  const flag = (i, cls) => vs[i] && vs[i].tags && vs[i].tags.length
    ? `<span class="flag ${cls}">★ ${esc(vs[i].tags.join(", "))}</span>` : `<span></span>`;
  return `<div class="timeline">
    <div class="t-flags" style="justify-content:space-between;padding:0 30px">${flag(ia, "t-flag-a")}${flag(ib, "t-flag-b")}</div>
    <div class="t-rail"><div class="line"></div>${dots}</div>
    <div class="t-dates"><span class="da">${esc(vs[ia].date + " · " + vs[ia].sha)}</span>
    <span class="db">${esc(vs[ib].date + " · " + vs[ib].sha)}</span></div></div>`;
}
function render() {
  renderSeq++;
  document.documentElement.setAttribute("data-theme", state.theme);
  document.documentElement.lang = state.lang === "zh" ? "zh" : "en";
  document.body.className = "view-" + state.view;
  const A = skill(state.a), B = skill(state.b);
  const version = isVersion() && A && (A.versions || []).length >= 2;
  const consoleHtml = (version ? modeRow(A) : "") + consoleBase();
  const heads = (A && B) ? `<div class="colheads">
    <div class="colhead" data-side="A"><div class="accent a"></div>
      <div class="in"><span class="dot" style="background:var(--blue)"></span>
      <span class="nm">${esc(headName("A"))}</span></div></div>
    <div class="colhead" data-side="B"><div class="accent b"></div>
      <div class="in"><span class="dot" style="background:var(--purple)"></span>
      <span class="nm">${esc(headName("B"))}</span></div></div></div>` : "";
  let inner;
  if (!A || !B) inner = `<div class="diffbody"></div>`;
  else if (A.license_status === "full" && B.license_status === "full")
    inner = `<div class="viewbar"><span class="lbl">${esc(t("viewSec"))}</span>
      <div class="vtoggle">
        <button class="${state.view === "sections" ? "on" : ""}" data-view="sections">${esc(t("viewSec"))}</button>
        <button class="${state.view === "raw" ? "on" : ""}" data-view="raw">${esc(t("viewRaw"))}</button>
      </div></div>
      <div class="toc hidden" id="toc"></div>
      <div class="diffbody"><div class="loading" style="width:100%">…</div></div>`;
  else {
    const pane = s => s.license_status === "full"
      ? `<div class="diffcol" data-side="s"><div class="loading" style="width:100%">…</div></div>`
      : `<div class="lockcol"><div class="circle">${icon("lock", 20, "var(--orange)")}</div>
         <div class="note">${esc(t("lock"))}</div>
         <button class="ghost" data-src="${esc(s.url)}">${esc(t("view"))}</button></div>`;
    inner = `<div class="diffbody">${pane(A)}${pane(B)}</div>`;
  }
  app.innerHTML = topbar() + consoleHtml + conflictBanner() +
    `<div class="hero-wrap"><div class="hero">${heads}${inner}</div></div>`;
  bind();
  mountContent();
}
function modeRow(sk) {
  return `<div class="mode-row"><div class="mode-left">
      <span class="mode-pill">${esc(t("mode"))}</span>
      <span class="mode-name">${esc(sk.name)}</span>
      <span class="mode-count">${esc(tf("count", sk.versions.length))}</span></div>
    <span class="mode-count">${esc(t("hint"))}</span></div>`;
}
function conflictBanner() {
  const s = slotSkill("A");
  if (!s || !s.name_conflicts || !s.name_conflicts.length) return "";
  const others = s.name_conflicts.map(id => BY[id]).filter(Boolean);
  if (!others.length) return "";
  return `<div class="conflict-banner">${icon("warn", 15, "var(--orange)")}
    <span>${esc(tf("conflictWarn", s.name, others.length))} <b>${esc(others.map(o => o.source).join(" / "))}</b></span>
    <span class="spacer"></span>
    <button class="cb-btn" data-conflict="${esc(others[0].id)}">${esc(t("compareNamesake"))}</button></div>`;
}
function consoleBase() {
  return `<div class="console">${slotEl("A")}<div class="swap" data-act="swap">${icon("swap", 16, "var(--dim)")}</div>${slotEl("B")}</div>`;
}
function headName(side) {
  const s = slotSkill(side); if (!s) return "—";
  const lb = refLabel(s, side === "A" ? state.refA : state.refB);
  return lb ? `${s.name} @ ${lb}` : s.name;
}
/* ---------- 正文加载 + 分段渲染 ---------- */
const bodyCache = new Map();
function fetchBody(fp) {
  if (!fp) return Promise.resolve("");
  if (bodyCache.has(fp)) return bodyCache.get(fp);
  const p = fetch("bodies/" + fp + ".md").then(r => r.ok ? r.text() : "");
  bodyCache.set(fp, p); return p;
}
function mountContent() {
  const va = resolveV("A"), vb = resolveV("B");
  if (!va || !vb) return;
  const A = skill(state.a), B = skill(state.b);
  const my = renderSeq;
  const bothFull = A.license_status === "full" && B.license_status === "full";
  Promise.all([fetchBody(va.fp), fetchBody(vb.fp)]).then(([ra, rb]) => {
    if (my !== renderSeq) return;
    if (!bothFull) { fillPlainSingle(ra, rb); return; }
    if (state.view === "raw") { mountRaw(ra, rb, my); return; }
    mountSections(ra, rb, my);
  });
}
function fillPlainSingle(ra, rb) {
  const A = skill(state.a), B = skill(state.b);
  const cols = document.querySelectorAll(".diffcol");
  const order = [A.license_status === "full" ? ra : null, B.license_status === "full" ? rb : null];
  let i = 0;
  cols.forEach(col => {
    const txt = order[i++]; if (txt == null) return;
    col.innerHTML = `<div class="sec"><div class="sec-body">${rowsHtml(txt)}</div></div>`;
  });
}
function rowsHtml(text) {
  return text.split("\n").map((l, i) =>
    `<div class="dr"><span class="g">${i + 1}</span><span class="t">${esc(l) || " "}</span></div>`).join("");
}
function mountSections(ra, rb, my) {
  const secA = splitSections(ra), secB = splitSections(rb);
  if (my !== renderSeq) return;
  const bd = document.querySelector(".diffbody");
  if (!bd) return;
  colA = F_col("A", secA); colB = F_col("B", secB);
  bd.innerHTML = ""; bd.appendChild(colA); bd.appendChild(colB);
  buildToc(secA, secB);
}
let colA = null, colB = null;
function F_col(side, secs) {
  const c = document.createElement("div");
  c.className = "diffcol"; c.setAttribute("data-side", side); c.id = "diffcol-" + side;
  secs.forEach(s => c.insertAdjacentHTML("beforeend", secHtml(side, s)));
  return c;
}
function buildToc(secA, secB) {
  const toc = document.getElementById("toc");
  if (!toc) return;
  const map = new Map();
  const key = s => s.slug + "@" + s.lvl;
  secA.forEach(s => { const k = key(s); if (!map.has(k)) map.set(k, {slug: s.slug, lvl: s.lvl, title: s.title, a: true, b: false}); else map.get(k).a = true; });
  secB.forEach(s => { const k = key(s); if (!map.has(k)) map.set(k, {slug: s.slug, lvl: s.lvl, title: s.title, a: false, b: true}); else map.get(k).b = true; });
  const chips = [...map.values()].map(e =>
    `<button class="toc-chip" data-sec="${esc(e.slug)}" title="${esc(e.title)}">
     ${e.a ? '<span class="pd a"></span>' : ""}${e.b ? '<span class="pd b"></span>' : ""}
     ${esc(e.title)}</button>`).join("");
  toc.innerHTML = `<span class="toc-label">${esc(t("toc"))}</span>` + chips;
  toc.classList.remove("hidden");
  toc.querySelectorAll("[data-sec]").forEach(ch => ch.onclick = () => {
    const slug = ch.getAttribute("data-sec");
    ["A", "B"].forEach(side => {
      const el = document.getElementById(`sec-${side}-${slug}`);
      if (el) el.scrollIntoView({block: "start", behavior: "smooth"});
    });
  });
}
function mountRaw(ra, rb, my) {
  const bd = document.querySelector(".diffbody");
  if (!bd) return;
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
/* ---------- 事件 ---------- */
function bind() {
  app.querySelectorAll("[data-act]").forEach(el => {
    const act = el.getAttribute("data-act");
    if (act === "lang-zh") el.onclick = () => setLang("zh");
    if (act === "lang-en") el.onclick = () => setLang("en");
    if (act === "theme") { el.value = state.theme; el.onchange = e => setTheme(e.target.value); }
    if (act === "swap") el.onclick = () => { [state.a, state.b] = [state.b, state.a];
      [state.refA, state.refB] = [state.refB, state.refA]; syncURL(); render(); };
  });
  app.querySelectorAll("[data-view]").forEach(b => b.onclick = () => setView(b.getAttribute("data-view")));
  app.querySelectorAll(".slot").forEach(el => {
    const side = el.getAttribute("data-slot");
    const inp = el.querySelector("input");
    if (inp) {
      inp.value = state.query; inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
      inp.oninput = () => { state.query = inp.value; render(); };
      inp.onkeydown = e => { if (e.key === "Escape") { state.picker = null; state.query = ""; render(); } };
    } else {
      el.onclick = e => { if (e.target.closest(".picker")) return;
        state.picker = side; state.query = ""; render(); };
    }
    const pk = el.querySelector(".picker");
    if (pk) {
      pk.onclick = e => e.stopPropagation();
      pk.querySelectorAll("[data-pick]").forEach(r => r.onclick = () => setSlot(side, r.getAttribute("data-pick")));
      pk.querySelectorAll("[data-time]").forEach(r => r.onclick = () => { state.picker = null; setTime(side, r.getAttribute("data-time")); });
      pk.querySelectorAll("[data-feat]").forEach(r => r.onclick = () => {
        const [x, y] = r.getAttribute("data-feat").split(" ");
        state.a = x; state.b = y; state.refA = "latest"; state.refB = "latest";
        state.picker = null; syncURL(); render();
      });
    }
  });
  document.onclick = e => {
    if (state.picker && !e.target.closest(".slot") && !e.target.closest(".picker")) {
      state.picker = null; state.query = ""; render();
    }
  };
  app.querySelectorAll(".t-dot").forEach(d => d.onclick = () => {
    const i = String(parseInt(d.getAttribute("data-dot"), 10));
    if (i === String(refIdx(skill(state.a), state.refA))) setTime("B", "latest");
    else setTime("B", i);
  });
  app.querySelectorAll("[data-conflict]").forEach(b => b.onclick = () => setSlot("B", b.getAttribute("data-conflict")));
  app.querySelectorAll("[data-src]").forEach(b => b.onclick = () => window.open(b.getAttribute("data-src"), "_blank"));
}
document.documentElement.setAttribute("data-theme", state.theme);
document.body.className = "view-" + state.view;
render();
