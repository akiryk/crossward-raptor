# Account details — History

Historical record; not startup reading. The [handoff](HANDOFF.md) is the
current resume point.

## Orchestration

The human's standing instruction for this epic (2026-11-09), given with
their approval of the EPIC:

> I approve the epic. Please start. I want you to be orchestrator and use
> sub-agents for writing stories and implementing and testing. I want to
> check in only when needed, possibly not until you're at the end of the
> epic. Before we close it out, I'll do extensive visual checks.

So the orchestrating session:

- has the human's delegation (STORY §2) to approve and freeze each
  story's specification and acceptance, after an independent sub-agent
  review of the draft; this includes S2's word lists, which the human
  sees at the final check;
- runs drafting, implementation, testing and independent PR review
  through separate sub-agents, keeping the author and reviewer distinct
  (CODE-REVIEW);
- decides open questions itself and records each under **Decisions for
  the visual check** in the handoff, to report to the human then;
- asks the human only when truly blocked; otherwise, once every story is
  delivered, asks for the visual checks before closeout.
