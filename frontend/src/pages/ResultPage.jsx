import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { avatarSrc } from '../components/AvatarPicker.jsx';
import { clearSession, formatUserError, getResult } from '../api/api.js';
import {
  handleAuthFailure,
  requireSessionOrRedirect,
} from '../sessionGuard.js';

/**
 * Result screen (items 107–115)
 * Route: /result/:matchId
 */
export default function ResultPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!requireSessionOrRedirect(navigate)) {
      return;
    }
    // GET /api/matches/:matchId/result
    getResult(matchId)
      .then(setResult)
      .catch((e) => {
        if (handleAuthFailure(e, navigate)) return;
        setError(formatUserError(e, 'Could not load result'));
      });
  }, [matchId, navigate]);

  /** Keep temporary profile; re-enter matchmaking. */
  const onPlayAgain = () => {
    // Do NOT clear sessionStorage
    navigate('/pool');
  };

  /** Clear temporary identity and return to Welcome. */
  const onResetProfile = () => {
    clearSession();
    navigate('/');
  };

  /** Clear temporary identity and return to Welcome. */
  const onExit = () => {
    clearSession();
    navigate('/');
  };

  if (!result && !error) {
    return (
      <div className="card">
        <div className="spinner" />
        <p>Loading result…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <p className="error">{error}</p>
        <button type="button" className="btn" onClick={onExit}>
          Exit
        </button>
      </div>
    );
  }

  const isDraw = result.winner === 'DRAW';
  const winnerLabel = isDraw
    ? 'Draw'
    : result.winner === 'PLAYER_1'
      ? result.player1.displayName
      : result.player2.displayName;

  const endReasonLabel =
    result.endReason === 'THREE_FLAGS'
      ? 'Ended after one player struck three received scores'
      : result.endReason === 'COMPLETED'
        ? 'Completed'
        : result.endReason || '—';

  return (
    <div>
      <h1>Match complete</h1>

      <div className="winner-banner">
        <span>{isDraw ? 'Result' : 'Winner'}</span>
        <strong>{winnerLabel}</strong>
      </div>

      <div className="players-row">
        <div className="player-pill">
          <img
            src={avatarSrc(result.player1.avatarId)}
            alt=""
            width={40}
            height={40}
          />
          <div>{result.player1.displayName}</div>
          <div className="result-score">{result.player1.finalScore}</div>
        </div>
        <div className="player-pill">
          <img
            src={avatarSrc(result.player2.avatarId)}
            alt=""
            width={40}
            height={40}
          />
          <div>{result.player2.displayName}</div>
          <div className="result-score">{result.player2.finalScore}</div>
        </div>
      </div>

      <div className="card">
        <p>Questions completed: {result.questionsCompleted} / 10</p>
        <p>
          {result.player1.displayName} score strikes: {result.player1FlagCount}
        </p>
        <p>
          {result.player2.displayName} score strikes: {result.player2FlagCount}
        </p>
        <p>End reason: {endReasonLabel}</p>

        <button type="button" className="btn" onClick={onPlayAgain}>
          Play again
        </button>
        <button type="button" className="btn btn-secondary" onClick={onResetProfile}>
          Reset profile
        </button>
        <button type="button" className="btn btn-secondary" onClick={onExit}>
          Exit
        </button>
      </div>
    </div>
  );
}
