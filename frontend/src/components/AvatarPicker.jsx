import avatar1 from '../assets/avatars/avatar-1.svg';
import avatar2 from '../assets/avatars/avatar-2.svg';
import avatar3 from '../assets/avatars/avatar-3.svg';
import avatar4 from '../assets/avatars/avatar-4.svg';
import avatar5 from '../assets/avatars/avatar-5.svg';
import avatar6 from '../assets/avatars/avatar-6.svg';
import avatar7 from '../assets/avatars/avatar-7.svg';
import avatar8 from '../assets/avatars/avatar-8.svg';
import avatar9 from '../assets/avatars/avatar-9.svg';
import avatar10 from '../assets/avatars/avatar-10.svg';
import avatar11 from '../assets/avatars/avatar-11.svg';
import avatar12 from '../assets/avatars/avatar-12.svg';

/** Predefined local avatar assets (IDs 1–12). */
export const AVATAR_IMAGES = {
  1: avatar1,
  2: avatar2,
  3: avatar3,
  4: avatar4,
  5: avatar5,
  6: avatar6,
  7: avatar7,
  8: avatar8,
  9: avatar9,
  10: avatar10,
  11: avatar11,
  12: avatar12,
};

/** Resolve local image URL for avatar id 1–12. */
export function avatarSrc(id) {
  return AVATAR_IMAGES[id] || AVATAR_IMAGES[1];
}

/** Avatar selector: exactly one of 12 predefined local images. */
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
          >
            <img src={avatarSrc(id)} alt="" width={48} height={48} />
          </button>
        );
      })}
    </div>
  );
}
