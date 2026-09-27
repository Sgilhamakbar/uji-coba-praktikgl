// File: src/components/switches/PotentiometerUI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class PotentiometerUI extends BaseUIComponent {
  static getDimensions() { return [100, 80]; }
  getSVG() {
    return `<svg width="100" height="80" viewBox="0 0 100 80" style="overflow: visible; font-family: ui-sans-serif, system-ui, sans-serif;">
        <!-- Tombol Pengendali & Indikator Nilai -->
        <rect class="control-btn btn-down" x="-2" y="4" width="26" height="14" rx="3" fill="#ef4444" style="cursor:pointer; pointer-events:auto;"/>
        <polygon points="13,8 7,11 13,14" fill="#fff" pointer-events="none"/>

        <text class="anim-text" x="50" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="#4f46e5" pointer-events="none"></text>

        <rect class="control-btn btn-up" x="78" y="4" width="26" height="14" rx="3" fill="#22c55e" style="cursor:pointer; pointer-events:auto;"/>
        <polygon points="87,8 93,11 87,14" fill="#fff" pointer-events="none"/>

        <!-- Terminal Input (Kiri) & GND (Kanan) -->
        <line class="pin-in-0" x1="0" y1="40" x2="20" y2="40" stroke="#006600" stroke-width="3" stroke-linecap="round"/>
        <line class="pin-in-1" x1="80" y1="40" x2="100" y2="40" stroke="#006600" stroke-width="3" stroke-linecap="round"/>

        <!-- Jalur Resistor (Zig-zag) - Tinggi diperkecil menjadi 10px (y: 35 s.d 45) -->
        <path d="M 20 40 l 7.5 -5 l 15 10 l 15 -10 l 15 10 l 7.5 -5" fill="none" stroke="#1e293b" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>

        <!-- Tuas Wiper Bergerak -->
        <!-- Rel horizontal wiper (sejajar y=60 tersambung ke pin-out-0) -->
        <line class="anim-track" x1="50" y1="60" x2="50" y2="60" stroke="#1e293b" stroke-width="2" style="transition: all 0.2s ease;"/>
        <!-- Tiang vertikal tuas (dari rel y=60 ke dasar panah y=50) -->
        <line class="anim-wiper-line" x1="50" y1="50" x2="50" y2="60" stroke="#1e293b" stroke-width="2" style="transition: all 0.2s ease;"/>
        <!-- Kepala panah tuas (ujung di y=42 menempel pada resistor) -->
        <polygon class="anim-arrow" points="50,42 46,50 54,50" fill="#1e293b" style="transition: all 0.2s ease;"/>

        <!-- Terminal Output Bawah (Tengah) -->
        <line class="pin-out-0" x1="50" y1="60" x2="50" y2="76" stroke="#006600" stroke-width="3" stroke-linecap="round"/>

        <!-- Label Terminal & Nilai -->
        <text x="5" y="55" class="comp-label" font-size="7" font-weight="700" fill="#0284c7">IN</text>
        <text x="98" y="55" class="comp-label" text-anchor="end" font-size="7" font-weight="700" fill="#64748b">GND</text>
        <text x="58" y="75" class="comp-label" font-size="7" font-weight="700" fill="#e11d48">OUT</text>
        <text class="val-text comp-label resistor-val val-trigger" x="10" y="75" text-anchor="middle" font-size="10" font-weight="700" fill="#334155" style="cursor:pointer; pointer-events:auto;">10k</text>
    </svg>`;
  }
    updateState(_isSimActive) {
        const vState = this.compData.simV > 0;
        this.setPinActive('pin-in-0', vState); 
        this.setPinActive('pin-in-1', vState); 
        this.setPinActive('pin-out-0', vState);
        
        const stateVal = this.compData.state || '50';
        
        const text = this.contentDiv.querySelector('.anim-text');
        if (text) text.textContent = stateVal + '%';
        
        // 🟢 LOGIKA ANIMASI WIPER
        const percent = parseInt(stateVal);
        // Panjang area resistor adalah dari X=20 hingga X=80 (Selisih 60 piksel).
        // Jika 0%, tuas menempel ke ujung Kanan (X = 80).
        // Jika 100%, tuas menempel ke ujung Kiri (X = 20) mengarah ke Pin Input 0.
        const targetX = 80 - (percent * 0.6);
        
        const arrow = this.contentDiv.querySelector('.anim-arrow');
        const wiperLine = this.contentDiv.querySelector('.anim-wiper-line');
        const track = this.contentDiv.querySelector('.anim-track');
        
        if (arrow && wiperLine && track) {
            // Geser kepala panah
            arrow.setAttribute('points', `${targetX},22 ${targetX - 4},30 ${targetX + 4},30`);
            // Geser garis tuas vertikal
            wiperLine.setAttribute('x1', targetX);
            wiperLine.setAttribute('x2', targetX);
            // Geser salah satu ujung rel horizontal agar mengikuti tuas (ujung lain tetap di 50)
            track.setAttribute('x1', targetX); 
        }
        
        const valText = this.contentDiv.querySelector('.val-text');
        if (valText) {
            let val = this.compData.customValue || 10000;
            let displayVal = val >= 1000000 ? (val/1000000) + 'M' : (val >= 1000 ? (val/1000) + 'k' : val);
            valText.textContent = displayVal + 'Ω';
        }
    }
}
UIRegistry['potentiometer'] = PotentiometerUI;