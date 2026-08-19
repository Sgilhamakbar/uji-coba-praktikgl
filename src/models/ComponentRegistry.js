// File: src/models/ComponentRegistry.js

const ComponentRegistry = {};

// Kelas Dasar (Blueprint)
class BaseComponent {
    constructor(data) {
        Object.assign(this, data);
    }
    
    // Metode bawaan yang bisa di-override oleh komponen spesifik
    onTimeUpdate(dt, now) {} 
    solveDigital(engine) {}
    applyFixedVoltage(engine, fixedNodes) {}
    injectMatrix(engine, sumVR, sum1R) {}
    applyResults(engine) {}
}

// -----------------------------------------------------
// 1: KOMPONEN RESISTOR
// -----------------------------------------------------
ComponentRegistry['resistor'] = class Resistor extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        const r = this.customValue || 330;
        
        if (nIn !== -1 && nOut !== -1) {
            const cond = 1 / r;
            sumVR[nIn] += engine.nodeVoltage[nOut] * cond; 
            sum1R[nIn] += cond;
            
            sumVR[nOut] += engine.nodeVoltage[nIn] * cond; 
            sum1R[nOut] += cond;
        }
    }

    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        const vIn = nIn !== -1 ? engine.nodeVoltage[nIn] : 0;
        const vOut = nOut !== -1 ? engine.nodeVoltage[nOut] : 0;
        
        this.simV = Math.abs(vIn - vOut);
        this.simI = this.simV / (this.customValue || 330);
    }
};

// -----------------------------------------------------
// 2: KOMPONEN CLOCK PULSE (Butuh Waktu)
// -----------------------------------------------------
ComponentRegistry['clock_pulse'] = class ClockPulse extends BaseComponent {
    onTimeUpdate(dt, now) {
        const freq = Math.min(this.freqValue || 2, 1000);
        const halfPeriodMs = 1000 / freq / 2;
        
        if (!this._lastToggle) this._lastToggle = now;
        
        // Loop penangkap waktu (Time catch-up)
        while (now - this._lastToggle >= halfPeriodMs) {
            this.state = this.state === '1' ? '0' : '1';
            this._lastToggle += halfPeriodMs; 
        }
    }

    solveDigital(engine) {
        this.outputState = this.state === '1' ? 1 : 0;
    }

    applyFixedVoltage(engine, fixedNodes) {
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        if (nOut !== -1) {
            engine.nodeVoltage[nOut] = this.outputState === 1 ? 5 : 0;
            fixedNodes[nOut] = true; // Kunci sebagai sumber tegangan 5V
        }
    }
};

// -----------------------------------------------------
// KELOMPOK DAYA DASAR (GROUND, TERMINAL, BATERAI)
// -----------------------------------------------------
ComponentRegistry['ground'] = class Ground extends BaseComponent {
    applyFixedVoltage(engine, fixedNodes) {
        const nIdx = engine.getNodeIndex(this.id, 'input', 0);
        if (nIdx !== -1) { 
            engine.nodeVoltage[nIdx] = 0; 
            fixedNodes[nIdx] = true; 
        }
    }
};

ComponentRegistry['power_terminal'] = class PowerTerminal extends BaseComponent {
    applyFixedVoltage(engine, fixedNodes) {
        const nIdx = engine.getNodeIndex(this.id, 'output', 0);
        if (nIdx !== -1) { 
            engine.nodeVoltage[nIdx] = this.customValue || 12; 
            fixedNodes[nIdx] = true; 
        }
    }
};

class Battery extends BaseComponent {
    applyFixedVoltage(engine, fixedNodes) {
        const nOut = engine.getNodeIndex(this.id, 'output', 0); 
        const nIn = engine.getNodeIndex(this.id, 'output', 1);  
        let v = this.customValue !== undefined ? this.customValue : (this.type === 'battery_1cell' ? 1.5 : 12);
        
        if (nOut !== -1 && nIn !== -1) {
            if (fixedNodes[nIn]) {
                engine.nodeVoltage[nOut] = engine.nodeVoltage[nIn] + v;
                fixedNodes[nOut] = true;
            } else if (fixedNodes[nOut]) {
                engine.nodeVoltage[nIn] = engine.nodeVoltage[nOut] - v;
                fixedNodes[nIn] = true;
            } else {
                const center = (engine.nodeVoltage[nOut] + engine.nodeVoltage[nIn]) / 2;
                engine.nodeVoltage[nOut] = center + (v / 2);
                engine.nodeVoltage[nIn] = center - (v / 2);
                fixedNodes[nOut] = true; fixedNodes[nIn] = true;
            }
        } else if (nOut !== -1) {
            engine.nodeVoltage[nOut] = v; fixedNodes[nOut] = true;
        } else if (nIn !== -1) {
            engine.nodeVoltage[nIn] = 0; fixedNodes[nIn] = true;
        }
    }
}
// Daftarkan semua jenis baterai ke kelas Battery
ComponentRegistry['battery'] = Battery;
ComponentRegistry['battery_multi'] = Battery;
ComponentRegistry['battery_1cell'] = Battery;

// -----------------------------------------------------
// KELOMPOK ALAT UKUR & PROTEKSI
// -----------------------------------------------------
ComponentRegistry['ammeter'] = class Ammeter extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        if (nIn !== -1 && nOut !== -1) {
            const cond = 1 / 1; // Hambatan Amperemeter idealnya kecil (1 Ohm)
            sumVR[nIn] += engine.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
            sumVR[nOut] += engine.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
        }
    }
    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        const vDiff = (nIn !== -1 ? engine.nodeVoltage[nIn] : 0) - (nOut !== -1 ? engine.nodeVoltage[nOut] : 0);
        this.simV = Math.abs(vDiff);
        this.simI = vDiff / 1; 
    }
};

ComponentRegistry['voltmeter'] = class Voltmeter extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        if (nIn0 !== -1 && nIn1 !== -1) {
            const cond = 1 / 1000000; // Hambatan internal Voltmeter 1 MegaOhm
            sumVR[nIn0] += engine.nodeVoltage[nIn1] * cond; sum1R[nIn0] += cond;
            sumVR[nIn1] += engine.nodeVoltage[nIn0] * cond; sum1R[nIn1] += cond;
        }
    }
    applyResults(engine) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        this.simV = (nIn0 !== -1 ? engine.nodeVoltage[nIn0] : 0) - (nIn1 !== -1 ? engine.nodeVoltage[nIn1] : 0);
    }
};

ComponentRegistry['fuse'] = class Fuse extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const isBlown = this.state === 'blown';
        const r = isBlown ? 1000000000 : 1; 
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        if (nIn !== -1 && nOut !== -1) {
            const cond = 1 / r;
            sumVR[nIn] += engine.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
            sumVR[nOut] += engine.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
        }
    }
    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        const vIn = nIn !== -1 ? engine.nodeVoltage[nIn] : 0;
        const vOut = nOut !== -1 ? engine.nodeVoltage[nOut] : 0;
        const isBlown = this.state === 'blown';
        
        this.simV = Math.abs(vIn - vOut);
        this.simI = (vIn - vOut) / (isBlown ? 1000000000 : 1);
        
        const maxAmpere = this.customValue || 10;
        if (!isBlown && Math.abs(this.simI) > maxAmpere) {
            this.state = 'blown'; 
        }
    }
};

// -----------------------------------------------------
// KELOMPOK SUMBER AC (V-SINE)
// -----------------------------------------------------
ComponentRegistry['vsine'] = class VSine extends BaseComponent {
    applyFixedVoltage(engine, fixedNodes) {
        const nOut = engine.getNodeIndex(this.id, 'output', 0); 
        const nIn = engine.getNodeIndex(this.id, 'output', 1);  
        
        const time = Date.now() / 1000; // Ambil waktu aktual
        const amp = this.customValue !== undefined ? this.customValue : 12;
        const freq = this.freqValue !== undefined ? this.freqValue : 1;
        const offset = this.dcOffset !== undefined ? this.dcOffset : 0;
        const delay = this.timeDelay !== undefined ? this.timeDelay : 0;
        
        // Rumus Fisika Generator AC
        const v = offset + amp * Math.sin(2 * Math.PI * freq * (time - delay));
        
        if (nOut !== -1 && nIn !== -1) {
            if (fixedNodes[nIn]) {
                engine.nodeVoltage[nOut] = engine.nodeVoltage[nIn] + v;
                fixedNodes[nOut] = true;
            } else if (fixedNodes[nOut]) {
                engine.nodeVoltage[nIn] = engine.nodeVoltage[nOut] - v;
                fixedNodes[nIn] = true;
            } else {
                const center = (engine.nodeVoltage[nOut] + engine.nodeVoltage[nIn]) / 2;
                engine.nodeVoltage[nOut] = center + (v / 2);
                engine.nodeVoltage[nIn] = center - (v / 2);
                fixedNodes[nOut] = true; fixedNodes[nIn] = true;
            }
        } else if (nOut !== -1) {
            engine.nodeVoltage[nOut] = v; fixedNodes[nOut] = true;
        } else if (nIn !== -1) {
            engine.nodeVoltage[nIn] = 0; fixedNodes[nIn] = true;
        }
    }
};

// -----------------------------------------------------
// KELOMPOK MOTOR & AKTUATOR
// -----------------------------------------------------
ComponentRegistry['motor_dc'] = class MotorDC extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const r = parseFloat(this.coilR) || 15;                    
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);

        if (nIn !== -1 && nOut !== -1) {
            const cond = 1 / r;
            sumVR[nIn] += engine.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
            sumVR[nOut] += engine.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
        }
    }

    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        const vIn = nIn !== -1 ? engine.nodeVoltage[nIn] : 0;
        const vOut = nOut !== -1 ? engine.nodeVoltage[nOut] : 0;
        const vDiff = vIn - vOut; 
        
        const r = parseFloat(this.coilR) || 15;
        const ratedV = parseFloat(this.ratedV) || 12;
        const maxRpm = parseFloat(this.maxRpm) || 3000;
        
        this.simV = Math.abs(vDiff);
        this.simI = this.simV / r; 
        
        const rpmPerVolt = maxRpm / ratedV;
        const targetRpm = vDiff * rpmPerVolt;
        
        if (typeof this.currentRpm === 'undefined') this.currentRpm = 0;
        
        const maxAccel = 50; // Fisika inersia torsi
        let step = (targetRpm - this.currentRpm) * 0.05; 
        
        if (step > maxAccel) step = maxAccel;
        if (step < -maxAccel) step = -maxAccel;
        
        this.currentRpm += step;
        this.rpm = Math.round(this.currentRpm);
    }
};

// -----------------------------------------------------
// KELOMPOK SAKLAR (SWITCHES)
// -----------------------------------------------------
class SwitchSPST extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        let isActive = false;
        if (this.type === 'push_button_nc') {
            isActive = this.state === '0'; // Menyambung jika TIDAK ditekan
        } else {
            isActive = this.state === '1'; // Menyambung jika ditekan
        }
        
        const r = isActive ? 0.1 : 1000000000;                    
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        
        if (nIn !== -1 && nOut !== -1) {
            const cond = 1 / r;
            sumVR[nIn] += engine.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
            sumVR[nOut] += engine.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
        }
    }
}
ComponentRegistry['switch_spst'] = SwitchSPST;
ComponentRegistry['push_button'] = SwitchSPST;
ComponentRegistry['push_button_nc'] = SwitchSPST;

ComponentRegistry['switch_spdt'] = class SwitchSPDT extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const isDown = this.state === '1';
        const r0 = isDown ? 1000000000 : 0.1; // Pin Atas
        const r1 = isDown ? 0.1 : 1000000000; // Pin Bawah
        
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut0 = engine.getNodeIndex(this.id, 'output', 0);
        const nOut1 = engine.getNodeIndex(this.id, 'output', 1);
        
        if (nIn !== -1) {
            if (nOut0 !== -1) {
                const cond0 = 1 / r0;
                sumVR[nIn] += engine.nodeVoltage[nOut0] * cond0; sum1R[nIn] += cond0;
                sumVR[nOut0] += engine.nodeVoltage[nIn] * cond0; sum1R[nOut0] += cond0;
            }
            if (nOut1 !== -1) {
                const cond1 = 1 / r1;
                sumVR[nIn] += engine.nodeVoltage[nOut1] * cond1; sum1R[nIn] += cond1;
                sumVR[nOut1] += engine.nodeVoltage[nIn] * cond1; sum1R[nOut1] += cond1;
            }
        }
    }
};

ComponentRegistry['switch'] = class DigitalSwitch extends BaseComponent {
    solveDigital(engine) {
        this.outputState = this.state === '1' ? 1 : 0;
    }
    
    applyFixedVoltage(engine, fixedNodes) {
        const nOut0 = engine.getNodeIndex(this.id, 'output', 0);
        if (nOut0 !== -1) {
            engine.nodeVoltage[nOut0] = this.outputState === 1 ? 5 : 0;
            fixedNodes[nOut0] = true;
        }
    }
};

// -----------------------------------------------------
// KELOMPOK SENSOR ANALOG (LDR, THERMISTOR)
// -----------------------------------------------------
class AnalogSensor extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        let val = parseFloat(this.state);
        if (isNaN(val)) val = 50;
        
        let r = 1000;
        if (this.type === 'ldr') {
            // Rumus Logaritmik LDR
            r = 100 + (1000000 - 100) * Math.pow(1 - (val / 100), 3);
        } else if (this.type === 'thermistor_ntc') {
            // Persamaan Steinhart-Hart NTC
            const r25 = this.r25 !== undefined ? this.r25 : 10000;
            const beta = this.beta !== undefined ? this.beta : 3950;
            const T_kelvin = val + 273.15;
            r = r25 * Math.exp(beta * ((1 / T_kelvin) - (1 / 298.15)));
            if (r < 0.1) r = 0.1;
        } else if (this.type === 'thermistor_ptc') {
            // Persamaan Alpha PTC
            const r25 = this.r25 !== undefined ? this.r25 : 100;
            const alpha = this.alpha !== undefined ? this.alpha : 0.05;
            r = r25 * Math.exp(alpha * (val - 25)); 
            if (r > 1000000000) r = 1000000000;
        }

        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        if (nIn !== -1 && nOut !== -1) {
            const cond = 1 / r;
            sumVR[nIn] += engine.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
            sumVR[nOut] += engine.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
        }
    }
}
ComponentRegistry['ldr'] = AnalogSensor;
ComponentRegistry['thermistor_ntc'] = AnalogSensor;
ComponentRegistry['thermistor_ptc'] = AnalogSensor;


// -----------------------------------------------------
// KOMPONEN POTENSIOMETER
// -----------------------------------------------------
ComponentRegistry['potentiometer'] = class Potentiometer extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const val = this.customValue || 10000;
        const percent = Math.max(0, Math.min(100, parseInt(this.state || '50')));
        
        // Membagi nilai hambatan R1 dan R2 berdasarkan posisi Wiper
        const r1 = Math.max(0.1, val * ((100 - percent) / 100)); 
        const r2 = Math.max(0.1, val * (percent / 100));         

        const nIn0 = engine.getNodeIndex(this.id, 'input', 0); 
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1); 
        const nOut = engine.getNodeIndex(this.id, 'output', 0); // Pin Wiper

        if (nIn0 !== -1 && nOut !== -1) {
            const cond1 = 1 / r1;
            sumVR[nIn0] += engine.nodeVoltage[nOut] * cond1; sum1R[nIn0] += cond1;
            sumVR[nOut] += engine.nodeVoltage[nIn0] * cond1; sum1R[nOut] += cond1;
        }
        if (nIn1 !== -1 && nOut !== -1) {
            const cond2 = 1 / r2;
            sumVR[nIn1] += engine.nodeVoltage[nOut] * cond2; sum1R[nIn1] += cond2;
            sumVR[nOut] += engine.nodeVoltage[nIn1] * cond2; sum1R[nOut] += cond2;
        }
    }
};


// -----------------------------------------------------
// KELOMPOK RELAY
// -----------------------------------------------------
class Relay extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        // A. FISIKA KOIL ELEKTROMAGNETIK
        const nInC = engine.getNodeIndex(this.id, 'input', 0);
        const nOutC = engine.getNodeIndex(this.id, 'output', 0);
        if (nInC !== -1 && nOutC !== -1) {
            const condC = 1 / 100; // Hambatan koil internal
            sumVR[nInC] += engine.nodeVoltage[nOutC] * condC; sum1R[nInC] += condC;
            sumVR[nOutC] += engine.nodeVoltage[nInC] * condC; sum1R[nOutC] += condC;
        }

        // B. FISIKA SAKELAR MEKANIK (Tuas Switch)
        const isActive = this.state === '1';
        
        if (this.type === 'relay') {
            // Relay 4-Pin (Hanya NO)
            const rSwitch = isActive ? 0.1 : 1000000000; 
            const nInS = engine.getNodeIndex(this.id, 'input', 1);
            const nOutS = engine.getNodeIndex(this.id, 'output', 1);
            
            if (nInS !== -1 && nOutS !== -1) {
                const condS = 1 / rSwitch;
                sumVR[nInS] += engine.nodeVoltage[nOutS] * condS; sum1R[nInS] += condS;
                sumVR[nOutS] += engine.nodeVoltage[nInS] * condS; sum1R[nOutS] += condS;
            }
        } 
        else if (this.type === 'relay_5pin') {
            // Relay 5-Pin (Mempunyai NC dan NO)
            const nCom = engine.getNodeIndex(this.id, 'input', 1);
            const nNC = engine.getNodeIndex(this.id, 'output', 1);
            const nNO = engine.getNodeIndex(this.id, 'output', 2);
            
            if (nCom !== -1 && nNC !== -1) {
                const rNC = isActive ? 1000000000 : 0.1;
                const condNC = 1 / rNC;
                sumVR[nCom] += engine.nodeVoltage[nNC] * condNC; sum1R[nCom] += condNC;
                sumVR[nNC] += engine.nodeVoltage[nCom] * condNC; sum1R[nNC] += condNC;
            }
            if (nCom !== -1 && nNO !== -1) {
                const rNO = isActive ? 0.1 : 1000000000;
                const condNO = 1 / rNO;
                sumVR[nCom] += engine.nodeVoltage[nNO] * condNO; sum1R[nCom] += condNO;
                sumVR[nNO] += engine.nodeVoltage[nCom] * condNO; sum1R[nNO] += condNO;
            }
        }
    }

    applyResults(engine) {
        // Cek tegangan yang masuk ke koil magnet
        const nInC = engine.getNodeIndex(this.id, 'input', 0);
        const nOutC = engine.getNodeIndex(this.id, 'output', 0);
        const vIn = nInC !== -1 ? engine.nodeVoltage[nInC] : 0;
        const vOut = nOutC !== -1 ? engine.nodeVoltage[nOutC] : 0;
        const vDiff = Math.abs(vIn - vOut);
        
        // Jepret saklar ke ON (1) jika tegangan koil melebihi 3.0V
        this.state = vDiff > 3.0 ? '1' : '0'; 
    }
}
ComponentRegistry['relay'] = Relay;
ComponentRegistry['relay_5pin'] = Relay;

// -----------------------------------------------------
// KELOMPOK TRANSISTOR (BJT & MOSFET)
// -----------------------------------------------------
class Transistor extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nB = engine.getNodeIndex(this.id, 'input', 0);
        const nC = engine.getNodeIndex(this.id, 'input', 1);
        const nE = engine.getNodeIndex(this.id, 'output', 0);
        
        const vB = nB !== -1 ? (engine.nodeVoltage[nB] || 0) : 0;
        const vC = nC !== -1 ? (engine.nodeVoltage[nC] || 0) : 0;
        const vE = nE !== -1 ? (engine.nodeVoltage[nE] || 0) : 0;

        let rCE = 1000000000;
        let rBE = 1000000000;

        if (this.type === 'bjt_npn') {
            const vBE = vB - vE;
            if (vBE > 0.6) {
                rBE = Math.max(10, 500 / (vBE - 0.6 + 0.001)); 
                rCE = Math.max(0.5, 5 / (vBE - 0.6 + 0.001));  
            }
        } else if (this.type === 'bjt_pnp') {
            const vEB = vE - vB;
            if (vEB > 0.6) {
                rBE = Math.max(10, 500 / (vEB - 0.6 + 0.001));
                rCE = Math.max(0.5, 5 / (vEB - 0.6 + 0.001));
            }
        } else if (this.type === 'mosfet_n') {
            const vGS = vB - vE;
            if (vGS > 2.5) {
                rCE = Math.max(0.01, 10 / Math.pow(vGS - 2.5 + 0.1, 2)); 
            }
        } else if (this.type === 'mosfet_p') {
            const vSG = vE - vB;
            if (vSG > 2.5) {
                rCE = Math.max(0.01, 10 / Math.pow(vSG - 2.5 + 0.1, 2));
            }
        }
        
        if (nC !== -1 && nE !== -1) {
            const condCE = 1 / rCE;
            sumVR[nC] += engine.nodeVoltage[nE] * condCE; sum1R[nC] += condCE;
            sumVR[nE] += engine.nodeVoltage[nC] * condCE; sum1R[nE] += condCE;
        }                    
        if (nB !== -1 && nE !== -1) {
            const condBE = 1 / rBE;
            sumVR[nB] += engine.nodeVoltage[nE] * condBE; sum1R[nB] += condBE;
            sumVR[nE] += engine.nodeVoltage[nB] * condBE; sum1R[nE] += condBE;
        }
    }

    applyResults(engine) {
        const nB = engine.getNodeIndex(this.id, 'input', 0);
        const nC = engine.getNodeIndex(this.id, 'input', 1);
        const nE = engine.getNodeIndex(this.id, 'output', 0);

        const vB = nB !== -1 ? engine.nodeVoltage[nB] : 0;
        const vC = nC !== -1 ? engine.nodeVoltage[nC] : 0;
        const vE = nE !== -1 ? engine.nodeVoltage[nE] : 0;

        this.simV = Math.abs(vC - vE);

        let isOn = false;
        if (this.type === 'bjt_npn') isOn = (vB - vE) > 0.6;
        else if (this.type === 'bjt_pnp') isOn = (vE - vB) > 0.6;
        else if (this.type === 'mosfet_n') isOn = (vB - vE) > 2.5;
        else if (this.type === 'mosfet_p') isOn = (vE - vB) > 2.5;

        this.state = isOn ? '1' : '0';
    }
}
ComponentRegistry['bjt_npn'] = Transistor;
ComponentRegistry['bjt_pnp'] = Transistor;
ComponentRegistry['mosfet_n'] = Transistor;
ComponentRegistry['mosfet_p'] = Transistor;

// -----------------------------------------------------
// KELOMPOK KAPASITOR (Integrasi Gear-2)
// -----------------------------------------------------
ComponentRegistry['capacitor'] = class Capacitor extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        if (this._cond === undefined || this._lastParsedValue !== this.customValue) {
            const DT = 1 / 120; 
            let cVal = 10e-6; 
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
            const rEq = (2 * DT) / (3 * cVal);
            this._rEq = rEq; 
            this._cond = 1 / rEq; 
            this._lastParsedValue = this.customValue; 
        }

        if (!this.vHistory) {
            const startV = this.chargeV || this.simV || 0;
            this.vHistory = new Float64Array([startV, startV]); 
        }
        
        const vEq = (4/3)*this.vHistory[0] - (1/3)*this.vHistory[1];
        
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        
        if (nIn !== -1 && nOut !== -1) {
            const cond = this._cond; 
            sumVR[nIn] += (engine.nodeVoltage[nOut] + vEq) * cond; sum1R[nIn] += cond;
            sumVR[nOut] += (engine.nodeVoltage[nIn] - vEq) * cond; sum1R[nOut] += cond;
        }
    }

    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        const vIn = nIn !== -1 ? engine.nodeVoltage[nIn] : 0;
        const vOut = nOut !== -1 ? engine.nodeVoltage[nOut] : 0;
        
        if (!this.vHistory) {
            const startV = this.chargeV || this.simV || 0;
            this.vHistory = new Float64Array([startV, startV]); 
        }

        const rEq = this._rEq || ((2 * (1 / 120)) / (3 * 10e-6)); 
        const vEq = (4/3)*this.vHistory[0] - (1/3)*this.vHistory[1];
        
        this.simI = (vIn - vOut - vEq) / rEq;
        const vNew = vIn - vOut; 
        
        this.vHistory[1] = this.vHistory[0]; 
        this.vHistory[0] = vNew;             
        this.simV = vNew;
        this.chargeV = vNew; 
    }
};

// -----------------------------------------------------
// KELOMPOK OP-AMP
// -----------------------------------------------------
ComponentRegistry['opamp_lm741'] = class OpAmp741 extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nInv = engine.getNodeIndex(this.id, 'input', 0);
        const nNon = engine.getNodeIndex(this.id, 'input', 1);
        const nVcc = engine.getNodeIndex(this.id, 'input', 2);
        const nVee = engine.getNodeIndex(this.id, 'input', 3);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);

        if (nOut !== -1) {
            const vInv = nInv !== -1 ? (engine.nodeVoltage[nInv] || 0) : 0;
            const vNon = nNon !== -1 ? (engine.nodeVoltage[nNon] || 0) : 0;
            const vcc = nVcc !== -1 ? (engine.nodeVoltage[nVcc] || 0) : 12.0; 
            const vee = nVee !== -1 ? (engine.nodeVoltage[nVee] || 0) : -12.0;

            const gain = 100000; 
            let targetVout = (vNon - vInv) * gain;

            const maxV = vcc - 1.0;
            const minV = vee + 1.0;
            
            if (targetVout > maxV) targetVout = maxV;
            if (targetVout < minV) targetVout = minV;

            const Gout = 0.03;
            sumVR[nOut] += targetVout * Gout;
            sum1R[nOut] += Gout;
            
            this.outVoltage = targetVout;
        }
    }
};

class BasicOpAmp extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nInPlus = engine.getNodeIndex(this.id, 'input', 0);  
        const nInMinus = engine.getNodeIndex(this.id, 'input', 1); 
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        
        const condIn = 1 / 10000000;
        if (nInMinus !== -1) sum1R[nInMinus] += condIn;
        if (nInPlus !== -1) sum1R[nInPlus] += condIn;

        if (nOut !== -1) {
            const vMinus = nInMinus !== -1 ? (engine.nodeVoltage[nInMinus] || 0) : 0;
            const vPlus = nInPlus !== -1 ? (engine.nodeVoltage[nInPlus] || 0) : 0;
            
            let vPosSupply = this.posRail !== undefined ? this.posRail : 15;
            let vNegSupply = this.negRail !== undefined ? this.negRail : -15;

            if (this.type === 'opamp_5pin') {
                const nVPlus = engine.getNodeIndex(this.id, 'input', 2);
                const nVMinus = engine.getNodeIndex(this.id, 'input', 3);
                vPosSupply = nVPlus !== -1 ? (engine.nodeVoltage[nVPlus] || 0) : 0; 
                vNegSupply = nVMinus !== -1 ? (engine.nodeVoltage[nVMinus] || 0) : 0; 
            }

            let currentVout = engine.nodeVoltage[nOut] || 0;
            let diff = vPlus - vMinus;
            let vOutTarget = currentVout + (diff * 1.5); 
            
            if (vOutTarget > vPosSupply) vOutTarget = vPosSupply;
            if (vOutTarget < vNegSupply) vOutTarget = vNegSupply;
            
            const condOut = 1 / 10;
            sumVR[nOut] += vOutTarget * condOut;
            sum1R[nOut] += condOut;
        }
    }

    applyResults(engine) {
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        this.simV = nOut !== -1 ? engine.nodeVoltage[nOut] : 0;
        this.outputState = this.simV > 0 ? 1 : 0;
    }
}
ComponentRegistry['opamp'] = BasicOpAmp;
ComponentRegistry['opamp_5pin'] = BasicOpAmp;

// -----------------------------------------------------
// KELOMPOK DIODA & LED (Newton-Raphson)
// -----------------------------------------------------
class DiodeComponent extends BaseComponent {
    _initPhysics(engine) {
        if (this.vd === undefined || isNaN(this.vd)) this.vd = 0;
        const targetVf = this.type === 'led' ? (parseFloat(this.forwardV) || 2.2) : 0.7;
        const targetI = this.type === 'led' ? ((parseFloat(this.fullDriveI) || 10) / 1000) : 0.02; 
        
        if (this._lastVf !== targetVf || this._lastTargetI !== targetI) {
            this.Is = 1e-14; 
            this.n = targetVf / (engine.DiodePhysics.VT * Math.log(targetI / this.Is));
            this.Rs = 2.0; 
            this._lastVf = targetVf;
            this._lastTargetI = targetI;
        }
    }

    injectMatrix(engine, sumVR, sum1R, iter) {
        if (iter === 0) this._initPhysics(engine);

        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        
        if (nIn !== -1 && nOut !== -1) {
            const vDiff = (engine.nodeVoltage[nIn] || 0) - (engine.nodeVoltage[nOut] || 0);
            this.vd = engine.DiodePhysics.limitVoltageStep(vDiff, this.vd);

            const bV = this.type === 'led' ? (parseFloat(this.breakdownV) || 4.0) : 50.0;
            let Geff = 0, Ieff = 0;

            if (this.vd < -bV) {
                Geff = 1 / 10; 
                Ieff = Geff * bV; 
            } else {
                const lin = engine.DiodePhysics.linearize(this.vd, this.Is, this.n);
                const denom = 1 + (lin.Geq * this.Rs);
                Geff = lin.Geq / denom;
                Ieff = lin.Ieq / denom;
            }

            sumVR[nIn] += (engine.nodeVoltage[nOut] * Geff) - Ieff; sum1R[nIn] += Geff;
            sumVR[nOut] += (engine.nodeVoltage[nIn] * Geff) + Ieff; sum1R[nOut] += Geff;
        }
    }

    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        const vDiff = (nIn !== -1 ? engine.nodeVoltage[nIn] : 0) - (nOut !== -1 ? engine.nodeVoltage[nOut] : 0);
        
        this.simV = vDiff; 
        
        if (this.vd !== undefined && this.n !== undefined) {
            const lin = engine.DiodePhysics.linearize(this.vd, this.Is, this.n);
            this.simI = lin.Id; 
        } else {
            this.simI = 0;
        }
        
        if (this.type === 'led') {
            const fullDriveI_Ampere = (parseFloat(this.fullDriveI) || 10) / 1000;
            const maxPeakI = fullDriveI_Ampere * 5; 
            
            if (this.simI > maxPeakI) {
                this.isOvercurrent = true; 
                this.simI = 0; 
                if (!this.hasWarned && typeof UIManager !== 'undefined') {
                    UIManager.showToast(`⚠️ Peringatan: Forward current melebihi batas maksimum untuk LED L${this.id}`, 4000);
                    this.hasWarned = true;
                }
            } else if (this.simI > 0.000001 && this.simI <= maxPeakI) {
                this.isOvercurrent = false;
                this.hasWarned = false;
            } else if (this.isOvercurrent) {
                this.simI = 0; 
            }
        }
    }
}
ComponentRegistry['diode'] = DiodeComponent;
ComponentRegistry['led'] = DiodeComponent;

ComponentRegistry['seven_segment'] = class SevenSegment extends BaseComponent {
    _initPhysics(engine) {
        if (!this.vd || this.vd.length !== 7) this.vd = [0,0,0,0,0,0,0];
        const targetVf = 2.2; 
        const targetI = 0.02; 
        if (this._lastVf !== targetVf) {
            this.Is = 1e-14; 
            this.n = targetVf / (engine.DiodePhysics.VT * Math.log(targetI / this.Is));
            this.Rs = 2.0; 
            this._lastVf = targetVf;
        }
    }

    injectMatrix(engine, sumVR, sum1R, iter) {
        if (iter === 0) this._initPhysics(engine);
        const nOut = engine.getNodeIndex(this.id, 'output', 0); 
        
        for (let k = 0; k < 7; k++) { 
            const nIn = engine.getNodeIndex(this.id, 'input', k); 
            if (nIn !== -1 && nOut !== -1) {
                const vDiff = (engine.nodeVoltage[nIn] || 0) - (engine.nodeVoltage[nOut] || 0);
                this.vd[k] = engine.DiodePhysics.limitVoltageStep(vDiff, this.vd[k]);

                let Geff = 0, Ieff = 0;
                if (this.vd[k] < -5.0) { 
                    Geff = 1 / 10; Ieff = Geff * 5.0; 
                } else {
                    const lin = engine.DiodePhysics.linearize(this.vd[k], this.Is, this.n);
                    const denom = 1 + (lin.Geq * this.Rs);
                    Geff = lin.Geq / denom; Ieff = lin.Ieq / denom;
                }
                sumVR[nIn] += (engine.nodeVoltage[nOut] * Geff) - Ieff; sum1R[nIn] += Geff;
                sumVR[nOut] += (engine.nodeVoltage[nIn] * Geff) + Ieff; sum1R[nOut] += Geff;
            }
        }
    }

    applyResults(engine) {
        if (!this.simI_segs) this.simI_segs = [0,0,0,0,0,0,0];
        for (let k = 0; k < 7; k++) {
            if (this.vd && this.vd[k] !== undefined && this.n !== undefined) {
                const lin = engine.DiodePhysics.linearize(this.vd[k], this.Is, this.n);
                this.simI_segs[k] = lin.Id;
            } else {
                this.simI_segs[k] = 0;
            }
        }
    }
};

ComponentRegistry['led_bargraph'] = class LedBargraph extends BaseComponent {
    _initPhysics(engine) {
        if (!this.vd || this.vd.length !== 10) this.vd = new Array(10).fill(0);
        if (!this.simI_segs) this.simI_segs = new Array(10).fill(0);
        const targetVf = 2.2; 
        const targetI = 0.02; 
        if (this._lastVf !== targetVf) {
            this.Is = 1e-14; 
            this.n = targetVf / (engine.DiodePhysics.VT * Math.log(targetI / this.Is));
            this.Rs = 2.0; 
            this._lastVf = targetVf;
        }
    }

    injectMatrix(engine, sumVR, sum1R, iter) {
        if (iter === 0) this._initPhysics(engine);
        const nAnode = engine.getNodeIndex(this.id, 'input', 10); 
        if (nAnode !== -1) {
            for (let k = 0; k < 10; k++) { 
                const nCathode = engine.getNodeIndex(this.id, 'input', k); 
                if (nCathode !== -1) {
                    const vDiff = (engine.nodeVoltage[nAnode] || 0) - (engine.nodeVoltage[nCathode] || 0);
                    this.vd[k] = engine.DiodePhysics.limitVoltageStep(vDiff, this.vd[k]);

                    let Geff = 0, Ieff = 0;
                    if (this.vd[k] < -5.0) { 
                        Geff = 1 / 10; Ieff = Geff * 5.0; 
                    } else {
                        const lin = engine.DiodePhysics.linearize(this.vd[k], this.Is, this.n);
                        const denom = 1 + (lin.Geq * this.Rs);
                        Geff = lin.Geq / denom; Ieff = lin.Ieq / denom;
                    }
                    sumVR[nAnode] += (engine.nodeVoltage[nCathode] * Geff) - Ieff; sum1R[nAnode] += Geff;
                    sumVR[nCathode] += (engine.nodeVoltage[nAnode] * Geff) + Ieff; sum1R[nCathode] += Geff;
                }
            }
        }
    }

    applyResults(engine) {
        if (!this.simI_segs) this.simI_segs = new Array(10).fill(0);
        for (let k = 0; k < 10; k++) {
            if (this.vd && this.vd[k] !== undefined && this.n !== undefined) {
                const lin = engine.DiodePhysics.linearize(this.vd[k], this.Is, this.n);
                this.simI_segs[k] = lin.Id; 
            } else {
                this.simI_segs[k] = 0;
            }
        }
    }
};

// -----------------------------------------------------
// KELOMPOK IC ANALOG / CAMPURAN (555 Timer & LM3914)
// -----------------------------------------------------
ComponentRegistry['ic_555'] = class IC555 extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R, iter) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0); // GND (Pin 1)
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1); // TRIG (Pin 2)
        const nIn2 = engine.getNodeIndex(this.id, 'input', 2); // RESET (Pin 4)
        const nIn3 = engine.getNodeIndex(this.id, 'input', 3); // CTRL (Pin 5)
        const nIn4 = engine.getNodeIndex(this.id, 'input', 4); // THR (Pin 6)
        const nIn5 = engine.getNodeIndex(this.id, 'input', 5); // VCC (Pin 8)
        const nOut0 = engine.getNodeIndex(this.id, 'output', 0); // OUT (Pin 3)
        const nOut1 = engine.getNodeIndex(this.id, 'output', 1); // DISCH (Pin 7)

        const vGnd = nIn0 !== -1 ? (engine.nodeVoltage[nIn0] || 0) : 0;
        const vVcc = nIn5 !== -1 ? (engine.nodeVoltage[nIn5] || 0) : 0;
        
        // 1. PENCEGAH FLOATING PINS
        const condFloat = 1 / 10000000; 
        if (nIn1 !== -1 && nIn0 !== -1) { sumVR[nIn1] += vGnd * condFloat; sum1R[nIn1] += condFloat; }
        if (nIn2 !== -1 && nIn5 !== -1) { sumVR[nIn2] += vVcc * condFloat; sum1R[nIn2] += condFloat; }
        if (nIn4 !== -1 && nIn0 !== -1) { sumVR[nIn4] += vGnd * condFloat; sum1R[nIn4] += condFloat; }

        // 2. VOLTAGE DIVIDER INTERNAL (3x 5k Ohm)
        if (nIn5 !== -1 && nIn3 !== -1) {
            const cond5k = 1 / 5000; 
            sumVR[nIn5] += engine.nodeVoltage[nIn3] * cond5k; sum1R[nIn5] += cond5k;
            sumVR[nIn3] += engine.nodeVoltage[nIn5] * cond5k; sum1R[nIn3] += cond5k;
        }
        if (nIn3 !== -1 && nIn0 !== -1) {
            const cond10k = 1 / 10000; 
            sumVR[nIn3] += engine.nodeVoltage[nIn0] * cond10k; sum1R[nIn3] += cond10k;
            sumVR[nIn0] += engine.nodeVoltage[nIn3] * cond10k; sum1R[nIn0] += cond10k;
        }

        // 3. LOGIKA MEMORI (SR LATCH) - Dieksekusi di iterasi pertama saja
        if (typeof this.internalState === 'undefined') this.internalState = 0;
        
        if (iter === 0) {
            const vTrig = nIn1 !== -1 ? (engine.nodeVoltage[nIn1] || 0) : vVcc;
            const vThr = nIn4 !== -1 ? (engine.nodeVoltage[nIn4] || 0) : 0;
            const vRst = nIn2 !== -1 ? (engine.nodeVoltage[nIn2] || 0) : vVcc; 
            
            const vCtrl = nIn3 !== -1 ? (engine.nodeVoltage[nIn3] || 0) : (vGnd + (vVcc - vGnd) * 0.666);
            const vUpper = vCtrl;
            const vLower = vGnd + (vCtrl - vGnd) / 2;

            if (vRst - vGnd < 0.7) {
                this.internalState = 0;
            } else if (vTrig - vGnd <= vLower - vGnd) {
                this.internalState = 1;
            } else if (vThr - vGnd >= vUpper - vGnd) {
                this.internalState = 0;
            }
        }
        this.outputState = this.internalState;

        // 4. OUTPUT CURRENT LIMIT & DISCHARGE PIN
        if (nOut0 !== -1) {
            const rOut = 15; 
            const condOut = 1 / rOut;
            const targetV = this.internalState === 1 ? vVcc : vGnd;
            
            sumVR[nOut0] += targetV * condOut;
            sum1R[nOut0] += condOut;
            
            if (this.internalState === 1 && nIn5 !== -1) {
                sumVR[nIn5] += engine.nodeVoltage[nOut0] * condOut; sum1R[nIn5] += condOut;
            } else if (this.internalState === 0 && nIn0 !== -1) {
                sumVR[nIn0] += engine.nodeVoltage[nOut0] * condOut; sum1R[nIn0] += condOut;
            }
        }

        if (nOut1 !== -1 && nIn0 !== -1) {
            const rDisch = this.internalState === 0 ? 15 : 1000000000; 
            const condDisch = 1 / rDisch;
            sumVR[nOut1] += engine.nodeVoltage[nIn0] * condDisch; sum1R[nOut1] += condDisch;
            sumVR[nIn0] += engine.nodeVoltage[nOut1] * condDisch; sum1R[nIn0] += condDisch;
        }
    }

    applyResults(engine) {
        if (!this.inputStates) this.inputStates = [0,0,0,0,0,0];
        
        for (let i = 0; i <= 5; i++) {
            const nIn = engine.getNodeIndex(this.id, 'input', i);
            this.inputStates[i] = nIn !== -1 ? engine.nodeVoltage[nIn] : 0;
        }

        const vGnd = this.inputStates[0];
        const vVcc = this.inputStates[5];
        this.simV_vcc = Math.abs(vVcc - vGnd);
    }
};

ComponentRegistry['ic_lm3914'] = class ICLM3914 extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nSig = engine.getNodeIndex(this.id, 'input', 0);
        const nRhi = engine.getNodeIndex(this.id, 'input', 1);
        const nRlo = engine.getNodeIndex(this.id, 'input', 2);
        const nRefO = engine.getNodeIndex(this.id, 'input', 3); 
        const nRefA = engine.getNodeIndex(this.id, 'input', 4); 
        const nMod = engine.getNodeIndex(this.id, 'input', 5);
        const nVcc = engine.getNodeIndex(this.id, 'input', 6); 
        const nGnd = engine.getNodeIndex(this.id, 'input', 7); 

        const vSig = nSig !== -1 ? (engine.nodeVoltage[nSig] || 0) : 0;
        const vRhi = nRhi !== -1 ? (engine.nodeVoltage[nRhi] || 0) : 0;
        const vRlo = nRlo !== -1 ? (engine.nodeVoltage[nRlo] || 0) : 0;
        const vMod = nMod !== -1 ? (engine.nodeVoltage[nMod] || 0) : 0;
        const vGnd = nGnd !== -1 ? (engine.nodeVoltage[nGnd] || 0) : 0;

        // 1. REGULATOR INTERNAL (1.25V)
        if (nRefO !== -1) {
            const vRefA = nRefA !== -1 ? (engine.nodeVoltage[nRefA] || 0) : 0;
            const condRef = 1 / 10; 
            sumVR[nRefO] += (vRefA + 1.25) * condRef; sum1R[nRefO] += condRef;
            
            if (nRefA !== -1) {
                sumVR[nRefA] += (engine.nodeVoltage[nRefO] - 1.25) * condRef; 
                sum1R[nRefA] += condRef;
            }
        }

        // 2. RESISTOR PEMBAGI INTERNAL (10k)
        if (nRhi !== -1 && nRlo !== -1) {
            const condDivider = 1 / 10000;
            sumVR[nRhi] += engine.nodeVoltage[nRlo] * condDivider; sum1R[nRhi] += condDivider;
            sumVR[nRlo] += engine.nodeVoltage[nRhi] * condDivider; sum1R[nRlo] += condDivider;
        }

        // 3. KOMPARATOR LOGIKA
        const refRange = vRhi - vRlo;
        const stepV = refRange / 10;
        let activeLevels = 0;

        if (stepV > 0.001) { 
            for (let lvl = 1; lvl <= 10; lvl++) {
                let threshold = vRlo + (lvl * stepV);
                if (vSig >= threshold - 0.01) activeLevels = lvl;
            }
        }

        const isBarMode = (vMod - vGnd) > 2.5;
        if (!this.outStates) this.outStates = new Array(10).fill(false);

        // 4. OUTPUT SINKING CURRENT (Active LOW)
        for (let j = 0; j < 10; j++) {
            let nOut = engine.getNodeIndex(this.id, 'output', j); 
            let lvl = j + 1;
            
            let isLedOn = isBarMode ? (lvl <= activeLevels) : (lvl === activeLevels && activeLevels > 0);
            this.outStates[j] = isLedOn;

            if (nOut !== -1) {
                const rOut = isLedOn ? 20 : 1000000000;
                const condOut = 1 / rOut;
                
                sumVR[nOut] += vGnd * condOut; sum1R[nOut] += condOut;
                
                if (nGnd !== -1) {
                    sumVR[nGnd] += engine.nodeVoltage[nOut] * condOut;
                    sum1R[nGnd] += condOut;
                }
            }
        }
    }
};

// -----------------------------------------------------
// KELOMPOK IC DIGITAL (Counter & Decoder)
// -----------------------------------------------------
ComponentRegistry['ic_4017'] = class IC4017 extends BaseComponent {
    applyFixedVoltage(engine, fixedNodes) {
        const nVcc = engine.getNodeIndex(this.id, 'input', 3);
        const nGnd = engine.getNodeIndex(this.id, 'input', 4);
        const vcc = nVcc !== -1 ? (engine.nodeVoltage[nVcc] || 0) : 0;
        const gnd = nGnd !== -1 ? (engine.nodeVoltage[nGnd] || 0) : 0;
        
        // Menyala jika selisih daya > 2.5V
        const isPowered = (vcc - gnd) > 2.5;

        // Terapkan voltase ke 11 pin output (Q0-Q9 & CO)
        for (let j = 0; j < 11; j++) {
            const nOut = engine.getNodeIndex(this.id, 'output', j);
            if (nOut !== -1) {
                const state = (this.outputStates && this.outputStates[j] === 1) ? 1 : 0;
                engine.nodeVoltage[nOut] = (isPowered && state === 1) ? vcc : gnd;
                fixedNodes[nOut] = true; 
            }
        }
    }

    injectMatrix(engine, sumVR, sum1R) {
        // Perlindungan kaki input yang mengambang (Floating Pin Protection)
        const nGnd = engine.getNodeIndex(this.id, 'input', 4);
        const condFloat = 1 / 10000000; // Resistor parasitik 10 MOhm
        
        for (let j = 0; j < 3; j++) { // Berlaku untuk CLK, ENA, RST
            const nIn = engine.getNodeIndex(this.id, 'input', j);
            if (nIn !== -1 && nGnd !== -1) {
                sumVR[nIn] += engine.nodeVoltage[nGnd] * condFloat; sum1R[nIn] += condFloat;
                sumVR[nGnd] += engine.nodeVoltage[nIn] * condFloat; sum1R[nGnd] += condFloat;
            }
        }
    }

    applyResults(engine) {
        const nVcc = engine.getNodeIndex(this.id, 'input', 3);
        const nGnd = engine.getNodeIndex(this.id, 'input', 4);
        const vcc = nVcc !== -1 ? engine.nodeVoltage[nVcc] : 0;
        const gnd = nGnd !== -1 ? engine.nodeVoltage[nGnd] : 0;
        this.simV_vcc = Math.abs(vcc - gnd);

        if (!this.inputStates) this.inputStates = [0,0,0,0,0];
        for (let j = 0; j < 5; j++) {
            const nIn = engine.getNodeIndex(this.id, 'input', j);
            this.inputStates[j] = nIn !== -1 ? engine.nodeVoltage[nIn] : 0;
        }
    }
};

ComponentRegistry['ic_4518'] = class IC4518 extends BaseComponent {
    applyFixedVoltage(engine, fixedNodes, iter) {
        const nInClk = engine.getNodeIndex(this.id, 'input', 0);
        const nInEn  = engine.getNodeIndex(this.id, 'input', 1);
        const nInRst = engine.getNodeIndex(this.id, 'input', 2);

        const vClk = nInClk !== -1 ? (engine.nodeVoltage[nInClk] || 0) : 0;
        const vEn  = nInEn !== -1 ? (engine.nodeVoltage[nInEn] || 0) : 0; 
        const vRst = nInRst !== -1 ? (engine.nodeVoltage[nInRst] || 0) : 0;

        const clkState = vClk > 2.5;
        const rstState = vRst > 2.5;
        const enState  = nInEn !== -1 ? vEn > 2.5 : true; 

        if (this.count === undefined) this.count = 0;
        if (this.lastClk === undefined) this.lastClk = false;

        // Hanya hitung detak di tebakan pertama agar tidak melompat 300x!
        if (iter === 0) {
            if (rstState) {
                this.count = 0; 
            } else if (clkState && !this.lastClk && enState) {
                this.count++;
                if (this.count > 9) this.count = 0; 
            }
            this.lastClk = clkState; 

            this.outStates = [
                (this.count & 1) !== 0,
                (this.count & 2) !== 0,
                (this.count & 4) !== 0,
                (this.count & 8) !== 0
            ];
        }

        for (let i = 0; i < 4; i++) {
            const nOut = engine.getNodeIndex(this.id, 'output', i);
            if (nOut !== -1) {
                engine.nodeVoltage[nOut] = this.outStates[i] ? 5.0 : 0.0;
                fixedNodes[nOut] = true;
            }
        }
    }
    
    injectMatrix(engine, sumVR, sum1R) {
        // Floating Pin Protection (Mencegah NaN)
        const condFloat = 1 / 10000000;
        for (let i = 0; i < this.inputs; i++) {
            const nIn = engine.getNodeIndex(this.id, 'input', i);
            if (nIn !== -1) { sumVR[nIn] += 0 * condFloat; sum1R[nIn] += condFloat; }
        }
    }
};

ComponentRegistry['ic_4511'] = class IC4511 extends BaseComponent {
    applyFixedVoltage(engine, fixedNodes, iter) {
        const nInA = engine.getNodeIndex(this.id, 'input', 0); 
        const nInB = engine.getNodeIndex(this.id, 'input', 1); 
        const nInC = engine.getNodeIndex(this.id, 'input', 2); 
        const nInD = engine.getNodeIndex(this.id, 'input', 3); 
        const nInLT = engine.getNodeIndex(this.id, 'input', 4); 
        const nInBI = engine.getNodeIndex(this.id, 'input', 5); 
        const nInLE = engine.getNodeIndex(this.id, 'input', 6); 

        const vA = nInA !== -1 ? (engine.nodeVoltage[nInA] || 0) : 0;
        const vB = nInB !== -1 ? (engine.nodeVoltage[nInB] || 0) : 0;
        const vC = nInC !== -1 ? (engine.nodeVoltage[nInC] || 0) : 0;
        const vD = nInD !== -1 ? (engine.nodeVoltage[nInD] || 0) : 0;
        const vLT = nInLT !== -1 ? (engine.nodeVoltage[nInLT] || 0) : 5.0; 
        const vBI = nInBI !== -1 ? (engine.nodeVoltage[nInBI] || 0) : 5.0; 
        const vLE = nInLE !== -1 ? (engine.nodeVoltage[nInLE] || 0) : 0; 

        const bitA = vA > 2.5 ? 1 : 0;
        const bitB = vB > 2.5 ? 2 : 0;
        const bitC = vC > 2.5 ? 4 : 0;
        const bitD = vD > 2.5 ? 8 : 0;
        
        const isLT = vLT < 2.5; 
        const isBI = vBI < 2.5; 
        const isLE = vLE > 2.5; 

        if (this.latchedVal === undefined) this.latchedVal = 0;

        if (iter === 0) {
            if (!isLE) this.latchedVal = bitA + bitB + bitC + bitD;

            const segmentMap = [
                [1,1,1,1,1,1,0], [0,1,1,0,0,0,0], [1,1,0,1,1,0,1], [1,1,1,1,0,0,1],
                [0,1,1,0,0,1,1], [1,0,1,1,0,1,1], [1,0,1,1,1,1,1], [1,1,1,0,0,0,0],
                [1,1,1,1,1,1,1], [1,1,1,1,0,1,1] 
            ];

            let outSegments = [0,0,0,0,0,0,0];
            if (isLT) {
                outSegments = [1,1,1,1,1,1,1]; 
            } else if (isBI) {
                outSegments = [0,0,0,0,0,0,0]; 
            } else {
                if (this.latchedVal <= 9) outSegments = segmentMap[this.latchedVal];
            }
            this.outStates = outSegments;
        }

        for (let i = 0; i < 7; i++) {
            const nOut = engine.getNodeIndex(this.id, 'output', i);
            if (nOut !== -1) {
                engine.nodeVoltage[nOut] = this.outStates[i] === 1 ? 5.0 : 0.0;
                fixedNodes[nOut] = true;
            }
        }
    }
    
    injectMatrix(engine, sumVR, sum1R) {
        const condFloat = 1 / 10000000;
        for (let i = 0; i < this.inputs; i++) {
            const nIn = engine.getNodeIndex(this.id, 'input', i);
            if (nIn !== -1) { sumVR[nIn] += 0 * condFloat; sum1R[nIn] += condFloat; }
        }
    }
};

ComponentRegistry['ic_4026'] = class IC4026 extends BaseComponent {
    applyFixedVoltage(engine, fixedNodes, iter) {
        const nInClk = engine.getNodeIndex(this.id, 'input', 0);
        const nInInh = engine.getNodeIndex(this.id, 'input', 1);
        const nInRst = engine.getNodeIndex(this.id, 'input', 2);
        const nInDei = engine.getNodeIndex(this.id, 'input', 3);

        const vClk = nInClk !== -1 ? (engine.nodeVoltage[nInClk] || 0) : 0;
        const vInh = nInInh !== -1 ? (engine.nodeVoltage[nInInh] || 0) : 0;
        const vRst = nInRst !== -1 ? (engine.nodeVoltage[nInRst] || 0) : 0;
        const vDei = nInDei !== -1 ? (engine.nodeVoltage[nInDei] || 0) : 5.0;

        const clkState = vClk > 2.5;
        const inhState = vInh > 2.5;
        const rstState = vRst > 2.5;
        const deiState = vDei > 2.5;

        if (this.count === undefined) this.count = 0;
        if (this.lastClk === undefined) this.lastClk = false;

        if (iter === 0) {
            if (rstState) {
                this.count = 0; 
            } else if (clkState && !this.lastClk && !inhState) {
                this.count++;
                if (this.count > 9) this.count = 0; 
            }
            this.lastClk = clkState;

            const segmentMap = [
                [1,1,1,1,1,1,0], [0,1,1,0,0,0,0], [1,1,0,1,1,0,1], [1,1,1,1,0,0,1],
                [0,1,1,0,0,1,1], [1,0,1,1,0,1,1], [1,0,1,1,1,1,1], [1,1,1,0,0,0,0],
                [1,1,1,1,1,1,1], [1,1,1,1,0,1,1] 
            ];

            let outSegments = [0,0,0,0,0,0,0];
            if (deiState) outSegments = segmentMap[this.count];

            const coState = this.count < 5 ? 1 : 0;
            const deoState = deiState ? 1 : 0;
            const ucsState = segmentMap[this.count][2]; 
            
            this.outStates = [...outSegments, coState, deoState, ucsState];
        }

        for (let i = 0; i < 10; i++) {
            const nOut = engine.getNodeIndex(this.id, 'output', i);
            if (nOut !== -1) {
                engine.nodeVoltage[nOut] = this.outStates[i] ? 5.0 : 0.0;
                fixedNodes[nOut] = true;
            }
        }
    }
    
    injectMatrix(engine, sumVR, sum1R) {
        const condFloat = 1 / 10000000;
        for (let i = 0; i < this.inputs; i++) {
            const nIn = engine.getNodeIndex(this.id, 'input', i);
            if (nIn !== -1) { sumVR[nIn] += 0 * condFloat; sum1R[nIn] += condFloat; }
        }
    }
};

// -----------------------------------------------------
// KELOMPOK GERBANG LOGIKA & FLIP-FLOP
// -----------------------------------------------------
class LogicGate extends BaseComponent {
    solveDigital(engine) {
        const in0 = this.inputStates[0] === 1 ? 1 : 0;
        const in1 = this.inputStates[1] === 1 ? 1 : 0;
        
        switch (this.type) {
            case 'and': this.outputState = (in0 === 1 && in1 === 1) ? 1 : 0; break;
            case 'or':  this.outputState = (in0 === 1 || in1 === 1) ? 1 : 0; break;
            case 'not': this.outputState = (in0 === 0) ? 1 : 0; break;
            case 'nand': this.outputState = (in0 === 1 && in1 === 1) ? 0 : 1; break;
            case 'nor':  this.outputState = (in0 === 1 || in1 === 1) ? 0 : 1; break;
            case 'xor':  this.outputState = (in0 !== in1) ? 1 : 0; break;
            case 'xnor': this.outputState = (in0 === in1) ? 1 : 0; break;
        }
    }

    applyFixedVoltage(engine, fixedNodes) {
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        if (nOut !== -1) {
            engine.nodeVoltage[nOut] = this.outputState === 1 ? 5 : 0;
            fixedNodes[nOut] = true;
        }
    }

    injectMatrix(engine, sumVR, sum1R) {
        const condFloat = 1 / 10000000; // Tarikan ke Ground agar tidak mengambang
        for (let i = 0; i < (this.inputs || 0); i++) {
            const nIn = engine.getNodeIndex(this.id, 'input', i);
            if (nIn !== -1) { sumVR[nIn] += 0 * condFloat; sum1R[nIn] += condFloat; }
        }
    }
}
['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'].forEach(t => ComponentRegistry[t] = LogicGate);

class FlipFlop extends BaseComponent {
    solveDigital(engine, iter) {
        let clkIdx = (this.type === 'ff_d' || this.type === 'ff_t') ? 1 : 2;
        let isRisingEdge = false;
        
        if (this.prevClock === undefined) this.prevClock = 0;
        if (this.prevClock === 0 && this.inputStates[clkIdx] === 1) isRisingEdge = true;
        if (iter === 4) this.prevClock = this.inputStates[clkIdx]; 

        const in0 = this.inputStates[0] === 1 ? 1 : 0;
        const in1 = this.inputStates[1] === 1 ? 1 : 0;
        const in2 = this.inputStates[2] === 1 ? 1 : 0;
        const in3 = this.inputStates[3] === 1 ? 1 : 0;
        const in4 = this.inputStates[4] === 1 ? 1 : 0;

        if (this.outputState === undefined) this.outputState = 0;

        if (this.type === 'ff_d') {
            if (in2 === 1) this.outputState = 1;      
            else if (in3 === 1) this.outputState = 0; 
            else if (isRisingEdge) this.outputState = in0; 
        } else if (this.type === 'ff_t') {
            if (isRisingEdge && in0 === 1) this.outputState = this.outputState === 1 ? 0 : 1; 
        } else if (this.type === 'ff_jk') {
            if (in3 === 1) this.outputState = 1;      
            else if (in4 === 1) this.outputState = 0; 
            else if (isRisingEdge) {
                if (in0 === 1 && in1 === 0) this.outputState = 1;
                else if (in0 === 0 && in1 === 1) this.outputState = 0;
                else if (in0 === 1 && in1 === 1) this.outputState = this.outputState === 1 ? 0 : 1;
            }
        } else if (this.type === 'ff_sr') {
            if (isRisingEdge) {
                if (in0 === 1 && in1 === 0) this.outputState = 1;
                else if (in0 === 0 && in1 === 1) this.outputState = 0;
            }
        }
    }

    applyFixedVoltage(engine, fixedNodes) {
        const nOut0 = engine.getNodeIndex(this.id, 'output', 0);
        const nOut1 = engine.getNodeIndex(this.id, 'output', 1);
        if (nOut0 !== -1) { engine.nodeVoltage[nOut0] = this.outputState === 1 ? 5 : 0; fixedNodes[nOut0] = true; }
        if (nOut1 !== -1) { engine.nodeVoltage[nOut1] = this.outputState === 1 ? 0 : 5; fixedNodes[nOut1] = true; }
    }

    injectMatrix(engine, sumVR, sum1R) {
        const condFloat = 1 / 10000000; 
        for (let i = 0; i < (this.inputs || 0); i++) {
            const nIn = engine.getNodeIndex(this.id, 'input', i);
            if (nIn !== -1) { sumVR[nIn] += 0 * condFloat; sum1R[nIn] += condFloat; }
        }
    }
}
['ff_sr', 'ff_d', 'ff_jk', 'ff_t'].forEach(t => ComponentRegistry[t] = FlipFlop);

// -----------------------------------------------------
// KOMPONEN LAIN-LAIN (Osiloskop, Flasher, Pembagi, dll)
// -----------------------------------------------------
ComponentRegistry['oscilloscope'] = class Oscilloscope extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        const condProbe = 1 / 10000000; 
        if (nIn0 !== -1) { sumVR[nIn0] += 0 * condProbe; sum1R[nIn0] += condProbe; }
        if (nIn1 !== -1) { sumVR[nIn1] += 0 * condProbe; sum1R[nIn1] += condProbe; }
    }
    applyResults(engine) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        this.simV = nIn0 !== -1 ? engine.nodeVoltage[nIn0] : 0;
        this.simV2 = nIn1 !== -1 ? engine.nodeVoltage[nIn1] : 0;
    }
};

ComponentRegistry['flasher'] = class Flasher extends BaseComponent {
    onTimeUpdate(dt, now) {
        const period = this.customValue || 500;
        if (now - (this._lastToggle || 0) >= period) {
            this.state = this.state === '1' ? '0' : '1';
            this._lastToggle = now;
        }
    }
    injectMatrix(engine, sumVR, sum1R) {
        const r = this.state === '1' ? 0.1 : 1000000000;                    
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        if (nIn !== -1 && nOut !== -1) {
            const cond = 1 / r;
            sumVR[nIn] += engine.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
            sumVR[nOut] += engine.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
        }
    }
};

ComponentRegistry['voltage_divider'] = class VoltageDivider extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        const r1 = this.r1Value !== undefined ? this.r1Value : 10000; 
        const r2 = this.r2Value !== undefined ? this.r2Value : 10000;
        
        if (nIn !== -1 && nOut !== -1) {
            const cond1 = 1 / r1; 
            sumVR[nIn] += engine.nodeVoltage[nOut] * cond1; sum1R[nIn] += cond1;
            sumVR[nOut] += engine.nodeVoltage[nIn] * cond1; sum1R[nOut] += cond1;
            const cond2 = 1 / r2; 
            sumVR[nOut] += 0 * cond2; sum1R[nOut] += cond2;
        } else if (nIn !== -1 && nOut === -1) {
            const condTotal = 1 / (r1 + r2);
            sumVR[nIn] += 0 * condTotal; sum1R[nIn] += condTotal;
        }
    }
    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        let vIn = nIn !== -1 ? engine.nodeVoltage[nIn] : 0;
        let vOut = nOut !== -1 ? engine.nodeVoltage[nOut] : 0;
        const r1 = this.r1Value !== undefined ? this.r1Value : 10000;
        const r2 = this.r2Value !== undefined ? this.r2Value : 10000;

        if (nOut === -1 && nIn !== -1) vOut = vIn * (r2 / (r1 + r2));
        this.simV = vOut; 
        this.v1 = Math.abs(vIn - vOut);
        this.v2 = Math.abs(vOut);
    }
};

ComponentRegistry['logic_probe'] = class LogicProbe extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        if (nIn !== -1) {
            const condFloat = 1 / 10000000; 
            sumVR[nIn] += 0 * condFloat; sum1R[nIn] += condFloat;
        }
    }
    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        if (nIn !== -1) {
            const v = engine.nodeVoltage[nIn];
            if (v > 2.5) this.logicState = '1';
            else if (v < 0.8) this.logicState = '0';
            else this.logicState = 'Z';
        } else {
            this.logicState = 'Z';
        }
    }
};

ComponentRegistry['output_terminal'] = class OutputTerminal extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        if (nIn !== -1) {
            const cond = 1 / 10000000; 
            sumVR[nIn] += 0 * cond; sum1R[nIn] += cond;
        }
    }
    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        this.simV = nIn !== -1 ? engine.nodeVoltage[nIn] : 0;
    }
};

// Pastikan Ohmmeter, Solenoid, dan Servo terdaftar dengan aman
ComponentRegistry['ohmmeter'] = class Ohmmeter extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        if (nIn0 !== -1 && nIn1 !== -1) {
            const condInt = 1 / 3000;
            sumVR[nIn0] += 0.001; sumVR[nIn1] -= 0.001;
            sumVR[nIn0] += engine.nodeVoltage[nIn1] * condInt; sum1R[nIn0] += condInt;
            sumVR[nIn1] += engine.nodeVoltage[nIn0] * condInt; sum1R[nIn1] += condInt;
        }
    }
    applyResults(engine) {
        const nIn0 = engine.getNodeIndex(this.id, 'input', 0);
        const nIn1 = engine.getNodeIndex(this.id, 'input', 1);
        const vDiff = (nIn0 !== -1 ? engine.nodeVoltage[nIn0] : 0) - (nIn1 !== -1 ? engine.nodeVoltage[nIn1] : 0);
        const iOut = 0.001 - (vDiff / 3000);
        this.isError = false; this.isOL = false; this.simR = 0;
        if (nIn0 === -1 || nIn1 === -1) this.isOL = true;
        else if (iOut < -0.0001 || vDiff < -0.1 || vDiff > 3.1) this.isError = true;
        else if (iOut < 0.000001) this.isOL = true;
        else { this.simR = vDiff / iOut; if (this.simR > 3000000) this.isOL = true; }
    }
};

ComponentRegistry['solenoid'] = class Solenoid extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        if (nIn !== -1 && nOut !== -1) {
            const cond = 1 / 100;
            sumVR[nIn] += engine.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
            sumVR[nOut] += engine.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
        }
    }
    applyResults(engine) {
        const nIn = engine.getNodeIndex(this.id, 'input', 0);
        const nOut = engine.getNodeIndex(this.id, 'output', 0);
        this.simV = Math.abs((nIn !== -1 ? engine.nodeVoltage[nIn] : 0) - (nOut !== -1 ? engine.nodeVoltage[nOut] : 0));
    }
    onTimeUpdate(dt, now) {
        if (typeof this.simI === 'undefined' || isNaN(this.simI)) this.simI = 0;
        const targetI = this.simV / 100; 
        this.simI = targetI + (this.simI - targetI) * Math.exp(-dt / (2.0 / 100));
        if (this.simI < 0.0001 && this.simV < 0.1) this.simI = 0;

        if (typeof this.plungerPos === 'undefined') this.plungerPos = 0;
        if (typeof this.plungerVel === 'undefined') this.plungerVel = 0;
        
        let F_net = (2000 * (this.simI * this.simI)) - (2.0 * this.plungerPos) - (0.5 * this.plungerVel);
        this.plungerVel += (F_net / 0.02) * dt;
        this.plungerPos += this.plungerVel * dt;
        
        if (this.plungerPos >= 12) { this.plungerPos = 12; this.plungerVel = 0; } 
        else if (this.plungerPos <= 0) { this.plungerPos = 0; this.plungerVel = 0; }
        this.strokePercent = (this.plungerPos / 12) * 100;
    }
};

ComponentRegistry['servo'] = class Servo extends BaseComponent {
    injectMatrix(engine, sumVR, sum1R) {
        const nSig = engine.getNodeIndex(this.id, 'input', 0);
        const nVcc = engine.getNodeIndex(this.id, 'input', 1);
        const nGnd = engine.getNodeIndex(this.id, 'input', 2);
        if (nSig !== -1 && nGnd !== -1) {
            const condSig = 1 / 1000000;
            sumVR[nSig] += engine.nodeVoltage[nGnd] * condSig; sum1R[nSig] += condSig;
            sumVR[nGnd] += engine.nodeVoltage[nSig] * condSig; sum1R[nGnd] += condSig;
        }
        if (nVcc !== -1 && nGnd !== -1) {
            const condVcc = 1 / 250;
            sumVR[nVcc] += engine.nodeVoltage[nGnd] * condVcc; sum1R[nVcc] += condVcc;
            sumVR[nGnd] += engine.nodeVoltage[nVcc] * condVcc; sum1R[nGnd] += condVcc;
        }
    }
    applyResults(engine) {
        const nSig = engine.getNodeIndex(this.id, 'input', 0);
        const nVcc = engine.getNodeIndex(this.id, 'input', 1);
        const nGnd = engine.getNodeIndex(this.id, 'input', 2);
        const voltPower = (nVcc !== -1 ? engine.nodeVoltage[nVcc] : 0) - (nGnd !== -1 ? engine.nodeVoltage[nGnd] : 0);
        this.simV = Math.abs(voltPower); 
        
        if (voltPower > 3.0) {
            this.isPowered = true;
            let targetAngle = voltPower > 0 ? ((nSig !== -1 ? engine.nodeVoltage[nSig] : 0) - (nGnd !== -1 ? engine.nodeVoltage[nGnd] : 0)) / voltPower * 180 : 0;
            if (typeof this.servoAngle === 'undefined') this.servoAngle = 0;
            let diff = Math.max(0, Math.min(180, targetAngle)) - this.servoAngle;
            this.servoAngle = Math.abs(diff) < 0.1 ? Math.max(0, Math.min(180, targetAngle)) : this.servoAngle + Math.max(-4, Math.min(4, diff * 0.1));
        } else {
            this.isPowered = false;
        }
    }
};

// Tambalan Khusus Digital Logic IC 4017 agar selaras dengan Gerbang Logika
if (ComponentRegistry['ic_4017']) {
    ComponentRegistry['ic_4017'].prototype.solveDigital = function(engine, iter) {
        const in0 = this.inputStates[0] === 1 ? 1 : 0;
        const in1 = this.inputStates[1] === 1 ? 1 : 0;
        const in2 = this.inputStates[2] === 1 ? 1 : 0;

        if (typeof this.counter === 'undefined') this.counter = 0;
        if (!this.outputStates) this.outputStates = new Array(11).fill(0);
        
        let isClockRising = false;
        if (this.prevClock === undefined) { if (iter === 4) this.prevClock = in0; } 
        else {
            if (this.prevClock === 0 && in0 === 1) { isClockRising = true; this.prevClock = 1; } 
            else if (in0 === 0) { this.prevClock = 0; }
        }

        if (in2 === 1) this.counter = 0;
        else if (isClockRising && in1 === 0) { this.counter++; if (this.counter > 9) this.counter = 0; }

        for (let j = 0; j < 10; j++) this.outputStates[j] = (this.counter === j) ? 1 : 0;
        this.outputStates[10] = (this.counter < 5) ? 1 : 0;
    };
}


// Pastikan untuk mengekspor fungsi pembuat instansiasi
window.createComponentInstance = function(data) {
    const ComponentClass = ComponentRegistry[data.type] || BaseComponent;
    return new ComponentClass(data);
};