const API_URL = "https://fortnite-api.com/v2/shop?language=fr";

const shopContainer = document.getElementById("shop");
const status = document.getElementById("status");
const dateElement = document.getElementById("date");


// =========================================================
// MODAL
// =========================================================

const itemModal = document.getElementById("item-modal");
const modalBackdrop = document.querySelector(".modal-backdrop");
const modalClose = document.getElementById("modal-close");

const modalImage = document.getElementById("modal-image");
const modalName = document.getElementById("modal-name");
const modalPrice = document.getElementById("modal-price");


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

    itemModal.classList.add("active");
    itemModal.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");

}


// =========================================================
// FERMER LE MODAL
// =========================================================

function closeItemModal() {

    itemModal.classList.remove("active");
    itemModal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("modal-open");

}


// =========================================================
// BOUTON FERMER
// =========================================================

modalClose.addEventListener("click", closeItemModal);


// =========================================================
// CLIQUER SUR LE FOND
// =========================================================

modalBackdrop.addEventListener("click", closeItemModal);


// =========================================================
// TOUCHE ÉCHAP
// =========================================================

document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {
        closeItemModal();
    }

});


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

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Erreur API");
        }

        const result = await response.json();

        const entries = result.data.entries || [];

        const displayedItems = new Set();


        entries.forEach((entry, index) => {

            const item = entry.brItems?.[0];

            if (!item) return;

            const name = item.name;

            if (displayedItems.has(name)) return;

            displayedItems.add(name);


            const image =
                item.images?.featured ||
                item.images?.icon;

            if (!image) return;


            const price = entry.finalPrice ?? "?";


            // =================================================
            // CARD
            // =================================================

            const card = document.createElement("div");

            card.className = "card";

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
            // CLIQUE SUR LA CARTE
            // =================================================

            card.addEventListener("click", () => {

                openItemModal(item, price);

            });


            // Accessibilité clavier

            card.setAttribute("tabindex", "0");
            card.setAttribute("role", "button");


            card.addEventListener("keydown", (event) => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    openItemModal(item, price);

                }

            });


            shopContainer.appendChild(card);

        });


        // =====================================================
        // RESULTAT
        // =====================================================

        if (shopContainer.children.length === 0) {

            status.textContent =
                "Aucun objet trouvé.";

        } else {

            status.textContent = "";

        }


    } catch (error) {

        console.error(error);

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

    window.addEventListener("load", () => {

        navigator