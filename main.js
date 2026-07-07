/* ── INIT LOGIC ── */
window.addEventListener("load", () => {
  const first = document.querySelector(".sn-item.active");
  updateIndicator(first);
});

/* ── COUNTER ── */
function updateCounter() {
  const start = new Date(2019, 8, 23);
  const now   = new Date();
  let y = now.getFullYear() - start.getFullYear();
  let m = now.getMonth()    - start.getMonth();
  let d = now.getDate()     - start.getDate();
  if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  document.getElementById("relationshipCounter").textContent =
    `❤️  Together for ${y} Years, ${m} Months & ${d} Days`;
}
updateCounter(); setInterval(updateCounter, 60000);

/* ── SLIDER ── */
const slides = document.querySelectorAll(".slide");
const dotsWrap = document.getElementById("dots");
let slideIdx = 0; let autoTimer = null;

slides.forEach((_, i) => {
  const d = document.createElement("div");
  d.className = "dot" + (i === 0 ? " active" : "");
  d.addEventListener("click", () => goSlide(i, true));
  dotsWrap.appendChild(d);
});

function goSlide(i, reset = false) {
  slides[slideIdx].classList.remove("active");
  dotsWrap.children[slideIdx].classList.remove("active");
  slideIdx = (i + slides.length) % slides.length;
  slides[slideIdx].classList.add("active");
  dotsWrap.children[slideIdx].classList.add("active");
  if (reset) { clearInterval(autoTimer); autoTimer = setInterval(() => goSlide(slideIdx + 1), 5000); }
}
autoTimer = setInterval(() => goSlide(slideIdx + 1), 5000);

/* ── RENDER GALLERY DYNAMICALLY ── */
const galleryEl = document.getElementById("gallery");
if (typeof galleryImages !== 'undefined') {
  galleryImages.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "box";
    div.innerHTML = `<img src="${item.src}" loading="lazy" alt="${item.title}"><div class="photo-title">${item.title}</div>`;
    div.addEventListener("click", () => openGalleryModal(i));
    galleryEl.appendChild(div);
  });
}

/* ── RENDER TIMELINE DYNAMICALLY ── */
const timelineContainer = document.getElementById("timelineContainer");
if (typeof timelineStories !== 'undefined') {
  timelineStories.forEach(story => {
    const audioAttr = story.audio ? `data-audio="${story.audio}"` : '';
    const imgHtml = story.img ? `<img class="tl-img" src="${story.img}" alt="${story.title}">` : '';
    
    timelineContainer.innerHTML += `
      <div class="tl-item ${story.side}">
        <div class="tl-content">
          <div class="tl-date">${story.date}</div>
          <div class="tl-title">${story.title}</div>
          ${imgHtml}
          <div class="tl-desc">${story.desc}</div>
          <div class="full-story" style="display: none;">${story.fullStory}</div>
          <div class="read-more-btn" ${audioAttr} onclick="openStoryModal(this)">Read More</div>
        </div>
      </div>
    `;
  });
}

/* ── GALLERY MODAL LOGIC ── */
const galleryModal = document.getElementById("galleryModal");
let currentSrc = "";
let currentGalleryIndex = 0;

function openGalleryModal(i) {
  currentGalleryIndex = i;
  const item = galleryImages[i]; currentSrc = item.src;
  document.getElementById("galleryImg").src = currentSrc; 
  document.getElementById("galleryTitle").textContent = item.title;
  document.getElementById("galleryDate").textContent = item.date; 
  document.getElementById("galleryDesc").textContent = item.desc;
  galleryModal.classList.add("open"); 
  document.body.style.overflow = "hidden";
}
function closeGalleryModal() { galleryModal.classList.remove("open"); document.body.style.overflow = ""; }

document.getElementById("fullscreenBtn").addEventListener("click", () => {
  document.getElementById("fsImg").src = currentSrc;
  document.getElementById("fsOverlay").classList.add("active");
});
function closeFullscreen() { document.getElementById("fsOverlay").classList.remove("active"); }

/* Fullscreen prev/next (keyboard + touch swipe + arrow buttons) */
function fsNav(dir) {
  if (typeof galleryImages === 'undefined' || !galleryImages.length) return;
  currentGalleryIndex = (currentGalleryIndex + dir + galleryImages.length) % galleryImages.length;
  const item = galleryImages[currentGalleryIndex];
  currentSrc = item.src;
  document.getElementById("fsImg").src = currentSrc;
  document.getElementById("galleryImg").src = currentSrc;
  document.getElementById("galleryTitle").textContent = item.title;
  document.getElementById("galleryDate").textContent = item.date;
  document.getElementById("galleryDesc").textContent = item.desc;
}
(function () {
  const fsOverlay = document.getElementById("fsOverlay");
  let touchX = 0;
  fsOverlay.addEventListener("touchstart", e => { touchX = e.touches[0].clientX; }, { passive: true });
  fsOverlay.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) fsNav(dx < 0 ? 1 : -1);
  }, { passive: true });
  document.addEventListener("keydown", e => {
    if (!fsOverlay.classList.contains("active")) return;
    if (e.key === "ArrowRight") fsNav(1);
    if (e.key === "ArrowLeft") fsNav(-1);
  });
})();

/* ── DOWNLOAD ── */
document.getElementById("downloadBtn").addEventListener("click", async () => {
  const btn = document.getElementById("downloadBtn");
  btn.textContent = "Downloading…"; btn.disabled = true;
  try {
    const res  = await fetch(currentSrc, { mode: "cors" });
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: "LoveVault_Memory.jpg" });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    btn.textContent = "Downloaded ✓";
  } catch {
    window.open(currentSrc, "_blank"); btn.textContent = "Opened in tab";
  }
  setTimeout(() => { btn.textContent = "Download"; btn.disabled = false; }, 2500);
});

/* ── STORY MODAL (WITH AUDIO & PROGRESS BAR) ── */
const storyModal = document.getElementById("storyModal");
const storyAudio = document.getElementById("storyAudio");
const storyAudioBtn = document.getElementById("storyAudioBtn");
const audioIcon = document.getElementById("audioIcon");
const audioText = document.getElementById("audioText");
const audioPlayerContainer = document.getElementById("audioPlayerContainer");

const audioProgress = document.getElementById("audioProgress");
const audioCurrentTime = document.getElementById("audioCurrentTime");
const audioDuration = document.getElementById("audioDuration");

function formatTime(sec) {
  if (isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' + s : s}`;
}

storyAudio.addEventListener('loadedmetadata', () => {
  audioDuration.textContent = formatTime(storyAudio.duration);
  audioProgress.max = Math.floor(storyAudio.duration);
});

storyAudio.addEventListener('timeupdate', () => {
  audioProgress.value = Math.floor(storyAudio.currentTime);
  audioCurrentTime.textContent = formatTime(storyAudio.currentTime);
});

audioProgress.addEventListener('input', () => {
  storyAudio.currentTime = audioProgress.value;
});

storyAudio.addEventListener('waiting', () => { audioIcon.textContent = 'hourglass_empty'; audioText.textContent = 'Buffering...'; });
storyAudio.addEventListener('canplay', () => { if (storyAudio.paused) { audioIcon.textContent = 'play_arrow'; audioText.textContent = 'Listen to our story'; } });
storyAudio.addEventListener('playing', () => { audioIcon.textContent = 'pause'; audioText.textContent = 'Pause story'; });
storyAudio.addEventListener('pause', () => { audioIcon.textContent = 'play_arrow'; audioText.textContent = 'Listen to our story'; });
storyAudio.addEventListener('ended', () => { audioIcon.textContent = 'play_arrow'; audioText.textContent = 'Listen again'; audioProgress.value = 0; audioCurrentTime.textContent = "0:00"; });

function openStoryModal(btn) {
  const parent = btn.closest('.tl-content');
  const title = parent.querySelector('.tl-title').textContent;
  const date = parent.querySelector('.tl-date').textContent;
  const fullText = parent.querySelector('.full-story').innerHTML;
  const imgEl = parent.querySelector('.tl-img');
  const audioSrc = btn.getAttribute('data-audio');

  document.getElementById('storyModalTitle').textContent = title;
  document.getElementById('storyModalDate').textContent = date;
  document.getElementById('storyModalBody').innerHTML = fullText;

  const modalImg = document.getElementById('storyModalImg');
  if (imgEl) { modalImg.src = imgEl.src; modalImg.style.display = 'block'; } else { modalImg.style.display = 'none'; modalImg.src = ''; }

  if (audioSrc && audioSrc !== "null") {
    storyAudio.src = audioSrc;
    audioPlayerContainer.style.display = 'flex';
    audioIcon.textContent = 'play_arrow'; audioText.textContent = 'Listen to our story';
    audioProgress.value = 0;
    audioCurrentTime.textContent = "0:00";
    audioDuration.textContent = "0:00";
  } else {
    audioPlayerContainer.style.display = 'none'; storyAudio.src = '';
  }

  storyModal.classList.add('open'); document.body.style.overflow = 'hidden';
}

function closeStoryModal() {
  storyModal.classList.remove('open'); document.body.style.overflow = '';
  if (!storyAudio.paused) { storyAudio.pause(); }
  storyAudio.currentTime = 0;
  audioProgress.value = 0;
  audioCurrentTime.textContent = "0:00";
  audioIcon.textContent = 'play_arrow'; audioText.textContent = 'Listen to our story';
}

storyAudioBtn.addEventListener('click', () => {
  if (storyAudio.paused) { storyAudio.play(); } else { storyAudio.pause(); }
});

/* Close Modals on background click or Escape key */
window.addEventListener("click", e => { 
  if (e.target === galleryModal) closeGalleryModal(); 
  if (e.target === storyModal) closeStoryModal();
});
document.addEventListener("keydown", e => { 
  if (e.key === "Escape") { closeGalleryModal(); closeStoryModal(); closeFullscreen(); }
});

/* ── SIDE / BOTTOM NAV LOGIC ── */
const sidenav = document.getElementById("sidenav");
const snItems = document.querySelectorAll(".sn-item");

function updateIndicator(el) {
  if (!el) return;
  const pRect = sidenav.getBoundingClientRect(); const eRect = el.getBoundingClientRect();
  sidenav.style.setProperty('--x', `${(eRect.left - pRect.left) + eRect.width  / 2}px`);
  sidenav.style.setProperty('--y', `${(eRect.top  - pRect.top)  + eRect.height / 2}px`);
  sidenav.style.setProperty('--item-w', `${eRect.width}px`);
  sidenav.style.setProperty('--item-h', `${eRect.height}px`);
}

snItems.forEach(item => {
  item.addEventListener("click", () => {
    snItems.forEach(i => { i.classList.remove("active"); });
    item.classList.add("active"); updateIndicator(item);
    const target = document.getElementById(item.dataset.target);
    if (target) { const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 80; window.scrollTo({ top: offsetTop, behavior: "smooth" }); }
  });
});

function goHome() { const homeButton = document.querySelector('.sn-item[data-target="home"]'); if (homeButton) homeButton.click(); }

/* ── LOGIN & SESSION SYSTEM ── */
const CORRECT_PIN = "2309";
const SESSION_MS = 10 * 60 * 1000;
let pinInput = ""; let sessionEnd = 0; let timerInterval = null; let warningInterval = null; let warningActive = false;

function pinPress(digit) { if (pinInput.length >= 4) return; pinInput += digit; updateDots(); if (pinInput.length === 4) setTimeout(checkPin, 120); }
function pinDel() { pinInput = pinInput.slice(0, -1); updateDots(); hideError(); }
function updateDots() { for (let i = 0; i < 4; i++) { document.getElementById("dot" + i).classList.toggle("filled", i < pinInput.length); } }

function checkPin() {
  if (pinInput === CORRECT_PIN) {
    document.getElementById("loginScreen").classList.add("hidden");
    setTimeout(() => { document.getElementById("loginScreen").style.display = "none"; }, 650);
    document.getElementById("sessionTimer").style.display = "flex";
    startSession();
  } else {
    document.getElementById("loginError").classList.add("show");
    const dots = document.getElementById("pinDots"); dots.classList.add("shake");
    setTimeout(() => dots.classList.remove("shake"), 500);
    pinInput = ""; updateDots();
  }
}

function hideError() { document.getElementById("loginError").classList.remove("show"); }

document.addEventListener("keydown", e => {
  if (!document.getElementById("loginScreen").classList.contains("hidden")) {
    if (e.key >= "0" && e.key <= "9") pinPress(e.key);
    if (e.key === "Backspace") pinDel();
  }
});

function startSession() {
  sessionEnd = Date.now() + SESSION_MS; warningActive = false;
  clearInterval(timerInterval); clearInterval(warningInterval);
  document.getElementById("sessionWarning").classList.remove("show");
  timerInterval = setInterval(tickSession, 1000); tickSession();
}

function tickSession() {
  const remaining = Math.max(0, sessionEnd - Date.now());
  const mins = Math.floor(remaining / 60000); const secs = Math.floor((remaining % 60000) / 1000);
  document.getElementById("timerDisplay").textContent = `${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
  if (remaining <= 60000) { document.getElementById("sessionTimer").classList.add("urgent"); } else { document.getElementById("sessionTimer").classList.remove("urgent"); }
  if (remaining <= 10 * 1000 && !warningActive) {
    warningActive = true; document.getElementById("sessionWarning").classList.add("show");
    let countdown = Math.ceil(remaining / 1000); document.getElementById("warningCountdown").textContent = countdown;
    warningInterval = setInterval(() => { countdown--; document.getElementById("warningCountdown").textContent = Math.max(0, countdown); if (countdown <= 0) clearInterval(warningInterval); }, 1000);
  }
  if (remaining <= 0) {
    clearInterval(timerInterval); clearInterval(warningInterval);
    document.getElementById("sessionWarning").classList.remove("show");
    document.getElementById("sessionTimer").style.display = "none";
    pinInput = ""; updateDots(); hideError();
    document.getElementById("loginScreen").style.display = "flex";
    setTimeout(() => document.getElementById("loginScreen").classList.remove("hidden"), 20);
  }
}
function extendSession() { document.getElementById("sessionWarning").classList.remove("show"); clearInterval(warningInterval); startSession(); }

/* ── FLOATING LOVE PARTICLES ── */
function createParticle() {
  if (!document.getElementById("loginScreen").classList.contains("hidden")) return;
  const p = document.createElement("div"); p.innerHTML = "💕"; p.className = "particle";
  p.style.left = Math.random() * 100 + "vw"; p.style.fontSize = (Math.random() * 10 + 12) + "px"; p.style.animationDuration = (Math.random() * 4 + 6) + "s"; 
  document.body.appendChild(p); setTimeout(() => { p.remove(); }, 10000); 
}
setInterval(createParticle, 1500);

/* ── SCROLL REVEAL ── */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduceMotion && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("in-view"); revealObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

  document.querySelectorAll(".box, .tl-content").forEach(el => {
    el.classList.add("reveal");
    revealObserver.observe(el);
  });
} else {
  document.querySelectorAll(".reveal").forEach(el => el.classList.add("in-view"));
}

/* ── SUBTLE HERO PARALLAX ── */
if (!reduceMotion) {
  const heroEl = document.querySelector(".hero");
  window.addEventListener("scroll", () => {
    if (!heroEl) return;
    const y = window.scrollY;
    if (y < window.innerHeight) heroEl.style.transform = `translateY(${y * 0.15}px)`;
  }, { passive: true });
}

/* ══════════════════════════════════════════════════════════
   INVITATION EXPERIENCE — envelope, wax seal, cinematic exit
   ══════════════════════════════════════════════════════════ */
const invitationOverlay = document.getElementById("invitationOverlay");
const envelope = document.getElementById("envelope");

function openInvitation() {
  invitationOverlay.classList.add("show");
  document.body.style.overflow = "hidden";
  // Lower story narration if currently playing
  if (typeof storyAudio !== 'undefined' && !storyAudio.paused) storyAudio.volume = 0.15;
  setTimeout(() => { envelope.classList.add("open"); }, 450);
}

function closeInvitation() {
  envelope.classList.remove("open");
  invitationOverlay.classList.remove("show");
  document.body.style.overflow = "";
  if (typeof storyAudio !== 'undefined') storyAudio.volume = 1;
}

function goToAnniversary() {
  const exit = document.getElementById("cinematicExit");
  exit.classList.add("active");
  setTimeout(() => { window.location.href = "/aniversary/index.html"; }, 950);
}

invitationOverlay.addEventListener("click", e => { if (e.target === invitationOverlay) closeInvitation(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && invitationOverlay.classList.contains("show")) closeInvitation(); });
