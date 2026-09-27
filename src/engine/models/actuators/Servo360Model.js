// File: src/engine/models/actuators/Servo360Model.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class Servo360 extends BaseComponent {
    
    injectMatrix(engine, sumVR, sum1R) {
        // Pemetaan PIN berdasarkan desain UI:
        // Input 0 = VCC
        // Input 1 = GND
        // Input 2 = SIG (Sinyal PWM/Tegangan)
        const nVcc = engine.getNodeIndex(this.id, 'input', 0);
        const nGnd = engine.getNodeIndex(this.id, 'input', 1);
        const nSig = engine.getNodeIndex(this.id, 'input', 2);

        // 1. BEBAN MOTOR DASAR (Konsumsi Arus)
        // Servo menarik sedikit arus dari VCC ke GND saat idle
        if (nVcc !== -1 && nGnd !== -1) {
            const gPower = 1 / 100.0; // Impedansi 100 Ohm
            sumVR[nVcc] += engine.nodeVoltage[nGnd] * gPower; sum1R[nVcc] += gPower;
            sumVR[nGnd] += engine.nodeVoltage[nVcc] * gPower; sum1R[nGnd] += gPower;
        }

        // 2. BIAS TEGANGAN SINYAL (Pencegah Error saat Kabel Putus)
        // Jika pin SIG tidak terhubung ke apapun, kita paksa tegangannya berada tepat
        // di tengah-tengah VCC dan GND (misal 2.5V) menggunakan resistor pull-up & pull-down 100k Ohm.
        // Angka 2.5V ini adalah titik Deadband (0 RPM / Berhenti).
        if (nSig !== -1 && nVcc !== -1 && nGnd !== -1) {
            const gSigBias = 1 / 100000.0; // 100k Ohm (Sangat lemah, mudah ditimpa sinyal Arduino)
            
            // Pull-up ke VCC
            sumVR[nSig] += engine.nodeVoltage[nVcc] * gSigBias; sum1R[nSig] += gSigBias;
            // Pull-down ke GND
            sumVR[nSig] += engine.nodeVoltage[nGnd] * gSigBias; sum1R[nSig] += gSigBias;
        }
    }

    applyResults(engine) {
        const nVcc = engine.getNodeIndex(this.id, 'input', 0);
        const nGnd = engine.getNodeIndex(this.id, 'input', 1);
        const nSig = engine.getNodeIndex(this.id, 'input', 2);

        const vCC = nVcc !== -1 ? (engine.nodeVoltage[nVcc] || 0) : 0;
        const vGND = nGnd !== -1 ? (engine.nodeVoltage[nGnd] || 0) : 0;
        const vSIG = nSig !== -1 ? (engine.nodeVoltage[nSig] || 0) : 0;

        const vSupply = vCC - vGND;
        const vControl = vSIG - vGND;

        // Servo hanya hidup jika disuplai minimal 3.0 Volt
        this.isPowered = vSupply >= 3.0; 
        this.currentSpeedRpm = 0; // Reset kecepatan tiap siklus

        if (this.isPowered) {
            // Kita pinjam kotak "Batas Sudut" dari UI Modal untuk dijadikan pengaturan "Max RPM"
            // Defaultnya adalah 60 RPM (standar motor servo 360)
            const maxRpm = this.maxAngle || 60; 
            
            // ==========================================
            // LOGIKA DEADBAND & KECEPATAN (0V - 5V)
            // ==========================================
            // Titik berhenti servo adalah 2.5V (write 90 derajat). 
            // Kita beri toleransi (Deadband) antara 2.4V hingga 2.6V agar stabil.
            
            if (vControl > 2.6) {
                // Sinyal > 2.6V (write 91 s.d 180) -> Putar MAJU (CW)
                let ratio = (vControl - 2.6) / 2.4; 
                ratio = Math.min(ratio, 1.0); // Maksimal 100% kecepatan
                this.currentSpeedRpm = maxRpm * ratio;

            } else if (vControl < 2.4) {
                // Sinyal < 2.4V (write 89 s.d 0) -> Putar MUNDUR (CCW)
                let ratio = (2.4 - vControl) / 2.4;
                ratio = Math.min(ratio, 1.0); // Maksimal 100% kecepatan
                this.currentSpeedRpm = -maxRpm * ratio; // Angka minus berarti mundur
            }
        }
    }

    // FUNGSI INI OTOMATIS DIPANGGIL ENGINE SETIAP MILIDETIK
    onTimeUpdate(dt, _nowMs) {
        if (this.isPowered && this.currentSpeedRpm !== 0) {
            // Jika memori sudut belum ada, buat baru
            if (this.currentAngle === undefined) this.currentAngle = 0;

            // Konversi kecepatan RPM (Rotasi per Menit) ke Derajat per Detik.
            // Rumus: 1 RPM = 360 derajat / 60 detik = 6 derajat/detik.
            const degreesPerSec = this.currentSpeedRpm * 6;

            // Akumulasikan perubahan sudut berdasarkan jeda waktu (dt)
            this.currentAngle += (degreesPerSec * dt);

            // Jaga agar nilai angka sudut tidak membengkak tanpa batas di memori RAM
            // dengan meresetnya setiap kelipatan 360 derajat (modulo).
            this.currentAngle = this.currentAngle % 360;
        }
    }
}

ComponentRegistry['servo_360'] = Servo360;