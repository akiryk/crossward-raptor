# Story S10 — Current collaborators spacing

Approved by the human's local-testing request, 2026-11-14: triple the gap
between the email form and Current Collaborators from 12px to 36px.

## Decisions and scope

For dialogs with existing collaborators, add 24px top padding to the list
section, supplementing the modal's existing 12px spacing. Preserve the
heading's typography, member rows, invitation-only/empty states and all
dialog behavior. No data, permissions, server actions or other layout changes.

## Acceptance

The fresh dialog's form-to-heading gap is 36px when members exist.
Existing collaborator-management browser acceptance remains unchanged.
No new test suite for this reversible spacing adjustment.

## Repo paths

`src/components/puzzle/CollaboratorsDialog.tsx`; this specification; epic handoff.

## Definition of Done

Clean-checkout `npm run verify` exits 0; directly affected collaborator-management
browser suite passes under the integration-branch exception and guarded local
test reset standing grant. Keep HEAD stable during browser build/run. Story
branch and independently reviewed PR into `epic/24-collaboration`, configured
CI passing, local dev restored. No main, production migrations or Vercel settings.
