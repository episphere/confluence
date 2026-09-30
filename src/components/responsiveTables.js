const EXCLUDED_TABLE_SELECTOR = ".data-manager-accordion-table, .missingness-table, [data-responsive-table='off']";

const getHeaderLabels = table => {
    const headerRows = Array.from(table.tHead?.rows || []);
    if (headerRows.length !== 1) return [];
    const headers = Array.from(headerRows[0].cells || []);
    if (!headers.length || headers.some(header => Number(header.colSpan) > 1 || Number(header.rowSpan) > 1)) return [];
    return headers.map((header, index) => {
        const label = header.dataset.responsiveLabel || header.textContent.replace(/\s+/g, " ").trim();
        return label || (index === headers.length - 1 ? "Actions" : `Column ${index + 1}`);
    });
};

export const enhanceResponsiveTable = table => {
    if (!(table instanceof HTMLTableElement) || table.matches(EXCLUDED_TABLE_SELECTOR)) return false;
    const labels = getHeaderLabels(table);
    if (!labels.length || !table.tBodies.length) return false;

    table.classList.add("responsive-card-table");
    table.closest(".table-responsive")?.classList.add("responsive-card-table-wrap");
    Array.from(table.tBodies).forEach(tbody => Array.from(tbody.rows).forEach(row => {
        const cells = Array.from(row.cells || []);
        const isFullWidthRow = cells.length === 1 && Number(cells[0].colSpan) > 1;
        row.classList.toggle("responsive-card-full-row", isFullWidthRow);
        if (isFullWidthRow) return;
        cells.forEach((cell, index) => {
            if (!cell.dataset.label) cell.dataset.label = labels[index] || `Column ${index + 1}`;
        });
    }));
    return true;
};

export const enhanceResponsiveTables = (root = document) => {
    if (root instanceof HTMLTableElement) enhanceResponsiveTable(root);
    root.querySelectorAll?.("table").forEach(enhanceResponsiveTable);
};

export const initializeResponsiveTables = () => {
    enhanceResponsiveTables(document);
    let scheduled = false;
    const observer = new MutationObserver(mutations => {
        if (scheduled || !mutations.some(mutation => mutation.addedNodes.length)) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            enhanceResponsiveTables(document);
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
};
