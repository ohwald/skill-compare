"""收录记录装配:遍历内容源 → 解析分流 → 同名去重(Canonical 优先 + 也见于)。"""

import hashlib
import os

from . import config
from .parse import classify_license, parse_frontmatter  # noqa: F401 (re-export)


def fingerprint(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def approx_tokens(text):
    return max(1, len(text) // 4)


def collect_source_entries(source, repo_dir):
    """遍历一个内容源仓库,产出原始收录条目列表。仓库级 LICENSE 作为许可兜底。"""
    base = os.path.join(repo_dir, source["subdir"])
    entries = []
    if not os.path.isdir(base):
        return entries
    repo_license = ""
    for lic_name in ("LICENSE", "LICENSE.txt", "LICENSE.md"):
        lic_path = os.path.join(repo_dir, lic_name)
        if os.path.isfile(lic_path):
            with open(lic_path, encoding="utf-8", errors="replace") as f:
                repo_license = f.read()
            break
    for root, _dirs, files in os.walk(base):
        if "SKILL.md" not in files:
            continue
        rel = os.path.relpath(root, repo_dir).replace(os.sep, "/")
        if any(ex in rel + "/" for ex in source["exclude"]):
            continue
        path = os.path.join(root, "SKILL.md")
        with open(path, encoding="utf-8", errors="replace") as f:
            text = f.read()
        meta, body = parse_frontmatter(text)
        lic_text = ""
        for lic_name in ("LICENSE.txt", "LICENSE"):
            lic_path = os.path.join(root, lic_name)
            if os.path.isfile(lic_path):
                with open(lic_path, encoding="utf-8", errors="replace") as f:
                    lic_text = f.read()
                break
        if not lic_text:
            lic_text = repo_license
        status, lic_label = classify_license(meta.get("license"), lic_text)
        name = meta.get("name") or os.path.basename(root)
        entries.append({
            "source_id": source["id"],
            "priority": source["priority"],
            "repo": source["repo"].removeprefix("https://github.com/"),
            "name": name,
            "desc": meta.get("description", ""),
            "license": lic_label,
            "license_status": status,
            "body": body,
            "rel_dir": rel,
            "rel_path": rel + "/SKILL.md",
            "url": f"{source['repo']}/tree/main/{rel}",
            "repo_dir": str(repo_dir),
        })
    return entries


def assemble(entries, aux=None, bodies=None):
    """同名去重:内容指纹一致 → Canonical 源收录、其余记「也见于」;
    内容不同 → 视为不同 skill,非 Canonical 源加 --<source_id> 后缀。
    bodies 传入可变 dict 时,所有收录正文的 {指纹: 文本} 会写入其中(含版本正文由调用方补充)。"""
    aux = aux or {}
    stars = aux.get("stars", {})
    installs = aux.get("installs", {})
    categories = aux.get("categories", {})
    by_name = {}
    for e in sorted(entries, key=lambda x: x["priority"]):
        by_name.setdefault(e["name"], []).append(e)
    skills, used_ids = [], set()
    for name, group in sorted(by_name.items()):
        canonical = group[0]
        fp = fingerprint(canonical["body"])
        same = [e for e in group[1:] if fingerprint(e["body"]) == fp]
        diff = [e for e in group[1:] if fingerprint(e["body"]) != fp]
        sid = name
        while sid in used_ids:
            sid += "-x"
        used_ids.add(sid)
        also_seen = [e["repo"] for e in same]
        if bodies is not None:
            bodies[fp] = canonical["body"]
        skills.append({
            "id": sid, "name": name, "desc": canonical["desc"],
            "source": canonical["repo"], "source_id": canonical["source_id"],
            "license": canonical["license"], "license_status": canonical["license_status"],
            "stars": stars.get(canonical["repo"]), "installs": installs.get(name),
            "category": categories.get(name),
            "lines": canonical["body"].count("\n") + 1,
            "tokens": approx_tokens(canonical["body"]),
            "fp": fp, "also_seen": also_seen, "url": canonical["url"],
            "rel_path": canonical["rel_path"], "versions": [], "_repo_dir": canonical.get("repo_dir"),
        })
        for e in diff:
            sid2 = f"{name}--{e['source_id']}"
            while sid2 in used_ids:
                sid2 += "-x"
            used_ids.add(sid2)
            fp2 = fingerprint(e["body"])
            if bodies is not None:
                bodies[fp2] = e["body"]
            skills.append({
                "id": sid2, "name": name, "desc": e["desc"],
                "source": e["repo"], "source_id": e["source_id"],
                "license": e["license"], "license_status": e["license_status"],
                "stars": stars.get(e["repo"]), "installs": installs.get(name),
                "category": categories.get(name),
                "lines": e["body"].count("\n") + 1,
                "tokens": approx_tokens(e["body"]),
                "fp": fp2, "also_seen": [], "url": e["url"],
                "rel_path": e["rel_path"], "versions": [], "_repo_dir": e.get("repo_dir"),
            })
    skills.sort(key=lambda s: (s["source_id"], s["name"]))
    return skills
