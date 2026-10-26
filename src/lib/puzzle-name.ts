// Story 14-S3: playful default names for a new puzzle, "Adjective Noun
// Noun" such as "Purple Crepe Bunny". The lists are hand-picked; the random
// source is a parameter so tests can seed it.

export const PUZZLE_NAME_ADJECTIVES = [
  'Amber', 'Ancient', 'Autumn', 'Bashful', 'Bold', 'Bouncy', 'Brave', 'Breezy', 'Bright', 'Bubbly',
  'Calm', 'Cheerful', 'Clever', 'Cloudy', 'Copper', 'Cosmic', 'Cozy', 'Crimson', 'Crispy', 'Curious',
  'Dainty', 'Dancing', 'Dapper', 'Dizzy', 'Dreamy', 'Dusty', 'Eager', 'Electric', 'Emerald', 'Fancy',
  'Fizzy', 'Fluffy', 'Frosty', 'Fuzzy', 'Gentle', 'Giddy', 'Gilded', 'Glowing', 'Golden', 'Grumpy',
  'Happy', 'Hazy', 'Hidden', 'Humble', 'Icy', 'Jazzy', 'Jolly', 'Jumpy', 'Lavender', 'Lazy',
  'Lucky', 'Lunar', 'Magic', 'Mellow', 'Merry', 'Midnight', 'Minty', 'Misty', 'Modest', 'Mossy',
  'Nimble', 'Noble', 'Odd', 'Orange', 'Peppy', 'Plucky', 'Polite', 'Purple', 'Quiet', 'Quirky',
  'Rainy', 'Rosy', 'Rusty', 'Salty', 'Sandy', 'Silent', 'Silly', 'Silver', 'Sleepy', 'Snowy',
  'Sparkly', 'Speedy', 'Spicy', 'Sunny', 'Swift', 'Tangy', 'Tidy', 'Tiny', 'Velvet', 'Wandering',
  'Wiggly', 'Windy', 'Wise', 'Witty', 'Wobbly', 'Wonky', 'Woolly', 'Yellow', 'Zany', 'Zesty',
] as const;

export const PUZZLE_NAME_NOUNS = [
  'Acorn', 'Anchor', 'Apple', 'Badger', 'Bagel', 'Balloon', 'Banjo', 'Beacon', 'Biscuit', 'Blanket',
  'Breeze', 'Bunny', 'Button', 'Cactus', 'Candle', 'Canyon', 'Carousel', 'Castle', 'Cello', 'Cloud',
  'Comet', 'Cookie', 'Crepe', 'Cricket', 'Daisy', 'Dragon', 'Drum', 'Falcon', 'Feather', 'Fern',
  'Fiddle', 'Garden', 'Giraffe', 'Glacier', 'Harbor', 'Hedgehog', 'Honey', 'Island', 'Jelly', 'Kettle',
  'Kite', 'Lantern', 'Lemon', 'Lighthouse', 'Llama', 'Lobster', 'Magnet', 'Mango', 'Maple', 'Meadow',
  'Mitten', 'Moon', 'Muffin', 'Noodle', 'Nugget', 'Oasis', 'Otter', 'Owl', 'Paddle', 'Pancake',
  'Panda', 'Parade', 'Peanut', 'Pebble', 'Penguin', 'Pepper', 'Pickle', 'Pillow', 'Planet', 'Pocket',
  'Pretzel', 'Puddle', 'Pumpkin', 'Quilt', 'Rabbit', 'Raccoon', 'Rainbow', 'Ribbon', 'River', 'Rocket',
  'Saddle', 'Sandwich', 'Snowflake', 'Seashell', 'Sprocket', 'Squirrel', 'Sunday', 'Teacup', 'Thimble', 'Tiger',
  'Toaster', 'Trumpet', 'Tulip', 'Turnip', 'Umbrella', 'Volcano', 'Waffle', 'Walrus', 'Whistle', 'Zebra',
] as const;

function pick(length: number, random: () => number) {
  return Math.min(length - 1, Math.floor(random() * length));
}

export function generatePuzzleName(random: () => number = Math.random): string {
  const adjective = PUZZLE_NAME_ADJECTIVES[pick(PUZZLE_NAME_ADJECTIVES.length, random)];
  const first = pick(PUZZLE_NAME_NOUNS.length, random);
  // Draw the second noun from the others, so the two always differ.
  const offset = 1 + pick(PUZZLE_NAME_NOUNS.length - 1, random);
  const second = (first + offset) % PUZZLE_NAME_NOUNS.length;
  return `${adjective} ${PUZZLE_NAME_NOUNS[first]} ${PUZZLE_NAME_NOUNS[second]}`;
}
