const API_URL = "https://fortnite-api.com/v2/shop?language=fr";
const COSMETIC_API_URL =
    "https://fortnite-api.com/v2/cosmetics/br/search/ids?language=fr&id=";

const shopContainer = document.getElementById("shop");
const status = document.getElementById("status");
const dateElement = document.getElementById("date");

const itemModal = document.getElementById("item-modal");
const modalClose = document.getElementById("modal-close");
const modalBackdrop = document.querySelector(".modal-backdrop");

const modalImage = document.getElementById("modal-image");
const modalVideo = document.getElementById("modal-video");

const modalName = document.getElementById("modal-name");
const modalPrice = document.getElementById("modal-price");
const modalDescription = document.getElementById("modal-description");

const previewStatus = document.getElementById("preview-status");
const modalExtraInfo = document.getElementById("modal-extra-info");


// =========================================================
// DATE
// =========================================================

function displayDate() {
    const today = new Date();

    dateElement.textContent =
        today.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
}


// =========================================================
// V-BUCKS
// =========================================================

function getVbucksIcon() {
    return "https://firedrifytb.github.io/fortnite-shop/IMG_2258.png";
}


// =========================================================
// SECURITE HTML
// =========================================================

function escapeHTML(value) {
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


// =========================================================
// CAROUSEL
// =========================================================

let currentSlide = 0;
let hasVideo = false;

let touchStartX = 0;
let touchEndX = 0;


// =========================================================
// CREER LES POINTS
// =========================================================

function createCarouselDots(videoAvailable) {

    const media =
        document.querySelector(".modal-media");

    if (!media) return;

    let dots =
        media.querySelector(".carousel-dots");

    if (dots) {
        dots.remove();
    }

    dots =
        document.createElement("div");

    dots.className =
        "carousel-dots";

    // Image seule
    if (!videoAvailable) {
        const dot =
            document.createElement("button");

        dot.className =
            "carousel-dot active";

        dot.setAttribute(
            "aria-label",
            "Image"
        );

        dots.appendChild(dot);

        media.appendChild(dots);

        return;
    }

    // Vidéo + image
    for (let i = 0; i < 2; i++) {

        const dot =
            document.createElement("button");

        dot.className =
            "carousel-dot";

        if (i === 0) {
            dot.classList.add("active");
        }

        dot.setAttribute(
            "aria-label",
            i === 0
                ? "Voir la vidéo"
                : "Voir l'image"
        );

        dot.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                showSlide(i);

            }
        );

        dots.appendChild(dot);
    }

    media.appendChild(dots);
}


// =========================================================
// CHANGER DE SLIDE
// =========================================================

function showSlide(slide) {

    if (!hasVideo) {
        slide = 1;
    }

    currentSlide =
        Math.max(
            0,
            Math.min(
                slide,
                1
            )
        );

    const media =
        document.querySelector(".modal-media");

    if (!media) return;

    const dots =
        media.querySelectorAll(
            ".carousel-dot"
        );

    dots.forEach(
        (dot, index) => {

            dot.classList.toggle(
                "active",
                index === currentSlide
            );

        }
    );


    // -----------------------------------------------------
    // VIDEO
    // -----------------------------------------------------

    if (
        hasVideo &&
        currentSlide === 0
    ) {

        modalVideo.classList.add(
            "visible"
        );

        modalImage.classList.add(
            "hidden"
        );

        previewStatus.textContent =
            "APERÇU ANIMÉ";

        modalVideo
            .play()
            .catch(() => {});

        return;
    }


    // -----------------------------------------------------
    // IMAGE
    // -----------------------------------------------------

    modalVideo.pause();

    modalVideo.classList.remove(
        "visible"
    );

    modalImage.classList.remove(
        "hidden"
    );

    previewStatus.textContent =
        "APERÇU DE L'OBJET";
}


// =========================================================
// SWIPE
// =========================================================

function handleTouchStart(event) {

    touchStartX =
        event.changedTouches[0].screenX;

}

function handleTouchEnd(event) {

    touchEndX =
        event.changedTouches[0].screenX;

    const difference =
        touchStartX -
        touchEndX;

    // Minimum de 50 px pour déclencher
    if (
        Math.abs(difference) <
        50
    ) {
        return;
    }

    if (difference > 0) {

        // Swipe gauche
        showSlide(
            currentSlide + 1
        );

    } else {

        // Swipe droite
        showSlide(
            currentSlide - 1
        );

    }

}


// =========================================================
// RECUPERER LA VIDEO
// =========================================================

function findVideoUrl(item, entry) {

    const possibleValues = [

        // Champs directs
        item?.showcase_video,
        item?.showcaseVideo,

        item?.showcase_video_url,
        item?.showcaseVideoUrl,

        item?.video,
        item?.video_url,
        item?.videoUrl,

        // Objets vidéo
        item?.showcase_video?.url,
        item?.showcaseVideo?.url,

        item?.video?.url,

        item?.videos?.showcase,
        item?.videos?.showcase?.url,

        item?.videos?.preview,
        item?.videos?.preview?.url,

        item?.videos?.featured,
        item?.videos?.featured?.url,

        // Entrée shop
        entry?.showcase_video,
        entry?.showcaseVideo,

        entry?.showcase_video_url,
        entry?.showcaseVideoUrl,

        entry?.video,
        entry?.video_url,
        entry?.videoUrl,

        entry?.showcase_video?.url,
        entry?.showcaseVideo?.url

    ];


    for (
        const value
        of possibleValues
    ) {

        if (
            typeof value ===
            "string" &&
            value.startsWith("http")
        ) {

            return value;

        }

        if (
            value &&
            typeof value ===
            "object"
        ) {

            const url =
                value.url ||
                value.videoUrl ||
                value.video_url;

            if (
                typeof url ===
                "string" &&
                url.startsWith("http")
            ) {

                return url;

            }

        }

    }

    return null;
}


// =========================================================
// RESET VIDEO
// =========================================================

function resetVideo() {

    if (!modalVideo) return;

    modalVideo.pause();

    modalVideo.removeAttribute(
        "src"
    );

    modalVideo.load();

    modalVideo.classList.remove(
        "visible"
    );

    modalVideo.onloadeddata =
        null;

    modalVideo.onerror =
        null;
}


// =========================================================
// RECUPERATION COSMETIQUE
// =========================================================

async function getCompleteCosmetic(item) {

    if (!item?.id) {
        return item;
    }

    try {

        const response =
            await fetch(
                COSMETIC_API_URL +
                encodeURIComponent(
                    item.id
                )
            );

        if (!response.ok) {

            console.warn(
                "Erreur cosmétique :",
                response.status
            );

            return item;
        }

        const result =
            await response.json();

        if (
            Array.isArray(
                result.data
            ) &&
            result.data.length
        ) {

            return result.data[0];

        }

    } catch (error) {

        console.warn(
            "Impossible de récupérer la fiche cosmétique :",
            error
        );

    }

    return item;
}


// =========================================================
// INFOS SUPPLEMENTAIRES
// =========================================================

function updateExtraInfo(item) {

    if (!modalExtraInfo) {
        return;
    }

    modalExtraInfo.innerHTML =
        "";

    const infos = [];

    const type =
        item?.type?.displayValue ||
        item?.type?.value ||
        item?.displayType;

    const rarity =
        item?.rarity?.displayValue ||
        item?.rarity?.value ||
        item?.displayRarity;

    const series =
        item?.series?.name ||
        item?.series?.displayValue ||
        item?.series?.value;

    const set =
        item?.set?.text ||
        item?.set?.name ||
        item?.set?.value;

    if (type) {
        infos.push(type);
    }

    if (rarity) {
        infos.push(rarity);
    }

    if (series) {
        infos.push(series);
    }

    if (set) {
        infos.push(set);
    }

    infos.forEach(
        info => {

            const pill =
                document.createElement(
                    "span"
                );

            pill.className =
                "info-pill";

            pill.textContent =
                info;

            modalExtraInfo.appendChild(
                pill
            );

        }
    );
}


// =========================================================
// CHARGER UNE VIDEO
// =========================================================

function loadVideo(videoUrl) {

    if (!videoUrl) {

        hasVideo = false;

        createCarouselDots(
            false
        );

        showSlide(1);

        return;

    }

    resetVideo();

    hasVideo = true;

    modalVideo.muted =
        true;

    modalVideo.autoplay =
        true;

    modalVideo.loop =
        true;

    modalVideo.playsInline =
        true;

    modalVideo.controls =
        true;

    modalVideo.setAttribute(
        "muted",
        ""
    );

    modalVideo.setAttribute(
        "playsinline",
        ""
    );

    modalVideo.src =
        videoUrl;


    modalVideo.onloadedmetadata =
        () => {

            console.log(
                "Vidéo trouvée :",
                videoUrl
            );

            createCarouselDots(
                true
            );

            showSlide(0);

        };


    modalVideo.onloadeddata =
        () => {

            modalImage.classList.add(
                "hidden"
            );

            modalVideo.classList.add(
                "visible"
            );

            previewStatus.textContent =
                "APERÇU ANIMÉ";

            modalVideo
                .play()
                .catch(error => {

                    console.warn(
                        "Autoplay bloqué :",
                        error
                    );

                });

        };


    modalVideo.onerror =
        () => {

            console.warn(
                "La vidéo n'a pas pu être chargée :",
                videoUrl
            );

            hasVideo = false;

            resetVideo();

            createCarouselDots(
                false
            );

            showSlide(1);

        };


    modalVideo.load();

}


// =========================================================
// OUVRIR LE MODAL
// =========================================================

async function openItemModal(
    item,
    price,
    entry
) {

    if (!itemModal || !item) {
        return;
    }

    const image =
        item.images?.featured ||
        item.images?.icon;

    if (!image) {
        return;
    }


    // -----------------------------------------------------
    // RESET
    // -----------------------------------------------------

    hasVideo = false;
    currentSlide = 0;

    resetVideo();


    // -----------------------------------------------------
    // IMAGE
    // -----------------------------------------------------

    modalImage.src =
        image;

    modalImage.alt =
        item.name ||
        "Objet Fortnite";

    modalImage.classList.remove(
        "hidden"
    );


    // -----------------------------------------------------
    // NOM
    // -----------------------------------------------------

    modalName.textContent =
        item.name ||
        "Objet Fortnite";


    // -----------------------------------------------------
    // PRIX
    // -----------------------------------------------------

    modalPrice.innerHTML = `
        <img
            class="vbucks-icon"
            src="${getVbucksIcon()}"
            alt="V-Bucks"
        >

        <span>
            ${escapeHTML(price)}
        </span>

        <span>
            V-Bucks
        </span>
    `;


    // -----------------------------------------------------
    // DESCRIPTION
    // -----------------------------------------------------

    modalDescription.textContent =
        "Chargement des informations...";

    modalDescription.classList.remove(
        "empty"
    );


    updateExtraInfo(item);


    // -----------------------------------------------------
    // MODAL
    // -----------------------------------------------------

    itemModal.classList.add(
        "active"
    );

    itemModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );


    // -----------------------------------------------------
    // RECUPERATION COMPLETE
    // -----------------------------------------------------

    const completeItem =
        await getCompleteCosmetic(
            item
        );


    // -----------------------------------------------------
    // DESCRIPTION
    // -----------------------------------------------------

    const description =
        completeItem?.description ||
        completeItem?.introduction?.text ||
        "";

    if (description) {

        modalDescription.textContent =
            description;

    } else {

        modalDescription.textContent =
            "";

        modalDescription.classList.add(
            "empty"
        );

    }


    // -----------------------------------------------------
    // INFOS
    // -----------------------------------------------------

    updateExtraInfo(
        completeItem
    );


    // -----------------------------------------------------
    // VIDEO
    // -----------------------------------------------------

    const videoUrl =
        findVideoUrl(
            completeItem,
            entry
        );


    console.log(
        "Vidéo de",
        completeItem.name,
        ":",
        videoUrl
    );


    if (videoUrl) {

        loadVideo(
            videoUrl
        );

    } else {

        console.log(
            "Aucune vidéo disponible pour",
            completeItem.name
        );

        hasVideo = false;

        createCarouselDots(
            false
        );

        showSlide(1);

    }

}


// =========================================================
// FERMER MODAL
// =========================================================

function closeItemModal() {

    if (!itemModal) {
        return;
    }

    itemModal.classList.remove(
        "active"
    );

    itemModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );

    resetVideo();

    hasVideo = false;

}


// =========================================================
// EVENTS
// =========================================================

if (modalClose) {

    modalClose.addEventListener(
        "click",
        closeItemModal
    );

}

if (modalBackdrop) {

    modalBackdrop.addEventListener(
        "click",
        closeItemModal
    );

}

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeItemModal();

        }

    }
);


// =========================================================
// SWIPE EVENTS
// =========================================================

const modalMedia =
    document.querySelector(
        ".modal-media"
    );

if (modalMedia) {

    modalMedia.addEventListener(
        "touchstart",
        handleTouchStart,
        {
            passive: true
        }
    );

    modalMedia.addEventListener(
        "touchend",
        handleTouchEnd,
        {
            passive: true
        }
    );

}


// =========================================================
// CHARGEMENT SHOP
// =========================================================

async function loadShop() {

    status.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>

            <span>
                Chargement de la boutique...
            </span>
        </div>
    `;

    shopContainer.innerHTML =
        "";

    try {

        const response =
            await fetch(
                API_URL
            );

        if (!response.ok) {

            throw new Error(
                `Erreur API : ${response.status}`
            );

        }

        const result =
            await response.json();

        const entries =
            result.data?.entries ||
            [];

        const displayedItems =
            new Set();


        entries.forEach(
            (entry, index) => {

                const item =
                    entry.brItems?.[0];

                if (!item) {
                    return;
                }

                const name =
                    item.name;

                if (
                    displayedItems.has(
                        name
                    )
                ) {
                    return;
                }

                displayedItems.add(
                    name
                );


                const image =
                    item.images?.featured ||
                    item.images?.icon;

                if (!image) {
                    return;
                }


                const price =
                    entry.finalPrice ??
                    "?";


                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "card";

                card.style.animationDelay =
                    `${Math.min(
                        index * 0.045,
                        0.8
                    )}s`;


                card.innerHTML = `
                    <div class="card-image-wrapper">

                        <img
                            src="${image}"
                            alt="${escapeHTML(name)}"
                            loading="lazy"
                        >

                        <span
                            class="card-preview-badge"
                        >
                            APERÇU
                        </span>

                    </div>

                    <div class="card-info">

                        <h2>
                            ${escapeHTML(name)}
                        </h2>

                        <div class="price">

                            <img
                                class="vbucks-icon"
                                src="${getVbucksIcon()}"
                                alt="V-Bucks"
                            >

                            <span>
                                ${escapeHTML(price)}
                            </span>

                        </div>

                    </div>
                `;


                card.addEventListener(
                    "click",
                    () => {

                        openItemModal(
                            item,
                            price,
                            entry
                        );

                    }
                );


                card.setAttribute(
                    "tabindex",
                    "0"
                );

                card.setAttribute(
                    "role",
                    "button"
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

                            openItemModal(
                                item,
                                price,
                                entry
                            );

                        }

                    }
                );


                shopContainer.appendChild(
                    card
                );

            }
        );


        if (
            shopContainer.children.length ===
            0
        ) {

            status.textContent =
                "Aucun objet trouvé.";

        } else {

            status.textContent =
                "";

        }


    } catch (error) {

        console.error(
            "Erreur boutique :",
            error
        );

        status.textContent =
            "❌ Impossible de charger la boutique. Réessaie dans quelques secondes.";

    }

}


// =========================================================
// INITIALISATION
// =========================================================

displayDate();

loadShop();


// =========================================================
// SERVICE WORKER
// =========================================================

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register("./sw.js")

                .then(
                    () => {

                        console.log(
                            "Service worker activé"
                        );

                    }
                )

                .catch(
                    error => {

                        console.error(
                            "Service worker :",
                            error
                        );

                    }
                );

        }
    );

}