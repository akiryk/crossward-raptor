'use client';

import { useState } from 'react';
import { ColorSwatches } from '@/components/style-guide/ColorSwatches';
import { GridExamples } from '@/components/style-guide/GridExamples';
import { TextStyles } from '@/components/style-guide/TextStyles';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ModalActions } from '@/components/ui/ModalActions';
import { PreviewToggle } from '@/components/grid/PreviewToggle';
import { RadioGroup } from '@/components/ui/Radio';
import { TextInput } from '@/components/ui/TextInput';
import { Title } from '@/components/ui/Title';
import type { TitleColor } from '@/components/ui/Title';
import { Logo } from '@/components/ui/Logo';
import { Masthead, MastheadAction } from '@/components/layout/Masthead';
import { PuzzleRow, type LibraryPuzzle } from '@/components/puzzle/PuzzleRow';
import { RowHeading } from '@/components/puzzle/RowHeading';
import { NewPuzzleDialog } from '@/components/puzzle/NewPuzzleDialog';

const SAMPLE_ROW: LibraryPuzzle = {
  id: 'sg-sample',
  builderId: 'sg-builder',
  builderName: 'crossworder',
  title: 'Sample puzzle',
  phase: 'grid',
  hintsComplete: false,
  updatedAt: '2026-10-21T12:00:00.000Z',
  updatedLabel: 'October 21, 2026',
  publishedAt: null,
  visibility: 'private',
  cols: 5,
  rows: 5,
  statusKind: 'grid',
  play: null,
};

const SAMPLE_COMPLETE_ROW: LibraryPuzzle = {
  ...SAMPLE_ROW,
  id: 'sg-sample-complete',
  phase: 'hints',
  hintsComplete: true,
  publishedAt: '2026-10-21T12:00:00.000Z',
  visibility: 'public',
  statusKind: 'published',
  play: { state: 'completed', sessionId: 'sg-session' },
};

const TITLE_COLORS: TitleColor[] = ['primary', 'muted', 'link-muted', 'highlight', 'error', 'subtle', 'inverse'];

export default function StyleGuidePage() {
  const [demoValue, setDemoValue] = useState('');
  const [labelValue, setLabelValue] = useState('');
  const [largeValue, setLargeValue] = useState('');
  const [errorValue, setErrorValue] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [newPuzzleOpen, setNewPuzzleOpen] = useState(false);
  const [toggleOff, setToggleOff] = useState(false);
  const [toggleOn, setToggleOn] = useState(true);
  const [formChoice, setFormChoice] = useState('mini');
  const [navChoice, setNavChoice] = useState('build');

  return (
    <div className="p-6">
      <div className="min-w-0 space-y-12">
        <ColorSwatches />

        <TextStyles />

        <section data-testid="sg-text" className="space-y-2">
          <h2 className="mb-3 font-display text-headline [font-weight:var(--weight-bold)]">
            Text
          </h2>
          <h2 className="font-display text-headline [font-weight:var(--weight-bold)]">
            Display heading sample
          </h2>
          <p className="text-body text-foreground">Body text sample, the default reading color.</p>
          <p className="text-help text-ink-2">Secondary text (ink-2) — captions and metadata.</p>
        </section>

        <section data-testid="sg-buttons">
          <h2 className="mb-3 font-display text-headline [font-weight:var(--weight-bold)]">
            Buttons
          </h2>
          {/* sg-hover wraps the interactive elements hover states are
              demonstrated on: each button type unselected and selected,
              a disabled button and a hover link. */}
          <div data-testid="sg-hover" className="flex flex-wrap items-center gap-3">
            <Button data-testid="sg-button">Normal</Button>
            <Button data-testid="sg-button" selected>
              Normal
            </Button>
            <Button data-testid="sg-button" number={1}>
              Edit the Grid
            </Button>
            <Button data-testid="sg-button" number={2} selected>
              Create Hints
            </Button>
            <Button data-testid="sg-button" size="large">
              Large
            </Button>
            <Button data-testid="sg-button" size="large" selected>
              Large
            </Button>
            <Button data-testid="sg-button" variant="alternate">
              Alternate
            </Button>
            <Button data-testid="sg-button" variant="alternate" selected>
              Alternate
            </Button>
            <Button disabled data-testid="sg-button-disabled">
              Disabled
            </Button>
            <a
              href="#"
              className="cursor-pointer text-button-fill underline transition-colors duration-150 ease-out hover:text-button-hover hover:no-underline"
            >
              Hover link
            </a>
          </div>
        </section>

        <section data-testid="sg-modal">
          <h2 className="mb-3 font-display text-headline [font-weight:var(--weight-bold)]">
            Modal
          </h2>
          <Button data-testid="sg-modal-open" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
          <Modal
            open={modalOpen}
            title="A New Puzzle!"
            onClose={() => setModalOpen(false)}
            testId="sg-modal-dialog"
            footer={
              <ModalActions
                confirmLabel="Create"
                cancelLabel="Cancel"
                onConfirm={() => setModalOpen(false)}
                onCancel={() => setModalOpen(false)}
                confirmTestId="sg-modal-confirm"
                cancelTestId="sg-modal-cancel"
              />
            }
          >
            <p>A short sample of a dialog&rsquo;s content.</p>
          </Modal>
        </section>

        <section data-testid="sg-new-puzzle-dialog">
          <h2 className="mb-3 font-display text-headline [font-weight:var(--weight-bold)]">
            New-puzzle dialog
          </h2>
          <Button onClick={() => setNewPuzzleOpen(true)}>Open the new-puzzle dialog</Button>
          {newPuzzleOpen && (
            <NewPuzzleDialog onCancel={() => setNewPuzzleOpen(false)} onCreate={() => setNewPuzzleOpen(false)} />
          )}
        </section>

        <section data-testid="sg-inputs" className="space-y-3">
          <h2 className="font-display text-headline [font-weight:var(--weight-bold)]">Inputs</h2>
          <TextInput
            data-testid="sg-input-regular"
            aria-label="Regular input"
            placeholder="Type here"
            value={demoValue}
            onChange={setDemoValue}
          />
          <TextInput
            data-testid="sg-input-label"
            label="Name it!"
            aria-label="Name it!"
            placeholder="Add name here..."
            value={labelValue}
            onChange={setLabelValue}
          />
          <TextInput
            data-testid="sg-input-large"
            size="large"
            aria-label="Large input"
            placeholder="Your username..."
            value={largeValue}
            onChange={setLargeValue}
          />
          <TextInput
            data-testid="sg-input-error"
            size="large"
            aria-label="Input with an error"
            placeholder="Your username..."
            error="Oops! You need to add a username."
            value={errorValue}
            onChange={setErrorValue}
          />
        </section>

        <section data-testid="sg-toggles" className="space-y-3">
          <h2 className="font-display text-headline [font-weight:var(--weight-bold)]">Toggle</h2>
          <div className="flex flex-wrap items-center gap-6">
            <PreviewToggle
              data-testid="sg-toggle-off"
              isPreviewing={toggleOff}
              onToggle={() => setToggleOff((on) => !on)}
            />
            <PreviewToggle
              data-testid="sg-toggle-on"
              isPreviewing={toggleOn}
              onToggle={() => setToggleOn((on) => !on)}
            />
          </div>
        </section>

        <section data-testid="sg-radios" className="space-y-6">
          <h2 className="font-display text-headline [font-weight:var(--weight-bold)]">Radio</h2>
          <RadioGroup
            data-testid="sg-radio-form"
            name="sg-radio-form"
            label="Size"
            options={[
              { value: 'mini', label: 'Mini (5×5)' },
              { value: 'midi', label: 'Midi (9×9)' },
              { value: 'daily', label: 'Daily (15×15)' },
              { value: 'sunday', label: 'Sunday (21×21)' },
            ]}
            value={formChoice}
            onChange={setFormChoice}
          />
          <RadioGroup
            data-testid="sg-radio-nav"
            name="sg-radio-nav"
            label="Build or play"
            variant="nav"
            options={[
              { value: 'build', label: 'Build' },
              { value: 'play', label: 'Play' },
            ]}
            value={navChoice}
            onChange={setNavChoice}
          />
        </section>

        <section data-testid="sg-titles" className="space-y-3">
          <h2 className="font-display text-headline [font-weight:var(--weight-bold)]">Titles</h2>
          <Title size={1} data-testid="sg-title-1">Title 1</Title>
          <Title size={2} data-testid="sg-title-2">Title 2</Title>
          <Title size={3} data-testid="sg-title-3">Title 3</Title>
          <Title size={4} data-testid="sg-title-4">Title 4</Title>
          {TITLE_COLORS.map((color) =>
            color === 'inverse' ? (
              <div key={color} className="bg-primary p-2">
                <Title size={3} color={color} data-testid={`sg-title-${color}`}>
                  {color}
                </Title>
              </div>
            ) : (
              <Title key={color} size={3} color={color} data-testid={`sg-title-${color}`}>
                {color}
              </Title>
            )
          )}
          <Title size={3} as="h5" data-testid="sg-title-as">
            Title 3 as h5
          </Title>
        </section>

        <section data-testid="sg-logo">
          <h2 className="mb-3 font-display text-headline [font-weight:var(--weight-bold)]">Logo</h2>
          <Logo />
        </section>

        <section data-testid="sg-masthead" className="space-y-3">
          <h2 className="font-display text-headline [font-weight:var(--weight-bold)]">Masthead</h2>
          <div data-testid="sg-masthead-signed-out">
            <Masthead />
          </div>
          <div data-testid="sg-masthead-signed-in">
            <Masthead action={<MastheadAction data-testid="sg-masthead-sign-out">Sign out</MastheadAction>} />
          </div>
        </section>

        <section data-testid="sg-row-heading">
          <h2 className="mb-2 font-display text-headline [font-weight:var(--weight-bold)]">Row Heading</h2>
          <RowHeading label="Mini" dimensions="5 × 5" />
        </section>

        <section data-testid="sg-puzzle-row">
          <h2 className="mb-2 font-display text-headline [font-weight:var(--weight-bold)]">Puzzle Row</h2>
          {/* Rows are drawn at the library's 679px content width. */}
          <div className="overflow-x-auto">
            <ul className="flex w-[679px] flex-col gap-1">
              <PuzzleRow puzzle={SAMPLE_ROW} view="build" onDeleted={() => {}} />
              <PuzzleRow puzzle={SAMPLE_COMPLETE_ROW} view="play" onDeleted={() => {}} />
            </ul>
          </div>
        </section>

        <section data-testid="sg-links">
          <h2 className="mb-2 font-display text-headline [font-weight:var(--weight-bold)]">
            Links
          </h2>
          <a href="#" className="cursor-pointer text-button-fill underline transition-colors duration-150 ease-out hover:text-button-hover">
            Example link
          </a>
        </section>

        <section data-testid="sg-hint-rows" className="space-y-2">
          <h2 className="font-display text-headline [font-weight:var(--weight-bold)]">
            Hint rows
          </h2>
          <div
            data-testid="hint-row"
            data-complete="true"
            className="border-l-4 border-accent bg-ok-tint px-3 py-2 text-foreground"
          >
            1 Across — Complete example clue
          </div>
          <div
            data-testid="hint-row"
            data-complete="false"
            className="border-l-4 border-incomplete bg-background px-3 py-2 text-ink-2"
          >
            2 Down — Incomplete example clue
          </div>
        </section>

        <section data-testid="sg-confirmation" className="space-y-2">
          <h2 className="font-display text-headline [font-weight:var(--weight-bold)]">
            Confirmation
          </h2>
          <div className="rounded-md border border-rule-strong bg-panel-tint px-4 py-3">
            <p className="text-help text-ink-2">This cannot be undone.</p>
            <div className="mt-2 flex gap-2">
              <Button>Confirm</Button>
              <Button variant="alternate">Cancel</Button>
            </div>
          </div>
        </section>

        <section data-testid="sg-error" className="space-y-1">
          <h2 className="font-display text-headline [font-weight:var(--weight-bold)]">Error</h2>
          <p className="rounded-md border border-required bg-background px-3 py-2 text-required">
            Example error message.
          </p>
        </section>

        <section data-testid="sg-tooltip">
          <h2 className="mb-2 font-display text-headline [font-weight:var(--weight-bold)]">
            Tooltip
          </h2>
          <div className="relative inline-block">
            <button
              type="button"
              className="cursor-pointer rounded-btn border border-rule-strong px-3 py-1 text-sm"
            >
              Hover target
            </button>
            <div className="absolute left-0 top-full z-10 mt-1 rounded-md border border-rule-strong bg-panel-tint px-2 py-1 text-xs text-ink-2 shadow-sm">
              Tooltip example
            </div>
          </div>
        </section>

        <section data-testid="sg-stepper">
          <h2 className="mb-2 font-display text-headline [font-weight:var(--weight-bold)]">
            Stepper
          </h2>
          <ol className="flex items-center gap-2 text-sm">
            {['Build the grid', 'Write clues', 'Publish'].map((label, index) => (
              <li key={label} className="flex items-center gap-2">
                <span
                  className={
                    index === 0
                      ? 'flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white'
                      : 'flex h-6 w-6 items-center justify-center rounded-full border border-rule-strong text-ink-2'
                  }
                >
                  {index + 1}
                </span>
                <span className={index === 0 ? 'text-foreground' : 'text-ink-2'}>{label}</span>
              </li>
            ))}
          </ol>
        </section>

        <GridExamples />
      </div>
    </div>
  );
}
