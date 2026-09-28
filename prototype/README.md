# PROTOTYPE — 对比站骨架(wayfinder #6,用完即弃)

> Three variants of the compare-site skeleton (selector + side-by-side + degraded card + discovery),
> switchable via `?variant=A|B|C`, served as a single static file.

回答的问题(#6):选择器长什么样、降级卡怎么呈现、无矩阵时的 skill 发现方式。

## 跑法

```bash
python3 prototype/build.py          # fixtures -> manifest -> site/index.html
python3 -m http.server 8734 -d prototype/site
# 打开 http://localhost:8734  (?variant=A / B / C,底部悬浮条或 ← → 切换)
```

- 变体 A「顶部双槽」:顶栏两个搜索槽 + 精选组合 chips(发现=精选组合)
- 变体 B「左侧栏」:侧栏按源分组浏览 + 随机按钮(发现=随机对比)
- 变体 C「卡居中」:两张大卡下拉选 + URL 直达提示(发现=无站内入口)

fixture 为拟真样例(名称/描述取自真实 skill,正文为节选),`pdf` 刻意为降级卡样本。
