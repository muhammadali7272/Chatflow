import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";

import { useWebSocket } from "./WebSocketContext";
import { addCall } from "../store/appSlice";

const CallContext = createContext(null);

// idle -> calling (we dialled) | ringing (they dialled) -> active -> idle
const IDLE = {
  phase: "idle",
  peer: null,
  callId: null,
  outgoing: false, // we placed it — `phase` cannot say so once it goes active
  video: false, // how the call was placed — drives the ring UI and initial camera
  peerVideo: false, // peer's camera right now
  peerMuted: false,
  connected: false, // RTCPeerConnection reached "connected" (media flowing)
  incomingSdp: null,
  error: null,
};

// Owns the RTCPeerConnection and the media streams. Signalling goes through the
// WebSocket hub, which stays the only owner of the socket.
//
// Every call negotiates BOTH an audio and a video transceiver as sendrecv, even
// an audio-only one. Switching between audio and video mid-call is then just
// replaceTrack() on the video sender — no renegotiation, so the server needs no
// extra offer/answer round. The peer learns about the switch from `call:media`.
export function CallProvider({ children }) {
  const dispatch = useDispatch();
  const {
    newCallId,
    callConfig,
    callOffer,
    callAnswer,
    callIce,
    cancelIce,
    callReject,
    callEnd,
    callMedia,
    onCallEvent,
    logCallMessage,
    notifyMissedCall,
  } = useWebSocket();

  const [call, setCall] = useState(IDLE);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(false);

  const pcRef = useRef(null);
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const videoSenderRef = useRef(null);
  const callRef = useRef(IDLE);
  const mediaRef = useRef({ video: false, muted: false });
  const startedAt = useRef(null);
  // ICE can arrive before the remote description is set; hold it until it can
  // be applied or addIceCandidate throws.
  const pendingIce = useRef([]);

  useEffect(() => {
    callRef.current = call;
  }, [call]);

  useEffect(() => {
    mediaRef.current = { video: videoOn, muted };
  }, [videoOn, muted]);

  // MediaStream mutations don't change identity, so hand React a fresh wrapper.
  const publishLocal = useCallback(() => {
    setLocalStream(localRef.current ? new MediaStream(localRef.current.getTracks()) : null);
  }, []);

  const stopMedia = useCallback(() => {
    localRef.current?.getTracks().forEach((t) => t.stop());
    localRef.current = null;
    remoteRef.current = null;
    videoSenderRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  const teardown = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    pendingIce.current = [];
    cancelIce();
    stopMedia();
    setMuted(false);
    setVideoOn(false);
  }, [cancelIce, stopMedia]);

  // Log the finished call, then reset. `dir` follows appSlice's call log shape.
  const logCall = useCallback(
    (dir) => {
      const c = callRef.current;
      if (!c.peer) return;
      const duration = startedAt.current
        ? Math.round((Date.now() - startedAt.current) / 1000)
        : 0;
      dispatch(
        addCall({
          email: c.peer.email,
          name: `${c.peer.firstName ?? ""} ${c.peer.lastName ?? ""}`.trim() || c.peer.email,
          avatar: c.peer.avatar ?? null,
          dir,
          video: c.video,
          duration,
        }),
      );
      // Also drop a call entry into the chat thread (Telegram-style).
      logCallMessage(c.peer.email, { dir, video: c.video, duration });
      startedAt.current = null;
    },
    [dispatch, logCallMessage],
  );

  const reset = useCallback(() => {
    teardown();
    setCall(IDLE);
  }, [teardown]);

  // Tell the peer what our camera/mic are doing, so their UI matches.
  const signalMedia = useCallback(
    (patch) => {
      const c = callRef.current;
      if (!c.peer || !c.callId) return;
      callMedia(c.peer.email, c.callId, { ...mediaRef.current, ...patch });
    },
    [callMedia],
  );

  const newPeerConnection = useCallback(
    async (peerEmail, callId) => {
      const iceServers = await callConfig();
      const pc = new RTCPeerConnection({ iceServers });
      pc.onicecandidate = (e) => {
        if (e.candidate) callIce(peerEmail, callId, e.candidate);
      };
      // Build the remote stream ourselves: a transceiver added without a track
      // carries no stream id, so e.streams can be empty.
      remoteRef.current = new MediaStream();
      pc.ontrack = (e) => {
        remoteRef.current.addTrack(e.track);
        setRemoteStream(new MediaStream(remoteRef.current.getTracks()));
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setCall((c) => (c.phase === "idle" ? c : { ...c, connected: true }));
        } else if (pc.connectionState === "failed") {
          // ICE found no working path. End the call properly instead of
          // leaving a black screen in a call that says it is still active.
          // "closed" is not handled here — that is our own teardown.
          const c = callRef.current;
          if (c.phase === "idle") return;
          if (c.peer) callEnd(c.peer.email, c.callId);
          logCall(c.outgoing ? "out" : "in");
          teardown();
          setCall({ ...IDLE, error: "Не удалось установить соединение" });
        }
      };
      pcRef.current = pc;
      return pc;
    },
    [callConfig, callIce, callEnd, logCall, teardown],
  );

  // Audio is always on; video only when the call starts as a video call.
  const getMedia = useCallback(
    async (video) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: video ? { facingMode: "user" } : false,
      });
      localRef.current = stream;
      setVideoOn(video && stream.getVideoTracks().length > 0);
      publishLocal();
      return stream;
    },
    [publishLocal],
  );

  // --- Outgoing ---
  const startCall = useCallback(
    async (peer, video) => {
      if (callRef.current.phase !== "idle") return;
      // Dialling an offline peer is allowed: it rings out and ends as a missed
      // call, the same as any messenger. Presence is only a hint here, never a
      // precondition — see the ringing-phase note below.
      // The id is minted before the connection exists: setLocalDescription
      // starts ICE gathering immediately, and every candidate has to carry the
      // id the peer will match it against.
      const callId = newCallId();
      setCall({ ...IDLE, phase: "calling", outgoing: true, peer, video, peerVideo: video, callId });
      try {
        const stream = await getMedia(video);
        const pc = await newPeerConnection(peer.email, callId);

        // Both m-lines exist up front, so the camera can be switched on later
        // with replaceTrack alone.
        pc.addTransceiver(stream.getAudioTracks()[0], {
          direction: "sendrecv",
          streams: [stream],
        });
        const videoTx = pc.addTransceiver(stream.getVideoTracks()[0] ?? "video", {
          direction: "sendrecv",
          streams: [stream],
        });
        videoSenderRef.current = videoTx.sender;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const res = await callOffer(peer.email, callId, offer, video);
        if (!res?.ok) {
          teardown();
          setCall({ ...IDLE, error: res?.error || "Не удалось позвонить" });
        }
      } catch {
        teardown();
        setCall({
          ...IDLE,
          error: video
            ? "Нет доступа к камере. Разрешите доступ в браузере."
            : "Нет доступа к микрофону. Разрешите доступ в браузере.",
        });
      }
    },
    [newCallId, getMedia, newPeerConnection, callOffer, teardown],
  );

  // --- Incoming ---
  const accept = useCallback(async () => {
    const c = callRef.current;
    if (c.phase !== "ringing") return;
    try {
      const stream = await getMedia(c.video);
      const pc = await newPeerConnection(c.peer.email, c.callId);

      await pc.setRemoteDescription(new RTCSessionDescription(c.incomingSdp));
      // The offer's transceivers land as recvonly; open them both ways so our
      // camera can be switched on later without renegotiating.
      for (const tx of pc.getTransceivers()) {
        tx.direction = "sendrecv";
        const kind = tx.receiver.track?.kind;
        if (kind === "audio") await tx.sender.replaceTrack(stream.getAudioTracks()[0] ?? null);
        if (kind === "video") {
          videoSenderRef.current = tx.sender;
          await tx.sender.replaceTrack(stream.getVideoTracks()[0] ?? null);
        }
      }

      for (const cand of pendingIce.current) {
        await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
      }
      pendingIce.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await callAnswer(c.peer.email, c.callId, answer);
      startedAt.current = Date.now();
      setCall((x) => ({ ...x, phase: "active" }));
      callMedia(c.peer.email, c.callId, { video: stream.getVideoTracks().length > 0, muted: false });
    } catch {
      callReject(c.peer.email, c.callId, "media");
      teardown();
      setCall({ ...IDLE, error: "Нет доступа к камере/микрофону." });
    }
  }, [getMedia, newPeerConnection, callAnswer, callReject, callMedia, teardown]);

  const decline = useCallback(() => {
    const c = callRef.current;
    if (c.peer) callReject(c.peer.email, c.callId, "declined");
    logCall("missed");
    reset();
  }, [callReject, logCall, reset]);

  const hangup = useCallback(() => {
    const c = callRef.current;
    if (c.peer) callEnd(c.peer.email, c.callId);
    // Giving up before they answered: leave them a durable notice, they may
    // well have been offline the whole time.
    if (c.phase === "calling" && c.peer) notifyMissedCall(c.peer.email, { video: c.video });
    logCall(c.outgoing ? "out" : "in");
    reset();
  }, [callEnd, notifyMissedCall, logCall, reset]);

  const toggleMute = useCallback(() => {
    const track = localRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
    signalMedia({ muted: !track.enabled });
  }, [signalMedia]);

  // Audio <-> video, live. Adding the camera swaps a real track into the video
  // sender that was negotiated at call setup; removing it stops the track so the
  // camera light goes out.
  const toggleVideo = useCallback(async () => {
    const c = callRef.current;
    if (c.phase === "idle" || c.phase === "ringing" || !localRef.current) return;
    const existing = localRef.current.getVideoTracks()[0];

    if (existing) {
      await videoSenderRef.current?.replaceTrack(null).catch(() => {});
      existing.stop();
      localRef.current.removeTrack(existing);
      setVideoOn(false);
      publishLocal();
      signalMedia({ video: false });
      return;
    }

    try {
      const cam = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      const track = cam.getVideoTracks()[0];
      if (!videoSenderRef.current) {
        track.stop();
        return;
      }
      await videoSenderRef.current.replaceTrack(track);
      localRef.current.addTrack(track);
      setVideoOn(true);
      publishLocal();
      signalMedia({ video: true });
    } catch {
      setCall((x) => ({ ...x, error: "Нет доступа к камере. Разрешите доступ в браузере." }));
    }
  }, [publishLocal, signalMedia]);

  const dismissError = useCallback(() => setCall((c) => ({ ...c, error: null })), []);

  // --- Signalling ---
  useEffect(() => {
    const offs = [
      onCallEvent("call:incoming", ({ callId, from, video, sdp }) => {
        // Already busy: refuse rather than silently dropping the caller.
        if (callRef.current.phase !== "idle") {
          callReject(from.email, callId, "busy");
          return;
        }
        pendingIce.current = [];
        setCall({
          ...IDLE,
          phase: "ringing",
          peer: from,
          callId,
          video,
          peerVideo: video,
          incomingSdp: sdp,
        });
      }),

      onCallEvent("call:answered", async ({ callId, sdp }) => {
        const pc = pcRef.current;
        if (!pc || callRef.current.callId !== callId) return;
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        for (const cand of pendingIce.current) {
          await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
        }
        pendingIce.current = [];
        startedAt.current = Date.now();
        setCall((c) => ({ ...c, phase: "active" }));
        signalMedia({});
      }),

      onCallEvent("call:media", ({ callId, video, muted: peerMuted }) => {
        if (callRef.current.callId !== callId) return;
        setCall((c) => ({ ...c, peerVideo: Boolean(video), peerMuted: Boolean(peerMuted) }));
      }),

      onCallEvent("call:ice", async ({ callId, candidate }) => {
        const c = callRef.current;
        if (c.phase === "idle") return;
        // An unlabelled candidate can only belong to the one call in flight,
        // so keep it rather than dropping a possibly working path.
        if (callId && c.callId && callId !== c.callId) return;
        const pc = pcRef.current;
        if (!pc || !pc.remoteDescription) {
          pendingIce.current.push(candidate);
          return;
        }
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }),

      onCallEvent("call:rejected", ({ callId, reason }) => {
        if (callRef.current.callId !== callId) return;
        logCall("out");
        teardown();
        setCall({
          ...IDLE,
          error:
            reason === "busy"
              ? "Пользователь занят"
              : reason === "timeout"
                ? "Нет ответа"
                : "Звонок отклонён",
        });
      }),

      onCallEvent("call:ended", ({ callId }) => {
        if (callRef.current.callId !== callId) return;
        logCall(callRef.current.outgoing ? "out" : "in");
        reset();
      }),
    ];
    return () => offs.forEach((off) => off?.());
  }, [onCallEvent, callReject, logCall, teardown, reset, signalMedia]);

  // A ring is NOT cancelled on a presence change, however tempting that looks:
  // this backend keeps one socket per user and its disconnect handler drops the
  // entry without checking whether a newer socket already replaced it, so a
  // caller who merely reloaded — or has a second tab, or a mobile connection
  // that blinked — reads as offline while plainly connected. Reacting to that
  // killed every incoming call the instant it started ringing. A caller who
  // gives up sends `call:end`, and an unanswered ring ends on the 30s timeout
  // below, so both real cases are already covered without guessing.

  // No answer within 30s: the caller gives up, the callee auto-declines.
  useEffect(() => {
    if (call.phase !== "calling" && call.phase !== "ringing") return undefined;
    const timer = setTimeout(() => {
      const c = callRef.current;
      if (c.phase === "calling") {
        if (c.peer) {
          callEnd(c.peer.email, c.callId);
          notifyMissedCall(c.peer.email, { video: c.video });
        }
        logCall("out");
        teardown();
        setCall({ ...IDLE, error: "Нет ответа" });
      } else if (c.phase === "ringing") {
        if (c.peer) callReject(c.peer.email, c.callId, "timeout");
        logCall("missed");
        reset();
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [
    call.phase,
    call.callId,
    callEnd,
    callReject,
    notifyMissedCall,
    logCall,
    teardown,
    reset,
  ]);

  useEffect(() => () => teardown(), [teardown]);

  const value = {
    call,
    localStream,
    remoteStream,
    muted,
    videoOn,
    startCall,
    accept,
    decline,
    hangup,
    toggleMute,
    toggleVideo,
    dismissError,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within a <CallProvider>");
  return ctx;
}
