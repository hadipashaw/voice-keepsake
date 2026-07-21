/* ============================================================
   CONFIG — edit this block to personalize the keepsake.
   Nothing else in this file needs to change for basic use.
   ============================================================ */
const CONFIG = {
  recipientName: "You",
  senderName: "Someone",
  message:
    "Hey. I made this because there are things I never quite know how to say out loud when I'm standing in front of you, so I figured I'd try it this way instead. Press play whenever you're ready.",
  audioSrc: "assets/audio/voice-note.mp3",
  photoSrc: "assets/images/photo.svg",
  photoCaption: "a moment, pinned here",
  dateStamp: "" // leave empty to use today's date automatically
};

/* ============================================================
   INIT — populate content from CONFIG
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('[data-field="recipientName"]').forEach(
    (el) => (el.textContent = CONFIG.recipientName)
  );
  document.querySelectorAll('[data-field="senderName"]').forEach(
    (el) => (el.textContent = CONFIG.senderName)
  );

  const audio = document.getElementById("audio");
  audio.setAttribute("src", CONFIG.audioSrc);

  document.getElementById("photo").setAttribute("src", CONFIG.photoSrc);
  document.getElementById("photoCaption").textContent = CONFIG.photoCaption;

  const dateStamp = document.getElementById("dateStamp");
  dateStamp.textContent =
    CONFIG.dateStamp ||
    new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });

  setUpWordReveal();
  setUpOpenInteraction();
  setUpPlayer();
});

/* ============================================================
   Word-by-word message reveal (built once, played on open)
   ============================================================ */
function setUpWordReveal() {
  const messageEl = document.getElementById("message");
  const words = CONFIG.message.split(" ");

  messageEl.innerHTML = words
    .map((word, i) => {
      const delay = (0.4 + i * 0.045).toFixed(3);
      return `<span class="word" style="animation-delay:${delay}s">${escapeHTML(
        word
      )}${i < words.length - 1 ? "&nbsp;" : ""}</span>`;
    })
    .join("");
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ============================================================
   Case open interaction — reveals the player
   ============================================================ */
function setUpOpenInteraction() {
  const openBtn = document.getElementById("openBtn");
  const caseEl = document.getElementById("case");
  const playerEl = document.getElementById("player");
  const audio = document.getElementById("audio");

  openBtn.addEventListener("click", () => {
    caseEl.classList.add("is-opening");

    const finishOpen = () => {
      caseEl.classList.add("is-hidden");
      playerEl.hidden = false;
      playerEl.setAttribute("aria-hidden", "false");
      playerEl.querySelector(".player-title").focus?.();

      // Attempt autoplay as a direct continuation of the tap gesture.
      audio.play().catch(() => {
        /* Autoplay blocked — the visible play button still works. */
      });
    };

    caseEl.addEventListener("transitionend", finishOpen, { once: true });
    // Fallback in case no transition fires (e.g. reduced motion).
    setTimeout(finishOpen, 450);
  });
}

/* ============================================================
   Player: play/pause, scrubber, time display, tape reels
   ============================================================ */
function setUpPlayer() {
  const audio = document.getElementById("audio");
  const playBtn = document.getElementById("playBtn");
  const iconPlay = playBtn.querySelector(".icon-play");
  const iconPause = playBtn.querySelector(".icon-pause");
  const tape = document.getElementById("tape");
  const scrubber = document.getElementById("scrubber");
  const currentTimeEl = document.getElementById("currentTime");
  const durationEl = document.getElementById("duration");

  let isSeeking = false;

  function formatTime(seconds) {
    if (!isFinite(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function setPlayingState(playing) {
    tape.classList.toggle("is-playing", playing);
    iconPlay.hidden = playing;
    iconPause.hidden = !playing;
    playBtn.setAttribute("aria-label", playing ? "Pause voice note" : "Play voice note");
  }

  playBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", () => setPlayingState(true));
  audio.addEventListener("pause", () => setPlayingState(false));
  audio.addEventListener("ended", () => setPlayingState(false));

  audio.addEventListener("loadedmetadata", () => {
    scrubber.max = audio.duration || 0;
    durationEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("timeupdate", () => {
    if (isSeeking) return;
    currentTimeEl.textContent = formatTime(audio.currentTime);
    scrubber.value = audio.currentTime;
  });

  scrubber.addEventListener("input", () => {
    isSeeking = true;
    currentTimeEl.textContent = formatTime(Number(scrubber.value));
  });

  scrubber.addEventListener("change", () => {
    audio.currentTime = Number(scrubber.value);
    isSeeking = false;
  });

  setUpWaveform(audio, tape);
}

/* ============================================================
   Waveform: real audio-reactive bars when available,
   graceful idle animation otherwise.
   ============================================================ */
function setUpWaveform(audio, tape) {
  const canvas = document.getElementById("waveform");
  const ctx = canvas.getContext("2d");
  const barCount = 40;
  let idlePhase = 0;
  let analyser = null;
  let dataArray = null;

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  function tryConnectAnalyser() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);

      // Some browsers keep the context suspended until a user gesture.
      audio.addEventListener("play", () => audioCtx.resume().catch(() => {}));
    } catch (err) {
      analyser = null; // Falls back to the idle animation below.
    }
  }
  tryConnectAnalyser();

  function drawBars(getHeight) {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const gap = 3;
    const barWidth = (w - gap * (barCount - 1)) / barCount;
    const rose = getComputedStyle(document.documentElement).getPropertyValue("--accent-rose").trim();
    const gold = getComputedStyle(document.documentElement).getPropertyValue("--accent-gold").trim();

    for (let i = 0; i < barCount; i++) {
      const value = getHeight(i);
      const barHeight = Math.max(2, value * h);
      const x = i * (barWidth + gap);
      const y = (h - barHeight) / 2;
      ctx.fillStyle = i % 4 === 0 ? rose : gold;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }

  function tick() {
    requestAnimationFrame(tick);

    if (analyser && !audio.paused) {
      analyser.getByteFrequencyData(dataArray);
      const step = Math.floor(dataArray.length / barCount) || 1;
      drawBars((i) => (dataArray[i * step] || 0) / 255);
    } else {
      idlePhase += audio.paused ? 0.015 : 0.05;
      drawBars((i) => {
        const base = audio.paused ? 0.14 : 0.3;
        const wobble = Math.sin(idlePhase + i * 0.5) * (audio.paused ? 0.06 : 0.22);
        return Math.abs(base + wobble);
      });
    }
  }
  requestAnimationFrame(tick);
}
