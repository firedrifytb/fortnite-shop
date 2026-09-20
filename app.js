/* =========================================================
   FORTNITE SHOP
   ========================================================= */

const SHOP_API =
    "https://fortnite-api.com/v2/shop?language=fr";

const COSMETIC_API =
    "https://fortnite-api.com/v2/cosmetics/br/search/ids";


// =========================================================
// ÉLÉMENTS DOM
// =========================================================

const shopElement = document.getElementById("shop");
const statusElement = document.getElementById("status");
const dateElement = document.getElementById("date");

const modal = document.getElementById("item-modal");
const modalMedia = document.getElementById("modal-media");
const modalClose = document.getElementById("modal-close");

const modalName = document.getElementById("modal-name");
const modalPrice = document.getElementById("modal-price");
const modalExtraInfo = document.getElementById("modal-extra-info");
const modalDescription = document.getElementById("modal-description");

const previewTrack = document.getElementById("preview-track");
const modalVideo = document.getElementById("modal-video");
const modalYoutube = document.getElementById("modal-youtube");
const modalImage = document.getElementById("modal-image");

const previewStatus = document.getElementById("preview-status");
const carouselDots = document.getElementById("carousel-dots");
const videoFallback = document.getElementById("video-fallback");


// =========================================================
// ÉTAT
// =========================================================

let currentItem = null;

let currentSlide = 0;

let touchStartX = 0;
let touchStartY = 0;

let touchCurrentX = 0;

let isDragging = false;

let hasVideo = false;

let currentVideoUrl = null;


// =========================================================
// DATE
// =========================================================

function updateDate() {

    const now = new Date();

    dateElement.textContent =
        now.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
}


// =========================================================
// CHARGEMENT BOUTIQUE
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

        const response = await fetch(SHOP_API, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(
                `Erreur HTTP ${response.status}`
            );
        }

        const data = await response.json();

        const entries =
            data?.data?.entries ||
            data?.data?.shop ||
            [];

        if (!Array.isArray(entries) || entries.length === 0) {

            throw new Error(
                "Aucun objet trouvé dans la boutique."
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
            "Erreur chargement boutique :",
            error
        );

        statusElement.innerHTML = `
            <div class="error-status">
                Impossible de charger la boutique.
                <button onclick="loadShop()">
                    Réessayer
                </button>
            </div>
        `;
    }
}


// =========================================================
// RENDU DE LA BOUTIQUE
// =========================================================

function renderShop(entries) {

    shopElement.innerHTML = "";

    entries.forEach((entry, index) => {

        const item = extractShopItem(entry);

        if (!item) {
            return;
        }

        const card = createCard(
            item,
            index
        );

        shopElement.appendChild(card);
    });
}


// =========================================================
// EXTRACTION OBJET SHOP
// =========================================================

function extractShopItem(entry) {

    if (!entry) {
        return null;
    }

    let item =
        entry.brItems?.[0] ||
        entry.items?.[0] ||
        entry.brItems ||
        entry.items ||
        null;


    if (Array.isArray(item)) {
        item = item[0];
    }


    const id =
        item?.id ||
        entry?.id ||
        entry?.offerId ||
        null;


    const name =
        item?.name ||
        entry?.displayName ||
        entry?.name ||
        "Objet Fortnite";


    const description =
        item?.description ||
        "";


    const image =
        item?.images?.featured ||
        item?.images?.icon ||
        item?.images?.smallIcon ||
        item?.images?.full_background ||
        item?.images?.background ||
        entry?.newDisplayAsset?.renderImages?.[0]?.image ||
        entry?.bundle?.image ||
        null;


    const price =
        entry?.finalPrice ??
        entry?.regularPrice ??
        entry?.price?.finalPrice ??
        item?.price ??
        0;


    const rarity =
        item?.rarity?.displayValue ||
        item?.rarity?.value ||
        "";


    const type =
        item?.type?.displayValue ||
        item?.type?.value ||
        "";


    const series =
        item?.series?.name ||
        item?.series?.value ||
        "";


    return {
        id,
        name,
        description,
        image,
        price,
        rarity,
        type,
        series,
        raw: entry,
        cosmetic: item
    };
}


// =========================================================
// CRÉATION CARTE
// =========================================================

function createCard(item, index) {

    const card = document.createElement("article");

    card.className = "card";

    card.style.animationDelay =
        `${Math.min(index * 35, 500)}ms`;


    const imageContainer =
        document.createElement("div");

    imageContainer.className =
        "card-image";


    if (item.image) {

        const image =
            document.createElement("img");

        image.src = item.image;

        image.alt = item.name;

        image.loading = "lazy";

        image.decoding = "async";

        imageContainer.appendChild(image);

    } else {

        imageContainer.innerHTML = `
            <div class="no-image">
                IMAGE
            </div>
        `;
    }


    const overlay =
        document.createElement("div");

    overlay.className =
        "card-overlay";


    const info =
        document.createElement("div");

    info.className =
        "card-info";


    const name =
        document.createElement("h3");

    name.textContent =
        item.name;


    const bottom =
        document.createElement("div");

    bottom.className =
        "card-bottom";


    const price =
        document.createElement("div");

    price.className =
        "price";


    price.innerHTML = `
        ${formatPrice(item.price)}
        <span class="vbucks-symbol">V</span>
    `;


    bottom.appendChild(price);

    info.appendChild(name);

    info.appendChild(bottom);

    overlay.appendChild(info);

    imageContainer.appendChild(overlay);

    card.appendChild(imageContainer);


    card.addEventListener(
        "click",
        () => openModal(item)
    );


    return card;
}


// =========================================================
// PRIX
// =========================================================

function formatPrice(price) {

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {
        return "—";
    }

    const number =
        Number(price);

    if (Number.isNaN(number)) {
        return String(price);
    }

    return number.toLocaleString("fr-FR");
}


// =========================================================
// OUVRIR MODALE
// =========================================================

async function openModal(item) {

    currentItem = item;

    currentSlide = 0;

    hasVideo = false;

    currentVideoUrl = null;


    document.body.classList.add(
        "modal-open"
    );


    modal.classList.add("open");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    modalName.textContent =
        item.name;


    modalPrice.innerHTML = `
        ${formatPrice(item.price)}
        <span class="vbucks-symbol">V</span>
    `;


    modalDescription.textContent =
        item.description || "";


    const extraParts = [];

    if (item.type) {
        extraParts.push(item.type);
    }

    if (item.rarity) {
        extraParts.push(item.rarity);
    }

    if (item.series) {
        extraParts.push(item.series);
    }


    modalExtraInfo.textContent =
        extraParts.join(" • ");


    modalImage.src =
        item.image || "";


    modalImage.alt =
        item.name;


    resetVideo();


    createDots();


    updateSlide(
        0,
        false
    );


    /*
       On récupère les informations complètes
       du cosmétique afin de trouver la vidéo.
    */

    if (item.id) {

        try {

            const cosmetic =
                await fetchCosmetic(
                    item.id
                );


            if (
                currentItem !== item ||
                !modal.classList.contains("open")
            ) {
                return;
            }


            const video =
                findShowcaseVideo(
                    cosmetic
                );


            if (video) {

                hasVideo = true;

                currentVideoUrl =
                    video;

                loadVideo(
                    video
                );

                previewStatus.textContent =
                    "APERÇU ANIMÉ";

            } else {

                hasVideo = false;

                previewStatus.textContent =
                    "APERÇU";

                showVideoFallback(
                    false
                );
            }


            createDots();

            updateSlide(
                currentSlide,
                false
            );


        } catch (error) {

            console.warn(
                "Vidéo indisponible :",
                error
            );

            hasVideo = false;

            previewStatus.textContent =
                "APERÇU";

            createDots();

            updateSlide(
                0,
                false
            );
        }
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

    currentItem = null;
}


// =========================================================
// RESET VIDÉO
// =========================================================

function resetVideo() {

    if (modalVideo) {

        modalVideo.pause();

        modalVideo.removeAttribute(
            "src"
        );

        modalVideo.load();

        modalVideo.style.display =
            "none";
    }


    if (modalYoutube) {

        modalYoutube.src =
            "about:blank";

        modalYoutube.style.display =
            "none";
    }


    showVideoFallback(
        false
    );


    currentVideoUrl =
        null;
}


// =========================================================
// RÉCUPÉRATION COSMÉTIQUE
// =========================================================

async function fetchCosmetic(id) {

    const url =
        `${COSMETIC_API}?language=fr&id=${encodeURIComponent(id)}`;


    const response =
        await fetch(
            url,
            {
                cache: "no-store"
            }
        );


    if (!response.ok) {

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
// TROUVER VIDÉO
// =========================================================

function findShowcaseVideo(cosmetic) {

    if (!cosmetic) {
        return null;
    }


    /*
       FortniteAPI documente notamment :

       showcase_video_id
       showcase_video_url

       Certaines réponses peuvent également
       utiliser le camelCase showcaseVideo.
    */

    const candidates = [

        cosmetic.showcase_video_url,

        cosmetic.showcaseVideoUrl,

        cosmetic.showcase_video,

        cosmetic.showcaseVideo,

        cosmetic.showcase_video_id,

        cosmetic.showcaseVideoId

    ];


    for (const candidate of candidates) {

        if (
            typeof candidate !== "string"
        ) {
            continue;
        }


        const value =
            candidate.trim();


        if (!value) {
            continue;
        }


        /*
           Si c'est déjà une URL,
           on la conserve.
        */

        if (
            /^https?:\/\//i.test(value)
        ) {
            return value;
        }


        /*
           Sinon on considère que c'est
           un ID YouTube.
        */

        if (
            /^[a-zA-Z0-9_-]{6,}$/.test(value)
        ) {

            return value;
        }
    }


    return null;
}


// =========================================================
// CHARGER VIDÉO
// =========================================================

function loadVideo(value) {

    resetVideo();


    if (!value) {

        showVideoFallback(
            true
        );

        return;
    }


    const youtubeId =
        getYoutubeId(value);


    /*
       YOUTUBE
    */

    if (youtubeId) {

        modalYoutube.style.display =
            "block";


        modalYoutube.src =
            `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&playsinline=1&rel=0&modestbranding=1`;


        return;
    }


    /*
       VIDÉO DIRECTE
    */

    if (
        /^https?:\/\//i.test(value)
    ) {

        modalVideo.style.display =
            "block";


        modalVideo.src =
            value;


        modalVideo.muted =
            true;


        modalVideo.autoplay =
            true;


        modalVideo.loop =
            true;


        modalVideo.playsInline =
            true;


        modalVideo.load();


        const playPromise =
            modalVideo.play();


        if (
            playPromise &&
            typeof playPromise.catch === "function"
        ) {

            playPromise.catch(
                () => {
                    showVideoFallback(true);
                }
            );
        }


        return;
    }


    showVideoFallback(
        true
    );
}


// =========================================================
// EXTRAIRE ID YOUTUBE
// =========================================================

function getYoutubeId(value) {

    if (
        typeof value !== "string"
    ) {
        return null;
    }


    const clean =
        value.trim();


    /*
       ID YouTube direct
    */

    if (
        /^[a-zA-Z0-9_-]{11}$/.test(clean)
    ) {

        return clean;
    }


    try {

        const url =
            new URL(clean);


        const hostname =
            url.hostname
                .replace(/^www\./, "")
                .toLowerCase();


        /*
           youtube.com/watch?v=
        */

        if (
            hostname === "youtube.com" ||
            hostname === "m.youtube.com"
        ) {

            const id =
                url.searchParams.get("v");

            if (id) {
                return id;
            }
        }


        /*
           youtu.be/ID
        */

        if (
            hostname === "youtu.be"
        ) {

            const id =
                url.pathname
                    .replace("/", "")
                    .trim();

            if (id) {
                return id;
            }
        }


        /*
           youtube.com/embed/ID
        */

        if (
            hostname === "youtube.com"
        ) {

            const match =
                url.pathname.match(
                    /\/embed\/([^/]+)/
                );

            if (
                match &&
                match[1]
            ) {

                return match[1];
            }
        }

    } catch {
        return null;
    }


    return null;
}


// =========================================================
// FALLBACK VIDÉO
// =========================================================

function showVideoFallback(show) {

    if (!videoFallback) {
        return;
    }


    videoFallback.classList.toggle(
        "visible",
        Boolean(show)
    );
}


// =========================================================
// POINTS
// =========================================================

function createDots() {

    carouselDots.innerHTML = "";


    const count =
        hasVideo ? 2 : 1;


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const dot =
            document.createElement("button");


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
            `Afficher ${i === 0 && hasVideo ? "la vidéo" : "l'image"}`
        );


        dot.addEventListener(
            "click",
            (event) => {

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
// SLIDE
// =========================================================

function goToSlide(
    index
) {

    if (!hasVideo) {

        currentSlide = 0;

    } else {

        currentSlide =
            Math.max(
                0,
                Math.min(
                    1,
                    index
                )
            );
    }


    updateSlide(
        currentSlide,
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

    currentSlide =
        index;


    if (previewTrack) {

        previewTrack.style.transition =
            animate
                ? "transform 0.35s cubic-bezier(.22,.61,.36,1)"
                : "none";


        previewTrack.style.transform =
            `translateX(-${index * 50}%)`;
    }


    const dots =
        carouselDots.querySelectorAll(
            ".carousel-dot"
        );


    dots.forEach(
        (dot, dotIndex) => {

            dot.classList.toggle(
                "active",
                dotIndex === index
            );
        }
    );


    if (index === 0) {

        if (hasVideo) {

            previewStatus.textContent =
                "APERÇU ANIMÉ";

        } else {

            previewStatus.textContent =
                "APERÇU";
        }


        playCurrentVideo();

    } else {

        previewStatus.textContent =
            "IMAGE";

        pauseCurrentVideo();
    }
}


// =========================================================
// PLAY VIDÉO
// =========================================================

function playCurrentVideo() {

    if (!hasVideo) {
        return;
    }


    if (
        modalYoutube.style.display !== "none" &&
        modalYoutube.src !== "about:blank"
    ) {

        return;
    }


    if (
        modalVideo.style.display !== "none" &&
        modalVideo.src
    ) {

        modalVideo.muted =
            true;


        const promise =
            modalVideo.play();


        if (
            promise &&
            typeof promise.catch === "function"
        ) {

            promise.catch(
                () => {}
            );
        }
    }
}


// =========================================================
// PAUSE VIDÉO
// =========================================================

function pauseCurrentVideo() {

    if (modalVideo) {

        modalVideo.pause();
    }


    /*
       Pour YouTube, on ne garde pas
       la lecture active lorsqu'on passe
       sur l'image.
    */

    if (
        modalYoutube &&
        modalYoutube.src !== "about:blank"
    ) {

        const currentSrc =
            modalYoutube.src;


        modalYoutube.src =
            "about:blank";


        /*
           On recharge la vidéo lorsqu'on
           revient sur l'écran vidéo.
        */

        if (currentVideoUrl) {

            setTimeout(
                () => {

                    if (
                        modal.classList.contains("open") &&
                        currentSlide === 0
                    ) {

                        loadVideo(
                            currentVideoUrl
                        );
                    }

                },
                50
            );
        }
    }
}


// =========================================================
// SWIPE
// =========================================================

function handleTouchStart(event) {

    if (!modal.classList.contains("open")) {
        return;
    }


    const touch =
        event.touches[0];


    touchStartX =
        touch.clientX;


    touchStartY =
        touch.clientY;


    touchCurrentX =
        touchStartX;


    isDragging =
        true;


    previewTrack.style.transition =
        "none";
}


function handleTouchMove(event) {

    if (!isDragging) {
        return;
    }


    const touch =
        event.touches[0];


    touchCurrentX =
        touch.clientX;


    const deltaX =
        touchCurrentX -
        touchStartX;


    const deltaY =
        touch.clientY -
        touchStartY;


    /*
       Si le geste est principalement
       vertical, on ne force pas le swipe.
    */

    if (
        Math.abs(deltaY) >
        Math.abs(deltaX)
    ) {
        return;
    }


    event.preventDefault();


    const width =
        modalMedia.clientWidth;


    const percentage =
        (deltaX / width) * 50;


    const base =
        currentSlide * 50;


    let position =
        base - percentage;


    if (
        position < -5
    ) {
        position = -5;
    }


    if (
        position > 105
    ) {
        position = 105;
    }


    previewTrack.style.transform =
        `translateX(-${position}%)`;
}


function handleTouchEnd() {

    if (!isDragging) {
        return;
    }


    isDragging =
        false;


    const deltaX =
        touchCurrentX -
        touchStartX;


    const threshold =
        60;


    if (
        hasVideo &&
        Math.abs(deltaX) >= threshold
    ) {

        if (deltaX < 0) {

            goToSlide(1);

        } else {

            goToSlide(0);
        }

    } else {

        updateSlide(
            currentSlide,
            true
        );
    }
}


// =========================================================
// CLAVIER
// =========================================================

function handleKeyDown(event) {

    if (
        !modal.classList.contains("open")
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
            0
        );
    }


    if (
        event.key === "ArrowRight" &&
        hasVideo
    ) {

        goToSlide(
            1
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


document.querySelector(
    ".modal-backdrop"
).addEventListener(
    "click",
    closeModal
);


document.addEventListener(
    "keydown",
    handleKeyDown
);


modalMedia.addEventListener(
    "touchstart",
    handleTouchStart,
    {
        passive: true
    }
);


modalMedia.addEventListener(
    "touchmove",
    handleTouchMove,
    {
        passive: false
    }
);


modalMedia.addEventListener(
    "touchend",
    handleTouchEnd,
    {
        passive: true
    }
);


// =========================================================
// GESTION ERREUR VIDÉO
// =========================================================

modalVideo.addEventListener(
    "error",
    () => {

        /*
           Si le navigateur ne peut pas lire
           l'URL directement, on ne casse pas
           toute la modale.
        */

        if (
            currentSlide === 0
        ) {

            showVideoFallback(
                true
            );
        }
    }
);


modalVideo.addEventListener(
    "loadeddata",
    () => {

        showVideoFallback(
            false
        );
    }
);


// =========================================================
// INITIALISATION
// =========================================================

updateDate();

loadShop();