const TOTAL_CATS = 12;
let catImages = [];
let liked = [];

async function loadCats() {
  for (let i = 0; i < TOTAL_CATS; i++) {
    catImages.push(`https://cataas.com/cat?random=${Math.random()}`);
  }
  renderCards();
}

function renderCards() {
  const container = document.getElementById("card-container");
  container.innerHTML = "";

  catImages.forEach((url, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.backgroundImage = `url(${url})`;
    card.style.zIndex = catImages.length - index;

    container.appendChild(card);

    const hammer = new Hammer(card);
    hammer.on("swipeleft", () => handleSwipe(card, index, "left"));
    hammer.on("swiperight", () => handleSwipe(card, index, "right"));
  });
}

function handleSwipe(card, index, direction) {
  card.style.transform = direction === "right"
    ? "translateX(300px) rotate(20deg)"
    : "translateX(-300px) rotate(-20deg)";

  setTimeout(() => {
    card.remove();

    if (direction === "right") {
      liked.push(catImages[index]);
    }

    if (document.getElementById("card-container").children.length === 0) {
      showSummary();
    }
  }, 300);
}

function showSummary() {
  document.getElementById("summary").classList.remove("hidden");
  document.getElementById("like-count").textContent = liked.length;

  const container = document.getElementById("liked-images");
  liked.forEach(url => {
    const img = document.createElement("img");
    img.src = url;
    container.appendChild(img);
  });
}

loadCats();
