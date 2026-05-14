// 3 lives displayed as coloured squares that break away one by one.
// wrongCount 0 → all lit; 1 → first dark; 2 → two dark; 3 → GravyFail.
const MAX = 3;

export default function LifeBar({ wrongCount }) {
  return (
    <div className="life-bar">
      {Array.from({ length: MAX }, (_, i) => {
        const lost = i < wrongCount;
        const danger = !lost && wrongCount === MAX - 1 && i === MAX - 1;
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
