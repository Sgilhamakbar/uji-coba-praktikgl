// File: src/components/passive/CapacitorUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class CapacitorUI extends BaseUIComponent {
    static getDimensions() { return [80, 50]; }
    getSVG() {
        return `<svg width="80" height="50" viewBox="0 0 80 60">
            <line class="pin-in-0" x1="-5" y1="25" x2="35" y2="25" stroke="#006600" stroke-width="3"/>
            <line class="pin-out-0" x1="85" y1="25" x2="45" y2="25" stroke="#006600" stroke-width="3"/>
             <line class="comp-stroke" x1="35" y1="10" x2="35" y2="40" fill="none" stroke-width="3"/>
            <line class="comp-stroke" x1="45" y1="10" x2="45" y2="40" fill="none" stroke-width="3"/>
            <text x="60" y="50" class="comp-label" text-anchor="middle">C${this.id}</text>
            <text class="anim-text comp-label resistor-val val-trigger" x="20" y="50" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;"></text>
        </svg>`;
    }
    updateState(isSimActive) {
        const vState = this.compData.simV > 0;
        this.setPinActive('pin-in-0', vState); 
        this.setPinActive('pin-out-0', vState);
        
        const txtVal = this.contentDiv.querySelector('.anim-text');
        if (txtVal) {
            const cv = this.compData.customValue ?? 10; 
            txtVal.textContent = cv >= 1000 ? `${(cv/1000).toFixed(1)}mF` : `${cv}µF`;
        }
    }
}
UIRegistry['capacitor'] = CapacitorUI;