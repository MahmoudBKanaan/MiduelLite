import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ResultPage from '../src/pages/ResultPage.jsx';

const navigate = vi.fn();
const clearSession = vi.fn();
const getResult = vi.fn(async () => ({
  matchId: 'm1',
  player1: { displayName: 'Neo', avatarId: 1, finalScore: 7.8 },
  player2: { displayName: 'Alex', avatarId: 2, finalScore: 6.9 },
  winner: 'PLAYER_1',
  questionsCompleted: 10,
  flagCount: 1,
  endReason: 'COMPLETED',
}));

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
  getResult: (...a) => getResult(...a),
  clearSession: (...a) => clearSession(...a),
}));

function renderResult() {
  return render(
    <MemoryRouter initialEntries={['/result/m1']}>
      <Routes>
        <Route path="/result/:matchId" element={<ResultPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ResultPage (items 107–115)', () => {
  beforeEach(() => {
    navigate.mockClear();
    clearSession.mockClear();
    getResult.mockClear();
    sessionStorage.setItem('playerId', 'p');
    sessionStorage.setItem('sessionToken', 't');
    sessionStorage.setItem('displayName', 'Neo');
  });

  it('loads GET result and shows players, scores, winner, meta', async () => {
    renderResult();
    await waitFor(() => {
      expect(screen.getByText('Match complete')).toBeInTheDocument();
    });
    expect(getResult).toHaveBeenCalledWith('m1');
    expect(screen.getAllByText('Neo').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('7.8')).toBeInTheDocument();
    expect(screen.getByText('6.9')).toBeInTheDocument();
    expect(screen.getByText(/Questions completed: 10 \/ 10/i)).toBeInTheDocument();
    expect(screen.getByText(/Flags: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/End reason: Completed/i)).toBeInTheDocument();
    expect(screen.getByText(/Winner/i)).toBeInTheDocument();
  });

  it('Play again preserves session and navigates to /pool', async () => {
    const user = userEvent.setup();
    renderResult();
    await waitFor(() => screen.getByRole('button', { name: /play again/i }));
    await user.click(screen.getByRole('button', { name: /play again/i }));
    expect(clearSession).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/pool');
  });

  it('Reset profile clears session and goes to /', async () => {
    const user = userEvent.setup();
    renderResult();
    await waitFor(() => screen.getByRole('button', { name: /reset profile/i }));
    await user.click(screen.getByRole('button', { name: /reset profile/i }));
    expect(clearSession).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('Exit clears session and goes to /', async () => {
    const user = userEvent.setup();
    renderResult();
    await waitFor(() => screen.getByRole('button', { name: /^exit$/i }));
    await user.click(screen.getByRole('button', { name: /^exit$/i }));
    expect(clearSession).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/');
  });
});
