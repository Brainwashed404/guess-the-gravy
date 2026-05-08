import { useState, useEffect, useCallback, useRef } from "react";
import GameIntro from "../components/GameIntro";
import { CATEGORIES } from "../data/categories";
import { getAnswer, sortedBrands } from "../data/gameUtils";
import { soundCorrectLetter, soundWrongLetter, soundComplete, soundSkip, soundWhoosh } from "../data/sounds";

const ALL_CAT = { id: "all", name: "Everything", emoji: "🎰", color: "#f5c842", brands: [] };

const SIZE  = 3;
const TOTAL = SIZE * SIZE;
const EMPTY = TOTAL - 1;

function getNeighbors(pos) {
  const r = Math.floor(pos / SIZE), c = pos % SIZE, n = [];
  if (r > 0)        n.push(pos - SIZE);
  if (r < SIZE - 1) n.push(pos + SIZE);
  if (c > 0)        n.push(pos - 1);
  if (c < SIZE - 1) n.push(pos + 1);
  return n;
}

function makeShuffle() {
  const tiles = Array.from({ length: TOTAL }, (_, i) => i);
  let emptyPos = EMPTY, prev = -1;
  for (let i = 0; i < 100; i++) {
    const opts = getNeighbors(emptyPos).filter(n => n !== prev);
    const next = opts[Math.floor(Math.random() * opts.length)];
    tiles[emptyPos] = tiles[next];
    tiles[next] = EMPTY;
    prev = emptyPos;
    emptyPos = next;
  }
  return tiles;
}

// Analyse which tile slots actually contain logo content.
// Blank (white/transparent) tiles can go anywhere — only content tiles must be solved.
async function detectContentTiles(imageSrc) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const tileSize = 80;
        const canvas = document.createElement("canvas");
        canvas.width  = SIZE * tileSize;
        canvas.height = SIZE * tileSize;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const content = new Set();
        for (let tv = 0; tv < TOTAL - 1; tv++) {
          const col = tv % SIZE, row = Math.floor(tv / SIZE);
          const data = ctx.getImageData(col * tileSize, row * tileSize, tileSize, tileSize).data;
          let contentPx = 0;
          for (let i = 0; i < data.length; i += 4) {
            const [r, g, b, a] = [data[i], data[i+1], data[i+2], data[i+3]];
            // Count pixels that are visible AND not white/near-white
            if (a > 40 && !(r > 230 && g > 230 && b > 230)) contentPx++;
          }
          // >6% non-blank pixels → this tile has real content
          if (contentPx / (tileSize * tileSize) > 0.06) content.add(tv);
        }

        // Safety: if analysis finds nothing, treat all tiles as content
        resolve(content.size > 0 ? content : new Set(Array.from({ length: TOTAL - 1 }, (_, i) => i)));
      } catch {
        resolve(new Set(Array.from({ length: TOTAL - 1 }, (_, i) => i)));
      }
    };
    img.onerror = () => resolve(new Set(Array.from({ length: TOTAL - 1 }, (_, i) => i)));
    img.src = imageSrc;
  });
}

// Win = all CONTENT tiles are in their correct positions (blank tiles ignored)
function isSolvedSmart(tiles, contentTiles) {
  for (const tv of contentTiles) {
    if (tiles.indexOf(tv) !== tv) return false;
  }
  return true;
}

function calcStars(moves) {
  if (moves <= 25) return 3;
  if (moves <= 50) return 2;
  return 1;
}

const SOLVED_MSGS = ["PIECED IT! 🧩", "NAILED IT! 🔥", "GET IN! ⚡", "TOO EASY! 😤", "SLICK WORK! 🌟"];
const SKIP_MSGS   = ["Skipped 😬", "Too tricky! 🤯", "No shame! 🏳️", "Moving on... 👀", "Brain freeze! 🥶"];
function pickFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export default function SlidingGame({ worldId, onComplete, onBack, brandOverride }) {
  const cat = CATEGORIES.find((c) => c.id === worldId) || ALL_CAT;
  const [queue] = useState(() =>
    brandOverride ? [...brandOverride] : sortedBrands(cat.brands)
  );

  const [index, setIndex]             = useState(0);
  const [tiles, setTiles]             = useState(makeShuffle);
  const [moves, setMoves]             = useState(0);
  const [roundDone, setRoundDone]     = useState(false);
  const [skipped, setSkipped]         = useState(false);
  const [resultMsg, setResultMsg]     = useState("");
  const [brandStars, setBrandStars]   = useState([]);
  const [transitioning, setTransitioning] = useState(false);
  // All tile slots treated as content until analysis completes
  const [contentTiles, setContentTiles] = useState(
    () => new Set(Array.from({ length: TOTAL - 1 }, (_, i) => i))
  );
  const [peeking, setPeeking] = useState(false);
  const [peeksUsed, setPeeksUsed] = useState(0);
  const peekTimerRef = useRef(null);

  const brand    = queue[index];
  const answer   = getAnswer(brand);
  const imageSrc = `/stickers/${encodeURIComponent(brand)}.png`;
  const progress = (index / queue.length) * 100;
  const emptyPos = tiles.indexOf(EMPTY);
  const moveablePositions = new Set(getNeighbors(emptyPos));

  // Re-analyse content tiles whenever the brand changes.
  // After detection, ensure the current scrambled state doesn't already
  // satisfy the win condition (unlucky shuffle + sparse content = false win).
  useEffect(() => {
    let live = true;
    detectContentTiles(imageSrc).then(ct => {
      if (!live) return;
      setContentTiles(ct);
      // If the current arrangement already passes smart-win, reshuffle until it doesn't
      setTiles(prev => {
        if (!isSolvedSmart(prev, ct)) return prev;
        let t;
        do { t = makeShuffle(); } while (isSolvedSmart(t, ct));
        return t;
      });
    });
    return () => { live = false; };
  }, [imageSrc]);

  const handleTileClick = useCallback((pos) => {
    if (roundDone) return;
    const ep = tiles.indexOf(EMPTY);
    if (!getNeighbors(ep).includes(pos)) { soundWrongLetter(); return; }

    const newTiles = [...tiles];
    newTiles[ep] = newTiles[pos];
    newTiles[pos] = EMPTY;
    soundCorrectLetter();
    setTiles(newTiles);
    const newMoves = moves + 1;
    setMoves(newMoves);

    if (newMoves >= 3 && isSolvedSmart(newTiles, contentTiles)) {
      soundComplete();
      setRoundDone(true);
      setResultMsg(pickFrom(SOLVED_MSGS));
    }
  }, [tiles, moves, roundDone, contentTiles]);

  const handlePeek = () => {
    if (roundDone) return;
    if (peeksUsed >= 2 || peeking) { soundWrongLetter(); return; }
    setPeeking(true);
    setPeeksUsed(p => p + 1);
    if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
    peekTimerRef.current = setTimeout(() => setPeeking(false), 2000);
  };

  // Clean up peek timer on unmount
  useEffect(() => () => { if (peekTimerRef.current) clearTimeout(peekTimerRef.current); }, []);

  const handleSkip = () => {
    if (roundDone) return;
    soundSkip();
    setTiles(Array.from({ length: TOTAL }, (_, i) => i));
    setRoundDone(true);
    setSkipped(true);
    setResultMsg(pickFrom(SKIP_MSGS));
  };

  const handleNext = useCallback(() => {
    const stars = skipped ? 0 : calcStars(moves);
    const newBrandStars = [...brandStars, stars];
    setBrandStars(newBrandStars);
    const nextIndex = index + 1;
    if (nextIndex >= queue.length) { onComplete(worldId, newBrandStars); return; }
    soundWhoosh();
    setTransitioning(true);
    setTimeout(() => {
      setIndex(nextIndex);
      setTiles(makeShuffle());
      setMoves(0);
      setRoundDone(false);
      setSkipped(false);
      setResultMsg("");
      setPeeksUsed(0);
      setTransitioning(false);
    }, 200);
  }, [skipped, moves, brandStars, index, queue.length, onComplete, worldId]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter" && roundDone) handleNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNext, roundDone]);

  const tileElems = Array.from({ length: TOTAL - 1 }, (_, tv) => {
    const pos    = tiles.indexOf(tv);
    const col    = pos % SIZE;
    const row    = Math.floor(pos / SIZE);
    const srcCol = tv % SIZE;
    const srcRow = Math.floor(tv / SIZE);
    const bgX    = srcCol * (100 / (SIZE - 1));
    const bgY    = srcRow * (100 / (SIZE - 1));
    const canMove = moveablePositions.has(pos) && !roundDone;
    const isBlank = !contentTiles.has(tv);

    return (
      <div
        key={tv}
        className={`slide-tile${canMove ? " slide-moveable" : ""}${isBlank ? " slide-blank" : ""}`}
        style={{
          left:               `calc(${col * 100 / SIZE}% + 2px)`,
          top:                `calc(${row * 100 / SIZE}% + 2px)`,
          width:              `calc(${100 / SIZE}% - 4px)`,
          height:             `calc(${100 / SIZE}% - 4px)`,
          backgroundImage:    `url('${imageSrc}')`,
          backgroundSize:     `${SIZE * 100}% ${SIZE * 100}%`,
          backgroundPosition: `${bgX}% ${bgY}%`,
          cursor:             canMove ? "pointer" : "default",
        }}
        onClick={() => handleTileClick(pos)}
      />
    );
  });

  const [introSeen, setIntroSeen] = useState(false);

  return (
    <div className="screen sliding-game" style={{ "--cat-color": cat.color }}>
      {!introSeen && (
        <GameIntro
          emoji="🧩"
          title="IMPOSSIBLE"
          description="Slide the tiles to piece together the bootleg logo. Good luck — you'll need it."
          onStart={() => setIntroSeen(true)}
        />
      )}
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>QUIT</button>
      </div>

      <div className="energy-wrap">
        <div className="energy-bar">
          <div className="energy-cover" style={{ width: `${100 - progress}%` }} />
        </div>
      </div>

      <div className="slide-wrap">
        <div className={`slide-grid ${roundDone && !skipped ? "wiggle" : ""} ${transitioning ? "spin-out" : "spin-in"}`}>
          <div
            className="slide-ghost"
            style={{ backgroundImage: `url('${imageSrc}')` }}
          />
          {tileElems}
          {peeking && (
            <div
              className="slide-peek-overlay"
              style={{ backgroundImage: `url('${imageSrc}')` }}
            />
          )}
        </div>
      </div>

      <div className="action-area">
        <p className={`action-msg ${roundDone ? (skipped ? "skipped-msg" : "correct-msg") : "slide-moves-msg"}`}>
          {roundDone ? (resultMsg || "·") : `${moves} moves`}
        </p>
        {roundDone ? (
          <button className="btn-action btn-next" onClick={handleNext}>
            {index + 1 < queue.length ? "Next →" : "Finish 🏁"}
          </button>
        ) : (
          <div className="round-btns">
            <button className={`btn-action btn-hint btn-hint-${2 - peeksUsed}`} onClick={handlePeek}>
              Hint ({2 - peeksUsed})
            </button>
            <button className="btn-action btn-skip" onClick={handleSkip}>Skip</button>
          </div>
        )}
      </div>
    </div>
  );
}
