const SHOP_API = "https://fortnite-api.com/v2/shop?language=fr";
const COSMETIC_API =
    "https://fortnite-api.com/v2/cosmetics/br/search/ids";

const shopEl = document.getElementById("shop");
const shopStatus = document.getElementById("shop-status");
const shopDate = document.getElementById("shop-date");
const refreshBtn = document.getElementById("refresh-shop");

const modal = document.getElementById("item-modal");
const modalClose = document.getElementById("modal-close");
const modalName = document.getElementById("modal-name");
const modalPrice = document.getElementById("modal-price");
const modalExtra = document.getElementById("modal-extra");
const modalDescription =
    document.getElementById("modal-description");

const previewTrack =
    document.getElementById("preview-track");
const previewImage =
    document.getElementById("preview-image");
const previewVideo =
    document.getElementById("preview-video");
const previewVideoSource =
    document.getElementById("preview-video-source");
const previewStatus =
    document.getElementById("preview-status");
const previewDots =
    document.getElementById("preview-dots");

const packCarousel =
    document.getElementById("pack-carousel");
const packCarouselTrack =
    document.getElementById("pack-carousel-track");
const packCarouselPrev =
    document.getElementById("pack-carousel-prev");
const packCarouselNext =
    document.getElementById("pack-carousel-next");

let currentModalItem = null;
let currentPreviewIndex = 0;
let hasVideo = false;
let currentPackItemIndex = 0;

let shopItemsByKey = new Map();


// ============================================================
// HELPERS
// ============================================================

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
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
            value.trim() !== ""
        ) {
            return value.trim();
        }
    }

    return "";
}


function toNumber(value) {
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


function normalizeColor(value) {
    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        return null;
    }

    let color = value.trim();

    if (!color.startsWith("#")) {
        color = `#${color}`;
    }

    if (
        /^#[0-9a-fA-F]{3}$/.test(color) ||
        /^#[0-9a-fA-F]{6}$/.test(color) ||
        /^#[0-9a-fA-F]{8}$/.test(color)
    ) {
        return color;
    }

    return null;
}


// ============================================================
// SHOP DATA
// ============================================================

function getEntryItems(entry) {
    if (
        Array.isArray(entry?.items) &&
        entry.items.length
    ) {
        return entry.items;
    }

    if (
        Array.isArray(entry?.brItems) &&
        entry.brItems.length
    ) {
        return entry.brItems;
    }

    if (
        Array.isArray(entry?.tracks) &&
        entry.tracks.length
    ) {
        return entry.tracks;
    }

    if (
        Array.isArray(entry?.instruments) &&
        entry.instruments.length
    ) {
        return entry.instruments;
    }

    return [];
}


function isPackEntry(entry, items) {
    return (
        items.length > 1 ||
        !!entry?.bundle ||
        entry?.offerKind === "bundle" ||
        entry?.isBundle === true
    );
}


function getItemImage(item) {
    return getFirstValidString(
        item?.images?.featured,
        item?.images?.icon,
        item?.images?.smallIcon,
        item?.images?.background,
        item?.image,
        item?.imageUrl
    );
}


function getBundleImage(entry) {
    return getFirstValidString(
        entry?.bundle?.image,
        entry?.bundle?.images?.featured,
        entry?.bundle?.images?.icon,

        entry?.newDisplayAsset?.renderImages?.[0]?.image,
        entry?.newDisplayAsset?.renderImages?.[0]?.url,

        entry?.newDisplayAsset?.image,
        entry?.newDisplayAsset?.url,

        entry?.displayAssets?.[0]?.image,
        entry?.displayAssets?.[0]?.url,

        entry?.displayAsset?.image,
        entry?.displayAsset?.url,

        entry?.image,
        entry?.imageUrl
    );
}


function getItemPrice(item) {
    const price =
        item?.price ??
        item?.finalPrice ??
        item?.regularPrice ??
        item?.cost;

    return toNumber(price);
}


function getEntryFinalPrice(entry) {
    const price =
        entry?.finalPrice ??
        entry?.price?.finalPrice ??
        entry?.price?.final ??
        entry?.cost;

    return toNumber(price);
}


function getEntryRegularPrice(entry) {
    const price =
        entry?.regularPrice ??
        entry?.price?.regularPrice ??
        entry?.price?.regular;

    return toNumber(price);
}


function getIndividualItemsTotal(items) {
    return items.reduce((total, item) => {
        const price = getItemPrice(item);

        if (price === null) {
            return total;
        }

        return total + price;
    }, 0);
}


function getBundleRegularPrice(entry, items) {
    const entryRegularPrice =
        getEntryRegularPrice(entry);

    if (
        entryRegularPrice !== null &&
        entryRegularPrice > 0
    ) {
        return entryRegularPrice;
    }

    const itemTotal =
        getIndividualItemsTotal(items);

    return itemTotal > 0
        ? itemTotal
        : null;
}


function getBundleDiscount(
    entry,
    regularPrice,
    finalPrice
) {
    const explicitDiscount =
        entry?.discountAmount ??
        entry?.discount ??
        entry?.discountPercentage;

    if (
        explicitDiscount !== null &&
        explicitDiscount !== undefined
    ) {
        const number =
            Number(explicitDiscount);

        if (
            Number.isFinite(number) &&
            number > 0 &&
            number <= 100
        ) {
            return Math.round(number);
        }
    }

    if (
        regularPrice !== null &&
        finalPrice !== null &&
        regularPrice > finalPrice
    ) {
        return Math.round(
            ((regularPrice - finalPrice) /
                regularPrice) *
                100
        );
    }

    return 0;
}


// ============================================================
// TILE SIZE
// ============================================================

function getTileSize(entry) {
    return getFirstValidString(
        entry?.tileSize,
        entry?.layout?.tileSize,
        entry?.newDisplayAsset?.tileSize,
        entry?.displayAsset?.tileSize,
        entry?.items?.[0]?.tileSize
    ) || "Size_1_x_1";
}


function isLargeTile(tileSize) {
    return (
        tileSize === "Size_2_x_2" ||
        tileSize === "Size_2_x_1" ||
        tileSize === "Size_3_x_2"
    );
}


function getTileClass(item) {
    if (item.isBundle) {
        return "tile-large";
    }

    switch (item.tileSize) {
        case "Size_2_x_2":
        case "Size_2_x_1":
        case "Size_3_x_2":
            return "tile-large";

        case "Size_1_x_2":
            return "tile-portrait";

        case "Size_1_x_1":
        default:
            return "tile-square";
    }
}


// ============================================================
// BACKGROUNDS
// ============================================================

function getSeriesObject(entry, item) {
    return (
        entry?.series ||
        item?.series ||
        entry?.items?.[0]?.series ||
        null
    );
}


function getShopColors(entry, item) {
    const colors =
        entry?.colors ||
        entry?.background?.colors ||
        entry?.layout?.colors ||
        entry?.newDisplayAsset?.colors ||
        item?.colors ||
        item?.background?.colors ||
        item?.series?.colors ||
        null;

    if (!colors) {
        return {
            color1: null,
            color2: null,
            color3: null,
            textBackgroundColor: null
        };
    }

    return {
        color1: normalizeColor(
            colors?.color1 ??
            colors?.primary ??
            colors?.backgroundColor
        ),

        color2: normalizeColor(
            colors?.color2 ??
            colors?.secondary
        ),

        color3: normalizeColor(
            colors?.color3 ??
            colors?.tertiary
        ),

        textBackgroundColor:
            normalizeColor(
                colors?.textBackgroundColor
            )
    };
}


function getSeriesName(entry, item) {
    const series =
        getSeriesObject(entry, item);

    return getFirstValidString(
        series?.displayName,
        series?.name,
        series?.value,
        entry?.series?.displayName,
        item?.series?.displayName
    );
}


function getDynamicBackground(item) {
    const colors = item.colors || {};

    const color1 =
        colors.color1 ||
        "#151515";

    const color2 =
        colors.color2 ||
        color1;

    const color3 =
        colors.color3 ||
        color2;

    const textBackground =
        colors.textBackgroundColor ||
        "rgba(0,0,0,0.82)";

    return {
        "--item-color-1": color1,
        "--item-color-2": color2,
        "--item-color-3": color3,
        "--item-text-bg": textBackground
    };
}


// ============================================================
// NAME / DESCRIPTION
// ============================================================

function getEntryName(
    entry,
    items,
    isBundle
) {
    if (items.length === 1) {
        return getFirstValidString(
            items[0]?.name,
            items[0]?.displayName,
            entry?.name,
            entry?.displayName,
            entry?.offerName,
            "Objet Fortnite"
        );
    }

    if (isBundle) {
        return getFirstValidString(
            entry?.bundle?.name,
            entry?.bundleName,
            entry?.offerName,
            entry?.name,
            entry?.displayName,
            "Pack Fortnite"
        );
    }

    return getFirstValidString(
        items[0]?.name,
        items[0]?.displayName,
        entry?.name,
        entry?.displayName,
        entry?.offerName,
        "Objet Fortnite"
    );
}


function getEntryDescription(entry, items) {
    return getFirstValidString(
        entry?.description,
        entry?.shortDescription,
        entry?.bundle?.description,
        items[0]?.description,
        items[0]?.shortDescription
    );
}


// ============================================================
// SECTION NAME
// ============================================================

function getSectionName(entry, item) {
    const sectionName =
        getFirstValidString(
            entry?.section?.name,
            entry?.section?.displayName,
            entry?.section?.title,
            entry?.layout?.section?.name
        );

    if (sectionName) {
        return sectionName;
    }

    const seriesName =
        getSeriesName(entry, item);

    if (seriesName) {
        return seriesName;
    }

    if (item.isBundle) {
        return "Packs";
    }

    return "Boutique";
}


// ============================================================
// ENTRY -> SHOP ITEM
// ============================================================

function extractShopItem(entry) {
    const items =
        getEntryItems(entry);

    const isBundle =
        isPackEntry(
            entry,
            items
        );

    const firstItem =
        items[0] || {};

    const finalPrice =
        getEntryFinalPrice(entry);

    const regularPrice =
        isBundle
            ? getBundleRegularPrice(
                entry,
                items
            )
            : (
                getEntryRegularPrice(entry) ??
                getItemPrice(firstItem)
            );

    const discount =
        isBundle
            ? getBundleDiscount(
                entry,
                regularPrice,
                finalPrice
            )
            : 0;

    const name =
        getEntryName(
            entry,
            items,
            isBundle
        );

    const image =
        isBundle
            ? (
                getBundleImage(entry) ||
                getItemImage(firstItem)
            )
            : getItemImage(firstItem);

    const itemType =
        getFirstValidString(
            firstItem?.type,
            firstItem?.itemType,
            firstItem?.series?.displayName,
            firstItem?.rarity?.displayName
        );

    const rarity =
        getFirstValidString(
            firstItem?.rarity?.displayName,
            firstItem?.rarity?.value
        );

    const setName =
        getFirstValidString(
            firstItem?.set?.text,
            firstItem?.set?.name,
            firstItem?.setName
        );

    const tileSize =
        getTileSize(entry);

    const colors =
        getShopColors(
            entry,
            firstItem
        );

    const section =
        getSectionName(
            entry,
            {
                isBundle,
                series: firstItem?.series
            }
        );

    return {
        id:
            entry?.offerId ||
            entry?.id ||
            entry?.offerID ||
            firstItem?.id ||
            Math.random()
                .toString(36)
                .slice(2),

        name,
        image,

        price: finalPrice,
        regularPrice,
        discount,

        description:
            getEntryDescription(
                entry,
                items
            ),

        itemType,
        rarity,
        setName,

        seriesName:
            getSeriesName(
                entry,
                firstItem
            ),

        section,

        tileSize,

        tileClass:
            getTileClass({
                isBundle,
                tileSize
            }),

        colors,

        isBundle,

        itemCount:
            items.length,

        items,

        entry
    };
}


// ============================================================
// CARD
// ============================================================

function createCard(item) {
    const priceHtml =
        item.price !== null
            ? `${escapeHtml(item.price)} V-Bucks`
            : "Prix indisponible";

    const discountHtml =
        item.discount > 0
            ? `
                <span class="card-discount">
                    -${escapeHtml(item.discount)}%
                </span>
            `
            : "";

    const countHtml =
        item.isBundle &&
        item.itemCount > 0
            ? `
                <span class="card-count">
                    ${escapeHtml(item.itemCount)}
                    OBJET${item.itemCount > 1 ? "S" : ""}
                </span>
            `
            : "";

    const oldPriceHtml =
        item.regularPrice !== null &&
        item.price !== null &&
        item.regularPrice > item.price
            ? `
                <span class="card-old-price">
                    ${escapeHtml(item.regularPrice)}
                    V-Bucks
                </span>
            `
            : "";

    const imageHtml =
        item.image
            ? `
                <img
                    class="shop-card-image"
                    src="${escapeHtml(item.image)}"
                    alt="${escapeHtml(item.name)}"
                    loading="lazy"
                    draggable="false"
                >
            `
            : `
                <div class="shop-card-no-image">
                    IMAGE INDISPONIBLE
                </div>
            `;

    const background =
        getDynamicBackground(item);

    const backgroundStyle =
        Object.entries(background)
            .map(
                ([key, value]) =>
                    `${key}:${value}`
            )
            .join(";");

    const typeHtml =
        item.itemType
            ? `
                <span class="card-overlay-type">
                    ${escapeHtml(item.itemType)}
                </span>
            `
            : "";

    return `
        <article
            class="
                shop-card
                ${escapeHtml(item.tileClass)}
                ${item.isBundle ? "bundle-card" : ""}
            "
            data-shop-key="${escapeHtml(item.__shopKey || "")}"
            tabindex="0"
            role="button"
            aria-label="Voir ${escapeHtml(item.name)}"
            style="${backgroundStyle}"
        >

            <div class="card-visual">

                <div class="card-background"></div>

                ${imageHtml}

                <div class="card-color-overlay"></div>

                <div class="card-top-badges">
                    ${discountHtml}
                    ${countHtml}
                </div>

                <div class="card-overlay">

                    ${typeHtml}

                    <div class="card-overlay-main">

                        <h3>
                            ${escapeHtml(item.name)}
                        </h3>

                        <div class="card-overlay-price">

                            ${oldPriceHtml}

                            <span class="card-current-price">
                                ${priceHtml}
                            </span>

                        </div>

                    </div>

                </div>

            </div>

        </article>
    `;
}


// ============================================================
// SECTION
// ============================================================

function createSection(
    title,
    items,
    index
) {
    if (!items.length) {
        return "";
    }

    const cards =
        items
            .map(item =>
                createCard(item)
            )
            .join("");

    return `
        <section
            class="shop-group"
            data-section-index="${index}"
        >

            <header class="shop-group-header">

                <div class="shop-group-title-row">

                    <h2>
                        ${escapeHtml(title)}
                    </h2>

                    <span class="shop-group-line"></span>

                </div>

                <span class="shop-group-count">
                    ${items.length}
                    offre${items.length > 1 ? "s" : ""}
                </span>

            </header>

            <div class="shop-grid">
                ${cards}
            </div>

        </section>
    `;
}


// ============================================================
// RENDER SHOP
// ============================================================

function renderShop(entries) {
    const items =
        entries
            .map(extractShopItem)
            .filter(
                item =>
                    item &&
                    item.name
            );

    shopItemsByKey.clear();

    items.forEach(
        (item, index) => {
            item.__shopKey =
                String(index);

            shopItemsByKey.set(
                item.__shopKey,
                item
            );
        }
    );


    // --------------------------------------------------------
    // GROUP BY REAL API SECTION
    // --------------------------------------------------------

    const sections =
        new Map();

    items.forEach(item => {
        const sectionName =
            item.section ||
            "Boutique";

        if (
            !sections.has(
                sectionName
            )
        ) {
            sections.set(
                sectionName,
                []
            );
        }

        sections
            .get(sectionName)
            .push(item);
    });


    let html = "";

    let sectionIndex = 0;

    for (
        const [
            title,
            sectionItems
        ] of sections
    ) {
        html += createSection(
            title,
            sectionItems,
            sectionIndex
        );

        sectionIndex++;
    }


    shopEl.innerHTML =
        html ||
        `
            <div class="empty-shop">
                Aucun objet trouvé.
            </div>
        `;


    // --------------------------------------------------------
    // CLICK MAPPING
    // --------------------------------------------------------

    document
        .querySelectorAll(
            ".shop-card"
        )
        .forEach(card => {
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
                event => {
                    if (
                        event.key ===
                            "Enter" ||
                        event.key ===
                            " "
                    ) {
                        event.preventDefault();

                        openModal(item);
                    }
                }
            );
        });
}


// ============================================================
// LOAD SHOP
// ============================================================

async function loadShop() {
    try {
        shopStatus.textContent =
            "Chargement de la boutique…";

        refreshBtn.disabled =
            true;

        const response =
            await fetch(
                SHOP_API,
                {
                    cache:
                        "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                `Erreur HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        const entries =
            data?.data?.entries ||
            data?.entries ||
            data?.data?.shop ||
            data?.shop ||
            [];

        if (
            !Array.isArray(entries)
        ) {
            throw new Error(
                "Format de boutique invalide."
            );
        }

        renderShop(entries);

        const now =
            new Date();

        shopDate.textContent =
            `Mis à jour à ${now.toLocaleTimeString(
                "fr-FR",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )}`;

        shopStatus.textContent =
            `${entries.length} offres chargées`;
    }
    catch (error) {
        console.error(
            "Erreur boutique :",
            error
        );

        shopStatus.textContent =
            "Erreur de chargement";

        shopEl.innerHTML = `
            <div class="error-shop">

                <h2>
                    Impossible de charger la boutique
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

        const retryBtn =
            document.getElementById(
                "retry-shop"
            );

        if (retryBtn) {
            retryBtn.addEventListener(
                "click",
                loadShop
            );
        }
    }
    finally {
        refreshBtn.disabled =
            false;
    }
}


// ============================================================
// VIDEO
// ============================================================

async function getCosmeticVideo(
    itemId
) {
    if (!itemId) {
        return null;
    }

    try {
        const response =
            await fetch(
                `${COSMETIC_API}?id=${encodeURIComponent(
                    itemId
                )}&language=fr`,
                {
                    cache:
                        "no-store"
                }
            );

        if (!response.ok) {
            return null;
        }

        const data =
            await response.json();

        const item =
            data?.data?.[0] ||
            data?.data ||
            null;

        if (!item) {
            return null;
        }

        return (
            getFirstValidString(
                item?.video,
                item?.videos?.video,
                item?.previewVideo
            ) || null
        );
    }
    catch (error) {
        console.warn(
            "Vidéo indisponible :",
            error
        );

        return null;
    }
}


// ============================================================
// PREVIEW
// ============================================================

function setPreview(index) {
    currentPreviewIndex =
        index;

    if (
        currentPreviewIndex === 0
    ) {
        previewTrack.style.transform =
            "translateX(0%)";

        if (previewVideo) {
            previewVideo.pause();
        }
    }
    else if (
        currentPreviewIndex === 1 &&
        hasVideo
    ) {
        previewTrack.style.transform =
            "translateX(-100%)";

        if (previewVideo) {
            previewVideo
                .play()
                .catch(() => {});
        }
    }

    createPreviewDots();
}


function createPreviewDots() {
    if (!previewDots) {
        return;
    }

    const count =
        hasVideo ? 2 : 1;

    previewDots.innerHTML =
        "";

    for (
        let i = 0;
        i < count;
        i++
    ) {
        const dot =
            document.createElement(
                "button"
            );

        dot.type =
            "button";

        dot.className =
            `preview-dot ${
                i ===
                currentPreviewIndex
                    ? "active"
                    : ""
            }`;

        dot.setAttribute(
            "aria-label",
            i === 0
                ? "Afficher l'image"
                : "Afficher la vidéo"
        );

        dot.addEventListener(
            "click",
            () => {
                setPreview(i);
            }
        );

        previewDots.appendChild(
            dot
        );
    }
}


// ============================================================
// PACK CAROUSEL
// ============================================================

function getPackItemName(item) {
    return getFirstValidString(
        item?.name,
        item?.displayName,
        item?.title,
        "Objet Fortnite"
    );
}


function getPackItemType(item) {
    return getFirstValidString(
        item?.type,
        item?.itemType,
        item?.series?.displayName,
        item?.rarity?.displayName,
        "Objet"
    );
}


function renderPackCarousel(items) {
    if (
        !packCarousel ||
        !packCarouselTrack
    ) {
        return;
    }

    packCarouselTrack.innerHTML =
        "";

    items.forEach(
        (item, index) => {
            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "pack-carousel-item";

            const image =
                getItemImage(item);

            const name =
                getPackItemName(item);

            const type =
                getPackItemType(item);

            button.innerHTML = `
                <span
                    class="pack-carousel-number"
                >
                    ${index + 1}/${items.length}
                </span>

                <div
                    class="pack-carousel-image-wrap"
                >
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
                            : `
                                <div
                                    class="pack-carousel-no-image"
                                >
                                    ?
                                </div>
                            `
                    }
                </div>

                <div
                    class="pack-carousel-info"
                >
                    <strong>
                        ${escapeHtml(name)}
                    </strong>

                    <small>
                        ${escapeHtml(type)}
                    </small>
                </div>
            `;

            button.addEventListener(
                "click",
                () => {
                    setPackCarouselItem(
                        index,
                        items
                    );
                }
            );

            packCarouselTrack.appendChild(
                button
            );
        }
    );

    currentPackItemIndex =
        0;

    setPackCarouselItem(
        0,
        items,
        true
    );

    updatePackCarouselButtons();
}


function setPackCarouselItem(
    index,
    items,
    updateMainImage = true
) {
    if (!items?.length) {
        return;
    }

    index = Math.max(
        0,
        Math.min(
            index,
            items.length - 1
        )
    );

    currentPackItemIndex =
        index;

    const buttons =
        packCarouselTrack
            ? packCarouselTrack.querySelectorAll(
                ".pack-carousel-item"
            )
            : [];

    buttons.forEach(
        (
            button,
            buttonIndex
        ) => {
            button.classList.toggle(
                "active",
                buttonIndex ===
                    index
            );
        }
    );

    const selectedItem =
        items[index];

    if (
        selectedItem &&
        updateMainImage
    ) {
        updatePackMainPreview(
            selectedItem
        );
    }

    const activeButton =
        buttons[index];

    if (activeButton) {
        activeButton.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center"
        });
    }

    updatePackCarouselButtons();
}


function updatePackMainPreview(item) {
    const image =
        getItemImage(item);

    if (!image) {
        return;
    }

    previewImage.src =
        image;

    previewImage.alt =
        getPackItemName(item);

    setPreview(0);
}


function updatePackCarouselButtons() {
    if (
        !packCarouselPrev ||
        !packCarouselNext ||
        !currentModalItem
    ) {
        return;
    }

    const items =
        currentModalItem.items ||
        [];

    packCarouselPrev.disabled =
        currentPackItemIndex <= 0;

    packCarouselNext.disabled =
        currentPackItemIndex >=
        items.length - 1;
}


if (packCarouselPrev) {
    packCarouselPrev.addEventListener(
        "click",
        () => {
            if (
                !currentModalItem
            ) {
                return;
            }

            setPackCarouselItem(
                currentPackItemIndex - 1,
                currentModalItem.items
            );
        }
    );
}


if (packCarouselNext) {
    packCarouselNext.addEventListener(
        "click",
        () => {
            if (
                !currentModalItem
            ) {
                return;
            }

            setPackCarouselItem(
                currentPackItemIndex + 1,
                currentModalItem.items
            );
        }
    );
}


// ============================================================
// SWIPE PACK
// ============================================================

let packTouchStartX = 0;
let packTouchEndX = 0;

if (packCarouselTrack) {
    packCarouselTrack.addEventListener(
        "touchstart",
        event => {
            packTouchStartX =
                event.changedTouches[0]
                    .clientX;
        },
        {
            passive: true
        }
    );

    packCarouselTrack.addEventListener(
        "touchend",
        event => {
            packTouchEndX =
                event.changedTouches[0]
                    .clientX;

            const difference =
                packTouchStartX -
                packTouchEndX;

            if (
                Math.abs(
                    difference
                ) < 40
            ) {
                return;
            }

            if (
                !currentModalItem
            ) {
                return;
            }

            if (
                difference > 0
            ) {
                setPackCarouselItem(
                    currentPackItemIndex + 1,
                    currentModalItem.items
                );
            }
            else {
                setPackCarouselItem(
                    currentPackItemIndex - 1,
                    currentModalItem.items
                );
            }
        },
        {
            passive: true
        }
    );
}


// ============================================================
// OPEN MODAL
// ============================================================

async function openModal(item) {
    if (!item) {
        return;
    }

    currentModalItem =
        item;

    currentPackItemIndex =
        0;

    modalName.textContent =
        item.name ||
        "Objet Fortnite";

    modalPrice.textContent =
        item.price !== null &&
        item.price !== undefined
            ? `${item.price} V-Bucks`
            : "Prix indisponible";

    const extraParts = [];

    if (item.itemType) {
        extraParts.push(
            item.itemType
        );
    }

    if (item.rarity &&
        item.rarity !== item.itemType) {
        extraParts.push(
            item.rarity
        );
    }

    if (item.itemCount > 1) {
        extraParts.push(
            `${item.itemCount} objets`
        );
    }

    modalExtra.textContent =
        extraParts.join(" • ");

    modalDescription.textContent =
        item.description ||
        "";

    if (item.image) {
        previewImage.src =
            item.image;

        previewImage.alt =
            item.name;
    }
    else {
        previewImage.removeAttribute(
            "src"
        );

        previewImage.alt =
            "Image indisponible";
    }


    // --------------------------------------------------------
    // PACK
    // --------------------------------------------------------

    if (
        item.isBundle &&
        Array.isArray(item.items) &&
        item.items.length > 0
    ) {
        packCarousel.classList.add(
            "visible"
        );

        renderPackCarousel(
            item.items
        );
    }
    else {
        packCarousel.classList.remove(
            "visible"
        );

        packCarouselTrack.innerHTML =
            "";

        currentPackItemIndex =
            0;
    }


    // --------------------------------------------------------
    // VIDEO RESET
    // --------------------------------------------------------

    hasVideo = false;

    if (previewVideo) {
        previewVideo.pause();

        previewVideo.removeAttribute(
            "src"
        );

        previewVideo.load();
    }

    if (previewVideoSource) {
        previewVideoSource.removeAttribute(
            "src"
        );
    }

    createPreviewDots();

    modal.classList.add(
        "open"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

    setPreview(0);


    // --------------------------------------------------------
    // VIDEO
    // --------------------------------------------------------

    const video =
        await getCosmeticVideo(
            getFirstValidString(
                item.id,
                item.items?.[0]?.id
            )
        );

    if (
        currentModalItem !==
        item
    ) {
        return;
    }

    if (video) {
        hasVideo = true;

        if (previewVideoSource) {
            previewVideoSource.src =
                video;
        }

        if (previewVideo) {
            previewVideo.src =
                video;

            previewVideo.load();
        }

        createPreviewDots();
    }
}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeModal() {
    modal.classList.remove(
        "open"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );

    if (previewVideo) {
        previewVideo.pause();
    }

    currentModalItem =
        null;
}


if (modalClose) {
    modalClose.addEventListener(
        "click",
        closeModal
    );
}


const modalBackdrop =
    modal?.querySelector(
        ".modal-backdrop"
    );

if (modalBackdrop) {
    modalBackdrop.addEventListener(
        "click",
        closeModal
    );
}


// ============================================================
// KEYBOARD
// ============================================================

document.addEventListener(
    "keydown",
    event => {
        if (
            !modal.classList.contains(
                "open"
            )
        ) {
            return;
        }

        if (
            event.key ===
            "Escape"
        ) {
            closeModal();
            return;
        }

        if (
            event.key === "ArrowLeft" &&
            currentModalItem?.isBundle
        ) {
            setPackCarouselItem(
                currentPackItemIndex - 1,
                currentModalItem.items
            );

            return;
        }

        if (
            event.key === "ArrowRight" &&
            currentModalItem?.isBundle
        ) {
            setPackCarouselItem(
                currentPackItemIndex + 1,
                currentModalItem.items
            );
        }
    }
);


// ============================================================
// SWIPE IMAGE / VIDEO
// ============================================================

let previewTouchStartX = 0;
let previewTouchEndX = 0;

if (previewTrack) {
    previewTrack.addEventListener(
        "touchstart",
        event => {
            previewTouchStartX =
                event.changedTouches[0]
                    .clientX;
        },
        {
            passive: true
        }
    );

    previewTrack.addEventListener(
        "touchend",
        event => {
            previewTouchEndX =
                event.changedTouches[0]
                    .clientX;

            const difference =
                previewTouchStartX -
                previewTouchEndX;

            if (
                Math.abs(
                    difference
                ) < 40
            ) {
                return;
            }

            if (
                difference > 0 &&
                hasVideo
            ) {
                setPreview(1);
            }
            else if (
                difference < 0
            ) {
                setPreview(0);
            }
        },
        {
            passive: true
        }
    );
}


// ============================================================
// REFRESH
// ============================================================

if (refreshBtn) {
    refreshBtn.addEventListener(
        "click",
        loadShop
    );
}


// ============================================================
// START
// ============================================================

loadShop();