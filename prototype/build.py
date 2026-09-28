#!/usr/bin/env python3
"""PROTOTYPE: fixtures -> manifest -> single-file site. Throwaway (wayfinder #6).

生产管线的形状预演:扫描目录 -> 解析 frontmatter -> license 分流 -> manifest 注入模板。
原型里正文直接内联 manifest(仅 4 个样例);生产改为「元数据内联 + 正文按 fingerprint fetch」。
"""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
FIX = ROOT / "fixtures"
OUT = ROOT / "site"
FM_RE = re.compile(r"^---\n(.*?)\n---\n", re.S)


def parse_skill(md: str):
    m = FM_RE.match(md)
    fm, body = {}, md
    if m:
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                fm[k.strip()] = v.strip().strip('"')
        body = md[m.end():]
    return fm, body


def main():
    skills = []
    for d in sorted(p for p in FIX.iterdir() if p.is_dir()):
        fm, body = parse_skill((d / "SKILL.md").read_text())
        meta = json.loads((d / "meta.json").read_text())
        skills.append({
            "id": d.name,
            "name": fm.get("name", d.name),
            "description": fm.get("description", ""),
            "source": meta["source"],
            "license": fm.get("license", "undisclosed"),
            "license_status": meta["license_status"],  # full | degraded
            "summary": meta["summary"],
            "installs": meta["installs"],
            "stars": meta["stars"],
            "url": meta["url"],
            "lines": body.count("\n") + 1,
            "tokens": max(1, len(body) // 4),
            "fingerprint": hashlib.sha256(body.encode()).hexdigest()[:16],
            "body": body,
        })
    manifest = {
        "skills": skills,
        "featured": [["frontend-design", "test-driven-development"], ["pdf", "frontend-design"]],
        "generated": "PROTOTYPE (wayfinder #6)",
    }
    tpl = (ROOT / "template.html").read_text()
    payload = json.dumps(manifest, ensure_ascii=False).replace("</", "<\\/")
    html = tpl.replace("__MANIFEST__", payload)
    OUT.mkdir(exist_ok=True)
    (OUT / "index.html").write_text(html)
    print(f"PROTOTYPE build ok: {len(skills)} skills -> {OUT / 'index.html'}")


if __name__ == "__main__":
    main()
