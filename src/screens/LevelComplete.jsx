export default function LevelComplete({ levelNumber, totalLevels, brandStars, onNext, onQuit }) {
  const total = brandStars.length;
  const firstTime = brandStars.filter((s) => s === 3).length;
  const skipped = brandStars.filter((s) => s === 0).length;
  const got = total - skipped;
  const isLast = levelNumber >= totalLevels;

  let verdict = "";
  if (firstTime === total) verdict = "FLAWLESS! 🔥";
  else if (firstTime / total >= 0.8) verdict = "SOLID! 💪";
  else if (firstTime / total >= 0.5) verdict = "NOT BAD! 👌";
  else verdict = "KEEP GOING! 😤";

  return (
    <div className="screen level-complete">
      <div className="lc-inner">
        <p className="lc-label">LEVEL {levelNumber} OF {totalLevels}</p>

        <div className="lc-progress-track">
          {Array.from({ length: totalLevels }).map((_, i) => (
            <div key={i} className={`lc-pip ${i < levelNumber ? "done" : ""}`} />
          ))}
        </div>

        <div className="wc-breakdown">
          <div className="wc-stat">
            <span className="wc-stat-num">{firstTime}</span>
            <span className="wc-stat-label">FIRST TIME</span>
          </div>
          <div className="wc-stat">
            <span className="wc-stat-num">{got - firstTime}</span>
            <span className="wc-stat-label">GOT THERE</span>
          </div>
          <div className="wc-stat">
            <span className="wc-stat-num">{skipped}</span>
            <span className="wc-stat-label">SKIPPED</span>
          </div>
        </div>

        <div className="lc-buttons">
          <button className="btn-secondary" onClick={onQuit}>QUIT</button>
          <button className="btn-primary" onClick={onNext}>
            {isLast ? "FINISH 🏁" : `LEVEL ${levelNumber + 1} →`}
          </button>
        </div>
      </div>
    </div>
  );
}
