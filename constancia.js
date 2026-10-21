// Port de constancia.php: constancia horizontal con imagen de fondo

function generarConstancia(rows, form, images) {
    const pdf = new TcpdfLike('L', { left: 0, top: 0, right: 15 });
    pdf.onPageStart = (p) => p.image(images.fondo, 0, 0, 300, 0);

    let folioNumber = parseInt(form.folioNumber, 10) || 0;
    const formatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

    for (const row of rows) {
        pdf.addPage();

        pdf.setFont('B', 35);
        const nombre = ucwords(`${row.nombre ?? ''} ${row.apellidos ?? ''}`.toLowerCase());
        pdf.setTextColor(0, 81, 121);
        pdf.multicell(188, 0, nombre, 0, 'C', 0, 1, 55, 66);

        pdf.setFont('B', 24);
        pdf.setTextColor(70, 124, 182);
        pdf.multicell(230, 10, form.curso, 0, 'C', 0, 1, 40, 95);

        const [anio, mes, dia] = String(row.fecha_inicio ?? '').split('-').map(Number);
        const fecha = anio && mes && dia ? formatter.format(new Date(Date.UTC(anio, mes - 1, dia))) : String(row.fecha_inicio ?? '');

        pdf.ln(10);

        pdf.setFont('', 18);
        pdf.multicell(200, 10, `Impartido en ${form.impartido}, el ${fecha} con una duracion de ${row.duracion ?? ''}`, 0, 'C', 0, 1, 55);

        pdf.image(images.logoCurso, 35, 150, 0, 35);

        pdf.setFont('B', 7);
        pdf.setTextColor(255, 0, 0);
        pdf.multicell(40, 8, `${form.folio}${String(folioNumber).padStart(3, '0')}`, 0, 'C', 0, 1, 252, 191.5, true);
        folioNumber++;
    }

    return pdf.output();
}

// Igual que ucwords() de PHP: mayúscula al inicio de cada palabra
function ucwords(text) {
    return text.replace(/(^|\s)(\S)/g, (m, sep, char) => sep + char.toUpperCase());
}
