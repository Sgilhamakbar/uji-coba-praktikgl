// File: src/ui/UIManager.js

const UIManager = {
  currentZoom: 1,

  setZoom(val) {
    this.currentZoom = parseFloat(val);
    const canvas = document.getElementById('canvas');
    if (canvas) canvas.style.transform = `scale(${this.currentZoom})`;
    const zoomLabel = document.getElementById('zoomLabel');
    if (zoomLabel) zoomLabel.innerText = Math.round(this.currentZoom * 100) + '%';
    const zoomSlider = document.getElementById('zoomSlider');
    if (zoomSlider) zoomSlider.value = this.currentZoom;
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
    const existing = container.querySelectorAll('.toast');
    if (existing.length >= 3) existing[0].remove();
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

  openValueModal(compId, compType) {
    CircuitStore.currentEditingComponent = { id: Number(compId), type: compType };
    const comp = document.getElementById(`comp-${compId}`);
    const compData = CircuitStore.components.find(c => c.id === Number(compId));
    if (!comp || !compData) return;

    document.getElementById('valCompName').textContent = `${compType.toUpperCase()} - ID:${compId}`;
    const unitSelect = document.getElementById('compUnit');
    if (unitSelect) unitSelect.innerHTML = '';
    
    const fusePresets = document.getElementById('fusePresets');
    const resistorPresets = document.getElementById('resistorPresets');
    if (fusePresets) fusePresets.style.display = 'none';
    if (resistorPresets) resistorPresets.style.display = 'none';

    const isSlider = ['potentiometer', 'ldr', 'thermistor_ntc', 'thermistor_ptc'].includes(compType);
    
    const textInputGroup = document.getElementById('textInputGroup');
    const sliderInputGroup = document.getElementById('sliderInputGroup');
    const valCurrentWrapper = document.getElementById('valCurrentWrapper');
    
    if (textInputGroup) textInputGroup.style.display = isSlider ? 'none' : 'flex';
    if (sliderInputGroup) sliderInputGroup.style.display = isSlider ? 'block' : 'none';
    if (valCurrentWrapper) valCurrentWrapper.style.display = isSlider ? 'none' : 'block';

    if (isSlider) {
      let val = parseInt(compData.state || '50');
      document.getElementById('compSlider').value = val;
      document.getElementById('sliderValueDisplay').innerText = val;
      
      if (compType.startsWith('thermistor')) document.getElementById('sliderUnit').innerText = ' °C (Suhu)';
      else if (compType === 'ldr') document.getElementById('sliderUnit').innerText = ' Lux (Cahaya)';
      else document.getElementById('sliderUnit').innerText = ' % (Putaran)';
    } else {
      const val = compData.customValue || (compType === 'fuse' ? 10 : 330);
      if (compType === 'fuse') {
        if (unitSelect) unitSelect.innerHTML = '<option value="1">A (Ampere)</option>';
        document.getElementById('valCurrent').textContent = `${val} A`;
        if (fusePresets) fusePresets.style.display = 'block';
      } else if (compType === 'resistor') {
        if (unitSelect) unitSelect.innerHTML = '<option value="1">Ω</option><option value="1000">kΩ</option><option value="1000000">MΩ</option>';
        if (val >= 1000000) { if (unitSelect) unitSelect.value = "1000000"; document.getElementById('compValue').value = val/1000000; }
        else if (val >= 1000) { if (unitSelect) unitSelect.value = "1000"; document.getElementById('compValue').value = val/1000; }
        else { if (unitSelect) unitSelect.value = "1"; document.getElementById('compValue').value = val; }
        document.getElementById('valCurrent').textContent = `${val >= 1000 ? (val/1000)+' kΩ' : val+' Ω'}`;
        if (resistorPresets) resistorPresets.style.display = 'block';
      }
      if (compType === 'fuse') document.getElementById('compValue').value = val;
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

    HistoryManager.saveStateToUndoStack(`Mengubah parameter ${compType}`);

    if (['potentiometer', 'ldr', 'thermistor_ntc', 'thermistor_ptc'].includes(compType)) {
      compData.state = document.getElementById('compSlider').value;
    } else {
      const raw = parseFloat(document.getElementById('compValue').value);
      const unitSelect = document.getElementById('compUnit');
      const unit = unitSelect ? (parseFloat(unitSelect.value) || 1) : 1;
      
      if (isNaN(raw) || raw <= 0) return this.showToast('Masukkan nilai yang valid!');
      const finalVal = compType === 'fuse' ? raw : Math.round(raw * unit);
      compData.customValue = finalVal;
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
    const switches = CircuitStore.components.filter(c => c.type === 'switch');
    const outputs  = CircuitStore.components.filter(c => c.type === 'led' || c.type === 'diode' || c.type === 'motor_dc' || c.type === 'solenoid');
    if (!switches.length) return this.showToast('Tambahkan minimal satu Switch Digital!');
    if (!outputs.length)  return this.showToast('Tambahkan minimal satu Komponen Output!');
    if (switches.length > 8) return this.showToast('Maksimal 8 switch');

    const wasActive = CircuitStore.isSimulationActive;
    if (!wasActive) CircuitStore.isSimulationActive = true;

    const table = document.getElementById('modal-truth-table');
    const thead = table.querySelector('thead'), tbody = table.querySelector('tbody');

    let hdr = '<tr>';
    switches.forEach((s,i) => hdr += `<th>S${i+1}</th>`);
    outputs.forEach((o,i)  => hdr += `<th>${o.type.substring(0,3).toUpperCase()}${i+1}</th>`);
    hdr += '</tr>'; 
    thead.innerHTML = hdr;

    const origStates = switches.map(s => s.state);
    let rows = '';

    for (let i = 0; i < Math.pow(2, switches.length); i++) {
      const bin = i.toString(2).padStart(switches.length, '0');
      switches.forEach((s, j) => { s.element.dataset.state = bin[j]; s.state = bin[j]; });
      SimulationEngine.run();

      rows += '<tr>';
      for (const b of bin) rows += `<td><strong>${b}</strong></td>`;
      outputs.forEach(o => {
        const s = (o.simV > 1.5 || o.outputState === 1) ? '1' : '0';
        rows += `<td style="background:${s==='1'?'var(--danger)':'var(--control-bg)'}; color:${s==='1'?'#fff':'var(--text-main)'}; font-weight:bold;">${s}</td>`;
      });
      rows += '</tr>';
    }
    tbody.innerHTML = rows;

    switches.forEach((s,i) => {
      s.state = origStates[i];
      s.element.dataset.state = origStates[i];
    });

    if (!wasActive) SimulationEngine.stop();
    else SimulationEngine.run();

    const truthModal = document.getElementById('truthModal');
    if (truthModal) truthModal.classList.add('show');
  },

  closeTruthTable() { 
    const truthModal = document.getElementById('truthModal');
    if (truthModal) truthModal.classList.remove('show'); 
  }
};