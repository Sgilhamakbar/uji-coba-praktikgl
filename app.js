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

// 🟢 FIX: window.adjustFlasherSpeed sebelumnya dipanggil dari ComponentDefs.js
// (tombol ▲/▼ kecepatan pada komponen Flasher) tapi belum pernah didefinisikan,
// sehingga klik tombol tersebut melempar "adjustFlasherSpeed is not a function".
window.adjustFlasherSpeed = (id, delta) => {
  const comp = CircuitStore.components.find(c => c.id === id);
  if (!comp) return;
  let val = comp.customValue || 500;
  val += delta; // delta dalam ms; -100 = lebih cepat, +100 = lebih lambat
  if (val > 5000) val = 5000; // batas bawah kecepatan: 0.1Hz
  if (val < 100) val = 100;   // batas atas kecepatan: 5Hz
  comp.customValue = val;

  const cd = document.getElementById(`content-${id}`);
  if (cd) ComponentDefs.updateDOMState(comp.type, comp, cd, id);

  clearTimeout(sensorSaveTimeout);
  sensorSaveTimeout = setTimeout(() => {
    HistoryManager.saveStateToUndoStack(`Mengatur kecepatan Flasher`);
  }, 500);
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
    // 1. SENSOR DESKTOP (Mouse Double Click)
    canvasArea.addEventListener('dblclick', function(e) {
        // Cari elemen terdekat yang ID-nya berawalan "comp-" (Bisa kena teks, garis, atau background SVG)
        const comp = e.target.closest('[id^="comp-"]');
        if (e.target.closest('.btn-up, .btn-down, [class*="btn-"]')) return;
        if (comp) {
            const compId = comp.id.split('-')[1]; // Ambil angka ID-nya saja
            const compType = comp.dataset.type;
            const subType = comp.dataset.subType || ''; 
            
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
        
        // Jika jarak waktu antara sentuhan pertama dan kedua kurang dari 300 milidetik (0.3 detik)
        if (tapLength < 300 && tapLength > 0) {
            const comp = e.target.closest('[id^="comp-"]');
            
            if (comp) {
                const compId = comp.id.split('-')[1];
                const compType = comp.dataset.type;
                const subType = comp.dataset.subType || ''; 
                
                UIManager.openValueModal(compId, compType, subType);
                
                // Cegah browser melakukan Zoom-In bawaan HP saat pengguna mengetuk ganda komponen
                e.preventDefault(); 
            }
        }
        
        // Simpan waktu sentuhan terakhir
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
    
    if (targetComp && ['ground', 'power_terminal', 'junction'].includes(targetComp.type)) {
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
    const dx = (e.touches[0].clientX - startX) / UIManager.currentZoom;
    const dy = (e.touches[0].clientY - startY) / UIManager.currentZoom;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
    
    if (moved) {
      e.preventDefault();
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
let draggedCard = null, touchClone = null, touchStartX = 0, touchStartY = 0;

document.querySelectorAll('.component-card').forEach(card => {
  card.addEventListener('click', (e) => {
    if (card.classList.contains('dragging')) return;
    const canvas = document.getElementById('canvas');
    const wrapper = document.getElementById('canvas-wrapper');
    const cr = canvas.getBoundingClientRect();
    const wr = wrapper.getBoundingClientRect();
    const centerX = wr.left + (wr.width / 2);
    const centerY = wr.top + (wr.height / 2);
    const x = (centerX - cr.left) / UIManager.currentZoom;
    const y = (centerY - cr.top) / UIManager.currentZoom;
    createComponent(card.dataset.type, x, y, +card.dataset.inputs, +card.dataset.outputs);
    UIManager.showToast('✅ Komponen ditambahkan');
  });

  card.addEventListener('dragstart', e => {
    draggedCard = card;
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: card.dataset.type, inputs: +card.dataset.inputs, outputs: +card.dataset.outputs }));
    card.classList.add('dragging');
  });
  card.addEventListener('dragend', () => { card.classList.remove('dragging'); draggedCard = null; });

  card.addEventListener('touchstart', e => {
    draggedCard = card; touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
    card.classList.add('dragging');
  }, { passive: true });

  card.addEventListener('touchmove', e => {
    if (draggedCard !== card || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchStartX, dy = e.touches[0].clientY - touchStartY;
    if (!touchClone && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      e.preventDefault();
      touchClone = card.cloneNode(true);
      Object.assign(touchClone.style, { position:'fixed', zIndex:'9999', opacity:'0.7', pointerEvents:'none', width: card.offsetWidth+'px' });
      document.body.appendChild(touchClone);
    }
    if (touchClone) {
      e.preventDefault();
      touchClone.style.left = (e.touches[0].clientX - 50) + 'px';
      touchClone.style.top  = (e.touches[0].clientY - 30) + 'px';
    }
  }, { passive: false });

  card.addEventListener('touchend', e => {
    card.classList.remove('dragging');
    if (touchClone && draggedCard === card) {
      const t = e.changedTouches[0];
      const wrapper = document.getElementById('canvas-wrapper');
      const wr = wrapper.getBoundingClientRect();
      const canvas = document.getElementById('canvas');
      const cr = canvas.getBoundingClientRect();

      if (t.clientX >= wr.left && t.clientX <= wr.right && t.clientY >= wr.top && t.clientY <= wr.bottom) {
        const x = (t.clientX - cr.left) / UIManager.currentZoom;
        const y = (t.clientY - cr.top) / UIManager.currentZoom;
        createComponent(card.dataset.type, x, y, +card.dataset.inputs, +card.dataset.outputs);
        UIManager.showToast('✅ Komponen ditambahkan');
      }
      touchClone.remove(); touchClone = null;
    }
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
}

// ─── FITUR SMART NAVIGATION (ZOOM & PAN KANVAS TANPA SCROLLBAR) ──────────────────

let initialPinchDistance = null;
let initialZoomState = 1;
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
      isPanning = false; // Batalkan pan jika jari > 1
      wasMultiTouch = true;
      if (e.touches.length === 2) {
        initialPinchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialZoomState = UIManager.currentZoom;
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
      e.preventDefault(); // Cegah pergeseran halaman bawaan browser
      
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );

      const scale = currentDistance / initialPinchDistance;
      
      // Kecepatan zoom layar sentuh yang sudah Anda perlambat
      const zoomSpeed = 0.5; 
      let newZoom = initialZoomState + ((scale - 1) * initialZoomState * zoomSpeed);

      // Ambil titik tengah di antara posisi kedua jari sebagai pusat target zoom
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

      UIManager.setZoom(newZoom, midX, midY);
    }
  }, { passive: false });

canvasWrapper.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      initialPinchDistance = null;
    }

    if (e.touches.length === 0) {
      if (wasMultiTouch) {
        wasMultiTouch = false;
        return;
      }
    }
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

  // 🟢 Panggil fungsi Menu Klik Kanan yang baru kita buat
  initContextMenu(); 
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
let tickCounter = 0;
setInterval(() => {
  if (typeof CircuitStore !== 'undefined' && CircuitStore.isSimulationActive) {
    tickCounter++;
    let clockToggled = false;
    
    // Clock Generator akan membalik logika (1 ke 0 / 0 ke 1) setiap 250ms (2 Hz)
    if (tickCounter % 5 === 0) {
        CircuitStore.components.forEach(c => {
          if (c.type === 'clock_pulse') {
            c.state = c.state === '1' ? '0' : '1';
            clockToggled = true;
          }
        });
        // Paksa mesin fisika menghitung ulang jika ada detak baru!
        if (clockToggled) SimulationEngine.run();
    }
    // Flasher: toggle otomatis sesuai customValue masing-masing (periode dalam ms)
let flasherToggled = false;
const nowTs = Date.now();
CircuitStore.components.forEach(c => {
  if (c.type === 'flasher') {
    const period = c.customValue || 500;
    if (nowTs - (c._lastToggle || 0) >= period) {
      c.state = c.state === '1' ? '0' : '1';
      c._lastToggle = nowTs;
      flasherToggled = true;
    }
  }
});
if (flasherToggled) SimulationEngine.run();
    // Refresh Osiloskop secara halus setiap 50ms
    const oscils = CircuitStore.components.filter(c => c.type === 'oscilloscope');
    if (oscils.length > 0) {
        oscils.forEach(c => {
            const cd = document.getElementById(`content-${c.id}`);
            if (cd) ComponentDefs.updateDOMState(c.type, c, cd, c.id);
        });
    }
    // V-Sine: selama ada generator AC di kanvas, simulasi harus re-run terus supaya gelombang "berjalan"
    const hasSine = CircuitStore.components.some(c => c.type === 'vsine');
    if (hasSine) SimulationEngine.run();
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

// File: src/components/ComponentDefs.js

const ComponentDefs = {
  getDimensions(type) {
    const map = {
      led: [60, 60], diode: [60, 40], logic_probe: [60, 40], switch: [60, 40], push_button: [60, 40], switch_spst: [80, 40],
      fuse: [80, 40], ground: [40, 40], relay: [80, 80], relay_5pin: [80, 100], diode_bridge: [140, 140], 
      junction: [60, 60], wire_1to1: [60, 40], wire_1to2: [60, 60],
      and: [80, 60], or: [80, 60], not: [80, 60], nand: [80, 60], nor: [80, 60], xor: [80, 60], xnor: [80, 60],
      bjt_npn: [80, 80], bjt_pnp: [80, 80],     
      transformer: [100, 100], ff_sr: [80, 90], ff_d: [80, 80], ff_jk: [80, 90], ff_t: [80, 80],
      mosfet_n: [100, 100], mosfet_p: [100, 100], 
      voltmeter: [80, 80], ammeter: [80, 80],   
      opamp: [80, 60], opamp_5pin: [80, 60], resistor: [80, 50], clock_pulse: [60, 40], flasher: [80, 40], voltage_divider: [80, 70],
      capacitor: [80, 50], ic_555: [120, 160], power_terminal: [60, 40], output_terminal: [75, 40],
      battery: [80, 60], battery_1cell: [80, 60], battery_multi: [80, 60], vsine: [160, 110],
      // UBAH BARIS DI BAWAH INI (Tingginya menjadi 60 semua agar muat panah vertikal):
      ldr: [80, 60], thermistor_ntc: [80, 60], thermistor_ptc: [80, 60], potentiometer: [80, 60],
      motor_dc: [80, 80], servo: [80, 80], solenoid: [80, 60], oscilloscope: [410, 280],
    };
    return map[type] || [80, 60];
  },

  updateContent(type, id, compData, contentDiv, div) {
    if (!contentDiv.dataset.initDone) {
      this.initSVGTemplate(type, id, compData, contentDiv);
      contentDiv.dataset.initDone = "true";
      
      // --- PENERAPAN EVENT DELEGATION (AMAN & BERSIH) ---
      contentDiv.addEventListener('click', (e) => {
        // Deteksi klik buka modal nilai (untuk Teks Resistor, Sekering, Baterai, dsb)
        if (e.target.closest('.val-trigger')) {
            e.stopPropagation();
            const triggerEl = e.target.closest('.val-trigger');
            window.openValueModal(id, type, triggerEl.dataset.sub); // 🟢 Kirimkan data-sub (r1 / r2)
        }
        // Deteksi tombol naik (Slider Sensor NTC/PTC/LDR/Potensio)
        if (e.target.closest('.btn-up')) {
            e.stopPropagation();
            window.adjustSensorValue(id, 5);
        }
        // Deteksi tombol turun (Slider Sensor NTC/PTC/LDR/Potensio)
        if (e.target.closest('.btn-down')) {
            e.stopPropagation();
            window.adjustSensorValue(id, -5);
        }
        if (e.target.closest('.speed-btn-up')) {
            e.stopPropagation();
            window.adjustFlasherSpeed(id, -100); // dikurangi periode = makin cepat
        }
        if (e.target.closest('.speed-btn-down')) {
            e.stopPropagation();
            window.adjustFlasherSpeed(id, 100); // ditambah periode = makin lambat
        }
        if (e.target.closest('.amp-btn-up'))   { e.stopPropagation(); window.adjustVsineAmp(id, 1); }
        if (e.target.closest('.amp-btn-down')) { e.stopPropagation(); window.adjustVsineAmp(id, -1); }
        if (e.target.closest('.freq-btn-up'))   { e.stopPropagation(); window.adjustVsineFreq(id, 0.5); }
        if (e.target.closest('.freq-btn-down')) { e.stopPropagation(); window.adjustVsineFreq(id, -0.5); }
        // Deteksi tombol KUNCI (Lock) Push Button
        if (e.target.closest('.lock-down-btn')) { e.stopPropagation(); window.togglePushButtonLock(id, true); // Kunci posisi tekan
          }
      // Deteksi tombol LEPAS (Unlock) Push Button
        if (e.target.closest('.lock-up-btn')) { e.stopPropagation(); window.togglePushButtonLock(id, false); // Lepas kunci
          }
        if (e.target.closest('.range-btn')) {
            e.stopPropagation();
            const currentComp = typeof CircuitStore !== 'undefined' ? CircuitStore.components.find(c => c.id === id) : null;
            if (currentComp) {
                // Balikkan status dari normal ke milli, atau sebaliknya
                currentComp.isMilli = !currentComp.isMilli;
                ComponentDefs.updateDOMState(type, currentComp, contentDiv, id);
            }
        }  
      });

      if(div) div.style.cursor = ['switch', 'push_button', 'switch_spst', 'potentiometer', 'ldr', 'thermistor_ntc', 'thermistor_ptc'].includes(type) ? 'pointer' : 'default';
    }
    if (!contentDiv.dataset.pushListener) {
          contentDiv.dataset.pushListener = "true";
          
          const startPress = (e) => {
              // Abaikan jika yang diklik adalah tombol kontrol (seperti gembok lock)
              if (type === 'push_button' && !e.target.closest('.control-btn')) {
                  const currentComp = typeof CircuitStore !== 'undefined' ? CircuitStore.components.find(c => c.id === id) : null;
                  if (currentComp && !currentComp.locked) {
                      currentComp.state = '1';
                  }
              }
          };

          const stopPress = (e) => {
              if (type === 'push_button') {
                  const currentComp = typeof CircuitStore !== 'undefined' ? CircuitStore.components.find(c => c.id === id) : null;
                  // Kembalikan ke 0 hanya jika tombol tidak dalam posisi digembok
                  if (currentComp && !currentComp.locked) {
                      currentComp.state = '0';
                  }
              }
          };

          // Event saat ditekan / ditahan
          contentDiv.addEventListener('mousedown', startPress);
          contentDiv.addEventListener('touchstart', startPress, {passive: true});
          
          // Event saat dilepas atau cursor kabur dari tombol
          contentDiv.addEventListener('mouseup', stopPress);
          contentDiv.addEventListener('mouseleave', stopPress);
          contentDiv.addEventListener('touchend', stopPress);
      }
    this.updateDOMState(type, compData, contentDiv, id);
  },

  initSVGTemplate(type, id, compData, contentDiv) {
    const pFill = '#e8e6d3', pStroke = '#1e293b', sw = '2';
    let svg = '';

    switch (type) {
      case 'switch':
        svg = `<svg width="60" height="40" viewBox="0 0 60 40"><polygon class="anim-body" points="5,5 35,5 45,20 35,35 5,35" fill="#2563eb" stroke="black" stroke-width="1"/><text class="anim-text" x="20" y="26" fill="white" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle">0</text><line class="pin-out-0" x1="45" y1="20" x2="60" y2="20" stroke="#006600" stroke-width="3"/></svg>`; break;
      case 'push_button':
        svg = `<svg width="60" height="40" viewBox="0 0 60 40">
          <line class="pin-in-0" x1="0" y1="20" x2="16" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="60" y1="20" x2="44" y2="20" stroke="#006600" stroke-width="3"/>
          <circle cx="18" cy="20" r="3" fill="#e8e6d3" stroke="#000000" stroke-width="3"/>
          <circle cx="42" cy="20" r="3" fill="#e8e6d3" stroke="#000000" stroke-width="3"/>
          <g class="anim-plunger" style="transition: transform 0.05s;">
             <rect x="18" y="10" width="24" height="4" fill="#e8e6d3" stroke="#000000" stroke-width="3"/>
             <line x1="30" y1="10" x2="30" y2="4" stroke="#000000" stroke-width="3"/>
             <rect x="22" y="2" width="16" height="3" fill="#000000"/>
          </g>
          <rect x="10" y="0" width="40" height="22" fill="transparent" style="cursor:pointer; pointer-events:auto;" />
          <g class="lock-btn control-btn lock-down-btn" style="cursor:pointer; pointer-events:auto;" transform="translate(30, 32)">
             <rect x="-10" y="-10" width="20" height="20" fill="transparent"/>
             <circle cx="0" cy="0" r="5" fill="#000000" stroke="#000000" stroke-width="1"/>
             <polygon points="-1,-2 -4,0 -1,2" fill="#000"/>
             <polygon points="1,-2 4,0 1,2" fill="#000"/>
          </g>
          <g class="unlock-btn control-btn lock-up-btn" style="cursor:pointer; pointer-events:auto;" transform="translate(48, 32)">
             <rect x="-10" y="-10" width="20" height="20" fill="transparent"/>
             <circle cx="0" cy="0" r="5" fill="#ffffff" stroke="#000000" stroke-width="1"/>
             <polygon points="-1,2 -4,0 -1,-2" fill="#000"/>
             <polygon points="1,2 4,0 1,-2" fill="#000"/>
          </g>
        </svg>`; break;
      case 'battery':  
        svg = `<svg width="80" height="60" viewBox="0 0 80 60"><rect x="25" y="15" width="30" height="30" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/><line class="pin-out-0" x1="80" y1="20" x2="55" y2="20" stroke="#006600" stroke-width="3"/><line class="pin-out-1" x1="80" y1="40" x2="55" y2="40" stroke="#006600" stroke-width="3"/><line x1="40" y1="20" x2="40" y2="40" stroke="${pStroke}" stroke-width="3"/><line x1="35" y1="25" x2="35" y2="35" stroke="${pStroke}" stroke-width="4"/><text x="40" y="12" class="anim-text comp-label resistor-val val-trigger" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;">12V</text><text x="65" y="18" class="comp-label" fill="red">+</text><text x="65" y="38" class="comp-label" fill="black">-</text></svg>`; break;
      
      case 'battery_1cell':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60"><line class="pin-out-0" x1="0" y1="30" x2="35" y2="30" stroke="#006600" stroke-width="3"/><line class="pin-out-1" x1="80" y1="30" x2="45" y2="30" stroke="#006600" stroke-width="3"/><line x1="35" y1="10" x2="35" y2="50" stroke="${pStroke}" stroke-width="3"/><line x1="45" y1="18" x2="45" y2="42" stroke="${pStroke}" stroke-width="5"/><text x="25" y="20" class="comp-label" fill="red" font-weight="bold" font-size="14">+</text><text x="55" y="20" class="comp-label" fill="black" font-weight="bold" font-size="14">-</text><text x="45" y="60" class="anim-text comp-label resistor-val val-trigger" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;">1.5V</text></svg>`; break;
        
      case 'battery_multi':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60"><line class="pin-out-0" x1="0" y1="30" x2="25" y2="30" stroke="#006600" stroke-width="3"/><line class="pin-out-1" x1="80" y1="30" x2="55" y2="30" stroke="#006600" stroke-width="3"/><line x1="25" y1="12" x2="25" y2="48" stroke="${pStroke}" stroke-width="3"/><line x1="33" y1="20" x2="33" y2="40" stroke="${pStroke}" stroke-width="4"/><line x1="36" y1="30" x2="44" y2="30" stroke="${pStroke}" stroke-width="2" stroke-dasharray="2 2"/><line x1="47" y1="12" x2="47" y2="48" stroke="${pStroke}" stroke-width="3"/><line x1="55" y1="20" x2="55" y2="40" stroke="${pStroke}" stroke-width="4"/><text x="15" y="20" class="comp-label" fill="red" font-weight="bold" font-size="14">+</text><text x="65" y="20" class="comp-label" fill="black" font-weight="bold" font-size="14">-</text><text x="40" y="60" class="anim-text comp-label resistor-val val-trigger" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;">12V</text></svg>`; break;
      case 'vsine':
  svg = `<svg width="160" height="110" viewBox="0 0 160 110">
    <!-- Kaki kiri & kanan, simbol AC standar -->
    <line class="pin-out-0" x1="0"   y1="35" x2="56"  y2="35" stroke="#006600" stroke-width="3"/>
    <line class="pin-out-1" x1="104" y1="35" x2="160" y2="35" stroke="#006600" stroke-width="3"/>

    <!-- Badan generator -->
    <circle class="anim-body" cx="80" cy="35" r="24" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
    <path d="M 68 35 Q 74 23 80 35 T 92 35" fill="none" stroke="${pStroke}" stroke-width="2"/>

    <!-- Kontrol Amplitudo (bawah kiri) -->
    <polygon class="control-btn amp-btn-up" points="40,60 50,60 45,52" fill="#22c55e" style="cursor:pointer; pointer-events:auto;"/>
    <text class="anim-text amp-val" x="45" y="85" text-anchor="middle" font-size="11" fill="#4f46e5" font-weight="bold"></text>
    <polygon class="control-btn amp-btn-down" points="40,90 50,90 45,98" fill="#ef4444" style="cursor:pointer; pointer-events:auto;"/>

    <!-- Kontrol Frekuensi (bawah kanan) -->
    <polygon class="control-btn freq-btn-up" points="110,60 120,60 115,52" fill="#22c55e" style="cursor:pointer; pointer-events:auto;"/>
    <text class="anim-text freq-val" x="115" y="85" text-anchor="middle" font-size="11" fill="#4f46e5" font-weight="bold"></text>
    <polygon class="control-btn freq-btn-down" points="110,90 120,90 115,98" fill="#ef4444" style="cursor:pointer; pointer-events:auto;"/>
  </svg>`; break;
      case 'power_terminal':
        svg = `<svg width="60" height="40" viewBox="0 0 60 40"><line class="pin-out-0" x1="30" y1="40" x2="30" y2="20" stroke="#006600" stroke-width="3"/><path d="M 30 20 L 20 30 M 30 20 L 40 30 M 15 20 L 45 20" fill="none" stroke="${pStroke}" stroke-width="3"/><text class="anim-text comp-label resistor-val val-trigger" x="30" y="12" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;">12V</text></svg>`; break;

      case 'fuse':
        svg = `<svg width="80" height="40" viewBox="0 0 80 40"><line class="pin-in-0" x1="0" y1="20" x2="25" y2="20" stroke="#006600" stroke-width="3"/><line class="pin-out-0" x1="55" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="3"/><rect class="anim-body" x="25" y="10" width="30" height="20" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/><path class="anim-line" d="M 25 20 Q 40 5 55 20" fill="none" stroke="${pStroke}" stroke-width="3"/><text class="anim-text comp-label fuse-val val-trigger" x="40" y="8" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;"></text><text class="anim-blown comp-label" x="40" y="24" fill="red" font-weight="bold" text-anchor="middle" style="display:none;">BLOWN</text></svg>`; break;

      case 'resistor':
        svg = `<svg width="80" height="50" viewBox="0 0 80 50"><line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/><line class="pin-out-0" x1="60" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="3"/><path d="M 20 20 l 5 -10 l 10 20 l 10 -20 l 10 20 l 5 -10" fill="none" stroke="${pStroke}" stroke-width="${sw}" stroke-linejoin="round"/><text class="anim-text comp-label resistor-val val-trigger" x="40" y="42" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;"></text></svg>`; break;

      case 'voltage_divider':
        svg = `<svg width="80" height="70" viewBox="0 0 80 70">
          <rect x="5" y="5" width="70" height="60" rx="4" fill="var(--bg-container)" stroke="${pStroke}" stroke-width="2"/>
          <line class="pin-in-0" x1="0" y1="35" x2="5" y2="35" stroke="#006600" stroke-width="2"/>
          <line class="pin-out-0" x1="75" y1="35" x2="80" y2="35" stroke="#006600" stroke-width="2"/>
          
          <!-- R1 & V1 (Bagian Atas) -->
          <text x="40" y="18" class="anim-text comp-label resistor-val val-trigger r1-label" data-sub="r1" font-size="9" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;">R1: 10kΩ</text>
          <text x="40" y="29" class="v1-label" font-size="9" font-weight="bold" text-anchor="middle" fill="#f87171">V1: 0.00V</text>
          
          <!-- R2 & V2 (Bagian Bawah) -->
          <text x="40" y="45" class="anim-text comp-label resistor-val val-trigger r2-label" data-sub="r2" font-size="9" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;">R2: 10kΩ</text>
          <text x="40" y="56" class="v2-label" font-size="9" font-weight="bold" text-anchor="middle" fill="#22c55e">V2: 0.00V</text>
        </svg>`; 
        break;
      case 'capacitor':
        svg = `<svg width="80" height="50" viewBox="0 0 80 50">
        <line class="pin-in-0" x1="0" y1="20" x2="35" y2="20" stroke="#006600" stroke-width="3"/>
        <line class="pin-out-0" x1="80" y1="20" x2="45" y2="20" stroke="#006600" stroke-width="3"/>
        <line x1="35" y1="10" x2="35" y2="35" stroke="${pStroke}" stroke-width="3"/>
        <line x1="45" y1="10" x2="45" y2="35" stroke="${pStroke}" stroke-width="3"/>
        <text x="40" y="8" class="comp-label" text-anchor="middle">C${id}</text>
        <text class="anim-text comp-label resistor-val val-trigger" x="40" y="48" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;"></text>
        </svg>`
        ; break;

        case 'ff_sr':
        svg = `<svg width="80" height="90" viewBox="0 0 80 90">
          <rect class="anim-body" x="20" y="5" width="40" height="80" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="0" y1="70" x2="20" y2="70" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-2" x1="0" y1="45" x2="20" y2="45" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="60" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-1" x1="60" y1="70" x2="80" y2="70" stroke="#006600" stroke-width="3"/>
          <polyline points="20,40 25,45 20,50" fill="none" stroke="${pStroke}" stroke-width="1.5"/>
          <text x="24" y="24" class="comp-label" font-size="10">S</text>
          <text x="24" y="74" class="comp-label" font-size="10">R</text>
          <text x="56" y="24" class="comp-label" text-anchor="end" font-size="10">Q</text>
          <text x="56" y="74" class="comp-label" text-anchor="end" font-size="10">Q̅</text>
          <text x="40" y="8" class="comp-label" text-anchor="middle" font-size="8" fill="gray">SR FF</text>
        </svg>`; break;

      case 'ff_d':
        svg = `<svg width="80" height="80" viewBox="0 0 80 80">
          <rect class="anim-body" x="20" y="10" width="40" height="60" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <line class="pin-in-0" x1="0" y1="25" x2="20" y2="25" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="0" y1="55" x2="20" y2="55" stroke="#006600" stroke-width="3"/>
          <polyline points="20,50 25,55 20,60" fill="none" stroke="${pStroke}" stroke-width="1.5"/>
          <line class="pin-in-2" x1="40" y1="0" x2="40" y2="6" stroke="#006600" stroke-width="3"/>
          <circle cx="40" cy="8" r="2" fill="${pFill}" stroke="${pStroke}" stroke-width="1.5"/>
          <line class="pin-in-3" x1="40" y1="80" x2="40" y2="74" stroke="#006600" stroke-width="3"/>
          <circle cx="40" cy="72" r="2" fill="${pFill}" stroke="${pStroke}" stroke-width="1.5"/>
          <line class="pin-out-0" x1="60" y1="25" x2="80" y2="25" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-1" x1="60" y1="55" x2="80" y2="55" stroke="#006600" stroke-width="3"/>
          
          <text x="24" y="29" class="comp-label" font-size="10">D</text>
          <text x="56" y="29" class="comp-label" text-anchor="end" font-size="10">Q</text>
          <text x="56" y="59" class="comp-label" text-anchor="end" font-size="10">Q̅</text>
          <text x="40" y="22" class="comp-label" text-anchor="middle" font-size="9">S</text>
          <text x="40" y="66" class="comp-label" text-anchor="middle" font-size="9">R</text>
          <text x="40" y="44" class="comp-label" text-anchor="middle" font-weight="bold" font-size="10">7474</text>
        </svg>`; break;

      case 'ff_jk':
        svg = `<svg width="80" height="90" viewBox="0 0 80 90">
          <rect class="anim-body" x="20" y="10" width="40" height="70" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <line class="pin-in-0" x1="0" y1="25" x2="20" y2="25" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="0" y1="65" x2="20" y2="65" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-2" x1="0" y1="45" x2="20" y2="45" stroke="#006600" stroke-width="3"/>
          <polyline points="20,40 25,45 20,50" fill="none" stroke="${pStroke}" stroke-width="1.5"/>
          <line class="pin-in-3" x1="40" y1="0" x2="40" y2="6" stroke="#006600" stroke-width="3"/>
          <circle cx="40" cy="8" r="2" fill="${pFill}" stroke="${pStroke}" stroke-width="1.5"/>
          <line class="pin-in-4" x1="40" y1="90" x2="40" y2="84" stroke="#006600" stroke-width="3"/>
          <circle cx="40" cy="82" r="2" fill="${pFill}" stroke="${pStroke}" stroke-width="1.5"/>
          <line class="pin-out-0" x1="60" y1="25" x2="80" y2="25" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-1" x1="60" y1="65" x2="80" y2="65" stroke="#006600" stroke-width="3"/>
          
          <text x="24" y="29" class="comp-label" font-size="10">J</text>
          <text x="24" y="69" class="comp-label" font-size="10">K</text>
          <text x="56" y="29" class="comp-label" text-anchor="end" font-size="10">Q</text>
          <text x="56" y="69" class="comp-label" text-anchor="end" font-size="10">Q̅</text>
          <text x="40" y="22" class="comp-label" text-anchor="middle" font-size="9">S</text>
          <text x="40" y="76" class="comp-label" text-anchor="middle" font-size="9">R</text>
          <text x="40" y="49" class="comp-label" text-anchor="middle" font-weight="bold" font-size="10">7476</text>
        </svg>`; break;
      case 'logic_probe':
        svg = `<svg width="60" height="40" viewBox="0 0 60 40">
          <line class="pin-in-0" x1="0" y1="20" x2="15" y2="20" stroke="#006600" stroke-width="3"/>
          <polygon points="15,15 25,20 15,25" fill="${pStroke}"/>
          <rect class="anim-body" x="25" y="5" width="30" height="30" rx="4" fill="#1e293b" stroke="${pStroke}" stroke-width="${sw}"/>
          <text class="anim-text" x="40" y="26" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="20" fill="#94a3b8">Z</text>
        </svg>`; break;  
      case 'ff_t':
        svg = `<svg width="80" height="80" viewBox="0 0 80 80">
          <rect class="anim-body" x="20" y="5" width="40" height="70" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="0" y1="60" x2="20" y2="60" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="60" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-1" x1="60" y1="60" x2="80" y2="60" stroke="#006600" stroke-width="3"/>
          <polyline points="20,55 25,60 20,65" fill="none" stroke="${pStroke}" stroke-width="1.5"/>
          <text x="24" y="24" class="comp-label" font-size="10">T</text>
          <text x="56" y="24" class="comp-label" text-anchor="end" font-size="10">Q</text>
          <text x="56" y="64" class="comp-label" text-anchor="end" font-size="10">Q̅</text>
          <text x="40" y="44" class="comp-label" text-anchor="middle" font-weight="bold" font-size="10">T FF</text>
        </svg>`; break;
      case 'output_terminal':
        svg = `<svg width="75" height="40" viewBox="0 0 75 40">
          <line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/>
          <rect x="20" y="5" width="50" height="30" rx="4" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <text class="anim-text meter-val" x="45" y="24" text-anchor="middle" font-size="12">0.0V</text>
          <text x="45" y="48" class="comp-label" text-anchor="middle" font-size="8">OUT</text>
        </svg>`; break;  
        case 'switch_spst':
        svg = `<svg width="80" height="40" viewBox="0 0 80 40"><line class="pin-in-0" x1="0" y1="20" x2="25" y2="20" stroke="#006600" stroke-width="3"/><line class="pin-out-0" x1="55" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="3"/><circle cx="25" cy="20" r="3" fill="${pStroke}"/><circle cx="55" cy="20" r="3" fill="${pStroke}"/><line class="anim-line" x1="25" y1="20" x2="50" y2="10" stroke="black" stroke-width="3"/><rect class="anim-body" x="30" y="30" width="20" height="8" rx="2" fill="#e2e8f0" stroke="black" stroke-width="1"/></svg>`; break;
      case 'led':
        svg = `<svg width="60" height="60" viewBox="0 0 60 60" class="anim-svg">
          <line class="pin-in-0" x1="0" y1="30" x2="15" y2="30" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="45" y1="30" x2="60" y2="30" stroke="#006600" stroke-width="3"/>
          <circle class="anim-body" cx="30" cy="30" r="15" fill="#4a0000" stroke="${pStroke}" stroke-width="${sw}"/>
          <path d="M25 25 L35 30 L25 35 Z" fill="${pStroke}"/>
          <line x1="35" y1="23" x2="35" y2="37" stroke="${pStroke}" stroke-width="3"/>
          <text x="30" y="55" class="anim-text comp-label val-trigger" text-anchor="middle" fill="#4f46e5" style="cursor:pointer; pointer-events:auto; font-weight:bold;">L${id}</text>
        </svg>`; break;
      case 'diode':
        svg = `<svg width="60" height="40" viewBox="0 0 60 40"><line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/><line class="pin-out-0" x1="35" y1="20" x2="60" y2="20" stroke="#006600" stroke-width="3"/><polygon class="anim-body" points="20,10 20,30 35,20" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/><line class="anim-line" x1="35" y1="10" x2="35" y2="30" stroke="${pStroke}" stroke-width="${sw}"/><text x="30" y="38" class="comp-label" text-anchor="middle">D${id}</text></svg>`; break;
      case 'ground':
        svg = `<svg width="40" height="40" viewBox="0 0 40 40"><line class="pin-in-0" x1="20" y1="0" x2="20" y2="20" stroke="#000000" stroke-width="3"/><line x1="8" y1="20" x2="32" y2="20" stroke="#000000" stroke-width="3"/><line x1="14" y1="26" x2="26" y2="26" stroke="#000000" stroke-width="3"/><line x1="18" y1="32" x2="22" y2="32" stroke="#000000" stroke-width="3"/></svg>`; break;
      case 'voltmeter':
        svg = `<svg width="80" height="80" viewBox="0 0 80 80">
          <line class="pin-in-0" x1="0" y1="40" x2="16" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="64" y1="40" x2="80" y2="40" stroke="#006600" stroke-width="3"/>
          <circle cx="40" cy="40" r="24" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <text class="anim-text meter-val" x="40" y="41" text-anchor="middle" font-size="15">0.0V</text>
          
          <rect class="control-btn range-btn" x="30" y="47" width="20" height="11" rx="2" fill="#475569" style="cursor:pointer; pointer-events:auto;"/>
          <text class="range-txt" x="40" y="55" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">V</text>
          
          <text x="0" y="30" class="comp-label" fill="red" font-size="14" font-weight="bold">+</text>
          <text x="70" y="30" class="comp-label" fill="black" font-size="14" font-weight="bold">-</text>
        </svg>`; break;
      case 'ammeter':
        svg = `<svg width="80" height="80" viewBox="0 0 80 80">
          <line class="pin-in-0" x1="0" y1="40" x2="16" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="64" y1="40" x2="80" y2="40" stroke="#006600" stroke-width="3"/>
          <circle cx="40" cy="40" r="24" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <text class="anim-text meter-val" x="40" y="41" text-anchor="middle" font-size="15">0.00A</text>
          
          <rect class="control-btn range-btn" x="30" y="47" width="20" height="11" rx="2" fill="#475569" style="cursor:pointer; pointer-events:auto;"/>
          <text class="range-txt" x="40" y="55" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">A</text>
        </svg>`; break;
      case 'relay':
        svg = `<svg width="80" height="80" viewBox="0 0 80 80">
          <line class="pin-in-0" x1="0" y1="20" x2="25" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="55" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="3"/>
          <rect class="anim-body" x="25" y="10" width="30" height="20" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          
          <line class="pin-in-1" x1="0" y1="60" x2="25" y2="60" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-1" x1="55" y1="60" x2="80" y2="60" stroke="#006600" stroke-width="3"/>
          <line class="anim-line" x1="25" y1="60" x2="50" y2="50" stroke="black" stroke-width="3"/>
          
          <text x="12" y="16" class="comp-label" font-weight="bold" font-size="10" text-anchor="middle">85</text>
          <text x="68" y="16" class="comp-label" font-weight="bold" font-size="10" text-anchor="middle">86</text>
          <text x="12" y="56" class="comp-label" font-weight="bold" font-size="10" text-anchor="middle">30</text>
          <text x="68" y="56" class="comp-label" font-weight="bold" font-size="10" text-anchor="middle">87</text>
        </svg>`; break;
      case 'relay_5pin':
        svg = `<svg width="80" height="100" viewBox="0 0 80 100">
          <line class="pin-in-0" x1="0" y1="20" x2="25" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="55" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="3"/>
          <rect class="anim-body" x="25" y="10" width="30" height="20" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <text x="12" y="16" class="comp-label" font-weight="bold" font-size="10" text-anchor="middle">85</text>
          <text x="68" y="16" class="comp-label" font-weight="bold" font-size="10" text-anchor="middle">86</text>

          <line class="pin-in-1" x1="0" y1="70" x2="25" y2="70" stroke="#006600" stroke-width="3"/> <line class="pin-out-1" x1="55" y1="50" x2="80" y2="50" stroke="#006600" stroke-width="3"/> <line class="pin-out-2" x1="55" y1="90" x2="80" y2="90" stroke="#006600" stroke-width="3"/> <circle cx="25" cy="70" r="3" fill="${pStroke}"/>
          <circle cx="55" cy="50" r="3" fill="${pStroke}"/>
          <circle cx="55" cy="90" r="3" fill="${pStroke}"/>

          <line class="anim-line" x1="25" y1="70" x2="55" y2="50" stroke="black" stroke-width="3" style="transition: transform 0.1s, y2 0.1s;"/>

          <text x="12" y="66" class="comp-label" font-weight="bold" font-size="10" text-anchor="middle">30</text>
          <text x="68" y="46" class="comp-label" font-weight="bold" font-size="10" text-anchor="middle">87a</text>
          <text x="68" y="86" class="comp-label" font-weight="bold" font-size="10" text-anchor="middle">87</text>
        </svg>`; break;  
      case 'diode_bridge': {
  const diodeSym = (cx, cy, angleDeg) => `
    <g transform="translate(${cx},${cy}) rotate(${angleDeg})">
      <line x1="-12" y1="0" x2="-4" y2="0" stroke="${pStroke}" stroke-width="2"/>
      <polygon points="-4,-6 -4,6 5,0" fill="${pStroke}"/>
      <line x1="5" y1="-7" x2="5" y2="7" stroke="${pStroke}" stroke-width="2.5"/>
      <line x1="5" y1="0" x2="12" y2="0" stroke="${pStroke}" stroke-width="2"/>
    </g>`;

  svg = `<svg width="140" height="140" viewBox="0 0 140 140">
    <!-- Kabel eksternal -->
    <line class="pin-in-0"  x1="70" y1="15"  x2="70" y2="0"   stroke="#006600" stroke-width="3"/>
    <line class="pin-in-1"  x1="70" y1="125" x2="70" y2="140" stroke="#006600" stroke-width="3"/>
    <line class="pin-out-0" x1="125" y1="70" x2="140" y2="70" stroke="#006600" stroke-width="3"/>
    <line class="pin-out-1" x1="15"  y1="70" x2="0"   y2="70" stroke="#006600" stroke-width="3"/>

    <!-- 🔧 BARU: garis penghubung antar titik simpul (rangka belah ketupat) -->
    <line x1="70" y1="15"  x2="125" y2="70" stroke="${pStroke}" stroke-width="2"/> <!-- atas → kanan -->
    <line x1="15" y1="70"  x2="70"  y2="15" stroke="${pStroke}" stroke-width="2"/> <!-- kiri → atas -->
    <line x1="70" y1="125" x2="125" y2="70" stroke="${pStroke}" stroke-width="2"/> <!-- bawah → kanan -->
    <line x1="15" y1="70"  x2="70"  y2="125" stroke="${pStroke}" stroke-width="2"/> <!-- kiri → bawah -->

    <!-- 4 dioda ditumpuk di atas garis, di tengah tiap sisi -->
    ${diodeSym(97.5, 42.5, 45)}    <!-- atas → kanan(+) -->
    ${diodeSym(42.5, 42.5, -45)}   <!-- kiri(-) → atas -->
    ${diodeSym(97.5, 97.5, -45)}   <!-- bawah → kanan(+) -->
    ${diodeSym(42.5, 97.5, 45)}    <!-- kiri(-) → bawah -->

    <!-- Titik simpul (vertex diamond) -->
    <circle cx="70" cy="15" r="3" fill="${pStroke}"/>
    <circle cx="125" cy="70" r="3" fill="${pStroke}"/>
    <circle cx="70" cy="125" r="3" fill="${pStroke}"/>
    <circle cx="15" cy="70" r="3" fill="${pStroke}"/>

    <!-- Label -->
    <text x="60" y="9" text-anchor="middle" font-size="13" fill="${pStroke}">~</text>
    <text x="60" y="137" text-anchor="middle" font-size="13" fill="${pStroke}">~</text>
    <text x="132" y="65" text-anchor="middle" font-size="14" font-weight="bold" fill="red">+</text>
    <text x="8" y="65" text-anchor="middle" font-size="14" font-weight="bold" fill="${pStroke}">-</text>
  </svg>`;
  break;
}
      case 'transformer':
        svg = `<svg width="100" height="100" viewBox="0 0 100 100"><line x1="46" y1="15" x2="46" y2="85" stroke="${pStroke}" stroke-width="3"/><line x1="54" y1="15" x2="54" y2="85" stroke="${pStroke}" stroke-width="3"/><line x1="0" y1="30" x2="30" y2="30" stroke="#006600" stroke-width="2" class="pin-in-0"/><line x1="0" y1="70" x2="30" y2="70" stroke="#006600" stroke-width="2" class="pin-in-1"/><path class="anim-coil-p" d="M 30 30 C 45 30 45 40 30 40 C 45 40 45 50 30 50 C 45 50 45 60 30 60 C 45 60 45 70 30 70" fill="none" stroke="${pStroke}" stroke-width="3"/><line x1="70" y1="20" x2="100" y2="20" stroke="#006600" stroke-width="2" class="pin-out-0"/><line x1="70" y1="50" x2="100" y2="50" stroke="#006600" stroke-width="2" class="pin-out-1"/><line x1="70" y1="80" x2="100" y2="80" stroke="#006600" stroke-width="2" class="pin-out-2"/><path class="anim-coil-s" d="M 70 20 C 55 20 55 35 70 35 C 55 35 55 50 70 50 C 55 50 55 65 70 65 C 55 65 55 80 70 80" fill="none" stroke="${pStroke}" stroke-width="3"/></svg>`; break;
      case 'clock_pulse':
        svg = `<svg width="60" height="40" viewBox="0 0 60 40">
          <rect class="anim-body" x="5" y="5" width="40" height="30" rx="4" fill="#0f172a" stroke="#3b82f6" stroke-width="2"/>
          <path d="M 10 20 L 15 20 L 15 10 L 25 10 L 25 30 L 35 30 L 35 20 L 40 20" fill="none" stroke="#22c55e" stroke-width="2"/>
          <line class="pin-out-0" x1="45" y1="20" x2="60" y2="20" stroke="#006600" stroke-width="3"/>
          <circle class="anim-indicator" cx="12" cy="10" r="3" fill="#ef4444"/>
        </svg>`; break;
      case 'flasher':
  svg = `<svg width="80" height="40" viewBox="0 0 80 40">
    <line class="pin-in-0" x1="0" y1="20" x2="25" y2="20" stroke="#006600" stroke-width="3"/>
    <line class="pin-out-0" x1="55" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="3"/>
    <rect class="anim-body" x="25" y="8" width="30" height="24" rx="4" fill="#e2e8f0" stroke="${pStroke}" stroke-width="${sw}"/>
    <circle class="anim-indicator" cx="40" cy="17" r="4" fill="#475569"/>
    <text class="anim-text speed-val" x="40" y="38" text-anchor="middle" font-size="8" fill="#4f46e5"></text>
    <polygon class="control-btn speed-btn-up" points="60,16 68,16 64,9" fill="#22c55e" style="cursor:pointer; pointer-events:auto;"/>
    <polygon class="control-btn speed-btn-down" points="60,20 68,20 64,27" fill="#ef4444" style="cursor:pointer; pointer-events:auto;"/>
  </svg>`; break;
      // === SENSOR INTERAKTIF ===
      case 'ldr':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="25" x2="25" y2="25" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="55" y1="25" x2="80" y2="25" stroke="#006600" stroke-width="3"/>
          <circle cx="40" cy="25" r="16" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <path d="M 28 25 l 4 -8 l 8 16 l 8 -16 l 4 8" fill="none" stroke="${pStroke}" stroke-width="${sw}" stroke-linejoin="round"/>
          <path d="M 25 5 L 35 15 M 32 15 L 35 15 L 35 12 M 15 10 L 25 20 M 22 20 L 25 20 L 25 17" fill="none" stroke="#f59e0b" stroke-width="3"/>
          
          <text class="anim-text comp-label resistor-val val-trigger" x="35" y="50" text-anchor="middle" font-size="10" fill="#4f46e5" style="cursor:pointer; pointer-events:auto;"></text>
          <polygon class="control-btn btn-up" points="60,42 70,42 65,34" fill="#22c55e" style="cursor:pointer; pointer-events:auto;"/>
          <polygon class="control-btn btn-down" points="60,46 70,46 65,54" fill="#ef4444" style="cursor:pointer; pointer-events:auto;"/>
        </svg>`; break;
      case 'thermistor_ntc':
      case 'thermistor_ptc': {
        const label = type === 'thermistor_ntc' ? '-t°' : '+t°';
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="25" x2="20" y2="25" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="60" y1="25" x2="80" y2="25" stroke="#006600" stroke-width="3"/>
          <rect x="20" y="17" width="40" height="16" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <path d="M 15 40 L 25 40 L 65 7" fill="none" stroke="${pStroke}" stroke-width="3"/>
          <text x="35" y="10" class="comp-label" font-weight="bold">${label}</text>
          
          <text class="anim-text comp-label resistor-val val-trigger" x="35" y="52" text-anchor="middle" font-size="10" fill="#4f46e5" style="cursor:pointer; pointer-events:auto;"></text>
          <polygon class="control-btn btn-up" points="55,45 65,45 60,37" fill="#22c55e" style="cursor:pointer; pointer-events:auto;"/>
          <polygon class="control-btn btn-down" points="55,49 65,49 60,57" fill="#ef4444" style="cursor:pointer; pointer-events:auto;"/>
        </svg>`; break;
      }
      case 'ic_555':
        svg = `<svg width="120" height="160" viewBox="0 0 120 160">
          <rect class="anim-body" x="30" y="20" width="60" height="120" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <circle cx="38" cy="28" r="4" fill="${pStroke}"/>
          <line class="pin-in-1" x1="0" y1="100" x2="30" y2="100" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-2" x1="0" y1="40" x2="30" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-3" x1="0" y1="70" x2="30" y2="70" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="120" y1="40" x2="90" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-4" x1="120" y1="100" x2="90" y2="100" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-1" x1="120" y1="70" x2="90" y2="70" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-5" x1="60" y1="0" x2="60" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-0" x1="60" y1="160" x2="60" y2="140" stroke="#006600" stroke-width="3"/>
          
          <text x="35" y="104" class="comp-label" font-size="10">TR</text>
          <text x="37" y="44" class="comp-label" font-size="10">R</text>
          <circle cx="34" cy="41" r="2" fill="none" stroke="black"/>
          <text x="35" y="74" class="comp-label" font-size="10">CTRL</text>
          <text x="85" y="44" class="comp-label" text-anchor="end" font-size="10">out</text>
          <text x="85" y="104" class="comp-label" text-anchor="end" font-size="10">TH</text>
          <text x="85" y="74" class="comp-label" text-anchor="end" font-size="10">DC</text>
          <text x="60" y="32" class="comp-label" text-anchor="middle" font-size="10">VCC</text>
          <text x="60" y="135" class="comp-label" text-anchor="middle" font-size="10">GND</text>
          <text x="60" y="85" class="comp-label" font-weight="bold" font-size="16" text-anchor="middle">555</text>
        </svg>`; break;
      case 'potentiometer':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="60" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="3"/>
          <path d="M 20 20 l 5 -10 l 10 20 l 10 -20 l 10 20 l 5 -10" fill="none" stroke="${pStroke}" stroke-width="${sw}" stroke-linejoin="round"/>
          <line class="pin-out-0" x1="40" y1="22" x2="40" y2="60" stroke="#006600" stroke-width="3"/>
          <polygon points="40,22 36,30 44,30" fill="${pStroke}"/>
          
          <text x="10" y="12" class="comp-label" font-size="9" font-weight="bold" fill="#0284c7">IN</text>
          <text x="62" y="12" class="comp-label" font-size="9" font-weight="bold" fill="#1e293b">GND</text>
          <text x="20" y="55" class="comp-label" font-size="9" font-weight="bold" fill="#e11d48">OUT</text>
          
          <polygon class="control-btn btn-up" points="48,42 56,42 52,34" fill="#22c55e" style="cursor:pointer; pointer-events:auto;"/>
          <polygon class="control-btn btn-down" points="48,46 56,46 52,54" fill="#ef4444" style="cursor:pointer; pointer-events:auto;"/>
          <text class="anim-text comp-label resistor-val val-trigger" x="66" y="48" text-anchor="middle" font-size="9" font-weight="bold" fill="#4f46e5" style="cursor:pointer; pointer-events:auto;"></text>
          <text class="val-text" x="40" y="8" text-anchor="middle" font-size="10" font-weight="bold" fill="currentColor">10k</text>
        </svg>`; break;
      case 'oscilloscope':
        svg = `<svg width="410" height="280" viewBox="0 0 410 280">
          <rect x="5" y="5" width="400" height="270" rx="8" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>
          <text x="205" y="24" font-size="10" font-weight="bold" fill="#94a3b8" text-anchor="middle" letter-spacing="1">DUAL CHANNEL DSO</text>

          <rect x="30" y="40" width="200" height="160" fill="#020617" stroke="#334155" stroke-width="2"/>
          <defs>
            <pattern id="grid_${id}" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0f766e" stroke-width="0.5" stroke-dasharray="2,2"/></pattern>
            <clipPath id="clip_osc_${id}"><rect x="30" y="40" width="200" height="160" /></clipPath>
          </defs>
          <rect x="30" y="40" width="200" height="160" fill="url(#grid_${id})" />
          
          <line x1="30" y1="120" x2="230" y2="120" stroke="#0d9488" stroke-width="1.5"/>
          <line x1="130" y1="40" x2="130" y2="200" stroke="#0d9488" stroke-width="1.5"/>
          
          <polyline class="osc-trace-ch2" points="" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linejoin="round" clip-path="url(#clip_osc_${id})"/>
          <polyline class="osc-trace-ch1" points="" fill="none" stroke="#eab308" stroke-width="2" stroke-linejoin="round" clip-path="url(#clip_osc_${id})"/>
          <polyline class="osc-trace-xy" points="" fill="none" stroke="#10b981" stroke-width="2" stroke-linejoin="round" clip-path="url(#clip_osc_${id})" style="display:none;"/>
          
          <g class="cursors-group" style="display:none;">
            <line class="cur-v1" x1="30" y1="80" x2="230" y2="80" stroke="#eab308" stroke-width="1.5" stroke-dasharray="4,2" pointer-events="none" />
            <line class="cur-v2" x1="30" y1="160" x2="230" y2="160" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="4,2" pointer-events="none" />
            <line class="cur-t1" x1="80" y1="40" x2="80" y2="200" stroke="#eab308" stroke-width="1.5" stroke-dasharray="4,2" pointer-events="none" />
            <line class="cur-t2" x1="180" y1="40" x2="180" y2="200" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="4,2" pointer-events="none" />
            
            <line class="cur-v1-hit" x1="30" y1="80" x2="230" y2="80" stroke="transparent" stroke-width="12" style="cursor:ns-resize; pointer-events:auto;" />
            <line class="cur-v2-hit" x1="30" y1="160" x2="230" y2="160" stroke="transparent" stroke-width="12" style="cursor:ns-resize; pointer-events:auto;" />
            <line class="cur-t1-hit" x1="80" y1="40" x2="80" y2="200" stroke="transparent" stroke-width="12" style="cursor:ew-resize; pointer-events:auto;" />
            <line class="cur-t2-hit" x1="180" y1="40" x2="180" y2="200" stroke="transparent" stroke-width="12" style="cursor:ew-resize; pointer-events:auto;" />
          </g>

          <g class="cur-osd" style="display:none;">
            <rect x="35" y="45" width="100" height="50" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke="#334155" stroke-width="1"/>
            <text class="cur-title" x="85" y="56" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle">CURSOR</text>
            <text class="cur-txt-1" x="40" y="68" font-size="8" fill="#eab308">1: ---</text>
            <text class="cur-txt-2" x="40" y="80" font-size="8" fill="#06b6d4">2: ---</text>
            <text class="cur-txt-d" x="40" y="92" font-size="8" font-weight="bold" fill="#22c55e">Δ: ---</text>
          </g>

          <g class="meas-overlay" style="display:none;">
            <rect x="40" y="45" width="180" height="95" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke="#334155" stroke-width="1"/>
            <text class="meas-title" x="130" y="56" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle">MEASURE CH1</text>
            <line x1="45" y1="61" x2="215" y2="61" stroke="#334155" stroke-width="1"/>
            
            <text x="45" y="72" font-size="8" font-weight="bold" fill="#94a3b8">Vpp : <tspan class="m-vpp" fill="#fff">0.00V</tspan></text>
            <text x="45" y="84" font-size="8" font-weight="bold" fill="#94a3b8">Vmax: <tspan class="m-vmax" fill="#fff">0.00V</tspan></text>
            <text x="45" y="96" font-size="8" font-weight="bold" fill="#94a3b8">Vmin: <tspan class="m-vmin" fill="#fff">0.00V</tspan></text>
            <text x="45" y="108" font-size="8" font-weight="bold" fill="#94a3b8">Vamp: <tspan class="m-vamp" fill="#fff">0.00V</tspan></text>
            <text x="45" y="120" font-size="8" font-weight="bold" fill="#94a3b8">Vrms: <tspan class="m-vrms" fill="#fff">0.00V</tspan></text>
            <text x="45" y="132" font-size="8" font-weight="bold" fill="#94a3b8">Vavg: <tspan class="m-vavg" fill="#fff">0.00V</tspan></text>

            <text x="135" y="72" font-size="8" font-weight="bold" fill="#94a3b8">Freq: <tspan class="m-freq" fill="#fff">---</tspan></text>
            <text x="135" y="84" font-size="8" font-weight="bold" fill="#94a3b8">Per : <tspan class="m-per" fill="#fff">---</tspan></text>
            <text x="135" y="96" font-size="8" font-weight="bold" fill="#94a3b8">Duty: <tspan class="m-duty" fill="#fff">---</tspan></text>
            <text x="135" y="108" font-size="8" font-weight="bold" fill="#94a3b8">P.W : <tspan class="m-pw" fill="#fff">---</tspan></text>
            <text x="135" y="120" font-size="8" font-weight="bold" fill="#94a3b8">Rise: <tspan class="m-rise" fill="#fff">---</tspan></text>
            <text x="135" y="132" font-size="8" font-weight="bold" fill="#94a3b8">Fall: <tspan class="m-fall" fill="#fff">---</tspan></text>
          </g>

          <text x="35" y="222" class="tdiv-text" font-size="9" font-family="monospace" fill="#38bdf8">T/Div: 1.0s</text>
          <text x="135" y="222" class="tlvl-text" font-size="9" font-family="monospace" fill="#a855f7">Trig: 0.0V</text>
          
          <text x="35" y="240" class="vdiv1-text" font-size="9" font-family="monospace" fill="#eab308">CH1: 5V/div</text>
          <text x="135" y="240" class="val1-text" font-size="9" font-family="monospace" fill="#eab308" font-weight="bold">V1: 0.00V</text>
          
          <text x="35" y="258" class="vdiv2-text" font-size="9" font-family="monospace" fill="#06b6d4">CH2: 5V/div</text>
          <text x="135" y="258" class="val2-text" font-size="9" font-family="monospace" fill="#06b6d4" font-weight="bold">V2: 0.00V</text>
          
          <circle cx="15" cy="100" r="4" fill="#eab308" stroke="#0f172a" stroke-width="1"/>
          <line x1="15" y1="100" x2="30" y2="100" stroke="#eab308" stroke-width="2"/>
          <circle cx="15" cy="140" r="4" fill="#06b6d4" stroke="#0f172a" stroke-width="1"/>
          <line x1="15" y1="140" x2="30" y2="140" stroke="#06b6d4" stroke-width="2"/>

          <rect class="osc-panel" x="240" y="35" width="155" height="230" rx="4" fill="#334155" stroke="#475569" stroke-width="1"/>
          
          <text x="265" y="48" font-size="7" font-weight="bold" fill="#cbd5e1" text-anchor="middle">CH SEL</text>
          <rect class="btn-ch-sel control-btn" x="245" y="52" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="ch-sel-txt" x="265" y="62" font-size="8" font-weight="bold" fill="#eab308" text-anchor="middle" pointer-events="none">CH1</text>
          
          <text x="265" y="74" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">V/DIV</text>
          <rect class="btn-vdiv-up control-btn" x="245" y="78" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="265" y="88" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">▲</text>
          <rect class="btn-vdiv-dn control-btn" x="245" y="94" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="265" y="104" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">▼</text>
          
          <text x="265" y="116" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">Y-POS</text>
          <rect class="btn-ypos-up control-btn" x="245" y="120" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="265" y="130" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">▲</text>
          <rect class="btn-ypos-dn control-btn" x="245" y="136" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="265" y="146" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">▼</text>
          
          <text x="265" y="158" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">IN CPL</text>
          <rect class="btn-ch-coupl control-btn" x="245" y="162" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="ch-coupl-txt" x="265" y="172" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">DC</text>
          
          <rect class="btn-invert control-btn" x="245" y="184" width="40" height="16" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="inv-text" x="265" y="195" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">INV</text>

          <rect class="btn-ch-en control-btn" x="245" y="206" width="40" height="16" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="ch-en-text" x="265" y="217" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">ON</text>
          <rect class="btn-run-stop control-btn" x="345" y="206" width="40" height="16" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="run-stop-text" x="365" y="217" font-size="8" font-weight="bold" fill="#10b981" text-anchor="middle" pointer-events="none">RUN</text>

          <text x="315" y="48" font-size="8" font-weight="bold" fill="#cbd5e1" text-anchor="middle">HORIZ</text>
          <text x="315" y="204" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">CURS</text>
          <rect class="btn-cursor control-btn" x="295" y="206" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="cursor-txt" x="315" y="216" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">OFF</text>
          
          <rect class="btn-autoset control-btn" x="245" y="228" width="40" height="14" rx="2" fill="#3b82f6" style="cursor:pointer;"/>
          <text class="autoset-txt" x="265" y="238" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">AUTO</text>

          <rect class="btn-print control-btn" x="295" y="228" width="40" height="14" rx="2" fill="#8b5cf6" style="cursor:pointer;"/>
          <text class="print-txt" x="315" y="238" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">IMG</text>

          <text x="315" y="60" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">T/DIV</text>
          <rect class="btn-tdiv-dn control-btn" x="295" y="64" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="315" y="74" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">◀</text>
          <rect class="btn-tdiv-up control-btn" x="295" y="80" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="315" y="90" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">▶</text>

          <text x="315" y="102" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">X-POS</text>
          <rect class="btn-xpos-dn control-btn" x="295" y="106" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="315" y="116" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">◀</text>
          <rect class="btn-xpos-up control-btn" x="295" y="122" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="315" y="132" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">▶</text>
          
          <text x="315" y="150" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">DISP</text>
          <rect class="btn-disp-mode control-btn" x="295" y="154" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="315" y="180" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">MEAS</text>
          <rect class="btn-meas control-btn" x="295" y="184" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="meas-txt" x="315" y="194" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">OFF</text>
          <text class="disp-mode-txt" x="315" y="164" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">Y-T</text>

          <text x="365" y="48" font-size="8" font-weight="bold" fill="#cbd5e1" text-anchor="middle">TRIGGER</text>

          <text x="365" y="60" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">MODE</text>
          <rect class="btn-trig-mode control-btn" x="345" y="64" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="trig-mode-txt" x="365" y="74" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">AUTO</text>

          <text x="365" y="86" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">SLOPE</text>
          <rect class="btn-trig-slope control-btn" x="345" y="90" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="trig-slope-txt" x="365" y="100" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">RISE ↑</text>

          <text x="365" y="112" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">LEVEL</text>
          <rect class="btn-trig-lvl-up control-btn" x="345" y="116" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="365" y="126" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">▲</text>
          <rect class="btn-trig-lvl-dn control-btn" x="345" y="132" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text x="365" y="142" font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">▼</text>

          <text x="365" y="154" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">TR CPL</text>
          <rect class="btn-trig-coupl control-btn" x="345" y="158" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="trig-coupl-txt" x="365" y="168" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">DC</text>

          <text x="365" y="180" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">SRC</text>
          <rect class="btn-trig-src control-btn" x="345" y="184" width="40" height="14" rx="2" fill="#475569" style="cursor:pointer;"/>
          <text class="trig-src-txt" x="365" y="194" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">CH1</text>

          <polygon class="ypos-ind-1" points="230,120 235,116 235,124" fill="#eab308"/>
          <polygon class="ypos-ind-2" points="230,120 235,116 235,124" fill="#06b6d4"/>
          <polygon class="xpos-indicator" points="130,40 126,35 134,35" fill="#eab308"/>
          <polygon class="lvl-indicator" points="230,120 225,116 225,124" fill="#a855f7"/>
        </svg>`;
        break;
      case 'motor_dc':
        svg = `<svg width="80" height="80" viewBox="0 0 80 80">
        <line class="pin-in-0" x1="0" y1="40" x2="20" y2="40" stroke="#006600" stroke-width="2"/>
        <line class="pin-out-0" x1="60" y1="40" x2="80" y2="40" stroke="#006600" stroke-width="2"/>
        
        <circle cx="40" cy="40" r="20" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
        
        <g class="anim-rotor" style="transform-origin: 40px 40px;">
            <circle cx="40" cy="40" r="14" fill="none" stroke="${pStroke}" stroke-width="1.5" stroke-dasharray="4 4"/>
            <line x1="40" y1="26" x2="40" y2="54" stroke="${pStroke}" stroke-width="1.5"/>
            <line x1="26" y1="40" x2="54" y2="40" stroke="${pStroke}" stroke-width="1.5"/>
            <circle cx="40" cy="40" r="4" fill="${pStroke}"/>
        </g>
        
        <!-- PERUBAHAN DI BARIS BAWAH INI: Menambahkan val-trigger agar bisa diklik -->
        <text x="40" y="16" class="val-trigger" text-anchor="middle" font-size="9" font-weight="bold" fill="#4f46e5" style="cursor:pointer; pointer-events:auto;">DC MOTOR</text>
        
        <text class="rpm-text" x="40" y="70" text-anchor="middle" font-size="10" font-weight="bold" fill="#0ea5e9">0 RPM</text>
    </svg>`;
    break;
      case 'servo':
        svg = `<svg width="80" height="80" viewBox="0 0 80 80">
          <line class="pin-in-0" x1="0" y1="20" x2="15" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="0" y1="40" x2="15" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-2" x1="0" y1="60" x2="15" y2="60" stroke="#006600" stroke-width="3"/>
          
          <rect class="anim-body" x="15" y="10" width="45" height="60" rx="4" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          
          <text x="18" y="24" class="comp-label" font-size="9">SIG</text>
          <text x="18" y="44" class="comp-label" font-size="9" fill="red">VCC</text>
          <text x="18" y="64" class="comp-label" font-size="9">GND</text>
          
          <circle cx="60" cy="40" r="12" fill="#fff" stroke="${pStroke}" stroke-width="3"/>
          
          <!-- 🟢 PERBAIKAN SVG: Menambahkan poros putaran langsung di CSS style -->
          <g class="anim-horn" style="transform-origin: 60px 40px;">
              <line x1="60" y1="40" x2="60" y2="15" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
          </g>
          <text class="anim-text comp-label" x="38" y="78" text-anchor="middle" font-weight="bold" fill="#d97706">0°</text>
        </svg>`; break;
      case 'solenoid':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="30" x2="15" y2="30" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="65" y1="30" x2="80" y2="30" stroke="#006600" stroke-width="3"/>
          <rect class="anim-body" x="15" y="15" width="40" height="30" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <path d="M 20 15 v 30 M 25 15 v 30 M 30 15 v 30 M 35 15 v 30 M 40 15 v 30" stroke="${pStroke}" stroke-width="1"/>
          
          <!-- 🟢 PERBAIKAN: Tipuan CSS 'transition' dihapus agar tunduk pada Hukum Newton -->
          <rect class="anim-plunger" x="55" y="25" width="20" height="10" fill="#64748b" stroke="${pStroke}" stroke-width="1"/>
          <text x="35" y="55" class="comp-label" text-anchor="middle">VALVE</text>
        </svg>`; break;
      case 'mosfet_n': case 'mosfet_p':
        svg = `<svg width="100" height="100" viewBox="0 0 100 100">
          <circle class="anim-body" cx="50" cy="50" r="32" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <line class="pin-in-0" x1="0" y1="50" x2="30" y2="50" stroke="#006600" stroke-width="3"/>
          <line x1="30" y1="30" x2="30" y2="70" stroke="${pStroke}" stroke-width="3"/>
          <line x1="38" y1="28" x2="38" y2="42" stroke="${pStroke}" stroke-width="3"/>
          <line x1="38" y1="46" x2="38" y2="54" stroke="${pStroke}" stroke-width="3"/>
          <line x1="38" y1="58" x2="38" y2="72" stroke="${pStroke}" stroke-width="3"/>
          <line class="pin-in-1" x1="50" y1="0" x2="50" y2="35" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="50" y1="35" x2="38" y2="35" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-1" x1="50" y1="100" x2="50" y2="65" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-2" x1="50" y1="65" x2="38" y2="65" stroke="#006600" stroke-width="3"/>
          <line x1="38" y1="50" x2="50" y2="50" stroke="${pStroke}" stroke-width="3"/>
          <line x1="50" y1="50" x2="50" y2="65" stroke="${pStroke}" stroke-width="3"/>
          ${type === 'mosfet_n' ? `<polygon points="46,46 38,50 46,54" fill="${pStroke}"/>` : `<polygon points="42,46 50,50 42,54" fill="${pStroke}"/>`}
          <text x="14" y="45" class="comp-label" font-weight="bold" font-size="14">G</text>
          <text x="56" y="20" class="comp-label" font-weight="bold" font-size="14">D</text>
          <text x="56" y="90" class="comp-label" font-weight="bold" font-size="14">S</text>
        </svg>`; break;
      case 'bjt_npn': case 'bjt_pnp':
        svg = `<svg width="80" height="80" viewBox="0 0 80 80">
          <circle class="anim-body" cx="40" cy="40" r="24" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <line class="pin-in-0" x1="0" y1="40" x2="25" y2="40" stroke="#006600" stroke-width="3"/>
          <line x1="25" y1="25" x2="25" y2="55" stroke="${pStroke}" stroke-width="3"/>
          <line class="pin-out-0" x1="25" y1="32" x2="40" y2="20" stroke="#006600" stroke-width="3"/>
          <line x1="40" y1="20" x2="40" y2="0" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="25" y1="48" x2="40" y2="60" stroke="#006600" stroke-width="3"/>
          <line x1="40" y1="60" x2="40" y2="80" stroke="#006600" stroke-width="3"/>
          ${type === 'bjt_npn' ? `<polygon points="34,50 40,60 28,58" fill="${pStroke}"/>` : `<polygon points="35,52 25,48 30,59" fill="${pStroke}"/>`}
          <text x="10" y="35" class="comp-label" font-weight="bold" font-size="12">B</text>
          <text x="46" y="14" class="comp-label" font-weight="bold" font-size="12">C</text>
          <text x="46" y="76" class="comp-label" font-weight="bold" font-size="12">E</text>
        </svg>`; break;  
      case 'opamp':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <polygon points="20,5 70,30 20,55" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <line class="pin-in-0" x1="0" y1="18" x2="20" y2="18" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="0" y1="42" x2="20" y2="42" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="70" y1="30" x2="80" y2="30" stroke="#006600" stroke-width="3"/>
          <text x="24" y="22" fill="${pStroke}" font-family="monospace" font-size="12" font-weight="bold">+</text>
          <text x="24" y="44" fill="${pStroke}" font-family="monospace" font-size="12" font-weight="bold">-</text>
          <text x="42" y="34" class="comp-label" font-size="9" font-weight="bold">741</text>
        </svg>`; break;
      case 'opamp_5pin':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
        <polygon points="20,5 60,30 20,55" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
        
        <!-- Kabel Input Sinyal -->
        <line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="2"/>
        <line class="pin-in-1" x1="0" y1="40" x2="20" y2="40" stroke="#006600" stroke-width="2"/>
        
        <!-- Kabel Power (V+ dan V-) -->
        <line class="pin-in-2" x1="40" y1="0" x2="40" y2="17" stroke="#006600" stroke-width="2"/>
        <line class="pin-in-3" x1="40" y1="60" x2="40" y2="43" stroke="#006600" stroke-width="2"/>
        
        <!-- Kabel Output -->
        <line class="pin-out-0" x1="60" y1="30" x2="80" y2="30" stroke="#006600" stroke-width="2"/>
        
        <!-- Label Pin -->
        <text x="25" y="24" font-size="12" font-weight="bold" fill="${pStroke}">+</text>
        <text x="25" y="44" font-size="14" font-weight="bold" fill="${pStroke}">-</text>
        <text x="50" y="14" font-size="9" font-weight="bold" fill="${pStroke}">V+</text>
        <text x="50" y="55" font-size="9" font-weight="bold" fill="${pStroke}">V-</text>
    </svg>`;
    break;  
      case 'and': case 'nand':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="20" x2="15" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="0" y1="40" x2="15" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="60" y1="30" x2="80" y2="30" stroke="#006600" stroke-width="3"/>
          <path d="M 15 10 L 40 10 A 20 20 0 0 1 40 50 L 15 50 Z" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          ${type === 'nand' ? `<circle cx="65" cy="30" r="4" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>` : ''}
          <text x="35" y="60" class="comp-label" text-anchor="middle">${type.toUpperCase()}</text>
        </svg>`; break;
      case 'or': case 'nor':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="20" x2="18" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="0" y1="40" x2="18" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="60" y1="30" x2="80" y2="30" stroke="#006600" stroke-width="3"/>
          <path d="M 15 10 Q 30 10 65 30 Q 30 50 15 50 Q 25 30 15 10 Z" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          ${type === 'nor' ? `<circle cx="68" cy="30" r="4" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>` : ''}
          <text x="35" y="60" class="comp-label" text-anchor="middle">${type.toUpperCase()}</text>
        </svg>`; break;
      case 'xor': case 'xnor':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="20" x2="12" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="0" y1="40" x2="12" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="60" y1="30" x2="80" y2="30" stroke="#006600" stroke-width="3"/>
          <path d="M 8 10 Q 18 30 8 50" fill="none" stroke="${pStroke}" stroke-width="${sw}"/>
          <path d="M 14 10 Q 29 10 65 30 Q 29 50 14 50 Q 24 30 14 10 Z" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          ${type === 'xnor' ? `<circle cx="68" cy="30" r="4" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>` : ''}
          <text x="35" y="60" class="comp-label" text-anchor="middle">${type.toUpperCase()}</text>
        </svg>`; break;
      case 'not':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="30" x2="20" y2="30" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="58" y1="30" x2="80" y2="30" stroke="#006600" stroke-width="3"/>
          <polygon points="20,15 50,30 20,45" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <circle cx="54" cy="30" r="4" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <text x="35" y="60" class="comp-label" text-anchor="middle">NOT</text>
        </svg>`; break;
      case 'junction':
        svg = `<svg width="60" height="60" viewBox="0 0 60 60">
          <line class="pin-in-0" x1="0" y1="30" x2="30" y2="30" stroke="#006600" stroke-width="4"/>
          <line class="pin-out-0" x1="30" y1="30" x2="60" y2="10" stroke="#006600" stroke-width="4"/>
          <line class="pin-out-1" x1="30" y1="30" x2="60" y2="30" stroke="#006600" stroke-width="4"/>
          <line class="pin-out-2" x1="30" y1="30" x2="60" y2="50" stroke="#006600" stroke-width="4"/>
          <circle cx="30" cy="30" r="4" fill="#000000"/>
        </svg>`; break;
      case 'wire_1to1':
        svg = `<svg width="60" height="40" viewBox="0 0 60 40">
          <line class="pin-in-0" x1="0" y1="20" x2="60" y2="20" stroke="#006600" stroke-width="4"/>
        </svg>`; break;
      case 'wire_1to2':
        svg = `<svg width="60" height="60" viewBox="0 0 60 60">
          <line class="pin-in-0" x1="0" y1="30" x2="30" y2="30" stroke="#006600" stroke-width="4"/>
          <line class="pin-out-0" x1="30" y1="15" x2="30" y2="45" stroke="#006600" stroke-width="4"/>
          <line class="pin-out-1" x1="30" y1="15" x2="60" y2="15" stroke="#006600" stroke-width="4"/>
          <line class="pin-out-2" x1="30" y1="45" x2="60" y2="45" stroke="#006600" stroke-width="4"/>
          <circle cx="30" cy="30" r="4" fill="#000000"/>
        </svg>`; break;
      default: 
        svg = `<div style="padding:10px;border:1px solid #000;">?</div>`;
    }
    
    contentDiv.innerHTML = svg;
  },

  updateDOMState(type, compData, contentDiv, id) {
    const isHigh = val => val > 2.5;
    const vState = compData.simV > 0;

    const setPin = (cls, isActive) => {
      const el = contentDiv.querySelector('.' + cls);
      if (el) el.classList.toggle('leg-active', isActive);
    };

    if (compData.inputStates) {
      if (compData.inputs > 0) setPin('pin-in-0', isHigh(compData.inputStates[0]));
      if (compData.inputs > 1) setPin('pin-in-1', isHigh(compData.inputStates[1]));
    }

    switch (type) {
      case 'switch': {
        const isClosed = compData.state === '1'; setPin('pin-out-0', isClosed);
        const body = contentDiv.querySelector('.anim-body'); const text = contentDiv.querySelector('.anim-text');
        if (body) body.setAttribute('fill', isClosed ? '#dc2626' : '#2563eb');
        if (text) text.textContent = compData.state || '0';
        break;
      }
      case 'push_button': {
        const isActive = compData.state === '1';
        const vState = typeof CircuitStore !== 'undefined' ? CircuitStore.isSimulationActive : false;
        
        setPin('pin-in-0', vState);
        setPin('pin-out-0', isActive && vState);
        
        const plunger = contentDiv.querySelector('.anim-plunger');
        const lockBtnCircle = contentDiv.querySelector('.lock-btn circle');
        
        // Turunkan mekanisme sakelar sebesar 4px agar menyentuh titik kontak
        if (plunger) {
          plunger.style.transform = isActive ? 'translateY(4px)' : 'translateY(0)';
        }
        
        // Ubah warna lingkaran merah menjadi gelap (merah tua) jika sedang posisi terkunci
        if (lockBtnCircle) {
           lockBtnCircle.setAttribute('fill', compData.locked ? '#7f1d1d' : '#ef4444');
        }
        break;
      }
      case 'switch_spst': {
        const isClosed = compData.state === '1'; setPin('pin-in-0', vState); setPin('pin-out-0', isClosed && vState);
        const line = contentDiv.querySelector('.anim-line'); const body = contentDiv.querySelector('.anim-body');
        if (line) { line.setAttribute('x2', isClosed ? '55' : '50'); line.setAttribute('y2', isClosed ? '20' : '10'); }
        if (body) body.setAttribute('fill', isClosed ? '#22c55e' : '#e2e8f0');
        break;
      }
      case 'logic_probe': {
        setPin('pin-in-0', vState);
        const body = contentDiv.querySelector('.anim-body');
        const text = contentDiv.querySelector('.anim-text');
        const state = compData.logicState || 'Z'; // Default adalah Z (Mengambang)
        
        if (text) {
            text.textContent = state;
            if (state === '1') text.setAttribute('fill', '#4ade80'); // Hijau Terang (High)
            else if (state === '0') text.setAttribute('fill', '#f87171'); // Merah Terang (Low)
            else if (state === 'E') text.setAttribute('fill', '#fbbf24'); // Kuning/Error (Konslet)
            else text.setAttribute('fill', '#94a3b8'); // Abu-abu (High-Z)
        }
        if (body) {
            if (state === '1') body.setAttribute('stroke', '#4ade80');
            else if (state === '0') body.setAttribute('stroke', '#f87171');
            else body.setAttribute('stroke', '#475569');
        }
        break;
      }
      case 'clock_pulse': {
        const isHigh = compData.state === '1';
        setPin('pin-out-0', isHigh && vState);
        const ind = contentDiv.querySelector('.anim-indicator');
        if (ind) ind.setAttribute('fill', (isHigh && vState) ? '#22c55e' : '#475569');
        break;
      }
      case 'flasher': {
  const isOn = compData.state === '1';
  setPin('pin-in-0', vState); setPin('pin-out-0', isOn && vState);
  const ind = contentDiv.querySelector('.anim-indicator');
  if (ind) ind.setAttribute('fill', (isOn && vState) ? '#facc15' : '#475569');
  const speedTxt = contentDiv.querySelector('.speed-val');
  if (speedTxt) {
    const periodMs = compData.customValue || 500;
    speedTxt.textContent = (1000 / periodMs / 2).toFixed(1) + 'Hz'; // 1 siklus = 2x toggle
  }
  break;
}
      case 'battery': case 'battery_1cell': case 'battery_multi': case 'power_terminal': {
        setPin('pin-out-0', vState || (typeof CircuitStore !== 'undefined' && CircuitStore.isSimulationActive)); 
        setPin('pin-out-1', false); 
        const txtValB = contentDiv.querySelector('.anim-text');
        if (txtValB) {
           let v = compData.customValue;
           if (v == null) v = type === 'battery_1cell' ? 1.5 : 12;
           txtValB.textContent = v + 'V';
        }
        break; }
        case 'vsine': {
  setPin('pin-out-0', compData.simV > 0.5);
  const ampTxt = contentDiv.querySelector('.amp-val');
  if (ampTxt) ampTxt.textContent = `${compData.customValue || 12}Vp`;
  const freqTxt = contentDiv.querySelector('.freq-val');
  if (freqTxt) freqTxt.textContent = `${compData.freqValue || 1}Hz`;
  break;
}
      case 'output_terminal': {
        setPin('pin-in-0', vState);
        const text = contentDiv.querySelector('.anim-text');
        if (text) text.textContent = (compData.simV || 0).toFixed(1) + 'V';
        break;
      }
      case 'ff_sr': case 'ff_d': case 'ff_jk': case 'ff_t': {
        const qActive = compData.outputState === 1;
        setPin('pin-out-0', qActive);
        setPin('pin-out-1', !qActive); 
        
        // Membaca sinyal untuk menyalakan warna hijau pada pin input 
        if (compData.inputStates) {
           setPin('pin-in-0', compData.inputStates[0] > 2.5);
           setPin('pin-in-1', compData.inputStates[1] > 2.5);
           if (compData.inputs > 2) setPin('pin-in-2', compData.inputStates[2] > 2.5);
           if (compData.inputs > 3) setPin('pin-in-3', compData.inputStates[3] > 2.5);
           if (compData.inputs > 4) setPin('pin-in-4', compData.inputStates[4] > 2.5);
        }
        
        const body = contentDiv.querySelector('.anim-body');
        if (body) body.setAttribute('fill', qActive ? '#dcfce7' : '#e8e6d3');
        break;
      }
      case 'fuse': {
        const isBlown = compData.state === 'blown'; setPin('pin-in-0', vState); setPin('pin-out-0', !isBlown && vState);
        const body = contentDiv.querySelector('.anim-body'); const line = contentDiv.querySelector('.anim-line');
        const txtBlown = contentDiv.querySelector('.anim-blown'); const txtVal = contentDiv.querySelector('.anim-text');
        if (body) body.setAttribute('fill', isBlown ? '#fee2e2' : '#e8e6d3');
        if (line) line.style.display = isBlown ? 'none' : 'block';
        if (txtBlown) txtBlown.style.display = isBlown ? 'block' : 'none';
        if (txtVal) txtVal.textContent = (compData.customValue ?? 10) + 'A'; // 🟢 FIX BUG #6: ?? bukan ||
        break;
      }
      case 'led': {
        const current = Math.abs(compData.simI || 0); // Arus aktual (Ampere)
        const voltage = Math.abs(compData.simV || 0);
        
        // Baca pengaturan dari memori, atau gunakan default
        const fV = parseFloat(compData.forwardV) || 2.2;
        // Ubah dari satuan mA (MiliAmpere) ke Ampere (dibagi 1000)
        const fullDriveAmpere = (parseFloat(compData.fullDriveI) || 10) / 1000; 
        
        let intensity = 0;
        if (voltage >= fV) {
            // Intensitas 100% akan tercapai tepat jika arus mencapai Full Drive Current!
            intensity = current / fullDriveAmpere;
            if (intensity > 1) intensity = 1; // Maksimal terang 100%
        }
        
        const isOn = intensity > 0.005; 
        
        setPin('pin-in-0', compData.simV > 0); 
        setPin('pin-out-0', isOn);
        
        const body = contentDiv.querySelector('.anim-body'); 
        const svg = contentDiv.querySelector('.anim-svg');

        if (body) {
           // Campuran warna RGB dinamis berdasarkan intensitas arus!
           // Saat arus kecil, warnanya Merah Gelap. Semakin besar arus, semakin Merah Terang.
           const r = Math.round(56 + (intensity * 183)); // 56 ke 239 (#ef)
           const g = Math.round(0 + (intensity * 68));   // 0 ke 68 (#44)
           const b = Math.round(0 + (intensity * 68));   // 0 ke 68 (#44)
           body.setAttribute('fill', isOn ? `rgb(${r}, ${g}, ${b})` : '#380000');
        }
        
        if (svg) {
          if (isOn) {
            const blur = 2 + (intensity * 15);         // Radius pendaran melebar sesuai arus
            const glowAlpha = 0.05 + (intensity * 0.95); // Transparansi cahaya memudar mulus hingga 0
            svg.style.filter = `drop-shadow(0 0 ${blur}px rgba(255, 0, 0, ${glowAlpha}))`;
            svg.style.opacity = 1 + (intensity * 0.7); 
          } else {
            svg.style.filter = 'none';
            svg.style.opacity = 1; 
          }
        }
        break;
      }
      case 'diode':
      case 'resistor': {
        setPin('pin-in-0', vState); setPin('pin-out-0', vState);
        if (type === 'resistor') {
          const txtVal = contentDiv.querySelector('.anim-text');
          if (txtVal) {
            const rv = compData.customValue ?? 330; // 🟢 FIX BUG #6: ?? bukan || (0 tidak lagi ketiban default)
            txtVal.textContent = rv >= 1000000 ? `${(rv/1e6).toFixed(1)}M` : rv >= 1000 ? `${(rv/1000).toFixed(1)}k` : `${rv}Ω`;
          }
        }
        break;
      }
      case 'voltage_divider': {
        // Ambil nilai V1 dan V2 yang dihitung oleh mesin fisika
        let v1 = compData.v1 || 0; 
        let v2 = compData.v2 || 0; 
        
        // Animasi warna kabel saat ada arus
        setPin('pin-in-0', v1 > 0 || v2 > 0);
        setPin('pin-out-0', v2 > 0);
        
        const r1Txt = contentDiv.querySelector('.r1-label');
        const r2Txt = contentDiv.querySelector('.r2-label');
        const v1Txt = contentDiv.querySelector('.v1-label');
        const v2Txt = contentDiv.querySelector('.v2-label');
        
        // Format angka (contoh: 10000 -> 10k)
        let formatR = (val) => val >= 1000000 ? (val/1000000) + 'M' : (val >= 1000 ? (val/1000) + 'k' : val);
        
        if (r1Txt) r1Txt.textContent = `R1: ${formatR(compData.r1Value || 10000)}Ω`;
        if (r2Txt) r2Txt.textContent = `R2: ${formatR(compData.r2Value || 10000)}Ω`;
        
        // Tampilkan tegangan
        if (v1Txt) v1Txt.textContent = `V1: ${v1.toFixed(2)}V`;
        if (v2Txt) v2Txt.textContent = `V2: ${v2.toFixed(2)}V`;
        break;
      }
      case 'voltmeter': {
        setPin('pin-in-0', false); setPin('pin-in-1', false);
        let displayVolt = compData.displayVolt !== undefined ? compData.displayVolt : (compData.simV || 0);
        
        const text = contentDiv.querySelector('.anim-text');
        const rangeTxt = contentDiv.querySelector('.range-txt');
        
        if (compData.isMilli) {
            if (text) text.textContent = (displayVolt * 1000).toFixed(0) + 'mV';
            if (rangeTxt) { rangeTxt.textContent = 'mV'; rangeTxt.setAttribute('fill', '#eab308'); } // Berubah jadi kuning
        } else {
            if (text) text.textContent = displayVolt.toFixed(1) + 'V';
            if (rangeTxt) { rangeTxt.textContent = 'V'; rangeTxt.setAttribute('fill', '#ffffff'); }
        }
        break;
      }
      
      case 'ammeter': {
        setPin('pin-in-0', vState); setPin('pin-out-0', vState);
        let iVal = Math.abs(compData.simI || 0);
        
        const text = contentDiv.querySelector('.anim-text');
        const rangeTxt = contentDiv.querySelector('.range-txt');
        
        if (compData.isMilli) {
            if (text) text.textContent = (iVal * 1000).toFixed(0) + 'mA';
            if (rangeTxt) { rangeTxt.textContent = 'mA'; rangeTxt.setAttribute('fill', '#eab308'); }
        } else {
            if (text) text.textContent = iVal.toFixed(2) + 'A';
            if (rangeTxt) { rangeTxt.textContent = 'A'; rangeTxt.setAttribute('fill', '#ffffff'); }
        }
        break;
      }
      case 'ldr': {
        setPin('pin-in-0', vState); setPin('pin-out-0', vState);
        const text = contentDiv.querySelector('.anim-text');
        if (text) text.textContent = (compData.state || '50') + '% Lux';
        break;
      }
      case 'thermistor_ntc':
      case 'thermistor_ptc': {
        setPin('pin-in-0', vState); setPin('pin-out-0', vState);
        const text = contentDiv.querySelector('.anim-text');
        if (text) text.textContent = (compData.state || '50') + '°C';
        break;
      }
      case 'potentiometer': {
        setPin('pin-in-0', vState); setPin('pin-in-1', vState); setPin('pin-out-0', vState);
        const text = contentDiv.querySelector('.anim-text');
        if (text) text.textContent = (compData.state || '50') + '%';
        const valText = contentDiv.querySelector('.val-text');
        if (valText) {
            let val = compData.customValue || 10000;
            let displayVal = val >= 1000000 ? (val/1000000) + 'M' : (val >= 1000 ? (val/1000) + 'k' : val);
            valText.textContent = displayVal + 'Ω';
        }
        break;
      }
      case 'oscilloscope': {
        const realComp = (typeof CircuitStore !== 'undefined' ? CircuitStore.components.find(c => c.id === id) : null) || compData;
        if (realComp.measActive === undefined) realComp.measActive = false; // Status OSD Measurement
        // 🟢 MIGRASI & INISIALISASI DUAL CHANNEL
        if (!realComp.ch1) {
            realComp.ch1 = { vDivIndex: realComp.vDivIndex||0, yPosition: realComp.yPosition||0, invert: realComp.invert||false, coupl: 0, dcOffset: 0 };
            realComp.ch2 = { vDivIndex: 0, yPosition: 0, invert: false, coupl: 0, dcOffset: 0 };
            realComp.activeCh = 1; 
            realComp.history1 = realComp.oscHistory || new Array(3000).fill(0);
            realComp.history2 = new Array(3000).fill(0);
        }
        // 🟢 FIX: Status ON/OFF Channel
        if (realComp.ch1.enabled === undefined) realComp.ch1.enabled = true;
        if (realComp.ch2.enabled === undefined) realComp.ch2.enabled = true;
        if (realComp.isRun === undefined) realComp.isRun = true; // Status RUN/STOP mandiri

        if (realComp.xPosition === undefined) realComp.xPosition = 0; 
        if (realComp.tDivIndex === undefined) realComp.tDivIndex = 3; 
        if (realComp.dispMode === undefined) realComp.dispMode = 0; // 0: Y-T, 1: X-Y
        if (realComp.trigMode === undefined) realComp.trigMode = 0; 
        if (realComp.trigSource === undefined) realComp.trigSource = 0; 
        if (realComp.trigLevel === undefined) realComp.trigLevel = 0; 
        if (realComp.trigState === undefined) realComp.trigState = 'RUN'; 
        if (realComp.trigSlope === undefined) realComp.trigSlope = 0; 
        if (realComp.trigCoupl === undefined) realComp.trigCoupl = 0; 
        
        if (realComp.lastTrigV === undefined) realComp.lastTrigV = 0;
        if (realComp.trigDcOffset === undefined) realComp.trigDcOffset = 0; 
        if (realComp.trigLowPass === undefined) realComp.trigLowPass = 0; 
        if (realComp.drawCountdown === undefined) realComp.drawCountdown = 0; 
        if (realComp.capturedTDiv === undefined) realComp.capturedTDiv = realComp.tDivIndex;

        // 🟢 MEMORI POSISI KURSOR (Satuan Piksel Layar)
        if (realComp.cursorActive === undefined) realComp.cursorActive = false; 
        if (realComp.curV1Y === undefined) realComp.curV1Y = 80;  // Garis Horizontal 1
        if (realComp.curV2Y === undefined) realComp.curV2Y = 160; // Garis Horizontal 2
        if (realComp.curT1X === undefined) realComp.curT1X = 80;  // Garis Vertikal 1
        if (realComp.curT2X === undefined) realComp.curT2X = 180; // Garis Vertikal 2
        
        const vDivScale = [5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01]; 
        const tDivScale = [1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001, 0.0005, 0.0002, 0.0001, 0.00005, 0.00002, 0.00001];
        
        // 🟢 INPUT COUPLING: Memfilter DC/AC/GND untuk masing-masing Channel
        let rawV1 = compData.simV || 0;
        let rawV2 = compData.simV2 || 0;
        
        realComp.ch1.dcOffset = (realComp.ch1.dcOffset * 0.99) + (rawV1 * 0.01);
        realComp.ch2.dcOffset = (realComp.ch2.dcOffset * 0.99) + (rawV2 * 0.01);

        let v1 = rawV1;
        if (realComp.ch1.coupl === 1) v1 -= realComp.ch1.dcOffset; else if (realComp.ch1.coupl === 2) v1 = 0;
        
        let v2 = rawV2;
        if (realComp.ch2.coupl === 1) v2 -= realComp.ch2.dcOffset; else if (realComp.ch2.coupl === 2) v2 = 0;
        
        // Pilih Sumber Tegangan Asli untuk Trigger
        let rawTrigSrc = (realComp.trigSource === 0) ? rawV1 : rawV2;

        // TRIGGER COUPLING
        realComp.trigDcOffset = (realComp.trigDcOffset * 0.99) + (rawTrigSrc * 0.01);
        realComp.trigLowPass = (realComp.trigLowPass * 0.7) + (rawTrigSrc * 0.3);
        
        let trigV = rawTrigSrc; 
        if (realComp.trigCoupl === 1) trigV = rawTrigSrc - realComp.trigDcOffset; 
        else if (realComp.trigCoupl === 2) trigV = realComp.trigLowPass; 
        else if (realComp.trigCoupl === 3) trigV = rawTrigSrc - realComp.trigLowPass; 

        // TRIGGER EDGE
        let isTriggered = false;
        if (realComp.trigSlope === 0) {
            if (realComp.lastTrigV < realComp.trigLevel && trigV >= realComp.trigLevel) isTriggered = true;
        } else {
            if (realComp.lastTrigV > realComp.trigLevel && trigV <= realComp.trigLevel) isTriggered = true;
        }
        
        let shouldRecord = false;
        if (realComp.dispMode === 2) {
            // 🟢 ROLL MODE: Abaikan trigger, rekam terus menerus agar gelombang mengalir
            shouldRecord = true; 
            realComp.trigState = 'ROLL';
        } else if (realComp.trigMode === 0) { // AUTO
            shouldRecord = true; 
            realComp.trigState = 'RUN';
        } else if (realComp.trigMode === 1) { // NORM
            if (realComp.trigState === 'WAIT' && isTriggered) { realComp.drawCountdown = 200; realComp.trigState = 'RUN'; }
            shouldRecord = (realComp.trigState === 'RUN' && realComp.drawCountdown > 0);
            if (realComp.trigState === 'RUN' && realComp.drawCountdown <= 0) realComp.trigState = 'WAIT';
        } else if (realComp.trigMode === 2) { // SING
            if (realComp.trigState === 'WAIT' && isTriggered) { realComp.drawCountdown = 200; realComp.trigState = 'RUN'; }
            shouldRecord = (realComp.trigState === 'RUN' && realComp.drawCountdown > 0);
            if (realComp.trigState === 'RUN' && realComp.drawCountdown <= 0) realComp.trigState = 'STOP'; // 🟢 SING: Bekukan saat selesai!
        }
        realComp.lastTrigV = trigV; 
        
        // Perekaman Memori Ganda (Dual Record)
        let tPerDiv = tDivScale[realComp.tDivIndex];
        let sampleDelay = (tPerDiv * 10 * 1000) / 200; 
        const now = Date.now();
        if (!realComp.lastOscUpdate) realComp.lastOscUpdate = now;
        
        // 🟢 FIX: Blokir penambahan data sejarah jika simulasi sedang berhenti (Pause)!
        let isSimActive = typeof CircuitStore !== 'undefined' ? CircuitStore.isSimulationActive : true;
        if (isSimActive && realComp.isRun) {
            realComp.capturedTDiv = realComp.tDivIndex;
            let elapsed = now - realComp.lastOscUpdate;
            if (elapsed >= sampleDelay) {
                let steps = Math.floor(elapsed / sampleDelay);
                if (steps > 300) steps = 300; 
                for(let i=0; i<steps; i++) {
                    if (shouldRecord) {
                        realComp.history1.shift(); realComp.history1.push(v1);
                        realComp.history2.shift(); realComp.history2.push(v2);
                        // Perbaikan diam-diam: Jangan kurangi countdown jika sedang di mode ROLL (dispMode === 2)
                        if (realComp.trigMode !== 0 && realComp.dispMode !== 2) {
                            realComp.drawCountdown--;
                            if (realComp.drawCountdown <= 0) shouldRecord = false; 
                        }
                    }
                }
                realComp.lastOscUpdate = now - (elapsed % sampleDelay);
            }
        } else {
            // Selalu perbarui jam internal saat Pause.
            // Ini mencegah osiloskop menggambar garis lurus jika pengguna memencet tombol panel.
            realComp.lastOscUpdate = now;
        }
        // EVENT LISTENER
        const trace1 = contentDiv.querySelector('.osc-trace-ch1');
        const trace2 = contentDiv.querySelector('.osc-trace-ch2');
        if (!contentDiv.dataset.oscListener) {
            contentDiv.dataset.oscListener = 'true';
            
            const bindBtn = (cls, action) => {
                const btn = contentDiv.querySelector(cls);
                if (!btn) return;
                const handleInteract = (e) => {
                    e.stopPropagation(); e.preventDefault(); 
                    const currentComp = typeof CircuitStore !== 'undefined' ? CircuitStore.components.find(c => c.id === id) : null;
                    if (!currentComp) return;
                    action(currentComp); 
                    ComponentDefs.updateDOMState(type, currentComp, contentDiv, id); 
                    if (typeof HistoryManager !== 'undefined') HistoryManager.saveStateToUndoStack('Ubah Osiloskop');
                };
                btn.addEventListener('mousedown', handleInteract);
                btn.addEventListener('touchstart', handleInteract, {passive: false});
            };

            // Tombol Toggle Measurement
            bindBtn('.btn-meas', (c) => { c.measActive = !c.measActive; });

            // Tombol RUN / STOP Layar Osiloskop
            bindBtn('.btn-run-stop', (c) => { c.isRun = !c.isRun; });
            // Tombol ON/OFF Channel
            bindBtn('.btn-ch-en', (c) => { let ch = c.activeCh === 1 ? c.ch1 : c.ch2; ch.enabled = !ch.enabled; });

            // Tombol Toggle Cursor
            bindBtn('.btn-cursor', (c) => { c.cursorActive = !c.cursorActive; });

            // 🟢 FUNGSI AUTO-SET (Menyesuaikan Skala V/DIV, T/DIV, dan Posisi secara Otomatis)
            bindBtn('.btn-autoset', (c) => {
                let chInfo = c.activeCh === 1 ? c.ch1 : c.ch2;
                let hist = c.activeCh === 1 ? c.history1 : c.history2;
                
                // 1. Pindai 1000 titik memori terakhir untuk mencari Tegangan Maks & Min
                let vMax = -Infinity, vMin = Infinity;
                for(let i = 2000; i < 3000; i++) {
                    let v = hist[i];
                    if (v > vMax) vMax = v;
                    if (v < vMin) vMin = v;
                }
                if (vMax === -Infinity || vMax === vMin) { vMax = 1; vMin = -1; } // Pengaman jika kosong
                
                let vPp = vMax - vMin;
                let vMid = (vMax + vMin) / 2;

                // 2. Pusatkan Posisi (Y-POS) & Trigger Level ke tengah gelombang
                chInfo.yPosition = 0;
                c.trigLevel = vMid;

                // 3. Hitung Skala Voltase (V/DIV) yang Pas
                // Kita ingin tinggi gelombang memenuhi sekitar 4 hingga 5 kotak (Div)
                let targetVDiv = vPp / 4;
                let bestVIndex = 0;
                for (let i = 0; i < vDivScale.length; i++) {
                    if (vDivScale[i] >= targetVDiv) bestVIndex = i;
                }
                chInfo.vDivIndex = bestVIndex;

                // 4. Hitung Skala Waktu (T/DIV) yang Pas berdasarkan Frekuensi
                let edges = [], isH = hist[2000] > vMid;
                for(let i = 2001; i < 3000; i++) {
                    let currentH = hist[i] > vMid;
                    if (currentH !== isH) { edges.push({ type: currentH ? 'rise' : 'fall', idx: i }); isH = currentH; }
                }
                let validPeriods = [];
                for(let i = 0; i < edges.length; i++) {
                    if (edges[i].type === 'rise') {
                        let nextRise = edges.find((e, idx) => idx > i && e.type === 'rise');
                        if (nextRise) validPeriods.push(nextRise.idx - edges[i].idx);
                    }
                }
                
                if (validPeriods.length > 0) {
                    let avgPeriodPoints = validPeriods.reduce((a,b)=>a+b) / validPeriods.length;
                    // Kita ingin sekitar 2-3 bukit gelombang tampil di layar (lebar layar = 200 titik)
                    let currentTPerDiv = tDivScale[c.tDivIndex];
                    let targetTPerDiv = currentTPerDiv * (avgPeriodPoints / 80); // Target = 80 titik per periode
                    
                    let bestTIndex = 0, minDiff = Infinity;
                    for (let i = 0; i < tDivScale.length; i++) {
                        let diff = Math.abs(tDivScale[i] - targetTPerDiv);
                        if (diff < minDiff) { minDiff = diff; bestTIndex = i; }
                    }
                    c.tDivIndex = bestTIndex;
                }

                // 5. Kembalikan Osiloskop ke Mode Normal
                c.xPosition = 0;
                c.dispMode = 0; 
                c.trigMode = 0; // Set ke AUTO Trigger
                c.isRun = true; 
            });

            // 🟢 FUNGSI SCREENSHOT (Export Grafik ke PNG)
            bindBtn('.btn-print', (c) => {
                let svgEl = contentDiv.querySelector('svg');
                if (!svgEl) return;
                
                // Buat kilatan putih visual agar terasa seperti difoto kamera
                let screenBg = contentDiv.querySelector('rect[fill="#0f172a"]'); 
                if (screenBg) {
                    let oldFill = screenBg.getAttribute('fill');
                    screenBg.setAttribute('fill', '#ffffff');
                    setTimeout(() => screenBg.setAttribute('fill', oldFill), 150);
                }

                // Kloning SVG agar tidak merusak versi aslinya
                let clone = svgEl.cloneNode(true);
                let w = clone.getAttribute('width') || 400;
                let h = clone.getAttribute('height') || 260;
                clone.setAttribute('width', w);
                clone.setAttribute('height', h);
                
                // Serialisasi SVG ke string XML
                let svgData = new XMLSerializer().serializeToString(clone);
                if(!svgData.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
                    svgData = svgData.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
                }
                
                // Gunakan Canvas tersembunyi untuk merender SVG menjadi resolusi tinggi (2x Retina)
                let canvas = document.createElement("canvas");
                canvas.width = w * 2; 
                canvas.height = h * 2;
                let ctx = canvas.getContext("2d");
                ctx.scale(2, 2);
                
                // Gambar latar belakang abu-abu gelap agar tidak transparan
                ctx.fillStyle = '#1e293b'; 
                ctx.fillRect(0, 0, w, h);
                
                let img = new Image();
                let blob = new Blob([svgData], {type: "image/svg+xml;charset=utf-8"});
                let url = URL.createObjectURL(blob);
                
                img.onload = function () {
                    ctx.drawImage(img, 0, 0);
                    let png = canvas.toDataURL("image/png");
                    // Trigger download paksa
                    let a = document.createElement("a");
                    a.download = `DSO_Capture_${new Date().getTime()}.png`;
                    a.href = png;
                    a.click();
                    URL.revokeObjectURL(url);
                };
                img.src = url;
            });
            
            // 🟢 FUNGSI DRAG & DROP KURSOR (Mendukung Hitbox Tebal & Perekam Mode)
            const setupCursorDrag = (hitCls, visualCls, axis, prop, mode) => {
                const hitLine = contentDiv.querySelector(hitCls);
                if (!hitLine) return;
                
                const startDrag = (e) => {
                    const currentComp = typeof CircuitStore !== 'undefined' ? CircuitStore.components.find(c => c.id === id) : null;
                    if (!currentComp || !currentComp.cursorActive) return;
                    e.preventDefault(); e.stopPropagation();
                    
                    // 🟢 OTAK SMART-OSD: Ingat apakah pengguna terakhir kali memegang kursor Voltase (V) atau Waktu (T)
                    currentComp.lastCursorMode = mode; 
                    
                    let startPos = axis === 'y' ? (e.touches ? e.touches[0].clientY : e.clientY) : (e.touches ? e.touches[0].clientX : e.clientX);
                    let startVal = currentComp[prop];

                    const onMove = (moveEvent) => {
                        let currentPos = axis === 'y' ? (moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY) : (moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX);
                        let zoomLevel = typeof UIManager !== 'undefined' ? UIManager.currentZoom : 1;
                        let delta = (currentPos - startPos) / zoomLevel;
                        
                        let newVal = startVal + delta;
                        if (axis === 'y') newVal = Math.max(40, Math.min(200, newVal));
                        if (axis === 'x') newVal = Math.max(30, Math.min(230, newVal));
                        
                        currentComp[prop] = newVal;
                        
                        // Perbarui Hitbox Transparan DAN Visual Garis Tipis secara bersamaan
                        let hL = contentDiv.querySelector(hitCls);
                        let vL = contentDiv.querySelector(visualCls);
                        if (hL && vL) {
                            if (axis === 'y') { hL.setAttribute('y1', newVal); hL.setAttribute('y2', newVal); vL.setAttribute('y1', newVal); vL.setAttribute('y2', newVal); }
                            else { hL.setAttribute('x1', newVal); hL.setAttribute('x2', newVal); vL.setAttribute('x1', newVal); vL.setAttribute('x2', newVal); }
                        }
                    };
                    
                    const onEnd = () => {
                        document.removeEventListener('mousemove', onMove); document.removeEventListener('touchmove', onMove);
                        document.removeEventListener('mouseup', onEnd); document.removeEventListener('touchend', onEnd);
                    };
                    
                    document.addEventListener('mousemove', onMove); document.addEventListener('touchmove', onMove, {passive: false});
                    document.addEventListener('mouseup', onEnd); document.addEventListener('touchend', onEnd);
                };
                
                hitLine.addEventListener('mousedown', startDrag);
                hitLine.addEventListener('touchstart', startDrag, {passive: false});
            };

            // Pasang fungsi drag: (Class Hitbox, Class Visual, Sumbu, NamaVariabel, Mode Kalkulator)
            setupCursorDrag('.cur-v1-hit', '.cur-v1', 'y', 'curV1Y', 'V');
            setupCursorDrag('.cur-v2-hit', '.cur-v2', 'y', 'curV2Y', 'V');
            setupCursorDrag('.cur-t1-hit', '.cur-t1', 'x', 'curT1X', 'T');
            setupCursorDrag('.cur-t2-hit', '.cur-t2', 'x', 'curT2X', 'T');

            // Tombol Channel Specific
            bindBtn('.btn-ch-sel', (c) => { c.activeCh = c.activeCh === 1 ? 2 : 1; });
            bindBtn('.btn-vdiv-up', (c) => { let ch = c.activeCh === 1 ? c.ch1 : c.ch2; if (ch.vDivIndex > 0) ch.vDivIndex--; });
            bindBtn('.btn-vdiv-dn', (c) => { let ch = c.activeCh === 1 ? c.ch1 : c.ch2; if (ch.vDivIndex < vDivScale.length - 1) ch.vDivIndex++; });
            bindBtn('.btn-ypos-up', (c) => { let ch = c.activeCh === 1 ? c.ch1 : c.ch2; ch.yPosition += 0.5; });
            bindBtn('.btn-ypos-dn', (c) => { let ch = c.activeCh === 1 ? c.ch1 : c.ch2; ch.yPosition -= 0.5; });
            bindBtn('.btn-invert', (c) => { let ch = c.activeCh === 1 ? c.ch1 : c.ch2; ch.invert = !ch.invert; });
            bindBtn('.btn-ch-coupl', (c) => { let ch = c.activeCh === 1 ? c.ch1 : c.ch2; ch.coupl = (ch.coupl + 1) % 3; });
            
            // Tombol Horizontal
            bindBtn('.btn-tdiv-dn', (c) => { if (c.tDivIndex > 0) c.tDivIndex--; });
            bindBtn('.btn-tdiv-up', (c) => { if (c.tDivIndex < tDivScale.length - 1) c.tDivIndex++; });
            bindBtn('.btn-xpos-dn', (c) => { if (c.xPosition > -10) c.xPosition -= 0.5; }); 
            bindBtn('.btn-xpos-up', (c) => { if (c.xPosition < 10) c.xPosition += 0.5; });  
            
            // Tombol DISP sekarang memiliki 3 mode (Y-T, X-Y, ROLL)
            bindBtn('.btn-disp-mode', (c) => { c.dispMode = (c.dispMode + 1) % 3; });

            // Tombol Trigger
            bindBtn('.btn-trig-mode', (c) => { 
                if (c.trigMode === 2 && c.trigState === 'STOP') {
                    c.trigState = 'WAIT'; // Putar ulang Single Sweep agar siap menangkap lagi!
                } else {
                    c.trigMode = (c.trigMode + 1) % 3; 
                    if (c.trigMode === 2) c.trigState = 'WAIT'; 
                }
            });
            bindBtn('.btn-trig-slope', (c) => { c.trigSlope = c.trigSlope === 0 ? 1 : 0; });
            bindBtn('.btn-trig-coupl', (c) => { c.trigCoupl = (c.trigCoupl + 1) % 4; });
            bindBtn('.btn-trig-src', (c) => { c.trigSource = (c.trigSource + 1) % 2; }); // Hanya CH1 (0) atau CH2 (1)
            
            bindBtn('.btn-trig-lvl-up', (c) => { 
                let step = vDivScale[(c.trigSource === 0 ? c.ch1 : c.ch2).vDivIndex] * 0.2;
                c.trigLevel += step; 
            });
            bindBtn('.btn-trig-lvl-dn', (c) => { 
                let step = vDivScale[(c.trigSource === 0 ? c.ch1 : c.ch2).vDivIndex] * 0.2;
                c.trigLevel -= step; 
            });
        }
        
        // RENDERING DUAL TRACE & X-Y MODE
        const traceXY = contentDiv.querySelector('.osc-trace-xy');
        if (trace1 && trace2) {
           let xPixelOffset = realComp.xPosition * 20; 
           let startIdx = 2800 - xPixelOffset; 
           startIdx = Math.max(0, Math.min(2800, startIdx)); 
           
           let p1 = "", p2 = "", pXY = "";
           let scaleMax1 = vDivScale[realComp.ch1.vDivIndex] * 4;
           let scaleMax2 = vDivScale[realComp.ch2.vDivIndex] * 4;
           let yPx1 = realComp.ch1.yPosition * 20;
           let yPx2 = realComp.ch2.yPosition * 20;
           let inv1 = realComp.ch1.invert ? -1 : 1;
           let inv2 = realComp.ch2.invert ? -1 : 1;

           // 🟢 FITUR ZOOM WAKTU (TIME STRETCHING) SAAT PAUSE
           let tScaleRatio = 1.0;
           if ((!isSimActive || !realComp.isRun) && realComp.capturedTDiv !== undefined) {
               tScaleRatio = tDivScale[realComp.tDivIndex] / tDivScale[realComp.capturedTDiv];
           }

           // 🟢 FIX 2: Jadikan KANAN LAYAR (Waktu Sekarang) sebagai Titik Jangkar
           // Agar saat Zoom Out, osiloskop menarik riwayat memori masa lalu dari kiri,
           // dan menolak menarik "garis lurus masa depan" dari arah kanan.
           let anchorI = 199;
           let anchorIdx = startIdx + anchorI;

           // Buat Layar Virtual (Buffer)
           let screenBuf1 = new Array(200);
           let screenBuf2 = new Array(200);
           for(let i=0; i<200; i++) {
               let offset = i - anchorI; // Bergerak ke masa lalu (negatif)
               let exactIdx = anchorIdx + (offset * tScaleRatio);
               
               // Cegah error keluar batas memori (clamp)
               let idx = Math.max(0, Math.min(2999, Math.floor(exactIdx)));
               screenBuf1[i] = realComp.history1[idx];
               screenBuf2[i] = realComp.history2[idx];
           }

           // 🔀 PERCABANGAN LOGIKA MATEMATIKA
           if (realComp.dispMode === 0 || realComp.dispMode === 2) {
               // --- MODE Y-T & ROLL ---
               for(let i=0; i < 200; i++) {
                  let px = 30 + i; 
                  let py1 = 120 - (((screenBuf1[i] * inv1) / scaleMax1) * 80) - yPx1;
                  let py2 = 120 - (((screenBuf2[i] * inv2) / scaleMax2) * 80) - yPx2;
                  p1 += `${px},${py1} `; p2 += `${px},${py2} `;
               }
           } else if (realComp.dispMode === 1) {
               // --- MODE X-Y (Lissajous) ---
               let xyAnchorI = 399; // Titik paling akhir dari 400 sampel
               let xyAnchorIdx = startIdx + 199; 
               
               for(let i=0; i < 400; i++) { 
                  let offset = i - xyAnchorI;
                  let exactIdx = xyAnchorIdx + (offset * tScaleRatio);
                  let idx = Math.max(0, Math.min(2999, Math.floor(exactIdx)));
                  
                  let valX = realComp.history1[idx] * inv1;
                  let valY = realComp.history2[idx] * inv2;
                  let px = 130 + ((valX / scaleMax1) * 80) + yPx1; 
                  let py = 120 - ((valY / scaleMax2) * 80) - yPx2;
                  pXY += `${px},${py} `;
               }
           }

           // 🟢 KODE YANG SEMPAT HILANG: Variabel Kalkulasi Posisi
           let indY1 = Math.max(40, Math.min(200, 120 - yPx1)); 
           let indY2 = Math.max(40, Math.min(200, 120 - yPx2)); 
           let indX = Math.max(30, Math.min(230, 130 + xPixelOffset));
           let trigScaleMax = vDivScale[(realComp.trigSource === 0 ? realComp.ch1 : realComp.ch2).vDivIndex] * 4;
           let trigYPx = (realComp.trigSource === 0 ? realComp.ch1 : realComp.ch2).yPosition * 20;
           let indLvlY = Math.max(40, Math.min(200, 120 - ((realComp.trigLevel / trigScaleMax) * 80) - trigYPx));

           // 🟢 KODE YANG SEMPAT HILANG: Pembuka Frame Animasi
           requestAnimationFrame(() => {
               
               // 🟢 KODE YANG SEMPAT HILANG: Eksekusi Gambar Garis ke Layar SVG
               if (realComp.dispMode === 0 || realComp.dispMode === 2) {
                   trace1.style.display = realComp.ch1.enabled ? 'block' : 'none'; 
                   trace2.style.display = realComp.ch2.enabled ? 'block' : 'none';
                   if (traceXY) traceXY.style.display = 'none';
                   if (realComp.ch1.enabled) trace1.setAttribute('points', p1); 
                   if (realComp.ch2.enabled) trace2.setAttribute('points', p2);
               } else {
                   trace1.style.display = 'none'; trace2.style.display = 'none';
                   if (traceXY) { 
                       let xyEnabled = realComp.ch1.enabled && realComp.ch2.enabled;
                       traceXY.style.display = xyEnabled ? 'block' : 'none'; 
                       if (xyEnabled) traceXY.setAttribute('points', pXY); 
                   }
               }
               
               let yInd1 = contentDiv.querySelector('.ypos-ind-1'); 
               if (yInd1) { yInd1.setAttribute('points', `230,${indY1} 235,${indY1-4} 235,${indY1+4}`); yInd1.style.display = realComp.ch1.enabled ? 'block' : 'none'; }
               let yInd2 = contentDiv.querySelector('.ypos-ind-2'); 
               if (yInd2) { yInd2.setAttribute('points', `230,${indY2} 235,${indY2-4} 235,${indY2+4}`); yInd2.style.display = realComp.ch2.enabled ? 'block' : 'none'; }
               
               // 🟢 KODE YANG SEMPAT HILANG: Indikator Posisi X dan Trigger (Ungu)
               let xInd = contentDiv.querySelector('.xpos-indicator'); 
               if (xInd) xInd.setAttribute('points', `${indX},40 ${indX-4},35 ${indX+4},35`);
               let lvlInd = contentDiv.querySelector('.lvl-indicator'); 
               if (lvlInd) lvlInd.setAttribute('points', `230,${indLvlY} 225,${indLvlY-4} 225,${indLvlY+4}`);
                              
               // 🟢 RENDER VISIBILITAS & KALKULATOR KURSOR
               let cursGroup = contentDiv.querySelector('.cursors-group');
               let cursOSD = contentDiv.querySelector('.cur-osd');
               let cursBtnTxt = contentDiv.querySelector('.cursor-txt');
               
               if (realComp.cursorActive) {
                   if (cursGroup) cursGroup.style.display = 'block';
                   if (cursOSD) cursOSD.style.display = 'block';
                   if (cursBtnTxt) { cursBtnTxt.textContent = 'ON'; cursBtnTxt.setAttribute('fill', '#10b981'); }
                   
                   // Sinkronisasi posisi (untuk refresh frame)
                   let lV1 = contentDiv.querySelector('.cur-v1'); let lV1H = contentDiv.querySelector('.cur-v1-hit'); if(lV1) { lV1.setAttribute('y1', realComp.curV1Y); lV1.setAttribute('y2', realComp.curV1Y); lV1H.setAttribute('y1', realComp.curV1Y); lV1H.setAttribute('y2', realComp.curV1Y); }
                   let lV2 = contentDiv.querySelector('.cur-v2'); let lV2H = contentDiv.querySelector('.cur-v2-hit'); if(lV2) { lV2.setAttribute('y1', realComp.curV2Y); lV2.setAttribute('y2', realComp.curV2Y); lV2H.setAttribute('y1', realComp.curV2Y); lV2H.setAttribute('y2', realComp.curV2Y); }
                   let lT1 = contentDiv.querySelector('.cur-t1'); let lT1H = contentDiv.querySelector('.cur-t1-hit'); if(lT1) { lT1.setAttribute('x1', realComp.curT1X); lT1.setAttribute('x2', realComp.curT1X); lT1H.setAttribute('x1', realComp.curT1X); lT1H.setAttribute('x2', realComp.curT1X); }
                   let lT2 = contentDiv.querySelector('.cur-t2'); let lT2H = contentDiv.querySelector('.cur-t2-hit'); if(lT2) { lT2.setAttribute('x1', realComp.curT2X); lT2.setAttribute('x2', realComp.curT2X); lT2H.setAttribute('x1', realComp.curT2X); lT2H.setAttribute('x2', realComp.curT2X); }
                   
                   // 🧮 KALKULATOR SMART-OSD
                   let curMode = realComp.lastCursorMode || 'V'; 
                   let title = contentDiv.querySelector('.cur-title');
                   let txt1 = contentDiv.querySelector('.cur-txt-1');
                   let txt2 = contentDiv.querySelector('.cur-txt-2');
                   let txtD = contentDiv.querySelector('.cur-txt-d');
                   
                   if (curMode === 'V') {
                       // MENGHITUNG VOLTASE (Berdasarkan CH yang aktif dipilih pengguna)
                       let activeChInfo = realComp.activeCh === 1 ? realComp.ch1 : realComp.ch2;
                       let scaleMax = vDivScale[activeChInfo.vDivIndex] * 4;
                       let yPx = activeChInfo.yPosition * 20;
                       
                       // Rumus Pembalik: Mengembalikan piksel (Y) menjadi Volt
                       let val1 = (120 - realComp.curV1Y - yPx) * scaleMax / 80;
                       let val2 = (120 - realComp.curV2Y - yPx) * scaleMax / 80;
                       let deltaV = val1 - val2;
                       
                       if(title) { title.textContent = `CURS (CH${realComp.activeCh} VOLT)`; title.setAttribute('fill', realComp.activeCh === 1 ? '#eab308' : '#06b6d4'); }
                       if(txt1) { txt1.textContent = `1: ${val1.toFixed(2)}V`; txt1.setAttribute('fill', '#eab308'); }
                       if(txt2) { txt2.textContent = `2: ${val2.toFixed(2)}V`; txt2.setAttribute('fill', '#06b6d4'); }
                       if(txtD) { txtD.textContent = `Δ: ${Math.abs(deltaV).toFixed(2)}V`; }
                   } else {
                       // MENGHITUNG WAKTU & FREKUENSI 
                       // 1 Kotak (Div) = 20 piksel. Posisi X0 dimulai dari piksel ke-30.
                       let t1 = ((realComp.curT1X - 30) / 20) * tPerDiv;
                       let t2 = ((realComp.curT2X - 30) / 20) * tPerDiv;
                       let deltaT = Math.abs(t2 - t1);
                       let freq = deltaT > 0 ? (1 / deltaT) : 0;
                       
                       const fmtT = (t) => (t >= 1 ? t.toFixed(2)+'s' : t >= 0.001 ? (t*1000).toFixed(2)+'ms' : (t*1e6).toFixed(2)+'μs');
                       const fmtF = (f) => (f >= 1e6 ? (f/1e6).toFixed(2)+'MHz' : f >= 1e3 ? (f/1e3).toFixed(2)+'kHz' : f.toFixed(2)+'Hz');

                       if(title) { title.textContent = `CURSOR (TIME)`; title.setAttribute('fill', '#fff'); }
                       if(txt1) { txt1.textContent = `1: ${fmtT(t1)}`; txt1.setAttribute('fill', '#eab308'); }
                       if(txt2) { txt2.textContent = `2: ${fmtT(t2)}`; txt2.setAttribute('fill', '#06b6d4'); }
                       if(txtD) { txtD.textContent = `Δ: ${fmtT(deltaT)} (${fmtF(freq)})`; }
                   }
               } else {
                   if (cursGroup) cursGroup.style.display = 'none';
                   if (cursOSD) cursOSD.style.display = 'none';
                   if (cursBtnTxt) { cursBtnTxt.textContent = 'OFF'; cursBtnTxt.setAttribute('fill', '#fff'); }
               }

               // Animasi Teks Tombol RUN/STOP (Hijau/Merah)
               let runStopTxt = contentDiv.querySelector('.run-stop-text');
               if (runStopTxt) {
                   runStopTxt.textContent = realComp.isRun ? 'RUN' : 'STOP';
                   runStopTxt.setAttribute('fill', realComp.isRun ? '#10b981' : '#f87171');
               }

               // UI Updates
               let curCh = realComp.activeCh === 1 ? realComp.ch1 : realComp.ch2;
               
               contentDiv.querySelector('.ch-sel-txt').textContent = `CH${realComp.activeCh}`;
               contentDiv.querySelector('.ch-sel-txt').setAttribute('fill', realComp.activeCh === 1 ? '#eab308' : '#06b6d4');
               
               // 🟢 ALGORITMA AUTOMATIC MEASUREMENT (OSD)
               let measOverlay = contentDiv.querySelector('.meas-overlay');
               if (measOverlay) {
                   if (realComp.measActive) {
                       measOverlay.style.display = 'block';
                       // 🟢 FIX: Gunakan Layar Virtual (screenBuf) agar pembacaan OSD mengikuti Zoom layar
                       let activeHist = realComp.activeCh === 1 ? screenBuf1 : screenBuf2;
                       let invMult = (realComp.activeCh === 1 ? realComp.ch1.invert : realComp.ch2.invert) ? -1 : 1;
                       
                       let vMax = -Infinity, vMin = Infinity, sum = 0, sumSq = 0;
                       
                       for(let i=0; i < 200; i++) {
                           let v = activeHist[i] * invMult;
                           if (v > vMax) vMax = v;
                           if (v < vMin) vMin = v;
                           sum += v;
                           sumSq += (v * v);
                       }
                       if (vMax === -Infinity) { vMax = 0; vMin = 0; }
                       
                       let vAvg = sum / 200;                    
                       let vRms = Math.sqrt(sumSq / 200);       
                       let vPp = vMax - vMin;                   
                       let vAmp = vPp / 2;                      
                       
                       // Waktu & Frekuensi
                       let timePerPoint = (tPerDiv * 10) / 200; 
                       let midV = (vMax + vMin) / 2;
                       let p10 = vMin + (vPp * 0.1); 
                       let p90 = vMin + (vPp * 0.9); 
                       
                       let edges = [];
                       if (vPp > 0.1) {
                           let isH = (activeHist[0] * invMult) > midV;
                           for(let i = 1; i < 200; i++) {
                               let v = activeHist[i] * invMult;
                               let currentH = v > midV;
                               if (currentH !== isH) {
                                   edges.push({ type: currentH ? 'rise' : 'fall', idx: i });
                                   isH = currentH;
                               }
                           }
                       }
                       
                       let validPeriods = [], validPWs = [];
                       for(let i=0; i<edges.length; i++) {
                           if (edges[i].type === 'rise') {
                               let nextFall = edges.find((e, idx) => idx > i && e.type === 'fall');
                               if (nextFall) validPWs.push(nextFall.idx - edges[i].idx); 
                               let nextRise = edges.find((e, idx) => idx > i && e.type === 'rise');
                               if (nextRise) validPeriods.push(nextRise.idx - edges[i].idx); 
                           }
                       }
                       
                       let freq = 0, period = 0, pulseWidth = 0, dutyCycle = 0;
                       if (validPeriods.length > 0) {
                           let avgPeriodPoints = validPeriods.reduce((a,b)=>a+b) / validPeriods.length;
                           period = avgPeriodPoints * timePerPoint;
                           freq = 1 / period;
                       }
                       if (validPWs.length > 0 && period > 0) {
                           let avgPWPoints = validPWs.reduce((a,b)=>a+b) / validPWs.length;
                           pulseWidth = avgPWPoints * timePerPoint;
                           dutyCycle = (pulseWidth / period) * 100;
                       }
                       
                       let riseTimePts = 0, fallTimePts = 0;
                       if (vPp > 0.1) {
                           let firstRise = edges.find(e => e.type === 'rise');
                           if (firstRise) {
                               let s10 = firstRise.idx, e90 = firstRise.idx;
                               while(s10 > 0 && (activeHist[s10] * invMult) > p10) s10--;
                               while(e90 < 199 && (activeHist[e90] * invMult) < p90) e90++;
                               riseTimePts = Math.max(0, e90 - s10);
                           }
                           let firstFall = edges.find(e => e.type === 'fall');
                           if (firstFall) {
                               let s90 = firstFall.idx, e10 = firstFall.idx;
                               while(s90 > 0 && (activeHist[s90] * invMult) < p90) s90--;
                               while(e10 < 199 && (activeHist[e10] * invMult) > p10) e10++;
                               fallTimePts = Math.max(0, e10 - s90);
                           }
                       }
                       let riseTime = riseTimePts * timePerPoint;
                       let fallTime = fallTimePts * timePerPoint;

                       // Format Teks Cerdas (Menyesuaikan Hz, kHz, ms, μs otomatis)
                       const fmtF = (f) => (f > 0 && isFinite(f)) ? (f >= 1e6 ? (f/1e6).toFixed(2)+'MHz' : f >= 1e3 ? (f/1e3).toFixed(2)+'kHz' : f.toFixed(2)+'Hz') : '---';
                       const fmtT = (t) => (t > 0 && isFinite(t)) ? (t >= 1 ? t.toFixed(2)+'s' : t >= 0.001 ? (t*1000).toFixed(2)+'ms' : (t*1e6).toFixed(2)+'μs') : '---';
                       const fmtD = (d) => (d > 0 && isFinite(d)) ? d.toFixed(1)+'%' : '---';
                       
                       // Cetak ke Layar SVG OSD
                       let title = contentDiv.querySelector('.meas-title');
                       if (title) {
                           title.textContent = `MEASURE CH${realComp.activeCh}`;
                           title.setAttribute('fill', realComp.activeCh === 1 ? '#eab308' : '#06b6d4');
                       }
                       // Cetak Voltase
                       contentDiv.querySelector('.m-vpp').textContent = vPp.toFixed(2) + 'V';
                       contentDiv.querySelector('.m-vmax').textContent = vMax.toFixed(2) + 'V';
                       contentDiv.querySelector('.m-vmin').textContent = vMin.toFixed(2) + 'V';
                       contentDiv.querySelector('.m-vamp').textContent = vAmp.toFixed(2) + 'V';
                       contentDiv.querySelector('.m-vrms').textContent = vRms.toFixed(2) + 'V';
                       contentDiv.querySelector('.m-vavg').textContent = vAvg.toFixed(2) + 'V';
                       // Cetak Waktu
                       contentDiv.querySelector('.m-freq').textContent = fmtF(freq);
                       contentDiv.querySelector('.m-per').textContent = fmtT(period);
                       contentDiv.querySelector('.m-duty').textContent = fmtD(dutyCycle);
                       contentDiv.querySelector('.m-pw').textContent = fmtT(pulseWidth);
                       contentDiv.querySelector('.m-rise').textContent = fmtT(riseTime);
                       contentDiv.querySelector('.m-fall').textContent = fmtT(fallTime);
                   } else {
                       measOverlay.style.display = 'none'; // Sembunyikan jika mode OFF
                   }
               }
               
               // Ubah warna teks tombol MEAS di panel
               let measTxt = contentDiv.querySelector('.meas-txt');
               if (measTxt) {
                   measTxt.textContent = realComp.measActive ? 'ON' : 'OFF';
                   measTxt.setAttribute('fill', realComp.measActive ? '#10b981' : '#fff');
               }

               // Animasi Teks Mode DISP
               let dispTxt = contentDiv.querySelector('.disp-mode-txt');
               if (dispTxt) {
                   dispTxt.textContent = ['Y-T', 'X-Y', 'ROLL'][realComp.dispMode];
                   if (realComp.dispMode === 1) dispTxt.setAttribute('fill', '#10b981'); // Hijau X-Y
                   else if (realComp.dispMode === 2) dispTxt.setAttribute('fill', '#f59e0b'); // Oranye ROLL
                   else dispTxt.setAttribute('fill', '#fff'); 
               }
               contentDiv.querySelector('.ch-coupl-txt').textContent = ['DC', 'AC', 'GND'][curCh.coupl];
               contentDiv.querySelector('.btn-invert').setAttribute('fill', curCh.invert ? (realComp.activeCh === 1 ? '#eab308' : '#06b6d4') : '#475569');
               contentDiv.querySelector('.inv-text').setAttribute('fill', curCh.invert ? '#000' : '#fff');
               
               let tmTxt = contentDiv.querySelector('.trig-mode-txt');
               if (tmTxt) {
                   if (realComp.dispMode === 2) {
                       tmTxt.textContent = '---'; // Trigger mati di mode ROLL
                       tmTxt.setAttribute('fill', '#475569');
                   } else {
                       tmTxt.textContent = ['AUTO', 'NORM', 'SING'][realComp.trigMode];
                       if (realComp.trigMode === 2 && realComp.trigState === 'STOP') {
                           tmTxt.textContent = 'STOP'; // 🟢 Tangkapan Selesai, membeku!
                           tmTxt.setAttribute('fill', '#f87171');
                       } else if (realComp.trigMode === 2 && realComp.trigState === 'WAIT') {
                           tmTxt.textContent = 'RDY'; // 🟢 Siap (Ready) Menangkap percikan
                           tmTxt.setAttribute('fill', '#fbbf24');
                       } else if (realComp.trigMode !== 0 && realComp.trigState === 'WAIT') {
                           tmTxt.setAttribute('fill', '#fbbf24');
                       } else {
                           tmTxt.setAttribute('fill', '#fff');
                       }
                   }
               }
               
               contentDiv.querySelector('.trig-slope-txt').textContent = realComp.trigSlope === 0 ? 'RISE ↑' : 'FALL ↓';
               contentDiv.querySelector('.trig-coupl-txt').textContent = ['DC', 'AC', 'HF-R', 'LF-R'][realComp.trigCoupl];
               contentDiv.querySelector('.trig-src-txt').textContent = ['CH1', 'CH2'][realComp.trigSource];
               
               contentDiv.querySelector('.vdiv1-text').textContent = `CH1: ${vDivScale[realComp.ch1.vDivIndex] < 1 ? (vDivScale[realComp.ch1.vDivIndex]*1000)+'mV/div' : vDivScale[realComp.ch1.vDivIndex]+'V/div'}`;
               contentDiv.querySelector('.vdiv2-text').textContent = `CH2: ${vDivScale[realComp.ch2.vDivIndex] < 1 ? (vDivScale[realComp.ch2.vDivIndex]*1000)+'mV/div' : vDivScale[realComp.ch2.vDivIndex]+'V/div'}`;
               contentDiv.querySelector('.tlvl-text').textContent = `Trig: ${realComp.trigLevel.toFixed(1)}V`;
               
               // 🟢 PERBARUI TAMPILAN TEKS (Meredup jika Channel Mati)
               let vdiv1Txt = contentDiv.querySelector('.vdiv1-text');
               vdiv1Txt.textContent = `CH1: ${vDivScale[realComp.ch1.vDivIndex] < 1 ? (vDivScale[realComp.ch1.vDivIndex]*1000)+'mV/div' : vDivScale[realComp.ch1.vDivIndex]+'V/div'}`;
               vdiv1Txt.setAttribute('fill', realComp.ch1.enabled ? '#eab308' : '#475569');
               
               let vdiv2Txt = contentDiv.querySelector('.vdiv2-text');
               vdiv2Txt.textContent = `CH2: ${vDivScale[realComp.ch2.vDivIndex] < 1 ? (vDivScale[realComp.ch2.vDivIndex]*1000)+'mV/div' : vDivScale[realComp.ch2.vDivIndex]+'V/div'}`;
               vdiv2Txt.setAttribute('fill', realComp.ch2.enabled ? '#06b6d4' : '#475569');
               
               let tDivStr = tPerDiv >= 1 ? tPerDiv + "s/div" : (tPerDiv >= 0.001 ? (tPerDiv * 1000) + "ms/div" : (tPerDiv * 1000000) + "μs/div");
               contentDiv.querySelector('.tdiv-text').textContent = `T/Div: ${tDivStr}`;
               
               let val1Txt = contentDiv.querySelector('.val1-text');
               val1Txt.textContent = realComp.ch1.enabled ? `V1: ${(v1 * (realComp.ch1.invert ? -1 : 1)).toFixed(2)}V` : 'V1: OFF';
               val1Txt.setAttribute('fill', realComp.ch1.enabled ? '#eab308' : '#475569');
               
               let val2Txt = contentDiv.querySelector('.val2-text');
               val2Txt.textContent = realComp.ch2.enabled ? `V2: ${(v2 * (realComp.ch2.invert ? -1 : 1)).toFixed(2)}V` : 'V2: OFF';
               val2Txt.setAttribute('fill', realComp.ch2.enabled ? '#06b6d4' : '#475569');
               
               // Animasi Teks Tombol ON/OFF (Hijau/Merah)
               let chEnTxt = contentDiv.querySelector('.ch-en-text');
               if (chEnTxt) {
                   chEnTxt.textContent = curCh.enabled !== false ? 'ON' : 'OFF';
                   chEnTxt.setAttribute('fill', curCh.enabled ? '#10b981' : '#f87171');
               }
               
               setPin('pin-in-0', rawV1 > 0); setPin('pin-in-1', rawV2 > 0);
           });
        }
        break;
      }
      case 'motor_dc': {
        const rpmText = contentDiv.querySelector('.rpm-text');
        if (rpmText) rpmText.textContent = `${compData.rpm || 0} RPM`;

        // 1. Siapkan memori sudut rotasi visual
        if (typeof compData.visualAngle === 'undefined') compData.visualAngle = 0;

        // 2. Skala kecepatan rotasi untuk layar (Tweak angka 0.05 ini sesuai selera)
        let visualSpeed = (compData.rpm || 0) * 0.05;

        // 3. CEGAH EFEK ILUSI MUNDUR (Wagon-Wheel Effect)
        // Kita batasi pergerakan maksimal 25 derajat per frame (layar).
        // RPM aslinya tetap puluhan ribu, tapi visual di layar dibatasi agar mata nyaman.
        if (visualSpeed > 25) visualSpeed = 25;
        if (visualSpeed < -25) visualSpeed = -25;

        compData.visualAngle = (compData.visualAngle + visualSpeed) % 360;

        // 4. Putar elemen SVG rotasi
        const rotor = contentDiv.querySelector('.anim-rotor');
        if (rotor) {
            rotor.style.transform = `rotate(${compData.visualAngle}deg)`;
        }
        break;
      }
      case 'servo': {
        let isPowered = compData.isPowered || false;
        let angle = compData.servoAngle || 0;

        setPin('pin-in-0', angle > 0); 
        setPin('pin-in-1', isPowered); 
        setPin('pin-in-2', isPowered);
        
        const horn = contentDiv.querySelector('.anim-horn');
        if (horn) {
          horn.style.transform = `rotate(${angle}deg)`;
        }
        const text = contentDiv.querySelector('.anim-text');
        if (text) text.textContent = Math.round(angle) + '°' + (isPowered ? '' : ' (OFF)');
        break;
      }
      case 'solenoid': {
        const vState = (compData.simV || 0) > 0;
        
        setPin('pin-in-0', vState); setPin('pin-out-0', vState);
        const plunger = contentDiv.querySelector('.anim-plunger');
        
        if (plunger) {
            // Ambil posisi presisi milimeter dari Mesin Fisika (Hukum Newton)
            let currentPos = compData.plungerPos || 0; 
            
            // Konversi milimeter ke pixel layar (translasi ke kiri)
            plunger.style.transform = `translateX(-${currentPos}px)`;
            
            // Ubah warna menjadi merah terang jika stroke sudah mencapai lebih dari 95%
            const isFullyRetracted = (compData.strokePercent || 0) > 95;
            plunger.setAttribute('fill', isFullyRetracted ? '#ef4444' : '#64748b');
        }
        break;
      }
      case 'relay': {
        const isActive = compData.state === '1';
        setPin('pin-in-0', vState); setPin('pin-out-0', vState); setPin('pin-in-1', vState); setPin('pin-out-1', isActive && vState);
        const body = contentDiv.querySelector('.anim-body'); const path = contentDiv.querySelector('.anim-path'); const line = contentDiv.querySelector('.anim-line');
        if (body) { body.setAttribute('fill', isActive ? '#fef08a' : '#e8e6d3'); body.setAttribute('stroke', isActive ? '#eab308' : '#1e293b'); }
        if (path) path.setAttribute('stroke', isActive ? '#eab308' : '#1e293b');
        if (line) { line.setAttribute('x2', isActive ? '55' : '50'); line.setAttribute('y2', isActive ? '60' : '50'); }
        break;
      }
      case 'diode_bridge': {
  setPin('pin-in-0', vState); setPin('pin-in-1', vState);
  setPin('pin-out-0', compData.simV > 1.5);
  setPin('pin-out-1', compData.simV > 1.5);
  break;
}
      case 'relay_5pin': {
        const isActive = compData.state === '1';
        setPin('pin-in-0', vState); setPin('pin-out-0', vState); 
        setPin('pin-in-1', vState); 
        setPin('pin-out-1', !isActive && vState); // NC (87a) mengalir saat mati
        setPin('pin-out-2', isActive && vState);  // NO (87) mengalir saat menyala
        
        const body = contentDiv.querySelector('.anim-body'); 
        const line = contentDiv.querySelector('.anim-line');
        if (body) { 
          body.setAttribute('fill', isActive ? '#fef08a' : '#e8e6d3'); 
          body.setAttribute('stroke', isActive ? '#eab308' : '#1e293b'); 
        }
        if (line) { 
          // Memindahkan lengan mekanis ke bawah (pin 87) saat koil aktif
          line.setAttribute('y2', isActive ? '90' : '50'); 
        }
        break;
      }
      case 'transformer': {
        setPin('pin-in-0', vState); setPin('pin-in-1', vState); setPin('pin-out-0', vState); setPin('pin-out-1', vState); setPin('pin-out-2', vState);
        const coilP = contentDiv.querySelector('.anim-coil-p');
        if (coilP) coilP.setAttribute('stroke', vState ? '#eab308' : '#1e293b');
        break;
      }
      case 'capacitor': {
        setPin('pin-in-0', vState); setPin('pin-out-0', vState);
        const txtVal = contentDiv.querySelector('.anim-text');
        if (txtVal) {
          const cv = compData.customValue ?? 10; // 🟢 FIX BUG #6: ?? bukan ||
          txtVal.textContent = cv >= 1000 ? `${(cv/1000).toFixed(1)}mF` : `${cv}µF`;
        }
        break;
      }
      case 'ic_555': {
        const isActive = compData.outputState === 1;
        const vccPowered = (compData.simV_vcc || 0) > 0;
        
        // 1. Render Pin Daya & Output Utama
        setPin('pin-in-5', vccPowered); // Pin VCC
        setPin('pin-out-0', isActive);  // Pin Q
        
        // 2. Render seluruh pin sensor/input jika memorinya sudah ada
        if (compData.inputStates) {
            setPin('pin-in-0', compData.inputStates[0] > 0);   // GND
            setPin('pin-in-1', compData.inputStates[1] > 2.5); // TR
            setPin('pin-in-2', compData.inputStates[2] > 2.5); // R
            setPin('pin-in-3', compData.inputStates[3] > 2.5); // CV
            setPin('pin-in-4', compData.inputStates[4] > 2.5); // TH
        }
        
        // 3. Render Pin Discharge (DC).
        // Aktif membuang muatan ke Ground saat Output Q mati (0) dan IC menyala.
        setPin('pin-out-1', !isActive && vccPowered);

        const body = contentDiv.querySelector('.anim-body');
        if (body) body.setAttribute('fill', isActive ? '#fef08a' : '#e8e6d3');
        break;
      }
      // ==========================================
      // 1. TRANSISTOR (BJT & MOSFET) - Jembatan Logic
      // ==========================================
      case 'bjt_npn': case 'bjt_pnp':
      case 'mosfet_n': case 'mosfet_p': {
          // Murni HANYA BACA (Read-Only) dari hasil kalkulasi SimulationEngine.js
          const isActive = compData.state === '1';
          
          // Visual warna hijau pada kaki kontrol (Base/Gate)
          // Berhubung Engine sudah menghitung state, kita bisa pakai isActive untuk NPN
          let isControlHigh = (type === 'bjt_npn' || type === 'mosfet_n') ? isActive : false;
          
          setPin('pin-in-0', isControlHigh);
          setPin('pin-in-1', compData.simV > 0); 
          setPin('pin-out-0', isActive && compData.simV > 0);
          
          if (type.startsWith('mosfet')) { 
              setPin('pin-out-1', isActive && compData.simV > 0); 
              setPin('pin-out-2', isActive && compData.simV > 0); 
          }
          
          const body = contentDiv.querySelector('.anim-body');
          if (body) body.setAttribute('fill', isActive ? '#dcfce7' : '#e8e6d3');
          break;
      }
      case 'junction':
    setPin('pin-in-0', vState); setPin('pin-out-0', vState); setPin('pin-out-1', vState); setPin('pin-out-2', vState);
    break;
      case 'wire_1to2':
    setPin('pin-in-0', vState); setPin('pin-out-0', vState); setPin('pin-out-1', vState); setPin('pin-out-2', vState);
    break;
      case 'wire_1to1':
        setPin('pin-in-0', vState); break;
      case 'opamp':
      case 'and': case 'or': case 'not': case 'nand': case 'nor': case 'xor': case 'xnor':
        setPin('pin-out-0', compData.outputState === 1); break;
    }
  }
};

// File: src/engine/SimulationEngine.js

const SimulationEngine = {
    isRunning: false,
    nodes: [], // Menyimpan titik simpul (persimpangan kabel) kelistrikan
    nodeVoltage: [], // Menyimpan nilai tegangan untuk masing-masing node
    
    toggle() {
        const simIndicator = document.getElementById('simIndicator');
        const simText = document.getElementById('simText');
        
        this.isRunning = !this.isRunning;
        CircuitStore.isSimulationActive = this.isRunning;

        if (this.isRunning) {
            if (simIndicator) simIndicator.className = 'status-indicator status-active';
            if (simText) simText.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Stop Simulasi';
            if (btnSimulate) {
                btnSimulate.classList.remove('btn-primary');
                btnSimulate.classList.add('btn-success');
            }
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
            
    // Perbarui visual (matikan LED, dll)
        const contentDiv = document.getElementById(`content-${c.id}`);
        if (contentDiv && typeof ComponentDefs !== 'undefined') {
            ComponentDefs.updateDOMState(c.type, c, contentDiv, c.id);
        }
    });
},

    run() {
    // Jangan jalankan jika simulasi sedang mati, kecuali ada pemicu paksa
    if (!CircuitStore.isSimulationActive && !this.isRunning) return;

    for (let i = 0; i < 2; i++) {
        this.solveDigitalLogic();
        this.buildElectricalNodes();
        this.solveAnalogPhysics();
    }

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

        const MAX_ITER = 1500; 
        const EPSILON = 0.001; 
        const time = Date.now() / 1000; 

        for (let i = 0; i < MAX_ITER; i++) {
            let maxError = 0; // 🟢 Tambahkan pelacak perubahan tegangan
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
                        const vDiff = this.nodeVoltage[nIn] - this.nodeVoltage[nOut];
                        
                        // 1. Baca pengaturan pengguna, jika kosong gunakan default Proteus
                        const fV = comp.type === 'led' ? (parseFloat(comp.forwardV) || 2.2) : 0.7; 
                        const bV = comp.type === 'led' ? (parseFloat(comp.breakdownV) || 4.0) : 50.0;
                        
                        if (vDiff > fV) { 
                            // Mode FORWARD BIAS (Menyala)
                            const cond = 1 / 1;
                            sumVR[nIn] += (this.nodeVoltage[nOut] + fV) * cond; sum1R[nIn] += cond;
                            sumVR[nOut] += (this.nodeVoltage[nIn] - fV) * cond; sum1R[nOut] += cond;
                        } 
                        else if (vDiff < -bV) { 
                            // Mode REVERSE BREAKDOWN (Tegangan terbalik terlalu besar, arus jebol/bocor)
                            const cond = 1 / 10; 
                            sumVR[nIn] += (this.nodeVoltage[nOut] - bV) * cond; sum1R[nIn] += cond;
                            sumVR[nOut] += (this.nodeVoltage[nIn] + bV) * cond; sum1R[nOut] += cond;
                        } 
                        else { 
                            // Mode OFF (Menahan arus), Arus Bocor (Leakage Current) semikonduktor
                            const cond = 1 / 100000; 
                            sumVR[nIn] += this.nodeVoltage[nOut] * cond; sum1R[nIn] += cond;
                            sumVR[nOut] += this.nodeVoltage[nIn] * cond; sum1R[nOut] += cond;
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
                    // Berkedip 0.5 detik ON, 0.5 detik OFF (1 Hz)
                    const isActive = (time % 1.0) < 0.5; 
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
                    if (comp.chargeV === undefined) comp.chargeV = 0;
                    const cVal = (comp.customValue || 10) * 1e-6; // uF ke Farad
                    const rEq = 0.016 / cVal; // Model Transient (dt / C)
                    
                    const nIn = getNodeIndex(comp.id, 'input', 0);
                    const nOut = getNodeIndex(comp.id, 'output', 0);
                    
                    if (nIn !== -1 && nOut !== -1) {
                        const cond = 1 / rEq;
                        sumVR[nIn] += (this.nodeVoltage[nOut] + comp.chargeV) * cond; sum1R[nIn] += cond;
                        sumVR[nOut] += (this.nodeVoltage[nIn] - comp.chargeV) * cond; sum1R[nOut] += cond;
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
        }
        
        // 3. TERAPKAN HASIL KE KOMPONEN
        CircuitStore.components.forEach(comp => {
            if (comp.type === 'resistor' || comp.type === 'led' || comp.type === 'diode' || comp.type === 'ammeter') {
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
                } else if (comp.type === 'led') {
                    comp.simV = vDiff; 
                    const fV = parseFloat(comp.forwardV) || 2.2;
                    comp.simI = comp.simV > fV ? (comp.simV - fV) / 1 : 0;
                } else if (comp.type === 'diode') {
                    comp.simV = vDiff;
                    comp.simI = comp.simV > 0.7 ? (comp.simV - 0.7) / 1 : 0;
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
                    const dt = 0.016;     // Waktu per frame (60 FPS)
                    
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
                    
                    const cVal = (comp.customValue || 10) * 1e-6;
                    const rEq = 0.016 / cVal;
                    
                    const current = (vIn - vOut - comp.chargeV) / rEq;
                    comp.simI = current;
                    
                    // Isi atau buang muatan kapasitor secara bertahap
                    comp.chargeV += (current / cVal) * 0.016; 
                    comp.simV = Math.abs(comp.chargeV);
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

// File: src/state/CircuitStore.js

const CircuitStore = {
  components: [],
  connections: [],
  connectionStart: null,
  componentIdCounter: 0,
  isSimulationActive: false,
  currentEditingComponent: null,
  
  // History untuk Undo/Redo
  undoStack: [],
  redoStack: [],
  maxUndo: 100,
  isUndoRedoOp: false,

  // Multi-select state
  selectedComponents: [],
  isMarqueeSelecting: false,
  marqueeStart: { x: 0, y: 0 },


  // --- Metode Manipulasi Data ---

  addComponent(compData) {
    this.components.push(compData);
  },

  removeComponent(id) {
    this.components = this.components.filter(c => c.id !== id);
    // Hapus koneksi yang terkait dengan komponen ini
    this.connections = this.connections.filter(c => 
      c.source.compId !== id && c.target.compId !== id
    );
  },

  addConnection(connData) {
    this.connections.push(connData);
  },

  removeConnection(srcId, srcPin, tgtId, tgtPin) {
    this.connections = this.connections.filter(c => 
      !(c.source.compId === srcId && c.source.pinIndex === srcPin && 
        c.target.compId === tgtId && c.target.pinIndex === tgtPin)
    );
  },

  // Menghapus semua koneksi yang menuju ke satu pin input tertentu, berapapun sumbernya.
  // Dipakai saat menyambung kabel baru ke pin input yang sudah terisi (perilaku "ganti").
  removeConnectionsTargeting(tgtId, tgtPin) {
    const before = this.connections.length;
    this.connections = this.connections.filter(c => 
      !(c.target.compId === tgtId && c.target.pinIndex === tgtPin)
    );
    return before !== this.connections.length;
  },

  clearSelection() {
    this.selectedComponents = [];
  },

  setSelection(idArray) {
    this.selectedComponents = idArray;
  },

  generateId() {
    this.componentIdCounter++;
    return this.componentIdCounter;
  }
};

// File: src/ui/UIManager.js

const UIManager = {
  currentZoom: 1,

setZoom(val, clientX = null, clientY = null) {
    const canvas = document.getElementById('canvas');
    const wrapper = document.getElementById('canvas-wrapper');
    if (!canvas || !wrapper) return;

    const oldZoom = this.currentZoom;
    const newZoom = Math.max(0.5, Math.min(parseFloat(val), 2.0));
    this.currentZoom = newZoom;

    const rect = wrapper.getBoundingClientRect();
    
    // Jika posisi kursor/jari tidak diberikan (misal klik tombol + / - dari UI), 
    // gunakan titik tengah area wrapper sebagai pusat zoom otomatis
    if (clientX === null || clientY === null) {
      clientX = rect.left + rect.width / 2;
      clientY = rect.top + rect.height / 2;
    }

    // 1. Hitung posisi absolut titik yang ditunjuk di dalam canvas sebelum zoom berubah
    const canvasX = (wrapper.scrollLeft + clientX - rect.left) / oldZoom;
    const canvasY = (wrapper.scrollTop + clientY - rect.top) / oldZoom;

    // 2. Terapkan skala perbesaran baru pada elemen kanvas
    canvas.style.transform = `scale(${newZoom})`;

    // 3. Sesuaikan posisi scroll wrapper agar titik koordinat tetap diam tepat di bawah kursor/jari
    wrapper.scrollLeft = canvasX * newZoom - (clientX - rect.left);
    wrapper.scrollTop = canvasY * newZoom - (clientY - rect.top);

    // Update label persen dan slider di UI toolbar
    const zoomLabel = document.getElementById('zoomLabel');
    if (zoomLabel) zoomLabel.innerText = Math.round(newZoom * 100) + '%';
    const zoomSlider = document.getElementById('zoomSlider');
    if (zoomSlider) zoomSlider.value = newZoom;
  },

  changeZoom(delta) {
    let newZoom = this.currentZoom + delta;
    if (newZoom >= 0.5 && newZoom <= 2.0) this.setZoom(newZoom);
  },

  initTheme() {
    const saved = localStorage.getItem('labCircuitTheme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    this.updateThemeButton(saved === 'dark');
  },

  updateThemeButton(isDark) {
    const btn = document.getElementById('btnTheme');
    if (btn) {
      btn.innerHTML = isDark
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
      btn.title = isDark ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap';
    }
  },

  toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('labCircuitTheme', next);
    this.updateThemeButton(!isDark);
  },

  showToast(message, duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    // UBAH BAGIAN INI: Kosongkan isi container agar animasi tidak bertumpuk
    container.innerHTML = ''; 
    
    const toast = document.createElement('div');
    toast.className = 'toast'; 
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, duration);
  },

  showConfirmToast(message, onConfirm) {
    const existing = document.querySelector('.confirm-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'confirm-toast';
    toast.innerHTML = `<span>${message}</span><button id="confirmYes">Ya</button><button id="confirmNo">Batal</button>`;
    document.body.appendChild(toast);
    document.getElementById('confirmYes').onclick = () => { toast.remove(); if (onConfirm) onConfirm(); };
    document.getElementById('confirmNo').onclick = () => { toast.remove(); };
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 5000);
  },

openValueModal(compId, compType, subType) {
    CircuitStore.currentEditingComponent = { id: Number(compId), type: compType, subType: subType };
    const comp = document.getElementById(`comp-${compId}`);
    const compData = CircuitStore.components.find(c => c.id === Number(compId));
    if (!comp || !compData) return;

    let titleSuffix = subType ? ` (${subType.toUpperCase()})` : '';
    document.getElementById('valCompName').textContent = `${compType.toUpperCase()}${titleSuffix} - ID:${compId}`;
    const unitSelect = document.getElementById('compUnit');
    if (unitSelect) unitSelect.innerHTML = '';
    
    const fusePresets = document.getElementById('fusePresets');
    const resistorPresets = document.getElementById('resistorPresets');
    const capacitorPresets = document.getElementById('capacitorPresets');
    const batteryPresets = document.getElementById('batteryPresets');
    
    if (fusePresets) fusePresets.style.display = 'none';
    if (resistorPresets) resistorPresets.style.display = 'none';
    if (capacitorPresets) capacitorPresets.style.display = 'none';
    if (batteryPresets) batteryPresets.style.display = 'none'; 

    const isSlider = ['potentiometer', 'ldr', 'thermistor_ntc', 'thermistor_ptc'].includes(compType);
    const textInputGroup = document.getElementById('textInputGroup');
    const sliderInputGroup = document.getElementById('sliderInputGroup');
    const valCurrentWrapper = document.getElementById('valCurrentWrapper');
    const ledInputGroup = document.getElementById('ledInputGroup'); 
    const motorInputGroup = document.getElementById('motorInputGroup');
    const ntcInputGroup = document.getElementById('ntcInputGroup');
    const ptcInputGroup = document.getElementById('ptcInputGroup');

    const hideText = ['ldr', 'thermistor_ntc', 'thermistor_ptc', 'led', 'motor_dc', 'opamp'].includes(compType);    
    const opampInputGroup = document.getElementById('opampInputGroup');
    
    if (textInputGroup) textInputGroup.style.display = hideText ? 'none' : 'flex';
    if (sliderInputGroup) sliderInputGroup.style.display = isSlider ? 'block' : 'none';
    if (valCurrentWrapper) valCurrentWrapper.style.display = hideText ? 'none' : 'block';
    if (ledInputGroup) ledInputGroup.style.display = compType === 'led' ? 'flex' : 'none';
    if (motorInputGroup) motorInputGroup.style.display = compType === 'motor_dc' ? 'flex' : 'none';
    if (opampInputGroup) opampInputGroup.style.display = compType === 'opamp' ? 'flex' : 'none';
    if (ntcInputGroup) ntcInputGroup.style.display = compType === 'thermistor_ntc' ? 'flex' : 'none';
    if (ptcInputGroup) ptcInputGroup.style.display = compType === 'thermistor_ptc' ? 'flex' : 'none';

    if (compType === 'led') {
        document.getElementById('ledForwardV').value = compData.forwardV !== undefined ? compData.forwardV : 2.2;
        document.getElementById('ledFullDriveI').value = compData.fullDriveI !== undefined ? compData.fullDriveI : 10;
        document.getElementById('ledBreakdownV').value = compData.breakdownV !== undefined ? compData.breakdownV : 4.0;
    } else if (compType === 'motor_dc') {
        document.getElementById('motorRatedV').value = compData.ratedV !== undefined ? compData.ratedV : 12;
        document.getElementById('motorMaxRPM').value = compData.maxRpm !== undefined ? compData.maxRpm : 3000;
        document.getElementById('motorCoilR').value = compData.coilR !== undefined ? compData.coilR : 15;
    } else if (compType === 'opamp') {
        document.getElementById('opampPosRail').value = compData.posRail !== undefined ? compData.posRail : 15;
        document.getElementById('opampNegRail').value = compData.negRail !== undefined ? compData.negRail : -15;
    }
    if (compType === 'thermistor_ntc') {
        document.getElementById('ntcR25').value = compData.r25 !== undefined ? compData.r25 : 10000;
        document.getElementById('ntcBeta').value = compData.beta !== undefined ? compData.beta : 3950;
    } else if (compType === 'thermistor_ptc') {
        document.getElementById('ptcR25').value = compData.r25 !== undefined ? compData.r25 : 100;
        document.getElementById('ptcAlpha').value = compData.alpha !== undefined ? compData.alpha : 0.05;
    }
    if (isSlider) {
      const compSlider = document.getElementById('compSlider');
      // Setel batas Minimum dan Maksimum secara dinamis!
      if (compType.startsWith('thermistor')) {
          compSlider.min = -40;
          compSlider.max = 150;
      } else {
          compSlider.min = 0;  // Untuk LDR & Potensiometer
          compSlider.max = 100;
      }
      let val = parseInt(compData.state || '50');
      compSlider.value = val;
      document.getElementById('sliderValueDisplay').innerText = val;
      if (compType.startsWith('thermistor')) document.getElementById('sliderUnit').innerText = ' °C (Suhu)';
      else if (compType === 'ldr') document.getElementById('sliderUnit').innerText = ' % (Cahaya)';
      else document.getElementById('sliderUnit').innerText = ' % (Putaran)';
    }
    if (!hideText) {
      // --- LOGIKA MEMBACA NILAI KOMPONEN (DIPERBAIKI) ---
      // BUGFIX: sebelumnya defaulting nilai null hanya menangani 'fuse' dan
      // ditaruh di cabang yang sama dengan penentuan tampilan baterai (if/else if),
      // sehingga baterai/power_terminal dengan customValue null tidak pernah
      // menampilkan preset & nilainya. Sekarang defaulting dipisah dari tampilan.
      let val = compData.customValue;
      if (compType === 'voltage_divider') {
          val = subType === 'r1' ? (compData.r1Value || 10000) : (compData.r2Value || 10000);
      } else if (val == null) {
        if (compType === 'fuse') val = 10;
        else if (compType === 'resistor') val = 330;
        else if (compType === 'potentiometer') val = 10000; 
        else if (compType === 'capacitor') val = 10;
        else if (compType === 'battery_1cell') val = 1.5;
        else if (compType.startsWith('battery') || compType === 'power_terminal') val = 12;
      }
      else if (compType === 'thermistor_ntc') {
        const r25 = parseFloat(document.getElementById('ntcR25').value);
        const beta = parseFloat(document.getElementById('ntcBeta').value);
        if (isNaN(r25) || isNaN(beta) || r25 <= 0) return this.showToast('Error: Nilai R25 harus lebih dari 0 Ohm!');
        compData.r25 = r25;
        compData.beta = beta;
    } 
    else if (compType === 'thermistor_ptc') {
        const r25 = parseFloat(document.getElementById('ptcR25').value);
        const alpha = parseFloat(document.getElementById('ptcAlpha').value);
        if (isNaN(r25) || isNaN(alpha) || r25 <= 0) return this.showToast('Error: Nilai R25 harus lebih dari 0 Ohm!');
        compData.r25 = r25;
        compData.alpha = alpha;
    }
      if (compType.startsWith('battery') || compType === 'power_terminal') {
        if (unitSelect) unitSelect.innerHTML = '<option value="1">V (Volt)</option>';
        document.getElementById('valCurrent').textContent = `${val} V`;
        if (batteryPresets) batteryPresets.style.display = 'block';
      }
      if (compType === 'fuse') {
        if (unitSelect) unitSelect.innerHTML = '<option value="1">A (Ampere)</option>';
        document.getElementById('valCurrent').textContent = `${val} A`;
        if (fusePresets) fusePresets.style.display = 'block';
      } else if (compType === 'resistor' || compType === 'voltage_divider' || compType === 'potentiometer') {
        if (unitSelect) unitSelect.innerHTML = '<option value="1">Ω</option><option value="1000">kΩ</option><option value="1000000">MΩ</option>';
        if (val >= 1000000) { if (unitSelect) unitSelect.value = "1000000"; document.getElementById('compValue').value = val/1000000; }
        else if (val >= 1000) { if (unitSelect) unitSelect.value = "1000"; document.getElementById('compValue').value = val/1000; }
        else { if (unitSelect) unitSelect.value = "1"; document.getElementById('compValue').value = val; }
        document.getElementById('valCurrent').textContent = `${val >= 1000000 ? (val/1000000)+' MΩ' : (val >= 1000 ? (val/1000)+' kΩ' : val+' Ω')}`;
        if (resistorPresets) resistorPresets.style.display = 'block';
      } else if (compType === 'capacitor') {
        if (unitSelect) unitSelect.innerHTML = '<option value="1">µF</option><option value="1000">mF</option><option value="1000000">F</option>';
        if (val >= 1000000) { if (unitSelect) unitSelect.value = "1000000"; document.getElementById('compValue').value = val/1000000; }
        else if (val >= 1000) { if (unitSelect) unitSelect.value = "1000"; document.getElementById('compValue').value = val/1000; }
        else { if (unitSelect) unitSelect.value = "1"; document.getElementById('compValue').value = val; }
        document.getElementById('valCurrent').textContent = `${val >= 1000 ? (val/1000)+' mF' : val+' µF'}`;
        if (capacitorPresets) capacitorPresets.style.display = 'block';
      }
      if (compType === 'fuse' || compType.startsWith('battery') || compType === 'power_terminal') {
    document.getElementById('compValue').value = val; }
    }

    document.getElementById('valueModal').classList.add('show');
    if (!isSlider) document.getElementById('compValue').focus();
  },

  setPresetValue(val, multiplier) {
    document.getElementById('compValue').value = val;
    const unitSelect = document.getElementById('compUnit');
    if (unitSelect && unitSelect.options.length > 1) { 
      unitSelect.value = multiplier; 
    }
  },

  saveComponentValue() {
    if (!CircuitStore.currentEditingComponent) return;
    const compType = CircuitStore.currentEditingComponent.type;
    const compId = CircuitStore.currentEditingComponent.id;
    const compData = CircuitStore.components.find(c => c.id === compId);
    const comp = document.getElementById(`comp-${compId}`);

    let raw, unit;
    if (!['ldr', 'thermistor_ntc', 'thermistor_ptc', 'led', 'motor_dc'].includes(compType)) {
      raw = parseFloat(document.getElementById('compValue').value);
      const unitSelect = document.getElementById('compUnit');
      unit = unitSelect ? (parseFloat(unitSelect.value) || 1) : 1;

      if (isNaN(raw)) return this.showToast('Masukkan angka yang valid!');
      if (raw <= 0 && !['power_terminal', 'battery', 'battery_1cell', 'battery_multi', 'vsine'].includes(compType)) 
        return this.showToast('Nilai komponen pasif tidak boleh minus atau nol!');
    }
    if (compType === 'led') {
        const fv = parseFloat(document.getElementById('ledForwardV').value);
        if (isNaN(fv) || fv < 0) return this.showToast('Masukkan nilai LED yang valid!');
    }
    else if (compType === 'voltage_divider') {
        const r1 = parseFloat(document.getElementById('vdR1').value);
        const r2 = parseFloat(document.getElementById('vdR2').value);
        if (isNaN(r1) || isNaN(r2) || r1 <= 0 || r2 <= 0) return this.showToast('Error: Nilai R1 dan R2 harus lebih dari 0 Ohm!');
        compData.r1 = r1;
        compData.r2 = r2;
    }
    else if (compType === 'thermistor_ntc') {
        const r25 = parseFloat(document.getElementById('ntcR25').value);
        const beta = parseFloat(document.getElementById('ntcBeta').value);
        if (isNaN(r25) || isNaN(beta) || r25 <= 0) return this.showToast('Error: Nilai R25 harus lebih dari 0 Ohm!');
        compData.r25 = r25;
        compData.beta = beta;
    } 
    else if (compType === 'thermistor_ptc') {
        const r25 = parseFloat(document.getElementById('ptcR25').value);
        const alpha = parseFloat(document.getElementById('ptcAlpha').value);
        if (isNaN(r25) || isNaN(alpha) || r25 <= 0) return this.showToast('Error: Nilai R25 harus lebih dari 0 Ohm!');
        compData.r25 = r25;
        compData.alpha = alpha;
    }
    
    HistoryManager.saveStateToUndoStack(`Mengubah parameter ${compType}`);
    
    if (['potentiometer', 'ldr', 'thermistor_ntc', 'thermistor_ptc'].includes(compType)) {
      compData.state = document.getElementById('compSlider').value;
      if (compType === 'potentiometer') {
          compData.customValue = raw * unit;
      }
    } else if (compType === 'led') {
      compData.forwardV = parseFloat(document.getElementById('ledForwardV').value);
      compData.fullDriveI = parseFloat(document.getElementById('ledFullDriveI').value);
      compData.breakdownV = parseFloat(document.getElementById('ledBreakdownV').value);
    } else if (compType === 'motor_dc') {
      compData.ratedV = parseFloat(document.getElementById('motorRatedV').value);
      compData.maxRpm = parseFloat(document.getElementById('motorMaxRPM').value);
      compData.coilR = parseFloat(document.getElementById('motorCoilR').value);
    } else if (compType === 'opamp') {
        const pr = parseFloat(document.getElementById('opampPosRail').value);
        const nr = parseFloat(document.getElementById('opampNegRail').value);
        // Validasi fisik: V+ harus selalu lebih besar dari V-
        if (isNaN(pr) || isNaN(nr) || pr <= nr) {
            return this.showToast('Error: V+ (Positif) harus lebih besar dari V- (Negatif)!');
        }     
        compData.posRail = pr;
        compData.negRail = nr;
    } else {
     let finalVal = raw * unit;
      // Tambahkan 'power_terminal' ke dalam array pengecekan ini:
      if (!['fuse', 'battery', 'battery_1cell', 'battery_multi', 'power_terminal', 'capacitor'].includes(compType)) {
          finalVal = Math.round(finalVal);
      }
      if (compType === 'voltage_divider') {
          const subType = CircuitStore.currentEditingComponent.subType;
          if (subType === 'r1') compData.r1Value = finalVal;
          else compData.r2Value = finalVal;
      } else {
          compData.customValue = finalVal;
      }
      
      if (compData.type === 'fuse' && compData.state === 'blown') {
        compData.state = '0'; 
        if (comp) comp.dataset.state = '0'; 
      }
    }

    if (comp && compData) {
      const cd = document.getElementById(`content-${compId}`);
      if (cd) ComponentDefs.updateContent(compData.type, compId, compData, cd, comp);
    }
    
    this.closeValueModal();
    this.showToast('Parameter berhasil disimpan');
    if (CircuitStore.isSimulationActive) SimulationEngine.run();
  },

  closeValueModal() { 
    const modal = document.getElementById('valueModal');
    if (modal) modal.classList.remove('show'); 
    CircuitStore.currentEditingComponent = null; 
  },

  showTruthTable() {
    const allSwitches = CircuitStore.components.filter(c => c.type === 'switch' || c.type === 'switch_spst');
    const allOutputs  = CircuitStore.components.filter(c => c.type === 'led' || c.type === 'motor_dc' || c.type === 'solenoid' || c.type === 'logic_probe');
    
    if (!allSwitches.length) return this.showToast('Tambahkan minimal satu Switch Digital!');
    if (!allOutputs.length)  return this.showToast('Tambahkan minimal satu Komponen Output!');

    // 1. BANGUN PEMETAAN KONEKSI (Graph Adjacency List)
    let adj = {};
    CircuitStore.components.forEach(c => adj[c.id] = []);
    
    CircuitStore.connections.forEach(conn => {
        const srcComp = CircuitStore.components.find(c => c.id === conn.source.compId);
        const tgtComp = CircuitStore.components.find(c => c.id === conn.target.compId);
        
        // PENTING: Jangan jadikan Ground atau Sumber Daya sebagai jembatan penghubung antar sirkuit
        const ignoreTypes = ['ground', 'power_terminal', 'battery', 'battery_1cell', 'battery_multi', 'vsine'];
        if (srcComp && tgtComp && !ignoreTypes.includes(srcComp.type) && !ignoreTypes.includes(tgtComp.type)) {
            adj[conn.source.compId].push(conn.target.compId);
            adj[conn.target.compId].push(conn.source.compId);
        }
    });

    // 2. KELOMPOKKAN RANGKAIAN YANG TERPISAH (Clustering)
    let visited = new Set();
    let clusters = [];

    CircuitStore.components.forEach(c => {
        if (!visited.has(c.id)) {
            let cluster = new Set();
            let q = [c.id];
            visited.add(c.id);
            
            while(q.length > 0) {
                let curr = q.shift();
                cluster.add(curr);
                adj[curr].forEach(neighbor => {
                    if (!visited.has(neighbor)) {
                        visited.add(neighbor);
                        q.push(neighbor);
                    }
                });
            }
            clusters.push(cluster);
        }
    });

    // 3. PERSIAPKAN TAMPILAN UI
    const wasActive = CircuitStore.isSimulationActive;
    if (!wasActive) CircuitStore.isSimulationActive = true;

    const tableContainer = document.querySelector('#truthModal .modal-content > div[style*="overflow-x: auto"]');
    if (!tableContainer) return;
    tableContainer.innerHTML = ''; // Kosongkan tabel lama

    // Wrapper Flexbox untuk menjajarkan tabel secara responsif
    const flexWrapper = document.createElement('div');
    flexWrapper.style.display = 'flex';
    flexWrapper.style.flexWrap = 'wrap';
    flexWrapper.style.gap = '20px';
    flexWrapper.style.justifyContent = 'space-around';
    flexWrapper.style.alignItems = 'flex-start';
    tableContainer.appendChild(flexWrapper);

    const origStates = allSwitches.map(s => ({ id: s.id, state: s.state, val: s.element.dataset.state }));
    let validClusterCount = 0;

    // 4. BUAT TABEL UNTUK MASING-MASING RANGKAIAN (CLUSTER)
    clusters.forEach((cluster) => {
        const clusterSwitches = allSwitches.filter(s => cluster.has(s.id));
        const clusterOutputs = allOutputs.filter(o => cluster.has(o.id));

        // Hanya buat tabel jika di kelompok ini ada Input (Switch) DAN ada Output (LED)
        if (clusterSwitches.length > 0 && clusterOutputs.length > 0) {
            validClusterCount++;

            // Cari nama gerbang logika di kelompok ini untuk dijadikan Judul Tabel
            const logicGates = ['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'];
            const gatesInCluster = CircuitStore.components.filter(c => cluster.has(c.id) && logicGates.includes(c.type));
            
            let tableName = `Rangkaian ${validClusterCount}`;
            if (gatesInCluster.length === 1) {
                tableName = `Gerbang ${gatesInCluster[0].type.toUpperCase()}`; // Munculkan "Gerbang AND", dll.
            } else if (gatesInCluster.length > 1) {
                tableName = `Kombinasi Logika`;
            }

            const tableWrapper = document.createElement('div');
            tableWrapper.style.flex = '1 1 min-content';
            tableWrapper.style.minWidth = '150px';

            const title = document.createElement('h3');
            title.style.fontSize = '14px';
            title.style.marginBottom = '8px';
            title.style.color = 'var(--primary)';
            title.style.textAlign = 'center';
            title.innerText = tableName;
            tableWrapper.appendChild(title);

            const table = document.createElement('table');
            table.className = 'truth-table';
            table.style.marginTop = '0';
            
            // Header Tabel (Gunakan penamaan input A, B, C... untuk kesan edukatif)
            const inputLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
            let thead = '<thead><tr>';
            clusterSwitches.forEach((s, i) => thead += `<th>${inputLabels[i] || 'In'+(i+1)}</th>`);
            clusterOutputs.forEach((o, i) => thead += `<th>${o.type === 'led' ? 'LED' : (o.type === 'logic_probe' ? 'PROBE' : 'OUT')}</th>`);
            thead += '</tr></thead>';
            table.innerHTML = thead;

            const tbody = document.createElement('tbody');
            let rows = '';

            const numSwitches = clusterSwitches.length;
            if (numSwitches > 8) {
                rows = '<tr><td colspan="100%">Maks 8 Input!</td></tr>';
            } else {
                // Iterasi hanya untuk switch di sirkuit (cluster) ini saja
                for (let i = 0; i < Math.pow(2, numSwitches); i++) {
                    const bin = i.toString(2).padStart(numSwitches, '0');
                    
                    clusterSwitches.forEach((s, j) => { 
                        s.element.dataset.state = bin[j]; 
                        s.state = bin[j]; 
                    });
                    
                    SimulationEngine.run();

                    rows += '<tr>';
                    for (const b of bin) rows += `<td><strong>${b}</strong></td>`;
                    
                    clusterOutputs.forEach(o => {
                        const s = (o.simV > 1.5 || o.outputState === 1 || o.logicState === '1') ? '1' : '0';
                        rows += `<td style="background:${s==='1'?'var(--danger)':'var(--control-bg)'}; color:${s==='1'?'#fff':'var(--text-main)'}; font-weight:bold;">${s}</td>`;
                    });
                    rows += '</tr>';
                }
            }
            
            tbody.innerHTML = rows;
            table.appendChild(tbody);
            tableWrapper.appendChild(table);
            flexWrapper.appendChild(tableWrapper);
        }
    });

    // 5. KEMBALIKAN STATE AWAL SEMUA SWITCH
    allSwitches.forEach(s => {
        const orig = origStates.find(os => os.id === s.id);
        if (orig) { s.state = orig.state; s.element.dataset.state = orig.val; }
    });

    if (!wasActive) SimulationEngine.stop();
    else SimulationEngine.run();

    if (validClusterCount === 0) {
        flexWrapper.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-muted);">Tabel gagal dibuat. Pastikan kabel Input dan Output sudah terhubung ke gerbang logika.</p>';
    }

    const truthModal = document.getElementById('truthModal');
    if (truthModal) truthModal.classList.add('show');
  },

  closeTruthTable() { 
    const truthModal = document.getElementById('truthModal');
    if (truthModal) truthModal.classList.remove('show'); 
  }
};

// File: src/HistoryManager.js

const HistoryManager = {
  snapshotState(desc = '') {
    // OPTIMASI 1: Pemetaan Manual untuk Komponen (Sangat Cepat)
    // Karena properti yang diambil hanya tipe primitif (angka, string), 
    // pembuatan objek baru di dalam map() sudah memutus referensi memori (Deep Copy murni).
    const clonedComponents = CircuitStore.components.map(c => ({
  id: c.id, 
  type: c.type, 
  inputs: c.inputs, 
  outputs: c.outputs,
  x: c.x, 
  y: c.y, 
  state: c.state, 
  customValue: c.customValue,
  rotation: c.rotation || 0,
  locked: c.locked || false,
  freqValue: c.freqValue != null ? c.freqValue : null,
  r1Value: c.r1Value != null ? c.r1Value : null,
  r2Value: c.r2Value != null ? c.r2Value : null,
  forwardV: c.forwardV != null ? c.forwardV : null,
  fullDriveI: c.fullDriveI != null ? c.fullDriveI : null,
  breakdownV: c.breakdownV != null ? c.breakdownV : null,
  ratedV: c.ratedV != null ? c.ratedV : null,
  maxRpm: c.maxRpm != null ? c.maxRpm : null,
  coilR: c.coilR != null ? c.coilR : null
}));

   // OPTIMASI 2: Kloning Manual untuk struktur Koneksi bersarang (Nested)
    const clonedConnections = CircuitStore.connections.map(conn => ({
      id: conn.id, // 🟢 FIX 1: Simpan ID statis agar tidak menjadi zombie
      // Simpan juga type (input/output) untuk mendukung fitur "Kabel Bebas Arah" (V19)
      source: { compId: conn.source.compId, pinIndex: conn.source.pinIndex, type: conn.source.type || 'output' },
      target: { compId: conn.target.compId, pinIndex: conn.target.pinIndex, type: conn.target.type || 'input' },
      waypoints: conn.waypoints ? conn.waypoints.map(wp => ({ x: wp.x, y: wp.y })) : []
    }));

    return {
      components: clonedComponents,
      connections: clonedConnections,
      componentIdCounter: CircuitStore.componentIdCounter,
      description: desc
    };
  },

  autoSaveToLocalStorage() {
    // JSON.stringify di sini tetap ada HANYA karena localStorage memang wajib menerima String,
    // bukan karena kita ingin melakukan Deep Copy.
    try { localStorage.setItem('labCircuitAutoSave', JSON.stringify(this.snapshotState('Auto-save'))); } catch(e) {}
  },

  loadAutoSave() {
    try {
      const saved = localStorage.getItem('labCircuitAutoSave');
      if (saved) {
        const state = JSON.parse(saved);
        if (state.components && state.components.length > 0) {
          this.restoreState({ ...state, description: 'Auto-saved circuit' });
          CircuitStore.undoStack = []; CircuitStore.redoStack = []; this.updateUndoRedoButtons();
          return true;
        }
      }
    } catch(e) {}
    return false;
  },

  exportCircuit() {
    if (!CircuitStore.components.length) return UIManager.showToast('Tidak ada rangkaian untuk disimpan.');
    const data = this.snapshotState('Export');
    data.version = '18.2'; data.timestamp = new Date().toISOString();
    
    // Konversi ke format JSON untuk diunduh sebagai File
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `digital-circuit-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    UIManager.showToast('💾 Rangkaian berhasil tersimpan');
  },

  importCircuit() { document.getElementById('importFileInput').click(); },

  handleFileImport(e) {
    const file = e.target.files[0]; if (!file) return;
    if (!file.name.endsWith('.json')) return UIManager.showToast('File harus berformat .json');
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.components || !data.connections) throw new Error('Format tidak valid');
        if (CircuitStore.components.length) UIManager.showConfirmToast('Rangkaian saat ini akan diganti. Lanjutkan?', () => this.loadCircuitData(data));
        else this.loadCircuitData(data);
      } catch(err) { UIManager.showToast('Gagal membaca file: ' + err.message); }
    };
    reader.readAsText(file); e.target.value = '';
  },

  loadCircuitData(data) {
    if (CircuitStore.isSimulationActive) SimulationEngine.stop();
    CircuitStore.isUndoRedoOp = true;
    const safeCounter = data.componentIdCounter != null
      ? data.componentIdCounter
      : (data.components.length > 0 ? Math.max(...data.components.map(c => c.id)) : 0);
    this.restoreState({ components: data.components, connections: data.connections, componentIdCounter: safeCounter, description: 'Load' });
    CircuitStore.isUndoRedoOp = false;
    CircuitStore.undoStack = []; CircuitStore.redoStack = []; this.updateUndoRedoButtons();
    this.saveStateToUndoStack('Initial state after import');
    UIManager.showToast('📂 File berhasil terupload & dimuat');
  },

  saveStateToUndoStack(desc = '') {
    if (CircuitStore.isUndoRedoOp) return;
    CircuitStore.undoStack.push(this.snapshotState(desc));
    if (CircuitStore.undoStack.length > CircuitStore.maxUndo) CircuitStore.undoStack.shift();
    CircuitStore.redoStack = [];
    this.updateUndoRedoButtons();
    this.autoSaveToLocalStorage();
  },

  undo() {
    if (!CircuitStore.undoStack.length) return UIManager.showToast('Tidak ada aksi yang bisa di-undo');
    CircuitStore.redoStack.push(this.snapshotState('Current'));
    const prev = CircuitStore.undoStack.pop();
    CircuitStore.isUndoRedoOp = true; this.restoreState(prev); CircuitStore.isUndoRedoOp = false;
    this.updateUndoRedoButtons(); this.autoSaveToLocalStorage();
  },

  redo() {
    if (!CircuitStore.redoStack.length) return UIManager.showToast('Tidak ada aksi yang bisa di-redo');
    CircuitStore.undoStack.push(this.snapshotState('Current'));
    const next = CircuitStore.redoStack.pop();
    CircuitStore.isUndoRedoOp = true; this.restoreState(next); CircuitStore.isUndoRedoOp = false;
    this.updateUndoRedoButtons(); this.autoSaveToLocalStorage();
  },

  updateUndoRedoButtons() {
    const u = document.getElementById('btnUndo'); const r = document.getElementById('btnRedo');
    if (u) u.disabled = !CircuitStore.undoStack.length;
    if (r) r.disabled = !CircuitStore.redoStack.length;
  },

restoreState(state) {
    const canvas = document.getElementById('canvas');
    Array.from(canvas.children).forEach(child => {
      if (child.id !== 'wire-overlay' && child.id !== 'selection-box') child.remove();
    });
    
    const wireSvg = document.getElementById('wire-svg');
    // 🟢 FIX 2: Hapus SEMUA tag <path> tanpa mempedulikan atribut lama/barunya
    if (wireSvg) wireSvg.querySelectorAll('path').forEach(p => p.remove());

    CircuitStore.components = []; CircuitStore.connections = []; CircuitStore.clearSelection(); CircuitStore.connectionStart = null;
    CircuitStore.componentIdCounter = state.componentIdCounter;

    // HANYA ADA SATU LOOP forEach untuk components
    state.components.forEach(cd => {
      const compData = {
        id: cd.id, type: cd.type, inputs: cd.inputs, outputs: cd.outputs,
        x: cd.x, y: cd.y, state: cd.state || '0',
        customValue: cd.customValue, 
        rotation: cd.rotation || 0,
        locked: cd.locked || false, // Status kunci push button (latch)
        freqValue: cd.freqValue != null ? cd.freqValue : (cd.type === 'vsine' ? 1 : null), // 🟢 FIX: Kembalikan frekuensi V-Sine, fallback 1Hz hanya untuk data lama yang belum punya field ini
        r1Value: cd.r1Value != null ? cd.r1Value : (cd.type === 'voltage_divider' ? 10000 : null), // 🟢 FIX: Kembalikan R1 Voltage Divider, fallback 10k hanya untuk data lama
        r2Value: cd.r2Value != null ? cd.r2Value : (cd.type === 'voltage_divider' ? 10000 : null), // 🟢 FIX: Kembalikan R2 Voltage Divider, fallback 10k hanya untuk data lama
        forwardV: cd.forwardV != null ? cd.forwardV : (cd.type === 'led' ? 2.2 : null),
        fullDriveI: cd.fullDriveI != null ? cd.fullDriveI : (cd.type === 'led' ? 10 : null),
        breakdownV: cd.breakdownV != null ? cd.breakdownV : (cd.type === 'led' ? 4.0 : null),
        ratedV: cd.ratedV != null ? cd.ratedV : (cd.type === 'motor_dc' ? 12 : null),
        maxRpm: cd.maxRpm != null ? cd.maxRpm : (cd.type === 'motor_dc' ? 3000 : null),
        coilR: cd.coilR != null ? cd.coilR : (cd.type === 'motor_dc' ? 15 : null),
        simV: 0, simI: 0
      };
      const div = buildComponentElement(compData); 
      canvas.appendChild(div);
      CircuitStore.addComponent({ ...compData, element: div });
    });
    
    state.connections.forEach(conn => {
      CircuitStore.addConnection({
        id: conn.id, // 🟢 FIX 1: Kembalikan ID kabel statis dari memori (Undo/Load)
        source: { compId: parseInt(conn.source.compId), pinIndex: parseInt(conn.source.pinIndex || 0), type: conn.source.type || 'output' },
        target: { compId: parseInt(conn.target.compId), pinIndex: parseInt(conn.target.pinIndex || 0), type: conn.target.type || 'input' },
        waypoints: conn.waypoints ? conn.waypoints.map(wp => ({ x: wp.x, y: wp.y })) : []
      });
    });

    requestAnimationFrame(() => {
      drawConnections(); updateConnectionPointVisuals();
      if (CircuitStore.isSimulationActive) SimulationEngine.run();
    });
  }
};
