const API_URL =
    "https://fortnite-api.com/v2/shop?language=fr";

const COSMETIC_API_URL =
    "https://fortnite-api.com/v2/cosmetics/br/search/ids?language=fr&id=";


// =========================================================
// ELEMENTS
// =========================================================

const shopContainer =
    document.getElementById("shop");

const status =
    document.getElementById("status");

const dateElement =
    document.getElementById("date");


// Modal

const itemModal =
    document.getElementById("item-modal");

const modalClose =
    document.getElementById("modal-close");

const modalBackdrop =
    document.querySelector(".modal-backdrop");


// Media

const modalMedia =
    document.getElementById("modal-media");

const modalYoutube =
    document.getElementById("modal-youtube");

const modalImage =
    document.getElementById("modal-image");

const previewStatus =
    document.getElementById("preview-status");

const carouselDots =
    document.getElementById("carousel-dots");


// Infos

const modalName =
    document.getElementById("modal-name");

const modalPrice =
    document.getElementById("modal-price");

const modalDescription =
    document.getElementById("modal-description");

const modalExtraInfo =
    document.getElementById("modal-extra-info");


// =========================================================
// ETAT CAROUSEL
// =========================================================

let hasVideo = false;

let currentSlide = 0;

let touchStartX = 0;

let touchEndX = 0;


// =========================================================
// DATE
// =========================================================

function displayDate() {

    const today =
        new Date();

    dateElement.textContent =
        today.toLocaleDateString(
            "fr-FR",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
}


// =========================================================
// V-BUCKS
// =========================================================

function getVbucksIcon() {

    return "./IMG_2258.png";

}


// =========================================================
// SECURITE HTML
// =========================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// =========================================================
// RECUPERATION DE L'ID VIDEO
// =========================================================

function findShowcaseVideo(item) {

    const possibleValues = [

        item?.showcase_video_id,

        item?.showcaseVideoId,

        item?.showcase_video,

        item?.showcaseVideo,

        item?.showcase_video_url,

        item?.showcaseVideoUrl

    ];


    for (
        const value
        of possibleValues
    ) {

        if (
            typeof value !== "string"
        ) {

            continue;

        }


        const clean =
            value.trim();


        if (!clean) {
            continue;
        }


        // -----------------------------------------------------
        // ID YOUTUBE DIRECT
        // -----------------------------------------------------

        if (
            /^[a-zA-Z0-9_-]{11}$/
                .test(clean)
        ) {

            return clean;

        }


        // -----------------------------------------------------
        // URL YOUTUBE
        // -----------------------------------------------------

        try {

            const url =
                new URL(clean);


            if (
                url.hostname.includes(
                    "youtube.com"
                )
            ) {

                const id =
                    url.searchParams.get(
                        "v"
                    );

                if (
                    id &&
                    /^[a-zA-Z0-9_-]{11}$/
                        .test(id)
                ) {

                    return id;

                }

            }


            if (
                url.hostname ===
                    "youtu.be"
            ) {

                const id =
                    url.pathname
                        .replace(
                            "/",
                            ""
                        );

                if (
                    /^[a-zA-Z0-9_-]{11}$/
                        .test(id)
                ) {

                    return id;

                }

            }

        } catch {

            // Pas une URL valide

        }

    }


    return null;

}


// =========================================================
// RECUPERATION COSMETIQUE COMPLET
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
                "Erreur API cosmétique :",
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
            result.data.length > 0
        ) {

            return result.data[0];

        }

    } catch (error) {

        console.warn(
            "Impossible de récupérer le cosmétique :",
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
// RESET MEDIA
// =========================================================

function resetMedia() {

    if (modalYoutube) {

        modalYoutube.src =
            "";

        modalYoutube.classList.remove(
            "visible"
        );

    }


    if (modalImage) {

        modalImage.classList.remove(
            "hidden"
        );

    }


    if (carouselDots) {

        carouselDots.innerHTML =
            "";

    }


    hasVideo =
        false;

    currentSlide =
        0;

}


// =========================================================
// CREER LES DOTS
// =========================================================

function createDots() {

    if (!carouselDots) {
        return;
    }


    carouselDots.innerHTML =
        "";


    // Pas de vidéo
    if (!hasVideo) {

        const dot =
            document.createElement(
                "button"
            );

        dot.className =
            "carousel-dot active";

        dot.setAttribute(
            "aria-label",
            "Image"
        );

        carouselDots.appendChild(
            dot
        );

        return;

    }


    // Vidéo + image

    const labels = [
        "Vidéo",
        "Image"
    ];


    labels.forEach(
        (label, index) => {

            const dot =
                document.createElement(
                    "button"
                );

            dot.className =
                "carousel-dot";


            if (
                index ===
                currentSlide
            ) {

                dot.classList.add(
                    "active"
                );

            }


            dot.setAttribute(
                "aria-label",
                `Afficher ${label}`
            );


            dot.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    showSlide(
                        index
                    );

                }
            );


            carouselDots.appendChild(
                dot
            );

        }
    );

}


// =========================================================
// AFFICHER SLIDE
// =========================================================

function showSlide(slide) {

    if (!hasVideo) {

        currentSlide =
            0;

        if (modalYoutube) {

            modalYoutube.classList.remove(
                "visible"
            );

        }

        if (modalImage) {

            modalImage.classList.remove(
                "hidden"
            );

        }

        if (previewStatus) {

            previewStatus.textContent =
                "APERÇU DE L'OBJET";

        }

        createDots();

        return;

    }


    currentSlide =
        Math.max(
            0,
            Math.min(
                slide,
                1
            )
        );


    const dots =
        carouselDots
            ? carouselDots.querySelectorAll(
                ".carousel-dot"
            )
            : [];


    dots.forEach(
        (dot, index) => {

            dot.classList.toggle(
                "active",
                index ===
                currentSlide
            );

        }
    );


    // =====================================================
    // VIDEO
    // =====================================================

    if (
        currentSlide === 0
    ) {

        if (modalImage) {

            modalImage.classList.add(
                "hidden"
            );

        }


        if (modalYoutube) {

            modalYoutube.classList.add(
                "visible"
            );

        }


        if (previewStatus) {

            previewStatus.textContent =
                "APERÇU ANIMÉ";

        }


        return;

    }


    // =====================================================
    // IMAGE
    // =====================================================

    if (modalYoutube) {

        modalYoutube.classList.remove(
            "visible"
        );

    }


    if (modalImage) {

        modalImage.classList.remove(
            "hidden"
        );

    }


    if (previewStatus) {

        previewStatus.textContent =
            "APERÇU DE L'OBJET";

    }

}


// =========================================================
// CHARGER VIDEO YOUTUBE
// =========================================================

function loadYoutubeVideo(videoId) {

    if (
        !videoId ||
        !modalYoutube
    ) {

        hasVideo =
            false;

        createDots();

        showSlide(0);

        return;

    }


    hasVideo =
        true;

    currentSlide =
        0;


    /*
        mute=1 :
        nécessaire pour que l'autoplay
        fonctionne correctement sur mobile
        et la plupart des navigateurs.

        playsinline=1 :
        évite le plein écran automatique
        sur certains appareils.

        autoplay=1 :
        démarre directement.

        controls=1 :
        permet à l'utilisateur de contrôler
        la vidéo.
    */

    const youtubeUrl =
        "https://www.youtube.com/embed/" +
        encodeURIComponent(videoId) +
        "?autoplay=1" +
        "&mute=1" +
        "&playsinline=1" +
        "&controls=1" +
        "&rel=0";


    modalYoutube.src =
        youtubeUrl;


    createDots();

    showSlide(0);

}


// =========================================================
// OUVRIR MODAL
// =========================================================

async function openItemModal(
    item,
    price
) {

    if (
        !itemModal ||
        !item
    ) {

        return;

    }


    const image =
        item.images?.featured ||
        item.images?.icon;


    if (!image) {

        return;

    }


    // =====================================================
    // RESET
    // =====================================================

    resetMedia();


    // =====================================================
    // IMAGE
    // =====================================================

    modalImage.src =
        image;

    modalImage.alt =
        item.name ||
        "Objet Fortnite";


    // =====================================================
    // NOM
    // =====================================================

    modalName.textContent =
        item.name ||
        "Objet Fortnite";


    // =====================================================
    // PRIX
    // =====================================================

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


    // =====================================================
    // DESCRIPTION
    // =====================================================

    modalDescription.textContent =
        "Chargement des informations...";

    modalDescription.classList.remove(
        "empty"
    );


    updateExtraInfo(
        item
    );


    // =====================================================
    // OUVERTURE
    // =====================================================

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


    // =====================================================
    // RECUPERATION COMPLETE
    // =====================================================

    const completeItem =
        await getCompleteCosmetic(
            item
        );


    // =====================================================
    // DESCRIPTION
    // =====================================================

    const description =
        completeItem?.description ||
        completeItem?.introduction?.text ||
        "";


    if (description) {

        modalDescription.textContent =
            description;

        modalDescription.classList.remove(
            "empty"
        );

    } else {

        modalDescription.textContent =
            "";

        modalDescription.classList.add(
            "empty"
        );

    }


    // =====================================================
    // INFOS
    // =====================================================

    updateExtraInfo(
        completeItem
    );


    // =====================================================
    // VIDEO
    // =====================================================

    const videoId =
        findShowcaseVideo(
            completeItem
        );


    console.log(
        "Objet :",
        completeItem.name
    );

    console.log(
        "ID vidéo :",
        videoId
    );


    if (videoId) {

        loadYoutubeVideo(
            videoId
        );

    } else {

        console.log(
            "Aucune vidéo de présentation disponible."
        );

        hasVideo =
            false;

        createDots();

        showSlide(0);

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


    resetMedia();

}


// =========================================================
// BOUTON FERMER
// =========================================================

if (modalClose) {

    modalClose.addEventListener(
        "click",
        closeItemModal
    );

}


// =========================================================
// BACKDROP
// =========================================================

if (modalBackdrop) {

    modalBackdrop.addEventListener(
        "click",
        closeItemModal
    );

}


// =========================================================
// ESCAPE
// =========================================================

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
// SWIPE
// =========================================================

if (modalMedia) {

    modalMedia.addEventListener(
        "touchstart",
        event => {

            touchStartX =
                event.changedTouches[0]
                    .screenX;

        },
        {
            passive: true
        }
    );


    modalMedia.addEventListener(
        "touchend",
        event => {

            touchEndX =
                event.changedTouches[0]
                    .screenX;


            const difference =
                touchStartX -
                touchEndX;


            if (
                Math.abs(difference) <
                50
            ) {

                return;

            }


            if (
                difference > 0
            ) {

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

        },
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


                // =================================================
                // CARD
                // =================================================

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
                            src="${escapeHTML(image)}"
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

                            <span>
                                V-Bucks
                            </span>

                        </div>

                    </div>

                `;


                // =================================================
                // CLICK
                // =================================================

                card.addEventListener(
                    "click",
                    () => {

                        openItemModal(
                            item,
                            price
                        );

                    }
                );


                // =================================================
                // CLAVIER
                // =================================================

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
                                price
                            );

                        }

                    }
                );


                shopContainer.appendChild(
                    card
                );

            }
        );


        // =====================================================
        // RESULTAT
        // =====================================================

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
                .register(
                    "./sw.js"
                )
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