// File: src/components/wires/WireUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

// --- TITIK SOLDER perpotongan kiabel (WIRE NODE) ---
export class WireNode extends BaseUIComponent {
    static getDimensions() { return [20, 20]; }
    getSVG() {
        return `<svg width="20" height="20" viewBox="0 0 20 20" style="display:block; position:absolute; top:0; left:0;">
          <circle class="anim-body" cx="10" cy="10" r="5" fill="#1e293b" stroke="#334155" stroke-width="2"/>
        </svg>`;
    }
    updateState(_isSimActive) {
        const dot = this.contentDiv.querySelector('.anim-body');
        if (dot) dot.setAttribute('fill', this.compData.simV > 0 ? '#22c55e' : '#1e293b');
    }
}
UIRegistry['wire_node'] = WireNode;