import { useMemo } from "react";

const SASSY = [
  "ABSOLUTELY DIRE",
  "SHOCKINGLY BAD",
  "PURE FILTH",
  "GET BETTER",
  "DISGRACEFUL",
  "WHAT WAS THAT",
  "EMBARRASSING STUFF",
  "TRULY AWFUL",
  "YOUR BRAIN WALKED OUT",
  "HANG YOUR HEAD IN SHAME",
  "NOT EVEN CLOSE",
  "SHOCKING EFFORT",
  "DELETE THIS APP",
  "STICK TO BINGO",
  "A TOTAL DISASTER",
  "ABSOLUTELY CLUELESS",
  "THAT WAS PAINFUL TO WATCH",
  "COME ON NOW",
  "HAVE ANOTHER THINK",
  "BETTER LUCK NEXT TIME",
  "UTTERLY HOPELESS",
  "MATE, SERIOUSLY",
  "MY NAN COULD DO BETTER",
  "ARE YOU EVEN TRYING",
  "SIMPLY NOT GOOD ENOUGH",
  "THAT WAS ROUGH",
  "DID YOU EVEN LOOK",
  "SHOCKING, JUST SHOCKING",
  "BACK TO SCHOOL",
  "TRY AGAIN, SUNSHINE",
  "NO. JUST NO",
  "PULL YOURSELF TOGETHER",
  "THAT HURT TO SEE",
  "WHAT HAPPENED THERE",
  "OH DEAR, OH DEAR",
];

// Module-level queue — persists across mounts so no message repeats until all are seen
let _queue = [];
function pickMessage() {
  if (_queue.length === 0) {
    _queue = [...SASSY].sort(() => Math.random() - 0.5);
  }
  return _queue.pop();
}

export default function GravyFail({ onReveal, onRetry }) {
  const msg = useMemo(() => pickMessage(), []);

  return (
    <div className="gravy-fail">
      {/* Retro top-down wipe */}
      <div className="poo-wipe" />

      {/* Poo + sassy message + buttons */}
      <div className="gravy-fail-msg">
        <span className="poo-emoji">💩</span>
        <span className="poo-msg-text">{msg}</span>
        <div className="poo-btns">
          <button className="poo-next-btn" onClick={onReveal}>Show Answer</button>
          <button className="poo-next-btn poo-retry-btn" onClick={onRetry}>Try Again</button>
        </div>
      </div>
    </div>
  );
}
