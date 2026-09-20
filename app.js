const API_URL = "https://fortnite-api.com/v2/shop?language=fr";

const shopContainer = document.getElementById("shop");
const status = document.getElementById("status");
const dateElement = document.getElementById("date");

function displayDate() {
    const today = new Date();

    dateElement.textContent = today.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

async function loadShop() {
    status.textContent = "Chargement de la boutique...";
    shopContainer.innerHTML = "";

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Erreur API");
        }

        const result = await response.json();

        const entries = result.data.entries || [];

        const displayedItems = new Set();

        entries.forEach(entry => {
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

            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <img src="${image}" alt="${name}">
                <div class="card-info">
                    <h2>${name}</h2>
                    <div class="price">🪙 ${price} V-Bucks</div>
                </div>
            `;

            shopContainer.appendChild(card);
        });

        if (shopContainer.children.length === 0) {
            status.textContent = "Aucun objet trouvé.";
        } else {
            status.textContent = "";
        }

    } catch (error) {
        console.error(error);

        status.textContent =
            "❌ Impossible de charger la boutique. Réessaie dans quelques secondes.";
    }
}

displayDate();
loadShop();