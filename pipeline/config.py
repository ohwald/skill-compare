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
    {
        "id": "emilkowalski",
        "repo": "https://github.com/emilkowalski/skills",
        "branch": "main",
        "subdir": "skills",
        "priority": 4,
        "exclude": [],
    },
    # ---- 2026-10-04 扩源(尽调实测见 issue #8 评论)----
    {
        "id": "azure",
        "repo": "https://github.com/microsoft/azure-skills",
        "branch": "main",
        "subdir": "skills",
        "priority": 5,
        "exclude": [],
    },
    {
        "id": "wshobson",
        "repo": "https://github.com/wshobson/agents",
        "branch": "main",
        # 两层嵌套:plugins/<plugin>/skills/<skill>/
        "subdir": "plugins",
        "priority": 6,
        "exclude": [],
    },
    {
        "id": "kdense",
        "repo": "https://github.com/K-Dense-AI/scientific-agent-skills",
        "branch": "main",
        "subdir": "skills",
        "priority": 7,
        "exclude": ["tests/"],
    },
    {
        "id": "openai",
        "repo": "https://github.com/openai/skills",
        "branch": "main",
        "subdir": "skills",
        "priority": 8,
        # .system 为 Codex 内置系统技能;无仓库级 license → 全体降级展示
        "exclude": ["skills/.system/"],
    },
    {
        "id": "addyosmani",
        "repo": "https://github.com/addyosmani/agent-skills",
        "branch": "main",
        "subdir": "skills",
        "priority": 9,
        "exclude": [],
    },
    {
        "id": "prisma",
        "repo": "https://github.com/prisma/skills",
        # 顶层平铺,无 skills/ 前缀
        "branch": "main",
        "subdir": ".",
        "priority": 10,
        "exclude": ["prisma-database-setup"],
    },
    {
        "id": "baoyu",
        "repo": "https://github.com/JimLiu/baoyu-skills",
        "branch": "main",
        "subdir": "skills",
        "priority": 11,
        # 逆向工程 API 的危险变体,合规存疑
        "exclude": ["baoyu-danger-"],
    },
    {
        "id": "supabase",
        "repo": "https://github.com/supabase/agent-skills",
        "branch": "main",
        "subdir": "skills",
        "priority": 12,
        "exclude": [],
    },
    # ---- 2026-10-05 hub 发现扩源(52 库尽调,星标/官方/安装量驱动)----
    {
        "id": "caveman",
        "repo": "https://github.com/JuliusBrussee/caveman",
        "branch": "main",
        "subdir": "skills",
        "priority": 13,
        "exclude": ["plugins/", "engine/", "dist/", "src/"],
    },
    {
        "id": "taste-skill",
        "repo": "https://github.com/Leonxlnx/taste-skill",
        "branch": "main",
        "subdir": "skills",
        "priority": 14,
        "exclude": ["research/"],
    },
    {
        "id": "understand-anything",
        "repo": "https://github.com/Egonex-AI/Understand-Anything",
        "branch": "main",
        "subdir": "understand-anything-plugin/skills",
        "priority": 15,
        "exclude": [],
    },
    {
        "id": "impeccable",
        "repo": "https://github.com/pbakaus/impeccable",
        "branch": "main",
        # 单技能 ×16 平台副本:canonical 在 .claude/skills/
        "subdir": ".claude/skills",
        "priority": 16,
        "exclude": [],
    },
    {
        "id": "humanizer",
        "repo": "https://github.com/blader/humanizer",
        "branch": "main",
        "subdir": ".",
        "priority": 17,
        "exclude": [],
    },
    {
        "id": "marketingskills",
        "repo": "https://github.com/coreyhaines31/marketingskills",
        "branch": "main",
        "subdir": "skills",
        "priority": 18,
        "exclude": [],
    },
    {
        "id": "pm-skills",
        "repo": "https://github.com/phuryn/pm-skills",
        "branch": "main",
        "subdir": "skills",
        "priority": 19,
        "exclude": [],
    },
    {
        "id": "jeffallan",
        "repo": "https://github.com/Jeffallan/claude-skills",
        "branch": "main",
        "subdir": "skills",
        "priority": 20,
        "exclude": [],
    },
    {
        "id": "nvidia",
        "repo": "https://github.com/NVIDIA/skills",
        "branch": "main",
        "subdir": "skills",
        "priority": 21,
        "exclude": ["plugins/"],
    },
    {
        "id": "stitch",
        "repo": "https://github.com/google-labs-code/stitch-skills",
        "branch": "main",
        "subdir": "plugins/stitch-build/skills",
        "priority": 22,
        "exclude": [],
    },
    {
        "id": "vercel",
        "repo": "https://github.com/vercel-labs/agent-skills",
        "branch": "main",
        "subdir": "skills",
        "priority": 23,
        "exclude": [],
    },
    {
        "id": "firebase",
        "repo": "https://github.com/firebase/agent-skills",
        "branch": "main",
        "subdir": "skills",
        "priority": 24,
        "exclude": [],
    },
    {
        "id": "khazix",
        "repo": "https://github.com/KKKKhazix/khazix-skills",
        "branch": "main",
        "subdir": ".",
        "priority": 25,
        "exclude": [],
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
