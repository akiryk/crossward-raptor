'use client';

import { useState } from 'react';
import { ColorSwatches } from '@/components/style-guide/ColorSwatches';
import {
  GridExamples,
  HintBoxExample,
  HintInputExample,
  MissingHintExample,
} from '@/components/style-guide/GridExamples';
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
import { Menu } from '@/components/ui/Menu';
import { NewPuzzleDialog } from '@/components/puzzle/NewPuzzleDialog';
import { BuilderSteps, PublishedState } from '@/components/grid/BuilderSteps';
import { TooEarlyDialog, type TooEarlyKind } from '@/components/grid/TooEarlyDialog';
import { PublishDialog } from '@/components/grid/PublishDialog';
import { PlayHintBar } from '@/components/play/PlayHintBar';

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
  const [tooEarly, setTooEarly] = useState<TooEarlyKind | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [toggleOff, setToggleOff] = useState(false);
  const [toggleOn, setToggleOn] = useState(true);
  const [formChoice, setFormChoice] = useState('mini');
  const [navChoice, setNavChoice] = useState('build');

  return (
    <div className="p-6">
      <div className="min-w-0 space-y-12">
        <ColorSwatches />

        <TextStyles />

        <section data-testid="sg-buttons">
          <h2 className="mb-3 text-title-2 text-primary">
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
              Build the Grid
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
          <h2 className="mb-3 text-title-2 text-primary">
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
          <h2 className="mb-3 text-title-2 text-primary">
            New-puzzle dialog
          </h2>
          <Button onClick={() => setNewPuzzleOpen(true)}>Open the new-puzzle dialog</Button>
          {newPuzzleOpen && (
            <NewPuzzleDialog onCancel={() => setNewPuzzleOpen(false)} onCreate={() => setNewPuzzleOpen(false)} />
          )}
        </section>

        <section data-testid="sg-inputs" className="space-y-3">
          <h2 className="text-title-2 text-primary">Inputs</h2>
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
          <h2 className="text-title-2 text-primary">Toggle</h2>
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
          <h2 className="text-title-2 text-primary">Radio</h2>
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
          <h2 className="text-title-2 text-primary">Titles</h2>
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
          <h2 className="mb-3 text-title-2 text-primary">Logo</h2>
          <Logo />
        </section>

        <section data-testid="sg-masthead" className="space-y-3">
          <h2 className="text-title-2 text-primary">Masthead</h2>
          <div data-testid="sg-masthead-signed-out">
            <Masthead />
          </div>
          <div data-testid="sg-masthead-signed-in">
            <Masthead action={<MastheadAction data-testid="sg-masthead-sign-out">Sign out</MastheadAction>} />
          </div>
        </section>

        <section data-testid="sg-row-heading">
          <h2 className="mb-2 text-title-2 text-primary">Row Heading</h2>
          <RowHeading label="Mini" dimensions="5 × 5" />
        </section>

        <section data-testid="sg-puzzle-row">
          <h2 className="mb-2 text-title-2 text-primary">Puzzle Row</h2>
          {/* Rows are drawn at the library's 679px content width. */}
          <div className="overflow-x-auto">
            <ul className="flex w-[679px] flex-col gap-1">
              <PuzzleRow puzzle={SAMPLE_ROW} view="build" onDeleted={() => {}} />
              <PuzzleRow puzzle={SAMPLE_COMPLETE_ROW} view="play" onDeleted={() => {}} />
            </ul>
          </div>
        </section>

        <section data-testid="sg-row-menu">
          <h2 className="mb-2 text-title-2 text-primary">Row menu</h2>
          <div className="relative flex h-10 w-[240px] justify-end">
            <Menu
              label="Actions for Sample puzzle"
              className="relative"
              items={[
                { key: 'visibility', label: 'Make public', onSelect: () => {} },
                { key: 'delete', label: 'Delete', tone: 'error', onSelect: () => {} },
              ]}
            />
          </div>
        </section>

        <section data-testid="sg-links">
          <h2 className="mb-2 text-title-2 text-primary">
            Links
          </h2>
          <a href="#" className="cursor-pointer text-button-fill underline transition-colors duration-150 ease-out hover:text-button-hover">
            Example link
          </a>
        </section>

        <section data-testid="sg-hint-rows" className="space-y-2">
          <h2 className="text-title-2 text-primary">
            Hint Input (hints phase)
          </h2>
          <HintInputExample />
        </section>

        <section data-testid="sg-hint-row-missing" className="space-y-2">
          <h2 className="text-title-2 text-primary">
            Missing hint (hints phase, after 3 Publish)
          </h2>
          <MissingHintExample />
        </section>

        <section data-testid="sg-hint-box" className="space-y-2">
          <h2 className="text-title-2 text-primary">
            Hint Box (hints phase, narrow)
          </h2>
          <HintBoxExample />
        </section>

        <section data-testid="sg-play-hint-bar" className="space-y-2">
          <h2 className="text-title-2 text-primary">
            Play hint bar (play, narrow)
          </h2>
          <div className="max-w-[700px]">
            <PlayHintBar hint="Network of squares" onStep={() => {}} />
          </div>
        </section>




        <section data-testid="sg-builder-steps" className="space-y-3">
          <h2 className="mb-2 text-title-2 text-primary">
            Builder steps
          </h2>
          <BuilderSteps phase="grid" onStep={() => {}} />
          <BuilderSteps phase="hints" onStep={() => {}} />
          <PublishedState puzzleId="sg-sample" />
        </section>

        <section data-testid="sg-too-early-dialog">
          <h2 className="mb-3 text-title-2 text-primary">
            Too-early dialog
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setTooEarly('lol')}>Open “Lol.”</Button>
            <Button onClick={() => setTooEarly('nope')}>Open “Nope.”</Button>
            <Button onClick={() => setTooEarly('not-quite')}>Open “Not quite!”</Button>
          </div>
          <TooEarlyDialog kind={tooEarly} onClose={() => setTooEarly(null)} />
        </section>

        <section data-testid="sg-publish-dialog">
          <h2 className="mb-3 text-title-2 text-primary">
            Publish dialog
          </h2>
          <Button onClick={() => setPublishOpen(true)}>Open the Publish dialog</Button>
          {publishOpen && (
            <PublishDialog
              findings={[
                { kind: 'short-answers', count: 2, message: '2 answers are shorter than three letters.' },
              ]}
              onPublish={async () => setPublishOpen(false)}
              onCancel={() => setPublishOpen(false)}
            />
          )}
        </section>

        <GridExamples />
      </div>
    </div>
  );
}
