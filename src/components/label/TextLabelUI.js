import { UIRegistry } from '../core/UIRegistry.js';
import { BaseUIComponent } from '../core/BaseUIComponent.js';

export class TextLabel extends BaseUIComponent {
    static getDimensions() { return [100, 30]; }
    getSVG() {
        const text = this.compData.customText || 'Teks Baru';
        const size = parseFloat(this.compData.fontSize) || 16;
        const color = this.compData.textColor || '#ffffff';
        const font = this.compData.fontFamily || 'sans-serif';
        const showBox = this.compData.showBox ? 'block' : 'none';
        
        const align = this.compData.textAlign || 'start';
        const fontWeight = this.compData.isBold ? 'bold' : 'normal';
        const fontStyle = this.compData.isItalic ? 'italic' : 'normal';
        let deco = [];
        if (this.compData.isUnderline) deco.push('underline');
        if (this.compData.isStrikeout) deco.push('line-through');
        const textDeco = deco.length > 0 ? deco.join(' ') : 'none';

        let initX = '10';
        if (align === 'middle') initX = '50%';
        if (align === 'end') initX = '100%'; // akan diperbaiki di updateState
        
        const lines = text.split('\n');
        const tspanHTML = lines.map((line, index) => {
            const dy = index === 0 ? 0 : (size * 1.2);
            return `<tspan x="${initX}" dy="${dy}">${line}</tspan>`;
        }).join('');
        
        return `<svg class="label-svg-wrapper" width="100" height="30" style="overflow: visible;">
          <!-- Background Box -->
          <rect class="label-box" x="0" y="0" width="120" height="30" rx="4" fill="#0f172a" stroke="#334155" stroke-width="2" style="display: ${showBox};" />
          
          <!-- Background transparan murni untuk area pegangan mouse (Drag) -->
          <rect class="label-drag-area" x="-10" y="0" width="120" height="30" fill="transparent" />
          
          <!-- Elemen Teks -->
          <text class="label-content" text-anchor="${align}" x="${initX}" y="${size + 4}" font-family="${font}" font-weight="${fontWeight}" font-style="${fontStyle}" text-decoration="${textDeco}" font-size="${size}px" fill="${color}" style="pointer-events: none;">${tspanHTML}</text>
        </svg>`;
    }

    updateState(_isSimActive) {
        if (!this.contentDiv) return;
        
        const svgWrapper = this.contentDiv.querySelector('.label-svg-wrapper');
        const svgText = this.contentDiv.querySelector('.label-content');
        const svgBox = this.contentDiv.querySelector('.label-box');
        const svgDragArea = this.contentDiv.querySelector('.label-drag-area');
        
        if (svgText) {
            const text = this.compData.customText || 'Teks Baru';
            const size = parseFloat(this.compData.fontSize) || 16;
            const color = this.compData.textColor || '#ffffff';
            const font = this.compData.fontFamily || 'sans-serif';
            const showBox = this.compData.showBox ? 'block' : 'none';
            const align = this.compData.textAlign || 'start';
            const isBold = this.compData.isBold || false;
            const isItalic = this.compData.isItalic || false;
            const isUnderline = this.compData.isUnderline || false;
            const isStrike = this.compData.isStrikeout || false;

            // Cek perubahan state untuk mencegah lag karena getBBox dan manipulasi DOM 60x per detik
            if (this._lastText === text && this._lastSize === size && 
                this._lastColor === color && this._lastFont === font && 
                this._lastBox === showBox && this._lastAlign === align &&
                this._lastBold === isBold && this._lastItalic === isItalic &&
                this._lastUnderline === isUnderline && this._lastStrike === isStrike) {
                return;
            }

            this._lastText = text;
            this._lastSize = size;
            this._lastColor = color;
            this._lastFont = font;
            this._lastBox = showBox;
            this._lastAlign = align;
            this._lastBold = isBold;
            this._lastItalic = isItalic;
            this._lastUnderline = isUnderline;
            this._lastStrike = isStrike;

            let initX = '10';
            if (align === 'middle') initX = '50%';
            if (align === 'end') initX = '100%';

            // Update Properti Teks (Dukungan Multiline)
            const lines = text.split('\n');
            svgText.innerHTML = ''; // Bersihkan isi lama
            lines.forEach((line, index) => {
                const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
                tspan.setAttribute('x', initX);
                tspan.setAttribute('dy', index === 0 ? '0' : (size * 1.2));
                tspan.textContent = line;
                svgText.appendChild(tspan);
            });
            
            let deco = [];
            if (isUnderline) deco.push('underline');
            if (isStrike) deco.push('line-through');

            svgText.setAttribute('text-anchor', align);
            svgText.style.fontSize = size + 'px';
            svgText.setAttribute('fill', color);
            svgText.setAttribute('font-family', font);
            svgText.setAttribute('font-weight', isBold ? 'bold' : 'normal');
            svgText.setAttribute('font-style', isItalic ? 'italic' : 'normal');
            svgText.setAttribute('text-decoration', deco.length > 0 ? deco.join(' ') : 'none');
            svgText.setAttribute('x', initX);
            svgText.setAttribute('y', size + 4);
            
            // Toggle Kotak Background
            if (svgBox) svgBox.style.display = showBox;

            // 🌟 TRIK CERDAS: Otomatis menghitung lebar tulisan agar kotaknya pas!
            setTimeout(() => {
                if (!document.body.contains(svgText)) return; // Pastikan teks masih di DOM

                const bbox = svgText.getBBox(); // Ambil ukuran asli teks yang sudah dirender
                const newWidth = Math.max(100, bbox.width + 20); // Tambah padding kiri-kanan
                const newHeight = Math.max(30, bbox.height + 14); // Tambah padding bawah untuk baris tambahan
                
                if (align === 'end') {
                    // Koreksi posisi teks rata kanan agar tidak melebihi padding
                    const rightX = newWidth - 10;
                    svgText.setAttribute('x', rightX);
                    svgText.querySelectorAll('tspan').forEach(ts => ts.setAttribute('x', rightX));
                } else if (align === 'middle') {
                    const midX = newWidth / 2;
                    svgText.setAttribute('x', midX);
                    svgText.querySelectorAll('tspan').forEach(ts => ts.setAttribute('x', midX));
                }

                // Lebarkan SVG dan Kotaknya
                if (svgWrapper) {
                    svgWrapper.setAttribute('width', newWidth);
                    svgWrapper.setAttribute('height', newHeight);
                }
                if (svgBox) {
                    svgBox.setAttribute('width', newWidth);
                    svgBox.setAttribute('height', newHeight);
                }
                if (svgDragArea) {
                    svgDragArea.setAttribute('width', newWidth + 10);
                    svgDragArea.setAttribute('height', newHeight);
                }
                
                // PENTING: Update ukuran kotak seleksi utama agar garis ungunya pas (jika ada mainDiv)
                if (this.mainDiv) {
                    this.mainDiv.style.width = newWidth + 'px';
                    this.mainDiv.style.height = newHeight + 'px';
                }
            }, 0); // setTimeout 0 memberi jeda singkat ke browser untuk menghitung lebar font
        }
    }
}

UIRegistry['text_label'] = TextLabel;