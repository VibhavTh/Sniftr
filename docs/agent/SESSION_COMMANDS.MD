# Session Commands — ScentlyMax

This file contains the **standard start and end commands** to use in *every* AI coding session  
(Cursor, Claude Code, ChatGPT, etc.).

These commands enforce shared truth, prevent hallucination, and keep project context durable across sessions.

---

## 🔁 Session Start — `{Sync}`

**Use this as the VERY FIRST message in every new session.**

```text

{Sync}: Before responding, read and follow all files under docs/agent/* as the authoritative source of truth. Do not invent anything not present there; if uncertain, ask exactly one clarifying question.

{Save}: Update docs/agent/FILE_MAP.md and WORKFLOW.md and learning-log.md to reflect the new changes
