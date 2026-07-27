/**
 * 32-interest multi-select enforcing exactly three selections.
 * - fewer than 3: continue stays disabled (parent)
 * - at 3: further chips disabled until one is deselected
 */
export default function InterestPicker({ interests, selected, onChange }) {
  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
      return;
    }
    // Enforce max three on the frontend
    if (selected.length >= 3) return;
    onChange([...selected, id]);
  };

  return (
    <>
      <div className="selection-count" aria-live="polite">
        Selected {selected.length} / 3
      </div>
      <div className="interest-grid" role="group" aria-label="Interests">
        {interests.map((item) => {
          const isSelected = selected.includes(item.id);
          const disabled = !isSelected && selected.length >= 3;
          return (
            <button
              key={item.id}
              type="button"
              className={`chip${isSelected ? ' selected' : ''}`}
              disabled={disabled}
              onClick={() => toggle(item.id)}
              aria-pressed={isSelected}
            >
              {item.name}
            </button>
          );
        })}
      </div>
    </>
  );
}
