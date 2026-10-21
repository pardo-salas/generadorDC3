// Port de generate.php: formato DC-3 (una página por trabajador)

function generarFormato(rows, form, images) {
    const ocupacion = form.ocupacion.toUpperCase();
    const razonSocial = (form.razonSocial || 'INDHECA GRUPO CONSTRUCTOR').toUpperCase();
    const rfc = (form.rfc || 'IGC-050407-LA9').toUpperCase();
    const { capacitador, registroACE, instructor, patron, representanteTrabajadores, curso, area, folio } = form;
    let folioNumber = parseInt(form.folioNumber, 10) || 0;

    for (const row of rows) {
        const curp = String(row.curp ?? '').trim().toUpperCase();
        if (curp.length < 18) {
            throw new Error(`El CURP de ${row.nombre ?? ''} ${row.apellidos ?? ''} debe tener 18 caracteres.`);
        }
    }

    const pdf = new TcpdfLike('P');

    for (const row of rows) {
        pdf.addPage();

        pdf.setFillColor(255, 255, 255);
        pdf.multicell(0, 5, '', 0, 'C', 1, 0, 10, 10);

        pdf.image(images.logo, 14, 30, 0, 15);
        pdf.image(images.logoCurso, 150, 20, 0, 35);

        pdf.setFont('B', 10);
        pdf.setXY(17, 50);
        pdf.multicell(0, 4, 'FORMATO DC-3', 0, 'C', 0, 1);
        pdf.multicell(0, 4, 'CONSTANCIA DE COMPETENCIAS O DE HABILIDADES LABORALES', 0, 'C', 0, 1);

        pdf.setFillColor(0, 0, 0);
        pdf.setTextColor(255, 255, 255);
        pdf.multicell(0, 7, 'DATOS DEL TRABAJADOR', 0, 'C', 1, 1);

        pdf.setFillColor(255, 255, 255);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('', 7);
        pdf.multicell(0, 8, 'Nombre (Anotar apellido paterno, apellido materno y nombre (s))', 0, 'L', 1, 0);

        const nombre = String(row.nombre ?? '').toUpperCase();
        const apellidos = String(row.apellidos ?? '').toUpperCase();
        pdf.setFont('B', 10);
        pdf.multicell(0, 8, `\n${apellidos} ${nombre}`, 1, 'C', 0, 1, 10);

        pdf.setFont('', 7);
        pdf.multicell(95, 4, 'Clave Única de Registro de Población', 1, 'L', 1, 1);

        pdf.setFont('B', 8);
        for (const char of String(row.curp).trim().toUpperCase()) {
            pdf.multicell(5.28, 8, char, 1, 'C', 0, 0);
        }
        pdf.setFont('', 7);

        let altura = pdf.getY() - 4;
        pdf.multicell(95, 8, 'Ocupación específica (Catálogo Nacional de Ocupaciones) 1/', 1, 'L', 0, 1, 105, altura);
        pdf.setFont('B', 7.8);
        pdf.multicell(0, 8, `\n${ocupacion}`, 0, 'L', 0, 1, 105, altura);

        pdf.setFont('', 7);
        pdf.multicell(0, 8, 'Puesto*', 1, 'L', 0, 0);

        pdf.setFont('B', 10);
        const puesto = String(row.puesto ?? '').toUpperCase();
        pdf.multicell(0, 8, `\n${puesto}`, 1, 'L', 1, 1, 10);

        pdf.setFont('B', 8);
        pdf.setFillColor(0, 0, 0);
        pdf.setTextColor(255, 255, 255);
        pdf.multicell(0, 6, 'DATOS DE LA EMPRESA', 1, 'C', 1, 1);

        pdf.setFillColor(255, 255, 255);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('', 7);
        pdf.multicell(0, 8, 'Nombre o razón social (En caso de persona física, anotar apellido paterno, apellido materno y nombre(s))', 1, 'L', 0, 0);

        pdf.setFont('B', 10);
        pdf.multicell(0, 8, `\n${razonSocial}`, 1, 'L', 1, 1, 10);

        pdf.setFont('', 7);
        pdf.multicell(0, 8, 'Registro Federal de Contribuyentes con homoclave (SHCP)', 1, 'L', 0, 0);

        pdf.setFont('B', 7);
        altura = pdf.getY() + 4;
        pdf.setXY(15, altura);
        for (const char of rfc) {
            pdf.multicell(5.28, 4, char, 'LR', 'C', 0, 0);
        }
        pdf.ln(4);

        pdf.setFont('B', 10);
        pdf.setFillColor(0, 0, 0);
        pdf.setTextColor(255, 255, 255);
        pdf.multicell(0, 6, 'DATOS DEL PROGRAMA DE CAPACITACIÓN, ADIESTRAMIENTO Y PRODUCTIVIDAD', 1, 'C', 1, 1);

        pdf.setFillColor(255, 255, 255);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('', 7);
        pdf.multicell(0, 8, 'Nombre del curso', 0, 'L', 0, 0);

        pdf.setFont('B', 12);
        pdf.multicell(0, 8, `\n${curso}`, 1, 'C', 0, 1, 10, '', true);

        pdf.setFont('', 7);
        pdf.multicell(50, 8, 'Duración en horas', 1, 'L', 0, 0);
        pdf.setFont('B', 12);
        pdf.multicell(50, 8, `\n${row.duracion ?? ''}`, 1, 'C', 0, 0, 10, '', true);
        pdf.setFont('', 7);

        pdf.multicell(20, 8, 'Periodo de \nejecucion:   De', 1, 'L', 0, 0);

        pdf.setFont('B', 8);
        const fechaInicio = String(row.fecha_inicio ?? '').split('-');
        const fechaFin = String(row.fecha_termino ?? '').split('-');

        // Fecha inicio
        pdf.multicell(26, 8, 'Año', 1, 'C', 0, 0);
        pdf.multicell(14, 8, 'Mes', 1, 'C', 0, 0);
        pdf.multicell(14, 8, 'Dia', 1, 'C', 0, 0);
        pdf.multicell(12, 8, '\na', 1, 'C', 0, 0);

        // Fecha fin
        pdf.multicell(26, 8, 'Año', 1, 'C', 0, 0);
        pdf.multicell(14, 8, 'Mes', 1, 'C', 0, 0);
        pdf.multicell(14, 8, 'Dia', 1, 'C', 0, 0);

        altura = pdf.getY() + 4;
        pdf.setXY(80, altura);
        digitos(pdf, fechaInicio);
        pdf.setX(146);
        digitos(pdf, fechaFin);
        pdf.ln(4);

        pdf.setFont('', 7);
        pdf.multicell(0, 8, 'Área temática del curso 2/', 1, 'L', 0, 0);

        pdf.setFont('B', 8.5);
        pdf.multicell(0, 8, `\n${area}`, 1, 'L', 1, 1, 10);

        pdf.setFont('', 7);
        pdf.multicell(0, 8, 'Nombre del agente capacitador o STPS 3/', 1, 'L', 0, 0);

        pdf.setFont('B', 8.5);
        pdf.multicell(0, 9, `\n${capacitador}`, 1, 'L', 1, 0, 10);

        pdf.setFont('', 8.5);
        pdf.multicell(35, 8, '\nREGISTRO ACE STPS:', 0, 'L', 0, 0, 70);
        pdf.setFont('B', 8.5);
        pdf.multicell(0, 8, `\n${registroACE}`, 0, 'L', 0, 1, 103);

        pdf.setFont('B', 8);
        pdf.multicell(0, 40, 'Los datos se asientan en esta constancia bajo protesta de decir verdad, apercibidos de la responsabilidad en que incurre todo\naquel que no se conduce con verdad.', 1, 'C', 1, 0, 10);

        pdf.setFont('', 8);
        altura = pdf.getY() + 10;
        pdf.multicell(45, 4, 'Instructor o tutor', 0, 'C', 0, 0, 20, altura);
        pdf.multicell(45, 4, 'Patrón o representante legal 4/', 0, 'C', 0, 0, 80, altura);
        pdf.multicell(55, 4, 'Representante de los trabajadores 5/', 0, 'C', 0, 1, 140, altura);

        altura = pdf.getY();
        pdf.image(images.instructorFirma, 10, altura, 0, 25);
        pdf.image(images.patronFirma, 90, altura - 4, 0, 40);
        pdf.image(images.representanteFirma, 150, altura, 0, 25);

        altura = pdf.getY() + 15;
        pdf.multicell(45, 4, instructor, 'B', 'C', 1, 0, 20, altura, true);
        pdf.multicell(50, 4, patron, 'B', 'C', 1, 0, 75, altura, true);
        pdf.multicell(55, 4, representanteTrabajadores, 'B', 'C', 1, 1, 140, altura, true);

        pdf.multicell(45, 4, 'Nombre y firma', 0, 'C', 0, 0, 20);
        pdf.multicell(50, 4, 'Nombre y firma', 0, 'C', 0, 0, 75);
        pdf.multicell(55, 4, 'Nombre y firma', 0, 'C', 0, 1, 140);

        pdf.setFont('B', 8);
        pdf.ln(4);

        pdf.multicell(40, 4, 'FOLIO:', 0, 'C', 0, 0, 115);
        pdf.setTextColor(255, 0, 0);
        pdf.multicell(40, 4, `${folio}${String(folioNumber).padStart(3, '0')}`, 0, 'C', 0, 1);
        folioNumber++;
        pdf.setTextColor(0, 0, 0);

        pdf.setFont('B', 8);
        pdf.multicell(0, 4, 'INSTRUCCIONES', 0, 'L', 0, 1);

        pdf.setFont('', 5.5);
        pdf.multicell(0, 4, `- Llenar a máquina o con letra de molde.
- Deberá entregarse al trabajador dentro de los veinte días hábiles siguientes al término del curso de capacitación aprobado.
            1/   Las áreas y subáreas ocupacionales del Catálogo Nacional de Ocupaciones se encuentran disponibles en el reverso de este formato y en la página www.stps.gob.mx
 2/    Las áreas temáticas de los cursos se encuentran disponibles en el reverso de este formato y en la página www.stps.gob.mx
 3/    Cursos impartidos por el área competente de la Secretaria del Trabajo y Previsión Social.
 4/    Para empresas con menos de 51 trabajadores. Para empresas con más de 50 trabajadores firmaría el representante del patrón ante la Comisión mixta de capacitación,
adiestramiento y productividad.
 5/    Solo para empresas con más de 50 trabajadores.
 * Dato no obligatorio.`, 0, 'L', 0, 1);

        pdf.image(images.qr, 80, '', 0, 35);
        pdf.image(images.sello, 120, 240, 0, 25);
    }

    return pdf.output();
}

// Dibuja año (4 casillas de 6.5mm), mes y día (2 casillas de 7mm) a partir de [YYYY, MM, DD]
function digitos(pdf, [anio = '', mes = '', dia = '']) {
    for (const char of anio) pdf.multicell(6.5, 4, char, 'LR', 'C', 0, 0);
    for (const char of mes) pdf.multicell(7, 4, char, 'LR', 'C', 0, 0);
    for (const char of dia) pdf.multicell(7, 4, char, 'LR', 'C', 0, 0);
}
