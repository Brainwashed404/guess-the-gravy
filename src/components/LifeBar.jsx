// 3 lives shown as squares. Green = remaining, red = lost.
// wrongCount 0 → ■■■ green; 1 → ■■ green + 1 red; 2 → ■ green + 2 red; 3 → GravyFail
const MAX = 3;

export default function LifeBar({ wrongCount }) {
  return (
    <div className="life-bar">
      {Array.from({ length: MAX }, (_, i) => {
        // Fill from the right — last pip goes red first feels more natural
        const lostIdx = MAX - 1 - i; // 2, 1, 0
        const lost = lostIdx < wrongCount;
        // Last green pip pulses when danger is imminent (2 already gone)
        const danger = !lost && wrongCount === MAX - 1;
        return (
          <span
            key={i}
            className={`life-pip${lost ? " life-lost" : ""}${danger ? " life-danger" : ""}`}
          />
        );
      })}
    </div>
  );
}
