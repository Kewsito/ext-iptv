/*const URL =
  "https://raw.githubusercontent.com/Kewsito/lista-deportes-argentina/refs/heads/main/lista.m3u8";

*/
function fetchText(url) {
    if (typeof fetch === "function") {
    return fetch(url).then((res) => {
        if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
        }
        return res.text();
        });
    }

    return new Promise((resolve, reject) => {
    const https = require("https");
    https
        .get(url, (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
            data += chunk;
        });
        res.on("end", () => resolve(data));
        })
        .on("error", reject);
    });
}

function limpiarValor(valor) {
    if (valor == null) return null;

    let texto = String(valor).trim();

    if (!texto) return "";

    texto = texto.replace(/^['"]|['"]$/g, "");

    const matchMarkdown = texto.match(/^\[(.*?)\]\((https?:\/\/[^)]+)\)$/i);
    if (matchMarkdown) {
        return matchMarkdown[2];
    }

    const matchAngle = texto.match(/^<([^>]+)>$/);
    if (matchAngle) {
        return matchAngle[1];
    }

    const matchBracketUrl = texto.match(/^\[(https?:\/\/[^\]]+)\]$/i);
    if (matchBracketUrl) {
        return matchBracketUrl[1];
    }

    return texto;
}

function extraerLogo(linea) {
    const match = linea.match(/tvg-logo\s*=\s*["']?([^"'\s]+)["']?/i);
    return match ? limpiarValor(match[1]) : null;
}

function parseM3U8(text) {
    const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

    const canales = [];
    let canalActual = null;

    for (const linea of lines) {
    if (linea.startsWith("#EXTINF")) {
        const nombre = limpiarValor(
        linea
            .split(",")
            .pop() || "Sin nombre"
        );

        canalActual = {
        nombre: nombre || "Sin nombre",
        logo: extraerLogo(linea),
        url: null,
        };
    } else if (!linea.startsWith("#") && canalActual) {
        canalActual.url = limpiarValor(linea);
        canales.push(canalActual);
        canalActual = null;
    }
  }

  return canales;
}

async function scrapearCanales(url = URL) {
    const texto = await fetchText(url);
    const canales = parseM3U8(texto);

    console.log(canales);
    return canales;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { fetchText, parseM3U8, scrapearCanales };
}

if (typeof window !== "undefined") {
    window.scrapearCanales = scrapearCanales;
}

if (
    typeof process !== "undefined" &&
    process.versions &&
    process.versions.node
) {
    scrapearCanales().catch((error) => {
    console.error("Error al scrapear:", error);
    process.exit(1);
    });
}

export async function extractChannels(input) {
    const texto = String(input || "").trim();

    if (!texto) {
        return [];
    }

    if (/^https?:\/\//i.test(texto) || texto.includes("raw.githubusercontent") || texto.includes("github.com/")) {
        return scrapearCanales(texto);
    }

    return parseM3U8(texto);
}
