import { soundGameStart } from "../data/sounds";

export default function TitleScreen({ onPlay, onJigsaw, onSlider }) {
  return (
    <div className="screen title-screen">
      <div className="ts-inner">
        <div className="ts-title-wrap">
          <img src="/logo.png" alt="Guess The Gravy!" className="ts-logo" />
          <p className="ts-subtitle">Can you guess the bootleg brands?</p>
        </div>

        <div className="ts-modes">
          <button className="ts-mode-btn ts-mode-guess" onPointerDown={soundGameStart} onClick={onPlay}>
            EASY
          </button>
          <button className="ts-mode-btn ts-mode-jigsaw" onPointerDown={soundGameStart} onClick={onJigsaw}>
            DIFFICULT
          </button>
          <button className="ts-mode-btn ts-mode-slider" onPointerDown={soundGameStart} onClick={onSlider}>
            IMPOSSIBLE
          </button>
        </div>
      </div>
    </div>
  );
}
