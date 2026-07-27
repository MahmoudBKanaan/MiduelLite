import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { avatarSrc } from '../components/AvatarPicker.jsx';
import MatchAudio from '../components/MatchAudio.jsx';
import ScorePicker from '../components/ScorePicker.jsx';
import {
  clearSession,
  formatUserError,
  getMatch,
  completeAnswer,
  submitReview,
  submitScore,
} from '../api/api.js';
import {
  handleAuthFailure,
  requireSessionOrRedirect,
} from '../sessionGuard.js';

/**
 * Match gameplay screen
 * Route: /match/:matchId
 *
 * Spoken answers only: no text state, no character limits, no answer body.
 * ANSWER COMPLETE → completeAnswer(matchId) (empty POST — no audio/transcript).
 */
export default function MatchPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [score, setScore] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  /** Reported by MatchAudio — normal React state only. */
  const [audioConnected, setAudioConnected] = useState(false);
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const goToResult = () => {
    stopPolling();
    navigate(`/result/${matchId}`);
  };

  /**
   * Leave an ongoing match: stop poll, drop temporary session, return to Welcome.
   * MatchAudio unmounts with the page and disconnects LiveKit.
   */
  const onExitMatch = () => {
    stopPolling();
    clearSession();
    navigate('/');
  };

  const refresh = async () => {
    try {
      const data = await getMatch(matchId);
      setState(data);
      if (data.status === 'ENDED') {
        goToResult();
      }
      return data;
    } catch (e) {
      if (handleAuthFailure(e, navigate)) return null;
      throw e;
    }
  };

  useEffect(() => {
    if (!requireSessionOrRedirect(navigate)) {
      return undefined;
    }

    let cancelled = false;

    refresh().catch((e) => {
      if (!cancelled) setError(formatUserError(e, 'Could not load match'));
    });

    pollRef.current = setInterval(() => {
      refresh().catch(() => {});
    }, 1000);

    return () => {
      cancelled = true;
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, navigate]);

  /**
   * Mark spoken turn complete. Sends no answer text, no audio file, no transcript.
   */
  const onAnswerComplete = async () => {
    if (busy || !audioConnected || !state) return;
    const phase = state.phase;
    const role = state.role;
    const mayComplete =
      (phase === 'P1_ANSWER' && role === 'PLAYER_1') ||
      (phase === 'P2_ANSWER' && role === 'PLAYER_2');
    if (!mayComplete) return;

    setBusy(true);
    setError('');
    try {
      const data = await completeAnswer(matchId);
      setState(data);
      if (data.status === 'ENDED') goToResult();
    } catch (e) {
      if (!handleAuthFailure(e, navigate)) {
        setError(formatUserError(e, 'Could not complete answer'));
      }
    } finally {
      setBusy(false);
    }
  };

  const onScore = async () => {
    if (busy || !score) return;
    setBusy(true);
    setError('');
    try {
      const data = await submitScore(matchId, score);
      setState(data);
      setScore(null);
      if (data.status === 'ENDED') goToResult();
    } catch (e) {
      if (!handleAuthFailure(e, navigate)) {
        setError(formatUserError(e, 'Could not submit score'));
      }
    } finally {
      setBusy(false);
    }
  };

  const onReview = async (flag) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const data = await submitReview(matchId, flag);
      setState(data);
      if (data.status === 'ENDED') goToResult();
    } catch (e) {
      if (!handleAuthFailure(e, navigate)) {
        setError(formatUserError(e, 'Could not submit review'));
      }
    } finally {
      setBusy(false);
    }
  };

  const waitingMessage = (text) => (
    <div className="waiting">
      <div className="spinner" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );

  /**
   * Answer turn UI for the active speaker.
   * ANSWER COMPLETE enabled only when role+phase correct, audio connected, not busy.
   */
  const answerCompletePanel = (opponentDisplayName, canComplete) => (
    <div className="answer-turn">
      <h2 className="turn-title">YOUR TURN TO ANSWER</h2>
      <p className="muted-hint">
        Speak your answer to {opponentDisplayName}.
      </p>
      <button
        type="button"
        className="btn"
        disabled={!canComplete}
        onClick={onAnswerComplete}
      >
        Answer complete
      </button>
      {!audioConnected && (
        <p className="muted-hint">
          Connect live audio before completing your answer.
        </p>
      )}
    </div>
  );

  /**
   * Peer scoring after a spoken answer (no stored answer text).
   * ScorePicker 1–10 + Submit score unchanged; no audio logic here.
   */
  const scoreForm = (speakerDisplayName) => (
    <div className="score-turn">
      <p className="muted-hint">
        {speakerDisplayName} finished answering.
      </p>
      <p className="muted-hint">
        How would you score their spoken answer?
      </p>
      <label>Score (1–10)</label>
      <ScorePicker value={score} onChange={setScore} />
      <button
        type="button"
        className="btn"
        disabled={busy || !score}
        onClick={onScore}
      >
        Submit score
      </button>
    </div>
  );

  const isP1 = state?.role === 'PLAYER_1';
  const isP2 = state?.role === 'PLAYER_2';
  const phase = state?.phase;

  const showP1AnswerForm = phase === 'P1_ANSWER' && isP1;
  const showP1AnswerWait = phase === 'P1_ANSWER' && isP2;
  const showP2ScoreForm = phase === 'P2_SCORE_P1' && isP2;
  const showP2ScoreWait = phase === 'P2_SCORE_P1' && isP1;
  const showP2AnswerForm = phase === 'P2_ANSWER' && isP2;
  const showP2AnswerWait = phase === 'P2_ANSWER' && isP1;
  const showP1ScoreForm = phase === 'P1_SCORE_P2' && isP1;
  const showP1ScoreWait = phase === 'P1_SCORE_P2' && isP2;
  const showReviewForm = phase === 'REVIEW' && state && !state.ownReviewDone;
  const showReviewWait = phase === 'REVIEW' && state && state.ownReviewDone;

  // ANSWER COMPLETE: correct player + correct phase + audio connected + not submitting
  const canP1Complete =
    showP1AnswerForm && audioConnected && !busy;
  const canP2Complete =
    showP2AnswerForm && audioConnected && !busy;

  return (
    <div>
      <div className="match-top-bar">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onExitMatch}
        >
          Exit match
        </button>
      </div>

      {matchId ? (
        <MatchAudio
          matchId={matchId}
          onAudioConnectedChange={setAudioConnected}
        />
      ) : null}

      <span
        className="sr-only"
        data-audio-connected={audioConnected ? 'true' : 'false'}
      >
        {audioConnected ? 'Audio connected' : 'Audio not connected'}
      </span>

      {!state ? (
        <div className="card">
          <div className="spinner" />
          <p>Loading match…</p>
          {error && <p className="error">{error}</p>}
        </div>
      ) : (
        <>
          <div className="players-row">
            <div className="player-pill">
              <img
                src={avatarSrc(state.player1.avatarId)}
                alt=""
                width={40}
                height={40}
              />
              <div>
                Player 1: {state.player1.displayName}
                {isP1 ? ' (you)' : ''}
              </div>
            </div>
            <div className="player-pill">
              <img
                src={avatarSrc(state.player2.avatarId)}
                alt=""
                width={40}
                height={40}
              />
              <div>
                Player 2: {state.player2.displayName}
                {isP2 ? ' (you)' : ''}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="meta">
              <span>Question {state.currentQuestion} / 10</span>
              <span>Your score strikes: {state.ownFlagCount} / 3</span>
            </div>

            <p className="question">{state.questionText}</p>

            {/* P1_ANSWER */}
            {showP1AnswerForm &&
              answerCompletePanel(state.player2.displayName, canP1Complete)}
            {showP1AnswerWait &&
              waitingMessage(
                'Player 1 is answering. Listen to their spoken answer.'
              )}

            {/* P2_SCORE_P1 — score Player 1's spoken answer (no answer text) */}
            {showP2ScoreForm && scoreForm(state.player1.displayName)}
            {showP2ScoreWait &&
              waitingMessage('Waiting for opponent to score your answer…')}

            {/* P2_ANSWER */}
            {showP2AnswerForm &&
              answerCompletePanel(state.player1.displayName, canP2Complete)}
            {showP2AnswerWait &&
              waitingMessage(
                'Player 2 is answering. Listen to their spoken answer.'
              )}

            {/* P1_SCORE_P2 — score Player 2's spoken answer (no answer text) */}
            {showP1ScoreForm && scoreForm(state.player2.displayName)}
            {showP1ScoreWait &&
              waitingMessage('Waiting for opponent to score your answer…')}

            {/* REVIEW — score received + ACCEPT / FLAG only; no audio-specific logic */}
            {showReviewForm && (
              <>
                <label>Score you received</label>
                <div className="result-score">{state.ownReceivedScore}</div>
                <div className="stack-gap">
                  <button
                    type="button"
                    className="btn btn-success"
                    disabled={busy}
                    onClick={() => onReview(false)}
                  >
                    Accept score
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={busy}
                    onClick={() => onReview(true)}
                  >
                    Flag score
                  </button>
                </div>
              </>
            )}
            {showReviewWait &&
              waitingMessage(
                'You already reviewed. Waiting for the other player…'
              )}

            {error && <p className="error">{error}</p>}

            <div className="match-exit-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onExitMatch}
              >
                Exit match
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
