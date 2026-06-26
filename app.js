// File: src/components/ComponentDefs.js

const ComponentDefs = {
  getDimensions(type) {
    const map = {
      led: [60, 60], flasher: [60, 60], diode: [60, 40], logic_probe: [60, 40], switch: [60, 40], switch_3way: [80, 60], push_button: [60, 40],
      fuse: [80, 40], ground: [40, 40], relay: [80, 80], relay_5pin: [80, 100],
      junction: [60, 60], wire_1to1: [60, 40], wire_1to2: [60, 60],
      and: [80, 60], or: [80, 60], not: [80, 60], nand: [80, 60], nor: [80, 60], xor: [80, 60], xnor: [80, 60],
      bjt_npn: [80, 80], bjt_pnp: [80, 80],     
      transformer: [100, 100], ff_sr: [80, 90], ff_d: [80, 80], ff_jk: [80, 90], ff_t: [80, 80],
      mosfet_n: [100, 100], mosfet_p: [100, 100], 
      voltmeter: [80, 80], ammeter: [80, 80],   
      opamp: [80, 60], resistor: [80, 50],
      capacitor: [80, 50], ic_555: [120, 160], power_terminal: [60, 40], output_terminal: [75, 40],
      battery: [80, 60], battery_1cell: [80, 60], battery_multi: [80, 60],
      // UBAH BARIS DI BAWAH INI (Tingginya menjadi 60 semua agar muat panah vertikal):
      ldr: [80, 60], thermistor_ntc: [80, 60], thermistor_ptc: [80, 60], potentiometer: [80, 60],
      motor_dc: [80, 80], servo: [80, 80], solenoid: [80, 60], oscilloscope: [120, 80]
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
            window.openValueModal(id, type);
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
      });
      // -------------------------------------------------

      if(div) div.style.cursor = ['switch', 'push_button', 'switch_spst', 'potentiometer', 'ldr', 'thermistor_ntc', 'thermistor_ptc'].includes(type) ? 'pointer' : 'default';
    }
    this.updateDOMState(type, compData, contentDiv, id);
  },

  initSVGTemplate(type, id, compData, contentDiv) {
    const pFill = '#e8e6d3', pStroke = '#1e293b', sw = '2';
    let svg = '';

    switch (type) {
      case 'clock_pulse':
        svg = `<svg width="60" height="40" viewBox="0 0 60 40">
          <rect class="anim-body" x="5" y="5" width="40" height="30" rx="4" fill="#0f172a" stroke="#3b82f6" stroke-width="2"/>
          <path d="M 10 20 L 15 20 L 15 10 L 25 10 L 25 30 L 35 30 L 35 20 L 40 20" fill="none" stroke="#22c55e" stroke-width="2"/>
          <line class="pin-out-0" x1="45" y1="20" x2="60" y2="20" stroke="#006600" stroke-width="3"/>
          <circle class="anim-indicator" cx="12" cy="10" r="3" fill="#ef4444"/>
        </svg>`; break;
      case 'switch_3way':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="30" x2="25" y2="30" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="55" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-1" x1="55" y1="40" x2="80" y2="40" stroke="#006600" stroke-width="3"/>
          
          <circle cx="25" cy="30" r="3" fill="#1e293b"/>
          <circle cx="55" cy="20" r="3" fill="#1e293b"/>
          <circle cx="55" cy="40" r="3" fill="#1e293b"/>
          
          <line class="anim-line" x1="25" y1="30" x2="45" y2="30" stroke="black" stroke-width="3" style="transition: all 0.15s ease-out; transform-origin: 25px 30px;"/>
          
          <rect x="20" y="45" width="40" height="10" rx="4" fill="#e2e8f0" stroke="black" stroke-width="1"/>
          <circle class="anim-knob" cx="40" cy="50" r="6" fill="#64748b" style="transition: cx 0.15s ease-out;"/>
          
          <text x="40" y="10" class="comp-label" text-anchor="middle" font-size="9" font-weight="bold">L - OFF - R</text>
        </svg>`; break;  
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
      
      case 'power_terminal':
        svg = `<svg width="60" height="40" viewBox="0 0 60 40"><line class="pin-out-0" x1="30" y1="40" x2="30" y2="20" stroke="#006600" stroke-width="3"/><path d="M 30 20 L 20 30 M 30 20 L 40 30 M 15 20 L 45 20" fill="none" stroke="${pStroke}" stroke-width="3"/><text class="anim-text comp-label resistor-val val-trigger" x="30" y="12" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;">12V</text></svg>`; break;

      case 'fuse':
        svg = `<svg width="80" height="40" viewBox="0 0 80 40"><line class="pin-in-0" x1="0" y1="20" x2="25" y2="20" stroke="#006600" stroke-width="3"/><line class="pin-out-0" x1="55" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="3"/><rect class="anim-body" x="25" y="10" width="30" height="20" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/><path class="anim-line" d="M 25 20 Q 40 5 55 20" fill="none" stroke="${pStroke}" stroke-width="3"/><text class="anim-text comp-label fuse-val val-trigger" x="40" y="8" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;"></text><text class="anim-blown comp-label" x="40" y="24" fill="red" font-weight="bold" text-anchor="middle" style="display:none;">BLOWN</text></svg>`; break;

      case 'resistor':
        svg = `<svg width="80" height="50" viewBox="0 0 80 50"><line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/><line class="pin-out-0" x1="60" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="3"/><path d="M 20 20 l 5 -10 l 10 20 l 10 -20 l 10 20 l 5 -10" fill="none" stroke="${pStroke}" stroke-width="${sw}" stroke-linejoin="round"/><text class="anim-text comp-label resistor-val val-trigger" x="40" y="42" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;"></text></svg>`; break;

      case 'capacitor':
        svg = `<svg width="80" height="50" viewBox="0 0 80 50"><line class="pin-in-0" x1="0" y1="25" x2="35" y2="25" stroke="#006600" stroke-width="3"/><line class="pin-out-0" x1="80" y1="25" x2="45" y2="25" stroke="#006600" stroke-width="3"/><line x1="35" y1="10" x2="35" y2="40" stroke="${pStroke}" stroke-width="3"/><line x1="45" y1="10" x2="45" y2="40" stroke="${pStroke}" stroke-width="3"/><text x="40" y="12" class="comp-label" text-anchor="middle">C${id}</text><text class="anim-text comp-label resistor-val val-trigger" x="40" y="48" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;"></text></svg>`; break;
      case 'flasher':
        svg = `<svg width="60" height="60" viewBox="0 0 60 60">
          <line class="pin-in-0" x1="0" y1="30" x2="15" y2="30" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="45" y1="30" x2="60" y2="30" stroke="#006600" stroke-width="3"/>
          <rect class="anim-body" x="15" y="10" width="30" height="40" rx="3" fill="#e8e6d3" stroke="#1e293b" stroke-width="2"/>
          <text x="30" y="24" text-anchor="middle" font-size="10" font-weight="bold">FLSH</text>
          <circle class="anim-ind" cx="30" cy="38" r="5" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>
          <text x="18" y="48" font-size="8" font-weight="bold">B</text>
          <text x="38" y="48" font-size="8" font-weight="bold">L</text>
        </svg>`; break;  
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
        svg = `<svg width="60" height="60" viewBox="0 0 60 60" class="anim-svg"><line class="pin-in-0" x1="0" y1="30" x2="15" y2="30" stroke="#006600" stroke-width="3"/><line class="pin-out-0" x1="45" y1="30" x2="60" y2="30" stroke="#006600" stroke-width="3"/><circle class="anim-body" cx="30" cy="30" r="15" fill="#4a0000" stroke="${pStroke}" stroke-width="${sw}"/><path d="M25 25 L35 30 L25 35 Z" fill="${pStroke}"/><line x1="35" y1="23" x2="35" y2="37" stroke="${pStroke}" stroke-width="3"/><text x="30" y="55" class="comp-label" text-anchor="middle">L${id}</text></svg>`; break;
      case 'diode':
        svg = `<svg width="60" height="40" viewBox="0 0 60 40"><line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="3"/><line class="pin-out-0" x1="35" y1="20" x2="60" y2="20" stroke="#006600" stroke-width="3"/><polygon class="anim-body" points="20,10 20,30 35,20" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/><line class="anim-line" x1="35" y1="10" x2="35" y2="30" stroke="${pStroke}" stroke-width="${sw}"/><text x="30" y="38" class="comp-label" text-anchor="middle">D${id}</text></svg>`; break;
      case 'ground':
        svg = `<svg width="40" height="40" viewBox="0 0 40 40"><line class="pin-in-0" x1="20" y1="0" x2="20" y2="20" stroke="#000000" stroke-width="3"/><line x1="8" y1="20" x2="32" y2="20" stroke="#000000" stroke-width="3"/><line x1="14" y1="26" x2="26" y2="26" stroke="#000000" stroke-width="3"/><line x1="18" y1="32" x2="22" y2="32" stroke="#000000" stroke-width="3"/></svg>`; break;
      case 'voltmeter':
        svg = `<svg width="80" height="80" viewBox="0 0 80 80"><line class="pin-in-0" x1="0" y1="40" x2="16" y2="40" stroke="#006600" stroke-width="3"/><line class="pin-in-1" x1="64" y1="40" x2="80" y2="40" stroke="#006600" stroke-width="3"/><circle cx="40" cy="40" r="24" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/><text class="anim-text meter-val" x="40" y="45" text-anchor="middle" font-size="18">0.0V</text><text x="18" y="35" class="comp-label" fill="red" font-size="14" font-weight="bold">+</text><text x="56" y="35" class="comp-label" fill="black" font-size="14" font-weight="bold">-</text></svg>`; break;
      case 'ammeter':
        svg = `<svg width="80" height="80" viewBox="0 0 80 80"><line class="pin-in-0" x1="0" y1="40" x2="16" y2="40" stroke="#006600" stroke-width="3"/><line class="pin-out-0" x1="64" y1="40" x2="80" y2="40" stroke="#006600" stroke-width="3"/><circle cx="40" cy="40" r="24" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/><text class="anim-text meter-val" x="40" y="45" text-anchor="middle" font-size="18">0.00A</text></svg>`; break;
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
      case 'transformer':
        svg = `<svg width="100" height="100" viewBox="0 0 100 100"><line x1="46" y1="15" x2="46" y2="85" stroke="${pStroke}" stroke-width="3"/><line x1="54" y1="15" x2="54" y2="85" stroke="${pStroke}" stroke-width="3"/><line x1="0" y1="30" x2="30" y2="30" stroke="#006600" stroke-width="2" class="pin-in-0"/><line x1="0" y1="70" x2="30" y2="70" stroke="#006600" stroke-width="2" class="pin-in-1"/><path class="anim-coil-p" d="M 30 30 C 45 30 45 40 30 40 C 45 40 45 50 30 50 C 45 50 45 60 30 60 C 45 60 45 70 30 70" fill="none" stroke="${pStroke}" stroke-width="3"/><line x1="70" y1="20" x2="100" y2="20" stroke="#006600" stroke-width="2" class="pin-out-0"/><line x1="70" y1="50" x2="100" y2="50" stroke="#006600" stroke-width="2" class="pin-out-1"/><line x1="70" y1="80" x2="100" y2="80" stroke="#006600" stroke-width="2" class="pin-out-2"/><path class="anim-coil-s" d="M 70 20 C 55 20 55 35 70 35 C 55 35 55 50 70 50 C 55 50 55 65 70 65 C 55 65 55 80 70 80" fill="none" stroke="${pStroke}" stroke-width="3"/></svg>`; break;
      case 'oscilloscope':
        // Kita menggunakan <foreignObject> untuk menyisipkan HTML5 Canvas ke dalam SVG!
        svg = `<svg width="120" height="80" viewBox="0 0 120 80">
          <line class="pin-in-0" x1="0" y1="40" x2="20" y2="40" stroke="#006600" stroke-width="3"/>
          <rect class="anim-body" x="20" y="10" width="100" height="60" rx="4" fill="#0f172a" stroke="#334155" stroke-width="3"/>
          <foreignObject x="25" y="15" width="90" height="50">
            <canvas class="osc-canvas" width="90" height="50" style="background:#020617; border-radius:2px;"></canvas>
          </foreignObject>
          <text x="70" y="8" class="comp-label" font-size="9" fill="#94a3b8" font-weight="bold" text-anchor="middle">OSCILLOSCOPE</text>
        </svg>`; break;
      // === SENSOR INTERAKTIF ===
      case 'ldr':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="25" x2="20" y2="25" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="60" y1="25" x2="80" y2="25" stroke="#006600" stroke-width="3"/>
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
          <text x="50" y="46" class="comp-label" font-weight="bold">${label}</text>
          
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
          <text x="35" y="44" class="comp-label" font-size="10">R</text>
          <circle cx="34" cy="41" r="2" fill="none" stroke="black"/>
          <text x="35" y="74" class="comp-label" font-size="10">CV</text>
          <text x="85" y="44" class="comp-label" text-anchor="end" font-size="10">Q</text>
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
        </svg>`; break;
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
          
          <text x="40" y="16" text-anchor="middle" font-size="9" font-weight="bold" fill="#64748b">DC MOTOR</text>
          <text class="rpm-text" x="40" y="70" text-anchor="middle" font-size="10" font-weight="bold" fill="#0ea5e9">0 RPM</text>
        </svg>`; break;
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
          <g class="anim-horn" style="transform-origin: 60px 40px;"><line x1="60" y1="40" x2="60" y2="15" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/></g>
          <text class="anim-text comp-label" x="38" y="78" text-anchor="middle" font-weight="bold" fill="#d97706">0°</text>
        </svg>`; break;
      case 'solenoid':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="30" x2="15" y2="30" stroke="#006600" stroke-width="3"/>
          <line class="pin-out-0" x1="65" y1="30" x2="80" y2="30" stroke="#006600" stroke-width="3"/>
          <rect class="anim-body" x="15" y="15" width="40" height="30" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <path d="M 20 15 v 30 M 25 15 v 30 M 30 15 v 30 M 35 15 v 30 M 40 15 v 30" stroke="${pStroke}" stroke-width="1"/>
          <rect class="anim-plunger" x="55" y="25" width="20" height="10" fill="#64748b" stroke="${pStroke}" stroke-width="1" style="transition: transform 0.2s;"/>
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
      case 'clock_pulse': {
        const isHigh = compData.state === '1';
        setPin('pin-out-0', isHigh && vState);
        const ind = contentDiv.querySelector('.anim-indicator');
        if (ind) ind.setAttribute('fill', (isHigh && vState) ? '#22c55e' : '#475569');
        break;
      }
      case 'switch': {
        const isClosed = compData.state === '1'; setPin('pin-out-0', isClosed);
        const body = contentDiv.querySelector('.anim-body'); const text = contentDiv.querySelector('.anim-text');
        if (body) body.setAttribute('fill', isClosed ? '#dc2626' : '#2563eb');
        if (text) text.textContent = compData.state || '0';
        break;
      }
      case 'switch_3way': {
        const state = compData.state || '0'; // '0'=Tengah(Off), '1'=Kiri(Out0), '2'=Kanan(Out1)
        
        setPin('pin-in-0', vState);
        setPin('pin-out-0', state === '1' && vState);
        setPin('pin-out-1', state === '2' && vState);

        const line = contentDiv.querySelector('.anim-line');
        const knob = contentDiv.querySelector('.anim-knob');
        
        if (line && knob) {
          if (state === '1') {
            line.setAttribute('x2', '55'); line.setAttribute('y2', '20'); // Tuas nyambung ke atas (Kiri)
            knob.setAttribute('cx', '26'); // Tombol geser kiri
          } else if (state === '2') {
            line.setAttribute('x2', '55'); line.setAttribute('y2', '40'); // Tuas nyambung ke bawah (Kanan)
            knob.setAttribute('cx', '54'); // Tombol geser kanan
          } else {
            line.setAttribute('x2', '45'); line.setAttribute('y2', '30'); // Tuas gantung di tengah
            knob.setAttribute('cx', '40'); // Tombol di tengah
          }
        }
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
      case 'battery': case 'battery_1cell': case 'battery_multi': 
        setPin('pin-out-0', vState || CircuitStore.isSimulationActive); 
        setPin('pin-out-1', false); 
        const txtValB = contentDiv.querySelector('.anim-text');
        if (txtValB) {
           let v = compData.customValue;
           if (v == null) v = type === 'battery_1cell' ? 1.5 : 12;
           txtValB.textContent = v + 'V';
        }
        break;
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
        if (txtVal) txtVal.textContent = (compData.customValue || 10) + 'A';
        break;
      }
      case 'led': {
        const isOn = compData.simV > 1.5; setPin('pin-in-0', vState); setPin('pin-out-0', isOn);
        const body = contentDiv.querySelector('.anim-body'); const svg = contentDiv.querySelector('.anim-svg');
        if (body) body.setAttribute('fill', isOn ? '#ef4444' : '#4a0000');
        if (svg) svg.style.filter = isOn ? 'drop-shadow(0 0 8px red)' : 'none';
        break;
      }
      case 'diode':
      case 'resistor': {
        setPin('pin-in-0', vState); setPin('pin-out-0', vState);
        if (type === 'resistor') {
          const txtVal = contentDiv.querySelector('.anim-text');
          if (txtVal) {
            const rv = compData.customValue || 330;
            txtVal.textContent = rv >= 1000000 ? `${(rv/1e6).toFixed(1)}M` : rv >= 1000 ? `${(rv/1000).toFixed(1)}k` : `${rv}Ω`;
          }
        }
        break;
      }
      case 'voltmeter': {
        setPin('pin-in-0', false); setPin('pin-in-1', false);
        let displayVolt = compData.displayVolt !== undefined ? compData.displayVolt : (compData.simV || 0);
        const text = contentDiv.querySelector('.anim-text');
        if (text) text.textContent = displayVolt.toFixed(1) + 'V';
        break;
      }
      case 'flasher': {
        const isOn = compData.state === '1';
        setPin('pin-in-0', vState);
        setPin('pin-out-0', isOn && vState);
        const ind = contentDiv.querySelector('.anim-ind');
        // Lampu indikator kecil di tengah flasher menyala kuning saat cetek
        if (ind) ind.setAttribute('fill', (isOn && vState) ? '#eab308' : '#475569');
        break;
      }
      case 'ammeter': {
        setPin('pin-in-0', vState); setPin('pin-out-0', vState);
        const text = contentDiv.querySelector('.anim-text');
        if (text) text.textContent = Math.abs(compData.simI || 0).toFixed(2) + 'A';
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
        break;
      }
      case 'motor_dc': {
        let isPowered = compData.isPowered || false;
        let rpmValue = compData.rpmValue || 0;

        setPin('pin-in-0', isPowered && rpmValue > 0); 
        setPin('pin-out-0', isPowered && rpmValue < 0);
        
        const rotor = contentDiv.querySelector('.anim-rotor');
        const rpmText = contentDiv.querySelector('.rpm-text');
        
        if (isPowered && Math.abs(rpmValue) > 50) {
            let speed = Math.max(0.04, 300 / (Math.abs(rpmValue) + 1)); 
            let direction = rpmValue >= 0 ? 'normal' : 'reverse';
            if (rotor) rotor.style.animation = `motorSpin ${speed}s linear infinite ${direction}`;
            if (rpmText) {
                rpmText.textContent = `${rpmValue} RPM`;
                rpmText.setAttribute('fill', '#ef4444');
            }
        } else {
            if (rotor) rotor.style.animation = 'none'; 
            if (rpmText) {
                rpmText.textContent = '0 RPM';
                rpmText.setAttribute('fill', '#64748b'); 
            }
        }
        break;
      }
      case 'servo': {
        let isPowered = compData.isPowered || false;
        let angle = compData.servoAngle || 0;

        setPin('pin-in-0', angle > 0); 
        setPin('pin-in-1', isPowered); 
        setPin('pin-in-2', false);
        
        const horn = contentDiv.querySelector('.anim-horn');
        if (horn && isPowered) horn.style.transform = `rotate(${angle}deg)`;
        const text = contentDiv.querySelector('.anim-text');
        if (text) text.textContent = isPowered ? Math.round(angle) + '°' : 'OFF';
        break;
      }
      
      case 'solenoid': {
        let isPowered = compData.isPoweredSolenoid || false;
        const vState = (compData.simV || 0) > 0;
        
        setPin('pin-in-0', vState); setPin('pin-out-0', vState);
        const plunger = contentDiv.querySelector('.anim-plunger');
        if (plunger) {
            plunger.style.transform = isPowered ? 'translateX(-12px)' : 'translateX(0)';
            plunger.setAttribute('fill', isPowered ? '#ef4444' : '#64748b');
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
          const cv = compData.customValue || 10;
          txtVal.textContent = cv >= 1000 ? `${(cv/1000).toFixed(1)}mF` : `${cv}µF`;
        }
        break;
      }
      case 'ic_555': {
        const isActive = compData.outputState === 1;
        setPin('pin-in-5', vState); // Pin VCC
        setPin('pin-out-0', isActive); // Pin Q
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
      case 'oscilloscope': {
        const isSimActive = typeof CircuitStore !== 'undefined' ? CircuitStore.isSimulationActive : false;
        let displayVolt = compData.displayVolt !== undefined ? compData.displayVolt : (compData.simV || 0);

        setPin('pin-in-0', isSimActive && displayVolt > 0);

        const canvas = contentDiv.querySelector('.osc-canvas');
        if (!canvas) break;
        const ctx = canvas.getContext('2d');

        // Buat memori array historis panjang 90 pixel
        if (!compData.oscHistory) compData.oscHistory = new Array(90).fill(0);

        if (!isSimActive) displayVolt = 0; // Matikan jika simulasi stop

        // Dorong memori (Mirip mesin cetak detak jantung)
        compData.oscHistory.shift();
        compData.oscHistory.push(displayVolt);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Gambar Garis Skala Grid
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; ctx.beginPath();
        ctx.moveTo(0, 12.5); ctx.lineTo(90, 12.5); 
        ctx.moveTo(0, 25); ctx.lineTo(90, 25);   
        ctx.moveTo(0, 37.5); ctx.lineTo(90, 37.5); 
        ctx.stroke();

        // Gambar Gelombang Real-time
        ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i < compData.oscHistory.length; i++) {
            let v = compData.oscHistory[i];
            let maxV = 12; // Skala maksimal 12V
            let y = 50 - ((v / maxV) * 45); 
            if (y < 2) y = 2; if (y > 48) y = 48; // Batas mentok layar
            if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
        }
        ctx.stroke();

        // Label Voltase
        ctx.fillStyle = '#4ade80'; ctx.font = '10px monospace';
        ctx.fillText(displayVolt.toFixed(1) + 'V', 2, 10);
        break;
      }
      case 'junction': case 'wire_1to2':
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
      rotation: c.rotation || 0, // --- TAMBAHKAN BARIS INI ---
      locked: c.locked || false // Status kunci push button (latch), agar tidak hilang saat undo/redo/export
    }));

    // OPTIMASI 2: Kloning Manual untuk struktur Koneksi bersarang (Nested)
    // Titik jalan kabel (waypoints) direplikasi array-nya satu per satu
    const clonedConnections = CircuitStore.connections.map(conn => ({
  id: conn.id, // 🟢 FIX: Pastikan ID statis kabel ikut disimpan!
  source: { compId: conn.source.compId, pinIndex: conn.source.pinIndex },
  target: { compId: conn.target.compId, pinIndex: conn.target.pinIndex },
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
if (wireSvg) {
    // 🟢 FIX: Hapus semua <path> secara mutlak, sama seperti di clearCanvas main.js
    wireSvg.querySelectorAll('path').forEach(p => p.remove());
}

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
        simV: 0, simI: 0
      };
      const div = buildComponentElement(compData); 
      canvas.appendChild(div);
      CircuitStore.addComponent({ ...compData, element: div });
    });
    
    state.connections.forEach(conn => {
  CircuitStore.addConnection({
    id: conn.id, // 🟢 FIX: Kembalikan ID aslinya
    source: { compId: parseInt(conn.source.compId), pinIndex: parseInt(conn.source.pinIndex || 0) },
    target: { compId: parseInt(conn.target.compId), pinIndex: parseInt(conn.target.pinIndex || 0) },
    waypoints: conn.waypoints ? conn.waypoints.map(wp => ({ x: wp.x, y: wp.y })) : []
  });
});
    requestAnimationFrame(() => {
      drawConnections(); updateConnectionPointVisuals();
      if (CircuitStore.isSimulationActive) SimulationEngine.run();
    });
  }
};


// File: src/state/CircuitStore.js

const CircuitStore = {
  components: [],
  connections: [],
  connectionStart: null,
  componentIdCounter: 0,
  wireIdCounter: 0, // 🟢 FIX: Deklarasi resmi counter ID kabel
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
      if (['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'].includes(c.type) || c.type.startsWith('ff_')) {
        c.inputStates = new Array(c.inputs).fill(0);
        c.outputState = 0;
        c.lastClk = 0;
      }
    });

    UIManager.showToast('▶ Simulasi Dinyalakan');
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
      comp.simV = 0; comp.simI = 0; comp.simV_signal = 0;
      comp.inputStates = new Array(comp.inputs).fill(0); comp.outputState = 0;
      if (comp.type === 'led' || comp.type === 'diode') { comp.element.dataset.state = '0'; comp.state = '0'; }
      
      // 🟢 FIX: Reset status memori putaran Aktuator saat listrik dicabut
      if (comp.type === 'motor_dc') { comp.isPowered = false; comp.rpmValue = 0; }
      if (comp.type === 'servo') { comp.isPowered = false; comp.servoAngle = 0; }
      if (comp.type === 'solenoid') { comp.isPoweredSolenoid = false; }
      if (comp.type === 'voltmeter' || comp.type === 'oscilloscope') { comp.displayVolt = 0; }
      
      const cd = document.getElementById(`content-${comp.id}`); if (cd) ComponentDefs.updateContent(comp.type, comp.id, comp, cd, comp.element);
    });
    document.querySelectorAll('#wire-svg path').forEach(p => {
      p.classList.remove('wire-active', 'wire-12v', 'wire-5v');
    });
    UIManager.showToast('⏹ Simulasi Dimatikan');
  },

  run() {
    if (!CircuitStore.isSimulationActive) return;

    let changed = true;
    let iter = 0;
    let globalPathActiveIds = new Set();
    let globalNodeVoltages = new Map();

    CircuitStore.components.forEach(c => {
      // 🟢 FIX: Clock dan Switch punya sifat dasar yang sama
      if (c.type === 'switch' || c.type === 'clock_pulse') {
        c.outputState = c.state === '1' ? 1 : 0;
        c.simV = c.outputState ? 5 : 0;
      }
    });

    while (changed && iter < 15) {
      changed = false;
      iter++;
      globalPathActiveIds = new Set();
      globalNodeVoltages = new Map();

      // --- 1. Evaluasi Logika Digital Awal ---
      CircuitStore.components.forEach(c => {
        if (['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'].includes(c.type)) {
          if (!c.inputStates) c.inputStates = new Array(c.inputs).fill(0);
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
             c.outputState = out; c.simV = out ? 5 : 0; changed = true;
          }
        }
      });

      // --- 2. DFS Cluster ---
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
          let cluster = []; let q = [c.id]; visited.add(c.id);
          while(q.length > 0) {
            let curr = q.pop();
            cluster.push(CircuitStore.components.find(comp => comp.id === curr));
            adj[curr].forEach(neighbor => {
              if (!visited.has(neighbor)) { visited.add(neighbor); q.push(neighbor); }
            });
          }
          clusters.push(cluster);
        }
      });

      // --- 3. Evaluasi Fisika DC ---
      clusters.forEach(cluster => {
        let highNet = new Set(); let lowNet = new Set(); let link = {};
        function tie(a, b) { if (!link[a]) link[a] = []; if (!link[b]) link[b] = []; link[a].push(b); link[b].push(a); }

        let sourceVoltage = 0;
        let localNodeVoltages = new Map();

        cluster.forEach(c => {
          if (c.type === 'switch_spst' && c.state === '0') return; 
          if (c.type === 'fuse' && c.state === 'blown') return;
          if (c.type === 'voltmeter' || c.type === 'servo' || c.type === 'oscilloscope') return;
         if (c.type === 'push_button' && c.state === '1') tie(`c${c.id}_in0`, `c${c.id}_out0`);

          // TAMBAHKAN LOGIKA SAKLAR 3 ARAH DI SINI:
          if (c.type === 'switch_3way') {
            if (c.state === '1') tie(`c${c.id}_in0`, `c${c.id}_out0`); // Sambung Input ke Output Atas (Kiri)
            if (c.state === '2') tie(`c${c.id}_in0`, `c${c.id}_out1`); // Sambung Input ke Output Bawah (Kanan)
          }
          if (c.type === 'flasher' && c.state === '1') tie(`c${c.id}_in0`, `c${c.id}_out0`);
          if (['junction', 'wire_1to1', 'wire_1to2', 'motor_dc', 'solenoid', 'switch_spst', 'resistor', 'fuse', 'diode', 'led', 'ammeter'].includes(c.type)) {
            tie(`c${c.id}_in0`, `c${c.id}_out0`);
          }

          if (c.type === 'relay' && c.state === '1') tie(`c${c.id}_in1`, `c${c.id}_out1`); 
          if (c.type === 'relay_5pin') {
            if (c.state === '1') tie(`c${c.id}_in1`, `c${c.id}_out2`); 
            else tie(`c${c.id}_in1`, `c${c.id}_out1`);
          }
          if (c.type === 'junction' || c.type === 'wire_1to2') {
            tie(`c${c.id}_in0`, `c${c.id}_out0`); tie(`c${c.id}_in0`, `c${c.id}_out1`);
            if (c.type === 'junction') tie(`c${c.id}_in0`, `c${c.id}_out2`);
          }
          if ((c.type === 'bjt_npn' || c.type === 'mosfet_n') && c.state === '1') tie(`c${c.id}_in1`, `c${c.id}_out0`); 
          if ((c.type === 'bjt_pnp' || c.type === 'mosfet_p') && c.state === '1') tie(`c${c.id}_in1`, `c${c.id}_out0`); 

          if (c.type === 'transformer') { tie(`c${c.id}_in0`, `c${c.id}_in1`); tie(`c${c.id}_out0`, `c${c.id}_out1`); tie(`c${c.id}_out1`, `c${c.id}_out2`); }
          if (c.type.startsWith('battery')) sourceVoltage = c.customValue != null ? c.customValue : (c.type === 'battery_1cell' ? 1.5 : 12);
        });

        CircuitStore.connections.forEach(conn => {
          if (cluster.some(c => c.id === conn.source.compId)) {
            let sType = (conn.source.type === 'input') ? 'in' : 'out';
            let tType = (conn.target.type === 'output') ? 'out' : 'in';

            let sPinStr = `c${conn.source.compId}_${sType}${conn.source.pinIndex}`;
            let sCompType = CircuitStore.components.find(c=>c.id===conn.source.compId)?.type;
            if (['voltmeter', 'servo', 'oscilloscope'].includes(sCompType)) sPinStr = `c${conn.source.compId}_in${conn.source.pinIndex}`;
            if (sCompType && sCompType.startsWith('battery')) sPinStr = `c${conn.source.compId}_out${conn.source.pinIndex}`;
            
            let tPinStr = `c${conn.target.compId}_${tType}${conn.target.pinIndex}`;
            let tCompType = CircuitStore.components.find(c=>c.id===conn.target.compId)?.type;
            if (tCompType && tCompType.startsWith('battery')) tPinStr = `c${conn.target.compId}_out${conn.target.pinIndex}`;
            tie(sPinStr, tPinStr);
          }
        });

        let strictSinks = new Set(); let strictSources = new Set(); 
        let qHigh = []; let qLow = [];

        cluster.forEach(c => {
          if (c.type.startsWith('battery')) { 
             let v = c.customValue || (c.type === 'battery_1cell' ? 1.5 : 12);
             strictSources.add(`c${c.id}_out0`); strictSinks.add(`c${c.id}_out1`); 
             qHigh.push(`c${c.id}_out0`); qLow.push(`c${c.id}_out1`); 
             localNodeVoltages.set(`c${c.id}_out0`, v); 
          }
          else if (c.type.startsWith('ff_')) {
              if (c.outputState === undefined) c.outputState = 0;
              if (c.outputState === 1) {
                  strictSources.add(`c${c.id}_out0`); qHigh.push(`c${c.id}_out0`); localNodeVoltages.set(`c${c.id}_out0`, 5);
                  strictSinks.add(`c${c.id}_out1`); qLow.push(`c${c.id}_out1`);
              } else {
                  strictSinks.add(`c${c.id}_out0`); qLow.push(`c${c.id}_out0`);
                  strictSources.add(`c${c.id}_out1`); qHigh.push(`c${c.id}_out1`); localNodeVoltages.set(`c${c.id}_out1`, 5);
              }
          }
          else if (c.type === 'motor_dc') {
              let vIn = 0;
              let isPowered = highNet.has(`c${c.id}_in0`);
              if (isPowered) {
                  vIn = 5; 
                  const inConn = CircuitStore.connections.find(conn => conn.target.compId === c.id && conn.target.pinIndex === 0);
                  if (inConn) {
                      const srcComp = CircuitStore.components.find(comp => comp.id === inConn.source.compId);
                      if (srcComp && ['potentiometer', 'ldr', 'thermistor_ntc', 'thermistor_ptc'].includes(srcComp.type)) {
                          let sensorVal = parseInt(srcComp.state || '50');
                          vIn = (sensorVal / 100) * 5; 
                      }
                  }
              }
              c.simV = vIn; 
              if (vIn > 0) { strictSinks.add(`c${c.id}_out0`); qLow.push(`c${c.id}_out0`); changed = true; }
          }  
          if (c.type === 'ground') { strictSinks.add(`c${c.id}_in0`); qLow.push(`c${c.id}_in0`); }
          if (c.type === 'power_terminal') {
              let v = c.customValue != null ? c.customValue : 12;
              strictSources.add(`c${c.id}_out0`); qHigh.push(`c${c.id}_out0`); localNodeVoltages.set(`c${c.id}_out0`, v);
          }
          // 🟢 FIX: Clock bertindak sebagai sumber listrik 5V
          if (c.type === 'switch' || c.type === 'clock_pulse') {
              if (c.state === '1') { strictSources.add(`c${c.id}_out0`); qHigh.push(`c${c.id}_out0`); localNodeVoltages.set(`c${c.id}_out0`, 5); }
              else { strictSinks.add(`c${c.id}_out0`); qLow.push(`c${c.id}_out0`); }
          }
          if (c.type === 'ic_555') {
              if (c.outputState === 1) {
                  let vcc = globalNodeVoltages.get(`c${c.id}_in5`) || 5;
                  strictSources.add(`c${c.id}_out0`); qHigh.push(`c${c.id}_out0`); localNodeVoltages.set(`c${c.id}_out0`, vcc);
              } else {
                  strictSinks.add(`c${c.id}_out0`); qLow.push(`c${c.id}_out0`);
                  strictSinks.add(`c${c.id}_out1`); qLow.push(`c${c.id}_out1`); 
              } 
          }
          // 🟢 FIX 2: Izinkan Op-Amp mengeluarkan arus 5V
          if (['opamp', 'and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'].includes(c.type)) {
            if (c.outputState === 1) { strictSources.add(`c${c.id}_out0`); qHigh.push(`c${c.id}_out0`); localNodeVoltages.set(`c${c.id}_out0`, 5); } 
            else { strictSinks.add(`c${c.id}_out0`); qLow.push(`c${c.id}_out0`); }
          }
        });

        while (qHigh.length > 0) {
          let curr = qHigh.pop();
          if (!highNet.has(curr)) { 
            highNet.add(curr); globalNodeVoltages.set(curr, localNodeVoltages.get(curr) || sourceVoltage || 5); 
            if (link[curr]) { 
              link[curr].forEach(n => { if (!highNet.has(n) && !strictSinks.has(n)) { localNodeVoltages.set(n, localNodeVoltages.get(curr)); qHigh.push(n); } }); 
            } 
          }
        }
        while (qLow.length > 0) {
          let curr = qLow.pop();
          if (!lowNet.has(curr)) { 
            lowNet.add(curr); 
            if (link[curr]) { link[curr].forEach(n => { if (!lowNet.has(n) && !strictSources.has(n)) qLow.push(n); }); } 
          }
        }

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
            else if (['ldr', 'thermistor_ntc', 'thermistor_ptc'].includes(c.type)) {
                let pIn0 = `c${c.id}_in0`;
                if (highNet.has(pIn0)) {
                    let ratio = parseInt(c.state || '50') / 100;
                    let baseV = globalNodeVoltages.get(pIn0) || sourceVoltage;
                    let outV = baseV * ratio;
                    let pOut0 = `c${c.id}_out0`;
                    if (outV > 0) { strictSources.add(pOut0); qHigh.push(pOut0); localNodeVoltages.set(pOut0, outV); analogAdded = true; }
                }
            }
        });
        if (analogAdded) {
            while (qHigh.length > 0) {
              let curr = qHigh.pop();
              if (!highNet.has(curr)) { 
                highNet.add(curr); globalNodeVoltages.set(curr, localNodeVoltages.get(curr)); 
                if (link[curr]) { link[curr].forEach(n => { if (!highNet.has(n) && !strictSinks.has(n)) { localNodeVoltages.set(n, localNodeVoltages.get(curr)); qHigh.push(n); } }); } 
              }
            }
        }

        let pathActiveIds = new Set(); let totalResistance = 0; let activeConsumers = [];

        cluster.forEach(c => {
          let hasHigh = false; let hasLow = false;
          const pinChecks = [`c${c.id}_in0`, `c${c.id}_in1`, `c${c.id}_out0`, `c${c.id}_out1`, `c${c.id}_out2`];
          pinChecks.forEach(p => { if (highNet.has(p)) hasHigh = true; if (lowNet.has(p)) hasLow = true; });

          if (hasHigh && hasLow) {
            if (c.type === 'led' || c.type === 'diode') totalResistance += 100;
            if (c.type === 'resistor') totalResistance += (c.customValue || 330);
            if (c.type === 'motor_dc') totalResistance += 20; 
            if (c.type === 'solenoid') totalResistance += 30; 
            if (c.type === 'ic_555') { totalResistance += 100; activeConsumers.push(c); pathActiveIds.add(c.id); }
            if (c.type === 'ldr') { let lux = parseInt(c.state || '50'); totalResistance += Math.max(100, 100000 - (lux * 990)); }
            if (c.type === 'thermistor_ntc') { let temp = parseInt(c.state || '50'); totalResistance += Math.max(100, 10000 - (temp * 90)); }
            if (c.type === 'thermistor_ptc') { let temp = parseInt(c.state || '50'); totalResistance += Math.max(100, 100 + (temp * 99)); }
            if (c.type === 'transformer') totalResistance += 50;
            if (!['relay', 'potentiometer', 'voltmeter', 'oscilloscope'].includes(c.type)) activeConsumers.push(c);
            if (c.type !== 'voltmeter' && c.type !== 'oscilloscope') pathActiveIds.add(c.id); 
            if (c.type === 'flasher' && c.state === '1') { totalResistance += 2; activeConsumers.push(c); pathActiveIds.add(c.id); }
          }

          if (c.type === 'relay' || c.type === 'relay_5pin') {
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
              let vccHigh = highNet.has(`c${c.id}_in1`); let gndLow = lowNet.has(`c${c.id}_in2`);
              if (vccHigh && gndLow) {
                  c.simV = 5; c.simV_signal = globalNodeVoltages.get(`c${c.id}_in0`) || 0; 
                  totalResistance += 50; pathActiveIds.add(c.id); activeConsumers.push(c);
              }
          }
          else if (c.type === 'output_terminal') {
              let pin0High = highNet.has(`c${c.id}_in0`);
              let attachedVolt = 0;
              if (pin0High) attachedVolt = globalNodeVoltages.get(`c${c.id}_in0`) || sourceVoltage || 12;
              c.simV = attachedVolt;
              if (c.simV > 0) pathActiveIds.add(c.id); 
          }
          else if (c.type === 'logic_probe') {
              let isHigh = highNet.has(`c${c.id}_in0`); let isLow = lowNet.has(`c${c.id}_in0`);
              if (isHigh && !isLow) { c.logicState = '1'; pathActiveIds.add(c.id); } 
              else if (isLow && !isHigh) { c.logicState = '0'; pathActiveIds.add(c.id); } 
              else if (isHigh && isLow) { c.logicState = 'E'; pathActiveIds.add(c.id); } 
              else { c.logicState = 'Z'; }
          }
          else if (c.type === 'voltmeter' || c.type === 'oscilloscope') {
             let p0 = `c${c.id}_in0`; let p1 = `c${c.id}_in1`;
             let pin0High = highNet.has(p0); let pin0Low  = lowNet.has(p0);
             let pin1High = highNet.has(p1); let pin1Low  = lowNet.has(p1);
             
             // 🟢 FIX V21: Baca tegangan murni/aktual dari titik kabel, 
             // sehingga output 5V dari Flip-Flop atau Gerbang Logika bisa terbaca!
             let actualV0 = globalNodeVoltages.get(p0) !== undefined ? globalNodeVoltages.get(p0) : (sourceVoltage || 5);
             let actualV1 = globalNodeVoltages.get(p1) !== undefined ? globalNodeVoltages.get(p1) : (sourceVoltage || 5);

             let v0 = 0, v1 = 0;
             if (totalResistance === 0) {
                 if (pin0High && !pin0Low) v0 = actualV0;
                 if (c.type === 'voltmeter' && pin1High && !pin1Low) v1 = actualV1;
             } else {
                 if (pin0High) v0 = actualV0;
                 if (c.type === 'voltmeter') {
                     if (pin1High) v1 = actualV1;
                     if (strictSinks.has(p1)) v1 = 0;
                 }
                 if (strictSinks.has(p0)) v0 = 0;
                 if (c.type === 'voltmeter' && pin0High && pin1High && v0 === v1) v1 = 0; 
             }
             c.simV = v0 - v1;
             if (Math.abs(c.simV) > 0) pathActiveIds.add(c.id);
          }
        });

        let isShortCircuit = false;
        for (let node of highNet) { if (lowNet.has(node)) { isShortCircuit = true; break; } }
        if (isShortCircuit) {
          const fuses = cluster.filter(f => f.type === 'fuse' && f.state !== 'blown' && (highNet.has(`c${f.id}_in0`) || highNet.has(`c${f.id}_out0`)) );
          if (fuses.length > 0) { fuses[0].state = 'blown'; fuses[0].simV = 0; this.stop(); UIManager.showToast('💥 Sekering Putus! Terjadi Korsleting', 3000); return; }
          if (activeConsumers.length === 0) { totalResistance = 0.001; }
        }

        let systemCurrent = totalResistance > 0 ? (sourceVoltage / totalResistance) : 0;

        cluster.forEach(c => {
          if (pathActiveIds.has(c.id) && !['voltmeter', 'oscilloscope', 'switch', 'clock_pulse', 'servo', 'and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'].includes(c.type)) {
            c.simI = systemCurrent; c.simV = globalNodeVoltages.get(`c${c.id}_in0`) || sourceVoltage || 0;
          } else if (!['servo', 'voltmeter', 'oscilloscope', 'switch', 'and', 'or', 'not', 'nand', 'clock_pulse', 'nor', 'xor', 'xnor'].includes(c.type)) { 
            c.simI = 0; c.simV = globalNodeVoltages.get(`c${c.id}_in0`) || 0;
          }
          
          if (c.type === 'fuse' && c.state !== 'blown') {
            if (systemCurrent > (c.customValue || 10)) {
              c.state = 'blown'; c.simI = 0; setTimeout(() => this.run(), 100);
            }
          }
          if (pathActiveIds.has(c.id)) { globalPathActiveIds.add(c.id); }
        });
      }); 

      // --- 4. Umpan Balik Gerbang Logika & IC ---
      CircuitStore.components.forEach(c => {
        // 🟢 FIX 1: Logika Komparator Op-Amp
        if (c.type === 'opamp') {
            let vPlus = globalNodeVoltages.get(`c${c.id}_in0`) || 0;
            let vMinus = globalNodeVoltages.get(`c${c.id}_in1`) || 0;
            let newOut = (vPlus > vMinus) ? 1 : 0;
            if (c.outputState !== newOut) { c.outputState = newOut; c.state = newOut.toString(); changed = true; }
        }
        else if (c.type === 'ic_555') {
            let vcc = globalNodeVoltages.get(`c${c.id}_in5`) || 0;
            let gnd = globalNodeVoltages.get(`c${c.id}_in0`) || 0;
            if (vcc - gnd >= 3) {
                let v_th = globalNodeVoltages.get(`c${c.id}_in4`) || 0;
                let v_tr = globalNodeVoltages.get(`c${c.id}_in1`) || 0;
                let v_r = globalNodeVoltages.get(`c${c.id}_in2`);
                if (v_r === undefined) v_r = vcc; 
                let v_cv = globalNodeVoltages.get(`c${c.id}_in3`);
                if (v_cv === undefined || v_cv === 0) v_cv = (2/3) * vcc;
                let thresh = v_cv; let trig = v_cv / 2;
                if (v_r < 1.0) c.state = '0'; 
                else { if (v_tr < trig) c.state = '1'; else if (v_th > thresh) c.state = '0'; }
                let newOut = c.state === '1' ? 1 : 0;
                if (c.outputState !== newOut) { c.outputState = newOut; changed = true; }
            } else {
                if (c.outputState !== 0) { c.outputState = 0; c.state = '0'; changed = true; }
            }
        }  
        else if (['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'].includes(c.type) || c.type.startsWith('ff_')) {
          if (c.type.startsWith('ff_')) {
              let clkPinIdx = (c.type === 'ff_sr' || c.type === 'ff_jk') ? 2 : 1;
              let vClk = globalNodeVoltages.get(`c${c.id}_in${clkPinIdx}`) || 0;
              let currentClk = (vClk >= 2.5) ? 1 : 0;
              if (c.lastClk === undefined) c.lastClk = 0;
              if (c.outputState === undefined) c.outputState = 0;

              if (!c.inputStates) c.inputStates = new Array(c.inputs).fill(0);
              c.inputStates[0] = globalNodeVoltages.get(`c${c.id}_in0`) || 0;
              c.inputStates[1] = globalNodeVoltages.get(`c${c.id}_in1`) || 0;
              if (c.inputs > 2) c.inputStates[2] = globalNodeVoltages.get(`c${c.id}_in2`) || 0;
              if (c.inputs > 3) c.inputStates[3] = globalNodeVoltages.get(`c${c.id}_in3`) || 0;
              if (c.inputs > 4) c.inputStates[4] = globalNodeVoltages.get(`c${c.id}_in4`) || 0;

              let setIdx = (c.type === 'ff_d') ? 2 : (c.type === 'ff_jk' ? 3 : -1);
              let rstIdx = (c.type === 'ff_d') ? 3 : (c.type === 'ff_jk' ? 4 : -1);
              let asyncSet = 1; let asyncRst = 1; 
              let vSet = globalNodeVoltages.get(`c${c.id}_in${setIdx}`);
              if (setIdx !== -1 && vSet !== undefined) asyncSet = vSet >= 2.5 ? 1 : 0;
              let vRst = globalNodeVoltages.get(`c${c.id}_in${rstIdx}`);
              if (rstIdx !== -1 && vRst !== undefined) asyncRst = vRst >= 2.5 ? 1 : 0;

              let isAsyncOverride = false; let nextState = c.outputState;
              if (asyncSet === 0 && asyncRst === 1) { nextState = 1; isAsyncOverride = true; }
              else if (asyncRst === 0 && asyncSet === 1) { nextState = 0; isAsyncOverride = true; }
              else if (asyncSet === 0 && asyncRst === 0) { nextState = 1; isAsyncOverride = true; } 

              let hasClockTrig = (currentClk === 1 && c.lastClk === 0); 
              if (c.type === 'ff_jk' || c.type === 'ff_t') hasClockTrig = (currentClk === 0 && c.lastClk === 1); 

              if (!isAsyncOverride && hasClockTrig) {
                  let v0 = c.inputStates[0]; let v1 = c.inputStates[1];
                  let in0 = v0 >= 2.5 ? 1 : 0; let in1 = v1 >= 2.5 ? 1 : 0;
                  if (c.type === 'ff_sr') { if (in0 === 1 && in1 === 0) nextState = 1; else if (in0 === 0 && in1 === 1) nextState = 0; } 
                  else if (c.type === 'ff_d') { nextState = in0; } 
                  else if (c.type === 'ff_jk') {
                      if (in0 === 1 && in1 === 0) nextState = 1;
                      else if (in0 === 0 && in1 === 1) nextState = 0;
                      else if (in0 === 1 && in1 === 1) nextState = (c.outputState === 1) ? 0 : 1; 
                  } else if (c.type === 'ff_t') {
                      if (in0 === 1) nextState = (c.outputState === 1) ? 0 : 1; 
                  }
              }
              c.lastClk = currentClk;
              if (c.outputState !== nextState) { c.outputState = nextState; changed = true; }
          } else {
              let gateChanged = false;
              for (let i = 0; i < c.inputs; i++) {
                let v = globalNodeVoltages.get(`c${c.id}_in${i}`) || 0;
                let prevLogic = (c.inputStates[i] >= 2.5);
                let newLogic = (v >= 2.5);
                c.inputStates[i] = v;
                if (prevLogic !== newLogic) gateChanged = true;
              }
              if (gateChanged) changed = true;
          }
        }
      });
    } 

    // --- 5. KALKULASI DFS (Dioptimasi) ---
    const findPath = (originalCompId, startId, isLeftPin, targetType, currentMultiplier = 1.0, visited = new Set(), entryPin = null) => {
        let stateKey = `${startId}-${entryPin}`;
        if (visited.has(stateKey)) return 0; 
        let newVisited = new Set(visited); newVisited.add(stateKey);
        let conns = CircuitStore.connections.filter(conn => conn.target.compId === startId || conn.source.compId === startId);
        
        if (startId === originalCompId) {
            conns = conns.filter(conn => {
                let pinType = '';
                if (conn.source.compId === originalCompId) pinType = conn.source.type || 'output'; 
                else if (conn.target.compId === originalCompId) pinType = conn.target.type || 'input';
                return isLeftPin ? (pinType === 'input') : (pinType === 'output');
            });
        }
        if (conns.length === 0) return 0; 
        
        let maxBranchFactor = 0;
        let currComp = CircuitStore.components.find(comp => comp.id === startId);
        
        for (let conn of conns) {
            let nextId, currEndpoint, nextEndpoint;
            if (conn.target.compId === startId) { nextId = conn.source.compId; currEndpoint = conn.target; nextEndpoint = conn.source; } 
            else { nextId = conn.target.compId; currEndpoint = conn.source; nextEndpoint = conn.target; }

            let nextComp = CircuitStore.components.find(comp => comp.id === nextId);
            if (!nextComp) continue;

            let exitPin = currEndpoint.pinIndex !== undefined ? currEndpoint.pinIndex : currEndpoint.index;
            let nextEntryPin = nextEndpoint.pinIndex !== undefined ? nextEndpoint.pinIndex : nextEndpoint.index;

            if (currComp && ['relay', 'relay_5pin'].includes(currComp.type)) {
                if (exitPin === 0) continue; 
                if (entryPin !== null) {
                    if (entryPin === 0) continue; 
                    let state = currComp.state;
                    if (currComp.type === 'relay_5pin') {
                        let isPair11 = (entryPin === 1 && exitPin === 1); 
                        let isPair12 = (entryPin === 1 && exitPin === 2) || (entryPin === 2 && exitPin === 1); 
                        if (isPair11 && state === '1') continue; 
                        if (isPair12 && state !== '1') continue; 
                        if (!isPair11 && !isPair12) continue;    
                    } else if (currComp.type === 'relay') {
                        let isPair11 = (entryPin === 1 && exitPin === 1); 
                        if (isPair11 && state !== '1') continue; 
                        if (!isPair11) continue;
                    }
                }
            }

            if (['relay', 'relay_5pin'].includes(nextComp.type) && nextEntryPin === 0) continue; 
            if (['switch', 'switch_spst', 'push_button', 'flasher'].includes(nextComp.type) && nextComp.state !== '1') continue;
            if (nextComp.type === 'switch_3way' && nextComp.state === '0') continue;
            if (['bjt_npn', 'bjt_pnp', 'mosfet_n', 'mosfet_p'].includes(nextComp.type) && nextComp.state !== '1') continue;

            if (targetType === 'power' && (nextComp.type.startsWith('battery') || nextComp.type === 'power_terminal')) {
                if (nextEntryPin !== 0) continue; 
                let batVolt = nextComp.customValue || (nextComp.type === 'battery_1cell' ? 1.5 : 12);
                maxBranchFactor = Math.max(maxBranchFactor, currentMultiplier * batVolt); 
                continue; 
            }
            if (targetType === 'ground' && nextComp.type === 'ground') { maxBranchFactor = Math.max(maxBranchFactor, currentMultiplier); continue; }
            if (targetType === 'ground' && nextComp.type.startsWith('battery')) {
                if (nextEntryPin === 1) maxBranchFactor = Math.max(maxBranchFactor, currentMultiplier); continue;
            }

            if (['potentiometer', 'ldr', 'thermistor_ntc', 'thermistor_ptc'].includes(nextComp.type)) {
                let factor = currentMultiplier * (parseInt(nextComp.state || '50') / 100);
                maxBranchFactor = Math.max(maxBranchFactor, findPath(originalCompId, nextId, null, targetType, factor, newVisited, nextEntryPin));
            }
            else if (nextComp.type === 'resistor') {
                let factor = currentMultiplier * (20 / (20 + (nextComp.customValue || 330))); 
                maxBranchFactor = Math.max(maxBranchFactor, findPath(originalCompId, nextId, null, targetType, factor, newVisited, nextEntryPin));
            }
            else if (nextComp.type.startsWith('battery') || nextComp.type === 'power_terminal' || nextComp.type === 'ground') { continue; }
            else { maxBranchFactor = Math.max(maxBranchFactor, findPath(originalCompId, nextId, null, targetType, currentMultiplier, newVisited, nextEntryPin)); }
        }
        return maxBranchFactor;
    };

    // 🟢 FIX 3: findMaxFactor Dihapus Total!

    CircuitStore.components.forEach(c => {
          if (c.type === 'motor_dc') {
            let forwardPower = findPath(c.id, c.id, true, 'power'); 
            let forwardGround = findPath(c.id, c.id, false, 'ground');
            let reversePower = findPath(c.id, c.id, false, 'power'); 
            let reverseGround = findPath(c.id, c.id, true, 'ground');
            
            c.isPowered = false; c.rpmValue = 0;
            if (forwardPower > 0 && forwardGround > 0) { c.isPowered = true; c.rpmValue = Math.round((forwardPower / 12) * 3000); } 
            else if (reversePower > 0 && reverseGround > 0) { c.isPowered = true; c.rpmValue = -Math.round((reversePower / 12) * 3000); }
          } 
          else if (c.type === 'servo' || c.type === 'solenoid' || c.type === 'voltmeter' || c.type === 'oscilloscope') {
            let isPowered = c.simV > 0;
            let baseVoltage = c.simV || 0; // Tegangan murni

            if (c.type === 'voltmeter' || c.type === 'oscilloscope') {
                c.displayVolt = baseVoltage; // 🟢 Jangan dikali apa-apa lagi!
            } else if (c.type === 'servo') {
                let vSig = globalNodeVoltages.get(`c${c.id}_in0`) || 0;
                c.servoAngle = isPowered ? Math.min(180, Math.max(0, (vSig / 5) * 180)) : 0;
                c.isPowered = isPowered;
            } else if (c.type === 'solenoid') {
                c.isPoweredSolenoid = baseVoltage > 2.0; 
            }
          }
          // ---> TAMBAHKAN KODE INI UNTUK FLASHER <---
          else if (c.type === 'flasher') {
          // Mesin melacak kabel dari pin Output flasher (false) menuju ke 'ground'
          // Jika nilainya > 0, berarti saklar sedang menyala dan terhubung ke massa
          c.hasLoad = findPath(c.id, c.id, false, 'ground') > 0;
        }
      });

    this.updateVisuals(globalPathActiveIds, globalNodeVoltages);
  },

  updateVisuals(activeSet, nodeVoltages) {
    CircuitStore.components.forEach(comp => {
      const cd = document.getElementById(`content-${comp.id}`);
      if (cd) ComponentDefs.updateContent(comp.type, comp.id, comp, cd, comp.element);
    });

    document.querySelectorAll('#wire-svg path[data-wire-id]').forEach(path => {
      const sId = parseInt(path.dataset.sId); const sIdx = parseInt(path.dataset.sIdx);
      const tId = parseInt(path.dataset.tId); const tIdx = parseInt(path.dataset.tIdx);
      
      path.classList.remove('wire-active', 'wire-12v', 'wire-5v', 'wire-gnd');
      if (path.classList.contains('wire-ground-base')) { path.classList.add('wire-gnd'); return; }

      const compS = CircuitStore.components.find(c => c.id === sId);
      const compT = CircuitStore.components.find(c => c.id === tId);

      let sType = (path.dataset.sType === 'input') ? 'in' : 'out';
      let tType = (path.dataset.tType === 'output') ? 'out' : 'in';

      let sPinStr = `c${sId}_${sType}${sIdx}`;
      if (['voltmeter', 'servo', 'oscilloscope'].includes(compS?.type)) sPinStr = `c${sId}_in${sIdx}`;
      if (compS?.type && compS.type.startsWith('battery')) sPinStr = `c${sId}_out${sIdx}`;
      
      let tPinStr = `c${tId}_${tType}${tIdx}`;
      if (compT?.type && compT.type.startsWith('battery')) tPinStr = `c${tId}_out${tIdx}`;

      let v = nodeVoltages.get(sPinStr) || nodeVoltages.get(tPinStr) || 0;
      
      let overrideV = 0;
      if (compS && (['switch', 'and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'].includes(compS.type) || compS.type.startsWith('ff_'))) {
          if (compS.type.startsWith('ff_')) {
              if (sPinStr.endsWith('_out0')) overrideV = compS.outputState === 1 ? 5 : 0;
              if (sPinStr.endsWith('_out1')) overrideV = compS.outputState === 0 ? 5 : 0;
          } else {
              overrideV = (compS.state === '1' || compS.outputState === 1) ? 5 : 0;
          }
      }
      if (compT && (['switch', 'and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'].includes(compT.type) || compT.type.startsWith('ff_'))) {
          if (tPinStr.includes('_out')) {
              if (compT.type.startsWith('ff_')) {
                  if (tPinStr.endsWith('_out0')) overrideV = compT.outputState === 1 ? 5 : 0;
                  if (tPinStr.endsWith('_out1')) overrideV = compT.outputState === 0 ? 5 : 0;
              } else {
                  if (compT.outputState === 1) overrideV = 5;
              }
          }
      }
      v = Math.max(v, overrideV);

      if (v >= 10) path.classList.add('wire-12v');
      else if (v >= 1.5) path.classList.add('wire-5v');
    });
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
    const capacitorPresets = document.getElementById('capacitorPresets');
    const batteryPresets = document.getElementById('batteryPresets'); // <--- TAMBAHAN
    
    if (fusePresets) fusePresets.style.display = 'none';
    if (resistorPresets) resistorPresets.style.display = 'none';
    if (capacitorPresets) capacitorPresets.style.display = 'none';
    if (batteryPresets) batteryPresets.style.display = 'none'; // <--- TAMBAHAN

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
      // --- LOGIKA MEMBACA NILAI KOMPONEN (DIPERBAIKI) ---
      // BUGFIX: sebelumnya defaulting nilai null hanya menangani 'fuse' dan
      // ditaruh di cabang yang sama dengan penentuan tampilan baterai (if/else if),
      // sehingga baterai/power_terminal dengan customValue null tidak pernah
      // menampilkan preset & nilainya. Sekarang defaulting dipisah dari tampilan.
      let val = compData.customValue;
      if (val == null) {
        if (compType === 'fuse') val = 10;
        else if (compType === 'resistor') val = 330;
        else if (compType === 'capacitor') val = 10;
        else if (compType === 'battery_1cell') val = 1.5;
        else if (compType.startsWith('battery') || compType === 'power_terminal') val = 12;
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
      } else if (compType === 'resistor') {
        if (unitSelect) unitSelect.innerHTML = '<option value="1">Ω</option><option value="1000">kΩ</option><option value="1000000">MΩ</option>';
        if (val >= 1000000) { if (unitSelect) unitSelect.value = "1000000"; document.getElementById('compValue').value = val/1000000; }
        else if (val >= 1000) { if (unitSelect) unitSelect.value = "1000"; document.getElementById('compValue').value = val/1000; }
        else { if (unitSelect) unitSelect.value = "1"; document.getElementById('compValue').value = val; }
        document.getElementById('valCurrent').textContent = `${val >= 1000 ? (val/1000)+' kΩ' : val+' Ω'}`;
        if (resistorPresets) resistorPresets.style.display = 'block';
      } else if (compType.startsWith('battery')) {
        // --- TAMPILAN PRESET BATERAI ---
        if (unitSelect) unitSelect.innerHTML = '<option value="1">V (Volt)</option>';
        document.getElementById('valCurrent').textContent = `${val} V`;
        if (batteryPresets) batteryPresets.style.display = 'block';
      } else if (compType === 'capacitor') {
        if (unitSelect) unitSelect.innerHTML = '<option value="1">µF</option><option value="1000">mF</option><option value="1000000">F</option>';
        if (val >= 1000000) { if (unitSelect) unitSelect.value = "1000000"; document.getElementById('compValue').value = val/1000000; }
        else if (val >= 1000) { if (unitSelect) unitSelect.value = "1000"; document.getElementById('compValue').value = val/1000; }
        else { if (unitSelect) unitSelect.value = "1"; document.getElementById('compValue').value = val; }
        document.getElementById('valCurrent').textContent = `${val >= 1000 ? (val/1000)+' mF' : val+' µF'}`;
        if (capacitorPresets) capacitorPresets.style.display = 'block';
      }
      
      if (compType === 'fuse' || compType.startsWith('battery')) document.getElementById('compValue').value = val;
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
     let finalVal = raw * unit;
      // Tambahkan 'power_terminal' ke dalam array pengecekan ini:
      if (!['fuse', 'battery', 'battery_1cell', 'battery_multi', 'power_terminal', 'capacitor'].includes(compType)) {
          finalVal = Math.round(finalVal);
      }
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

    // 🟢 FIX: Pastikan visual DOM diperbarui setelah state dikembalikan ke awal
    switches.forEach((s,i) => {
      s.state = origStates[i];
      s.element.dataset.state = origStates[i];
      
      // Tambahkan dua baris ini untuk memicu render ulang visual Switch!
      const cdiv = document.getElementById(`content-${s.id}`);
      if (cdiv) ComponentDefs.updateContent(s.type, s.id, s, cdiv, s.element);
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

// 🟢 FIX: Deklarasi eksplisit di luar fungsi (Module Scope) agar tidak mencemari global 'window'
let sensorSaveTimeout = null; 

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
  
  // Menggunakan variabel lokal yang sudah dikarantina
  clearTimeout(sensorSaveTimeout);
  sensorSaveTimeout = setTimeout(() => {
    HistoryManager.saveStateToUndoStack(`Mengatur nilai ${comp.type}`);
  }, 500);

  if (CircuitStore.isSimulationActive) SimulationEngine.run();
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
    customValue: (type === 'resistor') ? 330 : (type === 'fuse' ? 10 : (type === 'battery' || type === 'battery_multi' || type === 'power_terminal' ? 12 : (type === 'battery_1cell' ? 1.5 : (type === 'capacitor' ? 10 : null)))),
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
  if (type === 'fuse' && !compData.customValue) compData.customValue = 10;
  if ((type === 'battery' || type === 'battery_multi') && !compData.customValue) compData.customValue = 12;
  if (type === 'battery_1cell' && !compData.customValue) compData.customValue = 1.5;
  if (type === 'capacitor' && !compData.customValue) compData.customValue = 10;
  if (type === 'power_terminal' && !compData.customValue) compData.customValue = 12;
  // Tempatkan di dalam fungsi buildComponentElement (main.js)
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
    if ((type === 'switch_spst' || type === 'switch' || type === 'switch_3way') && !e.target.classList.contains('delete-btn') && !e.target.classList.contains('connection-point') && !e.target.closest('button')) {
      e.stopPropagation(); toggleSwitch(id);
    }
  });
  return div;
}

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
    case 'switch_spst':   x = pinType === 'input' ? 0 : 80; y = 20; break;
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
    
    // --- INI ADALAH TAMBAHAN UNTUK LOGIC PROBE ---
    case 'logic_probe':   
      x = 0; y = 20; 
      break;
    case 'flasher':
      x = pinType === 'input' ? 0 : 60; y = 30;
      break;  
    case 'fuse': case 'resistor': case 'ldr': case 'thermistor_ntc': case 'thermistor_ptc': 
      x = pinType === 'input' ? 0 : 80; y = 20; 
      break;
    case 'switch_3way':
      if (pinType === 'input') { x = 0; y = 30; } 
      else { x = 80; y = index === 0 ? 20 : 40; }
      break;  
    case 'potentiometer': if (pinType === 'input') { x = index === 0 ? 0 : 80; y = 20; } else { x = 40; y = 60; } break;
    case 'motor_dc':      x = pinType === 'input' ? 0 : 80; y = 40; break;
    case 'servo':         x = 0; y = index === 0 ? 20 : (index === 1 ? 40 : 60); break;
    case 'solenoid':      x = pinType === 'input' ? 0 : 80; y = 30; break;
    case 'led':           x = pinType === 'input' ? 0 : 60; y = 30; break;
    case 'diode':         x = pinType === 'input' ? 0 : 60; y = 20; break;
    case 'switch': case 'clock_pulse': x = 60; y = 20; break;
    case 'push_button':   x = pinType === 'input' ? 0 : 60; y = 20; break;
    case 'junction':      x = pinType === 'input' ? 0 : 60; y = pinType === 'input' ? 30 : (index === 0 ? 10 : index === 1 ? 30 : 50); break;
    case 'wire_1to1':     x = pinType === 'input' ? 0 : 60; y = 20; break;
    case 'wire_1to2':     x = pinType === 'input' ? 0 : 60; y = pinType === 'input' ? 30 : (index === 0 ? 15 : 45); break;
    case 'opamp':         if (pinType === 'input') { x = 0; y = index === 0 ? 18 : 42; } else { x = 80; y = 30; } break;
    case 'voltmeter':     x = index === 0 ? 0 : 80; y = 40; if (index === 1) pt.dataset.polarity = 'neg'; break;
    case 'ammeter':       x = pinType === 'input' ? 0 : 80; y = 40; break;
    case 'oscilloscope':  x = 0; y = 40; break;
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
  document.querySelectorAll('.connection-point.input').forEach(p => { p.classList.remove('connected'); p.title = 'Klik untuk menghubungkan'; });
  CircuitStore.connections.forEach(conn => {
    const el = document.querySelector(`#comp-${conn.target.compId} .connection-point.input[data-point-index="${conn.target.pinIndex}"]`);
    if (el) { el.classList.add('connected'); el.title = 'Input terhubung (klik untuk ganti)'; }
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

  let next;
  if (cd.type === 'switch_3way') {
    // Putaran: Tengah(0) -> Kiri(1) -> Kanan(2) -> kembali ke Tengah(0)
    next = cd.state === '0' ? '1' : (cd.state === '1' ? '2' : '0');
  } else {
    next = comp.dataset.state === '0' ? '1' : '0';
  }
  
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
let circuitClipboard = null;

window.copySelection = function() {
  if (!CircuitStore.selectedComponents || CircuitStore.selectedComponents.length === 0) return;
  
  // Salin komponen yang dipilih (Simpan ke memori terpisah agar tidak berubah)
  const compsToCopy = CircuitStore.components.filter(c => CircuitStore.selectedComponents.includes(c.id));
  
  // Salin kabel HANYA jika ujung awal dan ujung akhirnya ada di dalam area komponen yang disalin
  const connsToCopy = CircuitStore.connections.filter(conn => 
    CircuitStore.selectedComponents.includes(conn.source.compId) && 
    CircuitStore.selectedComponents.includes(conn.target.compId)
  );
  
  circuitClipboard = {
    components: JSON.parse(JSON.stringify(compsToCopy)),
    connections: JSON.parse(JSON.stringify(connsToCopy))
  };
  
  UIManager.showToast(`📋 ${compsToCopy.length} Komponen Disalin`);
};

window.pasteClipboard = function() {
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
      CircuitStore.addConnection({
        source: { compId: newSrcId, pinIndex: oldConn.source.pinIndex },
        target: { compId: newTgtId, pinIndex: oldConn.target.pinIndex },
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

  // Blokir menu pop-up bawaan browser saat menggeser kanvas menggunakan klik kanan
  canvasWrapper.addEventListener('contextmenu', (e) => {
    if (e.target.id === 'canvas' || e.target.id === 'wire-overlay' || e.target.id === 'wire-svg') {
      e.preventDefault();
    }
  });
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
  
  // 2. Menghidupkan navigasi pintar (Zoom & Geser Kanvas)
  if (typeof initSmartCanvasNavigation === 'function') {
    initSmartCanvasNavigation();
  }
});
// ─── FITUR HAPUS SEMUA KABEL (SCISSORS) ────────────────────────────────────────
function clearAllWires() {
  // Cek apakah ada kabel
  if (!CircuitStore.connections || CircuitStore.connections.length === 0) {
    UIManager.showToast('Tidak ada kabel untuk dihapus');
    return;
  }

  // Minta konfirmasi pengguna agar tidak tertekan tanpa sengaja
  if (confirm('Apakah Anda yakin ingin memotong SEMUA kabel? (Komponen akan tetap aman di posisinya)')) {
    
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
  }
}
// ─── LIVE TICKER (OSILOSKOP & CLOCK GENERATOR) ─────────────────────────────
let tickCounter = 0;
setInterval(() => {
  if (typeof CircuitStore !== 'undefined' && CircuitStore.isSimulationActive) {
    tickCounter++;
    let clockToggled = false;
    
    // 1. Clock Generator membalik logika (1 ke 0 / 0 ke 1) setiap 250ms (2 Hz)
    if (tickCounter % 5 === 0) {
        CircuitStore.components.forEach(c => {
          if (c.type === 'clock_pulse') {
            c.state = c.state === '1' ? '0' : '1';
            clockToggled = true;
            // Update visual kedipan lampu indikator merah/hijau pada komponen
            const cd = document.getElementById(`content-${c.id}`);
            if (cd) ComponentDefs.updateDOMState(c.type, c, cd, c.id);
          }

    // TAMBAHKAN LOGIKA FLASHER DI SINI:
          if (c.type === 'flasher') {
            // Flasher nyata butuh 2 syarat mutlak: 
            // 1. Ada setrum masuk dari aki (simV > 0)
            // 2. Jalurnya tembus ke massa melalui saklar & lampu (hasLoad == true)
            if (c.simV > 0 && c.hasLoad) {
              c.state = c.state === '1' ? '0' : '1';
              clockToggled = true;
            } else {
              // Jika saklar di-OFF-kan, flasher otomatis mati
              if (c.state !== '0') { c.state = '0'; clockToggled = true; }
            }
            const cd = document.getElementById(`content-${c.id}`);
            if (cd) ComponentDefs.updateDOMState(c.type, c, cd, c.id);
          }
        });  
        // Paksa mesin menghitung ulang listrik karena ada detak baru!
        if (clockToggled) SimulationEngine.run();
    }
    // 2. Refresh Osiloskop secara halus setiap 50ms
    const oscils = CircuitStore.components.filter(c => c.type === 'oscilloscope');
    if (oscils.length > 0) {
        oscils.forEach(c => {
            const cd = document.getElementById(`content-${c.id}`);
            if (cd) ComponentDefs.updateDOMState(c.type, c, cd, c.id);
        });
    }
  }
}, 50);
