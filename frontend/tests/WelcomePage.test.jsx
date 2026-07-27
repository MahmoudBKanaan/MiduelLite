import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import WelcomePage from '../src/pages/WelcomePage.jsx';

const navigate = vi.fn();
const createPlayer = vi.fn(async () => ({
  playerId: 'p1',
  sessionToken: 't1',
}));
const saveSession = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('../src/api/api.js', () => ({
  getConfig: vi.fn(async () => ({
    interests: [
      { id: 1, name: 'Technology' },
      { id: 2, name: 'AI' },
      { id: 3, name: 'Programming' },
      { id: 4, name: 'Science' },
    ],
    avatarIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  })),
  createPlayer: (...args) => createPlayer(...args),
  saveSession: (...args) => saveSession(...args),
  hasSession: vi.fn(() => false),
}));

function renderWelcome() {
  return render(
    <MemoryRouter>
      <WelcomePage />
    </MemoryRouter>
  );
}

describe('WelcomePage (items 77–85)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    navigate.mockClear();
    createPlayer.mockClear();
    saveSession.mockClear();
  });

  it('FT-01 Welcome screen renders name, avatars, interests', async () => {
    renderWelcome();
    expect(screen.getByText('Minduel Lite')).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Technology')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Avatar 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Avatar 12')).toBeInTheDocument();
  });

  it('FT-02 Enter Pool disabled until valid name, avatar, 3 interests', async () => {
    const user = userEvent.setup();
    renderWelcome();
    await waitFor(() => screen.getByText('Technology'));
    const btn = screen.getByRole('button', { name: /enter pool/i });
    expect(btn).toBeDisabled();

    await user.type(screen.getByLabelText(/display name/i), 'Neo');
    expect(btn).toBeDisabled();

    await user.click(screen.getByLabelText('Avatar 4'));
    expect(btn).toBeDisabled();

    await user.click(screen.getByText('Technology'));
    await user.click(screen.getByText('AI'));
    await user.click(screen.getByText('Programming'));
    expect(btn).not.toBeDisabled();
  });

  it('FT-03 Interest picker permits exactly three selections', async () => {
    const user = userEvent.setup();
    renderWelcome();
    await waitFor(() => screen.getByText('Technology'));
    await user.click(screen.getByText('Technology'));
    await user.click(screen.getByText('AI'));
    await user.click(screen.getByText('Programming'));
    expect(screen.getByText('Selected 3 / 3')).toBeInTheDocument();
    await user.click(screen.getByText('Science'));
    expect(screen.getByText('Selected 3 / 3')).toBeInTheDocument();
  });

  it('Enter Pool POSTs player, saves session, navigates /pool', async () => {
    const user = userEvent.setup();
    renderWelcome();
    await waitFor(() => screen.getByText('Technology'));
    await user.type(screen.getByLabelText(/display name/i), 'Neo');
    await user.click(screen.getByLabelText('Avatar 4'));
    await user.click(screen.getByText('Technology'));
    await user.click(screen.getByText('AI'));
    await user.click(screen.getByText('Programming'));
    await user.click(screen.getByRole('button', { name: /enter pool/i }));

    await waitFor(() => {
      expect(createPlayer).toHaveBeenCalledWith({
        displayName: 'Neo',
        avatarId: 4,
        interestIds: [1, 2, 3],
      });
    });
    expect(saveSession).toHaveBeenCalledWith('p1', 't1');
    expect(navigate).toHaveBeenCalledWith('/pool');
  });
});
