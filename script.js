document.addEventListener('DOMContentLoaded', () => {
    // --- Data Storage ---
    let students = JSON.parse(localStorage.getItem('students')) || [];
    let attendance = JSON.parse(localStorage.getItem('attendance')) || {};

    // --- DOM Elements ---
    const headerDate = document.getElementById('header-date');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Attendance Tab
    const attendanceDateInput = document.getElementById('attendance-date');
    const attendanceList = document.getElementById('attendance-list');
    const countA = document.getElementById('count-a');
    const countT = document.getElementById('count-t');
    const countF = document.getElementById('count-f');
    const countJ = document.getElementById('count-j');

    // Students Tab
    const newStudentNameInput = document.getElementById('new-student-name');
    const addStudentBtn = document.getElementById('add-student-btn');
    const manageStudentsList = document.getElementById('manage-students-list');

    // Reports Tab
    const reportMonth = document.getElementById('report-month');
    const reportYear = document.getElementById('report-year');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    // Backup System
    const backupSaveBtn = document.getElementById('backup-save-btn');
    const backupLoadBtn = document.getElementById('backup-load-btn');
    const backupFileInput = document.getElementById('backup-file-input');

    // --- Initialization ---
    function init() {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        attendanceDateInput.value = dateStr;

        // Year for report
        reportYear.value = today.getFullYear();
        reportMonth.value = today.getMonth();

        updateHeaderDate();
        renderActiveTab();
        renderReportPreview();
    }

    function updateHeaderDate() {
        const now = new Date();
        headerDate.textContent = new Intl.DateTimeFormat('es-PE', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }).format(now);
    }

    function save() {
        localStorage.setItem('students', JSON.stringify(students));
        localStorage.setItem('attendance', JSON.stringify(attendance));
    }

    // --- Navigation ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            renderActiveTab();
        });
    });

    function renderActiveTab() {
        const activeTab = document.querySelector('.tab-content.active').id;
        if (activeTab === 'attendance-tab') {
            renderAttendance();
        } else if (activeTab === 'students-tab') {
            renderStudentsManagement();
        } else if (activeTab === 'reports-tab') {
            renderReportPreview();
        }
    }

    // --- Attendance Logic ---
    attendanceDateInput.addEventListener('change', renderAttendance);

    function renderAttendance() {
        const selectedDate = attendanceDateInput.value;
        if (!selectedDate) return;

        const dayData = attendance[selectedDate] || {};
        attendanceList.innerHTML = '';

        // Only show active students
        const activeStudents = students.filter(s => s.active !== false);

        activeStudents.forEach(student => {
            const record = dayData[student.id] || { status: 'P', time: '-' };
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="student-name">${student.name}</span></td>
                <td><span class="status-badge ${record.status}">${record.status === 'P' ? 'Pendiente' : getStatusLabel(record.status)}</span></td>
                <td class="text-light">${record.time}</td>
                <td>
                    <div class="status-group">
                        <button class="status-btn A" onclick="mark('${student.id}', 'A')">A</button>
                        <button class="status-btn T" onclick="mark('${student.id}', 'T')">T</button>
                        <button class="status-btn F" onclick="mark('${student.id}', 'F')">F</button>
                        <button class="status-btn J" onclick="mark('${student.id}', 'J')">J</button>
                    </div>
                </td>
            `;
            attendanceList.appendChild(tr);
        });

        updateSummary(dayData);
    }

    window.mark = function (studentId, status) {
        const selectedDate = attendanceDateInput.value;
        const now = new Date();
        const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        if (!attendance[selectedDate]) attendance[selectedDate] = {};

        attendance[selectedDate][studentId] = {
            status: status,
            time: timeStr
        };

        save();
        renderAttendance();
        showToast(`Marcado como ${getStatusLabel(status)}`);
    };

    function getStatusLabel(status) {
        const labels = { 'A': 'Asistió', 'T': 'Tardanza', 'F': 'Falta', 'J': 'Justificado' };
        return labels[status] || status;
    }

    function updateSummary(dayData) {
        let counts = { A: 0, T: 0, F: 0, J: 0 };
        Object.values(dayData).forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
        countA.textContent = counts.A;
        countT.textContent = counts.T;
        countF.textContent = counts.F;
        countJ.textContent = counts.J;
    }

    // --- Student Management ---
    addStudentBtn.addEventListener('click', () => {
        const name = newStudentNameInput.value.trim();
        if (!name) return;

        students.push({
            id: Date.now().toString(),
            name: name,
            active: true
        });

        newStudentNameInput.value = '';
        save();
        renderStudentsManagement();
        showToast('Alumno registrado');
    });

    function renderStudentsManagement() {
        manageStudentsList.innerHTML = '';
        students.forEach((student, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="text" value="${student.name}" onchange="updateStudentName('${student.id}', this.value)" class="edit-input"></td>
                <td>
                    <label class="switch">
                        <input type="checkbox" ${student.active !== false ? 'checked' : ''} onchange="toggleStudentActive('${student.id}')">
                        <span class="slider"></span>
                    </label>
                    <span style="font-size: 0.75rem; margin-left: 0.5rem;">${student.active !== false ? 'Activo' : 'Inactivo'}</span>
                </td>
                <td>
                    <button class="btn-icon" onclick="deleteStudent('${student.id}')" title="Eliminar">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                </td>
            `;
            manageStudentsList.appendChild(tr);
        });
    }

    window.updateStudentName = function (id, newName) {
        const student = students.find(s => s.id === id);
        if (student) {
            student.name = newName;
            save();
            showToast('Nombre actualizado');
        }
    };

    window.toggleStudentActive = function (id) {
        const student = students.find(s => s.id === id);
        if (student) {
            student.active = !student.active;
            save();
            renderStudentsManagement();
            showToast(student.active ? 'Alumno activado' : 'Alumno desactivado');
        }
    };

    window.deleteStudent = function (id) {
        if (confirm('¿Eliminar definitivamente a este alumno?')) {
            students = students.filter(s => s.id !== id);
            save();
            renderStudentsManagement();
            showToast('Alumno eliminado');
        }
    };

    // --- Reporting ---
    exportExcelBtn.addEventListener('click', () => {
        const month = parseInt(reportMonth.value);
        const year = parseInt(reportYear.value);
        const monthName = reportMonth.options[reportMonth.selectedIndex].text;
        const data = generateReportData(month, year);

        if (data.length === 0) {
            showToast('No hay datos para este mes');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Asistencia");

        // Fix: Explicitly named file with extension
        const fileName = `Asistencia_${monthName}_${year}.xlsx`.replace(/\s+/g, '_');
        XLSX.writeFile(wb, fileName);
    });

    exportPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const month = parseInt(reportMonth.value);
        const year = parseInt(reportYear.value);
        const monthName = reportMonth.options[reportMonth.selectedIndex].text;

        const data = generateReportData(month, year);
        if (data.length === 0) {
            showToast('No hay datos para este mes');
            return;
        }

        doc.setFontSize(18);
        doc.text(`Reporte de Asistencia - ${monthName} ${year}`, 14, 20);

        const tableData = data.map(row => [row.Alumno, row.Asistencias, row.Tardanzas, row.Faltas, row.Justificados]);

        doc.autoTable({
            startY: 30,
            head: [['Alumno', 'Asistencias', 'Tardanzas', 'Faltas', 'Justificados']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [99, 102, 241] }
        });

        // Fix: Explicitly named file with extension
        const fileName = `Reporte_Asistencia_${monthName}_${year}.pdf`.replace(/\s+/g, '_');
        doc.save(fileName);
    });

    // --- Backup System Logic ---
    backupSaveBtn.addEventListener('click', () => {
        const data = {
            students: students,
            attendance: attendance,
            version: "1.0",
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `Copia_Seguridad_Asistencia_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Copia de seguridad guardada');
    });

    backupLoadBtn.addEventListener('click', () => {
        backupFileInput.click();
    });

    backupFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.students && data.attendance) {
                    if (confirm('¿Cargar copia de seguridad? Esto reemplazará todos los datos actuales.')) {
                        students = data.students;
                        attendance = data.attendance;
                        save();
                        showToast('Datos cargados satisfactoriamente. Recargando...');
                        setTimeout(() => location.reload(), 1500);
                    }
                } else {
                    alert('El archivo no es una copia de seguridad válida.');
                }
            } catch (err) {
                alert('Error al leer el archivo JSON.');
            }
        };
        reader.readAsText(file);
    });

    // --- Reporting ---
    function getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function generateGridData(month, year) {
        const daysCount = getDaysInMonth(year, month);
        const activeStudents = students.filter(s => s.active !== false);

        let matrix = [];
        let dailyTotals = Array(daysCount).fill(0).map(() => ({ A: 0, T: 0, F: 0, J: 0 }));

        activeStudents.forEach(student => {
            let row = { Alumno: student.name, id: student.id };
            let studentTotals = { A: 0, T: 0, F: 0, J: 0 };

            for (let d = 1; d <= daysCount; d++) {
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const record = (attendance[dateKey] || {})[student.id];
                const status = record ? record.status : '-';

                row[d] = status;
                if (studentTotals[status] !== undefined) {
                    studentTotals[status]++;
                    dailyTotals[d - 1][status]++;
                }
            }
            row.Total_A = studentTotals.A;
            row.Total_T = studentTotals.T;
            row.Total_F = studentTotals.F;
            row.Total_J = studentTotals.J;
            matrix.push(row);
        });

        return { matrix, daysCount, dailyTotals };
    }

    function renderReportPreview() {
        const month = parseInt(reportMonth.value);
        const year = parseInt(reportYear.value);
        const { matrix, daysCount, dailyTotals } = generateGridData(month, year);
        const previewDiv = document.getElementById('report-preview');

        if (matrix.length === 0) {
            previewDiv.innerHTML = '<p class="text-light">No hay alumnos activos para este periodo.</p>';
            return;
        }

        let html = `<div class="table-container preview-grid-container">
            <table class="main-table preview-table">
                <thead>
                    <tr>
                        <th class="sticky-col">Alumno</th>
                        ${Array.from({ length: daysCount }, (_, i) => `<th>${i + 1}</th>`).join('')}
                        <th>A</th><th>T</th><th>F</th><th>J</th>
                    </tr>
                </thead>
                <tbody>`;

        matrix.forEach(row => {
            html += `<tr>
                <td class="sticky-col"><b>${row.Alumno}</b></td>
                ${Array.from({ length: daysCount }, (_, i) => {
                const status = row[i + 1];
                return `<td class="cell-${status}">${status}</td>`;
            }).join('')}
                <td>${row.Total_A}</td><td>${row.Total_T}</td><td>${row.Total_F}</td><td>${row.Total_J}</td>
            </tr>`;
        });

        // Totals row at bottom (A, T, F, J)
        html += `<tr class="totals-row">
            <td class="sticky-col"><b>TOTALES</b></td>
            ${dailyTotals.map(dt => `<td>A:${dt.A}<br>T:${dt.T}<br>F:${dt.F}<br>J:${dt.J}</td>`).join('')}
            <td colspan="4"></td>
        </tr>`;

        html += `</tbody></table></div>`;
        previewDiv.innerHTML = html;
    }

    // Call preview when month/year changes
    reportMonth.addEventListener('change', renderReportPreview);
    reportYear.addEventListener('change', renderReportPreview);

    exportExcelBtn.addEventListener('click', async () => {
        const month = parseInt(reportMonth.value);
        const year = parseInt(reportYear.value);
        const monthName = reportMonth.options[reportMonth.selectedIndex].text;
        const { matrix, daysCount, dailyTotals } = generateGridData(month, year);

        if (matrix.length === 0) return;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Asistencia');

        // Styles
        const colorMap = {
            'A': { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }, // Green
            'F': { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } }, // Red
            'T': { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } }, // Yellow
            'J': { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B5CF6' } }  // Purple
        };

        const borderStyle = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };

        // Title Row
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `ASISTENCIA ${monthName.toUpperCase()} ${year}`;
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center' };
        worksheet.mergeCells(1, 1, 1, daysCount + 5);

        // Header Row
        const headerRow = worksheet.getRow(2);
        headerRow.values = ['Alumno', ...Array.from({ length: daysCount }, (_, i) => `${i + 1}-${monthName.substring(0, 3)}`), 'A', 'T', 'F', 'J'];
        headerRow.font = { bold: true };
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
            cell.border = borderStyle;
            cell.alignment = { horizontal: 'center' };
        });

        // Data Rows
        matrix.forEach((row, rowIndex) => {
            const excelRow = worksheet.getRow(rowIndex + 3);
            let rowValues = [row.Alumno];
            for (let d = 1; d <= daysCount; d++) rowValues.push(row[d]);
            rowValues.push(row.Total_A, row.Total_T, row.Total_F, row.Total_J);
            excelRow.values = rowValues;

            excelRow.eachCell((cell, colIndex) => {
                cell.border = borderStyle;
                cell.alignment = { horizontal: colIndex === 1 ? 'left' : 'center' };
                if (colIndex > 1 && colIndex <= daysCount + 1) {
                    const status = cell.value;
                    if (colorMap[status]) {
                        cell.fill = colorMap[status];
                        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                    }
                }
            });
        });

        // Totals Rows at Bottom
        ['A', 'T', 'F', 'J'].forEach((status, idx) => {
            const totalRow = worksheet.getRow(matrix.length + 3 + idx);
            let vals = [`TOTALES (${status})`];
            for (let d = 1; d <= daysCount; d++) vals.push(dailyTotals[d - 1][status]);
            totalRow.values = vals;
            totalRow.eachCell(cell => {
                cell.font = { bold: true };
                cell.border = borderStyle;
            });
        });

        // Column Widths
        worksheet.getColumn(1).width = 25;
        for (let d = 1; d <= daysCount; d++) worksheet.getColumn(d + 1).width = 6;
        for (let s = 1; s <= 4; s++) worksheet.getColumn(daysCount + 1 + s).width = 6;

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Asistencia_${monthName}_${year}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    });

    exportPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');
        const month = parseInt(reportMonth.value);
        const year = parseInt(reportYear.value);
        const monthName = reportMonth.options[reportMonth.selectedIndex].text;
        const { matrix, daysCount, dailyTotals } = generateGridData(month, year);

        doc.setFontSize(14);
        doc.text(`REPORTE DE ASISTENCIA: ${monthName.toUpperCase()} ${year}`, 14, 15);

        const head = [['Alumno', ...Array.from({ length: daysCount }, (_, i) => (i + 1).toString()), 'A', 'T', 'F', 'J']];
        const body = matrix.map(row => {
            const rowData = [row.Alumno];
            for (let d = 1; d <= daysCount; d++) rowData.push(row[d]);
            rowData.push(row.Total_A, row.Total_T, row.Total_F, row.Total_J);
            return rowData;
        });

        const footerTotals = ["TOTALES DIARIOS"];
        for (let d = 0; d < daysCount; d++) {
            const dt = dailyTotals[d];
            footerTotals.push(`A:${dt.A} T:${dt.T}\nF:${dt.F} J:${dt.J}`);
        }
        footerTotals.push("-", "-", "-", "-");
        body.push(footerTotals);

        doc.autoTable({
            startY: 20,
            head: head,
            body: body,
            theme: 'grid',
            styles: { fontSize: 4.5, cellPadding: 0.5, halign: 'center' },
            columnStyles: { 0: { cellWidth: 22, halign: 'left', fontStyle: 'bold' } },
            didDrawCell: (data) => {
                if (data.section === 'body' && data.column.index > 0 && data.column.index <= daysCount && data.row.index < matrix.length) {
                    const status = data.cell.text[0];
                    if (status === 'A') doc.setFillColor(16, 185, 129);
                    else if (status === 'F') doc.setFillColor(239, 68, 68);
                    else if (status === 'T') doc.setFillColor(245, 158, 11);
                    else if (status === 'J') doc.setFillColor(139, 92, 246);
                    else return;

                    doc.rect(data.cell.x + 0.2, data.cell.y + 0.2, data.cell.width - 0.4, data.cell.height - 0.4, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.text(status, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' });
                }
            }
        });

        doc.save(`Reporte_${monthName}_${year}.pdf`);
    });

    // --- Utilities ---
    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    init();
});
