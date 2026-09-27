// File: src/engine/models/semiconductors/TransistorBD140Model.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class TransistorBD140 extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nB = engine.getNodeIndex(this.id, 'input', 0);
        const nC = engine.getNodeIndex(this.id, 'input', 1);
        const nE = engine.getNodeIndex(this.id, 'output', 0);
        
        const vB = nB !== -1 ? (engine.nodeVoltage[nB] || 0) : 0;
        const vC = nC !== -1 ? (engine.nodeVoltage[nC] || 0) : 0;
        const vE = nE !== -1 ? (engine.nodeVoltage[nE] || 0) : 0;

        if (this.smVeb === undefined) this.smVeb = 0;
        if (this.smVec === undefined) this.smVec = 0;

        let rCE = 1000000;
        let rBE = 1000000;

        if (this.state === 'blown') {
            rCE = 1000000;
            rBE = 1000000;
        } 
        else if (nB !== -1 && nC !== -1 && nE !== -1) {
            const currentVeb = vE - vB;
            const currentVec = vE - vC;
            
            this.smVeb = (this.smVeb * 0.5) + (currentVeb * 0.5);
            this.smVec = (this.smVec * 0.5) + (currentVec * 0.5);
            
            if (this.smVeb > 0.5) {
                // Sesuai Datasheet BD140: VBE(on) sekitar -0.8V hingga -1.0V pada arus kolektor menengah.
                // Kurva eksponensial membuat resistensi turun drastis agar VBE terkunci di titik riil.
                rBE = Math.max(2, 20 / Math.pow(this.smVeb - 0.5 + 0.01, 2));
                const iB = this.smVeb / rBE;
                
                // hFE (Beta) BD140 berada di kisaran 40 hingga 250. Kita pakai 60 sebagai tipikal.
                const beta = 60; 
                const iC_target = beta * iB;
                
                // VCE(sat) pada datasheet adalah -0.5V max pada Ic=0.5A. 
                const rCE_req = Math.abs(this.smVec) / (iC_target + 1e-9);
                rCE = Math.max(0.3, rCE_req); 
            } else {
                if (currentVeb < 0.1) this.smVeb = 0;
            }
        }
        
        this.lastRCE = rCE;
        
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

        if (this.lastRCE && this.lastRCE < 1000000) {
            const actualIc = Math.abs(vC - vE) / this.lastRCE;
            
            if (this.smIc === undefined) this.smIc = 0;
            this.smIc = (this.smIc * 0.7) + (actualIc * 0.3);

            // 🟢 UPDATE DATASHEET LOGIC:
            // 1. Max Collector Current = 1.5A
            // 2. Max Total Power Dissipation (Ptot) = 12.5W (dengan asumsi pendingin)
            const powerDissipation = Math.abs(vC - vE) * this.smIc;

            if (this.smIc > 1.5 || powerDissipation > 12.5) {
                this.state = 'blown';
                if (!this.hasWarned && typeof window !== 'undefined' && window.UIManager) {
                    this.hasWarned = true;
                    // Notifikasi yang spesifik tergantung apa penyebab terbakarnya
                    let reason = this.smIc > 1.5 ? `Arus (${this.smIc.toFixed(2)}A) melebihi batas 1.5A` : `Daya termal (${powerDissipation.toFixed(1)}W) melebihi 12.5W`;
                    window.UIManager.showToast(`🔥 BD140 (ID:${this.id}) Terbakar! ${reason}.`);
                }
                return;
            }
        } else {
            this.smIc = 0;
        }

        this.simV = Math.abs(vC - vE);
        let isOn = false;
        if (nB !== -1 && nE !== -1) {
            isOn = (vE - vB) > 0.6;
        }
        this.state = isOn ? '1' : '0';
    }
}

ComponentRegistry['bjt_pnp_bd140'] = TransistorBD140;