import { useMemo } from "react";

const RNG = (min, max) => Math.random() * (max - min) + min;

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

// Module-level queue — persists across mounts so no message repeats until all 35 are seen
let _queue = [];
function pickMessage() {
  if (_queue.length === 0) {
    _queue = [...SASSY].sort(() => Math.random() - 0.5);
  }
  return _queue.pop();
}

function makeDroplets() {
  return Array.from({ length: 32 }, (_, i) => {
    const angle = (i / 32) * 360 + RNG(-8, 8);
    const dist  = RNG(80, 260);
    const rad   = (angle * Math.PI) / 180;
    return {
      id:    i,
      tx:    Math.cos(rad) * dist,
      ty:    Math.sin(rad) * dist,
      w:     RNG(10, 55),
      h:     RNG(8,  45),
      delay: RNG(0, 0.06).toFixed(3),
      dur:   RNG(0.5, 0.85).toFixed(3),
    };
  });
}

function makeArms() {
  // Elongated spikes shooting from centre outward
  return Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * 360 + RNG(-12, 12);
    return {
      id:     i,
      angle,
      width:  RNG(20, 45),
      length: RNG(90, 200),
      delay:  RNG(0, 0.04).toFixed(3),
    };
  });
}

export default function GravyFail({ onReveal, onRetry }) {
  const droplets = useMemo(makeDroplets, []);
  const arms     = useMemo(makeArms,     []);
  const msg      = useMemo(() => pickMessage(), []);

  return (
    <div className="gravy-fail">

      {/* Arms radiating outward from centre */}
      {arms.map(a => (
        <div
          key={a.id}
          className="poo-arm"
          style={{
            "--rot":    `${a.angle}deg`,
            width:      a.width,
            height:     a.length,
            marginLeft: -a.width / 2,
            marginTop:  -a.length,   // bottom of arm sits at top:50% = screen centre
            animationDelay: `${a.delay}s`,
          }}
        />
      ))}

      {/* Droplets flying in all directions */}
      {droplets.map(d => (
        <div
          key={d.id}
          className="poo-splatter"
          style={{
            "--tx":    `${d.tx}px`,
            "--ty":    `${d.ty}px`,
            width:     d.w,
            height:    d.h,
            animationDelay:    `${d.delay}s`,
            animationDuration: `${d.dur}s`,
          }}
        />
      ))}

      {/* Central mass swallows the screen */}
      <div className="poo-blob" />

      {/* Poo + sassy message + next button */}
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
