import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { avatarSrc } from '../components/AvatarPicker.jsx';
import {
  formatUserError,
  getConfig,
  joinPool,
  leavePool,
  poolStatus,
} from '../api/api.js';
import {
  handleAuthFailure,
  requireSessionOrRedirect,
} from '../sessionGuard.js';

/**
 * Pool / matchmaking screen (items 86–92)
 * Route: /pool
 */
export default function PoolPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [interestLabels, setInterestLabels] = useState([]);
  const pollRef = useRef(null);
  const leftRef = useRef(false);

  const displayName = sessionStorage.getItem('displayName') || 'Player';
  const avatarId = Number(sessionStorage.getItem('avatarId') || 1);
  let interestIds = [];
  try {
    interestIds = JSON.parse(sessionStorage.getItem('interestIds') || '[]');
  } catch {
    interestIds = [];
  }

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const goToMatch = (matchId) => {
    stopPolling();
    navigate(`/match/${matchId}`);
  };

  useEffect(() => {
    // Refresh reuses playerId/sessionToken; missing session → Welcome
    if (!requireSessionOrRedirect(navigate)) {
      return undefined;
    }

    leftRef.current = false;
    let cancelled = false;

    // Resolve interest names for display
    getConfig()
      .then((cfg) => {
        if (cancelled) return;
        const map = new Map((cfg.interests || []).map((i) => [i.id, i.name]));
        setInterestLabels(
          interestIds.map((id) => map.get(id) || `Interest ${id}`)
        );
      })
      .catch(() => {
        if (!cancelled) {
          setInterestLabels(interestIds.map((id) => String(id)));
        }
      });

    const start = async () => {
      try {
        // POST /api/pool/join
        const res = await joinPool();
        if (cancelled || leftRef.current) return;

        // Immediate match → navigate to match
        if (res.status === 'MATCHED' && res.matchId) {
          goToMatch(res.matchId);
          return;
        }

        // Otherwise poll GET /api/pool/status ~1s
        pollRef.current = setInterval(async () => {
          if (leftRef.current) return;
          try {
            const status = await poolStatus();
            if (status.status === 'MATCHED' && status.matchId) {
              goToMatch(status.matchId);
            }
          } catch {
            /* ignore transient poll errors */
          }
        }, 1000);
      } catch (e) {
        if (!cancelled && !leftRef.current) {
          if (handleAuthFailure(e, navigate)) return;
          setError(formatUserError(e, 'Could not join pool'));
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      stopPolling();
    };
    // interestIds from sessionStorage only needed on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const onCancel = async () => {
    leftRef.current = true;
    stopPolling();
    try {
      // POST /api/pool/leave
      await leavePool();
    } catch {
      /* ignore leave errors */
    }
    // Return to Welcome
    navigate('/');
  };

  return (
    <div>
      <div className="card waiting">
        <img
          src={avatarSrc(avatarId)}
          alt=""
          width={72}
          height={72}
          style={{ borderRadius: 16 }}
        />
        <h2 style={{ marginTop: '0.75rem' }}>{displayName}</h2>
        <ul className="pool-interests">
          {(interestLabels.length
            ? interestLabels
            : interestIds.map(String)
          ).map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
        <div className="spinner" aria-hidden="true" />
        <p>Searching for opponent...</p>
        {error && <p className="error">{error}</p>}
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
