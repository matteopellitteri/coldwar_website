const utf8Encoder = new TextEncoder();

function getTableRows(table) {
    return Array.from(table.rows, (row) =>
        Array.from(row.cells, (cell) => {
            const list = cell.querySelector("ul");
            if (list) {
                return Array.from(list.querySelectorAll("li"), (item) => item.textContent.trim()).join("; ");
            }

            const content = cell.cloneNode(true);
            content.querySelectorAll("sup").forEach((marker) => marker.remove());
            return content.textContent.replace(/\s+/g, " ").trim();
        })
    );
}

function downloadFile(filename, content, mimeType) {
    const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function createCsv(rows) {
    return `\uFEFF${rows
        .map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(","))
        .join("\r\n")}`;
}

function exportCsv(rows, filename) {
    downloadFile(filename, createCsv(rows), "text/csv;charset=utf-8");
}

function xmlEscape(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit += 1) {
            crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function createZip(files) {
    const localParts = [];
    const centralParts = [];
    let localOffset = 0;

    for (const [filename, content] of files) {
        const name = utf8Encoder.encode(filename);
        const data = utf8Encoder.encode(content);
        const checksum = crc32(data);
        const localHeader = new Uint8Array(30 + name.length);
        const localView = new DataView(localHeader.buffer);
        localView.setUint32(0, 0x04034b50, true);
        localView.setUint16(4, 20, true);
        localView.setUint16(6, 0x0800, true);
        localView.setUint16(8, 0, true);
        localView.setUint16(10, 0, true);
        localView.setUint16(12, 33, true);
        localView.setUint32(14, checksum, true);
        localView.setUint32(18, data.length, true);
        localView.setUint32(22, data.length, true);
        localView.setUint16(26, name.length, true);
        localHeader.set(name, 30);
        localParts.push(localHeader, data);

        const centralHeader = new Uint8Array(46 + name.length);
        const centralView = new DataView(centralHeader.buffer);
        centralView.setUint32(0, 0x02014b50, true);
        centralView.setUint16(4, 20, true);
        centralView.setUint16(6, 20, true);
        centralView.setUint16(8, 0x0800, true);
        centralView.setUint16(10, 0, true);
        centralView.setUint16(12, 0, true);
        centralView.setUint16(14, 33, true);
        centralView.setUint32(16, checksum, true);
        centralView.setUint32(20, data.length, true);
        centralView.setUint32(24, data.length, true);
        centralView.setUint16(28, name.length, true);
        centralView.setUint32(42, localOffset, true);
        centralHeader.set(name, 46);
        centralParts.push(centralHeader);
        localOffset += localHeader.length + data.length;
    }

    const centralDirectory = new Uint8Array(centralParts.reduce((size, part) => size + part.length, 0));
    let centralOffset = 0;
    for (const part of centralParts) {
        centralDirectory.set(part, centralOffset);
        centralOffset += part.length;
    }

    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(8, files.length, true);
    endView.setUint16(10, files.length, true);
    endView.setUint32(12, centralDirectory.length, true);
    endView.setUint32(16, localOffset, true);

    return new Blob([...localParts, centralDirectory, endRecord], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
}

function createXlsx(rows, sheetName) {
    const columnName = (index) => {
        let name = "";
        for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
            name = String.fromCharCode(65 + ((value - 1) % 26)) + name;
        }
        return name;
    };
    const sheetRows = rows.map((row, rowIndex) => {
        const cells = row.map((value, columnIndex) => {
            const reference = `${columnName(columnIndex)}${rowIndex + 1}`;
            return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
        }).join("");
        return `<row r="${rowIndex + 1}">${cells}</row>`;
    }).join("");
    const safeSheetName = xmlEscape(sheetName.slice(0, 31));
    const files = [
        ["[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'],
        ["_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
        ["xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${safeSheetName}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
        ["xl/_rels/workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'],
        ["xl/worksheets/sheet1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`]
    ];
    return createZip(files);
}

function exportXlsx(rows, filename, sheetName) {
    downloadFile(filename, createXlsx(rows, sheetName), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

document.querySelectorAll(".metadata-export-controls button[data-export-format]").forEach((button) => {
    button.addEventListener("click", () => {
        const wrapper = button.closest(".metadata-table-wrapper");
        const table = wrapper.querySelector(".metadata-table");
        const title = table.caption.textContent.trim();
        const filename = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const rows = getTableRows(table);

        if (button.dataset.exportFormat === "csv") {
            exportCsv(rows, `${filename}.csv`);
        } else {
            exportXlsx(rows, `${filename}.xlsx`, title);
        }
    });
});
