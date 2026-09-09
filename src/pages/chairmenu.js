import { showPreview } from "../components/boxPreview.js";
import { switchTabs, switchFiles } from "../event.js";
import { showCommentsSub, showCommentsSub2, showAnimation, readDocFile, extractContactInvestigators, extractRequestedConsortia, getCollaboration, getFolderItems, getAllFilesRecursive, chairsInfo, studiesInfo, messagesForChair, getTaskList, createCompleteTask, assignTask, updateTaskAssignment, createComment, getFileInfo, getFolderInfo, moveFile, addNewCollaborator, copyFile, acceptedFolder, deniedFolder, submitterFolder, showCommentsDropDown, archivedFolder, deleteTask, showCommentsDCEG, hideAnimation, getFileURL, returnToSubmitterFolder, createFolder, completedFolder, listComments, getFile, addMetaData, DACCmembers, csv2Json, Confluence_Data_Platform_Metadata_Shared_with_Investigators, Confluence_Data_Platform_Events_Page_Shared_with_Investigators, showComments, showCommentsWithResponses, findResponseForComment, extractResponseText, getFileVersions, downloadFile, refreshToken, emailsAllowedToUpdateData, uploadFile, uploadFileVersion, addConceptIdSuffixToFileName, getConceptIdFromFileName, normalizeConceptFileNamePunctuation, removeRoundSuffixFromFileName, getRoundNumberFromFileName } from "../shared.js";
import { publishDataManagerChairRequests, updateDataManagerChairStatus } from "../optInOutStore.js";

const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getConceptId = (file, fallbackId = "") => {
    const filenameId = getConceptIdFromFileName(file && (file.name || file.filename || file.fileInfo?.name));
    const explicitId = [file?.assignedConceptId, file?.conceptId, fallbackId]
        .map(value => String(value || ""))
        .find(value => /^R\d+_\d+$/i.test(value));
    return filenameId || explicitId || "";
};

const getConceptBoxId = (file, fallbackId = "") => String(
    file?.conceptId || file?.masterFileId || file?.commentsFileId || fallbackId || file?.id || ""
);

const renderBoxFileLink = (boxId) => boxId
    ? `<a href="https://nih.app.box.com/file/${encodeURIComponent(boxId)}" target="_blank" rel="noopener noreferrer">${escapeHtml(boxId)}</a>`
    : "--";

const getConceptTitleFromFileName = (fileName) => removeRoundSuffixFromFileName(fileName)
    .replace(/\.[^/.]+$/, "")
    .replace(/_\d{4}-\d{2}-\d{2}$/, "");

const getRoundNumberFromRoundName = (roundName) => {
    const match = String(roundName || "").match(/^Round[_\s-]*(\d+)/i);
    return match ? Number(match[1]) : null;
};

const getConceptRoundNumber = (file) => {
    const filenameRound = getRoundNumberFromFileName(file && (file.name || file.filename || file.fileInfo?.name));
    if (filenameRound) return filenameRound;
    const explicitRound = Number(file && file.roundNumber);
    if (Number.isFinite(explicitRound) && explicitRound > 0) return explicitRound;
    return getRoundNumberFromRoundName(file && (file.roundName || file.fileInfo?.parent?.name));
};

const getConceptRoundLabel = (file) => {
    const roundNumber = getConceptRoundNumber(file);
    return roundNumber ? `R${roundNumber}` : "--";
};

const sortConceptsByRoundAndId = (files) => {
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
    return [...(Array.isArray(files) ? files : [])].sort((left, right) => {
        const leftRound = getConceptRoundNumber(left) || Number.MAX_SAFE_INTEGER;
        const rightRound = getConceptRoundNumber(right) || Number.MAX_SAFE_INTEGER;
        if (leftRound !== rightRound) return leftRound - rightRound;

        const leftId = getConceptId(left);
        const rightId = getConceptId(right);
        if (leftId && rightId) {
            const idComparison = collator.compare(leftId, rightId);
            if (idComparison) return idComparison;
        } else if (leftId) return -1;
        else if (rightId) return 1;

        return collator.compare(String(left?.name || left?.filename || ""), String(right?.name || right?.filename || ""));
    });
};

const getChairConceptMetadataLabel = (file, fallbackId = "") =>
    `ID: ${getConceptId(file, fallbackId) || "Not available"}`;

const renderConceptSearch = (inputId, statusId, actionsHtml = "") => `
    <div class="main-summary-row align-items-center gap-2 mb-2">
        <div class="input-group" style="max-width: 520px;">
            <input type="search" class="form-control rounded" autocomplete="off" placeholder="Search concepts, IDs, or investigators (min. 3 characters)" aria-label="Search concepts, IDs, or investigators" id="${inputId}" aria-describedby="${statusId}">
            <span class="input-group-text border-0"><i class="fas fa-search"></i></span>
        </div>
        <div id="${statusId}" class="small text-muted ms-2 align-self-center" aria-live="polite"></div>
        ${actionsHtml}
    </div>`;

const setupConceptSearch = (inputId, statusId, rowSelector) => {
    const input = document.getElementById(inputId);
    const status = document.getElementById(statusId);
    if (!input) return;

    const applySearch = () => {
        const query = input.value.trim().toLowerCase();
        const rows = Array.from(document.querySelectorAll(rowSelector));
        let visibleCount = 0;
        rows.forEach(row => {
            const investigators = row.querySelector('[id^="investigators"]')?.textContent || "";
            const searchableText = `${row.dataset.searchText || ""} ${investigators}`.toLowerCase();
            const matches = query.length < 3 || searchableText.includes(query);
            row.classList.toggle("d-none", !matches);
            if (matches) visibleCount++;
        });

        if (!status) return;
        if (query.length > 0 && query.length < 3) status.textContent = "Enter at least 3 characters.";
        else if (query.length >= 3) status.textContent = `${visibleCount} matching concept${visibleCount === 1 ? "" : "s"}`;
        else status.textContent = "";
    };

    input.addEventListener("input", applySearch);
    input.applyConceptSearch = applySearch;
};

const refreshConceptSearch = (inputId) => {
    const input = document.getElementById(inputId);
    if (input && typeof input.applyConceptSearch === "function" && input.value.trim().length >= 3) input.applyConceptSearch();
};

export function renderFilePreviewDropdown(files, tab, hideDownloadAll = false) {
    let template = "";
    const showReplyStatus = tab === "conceptNeedingClarification";
    const replyStatusLegend = showReplyStatus
        ? `<span class="d-flex flex-wrap column-gap-3 row-gap-1 small text-muted mt-1"><span class="text-nowrap">&#128309; = Submitter responses require DACC review</span><span class="text-nowrap">&#128994; = DACC reviewed responses; requires further clarification</span></span>`
        : "";
    
    if (!Array.isArray(files)) { return template; }
    if (files.length != 0) {
        if (!hideDownloadAll) {
            template += `
        <button style="margin-right: 10px; float: right" id='${tab}-download-selection' class='btn btn-dark'>Download Select</button>`;
        }
        template += `
        <div class='card-body p-0'>
          <div class='card-title' style='display: flex; gap: 20px; align-items: flex-start;'>
            <div>
              <label for='${tab}selectedDoc'>
                  <b>Select Concept Form:</b>${replyStatusLegend}
              </label>
              <br>
              <select class="form-select" aria-label="Select Document to Review" id='${tab}selectedDoc'>`;
      for (const file of files) {
        const fileId = file.id;
        const conceptId = getConceptId(file, fileId);
        let filename = file.name;
        let titlename = getConceptTitleFromFileName(filename);
        
        const replyStatus = showReplyStatus && file.clarificationReplyStatus === "submitter-response"
            ? "&#128309; "
            : showReplyStatus && file.clarificationReplyStatus === "dacc-reviewed"
                ? "&#128994; "
                : "";
        template += `
            <option value='${fileId}'>
            ${replyStatus}${escapeHtml(conceptId || "ID unavailable")} &mdash; ${escapeHtml(titlename)}</option>`;
      }
      template += `
              </select>
              <div id="${tab}ConceptId" class="small text-muted mt-1">${escapeHtml(getChairConceptMetadataLabel(files[0], files[0] && files[0].id))}</div>
            </div>
            <div style='display: none;' id='${tab}versionContainer'>
              <label for='${tab}versionSelect'>
                  <b>Select Version:</b>
              </label>
              <br>
              <select class="form-select" aria-label="Select Version" id='${tab}versionSelect' style='width: 250px;'>
                  <option value='current'>Current Version</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      `;
    } else {
        template += `
            <br>
            No files to preview.    
        </div>
        `;
    }
    
    return template;
};

const getDownloadFileTitle = (file) => {
    const filename = file && file.name ? file.name : "Untitled file";
    return getConceptTitleFromFileName(filename);
};

export const getMergedConceptDownloadName = (file) => {
    const filename = removeRoundSuffixFromFileName(file && file.name ? file.name : "");
    const filenameWithoutExtension = filename.replace(/\.[^/.]+$/, "");
    const titleAndDate = filenameWithoutExtension.match(/^(.*)_(\d{4}-\d{2}-\d{2})$/);
    const conceptId = getConceptId(file);
    const roundLabel = getConceptRoundLabel(file);
    const metadataSuffix = conceptId || (roundLabel !== "--" ? roundLabel : "");
    const downloadMetadataSuffix = metadataSuffix ? `_${metadataSuffix}` : "";

    if (!titleAndDate) {
        const fallbackName = getDownloadFileTitle(file).replace(/\.[^/.]+$/, "");
        return `${fallbackName || (file && file.id) || "concept"}${downloadMetadataSuffix}.doc`;
    }

    const shortTitle = titleAndDate[1].trim().split(/\s+/).slice(0, 5).join(" ");
    return `${shortTitle}_${titleAndDate[2]}${downloadMetadataSuffix}.doc`;
};

export const getMergedConceptMetadata = (file) => ({
    round: getConceptRoundLabel(file),
    conceptId: getConceptId(file) || "Not available"
});

const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

let jsZipPromise = null;

const loadJSZip = async () => {
    if (!jsZipPromise) {
        jsZipPromise = import("https://cdn.skypack.dev/jszip")
            .then(module => module.default)
            .catch(error => {
                jsZipPromise = null;
                throw error;
            });
    }
    return jsZipPromise;
};

const getSelectedConceptsZipName = () => {
    const date = new Date();
    const localDate = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
    return `DACC_Selected_Concepts_${localDate}.zip`;
};

const getUniqueZipEntryName = (filename, usedNames) => {
    let uniqueName = filename;
    let suffix = 2;
    const extensionIndex = filename.lastIndexOf(".");
    const baseName = extensionIndex > 0 ? filename.slice(0, extensionIndex) : filename;
    const extension = extensionIndex > 0 ? filename.slice(extensionIndex) : "";

    while (usedNames.has(uniqueName.toLowerCase())) {
        uniqueName = `${baseName} (${suffix})${extension}`;
        suffix++;
    }
    usedNames.add(uniqueName.toLowerCase());
    return uniqueName;
};

const normalizeConceptDocumentHtml = (html) => {
    const valueHeadingLabels = [
        "Revision Status",
        "Date",
        "Project Title",
        "Is this an amendment",
        "Amendment",
        "Contact Investigator(s)",
        "Institution(s)",
        "Contact Email",
        "Member of Consortia or Study / Trial Group?",
        "Confluence Study Acronym(s) for the Contact Investigator",
        "OTHER Investigators and their institutions",
        "ALL Investigators (and Institutions) who require access",
        "Consortia or Study / Trial Group data being requested",
        "Primary Endpoint",
        "Subtype of Breast Cancer",
        "Other Primary Endpoint",
        "Genotyping",
        "Data Requested From",
        "Carrier Status requested",
        "Risk Factor Variables",
        "Pathology Variables",
        "Survival and Treatment Variables",
        "Mammographic Density Variable",
        "Confluence authorship requirements"
    ];
    const sectionHeadingLabels = [
        "Concept Background",
        "Concept Aims",
        "Description of Analysis Plan",
        "Time Plan",
        "Any other considerations you would like the DACC to be aware of"
    ];
    const knownHeadingLabels = [...valueHeadingLabels, ...sectionHeadingLabels]
        .sort((a, b) => b.length - a.length);
    const normalizeText = (value) => value.replace(/\s+/g, " ").trim();
    const getMatchingLabel = (text, labels = knownHeadingLabels) => {
        const normalizedText = normalizeText(text).toLowerCase();
        return labels.find(label => {
            const normalizedLabel = label.toLowerCase();
            if (!normalizedText.startsWith(normalizedLabel)) return false;
            const nextCharacter = normalizedText.charAt(normalizedLabel.length);
            return nextCharacter === "" || nextCharacter === ":" || (label.endsWith("?") && /\s/.test(nextCharacter));
        });
    };
    const getValueAfterLabel = (text, label) => {
        const value = normalizeText(text).slice(label.length);
        return value.replace(/^:\s*/, "").trim();
    };

    const template = document.createElement("template");
    template.innerHTML = html;
    template.content.querySelectorAll("h2, h3").forEach((heading) => {
        if (!heading.parentNode) return;
        const text = normalizeText(heading.textContent);
        const label = getMatchingLabel(text, valueHeadingLabels);
        if (!label) return;

        const valueParts = [];
        const inlineValue = getValueAfterLabel(text, label);
        if (inlineValue) valueParts.push(inlineValue);

        let nextElement = heading.nextElementSibling;
        while (nextElement && /H[23]/.test(nextElement.tagName)) {
            const nextText = normalizeText(nextElement.textContent);
            if (!nextText || getMatchingLabel(nextText)) break;
            valueParts.push(nextText);
            const elementToRemove = nextElement;
            nextElement = nextElement.nextElementSibling;
            elementToRemove.remove();
        }

        const paragraph = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = label.endsWith("?") ? `${label} ` : `${label}: `;
        paragraph.appendChild(strong);
        valueParts.forEach((value, index) => {
            if (index > 0) paragraph.appendChild(document.createElement("br"));
            paragraph.appendChild(document.createTextNode(value));
        });
        heading.replaceWith(paragraph);
    });
    return template.innerHTML;
};

export const setupDownloadSelect = (tab, files) => {
    const downloadButton = document.getElementById(`${tab}-download-selection`);
    if (!downloadButton) return;

    const downloadableFiles = Array.isArray(files) ? files.filter(file => file && file.id) : [];
    if (downloadableFiles.length === 0) {
        downloadButton.disabled = true;
        downloadButton.style.opacity = "0.5";
        return;
    }

    downloadButton.addEventListener("click", () => {
        const modalElement = document.getElementById("confluenceMainModal");
        const header = document.getElementById("confluenceModalHeader");
        const body = document.getElementById("confluenceModalBody");
        if (!modalElement || !header || !body) return;

        const downloadModal = bootstrap.Modal.getOrCreateInstance(modalElement);

        header.innerHTML = `
            <h5 class="modal-title">Download Selected Concepts</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        `;

        const checkboxes = downloadableFiles.map((file, index) => {
            const checkboxId = `${tab}-download-file-${file.id}`;
            const fileTitle = getDownloadFileTitle(file);
            return `
                <div class="form-check mb-2">
                    <input class="form-check-input download-selection-checkbox" type="checkbox" id="${checkboxId}" value="${file.id}" checked>
                    <label class="form-check-label" for="${checkboxId}" title="${escapeHtml(file.name)}">
                        ${escapeHtml(fileTitle)}
                    </label>
                </div>
            `;
        }).join("");

        body.innerHTML = `
            <form id="${tab}DownloadSelectionForm">
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="${tab}DownloadSelectAll" checked>
                    <label class="form-check-label font-bold" for="${tab}DownloadSelectAll">Select all</label>
                </div>
                <div class="border rounded p-3 mb-3" style="max-height: 350px; overflow-y: auto;">
                    ${checkboxes}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="submit" name="downloadMode" value="individual" class="btn btn-outline-primary">Download Individually</button>
                    <button type="submit" name="downloadMode" value="zip" class="btn btn-primary">Download as ZIP</button>
                </div>
                <div id="${tab}DownloadSelectionStatus" class="text-muted small mt-2"></div>
            </form>
        `;

        downloadModal.show();

        const selectAll = document.getElementById(`${tab}DownloadSelectAll`);
        const selectedCheckboxes = Array.from(body.querySelectorAll(".download-selection-checkbox"));
        selectAll.addEventListener("change", () => {
            selectedCheckboxes.forEach(checkbox => { checkbox.checked = selectAll.checked; });
        });
        selectedCheckboxes.forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                selectAll.checked = selectedCheckboxes.every(item => item.checked);
            });
        });

        document.getElementById(`${tab}DownloadSelectionForm`).addEventListener("submit", async (event) => {
            event.preventDefault();

            const selectedIds = selectedCheckboxes
                .filter(checkbox => checkbox.checked)
                .map(checkbox => checkbox.value);
            const selectedFiles = downloadableFiles.filter(file => selectedIds.includes(String(file.id)));

            if (selectedFiles.length === 0) {
                alert("Please select at least one file to download.");
                return;
            }

            const downloadMode = event.submitter && event.submitter.value === "zip" ? "zip" : "individual";
            const submitButtons = Array.from(event.target.querySelectorAll("button[type='submit']"));
            const status = document.getElementById(`${tab}DownloadSelectionStatus`);
            submitButtons.forEach(button => { button.disabled = true; });
            showAnimation();

            try {
                const zip = downloadMode === "zip" ? new (await loadJSZip())() : null;
                const usedZipEntryNames = new Set();

                for (let index = 0; index < selectedFiles.length; index++) {
                    const file = selectedFiles[index];
                    if (status) status.textContent = `Preparing ${index + 1} of ${selectedFiles.length}: ${getDownloadFileTitle(file)}`;
                    const mergedBlob = await generateMergedConceptBlob(
                        file,
                        getChairCommentSourceId(file, file.id),
                        file.responseComments || []
                    );
                    if (!mergedBlob) throw new Error(`Unable to prepare ${file.name || file.id}.`);

                    const downloadName = getMergedConceptDownloadName(file);
                    if (zip) {
                        zip.file(getUniqueZipEntryName(downloadName, usedZipEntryNames), mergedBlob);
                    } else {
                        downloadBlob(mergedBlob, downloadName);
                    }
                }

                if (zip) {
                    if (status) status.textContent = "Creating ZIP archive...";
                    const zipBlob = await zip.generateAsync(
                        {
                            type: "blob",
                            compression: "DEFLATE",
                            compressionOptions: { level: 6 }
                        },
                        metadata => {
                            if (status) status.textContent = `Creating ZIP archive: ${Math.round(metadata.percent)}%`;
                        }
                    );
                    downloadBlob(zipBlob, getSelectedConceptsZipName());
                }
                downloadModal.hide();
            } catch (error) {
                console.error("Error downloading selected files:", error);
                alert("Unable to download selected files. Please try again.");
            } finally {
                hideAnimation();
                submitButtons.forEach(button => { button.disabled = false; });
                if (status) status.textContent = "";
            }
        });
    });
};

const getCurrentUserAuth = () => {
    const userEmail = JSON.parse(localStorage.parms).login;
    let authChair = chairsInfo.find(({ email }) => email === userEmail);
    return authChair ? authChair : null;
}

let adminDataCache = null;
const adminDocumentDataCache = new Map();
let adminDocumentHydrationPromise = null;
let chairMenuCache = null;
const ADMIN_ACTION_REQUIRED_FILE_NAME = "Admin_Action_Required.tsv";
const ADMIN_ACTION_REQUIRED_VALUES = new Set(["Move to Accepted", "Move to Declined", "Needs Resending"]);
let adminActionRequiredByFileId = new Map();
let adminActionRequiredByFileName = new Map();
let adminActionRequiredStorage = null;

const updateProgressBar = (percentage, text) => {
    const progressBar = document.getElementById('chairMenuProgressBar');
    const progressText = document.getElementById('chairMenuProgressText');
    const progressContainer = document.getElementById('chairMenuProgress');
    
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('aria-valuenow', percentage);
        progressBar.innerText = `${percentage}%`;
    }
    if (progressText) progressText.innerText = text;
};

const showProgressContainer = () => {
    const chairFileView = document.getElementById('chairFileView');
    if (chairFileView) {
        chairFileView.innerHTML = `
            <div id="chairMenuProgress" class="container mt-5 mb-5">
                <div class="text-center mb-3">
                    <h4>Loading Chair Menu Data</h4>
                    <p class="text-muted">This initial load may take a moment while we sync with Box.</p>
                </div>
                <div class="progress" style="height: 35px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <div id="chairMenuProgressBar" class="progress-bar progress-bar-striped progress-bar-animated bg-primary" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
                </div>
                <div id="chairMenuProgressText" class="text-center mt-2 font-weight-bold color-primary">Initializing...</div>
            </div>
        `;
    }
};

const normalizeBoxFileName = (fileName) => removeRoundSuffixFromFileName(fileName).trim().toLowerCase();

const findMatchingFileByName = (files, fileName) => {
    const normalizedFileName = normalizeBoxFileName(fileName);
    if (!normalizedFileName || !Array.isArray(files)) return null;
    return files.find(file => file && normalizeBoxFileName(file.name) === normalizedFileName) || null;
};

const findRoundByConceptDate = (roundFolders, fileName) => {
    const dateMatch = removeRoundSuffixFromFileName(fileName).match(/_(\d{4}-\d{2}-\d{2})(?:\.[^.]+)?$/);
    if (!dateMatch) return null;
    const conceptDate = Date.parse(`${dateMatch[1]}T00:00:00`);
    if (!Number.isFinite(conceptDate)) return null;
    return roundFolders.find(round => {
        const startDate = Date.parse(round.startDate);
        const endDate = Date.parse(round.endDate);
        return Number.isFinite(startDate) && Number.isFinite(endDate) && conceptDate >= startDate && conceptDate <= endDate;
    }) || null;
};

const getChairCommentSourceId = (file, fallbackId = null) => {
    if (!file) return fallbackId;
    return file.commentsFileId || file.masterFileId || fallbackId || file.id;
};

const showCommentsForChairTab = (file, tab, fallbackId = null) => {
    const selectedFileId = fallbackId || (file && file.id);
    const commentsFileId = getChairCommentSourceId(file, selectedFileId);
    if (!commentsFileId) return;

    if (tab === "conceptNeedingClarification" || tab === "completedConcepts") {
        showCommentsWithResponses(commentsFileId, (file && file.responseComments) || []);
        return;
    }

    showComments(selectedFileId);
};

const getCommentTime = (comment) => {
    const parsedTime = Date.parse(comment && comment.created_at ? comment.created_at : "");
    return Number.isNaN(parsedTime) ? 0 : parsedTime;
};

const getCommentConsortium = (comment) => {
    if (!comment || !comment.message) return "";
    const messageMatch = comment.message.match(/Consortium:\s*([^,]+)/i);
    if (messageMatch) return messageMatch[1].trim();
    return (comment.created_by && chairsInfo.find(chair => chair && chair.email === comment.created_by.login)?.consortium) || "";
};

const isChairDecisionComment = (comment, consortium = null) => {
    if (!comment || !comment.message || comment.message.startsWith('Response ID:')) return false;
    const isChairComment = (comment.created_by && chairsInfo.some(chair => chair && chair.email === comment.created_by.login))
        || comment.message.startsWith('Consortium');
    if (!isChairComment) return false;
    if (!consortium) return true;
    return getCommentConsortium(comment).toLowerCase() === String(consortium).toLowerCase();
};

const requiresSubmitterResponse = (comment) => {
    if (!comment || !comment.message) return false;
    const ratingMatch = comment.message.match(/Rating:\s*(\w+)/i);
    const rating = ratingMatch ? ratingMatch[1].trim() : null;
    return rating && rating !== '1' && rating.toUpperCase() !== 'NA';
};

const getResponseTargetId = (chairComment) => {
    const boxCommentIdMatch = chairComment.message.match(/Box Comment ID:\s*(\w+)/);
    return boxCommentIdMatch ? boxCommentIdMatch[1] : chairComment.id;
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const responseMatchesComment = (responseComment, commentId) => {
    if (!responseComment || !responseComment.message || !commentId) return false;
    const responseIdPattern = new RegExp(`Response ID:\\s*${escapeRegExp(commentId)}(?:\\s*,|\\s|$)`);
    return responseIdPattern.test(responseComment.message);
};

const getClarificationReplyStatus = (chairSourceComments, responseComments, consortium = null) => {
    const chairEntries = Array.isArray(chairSourceComments) ? chairSourceComments : [];
    const responseEntries = Array.isArray(responseComments) ? responseComments : [];
    const scopedChairComments = chairEntries
        .filter(comment => isChairDecisionComment(comment, consortium))
        .filter(requiresSubmitterResponse);
    if (!scopedChairComments.length) return "none";

    const responseTargetIds = new Set(scopedChairComments.map(getResponseTargetId));
    const matchingResponses = responseEntries.filter(responseComment =>
        responseComment && responseComment.message
        && Array.from(responseTargetIds).some(responseId => responseMatchesComment(responseComment, responseId))
    );
    if (!matchingResponses.length) return "none";

    const latestResponseTime = matchingResponses.reduce(
        (latest, responseComment) => Math.max(latest, getCommentTime(responseComment)),
        0
    );
    const latestChairCommentTime = scopedChairComments.reduce(
        (latest, chairComment) => Math.max(latest, getCommentTime(chairComment)),
        0
    );

    return latestChairCommentTime > latestResponseTime ? "dacc-reviewed" : "submitter-response";
};

const areChairCommentsRepliedTo = (chairSourceComments, responseComments, consortium = null) => {
    const chairEntries = Array.isArray(chairSourceComments) ? chairSourceComments : [];
    const responseEntries = Array.isArray(responseComments) ? responseComments : [];
    const scopedChairComments = chairEntries.filter(comment => isChairDecisionComment(comment, consortium));
    const chairComments = scopedChairComments.filter(comment => requiresSubmitterResponse(comment));
    const chairCommentResponseIds = new Set(chairComments.map(getResponseTargetId));
    const scopedResponseEntries = responseEntries.filter(responseComment => {
        if (!responseComment || !responseComment.message) return false;
        return Array.from(chairCommentResponseIds).some(responseId => responseMatchesComment(responseComment, responseId));
    });
    const latestResponseTime = scopedResponseEntries.reduce((latest, responseComment) => Math.max(latest, getCommentTime(responseComment)), 0);
    const hasChairCommentAfterLatestResponse = latestResponseTime > 0
        && scopedChairComments.some(comment => getCommentTime(comment) > latestResponseTime);

    return chairComments.length > 0
        && scopedResponseEntries.length > 0
        && !hasChairCommentAfterLatestResponse
        && chairComments.every(chairComment => {
            const effectiveId = getResponseTargetId(chairComment);
            return responseEntries.some(responseComment => responseMatchesComment(responseComment, effectiveId));
        });
};

const CONSORTIUM_EXPORT_VALUES = ["AABCG", "CIMBA", "LAGENO", "BCAC", "C-NCI", "MERGE"];
const DACC_TABLE_CONSORTIA = ["AABCG", "BCAC", "C-NCI", "CIMBA", "LAGENO", "MERGE"];

const DACC_EXPORT_FIELDS = [
    { key: "requestedConsortia", label: "Consortia Data requested from", selected: true, group: "default" },
    { key: "study", label: "Submitter Study", selected: true, group: "default" },
    { key: "submitter", label: "Submitter", selected: true, group: "default" },
    { key: "email", label: "Email", selected: true, group: "default" },
    { key: "title", label: "Title", selected: true, group: "default" },
    { key: "filename", label: "Filename", selected: true, group: "default" },
    { key: "notes", label: "Notes", selected: true, group: "default" },
    { key: "conceptName", label: "Concept Name", group: "table" },
    { key: "conceptId", label: "ID", group: "table" },
    { key: "submissionDate", label: "Submission Date", group: "table" },
    { key: "state", label: "State", group: "table" },
    ...DACC_TABLE_CONSORTIA.map(consortium => ({ key: `score-${consortium}`, label: consortium, group: "table" })),
    { key: "investigators", label: "Investigator(s)", group: "table" },
    { key: "comments", label: "Comments", group: "table" }
];

const parseRequestedConsortiaValues = (text) => {
    const section = extractRequestedConsortia(text || "");
    if (!section) return [];

    const normalized = section.replace(/\s+/g, " ").trim();
    if (!normalized) return [];

    return CONSORTIUM_EXPORT_VALUES.filter(consortium => new RegExp(`\\b${escapeRegExp(consortium)}\\b`, "i").test(normalized));
};

const extractDaccExportWordFields = (text) => {
    const normalizedText = String(text || "").replace(/\s+/g, " ").trim();
    const extractBetweenLabels = (startLabel, endLabel, searchFrom = 0) => {
        const searchableText = normalizedText.slice(searchFrom);
        const startMatch = new RegExp(`${escapeRegExp(startLabel)}\\s*:?\\s*`, "i").exec(searchableText);
        if (!startMatch) return "";
        const valueStart = startMatch.index + startMatch[0].length;
        const remainingText = searchableText.slice(valueStart);
        const endMatch = new RegExp(escapeRegExp(endLabel), "i").exec(remainingText);
        return (endMatch ? remainingText.slice(0, endMatch.index) : remainingText).trim();
    };
    const amendmentQuestion = /Is this an amendment\s*:?/i.exec(normalizedText);
    const amendmentSearchStart = amendmentQuestion
        ? amendmentQuestion.index + amendmentQuestion[0].length
        : 0;
    const emailSection = extractBetweenLabels("Contact Email", "Member of Consortia or Study / Trial Group");
    const emailAddresses = emailSection.match(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+/gi) || [];

    return {
        requestedConsortia: parseRequestedConsortiaValues(normalizedText).join(", "),
        study: extractBetweenLabels("Confluence Study Acronym(s) for the Contact Investigator", "OTHER Investigators and their institutions"),
        submitter: extractBetweenLabels("Contact Investigator(s)", "Institution(s)"),
        email: [...new Set(emailAddresses)].join(", "),
        title: extractBetweenLabels("Project Title", "Is this an amendment"),
        notes: extractBetweenLabels("Amendment", "Contact Investigator(s)", amendmentSearchStart)
    };
};

const downloadCsvFile = (rows, filename) => {
    const csvContent = rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const parseBoxCommentEntries = (response) => {
    if (!response) return [];
    try {
        const parsed = typeof response === "string" ? JSON.parse(response) : response;
        return Array.isArray(parsed?.entries) ? parsed.entries : [];
    } catch (error) {
        console.warn("Unable to parse Box comments for export:", error);
        return [];
    }
};

const getDaccExportState = (file) => {
    if (String(file?.parent?.id || "") === String(completedFolder)) return "Accepted";
    if (String(file?.parent?.id || "") === String(deniedFolder)) return "Denied";
    return "Ongoing";
};

const formatDaccExportComments = (comments) => comments
    .slice()
    .sort((a, b) => getCommentTime(a) - getCommentTime(b))
    .map(comment => {
        const author = comment?.created_by?.name || comment?.created_by?.login || "Unknown author";
        const createdAt = comment?.created_at ? new Date(comment.created_at).toLocaleString() : "Unknown date";
        return `${author} (${createdAt}): ${comment?.message || ""}`;
    })
    .join("\n\n");

const getDaccExportScores = (comments) => {
    const scores = new Map(DACC_TABLE_CONSORTIA.map(consortium => [consortium, "--"]));
    comments
        .slice()
        .sort((a, b) => getCommentTime(a) - getCommentTime(b))
        .forEach(comment => {
            if (!comment?.message?.startsWith("Consortium")) return;
            const consortium = getCommentConsortium(comment);
            const rating = comment.message.match(/Rating:\s*([^,]+)/i)?.[1]?.trim();
            if (scores.has(consortium) && rating) scores.set(consortium, rating);
        });
    return scores;
};

const getDaccExportConceptData = async (file, selectedFieldKeys) => {
    const selectedKeys = new Set(selectedFieldKeys);
    const needsDocument = ["requestedConsortia", "study", "submitter", "email", "title", "notes", "investigators"]
        .some(key => selectedKeys.has(key));
    const needsComments = selectedKeys.has("comments")
        || DACC_TABLE_CONSORTIA.some(consortium => selectedKeys.has(`score-${consortium}`));
    const commentsFileId = getChairCommentSourceId(file, file.id);
    const responseFileId = file.responseFileId;
    const commentRequests = needsComments ? [listComments(commentsFileId || file.id)] : [];
    if (needsComments && responseFileId && String(responseFileId) !== String(commentsFileId || file.id)) {
        commentRequests.push(listComments(responseFileId));
    }

    const [documentResult, commentResults] = await Promise.all([
        needsDocument ? readDocFile(file.id)
            .then(content => extractDaccExportWordFields(content))
            .catch(error => {
                console.warn(`Unable to read concept fields for ${file.id}:`, error);
                return { documentError: true };
            }) : Promise.resolve({}),
        needsComments ? Promise.allSettled(commentRequests) : Promise.resolve([])
    ]);
    const comments = commentResults.flatMap(result => result.status === "fulfilled" ? parseBoxCommentEntries(result.value) : []);
    const uniqueComments = Array.from(new Map(comments.map(comment => [String(comment?.id || `${comment?.created_at}-${comment?.message}`), comment])).values());

    return {
        wordFields: documentResult,
        investigators: documentResult.documentError ? "Unable to load" : (documentResult.submitter || "Not provided"),
        comments: formatDaccExportComments(uniqueComments),
        scores: getDaccExportScores(uniqueComments)
    };
};

const getDaccExportValue = (fieldKey, file, detail) => {
    const wordFields = detail.wordFields || {};
    const wordFieldKeys = new Set(["requestedConsortia", "study", "submitter", "email", "title", "notes"]);
    if (wordFields.documentError && wordFieldKeys.has(fieldKey)) return "Unable to load";
    if (Object.prototype.hasOwnProperty.call(wordFields, fieldKey)) {
        return wordFields[fieldKey];
    }
    if (fieldKey.startsWith("score-")) return detail.scores.get(fieldKey.slice(6)) || "--";

    const values = {
        filename: file.name || "",
        conceptName: getConceptTitleFromFileName(file.name || ""),
        conceptId: getConceptId(file, file.id),
        round: getConceptRoundLabel(file),
        submissionDate: file.created_at ? new Date(file.created_at).toLocaleString() : "",
        state: getDaccExportState(file),
        investigators: detail.investigators,
        comments: detail.comments || "No comments"
    };
    return values[fieldKey] ?? "";
};

const exportDaccDecisionTable = async (files, button, selectedFieldKeys) => {
    if (!Array.isArray(files) || !files.length) return;
    const selectedFields = DACC_EXPORT_FIELDS.filter(field => selectedFieldKeys.includes(field.key));
    if (!selectedFields.length) return;
    const originalButtonHtml = button.innerHTML;
    const status = document.getElementById("daccDecisionDownloadStatus");
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    if (status) {
        status.className = "small text-muted";
        status.textContent = `Preparing ${files.length} concept${files.length === 1 ? "" : "s"} for download...`;
    }

    try {
        const rows = [selectedFields.map(field => field.label)];
        const CHUNK_SIZE = 6;

        for (let i = 0; i < files.length; i += CHUNK_SIZE) {
            const chunk = files.slice(i, i + CHUNK_SIZE);
            button.textContent = `Preparing ${Math.min(i + chunk.length, files.length)}/${files.length}...`;
            const details = await Promise.all(chunk.map(file => getDaccExportConceptData(file, selectedFieldKeys)));
            chunk.forEach((file, index) => {
                const detail = details[index];
                rows.push(selectedFields.map(field => getDaccExportValue(field.key, file, detail)));
            });
        }

        downloadCsvFile(rows, `dacc_menu_table_${new Date().toISOString().slice(0, 10)}.csv`);
        if (status) {
            status.className = "small text-success";
            status.textContent = `Downloaded ${files.length} concept${files.length === 1 ? "" : "s"}.`;
        }
    } catch (error) {
        console.error("Unable to export the DACC Menu table:", error);
        if (status) {
            status.className = "small text-danger";
            status.textContent = "Unable to prepare the download. Please try again.";
        }
    } finally {
        button.disabled = false;
        button.removeAttribute("aria-busy");
        button.innerHTML = originalButtonHtml;
    }
};

const showDaccExportFieldSelection = (files, button) => {
    const modalElement = document.getElementById("confluenceMainModal");
    const header = document.getElementById("confluenceModalHeader");
    const body = document.getElementById("confluenceModalBody");
    if (!modalElement || !header || !body) return;

    const renderFields = group => DACC_EXPORT_FIELDS
        .filter(field => field.group === group)
        .map(field => `
            <div class="form-check mb-2">
                <input class="form-check-input dacc-export-field" type="checkbox" value="${escapeHtml(field.key)}" id="daccExport-${escapeHtml(field.key)}" ${field.selected ? "checked" : ""}>
                <label class="form-check-label" for="daccExport-${escapeHtml(field.key)}">${escapeHtml(field.label)}</label>
            </div>`)
        .join("");

    header.innerHTML = `
        <h5 class="modal-title">Select Data Points to Download</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`;
    body.innerHTML = `
        <form id="daccExportFieldForm">
            <p class="small text-muted">Choose the columns to include for the ${files.length} visible concept${files.length === 1 ? "" : "s"}. The standard data points are selected by default.</p>
            <div class="row">
                <fieldset class="col-md-6">
                    <legend class="h6">Standard data points</legend>
                    ${renderFields("default")}
                </fieldset>
                <fieldset class="col-md-6">
                    <legend class="h6">Additional table data</legend>
                    ${renderFields("table")}
                </fieldset>
            </div>
            <div id="daccExportFieldError" class="text-danger small mt-2" aria-live="polite"></div>
            <div class="modal-footer px-0 pb-0">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary"><i class="fas fa-download me-1" aria-hidden="true"></i> Download CSV</button>
            </div>
        </form>`;

    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
    document.getElementById("daccExportFieldForm").addEventListener("submit", event => {
        event.preventDefault();
        const selectedFieldKeys = Array.from(body.querySelectorAll(".dacc-export-field:checked")).map(input => input.value);
        if (!selectedFieldKeys.length) {
            document.getElementById("daccExportFieldError").textContent = "Select at least one data point to download.";
            return;
        }
        modal.hide();
        void exportDaccDecisionTable(files, button, selectedFieldKeys);
    });
};

const getProcessedAdminFiles = async (files, type, allSubFiles = [], submitterRoundFolders = []) => files.map(fileInfo => {
    const fileId = fileInfo.id;
    const filename = fileInfo.name;
    const titlename = getConceptTitleFromFileName(filename);
    const shorttitlename = titlename.length > 40 ? titlename.substring(0, 39) + "..." : titlename;
    let submissionDate = fileInfo.created_at;
    let returnedDate = null;
    let commentsFileId = fileId;
    let responseFileId = null;
    let conceptId = fileId;

    if (type === 'res') {
        returnedDate = fileInfo.created_at;
        const originalFile = findMatchingFileByName(allSubFiles, filename);
        if (originalFile) {
            submissionDate = originalFile.created_at;
            commentsFileId = originalFile.id;
            conceptId = originalFile.id;
        }
        responseFileId = fileId;
    }

    let roundId = fileInfo.parent ? fileInfo.parent.id : null;
    if (type === 'res' || type === 'com') {
        const originalFile = findMatchingFileByName(allSubFiles, filename);
        if (originalFile && originalFile.parent) {
            roundId = originalFile.parent.id;
            conceptId = originalFile.id;
        } else if (type === 'com' && fileInfo.parent?.name) {
            const matchingRound = submitterRoundFolders.find(round => round.name === fileInfo.parent.name);
            if (matchingRound) roundId = matchingRound.id;
        }
        if (type === 'com' && (!roundId || !submitterRoundFolders.some(round => String(round.id) === String(roundId)))) {
            const datedRound = findRoundByConceptDate(submitterRoundFolders, filename);
            if (datedRound) roundId = datedRound.id;
        }
    }

    return {
        fileInfo,
        fileId,
        contacts: "",
        filename,
        titlename,
        shorttitlename,
        submissionDate,
        returnedDate,
        parentId: fileInfo.parent?.id || null,
        roundId,
        commentsFileId,
        responseFileId,
        conceptId,
        requestedConsortia: [],
        documentDataLoaded: false,
        name: fileInfo.name,
        type
    };
});

const setAdminHydrationProgress = (kind, loaded, total, failures = 0) => {
    const status = document.getElementById("adminHydrationStatus");
    if (!status) return;
    status.dataset[`${kind}Loaded`] = String(loaded);
    status.dataset[`${kind}Total`] = String(total);
    status.dataset[`${kind}Failures`] = String(failures);

    const commentsLoaded = Number(status.dataset.commentsLoaded || 0);
    const commentsTotal = Number(status.dataset.commentsTotal || 0);
    const documentsLoaded = Number(status.dataset.documentsLoaded || 0);
    const documentsTotal = Number(status.dataset.documentsTotal || 0);
    const failureCount = Number(status.dataset.commentsFailures || 0) + Number(status.dataset.documentsFailures || 0);
    const complete = commentsLoaded >= commentsTotal && documentsLoaded >= documentsTotal;

    status.classList.toggle("text-success", complete && failureCount === 0);
    status.classList.toggle("text-warning", failureCount > 0);
    status.textContent = complete
        ? (failureCount ? `Background loading finished with ${failureCount} item(s) unavailable.` : "All scores, comments, and investigator search data loaded.")
        : `Loading scores/comments ${commentsLoaded}/${commentsTotal}; investigator search data ${documentsLoaded}/${documentsTotal}...`;
};

const getAdminDocumentData = async (file) => {
    const cacheKey = `${file.fileId}:${file.fileInfo?.modified_at || ""}`;
    if (!adminDocumentDataCache.has(cacheKey)) {
        const request = readDocFile(file.fileId)
            .then(docContent => ({
                contacts: docContent ? extractContactInvestigators(docContent) : "",
                requestedConsortia: docContent ? parseRequestedConsortiaValues(docContent) : []
            }))
            .catch(error => {
                adminDocumentDataCache.delete(cacheKey);
                throw error;
            });
        adminDocumentDataCache.set(cacheKey, request);
    }
    return adminDocumentDataCache.get(cacheKey);
};

const updateAdminRowSearchData = (file) => {
    const checkbox = document.getElementById(String(file.fileId));
    const row = checkbox?.closest(".admin-table-row");
    if (!row) return;
    row.dataset.searchText = `${file.filename || file.fileInfo?.name || ""} ${getConceptId(file, file.conceptId || file.fileId)} ${file.contacts || ""}`;
    const investigators = document.getElementById(`investigators${file.fileId}`);
    if (investigators) {
        investigators.textContent = file.contacts || "Not provided";
        investigators.classList.remove("text-danger");
        investigators.classList.toggle("text-muted", !file.contacts);
    }
};

const hydrateAdminDocumentData = async (data, requireComplete = false) => {
    const files = [...data.sub, ...data.com, ...data.res];
    const pendingFiles = files.filter(file => !file.documentDataLoaded);
    setAdminHydrationProgress("documents", files.length - pendingFiles.length, files.length);
    if (!pendingFiles.length) return data;
    if (adminDocumentHydrationPromise) {
        await adminDocumentHydrationPromise;
        return hydrateAdminDocumentData(data, requireComplete);
    }

    adminDocumentHydrationPromise = (async () => {
        const CHUNK_SIZE = 6;
        let loaded = files.length - pendingFiles.length;
        let failures = 0;
        for (let i = 0; i < pendingFiles.length; i += CHUNK_SIZE) {
            const chunk = pendingFiles.slice(i, i + CHUNK_SIZE);
            const results = await Promise.allSettled(chunk.map(async file => {
                const documentData = await getAdminDocumentData(file);
                file.contacts = documentData.contacts;
                file.requestedConsortia = documentData.requestedConsortia;
                file.documentDataLoaded = true;
                updateAdminRowSearchData(file);
            }));
            loaded += results.length;
            failures += results.filter(result => result.status === "rejected").length;
            results.forEach((result, index) => {
                if (result.status !== "rejected") return;
                const investigators = document.getElementById(`investigators${chunk[index].fileId}`);
                if (investigators) {
                    investigators.textContent = "Unable to load investigator details.";
                    investigators.classList.add("text-danger");
                }
            });
            setAdminHydrationProgress("documents", loaded, files.length, failures);
            refreshConceptSearch("adminConceptSearch");
        }
    })();

    try {
        await adminDocumentHydrationPromise;
    } finally {
        adminDocumentHydrationPromise = null;
    }
    if (requireComplete) {
        const unavailableFiles = files.filter(file => !file.documentDataLoaded);
        if (unavailableFiles.length) {
            throw new Error(`Unable to read ${unavailableFiles.length} concept document(s) from Box.`);
        }
    }
    return data;
};

export const showPreviewInPane = (fileId) => {
    showPreview(fileId, 'boxFilePreview');
    setTimeout(() => {
        const previewContainer = document.getElementById('boxFilePreview');
        if (previewContainer) {
            // Check if screen is large (lg breakpoint is 992px)
            if (window.innerWidth >= 992) {
                previewContainer.style.maxWidth = '66.666667%';
                previewContainer.style.flex = '0 0 66.666667%';
            } else {
                previewContainer.style.maxWidth = '100%';
                previewContainer.style.flex = '0 0 100%';
            }
        }
    }, 100);
};

export const showCommentsInPane = (fileId) => {
    showComments(fileId);
};

export const switchFilesWithComments = (tab, files = []) => {
    const element = document.getElementById(`${tab}selectedDoc`);
    if (element) {
        element.addEventListener("change", async (e) => {
            const file_id = e.target.value;
            
            // Check for versions and update version dropdown
            const versionSelect = document.getElementById(`${tab}versionSelect`);
            const versionContainer = document.getElementById(`${tab}versionContainer`);
            if (versionSelect && versionContainer) {
                const versions = await getFileVersions(file_id);
                if (versions && versions.entries && versions.entries.length > 0) {
                    versionSelect.innerHTML = '<option value="current">Current Version</option>';
                    versions.entries.forEach((version, index) => {
                        versionSelect.innerHTML += `<option value="${version.id}">Version ${versions.entries.length - index} (${new Date(version.created_at).toLocaleDateString()})</option>`;
                    });
                    versionContainer.style.display = 'block';
                    
                    // Re-attach version change listener
                    versionSelect.onchange = (e) => {
                        const versionId = e.target.value;
                        const previewContainer = document.getElementById('boxFilePreview');
                        previewContainer.innerHTML = '';
                        const access_token = JSON.parse(localStorage.parms).access_token;
                        const preview = new Box.Preview();
                        if (versionId === 'current') {
                            preview.show(file_id, access_token, {
                                container: previewContainer,
                                showDownload: true,
                                header: "light"
                            });
                        } else {
                            preview.show(file_id, access_token, {
                                container: previewContainer,
                                showDownload: true,
                                header: "light",
                                fileOptions: { [file_id]: { fileVersionId: versionId } }
                            });
                        }
                    };
                } else {
                    versionContainer.style.display = 'none';
                }
            }
            
            showPreviewInPane(file_id);
            
            const file = files.find(f => f && String(f.id) === String(file_id));
            const conceptIdElement = document.getElementById(`${tab}ConceptId`);
            if (conceptIdElement) conceptIdElement.textContent = getChairConceptMetadataLabel(file, file_id);
            showCommentsForChairTab(file, tab, file_id);
        });
    }
};

export const generateChairMenuFiles = async (forceRefresh = false) => {
    const userChairItem = getCurrentUserAuth();
    if (!userChairItem) return null;
    if (forceRefresh) chairMenuCache = null;
    
    if (!chairMenuCache) {
        showProgressContainer();
        updateProgressBar(5, "Connecting to Box...");
    } else {
        showAnimation();
    }
    
    const folderItems = await getFolderItems(submitterFolder);
    const roundFolders = (folderItems && folderItems.entries) ? folderItems.entries.filter(item => item && item.type === 'folder' && item.name && item.name.toLowerCase().startsWith('round')) : [];
    roundFolders.sort((a, b) => b.name.localeCompare(a.name));

    if (!chairMenuCache) {
        updateProgressBar(15, "Fetching file manifests...");
        
        // Fetch Chair's personal folders and DACC members list
        const [filearrayChair, filearrayClara, filearrayComplete, completedMasterFiles, testData] = await Promise.all([
            getAllFilesRecursive(userChairItem.boxIdNew, "name,type,id,parent,created_at,parent.name"),
            getAllFilesRecursive(userChairItem.boxIdClara, "name,type,id,parent,created_at,parent.name"),
            getAllFilesRecursive(userChairItem.boxIdComplete, "name,type,id,parent,created_at,parent.name"),
            getAllFilesRecursive(completedFolder, "name,type,id,parent,created_at,parent.name"),
            getFile(DACCmembers)
        ]);

        updateProgressBar(25, "Scanning all submission rounds...");
        
        // Fetch Submitter files per round to ensure accurate mapping
        const submitterFilesPromises = roundFolders.map(async (round) => {
            const files = await getAllFilesRecursive(round.id, "name,type,id,parent,created_at,parent.name");
            files.forEach(f => {
                f.roundId = round.id;
                f.roundName = round.name;
            });
            return files;
        });
        
        const submitterFilesResults = await Promise.all(submitterFilesPromises);
        const filearrayAllFiles = submitterFilesResults.flat();

        updateProgressBar(35, "Mapping consortium data...");
        
        const { data } = csv2Json(testData);
        const userEmail = JSON.parse(localStorage.parms).login;
        const chairEntry = chairsInfo.find(element => element && element.email === userEmail);
        const consortium = chairEntry ? chairEntry.consortium : "";
        const daccEmails = (data && Array.isArray(data)) ? data.filter(item => item && item['DACC']==consortium).map(dt => dt['Email']).splice(1) : [];

        const findRoundId = (fileName) => {
            if (!filearrayAllFiles || !Array.isArray(filearrayAllFiles)) return null;
            const match = findMatchingFileByName(filearrayAllFiles, fileName);
            return match ? match.roundId : null;
        };

        const findRoundIdByFolderName = (folderName) => {
            if (!folderName) return null;
            const match = roundFolders.find(round => round && round.name === folderName);
            return match ? match.id : null;
        };

        (completedMasterFiles || []).forEach(file => {
            const parentFolderName = file && file.parent && file.parent.name ? file.parent.name : null;
            if (parentFolderName && parentFolderName.toLowerCase().startsWith('round')) {
                file.roundName = parentFolderName;
                file.roundId = findRoundIdByFolderName(parentFolderName);
            }
        });

        const completedMasterFileArray = (completedMasterFiles && Array.isArray(completedMasterFiles)) ? completedMasterFiles : [];
        const filearrayMasterFiles = [
            ...filearrayAllFiles,
            ...completedMasterFileArray
        ];

        const attachMasterCommentSource = (item, preferredMasterFiles = []) => {
            const preferredMatch = item && item.name ? findMatchingFileByName(preferredMasterFiles, item.name) : null;
            const masterFile = preferredMatch || (item && item.name ? findMatchingFileByName(filearrayMasterFiles, item.name) : null);
            if (masterFile && masterFile.id) {
                item.masterFileId = masterFile.id;
                item.commentsFileId = masterFile.id;
                if (!item.roundId && masterFile.roundId) item.roundId = masterFile.roundId;
                if (!item.roundName && masterFile.roundName) item.roundName = masterFile.roundName;
            }
            return item;
        };

        const filesIncompleted = [];
        updateProgressBar(45, `Analyzing ${filearrayChair.length} new concepts...`);
        const chairTaskPromises = (filearrayChair && Array.isArray(filearrayChair)) ? filearrayChair.map(async (obj) => {
            if (!obj || !obj.id) return [];
            const [tasks, comments] = await Promise.all([getTaskList(obj.id), listComments(obj.id)]);
            const incompleteItems = [];
            
            let hasIncompleteTask = false;
            if (tasks && tasks.entries && tasks.entries.length != 0) {
                for (let items of tasks.entries) {
                    if (items && items.task_assignment_collection && items.task_assignment_collection.entries) {
                        for (let itemtasks of items.task_assignment_collection.entries) {
                            if (itemtasks && itemtasks.status === 'incomplete') {
                                hasIncompleteTask = true;
                                if (itemtasks.item) incompleteItems.push(itemtasks.item);
                                break;
                            }
                        }
                    }
                    if (hasIncompleteTask) break;
                }
            }
            
            let commentsObj = comments;
            if (typeof comments === 'string') {
                try { commentsObj = JSON.parse(comments); } catch (e) { commentsObj = null; }
            }
            const hasComments = commentsObj && commentsObj.entries && Array.isArray(commentsObj.entries) && commentsObj.entries.length > 0;
            if (!hasIncompleteTask && !hasComments) {
                incompleteItems.push(obj);
            }
            return incompleteItems;
        }) : [];
        
        const chairResults = await Promise.all(chairTaskPromises);
        chairResults.forEach(items => {
            if (items && Array.isArray(items)) {
                items.forEach(item => {
                    if (item && item.id && filesIncompleted.findIndex(element => element && element.id === item.id) === -1) {
                        item.roundId = findRoundId(item.name);
                        attachMasterCommentSource(item);
                        filesIncompleted.push(item);
                    }
                });
            }
        });

        const filesClaraIncompleted = [];
        updateProgressBar(65, `Analyzing ${filearrayClara.length} concepts requiring clarification...`);
        if (filearrayClara && Array.isArray(filearrayClara)) {
            filearrayClara.forEach(item => {
                if (item && item.id && filesClaraIncompleted.findIndex(element => element && element.id === item.id) === -1) {
                    const parentFolderName = item.parent && item.parent.name ? item.parent.name : null;
                    item.roundId = findRoundId(item.name) || findRoundIdByFolderName(parentFolderName);
                    if (!item.roundName && parentFolderName && parentFolderName.toLowerCase().startsWith('round')) item.roundName = parentFolderName;
                    attachMasterCommentSource(item);
                    filesClaraIncompleted.push(item);
                }
            });
        }

        const filesComplete = [];
        updateProgressBar(75, `Analyzing ${filearrayComplete.length} archived concepts...`);
        if (filearrayComplete && Array.isArray(filearrayComplete)) {
            filearrayComplete.forEach(item => {
                if (item && item.id && filesComplete.findIndex(element => element && element.id === item.id) === -1) {
                    const parentFolderName = item.parent && item.parent.name ? item.parent.name : null;
                    item.roundId = findRoundId(item.name) || findRoundIdByFolderName(parentFolderName);
                    if (!item.roundName && parentFolderName && parentFolderName.toLowerCase().startsWith('round')) item.roundName = parentFolderName;
                    attachMasterCommentSource(item, completedMasterFileArray);
                    filesComplete.push(item);
                }
            });
        }
        
        updateProgressBar(85, "Locating submitter response folders...");
        const userFolders = await getFolderItems(returnToSubmitterFolder);
        const responseFiles = [];
        if (userFolders && userFolders.entries) {
            let foldersProcessed = 0;
            const totalFolders = userFolders.entries.filter(f => f.type === 'folder').length;
            await Promise.all(userFolders.entries.map(async (userFolder) => {
                if (userFolder.type !== 'folder') return;
                try {
                    const subfolders = await getFolderItems(userFolder.id);
                    const requiringInputFolder = subfolders.entries.find(f => f.name === 'Requiring Input' && f.type === 'folder');
                    if (requiringInputFolder) {
                        const files = await getAllFilesRecursive(requiringInputFolder.id, "name,type,id,parent,created_at");
                        responseFiles.push(...files);
                    }
                } catch (e) {
                    console.error("Error scanning user folder:", userFolder.name, e);
                } finally {
                    foldersProcessed++;
                    const subPercent = 85 + Math.floor((foldersProcessed / totalFolders) * 5);
                    updateProgressBar(subPercent, `Scanning submitter responses (${foldersProcessed}/${totalFolders})...`);
                }
            }));
        }

        filearrayAllFiles.forEach(masterFile => {
            if (!masterFile || !masterFile.id) return;
            masterFile.commentsFileId = masterFile.id;
            const responseFile = findMatchingFileByName(responseFiles, masterFile.name);
            if (responseFile && responseFile.id) masterFile.responseFileId = responseFile.id;
        });

        updateProgressBar(90, "Syncing individual response histories...");
        if (responseFiles.length > 0) {
            let syncCount = 0;
            const filesWithResponseHistories = [...filesClaraIncompleted, ...filesComplete];
            const totalToSync = filesWithResponseHistories.length;
            if (totalToSync > 0) {
                await Promise.all(filesWithResponseHistories.map(async (chairFile) => {
                    try {
                        if (!chairFile || !chairFile.name) return;
                        const matchingFile = findMatchingFileByName(responseFiles, chairFile.name);
                        if (matchingFile) {
                            chairFile.responseFileId = matchingFile.id;
                            const commentsFileId = getChairCommentSourceId(chairFile, chairFile.id);
                            const [commentsResponse, masterCommentsResponse] = await Promise.all([
                                listComments(matchingFile.id),
                                commentsFileId && String(commentsFileId) !== String(matchingFile.id) ? listComments(commentsFileId) : Promise.resolve(null)
                            ]);
                            if (commentsResponse) {
                                const comments = JSON.parse(commentsResponse).entries;
                                if (comments && Array.isArray(comments)) {
                                    chairFile.responseComments = comments.filter(c => c && c.message && c.message.startsWith('Response ID:'));
                                    const masterComments = masterCommentsResponse ? JSON.parse(masterCommentsResponse).entries : null;
                                    const chairSourceComments = Array.isArray(masterComments) ? masterComments : comments;
                                    chairFile.clarificationReplyStatus = getClarificationReplyStatus(chairSourceComments, chairFile.responseComments, consortium);
                                    chairFile.isReplyCompleted = areChairCommentsRepliedTo(chairSourceComments, chairFile.responseComments, consortium);
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Error parsing comments for file:", chairFile.name, e);
                    } finally {
                        syncCount++;
                        const subPercentage = 90 + Math.floor((syncCount / totalToSync) * 9);
                        updateProgressBar(subPercentage, `Syncing histories (${syncCount}/${totalToSync})...`);
                    }
                }));
            }
        }

        updateProgressBar(100, "Finalizing...");
        chairMenuCache = {
            filesIncompleted,
            filesClaraIncompleted,
            filesComplete,
            filearrayAllFiles,
            filearrayMasterFiles,
            daccEmails,
            consortium,
            roundFolders,
            message: messagesForChair[userChairItem.id]
        };
    }

    const getActiveChairTabId = () => {
        const activePane = document.querySelector("#selectedTab .tab-pane.active");
        return activePane && activePane.id ? activePane.id : "recommendation";
    };

    const renderSelectedRound = async (selectedRoundId, activeTabId = "recommendation") => {
        showAnimation();
        
        const filesIncompleted = (chairMenuCache && chairMenuCache.filesIncompleted) ? chairMenuCache.filesIncompleted : [];
        const filesClaraIncompleted = (chairMenuCache && chairMenuCache.filesClaraIncompleted) ? chairMenuCache.filesClaraIncompleted : [];
        const filesComplete = (chairMenuCache && chairMenuCache.filesComplete) ? chairMenuCache.filesComplete : [];
        const filearrayAllFiles = (chairMenuCache && chairMenuCache.filearrayAllFiles) ? chairMenuCache.filearrayAllFiles : [];

        const filteredIncompleted = sortConceptsByRoundAndId(selectedRoundId === 'all' ? filesIncompleted : filesIncompleted.filter(f => f && f.roundId === selectedRoundId));
        const filteredClara = sortConceptsByRoundAndId(selectedRoundId === 'all' ? filesClaraIncompleted : filesClaraIncompleted.filter(f => f && f.roundId === selectedRoundId));
        const filteredComplete = sortConceptsByRoundAndId(selectedRoundId === 'all' ? filesComplete : filesComplete.filter(f => f && f.roundId === selectedRoundId));
        const filteredAllFiles = sortConceptsByRoundAndId(selectedRoundId === 'all' ? filearrayAllFiles : filearrayAllFiles.filter(f => f && f.roundId === selectedRoundId));

        var template = `
            <div class="general-bg padding-bottom-1rem">
                <div class="container body-min-height">
                    <div class="main-summary-row" style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="align-left">
                            <h1 class="page-header">${chairMenuCache.message}</h1>
                        </div>
                        <div id="roundSelectionContainer" style="margin-left: 20px;"></div>
                    </div>
                    <div class="data-submission div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem;">
                        <ul class='nav nav-tabs mb-3' role='tablist'>
                            <li class='nav-item active' role='presentation'>
                                <a class='nav-link' id='recommendationTab' href='#recommendation' data-mdb-toggle="tab" role='tab' aria-controls='recommendation' aria-selected='true'>
                                    New Concepts for Review (${filteredIncompleted.length})
                                </a>
                            </li>
                            <li class='nav-item' role='presentation'>
                                <a class='nav-link' id='conceptNeedingClarificationTab' href='#conceptNeedingClarification' data-mdb-toggle="tab" role='tab' aria-controls='conceptNeedingClarification' aria-selected='true'>
                                    Concepts Requiring Clarifications (${filteredClara.length})
                                </a>
                            </li>
                            <li class='nav-item' role='presentation'>
                                <a class='nav-link' id='completedConceptsTab' href='#completedConcepts' data-mdb-toggle="tab" role='tab' aria-controls='completedConcepts' aria-selected='true'>
                                    Completed Concepts (${filteredComplete.length})
                                </a>
                            </li>
                            <li class='nav-item' role='presentation'>
                                <a class='nav-link' id='daccDecisionTab' href='#daccDecision' data-mdb-toggle="tab" role='tab' aria-controls='daccDecision' aria-selected='true'>
                                    DACC Decision
                                </a>
                            </li>
                        </ul>
                        <div class="tab-content" id="selectedTab">
        `;

        template += `
            <div class='tab-pane fade show active' id='recommendation' role='tabpanel' aria-labeledby='recommendationTab'>
                <a href="mailto:${chairMenuCache.daccEmails.join("; ")}" id='email' class='btn btn-dark'>
                    Send Email to DACC
                </a>
        `;
        
        template += renderFilePreviewDropdown(filteredIncompleted, "recommendation");

        template += `
            <div class='tab-pane fade' id='conceptNeedingClarification' role='tabpanel' aria-labeledby='conceptNeedingClarificationTab'>
                <a href="mailto:${chairMenuCache.daccEmails.join("; ")}" id='email' class='btn btn-dark'>
                    Send Email to DACC
                </a>
        `;
        
        template += renderFilePreviewDropdown(filteredClara, "conceptNeedingClarification");

        template += `
            <div class='tab-pane fade' id='completedConcepts' role='tabpanel' aria-labeledby='completedConceptsTab'>
                <a href="mailto:${chairMenuCache.daccEmails.join("; ")}" id='email' class='btn btn-dark'>
                    Send Email to DACC
                </a>
        `;
        
        template += renderFilePreviewDropdown(filteredComplete, "completedConcepts");

        template += `
            <div class='tab-pane fade' id='daccDecision' role='tabpanel' aria-labeledby='daccDecisionTab'>
            Loading...
            </div>
        `;
        
        template += `<div id='filePreview'>`;
        if (filteredIncompleted.length !== 0 || filteredClara.length !== 0 || filteredComplete.length !== 0) {
            template += `
                <div class='row'>
                    <div id='boxFilePreview' class="col-lg-8 col-12 preview-container"></div>
                    <div id='sidePanel' class='col-lg-4 col-12 mt-2' style='display: block;'>
                        <div id='finalChairDecision' class="card-body submit-comment-recommendation" style="background-color:#FFFFFF; margin-top: 20px;">
                            <form>
                                <label for="message"><b>Enter Message for submitter</b></label>
                                <div class='text-muted small'>Submitter will only see the below comment after final decision is made.</div>
                                <div class="input-group">
                                    <textarea id="message" name="message" rows="4" class="form-control"></textarea>
                                </div>
                                <div class='mt-2'>
                                    <label for="grade">Select recommendation:</label>
                                    <select name="grade" id="grade2" class="form-select" aria-label="Select Document to Review">
                                        <option value = "1"> 1 - Approved as submitted</option>
                                        <option value = "2"> 2 - Approved, pending conditions/clarification of some issues </option>
                                        <option value = "3"> 3 - Approved, but data release will be delayed </option>
                                        <option value = "4"> 4 - Not approved </option>
                                        <option value = "5"> 5 - Decision requires clarification</option>
                                        <option value = "NA"> NA - Not Applicable</option>
                                    </select>
                                </div>
                                <button type="submit" class="buttonsubmit button-glow-red mt-2" value="submitted">
                                    <span class="buttonsubmit__text"> Submit </span>
                                </button>
                                <div id="commentWarning" class="text-danger small mt-1" style="display: none;">A comment is required with this score.</div>
                            </form>
                        </div>
                        <div style="height: 20px; border-bottom: 2px solid #e9ecef; margin: 20px 0;"></div>
                        <div id='fileComments' class="card-body submit-comment-recommendation" style="background-color:#FFFFFF; margin-top: 20px;"></div>

                    </div>
                </div>
            `;
        }
        
        template += `
            </div>
        </div>
        `;
        
        document.getElementById("chairFileView").innerHTML = template;

        const roundSelectionContainer = document.getElementById('roundSelectionContainer');
        if (roundSelectionContainer && roundFolders.length > 0) {
            const activeRoundIds = new Set([
                ...filesIncompleted.map(f => f.roundId),
                ...filesClaraIncompleted.map(f => f.roundId),
                ...filesComplete.map(f => f.roundId),
                ...filearrayAllFiles.map(f => f.roundId)
            ].filter(id => id));

            const displayRoundFolders = roundFolders.filter(f => activeRoundIds.has(f.id));

            let dropdownHtml = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <label for="roundSelect"><b>Select Round:</b></label>
                    <select id="roundSelect" class="form-select" style="width: auto;">
                        <option value="all">All Rounds</option>
            `;
            displayRoundFolders.forEach(folder => {
                dropdownHtml += `<option value="${folder.id}" ${folder.id === selectedRoundId ? 'selected' : ''}>${folder.name}</option>`;
            });
            dropdownHtml += `
                    </select>
                </div>
            `;
            roundSelectionContainer.innerHTML = dropdownHtml;

            document.getElementById('roundSelect').addEventListener('change', async (e) => {
                await renderSelectedRound(e.target.value, getActiveChairTabId());
            });
        }

        const daccTab = document.getElementById('daccDecisionTab');
        if (daccTab) {
            daccTab.addEventListener('click', async () => {
                const daccPane = document.getElementById('daccDecision');
                if (daccPane && daccPane.innerHTML.includes('Loading...')) {
                    await viewFinalDecisionFilesTemplate(filteredAllFiles);

                    // Pre-load DACC scores/comments and investigators for all files (like Admin table does)
                    try {
                        // Parallelize preloading in small chunks to avoid rate limits
                        const CHUNK_SIZE = 10;
                        for (let i = 0; i < filteredAllFiles.length; i += CHUNK_SIZE) {
                            const chunk = filteredAllFiles.slice(i, i + CHUNK_SIZE);
                            await Promise.all(chunk.map(f => f && f.id ? Promise.all([
                                showAuthCommentsWithResponses(f.id, f.commentsFileId || f.id, f.responseFileId, true),
                                loadDaccDecisionInvestigators(f.id)
                            ]) : Promise.resolve()));
                        }
                    } catch (e) {
                        console.error('Error preloading DACC decision details:', e);
                    }
                }
            }, { once: true });
        }

        commentSubmit(chairMenuCache.consortium);
        
        setTimeout(() => {
            const messageTextarea = document.getElementById('message');
            const gradeSelect = document.getElementById('grade2');
            const submitButton = document.querySelector('#finalChairDecision button[type="submit"]');
            
            if (messageTextarea && gradeSelect && submitButton) {
                const warningDiv = document.getElementById('commentWarning');
                const validateForm = () => {
                    const grade = gradeSelect.value;
                    const message = messageTextarea.value.trim();
                    if (grade !== '1' && grade.toUpperCase() !== 'NA' && message === '') {
                        submitButton.disabled = true;
                        submitButton.style.opacity = '0.5';
                        warningDiv.style.display = 'block';
                    } else {
                        submitButton.disabled = false;
                        submitButton.style.opacity = '1';
                        warningDiv.style.display = 'none';
                    }
                };
                messageTextarea.addEventListener('input', validateForm);
                gradeSelect.addEventListener('change', validateForm);
                validateForm();
            }
        }, 300);
        
        const handleResize = () => {
            const previewContainer = document.getElementById('boxFilePreview');
            if (previewContainer) {
                if (window.innerWidth >= 992) {
                    previewContainer.style.maxWidth = '66.666667%';
                    previewContainer.style.flex = '0 0 66.666667%';
                } else {
                    previewContainer.style.maxWidth = '100%';
                    previewContainer.style.flex = '0 0 100%';
                }
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        
        setupDownloadSelect('recommendation', filteredIncompleted)
        setupDownloadSelect('conceptNeedingClarification', filteredClara)
        setupDownloadSelect('completedConcepts', filteredComplete)

        if (!!filteredIncompleted.length) {
            showPreviewInPane(filteredIncompleted[0].id);
            showCommentsForChairTab(filteredIncompleted[0], "recommendation", filteredIncompleted[0].id);
            switchFilesWithComments("recommendation", filteredIncompleted);
            document.getElementById("recommendationselectedDoc").children[0].selected = true;
            setTimeout(() => {
                const finalDecisionForm = document.getElementById('finalChairDecision');
                if (finalDecisionForm) {
                    finalDecisionForm.style.display = 'block';
                }
            }, 200);
        } else if (!!filteredClara.length) {
            showPreviewInPane(filteredClara[0].id);
            showCommentsForChairTab(filteredClara[0], "conceptNeedingClarification", filteredClara[0].id);
            switchFilesWithComments("conceptNeedingClarification", filteredClara);
            document.getElementById("conceptNeedingClarificationTab").click();
        } else if (!!filteredComplete.length) {
            showPreviewInPane(filteredComplete[0].id);
            showCommentsForChairTab(filteredComplete[0], "completedConcepts", filteredComplete[0].id);
            switchFilesWithComments("completedConcepts", filteredComplete);
            document.getElementById("completedConceptsTab").click();
        } else {
            const filePreview = document.getElementById("filePreview");
            if (filePreview) {
                filePreview.classList.remove("d-block");
                filePreview.classList.add("d-None");
            }
        }

        switchTabs(
            "recommendation",
            ["daccDecision", 'conceptNeedingClarification', 'completedConcepts'],
            filteredIncompleted
        );
        switchTabs(
            "conceptNeedingClarification",
            ["recommendation", 'daccDecision', 'completedConcepts'],
            filteredClara
        );
        switchTabs(
            "completedConcepts",
            ["recommendation", 'daccDecision', 'conceptNeedingClarification'],
            filteredComplete
        );
        switchTabs(
            "daccDecision",
            ["recommendation", 'conceptNeedingClarification', 'completedConcepts'],
            filteredIncompleted
        );

        const chairTabIds = ["recommendation", "conceptNeedingClarification", "completedConcepts", "daccDecision"];
        const tabToActivate = chairTabIds.includes(activeTabId) ? activeTabId : "recommendation";
        const tabElement = document.getElementById(`${tabToActivate}Tab`) || document.getElementById("recommendationTab");
        if (tabElement) tabElement.click();
        hideAnimation();
    };

    await renderSelectedRound('all');
};

export const chairMenuTemplate = () => {
    const userEmail = JSON.parse(localStorage.parms).login;
    const userForChair = chairsInfo.find(item => item.email === userEmail);
    if (userForChair === -1) return;
    
    let template = `
        <div class="general-bg body-min-height padding-bottom-1rem">
            <div id="chairFileView" class="align-left"></div>
        </div>
    `;

    return template;
};

const moveFileToChairFolder = async (fileId, targetBaseFolderId, targetSubfolderName = null) => {
    try {
        let subfolderName = targetSubfolderName;
        if (!subfolderName) {
            const fileInfo = await getFileInfo(fileId);
            if (fileInfo && fileInfo.parent) {
                const parentFolderInfo = await getFolderInfo(fileInfo.parent.id);
                if (parentFolderInfo && parentFolderInfo.name && parentFolderInfo.name.toLowerCase().startsWith('round')) {
                    subfolderName = parentFolderInfo.name;
                }
            }
        }

        if (!subfolderName) {
            await moveFile(fileId, targetBaseFolderId);
            return;
        }
        
        const targetItems = await getFolderItems(targetBaseFolderId, "name,id,type", 1000);
        let targetSubfolder = (targetItems && targetItems.entries) ? targetItems.entries.find(f => f.name === subfolderName && f.type === 'folder') : null;

        if (!targetSubfolder) {
            const newFolder = await createFolder(targetBaseFolderId, subfolderName);
            if (newFolder && newFolder.id) {
                targetSubfolder = newFolder;
            } else if (newFolder && (newFolder.status === 409 || newFolder.code === 'item_name_already_exists')) {
                const refreshedFolders = await getFolderItems(targetBaseFolderId, "name,id,type", 1000);
                targetSubfolder = (refreshedFolders && refreshedFolders.entries) ? refreshedFolders.entries.find(f => f.name === subfolderName && f.type === 'folder') : null;
            }
        }

        if (targetSubfolder && targetSubfolder.id) {
            await moveFile(fileId, targetSubfolder.id);
        } else {
            await moveFile(fileId, targetBaseFolderId);
        }
    } catch (e) {
        console.error("Error moving file with structure:", e);
        await moveFile(fileId, targetBaseFolderId);
    }
};

async function handleChairCommentSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const consortium = form.dataset.consortium;
    if (!btn || btn.classList.contains('buttonsubmit--loading')) return;
    
    btn.classList.add('buttonsubmit--loading');
    btn.disabled = true;
    
    try {
        const activeTabPane = document.querySelector('.tab-content .tab-pane.active');
        if (!activeTabPane) throw new Error("No active tab found");
        
        if (activeTabPane.id === 'completedConcepts') {
            if (!confirm("Are you sure you want to make this change to a completed concept?")) {
                btn.classList.remove('buttonsubmit--loading');
                btn.disabled = false;
                return;
            }
        }
        
        const selectedDocElement = activeTabPane.querySelector('select[id$="selectedDoc"]');
        if (!selectedDocElement) throw new Error("No document selected");
        
        const fileId = selectedDocElement.value;
        const gradeSelect = form.querySelector('#grade2');
        const messageTextarea = form.querySelector('#message');
        if (!gradeSelect || !messageTextarea) throw new Error("Form elements not found");
        
        const grade = gradeSelect.value;
        const comment = messageTextarea.value.trim();
        const message = `Consortium: ${consortium}, Rating: ${grade}, Comment: ${comment}`;
        
        const fileinfo = await getFileInfo(fileId);
        const filename = fileinfo.name.trim();
        const cachedTabFiles = activeTabPane.id === 'conceptNeedingClarification'
            ? chairMenuCache && chairMenuCache.filesClaraIncompleted
            : activeTabPane.id === 'completedConcepts'
                ? chairMenuCache && chairMenuCache.filesComplete
                : chairMenuCache && chairMenuCache.filesIncompleted;
        const cachedSelectedFile = Array.isArray(cachedTabFiles)
            ? cachedTabFiles.find(file => file && String(file.id) === String(fileId))
            : null;
        let allFiles = chairMenuCache && chairMenuCache.filearrayMasterFiles ? chairMenuCache.filearrayMasterFiles : null;
        if (!allFiles) {
            const [submitterFiles, completedFiles] = await Promise.all([
                getAllFilesRecursive(submitterFolder, "name,id,parent,parent.name,created_at"),
                getAllFilesRecursive(completedFolder, "name,id,parent,parent.name,created_at")
            ]);
            allFiles = [
                ...((submitterFiles && Array.isArray(submitterFiles)) ? submitterFiles : []),
                ...((completedFiles && Array.isArray(completedFiles)) ? completedFiles : [])
            ];
        }
        const cachedCommentSourceId = cachedSelectedFile && (cachedSelectedFile.commentsFileId || cachedSelectedFile.masterFileId);
        const allFileMatch = (cachedCommentSourceId && allFiles.find(file => file && String(file.id) === String(cachedCommentSourceId)))
            || findMatchingFileByName(allFiles, filename);

        await createComment(fileId, message);
        let roundNameForMove = null;
        if (allFileMatch && allFileMatch.id) {
            if (String(allFileMatch.id) !== String(fileId)) await createComment(allFileMatch.id, message);
            if (allFileMatch.roundName) {
                roundNameForMove = allFileMatch.roundName;
            } else if (allFileMatch.parent) {
                const parentInfo = await getFolderInfo(allFileMatch.parent.id);
                if (parentInfo && parentInfo.name && parentInfo.name.toLowerCase().startsWith('round')) {
                    roundNameForMove = parentInfo.name;
                }
            }

            if (!roundNameForMove && allFileMatch.created_at) {
                try {
                    const submissionDate = new Date(allFileMatch.created_at);
                    const scheduleResponse = await fetch('./src/data/roundSchedule.json');
                    const schedule = await scheduleResponse.json();
                    const matchedRound = schedule.find(round => {
                        const start = new Date(round.startDate);
                        const end = new Date(round.endDate);
                        start.setHours(0,0,0,0);
                        end.setHours(23,59,59,999);
                        return submissionDate >= start && submissionDate <= end;
                    });
                    if (matchedRound) roundNameForMove = matchedRound.folderName;
                } catch (dateError) { console.error("Error detecting round:", dateError); }
            }
        }

        const managerConceptId = allFileMatch?.id || cachedCommentSourceId;
        if (managerConceptId) {
            try {
                await updateDataManagerChairStatus({
                    conceptBoxId: managerConceptId,
                    consortium,
                    score: grade,
                    workflowStage: grade === "5" || grade === "2" ? "chair_clarification" : "chair_complete"
                });
            } catch (managerStatusError) {
                console.warn("Unable to update the Data Managers chair status:", managerStatusError);
            }
        }
        
        const userEmail = JSON.parse(localStorage.parms).login;
        const chairEntry = chairsInfo.find(element => element.email === userEmail);

        if (grade === "5" || grade === "2") {
            if (chairEntry && chairEntry.boxIdClara) await moveFileToChairFolder(fileId, chairEntry.boxIdClara, roundNameForMove);
        } else {
            if (chairEntry && chairEntry.boxIdComplete) await moveFileToChairFolder(fileId, chairEntry.boxIdComplete, roundNameForMove);
            const tasklist = await getTaskList(fileId);
            if (tasklist && tasklist.entries) {
                for (let entry of tasklist.entries) {
                    if (entry && entry.task_assignment_collection && entry.task_assignment_collection.entries) {
                        for (let item of entry.task_assignment_collection.entries) {
                            if (item.status === 'incomplete') await updateTaskAssignment(item.id, 'completed', 'You have completed your task');
                        }
                    }
                }
            }
        }
        await generateChairMenuFiles(true);
    } catch (error) {
        console.error("Submission error:", error);
        alert("An error occurred during submission.");
    } finally {
        if (btn) {
            btn.classList.remove('buttonsubmit--loading');
            btn.disabled = false;
        }
    }
}

export const commentSubmit = async (consortium) => {
    const attachListener = () => {
        const decisionDiv = document.getElementById('finalChairDecision');
        if (decisionDiv) {
            const form = decisionDiv.querySelector('form');
            if (form) {
                form.dataset.consortium = consortium;
                form.removeEventListener("submit", handleChairCommentSubmit);
                form.addEventListener("submit", handleChairCommentSubmit);
                return true;
            }
        }
        return false;
    };

    if (!attachListener()) {
        const observer = new MutationObserver((mutations, obs) => {
            if (attachListener()) obs.disconnect();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => observer.disconnect(), 5000);
    }
};

const generateMergedConceptBlob = async (file, commentsFileId = file.id, responseComments = []) => {
    try {
        const fileId = file.id;
        const metadata = getMergedConceptMetadata(file);
        const [commentsResponse, originalFileResponse] = await Promise.all([
            listComments(commentsFileId),
            downloadFile(fileId)
        ]);
        const comments = JSON.parse(commentsResponse).entries;
        const originalBlob = await originalFileResponse.blob();
        const arrayBuffer = await originalBlob.arrayBuffer();
        let originalContent = '';
        try {
            if (window.mammoth) {
                const result = await window.mammoth.convertToHtml({arrayBuffer: arrayBuffer});
                originalContent = normalizeConceptDocumentHtml(result.value);
            } else { originalContent = '<p>Mammoth.js not available.</p>'; }
        } catch (docxError) { originalContent = '<p>Could not extract content.</p>'; }
        
        let mergedContent = `<html><head><meta charset="utf-8"><title>Document with Comments</title><style>body { font-family: 'Times New Roman', serif; font-size: 12pt; } h1 { font-size: 14pt; } h2 { font-size: 13pt; } h3 { font-size: 12pt; } p, div { font-size: 12pt; }</style></head><body><div style="margin-bottom: 20px;"><p><strong>Round:</strong> ${escapeHtml(metadata.round)}<br><strong>Concept ID:</strong> ${escapeHtml(metadata.conceptId)}</p></div><div style="border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px;"><h1>Original Document</h1><div style="line-height: 1.6;">${originalContent}</div></div><div><h1>DACC Comments and Ratings</h1>`;
        if (comments.length === 0) { mergedContent += `<p>No comments found.</p>`; } else {
            comments.forEach((comment, index) => {
                const matchingResponse = findResponseForComment(comment, responseComments);
                const responseText = extractResponseText(matchingResponse);

                mergedContent += `<div style="margin-bottom: 30px; border: 1px solid #ccc; padding: 15px; page-break-inside: avoid;"><h3>Comment ${index + 1}:</h3><div style="background-color: #f5f5f5; padding: 10px; margin: 10px 0;">${comment.message}</div><p><strong>Response (if applicable):</strong></p><div style="border: 1px solid #ddd; min-height: 50px; padding: 10px; background-color: white;">${responseText}</div></div>`;
            });
        }
        mergedContent += `</div></body></html>`;
        return new Blob([mergedContent], { type: 'application/msword' });
    } catch (error) { console.error('Error generating merged blob:', error); return null; }
};

const sortChairTableByColumn = (table, columnIndex, ascending = true) => {
    const rowsContainer = table.querySelector("#daccAccordian");
    if (!rowsContainer) return;

    const rows = Array.from(rowsContainer.querySelectorAll(":scope > .chair-table-row"));
    const direction = ascending ? 1 : -1;
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
    const getValue = (row) => {
        const cell = row.firstElementChild?.children[columnIndex];
        if (!cell) return { empty: true, value: "" };
        const select = cell.querySelector("select");
        const value = String(select ? select.value : cell.textContent).trim();
        if (!value || value === "--") return { empty: true, value: "" };
        if (columnIndex === 2) {
            const timestamp = Date.parse(value);
            if (!Number.isNaN(timestamp)) return { empty: false, value: timestamp, numeric: true };
        }
        const roundMatch = value.match(/^R(\d+)$/i);
        if (roundMatch) return { empty: false, value: Number(roundMatch[1]), numeric: true };
        if (/^-?\d+(?:\.\d+)?$/.test(value)) return { empty: false, value: Number(value), numeric: true };
        return { empty: false, value };
    };

    rows.sort((a, b) => {
        const left = getValue(a);
        const right = getValue(b);
        if (left.empty && right.empty) return 0;
        if (left.empty) return 1;
        if (right.empty) return -1;
        if (left.numeric && right.numeric) return (left.value - right.value) * direction;
        return collator.compare(String(left.value), String(right.value)) * direction;
    });
    rows.forEach(row => rowsContainer.appendChild(row));

    table.querySelectorAll(".header-sortable").forEach(header => {
        header.classList.remove("header-sort-asc", "header-sort-desc");
        const icon = header.querySelector(".sort-column i");
        if (icon) icon.className = "fas fa-sort";
    });
    const activeHeader = table.querySelector(".div-sticky > .row-24")?.children[columnIndex];
    if (activeHeader) {
        activeHeader.classList.add(ascending ? "header-sort-asc" : "header-sort-desc");
        const icon = activeHeader.querySelector(".sort-column i");
        if (icon) icon.className = ascending ? "fas fa-sort-up" : "fas fa-sort-down";
    }
};

export function viewFinalDecisionFilesColumns() {
    return `
        <div class="container-fluid m-0 pt-2 pb-2 align-left div-sticky" style="border-bottom: 1px solid rgb(0,0,0, 0.1); font-size: .8em">
            <div class="row-24 align-items-center position-relative">
                <div class="col-24-4 text-left font-bold ws-nowrap text-wrap header-sortable responsive-text">Concept Name <button class="transparent-btn sort-column" data-column-name="Concept Name"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-2 text-left font-bold ws-nowrap text-wrap header-sortable responsive-text">ID <button class="transparent-btn sort-column" data-column-name="ID"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-3 text-left font-bold ws-nowrap text-wrap header-sortable responsive-text">Sub Date <button class="transparent-btn sort-column" data-column-name="Submission Date"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-2 text-left font-bold ws-nowrap text-wrap header-sortable responsive-text">State <button class="transparent-btn sort-column" data-column-name="State"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-2 text-center font-bold ws-nowrap text-wrap header-sortable responsive-text">AABCG <button class="transparent-btn sort-column" data-column-name="AABCGDecision"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-2 text-center font-bold ws-nowrap text-wrap header-sortable responsive-text">BCAC <button class="transparent-btn sort-column" data-column-name="BCACDecision"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-2 text-center font-bold ws-nowrap text-wrap header-sortable responsive-text">C-NCI <button class="transparent-btn sort-column" data-column-name="C-NCIDecision"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-2 text-center font-bold ws-nowrap text-wrap header-sortable responsive-text">CIMBA <button class="transparent-btn sort-column" data-column-name="CIMBADecision"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-2 text-center font-bold ws-nowrap text-wrap header-sortable responsive-text">LAGENO <button class="transparent-btn sort-column" data-column-name="LAGENODecision"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-2 text-center font-bold ws-nowrap text-wrap header-sortable responsive-text">MERGE <button class="transparent-btn sort-column" data-column-name="MERGEDecision"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-1"></div>
            </div>
        </div>
    `;
};

export function viewAuthFinalDecisionFilesColumns() {
    return `
        <div class="container-fluid m-0 pt-2 pb-2 align-left div-sticky" style="border-bottom: 1px solid rgb(0,0,0, 0.1); font-size: .8em">
            <div class="row-24 align-items-center position-relative">
                <div class="col-24-1 text-left font-bold ws-nowrap text-wrap"></div>
                <div class="col-24-3 text-left font-bold ws-nowrap text-wrap header-sortable responsive-text">Concept Name <button class="transparent-btn sort-column" data-column-name="Concept Name"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-2 text-left font-bold ws-nowrap text-wrap header-sortable responsive-text">ID <button class="transparent-btn sort-column" data-column-name="ID"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-1 text-left font-bold ws-nowrap text-wrap header-sortable responsive-text">Sub Date <button class="transparent-btn sort-column" data-column-name="Submission Date"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-1 text-left font-bold ws-nowrap text-wrap header-sortable responsive-text">Ret Date <button class="transparent-btn sort-column" data-column-name="Return Date"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-1 text-left font-bold ws-nowrap text-wrap header-sortable responsive-text">State <button class="transparent-btn sort-column" data-column-name="State"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-2 text-center font-bold text-wrap header-sortable responsive-text">Action Required <button class="transparent-btn sort-column" data-column-name="Action Required"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-2 text-center font-bold ws-nowrap text-wrap header-sortable responsive-text">AABCG <button class="transparent-btn sort-column" data-column-name="AABCGDecision"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-2 text-center font-bold ws-nowrap text-wrap header-sortable responsive-text">BCAC <button class="transparent-btn sort-column" data-column-name="BCACDecision"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-2 text-center font-bold ws-nowrap text-wrap header-sortable responsive-text">C-NCI <button class="transparent-btn sort-column" data-column-name="C-NCIDecision"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-2 text-center font-bold ws-nowrap text-wrap header-sortable responsive-text">CIMBA <button class="transparent-btn sort-column" data-column-name="CIMBADecision"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-2 text-center font-bold ws-nowrap text-wrap header-sortable responsive-text">LAGENO <button class="transparent-btn sort-column" data-column-name="LAGENODecision"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-2 text-center font-bold ws-nowrap text-wrap header-sortable responsive-text">MERGE <button class="transparent-btn sort-column" data-column-name="MERGEDecision"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-1"></div>
            </div>
        </div>
    `;
};

export function viewFinalDecisionFilesTemplate(files) {
    if (!files || files.length === 0) {
        const daccDecisionElement = document.getElementById("daccDecision");
        if (daccDecisionElement) daccDecisionElement.innerHTML = "No files to show.";
        return;
    }

    let template = `<div id='decidedFiles'><div class='row'><div class="col-xl-12 filter-column" id="summaryFilterSiderBar"><div class="div-border white-bg align-left p-2"><div class="main-summary-row"><div class="col-xl-12 pl-1 pr-0"><span class="font-size-10"><h6 class="badge badge-pill badge-1">1</h6>: Approved as submitted <h6 class="badge badge-pill badge-2">2</h6>: Approved, pending conditions <h6 class="badge badge-pill badge-3">3</h6>: Approved, but data release delayed <h6 class="badge badge-pill badge-4">4</h6>: Not Approved <h6 class="badge badge-pill badge-5">5</h6>: Decision requires clarification <h6 class="badge badge-pill badge-777">777</h6>: Duplicate <h6 class="badge badge-pill badge-NA">NA</h6>: Not Applicable</span></div></div></div></div></div><div class='col-xl-12 pr-0'>`;
    template += renderConceptSearch(
        "daccDecisionConceptSearch",
        "daccDecisionConceptSearchStatus",
        `<div class="d-flex flex-wrap align-items-center gap-2 ms-auto"><span id="daccDecisionDownloadStatus" class="small text-muted" aria-live="polite"></span><button type="button" id="downloadDaccDecisionTable" class="btn btn-dark dacc-download-button"><i class="fas fa-download me-1" aria-hidden="true"></i> Download Current Table</button></div>`
    );
    template += viewFinalDecisionFilesColumns();
    template += '<div id="files"> </div></div></div>';
    const daccDecisionElement = document.getElementById("daccDecision");
    if (daccDecisionElement) daccDecisionElement.innerHTML = template; else return;
    viewFinalDecisionFiles(files);
    setupConceptSearch("daccDecisionConceptSearch", "daccDecisionConceptSearchStatus", "#daccAccordian > .accordian-item");
    const downloadButton = document.getElementById("downloadDaccDecisionTable");
    if (downloadButton) {
        downloadButton.addEventListener("click", () => {
            const visibleFileIds = new Set(Array.from(document.querySelectorAll("#daccAccordian > .accordian-item:not(.d-none)"))
                .map(row => row.querySelector(".accordion-toggle-btn")?.dataset.fileId)
                .filter(Boolean)
                .map(String));
            const visibleFiles = files.filter(file => visibleFileIds.has(String(file.id)));
            if (!visibleFiles.length) {
                const status = document.getElementById("daccDecisionDownloadStatus");
                if (status) {
                    status.className = "small text-muted";
                    status.textContent = "There are no visible concepts to download for the current round and search.";
                }
                return;
            }
            showDaccExportFieldSelection(visibleFiles, downloadButton);
        });
    }
    let btns = Array.from(document.querySelectorAll("#daccDecision .preview-file"));
    btns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            btn.dataset.bsTarget = "#confluencePreviewerModal";
            const header = document.getElementById("confluencePreviewerModalHeader");
            header.innerHTML = `<h5 class="modal-title">File preview</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`;
            const fileId = btn.dataset.fileId;
            bootstrap.Modal.getOrCreateInstance(document.getElementById("confluencePreviewerModal")).show();
            showPreview(fileId, "confluencePreviewerModalBody");
        });
    });
    const table = document.getElementById("decidedFiles");
    const headerRow = table?.querySelector(".div-sticky > .row-24");
    if (headerRow) {
        Array.from(headerRow.children).forEach((header, index) => {
            if (!header.classList.contains("header-sortable")) return;
            header.addEventListener("click", () => {
                const ascending = !header.classList.contains("header-sort-asc");
                sortChairTableByColumn(table, index, ascending);
            });
        });
    }
};

const loadDaccDecisionInvestigators = async (fileId) => {
  const investigatorsDiv = document.getElementById(`investigators${fileId}`);
  if (!investigatorsDiv || !investigatorsDiv.innerHTML.includes('Click accordion to load')) return;

  investigatorsDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  try {
    const docContent = await readDocFile(fileId);
    investigatorsDiv.innerHTML = extractContactInvestigators(docContent);
    refreshConceptSearch("daccDecisionConceptSearch");
  } catch (e) {
    investigatorsDiv.innerHTML = '<span class="text-danger">Error loading details</span>';
  }
};

export function viewFinalDecisionFiles(files) {
  let template = `<div class="row m-0 align-left allow-overflow w-100"><div class="accordion accordion-flush col-md-12 px-0" id="daccAccordian">`;
  for (const fileInfo of files) {
    const fileId = fileInfo.id;
    const filename = fileInfo.name;
    const titlename = getConceptTitleFromFileName(filename);
    const shorttitlename = titlename.length > 40 ? titlename.substring(0, 39) + "..." : titlename;
    const roundLabel = getConceptRoundLabel(fileInfo);
    template += `<div class="accordian-item chair-table-row mb-2 border-bottom pb-2" data-round-number="${escapeHtml(getConceptRoundNumber(fileInfo) || "")}"><div class="row-24 align-items-center position-relative"><div class="col-24-4 text-left"><span class="responsive-text" title="${titlename}">${shorttitlename}</span></div><div class="col-24-2 text-left"><span class="responsive-text">${roundLabel}</span></div><div class="col-24-3 text-left"><span class="responsive-text">${new Date(fileInfo.created_at).toDateString().substring(4)}</span></div><div class="col-24-2 text-left">${fileInfo.parent && fileInfo.parent.id == completedFolder ? '<h6 class="badge badge-pill bg-success">Accepted</h6>' : fileInfo.parent && fileInfo.parent.id == deniedFolder ? '<h6 class="badge badge-pill bg-danger">Denied</h6>' : '<h6 class="badge badge-pill bg-warning">Ongoing</h6>'}</div><div class="col-24-2 text-center" id="AABCG${fileId}" data-value="AABCG"><select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="AABCG Decision"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="BCAC${fileId}" data-value="BCAC"><select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="BCAC Decision"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="C-NCI${fileId}" data-value="C-NCI"><select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="C-NCI Decision"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="CIMBA${fileId}" data-value="CIMBA"><select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="CIMBA Decision"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="LAGENO${fileId}" data-value="LAGENO"><select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="LAGENO Decision"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="MERGE${fileId}" data-value="MERGE"><select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="MERGE Decision"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-1 text-right"><button class="accordion-toggle-btn" type="button" data-bs-toggle="collapse" data-bs-target="#file${fileId}" aria-expanded="false" aria-controls="file${fileId}" data-file-id="${fileId}"><i class="fas fa-chevron-down"></i></button></div></div><div id="file${fileId}" class="accordion-collapse collapse" aria-labelledby="flush-heading${fileId}"><div class="accordion-body"><div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Concept</div><div class="col">${filename} <button class="btn btn-lg custom-btn preview-file preview-file-inline" title='Preview File' data-file-id="${fileId}" aria-label="Preview File"><i class="fas fa-external-link-alt" style="font-size: 0.8em;"></i></button></div></div><div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Concept ID</div><div class="col">${escapeHtml(getConceptId(fileInfo, fileId) || "Not available")}</div></div><div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Round</div><div class="col">${roundLabel}</div></div><div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Investigator(s)</div><div class="col" id="investigators${fileId}"><span class="text-muted italic">Click accordion to load...</span></div></div><div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Comments</div><div class="col" id='file${fileId}Comments'></div></div></div></div></div>`;
  }
  template += `</div></div>`;
  const filesContainer = document.getElementById("files");
  if (filesContainer) {
    filesContainer.innerHTML = template;
    document.querySelectorAll("#daccAccordian > .accordian-item").forEach((row, index) => {
      const file = files[index];
      const rowCells = row.firstElementChild;
      const roundCell = rowCells?.children[1];
      if (rowCells && file) {
        const conceptIdCell = document.createElement("div");
        conceptIdCell.className = "col-24-2 text-left";
        conceptIdCell.innerHTML = `<span class="responsive-text">${escapeHtml(getConceptId(file) || "--")}</span>`;
        rowCells.insertBefore(conceptIdCell, roundCell);
        roundCell?.remove();
        row.dataset.searchText = `${file.name || ""} ${getConceptId(file)}`;
      }
    });
    document.querySelectorAll('#daccDecision .accordion-toggle-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const fileId = this.dataset.fileId;
        const investigatorsDiv = document.getElementById(`investigators${fileId}`);
        if (investigatorsDiv && investigatorsDiv.innerHTML.includes('Click accordion to load')) {
            await loadDaccDecisionInvestigators(fileId);
            showCommentsDCEG(fileId, false);
        }
      });
    });
  }
}

export const createAllRoundFolders = async () => {
    const header = document.getElementById("confluenceModalHeader");
    const body = document.getElementById("confluenceModalBody");
    const modalElement = document.getElementById("confluenceMainModal");
    if (!header || !body || !modalElement) return;

    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    const modalDialog = modalElement.querySelector('.modal-dialog');
    const widenReviewDialog = () => {
        if (!modalDialog || modalDialog.dataset.roundReviewWide === 'true') return;
        modalDialog.dataset.roundReviewWide = 'true';
        modalDialog.dataset.previousWidth = modalDialog.style.width || '';
        modalDialog.dataset.previousMaxWidth = modalDialog.style.maxWidth || '';
        modalDialog.style.width = '50vw';
        modalDialog.style.maxWidth = '50vw';
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalDialog.style.width = modalDialog.dataset.previousWidth || '';
            modalDialog.style.maxWidth = modalDialog.dataset.previousMaxWidth || '';
            delete modalDialog.dataset.previousWidth;
            delete modalDialog.dataset.previousMaxWidth;
            delete modalDialog.dataset.roundReviewWide;
        }, { once: true });
    };
    header.innerHTML = `<h5 class="modal-title">Initiate Review Round</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`;
    body.innerHTML = '<p>Loading completed round schedule...</p>';
    modal.show();

    try {
        const response = await fetch('./src/data/roundSchedule.json');
        if (!response.ok) throw new Error(`Unable to load the round schedule (${response.status}).`);
        const schedule = await response.json();
        const now = new Date();
        const previousRounds = schedule
            .filter(round => {
                const endDate = new Date(round.endDate);
                endDate.setHours(23, 59, 59, 999);
                return Number.isFinite(endDate.getTime()) && endDate < now;
            })
            .sort((a, b) => Number(b.round) - Number(a.round));

        if (!previousRounds.length) {
            body.innerHTML = '<div class="alert alert-info mb-0">No review rounds have passed their configured end date.</div>';
            return;
        }

        body.innerHTML = `
            <form id="initRoundSelectionForm">
                <div class="mb-3">
                    <label for="initRoundSelect" class="form-label"><b>Round to initiate</b></label>
                    <select id="initRoundSelect" class="form-select" required>
                        ${previousRounds.map(round => `<option value="${escapeHtml(round.folderName)}">Round ${escapeHtml(round.round)} — ended ${escapeHtml(round.endDate)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="initRoundTestMode">
                    <label class="form-check-label" for="initRoundTestMode">
                        <b>Test mode</b> — read and tag normally, but copy each document only to TEST and assign the TEST chair.
                    </label>
                </div>
                <div class="alert alert-warning small">Only rounds whose configured end date has passed are available. No Box files will be changed until you confirm the reviewed file list.</div>
                <div class="modal-footer px-0 pb-0">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Review Files</button>
                </div>
            </form>`;

        document.getElementById('initRoundSelectionForm').addEventListener('submit', async event => {
            event.preventDefault();
            const submitButton = event.target.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Reading files...';

            const folderName = document.getElementById('initRoundSelect').value;
            const selectedRound = previousRounds.find(round => round.folderName === folderName);
            const testMode = document.getElementById('initRoundTestMode').checked;

            try {
                const submitterItems = await getFolderItems(submitterFolder, 'name,type,id', 1000);
                const roundFolder = (submitterItems?.entries || []).find(item => item.type === 'folder' && item.name === folderName);
                if (!roundFolder) throw new Error(`The folder ${folderName} was not found under Box folder ${submitterFolder}.`);

                const roundFiles = await getAllFilesRecursive(roundFolder.id, 'name,type,id,parent,created_at');
                const wordFiles = roundFiles.filter(file => file && /\.docx$/i.test(file.name || ''));
                if (!wordFiles.length) throw new Error(`No Word documents were found in ${folderName}.`);
                const roundAssignments = buildRoundConceptAssignments(wordFiles, selectedRound.round);

                const fileReviews = await Promise.all(wordFiles.map(async file => {
                    const assignment = roundAssignments.byFileId.get(String(file.id));
                    const newFileName = addConceptIdSuffixToFileName(file.name, assignment.roundNumber, assignment.conceptNumber);
                    try {
                        const docText = await readDocFile(file.id);
                        const requestedConsortia = parseRequestedConsortiaValues(docText);
                        return { file, requestedConsortia, assignment, newFileName, error: '' };
                    } catch (error) {
                        return { file, requestedConsortia: [], assignment, newFileName, error: error.message || 'Unable to read this document.' };
                    }
                }));

                const checkExistingChairRounds = async destinationConsortia => (await Promise.all(destinationConsortia.map(async consortium => {
                    const chair = chairsInfo.find(item => item.consortium.toLowerCase() === consortium.toLowerCase());
                    if (!chair) throw new Error(`No chair configuration exists for ${consortium}.`);

                    const chairNewItems = await getFolderItems(chair.boxIdNew, 'name,type,id', 1000);
                    if (!chairNewItems?.entries) throw new Error(`Unable to check the ${consortium} New folder.`);
                    const chairRoundFolder = chairNewItems.entries.find(item => item.type === 'folder' && item.name === selectedRound.folderName);
                    if (!chairRoundFolder) return null;

                    const existingItems = await getFolderItems(chairRoundFolder.id, 'name,type,id', 1000);
                    if (!existingItems?.entries) throw new Error(`Unable to check ${consortium}/New/${selectedRound.folderName}.`);
                    return existingItems.entries.length > 0
                        ? { consortium, itemCount: existingItems.entries.length }
                        : null;
                }))).filter(Boolean);
                const initiallyRoutableFiles = fileReviews.filter(review => review.requestedConsortia.length > 0);
                const initialDestinationConsortia = [...new Set(
                    initiallyRoutableFiles.flatMap(review => testMode ? ['TEST'] : review.requestedConsortia)
                )];
                const existingChairRounds = await checkExistingChairRounds(initialDestinationConsortia);
                const restartWarning = existingChairRounds.length
                    ? `<div class="alert alert-danger mt-3">
                        <b>Round restart warning:</b> The following chair round folders already contain items:
                        <ul class="mb-1 mt-2">${existingChairRounds.map(entry => `<li>${escapeHtml(entry.consortium)} — ${entry.itemCount} item(s)</li>`).join('')}</ul>
                        Continuing will restart this round for those chairs. Existing files will be reused where their names match, and a new task may be assigned when no incomplete task exists.
                    </div>`
                    : '';
                widenReviewDialog();
                header.innerHTML = `<h5 class="modal-title">Confirm ${escapeHtml(selectedRound.folderName)}</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`;
                body.innerHTML = `
                    <p><b>${fileReviews.length}</b> Word document(s) found. ${testMode ? '<span class="badge bg-warning text-dark">TEST MODE</span>' : ''}</p>
                    <p class="small text-muted">All documents are selected initially. Open a document in Box to review it, then correct or add its metadata tags before initiating.</p>
                    <div class="table-responsive">
                        <table class="table table-sm align-middle" style="table-layout: fixed; width: 100%;">
                            <colgroup>
                                <col style="width: 8%;">
                                <col style="width: 22%;">
                                <col style="width: 38%;">
                                <col style="width: 14%;">
                                <col style="width: 18%;">
                            </colgroup>
                            <thead><tr><th class="text-center">Initiate</th><th>Current / New filename</th><th>Metadata tags</th><th>Review destination</th><th>Status</th></tr></thead>
                            <tbody>
                                ${fileReviews.map(review => {
                                    const ready = review.requestedConsortia.length > 0;
                                    const status = review.error
                                        ? 'Document could not be read; select metadata manually'
                                        : ready ? 'Ready' : 'No recognized requested consortium found';
                                    return `<tr class="init-round-file-row" data-file-id="${escapeHtml(review.file.id)}">
                                        <td class="text-center"><input type="checkbox" class="form-check-input init-round-file-selected" checked aria-label="Initiate ${escapeHtml(review.file.name)}"></td>
                                        <td style="white-space: normal !important; overflow: hidden; overflow-wrap: anywhere; word-break: break-all;"><a href="https://nih.app.box.com/file/${encodeURIComponent(review.file.id)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(review.file.name)}" style="display: -webkit-box; width: 100%; max-width: 100%; white-space: normal !important; overflow: hidden; overflow-wrap: anywhere; word-break: break-all; -webkit-box-orient: vertical; -webkit-line-clamp: 2;">${escapeHtml(review.file.name)}</a><div class="small text-success mt-1">&rarr; ${escapeHtml(review.newFileName)}<br>Concept ID: R${escapeHtml(review.assignment.roundNumber)}_${escapeHtml(String(review.assignment.conceptNumber).padStart(2, '0'))}</div></td>
                                        <td>
                                            <div class="d-grid" style="grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: 0.75rem; row-gap: 0.35rem;">
                                                ${CONSORTIUM_EXPORT_VALUES.map(consortium => `<label class="form-check-label text-nowrap"><input type="checkbox" class="form-check-input init-round-metadata-tag me-1" value="${escapeHtml(consortium)}" ${review.requestedConsortia.includes(consortium) ? 'checked' : ''}>${escapeHtml(consortium)}</label>`).join('')}
                                            </div>
                                        </td>
                                        <td>${ready ? escapeHtml(testMode ? 'TEST' : review.requestedConsortia.join(', ')) : '—'}</td>
                                        <td class="${ready ? 'text-success' : 'text-danger'}">${escapeHtml(status)}</td>
                                    </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    ${restartWarning}
                    <div class="alert alert-info small mt-3">Initiating will first rename each selected source document with its displayed Concept ID, then apply the reviewed NIH_NCI_DCEG_Confluence metadata tags, copy it to the indicated chair New folder under ${escapeHtml(selectedRound.folderName)}, and assign a General Task.</div>
                    <div id="initRoundSelectionStatus" class="small text-danger mb-2"></div>
                    <div class="modal-footer px-0 pb-0">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" id="confirmInitRoundBtn" class="btn ${existingChairRounds.length ? 'btn-danger' : 'btn-primary'}">${existingChairRounds.length ? 'Restart / Initiate' : 'Initiate'} ${escapeHtml(selectedRound.folderName)}</button>
                    </div>`;

                const confirmButton = document.getElementById('confirmInitRoundBtn');
                if (!confirmButton) return;
                const collectReviewedFiles = () => fileReviews.map(review => {
                    const row = document.querySelector(`.init-round-file-row[data-file-id="${review.file.id}"]`);
                    const selected = !!row?.querySelector('.init-round-file-selected')?.checked;
                    const requestedConsortia = Array.from(row?.querySelectorAll('.init-round-metadata-tag:checked') || []).map(input => input.value);
                    return { ...review, detectedConsortia: review.requestedConsortia, selected, requestedConsortia };
                });
                const updateReviewSelection = () => {
                    const reviewedFiles = collectReviewedFiles();
                    reviewedFiles.forEach(review => {
                        const row = document.querySelector(`.init-round-file-row[data-file-id="${review.file.id}"]`);
                        if (!row) return;
                        row.style.opacity = review.selected ? '1' : '0.55';
                        const destinationCell = row.children[3];
                        const statusCell = row.children[4];
                        const hasMetadata = review.requestedConsortia.length > 0;
                        destinationCell.textContent = hasMetadata ? (testMode ? 'TEST' : review.requestedConsortia.join(', ')) : '—';
                        statusCell.textContent = !review.selected
                            ? 'Not selected'
                            : hasMetadata
                                ? (review.error || review.requestedConsortia.join(', ') !== review.detectedConsortia.join(', ') ? 'Ready (manually reviewed)' : 'Ready')
                                : review.error ? 'Document could not be read; select metadata manually' : 'No recognized requested consortium found';
                        statusCell.className = review.selected && !hasMetadata ? 'text-danger' : review.selected ? 'text-success' : 'text-muted';
                    });

                    const selectedFiles = reviewedFiles.filter(review => review.selected);
                    const unresolvedFiles = selectedFiles.filter(review => review.requestedConsortia.length === 0);
                    const selectionStatus = document.getElementById('initRoundSelectionStatus');
                    confirmButton.disabled = selectedFiles.length === 0 || unresolvedFiles.length > 0;
                    selectionStatus.textContent = selectedFiles.length === 0
                        ? 'Select at least one document to initiate.'
                        : unresolvedFiles.length
                            ? `Select metadata for ${unresolvedFiles.length} selected document(s), or uncheck those documents.`
                            : `${selectedFiles.length} document(s) selected and ready.`;
                    selectionStatus.className = unresolvedFiles.length || selectedFiles.length === 0 ? 'small text-danger mb-2' : 'small text-success mb-2';
                };
                document.querySelectorAll('.init-round-file-selected, .init-round-metadata-tag').forEach(input => {
                    input.addEventListener('change', updateReviewSelection);
                });
                updateReviewSelection();

                confirmButton.addEventListener('click', async () => {
                    const reviewedFiles = collectReviewedFiles();
                    const selectedReviews = reviewedFiles.filter(review => review.selected);
                    if (!selectedReviews.length || selectedReviews.some(review => review.requestedConsortia.length === 0)) {
                        updateReviewSelection();
                        return;
                    }

                    confirmButton.disabled = true;
                    const finalDestinationConsortia = [...new Set(
                        selectedReviews.flatMap(review => testMode ? ['TEST'] : review.requestedConsortia)
                    )];
                    try {
                        const finalExistingChairRounds = await checkExistingChairRounds(finalDestinationConsortia);
                        if (finalExistingChairRounds.length) {
                            const restartList = finalExistingChairRounds.map(entry => `${entry.consortium} (${entry.itemCount} item(s))`).join('\n');
                            if (!confirm(`The following chair round folders already contain items:\n\n${restartList}\n\nContinuing will restart this round for those chairs. Continue?`)) {
                                confirmButton.disabled = false;
                                return;
                            }
                        }
                    } catch (error) {
                        alert(`Unable to verify the selected chair folders: ${error.message || error}`);
                        confirmButton.disabled = false;
                        return;
                    }

                    header.innerHTML = `<h5 class="modal-title">Initiating ${escapeHtml(selectedRound.folderName)}</h5>`;
                    body.innerHTML = '<div id="initRoundsProgress" style="max-height: 500px; overflow-y: auto;"></div>';
                    const progressDiv = document.getElementById('initRoundsProgress');
                    const addStatus = (message, className = '') => {
                        progressDiv.insertAdjacentHTML('beforeend', `<p class="mb-1 ${className}">${escapeHtml(message)}</p>`);
                        progressDiv.scrollTop = progressDiv.scrollHeight;
                    };

                    let completedRoutes = 0;
                    let failureCount = 0;
                    const sourceRenameFailures = new Set();
                    const dataManagerChairReviews = [];

                    addStatus('Renaming selected source documents before creating chair copies...', 'fw-bold');
                    for (const review of selectedReviews) {
                        review.originalFileName = review.file.name;
                        try {
                            if (review.originalFileName !== review.newFileName) {
                                await updateBoxFile(review.file.id, { name: review.newFileName });
                                review.file.name = review.newFileName;
                                addStatus(`Renamed source: ${review.originalFileName} -> ${review.newFileName}`, 'text-success');
                            } else {
                                addStatus(`Source filename already correct: ${review.newFileName}`, 'text-muted');
                            }
                        } catch (error) {
                            failureCount += 1;
                            sourceRenameFailures.add(String(review.file.id));
                            addStatus(`Unable to rename ${review.originalFileName}: ${error.message || error}`, 'text-danger');
                        }
                    }

                    for (const review of selectedReviews) {
                        if (sourceRenameFailures.has(String(review.file.id))) {
                            addStatus(`Skipped copies for ${review.originalFileName} because its source rename failed.`, 'text-warning');
                            continue;
                        }
                        addStatus(`Processing ${review.file.name}...`, 'fw-bold');
                        try {
                            await addMetaData(review.file.id, review.requestedConsortia);
                            addStatus(`Applied metadata: ${review.requestedConsortia.join(', ')}`, 'text-success');

                            const targetConsortia = testMode ? ['TEST'] : review.requestedConsortia;
                            for (const consortium of targetConsortia) {
                                try {
                                    const chair = chairsInfo.find(item => item.consortium.toLowerCase() === consortium.toLowerCase());
                                    if (!chair) throw new Error(`No chair configuration exists for ${consortium}.`);

                                    const targetRoundFolder = await getOrCreateChildFolder(chair.boxIdNew, selectedRound.folderName);
                                    const targetItems = await getFolderItems(targetRoundFolder.id, 'name,type,id', 1000);
                                    const targetFiles = (targetItems?.entries || []).filter(item => item.type === 'file');
                                    let copiedFile = targetFiles.find(item => item.name === review.newFileName)
                                        || targetFiles.find(item => getRoundConceptKey(item.name) === getRoundConceptKey(review.originalFileName));
                                    if (copiedFile) {
                                        if (copiedFile.name !== review.newFileName) {
                                            await updateBoxFile(copiedFile.id, { name: review.newFileName });
                                            copiedFile.name = review.newFileName;
                                            addStatus(`${consortium}: existing copy renamed and reused.`, 'text-success');
                                        } else {
                                            addStatus(`${consortium}: existing copy reused.`, 'text-muted');
                                        }
                                    } else {
                                        copiedFile = await copyFile(review.file.id, targetRoundFolder.id, String(review.file.id));
                                        if (!copiedFile?.id) throw new Error(`Unable to copy the document${copiedFile?.status ? ` (${copiedFile.status})` : ''}.`);
                                        addStatus(`${consortium}: copied to New/${selectedRound.folderName}.`, 'text-success');
                                    }

                                    if (!testMode && studiesInfo.some(study => String(study.consortium).toLowerCase() === String(consortium).toLowerCase())) {
                                        dataManagerChairReviews.push({
                                            sourceFileId: review.file.id,
                                            chairFileId: copiedFile.id,
                                            fileName: review.newFileName,
                                            title: review.newFileName,
                                            consortium
                                        });
                                    }

                                    const existingTasks = await getTaskList(copiedFile.id);
                                    const hasOpenAssignment = (existingTasks?.entries || []).some(task =>
                                        (task.task_assignment_collection?.entries || []).some(assignment =>
                                            assignment.status === 'incomplete'
                                            && assignment.assigned_to?.login?.toLowerCase() === chair.email.toLowerCase()
                                        )
                                    );
                                    if (hasOpenAssignment) {
                                        addStatus(`${consortium}: existing incomplete task retained.`, 'text-muted');
                                    } else {
                                        const task = await createCompleteTask(copiedFile.id, 'Please complete your review after reviewing with DACC');
                                        if (!task?.id) throw new Error('Unable to create the General Task.');
                                        const assignment = await assignTask(task.id, chair.email);
                                        if (!assignment?.ok) throw new Error(`Unable to assign the task to ${chair.email}.`);
                                        addStatus(`${consortium}: task assigned to ${chair.email}.`, 'text-success');
                                    }
                                    completedRoutes += 1;
                                } catch (error) {
                                    failureCount += 1;
                                    addStatus(`${consortium}: ${error.message || error}`, 'text-danger');
                                }
                            }
                        } catch (error) {
                            failureCount += 1;
                            addStatus(`${review.file.name}: ${error.message || error}`, 'text-danger');
                        }
                    }

                    if (dataManagerChairReviews.length) {
                        try {
                            await publishDataManagerChairRequests({
                                round: { id: roundFolder.id, name: selectedRound.folderName },
                                reviews: dataManagerChairReviews,
                                studies: studiesInfo,
                                initiatedBy: String(JSON.parse(localStorage.parms || "{}").login || "")
                            });
                            addStatus(`Published ${dataManagerChairReviews.length} chair-review concept route(s) to Data Managers.`, 'text-success');
                        } catch (error) {
                            failureCount += 1;
                            addStatus(`Unable to publish the Data Managers status index: ${error.message || error}`, 'text-danger');
                        }
                    }

                    addStatus(`Finished: ${completedRoutes} review route(s) completed; ${failureCount} error(s).`, failureCount ? 'text-warning fw-bold' : 'text-success fw-bold');
                    body.insertAdjacentHTML('beforeend', '<div class="modal-footer"><button type="button" class="btn btn-primary" data-bs-dismiss="modal" id="refreshAfterRoundInit">Close & Refresh</button></div>');
                    document.getElementById('refreshAfterRoundInit').addEventListener('click', refreshAdminTable);
                });
            } catch (error) {
                header.innerHTML = `<h5 class="modal-title">Unable to Review Round</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`;
                body.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(error.message || error)}</div>`;
            }
        });
    } catch (error) {
        body.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(error.message || error)}</div>`;
    }
};

export const authTableTemplate = () => {
    const userEmail = JSON.parse(localStorage.parms).login;
    const userForAuth = emailsAllowedToUpdateData.includes(userEmail);
    if (!userForAuth) return;
    let template = `<div class="general-bg padding-bottom-1rem"><div class="container body-min-height"><div class="main-summary-row" style="display: flex; justify-content: space-between; align-items: center;"><div class="align-left"><h1 class="page-header">Admin Table View</h1></div><div id="roundSelectionContainer" style="margin-left: 20px;"></div><div class="align-right"><button type="button" id="saveActionRequiredBtn" class="buttonsubmit button-glow-red" disabled style="opacity: 0.5;"> <span class="buttonsubmit__text"> Save Action Required </span></button><button type="submit" id="submitID" class="buttonsubmit button-glow-red" style="margin-left: 10px;" onclick="this.classList.toggle('buttonsubmit--loading')"> <span class="buttonsubmit__text"> Update Users </span></button><button type="button" id="renameFilesBtn" class="buttonsubmit button-glow-red" style="margin-left: 10px;"> <span class="buttonsubmit__text"> Add Concept IDs to Filenames </span></button></div></div><div class="data-submission div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem;"><div class="tab-content" id="selectedTab"><div class="tab-pane fade show active" id="daccDecision" role="tabpanel" aria-labeledby="daccDecisionTab"><div id="authTableView" class="align-left"></div><button type="submit" class="buttonsubmit button-glow-red" id="returnSubmitter" onclick="this.classList.toggle('buttonsubmit--loading')"><span class="buttonsubmit__text"> Return to Submitter </span></button><button type="submit" class="buttonsubmit button-glow-red" id="returnChairs" onclick="this.classList.toggle('buttonsubmit--loading')"><span class="buttonsubmit__text"> Return to Chairs </span></button><a href="mailto:mkh39@medschl.cam.ac.uk; xjahuang@ucdavis.edu; vzavala@ucdavis.edu; r.santos@qub.ac.uk; guochong.jia@vumc.org; thomas.ahearn@nih.gov?subject=Confluence Data Coordinating Centers" id='email' class='btn btn-dark'>Send Email to DACC</a></div></div></div></div></div>`;
    template = template.replace(
        '<button type="button" id="renameFilesBtn"',
        '<button type="button" id="initRoundsBtn" class="buttonsubmit button-glow-red" style="margin-left: 10px;"><span class="buttonsubmit__text"> Init Rounds </span></button><button type="button" id="renameFilesBtn"'
    );
    return template;
};

export const getRequiringInputFiles = async (returnToSubmitterFolderId) => {
    const userFolders = await getFolderItems(returnToSubmitterFolderId, "name,type,id", 1000);
    const requiringInputByUser = await Promise.all((userFolders.entries || [])
        .filter(userFolder => userFolder.type === 'folder')
        .map(async userFolder => {
            const subfolders = await getFolderItems(userFolder.id, "name,type,id", 1000);
            const requiringInputFolders = (subfolders.entries || [])
                .filter(subfolder => subfolder.name === 'Requiring Input' && subfolder.type === 'folder');
            const files = await Promise.all(requiringInputFolders.map(subfolder =>
                getAllFilesRecursive(subfolder.id, "name,type,id,parent,parent.name,created_at,modified_at")
            ));
            return files.flat();
        }));
    return requiringInputByUser.flat();
};

const loadAdminDataCache = async () => {
    if (adminDataCache) return adminDataCache;

    const [allFilesSub, allFilesCom, allFilesRes, submitterFolderItems, roundSchedule] = await Promise.all([
        getAllFilesRecursive(submitterFolder, "name,type,id,parent,parent.name,created_at,modified_at"),
        getAllFilesRecursive(completedFolder, "name,type,id,parent,parent.name,created_at,modified_at"),
        getRequiringInputFiles(returnToSubmitterFolder),
        getFolderItems(submitterFolder, "name,type,id", 1000),
        fetch("./src/data/roundSchedule.json").then(response => response.ok ? response.json() : []).catch(() => [])
    ]);
    const scheduleByFolderName = new Map((roundSchedule || []).map(round => [round.folderName, round]));
    const submitterRoundFolders = (submitterFolderItems?.entries || [])
        .filter(item => item.type === "folder" && item.name.toLowerCase().startsWith("round"))
        .map(item => ({ ...item, ...(scheduleByFolderName.get(item.name) || {}) }));
    const [processedSub, processedCom, processedRes] = await Promise.all([
        getProcessedAdminFiles(allFilesSub, 'sub'),
        getProcessedAdminFiles(allFilesCom, 'com', allFilesSub, submitterRoundFolders),
        getProcessedAdminFiles(allFilesRes, 'res', [...allFilesSub, ...allFilesCom])
    ]);
    const roundFoldersById = new Map(submitterRoundFolders.map(folder => [String(folder.id), folder]));
    [...processedSub, ...processedCom, ...processedRes].forEach(file => {
        const roundFolder = roundFoldersById.get(String(file.roundId || ""));
        file.roundName = roundFolder?.name || file.roundName || "";
        file.roundNumber = getRoundNumberFromFileName(file.filename)
            || Number(roundFolder?.round)
            || getRoundNumberFromRoundName(file.roundName)
            || null;
    });
    adminDataCache = { sub: processedSub, com: processedCom, res: processedRes };
    return adminDataCache;
};

export const loadAcceptedAdminConceptRounds = async (forceRefresh = false) => {
    if (forceRefresh) adminDataCache = null;
    const [data, folderItems] = await Promise.all([
        loadAdminDataCache(),
        getFolderItems(submitterFolder, "name,type,id", 1000)
    ]);
    await hydrateAdminDocumentData({ sub: [], com: data.com, res: [] }, true);
    const roundFolders = (folderItems?.entries || [])
        .filter(item => item.type === "folder" && item.name.toLowerCase().startsWith("round"))
        .sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: "base" }));
    const roundNamesById = new Map(roundFolders.map(folder => [String(folder.id), folder.name]));
    const conceptsByRound = new Map(roundFolders.map(folder => [String(folder.id), []]));

    data.com.forEach(file => {
        const roundId = String(file.roundId || "");
        if (!roundNamesById.has(roundId)) return;
        conceptsByRound.get(roundId).push({
            fileId: String(file.fileId),
            fileName: file.filename,
            title: file.titlename || file.filename,
            requestedConsortia: Array.isArray(file.requestedConsortia) ? file.requestedConsortia : []
        });
    });

    return roundFolders.map(folder => ({
        id: String(folder.id),
        name: folder.name,
        concepts: conceptsByRound.get(String(folder.id)) || []
    }));
};

export const syncCurrentDataManagerChairRequests = async (onProgress = null) => {
    const report = message => { if (typeof onProgress === "function") onProgress(message); };
    const chair = chairsInfo.find(item => String(item.consortium).toUpperCase() === "C-NCI");
    if (!chair) throw new Error("The C-NCI chair configuration was not found.");
    const [newFiles, clarificationFiles, completeFiles, submitterItems, submitterFiles, completedFiles] = await Promise.all([
        getAllFilesRecursive(chair.boxIdNew, "name,type,id,description,parent,parent.name,created_at"),
        getAllFilesRecursive(chair.boxIdClara, "name,type,id,description,parent,parent.name,created_at"),
        getAllFilesRecursive(chair.boxIdComplete, "name,type,id,description,parent,parent.name,created_at"),
        getFolderItems(submitterFolder, "name,type,id", 1000),
        getAllFilesRecursive(submitterFolder, "name,type,id,parent,parent.name,created_at"),
        getAllFilesRecursive(completedFolder, "name,type,id,parent,parent.name,created_at")
    ]);
    const roundFolders = (submitterItems?.entries || [])
        .filter(item => item.type === "folder")
        .map(item => ({ id: String(item.id), name: item.name, roundNumber: getRoundNumberFromRoundName(item.name) }));
    const roundsByName = new Map(roundFolders.map(round => [round.name, round]));
    const masterFiles = Array.from(new Map([...(submitterFiles || []), ...(completedFiles || [])]
        .map(file => [String(file.id), file])).values());
    const masterFilesById = new Map(masterFiles.map(file => [String(file.id), file]));
    const getFileRound = file => {
        const parentRound = roundsByName.get(file?.parent?.name || "");
        if (parentRound) return parentRound;
        const roundNumber = getConceptRoundNumber(file);
        return roundNumber ? roundFolders.find(round => round.roundNumber === roundNumber) || null : null;
    };
    const resolveLegacyMaster = chairFile => {
        const chairConceptId = getConceptId(chairFile);
        const chairKey = getRoundConceptKey(chairFile?.name || "");
        const chairRound = getFileRound(chairFile);
        let candidates = masterFiles.filter(file => {
            if (chairConceptId && getConceptId(file) === chairConceptId) return true;
            if (chairKey && getRoundConceptKey(file.name) === chairKey) return true;
            return normalizeBoxFileName(file.name) === normalizeBoxFileName(chairFile?.name || "");
        });
        if (chairRound && candidates.length > 1) {
            const sameRound = candidates.filter(file => getFileRound(file)?.id === chairRound.id);
            if (sameRound.length) candidates = sameRound;
        }
        return candidates.length === 1 ? candidates[0] : null;
    };
    const stagedFiles = [
        ...(newFiles || []).map(file => ({ file, workflowStage: "chair_review" })),
        ...(clarificationFiles || []).map(file => ({ file, workflowStage: "chair_clarification" })),
        ...(completeFiles || []).map(file => ({ file, workflowStage: "chair_complete" }))
    ].filter(item => item.file?.type !== "folder");
    const reviewsByRound = new Map();
    let skipped = 0;
    let legacyMatched = 0;

    for (const [index, item] of stagedFiles.entries()) {
        const chairFileInfo = item.file.description ? item.file : await getFileInfo(item.file.id);
        const describedSourceId = String(chairFileInfo?.description || "").trim();
        let masterFile = /^\d+$/.test(describedSourceId) ? masterFilesById.get(describedSourceId) || null : null;
        if (!masterFile) {
            masterFile = resolveLegacyMaster(item.file);
            if (masterFile && !/^\d+$/.test(describedSourceId)) legacyMatched++;
        }
        const sourceFileId = /^\d+$/.test(describedSourceId) ? describedSourceId : String(masterFile?.id || "");
        let round = roundsByName.get(item.file.parent?.name || "") || getFileRound(masterFile || item.file);
        if (!round && /^\d+$/.test(sourceFileId)) {
            try {
                const sourceInfo = await getFileInfo(sourceFileId);
                round = getFileRound(sourceInfo);
            } catch (error) {
                console.warn(`Unable to resolve the source round for ${item.file.name}:`, error);
            }
        }
        if (!/^\d+$/.test(sourceFileId) || !round) {
            skipped++;
            continue;
        }
        report(`Reading C-NCI chair status ${index + 1} of ${stagedFiles.length}: ${item.file.name}`);
        let chairScore = "--";
        try {
            const commentResponses = await Promise.allSettled([listComments(sourceFileId), listComments(item.file.id)]);
            const comments = commentResponses.flatMap(result => result.status === "fulfilled" ? parseBoxCommentEntries(result.value) : []);
            chairScore = getDaccExportScores(comments).get("C-NCI") || "--";
        } catch (error) {
            console.warn(`Unable to read the C-NCI score for ${item.file.name}:`, error);
        }
        const review = {
            sourceFileId,
            chairFileId: item.file.id,
            fileName: item.file.name,
            title: item.file.name,
            consortium: "C-NCI",
            workflowStage: item.workflowStage,
            chairScore
        };
        const group = reviewsByRound.get(round.id) || { name: round.name, reviews: [] };
        const existingIndex = group.reviews.findIndex(entry => String(entry.sourceFileId) === sourceFileId);
        if (existingIndex >= 0) group.reviews[existingIndex] = review;
        else group.reviews.push(review);
        reviewsByRound.set(round.id, group);
    }

    for (const [roundId, group] of reviewsByRound.entries()) {
        await publishDataManagerChairRequests({
            round: { id: roundId, name: group.name },
            reviews: group.reviews,
            studies: studiesInfo,
            initiatedBy: String(JSON.parse(localStorage.parms || "{}").login || "")
        });
    }
    return { concepts: Array.from(reviewsByRound.values()).reduce((total, group) => total + group.reviews.length, 0), legacyMatched, skipped };
};

export const exportAdminConsortiaCsv = async () => {
    const data = await loadAdminDataCache();
    await hydrateAdminDocumentData(data, true);
    const exportItems = [...data.sub, ...data.com, ...data.res];
    if (!exportItems.length) {
        alert('No concepts are available to export.');
        return false;
    }

    const rows = [["Concept", "Requested Consortia/Study", "Concept Box ID"]];
    exportItems.forEach((item) => {
        const selections = Array.isArray(item.requestedConsortia) ? item.requestedConsortia : [];
        selections.forEach((selection) => rows.push([
            item.name || item.filename || '',
            selection,
            item.fileId || item.fileInfo?.id || ''
        ]));
    });

    if (rows.length === 1) {
        alert('No requested consortia or study selections were found in the concepts.');
        return false;
    }

    downloadCsvFile(rows, 'admin_consortia_requests.csv');
    return true;
};

export const generateAuthTableFiles = async () => {
    showAnimation();
    testingDataGov();
    const folderItems = await getFolderItems(submitterFolder);
    const roundFolders = folderItems.entries.filter(item => item.type === 'folder' && item.name.toLowerCase().startsWith('round'));
    roundFolders.sort((a, b) => b.name.localeCompare(a.name));

    await Promise.all([
        loadAdminDataCache(),
        loadAdminActionRequiredSelections().catch(error => {
            adminActionRequiredStorage = null;
            console.warn("Unable to load saved Action Required selections from Box:", error);
        })
    ]);

    const renderAuthSelectedRound = async (selectedFolderId) => {
        const tableContainer = document.getElementById('adminAccordian');
        if (tableContainer && tableContainer.innerHTML !== "") {
            const rows = tableContainer.querySelectorAll('.admin-table-row');
            rows.forEach(row => {
                const roundId = row.getAttribute('data-round-id');
                if (selectedFolderId === 'all' || roundId === selectedFolderId) row.classList.remove('d-none'); else row.classList.add('d-none');
            });
            return;
        }
        const filteredSub = adminDataCache.sub;
        const filteredCom = adminDataCache.com;
        const filteredRes = adminDataCache.res;
        await viewAuthFinalDecisionFilesTemplate(filteredSub, filteredCom, filteredRes);
        returnToChairs();
        returnToSubmitter();
        addRenameFilesEvent();
        const initRoundsBtn = document.getElementById('initRoundsBtn');
        if (initRoundsBtn) initRoundsBtn.addEventListener('click', createAllRoundFolders);
        if (selectedFolderId !== 'all') {
            document.querySelectorAll('.admin-table-row').forEach(row => {
                if (row.getAttribute('data-round-id') !== selectedFolderId) row.classList.add('d-none');
            });
        }
    };

    const roundSelectionContainer = document.getElementById('roundSelectionContainer');
    if (roundSelectionContainer && roundFolders.length > 0) {
        const activeRoundIds = new Set([
            ...adminDataCache.sub.map(file => file.roundId),
            ...adminDataCache.com.map(file => file.roundId),
            ...adminDataCache.res.map(file => file.roundId)
        ].filter(id => id));
        const displayRoundFolders = roundFolders.filter(folder => activeRoundIds.has(folder.id));

        let dropdownHtml = `<div style=\"display: flex; align-items: center; gap: 10px;\"><label for=\"roundSelect\"><b>Select Round:</b></label><select id=\"roundSelect\" class=\"form-select\" style=\"width: auto;\"><option value=\"all\">All Rounds</option>`;
        displayRoundFolders.forEach(folder => { dropdownHtml += `<option value="${folder.id}">${folder.name}</option>`; });
        dropdownHtml += `</select></div>`;
        roundSelectionContainer.innerHTML = dropdownHtml;
        document.getElementById('roundSelect').addEventListener('change', async (e) => {
            showAnimation();
            await renderAuthSelectedRound(e.target.value);
            hideAnimation();
        });
    }
    await renderAuthSelectedRound('all');

    hideAnimation();
};

const updateAdminDecisionScoreFromComment = (comment, rowFileId, change = true) => {
    if (!comment || !comment.message || !comment.message.startsWith("Consortium")) return;

    const cons = getCommentConsortium(comment);
    const ratingMatch = comment.message.match(/Rating:\s*([^,]+)/i);
    const score = ratingMatch ? ratingMatch[1].trim() : "--";
    if (!cons) return;

    const inputScore = document.getElementById(`${cons}${rowFileId}`);
    const selectElement = inputScore ? inputScore.children[0] : null;
    if (!selectElement) {
        console.warn(`Score cell not found for consortium ${cons} and file ${rowFileId}`);
        return;
    }

    selectElement.value = score;
    selectElement.className = "form-select form-select-sm decision-dropdown disabled";
    if (change === false) {
        selectElement.setAttribute("disabled", true);
        selectElement.classList.add(`badge-${score}`);
    } else if (score !== "--") {
        selectElement.classList.add(`badge-${score}`);
        selectElement.setAttribute("data-previous-value", selectElement.value);
    }
};

const getResponseText = (responseComment) => {
    const message = responseComment && responseComment.message ? responseComment.message : "";
    const commaIndex = message.indexOf(",");
    return commaIndex >= 0 ? message.substring(commaIndex + 1).trim() : message;
};

const showAuthCommentsWithResponses = async (rowFileId, commentsFileId, responseFileId = null, change = true) => {
    const commentSection = document.getElementById(`file${rowFileId}Comments`);
    if (!commentSection) return;

    try {
        const [commentsResponse, responseCommentsResponse] = await Promise.all([
            listComments(commentsFileId || rowFileId),
            responseFileId ? listComments(responseFileId) : Promise.resolve(null)
        ]);

        const comments = commentsResponse ? JSON.parse(commentsResponse).entries : [];
        const responseComments = responseCommentsResponse
            ? JSON.parse(responseCommentsResponse).entries.filter(comment => comment && comment.message && comment.message.startsWith("Response ID:"))
            : comments.filter(comment => comment && comment.message && comment.message.startsWith("Response ID:"));
        const sourceComments = comments.filter(comment => comment && comment.message && !comment.message.startsWith("Response ID:"));

        if (sourceComments.length === 0) {
            commentSection.innerHTML = "No Comments to show.";
            return;
        }

        let template = "<div class='container-fluid'>";
        for (const comment of sourceComments) {
            updateAdminDecisionScoreFromComment(comment, rowFileId, change);
            const commentDate = new Date(comment.created_at);
            const date = commentDate.toLocaleDateString();
            const time = commentDate.toLocaleTimeString();
            const responseId = getResponseTargetId(comment);
            const matchingResponses = responseComments.filter(responseComment => responseMatchesComment(responseComment, responseId));

            template += `
                <div>
                    <div class='row'>
                        <div class='col-8 p-0'>
                            <p class='text-primary small mb-0 align-left'>${escapeHtml(comment.created_by.name)}</p>
                        </div>
                    </div>
                    <div class='row'>
                        <p class='my-0' id='comment${comment.id}'>${escapeHtml(comment.message)}</p>
                    </div>
                    <div class='row'>
                        <p class='small mb-0 font-weight-light'>${date} at ${time}</p>
                    </div>
            `;

            matchingResponses.forEach(responseComment => {
                const responseDate = new Date(responseComment.created_at);
                template += `
                    <div class='row mt-2'>
                        <div class='col-12 p-2' style='background-color: #e7f3ff; border-left: 3px solid #007bff;'>
                            <small class='font-weight-bold'>Response from ${escapeHtml(responseComment.created_by.name)} (${responseDate.toLocaleDateString()} at ${responseDate.toLocaleTimeString()}):</small>
                            <p class='my-0'>${escapeHtml(getResponseText(responseComment))}</p>
                        </div>
                    </div>
                `;
            });

            template += `
                    <hr class='my-1'>
                </div>
            `;
        }

        template += "</div>";
        commentSection.innerHTML = template;
    } catch (error) {
        console.error("Error loading admin comments with responses:", error);
        commentSection.innerHTML = "<span class='text-danger'>Error loading comments.</span>";
    }
};

const hydrateAdminComments = async (files) => {
    const CHUNK_SIZE = 6;
    let loaded = 0;
    let failures = 0;
    setAdminHydrationProgress("comments", loaded, files.length);

    for (let i = 0; i < files.length; i += CHUNK_SIZE) {
        const chunk = files.slice(i, i + CHUNK_SIZE);
        const results = await Promise.allSettled(chunk.map(async file => {
            if (file.type === "res") {
                await showAuthCommentsWithResponses(file.fileId, file.commentsFileId, file.responseFileId, true);
            } else {
                await showCommentsDCEG(file.fileId, true);
            }

            const row = document.getElementById(String(file.fileId))?.closest(".admin-table-row");
            row?.querySelectorAll(".decision-dropdown").forEach(dropdown => {
                dropdown.disabled = false;
                dropdown.classList.remove("disabled");
                dropdown.removeAttribute("aria-busy");
                if (!dropdown.hasAttribute("data-previous-value")) {
                    dropdown.setAttribute("data-previous-value", dropdown.value || "--");
                }
            });
        }));

        loaded += results.length;
        failures += results.filter(result => result.status === "rejected").length;
        results.forEach((result, index) => {
            if (result.status !== "rejected") return;
            const file = chunk[index];
            const commentSection = document.getElementById(`file${file.fileId}Comments`);
            if (commentSection) commentSection.innerHTML = "<span class='text-danger'>Error loading comments.</span>";
            console.error(`Error loading admin comments for ${file.fileId}:`, result.reason);
        });
        setAdminHydrationProgress("comments", loaded, files.length, failures);
    }
};

const parseAdminActionRequiredTsv = (contents = "") => {
    const lines = String(contents).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n").filter(line => line.trim() !== "");
    if (lines.length < 2) return [];
    const headers = lines[0].split("\t").map(header => header.trim().toLowerCase());
    const fileIdIndex = headers.indexOf("file_id");
    const fileNameIndex = headers.indexOf("file_name");
    const actionIndex = headers.indexOf("action_required");
    if (fileIdIndex < 0 || actionIndex < 0) return [];

    return lines.slice(1).map(line => {
        const columns = line.split("\t");
        return {
            fileId: (columns[fileIdIndex] || "").trim(),
            fileName: fileNameIndex >= 0 ? (columns[fileNameIndex] || "").trim() : "",
            actionRequired: (columns[actionIndex] || "").trim()
        };
    }).filter(row => row.fileId && ADMIN_ACTION_REQUIRED_VALUES.has(row.actionRequired));
};

const setAdminActionRequiredState = (rows) => {
    adminActionRequiredByFileId = new Map();
    adminActionRequiredByFileName = new Map();
    rows.forEach(row => {
        adminActionRequiredByFileId.set(String(row.fileId), row.actionRequired);
        if (row.fileName) adminActionRequiredByFileName.set(row.fileName, row.actionRequired);
    });
};

const loadAdminActionRequiredSelections = async () => {
    setAdminActionRequiredState([]);
    const daccMembersInfo = await getFileInfo(DACCmembers);
    const parentId = daccMembersInfo?.parent?.id;
    if (!parentId) throw new Error("Unable to locate the DACC admin configuration folder in Box.");

    const folderItems = await getFolderItems(parentId, "name,type,id", 1000);
    const existingFile = (folderItems?.entries || []).find(item => item.type === "file" && item.name.toLowerCase() === ADMIN_ACTION_REQUIRED_FILE_NAME.toLowerCase());
    adminActionRequiredStorage = { parentId, fileId: existingFile?.id || null };
    if (!existingFile) return;

    const contents = await getFile(existingFile.id);
    setAdminActionRequiredState(parseAdminActionRequiredTsv(contents));
};

const getSavedAdminActionRequired = (fileId, fileName) => {
    return adminActionRequiredByFileId.get(String(fileId)) || adminActionRequiredByFileName.get(fileName) || "";
};

const sanitizeTsvValue = (value) => String(value || "").replace(/[\t\r\n]+/g, " ").trim();

const getAdminActionRequiredRows = () => Array.from(document.querySelectorAll(".action-required-dropdown"))
    .filter(dropdown => ADMIN_ACTION_REQUIRED_VALUES.has(dropdown.value))
    .map(dropdown => ({
        fileId: dropdown.dataset.fileId,
        fileName: dropdown.dataset.fileName,
        actionRequired: dropdown.value
    }));

const serializeAdminActionRequiredTsv = (rows) => {
    const output = ["file_id\tfile_name\taction_required"];
    rows.sort((a, b) => a.fileName.localeCompare(b.fileName)).forEach(row => {
        output.push([row.fileId, row.fileName, row.actionRequired].map(sanitizeTsvValue).join("\t"));
    });
    return `${output.join("\r\n")}\r\n`;
};

const updateSaveActionRequiredButton = () => {
    const button = document.getElementById("saveActionRequiredBtn");
    if (!button) return;
    const hasChanges = Array.from(document.querySelectorAll(".action-required-dropdown"))
        .some(dropdown => dropdown.value !== (dropdown.dataset.savedValue || ""));
    button.disabled = !hasChanges;
    button.style.opacity = hasChanges ? "1" : "0.5";
};

const saveAdminActionRequiredSelections = async (rows) => {
    if (!adminActionRequiredStorage?.parentId) await loadAdminActionRequiredSelections();
    const tsv = serializeAdminActionRequiredTsv(rows);
    let result;

    if (adminActionRequiredStorage.fileId) {
        result = await uploadFileVersion(tsv, adminActionRequiredStorage.fileId, "text/tab-separated-values");
    } else {
        result = await uploadFile(tsv, ADMIN_ACTION_REQUIRED_FILE_NAME, adminActionRequiredStorage.parentId, "text/tab-separated-values");
        if (result?.status === 409) {
            await loadAdminActionRequiredSelections();
            if (!adminActionRequiredStorage.fileId) throw new Error("The Box file already exists but could not be located.");
            result = await uploadFileVersion(tsv, adminActionRequiredStorage.fileId, "text/tab-separated-values");
        } else if (result?.entries?.[0]?.id) {
            adminActionRequiredStorage.fileId = result.entries[0].id;
        }
    }

    if (!result?.entries?.length) throw new Error(result?.statusText || "Box did not confirm the save.");
    setAdminActionRequiredState(rows);
};

const initializeAdminActionRequiredControls = () => {
    document.querySelectorAll(".action-required-dropdown").forEach(dropdown => {
        if (!dropdown.dataset.fileName) dropdown.dataset.fileName = dropdown.closest(".admin-table-row")?.querySelector(".admin-checkbox")?.value || "";
        dropdown.value = getSavedAdminActionRequired(dropdown.dataset.fileId, dropdown.dataset.fileName);
        dropdown.dataset.savedValue = dropdown.value;
        dropdown.addEventListener("change", updateSaveActionRequiredButton);
    });
    updateSaveActionRequiredButton();

    const saveButton = document.getElementById("saveActionRequiredBtn");
    if (!saveButton) return;
    saveButton.onclick = () => {
        const modalElement = document.getElementById("confluenceMainModal");
        const header = document.getElementById("confluenceModalHeader");
        const body = document.getElementById("confluenceModalBody");
        if (!modalElement || !header || !body) return;

        const changedCount = Array.from(document.querySelectorAll(".action-required-dropdown"))
            .filter(dropdown => dropdown.value !== (dropdown.dataset.savedValue || "")).length;
        header.innerHTML = `<h5 class="modal-title">Save Action Required</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`;
        body.innerHTML = `<form id="saveActionRequiredForm"><p>Save ${changedCount} changed Action Required selection${changedCount === 1 ? "" : "s"} to Box?</p><div id="saveActionRequiredStatus" class="alert d-none" role="alert"></div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button><button type="submit" class="btn btn-outline-primary">Save</button></div></form>`;
        bootstrap.Modal.getOrCreateInstance(modalElement).show();

        document.getElementById("saveActionRequiredForm").addEventListener("submit", async event => {
            event.preventDefault();
            const form = event.currentTarget;
            const submitButton = form.querySelector('button[type="submit"]');
            const status = document.getElementById("saveActionRequiredStatus");
            submitButton.disabled = true;
            submitButton.textContent = "Saving...";
            try {
                const rows = getAdminActionRequiredRows();
                await saveAdminActionRequiredSelections(rows);
                document.querySelectorAll(".action-required-dropdown").forEach(dropdown => { dropdown.dataset.savedValue = dropdown.value; });
                updateSaveActionRequiredButton();
                status.className = "alert alert-success";
                status.textContent = `Action Required selections were saved to ${ADMIN_ACTION_REQUIRED_FILE_NAME} in Box.`;
                submitButton.remove();
                const closeButton = form.querySelector('[data-bs-dismiss="modal"]');
                if (closeButton) closeButton.textContent = "Close";
            } catch (error) {
                console.error("Unable to save Action Required selections:", error);
                status.className = "alert alert-danger";
                status.textContent = "Unable to save Action Required selections to Box. Please try again.";
                submitButton.disabled = false;
                submitButton.textContent = "Save";
            }
        });
    };
};

const sortAdminTableByColumn = (table, columnIndex, ascending = true) => {
    const rowsContainer = table.querySelector("#adminAccordian");
    if (!rowsContainer) return;

    const rows = Array.from(rowsContainer.querySelectorAll(":scope > .admin-table-row"));
    const direction = ascending ? 1 : -1;
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

    const getCellValue = (row) => {
        const cell = row.firstElementChild && row.firstElementChild.children[columnIndex];
        if (!cell) return { empty: true, value: "" };

        const select = cell.querySelector("select");
        const value = String(select ? select.value : cell.textContent).trim();
        if (value === "" || value === "--") return { empty: true, value: "" };

        if (columnIndex === 3 || columnIndex === 4) {
            const timestamp = Date.parse(value);
            if (!Number.isNaN(timestamp)) return { empty: false, value: timestamp, type: "number" };
        }

        const roundMatch = value.match(/^R(\d+)$/i);
        if (roundMatch) return { empty: false, value: Number(roundMatch[1]), type: "number" };

        if (/^-?\d+(?:\.\d+)?$/.test(value)) {
            return { empty: false, value: Number(value), type: "number" };
        }

        return { empty: false, value, type: "text" };
    };

    rows.sort((a, b) => {
        const aCell = getCellValue(a);
        const bCell = getCellValue(b);
        if (aCell.empty && bCell.empty) return 0;
        if (aCell.empty) return 1;
        if (bCell.empty) return -1;

        if (aCell.type === "number" && bCell.type === "number") {
            return (aCell.value - bCell.value) * direction;
        }

        return collator.compare(String(aCell.value), String(bCell.value)) * direction;
    });

    rows.forEach(row => rowsContainer.appendChild(row));

    table.querySelectorAll(".header-sortable").forEach(header => {
        header.classList.remove("header-sort-asc", "header-sort-desc");
        const icon = header.querySelector(".sort-column i");
        if (icon) icon.className = "fas fa-sort";
    });

    const headerRow = table.querySelector(".div-sticky > .row-24");
    const activeHeader = headerRow && headerRow.children[columnIndex];
    if (activeHeader) {
        activeHeader.classList.add(ascending ? "header-sort-asc" : "header-sort-desc");
        const icon = activeHeader.querySelector(".sort-column i");
        if (icon) icon.className = ascending ? "fas fa-sort-up" : "fas fa-sort-down";
    }
};

export async function viewAuthFinalDecisionFilesTemplate(processedSub, processedCom, processedRes) {
    let template = "";
    const resFileNames = processedRes.map(file => file.name);
    const filteredSub = processedSub.filter(file => !resFileNames.includes(file.name));
    if (filteredSub.length > 0 || processedCom.length > 0 || processedRes.length > 0) {
        template += `<div id='decidedFiles'><div class='row'><div class="col-xl-12 filter-column" id="summaryFilterSiderBar"><div class="div-border white-bg align-left p-2"><div class="main-summary-row"><div class="col-xl-12 pl-1 pr-0"><span class="font-size-10"><h6 class="badge badge-pill badge-1">1</h6>: Approved as submitted<h6 class="badge badge-pill badge-2">2</h6>: Approved, pending conditions <h6 class="badge badge-pill badge-3">3</h6>: Approved, but data release delayed <h6 class="badge badge-pill badge-4">4</h6>: Not Approved <h6 class="badge badge-pill badge-5">5</h6>: Decision requires clarification <h6 class="badge badge-pill badge-777">777</h6>: Duplicate<h6 class="badge badge-pill badge-NA">NA</h6>: Not Applicable</span></div></div></div></div></div><div class='col-xl-12 pr-0'>`;
        template += renderConceptSearch("adminConceptSearch", "adminConceptSearchStatus");
        template += `<div id="adminHydrationStatus" class="small text-muted mb-2" aria-live="polite">Preparing background data...</div>`;
        template += viewAuthFinalDecisionFilesColumns();
        template += '<div id="files"> </div></div></div>';
    } else { template += `No files to show.</div></div>`; }
    document.getElementById("authTableView").innerHTML = template;
    if (filteredSub.length !== 0 || processedCom.length !== 0 || processedRes.length !== 0) {
        viewAuthFinalDecisionFiles(filteredSub, processedCom, processedRes);
        setupConceptSearch("adminConceptSearch", "adminConceptSearchStatus", "#adminAccordian > .admin-table-row");
        initializeAdminActionRequiredControls();
        const updateButtonStates = () => {
            const anyChecked = document.querySelectorAll('.pl:checked').length > 0;
            const rs = document.getElementById('returnSubmitter');
            const rc = document.getElementById('returnChairs');
            if (rs) { rs.disabled = !anyChecked; rs.style.opacity = anyChecked ? '1' : '0.5'; }
            if (rc) { rc.disabled = !anyChecked; rc.style.opacity = anyChecked ? '1' : '0.5'; }
        };
        updateButtonStates();
        document.querySelectorAll('.pl').forEach(checkbox => { checkbox.addEventListener('change', updateButtonStates); });
        Array.from(document.querySelectorAll(".preview-file")).forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const header = document.getElementById("confluencePreviewerModalHeader");
                header.innerHTML = `<h5 class="modal-title">File preview</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`;
                bootstrap.Modal.getOrCreateInstance(document.getElementById("confluencePreviewerModal")).show();
                showPreview(btn.dataset.fileId, "confluencePreviewerModalBody");
            });
        });
        const table = document.getElementById("decidedFiles");
        const headerRow = table.querySelector(".div-sticky > .row-24");
        if (headerRow) {
            Array.from(headerRow.children).forEach((header, index) => {
                if (!header.classList.contains("header-sortable")) return;
                header.addEventListener("click", () => {
                    const ascending = !header.classList.contains("header-sort-asc");
                    sortAdminTableByColumn(table, index, ascending);
                });
            });
        }
        const allDisplayedFiles = [...filteredSub, ...processedCom, ...processedRes];
        void hydrateAdminComments(allDisplayedFiles).catch(error => console.error("Error hydrating admin comments:", error));
        void hydrateAdminDocumentData({ sub: filteredSub, com: processedCom, res: processedRes })
            .catch(error => console.error("Error hydrating admin document data:", error));
    }
};

export function viewAuthFinalDecisionFiles(processedSubFiles, processedComFiles, processedResFiles) {
  let template = `<div class="row m-0 align-left allow-overflow w-100"><div class="accordion accordion-flush col-md-12" id="adminAccordian">`;
  const renderAdminConceptName = (file) => file.filename;
  const renderRow = (fInfo, fId, name, titlename, stn, subD, retD, roundInfo) => {
    const rId = roundInfo.roundId || "";
    const roundNumber = getConceptRoundNumber(roundInfo);
    const roundLabel = roundNumber ? `R${roundNumber}` : "--";
    return `<div class="accordian-item admin-table-row mb-2 border-bottom pb-2" data-round-id="${rId}" data-round-number="${roundNumber || ""}"><div class="row-24 align-items-center position-relative"><div class="col-24-1 text-left"><input type="checkbox" class="pl admin-checkbox" id="${fId}" value="${fInfo.name}" aria-label="Select file"></div><div class="col-24-2 text-left"><span class="responsive-text" title="${titlename}">${stn}</span></div><div class="col-24-1 text-left"><span class="responsive-text">${roundLabel}</span></div><div class="col-24-1 text-left"><span class="responsive-text">${new Date(subD).toDateString().substring(4)}</span></div><div class="col-24-1 text-left"><span class="responsive-text">${retD ? new Date(retD).toDateString().substring(4) : "--"}</span></div><div class="col-24-2 text-left">${fInfo.parent.id == completedFolder ? '<h6 class="badge badge-pill bg-success">Accepted</h6>' : fInfo.parent.id == deniedFolder ? '<h6 class="badge badge-pill bg-danger">Denied</h6>' : '<h6 class="badge badge-pill bg-warning">Ongoing</h6>'}</div><div class="col-24-2 text-center" id="AABCG${fId}" data-value="AABCG"><select class="form-select form-select-sm decision-dropdown"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="BCAC${fId}" data-value="BCAC"><select class="form-select form-select-sm decision-dropdown"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="C-NCI${fId}" data-value="C-NCI"><select class="form-select form-select-sm decision-dropdown"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="CIMBA${fId}" data-value="CIMBA"><select class="form-select form-select-sm decision-dropdown"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="LAGENO${fId}" data-value="LAGENO"><select class="form-select form-select-sm decision-dropdown"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="MERGE${fId}" data-value="MERGE"><select class="form-select form-select-sm decision-dropdown"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-3 text-center"><select class="form-select form-select-sm action-required-dropdown" data-file-id="${fId}" aria-label="Action required for ${escapeHtml(fInfo.name)}"><option value="" selected>--</option><option value="Move to Accepted">Move to Accepted</option><option value="Move to Declined">Move to Declined</option><option value="Needs Resending">Needs Resending</option></select></div><div class="col-24-1 text-right"><button class="accordion-toggle-btn" type="button" data-bs-toggle="collapse" data-bs-target="#file${fId}" aria-expanded="false" aria-controls="file${fId}"><i class="fas fa-chevron-down"></i></button></div></div><div id="file${fId}" class="accordion-collapse collapse"><div class="accordion-body"><div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Concept</div><div class="col">${name} <button class="btn btn-lg custom-btn preview-file" title='Preview File' data-file-id="${fId}"><i class="fas fa-external-link-alt" style="font-size: 0.8em;"></i></button></div></div><div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Round</div><div class="col">${roundLabel}</div></div><div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Investigator(s)</div><div class="col${roundInfo.contacts ? "" : " text-muted"}" id="investigators${fId}">${roundInfo.documentDataLoaded ? escapeHtml(roundInfo.contacts || "Not provided") : "Loading investigator details..."}</div></div><div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Comments</div><div class="col" id='file${fId}Comments'></div></div></div></div></div>`;
  };
  for (const f of processedSubFiles) template += renderRow(f.fileInfo, f.fileId, renderAdminConceptName(f), f.titlename, f.shorttitlename, f.submissionDate, f.returnedDate, f);
  for (const f of processedComFiles) template += renderRow(f.fileInfo, f.fileId, renderAdminConceptName(f), f.titlename, f.shorttitlename, f.submissionDate, f.returnedDate, f);
  for (const f of processedResFiles) template += renderRow(f.fileInfo, f.fileId, renderAdminConceptName(f), f.titlename, f.shorttitlename, f.submissionDate, f.returnedDate, f);
  template += `</div></div>`;
  if (document.getElementById("files") != null) {
    document.getElementById("files").innerHTML = template;
    document.querySelectorAll("#adminAccordian .decision-dropdown").forEach(dropdown => {
      dropdown.disabled = true;
      dropdown.setAttribute("aria-busy", "true");
    });
    document.querySelectorAll("#adminAccordian [id^='file'][id$='Comments']").forEach(commentSection => {
      commentSection.innerHTML = "<span class='text-muted'>Loading comments...</span>";
    });
    const adminFileNamesById = new Map([...processedSubFiles, ...processedComFiles, ...processedResFiles]
      .map(file => [String(file.fileId), file.fileInfo?.name || file.filename || ""]));
    const adminSearchDataById = new Map([...processedSubFiles, ...processedComFiles, ...processedResFiles]
      .map(file => [String(file.fileId), `${file.filename || file.fileInfo?.name || ""} ${getConceptId(file)} ${getConceptBoxId(file, file.fileId)} ${file.contacts || ""}`]));
    document.querySelectorAll(".action-required-dropdown").forEach(dropdown => {
      dropdown.dataset.fileName = adminFileNamesById.get(dropdown.dataset.fileId) || "";
    });
    const adminFilesById = new Map([...processedSubFiles, ...processedComFiles, ...processedResFiles]
      .map(file => [String(file.fileId), file]));
    const completedAdminFileIds = new Set(processedComFiles.map(file => String(file.fileId)));
    document.querySelectorAll(".admin-table-row > .row-24").forEach(row => {
      const rowFileId = row.querySelector(".admin-checkbox")?.id;
      const file = adminFilesById.get(String(rowFileId));
      const conceptCell = row.children[1];
      const roundCell = row.children[2];
      const stateCell = row.children[5];
      const actionCell = row.querySelector(".action-required-dropdown")?.parentElement;
      if (conceptCell && file) {
        conceptCell.classList.replace("col-24-2", "col-24-3");
        const conceptIdCell = document.createElement("div");
        conceptIdCell.className = "col-24-2 text-left";
        conceptIdCell.innerHTML = `<span class="responsive-text">${escapeHtml(getConceptId(file) || "--")}</span>`;
        row.insertBefore(conceptIdCell, row.children[2]);
        const boxId = getConceptBoxId(file, rowFileId);
        const detailsBody = row.closest(".admin-table-row")?.querySelector(".accordion-body");
        if (detailsBody) {
          const boxIdRow = document.createElement("div");
          boxIdRow.className = "row mb-1 m-0";
          boxIdRow.innerHTML = `<div class="col-md-2 pl-2 font-bold">Box ID</div><div class="col">${renderBoxFileLink(boxId)}</div>`;
          detailsBody.insertBefore(boxIdRow, detailsBody.children[1] || null);
        }
      }
      roundCell?.remove();
      stateCell?.classList.replace("col-24-2", "col-24-1");
      if (actionCell) {
        actionCell.classList.remove("col-24-3");
        actionCell.classList.add("col-24-2");
        row.insertBefore(actionCell, row.children[6]);
      }
      row.closest(".admin-table-row").dataset.searchText = adminSearchDataById.get(String(rowFileId)) || "";
      if (completedAdminFileIds.has(String(rowFileId))) {
        const statusBadge = row.querySelector(".badge");
        if (statusBadge) {
          statusBadge.classList.remove("bg-warning", "bg-danger");
          statusBadge.classList.add("bg-success");
          statusBadge.textContent = "Accepted";
        }
      }
    });
    document.querySelectorAll('.decision-dropdown').forEach(dropdown => {
      dropdown.addEventListener('change', function() {
        const selectedValue = this.value;
        const previousValue = this.getAttribute('data-previous-value') || '--';
        const scoreCell = this.closest('[data-value]');
        const consortium = scoreCell.getAttribute('data-value');
        const fileId = scoreCell.id.replace(consortium, '');
        const file = adminFilesById.get(String(fileId));
        const commentFileId = file?.commentsFileId || fileId;
        const scoreDropdown = this;
        const modalElement = document.getElementById("confluenceMainModal");
        const header = document.getElementById('confluenceModalHeader');
        const body = document.getElementById('confluenceModalBody');
        if (!modalElement || !header || !body) {
          scoreDropdown.value = previousValue;
          return;
        }

        // Keep the committed score visible until Box confirms the new comment.
        scoreDropdown.value = previousValue;
        header.innerHTML = `<h5 class="modal-title">Confirm Score Change</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`;
        body.innerHTML = `
          <form id="changeScore">
            <p>Change the <strong>${escapeHtml(consortium)}</strong> score from <strong>${escapeHtml(previousValue)}</strong> to <strong>${escapeHtml(selectedValue)}</strong>?</p>
            <div class="form-group mb-3">
              <label for="scoreMessage" class="form-label">Comment to post in Box</label>
              <textarea class="form-control" id="scoreMessage" rows="3" required>Changed by admin</textarea>
            </div>
            <div id="changeScoreStatus" class="alert d-none" role="alert"></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-outline-primary">Update Score</button>
            </div>
          </form>`;

        bootstrap.Modal.getOrCreateInstance(modalElement).show();
        document.getElementById('changeScore').addEventListener('submit', async event => {
          event.preventDefault();
          const form = event.currentTarget;
          const submitButton = form.querySelector('button[type="submit"]');
          const cancelButton = form.querySelector('[data-bs-dismiss="modal"]');
          const status = document.getElementById('changeScoreStatus');
          const comment = document.getElementById('scoreMessage').value.trim();
          submitButton.disabled = true;
          submitButton.textContent = 'Updating...';
          status.className = 'alert alert-info';
          status.textContent = 'Posting the score change to Box...';

          try {
            const submitMessage = `Consortium: ${consortium}, Rating: ${selectedValue}, Comment: ${comment}`;
            const commentResponse = await createComment(commentFileId, submitMessage);
            if (commentResponse?.status !== 201) throw new Error('Box did not confirm the score comment.');
            try {
              await updateDataManagerChairStatus({ conceptBoxId: commentFileId, consortium, score: selectedValue });
            } catch (managerStatusError) {
              console.warn("Unable to update the Data Managers score:", managerStatusError);
            }

            Array.from(scoreDropdown.classList)
              .filter(className => className.startsWith('badge-'))
              .forEach(className => scoreDropdown.classList.remove(className));
            scoreDropdown.value = selectedValue;
            scoreDropdown.setAttribute('data-previous-value', selectedValue);
            scoreDropdown.classList.remove('disabled');
            if (selectedValue !== '--') scoreDropdown.classList.add(`badge-${selectedValue}`);
            scoreDropdown.disabled = false;

            let commentsRefreshed = true;
            try {
              if (file?.type === 'res') {
                await showAuthCommentsWithResponses(fileId, file.commentsFileId, file.responseFileId, true);
              } else {
                await showCommentsDCEG(fileId, true);
              }
            } catch (commentRefreshError) {
              commentsRefreshed = false;
              console.warn(`Score saved, but comments could not be refreshed for ${fileId}:`, commentRefreshError);
            }
            scoreDropdown.value = selectedValue;
            scoreDropdown.setAttribute('data-previous-value', selectedValue);
            scoreDropdown.classList.remove('disabled');
            scoreDropdown.disabled = false;

            status.className = 'alert alert-success';
            status.textContent = commentsRefreshed
              ? 'The score and comment were saved in Box.'
              : 'The score and comment were saved in Box. The comments display will update the next time the table is loaded.';
            submitButton.remove();
            cancelButton.textContent = 'Close';
          } catch (error) {
            console.error(`Unable to update ${consortium} score for ${fileId}:`, error);
            scoreDropdown.value = previousValue;
            status.className = 'alert alert-danger';
            status.textContent = error.message || 'Unable to update the score. Please try again.';
            submitButton.disabled = false;
            submitButton.textContent = 'Try Again';
          }
        });
      });
    });
  }
}

const asBoxEntries = (items) => {
    if (Array.isArray(items)) return items;
    if (items && Array.isArray(items.entries)) return items.entries;
    return [];
};

const selectedAdminConcepts = () => Array.from(document.querySelectorAll('.pl:checked'));

const findFileByNameInFolders = async (fileName, folderIds) => {
    const normalizedFileName = normalizeBoxFileName(fileName);
    for (const folderId of folderIds) {
        if (!folderId) continue;
        const files = asBoxEntries(await getAllFilesRecursive(folderId, "name,type,id,parent,parent.name,created_at"));
        const match = files.find(file => file && normalizeBoxFileName(file.name) === normalizedFileName);
        if (match) return match;
    }
    return null;
};

const getOrCreateChildFolder = async (parentId, folderName) => {
    const existingItems = await getFolderItems(parentId, "name,type,id", 1000);
    const existingFolder = asBoxEntries(existingItems).find(item => item.type === "folder" && item.name === folderName);
    if (existingFolder) return existingFolder;

    const createdFolder = await createFolder(parentId, folderName);
    if (createdFolder && createdFolder.id) return createdFolder;

    const refreshedItems = await getFolderItems(parentId, "name,type,id", 1000);
    const refreshedFolder = asBoxEntries(refreshedItems).find(item => item.type === "folder" && item.name === folderName);
    if (refreshedFolder) return refreshedFolder;

    throw new Error(`Unable to create or locate folder: ${folderName}`);
};

const updateBoxFile = async (fileId, data) => {
    const accessToken = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(`https://api.box.com/2.0/files/${fileId}`, {
        method: "PUT",
        headers: {
            Authorization: "Bearer " + accessToken,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (response.status === 401) {
        if ((await refreshToken()) === true) return await updateBoxFile(fileId, data);
    }

    if (response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after")) || 1;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return await updateBoxFile(fileId, data);
    }

    if (response.ok) return await response.json();

    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || response.statusText || `Box update failed with status ${response.status}`);
};

const refreshAdminTable = () => {
    adminDataCache = null;
    generateAuthTableFiles();
};

export const returnToChairs = () => {
    const returnChairs = async (e) => {
        e.preventDefault();
        const selectedFiles = selectedAdminConcepts();

        if (selectedFiles.length === 0) {
            alert("Please select at least one file to return.");
            return;
        }

        const header = document.getElementById("confluenceModalHeader");
        const body = document.getElementById("confluenceModalBody");
        if (!header || !body) return;

        header.innerHTML = `
            <h5 class="modal-title">Select Chairs to Return Files To</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        `;

        let template = `
            <form id="chairSelectionForm">
                <div class="form-group mb-3">
                    <h6>Select which chairs to return the files to:</h6>
        `;

        chairsInfo.forEach(chair => {
            template += `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="${escapeHtml(chair.consortium)}" id="chair_${escapeHtml(chair.consortium)}">
                    <label class="form-check-label" for="chair_${escapeHtml(chair.consortium)}">${escapeHtml(chair.consortium)}</label>
                </div>
            `;
        });

        template += `
                </div>
                <div id="returnChairProgress" class="small mb-3"></div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Return to Selected Chairs</button>
                </div>
            </form>
        `;

        body.innerHTML = template;
        bootstrap.Modal.getOrCreateInstance(document.getElementById("confluenceMainModal")).show();

        document.getElementById("chairSelectionForm").addEventListener("submit", async (submitEvent) => {
            submitEvent.preventDefault();
            const selectedChairs = Array.from(document.querySelectorAll('#chairSelectionForm input[type="checkbox"]:checked')).map(cb => cb.value);

            if (selectedChairs.length === 0) {
                alert("Please select at least one chair.");
                return;
            }

            const progressDiv = document.getElementById("returnChairProgress");
            const submitButton = submitEvent.target.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = "Returning...";

            try {
                for (const checkbox of selectedFiles) {
                    for (const selectedConsortium of selectedChairs) {
                        const chair = chairsInfo.find(item => item.consortium === selectedConsortium);
                        if (!chair) continue;

                        if (progressDiv) progressDiv.innerHTML += `<p>Finding ${escapeHtml(checkbox.value)} for ${escapeHtml(selectedConsortium)}...</p>`;
                        const chairFile = await findFileByNameInFolders(checkbox.value, [chair.boxIdNew, chair.boxIdClara, chair.boxIdComplete]);
                        if (!chairFile) {
                            if (progressDiv) progressDiv.innerHTML += `<p class="text-warning">No matching chair copy found for ${escapeHtml(selectedConsortium)}.</p>`;
                            continue;
                        }

                        const task = await createCompleteTask(chairFile.id, "Returning to complete your review");
                        if (task && task.id) await assignTask(task.id, chair.email);
                        try {
                            await updateDataManagerChairStatus({ conceptBoxId: checkbox.id, consortium: selectedConsortium, workflowStage: "chair_review" });
                        } catch (managerStatusError) {
                            console.warn("Unable to update the Data Managers return-to-chair status:", managerStatusError);
                        }
                        if (progressDiv) progressDiv.innerHTML += `<p class="text-success">Returned to ${escapeHtml(selectedConsortium)}.</p>`;
                    }
                }

                if (progressDiv) progressDiv.innerHTML += `<p><strong>Return to chairs complete.</strong></p>`;
                body.innerHTML += `<div class="modal-footer"><button type="button" class="btn btn-primary" data-bs-dismiss="modal" id="refreshAfterChairReturn">Close & Refresh</button></div>`;
                const refreshButton = document.getElementById("refreshAfterChairReturn");
                if (refreshButton) refreshButton.addEventListener("click", refreshAdminTable);
            } catch (error) {
                console.error("Error returning files to chairs:", error);
                if (progressDiv) progressDiv.innerHTML += `<p class="text-danger">Error: ${escapeHtml(error.message)}</p>`;
                submitButton.disabled = false;
                submitButton.textContent = "Return to Selected Chairs";
            }
        });
    };

    const returnChairsButton = document.querySelector("#returnChairs");
    if (returnChairsButton) returnChairsButton.onclick = returnChairs;
};

export const returnToSubmitter = () => {
    const returnSubmitter = async (e) => {
        e.preventDefault();
        const selectedFiles = selectedAdminConcepts();

        if (selectedFiles.length === 0) {
            alert("Please select at least one file to return.");
            return;
        }

        const header = document.getElementById("confluenceModalHeader");
        const body = document.getElementById("confluenceModalBody");
        if (!header || !body) return;

        header.innerHTML = `
            <h5 class="modal-title">Select Decision for File Return</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        `;

        body.innerHTML = `
            <form id="decisionSelectionForm">
                <div class="form-group mb-3">
                    <h6>File to be returned:</h6>
                    <p><strong>${escapeHtml(selectedFiles[0].value)}</strong></p>
                    <h6>Select decision:</h6>
                    <div class="d-grid gap-2">
                        <button type="button" class="btn btn-success decision-btn" data-decision="Accepted">Accept: No comments from DACC</button>
                        <button type="button" class="btn btn-danger decision-btn" data-decision="Denied">Deny</button>
                        <button type="button" class="btn btn-warning decision-btn" data-decision="Requiring Input">Require Input</button>
                    </div>
                </div>
            </form>
        `;

        bootstrap.Modal.getOrCreateInstance(document.getElementById("confluenceMainModal")).show();

        document.querySelectorAll(".decision-btn").forEach(button => {
            button.addEventListener("click", async () => {
                await processFileReturn(selectedFiles[0], button.dataset.decision);
            });
        });
    };

    const processFileReturn = async (checkbox, decision) => {
        const header = document.getElementById("confluenceModalHeader");
        const body = document.getElementById("confluenceModalBody");
        if (!header || !body) return;

        header.innerHTML = `<h5 class="modal-title">Processing File Return</h5>`;
        body.innerHTML = '<div id="returnToSubmitterInfo" style="max-height: 400px; overflow-y: auto;"></div>';

        const progressDiv = document.getElementById("returnToSubmitterInfo");
        const addStatus = (message) => {
            progressDiv.innerHTML += `<p>${message}</p>`;
            progressDiv.scrollTop = progressDiv.scrollHeight;
        };

        try {
            addStatus("Starting process...");
            addStatus(`Gathering data for Box file: ${escapeHtml(checkbox.id)}`);

            const fileSelected = await getFileInfo(checkbox.id);
            const fileName = fileSelected.name;
            const submitterEmail = fileSelected.created_by.login;
            const userFolderName = `The_Confluence_Project_Returned_Concepts-${submitterEmail}`;
            const rowRoundId = checkbox.closest(".admin-table-row")?.dataset.roundId;
            let roundName = fileSelected.parent?.name?.toLowerCase().startsWith("round") ? fileSelected.parent.name : "";
            if (!roundName && rowRoundId) {
                const roundInfo = await getFolderInfo(rowRoundId);
                if (roundInfo?.name?.toLowerCase().startsWith("round")) roundName = roundInfo.name;
            }
            if ((decision === "Accepted" || decision === "Denied") && !roundName) {
                throw new Error("Unable to determine the submission round for this concept.");
            }

            addStatus(`Locating return folder for ${escapeHtml(submitterEmail)}...`);
            const userFolder = await getOrCreateChildFolder(returnToSubmitterFolder, userFolderName);

            addStatus("Ensuring return subfolders exist...");
            await getOrCreateChildFolder(userFolder.id, "Accepted");
            await getOrCreateChildFolder(userFolder.id, "Denied");
            await getOrCreateChildFolder(userFolder.id, "Requiring Input");

            addStatus("Adding submitter access if needed...");
            await addNewCollaborator(userFolder.id, "folder", submitterEmail, "viewer");

            addStatus(`Finding ${escapeHtml(decision)} folder...`);
            const targetFolder = await getOrCreateChildFolder(userFolder.id, decision);

            addStatus(`Copying file to ${escapeHtml(decision)} folder...`);
            const copiedFile = await copyFile(checkbox.id, targetFolder.id, String(checkbox.id));
            const copiedFileId = copiedFile.id;

            addStatus("Copying comments...");
            const returnComments = await listComments(checkbox.id);
            const commentsToCopy = JSON.parse(returnComments).entries;
            await copyComments(commentsToCopy, copiedFileId);

            if (decision === "Accepted" || decision === "Denied") {
                for (const chair of chairsInfo) {
                    addStatus(`Searching chair folders for same file: ${escapeHtml(chair.consortium)}`);
                    const chairFile = await findFileByNameInFolders(fileName, [chair.boxIdNew, chair.boxIdClara]);
                    if (chairFile) {
                        addStatus(`Moving chair copy to completed folder: ${escapeHtml(chair.consortium)}`);
                        await moveFileToChairFolder(chairFile.id, chair.boxIdComplete);
                    }
                }

                addStatus(`Ensuring completed round folder exists: ${escapeHtml(roundName)}...`);
                const completedRoundFolder = await getOrCreateChildFolder(completedFolder, roundName);
                addStatus(`Moving submitter file to completed/${escapeHtml(roundName)}...`);
                await moveFile(checkbox.id, completedRoundFolder.id);
            }

            try {
                const workflowStage = decision === "Accepted"
                    ? "admin_accepted"
                    : decision === "Denied"
                        ? "admin_denied"
                        : "admin_clarification";
                await updateDataManagerChairStatus({ conceptBoxId: checkbox.id, workflowStage });
            } catch (managerStatusError) {
                console.warn("Unable to update the Data Managers administrative status:", managerStatusError);
            }

            addStatus(`Preparing email for submitter: ${escapeHtml(submitterEmail)}`);
            addStatus('<strong class="text-success">Complete.</strong>');

            header.innerHTML = `
                <h5 class="modal-title">File Return Complete</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            `;

            body.innerHTML += `
                <div class="mt-3 text-center">
                    <button type="button" class="btn btn-primary" id="sendEmailAndRefresh">Send Email & Refresh</button>
                </div>
            `;

            document.getElementById("sendEmailAndRefresh").addEventListener("click", () => {
                window.location.href = `mailto:${submitterEmail}?subject=Confluence Project: DACC responses to your concept submission are ready for your review&body=Your Confluence data access submission for ${encodeURIComponent(fileName)} has been returned. Please review the comments at https://epidataplatforms.cancer.gov/confluence/#data_submissions`;
                setTimeout(() => {
                    bootstrap.Modal.getOrCreateInstance(document.getElementById("confluenceMainModal")).hide();
                    refreshAdminTable();
                }, 500);
            });
        } catch (error) {
            console.error("Error returning file to submitter:", error);
            addStatus(`<span class="text-danger">Error: ${escapeHtml(error.message)}</span>`);
        }
    };

    const returnSubmitterButton = document.querySelector("#returnSubmitter");
    if (returnSubmitterButton) returnSubmitterButton.onclick = returnSubmitter;
};

export const copyComments = async (comments, fileId) => {
    for (const chair of chairsInfo) {
        const chairComments = comments.filter(comment => comment.message && comment.message.includes(`Consortium: ${chair.consortium}`));

        for (const comment of chairComments) {
            await createComment(fileId, `${comment.message} Box Comment ID: ${comment.id}`);
        }
    }
};

const DATA_GOV_USERS_FILE_ID = 1932355916952;

const getCollaborationEmail = (collaboration) => {
    if (collaboration && collaboration.accessible_by && collaboration.accessible_by.login) {
        return collaboration.accessible_by.login;
    }
    return collaboration && collaboration.invite_email ? collaboration.invite_email : "";
};

const getCollaboratorEmailSet = (collaborations) => new Set(
    asBoxEntries(collaborations)
        .map(getCollaborationEmail)
        .filter(email => email)
        .map(email => email.toLowerCase())
);

const getAuthorizedUserEmails = (csvText) => {
    const parsed = csv2Json(csvText);
    return parsed.data
        .map(user => user.Email || user.email || user.EMAIL)
        .filter(email => email)
        .map(email => email.trim().toLowerCase())
        .filter((email, index, emails) => emails.indexOf(email) === index);
};

const isSuccessfulCollaboratorResponse = (response) => response && response.status >= 200 && response.status < 300;

export const testingDataGov = () => {
    const testform = document.getElementById("submitID");
    if (!testform) return;

    testform.onclick = async (e) => {
        e.preventDefault();
        await dataGovTest();
    };
};

export const dataGovTest = async () => {
    const submitButton = document.getElementById("submitID");
    if (submitButton) {
        submitButton.classList.add("buttonsubmit--loading");
        submitButton.disabled = true;
    }

    const header = document.getElementById("confluenceModalHeader");
    const body = document.getElementById("confluenceModalBody");

    try {
        const [authorizedUserCsv, authorizedUserFileInfo, metadataCollaborators, eventsCollaborators, uploadCollaborators] = await Promise.all([
            getFile(DATA_GOV_USERS_FILE_ID),
            getFileInfo(DATA_GOV_USERS_FILE_ID),
            getCollaboration(Confluence_Data_Platform_Metadata_Shared_with_Investigators, 'folders', 1000),
            getCollaboration(Confluence_Data_Platform_Events_Page_Shared_with_Investigators, 'folders', 1000),
            getCollaboration(submitterFolder, 'folders', 1000)
        ]);

        const allEmails = getAuthorizedUserEmails(authorizedUserCsv);
        const metadataEmails = getCollaboratorEmailSet(metadataCollaborators);
        const eventsEmails = getCollaboratorEmailSet(eventsCollaborators);
        const uploadEmails = getCollaboratorEmailSet(uploadCollaborators);

        const notIncludedEmailsMetadata = allEmails.filter(email => !metadataEmails.has(email));
        const notIncludedEmailsEvents = allEmails.filter(email => !eventsEmails.has(email));
        const notIncludedEmailsUpload = allEmails.filter(email => !uploadEmails.has(email));
        const hasUsersToAdd = notIncludedEmailsMetadata.length > 0 || notIncludedEmailsEvents.length > 0 || notIncludedEmailsUpload.length > 0;

        if (!header || !body) {
            if (!hasUsersToAdd) alert("No users need to be added.");
            return;
        }

        header.innerHTML = `
            <h5 class="modal-title">Confirm Adding Collaborators</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        `;

        let confirmationList = "";
        if (authorizedUserFileInfo && authorizedUserFileInfo.modified_at) {
            confirmationList += `<p class="small text-muted">Authorized user list last modified: ${new Date(authorizedUserFileInfo.modified_at).toLocaleString()}</p>`;
        }

        if (hasUsersToAdd) {
            confirmationList += "<p><strong>The following users will be added:</strong></p>";
            notIncludedEmailsMetadata.forEach(email => {
                confirmationList += `<p>User: ${escapeHtml(email)}, Folder: Metadata, Permission: viewer</p>`;
            });
            notIncludedEmailsEvents.forEach(email => {
                confirmationList += `<p>User: ${escapeHtml(email)}, Folder: Events, Permission: previewer</p>`;
            });
            notIncludedEmailsUpload.forEach(email => {
                confirmationList += `<p>User: ${escapeHtml(email)}, Folder: Upload, Permission: uploader</p>`;
            });
        } else {
            confirmationList += "<p>No users need to be added.</p>";
        }

        body.innerHTML = `
            <div style="height: ${Math.floor(window.innerHeight * 2/3)}px; overflow-y: auto; padding-right: 15px;">
                ${confirmationList}
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="confirmAddCollaborators" ${!hasUsersToAdd ? "disabled" : ""}>OK - Add Collaborators</button>
            </div>
        `;

        bootstrap.Modal.getOrCreateInstance(document.getElementById("confluenceMainModal")).show();

        if (!hasUsersToAdd) return;

        document.getElementById("confirmAddCollaborators").onclick = async () => {
            body.innerHTML = '<div id="collaboratorList" style="max-height: 400px; overflow-y: auto;"><p>Adding collaborators...</p></div>';
            const listElement = document.getElementById("collaboratorList");
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            let requestCount = 0;
            let issueCount = 0;

            const addCollaboratorWithStatus = async (email, folderId, folderName, role) => {
                if (requestCount >= 50) {
                    listElement.innerHTML += "<p>Rate limit reached, waiting 60 seconds...</p>";
                    await delay(60000);
                    requestCount = 0;
                }

                listElement.innerHTML += `<p>Adding User: ${escapeHtml(email)}, Folder: ${escapeHtml(folderName)}, Permission: ${escapeHtml(role)}</p>`;
                listElement.scrollTop = listElement.scrollHeight;

                const response = await addNewCollaborator(folderId, 'folder', email, role);
                requestCount++;

                if (isSuccessfulCollaboratorResponse(response)) {
                    listElement.innerHTML += `<p><span style="color: green;">Successful</span>: ${escapeHtml(email)}, Folder: ${escapeHtml(folderName)}, Permission: ${escapeHtml(role)}</p>`;
                } else {
                    issueCount += 1;
                    const status = response && response.status ? ` (${response.status})` : "";
                    listElement.innerHTML += `<p><span style="color: red;">Failed${status}</span>: ${escapeHtml(email)}, Folder: ${escapeHtml(folderName)}, Permission: ${escapeHtml(role)}</p>`;
                }
                listElement.scrollTop = listElement.scrollHeight;
            };

            for (const email of notIncludedEmailsMetadata) {
                await addCollaboratorWithStatus(email, Confluence_Data_Platform_Metadata_Shared_with_Investigators, "Metadata", "viewer");
            }
            for (const email of notIncludedEmailsEvents) {
                await addCollaboratorWithStatus(email, Confluence_Data_Platform_Events_Page_Shared_with_Investigators, "Events", "previewer");
            }
            for (const email of notIncludedEmailsUpload) {
                await addCollaboratorWithStatus(email, submitterFolder, "Upload", "uploader");
            }

            if (issueCount > 0) {
                listElement.innerHTML += `<p><strong>${issueCount} issues detected. Please review list or try again.</strong></p>`;
            } else {
                listElement.innerHTML += "<p><strong>All collaborators added successfully.</strong></p>";
            }
        };
    } catch (error) {
        console.error("Error updating data governance collaborators:", error);
        if (header && body) {
            header.innerHTML = `
                <h5 class="modal-title">Update Users Error</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            `;
            body.innerHTML = `<p class="text-danger">Unable to update users: ${escapeHtml(error.message)}</p>`;
            bootstrap.Modal.getOrCreateInstance(document.getElementById("confluenceMainModal")).show();
        } else {
            alert(`Unable to update users: ${error.message}`);
        }
    } finally {
        if (submitButton) {
            submitButton.classList.remove("buttonsubmit--loading");
            submitButton.disabled = false;
        }
    }
};

export const addRenameFilesEvent = () => {
    const renameBtn = document.getElementById("renameFilesBtn");
    if (renameBtn) renameBtn.onclick = showRenameFilesPopup;
};

const getRoundNumberFromFolderName = (folderName, scheduleByFolderName = new Map()) => {
    const scheduledRound = scheduleByFolderName.get(String(folderName || ""));
    if (scheduledRound && Number.isFinite(Number(scheduledRound.round))) return Number(scheduledRound.round);
    const folderMatch = String(folderName || "").match(/^Round[_\s-]*(\d+)/i);
    return folderMatch ? Number(folderMatch[1]) : null;
};

const getRoundNumberFromConceptDate = (fileName, schedule) => {
    const normalizedFileName = normalizeConceptFileNamePunctuation(removeRoundSuffixFromFileName(fileName));
    const dateMatch = normalizedFileName.match(/_(\d{4}-\d{2}-\d{2})(?:\.[^.]+)?$/);
    if (!dateMatch) return null;
    const conceptDate = new Date(`${dateMatch[1]}T12:00:00`);
    if (Number.isNaN(conceptDate.getTime())) return null;
    const matchingRound = schedule.find(round => {
        const startDate = new Date(round.startDate);
        const endDate = new Date(round.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        return !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && conceptDate >= startDate && conceptDate <= endDate;
    });
    return matchingRound ? Number(matchingRound.round) : null;
};

const getRoundConceptKey = (fileName) => normalizeConceptFileNamePunctuation(removeRoundSuffixFromFileName(fileName))
    .trim()
    .toLowerCase();

const shouldSkipConceptIdRename = (fileName) => /^Concept\s+\d+\b/i.test(String(fileName || "").trim());

const buildRoundConceptAssignments = (files, roundNumber) => {
    const conceptsByKey = new Map();
    files.forEach(file => {
        const conceptKey = getRoundConceptKey(file.name);
        if (!conceptsByKey.has(conceptKey)) conceptsByKey.set(conceptKey, []);
        conceptsByKey.get(conceptKey).push(file);
    });

    const orderedConcepts = Array.from(conceptsByKey.entries())
        .map(([conceptKey, conceptFiles]) => ({
            conceptKey,
            files: conceptFiles,
            createdAt: Math.min(...conceptFiles.map(file => Date.parse(file.created_at || "")).filter(Number.isFinite))
        }))
        .sort((a, b) => {
            const aCreatedAt = Number.isFinite(a.createdAt) ? a.createdAt : Number.MAX_SAFE_INTEGER;
            const bCreatedAt = Number.isFinite(b.createdAt) ? b.createdAt : Number.MAX_SAFE_INTEGER;
            return aCreatedAt - bCreatedAt
                || a.conceptKey.localeCompare(b.conceptKey)
                || String(a.files[0].id).localeCompare(String(b.files[0].id), undefined, { numeric: true });
        });

    const byConceptKey = new Map();
    const byFileId = new Map();
    orderedConcepts.forEach((concept, index) => {
        const assignment = { roundNumber: Number(roundNumber), conceptNumber: index + 1, conceptKey: concept.conceptKey };
        byConceptKey.set(concept.conceptKey, assignment);
        concept.files.forEach(file => byFileId.set(String(file.id), assignment));
    });
    return { byConceptKey, byFileId, conceptCount: orderedConcepts.length };
};

const addWorkflowRoot = (roots, id, label) => {
    if (!id) return;
    const key = String(id);
    if (!roots.has(key)) roots.set(key, { id: key, labels: new Set() });
    roots.get(key).labels.add(label);
};

const buildRoundRenamePlan = async () => {
    const scheduleResponse = await fetch('./src/data/roundSchedule.json');
    if (!scheduleResponse.ok) throw new Error(`Unable to load the round schedule (${scheduleResponse.status}).`);
    const schedule = await scheduleResponse.json();
    const scheduleByFolderName = new Map(schedule.map(round => [round.folderName, round]));
    const submitterItems = await getFolderItems(submitterFolder, "name,type,id", 1000);
    const roundFolders = asBoxEntries(submitterItems)
        .filter(item => item.type === "folder")
        .map(folder => ({ ...folder, roundNumber: getRoundNumberFromFolderName(folder.name, scheduleByFolderName) }))
        .filter(folder => Number.isFinite(folder.roundNumber));

    if (!roundFolders.length) throw new Error("No submitter round folders were found. No files were changed.");

    const fileFields = "name,type,id,parent,parent.name,created_at,description";
    const sourceRoundsByKey = new Map();
    const sourceConceptsByRound = new Map();
    const sourceAssignmentsById = new Map();
    const conceptAssignmentsByRound = new Map();
    const discoveredFiles = new Map();
    const skippedFiles = new Map();
    const recordSkippedFile = (file, locations) => {
        const fileId = String(file.id);
        if (!skippedFiles.has(fileId)) skippedFiles.set(fileId, { file, locations: new Set() });
        locations.forEach(location => skippedFiles.get(fileId).locations.add(location));
    };

    const sourceRoundResults = [];
    const ROUND_CHUNK_SIZE = 4;
    for (let index = 0; index < roundFolders.length; index += ROUND_CHUNK_SIZE) {
        sourceRoundResults.push(...await Promise.all(roundFolders.slice(index, index + ROUND_CHUNK_SIZE).map(async folder => ({
            folder,
            files: await getAllFilesRecursive(folder.id, fileFields)
        }))));
    }

    sourceRoundResults.forEach(({ folder, files }) => {
        files.filter(file => /\.docx?$/i.test(file.name || "")).forEach(file => {
            if (shouldSkipConceptIdRename(file.name)) {
                recordSkippedFile(file, [`Submitter / ${folder.name}`]);
                return;
            }
            const roundNumber = folder.roundNumber;
            const conceptKey = getRoundConceptKey(file.name);
            if (!sourceRoundsByKey.has(conceptKey)) sourceRoundsByKey.set(conceptKey, new Set());
            sourceRoundsByKey.get(conceptKey).add(roundNumber);
            if (!sourceConceptsByRound.has(roundNumber)) sourceConceptsByRound.set(roundNumber, new Map());
            const roundConcepts = sourceConceptsByRound.get(roundNumber);
            if (!roundConcepts.has(conceptKey)) roundConcepts.set(conceptKey, []);
            roundConcepts.get(conceptKey).push(file);
            discoveredFiles.set(String(file.id), { file, locations: new Set([`Submitter / ${folder.name}`]) });
        });
    });

    sourceConceptsByRound.forEach((roundConcepts, roundNumber) => {
        const assignments = buildRoundConceptAssignments(Array.from(roundConcepts.values()).flat(), roundNumber);
        assignments.byFileId.forEach((assignment, fileId) => sourceAssignmentsById.set(fileId, assignment));
        conceptAssignmentsByRound.set(roundNumber, assignments.byConceptKey);
    });

    const workflowRoots = new Map();
    addWorkflowRoot(workflowRoots, submitterFolder, "Submitter");
    addWorkflowRoot(workflowRoots, completedFolder, "Completed");
    addWorkflowRoot(workflowRoots, returnToSubmitterFolder, "Returned to Submitter");
    addWorkflowRoot(workflowRoots, acceptedFolder, "Accepted");
    addWorkflowRoot(workflowRoots, deniedFolder, "Denied");
    chairsInfo.forEach(chair => {
        addWorkflowRoot(workflowRoots, chair.boxId, `${chair.consortium} Chair`);
        addWorkflowRoot(workflowRoots, chair.boxIdNew, `${chair.consortium} / New`);
        addWorkflowRoot(workflowRoots, chair.boxIdClara, `${chair.consortium} / Clarification`);
        addWorkflowRoot(workflowRoots, chair.boxIdComplete, `${chair.consortium} / Complete`);
    });

    const roots = Array.from(workflowRoots.values());
    const ROOT_CHUNK_SIZE = 4;
    for (let index = 0; index < roots.length; index += ROOT_CHUNK_SIZE) {
        const rootResults = await Promise.all(roots.slice(index, index + ROOT_CHUNK_SIZE).map(async root => ({
            root,
            files: await getAllFilesRecursive(root.id, fileFields)
        })));
        rootResults.forEach(({ root, files }) => {
            files.filter(file => /\.docx?$/i.test(file.name || "")).forEach(file => {
                if (shouldSkipConceptIdRename(file.name)) {
                    recordSkippedFile(file, Array.from(root.labels));
                    return;
                }
                const fileId = String(file.id);
                if (!discoveredFiles.has(fileId)) discoveredFiles.set(fileId, { file, locations: new Set() });
                root.labels.forEach(label => discoveredFiles.get(fileId).locations.add(label));
            });
        });
    }

    const planned = [];
    const alreadyCorrect = [];
    const unmatched = [];
    const ambiguous = [];

    discoveredFiles.forEach(({ file, locations }) => {
        const fileId = String(file.id);
        const conceptKey = getRoundConceptKey(file.name);
        const possibleRounds = sourceRoundsByKey.get(conceptKey) || new Set();
        const describedSourceId = String(file.description || "").trim();
        const sourceAssignment = sourceAssignmentsById.get(fileId);
        const describedAssignment = sourceAssignmentsById.get(describedSourceId);
        let roundNumber = sourceAssignment?.roundNumber;
        let conceptNumber = sourceAssignment?.conceptNumber;
        let matchedBy = roundNumber ? "submitter round folder" : "";

        if (!roundNumber && describedAssignment) {
            roundNumber = describedAssignment.roundNumber;
            conceptNumber = describedAssignment.conceptNumber;
            matchedBy = "source Concept ID";
        }
        const filenameRound = getRoundNumberFromFileName(file.name);
        if (!roundNumber && Number.isFinite(filenameRound) && possibleRounds.has(filenameRound)) {
            roundNumber = filenameRound;
            matchedBy = "existing filename round";
        }
        if (!roundNumber && possibleRounds.size === 1) {
            roundNumber = Array.from(possibleRounds)[0];
            matchedBy = "concept filename";
        }
        if (!roundNumber) {
            const parentRound = getRoundNumberFromFolderName(file.parent?.name, scheduleByFolderName);
            if (Number.isFinite(parentRound)) {
                roundNumber = parentRound;
                matchedBy = "workflow round folder";
            }
        }
        if (!roundNumber) {
            const datedRound = getRoundNumberFromConceptDate(file.name, schedule);
            if (Number.isFinite(datedRound)) {
                roundNumber = datedRound;
                matchedBy = "concept submission date";
            }
        }

        const item = { file, locations: Array.from(locations).sort(), possibleRounds: Array.from(possibleRounds).sort((a, b) => a - b) };
        if (!roundNumber) {
            if (possibleRounds.size > 1) ambiguous.push({ ...item, reason: `matches rounds ${item.possibleRounds.join(", ")}` });
            else unmatched.push({ ...item, reason: "round could not be determined" });
            return;
        }

        if (!conceptNumber) conceptNumber = conceptAssignmentsByRound.get(roundNumber)?.get(conceptKey)?.conceptNumber;
        if (!conceptNumber) {
            unmatched.push({ ...item, roundNumber, reason: `no authoritative concept match was found in Round ${roundNumber}` });
            return;
        }

        const newFileName = addConceptIdSuffixToFileName(file.name, roundNumber, conceptNumber);
        const plannedItem = { ...item, roundNumber, conceptNumber, matchedBy, newFileName };
        planned.push(plannedItem);
        if (newFileName === file.name) alreadyCorrect.push(plannedItem);
    });

    const plannedById = new Map(planned.map(item => [String(item.file.id), item]));
    const filesByFolderAndTargetName = new Map();
    discoveredFiles.forEach(({ file }) => {
        const targetName = plannedById.get(String(file.id))?.newFileName || file.name;
        const key = `${file.parent?.id || ""}|${String(targetName || "").toLowerCase()}`;
        if (!filesByFolderAndTargetName.has(key)) filesByFolderAndTargetName.set(key, new Set());
        filesByFolderAndTargetName.get(key).add(String(file.id));
    });
    const collisions = [];
    const changes = planned.filter(item => item.newFileName !== item.file.name);
    const safeChanges = changes.filter(change => {
        const key = `${change.file.parent?.id || ""}|${change.newFileName.toLowerCase()}`;
        const conflictingIds = Array.from(filesByFolderAndTargetName.get(key) || []).filter(id => id !== String(change.file.id));
        if (!conflictingIds.length) return true;
        collisions.push({ ...change, conflictingIds });
        return false;
    });

    safeChanges.sort((a, b) => a.roundNumber - b.roundNumber || a.conceptNumber - b.conceptNumber || a.file.name.localeCompare(b.file.name));
    const conceptCount = Array.from(sourceConceptsByRound.values()).reduce((total, concepts) => total + concepts.size, 0);
    const skipped = Array.from(skippedFiles.values()).map(({ file, locations }) => ({ file, locations: Array.from(locations).sort() }));
    return { changes: safeChanges, alreadyCorrect, unmatched, ambiguous, collisions, skipped, scanned: discoveredFiles.size + skipped.length, rounds: roundFolders.length, concepts: conceptCount };
};

export const showRenameFilesPopup = async () => {
    const header = document.getElementById("confluenceModalHeader");
    const body = document.getElementById("confluenceModalBody");
    if (!header || !body) return;

    header.innerHTML = `
        <h5 class="modal-title">Add Concept IDs to Filenames</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    `;
    body.innerHTML = '<p><i class="fas fa-spinner fa-spin me-2"></i>Scanning submitter, DACC, returned, completed, and chair folders...</p><p class="small text-muted">No files are changed during this scan.</p>';
    bootstrap.Modal.getOrCreateInstance(document.getElementById("confluenceMainModal")).show();

    try {
        const plan = await buildRoundRenamePlan();
        const issueCount = plan.unmatched.length + plan.ambiguous.length + plan.collisions.length;
        const previewLimit = 300;
        const previewRows = plan.changes.slice(0, previewLimit).map(change => `
            <tr><td>${escapeHtml(change.file.name)}</td><td>${escapeHtml(change.newFileName)}</td><td>R${change.roundNumber}_${String(change.conceptNumber).padStart(2, "0")}</td><td>${escapeHtml(change.locations.join(", ") || change.file.parent?.name || "Unknown")}</td></tr>
        `).join("");
        const issueItems = [
            ...plan.ambiguous.map(item => `${item.file.name} - ${item.reason}`),
            ...plan.unmatched.map(item => `${item.file.name} - ${item.reason}`),
            ...plan.collisions.map(item => `${item.file.name} - target ${item.newFileName} already exists in the same folder`)
        ];
        const issueSummary = issueCount ? `
            <div class="alert alert-warning small">
                <strong>${issueCount} file${issueCount === 1 ? "" : "s"} require manual review and will not be renamed:</strong>
                ${plan.ambiguous.length} ambiguous round match(es), ${plan.unmatched.length} unmatched file(s), and ${plan.collisions.length} filename collision(s).
                <details class="mt-2"><summary>Show files requiring review</summary><ul class="mb-0 mt-2">${issueItems.slice(0, 100).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>${issueItems.length > 100 ? `<p class="mb-0">Showing the first 100 of ${issueItems.length}.</p>` : ""}</details>
            </div>` : "";
        const skippedSummary = plan.skipped.length ? `
            <div class="alert alert-secondary small">
                <strong>${plan.skipped.length}</strong> legacy <code>Concept #</code> file${plan.skipped.length === 1 ? " was" : "s were"} skipped and will not be assigned a new concept ID.
                <details class="mt-2"><summary>Show skipped files</summary><ul class="mb-0 mt-2">${plan.skipped.slice(0, 100).map(item => `<li>${escapeHtml(item.file.name)}${item.locations.length ? ` — ${escapeHtml(item.locations.join(", "))}` : ""}</li>`).join("")}</ul>${plan.skipped.length > 100 ? `<p class="mb-0">Showing the first 100 of ${plan.skipped.length}.</p>` : ""}</details>
            </div>` : "";

        body.innerHTML = `
            <div class="alert alert-info small">Concept IDs are assigned per submitter round in creation order, starting at <code>R#_01</code>. Copies with the same concept filename or source Concept ID receive the same suffix. Existing round and numbered endings will be corrected, not duplicated.</div>
            <p><strong>${plan.scanned}</strong> concept documents scanned across <strong>${plan.rounds}</strong> submitter rounds and <strong>${plan.concepts}</strong> authoritative concepts.</p>
            <p><strong>${plan.changes.length}</strong> rename(s) ready; <strong>${plan.alreadyCorrect.length}</strong> already correct.</p>
            ${skippedSummary}
            ${issueSummary}
            <div class="table-responsive" style="max-height: 360px; overflow-y: auto;">
                <table class="table table-sm"><thead><tr><th>Current</th><th>New</th><th>Concept ID</th><th>Location</th></tr></thead><tbody>${previewRows}</tbody></table>
            </div>
            ${plan.changes.length > previewLimit ? `<p class="small text-muted">Showing the first ${previewLimit} of ${plan.changes.length} changes.</p>` : ""}
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="confirmRoundRename" ${plan.changes.length ? "" : "disabled"}>Rename ${plan.changes.length} File${plan.changes.length === 1 ? "" : "s"}</button>
            </div>`;

        const confirmButton = document.getElementById("confirmRoundRename");
        if (confirmButton) confirmButton.addEventListener("click", () => renameFilesWithRound(plan));
    } catch (error) {
        console.error("Unable to prepare the round filename plan:", error);
        body.innerHTML = `<div class="alert alert-danger">${escapeHtml(error.message || error)}</div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button></div>`;
    }
};

export const renameFilesWithRound = async (plan) => {
    const header = document.getElementById("confluenceModalHeader");
    const body = document.getElementById("confluenceModalBody");
    if (!header || !body) return;

    header.innerHTML = `<h5 class="modal-title">Applying Concept IDs...</h5>`;
    body.innerHTML = `<div id="renameProgress" style="max-height: 400px; overflow-y: auto;"><p>Starting ${plan.changes.length} file rename(s)...</p></div>`;
    bootstrap.Modal.getOrCreateInstance(document.getElementById("confluenceMainModal")).show();

    const progressDiv = document.getElementById("renameProgress");
    let renamedCount = 0;
    const failures = [];

    for (const change of plan.changes) {
        try {
            await updateBoxFile(change.file.id, { name: change.newFileName });
            renamedCount += 1;
            progressDiv.insertAdjacentHTML("beforeend", `<p class="text-success mb-1">${escapeHtml(change.file.name)} &rarr; ${escapeHtml(change.newFileName)}</p>`);
        } catch (error) {
            failures.push({ change, error });
            progressDiv.insertAdjacentHTML("beforeend", `<p class="text-danger mb-1">Failed: ${escapeHtml(change.file.name)} - ${escapeHtml(error.message || error)}</p>`);
        }
        progressDiv.scrollTop = progressDiv.scrollHeight;
    }

    progressDiv.insertAdjacentHTML("beforeend", `<p class="fw-bold mt-3">Finished: ${renamedCount} renamed; ${failures.length} failed; ${plan.alreadyCorrect.length} were already correct; ${plan.unmatched.length + plan.ambiguous.length + plan.collisions.length} require manual review.</p>`);
    progressDiv.insertAdjacentHTML("beforeend", '<div class="modal-footer"><button type="button" class="btn btn-primary" data-bs-dismiss="modal" id="refreshAfterRename">Close & Refresh</button></div>');
    const refreshButton = document.getElementById("refreshAfterRename");
    if (refreshButton) refreshButton.addEventListener("click", refreshAdminTable);
};
