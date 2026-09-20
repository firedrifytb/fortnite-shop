const API_URL = "https://fortnite-api.com/v2/shop?language=fr";
const COSMETIC_API_URL =
    "https://fortnite-api.com/v2/cosmetics/br/search/ids?language=fr&id=";

const shopContainer = document.getElementById("shop");
const status = document.getElementById("status");
const dateElement = document.getElementById("date");


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

const modalDescription =
    document.getElementById("modal-description");

const previewStatus =
    document.getElementById("preview-status");

const modalExtraInfo =
    document.getElementById("modal-extra-info");


// =========================================================
// V-BUCKS
// =========================================================

function getVbucksIcon() {

    return "https://firedrifytb.github.io/fortnite-shop/IMG_2258.png";

}


// =========================================================
// ECHAPPE HTML
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
// RECHERCHE VIDEO
// =========================================================

function findVideoUrl(item, entry) {

    const possibleValues = [

        // Objet cosmétique
        item?.showcaseVideoUrl,
        item?.showcase_video_url,

        item?.showcaseVideo?.url,
        item?.showcase_video?.url,

        item?.videoUrl,
        item?.video_url,

        item?.video,

        // Vidéos éventuelles
        item?.videos?.showcase,
        item?.videos?.showcase?.url,

        item?.videos?.preview,
        item?.videos?.preview?.url,

        item?.videos?.featured,
        item?.videos?.featured?.url,

        // Entrée du shop
        entry?.showcaseVideoUrl,
        entry?.showcase_video_url,

        entry?.showcaseVideo?.url,
        entry?.showcase_video?.url,

        entry?.videoUrl,
        entry?.video_url,

        entry?.video,

        entry?.videos?.showcase,
        entry?.videos?.showcase?.url,

        entry?.videos?.preview,
        entry?.videos?.preview?.url

    ];


    for (const value of possibleValues) {

        if (
            typeof value === "string" &&
            value.startsWith("http")
        ) {

            return value;

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

    modalVideo.removeAttribute("src");

    modalVideo.load();

    modalVideo.classList.remove("visible");

    modalVideo.onloadeddata = null;
    modalVideo.onerror = null;

}


// =========================================================
// IMAGE DE SECOURS
// =========================================================

function showImagePreview() {

    resetVideo();

    modalImage.classList.remove("hidden");

    previewStatus.textContent =
        "APERÇU DE L'OBJET";

}


// =========================================================
// CHARGER VIDEO
// =========================================================

function loadVideo(videoUrl) {

    if (
        !videoUrl ||
        !modalVideo
    ) {

        showImagePreview();

        return;

    }


    resetVideo();


    modalVideo.src =
        videoUrl;

    modalVideo.muted =
        true;

    modalVideo.loop =
        true;

    modalVideo.autoplay =
        true;

    modalVideo.playsInline =
        true;

    modalVideo.controls =
        true;


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
                .catch(() => {});

        };


    modalVideo.onerror =
        () => {

            console.warn(
                "Vidéo impossible à charger :",
                videoUrl
            );

            showImagePreview();

        };


    modalVideo.load();

}


// =========================================================
// RECUPERATION FICHE COSMETIQUE
// =========================================================

async function getCompleteCosmetic(item) {

    const id =
        item?.id;

    if (!id) {

        return item;

    }


    try {

        const response =
            await fetch(
                COSMETIC_API_URL +
                encodeURIComponent(id)
            );


        if (!response.ok) {

            console.warn(
                "Impossible de récupérer le cosmétique :",
                response.status
            );

            return item;

        }


        const result =
            await response.json();


        const cosmetics =
            result.data;


        if (
            Array.isArray(cosmetics) &&
            cosmetics.length > 0
        ) {

            return cosmetics[0];

        }


        return item;

    }

    catch (error) {

        console.warn(
            "Erreur récupération cosmétique :",
            error
        );

        return item;

    }

}


// =========================================================
// INFOS SUPPLEMENTAIRES
// =========================================================

function updateExtraInfo(item) {

    if (!modalExtraInfo) return;


    modalExtraInfo.innerHTML = "";


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


    infos.forEach(info => {

        const pill =
            document.createElement("span");

        pill.className =
            "info-pill";

        pill.textContent =
            info;

        modalExtraInfo.appendChild(
            pill
        );

    });

}


// =========================================================
// OUVRIR MODAL
// =========================================================

async function openItemModal(
    item,
    price,
    entry
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


    if (!image) return;


    // -----------------------------------------------------
    // AFFICHAGE IMMEDIAT
    // -----------------------------------------------------

    modalImage.src =
        image;

    modalImage.alt =
        item.name ||
        "Objet Fortnite";

    modalImage.classList.remove(
        "hidden"
    );


    modalName.textContent =
        item.name ||
        "Objet Fortnite";


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


    modalDescription.textContent =
        "Chargement des informations...";


    modalDescription.classList.remove(
        "empty"
    );


    updateExtraInfo(item);

    showImagePreview();


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
        await getCompleteCosmetic(item);


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


    if (videoUrl) {

        loadVideo(
            videoUrl
        );

    }

    else {

        showImagePreview();

    }

}


// =========================================================
// FERMER MODAL
// =========================================================

function closeItemModal() {

    if (!itemModal) return;


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


                if (!item) return;


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


                if (!image) return;


                const price =
                    entry.finalPrice ??
                    "?";


                // -------------------------------------------------
                // CARD
                // -------------------------------------------------

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


        // -----------------------------------------------------
        // RESULTAT
        // -----------------------------------------------------

        if (
            shopContainer.children.length ===
            0
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