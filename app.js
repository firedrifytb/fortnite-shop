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
// OUVRIR LE MODAL
// =========================================================

function openItemModal(item, price) {

    const modal = document.getElementById("item-modal");
    const modalImage = document.getElementById("modal-image");
    const modalName = document.getElementById("modal-name");
    const modalPrice = document.getElementById("modal-price");

    if (!modal || !modalImage || !modalName || !modalPrice) {
        console.error("Modal introuvable.");
        return;
    }

    const image =
        item.images?.featured ||
        item.images?.icon;

    if (!image) return;

    modalImage.src = image;
    modalImage.alt = item.name;

    modalName.textContent = item.name;

    modalPrice.innerHTML = `
        <img
            class="vbucks-icon"
            src="https://firedrifytb.github.io/fortnite-shop/IMG_2258.png"
            alt="V-Bucks"
        >
        <span>${price}</span>
        <span>V-Bucks</span>
    `;

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");
}


// =========================================================
// FERMER LE MODAL
// =========================================================

function closeItemModal() {

    const modal = document.getElementById("item-modal");

    if (!modal) return;

    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("modal-open");
}


// =========================================================
// INITIALISATION DU MODAL
// =========================================================

function setupModal() {

    const modal = document.getElementById("item-modal");

    if (!modal) {
        console.warn("Modal non trouvable.");
        return;
    }

    const closeButton =
        document.getElementById("modal-close");

    const backdrop =
        modal.querySelector(".modal-backdrop");


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeItemModal
        );

    }


    if (backdrop) {

        backdrop.addEventListener(
            "click",
            closeItemModal
        );

    }


    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            closeItemModal();

        }

    });

}


// =========================================================
// SHOP
// =========================================================

async function loadShop() {

    status.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <span>Chargement de la boutique...</span>
        </div>
    `;

    shopContainer.innerHTML = "";


    try {

        console.log("Chargement de la boutique...");


        const response = await fetch(API_URL);


        if (!response.ok) {

            throw new Error(
                `Erreur API : ${response.status}`
            );

        }


        const result = await response.json();


        console.log("Boutique reçue :", result);


        const entries =
            result.data?.entries || [];


        const displayedItems =
            new Set();


        entries.forEach((entry, index) => {

            const item =
                entry.brItems?.[0];


            if (!item) return;


            const name =
                item.name;


            if (displayedItems.has(name)) {
                return;
            }


            displayedItems.add(name);


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
                document.createElement("div");


            card.className =
                "card";


            card.style.animationDelay =
                `${Math.min(index * 0.045, 0.8)}s`;


            card.innerHTML = `
                <img
                    src="${image}"
                    alt="${name}"
                    loading="lazy"
                >

                <div class="card-info">

                    <h2>${name}</h2>

                    <div class="price">

                        <img
                            class="vbucks-icon"
                            src="https://firedrifytb.github.io/fortnite-shop/IMG_2258.png"
                            alt="V-Bucks"
                        >

                        <span>${price}</span>

                    </div>

                </div>
            `;


            // =================================================
            // CLIC SUR LA CARTE
            // =================================================

            card.addEventListener("click", () => {

                openItemModal(
                    item,
                    price
                );

            });


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


            shopContainer.appendChild(card);

        });


        // =====================================================
        // RESULTAT
        // =====================================================

        if (
            shopContainer.children.length === 0
        ) {

            status.textContent =
                "Aucun objet trouvé.";

        } else {

            status.textContent = "";

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

setupModal();

loadShop();


// =========================================================
// SERVICE WORKER
// =========================================================

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("./sw.js")

            .then(() => {

                console.log(
                    "Service worker activé"
                );

            })

            .catch(error => {

                console.error(
                    "Service worker :",
                    error
                );

            });

    });

}