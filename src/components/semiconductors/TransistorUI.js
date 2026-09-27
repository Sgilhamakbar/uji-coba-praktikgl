// File: src/components/semiconductors/TransistorUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class TransistorUI extends BaseUIComponent {
    static getDimensions() { return [80, 80]; } 
    
    getSVG() {
        const isNPN = this.compData.type === 'bjt_npn';
        const isPNP = this.compData.type === 'bjt_pnp';
        
        if (isNPN || isPNP) {
            // Arah panah PNP vs NPN
            const poly = isNPN ? `<polygon points="34,50 40,60 28,58" fill="#1e293b"/>` : `<polygon points="35,52 25,48 30,59" fill="#1e293b"/>`;
            
            return `<svg width="80" height="80" viewBox="0 0 80 80">
              <circle class="anim-body" cx="40" cy="40" r="24" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
              
              <!-- Input 0: Base (B) -->
              <line class="pin-in-0" x1="0" y1="40" x2="25" y2="40" stroke="#006600" stroke-width="3"/>
              <line x1="25" y1="25" x2="25" y2="55" stroke="#1e293b" stroke-width="3"/>
              
              <!-- Input 1: Collector (C) - Atas -->
              <!-- Perbaikan: Kabel ditarik dari y=0 ke y=20 dengan benar -->
              <line x1="25" y1="32" x2="40" y2="20" stroke="#006600" stroke-width="3"/>
              <line class="pin-in-1" x1="40" y1="0" x2="40" y2="20" stroke="#006600" stroke-width="3"/>
              
              <!-- Output 0: Emitter (E) - Bawah -->
              <!-- Perbaikan: Kabel ditarik dari y=60 ke y=80 -->
              <line x1="25" y1="48" x2="40" y2="60" stroke="#006600" stroke-width="3"/>
              <line class="pin-out-0" x1="40" y1="80" x2="40" y2="60" stroke="#006600" stroke-width="3"/>
              
              ${poly}
              
              <text x="14" y="32" class="comp-label" font-weight="bold" font-size="12">B</text>
              <text x="52" y="16" class="comp-label" font-weight="bold" font-size="12">C</text>
              <text x="52" y="74" class="comp-label" font-weight="bold" font-size="12">E</text>
              <text x="68" y="40" font-size="8" font-family="sans-serif" font-weight="bold" fill="#475569" text-anchor="middle" transform="rotate(90, 68, 40)">${isNPN ? '2N2222' : 'BC557'}</text>
            </svg>`;
            
        } else {
            // Logika Visual MOSFET
            const isN = this.compData.type === 'mosfet_n';
            const poly = isN ? `<polygon points="46,46 38,50 46,54" fill="#1e293b"/>` : `<polygon points="42,46 50,50 42,54" fill="#1e293b"/>`;
            
            // MOSFET dibuat lebih besar
            this.mainDiv.style.width = '100px'; 
            this.mainDiv.style.height = '100px'; 
            
            return `<svg width="100" height="100" viewBox="0 0 100 100">
              <circle class="anim-body" cx="50" cy="50" r="32" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
              
              <!-- Input 0: Gate (G) -->
              <line class="pin-in-0" x1="0" y1="50" x2="30" y2="50" stroke="#006600" stroke-width="3"/>
              <line x1="30" y1="30" x2="30" y2="70" stroke="#1e293b" stroke-width="3"/>
              
              <!-- Kanal Semikonduktor (Terputus-putus) -->
              <line x1="38" y1="28" x2="38" y2="42" stroke="#1e293b" stroke-width="3"/>
              <line x1="38" y1="46" x2="38" y2="54" stroke="#1e293b" stroke-width="3"/>
              <line x1="38" y1="58" x2="38" y2="72" stroke="#1e293b" stroke-width="3"/>
              
              <!-- Input 1: Drain (D) - Atas -->
              <line class="pin-in-1" x1="50" y1="0" x2="50" y2="35" stroke="#006600" stroke-width="3"/>
              <line x1="50" y1="35" x2="38" y2="35" stroke="#006600" stroke-width="3"/>
              
              <!-- Output 0: Source (S) - Bawah -->
              <line class="pin-out-0" x1="50" y1="100" x2="50" y2="65" stroke="#006600" stroke-width="3"/>
              <line x1="50" y1="65" x2="38" y2="65" stroke="#006600" stroke-width="3"/>
              
              <!-- Sambungan Substrate ke Source -->
              <line x1="38" y1="50" x2="50" y2="50" stroke="#1e293b" stroke-width="3"/>
              <line x1="50" y1="50" x2="50" y2="65" stroke="#1e293b" stroke-width="3"/>
              
              ${poly}
              
              <text x="14" y="42" class="comp-label" font-weight="bold" font-size="14">G</text>
              <text x="62" y="20" class="comp-label" font-weight="bold" font-size="14">D</text>
              <text x="62" y="85" class="comp-label" font-weight="bold" font-size="14">S</text>
              <text x="86" y="50" font-size="9" font-family="sans-serif" font-weight="bold" fill="#475569" text-anchor="middle" transform="rotate(90, 86, 50)">${isN ? 'IRLZ44N' : 'IRF9540'}</text>
            </svg>`;
        }
    }

    updateState() {
        const isActive = this.compData.state === '1';
        
        // Logika warna kabel. MOSFET/NPN menyala jika Basis/Gate tinggi. PNP menyala jika rendah.
        let isControlActive = false;
        if (this.compData.type === 'bjt_npn' || this.compData.type === 'mosfet_n') {
            isControlActive = isActive; 
        } else {
            isControlActive = !isActive && this.compData.simV > 0; // PNP aktif terbalik
        }

        this.setPinActive('pin-in-0', isControlActive);
        this.setPinActive('pin-in-1', this.compData.simV > 0); 
        this.setPinActive('pin-out-0', isActive && this.compData.simV > 0);
        
        // Animasi Bodi Terbakar (Burnout)
        const body = this.contentDiv.querySelector('.anim-body');
        if (body) {
            if (this.compData.state === 'blown') {
                body.setAttribute('fill', '#fca5a5'); // Merah hangus
                body.setAttribute('stroke', '#991b1b');
            } else {
                body.setAttribute('fill', isActive ? '#dcfce7' : '#e8e6d3'); // Hijau jika aktif
                body.setAttribute('stroke', '#1e293b');
            }
        }
    }
}

['bjt_npn', 'bjt_pnp', 'mosfet_n', 'mosfet_p'].forEach(t => UIRegistry[t] = TransistorUI);