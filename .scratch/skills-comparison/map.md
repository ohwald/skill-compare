# Map: Skill 对比网站

Labels: wayfinder:map
Effort: skills-comparison

## Destination

一个参考 [phistory](https://github.com/WEIFENG2333/phistory)(phistory.cc)的纯静态「Agent Skills 并排对比」网站:数据来自公开 skill 生态,零构建单页站点,用户任选 2-4 个 skill 并排深读对比,由 GitHub Actions 定时抓取数据并自动发布到 GitHub Pages。地图走完时:数据源、对比维度、交互形态、数据管线、部署方案全部定稿,可直接开工实现。

## Notes

- 领域:Agent Skills(SKILL.md 形态的 agent 能力包)的聚合与并排对比;参考项目的架构是「采集管线 → 结构化 JSON → 单页静态站」。
- 工作目录 `/Users/nux/GitHub/skills-comparison`(空仓库,尚未 git init;实现开工时再初始化)。
- Tracker:本地 markdown(本文件 + `issues/`);无 git,研究类 subagent 直接把结论写进各自 ticket 文件,由 charting 会话统一回写 Decisions-so-far,避免并发写 map。
- **Tracker 迁移待办**:2026-09-28 setup 已把本仓库 tracker 定为 GitHub Issues(见 `docs/agents/issue-tracker.md`);仓库尚未 git init、未推远端。等 GitHub 仓库建好后,把本 map 与 4 张 tickets 迁移为 GitHub issue 形态(map 贴 `wayfinder:map` 标签、tickets 挂为 sub-issues、用原生 dependencies 表达 blocking),`.scratch/` 版本随之封存;迁移前新 ticket 仍写在本地。
- HITL ticket 按 Type 调用对应 skill:grilling → `grilling` + `domain-modeling`;prototype → `prototype`;research → `research`。
- 已定决策(用户 2026-09-28 拍板):公开生态数据源、仅并排对比(无矩阵)、纯静态零构建、GitHub Pages 自动部署。
- 竞品扫描(2026-09-28,逐一实测):「任选 2-4 个 skill 并排深读」的公开站点不存在——skills.sh 只能单个查看且正文折叠、无对比;agent-skills-hub 的 /compare/ 是预设配对的元数据对比;官方仓库无网页 UI。niche 空白,路线成立。可复用资产:skills.sh 公开 API(含安装量)、vercel-labs/skills 的 SKILL.md/frontmatter 解析逻辑(MIT)。

## Decisions so far

<!-- 一行一条,只放 gist,detail 在 ticket 里 -->

- [Research: 公开 skill 数据源盘点](issues/01-research-public-skill-sources.md): 核心内容源三个(anthropics/skills 20 个但文档类专有许可需降级展示、obra/superpowers 15、mattpocock/skills 38,均 MIT 级)+ claude-plugins-official marketplace.json 314 条做目录骨架 + skills.sh API 做热度信号;抓取用 clone --depth 1(内容)+ GitHub API(元数据);ComposioHQ 灌水源排除。
- [Research: phistory 实现细节](issues/02-research-phistory-internals.md): Python 采集 + stdlib 构建的单文件站点;manifest 内联 `<script type="application/json">`、正文按 ?v=hash 运行时 fetch;diff 用 Monaco createDiffEditor,统计构建期预计算;Actions 每小时采集、workflow_run 触发 Pages。架构可直接套用,采集管线与 schema 需为横向对比重写。

## Not yet specified

- 无矩阵视图时「发现 skill」的补充方式(分类聚合页?随机推荐?)——等原型票的反响再定。
- skill 署名/版权/来源的展示规范——依赖数据源选型的结论。
- 数据规模上限与前端性能(几百 vs 几千个 skill 的加载策略)。

## Out of scope

- 矩阵总览视图:用户明确选择「仅并排对比」。
- skill 跨版本历史快照对比(phistory 的历史维度):静态生态的 skill 没有版本线,v1 不做。
- skill 原文翻译:内容保持原文,UI 语言在维度票里定。
