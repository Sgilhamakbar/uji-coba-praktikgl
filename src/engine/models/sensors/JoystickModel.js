// File: src/engine/models/sensors/JoystickModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class Joystick extends BaseComponent {
    
    injectMatrix(engine, sumVR, sum1R) {
        // Pemetaan PIN berdasarkan desain UI JoystickUI.js:
        // Input 0 = VCC
        // Input 1 = GND
        // Output 0 = VRx (Analog Sumbu X)
        // Output 1 = VRy (Analog Sumbu Y)
        // Output 2 = SW  (Tombol Digital)
        const nVcc = engine.getNodeIndex(this.id, 'input', 0);
        const nGnd = engine.getNodeIndex(this.id, 'input', 1);
        const nVRx = engine.getNodeIndex(this.id, 'output', 0);
        const nVRy = engine.getNodeIndex(this.id, 'output', 1);
        const nSW  = engine.getNodeIndex(this.id, 'output', 2);

        // 1. BACA TEGANGAN REFERENSI (VCC & GND)
        const vCC = nVcc !== -1 ? (engine.nodeVoltage[nVcc] || 0) : 0;
        const vGND = nGnd !== -1 ? (engine.nodeVoltage[nGnd] || 0) : 0;
        const vSupply = vCC - vGND;

        // Joystick pasif (potensiometer), tapi butuh minimal tegangan agar masuk akal
        this.isPowered = vSupply >= 1.0; 

        // 2. BEBAN KONSUMSI ARUS (PARALEL 2x POTENSIOMETER 10kΩ)
        // Dua resistor 10kΩ paralel antara VCC dan GND menghasilkan hambatan total 5kΩ.
        if (nVcc !== -1 && nGnd !== -1) {
            const gLoad = 1 / 5000.0; // 5k Ohm
            sumVR[nVcc] += vGND * gLoad; 
            sum1R[nVcc] += gLoad;
            
            sumVR[nGnd] += vCC * gLoad; 
            sum1R[nGnd] += gLoad;
        }

        // ==========================================
        // 3. PARSING DATA MEMORI (STATE)
        // ==========================================
        let stateObj = { x: 0, y: 0, btn: 0 }; 
        if (this.state) {
            try { 
                const parsed = (typeof this.state === 'string') ? JSON.parse(this.state) : this.state; 
                if (typeof parsed === 'object' && parsed !== null) stateObj = parsed;
            } 
            catch (e) { /* Abaikan jika error, gunakan default di tengah */ }
        }

        if (this.isPowered) {
            // Resistansi ekuivalen output Thevenin dari potensiometer 10k.
            // Nilai resistansi paling besar adalah saat di tengah (2.5k Ohm).
            // Kita sederhanakan menggunakan resistansi konstan 1k Ohm agar simulasi ADC Arduino stabil.
            const gOutAnalog = 1 / 1000.0; 

            // LOGIKA SUMBU X (VRx)
            if (nVRx !== -1) {
                // RUMUS : rasio 0.0 s/d 1.0
                // Contoh: (-100 + 100) / 200 = 0.0 | (0 + 100) / 200 = 0.5 | (100 + 100) / 200 = 1.0
                let ratioX = (stateObj.x + 100) / 200.0;
                const targetVx = vGND + (vSupply * ratioX);
                sumVR[nVRx] += targetVx * gOutAnalog;
                sum1R[nVRx] += gOutAnalog;
            }

            // LOGIKA SUMBU Y (VRy)
            if (nVRy !== -1) {
                // Catatan: Pada banyak joystick fisik KY-023, sumbu Y terbalik secara mekanis.
                // Jika ingin Y ke atas menghasilkan 5V, rumusnya dibalik.
                // Di sini kita asumsikan 100% = 5V.
                let ratioY = (stateObj.y + 100) / 200.0;
                const targetVy = vGND + (vSupply * ratioY);
                sumVR[nVRy] += targetVy * gOutAnalog;
                sum1R[nVRy] += gOutAnalog;
            }
        } else {
            // JIKA KABEL POWER DICABUT (Floating Pull-Down Alami)
            // Pin VRx dan VRy ditarik perlahan ke GND lewat hambatan potensiometer (10k)
            const gOff = 1 / 10000.0;
            if (nVRx !== -1 && nGnd !== -1) {
                sumVR[nVRx] += vGND * gOff; sum1R[nVRx] += gOff;
            }
            if (nVRy !== -1 && nGnd !== -1) {
                sumVR[nVRy] += vGND * gOff; sum1R[nVRy] += gOff;
            }
        }

        // ==========================================
        // 4. LOGIKA TOMBOL TEKAN / SWITCH (Sumbu Z)
        // ==========================================
        // Sesuai datasheet KY-023: Tombol ini TIDAK memiliki resistor pull-up.
        // Hanya menyambungkan pin SW ke GND saat ditekan. Saat dilepas = Mengambang (Floating).
        if (nSW !== -1 && nGnd !== -1) {
            if (stateObj.btn === 1) {
                // Saat ditekan, terjadi hubungan singkat (short) ke GND dengan hambatan sangat kecil
                const gSwitch = 1 / 0.1; // 0.1 Ohm (Hambatan logam pelatuk sakelar)
                
                sumVR[nSW] += engine.nodeVoltage[nGnd] * gSwitch;
                sum1R[nSW] += gSwitch;
                
                sumVR[nGnd] += engine.nodeVoltage[nSW] * gSwitch;
                sum1R[nGnd] += gSwitch;
            }
            // Jika btn === 0 (tidak ditekan), kita tidak menyuntikkan rumus apapun.
            // Ini akan membiarkan pin SW "mengambang", sehingga pengguna wajib menggunakan
            // pinMode(pin, INPUT_PULLUP) di Arduino mereka! (Tingkat realisme 100%).
        }
    }
}

ComponentRegistry['joystick'] = Joystick;