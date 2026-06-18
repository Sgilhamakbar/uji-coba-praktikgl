// File: src/engine/SimulationEngine.js

const SimulationEngine = {
  toggle() {
    CircuitStore.isSimulationActive ? this.stop() : this.start();
  },

  start() {
    CircuitStore.isSimulationActive = true;
    const btn = document.getElementById('btnSimulate');
    if (btn) btn.classList.add('active');
    
    const simText = document.getElementById('simText');
    if (simText) simText.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Stop Simulasi';
    
    const simInd = document.getElementById('simIndicator');
    if (simInd) simInd.classList.replace('status-ready', 'status-active');

    CircuitStore.components.forEach(c => {
      if (c.type === 'fuse' && c.state === 'blown') {
        c.state = '0';
        const el = document.getElementById(`comp-${c.id}`);
        if (el) el.dataset.state = '0';
      }
      // Reset state memori gerbang logika di awal simulasi
      if (['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'].includes(c.type)) {
        c.inputStates = new Array(c.inputs).fill(0);
        c.outputState = 0;
      }
    });

    this.run();
  },

  stop() {
    CircuitStore.isSimulationActive = false;
    const btn = document.getElementById('btnSimulate');
    if (btn) btn.classList.remove('active');
    
    const simText = document.getElementById('simText');
    if (simText) simText.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Mulai Simulasi';
    
    const simInd = document.getElementById('simIndicator');
    if (simInd) simInd.classList.replace('status-active', 'status-ready');

    CircuitStore.components.forEach(comp => {
      comp.simV = 0; 
      comp.simI = 0; 
      comp.simV_signal = 0;
      comp.inputStates = new Array(comp.inputs).fill(0);
      comp.outputState = 0;
      
      if (comp.type === 'led' || comp.type === 'diode') {
        comp.element.dataset.state = '0';
        comp.state = '0';
      }
      
      const cd = document.getElementById(`content-${comp.id}`);
      if (cd) ComponentDefs.updateContent(comp.type, comp.id, comp, cd, comp.element);
    });

    document.querySelectorAll('#wire-svg path').forEach(p => {
      p.classList.remove('wire-active', 'wire-12v', 'wire-5v');
    });
  },

  run() {
    if (!CircuitStore.isSimulationActive) return;

    let changed = true;
    let iter = 0;
    let globalPathActiveIds = new Set();
    let globalNodeVoltages = new Map();

    // Set dasar Switch Digital sebelum perulangan fisika
    CircuitStore.components.forEach(c => {
      if (c.type === 'switch') {
        c.outputState = c.state === '1' ? 1 : 0;
        c.simV = c.outputState ? 5 : 0;
      }
    });

    // Loop Stabilisasi Umpan Balik (Feedback Loop)
    while (changed && iter < 15) {
      changed = false;
      iter++;
      globalPathActiveIds = new Set();
      globalNodeVoltages = new Map();

      // --- 1. Evaluasi Logika Digital (Konversi Fisika Analog ke Digital) ---
      CircuitStore.components.forEach(c => {
        if (['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'].includes(c.type)) {
          if (!c.inputStates) c.inputStates = new Array(c.inputs).fill(0);
          
          // Konversi tegangan nyata kabel (> 2.5V) menjadi logika 1
          const binIns = c.inputStates.map(v => v >= 2.5 ? 1 : 0);
          let out = 0;
          
          if (c.type === 'not') out = binIns[0] ? 0 : 1;
          else {
            const [a, b] = binIns;
            switch(c.type) {
              case 'and': out = (a & b); break;
              case 'or': out = (a | b); break;
              case 'nand': out = (a & b) ? 0 : 1; break;
              case 'nor': out = (a | b) ? 0 : 1; break;
              case 'xor': out = (a ^ b); break;
              case 'xnor': out = (a === b) ? 1 : 0; break;
            }
          }
          
          if (c.outputState !== out) {
             c.outputState = out;
             c.simV = out ? 5 : 0;
             changed = true; // Jika ada IC yang berubah state, ulang perhitungan fisikanya
          }
        }
      });

      // --- 2. Pemetaan Sambungan (Clustering DFS) ---
      let adj = {};
      CircuitStore.components.forEach(c => adj[c.id] = new Set());
      CircuitStore.connections.forEach(conn => {
        adj[conn.source.compId].add(conn.target.compId);
        adj[conn.target.compId].add(conn.source.compId);
      });

      let visited = new Set();
      let clusters = [];
      CircuitStore.components.forEach(c => {
        if (!visited.has(c.id)) {
          let cluster = [];
          let q = [c.id];
          visited.add(c.id);
          while(q.length > 0) {
            let curr = q.pop();
            cluster.push(CircuitStore.components.find(comp => comp.id === curr));
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

      // --- 3. Evaluasi Fisika DC Per Cluster ---
      clusters.forEach(cluster => {
        let highNet = new Set(); let lowNet = new Set(); let link = {};

        function tie(a, b) {
          if (!link[a]) link[a] = []; if (!link[b]) link[b] = [];
          link[a].push(b); link[b].push(a);
        }

        let sourceVoltage = 0;
        let localNodeVoltages = new Map();

        // 3a. Ikat pin-pin internal komponen
        cluster.forEach(c => {
          if (c.type === 'switch_spst' && c.state === '0') return; // Jangan diikat jika saklar mati
          if (c.type === 'fuse' && c.state === 'blown') return;
          if (c.type === 'voltmeter' || c.type === 'servo') return;

          // Tie untuk semua komponen pass-through (Termasuk Amperemeter)
          if (['junction', 'wire_1to2', 'potentiometer', 'ldr', 'thermistor_ntc', 'thermistor_ptc', 'motor_dc', 'solenoid', 'switch_spst'].includes(c.type) || 
             (c.inputs > 0 && c.outputs > 0 && !['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor', 'transformer'].includes(c.type))) {
            tie(`c${c.id}_in0`, `c${c.id}_out0`);
          }

          if (c.type === 'relay' && c.state === '1') { tie(`c${c.id}_in1`, `c${c.id}_out1`); }
          if (c.type === 'junction' || c.type === 'wire_1to2') {
            tie(`c${c.id}_in0`, `c${c.id}_out0`); tie(`c${c.id}_in0`, `c${c.id}_out1`);
            if (c.type === 'junction') tie(`c${c.id}_in0`, `c${c.id}_out2`);
          }

          if ((c.type === 'bjt_npn' || c.type === 'mosfet_n') && c.state === '1') { tie(`c${c.id}_in1`, `c${c.id}_out0`); }
          if ((c.type === 'bjt_pnp' || c.type === 'mosfet_p') && c.state === '1') { tie(`c${c.id}_in1`, `c${c.id}_out0`); }

          if (c.type === 'transformer') {
             tie(`c${c.id}_in0`, `c${c.id}_in1`); 
             tie(`c${c.id}_out0`, `c${c.id}_out1`); 
             tie(`c${c.id}_out1`, `c${c.id}_out2`); 
          }

          if (c.type === 'battery') sourceVoltage = 12;
        });

        // 3b. Ikat pin-pin antar kabel (Connections)
        CircuitStore.connections.forEach(conn => {
          if (cluster.some(c => c.id === conn.source.compId)) {
            let sPinStr = `c${conn.source.compId}_out${conn.source.pinIndex}`;
            let sCompType = CircuitStore.components.find(c=>c.id===conn.source.compId)?.type;
            if (['voltmeter', 'servo'].includes(sCompType)) sPinStr = `c${conn.source.compId}_in${conn.source.pinIndex}`;
            if (sCompType === 'battery') sPinStr = `c${conn.source.compId}_out${conn.source.pinIndex}`;
            
            let tPinStr = `c${conn.target.compId}_in${conn.target.pinIndex}`;
            let tCompType = CircuitStore.components.find(c=>c.id===conn.target.compId)?.type;
            if (tCompType === 'battery') tPinStr = `c${conn.target.compId}_out${conn.target.pinIndex}`;
            tie(sPinStr, tPinStr);
          }
        });

        let strictSinks = new Set(); let strictSources = new Set(); 
        let qHigh = []; let qLow = [];

        // 3c. Tentukan titik sumber dan massa
        cluster.forEach(c => {
          if (c.type === 'battery') { strictSources.add(`c${c.id}_out0`); strictSinks.add(`c${c.id}_out1`); qHigh.push(`c${c.id}_out0`); qLow.push(`c${c.id}_out1`); localNodeVoltages.set(`c${c.id}_out0`, 12); }
          if (c.type === 'ground') { strictSinks.add(`c${c.id}_in0`); qLow.push(`c${c.id}_in0`); }
          if (c.type === 'switch' && c.outputState === 1) { strictSources.add(`c${c.id}_out0`); qHigh.push(`c${c.id}_out0`); localNodeVoltages.set(`c${c.id}_out0`, 5); }
          
          if (['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'].includes(c.type)) {
            // Output IC memancarkan 5V nyata ke dalam kabel jika aktif
            if (c.outputState === 1) { strictSources.add(`c${c.id}_out0`); qHigh.push(`c${c.id}_out0`); localNodeVoltages.set(`c${c.id}_out0`, 5); } 
            else { strictSinks.add(`c${c.id}_out0`); qLow.push(`c${c.id}_out0`); }
          }
        });

        // 3d. Propagasi Tegangan Dasar Menyelusuri Kabel
        while (qHigh.length > 0) {
          let curr = qHigh.pop();
          if (!highNet.has(curr)) { 
            highNet.add(curr); 
            globalNodeVoltages.set(curr, localNodeVoltages.get(curr) || sourceVoltage || 5); 
            if (link[curr]) { 
              link[curr].forEach(n => { 
                if (!highNet.has(n) && !strictSinks.has(n)) { 
                  localNodeVoltages.set(n, localNodeVoltages.get(curr)); 
                  qHigh.push(n); 
                } 
              }); 
            } 
          }
        }
        while (qLow.length > 0) {
          let curr = qLow.pop();
          if (!lowNet.has(curr)) { 
            lowNet.add(curr); 
            if (link[curr]) { 
              link[curr].forEach(n => { 
                if (!lowNet.has(n) && !strictSources.has(n)) qLow.push(n); 
              }); 
            } 
          }
        }

        // 3e. Evaluasi Pembagi Tegangan Analog (Potensiometer)
        let analogAdded = false;
        cluster.forEach(c => {
            if (c.type === 'potentiometer') {
                let pIn0 = `c${c.id}_in0`; let pIn1 = `c${c.id}_in1`;
                if (highNet.has(pIn0) && lowNet.has(pIn1)) {
                    let ratio = parseInt(c.state || '50') / 100;
                    let baseV = globalNodeVoltages.get(pIn0) || sourceVoltage;
                    let wiperV = baseV * ratio;
                    let pOut0 = `c${c.id}_out0`; 
                    if (wiperV > 0) { strictSources.add(pOut0); qHigh.push(pOut0); localNodeVoltages.set(pOut0, wiperV); analogAdded = true; }
                }
                else if (highNet.has(pIn1) && lowNet.has(pIn0)) {
                    let ratio = parseInt(c.state || '50') / 100;
                    let baseV = globalNodeVoltages.get(pIn1) || sourceVoltage;
                    let wiperV = baseV * (1 - ratio);
                    let pOut0 = `c${c.id}_out0`;
                    if (wiperV > 0) { strictSources.add(pOut0); qHigh.push(pOut0); localNodeVoltages.set(pOut0, wiperV); analogAdded = true; }
                }
            }
        });

        if (analogAdded) {
            while (qHigh.length > 0) {
              let curr = qHigh.pop();
              if (!highNet.has(curr)) { 
                highNet.add(curr); globalNodeVoltages.set(curr, localNodeVoltages.get(curr)); 
                if (link[curr]) { 
                  link[curr].forEach(n => { 
                    if (!highNet.has(n) && !strictSinks.has(n)) { 
                      localNodeVoltages.set(n, localNodeVoltages.get(curr)); qHigh.push(n); 
                    } 
                  }); 
                } 
              }
            }
        }

        let pathActiveIds = new Set(); let totalResistance = 0; let activeConsumers = [];

        // 3f. Hitung Total Hambatan Beban & Tentukan Alur Arus
        cluster.forEach(c => {
          let hasHigh = false; let hasLow = false;
          const pinChecks = [`c${c.id}_in0`, `c${c.id}_in1`, `c${c.id}_out0`, `c${c.id}_out1`, `c${c.id}_out2`];
          pinChecks.forEach(p => { if (highNet.has(p)) hasHigh = true; if (lowNet.has(p)) hasLow = true; });

          if (hasHigh && hasLow) {
            if (c.type === 'led' || c.type === 'diode') totalResistance += 100;
            if (c.type === 'resistor') totalResistance += (c.customValue || 330);
            if (c.type === 'motor_dc') totalResistance += 20; 
            if (c.type === 'solenoid') totalResistance += 30; 
            if (c.type === 'ldr') {
                let lux = parseInt(c.state || '50');
                totalResistance += Math.max(100, 100000 - (lux * 990)); 
            }
            if (c.type === 'thermistor_ntc') {
                let temp = parseInt(c.state || '50');
                totalResistance += Math.max(100, 10000 - (temp * 90));
            }
            if (c.type === 'thermistor_ptc') {
                let temp = parseInt(c.state || '50');
                totalResistance += Math.max(100, 100 + (temp * 99));
            }
            if (c.type === 'transformer') totalResistance += 50;
            
            if (!['relay', 'potentiometer', 'voltmeter'].includes(c.type)) activeConsumers.push(c);
            
            // ---> PERBAIKAN FATAL: Memastikan semua komponen yang dilewati aliran (termasuk Amperemeter) dihitung arusnya
            if (c.type !== 'voltmeter') pathActiveIds.add(c.id); 
          }

          // Perilaku Komponen Kompleks
          if (c.type === 'relay') {
            let coilHigh = highNet.has(`c${c.id}_in0`) || highNet.has(`c${c.id}_out0`);
            let coilLow = lowNet.has(`c${c.id}_in0`) || lowNet.has(`c${c.id}_out0`);
            let prevState = c.state;
            if (coilHigh && coilLow) { c.state = '1'; totalResistance += 80; activeConsumers.push(c); pathActiveIds.add(c.id); } 
            else { c.state = '0'; }
            if (prevState !== c.state) changed = true;
          } 
          else if (['bjt_npn', 'bjt_pnp', 'mosfet_n', 'mosfet_p'].includes(c.type)) {
            const isControlHigh = highNet.has(`c${c.id}_in0`); const isControlLow = lowNet.has(`c${c.id}_in0`);
            let prevState = c.state;
            if (c.type === 'bjt_npn' || c.type === 'mosfet_n') { c.state = isControlHigh ? '1' : '0'; } 
            else { c.state = isControlLow ? '1' : '0'; }
            if (c.state === '1') { totalResistance += (c.type.startsWith('mosfet') ? 0.5 : 10); pathActiveIds.add(c.id); }
            if (prevState !== c.state) changed = true;
          }
          else if (c.type === 'servo') {
              let vccHigh = highNet.has(`c${c.id}_in1`);
              let gndLow = lowNet.has(`c${c.id}_in2`);
              if (vccHigh && gndLow) {
                  c.simV = 5; 
                  c.simV_signal = globalNodeVoltages.get(`c${c.id}_in0`) || 0; 
                  totalResistance += 50;
                  pathActiveIds.add(c.id);
                  activeConsumers.push(c);
              }
          }
          else if (c.type === 'voltmeter') {
             let pin0High = highNet.has(`c${c.id}_in0`); let pin0Low  = lowNet.has(`c${c.id}_in0`);
             let pin1High = highNet.has(`c${c.id}_in1`); let pin1Low  = lowNet.has(`c${c.id}_in1`);
             let v0 = 0, v1 = 0;

             if (totalResistance === 0) {
                 if (pin0High && !pin0Low) v0 = sourceVoltage;
                 if (pin1High && !pin1Low) v1 = sourceVoltage;
             } else {
                 if (pin0High) v0 = sourceVoltage;
                 if (pin1High) v1 = sourceVoltage;
                 if (strictSinks.has(`c${c.id}_in1`)) v1 = 0;
                 if (strictSinks.has(`c${c.id}_in0`)) v0 = 0;
                 if (pin0High && pin1High && v0 === v1) v1 = 0; 
             }
             c.simV = v0 - v1;
             if (Math.abs(c.simV) > 0) pathActiveIds.add(c.id);
          }
        });

        // 3g. Proteksi Korsleting
        let isShortCircuit = false;
        for (let node of highNet) { if (lowNet.has(node)) { isShortCircuit = true; break; } }
        if (isShortCircuit) {
          const fuses = cluster.filter(f => f.type === 'fuse' && f.state !== 'blown' && (highNet.has(`c${f.id}_in0`) || highNet.has(`c${f.id}_out0`)) );
          if (fuses.length > 0) { fuses[0].state = 'blown'; fuses[0].simV = 0; this.stop(); UIManager.showToast('💥 Sekering Putus! Terjadi Korsleting', 3000); return; }
          if (activeConsumers.length === 0) { totalResistance = 0.001; }
        }

        let systemCurrent = totalResistance > 0 ? (sourceVoltage / totalResistance) : 0;

        // 3h. Terapkan Tegangan & Arus
        cluster.forEach(c => {
          if (pathActiveIds.has(c.id) && !['voltmeter', 'switch', 'servo', 'and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'].includes(c.type)) {
            c.simI = systemCurrent;
            c.simV = globalNodeVoltages.get(`c${c.id}_in0`) || sourceVoltage || 0;
          } else if (!['servo', 'voltmeter', 'switch', 'and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'].includes(c.type)) { 
            c.simI = 0; 
            c.simV = globalNodeVoltages.get(`c${c.id}_in0`) || 0;
          }
          
          if (c.type === 'fuse' && c.state !== 'blown') {
            if (systemCurrent > (c.customValue || 10)) {
              c.state = 'blown'; c.simI = 0; setTimeout(() => this.run(), 100);
            }
          }
          if (pathActiveIds.has(c.id)) { globalPathActiveIds.add(c.id); }
        });
      }); // Selesai Loop Cluster

      // --- 4. Umpan Balik: Kirim Tegangan Kabel kembali ke Input Gerbang Logika ---
      CircuitStore.components.forEach(c => {
        if (['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'].includes(c.type)) {
          let gateChanged = false;
          for (let i = 0; i < c.inputs; i++) {
            let v = globalNodeVoltages.get(`c${c.id}_in${i}`) || 0;
            let prevLogic = (c.inputStates[i] >= 2.5);
            let newLogic = (v >= 2.5);
            c.inputStates[i] = v;
            if (prevLogic !== newLogic) gateChanged = true;
          }
          if (gateChanged) changed = true; // Picu ulang loop untuk mematangkan state IC
        }
      });

    } 
    
    this.updateVisuals(globalPathActiveIds, globalNodeVoltages);
  },

  updateVisuals(activeSet, nodeVoltages) {
    CircuitStore.components.forEach(comp => {
      const cd = document.getElementById(`content-${comp.id}`);
      if (cd) ComponentDefs.updateContent(comp.type, comp.id, comp, cd, comp.element);
    });

    document.querySelectorAll('#wire-svg path[data-wire]').forEach(path => {
      const sId = parseInt(path.dataset.sId); const sIdx = parseInt(path.dataset.sIdx);
      const tId = parseInt(path.dataset.tId); const tIdx = parseInt(path.dataset.tIdx);
      
      path.classList.remove('wire-active', 'wire-12v', 'wire-5v', 'wire-gnd');
      if (path.classList.contains('wire-ground-base')) { path.classList.add('wire-gnd'); return; }

      const compS = CircuitStore.components.find(c => c.id === sId);
      const compT = CircuitStore.components.find(c => c.id === tId);

      let sPinStr = `c${sId}_out${sIdx}`;
      if (['voltmeter', 'servo'].includes(compS?.type)) sPinStr = `c${sId}_in${sIdx}`;
      if (compS?.type === 'battery') sPinStr = `c${sId}_out${sIdx}`;
      
      let tPinStr = `c${tId}_in${tIdx}`;
      if (compT?.type === 'battery') tPinStr = `c${tId}_out${tIdx}`;

      let v = nodeVoltages.get(sPinStr) || nodeVoltages.get(tPinStr) || 0;
      
      // Override pewarnaan kabel HANYA jika kabel benar-benar menyentuh pin OUTPUT dari Gerbang Logika
      let overrideV = 0;
      if (compS && ['switch', 'and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'].includes(compS.type)) {
          if (sPinStr.includes('_out') && compS.outputState === 1) overrideV = 5;
      }
      if (compT && ['switch', 'and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'].includes(compT.type)) {
          if (tPinStr.includes('_out') && compT.outputState === 1) overrideV = 5;
      }
      v = Math.max(v, overrideV);

      if (v >= 10) path.classList.add('wire-12v');
      else if (v >= 1.5) path.classList.add('wire-5v');
    });
  }
};