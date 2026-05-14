import { useMemo, memo } from "react";

// Fixed drip positions — no random needed, these always look good
const DRIPS = [
  { left: '3%',  w: 32, delay: '0s'     },
  { left: '13%', w: 20, delay: '0.02s'  },
  { left: '24%', w: 40, delay: '0.005s' },
  { left: '36%', w: 24, delay: '0.035s' },
  { left: '48%', w: 46, delay: '0s'     },
  { left: '60%', w: 28, delay: '0.025s' },
  { left: '71%', w: 38, delay: '0.01s'  },
  { left: '82%', w: 22, delay: '0.03s'  },
  { left: '91%', w: 34, delay: '0.015s' },
];

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
      {/* Drip fingers lead the main fill — ooze effect */}
      {DRIPS.map((d, i) => (
        <div
          key={i}
          className="poo-drip"
          style={{ left: d.left, width: d.w, animationDelay: d.delay }}
        />
      ))}
      {/* Main fill follows behind the drips */}
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
