/* Paws & Preferences — Upgraded & Debugged */

const TOTAL_CATS = 12;
let catImages = [];
let liked = [];
// currentIndex is no longer needed to track position; historyStack.length is used instead.
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
  catImages = [];
  for (let i = 0; i < TOTAL_CATS; i++) {
    // use unique query to avoid caching
    catImages.push(`https://cataas.com/cat?random=${Date.now()}-${Math.random()}`);
  }
}

// Helper: create a single card element
function createCard(url) { // Removed index parameter
  const card = document.createElement("div");
  card.className = "card";
  card.style.backgroundImage = `url(${url})`;
  // card.dataset.index is no longer used, simplifying logic

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
        // Get URL of the card that was just swiped (always the first item)
        const currentURL = catImages.shift(); 
        
        if (isLike) liked.push(currentURL);
        historyStack.push({ url: currentURL, liked: isLike });
        
        card.remove();
        updateProgress();
        if (catImages.length === 0) showSummary();
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

// Render stack (top card last appended) - FIXED to iterate forwards
function renderCards() {
  container.innerHTML = "";
  // Iterate forwards (0...N). The last appended child is visually on top.
  for (let i = 0; i < catImages.length; i++) {
    const card = createCard(catImages[i]);
    container.appendChild(card);
  }
}

// Programmatically trigger a swipe (used by buttons) - FIXED logic
function swipeTopCard(isLike) {
  const top = container.querySelector(".card:last-child"); // Top card is the last child
  if (!top) return;
  
  const dy = 0;
  const offX = isLike ? window.innerWidth : -window.innerWidth;
  const rot = isLike ? 30 : -30;
  top.style.transition = "transform 260ms cubic-bezier(.22,.9,.3,1)";
  top.style.transform = `translate(${offX}px, ${dy}px) rotate(${rot}deg)`;
  
  setTimeout(() => {
    const currentURL = catImages.shift(); // Remove the top card's URL (index 0)
    
    if (isLike) liked.push(currentURL);
    historyStack.push({ url: currentURL, liked: isLike });
    
    top.remove();
    updateProgress();
    if (catImages.length === 0) showSummary();
  }, 260);
}

// Undo last swipe - FIXED logic
function undoLast() {
  if (historyStack.length === 0) return;
  const last = historyStack.pop();
  
  // Remove from liked if it was liked
  if (last.liked) {
    const idx = liked.lastIndexOf(last.url);
    if (idx !== -1) liked.splice(idx, 1);
  }
  
  // Put the card back on top of the stack (index 0)
  catImages.unshift(last.url);
  
  renderCards();
  updateProgress();
  summaryEl.classList.add("hidden"); // hide summary if visible
}

// Progress UI updates - FIXED logic using historyStack
function updateProgress() {
  const total = TOTAL_CATS;
  const cardsProcessed = historyStack.length; // Number of decisions made
  
  // Current count is (processed + 1), unless all are done (then total)
  currentEl.textContent = Math.min(cardsProcessed + 1, total);
  
  const percent = Math.min((cardsProcessed / total) * 100, 100);
  progressLine.style.width = `${percent}%`;

  // Enable/disable undo button based on history
  btnUndo.disabled = cardsProcessed === 0;
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

// Restart app - FIXED logic
function restartAll() {
  liked = [];
  historyStack = [];
  buildImageList(); // Re-populate the images
  renderCards();
  updateProgress();
  summaryEl.classList.add("hidden");
}

// Dark mode toggling (persist using localStorage)
function initDarkMode() {
  const saved = localStorage.getItem("paws-dark");
  if (saved === "1") document.body.classList.add("dark");
  darkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("paws-dark", document.body.classList.contains("dark") ? "1" : "0");
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
