import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PoolPage from '../src/pages/PoolPage.jsx';

const navigate = vi.fn();
const joinPool = vi.fn();
const poolStatus = vi.fn();
const leavePool = vi.fn();
const getConfig = vi.fn(async () => ({
  interests: [
    { id: 1, name: 'Technology' },
    { id: 4, name: 'Science' },
    { id: 8, name: 'Philosophy' },
  ],
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('../src/api/api.js', () => ({
  hasSession: vi.fn(() => true),
  joinPool: (...a) => joinPool(...a),
  poolStatus: (...a) => poolStatus(...a),
  leavePool: (...a) => leavePool(...a),
  getConfig: (...a) => getConfig(...a),
}));

function renderPool() {
  return render(
    <MemoryRouter>
      <PoolPage />
    </MemoryRouter>
  );
}

describe('PoolPage (items 86–92)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    navigate.mockClear();
    joinPool.mockReset();
    poolStatus.mockReset();
    leavePool.mockReset();
    joinPool.mockResolvedValue({ status: 'WAITING' });
    poolStatus.mockResolvedValue({ status: 'WAITING' });
    leavePool.mockResolvedValue({ status: 'LEFT' });
    sessionStorage.setItem('playerId', 'p');
    sessionStorage.setItem('sessionToken', 't');
    sessionStorage.setItem('displayName', 'Neo');
    sessionStorage.setItem('avatarId', '1');
    sessionStorage.setItem('interestIds', JSON.stringify([1, 4, 8]));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('FT-04 displays avatar, name, interests, searching, cancel', async () => {
    renderPool();
    await waitFor(() => {
      expect(screen.getByText('Searching for opponent...')).toBeInTheDocument();
    });
    expect(screen.getByText('Neo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('Science')).toBeInTheDocument();
      expect(screen.getByText('Philosophy')).toBeInTheDocument();
    });
    expect(joinPool).toHaveBeenCalled();
  });

  it('navigates immediately when join returns MATCHED', async () => {
    joinPool.mockResolvedValueOnce({
      status: 'MATCHED',
      matchId: 'match-now',
    });
    renderPool();
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/match/match-now');
    });
  });

  it('polls status and navigates when MATCHED', async () => {
    poolStatus
      .mockResolvedValueOnce({ status: 'WAITING' })
      .mockResolvedValueOnce({ status: 'MATCHED', matchId: 'match-poll' });

    renderPool();
    await waitFor(() => expect(joinPool).toHaveBeenCalled());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/match/match-poll');
    });
  });

  it('Cancel leaves pool and returns to Welcome', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPool();
    await waitFor(() => expect(joinPool).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(leavePool).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith('/');
    });
  });
});
