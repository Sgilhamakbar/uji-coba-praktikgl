// File: src/canvas/WireManager.js
//
// RINGKASAN MODUL:
// Mengelola semua hal terkait KABEL (koneksi) antar komponen di kanvas rangkaian:
// - Membuat/menghapus data koneksi di CircuitStore (createConnection, deleteConnection)
// - Membuat & memposisikan titik sambung/pin pada tiap komponen (createConnectionPoint)
// - Mesin status klik-untuk-menyambung antar pin (handleConnectionClick)
// - Menggambar jalur kabel SVG dengan smart routing + event klik/hapus/percabangan (drawConnections)
// - Memperbarui warna & animasi arus pada kabel sesuai hasil simulasi (updateWireStates)

import { CircuitStore } from '../state/CircuitStore.js';
import { SimulationEngine } from '../engine/SimulationEngine.js';
import { HistoryManager } from '../HistoryManager.js';
import { UIManager } from '../UI/UIManager.js';
import { ComponentDefs } from '../components/index.js';
import { buildComponentElement } from './ComponentBuilder.js';

// =========================================================
// 1. MANAJEMEN KONEKSI & TITIK SAMBUNG (PIN)
// =========================================================

/**
 * Menyimpan satu koneksi kabel baru ke CircuitStore lalu me-render ulang.
 * @param {number} srcId - ID komponen sumber (asal kabel)
 * @param {number} srcPin - Index pin pada komponen sumber
 * @param {number} tgtId - ID komponen tujuan
 * @param {number} tgtPin - Index pin pada komponen tujuan
 * @param {Array} waypoints - Titik-titik belokan manual kabel (opsional)
 * @param {string} srcType - Tipe pin sumber ('input' atau 'output')
 * @param {string} tgtType - Tipe pin tujuan ('input' atau 'output')
 */
export function createConnection(srcId, srcPin, tgtId, tgtPin, waypoints = [], srcType = 'output', tgtType = 'input') {
    CircuitStore.wireIdCounter = CircuitStore.wireIdCounter || Date.now();
    const connId = `wire_${++CircuitStore.wireIdCounter}`;

    CircuitStore.addConnection({ 
        id: connId,
        source: { compId: Number(srcId), pinIndex: Number(srcPin), type: srcType }, 
        target: { compId: Number(tgtId), pinIndex: Number(tgtPin), type: tgtType },
        waypoints: waypoints
    });
    
    drawConnections(); 
    updateConnectionPointVisuals();
    if (CircuitStore.isSimulationActive) SimulationEngine.run();
    return connId;
}

/**
 * Membuat elemen DOM titik sambung (pin) untuk komponen dan memposisikannya secara akurat.
 * @param {number} compId - ID komponen pemilik pin
 * @param {string} pinType - 'input' atau 'output'
 * @param {number} index - Urutan pin
 * @param {number} total - Total jumlah pin sejenis 
 * @param {string} compType - Jenis/tipe komponen untuk menentukan koordinat (x, y)
 * @returns {HTMLElement} Elemen titik sambung (pin)
 */
export function createConnectionPoint(compId, pinType, index, total, compType) {
    const pt = document.createElement('div');
    pt.className = `connection-point ${pinType}`;
    pt.dataset.compId = compId; 
    pt.dataset.pointType = pinType; 
    pt.dataset.pointIndex = index;

    let x = 0, y = 0;

    // Tabel koordinat pin yang dirapihkan (Dikelompokkan & menggunakan logika ringkas)
    switch (compType) {
    // --- [SUMBER DAYA & TERMINAL] ---
    case 'battery':
        x = 80; y = index === 0 ? 20 : 40;
        if (index === 1) pt.dataset.polarity = 'neg';
        break;
        
    case 'battery_1cell':
    case 'battery_multi':
        x = index === 0 ? 0 : 80; y = 20;
        if (index === 1) pt.dataset.polarity = 'neg';
        break;
        
    case 'vsine':
        x = index === 0 ? 0 : 130; y = 35; break;
        
    case 'ground':
        x = 20; y = 0; pt.dataset.polarity = 'neg'; break;
        
    case 'power_terminal':
        x = 30; y = 40; break;
        
    case 'output_terminal':
        x = 0; y = 20; break;
        
    case 'current_source':
        x = 20; y = pinType === 'input' ? 65 : 5; break;

    // --- [SAKLAR & RELAY] ---
    case 'switch':
        x = 60; y = 20; break;
        
    case 'switch_spst':
        x = pinType === 'input' ? 0 : 80; y = 20; break;
        
    case 'switch_spdt':
        x = pinType === 'input' ? 0 : 80;
        y = pinType === 'input' ? 30 : (index === 0 ? 15 : 45);
        break;
        
    case 'switch_dpst':
        x = pinType === 'input' ? 0 : 90;
        y = index === 0 ? 30 : 60;
        break;
        
    case 'push_button':
    case 'push_button_nc':
        x = pinType === 'input' ? 0 : 70; y = 30; break;
        
    case 'relay':
        x = pinType === 'input' ? 0 : 80; y = index === 0 ? 20 : 60;
        if (pinType !== 'input' && index === 0) pt.dataset.polarity = 'neg';
        break;
        
    case 'relay_5pin':
        x = pinType === 'input' ? 0 : 80;
        y = pinType === 'input' ? (index === 0 ? 20 : 70) : (index === 0 ? 20 : (index === 1 ? 50 : 90));
        if (pinType !== 'input' && index === 0) pt.dataset.polarity = 'neg';
        break;

    // --- [KOMPONEN PASIF & DISKRIT] ---
    case 'fuse':
    case 'resistor':
    case 'capacitor':
        x = pinType === 'input' ? 0 : 80; y = 20; break;
        
    case 'capacitor_polarized':
            if (pinType === 'input' && index === 0) { x = -5; y = 30; }       // Kutub (+) Anoda
            else if (pinType === 'output' && index === 0) { x = 85; y = 30; } // Kutub (-) Katoda
            break;

    case 'diode':
    case 'zener_diode':
        x = pinType === 'input' ? 0 : 60; y = 20; break;
        
    case 'led':
        x = pinType === 'input' ? 0 : 60; y = 20; break;

    case 'lamp':
        x = pinType === 'input' ? 0 : 60; y = 30; break;
        
    case 'potentiometer':
        x = pinType === 'input' ? (index === 0 ? 0 : 100) : 50;
        y = pinType === 'input' ? 40 : 80; break;
        
    case 'voltage_divider':
        x = pinType === 'input' ? 0 : 80; y = 30; break;
        
    case 'diode_bridge':
        x = pinType === 'input' ? 70 : (index === 0 ? 140 : 0);
        y = pinType === 'input' ? (index === 0 ? 0 : 140) : 70;
        if (pinType !== 'input' && index === 1) pt.dataset.polarity = 'neg';
        break;
        
    case 'transformer_2p3s':
    x = pinType === 'input' ? 0 : 140;
    y = pinType === 'input' 
        ? (index === 0 
            ? 30   // Primer Pin 0: Fasa / Jalur Atas (220V)
            : 120) // Primer Pin 1: Netral / Jalur Bawah (0V AC)
        : (index === 0 
            ? 30   // Sekunder Pin 0: Output AC Atas (+12V)
            : (index === 1 
                ? 75   // Sekunder Pin 1: Center Tap (CT / Ground 0V)
                : 120  // Sekunder Pin 2: Output AC Bawah (12V berlawanan fasa)
              ));
    break;
        
    case 'transformer_2p2s':
    x = pinType === 'input' ? 0 : 140;

    y = pinType === 'input' 
        ? (index === 0 
            ? 30   // Primer Pin 0: Fasa / Tegangan Input (220V)
            : 120) // Primer Pin 1: Netral / 0V AC
        : (index === 0 
            ? 30   // Sekunder Pin 0: Output AC Atas (12V)
            : 120); // Sekunder Pin 1: Output AC Bawah (0V / AC)
    break;

    // --- [TRANSISTOR & OP-AMP] ---
    case 'bjt_npn':
    case 'bjt_pnp':
        x = pinType === 'input' ? (index === 0 ? 0 : 40) : 40;
        y = pinType === 'input' ? (index === 0 ? 40 : 0) : 80;
        break;
    case 'bjt_pnp_bd140':
        x = pinType === 'input' ? (index === 0 ? 0 : 40) : 40;
        y = pinType === 'input' ? (index === 0 ? 40 : 0) : 80;
        break;
    case 'mosfet_n':
    case 'mosfet_p':
        x = pinType === 'input' ? (index === 0 ? 0 : 50) : 50;
        y = pinType === 'input' ? (index === 0 ? 50 : 0) : 100;
        break;
        
    case 'opamp':
        x = pinType === 'input' ? 0 : 120;
        y = pinType === 'input' ? (index === 0 ? 30 : 70) : 50;
        break;
        
    case 'opamp_5pin':
    case 'opamp_lm741':
        x = pinType === 'input' ? (index < 2 ? 0 : 60) : 120;
        y = pinType === 'input' ? (index === 0 ? 40 : (index === 1 ? 80 : (index === 2 ? 0 : 120))) : 60;
        break;

    // --- [LOGIC & FLIP-FLOP] ---
    case 'ff_jk':
        x = pinType === 'input' ? (index < 3 ? 0 : 40) : 80;
        y = pinType === 'input' ? [20, 70, 40, 0, 90][index] : (index === 0 ? 30 : 70);
        break;
        
    case 'ff_d':
        x = pinType === 'input' ? (index < 2 ? 0 : 40) : 80;
        y = pinType === 'input' ? [30, 60, 0, 90][index] : (index === 0 ? 30 : 60);
        break;
        
    case 'ff_sr':
        x = pinType === 'input' ? 0 : 80;
        y = pinType === 'input' ? (index === 0 ? 20 : (index === 1 ? 70 : 40)) : (index === 0 ? 20 : 70);
        break;
        
    case 'ff_t':
        x = pinType === 'input' ? 0 : 80;
        y = index === 0 ? 20 : 60; break;

    // --- [SENSOR, MOTOR & AKTUATOR] ---
    case 'ldr':
    case 'thermistor_ntc':
    case 'thermistor_ptc':
        x = pinType === 'input' ? 0 : 100; y = 40; break;
        
    case 'motor_dc':
        x = pinType === 'input' ? 0 : 80; y = 40; break;
        
    case 'speaker':
        x = 0; y = index === 0 ? 20 : 40;
        if (index === 1) pt.dataset.polarity = 'neg';
        break;
        
    case 'joystick':
    if (pinType === 'input') {
        x = index === 1 ? 20 : 40; // 1 = GND, 0 = +5V 
    } else {
        // Output: 0 = VRx, 1 = VRy, 2 = SW
        x = index === 0 ? 60 : (index === 1 ? 80 : 100);
    }
    y = 152;
    break;

    case 'servo':
        x = 0; y = index === 0 ? 20 : (index === 1 ? 40 : 60); break;

    case 'servo_360':
    x = index === 1 ? 60 : (index === 0 ? 80 : 100); // GND=35, VCC=55, SIG=75
    y = 200;
    break;
        
    case 'solenoid':
        x = pinType === 'input' ? 0 : 80; y = 30; break;
        
    case 'flasher':
        x = pinType === 'input' ? 0 : 80; y = 20; break;
        
    case 'sensor_lm35':
        if (pinType === 'input') {
            x = index === 0 ? 160 : 0; y = 60;
            pt.dataset.polarity = index === 0 ? 'pos' : 'neg'; }
        else {
            x = 80; y = 120; pt.dataset.polarity = 'pos'; }
        break;

    // --- [ALAT UKUR & GENERATOR] ---
    case 'voltmeter':
    case 'voltmeter_ac':
        x = index === 0 ? 0 : 100; y = 50;
        if (index === 1 && compType === 'voltmeter') pt.dataset.polarity = 'neg';
        break;
        
    case 'ammeter':
        x = pinType === 'input' ? 0 : 100; y = 50; break;
        
    case 'ohmmeter':
        x = index === 0 ? 0 : 100; y = 50;
        if (index === 1) pt.dataset.polarity = 'neg';
        break;
        
    case 'oscilloscope':
        x = 0; y = index === 0 ? 100 : 140; break;
        
    case 'logic_probe':
        x = 0; y = 20; break;
        
    case 'clock_pulse':
        x = 60; y = 20; break;
        
    case 'pulse_generator':
        x = 70; y = 30; break;

    // --- [KABEL & PERCABANGAN] --- 
    case 'wire_node':
    x = 10; y = 10; break;
 
    case 'net_tunnel':
        if (pinType === 'input' && index === 0) { x = 0; y = 20; }
        break;

    // --- [MODUL SENSOR & KOMPLEKS] ---
    case 'hc_sr04':
        x = pinType === 'input' ? (index === 0 ? 60 : (index === 1 ? 90 : 140)) : 110;
        y = 130; break;
        
    case 'ir_sensor':
        x = pinType === 'input' ? (index === 0 ? 90 : 60) : 30;
        y = 200; break;
        
    case 'lcd_16x2':
        y = 130;
        if (pinType === 'input') x = 70 + (index * 20);
        break;
        
    case 'soil_moisture':
        x = pinType === 'output' ? [20, 33, 30, 50][index] : [62, 49, 150, 130][index];
        y = index < 2 ? 160 : 10; break;
        
    case 'tcrt5000':
    x = pinType === 'input' 
        ? (index === 0 ? 80 : 60)   // Input:  0 = VCC (66), 1 = GND (52)
        : (index === 0 ? 40 : 20);  // Output: 0 = D0 (38),  1 = A0 (24)
    y = 175; // Ujung bawah pin
    break;

    case 'l298n':
        if (pinType === 'output') {
            x = index < 2 ? 5 : 250; y = index % 2 === 0 ? 130 : 150; }
        else {
            y = 210; x = 50 + (index * 20); }
        break;
        
    // --- [ARDUINO UNO] ---
    case 'arduino_uno':
        if (pinType === 'input') {
            if (index <= 13)      { x = 370 - (index * 20); y = 0; }   // D0 - D13
            else if (index <= 19) { x = 270 + ((index - 14) * 20); y = 280; } // A0 - A5
            else if (index === 20){ x = 130; y = 280; } // IOREF
            else if (index === 21){ x = 150; y = 280; } // RESET
            else if (index === 22){ x = 170; y = 280; } // 3V3
            else if (index === 23){ x = 190; y = 280; } // 5V
            else if (index === 24){ x = 210; y = 280; } // GND
            else if (index === 25){ x = 230; y = 280; } // GND
            else if (index === 26){ x = 250; y = 280; } // VIN
            else if (index === 27){ x = 90;  y = 0; }   // GND Atas
            else if (index === 28){ x = 70;  y = 0; } } // AREF
        break;

    // --- [IC & DIGITAL LOGIC] ---
    case 'ic_4017':
    if (pinType === 'input') {
        x = index < 3 ? 0 : 80;
        y = [60, 100, 140, 0, 240][index];
        if (index === 4) pt.dataset.polarity = 'neg';
    } else {
        x = 160;
        y = 20 + (index * 20);
    }
    break;
        
    case 'ic_74164':
        x = pinType === 'input' ? 0 : 160;
        y = pinType === 'input' ? [40, 80, 160, 200][index] : 30 + (index * 30);
        break;
        
    case 'ic_4518':
        x = pinType === 'input' ? 0 : 100;
        y = 20 + (index * 20); break;
        
    case 'ic_4518_dual':
        if (pinType === 'input') {
            x = index < 3 ? 0 : (index < 7 ? 160 : 0);
            y = [20, 40, 60, 40, 60, 80, 20, 160][index];
            if (index === 6) pt.dataset.polarity = 'pos';
            if (index === 7) pt.dataset.polarity = 'neg'; }
        else {
            x = index < 4 ? 0 : 160;
            y = [80, 100, 120, 140, 100, 120, 140, 160][index]; }
        break;
        
    case 'ic_7448':
        if (pinType === 'input') {
            x = index === 7 ? 140 : 0;
            y = [140, 20, 40, 120, 60, 80, 100, 20, 160][index];
            if (index === 7) pt.dataset.polarity = 'pos';
            if (index === 8) pt.dataset.polarity = 'neg'; }
        else {
            x = 140; y = [80, 100, 120, 140, 160, 40, 60][index]; }
        break;
        
    case 'ic_74LS90':
        if (pinType === 'input') {
            x = [140, 0, 0, 0, 0, 0, 0, 140][index];
            y = [20, 20, 40, 60, 120, 140, 100, 100][index];
            if (index === 6) pt.dataset.polarity = 'pos';
            if (index === 7) pt.dataset.polarity = 'neg'; }
        else {
            x = 140; y = [60, 120, 140, 80][index]; }
        break;
        
    case 'ic_4511':
        x = pinType === 'input' ? 0 : 150;
        y = 20 + (index * 20); break;
        
    case 'ic_4026':
        x = pinType === 'input' ? 0 : 160;
        y = pinType === 'input' ? [30, 80, 130, 180][index] : 20 + (index * 20);
        break;
        
    case 'ic_lm3914':
        if (pinType === 'input') {
            x = index < 6 ? 0 : 70;
            y = [40, 70, 100, 130, 160, 190, 0, 240][index];
            if (index === 6) pt.dataset.polarity = 'pos';
            if (index === 7) pt.dataset.polarity = 'neg'; }
        else {
            x = 140; y = 30 + (index * 20); }
        break;
        
    case 'ic_78L12':
    case 'ic_7812':
        if (pinType === 'input') {
            x = index === 0 ? 0 : 70; y = index === 0 ? 60 : 120;
            if (index === 1) pt.dataset.polarity = 'neg'; }
        else {
            x = 140; y = 60; }
        break;
        
    case 'ic_7805':
    case 'ic_7808':
        if (pinType === 'input') {
            x = index === 0 ? 20 : 40; y = 120;
            pt.dataset.polarity = index === 0 ? 'pos' : 'neg'; }
        else {
            x = 60; y = 120; pt.dataset.polarity = 'pos'; }
        break;
        
    case 'ic_555':
    if (pinType === 'input') {
        x = [75, 0, 0, 0, 150, 75][index];
        y = [160, 120, 40, 80, 120, 0][index];
        if (index === 0) pt.dataset.polarity = 'neg';
    } else {
        x = 150;
        y = index === 0 ? 40 : 80;
    }
    break;
        
    case 'ic_4051':
    if (pinType === 'input') {
        x = [160, 160, 160, 0, 0, 0, 160, 0][index];
        y = [120, 140, 160, 120, 60, 140, 20, 160][index];
        if (index === 5 || index === 7) pt.dataset.polarity = 'neg';
        if (index === 6) pt.dataset.polarity = 'pos';
    } else {
        x = [160, 160, 160, 160, 0, 0, 0, 0][index];
        y = [80, 60, 40, 100, 20, 100, 40, 80][index];
    }
    break;

    case 'ic_74hc595':
            if (pinType === 'output') {
                // Pin Q1 - Q7 di sebelah KIRI (Y bertambah 20 tiap turun)
                if (index >= 1 && index <= 7) { x = 0; y = 20 * index; }
                // Pin Q0 di KANAN (Urutan 2 dari atas)
                else if (index === 0) { x = 140; y = 40; }
                // Pin Q7S (Cascade) di KANAN (Paling Bawah)
                else if (index === 8) { x = 140; y = 160; }
            } else if (pinType === 'input') {
                // Pin GND di KIRI (Paling Bawah)
                if (index === 6) { x = 0; y = 160; }
                // Pin VCC di KANAN (Paling Atas)
                else if (index === 5) { x = 140; y = 20; }
                // Sisa Pin Input di KANAN (Urutan 3 hingga 7)
                else if (index === 0) { x = 140; y = 60; }  // DS
                else if (index === 4) { x = 140; y = 80; }  // ~OE
                else if (index === 2) { x = 140; y = 100; } // STCP
                else if (index === 1) { x = 140; y = 120; } // SHCP
                else if (index === 3) { x = 140; y = 140; } // ~MR
            }
            break;    

    // --- [DISPLAY & OUTPUT] ---
    case 'seven_segment':
        if (pinType === 'input') {
            x = 0; y = 20 + (index * 20); }
        else {
            x = 150; y = 140; pt.dataset.polarity = 'neg'; }
        break;
        
    case 'led_bargraph':
        if (pinType === 'input') {
            x = index < 10 ? 0 : 60; y = index < 10 ? 30 + (index * 20) : 0;
            if (index === 10) pt.dataset.polarity = 'pos'; }
        break;
        
    case 'led_bargraph_cc':
        if (pinType === 'input') {
            x = index < 10 ? 0 : 60; y = index < 10 ? 30 + (index * 20) : 240;
            if (index === 10) pt.dataset.polarity = 'neg'; }
        break;

    // --- [DEFAULT FALLBACK] ---
    default:
        x = pinType === 'input' ? 0 : 80;
        y = total === 1 ? 30 : (index === 0 ? 20 : 40);
        break;
}

    pt.style.left = `${x}px`; 
    pt.style.top = `${y}px`;

    // Event Listener Interaksi (pointerdown saja — berfungsi untuk mouse, touch, dan pen)
    const handleInteract = (e) => { 
        // 🟢 FIX: Lepaskan interaksi agar tembus ke komponen (untuk digeser) jika syarat terpenuhi
        if (compType === 'wire_node') {
            if (e.button === 2) return; // Lepas klik kanan (untuk PC)
            if (e.pointerType === 'touch' && !CircuitStore.isWireMode) return; // Lepas sentuhan (untuk HP)
        }

        e.stopPropagation(); 
        e.preventDefault(); // Mencegah event 'click' susulan agar tidak double-fire
        handleConnectionClick(compId, pinType, index); 
    };
    
    pt.addEventListener('pointerdown', handleInteract);

    // --- TOOLTIP LOGIC ---
    pt.dataset.pinLabel = getPinLabel(compType, pinType, index);

    pt.addEventListener('mouseenter', () => {
        const tooltip = document.getElementById('globalTooltip');
        // Hanya tampilkan jika sedang tidak merakit kabel DAN label tidak kosong
        if (tooltip && !CircuitStore.connectionStart && pt.dataset.pinLabel) {
            tooltip.textContent = pt.dataset.pinLabel;
            const rect = pt.getBoundingClientRect();
            tooltip.style.left = (rect.right + 15) + 'px';
            tooltip.style.top = (rect.top + (rect.height / 2)) + 'px';
            tooltip.classList.add('show');
        }
    });

    pt.addEventListener('mouseleave', () => {
        const tooltip = document.getElementById('globalTooltip');
        if (tooltip) tooltip.classList.remove('show');
    });

    return pt;
}

// =========================================================
// 2. LOGIKA KONEKSI & INTERAKSI
// =========================================================

/**
 * Menyegarkan tampilan visual semua titik sambung.
 * Memberi status/kelas 'connected' (warna hijau) pada pin yang sudah terhubung.
 */
export function updateConnectionPointVisuals() {
    document.querySelectorAll('.connection-point').forEach(p => { 
        p.classList.remove('connected'); 
        p.removeAttribute('title'); 
    });
    
    CircuitStore.connections.forEach(conn => {
        let sType = conn.source.type || 'output';
        const sourceEl = document.querySelector(`#comp-${conn.source.compId} .connection-point[data-point-type="${sType}"][data-point-index="${conn.source.pinIndex}"]`);
        if (sourceEl) sourceEl.classList.add('connected'); 
        
        let tType = conn.target.type || 'input';
        const targetEl = document.querySelector(`#comp-${conn.target.compId} .connection-point[data-point-type="${tType}"][data-point-index="${conn.target.pinIndex}"]`);
        if (targetEl) targetEl.classList.add('connected'); 
    });
}

/**
 * Menghapus satu koneksi kabel, merekamnya ke history untuk fitur Undo, 
 * lalu me-render ulang kanvas dan menjalankan simulasi jika aktif.
 */
export function deleteConnection(srcId, srcPin, tgtId, tgtPin) {
    const removedConn = CircuitStore.connections.find(c => c.source.compId === srcId && c.source.pinIndex === srcPin && c.target.compId === tgtId && c.target.pinIndex === tgtPin);
    const before = CircuitStore.connections.length;
    
    CircuitStore.removeConnection(srcId, srcPin, tgtId, tgtPin);
    
    if (CircuitStore.connections.length < before) {
        if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp && removedConn) {
            HistoryManager.pushCommand('REMOVE_WIRE', JSON.parse(JSON.stringify(removedConn)), 'Menghapus kabel');
        }
        drawConnections(); 
        updateConnectionPointVisuals();
        if (CircuitStore.isSimulationActive) SimulationEngine.run();
    }
}

/**
 * Mesin status (state machine) klik pin untuk menyambung kabel:
 * Mengelola klik pertama (titik awal) dan klik kedua (penyelesaian),
 * serta mengganti koneksi lama bila pin tidak mendukung multiple koneksi.
 */
let lastWireModeToastTime = 0;

export function handleConnectionClick(compId, type, index) {
    // KUNCI PENGAMAN: Tolak sentuhan jika Mode Kabel belum aktif
    if (!CircuitStore.isWireMode) {
        if (typeof UIManager !== 'undefined') {
            const now = Date.now();
            if (now - lastWireModeToastTime > 3000) { // Beri jeda 3 detik (seumur toast)
                UIManager.showToast('⚠️ Aktifkan "Mode rakit Kabel" untuk merakit!');
                lastWireModeToastTime = now;
            }
        }
        return; // Hentikan fungsi secara paksa
    }
    compId = Number(compId); index = Number(index);

    if (!CircuitStore.connectionStart) {
        CircuitStore.connectionStart = { compId, type, index };
        CircuitStore.tempWaypoints = [];
        UIManager.showToast('Klik area kosong untuk membelokkan kabel, klik pin tujuan untuk menyambung');
        document.querySelectorAll('.connection-point').forEach(p => p.style.boxShadow = 'none');
        
        const sp = document.querySelector(`[data-comp-id="${compId}"][data-point-type="${type}"][data-point-index="${index}"]`);
        if (sp) sp.classList.add('pending');
        return;
    }

    if (CircuitStore.connectionStart.compId === compId && CircuitStore.connectionStart.type === type && CircuitStore.connectionStart.index === index) {
        CircuitStore.connectionStart = null;
        CircuitStore.tempWaypoints = [];
        let tw = document.getElementById('temp-wire-path'); if(tw) tw.remove();
        document.querySelectorAll('.connection-point').forEach(p => p.classList.remove('pending'));
        UIManager.showToast('Koneksi dibatalkan');
        return;
    }

    const startType = CircuitStore.connectionStart.type;
    document.querySelectorAll('.connection-point').forEach(p => p.classList.remove('pending'));

    let srcId, srcPin, tgtId, tgtPin, tgtIsInput, srcType, tgtType;
    if (startType === 'output' && type === 'input') { 
        srcId = CircuitStore.connectionStart.compId; srcPin = CircuitStore.connectionStart.index; srcType = 'output'; 
        tgtId = compId; tgtPin = index; tgtType = 'input'; tgtIsInput = true; 
    } else if (startType === 'input' && type === 'output') { 
        srcId = compId; srcPin = index; srcType = 'output'; 
        tgtId = CircuitStore.connectionStart.compId; tgtPin = CircuitStore.connectionStart.index; tgtType = 'input'; 
        tgtIsInput = true; 
        if (CircuitStore.tempWaypoints) CircuitStore.tempWaypoints.reverse();
    } else { 
        // Koneksi pin sejenis (output↔output / input↔input) — DIIZINKAN
        // Rangkaian elektronik bersifat bidireksional, contoh:
        //   - Katoda dioda (output) → Katoda LED (output) ✅
        //   - Anoda LED (input) → Anoda dioda (input) ✅
        //   - Resistor output → Resistor output ✅
        srcId = CircuitStore.connectionStart.compId; srcPin = CircuitStore.connectionStart.index;
        srcType = startType;
        tgtId = compId; tgtPin = index; tgtType = type;
        tgtIsInput = (type === 'input');
    }
    
    CircuitStore.connectionStart = null;

    const exists = CircuitStore.connections.find(c =>
        (c.source.compId === srcId && c.source.pinIndex === srcPin && c.target.compId === tgtId && c.target.pinIndex === tgtPin) ||
        (c.source.compId === tgtId && c.source.pinIndex === tgtPin && c.target.compId === srcId && c.target.pinIndex === srcPin)
    );
    
    if (exists) {
        CircuitStore.tempWaypoints = [];
        let tw = document.getElementById('temp-wire-path'); if(tw) tw.remove();
        return UIManager.showToast('Koneksi ini sudah ada');
    }

    let replacedConn = null;
    if (tgtIsInput) {
        let allowMultipleInputs = false;
        const targetComp = CircuitStore.components.find(c => c.id === tgtId);
        const allowedTypes = ['ground', 'power_terminal', 'wire_node', 'resistor', 'capacitor', 'led', 'diode', 'diode_bridge',
            'ammeter', 'voltmeter', 'oscilloscope', 'motor_dc', 'solenoid', 'relay', 'relay_5pin', 'ohmmeter'];
        
        if (targetComp && allowedTypes.includes(targetComp.type)) allowMultipleInputs = true;

        if (!allowMultipleInputs) {
            replacedConn = CircuitStore.connections.find(c => c.target.compId === tgtId && c.target.pinIndex === tgtPin);
            const replaced = CircuitStore.removeConnectionsTargeting(tgtId, tgtPin);
            if (replaced) UIManager.showToast('Kabel lama pada pin ini diganti');
        }
    }

    let finalWaypoints = CircuitStore.tempWaypoints ? [...CircuitStore.tempWaypoints] : [];
    
    if (finalWaypoints.length > 0) {
        let lastWp = finalWaypoints[finalWaypoints.length - 1];
        let tp = getPinPosition(tgtId, tgtType, tgtPin);
        
        if (tp && lastWp.x !== tp.x && lastWp.y !== tp.y) {
            if (Math.abs(tp.x - lastWp.x) > Math.abs(tp.y - lastWp.y)) finalWaypoints.push({ x: tp.x, y: lastWp.y });
            else finalWaypoints.push({ x: lastWp.x, y: tp.y });
        }
    }

    const newConnId = createConnection(srcId, srcPin, tgtId, tgtPin, finalWaypoints, srcType, tgtType);
    const newConn = CircuitStore.connections.find(c => c.id === newConnId);
    
    if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp) {
        HistoryManager.pushCommand('ADD_WIRE', { 
            added: JSON.parse(JSON.stringify(newConn)), 
            removed: replacedConn ? JSON.parse(JSON.stringify(replacedConn)) : null 
        }, 'Menyambung kabel');
    }
    
    CircuitStore.tempWaypoints = []; 
    let tw = document.getElementById('temp-wire-path'); if(tw) tw.remove();
    UIManager.showToast('Kabel terhubung!');
}

// =========================================================
// 3. GAMBAR & RENDERING KABEL (SVG)
// =========================================================

/**
 * Menghitung koordinat piksel (X, Y) dari sebuah pin secara real-time di atas kanvas.
 */
export function getPinPosition(compId, pinType, pinIndex) {
    let pt = document.querySelector(`[data-comp-id="${compId}"][data-point-type="${pinType}"][data-point-index="${pinIndex}"]`);
    if (!pt) pt = document.querySelector(`[data-comp-id="${compId}"][data-point-index="${pinIndex}"]`);
    if (!pt) return null;
    
    const canvas = document.getElementById('canvas');
    const cr = canvas.getBoundingClientRect();
    const pr = pt.getBoundingClientRect();
    
    return {
        x: (pr.left - cr.left) / UIManager.currentZoom + (pr.width / UIManager.currentZoom) / 2,
        y: (pr.top - cr.top) / UIManager.currentZoom + (pr.height / UIManager.currentZoom) / 2,
        isNeg: pt.dataset.polarity === 'neg'
    };
}

/**
 * Menggambar jalur seluruh kabel, membentuk tikungan (Routing Ortokal),
 * dan memasangkan event interaksi kabel (Double Click untuk potong, dll).
 */
export function drawConnections() {
    const svg = document.getElementById('wire-svg');
    if (!svg) return;
  
    const activePathIds = new Set();

    CircuitStore.connections.forEach((conn, _idx) => {
        if (!conn.id) {
            CircuitStore.wireIdCounter = CircuitStore.wireIdCounter || Date.now();
            conn.id = `wire_${++CircuitStore.wireIdCounter}`;
        }
        
        activePathIds.add(conn.id);

        const compS = CircuitStore.components.find(c => c.id === conn.source.compId);
        const compT = CircuitStore.components.find(c => c.id === conn.target.compId);
        if (!compS || !compT) return;

        let sType = conn.source.type || 'output';
        let tType = conn.target.type || 'input';
        let sp = getPinPosition(conn.source.compId, sType, conn.source.pinIndex) || getPinPosition(conn.source.compId, sType==='output'?'input':'output', conn.source.pinIndex);
        let tp = getPinPosition(conn.target.compId, tType, conn.target.pinIndex) || getPinPosition(conn.target.compId, tType==='input'?'output':'input', conn.target.pinIndex);
        if (!sp || !tp) return;

        let pathStr = `M ${sp.x} ${sp.y} `;

        if (conn.waypoints && conn.waypoints.length > 0) {
            let currentX = sp.x;
            let currentY = sp.y;
            
            conn.waypoints.forEach(wp => {
                if (currentX !== wp.x && currentY !== wp.y) pathStr += `L ${wp.x} ${currentY} `;
                pathStr += `L ${wp.x} ${wp.y} `;
                currentX = wp.x; currentY = wp.y;
            });
            
            if (currentX !== tp.x && currentY !== tp.y) pathStr += `L ${tp.x} ${currentY} `;
            pathStr += `L ${tp.x} ${tp.y}`;
        } else {
            // ALGORITMA BARU: Bulletproof 360-Degree Smart Router & Shortest Wrap-Around
            const canvas = document.getElementById('canvas');
            const cr = canvas.getBoundingClientRect();
            
            const elS = document.getElementById(`comp-${compS.id}`);
            const elT = document.getElementById(`comp-${compT.id}`);
            if (!elS || !elT) return;

            const rectS = elS.getBoundingClientRect();
            const rectT = elT.getBoundingClientRect();

            // 1. Dapatkan kotak batas (Bounding Box) fisik komponen
            const sLeft = (rectS.left - cr.left) / UIManager.currentZoom;
            const sRight = sLeft + (rectS.width / UIManager.currentZoom);
            const sTop = (rectS.top - cr.top) / UIManager.currentZoom;
            const sBottom = sTop + (rectS.height / UIManager.currentZoom);

            const tLeft = (rectT.left - cr.left) / UIManager.currentZoom;
            const tRight = tLeft + (rectT.width / UIManager.currentZoom);
            const tTop = (rectT.top - cr.top) / UIManager.currentZoom;
            const tBottom = tTop + (rectT.height / UIManager.currentZoom);

            // 2. Cari arah hadap TETAP (dari komponen asli, bukan wire_node)
            let spDirX = 0, spDirY = 0;
            let tpDirX = 0, tpDirY = 0;

            if (compS.type !== 'wire_node') {
                const dLeftS = Math.abs(sp.x - sLeft);
                const dRightS = Math.abs(sRight - sp.x);
                const dTopS = Math.abs(sp.y - sTop);
                const dBotS = Math.abs(sBottom - sp.y);
                const minS = Math.min(dLeftS, dRightS, dTopS, dBotS);
                if (minS === dLeftS) spDirX = -1;
                else if (minS === dRightS) spDirX = 1;
                else if (minS === dTopS) spDirY = -1;
                else if (minS === dBotS) spDirY = 1;
            }

            if (compT.type !== 'wire_node') {
                const dLeftT = Math.abs(tp.x - tLeft);
                const dRightT = Math.abs(tRight - tp.x);
                const dTopT = Math.abs(tp.y - tTop);
                const dBotT = Math.abs(tBottom - tp.y);
                const minT = Math.min(dLeftT, dRightT, dTopT, dBotT);
                if (minT === dLeftT) tpDirX = -1;
                else if (minT === dRightT) tpDirX = 1;
                else if (minT === dTopT) tpDirY = -1;
                else if (minT === dBotT) tpDirY = 1;
            }

            // 3. Tentukan arah wire_node agar tegak lurus (L-shape) dengan komponen lawan
            if (compS.type === 'wire_node') {
                if (tpDirX !== 0) { 
                    spDirY = tp.y > sp.y ? 1 : -1;
                } else if (tpDirY !== 0) {
                    spDirX = tp.x > sp.x ? 1 : -1;
                } else {
                    if (Math.abs(tp.x - sp.x) > Math.abs(tp.y - sp.y)) spDirX = tp.x > sp.x ? 1 : -1;
                    else spDirY = tp.y > sp.y ? 1 : -1;
                }
            }

            if (compT.type === 'wire_node') {
                if (spDirX !== 0) { 
                    tpDirY = sp.y > tp.y ? 1 : -1;
                } else if (spDirY !== 0) {
                    tpDirX = sp.x > tp.x ? 1 : -1;
                } else {
                    if (Math.abs(sp.x - tp.x) > Math.abs(sp.y - tp.y)) tpDirX = sp.x > tp.x ? 1 : -1;
                    else tpDirY = sp.y > tp.y ? 1 : -1;
                }
            }

            // 4. Jarak kabel keluar lurus
            // OffsetS = Jarak lurus pin sumber (Source)
            // OffsetT = Jarak lurus pin tujuan (Target)
            let offsetS = compS.type === 'wire_node' ? 0 : 20; 
            let offsetT = compT.type === 'wire_node' ? 0 : 20;
            
            // Cek jika berhadapan dan terlalu dekat, kurangi offset agar tidak melengkung mutar (loop)
            if (spDirX !== 0 && spDirX !== tpDirX) {
                let isFacing = (spDirX === 1 && sp.x <= tp.x) || (spDirX === -1 && sp.x >= tp.x);
                if (isFacing) {
                    let distX = Math.abs(sp.x - tp.x);
                    if (distX < offsetS + offsetT) {
                        offsetS = distX / 2;
                        offsetT = distX / 2;
                    }
                }
            } else if (spDirY !== 0 && spDirY !== tpDirY) {
                let isFacing = (spDirY === 1 && sp.y <= tp.y) || (spDirY === -1 && sp.y >= tp.y);
                if (isFacing) {
                    let distY = Math.abs(sp.y - tp.y);
                    if (distY < offsetS + offsetT) {
                        offsetS = distY / 2;
                        offsetT = distY / 2;
                    }
                }
            }
            
            let p1x = sp.x + (spDirX * offsetS);
            let p1y = sp.y + (spDirY * offsetS);
            let p2x = tp.x + (tpDirX * offsetT);
            let p2y = tp.y + (tpDirY * offsetT);

            pathStr += `L ${p1x} ${p1y} `;

            // 5. LOGIKA RUTE CERDAS (Dengan Deteksi Jalur Terpendek)
            if (spDirX !== 0 && spDirX === tpDirX) {
                // C-Shape Horizontal
                let bracketX = (spDirX === 1) ? Math.max(sRight, tRight) + 20 : Math.min(sLeft, tLeft) - 20;
                pathStr += `L ${bracketX} ${p1y} L ${bracketX} ${p2y} L ${p2x} ${p2y} `;
            } 
            else if (spDirY !== 0 && spDirY === tpDirY) {
                // C-Shape Vertikal
                let bracketY = (spDirY === 1) ? Math.max(sBottom, tBottom) + 20 : Math.min(sTop, tTop) - 20;
                pathStr += `L ${p1x} ${bracketY} L ${p2x} ${bracketY} L ${p2x} ${p2y} `;
            } 
            else if (spDirX !== 0 && tpDirY !== 0) {
                // X ke Y
                let isSafe = (p2x - p1x) * spDirX >= 0 && (p1y - p2y) * tpDirY >= 0;
                if (isSafe) {
                    pathStr += `L ${p2x} ${p1y} L ${p2x} ${p2y} `; 
                } else {
                    let wrapX = null;
                    if (tLeft - sRight > 10) {
                        let gapX = (tLeft + sRight) / 2;
                        if ((gapX - p1x) * spDirX >= 0) wrapX = gapX;
                    } else if (sLeft - tRight > 10) {
                        let gapX = (sLeft + tRight) / 2;
                        if ((gapX - p1x) * spDirX >= 0) wrapX = gapX;
                    }

                    let wrapY = null;
                    if (tTop - sBottom > 10) {
                        let gapY = (tTop + sBottom) / 2;
                        if ((gapY - p2y) * tpDirY >= 0) wrapY = gapY;
                    } else if (sTop - tBottom > 10) {
                        let gapY = (sTop + tBottom) / 2;
                        if ((gapY - p2y) * tpDirY >= 0) wrapY = gapY;
                    }
                    
                    if (wrapY !== null) {
                        pathStr += `L ${p1x} ${wrapY} L ${p2x} ${wrapY} L ${p2x} ${p2y} `;
                    } else if (wrapX !== null) {
                        pathStr += `L ${wrapX} ${p1y} L ${wrapX} ${p2y} L ${p2x} ${p2y} `;
                    } else {
                        let wrapX_outer = spDirX === 1 ? Math.max(sRight, tRight) + 20 : Math.min(sLeft, tLeft) - 20;
                        let wrapY_outer = tpDirY === 1 ? Math.max(sBottom, tBottom) + 20 : Math.min(sTop, tTop) - 20;
                        pathStr += `L ${wrapX_outer} ${p1y} L ${wrapX_outer} ${wrapY_outer} L ${p2x} ${wrapY_outer} L ${p2x} ${p2y} `;
                    }
                }
            } 
            else if (spDirY !== 0 && tpDirX !== 0) {
                // Y ke X
                let isSafe = (p2y - p1y) * spDirY >= 0 && (p1x - p2x) * tpDirX >= 0;
                if (isSafe) {
                    pathStr += `L ${p1x} ${p2y} L ${p2x} ${p2y} `; 
                } else {
                    let wrapX = null;
                    if (tLeft - sRight > 10) {
                        let gapX = (tLeft + sRight) / 2;
                        if ((gapX - p2x) * tpDirX >= 0) wrapX = gapX;
                    } else if (sLeft - tRight > 10) {
                        let gapX = (sLeft + tRight) / 2;
                        if ((gapX - p2x) * tpDirX >= 0) wrapX = gapX;
                    }

                    let wrapY = null;
                    if (tTop - sBottom > 10) {
                        let gapY = (tTop + sBottom) / 2;
                        if ((gapY - p1y) * spDirY >= 0) wrapY = gapY;
                    } else if (sTop - tBottom > 10) {
                        let gapY = (sTop + tBottom) / 2;
                        if ((gapY - p1y) * spDirY >= 0) wrapY = gapY;
                    }
                    
                    if (wrapX !== null) {
                        pathStr += `L ${wrapX} ${p1y} L ${wrapX} ${p2y} L ${p2x} ${p2y} `;
                    } else if (wrapY !== null) {
                        pathStr += `L ${p1x} ${wrapY} L ${p2x} ${wrapY} L ${p2x} ${p2y} `;
                    } else {
                        let wrapY_outer = spDirY === 1 ? Math.max(sBottom, tBottom) + 20 : Math.min(sTop, tTop) - 20;
                        let wrapX_outer = tpDirX === 1 ? Math.max(sRight, tRight) + 20 : Math.min(sLeft, tLeft) - 20;
                        pathStr += `L ${p1x} ${wrapY_outer} L ${wrapX_outer} ${wrapY_outer} L ${wrapX_outer} ${p2y} L ${p2x} ${p2y} `;
                    }
                }
            } 
            else if (spDirX !== 0 && spDirX !== tpDirX) {
                // Kiri berhadapan dengan Kanan (Z-Shape Horizontal)
                let isFacing = (spDirX === 1 && p1x <= p2x) || (spDirX === -1 && p1x >= p2x);
                if (isFacing) {
                    let midX = (p1x + p2x) / 2;
                    pathStr += `L ${midX} ${p1y} L ${midX} ${p2y} L ${p2x} ${p2y} `;
                } else {
                    // JIKA MEMBELAKANGI: Cek apakah ada celah vertikal di antara kedua komponen
                    let wrapY;
                    if (tTop - sBottom > 10) {
                        // Target ada di bawah, lewati celah di antaranya
                        wrapY = (tTop + sBottom) / 2;
                    } else if (sTop - tBottom > 10) {
                        // Target ada di atas, lewati celah di antaranya
                        wrapY = (sTop + tBottom) / 2;
                    } else {
                        // Tidak ada celah, pilih jalan mutar lewat atas atau bawah
                        wrapY = (p2y < p1y) ? Math.min(sTop, tTop) - 20 : Math.max(sBottom, tBottom) + 20;
                    }
                    pathStr += `L ${p1x} ${wrapY} L ${p2x} ${wrapY} L ${p2x} ${p2y} `;
                }
            } 
            else if (spDirY !== 0 && spDirY !== tpDirY) {
                // Atas berhadapan dengan Bawah (Z-Shape Vertikal)
                let isFacing = (spDirY === 1 && p1y <= p2y) || (spDirY === -1 && p1y >= p2y);
                if (isFacing) {
                    let midY = (p1y + p2y) / 2;
                    pathStr += `L ${p1x} ${midY} L ${p2x} ${midY} L ${p2x} ${p2y} `;
                } else {
                    // JIKA MEMBELAKANGI: Cek apakah ada celah horizontal
                    let wrapX;
                    if (tLeft - sRight > 10) {
                        wrapX = (tLeft + sRight) / 2;
                    } else if (sLeft - tRight > 10) {
                        wrapX = (sLeft + tRight) / 2;
                    } else {
                        wrapX = (p2x < p1x) ? Math.min(sLeft, tLeft) - 20 : Math.max(sRight, tRight) + 20;
                    }
                    pathStr += `L ${wrapX} ${p1y} L ${wrapX} ${p2y} L ${p2x} ${p2y} `;
                }
            }

            pathStr += `L ${tp.x} ${tp.y}`;
        }

        let group = svg.querySelector(`g[data-wire-id="${conn.id}"]`);
        let basePath, flowPath, hitboxPath;
        
        if (!group) {
            group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('data-wire-id', conn.id);

            // 1. GARIS VISUAL (Hanya untuk dilihat, tipis)
            basePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            basePath.setAttribute('fill', 'none');
            basePath.classList.add('wire-base');
            basePath.style.pointerEvents = 'none'; // Matikan interaksi sentuh di sini!

            // 2. GARIS ANIMASI ARUS
            flowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            flowPath.setAttribute('fill', 'none');
            flowPath.classList.add('wire-flow');
            flowPath.style.pointerEvents = 'none'; // Matikan interaksi

            // 3. GARIS HITBOX GAIB (Area Sentuh 10px)
            hitboxPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            hitboxPath.classList.add('wire-hitbox');
            // cssText menimpa aturan CSS agar 100% gaib tapi tetap bisa diklik
            hitboxPath.style.cssText = 'fill: none !important; stroke: transparent !important; stroke-width: 10px !important; pointer-events: stroke !important; cursor: pointer !important;';

            group.appendChild(basePath);
            group.appendChild(flowPath);
            group.appendChild(hitboxPath); // Hitbox harus di-append paling akhir agar berada di atas
            svg.appendChild(group);

            // --- EFEK HOVER MANUAL (Karena hitbox menutupi garis asli) ---
            hitboxPath.addEventListener('mouseenter', () => {
                basePath.style.stroke = 'var(--danger)';
                // Jika kabel sudah tebal, buat hovernya sedikit lebih tebal lagi
                const thick = conn.thickness ? parseFloat(conn.thickness) : 3;
                basePath.style.strokeWidth = Math.max(4.5, thick + 1.5) + 'px';
                basePath.style.filter = 'drop-shadow(0 0 4px rgba(225,29,72,0.5))';
            });
            hitboxPath.addEventListener('mouseleave', () => {
                basePath.style.stroke = '';
                basePath.style.strokeWidth = '';
                basePath.style.filter = '';
                
                // Hapus cache memori state agar updateWireStates mau me-render ulang ukuran & warna
                delete conn._lastStroke;
                delete conn._lastClass;
                delete conn._lastThickness;

                updateWireStates(); // Kembalikan ke warna asli/tegangan
            });

            // --- SEMUA INTERAKSI KINI DIAMBIL ALIH OLEH HITBOX ---
            const handleWireInteract = (e) => { 
                e.stopPropagation(); e.preventDefault(); 
                
                // Ambil data dari dataset HITBOX
                const sId = +hitboxPath.dataset.sId; const sIdx = +hitboxPath.dataset.sIdx; const sType = hitboxPath.dataset.sType;
                const tId = +hitboxPath.dataset.tId; const tIdx = +hitboxPath.dataset.tIdx; const tType = hitboxPath.dataset.tType;

                // 🌟 PERBAIKAN 1: Baca memori posisi terakhir jari (changedTouches) saat diangkat
                let clientX, clientY;
                if (e.changedTouches && e.changedTouches.length > 0) {
                    clientX = e.changedTouches[0].clientX;
                    clientY = e.changedTouches[0].clientY;
                } else if (e.touches && e.touches.length > 0) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }

                if (CircuitStore.connectionStart) {
                    const canvas = document.getElementById('canvas');
                    const cr = canvas.getBoundingClientRect();
                    let mx = Math.round(((clientX - cr.left) / UIManager.currentZoom) / 10) * 10;
                    let my = Math.round(((clientY - cr.top) / UIManager.currentZoom) / 10) * 10;

                    const oldConnObj = CircuitStore.connections.find(c => c.id === group.getAttribute('data-wire-id'));
                    const oldConnCopy = oldConnObj ? JSON.parse(JSON.stringify(oldConnObj)) : null;

                    if (!oldConnObj) return;

                    // ========================================================
                    // PERBAIKAN: Baca fisik kabel SVG di layar & Kunci rutenya
                    // ========================================================
                    let wpA = [], wpB = [];
                    const pathEl = document.getElementById(`wire-${oldConnObj.id}`);
                    let rawPath = pathEl ? pathEl.getAttribute('d') : "";
                    let visualPts = [];
                    
                    if (rawPath) {
                        let parts = rawPath.split(/(?=[ML])/);
                        parts.forEach(p => {
                            let coords = p.trim().substring(1).trim().split(/\s+/);
                            if (coords.length >= 2) {
                                visualPts.push({ x: parseFloat(coords[0]), y: parseFloat(coords[1]) });
                            }
                        });
                    }

                    // Fallback jika gagal baca dari SVG
                    if (visualPts.length < 2) {
                        let spPin = getPinPosition(sId, sType, sIdx) || {x: mx, y: my};
                        let tpPin = getPinPosition(tId, tType, tIdx) || {x: mx, y: my};
                        visualPts = [spPin, ...(oldConnObj.waypoints || []), tpPin];
                    }

                    let splitIdx = 0;
                    let minDist = Infinity;
                    let exactX = mx, exactY = my;

                    // Cari titik pada garis SVG yang PALING DEKAT dengan klik mouse
                    for (let i = 0; i < visualPts.length - 1; i++) {
                        let p1 = visualPts[i], p2 = visualPts[i+1];
                        
                        let isHoriz = Math.abs(p1.y - p2.y) < 1;
                        let isVert = Math.abs(p1.x - p2.x) < 1;
                        
                        let projX = mx, projY = my;
                        if (isHoriz) projY = p1.y;
                        else if (isVert) projX = p1.x;
                        
                        let minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
                        let minY = Math.min(p1.y, p2.y), maxY = Math.max(p1.y, p2.y);
                        
                        // Batasi proyeksi agar tidak keluar dari ujung garis
                        projX = Math.max(minX, Math.min(maxX, projX));
                        projY = Math.max(minY, Math.min(maxY, projY));
                        
                        let dist = Math.hypot(mx - projX, my - projY);
                        if (dist < minDist) {
                            minDist = dist;
                            splitIdx = i;
                            exactX = projX;
                            exactY = projY; // Temukan koordinat presisi tinggi
                        }
                    }

                    // Terapkan koordinat yang sangat presisi agar Router tidak melenceng
                    mx = exactX;
                    my = exactY;

                    // Ubah semua rute auto-router menjadi rute permanen (waypoints manual)
                    let innerWaypoints = visualPts.slice(1, -1);
                    wpA = innerWaypoints.slice(0, splitIdx);
                    wpB = innerWaypoints.slice(splitIdx);

                    CircuitStore.removeConnection(sId, sIdx, tId, tIdx);

                    const jId = ++CircuitStore.componentIdCounter;
                    const compData = {
                        id: jId, type: 'wire_node', inputs: 4, outputs: 4, 
                        x: mx - 10, y: my - 10, 
                        state: '0', inputStates: [0,0,0,0], outputStates: [0,0,0,0], outputState: 0, simV: 0, simI: 0
                    };
                    const div = buildComponentElement(compData);
                    document.getElementById('canvas').appendChild(div);
                    CircuitStore.addComponent({ ...compData, element: div });
                    
                    const addedCompCopy = JSON.parse(JSON.stringify({ ...compData, element: undefined, _domRef: undefined }));

                    const newConnId1 = createConnection(sId, sIdx, jId, 0, wpA, sType, 'input');
                    const newConn1 = JSON.parse(JSON.stringify(CircuitStore.connections.find(c => c.id === newConnId1)));
                    
                    const newConnId2 = createConnection(jId, 1, tId, tIdx, wpB, 'output', tType);
                    const newConn2 = JSON.parse(JSON.stringify(CircuitStore.connections.find(c => c.id === newConnId2)));

                    const startNode = CircuitStore.connectionStart;
                    let finalWp = CircuitStore.tempWaypoints ? [...CircuitStore.tempWaypoints] : [];
                    
                    if (finalWp.length > 0) {
                        let lastWp = finalWp[finalWp.length - 1];
                        if (lastWp.x !== mx && lastWp.y !== my) {
                            if (Math.abs(mx - lastWp.x) > Math.abs(my - lastWp.y)) finalWp.push({ x: mx, y: lastWp.y });
                            else finalWp.push({ x: lastWp.x, y: my });
                        }
                    }
                    
                    let cSrcId, cSrcPin, cSrcType, cTgtId, cTgtPin, cTgtType;
                    if (startNode.type === 'output') {
                        cSrcId = startNode.compId; cSrcPin = startNode.index; cSrcType = 'output';
                        cTgtId = jId; cTgtPin = 2; cTgtType = 'input';
                    } else {
                        cSrcId = jId; cSrcPin = 2; cSrcType = 'output';
                        cTgtId = startNode.compId; cTgtPin = startNode.index; cTgtType = startNode.type;
                        finalWp.reverse();
                    }
                    const newConnId3 = createConnection(cSrcId, cSrcPin, cTgtId, cTgtPin, finalWp, cSrcType, cTgtType);
                    const newConn3 = JSON.parse(JSON.stringify(CircuitStore.connections.find(c => c.id === newConnId3)));

                    if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp && oldConnCopy) {
                        HistoryManager.pushCommand('SPLICE_WIRE', {
                            removedConnections: [oldConnCopy],
                            addedComponents: [addedCompCopy],
                            addedConnections: [newConn1, newConn2, newConn3]
                        }, 'Sambung kabel ke kabel');
                    }

                    CircuitStore.connectionStart = null; CircuitStore.tempWaypoints = [];
                    let tw = document.getElementById('temp-wire-path'); if(tw) tw.remove();
                    document.querySelectorAll('.connection-point').forEach(p => p.classList.remove('pending'));
                    
                    UIManager.showToast('node terbuat (Spliced)!');
                } else {
                    UIManager.showConfirmToast('Hapus kabel ini?', () => { deleteConnection(sId, sIdx, tId, tIdx); }); 
                }
            };
            
            // Pasang fungsi hapus ke HITBOX (Klik Kiri)
            hitboxPath.addEventListener('click', handleWireInteract); 
            
            // KLIK GANDA: Buat Wire Node di tengah kabel
            hitboxPath.addEventListener('dblclick', (e) => {
                e.preventDefault(); 
                e.stopPropagation();
                splitWireToNode(conn, e);
            });

             // 🎨 3. MUNCULKAN PALET WARNA (PC: Klik Kanan, HP: Tahan Jari)
             // Fungsi pembantu agar kode tidak berulang
            const showColorPalette = (clientX, clientY) => {
                window.activeWireForColor = conn.id; 
                const palette = document.getElementById('wireColorPalette');
                if (palette) {
                    palette.style.display = 'flex';
                    const maxX = window.innerWidth - palette.offsetWidth - 20;
                    const maxY = window.innerHeight - palette.offsetHeight - 20;
                    palette.style.left = Math.min(clientX, Math.max(0, maxX)) + 'px';
                    palette.style.top = Math.min(clientY, Math.max(0, maxY)) + 'px';
                }
                // Update posisi slider sesuai ukuran aslinya
                const slider = document.getElementById('wireThicknessSlider');
                const valText = document.getElementById('wireThicknessVal');
                if (slider && valText) {
                    const thick = conn.thickness || 3; // default 3px
                    slider.value = thick;
                    valText.innerText = thick;
                }
            };

            // EVENT KLIK KANAN (Mouse PC/Laptop)
            hitboxPath.addEventListener('contextmenu', (e) => {
                e.preventDefault(); e.stopPropagation();
                showColorPalette(e.clientX, e.clientY);
            });

            // EVENT LONG PRESS (Layar Sentuh HP/Tablet)
            let longPressTimer;
            let isLongPress = false;

            hitboxPath.addEventListener('touchstart', (e) => {
                isLongPress = false;
                longPressTimer = setTimeout(() => {
                    isLongPress = true;
                    showColorPalette(e.touches[0].clientX, e.touches[0].clientY);
                }, 500); 
            }, {passive: false});

            hitboxPath.addEventListener('touchmove', () => clearTimeout(longPressTimer), {passive: true});

            let lastWireTap = 0;
            hitboxPath.addEventListener('touchend', (e) => {
                clearTimeout(longPressTimer); 
                if (isLongPress) { e.preventDefault(); e.stopPropagation(); return; }

                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastWireTap;
                if (tapLength < 300 && tapLength > 0) {
                    handleSplit(e); 
                } else {
                    handleWireInteract(e);
                }
                lastWireTap = currentTime;
            }, {passive: false});

        } else {
            basePath = group.querySelector('.wire-base');
            flowPath = group.querySelector('.wire-flow');
            hitboxPath = group.querySelector('.wire-hitbox');
        }

        // UPDATE SHAPE PATH UNTUK KETIGA GARIS
        basePath.setAttribute('d', pathStr);
        flowPath.setAttribute('d', pathStr);
        hitboxPath.setAttribute('d', pathStr);

        // DATASET DISIMPAN DI HITBOX, BUKAN BASEPATH
        hitboxPath.dataset.sId = conn.source.compId; 
        hitboxPath.dataset.sIdx = conn.source.pinIndex;
        hitboxPath.dataset.sType = sType;           
        hitboxPath.dataset.tId = conn.target.compId; 
        hitboxPath.dataset.tIdx = conn.target.pinIndex;
        hitboxPath.dataset.tType = tType;
    });

    // Cleanup kabel hantu
    svg.querySelectorAll('g[data-wire-id]').forEach(g => {
        if (!activePathIds.has(g.getAttribute('data-wire-id'))) g.remove();
    });

    updateConnectionPointVisuals();
    updateWireStates();
}

/**
 * Memperbarui status visual kabel (warna tegangan, kecepatan aliran elektron)
 * sesuai dengan hasil tegangan dari SimulationEngine.
 */
export function updateWireStates() {
    const svg = document.getElementById('wire-svg');
    if (!svg) return;

    CircuitStore.connections.forEach(conn => {
        // 🚀 OPTIMASI 1: DOM Caching. Hanya cari elemen 1x, lalu simpan di memori kabel
        if (!conn._domGroup || !(conn._domGroup instanceof Element) || !svg.contains(conn._domGroup)) {
            conn._domGroup = svg.querySelector(`g[data-wire-id="${conn.id}"]`);
            if (conn._domGroup) {
                conn._basePath = conn._domGroup.querySelector('.wire-base');
                conn._flowPath = conn._domGroup.querySelector('.wire-flow');
                conn._hitboxPath = conn._domGroup.querySelector('.wire-hitbox');
                
                // 🚀 OPTIMASI 1.5: Hapus memori state lama saat elemen DOM baru saja dibuat/ditemukan
                // Ini mencegah bug desync (misalnya: animasi nyala terus setelah Undo)
                delete conn._lastClass;
                delete conn._lastStroke;
                delete conn._lastDisplay;
                delete conn._lastReverse;
                delete conn._lastSpeed;
            }
        }
        
        if (!conn._domGroup) return;

        const basePath = conn._basePath;
        const flowPath = conn._flowPath;
        const hitboxPath = conn._hitboxPath;
        if (!basePath || !flowPath || !hitboxPath) return;

        const sType = hitboxPath.dataset.sType;
        let isGround = false;
        let voltage = 0;

        if (CircuitStore.isSimulationActive && SimulationEngine.nodes && SimulationEngine.nodes.length > 0) {
            const nodeIdx = SimulationEngine.getNodeIndex(conn.source.compId, sType, conn.source.pinIndex);
            if (nodeIdx !== -1) {
                voltage = SimulationEngine.nodeVoltage[nodeIdx];
                if (Math.abs(voltage) <= 0.001) isGround = true;
            }
        } else {
            const sp = getPinPosition(conn.source.compId, sType, conn.source.pinIndex);
            const tp = getPinPosition(conn.target.compId, hitboxPath.dataset.tType, conn.target.pinIndex);
            if ((sp && sp.isNeg) || (tp && tp.isNeg)) isGround = true;
        }

        const visualMode = CircuitStore.wireVisualMode !== undefined ? CircuitStore.wireVisualMode : 2;
        const showColor = visualMode >= 1; 
        const showAnim = visualMode === 2; 

        // 🚀 OPTIMASI 2: Kalkulasi virtual target warna
        let targetClass = '';
        let targetStroke = '';
        let customColor = conn.color ? conn.color : '';

        if (showColor && CircuitStore.isSimulationActive) {
            if (isGround) targetClass = 'wire-ground-base';
            else if (voltage >= 11) targetClass = 'wire-12v';
            else if (voltage >= 2) targetClass = 'wire-5v';
            else if (customColor) targetStroke = customColor;
        } else {
            if (customColor) targetStroke = customColor;
        }

        // 🚀 OPTIMASI 3: Update DOM HANYA JIKA ADA PERUBAHAN (Mencegah Thrashing)
        if (conn._lastClass !== targetClass) {
            if (conn._lastClass) basePath.classList.remove(conn._lastClass);
            if (targetClass) basePath.classList.add(targetClass);
            conn._lastClass = targetClass;
        }

        if (conn._lastStroke !== targetStroke) {
            basePath.style.stroke = targetStroke;
            if (!targetStroke) basePath.removeAttribute('stroke');
            conn._lastStroke = targetStroke;
        }
        // FITUR KETEBALAN KABEL (Ubah ketebalan garis Base dan Flow)
        let targetThickness = conn.thickness ? conn.thickness + 'px' : '';
        if (conn._lastThickness !== targetThickness) {
            basePath.style.strokeWidth = targetThickness;
            if (!targetThickness) {
                basePath.style.strokeWidth = ''; // reset ke default css
                flowPath.style.strokeWidth = '';
            } else {
                // Kabel flow (animasi titik) dibuat sedikit lebih besar dari base-nya agar terlihat
                flowPath.style.strokeWidth = (parseFloat(conn.thickness) + 0.5) + 'px';
            }
            conn._lastThickness = targetThickness;
        }

        // 🚀 OPTIMASI 4: Hitung animasi secara reaktif
        let targetDisplay = 'none';
        let targetReverse = false;
        let targetSpeed = 0;

        if (showAnim && CircuitStore.isSimulationActive && Math.abs(voltage) > 0.1 && !isGround) {
            targetDisplay = 'block';
            targetReverse = (sType === 'input');
            targetSpeed = Math.max(0.2, 6 / Math.abs(voltage)); 
        }

        if (conn._lastDisplay !== targetDisplay) {
            flowPath.style.display = targetDisplay;
            conn._lastDisplay = targetDisplay;
        }
        
        if (targetDisplay === 'block') {
            if (conn._lastReverse !== targetReverse) {
                if (targetReverse) flowPath.classList.add('wire-flow-reverse');
                else flowPath.classList.remove('wire-flow-reverse');
                conn._lastReverse = targetReverse;
            }
            if (conn._lastSpeed !== targetSpeed) {
                flowPath.style.animationDuration = `${targetSpeed}s`;
                conn._lastSpeed = targetSpeed;
            }
        }
    });
}

let drawConnectionsRAF = null;

/**
 * Variasi requestAnimationFrame dari fungsi render drawConnections 
 * guna mencegah render berlebihan (bottleneck).
 */
export function optimizedDrawConnections() {
    if (drawConnectionsRAF) cancelAnimationFrame(drawConnectionsRAF);
    drawConnectionsRAF = requestAnimationFrame(() => {
        drawConnections();
        drawConnectionsRAF = null;
    });
}

// =========================================================
// 4. PENAMAAN PIN & TOOLTIP
// =========================================================

/**
 * Mendapatkan string nama pin (tooltip) untuk ditampilkan ketika user melayang (hover) di atasnya.
 */
function getPinLabel(compType, pinType, index) {
    // Sembunyikan label tooltip untuk node pasif
    if (compType === 'wire_node' || compType === 'net_tunnel') {
        return '';
    }
    if (compType === 'arduino_uno' && pinType === 'input') {
        if (index <= 13) return `D${index} (Digital)`;
        if (index >= 14 && index <= 19) return `A${index - 14} (Analog In)`;
        const pwr = ['IOREF', 'RESET', '3.3V', '5V', 'GND', 'GND', 'VIN', 'GND', 'AREF'];
        if (index >= 20 && index <= 28) return pwr[index - 20];
    }
    if (compType === 'l298n') {
        if (pinType === 'output') return ['OUT1 (Motor A)', 'OUT2 (Motor A)', 'OUT3 (Motor B)', 'OUT4 (Motor B)'][index];
        if (pinType === 'input') return ['12V (Power)', 'GND', '5V', 'ENA (PWM A)', 'IN1', 'IN2', 'IN3', 'IN4', 'ENB (PWM B)'][index];
    }
    if (compType === 'hc_sr04') {
        if (pinType === 'input') return ['VCC (5V)', 'TRIG (Trigger)', 'GND'][index];
        if (pinType === 'output') return 'ECHO (Output)';
    }
    if (compType === 'soil_moisture') {
        if (pinType === 'input') return ['VCC (Power)', 'GND', 'Garpu Probe (+)', 'Garpu Probe (-)'][index];
        if (pinType === 'output') return ['AO (Analog Out)', 'DO (Digital Out)', 'PCB Probe (+)', 'PCB Probe (-)'][index];
    }
    if (compType === 'ic_555') {
        if (pinType === 'input') return ['GND (1)', 'TRIG (2)', 'RST (4)', 'CTRL (5)', 'THR (6)', 'VCC (8)'][index];
        if (pinType === 'output') return ['OUT (3)', 'DISCH (7)'][index];
    }
    if (compType === 'relay' || compType === 'relay_5pin') {
        if (pinType === 'input') return ['Coil 1', 'COM (Common)'][index];
        if (pinType === 'output') return compType === 'relay_5pin' ? ['Coil 2', 'NC (Normally Closed)', 'NO (Normally Open)'][index] : ['Coil 2', 'NO (Normally Open)'][index];
    }
    if (compType.startsWith('opamp')) {
        if (pinType === 'input') return ['Inverting (-)', 'Non-Inverting (+)', 'VCC (V+)', 'VEE (V-)'][index];
        if (pinType === 'output') return 'Vout';
    }
    if (compType === 'led' || compType === 'diode' || compType === 'zener_diode') {
        return pinType === 'input' ? 'Anoda (+)' : 'Katoda (-)';
    }
    if (compType === 'battery' || compType === 'battery_1cell' || compType === 'battery_multi') {
        return index === 0 ? 'Positif (+)' : 'Negatif (-) Ground';
    }
    
    return `${pinType === 'input' ? 'Input' : 'Output'} ${index + 1}`;
}

// Fungsi untuk memotong kabel dan menyisipkan wire_node (titik solder)
export function splitWireToNode(conn, e) {
    const canvas = document.getElementById('canvas');
    const cr = canvas.getBoundingClientRect();
    let mx = (e.clientX - cr.left) / UIManager.currentZoom;
    let my = (e.clientY - cr.top) / UIManager.currentZoom;

    // Grid snapping (agar rapih di kelipatan 10px)
    mx = Math.round(mx / 10) * 10;
    my = Math.round(my / 10) * 10;

    const sId = conn.source.compId, sIdx = conn.source.pinIndex;
    const tId = conn.target.compId, tIdx = conn.target.pinIndex;
    const sType = conn.source.pinType || 'output';
    const tType = conn.target.pinType || 'input';

    const oldConnObj = CircuitStore.connections.find(c => c.id === conn.id);
    const oldConnCopy = JSON.parse(JSON.stringify(oldConnObj));

    // ========================================================
    // PERBAIKAN: Hitung dan wariskan belokan kabel (Waypoints)
    // ========================================================
    let wpA = [], wpB = [];
    if (oldConnObj && oldConnObj.waypoints && oldConnObj.waypoints.length > 0) {
        // Ambil koordinat awal dan akhir kabel
        let spPin = getPinPosition(sId, sType, sIdx) || {x: mx, y: my};
        let tpPin = getPinPosition(tId, tType, tIdx) || {x: mx, y: my};
        
        // Buat deretan titik lengkap dari ujung ke ujung
        let pts = [spPin, ...oldConnObj.waypoints, tpPin];
        let splitIdx = 0;
        
        // Cari di segmen garis mana klik (mx, my) terjadi
        for (let i = 0; i < pts.length - 1; i++) {
            let p1 = pts[i], p2 = pts[i+1];
            let minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
            let minY = Math.min(p1.y, p2.y), maxY = Math.max(p1.y, p2.y);
            
            // Toleransi jarak 30px
            if (mx >= minX - 30 && mx <= maxX + 30 && my >= minY - 30 && my <= maxY + 30) {
                splitIdx = i; 
                break;
            }
        }
        // Bagi waypoint menjadi dua berdasarkan titik potong
        wpA = oldConnObj.waypoints.slice(0, splitIdx);
        wpB = oldConnObj.waypoints.slice(splitIdx);
    }

    // 2. Hapus Kabel Lama
    CircuitStore.removeConnection(sId, sIdx, tId, tIdx);

    // 3. Buat dan Render Komponen wire_node baru
    const jId = ++CircuitStore.componentIdCounter;
    const compData = {
        id: jId, type: 'wire_node', inputs: 4, outputs: 4, 
        x: mx - 10, y: my - 10, // Dikurangi 10 agar mouse tepat di tengah lingkaran
        state: '0', inputStates: [0,0,0,0], outputStates: [0,0,0,0], outputState: 0, simV: 0, simI: 0
    };
    
    const div = buildComponentElement(compData);
    document.getElementById('canvas').appendChild(div);
    CircuitStore.addComponent({ ...compData, element: div });
    const addedCompCopy = JSON.parse(JSON.stringify({ ...compData, element: undefined, _domRef: undefined }));

    // 4. Buat 2 Kabel Baru yang menyambung ke wire_node, dengan membawa waypoint warisan (wpA dan wpB)
    const newConnId1 = createConnection(sId, sIdx, jId, 0, wpA, sType, 'input');
    const newConn1 = JSON.parse(JSON.stringify(CircuitStore.connections.find(c => c.id === newConnId1)));
    
    const newConnId2 = createConnection(jId, 1, tId, tIdx, wpB, 'output', tType);
    const newConn2 = JSON.parse(JSON.stringify(CircuitStore.connections.find(c => c.id === newConnId2)));

    // 5. Catat riwayat perubahan
    if (typeof HistoryManager !== 'undefined' && !CircuitStore.isUndoRedoOp) {
        HistoryManager.pushCommand('SPLICE_WIRE', {
            removedConnections: [oldConnCopy],
            addedComponents: [addedCompCopy],
            addedConnections: [newConn1, newConn2]
        }, 'Buat Titik Cabang Kabel');
    }

    drawConnections();
    if (typeof updateConnectionPointVisuals !== 'undefined') updateConnectionPointVisuals();
    UIManager.showToast('Titik Solder berhasil ditambahkan!');
}