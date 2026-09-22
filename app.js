/* =========================================================
   FORTNITE SHOP
   Interface inchangée
   Packs : pleine largeur + image de regroupement
   ========================================================= */

const SHOP_APIS = [
  "https://raw.githubusercontent.com/Fortnite-Datamining/Fortnite-Datamining/main/data/shop/current.json",
  "https://fortnite-api.com/v2/shop?language=fr"
];


/* =========================================================
   DOM
   ========================================================= */

const shopGrid = document.getElementById("shop");
const shopStatus = document.getElementById("shop-status");
const refreshBtn = document.getElementById("refresh-shop");

const itemModal = document.getElementById("item-modal");
const modalMedia = document.querySelector(".modal-media");
const previewTrack = document.getElementById("preview-track");

const modalImage = document.getElementById("preview-image");
const modalVideo = document.getElementById("preview-video");
const videoSource = document.getElementById("preview-video-source");

const carouselDots = document.getElementById("preview-dots");

const modalTitle = document.getElementById("modal-name");
const modalDescription = document.getElementById("modal-description");
const modalPrice = document.getElementById("modal-price");
const modalClose = document.getElementById("modal-close");

const packCarousel = document.getElementById("pack-carousel");
const packItemsContainer =
  document.getElementById("pack-carousel-track");

const packPrev = document.getElementById("pack-carousel-prev");
const packNext = document.getElementById("pack-carousel-next");


/* =========================================================
   ÉTAT
   ========================================================= */

let allShopItems = [];
const shopItemsByKey = new Map();

let currentModalItem = null;
let currentPreviewIndex = 0;

let modalTouchStartX = 0;
let modalTouchStartY = 0;


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

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


function formatPrice(value) {
  const number = getNumber(value);

  if (number === null) {
    return "";
  }

  return number.toLocaleString("fr-FR") + " V-Bucks";
}


/* =========================================================
   RÉCUPÉRATION DES ENTRÉES
   ========================================================= */

function getShopEntries(json) {
  if (!json) {
    return [];
  }

  if (
    json.data &&
    Array.isArray(json.data.entries)
  ) {
    return json.data.entries;
  }

  if (
    json.data &&
    Array.isArray(json.data.storefronts)
  ) {
    const entries = [];

    for (const storefront of json.data.storefronts) {
      if (
        Array.isArray(storefront.catalogEntries)
      ) {
        entries.push(
          ...storefront.catalogEntries
        );
      }
    }

    if (entries.length) {
      return entries;
    }
  }

  if (Array.isArray(json.entries)) {
    return json.entries;
  }

  if (Array.isArray(json)) {
    return json;
  }

  return [];
}


/* =========================================================
   OBJETS D'UNE OFFRE
   ========================================================= */

function getEntryItems(entry) {
  if (!entry) {
    return [];
  }

  if (Array.isArray(entry.brItems)) {
    return entry.brItems;
  }

  if (Array.isArray(entry.items)) {
    return entry.items;
  }

  if (Array.isArray(entry.itemGrants)) {
    return entry.itemGrants;
  }

  if (
    entry.item &&
    typeof entry.item === "object"
  ) {
    return [entry.item];
  }

  return [];
}


function isPackEntry(entry) {
  const items = getEntryItems(entry);

  return (
    items.length > 1 ||
    Boolean(entry?.bundle) ||
    Boolean(entry?.bundleName) ||
    Boolean(entry?.bundleDisplayName)
  );
}


/* =========================================================
   IMAGE DE REGROUPEMENT DU PACK
   ========================================================= */

function getPackImage(entry) {
  if (!entry) {
    return "";
  }

  /*
    C'est le visuel de regroupement Fortnite.

    Pour les gros packs, on privilégie TOUJOURS
    le RenderImage du newDisplayAsset.
  */

  const renderImages =
    entry.newDisplayAsset?.renderImages;

  if (Array.isArray(renderImages)) {
    for (const render of renderImages) {
      const image =
        render?.image;

      if (
        typeof image === "string" &&
        image.trim()
      ) {
        return image.trim();
      }
    }
  }

  /*
    Ancien format : Background du material instance
  */

  const background =
    entry.newDisplayAsset
      ?.materialInstances?.[0]
      ?.images?.Background;

  if (
    typeof background === "string" &&
    background.trim()
  ) {
    return background.trim();
  }

  /*
    Autre ancien format de DisplayAsset
  */

  const displayAsset =
    entry.displayAssets?.[0]?.url;

  if (
    typeof displayAsset === "string" &&
    displayAsset.trim()
  ) {
    return displayAsset.trim();
  }

  return "";
}


/* =========================================================
   IMAGES
   ========================================================= */

function getEntryImage(entry) {
  if (!entry) {
    return "";
  }

  /*
    SI C'EST UN PACK :
    priorité absolue au visuel regroupé.
  */

  if (isPackEntry(entry)) {
    const packImage =
      getPackImage(entry);

    if (packImage) {
      return packImage;
    }
  }

  /*
    Nouveau format Datamining
  */

  const renderImage =
    entry.newDisplayAsset
      ?.renderImages?.[0]
      ?.image;

  if (
    typeof renderImage === "string" &&
    renderImage.trim()
  ) {
    return renderImage.trim();
  }

  /*
    Background
  */

  const background =
    entry.newDisplayAsset
      ?.materialInstances?.[0]
      ?.images?.Background;

  if (
    typeof background === "string" &&
    background.trim()
  ) {
    return background.trim();
  }

  /*
    Display Asset
  */

  const displayAsset =
    entry.displayAssets?.[0]?.url;

  if (
    typeof displayAsset === "string" &&
    displayAsset.trim()
  ) {
    return displayAsset.trim();
  }

  /*
    Item individuel
  */

  const item =
    getEntryItems(entry)[0];

  const icon =
    item?.images?.icon;

  if (
    typeof icon === "string" &&
    icon.trim()
  ) {
    return icon.trim();
  }

  const featured =
    item?.images?.featured;

  if (
    typeof featured === "string" &&
    featured.trim()
  ) {
    return featured.trim();
  }

  const smallIcon =
    item?.images?.smallIcon;

  if (
    typeof smallIcon === "string" &&
    smallIcon.trim()
  ) {
    return smallIcon.trim();
  }

  return "";
}


function getItemImage(item) {
  if (!item) {
    return "";
  }

  return (
    item.images?.featured ||
    item.images?.icon ||
    item.images?.smallIcon ||
    item.image ||
    ""
  );
}


/* =========================================================
   NOM
   ========================================================= */

function getEntryName(entry) {
  const item =
    getEntryItems(entry)[0];

  return (
    entry?.bundle?.name ||
    entry?.bundleDisplayName ||
    entry?.bundleName ||
    entry?.title ||
    entry?.displayName ||
    item?.name ||
    entry?.name ||
    "Objet Fortnite"
  );
}


/* =========================================================
   DESCRIPTION
   ========================================================= */

function getEntryDescription(entry) {
  const item =
    getEntryItems(entry)[0];

  return (
    entry?.description ||
    entry?.bundle?.description ||
    item?.description ||
    ""
  );
}


/* =========================================================
   PRIX
   ========================================================= */

function getEntryFinalPrice(entry) {
  return (
    getNumber(entry?.finalPrice) ??
    getNumber(entry?.prices?.finalPrice) ??
    getNumber(entry?.price?.finalPrice) ??
    getNumber(entry?.bundle?.finalPrice) ??
    null
  );
}


function getEntryRegularPrice(entry) {
  return (
    getNumber(entry?.regularPrice) ??
    getNumber(entry?.prices?.regularPrice) ??
    getNumber(entry?.price?.regularPrice) ??
    getNumber(entry?.bundle?.regularPrice) ??
    null
  );
}


function getBundleRegularPrice(entry) {
  const items =
    getEntryItems(entry);

  if (!items.length) {
    return null;
  }

  let total = 0;

  for (const item of items) {
    const price =
      getNumber(item?.finalPrice) ??
      getNumber(item?.regularPrice) ??
      getNumber(item?.price?.finalPrice) ??
      getNumber(item?.price);

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
    ((regularPrice - finalPrice) /
      regularPrice) *
      100
  );
}


/* =========================================================
   TYPE / RARETÉ / SET
   ========================================================= */

function getItemType(item) {
  return (
    item?.type?.displayValue ||
    item?.type?.displayName ||
    item?.type?.value ||
    item?.type ||
    ""
  );
}


function getRarityKey(item) {
  return String(
    item?.rarity?.value ||
    item?.rarity?.name ||
    item?.rarity?.displayValue ||
    ""
  ).toLowerCase();
}


function getRarityDisplay(item) {
  return (
    item?.rarity?.displayValue ||
    item?.rarity?.name ||
    item?.rarity?.value ||
    ""
  );
}


function getSetName(item) {
  return (
    item?.set?.value ||
    item?.set?.name ||
    item?.set?.displayName ||
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

  const layoutName =
    entry.layout?.name;

  if (
    typeof layoutName === "string" &&
    layoutName.trim()
  ) {
    return layoutName.trim();
  }

  const layoutCategory =
    entry.layout?.category;

  if (
    typeof layoutCategory === "string" &&
    layoutCategory.trim()
  ) {
    return layoutCategory.trim();
  }

  const series =
    entry.series?.displayName ||
    entry.series?.name ||
    entry.brItems?.[0]?.series?.value;

  if (
    typeof series === "string" &&
    series.trim()
  ) {
    return series.trim();
  }

  return "Boutique";
}


/* =========================================================
   TILE SIZE
   ========================================================= */

function getTileSize(entry) {
  return (
    entry?.tileSize ||
    entry?.layout?.tileSize ||
    ""
  );
}


/*
  IMPORTANT :

  Un pack de plusieurs objets devient
  automatiquement un SUPER PACK horizontal.

  On garde les autres cartes avec leur
  taille normale.
*/

function getTileClass(entry) {
  if (isPackEntry(entry)) {
    return "tile-pack";
  }

  const tile =
    String(getTileSize(entry))
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
  return (
    typeof value === "string" &&
    (
      /^#[0-9a-fA-F]{3,8}$/.test(value) ||
      /^rgba?\(/i.test(value) ||
      /^hsla?\(/i.test(value)
    )
  );
}


function convertFortniteColor(value) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  let color =
    value.trim();

  if (
    /^[0-9a-fA-F]{8}$/.test(color)
  ) {
    color =
      "#" + color.slice(0, 6);
  }

  if (
    /^[0-9a-fA-F]{6}$/.test(color)
  ) {
    color =
      "#" + color;
  }

  return isValidCssColor(color)
    ? color
    : null;
}


function collectColors(source, colors) {
  if (!source) {
    return;
  }

  if (Array.isArray(source)) {
    for (const value of source) {
      const color =
        convertFortniteColor(value);

      if (
        color &&
        !colors.includes(color)
      ) {
        colors.push(color);
      }
    }

    return;
  }

  if (typeof source !== "object") {
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

  for (const value of values) {
    const color =
      convertFortniteColor(value);

    if (
      color &&
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
    entry?.brItems?.[0]?.series?.colors,
    colors
  );

  return colors.slice(0, 3);
}


/* =========================================================
   EXTRACTION
   ========================================================= */

function extractShopItem(entry) {
  const items =
    getEntryItems(entry);

  if (!items.length) {
    return null;
  }

  const firstItem =
    items[0];

  const image =
    getEntryImage(entry);

  const name =
    getEntryName(entry);

  if (!name) {
    return null;
  }

  return {
    id:
      entry.offerId ||
      firstItem.id ||
      name,

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
      isPackEntry(entry),

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
      firstItem?.series?.value ||
      entry?.series?.value ||
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
      ? formatPrice(item.regularPrice)
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

  /*
    Pour un pack, item.image est déjà
    l'image de regroupement.
  */

  const image =
    item.image ||
    getItemImage(item.items?.[0]);

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

        ${
          image
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
                ${escapeHtml(
                  item.isBundle
                    ? "Pack"
                    : item.itemType
                )}
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

  for (const item of items) {
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

  for (const [title, groupItems] of groups) {
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
        () => openModal(item)
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
   FETCH ROBUSTE
   ========================================================= */

async function fetchJson(url) {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      15000
    );

  try {
    const separator =
      url.includes("?")
        ? "&"
        : "?";

    const response =
      await fetch(
        `${url}${separator}cb=${Date.now()}`,
        {
          cache: "no-store",
          signal: controller.signal,
          headers: {
            "Accept": "application/json"
          }
        }
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    return await response.json();

  } finally {
    clearTimeout(timeout);
  }
}


/* =========================================================
   CHARGEMENT DE LA BOUTIQUE
   ========================================================= */

async function loadShop() {
  if (shopStatus) {
    shopStatus.textContent =
      "Chargement de la boutique…";
  }

  if (refreshBtn) {
    refreshBtn.disabled = true;
  }

  if (shopGrid) {
    shopGrid.innerHTML = "";
  }

  let lastError = null;

  try {

    for (
      let sourceIndex = 0;
      sourceIndex < SHOP_APIS.length;
      sourceIndex++
    ) {

      const api =
        SHOP_APIS[sourceIndex];

      try {

        console.log(
          "Tentative boutique :",
          api
        );

        const json =
          await fetchJson(api);

        console.log(
          "JSON reçu :",
          json
        );

        const entries =
          getShopEntries(json);

        console.log(
          "Entrées détectées :",
          entries.length
        );

        if (!entries.length) {
          throw new Error(
            "Le JSON ne contient aucune entrée de boutique."
          );
        }

        const items =
          entries
            .map(extractShopItem)
            .filter(Boolean);

        console.log(
          "Offres affichables :",
          items.length
        );

        if (!items.length) {
          throw new Error(
            "Les entrées existent mais aucune offre n'a pu être extraite."
          );
        }

        renderShop(items);

        if (shopStatus) {
          shopStatus.textContent =
            `${items.length} offres disponibles`;
        }

        console.log(
          "Boutique chargée avec succès depuis :",
          api
        );

        return;

      } catch (error) {

        console.error(
          `Source ${sourceIndex + 1} échouée :`,
          error
        );

        lastError =
          error;
      }
    }

    throw (
      lastError ||
      new Error(
        "Impossible de charger la boutique."
      )
    );

  } catch (error) {

    console.error(
      "ERREUR FINALE BOUTIQUE :",
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
            La source de données n'a pas renvoyé les offres.
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
      refreshBtn.disabled = false;
    }

  }
}


/* =========================================================
   PRÉCHARGEMENT IMAGE
   ========================================================= */

function preloadImage(src) {
  return new Promise((resolve) => {

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

  });
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
   INFOS MODALE
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

function resetVideo() {
  if (!modalVideo) {
    return;
  }

  modalVideo.pause();

  modalVideo.removeAttribute("src");

  if (videoSource) {
    videoSource.removeAttribute("src");
  }

  modalVideo.load();

  modalVideo.style.display =
    "none";
}


function loadModalVideo() {
  resetVideo();
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
    .querySelectorAll(".preview-dot")
    .forEach((dot) => {

      dot.addEventListener(
        "click",
        () => {
          setPreview(
            Number(dot.dataset.slide)
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

  if (currentPreviewIndex === 1) {
    loadModalVideo();
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

    if (packItemsContainer) {
      packItemsContainer.innerHTML =
        "";
    }

    return;
  }

  packCarousel.classList.add(
    "visible"
  );

  if (!packItemsContainer) {
    return;
  }

  packItemsContainer.innerHTML =
    items
      .map((packItem, index) => {

        const image =
          getItemImage(packItem);

        const name =
          packItem?.name || "";

        if (!name) {
          return "";
        }

        const type =
          getItemType(packItem);

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

              ${
                image
                  ? `
                    <img
                      class="pack-carousel-image"
                      src="${escapeHtml(image)}"
                      alt="${escapeHtml(name)}"
                      loading="lazy"
                    >
                  `
                  : ""
              }

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

      })
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

          setModalImage(
            selected
          );

          if (modalTitle) {
            modalTitle.textContent =
              selected.name || "";
          }

          if (modalDescription) {
            modalDescription.textContent =
              selected.description || "";
          }

          if (modalPrice) {
            modalPrice.textContent =
              formatPrice(
                selected.finalPrice ??
                selected.regularPrice ??
                selected.price
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
   OUVERTURE MODALE
   ========================================================= */

async function openModal(item) {
  if (!item || !itemModal) {
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
    getItemImage(modalItem) ||
    item.image;

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

  if (image) {
    await preloadImage(
      image
    );
  }

  if (currentModalItem !== item) {
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


modalClose?.addEventListener(
  "click",
  closeModal
);


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
      itemModal?.classList.contains("open")
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
    { passive: true }
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
        Math.abs(deltaX) < 45 ||
        Math.abs(deltaX) < Math.abs(deltaY)
      ) {
        return;
      }

      if (deltaX < 0) {
        setPreview(1);
      } else {
        setPreview(0);
      }

    },
    { passive: true }
  );

}


/* =========================================================
   PACK FLÈCHES
   ========================================================= */

packPrev?.addEventListener(
  "click",
  () => {

    packItemsContainer?.scrollBy({
      left: -220,
      behavior: "smooth"
    });

  }
);


packNext?.addEventListener(
  "click",
  () => {

    packItemsContainer?.scrollBy({
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