// File: src/components/actuators/Servo360UI.js

import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class Servo360UI extends BaseUIComponent {
    static getDimensions() { return [160, 200]; }

    getSVG() {
        return `<svg width="160" height="200" viewBox="-35 0 160 200" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;">
        <!-- Bodi dan Pin Konektor -->
        <rect x="5" y="5" width="80" height="170" fill="#519aee" stroke="#18181b" stroke-width="2"/>
        <line class="pin-in-1" x1="25" y1="155" x2="25" y2="195" stroke="#713f12" stroke-width="2.5" stroke-linecap="round"/>
        <line class="pin-in-0" x1="45" y1="155" x2="45" y2="195" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>        
        <line class="pin-in-2" x1="65" y1="155" x2="65" y2="195" stroke="#ea580c" stroke-width="2.5" stroke-linecap="round"/>

        <!-- Telinga Mounting Atas & Bawah -->
        <rect x="5" y="5" width="80" height="23" fill="#318bf1" stroke="#0156b8" stroke-width="2"/>
        <rect x="5" y="152" width="80" height="23" fill="#318bf1" stroke="#0156b8" stroke-width="2"/>
        
        <circle cx="45" cy="15" r="7" fill="#a5a5a5" stroke="#18181b" stroke-width="2"/>
        <rect x="42" y="4" width="6" height="10" fill="#a5a5a5"/>
        <line x1="41" y1="4" x2="41" y2="9" stroke="#18181b" stroke-width="2"/>
        <line x1="49" y1="4" x2="49" y2="9" stroke="#18181b" stroke-width="2"/>

        <circle cx="45" cy="165" r="7" fill="#a5a5a5" stroke="#18181b" stroke-width="2"/>
        <rect x="42" y="166" width="6" height="10" fill="#a5a5a5"/>
        <line x1="41" y1="171" x2="41" y2="176" stroke="#18181b" stroke-width="2"/>
        <line x1="49" y1="171" x2="49" y2="176" stroke="#18181b" stroke-width="2"/>

        <!-- Label 360 -->
        <text x="45" y="50" font-size="10" font-family="sans-serif" font-weight="bold" fill="#facc15" text-anchor="middle">360°</text>

        <!-- Gearbox Bulat (Statis) -->
        <circle cx="45" cy="114" r="37" fill="#52525b" stroke="#18181b" stroke-width="2"/>
        <circle cx="45" cy="75" r="18" fill="#52525b" stroke="#18181b" stroke-width="2"/>
        <circle cx="45" cy="114" r="36" fill="#0374dd"/>
        <circle cx="45" cy="75" r="17" fill="#0374dd"/>

        <!-- ============================================== -->
        <!-- GRUP UTAMA ROTASI (TITIK POROS DI cx=0, cy=0) -->
        <!-- ============================================== -->
        <g class="servo-horn" transform="translate(45, 114)">
            
            <!-- MODEL A: RODA BUNDAR (Default) -->
            <g class="horn-wheel" style="display: block;">
                <circle cx="0" cy="0" r="28" fill="#0374dd" stroke="#18181b" stroke-width="2"/>
                <circle cx="0" cy="0" r="15" fill="#ebebeb" stroke="#18181b" stroke-width="2"/>
                <circle cx="0" cy="-20" r="2.5" fill="#18181b"/>
                <circle cx="0" cy="20" r="2.5" fill="#18181b"/>
                <circle cx="-20" cy="0" r="2.5" fill="#18181b"/>
                <circle cx="20" cy="0" r="2.5" fill="#18181b"/>
                <path d="M -10 -10 A 14 14 0 0 1 10 -10" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
                <polygon points="10,-10 6,-5 14,-5" fill="#ef4444" transform="rotate(45 10 -10)"/>
                <path d="M 10 10 A 14 14 0 0 1 -10 10" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
                <polygon points="-10,10 -14,5 -6,5" fill="#ef4444" transform="rotate(45 -10 10)"/>
            </g>

            <!-- MODEL B: LENGAN TUNGGAL -->
            <g class="horn-single" style="display: none;">
                <path d="M 0 -11.5 L 45 -4.8 A 5 5 0 0 1 45 4.8 L 0 11.5 A 11.5 11.5 0 0 1 0 -11.5 Z" fill="#f8fafc" stroke="#334155" stroke-width="1.5" stroke-linejoin="round"/>
                <circle cx="0" cy="0" r="8" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
                <circle cx="14" cy="0" r="1.6" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="20" cy="0" r="1.6" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="26" cy="0" r="1.6" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="32" cy="0" r="1.6" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="38" cy="0" r="1.6" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="44" cy="0" r="1.6" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
            </g>

            <!-- MODEL C: LENGAN GANDA -->
            <g class="horn-double" style="display: none;">
                <path d="M 10 -9 L 67 -5.5 A 5.5 5.5 0 0 1 67 5.5 L 10 9 A 12.5 12.5 0 0 1 -10 9 L -67 5.5 A 5.5 5.5 0 0 1 -67 -5.5 L -10 -9 A 12.5 12.5 0 0 1 10 -9 Z" fill="#f8fafc" stroke="#334155" stroke-width="1.6" stroke-linejoin="round"/>
                <circle cx="0" cy="0" r="9" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
                
                <!-- 8 Lubang Sayap Kanan -->
                <circle cx="16" cy="0" r="1.8" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="23" cy="0" r="1.8" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="30" cy="0" r="1.8" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="37" cy="0" r="1.8" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="44" cy="0" r="1.8" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="51" cy="0" r="1.8" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="58" cy="0" r="1.8" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="65" cy="0" r="1.8" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                
                <!-- 8 Lubang Sayap Kiri -->
                <circle cx="-16" cy="0" r="1.8" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="-23" cy="0" r="1.8" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="-30" cy="0" r="1.8" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="-37" cy="0" r="1.8" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="-44" cy="0" r="1.8" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="-51" cy="0" r="1.8" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="-58" cy="0" r="1.8" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="-65" cy="0" r="1.8" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
            </g>

            <!-- Baut Poros Penutup (Selalu Muncul) -->
            <circle cx="0" cy="0" r="5" fill="#52525b" stroke="#18181b" stroke-width="1"/>
            <circle cx="0" cy="0" r="4.2" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
            <circle cx="0" cy="0" r="1.2" fill="#0f172a"/>
        </g>
        <!-- ============================================== -->

        <!-- Rumah Konektor Pin Bawah -->
        <rect x="17.5" y="154" width="55" height="10" rx="1.5" fill="#0f172a"/>
        <text x="27" y="162" font-size="7" font-family="sans-serif" font-weight="bold" fill="#cbd5e1" text-anchor="middle">GND</text>
        <text x="64" y="162" font-size="7" font-family="sans-serif" font-weight="bold" fill="#cbd5e1" text-anchor="middle">SIG</text>
        <text x="46" y="162" font-size="7" font-family="sans-serif" font-weight="bold" fill="#cbd5e1" text-anchor="middle">VCC</text>

    </svg>`
    }

    updateState(isSimActive) {
        const horn = this.contentDiv.querySelector('.servo-horn');
        const wheelModel = this.contentDiv.querySelector('.horn-wheel');
        const singleModel = this.contentDiv.querySelector('.horn-single');
        const doubleModel = this.contentDiv.querySelector('.horn-double');
        
        if (!horn) return;

        // 1. Ganti Tampilan Baling-Baling
        const hornType = this.compData.hornType || 'wheel'; // Default roda
        if (wheelModel && singleModel && doubleModel) {
            wheelModel.style.display = (hornType === 'wheel') ? 'block' : 'none';
            singleModel.style.display = (hornType === 'single') ? 'block' : 'none';
            doubleModel.style.display = (hornType === 'double') ? 'block' : 'none';
        }

        // 2. Putar Baling-Baling
        const currentAngle = this.compData.currentAngle || 0;
        if (isSimActive) {
            horn.style.transform = `translate(45px, 114px) rotate(${currentAngle}deg)`;
        } else {
            horn.style.transform = `translate(45px, 114px) rotate(0deg)`;
            this.compData.currentAngle = 0; 
        }
    }
}

UIRegistry['servo_360'] = Servo360UI;