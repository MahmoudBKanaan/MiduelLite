import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MatchPage from '../src/pages/MatchPage.jsx';

const navigate = vi.fn();
const getMatch = vi.fn();
const submitAnswer = vi.fn();
const submitScore = vi.fn();
const submitReview = vi.fn();

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
  getMatch: (...a) => getMatch(...a),
  submitAnswer: (...a) => submitAnswer(...a),
  submitScore: (...a) => submitScore(...a),
  submitReview: (...a) => submitReview(...a),
}));

const base = {
  matchId: 'm1',
  status: 'ACTIVE',
  phase: 'P1_ANSWER',
  currentQuestion: 4,
  questionText: 'Does technology improve life?',
  flagCount: 1,
  endReason: null,
  role: 'PLAYER_1',
  player1: { id: 'a', displayName: 'Neo', avatarId: 1 },
  player2: { id: 'b', displayName: 'Alex', avatarId: 2 },
  player1Answer: null,
  player2Answer: null,
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

describe('MatchPage (items 93–106)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    navigate.mockClear();
    getMatch.mockReset();
    submitAnswer.mockReset();
    submitScore.mockReset();
    submitReview.mockReset();
    getMatch.mockResolvedValue({ ...base });
    sessionStorage.setItem('playerId', 'a');
    sessionStorage.setItem('sessionToken', 't');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('always shows players, question progress, text, flags', async () => {
    renderMatch();
    await waitFor(() => {
      expect(screen.getByText('Does technology improve life?')).toBeInTheDocument();
    });
    expect(screen.getByText(/Player 1: Neo/)).toBeInTheDocument();
    expect(screen.getByText(/Player 2: Alex/)).toBeInTheDocument();
    expect(screen.getByText(/Question 4 \/ 10/)).toBeInTheDocument();
    expect(screen.getByText(/Flags: 1 \/ 3/)).toBeInTheDocument();
  });

  it('P1_ANSWER: P1 sees textarea + Submit', async () => {
    renderMatch();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^submit$/i })).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/your answer/i)).toBeInTheDocument();
  });

  it('P1_ANSWER: P2 sees waiting message', async () => {
    getMatch.mockResolvedValue({ ...base, role: 'PLAYER_2' });
    renderMatch();
    await waitFor(() => {
      expect(screen.getByText(/Waiting for Player 1/i)).toBeInTheDocument();
    });
  });

  it('P2_SCORE_P1: P2 sees P1 answer + score buttons', async () => {
    getMatch.mockResolvedValue({
      ...base,
      phase: 'P2_SCORE_P1',
      role: 'PLAYER_2',
      player1Answer: 'My great answer',
    });
    renderMatch();
    await waitFor(() => {
      expect(screen.getByText('My great answer')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
  });

  it('REVIEW: Accept score / Flag score only', async () => {
    getMatch.mockResolvedValue({
      ...base,
      phase: 'REVIEW',
      role: 'PLAYER_1',
      ownReceivedScore: 7,
      ownReviewDone: false,
    });
    renderMatch();
    await waitFor(() => {
      expect(screen.getByText('7')).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: /accept score/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /flag score/i })
    ).toBeInTheDocument();
  });

  it('submits answer via POST helper', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    submitAnswer.mockResolvedValue({ ...base, phase: 'P2_SCORE_P1' });
    renderMatch();
    await waitFor(() => screen.getByLabelText(/your answer/i));
    await user.type(screen.getByLabelText(/your answer/i), 'Hello');
    await user.click(screen.getByRole('button', { name: /^submit$/i }));
    await waitFor(() => {
      expect(submitAnswer).toHaveBeenCalledWith('m1', 'Hello');
    });
  });

  it('when status ENDED stops and navigates to result', async () => {
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
