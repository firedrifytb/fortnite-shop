const API_URL = "https://fortnite-api.com/v2/shop?language=fr";

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

const previewStatus =
    document.getElementById("preview-status");


// =========================================================
// OUVRIR OBJET
// =========================================================

function openItemModal(item, price) {

    if (!itemModal) return;


    const image =
        item.images?.featured ||
        item.images?.icon;


    if (!image) return;


    // Image
    modalImage.src = image;

    modalImage.alt =
        item.name;


    // Nom
    modalName.textContent =
        item.name;


    // Prix
    modalPrice.innerHTML = `
        <img
            class="vbucks-icon"
            src="https://firedrifytb.github.io/fortnite-shop/IMG_2258.png"
            alt="V-Bucks"
        >

        <span>${price}</span>

        <span>V-Bucks</span>
    `;


    // =====================================================
    // RECHERCHE DE VIDÉO
    // =====================================================

    let videoUrl = null;


    /*
        Fortnite-API peut fournir différentes
        propriétés selon le cosmétique.

        On teste plusieurs formats possibles
        sans empêcher le fonctionnement
        du shop si aucune vidéo n'existe.
    */

    if (item.showcaseVideoUrl) {

        videoUrl =
            item.showcaseVideoUrl;

    }

    else if (
        item.showcaseVideo?.url
    ) {

        videoUrl =
            item.showcaseVideo.url;

    }

    else if (
        item.videos?.showcase
    ) {

        videoUrl =
            item.videos.showcase;

    }


    // =====================================================
    // VIDÉO DISPONIBLE
    // =====================================================

    if (videoUrl) {

        modalVideo.src =
            videoUrl;


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

    }


    // =====================================================
    // PAS DE VIDÉO
    // =====================================================

    else {

        modalVideo.pause();

        modalVideo.removeAttribute(
            "src"
        );

        modalVideo.load();


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
// FERMER
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
                        src="${image}"
                        alt="${name}"
                        loading="lazy"
                    >

                    <div class="card-info">

                        <h2>
                            ${name}
                        </h2>

                        <div class="price">

                            <img
                                class="vbucks-icon"
                                src="https://firedrifytb.github.io/fortnite-shop/IMG_2258.png"
                                alt="V-Bucks"
                            >

                            <span>
                                ${price}
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