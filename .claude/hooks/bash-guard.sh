#!/bin/bash
# PreToolUse guard for the Bash tool.
#
# .claude/settings.json sets defaultMode to bypassPermissions, so this
# hook -- not the allow/deny arrays there -- is the real enforcement
# boundary. Those arrays stay only as documentation of intent; nothing
# reads them for enforcement anymore.
#
# Default is allow. Deny only the specific patterns below, each with a
# reason naming what was blocked and why.

CMD=$(jq -r '.tool_input.command')

allow() {
  printf '%s' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
  exit 0
}

deny() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}' "$1"
  exit 0
}

# Heredoc bodies (this repo's own commit/PR message convention) are
# prose, not executable arguments -- a commit message that merely
# discusses one of the patterns below isn't the command it names. Real
# dangerous commands don't need a heredoc to run, so skip all matching
# below rather than false-positive on quoted text.
if printf '%s' "$CMD" | grep -q '<<'; then
  allow
fi

# .env files: matched anywhere in the command, since the sensitive
# argument can appear in any position (e.g. "cp x .env").
if printf '%s' "$CMD" | grep -qE '(^|[[:space:]/])\.env(\.[^[:space:]/]*)?([[:space:]/]|$)'; then
  deny 'Blocked: command references a .env file. Bash may not read, write, or overwrite dotenv files in this repo (AGENTS.md).'
fi

# Everything below is matched per subcommand: flatten newlines to ";" so
# a multi-line script is checked the same way as a single-line one, then
# anchor each pattern to a subcommand boundary (start of string, or right
# after ;, &, or |) so a flag or word belonging to one piped/chained
# command can't falsely match a different one nearby.
CMD_FLAT=$(printf '%s' "$CMD" | tr '\n' ';')
BOUNDARY='(^|[;&|])[[:space:]]*'

# rm gets a looser search than the checks below -- "rm" as a standalone
# word anywhere, not just at a subcommand boundary -- since piping into
# it (e.g. `find ... | xargs rm -rf`) is a common, real idiom that a
# boundary-anchored check would miss. Recursive and force can each be
# spelled several ways and combined or separate (-rf, -fr, -r -f,
# --recursive --force), so both are checked independently within the
# same rm invocation rather than as one fixed string.
RM_SPAN=$(printf '%s' "$CMD_FLAT" | grep -oE '(^|[[:space:];&|])rm[[:space:]]+[^;&|]*' | head -1)
if [ -n "$RM_SPAN" ] \
  && printf '%s' "$RM_SPAN" | grep -qE '(^|[[:space:]])(-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)([[:space:]]|$)' \
  && printf '%s' "$RM_SPAN" | grep -qE '(^|[[:space:]])(-[a-zA-Z]*f[a-zA-Z]*|--force)([[:space:]]|$)'; then
  deny 'Blocked: rm with both recursive and force flags is never run autonomously -- can destroy work with no confirmation (AGENTS.md).'
fi

if printf '%s' "$CMD_FLAT" | grep -qE "${BOUNDARY}git[[:space:]]+push[^;&|]*[[:space:]](-f|--force(-with-lease)?)([[:space:]]|\$)"; then
  deny 'Blocked: force-push rewrites remote history and can destroy work other people have pushed (AGENTS.md).'
fi

if printf '%s' "$CMD_FLAT" | grep -qE "${BOUNDARY}npx[[:space:]]+prisma[[:space:]]+migrate[[:space:]]+reset"; then
  deny 'Blocked: prisma migrate reset drops the database (AGENTS.md).'
fi

if printf '%s' "$CMD_FLAT" | grep -qE "${BOUNDARY}npx[[:space:]]+prisma[[:space:]]+db[[:space:]]+push[^;&|]*--force-reset"; then
  deny 'Blocked: prisma db push --force-reset drops the database (AGENTS.md).'
fi

if printf '%s' "$CMD_FLAT" | grep -qE "${BOUNDARY}gh[[:space:]]+repo[[:space:]]+delete"; then
  deny 'Blocked: gh repo delete permanently deletes a GitHub repository (AGENTS.md).'
fi

if printf '%s' "$CMD_FLAT" | grep -qE "${BOUNDARY}gh[[:space:]]+api"; then
  deny 'Blocked: gh api is an unrestricted GitHub API escape hatch, bypassing the scoped gh subcommands this repo allows (AGENTS.md).'
fi

allow
