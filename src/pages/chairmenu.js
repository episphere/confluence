import { showPreview } from "../components/boxPreview.js";
import { switchTabs, switchFiles, sortTableByColumn, addEventUpdateScore } from "../event.js";
import { showCommentsSub, showCommentsSub2, showAnimation, readDocFile, extractContactInvestigators, getCollaboration, getFolderItems, getAllFilesRecursive, chairsInfo, messagesForChair, getTaskList, createCompleteTask, assignTask, updateTaskAssignment, createComment, getFileInfo, getFolderInfo, moveFile, addNewCollaborator, copyFile, acceptedFolder, deniedFolder, submitterFolder, getChairApprovalDate, showCommentsDropDown, archivedFolder, deleteTask, showCommentsDCEG, hideAnimation, getFileURL, emailsAllowedToUpdateData, returnToSubmitterFolder, createFolder, completedFolder, listComments, getFile, addMetaData, DACCmembers, csv2Json, boxUpdateFile, Confluence_Data_Platform_Metadata_Shared_with_Investigators, Confluence_Data_Platform_Events_Page_Shared_with_Investigators, showComments, showCommentsWithResponses, getFileVersions, downloadFile } from "../shared.js";

export function renderFilePreviewDropdown(files, tab, hideDownloadAll = false) {
    let template = "";
    
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
                  <b>Select Concept Form:</b> 🔵 = Replied
              </label>
              <br>
              <select class="form-select" aria-label="Select Document to Review" id='${tab}selectedDoc'>`;
      for (const file of files) {
        const fileId = file.id;
        let filename = file.name;
        let lastUnderscoreIndex = filename.lastIndexOf('_');
        let titlename = lastUnderscoreIndex > 0 ? filename.substring(0, lastUnderscoreIndex) : filename; 
        
        const replyStatus = file.isReplyCompleted ? "🔵 " : "";
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

const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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
                    const mergedBlob = await generateMergedConceptBlob(file.id);
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

const getProcessedAdminFiles = async (files, type, allSubFiles = []) => {
    const results = [];
    const CHUNK_SIZE = 10;
    
    for (let i = 0; i < files.length; i += CHUNK_SIZE) {
        const chunk = files.slice(i, i + CHUNK_SIZE);
        const chunkResults = await Promise.all(chunk.map(async (file) => {
            const fileId = file.id;
            const promises = {
                fileInfo: getFileInfo(fileId),
                completion_date: getChairApprovalDate(fileId)
            };
            if (type !== 'com') promises.docContent = readDocFile(fileId);
            if (type === 'res') promises.comments = listComments(fileId);
            
            const keys = Object.keys(promises);
            const promiseResults = await Promise.all(Object.values(promises));
            const resolvedResults = {};
            keys.forEach((key, i) => resolvedResults[key] = promiseResults[i]);
            
            const { fileInfo, completion_date, docContent, comments } = resolvedResults;
            
            const contacts = docContent ? extractContactInvestigators(docContent) : "";
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

            if (type === 'res') {
                returnedDate = fileInfo.created_at;
                const originalFile = allSubFiles.find(f => f.name === filename);
                if (originalFile) {
                    submissionDate = originalFile.created_at;
                }

                if (comments) {
                    const commentEntries = JSON.parse(comments).entries;
                    const chairComments = commentEntries.filter(c => {
                        const message = c.message;
                        const ratingMatch = message.match(/Rating:\s*(\w+)/i);
                        const rating = ratingMatch ? ratingMatch[1].trim() : null;
                        const isChair = chairsInfo.some(chair => chair.email === c.created_by.login) || message.startsWith('Consortium');
                        const requiresResponse = rating && rating !== '1' && rating.toUpperCase() !== 'NA';
                        return isChair && requiresResponse && !message.startsWith('Response ID:');
                    });
                    
                    const responseComments = commentEntries.filter(c => c.message.startsWith('Response ID:'));
                    
                    isReplyCompleted = chairComments.every(chairComment => {
                        const boxCommentIdMatch = chairComment.message.match(/Box Comment ID:\s*(\w+)/);
                        const effectiveId = boxCommentIdMatch ? boxCommentIdMatch[1] : chairComment.id;
                        return responseComments.some(resComment => resComment.message.includes(`Response ID: ${effectiveId}`));
                    });
                }
            }

            let roundId = fileInfo.parent ? fileInfo.parent.id : null;
            if (type === 'res' || type === 'com') {
                const originalFile = allSubFiles.find(f => f.name === filename);
                if (originalFile && originalFile.parent) {
                    roundId = originalFile.parent.id;
                }
            }

            return { 
                fileInfo, fileId, contacts, filename, titlename, shorttitlename, completion_date, 
                submissionDate, returnedDate, isReplyCompleted,
                parentId: fileInfo.parent.id,
                roundId: roundId,
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
            
            // Check if this file has response comments
            const file = files.find(f => f && f.id === file_id);
            if (file && file.responseComments) {
                console.log("Using showCommentsWithResponses for file:", file.name, file.responseComments); 
                showCommentsWithResponses(file_id, file.responseComments);
            } else if (tab === 'conceptNeedingClarification') {
                console.log("Using showCommentsSub for file:", file.name);
                showCommentsWithResponses(file_id, file_id.responseComments);
            } else {
                showComments(file_id);
            }
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
        const [filearrayChair, filearrayClara, filearrayComplete, testData] = await Promise.all([
            getAllFilesRecursive(userChairItem.boxIdNew, "name,type,id,parent,created_at"),
            getAllFilesRecursive(userChairItem.boxIdClara, "name,type,id,parent,created_at"),
            getAllFilesRecursive(userChairItem.boxIdComplete, "name,type,id,parent,created_at"),
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
            const match = filearrayAllFiles.find(f => f && f.name && f.name.trim() === fileName.trim());
            return match ? match.roundId : null;
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
        const claraTaskPromises = (filearrayClara && Array.isArray(filearrayClara)) ? filearrayClara.map(async (obj) => {
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
        
        const claraResults = await Promise.all(claraTaskPromises);
        claraResults.forEach(items => {
            if (items && Array.isArray(items)) {
                items.forEach(item => {
                    if (item && item.id && filesClaraIncompleted.findIndex(element => element && element.id === item.id) === -1) {
                        const submitterFile = (filearrayAllFiles && Array.isArray(filearrayAllFiles)) ? filearrayAllFiles.find(f => f && f.name === item.name) : null;
                        if (submitterFile) {
                            filesClaraIncompleted.push(submitterFile);
                        } else {
                            item.roundId = findRoundId(item.name);
                            filesClaraIncompleted.push(item);
                        }
                    }
                });
            }
        });

        const filesComplete = [];
        updateProgressBar(75, `Analyzing ${filearrayComplete.length} archived concepts...`);
        if (filearrayComplete && Array.isArray(filearrayComplete)) {
            filearrayComplete.forEach(item => {
                if (item && item.id && filesComplete.findIndex(element => element && element.id === item.id) === -1) {
                    item.roundId = findRoundId(item.name);
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

        updateProgressBar(90, "Syncing individual response histories...");
        if (responseFiles.length > 0) {
            let syncCount = 0;
            const totalToSync = filesClaraIncompleted.length;
            if (totalToSync > 0) {
                await Promise.all(filesClaraIncompleted.map(async (claraFile) => {
                    try {
                        if (!claraFile || !claraFile.name) return;
                        const matchingFile = responseFiles.find(f => f && f.name === claraFile.name);
                        if (matchingFile) {
                            const commentsResponse = await listComments(matchingFile.id);
                            if (commentsResponse) {
                                const comments = JSON.parse(commentsResponse).entries;
                                if (comments && Array.isArray(comments)) {
                                    claraFile.responseComments = comments.filter(c => c && c.message && c.message.startsWith('Response ID:'));
                                    const chairComments = comments.filter(c => {
                                        if (!c || !c.message) return false;
                                        const message = c.message;
                                        const ratingMatch = message.match(/Rating:\s*(\w+)/i);
                                        const rating = ratingMatch ? ratingMatch[1].trim() : null;
                                        const isChair = (c.created_by && chairsInfo.some(chair => chair && chair.email === c.created_by.login)) || message.startsWith('Consortium');
                                        const requiresResponse = rating && rating !== '1' && rating.toUpperCase() !== 'NA';
                                        return isChair && requiresResponse && !message.startsWith('Response ID:');
                                    });
                                    claraFile.isReplyCompleted = chairComments.every(chairComment => {
                                        if (!chairComment || !chairComment.message) return false;
                                        const boxCommentIdMatch = chairComment.message.match(/Box Comment ID:\s*(\w+)/);
                                        const effectiveId = boxCommentIdMatch ? boxCommentIdMatch[1] : chairComment.id;
                                        return claraFile.responseComments && claraFile.responseComments.some(resComment => resComment && resComment.message && resComment.message.includes(`Response ID: ${effectiveId}`));
                                    });
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
            daccEmails,
            consortium,
            roundFolders,
            message: messagesForChair[userChairItem.id]
        };
    }

    const renderSelectedRound = async (selectedRoundId) => {
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
                await renderSelectedRound(e.target.value);
            });
        }

        const daccTab = document.getElementById('daccDecisionTab');
        if (daccTab) {
            daccTab.addEventListener('click', async () => {
                const daccPane = document.getElementById('daccDecision');
                if (daccPane && daccPane.innerHTML.includes('Loading...')) {
                    await viewFinalDecisionFilesTemplate(filteredAllFiles);
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
            showCommentsInPane(filteredIncompleted[0].id);
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
            if (filteredClara[0].responseComments) {
                showCommentsWithResponses(filteredClara[0].id, filteredClara[0].responseComments);
            } else {
                showCommentsSub(filteredClara[0].id);
            }
            switchFilesWithComments("conceptNeedingClarification", filteredClara);
            document.getElementById("conceptNeedingClarificationTab").click();
        } else if (!!filteredComplete.length) {
            showPreviewInPane(filteredComplete[0].id);
            showCommentsInPane(filteredComplete[0].id);
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

        document.getElementById("recommendationTab").click();
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
        let allFiles = (chairMenuCache && chairMenuCache.filearrayAllFiles) ? chairMenuCache.filearrayAllFiles : await getAllFilesRecursive(submitterFolder, "name,id,parent,parent.name,created_at");
        const allFileMatch = allFiles.find(element => element && element.name && element.name.trim() === filename);

        await createComment(fileId, message);
        let roundNameForMove = null;
        if (allFileMatch && allFileMatch.id) {
            await createComment(allFileMatch.id, message);
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

const generateMergedConceptBlob = async (fileId) => {
    try {
        const [commentsResponse, originalFileResponse] = await Promise.all([
            listComments(fileId),
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
        
        let mergedContent = `<html><head><meta charset="utf-8"><title>Document with Comments</title><style>body { font-family: 'Times New Roman', serif; font-size: 12pt; } h1 { font-size: 14pt; } h2 { font-size: 13pt; } h3 { font-size: 12pt; } p, div { font-size: 12pt; }</style></head><body><div style="border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px;"><h1>Original Document</h1><div style="line-height: 1.6;">${originalContent}</div></div><div><h1>DACC Comments and Ratings</h1><p><strong>File ID:</strong> ${fileId}</p>`;
        if (comments.length === 0) { mergedContent += `<p>No comments found.</p>`; } else {
            comments.forEach((comment, index) => {
                mergedContent += `<div style="margin-bottom: 30px; border: 1px solid #ccc; padding: 15px; page-break-inside: avoid;"><h3>Comment ${index + 1}:</h3><div style="background-color: #f5f5f5; padding: 10px; margin: 10px 0;">${comment.message}</div><p><strong>Response (if applicable):</strong></p><div style="border: 1px solid #ddd; min-height: 50px; padding: 10px; background-color: white;"></div></div>`;
            });
        }
        mergedContent += `</div></body></html>`;
        return new Blob([mergedContent], { type: 'application/msword' });
    } catch (error) { console.error('Error generating merged blob:', error); return null; }
};

export function viewFinalDecisionFilesTemplate(files) {
    if (!files || files.length === 0) {
        const daccDecisionElement = document.getElementById("daccDecision");
        if (daccDecisionElement) daccDecisionElement.innerHTML = "No files to show.";
        return;
    }

    let template = `<div id='decidedFiles'><div class='row'><div class="col-xl-12 filter-column" id="summaryFilterSiderBar"><div class="div-border white-bg align-left p-2"><div class="main-summary-row"><div class="col-xl-12 pl-1 pr-0"><span class="font-size-10"><h6 class="badge badge-pill badge-1">1</h6>: Approved as submitted <h6 class="badge badge-pill badge-2">2</h6>: Approved, pending conditions <h6 class="badge badge-pill badge-3">3</h6>: Approved, but data release delayed <h6 class="badge badge-pill badge-4">4</h6>: Not Approved <h6 class="badge badge-pill badge-5">5</h6>: Decision requires clarification <h6 class="badge badge-pill badge-777">777</h6>: Duplicate <h6 class="badge badge-pill badge-NA">NA</h6>: Not Applicable</span></div></div></div></div></div><div class='col-xl-12 pr-0'>`;
    template += viewAuthFinalDecisionFilesColumns();
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

export function viewFinalDecisionFiles(files) {
  let template = `<div class="row m-0 align-left allow-overflow w-100"><div class="accordion accordion-flush col-md-12 px-0" id="daccAccordian">`;
  for (const fileInfo of files) {
    const fileId = fileInfo.id;
    const filename = fileInfo.name;
    const lastUnderscoreIndex = filename.lastIndexOf('_');
    const titlename = lastUnderscoreIndex > 0 ? filename.substring(0, lastUnderscoreIndex) : filename;
    const shorttitlename = titlename.length > 40 ? titlename.substring(0, 39) + "..." : titlename;
    template += `<div class="accordian-item mb-2 border-bottom pb-2"><div class="row-24 align-items-center position-relative"><div class="col-24-5 text-left"><span class="responsive-text" title="${titlename}">${shorttitlename}</span></div><div class="col-24-4 text-left"><span class="responsive-text">${new Date(fileInfo.created_at).toDateString().substring(4)}</span></div><div class="col-24-2 text-left">${fileInfo.parent && fileInfo.parent.id == completedFolder ? '<h6 class="badge badge-pill bg-success">Complete</h6>' : fileInfo.parent && fileInfo.parent.id == deniedFolder ? '<h6 class="badge badge-pill bg-danger">Denied</h6>' : '<h6 class="badge badge-pill bg-warning">Ongoing</h6>'}</div><div class="col-24-2 text-center" id="AABCG${fileId}" data-value="AABCG"><select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="AABCG Decision"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="BCAC${fileId}" data-value="BCAC"><select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="BCAC Decision"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="C-NCI${fileId}" data-value="C-NCI"><select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="C-NCI Decision"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="CIMBA${fileId}" data-value="CIMBA"><select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="CIMBA Decision"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="LAGENO${fileId}" data-value="LAGENO"><select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="LAGENO Decision"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="MERGE${fileId}" data-value="MERGE"><select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="MERGE Decision"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-1 text-right"><button class="accordion-toggle-btn" type="button" data-bs-toggle="collapse" data-bs-target="#file${fileId}" aria-expanded="false" aria-controls="file${fileId}" data-file-id="${fileId}"><i class="fas fa-chevron-down"></i></button></div></div><div id="file${fileId}" class="accordion-collapse collapse" aria-labelledby="flush-heading${fileId}"><div class="accordion-body"><div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Concept</div><div class="col">${filename} <button class="btn btn-lg custom-btn preview-file preview-file-inline" title='Preview File' data-file-id="${fileId}" aria-label="Preview File"><i class="fas fa-external-link-alt" style="font-size: 0.8em;"></i></button></div></div><div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Investigator(s)</div><div class="col" id="investigators${fileId}"><span class="text-muted italic">Click accordion to load...</span></div></div><div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Comments</div><div class="col" id='file${fileId}Comments'></div></div></div></div></div>`;
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
              investigatorsDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
              try {
                  const docContent = await readDocFile(fileId);
                  investigatorsDiv.innerHTML = extractContactInvestigators(docContent);
                  showCommentsDCEG(fileId, false);
              } catch (e) { investigatorsDiv.innerHTML = '<span class="text-danger">Error loading details</span>'; }
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

export const generateAuthTableFiles = async () => {
    showAnimation();
    const folderItems = await getFolderItems(submitterFolder);
    const roundFolders = folderItems.entries.filter(item => item.type === 'folder' && item.name.toLowerCase().startsWith('round'));
    roundFolders.sort((a, b) => b.name.localeCompare(a.name));

    if (!adminDataCache) {
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
    }

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
        let dropdownHtml = `<div style=\"display: flex; align-items: center; gap: 10px;\"><label for=\"roundSelect\"><b>Select Round:</b></label><select id=\"roundSelect\" class=\"form-select\" style=\"width: auto;\"><option value=\"all\">All Rounds</option>`;
        roundFolders.forEach(folder => { dropdownHtml += `<option value="${folder.id}">${folder.name}</option>`; });
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
        for (const file of processedRes) await showCommentsDCEG(file.fileId, true);
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
    return `<div class="accordian-item admin-table-row mb-2 border-bottom pb-2" data-round-id="${rId}"><div class="row-24 align-items-center position-relative"><div class="col-24-1 text-left"><input type="checkbox" class="pl admin-checkbox" id="${fId}" value="${fInfo.name}" aria-label="Select file"></div><div class="col-24-4 text-left"><span class="responsive-text" title="${titlename}">${stn}</span></div><div class="col-24-2 text-left"><span class="responsive-text">${new Date(subD).toDateString().substring(4)}</span></div><div class="col-24-2 text-left"><span class="responsive-text">${retD ? new Date(retD).toDateString().substring(4) : "--"}</span></div><div class="col-24-2 text-left">${fInfo.parent.id == completedFolder ? '<h6 class="badge badge-pill bg-success">Complete</h6>' : fInfo.parent.id == deniedFolder ? '<h6 class="badge badge-pill bg-danger">Denied</h6>' : '<h6 class="badge badge-pill bg-warning">Ongoing</h6>'}</div><div class="col-24-2 text-center" id="AABCG${fId}" data-value="AABCG"><select class="form-select form-select-sm decision-dropdown"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="BCAC${fId}" data-value="BCAC"><select class="form-select form-select-sm decision-dropdown"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="C-NCI${fId}" data-value="C-NCI"><select class="form-select form-select-sm decision-dropdown"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="CIMBA${fId}" data-value="CIMBA"><select class="form-select form-select-sm decision-dropdown"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="LAGENO${fId}" data-value="LAGENO"><select class="form-select form-select-sm decision-dropdown"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-2 text-center" id="MERGE${fId}" data-value="MERGE"><select class="form-select form-select-sm decision-dropdown"><option value="--" selected>--</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="777">777</option><option value="NA">NA</option></select></div><div class="col-24-1 text-right"><button class="accordion-toggle-btn" type="button" data-bs-toggle="collapse" data-bs-target="#file${fId}" aria-expanded="false" aria-controls="file${fId}"><i class="fas fa-chevron-down"></i></button></div></div><div id="file${fId}" class="accordion-collapse collapse"><div class="accordion-body"><div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Concept</div><div class="col">${name} <button class="btn btn-lg custom-btn preview-file" title='Preview File' data-file-id="${fId}"><i class="fas fa-external-link-alt" style="font-size: 0.8em;"></i></button></div></div><div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Comments</div><div class="col" id='file${fId}Comments'></div></div></div></div></div>`;
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
