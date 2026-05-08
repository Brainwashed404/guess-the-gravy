import { CATEGORIES } from "../data/categories";
import { soundSelectWorld } from "../data/sounds";

const ALL_COLOR = "#f5c842";
const SORTED = [...CATEGORIES].sort((a, b) => a.name.localeCompare(b.name));
const ALL_CARDS = [
  { id: "all", name: "ALL BRANDS", emoji: "🎰", color: ALL_COLOR },
  ...SORTED,
];

export default function WorldSelect({ onSelectWorld, onSelectAll }) {
  return (
    <div className="screen world-select">
      <div className="ws-grid">
        {ALL_CARDS.map((cat, i) => (
          <button
            key={cat.id}
            className="ws-card"
            style={{ "--cat-color": cat.color, "--tile-delay": `${i * 0.06}s` }}
            onPointerDown={soundSelectWorld}
            onClick={() => cat.id === "all" ? onSelectAll() : onSelectWorld(cat.id)}
          >
            <span className="ws-emoji">{cat.emoji}</span>
            <span className="ws-name">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
