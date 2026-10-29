import { showPreview } from "../components/boxPreview.js";
import { renderAdminPageTabs } from "../components/adminNavigation.js";
import { dataManagersInfo, emailsAllowedToUpdateData, extractContactInvestigators, readDocFile, getConceptIdFromFileName, getRoundNumberFromFileName, removeRoundSuffixFromFileName, studiesInfo, getFile, studyDescriptions } from "../shared.js";
import { loadDemoOptInOutAssignments, loadOptInOutAssignments, provisionDemoOptInOutRound, provisionOptInOutRound, saveOptInOutSelections, loadStudyAccessAssignments, saveStudyAccessSelection } from "../optInOutStore.js";
import { exportAdminConsortiaCsv, loadAcceptedAdminConceptRounds, syncCurrentDataManagerChairRequests } from "./chairmenu.js";

const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getConceptDisplayName = (value) => removeRoundSuffixFromFileName(value)
    .replace(/_\d{4}-\d{2}-\d{2}\.docx?$/i, "");

const getAssignedConceptId = (value) => getConceptIdFromFileName(value) || "--";
const compareConceptIds = (left, right) => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }).compare(left, right);

const OPT_IN_OUT_DATA_PATH = "./src/data/DataPlatform-Out-in-out.xlsx";


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

const normalizeStudyFilterValue = (value) => String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");

const getStudyAccessStatusSelect = assignment => {
    if (!assignment) return '<span class="text-muted">Not assigned</span>';
    if (assignment.load_error || !assignment.selection_file_id) return `<span class="text-danger" title="${escapeHtml(assignment.load_error || "No selection file")}">Unavailable</span>`;
    const value = assignment.decision;
    const color = value === "opt_out" ? "danger" : value === "opt_in" ? "success" : "secondary";
    return `<select class="form-select form-select-sm study-status-select border-${color} text-${color}" data-selection-file-id="${escapeHtml(assignment.selection_file_id)}" style="min-width: 110px;" aria-label="Study status">
        ${value === "pending" ? '<option value="pending" selected disabled>Pending</option>' : ''}
        <option value="opt_in" ${value === "opt_in" ? "selected" : ""}>Opt-In</option>
        <option value="opt_out" ${value === "opt_out" ? "selected" : ""}>Opt-Out</option>
    </select>`;
};

const confirmStudyAccessChange = (select, container, managerView, assignmentsById) => {
    const decision = select.value;
    const previous = select.dataset.previousValue;
    select.value = previous;
    if (decision === previous) return;
    const assignment = assignmentsById.get(select.dataset.selectionFileId);
    if (!assignment) return;
    const consortium = assignment.consortium_id;
    const study = assignment.study_acronym || assignment.study_id;
    const conceptBoxId = assignment.concept_box_id;
    const user = JSON.parse(localStorage.parms || "{}");
    const isManager = dataManagersInfo.some(manager => manager.email.toLowerCase() === String(user.login).toLowerCase()
        && normalizeStudyFilterValue(manager.consortium) === normalizeStudyFilterValue(consortium));
    if (managerView ? !isManager : !emailsAllowedToUpdateData.includes(user.login)) return;
    const modalElement = document.getElementById("confluenceMainModal");
    const header = document.getElementById("confluenceModalHeader");
    const body = document.getElementById("confluenceModalBody");
    if (!modalElement || !header || !body) return;
    header.innerHTML = '<h5 class="modal-title">Confirm Opt-In/Out Change</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>';
    body.innerHTML = `<form id="studyDecisionChangeForm">
        <p class="text-muted">Concept: ${escapeHtml(select.closest("tr")?.querySelector(".concept-user-toggle")?.textContent?.trim() || conceptBoxId)}</p>
        <p>Round: ${escapeHtml(assignment.round_name)}</p>
        <p>Change <strong>${escapeHtml(study)}</strong> (${escapeHtml(consortium)}) from <strong>${previous === "pending" ? "Pending" : previous === "opt_out" ? "Opt-Out" : "Opt-In"}</strong> to <strong>${decision === "opt_out" ? "Opt-Out" : "Opt-In"}</strong>?</p>
        <label for="studyDecisionReason" class="form-label">Reason for change (recorded in Box)</label>
        <textarea id="studyDecisionReason" class="form-control" rows="3" required></textarea>
        <div id="studyDecisionStatus" class="mt-3" role="status"></div>
        <div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button><button type="submit" class="btn btn-primary">Update Opt-In/Out</button></div>
    </form>`;
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
    body.querySelector("form").addEventListener("submit", async event => {
        event.preventDefault();
        const reasonInput = body.querySelector("textarea");
        const reason = reasonInput.value.trim();
        if (!reason) { reasonInput.value = ""; reasonInput.reportValidity(); return; }
        const buttons = modalElement.querySelectorAll("button");
        const status = body.querySelector("#studyDecisionStatus");
        const preventDismiss = event => event.preventDefault();
        modalElement.addEventListener("hide.bs.modal", preventDismiss);
        buttons.forEach(button => { button.disabled = true; });
        status.textContent = "Saving change to Box...";
        try {
            const result = await saveStudyAccessSelection({ assignment, decision, reason, managerView });
            assignmentsById.set(select.dataset.selectionFileId, result.updated);
            container.querySelectorAll(".study-status-select").forEach(control => {
                if (control.dataset.selectionFileId !== select.dataset.selectionFileId) return;
                control.value = decision;
                control.dataset.previousValue = decision;
                control.classList.remove("border-secondary", "text-secondary");
                const isOut = decision === "opt_out";
                control.classList.toggle("border-danger", isOut);
                control.classList.toggle("text-danger", isOut);
                control.classList.toggle("border-success", !isOut);
                control.classList.toggle("text-success", !isOut);
                control.style.backgroundColor = isOut ? "#f8d7da" : "#d1e7dd";
                control.style.color = isOut ? "#842029" : "#0f5132";
            });
            const notice = container.querySelector("#studyAccessSaveStatus");
            if (notice) {
                notice.className = result.warning ? "alert alert-warning" : "alert alert-success";
                notice.textContent = result.warning || "The selection and reason were saved in Box.";
            }
            modalElement.removeEventListener("hide.bs.modal", preventDismiss);
            modal.hide();
        } catch (error) {
            status.className = "alert alert-danger mt-3";
            status.textContent = error.message || "Unable to save the change.";
        } finally {
            modalElement.removeEventListener("hide.bs.modal", preventDismiss);
            buttons.forEach(button => { button.disabled = false; });
        }
    });
};

const studyAccessStudyKey = study => normalizeStudyFilterValue(study.study_id || study.study_acronym || study.acronym || study.name);

const loadStudyAccessAdminRows = async (managerView = false) => {
    const assignments = await loadStudyAccessAssignments(managerView);
    const requests = new Map();
    assignments.forEach(assignment => {
        const consortium = assignment.consortium_id;
        const key = normalizeStudyFilterValue(consortium);
        if (!requests.has(key)) requests.set(key, { label: consortium, studies: new Map(), concepts: new Map(), users: [] });
        const request = requests.get(key);
        const studyKey = studyAccessStudyKey(assignment);
        request.studies.set(studyKey, { study_id: assignment.study_id, acronym: assignment.study_acronym || assignment.study_id, name: assignment.study_name, consortium });
        const conceptKey = JSON.stringify([assignment.round_id, assignment.concept_box_id]);
        if (!request.concepts.has(conceptKey)) request.concepts.set(conceptKey, {
            name: assignment.concept_file_name || assignment.concept_title,
            boxId: assignment.concept_box_id, roundId: assignment.round_id,
            roundName: assignment.round_name, roundNumber: getRoundNumberFromFileName(assignment.round_name || ""),
            assignments: new Map()
        });
        request.concepts.get(conceptKey).assignments.set(studyKey, assignment);
    });
    let users = [];
    try {
        users = (await loadOptInOutWorkbookRows()).map(row => ({
            name: String(getCellValue(row, ["Name"]) || "Unnamed user"),
            email: String(getCellValue(row, ["Email"]) || ""), studies: getWorkbookStudyEntries(row)
        }));
    } catch (error) {
        console.warn("Unable to load optional study contact roster:", error);
    }
    const conceptsById = new Map();
    requests.forEach(request => {
        request.users = users.map(user => ({ ...user, studies: user.studies.filter(study => request.studies.has(studyAccessStudyKey(study))) })).filter(user => user.studies.length);
        request.concepts.forEach(concept => {
            if (!conceptsById.has(concept.boxId)) conceptsById.set(concept.boxId, []);
            conceptsById.get(concept.boxId).push(concept);
        });
    });
    const conceptIds = [...conceptsById.keys()].filter(Boolean);
    for (let index = 0; index < conceptIds.length; index += 10) {
        await Promise.all(conceptIds.slice(index, index + 10).map(async id => {
            try {
                const investigators = extractContactInvestigators(await readDocFile(id)) || "";
                conceptsById.get(id).forEach(concept => { concept.investigators = investigators; });
            } catch (error) {
                console.warn(`Unable to load investigators for ${id}:`, error);
            }
        }));
    }
    return Array.from(requests.values()).sort((a, b) => a.label.localeCompare(b.label)).map(request => ({
        ...request,
        studies: Array.from(request.studies.values()).sort((a, b) => (a.acronym || a.name).localeCompare(b.acronym || b.name)),
        concepts: Array.from(request.concepts.values()).sort((a, b) => (a.roundName + a.name).localeCompare(b.roundName + b.name))
    }));
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

const getSavedStudyStatusSelect = (assignment) => {
    const decision = ["opt_in", "opt_out"].includes(assignment.decision) ? assignment.decision : "pending";
    return `
        <select class="form-select form-select-sm saved-study-status-select" data-selection-file-id="${escapeHtml(assignment.selectionFileId)}" data-original-value="${decision}" aria-label="Opt-In or Opt-Out selection">
            <option value="pending" ${decision === "pending" ? "selected" : ""} disabled>Choose...</option>
            <option value="opt_in" ${decision === "opt_in" ? "selected" : ""}>Opt-In</option>
            <option value="opt_out" ${decision === "opt_out" ? "selected" : ""}>Opt-Out</option>
        </select>
    `;
};

const updateStudyStatusStyle = (select) => {
    const isOut = select.value === "opt_out";
    const isIn = select.value === "opt_in";
    select.classList.toggle("border-danger", isOut);
    select.classList.toggle("text-danger", isOut);
    select.classList.toggle("border-success", isIn);
    select.classList.toggle("text-success", isIn);
    select.style.backgroundColor = isOut ? "#f8d7da" : isIn ? "#d1e7dd" : "";
    select.style.color = isOut ? "#842029" : isIn ? "#0f5132" : "";
};

const getChangedOptInOutSelections = (container) => Array.from(container.querySelectorAll(".saved-study-status-select"))
    .filter(select => select.value !== "pending" && select.value !== select.dataset.originalValue)
    .map(select => ({ selectionFileId: select.dataset.selectionFileId, decision: select.value, select }));

const updateOptInOutSubmitButtons = (container) => {
    const disabled = getChangedOptInOutSelections(container).length === 0;
    container.querySelectorAll(".opt-in-out-submit-action").forEach(button => { button.disabled = disabled; });
};

const openOptInOutSubmitModal = (container, user) => {
    const changes = getChangedOptInOutSelections(container);
    if (!changes.length) return;
    const modalElement = document.getElementById("confluenceMainModal");
    const header = document.getElementById("confluenceModalHeader");
    const body = document.getElementById("confluenceModalBody");
    if (!modalElement || !header || !body) return;

    header.innerHTML = '<h5 class="modal-title">Submit Opt-In/Opt-Out Selections</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>';
    body.innerHTML = `
        <form id="submitOptInOutSelectionsForm">
            <p>Submit ${changes.length} changed selection${changes.length === 1 ? "" : "s"} to Box?</p>
            <div class="alert alert-warning">These selections apply to the study, including any other representatives associated with it.</div>
            <div id="optInOutSubmissionStatus" class="alert d-none" role="alert"></div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-outline-primary">Submit Selections</button>
            </div>
        </form>
    `;
    bootstrap.Modal.getOrCreateInstance(modalElement).show();

    document.getElementById("submitOptInOutSelectionsForm").addEventListener("submit", async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const submitButton = form.querySelector('button[type="submit"]');
        const status = document.getElementById("optInOutSubmissionStatus");
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
        try {
            const pendingChanges = getChangedOptInOutSelections(container);
            const result = await saveOptInOutSelections(pendingChanges, user);
            result.saved.forEach(saved => {
                saved.select.dataset.originalValue = saved.decision;
                const savedStatus = saved.select.closest("tr")?.querySelector(".saved-selection-status");
                if (savedStatus) savedStatus.textContent = `Saved by ${user.email || user.name}`;
            });
            updateOptInOutSubmitButtons(container);
            if (result.failed.length) {
                status.className = "alert alert-warning";
                status.textContent = `${result.saved.length} selection(s) saved. ${result.failed.length} failed and can be retried.`;
                submitButton.disabled = false;
                submitButton.textContent = "Retry Failed Selections";
            } else {
                status.className = "alert alert-success";
                status.textContent = "Your Opt-In/Opt-Out selections were saved in Box.";
                submitButton.remove();
                const closeButton = form.querySelector('[data-bs-dismiss="modal"]');
                if (closeButton) closeButton.textContent = "Close";
            }
        } catch (error) {
            console.error("Unable to submit Opt-In/Opt-Out selections:", error);
            status.className = "alert alert-danger";
            status.textContent = "Unable to save the selections in Box. Please try again.";
            submitButton.disabled = false;
            submitButton.textContent = "Submit Selections";
        }
    });
};

export const loadOptInOutTable = async () => {
    const container = document.getElementById("optInOutTableContainer");
    if (!container || container.dataset.loaded === "true") return;
    container.innerHTML = '<div class="text-muted"><i class="fas fa-spinner fa-spin"></i> Loading selections from Box...</div>';

    try {
        const userEmail = String(JSON.parse(localStorage.parms || "{}").login || "").trim();
        if (!userEmail) {
            container.innerHTML = "<p class='text-warning'>Please sign in to view this page.</p>";
            return;
        }
        const isAdmin = emailsAllowedToUpdateData.includes(userEmail);
        const workbookRows = await loadOptInOutWorkbookRows();
        const userRow = workbookRows.find(row => String(getCellValue(row, ["Email", "email"])).trim().toLowerCase() === userEmail.toLowerCase());
        if (!userRow && !isAdmin) {
            container.innerHTML = "<p class='text-warning'>Your email was not found in the study access roster.</p>";
            return;
        }
        const studies = userRow ? getWorkbookStudyEntries(userRow) : [];
        const [productionAssignments, demoAssignments] = await Promise.all([
            studies.length ? loadOptInOutAssignments(studies) : Promise.resolve([]),
            isAdmin ? loadDemoOptInOutAssignments() : Promise.resolve([])
        ]);
        const assignments = [...demoAssignments, ...productionAssignments];
        if (!assignments.length) {
            container.innerHTML = "<p class='text-warning'>No open Opt-In/Opt-Out assignments were found for your studies. An administrator may need to initiate the round first.</p>";
            return;
        }

        assignments.sort((a, b) => `${a.round_name}|${a.concept_title}|${a.study_acronym}`.localeCompare(`${b.round_name}|${b.concept_title}|${b.study_acronym}`, undefined, { sensitivity: "base" }));
        const rows = assignments.map(assignment => `
            <tr class="align-middle saved-assignment-row" data-concept-id="${escapeHtml(getAssignedConceptId(assignment.concept_file_name || assignment.concept_title))}">
                <td class="text-nowrap">${assignment.is_demo === "true" ? '<span class="badge bg-info text-dark me-2">Demo</span>' : ""}${escapeHtml(getAssignedConceptId(assignment.concept_file_name || assignment.concept_title))}</td>
                <td>
                    <div class="d-flex align-items-start gap-2">
                        <span class="flex-grow-1 text-wrap">${escapeHtml(getConceptDisplayName(assignment.concept_title))}</span>
                        <button class="btn btn-sm custom-btn opt-in-out-concept-preview" type="button" data-file-id="${escapeHtml(assignment.concept_box_id)}" title="Preview concept"><i class="fas fa-external-link-alt"></i></button>
                    </div>
                </td>
                <td><div class="fw-semibold">${escapeHtml(assignment.study_acronym || assignment.study_id)}</div><div class="small text-muted">${escapeHtml(assignment.study_name)}</div></td>
                <td style="min-width: 130px;">${getSavedStudyStatusSelect(assignment)}</td>
                <td><span class="small text-muted saved-selection-status">${assignment.submitted === "true" ? `Saved by ${escapeHtml(assignment.submitted_by_email || assignment.submitted_by_name)}` : "Not submitted"}</span></td>
            </tr>
        `).join("");

        const hasDemoAssignments = assignments.some(assignment => assignment.is_demo === "true");
        container.innerHTML = `
            ${hasDemoAssignments ? '<div class="alert alert-info"><strong>Demo Mode:</strong> Demo selections are isolated from production study and round files.</div>' : ""}
            <div class="card shadow-sm border-0">
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light"><tr><th><button type="button" class="btn btn-link btn-sm p-0 text-decoration-none fw-semibold" id="savedAssignmentIdSort" data-sort-direction="desc">ID <i class="fas fa-sort ms-1"></i></button></th><th>Concept</th><th>Study</th><th>Selection</th><th>Status</th></tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="mt-3 d-flex justify-content-end">
                <button type="button" id="optInOutSubmitBtn" class="btn btn-primary opt-in-out-submit-action" disabled>Submit Opt-In/Opt-Out Selections</button>
            </div>
            <div id="optInOutSubmitBtnFloating" style="position: fixed; bottom: 2rem; right: 2rem; z-index: 1050; display: none;">
                <button type="button" class="btn btn-primary shadow opt-in-out-submit-action" disabled>Submit Opt-In/Opt-Out Selections</button>
            </div>
        `;

        const savedAssignmentIdSort = document.getElementById("savedAssignmentIdSort");
        savedAssignmentIdSort?.addEventListener("click", () => {
            const body = savedAssignmentIdSort.closest("table")?.querySelector("tbody");
            if (!body) return;
            const direction = savedAssignmentIdSort.dataset.sortDirection === "asc" ? "desc" : "asc";
            savedAssignmentIdSort.dataset.sortDirection = direction;
            Array.from(body.querySelectorAll(":scope > .saved-assignment-row"))
                .sort((left, right) => compareConceptIds(left.dataset.conceptId || "--", right.dataset.conceptId || "--") * (direction === "asc" ? 1 : -1))
                .forEach(row => body.appendChild(row));
            const icon = savedAssignmentIdSort.querySelector("i");
            if (icon) icon.className = direction === "asc" ? "fas fa-sort-up ms-1" : "fas fa-sort-down ms-1";
        });

        container.querySelectorAll(".saved-study-status-select").forEach(select => {
            updateStudyStatusStyle(select);
            select.addEventListener("change", () => {
                updateStudyStatusStyle(select);
                updateOptInOutSubmitButtons(container);
            });
        });
        const user = { name: userRow ? String(getCellValue(userRow, ["Name", "name"])) : "Administrative Demo User", email: userEmail };
        container.querySelectorAll(".opt-in-out-submit-action").forEach(button => button.addEventListener("click", () => openOptInOutSubmitModal(container, user)));
        container.querySelectorAll(".opt-in-out-concept-preview").forEach(button => {
            button.addEventListener("click", () => {
                const modal = document.getElementById("confluencePreviewerModal");
                const header = document.getElementById("confluencePreviewerModalHeader");
                const body = document.getElementById("confluencePreviewerModalBody");
                if (!modal || !header || !body) return;
                header.innerHTML = '<h5 class="modal-title">Concept preview</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>';
                body.innerHTML = "";
                bootstrap.Modal.getOrCreateInstance(modal).show();
                showPreview(button.dataset.fileId, "confluencePreviewerModalBody");
            });
        });

        const staticButton = document.getElementById("optInOutSubmitBtn");
        const floatingContainer = document.getElementById("optInOutSubmitBtnFloating");
        if (staticButton && floatingContainer) {
            const onScroll = () => {
                const rect = staticButton.getBoundingClientRect();
                floatingContainer.style.display = rect.top < window.innerHeight && rect.bottom > 0 ? "none" : "block";
            };
            window.addEventListener("scroll", onScroll);
            onScroll();
        }
        container.dataset.loaded = "true";
    } catch (error) {
        console.error("Error loading Box-backed Opt-In/Opt-Out data:", error);
        container.innerHTML = "<p class='text-danger'>Error loading Opt-In/Opt-Out assignments from Box.</p>";
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

export const studyAccessAdminTemplate = (managerView = false) => {
    return `
        <div class="general-bg padding-bottom-1rem">
            <div class="container body-min-height">
                ${managerView ? "" : renderAdminPageTabs("study-access")}
                <div class="main-summary-row d-flex justify-content-between align-items-center">
                    <div class="align-left">
                        <h1 class="page-header">${managerView ? "Consortium Study Access" : "Study Access Admin"}</h1>
                    </div>
                    ${managerView ? "" : `<div class="align-right">
                        <button type="button" id="createDemoOptInOutRoundBtn" class="buttonsubmit button-glow-red">
                            <span class="buttonsubmit__text">Create Demo Round</span>
                        </button>
                        <button type="button" id="initiateOptInOutRoundBtn" class="buttonsubmit button-glow-red" style="margin-left: 10px;">
                            <span class="buttonsubmit__text">Initiate Opt-In/Out Round</span>
                        </button>
                        <button type="button" id="exportConsortiaCsvBtn" class="buttonsubmit button-glow-red" style="margin-left: 10px;">
                            <span class="buttonsubmit__text">Export Consortia CSV</span>
                        </button>
                        <button type="button" id="syncDataManagerStatusBtn" class="buttonsubmit button-glow-red" style="margin-left: 10px;">
                            <span class="buttonsubmit__text">Publish Chair Status to Data Managers</span>
                        </button>
                    </div>`}
                </div>
                <div class="data-submission div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem;">
                    <p class="mb-3">Expand a consortium to review initiated rounds and study selections from Box. Pending means no decision has been submitted. Changes require a reason and update the study selection record.</p>
                    <div id="studyAccessAdminTableContainer">Loading...</div>
                </div>
            </div>
        </div>
    `;
};

const getCnciWorkbookStudies = async () => {
    const workbookRows = await loadOptInOutWorkbookRows();
    const studiesById = new Map();
    workbookRows.forEach(row => {
        getWorkbookStudyEntries(row).forEach(study => {
            const studyId = String(study.acronym || study.name).trim().toLowerCase();
            if (studyId && !studiesById.has(studyId)) studiesById.set(studyId, study);
        });
    });
    return Array.from(studiesById.values()).sort((a, b) => String(a.acronym || a.name).localeCompare(String(b.acronym || b.name), undefined, { sensitivity: "base" }));
};

const getDataManagerConsortia = () => Array.from(dataManagersInfo.reduce((consortia, manager) => {
    const consortium = String(manager.consortium || "").trim().toUpperCase();
    if (!consortium) return consortia;
    const existing = consortia.get(consortium) || { consortium, collectionFolderId: null };
    if (manager.collectionFolderId) existing.collectionFolderId = String(manager.collectionFolderId);
    consortia.set(consortium, existing);
    return consortia;
}, new Map()).values());

const renderDataManagerConsortiumChoices = (groupName, selectedConsortia = ["C-NCI"]) => getDataManagerConsortia()
    .map((item, index) => {
        const inputId = `${groupName}-${index}`;
        const isSelected = selectedConsortia.includes(item.consortium) && item.collectionFolderId;
        return `<div class="form-check"><input class="form-check-input data-manager-consortium-choice" type="checkbox" name="${escapeHtml(groupName)}" id="${escapeHtml(inputId)}" value="${escapeHtml(item.consortium)}" ${isSelected ? "checked" : ""} ${item.collectionFolderId ? "" : "disabled"}><label class="form-check-label" for="${escapeHtml(inputId)}">${escapeHtml(item.consortium)}${item.collectionFolderId ? "" : " — location in progress"}</label></div>`;
    }).join("");

const getSelectedDataManagerConsortia = container => Array.from(container.querySelectorAll(".data-manager-consortium-choice:checked"), input => input.value);

const getConsortiumStudies = async consortium => {
    const consortiumId = String(consortium || "").trim().toUpperCase();
    const catalog = JSON.parse(await getFile(studyDescriptions));
    const catalogStudies = catalog.filter(row => {
        const id = String(row.Consortium || "").trim().toUpperCase();
        return (id === "NCI" ? "C-NCI" : id) === consortiumId;
    }).map(row => ({ acronym: String(row["Study Acronym"] || "").trim(), name: String(row["Study Name"] || "").trim(), consortium: consortiumId }))
        .filter(study => study.acronym || study.name);
    const configured = consortiumId === "C-NCI" ? await getCnciWorkbookStudies()
        : studiesInfo.filter(study => String(study.consortium || "").toUpperCase() === consortiumId);
    const byId = new Map([...configured, ...catalogStudies].map(study => [normalizeStudyFilterValue(study.acronym || study.name), { ...study, consortium: consortiumId }]));
    return Array.from(byId.values()).sort((a, b) => (a.acronym || a.name).localeCompare(b.acronym || b.name));
};

const getAcceptedConsortiumRounds = async (consortium, sourceRounds = null) => {
    const consortiumId = String(consortium || "").trim().toUpperCase();
    const rounds = sourceRounds || await loadAcceptedAdminConceptRounds(true);
    const acceptedConceptCount = rounds.reduce((total, round) => total + round.concepts.length, 0);
    const consortiumRounds = rounds.map(round => ({
        ...round,
        concepts: round.concepts.filter(concept => concept.requestedConsortia.some(value => String(value).trim().toUpperCase() === consortiumId))
    })).filter(round => round.concepts.length);
    return { rounds: consortiumRounds, acceptedConceptCount };
};

const getAcceptedCnciRounds = async () => getAcceptedConsortiumRounds("C-NCI");

const bindCreateDemoOptInOutRoundButton = () => {
    const button = document.getElementById("createDemoOptInOutRoundBtn");
    if (!button || button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", async () => {
        const modalElement = document.getElementById("confluenceMainModal");
        const header = document.getElementById("confluenceModalHeader");
        const body = document.getElementById("confluenceModalBody");
        if (!modalElement || !header || !body) return;
        header.innerHTML = '<h5 class="modal-title">Create Opt-In/Opt-Out Demo</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>';
        body.innerHTML = '<div class="text-muted"><i class="fas fa-spinner fa-spin"></i> Loading accepted C-NCI concepts...</div>';
        bootstrap.Modal.getOrCreateInstance(modalElement).show();
        button.disabled = true;

        try {
            const { rounds, acceptedConceptCount } = await getAcceptedCnciRounds();
            if (!rounds.length) {
                body.innerHTML = acceptedConceptCount > 0
                    ? `<div class="alert alert-warning mb-0">${acceptedConceptCount} accepted concept${acceptedConceptCount === 1 ? " was" : "s were"} matched to an Admin Chair round, but none were identified as requesting C-NCI. Confirm the Word document's Requested Consortia/Study section contains C-NCI.</div>`
                    : '<div class="alert alert-warning mb-0">No files in the completed round folders could be matched to an Admin Chair round. Confirm the completed and submitter round folder names are identical.</div>';
                return;
            }
            const now = new Date();
            const closeDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
            const toLocalInput = date => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            const defaultDemoName = `Demo_${rounds[0].name}_${now.toISOString().slice(0, 10)}`;
            body.innerHTML = `
                <form id="createDemoOptInOutRoundForm">
                    <div class="alert alert-info"><strong>Demo Mode:</strong> This creates isolated files under <code>_demo</code> and does not alter production study or round files.</div>
                    <div class="mb-3"><label for="demoOptInOutName" class="form-label">Demo name</label><input id="demoOptInOutName" class="form-control" value="${escapeHtml(defaultDemoName)}" required></div>
                    <div class="mb-3"><label for="demoOptInOutRoundSelect" class="form-label">Source round</label><select id="demoOptInOutRoundSelect" class="form-select">${rounds.map(round => `<option value="${escapeHtml(round.id)}">${escapeHtml(round.name)}</option>`).join("")}</select></div>
                    <div class="mb-3"><label class="form-label">Concepts <span class="text-muted">(choose 1–3)</span></label><div id="demoOptInOutConcepts" class="border rounded p-2" style="max-height: 220px; overflow-y: auto;"></div></div>
                    <div class="row"><div class="col-md-6 mb-3"><label for="demoOptInOutOpensAt" class="form-label">Opens</label><input id="demoOptInOutOpensAt" type="datetime-local" class="form-control" value="${toLocalInput(now)}" required></div><div class="col-md-6 mb-3"><label for="demoOptInOutClosesAt" class="form-label">Closes</label><input id="demoOptInOutClosesAt" type="datetime-local" class="form-control" value="${toLocalInput(closeDate)}" required></div></div>
                    <div id="demoOptInOutStatus" class="alert d-none" role="alert"></div>
                    <div id="demoOptInOutProgress" class="small mb-3"></div>
                    <div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button><button type="submit" class="btn btn-outline-primary">Create Demo</button></div>
                </form>
            `;
            const form = document.getElementById("createDemoOptInOutRoundForm");
            const roundSelect = document.getElementById("demoOptInOutRoundSelect");
            const conceptsContainer = document.getElementById("demoOptInOutConcepts");
            const renderConcepts = () => {
                const round = rounds.find(item => String(item.id) === roundSelect.value);
                conceptsContainer.innerHTML = (round?.concepts || []).map((concept, index) => `
                    <div class="form-check mb-2"><input class="form-check-input demo-concept-checkbox" type="checkbox" id="demoConcept-${escapeHtml(concept.fileId)}" value="${escapeHtml(concept.fileId)}" ${index < 3 ? "checked" : ""}><label class="form-check-label" for="demoConcept-${escapeHtml(concept.fileId)}">${escapeHtml(concept.title)} <span class="small text-muted">(Concept ID: ${escapeHtml(concept.fileId)})</span></label></div>
                `).join("");
                conceptsContainer.querySelectorAll(".demo-concept-checkbox").forEach(checkbox => checkbox.addEventListener("change", () => {
                    const checked = conceptsContainer.querySelectorAll(".demo-concept-checkbox:checked");
                    if (checked.length > 3) checkbox.checked = false;
                }));
            };
            roundSelect.addEventListener("change", renderConcepts);
            renderConcepts();

            form.addEventListener("submit", async event => {
                event.preventDefault();
                const submitButton = form.querySelector('button[type="submit"]');
                const status = document.getElementById("demoOptInOutStatus");
                const progress = document.getElementById("demoOptInOutProgress");
                const sourceRound = rounds.find(item => String(item.id) === roundSelect.value);
                const selectedIds = new Set(Array.from(conceptsContainer.querySelectorAll(".demo-concept-checkbox:checked")).map(checkbox => checkbox.value));
                const concepts = (sourceRound?.concepts || []).filter(concept => selectedIds.has(String(concept.fileId)));
                const opensAt = new Date(document.getElementById("demoOptInOutOpensAt").value);
                const closesAt = new Date(document.getElementById("demoOptInOutClosesAt").value);
                if (concepts.length < 1 || concepts.length > 3 || Number.isNaN(opensAt.getTime()) || Number.isNaN(closesAt.getTime()) || closesAt <= opensAt) {
                    status.className = "alert alert-danger";
                    status.textContent = "Choose between one and three concepts and provide a valid demo period.";
                    return;
                }
                submitButton.disabled = true;
                submitButton.textContent = "Creating...";
                status.className = "alert d-none";
                progress.innerHTML = "";
                try {
                    const initiatedBy = String(JSON.parse(localStorage.parms || "{}").login || "");
                    const result = await provisionDemoOptInOutRound({
                        demoName: document.getElementById("demoOptInOutName").value,
                        sourceRound,
                        concepts,
                        opensAt: opensAt.toISOString(),
                        closesAt: closesAt.toISOString(),
                        initiatedBy,
                        onProgress: message => { progress.insertAdjacentHTML("beforeend", `<div>${escapeHtml(message)}</div>`); }
                    });
                    status.className = "alert alert-success";
                    status.textContent = `${result.createdAssignments} demo assignment(s) are ready. Open Study Opt-In/Out to present the demo.`;
                    submitButton.remove();
                    const closeButton = form.querySelector('[data-bs-dismiss="modal"]');
                    if (closeButton) closeButton.textContent = "Close";
                } catch (error) {
                    console.error("Unable to create Opt-In/Out demo:", error);
                    status.className = "alert alert-danger";
                    status.textContent = error.message || "Unable to create the demo files in Box.";
                    submitButton.disabled = false;
                    submitButton.textContent = "Create Demo";
                }
            });
        } catch (error) {
            console.error("Unable to prepare Opt-In/Out demo:", error);
            body.innerHTML = '<div class="alert alert-danger mb-0">Unable to load accepted C-NCI concepts for the demo.</div>';
        } finally {
            button.disabled = false;
        }
    });
};

const bindInitiateOptInOutRoundButton = () => {
    const button = document.getElementById("initiateOptInOutRoundBtn");
    if (!button || button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", async () => {
        const modalElement = document.getElementById("confluenceMainModal");
        const header = document.getElementById("confluenceModalHeader");
        const body = document.getElementById("confluenceModalBody");
        if (!modalElement || !header || !body) return;

        button.disabled = true;
        button.classList.add("buttonsubmit--loading");
        header.innerHTML = '<h5 class="modal-title">Initiate Opt-In/Opt-Out Round</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>';
        body.innerHTML = '<div class="text-muted"><i class="fas fa-spinner fa-spin"></i> Loading accepted concepts from the Admin Chair data...</div>';
        bootstrap.Modal.getOrCreateInstance(modalElement).show();

        try {
            const configuredConsortia = getDataManagerConsortia();
            const enabledConsortia = configuredConsortia.filter(item => item.collectionFolderId);
            if (!enabledConsortia.length) {
                body.innerHTML = '<div class="alert alert-warning mb-0">No consortium has a configured Data Manager collection folder.</div>';
                return;
            }
            const allRounds = await loadAcceptedAdminConceptRounds(true);
            const defaultConsortium = enabledConsortia[0].consortium;

            const now = new Date();
            const closeDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
            const toLocalInput = date => {
                const offset = date.getTimezoneOffset() * 60000;
                return new Date(date.getTime() - offset).toISOString().slice(0, 16);
            };
            body.innerHTML = `
                <form id="initiateOptInOutRoundForm">
                    <fieldset class="mb-3"><legend class="fs-6 fw-semibold">Consortia <span class="text-muted fw-normal">(select one or more)</span></legend><div id="optInOutConsortiumChoices" class="border rounded p-2">${renderDataManagerConsortiumChoices("optInOutConsortium", [defaultConsortium])}</div></fieldset>
                    <div class="mb-3"><label for="optInOutRoundSelect" class="form-label">Round</label><select id="optInOutRoundSelect" class="form-select" required></select></div>
                    <div class="row">
                        <div class="col-md-6 mb-3"><label for="optInOutOpensAt" class="form-label">Opens</label><input id="optInOutOpensAt" type="datetime-local" class="form-control" value="${toLocalInput(now)}" required></div>
                        <div class="col-md-6 mb-3"><label for="optInOutClosesAt" class="form-label">Closes</label><input id="optInOutClosesAt" type="datetime-local" class="form-control" value="${toLocalInput(closeDate)}" required></div>
                    </div>
                    <div id="optInOutRoundSummary" class="alert alert-info"></div>
                    <div id="optInOutRoundNotice" class="alert alert-warning"></div>
                    <div id="optInOutRoundProgress" class="small mb-3" style="max-height: 180px; overflow-y: auto;"></div>
                    <div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button><button type="submit" class="btn btn-outline-primary">Initiate Round</button></div>
                </form>
            `;
            const form = document.getElementById("initiateOptInOutRoundForm");
            const consortiumChoices = document.getElementById("optInOutConsortiumChoices");
            const roundSelect = document.getElementById("optInOutRoundSelect");
            const summary = document.getElementById("optInOutRoundSummary");
            const notice = document.getElementById("optInOutRoundNotice");
            const submitButton = form.querySelector('button[type="submit"]');
            let availableRounds = [];
            const roundsByConsortium = new Map();
            const studiesByConsortium = new Map();

            const updateSummary = () => {
                const selectedRound = availableRounds.find(round => String(round.id) === roundSelect.value);
                const selectedConsortia = getSelectedDataManagerConsortia(consortiumChoices);
                if (!selectedConsortia.length) {
                    summary.textContent = "Select at least one consortium.";
                    submitButton.disabled = true;
                    return;
                }
                if (!selectedRound) {
                    summary.textContent = "No accepted concepts were found for the selected consortia.";
                    submitButton.disabled = true;
                    return;
                }
                const summaries = selectedConsortia.map(consortiumId => {
                    const consortiumRound = (roundsByConsortium.get(consortiumId) || []).find(round => String(round.id) === String(selectedRound.id));
                    const studies = studiesByConsortium.get(consortiumId) || [];
                    const conceptCount = consortiumRound?.concepts.length || 0;
                    const assignmentCount = conceptCount * studies.length;
                    const targetLabel = studies.some(study => study.consortiumLevel)
                        ? "one consortium-level assignment per concept"
                        : `${studies.length} ${studies.length === 1 ? "study" : "studies"}`;
                    return `<li><strong>${escapeHtml(consortiumId)}:</strong> ${conceptCount} accepted concept${conceptCount === 1 ? "" : "s"} × ${escapeHtml(targetLabel)} = ${assignmentCount} assignment${assignmentCount === 1 ? "" : "s"}${conceptCount ? "" : " (will be skipped)"}</li>`;
                });
                summary.innerHTML = `<strong>${escapeHtml(selectedRound.name)}</strong><ul class="mb-0 mt-1">${summaries.join("")}</ul>`;
                submitButton.disabled = !selectedConsortia.some(consortiumId => (roundsByConsortium.get(consortiumId) || []).some(round => String(round.id) === String(selectedRound.id) && round.concepts.length));
            };

            const updateConsortiumSelection = async () => {
                const selectedConsortia = getSelectedDataManagerConsortia(consortiumChoices);
                const previousRoundId = roundSelect.value;
                roundsByConsortium.clear();
                studiesByConsortium.clear();
                await Promise.all(selectedConsortia.map(async consortiumId => {
                    const [result, studies] = await Promise.all([
                        getAcceptedConsortiumRounds(consortiumId, allRounds),
                        getConsortiumStudies(consortiumId)
                    ]);
                    roundsByConsortium.set(consortiumId, result.rounds);
                    studiesByConsortium.set(consortiumId, studies);
                }));
                const roundsById = new Map();
                selectedConsortia.forEach(consortiumId => (roundsByConsortium.get(consortiumId) || []).forEach(round => {
                    if (!roundsById.has(String(round.id))) roundsById.set(String(round.id), { id: round.id, name: round.name });
                }));
                availableRounds = Array.from(roundsById.values());
                roundSelect.innerHTML = availableRounds.map(round => `<option value="${escapeHtml(round.id)}" ${String(round.id) === previousRoundId ? "selected" : ""}>${escapeHtml(round.name)}</option>`).join("");
                roundSelect.disabled = !availableRounds.length;
                summary.className = "alert alert-info";
                const consortiumLevelIds = selectedConsortia.filter(consortiumId => (studiesByConsortium.get(consortiumId) || []).some(study => study.consortiumLevel));
                notice.innerHTML = `Existing selection TSVs will be preserved. Missing files will be created and each consortium's schedule will be published to its Data Managers.${consortiumLevelIds.length ? ` <strong>${escapeHtml(consortiumLevelIds.join(", "))}</strong> ${consortiumLevelIds.length === 1 ? "does" : "do"} not yet have an individual study roster, so consortium-level assignments will be used.` : ""}`;
                updateSummary();
            };

            consortiumChoices.addEventListener("change", () => updateConsortiumSelection().catch(error => {
                summary.className = "alert alert-danger";
                summary.textContent = error.message || "Unable to load the selected consortia.";
                submitButton.disabled = true;
            }));
            roundSelect.addEventListener("change", updateSummary);
            await updateConsortiumSelection();

            form.addEventListener("submit", async event => {
                event.preventDefault();
                const selectedRound = availableRounds.find(round => String(round.id) === roundSelect.value);
                const selectedConsortia = getSelectedDataManagerConsortia(consortiumChoices);
                const opensAt = new Date(document.getElementById("optInOutOpensAt").value);
                const closesAt = new Date(document.getElementById("optInOutClosesAt").value);
                const progress = document.getElementById("optInOutRoundProgress");
                const jobs = selectedConsortia.map(consortiumId => ({
                    consortiumId,
                    round: (roundsByConsortium.get(consortiumId) || []).find(round => String(round.id) === String(selectedRound?.id)),
                    studies: studiesByConsortium.get(consortiumId) || []
                })).filter(job => job.round?.concepts.length && job.studies.length);
                if (!selectedRound || !jobs.length || Number.isNaN(opensAt.getTime()) || Number.isNaN(closesAt.getTime()) || closesAt <= opensAt) {
                    progress.innerHTML = '<div class="text-danger">Select at least one consortium, a valid round, and a closing time after the opening time.</div>';
                    return;
                }

                submitButton.disabled = true;
                submitButton.textContent = "Initiating...";
                consortiumChoices.querySelectorAll(".data-manager-consortium-choice").forEach(input => { input.disabled = true; });
                roundSelect.disabled = true;
                progress.innerHTML = "";
                const addProgress = (consortiumId, message) => {
                    progress.insertAdjacentHTML("beforeend", `<div><strong>${escapeHtml(consortiumId)}:</strong> ${escapeHtml(message)}</div>`);
                    progress.scrollTop = progress.scrollHeight;
                };
                const initiatedBy = String(JSON.parse(localStorage.parms || "{}").login || "");
                const results = [];
                const errors = [];
                for (const job of jobs) {
                    try {
                        const result = await provisionOptInOutRound({
                            round: job.round,
                            concepts: job.round.concepts,
                            studies: job.studies,
                            consortiumId: job.consortiumId,
                            opensAt: opensAt.toISOString(),
                            closesAt: closesAt.toISOString(),
                            initiatedBy,
                            onProgress: message => addProgress(job.consortiumId, message)
                        });
                        results.push({ ...result, consortiumId: job.consortiumId });
                    } catch (error) {
                        console.error(`Unable to initiate ${job.consortiumId} Opt-In/Opt-Out round:`, error);
                        errors.push({ consortiumId: job.consortiumId, message: error.message || "Unable to initiate the round." });
                        addProgress(job.consortiumId, error.message || "Unable to initiate the round.");
                    }
                }
                const createdAssignments = results.reduce((total, result) => total + result.createdAssignments, 0);
                const failedAssignments = results.reduce((total, result) => total + result.failures.length, 0);
                if (errors.length || failedAssignments) {
                    summary.className = "alert alert-warning";
                    summary.textContent = `${createdAssignments} assignments are ready; ${failedAssignments + errors.length} operation${failedAssignments + errors.length === 1 ? " needs" : "s need"} attention. Run initiation again to retry missing files.`;
                    submitButton.disabled = false;
                    submitButton.textContent = "Retry Initiation";
                    const enabledIds = new Set(enabledConsortia.map(item => item.consortium));
                    consortiumChoices.querySelectorAll(".data-manager-consortium-choice").forEach(input => { input.disabled = !enabledIds.has(input.value); });
                    roundSelect.disabled = false;
                } else {
                    summary.className = "alert alert-success";
                    summary.textContent = `${createdAssignments} assignment${createdAssignments === 1 ? " is" : "s are"} ready in Box and published for ${jobs.map(job => job.consortiumId).join(", ")}.`;
                    submitButton.remove();
                    form.querySelector('[data-bs-dismiss="modal"]').textContent = "Close";
                    modalElement.addEventListener("hidden.bs.modal", () => {
                        const table = document.getElementById("studyAccessAdminTableContainer");
                        if (table) {
                            delete table.dataset.loaded;
                            void loadStudyAccessAdminTable();
                        }
                    }, { once: true });
                }
            });
        } catch (error) {
            console.error("Unable to prepare Opt-In/Opt-Out initiation:", error);
            body.innerHTML = '<div class="alert alert-danger mb-0">Unable to load the accepted Admin Chair concepts or consortium studies.</div>';
        } finally {
            button.disabled = false;
            button.classList.remove("buttonsubmit--loading");
        }
    });
};

export const loadStudyAccessAdminTable = async (managerView = false) => {
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
        const allowedConsortia = managerView ? dataManagersInfo
            .filter(manager => manager.email.toLowerCase() === userEmail.toLowerCase())
            .map(manager => manager.consortium) : null;
        if (managerView ? !allowedConsortia.length : !userForAuth) {
            container.innerHTML = "<p class='text-warning'>You do not have access to this admin page.</p>";
            return;
        }

        bindCreateDemoOptInOutRoundButton();
        bindInitiateOptInOutRoundButton();

        const syncDataManagerButton = document.getElementById("syncDataManagerStatusBtn");
        if (syncDataManagerButton && syncDataManagerButton.dataset.bound !== "true") {
            syncDataManagerButton.dataset.bound = "true";
            syncDataManagerButton.addEventListener("click", async () => {
                const buttonText = syncDataManagerButton.querySelector(".buttonsubmit__text");
                const modalElement = document.getElementById("confluenceMainModal");
                const header = document.getElementById("confluenceModalHeader");
                const body = document.getElementById("confluenceModalBody");
                const enabledConsortia = getDataManagerConsortia().filter(item => item.collectionFolderId);
                if (!modalElement || !header || !body || !enabledConsortia.length) {
                    alert("No consortium has a configured Data Manager collection folder.");
                    return;
                }
                const defaultConsortium = enabledConsortia[0].consortium;
                header.innerHTML = '<h5 class="modal-title">Publish Chair Status to Data Managers</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>';
                body.innerHTML = `
                    <form id="publishDataManagerChairStatusForm">
                        <fieldset class="mb-3"><legend class="fs-6 fw-semibold">Consortia <span class="text-muted fw-normal">(select one or more)</span></legend><div id="publishDataManagerConsortiumChoices" class="border rounded p-2">${renderDataManagerConsortiumChoices("publishDataManagerConsortium", [defaultConsortium])}</div></fieldset>
                        <p class="text-muted">This scans each selected consortium's chair-review folders and publishes every concept's current stage and chair score to its individual Data Manager TSV files.</p>
                        <div id="publishDataManagerStatus" class="alert d-none" role="alert"></div>
                        <div id="publishDataManagerProgress" class="small mb-3" style="max-height: 180px; overflow-y: auto;"></div>
                        <div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button><button type="submit" class="btn btn-outline-primary">Publish Status</button></div>
                    </form>`;
                bootstrap.Modal.getOrCreateInstance(modalElement).show();
                const form = document.getElementById("publishDataManagerChairStatusForm");
                const consortiumChoices = document.getElementById("publishDataManagerConsortiumChoices");
                form.addEventListener("submit", async event => {
                    event.preventDefault();
                    const selectedConsortia = getSelectedDataManagerConsortia(consortiumChoices);
                    const submitButton = form.querySelector('button[type="submit"]');
                    const status = document.getElementById("publishDataManagerStatus");
                    const progress = document.getElementById("publishDataManagerProgress");
                    if (!selectedConsortia.length) {
                        status.className = "alert alert-warning";
                        status.textContent = "Select at least one consortium.";
                        return;
                    }
                    submitButton.disabled = true;
                    consortiumChoices.querySelectorAll(".data-manager-consortium-choice").forEach(input => { input.disabled = true; });
                    syncDataManagerButton.disabled = true;
                    syncDataManagerButton.classList.add("buttonsubmit--loading");
                    if (buttonText) buttonText.textContent = "Publishing...";
                    status.className = "alert alert-info";
                    status.textContent = `Publishing chair status for ${selectedConsortia.join(", ")}...`;
                    progress.innerHTML = "";
                    const results = [];
                    const errors = [];
                    for (const consortiumId of selectedConsortia) {
                        try {
                            const result = await syncCurrentDataManagerChairRequests(consortiumId, message => {
                                progress.insertAdjacentHTML("beforeend", `<div><strong>${escapeHtml(consortiumId)}:</strong> ${escapeHtml(message)}</div>`);
                                progress.scrollTop = progress.scrollHeight;
                            });
                            results.push({ ...result, consortiumId });
                        } catch (error) {
                            console.error(`Unable to publish ${consortiumId} Data Manager chair status:`, error);
                            errors.push({ consortiumId, message: error.message || "Unable to publish chair status from Box." });
                            progress.insertAdjacentHTML("beforeend", `<div class="text-danger"><strong>${escapeHtml(consortiumId)}:</strong> ${escapeHtml(error.message || "Unable to publish chair status from Box.")}</div>`);
                            progress.scrollTop = progress.scrollHeight;
                        }
                    }
                    if (!errors.length) {
                        const conceptCount = results.reduce((total, result) => total + result.concepts, 0);
                        const legacyMatched = results.reduce((total, result) => total + result.legacyMatched, 0);
                        const skipped = results.reduce((total, result) => total + result.skipped, 0);
                        status.className = "alert alert-success";
                        status.textContent = `${conceptCount} chair-stage concept${conceptCount === 1 ? " was" : "s were"} published for ${selectedConsortia.join(", ")}.${legacyMatched ? ` ${legacyMatched} legacy file(s) were matched.` : ""}${skipped ? ` ${skipped} file(s) could not be matched to a source round.` : ""}`;
                        submitButton.remove();
                        form.querySelector('[data-bs-dismiss="modal"]').textContent = "Close";
                    } else {
                        status.className = "alert alert-danger";
                        status.textContent = `${results.length} consortium publish operation${results.length === 1 ? " completed" : "s completed"}; ${errors.length} failed. You can retry safely.`;
                        submitButton.disabled = false;
                        const enabledIds = new Set(enabledConsortia.map(item => item.consortium));
                        consortiumChoices.querySelectorAll(".data-manager-consortium-choice").forEach(input => { input.disabled = !enabledIds.has(input.value); });
                    }
                    syncDataManagerButton.disabled = false;
                    syncDataManagerButton.classList.remove("buttonsubmit--loading");
                    if (buttonText) buttonText.textContent = "Publish Chair Status to Data Managers";
                });
            });
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

        const requestedStudies = await loadStudyAccessAdminRows(managerView);
        const assignmentsById = new Map();
        requestedStudies.forEach(request => request.concepts.forEach(concept => concept.assignments.forEach(assignment => {
            if (assignment.selection_file_id) assignmentsById.set(assignment.selection_file_id, assignment);
        })));
        if (!requestedStudies.length) {
            container.innerHTML = "<p class='text-warning'>No initiated Opt-In/Out assignments were found. An administrator must initiate a round first.</p>";
            return;
        }

        const rows = requestedStudies.map((request, requestIndex) => {
            const studies = request.studies || [];
            const concepts = request.concepts || [];
            const users = request.users || [];
            const requestDetailsId = `studyAccessRequest-${requestIndex}`;
            const conceptColumnCount = Math.max(2, studies.length + 2);

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
                const conceptId = getAssignedConceptId(conceptName);
                const conceptBoxId = concept.boxId;
                const roundNumber = concept.roundNumber || getRoundNumberFromFileName(conceptName);
                const roundLabel = concept.roundName || (roundNumber ? `R${roundNumber}` : "--");
                const conceptDetailsId = `studyAccessConcept-${requestIndex}-${conceptIndex}`;
                const statusCells = studies.map((study) => `
                    <td class="text-center align-middle" data-study="${escapeHtml(study.acronym || study.name)}" data-consortium="${escapeHtml(study.consortium || request.label)}" data-concept-box-id="${escapeHtml(conceptBoxId)}">
                        <div class="d-flex justify-content-center">${getStudyAccessStatusSelect(concept.assignments.get(studyAccessStudyKey(study)))}</div>
                    </td>
                `).join("");

                return `
                    <tr class="align-middle study-access-concept-row" data-concept-index="${conceptIndex}" data-round-number="${roundNumber || ""}" data-concept-id="${escapeHtml(conceptId)}">
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
                        <td class="text-nowrap">${escapeHtml(conceptId)}<div class="small text-muted">${escapeHtml(roundLabel)}</div></td>
                        ${statusCells}
                    </tr>
                    <tr class="bg-light study-access-concept-detail-row" data-concept-index="${conceptIndex}">
                        <td colspan="${conceptColumnCount}" class="p-0">
                            <div class="collapse" id="${conceptDetailsId}">
                                <div class="p-3 border-top border-bottom">
                                    <div class="small text-muted mb-2"><strong>ID:</strong> ${escapeHtml(conceptId)} <span class="ms-3"><strong>Box ID:</strong> ${escapeHtml(conceptBoxId || "Not available")}</span> <span class="ms-3"><strong>Round:</strong> ${escapeHtml(roundLabel)}</span></div>
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
                                <th scope="col"><button type="button" class="btn btn-link btn-sm p-0 text-decoration-none fw-semibold study-access-id-sort" data-sort-direction="desc">ID <i class="fas fa-sort ms-1"></i></button></th>
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
                        <thead class="table-light"><tr><th scope="col">Concept Name</th><th scope="col"><button type="button" class="btn btn-link btn-sm p-0 text-decoration-none fw-semibold study-access-id-sort" data-sort-direction="desc">ID <i class="fas fa-sort ms-1"></i></button></th></tr></thead>
                        <tbody>${conceptRows}</tbody>
                    </table>
                </div>
            `;

            return `
                <tr class="align-middle study-access-main-row" data-request-index="${requestIndex}" data-study-label="${escapeHtml(request.label)}">
                    <td class="fw-semibold">
                        <button class="btn btn-link btn-sm p-0 text-decoration-none fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#${requestDetailsId}" aria-expanded="false" aria-controls="${requestDetailsId}">
                            <i class="fas fa-chevron-down text-muted me-2"></i>${escapeHtml(request.label)}
                        </button>
                    </td>
                    <td class="text-center">${concepts.length}</td>
                    <td class="text-center">${studies.length}</td>
                </tr>
                <tr class="study-access-detail-row" data-request-index="${requestIndex}">
                    <td colspan="3" class="p-0">
                        <div class="collapse" id="${requestDetailsId}">${matrixMarkup}</div>
                    </td>
                </tr>
            `;
        }).join("");

        container.innerHTML = `
            <div id="studyAccessSaveStatus" class="d-none" role="status"></div>
            <div class="main-summary-row mb-2">
                <div class="input-group" style="max-width: 520px;">
                    <input type="search" class="form-control rounded" autocomplete="off" placeholder="Search concepts, IDs, or investigators (min. 3 characters)" aria-label="Search concepts, IDs, or investigators" id="studyAccessConceptSearch" aria-describedby="studyAccessConceptSearchStatus">
                    <span class="input-group-text border-0"><i class="fas fa-search"></i></span>
                </div>
                <div id="studyAccessConceptSearchStatus" class="small text-muted ms-2 align-self-center" aria-live="polite"></div>
            </div>
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

        container.querySelectorAll(".study-access-id-sort").forEach((idSortButton) => {
            idSortButton.addEventListener("click", () => {
                const nestedBody = idSortButton.closest("table")?.querySelector("tbody");
                if (!nestedBody) return;
                const direction = idSortButton.dataset.sortDirection === "asc" ? "desc" : "asc";
                idSortButton.dataset.sortDirection = direction;
                const detailRowsByIndex = new Map(Array.from(nestedBody.querySelectorAll(":scope > .study-access-concept-detail-row"))
                    .map(row => [row.dataset.conceptIndex, row]));
                const pairs = Array.from(nestedBody.querySelectorAll(":scope > .study-access-concept-row"))
                    .map(row => ({ main: row, detail: detailRowsByIndex.get(row.dataset.conceptIndex) }));
                pairs.sort((left, right) => compareConceptIds(left.main.dataset.conceptId || "--", right.main.dataset.conceptId || "--") * (direction === "asc" ? 1 : -1));
                pairs.forEach(({ main, detail }) => { nestedBody.appendChild(main); if (detail) nestedBody.appendChild(detail); });
                const icon = idSortButton.querySelector("i");
                if (icon) icon.className = direction === "asc" ? "fas fa-sort-up ms-1" : "fas fa-sort-down ms-1";
            });
        });

        const searchInput = document.getElementById("studyAccessConceptSearch");
        const searchStatus = document.getElementById("studyAccessConceptSearchStatus");
        if (searchInput) {
            searchInput.addEventListener("input", () => {
                const query = searchInput.value.trim().toLowerCase();
                let matchingConceptCount = 0;

                requestedStudies.forEach((request, requestIndex) => {
                    const mainRow = tableBody?.querySelector(`.study-access-main-row[data-request-index="${requestIndex}"]`);
                    const detailRow = tableBody?.querySelector(`.study-access-detail-row[data-request-index="${requestIndex}"]`);
                    if (!mainRow || !detailRow) return;

                    const studies = request.studies || [];
                    const users = request.users || [];
                    const requestSearchText = [
                        request.label,
                        ...studies.flatMap(study => [study.acronym, study.name]),
                        ...users.flatMap(user => [user.name, user.email, ...(user.studies || []).flatMap(study => [study.acronym, study.name])])
                    ].filter(Boolean).join(" ").toLowerCase();
                    const requestMatches = query.length < 3 || requestSearchText.includes(query);
                    let requestHasMatch = requestMatches;

                    (request.concepts || []).forEach((concept, conceptIndex) => {
                        const conceptRow = detailRow.querySelector(`.study-access-concept-row[data-concept-index="${conceptIndex}"]`);
                        const conceptDetailRow = detailRow.querySelector(`.study-access-concept-detail-row[data-concept-index="${conceptIndex}"]`);
                        const conceptSearchText = `${concept.name || ""} ${concept.boxId || ""} ${concept.investigators || ""} ${requestSearchText}`.toLowerCase();
                        const conceptMatches = query.length < 3 || conceptSearchText.includes(query);
                        conceptRow?.classList.toggle("d-none", !conceptMatches);
                        conceptDetailRow?.classList.toggle("d-none", !conceptMatches);
                        if (conceptMatches) {
                            requestHasMatch = true;
                            matchingConceptCount++;
                        }
                    });

                    mainRow.classList.toggle("d-none", !requestHasMatch);
                    detailRow.classList.toggle("d-none", !requestHasMatch);
                });

                if (!searchStatus) return;
                if (query.length > 0 && query.length < 3) searchStatus.textContent = "Enter at least 3 characters.";
                else if (query.length >= 3) searchStatus.textContent = `${matchingConceptCount} matching concept${matchingConceptCount === 1 ? "" : "s"}`;
                else searchStatus.textContent = "";
            });
        }

        container.querySelectorAll(".study-status-select").forEach((select) => {
            select.dataset.previousValue = select.value;
            select.addEventListener("change", () => {
                confirmStudyAccessChange(select, container, managerView, assignmentsById);
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
        container.innerHTML = `<p class="text-danger">${escapeHtml(error.message || "Unable to load study selections from Box.")}</p>`;
    }
};
