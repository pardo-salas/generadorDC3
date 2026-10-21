// Lee el Excel en el navegador y genera el PDF sin servidor (no hay PHP ni subida de archivos).

function updateFileName(input) {
    input.nextElementSibling.innerText = input.files[0] ? input.files[0].name : 'Elija el archivo';
}

// Convierte la primera hoja del Excel en un arreglo de objetos usando la primera fila como encabezados
async function excelToArray(file) {
    const workbook = XLSX.read(await file.arrayBuffer(), { cellNF: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

    const cellValue = (r, c) => {
        const cell = sheet[XLSX.utils.encode_cell({ r, c })];
        if (!cell || cell.v === undefined || cell.v === null || cell.v === '') {
            return null;
        }
        // Fechas de Excel (número de serie con formato de fecha) -> YYYY-MM-DD
        if (cell.t === 'n' && cell.v && XLSX.SSF.is_date(cell.z || '')) {
            const d = XLSX.SSF.parse_date_code(cell.v);
            return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
        }
        return typeof cell.v === 'string' ? cell.v.trim() : cell.v;
    };

    const header = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
        const name = cellValue(range.s.r, c);
        if (name !== null) {
            header.push({ c, name: String(name) });
        }
    }

    const data = [];
    for (let r = range.s.r + 1; r <= range.e.r; r++) {
        const row = {};
        let hasData = false;
        for (const { c, name } of header) {
            row[name] = cellValue(r, c);
            hasData = hasData || row[name] !== null;
        }
        // Ignorar filas completamente vacías
        if (hasData) {
            data.push(row);
        }
    }
    return data;
}

// Usa la imagen subida por el usuario o la imagen por defecto de assets/
function imageOrDefault(input, fallback) {
    const file = input.files[0];
    return loadImage(file || fallback);
}

async function generar(tipo, form) {
    const excel = form.fileUpload.files[0];
    if (!excel) {
        throw new Error('Sube el archivo de Excel con los participantes.');
    }
    const rows = await excelToArray(excel);
    if (rows.length === 0) {
        throw new Error('El Excel no tiene participantes (revisa que la primera fila sean los encabezados).');
    }

    const values = Object.fromEntries(
        ['razonSocial', 'rfc', 'ocupacion', 'capacitador', 'registroACE', 'instructor', 'patron',
            'representanteTrabajadores', 'curso', 'area', 'folio', 'folioNumber', 'impartido']
            .map((name) => [name, form[name].value.trim()])
    );

    if (tipo === 'constancia') {
        const images = {
            fondo: await loadImage('assets/constancia.png'),
            logoCurso: await imageOrDefault(form.logoCursoUpload, 'assets/curso.png'),
        };
        return { blob: generarConstancia(rows, values, images), nombre: 'constancia.pdf' };
    }

    const images = {
        logo: await imageOrDefault(form.logoUpload, 'assets/logo.jpg'),
        logoCurso: await imageOrDefault(form.logoCursoUpload, 'assets/curso.jpg'),
        instructorFirma: await imageOrDefault(form.fileUploadInstructor, 'assets/avila.png'),
        patronFirma: await imageOrDefault(form.fileUploadRepresentanteLegal, 'assets/mariaelena.png'),
        representanteFirma: await imageOrDefault(form.fileUploadRepresentanteTrabajadores, 'assets/veronica.png'),
        qr: await loadImage('assets/qr.jpg'),
        sello: await loadImage('assets/sello.jpg'),
    };
    return { blob: generarFormato(rows, values, images), nombre: 'formatosDC3.pdf' };
}

document.getElementById('dc3Form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const button = event.submitter;
    const tipo = button && button.id === 'constancia' ? 'constancia' : 'formato';

    // Se abre la pestaña antes del trabajo asíncrono para que el navegador no la bloquee
    const win = window.open('', '_blank');
    const originalText = button ? button.innerText : '';
    if (button) {
        button.disabled = true;
        button.innerText = 'Generando...';
    }

    try {
        const { blob, nombre } = await generar(tipo, form);
        const url = URL.createObjectURL(blob);
        if (win) {
            win.location.href = url;
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.download = nombre;
            link.click();
        }
    } catch (error) {
        if (win) {
            win.close();
        }
        console.error(error);
        alert(error.message);
    } finally {
        if (button) {
            button.disabled = false;
            button.innerText = originalText;
        }
    }
});
