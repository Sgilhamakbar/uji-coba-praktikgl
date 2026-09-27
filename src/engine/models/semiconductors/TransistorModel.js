// File: src/engine/models/semiconductors/TransistorModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class Transistor extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nB = engine.getNodeIndex(this.id, 'input', 0); // Base / Gate
        const nC = engine.getNodeIndex(this.id, 'input', 1); // Collector / Drain
        const nE = engine.getNodeIndex(this.id, 'output', 0); // Emitter / Source
        
        // Pengaman NaN: selalu sediakan fallback 0 Volt
        const vB = nB !== -1 ? (engine.nodeVoltage[nB] || 0) : 0;
        const vC = nC !== -1 ? (engine.nodeVoltage[nC] || 0) : 0;
        const vE = nE !== -1 ? (engine.nodeVoltage[nE] || 0) : 0;

        // Inisialisasi Filter Penghalus (Low-Pass Filter) untuk mencegah Spike & Osilasi
        if (this.smV_ctrl === undefined) this.smV_ctrl = 0;
        if (this.smV_out === undefined) this.smV_out = 0;

        // Hambatan OFF 1 MegaOhm agar tidak bentrok dengan Anti-Float engine
        let rCE = 1000000;
        let rBE = 1000000;

        if (this.state === 'blown') {
            rCE = 1000000;
            rBE = 1000000;
        } 
        else if (nB !== -1 && nC !== -1 && nE !== -1) {
            
            // 1. LOGIKA BJT NPN (Cth: 2N2222)
            if (this.type === 'bjt_npn') {
                const currentVbe = vB - vE;
                const currentVce = vC - vE;
                this.smV_ctrl = (this.smV_ctrl * 0.5) + (currentVbe * 0.5);
                this.smV_out = (this.smV_out * 0.5) + (currentVce * 0.5);
                
                if (this.smV_ctrl > 0.5) {
                    rBE = Math.max(5, 50 / Math.pow(this.smV_ctrl - 0.5 + 0.01, 2)); 
                    const iB = this.smV_ctrl / rBE;
                    const beta = 100;
                    const iC_target = beta * iB;
                    
                    const rCE_req = Math.abs(this.smV_out) / (iC_target + 1e-9);
                    rCE = Math.max(0.2, rCE_req); 
                } else if (currentVbe < 0.1) this.smV_ctrl = 0;
            }
            
            // 2. LOGIKA BJT PNP (Cth: 2N3906 / BC557)
            else if (this.type === 'bjt_pnp') {
                const currentVeb = vE - vB;
                const currentVec = vE - vC;
                this.smV_ctrl = (this.smV_ctrl * 0.5) + (currentVeb * 0.5);
                this.smV_out = (this.smV_out * 0.5) + (currentVec * 0.5);
                
                if (this.smV_ctrl > 0.5) {
                    rBE = Math.max(5, 50 / Math.pow(this.smV_ctrl - 0.5 + 0.01, 2));
                    const iB = this.smV_ctrl / rBE;
                    const beta = 100;
                    const iC_target = beta * iB;
                    
                    const rCE_req = Math.abs(this.smV_out) / (iC_target + 1e-9);
                    rCE = Math.max(0.2, rCE_req);
                } else if (currentVeb < 0.1) this.smV_ctrl = 0;
            }
            
            // 3. LOGIKA MOSFET N-CHANNEL (Cth: IRLZ44N Logic Level)
            else if (this.type === 'mosfet_n') {
                const currentVgs = vB - vE;
                this.smV_ctrl = (this.smV_ctrl * 0.5) + (currentVgs * 0.5);
                
                // Gate MOSFET tidak menyedot arus kontinu (isolasi tinggi)
                rBE = 1000000; 

                if (this.smV_ctrl > 2.5) {
                    rCE = Math.max(0.01, 10 / Math.pow(this.smV_ctrl - 2.5 + 0.1, 2)); 
                } else if (currentVgs < 0.5) {
                    this.smV_ctrl = 0;
                }
                
                // Body Diode N-Channel (Source ke Drain)
                const vSD = vE - vC;
                if (vSD > 0.6) {
                    const rDiode = Math.max(0.1, 10 / (vSD - 0.6 + 0.01));
                    rCE = 1 / ((1 / rCE) + (1 / rDiode));
                }
            }
            
            // 4. LOGIKA MOSFET P-CHANNEL
            else if (this.type === 'mosfet_p') {
                const currentVsg = vE - vB;
                this.smV_ctrl = (this.smV_ctrl * 0.5) + (currentVsg * 0.5);
                
                rBE = 1000000; 

                if (this.smV_ctrl > 2.5) {
                    rCE = Math.max(0.01, 10 / Math.pow(this.smV_ctrl - 2.5 + 0.1, 2));
                } else if (currentVsg < 0.5) {
                    this.smV_ctrl = 0;
                }

                // Body Diode P-Channel (Drain ke Source)
                const vDS = vC - vE;
                if (vDS > 0.6) {
                    const rDiode = Math.max(0.1, 10 / (vDS - 0.6 + 0.01));
                    rCE = 1 / ((1 / rCE) + (1 / rDiode));
                }
            }
        }
        
        this.lastRCE = rCE;
        
        // SUNTIKKAN KE MATRIKS: Menggunakan vE, vC, vB yang aman (Bukan engine.nodeVoltage mentah)
        if (nC !== -1 && nE !== -1) {
            const condCE = 1 / rCE;
            sumVR[nC] += vE * condCE; sum1R[nC] += condCE;
            sumVR[nE] += vC * condCE; sum1R[nE] += condCE;
        }                    
        if (nB !== -1 && nE !== -1) {
            const condBE = 1 / rBE;
            sumVR[nB] += vE * condBE; sum1R[nB] += condBE;
            sumVR[nE] += vB * condBE; sum1R[nE] += condBE;
        }
    }

    applyResults(engine) {
        if (this.state === 'blown') {
            this.simV = 0;
            return;
        }

        const nB = engine.getNodeIndex(this.id, 'input', 0);
        const nC = engine.getNodeIndex(this.id, 'input', 1);
        const nE = engine.getNodeIndex(this.id, 'output', 0);

        const vB = nB !== -1 ? (engine.nodeVoltage[nB] || 0) : 0;
        const vC = nC !== -1 ? (engine.nodeVoltage[nC] || 0) : 0;
        const vE = nE !== -1 ? (engine.nodeVoltage[nE] || 0) : 0;

        // EVALUASI OVERCURRENT & THERMAL BURNOUT
        if (this.lastRCE && this.lastRCE < 1000000 && nB !== -1 && nC !== -1 && nE !== -1) {
            const actualIc = Math.abs(vC - vE) / this.lastRCE;
            
            if (this.smIc === undefined) this.smIc = 0;
            this.smIc = (this.smIc * 0.7) + (actualIc * 0.3);

            const powerDissipation = Math.abs(vC - vE) * this.smIc;
            
            // Tentukan batas kapasitas berdasarkan jenis semikonduktor
            let maxCurrent = 0.8; // Standar BJT (800 mA)
            let maxPower = 0.6;   // Standar BJT (600 mW)
            let compName = 'Transistor BJT';

            if (this.type.startsWith('mosfet')) {
                maxCurrent = 30.0; // Standar Power MOSFET (30 Ampere)
                maxPower = 50.0;   // Standar Power MOSFET (50 Watt)
                compName = 'Power MOSFET';
            }

            if (this.smIc > maxCurrent || powerDissipation > maxPower) {
                this.state = 'blown';
                if (!this.hasWarned && typeof window !== 'undefined' && window.UIManager) {
                    this.hasWarned = true;
                    let reason = this.smIc > maxCurrent ? `Arus (${this.smIc.toFixed(2)}A) melebihi batas ${maxCurrent}A` : `Daya termal (${powerDissipation.toFixed(1)}W) melebihi batas ${maxPower}W`;
                    window.UIManager.showToast(`🔥 ${compName} (ID:${this.id}) Terbakar! ${reason}.`);
                }
                return;
            }
        } else {
            this.smIc = 0;
        }

        this.simV = Math.abs(vC - vE);

        let isOn = false;
        if (nB !== -1 && nE !== -1) {
            if (this.type === 'bjt_npn') isOn = (vB - vE) > 0.6;
            else if (this.type === 'bjt_pnp') isOn = (vE - vB) > 0.6;
            else if (this.type === 'mosfet_n') isOn = (vB - vE) > 2.5;
            else if (this.type === 'mosfet_p') isOn = (vE - vB) > 2.5;
        }

        this.state = isOn ? '1' : '0';
    }
}

ComponentRegistry['bjt_npn'] = Transistor;
ComponentRegistry['bjt_pnp'] = Transistor;
ComponentRegistry['mosfet_n'] = Transistor;
ComponentRegistry['mosfet_p'] = Transistor;