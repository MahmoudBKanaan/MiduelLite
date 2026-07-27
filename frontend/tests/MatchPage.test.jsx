import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MatchPage from '../src/pages/MatchPage.jsx';

const navigate = vi.fn();
const getMatch = vi.fn();
const completeAnswer = vi.fn();
const submitScore = vi.fn();
const submitReview = vi.fn();
const getAudioToken = vi.fn();
const clearSession = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
    useParams: () => ({ matchId: 'm1' }),
  };
});

vi.mock('../src/api/api.js', () => ({
  hasSession: vi.fn(() => true),
  clearSession: (...a) => clearSession(...a),
  formatUserError: (e, f) => (e && e.message) || f,
  getMatch: (...a) => getMatch(...a),
  completeAnswer: (...a) => completeAnswer(...a),
  getAudioToken: (...a) => getAudioToken(...a),
  submitScore: (...a) => submitScore(...a),
  submitReview: (...a) => submitReview(...a),
}));

// 123 — Mock LiveKit; never open real WebRTC in unit tests
vi.mock('livekit-client', () => {
  class MockRoom {
    localParticipant = {
      setMicrophoneEnabled: vi.fn().mockResolvedValue(undefined),
    };
    remoteParticipants = new Map();
    on() {
      return this;
    }
    removeAllListeners() {}
    connect = vi.fn().mockResolvedValue(undefined);
    disconnect = vi.fn().mockResolvedValue(undefined);
  }
  return {
    Room: MockRoom,
    RoomEvent: {
      TrackSubscribed: 'TrackSubscribed',
      TrackUnsubscribed: 'TrackUnsubscribed',
      Disconnected: 'Disconnected',
    },
    Track: { Kind: { Audio: 'audio', Video: 'video' } },
  };
});

const base = {
  matchId: 'm1',
  status: 'ACTIVE',
  phase: 'P1_ANSWER',
  currentQuestion: 4,
  questionText: 'Does technology improve life?',
  player1FlagCount: 1,
  player2FlagCount: 0,
  ownFlagCount: 1,
  endReason: null,
  role: 'PLAYER_1',
  player1: { id: 'a', displayName: 'Neo', avatarId: 1 },
  player2: { id: 'b', displayName: 'Alex', avatarId: 2 },
  player1AnswerCompleted: false,
  player2AnswerCompleted: false,
  ownReceivedScore: null,
  ownReviewDone: false,
};

function renderMatch() {
  return render(
    <MemoryRouter initialEntries={['/match/m1']}>
      <Routes>
        <Route path="/match/:matchId" element={<MatchPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('MatchPage — spoken answers (no textarea)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    navigate.mockClear();
    clearSession.mockClear();
    getMatch.mockReset();
    completeAnswer.mockReset();
    getAudioToken.mockReset();
    submitScore.mockReset();
    submitReview.mockReset();
    getMatch.mockResolvedValue({ ...base });
    getAudioToken.mockResolvedValue({
      token: 'test-token',
      serverUrl: 'wss://example.livekit.cloud',
    });
    completeAnswer.mockResolvedValue({ ...base, phase: 'P2_SCORE_P1' });
    sessionStorage.setItem('playerId', 'a');
    sessionStorage.setItem('sessionToken', 't');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not render an answer textarea', async () => {
    renderMatch();
    await waitFor(() => {
      expect(screen.getByText(/YOUR TURN TO ANSWER/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/your answer/i)).not.toBeInTheDocument();
  });

  it('Exit match clears session and returns to Welcome', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderMatch();
    await waitFor(() => {
      expect(screen.getByText(/YOUR TURN TO ANSWER/i)).toBeInTheDocument();
    });
    const exitButtons = screen.getAllByRole('button', { name: /exit match/i });
    expect(exitButtons.length).toBeGreaterThanOrEqual(1);
    await user.click(exitButtons[0]);
    expect(clearSession).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('answering player sees ANSWER COMPLETE', async () => {
    renderMatch();
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /answer complete/i })
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/YOUR TURN TO ANSWER/i)).toBeInTheDocument();
    expect(screen.getByText(/Speak your answer to Alex/i)).toBeInTheDocument();
  });

  it('non-answering player sees listening/waiting message (P1_ANSWER)', async () => {
    getMatch.mockResolvedValue({ ...base, role: 'PLAYER_2' });
    renderMatch();
    await waitFor(() => {
      expect(
        screen.getByText(/Player 1 is answering\. Listen to their spoken answer/i)
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('button', { name: /answer complete/i })
    ).not.toBeInTheDocument();
  });

  it('non-answering player sees listening message (P2_ANSWER)', async () => {
    getMatch.mockResolvedValue({
      ...base,
      phase: 'P2_ANSWER',
      role: 'PLAYER_1',
    });
    renderMatch();
    await waitFor(() => {
      expect(
        screen.getByText(/Player 2 is answering\. Listen to their spoken answer/i)
      ).toBeInTheDocument();
    });
  });

  it('clicking Answer Complete calls completeAnswer(matchId)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderMatch();
    await waitFor(() => {
      expect(screen.getByText(/Live audio connected/i)).toBeInTheDocument();
    });
    const btn = screen.getByRole('button', { name: /answer complete/i });
    await waitFor(() => expect(btn).not.toBeDisabled());
    await user.click(btn);
    await waitFor(() => {
      expect(completeAnswer).toHaveBeenCalledWith('m1');
      expect(completeAnswer).toHaveBeenCalledTimes(1);
    });
  });

  it('scoring interface appears for P2_SCORE_P1 (no submitted answer text)', async () => {
    getMatch.mockResolvedValue({
      ...base,
      phase: 'P2_SCORE_P1',
      role: 'PLAYER_2',
    });
    renderMatch();
    await waitFor(() => {
      expect(screen.getByText(/Neo finished answering/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText(/How would you score their spoken answer/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /submit score/i })
    ).toBeInTheDocument();
    // Must not show free-text answer body
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('scoring interface appears for P1_SCORE_P2', async () => {
    getMatch.mockResolvedValue({
      ...base,
      phase: 'P1_SCORE_P2',
      role: 'PLAYER_1',
    });
    renderMatch();
    await waitFor(() => {
      expect(screen.getByText(/Alex finished answering/i)).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: /submit score/i })
    ).toBeInTheDocument();
  });

  it('P2_ANSWER: answering player sees Answer Complete', async () => {
    getMatch.mockResolvedValue({
      ...base,
      phase: 'P2_ANSWER',
      role: 'PLAYER_2',
    });
    renderMatch();
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /answer complete/i })
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Speak your answer to Neo/i)).toBeInTheDocument();
  });

  it('when status ENDED navigates to result', async () => {
    getMatch
      .mockResolvedValueOnce({ ...base })
      .mockResolvedValueOnce({ ...base, status: 'ENDED' });

    renderMatch();
    await waitFor(() => expect(getMatch).toHaveBeenCalled());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/result/m1');
    });
  });
});
