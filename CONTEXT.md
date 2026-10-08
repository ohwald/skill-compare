# Skill History(单库历史对比)

选一个 skill → 浏览它的提交时间轴 → 选两个时间点 → 并排 diff。纯静态网站,管线每日采集公开生态的 Agent Skills。2026-10-05 起产品收敛为这一个形态,跨 skill 对比已移除(见 `docs/adr/0001-single-skill-history-only.md`);设计基准 design.pen v4·2。

## Language

**Skill(Agent Skill)**:
以 SKILL.md 为载体的 agent 能力包,含 YAML frontmatter 与 Markdown 正文。
_Avoid_: 插件、命令(在 marketplace 里是与 skill 并列的其他形态)

**内容源**:
提供 SKILL.md 原文的来源仓库,清单见 `pipeline/config.py` 的 SOURCES。
_Avoid_: 数据源(泛指时与辅助数据层混淆)

**辅助数据层**:
不提供 skill 原文、只为分类与热度补数据的外部来源:marketplace.json(分类骨架)与 skills.sh(安装量)。

**收录**:
一个 skill 进入站内数据集的状态。收录不等于可全文展示。

**全文可比**:
许可宽松(MIT/Apache 等)的收录 skill:正文可被转载并参与历史对比。
_Avoid_: 可收录

**降级展示**:
无宽松许可(专有或未声明)的收录 skill 的展示方式:元数据 + 官方摘要 + 来源外链,不渲染原文;在选择器中带「专有·仅摘要」标记。
_Avoid_: 排除、屏蔽

**Canonical 源**:
skill 作者自己的仓库;同一 skill 多源出现时的唯一归属。
_Avoid_: 首发源、主仓

**也见于**:
某 skill 在非 canonical 源中的出现位置记录,不生成独立卡片。

**时间轴**:
站内的导航中枢:当前 skill 的提交历史轴。刻度按提交日期比例定位(不是按版本序号均分);落上游 tag 的提交显示 tag 标签;双柄拖动选取两个时间点并自动锚定最近提交;支持快捷范围(7/14/30/180 天)、缩放与平移、hover 反馈。
_Avoid_: 版本模式、双槽滑杆、按序号均分的滑杆

**时间点**:
时间轴上可被锚定的快照,标识为「提交日期 + 短 sha」;落在上游 tag 上的时间点附加 tag 标签。
_Avoid_: 版本号(语义留给上游 tags)

**基线柄 / 对比柄**:
时间轴的两个可拖动端点:基线(较早侧)与对比(较晚侧);两柄锚定的提交即 diff 的左右两侧。

**变更规模(+N −M)**:
git 风格行级差异统计,三处同一语言:版本下拉每项相对前驱、时间轴区间累计、章节角标。

**精选组合**:
策展的自比对推荐(同一 skill 的两个值得对比的版本),首屏与选择器旁直达。
_Avoid_: 推荐位、热门、横向组合

**两两对比(已废弃)**:
跨 skill 横向对比与 A/B 双槽交互,2026-10-05 移除(`docs/adr/0001-single-skill-history-only.md`)。不得在 UI、模板、路由或文档中重新引入;代码里的 slot/mode 残留视为待清理债务。
_Avoid_: 模式切换、恢复双槽
