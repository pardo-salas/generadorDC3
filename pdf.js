// Envoltura mínima sobre jsPDF que imita el comportamiento de TCPDF
// (MultiCell, Image, ln, márgenes) para conservar el mismo diseño que la versión PHP.

const PT_PER_MM = 72 / 25.4;
const CELL_HEIGHT_RATIO = 1.25;
const CELL_PADDING = 1; // mm, padding horizontal por defecto de TCPDF
const LINE_WIDTH = 0.57 / PT_PER_MM; // grosor de línea por defecto de TCPDF
// Métricas de Helvetica tal como las define TCPDF (fracción del tamaño de letra)
const FONT_METRICS = {
    '': { ascent: 0.931, descent: 0.225 },
    B: { ascent: 0.962, descent: 0.228 },
};

class TcpdfLike {
    constructor(orientation = 'P', margins = { left: 10, top: 10, right: 10 }) {
        this.doc = new window.jspdf.jsPDF({ orientation, unit: 'mm', format: 'a4' });
        this.lMargin = margins.left;
        this.tMargin = margins.top;
        this.rMargin = margins.right;
        this.pageCount = 0;
        this.x = this.lMargin;
        this.y = this.tMargin;
        this.fontSize = 12;
        this.fontStyle = '';
        this.fillColor = [255, 255, 255];
        this.textColor = [0, 0, 0];
        // Igual que TCPDF, los rellenos y bordes se pintan debajo de todo el contenido de la página
        this.background = [];
        this.foreground = [];
        this.onPageStart = null;
        this.setFont('', 12);
    }

    get pageWidth() {
        return this.doc.internal.pageSize.getWidth();
    }

    addPage() {
        if (this.pageCount > 0) {
            this.flush();
            this.doc.addPage();
        }
        this.pageCount++;
        this.x = this.lMargin;
        this.y = this.tMargin;
        if (this.onPageStart) {
            // El encabezado (imagen de fondo) queda debajo de los rellenos, como con setPageMark()
            this.onPageStart(this);
            this.flush();
        }
    }

    flush() {
        for (const draw of [...this.background, ...this.foreground]) {
            draw();
        }
        this.background = [];
        this.foreground = [];
    }

    setFont(style, size) {
        this.fontStyle = style;
        this.fontSize = size;
        this.doc.setFont('helvetica', style === 'B' ? 'bold' : 'normal');
        this.doc.setFontSize(size);
    }

    setFillColor(r, g, b) {
        this.fillColor = [r, g, b];
    }

    setTextColor(r, g, b) {
        this.textColor = [r, g, b];
    }

    getY() {
        return this.y;
    }

    setX(x) {
        this.x = x;
    }

    setXY(x, y) {
        this.x = x;
        this.y = y;
    }

    lineHeight() {
        return (this.fontSize / PT_PER_MM) * CELL_HEIGHT_RATIO;
    }

    ln(h) {
        this.x = this.lMargin;
        this.y += h === undefined ? this.lineHeight() : h;
    }

    wrap(txt, w) {
        return this.doc.splitTextToSize(String(txt ?? ''), w - 2 * CELL_PADDING);
    }

    /**
     * Equivalente a TCPDF::MultiCell($w, $h, $txt, $border, $align, $fill, $ln, $x, $y, ..., $fitcell)
     * x/y = '' usa la posición actual (si solo se indica y, x vuelve al margen izquierdo, igual que TCPDF).
     */
    multicell(w, h, txt, border = 0, align = 'L', fill = 0, ln = 1, x = '', y = '', fitcell = false) {
        if (y !== '') {
            this.y = y;
            this.x = this.lMargin;
        }
        if (x !== '') {
            this.x = x;
        }
        x = this.x;
        y = this.y;
        if (!w || w <= 0) {
            w = this.pageWidth - this.rMargin - x;
        }

        // TCPDF agrega medio grosor de línea arriba/abajo cuando la celda tiene ese borde
        const sides = border === 1 || border === '1' ? 'LTRB' : String(border || '');
        const padT = sides.includes('T') ? LINE_WIDTH / 2 : 0;
        const padB = sides.includes('B') ? LINE_WIDTH / 2 : 0;

        const originalSize = this.fontSize;
        let lines = this.wrap(txt, w);
        const textHeight = () => padT + lines.length * this.lineHeight() + padB;

        // fitcell: reduce el tamaño de letra hasta que el texto quepa en la altura dada
        if (fitcell && h > 0 && textHeight() > h) {
            let min = 1;
            let max = this.fontSize;
            for (let i = 0; i < 40 && max - min > 0.01; i++) {
                const mid = (min + max) / 2;
                this.setFont(this.fontStyle, mid);
                lines = this.wrap(txt, w);
                if (textHeight() > h) {
                    max = mid;
                } else {
                    min = mid;
                }
            }
            this.setFont(this.fontStyle, min);
            lines = this.wrap(txt, w);
        }

        const lineH = this.lineHeight();
        const height = Math.max(h, textHeight());

        const fillColor = this.fillColor;
        this.background.push(() => {
            if (fill) {
                this.doc.setFillColor(...fillColor);
                this.doc.rect(x, y, w, height, 'F');
            }
            this.drawBorder(sides, x, y, w, height);
        });

        const { fontStyle, fontSize, textColor } = this;
        const fontMm = fontSize / PT_PER_MM;
        const { ascent, descent } = FONT_METRICS[fontStyle] || FONT_METRICS[''];
        this.foreground.push(() => {
            this.doc.setFont('helvetica', fontStyle === 'B' ? 'bold' : 'normal');
            this.doc.setFontSize(fontSize);
            this.doc.setTextColor(...textColor);
            lines.forEach((line, i) => {
                const baseline = y + padT + i * lineH + (lineH + (ascent - descent) * fontMm) / 2;
                if (align === 'C') {
                    this.doc.text(line, x + w / 2, baseline, { align: 'center' });
                } else if (align === 'R') {
                    this.doc.text(line, x + w - CELL_PADDING, baseline, { align: 'right' });
                } else {
                    this.doc.text(line, x + CELL_PADDING, baseline);
                }
            });
        });

        if (fitcell) {
            this.setFont(this.fontStyle, originalSize);
        }

        if (ln === 0) {
            this.x = x + w;
            this.y = y;
        } else {
            this.x = this.lMargin;
            this.y = y + height;
        }
    }

    drawBorder(sides, x, y, w, h) {
        if (sides === 'LTRB') {
            this.doc.rect(x, y, w, h, 'S');
            return;
        }
        if (sides.includes('L')) this.doc.line(x, y, x, y + h);
        if (sides.includes('R')) this.doc.line(x + w, y, x + w, y + h);
        if (sides.includes('T')) this.doc.line(x, y, x + w, y);
        if (sides.includes('B')) this.doc.line(x, y + h, x + w, y + h);
    }

    /**
     * Equivalente a TCPDF::Image($file, $x, $y, $w, $h). Si w o h es 0 se calcula
     * con la proporción de la imagen. No mueve el cursor.
     */
    image(img, x = '', y = '', w = 0, h = 0) {
        if (x === '') x = this.x;
        if (y === '') y = this.y;
        if (!w && !h) {
            w = img.width / PT_PER_MM;
            h = img.height / PT_PER_MM;
        } else if (!w) {
            w = (h * img.width) / img.height;
        } else if (!h) {
            h = (w * img.height) / img.width;
        }
        this.foreground.push(() => this.doc.addImage(img.data, img.format, x, y, w, h, img.alias, 'FAST'));
    }

    output() {
        this.flush();
        return this.doc.output('blob');
    }
}

// Carga una imagen (URL o File) y la deja lista para jsPDF: {data, format, width, height, alias}
let imageCounter = 0;
async function loadImage(source) {
    const url = source instanceof Blob ? URL.createObjectURL(source) : source;
    const el = new Image();
    el.src = url;
    try {
        await el.decode();
    } catch (e) {
        throw new Error(`No se pudo cargar la imagen ${source.name || source}`);
    }

    const type = source instanceof Blob ? source.type : (url.match(/\.jpe?g$/i) ? 'image/jpeg' : 'image/png');
    const canvas = document.createElement('canvas');
    canvas.width = el.naturalWidth;
    canvas.height = el.naturalHeight;
    const ctx = canvas.getContext('2d');
    const isJpeg = type === 'image/jpeg';
    if (isJpeg) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(el, 0, 0);
    if (source instanceof Blob) {
        URL.revokeObjectURL(url);
    }

    return {
        data: isJpeg ? canvas.toDataURL('image/jpeg', 0.92) : canvas.toDataURL('image/png'),
        format: isJpeg ? 'JPEG' : 'PNG',
        width: el.naturalWidth,
        height: el.naturalHeight,
        alias: `img${++imageCounter}`,
    };
}
