# Skill Compare

Agent Skills 并排对比站 —— 聚合三大精选内容源约 60+ 个 skill,任选两个横向深读对比(Monaco diff);同一 skill 可沿 commit 时间轴任选两个时间点自比;专有许可 skill 降级展示;Tokyo Night 默认配色 + 六套编辑器主题;中英双语。纯 Python stdlib 管线 + 零构建单文件前端,无任何运行时依赖。

设计稿:[design.pen](design.pen)(v3 四屏)· 渲染图:[design-preview/](design-preview/)

## 快速开始

```bash
# 1) 采集三个内容源(单分支全历史克隆,首次约 10s)
python3 -m pipeline.collect

# 2) 构建(含版本轴提取 + 可选联网辅助数据)
python3 -m pipeline.build --real --out site --fetch-aux

# 3) 本地预览(fetch 需要 http)
python3 -m http.server 8765 -d site
# 打开 http://localhost:8765
```

测试/演示模式(无网络,用 fixtures/ 下 4 个样例):

```bash
python3 -m pipeline.build --fixtures fixtures --out site
```

## 测试

```bash
python3 -m pytest -q
```

唯一正式测试 seam 是 Python 管线(frontmatter 解析、许可分流、同名去重、版本轴提取、manifest 校验);前端为零构建 vanilla JS,以 design-preview/ 渲染图人工验收。

## 架构

```
pipeline/
├── collect.py    # clone/fetch 内容源 + 辅助数据(marketplace 分类、skills.sh 安装量、stars)
├── parse.py      # SKILL.md frontmatter 解析 + 许可分流(宽松许可 → 全文可比)
├── manifest.py   # 遍历收录 + 同名去重(Canonical 优先 / 也见于)+ 指纹
├── versions.py   # 版本轴:per-path commit 历史(日期+短sha),tag 落点标注
├── validate.py   # 构建期 manifest 校验(失败即构建失败)
└── build.py      # 组装单文件站点(manifest 内联 + 正文按指纹 fetch)+ 六主题 CSS
template/index.html   # 前端模板(选择器 / 对比 / 降级 / 版本模式四态单页)
```

## 部署

`.github/workflows/capture.yml` 定时重建并提交 `site/`;`pages.yml` 在 push / capture 完成后把 `site/` 发布到 GitHub Pages。

> **注意**:私有仓库在 GitHub Free 下无法使用 GitHub Pages——需要升级 Pro、或将仓库转为 public。

## 配置

扩源/剔除只改 [pipeline/config.py](pipeline/config.py)(SOURCES / LENIENT_LICENSES / DEFAULT_FEATURED);主题色板见 [design-preview/themes.json](design-preview/themes.json)。
