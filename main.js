// File: main.js

// ─── Penghubung Tombol HTML ke Modul ──────────────────────────────────────────
window.toggleSimulation = () => SimulationEngine.toggle();
window.clearCanvas = clearCanvas;

// Hubungkan HTML ke UIManager
window.showTruthTable = () => UIManager.showTruthTable();
window.closeTruthTable = () => UIManager.closeTruthTable();
window.changeZoom = (delta) => UIManager.changeZoom(delta);
window.setZoom = (val) => UIManager.setZoom(val);
window.toggleTheme = () => UIManager.toggleTheme();
window.openValueModal = (id, type, subType) => UIManager.openValueModal(id, type, subType);
window.closeValueModal = () => UIManager.closeValueModal();
window.saveComponentValue = () => UIManager.saveComponentValue();
window.setPresetValue = (val, multi) => UIManager.setPresetValue(val, multi);

// Hubungkan HTML ke HistoryManager
window.undo = () => HistoryManager.undo();
window.redo = () => HistoryManager.redo();
window.exportCircuit = () => HistoryManager.exportCircuit();
window.importCircuit = () => HistoryManager.importCircuit();
window.handleFileImport = (e) => HistoryManager.handleFileImport(e);

// --- Fungsi Global Baru Untuk Slider Panah Sensor (Interaktif) ---
window.togglePushButtonLock = function(id, locked) {
    const comp = CircuitStore.components.find(c => c.id === id);
    if (!comp || comp.type !== 'push_button') return;
    
    comp.locked = locked;
    if (locked) {
        comp.state = '1'; // Terkunci dalam posisi tekan
    }
    // Update visual
    if (typeof ComponentDefs !== 'undefined') {
        const contentDiv = document.getElementById(`content-${id}`);
        if (contentDiv) {
            ComponentDefs.updateDOMState('push_button', comp, contentDiv, id);
        }
    }
    if (typeof HistoryManager !== 'undefined') {
        HistoryManager.saveStateToUndoStack('Kunci Push Button');
    }
};

// 🟢 FIX: Deklarasi eksplisit di luar fungsi (Module Scope) agar tidak mencemari global 'window'
let sensorSaveTimeout = null; 

window.adjustSensorValue = function(id, delta) {
    const comp = CircuitStore.components.find(c => c.id === id);
    if (!comp) return;
    let val = parseInt(comp.state || '50');
    val += delta;
    
    if (comp.type.startsWith('thermistor')) {
        val = Math.max(-40, Math.min(150, val)); // Termistor bisa dari -40 sampai 150
    } else {
        val = Math.max(0, Math.min(100, val));   // LDR & Potensiometer 0 sampai 100
    }
    
    comp.state = val.toString();
    
    const contentDiv = document.getElementById(`content-${id}`);
    if (contentDiv && typeof ComponentDefs !== 'undefined') {
        ComponentDefs.updateDOMState(comp.type, comp, contentDiv, id);
    }
    
    if (CircuitStore.isSimulationActive) SimulationEngine.run();
};

window.adjustVsineAmp = (id, delta) => {
  const comp = CircuitStore.components.find(c => c.id === id);
  if (!comp) return;
  let val = comp.customValue || 12;
  val += delta; // delta dalam Volt, misal ±1
  if (val > 24) val = 24;   // batas atas: 24Vp
  if (val < 1) val = 1;     // batas bawah: 1Vp
  comp.customValue = val;

  const cd = document.getElementById(`content-${id}`);
  if (cd) ComponentDefs.updateDOMState(comp.type, comp, cd, id);

  clearTimeout(sensorSaveTimeout);
  sensorSaveTimeout = setTimeout(() => {
    HistoryManager.saveStateToUndoStack(`Mengatur amplitudo V-Sine`);
  }, 500);
};

window.adjustVsineFreq = (id, delta) => {
  const comp = CircuitStore.components.find(c => c.id === id);
  if (!comp) return;
  let val = comp.freqValue || 1;
  val += delta; // delta dalam Hz, misal ±0.5
  val = Math.round(val * 10) / 10; // hindari hasil aneh seperti 1.4999999
  if (val > 5) val = 5;     // batas atas: 5Hz
  if (val < 0.1) val = 0.1; // batas bawah: 0.1Hz
  comp.freqValue = val;

  const cd = document.getElementById(`content-${id}`);
  if (cd) ComponentDefs.updateDOMState(comp.type, comp, cd, id);

  clearTimeout(sensorSaveTimeout);
  sensorSaveTimeout = setTimeout(() => {
    HistoryManager.saveStateToUndoStack(`Mengatur frekuensi V-Sine`);
  }, 500);
};

// window.adjustFlasherSpeed 
window.adjustFlasherSpeed = function(id, delta) {
    const comp = typeof CircuitStore !== 'undefined' ? CircuitStore.components.find(c => c.id === id) : null;
    if (comp) {
        if (comp.customValue === undefined) comp.customValue = 500;
        
        // Buat langkah (step) lebih halus jika periode sudah di bawah 100ms
        let step = delta;
        if (comp.customValue <= 100 && delta < 0) step = -10; // Turun per 10ms
        if (comp.customValue < 100 && delta > 0) step = 10;   // Naik per 10ms
        
        comp.customValue += step;
        
        // BATAS BAWAH BARU: 10ms (Setara dengan 50 Hz!)
        if (comp.customValue < 10) comp.customValue = 10;
        if (comp.customValue > 5000) comp.customValue = 5000;

        const contentDiv = document.getElementById(`content-${id}`);
        if (contentDiv && typeof ComponentDefs !== 'undefined') {
            ComponentDefs.updateDOMState('flasher', comp, contentDiv, id);
        }
    }
};


// ─── Multi Selection Logic ────────────────────────────────────────────────────
function clearSelection() {
  document.querySelectorAll('.circuit-component').forEach(c => c.classList.remove('selected'));
  CircuitStore.clearSelection();
}

function selectComponent(id) {
  clearSelection();
  CircuitStore.setSelection([id]);
  const comp = document.getElementById(`comp-${id}`);
  if (comp) comp.classList.add('selected');
}


// ─── Dimensions ───────────────────────────────────────────────────────────────
function setComponentDimensions(div, type) {
  const [w, h] = ComponentDefs.getDimensions(type);
  div.style.width = `${w}px`; div.style.height = `${h}px`;
  div.style.minWidth = `${w}px`; div.style.minHeight = `${h}px`;
}


// ─── Create Component ──────────────────────────────────────────────────────────
function createComponent(type, x, y, inputs, outputs) {
  const GRID_SIZE = 10;
  const id = ++CircuitStore.componentIdCounter;
  
  let startX = Math.max(0, x - 45);
  let startY = Math.max(0, y - 35);
  
  startX = Math.round(startX / GRID_SIZE) * GRID_SIZE;
  startY = Math.round(startY / GRID_SIZE) * GRID_SIZE;

  let defaultState = ['potentiometer', 'ldr', 'thermistor_ntc', 'thermistor_ptc'].includes(type) ? '50' : '0';

  const compData = {
    id, type, inputs, outputs,
    x: startX, y: startY,
    state: defaultState,
    customValue: (type === 'resistor') ? 330 : (type === 'fuse' ? 10 : (type === 'flasher' ? 500 : (type === 'vsine' ? 12 : (type === 'battery' || type === 'battery_multi' || type === 'power_terminal' ? 12 : (type === 'battery_1cell' ? 1.5 : (type === 'capacitor' ? 10 : null)))))),
    freqValue: (type === 'vsine') ? 1 : null,   // 🔧 frekuensi dalam Hz (default 1Hz, biar kelihatan jelas)
    inputStates: new Array(inputs).fill(0), outputState: 0,
    simV: 0, simI: 0
  };
  
  const div = buildComponentElement(compData);
  document.getElementById('canvas').appendChild(div);
  CircuitStore.addComponent({ ...compData, element: div });
  selectComponent(id);
  HistoryManager.saveStateToUndoStack(`Menambahkan ${type}`);
  if (CircuitStore.isSimulationActive) SimulationEngine.run();
}


// ─── Build component DOM element ───────────────────────────────────────────────
function buildComponentElement(compData) {
  const { id, type, inputs, outputs } = compData;
  const div = document.createElement('div');
  div.className = 'circuit-component';
  div.id = `comp-${id}`;
  div.style.left = `${compData.x}px`;
  div.style.top  = `${compData.y}px`;
  div.dataset.type = type;
  div.dataset.inputs = inputs;
  div.dataset.outputs = outputs;
  div.dataset.state = compData.state;
  div.dataset.compId = id;
  setComponentDimensions(div, type);

  if (type === 'resistor' && !compData.customValue) compData.customValue = 330;
  if (type === 'voltage_divider') {
      compData.r1Value = compData.r1Value || 10000; // Default R1: 10k Ohm
      compData.r2Value = compData.r2Value || 10000; // Default R2: 10k Ohm
  }
  if (type === 'fuse' && !compData.customValue) compData.customValue = 10;
  if ((type === 'battery' || type === 'battery_multi') && !compData.customValue) compData.customValue = 12;
  if (type === 'battery_1cell' && !compData.customValue) compData.customValue = 1.5;
  if (type === 'capacitor' && !compData.customValue) compData.customValue = 10;
  if (type === 'power_terminal' && !compData.customValue) compData.customValue = 12;

 // Tempatkan di dalam fungsi buildComponentElement (main.js)
  if (type === 'push_button') {
    const handlePress = (e) => {
      // 🟢 FIX: Blokir 'Ghost Click' pada perangkat sentuh (HP/Tablet)
      if (e.type === 'touchstart') e.preventDefault();
      
      const realComp = CircuitStore.components.find(c => c.id === id);
      if (!realComp) return;

      // Logika untuk tombol pengunci (merah/putih di bawah)
      if (e.target.closest('.lock-down-btn')) {
        e.stopPropagation(); e.preventDefault();
        realComp.locked = true; 
        realComp.state = '1';
        ComponentDefs.updateDOMState(type, realComp, div, id);
        if (CircuitStore.isSimulationActive) SimulationEngine.run();
        return;
      }
      
      if (e.target.closest('.lock-up-btn')) {
        e.stopPropagation(); e.preventDefault();
        realComp.locked = false; 
        realComp.state = '0';
        ComponentDefs.updateDOMState(type, realComp, div, id);
        if (CircuitStore.isSimulationActive) SimulationEngine.run();
        return;
      }
      
      if (e.target.closest('.delete-btn') || e.target.closest('.rotate-btn')) return;
      if (realComp.locked) return; 

      realComp.state = '1';
      ComponentDefs.updateDOMState(type, realComp, div, id);
      if (CircuitStore.isSimulationActive) SimulationEngine.run();
    };

    const handleRelease = (e) => {
      // 🟢 FIX: Blokir 'Ghost Click' pada perangkat sentuh (HP/Tablet)
      if (e.type === 'touchend') e.preventDefault();
      
      const realComp = CircuitStore.components.find(c => c.id === id);
      if (!realComp) return;
      
      if (realComp.locked) return; 
      if (realComp.state === '1') {
        realComp.state = '0';
        ComponentDefs.updateDOMState(type, realComp, div, id);
        if (CircuitStore.isSimulationActive) SimulationEngine.run();
      }
    };

    div.addEventListener('mousedown', handlePress);
    div.addEventListener('mouseup', handleRelease);
    div.addEventListener('mouseleave', handleRelease); 
    div.addEventListener('touchstart', handlePress, { passive: false });
    div.addEventListener('touchend', handleRelease, { passive: false });
  }
// 1. Terapkan rotasi awal dari data state ke element style
  compData.rotation = compData.rotation || 0;
  div.style.transform = `rotate(${compData.rotation}deg)`;

  // --- TOMBOL DELETE ---
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  deleteBtn.addEventListener('touchstart', e => { e.stopPropagation(); e.preventDefault(); deleteSingleComponent(id); }, {passive: false});
  deleteBtn.onclick = e => { e.stopPropagation(); e.preventDefault(); deleteSingleComponent(id); };
  div.appendChild(deleteBtn);

  // --- TOMBOL ROTASI ---
  const rotateBtn = document.createElement('button');
  rotateBtn.className = 'rotate-btn';
  rotateBtn.title = 'Putar Komponen (90°)';
  rotateBtn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>';
  
  const handleRotate = (e) => {
    e.stopPropagation();
    e.preventDefault();
    rotateComponent(id); // Memanggil fungsi global
  };
  rotateBtn.addEventListener('touchstart', handleRotate, { passive: false });
  rotateBtn.onclick = handleRotate;
  div.appendChild(rotateBtn);

  const contentDiv = document.createElement('div');
  contentDiv.style.width = '100%'; contentDiv.style.height = '100%';
  contentDiv.id = `content-${id}`;
  ComponentDefs.updateContent(type, id, compData, contentDiv, div);
  div.appendChild(contentDiv);

  for (let i = 0; i < inputs; i++)  div.appendChild(createConnectionPoint(id, 'input',  i, inputs,  type));
  for (let i = 0; i < outputs; i++) div.appendChild(createConnectionPoint(id, 'output', i, outputs, type));

  div.addEventListener('mousedown', e => {
    if (e.target.classList.contains('delete-btn') || 
        e.target.classList.contains('connection-point') || 
        e.target.classList.contains('control-btn') || 
        e.target.closest('.control-btn') || 
        e.target.closest('button')) return;
    e.stopPropagation(); startDragComponent(e, id);
  });
  
  div.addEventListener('touchstart', e => {
    if (e.target.closest('.delete-btn') || 
        e.target.closest('.connection-point') || 
        e.target.closest('.control-btn') || 
        e.target.closest('button')) return;
        
    if (e.touches.length === 1) { 
      e.stopPropagation(); 
      selectComponent(id); 
      startTouchDragComponent(e, id); 
    }
  }, { passive: false });

  div.addEventListener('click', e => {
    if ((type === 'switch_spst' || type === 'switch') && !e.target.classList.contains('delete-btn') && !e.target.classList.contains('connection-point') && !e.target.closest('button')) {
      e.stopPropagation(); toggleSwitch(id);
    }
  });
  return div;
}
// =========================================================
// SENSOR KLIK GANDA (DESKTOP) & KETUK GANDA (LAYAR SENTUH)
// =========================================================

const canvasArea = document.getElementById('canvas'); // Pastikan ID ini sesuai dengan elemen kanvas Anda

if (canvasArea) {
  // Masukkan nama komponen yang murni interaktif (tidak butuh menu setting)
    const ignoredTypes = ['switch', 'push_button', 'switch_spst'];
    
    // 1. SENSOR DESKTOP (Mouse Double Click)
    canvasArea.addEventListener('dblclick', function(e) {
        const comp = e.target.closest('[id^="comp-"]');
        if (e.target.closest('.btn-up, .btn-down, [class*="btn-"]')) return;
        
        if (comp) {
            const compId = comp.id.split('-')[1]; 
            const compType = comp.dataset.type;
            const subType = comp.dataset.subType || ''; 
            
            // CEK BLOKIR: Jika ini adalah saklar/tombol, hentikan fungsi di sini!
            if (ignoredTypes.includes(compType)) return;
            
            // Panggil menu UI Manager
            UIManager.openValueModal(compId, compType, subType);
        }
    });

    // 2. SENSOR LAYAR SENTUH (Mobile/Tablet Double Tap)
   let lastTapTime = 0;
    
    canvasArea.addEventListener('touchend', function(e) {
      if (e.target.closest('.btn-up, .btn-down, [class*="btn-"]')) return;
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        
        if (tapLength < 300 && tapLength > 0) {
            const comp = e.target.closest('[id^="comp-"]');
            
            if (comp) {
                const compId = comp.id.split('-')[1];
                const compType = comp.dataset.type;
                const subType = comp.dataset.subType || ''; 
                
                // CEK BLOKIR: Jika ini adalah saklar/tombol, hentikan fungsi di sini!
                if (ignoredTypes.includes(compType)) return;
                
                UIManager.openValueModal(compId, compType, subType);
                
                // Cegah zoom-in layar HP
                e.preventDefault(); 
            }
        }
        
        lastTapTime = currentTime;
    });
}
// =========================================================
// SENSOR KEYBOARD (PINTASAN MODAL SETTING)
// =========================================================
document.addEventListener('keydown', function(e) {
    const valueModal = document.getElementById('valueModal');
    
    // Pastikan sensor hanya aktif JIKA menu pengaturan sedang terbuka di layar
    if (valueModal && valueModal.classList.contains('show')) {
        
        // JIKA PENGGUNA MENEKAN 'ENTER' -> Simpan Pengaturan
        if (e.key === 'Enter') {
            e.preventDefault(); // Mencegah tombol Enter memicu fungsi lain yang tidak diinginkan
            
            // Panggil fungsi simpan (Mendukung pemanggilan via UIManager atau fungsi global)
            if (typeof UIManager !== 'undefined' && typeof UIManager.saveComponentValue === 'function') {
                UIManager.saveComponentValue();
            } else if (typeof saveComponentValue === 'function') {
                saveComponentValue();
            }
        } 
        
        // JIKA PENGGUNA MENEKAN 'ESCAPE' -> Tutup/Batal
        else if (e.key === 'Escape') {
            e.preventDefault();
            
            if (typeof UIManager !== 'undefined' && typeof UIManager.closeValueModal === 'function') {
                UIManager.closeValueModal();
            } else if (typeof closeValueModal === 'function') {
                closeValueModal();
            }
        }
    }
});

// ─── Connection points ─────────────────────────────────────────────────────────
function createConnection(srcId, srcPin, tgtId, tgtPin, waypoints = [], srcType = 'output', tgtType = 'input') {
  // 🟢 FIX SMART ROUTING: Buat ID unik statis berbasis waktu untuk kabel
  CircuitStore.wireIdCounter = CircuitStore.wireIdCounter || Date.now();
  const connId = `wire_${++CircuitStore.wireIdCounter}`;

  CircuitStore.addConnection({ 
    id: connId, // Simpan ID statis ke dalam memori
    source: { compId: Number(srcId), pinIndex: Number(srcPin), type: srcType }, 
    target: { compId: Number(tgtId), pinIndex: Number(tgtPin), type: tgtType },
    waypoints: waypoints
  });
  drawConnections(); updateConnectionPointVisuals();
  if (CircuitStore.isSimulationActive) SimulationEngine.run();
}

function createConnectionPoint(compId, pinType, index, total, compType) {
  const pt = document.createElement('div');
  pt.className = `connection-point ${pinType}`;
  pt.dataset.compId = compId; pt.dataset.pointType = pinType; pt.dataset.pointIndex = index;

  let x = 0, y = 0;
  switch (compType) {
    case 'battery':       x = 80; y = index === 0 ? 20 : 40; if (index === 1) pt.dataset.polarity = 'neg'; break;
    case 'battery_1cell': case 'battery_multi':
      x = index === 0 ? 0 : 80; 
      y = 30; 
      if (index === 1) pt.dataset.polarity = 'neg'; 
      break;
    case 'vsine': x = index === 0 ? 0 : 160; y = 35; break;
    case 'switch_spst':   x = pinType === 'input' ? 0 : 80; y = 20; break;
    case 'flasher':       x = pinType === 'input' ? 0 : 80; y = 20; break;
    case 'ff_jk':
      if (pinType === 'input') {
        if (index === 0) { x = 0; y = 25; }       // J
        else if (index === 1) { x = 0; y = 65; }  // K
        else if (index === 2) { x = 0; y = 45; }  // CLK
        else if (index === 3) { x = 40; y = 0; }  // SET (Atas)
        else if (index === 4) { x = 40; y = 90; } // RESET (Bawah)
      } else {
        x = 80; y = index === 0 ? 25 : 65;
      }
      break;

    case 'ff_d':
      if (pinType === 'input') {
        if (index === 0) { x = 0; y = 25; }       // D
        else if (index === 1) { x = 0; y = 55; }  // CLK
        else if (index === 2) { x = 40; y = 0; }  // SET (Atas)
        else if (index === 3) { x = 40; y = 80; } // RESET (Bawah)
      } else {
        x = 80; y = index === 0 ? 25 : 55;
      }
      break;

    case 'ff_sr': case 'ff_t':
      if (pinType === 'input') { x = 0; y = index === 0 ? 20 : (compType === 'ff_sr' && index === 1 ? 70 : (compType === 'ff_sr' ? 45 : 60)); } 
      else { x = 80; y = index === 0 ? 20 : (compType === 'ff_sr' ? 70 : 60); }
      break;
    case 'relay_5pin':
      if (pinType === 'input') {
        x = 0; 
        y = index === 0 ? 20 : 70; // 0 = 85 (Koil), 1 = 30 (Common)
      } else {
        x = 80; 
        if (index === 0) { y = 20; pt.dataset.polarity = 'neg'; } // 0 = 86 (Koil / Ground)
        else if (index === 1) { y = 50; } // 1 = 87a (NC)
        else if (index === 2) { y = 90; } // 2 = 87 (NO)
      }
      break;
    case 'power_terminal':  x = 30; y = 40; break;
    case 'output_terminal': x = 0; y = 20; break;
    case 'relay':         if (pinType === 'input') { x = 0; y = index === 0 ? 20 : 60; } else { x = 80; y = index === 0 ? 20 : 60; if (index === 0) pt.dataset.polarity = 'neg'; } break;
    case 'ground':        x = 20; y = 0; pt.dataset.polarity = 'neg'; break;
    case 'voltage_divider': 
      x = pinType === 'input' ? 0 : 80; y = 30; 
      break;
    case 'logic_probe':   
      x = 0; y = 20; 
      break;
      
    case 'fuse': case 'resistor':
      x = pinType === 'input' ? 0 : 80; y = 20; 
      break;
    
    case 'ldr': case 'thermistor_ntc': case 'thermistor_ptc': 
      x = pinType === 'input' ? 0 : 80; y = 25; 
      break;
      
    case 'potentiometer': if (pinType === 'input') { x = index === 0 ? 0 : 80; y = 20; } else { x = 40; y = 60; } break;
    case 'motor_dc':      x = pinType === 'input' ? 0 : 80; y = 40; break;
    case 'oscilloscope':  x = 0; y = index === 0 ? 100 : 140; break;
    case 'servo':         x = 0; y = index === 0 ? 20 : (index === 1 ? 40 : 60); break;
    case 'solenoid':      x = pinType === 'input' ? 0 : 80; y = 30; break;
    case 'led':           x = pinType === 'input' ? 0 : 60; y = 30; break;
    case 'diode':         x = pinType === 'input' ? 0 : 60; y = 20; break;
    case 'diode_bridge':
  if (pinType === 'input') { x = 70; y = index === 0 ? 0 : 140; }   // in0 = AC atas, in1 = AC bawah
  else { x = index === 0 ? 140 : 0; y = 70; if (index === 1) pt.dataset.polarity = 'neg'; } // out0 = (+) kanan, out1 = (-) kiri
  break;
    case 'switch':        x = 60; y = 20; break;
    case 'clock_pulse':   x = 60; y = 20; break;
    case 'push_button':   x = pinType === 'input' ? 0 : 60; y = 20; break;
    case 'junction':      x = pinType === 'input' ? 0 : 60; y = pinType === 'input' ? 30 : (index === 0 ? 10 : index === 1 ? 30 : 50); break;
    case 'wire_1to1':     x = pinType === 'input' ? 0 : 60; y = 20; break;
    case 'wire_1to2':     x = pinType === 'input' ? 0 : 60; y = pinType === 'input' ? 30 : (index === 0 ? 15 : 45); break;
    case 'opamp':         if (pinType === 'input') { x = 0; y = index === 0 ? 18 : 42; } else { x = 80; y = 30; } break;
    case 'opamp_5pin':
      if (pinType === 'input') {
        if (index === 0) { x = 0; y = 20; }       // In (+) Atas
        else if (index === 1) { x = 0; y = 40; }  // In (-) Bawah
        else if (index === 2) { x = 40; y = 0; }  // V+ (Power Positif)
        else if (index === 3) { x = 40; y = 60; } // V- (Power Negatif)
      } else { x = 80; y = 30; } break;
    case 'voltmeter':     x = index === 0 ? 0 : 80; y = 40; if (index === 1) pt.dataset.polarity = 'neg'; break;
    case 'ammeter':       x = pinType === 'input' ? 0 : 80; y = 40; break;
    case 'transformer':
      if (pinType === 'input') { x = 0; y = index === 0 ? 30 : 70; } 
      else { x = 100; y = index === 0 ? 20 : (index === 1 ? 50 : 80); }
      break;
    case 'capacitor':     
      x = pinType === 'input' ? 0 : 80; y = 20; 
      break;
    case 'ic_4017':
      if (pinType === 'input') {
        if (index === 0) { x = 0; y = 60; }       // CLK (Clock)
        else if (index === 1) { x = 0; y = 100; } // ENA (Enable / Inhibit)
        else if (index === 2) { x = 0; y = 140; } // RST (Reset)
        else if (index === 3) { x = 60; y = 0; }  // VCC (Power Positif Atas)
        else if (index === 4) { x = 60; y = 240; pt.dataset.polarity = 'neg'; } // GND (Power Negatif Bawah)
      } else {
        // Output index 0-9 adalah Q0-Q9, index 10 adalah CO (Carry Out)
        x = 120;
        y = 20 + (index * 20); // Berjejer ke bawah: 20, 40, 60, ... 220
      }
      break;
    case 'ic_4518':
      if (pinType === 'input') {
        x = 0; // Menempel di garis kiri
        if (index === 0) y = 25;       // Pin CLK
        else if (index === 1) y = 45;  // Pin EN
        else if (index === 2) y = 65;  // Pin RST
      } else {
        x = 100; // Menempel di garis kanan (karena lebar bodi 100px)
        if (index === 0) y = 20;       // Pin Q0
        else if (index === 1) y = 40;  // Pin Q1
        else if (index === 2) y = 60;  // Pin Q2
        else if (index === 3) y = 80;  // Pin Q3
      }
      break;  
    case 'ic_4511':
      if (pinType === 'input') {
        x = 0; // Menempel di garis kiri
        y = 20 + (index * 20); // Pin 0 di Y:20, Pin 1 di Y:40, dst sampai 140
      } else {
        x = 120; // Menempel di garis kanan (Lebar IC 120px)
        y = 20 + (index * 20); // Pin 0 di Y:20, Pin 1 di Y:40, dst sampai 140
      }
      break;
    case 'ic_555':
      if (pinType === 'input') {
        if (index === 0) { x = 60; y = 160; pt.dataset.polarity = 'neg'; } 
        else if (index === 1) { x = 0; y = 100; } 
        else if (index === 2) { x = 0; y = 40; } 
        else if (index === 3) { x = 0; y = 70; } 
        else if (index === 4) { x = 120; y = 100; } 
        else if (index === 5) { x = 60; y = 0; } 
      } else { 
        if (index === 0) { x = 120; y = 40; } 
        else if (index === 1) { x = 120; y = 70; } 
      }
      break;  
    case 'seven_segment':
      if (pinType === 'input') {
        x = 0; // Kiri
        y = 20 + (index * 20); // Pin a-g berjejer ke bawah (20, 40, 60... 140)
      } else {
        x = 150; // Kanan
        y = 140; // Pin COM berada di sudut kanan bawah
        pt.dataset.polarity = 'neg'; // Memberi tanda bahwa ini butuh Ground (GND)
      }
      break;  
    case 'bjt_npn': case 'bjt_pnp':
      if (pinType === 'input') { x = index === 0 ? 0 : 40; y = index === 0 ? 40 : 0; } 
      else { x = 40; y = 80; }
      break;
    case 'mosfet_n': case 'mosfet_p':
      if (pinType === 'input') { x = index === 0 ? 0 : 50; y = index === 0 ? 50 : 0; } 
      else { x = 50; y = 100; }
      break;
    default:
      x = pinType === 'input' ? 0 : 80; y = total === 1 ? 30 : (index === 0 ? 20 : 40); break;
  }

  pt.style.left = `${x}px`; pt.style.top = `${y}px`;
  const handleInteract = (e) => { e.stopPropagation(); e.preventDefault(); handleConnectionClick(compId, pinType, index); };
  pt.addEventListener('click', handleInteract); pt.addEventListener('mousedown', e => { e.stopPropagation(); e.preventDefault(); });
  pt.addEventListener('touchstart', handleInteract, { passive: false });
  return pt;
}


// ─── Connection logic ──────────────────────────────────────────────────────────
function updateConnectionPointVisuals() {
  // 1. Bersihkan status 'connected' dari SEMUA pin (baik input maupun output)
  document.querySelectorAll('.connection-point').forEach(p => { 
    p.classList.remove('connected'); 
    p.title = 'Klik untuk menghubungkan'; 
  });
  
  // 2. Beri warna hijau pada KEDUA ujung kabel (Source dan Target)
  CircuitStore.connections.forEach(conn => {
    // A. Mewarnai pin asal (Source)
    let sType = conn.source.type || 'output';
    const sourceEl = document.querySelector(`#comp-${conn.source.compId} .connection-point[data-point-type="${sType}"][data-point-index="${conn.source.pinIndex}"]`);
    if (sourceEl) { 
        sourceEl.classList.add('connected'); 
        sourceEl.title = 'Terhubung'; 
    }
    
    // B. Mewarnai pin tujuan (Target)
    let tType = conn.target.type || 'input';
    const targetEl = document.querySelector(`#comp-${conn.target.compId} .connection-point[data-point-type="${tType}"][data-point-index="${conn.target.pinIndex}"]`);
    if (targetEl) { 
        targetEl.classList.add('connected'); 
        targetEl.title = 'Terhubung'; 
    }
  });
}

function deleteConnection(srcId, srcPin, tgtId, tgtPin) {
  HistoryManager.saveStateToUndoStack('Menghapus kabel'); 
  const before = CircuitStore.connections.length;
  CircuitStore.removeConnection(srcId, srcPin, tgtId, tgtPin);
  if (CircuitStore.connections.length < before) {
    drawConnections(); updateConnectionPointVisuals();
    if (CircuitStore.isSimulationActive) SimulationEngine.run();
  }
}

function handleConnectionClick(compId, type, index) {
  compId = Number(compId); index = Number(index);

  if (!CircuitStore.connectionStart) {
    CircuitStore.connectionStart = { compId, type, index };
    UIManager.showToast('Pilih titik lain untuk menyambungkan kabel (ESC: Batal)');
    document.querySelectorAll('.connection-point').forEach(p => p.style.boxShadow = 'none');
    const sp = document.querySelector(`[data-comp-id="${compId}"][data-point-type="${type}"][data-point-index="${index}"]`);
    if (sp) { sp.classList.add('pending'); }
    return;
  }

  if (CircuitStore.connectionStart.compId === compId && CircuitStore.connectionStart.type === type && CircuitStore.connectionStart.index === index) {
    CircuitStore.connectionStart = null;
    document.querySelectorAll('.connection-point').forEach(p => p.classList.remove('pending'));
    UIManager.showToast('Koneksi dibatalkan');
    return;
  }

  const startType = CircuitStore.connectionStart.type;
  document.querySelectorAll('.connection-point').forEach(p => p.classList.remove('pending'));

 let srcId, srcPin, tgtId, tgtPin, tgtIsInput, srcType, tgtType;
  if (startType === 'output' && type === 'input') { 
      srcId = CircuitStore.connectionStart.compId; srcPin = CircuitStore.connectionStart.index; srcType = 'output'; 
      tgtId = compId; tgtPin = index; tgtType = 'input'; 
      tgtIsInput = true; 
  }
  else if (startType === 'input' && type === 'output') { 
      // 🟢 FIX V22: Memperbaiki bug amnesia arah jika ditarik dari Input ke Output
      srcId = compId; srcPin = index; srcType = 'output'; 
      tgtId = CircuitStore.connectionStart.compId; tgtPin = CircuitStore.connectionStart.index; tgtType = 'input'; 
      tgtIsInput = true; 
  }
  else { 
      srcId = CircuitStore.connectionStart.compId; srcPin = CircuitStore.connectionStart.index; srcType = startType; 
      tgtId = compId; tgtPin = index; tgtType = type; 
      tgtIsInput = false; 
  }
  CircuitStore.connectionStart = null;

// 🟢 FIX V17: Buka gembok agar bisa membuat Self-Holding Relay!
  // if (srcId === tgtId) return UIManager.showToast('Tidak bisa menghubungkan ke komponen yang sama');
  const exists = CircuitStore.connections.find(c =>
    (c.source.compId === srcId && c.source.pinIndex === srcPin && c.target.compId === tgtId && c.target.pinIndex === tgtPin) ||
    (c.source.compId === tgtId && c.source.pinIndex === tgtPin && c.target.compId === srcId && c.target.pinIndex === srcPin)
  );
  if (exists) return UIManager.showToast('Koneksi ini sudah ada');

  HistoryManager.saveStateToUndoStack('Menambahkan kabel');

  // BUGFIX: Sebuah pin INPUT hanya boleh menerima 1 sumber kabel. Jika pin input
  // yang dituju sudah punya koneksi lain (terlihat dari class 'connected' di
  // updateConnectionPointVisuals dengan tooltip "klik untuk ganti"), kabel lama
  // dilepas dulu agar tidak terjadi 2 sumber bertabrakan di satu input (short/konflik logika).
  if (tgtIsInput) {
    let allowMultipleInputs = false;
    const targetComp = CircuitStore.components.find(c => c.id === tgtId);
    
    const allowedTypes = [
        'ground', 'power_terminal', 'junction', 
        'resistor', 'capacitor', 'led', 'diode', 'diode_bridge',
        'ammeter', 'voltmeter', 'oscilloscope', 
        'motor_dc', 'solenoid', 'relay', 'relay_5pin'
    ];

    if (targetComp && allowedTypes.includes(targetComp.type)) {
        allowMultipleInputs = true;
    }

    if (!allowMultipleInputs) {
        const replaced = CircuitStore.removeConnectionsTargeting(tgtId, tgtPin);
        if (replaced) UIManager.showToast('Kabel lama pada pin ini diganti');
    }
  }

createConnection(srcId, srcPin, tgtId, tgtPin, [], srcType, tgtType);
  UIManager.showToast('Kabel terhubung!');
}


// ─── Draw connections (Advanced Smart Routing) ────────────────────────────────
function getPinPosition(compId, pinType, pinIndex) {
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

function drawConnections() {
  const svg = document.getElementById('wire-svg');
  if (!svg) return;
  
  // 🟢 Menggunakan ID, bukan Index
  const activePathIds = new Set();

  CircuitStore.connections.forEach((conn, idx) => {
    // Fallback: Jika ini adalah sirkuit hasil Save/Load lama yang belum punya ID
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
        conn.waypoints.forEach(wp => { pathStr += `L ${wp.x} ${wp.y} `; });
        pathStr += `L ${tp.x} ${tp.y}`;
    } else {
        const wS = ComponentDefs.getDimensions(compS.type)[0] || 60;
        const wT = ComponentDefs.getDimensions(compT.type)[0] || 60;
        
        let spDirX = 0;
        if (sp.x < compS.x + wS/2 - 5) spDirX = -1;
        else if (sp.x > compS.x + wS/2 + 5) spDirX = 1;

        let tpDirX = 0;
        if (tp.x < compT.x + wT/2 - 5) tpDirX = -1;
        else if (tp.x > compT.x + wT/2 + 5) tpDirX = 1;

        if (spDirX === 0) spDirX = (tp.x > sp.x) ? 1 : -1;
        if (tpDirX === 0) tpDirX = (sp.x > tp.x) ? 1 : -1;

        const offsetS = 25; 
        const offsetT = 25; 

        let p1x = sp.x + (spDirX * offsetS);
        let p2x = tp.x + (tpDirX * offsetT);

        if (spDirX === tpDirX) {
            let bracketX = (spDirX === 1) ? Math.max(p1x, p2x) + 10 : Math.min(p1x, p2x) - 10;
            pathStr += `L ${bracketX} ${sp.y} L ${bracketX} ${tp.y} L ${tp.x} ${tp.y}`;
        } else {
            const isFacing = (spDirX === 1 && tpDirX === -1 && sp.x <= tp.x) || 
                             (spDirX === -1 && tpDirX === 1 && sp.x >= tp.x);
            if (isFacing) {
                let midX = (p1x + p2x) / 2;
                pathStr += `L ${midX} ${sp.y} L ${midX} ${tp.y} L ${tp.x} ${tp.y}`;
            } else {
                let wrapY;
                if (Math.abs(sp.y - tp.y) < 60) {
                    const hS = ComponentDefs.getDimensions(compS.type)[1] || 60;
                    const hT = ComponentDefs.getDimensions(compT.type)[1] || 60;
                    wrapY = Math.max(compS.y + hS, compT.y + hT) + 20; 
                } else {
                    wrapY = (sp.y + tp.y) / 2;
                }
                pathStr += `L ${p1x} ${sp.y} L ${p1x} ${wrapY} L ${p2x} ${wrapY} L ${p2x} ${tp.y} L ${tp.x} ${tp.y}`;
            }
        }
    }

    // 🟢 Mencari elemen SVG berdasarkan ID unik, bukan Index
    let path = svg.querySelector(`path[data-wire-id="${conn.id}"]`);
    
    if (!path) {
        path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', 'none');
        path.setAttribute('data-wire-id', conn.id); // 🟢 Set Atribut data-wire-id
        path.style.pointerEvents = 'stroke'; 
        path.style.cursor = 'pointer';

        const handleDel = (e) => { 
            e.stopPropagation(); e.preventDefault(); 
            UIManager.showConfirmToast('Hapus kabel ini?', () => { deleteConnection(+path.dataset.sId, +path.dataset.sIdx, +path.dataset.tId, +path.dataset.tIdx); }); 
        };
        path.addEventListener('click', handleDel); 
        path.addEventListener('touchstart', handleDel, {passive: false});
        
        svg.appendChild(path);
    }

    path.setAttribute('d', pathStr);
    
    path.dataset.sId = conn.source.compId; 
    path.dataset.sIdx = conn.source.pinIndex;
    path.dataset.sType = sType;           
    path.dataset.tId = conn.target.compId; 
    path.dataset.tIdx = conn.target.pinIndex;
    path.dataset.tType = tType;           

    const isGroundWire = sp.isNeg || tp.isNeg;
    path.setAttribute('stroke', isGroundWire ? '#000000' : 'var(--wire-default)');
    if (isGroundWire) path.classList.add('wire-ground-base');
    else path.classList.remove('wire-ground-base');
  });
  
  // 🟢 Hapus SVG sisa yang ID-nya tidak ada di set activePathIds
  svg.querySelectorAll('path[data-wire-id]').forEach(p => {
    if (!activePathIds.has(p.getAttribute('data-wire-id'))) {
      p.remove();
    }
  });

  updateConnectionPointVisuals();
}

// Variabel untuk menyimpan ID frame animasi
let drawConnectionsRAF = null;
function optimizedDrawConnections() {
    if (drawConnectionsRAF) cancelAnimationFrame(drawConnectionsRAF);
    drawConnectionsRAF = requestAnimationFrame(() => {
        drawConnections();
        drawConnectionsRAF = null;
    });
}

// ─── Drag component & Group Drag ───────────────────────────────────────────────
function startDragComponent(e, compId) {
  if (!CircuitStore.selectedComponents.includes(compId)) selectComponent(compId);

  const startX = e.clientX;
  const startY = e.clientY;
  let moved = false;
  const GRID_SIZE = 10;

  const dragGroup = CircuitStore.selectedComponents.map(id => {
    const comp = document.getElementById(`comp-${id}`);
    return { id: id, el: comp, origL: parseFloat(comp.style.left) || 0, origT: parseFloat(comp.style.top) || 0 };
  });

  // Simpan waypoint kabel asli sebelum digeser, agar kabel custom ikut menyesuaikan
  // posisi saat komponen yang terhubung dipindahkan (sama seperti versi touch-drag).
  const affectedConnections = CircuitStore.connections.filter(conn =>
    CircuitStore.selectedComponents.includes(conn.source.compId) || CircuitStore.selectedComponents.includes(conn.target.compId)
  ).map(conn => {
    const spOrig = getPinPosition(conn.source.compId, 'output', conn.source.pinIndex) || getPinPosition(conn.source.compId, 'input', conn.source.pinIndex);
    const tpOrig = getPinPosition(conn.target.compId, 'input', conn.target.pinIndex) || getPinPosition(conn.target.compId, 'output', conn.target.pinIndex);
    return { conn, origWaypoints: JSON.parse(JSON.stringify(conn.waypoints || [])), sourceMoved: CircuitStore.selectedComponents.includes(conn.source.compId), targetMoved: CircuitStore.selectedComponents.includes(conn.target.compId), spOrig, tpOrig };
  });

  let localSaveTimeout = null;

  function onMove(e) {
    const dx = (e.clientX - startX) / UIManager.currentZoom;
    const dy = (e.clientY - startY) / UIManager.currentZoom;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true;

    let snapDx = 0, snapDy = 0;

    dragGroup.forEach(item => {
        let newX = Math.max(0, item.origL + dx);
        let newY = Math.max(0, item.origT + dy);
        
        newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
        newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
        
        if (item.id === compId) {
           snapDx = newX - item.origL;
           snapDy = newY - item.origT;
        }

        item.el.style.left = `${newX}px`;
        item.el.style.top = `${newY}px`;

        // --- TAMBAHKAN DUA BARIS INI ---
        // Perbarui state secara real-time agar kabel tidak error
        const cd = CircuitStore.components.find(c => c.id === item.id);
        if (cd) { cd.x = newX; cd.y = newY; }
      });

    affectedConnections.forEach(({ conn, origWaypoints, sourceMoved, targetMoved, spOrig, tpOrig }) => {
      if (sourceMoved && targetMoved) {
        conn.waypoints = origWaypoints.map(wp => ({ x: wp.x + snapDx, y: wp.y + snapDy }));
      } else if (origWaypoints.length > 0) {
        const N = origWaypoints.length;
        conn.waypoints = origWaypoints.map((wp, i) => {
          let nextX = wp.x; let nextY = wp.y;
          if (sourceMoved) {
            const isHorizontal = Math.abs(spOrig.x - origWaypoints[0].x) > Math.abs(spOrig.y - origWaypoints[0].y);
            if (isHorizontal) { if (i % 2 === 0) nextY += snapDy; else nextX += snapDx; }
            else { if (i % 2 === 0) nextX += snapDx; else nextY += snapDy; }
          } else if (targetMoved) {
            const isHorizontal = Math.abs(origWaypoints[N-1].x - tpOrig.x) > Math.abs(origWaypoints[N-1].y - tpOrig.y);
            const distFromT = (N - 1) - i;
            if (isHorizontal) { if (distFromT % 2 === 0) nextY += snapDy; else nextX += snapDx; }
            else { if (distFromT % 2 === 0) nextX += snapDx; else nextY += snapDy; }
          }
          return { x: nextX, y: nextY };
        });
      }
    });

    optimizedDrawConnections();
  }

  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    if (moved) {
      dragGroup.forEach(item => {
        const cd = CircuitStore.components.find(c => c.id === item.id);
        if (cd) { cd.x = parseFloat(item.el.style.left) || 0; cd.y = parseFloat(item.el.style.top) || 0; }
      });
      clearTimeout(localSaveTimeout);
      localSaveTimeout = setTimeout(() => HistoryManager.saveStateToUndoStack(`Memindahkan ${dragGroup.length} komponen`), 200);
    }
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function startTouchDragComponent(e, compId) {
  if (!CircuitStore.selectedComponents.includes(compId)) selectComponent(compId);
  const t0 = e.touches[0];
  const startX = t0.clientX, startY = t0.clientY;
  let moved = false;
  let localSaveTimeout = null;
  const GRID_SIZE = 10;

  const dragGroup = CircuitStore.selectedComponents.map(id => {
    const comp = document.getElementById(`comp-${id}`);
    return { id: id, el: comp, origL: parseFloat(comp.style.left)||0, origT: parseFloat(comp.style.top)||0 };
  });

  const affectedConnections = CircuitStore.connections.filter(conn => 
    CircuitStore.selectedComponents.includes(conn.source.compId) || CircuitStore.selectedComponents.includes(conn.target.compId)
  ).map(conn => {
    const spOrig = getPinPosition(conn.source.compId, 'output', conn.source.pinIndex) || getPinPosition(conn.source.compId, 'input', conn.source.pinIndex);
    const tpOrig = getPinPosition(conn.target.compId, 'input', conn.target.pinIndex) || getPinPosition(conn.target.compId, 'output', conn.target.pinIndex);
    return { conn, origWaypoints: JSON.parse(JSON.stringify(conn.waypoints || [])), sourceMoved: CircuitStore.selectedComponents.includes(conn.source.compId), targetMoved: CircuitStore.selectedComponents.includes(conn.target.compId), spOrig, tpOrig };
  });

  function onMove(e) {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    e.stopPropagation();
    const dx = (e.touches[0].clientX - startX) / UIManager.currentZoom;
    const dy = (e.touches[0].clientY - startY) / UIManager.currentZoom;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
    if (moved) {
      let snapDx = 0, snapDy = 0;

dragGroup.forEach(item => {
        let newX = Math.max(0, item.origL + dx);
        let newY = Math.max(0, item.origT + dy);
        
        newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
        newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
        
        if (item.id === compId) {
           snapDx = newX - item.origL;
           snapDy = newY - item.origT;
        }

        item.el.style.left = `${newX}px`;
        item.el.style.top = `${newY}px`;

        // --- TAMBAHKAN DUA BARIS INI ---
        // Perbarui state secara real-time agar kabel tidak error
        const cd = CircuitStore.components.find(c => c.id === item.id);
        if (cd) { cd.x = newX; cd.y = newY; }
      });
      
      affectedConnections.forEach(({ conn, origWaypoints, sourceMoved, targetMoved, spOrig, tpOrig }) => {
        if (sourceMoved && targetMoved) {
          conn.waypoints = origWaypoints.map(wp => ({ x: wp.x + snapDx, y: wp.y + snapDy }));
        } else if (origWaypoints.length > 0) {
          const N = origWaypoints.length;
          conn.waypoints = origWaypoints.map((wp, i) => {
            let nextX = wp.x; let nextY = wp.y;
            if (sourceMoved) {
              const isHorizontal = Math.abs(spOrig.x - origWaypoints[0].x) > Math.abs(spOrig.y - origWaypoints[0].y);
              if (isHorizontal) { if (i % 2 === 0) nextY += snapDy; else nextX += snapDx; } 
              else { if (i % 2 === 0) nextX += snapDx; else nextY += snapDy; }
            } else if (targetMoved) {
              const isHorizontal = Math.abs(origWaypoints[N-1].x - tpOrig.x) > Math.abs(origWaypoints[N-1].y - tpOrig.y);
              const distFromT = (N - 1) - i;
              if (isHorizontal) { if (distFromT % 2 === 0) nextY += snapDy; else nextX += snapDx; } 
              else { if (distFromT % 2 === 0) nextX += snapDx; else nextY += snapDy; }
            }
            return { x: nextX, y: nextY };
          });
        }
      });
      optimizedDrawConnections();
    }
  }
  
  function onEnd() {
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);
    if (moved) {
      dragGroup.forEach(item => {
        const cd = CircuitStore.components.find(c => c.id === item.id);
        if (cd) { cd.x = parseFloat(item.el.style.left)||0; cd.y = parseFloat(item.el.style.top)||0; }
      });
      clearTimeout(localSaveTimeout);
      localSaveTimeout = setTimeout(() => HistoryManager.saveStateToUndoStack(`Memindahkan ${dragGroup.length} komponen`), 200);
    }
  }
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd);
}

// ─── Drag from sidebar & Klik untuk Menambah ──────────────────────────────────
let draggedCard = null;

document.querySelectorAll('.component-card').forEach(card => {
  // Fitur 1: Klik/Ketuk untuk menambah komponen (Sempurna untuk HP & Desktop)
  card.addEventListener('click', (e) => {
    if (card.classList.contains('dragging')) return;
    const wrapper = document.getElementById('canvas-wrapper');
    
    // Kalkulasi baru: Membaca posisi scroll (Pasti jatuh di tengah layar)
    const x = (wrapper.scrollLeft + wrapper.clientWidth / 2) / UIManager.currentZoom;
    const y = (wrapper.scrollTop + wrapper.clientHeight / 2) / UIManager.currentZoom;
    
    createComponent(card.dataset.type, x, y, +card.dataset.inputs, +card.dataset.outputs);
    UIManager.showToast('✅ Komponen ditambahkan');

    // 🟢 LOGIKA BARU: Otomatis tutup laci setelah komponen dipilih (khusus HP)
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('open');
    }
  });

  // Fitur 2: Drag and Drop Asli (Hanya akan aktif untuk Mouse di Laptop/Desktop)
  card.addEventListener('dragstart', e => {
    draggedCard = card;
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: card.dataset.type, inputs: +card.dataset.inputs, outputs: +card.dataset.outputs }));
    card.classList.add('dragging');
  });
  
  card.addEventListener('dragend', () => { 
    card.classList.remove('dragging'); 
    draggedCard = null; 
  });
});

function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }
function handleDrop(e) {
  e.preventDefault();
  const canvas = document.getElementById('canvas');
  const cr = canvas.getBoundingClientRect();
  const x = (e.clientX - cr.left) / UIManager.currentZoom;
  const y = (e.clientY - cr.top) / UIManager.currentZoom;
  try {
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    createComponent(data.type, x, y, data.inputs, data.outputs);
    UIManager.showToast('✅ Komponen ditambahkan');
  } catch(err) {}
}


// ─── MARQUEE SELECTION ─────────────────────────────────────────────────────────
function handleCanvasMouseDown(e) {
  if (e.target.id !== 'canvas' && e.target.id !== 'wire-overlay' && e.target.id !== 'wire-svg') return;
  if (e.button !== 0) return;

  if (!e.shiftKey) clearSelection();

  if (CircuitStore.connectionStart) {
    CircuitStore.connectionStart = null;
    document.querySelectorAll('.connection-point').forEach(p => p.classList.remove('pending'));
    return;
  }

  CircuitStore.isMarqueeSelecting = true;
  const canvas = document.getElementById('canvas');
  const cr = canvas.getBoundingClientRect();
  CircuitStore.marqueeStart.x = (e.clientX - cr.left) / UIManager.currentZoom;
  CircuitStore.marqueeStart.y = (e.clientY - cr.top) / UIManager.currentZoom;

  const selBox = document.getElementById('selection-box');
  selBox.style.left = CircuitStore.marqueeStart.x + 'px';
  selBox.style.top = CircuitStore.marqueeStart.y + 'px';
  selBox.style.width = '0px';
  selBox.style.height = '0px';
  selBox.style.display = 'block';
}

window.addEventListener('mousemove', e => {
  if (!CircuitStore.isMarqueeSelecting) return;
  const canvas = document.getElementById('canvas');
  const cr = canvas.getBoundingClientRect();
  const currentX = (e.clientX - cr.left) / UIManager.currentZoom;
  const currentY = (e.clientY - cr.top) / UIManager.currentZoom;

  const left = Math.min(CircuitStore.marqueeStart.x, currentX);
  const top = Math.min(CircuitStore.marqueeStart.y, currentY);
  const width = Math.abs(currentX - CircuitStore.marqueeStart.x);
  const height = Math.abs(currentY - CircuitStore.marqueeStart.y);

  const selBox = document.getElementById('selection-box');
  selBox.style.left = left + 'px';
  selBox.style.top = top + 'px';
  selBox.style.width = width + 'px';
  selBox.style.height = height + 'px';

  CircuitStore.selectedComponents = [];
  CircuitStore.components.forEach(c => {
    const el = document.getElementById(`comp-${c.id}`);
    if (!el) return;
    const cx = parseFloat(el.style.left);
    const cy = parseFloat(el.style.top);
    const cw = parseFloat(el.style.width) || ComponentDefs.getDimensions(c.type)[0];
    const ch = parseFloat(el.style.height) || ComponentDefs.getDimensions(c.type)[1];

    if (cx < left + width && cx + cw > left && cy < top + height && cy + ch > top) {
      CircuitStore.selectedComponents.push(c.id);
      el.classList.add('selected');
    } else {
      el.classList.remove('selected');
    }
  });
});

window.addEventListener('mouseup', () => {
  if (CircuitStore.isMarqueeSelecting) {
    CircuitStore.isMarqueeSelecting = false;
    document.getElementById('selection-box').style.display = 'none';
  }
});


// ─── Delete component ──────────────────────────────────────────────────────────
function deleteSelectedComponents() {
  if (CircuitStore.selectedComponents.length === 0) return;
  HistoryManager.saveStateToUndoStack(`Menghapus ${CircuitStore.selectedComponents.length} komponen`);

  CircuitStore.selectedComponents.forEach(id => {
    if (CircuitStore.connectionStart && CircuitStore.connectionStart.compId === id) {
      CircuitStore.connectionStart = null;
      document.querySelectorAll('.connection-point').forEach(p => p.classList.remove('pending'));
    }
    const el = document.getElementById(`comp-${id}`);
    if (el) el.remove();
    CircuitStore.removeComponent(id);
    if (CircuitStore.currentEditingComponent && CircuitStore.currentEditingComponent.id === id) UIManager.closeValueModal();
  });

  if (CircuitStore.components.length === 0) CircuitStore.componentIdCounter = 0;

  CircuitStore.selectedComponents = [];
  drawConnections(); updateConnectionPointVisuals();
  if (CircuitStore.isSimulationActive) SimulationEngine.run();
  UIManager.showToast('Komponen dihapus');
}

function deleteSingleComponent(id) {
  if (CircuitStore.selectedComponents.includes(id)) {
    deleteSelectedComponents();
    return;
  }

  HistoryManager.saveStateToUndoStack('Menghapus komponen');
  if (CircuitStore.connectionStart && CircuitStore.connectionStart.compId === id) {
    CircuitStore.connectionStart = null;
    document.querySelectorAll('.connection-point').forEach(p => p.classList.remove('pending'));
  }
  const el = document.getElementById(`comp-${id}`);
  if (el) el.remove();

  CircuitStore.removeComponent(id);
  if (CircuitStore.components.length === 0) CircuitStore.componentIdCounter = 0;

  if (CircuitStore.selectedComponents.includes(id)) clearSelection();
  if (CircuitStore.currentEditingComponent && CircuitStore.currentEditingComponent.id === id) UIManager.closeValueModal();

  drawConnections(); updateConnectionPointVisuals();
  if (CircuitStore.isSimulationActive) SimulationEngine.run();
}


// ─── Switch ────────────────────────────────────────────────────────────────────
function toggleSwitch(id) {
  id = Number(id);
  const comp = document.getElementById(`comp-${id}`);
  const cd = CircuitStore.components.find(c => c.id === id);
  if (!comp || !cd) return;
  const next = comp.dataset.state === '0' ? '1' : '0';
  comp.dataset.state = next; cd.state = next;

  const cdiv = document.getElementById(`content-${id}`);
  if (cdiv) ComponentDefs.updateContent(cd.type, id, cd, cdiv, comp);
  if (CircuitStore.isSimulationActive) SimulationEngine.run();
}


// ─── Clear & misc ──────────────────────────────────────────────────────────────
function clearCanvas() {
  if (!CircuitStore.components.length) return UIManager.showToast('Canvas sudah kosong');
  UIManager.showConfirmToast('Hapus semua komponen dan koneksi?', () => {
    HistoryManager.saveStateToUndoStack('Clear canvas');

    const canvas = document.getElementById('canvas');
    Array.from(canvas.children).forEach(child => {
      if (child.id !== 'wire-overlay' && child.id !== 'selection-box') child.remove();
    });

    const wireSvg = document.getElementById('wire-svg');
// 🟢 FIX: Langsung hapus semua tag <path> di dalam SVG
if (wireSvg) wireSvg.querySelectorAll('path').forEach(p => p.remove());

    CircuitStore.components = []; CircuitStore.connections = []; clearSelection(); CircuitStore.connectionStart = null;
    CircuitStore.componentIdCounter = 0;

    if (CircuitStore.isSimulationActive) SimulationEngine.stop();
    HistoryManager.autoSaveToLocalStorage();
  });
}

// ─── FITUR COPY PASTE & SHORTCUT KEYBOARD ──────────────────────────────────────

// 1. Pelacak Kursor Global (Untuk Paste tepat di ujung Mouse)
let globalMouseX = 1500;
let globalMouseY = 1500;
window.addEventListener('mousemove', e => {
  const canvas = document.getElementById('canvas');
  if (canvas) {
    const cr = canvas.getBoundingClientRect();
    globalMouseX = (e.clientX - cr.left) / UIManager.currentZoom;
    globalMouseY = (e.clientY - cr.top) / UIManager.currentZoom;
  }
});

// 2. Memori Clipboard Sirkuit
// 🟢 FIX: circuitClipboard sebelumnya cuma variabel JS biasa, otomatis hilang
// saat halaman di-reload karena tidak pernah disimpan ke localStorage. Sekarang
// setiap kali copy, langsung ditulis ke localStorage juga, dan saat paste, kalau
// variabel memori kosong (misal karena baru reload), diambil dulu dari localStorage.
let circuitClipboard = null;
const CLIPBOARD_STORAGE_KEY = 'labCircuitClipboard';

window.copySelection = function() {
  if (!CircuitStore.selectedComponents || CircuitStore.selectedComponents.length === 0) return;
  
  // Salin komponen yang dipilih (Simpan ke memori terpisah agar tidak berubah)
  // 🟢 FIX: Buang properti `element` (referensi DOM asli) sebelum di-clone.
  // Objek komponen di CircuitStore selalu membawa `element: div`, dan div punya
  // referensi melingkar (ownerDocument -> document -> defaultView -> window -> document),
  // sehingga JSON.stringify() akan throw "Converting circular structure to JSON"
  // jika `element` ikut disertakan. HistoryManager.snapshotState() sudah menghindari
  // ini dengan pemetaan manual; di sini kita pakai destructuring agar tetap ringkas.
  const compsToCopy = CircuitStore.components
    .filter(c => CircuitStore.selectedComponents.includes(c.id))
    .map(({ element, ...rest }) => rest);
  
  // Salin kabel HANYA jika ujung awal dan ujung akhirnya ada di dalam area komponen yang disalin
  const connsToCopy = CircuitStore.connections.filter(conn => 
    CircuitStore.selectedComponents.includes(conn.source.compId) && 
    CircuitStore.selectedComponents.includes(conn.target.compId)
  );
  
  circuitClipboard = {
    components: JSON.parse(JSON.stringify(compsToCopy)),
    connections: JSON.parse(JSON.stringify(connsToCopy))
  };

  // 🟢 FIX: Simpan juga ke localStorage agar tidak hilang saat reload halaman
  try { localStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(circuitClipboard)); } catch(e) {}
  
  UIManager.showToast(`📋 ${compsToCopy.length} Komponen Disalin`);
};

window.pasteClipboard = function() {
  // 🟢 FIX: Kalau memori sudah kosong (misal setelah reload), coba ambil dari localStorage dulu
  if (!circuitClipboard || !circuitClipboard.components.length) {
    try {
      const saved = localStorage.getItem(CLIPBOARD_STORAGE_KEY);
      if (saved) circuitClipboard = JSON.parse(saved);
    } catch(e) {}
  }
  if (!circuitClipboard || !circuitClipboard.components.length) return;
  
  HistoryManager.saveStateToUndoStack('Paste Komponen');
  clearSelection();

  const idMap = {}; // Peta memori untuk menyambungkan kabel lama ke ID baru
  const pastedIds = [];
  
  // Cari titik ujung paling kiri & atas dari cetakan copy
  let minX = Infinity, minY = Infinity;
  circuitClipboard.components.forEach(c => {
    if (c.x < minX) minX = c.x;
    if (c.y < minY) minY = c.y;
  });

  // Hitung selisih kursor saat ini untuk penempatan Paste
  const offsetX = globalMouseX - minX;
  const offsetY = globalMouseY - minY;

  // 1. Munculkan Komponen Baru
  circuitClipboard.components.forEach(oldComp => {
    const GRID_SIZE = 10;
    const newId = ++CircuitStore.componentIdCounter;
    idMap[oldComp.id] = newId; // Simpan pemetaan ID baru
    pastedIds.push(newId);

    // Geser komponen ke lokasi kursor dan tempel ke Grid (Gaya Magnet)
    let newX = Math.round((oldComp.x + offsetX) / GRID_SIZE) * GRID_SIZE;
    let newY = Math.round((oldComp.y + offsetY) / GRID_SIZE) * GRID_SIZE;

    const newCompData = { ...oldComp, id: newId, x: newX, y: newY, inputStates: new Array(oldComp.inputs).fill(0), outputState: 0, simV: 0, simI: 0 };
    const div = buildComponentElement(newCompData);
    document.getElementById('canvas').appendChild(div);
    CircuitStore.addComponent({ ...newCompData, element: div });
    
    div.classList.add('selected'); // Langsung seleksi komponen baru
  });

  CircuitStore.selectedComponents = pastedIds;

  // 2. Pasang Kembali Kabel Internalnya
  circuitClipboard.connections.forEach(oldConn => {
    const newSrcId = idMap[oldConn.source.compId];
    const newTgtId = idMap[oldConn.target.compId];
    
    if (newSrcId && newTgtId) {
      // Pindahkan juga titik belok kabel manual (jika ada) ke posisi kursor
      let newWaypoints = [];
      if (oldConn.waypoints && oldConn.waypoints.length > 0) {
        newWaypoints = oldConn.waypoints.map(wp => ({ x: wp.x + offsetX, y: wp.y + offsetY }));
      }
      // 🟢 FIX: Pastikan memori arah pin (tipe kabel) ikut diwariskan ke kloningan baru!
      CircuitStore.addConnection({
        source: { compId: newSrcId, pinIndex: oldConn.source.pinIndex, type: oldConn.source.type || 'output' },
        target: { compId: newTgtId, pinIndex: oldConn.target.pinIndex, type: oldConn.target.type || 'input' },
        waypoints: newWaypoints
      });
    }
  });

  drawConnections(); updateConnectionPointVisuals();
  if (CircuitStore.isSimulationActive) SimulationEngine.run();
  UIManager.showToast(`📌 ${circuitClipboard.components.length} Komponen Ditempel`);
};

// 3. Sensor Keyboard Utama
document.addEventListener('keydown', e => {
  const activeTag = document.activeElement.tagName;
  // Jangan aktifkan shortcut jika user sedang mengetik nilai di form input
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;

  // Shortcut COPY & PASTE
  if (e.ctrlKey && e.key === 'c') { e.preventDefault(); window.copySelection(); }
  if (e.ctrlKey && e.key === 'v') { e.preventDefault(); window.pasteClipboard(); }
  
  // Shortcut Undo & Redo
  if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); HistoryManager.undo(); }
  if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) { e.preventDefault(); HistoryManager.redo(); }
  
  // Shortcut Hapus (Delete)
  if (e.key === 'Delete') {
    if (CircuitStore.selectedComponents.length > 0) deleteSelectedComponents();
  }
  
  // Shortcut Batal (Escape)
  if (e.key === 'Escape') {
    CircuitStore.connectionStart = null;
    document.querySelectorAll('.connection-point').forEach(p => p.classList.remove('pending'));
    UIManager.closeValueModal();
    const ct = document.querySelector('.confirm-toast'); if (ct) ct.remove();
    let tw = document.getElementById('temp-wire'); if(tw) tw.remove();
  }
});


// ─── INIT ──────────────────────────────────────────────────────────────────────
function init() {
  UIManager.initTheme(); 

  const wrapper = document.getElementById('canvas-wrapper');
  wrapper.scrollLeft = 1500 - (wrapper.clientWidth / 2);
  wrapper.scrollTop = 1500 - (wrapper.clientHeight / 2);

  const canvas = document.getElementById('canvas');
  canvas.addEventListener('mousedown', handleCanvasMouseDown);
  canvas.addEventListener('dragover', handleDragOver);
  canvas.addEventListener('drop', handleDrop);

  const overlay = document.getElementById('wire-overlay');
  overlay.style.pointerEvents = 'none';
  document.getElementById('wire-svg').setAttribute('viewBox', '0 0 3000 3000');
  document.getElementById('wire-svg').setAttribute('width', '3000');
  document.getElementById('wire-svg').setAttribute('height', '3000');

  const loaded = HistoryManager.loadAutoSave();
  if (!loaded) {
    setTimeout(() => {
      if (CircuitStore.components.length > 0) return;

      const cx = 1500 - 200; const cy = 1500 - 100;

      createComponent('switch', cx + 50, cy + 100, 0, 1);
      createComponent('switch', cx + 50, cy + 200, 0, 1);
      createComponent('and', cx + 200, cy + 150, 2, 1);
      createComponent('led', cx + 350, cy + 160, 1, 1);

      requestAnimationFrame(() => {
        createConnection(1, 0, 3, 0);
        createConnection(2, 0, 3, 1);
        createConnection(3, 0, 4, 0);
        drawConnections(); updateConnectionPointVisuals();
        CircuitStore.undoStack = []; CircuitStore.redoStack = []; HistoryManager.updateUndoRedoButtons();
        HistoryManager.saveStateToUndoStack('Initial state');
      });
    }, 300);
  }

  // 🟢 FIX UTAMA: Kunci Posisi Kanvas saat Layar/Sidebar Berubah Ukuran
  let lastWrapperWidth = wrapper.clientWidth;
  let lastWrapperHeight = wrapper.clientHeight;

  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      const newWidth = entry.contentRect.width;
      const newHeight = entry.contentRect.height;
      
      // Hitung selisih ukuran layar
      const dx = (lastWrapperWidth - newWidth) / 2;
      const dy = (lastWrapperHeight - newHeight) / 2;
      
      // Geser scroll secara instan agar titik tengah pandangan tidak kabur
      wrapper.scrollLeft += dx;
      wrapper.scrollTop += dy;
      
      // Simpan ukuran baru ke memori
      lastWrapperWidth = newWidth;
      lastWrapperHeight = newHeight;
    }
  });
  
  // Mulai pantau perubahan ukuran pada wadah kanvas
  resizeObserver.observe(wrapper);
}

// ─── FITUR SMART NAVIGATION (ZOOM & PAN KANVAS TANPA SCROLLBAR) ──────────────────

let initialPinchDistance = null;
let initialZoomState = 1;
let initialPinchMidX = 0, initialPinchMidY = 0;
let initialCanvasX = 0, initialCanvasY = 0;
let lastTapTime = 0;
let wasMultiTouch = false;

// Variabel untuk fitur Geser Kanvas (Pan)
let isPanning = false;
let startPanX = 0, startPanY = 0;
let wrapperStartX = 0, wrapperStartY = 0;

function initSmartCanvasNavigation() {
  const canvasWrapper = document.getElementById('canvas-wrapper');
  if (!canvasWrapper) return;

  // ==========================================
  // A. KENDALI LAYAR SENTUH (HP / Tablet)
  // ==========================================
  canvasWrapper.addEventListener('touchstart', (e) => {
    // 1. Logika Geser Kanvas (Pan) dengan 1 Jari di area kosong
    if (e.touches.length === 1) {
      const targetId = e.target.id;
      // Hanya aktif jika jari menyentuh kanvas kosong (bukan komponen)
      if (targetId === 'canvas' || targetId === 'wire-overlay' || targetId === 'wire-svg') {
        isPanning = true;
        startPanX = e.touches[0].clientX;
        startPanY = e.touches[0].clientY;
        wrapperStartX = canvasWrapper.scrollLeft;
        wrapperStartY = canvasWrapper.scrollTop;
      }
    }
    // 2. Logika Cubit untuk Zoom (Pinch-to-Zoom) dengan 2 Jari
    else if (e.touches.length > 1) {
      isPanning = false; 
      wasMultiTouch = true;
      if (e.touches.length === 2) {
        initialPinchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialZoomState = UIManager.currentZoom;
        
        // 🟢 FIX JITTER: Kunci titik koordinat awal di milidetik pertama Anda menyentuh
        initialPinchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        initialPinchMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        
        const rect = canvasWrapper.getBoundingClientRect();
        initialCanvasX = (canvasWrapper.scrollLeft + initialPinchMidX - rect.left) / initialZoomState;
        initialCanvasY = (canvasWrapper.scrollTop + initialPinchMidY - rect.top) / initialZoomState;
      }
    }
  }, { passive: true }); // 🟢 FIX LIGTHOUSE: Diubah menjadi 'true' karena tidak ada preventDefault di sini!

canvasWrapper.addEventListener('touchmove', (e) => {
    // 1. Eksekusi Geser Kanvas (Pan) dengan 1 jari
    if (isPanning && e.touches.length === 1) {
      e.preventDefault();
      const dx = e.touches[0].clientX - startPanX;
      const dy = e.touches[0].clientY - startPanY;
      canvasWrapper.scrollLeft = wrapperStartX - dx;
      canvasWrapper.scrollTop = wrapperStartY - dy;
    }
    // 2. Eksekusi Zoom dengan 2 jari
    else if (e.touches.length === 2 && initialPinchDistance) {
      e.preventDefault(); 
      
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );

      const scale = currentDistance / initialPinchDistance;
      const zoomSpeed = 0.5; 
      let newZoom = initialZoomState + ((scale - 1) * initialZoomState * zoomSpeed);
      
      // Batasi zoom maksimal dan minimal
      newZoom = Math.max(0.5, Math.min(newZoom, 2.0));

      const currentMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const currentMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

      // 🟢 FIX JITTER: Jangan gunakan UIManager.setZoom berulang-ulang agar tidak tabrakan
      UIManager.currentZoom = newZoom;
      const canvas = document.getElementById('canvas');
      const rect = canvasWrapper.getBoundingClientRect();

      canvas.style.transform = `scale(${newZoom})`;
      canvas.style.transformOrigin = '0 0';

      // Pastikan ruang scroll ikut membesar di HP
      let spacer = document.getElementById('canvas-spacer');
      if (!spacer) {
          spacer = document.createElement('div');
          spacer.id = 'canvas-spacer';
          spacer.style.position = 'absolute';
          spacer.style.top = '0'; spacer.style.left = '0';
          spacer.style.pointerEvents = 'none'; spacer.style.visibility = 'hidden';
          canvasWrapper.appendChild(spacer);
      }
      spacer.style.width = (3000 * newZoom) + 'px';
      spacer.style.height = (3000 * newZoom) + 'px';

      // Sinkronkan UI
      const zoomLabel = document.getElementById('zoomLabel');
      if (zoomLabel) zoomLabel.innerText = Math.round(newZoom * 100) + '%';
      const zoomSlider = document.getElementById('zoomSlider');
      if (zoomSlider) zoomSlider.value = newZoom;

      // Geser layar dengan stabil berdasarkan kunci koordinat yang ditangkap di touchstart
      canvasWrapper.scrollLeft = (initialCanvasX * newZoom) - (currentMidX - rect.left);
      canvasWrapper.scrollTop  = (initialCanvasY * newZoom) - (currentMidY - rect.top);
    }
  }, { passive: false });

canvasWrapper.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      initialPinchDistance = null;
    }

    if (e.touches.length === 0) {
      // 🟢 FIX UTAMA: Matikan status menggeser saat jari diangkat dari layar
      isPanning = false; 

      if (wasMultiTouch) {
        wasMultiTouch = false;
        return;
      }
    }
  });

  // 🟢 FIX TAMBAHAN: Jaga-jaga jika sistem HP membatalkan sentuhan secara paksa
  canvasWrapper.addEventListener('touchcancel', (e) => {
    isPanning = false;
    initialPinchDistance = null;
    wasMultiTouch = false;
  });

  // ==========================================
  // B. KENDALI MOUSE (Laptop / Desktop)
  // ==========================================
  
// B. MOUSE WHEEL ZOOM (Laptop/Desktop)
  canvasWrapper.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      // --- PERBAIKAN: Ubah 0.05 menjadi 0.02 agar scroll mouse lebih lambat & halus ---
      const delta = e.deltaY < 0 ? 0.02 : -0.02; 
      let newZoom = UIManager.currentZoom + delta;
      
      UIManager.setZoom(newZoom, e.clientX, e.clientY);
    }
  }, { passive: false });

  // 2. Klik Kanan atau Klik Tengah ditahan untuk Geser Kanvas (Pan)
  canvasWrapper.addEventListener('mousedown', (e) => {
    // e.button === 1 (Klik Tengah Wheel), e.button === 2 (Klik Kanan)
    if ((e.button === 1 || e.button === 2) && 
        (e.target.id === 'canvas' || e.target.id === 'wire-overlay' || e.target.id === 'wire-svg')) {
      e.preventDefault();
      isPanning = true;
      startPanX = e.clientX;
      startPanY = e.clientY;
      wrapperStartX = canvasWrapper.scrollLeft;
      wrapperStartY = canvasWrapper.scrollTop;
      canvasWrapper.style.cursor = 'grabbing'; // Ubah kursor jadi ikon tangan menggenggam
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isPanning) {
      e.preventDefault();
      const dx = e.clientX - startPanX;
      const dy = e.clientY - startPanY;
      canvasWrapper.scrollLeft = wrapperStartX - dx;
      canvasWrapper.scrollTop = wrapperStartY - dy;
    }
  });

  window.addEventListener('mouseup', () => {
    if (isPanning) {
      isPanning = false;
      canvasWrapper.style.cursor = 'crosshair'; // Kembalikan ke kursor default
    }
  });

  // 🟢 FIX: Listener contextmenu dipindahkan seluruhnya ke initContextMenu() —
  // sebelumnya ada 2 listener contextmenu terpisah di elemen yang sama dan saling
  // tumpang tindih (yang di initContextMenu selalu preventDefault() lebih dulu,
  // jadi blok ini tidak pernah berpengaruh / jadi dead code).
}

// --- FUNGSI GLOBAL ROTASI KOMPONEN ---
window.rotateComponent = (id) => {
  const compData = CircuitStore.components.find(c => c.id === id);
  const compEl = document.getElementById(`comp-${id}`);
  if (!compData || !compEl) return;

  // Putar berputar 90 derajat searah jarum jam (0 -> 90 -> 180 -> 270 -> 0)
  compData.rotation = (compData.rotation + 90) % 360;
  compEl.style.transform = `rotate(${compData.rotation}deg)`;

  // SANGAT PENTING: Gambar ulang semua kabel karena posisi koordinat pin ikut berputar
  drawConnections();

  // Simpan aksi ke dalam sistem Undo/Redo
  HistoryManager.saveStateToUndoStack(`Memutar komponen ${compData.type}`);

  if (CircuitStore.isSimulationActive) SimulationEngine.run();
};

// ─── FITUR CONTEXT MENU (KLIK KANAN) ──────────────────────────────────────────
function initContextMenu() {
  // 1. Buat elemen HTML menu pop-up yang elegan
  const menu = document.createElement('div');
  menu.id = 'custom-context-menu';
  Object.assign(menu.style, {
    position: 'fixed', display: 'none', backgroundColor: '#1e293b', color: '#f8fafc',
    border: '1px solid #475569', borderRadius: '6px', padding: '5px 0',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', zIndex: '10000',
    minWidth: '160px', fontFamily: 'sans-serif', fontSize: '14px',
    userSelect: 'none'
  });

  // Fungsi pembuat tombol menu
  const createMenuItem = (text, icon, onClick) => {
    const item = document.createElement('div');
    item.innerHTML = `<span style="margin-right:8px;">${icon}</span> ${text}`;
    Object.assign(item.style, { padding: '10px 15px', cursor: 'pointer', transition: 'background 0.2s' });
    item.onmouseover = () => item.style.backgroundColor = '#334155';
    item.onmouseout = () => item.style.backgroundColor = 'transparent';
    item.onclick = (e) => { 
        e.stopPropagation(); 
        onClick(); 
        menu.style.display = 'none'; 
    };
    return item;
  };

  // Tambahkan isi menu: Copy, Paste, dan Delete
  menu.appendChild(createMenuItem('Salin (Copy)', '📋', () => window.copySelection()));
  menu.appendChild(createMenuItem('Tempel (Paste)', '📌', () => window.pasteClipboard()));
  
  const delBtn = createMenuItem('Hapus (Delete)', '🗑️', () => {
    if (CircuitStore.selectedComponents.length > 0) deleteSelectedComponents();
  });
  delBtn.style.color = '#f87171'; // Beri warna merah untuk tombol hapus
  menu.appendChild(delBtn);
  
  document.body.appendChild(menu);

  // 2. Tangkap event Klik Kanan di Kanvas
  const canvasWrapper = document.getElementById('canvas-wrapper');
  // 🟢 FIX: Null-check agar tidak throw error kalau elemen #canvas-wrapper
  // belum/tidak ada di DOM (konsisten dengan guard yang sama di initSmartCanvasNavigation).
  if (!canvasWrapper) return;
  let rightClickStartX = 0, rightClickStartY = 0;

  // Catat posisi saat tombol kanan mouse mulai ditekan
  canvasWrapper.addEventListener('mousedown', (e) => {
    if (e.button === 2) { 
      rightClickStartX = e.clientX;
      rightClickStartY = e.clientY;
    }
  });

  // Tampilkan menu saat tombol mouse dilepas (jika tidak bergeser)
  canvasWrapper.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Blokir menu klik kanan bawaan browser (inspect element, dll)
    
    // Hitung jarak geser. Jika > 5 pixel, berarti sedang Panning. Jangan munculkan menu.
    const dist = Math.hypot(e.clientX - rightClickStartX, e.clientY - rightClickStartY);
    if (dist > 5) {
      menu.style.display = 'none'; 
      return;
    }

    // Jika aman, Tampilkan Menu tepat di ujung kursor
    menu.style.display = 'block';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    
    // Keamanan: Cegah menu keluar dari batas layar kanan/bawah
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) menu.style.left = (window.innerWidth - rect.width) + 'px';
    if (rect.bottom > window.innerHeight) menu.style.top = (window.innerHeight - rect.height) + 'px';
  });

  // 3. Sembunyikan menu pop-up jika pengguna klik kiri di sembarang tempat
  window.addEventListener('click', (e) => {
    if (e.button !== 2) menu.style.display = 'none';
  });
}

// ─── INISIALISASI UTAMA APLIKASI (WAJIB ADA) ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (typeof init === 'function') init();
  
  if (typeof initSmartCanvasNavigation === 'function') initSmartCanvasNavigation();

  // Panggil fungsi Menu Klik Kanan yang baru kita buat
  initContextMenu(); 

  // 🟢 LOGIKA BARU: Menghidupkan Laci Mobile (Bottom Sheet)
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const sidebar = document.getElementById('sidebar');

  // Fungsi untuk buka/tutup laci
  const toggleMobileMenu = () => {
    if (sidebar) sidebar.classList.toggle('open');
    if (sidebarOverlay) sidebarOverlay.classList.toggle('open');
  };

  // Pasang sensor klik pada ketiga elemen pemicu
  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMobileMenu);
  if (closeMenuBtn) closeMenuBtn.addEventListener('click', toggleMobileMenu);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleMobileMenu);
});
// ─── FITUR HAPUS SEMUA KABEL (SCISSORS) ────────────────────────────────────────
function clearAllWires() {
  // Cek apakah ada kabel
  if (!CircuitStore.connections || CircuitStore.connections.length === 0) {
    UIManager.showToast('Tidak ada kabel untuk dihapus');
    return;
  }

  // Minta konfirmasi pengguna agar tidak tertekan tanpa sengaja
  // 🟢 FIX: Pakai UIManager.showConfirmToast() (bukan confirm() bawaan browser) supaya
  // konsisten dengan gaya konfirmasi lain di aplikasi ini (tema dark/light, non-blocking).
  UIManager.showConfirmToast('Apakah Anda yakin ingin memotong SEMUA kabel? (Komponen akan tetap aman di posisinya)', () => {

    // 1. Simpan memori agar bisa di-Undo (Ctrl+Z)
    if (typeof HistoryManager !== 'undefined') {
        HistoryManager.saveStateToUndoStack('Hapus semua kabel');
    }

    // 2. Kosongkan database kabel
    CircuitStore.connections = [];

    // 3. Bersihkan garis visual di SVG
    const wireSvg = document.getElementById('wire-svg');
    if (wireSvg) wireSvg.innerHTML = '';

    // 4. Reset warna semua titik pin kembali menjadi merah (belum tersambung)
    document.querySelectorAll('.connection-point').forEach(pin => {
      pin.classList.remove('connected');
    });

    // 5. Munculkan notifikasi ke layar
    UIManager.showToast('✂️ Semua kabel berhasil dipotong');
  });
}

// ─── LIVE TICKER (OSILOSKOP & CLOCK GENERATOR) ─────────────────────────────
// ─── LIVE TICKER DENGAN TIME CATCH-UP & BATCH OPTIMIZATION ─────────────
setInterval(() => {
  if (typeof CircuitStore === 'undefined' || !CircuitStore.isSimulationActive) return;
  
  let needsRun = false;
  let needsAnalogUpdate = false;
  const nowTs = Date.now();
  const MAX_CATCHUP_STEPS = 50; // Safety limit
  
  CircuitStore.components.forEach(c => {
    // Clock Pulse dengan Time Catch-up
    if (c.type === 'clock_pulse') {
      const freq = Math.min(c.freqValue || 2, 1000); // Batasi maks 1 KHz
      const halfPeriodMs = 1000 / freq / 2;
      
      if (!c._lastToggle) c._lastToggle = nowTs;
      
      let steps = 0;
      
      // Time catch-up loop
      while (nowTs - c._lastToggle >= halfPeriodMs && steps < MAX_CATCHUP_STEPS) {
        c.state = c.state === '1' ? '0' : '1';
        c._lastToggle += halfPeriodMs; // Anti-drift
        
        // Digital logic (ringan)
        if (typeof SimulationEngine !== 'undefined') {
          SimulationEngine.solveDigitalLogic();
        }
        
        steps++;
      }
      
      if (steps > 0) {
        needsAnalogUpdate = true; // Tandai untuk update analog nanti
        needsRun = true;
      }
      
      // Debug info
      if (steps > 10) {
        console.debug(`Clock catch-up: ${steps} steps, freq: ${freq}Hz`);
      }
    }
    
    // Flasher (simple toggle)
    if (c.type === 'flasher') {
      const period = c.customValue || 500;
      if (nowTs - (c._lastToggle || 0) >= period) {
        c.state = c.state === '1' ? '0' : '1';
        c._lastToggle = nowTs;
        needsRun = true;
      }
    }
  });
  
  // Batch analog physics update (hanya sekali!)
  if (needsAnalogUpdate && typeof SimulationEngine !== 'undefined') {
    SimulationEngine.solveAnalogPhysics();
  }
  
  // Oscilloscope refresh (throttled)
  if (needsRun) { // Hanya refresh jika ada perubahan
    const oscils = CircuitStore.components.filter(c => c.type === 'oscilloscope');
    if (oscils.length > 0) {
      requestAnimationFrame(() => {
        oscils.forEach(c => {
          const cd = document.getElementById(`content-${c.id}`);
          if (cd && typeof ComponentDefs !== 'undefined') {
            ComponentDefs.updateDOMState(c.type, c, cd, c.id);
          }
        });
      });
    }
  }
  
}, 16);

// =========================================================
// FITUR PENCARIAN & FILTER KATEGORI KOMPONEN
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('componentSearch');
    const clearBtn = document.getElementById('clearSearchBtn');
    const filterBtn = document.getElementById('filterToggleBtn');
    const filterDropdown = document.getElementById('filterDropdown');
    const filterActiveDot = document.getElementById('filterActiveDot');
    const radioFilters = document.querySelectorAll('input[name="catFilter"]');
    const sidebarSections = document.querySelectorAll('.sidebar-section');

    if (searchInput && clearBtn && filterBtn) {
        
        // 1. Tampilkan / Sembunyikan Menu Dropdown Filter
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Mencegah klik menutup dropdown secara prematur
            const isHidden = filterDropdown.style.display === 'none';
            filterDropdown.style.display = isHidden ? 'block' : 'none';
            filterBtn.style.color = isHidden ? 'var(--primary, #3b82f6)' : 'var(--text-muted, #94a3b8)';
        });

        // 2. Tutup Dropdown jika pengguna mengklik area bebas di layar
        document.addEventListener('click', (e) => {
            if (!filterDropdown.contains(e.target) && e.target !== filterBtn) {
                filterDropdown.style.display = 'none';
                if(filterActiveDot.style.display === 'none') {
                    filterBtn.style.color = 'var(--text-muted, #94a3b8)';
                }
            }
        });

        // 3. Fungsi Utama Pencarian & Filter
        const applyFilters = () => {
            const term = searchInput.value.toLowerCase();
            const activeCategory = document.querySelector('input[name="catFilter"]:checked').value;
            
            // Atur visibilitas ikon X dan Titik Biru Filter
            clearBtn.style.display = term.length > 0 ? 'block' : 'none';
            filterActiveDot.style.display = activeCategory !== 'all' ? 'block' : 'none';

            sidebarSections.forEach(section => {
                const sectionTitle = section.querySelector('h4').textContent.toLowerCase();
                let sectionMatchesCategory = false;

                // Logika Pemetaan Kategori Cerdas (Membaca judul dari index.html)
                if (activeCategory === 'all') {
                    sectionMatchesCategory = true;
                } else if (activeCategory === 'digital' && (sectionTitle.includes('digital') || sectionTitle.includes('gerbang') || sectionTitle.includes('sekuensial'))) {
                    sectionMatchesCategory = true;
                } else if (activeCategory === 'analog' && (sectionTitle.includes('daya') || sectionTitle.includes('sensor') || sectionTitle.includes('aktuator') || sectionTitle.includes('kabel') || sectionTitle.includes('semikonduktor'))) {
                    sectionMatchesCategory = true;
                } else if (activeCategory === 'alat' && sectionTitle.includes('alat')) {
                    sectionMatchesCategory = true;
                }

                let hasVisibleCard = false;
                const cards = section.querySelectorAll('.component-card');
                
                cards.forEach(card => {
                    const name = card.querySelector('.comp-name').textContent.toLowerCase();
                    const desc = card.querySelector('.comp-desc').textContent.toLowerCase();
                    
                    // Tampilkan komponen JIKA masuk ke Kategori terpilih DAN namanya cocok dengan teks
                    if (sectionMatchesCategory && (name.includes(term) || desc.includes(term))) {
                        card.style.display = 'flex';
                        hasVisibleCard = true;
                    } else {
                        card.style.display = 'none';
                    }
                });

                // Sembunyikan judul kategori jika kosong
                section.style.display = hasVisibleCard ? 'block' : 'none';
            });
        };

        // 4. Pasang Sensor Interaksi
        searchInput.addEventListener('input', applyFilters); // Saat mengetik
        
        clearBtn.addEventListener('click', () => { // Saat tombol X ditekan
            searchInput.value = '';
            applyFilters();
            searchInput.focus(); // Kembalikan kursor ke dalam kotak teks
        });

        radioFilters.forEach(radio => { // Saat salah satu opsi filter diklik
            radio.addEventListener('change', () => {
                applyFilters();
                filterDropdown.style.display = 'none'; // Otomatis tutup popup
            });
        });
    }
});
