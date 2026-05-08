import { ALIASES } from "./categories";

/** The actual answer text to match against (handles aliases like NASA (2) → NASA) */
export function getAnswer(brand) {
  return ALIASES[brand] || brand;
}

/** Parse an answer into display tokens */
export function parseAnswer(answer) {
  // Returns array of: {type:'letter',char} | {type:'auto',char} | {type:'space'}
  const tokens = [];
  for (const ch of answer) {
    if (ch === " ") {
      tokens.push({ type: "space" });
    } else if (/[A-Z0-9]/.test(ch)) {
      tokens.push({ type: "letter", char: ch });
    } else {
      tokens.push({ type: "auto", char: ch }); // apostrophe, hyphen, & etc.
    }
  }
  return tokens;
}

/** Unique letters that need to be guessed */
export function getUniqueLetters(answer) {
  return new Set([...answer].filter((c) => /[A-Z0-9]/.test(c)));
}

/** Total guessable letter count (for difficulty sorting) */
export function getLetterCount(brand) {
  const answer = getAnswer(brand);
  return [...answer].filter((c) => /[A-Z0-9]/.test(c)).length;
}

/** Shuffle brands randomly — called fresh each time a category is entered */
export function sortedBrands(brands) {
  const arr = [...brands];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Stars earned for a round */
export function calcStars(wrongCount, skipped) {
  if (skipped) return 0;
  if (wrongCount === 0) return 3;
  if (wrongCount <= 3) return 2;
  return 1;
}

/** Load/save progress from localStorage */
const STORAGE_KEY = "gbc_progress_v1";

export function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
