// File: src/engine/models/meters/MultimetersModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';

export class Ammeter extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        if (nIn !== -1 && nOut !== -1) {
            const cond = 1 / 0.01; // Hambatan internal Amperemeter sangat kecil (0.01 Ohm) seperti shunt resistor asli
            sumVR[nIn] += engine.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
            sumVR[nOut] += engine.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
        }
    }
    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        const vDiff = (nIn !== -1 ? engine.nodeVoltage[nIn] : 0) - (nOut !== -1 ? engine.nodeVoltage[nOut] : 0);
        this.simV = Math.abs(vDiff);
        this.simI = vDiff / 0.01; 
    }
};

export class Voltmeter extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        if (nIn0 !== -1 && nIn1 !== -1) {
            const cond = 1 / 100000000; // Hambatan internal Voltmeter 1 MegaOhm
            sumVR[nIn0] += engine.nodeVoltage[nIn1] * cond; sum1R[nIn0] += cond;
            sumVR[nIn1] += engine.nodeVoltage[nIn0] * cond; sum1R[nIn1] += cond;
        }
    }
    applyResults(engine) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        this.targetV = (nIn0 !== -1 ? engine.nodeVoltage[nIn0] : 0) - (nIn1 !== -1 ? engine.nodeVoltage[nIn1] : 0);
    }
    onTimeUpdate(dt, _now) {
        if (this.targetV === undefined) this.targetV = 0;
        if (this.simV === undefined) this.simV = 0;

        // Voltmeter DC bereaksi sedikit lebih cepat (speed 6.0) dari AC
        const animSpeed = 6.0; 
        this.simV += (this.targetV - this.simV) * (animSpeed * dt);

        if (Math.abs(this.targetV - this.simV) < 0.01) {
            this.simV = this.targetV;
        }
    }
};

export class VoltmeterAC extends BaseComponent {
    
    // 1. INJEKSI MATRIKS (Hambatan Internal)
    injectMatrix(engine, sumVR, sum1R) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        
        if (nIn0 !== -1 && nIn1 !== -1) {
            // Hambatan internal Voltmeter AC sama dengan DC, yaitu sangat besar (1 MegaOhm)
            // agar tidak menyedot arus sirkuit yang sedang diukur.
            const cond = 1 / 1000000; 
            sumVR[nIn0] += engine.nodeVoltage[nIn1] * cond; sum1R[nIn0] += cond;
            sumVR[nIn1] += engine.nodeVoltage[nIn0] * cond; sum1R[nIn1] += cond;
        }
    }

    // 2. SAMPLING TEGANGAN INSTAN (Setiap iterasi matriks)
    applyResults(engine) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        
        // Baca tegangan "saat ini juga" (Bisa positif, bisa negatif karena ini AC)
        const v0 = nIn0 !== -1 ? engine.nodeVoltage[nIn0] : 0;
        const v1 = nIn1 !== -1 ? engine.nodeVoltage[nIn1] : 0;
        
        // Simpan ke memori sementara untuk diolah oleh mesin waktu
        this.instV = v0 - v1;
    }

    // 3. MESIN MULTI-MODE PENGUKURAN - Dijalankan setiap frame waktu
    //    Menghitung 5 nilai sekaligus: RMS, Vmax, Vmin, Mean, Vpp
    onTimeUpdate(dt, _now) {
        if (this.instV === undefined) this.instV = 0;
        if (this._meanSq === undefined) this._meanSq = 0;
        if (this._meanV === undefined) this._meanV = 0;
        if (this.simV_max === undefined) this.simV_max = 0;
        if (this.simV_min === undefined) this.simV_min = 0;

        const v = this.instV;

        // ======= Alpha untuk RMS & Mean (Time Constant 0.4 detik) =======
        const alphaRms = Math.exp(-dt / 0.4);

        // ======= Alpha untuk Peak Hold (Time Constant 2.0 detik, luruh lambat) =======
        const alphaPeak = Math.exp(-dt / 2.0);

        // ======= MODE 1: RMS (Root Mean Square) =======
        // Kuadratkan → Rata-ratakan (EMA) → Akarkan
        const vSq = v * v;
        this._meanSq = (this._meanSq * alphaRms) + (vSq * (1 - alphaRms));
        this.simV_rms = Math.sqrt(this._meanSq);

        // ======= MODE 2: Vmax (Signed Peak Detector / Puncak Positif) =======
        // Menggunakan nilai BERTANDA (signed), bukan absolut!
        // Sehingga AC 12Vp → Vmax = +12V, Setengah Gelombang → Vmax = +12V
        if (v > this.simV_max) {
            this.simV_max = v;                                          // Tangkap puncak baru secara instan
        } else {
            this.simV_max = v + (this.simV_max - v) * alphaPeak;        // Luruh pelan menuju sinyal saat ini
        }

        // ======= MODE 3: Vmin (Signed Valley Detector / Lembah Negatif) =======
        // Menggunakan nilai BERTANDA (signed), bukan absolut!
        // Sehingga AC 12Vp → Vmin = -12V, Setengah Gelombang → Vmin = 0V
        if (v < this.simV_min) {
            this.simV_min = v;                                          // Tangkap lembah baru secara instan
        } else {
            this.simV_min = v + (this.simV_min - v) * alphaPeak;        // Naik pelan menuju sinyal saat ini
        }

        // ======= MODE 4: Mean / Average (Komponen DC dari sinyal) =======
        // EMA langsung pada tegangan mentah (tanpa dikuadratkan)
        // AC sinus murni → ~0V, Setengah gelombang → nilai DC positif
        this._meanV = (this._meanV * alphaRms) + (v * (1 - alphaRms));
        this.simV_mean = this._meanV;

        // ======= MODE 5: Vpp (Peak-to-Peak = Vmax - Vmin) =======
        // AC 12Vp → Vpp = 12 - (-12) = 24V
        this.simV_pp = this.simV_max - this.simV_min;

        // Filter Anti-Noise: Jika semua sinyal sangat kecil, bersihkan semua memori
        if (this.simV_rms < 0.001) {
            this.simV_rms = 0;
            this.simV_max = 0;
            this.simV_min = 0;
            this.simV_mean = 0;
            this.simV_pp = 0;
            this._meanSq = 0;
            this._meanV = 0;
        }
    }
};

export class Ohmmeter extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        
        if (nIn0 !== -1 && nIn1 !== -1) {
            // 🟢 EKUIVALEN NORTON DARI VOLTAGE DIVIDER
            // Baterai Internal 9V dengan Resistor Rujukan 1 MegaOhm
            const R_ref = 1000000.0; // 1 MΩ
            const V_bat = 9.0;       // 9 Volt
            
            const G_ref = 1.0 / R_ref;
            const I_norton = V_bat * G_ref; // 0.000009 Ampere (9µA)
            
            // 1. Injeksi Sumber Arus Norton ke dalam sirkuit
            sumVR[nIn0] += I_norton; 
            sumVR[nIn1] -= I_norton;
            
            // 2. Injeksi Konduktansi Internal (R_ref diparalel)
            sumVR[nIn0] += engine.nodeVoltage[nIn1] * G_ref; sum1R[nIn0] += G_ref;
            sumVR[nIn1] += engine.nodeVoltage[nIn0] * G_ref; sum1R[nIn1] += G_ref;
        }
    }
    
    applyResults(engine) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        
        this.isError = false; 
        this.isOL = false; 
        this.simR = 0;
        
        // Cek jika kabel terlepas dari sirkuit
        if (nIn0 === -1 || nIn1 === -1) {
            this.isOL = true; 
            return;
        }
        
        // Baca tegangan jatuh yang terbentuk di antara kedua jarum Ohmmeter
        const vDiff = engine.nodeVoltage[nIn0] - engine.nodeVoltage[nIn1];
        
        // 🟢 DETEKSI KESALAHAN PENGGUNA (Fitur Anti-Bakar)
        // Jika ada arus aktif dari sirkuit yang melawan baterai internal Ohmmeter
        if (vDiff < -0.05 || vDiff > 9.05) {
            this.isError = true;
            return;
        }
        
        // 🟢 DETEKSI OVER-LOAD (Sirkuit Terbuka)
        // Jika tegangan kembali mentok 9V, berarti jarum tidak terhubung ke beban apa pun
        if (vDiff >= 8.99) {
            this.isOL = true;
            return;
        }
        
        // 🟢 KALKULASI HAMBATAN EKSTERNAL (Rumus Voltage Divider Dibalik)
        // Rumus Asli: V_diff = V_bat * (Rx / (R_ref + Rx))
        // Dibalik jadi: Rx = R_ref * (V_diff / (V_bat - V_diff))
        const R_ref = 1000000.0;
        const V_bat = 9.0;
        
        let rx = R_ref * (vDiff / (V_bat - vDiff));
        
        if (rx < 0) {
            this.isError = true;
        } else {
            this.simR = rx;
        }
    }
};

// Daftarkan model fisika ini ke Registry
ComponentRegistry['voltmeter_ac'] = VoltmeterAC;
ComponentRegistry['voltmeter'] = Voltmeter;
ComponentRegistry['ammeter'] = Ammeter;
ComponentRegistry['ohmmeter'] = Ohmmeter;