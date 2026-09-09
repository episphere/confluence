import { showPreview } from "../components/boxPreview.js";
import { dataManagersInfo, emailsAllowedToUpdateData, getConceptIdFromFileName, removeRoundSuffixFromFileName } from "../shared.js";
import { loadDataManagerRequests } from "../optInOutStore.js";

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
        <div class="container body-min-height">
            <div class="main-summary-row">
                <div class="align-left"><h1 class="page-header">Data Managers</h1></div>
            </div>
            <div class="data-submission div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem;">
                <p class="mb-3">Concepts appear here when an administrator initiates chair review and remain visible through Opt-In/Out and data collection. You will only see requests associated with your configured study or studies.</p>
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
            container.innerHTML = '<p class="text-warning">Your email is not configured for a data-management study.</p>';
            return;
        }

        // Administrators without a study mapping can inspect all rows; mapped admins
        // retain the same study-scoped view that a data manager receives.
        const requests = await loadDataManagerRequests(manager ? manager.studies : null);
        if (!requests.length) {
            container.innerHTML = '<div class="alert alert-info mb-0">No data-collection requests have been initiated for your studies.</div>';
            container.dataset.loaded = "true";
            return;
        }

        requests.sort((left, right) => `${left.study_acronym}|${left.round_name}|${getConceptId(left)}`.localeCompare(`${right.study_acronym}|${right.round_name}|${getConceptId(right)}`, undefined, { numeric: true, sensitivity: "base" }));
        const studyOptions = Array.from(new Set(requests.map(request => request.study_acronym || request.study_name).filter(Boolean)))
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
            .map(study => `<option value="${escapeHtml(study)}">${escapeHtml(study)}</option>`).join("");
        const roundOptions = Array.from(new Set(requests.map(request => request.round_name).filter(Boolean)))
            .sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: "base" }))
            .map(round => `<option value="${escapeHtml(round)}">${escapeHtml(round)}</option>`).join("");
        const rows = requests.map(request => {
            const status = getCollectionStatus(request);
            const isPreOptInStage = ["chair_review", "chair_clarification", "chair_complete", "admin_clarification", "admin_accepted", "admin_denied"].includes(request.workflow_stage);
            const availability = isPreOptInStage
                ? (request.workflow_stage === "admin_denied" ? "Not applicable" : request.workflow_stage === "chair_complete" ? "Pending final approval" : "Not yet scheduled")
                : request.submitted === "true" && request.decision === "opt_in"
                ? "Available now"
                : request.submitted === "true" && request.decision === "opt_out"
                    ? "Not applicable"
                    : `After ${formatDateTime(request.closes_at_utc)}`;
            return `
                <tr class="data-manager-request-row" data-study="${escapeHtml(request.study_acronym || request.study_name)}" data-round="${escapeHtml(request.round_name)}" data-search="${escapeHtml([getConceptName(request), getConceptId(request), request.study_acronym, request.study_name, request.round_name, request.consortium_id, request.chair_score, status.label].join(" ").toLowerCase())}">
                    <td style="min-width: 280px;"><div class="d-flex align-items-start gap-2"><span class="flex-grow-1 text-wrap">${escapeHtml(getConceptName(request))}</span>${request.concept_box_id ? `<button class="btn btn-sm custom-btn data-manager-concept-preview" type="button" data-file-id="${escapeHtml(request.concept_box_id)}" title="Preview concept" aria-label="Preview ${escapeHtml(getConceptName(request))}"><i class="fas fa-external-link-alt"></i></button>` : ""}</div><div class="small text-muted">ID: ${escapeHtml(getConceptId(request))}</div></td>
                    <td><div class="fw-semibold">${escapeHtml(request.study_acronym || request.study_id)}</div><div class="small text-muted">${escapeHtml(request.study_name)}</div></td>
                    <td>${escapeHtml(request.round_name)}</td>
                    <td class="text-nowrap"><span class="fw-semibold">${escapeHtml(request.chair_score || "--")}</span><div class="small text-muted">${escapeHtml(request.consortium_id || "--")}</div></td>
                    <td><span class="badge ${status.className}">${escapeHtml(status.label)}</span><div class="small text-muted mt-1">${escapeHtml(status.detail)}</div></td>
                    <td class="text-nowrap">${escapeHtml(availability)}${request.closes_at_utc ? `<div class="small text-muted">Decision deadline: ${escapeHtml(formatDateTime(request.closes_at_utc))}</div>` : ""}</td>
                </tr>`;
        }).join("");

        container.innerHTML = `
            <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
                <input id="dataManagerRequestSearch" type="search" class="form-control" style="max-width: 420px;" placeholder="Search concepts, IDs, studies, rounds, or status" aria-label="Search data collection requests">
                <select id="dataManagerRoundFilter" class="form-select" style="max-width: 260px;" aria-label="Filter by round"><option value="">All rounds</option>${roundOptions}</select>
                <select id="dataManagerStudyFilter" class="form-select" style="max-width: 240px;" aria-label="Filter by study"><option value="">All of my studies</option>${studyOptions}</select>
                <span id="dataManagerRequestCount" class="small text-muted ms-auto"></span>
            </div>
            <div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead class="table-light"><tr><th>Concept</th><th>Study</th><th>Round</th><th>Consortium score</th><th>Current stage</th><th>Expected availability</th></tr></thead><tbody>${rows}</tbody></table></div>`;

        const applyFilters = () => {
            const search = document.getElementById("dataManagerRequestSearch")?.value.trim().toLowerCase() || "";
            const round = document.getElementById("dataManagerRoundFilter")?.value || "";
            const study = document.getElementById("dataManagerStudyFilter")?.value || "";
            let visible = 0;
            container.querySelectorAll(".data-manager-request-row").forEach(row => {
                const show = (!round || row.dataset.round === round)
                    && (!study || row.dataset.study === study)
                    && (!search || (row.dataset.search || "").includes(search));
                row.classList.toggle("d-none", !show);
                if (show) visible++;
            });
            const count = document.getElementById("dataManagerRequestCount");
            if (count) count.textContent = `${visible} request${visible === 1 ? "" : "s"}`;
        };
        document.getElementById("dataManagerRequestSearch")?.addEventListener("input", applyFilters);
        document.getElementById("dataManagerRoundFilter")?.addEventListener("change", applyFilters);
        document.getElementById("dataManagerStudyFilter")?.addEventListener("change", applyFilters);
        applyFilters();

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
