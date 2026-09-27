// File: src/components/sensors/JoystickUI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class JoystickUI extends BaseUIComponent {
    static getDimensions() { return [120, 160]; }  

    getSVG() {
        return `<svg width="120" height="160" viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="8" width="120" height="125" rx="5" fill="#1e293b" stroke="#0f172a" stroke-width="2"/>
            
            <circle cx="9" cy="18" r="5" fill="#cbd5e1" stroke="#c5a12a"/>
            <circle cx="111" cy="18" r="5" fill="#cbd5e1" stroke="#c5a12a"/>
            <circle cx="9" cy="115" r="5" fill="#cbd5e1" stroke="#c5a12a"/>
            <circle cx="111" cy="115" r="5" fill="#cbd5e1" stroke="#c5a12a"/>

            <line x1="18" y1="42" x2="18" y2="88" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="2 2"/>
            <polyline points="15,44 18,38 21,44" fill="#94a3b8"/>
            <polyline points="15,86 18,92 21,86" fill="#94a3b8"/>
            <text x="11" y="67" font-size="7" font-family="sans-serif" font-weight="bold" fill="#f8fafc" text-anchor="middle">Y</text>

            <line x1="33" y1="24" x2="87" y2="24" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="2 2"/>
            <polyline points="35,21 29,24 35,27" fill="#94a3b8"/>
            <polyline points="85,21 91,24 85,27" fill="#94a3b8"/>
            <text x="60" y="19" font-size="7" font-family="sans-serif" font-weight="bold" fill="#f8fafc" text-anchor="middle">X</text>

            <rect x="25" y="30" width="70" height="70" rx="4" fill="#334155" stroke="#0f172a" stroke-width="2"/>
            <circle cx="60" cy="65" r="33" fill="#000000" stroke="#1e293b" stroke-width="2"/>

            <!-- GRUP TUAS JOYSTICK (Target Event Listener) -->
            <g class="joystick-stick" transform="translate(60, 65)" style="cursor: grab;">
                <circle cx="0" cy="0" r="25" fill="#020617" opacity="0.6"/>
                <circle cx="0" cy="0" r="23" fill="#101111" stroke="#171718" stroke-width="1.5"/>
                <circle cx="0" cy="0" r="17" fill="none" stroke="#334155" stroke-width="1"/>
                <circle cx="0" cy="0" r="5.5" fill="none" stroke="#334155" stroke-width="1"/>
            </g>

            <rect x="100" y="32" width="7" height="4.5" rx="1" fill="#475569" class="power-led"/>

            <!-- 6. Label Silkscreen Pin Header Vertikal -->
            <g fill="#cbd5e1" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="start">
            <g transform="translate(24, 119) rotate(-90)">
                <text x="0" y="0">GND</text>
            </g>
            <g transform="translate(42, 119) rotate(-90)">
                <text x="0" y="0">+5V</text>
            </g>
            <g transform="translate(62, 119) rotate(-90)">
                <text x="0" y="0">VRx</text>
            </g>
            <g transform="translate(82, 119) rotate(-90)">
                <text x="0" y="0">VRy</text>
            </g>
            <g transform="translate(102, 119) rotate(-90)">
                <text x="0" y="0">SW</text>
            </g>
        </g>

            <rect x="14" y="122" width="92" height="8" rx="1.5" fill="#0f172a"/>

            <line class="pin-in-1" x1="20" y1="126" x2="20" y2="152" stroke="#713f12" stroke-width="2.5" stroke-linecap="round"/>
            <line class="pin-in-0" x1="40" y1="126" x2="40" y2="152" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>        
            <line class="pin-out-0" x1="60" y1="126" x2="60" y2="152" stroke="#eab308" stroke-width="2.5" stroke-linecap="round"/>
            <line class="pin-out-1" x1="80" y1="126" x2="80" y2="152" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round"/>
            <line class="pin-out-2" x1="100" y1="126" x2="100" y2="152" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round"/>
        </svg>`;
    }

    updateState(isSimActive) {
        const stick = this.contentDiv.querySelector('.joystick-stick');
        const pwrLed = this.contentDiv.querySelector('.power-led');
        if (!stick) return;

        const isPowered = this.compData.isPowered || false;
        if (pwrLed) {
            pwrLed.setAttribute('fill', (isPowered && isSimActive) ? '#ef4444' : '#475569');
        }

        let stateObj = { x: 0, y: 0, btn: 0 }; 
        if (this.compData.state) {
            try { 
                const parsed = (typeof this.compData.state === 'string') ? JSON.parse(this.compData.state) : this.compData.state; 
                if (typeof parsed === 'object' && parsed !== null) stateObj = parsed;
            } 
            catch (e) { stateObj = { x: 0, y: 0, btn: 0 }; }
        }

        // ==========================================
        // SISTEM INTERAKSI DRAG & DROP MANUAL PADA SVG
        // ==========================================
        if (!stick.dataset.eventsBound) {
            stick.dataset.eventsBound = "true"; 
            
            let isDragging = false;
            let svgRect;

            // BLOKIR MENU KONTEKS (Klik Kanan) KHUSUS DI AREA JOYSTICK
            stick.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });

            const onStart = (e) => {
                // 1. Mencegah seluruh komponen terbawa saat digeser
                e.stopPropagation(); 
                // Izinkan Klik Kiri (0) dan Klik Kanan (2). Tolak klik tengah/scroll (1)
                if (e.type === 'mousedown' && e.button !== 0 && e.button !== 2) return; 

                isDragging = true;
                stick.dataset.isDragging = "true";
                stick.style.cursor = "grabbing";
                
                svgRect = this.contentDiv.querySelector('svg').getBoundingClientRect();

                // PENENTUAN STATUS TOMBOL (SW) BERDASARKAN JENIS KLIK
                if (e.type === 'mousedown' && e.button === 2) {
                    stateObj.btn = 1; // Klik Kanan = Ditekan
                } else {
                    stateObj.btn = 0; // Klik Kiri / Sentuh Layar HP = Tidak Ditekan
                }

                this.compData.state = JSON.stringify(stateObj);

                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onEnd);
                document.addEventListener('touchmove', onMove, { passive: false });
                document.addEventListener('touchend', onEnd);

                // Perbarui ukuran visual tuas seketika saat diklik
                const scale = (stateObj.btn === 1) ? 0.9 : 1.0;
                stick.style.transform = `translate(60px, 65px) scale(${scale})`;
            };

            const onMove = (e) => {
                if (!isDragging) return;
                e.preventDefault();  // Cegah layar HP scroll saat nge-drag

                let clientX = e.touches ? e.touches[0].clientX : e.clientX;
                let clientY = e.touches ? e.touches[0].clientY : e.clientY;

                // 2. Kalkulasi Zoom & Skala (Menyesuaikan dengan viewBox 120x160)
                let scaleX = 120 / svgRect.width;
                let scaleY = 160 / svgRect.height;
                
                let mouseX = (clientX - svgRect.left) * scaleX;
                let mouseY = (clientY - svgRect.top) * scaleY;

                // Hitung jarak kursor dari titik pusat Joystick (X=60, Y=65)
                let dx = mouseX - 60;
                let dy = mouseY - 65;

                // Batasi jarak tarikan maksimal (Radius 20px) agar tuas tidak keluar dari batas
                let distance = Math.sqrt(dx*dx + dy*dy);
                if (distance > 20) {
                    dx = (dx / distance) * 20;
                    dy = (dy / distance) * 20;
                }

                // 3. Konversi Pergeseran (Pixel) menjadi Persentase (-100% s/d 100%)
                // dx bervariasi dari -20px hingga +20px. (dx / 20) * 100 menghasilkan -100 hingga +100!
                let xPercent = (dx / 20) * 100;
                // Y: Di SVG, atas adalah MINUS. Karena kita ingin Atas = +100%, maka nilai dy dikalikan negatif (-)
                let yPercent = -(dy / 20) * 100;

                stateObj.x = Math.round(xPercent);
                stateObj.y = Math.round(yPercent);
                
                this.compData.state = JSON.stringify(stateObj);

                // Pertahankan ukuran tuas berdasarkan status klik (Kiri/Kanan) saat ini
                const scale = (stateObj.btn === 1) ? 0.9 : 1.0;
                stick.style.transform = `translate(${60 + dx}px, ${65 + dy}px) scale(${scale})`;
            };

           const onEnd = (e) => {
                if (!isDragging) return;
                isDragging = false;
                stick.dataset.isDragging = "false";
                stick.style.cursor = "grab";

                // Efek Pegas - Reset ke tengah dan lepaskan tekanan tombol
                stateObj = { x: 0, y: 0, btn: 0 };
                this.compData.state = JSON.stringify(stateObj);
                stick.style.transform = `translate(60px, 65px) scale(1.0)`;

                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onEnd);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('touchend', onEnd);
            };

            stick.addEventListener('mousedown', onStart);
            stick.addEventListener('touchstart', onStart, { passive: false });
        }

        // ==========================================
        // ANIMASI REGULER DARI MESIN FISIKA
        // ==========================================
        // Hanya update visual dari mesin JIKA joystick TIDAK sedang digeser oleh pengguna.
        // Ini mencegah efek getar (stutter/jitter) karena perkelahian antara Mouse vs Engine.
        if (stick.dataset.isDragging !== "true") {
            const translateX = (stateObj.x / 100) * 20;
            const translateY = -(stateObj.y / 100) * 20;
            const scale = (stateObj.btn === 1) ? 0.9 : 1.0;
            
            stick.style.transform = `translate(${60 + translateX}px, ${65 + translateY}px) scale(${scale})`;
        }
    }
}

UIRegistry['joystick'] = JoystickUI;