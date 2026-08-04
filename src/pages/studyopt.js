import { showPreview } from "../components/boxPreview.js";
import { csv2Json, emailsAllowedToUpdateData } from "../shared.js";
import { exportAdminConsortiaCsv } from "./chairmenu.js";

const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getConceptDisplayName = (value) => String(value ?? "")
    .replace(/_\d{4}-\d{2}-\d{2}\.docx?$/i, "");

const OPT_IN_OUT_DATA_PATH = "./src/data/DataPlatform-Out-in-out.xlsx";
const OPT_IN_OUT_CONCEPTS_CSV_PATH = "./src/data/admin_consortia_requests.csv";

const TRUTHY_VALUES = new Set(["true", "yes", "y", "1", "checked", "opt-out", "opt out", "optout"]);

const normalizeHeaderValue = (value) => String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getCellValue = (row, aliases = []) => {
    if (!row) return "";

    for (const alias of aliases) {
        const normalizedAlias = normalizeHeaderValue(alias);
        const match = Object.entries(row).find(([key]) => normalizeHeaderValue(key) === normalizedAlias);
        if (match) return match[1];
    }

    return "";
};

const isTruthyCellValue = (value) => TRUTHY_VALUES.has(String(value ?? "").trim().toLowerCase());

const getStudyStatusSelect = (value = "in") => {
    const isOut = String(value).trim().toLowerCase() === "out";
    return `
        <select class="form-select form-select-sm study-status-select ${isOut ? "border-danger text-danger" : "border-success text-success"}" style="${isOut ? "background-color: #f8d7da; color: #842029;" : "background-color: #d1e7dd; color: #0f5132;"}; width: 96px; min-width: 96px;" aria-label="Study status">
            <option value="in" ${!isOut ? "selected" : ""} style="background-color: #d1e7dd; color: #0f5132;">Opt-In</option>
            <option value="out" ${isOut ? "selected" : ""} style="background-color: #f8d7da; color: #842029;">Opt-Out</option>
        </select>
    `;
};

const normalizeStudyFilterValue = (value) => String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");

const loadStudyAccessAdminRows = async () => {
    const workbookRows = await loadOptInOutWorkbookRows();
    const csvResponse = await fetch(OPT_IN_OUT_CONCEPTS_CSV_PATH);
    if (!csvResponse.ok) throw new Error(`Unable to load ${OPT_IN_OUT_CONCEPTS_CSV_PATH}`);

    const csvText = await csvResponse.text();
    const conceptRows = csv2Json(csvText).data || [];
    const requestedStudyMap = new Map();

    conceptRows.forEach((row) => {
        const conceptName = String(row.Concept || row.concept || row["Concept Name"] || "").trim();
        const conceptBoxId = String(getCellValue(row, ["Concept Box ID", "Box ID", "File ID", "fileId"]) || "").trim();
        const requestedValues = String(row["Requested Consortia/Study"] || row["Requested Consortia"] || "")
            .split(/[;,]/)
            .map((value) => value.trim())
            .filter(Boolean);

        requestedValues.forEach((requestedStudy) => {
            const key = normalizeStudyFilterValue(requestedStudy);
            const existing = requestedStudyMap.get(key) || { label: requestedStudy, concepts: new Map() };
            if (conceptName) {
                const conceptKey = conceptName.toLowerCase();
                const previousConcept = existing.concepts.get(conceptKey);
                existing.concepts.set(conceptKey, {
                    name: conceptName,
                    boxId: conceptBoxId || previousConcept?.boxId || ""
                });
            }
            requestedStudyMap.set(key, existing);
        });
    });

    const users = workbookRows.map((row) => ({
        name: String(getCellValue(row, ["Name", "name"]) || "Unnamed user").trim(),
        email: String(getCellValue(row, ["Email", "email"]) || "").trim(),
        studies: getWorkbookStudyEntries(row)
    })).filter((user) => user.name || user.email);

    const allStudyMap = new Map();
    users.forEach((user) => {
        user.studies.forEach((study) => {
            const key = normalizeStudyFilterValue(study.acronym || study.name);
            if (!key) return;
            if (!allStudyMap.has(key)) allStudyMap.set(key, study);
        });
    });
    const allStudies = Array.from(allStudyMap.values()).sort((a, b) =>
        (a.acronym || a.name).localeCompare(b.acronym || b.name, undefined, { sensitivity: "base" })
    );

    return Array.from(requestedStudyMap.values())
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
        .map((request) => {
            const normalizedRequest = normalizeStudyFilterValue(request.label);
            const studies = normalizedRequest === "cnci"
                ? allStudies
                : allStudies.filter((study) => [study.name, study.acronym]
                    .map(normalizeStudyFilterValue)
                    .filter(Boolean)
                    .some((value) => value === normalizedRequest || value.includes(normalizedRequest) || normalizedRequest.includes(value)));
            const studyKeys = new Set(studies.map((study) => normalizeStudyFilterValue(study.acronym || study.name)));
            const associatedUsers = users.map((user) => ({
                ...user,
                studies: normalizedRequest === "cnci"
                    ? user.studies
                    : user.studies.filter((study) => studyKeys.has(normalizeStudyFilterValue(study.acronym || study.name)))
            })).filter((user) => user.studies.length);

            return {
                label: request.label,
                concepts: Array.from(request.concepts.values()).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
                studies,
                users: associatedUsers
            };
        });
};

const loadOptInOutWorkbookRows = async () => {
    if (typeof XLSX === "undefined") {
        throw new Error("XLSX library not loaded");
    }

    const response = await fetch(OPT_IN_OUT_DATA_PATH);
    if (!response.ok) throw new Error(`Unable to load ${OPT_IN_OUT_DATA_PATH}`);

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(worksheet, { defval: "" });
};

const getWorkbookStudyEntries = (row) => {
    const studies = [];
    for (let index = 1; index <= 3; index += 1) {
        const name = getCellValue(row, [`Study_${index}`, `study ${index}`]);
        const acronym = getCellValue(row, [`Study_${index} Acronym`, `study ${index} acronym`]);
        const studyName = String(name ?? "").trim();
        const studyAcronym = String(acronym ?? "").trim();
        if (studyName || studyAcronym) {
            studies.push({
                label: `Study ${index}`,
                name: studyName,
                acronym: studyAcronym
            });
        }
    }
    return studies;
};

export const loadOptInOutTable = async () => {
    const container = document.getElementById("optInOutTableContainer");
    if (!container || container.dataset.loaded === "true") return;

    container.innerHTML = `<div class="text-muted"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;
    try {
        const userEmail = JSON.parse(localStorage.parms || "{}").login;
        if (!userEmail) {
            container.innerHTML = "<p class='text-warning'>Please sign in to view this page.</p>";
            return;
        }

        const data = await loadOptInOutWorkbookRows();
        const userRow = (data || []).find((row) => String(getCellValue(row, ["Email", "email"]) ?? "").trim().toLowerCase() === userEmail.toLowerCase());

        if (!userRow) {
            container.innerHTML = "<p class='text-warning'>Your email was not found in the opt-in/out workbook.</p>";
            return;
        }

        const studies = getWorkbookStudyEntries(userRow);
        if (!studies.length) {
            container.innerHTML = "<p class='text-warning'>No studies were found for your account in the opt-in/out workbook.</p>";
            return;
        }

        const csvResponse = await fetch(OPT_IN_OUT_CONCEPTS_CSV_PATH);
        if (!csvResponse.ok) throw new Error(`Unable to load ${OPT_IN_OUT_CONCEPTS_CSV_PATH}`);
        const csvText = await csvResponse.text();
        const conceptRows = csv2Json(csvText).data || [];
        const relevantConcepts = conceptRows.filter((row) => {
            const values = String(row["Requested Consortia/Study"] || row["Requested Consortia"] || row["Requested Consortia/Study"] || "").split(/[;,]/);
            return values.some((value) => String(value).trim().toUpperCase() === "C-NCI");
        });

        const uniqueConceptMap = new Map();
        relevantConcepts.forEach((row) => {
            const conceptName = String(row.Concept || row.concept || row["Concept Name"] || "").trim();
            const boxId = String(getCellValue(row, ["Concept Box ID", "Box ID", "File ID", "fileId"]) || "").trim();
            if (!conceptName) return;
            const conceptKey = conceptName.toLowerCase();
            const previousConcept = uniqueConceptMap.get(conceptKey);
            uniqueConceptMap.set(conceptKey, {
                conceptName,
                boxId: boxId || previousConcept?.boxId || ""
            });
        });
        const uniqueConcepts = Array.from(uniqueConceptMap.values());

        if (!uniqueConcepts.length) {
            container.innerHTML = "<p>No C-NCI concepts were found in the export file.</p>";
            return;
        }

        const tableRows = uniqueConcepts.map((concept, index) => {
            const detailsId = `conceptDetails-${index}`;
            const previewId = `conceptPreview-${index}`;
            const conceptDisplayName = getConceptDisplayName(concept.conceptName);
            const studyCells = studies.map((study) => `
                <td class="text-center" style="min-width: 160px; width: 180px;">
                    <div class="d-flex flex-column align-items-center gap-2">
                        <div class="small fw-semibold text-wrap">${escapeHtml(study.acronym || study.name)}</div>
                        ${getStudyStatusSelect("in")}
                    </div>
                </td>
            `).join("");

            return `
                <tr class="align-middle">
                    <td style="min-width: 240px; max-width: 320px;">
                        <div class="text-wrap">${escapeHtml(conceptDisplayName)}</div>
                    </td>
                    ${studyCells}
                    <td class="text-center" style="width: 60px;">
                        <button class="transparent-btn p-0 concept-preview-toggle" type="button" data-bs-toggle="collapse" data-bs-target="#${detailsId}" aria-expanded="false" aria-controls="${detailsId}" title="Show concept details" data-file-id="${escapeHtml(concept.boxId)}" data-preview-id="${previewId}" data-loaded="false">
                            <i class="fas fa-chevron-down text-muted"></i>
                        </button>
                    </td>
                </tr>
                <tr>
                    <td colspan="5" class="p-0">
                        <div class="collapse" id="${detailsId}">
                            <div class="p-3 bg-light border-top">
                                <div class="fw-semibold mb-2">Concept details</div>
                                <p class="mb-3">${escapeHtml(conceptDisplayName)}</p>
                                <div id="${previewId}" class="mb-3"${concept.boxId ? " style=\"min-height: 220px;\"" : ""}>
                                    ${concept.boxId ? "<div class='text-muted'>Loading preview...</div>" : "<div class='text-muted'>No Concept Box ID is available in the CSV.</div>"}
                                </div>
                                <div class="fw-semibold mb-2">Study names</div>
                                <table class="table table-sm table-bordered mb-0" style="width: auto;">
                                    <thead class="table-light">
                                        <tr><th>Acronym</th><th>Full Name</th></tr>
                                    </thead>
                                    <tbody>
                                        ${studies.map((study) => `<tr><td class="fw-semibold">${escapeHtml(study.acronym || "—")}</td><td>${escapeHtml(study.name || "—")}</td></tr>`).join("")}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        container.innerHTML = `
            <div class="card shadow-sm border-0">
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0" style="table-layout: auto; border-collapse: separate; border-spacing: 0;">
                            <thead class="table-light">
                                <tr>
                                    <th scope="col" style="min-width: 240px; max-width: 320px;">Concept Name</th>
                                    <th scope="col" class="text-center" style="min-width: 160px; width: 180px;">Study 1</th>
                                    <th scope="col" class="text-center" style="min-width: 160px; width: 180px;">Study 2</th>
                                    <th scope="col" class="text-center" style="min-width: 160px; width: 180px;">Study 3</th>
                                    <th scope="col" style="width: 60px;"></th>
                                </tr>
                            </thead>
                            <tbody>${tableRows}</tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="mt-3 d-flex justify-content-end">
                <button type="button" id="optInOutSubmitBtn" class="btn btn-primary" disabled title="Submission functionality coming soon">
                    Submit Opt-In/Opt-Out Selections
                </button>
            </div>
            <div id="optInOutSubmitBtnFloating" style="position: fixed; bottom: 2rem; right: 2rem; z-index: 1050; display: none;">
                <button type="button" class="btn btn-primary shadow" disabled title="Submission functionality coming soon">
                    Submit Opt-In/Opt-Out Selections
                </button>
            </div>
        `;

        container.querySelectorAll('.study-status-select').forEach((select) => {
            select.addEventListener('change', () => {
                const isOut = select.value === 'out';
                select.classList.toggle('border-danger', isOut);
                select.classList.toggle('text-danger', isOut);
                select.classList.toggle('border-success', !isOut);
                select.classList.toggle('text-success', !isOut);
                select.style.backgroundColor = isOut ? '#f8d7da' : '#d1e7dd';
                select.style.color = isOut ? '#842029' : '#0f5132';
            });
        });

        container.querySelectorAll('.concept-preview-toggle').forEach((button) => {
            button.addEventListener('click', () => {
                if (!button.dataset.fileId || button.dataset.loaded === 'true') return;
                const previewElement = document.getElementById(button.dataset.previewId);
                const detailsElement = document.getElementById(button.getAttribute('aria-controls'));
                if (!previewElement || !detailsElement) return;

                const loadPreview = () => {
                    if (button.dataset.loaded === 'true') return;
                    try {
                        previewElement.innerHTML = "";
                        showPreview(button.dataset.fileId, button.dataset.previewId);
                        button.dataset.loaded = 'true';
                    } catch (error) {
                        console.error("Unable to preview concept file:", error);
                        previewElement.innerHTML = "<div class='text-danger'>Unable to preview concept file.</div>";
                    }
                };

                if (detailsElement.classList.contains('show')) loadPreview();
                else detailsElement.addEventListener('shown.bs.collapse', loadPreview, { once: true });
            });
        });

        container.dataset.loaded = "true";

        const staticBtn = document.getElementById("optInOutSubmitBtn");
        const floatingBtn = document.getElementById("optInOutSubmitBtnFloating");
        if (staticBtn && floatingBtn) {
            const onScroll = () => {
                const rect = staticBtn.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
                floatingBtn.style.display = isVisible ? "none" : "block";
            };
            window.addEventListener("scroll", onScroll);
            onScroll();
        }
    } catch (error) {
        console.error("Error loading opt-in/opt-out concept data:", error);
        container.innerHTML = "<p class='text-danger'>Error loading opt-in/opt-out concept data.</p>";
    }
};

export const optInOutTemplate = () => {
    return `
        <div class="general-bg padding-bottom-1rem">
            <div class="container body-min-height">
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">Opt-In Opt-Out</h1>
                    </div>
                </div>
                <div class="data-submission div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem;">
                    <div id="optInOutTableContainer">Loading...</div>
                </div>
            </div>
        </div>
    `;
};

export const studyAccessAdminTemplate = () => {
    return `
        <div class="general-bg padding-bottom-1rem">
            <div class="container body-min-height">
                <div class="main-summary-row d-flex justify-content-between align-items-center">
                    <div class="align-left">
                        <h1 class="page-header">Study Access Admin</h1>
                    </div>
                    <div class="align-right">
                        <button type="button" id="exportConsortiaCsvBtn" class="buttonsubmit button-glow-red">
                            <span class="buttonsubmit__text">Export Consortia CSV</span>
                        </button>
                    </div>
                </div>
                <div class="data-submission div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem;">
                    <p class="mb-3">Expand a requested consortia/study to review its concepts by individual study. All selections currently default to Opt-In; expand a concept name to see its users and associated studies.</p>
                    <div id="studyAccessAdminTableContainer">Loading...</div>
                </div>
            </div>
        </div>
    `;
};

export const loadStudyAccessAdminTable = async () => {
    const container = document.getElementById("studyAccessAdminTableContainer");
    if (!container || container.dataset.loaded === "true") return;

    container.innerHTML = `<div class="text-muted"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;
    try {
        const userEmail = JSON.parse(localStorage.parms || "{}").login;
        if (!userEmail) {
            container.innerHTML = "<p class='text-warning'>Please sign in to view this page.</p>";
            return;
        }

        const userForAuth = emailsAllowedToUpdateData.includes(userEmail);
        if (!userForAuth) {
            container.innerHTML = "<p class='text-warning'>You do not have access to this admin page.</p>";
            return;
        }

        const exportButton = document.getElementById("exportConsortiaCsvBtn");
        if (exportButton && exportButton.dataset.bound !== "true") {
            exportButton.dataset.bound = "true";
            exportButton.addEventListener("click", async () => {
                const buttonText = exportButton.querySelector(".buttonsubmit__text");
                exportButton.disabled = true;
                exportButton.classList.add("buttonsubmit--loading");
                if (buttonText) buttonText.textContent = "Exporting...";
                try {
                    await exportAdminConsortiaCsv();
                } catch (error) {
                    console.error("Unable to export consortia CSV:", error);
                    alert("Unable to export the consortia CSV from Box.");
                } finally {
                    exportButton.disabled = false;
                    exportButton.classList.remove("buttonsubmit--loading");
                    if (buttonText) buttonText.textContent = "Export Consortia CSV";
                }
            });
        }

        const requestedStudies = await loadStudyAccessAdminRows();
        if (!requestedStudies.length) {
            container.innerHTML = "<p class='text-warning'>No requested consortia or study values were found.</p>";
            return;
        }

        const rows = requestedStudies.map((request, requestIndex) => {
            const studies = request.studies || [];
            const concepts = request.concepts || [];
            const users = request.users || [];
            const requestDetailsId = `studyAccessRequest-${requestIndex}`;
            const conceptColumnCount = Math.max(1, studies.length + 1);

            const studyHeaders = studies.map((study) => `
                <th scope="col" class="text-center align-middle" style="min-width: 130px;" title="${escapeHtml(study.name || study.acronym)}">
                    <div class="small fw-semibold text-wrap">${escapeHtml(study.acronym || study.name)}</div>
                </th>
            `).join("");

            const userRows = users.map((user) => `
                <tr>
                    <td>
                        <div class="fw-semibold">${escapeHtml(user.name)}</div>
                        ${user.email ? `<div class="small text-muted">${escapeHtml(user.email)}</div>` : ""}
                    </td>
                    <td>${user.studies.map((study) => `
                        <div>${escapeHtml(study.acronym || study.name)}${study.acronym && study.name ? ` <span class="text-muted">&mdash; ${escapeHtml(study.name)}</span>` : ""}</div>
                    `).join("")}</td>
                </tr>
            `).join("");

            const conceptRows = concepts.map((concept, conceptIndex) => {
                const conceptName = concept.name;
                const conceptDisplayName = getConceptDisplayName(conceptName);
                const conceptBoxId = concept.boxId;
                const conceptDetailsId = `studyAccessConcept-${requestIndex}-${conceptIndex}`;
                const statusCells = studies.map((study) => `
                    <td class="text-center align-middle" data-study="${escapeHtml(study.acronym || study.name)}">
                        <div class="d-flex justify-content-center">${getStudyStatusSelect("in")}</div>
                    </td>
                `).join("");

                return `
                    <tr class="align-middle">
                        <td style="min-width: 300px; max-width: 440px;">
                            <div class="d-flex align-items-start gap-2">
                                <button class="btn btn-link p-0 text-start text-decoration-none concept-user-toggle flex-grow-1" type="button" data-bs-toggle="collapse" data-bs-target="#${conceptDetailsId}" aria-expanded="false" aria-controls="${conceptDetailsId}">
                                    <i class="fas fa-chevron-down text-muted me-2"></i><span class="text-wrap">${escapeHtml(conceptDisplayName)}</span>
                                </button>
                                <button class="btn btn-sm custom-btn study-concept-preview flex-shrink-0" type="button" data-file-id="${escapeHtml(conceptBoxId)}" title="${conceptBoxId ? "Preview concept" : "Concept Box ID is not available"}" aria-label="Preview ${escapeHtml(conceptDisplayName)}" ${conceptBoxId ? "" : "disabled"}>
                                    <i class="fas fa-external-link-alt"></i>
                                </button>
                            </div>
                        </td>
                        ${statusCells}
                    </tr>
                    <tr class="bg-light">
                        <td colspan="${conceptColumnCount}" class="p-0">
                            <div class="collapse" id="${conceptDetailsId}">
                                <div class="p-3 border-top border-bottom">
                                    <div class="fw-semibold mb-2">Users and associated studies</div>
                                    ${userRows ? `
                                        <div class="table-responsive">
                                            <table class="table table-sm table-bordered bg-white mb-0">
                                                <thead class="table-light"><tr><th scope="col" style="min-width: 220px;">User</th><th scope="col">Associated study/studies</th></tr></thead>
                                                <tbody>${userRows}</tbody>
                                            </table>
                                        </div>
                                    ` : '<p class="text-muted mb-0">No user-to-study associations are available for this requested group.</p>'}
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");

            const matrixMarkup = studies.length ? `
                <div class="table-responsive">
                    <table class="table table-bordered table-hover align-middle mb-0" style="width: max-content; min-width: 100%;">
                        <thead class="table-light">
                            <tr>
                                <th scope="col" style="min-width: 300px; max-width: 440px;">Concept Name</th>
                                ${studyHeaders}
                            </tr>
                        </thead>
                        <tbody>${conceptRows}</tbody>
                    </table>
                </div>
            ` : `
                <div class="p-3">
                    <p class="text-muted mb-3">No individual study mappings are currently available for this requested group.</p>
                    <table class="table table-bordered table-hover mb-0">
                        <thead class="table-light"><tr><th scope="col">Concept Name</th></tr></thead>
                        <tbody>${conceptRows}</tbody>
                    </table>
                </div>
            `;

            return `
                <tr class="align-middle study-access-main-row" data-study-label="${escapeHtml(request.label)}">
                    <td class="fw-semibold">
                        <button class="btn btn-link btn-sm p-0 text-decoration-none fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#${requestDetailsId}" aria-expanded="false" aria-controls="${requestDetailsId}">
                            <i class="fas fa-chevron-down text-muted me-2"></i>${escapeHtml(request.label)}
                        </button>
                    </td>
                    <td class="text-center">${concepts.length}</td>
                    <td class="text-center">${studies.length}</td>
                </tr>
                <tr class="study-access-detail-row">
                    <td colspan="3" class="p-0">
                        <div class="collapse" id="${requestDetailsId}">${matrixMarkup}</div>
                    </td>
                </tr>
            `;
        }).join("");

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th scope="col">
                                <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none fw-semibold" id="studyAccessSortToggle" data-sort-direction="asc">
                                    Requested Consortia/Study <i class="fas fa-sort ms-1"></i>
                                </button>
                            </th>
                            <th scope="col" class="text-center">Concepts</th>
                            <th scope="col" class="text-center">Individual Studies</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
        const sortToggle = document.getElementById("studyAccessSortToggle");
        const tableBody = container.querySelector("tbody");
        if (sortToggle && tableBody) {
            sortToggle.addEventListener("click", () => {
                const direction = sortToggle.dataset.sortDirection === "asc" ? "desc" : "asc";
                sortToggle.dataset.sortDirection = direction;
                const mainRows = Array.from(tableBody.querySelectorAll(".study-access-main-row"));
                const detailRows = Array.from(tableBody.querySelectorAll(".study-access-detail-row"));
                const pairs = mainRows.map((row, index) => ({ main: row, detail: detailRows[index] })).filter((pair) => pair.main && pair.detail);
                pairs.sort((a, b) => {
                    const left = a.main.dataset.studyLabel || "";
                    const right = b.main.dataset.studyLabel || "";
                    return direction === "asc"
                        ? left.localeCompare(right, undefined, { sensitivity: "base" })
                        : right.localeCompare(left, undefined, { sensitivity: "base" });
                });
                pairs.forEach(({ main, detail }) => {
                    tableBody.appendChild(main);
                    tableBody.appendChild(detail);
                });
            });
        }

        container.querySelectorAll(".study-status-select").forEach((select) => {
            select.addEventListener("change", () => {
                const isOut = select.value === "out";
                select.classList.toggle("border-danger", isOut);
                select.classList.toggle("text-danger", isOut);
                select.classList.toggle("border-success", !isOut);
                select.classList.toggle("text-success", !isOut);
                select.style.backgroundColor = isOut ? "#f8d7da" : "#d1e7dd";
                select.style.color = isOut ? "#842029" : "#0f5132";
            });
        });

        container.querySelectorAll(".study-concept-preview").forEach((button) => {
            button.addEventListener("click", () => {
                const modal = document.getElementById("confluencePreviewerModal");
                const header = document.getElementById("confluencePreviewerModalHeader");
                const body = document.getElementById("confluencePreviewerModalBody");
                if (!modal || !header || !body) return;

                header.innerHTML = '<h5 class="modal-title">Concept preview</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>';
                body.innerHTML = "";

                bootstrap.Modal.getOrCreateInstance(modal).show();

                try {
                    showPreview(button.dataset.fileId, "confluencePreviewerModalBody");
                } catch (error) {
                    console.error("Unable to load concept preview:", error);
                    body.innerHTML = '<p class="text-danger mb-0">Unable to load the concept preview from Box.</p>';
                }
            });
        });
        container.dataset.loaded = "true";
    } catch (error) {
        console.error("Error loading study access admin table:", error);
        container.innerHTML = "<p class='text-danger'>Error loading study access admin table.</p>";
    }
};
