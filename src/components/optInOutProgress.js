import { loadOptInOutProgressRows } from "../optInOutStore.js";
import { dataManagersInfo, emailsAllowedToUpdateData } from "../shared.js";

const escapeHtml = value => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
const formatDate = value => Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }) : "Not scheduled";
const dateKey = value => Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleDateString("en-CA", { timeZone: "America/New_York" }) : "";
const submittedDecision = row => String(row.submitted) === "true" && ["opt_in", "opt_out"].includes(row.decision);

export const summarizeOptInOutRounds = (rows, now = Date.now()) => {
    const groups = new Map();
    for (const row of rows) {
        const started = row.round_status !== "not_started" && Boolean(row.selection_file_id || row.workflow_stage === "opt_in_out");
        const key = JSON.stringify([row.round_id, row.consortium_id, started ? row.opens_at_utc || "" : "", started ? row.closes_at_utc || "" : "", started]);
        if (!groups.has(key)) groups.set(key, { key, roundId: row.round_id, roundName: row.round_name || row.round_id,
            consortium: row.consortium_id, opensAt: started ? row.opens_at_utc : "", closesAt: started ? row.closes_at_utc : "",
            initiatedAt: started ? row.initiated_at_utc : "", initiatedBy: started ? row.initiated_by_email : "", started, assignments: [] });
        groups.get(key).assignments.push(row);
    }
    return Array.from(groups.values(), group => {
        const unique = new Map(group.assignments.map(row => [JSON.stringify([row.study_id, row.concept_box_id]), row]));
        const assignments = Array.from(unique.values());
        const total = group.started ? assignments.length : 0;
        const optedIn = assignments.filter(row => submittedDecision(row) && row.decision === "opt_in").length;
        const optedOut = assignments.filter(row => submittedDecision(row) && row.decision === "opt_out").length;
        const unavailable = group.started ? assignments.filter(row => row.decision === "unavailable" || row.provision_status === "error").length : 0;
        const pending = Math.max(0, total - optedIn - optedOut - unavailable);
        const opens = Date.parse(group.opensAt), closes = Date.parse(group.closesAt);
        const validPeriod = Number.isFinite(opens) && Number.isFinite(closes) && closes > opens;
        const period = !group.started ? "Not started" : !validPeriod ? "Dates unavailable" : now < opens ? "Scheduled" : now > closes ? "Ended" : "Open";
        const status = !group.started ? "Not started" : unavailable || !validPeriod ? "Needs attention" : total && optedIn + optedOut === total ? "Completed"
            : period === "Ended" ? "Ended with pending decisions" : period === "Scheduled" ? "Scheduled" : "In progress";
        return { ...group, assignments, total, optedIn, optedOut, unavailable, pending, period, status,
            overdue: period === "Ended" ? pending : 0,
            responseRate: total ? Math.round((optedIn + optedOut) / total * 100) : 0,
            studies: new Set(assignments.map(row => row.study_id)).size,
            concepts: new Set(assignments.map(row => row.concept_box_id)).size };
    });
};

export const buildOptInOutEmailDraft = (summary, roundSummaries) => {
    const isTest = consortium => dataManagersInfo.some(manager => manager.isTest && manager.consortium === consortium);
    const testMode = isTest(summary.consortium);
    const recipients = [...new Set((testMode ? dataManagersInfo.filter(manager => manager.isTest && manager.consortium === summary.consortium).map(manager => manager.email)
        : [...dataManagersInfo.filter(manager => !manager.isTest).map(manager => manager.email), ...emailsAllowedToUpdateData]).filter(Boolean))];
    const body = [`${testMode ? "TEST — " : ""}Opt-In/Out update: ${summary.roundName}`, "", ...roundSummaries.filter(item => item.roundId === summary.roundId && isTest(item.consortium) === testMode).map(item =>
        `${item.consortium}: ${item.status}. Period: ${formatDate(item.opensAt)} to ${formatDate(item.closesAt)} Eastern Time. ${item.optedIn} opted in; ${item.optedOut} opted out; ${item.pending} pending; ${item.unavailable} unavailable. ${item.responseRate}% of ${item.total} study/concept decisions submitted. Initiated by ${item.initiatedBy || "not recorded"}.`),
    "", "Please review pending decisions and confirm progress with the other data managers."].join("\n");
    return `mailto:${recipients.map(encodeURIComponent).join(",")}?subject=${encodeURIComponent(`${testMode ? "TEST — " : ""}Confluence ${summary.roundName}: Opt-In/Out status`)}&body=${encodeURIComponent(body)}`;
};

export const mountOptInOutProgress = async (host, managerView = false) => {
    if (!host || host.dataset.loading === "true") return;
    host.dataset.loading = "true";
    const previous = Object.fromEntries(Array.from(host.querySelectorAll("[data-progress-filter]"), control => [control.dataset.progressFilter, control.value]));
    try {
        const summaries = summarizeOptInOutRounds(await loadOptInOutProgressRows(managerView));
        const options = (values, selected) => Array.from(new Set(values)).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
            .map(value => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`).join("");
        host.innerHTML = `
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2"><h2 class="h5 mb-0">Opt-In/Out round progress</h2><button class="btn btn-outline-secondary btn-sm" type="button" data-progress-refresh>Refresh progress</button></div>
            <p class="small text-muted">Times are Eastern Time. Counts represent study/concept decisions. Completed means every decision was submitted; Ended means the closing time has passed. Accepted concepts published to data managers appear as Not started until initiation.</p>
            <div class="d-flex flex-wrap gap-2 align-items-end mb-3">
                <div><label class="small" for="progressRound">Round</label><select class="form-select form-select-sm" id="progressRound" data-progress-filter="round"><option value="">All rounds</option>${options(summaries.map(item => item.roundName), previous.round)}</select></div>
                <div><label class="small" for="progressConsortium">Consortium</label><select class="form-select form-select-sm" id="progressConsortium" data-progress-filter="consortium"><option value="">All consortia</option>${options(summaries.map(item => item.consortium), previous.consortium)}</select></div>
                <div><label class="small" for="progressStatus">Status</label><select class="form-select form-select-sm" id="progressStatus" data-progress-filter="status"><option value="">All statuses</option>${options(summaries.map(item => item.status), previous.status)}</select></div>
                <div><label class="small" for="progressFrom">Period overlaps from</label><input class="form-control form-control-sm" type="date" id="progressFrom" data-progress-filter="from" value="${escapeHtml(previous.from || "")}"></div>
                <div><label class="small" for="progressTo">Through</label><input class="form-control form-control-sm" type="date" id="progressTo" data-progress-filter="to" value="${escapeHtml(previous.to || "")}"></div>
                <div><label class="small" for="progressSort">Sort by</label><select class="form-select form-select-sm" id="progressSort" data-progress-filter="sort">${options(["Round", "Opening time", "Closing time", "Most pending", "Lowest response rate"], previous.sort || "Round")}</select></div>
            </div>
            <div data-progress-counts class="d-flex flex-wrap gap-3 border rounded p-2 mb-2 small" role="status"></div>
            <div class="table-responsive"><table class="table table-sm table-bordered align-middle"><thead class="table-light"><tr><th>Round / consortium</th><th>Period (ET)</th><th>Status / owner</th><th>Studies / concepts</th><th>Opted in</th><th>Opted out</th><th>Pending</th><th>Unavailable</th><th>Submitted</th><th>Communication</th></tr></thead><tbody data-progress-rows></tbody></table></div>
            <div class="small text-muted">Last refreshed ${escapeHtml(formatDate(new Date().toISOString()))} ET. Email links open a draft for review.</div>`;
        const render = () => {
            const filters = Object.fromEntries(Array.from(host.querySelectorAll("[data-progress-filter]"), control => [control.dataset.progressFilter, control.value]));
            const filtered = summaries.filter(item => (!filters.round || item.roundName === filters.round) && (!filters.consortium || item.consortium === filters.consortium)
                && (!filters.status || item.status === filters.status)
                && (!filters.from || (dateKey(item.closesAt) && dateKey(item.closesAt) >= filters.from))
                && (!filters.to || (dateKey(item.opensAt) && dateKey(item.opensAt) <= filters.to)));
            filtered.sort((a, b) => {
                if (filters.sort === "Most pending") return b.pending - a.pending;
                if (filters.sort === "Lowest response rate") return a.responseRate - b.responseRate;
                if (["Opening time", "Closing time"].includes(filters.sort)) {
                    const field = filters.sort === "Opening time" ? "opensAt" : "closesAt";
                    return (Date.parse(a[field]) || Infinity) - (Date.parse(b[field]) || Infinity);
                }
                return String(a.roundName).localeCompare(String(b.roundName), undefined, { numeric: true }) || String(a.consortium).localeCompare(String(b.consortium));
            });
            const total = field => filtered.reduce((sum, item) => sum + item[field], 0);
            host.querySelector("[data-progress-counts]").innerHTML = `<span><strong>${filtered.length}</strong> consortium periods</span><span><strong>${filtered.filter(item => item.status === "Not started").length}</strong> not started</span><span><strong>${filtered.filter(item => item.period === "Open").length}</strong> open</span><span><strong>${filtered.filter(item => item.status === "Completed").length}</strong> completed</span><span><strong>${total("pending")}</strong> pending (${total("overdue")} overdue)</span><span><strong>${total("unavailable")}</strong> unavailable</span><span><strong>${total("optedIn")} / ${total("optedOut")}</strong> in / out</span>`;
            host.querySelector("[data-progress-rows]").innerHTML = filtered.map(item => {
                const owners = dataManagersInfo.filter(manager => manager.consortium === item.consortium).map(manager => manager.name || manager.email).join(", ");
                return `<tr><td><strong>${escapeHtml(item.roundName)}</strong><br>${escapeHtml(item.consortium)}</td>
                    <td>${escapeHtml(formatDate(item.opensAt))}<br>to ${escapeHtml(formatDate(item.closesAt))}<div class="small text-muted">${escapeHtml(item.period)}</div></td>
                    <td><strong>${escapeHtml(item.status)}</strong><div class="small">${escapeHtml(owners || "No manager configured")}</div><div class="small text-muted">Initiated: ${escapeHtml(item.initiatedBy || "Not recorded")}<br>${item.initiatedAt ? escapeHtml(formatDate(item.initiatedAt)) : ""}</div></td>
                    <td>${item.started ? item.studies : "Not assigned"} / ${item.concepts}</td><td>${item.optedIn}</td><td>${item.optedOut}</td><td>${item.pending}</td><td>${item.unavailable}</td><td>${item.started ? `${item.responseRate}%<br><span class="small">${item.optedIn + item.optedOut} / ${item.total}</span>` : "Not started"}</td>
                    <td><a class="btn btn-sm btn-outline-primary" href="${escapeHtml(buildOptInOutEmailDraft(item, summaries))}">Draft round update</a></td></tr>
                    <tr><td colspan="10"><details><summary class="small">Study decisions for ${escapeHtml(item.roundName)} / ${escapeHtml(item.consortium)}</summary><ul class="small mb-0">${item.assignments.map(row => `<li>${escapeHtml(row.study_acronym || row.study_id)} — ${escapeHtml(row.concept_title || row.concept_box_id)}: <strong>${!item.started ? "Not started" : row.decision === "unavailable" ? "Unavailable" : submittedDecision(row) ? row.decision === "opt_in" ? "Opted in" : "Opted out" : "Pending"}</strong>${row.submitted_by_email ? `; submitted by ${escapeHtml(row.submitted_by_email)} at ${escapeHtml(formatDate(row.submitted_at_utc || row.updated_at_utc))}` : ""}</li>`).join("")}</ul></details></td></tr>`;
            }).join("") || '<tr><td colspan="10" class="text-muted">No periods match these filters.</td></tr>';
        };
        host.querySelectorAll("[data-progress-filter]").forEach(control => control.addEventListener("change", render));
        host.querySelector("[data-progress-refresh]").addEventListener("click", () => mountOptInOutProgress(host, managerView));
        render();
    } catch (error) {
        host.innerHTML = `<div class="alert alert-warning">Round progress is unavailable: ${escapeHtml(error.message || error)} <button type="button" class="btn btn-sm btn-outline-secondary" data-progress-retry>Retry</button></div>`;
        host.querySelector("[data-progress-retry]").addEventListener("click", () => mountOptInOutProgress(host, managerView));
    } finally {
        delete host.dataset.loading;
    }
};
