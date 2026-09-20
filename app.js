const API_URL = "https://fortnite-api.com/v2/shop?language=fr";

const shopContainer = document.getElementById("shop");
const status = document.getElementById("status");
const dateElement = document.getElementById("date");

// =========================================================
// DATE
// =========================================================

function displayDate() {
    const today = new Date();

    dateElement.textContent = today.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

// =========================================================
// MODAL
// =========================================================

const itemModal = document.getElementById("item-modal");
const modalClose = document.getElementById("modal-close");
const modalBackdrop = document.querySelector(".modal-backdrop");

const modalImage = document.getElementById("modal-image");
const modalVideo = document.getElementById("modal-video");

const modalName = document.getElementById("modal-name");
const modalPrice = document.getElementById("modal-price");
const modalDescription = document.getElementById("modal-description");

const previewStatus = document.getElementById("preview-status");

// =========================================================
// UTILITAIRES
// =========================================================

function getVbucksIcon() {
    return "https://firedrifytb.github.io/fortnite-shop/IMG_2258.png";
}


// Cherche une URL vidéo dans plusieurs formats possibles.
// Cela permet de rester compatible si la structure de l'API change.

function findVideoUrl(item, entry) {

    const possibleValues = [

        // Objet
        item?.showcaseVideoUrl,
        item?.showcaseVideo?.url,
        item?.showcaseVideo,
        item?.video,
        item?.videoUrl,

        // Collections éventuelles
        item?.videos?.showcase,
        item?.videos?.showcase?.url,
        item?.videos?.featured,
        item?.videos?.featured?.url,
        item?.videos?.preview,
        item?.videos?.preview?.url,

        // Entrée du shop
        entry?.showcaseVideoUrl,
        entry?.showcaseVideo?.url,
        entry?.showcaseVideo,
        entry?.video,
        entry?.videoUrl,
        entry?.videos?.showcase,
        entry?.videos?.showcase?.url,
        entry?.videos?.preview,
        entry?.videos?.preview?.url
    ];

    for (const value of possibleValues) {

        if (typeof value === "string" && value.startsWith("http")) {
            return value;
        }

    }

    return null;
}


// =========================================================
// RESET VIDEO
// =========================================================

function resetModalVideo() {

    if (!modalVideo) return;

    modalVideo.pause();

    modalVideo.removeAttribute("src");

    modalVideo.load();

    modalVideo.classList.remove("visible");

    modalVideo.onloadeddata = null;
    modalVideo.onerror = null;
}


// =========================================================
// IMAGE DE SECOURS
// =========================================================

function showFallbackImage() {

    resetModalVideo();

    modalImage.classList.remove("hidden");

    previewStatus.textContent = "APERÇU DE L'OBJET";
}


// =========================================================
// VIDÉO
// =========================================================

function loadPreviewVideo(videoUrl) {

    if (!videoUrl || !modalVideo) {
        showFallbackImage();
        return;
    }

    resetModalVideo();

    modalVideo.src = videoUrl;

    modalVideo.muted = true;
    modalVideo.loop = true;
    modalVideo.autoplay = true;
    modalVideo.playsInline = true;

    modalVideo.controls = true;

    modalVideo.onloadeddata = () => {

        modalImage.classList.add("hidden");

        modalVideo.classList.add("visible");

        previewStatus.textContent = "APERÇU ANIMÉ";

        modalVideo.play().catch(() => {
            // Le navigateur peut bloquer autoplay.
            // Les contrôles restent disponibles.
        });

    };

    modalVideo.onerror = () => {

        console.warn(
            "Impossible de charger la vidéo :",
            videoUrl
        );

        showFallbackImage();

    };

    modalVideo.load();

}


// =========================================================
// OUVRIR MODAL
// =========================================================

function openItemModal(item, price, entry) {

    if (!itemModal || !item) return;

    const image =
        item.images?.featured ||
        item.images?.icon;

    if (!image) return;


    // -----------------------------------------------------
    // IMAGE
    // -----------------------------------------------------

    modalImage.src = image;

    modalImage.alt = item.name || "Objet Fortnite";

    modalImage.classList.remove("hidden");


    // -----------------------------------------------------
    // NOM
    // -----------------------------------------------------

    modalName.textContent =
        item.name || "Objet Fortnite";


    // -----------------------------------------------------
    // PRIX
    // -----------------------------------------------------

    modalPrice.innerHTML = `
        <img
            class="vbucks-icon"
            src="${getVbucksIcon()}"
            alt="V-Bucks"
        >

        <span>${price}</span>

        <span>V-Bucks</span>
    `;


    // -----------------------------------------------------
    // DESCRIPTION
    // -----------------------------------------------------

    const description =
        item.description ||
        item.introduction?.text ||
        "";

    if (description) {

        modalDescription.textContent =
            description;

        modalDescription.classList.remove(
            "empty"
        );

    }

    else {

        modalDescription.textContent =
            "";

        modalDescription.classList.add(
            "empty"
        );

    }


    // -----------------------------------------------------
    // INFOS SUPPLÉMENTAIRES
    // -----------------------------------------------------

    const rarity =
        item.rarity?.displayValue ||
        item.displayRarity ||
        "";

    const type =
        item.type?.displayValue ||
        item.displayType ||
        "";


    const extraInfo =
        document.getElementById("modal-extra-info");


    if (extraInfo) {

        extraInfo.innerHTML = "";


        if (type) {

            extraInfo.innerHTML += `
                <span class="info-pill">
                    ${type}
                </span>
            `;

        }


        if (rarity) {

            extraInfo.innerHTML += `
                <span class="info-pill">
                    ${rarity}
                </span>
            `;

        }

    }


    // -----------------------------------------------------
    // VIDÉO
    // -----------------------------------------------------

    const videoUrl =
        findVideoUrl(item, entry);


    if (videoUrl) {

        loadPreviewVideo(videoUrl);

    }

    else {

        showFallbackImage();

    }


    // -----------------------------------------------------
    // AFFICHAGE
    // -----------------------------------------------------

    itemModal.classList.add("active");

    itemModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

}


// =========================================================
// FERMER MODAL
// =========================================================

function closeItemModal() {

    if (!itemModal) return;

    itemModal.classList.remove("active");

    itemModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );

    resetModalVideo();

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
    event => {

        if (event.key === "Escape") {

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


    shopContainer.innerHTML = "";


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


                if (!item) return;


                const name =
                    item.name;


                if (
                    displayedItems.has(name)
                ) {

                    return;

                }


                displayedItems.add(name);


                const image =
                    item.images?.featured ||
                    item.images?.icon;


                if (!image) return;


                const price =
                    entry.finalPrice ?? "?";


                // -------------------------------------------------
                // CARD
                // -------------------------------------------------

                const card =
                    document.createElement("div");


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
                            alt="${name}"
                            loading="lazy"
                        >

                        <span class="card-preview-badge">
                            APERÇU
                        </span>

                    </div>

                    <div class="card-info">

                        <h2>
                            ${name}
                        </h2>

                        <div class="price">

                            <img
                                class="vbucks-icon"
                                src="${getVbucksIcon()}"
                                alt="V-Bucks"
                            >

                            <span>
                                ${price}
                            </span>

                        </div>

                    </div>

                `;


                // -------------------------------------------------
                // CLICK
                // -------------------------------------------------

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


                // -------------------------------------------------
                // CLAVIER
                // -------------------------------------------------

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
                            event.key === "Enter" ||
                            event.key === " "
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


        // -----------------------------------------------------
        // RESULTAT
        // -----------------------------------------------------

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

if ("serviceWorker" in navigator) {

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