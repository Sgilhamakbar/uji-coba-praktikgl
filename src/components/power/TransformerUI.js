// File: src/components/power/TransformerUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

// 1. Kelas untuk Trafo CT (3 Output Sekunder)
export class TransformerUI extends BaseUIComponent {
    static getDimensions() { return [140, 150]; }

getSVG() {
    return `<svg width="140" height="150" viewBox="0 0 140 150">
        <!-- Inti Besi -->
        <line x1="66" y1="15" x2="66" y2="135" stroke="#1e293b" stroke-width="3"/>
        <line x1="74" y1="15" x2="74" y2="135" stroke="#1e293b" stroke-width="3"/>
        
        <!-- Pin Primer (Diperlebar vertikal: y=30 dan y=120) -->
        <line x1="0" y1="30" x2="42" y2="30" stroke="#006600" stroke-width="2" class="pin-in-0"/>
        <line x1="0" y1="120" x2="42" y2="120" stroke="#006600" stroke-width="2" class="pin-in-1"/>
        <path class="anim-coil-p" d="M 42 30 C 62 30 62 52.5 42 52.5 C 62 52.5 62 75 42 75 C 62 75 62 97.5 42 97.5 C 62 97.5 62 120 42 120" fill="none" stroke="#1e293b" stroke-width="3"/>
        
        <!-- Pin Sekunder -->
        <line x1="98" y1="30" x2="140" y2="30" stroke="#006600" stroke-width="2" class="pin-out-0"/>
        <line x1="98" y1="75" x2="140" y2="75" stroke="#006600" stroke-width="2" class="pin-out-1"/>
        <line x1="98" y1="120" x2="140" y2="120" stroke="#006600" stroke-width="2" class="pin-out-2"/>
        <path class="anim-coil-s" d="M 98 30 C 78 30 78 52.5 98 52.5 C 78 52.5 78 75 98 75 C 78 75 78 97.5 98 97.5 C 78 97.5 78 120 98 120" fill="none" stroke="#1e293b" stroke-width="3"/>
        
        <!-- 🟢 LABEL TEKS DINAMIS -->
        <text class="label-pri" x="21" y="20" font-size="12" font-weight="bold" fill="#64748b" text-anchor="middle">220V</text>
        <text class="label-sec" x="119" y="20" font-size="12" font-weight="bold" fill="#64748b" text-anchor="middle">12V</text>
        <text x="119" y="66" font-size="11" font-weight="bold" fill="#ef4444" text-anchor="middle">CT</text>
    </svg>`;
}
    updateState() {
        const vState = this.compData.simV > 0;
        this.setPinActive('pin-in-0', vState); this.setPinActive('pin-in-1', vState); 
        this.setPinActive('pin-out-0', vState); this.setPinActive('pin-out-1', vState); this.setPinActive('pin-out-2', vState);
        
        const coilP = this.contentDiv.querySelector('.anim-coil-p');
        if (coilP) coilP.setAttribute('stroke', vState ? '#eab308' : '#1e293b');

        // 🟢 BACA MEMORI UNTUK MENGUBAH TEKS DI KANVAS
        const lblPri = this.contentDiv.querySelector('.label-pri');
        const lblSec = this.contentDiv.querySelector('.label-sec');
        if (lblPri) lblPri.textContent = (this.compData.priV !== undefined ? this.compData.priV : 220) + 'V';
        if (lblSec) lblSec.textContent = (this.compData.secV !== undefined ? this.compData.secV : 12) + 'V';
    }
}
UIRegistry['transformer_2p3s'] = TransformerUI;

// 2. Kelas untuk Trafo Engkel / Non-CT (2 Output Sekunder)
export class Transformer2P2SUI extends BaseUIComponent {
    static getDimensions() { return [140, 150]; }

getSVG() {
    return `<svg width="140" height="150" viewBox="0 0 140 150">
        <!-- Inti Besi -->
        <line x1="66" y1="15" x2="66" y2="135" stroke="#1e293b" stroke-width="3"/>
        <line x1="74" y1="15" x2="74" y2="135" stroke="#1e293b" stroke-width="3"/>
        
        <!-- Pin Primer (Sisi Kiri: y=30 dan y=120) -->
        <line x1="0" y1="30" x2="42" y2="30" stroke="#006600" stroke-width="2" class="pin-in-0"/>
        <line x1="0" y1="120" x2="42" y2="120" stroke="#006600" stroke-width="2" class="pin-in-1"/>
        <path class="anim-coil-p" d="M 42 30 C 62 30 62 52.5 42 52.5 C 62 52.5 62 75 42 75 C 62 75 62 97.5 42 97.5 C 62 97.5 62 120 42 120" fill="none" stroke="#1e293b" stroke-width="3"/>
        
        <!-- Pin Sekunder (Sisi Kanan: y=30 dan y=120) -->
        <line x1="98" y1="30" x2="140" y2="30" stroke="#006600" stroke-width="2" class="pin-out-0"/>
        <line x1="98" y1="120" x2="140" y2="120" stroke="#006600" stroke-width="2" class="pin-out-1"/>
        <path class="anim-coil-s" d="M 98 30 C 78 30 78 52.5 98 52.5 C 78 52.5 78 75 98 75 C 78 75 78 97.5 98 97.5 C 78 97.5 78 120 98 120" fill="none" stroke="#1e293b" stroke-width="3"/>
        
        <!-- 🟢 LABEL TEKS DINAMIS -->
        <text class="label-pri" x="21" y="20" font-size="12" font-weight="bold" fill="#64748b" text-anchor="middle">220V</text>
        <text class="label-sec" x="119" y="20" font-size="12" font-weight="bold" fill="#64748b" text-anchor="middle">12V</text>
    </svg>`;
}
    updateState() {
        const vState = this.compData.simV > 0;
        this.setPinActive('pin-in-0', vState); this.setPinActive('pin-in-1', vState); 
        this.setPinActive('pin-out-0', vState); this.setPinActive('pin-out-1', vState);
        
        const coilP = this.contentDiv.querySelector('.anim-coil-p');
        if (coilP) coilP.setAttribute('stroke', vState ? '#eab308' : '#1e293b');

        // 🟢 BACA MEMORI UNTUK MENGUBAH TEKS DI KANVAS
        const lblPri = this.contentDiv.querySelector('.label-pri');
        const lblSec = this.contentDiv.querySelector('.label-sec');
        if (lblPri) lblPri.textContent = (this.compData.priV !== undefined ? this.compData.priV : 220) + 'V';
        if (lblSec) lblSec.textContent = (this.compData.secV !== undefined ? this.compData.secV : 12) + 'V';
    }
}
UIRegistry['transformer_2p2s'] = Transformer2P2SUI;