"""版本轴:从内容源仓库提取单个 SKILL.md 的 commit 历史(时间点 = 日期 + 短 sha)。

注意:不能用 `git log -- path`——路径简化会把「未触碰该路径的 commit」(含带 tag 的
空 commit)整个吞掉,tag 语义随之丢失。这里取全量 log 并自行按路径过滤。
"""

import subprocess

from .manifest import fingerprint


def _git(repo, *args):
    r = subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=True, check=True)
    return r.stdout


def load_tags(repo):
    """返回 {sha: [tag 名, …]},annotated tag 同时映射到打标 commit(peeled)。"""
    tags = {}
    out = _git(repo, "for-each-ref", "refs/tags",
               "--format=%(refname:short)%09%(objectname)%09%(*objectname)")
    for line in out.splitlines():
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        name, sha = parts[0], parts[1].strip()
        peeled = parts[2].strip() if len(parts) > 2 else ""
        for s in filter(None, (sha, peeled)):
            tags.setdefault(s, []).append(name)
    return tags


def _log_entries(repo):
    """全量 commit,新 → 旧:[(sha, date, [touch 过的文件路径])],含空 commit。
    输出中 commit 头行含 tab(sha\\tdate),文件行不含 tab,以此区分。"""
    out = _git(repo, "log", "--format=%H%x09%ad", "--date=short", "--name-only")
    entries, cur = [], None
    for line in out.splitlines():
        if not line.strip():
            continue
        if "\t" in line:
            if cur:
                entries.append(cur)
            sha, _, date = line.partition("\t")
            cur = {"sha": sha, "date": date, "files": []}
        elif cur is not None:
            cur["files"].append(line.strip())
    if cur:
        entries.append(cur)
    return entries


def extract_versions(repo, rel_path, tags=None, max_versions=60):
    """返回某 SKILL.md 的时间点列表(旧 → 新);相邻同内容指纹去重;
    去重跳过的 commit 或未触碰该路径的 commit,其 tag 并入最近一个保留时间点。"""
    tags = tags if tags is not None else load_tags(repo)
    newest_first, last_fp, pending = [], None, set()
    for e in _log_entries(repo):
        commit_tags = tags.get(e["sha"], [])
        touches = rel_path in e["files"]
        if not touches:
            pending.update(commit_tags)
            continue
        try:
            content = _git(repo, "show", f'{e["sha"]}:{rel_path}')
        except subprocess.CalledProcessError:
            pending.update(commit_tags)
            continue
        fp = fingerprint(content)
        if fp == last_fp:
            pending.update(commit_tags)
            continue
        last_fp = fp
        newest_first.append({"sha": e["sha"][:10], "date": e["date"], "fp": fp,
                             "lines": content.count("\n") + 1,
                             "tags": sorted(set(commit_tags) | pending)})
        pending = set()
        if len(newest_first) >= max_versions:
            break
    return list(reversed(newest_first))
