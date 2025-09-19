import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const resultEl = document.getElementById('result');
const submitBtn = document.getElementById('submitBtn');
const gamertagInput = document.getElementById('gamertag');

let scene, camera, renderer, controls, playerModel, skinMaterial;
const outerLayerMeshes = { hat: null, jacket: null, leftSleeve: null, rightSleeve: null, leftLeg: null, rightLeg: null };
let pendingSkinUrl = null;
const DEFAULT_SKIN = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAFDUlEQVR42u2a20sUURzH9+99d9fdpZs0w2wzC5MyS3uRKAu9i5AIKgrsA/WHB727i4iIIgg+iGigIARBEARBEARBkBC6iIggCMrOys6MImvdtb3dmd2Z+T7Dsm3btj27a4eE/OHs85zvM+e3A/Cvrf0pKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkp6X8pSO/B1NXXh+7e/aALCwvcBvCgq4d2cwe+9xYUWg4AAcDlDqgSAgBAATgAIEQACgDANOj2gYyNPeju6Z0DMDY2RjQ1wTUDgOq//+1uBwBJsD4SgAAYyAAYyAAYyAB0RkdH/R0VFaV//PjxXzMzsx8EwIAzJycnoLe39xMAuK+vb5W4urqegGMANAZgVlZWewBw8vLy8o8DAFgGnB4aGmpgZWX1AEBNTd34zMxMc7S0tGQDAJgA2M/Pzw8MDAwMANjb22sDMEFAnB4bG+sCgL29vV+cnJy8DAA3AJQAnK2t7QeA27a2tph++PAhAIBHRkb+BIG/vr5+bWtr6wcAODU19aOxigDYysoqBwBHR0f/3Nra+hPAm5qaPoyNjZVra2tXgQ8PD/cCAMgCaGdn58N6e3sfBIDXi4uLSRcXFz8AwL29vR8EgFLA5wOAgYGBv5qbmyuMjo5+ERoaKjQAxON8fHx8AQA/AcRiAODk5OQjANyB4IqKiu6Li4t/AODi4uInAPwGgBEAGRoa+geAWYDNzc3/ASAiKioq/g+AUElJSX8AwNra2n8AMDU11Z/S0tLfBwBfXV1dIS8v7/cAMDY29qJpEUDJycl/RUVF/QAAlZWV3YcPH/4rCEO0GQDc3t7+PTg4+KcAmM3Nzf9ZWVn5CQCtra39CQDMzc393dTU9CAAwG8/dnZ2/gUAXl5e/gIAWVlZ/QEAz8/P/y8iIvLzAYAsLCz8AwD8/f3/LwD8+fn5PwTAr6+v/wPgr6+v/xEAfr6+/v8SgHPz8/P/DwD4+Pj4FwB+Pj7+PwD49vb2LwLgu7u7/xcAfnd39/8FgKenp/8GgKenp/9LAE5PT0//DwD4/v7+PwD4/v7+PwD48/PzLwDg5+fn/wDg7e3t/xIAp7e3t/8DgLe3t/9bAM5tbW3/A4DX19f/AgCvry//WgBOXV3d/wDgy8vL/wCAry8v/1sAzhUVFf8BgIuLi/8BgIuLi/8tACfExcX/AMCnpqb+EwD2d3f/LwAcrq6u/wOAm5ub/wsAz8/P/wcA2tvb/z0A5vb29r8CwNPT038IgLa2tv+3AFxaWvr/AsDFxUX+DQAWFhbyAwA8PDz8LwCMjIx8AwAcHR39LwA2Njb+DQAcHx//LwD8/Pz8AwCcnZ39LQBWVlb+DQCurq7+LwD4+Pj4BQB2dnb+LQCOjo7+DQCWlpbyAwAsLCz8AwCcnJy8BQAeHh7+CgD29vb+AwAcHR39CgA7Ozv/AwA8PDz8AgC2trb+CgAODg7+DQAsLCz8CgC2trb+LwB4eXn5AwAsLCwMAOB/AwC8vLwMAOAcAMBisSiYTqeBkJ+fD63VahEIBL58Pp+srq6u+fT09IeB/gYAeDAzM+MAgHw+D233ej24XC5yc3OzaTQazWtra5tff39/AOr1GQA4neU/AQBCQYIgAAAAAElFTkSuQmCC";

function initViewer() {
    const container = document.getElementById('viewer-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x353942);
    scene.fog = new THREE.Fog(0x353942, 10, 25);
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 2.5);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(3, 10, 5);
    scene.add(directionalLight);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.minDistance = 2;
    controls.maxDistance = 15;
    controls.enablePan = false;
    controls.update();
    window.addEventListener('resize', onWindowResize);
    loadModel();
    animate();
}

async function loadModel() {
    const loadingOverlay = document.getElementById('loading-overlay');
    try {
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync('./player.glb');
        playerModel = gltf.scene;
        playerModel.traverse(node => {
            if (node.isMesh) {
                if (!skinMaterial) {
                    skinMaterial = node.material;
                    skinMaterial.transparent = true;
                    skinMaterial.alphaTest = 0.1;
                }
                switch (node.name) {
                    case 'hat':
                        outerLayerMeshes.hat = node;
                        break;
                    case 'jacket':
                        outerLayerMeshes.jacket = node;
                        break;
                    case 'left_sleeve':
                    case 'left_sleeve.001':
                        outerLayerMeshes.leftSleeve = node;
                        break;
                    case 'right_sleeve':
                    case 'right_sleeve.001':
                        outerLayerMeshes.rightSleeve = node;
                        break;
                    case 'left_pants':
                    case 'left_pants.001':
                        outerLayerMeshes.leftLeg = node;
                        break;
                    case 'right_pants':
                    case 'right_pants.001':
                        outerLayerMeshes.rightLeg = node;
                        break;
                }
            }
        });
        Object.values(outerLayerMeshes).forEach(m => { if (m) m.visible = true; });
        scene.add(playerModel);
        if (pendingSkinUrl) {
            applySkin(pendingSkinUrl);
            pendingSkinUrl = null;
        } else {
            applySkin(DEFAULT_SKIN);
        }
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    } catch (err) {
        console.error('Failed to load model:', err);
        if (loadingOverlay) loadingOverlay.textContent = 'Error: Could not load player.glb.';
    }
}

function applySkin(url) {
    if (!skinMaterial) {
        pendingSkinUrl = url;
        return;
    }
    const loader = new THREE.TextureLoader();
    if (typeof loader.setCrossOrigin === 'function') loader.setCrossOrigin('anonymous');
    loader.load(url, texture => {
        if (skinMaterial.map) skinMaterial.map.dispose();
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.flipY = false;
        texture.encoding = THREE.sRGBEncoding;
        skinMaterial.map = texture;
        skinMaterial.needsUpdate = true;
    }, undefined, error => {
        console.error('An error occurred while loading the texture.', error);
    });
}

function onWindowResize() {
    const container = document.getElementById('viewer-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

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
        const skinResp = await fetch(`https://api.geysermc.org/v2/skin/${encodeURIComponent(xuid)}`);
        if (!skinResp.ok) throw new Error(`Skin lookup failed: ${skinResp.status} ${skinResp.statusText}`);
        const skinText = await skinResp.text();
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
        let html = '';
        if (textureId) {
            const textureUrl = `https://textures.minecraft.net/texture/${textureId}`;
            html += `<div id="skinImageContainer"><img src="${textureUrl}" alt="Minecraft texture for ${escapeHtml(gamertag)}"></div>`;
            html += `<div><a id="openTexture" class="download-link" href="${textureUrl}" target="_blank" rel="noopener">Open texture</a> · <a id="downloadTexture" class="download-link" href="#" role="button">Download texture</a></div>`;
            html += `<details><summary>Show details</summary><div class="details-content">`;
            html += `<strong>XUID:</strong> ${escapeHtml(xuid)}<br/>`;
            html += `<strong>Texture ID:</strong> ${escapeHtml(textureId)}<br/>`;
            if (hashMatch) html += `<strong>Hash:</strong> ${escapeHtml(hashMatch[1])}<br/>`;
            if (isSteveMatch) html += `<strong>Is Steve:</strong> ${escapeHtml(isSteveMatch[1])}<br/>`;
            html += `</div></details>`;
            resultEl.innerHTML = html;
            applySkin(textureUrl);
            const downloadEl = document.getElementById('downloadTexture');
            downloadEl.addEventListener('click', async (e) => {
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
        } else {
            html = `<strong>XUID:</strong> ${escapeHtml(xuid)}<br/><em>No texture ID found in API response.</em>`;
            html += `<details><summary>Show details</summary><div class="details-content">`;
            if (hashMatch) html += `<strong>Hash:</strong> ${escapeHtml(hashMatch[1])}<br/>`;
            if (isSteveMatch) html += `<strong>Is Steve:</strong> ${escapeHtml(isSteveMatch[1])}<br/>`;
            html += `</div></details>`;
            resultEl.innerHTML = html;
        }
    } catch (err) {
        console.error(err);
        resultEl.innerHTML = `<span style="color:crimson;">Error: ${escapeHtml(err.message)}</span>`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = originalBtnText;
    }
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } [s]));
}

submitBtn.addEventListener('click', () => {
    fetchSkinData(gamertagInput.value.trim());
});

gamertagInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        fetchSkinData(gamertagInput.value.trim());
    }
});

initViewer();