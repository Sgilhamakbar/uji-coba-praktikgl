// File: src/components/semiconductors/TransistorBD140UI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class TransistorBD140UI extends BaseUIComponent {
    static getDimensions() { return [80, 80]; }

    getSVG() {
        return `<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
            <!-- 1. Bodi Lingkaran Utama -->
            <circle class="anim-body" cx="40" cy="40" r="24" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
            
            <!-- 2. Base (B) - Input 0 (Tepi Kiri di X=0, Y=40) -->
            <line class="pin-in-0" x1="0" y1="40" x2="25" y2="40" stroke="#006600" stroke-width="3"/>
            
            <!-- Plat Silikon Base (Garis Vertikal Hitam) -->
            <line x1="25" y1="25" x2="25" y2="55" stroke="#1e293b" stroke-width="3"/>
            
            <!-- 3. Collector (C) - Input 1 (Tepi Atas di X=40, Y=0) -->
            <line x1="25" y1="32" x2="40" y2="20" stroke="#006600" stroke-width="3"/>
            <line class="pin-in-1" x1="40" y1="0" x2="40" y2="20" stroke="#006600" stroke-width="3"/>
            
            <!-- 4. Emitter (E) - Output 0 (Tepi Bawah di X=40, Y=80) -->
            <line x1="25" y1="48" x2="40" y2="60" stroke="#006600" stroke-width="3"/>
            <line class="pin-out-0" x1="40" y1="80" x2="40" y2="60" stroke="#006600" stroke-width="3"/>

            <!-- 5. Panah PNP (Panah masuk dari Emitter ke Base) -->
            <polygon points="35,52 25,48 30,59" fill="#1e293b"/>

            <!-- 6. Teks Label Pin -->
            <text x="10" y="30" font-size="12" font-family="sans-serif" font-weight="bold" class="comp-label" text-anchor="middle">B</text>
            <text x="50" y="15" font-size="12" font-family="sans-serif" font-weight="bold" class="comp-label" text-anchor="middle">C</text>
            <text x="50" y="74" font-size="12" font-family="sans-serif" font-weight="bold" class="comp-label" text-anchor="middle">E</text>
            
            <!-- Teks Penanda Seri BD140 -->
            <text x="47" y="43" font-size="8" font-family="sans-serif" font-weight="bold" class="comp-label" text-anchor="middle" transform="rotate(90, 68, 40)">BD140</text>
        </svg>`;
    }

        updateState() {
        const isActive = this.compData.state === '1';
        
        // Animasi Warna Kabel Pin
        this.setPinActive('pin-in-0', isActive);  // Pin Base menyala saat transistor ditarik aktif
        // 🟢 FIX BUG: Kaki C dan E hanya boleh menyala JIKA transistor aktif DAN ada tegangan
        this.setPinActive('pin-in-1', isActive && this.compData.simV > 0); // Collector mengalirkan arus
        this.setPinActive('pin-out-0', isActive && this.compData.simV > 0); // Emitter terhubung VCC

        // Animasi Bodi Transistor
        const body = this.contentDiv.querySelector('.anim-body');
        if (body) {
            if (this.compData.state === 'blown') {
                // Berubah merah hangus jika terbakar (> 1.5 Ampere)
                body.setAttribute('fill', '#fca5a5'); 
                body.setAttribute('stroke', '#991b1b');
            } else {
                // Berubah hijau tipis saat ON, kembali krem (e8e6d3) saat OFF
                body.setAttribute('fill', isActive ? '#cef8dd' : '#e8e6d3');
                body.setAttribute('stroke', '#1e293b');
            }
        }
    }
}

// Daftarkan nama UI agar bisa dipanggil oleh index.html
UIRegistry['bjt_pnp_bd140'] = TransistorBD140UI;