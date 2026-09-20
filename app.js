/* =========================================================
   FORTNITE SHOP
   ========================================================= */

const SHOP_API =
    "https://fortnite-api.com/v2/shop?language=fr";

const COSMETIC_API =
    "https://fortnite-api.com/v2/cosmetics/br/search/ids";

// =========================================================
// DOM
// =========================================================

const shopElement =
    document.getElementById("shop");

const statusElement =
    document.getElementById("status");

const dateElement =
    document.getElementById("date");

const modal =
    document.getElementById("item-modal");

const modalMedia =
    document.getElementById("modal-media");

const modalClose =
    document.getElementById("modal-close");

const modalName =
    document.getElementById("modal-name");

const modalPrice =
    document.getElementById("modal-price");

const modalExtraInfo =
    document.getElementById("modal-extra-info");

const modalDescription =
    document.getElementById("modal-description");

const previewTrack =
    document.getElementById("preview-track");

const modalVideo =
    document.getElementById("modal-video");

const modalImage =
    document.getElementById("modal-image");

const previewStatus =
    document.getElementById("preview-status");

const carouselDots =
    document.getElementById("carousel-dots");

const videoFallback =
    document.getElementById("video-fallback");

// =========================================================
// ÉTAT
// =========================================================

let currentItem = null;

let currentSlide = 0;

let hasVideo = false;

let currentVideoUrl = null;

// Swipe / pointer
let pointerStartX = 0;
let pointerStartY = 0;
let pointerCurrentX = 0;

let isDragging = false;
let swipeDirectionLocked = false;
let activePointerId = null;

// =========================================================
// DATE
// =========================================================

function updateDate() {

    const now = new Date();

    dateElement.textContent =
        now.toLocaleDateString(
            "fr-FR",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );
}

// =========================================================
// CHARGER LA BOUTIQUE
// =========================================================

async function loadShop() {

    updateDate();

    shopElement.innerHTML = "";

    statusElement.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <span>Chargement de la boutique...</span>
        </div>
    `;

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
                `Erreur HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        const entries =
            data?.data?.entries ||
            data?.data?.shop ||
            data?.entries ||
            data?.shop ||
            [];

        if (
            !Array.isArray(entries) ||
            entries.length === 0
        ) {

            throw new Error(
                "Aucun objet trouvé."
            );
        }

        renderShop(entries);

        statusElement.innerHTML = `
            <div class="loaded-status">
                <span class="loaded-dot"></span>
                Boutique chargée
            </div>
        `;

    } catch (error) {

        console.error(
            "Erreur boutique :",
            error
        );

        statusElement.innerHTML = `
            <div class="error-status">
                Impossible de charger la boutique.

                <button
                    type="button"
                    onclick="loadShop()"
                >
                    Réessayer
                </button>
            </div>
        `;
    }
}

// =========================================================
// RENDU SHOP
// =========================================================

function renderShop(entries) {

    shopElement.innerHTML = "";

    entries.forEach(
        (entry, index) => {

            const item =
                extractShopItem(entry);

            if (!item) {
                return;
            }

            const card =
                createCard(
                    item,
                    index
                );

            shopElement.appendChild(card);
        }
    );
}

// =========================================================
// EXTRACTION OBJET
// =========================================================

function extractShopItem(entry) {

    if (!entry) {
        return null;
    }

    /*
     * IMPORTANT :
     * Certains objets de la boutique sont dans brItems,
     * mais les musiques peuvent être dans "tracks".
     */

    let item = null;

    let itemCategory = "";

    if (
        Array.isArray(entry.brItems) &&
        entry.brItems.length > 0
    ) {

        item =
            entry.brItems[0];

        itemCategory =
            "br";

    } else if (
        Array.isArray(entry.items) &&
        entry.items.length > 0
    ) {

        item =
            entry.items[0];

        itemCategory =
            "item";

    } else if (
        Array.isArray(entry.tracks) &&
        entry.tracks.length > 0
    ) {

        item =
            entry.tracks[0];

        itemCategory =
            "track";

    } else if (
        Array.isArray(entry.instruments) &&
        entry.instruments.length > 0
    ) {

        item =
            entry.instruments[0];

        itemCategory =
            "instrument";

    } else if (
        entry.brItems &&
        typeof entry.brItems === "object"
    ) {

        item =
            entry.brItems;

        itemCategory =
            "br";

    } else if (
        entry.items &&
        typeof entry.items === "object"
    ) {

        item =
            entry.items;

        itemCategory =
            "item";

    } else {

        item =
            null;
    }

    // =====================================================
    // ID
    // =====================================================

    const id =
        item?.id ||
        entry?.id ||
        entry?.offerId ||
        null;

    // =====================================================
    // NOM
    // =====================================================

    const name =
        item?.name ||
        item?.title ||
        entry?.displayName ||
        entry?.name ||
        "Objet Fortnite";

    // =====================================================
    // DESCRIPTION
    // =====================================================

    const description =
        item?.description ||
        entry?.description ||
        "";

    // =====================================================
    // IMAGE
    // =====================================================

    const image =
        item?.images?.featured ||
        item?.images?.icon ||
        item?.images?.smallIcon ||
        item?.images?.full_background ||
        item?.images?.background ||
        item?.albumArt ||
        item?.albumArtUrl ||
        entry?.newDisplayAsset?.renderImages?.[0]?.image ||
        entry?.bundle?.image ||
        entry?.tracks?.[0]?.albumArt ||
        entry?.tracks?.[0]?.images?.icon ||
        null;

    // =====================================================
    // PRIX
    // =====================================================

    const price =
        entry?.finalPrice ??
        entry?.regularPrice ??
        entry?.price?.finalPrice ??
        item?.price ??
        0;

    // =====================================================
    // RARETÉ
    // =====================================================

    const rarity =
        item?.rarity?.displayValue ||
        item?.rarity?.value ||
        entry?.rarity?.displayValue ||
        entry?.rarity?.value ||
        "";

    // =====================================================
    // TYPE
    // =====================================================

    let type = "";

    /*
     * Une entrée contenant "tracks" est une musique.
     * On le traite AVANT item.type pour éviter
     * "Objet Fortnite".
     */

    if (
        itemCategory === "track" ||
        (
            Array.isArray(entry.tracks) &&
            entry.tracks.length > 0
        )
    ) {

        type =
            "Musique";

    } else if (
        itemCategory === "instrument"
    ) {

        type =
            "Instrument";

    } else {

        const rawType =
            item?.type?.displayValue ||
            item?.type?.value ||
            item?.displayType ||
            entry?.type?.displayValue ||
            entry?.type?.value ||
            entry?.displayType ||
            "";

        type =
            normalizeItemType(
                rawType
            );
    }

    // =====================================================
    // SÉRIE
    // =====================================================

    const series =
        item?.series?.name ||
        item?.series?.value ||
        "";

    return {
        id,
        name,
        description,
        image,
        price,
        rarity,
        type,
        series,
        raw: entry,
        cosmetic: item,
        category: itemCategory
    };
}

// =========================================================
// NORMALISER LE TYPE
// =========================================================

function normalizeItemType(rawType) {

    if (!rawType) {
        return "";
    }

    const value =
        String(rawType)
            .trim()
            .toLowerCase();

    if (
        value.includes("music") ||
        value.includes("musique") ||
        value.includes("jam track") ||
        value.includes("track")
    ) {

        return "Musique";
    }

    if (
        value === "outfit" ||
        value.includes("tenue")
    ) {

        return "Tenue";
    }

    if (
        value === "pickaxe" ||
        value.includes("pioche") ||
        value.includes("harvesting tool")
    ) {

        return "Pioche";
    }

    if (
        value === "glider" ||
        value.includes("planeur")
    ) {

        return "Planeur";
    }

    if (
        value === "emote" ||
        value.includes("emote") ||
        value.includes("danse")
    ) {

        return "Emote";
    }

    if (
        value === "wrap" ||
        value.includes("wrap") ||
        value.includes("revêtement")
    ) {

        return "Revêtement";
    }

    if (
        value === "backpack" ||
        value === "back bling" ||
        value.includes("dos")
    ) {

        return "Dos";
    }

    if (
        value.includes("spray") ||
        value.includes("graffiti")
    ) {

        return "Aérosol";
    }

    if (
        value.includes("loading screen") ||
        value.includes("écran de chargement")
    ) {

        return "Écran de chargement";
    }

    if (
        value.includes("banner") ||
        value.includes("bannière")
    ) {

        return "Bannière";
    }

    return rawType;
}

// =========================================================
// CARTE
// =========================================================

function createCard(item, index) {

    const card =
        document.createElement("article");

    card.className =
        "card";

    card.style.animationDelay =
        `${Math.min(index * 35, 500)}ms`;

    const imageContainer =
        document.createElement("div");

    imageContainer.className =
        "card-image";

    if (item.image) {

        const image =
            document.createElement("img");

        image.src =
            item.image;

        image.alt =
            item.name;

        image.loading =
            "lazy";

        image.decoding =
            "async";

        image.onerror = () => {

            console.warn(
                "Image impossible à charger :",
                item.image
            );

            image.remove();
        };

        imageContainer.appendChild(
            image
        );
    }

    const overlay =
        document.createElement("div");

    overlay.className =
        "card-overlay";

    const info =
        document.createElement("div");

    info.className =
        "card-info";

    const name =
        document.createElement("h3");

    name.textContent =
        item.name;

    const bottom =
        document.createElement("div");

    bottom.className =
        "card-bottom";

    const price =
        document.createElement("div");

    price.className =
        "price";

    price.innerHTML = `
        ${formatPrice(item.price)}
        <span class="vbucks-symbol">V</span>
    `;

    bottom.appendChild(
        price
    );

    info.appendChild(
        name
    );

    info.appendChild(
        bottom
    );

    overlay.appendChild(
        info
    );

    imageContainer.appendChild(
        overlay
    );

    card.appendChild(
        imageContainer
    );

    card.addEventListener(
        "click",
        () => openModal(item)
    );

    return card;
}

// =========================================================
// PRIX
// =========================================================

function formatPrice(price) {

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {
        return "—";
    }

    const number =
        Number(price);

    if (Number.isNaN(number)) {
        return String(price);
    }

    return number.toLocaleString(
        "fr-FR"
    );
}

// =========================================================
// OUVRIR MODALE
// =========================================================

async function openModal(item) {

    currentItem =
        item;

    currentSlide =
        0;

    hasVideo =
        false;

    currentVideoUrl =
        null;

    isDragging =
        false;

    swipeDirectionLocked =
        false;

    activePointerId =
        null;

    document.body.classList.add(
        "modal-open"
    );

    modal.classList.add(
        "open"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    modalName.textContent =
        item.name;

    modalPrice.innerHTML = `
        ${formatPrice(item.price)}
        <span class="vbucks-symbol">V</span>
    `;

    modalDescription.textContent =
        item.description || "";

    const extraParts = [];

    if (item.type) {
        extraParts.push(item.type);
    }

    if (item.rarity) {
        extraParts.push(item.rarity);
    }

    if (item.series) {
        extraParts.push(item.series);
    }

    modalExtraInfo.textContent =
        extraParts.join(" • ");

    modalImage.src =
        item.image || "";

    modalImage.alt =
        item.name;

    resetVideo();

    createDots();

    updateSlide(
        0,
        false
    );

    if (!item.id) {
        return;
    }

    /*
     * Les musiques / tracks ne sont pas forcément
     * récupérables via l'endpoint BR.
     *
     * On ne cherche donc la vidéo que pour
     * les cosmétiques BR classiques.
     */

    if (
        item.category === "track" ||
        item.category === "instrument"
    ) {

        return;
    }

    try {

        const cosmetic =
            await fetchCosmetic(
                item.id
            );

        if (
            currentItem !== item ||
            !modal.classList.contains("open")
        ) {
            return;
        }

        const videoUrl =
            findDirectVideo(
                cosmetic
            );

        if (videoUrl) {

            hasVideo =
                true;

            currentVideoUrl =
                videoUrl;

            loadDirectVideo(
                videoUrl
            );

            previewStatus.textContent =
                "APERÇU ANIMÉ";

        } else {

            hasVideo =
                false;

            previewStatus.textContent =
                "APERÇU";

            resetVideo();
        }

        createDots();

        updateSlide(
            currentSlide,
            false
        );

    } catch (error) {

        console.warn(
            "Impossible de récupérer la vidéo :",
            error
        );

        hasVideo =
            false;

        resetVideo();

        previewStatus.textContent =
            "APERÇU";

        createDots();

        updateSlide(
            0,
            false
        );
    }
}

// =========================================================
// FERMER
// =========================================================

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

    resetVideo();

    currentItem =
        null;

    isDragging =
        false;

    activePointerId =
        null;
}

// =========================================================
// RESET VIDÉO
// =========================================================

function resetVideo() {

    modalVideo.pause();

    modalVideo.removeAttribute(
        "src"
    );

    modalVideo.load();

    modalVideo.style.display =
        "none";

    videoFallback.classList.remove(
        "visible"
    );

    currentVideoUrl =
        null;
}

// =========================================================
// RÉCUPÉRATION COSMÉTIQUE
// =========================================================

async function fetchCosmetic(id) {

    const url =
        `${COSMETIC_API}?language=fr&id=${encodeURIComponent(id)}`;

    const response =
        await fetch(
            url,
            {
                cache: "no-store"
            }
        );

    if (!response.ok) {

        throw new Error(
            `Erreur cosmétique HTTP ${response.status}`
        );
    }

    const data =
        await response.json();

    return (
        data?.data?.[0] ||
        data?.data ||
        null
    );
}

// =========================================================
// TROUVER UNE VRAIE VIDÉO DIRECTE
// =========================================================

function findDirectVideo(cosmetic) {

    if (!cosmetic) {
        return null;
    }

    const candidates = [

        cosmetic.showcase_video_url,

        cosmetic.showcaseVideoUrl,

        cosmetic.showcase_video,

        cosmetic.showcaseVideo

    ];

    for (const candidate of candidates) {

        if (
            typeof candidate !== "string"
        ) {
            continue;
        }

        const value =
            candidate.trim();

        if (!value) {
            continue;
        }

        if (
            isDirectVideoUrl(value)
        ) {
            return value;
        }
    }

    return null;
}

// =========================================================
// VÉRIFIER URL VIDÉO
// =========================================================

function isDirectVideoUrl(value) {

    try {

        const url =
            new URL(value);

        if (
            url.protocol !== "https:" &&
            url.protocol !== "http:"
        ) {
            return false;
        }

        const pathname =
            url.pathname.toLowerCase();

        const extensions = [
            ".mp4",
            ".webm",
            ".mov",
            ".m4v",
            ".ogv"
        ];

        return extensions.some(
            extension =>
                pathname.endsWith(extension)
        );

    } catch {

        return false;
    }
}

// =========================================================
// CHARGER VIDÉO DIRECTE
// =========================================================

function loadDirectVideo(url) {

    resetVideo();

    if (
        !isDirectVideoUrl(url)
    ) {
        return;
    }

    currentVideoUrl =
        url;

    modalVideo.style.display =
        "block";

    modalVideo.muted =
        true;

    modalVideo.autoplay =
        true;

    modalVideo.loop =
        true;

    modalVideo.playsInline =
        true;

    modalVideo.src =
        url;

    modalVideo.load();

    const playPromise =
        modalVideo.play();

    if (
        playPromise &&
        typeof playPromise.catch === "function"
    ) {

        playPromise.catch(
            error => {

                console.warn(
                    "Lecture vidéo impossible :",
                    error
                );

                showVideoFallback();
            }
        );
    }
}

// =========================================================
// FALLBACK VIDÉO
// =========================================================

function showVideoFallback() {

    modalVideo.style.display =
        "none";

    videoFallback.classList.add(
        "visible"
    );
}

// =========================================================
// POINTS
// =========================================================

function createDots() {

    carouselDots.innerHTML =
        "";

    const count =
        hasVideo
            ? 2
            : 1;

    for (
        let i = 0;
        i < count;
        i++
    ) {

        const dot =
            document.createElement(
                "button"
            );

        dot.className =
            "carousel-dot";

        if (
            i === currentSlide
        ) {

            dot.classList.add(
                "active"
            );
        }

        dot.setAttribute(
            "aria-label",
            i === 0 && hasVideo
                ? "Afficher la vidéo"
                : "Afficher l'image"
        );

        dot.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                goToSlide(i);
            }
        );

        carouselDots.appendChild(
            dot
        );
    }
}

// =========================================================
// CHANGER SLIDE
// =========================================================

function goToSlide(index) {

    if (!hasVideo) {

        currentSlide =
            0;

    } else {

        currentSlide =
            Math.max(
                0,
                Math.min(
                    1,
                    index
                )
            );
    }

    updateSlide(
        currentSlide,
        true
    );
}

// =========================================================
// UPDATE SLIDE
// =========================================================

function updateSlide(
    index,
    animate = true
) {

    if (!hasVideo) {
        index = 0;
    }

    index =
        Math.max(
            0,
            Math.min(
                hasVideo ? 1 : 0,
                index
            )
        );

    currentSlide =
        index;

    previewTrack.style.transition =
        animate
            ? "transform 0.35s cubic-bezier(.22,.61,.36,1)"
            : "none";

    previewTrack.style.transform =
        `translate3d(-${index * 50}%, 0, 0)`;

    const dots =
        carouselDots.querySelectorAll(
            ".carousel-dot"
        );

    dots.forEach(
        (dot, dotIndex) => {

            dot.classList.toggle(
                "active",
                dotIndex === index
            );
        }
    );

    if (index === 0) {

        previewStatus.textContent =
            hasVideo
                ? "APERÇU ANIMÉ"
                : "APERÇU";

        playCurrentVideo();

    } else {

        previewStatus.textContent =
            "IMAGE";

        pauseCurrentVideo();
    }
}

// =========================================================
// PLAY VIDÉO
// =========================================================

function playCurrentVideo() {

    if (
        !hasVideo ||
        !currentVideoUrl
    ) {
        return;
    }

    modalVideo.style.display =
        "block";

    modalVideo.muted =
        true;

    const promise =
        modalVideo.play();

    if (
        promise &&
        typeof promise.catch === "function"
    ) {

        promise.catch(
            () => {}
        );
    }
}

// =========================================================
// PAUSE VIDÉO
// =========================================================

function pauseCurrentVideo() {

    modalVideo.pause();
}

// =========================================================
// POINTER DOWN
// =========================================================

function handlePointerDown(event) {

    if (
        !modal.classList.contains("open") ||
        !hasVideo
    ) {
        return;
    }

    /*
     * On ne déclenche le swipe qu'avec
     * le doigt / stylet.
     */

    if (
        event.pointerType === "mouse"
    ) {
        return;
    }

    activePointerId =
        event.pointerId;

    pointerStartX =
        event.clientX;

    pointerStartY =
        event.clientY;

    pointerCurrentX =
        event.clientX;

    isDragging =
        true;

    swipeDirectionLocked =
        false;

    previewTrack.style.transition =
        "none";

    try {

        modalMedia.setPointerCapture(
            event.pointerId
        );

    } catch {
        // Rien
    }
}

// =========================================================
// POINTER MOVE
// =========================================================

function handlePointerMove(event) {

    if (
        !isDragging ||
        event.pointerId !== activePointerId
    ) {
        return;
    }

    pointerCurrentX =
        event.clientX;

    const deltaX =
        pointerCurrentX -
        pointerStartX;

    const deltaY =
        event.clientY -
        pointerStartY;

    /*
     * On attend quelques pixels avant
     * de décider si le geste est horizontal.
     */

    if (
        !swipeDirectionLocked
    ) {

        if (
            Math.abs(deltaX) < 8 &&
            Math.abs(deltaY) < 8
        ) {
            return;
        }

        if (
            Math.abs(deltaY) >
            Math.abs(deltaX)
        ) {

            swipeDirectionLocked =
                true;

            isDragging =
                false;

            previewTrack.style.transition =
                "transform 0.25s ease";

            previewTrack.style.transform =
                `translate3d(-${currentSlide * 50}%, 0, 0)`;

            return;
        }

        swipeDirectionLocked =
            true;
    }

    /*
     * Le geste est horizontal.
     */

    event.preventDefault();

    const width =
        modalMedia.clientWidth;

    if (
        width <= 0
    ) {
        return;
    }

    /*
     * Une slide = 50% du track.
     */

    const movementPercent =
        (deltaX / width) * 50;

    const basePosition =
        currentSlide * 50;

    let position =
        basePosition - movementPercent;

    /*
     * Résistance aux extrémités.
     */

    if (
        position < 0
    ) {

        position =
            position * 0.18;
    }

    if (
        position > 50
    ) {

        position =
            50 +
            (position - 50) * 0.18;
    }

    previewTrack.style.transform =
        `translate3d(-${position}%, 0, 0)`;
}

// =========================================================
// POINTER UP
// =========================================================

function handlePointerUp(event) {

    if (
        !isDragging ||
        event.pointerId !== activePointerId
    ) {
        return;
    }

    const deltaX =
        pointerCurrentX -
        pointerStartX;

    const width =
        modalMedia.clientWidth;

    const threshold =
        Math.max(
            45,
            width * 0.15
        );

    isDragging =
        false;

    activePointerId =
        null;

    /*
     * Swipe gauche = vidéo -> image
     */

    if (
        deltaX < -threshold &&
        currentSlide === 0
    ) {

        goToSlide(1);

        return;
    }

    /*
     * Swipe droite = image -> vidéo
     */

    if (
        deltaX > threshold &&
        currentSlide === 1
    ) {

        goToSlide(0);

        return;
    }

    /*
     * Pas assez de déplacement :
     * retour propre à la slide actuelle.
     */

    updateSlide(
        currentSlide,
        true
    );
}

// =========================================================
// POINTER CANCEL
// =========================================================

function handlePointerCancel(event) {

    if (
        event.pointerId !== activePointerId
    ) {
        return;
    }

    isDragging =
        false;

    activePointerId =
        null;

    updateSlide(
        currentSlide,
        true
    );
}

// =========================================================
// CLAVIER
// =========================================================

function handleKeyDown(event) {

    if (
        !modal.classList.contains("open")
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
        event.key === "ArrowLeft"
    ) {

        goToSlide(
            currentSlide - 1
        );
    }

    if (
        event.key === "ArrowRight"
    ) {

        goToSlide(
            currentSlide + 1
        );
    }
}

// =========================================================
// ÉVÉNEMENTS
// =========================================================

modalClose.addEventListener(
    "click",
    closeModal
);

const modalBackdrop =
    document.querySelector(
        ".modal-backdrop"
    );

if (modalBackdrop) {

    modalBackdrop.addEventListener(
        "click",
        closeModal
    );
}

document.addEventListener(
    "keydown",
    handleKeyDown
);

/*
 * Nouveau système de swipe :
 * Pointer Events.
 */

modalMedia.addEventListener(
    "pointerdown",
    handlePointerDown,
    {
        passive: true
    }
);

modalMedia.addEventListener(
    "pointermove",
    handlePointerMove,
    {
        passive: false
    }
);

modalMedia.addEventListener(
    "pointerup",
    handlePointerUp,
    {
        passive: true
    }
);

modalMedia.addEventListener(
    "pointercancel",
    handlePointerCancel,
    {
        passive: true
    }
);

// =========================================================
// ERREUR VIDÉO
// =========================================================

modalVideo.addEventListener(
    "error",
    () => {

        if (
            currentSlide === 0
        ) {

            showVideoFallback();
        }
    }
);

// =========================================================
// VIDÉO CHARGÉE
// =========================================================

modalVideo.addEventListener(
    "loadeddata",
    () => {

        videoFallback.classList.remove(
            "visible"
        );
    }
);

// =========================================================
// INITIALISATION
// =========================================================

updateDate();

loadShop();