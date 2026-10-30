'use client';

import { useId, useState } from 'react';
import type { Visibility } from '../../app/puzzles/actions';
import type { Finding } from '../../lib/publish-readiness';
import { Modal } from '../ui/Modal';
import { ModalActions } from '../ui/ModalActions';
import { RadioGroup } from '../ui/Radio';

/** Story 14-S4. Confirms publishing; the human supplies the final copy
 *  later. Mounted only while open, so each opening starts at Unlisted. */
export function PublishDialog({
  findings,
  onPublish,
  onCancel,
}: {
  findings: readonly Finding[];
  onPublish: (visibility: Visibility) => Promise<void>;
  onCancel: () => void;
}) {
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const headingId = useId();

  function handlePublish() {
    setPending(true);
    setFailed(false);
    onPublish(visibility).catch((error) => {
      console.error('Failed to publish puzzle', error);
      setPending(false);
      setFailed(true);
    });
  }

  return (
    <Modal
      open
      title="Ready to publish?"
      onClose={onCancel}
      testId="publish-dialog"
      dismissalDisabled={pending}
      footer={
        <ModalActions
          confirmLabel="Publish"
          cancelLabel="Cancel"
          onConfirm={handlePublish}
          onCancel={onCancel}
          confirmDisabled={pending}
        />
      }
    >
      <p>Once it&apos;s published, your puzzle can be played, and it can&apos;t be changed.</p>
      {findings.map((finding) => (
        <p key={finding.kind} data-finding-kind={finding.kind} className="text-body-small text-primary">
          {finding.message}
        </p>
      ))}
      <p id={headingId} className="text-title-4 text-primary">
        Who can play it?
      </p>
      <RadioGroup<Visibility>
        name="visibility"
        labelledBy={headingId}
        options={[
          { value: 'private', label: 'Unlisted' },
          { value: 'public', label: 'Public' },
        ]}
        value={visibility}
        onChange={setVisibility}
      />
      {failed && (
        <p role="alert" className="text-body-small text-error">
          Couldn&apos;t publish. Try again.
        </p>
      )}
    </Modal>
  );
}
