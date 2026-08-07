// File: src/engine/SimulationEngine.js

const SimulationEngine = {
    isRunning: false,
    nodes: [], // Menyimpan titik simpul (persimpangan kabel) kelistrikan
    nodeVoltage: [], // Menyimpan nilai tegangan untuk masing-masing node
    
    // ─── LANGKAH 1: HELPER FISIKA SEMIKONDUKTOR (NEWTON-RAPHSON) ───
    DiodePhysics: {
        VT: 0.02585, // Tegangan termal (Thermal Voltage) pada suhu ruang 300K (~26mV)
        
        // FUNGSI 1: Damping (PNJLIMIT)
        // Mencegah tebakan tegangan melompat terlalu jauh dan menghasilkan Infinity
        limitVoltageStep(vNew, vOld) {
            const Vcrit = 0.6; // Titik kritis transisi kurva mulai menanjak
            const VT = this.VT;
            
            // Jika tegangan baru naik drastis melampaui Vcrit, paksa naiknya pelan-pelan (logaritmik)
            if (vNew > Vcrit && vNew > vOld) {
                if (vOld > 0) {
                    return vOld + VT * Math.log(1 + (vNew - vOld) / VT);
                } else {
                    return VT * Math.log(vNew / VT);
                }
            }
            // Jika tegangan turun atau masih aman, biarkan saja
            return vNew;
        },

        // FUNGSI 2: Linearisasi Newton-Raphson
        // Mengubah kurva eksponensial LED menjadi Resistor & Sumber Arus sementara
        linearize(vD, Is, n) {
            const nVt = n * this.VT;
            
            // PENGAMAN MATH: Cegah eksponensial meledak (Maksimal e^40)
            let vLimit = vD;
            if (vLimit > 40 * nVt) vLimit = 40 * nVt; 

            // Persamaan Dioda Shockley
            const expTerm = Math.exp(vLimit / nVt);
            const Id = Is * (expTerm - 1); 
            
            // Konduktansi Dinamis (Geq = Turunan dI/dV)
            let Geq = (Is / nVt) * expTerm;
            
            // Batas minimum konduktansi (Cegah pembagian dengan nol / Resistansi tak terhingga)
            if (Geq < 1e-12) Geq = 1e-12; 

            // Arus Ekuivalen Bayangan (Ieq) untuk menipu matriks Gauss-Seidel
            const Ieq = Id - (Geq * vLimit);

            return { Geq, Ieq, Id };
        }
    },
    // ───────────────────────────────────────────────────────────────

    toggle() {
    const simIndicator = document.getElementById('simIndicator');
    const simText = document.getElementById('simText');
    const btnSimulate = document.getElementById('btnSimulate'); // Dipindah ke sini agar terlihat oleh if & else
    
    this.isRunning = !this.isRunning;
    CircuitStore.isSimulationActive = this.isRunning;

    if (this.isRunning) {
        if (simIndicator) simIndicator.className = 'status-indicator status-active';
        if (simText) simText.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Stop Simulasi';
        if (btnSimulate) {
            btnSimulate.classList.remove('btn-primary');
            btnSimulate.classList.add('btn-success');
        }
        CircuitStore.components.forEach(c => {
            if (c.type === 'clock_pulse' || c.type === 'flasher') {
                c._lastToggle = Date.now();
            }
        });
        
        this.buildElectricalNodes(); 
        this.run();
    } else {
        this.stop();
        if (simIndicator) simIndicator.className = 'status-indicator status-ready';
        if (simText) simText.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Mulai Simulasi';
        if (btnSimulate) {
            btnSimulate.classList.remove('btn-success');
            btnSimulate.classList.add('btn-primary');
        }
    }    
},

   stop() {
    this.isRunning = false;
    CircuitStore.isSimulationActive = false;
    
    // Reset semua nilai simulasi ke 0 saat mesin dimatikan
    CircuitStore.components.forEach(c => {
            c.simV = 0;
            c.simI = 0;
            c.rpm = 0;
            if (c.inputStates) c.inputStates.fill(0);
            c.outputState = 0;
                
            if (c.type === 'capacitor') {
                c.chargeV = 0;
                if (c.vHistory) {
                    c.vHistory[0] = 0; 
                    c.vHistory[1] = 0; 
                }
            }
        if (c.type === 'clock_pulse') {
                c.state = c.initialState !== undefined ? c.initialState : '0';
                c._lastToggle = Date.now(); // Reset sinkronisasi timer
            }
        if (c.type === 'ic_4017' || c.type === 'ic_4518' || c.type === 'ic_4511') {
                c.counter = 0;
                c.count = 0; 
                c.latchedVal = 0; // Reset memori Decoder
                c.prevClock = undefined; 
                c.lastClk = undefined;   
                if (c.outputStates) c.outputStates.fill(0);
                if (c.outStates) c.outStates.fill(false);
            }
        if (c.type === 'motor_dc') {
                c.currentRpm = 0; // rpm tampilan sudah 0 di atas, currentRpm internal juga harus 0
            }
        if (c.type === 'servo') {
                c.servoAngle = 0;
                c.isPowered = false;
            }
        if (c.type === 'solenoid') {
                c.plungerPos = 0;
                c.plungerVel = 0;
                c.strokePercent = 0;
            }
        if (['ff_d', 'ff_t', 'ff_jk', 'ff_sr'].includes(c.type)) {
                c.prevClock = undefined; // Sama seperti ic_4017: paksa baca ulang edge saat Play ditekan
            }    
    // Perbarui visual (matikan LED, dll)
        const contentDiv = document.getElementById(`content-${c.id}`);
            if (contentDiv && typeof ComponentDefs !== 'undefined') {
                ComponentDefs.updateDOMState(c.type, c, contentDiv, c.id);
            }
        });
    },

    run() {
        if (!CircuitStore.isSimulationActive && !this.isRunning) return;
        const currentCompCount = CircuitStore.components ? CircuitStore.components.length : 0;
        const currentConnCount = CircuitStore.connections ? CircuitStore.connections.length : 0;
        
        if (this._lastCompCount !== currentCompCount || this._lastConnCount !== currentConnCount) {
            this.buildElectricalNodes();
            this._lastCompCount = currentCompCount;
            this._lastConnCount = currentConnCount;
        }
        if (!CircuitStore.isSimulationActive && !this.isRunning) return;
        for (let i = 0; i < 2; i++) {
            // URUTAN 1: Logika Digital (Merespons perubahan instan)
            this.solveDigitalLogic();
            // URUTAN 2: Fisika Analog (Menghitung matriks Kirchhoff berdasarkan output digital)
            this.solveAnalogPhysics();
        }
        // URUTAN 3: Gambar ke Layar (1x per frame)
        this.updateVisuals();
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.isRunning) {
            this.animationId = requestAnimationFrame(() => this.run());
        }
    },

    // -----------------------------------------------------------------
    // FASE 1: PEMBANGUNAN NODE KELISTRIKAN
    // -----------------------------------------------------------------
    buildElectricalNodes() {
        this.nodes = [];
        this.nodeVoltage = [];
        
        const adjList = {};
        const getPinId = (compId, type, pinIndex) => `${compId}-${type}-${pinIndex}`;
        
        const addEdge = (pin1, pin2) => {
            if (!adjList[pin1]) adjList[pin1] = new Set();
            if (!adjList[pin2]) adjList[pin2] = new Set();
            adjList[pin1].add(pin2);
            adjList[pin2].add(pin1);
        };

        // Baca koneksi dari CircuitStore
        if (CircuitStore.connections) {
            CircuitStore.connections.forEach(conn => {
                const sType = conn.source.type || 'output';
                const tType = conn.target.type || 'input';
            
            const srcId = getPinId(conn.source.compId, sType, conn.source.pinIndex);
            const tgtId = getPinId(conn.target.compId, tType, conn.target.pinIndex);
            addEdge(srcId, tgtId);
        });
    }

        // Gabungkan pin-pin internal komponen wire/junction
        if (CircuitStore.components) {
            CircuitStore.components.forEach(comp => {
                if (comp.type === 'wire_1to1' || comp.type === 'wire_1to2' || comp.type === 'junction') {
                    const pins = [];
                    for (let i = 0; i < (comp.inputs || 0); i++) pins.push(getPinId(comp.id, 'input', i));
                    for (let i = 0; i < (comp.outputs || 0); i++) pins.push(getPinId(comp.id, 'output', i));
                    
                    for (let i = 0; i < pins.length - 1; i++) {
                        addEdge(pins[i], pins[i+1]);
                    }
                }
            });
        }

        // Graph Traversal untuk mengelompokkan node
        const visited = new Set();
        
        for (const pin in adjList) {
            if (!visited.has(pin)) {
                const nodeGroup = [];
                const queue = [pin];
                visited.add(pin);
                
                while (queue.length > 0) {
                    const currentPin = queue.shift();
                    nodeGroup.push(currentPin);
                    
                    adjList[currentPin].forEach(neighbor => {
                        if (!visited.has(neighbor)) {
                            visited.add(neighbor);
                            queue.push(neighbor);
                        }
                    });
                }
                
                this.nodes.push(nodeGroup);
                this.nodeVoltage.push(0);
            }
        }
    },

    // -----------------------------------------------------------------
    // FASE 2: LOGIKA DIGITAL (AND, OR, NOT, Flip-Flop, Switch)
    // -----------------------------------------------------------------
    solveDigitalLogic() {
        // Propagasi 5 kali memastikan sinyal logika merambat instan ke semua gerbang bertingkat
        for (let iter = 0; iter < 5; iter++) {
            CircuitStore.components.forEach(comp => {
                this.updateInputStates(comp);

                let clkIdx = -1;
                if (comp.type === 'ff_d' || comp.type === 'ff_t') clkIdx = 1;
                else if (comp.type === 'ff_jk' || comp.type === 'ff_sr') clkIdx = 2;
                
                let isRisingEdge = false;
                if (clkIdx !== -1) {
                    if (comp.prevClock === undefined) comp.prevClock = 0;
                    if (comp.prevClock === 0 && comp.inputStates[clkIdx] === 1) isRisingEdge = true;
                    if (iter === 4) comp.prevClock = comp.inputStates[clkIdx]; 
                }

                if (comp.outputState === undefined) comp.outputState = 0;

                // Pengaman ketat: paksa nilai input menjadi 1 atau 0 secara absolut
                const in0 = comp.inputStates[0] === 1 ? 1 : 0;
                const in1 = comp.inputStates[1] === 1 ? 1 : 0;
                const in2 = comp.inputStates[2] === 1 ? 1 : 0;
                const in3 = comp.inputStates[3] === 1 ? 1 : 0;
                const in4 = comp.inputStates[4] === 1 ? 1 : 0;

                switch (comp.type) {
                    case 'switch':
                        comp.outputState = comp.state === '1' ? 1 : 0;
                        break;
                    case 'and':
                        comp.outputState = (in0 === 1 && in1 === 1) ? 1 : 0;
                        break;
                    case 'or':
                        comp.outputState = (in0 === 1 || in1 === 1) ? 1 : 0;
                        break;
                    case 'not':
                        comp.outputState = (in0 === 0) ? 1 : 0;
                        break;
                    case 'nand':
                        comp.outputState = (in0 === 1 && in1 === 1) ? 0 : 1;
                        break;
                    case 'nor':
                        comp.outputState = (in0 === 1 || in1 === 1) ? 0 : 1;
                        break;
                    case 'xor':
                        comp.outputState = (in0 !== in1) ? 1 : 0;
                        break;
                    case 'xnor':
                        comp.outputState = (in0 === in1) ? 1 : 0;
                        break;
                    case 'clock_pulse':
                        comp.outputState = comp.state === '1' ? 1 : 0;
                        break;
                    case 'ff_d': 
                        if (in2 === 1) comp.outputState = 1;      
                        else if (in3 === 1) comp.outputState = 0; 
                        else if (isRisingEdge) comp.outputState = in0; 
                        break;
                    case 'ff_t': 
                        if (isRisingEdge && in0 === 1) {
                            comp.outputState = comp.outputState === 1 ? 0 : 1; 
                        }
                        break;
                    case 'ff_jk': 
                        if (in3 === 1) comp.outputState = 1;      
                        else if (in4 === 1) comp.outputState = 0; 
                        else if (isRisingEdge) {
                            if (in0 === 1 && in1 === 0) comp.outputState = 1;
                            else if (in0 === 0 && in1 === 1) comp.outputState = 0;
                            else if (in0 === 1 && in1 === 1) comp.outputState = comp.outputState === 1 ? 0 : 1;
                        }
                        break;
                    case 'ff_sr': 
                        if (isRisingEdge) {
                            if (in0 === 1 && in1 === 0) comp.outputState = 1;
                            else if (in0 === 0 && in1 === 1) comp.outputState = 0;
                        }
                        break;
                    case 'ic_4017':
                        // 1. Inisialisasi Memori
                        if (typeof comp.counter === 'undefined') comp.counter = 0;
                        if (!comp.outputStates) comp.outputStates = new Array(11).fill(0);
                        
                        // 2. KUNCI RISING EDGE & ANTI-STARTUP TRANSIENT
                        let isClockRising = false;
                        
                        if (comp.prevClock === undefined) {
                            // JANGAN berhitung pada frame pertama! 
                            // Tunggu sampai kelistrikan kabel stabil di iterasi terakhir (iter === 4).
                            if (iter === 4) {
                                comp.prevClock = in0; // Simpan status awal murni (0 atau 1)
                            }
                        } else {
                            // Frame normal: deteksi transisi naik dari 0 ke 1
                            if (comp.prevClock === 0 && in0 === 1) {
                                isClockRising = true;
                                comp.prevClock = 1; // Kunci agar tidak berhitung ganda
                            } else if (in0 === 0) {
                                comp.prevClock = 0; // Buka kunci saat sinyal kembali 0
                            }
                        }

                        // 3. Hukum Fisika / Logika 4017
                        if (in2 === 1) {
                            // Reset (Active HIGH) - Prioritas tertinggi
                            comp.counter = 0;
                        } else if (isClockRising && in1 === 0) {
                            // Hitung naik JIKA ada Clock naik DAN Enable sedang LOW (0)
                            comp.counter++;
                            if (comp.counter > 9) comp.counter = 0;
                        }

                        // 4. Petakan nilai counter ke output fisik Q0-Q9
                        for (let j = 0; j < 10; j++) {
                            comp.outputStates[j] = (comp.counter === j) ? 1 : 0;
                        }
                        
                        // 5. Carry Out (CO) menyala hanya pada hitungan 0 sampai 4
                        comp.outputStates[10] = (comp.counter < 5) ? 1 : 0;
                        break;
                }
            });
        }
    },

    // -----------------------------------------------------------------
    // FASE 3: ANALISIS NODAL ANALOG (Hukum Kirchhoff & Ohm)
    // -----------------------------------------------------------------
    solveAnalogPhysics() {
        if (!this.nodes || this.nodes.length === 0) return;

        // Helper untuk mencari index Node dari suatu pin
        const nodeMap = {};
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = 0; j < this.nodes[i].length; j++) {
                nodeMap[this.nodes[i][j]] = i;
            }
        }

        // Sekarang pencarian index akan berjalan instan (0 detik)
        const getNodeIndex = (compId, type, pinIndex) => {
            const pinId = `${compId}-${type}-${pinIndex}`;
            return nodeMap[pinId] !== undefined ? nodeMap[pinId] : -1;
        };

        // ─── LANGKAH 2: INISIALISASI MEMORI NEWTON-RAPHSON ───
        CircuitStore.components.forEach(comp => {
            if (comp.type === 'led' || comp.type === 'diode') {
                // 1. Memori Tebakan Awal (Initial Guess)
                // Jika baru pertama menyala, tebak tegangan LED = 0 Volt
                if (comp.vd === undefined || isNaN(comp.vd)) comp.vd = 0;
                
                // 2. Baca parameter dari UI
                const targetVf = comp.type === 'led' ? (parseFloat(comp.forwardV) || 2.2) : 0.7;
                // fullDriveI disimpan dalam miliAmpere, kita ubah ke Ampere
                const targetI = comp.type === 'led' ? ((parseFloat(comp.fullDriveI) || 10) / 1000) : 0.02; 
                
                // 3. Kalkulasi Konstanta Fisika (Hanya dihitung ulang jika user mengubah setting)
                if (comp._lastVf !== targetVf || comp._lastTargetI !== targetI) {
                    comp.Is = 1e-14; // Arus Bocor (Saturation Current) konstan 10 fA
                    
                    // Reverse-engineering Ideality Factor (n) agar kurva belok pas di Vf
                    // Rumus: n = Vf / (VT * ln(Itarget / Is))
                    comp.n = targetVf / (this.DiodePhysics.VT * Math.log(targetI / comp.Is));
                    
                    // Hambatan Internal Semikonduktor (Bulk Resistance)
                    // Mencegah arus tembus puluhan ribu Ampere (LED asli punya hambatan parasit 2 - 5 Ohm)
                    comp.Rs = 2.0; 
                    
                    comp._lastVf = targetVf;
                    comp._lastTargetI = targetI;
                }
            }
            else if (comp.type === 'seven_segment') {
                // Siapkan memori tegangan untuk 7 segmen independen (a sampai g)
                if (!comp.vd || comp.vd.length !== 7) comp.vd = [0,0,0,0,0,0,0];
                
                const targetVf = 2.2; // Tegangan tembus (Forward Voltage) khas LED Merah
                const targetI = 0.02; // Arus ideal 20mA
                
                if (comp._lastVf !== targetVf) {
                    comp.Is = 1e-14; 
                    comp.n = targetVf / (this.DiodePhysics.VT * Math.log(targetI / comp.Is));
                    comp.Rs = 2.0; // Hambatan internal agar arus tidak meledak instan
                    comp._lastVf = targetVf;
                }
            }
        });

        // 🟢 OPTIMASI PERFORMA: MAX_ITER diturunkan drastis dari 1500.
        // nodeVoltage sudah "warm-start" dari frame sebelumnya (tidak direset tiap frame),
        // jadi rangkaian yang stabil biasanya konvergen dalam puluhan iterasi saja.
        // Nilainya menyesuaikan jumlah node: rangkaian kecil dapat batas rendah,
        // rangkaian besar dapat sedikit lebih banyak, tapi tetap dibatasi (cap 300).
        const MAX_ITER = Math.min(300, Math.max(60, this.nodes.length * 3));
        const EPSILON = 0.001; 
        const STAGNATION_LIMIT = 8; // Berhenti lebih awal jika error berhenti membaik
        const time = Date.now() / 1000; 

        let lastError = Infinity;
        let stagnationCount = 0;

        for (let i = 0; i < MAX_ITER; i++) {
            let maxError = 0;
            const fixedNodes = new Array(this.nodes.length).fill(false);

            // 1. TETAPKAN TEGANGAN SUMBER (Baterai, Ground, V-Sine, Logika Digital, Switch)
            CircuitStore.components.forEach(comp => {
                if (comp.type === 'ground') {
                    const nIdx = getNodeIndex(comp.id, 'input', 0);
                    if (nIdx !== -1) { this.nodeVoltage[nIdx] = 0; fixedNodes[nIdx] = true; } // Kunci ke 0V
                } 
                else if (comp.type === 'power_terminal') {
                    const nIdx = getNodeIndex(comp.id, 'output', 0);
                    if (nIdx !== -1) { this.nodeVoltage[nIdx] = comp.customValue || 12; fixedNodes[nIdx] = true; }
                }
                else if (comp.type.startsWith('battery') || comp.type === 'vsine') {
                    const nOut = getNodeIndex(comp.id, 'output', 0); 
                    const nIn = getNodeIndex(comp.id, 'output', 1);  
                    
                    let v = 12;
                    if (comp.type.startsWith('battery')) v = comp.customValue || (comp.type === 'battery_1cell' ? 1.5 : 12);
                    if (comp.type === 'vsine') v = (comp.customValue || 12) * Math.sin(2 * Math.PI * (comp.freqValue || 1) * time);
                    
                    if (nOut !== -1 && nIn !== -1) {
                        if (fixedNodes[nIn]) {
                            this.nodeVoltage[nOut] = this.nodeVoltage[nIn] + v;
                            fixedNodes[nOut] = true;
                        } else if (fixedNodes[nOut]) {
                            this.nodeVoltage[nIn] = this.nodeVoltage[nOut] - v;
                            fixedNodes[nIn] = true;
                        } else {
                            const center = (this.nodeVoltage[nOut] + this.nodeVoltage[nIn]) / 2;
                            this.nodeVoltage[nOut] = center + (v / 2);
                            this.nodeVoltage[nIn] = center - (v / 2);
                            fixedNodes[nOut] = true; fixedNodes[nIn] = true;
                        }
                    } else if (nOut !== -1) {
                        this.nodeVoltage[nOut] = v; fixedNodes[nOut] = true;
                    } else if (nIn !== -1) {
                        this.nodeVoltage[nIn] = 0; fixedNodes[nIn] = true;
                    }
                }
                else if (['switch','and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor', 'clock_pulse', 'ff_sr', 'ff_d', 'ff_jk', 'ff_t'].includes(comp.type)) {
                    const nOut0 = getNodeIndex(comp.id, 'output', 0);
                    if (nOut0 !== -1) {
                        this.nodeVoltage[nOut0] = comp.outputState === 1 ? 5 : 0;
                        fixedNodes[nOut0] = true; // Kunci tegangan output IC
                    }
                    const nOut1 = getNodeIndex(comp.id, 'output', 1);
                    if (nOut1 !== -1) {
                        this.nodeVoltage[nOut1] = comp.outputState === 1 ? 0 : 5;
                        fixedNodes[nOut1] = true;
                    }
                }
                else if (comp.type === 'ic_4017') {
                    const nVcc = getNodeIndex(comp.id, 'input', 3);
                    const nGnd = getNodeIndex(comp.id, 'input', 4);
                    const vcc = nVcc !== -1 ? (this.nodeVoltage[nVcc] || 0) : 0;
                    const gnd = nGnd !== -1 ? (this.nodeVoltage[nGnd] || 0) : 0;
                    
                    // IC hanya memancarkan listrik JIKA VCC - GND lebih dari 2.5V (Menyala)
                    const isPowered = (vcc - gnd) > 2.5;

                    // Berikan setrum ke 11 pin Output
                    for (let j = 0; j < 11; j++) {
                        const nOut = getNodeIndex(comp.id, 'output', j);
                        if (nOut !== -1) {
                            const state = (comp.outputStates && comp.outputStates[j] === 1) ? 1 : 0;
                            // Sifat asli CMOS: Output High = VCC, Output Low = GND
                            this.nodeVoltage[nOut] = (isPowered && state === 1) ? vcc : gnd;
                            fixedNodes[nOut] = true; // Kunci node sebagai sumber tegangan mutlak
                        }
                    }
                }
                else if (comp.type === 'ic_4518') {
                    // 1. Ambil Index Node Pin Input
                    const nInClk = getNodeIndex(comp.id, 'input', 0);
                    const nInEn  = getNodeIndex(comp.id, 'input', 1);
                    const nInRst = getNodeIndex(comp.id, 'input', 2);

                    // 2. Baca Tegangan Masuk
                    const vClk = nInClk !== -1 ? (this.nodeVoltage[nInClk] || 0) : 0;
                    const vEn  = nInEn !== -1 ? (this.nodeVoltage[nInEn] || 0) : 0; 
                    const vRst = nInRst !== -1 ? (this.nodeVoltage[nInRst] || 0) : 0;

                    // 3. Konversi Tegangan ke Logika (Ambang Batas 2.5V)
                    const clkState = vClk > 2.5;
                    const rstState = vRst > 2.5;
                    const enState  = nInEn !== -1 ? vEn > 2.5 : true; 

                    // 4. Inisialisasi Memori Internal IC
                    if (comp.count === undefined) comp.count = 0;
                    if (comp.lastClk === undefined) comp.lastClk = false;

                    // 5. ALGORITMA STATE MACHINE
                    if (rstState) {
                        comp.count = 0; 
                    } else if (clkState && !comp.lastClk && enState) {
                        comp.count++;
                        if (comp.count > 9) comp.count = 0; 
                    }
                    comp.lastClk = clkState; 

                    // 6. PECAH DESIMAL KE BCD (Biner 4 Bit)
                    comp.outStates = [
                        (comp.count & 1) !== 0,
                        (comp.count & 2) !== 0,
                        (comp.count & 4) !== 0,
                        (comp.count & 8) !== 0
                    ];

                    // 7.: INJEKSI SEBAGAI SUMBER TEGANGAN MUTLAK
                    // Alih-alih menggunakan matriks sumVR, kita langsung mengunci node
                    // output ke 5V atau 0V agar jauh lebih stabil dan ringan bagi CPU!
                    for (let i = 0; i < 4; i++) {
                        const nOut = getNodeIndex(comp.id, 'output', i);
                        if (nOut !== -1) {
                            this.nodeVoltage[nOut] = comp.outStates[i] ? 5.0 : 0.0;
                            fixedNodes[nOut] = true; // Kunci tegangan
                        }
                    }
                }
                else if (comp.type === 'ic_4511') {
                    // 1. Ambil Index Node Pin Input Kiri
                    const nInA  = getNodeIndex(comp.id, 'input', 0); // Bit 1 (A)
                    const nInB  = getNodeIndex(comp.id, 'input', 1); // Bit 2 (B)
                    const nInC  = getNodeIndex(comp.id, 'input', 2); // Bit 4 (C)
                    const nInD  = getNodeIndex(comp.id, 'input', 3); // Bit 8 (D)
                    const nInLT = getNodeIndex(comp.id, 'input', 4); // Lamp Test
                    const nInBI = getNodeIndex(comp.id, 'input', 5); // Blanking
                    const nInLE = getNodeIndex(comp.id, 'input', 6); // Latch Enable

                    // 2. Baca Tegangan Kabel Masuk
                    const vA  = nInA !== -1 ? (this.nodeVoltage[nInA] || 0) : 0;
                    const vB  = nInB !== -1 ? (this.nodeVoltage[nInB] || 0) : 0;
                    const vC  = nInC !== -1 ? (this.nodeVoltage[nInC] || 0) : 0;
                    const vD  = nInD !== -1 ? (this.nodeVoltage[nInD] || 0) : 0;
                    
                    // Asumsi cerdas: LT & BI adalah Active LOW. Jika pengguna lupa
                    // memasang kabel, kita anggap mereka HIGH (5V) agar IC tetap hidup.
                    const vLT = nInLT !== -1 ? (this.nodeVoltage[nInLT] || 0) : 5.0; 
                    const vBI = nInBI !== -1 ? (this.nodeVoltage[nInBI] || 0) : 5.0; 
                    // LE adalah Active HIGH. Jika dibiarkan kosong, anggap LOW (Mengalir terus)
                    const vLE = nInLE !== -1 ? (this.nodeVoltage[nInLE] || 0) : 0; 

                    // 3. Konversi Tegangan ke Nilai Bit Matematika
                    const bitA = vA > 2.5 ? 1 : 0;
                    const bitB = vB > 2.5 ? 2 : 0;
                    const bitC = vC > 2.5 ? 4 : 0;
                    const bitD = vD > 2.5 ? 8 : 0;
                    
                    const isLT = vLT < 2.5; // Menyala jika diberi Ground
                    const isBI = vBI < 2.5; // Mati jika diberi Ground
                    const isLE = vLE > 2.5; // Terkunci jika diberi VCC

                    // 4. Inisialisasi Memori Latch (Pengunci Angka)
                    if (comp.latchedVal === undefined) comp.latchedVal = 0;

                    // 5. Update Memori HANYA jika Latch Terbuka (LE = LOW)
                    if (!isLE) {
                        comp.latchedVal = bitA + bitB + bitC + bitD;
                    }

                    // 6. KAMUS DECODER: BCD KE 7-SEGMENT (Segmen: a, b, c, d, e, f, g)
                    // Standar IC CD4511: Angka 6 tanpa atap atas, Angka 9 tanpa palang bawah
                    const segmentMap = [
                        [1,1,1,1,1,1,0], // 0
                        [0,1,1,0,0,0,0], // 1
                        [1,1,0,1,1,0,1], // 2
                        [1,1,1,1,0,0,1], // 3
                        [0,1,1,0,0,1,1], // 4
                        [1,0,1,1,0,1,1], // 5
                        [1,0,1,1,1,1,1], // 6
                        [1,1,1,0,0,0,0], // 7
                        [1,1,1,1,1,1,1], // 8
                        [1,1,1,1,0,1,1]  // 9
                    ];

                    let outSegments = [0,0,0,0,0,0,0];

                    // 7. EKSEKUSI PRIORITAS LOGIKA
                    if (isLT) {
                        outSegments = [1,1,1,1,1,1,1]; // Prioritas 1: Test semua lampu
                    } else if (isBI) {
                        outSegments = [0,0,0,0,0,0,0]; // Prioritas 2: Matikan semua lampu
                    } else {
                        // Prioritas 3: Tampilkan angka
                        if (comp.latchedVal <= 9) {
                            outSegments = segmentMap[comp.latchedVal];
                        } else {
                            // BCD Tidak Valid (10 - 15) -> Sifat asli 4511 mematikan layar
                            outSegments = [0,0,0,0,0,0,0]; 
                        }
                    }

                    // Simpan status output untuk animasi SVG (Langkah 4 nanti)
                    comp.outStates = outSegments;

                    // 8. INJEKSI KE MATRIKS: Setrum ke-7 Segmen Output!
                    for (let i = 0; i < 7; i++) {
                        const nOut = getNodeIndex(comp.id, 'output', i);
                        if (nOut !== -1) {
                            this.nodeVoltage[nOut] = outSegments[i] === 1 ? 5.0 : 0.0;
                            fixedNodes[nOut] = true;
                        }
                    }
                }
                // Output gerbang logika sebagai sumber tegangan
                const logicTypes = ['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor', 'clock_pulse', 'ff_sr', 'ff_d', 'ff_jk', 'ff_t'];
                if (logicTypes.includes(comp.type)) {
                    const nOut0 = getNodeIndex(comp.id, 'output', 0);
                    if (nOut0 !== -1) {
                        this.nodeVoltage[nOut0] = comp.outputState === 1 ? 5 : 0;
                    }
                    
                    const nOut1 = getNodeIndex(comp.id, 'output', 1);
                    if (nOut1 !== -1) {
                        this.nodeVoltage[nOut1] = comp.outputState === 1 ? 0 : 5;
                    }
                }
            });

            // 2. RELAKSASI NODAL UNTUK KOMPONEN PASIF (Hukum Arus Kirchhoff)
            const sumVR = new Array(this.nodes.length).fill(0);
            const sum1R = new Array(this.nodes.length).fill(0);

            CircuitStore.components.forEach(comp => {
                if (comp.type === 'resistor' || comp.type === 'ammeter') {
                    let r = 330;
                    if (comp.type === 'resistor') r = comp.customValue || 330;
                    else if (comp.type === 'ammeter') r = 1;
                    
                    const nIn = getNodeIndex(comp.id, 'input', 0);
                    const nOut = getNodeIndex(comp.id, 'output', 0);
                    if (nIn !== -1 && nOut !== -1) {
                        const cond = 1 / r;
                        sumVR[nIn] += this.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
                        sumVR[nOut] += this.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
                    }
                }
                else if (comp.type === 'fuse') {
                    const isBlown = comp.state === 'blown';
                    // 0.01 Ohm saat normal (kawat utuh), 1 GigaOhm saat kawat terbakar/putus
                    const r = isBlown ? 1000000000 : 1; 
                    
                    const nIn = getNodeIndex(comp.id, 'input', 0);
                    const nOut = getNodeIndex(comp.id, 'output', 0);
                    
                    if (nIn !== -1 && nOut !== -1) {
                        const cond = 1 / r;
                        sumVR[nIn] += this.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
                        sumVR[nOut] += this.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
                    }
                }
                else if (comp.type === 'led' || comp.type === 'diode') {
                    const nIn = getNodeIndex(comp.id, 'input', 0);
                    const nOut = getNodeIndex(comp.id, 'output', 0);
                    
                    if (nIn !== -1 && nOut !== -1) {
                        // Ambil tegangan aktual dari node (terhadap Ground global)
                        const vIn = this.nodeVoltage[nIn] || 0;
                        const vOut = this.nodeVoltage[nOut] || 0;
                        const vDiff = vIn - vOut;
                        
                        // 1. LIMITASI LANGKAH (DAMPING)
                        // Jangan langsung gunakan vDiff! Gunakan fungsi pengerem agar kurva
                        // eksponensial tidak meledak menghasilkan Infinity/NaN.
                        comp.vd = this.DiodePhysics.limitVoltageStep(vDiff, comp.vd);

                        // Baca batas Reverse Breakdown dari memori
                        const bV = comp.type === 'led' ? (parseFloat(comp.breakdownV) || 4.0) : 50.0;

                        let Geff = 0; // Konduktansi Efektif (1/R)
                        let Ieff = 0; // Sumber Arus Bayangan Newton-Raphson

                        if (comp.vd < -bV) {
                            // Mode REVERSE BREAKDOWN (Dioda Jebol ke arah terbalik)
                            // Hambatan merosot menjadi 10 Ohm
                            Geff = 1 / 10; 
                            Ieff = Geff * bV; // Menggeser kurva agar breakdown dimulai tepat di angka -bV
                        } 
                        else {
                            // Mode FORWARD & REVERSE LEAKAGE (Hukum Shockley Murni)
                            const lin = this.DiodePhysics.linearize(comp.vd, comp.Is, comp.n);

                            // 2. TRANSFORMASI NORTON (Menggabungkan Rs Seri ke dalam Model)
                            // Rumus SPICE: Geff = Geq / (1 + Geq * Rs)
                            //              Ieff = Ieq / (1 + Geq * Rs)
                            const denom = 1 + (lin.Geq * comp.Rs);
                            Geff = lin.Geq / denom;
                            Ieff = lin.Ieq / denom;
                        }

                        // 3. INJEKSI KE MATRIKS GAUSS-SEIDEL (Hukum Arus Kirchhoff)
                        // Arus Ieff mengalir dari Pin In ke Pin Out, sehingga membebani nIn (-) dan memompa nOut (+)
                        sumVR[nIn] += (this.nodeVoltage[nOut] * Geff) - Ieff; 
                        sum1R[nIn] += Geff;
                        
                        sumVR[nOut] += (this.nodeVoltage[nIn] * Geff) + Ieff; 
                        sum1R[nOut] += Geff;
                    }
                }
                else if (comp.type === 'seven_segment') {
                    const nOut = getNodeIndex(comp.id, 'output', 0); // Pin Common (Katoda)
                    
                    // Lakukan kalkulasi fisika eksponensial untuk ketujuh LED sekaligus!
                    for (let k = 0; k < 7; k++) { 
                        const nIn = getNodeIndex(comp.id, 'input', k); // Pin a, b, c, d, e, f, g
                        
                        if (nIn !== -1 && nOut !== -1) {
                            const vIn = this.nodeVoltage[nIn] || 0;
                            const vOutNode = this.nodeVoltage[nOut] || 0;
                            const vDiff = vIn - vOutNode;
                            
                            // Pengerem tegangan agar matematika matriks tidak meledak (NaN)
                            comp.vd[k] = this.DiodePhysics.limitVoltageStep(vDiff, comp.vd[k]);

                            let Geff = 0, Ieff = 0;
                            if (comp.vd[k] < -5.0) { 
                                // Reverse breakdown (Tembus terbalik jika disetrum minus 5V)
                                Geff = 1 / 10; 
                                Ieff = Geff * 5.0; 
                            } else {
                                // Eksekusi linearisasi Newton-Raphson untuk kurva LED
                                const lin = this.DiodePhysics.linearize(comp.vd[k], comp.Is, comp.n);
                                const denom = 1 + (lin.Geq * comp.Rs);
                                Geff = lin.Geq / denom;
                                Ieff = lin.Ieq / denom;
                            }

                            // Sedot arus dari Pin Input, buang ke Pin Output (Common)
                            sumVR[nIn] += (this.nodeVoltage[nOut] * Geff) - Ieff; 
                            sum1R[nIn] += Geff;
                            
                            sumVR[nOut] += (this.nodeVoltage[nIn] * Geff) + Ieff; 
                            sum1R[nOut] += Geff;
                        }
                    }
                }
                else if (comp.type === 'voltmeter') {
                    const nIn0 = getNodeIndex(comp.id, 'input', 0);
                    const nIn1 = getNodeIndex(comp.id, 'input', 1);
                    if (nIn0 !== -1 && nIn1 !== -1) {
                        // Impedansi internal Voltmeter 1 Mega Ohm
                        // Voltmeter akan mencuri arus super kecil dan menguras kapasitor
                        const cond = 1 / 1000000; 
                        sumVR[nIn0] += this.nodeVoltage[nIn1] * cond; sum1R[nIn0] += cond;
                        sumVR[nIn1] += this.nodeVoltage[nIn0] * cond; sum1R[nIn1] += cond;
                    }
                }
                else if (comp.type === 'oscilloscope') {
                    // Osiloskop memiliki 2 probe (Channel 1 dan Channel 2)
                    const nIn0 = getNodeIndex(comp.id, 'input', 0); // Probe CH1
                    const nIn1 = getNodeIndex(comp.id, 'input', 1); // Probe CH2
                    
                    // FISIKA NYATA: Impedansi masukan osiloskop standar adalah 10 MegaOhm
                    // Ini berfungsi sebagai "Resistor Parasitik" menuju Ground (0V).
                    // Secara komputasi, ini MENCEGAH node menjadi 'floating' (mengambang)
                    // yang bisa membuat matematika matriks meledak (NaN).
                    const rProbe = 10000000; 
                    const condProbe = 1 / rProbe;
                    
                    if (nIn0 !== -1) {
                        sumVR[nIn0] += 0 * condProbe; // Ditarik secara mikroskopis ke Ground (0V)
                        sum1R[nIn0] += condProbe;
                    }
                    if (nIn1 !== -1) {
                        sumVR[nIn1] += 0 * condProbe; 
                        sum1R[nIn1] += condProbe;
                    }
                }
                else if (comp.type === 'potentiometer') {
                    const val = comp.customValue || 10000;
                    const percent = Math.max(0, Math.min(100, parseInt(comp.state || '50')));
                    const r1 = Math.max(0.1, val * (percent / 100));         // Hambatan Kiri ke Tengah
                    const r2 = Math.max(0.1, val * ((100 - percent) / 100)); // Hambatan Kanan ke Tengah

                    const nIn0 = getNodeIndex(comp.id, 'input', 0); // Kaki Kiri
                    const nIn1 = getNodeIndex(comp.id, 'input', 1); // Kaki Kanan
                    const nOut = getNodeIndex(comp.id, 'output', 0); // Wiper (Tengah)

                    if (nIn0 !== -1 && nOut !== -1) {
                        const cond1 = 1 / r1;
                        sumVR[nIn0] += this.nodeVoltage[nOut] * cond1; sum1R[nIn0] += cond1;
                        sumVR[nOut] += this.nodeVoltage[nIn0] * cond1; sum1R[nOut] += cond1;
                    }
                    if (nIn1 !== -1 && nOut !== -1) {
                        const cond2 = 1 / r2;
                        sumVR[nIn1] += this.nodeVoltage[nOut] * cond2; sum1R[nIn1] += cond2;
                        sumVR[nOut] += this.nodeVoltage[nIn1] * cond2; sum1R[nOut] += cond2;
                    }
                }
                else if (comp.type === 'switch_spst' || comp.type === 'push_button') {
                    const isActive = comp.state === '1';
                    const r = isActive ? 0.1 : 1000000000;                    
                    const nIn = getNodeIndex(comp.id, 'input', 0);
                    const nOut = getNodeIndex(comp.id, 'output', 0);
                    
                    if (nIn !== -1 && nOut !== -1) {
                        const cond = 1 / r;
                        sumVR[nIn] += this.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
                        sumVR[nOut] += this.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
                    }
                }
                else if (comp.type === 'flasher') {
                    const halfPeriodMs = comp.customValue || 500; 
                    const halfPeriodSec = halfPeriodMs / 1000; // Ubah ke detik
                    const fullPeriod = halfPeriodSec * 2;
                    const isActive = (time % fullPeriod) < halfPeriodSec; 
                    comp.state = isActive ? '1' : '0'; // Animasi UI
                    
                    const r = isActive ? 0.1 : 1000000000;                    
                    const nIn = getNodeIndex(comp.id, 'input', 0);
                    const nOut = getNodeIndex(comp.id, 'output', 0);
                    
                    if (nIn !== -1 && nOut !== -1) {
                        const cond = 1 / r;
                        sumVR[nIn] += this.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
                        sumVR[nOut] += this.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
                    }
                }         
                else if (comp.type === 'voltage_divider') {
                    const nIn = getNodeIndex(comp.id, 'input', 0);
                    const nOut = getNodeIndex(comp.id, 'output', 0);
                    
                    const r1 = comp.r1Value !== undefined ? comp.r1Value : 10000; 
                    const r2 = comp.r2Value !== undefined ? comp.r2Value : 10000;
                    
                    // Skenario A: Pin Output dicolok ke komponen lain
                    if (nIn !== -1 && nOut !== -1) {
                        const cond1 = 1 / r1; 
                        sumVR[nIn] += this.nodeVoltage[nOut] * cond1; sum1R[nIn] += cond1;
                        sumVR[nOut] += this.nodeVoltage[nIn] * cond1; sum1R[nOut] += cond1;
                        
                        const cond2 = 1 / r2; 
                        sumVR[nOut] += 0 * cond2; // R2 ditarik ke Ground Internal
                        sum1R[nOut] += cond2;
                    } 
                    // Skenario B: Pin Output dibiarkan kosong, R1 dan R2 tetap menarik arus
                    else if (nIn !== -1 && nOut === -1) {
                        const condTotal = 1 / (r1 + r2);
                        sumVR[nIn] += 0 * condTotal; 
                        sum1R[nIn] += condTotal;
                    }
                }
                else if (['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor', 'ff_sr', 'ff_d', 'ff_jk', 'ff_t', 'logic_probe', 'ic_4518', 'ic_4511'].includes(comp.type)) {                    // Mencegah input gerbang logika mengambang (floating) dan tersedot arus bocor statis
                    const condFloat = 1 / 10000000; 
                    for (let i = 0; i < (comp.inputs || 0); i++) {
                        const nIn = getNodeIndex(comp.id, 'input', i);
                        if (nIn !== -1) {
                            sumVR[nIn] += 0 * condFloat; // Tarik paksa ke Ground (0V)
                            sum1R[nIn] += condFloat;
                        }
                    }
                }
                else if (comp.type === 'output_terminal') {
                    const nIn = getNodeIndex(comp.id, 'input', 0);
                    if (nIn !== -1) {
                        // Impedansi raksasa (10 MΩ) agar tidak menyedot arus sirkuit utama
                        const cond = 1 / 10000000; 
                        sumVR[nIn] += 0 * cond; 
                        sum1R[nIn] += cond;
                    }
                }
                else if (comp.type === 'relay' || comp.type === 'relay_5pin') {
                    // A. FISIKA KOIL (Elektromagnet Pin 0)
                    const nInC = getNodeIndex(comp.id, 'input', 0);
                    const nOutC = getNodeIndex(comp.id, 'output', 0);
                    if (nInC !== -1 && nOutC !== -1) {
                        const condC = 1 / 100; // Hambatan internal koil 100 Ohm
                        sumVR[nInC] += this.nodeVoltage[nOutC] * condC; sum1R[nInC] += condC;
                        sumVR[nOutC] += this.nodeVoltage[nInC] * condC; sum1R[nOutC] += condC;
                    }

                    // B. FISIKA SAKELAR (Mekanik Tuas Pin 1)
                    const isActive = comp.state === '1'; // Membaca hasil pemicu dari frame sebelumnya
                    
                    if (comp.type === 'relay') {
                        // Relay 4-Pin: Sakelar Normaly Open (NO)
                        const rSwitch = isActive ? 0.1 : 1000000000; // 0.1 Ohm jika Aktif, 1M Ohm jika Mati
                        const nInS = getNodeIndex(comp.id, 'input', 1);
                        const nOutS = getNodeIndex(comp.id, 'output', 1);
                        
                        if (nInS !== -1 && nOutS !== -1) {
                            const condS = 1 / rSwitch;
                            sumVR[nInS] += this.nodeVoltage[nOutS] * condS; sum1R[nInS] += condS;
                            sumVR[nOutS] += this.nodeVoltage[nInS] * condS; sum1R[nOutS] += condS;
                        }
                    } 
                    else if (comp.type === 'relay_5pin') {
                        // Relay 5-Pin: Punya NO (Normally Open) dan NC (Normally Closed)
                        const nCom = getNodeIndex(comp.id, 'input', 1); // Pin Tengah / COM
                        const nNC = getNodeIndex(comp.id, 'output', 1); // Pin NC (Tersambung saat mati)
                        const nNO = getNodeIndex(comp.id, 'output', 2); // Pin NO (Tersambung saat aktif)
                        
                        // Hitung jalur NC
                        if (nCom !== -1 && nNC !== -1) {
                            const rNC = isActive ? 1000000000 : 0.1;
                            const condNC = 1 / rNC;
                            sumVR[nCom] += this.nodeVoltage[nNC] * condNC; sum1R[nCom] += condNC;
                            sumVR[nNC] += this.nodeVoltage[nCom] * condNC; sum1R[nNC] += condNC;
                        }
                        // Hitung jalur NO
                        if (nCom !== -1 && nNO !== -1) {
                            const rNO = isActive ? 0.1 : 1000000000;
                            const condNO = 1 / rNO;
                            sumVR[nCom] += this.nodeVoltage[nNO] * condNO; sum1R[nCom] += condNO;
                            sumVR[nNO] += this.nodeVoltage[nCom] * condNO; sum1R[nNO] += condNO;
                        }
                    }
                }
                else if (['bjt_npn', 'bjt_pnp', 'mosfet_n', 'mosfet_p'].includes(comp.type)) {
                    // Pemetaan Pin berdasarkan desain ComponentDefs.js Anda
                    const nB = getNodeIndex(comp.id, 'input', 0);  // Kaki Basis (BJT) / Gate (MOSFET)
                    const nC = getNodeIndex(comp.id, 'input', 1);  // Kaki Collector (BJT) / Drain (MOSFET)
                    const nE = getNodeIndex(comp.id, 'output', 0); // Kaki Emitter (BJT) / Source (MOSFET)
                    
                    // Ambil tegangan aktual dari frame sebelumnya (untuk stabilitas loop)
                    const vB = nB !== -1 ? (this.nodeVoltage[nB] || 0) : 0;
                    const vC = nC !== -1 ? (this.nodeVoltage[nC] || 0) : 0;
                    const vE = nE !== -1 ? (this.nodeVoltage[nE] || 0) : 0;

                    let rCE = 1000000000; // Default Sakelar Terbuka (OFF - 1 GigaOhm)
                    let rBE = 1000000000; // Hambatan kaki input (Basis/Gate)

                    if (comp.type === 'bjt_npn') {
                        const vBE = vB - vE;
                        if (vBE > 0.6) {
                            rBE = Math.max(10, 500 / (vBE - 0.6 + 0.001)); 
                            rCE = Math.max(0.5, 5 / (vBE - 0.6 + 0.001));  
                        }
                    }
                    else if (comp.type === 'bjt_pnp') {
                        const vEB = vE - vB;
                        if (vEB > 0.6) {
                            rBE = Math.max(10, 500 / (vEB - 0.6 + 0.001));
                            rCE = Math.max(0.5, 5 / (vEB - 0.6 + 0.001));
                        }
                    }
                    else if (comp.type === 'mosfet_n') {
                        const vGS = vB - vE;
                        const vTh = 2.5; // Threshold Voltage (Tegangan Ambang)
                        rBE = 1000000000; // Gate adalah isolator sempurna (TIDAK menyedot arus)
                        
                        if (vGS > vTh) {
                            rCE = Math.max(0.01, 10 / Math.pow(vGS - vTh + 0.1, 2)); 
                        }
                    } 
                    else if (comp.type === 'mosfet_p') {
                        const vSG = vE - vB;
                        const vTh = 2.5;
                        rBE = 1000000000; 
                        
                        if (vSG > vTh) {
                            rCE = Math.max(0.01, 10 / Math.pow(vSG - vTh + 0.1, 2));
                        }
                    }
                    if (nC !== -1 && nE !== -1) {
                        const condCE = 1 / rCE;
                        sumVR[nC] += this.nodeVoltage[nE] * condCE; sum1R[nC] += condCE;
                        sumVR[nE] += this.nodeVoltage[nC] * condCE; sum1R[nE] += condCE;
                    }                    
                    if (nB !== -1 && nE !== -1) {
                        const condBE = 1 / rBE;
                        sumVR[nB] += this.nodeVoltage[nE] * condBE; sum1R[nB] += condBE;
                        sumVR[nE] += this.nodeVoltage[nB] * condBE; sum1R[nE] += condBE;
                    }
                }
                else if (comp.type === 'capacitor') {
                    // 🟢 1. CACHE INVALIDATION & OPTIMASI OPERASI
                    if (comp._cond === undefined || comp._lastParsedValue !== comp.customValue) {
                        // Perbaikan Time-Step Fisika: (1 detik / 60 fps) / 2 putaran = 1/120
                        const DT = 1 / 120; 
                        let cVal = 10e-6; 
                        
                        if (comp.customValue !== undefined && comp.customValue !== null) {
                            const strVal = String(comp.customValue).toLowerCase().replace(/\s/g, '');
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
                        comp._rEq = rEq; // Tetap disimpan untuk kebutuhan di Blok 2
                        
                        // 🟢 SIMPAN KONDUKTANSI LANGSUNG (Membunuh operasi pembagian di Hot Loop)
                        comp._cond = 1 / rEq; 
                        comp._lastParsedValue = comp.customValue; 
                    }

                    // 🟢 2. SOLUSI MEMORY LEAK (Menggunakan TypedArray statis)
                    if (!comp.vHistory) {
                        const startV = comp.chargeV || comp.simV || 0;
                        // Float64Array beroperasi secepat bahasa C++ dan tidak membebani Garbage Collector
                        comp.vHistory = new Float64Array([startV, startV]); 
                    }
                    
                    const v_n = comp.vHistory[0];
                    const v_n_minus_1 = comp.vHistory[1];

                    // MATEMATIKA GEAR-2 (BDF2)
                    const vEq = (4/3)*v_n - (1/3)*v_n_minus_1;
                    
                    const nIn = getNodeIndex(comp.id, 'input', 0);
                    const nOut = getNodeIndex(comp.id, 'output', 0);
                    
                    if (nIn !== -1 && nOut !== -1) {
                        // 🟢 3. HOT LOOP SANGAT RINGAN: Tidak ada pembagian, tidak ada pembuatan array baru!
                        const cond = comp._cond; 
                        sumVR[nIn] += (this.nodeVoltage[nOut] + vEq) * cond; sum1R[nIn] += cond;
                        sumVR[nOut] += (this.nodeVoltage[nIn] - vEq) * cond; sum1R[nOut] += cond;
                    }
                }
                else if (comp.type === 'motor_dc') {
                    const r = parseFloat(comp.coilR) || 15;                    
                    const nIn = getNodeIndex(comp.id, 'input', 0);
                    const nOut = getNodeIndex(comp.id, 'output', 0);

                    if (nIn !== -1 && nOut !== -1) {
                        const cond = 1 / r;
                        sumVR[nIn] += this.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
                        sumVR[nOut] += this.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
                    }
                }
                else if (comp.type === 'servo') {
                    const nSig = getNodeIndex(comp.id, 'input', 0); // Pin 0: Sinyal
                    const nVcc = getNodeIndex(comp.id, 'input', 1); // Pin 1: VCC (Power)
                    const nGnd = getNodeIndex(comp.id, 'input', 2); // Pin 2: Ground

                    // A. Jalur Sinyal (Impedansi sangat tinggi, 1 MegaOhm)
                    if (nSig !== -1 && nGnd !== -1) {
                        const condSig = 1 / 1000000;
                        sumVR[nSig] += this.nodeVoltage[nGnd] * condSig; sum1R[nSig] += condSig;
                        sumVR[nGnd] += this.nodeVoltage[nSig] * condSig; sum1R[nGnd] += condSig;
                    }

                    // B. Jalur Power Motor (Rata-rata 250 Ohm - Menarik arus stabil)
                    if (nVcc !== -1 && nGnd !== -1) {
                        const condVcc = 1 / 250;
                        sumVR[nVcc] += this.nodeVoltage[nGnd] * condVcc; sum1R[nVcc] += condVcc;
                        sumVR[nGnd] += this.nodeVoltage[nVcc] * condVcc; sum1R[nGnd] += condVcc;
                    }
                }
                else if (comp.type === 'solenoid') {
                    // Hambatan internal kumparan solenoid (misal: 100 Ohm)
                    const r = 100; 
                    
                    const nIn = getNodeIndex(comp.id, 'input', 0);
                    const nOut = getNodeIndex(comp.id, 'output', 0);
                    
                    if (nIn !== -1 && nOut !== -1) {
                        const cond = 1 / r;
                        sumVR[nIn] += this.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
                        sumVR[nOut] += this.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
                    }
                }
                else if (['ldr', 'thermistor_ntc', 'thermistor_ptc'].includes(comp.type)) {
                    let val = parseFloat(comp.state);
                    if (isNaN(val)) val = 50; // Hanya gunakan 50 jika datanya benar-benar kosong/rusak
                    
                    let r = 1000;

                    if (comp.type === 'ldr') {
                        r = 100 + (1000000 - 100) * Math.pow(1 - (val / 100), 3);
                    }
                    else if (comp.type === 'thermistor_ntc') {
                        // Persamaan Fisika Steinhart-Hart untuk NTC
                        const r25 = comp.r25 !== undefined ? comp.r25 : 10000;
                        const beta = comp.beta !== undefined ? comp.beta : 3950;
                        const T_kelvin = val + 273.15;
                        
                        r = r25 * Math.exp(beta * ((1 / T_kelvin) - (1 / 298.15)));
                        if (r < 0.1) r = 0.1; // Limitasi batas bawah agar simulasi tidak eror
                    } 
                    else if (comp.type === 'thermistor_ptc') {
                        // Persamaan Fisika PTC (R25 dan Koefisien Alpha)
                        const r25 = comp.r25 !== undefined ? comp.r25 : 100;
                        const alpha = comp.alpha !== undefined ? comp.alpha : 0.05;
                        
                        // Menghitung resistansi relatif terhadap 25 derajat Celcius
                        r = r25 * Math.exp(alpha * (val - 25)); 
                        if (r > 1000000000) r = 1000000000; // Limitasi isolator mutlak
                    }

                    const nIn = getNodeIndex(comp.id, 'input', 0);
                    const nOut = getNodeIndex(comp.id, 'output', 0);
                    if (nIn !== -1 && nOut !== -1) {
                        const cond = 1 / r;
                        sumVR[nIn] += this.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
                        sumVR[nOut] += this.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
                    }
                }
                else if (comp.type === 'potentiometer') {
                    let val = parseFloat(comp.state);
                    if (isNaN(val)) val = 50; 
                    const maxR = comp.customValue || 10000;
                    
                    // Membelah hambatan ke Kiri (12V) dan ke Kanan (-12V)
                    let rTop = maxR * (1 - (val / 100)); 
                    let rBot = maxR * (val / 100);       
                    
                    // Cegah nilai nol mutlak agar matematika mesin tidak meledak
                    if (rTop < 0.1) rTop = 0.1;
                    if (rBot < 0.1) rBot = 0.1;

                    const nIn0 = getNodeIndex(comp.id, 'input', 0);  // Kaki Kiri
                    const nIn1 = getNodeIndex(comp.id, 'input', 1);  // Kaki Kanan
                    const nOut = getNodeIndex(comp.id, 'output', 0); // Kaki Tengah (Wiper)

                    if (nOut !== -1) {
                        if (nIn0 !== -1) {
                            const cTop = 1 / rTop;
                            sumVR[nIn0] += this.nodeVoltage[nOut] * cTop; sum1R[nIn0] += cTop;
                            sumVR[nOut] += this.nodeVoltage[nIn0] * cTop; sum1R[nOut] += cTop;
                        }
                        if (nIn1 !== -1) {
                            const cBot = 1 / rBot;
                            sumVR[nIn1] += this.nodeVoltage[nOut] * cBot; sum1R[nIn1] += cBot;
                            sumVR[nOut] += this.nodeVoltage[nIn1] * cBot; sum1R[nOut] += cBot;
                        }
                    }
                }
                else if (comp.type === 'opamp') {
                    // Penyesuaian Pin UI (Atas = Positif, Bawah = Negatif)
                    const nInPlus = getNodeIndex(comp.id, 'input', 0);  
                    const nInMinus = getNodeIndex(comp.id, 'input', 1); 
                    const nOut = getNodeIndex(comp.id, 'output', 0);
                    
                    // 1. Impedansi Input Sangat Tinggi (10 MegaOhm)
                    const rIn = 10000000;
                    const condIn = 1 / rIn;
                    if (nInMinus !== -1) sum1R[nInMinus] += condIn;
                    if (nInPlus !== -1) sum1R[nInPlus] += condIn;

                    // 2. ALGORITMA GAUSS-SEIDEL DAMPING (Pencegah Osilasi)
                    if (nOut !== -1) {
                        const vMinus = nInMinus !== -1 ? (this.nodeVoltage[nInMinus] || 0) : 0;
                        const vPlus = nInPlus !== -1 ? (this.nodeVoltage[nInPlus] || 0) : 0;
                        
                        // Ambil sisa tegangan output dari langkah iterasi sebelumnya
                        let currentVout = this.nodeVoltage[nOut] || 0;
                        // KOREKSI ERROR: Geser output secara halus untuk memaksa V- sama dengan V+
                        let diff = vPlus - vMinus;
                        // K-Factor 1.5 ini adalah kunci rahasia agar kalkulasi tidak meledak!
                        let vOutTarget = currentVout + (diff * 1.5); 
                        
                        // 1. Ambil batas saturasi dari memori (Gunakan default 15 dan -15 jika kosong)
                        const maxPos = comp.posRail !== undefined ? comp.posRail : 15;
                        const maxNeg = comp.negRail !== undefined ? comp.negRail : -15;
                        
                        // 2. Potong (clipping) sinyal berdasarkan angka dinamis dari UI!
                        if (vOutTarget > maxPos) vOutTarget = maxPos;
                        if (vOutTarget < maxNeg) vOutTarget = maxNeg;
                        
                        const rOut = 10; 
                        const condOut = 1 / rOut;
                        
                        sumVR[nOut] += vOutTarget * condOut;
                        sum1R[nOut] += condOut;
                    }
                }
                else if (comp.type === 'opamp_5pin') {
                    const nInPlus = getNodeIndex(comp.id, 'input', 0);  
                    const nInMinus = getNodeIndex(comp.id, 'input', 1); 
                    const nVPlus = getNodeIndex(comp.id, 'input', 2);   // Pin Power V+
                    const nVMinus = getNodeIndex(comp.id, 'input', 3);  // Pin Power V-
                    const nOut = getNodeIndex(comp.id, 'output', 0);
                    
                    // 1. Impedansi Input Sangat Tinggi
                    const rIn = 10000000;
                    const condIn = 1 / rIn;
                    if (nInMinus !== -1) sum1R[nInMinus] += condIn;
                    if (nInPlus !== -1) sum1R[nInPlus] += condIn;

                    // 2. ALGORITMA GAUSS-SEIDEL DENGAN CLIPPING DINAMIS
                    if (nOut !== -1) {
                        const vMinus = nInMinus !== -1 ? (this.nodeVoltage[nInMinus] || 0) : 0;
                        const vPlus = nInPlus !== -1 ? (this.nodeVoltage[nInPlus] || 0) : 0;
                        
                        // BACA TEGANGAN POWER SUPPLY DARI KABEL YANG TERCOLOK!
                        // Jika tidak dicolok, Op-Amp akan mati (0V)
                        let vPosSupply = nVPlus !== -1 ? (this.nodeVoltage[nVPlus] || 0) : 0; 
                        let vNegSupply = nVMinus !== -1 ? (this.nodeVoltage[nVMinus] || 0) : 0; 

                        let currentVout = this.nodeVoltage[nOut] || 0;
                        let diff = vPlus - vMinus;
                        let vOutTarget = currentVout + (diff * 1.5); 
                        
                        // FISIKA SATURASI SEJATI (CLIPPING):
                        // Output Op-Amp MUSTAHIL melebihi voltase baterai yang Anda pasangkan!
                        if (vOutTarget > vPosSupply) vOutTarget = vPosSupply;
                        if (vOutTarget < vNegSupply) vOutTarget = vNegSupply;
                        
                        const rOut = 10; 
                        const condOut = 1 / rOut;
                        
                        sumVR[nOut] += vOutTarget * condOut;
                        sum1R[nOut] += condOut;
                    }
                }
                else if (comp.type === 'ic_555') {
                    const nIn0 = getNodeIndex(comp.id, 'input', 0); // GND (Pin 1)
                    const nIn1 = getNodeIndex(comp.id, 'input', 1); // TRIG (Pin 2)
                    const nIn2 = getNodeIndex(comp.id, 'input', 2); // RESET (Pin 4)
                    const nIn3 = getNodeIndex(comp.id, 'input', 3); // CTRL (Pin 5)
                    const nIn4 = getNodeIndex(comp.id, 'input', 4); // THR (Pin 6)
                    const nIn5 = getNodeIndex(comp.id, 'input', 5); // VCC (Pin 8)
                    const nOut0 = getNodeIndex(comp.id, 'output', 0); // OUT (Pin 3)
                    const nOut1 = getNodeIndex(comp.id, 'output', 1); // DISCH (Pin 7)

                    // Mengambil tegangan dasar
                    const vGnd = nIn0 !== -1 ? (this.nodeVoltage[nIn0] || 0) : 0;
                    const vVcc = nIn5 !== -1 ? (this.nodeVoltage[nIn5] || 0) : 0;
                    
                    // ==========================================
                    // 1. PENCEGAH FLOATING PINS (Tarik ke batas aman)
                    // ==========================================
                    const condFloat = 1 / 10000000; 
                    if (nIn1 !== -1 && nIn0 !== -1) { sumVR[nIn1] += vGnd * condFloat; sum1R[nIn1] += condFloat; }
                    if (nIn2 !== -1 && nIn5 !== -1) { sumVR[nIn2] += vVcc * condFloat; sum1R[nIn2] += condFloat; }
                    if (nIn4 !== -1 && nIn0 !== -1) { sumVR[nIn4] += vGnd * condFloat; sum1R[nIn4] += condFloat; }

                    // ==========================================
                    // 2. VOLTAGE DIVIDER INTERNAL (3x 5k Ohm)
                    // ==========================================
                    if (nIn5 !== -1 && nIn3 !== -1) {
                        const cond5k = 1 / 5000; 
                        sumVR[nIn5] += this.nodeVoltage[nIn3] * cond5k; sum1R[nIn5] += cond5k;
                        sumVR[nIn3] += this.nodeVoltage[nIn5] * cond5k; sum1R[nIn3] += cond5k;
                    }
                    if (nIn3 !== -1 && nIn0 !== -1) {
                        const cond10k = 1 / 10000; 
                        sumVR[nIn3] += this.nodeVoltage[nIn0] * cond10k; sum1R[nIn3] += cond10k;
                        sumVR[nIn0] += this.nodeVoltage[nIn3] * cond10k; sum1R[nIn0] += cond10k;
                    }

                    // ==========================================
                    // 3. LOGIKA MEMORI (SR LATCH) - TERKUNCI!
                    // ==========================================
                    if (typeof comp.internalState === 'undefined') comp.internalState = 0;
                    
                    // 🟢 KUNCI ROOT CAUSE: Hanya ambil keputusan pada tebakan pertama (i === 0)
                    // Di iterasi 1 hingga 1499, status Latch AKAN DIKUNCI MATI!
                    if (i === 0) {
                        const vTrig = nIn1 !== -1 ? (this.nodeVoltage[nIn1] || 0) : vVcc;
                        const vThr = nIn4 !== -1 ? (this.nodeVoltage[nIn4] || 0) : 0;
                        const vRst = nIn2 !== -1 ? (this.nodeVoltage[nIn2] || 0) : vVcc; 
                        
                        const vCtrl = nIn3 !== -1 ? (this.nodeVoltage[nIn3] || 0) : (vGnd + (vVcc - vGnd) * 0.666);
                        const vUpper = vCtrl;
                        const vLower = vGnd + (vCtrl - vGnd) / 2;

                        if (vRst - vGnd < 0.7) {
                            comp.internalState = 0; // 1. RESET (Prioritas Tertinggi)
                        } else if (vTrig - vGnd <= vLower - vGnd) {
                            comp.internalState = 1; // 2. SET / TRIGGER (Prioritas Kedua)
                        } else if (vThr - vGnd >= vUpper - vGnd) {
                            comp.internalState = 0; // 3. RESET / THRESHOLD (Prioritas Ketiga)
                        }
                    }
                    
                    comp.outputState = comp.internalState;

                    // ==========================================
                    // 4. OUTPUT CURRENT LIMIT & DISCHARGE PIN
                    // (Hanya mematuhi status yang sudah dikunci oleh i===0)
                    // ==========================================
                    if (nOut0 !== -1) {
                        const rOut = 15; 
                        const condOut = 1 / rOut;
                        const targetV = comp.internalState === 1 ? vVcc : vGnd;
                        
                        sumVR[nOut0] += targetV * condOut;
                        sum1R[nOut0] += condOut;
                        
                        if (comp.internalState === 1 && nIn5 !== -1) {
                            sumVR[nIn5] += this.nodeVoltage[nOut0] * condOut; sum1R[nIn5] += condOut;
                        } else if (comp.internalState === 0 && nIn0 !== -1) {
                            sumVR[nIn0] += this.nodeVoltage[nOut0] * condOut; sum1R[nIn0] += condOut;
                        }
                    }

                    if (nOut1 !== -1 && nIn0 !== -1) {
                        const rDisch = comp.internalState === 0 ? 15 : 1000000000; 
                        const condDisch = 1 / rDisch;
                        sumVR[nOut1] += this.nodeVoltage[nIn0] * condDisch; sum1R[nOut1] += condDisch;
                        sumVR[nIn0] += this.nodeVoltage[nOut1] * condDisch; sum1R[nIn0] += condDisch;
                    }
                }
                else if (comp.type === 'ic_4017') {
                    const nGnd = getNodeIndex(comp.id, 'input', 4);
                    const vGnd = nGnd !== -1 ? (this.nodeVoltage[nGnd] || 0) : 0;
                    
                    // Pasang resistor parasitik internal 10 MegaOhm
                    // Ini menarik pin yang tidak dicolok ke Ground agar tidak mengambang (Floating)
                    const condFloat = 1 / 10000000; 
                    
                    // Terapkan perlindungan ini ke pin CLK (0), ENA (1), RST (2)
                    for (let j = 0; j < 3; j++) {
                        const nIn = getNodeIndex(comp.id, 'input', j);
                        if (nIn !== -1 && nGnd !== -1) {
                            sumVR[nIn] += this.nodeVoltage[nGnd] * condFloat; sum1R[nIn] += condFloat;
                            sumVR[nGnd] += this.nodeVoltage[nIn] * condFloat; sum1R[nGnd] += condFloat;
                        }
                    }
                }
            });

            // Terapkan kalkulasi relaksasi HANYA pada node yang TIDAK terkunci (Bukan Ground/Power)
            for (let n = 0; n < this.nodes.length; n++) {
                if (sum1R[n] > 0 && !fixedNodes[n]) { 
                    const newVal = sumVR[n] / sum1R[n];
                    const blendedVal = (this.nodeVoltage[n] * 0.5) + (newVal * 0.5);
                    
                    // 🟢 Hitung seberapa besar tegangan berubah di iterasi ini
                    const diff = Math.abs(blendedVal - this.nodeVoltage[n]);
                    if (diff > maxError) maxError = diff;
                    
                    this.nodeVoltage[n] = blendedVal;
                }
            }

            // Jika tidak ada perubahan tegangan yang berarti, hentikan loop!
            if (maxError < EPSILON) {
                break; 
            }

            // 🟢 DETEKSI STAGNASI: rangkaian yang berosilasi (mis. feedback loop pada
            // op-amp, ic_555, atau relay) tidak akan pernah turun di bawah EPSILON.
            // Daripada menghabiskan sisa iterasi tanpa hasil, hentikan begitu
            // perbaikan error sudah tidak berarti selama beberapa iterasi berturut-turut.
            if (Math.abs(maxError - lastError) < EPSILON * 0.1) {
                stagnationCount++;
                if (stagnationCount >= STAGNATION_LIMIT) break;
            } else {
                stagnationCount = 0;
            }
            lastError = maxError;
        }
        
        // 3. TERAPKAN HASIL KE KOMPONEN
        CircuitStore.components.forEach(comp => {
            if (comp.type === 'resistor' || comp.type === 'ammeter') {
                const nIn = getNodeIndex(comp.id, 'input', 0);
                const nOut = getNodeIndex(comp.id, 'output', 0);
                const vIn = nIn !== -1 ? this.nodeVoltage[nIn] : 0;
                const vOut = nOut !== -1 ? this.nodeVoltage[nOut] : 0;
                const vDiff = vIn - vOut;
                
                if (comp.type === 'resistor') {
                    comp.simV = Math.abs(vDiff); 
                    comp.simI = comp.simV / (comp.customValue || 330);
                } else if (comp.type === 'ammeter') {
                    comp.simV = Math.abs(vDiff);
                    comp.simI = vDiff / 1; 
                }
            }
            else if (comp.type === 'led' || comp.type === 'diode') {
                const nIn = getNodeIndex(comp.id, 'input', 0);
                const nOut = getNodeIndex(comp.id, 'output', 0);
                const vDiff = (nIn !== -1 ? this.nodeVoltage[nIn] : 0) - (nOut !== -1 ? this.nodeVoltage[nOut] : 0);
                
                comp.simV = vDiff; 
                
                // Hitung arus nyata (I) berdasarkan tegangan final dan Persamaan Shockley
                if (comp.vd !== undefined && comp.n !== undefined) {
                    const lin = this.DiodePhysics.linearize(comp.vd, comp.Is, comp.n);
                    comp.simI = lin.Id; // Arus eksponensial sejati
                } else {
                    comp.simI = 0;
                }
                
                // CEK LED OVERCURRENT (Dinamis Latching / Prove It Works)
                if (comp.type === 'led') {
                    const fullDriveI_Ampere = (parseFloat(comp.fullDriveI) || 10) / 1000;
                    const maxPeakI = fullDriveI_Ampere * 5; 
                    
                    const actualI = comp.simI; // Simpan arus asli hitungan matriks
                    
                    if (actualI > maxPeakI) {
                        // KONDISI 1: Arus melebihi batas -> KUNCI STATUS ERROR
                        comp.isOvercurrent = true; 
                        comp.simI = 0; // Matikan cahaya LED secara paksa
                        
                        if (!comp.hasWarned) {
                            if (typeof UIManager !== 'undefined') {
                                UIManager.showToast(`⚠️ Peringatan: Forward current melebihi batas maksimum untuk LED L${comp.id}`, 4000);
                            }
                            comp.hasWarned = true;
                        }
                    } 
                    else if (actualI > 0.000001 && actualI <= maxPeakI) {
                        // KONDISI 2: Arus SUDAH SESUAI (Ada arus mengalir, tapi aman di bawah batas)
                        // BUKTI BERHASIL! -> PULIHKAN LED SECARA OTOMATIS
                        comp.isOvercurrent = false;
                        comp.hasWarned = false;
                    } 
                    else if (comp.isOvercurrent) {
                        // KONDISI 3: TIDAK ADA ARUS (Baterai dicabut / Saklar OFF)
                        // TAPI LED sebelumnya sedang error -> TAHAN STATUS ERROR-NYA
                        comp.simI = 0; 
                    }
                }
            }
            else if (comp.type === 'seven_segment') {
                if (!comp.simI_segs) comp.simI_segs = [0,0,0,0,0,0,0];
                
                // Menerjemahkan sisa tegangan komputasi menjadi nilai Arus (Ampere) nyata
                for (let k = 0; k < 7; k++) {
                    if (comp.vd && comp.vd[k] !== undefined && comp.n !== undefined) {
                        const lin = this.DiodePhysics.linearize(comp.vd[k], comp.Is, comp.n);
                        comp.simI_segs[k] = lin.Id; // Simpan arus riil untuk tiap segmen
                    } else {
                        comp.simI_segs[k] = 0;
                    }
                }
            }
            else if (comp.type === 'fuse') {
                    const nIn = getNodeIndex(comp.id, 'input', 0);
                    const nOut = getNodeIndex(comp.id, 'output', 0);
                    
                    const vIn = nIn !== -1 ? this.nodeVoltage[nIn] : 0;
                    const vOut = nOut !== -1 ? this.nodeVoltage[nOut] : 0;
                    
                    const isBlown = comp.state === 'blown';
                    const r = isBlown ? 1000000000 : 1;
                    
                    comp.simV = Math.abs(vIn - vOut);
                    comp.simI = (vIn - vOut) / r; // Hitung Arus (Hukum Ohm)
                    
                    // CEK BATAS MAKSIMAL ARUS:
                    // Nilai batas Ampere diambil dari memori (bawaannya 10A)
                    const maxAmpere = comp.customValue || 10;
                    
                    if (!isBlown && Math.abs(comp.simI) > maxAmpere) {
                        comp.state = 'blown'; // ARUS BERLEBIH! SEKERING TERBAKAR!
                    }
                }
            else if (comp.type === 'voltmeter') {
                const nIn0 = getNodeIndex(comp.id, 'input', 0);
                const nIn1 = getNodeIndex(comp.id, 'input', 1);
                const v0 = nIn0 !== -1 ? this.nodeVoltage[nIn0] : 0;
                const v1 = nIn1 !== -1 ? this.nodeVoltage[nIn1] : 0;
                comp.simV = v0 - v1;
            }
            else if (comp.type === 'oscilloscope') {
                const nIn0 = getNodeIndex(comp.id, 'input', 0); // Kaki CH1
                const nIn1 = getNodeIndex(comp.id, 'input', 1); // Kaki CH2
                
                // BACA TEGANGAN NODAL:
                // Tegangan diukur secara absolut terhadap Global Ground (0V).
                // ComponentDefs.js sudah di-program untuk membaca 'simV' (CH1) dan 'simV2' (CH2).
                comp.simV = nIn0 !== -1 ? this.nodeVoltage[nIn0] : 0;
                comp.simV2 = nIn1 !== -1 ? this.nodeVoltage[nIn1] : 0;
            }
            else if (comp.type === 'logic_probe') {
                const nIn = getNodeIndex(comp.id, 'input', 0);
                if (nIn !== -1) {
                    const v = this.nodeVoltage[nIn];
                    if (v > 2.5) comp.logicState = '1';
                    else if (v < 0.8) comp.logicState = '0';
                    else comp.logicState = 'Z';
                } else {
                    comp.logicState = 'Z';
                }
            }
            else if (comp.type === 'output_terminal') {
                const nIn = getNodeIndex(comp.id, 'input', 0);
                comp.simV = nIn !== -1 ? this.nodeVoltage[nIn] : 0;
            }
            else if (comp.type === 'voltage_divider') {
                const nIn = getNodeIndex(comp.id, 'input', 0);
                const nOut = getNodeIndex(comp.id, 'output', 0);
                
                let vIn = nIn !== -1 ? this.nodeVoltage[nIn] : 0;
                let vOut = nOut !== -1 ? this.nodeVoltage[nOut] : 0;
                
               const r1 = comp.r1Value !== undefined ? comp.r1Value : 10000;
               const r2 = comp.r2Value !== undefined ? comp.r2Value : 10000;

                // Jika pin output kosong, terapkan rumus murni (Persis seperti rumus Anda!)
                if (nOut === -1 && nIn !== -1) {
                    vOut = vIn * (r2 / (r1 + r2));
                }
                
                // KALKULASI V1 (Tegangan jatuh di R1) dan V2 (Tegangan sisa di R2)
                let v1 = Math.abs(vIn - vOut);
                let v2 = Math.abs(vOut);
                
                comp.simV = vOut; // Simpan Vout utama
                comp.v1 = v1;     // Simpan V1 untuk ComponentDefs
                comp.v2 = v2;     // Simpan V2 untuk ComponentDefs
            }
            else if (comp.type === 'relay' || comp.type === 'relay_5pin') {
                    const nInC = getNodeIndex(comp.id, 'input', 0);
                    const nOutC = getNodeIndex(comp.id, 'output', 0);
                    const vIn = nInC !== -1 ? this.nodeVoltage[nInC] : 0;
                    const vOut = nOutC !== -1 ? this.nodeVoltage[nOutC] : 0;
                    const vDiff = Math.abs(vIn - vOut);
                    
                    // Aktifkan mekanik sakelar untuk frame berikutnya jika V > 3.0V
                    // (Ini menyimulasikan jeda mekanik nyata pada Relay fisik)
                    comp.state = vDiff > 3.0 ? '1' : '0'; 
                }
                else if (comp.type === 'motor_dc') {
                    const nIn = getNodeIndex(comp.id, 'input', 0);
                    const nOut = getNodeIndex(comp.id, 'output', 0);
                    
                    const vIn = nIn !== -1 ? this.nodeVoltage[nIn] : 0;
                    const vOut = nOut !== -1 ? this.nodeVoltage[nOut] : 0;
                    const vDiff = vIn - vOut; 
                    
                    const r = parseFloat(comp.coilR) || 15;
                    const ratedV = parseFloat(comp.ratedV) || 12;
                    const maxRpm = parseFloat(comp.maxRpm) || 3000;
                    
                    comp.simV = Math.abs(vDiff);
                    comp.simI = comp.simV / r; 
                    
                    // 1. Hitung Target RPM ideal secara kelistrikan
                    const rpmPerVolt = maxRpm / ratedV;
                    const targetRpm = vDiff * rpmPerVolt;
                    
                    if (typeof comp.currentRpm === 'undefined') comp.currentRpm = 0;
                    
                    // 2. FISIKA TORSI (Batas Akselerasi Linear)
                    // maxAccel = Angka ini mengatur seberapa kuat torsi motor menarik beban.
                    // 50 RPM per frame (di 60 FPS) berarti butuh 1 detik untuk mencapai 3000 RPM,
                    // dan butuh hampir 7 detik untuk mencapai 20.000 RPM!
                    const maxAccel = 50; 
                    
                    // 3. Tarikan karet mekanis (Inersia gesekan)
                    let step = (targetRpm - comp.currentRpm) * 0.05; 
                    
                    // 4. PENGUNCI TORSI REALISTIS
                    // Jika tarikan karetnya melebihi tenaga maksimal mesin, potong ke tenaga maksimal!
                    if (step > maxAccel) step = maxAccel;
                    if (step < -maxAccel) step = -maxAccel;
                    
                    comp.currentRpm += step;
                    
                    comp.rpm = Math.round(comp.currentRpm);
                }
                else if (comp.type === 'servo') {
                    const nSig = getNodeIndex(comp.id, 'input', 0);
                    const nVcc = getNodeIndex(comp.id, 'input', 1);
                    const nGnd = getNodeIndex(comp.id, 'input', 2);

                    const vSig = nSig !== -1 ? this.nodeVoltage[nSig] : 0;
                    const vVcc = nVcc !== -1 ? this.nodeVoltage[nVcc] : 0;
                    const vGnd = nGnd !== -1 ? this.nodeVoltage[nGnd] : 0;

                    const voltPower = vVcc - vGnd;
                    const voltSignal = vSig - vGnd;

                    comp.simV = Math.abs(voltPower); // Pantau tegangan daya
                    
                    // 1. Servo butuh minimal 3 Volt untuk menyala
                    if (voltPower > 3.0) {
                        comp.isPowered = true;

                        // 2. Menerjemahkan Tegangan ke Sudut (0V = 0 derajat, 5V = 180 derajat)
                        let targetAngle = 0;
                        if (voltPower > 0) {
                            targetAngle = (voltSignal / voltPower) * 180;
                        }
                        // Limitasi rotasi mekanis (Mentok di 0 atau 180)
                        if (targetAngle > 180) targetAngle = 180;
                        if (targetAngle < 0) targetAngle = 0;

                        if (typeof comp.servoAngle === 'undefined') comp.servoAngle = 0;

                        // 3. FISIKA INERSIA MEKANIK (Damping)
                        // Efek "Karet Mekanis": Servo tidak melompat instan, tapi berputar bertahap
                        let diff = targetAngle - comp.servoAngle;
                        let step = diff * 0.1; // Menggeser perlahan menuju target
                        
                        // Batas kecepatan maksimum motor (Maks 4 derajat per frame layar)
                        if (step > 4) step = 4;
                        if (step < -4) step = -4;

                        // Kunci ke posisi presisi jika sudah sangat dekat (mencegah getaran micro/jitter)
                        if (Math.abs(diff) < 0.1) {
                            comp.servoAngle = targetAngle;
                        } else {
                            comp.servoAngle += step;
                        }
                    } else {
                        // Jika kurang dari 3V, matikan mesin (Servo akan "beku" di sudut terakhirnya)
                        comp.isPowered = false;
                    }
                }
                else if (comp.type === 'solenoid') {
                    const nIn = getNodeIndex(comp.id, 'input', 0);
                    const nOut = getNodeIndex(comp.id, 'output', 0);
                    
                    const vIn = nIn !== -1 ? this.nodeVoltage[nIn] : 0;
                    const vOut = nOut !== -1 ? this.nodeVoltage[nOut] : 0;
                    
                    // Tegangan jepit pada koil
                    comp.simV = Math.abs(vIn - vOut);
                    
                    // ==========================================
                    // 1. PARAMETER FISIKA YANG SUDAH DIKALIBRASI
                    // ==========================================
                    const R = 100;        // Hambatan kawat (Ohm)
                    const L = 2.0;        // Induktansi (Henry) - Sengaja diperbesar agar efek Soft-Start terlihat
                    const dt = 1 / 120;     // Waktu per frame (60 FPS)
                    
                    // ==========================================
                    // 2. EFEK INDUKTANSI (Soft-Start & Back-EMF)
                    // Menggunakan metode Eksponensial yang 100% Anti-Meledak
                    // ==========================================
                    if (typeof comp.simI === 'undefined' || isNaN(comp.simI)) comp.simI = 0;
                    
                    const targetI = comp.simV / R; // Arus maksimal jika sakelar ditahan lama (Hukum Ohm)
                    const decay = Math.exp(-dt / (L / R)); // Kecepatan induktor mengejar arus
                    
                    // Arus nyata merangkak naik/turun perlahan secara eksponensial!
                    comp.simI = targetI + (comp.simI - targetI) * decay;
                    
                    // Hilangkan sisa arus mikroskopis saat mati total
                    if (comp.simI < 0.0001 && comp.simV < 0.1) comp.simI = 0;

                    // ==========================================
                    // 3. FISIKA MEKANIK (Gaya, Pegas, Inersia)
                    // ==========================================
                    const mass = 0.02;       // Massa piston: 20 gram
                    const k_spring = 2.0;    // Kekuatan Pegas: 2 Newton/mm
                    const damping = 0.5;     // Gesekan dinding silinder: 0.5 N.s/mm
                    const k_magnet = 2000;   // Konstanta Kuat Magnet
                    const maxStroke = 12;    // Jarak tarikan maksimal: 12 mm
                    
                    if (typeof comp.plungerPos === 'undefined' || isNaN(comp.plungerPos)) comp.plungerPos = 0;
                    if (typeof comp.plungerVel === 'undefined' || isNaN(comp.plungerVel)) comp.plungerVel = 0;
                    
                    // A. Gaya Tarik Elektromagnetik (Berbanding lurus kuadrat arus)
                    let F_magnet = k_magnet * (comp.simI * comp.simI); 
                    
                    // B. Gaya Pegas Penolak (Menarik piston keluar berdasar Hukum Hooke)
                    let F_spring = k_spring * comp.plungerPos;
                    
                    // C. Gaya Gesekan Udara/Pelumas (Melawan kecepatan gerak piston)
                    let F_damping = damping * comp.plungerVel;
                    
                    // D. Total Gaya & Hukum Newton II (F = m * a)
                    let F_net = F_magnet - F_spring - F_damping;
                    let acc = F_net / mass; 
                    
                    // Integrasi Posisi (Gerakan Real-Time)
                    comp.plungerVel += acc * dt;
                    comp.plungerPos += comp.plungerVel * dt;
                    
                    // ==========================================
                    // 4. BATASAN BENTURAN (Crash Limit)
                    // ==========================================
                    if (comp.plungerPos >= maxStroke) {
                        comp.plungerPos = maxStroke;
                        comp.plungerVel = 0; // Energi kinetik hancur saat nabrak di dalam
                    } else if (comp.plungerPos <= 0) {
                        comp.plungerPos = 0;
                        comp.plungerVel = 0; // Energi kinetik hancur saat mentok di luar
                    }

                    // Monitoring Status Persentase Tarikan (Untuk Sensor Eksternal/UI)
                    comp.strokePercent = (comp.plungerPos / maxStroke) * 100;
                }
                else if (comp.type === 'capacitor') {
                    const nIn = getNodeIndex(comp.id, 'input', 0);
                    const nOut = getNodeIndex(comp.id, 'output', 0);
                    const vIn = nIn !== -1 ? this.nodeVoltage[nIn] : 0;
                    const vOut = nOut !== -1 ? this.nodeVoltage[nOut] : 0;
                    
                    // Safety check untuk berjaga-jaga
                    if (!comp.vHistory) {
                        const startV = comp.chargeV || comp.simV || 0;
                        comp.vHistory = [startV, startV]; 
                    }

                    const v_n = comp.vHistory[0];
                    const v_n_minus_1 = comp.vHistory[1];

                    // Ambil hambatan Gear-2 yang sudah dihitung oleh Blok 1
                    // Fallback aman jika _rEq tidak sengaja terhapus: (2 * DT) / (3 * 10uF)
                    const rEq = comp._rEq || ((2 * (1 / 120)) / (3 * 10e-6)); 
                    const vEq = (4/3)*v_n - (1/3)*v_n_minus_1;
                    
                    // Hitung Arus Aktual berdasarkan ekuivalen Gear-2
                    const current = (vIn - vOut - vEq) / rEq;
                    comp.simI = current;
                    
                    // ----------------------------------------------------
                    // PENGGESERAN MEMORI WAKTU (Time-Shifting untuk Gear-2)
                    // ----------------------------------------------------
                    const vNew = vIn - vOut; 
                    
                    comp.vHistory[1] = comp.vHistory[0]; 
                    comp.vHistory[0] = vNew;             
                    
                    comp.simV = vNew;
                    comp.chargeV = vNew; 
                }
                else if (comp.type === 'ic_555') {
                    const nIn0 = getNodeIndex(comp.id, 'input', 0);
                    const nIn1 = getNodeIndex(comp.id, 'input', 1);
                    const nIn2 = getNodeIndex(comp.id, 'input', 2);
                    const nIn3 = getNodeIndex(comp.id, 'input', 3);
                    const nIn4 = getNodeIndex(comp.id, 'input', 4);
                    const nIn5 = getNodeIndex(comp.id, 'input', 5);
                    
                    // Simpan status tegangan tiap pin agar lampu indikator di SVG (ComponentDefs) bisa menyala
                    if (!comp.inputStates) comp.inputStates = [0,0,0,0,0,0];
                    comp.inputStates[0] = nIn0 !== -1 ? this.nodeVoltage[nIn0] : 0;
                    comp.inputStates[1] = nIn1 !== -1 ? this.nodeVoltage[nIn1] : 0;
                    comp.inputStates[2] = nIn2 !== -1 ? this.nodeVoltage[nIn2] : 0;
                    comp.inputStates[3] = nIn3 !== -1 ? this.nodeVoltage[nIn3] : 0;
                    comp.inputStates[4] = nIn4 !== -1 ? this.nodeVoltage[nIn4] : 0;
                    comp.inputStates[5] = nIn5 !== -1 ? this.nodeVoltage[nIn5] : 0;

                    // Mengirim info tegangan Power agar warna body IC berubah (Aktif)
                    const vGnd = nIn0 !== -1 ? this.nodeVoltage[nIn0] : 0;
                    const vVcc = nIn5 !== -1 ? this.nodeVoltage[nIn5] : 0;
                    comp.simV_vcc = Math.abs(vVcc - vGnd);
                }
                else if (comp.type === 'ic_4017') {
                    const nVcc = getNodeIndex(comp.id, 'input', 3);
                    const nGnd = getNodeIndex(comp.id, 'input', 4);
                    const vcc = nVcc !== -1 ? this.nodeVoltage[nVcc] : 0;
                    const gnd = nGnd !== -1 ? this.nodeVoltage[nGnd] : 0;
                    
                    // Kirim selisih daya (VCC - GND) ke UI
                    comp.simV_vcc = Math.abs(vcc - gnd);

                    // Ambil Voltase sesungguhnya (bukan sekadar logika 1 atau 0) untuk visualisasi SVG
                    if (!comp.inputStates) comp.inputStates = [0,0,0,0,0];
                    for (let j = 0; j < 5; j++) {
                        const nIn = getNodeIndex(comp.id, 'input', j);
                        comp.inputStates[j] = nIn !== -1 ? this.nodeVoltage[nIn] : 0;
                    }
                }
                else if (['bjt_npn', 'bjt_pnp', 'mosfet_n', 'mosfet_p'].includes(comp.type)) {
                const nB = getNodeIndex(comp.id, 'input', 0);
                const nC = getNodeIndex(comp.id, 'input', 1);
                const nE = getNodeIndex(comp.id, 'output', 0);

                const vB = nB !== -1 ? this.nodeVoltage[nB] : 0;
                const vC = nC !== -1 ? this.nodeVoltage[nC] : 0;
                const vE = nE !== -1 ? this.nodeVoltage[nE] : 0;

                // simV dipakai ComponentDefs.js untuk indikator umum pin-in-1 & pin-out-0
                comp.simV = Math.abs(vC - vE);

                // Tentukan ON/OFF pakai syarat bias YANG SAMA dengan yang dipakai solver di Blok 2,
                // supaya visual selalu sinkron dengan kondisi listrik sesungguhnya
                let isOn = false;
                if (comp.type === 'bjt_npn') isOn = (vB - vE) > 0.6;
                else if (comp.type === 'bjt_pnp') isOn = (vE - vB) > 0.6;
                else if (comp.type === 'mosfet_n') isOn = (vB - vE) > 2.5;
                else if (comp.type === 'mosfet_p') isOn = (vE - vB) > 2.5;

                comp.state = isOn ? '1' : '0';
            }
            else if (comp.type === 'opamp' || comp.type === 'opamp_5pin') {
                const nOut = getNodeIndex(comp.id, 'output', 0);
                comp.simV = nOut !== -1 ? this.nodeVoltage[nOut] : 0;

                // ComponentDefs.js membaca outputState (bukan simV) untuk pin-out-0 op-amp
                comp.outputState = comp.simV > 0 ? 1 : 0;
            }
        });
    },

    // -----------------------------------------------------------------
    // HELPER & UTILITIES
    // -----------------------------------------------------------------
    updateInputStates(comp) {
        if (!comp.inputStates) comp.inputStates = new Array(comp.inputs).fill(0);
        
        if (comp.inputs > 0) {
            for (let i = 0; i < comp.inputs; i++) {
                const conn = CircuitStore.connections.find(c => c.target.compId === comp.id && Number(c.target.pinIndex) === i);
                
                if (conn) {
                    const srcComp = CircuitStore.components.find(c => c.id === conn.source.compId);
                    if (srcComp) {
                        const logicTypes = ['switch', 'and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor', 'clock_pulse', 'ff_sr', 'ff_d', 'ff_jk', 'ff_t'];
                        
                        // Cek jika sumber terhubung langsung tanpa perantara ke output IC lain
                        if (logicTypes.includes(srcComp.type) && Number(conn.source.pinIndex) === 0) {
                            comp.inputStates[i] = srcComp.outputState === 1 ? 1 : 0;
                        } 
                        else if (logicTypes.includes(srcComp.type) && Number(conn.source.pinIndex) === 1) {
                            comp.inputStates[i] = srcComp.outputState === 1 ? 0 : 1;
                        }
                        else {
                            // Cerdas: Jangan menebak pin sumber. Baca langsung tegangan di pin INPUT kita sendiri!
                            // Ini menyelesaikan masalah hilangnya sinyal jika melewati junction atau wire.
                            const myPinId = `${comp.id}-input-${i}`;
                            const nIdx = this.nodes.findIndex(group => group.includes(myPinId));
                            const voltage = nIdx !== -1 ? this.nodeVoltage[nIdx] : 0;
                            comp.inputStates[i] = voltage > 2.5 ? 1 : 0; 
                        }
                    }
                } else {
                    comp.inputStates[i] = 0; 
                }
            }
        }
    },

    updateVisuals() {
        CircuitStore.components.forEach(comp => {
            const contentDiv = document.getElementById(`content-${comp.id}`);
            if (contentDiv && typeof ComponentDefs !== 'undefined') {
                ComponentDefs.updateDOMState(comp.type, comp, contentDiv, comp.id);
            }
        });
    }
};