// File: src/engine/models/power/ACSourceModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class VSine extends BaseComponent {
    applySupernode(engine, sumVR, sum1R, fixedNodes) {
        const nOut = engine.getNodeIndex(this.id, 'output', 0); 
        const nIn = engine.getNodeIndex(this.id, 'output', 1);  
        
        // Gunakan waktu virtual dari mesin fisika, BUKAN jam dunia nyata
        const time = engine.simTime !== undefined ? engine.simTime : (Date.now() / 1000); 
        
        const amp = this.customValue !== undefined ? this.customValue : 12;
        const freq = this.freqValue !== undefined ? this.freqValue : 1;
        const offset = this.dcOffset !== undefined ? this.dcOffset : 0;
        const delay = this.timeDelay !== undefined ? this.timeDelay : 0;
        
        // Rumus Fisika Generator AC
        const v = offset + amp * Math.sin(2 * Math.PI * freq * (time - delay));
        
        // Simpan untuk UI animasi berosilasi
        this.instantV = v;
        this.simV = Math.abs(v);

        // PENYELESAIAN SUPERNODE UNTUK SUMBER TEGANGAN IDEAL:
        const isOutFixed = fixedNodes && nOut !== -1 ? fixedNodes[nOut] : false;
        const isInFixed = fixedNodes && nIn !== -1 ? fixedNodes[nIn] : false;

        if (nOut !== -1 && nIn !== -1) {
            if (isOutFixed && !isInFixed) {
                sumVR[nIn] = engine.nodeVoltage[nOut] - v; 
                sum1R[nIn] = 1;
            } else if (isInFixed && !isOutFixed) {
                sumVR[nOut] = engine.nodeVoltage[nIn] + v; 
                sum1R[nOut] = 1;
            } else if (!isOutFixed && !isInFixed) {
                const sV_out = sumVR[nOut]; const s1_out = sum1R[nOut];
                const sV_in = sumVR[nIn];   const s1_in = sum1R[nIn];
                
                // Mencegah pembagian dengan 0 jika sumber benar-benar terisolasi
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
    // instantV dan simV sudah ditangani di atas.
    }
};

// Daftarkan model fisika ini ke Registry
ComponentRegistry['vsine'] = VSine;