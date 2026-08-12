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
  coilR: c.coilR != null ? c.coilR : null,
  color: c.color != null ? c.color : null,
  r25: c.r25 != null ? c.r25 : null,
  beta: c.beta != null ? c.beta : null,
  alpha: c.alpha != null ? c.alpha : null,
  posRail: c.posRail != null ? c.posRail : null,
  negRail: c.negRail != null ? c.negRail : null,
  initialState: c.initialState != null ? c.initialState : null
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
    CircuitStore.hasUnsavedChanges = false;
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
    CircuitStore.hasUnsavedChanges = true;
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
        color: cd.color != null ? cd.color : (cd.type === 'led' ? 'red' : null),
        r25: cd.r25 != null ? cd.r25 : (cd.type === 'thermistor_ntc' ? 10000 : (cd.type === 'thermistor_ptc' ? 100 : null)),
        beta: cd.beta != null ? cd.beta : (cd.type === 'thermistor_ntc' ? 3950 : null),
        alpha: cd.alpha != null ? cd.alpha : (cd.type === 'thermistor_ptc' ? 0.05 : null),
        posRail: cd.posRail != null ? cd.posRail : ((cd.type === 'opamp' || cd.type === 'opamp_5pin') ? 15 : null),
        negRail: cd.negRail != null ? cd.negRail : ((cd.type === 'opamp' || cd.type === 'opamp_5pin') ? -15 : null),
        initialState: cd.initialState != null ? cd.initialState : (cd.type === 'clock_pulse' ? '0' : null),
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
