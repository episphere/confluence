import { showPreview } from "../components/boxPreview.js";
import { Confluence_Opt_In_Out, createComment, createFolder, dataManagersInfo, emailsAllowedToUpdateData, getConceptIdFromFileName, getFolderItems, readDocFile, removeRoundSuffixFromFileName, uploadBinaryFile } from "../shared.js";
import { loadDataManagerRequests, saveDataManagerAccessDetails } from "../optInOutStore.js";

const escapeHtml = value => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatDateTime = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Not scheduled" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

const getConceptName = request => removeRoundSuffixFromFileName(request.concept_title || request.concept_file_name || "Untitled concept")
    .replace(/_\d{4}-\d{2}-\d{2}\.docx?$/i, "");

const getConceptId = request => getConceptIdFromFileName(request.concept_file_name || request.concept_title || "") || request.concept_box_id || "--";

const escapeRegExp = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractBetweenLabels = (text, startLabel, endLabel) => {
    const normalized = String(text || "").replace(/\s+/g, " ").trim();
    const startMatch = new RegExp(`${escapeRegExp(startLabel)}\\s*:?\\s*`, "i").exec(normalized);
    if (!startMatch) return "";
    const remaining = normalized.slice(startMatch.index + startMatch[0].length);
    const endMatch = new RegExp(escapeRegExp(endLabel), "i").exec(remaining);
    return (endMatch ? remaining.slice(0, endMatch.index) : remaining).trim();
};

export const extractDataManagerInvestigatorDetails = text => ({
    contactInvestigator: extractBetweenLabels(text, "Contact Investigator(s)", "Institution(s)"),
    institution: extractBetweenLabels(text, "Institution(s)", "Contact Email"),
    email: extractBetweenLabels(text, "Contact Email", "Member of Consortia or Study / Trial Group?")
        .match(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+/i)?.[0] || "",
    allInvestigators: extractBetweenLabels(text, "ALL Investigators (and Institutions) who require access", "Consortia or Study / Trial Group data being requested")
});

const parseDtaAssignments = value => {
    try {
        const parsed = JSON.parse(value || "[]");
        return Array.isArray(parsed) ? parsed.filter(item => item && typeof item === "object") : [];
    } catch (error) {
        console.warn("Unable to parse saved DTA assignments:", error);
        return [];
    }
};

const getEmailLinks = email => String(email || "").split(/[;,\s]+/).filter(Boolean)
    .map(address => `<a href="mailto:${encodeURIComponent(address)}">${escapeHtml(address)}</a>`).join(", ");

const loadInvestigatorDetails = async requests => {
    const detailsByConceptId = new Map();
    const conceptIds = Array.from(new Set(requests.map(request => String(request.concept_box_id || "")).filter(Boolean)));
    const chunkSize = 8;
    for (let index = 0; index < conceptIds.length; index += chunkSize) {
        await Promise.all(conceptIds.slice(index, index + chunkSize).map(async conceptId => {
            try {
                detailsByConceptId.set(conceptId, extractDataManagerInvestigatorDetails(await readDocFile(conceptId)));
            } catch (error) {
                console.warn(`Unable to load investigator details for Concept ID ${conceptId}:`, error);
                detailsByConceptId.set(conceptId, {});
            }
        }));
    }
    return detailsByConceptId;
};

const parseDtaFiles = value => {
    try {
        const parsed = typeof value === "string" ? JSON.parse(value || "[]") : value;
        return Array.isArray(parsed) ? parsed.filter(file => file?.fileId) : [];
    } catch (error) {
        return [];
    }
};

const renderDtaFiles = files => {
    const validFiles = parseDtaFiles(files);
    if (!validFiles.length) return '<span class="text-muted">No agreement uploaded.</span>';
    return validFiles.map(file => `<a class="me-3" href="https://app.box.com/file/${encodeURIComponent(file.fileId)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-paperclip me-1"></i>${escapeHtml(file.fileName || "Box agreement")}</a>`).join("");
};

const renderDtaAssignment = (assignment = {}) => `
    <div class="data-manager-dta-assignment border rounded p-2 mb-2" data-files="${escapeHtml(JSON.stringify(parseDtaFiles(assignment.files)))}">
        <div class="row g-2 align-items-end">
            <div class="col-12 col-lg-5"><label class="form-label small fw-semibold">DTA / DUA agreement</label><input type="text" class="form-control form-control-sm data-manager-dta-name" value="${escapeHtml(assignment.dta || "")}" placeholder="Agreement name, ID, or institution"></div>
            <div class="col-12 col-lg-5"><label class="form-label small fw-semibold">People covered by this DTA</label><input type="text" class="form-control form-control-sm data-manager-dta-people" value="${escapeHtml(assignment.people || "")}" placeholder="Names of investigators receiving access"></div>
            <div class="col-6 col-lg-1"><button type="button" class="btn btn-sm btn-outline-primary w-100 data-manager-upload-dta" title="Upload agreement to Box" aria-label="Upload agreement to Box"><i class="fas fa-upload"></i><span class="d-lg-none ms-1">Upload</span></button></div>
            <div class="col-6 col-lg-1"><button type="button" class="btn btn-sm btn-outline-danger w-100 data-manager-remove-dta" title="Remove this DTA association" aria-label="Remove this DTA association"><i class="fas fa-trash-alt"></i><span class="d-lg-none ms-1">Remove</span></button></div>
        </div>
        <div class="small mt-2 data-manager-dta-file-links">${renderDtaFiles(assignment.files)}</div>
    </div>`;

const getUploadFolderOptions = async () => {
    const response = await getFolderItems(Confluence_Opt_In_Out, "id,name,type", 1000);
    const folders = (Array.isArray(response?.entries) ? response.entries : [])
        .filter(item => item.type === "folder" && item.name !== "_config")
        .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" }));
    return [
        { id: String(Confluence_Opt_In_Out), name: "Confluence Opt-In/Out root" },
        ...folders.map(folder => ({ id: String(folder.id), name: folder.name }))
    ];
};

const openDtaUploadModal = async ({ assignmentElement, uploadedBy, onUploaded }) => {
    const modalElement = document.getElementById("confluenceMainModal");
    const header = document.getElementById("confluenceModalHeader");
    const body = document.getElementById("confluenceModalBody");
    if (!modalElement || !header || !body) return;

    header.innerHTML = '<h5 class="modal-title">Upload DTA / DUA to Box</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>';
    body.innerHTML = '<div class="text-muted"><i class="fas fa-spinner fa-spin me-1"></i>Loading Box folders...</div>';
    bootstrap.Modal.getOrCreateInstance(modalElement).show();

    try {
        const folders = await getUploadFolderOptions();
        const folderOptions = folders.map(folder => `<option value="${escapeHtml(folder.id)}">${escapeHtml(folder.name)} (ID: ${escapeHtml(folder.id)})</option>`).join("");
        body.innerHTML = `
            <form id="dataManagerDtaUploadForm">
                <div class="mb-3"><label class="form-label fw-semibold" for="dataManagerDtaFile">Agreement file</label><input id="dataManagerDtaFile" class="form-control" type="file" accept=".pdf,.doc,.docx,.odt" required></div>
                <fieldset class="mb-3">
                    <legend class="fs-6 fw-semibold">Box destination</legend>
                    <div class="form-check"><input class="form-check-input" type="radio" name="dtaFolderMode" id="dtaExistingFolderMode" value="existing" checked><label class="form-check-label" for="dtaExistingFolderMode">Upload to an existing folder</label></div>
                    <div class="form-check"><input class="form-check-input" type="radio" name="dtaFolderMode" id="dtaCreateFolderMode" value="create"><label class="form-check-label" for="dtaCreateFolderMode">Create a new folder, then upload</label></div>
                </fieldset>
                <div id="dtaExistingFolderFields" class="mb-3">
                    <label class="form-label" for="dtaExistingFolder">Existing folder</label><select id="dtaExistingFolder" class="form-select">${folderOptions}</select>
                    <label class="form-label small mt-2" for="dtaExistingFolderId">Or enter another Box folder ID</label><input id="dtaExistingFolderId" class="form-control" inputmode="numeric" placeholder="Optional folder ID">
                </div>
                <div id="dtaCreateFolderFields" class="mb-3 d-none">
                    <label class="form-label" for="dtaParentFolder">Create inside</label><select id="dtaParentFolder" class="form-select">${folderOptions}</select>
                    <label class="form-label small mt-2" for="dtaParentFolderId">Or enter another parent folder ID</label><input id="dtaParentFolderId" class="form-control" inputmode="numeric" placeholder="Optional parent folder ID">
                    <label class="form-label mt-2" for="dtaNewFolderName">New folder name</label><input id="dtaNewFolderName" class="form-control" maxlength="255" placeholder="For example: Smith DTA" required>
                </div>
                <div id="dataManagerDtaUploadStatus" class="alert d-none" role="alert"></div>
                <div class="modal-footer px-0 pb-0"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-upload me-1"></i>Upload to Box</button></div>
            </form>`;

        const form = document.getElementById("dataManagerDtaUploadForm");
        const setMode = () => {
            const createMode = form.elements.dtaFolderMode.value === "create";
            document.getElementById("dtaExistingFolderFields").classList.toggle("d-none", createMode);
            document.getElementById("dtaCreateFolderFields").classList.toggle("d-none", !createMode);
            document.getElementById("dtaNewFolderName").required = createMode;
        };
        form.querySelectorAll('[name="dtaFolderMode"]').forEach(radio => radio.addEventListener("change", setMode));
        setMode();

        form.addEventListener("submit", async event => {
            event.preventDefault();
            const submitButton = form.querySelector('button[type="submit"]');
            const status = document.getElementById("dataManagerDtaUploadStatus");
            const file = document.getElementById("dataManagerDtaFile").files[0];
            submitButton.disabled = true;
            status.className = "alert alert-info";
            status.textContent = "Uploading agreement to Box...";
            try {
                const createMode = form.elements.dtaFolderMode.value === "create";
                let folderId;
                if (createMode) {
                    const parentId = document.getElementById("dtaParentFolderId").value.trim() || document.getElementById("dtaParentFolder").value;
                    const folderName = document.getElementById("dtaNewFolderName").value.trim();
                    if (!folderName) throw new Error("Enter a name for the new folder.");
                    const created = await createFolder(parentId, folderName);
                    if (created?.id) {
                        folderId = String(created.id);
                    } else if (created?.status === 409 || created?.code === "item_name_already_exists") {
                        const existing = await getFolderItems(parentId, "id,name,type", 1000);
                        folderId = String(existing?.entries?.find(item => item.type === "folder" && item.name.toLowerCase() === folderName.toLowerCase())?.id || "");
                    }
                    if (!folderId) throw new Error(created?.message || "Unable to create or locate the requested Box folder.");
                } else {
                    folderId = document.getElementById("dtaExistingFolderId").value.trim() || document.getElementById("dtaExistingFolder").value;
                }
                if (!folderId) throw new Error("Choose a destination Box folder.");

                const uploadResult = await uploadBinaryFile(file, folderId);
                const uploadedFile = uploadResult?.entries?.[0];
                if (!uploadedFile?.id) throw new Error("Box did not confirm the file upload.");
                const agreementName = assignmentElement.querySelector(".data-manager-dta-name");
                const coveredPeople = assignmentElement.querySelector(".data-manager-dta-people")?.value.trim() || "";
                if (agreementName && !agreementName.value.trim()) agreementName.value = file.name.replace(/\.[^.]+$/, "");
                status.textContent = "Adding the agreement details as a Box comment...";
                const commentResponse = await createComment(uploadedFile.id, `Agreement for: ${agreementName?.value.trim() || ""}\nPeople Covered: ${coveredPeople}`);
                const commentSaved = commentResponse?.status === 201;
                const files = parseDtaFiles(assignmentElement.dataset.files);
                files.push({ fileId: String(uploadedFile.id), fileName: uploadedFile.name || file.name, folderId, uploadedAt: new Date().toISOString(), uploadedBy });
                assignmentElement.dataset.files = JSON.stringify(files);
                assignmentElement.querySelector(".data-manager-dta-file-links").innerHTML = renderDtaFiles(files);
                try {
                    await onUploaded();
                } catch (saveError) {
                    console.error("The agreement was uploaded but its association could not be saved:", saveError);
                    status.className = "alert alert-warning";
                    status.textContent = `${file.name} was uploaded to Box, but the association could not be saved. Close this dialog and use Save access details to retry.`;
                    submitButton.remove();
                    form.querySelector('[data-bs-dismiss="modal"]').textContent = "Close";
                    return;
                }
                status.className = commentSaved ? "alert alert-success" : "alert alert-warning";
                status.textContent = commentSaved
                    ? `${file.name} was uploaded, commented, and linked to this agreement.`
                    : `${file.name} was uploaded and linked, but Box did not confirm the file comment.`;
                submitButton.remove();
                form.querySelector('[data-bs-dismiss="modal"]').textContent = "Close";
            } catch (error) {
                console.error("Unable to upload the DTA / DUA:", error);
                status.className = "alert alert-danger";
                status.textContent = error.message || "Unable to upload the agreement.";
                submitButton.disabled = false;
            }
        });
    } catch (error) {
        body.innerHTML = `<div class="alert alert-danger">${escapeHtml(error.message || "Unable to load Box folders.")}</div>`;
    }
};

const getCollectionStatus = request => {
    if (request.provision_status === "error") return { label: "Setup error", className: "bg-danger", detail: request.provision_error || "The assignment could not be created." };
    if (request.load_error || request.decision === "unavailable") return { label: "Status unavailable", className: "bg-secondary", detail: request.load_error || "The selection file could not be read." };
    if (request.workflow_stage === "chair_review") return { label: "Chair review", className: "bg-warning text-dark", detail: `${request.consortium_id || "Consortium"} chair review is in progress.` };
    if (request.workflow_stage === "chair_clarification") return { label: "Chair clarification", className: "bg-info text-dark", detail: "The chair requested clarification from the investigator." };
    if (request.workflow_stage === "chair_complete") return { label: "Chair review complete", className: "bg-primary", detail: "The chair submitted a score; final administrative processing is pending." };
    if (request.workflow_stage === "admin_clarification") return { label: "Investigator clarification", className: "bg-info text-dark", detail: "Administrative review returned the concept for additional information." };
    if (request.workflow_stage === "admin_accepted") return { label: "Accepted", className: "bg-success", detail: "The concept was accepted; Opt-In/Out scheduling is pending." };
    if (request.workflow_stage === "admin_denied") return { label: "Denied", className: "bg-danger", detail: "The concept will not proceed to data collection." };
    if (request.submitted === "true" && request.decision === "opt_in") return { label: "Ready for data collection", className: "bg-success", detail: "This study opted in." };
    if (request.submitted === "true" && request.decision === "opt_out") return { label: "Not participating", className: "bg-secondary", detail: "This study opted out." };

    const now = Date.now();
    const opensAt = Date.parse(request.opens_at_utc);
    const closesAt = Date.parse(request.closes_at_utc);
    if (Number.isFinite(opensAt) && now < opensAt) return { label: "Scheduled", className: "bg-info text-dark", detail: `Opt-in/out opens ${formatDateTime(request.opens_at_utc)}.` };
    if (Number.isFinite(closesAt) && now > closesAt) return { label: "Decision overdue", className: "bg-danger", detail: "The opt-in/out deadline passed without a submitted decision." };
    return { label: "Awaiting opt-in/out", className: "bg-warning text-dark", detail: "The study decision is pending." };
};

export const dataManagersTemplate = () => `
    <div class="general-bg padding-bottom-1rem">
        <div class="container body-min-height data-manager-container">
            <div class="main-summary-row">
                <div class="align-left"><h1 class="page-header">Data Managers</h1></div>
            </div>
            <div class="data-submission div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem;">
                <p class="mb-3">Concepts appear here when an administrator initiates chair review and remain visible through Opt-In/Out and data collection. You will only see requests for your configured consortium.</p>
                <div id="dataManagerRequestsContainer">Loading...</div>
            </div>
        </div>
    </div>
`;

export const loadDataManagerRequestsTable = async () => {
    const container = document.getElementById("dataManagerRequestsContainer");
    if (!container || container.dataset.loaded === "true") return;
    container.innerHTML = '<div class="text-muted"><i class="fas fa-spinner fa-spin"></i> Loading collection status from Box...</div>';

    try {
        const userEmail = String(JSON.parse(localStorage.parms || "{}").login || "").trim();
        if (!userEmail) {
            container.innerHTML = '<p class="text-warning">Please sign in to view this page.</p>';
            return;
        }
        const manager = dataManagersInfo.find(item => item.email.toLowerCase() === userEmail.toLowerCase());
        const isAdmin = emailsAllowedToUpdateData.some(email => email.toLowerCase() === userEmail.toLowerCase());
        if (!manager && !isAdmin) {
            container.innerHTML = '<p class="text-warning">Your email is not configured for data management.</p>';
            return;
        }

        // Administrators without a manager mapping can inspect all rows; mapped
        // administrators retain the same consortium-scoped view as data managers.
        const requests = await loadDataManagerRequests(manager);
        if (!requests.length) {
            container.innerHTML = '<div class="alert alert-info mb-0">No data-collection requests have been initiated for your consortium.</div>';
            container.dataset.loaded = "true";
            return;
        }

        const investigatorDetails = await loadInvestigatorDetails(requests);
        requests.sort((left, right) => `${left.round_name}|${getConceptId(left)}`.localeCompare(`${right.round_name}|${getConceptId(right)}`, undefined, { numeric: true, sensitivity: "base" }));
        const roundOptions = Array.from(new Set(requests.map(request => request.round_name).filter(Boolean)))
            .sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: "base" }))
            .map(round => `<option value="${escapeHtml(round)}">${escapeHtml(round)}</option>`).join("");
        const rows = requests.map((request, index) => {
            const status = getCollectionStatus(request);
            const details = investigatorDetails.get(String(request.concept_box_id || "")) || {};
            const assignments = parseDtaAssignments(request.dta_assignments);
            const rowId = `dataManagerRequest${index}`;
            const isPreOptInStage = ["chair_review", "chair_clarification", "chair_complete", "admin_clarification", "admin_accepted", "admin_denied"].includes(request.workflow_stage);
            const availability = isPreOptInStage
                ? (request.workflow_stage === "admin_denied" ? "Not applicable" : request.workflow_stage === "chair_complete" ? "Pending final approval" : "Not yet scheduled")
                : request.submitted === "true" && request.decision === "opt_in"
                ? "Available now"
                : request.submitted === "true" && request.decision === "opt_out"
                    ? "Not applicable"
                    : `After ${formatDateTime(request.closes_at_utc)}`;
            const baseSearchText = [getConceptName(request), getConceptId(request), request.round_name, request.consortium_id, request.chair_score, status.label, details.contactInvestigator, details.email, details.institution, details.allInvestigators].join(" ").toLowerCase();
            const searchText = `${baseSearchText} ${request.access_notes || ""} ${assignments.flatMap(assignment => [assignment.dta, assignment.people, ...parseDtaFiles(assignment.files).map(file => file.fileName)]).join(" ")}`.toLowerCase();
            return `
                <tr class="data-manager-request-row" data-detail-row="${rowId}Details" data-round="${escapeHtml(request.round_name)}" data-base-search="${escapeHtml(baseSearchText)}" data-search="${escapeHtml(searchText)}">
                    <td class="data-manager-concept-cell" data-label="Concept"><div class="d-flex align-items-start gap-2"><span class="flex-grow-1 text-wrap">${escapeHtml(getConceptName(request))}</span>${request.concept_box_id ? `<button class="btn btn-sm custom-btn data-manager-concept-preview flex-shrink-0" type="button" data-file-id="${escapeHtml(request.concept_box_id)}" title="Preview concept" aria-label="Preview ${escapeHtml(getConceptName(request))}"><i class="fas fa-external-link-alt"></i></button>` : ""}</div><div class="small text-muted">ID: ${escapeHtml(getConceptId(request))}</div></td>
                    <td data-label="Round">${escapeHtml(request.round_name)}</td>
                    <td data-label="Consortium score"><span class="fw-semibold">${escapeHtml(request.chair_score || "--")}</span><div class="small text-muted">${escapeHtml(request.consortium_id || "--")}</div></td>
                    <td data-label="Current stage"><span class="badge ${status.className}">${escapeHtml(status.label)}</span><div class="small text-muted mt-1">${escapeHtml(status.detail)}</div></td>
                    <td data-label="Expected availability">${escapeHtml(availability)}${request.closes_at_utc ? `<div class="small text-muted">Decision deadline: ${escapeHtml(formatDateTime(request.closes_at_utc))}</div>` : ""}</td>
                    <td class="data-manager-toggle-cell" data-label="Details"><button class="accordion-toggle-btn data-manager-accordion-toggle" type="button" data-bs-toggle="collapse" data-bs-target="#${rowId}Collapse" aria-expanded="false" aria-controls="${rowId}Collapse" title="Show investigator and access details" aria-label="Show investigator and access details"><i class="fas fa-chevron-down"></i></button></td>
                </tr>
                <tr id="${rowId}Details" class="data-manager-detail-row">
                    <td colspan="6" class="p-0 border-0">
                        <div id="${rowId}Collapse" class="accordion-collapse collapse">
                            <div class="accordion-body border-bottom bg-light" data-round-id="${escapeHtml(request.round_id)}" data-concept-box-id="${escapeHtml(request.concept_box_id)}" data-consortium-id="${escapeHtml(request.consortium_id)}">
                                <div class="row g-3 mb-3">
                                    <div class="col-12 col-lg-4"><div class="small fw-bold text-muted">Contact Investigator / PI</div><div>${escapeHtml(details.contactInvestigator || "Not provided")}</div></div>
                                    <div class="col-12 col-lg-4"><div class="small fw-bold text-muted">Email</div><div class="text-break">${details.email ? getEmailLinks(details.email) : '<span class="text-muted">Not provided</span>'}</div></div>
                                    <div class="col-12 col-lg-4"><div class="small fw-bold text-muted">Institution</div><div>${escapeHtml(details.institution || "Not provided")}</div></div>
                                    <div class="col-12"><div class="small fw-bold text-muted">All investigators who need access</div><div class="data-manager-all-investigators">${escapeHtml(details.allInvestigators || "Not provided")}</div></div>
                                </div>
                                <div class="border-top pt-3">
                                    <label class="form-label fw-semibold">Access notes / people granted access</label>
                                    <textarea class="form-control data-manager-access-notes" rows="3" placeholder="Record who has been granted access and any relevant notes.">${escapeHtml(request.access_notes || "")}</textarea>
                                    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mt-3 mb-2"><span class="fw-semibold">DTA / DUA associations</span><button type="button" class="btn btn-sm btn-outline-primary data-manager-add-dta"><i class="fas fa-plus me-1"></i>Add agreement</button></div>
                                    <div class="data-manager-dta-list">${(assignments.length ? assignments : [{}]).map(renderDtaAssignment).join("")}</div>
                                    <div class="d-flex flex-wrap align-items-center gap-2 mt-3"><button type="button" class="btn btn-primary btn-sm data-manager-save-access"><i class="fas fa-save me-1"></i>Save access details</button><span class="small data-manager-save-status" role="status">${request.access_updated_at_utc ? `Last saved ${escapeHtml(formatDateTime(request.access_updated_at_utc))}${request.access_updated_by ? ` by ${escapeHtml(request.access_updated_by)}` : ""}` : ""}</span></div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>`;
        }).join("");

        container.innerHTML = `
            <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
                <input id="dataManagerRequestSearch" type="search" class="form-control" style="max-width: 420px;" placeholder="Search concepts, investigators, email, institution, DTA, or status" aria-label="Search data collection requests">
                <select id="dataManagerRoundFilter" class="form-select" style="max-width: 260px;" aria-label="Filter by round"><option value="">All rounds</option>${roundOptions}</select>
                <span id="dataManagerRequestCount" class="small text-muted ms-auto"></span>
            </div>
            <div class="table-responsive data-manager-table-wrap"><table class="table table-hover align-middle mb-0 data-manager-accordion-table"><thead class="table-light"><tr><th>Concept</th><th>Round</th><th>Consortium score</th><th>Current stage</th><th>Expected availability</th><th><span class="visually-hidden">Details</span></th></tr></thead><tbody>${rows}</tbody></table></div>`;

        const applyFilters = () => {
            const search = document.getElementById("dataManagerRequestSearch")?.value.trim().toLowerCase() || "";
            const round = document.getElementById("dataManagerRoundFilter")?.value || "";
            let visible = 0;
            container.querySelectorAll(".data-manager-request-row").forEach(row => {
                const show = (!round || row.dataset.round === round)
                    && (!search || (row.dataset.search || "").includes(search));
                row.classList.toggle("d-none", !show);
                document.getElementById(row.dataset.detailRow)?.classList.toggle("d-none", !show);
                if (show) visible++;
            });
            const count = document.getElementById("dataManagerRequestCount");
            if (count) count.textContent = `${visible} request${visible === 1 ? "" : "s"}`;
        };
        document.getElementById("dataManagerRequestSearch")?.addEventListener("input", applyFilters);
        document.getElementById("dataManagerRoundFilter")?.addEventListener("change", applyFilters);
        applyFilters();

        const saveAccessBody = async body => {
            const summaryRow = body?.closest(".data-manager-detail-row")?.previousElementSibling;
            const statusElement = body?.querySelector(".data-manager-save-status");
            if (!body || !summaryRow || !statusElement) throw new Error("Unable to locate the access details for this request.");
            const dtaAssignments = Array.from(body.querySelectorAll(".data-manager-dta-assignment")).map(assignment => ({
                dta: assignment.querySelector(".data-manager-dta-name")?.value || "",
                people: assignment.querySelector(".data-manager-dta-people")?.value || "",
                files: parseDtaFiles(assignment.dataset.files)
            })).filter(assignment => assignment.dta.trim() || assignment.people.trim() || assignment.files.length);
            const saved = await saveDataManagerAccessDetails({
                roundId: body.dataset.roundId,
                conceptBoxId: body.dataset.conceptBoxId,
                consortiumId: body.dataset.consortiumId,
                notes: body.querySelector(".data-manager-access-notes")?.value || "",
                dtaAssignments,
                updatedBy: userEmail,
                dataManagerName: manager?.name || ""
            });
            summaryRow.dataset.search = `${summaryRow.dataset.baseSearch || ""} ${saved.notes} ${saved.dtaAssignments.flatMap(assignment => [assignment.dta, assignment.people, ...parseDtaFiles(assignment.files).map(file => file.fileName)]).join(" ")}`.toLowerCase();
            statusElement.className = "small data-manager-save-status text-success";
            statusElement.textContent = `Saved ${formatDateTime(saved.updatedAt)}`;
            return saved;
        };

        container.addEventListener("click", async event => {
            const addButton = event.target.closest(".data-manager-add-dta");
            if (addButton) {
                addButton.closest(".accordion-body")?.querySelector(".data-manager-dta-list")?.insertAdjacentHTML("beforeend", renderDtaAssignment());
                return;
            }

            const uploadButton = event.target.closest(".data-manager-upload-dta");
            if (uploadButton) {
                const assignmentElement = uploadButton.closest(".data-manager-dta-assignment");
                const body = uploadButton.closest(".accordion-body");
                if (assignmentElement && body) await openDtaUploadModal({ assignmentElement, uploadedBy: userEmail, onUploaded: () => saveAccessBody(body) });
                return;
            }

            const removeButton = event.target.closest(".data-manager-remove-dta");
            if (removeButton) {
                removeButton.closest(".data-manager-dta-assignment")?.remove();
                return;
            }

            const saveButton = event.target.closest(".data-manager-save-access");
            if (!saveButton) return;
            const body = saveButton.closest(".accordion-body");
            const statusElement = body?.querySelector(".data-manager-save-status");
            if (!body || !statusElement) return;
            saveButton.disabled = true;
            statusElement.className = "small data-manager-save-status text-muted";
            statusElement.textContent = "Saving...";
            try {
                await saveAccessBody(body);
            } catch (error) {
                console.error("Unable to save Data Manager access details:", error);
                statusElement.className = "small data-manager-save-status text-danger";
                statusElement.textContent = error.message || "Unable to save access details.";
            } finally {
                saveButton.disabled = false;
            }
        });

        container.querySelectorAll(".data-manager-concept-preview").forEach(button => button.addEventListener("click", () => {
            const modal = document.getElementById("confluencePreviewerModal");
            const header = document.getElementById("confluencePreviewerModalHeader");
            const body = document.getElementById("confluencePreviewerModalBody");
            if (!modal || !header || !body) return;
            header.innerHTML = '<h5 class="modal-title">Concept preview</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>';
            body.innerHTML = "";
            bootstrap.Modal.getOrCreateInstance(modal).show();
            showPreview(button.dataset.fileId, "confluencePreviewerModalBody");
        }));
        container.dataset.loaded = "true";
    } catch (error) {
        console.error("Unable to load Data Manager requests:", error);
        container.innerHTML = '<p class="text-danger">Unable to load data-collection status from Box.</p>';
    }
};
