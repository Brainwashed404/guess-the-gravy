const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

export default function Keyboard({ onGuess, correct, wrong, disabled }) {
  return (
    <div className="keyboard">
      {ROWS.map((row, ri) => (
        <div key={ri} className="kb-row">
          {row.map((letter) => {
            const isCorrect = correct.has(letter);
            const isWrong = wrong.has(letter);
            const cls = isCorrect ? "correct" : isWrong ? "wrong" : "";
            return (
              <button
                key={letter}
                className={`kb-key ${cls}`}
                onClick={() => onGuess(letter)}
                disabled={disabled || isCorrect || isWrong}
              >
                {letter}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
