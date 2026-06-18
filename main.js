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
window.openValueModal = (id, type) => UIManager.openValueModal(id, type);
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
window.adjustSensorValue = (id, delta) => {
  const comp = CircuitStore.components.find(c => c.id === id);
  if (!comp) return;
  let val = parseInt(comp.state || '50');
  val += delta;
  
  if (val > 100) val = 100;
  if (val < 0) val = 0;
  comp.state = val.toString();
  
  const cd = document.getElementById(`content-${id}`);
  if (cd) ComponentDefs.updateDOMState(comp.type, comp, cd, id);
  
  clearTimeout(window.sensorSaveTimeout);
  window.sensorSaveTimeout = setTimeout(() => {
    HistoryManager.saveStateToUndoStack(`Mengatur nilai ${comp.type}`);
  }, 500);

  if (CircuitStore.isSimulationActive) SimulationEngine.run();
};


// ─── Multi Selection Logic ────────────────────────────────────────────────────
function clearSelection() {
  document.querySelectorAll('.circuit-component').forEach(c => c.classList.remove('selected'));
  CircuitStore.selectedComponents = [];
}

function selectComponent(id) {
  clearSelection();
  CircuitStore.selectedComponents = [id];
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
    customValue: (type === 'resistor') ? 330 : (type === 'fuse' ? 10 : (type === 'battery' ? 12 : null)),
    inputStates: new Array(inputs).fill(0), outputState: 0,
    simV: 0, simI: 0
  };
  
  const div = buildComponentElement(compData);
  document.getElementById('canvas').appendChild(div);
  CircuitStore.components.push({ ...compData, element: div });
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
  if (type === 'fuse' && !compData.customValue) compData.customValue = 10;
  if (type === 'battery' && !compData.customValue) compData.customValue = 12;

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  deleteBtn.addEventListener('touchstart', e => { e.stopPropagation(); e.preventDefault(); deleteSingleComponent(id); }, {passive: false});
  deleteBtn.onclick = e => { e.stopPropagation(); e.preventDefault(); deleteSingleComponent(id); };
  div.appendChild(deleteBtn);

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


// ─── Connection points ─────────────────────────────────────────────────────────
function createConnection(srcId, srcPin, tgtId, tgtPin, waypoints = []) {
  CircuitStore.connections.push({ 
    source: { compId: Number(srcId), pinIndex: Number(srcPin) }, 
    target: { compId: Number(tgtId), pinIndex: Number(tgtPin) },
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
    case 'switch_spst':   x = pinType === 'input' ? 0 : 80; y = 20; break;
    case 'relay':         if (pinType === 'input') { x = 0; y = index === 0 ? 20 : 60; } else { x = 80; y = index === 0 ? 20 : 60; if (index === 0) pt.dataset.polarity = 'neg'; } break;
    case 'ground':        x = 20; y = 0; pt.dataset.polarity = 'neg'; break;
    case 'fuse': case 'resistor': case 'ldr': case 'thermistor_ntc': case 'thermistor_ptc': 
                          x = pinType === 'input' ? 0 : 80; y = 25; break;
    case 'potentiometer': if (pinType === 'input') { x = index === 0 ? 0 : 80; y = 20; } else { x = 40; y = 60; } break;
    case 'motor_dc':      x = pinType === 'input' ? 0 : 80; y = 40; break;
    case 'servo':         x = 0; y = index === 0 ? 20 : (index === 1 ? 40 : 60); break;
    case 'solenoid':      x = pinType === 'input' ? 0 : 80; y = 30; break;
    case 'led':           x = pinType === 'input' ? 0 : 60; y = 30; break;
    case 'diode':         x = pinType === 'input' ? 0 : 60; y = 20; break;
    case 'switch':        x = 60; y = 20; break;
    case 'junction':      x = pinType === 'input' ? 0 : 60; y = pinType === 'input' ? 30 : (index === 0 ? 10 : index === 1 ? 30 : 50); break;
    case 'wire_1to1':     x = pinType === 'input' ? 0 : 60; y = 20; break;
    case 'wire_1to2':     x = pinType === 'input' ? 0 : 60; y = pinType === 'input' ? 30 : (index === 0 ? 15 : 45); break;
    case 'opamp':         if (pinType === 'input') { x = 0; y = index === 0 ? 18 : 42; } else { x = 80; y = 30; } break;
    case 'voltmeter':     x = index === 0 ? 0 : 80; y = 40; if (index === 1) pt.dataset.polarity = 'neg'; break;
    case 'ammeter':       x = pinType === 'input' ? 0 : 80; y = 40; break;
    case 'transformer':
      if (pinType === 'input') { x = 0; y = index === 0 ? 30 : 70; } 
      else { x = 100; y = index === 0 ? 20 : (index === 1 ? 50 : 80); }
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
  document.querySelectorAll('.connection-point.input').forEach(p => { p.classList.remove('connected'); p.title = 'Klik untuk menghubungkan'; });
  CircuitStore.connections.forEach(conn => {
    const el = document.querySelector(`#comp-${conn.target.compId} .connection-point.input[data-point-index="${conn.target.pinIndex}"]`);
    if (el) { el.classList.add('connected'); el.title = 'Input terhubung (klik untuk ganti)'; }
  });
}

function deleteConnection(srcId, srcPin, tgtId, tgtPin) {
  HistoryManager.saveStateToUndoStack('Menghapus kabel'); 
  const before = CircuitStore.connections.length;
  CircuitStore.connections = CircuitStore.connections.filter(c => !(c.source.compId===srcId && c.source.pinIndex===srcPin && c.target.compId===tgtId && c.target.pinIndex===tgtPin));
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

  let srcId, srcPin, tgtId, tgtPin;
  if (startType === 'output' && type === 'input') { srcId = CircuitStore.connectionStart.compId; srcPin = CircuitStore.connectionStart.index; tgtId = compId; tgtPin = index; }
  else if (startType === 'input' && type === 'output') { srcId = compId; srcPin = index; tgtId = CircuitStore.connectionStart.compId; tgtPin = CircuitStore.connectionStart.index; }
  else { srcId = CircuitStore.connectionStart.compId; srcPin = CircuitStore.connectionStart.index; tgtId = compId; tgtPin = index; }

  CircuitStore.connectionStart = null;

  if (srcId === tgtId) return UIManager.showToast('Tidak bisa menghubungkan ke komponen yang sama');
  const exists = CircuitStore.connections.find(c =>
    (c.source.compId === srcId && c.source.pinIndex === srcPin && c.target.compId === tgtId && c.target.pinIndex === tgtPin) ||
    (c.source.compId === tgtId && c.source.pinIndex === tgtPin && c.target.compId === srcId && c.target.pinIndex === srcPin)
  );
  if (exists) return UIManager.showToast('Koneksi ini sudah ada');

  HistoryManager.saveStateToUndoStack('Menambahkan kabel');
  createConnection(srcId, srcPin, tgtId, tgtPin);
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
  
  svg.querySelectorAll('path[data-wire]').forEach(p => p.remove());

  CircuitStore.connections.forEach((conn, idx) => {
    const compS = CircuitStore.components.find(c=>c.id === conn.source.compId);
    const compT = CircuitStore.components.find(c=>c.id === conn.target.compId);
    if (!compS || !compT) return;

    let sp = getPinPosition(conn.source.compId, 'output', conn.source.pinIndex) || getPinPosition(conn.source.compId, 'input', conn.source.pinIndex);
    let tp = getPinPosition(conn.target.compId, 'input',  conn.target.pinIndex) || getPinPosition(conn.target.compId, 'output',  conn.target.pinIndex);
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
        } 
        else {
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

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathStr);

    const isGroundWire = sp.isNeg || tp.isNeg;
    path.setAttribute('stroke', isGroundWire ? '#000000' : 'var(--wire-default)');
    if (isGroundWire) path.classList.add('wire-ground-base');

    path.setAttribute('fill', 'none');
    path.setAttribute('data-wire', idx);
    path.dataset.sId = conn.source.compId; path.dataset.sIdx = conn.source.pinIndex;
    path.dataset.tId = conn.target.compId; path.dataset.tIdx = conn.target.pinIndex;
    path.style.pointerEvents = 'stroke'; path.style.cursor = 'pointer';

    const handleDel = (e) => { 
        e.stopPropagation(); e.preventDefault(); 
        UIManager.showConfirmToast('Hapus kabel ini?', () => { deleteConnection(+path.dataset.sId, +path.dataset.sIdx, +path.dataset.tId, +path.dataset.tIdx); }); 
    };
    path.addEventListener('click', handleDel); path.addEventListener('touchstart', handleDel, {passive: false});
    svg.appendChild(path);
  });
  updateConnectionPointVisuals();
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

  let localSaveTimeout = null;

  function onMove(e) {
    const dx = (e.clientX - startX) / UIManager.currentZoom;
    const dy = (e.clientY - startY) / UIManager.currentZoom;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true;

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
    drawConnections();
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
      drawConnections();
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
    CircuitStore.connections = CircuitStore.connections.filter(c => c.source.compId !== id && c.target.compId !== id);
    const el = document.getElementById(`comp-${id}`);
    if (el) el.remove();
    CircuitStore.components = CircuitStore.components.filter(c => c.id !== id);
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
  CircuitStore.connections = CircuitStore.connections.filter(c => c.source.compId !== id && c.target.compId !== id);
  const el = document.getElementById(`comp-${id}`);
  if (el) el.remove();

  CircuitStore.components = CircuitStore.components.filter(c => c.id !== id);
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
    if (wireSvg) wireSvg.querySelectorAll('path[data-wire]').forEach(p => p.remove());

    CircuitStore.components = []; CircuitStore.connections = []; clearSelection(); CircuitStore.connectionStart = null;
    CircuitStore.componentIdCounter = 0;

    if (CircuitStore.isSimulationActive) SimulationEngine.stop();
    HistoryManager.autoSaveToLocalStorage();
  });
}

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); HistoryManager.undo(); }
  if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) { e.preventDefault(); HistoryManager.redo(); }
  if (e.key === 'Delete') {
    const activeTag = document.activeElement.tagName;
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;
    if (CircuitStore.selectedComponents.length > 0) deleteSelectedComponents();
  }
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

window.addEventListener('DOMContentLoaded', init);