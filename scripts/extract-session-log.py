"""Turn a Claude Code session transcript (.jsonl) into a chronological Markdown log.

Usage: python -I extract_log.py <transcript.jsonl> <out.md>
Only user prompts, assistant text and tool *inputs* are kept; tool outputs and account ids are dropped.
A tool call is marked "error" when its result came back with is_error.
"""
import json
import re
import sys
from datetime import datetime, timezone, timedelta

src, out = sys.argv[1], sys.argv[2]
PST = timezone(timedelta(hours=-8))


HOME = re.compile(r"C:\\\\Users\\\\ruoyu|C:\\Users\\ruoyu|/c/Users/ruoyu", re.I)


def clip(s, n):
    s = HOME.sub("~", re.sub(r"\s+", " ", s).strip())
    return s if len(s) <= n else s[: n - 1] + "…"


def ts(o):
    t = o.get("timestamp")
    if not t:
        return ""
    return datetime.fromisoformat(t.replace("Z", "+00:00")).astimezone(PST).strftime("%m-%d %H:%M")


records = []
for line in open(src, encoding="utf-8"):
    try:
        records.append(json.loads(line))
    except json.JSONDecodeError:
        pass

errors = set()
for o in records:
    if o.get("type") == "user" and isinstance(o.get("message", {}).get("content"), list):
        for c in o["message"]["content"]:
            if c.get("type") == "tool_result" and c.get("is_error"):
                errors.add(c.get("tool_use_id"))

rows = []
n_tool = 0
for o in records:
    if o.get("isSidechain"):
        continue
    t, msg = o.get("type"), o.get("message", {})
    content = msg.get("content")
    if t == "user":
        if isinstance(content, str):
            text = re.sub(r"<pasted_content[^>]*>.*?</pasted_content[^>]*>", "[pasted: assignment / proposals]", content, flags=re.S)
            text = re.sub(r"<[^>]+>", "", text)
            if text.strip():
                rows.append(f"\n### {ts(o)} · USER\n> {clip(text, 400)}\n")
        elif isinstance(content, list):
            for c in content:
                if c.get("type") == "text" and not c["text"].startswith("<"):
                    rows.append(f"\n### {ts(o)} · USER\n> {clip(c['text'], 400)}\n")
    elif t == "assistant" and isinstance(content, list):
        for c in content:
            if c.get("type") == "text" and c["text"].strip():
                rows.append(f"- {ts(o)} **Claude:** {clip(c['text'], 300)}")
            elif c.get("type") == "tool_use":
                n_tool += 1
                inp = c.get("input", {})
                desc = inp.get("description") or ""
                key = inp.get("command") or inp.get("file_path") or inp.get("pattern") or inp.get("skill") or inp.get("query") or ""
                flag = " ⚠️ error" if c.get("id") in errors else ""
                detail = f" — {clip(desc, 90)}" if desc else ""
                rows.append(f"- {ts(o)} `{c['name']}`{detail}: `{clip(str(key), 140)}`{flag}")

with open(out, "w", encoding="utf-8", newline="\n") as f:
    f.write("# Raw session log (auto-extracted)\n\n")
    f.write(f"Source: Claude Code transcript, {n_tool} tool calls. Tool outputs omitted. Times are PST.\n")
    f.write("\n".join(rows))
    f.write("\n")
print(n_tool, "tool calls,", len(rows), "rows")
