"""构建期校验:manifest 结构、指纹一致性、时间点/精选引用完整性。失败即构建失败。"""

REQUIRED_SKILL_FIELDS = {"id", "name", "desc", "source", "source_id", "license",
                         "license_status", "stars", "installs", "lines", "tokens",
                         "fp", "also_seen", "url", "versions"}


def validate_manifest(manifest, bodies):
    """bodies: {指纹: 正文内容}。有问题则抛 ValueError,无问题静默返回。"""
    issues = []
    ids = set()
    for s in manifest.get("skills", []):
        sid = s.get("id", "?")
        missing = REQUIRED_SKILL_FIELDS - s.keys()
        if missing:
            issues.append(f"{sid}: 缺少字段 {sorted(missing)}")
        if sid in ids:
            issues.append(f"{sid}: 重复的 skill id")
        ids.add(sid)
        if s.get("license_status") not in ("full", "degraded"):
            issues.append(f"{sid}: license_status 非法: {s.get('license_status')!r}")
        fp = s.get("fp")
        if s.get("license_status") == "full" and fp not in bodies:
            issues.append(f"{sid}: 全文可比 skill 缺少正文 (fp={fp})")
        if not isinstance(s.get("versions"), list):
            issues.append(f"{sid}: versions 必须是列表")
        for v in s.get("versions") or []:
            if v.get("fp") not in bodies:
                issues.append(f"{sid}: 版本正文缺失 (fp={v.get('fp')})")
            if not v.get("sha") or not v.get("date"):
                issues.append(f"{sid}: 时间点缺少 sha/date")
    for i, pair in enumerate(manifest.get("featured", [])):
        for x in pair:
            if x not in ids:
                issues.append(f"精选组合[{i}] 引用了未知 skill: {x}")
    if not manifest.get("skills"):
        issues.append("manifest 中没有任何收录的 skill")
    if issues:
        raise ValueError("manifest 校验失败:\n" + "\n".join(" - " + i for i in issues))
