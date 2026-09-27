// File: src/components/sensors/TCRT5000UI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class TCRT5000UI extends BaseUIComponent {
    static getDimensions() { return [100, 180]; }
    getSVG() {
        return `<svg width="100" height="180" viewBox="0 0 100 180" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="glow-pwr" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#ef4444" flood-opacity="0.8"/>
            </filter>
            <filter id="glow-do" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#22c55e" flood-opacity="0.8"/>
            </filter>
        </defs>

        <!-- 1. Papan PCB (Biru) - Simetris terhadap X=50 -->
        <rect x="5" y="2" width="90" height="155" rx="4" fill="#0284c7" stroke="#0369a1" stroke-width="1.5"/>

        <!-- 2. Kepala Sensor TCRT5000 (Rata Tengah di X=50) -->
        <rect x="25" y="10" width="50" height="24" rx="2" fill="#0f172a" stroke="#1e293b"/>
        <!-- TX (LED IR Emitor) -->
        <circle cx="37" cy="22" r="6" fill="#38bdf8" opacity="0.9"/> 
        <circle cx="37" cy="22" r="2.5" fill="#ffffff" opacity="0.6"/> 
        <!-- RX (Fototransistor Penerima) -->
        <circle cx="63" cy="22" r="6" fill="#020617" stroke="#334155" stroke-width="1"/> 
        <!-- Sekat Optik Pemisah -->
        <rect x="48.5" y="10" width="3" height="24" fill="#020617"/> 

        <!-- 3. Komponen SMD Atas (Terdistribusi Rata) -->
        <rect x="14" y="45" width="8" height="16" fill="#ffffff"/>
        <rect x="14" y="49" width="8" height="9" fill="#4b5563"/>
        <rect x="14" y="51" width="8" height="6" fill="#1f2937"/>

        <rect x="29" y="45" width="8" height="16" fill="#ffffff"/>
        <rect x="29" y="49" width="8" height="9" fill="#4b5563"/>
        <rect x="29" y="51" width="8" height="6" fill="#1f2937"/>

        <rect x="44" y="45" width="8" height="16" fill="#ffffff"/>
        <rect x="44" y="49" width="8" height="9" fill="#4b5563"/>
        <rect x="44" y="51" width="8" height="6" fill="#1f2937"/>

        <rect x="59" y="45" width="8" height="16" fill="#ffffff"/>
        <rect x="60" y="48" width="6" height="10" fill="#e5c07b"/>

        <rect x="74" y="45" width="8" height="16" fill="#ffffff"/>
        <rect x="75" y="48" width="6" height="10" fill="#e5c07b"/>

        <!-- 4. IC Komparator LM393 -->
        <path d="M 20 72 v 6 M 27 72 v 6 M 34 72 v 6 M 41 72 v 6
                 M 20 92 v 6 M 27 92 v 6 M 34 92 v 6 M 41 92 v 6" 
              stroke="#d1d5db" stroke-width="2.5" stroke-linecap="square"/>
        <rect x="16" y="76" width="30" height="18" rx="1" fill="#0f172a"/>
        <circle cx="20" cy="80" r="1.5" fill="#1f2937"/>
        <text x="31" y="87" font-size="4" fill="#64748b" font-weight="bold" text-anchor="middle">LM393</text>

        <!-- 5. Trimmer Potensiometer Biru -->
        <rect x="56" y="70" width="30" height="30" rx="1" fill="#055db6"/>
        <circle cx="71" cy="84" r="8" fill="#ededf0"/>
        <line x1="67" y1="84" x2="75" y2="84" stroke="#a3a3a3" stroke-width="2.5" stroke-linecap="square"/>
        <line x1="71" y1="80" x2="71" y2="88" stroke="#a3a3a3" stroke-width="2.5" stroke-linecap="square"/>
        <circle cx="81" cy="95" r="1.5" fill="#e2e8f0"/>

        <!-- 6. Dua Komponen SMD Tengah -->
        <rect x="20" y="105" width="16" height="8" fill="#ffffff"/>
        <rect x="22" y="106" width="12" height="6" fill="#4b5563"/>
        <rect x="25" y="106" width="6" height="6" fill="#1f2937"/>

        <rect x="64" y="105" width="16" height="8" fill="#ffffff"/>
        <rect x="66" y="106" width="12" height="6" fill="#4b5563"/>
        <rect x="69" y="106" width="6" height="6" fill="#1f2937"/>

        <!-- 7. Lubang Baut PCB (Cincin Pad di Bawah, Lubang Gelap di Atas) -->
        <circle cx="50" cy="127" r="10" fill="#cbd5e1"/>
        <circle cx="50" cy="127" r="8" fill="#0f172a"/>

        <!-- 8. Indikator LED Kiri (Digital Out) & Kanan (Power) -->
        <rect x="13" y="118" width="8" height="17" fill="#94a3b8" rx="1"/>
        <rect class="anim-led-do" x="14.5" y="121" width="5" height="11" rx="1" fill="#475569"/>
        
        <rect x="79" y="118" width="8" height="17" fill="#94a3b8" rx="1"/>
        <rect class="anim-led-pwr" x="80.5" y="121" width="5" height="11" rx="1" fill="#475569"/>

        <!-- 9. Silkscreen Teks (Tepat Berada di Atas Pin Masing-Masing) -->
        <text x="20" y="147" font-size="6.5" font-family="sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">A0</text>
        <text x="40" y="147" font-size="6.5" font-family="sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">D0</text>
        <text x="60" y="147" font-size="6.5" font-family="sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">GND</text>
        <text x="80" y="147" font-size="6.5" font-family="sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">VCC</text>

        <!-- Rumah Soket Pin Plastik Hitam (Tengah di X=50) -->
        <rect x="15" y="150" width="70" height="6" rx="1" fill="#0f172a"/>

        <!-- 10. Empat Pin Header Konektor (X = 26, 42, 58, 74) -->
        <!-- A0 (Output 1) -->
        <line class="pin-out-1" x1="20" y1="154" x2="20" y2="175" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
        <!-- D0 (Output 0) -->
        <line class="pin-out-0" x1="40" y1="154" x2="40" y2="175" stroke="#facc15" stroke-width="3" stroke-linecap="round"/>
        <!-- GND (Input 1) -->
        <line class="pin-in-1" x1="60" y1="154" x2="60" y2="175" stroke="#22c55e" stroke-width="3" stroke-linecap="round"/>
        <!-- VCC (Input 0) -->
        <line class="pin-in-0" x1="80" y1="154" x2="80" y2="175" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
    }

    updateState(isSimActive) {
        const pwrLed = this.contentDiv.querySelector('.anim-led-pwr');
        const doLed = this.contentDiv.querySelector('.anim-led-do');
        
        // Perbaikan Bug Falsy: Gunakan Nullish Coalescing (??) agar nilai 0 (hitam pekat) tidak ter-reset ke 50
        const rawState = this.compData.state ?? 50;
        const kecerahan = typeof rawState === 'number' ? rawState : parseFloat(rawState);
        const isPowered = Boolean(this.compData.isPowered);
        
        // 1. LED Daya (Merah)
        if (pwrLed) {
            const isActive = isPowered && isSimActive;
            pwrLed.setAttribute('fill', isActive ? '#ef4444' : '#475569');
            pwrLed.setAttribute('filter', isActive ? 'url(#glow-pwr)' : 'none');
        }

        // 2. LED Digital Out (Hijau)
        // Di TCRT5000 asli, D0 aktif (LOW) & LED menyala saat pantulan cahaya kuat (permukaan putih/terang)
        if (doLed) {
            const isReflected = isPowered && isSimActive && (kecerahan > 50);
            doLed.setAttribute('fill', isReflected ? '#22c55e' : '#475569');
            doLed.setAttribute('filter', isReflected ? 'url(#glow-do)' : 'none');
        }
    }
}

UIRegistry['tcrt5000'] = TCRT5000UI;