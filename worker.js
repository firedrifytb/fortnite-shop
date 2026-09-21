const EPIC_REDIRECT_URI =
    "https://fortnite-shop.firedrifytb.workers.dev/callback";

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // Connexion Epic Games
        if (url.pathname === "/login") {
            return handleLogin(request, env);
        }

        // Retour d'Epic Games après connexion
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

async function handleLogin(request, env) {
    if (!env.EPIC_CLIENT_ID) {
        return new Response(
            "Erreur : EPIC_CLIENT_ID n'est pas configuré dans Cloudflare.",
            { status: 500 }
        );
    }

    if (!env.EPIC_CLIENT_SECRET) {
        return new Response(
            "Erreur : EPIC_CLIENT_SECRET n'est pas configuré dans Cloudflare.",
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

    const authorizeUrl = new URL(
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

    // IMPORTANT :
    // Chaque cookie doit avoir son propre Set-Cookie.
    const headers = new Headers();

    headers.set(
        "Location",
        authorizeUrl.toString()
    );

    headers.append(
        "Set-Cookie",
        `epic_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
    );

    headers.append(
        "Set-Cookie",
        `epic_verifier=${codeVerifier}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
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
    const url = new URL(request.url);

    const code =
        url.searchParams.get("code");

    const state =
        url.searchParams.get("state");

    const error =
        url.searchParams.get("error");

    // Epic a refusé/annulé la connexion
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

    // Récupération des cookies
    const cookies = parseCookies(
        request.headers.get("Cookie") || ""
    );

    const savedState =
        cookies.epic_state;

    const codeVerifier =
        cookies.epic_verifier;

    // Vérification du state
    if (!savedState || savedState !== state) {
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

    // Vérification du PKCE verifier
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

    const credentials = btoa(
        `${env.EPIC_CLIENT_ID}:${env.EPIC_CLIENT_SECRET}`
    );

    const body = new URLSearchParams();

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

    const tokenResponse = await fetch(
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

    const userResponse = await fetch(
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

    const displayName =
        userData.displayName ||
        userData.preferred_username ||
        "Compte connecté";

    // ========================================================
    // NETTOYAGE DES COOKIES
    // ========================================================

    const headers = new Headers();

    headers.set(
        "Content-Type",
        "text/plain; charset=utf-8"
    );

    headers.set(
        "Cache-Control",
        "no-store"
    );

    // IMPORTANT :
    // Suppression des deux cookies séparément.
    headers.append(
        "Set-Cookie",
        "epic_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
    );

    headers.append(
        "Set-Cookie",
        "epic_verifier=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
    );

    return new Response(
        `Connexion Epic réussie !

Compte Epic : ${displayName}`,
        {
            status: 200,
            headers
        }
    );
}


// ============================================================
// RANDOM STRING
// ============================================================

function randomString(length) {
    const bytes =
        new Uint8Array(length);

    crypto.getRandomValues(bytes);

    return Array.from(bytes)
        .map(byte =>
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
        new TextEncoder().encode(value);

    const hash =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    const bytes =
        new Uint8Array(hash);

    let binary = "";

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}


// ============================================================
// PARSE COOKIES
// ============================================================

function parseCookies(cookieHeader) {
    const cookies = {};

    for (
        const part of cookieHeader.split(";")
    ) {
        const [
            name,
            ...rest
        ] = part.trim().split("=");

        if (!name) {
            continue;
        }

        cookies[name] =
            rest.join("=");
    }

    return cookies;
}