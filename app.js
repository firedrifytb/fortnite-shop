const API_URL =
    "https://fortnite-api.com/v2/shop?language=fr";


const shopContainer =
    document.getElementById("shop");

const status =
    document.getElementById("status");

const dateElement =
    document.getElementById("date");


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
// OUTILS
// =========================================================

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


function getDisplayValue(value) {

    if (!value) {
        return "";
    }

    if (typeof value === "string") {
        return value;
    }

    if (typeof value === "object") {

        return (
            value.displayValue ||
            value.name ||
            value.text ||
            value.value ||
            ""
        );

    }

    return String(value);

}


// =========================================================
// MODAL
// =========================================================

const itemModal =
    document.getElementById("item-modal");

const modalClose =
    document.getElementById("modal-close");

const modalBackdrop =
    document.querySelector(".modal-backdrop");

const modalImage =
    document.getElementById("modal-image");

const modalVideo =
    document.getElementById("modal-video");

const modalName =
    document.getElementById("modal-name");

const modalPrice =
    document.getElementById("modal-price");

const modalRarity =
    document.getElementById("modal-rarity");

const modalTags =
    document.getElementById("modal-tags");

const modalDescription =
    document.getElementById("modal-description");

const modalIntroduction =
    document.getElementById("modal-introduction");

const modalSet =
    document.getElementById("modal-set");

const previewStatus =
    document.getElementById("preview-status");

const videoOverlay =
    document.getElementById("video-overlay");

const videoSound =
    document.getElementById("video-sound");

const videoFullscreen =
    document.getElementById("video-fullscreen");

const videoLoading =
    document.getElementById("video-loading");


// =========================================================
// TROUVER UNE VIDÉO
// =========================================================

function findVideoUrl(item) {

    const possibleValues = [

        item?.showcaseVideoUrl,

        item?.showcaseVideo,

        item?.videos?.showcase,

        item?.video,

        item?.videoUrl,

        item?.videos?.video,

        item?.previewVideo,

        item?.previewVideoUrl

    ];


    for (const value of possibleValues) {

        if (!value) {
            continue;
        }


        if (typeof value === "string") {

            if (
                value.startsWith("http://") ||
                value.startsWith("https://")
            ) {

                return value;

            }

        }


        if (
            typeof value === "object"
        ) {

            const url =
                value.url ||
                value.videoUrl ||
                value.src ||
                value.uri;


            if (
                typeof url === "string" &&
                (
                    url.startsWith("http://") ||
                    url.startsWith("https://")
                )
            ) {

                return url;

            }

        }

    }


    return null;

}


// =========================================================
// RARETÉ
// =========================================================

function getRarity(item) {

    return (
        item?.rarity?.displayValue ||
        item?.rarity?.value ||
        item?.rarity ||
        ""
    );

}


// =========================================================
// TYPE
// =========================================================

function getItemType(item) {

    return (
        item?.type?.displayValue ||
        item?.type?.value ||
        item?.type?.name ||
        ""
    );

}


// =========================================================
// ENSEMBLE
// =========================================================

function getItemSet(item) {

    return (
        item?.set?.text ||
        item?.set?.name ||
        item?.set?.value ||
        ""
    );

}


// =========================================================
// OUVRIR LE MODAL
// =========================================================

function openItemModal(item, price) {

    if (!itemModal) {
        return;
    }


    const image =
        item.images?.featured ||
        item.images?.icon;


    if (!image) {
        return;
    }


    // =====================================================
    // IMAGE
    // =====================================================

    modalImage.src =
        image;

    modalImage.alt =
        item.name || "Objet Fortnite";


    modalImage.classList.remove(
        "hidden"
    );


    // =====================================================
    // NOM
    // =====================================================

    modalName.textContent =
        item.name || "Objet Fortnite";


    // =====================================================
    // PRIX
    // =====================================================

    modalPrice.innerHTML = `

        <img
            class="vbucks-icon"
            src="https://firedrifytb.github.io/fortnite-shop/IMG_2258.png"
            alt="V-Bucks"
        >

        <strong>
            ${escapeHtml(price)}
        </strong>

        <span>
            V-Bucks
        </span>

    `;


    // =====================================================
    // RARETÉ
    // =====================================================

    const rarity =
        getRarity(item);


    if (rarity) {

        modalRarity.textContent =
            rarity;

        modalRarity.classList.add(
            "visible"
        );

        modalRarity.dataset.rarity =
            rarity
                .toLowerCase()
                .replace(/\s+/g, "-");

    }

    else {

        modalRarity.textContent =
            "";

        modalRarity.classList.remove(
            "visible"
        );

    }


    // =====================================================
    // TAGS
    // =====================================================

    const type =
        getItemType(item);

    const set =
        getItemSet(item);


    const tags = [];


    if (type) {
        tags.push(type);
    }


    if (
        item.introduction?.text
    ) {

        tags.push(
            item.introduction.text
        );

    }


    modalTags.innerHTML =
        tags
            .filter(Boolean)
            .map(
                tag => `
                    <span class="info-tag">
                        ${escapeHtml(tag)}
                    </span>
                `
            )
            .join("");


    // =====================================================
    // DESCRIPTION
    // =====================================================

    const description =
        item.description ||
        item.shortDescription ||
        "";


    if (description) {

        modalDescription.innerHTML = `

            <span class="info-title">
                DESCRIPTION
            </span>

            <p>
                ${escapeHtml(description)}
            </p>

        `;

        modalDescription.classList.add(
            "visible"
        );

    }

    else {

        modalDescription.innerHTML =
            "";

        modalDescription.classList.remove(
            "visible"
        );

    }


    // =====================================================
    // INTRODUCTION
    // =====================================================

    const introduction =
        item.introduction?.text ||
        "";


    if (introduction) {

        modalIntroduction.innerHTML = `

            <span class="info-title">
                INTRODUCTION
            </span>

            <p>
                ${escapeHtml(introduction)}
            </p>

        `;

        modalIntroduction.classList.add(
            "visible"
        );

    }

    else {

        modalIntroduction.innerHTML =
            "";

        modalIntroduction.classList.remove(
            "visible"
        );

    }


    // =====================================================
    // ENSEMBLE
    // =====================================================

    if (set) {

        modalSet.innerHTML = `

            <span class="info-title">
                ENSEMBLE
            </span>

            <strong>
                ${escapeHtml(set)}
            </strong>

        `;

        modalSet.classList.add(
            "visible"
        );

    }

    else {

        modalSet.innerHTML =
            "";

        modalSet.classList.remove(
            "visible"
        );

    }


    // =====================================================
    // VIDÉO
    // =====================================================

    const videoUrl =
        findVideoUrl(item);


    // Réinitialisation

    modalVideo.pause();

    modalVideo.removeAttribute(
        "src"
    );

    modalVideo.load();

    modalVideo.classList.remove(
        "visible"
    );

    videoOverlay.classList.remove(
        "visible"
    );

    videoLoading.classList.remove(
        "visible"
    );


    // Son coupé par défaut

    modalVideo.muted =
        true;

    videoSound.textContent =
        "🔇";


    // =====================================================
    // SI VIDÉO
    // =====================================================

    if (videoUrl) {

        videoLoading.classList.add(
            "visible"
        );


        modalVideo.src =
            videoUrl;


        modalVideo.classList.add(
            "visible"
        );


        modalImage.classList.add(
            "hidden"
        );


        previewStatus.textContent =
            "APERÇU VIDÉO";


        videoOverlay.classList.add(
            "visible"
        );


        modalVideo
            .play()
            .catch(() => {});


    }

    // =====================================================
    // PAS DE VIDÉO
    // =====================================================

    else {

        modalVideo.classList.remove(
            "visible"
        );


        modalImage.classList.remove(
            "hidden"
        );


        previewStatus.textContent =
            "APERÇU DE L'OBJET";

    }


    // =====================================================
    // AFFICHAGE
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

}


// =========================================================
// VIDÉO CHARGÉE
// =========================================================

modalVideo.addEventListener(
    "loadeddata",
    () => {

        videoLoading.classList.remove(
            "visible"
        );

    }
);


// =========================================================
// VIDÉO ERREUR
// =========================================================

modalVideo.addEventListener(
    "error",
    () => {

        videoLoading.classList.remove(
            "visible"
        );


        videoOverlay.classList.remove(
            "visible"
        );


        modalVideo.classList.remove(
            "visible"
        );


        modalImage.classList.remove(
            "hidden"
        );


        previewStatus.textContent =
            "APERÇU DE L'OBJET";

    }
);


// =========================================================
// SON
// =========================================================

if (videoSound) {

    videoSound.addEventListener(
        "click",
        () => {

            modalVideo.muted =
                !modalVideo.muted;


            videoSound.textContent =
                modalVideo.muted
                    ? "🔇"
                    : "🔊";

        }
    );

}


// =========================================================
// PLEIN ÉCRAN
// =========================================================

if (videoFullscreen) {

    videoFullscreen.addEventListener(
        "click",
        async () => {

            try {

                if (
                    document.fullscreenElement
                ) {

                    await document.exitFullscreen();

                    return;

                }


                if (
                    modalVideo.requestFullscreen
                ) {

                    await modalVideo.requestFullscreen();

                }

                else if (
                    modalVideo.webkitEnterFullscreen
                ) {

                    modalVideo.webkitEnterFullscreen();

                }

            }

            catch (error) {

                console.error(
                    "Fullscreen :",
                    error
                );

            }

        }
    );

}


// =========================================================
// FERMER
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


    if (modalVideo) {

        modalVideo.pause();

        modalVideo.removeAttribute(
            "src"
        );

        modalVideo.load();

    }

}


// =========================================================
// EVENTS MODAL
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
    (event) => {

        if (
            event.key === "Escape"
        ) {

            closeItemModal();

        }

    }
);


// =========================================================
// SHOP
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
            await fetch(API_URL);


        if (!response.ok) {

            throw new Error(
                `Erreur API : ${response.status}`
            );

        }


        const result =
            await response.json();


        const entries =
            result.data?.entries || [];


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
                    displayedItems.has(name)
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
                    entry.finalPrice ?? "?";


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

                    <img
                        src="${escapeHtml(image)}"
                        alt="${escapeHtml(name)}"
                        loading="lazy"
                    >

                    <div class="card-info">

                        <h2>
                            ${escapeHtml(name)}
                        </h2>

                        <div class="price">

                            <img
                                class="vbucks-icon"
                                src="https://firedrifytb.github.io/fortnite-shop/IMG_2258.png"
                                alt="V-Bucks"
                            >

                            <span>
                                ${escapeHtml(price)}
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
                    (event) => {

                        if (
                            event.key === "Enter" ||
                            event.key === " "
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
            shopContainer.children.length === 0
        ) {

            status.textContent =
                "Aucun objet trouvé.";

        }

        else {

            status.textContent =
                "";

        }

    }

    catch (error) {

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

                .then(() => {

                    console.log(
                        "Service worker activé"
                    );

                })

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