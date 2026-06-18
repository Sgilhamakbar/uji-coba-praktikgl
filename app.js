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

// ============================================================
// FILE: src/HistoryManager.js
// ============================================================
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
      customValue: c.customValue
    }));

    // OPTIMASI 2: Kloning Manual untuk struktur Koneksi bersarang (Nested)
    // Titik jalan kabel (waypoints) direplikasi array-nya satu per satu
    const clonedConnections = CircuitStore.connections.map(conn => ({
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
    UIManager.showToast('Rangkaian berhasil di-export');
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
    UIManager.showToast('Rangkaian berhasil dimuat!');
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
    if (wireSvg) wireSvg.querySelectorAll('path[data-wire]').forEach(p => p.remove());

    CircuitStore.components = []; CircuitStore.connections = []; CircuitStore.clearSelection(); CircuitStore.connectionStart = null;
    CircuitStore.componentIdCounter = state.componentIdCounter;

    state.components.forEach(cd => {
      const compData = {
        id: cd.id, type: cd.type, inputs: cd.inputs, outputs: cd.outputs,
        x: cd.x, y: cd.y, state: cd.state || '0',
        customValue: cd.customValue, simV: 0, simI: 0
      };
      const div = buildComponentElement(compData); // Fungsi ini ada di main.js
      canvas.appendChild(div);
      CircuitStore.components.push({ ...compData, element: div });
    });

    state.connections.forEach(conn => {
      CircuitStore.connections.push({
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
// ============================================================
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
// ============================================================
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
// ============================================================
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
// ============================================================
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
