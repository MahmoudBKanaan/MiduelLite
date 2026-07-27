/**
 * Score buttons 1–10 for peer scoring.
 */
export default function ScorePicker({ value, onChange }) {
  return (
    <div className="score-grid" role="group" aria-label="Score 1 to 10">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          className={`score-btn${value === n ? ' selected' : ''}`}
          onClick={() => onChange(n)}
          aria-pressed={value === n}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
