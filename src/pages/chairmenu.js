import { showPreview } from "../components/boxPreview.js";
import { switchTabs, switchFiles, sortTableByColumn, addEventUpdateScore } from "../event.js";
import { showCommentsSub, showCommentsSub2, showAnimation, readDocFile, extractContactInvestigators, extractRequestedConsortia, getCollaboration, getFolderItems, getAllFilesRecursive, chairsInfo, messagesForChair, getTaskList, createCompleteTask, assignTask, updateTaskAssignment, createComment, getFileInfo, getFolderInfo, moveFile, addNewCollaborator, copyFile, acceptedFolder, deniedFolder, submitterFolder, getChairApprovalDate, showCommentsDropDown, archivedFolder, deleteTask, showCommentsDCEG, hideAnimation, getFileURL, returnToSubmitterFolder, createFolder, completedFolder, listComments, getFile, addMetaData, DACCmembers, csv2Json, Confluence_Data_Platform_Metadata_Shared_with_Investigators, Confluence_Data_Platform_Events_Page_Shared_with_Investigators, showComments, showCommentsWithResponses, getFileVersions, downloadFile, refreshToken } from "../shared.js";

export function renderFilePreviewDropdown(files, tab, hideDownloadAll = false) {
    let template = "";
    const showReplyStatus = tab === "conceptNeedingClarification";
    
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
                  <b>Select Concept Form:</b>${showReplyStatus ? " 🔵 = Replied" : ""}
              </label>
              <br>
              <select class="form-select" aria-label="Select Document to Review" id='${tab}selectedDoc'>`;
      for (const file of files) {
        const fileId = file.id;
        let filename = file.name;
        let lastUnderscoreIndex = filename.lastIndexOf('_');
        let titlename = lastUnderscoreIndex > 0 ? filename.substring(0, lastUnderscoreIndex) : filename; 
        
        const replyStatus = showReplyStatus && file.isReplyCompleted ? "🔵 " : "";
        template += `
            <option value='${fileId}'>
            ${replyStatus}${titlename}</option>`;
      }
      template += `
              </select>
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
    const lastUnderscoreIndex = filename.lastIndexOf('_');
    return lastUnderscoreIndex > 0 ? filename.substring(0, lastUnderscoreIndex) : filename;
};

const getMergedConceptDownloadName = (file) => {
    const filename = getDownloadFileTitle(file).replace(/\.[^/.]+$/, "");
    const safeName = filename.replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "") || file.id;
    return `${safeName}_with_comments.doc`;
};

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
        const header = document.getElementById("confluenceModalHeader");
        const body = document.getElementById("confluenceModalBody");
        if (!header || !body) return;

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
                    <button type="submit" class="btn btn-primary">Download Concept and Comments</button>
                </div>
                <div id="${tab}DownloadSelectionStatus" class="text-muted small mt-2"></div>
            </form>
        `;

        $("#confluenceMainModal").modal("show");

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

            const submitButton = event.target.querySelector("button[type='submit']");
            const status = document.getElementById(`${tab}DownloadSelectionStatus`);
            submitButton.disabled = true;
            submitButton.textContent = "Preparing...";
            showAnimation();

            try {
                for (let index = 0; index < selectedFiles.length; index++) {
                    const file = selectedFiles[index];
                    if (status) status.textContent = `Preparing ${index + 1} of ${selectedFiles.length}: ${getDownloadFileTitle(file)}`;
                    const mergedBlob = await generateMergedConceptBlob(file.id, getChairCommentSourceId(file, file.id));
                    if (!mergedBlob) throw new Error(`Unable to prepare ${file.name || file.id}.`);
                    downloadBlob(mergedBlob, getMergedConceptDownloadName(file));
                }
                $("#confluenceMainModal").modal("hide");
            } catch (error) {
                console.error("Error downloading selected files:", error);
                alert("Unable to download selected files. Please try again.");
            } finally {
                hideAnimation();
                submitButton.disabled = false;
                submitButton.textContent = "Download Concept and Comments";
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
let chairMenuCache = null;

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

const normalizeBoxFileName = (fileName) => String(fileName || "").trim();

const findMatchingFileByName = (files, fileName) => {
    const normalizedFileName = normalizeBoxFileName(fileName);
    if (!normalizedFileName || !Array.isArray(files)) return null;
    return files.find(file => file && normalizeBoxFileName(file.name) === normalizedFileName) || null;
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

const parseRequestedConsortiaValues = (text) => {
    const section = extractRequestedConsortia(text || "");
    if (!section) return [];

    const normalized = section.replace(/\s+/g, " ").trim();
    if (!normalized) return [];

    return CONSORTIUM_EXPORT_VALUES.filter(consortium => new RegExp(`\\b${escapeRegExp(consortium)}\\b`, "i").test(normalized));
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

const getProcessedAdminFiles = async (files, type, allSubFiles = []) => {
    const results = [];
    const CHUNK_SIZE = 10;
    
    for (let i = 0; i < files.length; i += CHUNK_SIZE) {
        const chunk = files.slice(i, i + CHUNK_SIZE);
        const chunkResults = await Promise.all(chunk.map(async (file) => {
            const fileId = file.id;
            const promises = {
                fileInfo: getFileInfo(fileId),
                completion_date: getChairApprovalDate(fileId),
                docContent: readDocFile(fileId)
            };
            if (type === 'res') promises.comments = listComments(fileId);
            
            const keys = Object.keys(promises);
            const promiseResults = await Promise.all(Object.values(promises));
            const resolvedResults = {};
            keys.forEach((key, i) => resolvedResults[key] = promiseResults[i]);
            
            const { fileInfo, completion_date, docContent, comments } = resolvedResults;
            
            const contacts = docContent ? extractContactInvestigators(docContent) : "";
            const requestedConsortia = docContent ? parseRequestedConsortiaValues(docContent) : [];
            const filename = fileInfo.name;
            const lastUnderscoreIndex = filename.lastIndexOf('_');
            
            let titlename;
            if (type !== 'com') {
                titlename = lastUnderscoreIndex > 0 ? filename.substring(0, lastUnderscoreIndex) : filename;
            } else {
                titlename = lastUnderscoreIndex > 0 ? filename.substring(0, lastUnderscoreIndex) : filename.slice(0,-5);
            }
            const shorttitlename = titlename.length > 40 ? titlename.substring(0, 39) + "..." : titlename;
            
            let submissionDate = fileInfo.created_at;
            let returnedDate = null;
            let isReplyCompleted = false;
            let commentsFileId = fileId;
            let responseFileId = null;

            if (type === 'res') {
                returnedDate = fileInfo.created_at;
                const originalFile = findMatchingFileByName(allSubFiles, filename);
                if (originalFile) {
                    submissionDate = originalFile.created_at;
                    commentsFileId = originalFile.id;
                }
                responseFileId = fileId;

                if (comments) {
                    const commentEntries = JSON.parse(comments).entries;
                    const responseComments = commentEntries.filter(c => c.message.startsWith('Response ID:'));
                    isReplyCompleted = areChairCommentsRepliedTo(commentEntries, responseComments);
                }
            }

            let roundId = fileInfo.parent ? fileInfo.parent.id : null;
            if (type === 'res' || type === 'com') {
                const originalFile = findMatchingFileByName(allSubFiles, filename);
                if (originalFile && originalFile.parent) {
                    roundId = originalFile.parent.id;
                }
            }

            return { 
                fileInfo, fileId, contacts, filename, titlename, shorttitlename, completion_date, 
                submissionDate, returnedDate, isReplyCompleted,
                parentId: fileInfo.parent.id,
                roundId: roundId,
                commentsFileId,
                responseFileId,
                requestedConsortia,
                name: fileInfo.name,
                type: type
            };
        }));
        results.push(...chunkResults);
    }
    return results;
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
            const totalToSync = filesClaraIncompleted.length;
            if (totalToSync > 0) {
                await Promise.all(filesClaraIncompleted.map(async (claraFile) => {
                    try {
                        if (!claraFile || !claraFile.name) return;
                        const matchingFile = findMatchingFileByName(responseFiles, claraFile.name);
                        if (matchingFile) {
                            claraFile.responseFileId = matchingFile.id;
                            const commentsFileId = getChairCommentSourceId(claraFile, claraFile.id);
                            const [commentsResponse, masterCommentsResponse] = await Promise.all([
                                listComments(matchingFile.id),
                                commentsFileId && String(commentsFileId) !== String(matchingFile.id) ? listComments(commentsFileId) : Promise.resolve(null)
                            ]);
                            if (commentsResponse) {
                                const comments = JSON.parse(commentsResponse).entries;
                                if (comments && Array.isArray(comments)) {
                                    claraFile.responseComments = comments.filter(c => c && c.message && c.message.startsWith('Response ID:'));
                                    const masterComments = masterCommentsResponse ? JSON.parse(masterCommentsResponse).entries : null;
                                    const chairSourceComments = Array.isArray(masterComments) ? masterComments : comments;
                                    claraFile.isReplyCompleted = areChairCommentsRepliedTo(chairSourceComments, claraFile.responseComments, consortium);
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Error parsing comments for file:", claraFile.name, e);
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

        const filteredIncompleted = selectedRoundId === 'all' ? filesIncompleted : filesIncompleted.filter(f => f && f.roundId === selectedRoundId);
        const filteredClara = selectedRoundId === 'all' ? filesClaraIncompleted : filesClaraIncompleted.filter(f => f && f.roundId === selectedRoundId);
        const filteredComplete = selectedRoundId === 'all' ? filesComplete : filesComplete.filter(f => f && f.roundId === selectedRoundId);
        const filteredAllFiles = selectedRoundId === 'all' ? filearrayAllFiles : filearrayAllFiles.filter(f => f && f.roundId === selectedRoundId);

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

const generateMergedConceptBlob = async (fileId, commentsFileId = fileId) => {
    try {
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
        
        let mergedContent = `<html><head><meta charset="utf-8"><title>Document with Comments</title><style>body { font-family: 'Times New Roman', serif; font-size: 12pt; } h1 { font-size: 14pt; } h2 { font-size: 13pt; } h3 { font-size: 12pt; } p, div { font-size: 12pt; }</style></head><body><div style="border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px;"><h1>Original Document</h1><div style="line-height: 1.6;">${originalContent}</div></div><div><h1>DACC Comments and Ratings</h1><p><strong>File ID:</strong> ${commentsFileId}</p>`;
        if (comments.length === 0) { mergedContent += `<p>No comments found.</p>`; } else {
            comments.forEach((comment, index) => {
                mergedContent += `<div style="margin-bottom: 30px; border: 1px solid #ccc; padding: 15px; page-break-inside: avoid;"><h3>Comment ${index + 1}:</h3><div style="background-color: #f5f5f5; padding: 10px; margin: 10px 0;">${comment.message}</div><p><strong>Response (if applicable):</strong></p><div style="border: 1px solid #ddd; min-height: 50px; padding: 10px; background-color: white;"></div></div>`;
            });
        }
        mergedContent += `</div></body></html>`;
        return new Blob([mergedContent], { type: 'application/msword' });
    } catch (error) { console.error('Error generating merged blob:', error); return null; }
};

export function viewFinalDecisionFilesColumns() {
    return `
        <div class="container-fluid m-0 pt-2 pb-2 align-left div-sticky" style="border-bottom: 1px solid rgb(0,0,0, 0.1); font-size: .8em">
            <div class="row-24 align-items-center position-relative">
                <div class="col-24-5 text-left font-bold ws-nowrap text-wrap header-sortable responsive-text">Concept Name <button class="transparent-btn sort-column" data-column-name="Concept Name"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-4 text-left font-bold ws-nowrap text-wrap header-sortable responsive-text">Sub Date <button class="transparent-btn sort-column" data-column-name="Submission Date"><i class="fas fa-sort"></i></button></div>
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
                <div class="col-24-4 text-left font-bold ws-nowrap text-wrap header-sortable responsive-text">Concept Name <button class="transparent-btn sort-column" data-column-name="Concept Name"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-2 text-left font-bold ws-nowrap text-wrap header-sortable responsive-text">Sub Date <button class="transparent-btn sort-column" data-column-name="Submission Date"><i class="fas fa-sort"></i></button></div>
                <div class="col-24-2 text-left font-bold ws-nowrap text-wrap header-sortable responsive-text">Ret Date <button class="transparent-btn sort-column" data-column-name="Return Date"><i class="fas fa-sort"></i></button></div>
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

export function viewFinalDecisionFilesTemplate(files) {
    if (!files || files.length === 0) {
        const daccDecisionElement = document.getElementById("daccDecision");
        if (daccDecisionElement) daccDecisionElement.innerHTML = "No files to show.";
        return;
    }

    let template = `<div id='decidedFiles'><div class='row'><div class="col-xl-12 filter-column" id="summaryFilterSiderBar"><div class="div-border white-bg align-left p-2"><div class="main-summary-row"><div class="col-xl-12 pl-1 pr-0"><span class="font-size-10"><h6 class="badge badge-pill badge-1">1</h6>: Approved as submitted <h6 class="badge badge-pill badge-2">2</h6>: Approved, pending conditions <h6 class="badge badge-pill badge-3">3</h6>: Approved, but data release delayed <h6 class="badge badge-pill badge-4">4</h6>: Not Approved <h6 class="badge badge-pill badge-5">5</h6>: Decision requires clarification <h6 class="badge badge-pill badge-777">777</h6>: Duplicate <h6 class="badge badge-pill badge-NA">NA</h6>: Not Applicable</span></div></div></div></div></div><div class='col-xl-12 pr-0'>`;
    template += viewFinalDecisionFilesColumns();
    template += '<div id="files"> </div></div></div>';
    const daccDecisionElement = document.getElementById("daccDecision");
    if (daccDecisionElement) daccDecisionElement.innerHTML = template; else return;
    viewFinalDecisionFiles(files);
    let btns = Array.from(document.querySelectorAll("#daccDecision .preview-file"));
    btns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            btn.dataset.target = "#confluencePreviewerModal";
            const header = document.getElementById("confluencePreviewerModalHeader");
            header.innerHTML = `<h5 class="modal-title">File preview</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`;
            const fileId = btn.dataset.fileId;
            $("#confluencePreviewerModal").modal("show");
            showPreview(fileId, "confluencePreviewerModalBody");
        });
    });
    const table = document.getElementById("decidedFiles");
    const headers = table.querySelector(`.div-sticky`);
    if (headers) {
        Array.from(headers.children).forEach((header, index) => {
            header.addEventListener("click", (e) => {
                const sortDirection = header.classList.contains("header-sort-asc");
                sortTableByColumn(table, index, !sortDirection);
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
  } catch (e) {
    investigatorsDiv.innerHTML = '<span class="text-danger">Error loading details</span>';
  }
};

export function viewFinalDecisionFiles(files) {
  let template = `<div class="row m-0 align-left allow-overflow w-100"><div class="accordion accordion-flush col-md-12 px-0" id="daccAccordian">`;
  for (const fileInfo of files) {
    const fileId = fileInfo.id;
    const filename = fileInfo.name;
    const lastUnderscoreIndex = filename.lastIndexOf('_');
    const titlename = lastUnderscoreIndex > 0 ? filename.substring(0, lastUnderscoreIndex) : filename;
    const shorttitlename = titlename.length > 40 ? titlename.substring(0, 39) + "..." : titlename;
    template += `<div class="accordian-item mb-2 border-bottom pb-2"><div class="row-24 align-items-center position-relative"><div class="col-24-5 text-left"><span class="responsive-text" title="${titlename}">${shorttitlename}</span></div><div class="col-24-4 text-left"><span class="responsive-text">${new Date(fileInfo.created_at).toDateString().substring(4)}</span></div><div class="col-24-2 text-left">${fileInfo.parent && fileInfo.parent.id == completedFolder ? '<h6 class="badge badge-pill bg-success">Accepted</h6>' : fileInfo.parent && fileInfo.parent.id == deniedFolder ? '<h6 class="badge badge-pill bg-danger">Denied</h6>' : '<h6 class="badge badge-pill bg-warning">Ongoing</h6>'}</div><div class="col-24-2 text-center" id="AABCG${fileId}" data-value="AABCG"><select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="AABCG Decision"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="BCAC${fileId}" data-value="BCAC"><select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="BCAC Decision"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="C-NCI${fileId}" data-value="C-NCI"><select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="C-NCI Decision"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="CIMBA${fileId}" data-value="CIMBA"><select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="CIMBA Decision"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="LAGENO${fileId}" data-value="LAGENO"><select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="LAGENO Decision"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="MERGE${fileId}" data-value="MERGE"><select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="MERGE Decision"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-1 text-right"><button class="accordion-toggle-btn" type="button" data-bs-toggle="collapse" data-bs-target="#file${fileId}" aria-expanded="false" aria-controls="file${fileId}" data-file-id="${fileId}"><i class="fas fa-chevron-down"></i></button></div></div><div id="file${fileId}" class="accordion-collapse collapse" aria-labelledby="flush-heading${fileId}"><div class="accordion-body"><div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Concept</div><div class="col">${filename} <button class="btn btn-lg custom-btn preview-file preview-file-inline" title='Preview File' data-file-id="${fileId}" aria-label="Preview File"><i class="fas fa-external-link-alt" style="font-size: 0.8em;"></i></button></div></div><div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Investigator(s)</div><div class="col" id="investigators${fileId}"><span class="text-muted italic">Click accordion to load...</span></div></div><div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Comments</div><div class="col" id='file${fileId}Comments'></div></div></div></div></div>`;
  }
  template += `</div></div>`;
  const filesContainer = document.getElementById("files");
  if (filesContainer) {
    filesContainer.innerHTML = template;
    document.querySelectorAll('#daccDecision .accordion-toggle-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const fileId = this.dataset.fileId;
        const isExpanding = this.getAttribute('aria-expanded') === 'false';
        const icon = this.querySelector('i');
        if (isExpanding) {
          icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
          this.setAttribute('aria-expanded', 'true');
          const investigatorsDiv = document.getElementById(`investigators${fileId}`);
          if (investigatorsDiv && investigatorsDiv.innerHTML.includes('Click accordion to load')) {
              await loadDaccDecisionInvestigators(fileId);
              showCommentsDCEG(fileId, false);
          }
        } else {
          icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
          this.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }
}

export const createAllRoundFolders = async () => {
    const header = document.getElementById("confluenceModalHeader");
    const body = document.getElementById("confluenceModalBody");
    header.innerHTML = `<h5 class="modal-title">Initializing 10-Year Round Folders</h5>`;
    body.innerHTML = '<div id="initRoundsProgress" style="max-height: 400px; overflow-y: auto;"><p>Loading schedule...</p></div>';
    $("#confluenceMainModal").modal("show");
    const progressDiv = document.getElementById('initRoundsProgress');
    const addStatus = (msg, color = 'black') => {
        progressDiv.innerHTML += `<p style="color: ${color}">${msg}</p>`;
        progressDiv.scrollTop = progressDiv.scrollHeight;
    };
    try {
        const response = await fetch('./src/data/roundSchedule.json');
        const schedule = await response.json();
        const baseLocations = [ { id: submitterFolder, name: 'Main Submitter Folder' } ];
        chairsInfo.forEach(chair => {
            baseLocations.push({ id: chair.boxIdNew, name: `${chair.consortium} - New` });
            baseLocations.push({ id: chair.boxIdClara, name: `${chair.consortium} - Clarification` });
            baseLocations.push({ id: chair.boxIdComplete, name: `${chair.consortium} - Complete` });
        });
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        for (const round of schedule) {
            addStatus(`--- Processing ${round.folderName} ---`, 'blue');
            for (const loc of baseLocations) {
                if (!loc.id) continue;
                const items = await getFolderItems(loc.id);
                const existing = items.entries.find(f => f.name === round.folderName && f.type === 'folder');
                if (!existing) {
                    addStatus(`Creating in ${loc.name}...`);
                    await createFolder(loc.id, round.folderName);
                    await delay(200);
                }
            }
        }
        addStatus('<strong>All folders initialized successfully!</strong>', 'green');
        progressDiv.innerHTML += '<div class="modal-footer"><button type="button" class="btn btn-primary" data-bs-dismiss="modal">Close</button></div>';
    } catch (e) { addStatus(`Error: ${e.message}`, 'red'); }
};

export const authTableTemplate = () => {
    const userEmail = JSON.parse(localStorage.parms).login;
    const userForAuth = emailsAllowedToUpdateData.includes(userEmail);
    if (!userForAuth) return;
    let template = `<div class="general-bg padding-bottom-1rem"><div class="container body-min-height"><div class="main-summary-row" style="display: flex; justify-content: space-between; align-items: center;"><div class="align-left"><h1 class="page-header">Admin Table View</h1></div><div id="roundSelectionContainer" style="margin-left: 20px;"></div><div class="align-right"><button type="submit" id="submitID" class="buttonsubmit button-glow-red" onclick="this.classList.toggle('buttonsubmit--loading')"> <span class="buttonsubmit__text"> Update Users </span></button><button type="button" id="initRoundsBtn" class="buttonsubmit button-glow-red" style="margin-left: 10px;"> <span class="buttonsubmit__text"> Init Rounds </span></button><button type="button" id="renameFilesBtn" class="buttonsubmit button-glow-red" style="margin-left: 10px;"> <span class="buttonsubmit__text"> Rename Files </span></button></div></div><div class="data-submission div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem;"><div class="tab-content" id="selectedTab"><div class="tab-pane fade show active" id="daccDecision" role="tabpanel" aria-labeledby="daccDecisionTab"><div id="authTableView" class="align-left"></div><button type="submit" class="buttonsubmit button-glow-red" id="returnSubmitter" onclick="this.classList.toggle('buttonsubmit--loading')"><span class="buttonsubmit__text"> Return to Submitter </span></button><button type="submit" class="buttonsubmit button-glow-red" id="returnChairs" onclick="this.classList.toggle('buttonsubmit--loading')"><span class="buttonsubmit__text"> Return to Chairs </span></button><a href="mailto:mkh39@medschl.cam.ac.uk; xjahuang@ucdavis.edu; vzavala@ucdavis.edu; r.santos@qub.ac.uk; guochong.jia@vumc.org; thomas.ahearn@nih.gov?subject=Confluence Data Coordinating Centers" id='email' class='btn btn-dark'>Send Email to DACC</a></div></div></div></div></div>`;
    return template;
};

export const getRequiringInputFiles = async (returnToSubmitterFolderId) => {
    const requiringInputFiles = [];
    const userFolders = await getFolderItems(returnToSubmitterFolderId);
    for (const userFolder of userFolders.entries) {
        if (userFolder.type === 'folder') {
            const subfolders = await getFolderItems(userFolder.id);
            for (const subfolder of subfolders.entries) {
                if (subfolder.name === 'Requiring Input' && subfolder.type === 'folder') {
                    const files = await getAllFilesRecursive(subfolder.id, "name,type,id,parent,created_at");
                    requiringInputFiles.push(...files);
                }
            }
        }
    }
    return requiringInputFiles;
};

const loadAdminDataCache = async () => {
    if (adminDataCache) return adminDataCache;

    const [allFilesSub, allFilesCom, allFilesRes] = await Promise.all([
        getAllFilesRecursive(submitterFolder, "name,type,id,parent,created_at"),
        getAllFilesRecursive(completedFolder, "name,type,id,parent,created_at"),
        getRequiringInputFiles(returnToSubmitterFolder)
    ]);
    const [processedSub, processedCom, processedRes] = await Promise.all([
        getProcessedAdminFiles(allFilesSub, 'sub'),
        getProcessedAdminFiles(allFilesCom, 'com', allFilesSub),
        getProcessedAdminFiles(allFilesRes, 'res', allFilesSub)
    ]);
    adminDataCache = { sub: processedSub, com: processedCom, res: processedRes };
    return adminDataCache;
};

export const exportAdminConsortiaCsv = async () => {
    const data = await loadAdminDataCache();
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

    await loadAdminDataCache();

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
        addRenameFilesEvent(filteredSub.map(f => f.fileInfo));
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

export async function viewAuthFinalDecisionFilesTemplate(processedSub, processedCom, processedRes) {
    let template = "";
    const resFileNames = processedRes.map(file => file.name);
    const filteredSub = processedSub.filter(file => !resFileNames.includes(file.name));
    if (filteredSub.length > 0 || processedCom.length > 0 || processedRes.length > 0) {
        template += `<div id='decidedFiles'><div class='row'><div class="col-xl-12 filter-column" id="summaryFilterSiderBar"><div class="div-border white-bg align-left p-2"><div class="main-summary-row"><div class="col-xl-12 pl-1 pr-0"><span class="font-size-10"><h6 class="badge badge-pill badge-1">1</h6>: Approved as submitted<h6 class="badge badge-pill badge-2">2</h6>: Approved, pending conditions <h6 class="badge badge-pill badge-3">3</h6>: Approved, but data release delayed <h6 class="badge badge-pill badge-4">4</h6>: Not Approved <h6 class="badge badge-pill badge-5">5</h6>: Decision requires clarification <h6 class="badge badge-pill badge-777">777</h6>: Duplicate<h6 class="badge badge-pill badge-NA">NA</h6>: Not Applicable</span></div></div></div></div></div><div class='col-xl-12 pr-0'>`;
        template += viewAuthFinalDecisionFilesColumns();
        template += '<div id="files"> </div></div></div>';
    } else { template += `No files to show.</div></div>`; }
    document.getElementById("authTableView").innerHTML = template;
    if (filteredSub.length !== 0 || processedCom.length !== 0 || processedRes.length !== 0) {
        viewAuthFinalDecisionFiles(filteredSub, processedCom, processedRes);
        const updateButtonStates = () => {
            const anyChecked = document.querySelectorAll('.pl:checked').length > 0;
            const rs = document.getElementById('returnSubmitter');
            const rc = document.getElementById('returnChairs');
            if (rs) { rs.disabled = !anyChecked; rs.style.opacity = anyChecked ? '1' : '0.5'; }
            if (rc) { rc.disabled = !anyChecked; rc.style.opacity = anyChecked ? '1' : '0.5'; }
        };
        updateButtonStates();
        document.querySelectorAll('.pl').forEach(checkbox => { checkbox.addEventListener('change', updateButtonStates); });
        for (const file of filteredSub) await showCommentsDCEG(file.fileId, true);
        for (const file of processedCom) await showCommentsDCEG(file.fileId, true);
        for (const file of processedRes) await showAuthCommentsWithResponses(file.fileId, file.commentsFileId, file.responseFileId, true);
        Array.from(document.querySelectorAll(".preview-file")).forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const header = document.getElementById("confluencePreviewerModalHeader");
                header.innerHTML = `<h5 class="modal-title">File preview</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`;
                $("#confluencePreviewerModal").modal("show");
                showPreview(btn.dataset.fileId, "confluencePreviewerModalBody");
            });
        });
        const table = document.getElementById("decidedFiles");
        const headers = table.querySelector(`.div-sticky`);
        Array.from(headers.children).forEach((header, index) => {
            header.addEventListener("click", (e) => {
                const sortDirection = header.classList.contains("header-sort-asc");
                sortTableByColumn(table, index, !sortDirection);
            });
        });
    }
};

export function viewAuthFinalDecisionFiles(processedSubFiles, processedComFiles, processedResFiles) {
  let template = `<div class="row m-0 align-left allow-overflow w-100"><div class="accordion accordion-flush col-md-12" id="adminAccordian">`;
  const renderRow = (fInfo, fId, name, titlename, stn, subD, retD, rId) => {
    return `<div class="accordian-item admin-table-row mb-2 border-bottom pb-2" data-round-id="${rId}"><div class="row-24 align-items-center position-relative"><div class="col-24-1 text-left"><input type="checkbox" class="pl admin-checkbox" id="${fId}" value="${fInfo.name}" aria-label="Select file"></div><div class="col-24-4 text-left"><span class="responsive-text" title="${titlename}">${stn}</span></div><div class="col-24-2 text-left"><span class="responsive-text">${new Date(subD).toDateString().substring(4)}</span></div><div class="col-24-2 text-left"><span class="responsive-text">${retD ? new Date(retD).toDateString().substring(4) : "--"}</span></div><div class="col-24-2 text-left">${fInfo.parent.id == completedFolder ? '<h6 class="badge badge-pill bg-success">Accepted</h6>' : fInfo.parent.id == deniedFolder ? '<h6 class="badge badge-pill bg-danger">Denied</h6>' : '<h6 class="badge badge-pill bg-warning">Ongoing</h6>'}</div><div class="col-24-2 text-center" id="AABCG${fId}" data-value="AABCG"><select class="form-select form-select-sm decision-dropdown"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="BCAC${fId}" data-value="BCAC"><select class="form-select form-select-sm decision-dropdown"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="C-NCI${fId}" data-value="C-NCI"><select class="form-select form-select-sm decision-dropdown"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="CIMBA${fId}" data-value="CIMBA"><select class="form-select form-select-sm decision-dropdown"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="LAGENO${fId}" data-value="LAGENO"><select class="form-select form-select-sm decision-dropdown"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="MERGE${fId}" data-value="MERGE"><select class="form-select form-select-sm decision-dropdown"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-1 text-right"><button class="accordion-toggle-btn" type="button" data-bs-toggle="collapse" data-bs-target="#file${fId}" aria-expanded="false" aria-controls="file${fId}"><i class="fas fa-chevron-down"></i></button></div></div><div id="file${fId}" class="accordion-collapse collapse"><div class="accordion-body"><div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Concept</div><div class="col">${name} <button class="btn btn-lg custom-btn preview-file" title='Preview File' data-file-id="${fId}"><i class="fas fa-external-link-alt" style="font-size: 0.8em;"></i></button></div></div><div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Comments</div><div class="col" id='file${fId}Comments'></div></div></div></div></div>`;
  };
  for (const f of processedSubFiles) template += renderRow(f.fileInfo, f.fileId, f.filename, f.titlename, f.shorttitlename, f.submissionDate, f.returnedDate, f.roundId);
  for (const f of processedComFiles) template += renderRow(f.fileInfo, f.fileId, f.filename, f.titlename, f.shorttitlename, f.submissionDate, f.returnedDate, f.roundId);
  for (const f of processedResFiles) template += renderRow(f.fileInfo, f.fileId, f.filename, f.titlename, f.shorttitlename, f.submissionDate, f.returnedDate, f.roundId);
  template += `</div></div>`;
  if (document.getElementById("files") != null) {
    document.getElementById("files").innerHTML = template;
    document.querySelectorAll('.decision-dropdown').forEach(dropdown => {
      dropdown.addEventListener('change', async function() {
        const val = this.value;
        const prev = this.getAttribute('data-previous-value') || '--';
        const p = this.closest('[data-value]');
        const cons = p.getAttribute('data-value');
        const fid = p.id.replace(cons, '');
        if (!confirm(`Are you sure you want to change the ${cons} score from ${prev} to ${val}?`)) { this.value = prev; return; }
        const header = document.getElementById('confluenceModalHeader');
        header.innerHTML = `<h5 class="modal-title">Changing Score for ${fid}</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`;
        document.getElementById('confluenceModalBody').innerHTML = '<form id="changeScore"><div class="form-group"><label for="scoreMessage">Comment</label><textarea class="form-control" id="scoreMessage" rows="3">Changed by admin</textarea></div><div class="modal-footer"><button type="submit" class="btn btn-outline-primary">Update score</button></div></form>';
        $("#confluenceMainModal").modal("show");
        addEventUpdateScore(fid, val, cons, () => { adminDataCache = null; generateAuthTableFiles(); });
        this.setAttribute('data-previous-value', val);
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
    for (const folderId of folderIds) {
        if (!folderId) continue;
        const files = asBoxEntries(await getAllFilesRecursive(folderId, "name,type,id,parent,parent.name,created_at"));
        const match = files.find(file => file && file.name === fileName);
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
        $("#confluenceMainModal").modal("show");

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

        $("#confluenceMainModal").modal("show");

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

                addStatus("Moving submitter file to completed folder...");
                await moveFile(checkbox.id, completedFolder);
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
                    $("#confluenceMainModal").modal("hide");
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

        $("#confluenceMainModal").modal("show");

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
            $("#confluenceMainModal").modal("show");
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

export const addRenameFilesEvent = (files) => {
    const renameBtn = document.getElementById("renameFilesBtn");
    if (renameBtn) renameBtn.onclick = () => showRenameFilesPopup(files);
};

export const showRenameFilesPopup = (files) => {
    const header = document.getElementById("confluenceModalHeader");
    const body = document.getElementById("confluenceModalBody");
    if (!header || !body) return;

    const sortedFiles = [...files].sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0));

    header.innerHTML = `
        <h5 class="modal-title">Rename Files with Round Number</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    `;

    let template = `
        <form id="renameFilesForm">
            <div class="form-group mb-3">
                <label for="roundNumber">Enter Round Number (X):</label>
                <input type="text" class="form-control" id="roundNumber" placeholder="e.g., 01" required>
            </div>
            <div class="form-group mb-3">
                <h6>Files to be renamed:</h6>
                <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 10px;">
    `;

    sortedFiles.forEach((file, index) => {
        template += `
            <div class="mb-2">
                <strong>Current:</strong> ${escapeHtml(file.name)}<br>
                <strong>New:</strong> <span id="preview${index}">${escapeHtml(buildRoundFileName(file.name, "X", index))}</span>
            </div>
            <hr>
        `;
    });

    template += `
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="submit" class="btn btn-primary">Confirm Rename</button>
            </div>
        </form>
    `;

    body.innerHTML = template;
    $("#confluenceMainModal").modal("show");

    document.getElementById("roundNumber").addEventListener("input", (e) => {
        const roundValue = e.target.value || "X";
        sortedFiles.forEach((file, index) => {
            const preview = document.getElementById(`preview${index}`);
            if (preview) preview.textContent = buildRoundFileName(file.name, roundValue, index);
        });
    });

    document.getElementById("renameFilesForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const roundNumber = document.getElementById("roundNumber").value;
        if (!roundNumber) {
            alert("Please enter a round number");
            return;
        }
        await renameFilesWithRound(sortedFiles, roundNumber);
    });
};

const buildRoundFileName = (fileName, roundNumber, index) => {
    const dotIndex = fileName.lastIndexOf(".");
    const currentTitle = dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
    const extension = dotIndex > 0 ? fileName.substring(dotIndex) : "";
    return `${currentTitle}_R${roundNumber}_${String(index + 1).padStart(3, "0")}${extension}`;
};

export const renameFilesWithRound = async (files, roundNumber) => {
    const header = document.getElementById("confluenceModalHeader");
    const body = document.getElementById("confluenceModalBody");
    if (!header || !body) return;

    header.innerHTML = `<h5 class="modal-title">Renaming Files...</h5>`;
    body.innerHTML = '<div id="renameProgress" style="max-height: 400px; overflow-y: auto;"><p>Starting file rename process...</p></div>';
    $("#confluenceMainModal").modal("show");

    const progressDiv = document.getElementById("renameProgress");

    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const newFileName = buildRoundFileName(file.name, roundNumber, i);

            progressDiv.innerHTML += `<p>Renaming: ${escapeHtml(file.name)} -> ${escapeHtml(newFileName)}</p>`;
            await updateBoxFile(file.id, { name: newFileName });
            progressDiv.innerHTML += `<p class="text-success">Renamed in submitter folder: ${escapeHtml(newFileName)}</p>`;

            for (const chair of chairsInfo) {
                const chairFile = await findFileByNameInFolders(file.name, [chair.boxIdNew, chair.boxIdClara, chair.boxIdComplete]);
                if (chairFile) {
                    await updateBoxFile(chairFile.id, { name: newFileName });
                    progressDiv.innerHTML += `<p class="text-primary">Renamed in ${escapeHtml(chair.consortium)} folder: ${escapeHtml(newFileName)}</p>`;
                }
            }
        }

        progressDiv.innerHTML += '<p><strong>All files renamed successfully.</strong></p>';
        progressDiv.innerHTML += '<div class="modal-footer"><button type="button" class="btn btn-primary" data-bs-dismiss="modal" id="refreshAfterRename">Close & Refresh</button></div>';
        const refreshButton = document.getElementById("refreshAfterRename");
        if (refreshButton) refreshButton.addEventListener("click", refreshAdminTable);
    } catch (error) {
        console.error("Error renaming files:", error);
        progressDiv.innerHTML += `<p class="text-danger">Error: ${escapeHtml(error.message)}</p>`;
        progressDiv.innerHTML += '<div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button></div>';
    }
};
