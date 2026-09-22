/* =========================================================
   FORTNITE SHOP
   ========================================================= */

const SHOP_API =
    "https://fortnite-api.com/v2/shop?language=fr";

const COSMETIC_API =
    "https://fortnite-api.com/v2/cosmetics/br/search/ids";

// =========================================================
// DOM
// =========================================================

const shopElement =
    document.getElementById("shop");

const statusElement =
    document.getElementById("status");

const dateElement =
    document.getElementById("date");

const modal =
    document.getElementById("item-modal");

const modalMedia =
    document.getElementById("modal-media");

const modalClose =
    document.getElementById("modal-close");

const modalName =
    document.getElementById("modal-name");

const modalPrice =
    document.getElementById("modal-price");

const modalExtraInfo =
    document.getElementById("modal-extra-info");

const modalDescription =
    document.getElementById("modal-description");

const previewTrack =
    document.getElementById("preview-track");

const modalVideo =
    document.getElementById("modal-video");

const modalImage =
    document.getElementById("modal-image");

const previewStatus =
    document.getElementById("preview-status");

const carouselDots =
    document.getElementById("carousel-dots");

const videoFallback =
    document.getElementById("video-fallback");

// =========================================================
// ÉTAT
// =========================================================

let currentItem = null;
let currentSlide = 0;
let hasVideo = false;
let currentVideoUrl = null;

// =========================================================
// SWIPE
// =========================================================

let pointerStartX = 0;
let pointerStartY = 0;
let pointerCurrentX = 0;
let pointerCurrentY = 0;
let isDragging = false;
let swipeDirectionLocked = false;
let activePointerId = null;

// =========================================================
// DATE
// =========================================================

function updateDate() {

    const now =
        new Date();

    dateElement.textContent =
        now.toLocaleDateString(
            "fr-FR",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );
}

// =========================================================
// CHARGER LA BOUTIQUE
// =========================================================

async function loadShop() {

    updateDate();

    shopElement.innerHTML = "";

    statusElement.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <span>Chargement de la boutique...</span>
        </div>
    `;

    try {

        const response =
            await fetch(
                SHOP_API,
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                `Erreur HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        const entries =
            data?.data?.entries ||
            data?.data?.shop ||
            data?.entries ||
            data?.shop ||
            [];

        if (
            !Array.isArray(entries) ||
            entries.length === 0
        ) {

            throw new Error(
                "Aucun objet trouvé."
            );
        }

        renderShop(entries);

        statusElement.innerHTML = `
            <div class="loaded-status">
                <span class="loaded-dot"></span>
                Boutique chargée
            </div>
        `;

    } catch (error) {

        console.error(
            "Erreur boutique :",
            error
        );

        statusElement.innerHTML = `
            <div class="error-status">
                Impossible de charger la boutique.

                <button
                    type="button"
                    onclick="loadShop()"
                >
                    Réessayer
                </button>
            </div>
        `;
    }
}

// =========================================================
// RENDU SHOP
// =========================================================

function renderShop(entries) {

    shopElement.innerHTML = "";

    const bundleGroups =
        new Map();

    const musicItems =
        [];

    const categoryGroups =
        new Map();

    const setGroups =
        new Map();

    const otherItems =
        [];

    entries.forEach(
        (entry, index) => {

            const item =
                extractShopItem(entry);

            if (!item) {
                return;
            }

            /*
             * =====================================================
             * PRIORITÉ 1 : VRAIS BUNDLES
             * =====================================================
             *
             * Une offre bundle reste UNE SEULE CARTE.
             *
             * Tous les objets sont conservés dans item.items.
             */

            if (item.isBundle) {

                const bundleName =
                    item.name ||
                    "Pack Fortnite";

                if (
                    !bundleGroups.has(
                        bundleName
                    )
                ) {

                    bundleGroups.set(
                        bundleName,
                        []
                    );
                }

                bundleGroups
                    .get(bundleName)
                    .push({
                        item,
                        originalIndex: index
                    });

                return;
            }

            /*
             * =====================================================
             * PRIORITÉ 2 : MUSIQUES
             * =====================================================
             */

            if (
                item.category === "track" ||
                item.type === "Musique"
            ) {

                musicItems.push({
                    item,
                    originalIndex: index
                });

                return;
            }

            /*
             * =====================================================
             * PRIORITÉ 3 : CATÉGORIES
             * =====================================================
             */

            const category =
                getCategoryGroup(item);

            if (category) {

                if (
                    !categoryGroups.has(
                        category
                    )
                ) {

                    categoryGroups.set(
                        category,
                        []
                    );
                }

                categoryGroups
                    .get(category)
                    .push({
                        item,
                        originalIndex: index
                    });

                return;
            }

            /*
             * =====================================================
             * PRIORITÉ 4 : SETS
             * =====================================================
             */

            if (item.set) {

                if (
                    !setGroups.has(
                        item.set
                    )
                ) {

                    setGroups.set(
                        item.set,
                        []
                    );
                }

                setGroups
                    .get(item.set)
                    .push({
                        item,
                        originalIndex: index
                    });

                return;
            }

            /*
             * =====================================================
             * DERNIER RECOURS
             * =====================================================
             */

            otherItems.push({
                item,
                originalIndex: index
            });
        }
    );

    let groupIndex = 0;

    /*
     * =====================================================
     * PACKS
     * =====================================================
     */

    for (
        const [
            bundleName,
            bundleItems
        ] of bundleGroups
    ) {

        appendShopGroup(
            `📦 ${bundleName}`,
            bundleItems,
            groupIndex,
            "bundle"
        );

        groupIndex++;
    }

    /*
     * =====================================================
     * MUSIQUES
     * =====================================================
     */

    if (
        musicItems.length > 0
    ) {

        appendShopGroup(
            "🎵 Musiques",
            musicItems,
            groupIndex,
            "music"
        );

        groupIndex++;
    }

    /*
     * =====================================================
     * CATÉGORIES
     * =====================================================
     */

    const categoryOrder = [

        "Tenues",
        "Pioches",
        "Planeurs",
        "Dos",
        "Emotes",
        "Revêtements",
        "Aérosols",
        "Écrans de chargement",
        "Bannières",
        "Instruments"
    ];

    for (
        const categoryName
        of categoryOrder
    ) {

        if (
            !categoryGroups.has(
                categoryName
            )
        ) {

            continue;
        }

        appendShopGroup(
            `${getCategoryEmoji(categoryName)} ${categoryName}`,
            categoryGroups.get(
                categoryName
            ),
            groupIndex,
            "category"
        );

        groupIndex++;
    }

    /*
     * =====================================================
     * SETS
     * =====================================================
     */

    for (
        const [
            setName,
            setItems
        ] of setGroups
    ) {

        appendShopGroup(
            `✨ ${setName}`,
            setItems,
            groupIndex,
            "set"
        );

        groupIndex++;
    }

    /*
     * =====================================================
     * AUTRES
     * =====================================================
     */

    if (
        otherItems.length > 0
    ) {

        appendShopGroup(
            "Autres objets",
            otherItems,
            groupIndex,
            "other"
        );
    }
}

// =========================================================
// AJOUTER GROUPE
// =========================================================

function appendShopGroup(
    groupName,
    groupItems,
    groupIndex,
    groupType
) {

    const section =
        document.createElement(
            "section"
        );

    section.className =
        "shop-group";

    section.dataset.groupType =
        groupType;

    section.style.animationDelay =
        `${Math.min(
            groupIndex * 40,
            400
        )}ms`;

    const heading =
        document.createElement(
            "div"
        );

    heading.className =
        "shop-group-heading";

    const title =
        document.createElement(
            "h3"
        );

    title.textContent =
        groupName;

    const count =
        document.createElement(
            "span"
        );

    count.textContent =
        `${groupItems.length} ${
            groupItems.length > 1
                ? "offres"
                : "offre"
        }`;

    heading.appendChild(
        title
    );

    heading.appendChild(
        count
    );

    const grid =
        document.createElement(
            "div"
        );

    grid.className =
        "shop-group-grid";

    groupItems.forEach(
        ({
            item,
            originalIndex
        }) => {

            grid.appendChild(
                createCard(
                    item,
                    originalIndex
                )
            );
        }
    );

    section.appendChild(
        heading
    );

    section.appendChild(
        grid
    );

    shopElement.appendChild(
        section
    );
}

// =========================================================
// EXTRACTION OBJET / BUNDLE
// =========================================================

function extractShopItem(entry) {

    if (!entry) {
        return null;
    }

    /*
     * =====================================================
     * TOUS LES OBJETS DE L'OFFRE
     * =====================================================
     */

    let items = [];
    let itemCategory = "";

    if (
        Array.isArray(entry.items) &&
        entry.items.length > 0
    ) {

        items =
            entry.items;

        itemCategory =
            "item";

    } else if (
        Array.isArray(entry.brItems) &&
        entry.brItems.length > 0
    ) {

        items =
            entry.brItems;

        itemCategory =
            "br";

    } else if (
        Array.isArray(entry.tracks) &&
        entry.tracks.length > 0
    ) {

        items =
            entry.tracks;

        itemCategory =
            "track";

    } else if (
        Array.isArray(entry.instruments) &&
        entry.instruments.length > 0
    ) {

        items =
            entry.instruments;

        itemCategory =
            "instrument";

    } else if (
        entry.items &&
        typeof entry.items === "object"
    ) {

        items = [
            entry.items
        ];

        itemCategory =
            "item";

    } else if (
        entry.brItems &&
        typeof entry.brItems === "object"
    ) {

        items = [
            entry.brItems
        ];

        itemCategory =
            "br";

    } else {

        return null;
    }

    if (
        items.length === 0
    ) {

        return null;
    }

    /*
     * Premier objet uniquement utilisé
     * comme référence pour les infos générales.
     *
     * Le tableau complet reste dans "items".
     */

    const firstItem =
        items[0];

    /*
     * =====================================================
     * ID
     * =====================================================
     */

    const id =
        entry?.offerId ||
        entry?.id ||
        firstItem?.id ||
        null;

    /*
     * =====================================================
     * NOM
     * =====================================================
     */

    const name =
        entry?.bundle?.name ||
        entry?.bundle?.displayName ||
        entry?.bundle?.title ||
        entry?.displayName ||
        entry?.name ||
        firstItem?.name ||
        firstItem?.title ||
        "Objet Fortnite";

    /*
     * =====================================================
     * DESCRIPTION
     * =====================================================
     */

    const description =
        entry?.bundle?.description ||
        entry?.description ||
        firstItem?.description ||
        "";

    /*
     * =====================================================
     * IMAGE DU BUNDLE
     * =====================================================
     *
     * On cherche d'abord les images propres au bundle.
     * Seulement ensuite on prend celle d'un objet.
     */

    const bundleImage =
        entry?.bundle?.image ||
        entry?.bundle?.images?.featured ||
        entry?.bundle?.images?.icon ||
        entry?.bundle?.images?.background ||
        entry?.bundle?.images?.full_background ||
        entry?.newDisplayAsset?.renderImages?.[0]?.image ||
        entry?.newDisplayAsset?.renderImages?.[0]?.url ||
        entry?.displayAsset?.renderImages?.[0]?.image ||
        entry?.displayAsset?.renderImages?.[0]?.url ||
        null;

    const firstItemImage =
        firstItem?.images?.featured ||
        firstItem?.images?.icon ||
        firstItem?.images?.smallIcon ||
        firstItem?.images?.full_background ||
        firstItem?.images?.background ||
        firstItem?.albumArt ||
        firstItem?.albumArtUrl ||
        null;

    const image =
        bundleImage ||
        firstItemImage ||
        null;

    /*
     * =====================================================
     * PRIX
     * =====================================================
     */

    const regularPrice =
        Number(
            entry?.regularPrice ??
            entry?.price?.regularPrice ??
            entry?.bundle?.regularPrice ??
            0
        );

    const price =
        Number(
            entry?.finalPrice ??
            entry?.price?.finalPrice ??
            entry?.bundle?.finalPrice ??
            firstItem?.price ??
            0
        );

    /*
     * =====================================================
     * RÉDUCTION
     * =====================================================
     */

    const discount =
        Math.max(
            0,
            regularPrice - price
        );

    /*
     * =====================================================
     * DÉTECTION BUNDLE
     * =====================================================
     */

    const hasBundleObject =
        !!(
            entry?.bundle &&
            typeof entry.bundle === "object"
        );

    const explicitBundle =
        entry?.isBundle === true ||
        entry?.isPack === true ||
        entry?.offerType === "bundle" ||
        entry?.offerKind === "bundle";

    /*
     * IMPORTANT :
     *
     * On ne considère pas simplement "items.length > 1"
     * comme un bundle dans tous les cas, car certaines
     * offres peuvent contenir plusieurs objets sans être
     * un pack commercial.
     */

    const isBundle =
        hasBundleObject ||
        explicitBundle ||
        (
            Array.isArray(
                entry?.items
            ) &&
            entry.items.length > 1 &&
            (
                regularPrice > price ||
                entry?.bundle != null
            )
        );

    /*
     * =====================================================
     * RARETÉ
     * =====================================================
     */

    const rarity =
        firstItem?.rarity?.displayValue ||
        firstItem?.rarity?.value ||
        entry?.rarity?.displayValue ||
        entry?.rarity?.value ||
        "";

    /*
     * =====================================================
     * TYPE
     * =====================================================
     */

    let type = "";

    if (
        itemCategory === "track" ||
        (
            Array.isArray(
                entry.tracks
            ) &&
            entry.tracks.length > 0
        )
    ) {

        type =
            "Musique";

    } else if (
        itemCategory === "instrument"
    ) {

        type =
            "Instrument";

    } else {

        const rawType =
            firstItem?.type?.displayValue ||
            firstItem?.type?.value ||
            firstItem?.displayType ||
            entry?.type?.displayValue ||
            entry?.type?.value ||
            entry?.displayType ||
            "";

        type =
            normalizeItemType(
                rawType
            );
    }

    /*
     * =====================================================
     * SERIES
     * =====================================================
     */

    const series =
        firstItem?.series?.name ||
        firstItem?.series?.value ||
        "";

    /*
     * =====================================================
     * SET
     * =====================================================
     */

    const set =
        firstItem?.set?.value ||
        firstItem?.set?.name ||
        firstItem?.set?.displayValue ||
        firstItem?.set?.text ||
        entry?.set?.value ||
        entry?.set?.name ||
        entry?.set?.displayValue ||
        entry?.set?.text ||
        "";

    return {

        id,

        name,

        description,

        image,

        price,

        regularPrice,

        discount,

        rarity,

        type,

        series,

        set,

        /*
         * =================================================
         * IMPORTANT
         * =================================================
         *
         * Tous les objets de l'offre.
         */

        items,

        isBundle,

        /*
         * Données brutes conservées pour pouvoir
         * exploiter d'autres champs plus tard.
         */

        raw: entry,

        cosmetic: firstItem,

        category: itemCategory
    };
}

// =========================================================
// NORMALISER LE TYPE
// =========================================================

function normalizeItemType(
    rawType
) {

    if (!rawType) {
        return "";
    }

    const value =
        String(rawType)
            .trim()
            .toLowerCase();

    if (
        value.includes("music") ||
        value.includes("musique") ||
        value.includes("jam track") ||
        value.includes("track")
    ) {

        return "Musique";
    }

    if (
        value === "outfit" ||
        value.includes("tenue")
    ) {

        return "Tenue";
    }

    if (
        value === "pickaxe" ||
        value.includes("pioche") ||
        value.includes("harvesting tool")
    ) {

        return "Pioche";
    }

    if (
        value === "glider" ||
        value.includes("planeur")
    ) {

        return "Planeur";
    }

    if (
        value === "emote" ||
        value.includes("emote") ||
        value.includes("danse")
    ) {

        return "Emote";
    }

    if (
        value === "wrap" ||
        value.includes("wrap") ||
        value.includes("revêtement")
    ) {

        return "Revêtement";
    }

    if (
        value === "backpack" ||
        value === "back bling" ||
        value.includes("dos")
    ) {

        return "Dos";
    }

    if (
        value.includes("spray") ||
        value.includes("graffiti")
    ) {

        return "Aérosol";
    }

    if (
        value.includes("loading screen") ||
        value.includes("écran de chargement")
    ) {

        return "Écran de chargement";
    }

    if (
        value.includes("banner") ||
        value.includes("bannière")
    ) {

        return "Bannière";
    }

    return rawType;
}

// =========================================================
// GROUPE CATÉGORIE
// =========================================================

function getCategoryGroup(
    item
) {

    if (!item) {
        return "";
    }

    if (
        item.category === "instrument" ||
        item.type === "Instrument"
    ) {

        return "Instruments";
    }

    switch (
        item.type
    ) {

        case "Tenue":
            return "Tenues";

        case "Pioche":
            return "Pioches";

        case "Planeur":
            return "Planeurs";

        case "Dos":
            return "Dos";

        case "Emote":
            return "Emotes";

        case "Revêtement":
            return "Revêtements";

        case "Aérosol":
            return "Aérosols";

        case "Écran de chargement":
            return "Écrans de chargement";

        case "Bannière":
            return "Bannières";

        default:
            return "";
    }
}

// =========================================================
// EMOJIS
// =========================================================

function getCategoryEmoji(
    category
) {

    const emojis = {

        "Tenues": "👕",

        "Pioches": "⛏️",

        "Planeurs": "🪂",

        "Dos": "🎒",

        "Emotes": "🕺",

        "Revêtements": "🎨",

        "Aérosols": "🖌️",

        "Écrans de chargement": "🖼️",

        "Bannières": "🏳️",

        "Instruments": "🎸"
    };

    return (
        emojis[category] ||
        "✨"
    );
}

// =========================================================
// CARTE
// =========================================================

function createCard(
    item,
    index
) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "card";

    if (
        item.isBundle
    ) {

        card.classList.add(
            "bundle-card"
        );
    }

    card.style.animationDelay =
        `${Math.min(
            index * 35,
            500
        )}ms`;

    const imageContainer =
        document.createElement(
            "div"
        );

    imageContainer.className =
        "card-image";

    /*
     * =====================================================
     * BADGE RÉDUCTION
     * =====================================================
     */

    if (
        item.isBundle &&
        item.discount > 0
    ) {

        const discountBadge =
            document.createElement(
                "div"
            );

        discountBadge.className =
            "bundle-discount";

        discountBadge.textContent =
            `${formatPrice(
                item.discount
            )} V-BUCKS DE RÉDUC.`;

        imageContainer.appendChild(
            discountBadge
        );
    }

    /*
     * =====================================================
     * IMAGE
     * =====================================================
     */

    if (
        item.image
    ) {

        const image =
            document.createElement(
                "img"
            );

        image.src =
            item.image;

        image.alt =
            item.name;

        image.loading =
            "lazy";

        image.decoding =
            "async";

        image.onerror = () => {

            console.warn(
                "Image impossible à charger :",
                item.image
            );

            image.remove();
        };

        imageContainer.appendChild(
            image
        );

    } else {

        const fallback =
            document.createElement(
                "div"
            );

        fallback.className =
            "no-image";

        fallback.textContent =
            "FORTNITE";

        imageContainer.appendChild(
            fallback
        );
    }

    /*
     * =====================================================
     * CONTENU DE CARTE
     * =====================================================
     */

    const overlay =
        document.createElement(
            "div"
        );

    overlay.className =
        "card-overlay";

    const info =
        document.createElement(
            "div"
        );

    info.className =
        "card-info";

    const name =
        document.createElement(
            "h3"
        );

    name.textContent =
        item.name;

    const bottom =
        document.createElement(
            "div"
        );

    bottom.className =
        "card-bottom";

    const price =
        document.createElement(
            "div"
        );

    price.className =
        "price";

    /*
     * =====================================================
     * PRIX BUNDLE
     * =====================================================
     */

    if (
        item.isBundle &&
        item.regularPrice > item.price
    ) {

        price.innerHTML = `

            <span class="old-price">

                ${formatPrice(
                    item.regularPrice
                )}

                <span class="vbucks-symbol">
                    V
                </span>

            </span>

            <span class="bundle-price">

                ${formatPrice(
                    item.price
                )}

                <span class="vbucks-symbol">
                    V
                </span>

            </span>

        `;

    } else {

        price.innerHTML = `

            ${formatPrice(
                item.price
            )}

            <span class="vbucks-symbol">
                V
            </span>

        `;
    }

    /*
     * Nombre d'objets dans le pack
     */

    if (
        item.isBundle &&
        Array.isArray(item.items) &&
        item.items.length > 0
    ) {

        const itemCount =
            document.createElement(
                "span"
            );

        itemCount.className =
            "bundle-item-count";

        itemCount.textContent =
            `${item.items.length} objets`;

        bottom.appendChild(
            itemCount
        );
    }

    bottom.appendChild(
        price
    );

    info.appendChild(
        name
    );

    info.appendChild(
        bottom
    );

    overlay.appendChild(
        info
    );

    imageContainer.appendChild(
        overlay
    );

    card.appendChild(
        imageContainer
    );

    /*
     * =====================================================
     * CLICK
     * =====================================================
     */

    card.addEventListener(
        "click",
        () => openModal(item)
    );

    return card;
}

// =========================================================
// PRIX
// =========================================================

function formatPrice(
    price
) {

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {

        return "—";
    }

    const number =
        Number(price);

    if (
        Number.isNaN(number)
    ) {

        return String(price);
    }

    return number.toLocaleString(
        "fr-FR"
    );
}

// =========================================================
// OUVRIR MODALE
// =========================================================

async function openModal(
    item
) {

    currentItem =
        item;

    currentSlide =
        0;

    hasVideo =
        false;

    currentVideoUrl =
        null;

    isDragging =
        false;

    swipeDirectionLocked =
        false;

    activePointerId =
        null;

    document.body.classList.add(
        "modal-open"
    );

    modal.classList.add(
        "open"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    modalName.textContent =
        item.name;

    /*
     * =====================================================
     * PRIX MODALE
     * =====================================================
     */

    if (
        item.isBundle &&
        item.regularPrice > item.price
    ) {

        modalPrice.innerHTML = `

            <span class="old-price">

                ${formatPrice(
                    item.regularPrice
                )}

                <span class="vbucks-symbol">
                    V
                </span>

            </span>

            <span class="bundle-price">

                ${formatPrice(
                    item.price
                )}

                <span class="vbucks-symbol">
                    V
                </span>

            </span>

        `;

    } else {

        modalPrice.innerHTML = `

            ${formatPrice(
                item.price
            )}

            <span class="vbucks-symbol">
                V
            </span>

        `;
    }

    modalDescription.textContent =
        item.description ||
        "";

    const extraParts = [];

    if (
        item.isBundle &&
        Array.isArray(item.items)
    ) {

        extraParts.push(
            `${item.items.length} objets dans le pack`
        );
    }

    if (
        item.type
    ) {

        extraParts.push(
            item.type
        );
    }

    if (
        item.rarity
    ) {

        extraParts.push(
            item.rarity
        );
    }

    if (
        item.series
    ) {

        extraParts.push(
            item.series
        );
    }

    modalExtraInfo.textContent =
        extraParts.join(
            " • "
        );

    /*
     * =====================================================
     * IMAGE
     * =====================================================
     */

    modalImage.style.display =
        "block";

    modalImage.src =
        item.image ||
        "";

    modalImage.alt =
        item.name;

    previewTrack.style.transition =
        "none";

    previewTrack.style.transform =
        "translate3d(0, 0, 0)";

    resetVideo();

    createDots();

    updateSlide(
        0,
        false
    );

    /*
     * =====================================================
     * PAS D'ID
     * =====================================================
     */

    if (!item.id) {

        showVideoFallback();

        updateSlide(
            0,
            false
        );

        return;
    }

    /*
     * =====================================================
     * MUSIQUE / INSTRUMENT
     * =====================================================
     */

    if (
        item.category === "track" ||
        item.category === "instrument"
    ) {

        showVideoFallback();

        updateSlide(
            0,
            false
        );

        return;
    }

    try {

        const cosmetic =
            await fetchCosmetic(
                item.id
            );

        if (
            currentItem !== item ||
            !modal.classList.contains(
                "open"
            )
        ) {

            return;
        }

        const videoUrl =
            findDirectVideo(
                cosmetic
            );

        if (
            videoUrl
        ) {

            hasVideo =
                true;

            currentVideoUrl =
                videoUrl;

            loadDirectVideo(
                videoUrl
            );

        } else {

            hasVideo =
                false;

            resetVideo();

            showVideoFallback();
        }

        createDots();

        updateSlide(
            0,
            false
        );

    } catch (
        error
    ) {

        console.warn(
            "Impossible de récupérer la vidéo :",
            error
        );

        hasVideo =
            false;

        resetVideo();

        showVideoFallback();

        createDots();

        updateSlide(
            0,
            false
        );
    }
}

// =========================================================
// FERMER MODALE
// =========================================================

function closeModal() {

    modal.classList.remove(
        "open"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );

    resetVideo();

    currentItem =
        null;

    currentSlide =
        0;

    isDragging =
        false;

    activePointerId =
        null;
}

// =========================================================
// RESET VIDÉO
// =========================================================

function resetVideo() {

    if (
        !modalVideo
    ) {

        return;
    }

    try {

        modalVideo.pause();

    } catch {
        // Rien
    }

    modalVideo.removeAttribute(
        "src"
    );

    modalVideo.load();

    modalVideo.style.display =
        "none";

    videoFallback.classList.remove(
        "visible"
    );

    currentVideoUrl =
        null;
}

// =========================================================
// RÉCUPÉRATION COSMÉTIQUE
// =========================================================

async function fetchCosmetic(
    id
) {

    const url =
        `${COSMETIC_API}?language=fr&id=${encodeURIComponent(id)}`;

    const response =
        await fetch(
            url,
            {
                cache: "no-store"
            }
        );

    if (
        !response.ok
    ) {

        throw new Error(
            `Erreur cosmétique HTTP ${response.status}`
        );
    }

    const data =
        await response.json();

    return (
        data?.data?.[0] ||
        data?.data ||
        null
    );
}

// =========================================================
// TROUVER UNE VRAIE VIDÉO DIRECTE
// =========================================================

function findDirectVideo(
    cosmetic
) {

    if (!cosmetic) {
        return null;
    }

    const directCandidates = [

        cosmetic.showcase_video_url,

        cosmetic.showcaseVideoUrl,

        cosmetic.video_url,

        cosmetic.videoUrl,

        cosmetic.video,

        cosmetic.preview_video_url,

        cosmetic.previewVideoUrl,

        cosmetic.preview_video,

        cosmetic.previewVideo,

        cosmetic.media?.video,

        cosmetic.media?.videoUrl,

        cosmetic.media?.video_url,

        cosmetic.assets?.video,

        cosmetic.assets?.videoUrl,

        cosmetic.assets?.video_url
    ];

    for (
        const candidate
        of directCandidates
    ) {

        const found =
            extractDirectVideoUrl(
                candidate
            );

        if (
            found
        ) {

            return found;
        }
    }

    const recursiveResult =
        findVideoUrlDeep(
            cosmetic
        );

    if (
        recursiveResult
    ) {

        return recursiveResult;
    }

    return null;
}

// =========================================================
// EXTRAIRE URL DIRECTE
// =========================================================

function extractDirectVideoUrl(
    value
) {

    if (
        typeof value === "string"
    ) {

        const url =
            value.trim();

        if (
            isDirectVideoUrl(
                url
            )
        ) {

            return url;
        }

        return null;
    }

    if (
        value &&
        typeof value === "object"
    ) {

        const possibleKeys = [

            "url",
            "src",
            "source",
            "video",
            "videoUrl",
            "video_url",
            "file",
            "path"
        ];

        for (
            const key
            of possibleKeys
        ) {

            if (
                typeof value[key] ===
                "string"
            ) {

                const found =
                    value[key].trim();

                if (
                    isDirectVideoUrl(
                        found
                    )
                ) {

                    return found;
                }
            }
        }
    }

    return null;
}

// =========================================================
// RECHERCHE RÉCURSIVE VIDÉO
// =========================================================

function findVideoUrlDeep(
    value,
    depth = 0
) {

    if (
        depth > 8 ||
        value === null ||
        value === undefined
    ) {

        return null;
    }

    if (
        typeof value === "string"
    ) {

        return isDirectVideoUrl(
            value
        )
            ? value.trim()
            : null;
    }

    if (
        typeof value !== "object"
    ) {

        return null;
    }

    if (
        Array.isArray(value)
    ) {

        for (
            const child
            of value
        ) {

            const found =
                findVideoUrlDeep(
                    child,
                    depth + 1
                );

            if (
                found
            ) {

                return found;
            }
        }

        return null;
    }

    for (
        const [
            key,
            child
        ] of Object.entries(value)
    ) {

        const lowerKey =
            String(key)
                .toLowerCase();

        const looksLikeVideo =
            lowerKey.includes(
                "video"
            ) ||
            lowerKey.includes(
                "movie"
            ) ||
            lowerKey.includes(
                "preview"
            ) ||
            lowerKey.includes(
                "media"
            );

        if (
            looksLikeVideo
        ) {

            const found =
                extractDirectVideoUrl(
                    child
                );

            if (
                found
            ) {

                return found;
            }
        }

        if (
            child &&
            typeof child === "object"
        ) {

            const found =
                findVideoUrlDeep(
                    child,
                    depth + 1
                );

            if (
                found
            ) {

                return found;
            }
        }
    }

    return null;
}

// =========================================================
// VÉRIFIER URL VIDÉO
// =========================================================

function isDirectVideoUrl(
    value
) {

    if (
        typeof value !== "string"
    ) {

        return false;
    }

    try {

        const url =
            new URL(value);

        if (
            url.protocol !== "https:" &&
            url.protocol !== "http:"
        ) {

            return false;
        }

        const pathname =
            url.pathname.toLowerCase();

        const extensions = [

            ".mp4",
            ".webm",
            ".mov",
            ".m4v",
            ".ogv"
        ];

        return extensions.some(
            extension =>
                pathname.endsWith(
                    extension
                )
        );

    } catch {

        return false;
    }
}

// =========================================================
// CHARGER VIDÉO
// =========================================================

function loadDirectVideo(
    url
) {

    resetVideo();

    if (
        !isDirectVideoUrl(
            url
        )
    ) {

        return;
    }

    currentVideoUrl =
        url;

    modalVideo.style.display =
        "block";

    modalVideo.muted =
        true;

    modalVideo.autoplay =
        true;

    modalVideo.loop =
        true;

    modalVideo.playsInline =
        true;

    modalVideo.src =
        url;

    modalVideo.load();

    const playPromise =
        modalVideo.play();

    if (
        playPromise &&
        typeof playPromise.catch ===
        "function"
    ) {

        playPromise.catch(
            error => {

                console.warn(
                    "Lecture vidéo impossible :",
                    error
                );

                showVideoFallback();
            }
        );
    }
}

// =========================================================
// FALLBACK
// =========================================================

function showVideoFallback() {

    modalVideo.style.display =
        "none";

    videoFallback.classList.add(
        "visible"
    );
}

// =========================================================
// POINTS
// =========================================================

function createDots() {

    carouselDots.innerHTML =
        "";

    for (
        let i = 0;
        i < 2;
        i++
    ) {

        const dot =
            document.createElement(
                "button"
            );

        dot.type =
            "button";

        dot.className =
            "carousel-dot";

        if (
            i === currentSlide
        ) {

            dot.classList.add(
                "active"
            );
        }

        dot.setAttribute(
            "aria-label",
            i === 0
                ? "Afficher l'image"
                : "Afficher la vidéo"
        );

        dot.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                goToSlide(i);
            }
        );

        carouselDots.appendChild(
            dot
        );
    }
}

// =========================================================
// CHANGER SLIDE
// =========================================================

function goToSlide(
    index
) {

    const nextSlide =
        Math.max(
            0,
            Math.min(
                1,
                index
            )
        );

    currentSlide =
        nextSlide;

    updateSlide(
        nextSlide,
        true
    );
}

// =========================================================
// UPDATE SLIDE
// =========================================================

function updateSlide(
    index,
    animate = true
) {

    index =
        Math.max(
            0,
            Math.min(
                1,
                index
            )
        );

    currentSlide =
        index;

    previewTrack.style.transition =
        animate
            ? "transform 0.35s cubic-bezier(.22,.61,.36,1)"
            : "none";

    previewTrack.style.transform =
        `translate3d(-${index * 50}%, 0, 0)`;

    const dots =
        carouselDots.querySelectorAll(
            ".carousel-dot"
        );

    dots.forEach(
        (
            dot,
            dotIndex
        ) => {

            dot.classList.toggle(
                "active",
                dotIndex === index
            );
        }
    );

    if (
        index === 0
    ) {

        modalImage.style.display =
            "block";

        modalVideo.style.display =
            "none";

        videoFallback.classList.remove(
            "visible"
        );

        previewStatus.textContent =
            "IMAGE";

        pauseCurrentVideo();

        return;
    }

    modalImage.style.display =
        "none";

    if (
        hasVideo &&
        currentVideoUrl
    ) {

        previewStatus.textContent =
            "APERÇU ANIMÉ";

        modalVideo.style.display =
            "block";

        videoFallback.classList.remove(
            "visible"
        );

        playCurrentVideo();

    } else {

        previewStatus.textContent =
            "VIDÉO";

        modalVideo.style.display =
            "none";

        videoFallback.classList.add(
            "visible"
        );
    }
}

// =========================================================
// PLAY VIDÉO
// =========================================================

function playCurrentVideo() {

    if (
        !hasVideo ||
        !currentVideoUrl
    ) {

        return;
    }

    modalVideo.style.display =
        "block";

    modalVideo.muted =
        true;

    const promise =
        modalVideo.play();

    if (
        promise &&
        typeof promise.catch ===
        "function"
    ) {

        promise.catch(
            () => {}
        );
    }
}

// =========================================================
// PAUSE VIDÉO
// =========================================================

function pauseCurrentVideo() {

    if (
        modalVideo &&
        typeof modalVideo.pause ===
        "function"
    ) {

        modalVideo.pause();
    }
}

// =========================================================
// POINTER DOWN
// =========================================================

function handlePointerDown(
    event
) {

    if (
        !modal.classList.contains(
            "open"
        )
    ) {

        return;
    }

    if (
        event.pointerType ===
        "mouse"
    ) {

        return;
    }

    activePointerId =
        event.pointerId;

    pointerStartX =
        event.clientX;

    pointerStartY =
        event.clientY;

    pointerCurrentX =
        event.clientX;

    pointerCurrentY =
        event.clientY;

    isDragging =
        true;

    swipeDirectionLocked =
        false;

    previewTrack.style.transition =
        "none";

    try {

        modalMedia.setPointerCapture(
            event.pointerId
        );

    } catch {
        // Rien
    }
}

// =========================================================
// POINTER MOVE
// =========================================================

function handlePointerMove(
    event
) {

    if (
        !isDragging ||
        event.pointerId !==
        activePointerId
    ) {

        return;
    }

    pointerCurrentX =
        event.clientX;

    pointerCurrentY =
        event.clientY;

    const deltaX =
        pointerCurrentX -
        pointerStartX;

    const deltaY =
        pointerCurrentY -
        pointerStartY;

    if (
        !swipeDirectionLocked
    ) {

        if (
            Math.abs(deltaX) < 8 &&
            Math.abs(deltaY) < 8
        ) {

            return;
        }

        if (
            Math.abs(deltaY) >
            Math.abs(deltaX)
        ) {

            swipeDirectionLocked =
                true;

            isDragging =
                false;

            previewTrack.style.transition =
                "transform 0.25s ease";

            previewTrack.style.transform =
                `translate3d(-${currentSlide * 50}%, 0, 0)`;

            return;
        }

        swipeDirectionLocked =
            true;
    }

    event.preventDefault();

    const width =
        modalMedia.clientWidth;

    if (
        width <= 0
    ) {

        return;
    }

    const movementPercent =
        (deltaX / width) * 50;

    const basePosition =
        currentSlide * 50;

    let position =
        basePosition -
        movementPercent;

    if (
        position < 0
    ) {

        position =
            position * 0.18;
    }

    if (
        position > 50
    ) {

        position =
            50 +
            (position - 50) * 0.18;
    }

    previewTrack.style.transform =
        `translate3d(-${position}%, 0, 0)`;
}

// =========================================================
// POINTER UP
// =========================================================

function handlePointerUp(
    event
) {

    if (
        !isDragging ||
        event.pointerId !==
        activePointerId
    ) {

        return;
    }

    const deltaX =
        pointerCurrentX -
        pointerStartX;

    const width =
        modalMedia.clientWidth;

    const threshold =
        Math.max(
            45,
            width * 0.15
        );

    isDragging =
        false;

    activePointerId =
        null;

    if (
        deltaX < -threshold &&
        currentSlide === 0
    ) {

        goToSlide(1);

        return;
    }

    if (
        deltaX > threshold &&
        currentSlide === 1
    ) {

        goToSlide(0);

        return;
    }

    updateSlide(
        currentSlide,
        true
    );
}

// =========================================================
// POINTER CANCEL
// =========================================================

function handlePointerCancel(
    event
) {

    if (
        event.pointerId !==
        activePointerId
    ) {

        return;
    }

    isDragging =
        false;

    activePointerId =
        null;

    updateSlide(
        currentSlide,
        true
    );
}

// =========================================================
// CLAVIER
// =========================================================

function handleKeyDown(
    event
) {

    if (
        !modal.classList.contains(
            "open"
        )
    ) {

        return;
    }

    if (
        event.key === "Escape"
    ) {

        closeModal();

        return;
    }

    if (
        event.key === "ArrowLeft"
    ) {

        goToSlide(
            currentSlide - 1
        );

        return;
    }

    if (
        event.key === "ArrowRight"
    ) {

        goToSlide(
            currentSlide + 1
        );
    }
}

// =========================================================
// ÉVÉNEMENTS
// =========================================================

modalClose.addEventListener(
    "click",
    closeModal
);

const modalBackdrop =
    document.querySelector(
        ".modal-backdrop"
    );

if (
    modalBackdrop
) {

    modalBackdrop.addEventListener(
        "click",
        closeModal
    );
}

document.addEventListener(
    "keydown",
    handleKeyDown
);

// =========================================================
// SWIPE
// =========================================================

modalMedia.addEventListener(
    "pointerdown",
    handlePointerDown,
    {
        passive: true
    }
);

modalMedia.addEventListener(
    "pointermove",
    handlePointerMove,
    {
        passive: false
    }
);

modalMedia.addEventListener(
    "pointerup",
    handlePointerUp,
    {
        passive: true
    }
);

modalMedia.addEventListener(
    "pointercancel",
    handlePointerCancel,
    {
        passive: true
    }
);

// =========================================================
// ERREUR VIDÉO
// =========================================================

modalVideo.addEventListener(
    "error",
    () => {

        hasVideo =
            false;

        currentVideoUrl =
            null;

        if (
            currentSlide === 1
        ) {

            showVideoFallback();

            previewStatus.textContent =
                "VIDÉO";
        }
    }
);

// =========================================================
// VIDÉO CHARGÉE
// =========================================================

modalVideo.addEventListener(
    "loadeddata",
    () => {

        videoFallback.classList.remove(
            "visible"
        );

        hasVideo =
            true;
    }
);

// =========================================================
// INITIALISATION
// =========================================================

updateDate();

loadShop();