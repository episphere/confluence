export const getDataManagerRoundNumber = request => {
    const match = String(request.round_name || "").match(/(?:^|[_\s-])(?:Round[_\s-]*|R)(\d+)(?=$|[_\s-])/i)
        || String(request.concept_file_name || "").match(/_R(\d+)(?:_\d+)?(?:\.[^.]+)?$/i);
    return match ? Number(match[1]) : null;
};

export const getDataManagerRoundLabel = request => {
    const round = getDataManagerRoundNumber(request);
    return round === null ? "Round unknown" : `Round ${round}`;
};

export const normalizeDataManagerScore = value => String(value || "--").trim().toUpperCase() || "--";

export const compareDataManagerValues = (left, right, column, ascending) => {
    // Missing values stay last when the direction changes.
    const missing = value => value === "" || value === "--";
    if (missing(left) || missing(right)) return Number(missing(left)) - Number(missing(right));
    const direction = ascending ? 1 : -1;
    if (["round", "score", "availability"].includes(column)) {
        const leftNumber = Number(left), rightNumber = Number(right);
        const leftNumeric = Number.isFinite(leftNumber), rightNumeric = Number.isFinite(rightNumber);
        if (leftNumeric && rightNumeric) return (leftNumber - rightNumber) * direction;
        if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    }
    return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" }) * direction;
};

export const setupDataManagerTable = container => {
    const search = container.querySelector("#dataManagerRequestSearch");
    const round = container.querySelector("#dataManagerRoundFilter");
    const scores = container.querySelector("#dataManagerScoreFilter");
    let activeSort = null;
    const sortRows = () => {
        if (!activeSort) return;
        const body = container.querySelector(".data-manager-accordion-table tbody");
        const rows = Array.from(container.querySelectorAll(".data-manager-request-row"));
        rows.sort((left, right) => compareDataManagerValues(left.dataset[`sort${activeSort.column}`] || "", right.dataset[`sort${activeSort.column}`] || "", activeSort.column.toLowerCase(), activeSort.ascending));
        rows.forEach(row => {
            const details = container.querySelector(`#${row.dataset.detailRow}`);
            body.appendChild(row);
            if (details) body.appendChild(details);
        });
    };
    const applyFilters = () => {
        const query = search.value.trim().toLowerCase();
        const selectedScores = Array.from(scores.querySelectorAll("input:checked"), input => input.value);
        let visible = 0;
        container.querySelectorAll(".data-manager-request-row").forEach(row => {
            const show = (!round.value || row.dataset.round === round.value)
                && (!selectedScores.length || selectedScores.includes(row.dataset.score))
                && (!query || `${row.dataset.search || ""} ${row.dataset.stageSearch || ""}`.includes(query));
            row.classList.toggle("d-none", !show);
            container.querySelector(`#${row.dataset.detailRow}`)?.classList.toggle("d-none", !show);
            if (show) visible++;
        });
        container.querySelector("#dataManagerRequestCount").textContent = `${visible} request${visible === 1 ? "" : "s"}`;
        scores.querySelector("[data-score-summary]").textContent = selectedScores.length ? `Scores (${selectedScores.join(", ")})` : "All scores";
        sortRows();
    };
    search.addEventListener("input", applyFilters);
    round.addEventListener("change", applyFilters);
    scores.addEventListener("change", applyFilters);
    scores.querySelector("[data-clear-scores]").addEventListener("click", () => {
        scores.querySelectorAll("input").forEach(input => { input.checked = false; });
        applyFilters();
    });
    container.querySelectorAll("[data-manager-sort]").forEach(button => button.addEventListener("click", () => {
        const column = button.dataset.managerSort;
        activeSort = { column, ascending: activeSort?.column === column ? !activeSort.ascending : true };
        container.querySelectorAll("[data-manager-sort]").forEach(control => {
            const selected = control === button;
            control.closest("th").setAttribute("aria-sort", selected ? activeSort.ascending ? "ascending" : "descending" : "none");
            control.querySelector("i").className = selected ? `fas fa-sort-${activeSort.ascending ? "up" : "down"} ms-1` : "fas fa-sort ms-1";
        });
        sortRows();
    }));
    applyFilters();
    return applyFilters;
};
