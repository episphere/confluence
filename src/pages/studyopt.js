import { showPreview } from "../components/boxPreview.js";
import { csv2Json, getAllFilesRecursive, emailsAllowedToUpdateData, submitterFolder, completedFolder, acceptedFolder, archivedFolder } from "../shared.js";

const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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
        const requestedStudy = String(row["Requested Consortia/Study"] || row["Requested Consortia"] || row["Requested Consortia/Study"] || "").trim();
        if (!requestedStudy) return;

        const existing = requestedStudyMap.get(requestedStudy) || { label: requestedStudy, conceptCount: 0 };
        existing.conceptCount += 1;
        requestedStudyMap.set(requestedStudy, existing);
    });

    const requestedStudies = Array.from(requestedStudyMap.values()).sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

    return requestedStudies.map((study) => {
        const normalizedRequestedStudy = normalizeStudyFilterValue(study.label);
        const shouldShowUsers = normalizedRequestedStudy === "cnci";

        const matchingUsers = shouldShowUsers ? workbookRows.filter((row) => {
            const name = String(getCellValue(row, ["Name", "name"]) ?? "").trim();
            const email = String(getCellValue(row, ["Email", "email"]) ?? "").trim();
            return Boolean(name || email);
        }) : [];

        return {
            ...study,
            users: matchingUsers
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

const getConceptFileMatch = async (conceptName) => {
    const candidateNames = [
        conceptName,
        String(conceptName ?? "").replace(/\.docx?$/i, ""),
        String(conceptName ?? "").replace(/_\d{4}-\d{2}-\d{2}(?:\.docx?)?$/i, "")
    ].filter(Boolean);

    const searchFolders = [submitterFolder, completedFolder, acceptedFolder, archivedFolder].filter(Boolean);
    for (const folderId of searchFolders) {
        const files = await getAllFilesRecursive(folderId, "name,type,id,parent,created_at");
        for (const candidateName of candidateNames) {
            const match = files.find((file) => file && file.name && (
                file.name === candidateName ||
                file.name.toLowerCase() === `${candidateName}`.toLowerCase() ||
                file.name.toLowerCase().includes(candidateName.toLowerCase())
            ));
            if (match) return match;
        }
    }
    return null;
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

        const uniqueConcepts = [];
        const seenConcepts = new Set();
        relevantConcepts.forEach((row) => {
            const conceptName = String(row.Concept || row.concept || row["Concept Name"] || "").trim();
            if (!conceptName || seenConcepts.has(conceptName)) return;
            seenConcepts.add(conceptName);
            uniqueConcepts.push({ conceptName });
        });

        if (!uniqueConcepts.length) {
            container.innerHTML = "<p>No C-NCI concepts were found in the export file.</p>";
            return;
        }

        // TODO: Re-enable file matching once Box folder access is optimized
        // const conceptRowsWithFiles = await Promise.all(uniqueConcepts.map(async (concept) => {
        //     const fileMatch = await getConceptFileMatch(concept.conceptName);
        //     return { ...concept, fileMatch };
        // }));
        const conceptRowsWithFiles = uniqueConcepts.map((concept) => ({ ...concept, fileMatch: null }));

        const tableRows = conceptRowsWithFiles.map((concept, index) => {
            const detailsId = `conceptDetails-${index}`;
            const previewId = `conceptPreview-${index}`;
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
                        <div class="text-wrap">${escapeHtml(concept.conceptName)}</div>
                    </td>
                    ${studyCells}
                    <td class="text-center" style="width: 60px;">
                        <button class="transparent-btn p-0 concept-preview-toggle" type="button" data-bs-toggle="collapse" data-bs-target="#${detailsId}" aria-expanded="false" aria-controls="${detailsId}" title="Show concept details" data-file-id="${concept.fileMatch ? concept.fileMatch.id : ""}" data-preview-id="${previewId}" data-loaded="false">
                            <i class="fas fa-chevron-down text-muted"></i>
                        </button>
                    </td>
                </tr>
                <tr>
                    <td colspan="5" class="p-0">
                        <div class="collapse" id="${detailsId}">
                            <div class="p-3 bg-light border-top">
                                <div class="fw-semibold mb-2">Concept details</div>
                                <p class="mb-3">${escapeHtml(concept.conceptName)}</p>
                                <div id="${previewId}" class="mb-3"${concept.fileMatch ? " style=\"min-height: 220px;\"" : ""}>
                                    ${concept.fileMatch ? "<div class='text-muted'>Loading preview...</div>" : "<div class='text-muted'>No concept file preview is available.</div>"}
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
                if (!previewElement) return;
                try {
                    showPreview(button.dataset.fileId, button.dataset.previewId);
                    button.dataset.loaded = 'true';
                } catch (error) {
                    console.error("Unable to preview concept file:", error);
                    previewElement.innerHTML = "<div class='text-danger'>Unable to preview concept file.</div>";
                }
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
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">Study Access Admin</h1>
                    </div>
                </div>
                <div class="data-submission div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem;">
                    <p class="mb-3">This table lists every requested consortia/study from the admin request export and expands to show the opt-in/out users from the workbook.</p>
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

        const requestedStudies = await loadStudyAccessAdminRows();
        if (!requestedStudies.length) {
            container.innerHTML = "<p class='text-warning'>No requested consortia or study values were found.</p>";
            return;
        }

        const rows = requestedStudies.map((study, index) => {
            const users = study.users || [];
            const usersLabel = `${users.length} user${users.length === 1 ? "" : "s"}`;
            const userRows = users.map((row) => {
                const studyEntries = getWorkbookStudyEntries(row);
                const userName = String(row.Name || row.name || "Unnamed user").trim();
                const userEmailValue = String(row.Email || row.email || "").trim();
                const studyEntriesMarkup = studyEntries.length ? (() => {
                    const studyCells = studyEntries.map((entry) => {
                        const normalizedRequestedStudy = normalizeStudyFilterValue(study.label);
                        const hasMatchingStudy = [entry.name, entry.acronym]
                            .map((value) => normalizeStudyFilterValue(value))
                            .filter(Boolean)
                            .some((value) => value === normalizedRequestedStudy || normalizedRequestedStudy.includes(value) || value.includes(normalizedRequestedStudy));
                        const statusValue = hasMatchingStudy ? "in" : "in";
                        return `
                            <div class="col-12 col-md-4">
                                <div class="d-flex flex-column gap-2 py-2 px-3 border rounded bg-white h-100">
                                    <div class="small text-muted">
                                        <div class="fw-semibold text-dark">${escapeHtml(entry.acronym || entry.name || "Study")}</div>
                                        <div class="text-wrap">${escapeHtml(entry.name || entry.acronym || "")}</div>
                                    </div>
                                    <div class="mt-auto">
                                        ${getStudyStatusSelect(statusValue)}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join("");

                    const placeholderCount = Math.max(0, 3 - studyEntries.length);
                    const placeholders = Array.from({ length: placeholderCount }, () => '<div class="col-12 col-md-4"></div>').join("");

                    return `<div class="row g-2">${studyCells}${placeholders}</div>`;
                })() : '<div class="text-muted small px-3 py-2 border rounded bg-white">No study entries available.</div>';
                return `
                    <li class="list-group-item border-0 px-0 py-3">
                        <div class="rounded border bg-light p-3">
                            <div class="fw-semibold">${escapeHtml(userName)}</div>
                            <div class="small text-muted">${escapeHtml(userEmailValue)}</div>
                            <div class="mt-3">
                                <div class="small fw-semibold text-uppercase text-muted mb-2">Study Data</div>
                                <div class="d-flex flex-column gap-2">${studyEntriesMarkup}</div>
                            </div>
                        </div>
                    </li>
                `;
            }).join("");

            return `
                <tr class="align-middle study-access-main-row" data-study-label="${escapeHtml(study.label)}">
                    <td class="fw-semibold">${escapeHtml(study.label)}</td>
                    <td class="text-center">${study.conceptCount}</td>
                    <td class="text-center">
                        <button class="btn btn-link btn-sm p-0" type="button" data-bs-toggle="collapse" data-bs-target="#studyUsers-${index}" aria-expanded="false" aria-controls="studyUsers-${index}">
                            ${usersLabel}
                        </button>
                    </td>
                </tr>
                <tr class="study-access-detail-row">
                    <td colspan="3" class="p-0">
                        <div class="collapse" id="studyUsers-${index}">
                            <div class="p-3 bg-light border-top">
                                <div class="fw-semibold mb-3">Opt-in/opt-out users</div>
                                ${userRows ? `<div class="d-flex flex-column gap-3">${userRows}</div>` : '<p class="text-muted mb-0">No users were found for this requested value.</p>'}
                            </div>
                        </div>
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
                            <th scope="col" class="text-center">Concept Count</th>
                            <th scope="col" class="text-center">Users</th>
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
        container.dataset.loaded = "true";
    } catch (error) {
        console.error("Error loading study access admin table:", error);
        container.innerHTML = "<p class='text-danger'>Error loading study access admin table.</p>";
    }
};
