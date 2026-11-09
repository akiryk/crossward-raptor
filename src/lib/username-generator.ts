// Story 23-S2: friendly default usernames, "Adjective Adjective Noun" such
// as "Lil Orange Fox". The first adjective is a mood word, the second a look
// word, the noun a creature. The lists are hand-picked and disjoint, so the
// two adjectives always differ; the random source is a parameter so tests
// can seed it.

export const USERNAME_FIRST_ADJECTIVES = [
  'Beaming', 'Blithe', 'Bonny', 'Brainy', 'Brisk', 'Buoyant', 'Carefree', 'Charming', 'Cheery', 'Chipper',
  'Chirpy', 'Comfy', 'Cozy', 'Dandy', 'Earnest', 'Easygoing', 'Friendly', 'Gallant', 'Gentle', 'Glad',
  'Gleeful', 'Graceful', 'Gracious', 'Gutsy', 'Handy', 'Happy', 'Hearty', 'Helpful', 'Honest', 'Hopeful',
  'Jaunty', 'Jolly', 'Jovial', 'Joyful', 'Keen', 'Kind', 'Lil', 'Lively', 'Lovable', 'Loyal',
  'Merry', 'Neighborly', 'Nifty', 'Peaceful', 'Playful', 'Pleasant', 'Savvy', 'Serene', 'Sincere', 'Skipping',
  'Smiling', 'Snug', 'Spirited', 'Sprightly', 'Steady', 'Sweet', 'Thoughtful', 'Trusty', 'Upbeat', 'Warm',
  'Whimsical', 'Whistling', 'Zippy',
] as const;

export const USERNAME_SECOND_ADJECTIVES = [
  'Apricot', 'Aqua', 'Azure', 'Brindle', 'Burly', 'Butterscotch', 'Calico', 'Cerulean', 'Cobalt', 'Coral',
  'Corduroy', 'Curly', 'Dappled', 'Dewy', 'Dotted', 'Downy', 'Fleecy', 'Freckled', 'Gingham', 'Glittery',
  'Hazel', 'Indigo', 'Jade', 'Lilac', 'Lime', 'Marigold', 'Mauve', 'Mint', 'Mottled', 'Mustard',
  'Ochre', 'Orange', 'Paisley', 'Pastel', 'Pearl', 'Periwinkle', 'Pink', 'Plaid', 'Plum', 'Plush',
  'Ruby', 'Russet', 'Sage', 'Scarlet', 'Seafoam', 'Shiny', 'Speckled', 'Spotted', 'Starry', 'Striped',
  'Suede', 'Sunlit', 'Tabby', 'Tartan', 'Tawny', 'Teal', 'Tufted', 'Turquoise', 'Tweedy', 'Wavy',
] as const;

export const USERNAME_NOUNS = [
  'Alpaca', 'Armadillo', 'Axolotl', 'Beagle', 'Bison', 'Bobcat', 'Bumblebee', 'Butterfly', 'Capybara', 'Caribou',
  'Chickadee', 'Chinchilla', 'Chipmunk', 'Corgi', 'Crane', 'Dolphin', 'Duckling', 'Elk', 'Emu', 'Fawn',
  'Ferret', 'Finch', 'Firefly', 'Flamingo', 'Foal', 'Fox', 'Gazelle', 'Gecko', 'Gosling', 'Hamster',
  'Hare', 'Heron', 'Hummingbird', 'Kangaroo', 'Kingfisher', 'Kiwi', 'Koala', 'Ladybug', 'Lamb', 'Lark',
  'Lemur', 'Leopard', 'Lion', 'Lynx', 'Magpie', 'Mallard', 'Marmot', 'Meerkat', 'Moose', 'Narwhal',
  'Octopus', 'Okapi', 'Orca', 'Ostrich', 'Pangolin', 'Parrot', 'Pelican', 'Pheasant', 'Platypus', 'Pony',
  'Porcupine', 'Puffin', 'Puppy', 'Quail', 'Quokka', 'Raven', 'Reindeer', 'Robin', 'Salamander', 'Sandpiper',
  'Seahorse', 'Seal', 'Sparrow', 'Stork', 'Swan', 'Tapir', 'Tortoise', 'Toucan', 'Turtle', 'Wallaby',
  'Wombat', 'Wren',
] as const;

function pick<T>(list: readonly T[], random: () => number): T {
  return list[Math.min(list.length - 1, Math.floor(random() * list.length))];
}

export function generateUsername(random: () => number = Math.random): string {
  const first = pick(USERNAME_FIRST_ADJECTIVES, random);
  const second = pick(USERNAME_SECOND_ADJECTIVES, random);
  const noun = pick(USERNAME_NOUNS, random);
  return `${first} ${second} ${noun}`;
}
