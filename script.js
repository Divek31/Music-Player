// -------------------------
// FULL WORKING MUSIC PLAYER
// -------------------------

let songs = [];          // { title, artist, file, url, durationText }
let currentIndex = -1;
let isPlaying = false;

let shuffle = false;
let repeatMode = 0; // 0=OFF, 1=ONE, 2=ALL

// Elements
const audio = document.getElementById("audio");

const fileInput = document.getElementById("fileInput");
const songList = document.getElementById("songList");

const nowArt = document.getElementById("nowArt");
const nowTitle = document.getElementById("nowTitle");
const nowArtist = document.getElementById("nowArtist");

const playBtn = document.getElementById("playBtn");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");

const progress = document.getElementById("progress");
const volume = document.getElementById("volume");
const curTime = document.getElementById("curTime");
const durTime = document.getElementById("durTime");

const likeBtn = document.getElementById("likeBtn");

const searchInput = document.getElementById("searchInput");
const playAllBtn = document.getElementById("playAllBtn");
const clearBtn = document.getElementById("clearBtn");

const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");
const countText = document.getElementById("countText");

const queueTags = document.getElementById("queueTags");

// Init
audio.volume = volume.value / 100;

// -------------------------
// Helpers
// -------------------------
function formatTime(t) {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function parseArtistTitle(filename) {
  // Example: "Arijit Singh - Tum Hi Ho.mp3"
  const clean = filename.replace(/\.[^/.]+$/, "");
  if (clean.includes("-")) {
    const parts = clean.split("-");
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join("-").trim()
    };
  }
  return { artist: "Unknown Artist", title: clean.trim() };
}

function randomGradient() {
  const gradients = [
    "linear-gradient(135deg, rgba(30,215,96,0.30), rgba(74,163,255,0.22), rgba(168,85,247,0.20))",
    "linear-gradient(135deg, rgba(74,163,255,0.28), rgba(255,255,255,0.06))",
    "linear-gradient(135deg, rgba(168,85,247,0.30), rgba(30,215,96,0.14))",
    "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(74,163,255,0.18))",
    "linear-gradient(135deg, rgba(30,215,96,0.22), rgba(0,0,0,0.12))"
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
}

// -------------------------
// UI Render
// -------------------------
function renderSongs(list = songs) {
  songList.innerHTML = "";

  list.forEach((s) => {
    const row = document.createElement("div");
    row.className = "song-row";
    row.dataset.id = s.id;

    row.innerHTML = `
      <div class="song-thumb" style="background:${s.coverGradient}"></div>
      <div class="song-meta">
        <h5>${s.title}</h5>
        <p>${s.artist}</p>
      </div>
      <div class="song-time">${s.durationText || "--:--"}</div>
      <button class="kebab">⋯</button>
    `;

    row.addEventListener("click", () => playById(s.id));
    songList.appendChild(row);
  });

  highlightPlaying();
}

function highlightPlaying() {
  document.querySelectorAll(".song-row").forEach((row) => {
    row.classList.remove("playing");
    const id = Number(row.dataset.id);
    if (currentIndex !== -1 && songs[currentIndex]?.id === id) {
      row.classList.add("playing");
    }
  });
}

function renderQueueTags() {
  queueTags.innerHTML = "";
  songs.slice(0, 8).forEach((s) => {
    const el = document.createElement("div");
    el.className = "tag";
    el.textContent = s.title;
    el.addEventListener("click", () => playById(s.id));
    queueTags.appendChild(el);
  });
}

// -------------------------
// Core Player Functions
// -------------------------
function loadSong(index) {
  const s = songs[index];
  if (!s) return;

  currentIndex = index;
  audio.src = s.url;

  nowTitle.textContent = s.title;
  nowArtist.textContent = s.artist;
  nowArt.style.background = s.coverGradient;

  highlightPlaying();
}

function playSong(index) {
  if (songs.length === 0) return;

  loadSong(index);

  audio.play().then(() => {
    isPlaying = true;
    playBtn.textContent = "⏸";
  }).catch(() => {
    // browser autoplay restrictions
    isPlaying = false;
    playBtn.textContent = "▶";
  });
}

function togglePlay() {
  if (songs.length === 0) return;

  if (currentIndex === -1) {
    playSong(0);
    return;
  }

  if (!isPlaying) {
    audio.play();
    isPlaying = true;
    playBtn.textContent = "⏸";
  } else {
    audio.pause();
    isPlaying = false;
    playBtn.textContent = "▶";
  }
}

function getNextIndex() {
  if (songs.length === 0) return -1;

  if (shuffle) {
    if (songs.length === 1) return 0;
    let next = currentIndex;
    while (next === currentIndex) {
      next = Math.floor(Math.random() * songs.length);
    }
    return next;
  }

  return (currentIndex + 1) % songs.length;
}

function getPrevIndex() {
  if (songs.length === 0) return -1;

  if (shuffle) {
    return Math.floor(Math.random() * songs.length);
  }

  return (currentIndex - 1 + songs.length) % songs.length;
}

function nextSong() {
  if (songs.length === 0) return;

  // repeat ONE
  if (repeatMode === 1) {
    playSong(currentIndex);
    return;
  }

  // normal next (repeat ALL works by modulo)
  const next = getNextIndex();
  playSong(next);
}

function prevSong() {
  if (songs.length === 0) return;
  const prev = getPrevIndex();
  playSong(prev);
}

function playById(id) {
  const index = songs.findIndex((x) => x.id === id);
  if (index !== -1) playSong(index);
}

// -------------------------
// File Upload Handling
// -------------------------
fileInput.addEventListener("change", async (e) => {
  const files = [...e.target.files];
  if (!files.length) return;

  // add songs
  const startId = songs.length ? songs[songs.length - 1].id + 1 : 1;

  files.forEach((file, i) => {
    const { artist, title } = parseArtistTitle(file.name);
    const url = URL.createObjectURL(file);

    songs.push({
      id: startId + i,
      file,
      url,
      title,
      artist,
      coverGradient: randomGradient(),
      durationText: "--:--"
    });
  });

  countText.textContent = `${songs.length} tracks`;
  renderSongs(songs);
  renderQueueTags();

  // auto compute duration (async)
  songs.forEach((s) => computeDuration(s));

  // autoplay first if nothing playing
  if (currentIndex === -1) {
    playSong(0);
  }
});

// Compute duration using hidden Audio element
function computeDuration(songObj) {
  const tempAudio = new Audio();
  tempAudio.src = songObj.url;

  tempAudio.addEventListener("loadedmetadata", () => {
    songObj.durationText = formatTime(tempAudio.duration);
    renderSongs(filterBySearch());
  });
}

// -------------------------
// Progress / Volume
// -------------------------
audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;

  const percent = (audio.currentTime / audio.duration) * 100;
  progress.value = percent;

  curTime.textContent = formatTime(audio.currentTime);
  durTime.textContent = formatTime(audio.duration);
});

progress.addEventListener("input", () => {
  if (!audio.duration) return;
  audio.currentTime = (progress.value / 100) * audio.duration;
});

volume.addEventListener("input", () => {
  audio.volume = volume.value / 100;
});

// -------------------------
// Auto Next + Repeat Logic
// -------------------------
audio.addEventListener("ended", () => {
  if (songs.length === 0) return;

  // repeat ONE
  if (repeatMode === 1) {
    playSong(currentIndex);
    return;
  }

  // repeat OFF
  if (repeatMode === 0) {
    // if last song and not shuffle -> stop
    if (!shuffle && currentIndex === songs.length - 1) {
      isPlaying = false;
      playBtn.textContent = "▶";
      return;
    }
  }

  // repeat ALL or middle songs -> next
  nextSong();
});

// -------------------------
// Buttons
// -------------------------
playBtn.addEventListener("click", togglePlay);
nextBtn.addEventListener("click", nextSong);
prevBtn.addEventListener("click", prevSong);

playAllBtn.addEventListener("click", () => {
  if (songs.length) playSong(0);
});

clearBtn.addEventListener("click", () => {
  // cleanup URLs
  songs.forEach((s) => URL.revokeObjectURL(s.url));
  songs = [];
  currentIndex = -1;
  isPlaying = false;

  audio.pause();
  audio.src = "";

  nowTitle.textContent = "No song selected";
  nowArtist.textContent = "Upload and play";
  nowArt.style.background = randomGradient();

  progress.value = 0;
  curTime.textContent = "0:00";
  durTime.textContent = "0:00";
  playBtn.textContent = "▶";

  countText.textContent = "0 tracks";
  renderSongs([]);
  renderQueueTags();
});

// Shuffle toggle
shuffleBtn.addEventListener("click", () => {
  shuffle = !shuffle;
  shuffleBtn.classList.toggle("active", shuffle);
});

// Repeat cycle
repeatBtn.addEventListener("click", () => {
  repeatMode = (repeatMode + 1) % 3;

  // UI indicator
  repeatBtn.classList.add("active");
  if (repeatMode === 0) {
    repeatBtn.classList.remove("active");
    repeatBtn.textContent = "🔁";
    repeatBtn.title = "Repeat OFF";
  }
  if (repeatMode === 1) {
    repeatBtn.textContent = "🔂";
    repeatBtn.title = "Repeat ONE";
  }
  if (repeatMode === 2) {
    repeatBtn.textContent = "🔁";
    repeatBtn.title = "Repeat ALL";
  }
});

// Like
likeBtn.addEventListener("click", () => {
  likeBtn.classList.toggle("active");
});

// -------------------------
// Search
// -------------------------
function filterBySearch() {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) return songs;

  return songs.filter((s) =>
    s.title.toLowerCase().includes(q) ||
    s.artist.toLowerCase().includes(q)
  );
}

searchInput.addEventListener("input", () => {
  const filtered = filterBySearch();
  renderSongs(filtered);
});

// Default art
nowArt.style.background = randomGradient();

// ----------------------
// SPA NAVIGATION
// ----------------------
const navBtns = document.querySelectorAll(".nav button[data-nav]");
const pages = {
  home: document.getElementById("page-home"),
  search: document.getElementById("page-search"),
  library: document.getElementById("page-library"),
  discover: document.getElementById("page-discover"),
  radio: document.getElementById("page-radio"),
};

function openPage(pageName) {
  // remove active from all pages
  Object.values(pages).forEach(p => p.classList.remove("active"));
  // add active to selected
  pages[pageName]?.classList.add("active");

  // active nav button UI
  navBtns.forEach(btn => btn.classList.remove("active"));
  navBtns.forEach(btn => {
    if (btn.dataset.nav === pageName) btn.classList.add("active");
  });

  // Special actions for pages
  if (pageName === "search") syncSearchPage();
  if (pageName === "library") syncLibraryPage();
}

navBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    openPage(btn.dataset.nav);
  });
});

// default page
openPage("home");

// ----------------------
// SEARCH PAGE FEATURE
// ----------------------
const pageSearchInput = document.getElementById("pageSearchInput");
const searchResults = document.getElementById("searchResults");

function renderSearchResults(list) {
  searchResults.innerHTML = "";

  if (!list.length) {
    searchResults.innerHTML = `<div style="padding:14px;color:rgba(234,240,255,0.55)">No results found</div>`;
    return;
  }

  list.forEach((s) => {
    const row = document.createElement("div");
    row.className = "song-row";
    row.dataset.id = s.id;

    row.innerHTML = `
      <div class="song-thumb" style="background:${s.coverGradient}"></div>
      <div class="song-meta">
        <h5>${s.title}</h5>
        <p>${s.artist}</p>
      </div>
      <div class="song-time">${s.durationText || "--:--"}</div>
      <button class="kebab">⋯</button>
    `;
    row.addEventListener("click", () => playById(s.id));
    searchResults.appendChild(row);
  });
}

function syncSearchPage() {
  pageSearchInput.value = "";
  renderSearchResults(songs);
}

pageSearchInput.addEventListener("input", () => {
  const q = pageSearchInput.value.trim().toLowerCase();
  const filtered = songs.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.artist.toLowerCase().includes(q)
  );
  renderSearchResults(filtered);
});

// ----------------------
// LIBRARY PAGE (Counters)
// ----------------------
const uploadsCount = document.getElementById("uploadsCount");
const favCount = document.getElementById("favCount");
const recentCount = document.getElementById("recentCount");

// (for now dummy) later we will connect favorites + recent lists
function syncLibraryPage() {
  uploadsCount.textContent = `${songs.length} songs`;
  favCount.textContent = `0 liked`;
  recentCount.textContent = `0 recent`;
}

// ----------------------
// MOOD FEATURE
// ----------------------
const moodGrid = document.getElementById("moodGrid");
const moodResult = document.getElementById("moodResult");

const moodKeywords = {
  chill: ["lofi", "chill", "relax", "calm", "rain"],
  happy: ["happy", "fun", "dance", "party", "smile"],
  sad: ["sad", "alone", "broken", "cry", "pain"],
  focus: ["focus", "study", "coding", "work"],
  workout: ["workout", "gym", "pump", "energy", "run"],
  party: ["party", "dj", "bass", "edm"]
};

function moodFilter(mood) {
  const keys = moodKeywords[mood] || [];
  // filter by title/artist match
  const filtered = songs.filter(s => {
    const text = (s.title + " " + s.artist).toLowerCase();
    return keys.some(k => text.includes(k));
  });

  // If no match, fallback random
  if (!filtered.length) return songs.slice(0, 10);

  return filtered;
}

moodGrid?.addEventListener("click", (e) => {
  const btn = e.target.closest(".moodBtn");
  if (!btn) return;

  // active UI
  document.querySelectorAll(".moodBtn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  const mood = btn.dataset.mood;
  moodResult.innerHTML = `Mood: <b>${mood.toUpperCase()}</b>`;

  const filtered = moodFilter(mood);

  // show mood results on HOME list
  renderSongs(filtered);
});

// ----------------------
// RADIO PAGE
// ----------------------
document.querySelectorAll(".radioBtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const station = btn.dataset.station;

    if (!songs.length) {
      alert("Upload some songs first!");
      return;
    }

    let filtered = songs;

    if (station === "lofi") filtered = moodFilter("chill");
    if (station === "bass") filtered = moodFilter("party");
    if (station === "romantic") filtered = songs.filter(s => (s.title + s.artist).toLowerCase().includes("love"));
    if (station === "random") filtered = [...songs].sort(() => Math.random() - 0.5);

    // play first from station
    renderSongs(filtered);
    playById(filtered[0].id);

    // go to home to see list
    openPage("home");
  });
});

// Discover mix
document.getElementById("discoverMixBtn")?.addEventListener("click", () => {
  if (!songs.length) {
    alert("Upload songs first!");
    return;
  }
  const mix = [...songs].sort(() => Math.random() - 0.5);
  renderSongs(mix);
  playById(mix[0].id);
  openPage("home");
});
