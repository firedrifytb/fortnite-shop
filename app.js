/* =========================================================
   FORTNITE SHOP
   app.js — version corrigée
   ========================================================= */

const SHOP_API =
  "https://fortnite-api.com/v2/shop?language=fr";

const COSMETIC_API =
  "https://fortnite-api.com/v2/cosmetics/br/search/ids";

const shopGrid = document.getElementById("shop-grid");
const shopStatus = document.getElementById("status");
const refreshBtn = document.getElementById("refresh-btn");

const itemModal = document.getElementById("item-modal");
const modalMedia = document.getElementById("modal-media");
const previewTrack = document.getElementById("preview-track");
const modalImage = document.getElementById("modal-image");
const modalVideo = document.getElementById("modal-video");
const videoFallback = document.getElementById("video-fallback");
const carouselDots = document.getElementById("carousel-dots");

const modalTitle = document.getElementById("modal-title");
const modalDescription = document.getElementById("modal-description");
const modalPrice = document.getElementById("modal-price");
const modalOldPrice = document.getElementById("modal-old-price");
const modalType = document.getElementById("modal-type");
const modalRarity = document.getElementById("modal-rarity");
const modalSet = document.getElementById("modal-set");
const modalClose = document.querySelector(".modal-close");

const packCarousel = document.getElementById("pack-carousel");
const packItemsContainer =
  document.getElementById("pack-items");

let allShopItems = [];
let shopItemsByKey = new Map();

let currentModalItem = null;
let currentPreviewIndex = 0;
let modalTouchStartX = 0;
let modalTouchStartY = 0;
let modalPointerStartX = 0;
let isPointerSwiping = false;

let currentVideoUrl = "";
let videoLoaded = false;


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


function getFirstValidString(...values) {
  for (const value of values) {
    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return "";
}


function formatPrice(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "";
  }

  return `${number.toLocaleString("fr-FR")} V-Bucks`;
}


function getNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


/* =========================================================
   ITEMS / PACKS
   ========================================================= */

function getEntryItems(entry) {
  if (!entry) return [];

  if (
    Array.isArray(entry.items) &&
    entry.items.length
  ) {
    return entry.items;
  }

  if (
    Array.isArray(entry.brItems) &&
    entry.brItems.length
  ) {
    return entry.brItems;
  }

  if (
    Array.isArray(entry.tracks) &&
    entry.tracks.length
  ) {
    return entry.tracks;
  }

  if (
    Array.isArray(entry.instruments) &&
    entry.instruments.length
  ) {
    return entry.instruments;
  }

  return [];
}


function isPackEntry(entry) {
  if (!entry) return false;

  const items = getEntryItems(entry);

  /*
   * IMPORTANT :
   * un pack peut avoir plusieurs items sans posséder
   * de propriété bundle.
   */
  return Boolean(
    entry.bundle ||
    items.length > 1
  );
}


/* =========================================================
   IMAGES
   ========================================================= */

function getItemImage(item) {
  if (!item) return "";

  return (
    item.images?.featured ||
    item.images?.icon ||
    item.images?.other ||
    item.images?.background ||
    ""
  );
}


function getBundleImage(entry) {
  if (!entry) return "";

  /*
   * 1. Image du bundle
   */
  const bundleImage =
    entry.bundle?.image ||
    entry.bundle?.images?.featured ||
    entry.bundle?.images?.icon ||
    entry.bundle?.images?.background;

  if (bundleImage) {
    return bundleImage;
  }

  /*
   * 2. displayAssets
   */
  const displayAsset =
    entry.displayAssets?.[0]?.url ||
    entry.displayAssets?.[0]?.image ||
    entry.displayAssets?.[0]?.images?.featured ||
    entry.displayAssets?.[0]?.images?.icon;

  if (displayAsset) {
    return displayAsset;
  }

  /*
   * 3. FALLBACK CRITIQUE :
   * premier objet du pack
   */
  const items = getEntryItems(entry);

  if (items.length > 0) {
    return (
      items[0]?.images?.featured ||
      items[0]?.images?.icon ||
      items[0]?.images?.other ||
      ""
    );
  }

  return "";
}


function getItemFeaturedImage(item) {
  if (!item) return "";

  return (
    item.images?.featured ||
    item.images?.icon ||
    ""
  );
}


function getEntryBackgroundImage(entry, firstItem) {
  return (
    entry?.background?.url ||
    entry?.background?.image ||
    entry?.images?.background ||
    entry?.displayAssets?.[0]?.background ||
    entry?.displayAssets?.[0]?.images?.background ||
    firstItem?.images?.background ||
    ""
  );
}


/* =========================================================
   NOMS
   ========================================================= */

function getEntryName(entry) {
  if (!entry) {
    return "Sans nom";
  }

  const items = getEntryItems(entry);

  /*
   * Bundle officiel
   */
  if (entry.bundle) {
    return (
      entry.bundle.name ||
      items[0]?.name ||
      entry.devName ||
      "Sans nom"
    );
  }

  /*
   * Plusieurs objets = pack
   */
  if (items.length > 1) {
    return (
      entry.bundle?.name ||
      items[0]?.name ||
      entry.devName ||
      "Sans nom"
    );
  }

  /*
   * Offre simple :
   * on prend le vrai nom de l'objet.
   */
  if (items.length === 1) {
    return (
      items[0]?.name ||
      entry.devName ||
      "Sans nom"
    );
  }

  return (
    entry.bundle?.name ||
    entry.devName ||
    "Sans nom"
  );
}


function getEntryDescription(entry) {
  const items = getEntryItems(entry);
  const firstItem = items[0];

  return (
    entry?.bundle?.description ||
    entry?.description ||
    firstItem?.description ||
    ""
  );
}


/* =========================================================
   PRIX
   ========================================================= */

function getEntryFinalPrice(entry) {
  if (!entry) return null;

  const candidates = [
    entry.finalPrice,
    entry.prices?.finalPrice,
    entry.price?.finalPrice,
    entry.bundle?.price?.finalPrice,
    entry.bundle?.finalPrice
  ];

  for (const value of candidates) {
    const number = getNumber(value);

    if (number !== null) {
      return number;
    }
  }

  return null;
}


function getEntryRegularPrice(entry) {
  if (!entry) return null;

  const candidates = [
    entry.regularPrice,
    entry.prices?.regularPrice,
    entry.price?.regularPrice,
    entry.bundle?.price?.regularPrice,
    entry.bundle?.regularPrice
  ];

  for (const value of candidates) {
    const number = getNumber(value);

    if (number !== null) {
      return number;
    }
  }

  return null;
}


function getBundleRegularPrice(entry) {
  const items = getEntryItems(entry);

  if (!items.length) {
    return null;
  }

  let total = 0;

  for (const item of items) {
    const price =
      getNumber(item?.price?.finalPrice) ??
      getNumber(item?.finalPrice) ??
      getNumber(item?.price);

    if (price !== null) {
      total += price;
    }
  }

  return total > 0 ? total : null;
}


function getEntryDiscount(entry) {
  const finalPrice = getEntryFinalPrice(entry);

  let regularPrice =
    getEntryRegularPrice(entry);

  /*
   * Pour les packs sans regularPrice,
   * on calcule la valeur cumulée des objets.
   */
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
    regularPrice <= finalPrice ||
    regularPrice <= 0
  ) {
    return 0;
  }

  return Math.round(
    ((regularPrice - finalPrice) / regularPrice) * 100
  );
}


/* =========================================================
   TYPE / RARETÉ / SET
   ========================================================= */

function getItemType(item) {
  if (!item) return "";

  return (
    item.type?.displayName ||
    item.type?.name ||
    item.type?.value ||
    item.type ||
    item.backendType ||
    ""
  );
}


function getRarityValue(item) {
  if (!item) return "";

  return (
    item.rarity?.value ||
    item.rarity?.name ||
    item.rarity?.displayName ||
    item.rarity ||
    ""
  );
}


function getRarityDisplay(item) {
  const rarity = getRarityValue(item);

  const map = {
    common: "Commun",
    uncommon: "Atypique",
    rare: "Rare",
    epic: "Épique",
    legendary: "Légendaire",
    mythic: "Mythique",
    marvel: "Marvel",
    dark: "Sombre",
    icon: "Icône",
    gaminglegends: "Gaming Legends"
  };

  const key = String(rarity).toLowerCase();

  return (
    map[key] ||
    item?.rarity?.displayName ||
    item?.rarity?.name ||
    rarity ||
    ""
  );
}


function getSetName(item) {
  if (!item) return "";

  return (
    item.set?.displayName ||
    item.set?.name ||
    item.set?.value ||
    ""
  );
}


/* =========================================================
   SECTIONS / TILE SIZE
   ========================================================= */

function getSectionName(entry, firstItem) {
  const section = entry?.section;

  const sectionName =
    typeof section === "string"
      ? section
      : getFirstValidString(
          section?.displayName,
          section?.name,
          section?.title
        );

  if (sectionName) {
    return sectionName;
  }

  const seriesName = getFirstValidString(
    entry?.series?.displayName,
    entry?.series?.name,
    entry?.series?.value,
    firstItem?.series?.displayName,
    firstItem?.series?.name,
    firstItem?.series?.value
  );

  if (seriesName) {
    return seriesName;
  }

  return "Boutique";
}


function getTileSize(entry, firstItem) {
  const tileSize =
    entry?.tileSize ||
    entry?.tileSize?.name ||
    entry?.tileSize?.value ||
    firstItem?.tileSize ||
    firstItem?.tileSize?.name ||
    firstItem?.tileSize?.value ||
    "";

  return String(tileSize);
}


function getTileClass(entry, firstItem, isBundle) {
  const tileSize =
    getTileSize(entry, firstItem)
      .toLowerCase()
      .replace(/[\s-]/g, "_");

  if (
    tileSize.includes("size_2_x_2") ||
    tileSize.includes("2_x_2") ||
    tileSize.includes("2x2")
  ) {
    return "tile-2x2";
  }

  if (
    tileSize.includes("size_1_x_2") ||
    tileSize.includes("1_x_2") ||
    tileSize.includes("1x2")
  ) {
    return "tile-1x2";
  }

  /*
   * Gros pack sans tileSize exploitable
   */
  if (
    isBundle &&
    getEntryItems(entry).length >= 4
  ) {
    return "tile-2x2";
  }

  return "tile-1x1";
}


/* =========================================================
   COULEURS / BACKGROUND
   ========================================================= */

function isValidCssColor(value) {
  if (typeof value !== "string") {
    return false;
  }

  const color = value.trim();

  if (!color) return false;

  return Boolean(
    /^#[0-9a-fA-F]{3,8}$/.test(color) ||
    /^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)$/.test(color) ||
    /^hsla?\(/i.test(color)
  );
}


function collectColors(value, result = []) {
  if (!value) {
    return result;
  }

  if (typeof value === "string") {
    if (
      isValidCssColor(value) &&
      !result.includes(value)
    ) {
      result.push(value);
    }

    return result;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      collectColors(entry, result);
    }

    return result;
  }

  if (typeof value === "object") {
    const preferredKeys = [
      "color1",
      "color2",
      "color3",
      "primary",
      "secondary",
      "background",
      "backgroundColor",
      "textBackgroundColor"
    ];

    for (const key of preferredKeys) {
      if (value[key]) {
        collectColors(value[key], result);
      }
    }
  }

  return result;
}


function getEntryColors(entry, firstItem) {
  const colors = [];

  collectColors(
    entry?.series?.colors,
    colors
  );

  collectColors(
    firstItem?.series?.colors,
    colors
  );

  collectColors(
    entry?.colors,
    colors
  );

  collectColors(
    firstItem?.colors,
    colors
  );

  return colors.slice(0, 3);
}


function getThemeKey(entry, firstItem) {
  const text = [
    entry?.section?.name,
    entry?.section?.displayName,
    entry?.series?.name,
    entry?.series?.displayName,
    firstItem?.series?.name,
    firstItem?.series?.displayName,
    firstItem?.set?.name,
    firstItem?.set?.displayName
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (text.includes("kingdom hearts")) {
    return "kingdom-hearts";
  }

  if (text.includes("disney")) {
    return "disney";
  }

  if (
    text.includes("dc") ||
    text.includes("batman") ||
    text.includes("superman")
  ) {
    return "dc";
  }

  return "";
}


function getThemeStyle(colors) {
  if (!Array.isArray(colors) || !colors.length) {
    return "";
  }

  const safeColors = colors.filter(
    isValidCssColor
  );

  if (!safeColors.length) {
    return "";
  }

  const color1 =
    safeColors[0];

  const color2 =
    safeColors[1] ||
    safeColors[0];

  const color3 =
    safeColors[2] ||
    safeColors[1] ||
    safeColors[0];

  return [
    `--card-color-1:${color1}`,
    `--card-color-2:${color2}`,
    `--card-color-3:${color3}`
  ].join(";");
}


/* =========================================================
   RARETÉ POUR LA MODALE
   ========================================================= */

function getRarityKey(item) {
  const rarity =
    item?.rarity?.value ||
    item?.rarity?.name ||
    item?.rarity?.displayName ||
    item?.rarity ||
    "";

  return String(rarity).toLowerCase();
}


function getRarityGradient(item) {
  const rarity = getRarityKey(item);

  if (
    rarity.includes("legendary") ||
    rarity.includes("légendaire")
  ) {
    return (
      "linear-gradient(135deg, " +
      "#7a3f00 0%, " +
      "#c87919 45%, " +
      "#ffb347 100%)"
    );
  }

  if (
    rarity.includes("epic") ||
    rarity.includes("épique")
  ) {
    return (
      "linear-gradient(135deg, " +
      "#32105f 0%, " +
      "#7435a8 50%, " +
      "#b66cff 100%)"
    );
  }

  if (rarity.includes("rare")) {
    return (
      "linear-gradient(135deg, " +
      "#063d73 0%, " +
      "#0875c9 50%, " +
      "#3ca9ff 100%)"
    );
  }

  if (
    rarity.includes("uncommon") ||
    rarity.includes("atypique")
  ) {
    return (
      "linear-gradient(135deg, " +
      "#145f32 0%, " +
      "#229447 50%, " +
      "#58d47b 100%)"
    );
  }

  if (
    rarity.includes("mythic") ||
    rarity.includes("mythique")
  ) {
    return (
      "linear-gradient(135deg, " +
      "#593400 0%, " +
      "#b87500 45%, " +
      "#ffd15c 100%)"
    );
  }

  if (
    rarity.includes("marvel")
  ) {
    return (
      "linear-gradient(135deg, " +
      "#540b0b 0%, " +
      "#b51d1d 50%, " +
      "#ff4a4a 100%)"
    );
  }

  if (
    rarity.includes("icon") ||
    rarity.includes("icône")
  ) {
    return (
      "linear-gradient(135deg, " +
      "#075b5c 0%, " +
      "#00a6a6 50%, " +
      "#63eeee 100%)"
    );
  }

  return (
    "linear-gradient(135deg, " +
    "#17233d 0%, " +
    "#263b63 50%, " +
    "#344d78 100%)"
  );
}


function getSeriesColors(entry, item) {
  const colors =
    entry?.series?.colors ||
    item?.series?.colors ||
    entry?.colors ||
    item?.colors;

  if (!colors) {
    return [];
  }

  if (Array.isArray(colors)) {
    return colors.filter(Boolean);
  }

  return [
    colors.color1,
    colors.color2,
    colors.color3,
    colors.primary,
    colors.secondary,
    colors.background
  ].filter(Boolean);
}


function getModalBackground(entry, item) {
  const seriesColors =
    getSeriesColors(entry, item)
      .filter(isValidCssColor);

  if (seriesColors.length >= 2) {
    return (
      `linear-gradient(135deg, ` +
      `${seriesColors[0]}, ` +
      `${seriesColors[1]})`
    );
  }

  if (seriesColors.length === 1) {
    return (
      `linear-gradient(135deg, ` +
      `${seriesColors[0]}, ` +
      `${seriesColors[0]})`
    );
  }

  return getRarityGradient(item);
}


/* =========================================================
   EXTRACTION D'UNE OFFRE
   ========================================================= */

function extractShopItem(entry) {
  const items =
    getEntryItems(entry);

  const firstItem =
    items[0] || null;

  const isBundle =
    isPackEntry(entry);

  const image =
    getBundleImage(entry) ||
    getItemImage(firstItem);

  const name =
    getEntryName(entry);

  const finalPrice =
    getEntryFinalPrice(entry);

  const regularPrice =
    getEntryRegularPrice(entry);

  const discount =
    getEntryDiscount(entry);

  return {
    id:
      entry.offerId ||
      entry.id ||
      firstItem?.id ||
      crypto.randomUUID(),

    name,

    image,

    price: finalPrice,

    regularPrice,

    discount,

    description:
      getEntryDescription(entry),

    itemType:
      getItemType(firstItem) ||
      "Objet",

    rarity:
      getRarityDisplay(firstItem),

    rarityKey:
      getRarityKey(firstItem),

    setName:
      getSetName(firstItem),

    isBundle,

    itemCount:
      items.length,

    /*
     * IMPORTANT :
     * on garde TOUS les objets.
     */
    items,

    entry,

    sectionName:
      getSectionName(
        entry,
        firstItem
      ),

    tileSize:
      getTileSize(
        entry,
        firstItem
      ),

    tileClass:
      getTileClass(
        entry,
        firstItem,
        isBundle
      ),

    backgroundImage:
      getEntryBackgroundImage(
        entry,
        firstItem
      ),

    backgroundColors:
      getEntryColors(
        entry,
        firstItem
      ),

    themeKey:
      getThemeKey(
        entry,
        firstItem
      ),

    seriesName:
      getFirstValidString(
        entry?.series?.displayName,
        entry?.series?.name,
        entry?.series?.value,
        firstItem?.series?.displayName,
        firstItem?.series?.name,
        firstItem?.series?.value
      )
  };
}


/* =========================================================
   CATÉGORIE DE SECOURS
   ========================================================= */

function getCategoryName(item) {
  const type =
    String(
      item?.itemType || ""
    ).toLowerCase();

  if (
    type.includes("outfit") ||
    type.includes("tenue") ||
    type.includes("skin")
  ) {
    return "Tenues";
  }

  if (
    type.includes("pickaxe") ||
    type.includes("pioche")
  ) {
    return "Pioche";
  }

  if (
    type.includes("glider") ||
    type.includes("planeur")
  ) {
    return "Planeurs";
  }

  if (
    type.includes("wrap") ||
    type.includes("revêtement")
  ) {
    return "Revêtements";
  }

  if (
    type.includes("emote") ||
    type.includes("danse")
  ) {
    return "Danses";
  }

  if (
    type.includes("backpack") ||
    type.includes("back bling") ||
    type.includes("accessoire")
  ) {
    return "Accessoires";
  }

  return "Autres";
}


/* =========================================================
   CARTES
   ========================================================= */

function createCard(item, key) {
  const price =
    formatPrice(item.price);

  const oldPrice =
    item.regularPrice !== null &&
    item.regularPrice !== item.price
      ? formatPrice(item.regularPrice)
      : "";

  const discount =
    item.discount > 0
      ? `-${item.discount}%`
      : "";

  const image =
    item.image || "";

  const fallbackImage =
    getItemImage(item.items?.[0]);

  const background =
    item.backgroundImage || "";

  const themeClass =
    item.themeKey
      ? `theme-${item.themeKey}`
      : "";

  const customStyle =
    getThemeStyle(
      item.backgroundColors
    );

  const type =
    item.isBundle
      ? `${item.itemCount} objets`
      : item.itemType;

  return `
    <article
      class="shop-card ${item.tileClass} ${themeClass}"
      data-shop-key="${escapeHtml(key)}"
      style="${escapeHtml(customStyle)}"
      tabindex="0"
      role="button"
      aria-label="${escapeHtml(item.name)}"
    >
      ${
        background
          ? `
            <img
              class="card-background"
              src="${escapeHtml(background)}"
              alt=""
              aria-hidden="true"
              loading="lazy"
            >
          `
          : ""
      }

      <div class="card-background-color"></div>

      <div class="card-image-wrapper">
        ${
          image
            ? `
              <img
                class="card-image"
                src="${escapeHtml(image)}"
                data-fallback="${escapeHtml(fallbackImage)}"
                alt="${escapeHtml(item.name)}"
                loading="lazy"
              >
            `
            : `
              <div class="card-image-missing">
                Image indisponible
              </div>
            `
        }
      </div>

      <div class="card-gradient"></div>

      <div class="card-badges">
        ${
          discount
            ? `
              <span class="discount-badge">
                ${discount}
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
          type
            ? `
              <div class="card-type">
                ${escapeHtml(type)}
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
   SECTIONS
   ========================================================= */

function createSection(title, items) {
  const sectionId =
    `section-${Math.random()
      .toString(36)
      .slice(2)}`;

  return `
    <section
      class="shop-section"
      id="${sectionId}"
    >
      <div class="shop-section-header">
        <div>
          <h2>
            ${escapeHtml(title)}
          </h2>

          <span class="shop-section-count">
            ${items.length}
            ${items.length > 1 ? "objets" : "objet"}
          </span>
        </div>
      </div>

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
   RENDU SHOP
   ========================================================= */

function renderShop(items) {
  if (!shopGrid) return;

  shopItemsByKey.clear();

  allShopItems = items;

  /*
   * Groupement par section officielle.
   * Si l'API ne donne pas de section,
   * on utilise la catégorie comme secours.
   */
  const groups =
    new Map();

  for (const item of items) {
    const title =
      item.sectionName ||
      getCategoryName(item);

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

  for (const [
    title,
    groupItems
  ] of groups) {
    html += createSection(
      title,
      groupItems
    );
  }

  shopGrid.innerHTML =
    html ||
    `
      <div class="empty-shop">
        Aucun objet trouvé.
      </div>
    `;

  /*
   * Fallback images.
   */
  const images =
    shopGrid.querySelectorAll(
      ".card-image"
    );

  images.forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        const fallback =
          img.dataset.fallback;

        if (
          fallback &&
          img.src !== fallback
        ) {
          img.src = fallback;
          return;
        }

        img.style.display =
          "none";

        const parent =
          img.parentElement;

        if (parent) {
          parent.innerHTML =
            `
              <div class="card-image-missing">
                Image indisponible
              </div>
            `;
        }
      },
      {
        once: true
      }
    );
  });

  /*
   * Ouverture des modales.
   */
  const cards =
    shopGrid.querySelectorAll(
      ".shop-card"
    );

  cards.forEach((card) => {
    const key =
      card.dataset.shopKey;

    const item =
      shopItemsByKey.get(key);

    if (!item) return;

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
   CHARGEMENT SHOP
   ========================================================= */

async function loadShop() {
  if (shopStatus) {
    shopStatus.textContent =
      "Chargement de la boutique…";
  }

  if (refreshBtn) {
    refreshBtn.disabled = true;
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
      json?.data?.entries ||
      json?.data?.shop ||
      json?.data ||
      [];

    if (!Array.isArray(entries)) {
      throw new Error(
        "Format de réponse invalide."
      );
    }

    const items =
      entries
        .map(extractShopItem)
        .filter(
          (item) =>
            item &&
            (
              item.image ||
              item.items.length ||
              item.name
            )
        );

    renderShop(items);

    if (shopStatus) {
      shopStatus.textContent =
        `${items.length} offres disponibles`;
    }
  } catch (error) {
    console.error(
      "Erreur boutique Fortnite :",
      error
    );

    if (shopStatus) {
      shopStatus.textContent =
        "Impossible de charger la boutique.";
    }

    if (shopGrid) {
      shopGrid.innerHTML = `
        <div class="empty-shop error">
          Impossible de charger la boutique Fortnite.
          <br>
          <small>
            Vérifie ta connexion puis réessaie.
          </small>
        </div>
      `;
    }
  } finally {
    if (refreshBtn) {
      refreshBtn.disabled = false;
    }
  }
}


/* =========================================================
   MODALE — INFORMATIONS
   ========================================================= */

function updateModalInfo(item) {
  if (!item) return;

  if (modalTitle) {
    modalTitle.textContent =
      item.name;
  }

  if (modalDescription) {
    modalDescription.textContent =
      item.description || "";
  }

  if (modalType) {
    modalType.textContent =
      item.itemType || "";
  }

  if (modalRarity) {
    modalRarity.textContent =
      item.rarity || "";
  }

  if (modalSet) {
    modalSet.textContent =
      item.setName || "";
  }

  if (modalPrice) {
    modalPrice.textContent =
      formatPrice(item.price);
  }

  if (modalOldPrice) {
    if (
      item.regularPrice !== null &&
      item.regularPrice !== item.price
    ) {
      modalOldPrice.textContent =
        formatPrice(
          item.regularPrice
        );

      modalOldPrice.style.display =
        "";
    } else {
      modalOldPrice.textContent =
        "";

      modalOldPrice.style.display =
        "none";
    }
  }
}


/* =========================================================
   MODALE — IMAGE
   ========================================================= */

function setModalImage(item) {
  if (!modalImage) return;

  const image =
    getItemFeaturedImage(item) ||
    getItemImage(item);

  if (!image) {
    modalImage.removeAttribute(
      "src"
    );

    modalImage.style.display =
      "none";

    return;
  }

  modalImage.src = image;
  modalImage.alt =
    item?.name || "";

  modalImage.style.display =
    "";
}


/* =========================================================
   MODALE — VIDÉO
   ========================================================= */

function getVideoFromObject(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return (
      value.url ||
      value.src ||
      value.video ||
      value.mp4 ||
      ""
    );
  }

  return "";
}


function getVideoUrl(item) {
  const entry =
    item?.entry;

  const cosmetic =
    item?.items?.[0];

  const candidates = [
    entry?.videos?.[0],
    entry?.video,
    entry?.videoUrl,
    entry?.displayAssets?.[0]?.video,
    entry?.displayAssets?.[0]?.videoUrl,
    entry?.displayAssets?.[0]?.urlVideo,

    cosmetic?.videos?.[0],
    cosmetic?.video,
    cosmetic?.videoUrl
  ];

  for (const candidate of candidates) {
    const url =
      getVideoFromObject(
        candidate
      );

    if (
      url &&
      /^https?:\/\//i.test(url)
    ) {
      return url;
    }
  }

  return "";
}


function resetVideo() {
  videoLoaded = false;

  if (!modalVideo) return;

  modalVideo.pause();

  modalVideo.removeAttribute(
    "src"
  );

  modalVideo.load();

  modalVideo.style.display =
    "none";
}


function loadModalVideo(item) {
  if (!modalVideo) {
    return false;
  }

  const videoUrl =
    getVideoUrl(item);

  currentVideoUrl =
    videoUrl;

  if (!videoUrl) {
    resetVideo();

    if (videoFallback) {
      videoFallback.style.display =
        "";
    }

    return false;
  }

  if (videoFallback) {
    videoFallback.style.display =
      "none";
  }

  videoLoaded = false;

  modalVideo.src =
    videoUrl;

  modalVideo.style.display =
    "";

  modalVideo.onloadeddata =
    () => {
      videoLoaded = true;

      if (videoFallback) {
        videoFallback.style.display =
          "none";
      }
    };

  modalVideo.onerror =
    () => {
      videoLoaded = false;

      modalVideo.style.display =
        "none";

      if (videoFallback) {
        videoFallback.style.display =
          "";
      }
    };

  modalVideo.load();

  return true;
}


/* =========================================================
   CAROUSEL DE LA MODALE
   ========================================================= */

function renderCarouselDots() {
  if (!carouselDots) return;

  /*
   * Toujours deux slides :
   * 1 = image
   * 2 = vidéo / fallback
   *
   * Même lorsqu'il n'y a pas de vidéo,
   * le swipe reste disponible.
   */
  carouselDots.innerHTML = `
    <button
      type="button"
      class="carousel-dot ${
        currentPreviewIndex === 0
          ? "active"
          : ""
      }"
      data-slide="0"
      aria-label="Afficher l'image"
    ></button>

    <button
      type="button"
      class="carousel-dot ${
        currentPreviewIndex === 1
          ? "active"
          : ""
      }"
      data-slide="1"
      aria-label="Afficher la vidéo"
    ></button>
  `;

  carouselDots
    .querySelectorAll(
      ".carousel-dot"
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
    index <= 0
      ? 0
      : 1;

  if (previewTrack) {
    previewTrack.style.transform =
      `translateX(-${currentPreviewIndex * 50}%)`;
  }

  if (
    currentPreviewIndex === 1 &&
    currentModalItem
  ) {
    if (!videoLoaded) {
      loadModalVideo(
        currentModalItem
      );
    }
  }

  renderCarouselDots();
}


/* =========================================================
   CAROUSEL DES OBJETS D'UN PACK
   ========================================================= */

function renderPackCarousel(item) {
  if (!packCarousel) return;

  const items =
    item?.items || [];

  const isPack =
    Boolean(
      item?.isBundle ||
      items.length > 1
    );

  if (!isPack) {
    packCarousel.style.display =
      "none";

    if (packItemsContainer) {
      packItemsContainer.innerHTML =
        "";
    }

    return;
  }

  packCarousel.style.display =
    "";

  if (!packItemsContainer) {
    return;
  }

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
            `Objet ${index + 1}`;

          const type =
            getItemType(
              packItem
            );

          return `
            <button
              type="button"
              class="pack-item"
              data-pack-index="${index}"
            >
              <div class="pack-item-image">
                ${
                  image
                    ? `
                      <img
                        src="${escapeHtml(image)}"
                        alt="${escapeHtml(name)}"
                        loading="lazy"
                      >
                    `
                    : `
                      <span>
                        Image indisponible
                      </span>
                    `
                }
              </div>

              <div class="pack-item-number">
                ${index + 1}/${items.length}
              </div>

              <div class="pack-item-name">
                ${escapeHtml(name)}
              </div>

              ${
                type
                  ? `
                    <div class="pack-item-type">
                      ${escapeHtml(type)}
                    </div>
                  `
                  : ""
              }
            </button>
          `;
        }
      )
      .join("");

  packItemsContainer
    .querySelectorAll(
      ".pack-item"
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

          if (!selected) return;

          setModalImage(
            selected
          );

          /*
           * Le fond de la modale suit
           * maintenant l'objet sélectionné.
           */
          applyModalBackground(
            item.entry,
            selected
          );

          if (modalTitle) {
            modalTitle.textContent =
              selected.name ||
              item.name;
          }

          if (modalType) {
            modalType.textContent =
              getItemType(
                selected
              );
          }

          if (modalRarity) {
            modalRarity.textContent =
              getRarityDisplay(
                selected
              );
          }

          if (modalSet) {
            modalSet.textContent =
              getSetName(
                selected
              );
          }

          setPreview(0);
        }
      );
    });
}


/* =========================================================
   FOND DE LA MODALE
   ========================================================= */

function applyModalBackground(
  entry,
  item
) {
  const background =
    getModalBackground(
      entry,
      item
    );

  /*
   * Plusieurs sélecteurs pour rester compatible
   * avec la structure actuelle de ta modale.
   */
  const targets = [
    modalMedia,
    previewTrack,
    itemModal?.querySelector(
      ".modal-content"
    ),
    itemModal?.querySelector(
      ".modal-preview"
    ),
    itemModal?.querySelector(
      ".preview-stage"
    )
  ].filter(Boolean);

  targets.forEach((element) => {
    element.style.background =
      background;
  });

  /*
   * Si le conteneur possède une variable CSS,
   * on la met aussi à jour.
   */
  targets.forEach((element) => {
    element.style.setProperty(
      "--modal-bg",
      background
    );
  });
}


/* =========================================================
   OUVERTURE MODALE
   ========================================================= */

function openModal(item) {
  if (!item || !itemModal) {
    return;
  }

  currentModalItem =
    item;

  currentPreviewIndex =
    0;

  videoLoaded =
    false;

  currentVideoUrl =
    "";

  updateModalInfo(
    item
  );

  /*
   * Fond dynamique :
   * série API -> rareté -> fallback.
   */
  const firstItem =
    item.items?.[0] ||
    null;

  applyModalBackground(
    item.entry,
    firstItem
  );

  /*
   * Image principale.
   */
  setModalImage(
    firstItem ||
    item
  );

  /*
   * Vidéo.
   */
  resetVideo();

  loadModalVideo(
    item
  );

  /*
   * Pack.
   */
  renderPackCarousel(
    item
  );

  /*
   * Carousel image / vidéo.
   */
  setPreview(0);

  if (itemModal) {
    itemModal.classList.add(
      "open"
    );

    itemModal.setAttribute(
      "aria-hidden",
      "false"
    );
  }

  document.body.classList.add(
    "modal-open"
  );
}


/* =========================================================
   FERMETURE MODALE
   ========================================================= */

function closeModal() {
  if (!itemModal) return;

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

  currentVideoUrl =
    "";

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
  itemModal.addEventListener(
    "click",
    (event) => {
      /*
       * Fermer uniquement si on clique
       * sur l'arrière-plan de la modale.
       */
      if (
        event.target ===
        itemModal
      ) {
        closeModal();
      }
    }
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
   SWIPE — TOUCH
   ========================================================= */

if (modalMedia) {
  modalMedia.addEventListener(
    "touchstart",
    (event) => {
      const touch =
        event.touches[0];

      if (!touch) return;

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

      if (!touch) return;

      const deltaX =
        touch.clientX -
        modalTouchStartX;

      const deltaY =
        touch.clientY -
        modalTouchStartY;

      /*
       * On privilégie les gestes horizontaux.
       */
      if (
        Math.abs(deltaX) <
        45
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
   SWIPE — POINTER EVENTS
   ========================================================= */

if (modalMedia) {
  modalMedia.addEventListener(
    "pointerdown",
    (event) => {
      if (
        event.pointerType ===
        "mouse"
      ) {
        return;
      }

      modalPointerStartX =
        event.clientX;

      isPointerSwiping =
        true;
    }
  );


  modalMedia.addEventListener(
    "pointerup",
    (event) => {
      if (!isPointerSwiping) {
        return;
      }

      isPointerSwiping =
        false;

      const deltaX =
        event.clientX -
        modalPointerStartX;

      if (
        Math.abs(deltaX) <
        45
      ) {
        return;
      }

      if (deltaX < 0) {
        setPreview(1);
      } else {
        setPreview(0);
      }
    }
  );


  modalMedia.addEventListener(
    "pointercancel",
    () => {
      isPointerSwiping =
        false;
    }
  );
}


/* =========================================================
   VIDÉO : CONTRÔLES
   ========================================================= */

if (modalVideo) {
  modalVideo.addEventListener(
    "play",
    () => {
      videoLoaded = true;
    }
  );

  modalVideo.addEventListener(
    "loadeddata",
    () => {
      videoLoaded = true;

      if (videoFallback) {
        videoFallback.style.display =
          "none";
      }
    }
  );

  modalVideo.addEventListener(
    "error",
    () => {
      videoLoaded = false;

      modalVideo.style.display =
        "none";

      if (videoFallback) {
        videoFallback.style.display =
          "";
      }
    }
  );
}


/* =========================================================
   REFRESH
   ========================================================= */

if (refreshBtn) {
  refreshBtn.addEventListener(
    "click",
    () => {
      loadShop();
    }
  );
}


/* =========================================================
   INITIALISATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    loadShop();
  }
);


/*
 * Dans certains cas le script est chargé
 * avec defer ou après le DOMContentLoaded.
 * On vérifie donc également immédiatement.
 */
if (
  document.readyState ===
  "interactive" ||
  document.readyState ===
  "complete"
) {
  loadShop();
}