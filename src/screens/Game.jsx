import { useState, useEffect, useCallback } from "react";
import { CATEGORIES } from "../data/categories";
import { getAnswer, getUniqueLetters, sortedBrands, calcStars } from "../data/gameUtils";
import {
  soundCorrectLetter, soundWrongLetter, soundComplete,
  soundSkip, soundWhoosh,
} from "../data/sounds";
import LetterBoxes from "../components/LetterBoxes";
import GameIntro from "../components/GameIntro";
import GravyFail from "../components/GravyFail";


const ALL_CAT = { id: "all", name: "Everything", emoji: "🎰", color: "#f5c842", brands: [] };

const MSGS = {
  3: ["GET IN! 🔥", "FLAWLESS! 💎", "NAILED IT! ⚡", "MINT! 🌟", "QUALITY! 👑", "BANGER! 🎯", "SPOT ON! 🫵", "TOO EASY! 😤"],
  2: ["Nice one! 👌", "Not bad! 😎", "Solid! 💪", "Decent! 🙌", "Good shout! 👍", "That works! ✌️"],
  1: ["You got there! 😅", "Eventually! 🫠", "Took a while! 😤", "But you got it! 🫡", "Grind it out! 🥵"],
};
const SKIP_MSGS = [
  "Skipped 😬", "No idea! 🤷", "Blanked it 😶", "Next! 💨",
  "Hard pass 😅", "Not a clue 🙈", "Gave up! 🏳️", "Moving on... 👀",
  "Nope! 😂", "Dunno 🤔", "Better luck next time! 🍀", "Unlucky! 😖",
  "Good try! 💪", "Tough one! 🧠", "Nearly! 🫣",
];
function pickMsg(stars) {
  const arr = MSGS[stars] || MSGS[1];
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickSkipMsg() {
  return SKIP_MSGS[Math.floor(Math.random() * SKIP_MSGS.length)];
}

export default function Game({ worldId, existingProgress, onComplete, onBack, brandOverride, levelNumber, totalLevels }) {
  const cat = CATEGORIES.find((c) => c.id === worldId) || ALL_CAT;
  const [queue] = useState(() => brandOverride ? [...brandOverride] : sortedBrands(cat.brands));

  const startIndex = existingProgress
    ? Math.min(existingProgress.brandStars.length, queue.length - 1)
    : 0;

  const [index, setIndex] = useState(startIndex);
  const [guessed, setGuessed] = useState(new Set());
  const [wrong, setWrong] = useState(new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const [roundDone, setRoundDone] = useState(false);
  const [brandStars, setBrandStars] = useState(
    existingProgress ? [...existingProgress.brandStars] : []
  );
  const [justWrong, setJustWrong] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [resultMsg, setResultMsg] = useState("");

  const brand = queue[index];
  const answer = getAnswer(brand);
  const uniqueLetters = getUniqueLetters(answer);
  const isComplete = !skipped && [...uniqueLetters].every((l) => guessed.has(l));

  useEffect(() => {
    if (isComplete && !roundDone) {
      setRoundDone(true);
      const stars = calcStars(wrongCount, false);
      setResultMsg(pickMsg(stars));
      soundComplete();
    }
  }, [isComplete, roundDone, wrongCount]);

  const [gravyFail, setGravyFail] = useState(false);

  useEffect(() => {
    if (wrongCount >= 3 && !roundDone) {
      soundSkip();
      setSkipped(true);
      setRoundDone(true);
      setGravyFail(true);
    }
  }, [wrongCount, roundDone]);

  const handleGuess = useCallback((letter) => {
    if (roundDone || skipped || guessed.has(letter) || wrong.has(letter)) return;
    if (uniqueLetters.has(letter)) {
      soundCorrectLetter();
      setGuessed((prev) => new Set([...prev, letter]));
    } else {
      soundWrongLetter();
      setWrong((prev) => new Set([...prev, letter]));
      setWrongCount((c) => c + 1);
      setJustWrong(true);
      setTimeout(() => setJustWrong(false), 300);
    }
  }, [roundDone, skipped, guessed, wrong, uniqueLetters]);

  const handleNext = useCallback(() => {
    const stars = calcStars(wrongCount, skipped);
    const newBrandStars = [...brandStars, stars];
    setBrandStars(newBrandStars);

    const nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      onComplete(worldId, newBrandStars);
      return;
    }

    soundWhoosh();
    setTransitioning(true);
    setTimeout(() => {
      setIndex(nextIndex);
      setGuessed(new Set());
      setWrong(new Set());
      setWrongCount(0);
      setSkipped(false);
      setRoundDone(false);
      setResultMsg("");
      setHintsUsed(0);
      setGravyFail(false);
      setTransitioning(false);
    }, 200);
  }, [wrongCount, skipped, brandStars, index, queue.length, onComplete, worldId]);

  useEffect(() => {
    const handler = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter" && roundDone) { handleNext(); return; }
      const l = e.key.toUpperCase();
      if (/^[A-Z]$/.test(l)) handleGuess(l);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleGuess, handleNext, roundDone]);

  const [hintsUsed, setHintsUsed] = useState(0);

  const handleHint = () => {
    if (roundDone) return;
    if (hintsUsed >= 2) { soundWrongLetter(); return; }
    const remaining = [...uniqueLetters].filter(l => !guessed.has(l));
    if (remaining.length === 0) return;
    const letter = remaining[Math.floor(Math.random() * remaining.length)];
    soundCorrectLetter();
    setGuessed(prev => new Set([...prev, letter]));
    setHintsUsed(h => h + 1);
  };

  const handleRetry = () => {
    setGuessed(new Set());
    setWrong(new Set());
    setWrongCount(0);
    setJustWrong(false);
    setSkipped(false);
    setRoundDone(false);
    setResultMsg("");
    setHintsUsed(0);
    setGravyFail(false);
  };

  const handleSkip = () => {
    if (roundDone) return;
    soundSkip();
    setSkipped(true);
    setGuessed(new Set(uniqueLetters));
    setRoundDone(true);
    setResultMsg(pickSkipMsg());
  };

  const handleShare = async () => {
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], `${getAnswer(brand)}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Guess The Gravy!",
          text: `Can you guess this bootleg brand? 🎰`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${getAnswer(brand)}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) { /* silent fail */ }
  };

  const stars = calcStars(wrongCount, skipped);
  const progress = (index / queue.length) * 100;
  const imageSrc = `/stickers/${encodeURIComponent(brand)}.png`;

  const [introSeen, setIntroSeen] = useState(false);

  return (
    <div className="screen game" style={{ "--cat-color": cat.color }}>
      {!introSeen && (
        <GameIntro
          emoji="🏷️"
          title="EASY"
          description="Guess the name of each bootleg brand logo — one letter at a time."
          onStart={() => setIntroSeen(true)}
        />
      )}
      {gravyFail && <GravyFail onNext={handleNext} onRetry={handleRetry} />}
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>QUIT</button>
      </div>

      {/* Fighter energy bar */}
      <div className="energy-wrap">
        <div className="energy-bar">
          <div
            className="energy-cover"
            style={{ width: `${100 - progress}%` }}
          />
        </div>
      </div>

      <div className={`image-wrap ${roundDone && !skipped ? "wiggle" : ""}`}>
        <img
          key={brand}
          src={imageSrc}
          alt="Guess the brand"
          className={`sticker-img ${transitioning ? "spin-out" : "spin-in"}`}
          draggable={false}
        />
      </div>

      <div className={`boxes-wrap ${justWrong ? "shake" : ""}`}>
        <LetterBoxes answer={answer} guessed={guessed} revealed={(skipped || roundDone) && !gravyFail} />
        {wrongCount > 0 && !roundDone && (
          <p className="wrong-count">✗ {wrongCount} wrong</p>
        )}
      </div>

      <div className="action-area">
        <p
          className={`action-msg ${skipped ? "skipped-msg" : "correct-msg"}`}
          style={{ visibility: roundDone ? "visible" : "hidden" }}
        >
          {resultMsg || "·"}
        </p>
        {roundDone ? (
          <button className="btn-action btn-next" onClick={handleNext}>
            {index + 1 < queue.length ? "Next →" : "Finish 🏁"}
          </button>
        ) : (
          <div className="round-btns">
            <button className={`btn-action btn-hint btn-hint-${2 - hintsUsed}`} onClick={handleHint}>
              Hint ({2 - hintsUsed})
            </button>
            <button className="btn-action btn-skip" onClick={handleSkip}>Skip</button>
          </div>
        )}
      </div>
    </div>
  );
}
