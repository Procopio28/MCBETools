// scripts/script.js
const resultEl = document.getElementById('result');
const submitBtn = document.getElementById('submitBtn');
const gamertagInput = document.getElementById('gamertag');

async function fetchSkinData(gamertag) {
    if (!gamertag) {
        resultEl.innerHTML = '<strong>Please enter a gamertag.</strong>';
        return;
    }
    
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = 'Loading...';
    resultEl.innerHTML = `<em>Looking up XUID for <strong>${escapeHtml(gamertag)}</strong>…</em>`;
    
    try {
        // 1) Get XUID
        const xuidResp = await fetch(`https://api.geysermc.org/v2/xbox/xuid/${encodeURIComponent(gamertag)}`);
        if (!xuidResp.ok) throw new Error(`XUID lookup failed: ${xuidResp.status} ${xuidResp.statusText}`);
        const xuidText = await xuidResp.text();
        let xuid = null;
        try {
            const xuidJson = JSON.parse(xuidText);
            xuid = xuidJson?.xuid || xuidJson?.id || null;
        } catch {
            xuid = xuidText.trim();
        }
        if (!xuid) throw new Error('No XUID found for that gamertag.');
        
        resultEl.innerHTML = `<strong>XUID:</strong> ${escapeHtml(xuid)}<br/>Fetching skin data…`;
        
        // 2) Get skin data
        const skinResp = await fetch(`https://api.geysermc.org/v2/skin/${encodeURIComponent(xuid)}`);
        if (!skinResp.ok) throw new Error(`Skin lookup failed: ${skinResp.status} ${skinResp.statusText}`);
        const skinText = await skinResp.text();
        
        // Extract texture ID (try multiple patterns)
        const texturePatterns = [
            /"texture_id"\s*:\s*"([a-f0-9]+)"/i,
            /"textureId"\s*:\s*"([a-f0-9]+)"/i,
            /https?:\/\/textures\.minecraft\.net\/texture\/([a-f0-9]+)/i,
            /"url"\s*:\s*"https?:\/\/textures\.minecraft\.net\/texture\/([a-f0-9]+)"/i
        ];
        let textureId = null;
        for (const p of texturePatterns) {
            const m = skinText.match(p);
            if (m && m[1]) {
                textureId = m[1];
                break;
            }
        }
        
        const hashMatch = skinText.match(/"hash"\s*:\s*"([a-zA-Z0-9]+)"/i);
        const isSteveMatch = skinText.match(/"is_steve"\s*:\s*(true|false)/i);
        
        // Build UI output
        let html = `<strong>XUID:</strong> ${escapeHtml(xuid)}`;
        if (textureId) {
            const textureUrl = `https://textures.minecraft.net/texture/${textureId}`;
            html += `<br/><strong>Texture ID:</strong> ${escapeHtml(textureId)}`;
            html += `<div id="skinImageContainer"><img src="${textureUrl}" alt="Minecraft texture for ${escapeHtml(gamertag)}"></div>`;
            html += `<div><a id="openTexture" class="download-link" href="${textureUrl}" target="_blank" rel="noopener">Open texture</a> · <a id="downloadTexture" class="download-link" href="#" role="button">Download texture</a></div>`;
        } else {
            html += `<br/><em>No texture ID found in API response.</em>`;
        }
        
        if (hashMatch) html += `<br/><strong>Hash:</strong> ${escapeHtml(hashMatch[1])}`;
        if (isSteveMatch) html += `<br/><strong>Is Steve:</strong> ${escapeHtml(isSteveMatch[1])}`;
        
        resultEl.innerHTML = html;
        
        // Add download handler
        if (textureId) {
            document.getElementById('downloadTexture').addEventListener('click', async (e) => {
                e.preventDefault();
                const url = `https://textures.minecraft.net/texture/${textureId}`;
                const filename = `${gamertag}_texture.png`;
                const btn = e.currentTarget;
                try {
                    btn.textContent = 'Downloading…';
                    const resp = await fetch(url);
                    if (!resp.ok) throw new Error(`Failed to fetch texture: ${resp.status}`);
                    const blob = await resp.blob();
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(a.href);
                    btn.textContent = 'Downloaded';
                } catch (err) {
                    console.warn('Download failed (possibly CORS). Opening in new tab.', err);
                    window.open(url, '_blank', 'noopener');
                    btn.textContent = 'Open texture';
                }
            }, { once: true });
        }
        
    } catch (err) {
        console.error(err);
        resultEl.innerHTML = `<span style="color:crimson;">Error: ${escapeHtml(err.message)}</span>`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = originalBtnText;
    }
}

// Prevent HTML injection in output
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (s) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    } [s]));
}

// Event listeners
submitBtn.addEventListener('click', () => {
    fetchSkinData(gamertagInput.value.trim());
});

gamertagInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        fetchSkinData(gamertagInput.value.trim());
    }
});