import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { formatUserError, getAudioToken } from '../api/api.js';

/**
 * One LiveKit Room for the duration of a match (KB V2.0).
 *
 * - Mount once per matchId (phase/question changes do not remount this).
 * - One connection for the whole match; RETRY AUDIO re-runs connect only on failure.
 * - Local mute is client-side only (no server mic turns).
 *
 * States:
 *   CONNECTING → "Connecting audio..."
 *   CONNECTED  → "Live audio connected"
 *   FAILED     → "Audio connection unavailable." + [RETRY AUDIO]
 */

/** @typedef {'CONNECTING' | 'CONNECTED' | 'FAILED'} AudioUiState */

/**
 * @param {{
 *   matchId: string,
 *   onAudioConnectedChange?: (connected: boolean) => void,
 * }} props
 */
export default function MatchAudio({ matchId, onAudioConnectedChange }) {
  const [audioState, setAudioState] = useState(/** @type {AudioUiState} */ ('CONNECTING'));
  const [micMuted, setMicMuted] = useState(false);
  const [needsPlaybackUnlock, setNeedsPlaybackUnlock] = useState(false);
  /** Short user-readable reason when audioState === FAILED (never secrets/stacks). */
  const [failReason, setFailReason] = useState('');
  /** Increment to force a reconnect (FAILED → RETRY only). */
  const [retryNonce, setRetryNonce] = useState(0);

  const roomRef = useRef(/** @type {Room | null} */ (null));
  const remoteAudioRootRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const onConnectedRef = useRef(onAudioConnectedChange);
  onConnectedRef.current = onAudioConnectedChange;

  // Report connection status to parent (audioConnected) without remounting
  useEffect(() => {
    onConnectedRef.current?.(audioState === 'CONNECTED');
  }, [audioState]);

  /**
   * Try to play remote audio elements; browsers may block until a user gesture.
   */
  const tryPlayRemoteAudio = useCallback(() => {
    const root = remoteAudioRootRef.current;
    if (!root) return true;
    const elements = root.querySelectorAll('audio');
    let blocked = false;
    elements.forEach((el) => {
      const p = el.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          blocked = true;
        });
      }
    });
    return !blocked;
  }, []);

  const unlockPlayback = useCallback(() => {
    const root = remoteAudioRootRef.current;
    if (!root) {
      setNeedsPlaybackUnlock(false);
      return;
    }
    const plays = Array.from(root.querySelectorAll('audio')).map((el) =>
      el.play().catch(() => null)
    );
    Promise.all(plays).finally(() => {
      setNeedsPlaybackUnlock(false);
    });
  }, []);

  const toggleMute = useCallback(async () => {
    const room = roomRef.current;
    if (!room || audioState !== 'CONNECTED') return;
    const nextMuted = !micMuted;
    try {
      await room.localParticipant.setMicrophoneEnabled(!nextMuted);
      setMicMuted(nextMuted);
    } catch {
      /* keep previous mute state */
    }
  }, [audioState, micMuted]);

  const retryAudio = useCallback(() => {
    setRetryNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!matchId) return undefined;

    let cancelled = false;
    /** @type {Room | null} */
    let room = null;

    /**
     * @param {import('livekit-client').RemoteTrack} track
     */
    const attachRemoteAudio = (track) => {
      if (track.kind !== Track.Kind.Audio) return;
      const el = track.attach();
      el.autoplay = true;
      el.playsInline = true;
      el.setAttribute('data-livekit-audio', 'remote');
      const root = remoteAudioRootRef.current;
      if (root) {
        root.appendChild(el);
      } else {
        document.body.appendChild(el);
      }
      const playResult = el.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(() => {
          if (!cancelled) setNeedsPlaybackUnlock(true);
        });
      }
    };

    /**
     * @param {import('livekit-client').RemoteTrack} track
     */
    const detachRemoteAudio = (track) => {
      if (track.kind !== Track.Kind.Audio) return;
      track.detach().forEach((el) => {
        el.remove();
      });
    };

    const clearRemoteAudioElements = () => {
      const root = remoteAudioRootRef.current;
      if (root) {
        root.querySelectorAll('audio').forEach((el) => el.remove());
      }
    };

    /**
     * Full cleanup: mic off, disconnect room, drop listeners/elements.
     * Called only on unmount / matchId change / retry teardown — not on phase change.
     */
    const cleanupRoom = async (target) => {
      if (!target) return;
      try {
        await target.localParticipant.setMicrophoneEnabled(false);
      } catch {
        /* ignore */
      }
      try {
        target.removeAllListeners();
      } catch {
        /* ignore */
      }
      try {
        await target.disconnect();
      } catch {
        /* ignore */
      }
      clearRemoteAudioElements();
    };

    const connect = async () => {
      setAudioState('CONNECTING');
      setMicMuted(false);
      setNeedsPlaybackUnlock(false);
      setFailReason('');

      try {
        const { token, serverUrl } = await getAudioToken(matchId);
        if (cancelled) return;

        if (!token || !serverUrl) {
          throw new Error('Audio token response was incomplete.');
        }

        room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });
        roomRef.current = room;

        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === Track.Kind.Audio) {
            attachRemoteAudio(track);
          }
        });
        room.on(RoomEvent.TrackUnsubscribed, (track) => {
          detachRemoteAudio(track);
        });
        room.on(RoomEvent.Disconnected, () => {
          if (!cancelled && roomRef.current === room) {
            // Unexpected disconnect while still mounted → failed
            setFailReason('Live audio disconnected. Use Retry audio.');
            setAudioState((s) => (s === 'CONNECTING' ? s : 'FAILED'));
          }
        });

        await room.connect(serverUrl, token);
        if (cancelled) {
          await cleanupRoom(room);
          return;
        }

        // Both mics may stay available all match (no server turn control)
        await room.localParticipant.setMicrophoneEnabled(true);
        if (cancelled) {
          await cleanupRoom(room);
          return;
        }

        room.remoteParticipants.forEach((participant) => {
          participant.audioTrackPublications.forEach((pub) => {
            if (pub.track && pub.track.kind === Track.Kind.Audio) {
              attachRemoteAudio(pub.track);
            }
          });
        });

        if (!cancelled) {
          setFailReason('');
          setAudioState('CONNECTED');
          // Probe autoplay after a tick (elements may still be mounting)
          setTimeout(() => {
            if (cancelled) return;
            if (!tryPlayRemoteAudio()) {
              setNeedsPlaybackUnlock(true);
            }
          }, 0);
        }
      } catch (err) {
        if (!cancelled) {
          setFailReason(
            formatUserError(
              err,
              'Could not connect live audio. Check LiveKit configuration and Retry audio.'
            )
          );
          setAudioState('FAILED');
        }
        try {
          if (room) await cleanupRoom(room);
        } catch {
          /* ignore */
        }
        if (roomRef.current === room) {
          roomRef.current = null;
        }
      }
    };

    connect();

    // Cleanup when: leave MatchPage, match ends (navigate away), matchId changes.
    // NOT when only gameplay phase / question changes (effect deps exclude those).
    return () => {
      cancelled = true;
      onConnectedRef.current?.(false);
      const current = roomRef.current;
      roomRef.current = null;
      cleanupRoom(current || room).catch(() => {});
    };
  }, [matchId, retryNonce, tryPlayRemoteAudio]);

  return (
    <div className="match-audio" aria-live="polite">
      <div ref={remoteAudioRootRef} className="match-audio-remote" hidden />

      {audioState === 'CONNECTING' && (
        <p className="audio-status audio-status--connecting">Connecting audio...</p>
      )}

      {audioState === 'CONNECTED' && (
        <div className="audio-bar">
          <p className="audio-status audio-status--connected">Live audio connected</p>
          <div className="audio-actions">
            {/* Minimal gesture if autoplay blocked remote playback */}
            {needsPlaybackUnlock && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={unlockPlayback}
              >
                Start audio
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={toggleMute}
              aria-pressed={micMuted}
            >
              {micMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>
        </div>
      )}

      {audioState === 'FAILED' && (
        <div className="audio-bar">
          <p className="error audio-status" role="alert">
            Audio connection unavailable.
          </p>
          {failReason ? (
            <p className="audio-fail-detail" role="status">
              {failReason}
            </p>
          ) : null}
          <div className="audio-actions">
            <button type="button" className="btn btn-sm" onClick={retryAudio}>
              Retry audio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
