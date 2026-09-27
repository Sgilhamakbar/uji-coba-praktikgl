// File: src/engine/models/logic/PseudoArduinoModel.js

import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { BaseComponent } from '../core/BaseComponent.js';
import { CircuitStore } from '../../../state/CircuitStore.js';

export class PseudoArduino extends BaseComponent {
    
    constructor(data) {
        super(data);
        this.pinModes = new Array(29).fill('INPUT'); 
        this.pinTargets = new Array(29).fill(0);     
        this.hasCompiled = false;
        
        // Memori khusus untuk fitur TONE (Audio)
        this.toneFreqs = new Array(29).fill(0);      
        this.lastToneTimes = new Array(29).fill(0); 
        this.startTime = 0;
        this.interrupts = [null, null]; 
    }

    solveDigital(engine, iter) {
        // Harus iterasi ke-4 agar sinkron dengan siklus digital Gauss-Seidel
        if (iter !== 4) return;

        // BACA TEGANGAN PIN RESET (Indeks 21)
        const nReset = engine.getNodeIndex(this.id, 'input', 21);
        const vReset = nReset !== -1 ? (engine.nodeVoltage[nReset] || 5.0) : 5.0;

        // 1. HARD RESET Hardware
        if (engine.simTime === 0 || engine.simTime < this.lastSimTime || vReset < 1.0) {
            this.hasCompiled = false; 
            this.toneFreqs.fill(0);
            this.lastToneTimes.fill(0);
            this.pinTargets.fill(0);
            this._delayWarned = false; 
            this.startTime = engine.simTime; // Reset peringatan delay() agar muncul lagi, KUNCI RESET MILLIS: Terus perbarui titik awal stopwatch selama tombol ditahan
            
            // TAMBAHAN: Hapus fungsi interrupt jika Arduino di-reset
            this.interrupts = [null, null]; 
            
            // Jika kabel masih nempel di GND, Arduino mati suri
            if (vReset < 1.0) {
                this.lastSimTime = engine.simTime;
                return; 
            }
        }
        this.lastSimTime = engine.simTime;

        // ==============================================
        // 1. GENERATOR GELOMBANG AUDIO (TONE) BACKGROUND
        // ==============================================
        const now = engine.simTime;
        for (let i = 0; i < 29; i++) {
            if (this.toneFreqs[i] > 0 && this.pinModes[i] === 'OUTPUT') {
                // Batasi frekuensi maksimal di 500Hz agar mesin 1ms (1000Hz) tidak terlewat (Nyquist: 1000/2 = 500Hz)
                const f = Math.min(this.toneFreqs[i], 500); 
                const halfPeriod = 1.0 / (2 * f);
                
                // Toggle / Flip-Flop tegangan untuk menciptakan suara
                if (now - this.lastToneTimes[i] >= halfPeriod) {
                    this.lastToneTimes[i] = now;
                    this.pinTargets[i] = this.pinTargets[i] > 2.5 ? 0.0 : 5.0; 
                }
            }
        }

        // ==============================================
        // 2. CEK INTERRUPT EKSTERNAL (Micro-Polling)
        // ==============================================
        // Mengecek pin 2 (INT0) dan pin 3 (INT1) sebelum eksekusi loop
        for (let i = 0; i <= 1; i++) {
            const intData = this.interrupts[i];
            if (intData && intData.isr) {
                const pinToRead = (i === 0) ? 2 : 3;
                
                // Baca tegangan fisik dari node kelistrikan
                const nodeIdx = engine.getNodeIndex(this.id, 'input', pinToRead);
                const voltage = nodeIdx !== -1 ? (engine.nodeVoltage[nodeIdx] || 0) : 0;
                const currentState = voltage >= 2.5 ? 1 : 0;
                
                let trigger = false;
                
                // Mode Logika: 1=CHANGE, 2=RISING, 3=FALLING, 0=LOW
                if (intData.mode === 1) trigger = (currentState !== intData.lastState);
                else if (intData.mode === 2) trigger = (intData.lastState === 0 && currentState === 1);
                else if (intData.mode === 3) trigger = (intData.lastState === 1 && currentState === 0);
                else if (intData.mode === 0) trigger = (currentState === 0);

                if (trigger) {
                    try { intData.isr(); } 
                    catch (err) { console.error("Error pada ISR (Interrupt):", err); }
                }
                
                // Simpan state saat ini untuk perbandingan di frame berikutnya
                intData.lastState = currentState;
            }
        }

        // ==============================================
        // 3. EKSEKUSI KODE PENGGUNA (SANDBOX)
        // ==============================================
        const userCode = this.customCode || `function setup() {} function loop() {}`;

                if (!this.hasCompiled) {
            try {
                const sandbox = new Function('api', `
                    const { 
                        // Standar I/O & Timing
                        pinMode, digitalWrite, digitalRead, analogRead, analogWrite, 
                        millis, delay, pulseIn, delayMicroseconds,
                        // Konstanta
                        HIGH, LOW, INPUT, OUTPUT, INPUT_PULLUP,
                        FORWARD, BACKWARD, RELEASE, CHANGE, RISING, FALLING,
                        // Matematika
                        map, constrain, abs, min, max,
                        // Audio & Serial
                        tone, noTone, Serial,
                        // Library & Objek Lanjutan
                        Servo, LiquidCrystal_I2C, NewPing, L298N, EEPROM, Wire,
                        // Interrupt
                        attachInterrupt, detachInterrupt, digitalPinToInterrupt
                    } = api;
                    
                    ${userCode}
                    return { setup, loop };
                `);

                this.program = sandbox(this.createAPI(engine));
                if (this.program.setup) this.program.setup(); 
                this.hasCompiled = true;
            } catch (err) {
                console.error("Error pada kode Arduino:", err);
                return; 
            }
        }

        try {
            if (this.program && this.program.loop) {
                this.program.loop();
            }
        } catch (err) {
            console.error("Error saat loop Arduino:", err);
        }
    }

    createAPI(engine) {
        const pseudo = this; // Simpan referensi ke komponen ini untuk digunakan dalam class Servo

        // ==============================================
        // INISIALISASI MEMORI EEPROM (Persisten)
        // ==============================================
        // Kita menggunakan pseudo.id agar jika ada 2 Arduino di kanvas,
        // memori EEPROM mereka tidak saling bertabrakan.
        const eepromKey = `arduino_eeprom_${pseudo.id}`;
        
        if (!pseudo.eepromData) {
            const savedData = localStorage.getItem(eepromKey);
            if (savedData) {
                try {
                    pseudo.eepromData = JSON.parse(savedData);
                } catch(e) {
                    pseudo.eepromData = new Array(1024).fill(255); 
                }
            } else {
                // Default pabrik EEPROM asli yang kosong bernilai 255 (0xFF), bukan 0
                pseudo.eepromData = new Array(1024).fill(255);
            }
        }

        // Helper untuk menyembunyikan logika penyimpanan
        const commitEEPROM = () => {
            try { localStorage.setItem(eepromKey, JSON.stringify(pseudo.eepromData)); } 
            catch(e) { console.warn("Penyimpanan lokal penuh/dinonaktifkan!"); }
        };

        return {
            // Konstanta Bawaan
            HIGH: 1, LOW: 0, INPUT: 'INPUT', OUTPUT: 'OUTPUT', INPUT_PULLUP: 'INPUT_PULLUP',
            CHANGE: 1, RISING: 2, FALLING: 3, // Konstanta Interrupt
            millis: () => {
                const start = pseudo.startTime || 0;
                return Math.floor((engine.simTime - start) * 1000);
            },
            // ⚠️ delay() TIDAK BISA diimplementasikan secara nyata di simulator ini
            // karena JavaScript berjalan single-thread (tidak bisa "pause" eksekusi).
            // Peringatan ini hanya muncul 1x agar Serial Monitor tidak kebanjiran.
            delay: (ms) => {
                if (!pseudo._delayWarned) {
                    pseudo._delayWarned = true;
                    if (window.UIManager) window.UIManager.printToSerialMonitor(
                        `<span style="color: #f97316;">⚠ delay(${ms}): Fungsi delay() tidak bekerja di simulator ini. Gunakan pendekatan millis() non-blocking. Contoh:</span>`, true
                    );
                    if (window.UIManager) window.UIManager.printToSerialMonitor(
                        `<span style="color: #94a3b8;">  if (millis() - lastTime >= ${ms}) { lastTime = millis(); /* aksi */ }</span>`, true
                    );
                }
            },
            
            // 🌟 1. API PIN DASAR
            pinMode: (pin, mode) => {
                const p = pseudo.mapPin(pin);
                if (p >= 0) pseudo.pinModes[p] = mode;
            },
            digitalWrite: (pin, val) => {
                const p = pseudo.mapPin(pin);
                if (p >= 0 && pseudo.pinModes[p] === 'OUTPUT') pseudo.pinTargets[p] = val === 1 ? 5.0 : 0.0;
            },

            // 🌟 API INTERRUPT
            digitalPinToInterrupt: (pin) => {
                const p = pseudo.mapPin(pin);
                if (p === 2) return 0; // Pin 2 adalah Interrupt 0 di Uno
                if (p === 3) return 1; // Pin 3 adalah Interrupt 1 di Uno
                return -1; // Pin lain tidak mendukung external interrupt
            },

            attachInterrupt: (interruptNum, ISR, mode) => {
                if (interruptNum === 0 || interruptNum === 1) {
                    const targetPin = (interruptNum === 0) ? 2 : 3;
 
                    // Biarkan user menentukan pinMode-nya sendiri (misal INPUT_PULLUP)
                    
                    // Rekam state awal agar tidak false-trigger
                    const nodeIdx = engine.getNodeIndex(pseudo.id, 'input', targetPin);
                    const voltage = nodeIdx !== -1 ? (engine.nodeVoltage[nodeIdx] || 0) : 0;
                    const initialState = voltage >= 2.5 ? 1 : 0;

                    // Daftarkan fungsi ISR ke memori mesin
                    pseudo.interrupts[interruptNum] = { 
                        isr: ISR, 
                        mode: mode, 
                        lastState: initialState 
                    };
                } else {
                    if (window.UIManager) window.UIManager.printToSerialMonitor(
                        `<span style="color: #f97316;">⚠ attachInterrupt: Arduino Uno hanya mendukung interrupt di pin 2 dan 3.</span>`, true
                    );
                }
            },

            detachInterrupt: (interruptNum) => {
                if (interruptNum === 0 || interruptNum === 1) {
                    pseudo.interrupts[interruptNum] = null; // Hapus dari memori
                }
            },

            analogWrite: (pin, val) => {
                const p = pseudo.mapPin(pin);
                // Sesuai datasheet ATmega328P: PWM hanya tersedia di pin D3, D5, D6, D9, D10, D11
                const pwmPins = [3, 5, 6, 9, 10, 11];
                if (p >= 0 && pseudo.pinModes[p] === 'OUTPUT') {
                    if (!pwmPins.includes(p)) {
                        if (window.UIManager) window.UIManager.printToSerialMonitor(
                            `<span style="color: #f97316;">⚠ analogWrite(${pin}): Pin ini bukan pin PWM~ (Gunakan: 3,5,6,9,10,11)</span>`, true
                        );
                        return;
                    }
                    const safeVal = Math.max(0, Math.min(255, val));
                    pseudo.pinTargets[p] = (safeVal / 255) * 5.0;
                }
            },
            digitalRead: (pin) => {
                const p = pseudo.mapPin(pin);
                if (p < 0) return 0;
                const nodeIdx = engine.getNodeIndex(pseudo.id, 'input', p);
                const voltage = nodeIdx !== -1 ? (engine.nodeVoltage[nodeIdx] || 0) : 0;
                return voltage >= 2.5 ? 1 : 0;
            },
            analogRead: (pin) => {
                const p = pseudo.mapPin(pin);
                if (p < 0) return 0;
                // Sesuai datasheet ATmega328P: ADC hanya tersedia di pin A0–A5 (indeks 14–19)
                if (p < 14 || p > 19) {
                    if (window.UIManager) window.UIManager.printToSerialMonitor(
                        `<span style="color: #f97316;">⚠ analogRead(${pin}): Pin ini bukan pin Analog (Gunakan: A0–A5)</span>`, true
                    );
                    return 0;
                }
                // Sesuai Arduino: analogRead() otomatis mengubah pin ke mode INPUT
                pseudo.pinModes[p] = 'INPUT';
                const nodeIdx = engine.getNodeIndex(pseudo.id, 'input', p);
                const voltage = nodeIdx !== -1 ? (engine.nodeVoltage[nodeIdx] || 0) : 0;
                let adc = Math.round((voltage / 5.0) * 1023);
                return Math.max(0, Math.min(1023, adc)); 
            },

            // 1. TAMBAHKAN KONSTANTA ARAH MOTOR
        FORWARD: 1, 
        BACKWARD: 2, 
        RELEASE: 3,

        // 2. LIBRARY L298N MOTOR DRIVER
        L298N: class {
            constructor(enPin, in1Pin, in2Pin) {
                // Petakan pin Arduino menggunakan helper bawaan
                this.en = pseudo.mapPin(enPin);
                this.in1 = pseudo.mapPin(in1Pin);
                this.in2 = pseudo.mapPin(in2Pin);

                // Otomatis atur semua pin kontrol motor sebagai OUTPUT
                if (this.en >= 0) pseudo.pinModes[this.en] = 'OUTPUT';
                if (this.in1 >= 0) pseudo.pinModes[this.in1] = 'OUTPUT';
                if (this.in2 >= 0) pseudo.pinModes[this.in2] = 'OUTPUT';
                
                this.currentSpeed = 255; // Kecepatan maksimal secara default
            }

            setSpeed(speed) {
                // Batasi kecepatan dari 0 hingga 255
                this.currentSpeed = Math.max(0, Math.min(255, speed));
                
                // Eksekusi sinyal PWM langsung ke target voltase (analogWrite internal)
                if (this.en >= 0) {
                    pseudo.pinTargets[this.en] = (this.currentSpeed / 255) * 5.0;
                }
            }

            forward() {
                // IN1 HIGH, IN2 LOW
                if (this.in1 >= 0) pseudo.pinTargets[this.in1] = 5.0; 
                if (this.in2 >= 0) pseudo.pinTargets[this.in2] = 0.0; 
                
                // Pastikan PWM aktif sesuai currentSpeed
                if (this.en >= 0) pseudo.pinTargets[this.en] = (this.currentSpeed / 255) * 5.0;
            }

            backward() {
                // IN1 LOW, IN2 HIGH
                if (this.in1 >= 0) pseudo.pinTargets[this.in1] = 0.0; 
                if (this.in2 >= 0) pseudo.pinTargets[this.in2] = 5.0; 
                
                // Pastikan PWM aktif sesuai currentSpeed
                if (this.en >= 0) pseudo.pinTargets[this.en] = (this.currentSpeed / 255) * 5.0;
            }

            stop() {
                // IN1 LOW, IN2 LOW (Rem)
                if (this.in1 >= 0) pseudo.pinTargets[this.in1] = 0.0; 
                if (this.in2 >= 0) pseudo.pinTargets[this.in2] = 0.0; 
                
                // Matikan sinyal PWM
                if (this.en >= 0) pseudo.pinTargets[this.en] = 0.0;
            }
            
            // FUNGSI KOMPATIBILITAS (Mirip dengan AFMotor/Adafruit)
            run(cmd) {
                if (cmd === 1 || cmd === 'FORWARD') this.forward();
                else if (cmd === 2 || cmd === 'BACKWARD') this.backward();
                else if (cmd === 3 || cmd === 'RELEASE') this.stop();
            }
        },

            // 🌟 2. API SERIAL MONITOR
            Serial: {
                begin: (baud) => { 
                    pseudo.txBlinkUntil = Date.now() + 50; 
                    if (window.UIManager) window.UIManager.printToSerialMonitor(`<span style="color: #38bdf8;">> Serial dimulai (${baud} baud)</span>`, true); 
                },
                print: (val) => { 
                    pseudo.txBlinkUntil = Date.now() + 50;
                    if (window.UIManager) window.UIManager.printToSerialMonitor(String(val), false); 
                },
                println: (val) => { 
                    pseudo.txBlinkUntil = Date.now() + 50;
                    if (window.UIManager) window.UIManager.printToSerialMonitor(String(val), true); 
                }
            },

            // 🌟 3. API MATEMATIKA (MAP, CONSTRAIN, MIN, MAX, ABS)
            map: (x, in_min, in_max, out_min, out_max) => {
                return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
            },
            constrain: (x, a, b) => Math.max(Math.min(x, Math.max(a, b)), Math.min(a, b)),
            abs: Math.abs,
            min: Math.min,
            max: Math.max,

            // 🌟 4. API AUDIO TONE
            tone: (pin, frequency) => {
                const p = pseudo.mapPin(pin);
                if (p >= 0) {
                    pseudo.pinModes[p] = 'OUTPUT';
                    pseudo.toneFreqs[p] = Math.max(1, frequency); // Aktifkan generator gelombang
                }
            },
            noTone: (pin) => {
                const p = pseudo.mapPin(pin);
                if (p >= 0) {
                    pseudo.toneFreqs[p] = 0;        // Matikan generator gelombang
                    pseudo.pinTargets[p] = 0.0;     // Tarik ke Ground
                }
            },

            // 🌟 5. API SERVO MOTOR (Object Oriented)
            // ⚠️ SIMPLIFIKASI EDUKASI: Servo asli dikontrol oleh lebar pulsa PWM
            // (1ms=0°, 1.5ms=90°, 2ms=180°). Di simulator ini disederhanakan
            // menjadi tegangan DC proporsional (0V=0°, 5V=180°) agar kompatibel
            // dengan mesin fisika Gauss-Seidel yang berbasis tegangan.
            Servo: class {
                constructor() { 
                    this.pinIdx = -1; 
                    this.angle = 0; 
                }
                attach(pinStr) {
                    this.pinIdx = pseudo.mapPin(pinStr);
                    if (this.pinIdx >= 0) pseudo.pinModes[this.pinIdx] = 'OUTPUT';
                }
                write(angle) {
                    if (this.pinIdx < 0) return;
                    this.angle = Math.max(0, Math.min(180, angle));
                    // Di simulator ini, motor Servo dikendalikan oleh tegangan DC (0V = 0°, 5V = 180°)
                    pseudo.pinTargets[this.pinIdx] = (this.angle / 180.0) * 5.0;
                }
                read() { return this.angle; }
            },
            
            // 6. API LCD 16x2 I2C (Wired Bypass / Realistik)
            LiquidCrystal_I2C: class {
                constructor(address, cols, rows) {
                    this.address = address;
                    this.cols = cols || 16;
                    this.rows = rows || 2;
                    this.cursorCol = 0;
                    this.cursorRow = 0;
                    this.lcdComp = null; 
                }

                begin() {
                    pseudo.pinModes[18] = 'INPUT_PULLUP'; 
                    pseudo.pinModes[19] = 'INPUT_PULLUP';
                    
                    const sdaNode = engine.getNodeIndex(pseudo.id, 'input', 18);
                    const sclNode = engine.getNodeIndex(pseudo.id, 'input', 19);

                    const components = CircuitStore.components;
                    for (let i = 0; i < components.length; i++) {
                        const c = components[i];
                        if (c.type === 'lcd_16x2') {
                            const lcdSdaNode = engine.getNodeIndex(c.id, 'input', 2);
                            const lcdSclNode = engine.getNodeIndex(c.id, 'input', 3);
                            
                            if (sdaNode !== -1 && sclNode !== -1 && sdaNode === lcdSdaNode && sclNode === lcdSclNode) {
                                this.lcdComp = c;
                                break;
                            }
                        }
                    }
                    if (this.lcdComp) this.clear(); 
                }

                clear() {
                    if (!this.lcdComp) return;
                    this.lcdComp.lcdText = ["                ", "                "];
                    this._triggerUIRender();
                    this.cursorCol = 0;
                    this.cursorRow = 0;
                }

                setCursor(col, row) {
                    this.cursorCol = Math.max(0, Math.min(15, col));
                    this.cursorRow = Math.max(0, Math.min(1, row));
                }

                print(text) {
                    if (!this.lcdComp) {
                        if (!pseudo._lcdWarned) {
                            pseudo._lcdWarned = true;
                            if (window.UIManager) window.UIManager.printToSerialMonitor(
                                `<span style="color: #ef4444;">⚠ LCD Error: Kabel SDA (A4) atau SCL (A5) belum terhubung ke Modul LCD!</span>`, true
                            );
                        }
                        return;
                    }
                    
                    let str = String(text);
                    let currentRowStr = this.lcdComp.lcdText[this.cursorRow];
                    
                    let before = currentRowStr.substring(0, this.cursorCol);
                    let after = currentRowStr.substring(this.cursorCol + str.length);
                    
                    let newRowStr = before + str + after;
                    this.lcdComp.lcdText[this.cursorRow] = newRowStr.substring(0, 16).padEnd(16, ' ');
                    this.cursorCol += str.length;

                    this._triggerUIRender();
                }

                // --- TAMBAHAN KONTROL LCD LANJUTAN ---
                backlight() {
                    if (this.lcdComp) {
                        this.lcdComp.backlightOn = true;
                        this._triggerUIRender();
                    }
                }

                noBacklight() {
                    if (this.lcdComp) {
                        this.lcdComp.backlightOn = false;
                        this._triggerUIRender();
                    }
                }

                cursor() {
                    if (this.lcdComp) {
                        this.lcdComp.showCursor = true;
                        this._triggerUIRender();
                    }
                }

                noCursor() {
                    if (this.lcdComp) {
                        this.lcdComp.showCursor = false;
                        this._triggerUIRender();
                    }
                }

                blink() {
                    if (this.lcdComp) {
                        this.lcdComp.blinkCursor = true;
                        this._triggerUIRender();
                    }
                }

                noBlink() {
                    if (this.lcdComp) {
                        this.lcdComp.blinkCursor = false;
                        this._triggerUIRender();
                    }
                }

                _triggerUIRender() {
                    if (typeof window !== 'undefined' && window.updateWireStates) {
                         const contentDiv = document.getElementById(`content-${this.lcdComp.id}`);
                         if (contentDiv && window.ComponentDefs) {
                             window.ComponentDefs.updateDOMState('lcd_16x2', this.lcdComp, contentDiv, this.lcdComp.id);
                         }
                    }
                }
            },

            // 🌟 7. LIBRARY WIRE (I2C COMMUNICATION)
            Wire: {
                begin: () => {
                    // Sesuai Arduino Uno: SDA = A4 (indeks 18), SCL = A5 (indeks 19)
                    pseudo.pinModes[18] = 'INPUT_PULLUP'; 
                    pseudo.pinModes[19] = 'INPUT_PULLUP';
                },
                
                beginTransmission: (address) => {
                    pseudo.i2cTargetAddr = address;
                    pseudo.i2cBuffer = []; // Kosongkan buffer sebelum mengirim
                },
                
                write: (data) => {
                    // Jika data berupa string, ubah jadi array char code
                    if (typeof data === 'string') {
                        for (let i = 0; i < data.length; i++) {
                            pseudo.i2cBuffer.push(data.charCodeAt(i));
                        }
                    } else {
                        pseudo.i2cBuffer.push(data); // Push byte data
                    }
                },
                
                endTransmission: () => {
                    // Cek ID Jalur Kabel (Node) A4 dan A5 Arduino ini
                    const sdaNode = engine.getNodeIndex(pseudo.id, 'input', 18);
                    const sclNode = engine.getNodeIndex(pseudo.id, 'input', 19);
                    
                    if (sdaNode === -1 || sclNode === -1) return 2; // Error NACK (Kabel putus)

                    let transmitted = false;

                    // CARI KOMPONEN SLAVE (Penerima) YANG COCOK ALAMAT & KABELNYA
                    const components = CircuitStore.components;
                    for (let i = 0; i < components.length; i++) {
                        const slave = components[i];
                        
                        // Contoh kasus: Komunikasi antar sesama Arduino (Master-Slave)
                        if (slave.type === 'arduino_uno' && slave.id !== pseudo.id) {
                            if (slave.i2cAddress === pseudo.i2cTargetAddr) {
                                const slaveSdaNode = engine.getNodeIndex(slave.id, 'input', 18);
                                const slaveSclNode = engine.getNodeIndex(slave.id, 'input', 19);
                                
                                // Jika kabel dari Master benar-benar nyambung ke Slave
                                if (sdaNode === slaveSdaNode && sclNode === slaveSclNode) {
                                    if (slave.onI2CReceive) slave.onI2CReceive(pseudo.i2cBuffer);
                                    transmitted = true;
                                }
                            }
                        }
                        // (Bisa dikembangkan untuk komponen I2C lain seperti RTC, OLED, dll)
                    }

                    pseudo.i2cBuffer = []; // Bersihkan buffer
                    return transmitted ? 0 : 2; // 0 = Sukses, 2 = Alamat tidak merespons
                },
                
                // (Untuk Slave Mode)
                onReceive: (handlerFunction) => {
                    pseudo.onI2CReceive = handlerFunction;
                }
            },

            delayMicroseconds: (_us) => { /* Stub aman untuk mencegah error */ },
            pulseIn: (pin, _state) => {
                const p = pseudo.mapPin(pin);
                if (p < 0) return 0;
                
                // Cari node kelistrikan dari pin Arduino ini
                const nIdx = engine.getNodeIndex(pseudo.id, 'input', p);
                if (nIdx === -1) return 0;

                // MAGIC CHEAT: Cari sensor HC-SR04 yang tersambung ke kabel ini
                const components = CircuitStore.components;
                for (let i = 0; i < components.length; i++) {
                    const c = components[i];
                    if (c.type === 'hc_sr04') {
                        const echoIdx = engine.getNodeIndex(c.id, 'output', 0);
                        if (echoIdx === nIdx) {
                            // Hitung balik mikrodetik sesuai rumus Datasheet (Jarak * 58)
                            let dist = parseFloat(c.state) || 50;
                            return Math.round(dist * 58.0);
                        }
                    }
                }
                return 1000000;
            },
            
            NewPing: class {
                constructor(trigger_pin, echo_pin, max_cm_distance = 500) {
                    // 1. Pemetaan Pin
                    this.triggerPin = pseudo.mapPin(trigger_pin);
                    this.echoPin = pseudo.mapPin(echo_pin);
                    this.maxDist = max_cm_distance;

                    // 2. Set mode pin secara otomatis (seperti asli)
                    if (this.triggerPin >= 0) pseudo.pinModes[this.triggerPin] = 'OUTPUT';
                    if (this.echoPin >= 0) pseudo.pinModes[this.echoPin] = 'INPUT';
                }

                ping_cm() {
                    // Cegah pembacaan jika pin tidak valid
                    if (this.echoPin < 0) return 0;

                    // 1. Cari ID jalur kelistrikan (node) dari pin Echo Arduino ini
                    const arduinoNodeIdx = engine.getNodeIndex(pseudo.id, 'input', this.echoPin);
                    if (arduinoNodeIdx === -1) return 0; // Tidak ada kabel tersambung

                    // 2. Pindai semua komponen di kanvas untuk mencari HC-SR04
                    const components = CircuitStore.components;
                    for (let i = 0; i < components.length; i++) {
                        const c = components[i];
                        
                        if (c.type === 'hc_sr04') {
                            // HC-SR04 di index.html memiliki 1 output (Echo). Cek node kelistrikannya.
                            const sensorNodeIdx = engine.getNodeIndex(c.id, 'output', 0);
                            
                            // 3. Jika node Arduino dan node Sensor cocok, berarti mereka terhubung kabel!
                            if (sensorNodeIdx === arduinoNodeIdx) {
                                // Ambil nilai jarak (cm) dari state komponen (slider UI)
                                let currentDistance = parseFloat(c.state) || 0;
                                
                                // Batasi nilai agar tidak melebihi max_cm_distance yang disetel pengguna
                                if (currentDistance > this.maxDist) {
                                    return 0; // NewPing mengembalikan 0 jika di luar jangkauan (Out of Range)
                                }
                                
                                return Math.round(currentDistance);
                            }
                        }
                    }
                    return 0; // Kembalikan 0 jika tidak menemukan sensor yang terhubung
                }

                // Fungsi tambahan yang sering dipakai di NewPing
                ping_in() {
                    return Math.round(this.ping_cm() / 2.54);
                }

                ping() {
                    // Mengembalikan waktu tempuh dalam mikrodetik (jarak cm * 57)
                    return this.ping_cm() * 57;
                }
            },

            // LIBRARY EEPROM ATmega328P (1024 Byte)
            EEPROM: {
                length: () => 1024,
                
                read: (address) => {
                    const addr = Math.floor(address);
                    // Cegah pembacaan di luar batas memori
                    if (addr < 0 || addr >= 1024) return 0;
                    return pseudo.eepromData[addr];
                },
                
                write: (address, value) => {
                    const addr = Math.floor(address);
                    if (addr >= 0 && addr < 1024) {
                        // Operasi bitwise '& 255' memaksa angka menjadi 8-bit (0-255)
                        // Contoh: nilai 256 akan menjadi 0, nilai 257 menjadi 1
                        pseudo.eepromData[addr] = value & 255; 
                        commitEEPROM(); // Simpan permanen ke browser
                    }
                },
                
                update: (address, value) => {
                    const addr = Math.floor(address);
                    if (addr >= 0 && addr < 1024) {
                        const valByte = value & 255;
                        // Logika efisiensi umur EEPROM: hanya menulis jika nilai berbeda
                        if (pseudo.eepromData[addr] !== valByte) {
                            pseudo.eepromData[addr] = valByte;
                            commitEEPROM();
                        }
                    }
                }
            },
        };
    }

    mapPin(pin) {
        if (typeof pin === 'string' && pin.startsWith('A')) return 14 + parseInt(pin.substring(1));
        return parseInt(pin);
    }

    injectMatrix(engine, sumVR, sum1R) {
        const rOut = 40.0; 
        const gOut = 1 / rOut;

        // 1. Eksekusi Tegangan Pin Digital & Analog (Indeks 0 hingga 19)
        for (let i = 0; i <= 19; i++) {
            if (this.pinModes[i] === 'OUTPUT') {
                const nodeIdx = engine.getNodeIndex(this.id, 'input', i); 
                if (nodeIdx !== -1) {
                    sumVR[nodeIdx] += this.pinTargets[i] * gOut;
                    sum1R[nodeIdx] += gOut;
                }
            } else if (this.pinModes[i] === 'INPUT_PULLUP') {
                // Internal Pull-Up Resistor ~30kΩ ke 5V (Datasheet ATmega328P: 20k–50kΩ)
                const nodeIdx = engine.getNodeIndex(this.id, 'input', i);
                if (nodeIdx !== -1) {
                    const gPullUp = 1 / 30000.0;
                    sumVR[nodeIdx] += 5.0 * gPullUp;
                    sum1R[nodeIdx] += gPullUp;
                }
            }
        }

        // ==============================================
        // 2. Eksekusi Pin Power Sesuai Desain UI Baru
        // ==============================================
        const gPower = 1 / 0.1; // Resistansi arus kuat (nyaris 0 Ohm)

        // 🌟 PERBAIKAN: Pin VIN (26) - Input daya alternatif (7–12V)
        // Pada Arduino asli, VIN masuk ke regulator AMS1117-5.0 untuk menghasilkan 5V.
        // Di simulator: jika VIN diberi tegangan >= 6.5V, jalur 5V/3V3/IOREF tetap aktif.
        // VIN juga bisa dipakai sebagai output (membaca tegangan USB 5V lewat dioda).
        const nVin = engine.getNodeIndex(this.id, 'input', 26);
        const vVin = nVin !== -1 ? (engine.nodeVoltage[nVin] || 0) : 0;
        const isPoweredByVin = vVin >= 6.5;

        // Tentukan tegangan 5V rail: dari USB (default) atau dari VIN via regulator
        const v5Rail = 5.0; // Regulator selalu menghasilkan 5.0V
        const v3v3Rail = 3.3;

        // Jika VIN tidak disambung (mengambang), output VIN ≈ 5V (backfeed dari USB melalui dioda)
        if (nVin !== -1 && !isPoweredByVin) {
            const gVinOut = 1 / 100.0; // Impedansi output rendah (backfeed USB via dioda)
            sumVR[nVin] += v5Rail * gVinOut;
            sum1R[nVin] += gVinOut;
        }
        
        // Pin 5V (23) dan IOREF (20) - Keduanya tersambung langsung ke jalur 5V
        [20, 23].forEach(pinIdx => {
            const n = engine.getNodeIndex(this.id, 'input', pinIdx);
            if (n !== -1) { sumVR[n] += v5Rail * gPower; sum1R[n] += gPower; }
        });

        // Pin 3.3V (22) - Dari regulator LP2985-3.3
        const n3v3 = engine.getNodeIndex(this.id, 'input', 22);
        if (n3v3 !== -1) { sumVR[n3v3] += v3v3Rail * gPower; sum1R[n3v3] += gPower; }

        // Semua Pin GND (24, 25, dan 27)
        [24, 25, 27].forEach(pinIdx => {
            const n = engine.getNodeIndex(this.id, 'input', pinIdx);
            if (n !== -1) { sumVR[n] += 0.0 * gPower; sum1R[n] += gPower; } 
        });

        // 🌟 FITUR BARU: Pin RESET (21)
        // Memiliki Pull-Up Resistor 10k Ohm ke 5V
        const nReset = engine.getNodeIndex(this.id, 'input', 21);
        if (nReset !== -1) {
            const gPullUp = 1 / 10000.0; // Hambatan 10k Ohm
            sumVR[nReset] += 5.0 * gPullUp; 
            sum1R[nReset] += gPullUp;
        }

        // 🌟 FITUR BARU: Pin AREF (28)
        // Terhubung ke 5V dengan hambatan internal sekitar 32k Ohm
        const nAref = engine.getNodeIndex(this.id, 'input', 28);
        if (nAref !== -1) {
            const gAref = 1 / 32000.0; // Hambatan 32k Ohm
            sumVR[nAref] += 5.0 * gAref; 
            sum1R[nAref] += gAref;
        }
    }
}

ComponentRegistry['arduino_uno'] = PseudoArduino;