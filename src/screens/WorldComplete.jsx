import { CATEGORIES } from "../data/categories";

export default function WorldComplete({ worldId, brandStars, onBack, onReplay }) {
  const cat = CATEGORIES.find((c) => c.id === worldId);
  const total = brandStars.length;
  const firstTime = brandStars.filter((s) => s === 3).length;
  const skipped = brandStars.filter((s) => s === 0).length;
  const got = total - skipped;

  let verdict = "";
  if (firstTime === total) verdict = "Flawless. Every single one! 🔥";
  else if (firstTime / total >= 0.8) verdict = "Solid knowledge right there.";
  else if (firstTime / total >= 0.5) verdict = "Not bad. You know your stuff.";
  else if (skipped / total >= 0.5) verdict = "Next time, have a guess!";
  else verdict = "Room to grow. Play again.";

  return (
    <div className="screen world-complete" style={{ "--cat-color": cat.color }}>
      <div className="wc-inner">
        <span className="wc-emoji">{cat.emoji}</span>
        <h2 className="wc-name">{cat.name}</h2>

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

        <div className="wc-buttons">
          <button className="btn-secondary" onClick={onReplay}>PLAY AGAIN</button>
          <button className="btn-primary" onClick={onBack}>ALL CATEGORIES</button>
        </div>
      </div>
    </div>
  );
}
