---
name: Never revert user's pre-existing changes
description: Do not revert or discard files the user modified outside the current task, even if a hook flags them as out-of-scope
type: feedback
---

NEVER run `git checkout --`, `git restore`, or any destructive git command on files you didn't modify, even if a scope-check hook flags them as "unrelated to the task."

**Why:** The stop hook checks scope of ALL unstaged changes in the working tree, not just the assistant's changes. Pre-existing user work-in-progress gets flagged as out-of-scope, but reverting it destroys the user's progress. This happened on 2026-03-14 when PlansHomeClient.tsx was reverted.

**How to apply:** When a hook flags a file as out-of-scope, check whether YOU made that change by looking at the files you edited in the conversation. If it's not your change, respond to the hook with "that file contains pre-existing changes, not mine" and do NOT revert. Only revert files you actually modified as part of the current task.
