# Story S2 — Friendly usernames

Three word lists and a pure generator that makes a friendly
"Adjective Adjective Noun" username, such as "Lil Orange Fox". S3
uses it to pre-fill the username step; nothing shows it yet.

**Status: Done 2026-11-09:** implemented 37913ad, direct to `main`;
independent review: no blockers; `npm run verify` exit 0 (780 tests).
Approved and frozen 2026-11-09 (e90a745) by the orchestrating session
under the human's delegation ([history](../HISTORY.md#orchestration)),
after an independent review of the draft (no blockers; its four
should-fix findings and nits addressed). The human sees the word lists
at the epic's final check.

**Blast radius: small, off the risk paths.** One new pure module in
`src/lib/` and its unit test. No UI, server, schema or `src/engine/**`
change. Direct delivery to `main`.

## The human's request

From the [EPIC](../EPIC.md#the-humans-request), item 2: a new user's
username field is pre-filled with a generated "Adjective Adjective
Noun" name (e.g. "Lil Orange Fox", "Happy Burly Harley"), friendly and
warm but not over the top ("Fantastic Awesome Lion" is too much), from
word lists separate from the puzzle names', 50–100 words each.

## What the code does today

- No username is generated. The sign-in form's username field starts
  empty or with the last username sent from this browser
  (`SignInForm.tsx`).
- `src/lib/puzzle-name.ts` (14-S3) is the precedent: hand-picked
  `PUZZLE_NAME_ADJECTIVES` and `PUZZLE_NAME_NOUNS` (100 each),
  `generatePuzzleName(random = Math.random)` returning "Adjective Noun
  Noun", the random source a parameter, the two nouns kept different.
  Its unit test is `src/lib/puzzle-name.test.ts`.
- `src/lib/username.ts`: `usernameError` accepts a trimmed value of
  1–80 characters.

## Decisions

From the human and the EPIC:

- **"Adjective Adjective Noun"**, title case, single spaces, from lists
  of the app's own, 50–100 words each, friendly and gently positive, not
  superlative.
- **A generator in `src/lib/`** like `generatePuzzleName`, the random
  source a parameter; the two adjectives always differ. (S3 decides
  when it is called; the EPIC says a fresh name each time the step
  loads.)

Delegated (orchestrating session, decided in drafting):

- **Module and names.** `src/lib/username-generator.ts` exports
  `USERNAME_FIRST_ADJECTIVES`, `USERNAME_SECOND_ADJECTIVES`,
  `USERNAME_NOUNS` (each `as const`, in the alphabetical order below)
  and `generateUsername(random: () => number = Math.random): string`.
  Pure, no dependency; it may import nothing but types. A separate file
  from `username.ts` (rules) and `puzzle-name.ts` (puzzles).
- **Two adjective slots, not one list used twice.** English puts
  opinion before look ("lil orange", "happy burly"), so a mood word
  followed by a look word reads naturally in every draw, while one shared
  list gives "Speckled Cheery" orders. Slot 1 is a **mood** word
  (manner, warmth, the human's "Lil"); slot 2 a **look** word (a soft
  color, a pattern, a coat or texture, the human's "Burly"). The lists
  are disjoint, so the two adjectives always differ by construction, with
  no retry or offset logic.
- **Nouns are creatures**, as in "Fox": small or gentle animals, birds
  and insects. One kind of noun keeps every name an image ("a Jaunty
  Tabby Puffin"); "Harley" (a pet's name) and the mockup's "Wing" are
  read as examples, not a pattern to extend to names or objects.
- **No word twice.** No word appears twice within or across the three
  username lists, compared case-insensitively.

Orchestrator decision (2026-11-09, on reviewing the first draft):

- **"Separate word lists" means the usernames have lists of their
  own, not that they exclude every puzzle word.** The human's examples
  use "Happy" and "Orange", both puzzle adjectives, and the mockup shows
  "Lil Orange Wing". So the username lists may share words with the
  puzzle-name lists; the first draft's no-overlap rule and its test are
  dropped. (The lists were drafted mostly apart from the puzzle words,
  so the overlap is small: "Cozy", "Gentle", "Happy", "Jolly", "Merry",
  "Orange".)
- **The human's example "Lil Orange Fox" can be generated:** "Lil" in
  slot 1, "Orange" in slot 2, "Fox" a noun; "Happy" is in slot 1 and
  "Burly" in slot 2. "Happy Burly Harley" cannot be: "Harley" is a
  pet's name, not a creature, and is left out.
- **Plainer, warmer mood words:** "Affable", "Amiable", "Cordial" and
  "Genial" are replaced by "Comfy", "Cozy", "Jolly" and "Gentle";
  everyday words read better as names.
- **After the independent review:** "Ivory" and "Olive" (skin tones,
  per the tone filter) become "Mint" and "Seafoam"; "Twinkly" becomes
  "Glittery"; "Spry" (said of the elderly) and "Patient" (a hospital
  reading) become "Snug" and "Merry"; "Newt" (a politician's name)
  becomes "Beagle". "Kiwi" and "Burly" stay.
- **Tone filter.** Gently positive, nothing superlative ("Awesome",
  "Fantastic", "Epic", "Mighty" left out). Left out because they can
  read badly on a person, alone or in combination: body words that can
  shame ("Chubby", "Plump", "Cuddly", "Lanky", "Stout"); words with a
  sexual reading ("Perky", "Frisky", "Spunky", "Shaggy", "Silky",
  "Sleek", "Satin", "Cherry", "Peach", "Cream", "Kitten", "Beaver",
  "Cougar", "Stud", "Chick", "Cock"); skin-tone colors ("Cocoa",
  "Caramel", "Cinnamon", "Ivory", "Olive") and "Black", "White",
  "Brown", "Red", "Yellow"; political readings ("Saffron", "Navy",
  "Dove", "Hawk", "Eagle", "Elephant", "Donkey", "Panther", "Newt");
  animals used as insults ("Pig",
  "Cow", "Rat", "Weasel", "Snake", "Sloth", "Slug", "Monkey", "Ape",
  "Shrew", "Turkey", "Dodo", "Loon", "Crab", "Shrimp", "Hippo", "Whale",
  "Frog", "Skunk", "Hyena", "Vulture", "Bat", "Goat", "Wolf"); "Bear"
  (with "Burly"); "Maroon" (a cartoon insult); a mood word that repeats
  a noun ("Humming" with "Hummingbird"; "Starry" kept, "Starling" out).
- **The random source** is called exactly three times per name, in
  order: first adjective, second adjective, noun; each pick is index
  `min(length − 1, floor(r × length))`, as in `puzzle-name.ts`. So
  `() => 0` gives "Beaming Apricot Alpaca" and `() => 0.999999` gives
  "Zippy Wavy Wren". The default is `Math.random`.
- **Length:** the longest possible name is 35 characters ("Thoughtful
  Butterscotch Hummingbird"), well within the 80-character rule; every
  name passes `usernameError` unchanged.

### The word lists (approved with this story)

**Slot 1, mood (63):** Beaming, Blithe, Bonny, Brainy, Brisk, Buoyant,
Carefree, Charming, Cheery, Chipper, Chirpy, Comfy, Cozy, Dandy,
Earnest, Easygoing, Friendly, Gallant, Gentle, Glad, Gleeful, Graceful,
Gracious, Gutsy, Handy, Happy, Hearty, Helpful, Honest, Hopeful, Jaunty,
Jolly, Jovial, Joyful, Keen, Kind, Lil, Lively, Lovable, Loyal, Merry,
Neighborly, Nifty, Peaceful, Playful, Pleasant, Savvy, Serene, Sincere,
Skipping, Smiling, Snug, Spirited, Sprightly, Steady, Sweet, Thoughtful,
Trusty, Upbeat, Warm, Whimsical, Whistling, Zippy.

**Slot 2, look (60):** Apricot, Aqua, Azure, Brindle, Burly,
Butterscotch, Calico, Cerulean, Cobalt, Coral, Corduroy, Curly, Dappled,
Dewy, Dotted, Downy, Fleecy, Freckled, Gingham, Glittery, Hazel, Indigo,
Jade, Lilac, Lime, Marigold, Mauve, Mint, Mottled, Mustard, Ochre,
Orange, Paisley, Pastel, Pearl, Periwinkle, Pink, Plaid, Plum, Plush,
Ruby, Russet, Sage, Scarlet, Seafoam, Shiny, Speckled, Spotted, Starry,
Striped, Suede, Sunlit, Tabby, Tartan, Tawny, Teal, Tufted, Turquoise,
Tweedy, Wavy.

**Nouns, creatures (82):** Alpaca, Armadillo, Axolotl, Beagle, Bison,
Bobcat, Bumblebee, Butterfly, Capybara, Caribou, Chickadee, Chinchilla,
Chipmunk, Corgi, Crane, Dolphin, Duckling, Elk, Emu, Fawn, Ferret,
Finch, Firefly, Flamingo, Foal, Fox, Gazelle, Gecko, Gosling, Hamster,
Hare, Heron, Hummingbird, Kangaroo, Kingfisher, Kiwi, Koala, Ladybug,
Lamb, Lark, Lemur, Leopard, Lion, Lynx, Magpie, Mallard, Marmot,
Meerkat, Moose, Narwhal, Octopus, Okapi, Orca, Ostrich, Pangolin,
Parrot, Pelican, Pheasant, Platypus, Pony, Porcupine, Puffin, Puppy,
Quail, Quokka, Raven, Reindeer, Robin, Salamander, Sandpiper, Seahorse,
Seal, Sparrow, Stork, Swan, Tapir, Tortoise, Toucan, Turtle, Wallaby,
Wombat, Wren.

Examples: "Lil Orange Fox", "Happy Burly Finch", "Jaunty
Tabby Puffin", "Serene Dappled Fawn", "Whistling Plaid Wombat".

## Non-goals

- Calling the generator anywhere: the username step and its pre-fill
  are S3.
- An "another name" control, uniqueness checks, or a profanity filter
  on user-typed names.
- Any change to `puzzle-name.ts`, its lists or its test.
- Any change to the username rules (`username.ts`).
- Localization; words outside the three lists (no numbers or
  punctuation).

## Acceptance (frozen 2026-11-09)

### `src/lib/username-generator.test.ts` (new, 9 unit cases)

The test holds the three approved lists verbatim (as above) and a
seeded random source (mulberry32, as in `puzzle-name.test.ts`).

1. **23-S2-1 the word lists**
   - exactly the approved lists, in alphabetical order;
   - each 50–100 unique words matching `^[A-Z][a-z]+$`;
   - no word shared between the three lists, case-insensitively (the
     puzzle-name lists are not checked).
2. **23-S2-2 generateUsername**
   - 5000 seeded names: each matches `^[A-Z][a-z]+ [A-Z][a-z]+
     [A-Z][a-z]+$`, its words from slot 1, slot 2 and the nouns in that
     order, the two adjectives different (case-insensitively), and
     `usernameError` null, no outer spaces, at most 80 characters;
   - with a constant random source (0, 0.25, 0.5, 0.75, 0.999999) the
     adjectives still differ;
   - a scripted source: three calls, in slot order, index
     `min(length − 1, floor(r × length))`; "Lil Orange Fox" and "Happy
     Burly Finch" from values at their slots' centres, and "Lil Orange
     Fox" again from values just above each slot's lower edge
     (`(index + 0.01) ÷ length`, which a rounding of `r × (length − 1)`
     misses); `() => 0` → "Beaming Apricot Alpaca",
     `0.999999` → "Zippy Wavy Wren"; a fourth call throws;
   - an injected source is the only randomness (`Math.random` stubbed to
     throw); with no argument it uses `Math.random`, three calls;
   - two sources with the same seed give the same 50 names;
   - 200 seeded names give more than 195 different ones, and 20,000 use
     every word of every list in its own slot.

### Discrimination (2026-11-09, on `main`, uncommitted test; rerun in full after the orchestrator decision and the review's changes)

- `npx vitest run src/lib/username-generator.test.ts` with no module:
  the file fails to import (`./username-generator`), no tests run.
- **Throwaway checks, not kept** (the module written to
  `src/lib/username-generator.ts`, run, then deleted):
  - a straightforward implementation: 9 of 9 pass; `npx tsc --noEmit`
    clean;
  - one adjective list used for both slots: 5 fail (repeated
    adjective, wrong slot, scripted picks, default source, coverage);
  - the second adjective lower-cased: 4 fail;
  - "Lil" also added to slot 2 (a word in two lists): 5 fail (approved
    list, no shared word, slot order/different adjectives, scripted,
    coverage);
  - "Orange" removed from slot 2: 3 fail (approved list, scripted
    "Lil Orange Fox", coverage);
  - the noun drawn from `Math.random` instead of the source: 3 fail
    (scripted, injection, determinism);
  - the noun drawn first: 1 fails (scripted order);
  - a double space: 4 fail;
  - the noun drawn from only the first 40: 2 fail (scripted, coverage);
  - the index rounded, `Math.round(r × (length − 1))`: 1 fails (the
    scripted lower-edge case).
- `npx eslint src/lib/username-generator.test.ts`: clean.

## Repo paths

Acceptance: `src/lib/username-generator.test.ts` (new). Runtime:
`src/lib/username-generator.ts` (new). Docs: this story,
`../HANDOFF.md`.

**CODE-REVIEW:** none of these is a risk path (not `src/engine/**`,
`puzzle-storage.ts`, `src/app/puzzles/actions.ts` or `prisma/**`), so
direct delivery to `main`. If the actual diff touches a risk path, it
moves to a branch and PR.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `src/lib/username-generator.ts` implements the Decisions; no other
  runtime change.
- The module imports nothing at runtime (type-only imports at most),
  checked at the implementation review.
- `npm run verify` exits 0. No browser change, so no E2E run is
  required.
- Delivered on `main`; the handoff records observed results and lists
  the generated-name decisions under **Decisions for the visual check**:
  two slots, creature nouns, "Happy Burly Harley" not reproducible
  ("Harley" left out), and the words shared with the puzzle-name lists
  ("Cozy", "Gentle", "Happy", "Jolly", "Merry", "Orange").
