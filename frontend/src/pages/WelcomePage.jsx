import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarPicker from '../components/AvatarPicker.jsx';
import InterestPicker from '../components/InterestPicker.jsx';
import { createPlayer, formatUserError, getConfig, saveSession } from '../api/api.js';

/**
 * Welcome / Profile Setup (items 77–85)
 * Route: /
 */
export default function WelcomePage() {
  const navigate = useNavigate();
  const [interests, setInterests] = useState([]);
  const [displayName, setDisplayName] = useState('');
  const [avatarId, setAvatarId] = useState(null);
  const [interestIds, setInterestIds] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getConfig()
      .then((cfg) => setInterests(cfg.interests || []))
      .catch((e) => setError(formatUserError(e, 'Could not load configuration from backend')));
  }, []);

  const nameTrimmed = displayName.trim();
  const nameValid = nameTrimmed.length >= 2 && nameTrimmed.length <= 20;
  const avatarValid = avatarId >= 1 && avatarId <= 12;
  const interestsValid = interestIds.length === 3;

  const canEnterPool = useMemo(
    () => nameValid && avatarValid && interestsValid && !loading,
    [nameValid, avatarValid, interestsValid, loading]
  );

  const onEnterPool = async () => {
    if (!canEnterPool) return;
    setLoading(true);
    setError('');
    try {
      // POST /api/players
      const res = await createPlayer({
        displayName: nameTrimmed,
        avatarId,
        interestIds,
      });

      // Save playerId + sessionToken in sessionStorage
      saveSession(res.playerId, res.sessionToken);

      // Optional UI cache for pool display
      sessionStorage.setItem('displayName', nameTrimmed);
      sessionStorage.setItem('avatarId', String(avatarId));
      sessionStorage.setItem('interestIds', JSON.stringify(interestIds));

      // Navigate to /pool
      navigate('/pool');
    } catch (e) {
      setError(formatUserError(e, 'Failed to create temporary player'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Minduel Lite</h1>
      <p className="subtitle">Anonymous two-player intellectual competition</p>

      <div className="card">
        <label htmlFor="displayName">Display name</label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          maxLength={20}
          autoComplete="off"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="2–20 characters"
        />
        {displayName.length > 0 && !nameValid && (
          <p className="error">Name must be 2–20 characters after trimming.</p>
        )}

        <label>Avatar (choose one of 12)</label>
        <AvatarPicker value={avatarId} onChange={setAvatarId} />
        {!avatarValid && (
          <p className="selection-count">Select one avatar to continue.</p>
        )}

        <label>Choose exactly 3 interests</label>
        <InterestPicker
          interests={interests}
          selected={interestIds}
          onChange={setInterestIds}
        />

        {error && <p className="error">{error}</p>}

        <button
          type="button"
          className="btn"
          disabled={!canEnterPool}
          onClick={onEnterPool}
        >
          {loading ? 'Creating…' : 'Enter pool'}
        </button>
      </div>
    </div>
  );
}
