const TOTAL_CATS = 12;
let catImages = [];
let liked = [];
let currentIndex = 0;

async function loadCats() {
  for (let i = 0; i < TOTAL_CATS; i++) {
    // random to avoid caching
    catImages.push(`https://cataas.com/cat?random=${Math.random()}`);
  }
  renderCards();
}

function renderCards() {
  const container = document.getElementById("card-container");
  container.innerHTML = "";

  // Create cards in reverse so first is on top
  for (let i = catImages.length - 1; i >= 0; i--) {
    const url = catImages[i];
    const card = document.createElement("div");
    card.className = "card";
    card.style.backgroundImage = `url(${url})`;
    card.dataset.index = i;

    // create like / dislike labels
    const likeLabel = document.createElement("div");
    likeLabel.className = "label like";
    likeLabel.textContent = "LIKE";
    card.appendChild(likeLabel);

    const dislikeLabel = document.createElement("div");
    dislikeLabel.className = "label dislike";
    dislikeLabel.textContent = "NOPE";
    card.appendChild(dislikeLabel);

    container.appendChild(card);

    const mc = new Hammer(card);
    mc.add(new Hammer.Pan({ threshold: 10 }));

    let initialX = 0, initialY = 0;

    mc.on("panstart", (ev) => {
      initialX = ev.deltaX;
      initialY = ev.deltaY;
      // remove transition so it moves smoothly
      card.style.transition = "none";
    });

    mc.on("panmove", (ev) => {
      const deltaX = ev.deltaX;
      const deltaY = ev.deltaY;
      // rotate a little based on how far it's dragged
      const rotation = deltaX / 20; // control rotation factor

      card.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;

      // adjust label opacity
      const likeOpacity = deltaX > 0 ? Math.min(deltaX / 100, 1) : 0;
      const dislikeOpacity = deltaX < 0 ? Math.min(-deltaX / 100, 1) : 0;
      likeLabel.style.opacity = likeOpacity;
      dislikeLabel.style.opacity = dislikeOpacity;
    });

    mc.on("panend", (ev) => {
      const deltaX = ev.deltaX;
      const absDeltaX = Math.abs(deltaX);
      const threshold = 100; // px threshold to commit swipe

      card.style.transition = "transform 0.3s ease-out";

      if (absDeltaX > threshold) {
        // Swipe committed
        const direction = deltaX > 0 ? "right" : "left";
        const endX = direction === "right" ? window.innerWidth : -window.innerWidth;
        const endRotation = direction === "right" ? 30 : -30;

        card.style.transform = `translate(${endX}px, ${ev.deltaY}px) rotate(${endRotation}deg)`;

        // After animation, remove card
        setTimeout(() => {
          const idx = Number(card.dataset.index);
          if (direction === "right") {
            liked.push(catImages[idx]);
          }
          card.remove();
          currentIndex++;
          if (currentIndex >= catImages.length) {
            showSummary();
          }
        }, 300);

      } else {
        // Cancel swipe — reset
        card.style.transform = "";
        likeLabel.style.opacity = 0;
        dislikeLabel.style.opacity = 0;
      }
    });
  }
}

function showSummary() {
  document.getElementById("summary").classList.remove("hidden");
  document.getElementById("like-count").textContent = liked.length;

  const likedContainer = document.getElementById("liked-images");
  likedContainer.innerHTML = "";

  liked.forEach((url) => {
    const img = document.createElement("img");
    img.src = url;
    likedContainer.appendChild(img);
  });
}

// Initialize
loadCats();
