import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { CATEGORIES } from "../data/categories";
import { getAnswer, getUniqueLetters, sortedBrands } from "../data/gameUtils";
import {
  soundCorrectLetter, soundWrongLetter, soundComplete, soundSkip, soundWhoosh, soundTick,
} from "../data/sounds";
import LetterBoxes from "../components/LetterBoxes";
import Keyboard from "../components/Keyboard";
import GameIntro from "../components/GameIntro";
import GravyFail from "../components/GravyFail";

const ALL_CAT = { id: "all", name: "Everything", emoji: "🎰", color: "#f5c842", brands: [] };

const COLS = 4;
const ROWS = 4;
const TOTAL = COLS * ROWS; // 16 pieces
const DURATION_MS = 30000; // 30 seconds
const INTERVAL_MS = DURATION_MS / TOTAL; // ~1875ms per piece

// One solid colour per round — cycles through this palette as brands change
const ROUND_PALETTE = [
  "#e8178a", "#f5c842", "#3b82f6", "#22c55e",
  "#f97316", "#8b5cf6", "#ef4444", "#06b6d4",
  "#84cc16", "#ec4899", "#0ea5e9", "#a3e635",
];

const CORRECT_TEMPLATES = [
  (s) => `GOT IT IN ${s} SECONDS! 🔥`,
  (s) => `${s} SECONDS! NAILED IT! ⚡`,
  (s) => `MINT! ${s} SECONDS FLAT! 🌟`,
  (s) => `GET IN! ONLY ${s} SECONDS! 😤`,
  (s) => `${s} SECONDS? TOO EASY! 😎`,
  (s) => `BOOM! ${s} SECONDS! 💥`,
];
const TIMEUP_MSGS  = ["TIME'S UP! ⏰", "SO CLOSE! 😬", "BLANKED IT! 😶", "NEXT TIME! 💨", "COULDN'T PLACE IT! 🤷"];
const SKIP_MSGS    = ["Skipped 😬", "No idea! 🤷", "Hard pass 😅", "Gave up! 🏳️", "Moving on... 👀", "Nope! 😂", "Better luck next time! 🍀", "Tough one! 🧠"];
function pickFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickCorrectMsg(secs) {
  const fn = CORRECT_TEMPLATES[Math.floor(Math.random() * CORRECT_TEMPLATES.length)];
  return fn(secs);
}

// Centre 2×2 of a 4×4 grid — guaranteed to show logo content, not white border
const INNER_PIECES = [5, 6, 9, 10];

function makeRevealOrder() {
  // Always start with a random inner piece, then shuffle the rest
  const first = INNER_PIECES[Math.floor(Math.random() * INNER_PIECES.length)];
  const rest = Array.from({ length: TOTAL }, (_, i) => i).filter((i) => i !== first);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [first, ...rest];
}

export default function JigsawGame({ worldId, onComplete, onBack, brandOverride }) {
  const cat = CATEGORIES.find((c) => c.id === worldId) || ALL_CAT;
  const [queue] = useState(() =>
    brandOverride ? [...brandOverride] : sortedBrands(cat.brands)
  );

  const [index, setIndex]               = useState(0);
  const [revealOrder, setRevealOrder]   = useState(makeRevealOrder);
  const [revealedCount, setRevealedCount] = useState(0);
  const [guessed, setGuessed]           = useState(new Set());
  const [wrong, setWrong]               = useState(new Set());
  const [wrongCount, setWrongCount]     = useState(0);
  const [justWrong, setJustWrong]       = useState(false);
  const [roundDone, setRoundDone]       = useState(false);
  const [correct, setCorrect]           = useState(false);
  const [resultMsg, setResultMsg]       = useState("");
  const [brandStars, setBrandStars]     = useState([]);
  const [transitioning, setTransitioning] = useState(false);

  const timerRef    = useRef(null);
  const roundStart  = useRef(Date.now());

  const brand         = queue[index];
  const answer        = getAnswer(brand);
  const uniqueLetters = getUniqueLetters(answer);
  const imageSrc      = `/stickers/${encodeURIComponent(brand)}.png`;
  const pieceColor    = ROUND_PALETTE[index % ROUND_PALETTE.length];

  const isComplete = [...uniqueLetters].every((l) => guessed.has(l));

  const revealedSet = useMemo(
    () => new Set(revealOrder.slice(0, revealedCount)),
    [revealOrder, revealedCount]
  );

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const tick = useCallback(() => {
    soundTick();
    setRevealedCount((prev) => {
      const next = prev + 1;
      if (next >= TOTAL) {
        stopTimer();
        setTimeout(() => {
          setRoundDone(true);
          setResultMsg(pickFrom(TIMEUP_MSGS));
        }, 400);
      }
      return next;
    });
  }, [stopTimer]);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(tick, INTERVAL_MS);
  }, [stopTimer, tick]);

  // Timer starts only after the intro is dismissed (see onStart in GameIntro)
  useEffect(() => {
    return stopTimer; // clean up on unmount
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect completion
  useEffect(() => {
    if (isComplete && !roundDone) {
      stopTimer();
      const secs = Math.max(1, Math.round((Date.now() - roundStart.current) / 1000));
      setRevealedCount(TOTAL); // snap all remaining tiles away to show the full logo
      soundComplete();
      // Short delay so the reveal animation plays before the result message appears
      setTimeout(() => {
        setRoundDone(true);
        setCorrect(true);
        setResultMsg(pickCorrectMsg(secs));
      }, 400);
    }
  }, [isComplete, roundDone, stopTimer]);

  const [gravyFail, setGravyFail] = useState(false);

  useEffect(() => {
    if (wrongCount >= 3 && !roundDone) {
      soundSkip();
      stopTimer();
      setGravyFail(true);
      setRoundDone(true);
    }
  }, [wrongCount, roundDone, stopTimer]);

  // Auto-advance after a correct guess
  useEffect(() => {
    if (roundDone && correct && !gravyFail) {
      const t = setTimeout(() => handleNext(), 1500);
      return () => clearTimeout(t);
    }
  }, [roundDone, correct, gravyFail, handleNext]);

  // Keyboard input — same mechanic as the main game
  const handleGuess = useCallback((letter) => {
    if (roundDone || guessed.has(letter) || wrong.has(letter)) return;
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
  }, [roundDone, guessed, wrong, uniqueLetters]);

  const handleNext = useCallback(() => {
    const covered = TOTAL - revealedCount;
    const stars = correct
      ? (covered >= Math.ceil(TOTAL * 0.67) ? 3 : covered >= Math.ceil(TOTAL * 0.33) ? 2 : 1)
      : 0;
    const newBrandStars = [...brandStars, stars];
    setBrandStars(newBrandStars);

    const nextIndex = index + 1;
    if (nextIndex >= queue.length) { onComplete(worldId, newBrandStars); return; }

    soundWhoosh();
    setTransitioning(true);
    setTimeout(() => {
      setIndex(nextIndex);
      setRevealOrder(makeRevealOrder());
      setRevealedCount(0);
      setGuessed(new Set());
      setWrong(new Set());
      setWrongCount(0);
      setJustWrong(false);
      setRoundDone(false);
      setCorrect(false);
      setResultMsg("");
      setGravyFail(false);
      setTransitioning(false);
      roundStart.current = Date.now();
      tick();
      startTimer();
    }, 200);
  }, [revealedCount, correct, brandStars, index, queue.length, onComplete, worldId, startTimer]);

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

  const handleSkip = () => {
    if (roundDone) return;
    soundSkip();
    stopTimer();
    setRevealedCount(TOTAL);
    setTimeout(() => {
      setRoundDone(true);
      setResultMsg(pickFrom(SKIP_MSGS));
    }, 400);
  };

  const handleRetry = () => {
    setRevealOrder(makeRevealOrder());
    setRevealedCount(0);
    setGuessed(new Set());
    setWrong(new Set());
    setWrongCount(0);
    setJustWrong(false);
    setRoundDone(false);
    setCorrect(false);
    setResultMsg("");
    setGravyFail(false);
    roundStart.current = Date.now();
    tick();
    startTimer();
  };

  // Single energy bar = timer. Starts full (cover 0%), drains to dark (cover 100%)
  const timerCover = (revealedCount / TOTAL) * 100;

  const [introSeen, setIntroSeen] = useState(false);

  return (
    <div className="screen jigsaw-game" style={{ "--cat-color": cat.color }}>
      {!introSeen && (
        <GameIntro
          emoji="⏱️"
          title="DIFFICULT"
          description="The logo is covered by tiles. Guess the bootleg brand before they all disappear!"
          onStart={() => { setIntroSeen(true); tick(); startTimer(); }}
        />
      )}
      {gravyFail && <GravyFail onNext={handleNext} onRetry={handleRetry} />}
      <div className="game-header">
        <button className="back-btn" onClick={() => { stopTimer(); onBack(); }}>QUIT</button>
        {roundDone && !gravyFail && resultMsg && (
          <span className={`header-result-msg ${correct ? "result-correct" : "result-skipped"}`}>
            {resultMsg}
          </span>
        )}
        {/* Mobile portrait: Skip / Next in header */}
        {!gravyFail && (
          <div className="mobile-actions">
            {roundDone ? (
              <button className="header-btn header-btn-next" onClick={handleNext}>
                {index + 1 < queue.length ? "Next →" : "Finish 🏁"}
              </button>
            ) : (
              <button className="header-btn header-btn-skip" onClick={handleSkip}>Skip</button>
            )}
          </div>
        )}
      </div>

      {/* ONE energy bar — the countdown timer */}
      <div className="energy-wrap">
        <div className="energy-bar">
          <div className="energy-cover" style={{ width: `${timerCover}%` }} />
        </div>
      </div>

      {/* Jigsaw image with coloured tile overlay */}
      <div className="jigsaw-img-wrap">
        <div className={`jigsaw-img-inner ${roundDone && correct ? "wiggle" : ""}`}>
          <img
            key={index}
            src={imageSrc}
            alt="Guess the brand"
            className={`jigsaw-img ${transitioning ? "spin-out" : "spin-in"}`}
            draggable={false}
          />
          <div className="jigsaw-grid">
            {Array.from({ length: TOTAL }, (_, i) => (
              <div
                key={i}
                className={`jigsaw-piece ${revealedSet.has(i) ? "revealed" : ""}`}
                style={{ background: pieceColor }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Letter boxes — identical to main game */}
      <div className={`boxes-wrap ${justWrong ? "shake" : ""}`}>
        <LetterBoxes answer={answer} guessed={guessed} revealed={roundDone && !gravyFail} />
        {wrongCount > 0 && !roundDone && (
          <p className="wrong-count">✗ {wrongCount} wrong</p>
        )}
      </div>

      <Keyboard
        onGuess={handleGuess}
        correct={guessed}
        wrong={wrong}
        disabled={roundDone || gravyFail}
      />

      {/* Result area */}
      <div className="jigsaw-action">
        <p
          className={`action-msg ${correct ? "correct-msg" : "skipped-msg"}`}
          style={{ visibility: roundDone ? "visible" : "hidden" }}
        >
          {resultMsg || "·"}
        </p>
        {/* Desktop only */}
        <div className="desktop-actions">
          {roundDone ? (
            <button className="btn-action btn-next" onClick={handleNext}>
              {index + 1 < queue.length ? "Next →" : "Finish 🏁"}
            </button>
          ) : (
            <button className="btn-action btn-skip" onClick={handleSkip}>Skip</button>
          )}
        </div>
      </div>
    </div>
  );
}
