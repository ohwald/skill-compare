"use strict";
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
      lock:"专有许可 · 不转载原文",view:"查看原文 ↗",mode:"版本模式",
      count:n=>`共 ${n} 个版本`,full:"全文可比",deg:"专有 · 仅摘要",latest:"最新",
      times:"时间点",viewSec:"结构对比",viewRaw:"原文 diff",viewFiles:"附属文件",toc:"结构",
      lines:"行",modeHistory:"历史对比",modeCompare:"两两对比",
      conflictWarn:(name,n)=>`重名提醒:「${name}」有 ${n} 个同名版本,同时安装会互相覆盖:`,
      compareNamesake:"对比同名版本",conflict:"重名",namesakeOf:"同名 · 来自",
      resident:"常驻",trigger:"触发",files:"文件",est:"静态估算,非实测",
      bindCC:"绑定 Claude Code",bindPort:"跨 harness 通用",
      styleProc:"流程型",stylePrin:"原则型",styleMix:"混合型",
      popular:"🔥 热门推荐",hint:"点击时间轴圆点切换 B 侧时间点;★ 为上游 tag"},
  en:{search:"Search skills…",featured:"✨ Featured pairs",all:"All skills",empty:"No matching skills",
      lock:"Proprietary license · original text not reproduced",view:"View source ↗",mode:"Version mode",
      count:n=>`${n} versions`,full:"Full text",deg:"Proprietary · summary",latest:"Latest",
      times:"Time points",viewSec:"Structure",viewRaw:"Raw diff",viewFiles:"Aux files",toc:"Structure",
      lines:"lines",modeHistory:"History",modeCompare:"Compare two",
      conflictWarn:(name,n)=>`Name conflict: "${name}" has ${n} same-named versions — installing both would collide:`,
      compareNamesake:"Compare namesakes",conflict:"name conflict",namesakeOf:"namesake · from",
      resident:"Resident",trigger:"Trigger",files:"Files",est:"static estimate, not measured",
      bindCC:"Claude Code bound",bindPort:"Harness-portable",
      styleProc:"Procedural",stylePrin:"Principled",styleMix:"Mixed",
      popular:"🔥 Popular",hint:"Click timeline dots to switch side B; switch side A in the slot panel's Time points; ★ marks upstream tags"}
};
const THEMES = [{"id": "tokyo-night", "label": "Tokyo Night"}, {"id": "catppuccin-mocha", "label": "Catppuccin Mocha"}, {"id": "one-dark-pro", "label": "One Dark Pro"}, {"id": "github-light", "label": "GitHub Light"}, {"id": "one-light", "label": "One Light"}, {"id": "solarized-light", "label": "Solarized Light"}];

const q = new URLSearchParams(location.search);
const hasAB = q.get("a") && q.get("b");
function defaultSelfCompareSkill() {
  const s = MANIFEST.skills.find(s => (s.versions || []).length >= 2);
  return (s || MANIFEST.skills[0] || {}).id || "";
}
const state = {
  mode: q.get("m") === "cmp" ? "compare" : "history",
  a: q.get("a") || defaultSelfCompareSkill(),
  b: hasAB ? q.get("b") : (q.get("a") || defaultSelfCompareSkill()),
  refA: q.get("ra") || (hasAB ? "latest" : "-1"),
  refB: q.get("rb") || "latest",
  lang: localStorage.getItem("lang") || "zh",
  theme: q.get("theme") || localStorage.getItem("theme") || "tokyo-night",
  view: q.get("v") === "raw" ? "raw" : "sections",
  picker: null, query: "", tagFilter: null
};
const t = k => { const v = I18N[state.lang][k]; return typeof v === "function" ? v(0) : v; };
const tf = (k, ...args) => { const v = I18N[state.lang][k]; return typeof v === "function" ? v(...args) : v; };

function syncURL() {
  const p = new URLSearchParams({a: state.a, b: state.b, lang: state.lang, theme: state.theme});
  if (state.refA !== "-1") p.set("ra", state.refA);
  if (state.refB !== "latest") p.set("rb", state.refB);
  if (state.view === "raw") p.set("v", "raw");
  if (state.mode === "compare") p.set("m", "cmp");
  history.replaceState(null, "", "?" + p.toString());
}
function isVersion() { return state.mode === "history" && state.a && state.a === state.b; }
function skill(id) { return BY()[id] || null; }
function slotSkill(side) { return skill(side === "A" ? state.a : state.b); }
function refIdx(s, ref) {
  const n = (s.versions || []).length;
  if (!n) return 0;
  if (ref === "latest") return n - 1;
  if (ref === "-1") return Math.max(0, n - 2);
  const i = parseInt(ref, 10);
  return isNaN(i) ? n - 1 : Math.max(0, Math.min(n - 1, i));
}
function resolveV(side) {
  const s = slotSkill(side); if (!s) return null;
  return (s.versions || [])[refIdx(s, side === "A" ? state.refA : state.refB)] || null;
}
function refLabel(s, ref) {
  if (!s.versions || s.versions.length < 2) return "";
  const v = s.versions[refIdx(s, ref)];
  const tags = v.tags && v.tags.length ? "★" + (v.tags.length === 1 ? v.tags[0] : v.tags[0] + `+${v.tags.length - 1}`) : "";
  return tags ? tags : v.date.slice(5) + " · " + v.sha.slice(0, 6);
}
function assignBoth(id) { state.a = id; state.b = id; state.refA = "-1"; state.refB = "latest"; }
function setSlotBoth(id) { assignBoth(id); syncURL(); render(); }
function setSlot(side, id) {
  if (state.mode === "history") { setSlotBoth(id); return; }
  if (side === "A") state.a = id; else state.b = id;
  syncURL(); render();
}
function setTime(side, ref) {
  if (side === "A") state.refA = ref; else state.refB = ref;
  if (isVersion() && refIdx(skill(state.a), state.refA) === refIdx(skill(state.a), state.refB)) {
    if (ref === "latest") state.refA = "-1"; else state.refB = "latest";
  }
  syncURL(); render();
}
function setMode(m) {
  state.mode = m;
  if (m === "compare") {
    if (state.a === state.b) {
      const alt = MANIFEST.skills.find(s => s.id !== state.a && s.license_status === "full");
      state.b = alt ? alt.id : state.b;
    }
    state.refA = "latest"; state.refB = "latest";
  } else { state.refA = "-1"; state.refB = "latest"; }
  syncURL(); render();
}
function setLang(l) { state.lang = l; localStorage.setItem("lang", l); syncURL(); render(); }
function setTheme(th) { state.theme = th; localStorage.setItem("theme", th);
  document.documentElement.setAttribute("data-theme", th); syncURL(); }
function setView(v) { state.view = v; syncURL(); render(); }

const IC = {
  logo:'<path d="M13 5h6M13 9h6M6 15h6M6 19h6"/><circle cx="6" cy="7" r="2"/><circle cx="18" cy="17" r="2"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  chev:'<path d="m6 9 6 6 6-6"/>', swap:'<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
  gh:'<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  lock:'<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  spark:'<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L21 12z"/>',
  hist:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  check:'<path d="M20 6 9 17l-5-5"/>', arrowr:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  coins:'<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
  warn:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-2Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>'
};
function icon(name, s, fill) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${fill || "currentColor"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none">${IC[name] || ""}</svg>`;
}
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
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
    if (!s.lines.some(l => l.trim())) continue;
    let k = s.slug; while (seen[k]) k += "-x"; seen[k] = 1; s.slug = k;
  }
  return secs.filter(s => seen[s.slug]);
}
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-").replace(/^-+|-+$/g, "") || "sec";
}
function secHtml(side, sec) {
  const rows = sec.lines.map((l, j) =>
    `<div class="dr"><span class="g">${j + 1}</span><span class="t">${esc(l) || " "}</span></div>`).join("");
  const collapsed = sec.collapsed ? " collapsed" : "";
  return `<div class="sec${collapsed}" id="sec-${side}-${sec.slug}">
    <div class="sec-band" data-toggle="${esc(sec.slug)}"><span class="tw">${icon("chev", 12, "var(--faint)")}</span>
      <span class="lvl">${sec.lvl}</span><span class="st">${esc(sec.title)}</span>
      <span class="cnt">${sec.lines.length} ${t("lines")}</span></div>
    <div class="sec-body">${rows}</div></div>`;
}
function autoCollapse(secs) {
  return secs.map((s, i) => ({...s, collapsed: (i >= 3 || s.level >= 3) && !(i === 0)}));
}

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
function slotEl(side) {
  const s = slotSkill(side);
  const color = side === "A" ? "var(--blue)" : "var(--purple)";
  const open = state.picker === side.toLowerCase();
  const warn = s && s.license_status === "degraded" ? `<span class="warn">${esc(t("deg"))}</span>` : "";
  const inner = open
    ? `<span class="badge">${side}</span>${icon("search", 15, color)}
       <input id="picker-input" placeholder="${esc(t("search"))}" autocomplete="off">`
    : `<span class="badge">${side}</span>${icon(state.mode === "history" ? "hist" : "search", 15, color)}
       <span class="name">${esc(s ? s.name : "—")}</span>${warn}<span class="spacer"></span>${icon("chev", 16, color)}`;
  return `<div class="slot" data-side="${side}" data-slot="${side.toLowerCase()}">${inner}
    ${open ? pickerPanel(side) : ""}</div>`;
}
function pickerPanel(side) {
  const cur = slotSkill(side);
  const ref = side === "A" ? state.refA : state.refB;
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
  const feats = MANIFEST.featured.map(p =>
    `<div class="feat" data-feat="${esc(p.join(" "))}">${icon("spark", 12, "var(--orange)")}
     <span class="t">${esc(p.join(" × "))}</span>${icon("arrowr", 13, "var(--gutter)")}</div>`).join("");
  const allTags = {};
  MANIFEST.skills.forEach(s => (s.tags || []).forEach(tg => allTags[tg] = (allTags[tg] || 0) + 1));
  const tagChips = `<div class="tagsec"><div class="tagrow">
    <button class="tagchip ${!state.tagFilter ? "on" : ""}" data-tag="">${esc(t("allTags"))}</button>
    ${Object.entries(allTags).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tg, n]) =>
      `<button class="tagchip ${state.tagFilter === tg ? "on" : ""}" data-tag="${esc(tg)}">${esc(tg)} ${n}</button>`).join("")}
  </div></div>`;
  let timeSec = "";
  if (cur && (cur.versions || []).length >= 2) {
    const curIdx = refIdx(cur, ref);
    const n = cur.versions.length;
    const rows = [{idx: "latest", label: `★ ${t("latest")} · ${cur.versions[n - 1].date} · ${cur.versions[n - 1].sha.slice(0, 7)}`}]
      .concat(cur.versions.slice(0, -1).reverse().map((v, ri) => {
        const idx = n - 1 - ri;
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
    let nm = esc(s.name);
    if (qq) {
      const i = s.name.toLowerCase().indexOf(qq.toLowerCase());
      if (i >= 0) nm = esc(s.name.slice(0, i)) + "<b>" + esc(s.name.slice(i, i + qq.length)) + "</b>" + esc(s.name.slice(i + qq.length));
    }
    const conflicts = (s.name_conflicts || []);
    const cfTip = conflicts.length ? conflicts.map(id => (BY()[id] || {}).source).filter(Boolean).join(" / ") : "";
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
    <div class="sec"><div class="sec-label">${esc(t("featured"))}</div>${feats}</div>
    <div class="divider"></div>
    ${timeSec}
    <div class="sec"><div class="sec-label">${esc(qq ? t("all") : t("popular"))} · ${hits.length}${qq ? "" : " / " + MANIFEST.skills.length}</div>
    ${rows || `<div class="empty">${esc(t("empty"))}</div>`}</div></div>`;
}
function licBadge(lic) {
  return lic === "full" ? "" : `<span class="lic-badge deg">${esc(t("deg"))}</span>`;
}
function timelineEl(sk) {
  const vs = sk.versions || [];
  const n = vs.length;
  if (n < 2) return "";
  const ia = refIdx(sk, state.refA), ib = refIdx(sk, state.refB);
  const pos = i => (i / (n - 1)) * 100;
  const stars = vs.map((v, i) => v.tags && v.tags.length
    ? `<span class="t-star" style="left:${pos(i)}%" title="${esc(v.tags.join(", "))}">★</span>` : "").join("");
  let range = null;
  const lo = Math.min(ia, ib) + 1, hi = Math.max(ia, ib);
  for (let i = lo; i <= hi; i++) {
    const c = vs[i] && vs[i].change;
    if (c) { range = range || {added: 0, removed: 0}; range.added += c.added; range.removed += c.removed; }
  }
  const rangeChg = range ? `<span class="chg"><b class="up">+${range.added}</b><b class="dn">−${range.removed}</b></span>` : "";
  return `<div class="tl-slider">
    <div class="line"></div>${stars}
    <input type="range" class="ts-a" min="0" max="${n - 1}" step="1" value="${ia}"
           style="z-index:${ia >= ib ? 3 : 4}" aria-label="A time point">
    <input type="range" class="ts-b" min="0" max="${n - 1}" step="1" value="${ib}"
           style="z-index:${ib > ia ? 4 : 3}" aria-label="B time point">
  </div>
  <div class="t-dates"><span class="da">${esc(vs[ia].date + " · " + vs[ia].sha)}</span>
  ${rangeChg}
  <span class="db">${esc(vs[ib].date + " · " + vs[ib].sha)}</span></div>`;
}
function render() {
  renderSeq++;
  document.documentElement.setAttribute("data-theme", state.theme);
  document.documentElement.lang = state.lang === "zh" ? "zh" : "en";
  document.body.className = "view-" + state.view;
  const A = skill(state.a), B = skill(state.b);
  const isVersion = state.mode === "history" && A && A === B && (A.versions || []).length >= 2;
  /* 控制栏:始终显示库槽 */
  let consoleHtml = `<div class="controls">${slotEl("A")}<div class="swap" data-act="swap">${icon("swap", 16, "var(--dim)")}</div>${slotEl("B")}</div>`;
  if (isVersion) {
    consoleHtml += timelineEl(A);
  }
  const banner = conflictBanner(A);
  let inner, heads = "";
  if (!A || !B) { inner = `<div class="diffbody"></div>`; heads = ""; }
  else {
    const isSame = A === B;
    /* 列头:横向模式有元数据行,自比模式显示两个时间点标识 */
    const metaSide = withMeta => withMeta
      ? licBadge(A.license_status) + costChip(A) + compatChip(A) : "";
    const nmA = isSame
      ? (state.refA === "latest" ? t("latest") : refLabel(A, state.refA))
      : A.name;
    const nmB = isSame
      ? (state.refB === "latest" ? t("latest") : refLabel(B, state.refB))
      : B.name;
    heads = `<div class="colheads">` +
      colhead("A", isSame ? nmA : A.name, !isSame, isSame ? null : licBadge(A.license_status) + costChip(A) + compatChip(A)) +
      colhead("B", isSame ? nmB : B.name, !isSame, isSame ? null : licBadge(B.license_status) + costChip(B) + compatChip(B)) +
      `</div>`;
    if (A.license_status === "full" && B.license_status === "full")
      inner = viewbar() + `<div class="diffbody"><div class="loading" style="width:100%">…</div></div>`;
    else
      inner = `<div class="diffbody">${degradedPane(A)}${degradedPane(B)}</div>`;
  }
  app.innerHTML = topbar() + consoleHtml + banner +
    `<div class="hero-wrap"><div class="hero">${heads}${inner}</div></div>`;
  bind();
  mountContent();
}
function colhead(side, displayName, withMeta, metaHtml) {
  const color = side === "A" ? "var(--blue)" : "var(--purple)";
  return `<div class="colhead" data-side="${side}"><div class="accent ${side === "A" ? "a" : "b"}"></div>
    <div class="in"><span class="dot" style="background:${color}"></span>
    <span class="nm">${esc(displayName)}</span>
    ${metaHtml || ""}</div></div>`;
}
function degradedPane(s) {
  return s.license_status === "full"
    ? `<div class="diffcol"><div class="loading" style="width:100%">…</div></div>`
    : `<div class="lockcol"><div class="circle">${icon("lock", 20, "var(--orange)")}</div>
       <div class="note">${esc(t("lock"))}</div>
       <button class="ghost" data-src="${esc(s.url)}">${esc(t("view"))}</button></div>`;
}
function viewbar() {
  return `<div class="viewbar">
    <div class="vtoggle">
      <button class="${state.view === "sections" ? "on" : ""}" data-view="sections">${esc(t("viewSec"))}</button>
      <button class="${state.view === "raw" ? "on" : ""}" data-view="raw">${esc(t("viewRaw"))}</button>
      <button class="${state.view === "files" ? "on" : ""}" data-view="files">${esc(t("viewFiles"))}</button>
    </div></div>`;
}
function conflictBanner(s) {
  if (!s || !s.name_conflicts || !s.name_conflicts.length) return "";
  const others = s.name_conflicts.map(id => BY()[id]).filter(Boolean);
  if (!others.length) return "";
  return `<div class="conflict-banner">${icon("warn", 15, "var(--orange)")}
    <span>${esc(tf("conflictWarn", s.name, others.length))} <b>${esc(others.map(o => o.source).join(" / "))}</b></span>
    <span class="spacer"></span>
    <button class="cb-btn" data-conflict="${esc(others[0].id)}">${esc(t("compareNamesake"))}</button></div>`;
}
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
        return fetch("bodies.json").then(m => {
          if (!m.ok) return "";
          bodiesMap = m.json();
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
  const va = resolveV("A"), vb = resolveV("B");
  if (!va || !vb) return;
  const A = skill(state.a), B = skill(state.b);
  const my = renderSeq;
  const bothFull = A.license_status === "full" && B.license_status === "full";
  Promise.all([fetchBody(va.fp), fetchBody(vb.fp)]).then(([ra, rb]) => {
    if (my !== renderSeq) return;
    if (!bothFull) {
      const cols = document.querySelectorAll(".diffcol");
      const texts = [A.license_status === "full" ? ra : null, B.license_status === "full" ? rb : null];
      let i = 0;
      cols.forEach(col => { const txt = texts[i++]; if (txt != null)
        col.innerHTML = `<div class="sec"><div class="sec-body">${rowsHtml(txt)}</div></div>`; });
      attachSync(); return;
    }
    if (state.view === "raw") { mountRaw(ra, rb, my); attachSync(); return; }
    mountSections(ra, rb, my);
  });
}
function rowsHtml(text) {
  return text.split("\n").map((l, i) =>
    `<div class="dr"><span class="g">${i + 1}</span><span class="t">${esc(l) || " "}</span></div>`).join("");
}
function mountSections(ra, rb, my) {
  const secA = autoCollapse(splitSections(ra)), secB = autoCollapse(splitSections(rb));
  const bd = document.querySelector(".diffbody");
  if (!bd || my !== renderSeq) return;
  bd.innerHTML = "";
  const a = document.createElement("div"); a.className = "diffcol"; a.id = "diffcol-A"; a.setAttribute("data-side", "A");
  const b = document.createElement("div"); b.className = "diffcol"; b.id = "diffcol-B"; b.setAttribute("data-side", "B");
  secA.forEach(s => a.insertAdjacentHTML("beforeend", secHtml("A", s)));
  secB.forEach(s => b.insertAdjacentHTML("beforeend", secHtml("B", s)));
  bd.appendChild(a); bd.appendChild(b);
  a.querySelectorAll(".sec-band[data-toggle]").forEach(band => band.onclick = () =>
    band.parentElement.classList.toggle("collapsed"));
  b.querySelectorAll(".sec-band[data-toggle]").forEach(band => band.onclick = () =>
    band.parentElement.classList.toggle("collapsed"));
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
function bind() {
  app.querySelectorAll("[data-act]").forEach(el => {
    const act = el.getAttribute("data-act");
    if (act === "lang-zh") el.onclick = () => setLang("zh");
    if (act === "lang-en") el.onclick = () => setLang("en");
    if (act === "theme") { el.value = state.theme; el.onchange = e => setTheme(e.target.value); }
    if (act === "swap") el.onclick = () => { [state.a, state.b] = [state.b, state.a];
      [state.refA, state.refB] = [state.refB, state.refA]; syncURL(); render(); };
  });
  app.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => setMode(b.getAttribute("data-mode")));
  app.querySelectorAll("[data-view]").forEach(b => b.onclick = () => setView(b.getAttribute("data-view")));
  app.querySelectorAll(".sec-band[data-toggle]").forEach(band => band.onclick = () => {
    band.parentElement.classList.toggle("collapsed");
  });
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
        e.stopPropagation();
        state.picker = side; state.query = ""; render(); };
    }
    const pk = el.querySelector(".picker");
    if (pk) {
      pk.onclick = e => e.stopPropagation();
      pk.querySelectorAll("[data-pick]").forEach(r => r.onclick = () => setSlot(side, r.getAttribute("data-pick")));
      pk.querySelectorAll("[data-time]").forEach(r => r.onclick = () => { state.picker = null; setTime(side, r.getAttribute("data-time")); });
      pk.querySelectorAll("[data-tag]").forEach(btn => btn.onclick = () => {
        state.tagFilter = btn.getAttribute("data-tag") || null; render();
        const i2 = app.querySelector("#picker-input"); if (i2) i2.focus();
      });
      pk.querySelectorAll("[data-feat]").forEach(r => r.onclick = () => {
        const [x, y] = r.getAttribute("data-feat").split(" ");
        state.a = x; state.b = y; state.refA = "-1"; state.refB = "latest";
        state.picker = null; syncURL(); render();
      });
    }
  });
  document.onclick = e => {
    if (state.picker && !e.target.closest(".slot") && !e.target.closest(".picker")
        && !e.target.closest(".vwrap")) {
      state.picker = null; state.query = ""; render();
    }
  };
  app.querySelectorAll(".ts-a,.ts-b").forEach(inp => {
    const isA = inp.classList.contains("ts-a");
    inp.oninput = () => {
      let v = +inp.value;
      if (isA) { const b = refIdx(skill(state.a), state.refB); if (v > b) { v = b; inp.value = v; } state.refA = String(v); }
      else { const a = refIdx(skill(state.a), state.refA); if (v < a) { v = a; inp.value = v; } state.refB = String(v); }
      syncURL();
    };
    inp.onchange = () => { syncURL(); render(); };
  });
  app.querySelectorAll("[data-conflict]").forEach(b => b.onclick = () => { setMode("compare"); setSlot("B", b.getAttribute("data-conflict")); });
  app.querySelectorAll("[data-src]").forEach(b => b.onclick = () => window.open(b.getAttribute("data-src"), "_blank"));
}
document.documentElement.setAttribute("data-theme", state.theme);
document.body.className = "view-" + state.view;
render();
