// File: src/engine/models/sensor/TCRT5000Model.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class TCRT5000 extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        // Pemetaan PIN:
        // Input 0 = VCC, Input 1 = GND
        // Output 0 = D0 (Digital), Output 1 = A0 (Analog)
        const nVcc = engine.getNodeIndex(this.id, 'input', 0);
        const nGnd = engine.getNodeIndex(this.id, 'input', 1);
        const nD0  = engine.getNodeIndex(this.id, 'output', 0);
        const nA0  = engine.getNodeIndex(this.id, 'output', 1);

        // 1. BACA TEGANGAN REL SUPLAI
        const vDD = nVcc !== -1 ? (engine.nodeVoltage[nVcc] || 0) : 0;
        const vSS = nGnd !== -1 ? (engine.nodeVoltage[nGnd] || 0) : 0;
        const vSupply = vDD - vSS;

        // Sensor aktif jika selisih tegangan operasional minimal 3.0V (LM393 + IR drop)
        this.isPowered = vSupply >= 3.0;

        if (this.isPowered) {
            // Ambil persentase kecerahan (0 = Hitam pekat, 100 = Putih terang)
            // Menggunakan (??) agar nilai 0 tidak ter-reset ke 50
            const rawState = this.state ?? 50;
            const kecerahan = typeof rawState === 'number' ? rawState : parseFloat(rawState);

            // ==========================================
            // 2. LOGIKA PIN DIGITAL OUT (D0) - Active LOW
            // ==========================================
            if (nD0 !== -1) {
                const gOutD = 1 / 100.0; // Resistansi ekuivalen output D0 (~100 ohm)
                
                // Terang/Memantul (> 50) -> LOW (vSS)
                // Gelap/Menyerap (<= 50) -> HIGH (vDD)
                const targetD0 = (kecerahan > 50) ? vSS : vDD;

                sumVR[nD0] += targetD0 * gOutD;
                sum1R[nD0] += gOutD;
            }

            // ==========================================
            // 3. LOGIKA PIN ANALOG OUT (A0) - Linear Inverted
            // ==========================================
            if (nA0 !== -1) {
                const gOutA = 1 / 200.0; // Resistansi ekuivalen output A0 (~200 ohm)
                
                // Rasio pantulan (0.0 = gelap total, 1.0 = terang total)
                const rasio = Math.min(Math.max(kecerahan / 100.0, 0.0), 1.0);
                
                // Hitam pekat (0%)  -> Mendekati rel VCC (vDD)
                // Putih terang (100%) -> Mendekati rel GND (vSS + saturasi ~0.1V)
                const vSat = 0.1;
                const targetA0 = vDD - (rasio * (vSupply - vSat));

                sumVR[nA0] += targetA0 * gOutA;
                sum1R[nA0] += gOutA;
            }
        }
    }
}

ComponentRegistry['tcrt5000'] = TCRT5000;