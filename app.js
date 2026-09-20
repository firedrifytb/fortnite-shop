const SHOP_URL = "https://fortnite-api.com/v2/shop?language=fr";
const COSMETIC_URL =
  "https://fortnite-api.com/v2/cosmetics/br/search/ids?language=fr&id=";

const shopElement = document.querySelector("#shop");
const statusElement = document.querySelector("#status");
const dateElement = document.querySelector("#date");

const modal = document.querySelector(".item-modal");
const modalVideo = document.querySelector("#modal-video");
const modalImage = document.querySelector("#modal-image");
const previewTrack = document.querySelector(".preview-track");
const previewStatus = document.querySelector(".preview-status");

const modalName = document.querySelector("#modal-name");
const modalPrice = document.querySelector("#modal-price");
const modalDescription = document.querySelector("#modal-description");
const modalExtraInfo = document.querySelector("#modal-extra-info");

let shopItems = [];

let selectedItemIndex = 0;
let mediaIndex = 0;

let touchStartX = 0;
let touchCurrentX = 0;
let isDragging = false;

let modalEventsInitialized = false;


/* =========================================================
   UTILITAIRES
========================================================= */

function isValidHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}


function isDirectVideoUrl(value) {
  if (!isValidHttpUrl(value)) return false;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    const blockedHosts = [
      "youtube.com",
      "www.youtube.com",
      "youtu.be",
      "www.youtu.be",
      "youtube-nocookie.com",
      "www.youtube-nocookie.com"
    ];

    return !blockedHosts.includes(host);
  } catch {
    return false;
  }
}


function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   IMAGES
========================================================= */

function collectImages(entry, cosmetic) {
  const images = [];

  function add(value) {
    if (!isValidHttpUrl(value)) return;

    if (!images.includes(value)) {
      images.push(value);
    }
  }

  function addImageObject(value) {
    if (!value) return;

    if (typeof value === "string") {
      add(value);
      return;
    }

    if (typeof value === "object") {
      add(value.url);
      add(value.image);
      add(value.src);
    }
  }

  function addRenderImages(renderImages) {
    if (!Array.isArray(renderImages)) return;

    for (const render of renderImages) {
      addImageObject(render);
    }
  }

  /* Cosmetic API */

  if (cosmetic?.images) {
    addImageObject(cosmetic.images.featured);
    addImageObject(cosmetic.images.icon);
    addImageObject(cosmetic.images.background);
    addImageObject(cosmetic.images.full_background);
  }

  /* Shop entry */

  if (entry?.images) {
    addImageObject(entry.images.featured);
    addImageObject(entry.images.icon);
    addImageObject(entry.images.background);
    addImageObject(entry.images.full_background);
  }

  /* New display asset */

  addRenderImages(entry?.newDisplayAsset?.renderImages);

  /* Display asset */

  addRenderImages(entry?.displayAsset?.renderImages);

  /* Bundle */

  addImageObject(entry?.bundle?.image);

  /* Quelques structures supplémentaires */

  addImageObject(entry?.image);
  addImageObject(entry?.icon);
  addImageObject(entry?.featuredImage);

  return images;
}


/* =========================================================
   VIDEO DIRECTE
========================================================= */

function findDirectVideo(object) {
  if (!object || typeof object !== "object") {
    return null;
  }

  const keys = [
    "video",
    "videoUrl",
    "videoURL",
    "video_url",
    "videoSrc",
    "videoSource",
    "video_source",
    "showcaseVideoUrl",
    "showcase_video_url",
    "previewVideo",
    "previewVideoUrl",
    "preview_video_url",
    "mediaUrl",
    "mediaURL",
    "media_url"
  ];

  for (const key of keys) {
    const value = object[key];

    if (isDirectVideoUrl(value)) {
      return value;
    }
  }

  return null;
}


function getVideoSource(entry, cosmetic) {
  const objects = [
    entry,
    cosmetic,
    entry?.newDisplayAsset,
    entry?.displayAsset
  ];

  for (const object of objects) {
    const video = findDirectVideo(object);

    if (video) {
      return video;
    }
  }

  return null;
}


/* =========================================================
   EXTRACTION ITEM
========================================================= */

function extractShopItem(entry) {
  const brItem =
    entry?.brItems?.[0] ||
    entry?.items?.[0] ||
    entry?.cosmetic ||
    null;

  const cosmetic = brItem || null;

  const images = collectImages(entry, cosmetic);

  const video = getVideoSource(entry, cosmetic);

  const name =
    cosmetic?.name ||
    entry?.devName ||
    entry?.name ||
    "Objet Fortnite";

  const description =
    cosmetic?.description ||
    entry?.description ||
    "";

  const type =
    cosmetic?.type?.displayValue ||
    cosmetic?.type?.value ||
    entry?.offerTag?.displayName ||
    "";

  const rarity =
    cosmetic?.rarity?.displayValue ||
    cosmetic?.rarity?.value ||
    "";

  const price =
    entry?.finalPrice ??
    entry?.price?.finalPrice ??
    entry?.regularPrice ??
    0;

  return {
    id:
      cosmetic?.id ||
      entry?.offerId ||
      entry?.id ||
      crypto.randomUUID(),

    name,
    description,
    type,
    rarity,
    price,

    images,

    video,

    showcaseVideo:
      cosmetic?.showcaseVideo ||
      cosmetic?.showcaseVideoId ||
      null,

    displayAssetPath:
      entry?.displayAssetPath ||
      entry?.display_asset_path ||
      null,

    newDisplayAsset:
      entry?.newDisplayAsset ||
      entry?.new_display_asset ||
      null,

    raw: entry
  };
}


/* =========================================================
   AFFICHAGE SHOP
========================================================= */

function renderShop(items) {
  shopElement.innerHTML = "";

  if (!items.length) {
    shopElement.innerHTML = `
      <div class="empty-shop">
        Aucun objet disponible.
      </div>
    `;
    return;
  }

  for (let index = 0; index < items.length; index++) {
    const item = items[index];

    const card = document.createElement("article");
    card.className = "card";

    const image =
      item.images[0] ||
      "";

    const imageHtml = image
      ? `
        <img
          class="card-image"
          src="${escapeHtml(image)}"
          alt="${escapeHtml(item.name)}"
          loading="lazy"
        >
      `
      : `
        <div class="card-image card-image-placeholder">
          <span>Image indisponible</span>
        </div>
      `;

    card.innerHTML = `
      <div class="card-media">
        ${imageHtml}
      </div>

      <div class="card-overlay">
        <div class="card-bottom">
          <div class="card-info">
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(item.type || item.rarity || "")}</p>
          </div>

          <div class="price">
            ${escapeHtml(item.price)} 
            <span>V</span>
          </div>
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      openModal(index);
    });

    const img = card.querySelector("img");

    if (img) {
      img.addEventListener("error", () => {
        const currentImageIndex = item.images.indexOf(img.src);

        if (
          currentImageIndex !== -1 &&
          currentImageIndex + 1 < item.images.length
        ) {
          img.src = item.images[currentImageIndex + 1];
        } else {
          img.style.display = "none";
          img.parentElement.classList.add("card-image-placeholder");
          img.parentElement.innerHTML = `
            <span>Image indisponible</span>
          `;
        }
      });
    }

    shopElement.appendChild(card);
  }
}


/* =========================================================
   MODAL INFOS
========================================================= */

function updateModalInfo(item) {
  if (!item) return;

  if (modalName) {
    modalName.textContent = item.name || "Objet Fortnite";
  }

  if (modalDescription) {
    modalDescription.textContent =
      item.description || "";
  }

  if (modalPrice) {
    modalPrice.innerHTML = `
      ${escapeHtml(item.price)}
      <span>V</span>
    `;
  }

  if (modalExtraInfo) {
    const extra = [
      item.type,
      item.rarity
    ]
      .filter(Boolean)
      .join(" • ");

    modalExtraInfo.textContent = extra;
  }
}


/* =========================================================
   DOTS
========================================================= */

function createDots(item) {
  const dotsContainer =
    document.querySelector(".preview-dots");

  if (!dotsContainer) return;

  dotsContainer.innerHTML = "";

  const hasVideo = Boolean(item?.video);

  const mediaCount = hasVideo ? 2 : 1;

  for (let index = 0; index < mediaCount; index++) {
    const dot = document.createElement("button");

    dot.type = "button";
    dot.className = "preview-dot";

    if (index === mediaIndex) {
      dot.classList.add("active");
    }

    dot.setAttribute(
      "aria-label",
      index === 0 && hasVideo
        ? "Voir la vidéo"
        : "Voir l'image"
    );

    dot.addEventListener("click", () => {
      mediaIndex = index;
      updateModalPosition();
      handleMediaPlayback();
    });

    dotsContainer.appendChild(dot);
  }
}


function updateDots() {
  const dots =
    document.querySelectorAll(".preview-dot");

  dots.forEach((dot, index) => {
    dot.classList.toggle(
      "active",
      index === mediaIndex
    );
  });
}


/* =========================================================
   POSITION DU CARROUSEL
========================================================= */

function updateModalPosition(animate = true) {
  if (!previewTrack) return;

  previewTrack.style.transition = animate
    ? "transform 280ms cubic-bezier(.22,.61,.36,1)"
    : "none";

  previewTrack.style.transform =
    `translate3d(-${mediaIndex * 50}%, 0, 0)`;

  updateDots();
}


/* =========================================================
   MEDIA
========================================================= */

function showImageFallback() {
  if (!modalVideo || !modalImage) return;

  modalVideo.pause();

  modalVideo.style.display = "none";
  modalVideo.style.visibility = "hidden";
  modalVideo.style.opacity = "0";

  modalImage.style.display = "block";
  modalImage.style.visibility = "visible";
  modalImage.style.opacity = "1";

  if (previewStatus) {
    previewStatus.textContent = "";
    previewStatus.classList.remove("visible");
  }
}


function showVideo() {
  if (!modalVideo || !modalImage) return;

  modalImage.style.display = "none";
  modalImage.style.visibility = "hidden";
  modalImage.style.opacity = "0";

  modalVideo.style.display = "block";
  modalVideo.style.visibility = "visible";
  modalVideo.style.opacity = "1";

  if (previewStatus) {
    previewStatus.textContent = "";
    previewStatus.classList.remove("visible");
  }

  modalVideo
    .play()
    .catch(() => {});
}


function handleMediaPlayback() {
  const item = shopItems[selectedItemIndex];

  if (!item) return;

  const image =
    item.images[0] || "";

  if (modalImage) {
    modalImage.src = image;
    modalImage.alt = item.name || "Objet Fortnite";
  }

  /* Pas de vidéo directe = image */

  if (!item.video) {
    showImageFallback();
    return;
  }

  /* Slide image */

  if (mediaIndex === 1) {
    showImageFallback();
    return;
  }

  /* Slide vidéo */

  modalVideo.src = item.video;
  modalVideo.muted = true;
  modalVideo.loop = true;
  modalVideo.playsInline = true;

  showVideo();
}


/* =========================================================
   MODAL
========================================================= */

function openModal(index) {
  if (!shopItems[index]) return;

  selectedItemIndex = index;
  mediaIndex = 0;

  modal.dataset.shopIndex = String(index);

  const item = shopItems[selectedItemIndex];

  updateModalInfo(item);

  createDots(item);
  updateModalPosition(false);

  modal.classList.add("open");
  document.body.classList.add("modal-open");

  handleMediaPlayback();
}


function closeModal() {
  if (!modal) return;

  modal.classList.remove("open");
  document.body.classList.remove("modal-open");

  if (modalVideo) {
    modalVideo.pause();
    modalVideo.removeAttribute("src");
    modalVideo.load();

    modalVideo.style.display = "none";
    modalVideo.style.visibility = "hidden";
    modalVideo.style.opacity = "0";
  }
}


function goToNextMedia() {
  const item = shopItems[selectedItemIndex];

  if (!item) return;

  const maxIndex = item.video ? 1 : 0;

  if (mediaIndex >= maxIndex) return;

  mediaIndex++;

  updateModalPosition();
  handleMediaPlayback();
}


function goToPreviousMedia() {
  if (mediaIndex <= 0) return;

  mediaIndex--;

  updateModalPosition();
  handleMediaPlayback();
}


/* =========================================================
   SWIPE
========================================================= */

function setupSwipe() {
  const media = document.querySelector(".modal-media");

  if (!media || media.dataset.swipeReady === "true") {
    return;
  }

  media.dataset.swipeReady = "true";

  media.addEventListener(
    "touchstart",
    (event) => {
      if (!event.touches.length) return;

      touchStartX = event.touches[0].clientX;
      touchCurrentX = touchStartX;

      isDragging = true;
    },
    { passive: true }
  );

  media.addEventListener(
    "touchmove",
    (event) => {
      if (!isDragging || !event.touches.length) return;

      touchCurrentX = event.touches[0].clientX;
    },
    { passive: true }
  );

  media.addEventListener(
    "touchend",
    () => {
      if (!isDragging) return;

      isDragging = false;

      const difference =
        touchCurrentX - touchStartX;

      const threshold = 50;

      if (Math.abs(difference) < threshold) {
        return;
      }

      if (difference < 0) {
        goToNextMedia();
      } else {
        goToPreviousMedia();
      }
    },
    { passive: true }
  );
}


/* =========================================================
   EVENTS MODAL
========================================================= */

function setupModalEvents() {
  if (modalEventsInitialized) return;

  modalEventsInitialized = true;

  const closeButton =
    document.querySelector(".modal-close");

  const modalMedia =
    document.querySelector(".modal-media");

  closeButton?.addEventListener(
    "click",
    closeModal
  );

  modal?.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!modal?.classList.contains("open")) {
      return;
    }

    if (event.key === "Escape") {
      closeModal();
    }

    if (event.key === "ArrowRight") {
      goToNextMedia();
    }

    if (event.key === "ArrowLeft") {
      goToPreviousMedia();
    }
  });

  modalVideo?.addEventListener("error", () => {
    showImageFallback();
  });

  modalVideo?.addEventListener("loadeddata", () => {
    if (
      modal?.classList.contains("open") &&
      mediaIndex === 0
    ) {
      showVideo();
    }
  });

  modalMedia?.addEventListener("dblclick", () => {
    if (!modalVideo?.src) return;

    if (modalVideo.paused) {
      modalVideo.play().catch(() => {});
    } else {
      modalVideo.pause();
    }
  });

  setupSwipe();
}


/* =========================================================
   API COSMETIC
========================================================= */

async function fetchCosmetic(id) {
  if (!id) return null;

  try {
    const response = await fetch(
      `${COSMETIC_URL}${encodeURIComponent(id)}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return (
      data?.data?.[0] ||
      data?.data ||
      null
    );
  } catch {
    return null;
  }
}


/* =========================================================
   SHOP
========================================================= */

async function fetchShop() {
  const response = await fetch(SHOP_URL);

  if (!response.ok) {
    throw new Error(
      `Erreur HTTP ${response.status}`
    );
  }

  return response.json();
}


/* =========================================================
   CHARGEMENT
========================================================= */

async function loadShop() {
  try {
    statusElement.textContent = "Chargement...";

    const data = await fetchShop();

    const entries =
      data?.data?.entries ||
      data?.entries ||
      [];

    const extractedItems = [];

    for (const entry of entries) {
      let item = extractShopItem(entry);

      /*
       * Si l'entrée du shop ne contient pas assez
       * d'informations, on récupère le cosmetic complet.
       */

      const cosmeticId =
        entry?.brItems?.[0]?.id ||
        entry?.items?.[0]?.id ||
        entry?.cosmetic?.id;

      if (
        cosmeticId &&
        (
          item.images.length === 0 ||
          !item.description ||
          !item.name ||
          !item.raw?.brItems?.[0]
        )
      ) {
        const cosmetic =
          await fetchCosmetic(cosmeticId);

        if (cosmetic) {
          item = extractShopItem({
            ...entry,
            brItems: [cosmetic]
          });
        }
      }

      /*
       * On garde même l'objet s'il n'a pas d'image,
       * afin que le shop ne disparaisse pas silencieusement.
       */

      extractedItems.push(item);
    }

    shopItems = extractedItems;

    renderShop(shopItems);

    const now = new Date();

    if (dateElement) {
      dateElement.textContent =
        now.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        });
    }

    statusElement.textContent = "Boutique en direct";

    setupModalEvents();

  } catch (error) {
    console.error(error);

    statusElement.textContent =
      "Impossible de charger la boutique.";

    shopElement.innerHTML = `
      <div class="empty-shop">
        Une erreur est survenue lors du chargement.
      </div>
    `;
  }
}


/* =========================================================
   BOUTONS
========================================================= */

const refreshButton =
  document.querySelector("#refresh");

refreshButton?.addEventListener(
  "click",
  () => {
    loadShop();
  }
);


const loginButton =
  document.querySelector("#login");

loginButton?.addEventListener(
  "click",
  () => {
    window.location.href =
      "https://fortnite-shop.firedrifytb.workers.dev/login";
  }
);


/* =========================================================
   START
========================================================= */

loadShop();