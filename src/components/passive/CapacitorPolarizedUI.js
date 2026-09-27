// File: src/components/passive/CapacitorPolarizedUI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class CapacitorPolarizedUI extends BaseUIComponent {
    static getDimensions() { return [80, 60]; }
    
    getSVG() {
        return `<svg width="80" height="60" viewBox="0 0 80 60">
            <!-- Kabel Positif (Kiri) -->
            <line class="pin-in-0" x1="-5" y1="30" x2="35" y2="30" stroke="#006600" stroke-width="3" stroke-linecap="round"/>
            <!-- Kabel Negatif (Kanan) -->
            <line class="pin-out-0" x1="85" y1="30" x2="48" y2="30" stroke="#006600" stroke-width="3" stroke-linecap="round"/>
            
            <!-- Tanda Plus (+) Merah penanda kutub -->
            <text x="20" y="24" class="comp-label" font-size="12" font-weight="bold" fill="#ef4444">+</text>
            
            <!-- Plat Positif (Garis Lurus) -->
            <line class="comp-stroke" x1="35" y1="15" x2="35" y2="45" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            
            <!-- Plat Negatif (Garis Lengkung / Sabit) -->
            <path class="comp-stroke" d="M 52 12 Q 44 30 52 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            
            <!-- EFEK LEDAKAN KORSLETING (Default: Disembunyikan) -->
            <g class="blown-fx" style="display: none;">
                <!-- Silang Merah -->
                <path d="M 25 15 L 55 45 M 55 15 L 25 45" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
                <!-- Lingkaran Retak Putus-putus -->
                <circle cx="40" cy="30" r="16" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4 4"/>
            </g>

            <!-- Label ID Komponen (Misal: C1, C2) -->
            <text x="65" y="20" class="comp-label" font-size="9" text-anchor="middle">C${this.id}</text>
            
            <!-- Label Teks Nilai Kapasitor -->
            <text class="anim-text comp-label val-trigger" x="40" y="58" text-anchor="middle" font-size="11" font-weight="bold" fill="#4f46e5" style="cursor:pointer; pointer-events:auto;"></text>
        </svg>`;
    }
    
    updateState(isSimActive) {
        // Cek status kerusakan dari model fisika
        const isBlown = this.compData.state === 'blown';
        // Kabel hanya menyala hijau jika simulasi jalan, ada tegangan, dan komponen belum rusak
        const vState = this.compData.simV > 0 && !isBlown;
        
        this.setPinActive('pin-in-0', vState); 
        this.setPinActive('pin-out-0', vState);
        
        // 1. ATUR LABEL TEKS NILAI
        const txtVal = this.contentDiv.querySelector('.anim-text');
        if (txtVal) {
            if (isBlown) {
                txtVal.textContent = "RUSAK!";
                txtVal.setAttribute('fill', '#ef4444'); // Merah tanda bahaya
            } else {
                const cv = this.compData.customValue !== undefined ? this.compData.customValue : 10; 
                // Format teks (Misal: 1000µF diubah jadi 1.0mF)
                txtVal.textContent = cv >= 1000 ? `${(cv/1000).toFixed(1)}mF` : `${cv}µF`;
                txtVal.setAttribute('fill', '#4f46e5'); // Biru normal
            }
        }

        // 2. TAMPILKAN ATAU SEMBUNYIKAN ANIMASI LEDAKAN
        const blownFx = this.contentDiv.querySelector('.blown-fx');
        if (blownFx) {
            blownFx.style.display = isBlown ? 'block' : 'none';
        }
    }
}

// Daftarkan wajah UI ini ke mesin simulator
UIRegistry['capacitor_polarized'] = CapacitorPolarizedUI;