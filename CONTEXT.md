# Skill 对比网站

聚合公开生态中的 Agent Skills,让用户任选若干个并排深读对比的纯静态网站。

## Language

**Skill(Agent Skill)**:
以 SKILL.md 为载体的 agent 能力包,含 YAML frontmatter 与 Markdown 正文。
_Avoid_: 插件、命令(在 marketplace 里是与 skill 并列的其他形态)

**内容源**:
提供 SKILL.md 原文的来源仓库。v1 收录三个:anthropics/skills、obra/superpowers、mattpocock/skills。
_Avoid_: 数据源(泛指时与辅助数据层混淆)

**辅助数据层**:
不提供 skill 原文、只为分类与热度补数据的外部来源:marketplace.json(分类骨架)与 skills.sh(安装量)。

**收录**:
一个 skill 进入站内数据集的状态。收录不等于可全文展示。

**全文可比**:
许可宽松(MIT/Apache 等)的收录 skill:正文可被转载并参与并排对比。
_Avoid_: 可收录

**降级展示**:
无宽松许可(专有或未声明)的收录 skill 的展示方式:元数据 + 官方摘要 + 来源外链,不渲染原文;在选择器中带「专有·仅摘要」标记,可被选入对比。
_Avoid_: 排除、屏蔽

**Canonical 源**:
skill 作者自己的仓库;同一 skill 多源出现时的唯一归属。
_Avoid_: 首发源、主仓

**也见于**:
某 skill 在非 canonical 源中的出现位置记录,不生成独立卡片。

**精选组合**:
策展的推荐对比对(横向:两个 skill;或自比:同一 skill 的两个版本),首屏与选择器旁直接可达。
_Avoid_: 推荐位、热门

**版本模式**:
双槽选中同一 skill 时自动进入的自比状态:两槽变为该 skill commit 时间轴上的两个时间点选择器,默认最早 vs 最新。
_Avoid_: 历史模式、时间轴页

**时间点**:
版本模式下可被选入对比槽的快照,标识为「提交日期 + 短 sha」;落在上游 tag 上的时间点附加 tag 名标注。
_Avoid_: 版本号(语义留给上游 tags)
