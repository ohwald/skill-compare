"""内容源与辅助数据配置(扩源只改这里)。"""

# 宽松许可允许全文转载(全文可比);其余(含缺失/自定义)一律降级展示。
LENIENT_LICENSES = {
    "mit", "isc", "unlicense", "0bsd", "cc-by-4.0", "cc0-1.0",
    "apache", "apache-2.0", "apache license 2.0", "apache license, version 2.0",
    "bsd", "bsd-2-clause", "bsd-3-clause", "bsd 2-clause", "bsd 3-clause",
}

# 仓库级 LICENSE 文本中出现这些关键词即视为宽松许可。
LENIENT_REPO_KEYWORDS = ("apache license", "mit license", "bsd", "gnu lesser", "isc license")

# v1 收录的三个内容源(priority 小者优先为 Canonical 源)。
SOURCES = [
    {
        "id": "anthropics",
        "repo": "https://github.com/anthropics/skills",
        "branch": "main",
        "subdir": "skills",
        "priority": 1,
        "exclude": [],
    },
    {
        "id": "superpowers",
        "repo": "https://github.com/obra/superpowers",
        "branch": "main",
        "subdir": "skills",
        "priority": 2,
        "exclude": [],
    },
    {
        "id": "mattpocock",
        "repo": "https://github.com/mattpocock/skills",
        "branch": "main",
        "subdir": "skills",
        "priority": 3,
        # 质量分层:半成品与废弃目录不收录(#2/#4 决议)。
        "exclude": ["in-progress/", "deprecated/"],
    },
]

AUX = {
    "marketplace_json": "https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/.claude-plugin/marketplace.json",
    "skills_sh_search": "https://skills.sh/api/search?q={query}",
    "github_repo_api": "https://api.github.com/repos/{repo}",
}

DEFAULT_FEATURED = [
    ["frontend-design", "test-driven-development"],
    ["pdf", "frontend-design"],
]
