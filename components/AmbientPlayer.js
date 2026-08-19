"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_ID = "rFZHOHl-L8A";

function loadYouTubeApi() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve(window.YT);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  });
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function VolumeIcon({ muted }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      {muted ? (
        <path d="m17 9 5 6M22 9l-5 6" />
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </>
      )}
    </svg>
  );
}

export default function AmbientPlayer() {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const cancelledRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      playerRef.current?.destroy?.();
    };
  }, []);

  // The YouTube embed (a live 24/7 stream, pulling in its own player JS,
  // fonts, and ad/QoE pings) used to load unconditionally on mount, into a
  // 1x1px hidden box, on every single visit — whether or not anyone ever
  // pressed Play. Deferring it to the first tap means the timer page never
  // pays that cost, and never carries that risk, unless music is wanted.
  function startPlayer() {
    setInitializing(true);

    const giveUpTimer = setTimeout(() => {
      if (!cancelledRef.current && !playerRef.current) setFailed(true);
    }, 8000);

    loadYouTubeApi().then((YT) => {
      clearTimeout(giveUpTimer);
      if (cancelledRef.current || !containerRef.current) return;
      // YT.Player takes over its target element and replaces it with an
      // iframe. Handing it the React-rendered div directly meant React's
      // own reconciler still believed it owned that node — the next
      // re-render (e.g. onReady flipping `ready`) tried to patch a node
      // YouTube had already ripped out from under it, crashing the tab
      // with "Failed to execute 'removeChild': the node ... is not a
      // child of this node". A plain node created outside JSX, that React
      // never puts anything into, sidesteps the conflict entirely.
      const mountNode = document.createElement("div");
      containerRef.current.appendChild(mountNode);
      playerRef.current = new YT.Player(mountNode, {
        videoId: VIDEO_ID,
        // YouTube's docs call for a minimum of ~200x200 — a smaller iframe
        // (this used to be squashed to 1x1px via CSS) is a known crash
        // trigger, which matches the tab dying the moment the player
        // initialized. Real dimensions, just parked off-screen, instead.
        width: 200,
        height: 113,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            event.target.setVolume(volume);
            setReady(true);
          },
          onStateChange: (event) => {
            setIsPlaying(event.data === YT.PlayerState.PLAYING);
          },
          onError: () => {
            setFailed(true);
          },
        },
      });
    });
  }

  function togglePlay() {
    if (!playerRef.current) {
      if (!initializing) startPlayer();
      return;
    }
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }

  function toggleMute() {
    if (!playerRef.current) return;
    if (muted) {
      playerRef.current.unMute();
      setMuted(false);
    } else {
      playerRef.current.mute();
      setMuted(true);
    }
  }

  function handleVolumeChange(e) {
    const value = Number(e.target.value);
    setVolume(value);
    playerRef.current?.setVolume(value);
    if (value === 0) {
      setMuted(true);
    } else if (muted) {
      playerRef.current?.unMute();
      setMuted(false);
    }
  }

  if (failed) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-card px-5 py-2.5 text-xs text-ink-muted backdrop-blur-xl">
        Muzika trenutno nije dostupna.
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-border bg-surface-card px-5 py-2.5 backdrop-blur-xl">
      <div ref={containerRef} className="fixed -left-[9999px] -top-[9999px] h-[113px] w-[200px]" />

      <button
        onClick={togglePlay}
        disabled={initializing && !ready}
        aria-label={isPlaying ? "Pauziraj muziku" : "Pusti muziku"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <button
        onClick={toggleMute}
        disabled={!ready}
        aria-label={muted ? "Uključi zvuk" : "Isključi zvuk"}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-white/[0.06] hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        <VolumeIcon muted={muted || volume === 0} />
      </button>

      <input
        type="range"
        min="0"
        max="100"
        value={muted ? 0 : volume}
        onChange={handleVolumeChange}
        disabled={!ready}
        aria-label="Jačina zvuka"
        className="h-1 w-24 cursor-pointer rounded-full disabled:cursor-not-allowed disabled:opacity-40"
        style={{ accentColor: "var(--color-accent)" }}
      />

      <span className="hidden text-xs text-ink-muted sm:inline">Muzika za fokus</span>
    </div>
  );
}
