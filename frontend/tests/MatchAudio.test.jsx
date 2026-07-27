import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MatchAudio from '../src/components/MatchAudio.jsx';

const getAudioToken = vi.fn();

vi.mock('../src/api/api.js', () => ({
  formatUserError: (e, f) => (e && e.message) || f,
  getAudioToken: (...a) => getAudioToken(...a),
}));

// 123 — Mock LiveKit; no real WebRTC
const connectMock = vi.fn();
const disconnectMock = vi.fn();
const setMicMock = vi.fn();

vi.mock('livekit-client', () => {
  class MockRoom {
    localParticipant = {
      setMicrophoneEnabled: (...args) => setMicMock(...args),
    };
    remoteParticipants = new Map();
    on() {
      return this;
    }
    removeAllListeners() {}
    connect = (...args) => connectMock(...args);
    disconnect = (...args) => disconnectMock(...args);
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

describe('MatchAudio states', () => {
  beforeEach(() => {
    getAudioToken.mockReset();
    connectMock.mockReset();
    disconnectMock.mockReset();
    setMicMock.mockReset();
    connectMock.mockResolvedValue(undefined);
    disconnectMock.mockResolvedValue(undefined);
    setMicMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows CONNECTING audio state while token/connect is in flight', async () => {
    let resolveToken;
    getAudioToken.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveToken = resolve;
        })
    );

    render(<MatchAudio matchId="match-1" />);

    expect(screen.getByText(/Connecting audio\.\.\./i)).toBeInTheDocument();

    await act(async () => {
      resolveToken({
        token: 'tok',
        serverUrl: 'wss://example.livekit.cloud',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Live audio connected/i)).toBeInTheDocument();
    });
  });

  it('shows CONNECTED audio state after successful LiveKit connect', async () => {
    getAudioToken.mockResolvedValue({
      token: 'tok',
      serverUrl: 'wss://example.livekit.cloud',
    });

    const onAudioConnectedChange = vi.fn();
    render(
      <MatchAudio
        matchId="match-1"
        onAudioConnectedChange={onAudioConnectedChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Live audio connected/i)).toBeInTheDocument();
    });
    expect(getAudioToken).toHaveBeenCalledWith('match-1');
    expect(connectMock).toHaveBeenCalledWith(
      'wss://example.livekit.cloud',
      'tok'
    );
    expect(setMicMock).toHaveBeenCalledWith(true);
    expect(onAudioConnectedChange).toHaveBeenCalledWith(true);
    expect(
      screen.getByRole('button', { name: /^mute$/i })
    ).toBeInTheDocument();
  });

  it('FAILED state shows message and provides RETRY AUDIO', async () => {
    getAudioToken.mockRejectedValue(new Error('LiveKit audio is not configured'));

    render(<MatchAudio matchId="match-1" />);

    await waitFor(() => {
      expect(
        screen.getByText(/Audio connection unavailable\./i)
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(/LiveKit audio is not configured/i)
    ).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: /retry audio/i });
    expect(retry).toBeInTheDocument();
    expect(retry).toBeEnabled();
    expect(screen.queryByText(/Live audio connected/i)).not.toBeInTheDocument();
  });

  it('shows FAILED when room.connect fails (still offers RETRY AUDIO)', async () => {
    getAudioToken.mockResolvedValue({
      token: 'tok',
      serverUrl: 'wss://example.livekit.cloud',
    });
    connectMock.mockRejectedValue(new Error('connect failed'));

    render(<MatchAudio matchId="match-1" />);

    await waitFor(() => {
      expect(
        screen.getByText(/Audio connection unavailable\./i)
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: /retry audio/i })
    ).toBeInTheDocument();
  });

  it('RETRY AUDIO re-requests token after FAILED', async () => {
    const user = userEvent.setup();
    getAudioToken
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({
        token: 'tok2',
        serverUrl: 'wss://example.livekit.cloud',
      });

    render(<MatchAudio matchId="match-1" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry audio/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /retry audio/i }));

    await waitFor(() => {
      expect(screen.getByText(/Live audio connected/i)).toBeInTheDocument();
    });
    expect(getAudioToken).toHaveBeenCalledTimes(2);
  });

  it('cleanup on unmount disconnects the LiveKit room and releases mic', async () => {
    getAudioToken.mockResolvedValue({
      token: 'tok',
      serverUrl: 'wss://example.livekit.cloud',
    });
    const onAudioConnectedChange = vi.fn();

    const { unmount } = render(
      <MatchAudio
        matchId="match-1"
        onAudioConnectedChange={onAudioConnectedChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Live audio connected/i)).toBeInTheDocument();
    });
    expect(connectMock).toHaveBeenCalled();
    disconnectMock.mockClear();
    setMicMock.mockClear();
    onAudioConnectedChange.mockClear();

    unmount();

    await waitFor(() => {
      expect(setMicMock).toHaveBeenCalledWith(false);
      expect(disconnectMock).toHaveBeenCalled();
    });
    expect(onAudioConnectedChange).toHaveBeenCalledWith(false);
  });
});
