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

let shopItems = [];
let currentIndex = 0;
let touchStartX = 0;
let touchCurrentX = 0;
let isDragging = false;

function setStatus(text, type = "") {
  if (!statusElement) return;

  statusElement.textContent = text;
  statusElement.className = type ? `status ${type}` : "status";
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isValidHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/*
 * IMPORTANT :
 * Cette fonction refuse volontairement les IDs YouTube.
 * Un showcaseVideo comme "oQkiJeNZJqk" n'est PAS une vidéo lisible
 * par <video>.
 */
function isDirectVideoUrl(value) {
  if (!isValidHttpUrl(value)) {
    return false;
  }

  const url = new URL(value);

  // On ne veut jamais envoyer YouTube dans le lecteur natif.
  const blockedHosts = [
    "youtube.com",
    "www.youtube.com",
    "youtu.be",
    "www.youtu.be",
    "youtube-nocookie.com",
    "www.youtube-nocookie.com"
  ];

  if (blockedHosts.includes(url.hostname.toLowerCase())) {
    return false;
  }

  return true;
}

/*
 * Recherche une vraie URL vidéo dans toutes les propriétés
 * susceptibles d'en contenir une.
 *
 * On ne suppose PAS que l'URL doit obligatoirement finir par .mp4.
 * Certains CDN utilisent des URLs sans extension.
 */
function findDirectVideo(data) {
  if (!data || typeof data !== "object") {
    return null;
  }

  const possibleKeys = [
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

  for (const key of possibleKeys) {
    const value = data[key];

    if (isDirectVideoUrl(value)) {
      return value;
    }
  }

  return null;
}

/*
 * Extraction extrêmement tolérante des images.
 *
 * Le shop actuel peut fournir :
 * - brItems[].images.featured
 * - brItems[].images.icon
 * - newDisplayAsset.renderImages[].image
 * - bundle.image
 * - etc.
 */
function collectImages(entry, cosmetic) {
  const result = [];

  function add(value) {
    if (!isValidHttpUrl(value)) return;

    if (!result.includes(value)) {
      result.push(value);
    }
  }

  function inspectImages(images) {
    if (!images || typeof images !== "object") return;

    const preferred = [
      "featured",
      "background",
      "full_background",
      "icon",
      "smallIcon",
      "small",
      "large",
      "wide"
    ];

    for (const key of preferred) {
      add(images[key]);
    }

    // Permet aussi de récupérer d'éventuelles nouvelles propriétés.
    for (const value of Object.values(images)) {
      if (typeof value === "string") {
        add(value);
      } else if (value && typeof value === "object") {
        for (const nested of Object.values(value)) {
          add(nested);
        }
      }
    }
  }

  if (cosmetic) {
    inspectImages(cosmetic.images);
  }

  if (entry) {
    inspectImages(entry.images);

    if (entry.bundle) {
      add(entry.bundle.image);
    }

    const renderImages =
      entry.newDisplayAsset?.renderImages ||
      entry.new_display_asset?.renderImages ||
      [];

    for (const render of renderImages) {
      add(render?.image);
    }

    const oldRenderImages =
      entry.displayAsset?.renderImages ||
      entry.display_asset?.renderImages ||
      [];

    for (const render of oldRenderImages) {
      add(render?.image);
    }
  }

  return result;
}

/*
 * Récupère une vidéo seulement si l'API donne réellement une URL.
 *
 * showcaseVideo / showcase_video_id est volontairement ignoré :
 * ce n'est qu'un identifiant YouTube.
 */
function getVideoSource(entry, cosmetic) {
  const candidates = [
    entry,
    cosmetic,
    entry?.newDisplayAsset,
    entry?.new_display_asset,
    entry?.displayAsset,
    entry?.display_asset
  ];

  for (const candidate of candidates) {
    const video = findDirectVideo(candidate);

    if (video) {
      return video;
    }
  }

  return null;
}

function getPrimaryCosmetic(entry) {
  if (!entry) return null;

  return (
    entry.brItems?.[0] ||
    entry.items?.[0] ||
    entry.br?.[0] ||
    entry.cosmetics?.[0] ||
    null
  );
}

function extractShopItem(entry) {
  const cosmetic = getPrimaryCosmetic(entry);

  if (!cosmetic && !entry) {
    return null;
  }

  const images = collectImages(entry, cosmetic);

  if (!images.length) {
    return null;
  }

  const video = getVideoSource(entry, cosmetic);

  return {
    id:
      cosmetic?.id ||
      entry?.newDisplayAsset?.cosmeticId ||
      entry?.newDisplayAsset?.id ||
      entry?.offerId ||
      crypto.randomUUID(),

    name:
      cosmetic?.name ||
      entry?.bundle?.name ||
      "Objet Fortnite",

    description:
      cosmetic?.description ||
      "",

    type:
      cosmetic?.type?.displayValue ||
      cosmetic?.type?.value ||
      "",

    rarity:
      cosmetic?.rarity?.displayValue ||
      cosmetic?.rarity?.value ||
      "",

    price:
      entry?.finalPrice ??
      entry?.regularPrice ??
      0,

    images,

    video,

    showcaseVideo:
      cosmetic?.showcaseVideo ||
      cosmetic?.showcase_video_id ||
      null,

    displayAssetPath:
      entry?.newDisplayAssetPath ||
      entry?.new_display_asset_path ||
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

function formatPrice(price) {
  return `${Number(price || 0).toLocaleString("fr-FR")} V-Bucks`;
}

function renderShop() {
  if (!shopElement) return;

  shopElement.innerHTML = "";

  if (!shopItems.length) {
    shopElement.innerHTML = `
      <div class="empty-shop">
        Aucun objet disponible.
      </div>
    `;
    return;
  }

  for (let i = 0; i < shopItems.length; i++) {
    const item = shopItems[i];

    const image = item.images[0];

    const card = document.createElement("article");
    card.className = "card";

    card.innerHTML = `
      <div class="card-media">
        <img
          src="${escapeHTML(image)}"
          alt="${escapeHTML(item.name)}"
          loading="lazy"
          decoding="async"
        >
      </div>

      <div class="card-info">
        <div>
          <h3>${escapeHTML(item.name)}</h3>
          ${
            item.type
              ? `<p>${escapeHTML(item.type)}</p>`
              : ""
          }
        </div>

        <div class="price">
          ${escapeHTML(formatPrice(item.price))}
        </div>
      </div>
    `;

    const imageElement = card.querySelector("img");

    /*
     * Si la première image est morte, on essaye toutes les autres
     * images que l'API nous a données.
     */
    let fallbackIndex = 1;

    imageElement.addEventListener("error", () => {
      if (fallbackIndex >= item.images.length) {
        imageElement.style.display = "none";
        return;
      }

      imageElement.src = item.images[fallbackIndex];
      fallbackIndex++;
    });

    card.addEventListener("click", () => {
      openModal(i);
    });

    shopElement.appendChild(card);
  }
}

function updateModalPosition(animate = true) {
  if (!previewTrack) return;

  previewTrack.style.transition = animate
    ? "transform 0.35s cubic-bezier(.2,.8,.2,1)"
    : "none";

  previewTrack.style.transform =
    `translate3d(-${currentIndex * 50}%, 0, 0)`;

  updateDots();
}

function updateDots() {
  const dots = document.querySelectorAll(".carousel-dot");

  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === currentIndex);
  });
}

function createDots() {
  const container = document.querySelector(".carousel-dots");

  if (!container) return;

  container.innerHTML = `
    <button class="carousel-dot active" type="button" aria-label="Vidéo"></button>
    <button class="carousel-dot" type="button" aria-label="Image"></button>
  `;

  const dots = container.querySelectorAll(".carousel-dot");

  dots.forEach((dot, index) => {
    dot.addEventListener("click", (event) => {
      event.stopPropagation();
      currentIndex = index;
      updateModalPosition(true);
      handleMediaPlayback();
    });
  });
}

function resetVideo() {
  if (!modalVideo) return;

  modalVideo.pause();
  modalVideo.removeAttribute("src");
  modalVideo.load();
}

function showImageFallback() {
  if (!modalVideo || !modalImage) return;

  modalVideo.style.visibility = "hidden";
  modalVideo.style.opacity = "0";

  modalImage.style.visibility = "visible";
  modalImage.style.opacity = "1";
}

function showVideo() {
  if (!modalVideo || !modalImage) return;

  modalImage.style.visibility = "hidden";
  modalImage.style.opacity = "0";

  modalVideo.style.visibility = "visible";
  modalVideo.style.opacity = "1";
}

function handleMediaPlayback() {
  const item = shopItems[currentIndex];

  if (!item) return;

  const image =
    item.images[0] ||
    "";

  if (modalImage) {
    modalImage.src = image;
    modalImage.alt = item.name;
  }

  /*
   * Slide 0 = vidéo
   * Slide 1 = image
   */
  if (currentIndex === 1) {
    resetVideo();
    showImageFallback();

    if (previewStatus) {
      previewStatus.textContent = "Image";
    }

    return;
  }

  /*
   * IMPORTANT :
   * On n'utilise jamais showcaseVideo comme src.
   *
   * Si l'API ne fournit pas une vraie URL vidéo, on affiche
   * simplement l'image dans la première vue.
   */
  if (!item.video) {
    resetVideo();
    showImageFallback();

    if (previewStatus) {
      previewStatus.textContent = "Aperçu";
    }

    return;
  }

  modalVideo.src = item.video;
  modalVideo.muted = true;
  modalVideo.loop = true;
  modalVideo.autoplay = true;
  modalVideo.playsInline = true;

  showVideo();

  if (previewStatus) {
    previewStatus.textContent = "Lecture";
  }

  const playPromise = modalVideo.play();

  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      /*
       * Si le navigateur refuse l'autoplay ou si l'URL
       * n'est finalement pas une ressource vidéo native,
       * on revient proprement à l'image.
       */
      showImageFallback();

      if (previewStatus) {
        previewStatus.textContent = "Aperçu";
      }
    });
  }
}

function openModal(index) {
  if (!modal) return;

  currentIndex = index;

  const item = shopItems[currentIndex];

  if (!item) return;

  modal.classList.add("open");
  document.body.classList.add("modal-open");

  createDots();
  updateModalPosition(false);

  if (previewTrack) {
    previewTrack.style.transform =
      `translate3d(-${currentIndex * 50}%, 0, 0)`;
  }

  /*
   * On commence toujours sur la première vue.
   */
  currentIndex = 0;
  updateModalPosition(false);

  handleMediaPlayback();

  /*
   * Met les infos du premier item affiché.
   */
  updateModalInfo(item);
}

function updateModalInfo(item) {
  const title =
    document.querySelector(".modal-info h2") ||
    document.querySelector(".modal-info h3");

  const description =
    document.querySelector(".modal-info p");

  const price =
    document.querySelector(".modal-info .price");

  if (title) {
    title.textContent = item.name;
  }

  if (description) {
    description.textContent =
      item.description ||
      item.type ||
      "";
  }

  if (price) {
    price.textContent = formatPrice(item.price);
  }
}

function closeModal() {
  if (!modal) return;

  modal.classList.remove("open");
  document.body.classList.remove("modal-open");

  resetVideo();

  if (modalImage) {
    modalImage.removeAttribute("src");
  }
}

function goToNextMedia() {
  currentIndex = Math.min(currentIndex + 1, 1);

  updateModalPosition(true);

  const item = shopItems[
    Number(modal?.dataset?.shopIndex || 0)
  ];

  if (item) {
    updateModalInfo(item);
  }

  handleMediaPlayback();
}

function goToPreviousMedia() {
  currentIndex = Math.max(currentIndex - 1, 0);

  updateModalPosition(true);

  const item = shopItems[
    Number(modal?.dataset?.shopIndex || 0)
  ];

  if (item) {
    updateModalInfo(item);
  }

  handleMediaPlayback();
}

/*
 * Swipe horizontal.
 */
function setupSwipe() {
  if (!previewTrack) return;

  previewTrack.addEventListener(
    "touchstart",
    (event) => {
      if (!event.touches.length) return;

      touchStartX = event.touches[0].clientX;
      touchCurrentX = touchStartX;
      isDragging = true;

      previewTrack.style.transition = "none";
    },
    { passive: true }
  );

  previewTrack.addEventListener(
    "touchmove",
    (event) => {
      if (!isDragging || !event.touches.length) return;

      touchCurrentX = event.touches[0].clientX;

      const delta = touchCurrentX - touchStartX;
      const percentage = (delta / window.innerWidth) * 50;

      const base = currentIndex * 50;

      previewTrack.style.transform =
        `translate3d(calc(-${base}% + ${percentage}%), 0, 0)`;
    },
    { passive: true }
  );

  previewTrack.addEventListener("touchend", () => {
    if (!isDragging) return;

    isDragging = false;

    const delta = touchCurrentX - touchStartX;
    const threshold = 60;

    if (Math.abs(delta) >= threshold) {
      if (delta < 0) {
        currentIndex = Math.min(currentIndex + 1, 1);
      } else {
        currentIndex = Math.max(currentIndex - 1, 0);
      }
    }

    updateModalPosition(true);
    handleMediaPlayback();
  });
}

function setupModalEvents() {
  if (!modal) return;

  const closeButton =
    modal.querySelector(".modal-close") ||
    modal.querySelector("[data-close-modal]");

  if (closeButton) {
    closeButton.addEventListener("click", closeModal);
  }

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!modal.classList.contains("open")) return;

    if (event.key === "Escape") {
      closeModal();
    }

    if (event.key === "ArrowRight") {
      currentIndex = Math.min(currentIndex + 1, 1);
      updateModalPosition(true);
      handleMediaPlayback();
    }

    if (event.key === "ArrowLeft") {
      currentIndex = Math.max(currentIndex - 1, 0);
      updateModalPosition(true);
      handleMediaPlayback();
    }
  });

  if (modalVideo) {
    modalVideo.addEventListener("error", () => {
      showImageFallback();

      if (previewStatus) {
        previewStatus.textContent = "Aperçu";
      }
    });

    modalVideo.addEventListener("loadeddata", () => {
      if (currentIndex === 0) {
        showVideo();
      }
    });
  }

  setupSwipe();
}

async function fetchShop() {
  setStatus("Chargement de la boutique…", "loading");

  const response = await fetch(SHOP_URL, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `Erreur API boutique : ${response.status}`
    );
  }

  return response.json();
}

async function fetchCosmetic(id) {
  if (!id) return null;

  try {
    const response = await fetch(
      `${COSMETIC_URL}${encodeURIComponent(id)}`,
      {
        cache: "no-store"
      }
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

async function loadShop() {
  try {
    const data = await fetchShop();

    const entries =
      data?.data?.entries ||
      data?.entries ||
      [];

    /*
     * Première extraction directement depuis le shop.
     * C'est important : le shop actuel fournit déjà beaucoup
     * d'images via newDisplayAsset.renderImages.
     */
    const directItems = entries
      .map(extractShopItem)
      .filter(Boolean);

    /*
     * Certains anciens / particuliers items ont moins de données.
     * On complète uniquement ceux qui ont besoin d'une requête
     * cosmétique supplémentaire.
     */
    const completed = [];

    for (const item of directItems) {
      let finalItem = item;

      const cosmeticId =
        item.raw?.newDisplayAsset?.cosmeticId ||
        item.raw?.brItems?.[0]?.id ||
        item.raw?.items?.[0]?.id;

      if (
        cosmeticId &&
        (
          item.images.length < 2 ||
          !item.name ||
          !item.raw?.brItems?.[0]
        )
      ) {
        const cosmetic = await fetchCosmetic(cosmeticId);

        if (cosmetic) {
          const extraImages =
            collectImages(item.raw, cosmetic);

          finalItem = {
            ...item,

            name:
              cosmetic.name ||
              item.name,

            description:
              cosmetic.description ||
              item.description,

            type:
              cosmetic.type?.displayValue ||
              item.type,

            rarity:
              cosmetic.rarity?.displayValue ||
              item.rarity,

            images: [
              ...new Set([
                ...extraImages,
                ...item.images
              ])
            ],

            /*
             * Toujours pas de showcaseVideo ici :
             * c'est un ID YouTube, pas une URL native.
             */
            video:
              item.video ||
              getVideoSource(item.raw, cosmetic)
          };
        }
      }

      completed.push(finalItem);
    }

    shopItems = completed;

    renderShop();

    if (dateElement && data?.data?.date) {
      const date = new Date(data.data.date);

      dateElement.textContent =
        date.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long"
        });
    }

    setStatus(
      `${shopItems.length} objets disponibles`,
      "success"
    );

    /*
     * On rend le modal prêt dès le chargement.
     */
    setupModalEvents();

  } catch (error) {
    console.error(error);

    setStatus(
      "Impossible de charger la boutique.",
      "error"
    );

    if (shopElement) {
      shopElement.innerHTML = `
        <div class="empty-shop">
          <h3>Erreur de chargement</h3>
          <p>Impossible de récupérer la boutique Fortnite.</p>
        </div>
      `;
    }
  }
}

/*
 * Refresh si un bouton existe déjà dans ton interface.
 */
const refreshButton =
  document.querySelector("#refresh") ||
  document.querySelector(".refresh-btn") ||
  document.querySelector("[data-refresh]");

if (refreshButton) {
  refreshButton.addEventListener("click", () => {
    loadShop();
  });
}

/*
 * Bouton Epic existant :
 * on ne modifie pas son fonctionnement.
 */
const epicLoginButton =
  document.querySelector("#epic-login") ||
  document.querySelector(".epic-login") ||
  document.querySelector("[data-epic-login]");

if (epicLoginButton) {
  epicLoginButton.addEventListener("click", () => {
    window.location.href =
      "https://fortnite-shop.firedrifytb.workers.dev/login";
  });
}

/*
 * Lancement.
 */
loadShop();