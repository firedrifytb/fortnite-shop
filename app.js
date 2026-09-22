const SHOP_API = "https://fortnite-api.com/v2/shop?language=fr";
const COSMETIC_API = "https://fortnite-api.com/v2/cosmetics/br/search/ids";

const shopEl = document.getElementById("shop");
const statusEl = document.getElementById("status");
const shopDateEl = document.getElementById("shop-date");
const refreshBtn = document.getElementById("refresh-btn");

const modal = document.getElementById("item-modal");
const modalBackdrop = document.querySelector(".modal-backdrop");
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

let currentModalItem = null;
let currentPreviewIndex = 0;
let hasVideo = false;

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getFirstValidString(values) {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    return "";
}

function getEntryItems(entry) {
    if (Array.isArray(entry?.items)) {
        return entry.items;
    }

    if (Array.isArray(entry?.brItems)) {
        return entry.brItems;
    }

    if (Array.isArray(entry?.tracks)) {
        return entry.tracks;
    }

    if (Array.isArray(entry?.instruments)) {
        return entry.instruments;
    }

    return [];
}

function isPackEntry(entry, items) {
    return items.length > 1 || !!entry?.bundle;
}

function getItemImage(item) {
    return getFirstValidString([
        item?.images?.featured,
        item?.images?.icon,
        item?.images?.smallIcon,
        item?.images?.background,
        item?.image,
        item?.imageUrl
    ]);
}

function getBundleImage(entry) {
    const candidates = [
        entry?.bundle?.image,

        entry?.bundle?.images?.featured,
        entry?.bundle?.images?.full_background,
        entry?.bundle?.images?.background,
        entry?.bundle?.images?.icon,

        entry?.newDisplayAsset?.renderImages?.[0]?.image,
        entry?.newDisplayAsset?.renderImages?.[0]?.url,
        entry?.newDisplayAsset?.image,
        entry?.newDisplayAsset?.url,

        entry?.displayAssets?.[0]?.url,
        entry?.displayAssets?.[0]?.image,
        entry?.displayAssets?.[0]?.renderImages?.[0]?.image,
        entry?.displayAssets?.[0]?.renderImages?.[0]?.url,

        entry?.displayAsset?.renderImages?.[0]?.image,
        entry?.displayAsset?.renderImages?.[0]?.url,
        entry?.displayAsset?.image,
        entry?.displayAsset?.url,

        entry?.image,
        entry?.imageUrl
    ];

    return getFirstValidString(candidates);
}

function getItemPrice(item) {
    const values = [
        item?.price,
        item?.regularPrice,
        item?.finalPrice
    ];

    for (const value of values) {
        const number = Number(value);

        if (Number.isFinite(number) && number > 0) {
            return number;
        }
    }

    return 0;
}

function getEntryFinalPrice(entry) {
    const values = [
        entry?.finalPrice,
        entry?.price?.finalPrice,
        entry?.bundle?.finalPrice,
        entry?.offer?.finalPrice
    ];

    for (const value of values) {
        const number = Number(value);

        if (Number.isFinite(number) && number >= 0) {
            return number;
        }
    }

    return 0;
}

function getEntryRegularPrice(entry) {
    const values = [
        entry?.regularPrice,
        entry?.price?.regularPrice,
        entry?.bundle?.regularPrice,
        entry?.offer?.regularPrice
    ];

    for (const value of values) {
        const number = Number(value);

        if (Number.isFinite(number) && number > 0) {
            return number;
        }
    }

    return 0;
}

function getIndividualItemsTotal(items) {
    return items.reduce((total, item) => {
        return total + getItemPrice(item);
    }, 0);
}

function getBundleRegularPrice(entry, items, finalPrice) {
    const apiRegularPrice = getEntryRegularPrice(entry);
    const individualItemsTotal = getIndividualItemsTotal(items);

    /*
     * Pour un pack :
     *
     * 1. On privilégie le prix régulier fourni par l'API.
     * 2. Si l'API ne fournit pas de prix régulier exploitable,
     *    on additionne les prix individuels.
     * 3. On ne veut jamais afficher un ancien prix inférieur
     *    ou égal au prix du pack.
     */

    if (
        Number.isFinite(apiRegularPrice) &&
        apiRegularPrice > finalPrice
    ) {
        return apiRegularPrice;
    }

    if (
        Number.isFinite(individualItemsTotal) &&
        individualItemsTotal > finalPrice
    ) {
        return individualItemsTotal;
    }

    return apiRegularPrice;
}

function getBundleDiscount(entry, regularPrice, finalPrice) {
    const explicitDiscount = Number(
        entry?.discountAmount ??
        entry?.bundle?.discountAmount ??
        entry?.price?.discountAmount ??
        0
    );

    if (
        Number.isFinite(explicitDiscount) &&
        explicitDiscount > 0
    ) {
        return explicitDiscount;
    }

    if (
        Number.isFinite(regularPrice) &&
        Number.isFinite(finalPrice) &&
        regularPrice > finalPrice
    ) {
        return regularPrice - finalPrice;
    }

    return 0;
}

function getEntryName(entry, items, isBundle) {
    if (isBundle) {
        return getFirstValidString([
            entry?.bundle?.name,
            entry?.bundleName,
            entry?.offerName,
            entry?.name,
            entry?.displayName,
            "Pack Fortnite"
        ]);
    }

    const firstItem = items[0];

    return getFirstValidString([
        firstItem?.name,
        entry?.name,
        entry?.displayName,
        entry?.offerName,
        "Objet Fortnite"
    ]);
}

function getEntryDescription(entry, items) {
    return getFirstValidString([
        entry?.bundle?.description,
        entry?.description,
        entry?.shortDescription,
        items[0]?.description,
        ""
    ]);
}

function extractShopItem(entry) {
    const items = getEntryItems(entry);

    const isBundle = isPackEntry(entry, items);

    const firstItem = items[0] || {};

    const finalPrice = getEntryFinalPrice(entry);

    let regularPrice = getEntryRegularPrice(entry);

    if (isBundle) {
        regularPrice = getBundleRegularPrice(
            entry,
            items,
            finalPrice
        );
    }

    const discount = isBundle
        ? getBundleDiscount(
            entry,
            regularPrice,
            finalPrice
        )
        : 0;

    /*
     * IMPORTANT :
     * Pour un pack, on utilise TOUJOURS l'image globale du pack.
     *
     * On ne prend l'image du premier skin qu'en dernier recours,
     * uniquement si l'API ne fournit aucune image globale.
     */
    let image = "";

    if (isBundle) {
        image = getBundleImage(entry);

        if (!image) {
            image = getItemImage(firstItem);
        }
    } else {
        image = getItemImage(firstItem);
    }

    const itemCount = items.length;

    const itemType = getFirstValidString([
        firstItem?.type?.displayValue,
        firstItem?.type?.value,
        firstItem?.type,
        entry?.type,
        "Objet"
    ]);

    const id = getFirstValidString([
        firstItem?.id,
        entry?.offerId,
        entry?.id
    ]);

    const rarity = getFirstValidString([
        firstItem?.rarity?.displayValue,
        firstItem?.rarity?.value,
        firstItem?.rarity,
        ""
    ]);

    const setName = getFirstValidString([
        firstItem?.set?.text,
        firstItem?.set?.value,
        ""
    ]);

    return {
        id,
        name: getEntryName(entry, items, isBundle),
        image,
        price: finalPrice,
        regularPrice,
        discount,
        description: getEntryDescription(entry, items),
        itemType,
        rarity,
        setName,
        isBundle,
        itemCount,
        items,
        entry
    };
}

function getCategoryName(item) {
    if (item.isBundle) {
        return "Packs";
    }

    const type = String(item.itemType || "").toLowerCase();

    if (
        type.includes("musique") ||
        type.includes("music") ||
        type.includes("jam")
    ) {
        return "Musique";
    }

    if (
        type.includes("tenue") ||
        type.includes("outfit") ||
        type.includes("skin")
    ) {
        return "Tenues";
    }

    if (
        type.includes("pioche") ||
        type.includes("pickaxe")
    ) {
        return "Pioche";
    }

    if (
        type.includes("planeur") ||
        type.includes("glider")
    ) {
        return "Planeurs";
    }

    if (
        type.includes("revêtement") ||
        type.includes("wrap")
    ) {
        return "Revêtements";
    }

    if (
        type.includes("emote") ||
        type.includes("emote")
    ) {
        return "Emotes";
    }

    if (
        type.includes("accessoire") ||
        type.includes("back bling") ||
        type.includes("accessoire de dos")
    ) {
        return "Accessoires";
    }

    return "Autres";
}

function createSection(title, items, sectionClass = "") {
    if (!items.length) {
        return "";
    }

    return `
        <section class="shop-group ${sectionClass}">
            <div class="shop-group-header">
                <div>
                    <h2>${escapeHtml(title)}</h2>
                    <span>${items.length} offre${items.length > 1 ? "s" : ""}</span>
                </div>
            </div>

            <div class="shop-grid">
                ${items.map((item, index) => createCard(item, index)).join("")}
            </div>
        </section>
    `;
}

function createCard(item, index) {
    const safeName = escapeHtml(item.name);
    const safeImage = escapeHtml(item.image);

    let priceHtml = "";

    if (item.price > 0) {
        if (
            item.isBundle &&
            item.regularPrice > item.price
        ) {
            priceHtml = `
                <div class="card-price">
                    <span class="old-price">
                        ${item.regularPrice.toLocaleString("fr-FR")} V-Bucks
                    </span>

                    <span class="bundle-price">
                        ${item.price.toLocaleString("fr-FR")} V-Bucks
                    </span>
                </div>
            `;
        } else {
            priceHtml = `
                <div class="card-price">
                    ${item.price.toLocaleString("fr-FR")} V-Bucks
                </div>
            `;
        }
    } else {
        priceHtml = `
            <div class="card-price">
                Prix indisponible
            </div>
        `;
    }

    const discountBadge =
        item.isBundle && item.discount > 0
            ? `
                <span class="bundle-discount">
                    ${item.discount.toLocaleString("fr-FR")} V-BUCKS DE RÉDUC.
                </span>
            `
            : "";

    const countBadge =
        item.isBundle
            ? `
                <span class="bundle-count-badge">
                    ${item.itemCount} OBJET${item.itemCount > 1 ? "S" : ""}
                </span>
            `
            : "";

    return `
        <article
            class="shop-card ${item.isBundle ? "bundle-card" : ""}"
            data-index="${index}"
            tabindex="0"
            role="button"
            aria-label="Voir ${safeName}"
        >
            <div class="card-image-wrapper">
                ${
                    safeImage
                        ? `
                            <img
                                class="card-image"
                                src="${safeImage}"
                                alt="${safeName}"
                                loading="lazy"
                            >
                        `
                        : `
                            <div class="card-image-fallback">
                                IMAGE
                            </div>
                        `
                }

                <div class="card-badges">
                    ${discountBadge}
                    ${countBadge}
                </div>
            </div>

            <div class="card-info">
                <div class="card-type">
                    ${escapeHtml(item.itemType)}
                </div>

                <h3>${safeName}</h3>

                ${priceHtml}
            </div>
        </article>
    `;
}

function renderShop(entries) {
    const items = entries
        .map(extractShopItem)
        .filter(item => item && item.name);

    /*
     * IMPORTANT :
     * Les packs restent chacun une offre séparée.
     *
     * On ne fait PAS :
     * bundleName -> plusieurs objets
     *
     * On garde :
     * une entrée API = une carte.
     */

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
            categories.set(category, []);
        }

        categories.get(category).push(item);
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

    for (const [category, categoryItems] of categories) {
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

    shopEl.innerHTML = html || `
        <div class="empty-shop">
            Aucun objet trouvé.
        </div>
    `;

    document.querySelectorAll(".shop-card").forEach(card => {
        card.addEventListener("click", () => {
            const section = card.closest(".shop-group");
            const cards = Array.from(
                section.querySelectorAll(".shop-card")
            );

            const index = cards.indexOf(card);

            const sectionItems = getSectionItems(
                section,
                items
            );

            const selectedItem = sectionItems[index];

            if (selectedItem) {
                openModal(selectedItem);
            }
        });

        card.addEventListener("keydown", event => {
            if (
                event.key === "Enter" ||
                event.key === " "
            ) {
                event.preventDefault();
                card.click();
            }
        });
    });
}

function getSectionItems(section, allItems) {
    const sectionTitle =
        section
            .querySelector("h2")
            ?.textContent
            ?.trim()
            ?.replace("📦 ", "");

    if (sectionTitle === "Packs") {
        return allItems.filter(item => item.isBundle);
    }

    if (sectionTitle === "Musique") {
        return allItems.filter(
            item => !item.isBundle &&
                getCategoryName(item) === "Musique"
        );
    }

    return allItems.filter(item => {
        if (item.isBundle) {
            return false;
        }

        const category = getCategoryName(item);

        return category === sectionTitle;
    });
}

async function loadShop() {
    try {
        statusEl.textContent = "Chargement de la boutique…";

        refreshBtn.disabled = true;

        const response = await fetch(
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

        const json = await response.json();

        const data = json?.data ?? json;

        const entries =
            data?.entries ||
            data?.shop ||
            data?.data?.entries ||
            data?.data?.shop ||
            [];

        if (!Array.isArray(entries)) {
            throw new Error(
                "Format de boutique inattendu."
            );
        }

        renderShop(entries);

        const shopDate =
            data?.date ||
            data?.shopDate ||
            data?.lastUpdate ||
            null;

        if (shopDate) {
            const date = new Date(shopDate);

            if (!Number.isNaN(date.getTime())) {
                shopDateEl.textContent =
                    `Actualisée le ${date.toLocaleString(
                        "fr-FR",
                        {
                            dateStyle: "medium",
                            timeStyle: "short"
                        }
                    )}`;
            }
        }

        statusEl.textContent =
            `${entries.length} offres chargées.`;
    } catch (error) {
        console.error(error);

        statusEl.textContent =
            "Impossible de charger la boutique.";

        shopEl.innerHTML = `
            <div class="error-shop">
                <h2>Erreur</h2>
                <p>
                    La boutique Fortnite n'a pas pu être chargée.
                </p>
                <button
                    type="button"
                    id="retry-btn"
                    class="retry-btn"
                >
                    Réessayer
                </button>
            </div>
        `;

        document
            .getElementById("retry-btn")
            ?.addEventListener(
                "click",
                loadShop
            );
    } finally {
        refreshBtn.disabled = false;
    }
}

async function getCosmeticVideo(itemId) {
    if (!itemId) {
        return "";
    }

    try {
        const response = await fetch(
            `${COSMETIC_API}?id=${encodeURIComponent(itemId)}&language=fr`,
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            return "";
        }

        const json = await response.json();

        const item =
            json?.data?.[0] ||
            json?.data ||
            null;

        if (!item) {
            return "";
        }

        return getFirstValidString([
            item?.video,
            item?.videos?.video,
            item?.previewVideo
        ]);
    } catch {
        return "";
    }
}

function setPreview(index) {
    currentPreviewIndex = index;

    if (!hasVideo) {
        index = 0;
        currentPreviewIndex = 0;
    }

    previewTrack.style.transform =
        `translateX(-${index * 100}%)`;

    previewDots
        .querySelectorAll(".preview-dot")
        .forEach((dot, dotIndex) => {
            dot.classList.toggle(
                "active",
                dotIndex === index
            );
        });

    if (index === 1 && hasVideo) {
        previewVideo
            .play()
            .catch(() => {});
    } else {
        previewVideo.pause();
    }
}

function createPreviewDots() {
    previewDots.innerHTML = "";

    const count = hasVideo ? 2 : 1;

    for (let i = 0; i < count; i++) {
        const dot = document.createElement("button");

        dot.type = "button";
        dot.className =
            `preview-dot ${i === 0 ? "active" : ""}`;

        dot.setAttribute(
            "aria-label",
            `Afficher ${i === 0 ? "l'image" : "la vidéo"}`
        );

        dot.addEventListener(
            "click",
            () => setPreview(i)
        );

        previewDots.appendChild(dot);
    }
}

async function openModal(item) {
    currentModalItem = item;

    modalName.textContent = item.name;

    if (item.price > 0) {
        if (
            item.isBundle &&
            item.regularPrice > item.price
        ) {
            modalPrice.innerHTML = `
                <span class="modal-old-price">
                    ${item.regularPrice.toLocaleString("fr-FR")} V-Bucks
                </span>

                <span class="modal-new-price">
                    ${item.price.toLocaleString("fr-FR")} V-Bucks
                </span>
            `;
        } else {
            modalPrice.textContent =
                `${item.price.toLocaleString("fr-FR")} V-Bucks`;
        }
    } else {
        modalPrice.textContent =
            "Prix indisponible";
    }

    if (item.isBundle) {
        modalExtra.textContent =
            `${item.itemCount} objet${item.itemCount > 1 ? "s" : ""}`;
    } else {
        modalExtra.textContent =
            item.rarity || item.itemType || "";
    }

    modalDescription.textContent =
        item.description || "";

    previewImage.src = item.image || "";
    previewImage.alt = item.name;

    previewVideo.pause();
    previewVideo.removeAttribute("src");
    previewVideoSource.removeAttribute("src");

    hasVideo = false;

    previewStatus.textContent =
        "Recherche d'une vidéo…";

    modal.classList.add("open");
    document.body.classList.add("modal-open");

    setPreview(0);

    const videoUrl =
        await getCosmeticVideo(item.id);

    if (
        currentModalItem !== item ||
        !modal.classList.contains("open")
    ) {
        return;
    }

    if (videoUrl) {
        hasVideo = true;

        previewVideoSource.src = videoUrl;
        previewVideo.load();

        previewStatus.textContent =
            "Vidéo disponible";

        createPreviewDots();
    } else {
        hasVideo = false;

        previewStatus.textContent =
            "Aucune vidéo disponible";

        createPreviewDots();
    }

    setPreview(0);
}

function closeModal() {
    modal.classList.remove("open");
    document.body.classList.remove("modal-open");

    previewVideo.pause();

    currentModalItem = null;
}

modalClose?.addEventListener(
    "click",
    closeModal
);

modalBackdrop?.addEventListener(
    "click",
    closeModal
);

document.addEventListener(
    "keydown",
    event => {
        if (
            event.key === "Escape" &&
            modal.classList.contains("open")
        ) {
            closeModal();
        }
    }
);

/*
 * SWIPE
 *
 * Même lorsqu'il n'y a PAS de vidéo,
 * le geste reste actif.
 */
previewTrack?.addEventListener(
    "touchstart",
    event => {
        const touch = event.changedTouches[0];

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    },
    {
        passive: true
    }
);

previewTrack?.addEventListener(
    "touchend",
    event => {
        const touch = event.changedTouches[0];

        touchEndX = touch.clientX;
        touchEndY = touch.clientY;

        const deltaX =
            touchEndX - touchStartX;

        const deltaY =
            touchEndY - touchStartY;

        /*
         * On ne déclenche le swipe que si
         * le mouvement est principalement horizontal.
         */
        if (
            Math.abs(deltaX) < 45 ||
            Math.abs(deltaX) < Math.abs(deltaY)
        ) {
            return;
        }

        if (
            deltaX < 0 &&
            currentPreviewIndex < (hasVideo ? 1 : 0)
        ) {
            setPreview(currentPreviewIndex + 1);
        }

        if (
            deltaX > 0 &&
            currentPreviewIndex > 0
        ) {
            setPreview(currentPreviewIndex - 1);
        }
    },
    {
        passive: true
    }
);

refreshBtn?.addEventListener(
    "click",
    loadShop
);

loadShop();