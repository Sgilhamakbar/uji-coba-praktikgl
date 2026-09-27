// File: src/engine/models/power/BatteryModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class Battery extends BaseComponent {
    applySupernode(engine, sumVR, sum1R, fixedNodes) {
        const nOut = engine.getNodeIndex(this.id, 'output', 0); 
        const nIn = engine.getNodeIndex(this.id, 'output', 1);  
        
        // Ambil tegangan ideal baterai dari memori
        this.vIdeal = this.customValue !== undefined ? this.customValue : (this.type === 'battery_1cell' ? 1.5 : 12);
        
        // FISIKA REALISTIS: Hambatan Dalam (Internal Resistance)
        this.rInternal = this.type === 'battery_1cell' ? 0.2 : 0.05;

        // PENYELESAIAN SUPERNODE UNTUK SUMBER TEGANGAN
        const v = this.vIdeal;
        
        const isOutFixed = fixedNodes && nOut !== -1 ? fixedNodes[nOut] : false;
        const isInFixed = fixedNodes && nIn !== -1 ? fixedNodes[nIn] : false;

        if (nOut !== -1 && nIn !== -1) {
            if (isOutFixed && !isInFixed) {
                // Positif di-ground / fixed, maka Negatif menjadi V_positif - V_baterai
                sumVR[nIn] = engine.nodeVoltage[nOut] - v; 
                sum1R[nIn] = 1;
            } else if (isInFixed && !isOutFixed) {
                // Negatif di-ground / fixed, maka Positif menjadi V_negatif + V_baterai
                sumVR[nOut] = engine.nodeVoltage[nIn] + v; 
                sum1R[nOut] = 1;
            } else if (!isOutFixed && !isInFixed) {
                // Dua-duanya mengambang (Floating Supernode)
                const sV_out = sumVR[nOut]; const s1_out = sum1R[nOut];
                const sV_in = sumVR[nIn];   const s1_in = sum1R[nIn];
                
                if (s1_out + s1_in > 0) {
                    const vCenter = (sV_out + sV_in - (v/2)*s1_out + (v/2)*s1_in) / (s1_out + s1_in);
                    sumVR[nOut] = vCenter + v/2; sum1R[nOut] = 1;
                    sumVR[nIn] = vCenter - v/2; sum1R[nIn] = 1;
                } else {
                    sumVR[nOut] = v/2; sum1R[nOut] = 1;
                    sumVR[nIn] = -v/2; sum1R[nIn] = 1;
                }
            }
        } else if (nOut !== -1 && !isOutFixed) {
            sumVR[nOut] = v; sum1R[nOut] = 1;
        } else if (nIn !== -1 && !isInFixed) {
            sumVR[nIn] = -v; sum1R[nIn] = 1;
        }
    }

    applyResults(engine) {
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        const nIn = engine.getNodeIndex(this.id, 'output', 1);

        const vOut = nOut !== -1 ? engine.nodeVoltage[nOut] : 0;
        const vIn = nIn !== -1 ? engine.nodeVoltage[nIn] : 0;

        // 1. Tegangan Nyata (Bisa drop jika sirkuit butuh arus terlalu besar)
        this.simV = Math.abs(vOut - vIn);

        // 2. Arus Listrik Aktual (Sangat akurat berkat Hukum Ohm)
        if (this.vIdeal !== undefined && this.rInternal !== undefined) {
            this.simI = Math.abs((this.vIdeal - this.simV) / this.rInternal);
        } else {
            this.simI = 0;
        }
    }
}

// Daftarkan semua jenis baterai ke kelas Battery
ComponentRegistry['battery'] = Battery;
ComponentRegistry['battery_multi'] = Battery;
ComponentRegistry['battery_1cell'] = Battery;