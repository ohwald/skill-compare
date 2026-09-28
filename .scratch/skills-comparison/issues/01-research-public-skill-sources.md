Status: resolved
Type: research
Blocked by:

## Question

公开 skill 生态里有哪些值得收录的数据源?盘点 GitHub 上公开的 agent skills 合集/市场(如 anthropics/skills、各类 awesome-claude-skills 清单、obra/superpowers、skill marketplace/registry 等):各自的规模(SKILL.md 数量)、目录结构与 frontmatter schema、许可证、抓取方式(git clone vs API)与更新节奏、质量参差度。产出:候选清单 + 各自优劣,供「数据源选型」决策票使用。

## Answer

研究日期:2026-09-28。规模/字段统计来自 `git clone --depth 1` 到 /tmp 后的实数(非 README 宣称);stars/许可证/pushed_at 来自 api.github.com 同日查询。方法注:GitHub API 匿名额度 60 次/小时,适合查仓库元数据;批量读内容用 shallow clone 更划算。

### 0. 先修课:官方规范(所有源的 schema 基线)

- Agent Skills 规范已独立成站:https://agentskills.io/specification(anthropics/skills 的 `spec/agent-skills-spec.md` 只剩一行指过去)。SKILL.md = YAML frontmatter + Markdown 正文;frontmatter 字段:`name`(必填,≤64 字符、小写/数字/连字符、须与目录同名)、`description`(必填,≤1024 字符)、可选 `license`、`compatibility`(≤500 字符)、`metadata`(任意 string→string map)、`allowed-tools`(实验性)。正文建议 <500 行,配套 `scripts/`、`references/`、`assets/` 目录,渐进式加载。校验工具:skills-ref(https://github.com/agentskills/agentskills)。
- 实测各源与规范的偏差见 §2;`disable-model-invocation`、`argument-hint` 是 Claude Code 私有扩展字段(mattpocock/skills 中出现),不在 agentskills.io 规范内。

### 1. 候选源清单

#### A. 一手官方仓库(内容质量最高,规模小)

**A1. anthropics/skills(官方,必收)**
- URL: https://github.com/anthropics/skills
- 规模:20 个 SKILL.md,平铺在 `skills/`(docx、pdf、pptx、xlsx、frontend-design、skill-creator、mcp-builder、webapp-testing 等);另有 `template/SKILL.md`。
- Schema:17/20 为 `name+description+license`,3/20 为 `name+description`。license 值两种:13 个 "Complete terms in LICENSE.txt"(随附 18 个 LICENSE.txt)、4 个 "Proprietary. LICENSE.txt has complete terms"。即 **docx/pdf/pptx/xlsx 等文档类 skill 是专有许可**——对比站全文转载有版权风险,建议只展示 frontmatter + 摘要 + 外链,或只全文展示非专有的那部分。
- 仓库级许可证:无(仅 THIRD_PARTY_NOTICES.md,BSD 2-Clause 等第三方声明)。
- 抓取:git clone --depth 1;更新非常活跃(pushed 2026-09-24;178.7k stars)。
- 质量:最高且一致,官方 canonical 样本。

**A2. openai/skills(官方对标)**
- URL: https://github.com/openai/skills
- 规模:44 个 SKILL.md,平铺 `skills/`;27.7k stars;pushed 2026-09-08。
- Schema:36/44 `name+description`,8/44 加 `metadata`;无 license 字段,仓库级也无许可证 → 全文转载权限不明确。
- 抓取:clone。质量:官方水准、schema 干净。

**A3. microsoft/azure-skills(vendor 官方)**
- URL: https://github.com/microsoft/azure-skills
- 规模:86 个 SKILL.md(73 个 `name+description+license+metadata`,5 个加 `compatibility`,2 个加 `argument-hint`,**6 个完全无 frontmatter**——质量有毛边);MIT;1.5k stars;pushed 2026-09-24。
- 定位:按 Azure 场景组织的官方插件,规模在 vendor 源里最大。

**A4. supabase/agent-skills / prisma/skills(vendor 官方,小而美)**
- https://github.com/supabase/agent-skills :仅 2 个 SKILL.md,MIT,2.7k stars。
- https://github.com/prisma/skills :9 个 SKILL.md,全部 `name+description+license(MIT)+metadata{author,version}`——schema 最完整的示范生;MIT;65 stars;pushed 2026-09-25。
- 定位:作为「官方 vendor 源」分类的补充,量少。

**A5. anthropics/claude-plugins-official(官方插件市场,最佳结构化索引)**
- URL: https://github.com/anthropics/claude-plugins-official
- 规模:`.claude-plugin/marketplace.json` 收录 **314 个插件条目**,字段:`name`(314)、`description`(314)、`source`(314,指向 `./plugins/*` 或 `./external_plugins/*`)、`category`(300)、`homepage`(298)、`author`(232),少数有 `version`/`tags`/`skills`。仓库内本体含 31 个 SKILL.md(多数插件是 commands/agents/MCP 而非 skill)。Apache-2.0;37.1k stars。
- 价值:现成的结构化目录数据(JSON,含分类+作者),是给对比站做「目录骨架/分类体系」的最省力来源;具体 skill 内容再回源到各 repo。
- 抓取:clone 单文件也行(路径固定);obra/superpowers 的安装文档证实它就是 `/plugin install superpowers@claude-plugins-official` 背后的官方市场(见 superpowers README)。

#### B. 注册表/市场(skills.sh:热度数据源)

**B1. skills.sh(Vercel 运营的开放注册表)+ vercel-labs/skills(CLI)**
- URL: https://skills.sh ;CLI 仓库 https://github.com/vercel-labs/skills(MIT,32.7k stars),安装方式 `npx skills add <owner/repo>`(支持 GitHub/GitLab/任意 git URL,约 80 个 agent)。
- 规模:首屏自称索引 1,435,287 个 skill 条目(含大量自动生成/灌水),按安装量排行;top 榜 find-skills 3.6M installs。
- API:**有公开无需认证的搜索 API**——`https://skills.sh/api/search?q=<kw>` 返回 JSON:`{id: "owner/repo/skillId", source: "owner/repo", name, installs}`(实测 q=pdf、q=frontend 各返回 100 条)。**没有 license/author 之外的元数据,也无全量列表端点**(实测 /api/stats、/api/skills 均 404)。
- 用途:给候选 skill 补「安装量/热度」维度,交叉验证人气;不适合做内容源。
- 质量:参差极大(taste-skill 系列灌水可证),只能当信号不能当语料。

#### C. 知名社区合集(内容源主力)

**C1. obra/superpowers(社区标杆)**
- URL: https://github.com/obra/superpowers
- 规模:主仓 15 个 SKILL.md,平铺 `skills/`(brainstorming、systematic-debugging、test-driven-development、writing-plans 等);MIT;292k stars(全生态最高);pushed 2026-09-27,极活跃。
- Schema:清一色 `name+description`,最保守(完全符合规范最小集)。
- 抓取:clone;注意它是插件化分发(官方市场 + 自有 marketplace),但源码就在 `skills/`,clone 即得。
- 质量:高、主题聚焦「开发方法论」,与 anthropics 官方风格差异明显——正好是「并排对比」的好素材。

**C2. mattpocock/skills(知名个人合集)**
- URL: https://github.com/mattpocock/skills
- 规模:38 个 SKILL.md,按 `skills/{engineering,productivity,misc,in-progress,deprecated}` 分类;MIT;270.9k stars;pushed 2026-09-24。
- Schema:33/38 `name+description(+disable-model-invocation)`,4 个加 `argument-hint`,1 个加 `metadata`。`disable-model-invocation`/`argument-hint` 为 Claude Code 扩展字段。
- 抓取:clone;**需过滤 `in-progress/`、`deprecated/` 子目录**(约 10 个半成品/废弃)——质量分层是其主要毛边。

**C3. wshobson/agents(多 harness 插件市场)**
- URL: https://github.com/wshobson/agents
- 规模:183 个 SKILL.md,嵌套在 `plugins/<plugin>/skills/`(92 个插件目录);MIT;40k stars;pushed 2026-09-28。
- Schema:167 个 `name+description`,14 个加 `version`,2 个加 `license+metadata`;嵌套深、无统一索引文件,需自己遍历拼装「插件→skill」两层结构。
- 质量:社区贡献、参差中等。

**C4. glittercowboy/get-shit-done(GSD,方法论系统)**
- URL: https://github.com/glittercowboy/get-shit-done(注意 gsd-build/get-shit-done 已于 2026-06-26 归档,README 指向新仓)
- 规模:约 3.3k stars、15k+ 安装(来源为搜索结果与 Reddit 转述,未逐文件实测);定位是 spec-driven 开发工作流系统,skill 数量少但成体系。
- 建议:作为「个人方法论合集」类目的候选,优先级低于 C1-C3。

#### D. Awesome 清单/目录站(做发现与交叉引用,不做内容源)

**D1. ComposioHQ/awesome-claude-skills(名字是清单,实体是巨型 monorepo)**
- URL: https://github.com/ComposioHQ/awesome-claude-skills
- 规模:**864 个 SKILL.md**,但其中 **832 个是 `composio-skills/*-automation` 自动生成的 MCP 集成 skill**(frontmatter 带 `requires: mcp: [rube]`,如 zoho-books-automation),约 30 个为策展社区 skill(含把 anthropics 文档类 skill 复制入内的 `document-skills/` 等目录,15 个带 license 字段即源于此);10 个另有 `category` 字段。仓库级无许可证;75.8k stars。
- 结论:看似最大语料库,实际是 Composio 的推广性批量生成物,**不适合做对比站主语料**;其 README 清单部分可当发现渠道。

**D2. VoltAgent/awesome-agent-skills(纯清单)**
- URL: https://github.com/VoltAgent/awesome-agent-skills — 1000+ 链接的策展清单,仓库内 0 个 SKILL.md;MIT;35k stars;pushed 2026-09-23。用途:发现新源。

**D3. hesreallyhim/awesome-claude-code(纯清单,数据驱动)**
- URL: https://github.com/hesreallyhim/awesome-claude-code — 资源清单(命令/CLAUDE.md/工具为主),`config.yaml` + `THE_RESOURCES_TABLE_NEW.csv` + 脚本生成 README;许可证 NOASSERTION(自定义);54.7k stars;极活跃。范围大于 skill,需筛选。

**D4. awesomeclaude.ai / awesome-skills.com(网页目录)**
- https://awesomeclaude.ai/awesome-claude-skills :204 个 skill、13 分类(webfuse 运营,底表为 BehiSecc 策展清单),显示星标数,无逐条 license/作者;页面 MIT。
- https://awesome-skills.com :157 条目,特色是**逐条安全标注**("Runs scripts" / "Reads creds" / "✕Arbitrary code" 等)+ 更新日期,偶有 license 标注;运营方未披露。
- 用途:awesome-skills.com 的安全徽章思路值得借鉴到对比站;两者均无 API,不宜抓取。

### 2. Schema 横向小结(实测)

| 源 | SKILL.md 数 | 主流字段组合 | 有 license 字段比例 |
|---|---|---|---|
| anthropics/skills | 20 | name+description+license | 17/20 |
| openai/skills | 44 | name+description(+metadata) | 0/44 |
| azure-skills | 86 | name+description+license+metadata | 80/80(其余 6 个无 FM) |
| prisma/skills | 9 | name+description+license+metadata | 9/9 |
| superpowers | 15 | name+description | 0/15 |
| mattpocock/skills | 38 | name+description+disable-model-invocation | 0/38 |
| wshobson/agents | 183 | name+description | 2/183 |
| composio | 864 | name+description+requires | 15/864(继承自 anthropics) |

- 公共因子是 `name+description`(规范必填,100% 覆盖)→ 对比站最小可行数据模型只需这两个字段 + 来源 repo + stars/installs。
- `license` 只在一手官方/vendor 仓库里常见;社区合集几乎不写(靠仓库级 LICENSE 推断)。
- `requires`(composio)、`disable-model-invocation`/`argument-hint`(Claude Code)、`compatibility`(规范/azure)是各家的扩展,解析器需容忍未知字段。

### 3. 抓取方式结论

1. **内容(SKILL.md 全文/目录结构):git clone --depth 1**。一次拿全、离线可解析、零配额;本次所有统计均由此完成。GitHub Contents API 逐文件拉取会撞 60 次/小时匿名限额,仅适合补漏。
2. **仓库元数据(stars/ license/ pushed_at):api.github.com/repos/{owner}/{repo}**,每源 1 次请求,建站时可低频定时刷新。
3. **热度:skills.sh `/api/search?q=`(免认证 JSON,含 installs)**,可对收录的 skill 批量查询;无全量导出,需按关键词/清单驱动。
4. **目录骨架:claude-plugins-official 的 `.claude-plugin/marketplace.json`**(314 条,含 category/author/source),clone 单文件即可。

### 4. 给「数据源选型」决策票的输入

推荐前 3(按优先级):

1. **anthropics/skills + obra/superpowers + mattpocock/skills(内容核心,clone 抓取)**。理由:三者合计 73 个 skill,是官方 canonical、社区方法论标杆、知名个人合集的代表作,质量高且风格互异,天然适合「并排对比」叙事;后两者 MIT 可全文展示。注意:anthropics 文档类 skill 为专有 license,产品上需做「frontmatter+摘要+外链」的降级展示。
2. **anthropics/claude-plugins-official 的 marketplace.json(目录与分类骨架)**。理由:现成 314 条结构化条目(name/description/category/author/source),省去自建分类法,还能引出「插件 vs skill」的对比维度。
3. **skills.sh API(热度信号层)**。理由:唯一的公开安装量数据源,免认证;给对比站加 "installs" 排序/徽章,弥补 GitHub stars 粗颗粒问题。

第二梯队(可选):openai/skills、microsoft/azure-skills、prisma/skills、supabase/agent-skills 作为「vendor 官方」分类;wshobson/agents 作「多 harness 市场」分类。**明确排除**:ComposioHQ 的 832 个自动生成 automation skill(灌水、含 `requires: mcp:[rube]` 私货)、awesomeclaude.ai / awesome-skills.com(无 API、内容均回源到上述 repo)。

风险提示:openai/skills 仓库级无 license(全文转载权限不明,建议摘要+外链);anthropics/skills 4 个标注 Proprietary;所有 stars/installs 数字为 2026-09-28 快照,建站时需刷新。

### 参考来源

- https://agentskills.io/specification(官方规范及字段约束)
- https://github.com/anthropics/skills ;https://github.com/openai/skills ;https://github.com/microsoft/azure-skills ;https://github.com/supabase/agent-skills ;https://github.com/prisma/skills
- https://github.com/anthropics/claude-plugins-official(其 `.claude-plugin/marketplace.json`)
- https://github.com/obra/superpowers ;https://github.com/mattpocock/skills ;https://github.com/wshobson/agents ;https://github.com/glittercowboy/get-shit-done(归档前身为 https://github.com/gsd-build/get-shit-done)
- https://skills.sh ;https://github.com/vercel-labs/skills(含 `npx skills add` 文档);API 实测 `https://skills.sh/api/search?q=pdf`
- https://github.com/ComposioHQ/awesome-claude-skills ;https://github.com/VoltAgent/awesome-agent-skills ;https://github.com/hesreallyhim/awesome-claude-code
- https://awesomeclaude.ai/awesome-claude-skills ;https://awesome-skills.com
- 仓库元数据(stars/license/pushed_at):api.github.com,2026-09-28 查询
