import { parseAnswer } from "../data/gameUtils";

const GAP = 3;       // gap between letter boxes
const WORD_GAP = 14; // extra space between words on the same line
const PADDING = 32;  // total horizontal padding

export default function LetterBoxes({ answer, guessed, revealed, correct }) {
  const tokens = parseAnswer(answer);

  // Group tokens into words (split on spaces)
  const words = [];
  let current = [];
  for (const tok of tokens) {
    if (tok.type === "space") {
      if (current.length) words.push(current);
      current = [];
    } else {
      current.push(tok);
    }
  }
  if (current.length) words.push(current);

  const available = (typeof window !== "undefined" ? window.innerWidth : 390) - PADDING;

  // Scale max box size down for long answers so they fit vertically too
  const totalLetters = words.reduce((s, w) => s + w.filter(t => t.type === "letter").length, 0);
  const MAX_BOX = totalLetters > 18 ? 28 : totalLetters > 13 ? 34 : totalLetters > 9 ? 40 : 46;

  // Box size based on longest single word
  const longestWordLetters = Math.max(
    ...words.map((w) => w.filter((t) => t.type === "letter").length)
  );
  const rawWidth = Math.floor((available - (longestWordLetters - 1) * GAP) / longestWordLetters);
  const boxWidth = Math.min(rawWidth, MAX_BOX);
  const boxHeight = Math.round(boxWidth * 1.15);
  const fontSize = Math.round(boxWidth * 0.52);

  // Width a word occupies at the current boxWidth
  const wordPx = (word) => {
    const letters = word.filter((t) => t.type === "letter").length;
    return letters * boxWidth + Math.max(0, letters - 1) * GAP;
  };

  // Greedy line-pack: fit as many words as possible per line
  const lines = [];
  let line = [];
  let lineWidth = 0;

  for (const word of words) {
    const wp = wordPx(word);
    const needed = line.length === 0 ? wp : wp + WORD_GAP;
    if (line.length > 0 && lineWidth + needed > available) {
      lines.push(line);
      line = [word];
      lineWidth = wp;
    } else {
      line.push(word);
      lineWidth += needed;
    }
  }
  if (line.length) lines.push(line);

  // Track global letter index for staggered animation delay
  let letterIdx = 0;

  return (
    <div className="letter-boxes">
      {lines.map((lineWords, li) => (
        <div key={li} className="letter-line">
          {lineWords.map((word, wi) => (
            <div key={wi} className="letter-word" style={{ marginLeft: wi > 0 ? WORD_GAP : 0 }}>
              {word.map((tok, ti) => {
                if (tok.type === "auto") {
                  if (tok.char === "'" || tok.char === "'") return null;
                  return (
                    <span key={ti} className="letter-auto" style={{ fontSize: fontSize * 0.9 }}>
                      {tok.char}
                    </span>
                  );
                }
                const show = revealed || guessed.has(tok.char);
                const celebrateClass = revealed
                  ? (correct ? "celebrate-correct" : "celebrate-reveal")
                  : "";
                const delay = revealed ? `${letterIdx * 55}ms` : "0ms";
                letterIdx++;
                return (
                  <div
                    key={ti}
                    className={`letter-box ${show ? "filled" : ""} ${
                      revealed && !guessed.has(tok.char) ? "revealed" : ""
                    } ${celebrateClass}`}
                    style={{ width: boxWidth, height: boxHeight, fontSize, animationDelay: delay }}
                  >
                    {show ? tok.char : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
