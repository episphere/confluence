import { listComments } from "../shared.js";

const escapeHtml = value => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
const isReply = comment => /^Response ID:/i.test(comment.message || "");
const targetId = comment => String(comment.message || "").match(/Box Comment ID:\s*(\w+)/i)?.[1] || String(comment.id || "");
const replyTarget = comment => String(comment.message || "").match(/^Response ID:\s*([^,\s]+)/i)?.[1] || "";
const replyText = comment => String(comment.message || "").replace(/^Response ID:\s*[^,]+,\s*/i, "");

const readAllComments = async id => {
    const comments = [];
    let offset = 0;
    while (true) {
        const response = await listComments(id, offset);
        const data = typeof response === "string" ? JSON.parse(response) : response;
        if (!Array.isArray(data?.entries)) throw new Error(`Cannot read comments on Box file ${id}.`);
        comments.push(...data.entries);
        offset += data.entries.length;
        if (!Number.isFinite(data.total_count) || offset >= data.total_count) return comments;
        if (!data.entries.length) throw new Error(`Incomplete comment history on Box file ${id}.`);
    }
};

export const loadDataManagerDiscussion = async request => {
    let snapshot = null;
    if (request.discussion_snapshot) {
        try { snapshot = typeof request.discussion_snapshot === "string" ? JSON.parse(request.discussion_snapshot) : request.discussion_snapshot; }
        catch (error) { /* A live read can recover an invalid published snapshot. */ }
    }
    const ids = [...new Set([request.concept_box_id, request.chair_file_id, request.response_file_id, ...(snapshot?.source_file_ids || [])].filter(Boolean).map(String))];
    if (!ids.length) throw new Error("No discussion source files are available.");
    const results = await Promise.allSettled(ids.map(readAllComments));
    const errors = results.flatMap((result, index) => result.status === "rejected" ? [`Box file ${ids[index]}: ${result.reason.message || result.reason}`] : []);
    const liveComments = results.flatMap(result => result.status === "fulfilled" ? result.value : []);
    // Published comments remain readable through the consortium's index even
    // when a manager cannot open the submitter's private returned-file folder.
    const allComments = errors.length ? [...(Array.isArray(snapshot?.comments) ? snapshot.comments : []), ...liveComments] : liveComments;
    const comments = Array.from(new Map(allComments.filter(comment => comment?.message).map(comment => [String(comment.id || `${comment.created_at}|${comment.message}`), {
        id: comment.id, message: comment.message, created_at: comment.created_at,
        created_by: { name: comment.created_by?.name, login: comment.created_by?.login }
    }])).values()).sort((a, b) => (Date.parse(a.created_at) || 0) - (Date.parse(b.created_at) || 0));
    return { comments, source_file_ids: ids, errors, checked_at_utc: new Date().toISOString(),
        response_lookup_complete: Boolean(request.response_lookup_complete || request.response_file_id || snapshot?.response_lookup_complete),
        published_at_utc: snapshot?.checked_at_utc || "", uses_published_comments: Boolean(errors.length && snapshot?.comments?.length) };
};

export const renderDataManagerDiscussion = discussion => {
    const author = comment => escapeHtml(comment.created_by?.name || comment.created_by?.login || "Unknown author");
    const date = comment => escapeHtml(comment.created_at ? new Date(comment.created_at).toLocaleString() : "Date unavailable");
    const replyMarkup = reply => `<div class="bg-light border-start border-primary border-3 p-2 mt-2"><div class="small fw-semibold">Submitter reply from ${author(reply)} (${date(reply)})</div><p class="mb-0 text-break" style="white-space: pre-wrap;">${escapeHtml(replyText(reply))}</p></div>`;
    const replies = discussion.comments.filter(isReply);
    const seen = new Set();
    const sourceComments = discussion.comments.filter(comment => {
        if (isReply(comment)) return false;
        const id = targetId(comment);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
    });
    const matched = new Set();
    const threads = sourceComments.map(comment => {
        const responses = replies.filter(reply => replyTarget(reply) === targetId(comment) || replyTarget(reply) === String(comment.id));
        responses.forEach(reply => matched.add(reply));
        return `<div class="border-bottom pb-2 mb-2"><p class="text-primary small mb-0">${author(comment)}</p><p class="my-0 text-break" style="white-space: pre-wrap;">${escapeHtml(comment.message)}</p><p class="small mb-0 text-muted">${date(comment)}</p>${responses.map(replyMarkup).join("")}</div>`;
    }).join("");
    const orphanReplies = replies.filter(reply => !matched.has(reply));
    const warnings = [
        !discussion.response_lookup_complete ? "The submitter reply source has not been verified. An administrator should publish the latest chair status and replies." : "",
        discussion.errors.length ? discussion.uses_published_comments ? `Showing published discussion from ${new Date(discussion.published_at_utc).toLocaleString()}. Latest comments could not be verified on every source file.` : "Some discussion files could not be read. Submitter replies may be missing." : ""
    ].filter(Boolean);
    return `${warnings.map(message => `<div class="alert alert-warning small">${escapeHtml(message)}</div>`).join("")}
        <div class="small text-muted mb-2">${replies.length} submitter repl${replies.length === 1 ? "y" : "ies"} available. ${discussion.errors.length || !discussion.response_lookup_complete ? "Visibility check incomplete." : "Comment and reply sources checked."}</div>
        ${threads}${orphanReplies.length ? `<div class="mb-2"><strong class="small">Additional submitter replies</strong>${orphanReplies.map(replyMarkup).join("")}</div>` : ""}
        ${!discussion.comments.length ? '<span class="text-muted">No comments or replies were found in the available sources.</span>' : ""}
        <button type="button" class="btn btn-sm btn-outline-secondary mt-2 data-manager-retry-comments">Refresh comments and replies</button>`;
};
