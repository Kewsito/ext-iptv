// --- CONFIGURACIÓN Y VARIABLES GLOBALES ---
const CONFIG = {
    // IMPORTANTE: Si tu lista falla por CORS (ejemplo: GitHub), 
    // pon aquí un proxy como: 'https://corsproxy.io/?'
    proxyPrefix: '' 
};

import { extractChannels } from "./extractChannels.js";

let hls = null;
const videoElement = document.getElementById('main-video');
const container = document.getElementById('channels-container');
const emptyState = document.getElementById('empty-state');
const statusBadge = document.getElementById('status-badge');
const countLabel = document.getElementById('line-count');
const currentNameLabel = document.getElementById('current-channel-name');
const btnLoadList = document.getElementById('btn-load-list');

// --- INICIALIZACIÓN DE EVENTOS ---
document.addEventListener('DOMContentLoaded', () => {
    btnLoadList.addEventListener('click', async () => {
        try {
            await parsearLista();
        } catch (error) {
            console.error(error);
            statusBadge.innerText = '⚠️ Error';
            alert('No se pudo cargar la lista: ' + error.message);
        }
    });
});

// --- FUNCIÓN PRINCIPAL: PARSEAR LA LISTA (.M3U/M3U8) ---
async function parsearLista() {
    const textarea = document.getElementById('iptvList');
    const texto = textarea.value;

    if (!texto.trim()) return;

    countLabel.innerText = `Líneas: ${texto.split(/\r?\n/).filter(linea => linea.trim() !== '').length}`;

    const canales = await extractChannels(texto);
    renderizarCanales(canales);
    statusBadge.innerText = canales.length > 0 ? `✅ ${canales.length} canales` : '⚠️ Sin canales';
}

// --- FUNCIÓN DE RENDERIZADO (GRID TAILWIND) ---
function renderizarCanales(lista) {
    container.innerHTML = ''; // Limpiar
    
    if (lista.length === 0) {
        emptyState.style.display = 'flex';
        emptyState.classList.remove('opacity-0');
    } else {
        emptyState.style.display = 'none';
        
        lista.forEach((canal, index) => {
            const div = document.createElement('div');
            
            // Construir el HTML interno de la tarjeta
            const iconHtml = canal.logo 
                ? `<img src="${canal.logo}" class="w-5 h-5 rounded-full object-contain shrink-0" onerror="this.style.display='none'">`
                : `<svg class="w-5 h-5 text-gray-400 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 00-.512-1.705zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

            div.innerHTML = `
                <div class="channel-card bg-gray-800 border border-gray-600 p-3 rounded-lg cursor-pointer flex items-center gap-3 text-sm group relative overflow-hidden">
                    <div class="flex items-center gap-3">
                        ${iconHtml}
                        <span class="truncate font-medium text-gray-200">${canal.nombre || 'Sin Nombre'}</span>
                    </div>
                </div>
            `;

            // Evento Click - Con detección de errores
            div.onclick = async () => {
                try {
                    reproducirCanal(canal.url, canal.nombre);
                } catch (error) {
                    alert('Error al cargar el stream: ' + error.message);
                }
            };
            
            container.appendChild(div);
        });

        // Intentar reproducir el primero automáticamente (solo si tiene URL)
        if(lista[0] && lista[0].url && lista[0].url.length > 10) {
            reproducirCanal(lista[0].url, lista[0].nombre);
        }
    }
}

// --- LÓGICA DE REPRODUCCIÓN CON MANEJO DE CORS Y ERRORES ---
function reproducirCanal(url, nombre) {
    // Actualizar UI con el nombre del canal actual
    currentNameLabel.innerText = nombre || "Reproduciendo...";

    // Manejo inicial de HLS.js (Destruir instancia anterior si existe)
    if(hls) hls.destroy();
    
    const hlsInstance = new Hls();
    
    try {
        hlsInstance.loadSource(url);
        hlsInstance.attachMedia(videoElement);

        // Manejo de errores de manifest parsing
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
            videoElement.play().catch(e => console.log("Play failed:", e));
        });

        // Detener reproducción anterior cuando cambia de canal (opcional)
        if(videoElement.paused) {
            videoElement.play();
        }

    } catch (error) {
        throw new Error("Error al inicializar HLS: " + error.message);
    }
}
