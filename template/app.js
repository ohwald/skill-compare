"use strict";
const INLINE = JSON.parse(document.getElementById("manifest").textContent);
/* lite 内联版缺 versions/files:异步补全完整版;补全前用 versions_count 兜底 */
let MANIFEST = INLINE;
let fullReady = INLINE.lite
  ? fetch("manifest.json").then(r => r.json()).then(full => {
      const byId = Object.fromEntries(full.skills.map(s => [s.id, s]));
      for (const s of INLINE.skills) { const f = byId[s.id]; if (f) { s.versions = f.versions; s.files = f.files; s.head = f.head; s.rel_path = f.rel_path; s.url = f.url; s.category = f.category; } }
      MANIFEST = full; render();
    })
  : Promise.resolve();
const BY = Object.fromEntries(MANIFEST.skills.map(s => [s.id, s]));

/* ---------- i18n(UI 文案;skill 内容一律原文) ---------- */
const I18N = {
  zh:{search:"搜索 skill…",featured:"✨ 精选组合",all:"全部 skill",empty:"没有匹配的 skill",
      lock:"专有许可 · 不转载原文",view:"查看原文 ↗",mode:"版本模式",
      count:n=>`共 ${n} 个版本`,hint:"点击时间轴圆点切换 B 侧时间点;A 侧在槽位面板「时间点」区切换;★ 为上游 tag",
      full:"全文可比",deg:"专有 · 仅摘要",latest:"最新",times:"时间点",
      viewSec:"结构对比",viewRaw:"原文 diff",toc:"结构",lines:"行",
      conflictWarn:(name,n)=>`重名提醒:「${name}」还有 ${n} 个同名不同源的版本,同时安装会互相覆盖:`,
      compareNamesake:"对比同名版本",conflict:"重名",
      resident:"常驻",trigger:"触发",files:"附属文件",est:"静态估算,非实测",
      bindCC:"绑定 Claude Code",bindPort:"跨 harness 通用",
      styleProc:"流程型",stylePrin:"原则型",styleMix:"混合型",
      costHead:"上下文成本",
      filesTab:"附属文件",noFiles:"纯单文件 skill(无附属文件)",same:"同",diff:"异",
      onlyA:"仅 A",onlyB:"仅 B",clickView:"点击对比",
      popular:"🔥 热门推荐",from:"来自",allTags:"全部",fromSet:"套件",namesakeOf:"同名 · 来自"},
  en:{search:"Search skills…",featured:"✨ Featured pairs",all:"All skills",empty:"No matching skills",
      lock:"Proprietary license · original text not reproduced",view:"View source ↗",mode:"Version mode",
      count:n=>`${n} versions total`,
      hint:"Click timeline dots to switch side B; switch side A in the slot panel's Time points; ★ marks upstream tags",
      full:"Full text",deg:"Proprietary · summary",latest:"Latest",times:"Time points",
      viewSec:"Structure",viewRaw:"Raw diff",toc:"Structure",lines:"lines",
      conflictWarn:(name,n)=>`Name conflict: "${name}" has ${n} same-named variant(s) from other sources — installing both would collide:`,
      compareNamesake:"Compare namesakes",conflict:"name conflict",
      resident:"Resident",trigger:"Trigger",files:"Aux files",est:"static estimate, not measured",
      bindCC:"Claude Code bound",bindPort:"Harness-portable",
      styleProc:"Procedural",stylePrin:"Principled",styleMix:"Mixed",
      costHead:"Context cost",
      filesTab:"Aux files",noFiles:"Single-file skill (no aux files)",same:"same",diff:"differs",
      onlyA:"A only",onlyB:"B only",clickView:"click to compare",
      popular:"🔥 Popular",from:"from",allTags:"All",fromSet:"Set",namesakeOf:"namesake · from"},
};
/* ---------- 主题 ---------- */
const THEMES = __THEME_LIST__;
/* ---------- 状态:槽位 = skill @ 时间点 ---------- */
const q = new URLSearchParams(location.search);
/* 默认视图:单个 skill 的版本自比(phistory 心智)——无 a/b 参数时选第一个
   有 ≥2 个版本的 skill,A=最早、B=最新;带 a/b 参数则按参数(横向对比)。 */
function defaultSelfCompareSkill() {
  const s = MANIFEST.skills.find(s => (s.versions || []).length >= 2);
  return (s || MANIFEST.skills[0] || {}).id || "";
}
const hasAB = q.get("a") && q.get("b");
const state = {
  a: q.get("a") || defaultSelfCompareSkill(),
  b: hasAB ? q.get("b") : (q.get("a") || defaultSelfCompareSkill()),
  refA: q.get("ra") || "0",
  refB: q.get("rb") || "latest",
  lang: localStorage.getItem("lang") || "zh",
  theme: q.get("theme") || localStorage.getItem("theme") || "tokyo-night",
  view: q.get("v") === "raw" ? "raw" : (q.get("v") === "files" ? "files" : "sections"),
  picker: null, query: "", tagFilter: null
};
const t = k => { const v = I18N[state.lang][k]; return typeof v === "function" ? v(0) : v; };
const tf = (k, ...args) => { const v = I18N[state.lang][k]; return typeof v === "function" ? v(...args) : v; };

function syncURL() {
  const p = new URLSearchParams({a: state.a, b: state.b, lang: state.lang, theme: state.theme});
  if (state.refA !== "latest") p.set("ra", state.refA);
  if (state.refB !== "latest") p.set("rb", state.refB);
  if (state.view !== "sections") p.set("v", state.view);
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
function costChip(s) {
  const cc = s.context_cost; if (!cc) return "";
  const f = cc.files ? ` · ${cc.files} ${t("files")}` : "";
  return `<span class="costchip" title="${esc(t("est"))}">${icon("coins", 11, "var(--dim)")}${esc(t("resident"))} ~${fmt(cc.resident)} / ${esc(t("trigger"))} ~${fmt(cc.trigger)} tok${f}</span>`;
}
function compatChip(s) {
  const c = s.compat; if (!c) return "";
  const bind = c.binding === "claude-code"
    ? `<span class="bindchip cc" title="${esc((c.harness_fields || []).join(", "))}">${esc(t("bindCC"))}</span>`
    : `<span class="bindchip port">${esc(t("bindPort"))}</span>`;
  const styleKey = {procedural: "styleProc", principled: "stylePrin", mixed: "styleMix"}[c.style] || "styleMix";
  return `${bind}<span class="stylechip">${esc(t(styleKey))}</span>`;
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
    <div class="brand">${icon("logo", 17, "var(--blue)")}<span>Skill History</span></div>
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
  const chip = s ? timeChip(s, side === "A" ? state.refA : state.refB) : "";
  const inner = open
    ? `<span class="badge">${side}</span>${icon("search", 15, color)}
       <input id="picker-input" placeholder="${esc(t("search"))}" autocomplete="off">`
    : `<span class="badge">${side}</span>${icon(s && isVersion() ? "hist" : "search", 15, color)}
       <span class="name">${esc(s ? s.name : "—")}</span>${chip}${warn}<span class="spacer"></span>${icon("chev", 16, color)}`;
  return `<div class="slot" data-side="${side}" data-slot="${side.toLowerCase()}">${inner}
    ${open ? pickerPanel(side) : ""}</div>`;
}
function subseq(needle, hay) {
  let i = 0;
  const lc = hay.toLowerCase();
  for (const ch of needle.toLowerCase()) {
    i = lc.indexOf(ch, i);
    if (i === -1) return -1;
    i += 1;
  }
  return 1;  // 子序列命中(非连续也行,分数低)
}
function fuzzyScore(q, s) {
  const name = s.name, lcN = name.toLowerCase(), lq = q.toLowerCase();
  if (lcN === lq) return 100;
  if (lcN.startsWith(lq)) return 90;
  const idx = lcN.indexOf(lq);
  if (idx >= 0) return 70 - Math.min(idx, 20);            // 连续子串,越靠前越高
  if ((s.desc || "").toLowerCase().includes(lq)) return 40;
  return subseq(q, name) > 0 ? 20 : -1;                    // 子序列兜底
}
function popularSkills() {
  const scored = MANIFEST.skills.map(s => ({
    s, score: (s.installs || 0) + (s.stars || 0) / 10 }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 12).map(x => x.s);
}
function pickerPanel(side) {
  const cur = slotSkill(side);
  const ref = side === "A" ? state.refA : state.refB;
  const qq = state.query.trim();
  let hits;
  if (!qq) {
    hits = popularSkills();                                  // 空查询:热门推荐
  } else {
    hits = MANIFEST.skills
      .map(s => ({s, sc: fuzzyScore(qq, s)}))
      .filter(x => x.sc >= 0)
      .sort((a, b) => b.sc - a.sc || ((b.s.installs || 0) - (a.s.installs || 0)))
      .map(x => x.s)
      .filter(s => !state.tagFilter || (s.tags || []).includes(state.tagFilter));
  }
  if (state.tagFilter && !qq) {
    hits = MANIFEST.skills.filter(s => (s.tags || []).includes(state.tagFilter))
      .sort((a, b) => ((b.installs || 0) + (b.stars || 0) / 10) - ((a.installs || 0) + (a.stars || 0) / 10));
  }
  const feats = MANIFEST.featured.map(p =>
    `<div class="feat" data-feat="${esc(p.join(" "))}">${icon("spark", 12, "var(--orange)")}
     <span class="t">${esc(p.join(" × "))}</span>${icon("arrowr", 13, "var(--gutter)")}</div>`).join("");
  const allTags = {};
  MANIFEST.skills.forEach(s => (s.tags || []).forEach(tg => allTags[tg] = (allTags[tg] || 0) + 1));
  const tagChips = `<div class="tagrow"><button class="tagchip ${!state.tagFilter ? "on" : ""}" data-tag="">${esc(t("allTags"))}</button>` +
    Object.entries(allTags).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tg, n]) =>
      `<button class="tagchip ${state.tagFilter === tg ? "on" : ""}" data-tag="${esc(tg)}">${esc(tg)} ${n}</button>`).join("") + `</div>`;
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
    let nm = esc(s.name);
    if (qq) {
      const i = s.name.toLowerCase().indexOf(qq.toLowerCase());
      if (i >= 0) nm = esc(s.name.slice(0, i)) + "<b>" + esc(s.name.slice(i, i + qq.length)) + "</b>" + esc(s.name.slice(i + qq.length));
    }
    const conflicts = (s.name_conflicts || []);
    const cfTip = conflicts.length
      ? conflicts.map(id => (BY[id] || {}).source).filter(Boolean).join(" / ") : "";
    return `<div class="row" data-pick="${esc(s.id)}">
      ${sel ? `<span class="selbar"></span>` : ""}
      <span class="nm">${nm}</span>${licBadge(s.license_status)}
      ${conflicts.length ? `<span class="cf" title="${esc(t("namesakeOf") + " " + cfTip)}">⚠ ${esc(cfTip)}</span>` : ""}
      <span class="spacer"></span>
      ${(s.set && s.set.id !== s.source_id) ? `<span class="setchip" title="${esc(t("fromSet"))}">${esc(s.set.label)}</span>` : ""}
      <span class="meta">${esc(s.source)}</span>
      <span class="meta">${s.stars == null ? "" : "★" + fmt(s.stars)} ${s.installs == null ? "" : "⬇" + fmt(s.installs)} ${s.lines}${t("lines")}${s.context_cost ? ` · ${t("resident")}~${fmt(s.context_cost.resident)}` : ""}</span>
      ${sel ? icon("check", 13, "var(--blue)") : ""}</div>`;
  }).join("");
  return `<div class="picker" data-stop="1">
    ${tagChips ? `<div class="tagsec">${tagChips}</div>` : ""}
    <div class="sec"><div class="sec-label">${esc(qq ? t("all") : t("popular"))} · ${hits.length}${qq ? "" : " / " + MANIFEST.skills.length}</div>
    ${rows || `<div class="empty">${esc(t("empty"))}</div>`}</div></div>`;
}
function timelineEl(sk) {
  const vs = sk.versions || [];
  const n = vs.length;
  if (n < 2) return "";
  const ia = refIdx(sk, state.refA), ib = refIdx(sk, state.refB);
  const pos = i => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const stars = vs.map((v, i) => v.tags && v.tags.length
    ? `<span class="t-star" style="left:${pos(i)}%" title="${esc(v.tags.join(", "))}">★</span>` : "").join("");
  const flags = `<div class="t-flags" style="justify-content:space-between;padding:0 30px">${
    (vs[ia].tags && vs[ia].tags.length) ? `<span class="flag t-flag-a">★ ${esc(vs[ia].tags.join(", "))}</span>` : "<span></span>"
  }${(vs[ib].tags && vs[ib].tags.length) ? `<span class="flag t-flag-b">★ ${esc(vs[ib].tags.join(", "))}</span>` : "<span></span>"}</div>`;
  return `<div class="timeline">${flags}
    <div class="t-slider">
      <div class="t-line"></div>${stars}
      <input type="range" class="ts-a" min="0" max="${n - 1}" step="1" value="${ia}"
             style="z-index:${ia >= ib ? 3 : 4}" aria-label="A time point">
      <input type="range" class="ts-b" min="0" max="${n - 1}" step="1" value="${ib}"
             style="z-index:${ib > ia ? 4 : 3}" aria-label="B time point">
    </div>
    <div class="t-dates"><span class="da">${esc(vs[ia].date + " · " + vs[ia].sha)}</span>
    <span class="db">${esc(vs[ib].date + " · " + vs[ib].sha)}</span></div></div>`;
}
function bubbleText(sk, i) {
  const v = sk.versions[i];
  if (!v) return "";
  return (v.tags && v.tags.length ? "★ " + v.tags.join(", ") + "\n" : "") + v.date + " · " + v.sha;
}
function moveBubble(el, idx, cls) {
  const sk = skill(state.a); if (!sk) return;
  const n = sk.versions.length;
  let b = app.querySelector(".t-bubble." + cls);
  if (!b) {
    b = document.createElement("div");
    b.className = "t-bubble " + cls;
    el.closest(".t-slider").appendChild(b);
  }
  if (idx == null) { b.classList.remove("show"); return; }
  const pct = n === 1 ? 50 : (idx / (n - 1)) * 100;
  b.style.left = Math.min(88, Math.max(12, pct)) + "%";
  b.classList.add("show");
  b.textContent = bubbleText(sk, idx);
}
function lightTimelineUpdate() {
  const sk = skill(state.a); if (!sk) return;
  const va = resolveV("A"), vb = resolveV("B");
  const da = app.querySelector(".t-dates .da"), db = app.querySelector(".t-dates .db");
  if (da && va) da.textContent = va.date + " · " + va.sha;
  if (db && vb) db.textContent = vb.date + " · " + vb.sha;
  const names = [headName("A"), headName("B")];
  app.querySelectorAll(".colhead .nm").forEach((el, i) => el.textContent = names[i]);
  document.querySelectorAll(".slot .timechip").forEach((el, idx) => {
    const side = idx === 0 ? "A" : "B";
    const s = slotSkill(side);
    const ref = side === "A" ? state.refA : state.refB;
    const lb = s ? refLabel(s, ref) : "";
    el.innerHTML = icon("clock", 10, "var(--dim)") + esc(lb || t("latest"));
  });
}
function render() {
  renderSeq++;
  document.documentElement.setAttribute("data-theme", state.theme);
  document.documentElement.lang = state.lang === "zh" ? "zh" : "en";
  document.body.className = "view-" + state.view;
  const A = skill(state.a), B = skill(state.b);
  const version = isVersion() && A && (A.versions || []).length >= 2;
  const consoleHtml = (version ? modeRow(A) : "") + consoleBase();
  const headRow = (side) => {
    const s = slotSkill(side); if (!s) return `<div class="colhead" data-side="${side}"><div class="accent ${side === "A" ? "a" : "b"}"></div>
      <div class="in"><span class="dot" style="background:var(--${side === "A" ? "blue" : "purple"})"></span>
      <span class="nm">—</span></div></div>`;
    return `<div class="colhead" data-side="${side}"><div class="accent ${side === "A" ? "a" : "b"}"></div>
      <div class="in"><div class="in-col">
        <div class="in-row"><span class="dot" style="background:var(--${side === "A" ? "blue" : "purple"})"></span>
          <span class="nm">${esc(headName(side))}</span>${licBadge(s.license_status)}</div>
        <div class="in-row meta-row">${costChip(s)}${compatChip(s)}</div>
      </div></div></div>`;
  };
  const heads = (A && B) ? `<div class="colheads">${headRow("A")}${headRow("B")}</div>` : "";
  let inner;
  if (!A || !B) inner = `<div class="diffbody"></div>`;
  else if (A.license_status === "full" && B.license_status === "full")
    inner = `<div class="viewbar"><span class="lbl">${esc(t("viewSec"))}</span>
      <div class="vtoggle">
        <button class="${state.view === "sections" ? "on" : ""}" data-view="sections">${esc(t("viewSec"))}</button>
        <button class="${state.view === "raw" ? "on" : ""}" data-view="raw">${esc(t("viewRaw"))}</button>
        <button class="${state.view === "files" ? "on" : ""}" data-view="files">${esc(t("filesTab"))}</button>
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
    if (state.view === "files") { mountFiles(my); return; }
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
function rawBase(side) {
  const s = slotSkill(side);
  const commit = side === "A" ? state.refA : state.refB;
  let sha = null;
  if (commit !== "latest") {
    const v = (s.versions || [])[refIdx(s, commit)];
    sha = v && v.sha;
  }
  return {repo: s.source, ref: sha || s.head || "main", dir: s.rel_path.replace("\/SKILL.md", "")};
}
function mountFiles(my) {
  const bd = document.querySelector(".diffbody");
  if (!bd || my !== renderSeq) return;
  const A = slotSkill("A"), B = slotSkill("B");
  const fa = {}, fb = {};
  (A.files || []).forEach(f => fa[f.path] = f);
  (B.files || []).forEach(f => fb[f.path] = f);
  const paths = [...new Set([...Object.keys(fa), ...Object.keys(fb)])].sort();
  if (!paths.length) {
    bd.innerHTML = `<div class="lockcol"><div class="note">${esc(t("noFiles"))}</div></div>`;
    return;
  }
  const rows = paths.map(p => {
    const a = fa[p], b = fb[p];
    const status = a && !b ? "only-a" : (b && !a ? "only-b" : (a.sha === b.sha ? "same" : "differs"));
    const label = status === "same" ? t("same") : status === "differs" ? t("diff")
      : status === "only-a" ? t("onlyA") : t("onlyB");
    const isImg = /\.(png|jpe?g|gif|svg|webp)$/i.test(p);
    const cell = (side, f, soft) => {
      if (!f) return `<span class="fc-empty">—</span>`;
      const info = rawBase(side);
      const url = `https://raw.githubusercontent.com/${info.repo}/${info.ref}/${info.dir}/${f.path}`;
      const size = f.size >= 1024 ? (f.size / 1024).toFixed(1) + "K" : f.size + "B";
      if (isImg) {
        return `<button class="fc-img" data-url="${esc(url)}" title="${esc(url)}">
          <img src="${esc(url)}" loading="lazy" alt="${esc(f.path)}"
               onerror="this.replaceWith(document.createTextNode('⚠'))">
          <span class="fc-meta">${esc(size)}</span></button>`;
      }
      return `<button class="fc-file" data-url="${esc(url)}" data-path="${esc(f.path)}"
                      data-side="${side}" title="${esc(t("clickView"))}">
        <span class="mono">${esc(f.path)}</span><span class="fc-meta">${esc(size)}</span></button>`;
    };
    return `<div class="frow st-${status}">
      <div class="fc">${cell("A", a, "a")}</div>
      <div class="fmid"><span class="fpath">${esc(p)}</span>
        <span class="fst st-${status}">${esc(label)}</span></div>
      <div class="fc">${cell("B", b, "b")}</div></div>`;
  }).join("");
  bd.innerHTML = `<div class="filesgrid">${rows}</div>`;
  bd.querySelectorAll("[data-url]").forEach(el => el.onclick = () => window.open(el.getAttribute("data-url"), "_blank"));
  bd.querySelectorAll(".fc-file[data-side]").forEach(el => el.onclick = () => {
    const url = el.getAttribute("data-url"), p = el.getAttribute("data-path");
    window.open(url, "_blank");
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
      pk.querySelectorAll("[data-tag]").forEach(b => b.onclick = () => {
        state.tagFilter = b.getAttribute("data-tag") || null; render();
        const inp2 = app.querySelector("#picker-input");
        if (inp2) { inp2.focus(); }
      });
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
  const sk = skill(state.a);
  const inA = app.querySelector(".ts-a"), inB = app.querySelector(".ts-b");
  if (inA && inB && sk) {
    inA.oninput = () => { let v = +inA.value; const b = +inB.value;
      if (v > b) { v = b; inA.value = v; }
      state.refA = String(v); lightTimelineUpdate(); moveBubble(inA, v, "ba"); };
    inB.oninput = () => { let v = +inB.value; const a = +inA.value;
      if (v < a) { v = a; inB.value = v; }
      state.refB = String(v); lightTimelineUpdate(); moveBubble(inB, v, "bb"); };
    inA.onchange = inB.onchange = () => { moveBubble(inA, null, "ba"); moveBubble(inB, null, "bb");
      syncURL(); render(); };
  }
  app.querySelectorAll("[data-conflict]").forEach(b => b.onclick = () => setSlot("B", b.getAttribute("data-conflict")));
  app.querySelectorAll("[data-src]").forEach(b => b.onclick = () => window.open(b.getAttribute("data-src"), "_blank"));
}
document.documentElement.setAttribute("data-theme", state.theme);
document.body.className = "view-" + state.view;
render();
