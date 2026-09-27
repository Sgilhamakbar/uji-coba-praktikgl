// File: src/engine/models/passive/CapacitorPolarizedModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class CapacitorPolarized extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);

        // 1. LOGIKA KERUSAKAN (BLOWN STATE)
        // Jika kapasitor meledak, ia menjadi arus pendek (hambatan bocor sangat kecil)
        if (this.state === 'blown') {
            if (nIn !== -1 && nOut !== -1) {
                const gBlown = 1 / 0.1; // Resistansi korsleting 0.1 Ohm
                sumVR[nIn] += (engine.nodeVoltage[nOut] || 0) * gBlown; 
                sum1R[nIn] += gBlown;
                sumVR[nOut] += (engine.nodeVoltage[nIn] || 0) * gBlown; 
                sum1R[nOut] += gBlown;
            }
            return; // Hentikan perhitungan memori, kapasitor sudah mati
        }

        // 2. LOGIKA NORMAL (INTEGRASI BDF2)
        // Menggunakan rumus yang sama persis dengan Capacitor standar untuk menyimpan muatan
        if (this._cond === undefined || this._lastParsedValue !== this.customValue) {
            // Mengambil timeStep dari pengaturan mesin, atau default 0.001
            const DT = engine.config?.timeStep !== undefined ? engine.config.timeStep : 0.001;
            let cVal = 10e-6; // Default 10µF
            
            if (this.customValue !== undefined && this.customValue !== null) {
                const strVal = String(this.customValue).toLowerCase().replace(/\s/g, '');
                const num = parseFloat(strVal);
                if (!isNaN(num)) {
                    const match = strVal.match(/([muµnpf])/);
                    const unit = match ? match[1] : 'u';
                    switch(unit) {
                        case 'm': cVal = num * 1e-3; break;
                        case 'u': case 'µ': cVal = num * 1e-6; break;
                        case 'n': cVal = num * 1e-9; break;
                        case 'p': cVal = num * 1e-12; break;
                        case 'f': cVal = num; break;
                    }
                }
            }
            
            const ESR = this.esr !== undefined ? this.esr : 0.1; 
            const rEq_bdf2 = (2 * DT) / (3 * cVal);
            const rEq_total = rEq_bdf2 + ESR; 
            
            this._rEq = rEq_total; 
            this._cond = 1 / rEq_total; 
            this._lastParsedValue = this.customValue; 
        }

        if (!this.vHistory) {
            const startV = this.chargeV || this.simV || 0;
            this.vHistory = new Float64Array([startV, startV]); 
        }
        
        // Membangun Equivalent Voltage Source (Tegangan Sejarah)
        const vEq = (4/3)*this.vHistory[0] - (1/3)*this.vHistory[1];
        
        if (nIn !== -1 && nOut !== -1) {
            const cond = this._cond; 
            const vOutSafe = engine.nodeVoltage[nOut] || 0;
            const vInSafe = engine.nodeVoltage[nIn] || 0;
            
            // Injeksi KCL ke dalam Node
            sumVR[nIn] += (vOutSafe + vEq) * cond; sum1R[nIn] += cond;
            sumVR[nOut] += (vInSafe - vEq) * cond; sum1R[nOut] += cond;
        }
    }

    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        const vIn = nIn !== -1 ? engine.nodeVoltage[nIn] : 0;
        const vOut = nOut !== -1 ? engine.nodeVoltage[nOut] : 0;
        
        const voltageDiff = vIn - vOut;

        // 3. LOGIKA DETEKSI POLARITAS (REVERSE BIAS)
        // Elco asli biasanya memiliki batas toleransi tegangan balik -1.0V hingga -1.5V.
        if (this.state !== 'blown' && voltageDiff <= -1.5) {
            this.state = 'blown'; // Memicu ledakan fisik dan visual!
        }

        // Jika sudah meledak, baca sirkuit ini sebagai resistor korslet
        if (this.state === 'blown') {
            this.simV = Math.abs(voltageDiff);
            this.simI = voltageDiff / 0.1; 
            this.chargeV = 0; // Muatan habis terbakar
            return;
        }

        if (!this.vHistory) {
            const startV = this.chargeV || this.simV || 0;
            this.vHistory = new Float64Array([startV, startV]); 
        }

        // 4. MEREKAM JEJAK SEJARAH TEGANGAN (BDF2)
        if (nIn !== -1 && nOut !== -1) {
            const DT = engine.config?.timeStep !== undefined ? engine.config.timeStep : 0.001;
            const rEq = this._rEq || (((2 * DT) / (3 * 10e-6)) + 0.1);
            const vEq = (4/3)*this.vHistory[0] - (1/3)*this.vHistory[1];
            
            this.simI = (voltageDiff - vEq) / rEq;
            
            const vDropESR = this.simI * (this.esr !== undefined ? this.esr : 0.1);
            const vNew = voltageDiff - vDropESR; 
            
            this.vHistory[1] = this.vHistory[0]; 
            this.vHistory[0] = vNew;             
            
            this.simV = Math.abs(voltageDiff); 
            this.chargeV = vNew;    
        } else {
            // Retensi Muatan: Jika kabel dicabut, voltase tersimpan utuh.
            this.simI = 0;
            this.simV = Math.abs(this.vHistory[0]);
            this.chargeV = this.vHistory[0];
        }
    }
}
ComponentRegistry['capacitor_polarized'] = CapacitorPolarized;