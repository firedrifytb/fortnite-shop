const EPIC_REDIRECT_URI =
    "https://fortnite-shop.firedrifytb.workers.dev/callback";

const SITE_URL =
    "https://fortnite-shop.fr";

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // Connexion Epic Games
        if (url.pathname === "/login") {
            return handleLogin(env);
        }

        // Retour d'Epic Games
        if (url.pathname === "/callback") {
            return handleCallback(request, env);
        }

        // Toutes les autres pages = site Fortnite Shop
        return env.ASSETS.fetch(request);
    }
};


// ============================================================
// LOGIN
// ============================================================

async function handleLogin(env) {

    if (!env.EPIC_CLIENT_ID) {
        return new Response(
            "Erreur : EPIC_CLIENT_ID n'est pas configuré.",
            { status: 500 }
        );
    }

    if (!env.EPIC_CLIENT_SECRET) {
        return new Response(
            "Erreur : EPIC_CLIENT_SECRET n'est pas configuré.",
            { status: 500 }
        );
    }

    // State OAuth
    const state = randomString(32);

    // PKCE verifier
    const codeVerifier = randomString(64);

    // PKCE challenge
    const codeChallenge =
        await sha256Base64Url(codeVerifier);

    /*
     * On stocke le state et le verifier
     * dans un seul cookie.
     */
    const oauthData =
        `${state}.${codeVerifier}`;

    const oauthCookie =
        base64UrlEncode(oauthData);

    // URL d'autorisation Epic
    const authorizeUrl =
        new URL(
            "https://www.epicgames.com/id/authorize"
        );

    authorizeUrl.searchParams.set(
        "client_id",
        env.EPIC_CLIENT_ID
    );

    authorizeUrl.searchParams.set(
        "response_type",
        "code"
    );

    authorizeUrl.searchParams.set(
        "scope",
        "openid basic_profile"
    );

    authorizeUrl.searchParams.set(
        "redirect_uri",
        EPIC_REDIRECT_URI
    );

    authorizeUrl.searchParams.set(
        "state",
        state
    );

    authorizeUrl.searchParams.set(
        "code_challenge",
        codeChallenge
    );

    authorizeUrl.searchParams.set(
        "code_challenge_method",
        "S256"
    );

    const headers =
        new Headers();

    headers.set(
        "Location",
        authorizeUrl.toString()
    );

    headers.append(
        "Set-Cookie",
        `epic_oauth=${oauthCookie}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
    );

    headers.set(
        "Cache-Control",
        "no-store"
    );

    return new Response(null, {
        status: 302,
        headers
    });
}


// ============================================================
// CALLBACK
// ============================================================

async function handleCallback(request, env) {

    const url =
        new URL(request.url);

    const code =
        url.searchParams.get("code");

    const state =
        url.searchParams.get("state");

    const error =
        url.searchParams.get("error");


    // --------------------------------------------------------
    // Erreur Epic
    // --------------------------------------------------------

    if (error) {

        return new Response(
            `Connexion Epic annulée ou refusée : ${error}`,
            {
                status: 400,
                headers: {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                }
            }
        );
    }


    // --------------------------------------------------------
    // Vérification code + state
    // --------------------------------------------------------

    if (!code || !state) {

        return new Response(
            "Erreur : code ou state manquant.",
            {
                status: 400,
                headers: {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                }
            }
        );
    }


    // --------------------------------------------------------
    // Lecture du cookie OAuth
    // --------------------------------------------------------

    const cookies =
        parseCookies(
            request.headers.get("Cookie") || ""
        );

    const oauthCookie =
        cookies.epic_oauth;


    if (!oauthCookie) {

        return new Response(
            "Erreur : session OAuth manquante. Recommence la connexion depuis le site.",
            {
                status: 400,
                headers: {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                }
            }
        );
    }


    // --------------------------------------------------------
    // Décodage du cookie
    // --------------------------------------------------------

    let oauthData;

    try {

        oauthData =
            base64UrlDecode(
                oauthCookie
            );

    } catch {

        return new Response(
            "Erreur : cookie OAuth invalide.",
            {
                status: 400,
                headers: {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                }
            }
        );
    }


    // --------------------------------------------------------
    // Séparation state / verifier
    // --------------------------------------------------------

    const separatorIndex =
        oauthData.indexOf(".");


    if (separatorIndex === -1) {

        return new Response(
            "Erreur : données PKCE invalides.",
            {
                status: 400,
                headers: {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                }
            }
        );
    }


    const savedState =
        oauthData.slice(
            0,
            separatorIndex
        );

    const codeVerifier =
        oauthData.slice(
            separatorIndex + 1
        );


    // --------------------------------------------------------
    // Vérification du state
    // --------------------------------------------------------

    if (
        !savedState ||
        savedState !== state
    ) {

        return new Response(
            "Erreur de sécurité : state OAuth invalide.",
            {
                status: 400,
                headers: {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                }
            }
        );
    }


    // --------------------------------------------------------
    // Vérification PKCE
    // --------------------------------------------------------

    if (!codeVerifier) {

        return new Response(
            "Erreur : PKCE verifier manquant.",
            {
                status: 400,
                headers: {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                }
            }
        );
    }


    // ========================================================
    // ÉCHANGE DU CODE CONTRE LE TOKEN
    // ========================================================

    const credentials =
        btoa(
            `${env.EPIC_CLIENT_ID}:${env.EPIC_CLIENT_SECRET}`
        );

    const body =
        new URLSearchParams();

    body.set(
        "grant_type",
        "authorization_code"
    );

    body.set(
        "code",
        code
    );

    body.set(
        "redirect_uri",
        EPIC_REDIRECT_URI
    );

    body.set(
        "code_verifier",
        codeVerifier
    );

    body.set(
        "scope",
        "openid basic_profile"
    );


    const tokenResponse =
        await fetch(
            "https://api.epicgames.dev/epic/oauth/v2/token",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded",

                    "Authorization":
                        `Basic ${credentials}`
                },

                body
            }
        );


    const tokenData =
        await tokenResponse.json();


    // --------------------------------------------------------
    // Erreur lors de l'échange du token
    // --------------------------------------------------------

    if (!tokenResponse.ok) {

        return new Response(
            "Erreur Epic lors de la récupération du token.\n\n" +
            JSON.stringify(
                tokenData,
                null,
                2
            ),
            {
                status: 400,
                headers: {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                }
            }
        );
    }


    // ========================================================
    // RÉCUPÉRATION DU PROFIL EPIC
    // ========================================================

    const userResponse =
        await fetch(
            "https://api.epicgames.dev/epic/oauth/v2/userInfo",
            {
                headers: {
                    "Authorization":
                        `Bearer ${tokenData.access_token}`
                }
            }
        );


    const userData =
        await userResponse.json();


    if (!userResponse.ok) {

        return new Response(
            "Connexion réussie, mais impossible de récupérer le profil Epic.",
            {
                status: 400,
                headers: {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                }
            }
        );
    }


    // ========================================================
    // CONNEXION RÉUSSIE
    // ========================================================

    const displayName =
        userData.displayName ||
        userData.preferred_username ||
        "Compte connecté";


    /*
     * IMPORTANT :
     *
     * Pour cette première étape, on ne met PAS
     * le token dans l'URL.
     *
     * On redirige simplement vers le site.
     *
     * La prochaine étape sera de créer une vraie
     * session sécurisée côté Worker pour que le
     * site puisse connaître le compte connecté.
     */

    const successUrl =
        new URL(
            SITE_URL
        );

    successUrl.searchParams.set(
        "login",
        "success"
    );

    successUrl.searchParams.set(
        "name",
        displayName
    );


    const headers =
        new Headers();

    headers.set(
        "Location",
        successUrl.toString()
    );

    headers.set(
        "Cache-Control",
        "no-store"
    );

    // Suppression du cookie OAuth temporaire
    headers.append(
        "Set-Cookie",
        "epic_oauth=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
    );


    return new Response(null, {
        status: 302,
        headers
    });
}


// ============================================================
// RANDOM STRING
// ============================================================

function randomString(length) {

    const bytes =
        new Uint8Array(length);

    crypto.getRandomValues(
        bytes
    );

    return Array.from(bytes)
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("");
}


// ============================================================
// SHA-256 → BASE64URL
// ============================================================

async function sha256Base64Url(value) {

    const data =
        new TextEncoder()
            .encode(value);

    const hash =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    const bytes =
        new Uint8Array(hash);

    let binary = "";

    for (const byte of bytes) {

        binary +=
            String.fromCharCode(
                byte
            );
    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}


// ============================================================
// BASE64URL ENCODE
// ============================================================

function base64UrlEncode(value) {

    const bytes =
        new TextEncoder()
            .encode(value);

    let binary = "";

    for (const byte of bytes) {

        binary +=
            String.fromCharCode(
                byte
            );
    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}


// ============================================================
// BASE64URL DECODE
// ============================================================

function base64UrlDecode(value) {

    let base64 =
        value
            .replace(/-/g, "+")
            .replace(/_/g, "/");

    while (
        base64.length % 4 !== 0
    ) {
        base64 += "=";
    }

    const binary =
        atob(base64);

    const bytes =
        Uint8Array.from(
            binary,
            char =>
                char.charCodeAt(0)
        );

    return new TextDecoder()
        .decode(bytes);
}


// ============================================================
// PARSE COOKIES
// ============================================================

function parseCookies(cookieHeader) {

    const cookies = {};

    for (
        const part
        of cookieHeader.split(";")
    ) {

        const [
            name,
            ...rest
        ] =
            part.trim().split("=");

        if (!name) {
            continue;
        }

        cookies[name] =
            rest.join("=");
    }

    return cookies;
}