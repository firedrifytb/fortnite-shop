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
const modalDescription = document.getElementById("modal-description");

const previewTrack = document.getElementById("preview-track");
const previewImage = document.getElementById("preview-image");
const previewVideo = document.getElementById("preview-video");
const previewVideoSource = document.getElementById("preview-video-source");
const previewStatus = document.getElementById("preview-status");
const previewDots = document.getElementById("preview-dots");

const packCarousel = document.getElementById("pack-carousel");
const packCarouselTrack = document.getElementById("pack-carousel-track");
const packCarouselPrev = document.getElementById("pack-carousel-prev");
const packCarouselNext = document.getElementById("pack-carousel-next");

let currentModalItem = null;
let currentPreviewIndex = 0;
let hasVideo = false;
let currentPackItemIndex = 0;


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


// ============================================================
// SHOP DATA
// ============================================================

function getEntryItems(entry) {
    if (Array.isArray(entry?.items) && entry.items.length) {
        return entry.items;
    }

    if (Array.isArray(entry?.brItems) && entry.brItems.length) {
        return entry.brItems;
    }

    if (Array.isArray(entry?.tracks) && entry.tracks.length) {
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

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {
        return null;
    }

    const number = Number(price);

    return Number.isFinite(number)
        ? number
        : null;
}


function getEntryFinalPrice(entry) {
    const price =
        entry?.finalPrice ??
        entry?.price?.finalPrice ??
        entry?.price?.final ??
        entry?.cost;

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {
        return null;
    }

    const number = Number(price);

    return Number.isFinite(number)
        ? number
        : null;
}


function getEntryRegularPrice(entry) {
    const price =
        entry?.regularPrice ??
        entry?.price?.regularPrice ??
        entry?.price?.regular;

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {
        return null;
    }

    const number = Number(price);

    return Number.isFinite(number)
        ? number
        : null;
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
    const entryRegularPrice = getEntryRegularPrice(entry);

    if (
        entryRegularPrice !== null &&
        entryRegularPrice > 0
    ) {
        return entryRegularPrice;
    }

    const itemTotal = getIndividualItemsTotal(items);

    return itemTotal > 0
        ? itemTotal
        : null;
}


function getBundleDiscount(entry, regularPrice, finalPrice) {
    const explicitDiscount =
        entry?.discountAmount ??
        entry?.discount ??
        entry?.discountPercentage;

    if (
        explicitDiscount !== null &&
        explicitDiscount !== undefined
    ) {
        const number = Number(explicitDiscount);

        if (
            Number.isFinite(number) &&
            number > 0
        ) {
            if (number <= 100) {
                return Math.round(number);
            }
        }
    }

    if (
        regularPrice !== null &&
        finalPrice !== null &&
        regularPrice > finalPrice
    ) {
        return Math.round(
            ((regularPrice - finalPrice) / regularPrice) * 100
        );
    }

    return 0;
}


// ============================================================
// NAME / DESCRIPTION
// ============================================================

function getEntryName(entry, items, isBundle) {
    /*
     * IMPORTANT:
     * Si l'offre contient exactement 1 objet,
     * on utilise TOUJOURS le nom de cet objet.
     *
     * Cela évite d'afficher "Pack Fortnite"
     * pour un objet simple.
     */

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
// CONVERSION ENTRY -> SHOP ITEM
// ============================================================

function extractShopItem(entry) {
    const items = getEntryItems(entry);
    const isBundle = isPackEntry(entry, items);

    const finalPrice = getEntryFinalPrice(entry);

    const regularPrice = isBundle
        ? getBundleRegularPrice(entry, items)
        : (
            getEntryRegularPrice(entry) ??
            getItemPrice(items[0])
        );

    const discount = isBundle
        ? getBundleDiscount(
            entry,
            regularPrice,
            finalPrice
        )
        : 0;

    const name = getEntryName(
        entry,
        items,
        isBundle
    );

    const image = isBundle
        ? (
            getBundleImage(entry) ||
            getItemImage(items[0])
        )
        : getItemImage(items[0]);

    const firstItem = items[0] || {};

    const itemType = getFirstValidString(
        firstItem?.type,
        firstItem?.itemType,
        firstItem?.series?.displayName,
        firstItem?.rarity?.displayName
    );

    const rarity = getFirstValidString(
        firstItem?.rarity?.displayName,
        firstItem?.rarity?.value
    );

    const setName = getFirstValidString(
        firstItem?.set?.text,
        firstItem?.set?.name,
        firstItem?.setName
    );

    return {
        id:
            entry?.offerId ||
            entry?.id ||
            entry?.offerID ||
            firstItem?.id ||
            Math.random().toString(36).slice(2),

        name,
        image,

        price: finalPrice,
        regularPrice,
        discount,

        description: getEntryDescription(
            entry,
            items
        ),

        itemType,
        rarity,
        setName,

        isBundle,

        itemCount: items.length,

        items,

        entry
    };
}


// ============================================================
// CATEGORIES
// ============================================================

function getCategoryName(item) {
    if (item.isBundle) {
        return "Packs";
    }

    const type = (
        item.itemType ||
        ""
    ).toLowerCase();

    const name = (
        item.name ||
        ""
    ).toLowerCase();

    if (
        type.includes("music") ||
        type.includes("track") ||
        name.includes("musique")
    ) {
        return "Musique";
    }

    if (
        type.includes("outfit") ||
        type.includes("skin") ||
        type.includes("tenue")
    ) {
        return "Tenues";
    }

    if (
        type.includes("pickaxe") ||
        type.includes("harvesting")
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
        type.includes("emote")
    ) {
        return "Danses";
    }

    if (
        type.includes("backpack") ||
        type.includes("back bling") ||
        type.includes("accessory")
    ) {
        return "Accessoires";
    }

    return "Autres";
}


// ============================================================
// CARD
// ============================================================

function createCard(item, index) {
    const priceHtml =
        item.price !== null
            ? `${escapeHtml(item.price)} V-Bucks`
            : "Prix indisponible";

    let discountHtml = "";

    if (
        item.isBundle &&
        item.discount > 0
    ) {
        discountHtml = `
            <span class="bundle-discount">
                -${escapeHtml(item.discount)}%
            </span>
        `;
    }

    let countHtml = "";

    if (
        item.isBundle &&
        item.itemCount > 0
    ) {
        countHtml = `
            <span class="bundle-count-badge">
                ${escapeHtml(item.itemCount)} OBJET${item.itemCount > 1 ? "S" : ""}
            </span>
        `;
    }

    let oldPriceHtml = "";

    if (
        item.isBundle &&
        item.regularPrice !== null &&
        item.price !== null &&
        item.regularPrice > item.price
    ) {
        oldPriceHtml = `
            <span class="old-price">
                ${escapeHtml(item.regularPrice)} V-Bucks
            </span>
        `;
    }

    const imageHtml = item.image
        ? `
            <img
                src="${escapeHtml(item.image)}"
                alt="${escapeHtml(item.name)}"
                loading="lazy"
            >
        `
        : `
            <div class="shop-card-no-image">
                Image indisponible
            </div>
        `;

    return `
        <article
            class="shop-card ${item.isBundle ? "bundle-card" : ""}"
            data-shop-index="${index}"
            tabindex="0"
            role="button"
            aria-label="Voir ${escapeHtml(item.name)}"
        >
            <div class="shop-card-image">
                ${imageHtml}

                <div class="shop-card-badges">
                    ${discountHtml}
                    ${countHtml}
                </div>
            </div>

            <div class="shop-card-info">
                ${
                    item.itemType
                        ? `
                            <span class="shop-card-type">
                                ${escapeHtml(item.itemType)}
                            </span>
                        `
                        : ""
                }

                <h3>
                    ${escapeHtml(item.name)}
                </h3>

                <div class="shop-card-price">
                    ${oldPriceHtml}
                    <span>
                        ${priceHtml}
                    </span>
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
    sectionClass = ""
) {
    if (!items.length) {
        return "";
    }

    const cards = items
        .map((item, index) =>
            createCard(item, index)
        )
        .join("");

    return `
        <section
            class="shop-group ${escapeHtml(sectionClass)}"
        >
            <div class="shop-group-header">
                <h2>
                    ${escapeHtml(title)}
                </h2>

                <span class="shop-group-count">
                    ${items.length}
                    offre${items.length > 1 ? "s" : ""}
                </span>
            </div>

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
    const items = entries
        .map(extractShopItem)
        .filter(item =>
            item &&
            item.name
        );

    const bundles = [];
    const music = [];
    const categories = new Map();
    const others = [];

    items.forEach(item => {
        if (item.isBundle) {
            bundles.push(item);
            return;
        }

        const category = getCategoryName(item);

        if (category === "Musique") {
            music.push(item);
            return;
        }

        if (
            category === "Autres" ||
            !category
        ) {
            others.push(item);
            return;
        }

        if (!categories.has(category)) {
            categories.set(
                category,
                []
            );
        }

        categories
            .get(category)
            .push(item);
    });

    let html = "";

    if (bundles.length) {
        html += createSection(
            "📦 Packs",
            bundles,
            "bundles-section"
        );
    }

    if (music.length) {
        html += createSection(
            "🎵 Musique",
            music,
            "music-section"
        );
    }

    for (const [
        category,
        categoryItems
    ] of categories) {
        html += createSection(
            category,
            categoryItems
        );
    }

    if (others.length) {
        html += createSection(
            "Autres",
            others,
            "others-section"
        );
    }

    shopEl.innerHTML =
        html ||
        `
            <div class="empty-shop">
                Aucun objet trouvé.
            </div>
        `;


    /*
     * IMPORTANT :
     * Chaque carte reçoit directement l'objet
     * qui lui correspond.
     *
     * On ne cherche plus l'objet en fonction
     * de la position globale du DOM.
     */

    const allSections =
        document.querySelectorAll(
            ".shop-group"
        );

    allSections.forEach(section => {
        const title =
            section
                .querySelector("h2")
                ?.textContent
                ?.trim();

        let sectionItems = [];

        if (title === "📦 Packs") {
            sectionItems = bundles;
        }
        else if (title === "🎵 Musique") {
            sectionItems = music;
        }
        else if (title === "Autres") {
            sectionItems = others;
        }
        else {
            sectionItems =
                categories.get(title) || [];
        }

        const cards =
            section.querySelectorAll(
                ".shop-card"
            );

        cards.forEach((card, index) => {
            const item =
                sectionItems[index];

            if (!item) {
                return;
            }

            card.__shopItem = item;

            card.addEventListener(
                "click",
                () => {
                    openModal(
                        card.__shopItem
                    );
                }
            );

            card.addEventListener(
                "keydown",
                event => {
                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();

                        openModal(
                            card.__shopItem
                        );
                    }
                }
            );
        });
    });
}


// ============================================================
// LOAD SHOP
// ============================================================

async function loadShop() {
    try {
        shopStatus.textContent =
            "Chargement de la boutique…";

        refreshBtn.disabled = true;

        const response =
            await fetch(SHOP_API, {
                cache: "no-store"
            });

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

        if (!Array.isArray(entries)) {
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
            "Impossible de charger la boutique.";

        shopEl.innerHTML = `
            <div class="empty-shop">
                <strong>Impossible de charger la boutique.</strong>
                <br>
                Vérifie ta connexion puis réessaie.
            </div>
        `;
    }
    finally {
        refreshBtn.disabled = false;
    }
}


// ============================================================
// COSMETIC VIDEO
// ============================================================

async function getCosmeticVideo(itemId) {
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
                    cache: "no-store"
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

        return getFirstValidString(
            item?.video,
            item?.videos?.video,
            item?.previewVideo
        ) || null;
    }
    catch (error) {
        console.warn(
            "Impossible de récupérer la vidéo :",
            error
        );

        return null;
    }
}


// ============================================================
// PREVIEW
// ============================================================

function setPreview(index) {
    currentPreviewIndex = index;

    if (
        currentPreviewIndex === 0
    ) {
        previewTrack.style.transform =
            "translateX(0%)";

        previewImage.style.display =
            "block";

        if (previewVideo) {
            previewVideo.pause();
        }

        if (previewStatus) {
            previewStatus.textContent =
                "";
        }
    }
    else if (
        currentPreviewIndex === 1 &&
        hasVideo
    ) {
        previewTrack.style.transform =
            "translateX(-100%)";

        previewImage.style.display =
            "block";

        if (previewVideo) {
            previewVideo.play().catch(() => {});
        }

        if (previewStatus) {
            previewStatus.textContent =
                "";
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

    previewDots.innerHTML = "";

    for (
        let i = 0;
        i < count;
        i++
    ) {
        const dot =
            document.createElement(
                "button"
            );

        dot.type = "button";

        dot.className =
            `preview-dot ${
                i === currentPreviewIndex
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

        previewDots.appendChild(dot);
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


function getPackItemId(item) {
    return getFirstValidString(
        item?.id,
        item?.templateId,
        item?.assetId
    );
}


function renderPackCarousel(items) {
    if (
        !packCarousel ||
        !packCarouselTrack
    ) {
        return;
    }

    packCarouselTrack.innerHTML = "";

    items.forEach(
        (item, index) => {
            const button =
                document.createElement(
                    "button"
                );

            button.type = "button";

            button.className =
                "pack-carousel-item";

            button.dataset.index =
                String(index);

            const image =
                getItemImage(item);

            const name =
                getPackItemName(item);

            const type =
                getPackItemType(item);

            button.innerHTML = `
                <span class="pack-carousel-number">
                    ${index + 1}/${items.length}
                </span>

                <div class="pack-carousel-image">
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
                                <div class="pack-carousel-no-image">
                                    ?
                                </div>
                            `
                    }
                </div>

                <span class="pack-carousel-name">
                    ${escapeHtml(name)}
                </span>

                <span class="pack-carousel-type">
                    ${escapeHtml(type)}
                </span>
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

    currentPackItemIndex = 0;

    setPackCarouselItem(
        0,
        items,
        false
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
        (button, buttonIndex) => {
            button.classList.toggle(
                "active",
                buttonIndex === index
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

    previewImage.src = image;

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
        currentModalItem.items || [];

    const hasMultiple =
        items.length > 1;

    packCarouselPrev.disabled =
        !hasMultiple ||
        currentPackItemIndex <= 0;

    packCarouselNext.disabled =
        !hasMultiple ||
        currentPackItemIndex >=
            items.length - 1;
}


if (packCarouselPrev) {
    packCarouselPrev.addEventListener(
        "click",
        () => {
            if (!currentModalItem) {
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
            if (!currentModalItem) {
                return;
            }

            setPackCarouselItem(
                currentPackItemIndex + 1,
                currentModalItem.items
            );
        }
    );
}


// Swipe du carrousel des objets
let packTouchStartX = 0;
let packTouchEndX = 0;

if (packCarouselTrack) {
    packCarouselTrack.addEventListener(
        "touchstart",
        event => {
            packTouchStartX =
                event.changedTouches[0].clientX;
        },
        {
            passive: true
        }
    );

    packCarouselTrack.addEventListener(
        "touchend",
        event => {
            packTouchEndX =
                event.changedTouches[0].clientX;

            const difference =
                packTouchStartX -
                packTouchEndX;

            if (
                Math.abs(difference) < 40
            ) {
                return;
            }

            if (!currentModalItem) {
                return;
            }

            if (difference > 0) {
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

    currentModalItem = item;
    currentPackItemIndex = 0;

    modalName.textContent =
        item.name || "Objet Fortnite";

    if (
        item.price !== null &&
        item.price !== undefined
    ) {
        modalPrice.textContent =
            `${item.price} V-Bucks`;
    }
    else {
        modalPrice.textContent =
            "Prix indisponible";
    }

    const extraParts = [];

    if (item.itemType) {
        extraParts.push(
            item.itemType
        );
    }

    if (
        item.rarity &&
        item.rarity !== item.itemType
    ) {
        extraParts.push(
            item.rarity
        );
    }

    if (
        item.itemCount > 1
    ) {
        extraParts.push(
            `${item.itemCount} objets`
        );
    }

    modalExtra.textContent =
        extraParts.join(" • ");

    modalDescription.textContent =
        item.description || "";

    // Image principale
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
    // PACK CAROUSEL
    // --------------------------------------------------------

    if (
        item.isBundle &&
        Array.isArray(item.items) &&
        item.items.length > 0
    ) {
        packCarousel.style.display =
            "";

        renderPackCarousel(
            item.items
        );
    }
    else {
        packCarousel.style.display =
            "none";

        packCarouselTrack.innerHTML =
            "";

        currentPackItemIndex = 0;
    }


    // --------------------------------------------------------
    // RESET VIDEO
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

    modal.classList.add("open");

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

    /*
     * L'utilisateur peut fermer le modal
     * pendant que la vidéo charge.
     */
    if (
        currentModalItem !== item
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

    currentModalItem = null;
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
            event.key === "Escape"
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
                event.changedTouches[0].clientX;
        },
        {
            passive: true
        }
    );

    previewTrack.addEventListener(
        "touchend",
        event => {
            previewTouchEndX =
                event.changedTouches[0].clientX;

            const difference =
                previewTouchStartX -
                previewTouchEndX;

            if (
                Math.abs(difference) < 40
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