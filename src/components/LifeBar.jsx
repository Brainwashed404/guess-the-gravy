// 3 lives shown as squares, stacked vertically beside the logo.
// Drains top-to-bottom (left-to-right reading order):
//   0 wrong → all green
//   1 wrong → top pip red
//   2 wrong → top two red, last pip pulses danger
//   3 wrong → GravyFail
const MAX = 3;

export default function LifeBar({ wrongCount }) {
  return (
    <div className="life-bar">
      {Array.from({ length: MAX }, (_, i) => {
        const lost    = i < wrongCount;                       // drains from the top
        const danger  = !lost && wrongCount === MAX - 1;     // last pip alive, pulse
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
