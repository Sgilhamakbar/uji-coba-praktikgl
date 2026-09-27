// File: src/components/semiconductors/DiodeBridgeUI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class DiodeBridgeUI extends BaseUIComponent {
    static getDimensions() { return [140, 140]; }
    getSVG() {
        const diodeSym = (cx, cy, a) => `<g transform="translate(${cx},${cy}) rotate(${a})">
        <line class="comp-stroke" x1="-12" y1="0" x2="-4" y2="0" stroke="#1e293b" stroke-width="2"/>
        <polygon points="-4,-6 -4,6 5,0" fill="#000000"/>
        <line class="comp-stroke" x1="5" y1="-7" x2="5" y2="7" stroke="#1e293b" stroke-width="2.5"/>
        <line class="comp-stroke" x1="5" y1="0" x2="12" y2="0" stroke="#1e293b" stroke-width="2"/>
        </g>`;
        return `<svg width="140" height="140" viewBox="0 0 140 140">
          <line class="pin-in-0" x1="70" y1="15" x2="70" y2="0" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="70" y1="125" x2="70" y2="140" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="125" y1="70" x2="140" y2="70" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-1" x1="15" y1="70" x2="0" y2="70" stroke="#006600" stroke-width="3"/>
          <line class="comp-stroke" x1="70" y1="15" x2="125" y2="70" stroke="#1e293b" stroke-width="2"/>
          <line class="comp-stroke" x1="15" y1="70" x2="70" y2="15" stroke="#1e293b" stroke-width="2"/>
          <line class="comp-stroke" x1="70" y1="125" x2="125" y2="70" stroke="#1e293b" stroke-width="2"/>
          <line class="comp-stroke" x1="15" y1="70" x2="70" y2="125" stroke="#1e293b" stroke-width="2"/>
          ${diodeSym(97.5, 42.5, 45)}${diodeSym(42.5, 42.5, -45)}${diodeSym(97.5, 97.5, -45)}${diodeSym(42.5, 97.5, 45)}
          <circle cx="70" cy="15" r="4" fill="#000000"/><circle cx="125" cy="70" r="4" fill="#000000"/>
          <circle cx="70" cy="125" r="4" fill="#000000"/><circle cx="15" cy="70" r="4" fill="#000000"/>
          <text x="60" y="9" text-anchor="middle" font-size="13" fill="#1e293b">~</text>
          <text x="60" y="137" text-anchor="middle" font-size="13" fill="#1e293b">~</text>
          <text x="132" y="65" text-anchor="middle" font-size="14" font-weight="bold" fill="red">+</text>
          <text x="8" y="65" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e293b">-</text>
        </svg>`;
    }
    updateState() {
        this.setPinActive('pin-in-0', this.compData.simV > 0); this.setPinActive('pin-in-1', this.compData.simV > 0);
        this.setPinActive('pin-out-0', this.compData.simV > 1.5); this.setPinActive('pin-out-1', this.compData.simV > 1.5);
    }
}
UIRegistry['diode_bridge'] = DiodeBridgeUI;