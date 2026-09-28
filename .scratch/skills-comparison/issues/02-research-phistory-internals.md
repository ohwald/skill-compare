Status: resolved
Type: research
Blocked by:

## Question

phistory(https://github.com/WEIFENG2333/phistory,站点 phistory.cc)的实现细节:render-site 生成的站点结构(index.html 怎么组织)、数据 JSON 的 schema、并排/diff 视图如何渲染、采集管线的目录布局(captures/<agent>/<version>/ 之类)、GitHub Actions 工作流怎么写。哪些可以直接复用到「skill 并排对比」场景,哪些需要改造?

## Answer

> 研究方法:depth-1 clone 到 /tmp/phistory-research 通读源码,并在本地用纯 stdlib 实际跑通 `render_site()` + `render_index()` 验证产物(构建耗时约 20s,index.html 1.38MB,manifest 1.26MB / 1686 条快照)。以下全部为实测结论。

## 1. 仓库整体结构

```
phistory/
├── pyproject.toml / uv.lock      # Python>=3.11,唯一运行依赖 claude-tap(仅采集用);hatchling 构建
├── phistory/                     # Python 包(站点生成部分纯 stdlib)
│   ├── cli.py                    # CLI 入口:capture / backfill / rerender / render-index / build-site / translate
│   ├── registry.py               # 14 个 AgentSpec 定义(package 名、变体、驱动方式 oneshot/pty/dsh-web)
│   ├── models.py                 # dataclass:AgentSpec / CaptureVariant / CaptureTarget
│   ├── capture.py, workflow.py, storage.py, drivers/   # 采集管线(装指定版本 CLI → claude-tap 抓 HTTP)
│   ├── render.py                 # 扫描 captures → rows;render_index 生成 README.md/README_zh.md/docs/captures.md/captures/index.json/llms.txt
│   ├── site.py                   # render_site:生成单文件 index.html(_HTML 模板 3091 行内嵌于本文件)
│   ├── build.py                  # build_site:组装完整站点目录(临时目录构建完再原子替换)
│   └── translation/…             # 中文翻译子系统(skill 对比场景不需要)
├── web/translation.{css,js}      # 翻译前端资产,构建时内联进 index.html 占位符
├── captures/<agent>/<version>/variants/<variant>/
│   ├── prompt.md                 # 渲染后的系统提示词(对比的主体)
│   ├── trace.jsonl               # 原始 HTTP 请求/响应证据(每行一个 JSON)
│   └── meta.json                 # 采集元数据
├── translations/zh-CN/<agent>/runtime.json   # 按内容 sha256 键的译文段字典
├── .github/workflows/capture.yml # 每小时采集 + 提交
├── .github/workflows/pages.yml   # push/workflow_run 触发构建 + 发布 Pages
└── CNAME / .nojekyll / robots.txt / sitemap.xml / llms.txt
```

关键命令产物:
- `render-index`:README.md、README_zh.md、docs/captures.md(全量快照表)、captures/index.json(机器可读目录)、llms.txt(给 LLM 的站点导读)
- `build-site -o <dir>`:完整站点目录 = index.html + captures/(只拷贝三件套文件)+ translations/zh-CN/*/runtime.json + docs/ 图标与截图 + CNAME/.nojekyll/robots/sitemap。**站点产物不入库**,每次从 captures 数据现构建。

## 2. 站点实现(site.py)

- **真·单文件**:整个 HTML+CSS+JS 是 site.py 里的一个原始字符串模板 `_HTML`(3091 行),`render_site()` 只做 3 次字符串替换:`__PHISTORY_MANIFEST__`(数据)、`__TRANSLATION_CSS__`、`__TRANSLATION_JS__`,然后写出一个 index.html。vanilla JS,零框架、零构建工具链。
- **数据注入 = 内联 JSON + 运行时 fetch 大文件**,两层策略:
  - 轻量元数据 manifest 内联:`<script id="manifest" type="application/json">` 里放全部 agent/variant/version 列表与 diff 统计(1686 条 → 1.26MB);注入前经 `_json_for_script()` 把 `</` 转义为 `<\/` 防 script 提前闭合。前端 `JSON.parse(document.getElementById('manifest').textContent)`。
  - 重正文不内联:prompt.md / trace.jsonl 按 manifest 里的相对路径 `fetch()` 按需加载,URL 追加 `?v=<sha256前16位>` fingerprint 强制缓存刷新,前端用 `Map` 缓存已加载文本。
- **CSS**:全部内联在 `<style>`,CSS 变量做 dark/light 双主题(localStorage 持久化,`data-theme` 属性切换),移动端 <=880px 断点重排。无任何外部 CSS。
- **CDN 依赖只有 3 个**:DOMPurify 3.2.7、marked 12.0.2、Monaco Editor 0.52.2(先引 loader.min.js,前端 `window.require` 懒加载 editor.main)。
- **URL 即状态**:`?agent=&from=&to=&view=diff|trace`,选完 `history.replaceState` 写回,可分享/收藏具体对比视图。
- 生命周期处理值得抄:全局 `state.renderSequence` 递增计数防异步渲染竞态;Monaco model 用完显式 dispose;`state.cache`/`state.traceCache` 复用请求。

## 3. 数据 JSON schema(实测)

**manifest**(内联,前端消费):
```jsonc
{ "agents": [ /* count: 总快照数 */
  { "id": "claude-code", "name": "Claude Code", "short_name": null, "icon": "docs/agent-icons/claude-code.png",
    "latest": {...}, "default_variant": "default",
    "variants": [ { "id": "default", "label": "Terminal", "dimensions": {"surface":"terminal"},
                    "latest": {...}, "versions": [ /* 每个 version 一条,按版本降序 */ ] } ] } ] }
// version 条目:
{ "agent_id","agent","version","variant_id","variant_label","variant_dimensions",
  "observed": {"provider","model","tool_count","surface"},
  "trace_redacted": false,
  "published_compact": "2026-09-25", "published_display": "2026-09-25 18:46 UTC", "captured_display": "...",
  "prompt": "captures/claude-code/2.1.283/variants/default/prompt.md",  // 相对站点根
  "prompt_fingerprint": "0c40f5ab3df61786",   // sha256[:16],用于 fetch 缓存失效
  "trace": "...", "trace_fingerprint": "...",
  "translations": {...},                       // 中文译文字典引用(skill 对比可去)
  "change": { "previous_version","added_lines","removed_lines","changed_lines",
              "level": 0-3,                    // 0无/<=12行小/<=80行中/其余大
              "line_count", "scale": 0-100 } } // 相对变更比例,用于迷你 diffstat 条
```

**meta.json**(每快照,采集产物):`agent_id, agent, package, version, variant{id,label,dimensions}, requested, observed{provider,model,tool_count,surface}, published_at, tarball_url, binary_version, captured_at, tap_client, target, client_exit_code, duration_seconds, command[...]`。

**captures/index.json**(render-index 产物):`{description, site, updated_at, agents:[{agent_id, latest_version, latest_published_at, versions, snapshots}], captures:[{...元数据 + prompt/trace/meta 相对路径}]}`。

## 4. 并排/diff 视图渲染

- **不是自研、不是 iframe,是 Monaco Editor 的 `createDiffEditor`**(jsdelivr CDN,markdown 语言模式,`diffAlgorithm:'advanced'`)。
- 响应式策略:桌面 `renderSideBySide: true`(真并排双列);<=880px 自动 `renderSideBySide: false`(行内 diff)+ 禁用交互/缩略图,resize 防抖后 `updateOptions` + `layout()`。`readOnly:true, originalEditable:false, wordWrap:'on', automaticLayout:true`。
- 流程:`fetch` 两个版本的 prompt.md → `monaco.editor.createModel(text,'markdown')` ×2 → `createViewModel` → `setModel`;切换对比时 dispose 旧 model。
- **diff 统计在构建期用 Python `difflib.SequenceMatcher` 预计算**(added/removed/level/scale 写进 manifest),前端只负责展示:版本下拉里每项一个纯 CSS 迷你 diffstat 条(红绿比例 CSS 变量),不做运行时全文 diff。
- Trace 视图(单版本详情页):marked + DOMPurify 渲染 markdown(禁 img),纯 DOM 折叠面板(System/Tools/Messages 分区),展开状态和滚动位置存 localStorage。

## 5. GitHub Actions

**capture.yml**(数据采集,`permissions: contents: write`):
- 触发:`schedule: cron "37 * * * *"`(每小时)+ 手动 workflow_dispatch;`concurrency` 同组不取消。
- 步骤:checkout → setup-node 24 → setup-uv → `uv sync --all-groups` → ruff format/check + pytest + `uv build`(先质检)→ `phistory capture --latest`(**`set +e` 吞掉退出码记录到 step output,不让单个 agent 失败炸掉整个 run**)→ translate(有 secret 才跑)→ `render-index` → `build-site` 仅作构建冒烟验证 → `git add README* llms.txt docs captures translations` → **`git diff --cached --quiet` 有变更才 commit**(github-actions[bot])+ push → 失败时 `::error` 注解报告。

**pages.yml**(发布,`permissions: pages: write, id-token: write`):
- 触发:push main + `workflow_run`(Capture prompts 完成后)+ 手动。
- 步骤:checkout main → `uv sync --frozen` → `phistory build-site --output .phistory-cache/site` → `actions/configure-pages` → `actions/upload-pages-artifact` → `actions/deploy-pages`(官方四件套,无 gh-pages 分支)。

分工:**采集工作流提交数据到 main;Pages 工作流每次从 main 的数据重新构建站点**。构建只要 ~20s,不存构建产物。

## 6. 复用 vs 改造清单(针对 skill 并排对比)

**可直接复用(架构与模式)**
1. 总体架构:数据目录(captures/<item>/...)+ meta.json + 脚本扫描生成内联 manifest 的单文件 index.html + Actions 每次从数据重建站点。这就是「纯静态零构建」的完整范本。
2. `render.py` 的 `read_capture_rows` 目录扫描(glob `*/*/variants/*/meta.json`)+ `_version_key` 语义化版本排序(digit/字母分段 tuple 比较)。
3. manifest 内联模式:`<script id="manifest" type="application/json">` + `_json_for_script` 的 `</`→`<\/` 转义 + `?v=<sha256[:16]>` fingerprint 的 fetch 缓存刷新。
4. Monaco diff editor 整套配置:并排/内联响应式切换、model 生命周期 dispose、`renderSequence` 防竞态、fetch×2 + createModel 流程。
5. 构建期 `difflib.SequenceMatcher` 预计算 diff 统计 + CSS 迷你 diffstat 条(对 skill 的 description/正文变更有版本序列时同样适用)。
6. marked + DOMPurify 渲染 markdown(CDN 引入、禁 img 的 renderer 覆盖、CDN 挂了还有 fallback 简易 markdown 解析)。
7. pages.yml 几乎原样可用(换 build 命令即可);capture.yml 的防并发、`set +e` 容错、有 diff 才 commit、`::error` 报告模式。
8. 双主题 CSS 变量方案、URL query 传状态、GitHub Step Summary 输出采集结果表格。
9. site.py 证明:**纯 stdlib 就能做站点生成器**(json/hashlib/difflib/pathlib),无需装任何依赖,CI 里 `uv run`/`python` 直接跑。

**必须改造**
1. 数据 schema 重新设计:phistory 是 agent→version 时间轴;skill 对比的主轴是「不同 skill 横向并排」+ 各 skill 自身版本。建议保留 agent→versions 骨架(把 skill 当 agent),并排对比任意两项时要支持跨 agent 选择(phistory 强制 from/to 同 variant 且 from<=to 的 `normalizeVersionRange` 逻辑要放开)。
2. 采集管线完全不同:phistory 靠 claude-tap 装 CLI 抓 HTTP(不可复用);skill 对比需要新写 collector(GitHub API 抓 skill 仓库/SKILL.md,或复用已有 skills 清单),meta.json 字段重定义为:来源 repo、license、stars、版本/commit、抓取时间、文件列表等。
3. Trace 视图无对应物:HTTP 请求/工具 schema 解析那一大段 JS 对 skill 无意义,应替换为 SKILL.md 结构化展示(frontmatter / 正文 / 参考文件树)或直接删除。
4. 翻译子系统整体剔除:translate 命令、translations/、web/translation.*、`__TRANSLATION_*__` 占位符、前端语言切换全部不需要。
5. Diff 语义调整:Monaco 的 original/modified 两列天然可承载「skill A | skill B」并排,但如果要按段落/章节对齐(而非行级),需要先做章节切分再喂给 Monaco 或改用自定义 DOM 并排;行级 diff 则零改造。
6. 单文件体量策略:phistory manifest 1.26MB(1686 快照);skill 数量少一两个量级,manifest 可全内联;但若把 SKILL.md 全文也内联会显著膨胀,建议沿用「元数据内联 + 正文 fetch」两层策略(这正是 phistory 的做法,已被验证)。
7. 若坚持「零 Python」,manifest 生成可改写为 Node 脚本(逻辑简单,~200 行);否则照抄 Python 方案最省事(CI 自带 Python)。

**关键文件路径**(仓库内):
- 站点生成器与全部前端代码:`phistory/site.py`(34~251 行是构建逻辑,252~3091 行是 `_HTML` 模板)
- 目录扫描与 index 生成:`phistory/render.py`
- 站点目录组装:`phistory/build.py`(临时目录 + 原子替换)
- 工作流:`.github/workflows/capture.yml`、`.github/workflows/pages.yml`
- 数据样例:`captures/claude-code/2.1.283/variants/default/{prompt.md,trace.jsonl,meta.json}`、`captures/index.json`

