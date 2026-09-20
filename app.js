const API_URL = "https://fortnite-api.com/v2/shop?language=fr";

const shopContainer = document.getElementById("shop");
const status = document.getElementById("status");
const dateElement = document.getElementById("date");


/* =========================================================
   DATE
========================================================= */

function displayDate() {
    const today = new Date();

    dateElement.textContent = today.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}


/* =========================================================
   SHOP
========================================================= */

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


            /* =================================================
               CARD
            ================================================= */

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
    src="IMG_2558.png"
    alt="V-Bucks"
>

                        <span>${price}</span>

                    </div>

                </div>
            `;


            shopContainer.appendChild(card);

        });


        /* =================================================
           RESULT
        ================================================= */

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


/* =========================================================
   INITIALISATION
========================================================= */

displayDate();

loadShop();


/* =========================================================
   SERVICE WORKER
========================================================= */

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("./sw.js")

            .then(() => {
                console.log("Service worker activé");
            })

            .catch(error => {
                console.error(
                    "Service worker:",
                    error
                );
            });

    });

}