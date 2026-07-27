import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { avatarSrc } from '../components/AvatarPicker.jsx';
import ScorePicker from '../components/ScorePicker.jsx';
import {
  formatUserError,
  getMatch,
  submitAnswer,
  submitReview,
  submitScore,
} from '../api/api.js';
import {
  handleAuthFailure,
  requireSessionOrRedirect,
} from '../sessionGuard.js';

/**
 * Match gameplay screen (items 93–106)
 * Route: /match/:matchId
 * UI is driven only by backend phase + current player role.
 */
export default function MatchPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
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

  const refresh = async () => {
    try {
      const data = await getMatch(matchId);
      setState(data);
      // When match status becomes ENDED: stop polling, go to result
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

    // Poll GET /api/matches/:matchId ~1s
    pollRef.current = setInterval(() => {
      refresh().catch(() => {});
    }, 1000);

    return () => {
      cancelled = true;
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, navigate]);

  const onAnswer = async () => {
    if (busy || answer.trim().length < 1) return;
    setBusy(true);
    setError('');
    try {
      // POST /api/matches/:matchId/answer
      const data = await submitAnswer(matchId, answer);
      setState(data);
      setAnswer('');
      if (data.status === 'ENDED') goToResult();
    } catch (e) {
      if (!handleAuthFailure(e, navigate)) {
        setError(formatUserError(e, 'Could not submit answer'));
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
      // POST /api/matches/:matchId/score
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
      // POST /api/matches/:matchId/review  { flag: true|false }
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

  if (!state) {
    return (
      <div className="card">
        <div className="spinner" />
        <p>Loading match…</p>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  const isP1 = state.role === 'PLAYER_1';
  const isP2 = state.role === 'PLAYER_2';
  const phase = state.phase;

  // Phase + role driven controls
  const showP1AnswerForm = phase === 'P1_ANSWER' && isP1;
  const showP1AnswerWait = phase === 'P1_ANSWER' && isP2;

  const showP2ScoreForm = phase === 'P2_SCORE_P1' && isP2;
  const showP2ScoreWait = phase === 'P2_SCORE_P1' && isP1;

  const showP2AnswerForm = phase === 'P2_ANSWER' && isP2;
  const showP2AnswerWait = phase === 'P2_ANSWER' && isP1;

  const showP1ScoreForm = phase === 'P1_SCORE_P2' && isP1;
  const showP1ScoreWait = phase === 'P1_SCORE_P2' && isP2;

  const showReviewForm = phase === 'REVIEW' && !state.ownReviewDone;
  const showReviewWait = phase === 'REVIEW' && state.ownReviewDone;

  const waitingMessage = (text) => (
    <div className="waiting">
      <div className="spinner" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );

  const answerForm = (
    <>
      <label htmlFor="answer">Your answer</label>
      <textarea
        id="answer"
        maxLength={500}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="1–500 characters"
      />
      <button
        type="button"
        className="btn"
        disabled={busy || answer.trim().length < 1}
        onClick={onAnswer}
      >
        Submit
      </button>
    </>
  );

  const scoreForm = (label, answerText) => (
    <>
      <label>{label}</label>
      <div className="answer-preview">{answerText || '—'}</div>
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
    </>
  );

  return (
    <div>
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
          <span>
            Question {state.currentQuestion} / 10
          </span>
          <span>Flags: {state.flagCount} / 3</span>
        </div>

        <p className="question">{state.questionText}</p>

        {/* 97 — P1_ANSWER */}
        {showP1AnswerForm && answerForm}
        {showP1AnswerWait && waitingMessage('Waiting for Player 1…')}

        {/* 98 — P2_SCORE_P1 */}
        {showP2ScoreForm &&
          scoreForm("Player 1's answer", state.player1Answer)}
        {showP2ScoreWait &&
          waitingMessage('Waiting for opponent to score your answer…')}

        {/* 99 — P2_ANSWER */}
        {showP2AnswerForm && answerForm}
        {showP2AnswerWait && waitingMessage('Waiting for Player 2…')}

        {/* 100 — P1_SCORE_P2 */}
        {showP1ScoreForm &&
          scoreForm("Player 2's answer", state.player2Answer)}
        {showP1ScoreWait &&
          waitingMessage('Waiting for opponent to score your answer…')}

        {/* 101 — REVIEW */}
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
          waitingMessage('You already reviewed. Waiting for the other player…')}

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
