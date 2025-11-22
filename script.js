/* Paws & Preferences — upgraded with fixes for mobile/undo indexing errors. */

const TOTAL_CATS = 12;
let originalCatImages = []; // Full list of 12 images (fixed)
let catImages = [];         // Dynamic stack of images yet to be swiped (changing)
let liked = [];
let historyStack = [];      // to support undo: each item {url, liked:boolean}

const container = document.getElementById("card-container");
const currentEl = document.getElementById("current");
const totalEl = document.getElementById("total");
const progressLine = document.getElementById("progress-line");
const likeCountEl = document.getElementById("like-count");
const likedContainer = document.getElementById("liked-images");
const summaryEl = document.getElementById("summary");

const btnLike = document.getElementById("like");
const btnDislike = document.getElementById("dislike");
const btnUndo = document.getElementById("undo");
const btnRestart = document.getElementById("restart");
const darkToggle = document.getElementById("dark-toggle");

totalEl.textContent = TOTAL_CATS;

// Preload a fixed set of secure HTTPS images
function buildImageList() {
  originalCatImages = [];
  for (let i = 0; i < TOTAL_CATS; i++) {
    // use unique query to avoid caching
    originalCatImages.push(`https://cataas.com/cat?random=${Date.now()}-${Math.random()}`);
  }
  // Start the dynamic stack with a copy of the original list
  catImages = [...originalCatImages];
}

// Helper: create a single card element
function createCard(url) { // Removed 'index' argument as it's no longer reliable/needed
  const card = document.createElement("div");
  card.className = "card";
  card.style.backgroundImage = `url(${url})`;
  // card.dataset.index = index;  // Removed: We don't rely on dataset.index anymore

  const likeLabel = document.createElement("div");
  likeLabel.className = "label like";
  likeLabel.textContent = "LIKE";
  card.appendChild(likeLabel);

  const dislikeLabel = document.createElement("div");
  dislikeLabel.className = "label dislike";
  dislikeLabel.textContent = "NOPE";
  card.appendChild(dislikeLabel);

  // attach Hammer pan to each card
  const mc = new Hammer(card);
  mc.add(new Hammer.Pan({ threshold: 6 }));

  mc.on("panstart", () => {
    card.style.transition = "none";
  });

  mc.on("panmove", (ev) => {
    const dx = ev.deltaX;
    const dy = ev.deltaY;
    const rotate = dx / 18;
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotate}deg)`;

    // show label opacity
    likeLabel.style.opacity = dx > 0 ? Math.min(dx / 120, 1) : 0;
    dislikeLabel.style.opacity = dx < 0 ? Math.min(-dx / 120, 1) : 0;
  });

  mc.on("panend", (ev) => {
    const dx = ev.deltaX;
    const dy = ev.deltaY;
    const abs = Math.abs(dx);
    const threshold = 110;

    card.style.transition = "transform 260ms cubic-bezier(.22,.9,.3,1)";

    if (abs > threshold) {
      const isLike = dx > 0;
      const offX = isLike ? window.innerWidth : -window.innerWidth;
      const rot = isLike ? 30 : -30;
      card.style.transform = `translate(${offX}px, ${dy}px) rotate(${rot}deg)`;

      // record decision then remove after animation
      setTimeout(() => {
        
        // FIX: Get the URL and remove it from the start of the dynamic catImages array
        const swipedUrl = catImages.shift(); 
        
        if (isLike) liked.push(swipedUrl);
        historyStack.push({ url: swipedUrl, liked: isLike });
        card.remove();
        
        updateProgress(); // Update progress based on historyStack length
        if (catImages.length === 0) showSummary(); // Check remaining cards
      }, 260);
    } else {
      // snap back
      card.style.transform = "";
      likeLabel.style.opacity = 0;
      dislikeLabel.style.opacity = 0;
    }
  });

  return card;
}

// Render stack (top card last appended)
function renderCards() {
  container.innerHTML = "";
  // Renders the remaining cards in the dynamic catImages array
  for (let i = catImages.length - 1; i >= 0; i--) {
    const card = createCard(catImages[i]);
    container.appendChild(card);
  }
}

// Programmatically trigger a swipe (used by buttons)
function swipeTopCard(isLike) {
  const top = container.querySelector(".card");
  if (!top) return;
  const dy = 0;
  const offX = isLike ? window.innerWidth : -window.innerWidth;
  const rot = isLike ? 30 : -30;
  top.style.transition = "transform 260ms cubic-bezier(.22,.9,.3,1)";
  top.style.transform = `translate(${offX}px, ${dy}px) rotate(${rot}deg)`;
  setTimeout(() => {
    // FIX: Get the URL and remove it from the start of the dynamic catImages array
    const swipedUrl = catImages.shift();
    
    if (isLike) liked.push(swipedUrl);
    historyStack.push({ url: swipedUrl, liked: isLike });
    top.remove();
    
    updateProgress();
    if (catImages.length === 0) showSummary();
  }, 260);
}

// Undo last swipe
function undoLast() {
  if (historyStack.length === 0) return;
  const last = historyStack.pop();

  // FIX: Re-insert the URL at the beginning of the dynamic catImages array
  catImages.unshift(last.url); 

  // remove from liked if it was liked
  if (last.liked) {
    const idx = liked.lastIndexOf(last.url);
    if (idx !== -1) liked.splice(idx, 1);
  }

  renderCards();
  updateProgress();
  summaryEl.classList.add("hidden"); // hide summary if visible
}

// Progress UI updates
function updateProgress() {
  const total = TOTAL_CATS;
  // FIX: Use historyStack.length for accurate progress count
  const currentCount = historyStack.length; 
  
  currentEl.textContent = Math.min(currentCount + 1, total);
  const percent = Math.min((currentCount / total) * 100, 100);
  progressLine.style.width = `${percent}%`;
}

// Show summary
function showSummary() {
  summaryEl.classList.remove("hidden");
  likeCountEl.textContent = liked.length;
  likedContainer.innerHTML = "";
  liked.forEach(url => {
    const img = document.createElement("img");
    img.src = url;
    likedContainer.appendChild(img);
  });
}

// Restart app
function restartAll() {
  liked = [];
  historyStack = [];
  buildImageList(); // Re-initialize catImages from originalCatImages
  renderCards();
  updateProgress();
  summaryEl.classList.add("hidden");
}

// Dark mode toggling (persist using localStorage)
function initDarkMode() {
  const saved = localStorage.getItem("paws-dark");
  const isDark = saved === "1";

  if (isDark) {
    document.body.classList.add("dark");
    darkToggle.textContent = "☀️"; // Set sun icon
  } else {
    darkToggle.textContent = "🌙"; // Set moon icon
  }
  
  darkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const nowDark = document.body.classList.contains("dark");
    localStorage.setItem("paws-dark", nowDark ? "1" : "0");
    
    // FIX: Update icon on click
    darkToggle.textContent = nowDark ? "☀️" : "🌙";
  });
}

// Attach UI button listeners
btnLike.addEventListener("click", () => swipeTopCard(true));
btnDislike.addEventListener("click", () => swipeTopCard(false));
btnUndo.addEventListener("click", undoLast);
btnRestart.addEventListener("click", restartAll);

// init
buildImageList();
renderCards();
updateProgress();
initDarkMode();
