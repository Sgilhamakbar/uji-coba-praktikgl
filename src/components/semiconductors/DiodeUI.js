// File: src/components/semiconductors/DiodeUI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class DiodeUI extends BaseUIComponent {
    static getDimensions() { return [60, 50]; }
    getSVG() {
        return `<svg width="60" height="50" viewBox="0 0 60 50">
        <line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/>
        <line class="pin-out-0" x1="35" y1="20" x2="60" y2="20" stroke="#006600" stroke-width="3"/>
        <polygon class="anim-body" points="20,10 20,30 35,20" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
        <line class="anim-line" x1="35" y1="10" x2="35" y2="30" stroke="#1e293b" stroke-width="2"/>
        <text x="30" y="45" class="comp-label" text-anchor="middle">D${this.id}</text></svg>`;
    }
    updateState() {
        const vState = this.compData.simV > 0;
        this.setPinActive('pin-in-0', vState); this.setPinActive('pin-out-0', vState);
    }
}
UIRegistry['diode'] = DiodeUI;

// =======================================================
// CLASS UI DIODA ZENER
// =======================================================
export class ZenerDiodeUI extends BaseUIComponent {
    static getDimensions() { return [60, 50]; }
    getSVG() {
        const vz = (this.compData.customValue != null) ? this.compData.customValue : 5.1;
        return `<svg width="60" height="60" viewBox="0 0 60 60">
          <!-- Kabel Anoda (Kiri) -->
          <line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/> 
          <!-- Kabel Katoda (Kanan) -->
          <line class="pin-out-0" x1="35" y1="20" x2="60" y2="20" stroke="#006600" stroke-width="3"/>
          <!-- Segitiga Dioda -->
          <polygon class="anim-body" points="20,10 20,30 35,20" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          <!-- Garis Katoda Khas Zener -->
          <path class="anim-line" d="M 40 10 L 35 10 L 35 30 L 30 30" fill="none" stroke="#1e293b" stroke-width="2"/>
          <!-- Teks Label -->
          <text x="30" y="50" class="comp-label zener-val" text-anchor="middle" font-size="9" fill="#1e293b">${vz}V</text>
        </svg>`;
    }
    
    updateState() {
        // 1. Animasi Kabel Menyala
        const isActive = Math.abs(this.compData.simI) > 0.0001; 
        this.setPinActive('pin-in-0', isActive); 
        this.setPinActive('pin-out-0', isActive);

        // 2. 🟢 PEMBARUAN TEKS REAL-TIME 🟢
        // Cari elemen teks spesifik milik Zener ini di dalam kanvas
        const label = document.querySelector(`#comp-${this.id} .zener-val`);
        if (label) {
            // Ambil nilai terbaru dari memori, lalu perbarui isi teks SVG-nya
            const vz = (this.compData.customValue != null) ? this.compData.customValue : 5.1;
            label.textContent = `${vz}V`;
        }
    }
}

// Daftarkan ke Registry 
UIRegistry['zener_diode'] = ZenerDiodeUI;