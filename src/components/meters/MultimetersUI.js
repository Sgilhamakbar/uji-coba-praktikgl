// File: src/components/meters/MultimetersUI.js
import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class VoltmeterUI extends BaseUIComponent {
    static getDimensions() { return [100, 100]; }

getSVG() {
    return `<svg width="100" height="100" viewBox="0 0 100 100">
        <!-- Pin Probe Kiri (+) & Kanan (-) -->
        <line class="pin-in-0" x1="0" y1="50" x2="20" y2="50" stroke="#006600" stroke-width="3"/>
        <line class="pin-in-1" x1="80" y1="50" x2="100" y2="50" stroke="#006600" stroke-width="3"/>
        
        <!-- Dial Meter Bulat -->
        <circle cx="50" cy="50" r="30" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
        
        <!-- Elemen UI (Angka & Tombol) yang selalu tegak -->
        <g class="keep-upright">
            <!-- Nilai Pembacaan -->
            <text class="anim-text meter-val" x="50" y="52" text-anchor="middle" font-size="18">0.0V</text>
            
            <!-- Tombol Rentang / Mode Satuan -->
            <rect class="control-btn range-btn" x="37.5" y="59" width="25" height="14" rx="3" fill="#475569" style="cursor:pointer; pointer-events:auto;"/>
            <text class="range-txt" x="50" y="69" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">V</text>
        </g>
        
        <!-- Label Polaritas -->
        <text x="6" y="40" class="comp-label" fill="red" font-size="16" font-weight="bold">+</text>
        <text x="86" y="40" class="comp-label" fill="black" font-size="16" font-weight="bold">-</text>
    </svg>`;
}
    updateState(isSimActive) {
        this.setPinActive('pin-in-0', false); this.setPinActive('pin-in-1', false);
        let displayVolt = this.compData.displayVolt !== undefined ? this.compData.displayVolt : (this.compData.simV || 0);
        const text = this.contentDiv.querySelector('.anim-text');
        const rangeTxt = this.contentDiv.querySelector('.range-txt');
        
        if (this.compData.isMilli) {
            if (text) text.textContent = (displayVolt * 1000).toFixed(0)
            if (rangeTxt) { rangeTxt.textContent = 'mV'; rangeTxt.setAttribute('fill', '#eab308'); }
        } else {
            if (text) text.textContent = displayVolt.toFixed(2)
            if (rangeTxt) { rangeTxt.textContent = 'V'; rangeTxt.setAttribute('fill', '#ffffff'); }
        }
    }
}
UIRegistry['voltmeter'] = VoltmeterUI;

export class VoltmeterACUI extends BaseUIComponent {
    static getDimensions() { return [100, 100]; }

getSVG() {
    return `<svg width="100" height="100" viewBox="0 0 100 100">
        <!-- Pin Konektor -->
        <line class="pin-in-0" x1="0" y1="50" x2="20" y2="50" stroke="#006600" stroke-width="3"/>
        <line class="pin-in-1" x1="80" y1="50" x2="100" y2="50" stroke="#006600" stroke-width="3"/>
        
        <!-- Bodi Lingkaran Meteran -->
        <circle cx="50" cy="50" r="30" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
        
        <!-- Elemen UI (Angka & Tombol) yang selalu tegak -->
        <g class="keep-upright">
            <!-- Teks Nilai Tegangan -->
            <text class="anim-text meter-val" x="50" y="49" text-anchor="middle" font-size="17">0.0V</text>
            
            <!-- Tombol Switch Skala (Volt / milivolt) -->
            <rect class="control-btn range-btn" x="37.5" y="59" width="25" height="14" rx="3" fill="#475569" style="cursor:pointer; pointer-events:auto;"/>
            <text class="range-txt" x="50" y="69.5" font-size="8.5" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">VAC</text>
        </g>
        
        <!-- Simbol Fasa AC (Tilde) sebagai ganti Plus/Minus -->
        <text x="8" y="38" class="comp-label" fill="#1e293b" font-size="17" font-weight="bold">~</text>
        <text x="86" y="38" class="comp-label" fill="#1e293b" font-size="17" font-weight="bold">~</text>
    </svg>`;
}
    
    updateState(isSimActive) {
        // Pin Voltmeter tidak menyala hijau karena fungsinya hanya membaca, bukan menyalurkan arus
        this.setPinActive('pin-in-0', false); 
        this.setPinActive('pin-in-1', false);
        
        const text = this.contentDiv.querySelector('.anim-text');
        const rangeTxt = this.contentDiv.querySelector('.range-txt');

        // --- LOGIKA TOMBOL PUTAR 5 MODE (RMS → MAX → MIN → AVG → Vpp) ---
        
        // 1. Inisialisasi status awal saat komponen pertama kali dirender
        if (this.compData.measureMode === undefined) {
            this.compData.measureMode = 0; // 0=RMS, 1=MAX, 2=MIN, 3=AVG, 4=Vpp
            this.compData._lastIsMilli = this.compData.isMilli;
        }
        
        // 2. Deteksi jika pengguna MENGKLIK tombol (variabel isMilli berubah dari luar)
        if (this.compData.isMilli !== this.compData._lastIsMilli) {
            this.compData._lastIsMilli = this.compData.isMilli;
            this.compData.measureMode = (this.compData.measureMode + 1) % 5;
        }

        // --- AMBIL NILAI BERDASARKAN MODE AKTIF ---
        let displayVolt, modeLabel, modeColor;
        
        switch (this.compData.measureMode) {
            case 1: // MAX (Puncak Positif)
                displayVolt = this.compData.simV_max || 0;
                modeLabel = 'MAX';
                modeColor = '#ef4444'; // Merah
                break;
            case 2: // MIN (Lembah Negatif)
                displayVolt = this.compData.simV_min !== undefined ? this.compData.simV_min : 0;
                modeLabel = 'MIN';
                modeColor = '#38bdf8'; // Biru muda
                break;
            case 3: // AVG (Rata-rata DC)
                displayVolt = this.compData.simV_mean !== undefined ? this.compData.simV_mean : 0;
                modeLabel = 'AVG';
                modeColor = '#eab308'; // Kuning
                break;
            case 4: // Vpp (Peak-to-Peak)
                displayVolt = this.compData.simV_pp || 0;
                modeLabel = 'Vpp';
                modeColor = '#4ade80'; // Hijau
                break;
            default: // RMS (mode 0)
                displayVolt = this.compData.simV_rms || 0;
                modeLabel = 'RMS';
                modeColor = '#ffffff'; // Putih
                break;
        }

        // --- RENDER TAMPILAN ---
        if (text) text.textContent = displayVolt.toFixed(1);
        if (rangeTxt) {
            rangeTxt.textContent = modeLabel;
            rangeTxt.setAttribute('fill', modeColor);
        }
    }
}
// Mendaftarkan komponen ke UI Registry
UIRegistry['voltmeter_ac'] = VoltmeterACUI;

export class AmmeterUI extends BaseUIComponent {
    static getDimensions() { return [100, 100]; }

getSVG() {
    return `<svg width="100" height="100" viewBox="0 0 100 100">
        <!-- Pin Konektor Seri (In & Out) -->
        <line class="pin-in-0" x1="0" y1="50" x2="20" y2="50" stroke="#006600" stroke-width="3"/>
        <line class="pin-out-0" x1="80" y1="50" x2="100" y2="50" stroke="#006600" stroke-width="3"/>
        
        <!-- Bodi Lingkaran Meteran -->
        <circle cx="50" cy="50" r="30" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
        
        <!-- Elemen UI (Angka & Tombol) yang selalu tegak -->
        <g class="keep-upright">
            <!-- Teks Nilai Arus -->
            <text class="anim-text meter-val" x="50" y="51" text-anchor="middle" font-size="18">0.00A</text>
            
            <!-- Tombol Switch Rentang Skala (A / mA) -->
            <rect class="control-btn range-btn" x="37.5" y="59" width="25" height="14" rx="3" fill="#475569" style="cursor:pointer; pointer-events:auto;"/>
            <text class="range-txt" x="50" y="69.5" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">A</text>
        </g>
    </svg>`;
}
    
    updateState(isSimActive) {
        const vState = this.compData.simV > 0;
        this.setPinActive('pin-in-0', vState); 
        this.setPinActive('pin-out-0', vState);
        let iVal = Math.abs(this.compData.simI || 0);
        
        const text = this.contentDiv.querySelector('.anim-text');
        const rangeTxt = this.contentDiv.querySelector('.range-txt');
        
        // --- LOGIKA TOMBOL MANUAL 3 PUTARAN (A -> mA -> µA) ---
        
        // 1. Inisialisasi status awal saat komponen pertama kali dirender
        if (this.compData.scaleMode === undefined) {
            this.compData.scaleMode = 0; // 0 = A, 1 = mA, 2 = µA
            this.compData.lastIsMilli = this.compData.isMilli;
        }
        
        // 2. Deteksi jika pengguna MENGKLIK tombol (variabel isMilli berubah dari luar)
        if (this.compData.isMilli !== this.compData.lastIsMilli) {
            this.compData.lastIsMilli = this.compData.isMilli; // Simpan memori klik
            // Putar mode ke tahap berikutnya
            this.compData.scaleMode = (this.compData.scaleMode + 1) % 3; 
        }

        // --- RENDER TAMPILAN BERDASARKAN MODE MANUAL ---
        
        if (this.compData.scaleMode === 2) {
            // Mode Manual: mikroAmpere (µA)
            if (text) text.textContent = (iVal * 1000000).toFixed(2)
            if (rangeTxt) { 
                rangeTxt.textContent = 'µA'; 
                rangeTxt.setAttribute('fill', '#38bdf8'); 
            }
        } else if (this.compData.scaleMode === 1) {
            // Mode Manual: miliAmpere (mA)
            if (text) text.textContent = (iVal * 1000).toFixed(2)
            if (rangeTxt) { 
                rangeTxt.textContent = 'mA'; 
                rangeTxt.setAttribute('fill', '#eab308'); // Kuning
            }
        } else {
            // Mode Manual: Ampere (A) standar
            if (text) text.textContent = iVal.toFixed(2)
            if (rangeTxt) { 
                rangeTxt.textContent = 'A'; 
                rangeTxt.setAttribute('fill', '#ffffff'); // Putih
            }
        }
    }
}
UIRegistry['ammeter'] = AmmeterUI;

export class OhmmeterUI extends BaseUIComponent {
    static getDimensions() { return [100, 100]; }

getSVG() {
    return `<svg width="100" height="100" viewBox="0 0 100 100">
        <!-- Pin Probe Kiri (+) & Kanan (-) -->
        <line class="pin-in-0" x1="0" y1="50" x2="20" y2="50" stroke="#006600" stroke-width="3"/>
        <line class="pin-in-1" x1="80" y1="50" x2="100" y2="50" stroke="#006600" stroke-width="3"/>
        
        <!-- Bodi Layar Display Gelap -->
        <circle cx="50" cy="50" r="30" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
        
        <!-- Elemen UI (Angka & Tombol) yang selalu tegak -->
        <g class="keep-upright">
            <!-- Teks Nilai Hambatan (Default: OL / Overload) -->
            <text class="anim-text meter-val" x="50" y="51" text-anchor="middle" font-size="18" font-family="monospace" font-weight="bold" fill="#facc15">OL</text>
            
            <!-- Tombol Rentang Skala (Range Button: Ω, kΩ, MΩ) -->
            <rect class="control-btn range-btn" x="37.5" y="59" width="25" height="14" rx="3" fill="#475569" style="cursor:pointer; pointer-events:auto;"/>
            <text class="range-txt" x="50" y="69.5" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">Ω</text>
        </g>
        
        <!-- Label Polaritas Probe -->
        <text x="6" y="40" class="comp-label" fill="red" font-size="16" font-weight="bold">+</text>
        <text x="86" y="40" class="comp-label" fill="black" font-size="16" font-weight="bold">-</text>
    </svg>`;
}
    
    updateState(isSimActive) {
        this.setPinActive('pin-in-0', false); 
        this.setPinActive('pin-in-1', false);
        const text = this.contentDiv.querySelector('.anim-text');
        const rangeTxt = this.contentDiv.querySelector('.range-txt');

        // --- LOGIKA TOMBOL MANUAL 3 PUTARAN (Ω -> kΩ -> MΩ) ---
        if (this.compData.scaleMode === undefined) {
            this.compData.scaleMode = 0; // 0 = Ω, 1 = kΩ, 2 = MΩ
            this.compData.lastIsMilli = this.compData.isMilli;
        }
        // Deteksi jika pengguna mengklik tombol di kanvas
        if (this.compData.isMilli !== this.compData.lastIsMilli) {
            this.compData.lastIsMilli = this.compData.isMilli; 
            this.compData.scaleMode = (this.compData.scaleMode + 1) % 3; 
        }

        if (text) {
            if (this.compData.isError) {
                text.textContent = 'ERR'; text.setAttribute('fill', '#ef4444');
                if (rangeTxt) { rangeTxt.textContent = 'ERR'; rangeTxt.setAttribute('fill', '#ef4444'); }
            } else if (this.compData.isOL) {
                text.textContent = 'OL'; text.setAttribute('fill', '#facc15');
                // Tampilkan satuan yang sedang aktif meskipun sedang Over Load (OL)
                if (rangeTxt) {
                    if (this.compData.scaleMode === 2) { rangeTxt.textContent = 'MΩ'; rangeTxt.setAttribute('fill', '#38bdf8'); }
                    else if (this.compData.scaleMode === 1) { rangeTxt.textContent = 'kΩ'; rangeTxt.setAttribute('fill', '#eab308'); }
                    else { rangeTxt.textContent = 'Ω'; rangeTxt.setAttribute('fill', '#ffffff'); }
                }
            } else {
                let r = this.compData.simR || 0;
                text.setAttribute('fill', '#4ade80'); // Warna angka hijau saat membaca sukses
                
                // --- RENDER TAMPILAN BERDASARKAN MODE MANUAL ---
                if (this.compData.scaleMode === 2) {
                    // Mode Manual: MegaOhm (MΩ)
                    text.textContent = (r / 1000000).toFixed(2);
                    if (rangeTxt) { rangeTxt.textContent = 'MΩ'; rangeTxt.setAttribute('fill', '#38bdf8'); } // Biru muda
                } else if (this.compData.scaleMode === 1) {
                    // Mode Manual: kiloOhm (kΩ)
                    text.textContent = (r / 1000).toFixed(2);
                    if (rangeTxt) { rangeTxt.textContent = 'kΩ'; rangeTxt.setAttribute('fill', '#eab308'); } // Kuning
                } else {
                    // Mode Manual: Ohm (Ω) standar
                    text.textContent = r.toFixed(2);
                    if (rangeTxt) { rangeTxt.textContent = 'Ω'; rangeTxt.setAttribute('fill', '#ffffff'); } // Putih
                }
            }
        }
    }
}
UIRegistry['ohmmeter'] = OhmmeterUI;