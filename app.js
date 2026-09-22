/* =========================================================
   FORTNITE SHOP
   Layout dynamique + sections + packs + modale
   ========================================================= */

const SHOP_API =
  "https://fortnite-api.com/v2/shop?language=fr";


/* =========================================================
   ÉLÉMENTS DOM
   ========================================================= */

const shopGrid =
  document.getElementById("shop");

const shopStatus =
  document.getElementById("shop-status");

const refreshBtn =
  document.getElementById("refresh-shop");

const itemModal =
  document.getElementById("item-modal");

const modalMedia =
  document.querySelector(".modal-media");

const previewTrack =
  document.getElementById("preview-track");

const modalImage =
  document.getElementById("preview-image");

const modalVideo =
  document.getElementById("preview-video");

const videoSource =
  document.getElementById("preview-video-source");

const carouselDots =
  document.getElementById("preview-dots");

const modalTitle =
  document.getElementById("modal-name");

const modalDescription =
  document.getElementById("modal-description");

const modalPrice =
  document.getElementById("modal-price");

const modalClose =
  document.getElementById("modal-close");

const packCarousel =
  document.getElementById("pack-carousel");

const packItemsContainer =
  document.getElementById("pack-carousel-track");

const packPrev =
  document.getElementById("pack-carousel-prev");

const packNext =
  document.getElementById("pack-carousel-next");


/* =========================================================
   ÉTAT
   ========================================================= */

let allShopItems = [];

const shopItemsByKey =
  new Map();

let currentModalItem =
  null;

let currentPreviewIndex =
  0;

let modalTouchStartX =
  0;

let modalTouchStartY =
  0;


/* =========================================================
   UTILITAIRES
   ========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function getNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


function formatPrice(value) {
  const number =
    getNumber(value);

  if (number === null) {
    return "";
  }

  return (
    number.toLocaleString("fr-FR") +
    " V-Bucks"
  );
}


/* =========================================================
   ITEMS
   ========================================================= */

function getEntryItems(entry) {
  if (!entry) {
    return [];
  }

  if (
    Array.isArray(entry.items)
  ) {
    return entry.items;
  }

  return [];
}


/* =========================================================
   PACK
   ========================================================= */

function isPackEntry(entry) {
  if (!entry) {
    return false;
  }

  const items =
    getEntryItems(entry);

  return (
    items.length > 1 ||
    Boolean(entry.bundle)
  );
}


/* =========================================================
   IMAGE PRINCIPALE
   ORDRE STRICT
   ========================================================= */

function getEntryImage(entry) {
  if (!entry) {
    return "";
  }

  const imageA =
    entry
      .newDisplayAsset
      ?.materialInstances?.[0]
      ?.images?.Background;

  if (
    typeof imageA === "string" &&
    imageA.trim()
  ) {
    return imageA.trim();
  }


  const imageB =
    entry
      .displayAssets?.[0]
      ?.url;

  if (
    typeof imageB === "string" &&
    imageB.trim()
  ) {
    return imageB.trim();
  }


  const imageC =
    entry
      .items?.[0]
      ?.images?.icon;

  if (
    typeof imageC === "string" &&
    imageC.trim()
  ) {
    return imageC.trim();
  }


  const imageD =
    entry
      .items?.[0]
      ?.images?.featured;

  if (
    typeof imageD === "string" &&
    imageD.trim()
  ) {
    return imageD.trim();
  }

  return "";
}


function getItemImage(item) {
  if (!item) {
    return "";
  }

  return (
    item.images?.icon ||
    item.images?.featured ||
    ""
  );
}


/* =========================================================
   NOM
   ========================================================= */

function getEntryName(entry) {
  if (!entry) {
    return "";
  }

  const itemName =
    entry
      .items?.[0]
      ?.name;

  if (
    typeof itemName === "string" &&
    itemName.trim()
  ) {
    return itemName.trim();
  }

  const bundleName =
    entry
      .bundle
      ?.name;

  if (
    typeof bundleName === "string" &&
    bundleName.trim()
  ) {
    return bundleName.trim();
  }

  return "";
}


/* =========================================================
   DESCRIPTION
   ========================================================= */

function getEntryDescription(entry) {
  if (!entry) {
    return "";
  }

  return (
    entry.description ||
    entry.bundle?.description ||
    entry.items?.[0]?.description ||
    ""
  );
}


/* =========================================================
   PRIX
   ========================================================= */

function getEntryFinalPrice(entry) {
  if (!entry) {
    return null;
  }

  const candidates = [
    entry.finalPrice,
    entry.prices?.finalPrice,
    entry.price?.finalPrice,
    entry.bundle?.finalPrice,
    entry.bundle?.price?.finalPrice
  ];

  for (
    const value
    of candidates
  ) {
    const number =
      getNumber(value);

    if (number !== null) {
      return number;
    }
  }

  return null;
}


function getEntryRegularPrice(entry) {
  if (!entry) {
    return null;
  }

  const candidates = [
    entry.regularPrice,
    entry.prices?.regularPrice,
    entry.price?.regularPrice,
    entry.bundle?.regularPrice,
    entry.bundle?.price?.regularPrice
  ];

  for (
    const value
    of candidates
  ) {
    const number =
      getNumber(value);

    if (number !== null) {
      return number;
    }
  }

  return null;
}


function getBundleRegularPrice(entry) {
  const items =
    getEntryItems(entry);

  if (!items.length) {
    return null;
  }

  let total = 0;

  for (
    const item
    of items
  ) {
    const price =
      getNumber(
        item?.price?.finalPrice
      ) ??
      getNumber(
        item?.finalPrice
      );

    if (price !== null) {
      total += price;
    }
  }

  return total > 0
    ? total
    : null;
}


function getEntryDiscount(entry) {
  const finalPrice =
    getEntryFinalPrice(entry);

  let regularPrice =
    getEntryRegularPrice(entry);

  if (
    regularPrice === null &&
    isPackEntry(entry)
  ) {
    regularPrice =
      getBundleRegularPrice(entry);
  }

  if (
    finalPrice === null ||
    regularPrice === null ||
    regularPrice <= finalPrice
  ) {
    return 0;
  }

  return Math.round(
    (
      (regularPrice - finalPrice) /
      regularPrice
    ) * 100
  );
}


/* =========================================================
   TYPE / RARETÉ / SET
   ========================================================= */

function getItemType(item) {
  if (!item) {
    return "";
  }

  return (
    item.type?.displayName ||
    item.type?.name ||
    item.type?.value ||
    item.type ||
    ""
  );
}


function getRarityKey(item) {
  return String(
    item?.rarity?.value ||
    item?.rarity?.name ||
    item?.rarity?.displayName ||
    item?.rarity ||
    ""
  ).toLowerCase();
}


function getRarityDisplay(item) {
  const rarity =
    getRarityKey(item);

  const map = {
    common: "Commun",
    uncommon: "Atypique",
    rare: "Rare",
    epic: "Épique",
    legendary: "Légendaire",
    mythic: "Mythique",
    marvel: "Marvel",
    icon: "Icône"
  };

  return (
    map[rarity] ||
    item?.rarity?.displayName ||
    item?.rarity?.name ||
    ""
  );
}


function getSetName(item) {
  if (!item) {
    return "";
  }

  return (
    item.set?.displayName ||
    item.set?.name ||
    item.set?.value ||
    ""
  );
}


/* =========================================================
   SECTION
   ========================================================= */

function getSectionName(entry) {
  if (!entry) {
    return "Boutique";
  }

  const section =
    entry.section;

  if (
    typeof section === "string" &&
    section.trim()
  ) {
    return section.trim();
  }

  const sectionName =
    section?.displayName ||
    section?.name ||
    section?.title;

  if (
    typeof sectionName === "string" &&
    sectionName.trim()
  ) {
    return sectionName.trim();
  }

  const series =
    entry.series?.displayName ||
    entry.series?.name;

  if (
    typeof series === "string" &&
    series.trim()
  ) {
    return series.trim();
  }

  const itemSeries =
    entry
      .items?.[0]
      ?.series?.displayName ||
    entry
      .items?.[0]
      ?.series?.name;

  if (
    typeof itemSeries === "string" &&
    itemSeries.trim()
  ) {
    return itemSeries.trim();
  }

  return "Boutique";
}


/* =========================================================
   TILE SIZE
   ========================================================= */

function getTileSize(entry) {
  if (!entry) {
    return "";
  }

  const tile =
    entry.tileSize;

  if (
    typeof tile === "string"
  ) {
    return tile;
  }

  if (
    tile &&
    typeof tile === "object"
  ) {
    return (
      tile.name ||
      tile.value ||
      ""
    );
  }

  return (
    entry.items?.[0]?.tileSize ||
    ""
  );
}


function getTileClass(entry) {
  const tile =
    String(
      getTileSize(entry)
    )
      .toLowerCase()
      .replace(/[\s-]/g, "_");

  if (
    tile.includes("size_2_x_2") ||
    tile.includes("2_x_2") ||
    tile.includes("2x2")
  ) {
    return "tile-large";
  }

  if (
    tile.includes("size_1_x_2") ||
    tile.includes("1_x_2") ||
    tile.includes("1x2")
  ) {
    return "tile-portrait";
  }

  return "tile-square";
}


/* =========================================================
   COULEURS
   ========================================================= */

function isValidCssColor(value) {
  if (
    typeof value !== "string"
  ) {
    return false;
  }

  const color =
    value.trim();

  return Boolean(
    /^#[0-9a-fA-F]{3,8}$/.test(color) ||
    /^rgba?\(/i.test(color) ||
    /^hsla?\(/i.test(color)
  );
}


function collectColors(source, colors) {
  if (!source) {
    return;
  }

  if (
    Array.isArray(source)
  ) {
    for (
      const color
      of source
    ) {
      if (
        isValidCssColor(color) &&
        !colors.includes(color)
      ) {
        colors.push(color);
      }
    }

    return;
  }

  if (
    typeof source !== "object"
  ) {
    return;
  }

  const values = [
    source.color1,
    source.color2,
    source.color3,
    source.primary,
    source.secondary,
    source.background,
    source.backgroundColor
  ];

  for (
    const color
    of values
  ) {
    if (
      isValidCssColor(color) &&
      !colors.includes(color)
    ) {
      colors.push(color);
    }
  }
}


function getEntryColors(entry) {
  const colors = [];

  collectColors(
    entry?.colors,
    colors
  );

  collectColors(
    entry?.series?.colors,
    colors
  );

  collectColors(
    entry?.background,
    colors
  );

  collectColors(
    entry?.items?.[0]?.colors,
    colors
  );

  collectColors(
    entry?.items?.[0]?.series?.colors,
    colors
  );

  collectColors(
    entry?.items?.[0]?.background,
    colors
  );

  if (colors.length >= 2) {
    return colors.slice(0, 3);
  }

  const seriesName =
    String(
      entry?.series?.displayName ||
      entry?.series?.name ||
      entry?.items?.[0]?.series?.displayName ||
      entry?.items?.[0]?.series?.name ||
      ""
    ).toLowerCase();

  if (
    seriesName.includes("kingdom hearts")
  ) {
    return [
      "#071936",
      "#163f7a",
      "#8c6cff"
    ];
  }

  if (
    seriesName.includes("disney")
  ) {
    return [
      "#061a4d",
      "#0b4da2",
      "#36a9ff"
    ];
  }

  if (
    seriesName.includes("dc")
  ) {
    return [
      "#07101f",
      "#173f68",
      "#2e78a9"
    ];
  }

  return colors.slice(0, 3);
}


/* =========================================================
   EXTRACTION
   ========================================================= */

function extractShopItem(entry) {
  if (!entry) {
    return null;
  }

  const items =
    getEntryItems(entry);

  if (
    !items.length &&
    !entry.bundle
  ) {
    return null;
  }

  const image =
    getEntryImage(entry);

  if (!image) {
    return null;
  }

  const name =
    getEntryName(entry);

  if (!name) {
    return null;
  }

  const firstItem =
    items[0] || null;

  return {
    id:
      entry.offerId ||
      entry.id ||
      firstItem?.id ||
      `${name}-${Math.random()}`,

    name,

    image,

    price:
      getEntryFinalPrice(entry),

    regularPrice:
      getEntryRegularPrice(entry),

    discount:
      getEntryDiscount(entry),

    description:
      getEntryDescription(entry),

    itemType:
      getItemType(firstItem),

    rarity:
      getRarityDisplay(firstItem),

    rarityKey:
      getRarityKey(firstItem),

    setName:
      getSetName(firstItem),

    isBundle:
      items.length > 1 ||
      Boolean(entry.bundle),

    itemCount:
      items.length,

    items,

    entry,

    sectionName:
      getSectionName(entry),

    tileSize:
      getTileSize(entry),

    tileClass:
      getTileClass(entry),

    backgroundColors:
      getEntryColors(entry),

    seriesName:
      entry.series?.displayName ||
      entry.series?.name ||
      firstItem?.series?.displayName ||
      firstItem?.series?.name ||
      ""
  };
}


/* =========================================================
   CARTE
   ========================================================= */

function createCard(item, key) {
  const price =
    formatPrice(item.price);

  const oldPrice =
    item.regularPrice !== null &&
    item.regularPrice !== item.price
      ? formatPrice(
          item.regularPrice
        )
      : "";

  const discount =
    item.discount > 0
      ? `-${item.discount}%`
      : "";

  const colors =
    item.backgroundColors || [];

  const customStyle =
    colors.length
      ? [
          `--card-color-1:${colors[0]}`,
          `--card-color-2:${colors[1] || colors[0]}`,
          `--card-color-3:${colors[2] || colors[1] || colors[0]}`
        ].join(";")
      : "";

  return `
    <article
      class="shop-card ${escapeHtml(item.tileClass)}"
      data-shop-key="${escapeHtml(key)}"
      style="${escapeHtml(customStyle)}"
      tabindex="0"
      role="button"
      aria-label="${escapeHtml(item.name)}"
    >

      <div class="card-background"></div>

      <div class="card-image-wrapper">
        <img
          class="card-image"
          src="${escapeHtml(item.image)}"
          alt="${escapeHtml(item.name)}"
          loading="lazy"
        >
      </div>

      <div class="card-gradient"></div>

      <div class="card-badges">

        ${
          discount
            ? `
              <span class="discount-badge">
                ${escapeHtml(discount)}
              </span>
            `
            : ""
        }

        ${
          item.isBundle
            ? `
              <span class="bundle-badge">
                PACK
              </span>
            `
            : ""
        }

      </div>

      <div class="card-content-overlay">

        ${
          item.itemType
            ? `
              <div class="card-type">
                ${escapeHtml(item.itemType)}
              </div>
            `
            : ""
        }

        <h3>
          ${escapeHtml(item.name)}
        </h3>

        <div class="card-price-row">

          ${
            price
              ? `
                <span class="card-price">
                  ${escapeHtml(price)}
                </span>
              `
              : ""
          }

          ${
            oldPrice
              ? `
                <span class="card-old-price">
                  ${escapeHtml(oldPrice)}
                </span>
              `
              : ""
          }

        </div>

      </div>

    </article>
  `;
}


/* =========================================================
   SECTION
   ========================================================= */

function createSection(title, items) {
  return `
    <section class="shop-section">

      <header class="shop-section-header">

        <div class="shop-section-title">

          <h2>
            ${escapeHtml(title)}
          </h2>

          <span class="shop-section-line"></span>

        </div>

        <span class="shop-section-count">
          ${items.length}
          ${items.length > 1 ? "objets" : "objet"}
        </span>

      </header>

      <div class="shop-grid">

        ${items
          .map((item) => {

            const key =
              String(
                allShopItems.indexOf(item)
              );

            shopItemsByKey.set(
              key,
              item
            );

            return createCard(
              item,
              key
            );

          })
          .join("")}

      </div>

    </section>
  `;
}


/* =========================================================
   RENDU
   ========================================================= */

function renderShop(items) {
  if (!shopGrid) {
    return;
  }

  shopItemsByKey.clear();

  allShopItems =
    items;

  const groups =
    new Map();

  for (
    const item
    of items
  ) {
    const title =
      item.sectionName ||
      "Boutique";

    if (!groups.has(title)) {
      groups.set(
        title,
        []
      );
    }

    groups
      .get(title)
      .push(item);
  }

  let html = "";

  for (
    const [title, groupItems]
    of groups
  ) {
    html +=
      createSection(
        title,
        groupItems
      );
  }

  shopGrid.innerHTML =
    html ||
    `
      <div class="empty-shop">
        Aucun objet disponible.
      </div>
    `;

  shopGrid
    .querySelectorAll(".shop-card")
    .forEach((card) => {

      const key =
        card.dataset.shopKey;

      const item =
        shopItemsByKey.get(key);

      if (!item) {
        return;
      }

      card.addEventListener(
        "click",
        () => {
          openModal(item);
        }
      );

      card.addEventListener(
        "keydown",
        (event) => {

          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();

            openModal(item);
          }

        }
      );

    });
}


/* =========================================================
   CHARGEMENT
   ========================================================= */

async function loadShop() {
  if (shopStatus) {
    shopStatus.textContent =
      "Chargement de la boutique…";
  }

  if (refreshBtn) {
    refreshBtn.disabled =
      true;
  }

  try {

    const response =
      await fetch(
        SHOP_API,
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const json =
      await response.json();

    const entries =
      json?.data?.entries || [];

    if (
      !Array.isArray(entries)
    ) {
      throw new Error(
        "Réponse API invalide."
      );
    }

    const items =
      entries
        .map(
          extractShopItem
        )
        .filter(Boolean);

    renderShop(items);

    if (shopStatus) {
      shopStatus.textContent =
        `${items.length} offres disponibles`;
    }

  } catch (error) {

    console.error(
      "Erreur Fortnite Shop :",
      error
    );

    if (shopStatus) {
      shopStatus.textContent =
        "Impossible de charger la boutique.";
    }

    if (shopGrid) {
      shopGrid.innerHTML = `
        <div class="empty-shop error-shop">
          <h2>
            Impossible de charger la boutique Fortnite.
          </h2>

          <p>
            Vérifie ta connexion puis réessaie.
          </p>

          <button
            class="retry-btn"
            type="button"
            id="retry-shop"
          >
            Réessayer
          </button>
        </div>
      `;

      document
        .getElementById("retry-shop")
        ?.addEventListener(
          "click",
          loadShop
        );
    }

  } finally {

    if (refreshBtn) {
      refreshBtn.disabled =
        false;
    }

  }
}


/* =========================================================
   PRÉCHARGEMENT
   ========================================================= */

function preloadImage(src) {
  return new Promise(
    (resolve) => {

      if (!src) {
        resolve(false);
        return;
      }

      const image =
        new Image();

      let finished = false;

      const finish =
        (success) => {

          if (finished) {
            return;
          }

          finished = true;

          resolve(success);
        };

      image.onload =
        () => finish(true);

      image.onerror =
        () => finish(false);

      image.src =
        src;

      setTimeout(
        () => finish(false),
        4000
      );
    }
  );
}


/* =========================================================
   FOND MODALE
   ========================================================= */

function getRarityGradient(item) {
  const rarity =
    getRarityKey(item);

  if (rarity.includes("legendary")) {
    return "linear-gradient(135deg,#7a3f00,#c87919,#ffb347)";
  }

  if (rarity.includes("epic")) {
    return "linear-gradient(135deg,#2b0757,#7435a8,#b66cff)";
  }

  if (rarity.includes("rare")) {
    return "linear-gradient(135deg,#063d73,#0875c9,#3ca9ff)";
  }

  if (rarity.includes("uncommon")) {
    return "linear-gradient(135deg,#145f32,#229447,#58d47b)";
  }

  if (rarity.includes("mythic")) {
    return "linear-gradient(135deg,#593400,#b87500,#ffd15c)";
  }

  if (rarity.includes("marvel")) {
    return "linear-gradient(135deg,#4b0707,#b51d1d,#ff4a4a)";
  }

  if (rarity.includes("icon")) {
    return "linear-gradient(135deg,#075b5c,#00a6a6,#63eeee)";
  }

  return "linear-gradient(135deg,#17233d,#263b63,#344d78)";
}


function getModalBackground(entry, item) {
  const colors =
    getEntryColors(entry);

  if (colors.length >= 3) {
    return `
      linear-gradient(
        135deg,
        ${colors[0]},
        ${colors[1]},
        ${colors[2]}
      )
    `;
  }

  if (colors.length >= 2) {
    return `
      linear-gradient(
        135deg,
        ${colors[0]},
        ${colors[1]}
      )
    `;
  }

  if (colors.length === 1) {
    return `
      linear-gradient(
        135deg,
        ${colors[0]},
        ${colors[0]}
      )
    `;
  }

  return getRarityGradient(item);
}


function applyModalBackground(entry, item) {
  if (!itemModal) {
    return;
  }

  const background =
    getModalBackground(
      entry,
      item
    );

  itemModal.style.setProperty(
    "--modal-bg",
    background
  );

  const content =
    itemModal.querySelector(
      ".modal-content"
    );

  if (content) {
    content.style.background =
      background;
  }

  if (modalMedia) {
    modalMedia.style.background =
      background;
  }

  if (previewTrack) {
    previewTrack.style.background =
      background;
  }
}


/* =========================================================
   MODALE — INFOS
   ========================================================= */

function updateModalInfo(item) {
  if (!item) {
    return;
  }

  if (modalTitle) {
    modalTitle.textContent =
      item.name || "";
  }

  if (modalDescription) {
    modalDescription.textContent =
      item.description || "";
  }

  if (modalPrice) {
    modalPrice.textContent =
      formatPrice(item.price);
  }
}


/* =========================================================
   IMAGE MODALE
   ========================================================= */

function setModalImage(item) {
  if (!modalImage) {
    return;
  }

  const image =
    getItemImage(item);

  if (!image) {
    modalImage.removeAttribute("src");
    return;
  }

  modalImage.src =
    image;

  modalImage.alt =
    item?.name || "";
}


/* =========================================================
   VIDÉO
   ========================================================= */

function getVideoUrl(item) {
  const entry =
    item?.entry;

  const firstItem =
    item?.items?.[0];

  const candidates = [
    entry?.video,
    entry?.videoUrl,
    entry?.videos?.[0]?.url,
    entry?.videos?.[0],
    entry?.displayAssets?.[0]?.video,
    entry?.displayAssets?.[0]?.videoUrl,

    firstItem?.video,
    firstItem?.videoUrl,
    firstItem?.videos?.[0]?.url,
    firstItem?.videos?.[0]
  ];

  for (
    const candidate
    of candidates
  ) {

    if (
      typeof candidate === "string" &&
      candidate.trim()
    ) {
      return candidate.trim();
    }

    if (
      candidate &&
      typeof candidate === "object"
    ) {

      const url =
        candidate.url ||
        candidate.src ||
        candidate.video;

      if (
        typeof url === "string" &&
        url.trim()
      ) {
        return url.trim();
      }

    }
  }

  return "";
}


function resetVideo() {
  if (!modalVideo) {
    return;
  }

  modalVideo.pause();

  modalVideo.removeAttribute(
    "src"
  );

  if (videoSource) {
    videoSource.removeAttribute(
      "src"
    );
  }

  modalVideo.load();

  modalVideo.style.display =
    "none";
}


function loadModalVideo(item) {
  if (
    !modalVideo ||
    !videoSource
  ) {
    return;
  }

  const url =
    getVideoUrl(item);

  if (!url) {
    resetVideo();
    return;
  }

  videoSource.src =
    url;

  modalVideo.style.display =
    "block";

  modalVideo.load();
}


/* =========================================================
   DOTS
   ========================================================= */

function renderCarouselDots() {
  if (!carouselDots) {
    return;
  }

  carouselDots.innerHTML = `
    <button
      type="button"
      class="preview-dot ${
        currentPreviewIndex === 0
          ? "active"
          : ""
      }"
      data-slide="0"
      aria-label="Image"
    ></button>

    <button
      type="button"
      class="preview-dot ${
        currentPreviewIndex === 1
          ? "active"
          : ""
      }"
      data-slide="1"
      aria-label="Vidéo"
    ></button>
  `;

  carouselDots
    .querySelectorAll(
      ".preview-dot"
    )
    .forEach((dot) => {

      dot.addEventListener(
        "click",
        () => {

          setPreview(
            Number(
              dot.dataset.slide
            )
          );

        }
      );

    });
}


function setPreview(index) {
  currentPreviewIndex =
    index === 1
      ? 1
      : 0;

  if (previewTrack) {
    previewTrack.style.transform =
      `translateX(-${currentPreviewIndex * 50}%)`;
  }

  if (
    currentPreviewIndex === 1 &&
    currentModalItem
  ) {
    loadModalVideo(
      currentModalItem
    );
  }

  renderCarouselDots();
}


/* =========================================================
   PACK CAROUSEL
   ========================================================= */

function renderPackCarousel(item) {
  if (!packCarousel) {
    return;
  }

  const items =
    item?.items || [];

  const isPack =
    items.length > 1 ||
    Boolean(item?.entry?.bundle);

  if (!isPack) {
    packCarousel.classList.remove(
      "visible"
    );

    packItemsContainer.innerHTML =
      "";

    return;
  }

  packCarousel.classList.add(
    "visible"
  );

  packItemsContainer.innerHTML =
    items
      .map(
        (packItem, index) => {

          const image =
            getItemImage(
              packItem
            );

          const name =
            packItem?.name ||
            "";

          if (
            !image ||
            !name
          ) {
            return "";
          }

          const type =
            getItemType(
              packItem
            );

          return `
            <button
              type="button"
              class="pack-carousel-item"
              data-pack-index="${index}"
            >

              <span class="pack-carousel-number">
                ${index + 1}/${items.length}
              </span>

              <div class="pack-carousel-image-wrap">
                <img
                  class="pack-carousel-image"
                  src="${escapeHtml(image)}"
                  alt="${escapeHtml(name)}"
                  loading="lazy"
                >
              </div>

              <div class="pack-carousel-info">

                <strong>
                  ${escapeHtml(name)}
                </strong>

                ${
                  type
                    ? `
                      <small>
                        ${escapeHtml(type)}
                      </small>
                    `
                    : ""
                }

              </div>

            </button>
          `;
        }
      )
      .join("");

  packItemsContainer
    .querySelectorAll(
      ".pack-carousel-item"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.packIndex
            );

          const selected =
            items[index];

          if (!selected) {
            return;
          }

          const selectedImage =
            getItemImage(
              selected
            );

          if (!selectedImage) {
            return;
          }

          setModalImage(
            selected
          );

          if (modalTitle) {
            modalTitle.textContent =
              selected.name || "";
          }

          if (modalPrice) {
            modalPrice.textContent =
              formatPrice(
                selected?.price?.finalPrice ??
                selected?.finalPrice
              );
          }

          applyModalBackground(
            item.entry,
            selected
          );

          currentPreviewIndex =
            0;

          if (previewTrack) {
            previewTrack.style.transform =
              "translateX(0)";
          }

          renderCarouselDots();

        }
      );

    });
}


/* =========================================================
   OUVERTURE
   ========================================================= */

async function openModal(item) {
  if (
    !item ||
    !itemModal
  ) {
    return;
  }

  const firstItem =
    item.items?.[0];

  const modalItem =
    firstItem || {
      name: item.name,
      images: {
        icon: item.image
      }
    };

  const image =
    getItemImage(
      modalItem
    ) ||
    item.image;

  if (!image) {
    return;
  }

  currentModalItem =
    item;

  currentPreviewIndex =
    0;

  applyModalBackground(
    item.entry,
    modalItem
  );

  updateModalInfo(
    item
  );

  setModalImage(
    modalItem
  );

  await preloadImage(
    image
  );

  if (
    currentModalItem !== item
  ) {
    return;
  }

  resetVideo();

  renderPackCarousel(
    item
  );

  renderCarouselDots();

  if (previewTrack) {
    previewTrack.style.transform =
      "translateX(0)";
  }

  itemModal.classList.add(
    "open"
  );

  itemModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "modal-open"
  );

  loadModalVideo(
    item
  );
}


/* =========================================================
   FERMETURE
   ========================================================= */

function closeModal() {
  if (!itemModal) {
    return;
  }

  itemModal.classList.remove(
    "open"
  );

  itemModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "modal-open"
  );

  resetVideo();

  currentModalItem =
    null;

  currentPreviewIndex =
    0;
}


if (modalClose) {
  modalClose.addEventListener(
    "click",
    closeModal
  );
}


if (itemModal) {

  const backdrop =
    itemModal.querySelector(
      ".modal-backdrop"
    );

  backdrop?.addEventListener(
    "click",
    closeModal
  );

}


document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Escape" &&
      itemModal?.classList.contains(
        "open"
      )
    ) {
      closeModal();
    }

  }
);


/* =========================================================
   SWIPE
   ========================================================= */

if (modalMedia) {

  modalMedia.addEventListener(
    "touchstart",
    (event) => {

      const touch =
        event.touches[0];

      if (!touch) {
        return;
      }

      modalTouchStartX =
        touch.clientX;

      modalTouchStartY =
        touch.clientY;

    },
    {
      passive: true
    }
  );


  modalMedia.addEventListener(
    "touchend",
    (event) => {

      const touch =
        event.changedTouches[0];

      if (!touch) {
        return;
      }

      const deltaX =
        touch.clientX -
        modalTouchStartX;

      const deltaY =
        touch.clientY -
        modalTouchStartY;

      if (
        Math.abs(deltaX) < 45
      ) {
        return;
      }

      if (
        Math.abs(deltaX) <
        Math.abs(deltaY)
      ) {
        return;
      }

      if (deltaX < 0) {
        setPreview(1);
      } else {
        setPreview(0);
      }

    },
    {
      passive: true
    }
  );

}


/* =========================================================
   PACK FLÈCHES
   ========================================================= */

packPrev?.addEventListener(
  "click",
  () => {

    packItemsContainer.scrollBy({
      left: -220,
      behavior: "smooth"
    });

  }
);


packNext?.addEventListener(
  "click",
  () => {

    packItemsContainer.scrollBy({
      left: 220,
      behavior: "smooth"
    });

  }
);


/* =========================================================
   REFRESH
   ========================================================= */

refreshBtn?.addEventListener(
  "click",
  loadShop
);


/* =========================================================
   INITIALISATION
   ========================================================= */

loadShop();