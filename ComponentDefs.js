// File: src/components/ComponentDefs.js

const ComponentDefs = {
  getDimensions(type) {
    const map = {
      battery: [80, 60], switch_spst: [80, 40], led: [60, 60], diode: [60, 40],
      fuse: [80, 40], ground: [40, 40], relay: [80, 80],
      junction: [60, 60], wire_1to1: [60, 40], wire_1to2: [60, 60], switch: [60, 40],
      and: [80, 60], or: [80, 60], not: [80, 60], nand: [80, 60], nor: [80, 60], xor: [80, 60], xnor: [80, 60],
      bjt_npn: [80, 80], bjt_pnp: [80, 80],     
      transformer: [100, 100],
      mosfet_n: [100, 100], mosfet_p: [100, 100], 
      voltmeter: [80, 80], ammeter: [80, 80],   
      opamp: [80, 60], resistor: [80, 50],
      // UBAH BARIS DI BAWAH INI (Tingginya menjadi 60 semua agar muat panah vertikal):
      ldr: [80, 60], thermistor_ntc: [80, 60], thermistor_ptc: [80, 60], potentiometer: [80, 60],
      motor_dc: [80, 80], servo: [80, 80], solenoid: [80, 60]
    };
    return map[type] || [80, 60];
  },

  updateContent(type, id, compData, contentDiv, div) {
    if (!contentDiv.dataset.initDone) {
      this.initSVGTemplate(type, id, compData, contentDiv);
      contentDiv.dataset.initDone = "true";
      if(div) div.style.cursor = ['switch', 'switch_spst', 'potentiometer', 'ldr', 'thermistor_ntc', 'thermistor_ptc'].includes(type) ? 'pointer' : 'default';
    }
    this.updateDOMState(type, compData, contentDiv, id);
  },

  initSVGTemplate(type, id, compData, contentDiv) {
    const pFill = '#e8e6d3', pStroke = '#1e293b', sw = '2';
    let svg = '';

    switch (type) {
      case 'switch':
        svg = `<svg width="60" height="40" viewBox="0 0 60 40"><polygon class="anim-body" points="5,5 35,5 45,20 35,35 5,35" fill="#2563eb" stroke="black" stroke-width="1"/><text class="anim-text" x="20" y="26" fill="white" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle">0</text><line class="pin-out-0" x1="45" y1="20" x2="60" y2="20" stroke="#006600" stroke-width="2"/></svg>`; break;
      case 'battery':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60"><rect x="25" y="15" width="30" height="30" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/><line class="pin-out-0" x1="80" y1="20" x2="55" y2="20" stroke="#006600" stroke-width="2"/><line class="pin-out-1" x1="80" y1="40" x2="55" y2="40" stroke="#006600" stroke-width="2"/><line x1="40" y1="20" x2="40" y2="40" stroke="${pStroke}" stroke-width="2"/><line x1="35" y1="25" x2="35" y2="35" stroke="${pStroke}" stroke-width="4"/><text x="40" y="12" class="comp-label" text-anchor="middle">12V</text><text x="65" y="18" class="comp-label" fill="red">+</text><text x="65" y="38" class="comp-label" fill="black">-</text></svg>`; break;
      case 'switch_spst':
        svg = `<svg width="80" height="40" viewBox="0 0 80 40"><line class="pin-in-0" x1="0" y1="20" x2="25" y2="20" stroke="#006600" stroke-width="2"/><line class="pin-out-0" x1="55" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="2"/><circle cx="25" cy="20" r="3" fill="${pStroke}"/><circle cx="55" cy="20" r="3" fill="${pStroke}"/><line class="anim-line" x1="25" y1="20" x2="50" y2="10" stroke="black" stroke-width="3"/><rect class="anim-body" x="30" y="30" width="20" height="8" rx="2" fill="#e2e8f0" stroke="black" stroke-width="1"/></svg>`; break;
      case 'fuse':
        svg = `<svg width="80" height="40" viewBox="0 0 80 40"><line class="pin-in-0" x1="0" y1="20" x2="25" y2="20" stroke="#006600" stroke-width="2"/><line class="pin-out-0" x1="55" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="2"/><rect class="anim-body" x="25" y="10" width="30" height="20" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/><path class="anim-line" d="M 25 20 Q 40 5 55 20" fill="none" stroke="${pStroke}" stroke-width="2"/><text class="anim-text comp-label fuse-val" x="40" y="8" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;" onclick="openValueModal(${id}, 'fuse')"></text><text class="anim-blown comp-label" x="40" y="24" fill="red" font-weight="bold" text-anchor="middle" style="display:none;">BLOWN</text></svg>`; break;
      case 'led':
        svg = `<svg width="60" height="60" viewBox="0 0 60 60" class="anim-svg"><line class="pin-in-0" x1="0" y1="30" x2="15" y2="30" stroke="#006600" stroke-width="2"/><line class="pin-out-0" x1="45" y1="30" x2="60" y2="30" stroke="#006600" stroke-width="2"/><circle class="anim-body" cx="30" cy="30" r="15" fill="#4a0000" stroke="${pStroke}" stroke-width="${sw}"/><path d="M25 25 L35 30 L25 35 Z" fill="${pStroke}"/><line x1="35" y1="23" x2="35" y2="37" stroke="${pStroke}" stroke-width="2"/><text x="30" y="55" class="comp-label" text-anchor="middle">L${id}</text></svg>`; break;
      case 'diode':
        svg = `<svg width="60" height="40" viewBox="0 0 60 40"><line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="2"/><line class="pin-out-0" x1="35" y1="20" x2="60" y2="20" stroke="#006600" stroke-width="2"/><polygon class="anim-body" points="20,10 20,30 35,20" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/><line class="anim-line" x1="35" y1="10" x2="35" y2="30" stroke="${pStroke}" stroke-width="${sw}"/><text x="30" y="38" class="comp-label" text-anchor="middle">D${id}</text></svg>`; break;
      case 'resistor':
        svg = `<svg width="80" height="50" viewBox="0 0 80 50"><line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="2"/><line class="pin-out-0" x1="60" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="2"/><path d="M 20 20 l 5 -10 l 10 20 l 10 -20 l 10 20 l 5 -10" fill="none" stroke="${pStroke}" stroke-width="${sw}" stroke-linejoin="round"/><text class="anim-text comp-label resistor-val" x="40" y="42" text-anchor="middle" fill="#4f46e5" style="cursor:pointer;pointer-events:auto;" onclick="openValueModal(${id}, 'resistor')"></text></svg>`; break;
      case 'ground':
        svg = `<svg width="40" height="40" viewBox="0 0 40 40"><line class="pin-in-0" x1="20" y1="0" x2="20" y2="20" stroke="#000000" stroke-width="2"/><line x1="8" y1="20" x2="32" y2="20" stroke="#000000" stroke-width="2"/><line x1="14" y1="26" x2="26" y2="26" stroke="#000000" stroke-width="2"/><line x1="18" y1="32" x2="22" y2="32" stroke="#000000" stroke-width="2"/></svg>`; break;
      case 'voltmeter':
        svg = `<svg width="80" height="80" viewBox="0 0 80 80"><line class="pin-in-0" x1="0" y1="40" x2="16" y2="40" stroke="#006600" stroke-width="2"/><line class="pin-in-1" x1="64" y1="40" x2="80" y2="40" stroke="#006600" stroke-width="2"/><circle cx="40" cy="40" r="24" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/><text class="anim-text meter-val" x="40" y="45" text-anchor="middle" font-size="18">0.0V</text><text x="18" y="35" class="comp-label" fill="red" font-size="14" font-weight="bold">+</text><text x="56" y="35" class="comp-label" fill="black" font-size="14" font-weight="bold">-</text></svg>`; break;
      case 'ammeter':
        svg = `<svg width="80" height="80" viewBox="0 0 80 80"><line class="pin-in-0" x1="0" y1="40" x2="16" y2="40" stroke="#006600" stroke-width="2"/><line class="pin-out-0" x1="64" y1="40" x2="80" y2="40" stroke="#006600" stroke-width="2"/><circle cx="40" cy="40" r="24" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/><text class="anim-text meter-val" x="40" y="45" text-anchor="middle" font-size="18">0.00A</text></svg>`; break;
      case 'relay':
        svg = `<svg width="80" height="80" viewBox="0 0 80 80"><line class="pin-in-0" x1="0" y1="20" x2="25" y2="20" stroke="#006600" stroke-width="2"/><line class="pin-out-0" x1="55" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="2"/><rect class="anim-body" x="25" y="10" width="30" height="20" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/><line class="pin-in-1" x1="0" y1="60" x2="25" y2="60" stroke="#006600" stroke-width="2"/><line class="pin-out-1" x1="55" y1="60" x2="80" y2="60" stroke="#006600" stroke-width="2"/><line class="anim-line" x1="25" y1="60" x2="50" y2="50" stroke="black" stroke-width="3"/></svg>`; break;
      case 'transformer':
        svg = `<svg width="100" height="100" viewBox="0 0 100 100"><line x1="46" y1="15" x2="46" y2="85" stroke="${pStroke}" stroke-width="3"/><line x1="54" y1="15" x2="54" y2="85" stroke="${pStroke}" stroke-width="3"/><line x1="0" y1="30" x2="30" y2="30" stroke="#006600" stroke-width="2" class="pin-in-0"/><line x1="0" y1="70" x2="30" y2="70" stroke="#006600" stroke-width="2" class="pin-in-1"/><path class="anim-coil-p" d="M 30 30 C 45 30 45 40 30 40 C 45 40 45 50 30 50 C 45 50 45 60 30 60 C 45 60 45 70 30 70" fill="none" stroke="${pStroke}" stroke-width="2"/><line x1="70" y1="20" x2="100" y2="20" stroke="#006600" stroke-width="2" class="pin-out-0"/><line x1="70" y1="50" x2="100" y2="50" stroke="#006600" stroke-width="2" class="pin-out-1"/><line x1="70" y1="80" x2="100" y2="80" stroke="#006600" stroke-width="2" class="pin-out-2"/><path class="anim-coil-s" d="M 70 20 C 55 20 55 35 70 35 C 55 35 55 50 70 50 C 55 50 55 65 70 65 C 55 65 55 80 70 80" fill="none" stroke="${pStroke}" stroke-width="2"/></svg>`; break;
      
      // === SENSOR INTERAKTIF ===
      case 'ldr':
        // Perhatikan viewBox dan height sudah diganti jadi 60
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="25" x2="20" y2="25" stroke="#006600" stroke-width="2"/>
          <line class="pin-out-0" x1="60" y1="25" x2="80" y2="25" stroke="#006600" stroke-width="2"/>
          <circle cx="40" cy="25" r="16" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <path d="M 28 25 l 4 -8 l 8 16 l 8 -16 l 4 8" fill="none" stroke="${pStroke}" stroke-width="${sw}" stroke-linejoin="round"/>
          <path d="M 25 5 L 35 15 M 32 15 L 35 15 L 35 12 M 15 10 L 25 20 M 22 20 L 25 20 L 25 17" fill="none" stroke="#f59e0b" stroke-width="2"/>
          
          <text class="anim-text comp-label resistor-val" x="35" y="50" text-anchor="middle" font-size="10" fill="#4f46e5" style="cursor:pointer; pointer-events:auto;" onclick="openValueModal(${id}, 'ldr')"></text>
          <polygon class="control-btn" points="60,42 70,42 65,34" fill="#22c55e" style="cursor:pointer; pointer-events:auto;" onclick="event.stopPropagation(); adjustSensorValue(${id}, 5)"/>
          <polygon class="control-btn" points="60,46 70,46 65,54" fill="#ef4444" style="cursor:pointer; pointer-events:auto;" onclick="event.stopPropagation(); adjustSensorValue(${id}, -5)"/>
        </svg>`; break;

      case 'thermistor_ntc':
      case 'thermistor_ptc': {
        const label = type === 'thermistor_ntc' ? '-t°' : '+t°';
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="25" x2="20" y2="25" stroke="#006600" stroke-width="2"/>
          <line class="pin-out-0" x1="60" y1="25" x2="80" y2="25" stroke="#006600" stroke-width="2"/>
          <rect x="20" y="17" width="40" height="16" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <path d="M 15 40 L 25 40 L 65 7" fill="none" stroke="${pStroke}" stroke-width="2"/>
          <text x="50" y="46" class="comp-label" font-weight="bold">${label}</text>
          
          <text class="anim-text comp-label resistor-val" x="35" y="52" text-anchor="middle" font-size="10" fill="#4f46e5" style="cursor:pointer; pointer-events:auto;" onclick="openValueModal(${id}, '${type}')"></text>
          <polygon class="control-btn" points="55,45 65,45 60,37" fill="#22c55e" style="cursor:pointer; pointer-events:auto;" onclick="event.stopPropagation(); adjustSensorValue(${id}, 5)"/>
          <polygon class="control-btn" points="55,49 65,49 60,57" fill="#ef4444" style="cursor:pointer; pointer-events:auto;" onclick="event.stopPropagation(); adjustSensorValue(${id}, -5)"/>
        </svg>`; break;
      }

      case 'potentiometer':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="20" x2="20" y2="20" stroke="#006600" stroke-width="2"/>
          <line class="pin-in-1" x1="60" y1="20" x2="80" y2="20" stroke="#006600" stroke-width="2"/>
          <path d="M 20 20 l 5 -10 l 10 20 l 10 -20 l 10 20 l 5 -10" fill="none" stroke="${pStroke}" stroke-width="${sw}" stroke-linejoin="round"/>
          <line class="pin-out-0" x1="40" y1="22" x2="40" y2="60" stroke="#006600" stroke-width="2"/>
          <polygon points="40,22 36,30 44,30" fill="${pStroke}"/>
          
          <polygon class="control-btn" points="48,42 56,42 52,34" fill="#22c55e" style="cursor:pointer; pointer-events:auto;" onclick="event.stopPropagation(); adjustSensorValue(${id}, 5)"/>
          <polygon class="control-btn" points="48,46 56,46 52,54" fill="#ef4444" style="cursor:pointer; pointer-events:auto;" onclick="event.stopPropagation(); adjustSensorValue(${id}, -5)"/>
          <text class="anim-text comp-label resistor-val" x="66" y="48" text-anchor="middle" font-size="9" font-weight="bold" fill="#4f46e5" style="cursor:pointer; pointer-events:auto;" onclick="openValueModal(${id}, 'potentiometer')"></text>
        </svg>`; break;

      case 'motor_dc':
        svg = `<svg width="80" height="80" viewBox="0 0 80 80">
          <line class="pin-in-0" x1="0" y1="40" x2="20" y2="40" stroke="#006600" stroke-width="2"/>
          <line class="pin-out-0" x1="60" y1="40" x2="80" y2="40" stroke="#006600" stroke-width="2"/>
          <circle class="anim-body" cx="40" cy="40" r="22" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <g class="anim-rotor" style="transform-origin: 40px 40px;"><circle cx="40" cy="40" r="16" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4 4"/></g>
          <text x="40" y="46" text-anchor="middle" font-size="18" font-weight="bold" fill="${pStroke}">M</text>
          <text class="anim-text comp-label" x="40" y="75" text-anchor="middle" font-weight="bold" fill="#0284c7">0 RPM</text>
        </svg>`; break;
      case 'servo':
        svg = `<svg width="80" height="80" viewBox="0 0 80 80">
          <line class="pin-in-0" x1="0" y1="20" x2="15" y2="20" stroke="#006600" stroke-width="2"/>
          <line class="pin-in-1" x1="0" y1="40" x2="15" y2="40" stroke="#006600" stroke-width="2"/>
          <line class="pin-in-2" x1="0" y1="60" x2="15" y2="60" stroke="#006600" stroke-width="2"/>
          <text x="18" y="24" class="comp-label" font-size="9">SIG</text>
          <text x="18" y="44" class="comp-label" font-size="9" fill="red">VCC</text>
          <text x="18" y="64" class="comp-label" font-size="9">GND</text>
          <rect class="anim-body" x="15" y="10" width="45" height="60" rx="4" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <circle cx="60" cy="40" r="12" fill="#fff" stroke="${pStroke}" stroke-width="2"/>
          <g class="anim-horn" style="transform-origin: 60px 40px;"><line x1="60" y1="40" x2="60" y2="15" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/></g>
          <text class="anim-text comp-label" x="38" y="78" text-anchor="middle" font-weight="bold" fill="#d97706">0°</text>
        </svg>`; break;
      case 'solenoid':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="30" x2="15" y2="30" stroke="#006600" stroke-width="2"/>
          <line class="pin-out-0" x1="65" y1="30" x2="80" y2="30" stroke="#006600" stroke-width="2"/>
          <rect class="anim-body" x="15" y="15" width="40" height="30" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <path d="M 20 15 v 30 M 25 15 v 30 M 30 15 v 30 M 35 15 v 30 M 40 15 v 30" stroke="${pStroke}" stroke-width="1"/>
          <rect class="anim-plunger" x="55" y="25" width="20" height="10" fill="#64748b" stroke="${pStroke}" stroke-width="1" style="transition: transform 0.2s;"/>
          <text x="35" y="55" class="comp-label" text-anchor="middle">VALVE</text>
        </svg>`; break;

      case 'mosfet_n': case 'mosfet_p':
        svg = `<svg width="100" height="100" viewBox="0 0 100 100">
          <circle class="anim-body" cx="50" cy="50" r="32" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <line class="pin-in-0" x1="0" y1="50" x2="30" y2="50" stroke="#006600" stroke-width="2"/>
          <line x1="30" y1="30" x2="30" y2="70" stroke="${pStroke}" stroke-width="3"/>
          <line x1="38" y1="28" x2="38" y2="42" stroke="${pStroke}" stroke-width="3"/>
          <line x1="38" y1="46" x2="38" y2="54" stroke="${pStroke}" stroke-width="3"/>
          <line x1="38" y1="58" x2="38" y2="72" stroke="${pStroke}" stroke-width="3"/>
          <line class="pin-in-1" x1="50" y1="0" x2="50" y2="35" stroke="#006600" stroke-width="2"/>
          <line class="pin-out-0" x1="50" y1="35" x2="38" y2="35" stroke="#006600" stroke-width="2"/>
          <line class="pin-out-1" x1="50" y1="100" x2="50" y2="65" stroke="#006600" stroke-width="2"/>
          <line class="pin-out-2" x1="50" y1="65" x2="38" y2="65" stroke="#006600" stroke-width="2"/>
          <line x1="38" y1="50" x2="50" y2="50" stroke="${pStroke}" stroke-width="2"/>
          <line x1="50" y1="50" x2="50" y2="65" stroke="${pStroke}" stroke-width="2"/>
          ${type === 'mosfet_n' ? `<polygon points="46,46 38,50 46,54" fill="${pStroke}"/>` : `<polygon points="42,46 50,50 42,54" fill="${pStroke}"/>`}
          <text x="14" y="45" class="comp-label" font-weight="bold" font-size="14">G</text>
          <text x="56" y="20" class="comp-label" font-weight="bold" font-size="14">D</text>
          <text x="56" y="90" class="comp-label" font-weight="bold" font-size="14">S</text>
        </svg>`; break;
      case 'bjt_npn': case 'bjt_pnp':
        svg = `<svg width="80" height="80" viewBox="0 0 80 80">
          <circle class="anim-body" cx="40" cy="40" r="24" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <line class="pin-in-0" x1="0" y1="40" x2="25" y2="40" stroke="#006600" stroke-width="2"/>
          <line x1="25" y1="25" x2="25" y2="55" stroke="${pStroke}" stroke-width="3"/>
          <line class="pin-out-0" x1="25" y1="32" x2="40" y2="20" stroke="#006600" stroke-width="2"/>
          <line x1="40" y1="20" x2="40" y2="0" stroke="#006600" stroke-width="2"/>
          <line class="pin-in-1" x1="25" y1="48" x2="40" y2="60" stroke="#006600" stroke-width="2"/>
          <line x1="40" y1="60" x2="40" y2="80" stroke="#006600" stroke-width="2"/>
          ${type === 'bjt_npn' ? `<polygon points="34,50 40,60 28,58" fill="${pStroke}"/>` : `<polygon points="35,52 25,48 30,59" fill="${pStroke}"/>`}
          <text x="10" y="35" class="comp-label" font-weight="bold" font-size="12">B</text>
          <text x="46" y="14" class="comp-label" font-weight="bold" font-size="12">C</text>
          <text x="46" y="76" class="comp-label" font-weight="bold" font-size="12">E</text>
        </svg>`; break;  
      case 'opamp':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <polygon points="20,5 70,30 20,55" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          <line class="pin-in-0" x1="0" y1="18" x2="20" y2="18" stroke="#006600" stroke-width="2"/>
          <line class="pin-in-1" x1="0" y1="42" x2="20" y2="42" stroke="#006600" stroke-width="2"/>
          <line class="pin-out-0" x1="70" y1="30" x2="80" y2="30" stroke="#006600" stroke-width="2"/>
          <text x="24" y="22" fill="${pStroke}" font-family="monospace" font-size="12" font-weight="bold">+</text>
          <text x="24" y="44" fill="${pStroke}" font-family="monospace" font-size="12" font-weight="bold">-</text>
          <text x="42" y="34" class="comp-label" font-size="9" font-weight="bold">741</text>
        </svg>`; break;
      case 'and': case 'nand':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="20" x2="15" y2="20" stroke="#006600" stroke-width="2"/>
          <line class="pin-in-1" x1="0" y1="40" x2="15" y2="40" stroke="#006600" stroke-width="2"/>
          <line class="pin-out-0" x1="60" y1="30" x2="80" y2="30" stroke="#006600" stroke-width="2"/>
          <path d="M 15 10 L 40 10 A 20 20 0 0 1 40 50 L 15 50 Z" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          ${type === 'nand' ? `<circle cx="65" cy="30" r="4" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>` : ''}
          <text x="35" y="60" class="comp-label" text-anchor="middle">${type.toUpperCase()}</text>
        </svg>`; break;
      case 'or': case 'nor':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="20" x2="18" y2="20" stroke="#006600" stroke-width="2"/>
          <line class="pin-in-1" x1="0" y1="40" x2="18" y2="40" stroke="#006600" stroke-width="2"/>
          <line class="pin-out-0" x1="60" y1="30" x2="80" y2="30" stroke="#006600" stroke-width="2"/>
          <path d="M 15 10 Q 30 10 65 30 Q 30 50 15 50 Q 25 30 15 10 Z" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          ${type === 'nor' ? `<circle cx="68" cy="30" r="4" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>` : ''}
          <text x="35" y="60" class="comp-label" text-anchor="middle">${type.toUpperCase()}</text>
        </svg>`; break;
      case 'xor': case 'xnor':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="20" x2="12" y2="20" stroke="#006600" stroke-width="2"/>
          <line class="pin-in-1" x1="0" y1="40" x2="12" y2="40" stroke="#006600" stroke-width="2"/>
          <line class="pin-out-0" x1="60" y1="30" x2="80" y2="30" stroke="#006600" stroke-width="2"/>
          <path d="M 8 10 Q 18 30 8 50" fill="none" stroke="${pStroke}" stroke-width="${sw}"/>
          <path d="M 14 10 Q 29 10 65 30 Q 29 50 14 50 Q 24 30 14 10 Z" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>
          ${type === 'xnor' ? `<circle cx="68" cy="30" r="4" fill="${pFill}" stroke="${pStroke}" stroke-width="${sw}"/>` : ''}
          <text x="35" y="60" class="comp-label" text-anchor="middle">${type.toUpperCase()}</text>
        </svg>`; break;
      case 'not':
        svg = `<svg width="80" height="60" viewBox="0 0 80 60">
          <line class="pin-in-0" x1="0" y1="30" x2="20" y2="30" stroke="#006600" stroke-width="2"/>
          <line class="pin-out-0" x1="58" y1="30" x2="80" y2="30" stroke="#006600" stroke-width="2"/>
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
      case 'switch_spst': {
        const isClosed = compData.state === '1'; setPin('pin-in-0', vState); setPin('pin-out-0', isClosed && vState);
        const line = contentDiv.querySelector('.anim-line'); const body = contentDiv.querySelector('.anim-body');
        if (line) { line.setAttribute('x2', isClosed ? '55' : '50'); line.setAttribute('y2', isClosed ? '20' : '10'); }
        if (body) body.setAttribute('fill', isClosed ? '#22c55e' : '#e2e8f0');
        break;
      }
      case 'battery': setPin('pin-out-0', vState || CircuitStore.isSimulationActive); setPin('pin-out-1', false); break;
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
      case 'voltmeter':
      case 'ammeter': {
        setPin('pin-in-0', type === 'ammeter' ? vState : false);
        if(type==='ammeter') setPin('pin-out-0', vState); else setPin('pin-in-1', false);
        const text = contentDiv.querySelector('.anim-text');
        if (text) text.textContent = type==='voltmeter' ? (compData.simV || 0).toFixed(1) + 'V' : Math.abs(compData.simI || 0).toFixed(2) + 'A';
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
        setPin('pin-in-0', vState); setPin('pin-out-0', vState);
        const rpm = Math.abs(Math.round((compData.simV || 0) * 100));
        const text = contentDiv.querySelector('.anim-text');
        if (text) text.textContent = rpm + ' RPM';
        const rotor = contentDiv.querySelector('.anim-rotor');
        if (rotor) rotor.style.transform = rpm > 0 ? `rotate(${Date.now() % 360}deg)` : 'none';
        break;
      }
      case 'servo': {
        let vSig = compData.simV_signal || 0;
        let angle = Math.min(180, Math.max(0, (vSig / 5) * 180)); 
        const isPowered = compData.simV > 0;
        setPin('pin-in-0', vSig > 0); setPin('pin-in-1', isPowered); setPin('pin-in-2', false);
        const horn = contentDiv.querySelector('.anim-horn');
        if (horn && isPowered) horn.style.transform = `rotate(${angle}deg)`;
        const text = contentDiv.querySelector('.anim-text');
        if (text) text.textContent = isPowered ? Math.round(angle) + '°' : 'OFF';
        break;
      }
      case 'solenoid': {
        const isActive = Math.abs(compData.simV) > 1.5;
        setPin('pin-in-0', vState); setPin('pin-out-0', vState);
        const plunger = contentDiv.querySelector('.anim-plunger');
        if (plunger) plunger.style.transform = isActive ? 'translateX(-12px)' : 'translateX(0)';
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
      case 'transformer': {
        setPin('pin-in-0', vState); setPin('pin-in-1', vState); setPin('pin-out-0', vState); setPin('pin-out-1', vState); setPin('pin-out-2', vState);
        const coilP = contentDiv.querySelector('.anim-coil-p');
        if (coilP) coilP.setAttribute('stroke', vState ? '#eab308' : '#1e293b');
        break;
      }
      case 'bjt_npn': case 'bjt_pnp':
      case 'mosfet_n': case 'mosfet_p': {
        const isActive = compData.state === '1';
        setPin('pin-in-0', isHigh(compData.inputStates ? compData.inputStates[0] : 0));
        setPin('pin-in-1', vState); setPin('pin-out-0', isActive && vState);
        if (type.startsWith('mosfet')) { setPin('pin-out-1', isActive && vState); setPin('pin-out-2', isActive && vState); }
        const body = contentDiv.querySelector('.anim-body');
        if (body) body.setAttribute('fill', isActive ? '#dcfce7' : '#e8e6d3');
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