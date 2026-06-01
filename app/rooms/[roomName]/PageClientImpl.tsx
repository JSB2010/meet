'use client';

import React from 'react';
import { decodePassphrase } from '@/lib/client-utils';
import { KeyboardShortcuts } from '@/lib/KeyboardShortcuts';
import { RecordingIndicator } from '@/lib/RecordingIndicator';
import { SettingsMenu } from '@/lib/SettingsMenu';
import { ConnectionDetails } from '@/lib/types';
import { BrandLogo, JacobCredit, ThemeToggle } from '@/app/MeetChrome';
import {
  formatChatMessageLinks,
  LocalUserChoices,
  RoomContext,
  usePreviewTracks,
  VideoConference,
} from '@livekit/components-react';
import {
  ExternalE2EEKeyProvider,
  RoomOptions,
  VideoCodec,
  VideoPresets,
  Room,
  DeviceUnsupportedError,
  RoomConnectOptions,
  RoomEvent,
  Track,
  TrackPublishDefaults,
  VideoCaptureOptions,
  type LocalAudioTrack,
  type LocalVideoTrack,
} from 'livekit-client';
import { useRouter } from 'next/navigation';
import { useSetupE2EE } from '@/lib/useSetupE2EE';
import { useLowCPUOptimizer } from '@/lib/usePerfomanceOptimiser';

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details';
const SHOW_SETTINGS_MENU = process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU == 'true';

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function VideoIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="6" width="13" height="12" rx="2.5" />
      <path d="m16 10 4.5-2.6a.7.7 0 0 1 1 .6v8a.7.7 0 0 1-1 .6L16 14" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg {...iconProps}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg {...iconProps}>
      <path d="M9 9v2a3 3 0 0 0 4.6 2.5M15 11.4V6a3 3 0 0 0-5.9-.7" />
      <path d="M5.5 11a6.5 6.5 0 0 0 10 5.4M12 17.5V21M9 21h6M4 3l16 16" />
    </svg>
  );
}

function CameraOffIcon() {
  return (
    <svg {...iconProps}>
      <path d="M16 9.5V8a2.5 2.5 0 0 0-2.5-2.5H8M3.8 6.2A2.5 2.5 0 0 0 3 8v8a2.5 2.5 0 0 0 2.5 2.5h8c.5 0 1-.16 1.4-.42M16 13l4.5 2.6a.7.7 0 0 0 1-.6V8" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 13H4.5a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 11 4.6V4.5a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.1a2 2 0 1 1 0 4h-.1Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3.2 5 6v5.5c0 4.2 2.9 7.3 7 8.8 4.1-1.5 7-4.6 7-8.8V6l-7-2.8Z" />
      <path d="m9.2 12 1.9 1.9 3.7-3.8" />
    </svg>
  );
}

function getDeviceLabel(device: MediaDeviceInfo, fallback: string) {
  return device.label || fallback;
}

function useAudioLevel(audioTrack?: LocalAudioTrack) {
  const [level, setLevel] = React.useState(0);

  React.useEffect(() => {
    if (!audioTrack) {
      const resetFrame = window.requestAnimationFrame(() => setLevel(0));
      return () => window.cancelAnimationFrame(resetFrame);
    }

    let frame = 0;
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }
    const context = new AudioContextClass();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    const source = context.createMediaStreamSource(
      new MediaStream([audioTrack.mediaStreamTrack]),
    );
    const data = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);

    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const value of data) {
        const normalized = (value - 128) / 128;
        sum += normalized * normalized;
      }
      setLevel(Math.min(1, Math.sqrt(sum / data.length) * 7));
      frame = window.requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.cancelAnimationFrame(frame);
      source.disconnect();
      void context.close();
    };
  }, [audioTrack]);

  return level;
}

function CameraPreview({
  name,
  camOff,
  videoTrack,
  previewError,
}: {
  name: string;
  camOff: boolean;
  videoTrack?: LocalVideoTrack;
  previewError: string;
}) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const element = videoRef.current;
    if (!element || !videoTrack || camOff) {
      return;
    }
    videoTrack.attach(element);
    return () => {
      videoTrack.detach(element);
    };
  }, [camOff, videoTrack]);

  return (
    <div className={`camprev ${camOff ? 'camprev-off' : ''}`}>
      {!camOff && videoTrack ? (
        <video ref={videoRef} className="camprev-video" playsInline muted />
      ) : (
        <>
          <div className="camprev-feed">
            <div className="camprev-glow" />
            <div className="camprev-silhouette">
              <div className="cp-shoulders" />
              <div className="cp-head" />
            </div>
            <div className="camprev-grain" />
          </div>
          <div className="prejoin-avatar">{initials || 'YO'}</div>
          {previewError && <span className="camprev-error">{previewError}</span>}
        </>
      )}
      <span className="camprev-name">{name || 'You'}</span>
    </div>
  );
}

function PreJoinPanel({
  roomName,
  meetingTitle,
  defaults,
  error,
  onSubmit,
}: {
  roomName: string;
  meetingTitle: string;
  defaults: LocalUserChoices;
  error: string;
  onSubmit: (values: LocalUserChoices) => Promise<void>;
}) {
  const [username, setUsername] = React.useState(defaults.username);
  const [videoEnabled, setVideoEnabled] = React.useState(defaults.videoEnabled);
  const [audioEnabled, setAudioEnabled] = React.useState(defaults.audioEnabled);
  const [videoDeviceId, setVideoDeviceId] = React.useState(defaults.videoDeviceId ?? '');
  const [audioDeviceId, setAudioDeviceId] = React.useState(defaults.audioDeviceId ?? '');
  const [videoDevices, setVideoDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [previewError, setPreviewError] = React.useState('');
  const [nameError, setNameError] = React.useState('');
  const [isJoining, setIsJoining] = React.useState(false);
  const previewTracks = usePreviewTracks(
    {
      video: videoEnabled
        ? {
            deviceId: videoDeviceId || undefined,
            resolution: VideoPresets.h720,
          }
        : false,
      audio: audioEnabled ? { deviceId: audioDeviceId || undefined } : false,
    },
    React.useCallback((previewTrackError: Error) => {
      setPreviewError(previewTrackError.message || 'Could not start camera or microphone.');
    }, []),
  );
  const videoTrack = React.useMemo(
    () =>
      previewTracks?.find(
        (track): track is LocalVideoTrack => track.kind === Track.Kind.Video,
      ),
    [previewTracks],
  );
  const audioTrack = React.useMemo(
    () =>
      previewTracks?.find(
        (track): track is LocalAudioTrack => track.kind === Track.Kind.Audio,
      ),
    [previewTracks],
  );
  const audioLevel = useAudioLevel(audioEnabled ? audioTrack : undefined);

  const refreshDevices = React.useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setPreviewError('This browser does not support media device selection.');
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setVideoDevices(devices.filter((device) => device.kind === 'videoinput'));
      setAudioDevices(devices.filter((device) => device.kind === 'audioinput'));
      setPreviewError('');
    } catch (deviceError) {
      setPreviewError(
        deviceError instanceof Error
          ? deviceError.message
          : 'Could not read camera and microphone devices.',
      );
    }
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshDevices();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [previewTracks, refreshDevices]);

  React.useEffect(() => {
    if (!videoDeviceId && videoTrack) {
      const selectedDeviceId = videoTrack.mediaStreamTrack.getSettings().deviceId;
      if (selectedDeviceId) {
        queueMicrotask(() => setVideoDeviceId(selectedDeviceId));
      }
    }
    if (!audioDeviceId && audioTrack) {
      const selectedDeviceId = audioTrack.mediaStreamTrack.getSettings().deviceId;
      if (selectedDeviceId) {
        queueMicrotask(() => setAudioDeviceId(selectedDeviceId));
      }
    }
  }, [audioDeviceId, audioTrack, videoDeviceId, videoTrack]);

  const submit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const cleanName = username.trim();
      if (!cleanName) {
        setNameError('Enter the name guests will see.');
        return;
      }
      setNameError('');
      setIsJoining(true);
      await onSubmit({
        username: cleanName,
        videoEnabled,
        audioEnabled,
        videoDeviceId,
        audioDeviceId,
      });
      setIsJoining(false);
    },
    [audioDeviceId, audioEnabled, onSubmit, username, videoDeviceId, videoEnabled],
  );

  return (
    <div className="green screen-scroll fade-in">
      <header className="appbar">
        <BrandLogo />
        <div className="appbar-right">
          <span className="tag">
            <ShieldIcon />
            Waiting room on
          </span>
          <ThemeToggle />
        </div>
      </header>

      <div className="green-body">
        <div className="green-stage rise">
          <CameraPreview
            name={username || 'You'}
            camOff={!videoEnabled}
            videoTrack={videoTrack}
            previewError={previewError}
          />
          <div className="green-stage-controls">
            <button
              className="stage-ctrl"
              data-off={!audioEnabled}
              onClick={() => setAudioEnabled((value) => !value)}
              type="button"
              aria-label="Microphone"
            >
              {audioEnabled ? <MicIcon /> : <MicOffIcon />}
            </button>
            <button
              className="stage-ctrl"
              data-off={!videoEnabled}
              onClick={() => setVideoEnabled((value) => !value)}
              type="button"
              aria-label="Camera"
            >
              {videoEnabled ? <VideoIcon /> : <CameraOffIcon />}
            </button>
            <button
              className="stage-ctrl"
              type="button"
              aria-label="Refresh devices"
              onClick={() => void refreshDevices()}
            >
              <SettingsIcon />
            </button>
          </div>
          <div className="mic-meter" aria-label="Microphone level">
            {Array.from({ length: 18 }).map((_, index) => (
              <span
                key={index}
                data-active={audioEnabled && audioLevel * 18 > index}
              />
            ))}
          </div>
        </div>

        <form className="green-panel" onSubmit={submit}>
          <div>
            <span className="eyebrow">Ready to join</span>
            <h2>Check your camera & mic</h2>
            <p className="sub">Pick a name guests will see, then join the room.</p>
          </div>

          <div className="green-room-meta">
            <span className="rl">Joining</span>
            <span className="rn">
              <VideoIcon />
              {meetingTitle} · {roomName}
            </span>
          </div>

          <label className="field">
            <span className="field-label">Your display name</span>
            <input
              className="input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="e.g. Alex Rivera"
              maxLength={32}
              autoComplete="name"
            />
          </label>

          <div className="green-devices" aria-label="Media devices">
            <label className="device-row">
              <span className="di">
                <MicIcon />
              </span>
              <span className="device-copy">
                <span>Microphone</span>
                <select
                  className="device-select"
                  value={audioDeviceId}
                  onChange={(event) => setAudioDeviceId(event.target.value)}
                  disabled={!audioEnabled}
                >
                  <option value="">System default microphone</option>
                  {audioDevices.map((device, index) => (
                    <option key={device.deviceId || index} value={device.deviceId}>
                      {getDeviceLabel(device, `Microphone ${index + 1}`)}
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <label className="device-row">
              <span className="di">
                <VideoIcon />
              </span>
              <span className="device-copy">
                <span>Camera</span>
                <select
                  className="device-select"
                  value={videoDeviceId}
                  onChange={(event) => setVideoDeviceId(event.target.value)}
                  disabled={!videoEnabled}
                >
                  <option value="">System default camera</option>
                  {videoDevices.map((device, index) => (
                    <option key={device.deviceId || index} value={device.deviceId}>
                      {getDeviceLabel(device, `Camera ${index + 1}`)}
                    </option>
                  ))}
                </select>
              </span>
            </label>
          </div>

          {(nameError || error) && (
            <p className="join-error" role="alert">
              {nameError || error}
            </p>
          )}

          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={isJoining}>
            <VideoIcon />
            {isJoining ? 'Joining…' : 'Join meeting'}
          </button>
          <p className="green-note">The host will admit you from the waiting room.</p>
        </form>
      </div>
      <JacobCredit />
    </div>
  );
}

export function PageClientImpl(props: {
  roomName: string;
  meetingTitle: string;
  region?: string;
  participantName?: string;
  hq: boolean;
  codec: VideoCodec;
  singlePeerConnection: boolean;
}) {
  const [preJoinChoices, setPreJoinChoices] = React.useState<LocalUserChoices | undefined>(
    undefined,
  );
  const preJoinDefaults = React.useMemo(() => {
    return {
      username: props.participantName ?? '',
      videoEnabled: true,
      audioEnabled: true,
      videoDeviceId: '',
      audioDeviceId: '',
    };
  }, [props.participantName]);
  const [connectionDetails, setConnectionDetails] = React.useState<ConnectionDetails | undefined>(
    undefined,
  );
  const [connectionError, setConnectionError] = React.useState('');

  const handlePreJoinSubmit = React.useCallback(
    async (values: LocalUserChoices) => {
      setConnectionError('');
      setPreJoinChoices(values);
      const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
      url.searchParams.append('roomName', props.roomName);
      url.searchParams.append('participantName', values.username);
      if (props.region) {
        url.searchParams.append('region', props.region);
      }
      const connectionDetailsResp = await fetch(url.toString());
      if (!connectionDetailsResp.ok) {
        const errorData = (await connectionDetailsResp.json().catch(() => null)) as {
          error?: string;
        } | null;
        setPreJoinChoices(undefined);
        setConnectionError(errorData?.error ?? 'This meeting is no longer available.');
        return;
      }
      const connectionDetailsData = await connectionDetailsResp.json();
      setConnectionDetails(connectionDetailsData);
    },
    [props.region, props.roomName],
  );
  return (
    <main className="room-shell" data-lk-theme="default">
      {connectionDetails === undefined || preJoinChoices === undefined ? (
        <PreJoinPanel
          roomName={props.roomName}
          meetingTitle={props.meetingTitle}
          defaults={preJoinDefaults}
          error={connectionError}
          onSubmit={handlePreJoinSubmit}
        />
      ) : (
        <VideoConferenceComponent
          connectionDetails={connectionDetails}
          userChoices={preJoinChoices}
          options={{
            codec: props.codec,
            hq: props.hq,
            singlePeerConnection: props.singlePeerConnection,
          }}
        />
      )}
    </main>
  );
}

function VideoConferenceComponent(props: {
  userChoices: LocalUserChoices;
  connectionDetails: ConnectionDetails;
  options: {
    hq: boolean;
    codec: VideoCodec;
    singlePeerConnection: boolean;
  };
}) {
  const keyProvider = React.useMemo(() => new ExternalE2EEKeyProvider(), []);
  const { worker, e2eePassphrase } = useSetupE2EE();
  const e2eeEnabled = !!(e2eePassphrase && worker);

  const [e2eeSetupComplete, setE2eeSetupComplete] = React.useState(false);
  const router = useRouter();
  const handleOnLeave = React.useCallback(() => router.push('/'), [router]);
  const handleError = React.useCallback((error: Error) => {
    console.error(error);
    alert(`Encountered an unexpected error, check the console logs for details: ${error.message}`);
  }, []);
  const handleEncryptionError = React.useCallback((error: Error) => {
    console.error(error);
    alert(
      `Encountered an unexpected encryption error, check the console logs for details: ${error.message}`,
    );
  }, []);

  const roomOptions = React.useMemo((): RoomOptions => {
    let videoCodec: VideoCodec | undefined = props.options.codec ? props.options.codec : 'vp9';
    if (e2eeEnabled && (videoCodec === 'av1' || videoCodec === 'vp9')) {
      videoCodec = undefined;
    }
    const videoCaptureDefaults: VideoCaptureOptions = {
      deviceId: props.userChoices.videoDeviceId ?? undefined,
      resolution: props.options.hq ? VideoPresets.h2160 : VideoPresets.h720,
    };
    const publishDefaults: TrackPublishDefaults = {
      dtx: false,
      videoSimulcastLayers: props.options.hq
        ? [VideoPresets.h1080, VideoPresets.h720]
        : [VideoPresets.h540, VideoPresets.h216],
      red: !e2eeEnabled,
      videoCodec,
    };
    return {
      videoCaptureDefaults: videoCaptureDefaults,
      publishDefaults: publishDefaults,
      audioCaptureDefaults: {
        deviceId: props.userChoices.audioDeviceId ?? undefined,
      },
      adaptiveStream: true,
      dynacast: true,
      e2ee: worker && e2eeEnabled ? { keyProvider, worker } : undefined,
      singlePeerConnection: props.options.singlePeerConnection,
    };
  }, [
    e2eeEnabled,
    keyProvider,
    props.options.codec,
    props.options.hq,
    props.options.singlePeerConnection,
    props.userChoices,
    worker,
  ]);

  const room = React.useMemo(() => new Room(roomOptions), [roomOptions]);

  React.useEffect(() => {
    let cancelled = false;
    if (e2eeEnabled) {
      keyProvider
        .setKey(decodePassphrase(e2eePassphrase))
        .then(() => {
          room.setE2EEEnabled(true).catch((e) => {
            if (e instanceof DeviceUnsupportedError) {
              alert(
                `You're trying to join an encrypted meeting, but your browser does not support it. Please update it to the latest version and try again.`,
              );
              console.error(e);
            } else {
              throw e;
            }
          });
        })
        .then(() => {
          if (!cancelled) {
            setE2eeSetupComplete(true);
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [e2eeEnabled, keyProvider, room, e2eePassphrase]);

  const connectOptions = React.useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  React.useEffect(() => {
    room.on(RoomEvent.Disconnected, handleOnLeave);
    room.on(RoomEvent.EncryptionError, handleEncryptionError);
    room.on(RoomEvent.MediaDevicesError, handleError);

    if (!e2eeEnabled || e2eeSetupComplete) {
      room
        .connect(
          props.connectionDetails.serverUrl,
          props.connectionDetails.participantToken,
          connectOptions,
        )
        .catch((error) => {
          handleError(error);
        });
      if (props.userChoices.videoEnabled) {
        room.localParticipant.setCameraEnabled(true).catch((error) => {
          handleError(error);
        });
      }
      if (props.userChoices.audioEnabled) {
        room.localParticipant.setMicrophoneEnabled(true).catch((error) => {
          handleError(error);
        });
      }
    }
    return () => {
      room.off(RoomEvent.Disconnected, handleOnLeave);
      room.off(RoomEvent.EncryptionError, handleEncryptionError);
      room.off(RoomEvent.MediaDevicesError, handleError);
    };
  }, [
    connectOptions,
    e2eeEnabled,
    e2eeSetupComplete,
    handleEncryptionError,
    handleError,
    handleOnLeave,
    room,
    props.connectionDetails,
    props.userChoices,
  ]);

  const lowPowerMode = useLowCPUOptimizer(room);

  React.useEffect(() => {
    if (lowPowerMode) {
      console.warn('Low power mode enabled');
    }
  }, [lowPowerMode]);

  return (
    <div className="lk-room-container">
      <RoomContext.Provider value={room}>
        <KeyboardShortcuts />
        <VideoConference
          chatMessageFormatter={formatChatMessageLinks}
          SettingsComponent={SHOW_SETTINGS_MENU ? SettingsMenu : undefined}
        />
        <RecordingIndicator />
      </RoomContext.Provider>
    </div>
  );
}
