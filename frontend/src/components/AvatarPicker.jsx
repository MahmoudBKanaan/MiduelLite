import avatar1 from '../assets/avatars/avatar-v2-1.png';
import avatar2 from '../assets/avatars/avatar-v2-2.png';
import avatar3 from '../assets/avatars/avatar-v2-3.png';
import avatar4 from '../assets/avatars/avatar-v2-4.png';
import avatar5 from '../assets/avatars/avatar-v2-5.png';
import avatar6 from '../assets/avatars/avatar-v2-6.png';
import avatar7 from '../assets/avatars/avatar-v2-7.png';
import avatar8 from '../assets/avatars/avatar-v2-8.png';
import avatar9 from '../assets/avatars/avatar-v2-9.png';
import avatar10 from '../assets/avatars/avatar-v2-10.png';
import avatar11 from '../assets/avatars/avatar-v2-11.png';
import avatar12 from '../assets/avatars/avatar-v2-12.png';

export const AVATAR_IMAGES = {
  1: avatar1, 2: avatar2, 3: avatar3, 4: avatar4,
  5: avatar5, 6: avatar6, 7: avatar7, 8: avatar8,
  9: avatar9, 10: avatar10, 11: avatar11, 12: avatar12,
};

const AVATAR_NAMES = [
  'Fable', 'Byte', 'Sage', 'Nova', 'Sunny', 'Moxie',
  'Orbit', 'Inky', 'Dash', 'Luna', 'Rumi', 'Nimbus',
];

export function avatarSrc(id) {
  return AVATAR_IMAGES[id] || AVATAR_IMAGES[1];
}

export default function AvatarPicker({ value, onChange }) {
  return (
    <div className="avatar-grid" role="listbox" aria-label="Choose avatar">
      {Object.keys(AVATAR_IMAGES).map((key) => {
        const id = Number(key);
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            className={`avatar-btn${selected ? ' selected' : ''}`}
            onClick={() => onChange(id)}
            aria-selected={selected}
            aria-label={`Avatar ${id}`}
            title={AVATAR_NAMES[id - 1]}
          >
            <img src={avatarSrc(id)} alt="" width={80} height={80} />
            {selected && <span className="avatar-check" aria-hidden="true">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
