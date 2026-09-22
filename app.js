/* =========================================================
   FORTNITE SHOP
   Extraction API réinitialisée proprement
   ========================================================= */

const SHOP_API =
  "https://fortnite-api.com/v2/shop?language=fr";

const shopGrid =
  document.getElementById("shop-grid");

const shopStatus =
  document.getElementById("status");

const refreshBtn =
  document.getElementById("refresh-btn");


/* =========================================================
   MODALE
   ========================================================= */

const itemModal =
  document.getElementById("item-modal");

const modalMedia =
  document.getElementById("modal-media");

const previewTrack =
  document.getElementById("preview-track");

const modalImage =
  document.getElementById("modal-image");

const modalVideo =
  document.getElementById("modal-video");

const videoFallback =
  document.getElementById("video-fallback");

const carouselDots =
  document.getElementById("carousel-dots");

const modalTitle =
  document.getElementById("modal-title");

const modalDescription =
  document.getElementById("modal-description");

const modalPrice =
  document.getElementById("modal-price");

const modalOldPrice =
  document.getElementById("modal-old-price");

const modalType =
  document.getElementById("modal-type");

const modalRarity =
  document.getElementById("modal-rarity");

const modalSet =
  document.getElementById("modal-set");

const modalClose =
  document.querySelector(".modal-close");

const packCarousel =
  document.getElementById("pack-carousel");

const packItemsContainer =
  document.getElementById("pack-items");


/* =========================================================
   ÉTAT
   ========================================================= */

let allShopItems = [];

let shopItemsByKey =
  new Map();

let currentModalItem =
  null;

let currentPreviewIndex =
  0;

let currentVideoUrl =
  "";

let videoLoaded =
  false;

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
   EXTRACTION DES ITEMS
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

  if (
    Array.isArray(entry.brItems)
  ) {
    return entry.brItems;
  }

  if (
    Array.isArray(entry.tracks)
  ) {
    return entry.tracks;
  }

  if (
    Array.isArray(entry.instruments)
  ) {
    return entry.instruments;
  }

  return [];
}


/* =========================================================
   DÉTECTION PACK
   ========================================================= */

function isPackEntry(entry) {
  if (!entry) {
    return false;
  }

  const items =
    getEntryItems(entry);

  /*
   * RÈGLE ABSOLUE :
   * plus d'un item = pack.
   */
  if (items.length > 1) {
    return true;
  }

  /*
   * Un bundle reste également un pack
   * même s'il ne contient qu'un item.
   */
  if (entry.bundle) {
    return true;
  }

  return false;
}


/* =========================================================
   IMAGE — ORDRE STRICT DEMANDÉ
   ========================================================= */

function getEntryImage(entry) {
  if (!entry) {
    return "";
  }

  /*
   * 1.
   * entry.newDisplayAsset.materialInstances[0].images.Background
   */
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

  /*
   * 2.
   * entry.displayAssets[0].url
   */
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

  /*
   * 3.
   * entry.items[0].images.icon
   */
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

  /*
   * 4.
   * entry.items[0].images.featured
   */
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

  /*
   * Aucune image :
   * on retourne volontairement une chaîne vide.
   *
   * L'offre sera supprimée du rendu.
   */
  return "";
}


/* =========================================================
   IMAGE D'UN OBJET INDIVIDUEL
   ========================================================= */

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
   NOM — AUCUN FALLBACK "OBJET FORTNITE"
   ========================================================= */

function getEntryName(entry) {
  if (!entry) {
    return "";
  }

  /*
   * Nom officiel de l'objet.
   */
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

  /*
   * Nom du bundle.
   */
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

  /*
   * IMPORTANT :
   * aucun "Objet Fortnite".
   */
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

  for (const value of candidates) {
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

  for (const value of candidates) {
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

  for (const item of items) {
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


function getRarity(item) {
  if (!item) {
    return "";
  }

  return (
    item.rarity?.displayName ||
    item.rarity?.name ||
    item.rarity?.value ||
    item.rarity ||
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
    getRarity(item) ||
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
   SECTION / TILE
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
    entry.items?.[0]?.series?.displayName ||
    entry.items?.[0]?.series?.name;

  if (
    typeof itemSeries === "string" &&
    itemSeries.trim()
  ) {
    return itemSeries.trim();
  }

  return "Boutique";
}


function getTileSize(entry) {
  return (
    entry?.tileSize ||
    entry?.tileSize?.name ||
    entry?.tileSize?.value ||
    entry?.items?.[0]?.tileSize ||
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
    return "tile-2x2";
  }

  if (
    tile.includes("size_1_x_2") ||
    tile.includes("1_x_2") ||
    tile.includes("1x2")
  ) {
    return "tile-1x2";
  }

  return "tile-1x1";
}


/* =========================================================
   COULEURS API
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
    /^#[0-9a-fA-F]{3,8}$/
      .test(color) ||
    /^rgba?\(/i
      .test(color) ||
    /^hsla?\(/i
      .test(color)
  );
}


function getEntryColors(entry) {
  const colors = [];

  const sources = [
    entry?.colors,
    entry?.series?.colors,
    entry?.items?.[0]?.colors,
    entry?.items?.[0]?.series?.colors
  ];

  for (const source of sources) {
    if (!source) {
      continue;
    }

    if (Array.isArray(source)) {
      for (const color of source) {
        if (
          isValidCssColor(color) &&
          !colors.includes(color)
        ) {
          colors.push(color);
        }
      }

      continue;
    }

    if (
      typeof source === "object"
    ) {
      const possibleColors = [
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
        of possibleColors
      ) {
        if (
          isValidCssColor(color) &&
          !colors.includes(color)
        ) {
          colors.push(color);
        }
      }
    }
  }

  return colors.slice(0, 3);
}


/* =========================================================
   GRADIENT RARETÉ
   ========================================================= */

function getRarityGradient(item) {
  const rarity =
    getRarityKey(item);

  if (
    rarity.includes("legendary") ||
    rarity.includes("légendaire")
  ) {
    return (
      "linear-gradient(135deg, " +
      "#7a3f00 0%, " +
      "#c87919 50%, " +
      "#ffb347 100%)"
    );
  }

  if (
    rarity.includes("epic") ||
    rarity.includes("épique")
  ) {
    return (
      "linear-gradient(135deg, " +
      "#2b0757 0%, " +
      "#7435a8 50%, " +
      "#b66cff 100%)"
    );
  }

  if (
    rarity.includes("rare")
  ) {
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
      "#b87500 50%, " +
      "#ffd15c 100%)"
    );
  }

  if (
    rarity.includes("marvel")
  ) {
    return (
      "linear-gradient(135deg, " +
      "#4b0707 0%, " +
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


function getModalBackground(
  entry,
  item
) {
  const colors =
    getEntryColors(entry);

  if (colors.length >= 2) {
    return (
      `linear-gradient(135deg, ` +
      `${colors[0]}, ${colors[1]})`
    );
  }

  if (colors.length === 1) {
    return (
      `linear-gradient(135deg, ` +
      `${colors[0]}, ${colors[0]})`
    );
  }

  return getRarityGradient(
    item
  );
}


/* =========================================================
   EXTRACTION PRINCIPALE
   ========================================================= */

function extractShopItem(entry) {
  if (!entry) {
    return null;
  }

  const items =
    getEntryItems(entry);

  /*
   * Pas d'item + pas de bundle :
   * impossible d'obtenir un nom fiable.
   */
  if (!items.length && !entry.bundle) {
    return null;
  }

  /*
   * IMAGE STRICTE.
   */
  const image =
    getEntryImage(entry);

  /*
   * SI AUCUNE IMAGE :
   * on ne crée PAS l'offre.
   */
  if (!image) {
    return null;
  }

  /*
   * NOM STRICT.
   */
  const name =
    getEntryName(entry);

  /*
   * SI AUCUN NOM :
   * on ne crée PAS l'offre.
   *
   * Cela évite absolument
   * "Objet Fortnite".
   */
  if (!name) {
    return null;
  }

  const firstItem =
    items[0] || null;

  const isBundle =
    items.length > 1 ||
    Boolean(entry.bundle);

  const finalPrice =
    getEntryFinalPrice(entry);

  const regularPrice =
    getEntryRegularPrice(entry);

  return {
    id:
      entry.offerId ||
      entry.id ||
      firstItem?.id ||
      `${name}-${Math.random()}`,

    name,

    image,

    price:
      finalPrice,

    regularPrice,

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

    isBundle,

    /*
     * IMPORTANT :
     * tous les items restent disponibles
     * pour le carousel du pack.
     */
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

function createCard(
  item,
  key
) {
  const price =
    formatPrice(
      item.price
    );

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
    item.backgroundColors;

  let customStyle =
    "";

  if (colors.length) {
    customStyle =
      [
        `--card-color-1:${colors[0]}`,
        `--card-color-2:${colors[1] || colors[0]}`,
        `--card-color-3:${colors[2] || colors[1] || colors[0]}`
      ].join(";");
  }

  return `
    <article
      class="shop-card ${escapeHtml(item.tileClass)}"
      data-shop-key="${escapeHtml(key)}"
      style="${escapeHtml(customStyle)}"
      tabindex="0"
      role="button"
      aria-label="${escapeHtml(item.name)}"
    >
      <div class="card-background-color"></div>

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
   SECTIONS
   ========================================================= */

function createSection(
  title,
  items
) {
  return `
    <section class="shop-section">

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
   RENDU
   ========================================================= */

function renderShop(
  items
) {
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

  let html =
    "";

  for (
    const [
      title,
      groupItems
    ]
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

  /*
   * Les cartes ne contiennent désormais
   * que des offres qui possèdent déjà
   * une image valide.
   */
  shopGrid
    .querySelectorAll(
      ".shop-card"
    )
    .forEach((card) => {
      const key =
        card.dataset.shopKey;

      const item =
        shopItemsByKey.get(
          key
        );

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
      json?.data?.entries ||
      [];

    if (!Array.isArray(entries)) {
      throw new Error(
        "Réponse API invalide."
      );
    }

    /*
     * Extraction stricte.
     *
     * Les offres sans image ou sans nom
     * sont simplement ignorées.
     */
    const items =
      entries
        .map(
          extractShopItem
        )
        .filter(
          Boolean
        );

    renderShop(
      items
    );

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
      refreshBtn.disabled =
        false;
    }
  }
}


/* =========================================================
   PRÉCHARGEMENT IMAGE MODALE
   ========================================================= */

function preloadImage(
  src
) {
  return new Promise(
    (resolve) => {
      if (!src) {
        resolve(false);
        return;
      }

      const image =
        new Image();

      let finished =
        false;

      const finish =
        (success) => {
          if (finished) {
            return;
          }

          finished =
            true;

          resolve(
            success
          );
        };

      image.onload =
        () => finish(true);

      image.onerror =
        () => finish(false);

      image.src =
        src;

      /*
       * Sécurité :
       * on ne bloque jamais la modale
       * indéfiniment.
       */
      setTimeout(
        () => finish(false),
        4000
      );
    }
  );
}


/* =========================================================
   APPLICATION FOND MODALE
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
   * On applique le fond AVANT
   * de rendre la modale visible.
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

  for (
    const target
    of targets
  ) {
    target.style.background =
      background;

    target.style.setProperty(
      "--modal-bg",
      background
    );
  }

  /*
   * Également sur la modale elle-même
   * pour éviter toute zone noire pendant
   * la transition.
   */
  if (itemModal) {
    itemModal.style.setProperty(
      "--modal-bg",
      background
    );
  }
}


/* =========================================================
   INFORMATIONS MODALE
   ========================================================= */

function updateModalInfo(
  item
) {
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
      formatPrice(
        item.price
      );
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
   IMAGE MODALE
   ========================================================= */

function setModalImage(
  item
) {
  if (!modalImage) {
    return;
  }

  const image =
    getItemImage(item);

  if (!image) {
    modalImage.removeAttribute(
      "src"
    );

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

function getVideoUrl(
  item
) {
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
  videoLoaded =
    false;

  currentVideoUrl =
    "";

  if (!modalVideo) {
    return;
  }

  modalVideo.pause();

  modalVideo.removeAttribute(
    "src"
  );

  modalVideo.load();

  modalVideo.style.display =
    "none";
}


function loadModalVideo(
  item
) {
  if (!modalVideo) {
    return;
  }

  const url =
    getVideoUrl(item);

  currentVideoUrl =
    url;

  if (!url) {
    resetVideo();

    if (videoFallback) {
      videoFallback.style.display =
        "";
    }

    return;
  }

  videoLoaded =
    false;

  modalVideo.src =
    url;

  modalVideo.style.display =
    "";

  if (videoFallback) {
    videoFallback.style.display =
      "none";
  }

  modalVideo.onloadstart =
    () => {
      videoLoaded =
        false;
    };

  modalVideo.onloadeddata =
    () => {
      videoLoaded =
        true;

      if (videoFallback) {
        videoFallback.style.display =
          "none";
      }
    };

  modalVideo.onerror =
    () => {
      videoLoaded =
        false;

      modalVideo.style.display =
        "none";

      if (videoFallback) {
        videoFallback.style.display =
          "";
      }
    };

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
      class="carousel-dot ${
        currentPreviewIndex === 0
          ? "active"
          : ""
      }"
      data-slide="0"
      aria-label="Image"
    ></button>

    <button
      type="button"
      class="carousel-dot ${
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


function setPreview(
  index
) {
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

function renderPackCarousel(
  item
) {
  if (!packCarousel) {
    return;
  }

  const items =
    item?.items || [];

  /*
   * RÈGLE :
   * items.length > 1 = pack.
   */
  const isPack =
    items.length > 1 ||
    Boolean(item?.entry?.bundle);

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

          /*
           * Un objet individuel sans image
           * n'affiche pas de rectangle cassé.
           */
          if (!image) {
            return "";
          }

          const name =
            packItem?.name ||
            "";

          if (!name) {
            return "";
          }

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
                <img
                  src="${escapeHtml(image)}"
                  alt="${escapeHtml(name)}"
                  loading="lazy"
                >
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

          if (!selected) {
            return;
          }

          /*
           * On prépare d'abord toutes
           * les données du nouvel objet.
           */
          const selectedImage =
            getItemImage(
              selected
            );

          if (!selectedImage) {
            return;
          }

          applyModalBackground(
            item.entry,
            selected
          );

          setModalImage(
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
   OUVERTURE MODALE SANS FLASH
   ========================================================= */

async function openModal(
  item
) {
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

  /*
   * Sécurité :
   * une offre affichée possède déjà
   * une image valide.
   */
  if (!image) {
    return;
  }

  /*
   * -------------------------------------------------------
   * ÉTAPE 1 :
   * tout préparer AVANT d'afficher la modale.
   * -------------------------------------------------------
   */

  currentModalItem =
    item;

  currentPreviewIndex =
    0;

  /*
   * Fond calculé immédiatement.
   */
  applyModalBackground(
    item.entry,
    modalItem
  );

  /*
   * Texte préparé.
   */
  updateModalInfo(
    item
  );

  /*
   * Image préparée.
   */
  setModalImage(
    modalItem
  );

  /*
   * Préchargement de l'image.
   *
   * Tant que cette promesse n'est pas terminée,
   * la modale reste invisible.
   */
  await preloadImage(
    image
  );

  /*
   * Si l'utilisateur a fermé / changé
   * entre-temps, on abandonne.
   */
  if (
    currentModalItem !== item
  ) {
    return;
  }

  /*
   * Vidéo préparée.
   */
  resetVideo();

  /*
   * Pack préparé.
   */
  renderPackCarousel(
    item
  );

  /*
   * Dots préparés.
   */
  renderCarouselDots();

  /*
   * Position initiale.
   */
  if (previewTrack) {
    previewTrack.style.transform =
      "translateX(0)";
  }

  /*
   * -------------------------------------------------------
   * ÉTAPE 2 :
   * seulement maintenant on affiche.
   * -------------------------------------------------------
   */

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

  /*
   * Chargement vidéo après ouverture.
   * Elle n'est pas visible à l'ouverture,
   * donc aucun flash.
   */
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
  itemModal.addEventListener(
    "click",
    (event) => {
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
   VIDÉO
   ========================================================= */

if (modalVideo) {
  modalVideo.addEventListener(
    "loadeddata",
    () => {
      videoLoaded =
        true;

      if (videoFallback) {
        videoFallback.style.display =
          "none";
      }
    }
  );

  modalVideo.addEventListener(
    "error",
    () => {
      videoLoaded =
        false;

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
    loadShop
  );
}


/* =========================================================
   INITIALISATION
   ========================================================= */

loadShop();