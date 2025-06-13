// ==UserScript==
// @name         Juiced Toolkit
// @namespace    http://tampermonkey.net/
// @version      6.1
// @description  meant for juice client, doesnt work on juice client ( def not ai generated )
// @author       You
// @match        https://snipers.io/
// @match        https://kirka.io/
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Create Juice Client Toolkit Menu
    const menu = document.createElement('div');
    menu.id = 'juiceClientMenu';
    menu.style = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.9);
        color: #fff;
        padding: 14px;
        border-radius: 10px;
        z-index: 999999;
        display: none;
        font-family: Arial, sans-serif;
        width: 270px;
        font-size: 14px;
    `;

    menu.innerHTML = `
        <h3 style="margin-top:0;">🍹 Juice Client Toolkit</h3>

        <strong>🎨 Visual Filters</strong><br>
        Saturation <input type="range" min="0" max="200" value="100" id="saturationSlider"><br>
        Brightness <input type="range" min="50" max="200" value="100" id="brightnessSlider"><br>
        Contrast <input type="range" min="50" max="200" value="100" id="contrastSlider"><br>
        Grayscale <input type="range" min="0" max="100" value="0" id="grayscaleSlider"><br>
        Night Light <input type="range" min="0" max="100" value="0" id="warmthSlider"><br>
        <button id="applyProPreset">🎯 Apply Pro Preset</button><br><br>

        <strong>📈 Performance</strong><br>
        <button id="toggleFPSCounter">📊 Toggle FPS Counter</button><br>
        <button id="toggleFPSPosition">📍 Set FPS Position</button><br><br>
    `;

    document.body.appendChild(menu);

    // Filters
    const style = document.createElement('style');
    const warmthOverlay = document.createElement('div');
    warmthOverlay.style = `
        position: fixed;
        top: 0; left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        background: rgba(255, 140, 0, 0);
        mix-blend-mode: overlay;
        z-index: 999997;
    `;
    document.body.appendChild(warmthOverlay);
    document.head.appendChild(style);

    const updateFilters = () => {
        const s = document.getElementById('saturationSlider').value;
        const b = document.getElementById('brightnessSlider').value;
        const c = document.getElementById('contrastSlider').value;
        const g = document.getElementById('grayscaleSlider').value;
        const w = document.getElementById('warmthSlider').value;
        warmthOverlay.style.background = `rgba(255, 140, 0, ${w / 200})`;
        style.textContent = `html { filter: saturate(${s}%) brightness(${b}%) contrast(${c}%) grayscale(${g}%); }`;
    };
    ['saturationSlider','brightnessSlider','contrastSlider','grayscaleSlider','warmthSlider'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateFilters);
    });
    document.getElementById('applyProPreset').addEventListener('click', () => {
        // A pro preset for quick adjustments
        document.getElementById('saturationSlider').value = 110;
        document.getElementById('brightnessSlider').value = 120;
        document.getElementById('contrastSlider').value = 130;
        document.getElementById('grayscaleSlider').value = 0;
        document.getElementById('warmthSlider').value = 10;
        updateFilters();
    });

    // Menu Toggle
    document.addEventListener('keydown', (e) => {
        if (e.key === '\\') {
            menu.style.display = (menu.style.display === 'none') ? 'block' : 'none';
        }
    });

    // FPS Counter
    let fpsCounterVisible = false;
    const fpsDisplay = document.createElement('div');
    fpsDisplay.style = `
        position: fixed;
        font-size: 18px;
        color: white;
        background: rgba(0, 0, 0, 0.7);
        padding: 5px 10px;
        border-radius: 5px;
        z-index: 999998;
        display: none;
    `;
    document.body.appendChild(fpsDisplay);

    let lastFrameTime = performance.now(), frames = 0, fps = 0;

    function measureFPS() {
        const now = performance.now();
        frames++;
        if (now - lastFrameTime >= 1000) {
            fps = frames;
            frames = 0;
            lastFrameTime = now;
            if (fpsCounterVisible) {
                fpsDisplay.textContent = `FPS: ${fps}`;
            }
        }
        requestAnimationFrame(measureFPS);
    }

    measureFPS();

    // Toggle FPS Counter Visibility
    document.getElementById('toggleFPSCounter').addEventListener('click', () => {
        fpsCounterVisible = !fpsCounterVisible;
        fpsDisplay.style.display = fpsCounterVisible ? 'block' : 'none';
    });

    // FPS Position Toggle
    const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    let currentPositionIndex = 0;

    document.getElementById('toggleFPSPosition').addEventListener('click', () => {
        currentPositionIndex = (currentPositionIndex + 1) % positions.length;
        const position = positions[currentPositionIndex];

        switch (position) {
            case 'top-left':
                fpsDisplay.style.top = '10px';
                fpsDisplay.style.left = '10px';
                fpsDisplay.style.right = '';
                fpsDisplay.style.bottom = '';
                break;
            case 'top-right':
                fpsDisplay.style.top = '10px';
                fpsDisplay.style.right = '10px';
                fpsDisplay.style.left = '';
                fpsDisplay.style.bottom = '';
                break;
            case 'bottom-left':
                fpsDisplay.style.bottom = '10px';
                fpsDisplay.style.left = '10px';
                fpsDisplay.style.top = '';
                fpsDisplay.style.right = '';
                break;
            case 'bottom-right':
                fpsDisplay.style.bottom = '10px';
                fpsDisplay.style.right = '10px';
                fpsDisplay.style.top = '';
                fpsDisplay.style.left = '';
                break;
        }
    });
})();
