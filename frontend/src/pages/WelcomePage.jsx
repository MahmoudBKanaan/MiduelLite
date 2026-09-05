import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarPicker from '../components/AvatarPicker.jsx';
import InterestPicker from '../components/InterestPicker.jsx';
import BrandBar from '../components/BrandBar.jsx';
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
    <div className="welcome-page">
      <BrandBar />
      <main className="welcome-layout">
        <section className="welcome-hero">
          <span className="eyebrow">Ready when you are</span>
          <h1>Think fast. Speak boldly.</h1>
          <p className="subtitle">A lively one-on-one arena where sharp minds meet, ideas spark, and every answer counts.</p>
          <div className="hero-features">
            <div className="hero-feature"><span className="hero-feature-icon">✦</span><span>Ten questions. One brilliant duel.</span></div>
            <div className="hero-feature"><span className="hero-feature-icon">◉</span><span>Live voice—human, spontaneous, real.</span></div>
            <div className="hero-feature"><span className="hero-feature-icon">↗</span><span>Matched by the things you care about.</span></div>
          </div>
        </section>

        <section className="card profile-card">
          <div className="profile-heading">
            <div>
              <h2>Create your player</h2>
              <p className="subtitle">No account needed. Just bring your curiosity.</p>
            </div>
            <span className="step-chip">3 quick picks</span>
          </div>

          <div className="form-section">
            <label className="sr-only" htmlFor="displayName">Display name</label>
            <div className="field-shell">
              <span className="field-icon" aria-hidden="true">✎</span>
              <input
                id="displayName"
                name="displayName"
                type="text"
                maxLength={20}
                autoComplete="off"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Choose a display name"
              />
              <span className="field-count">{displayName.length}/20</span>
            </div>
          </div>
        {displayName.length > 0 && !nameValid && (
          <p className="error">Name must be 2–20 characters after trimming.</p>
        )}

          <div className="form-section">
            <div className="section-heading">
              <h3>Choose your character</h3>
              <span className="section-helper">{avatarValid ? 'Looking good!' : 'Pick one'}</span>
            </div>
            <AvatarPicker value={avatarId} onChange={setAvatarId} />
          </div>

          <div className="form-section">
            <div className="section-heading">
              <h3>What lights you up?</h3>
              <span className="selection-count">{interestIds.length} of 3</span>
            </div>
            <InterestPicker interests={interests} selected={interestIds} onChange={setInterestIds} />
          </div>

        {error && <p className="error">{error}</p>}

        <button
          type="button"
          className="btn"
          aria-label="Enter pool"
          disabled={!canEnterPool}
          onClick={onEnterPool}
        >
          {loading ? 'Getting things ready…' : <>Find my match <span className="btn-icon" aria-hidden="true">→</span></>}
        </button>
        </section>
      </main>
    </div>
  );
}
