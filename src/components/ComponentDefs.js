// File: src/components/ComponentDefs.js

const ComponentDefs = {
  getDimensions(type) {
    const map = {
      led: [60, 60], diode: [60, 40], logic_probe: [60, 40], switch: [60, 40], push_button: [70, 60], push_button_nc: [70, 60], switch_spst: [80, 40], switch_spdt: [80, 60],
      fuse: [80, 40], ground: [40, 40], relay: [80, 80], relay_5pin: [80, 100], diode_bridge: [140, 140], 
      junction: [60, 60], wire_1to1: [60, 40], wire_1to2: [60, 60], wire_node: [20, 20],
      and: [80, 60], or: [80, 60], not: [80, 60], nand: [80, 60], nor: [80, 60], xor: [80, 60], xnor: [80, 60],
      bjt_npn: [80, 80], bjt_pnp: [80, 80],     
      transformer: [100, 100], ff_sr: [80, 90], ff_d: [80, 80], ff_jk: [80, 90], ff_t: [80, 80],
      mosfet_n: [100, 100], mosfet_p: [100, 100], 
      voltmeter: [80, 80], ammeter: [80, 80], ohmmeter: [80, 80], seven_segment: [140, 160], led_bargraph: [80, 220],  
      opamp: [80, 60], opamp_5pin: [80, 60], opamp_lm741: [120, 100], resistor: [80, 50], clock_pulse: [60, 40], flasher: [80, 40], voltage_divider: [80, 70], capacitor: [80, 50], 
      ic_555: [120, 160], ic_4017: [140, 260], ic_4518: [100, 90], ic_4511: [120, 160], ic_4026: [120, 220], ic_lm3914: [140, 240],
      power_terminal: [60, 40], output_terminal: [75, 40],
      battery: [80, 60], battery_1cell: [80, 60], battery_multi: [80, 60], vsine: [160, 110],
      ldr: [80, 60], thermistor_ntc: [80, 60], thermistor_ptc: [80, 60], potentiometer: [100, 60],
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

      if(div) div.style.cursor = ['switch', 'push_button', 'push_button_nc', 'switch_spst', 'potentiometer', 'ldr', 'thermistor_ntc', 'thermistor_ptc'].includes(type) ? 'pointer' : 'default';
    }
    if (!contentDiv.dataset.pushListener) {
          contentDiv.dataset.pushListener = "true";
          
          const startPress = (e) => {
              if ((type === 'push_button' || type === 'push_button_nc') && !e.target.closest('.control-btn')) {
                  const currentComp = typeof CircuitStore !== 'undefined' ? CircuitStore.components.find(c => c.id === id) : null;
                  if (currentComp && !currentComp.locked) currentComp.state = '1';
              }
          };

          const stopPress = (e) => {
              if (type === 'push_button' || type === 'push_button_nc') {
                  const currentComp = typeof CircuitStore !== 'undefined' ? CircuitStore.components.find(c => c.id === id) : null;
                  if (currentComp && !currentComp.locked) currentComp.state = '0';
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
        svg = `<svg width="70" height="60" viewBox="0 0 70 60">
          <line class="pin-in-0" x1="0" y1="30" x2="21" y2="30" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="70" y1="30" x2="49" y2="30" stroke="#006600" stroke-width="3"/>
          
          <circle cx="23" cy="30" r="3" fill="#e8e6d3" stroke="#000000" stroke-width="3"/>
          <circle cx="47" cy="30" r="3" fill="#e8e6d3" stroke="#000000" stroke-width="3"/>
          
          <g class="anim-plunger" style="transition: transform 0.05s;">
             <rect x="23" y="18" width="24" height="4" fill="#e8e6d3" stroke="#000000" stroke-width="3"/>
             <line x1="35" y1="19" x2="35" y2="9" stroke="#000000" stroke-width="3"/>
             <rect x="27" y="6" width="16" height="3" fill="#000000"/>
          </g>

          <rect x="10" y="0" width="40" height="22" fill="transparent" style="cursor:pointer; pointer-events:auto;" />
          
          <g class="lock-btn control-btn lock-down-btn" style="cursor:pointer; pointer-events:auto;" transform="translate(20, 45)">
             <rect x="-10" y="-10" width="20" height="20" fill="transparent"/>
             <circle cx="0" cy="0" r="5" fill="#000000" stroke="#000000" stroke-width="1"/>
             <polygon points="-1,-2 -4,0 -1,2" fill="#000"/>
             <polygon points="1,-2 4,0 1,2" fill="#000"/>
          </g>
          <g class="unlock-btn control-btn lock-up-btn" style="cursor:pointer; pointer-events:auto;" transform="translate(50, 45)">
             <rect x="-10" y="-10" width="20" height="20" fill="transparent"/>
             <circle cx="0" cy="0" r="5" fill="#ffffff" stroke="#000000" stroke-width="1"/>
             <polygon points="-1,2 -4,0 -1,-2" fill="#000"/>
             <polygon points="1,2 4,0 1,-2" fill="#000"/>
          </g>
        </svg>`; break;
      case 'push_button_nc':
        svg = `<svg width="70" height="60" viewBox="0 0 70 60">
          <line class="pin-in-0" x1="0" y1="30" x2="21" y2="30" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="70" y1="30" x2="49" y2="30" stroke="#006600" stroke-width="3"/>
          
          <circle cx="23" cy="30" r="3" fill="#e8e6d3" stroke="#000000" stroke-width="3"/>
          <circle cx="47" cy="30" r="3" fill="#e8e6d3" stroke="#000000" stroke-width="3"/>
          
          <g class="anim-plunger" style="transition: transform 0.05s;">
             <!-- PLAT DI BAWAH (Menempel ke titik kontak) -->
             <rect x="21" y="35" width="28" height="4" fill="#e8e6d3" stroke="#000000" stroke-width="3"/>
             <!-- BATANG/STEM TEMBUS KE ATAS -->
             <line x1="35" y1="25" x2="35" y2="35" stroke="#000000" stroke-width="3"/>
             <!-- TOPI PENEKAN -->
             <rect x="29" y="24" width="12" height="3" fill="#000000"/>
          </g>
          
          <rect x="15" y="0" width="40" height="30" fill="transparent" style="cursor:pointer; pointer-events:auto;" />
          
          <!-- TOMBOL KUNCI & LEPAS DI ATAS KIRI & KANAN -->
          <g class="lock-btn control-btn lock-down-btn" style="cursor:pointer; pointer-events:auto;" transform="translate(20, 14)">
             <rect x="-10" y="-10" width="20" height="20" fill="transparent"/>
             <circle cx="0" cy="0" r="5" fill="#000000" stroke="#000000" stroke-width="1"/>
             <polygon points="-1,-2 -4,0 -1,2" fill="#000"/>
             <polygon points="1,-2 4,0 1,2" fill="#000"/>
          </g>
          <g class="unlock-btn control-btn lock-up-btn" style="cursor:pointer; pointer-events:auto;" transform="translate(50, 14)">
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
      case 'switch_spdt':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <!-- Garis Kabel Statis -->
          <line x1="0" y1="30" x2="20" y2="30" stroke="#006600" stroke-width="3"/>
          <line x1="60" y1="15" x2="80" y2="15" stroke="#006600" stroke-width="3"/>
          <line x1="60" y1="45" x2="80" y2="45" stroke="#006600" stroke-width="3"/>
          
          <!-- Titik Terminal -->
          <circle cx="20" cy="30" r="4" fill="#1e293b" stroke="${pStroke}" stroke-width="2"/>
          <circle cx="60" cy="15" r="4" fill="#1e293b" stroke="${pStroke}" stroke-width="2"/>
          <circle cx="60" cy="45" r="4" fill="#1e293b" stroke="${pStroke}" stroke-width="2"/>
          
          <!-- Tuas Sakelar (Blade) yang bisa bergerak -->
          <line class="blade" x1="20" y1="30" x2="56" y2="15" stroke="#ef4444" stroke-width="4" stroke-linecap="round" style="transition: all 0.15s ease-in-out;"/>
        </svg>`;
        break;
      case 'led':
        svg = `<svg width="60" height="60" viewBox="0 0 60 60" class="anim-svg">
          <line class="pin-in-0" x1="0" y1="30" x2="15" y2="30" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="45" y1="30" x2="60" y2="30" stroke="#006600" stroke-width="3"/>
          <circle class="anim-body" cx="30" cy="30" r="15" fill="#4a0000" stroke="${pStroke}" stroke-width="${sw}"/>
          <path d="M25 25 L35 30 L25 35 Z" fill="${pStroke}"/>
          <line x1="35" y1="23" x2="35" y2="37" stroke="${pStroke}" stroke-width="3"/>
          
          <!-- Segitiga Peringatan (Diperkecil dan dipindah ke kiri bawah) -->
          <g class="warning-icon" style="display:none; pointer-events:none;">
              <polygon points="18,45 24,55 12,55" fill="#facc15" stroke="#ca8a04" stroke-width="1.5" stroke-linejoin="round"/>
              <text x="18" y="53" font-size="8" font-weight="900" fill="#000" text-anchor="middle">!</text>
          </g>

          <!-- Teks Label LED -->
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
      case 'ohmmeter':
        svg = `<svg width="80" height="80" viewBox="0 0 80 80">
          <line class="pin-in-0" x1="0" y1="40" x2="16" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="64" y1="40" x2="80" y2="40" stroke="#006600" stroke-width="3"/>
          <circle cx="40" cy="40" r="24" fill="#1e293b" stroke="${pStroke}" stroke-width="${sw}"/>

          <!-- Layar Teks -->
          <text class="anim-text meter-val" x="40" y="41" text-anchor="middle" font-size="14" font-family="monospace" font-weight="bold" fill="#facc15">OL</text>

          <!-- Label Omega (Ohm) -->
          <text class="range-txt" x="40" y="55" font-size="10" font-weight="bold" fill="#fff" text-anchor="middle" pointer-events="none">Ω</text>

          <text x="1" y="30" class="comp-label" fill="red" font-size="14" font-weight="bold">+</text>
          <text x="70" y="30" class="comp-label" fill="black" font-size="14" font-weight="bold">-</text>
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
          <path d="M 10 15 L 15 15 L 15 8 L 25 8 L 25 22 L 35 22 L 35 15 L 40 15" fill="none" stroke="#22c55e" stroke-width="2"/>
          <line class="pin-out-0" x1="45" y1="20" x2="60" y2="20" stroke="#006600" stroke-width="3"/>
          <circle class="anim-indicator" cx="10" cy="10" r="3" fill="#ef4444"/>
          <!-- Teks Frekuensi yang bisa diklik (val-trigger) -->
          <text class="anim-text val-trigger" x="25" y="32" font-size="9" fill="#38bdf8" font-weight="bold" text-anchor="middle" style="cursor:pointer; pointer-events:auto;">2Hz</text>
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
      case 'ldr':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60" style="overflow: visible;">
          <!-- Kaki & Bodi Utama LDR -->
          <line class="pin-in-0" x1="0" y1="25" x2="25" y2="25" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="55" y1="25" x2="80" y2="25" stroke="#006600" stroke-width="3"/>
          <circle cx="40" cy="25" r="16" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <path d="M 28 25 l 4 -8 l 8 16 l 8 -16 l 4 8" fill="none" stroke="${pStroke}" stroke-width="${sw}" stroke-linejoin="round"/>
          <path d="M 25 5 L 35 15 M 32 15 L 35 15 L 35 12 M 15 10 L 25 20 M 22 20 L 25 20 L 25 17" fill="none" stroke="#f59e0b" stroke-width="3"/>
          
          <!-- 🟢 KOTAK PANAH KIRI (Kurangi Cahaya) -->
          <rect class="control-btn btn-down" x="10" y="45" width="20" height="14" rx="3" fill="#ef4444" style="cursor:pointer; pointer-events:auto;"/>
          <polygon points="23,49 17,52 23,55" fill="#fff" pointer-events="none"/>

          <!-- 🟢 KOTAK PANAH KANAN (Tambah Cahaya) -->
          <rect class="control-btn btn-up" x="50" y="45" width="20" height="14" rx="3" fill="#22c55e" style="cursor:pointer; pointer-events:auto;"/>
          <polygon points="57,49 63,52 57,55" fill="#fff" pointer-events="none"/>
          
          <!-- 🟢 NILAI CAHAYA LUX (Teks ditebalkan dengan font-weight="bold") -->
          <text class="anim-text comp-label resistor-val val-trigger" x="60" y="5" text-anchor="middle" font-size="10" font-weight="bold" fill="#4f46e5" style="cursor:pointer; pointer-events:auto;"></text>
        </svg>`; break;
      case 'thermistor_ntc':
      case 'thermistor_ptc': {
        const label = type === 'thermistor_ntc' ? '-t°' : '+t°';
        svg = `<svg width="80" height="60" viewBox="0 0 80 60" style="overflow: visible;">
          <!-- Kaki & Bodi Utama -->
          <line class="pin-in-0" x1="0" y1="25" x2="20" y2="25" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="60" y1="25" x2="80" y2="25" stroke="#006600" stroke-width="3"/>
          <rect x="20" y="17" width="40" height="16" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <path d="M 15 40 L 25 40 L 65 7" fill="none" stroke="${pStroke}" stroke-width="3"/>
          <text x="35" y="12" class="comp-label" font-weight="bold">${label}</text>
          
         <!-- 🟢 KOTAK PANAH KIRI (Kurangi Suhu) -->
          <rect class="control-btn btn-down" x="15" y="48" width="17" height="14" rx="3" fill="#ef4444" style="cursor:pointer; pointer-events:auto;"/>
          <polygon points="26.5,52 20.5,55 26.5,58" fill="#fff" pointer-events="none"/>

          <!-- 🟢 KOTAK PANAH KANAN (Tambah Suhu) -->
          <rect class="control-btn btn-up" x="45" y="48" width="17" height="14" rx="3" fill="#22c55e" style="cursor:pointer; pointer-events:auto;"/>
          <polygon points="50.5,52 56.5,55 50.5,58" fill="#fff" pointer-events="none"/>
          
          <!-- 🟢 NILAI SUHU (Dipindah ke Kanan) -->
          <text class="anim-text comp-label resistor-val val-trigger" x="45" y="45" text-anchor="middle" font-size="11" font-weight="bold" fill="#4f46e5" style="cursor:pointer; pointer-events:auto;"></text>
        </svg>`; break;
      }
      case 'ic_4017':
        svg = `<svg width="120" height="240" viewBox="0 0 120 240">
          <rect class="anim-body" x="30" y="10" width="60" height="220" rx="4" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          
          <!-- Titik penanda orientasi IC (Notch) -->
          <circle cx="60" cy="22" r="4" fill="${pStroke}"/>
          
          <!-- Garis Input Kiri -->
          <line class="pin-in-0" x1="0" y1="60" x2="30" y2="60" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="0" y1="100" x2="30" y2="100" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-2" x1="0" y1="140" x2="30" y2="140" stroke="#006600" stroke-width="3"/>
          
          <!-- Garis Power Atas & Bawah -->
          <line class="pin-in-3" x1="60" y1="0" x2="60" y2="10" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-4" x1="60" y1="240" x2="60" y2="230" stroke="#006600" stroke-width="3"/>
          
          <!-- Teks Label Input -->
          <polyline points="30,55 38,60 30,65" fill="none" stroke="${pStroke}" stroke-width="1.5"/> <!-- Simbol Segitiga Clock -->
          <text x="40" y="64" class="comp-label" font-size="10">CLK</text>
          <text x="35" y="104" class="comp-label" font-size="10">ENA</text>
          <text x="35" y="144" class="comp-label" font-size="10">RST</text>
          
          <text x="60" y="36" class="comp-label" text-anchor="middle" font-size="9">VCC</text>
          <text x="60" y="222" class="comp-label" text-anchor="middle" font-size="9">GND</text>
          
          <!-- Teks Merek IC -->
          <text x="45" y="160" class="comp-label" text-anchor="middle" font-size="16" font-weight="bold" transform="rotate(-90 50 160)">CD4017</text>
          
          <!-- Garis Output Kanan (Loop untuk Q0-Q9 & CO) -->
          ${Array.from({length: 11}).map((_, i) => `
            <line class="pin-out-${i}" x1="90" y1="${20 + i*20}" x2="120" y2="${20 + i*20}" stroke="#006600" stroke-width="3"/>
            <text x="86" y="${24 + i*20}" class="comp-label" text-anchor="end" font-weight="bold" font-size="10" fill="${i === 10 ? '#0284c7' : '#000'}">${i < 10 ? 'Q'+i : 'CO'}</text>
          `).join('')}
        </svg>`; break;
      case 'ic_4518':
        svg = `<svg width="100" height="90" viewBox="0 0 100 90">
          <!-- Badan IC warna krem sama seperti IC lain -->
          <rect class="anim-body" x="20" y="5" width="60" height="80" rx="2" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          
          <!-- Notch (Tanda Orientasi IC) -->
          <circle cx="50" cy="12" r="3" fill="${pStroke}"/>
          
          <!-- Garis Pin Input -->
          <line class="pin-in-0" x1="0" y1="25" x2="20" y2="25" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="0" y1="45" x2="20" y2="45" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-2" x1="0" y1="65" x2="20" y2="65" stroke="#006600" stroke-width="3"/>
          
          <!-- Garis Pin Output -->
          <line class="pin-out-0" x1="80" y1="20" x2="100" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-1" x1="80" y1="40" x2="100" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-2" x1="80" y1="60" x2="100" y2="60" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-3" x1="80" y1="80" x2="100" y2="80" stroke="#006600" stroke-width="3"/>
          
          <!-- Simbol & Label Input Kiri -->
          <polyline points="20,20 25,25 20,30" fill="none" stroke="${pStroke}" stroke-width="1.5"/> 
          <text x="26" y="29" class="comp-label" font-size="9">CLK</text>
          <text x="24" y="49" class="comp-label" font-size="9">EN</text>
          <text x="24" y="69" class="comp-label" font-size="9">RST</text>
          
          <!-- Label Output Kanan -->
          <text x="76" y="24" class="comp-label" text-anchor="end" font-size="9">Q0</text>
          <text x="76" y="44" class="comp-label" text-anchor="end" font-size="9">Q1</text>
          <text x="76" y="64" class="comp-label" text-anchor="end" font-size="9">Q2</text>
          <text x="76" y="81" class="comp-label" text-anchor="end" font-size="9">Q3</text>
          
          <text x="50" y="80" class="comp-label" text-anchor="middle" font-weight="bold" font-size="10">4518</text>
          
          <!-- Layar Counter Mini di Tengah -->
          <rect x="40" y="35" width="20" height="24" rx="2" fill="#0f172a"/>
          <text class="anim-text val-trigger" x="50" y="53" fill="#facc15" font-size="16" font-weight="bold" text-anchor="middle" style="cursor:pointer; pointer-events:auto;">-</text>
        </svg>`; break;
      case 'ic_4511':
        svg = `<svg width="120" height="160" viewBox="0 0 120 160">
          <!-- Badan IC warna krem khas simulator Anda -->
          <rect class="anim-body" x="30" y="5" width="60" height="150" rx="4" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          
          <!-- Titik Orientasi (Notch) di bagian atas -->
          <circle cx="60" cy="12" r="3" fill="${pStroke}"/>
          
          <!-- 7 Pin Input Kiri (4 BCD + 3 Kontrol) -->
          <line class="pin-in-0" x1="0" y1="20" x2="30" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="0" y1="40" x2="30" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-2" x1="0" y1="60" x2="30" y2="60" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-3" x1="0" y1="80" x2="30" y2="80" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-4" x1="0" y1="100" x2="30" y2="100" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-5" x1="0" y1="120" x2="30" y2="120" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-6" x1="0" y1="140" x2="30" y2="140" stroke="#006600" stroke-width="3"/>
          
          <!-- 7 Pin Output Kanan (Segmen a - g) -->
          <line class="pin-out-0" x1="90" y1="20" x2="120" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-1" x1="90" y1="40" x2="120" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-2" x1="90" y1="60" x2="120" y2="60" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-3" x1="90" y1="80" x2="120" y2="80" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-4" x1="90" y1="100" x2="120" y2="100" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-5" x1="90" y1="120" x2="120" y2="120" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-6" x1="90" y1="140" x2="120" y2="140" stroke="#006600" stroke-width="3"/>
          
          <!-- Label Teks Input Kiri -->
          <text x="34" y="24" class="comp-label" font-size="10" font-weight="bold">A</text>
          <text x="34" y="44" class="comp-label" font-size="10" font-weight="bold">B</text>
          <text x="34" y="64" class="comp-label" font-size="10" font-weight="bold">C</text>
          <text x="34" y="84" class="comp-label" font-size="10" font-weight="bold">D</text>
          <text x="34" y="104" class="comp-label" font-size="9" fill="#0284c7">LT</text>
          <text x="34" y="124" class="comp-label" font-size="9" fill="#0284c7">BI</text>
          <text x="34" y="144" class="comp-label" font-size="9" fill="#0284c7">LE</text>
          
          <!-- Label Teks Output Kanan -->
          <text x="86" y="24" class="comp-label" text-anchor="end" font-size="11" font-weight="bold">a</text>
          <text x="86" y="44" class="comp-label" text-anchor="end" font-size="11" font-weight="bold">b</text>
          <text x="86" y="64" class="comp-label" text-anchor="end" font-size="11" font-weight="bold">c</text>
          <text x="86" y="84" class="comp-label" text-anchor="end" font-size="11" font-weight="bold">d</text>
          <text x="86" y="104" class="comp-label" text-anchor="end" font-size="11" font-weight="bold">e</text>
          <text x="86" y="124" class="comp-label" text-anchor="end" font-size="11" font-weight="bold">f</text>
          <text x="86" y="144" class="comp-label" text-anchor="end" font-size="11" font-weight="bold">g</text>
          
          <!-- Label Merek IC (Ditulis Vertikal) -->
          <text x="60" y="85" class="comp-label" text-anchor="middle" font-size="16" font-weight="bold" transform="rotate(-90 60 85)">CD4511</text>
        </svg>`; break;  
      case 'ic_4026':
        svg = `<svg width="120" height="220" viewBox="0 0 120 220">
          <!-- Bodi IC diperpanjang -->
          <rect class="anim-body" x="30" y="5" width="60" height="210" rx="4" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <circle cx="60" cy="12" r="3" fill="${pStroke}"/>

          <!-- 4 Pin Input Kiri -->
          <line class="pin-in-0" x1="0" y1="30" x2="30" y2="30" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="0" y1="80" x2="30" y2="80" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-2" x1="0" y1="130" x2="30" y2="130" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-3" x1="0" y1="180" x2="30" y2="180" stroke="#006600" stroke-width="3"/>

          <!-- 10 Pin Output Kanan (a-g, CO, DEO, UCS) -->
          ${Array.from({length: 10}).map((_, i) => `<line class="pin-out-${i}" x1="90" y1="${20 + i*20}" x2="120" y2="${20 + i*20}" stroke="#006600" stroke-width="3"/>`).join('')}

          <polyline points="30,25 36,30 30,35" fill="none" stroke="${pStroke}" stroke-width="1.5"/>
          <text x="38" y="34" class="comp-label" font-size="9" font-weight="bold">CLK</text>
          <text x="34" y="84" class="comp-label" font-size="9" font-weight="bold">INH</text>
          <text x="34" y="134" class="comp-label" font-size="9" font-weight="bold">RST</text>
          <text x="34" y="184" class="comp-label" font-size="9" font-weight="bold" fill="#0284c7">DEI</text>

          <text x="86" y="24" class="comp-label" text-anchor="end" font-size="11" font-weight="bold">a</text>
          <text x="86" y="44" class="comp-label" text-anchor="end" font-size="11" font-weight="bold">b</text>
          <text x="86" y="64" class="comp-label" text-anchor="end" font-size="11" font-weight="bold">c</text>
          <text x="86" y="84" class="comp-label" text-anchor="end" font-size="11" font-weight="bold">d</text>
          <text x="86" y="104" class="comp-label" text-anchor="end" font-size="11" font-weight="bold">e</text>
          <text x="86" y="124" class="comp-label" text-anchor="end" font-size="11" font-weight="bold">f</text>
          <text x="86" y="144" class="comp-label" text-anchor="end" font-size="11" font-weight="bold">g</text>
          <text x="86" y="164" class="comp-label" text-anchor="end" font-size="10" font-weight="bold" fill="#ef4444">CO</text>
          <text x="86" y="184" class="comp-label" text-anchor="end" font-size="8" font-weight="bold" fill="#0284c7">DEO</text>
          <text x="86" y="204" class="comp-label" text-anchor="end" font-size="8" font-weight="bold" fill="#8b5cf6">UCS</text>

          <text x="60" y="110" class="comp-label" text-anchor="middle" font-size="16" font-weight="bold" transform="rotate(-90 60 110)">CD4026</text>
        </svg>`; break;
      case 'ic_lm3914':
        svg = `<svg width="140" height="240" viewBox="0 0 140 240">
          <!-- Bodi Utama IC -->
          <rect class="anim-body" x="30" y="20" width="80" height="200" rx="4" ry="4" fill="#1e293b" stroke="${pStroke}" stroke-width="${sw}"/>
          
          <!-- Notch (Tanda Atas) - Digeser ke tengah (X=70) -->
          <path d="M 60 20 A 10 10 0 0 0 80 20" fill="none" stroke="${pStroke}" stroke-width="${sw}"/>

          <!-- PIN POWER: V+ (Atas) & V- (Bawah) - Digeser ke tengah (X=70) -->
          <line class="pin-in-6" x1="70" y1="0" x2="70" y2="20" stroke="#006600" stroke-width="3"/>
          <text x="80" y="15" font-size="10" fill="#ef4444" font-weight="bold" font-family="monospace">V+</text>
          
          <line class="pin-in-7" x1="70" y1="220" x2="70" y2="240" stroke="#006600" stroke-width="3"/>
          <text x="80" y="235" font-size="10" fill="#3b82f6" font-weight="bold" font-family="monospace">V-</text>

          <!-- 6 PIN KONTROL (Kiri) - Tetap -->
          <line class="pin-in-0" x1="0" y1="40" x2="30" y2="40" stroke="#006600" stroke-width="3"/>
          <text x="35" y="44" font-size="10" fill="#94a3b8" font-family="monospace">SIG</text>
          <line class="pin-in-1" x1="0" y1="70" x2="30" y2="70" stroke="#006600" stroke-width="3"/>
          <text x="35" y="74" font-size="10" fill="#94a3b8" font-family="monospace">RHI</text>
          <line class="pin-in-2" x1="0" y1="100" x2="30" y2="100" stroke="#006600" stroke-width="3"/>
          <text x="35" y="104" font-size="10" fill="#94a3b8" font-family="monospace">RLO</text>
          <line class="pin-in-3" x1="0" y1="130" x2="30" y2="130" stroke="#006600" stroke-width="3"/>
          <text x="35" y="134" font-size="10" fill="#94a3b8" font-family="monospace">REFO</text>
          <line class="pin-in-4" x1="0" y1="160" x2="30" y2="160" stroke="#006600" stroke-width="3"/>
          <text x="35" y="164" font-size="10" fill="#94a3b8" font-family="monospace">REFA</text>
          <line class="pin-in-5" x1="0" y1="190" x2="30" y2="190" stroke="#006600" stroke-width="3"/>
          <text x="35" y="194" font-size="10" fill="#94a3b8" font-family="monospace">MOD</text>

          <!-- 10 PIN OUTPUT LED (Kanan) - Mulai dari X=110 sampai X=140 -->
          <line class="pin-out-0" x1="110" y1="30" x2="140" y2="30" stroke="#006600" stroke-width="3"/>
          <text x="105" y="34" font-size="10" fill="#94a3b8" font-family="monospace" text-anchor="end">L1</text>
          <line class="pin-out-1" x1="110" y1="50" x2="140" y2="50" stroke="#006600" stroke-width="3"/>
          <text x="105" y="54" font-size="10" fill="#94a3b8" font-family="monospace" text-anchor="end">L2</text>
          <line class="pin-out-2" x1="110" y1="70" x2="140" y2="70" stroke="#006600" stroke-width="3"/>
          <text x="105" y="74" font-size="10" fill="#94a3b8" font-family="monospace" text-anchor="end">L3</text>
          <line class="pin-out-3" x1="110" y1="90" x2="140" y2="90" stroke="#006600" stroke-width="3"/>
          <text x="105" y="94" font-size="10" fill="#94a3b8" font-family="monospace" text-anchor="end">L4</text>
          <line class="pin-out-4" x1="110" y1="110" x2="140" y2="110" stroke="#006600" stroke-width="3"/>
          <text x="105" y="114" font-size="10" fill="#94a3b8" font-family="monospace" text-anchor="end">L5</text>
          <line class="pin-out-5" x1="110" y1="130" x2="140" y2="130" stroke="#006600" stroke-width="3"/>
          <text x="105" y="134" font-size="10" fill="#94a3b8" font-family="monospace" text-anchor="end">L6</text>
          <line class="pin-out-6" x1="110" y1="150" x2="140" y2="150" stroke="#006600" stroke-width="3"/>
          <text x="105" y="154" font-size="10" fill="#94a3b8" font-family="monospace" text-anchor="end">L7</text>
          <line class="pin-out-7" x1="110" y1="170" x2="140" y2="170" stroke="#006600" stroke-width="3"/>
          <text x="105" y="174" font-size="10" fill="#94a3b8" font-family="monospace" text-anchor="end">L8</text>
          <line class="pin-out-8" x1="110" y1="190" x2="140" y2="190" stroke="#006600" stroke-width="3"/>
          <text x="105" y="194" font-size="10" fill="#94a3b8" font-family="monospace" text-anchor="end">L9</text>
          <line class="pin-out-9" x1="110" y1="210" x2="140" y2="210" stroke="#006600" stroke-width="3"/>
          <text x="105" y="214" font-size="10" fill="#94a3b8" font-family="monospace" text-anchor="end">L10</text>

          <!-- Label LM3914 dipindah ke sumbu X=70 agar pas di tengah bodi -->
          <text x="70" y="130" font-size="14" font-weight="bold" fill="#cbd5e1" transform="rotate(-90 70 120)" text-anchor="middle">LM3914</text>
        </svg>`; 
        break;
        break; 
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
      case 'seven_segment':
        // 1. Lebar kanvas SVG total diperbesar jadi 160
        svg = `<svg width="160" height="160" viewBox="0 0 160 160">
          
          <!-- 2. Kotak plastik diperlebar (width="120" sehingga tepi kanannya di X:140) -->
          <rect class="anim-body" x="20" y="5" width="110" height="150" rx="4" fill="#18181b" stroke="${pStroke}" stroke-width="${sw}"/>
          
          <!-- 7 Pin Input (Kiri) - Tetap sama -->
          <line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="0" y1="40" x2="20" y2="40" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-2" x1="0" y1="60" x2="20" y2="60" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-3" x1="0" y1="80" x2="20" y2="80" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-4" x1="0" y1="100" x2="20" y2="100" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-5" x1="0" y1="120" x2="20" y2="120" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-6" x1="0" y1="140" x2="20" y2="140" stroke="#006600" stroke-width="3"/>

          <!-- 3. Kabel COM digeser mulai dari X:140 sampai mentok di X:160 -->
          <line class="pin-out-0" x1="130" y1="140" x2="150" y2="140" stroke="#006600" stroke-width="3"/>
          
          <text x="28" y="24" font-size="10" font-weight="bold" fill="#94a3b8">a</text>
          <text x="28" y="44" font-size="10" font-weight="bold" fill="#94a3b8">b</text>
          <text x="28" y="64" font-size="10" font-weight="bold" fill="#94a3b8">c</text>
          <text x="28" y="84" font-size="10" font-weight="bold" fill="#94a3b8">d</text>
          <text x="28" y="104" font-size="10" font-weight="bold" fill="#94a3b8">e</text>
          <text x="28" y="124" font-size="10" font-weight="bold" fill="#94a3b8">f</text>
          <text x="28" y="144" font-size="10" font-weight="bold" fill="#94a3b8">g</text>
          
          <!-- 4. Label COM digeser ke kanan mengikuti kabelnya -->
          <text x="125" y="144" font-size="9" font-weight="bold" fill="#ef4444" text-anchor="end">COM</text>

          <!-- 5. GRUP LAMPU DIGESER: translate sumbu X diubah dari 30 menjadi 45 -->
          <!-- scale(1.2) dipertahankan agar ukuran lampunya tetap sama besar -->
          <g transform="translate(45, 26) scale(1.2)">
            
            <polygon class="seg-a" points="12,0 38,0 43,5 38,10 12,10 7,5" fill="#334155"/>
            <polygon class="seg-b" points="45,7 50,12 50,38 45,43 40,38 40,12" fill="#334155"/>
            <polygon class="seg-c" points="45,47 50,52 50,78 45,83 40,78 40,52" fill="#334155"/>
            <polygon class="seg-d" points="12,80 38,80 43,85 38,90 12,90 7,85" fill="#334155"/>
            <polygon class="seg-e" points="5,47 10,52 10,78 5,83 0,78 0,52" fill="#334155"/>
            <polygon class="seg-f" points="5,7 10,12 10,38 5,43 0,38 0,12" fill="#334155"/>
            <polygon class="seg-g" points="12,40 38,40 43,45 38,50 12,50 7,45" fill="#334155"/>

            <circle class="seg-dp" cx="58" cy="85" r="4.5" fill="#334155"/>

            <text x="25" y="5" font-size="6" font-family="sans-serif" font-weight="bold" fill="#ffffff" opacity="0.6" text-anchor="middle" dominant-baseline="central" pointer-events="none">A</text>
            <text x="45" y="25" font-size="6" font-family="sans-serif" font-weight="bold" fill="#ffffff" opacity="0.6" text-anchor="middle" dominant-baseline="central" pointer-events="none">B</text>
            <text x="45" y="65" font-size="6" font-family="sans-serif" font-weight="bold" fill="#ffffff" opacity="0.6" text-anchor="middle" dominant-baseline="central" pointer-events="none">C</text>
            <text x="25" y="85" font-size="6" font-family="sans-serif" font-weight="bold" fill="#ffffff" opacity="0.6" text-anchor="middle" dominant-baseline="central" pointer-events="none">D</text>
            <text x="5" y="65" font-size="6" font-family="sans-serif" font-weight="bold" fill="#ffffff" opacity="0.6" text-anchor="middle" dominant-baseline="central" pointer-events="none">E</text>
            <text x="5" y="25" font-size="6" font-family="sans-serif" font-weight="bold" fill="#ffffff" opacity="0.6" text-anchor="middle" dominant-baseline="central" pointer-events="none">F</text>
            <text x="25" y="45" font-size="6" font-family="sans-serif" font-weight="bold" fill="#ffffff" opacity="0.6" text-anchor="middle" dominant-baseline="central" pointer-events="none">G</text>
            <text x="58" y="85" font-size="3.5" font-family="sans-serif" font-weight="bold" fill="#ffffff" opacity="0.6" text-anchor="middle" dominant-baseline="central" pointer-events="none">DP</text>
          </g>
        </svg>`; break;
      case 'led_bargraph':
        svg = `<svg width="80" height="220" viewBox="0 0 80 220">
          <!-- Bodi Resin Bargraph -->
          <rect x="20" y="5" width="50" height="210" rx="3" ry="3" fill="#0f172a" stroke="${pStroke}" stroke-width="${sw}"/>
          
          <!-- Pin 11: Common Anoda (VCC+) di Atas -->
          <line class="pin-in-10" x1="40" y1="0" x2="40" y2="5" stroke="#ef4444" stroke-width="3"/>
          <text x="40" y="-3" font-size="10" fill="#ef4444" font-weight="bold" text-anchor="middle" font-family="monospace">V+</text>

          <!-- 10 Pin Katoda (Kiri) & 10 Segmen Layar LED -->
          
          <!-- Segmen 1 (Atas) -->
          <line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/>
          <rect class="led-seg-0" x="25" y="12" width="40" height="15" rx="1" fill="#334155" />
          
          <!-- Segmen 2 -->
          <line class="pin-in-1" x1="0" y1="40" x2="20" y2="40" stroke="#006600" stroke-width="3"/>
          <rect class="led-seg-1" x="25" y="32" width="40" height="15" rx="1" fill="#334155" />

          <!-- Segmen 3 -->
          <line class="pin-in-2" x1="0" y1="60" x2="20" y2="60" stroke="#006600" stroke-width="3"/>
          <rect class="led-seg-2" x="25" y="52" width="40" height="15" rx="1" fill="#334155" />

          <!-- Segmen 4 -->
          <line class="pin-in-3" x1="0" y1="80" x2="20" y2="80" stroke="#006600" stroke-width="3"/>
          <rect class="led-seg-3" x="25" y="72" width="40" height="15" rx="1" fill="#334155" />

          <!-- Segmen 5 -->
          <line class="pin-in-4" x1="0" y1="100" x2="20" y2="100" stroke="#006600" stroke-width="3"/>
          <rect class="led-seg-4" x="25" y="92" width="40" height="15" rx="1" fill="#334155" />

          <!-- Segmen 6 -->
          <line class="pin-in-5" x1="0" y1="120" x2="20" y2="120" stroke="#006600" stroke-width="3"/>
          <rect class="led-seg-5" x="25" y="112" width="40" height="15" rx="1" fill="#334155" />

          <!-- Segmen 7 -->
          <line class="pin-in-6" x1="0" y1="140" x2="20" y2="140" stroke="#006600" stroke-width="3"/>
          <rect class="led-seg-6" x="25" y="132" width="40" height="15" rx="1" fill="#334155" />

          <!-- Segmen 8 -->
          <line class="pin-in-7" x1="0" y1="160" x2="20" y2="160" stroke="#006600" stroke-width="3"/>
          <rect class="led-seg-7" x="25" y="152" width="40" height="15" rx="1" fill="#334155" />

          <!-- Segmen 9 -->
          <line class="pin-in-8" x1="0" y1="180" x2="20" y2="180" stroke="#006600" stroke-width="3"/>
          <rect class="led-seg-8" x="25" y="172" width="40" height="15" rx="1" fill="#334155" />

          <!-- Segmen 10 (Bawah) -->
          <line class="pin-in-9" x1="0" y1="200" x2="20" y2="200" stroke="#006600" stroke-width="3"/>
          <rect class="led-seg-9" x="25" y="192" width="40" height="15" rx="1" fill="#334155" />
        </svg>`; break;  
      case 'potentiometer':
        svg = `<svg width="100" height="60" viewBox="0 0 100 60" style="overflow: visible;">
          <!-- Kaki & Garis Komponen -->
          <line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-in-1" x1="80" y1="20" x2="100" y2="20" stroke="#006600" stroke-width="3"/>
          <path d="M 20 20 l 7.5 -10 l 15 20 l 15 -20 l 15 20 l 7.5 -10" fill="none" stroke="${pStroke}" stroke-width="${sw}" stroke-linejoin="round"/>
          
          <!-- Wiper (Jarum Tengah) -->
          <line class="pin-out-0" x1="50" y1="22" x2="50" y2="60" stroke="#006600" stroke-width="3"/>
          <polygon points="50,22 46,30 54,30" fill="${pStroke}"/>
          
          <!-- Label Pin (Berada di bawah tombol panah) -->
          <text x="8" y="32" class="comp-label" font-size="9" font-weight="bold" fill="#0284c7">IN</text>
          <text x="80" y="32" class="comp-label" font-size="9" font-weight="bold" fill="#1e293b">GND</text>
          <text x="30" y="55" class="comp-label" font-size="9" font-weight="bold" fill="#e11d48">OUT</text>
          
          <!-- 🟢 KOTAK PANAH KIRI (Kurangi Putaran) - Kotak Memanjang di Atas 'IN' -->
          <rect class="control-btn btn-down" x="-2" y="-6" width="26" height="14" rx="3" fill="#ef4444" style="cursor:pointer; pointer-events:auto;"/>
          <polygon points="13,-2 7,1 13,4" fill="#fff" pointer-events="none"/>

          <!-- 🟢 NILAI PERSEN (Tepat di Tengah Atas, Sejajar Panah) -->
          <text class="anim-text" x="50" y="6" text-anchor="middle" font-size="12" font-weight="bold" fill="#4f46e5" pointer-events="none"></text>

          <!-- 🟢 KOTAK PANAH KANAN (Tambah Putaran) - Kotak Memanjang di Atas 'GND' -->
          <rect class="control-btn btn-up" x="78" y="-6" width="26" height="14" rx="3" fill="#22c55e" style="cursor:pointer; pointer-events:auto;"/>
          <polygon points="87,-2 93,1 87,4" fill="#fff" pointer-events="none"/>
          
          <!-- NILAI TOTAL RESISTOR (Di Kanan Bawah, Bebas dari tumpukan) -->
          <text class="val-text comp-label resistor-val val-trigger" x="72" y="48" text-anchor="middle" font-size="10" font-weight="bold" fill="currentColor" style="cursor:pointer; pointer-events:auto;">10k</text>
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
    case 'opamp_lm741':
        svg = `<svg width="120" height="100" viewBox="0 0 120 100">
          
          <!-- 4 Pin Input (Ditaruh di kode atas agar tertutup rapi oleh segitiga) -->
          <!-- Pin 1: Inverting (-) di Kiri Atas -->
          <line class="pin-in-0" x1="0" y1="30" x2="30" y2="30" stroke="#006600" stroke-width="3"/>
          <!-- Pin 2: Non-Inverting (+) di Kiri Bawah -->
          <line class="pin-in-1" x1="0" y1="70" x2="30" y2="70" stroke="#006600" stroke-width="3"/>
          <!-- Pin 3: VCC+ (Kutub Positif Baterai) di Atas -->
          <line class="pin-in-2" x1="60" y1="0" x2="60" y2="30" stroke="#006600" stroke-width="3"/>
          <!-- Pin 4: VEE- (Kutub Negatif / Ground) di Bawah -->
          <line class="pin-in-3" x1="60" y1="100" x2="60" y2="70" stroke="#006600" stroke-width="3"/>
          
          <!-- 1 Pin Output di Kanan -->
          <line class="pin-out-0" x1="90" y1="50" x2="120" y2="50" stroke="#006600" stroke-width="3"/>
          
          <!-- Bodi Utama Segitiga Khas Amplifier -->
          <polygon class="anim-body" points="30,10 90,50 30,90" fill="#1e293b" stroke="${pStroke}" stroke-width="${sw}" stroke-linejoin="round"/>
          
          <!-- Simbol Polaritas di Dalam Segitiga -->
          <text x="40" y="34" font-size="14" font-weight="bold" fill="#94a3b8" text-anchor="middle">-</text>
          <text x="40" y="74" font-size="12" font-weight="bold" fill="#94a3b8" text-anchor="middle">+</text>
          
          <!-- Label Sumber Daya (Power) -->
          <text x="60" y="40" font-size="8" font-weight="bold" fill="#ef4444" text-anchor="middle">V+</text>
          <text x="60" y="66" font-size="8" font-weight="bold" fill="#3b82f6" text-anchor="middle">V-</text>
          
          <!-- Nama Merek IC -->
          <text x="50" y="53" font-size="9" font-weight="bold" fill="#cbd5e1">741</text>
        </svg>`; break;
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
      case 'wire_node':
        svg = `<svg width="20" height="20" viewBox="0 0 20 20" style="display:block; position:absolute; top:0; left:0;">
          <circle class="anim-body" cx="10" cy="10" r="6" fill="#1e293b" stroke="#334155" stroke-width="2"/>
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
      case 'push_button':
      case 'push_button_nc': {
        const isPressed = compData.state === '1'; // 1 = Ditekan ke bawah
        
        // Logika Fisika: NO menyala jika ditekan. NC menyala jika TIDAK ditekan.
        const isConducting = type === 'push_button' ? isPressed : !isPressed;
        
        const vState = typeof CircuitStore !== 'undefined' ? CircuitStore.isSimulationActive : false;
        
        setPin('pin-in-0', vState);
        setPin('pin-out-0', isConducting && vState);
        
        const plunger = contentDiv.querySelector('.anim-plunger');
        const lockBtnCircle = contentDiv.querySelector('.lock-btn circle');
        
        if (plunger) {
          // Keduanya bergerak ke bawah (translateY 4px) saat ditekan
          plunger.style.transform = isPressed ? 'translateY(4px)' : 'translateY(0)';
        }
        
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
      case 'switch_spdt': {
        const blade = contentDiv.querySelector('.blade');
        if (blade) {
            // Jika state '1' (Aktif) tuas turun ke Y=45, jika '0' tuas naik ke Y=15
            const isDown = compData.state === '1';
            blade.setAttribute('y2', isDown ? '45' : '15');
        }
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
        const isSimActive = typeof CircuitStore !== 'undefined' ? CircuitStore.isSimulationActive : false;
        setPin('pin-out-0', isHigh && isSimActive);
        const ind = contentDiv.querySelector('.anim-indicator');
        if (ind) {
          if (isSimActive) {
                ind.setAttribute('fill', isHigh ? '#22c55e' : '#ef4444');
            } else {
                ind.setAttribute('fill', '#475569'); 
            }
        }
        const txt = contentDiv.querySelector('.anim-text');
        if (txt) txt.textContent = (compData.freqValue || 2) + 'Hz';
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
        const isOvercurrent = compData.isOvercurrent === true;
        const current = Math.abs(compData.simI || 0); 
        const fullDriveAmpere = (parseFloat(compData.fullDriveI) || 10) / 1000; 
        
        setPin('pin-in-0', compData.simV > 0); 
        setPin('pin-out-0', current > 0.001);
        
        const body = contentDiv.querySelector('.anim-body'); 
        const svg = contentDiv.querySelector('.anim-svg');
        const txt = contentDiv.querySelector('.anim-text');
        const warningIcon = contentDiv.querySelector('.warning-icon');

        // Baca warna dari memori (Default: merah)
        const ledColor = compData.color || 'red';
        let baseFill = '#380000';
        
        if (isOvercurrent) {
            // TAMPILAN ERROR (OVERCURRENT)
            if (body) {
                body.setAttribute('fill', '#262626'); // LED Gosong Abu-abu gelap
                body.setAttribute('stroke', '#ef4444'); // Border Merah
            }
            if (svg) {
                svg.style.filter = 'none'; 
                svg.style.opacity = 1; 
            }
            if (warningIcon) warningIcon.style.display = 'block'; 
            if (txt) {
                txt.setAttribute('fill', '#ef4444'); 
                txt.setAttribute('x', '36');         
            }
        } else {
            // TAMPILAN NORMAL 
            if (warningIcon) warningIcon.style.display = 'none'; 
            
            let intensity = 0;
            if (current > 1e-6) { 
                intensity = current / fullDriveAmpere;
                if (intensity > 1) intensity = 1; 
            }
            
            const isOn = intensity > 0.005; 
            let r = 0, g = 0, b = 0, glowRGB = '255, 0, 0';

            // ALGORITMA PENCAMPURAN WARNA (RGB) BERSANDARKAN INTENSITAS ARUS
            if (ledColor === 'red') {
                r = Math.round(56 + (intensity * 199)); 
                g = b = Math.round(intensity * 40);
                baseFill = '#380000'; glowRGB = '255, 0, 0';
            } else if (ledColor === 'green') {
                g = Math.round(56 + (intensity * 199)); 
                r = b = Math.round(intensity * 40);
                baseFill = '#003800'; glowRGB = '0, 255, 0';
            } else if (ledColor === 'blue') {
                b = Math.round(56 + (intensity * 199)); 
                r = g = Math.round(intensity * 40);
                baseFill = '#000038'; glowRGB = '0, 100, 255';
            } else if (ledColor === 'yellow') {
                r = g = Math.round(56 + (intensity * 199)); 
                b = Math.round(intensity * 40);
                baseFill = '#383800'; glowRGB = '255, 255, 0';
            }
            
            if (body) {
               body.setAttribute('fill', isOn ? `rgb(${r}, ${g}, ${b})` : baseFill);
               body.setAttribute('stroke', '#1e293b');
            }
            
            if (svg) {
              if (isOn) {
                const blur = 2 + (intensity * 18);         
                const glowAlpha = 0.1 + (intensity * 0.9); 
                // Warna pendaran (Glow) kini dinamis menyesuaikan warna lampu!
                svg.style.filter = `drop-shadow(0 0 ${blur}px rgba(${glowRGB}, ${glowAlpha}))`;
                svg.style.opacity = 1 + (intensity * 0.5); 
              } else {
                svg.style.filter = 'none';
                svg.style.opacity = 1; 
              }
            }
            
            if (txt) {
                txt.setAttribute('fill', '#4f46e5');
                txt.setAttribute('x', '30'); 
            }
        }
        if (txt) txt.textContent = `L${id}`;
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
      case 'ohmmeter': {
        setPin('pin-in-0', false); setPin('pin-in-1', false);
        const text = contentDiv.querySelector('.anim-text');
        const rangeTxt = contentDiv.querySelector('.range-txt');

        if (text) {
            if (compData.isError) {
                // Jika tersengat listrik eksternal
                text.textContent = 'ERR';
                text.setAttribute('fill', '#ef4444'); // Merah bahaya
                if (rangeTxt) rangeTxt.textContent = 'LIVE!';
            } else if (compData.isOL) {
                // Jika kabel putus / hambatan terlalu besar
                text.textContent = 'OL';
                text.setAttribute('fill', '#facc15'); // Kuning
                if (rangeTxt) rangeTxt.textContent = 'Ω';
            } else {
                // Jika berhasil membaca hambatan
                let r = compData.simR || 0;
                text.setAttribute('fill', '#4ade80'); // Hijau aman
                if (rangeTxt) rangeTxt.textContent = 'Ω';

                // Format angka agar rapi (M, k, atau Ohm)
                if (r >= 1000000) {
                    text.textContent = (r / 1000000).toFixed(1) + 'M';
                } else if (r >= 1000) {
                    text.textContent = (r / 1000).toFixed(1) + 'k';
                } else {
                    text.textContent = r.toFixed(1);
                }
            }
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
          const cv = compData.customValue ?? 10; 
          txtVal.textContent = cv >= 1000 ? `${(cv/1000).toFixed(1)}mF` : `${cv}µF`;
        }
        break;
      }
      case 'ic_4017': {
        // Ambil status voltase VCC (Kaki Power atas)
        const vccPowered = (compData.simV_vcc || 0) > 2.5; 
        
        if (compData.inputStates) {
            setPin('pin-in-0', compData.inputStates[0] > 2.5); // CLK
            setPin('pin-in-1', compData.inputStates[1] > 2.5); // ENA
            setPin('pin-in-2', compData.inputStates[2] > 2.5); // RST
            setPin('pin-in-4', compData.inputStates[4] > 0);   // GND
        }
        setPin('pin-in-3', vccPowered); // Kaki Power VCC menyala hijau jika ada setrum
        
        // Loop untuk menyalakan kabel output Q0 - Q9 dan CO
        for (let i = 0; i < 11; i++) {
            const isActive = (compData.outputStates && compData.outputStates[i] === 1);
            setPin(`pin-out-${i}`, isActive && vccPowered);
        }

        // Warna badan IC berubah sedikit menguning jika mendapat daya
        const body = contentDiv.querySelector('.anim-body');
        if (body) body.setAttribute('fill', vccPowered ? '#fef08a' : '#e8e6d3');
        break;
      }
      case 'ic_4518': {
        // 1. Baca status output (Q0 - Q3) yang dikirim oleh SimulationEngine
        const outStates = compData.outStates || [false, false, false, false];
        
        // 2. Warnai Pin Output BCD
        // setPin() akan mengubah warna garis SVG menjadi hijau terang jika `true`
        setPin('pin-out-0', outStates[0]); // Bit ke-1 (Nilai 1)
        setPin('pin-out-1', outStates[1]); // Bit ke-2 (Nilai 2)
        setPin('pin-out-2', outStates[2]); // Bit ke-3 (Nilai 4)
        setPin('pin-out-3', outStates[3]); // Bit ke-4 (Nilai 8)

        // 3. Update Angka Desimal di Punggung IC
        // TARGET SPESIFIK: Hanya ambil elemen teks yang memiliki class 'anim-text'
        const countTxt = contentDiv.querySelector('.anim-text');
        if (countTxt) {
            countTxt.textContent = compData.count !== undefined ? compData.count : '-';
        }
        // Opsional: Beri warna IC menyala saat ada angka
        const body = contentDiv.querySelector('.anim-body');
        if (body) {
            body.setAttribute('fill', compData.count !== undefined ? '#fef08a' : '#e8e6d3');
        }
        break;
      }
      case 'ic_4511': {
        // 1. Animasi Pin Input (Kiri: A, B, C, D, LT, BI, LE)
        if (compData.inputStates) {
            setPin('pin-in-0', compData.inputStates[0] > 2.5); // A
            setPin('pin-in-1', compData.inputStates[1] > 2.5); // B
            setPin('pin-in-2', compData.inputStates[2] > 2.5); // C
            setPin('pin-in-3', compData.inputStates[3] > 2.5); // D
            
            // Pin Kontrol
            if (compData.inputs > 4) setPin('pin-in-4', compData.inputStates[4] > 2.5); // LT
            if (compData.inputs > 5) setPin('pin-in-5', compData.inputStates[5] > 2.5); // BI
            if (compData.inputs > 6) setPin('pin-in-6', compData.inputStates[6] > 2.5); // LE
        }

        // 2. Animasi Pin Output (Kanan: a, b, c, d, e, f, g)
        // Membaca array outStates dari SimulationEngine
        const outStates = compData.outStates || [0,0,0,0,0,0,0];
        for (let i = 0; i < 7; i++) {
            setPin(`pin-out-${i}`, outStates[i] === 1);
        }

        // 3. Efek Visual Bodi IC (Meredup jika di-Blanking / Mati total)
        // Kita cek apakah ada minimal 1 segmen yang diperintahkan menyala
        const isWorking = outStates.includes(1);
        const body = contentDiv.querySelector('.anim-body');
        if (body) {
            body.setAttribute('fill', isWorking ? '#fef08a' : '#e8e6d3');
        }
        break;
      }
      case 'ic_4026': {
        // 1. Animasi Pin Input (Kiri: CLK, INH, RST, DEI)
        if (compData.inputStates) {
            setPin('pin-in-0', compData.inputStates[0] > 2.5); // CLK
            setPin('pin-in-1', compData.inputStates[1] > 2.5); // INH
            setPin('pin-in-2', compData.inputStates[2] > 2.5); // RST
            // Jika kabel DEI kosong, kita anggap HIGH (mesin disetel 5V)
            setPin('pin-in-3', compData.inputStates[3] > 2.5); // DEI
        }

        // 2. Animasi Pin Output (Kanan: a, b, c, d, e, f, g, dan CO)
        // Membaca array outStates dari SimulationEngine
        const outStates = compData.outStates || [0,0,0,0,0,0,0,0];
        
        // Looping untuk menyalakan 8 garis pin sekaligus
        for (let i = 0; i < 10; i++) {
            setPin(`pin-out-${i}`, outStates[i] === 1);
        }

        // 3. Efek Visual Bodi IC (Meredup jika di-Blanking / Mati total)
        // Kita periksa apakah ada minimal 1 segmen (indeks 0 sampai 6) yang menyala
        const isWorking = outStates.slice(0, 7).includes(1);
        const body = contentDiv.querySelector('.anim-body');
        if (body) {
            body.setAttribute('fill', isWorking ? '#fef08a' : '#e8e6d3');
        }
        break;
      }
      case 'ic_lm3914': {
        if (compData.inputStates) {
            setPin('pin-in-0', compData.inputStates[0]); // SIG
            setPin('pin-in-1', compData.inputStates[1]); // RHI
            setPin('pin-in-2', compData.inputStates[2]); // RLO
            setPin('pin-in-3', compData.inputStates[3]); // REFO
            setPin('pin-in-4', compData.inputStates[4]); // REFA
            setPin('pin-in-5', compData.inputStates[5]); // MOD
            setPin('pin-in-6', compData.inputStates[6]); // V+
            setPin('pin-in-7', compData.inputStates[7]); // V-
        }

        // 2. Animasi 10 Pin Output (Kanan) - Sifat ACTIVE LOW!
        if (compData.outStates) {
            for (let i = 0; i < 10; i++) {
                const pinOutEl = contentDiv.querySelector(`.pin-out-${i}`);
                if (pinOutEl) {
                    if (compData.outStates[i]) {
                        // Aktif (Menyedot Arus ke Ground) -> Bersinar Merah Terang
                        pinOutEl.setAttribute('stroke', '#ef4444'); 
                        pinOutEl.style.filter = 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.8))';
                    } else {
                        // Mati (Mengambang / Isolator) -> Abu-abu gelap
                        pinOutEl.setAttribute('stroke', '#64748b');
                        pinOutEl.style.filter = 'none';
                    }
                }
            }
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
      case 'seven_segment': {
        const currents = compData.simI_segs || [0,0,0,0,0,0,0];
        const fullDriveAmpere = 0.02; // Arus ideal 20mA untuk terang maksimal
        
        // Pemetaan class SVG berdasarkan standar urutan (a, b, c, d, e, f, g)
        const segClasses = ['.seg-a', '.seg-b', '.seg-c', '.seg-d', '.seg-e', '.seg-f', '.seg-g'];
        
        for (let i = 0; i < 7; i++) {
            // 1. Warnai garis pin input (a-g) menjadi hijau jika ada tegangan maju
            const hasVoltage = (compData.vd && compData.vd[i] !== undefined) ? compData.vd[i] > 1.5 : false;
            setPin(`pin-in-${i}`, hasVoltage);
            
            // 2. Hitung intensitas cahaya berdasarkan arus murni (Ampere)
            let current = Math.abs(currents[i]);
            let intensity = 0;
            
            if (current > 1e-6) {
                intensity = current / fullDriveAmpere;
                if (intensity > 1) intensity = 1; // Batasi maksimal 100% terang normal
            }
            
            const isOn = intensity > 0.005;
            
            // 3. Gradasi Warna (Dari Abu-abu gelap khas layar mati, ke Merah Terang LED)
            let r = Math.round(51 + (intensity * (239 - 51)));
            let g = Math.round(65 + (intensity * (68 - 65)));
            let b = Math.round(85 + (intensity * (68 - 85)));
            
            // 4. Fisika Overcurrent (Meledak jika disetrum tanpa resistor!)
            let isBlown = false;
            if (current > fullDriveAmpere * 3) {
                 r = 255; g = 255; b = 255; // Putih menyilaukan (Akan putus)
                 isBlown = true;
            }
            
            // 5. Terapkan warna dan efek Pendaran (Glow) ke elemen poligon
            const segEl = contentDiv.querySelector(segClasses[i]);
            if (segEl) {
                segEl.setAttribute('fill', isOn ? `rgb(${r}, ${g}, ${b})` : '#334155');
                
                if (isOn && !isBlown) {
                    const blur = 1 + (intensity * 4);
                    const glowAlpha = 0.2 + (intensity * 0.6);
                    segEl.style.filter = `drop-shadow(0 0 ${blur}px rgba(239, 68, 68, ${glowAlpha}))`;
                } else if (isBlown) {
                    segEl.style.filter = `drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))`;
                } else {
                    segEl.style.filter = 'none';
                }
            }
        }
        
        // Warnai pin Common Output (Katoda) jika ada arus yang berhasil mengalir pulang
        const isAnyOn = currents.some(c => Math.abs(c) > 1e-6);
        setPin('pin-out-0', isAnyOn);
        break;
      }
      case 'led_bargraph': {
        if (compData.simI_segs) {
            for (let i = 0; i < 10; i++) {
                // Cari elemen kotak kaca LED ke-i di DOM
                const segEl = contentDiv.querySelector(`.led-seg-${i}`);
                
                if (segEl) {
                    // Cek apakah arus maju (Forward Current) lebih besar dari 1mA (0.001 Ampere)
                    const isOn = compData.simI_segs[i] > 0.001; 
                    
                    if (isOn) {
                        // Tentukan Gradasi Warna (Gaya VU Meter Profesional)
                        // Karena Pin L1 (index 0) adalah tegangan terendah, kita mulai dari Hijau.
                        // L1 - L6 (Index 0-5): Hijau Aman
                        // L7 - L8 (Index 6-7): Kuning Peringatan
                        // L9 - L10 (Index 8-9): Merah Puncak/Saturasi
                        let color = '#22c55e'; // Default Hijau
                        if (i >= 6 && i <= 7) color = '#eab308'; // Kuning
                        if (i >= 8) color = '#ef4444';           // Merah
                        
                        segEl.setAttribute('fill', color);
                        segEl.style.filter = `drop-shadow(0 0 6px ${color})`;
                    } else {
                        // Lampu Mati: Kembali ke warna Kaca Gelap (Epoksi Mati)
                        segEl.setAttribute('fill', '#334155');
                        segEl.style.filter = 'none';
                    }
                }
            }
        }
        break;
      }
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
      case 'opamp_lm741': {
        // 1. Animasi Pin Input & Power (Kiri, Atas, Bawah)
        if (compData.inputStates) {
            setPin('pin-in-0', Math.abs(compData.inputStates[0]) > 0.5); // Inverting (-)
            setPin('pin-in-1', Math.abs(compData.inputStates[1]) > 0.5); // Non-Inverting (+)
            setPin('pin-in-2', compData.inputStates[2] > 2.0);           // VCC+
            setPin('pin-in-3', compData.inputStates[3] < -2.0);          // VEE-
        }

        // 2. Animasi Pin Output Berdasarkan Intensitas Analog!
        const vOut = compData.outVoltage || 0;
        const pinOutEl = contentDiv.querySelector('.pin-out-0');
        
        if (pinOutEl) {
            if (Math.abs(vOut) < 0.1) {
                // Tegangan ~0V (Netral / Mati)
                pinOutEl.setAttribute('stroke', '#64748b'); // Abu-abu
                pinOutEl.style.filter = 'none';
            } else if (vOut > 0) {
                // Tegangan POSITIF (Gradasi Hijau Terang)
                // Kita buat skala intensitas dengan asumsi maksimal 12V
                const intensity = Math.min(vOut / 12.0, 1.0); 
                const r = Math.round(34 - (intensity * 34));   
                const g = Math.round(197 + (intensity * 58));  
                const b = Math.round(94 - (intensity * 94));   
                
                pinOutEl.setAttribute('stroke', `rgb(${r}, ${g}, ${b})`);
                const glow = 0.4 + (intensity * 0.6);
                pinOutEl.style.filter = `drop-shadow(0 0 ${2 + intensity * 6}px rgba(34, 197, 94, ${glow}))`;
            } else {
                // Tegangan NEGATIF (Gradasi Biru Terang)
                const intensity = Math.min(Math.abs(vOut) / 12.0, 1.0);
                const r = Math.round(59 - (intensity * 59));   
                const g = Math.round(130 + (intensity * 125)); 
                const b = Math.round(246 + (intensity * 9));   
                
                pinOutEl.setAttribute('stroke', `rgb(${r}, ${g}, ${b})`);
                const glow = 0.4 + (intensity * 0.6);
                pinOutEl.style.filter = `drop-shadow(0 0 ${2 + intensity * 6}px rgba(59, 130, 246, ${glow}))`;
            }
        }

        // 3. Efek Bodi (Meredup jika tidak disuplai listrik minimal 5V)
        const body = contentDiv.querySelector('.anim-body');
        if (body && compData.inputStates) {
            const hasPower = (compData.inputStates[2] >= 5.0 || compData.inputStates[3] <= -5.0);
            body.setAttribute('fill', hasPower ? '#1e293b' : '#0f172a');
        }
        break;
      }
      case 'wire_node': {
        const dot = contentDiv.querySelector('.anim-body');
        if (dot) dot.setAttribute('fill', vState ? '#22c55e' : '#1e293b');
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
