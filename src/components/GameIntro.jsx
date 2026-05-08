export default function GameIntro({ description, onStart }) {
  return (
    <div className="intro-overlay">
      <div className="intro-card">
        <p className="intro-desc">{description}</p>
        <button className="btn-action intro-btn" onClick={onStart}>
          LET'S GO!
        </button>
      </div>
    </div>
  );
}
