---
name: audit
description: Check the project's accumulated docs and code against each other and report drift. Report-only — fixes nothing. Invoke as /audit, optionally with a scope note.
---

# Audit

Scope note (optional): $ARGUMENTS

You are checking whether this project's documents and code still agree with each
other. You are the layer `npm run verify` cannot be: verify proves the tests
pass, not that they were the right tests, nor that the docs describing them are
still true.

## Rules

**Report only. Fix nothing.** Do not edit a file, stage anything, or commit. A
finding is destroyed by fixing it — the human needs to judge whether it was real
before it disappears. If you find something urgent, say so loudly and still do
not touch it.

**Run this in a session that did not produce the work.** If this session wrote or
edited any of the files under audit, stop and say so. An author auditing their
own output closes the gate on nothing.

**Cite evidence for every finding.** Quote the line, name the file, give the
number, show the command output. "Checked, looks fine" is not a finding and not
a clearance — omit it. A reader who does not trust you should be able to verify
each finding without repeating your work.

**Never restate spec content as fact.** The epic and story files are the source
of truth; this report points at them. The moment this report asserts a spec
detail on its own authority, there is a third place truth lives and it will
drift.

**Do not stop at a list.** The classes named below are illustrations of what has
gone wrong here before, not the scope of the job. Report anything that does not
hold up, including things no list anticipated.

## What to read

1. The epic(s) under `docs/epics/`.
2. Every story file under `docs/stories/`.
3. The handoff(s) under `docs/handoffs/`.
4. `AGENTS.md` (and `CLAUDE.md` if it is not the same file).
5. `.claude/settings.json` and everything under `.claude/skills/`.
6. The engine source and tests under `src/engine/`.
7. `git log --oneline` and `git status`.

## Classes of drift seen in this project

Illustrative. Report anything else you find.

- **Arithmetic that does not add up.** Counts, indices, and worked examples in
  story acceptance criteria. Recompute them; do not trust them.
- **Claims about the repo that the repo disproves.** A doc saying a path is
  tracked when `git ls-files` says otherwise; a stated build order that
  `git log` contradicts.
- **Duplicated or skipped story identifiers.** Two stories claiming the same
  letter or number; a gap in the sequence with no explanation.
- **A spec detail stated in two places that now differ.** The epic and a story
  file disagreeing about a signature, a return type, or an ordering rule.
- **Stale next-steps and status sections.** Documents describing work as
  upcoming that is already committed.
- **Scope that appeared without a story.** An exported function, type, or file
  in `src/engine/` that no story asked for.
- **Special-case branches.** Implementation code handling one named test case
  where the general rule would have covered it. This passes the gate and no
  automation catches it.
- **Guardrails that match nothing.** A lint rule, a permission entry, or a
  precondition check that cannot fire against the current tree. A rule proving
  nothing is worse than no rule, because it reads as protection.

## Handoff pruning

The handoff's decision log exists to hold reasoning that lives nowhere else.
An entry whose rule is now enforced by a test, a type, or a lint rule is
commentary — the mechanism remembers, so the prose does not have to.

An entry may be only partly spent: the rule is enforced, but the same entry also
carries a consequence for work not yet built. Report those as **trim**, naming
which half survives, rather than as candidates for deletion.

For each decision entry, report whether it is still load-bearing or is now
enforced mechanically, and name the enforcing test, type, or rule. List
candidates for deletion. Do not delete them.

## Report format

Group findings by severity, most serious first:

- **Wrong** — a statement contradicted by evidence. Give the claim, the
  contradicting evidence, and where each lives.
- **Stale** — was true, no longer is.
- **Unenforced** — a rule stated in prose that no mechanism backs, where one
  is available.
- **Prunable** — decision-log entries now covered by a mechanism.

End with a short list of anything you were unable to check and why. An audit
that reports full coverage it did not have is worse than one that names its
gaps.
