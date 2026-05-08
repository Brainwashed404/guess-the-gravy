import { useState, useCallback } from "react";
import { CATEGORIES } from "./data/categories";
import { loadProgress, saveProgress } from "./data/gameUtils";
import TitleScreen from "./screens/TitleScreen";
import WorldSelect from "./screens/WorldSelect";
import Game from "./screens/Game";
import JigsawGame from "./screens/JigsawGame";
import SlidingGame from "./screens/SlidingGame";
import WorldComplete from "./screens/WorldComplete";
import LevelComplete from "./screens/LevelComplete";
import "./App.css";

function shuffleAll() {
  const all = CATEGORIES.flatMap((c) => c.brands);
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const levels = Array.from({ length: 23 }, (_, i) => {
    const start = Math.floor((i / 23) * all.length);
    const end = Math.floor(((i + 1) / 23) * all.length);
    return all.slice(start, end);
  });
  return levels;
}

export default function App() {
  const [screen, setScreen]           = useState("title");
  const [gameMode, setGameMode]       = useState("letter"); // "letter" | "jigsaw"
  const [currentWorld, setCurrentWorld] = useState(null);
  const [progress, setProgress]       = useState(loadProgress);
  const [lastStars, setLastStars]     = useState([]);

  // ALL mode state
  const [allLevels, setAllLevels]         = useState(null);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);

  const isAllMode = currentWorld === "all";

  const handleSelectWorld = useCallback((worldId) => {
    setCurrentWorld(worldId);
    setScreen("game");
  }, []);

  const handleSelectAll = useCallback(() => {
    setAllLevels(shuffleAll());
    setCurrentLevelIdx(0);
    setCurrentWorld("all");
    setScreen("game");
  }, []);

  const handleWorldComplete = useCallback((worldId, brandStars) => {
    if (isAllMode) {
      setLastStars(brandStars);
      setScreen("levelComplete");
      return;
    }
    const newProgress = { ...progress, [worldId]: { brandStars } };
    setProgress(newProgress);
    saveProgress(newProgress);
    setLastStars(brandStars);
    setScreen("worldComplete");
  }, [progress, isAllMode]);

  // "ALL CATEGORIES" after completing a world → back to world select
  const handleBack = useCallback(() => {
    setAllLevels(null);
    setCurrentWorld(null);
    setScreen("worldSelect");
  }, []);

  // In-game QUIT → title so player can switch modes
  const handleQuit = useCallback(() => {
    setAllLevels(null);
    setCurrentWorld(null);
    setScreen("title");
  }, []);

  const handleNextLevel = useCallback(() => {
    const next = currentLevelIdx + 1;
    if (next >= allLevels.length) {
      setScreen("worldSelect");
      return;
    }
    setCurrentLevelIdx(next);
    setScreen("game");
  }, [currentLevelIdx, allLevels]);

  const handleReplay = useCallback(() => {
    const newProgress = { ...progress };
    delete newProgress[currentWorld];
    setProgress(newProgress);
    saveProgress(newProgress);
    setScreen("game");
  }, [progress, currentWorld]);

  // ── Screens ──────────────────────────────────────────────
  if (screen === "title") {
    return (
      <TitleScreen
        onPlay={() => { setGameMode("letter"); setScreen("worldSelect"); }}
        onJigsaw={() => { setGameMode("jigsaw"); setScreen("worldSelect"); }}
        onSlider={() => { setGameMode("slider"); setScreen("worldSelect"); }}
      />
    );
  }

  if (screen === "worldSelect") {
    return (
      <WorldSelect
        progress={progress}
        onSelectWorld={handleSelectWorld}
        onSelectAll={handleSelectAll}
      />
    );
  }

  if (screen === "game") {
    const brandOverride = isAllMode ? allLevels[currentLevelIdx] : null;
    const sharedProps = {
      worldId: currentWorld,
      brandOverride,
      onComplete: handleWorldComplete,
      onBack: handleQuit, // QUIT mid-game → title to choose mode
    };

    if (gameMode === "jigsaw") {
      return (
        <JigsawGame
          key={isAllMode ? `jigsaw-all-${currentLevelIdx}` : `jigsaw-${currentWorld}`}
          {...sharedProps}
        />
      );
    }

    if (gameMode === "slider") {
      return (
        <SlidingGame
          key={isAllMode ? `slider-all-${currentLevelIdx}` : `slider-${currentWorld}`}
          {...sharedProps}
        />
      );
    }

    return (
      <Game
        key={isAllMode ? `all-${currentLevelIdx}` : currentWorld}
        levelNumber={isAllMode ? currentLevelIdx + 1 : null}
        totalLevels={isAllMode ? allLevels.length : null}
        existingProgress={null}
        {...sharedProps}
      />
    );
  }

  if (screen === "levelComplete") {
    return (
      <LevelComplete
        levelNumber={currentLevelIdx + 1}
        totalLevels={allLevels.length}
        brandStars={lastStars}
        onNext={handleNextLevel}
        onQuit={handleQuit}
      />
    );
  }

  if (screen === "worldComplete") {
    return (
      <WorldComplete
        worldId={currentWorld}
        brandStars={lastStars}
        onBack={handleBack}
        onReplay={handleReplay}
      />
    );
  }
}
