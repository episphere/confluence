import { showPreview } from "../components/boxPreview.js";
import { switchTabs, switchFiles, sortTableByColumn, addEventUpdateScore } from "../event.js";
import { showCommentsSub, showCommentsSub2, showAnimation, readDocFile, extractContactInvestigators, getCollaboration, getFolderItems, getAllFilesRecursive, chairsInfo, messagesForChair, getTaskList, createCompleteTask, assignTask, updateTaskAssignment, createComment, getFileInfo, moveFile, addNewCollaborator, copyFile, acceptedFolder, deniedFolder, submitterFolder, getChairApprovalDate, showCommentsDropDown, archivedFolder, deleteTask, showCommentsDCEG, hideAnimation, getFileURL, emailsAllowedToUpdateData, returnToSubmitterFolder, createFolder, completedFolder, listComments, getFile, createZip, addMetaData, DACCmembers, csv2Json, boxUpdateFile, Confluence_Data_Platform_Metadata_Shared_with_Investigators, Confluence_Data_Platform_Events_Page_Shared_with_Investigators, showComments, showCommentsWithResponses, getFileVersions } from "../shared.js";

export function renderFilePreviewDropdown(files, tab, hideDownloadAll = false) {
    let template = "";
    
    if (!Array.isArray(files)) { return template; }
    if (files.length != 0) {
        if (!hideDownloadAll) {
            template += `
        <button style="margin-right: 10px; float: right" id='${tab}-download-all' class='btn btn-dark'>Download All</button>`;
        }
        template += `
        <div class='card-body p-0'>
          <div class='card-title' style='display: flex; gap: 20px; align-items: flex-start;'>
            <div>
              <label for='${tab}selectedDoc'>
                  <b>Select Concept Form:</b>
              </label>
              <br>
              <select class="form-select" aria-label="Select Document to Review" id='${tab}selectedDoc'>`;
      for (const file of files) {
        const fileId = file.id;
        let filename = file.name;
        let lastUnderscoreIndex = filename.lastIndexOf('_');
        let titlename = lastUnderscoreIndex > 0 ? filename.substring(0, lastUnderscoreIndex) : filename; 
        template += `
            <option value='${fileId}'>
            ${titlename}</option>`;
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
      </div>`;
    } else {
        template += `
            <br>
            No files to show.    
        </div>
        `;
    }
    
    return template;
};

const getCurrentUserAuth = () => {
    const userEmail = JSON.parse(localStorage.parms).login;
    let authChair = chairsInfo.find(({ email }) => email === userEmail);
    return authChair ? authChair : null;
}

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
            const file = files.find(f => f.id === file_id);
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

export const generateChairMenuFiles = async () => {
    const userChairItem = getCurrentUserAuth();
    // console.log(userChairItem);
    
    if (!userChairItem) return null;
    
    const filearrayChair = await getAllFilesRecursive(userChairItem.boxIdNew);
    const filearrayClara = await getAllFilesRecursive(userChairItem.boxIdClara);
    const filearrayAllFiles = await getAllFilesRecursive(submitterFolder);
    // let filearrayChair = responseChair.entries;
    // let filearrayClara = responseClara.entries;
    // let filearrayAllFiles = allFiles.entries;
    // console.log(filearrayAllFiles);

    let test = await getFile(DACCmembers);
    const { data, headers } = csv2Json(test);
    const consortium = chairsInfo.find(element => element.email === JSON.parse(localStorage.getItem('parms')).login).consortium;
    const daccEmails = data.filter(item => item['DACC']==consortium).map(dt => dt['Email']).splice(1);

    const filesIncompleted = [];
    //console.log("1");
    
    // Process filearrayChair in parallel
    const chairTaskPromises = filearrayChair.map(async (obj) => {
        const [tasks, comments] = await Promise.all([getTaskList(obj.id), listComments(obj.id)]);
        const incompleteItems = [];
        
        let hasIncompleteTask = false;
        if (tasks && tasks.entries && tasks.entries.length != 0) {
            for (let items of tasks.entries) {
                for (let itemtasks of items.task_assignment_collection.entries) {
                    if (itemtasks.status === 'incomplete') {
                        hasIncompleteTask = true;
                        incompleteItems.push(itemtasks.item);
                        break;
                    }
                }
                if (hasIncompleteTask) break;
            }
        }
        
        // If no incomplete task, check if file has no comments
        // Handle case where comments is returned as a string
        let commentsObj = comments;
        if (typeof comments === 'string') {
            try {
                commentsObj = JSON.parse(comments);
            } catch (e) {
                commentsObj = null;
            }
        }
        
        const hasComments = commentsObj && commentsObj.entries && Array.isArray(commentsObj.entries) && commentsObj.entries.length > 0;
        
        if (!hasIncompleteTask && !hasComments) {
            incompleteItems.push(obj);
        }
        
        return incompleteItems;
    });
    
    const chairResults = await Promise.all(chairTaskPromises);
    
    // Flatten results and remove duplicates
    chairResults.forEach(items => {
        items.forEach(item => {
            if (filesIncompleted.findIndex(element => element.id === item.id) === -1) {
                filesIncompleted.push(item);
            }
        });
    });

    //console.log("2");

    const filesClaraIncompleted = [];
    
    // Process filearrayClara in parallel
    const claraTaskPromises = filearrayClara.map(async (obj) => {
        const [tasks, comments] = await Promise.all([getTaskList(obj.id), listComments(obj.id)]);
        const incompleteItems = [];
        
        let hasIncompleteTask = false;
        if (tasks && tasks.entries && tasks.entries.length != 0) {
            for (let items of tasks.entries) {
                for (let itemtasks of items.task_assignment_collection.entries) {
                    if (itemtasks.status === 'incomplete') {
                        hasIncompleteTask = true;
                        incompleteItems.push(itemtasks.item);
                        break;
                    }
                }
                if (hasIncompleteTask) break;
            }
        }
        
        // If no incomplete task, check if file has no comments
        // Handle case where comments might be a string
        let commentsObj = comments;
        if (typeof comments === 'string') {
            try {
                commentsObj = JSON.parse(comments);
            } catch (e) {
                commentsObj = null;
            }
        }
        
        const hasComments = commentsObj && commentsObj.entries && Array.isArray(commentsObj.entries) && commentsObj.entries.length > 0;
        
        if (!hasIncompleteTask && !hasComments) {
            incompleteItems.push(obj);
        }
        
        return incompleteItems;
    });
    
    const claraResults = await Promise.all(claraTaskPromises);
    
    // Flatten results and remove duplicates
    claraResults.forEach(items => {
        items.forEach(item => {
            if (filesClaraIncompleted.findIndex(element => element.id === item.id) === -1) {
                // Find the matching file in submitterFolder
                const submitterFile = filearrayAllFiles.find(f => f.name === item.name);
                if (submitterFile) {
                    filesClaraIncompleted.push(submitterFile);
                } else {
                    filesClaraIncompleted.push(item);
                }
            }
        });
    });
    
    // Check for matching files in returnToSubmitterFolder and fetch response comments
    const returnFolderFiles = await getAllFilesRecursive(returnToSubmitterFolder);
    for (const claraFile of filesClaraIncompleted) {
        const matchingFile = returnFolderFiles.find(f => f.name === claraFile.name);
        //console.log(matchingFile)
        if (matchingFile) {
            const commentsResponse = await listComments(matchingFile.id);
            const comments = JSON.parse(commentsResponse).entries;
            claraFile.responseComments = comments.filter(c => c.message.startsWith('Response ID:'));
        }
    }

    const message = messagesForChair[userChairItem.id];

    var template = `
        <div class="general-bg padding-bottom-1rem">
            <div class="container body-min-height">
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">${message}</h1>
                    </div>
                </div>
                <div class="data-submission div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem;">
                    <ul class='nav nav-tabs mb-3' role='tablist'>
                        <li class='nav-item active' role='presentation'>
                            <a class='nav-link' id='recommendationTab' href='#recommendation' data-mdb-toggle="tab" role='tab' aria-controls='recommendation' aria-selected='true'>
                                New Concepts for Review (${filesIncompleted.length})
                            </a>
                        </li>
                        <li class='nav-item' role='presentation'>
                            <a class='nav-link' id='conceptNeedingClarificationTab' href='#conceptNeedingClarification' data-mdb-toggle="tab" role='tab' aria-controls='conceptNeedingClarification' aria-selected='true'>
                                Concepts Requiring Clarifications (${filesClaraIncompleted.length})
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
            <a href="mailto:${daccEmails.join("; ")}" id='email' class='btn btn-dark'>
                Send Email to DACC
            </a>
    `;
    
    template += renderFilePreviewDropdown(filesIncompleted, "recommendation");

    template += `
        <div class='tab-pane fade' id='conceptNeedingClarification' role='tabpanel' aria-labeledby='conceptNeedingClarificationTab'>
            <a href="mailto:${daccEmails.join("; ")}" id='email' class='btn btn-dark'>
                Send Email to DACC
            </a>
    `;
    
    template += renderFilePreviewDropdown(filesClaraIncompleted, "conceptNeedingClarification");

    template += `
        <div class='tab-pane fade' id='daccDecision' role='tabpanel' aria-labeledby='daccDecisionTab'>
        Loading...
        </div>
    `;
    
    // <a href="mailto:${daccEmails.join("; ")}" id='email' class='btn btn-dark'>
    //     Send Email to DACC
    // </a>
    
    template += `<div id='filePreview'>`;
    if (filesIncompleted.length !== 0 || filesClaraIncompleted.length !== 0) {
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
                            <button type="submit" class="buttonsubmit button-glow-red mt-2" value="submitted" onclick="this.classList.toggle('buttonsubmit--loading')">
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
    viewFinalDecisionFilesTemplate(filearrayAllFiles);
    commentSubmit(consortium);
    
    // Add form validation for finalChairDecision
    setTimeout(() => {
        const messageTextarea = document.getElementById('message');
        const gradeSelect = document.getElementById('grade2');
        const submitButton = document.querySelector('#finalChairDecision button[type="submit"]');
        
        if (messageTextarea && gradeSelect && submitButton) {
            const warningDiv = document.getElementById('commentWarning');
            
            const validateForm = () => {
                const grade = gradeSelect.value;
                const message = messageTextarea.value.trim();
                
                if (grade !== '1' && message === '') {
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
            validateForm(); // Initial check
        }
    }, 300);
    
    // Add resize listener for responsive preview container
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
    handleResize(); // Call once to set initial state
    
    downloadAll('recommendation', filesIncompleted)
    downloadAll('conceptNeedingClarification', filesClaraIncompleted)
    //console.log(filesIncompleted);
    if (!!filesIncompleted.length) {
        showPreviewInPane(filesIncompleted[0].id);
        showCommentsInPane(filesIncompleted[0].id);
        switchFilesWithComments("recommendation", filesIncompleted);
        document.getElementById("recommendationselectedDoc").children[0].selected = true;
        setTimeout(() => {
            const finalDecisionForm = document.getElementById('finalChairDecision');
            if (finalDecisionForm) {
                finalDecisionForm.style.display = 'block';
            }
        }, 200);
    } else if (!!filesClaraIncompleted.length) {
        showPreviewInPane(filesClaraIncompleted[0].id);
        if (filesClaraIncompleted[0].responseComments) {
            showCommentsWithResponses(filesClaraIncompleted[0].id, filesClaraIncompleted[0].responseComments);
        } else {
            showCommentsSub(filesClaraIncompleted[0].id);
        }
        switchFilesWithComments("conceptNeedingClarification", filesClaraIncompleted);
        document.getElementById("conceptNeedingClarificationTab").click();
    } else {
        document.getElementById("filePreview").classList.remove("d-block");
        document.getElementById("filePreview").classList.add("d-None");
    }

    switchTabs(
        "recommendation",
        ["daccDecision", 'conceptNeedingClarification'],
        filesIncompleted
    );
    switchTabs(
        "conceptNeedingClarification",
        ["recommendation", 'daccDecision'],
        filesClaraIncompleted
    );
    switchTabs(
        "daccDecision",
        ["recommendation", 'conceptNeedingClarification'],
        filesIncompleted
    );

    document.getElementById("recommendationTab").click();
    // if (localStorage.getItem("currentTab")) {
    //     const currTab = localStorage.getItem("currentTab");
    //     if (document.getElementById(currTab) != null) {
    //         document.getElementById(currTab).click();
    //     }
    // }
    
    // return template;
    hideAnimation();
};

export const chairMenuTemplate = () => {
    // const userInfo = JSON.parse(localStorage.getItem('parms'));
    // console.log('user info: ', userInfo, localStorage.getItem('parms'));
    // if (!userInfo) return;
    
    const userEmail = JSON.parse(localStorage.parms).login;
    const userForChair = chairsInfo.find(item => item.email === userEmail);
    if (userForChair === -1) return;
    
    let template = `
        <div class="general-bg body-min-height padding-bottom-1rem">
            <div id="chairFileView" class="align-left"></div>
        </div>
    `;

    return template;
    
    // const message = messagesForChair[userForChair.id]
    // let template = `
    //     <div class="general-bg padding-bottom-1rem">
    //         <div class="container body-min-height">
    //             <div class="main-summary-row">
    //                 <div class="align-left">
    //                     <h1 class="page-header">${message}</h1>
    //                 </div>
    //             </div>
    //             <div class="data-submission div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem;">
    //                 <ul class='nav nav-tabs mb-3' role='tablist'>
    //                     <li class='nav-item active' role='presentation'>
    //                         <a class='nav-link' id='recommendationTab' href='#recommendation' data-mdb-toggle="tab" role='tab' aria-controls='recommendation' aria-selected='true'> Submit concept recommendation</a>
    //                     </li>
    //                     <li class='nav-item' role='presentation'>
    //                         <a class='nav-link' id='conceptNeedingClarificationTab' href='#conceptNeedingClarification' data-mdb-toggle="tab" role='tab' aria-controls='conceptNeedingClarification' aria-selected='true'>Concept Needing Clarification</a>
    //                     </li>
    //                     <li class='nav-item' role='presentation'>
    //                         <a class='nav-link' id='daccDecisionTab' href='#daccDecision' data-mdb-toggle="tab" role='tab' aria-controls='daccDecision' aria-selected='true'> DACC Decision </a>
    //                     </li>
    //                 </ul>
    //                 <div class="tab-content" id="selectedTab"></div>  
    //             </div>
    //         </div>
    //     </div>
    // `;
    
    // return template;
};

export const commentSubmit = async (consortium) => {
    let submitComment = async (e) => {
        e.preventDefault();
        
        const btn = document.activeElement;
        btn.disabled = true;
        
        const filesToSend = [];
        const elements = document.querySelectorAll(`.tab-content .active option`);
        //console.log({elements})
        
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].selected) {
                filesToSend.push(elements[i].value);
            }
        }
        
        for (const fileId of filesToSend) {
            //console.log(fileId);
            
            let fileinfo = await getFileInfo(fileId);
            let filename = fileinfo.name;
            let allFiles = await getAllFilesRecursive(submitterFolder);
            let entries = allFiles;
            
            let allFileMatch = entries.find(element => element.name === filename);
            let tasklist = await getTaskList(fileId);
            
            let grade = e.target[1].value;
            let comment = e.target[0].value;
            //let message = "Consortium: " + consortium + ", Rating: " + grade + "\nComment: " + comment;
            let message = `Consortium: ${consortium}, Rating: ${grade}, Comment: ${comment}`;
            //console.log(message);
            
            await createComment(fileId, message);
            if (allFileMatch && allFileMatch.id) {
                await createComment(allFileMatch.id, message);
            } else {
                alert('Error detected: Parent file cannot be found, score only recorded in local chair version.');
                btn.disabled = false;
            }
            if (grade === "5" || grade === "2"){
                let clariFolder = chairsInfo.find(element => element.email === JSON.parse(localStorage.getItem('parms')).login).boxIdClara;
                await moveFile(fileId, clariFolder)
            } else {
                const taskEntries = tasklist.entries;
                if (taskEntries.length !== 0) {
                    for (let entry of taskEntries) {
                        for (let item of entry.task_assignment_collection.entries) {
                          console.log(item.status);
                            if (item.status === 'incomplete') {
                                console.log(item.status);
                                await updateTaskAssignment(item.id, 'completed', 'You have completed your task');
                            }
                        }
                    }
                }
            }
        }
        
        // Refresh only the concept lists instead of full page reload
        await generateChairMenuFiles();
        btn.disabled = false;
    };
    
    isElementLoaded('.nav-link.active').then((selector) => {
        // console.log(selector);
        // console.log(document.querySelector('.nav-link.active'));
        const tab = document.querySelector('.nav-link.active').id.slice(0, -3);
        const form = document.querySelector(".submit-comment-" + tab);
        if (form) {
            form.addEventListener("submit", submitComment);
        }
    })
};

export const downloadAll = (tab, files) => {
    const downloadFile = async (e) => {
        let items = []
        files.forEach(async ({id}, index) => {
            //console.log(id);
            let item = {
                "type": "file",
                "id": id
            }
            items.push(item);
        });
        
        //console.log(items);
        
        var chairName = document.getElementsByClassName("page-header")[0].innerHTML.replace(/ /g, "_");
        const d = new Date();
        
        let filename = chairName + "_" + d.getDate() + "_" + (d.getMonth() + 1) + "_" + d.getFullYear();
        let response = await createZip(items, filename);
        let a = document.createElement('a');
        
        a.href = response.download_url;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    isElementLoaded(`#${tab}-download-all`).then(() => {
        const downloadButton = document.querySelector(`#${tab}-download-all`);
        console.log({downloadButton});
        if (downloadButton) {
        downloadButton.addEventListener("click", downloadFile);
        }
    })
};

const isElementLoaded = async selector => {
  while ( document.querySelector(selector) === null) {
    await new Promise ( resolve => requestAnimationFrame(resolve))
  }
  
  return document.querySelector(selector);
}

export function viewFinalDecisionFilesColumns() {
    return `
        <div class="container-fluid m-0 pt-2 pb-2 align-left div-sticky" style="border-bottom: 1px solid rgb(0,0,0, 0.1); font-size: .8em">
            <div class="row-24 align-items-center position-relative">
            
            <!-- Selection checkbox header -->
            <div class="col-24-1 text-left font-bold ws-nowrap text-wrap"></div>

            <!-- Left side: Basic file info columns -->
            <div class="col-24-5 text-left font-bold ws-nowrap text-wrap header-sortable responsive-text">Concept Name <button class="transparent-btn sort-column" data-column-name="Concept Name"><i class="fas fa-sort"></i></button></div>
            <div class="col-24-3 text-left font-bold ws-nowrap text-wrap header-sortable responsive-text">Sub Date <button class="transparent-btn sort-column" data-column-name="Submission Date"><i class="fas fa-sort"></i></button></div>
            <div class="col-24-2 text-left font-bold ws-nowrap text-wrap header-sortable responsive-text">State <button class="transparent-btn sort-column" data-column-name="Date"><i class="fas fa-sort"></i></button></div>
            
            <!-- Consortium columns -->
            <div class="col-24-2 text-center font-bold ws-nowrap text-wrap header-sortable responsive-text">AABCG <button class="transparent-btn sort-column" data-column-name="AABCGDecision"><i class="fas fa-sort"></i></button></div>
            <div class="col-24-2 text-center font-bold ws-nowrap text-wrap header-sortable responsive-text">BCAC <button class="transparent-btn sort-column" data-column-name="BCACDecision"><i class="fas fa-sort"></i></button></div>
            <div class="col-24-2 text-center font-bold ws-nowrap text-wrap header-sortable responsive-text">C-NCI <button class="transparent-btn sort-column" data-column-name="C-NCIDecision"><i class="fas fa-sort"></i></button></div>
            <div class="col-24-2 text-center font-bold ws-nowrap text-wrap header-sortable responsive-text">CIMBA <button class="transparent-btn sort-column" data-column-name="CIMBADecision"><i class="fas fa-sort"></i></button></div>
            <div class="col-24-2 text-center font-bold ws-nowrap text-wrap header-sortable responsive-text">LAGENO <button class="transparent-btn sort-column" data-column-name="LAGENODecision"><i class="fas fa-sort"></i></button></div>
            <div class="col-24-2 text-center font-bold ws-nowrap text-wrap header-sortable responsive-text">MERGE <button class="transparent-btn sort-column" data-column-name="MERGEDecision"><i class="fas fa-sort"></i></button></div>
            <div class="col-24-2 text-center font-bold ws-nowrap text-wrap header-sortable responsive-text" hidden>TEST <button class="transparent-btn sort-column" data-column-name="TESTDecision"><i class="fas fa-sort"></i></button></div>
            
            <!-- Empty space for the accordion toggle button -->
            <div class="col-24-1"></div>
            </div>
        </div>
    `;
};

export async function viewFinalDecisionFilesTemplate(files) {
    let template = "";
    let filesInfo = [];
    
    for (const file of files) {
        const fileInfo = await getFileInfo(file.id);
        filesInfo.push(fileInfo);
    }
    
    if (filesInfo.length > 0) {
        template += `
            <div id='decidedFiles'>
            <div class='row'>
            <div class="col-xl-12 filter-column" id="summaryFilterSiderBar">
                <div class="div-border white-bg align-left p-2">
                    <div class="main-summary-row">
                        <div class="col-xl-12 pl-1 pr-0">
                            <span class="font-size-10">
                                <h6 class="badge badge-pill badge-1">1</h6>: Approved as submitted 
                                <h6 class="badge badge-pill badge-2">2</h6>: Approved, pending conditions 
                                <h6 class="badge badge-pill badge-3">3</h6>: Approved, but data release delayed 
                                <h6 class="badge badge-pill badge-4">4</h6>: Not Approved 
                                <h6 class="badge badge-pill badge-5">5</h6>: Decision requires clarification 
                                <h6 class="badge badge-pill badge-777">777</h6>: Duplicate
                                <h6 class="badge badge-pill badge-NA">NA</h6>: Not Applicable
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            </div>
            <div class='col-xl-12 pr-0'>
        `;
        
        template += viewFinalDecisionFilesColumns();
        template += '<div id="files"> </div>';
        template += '<!--tbody id="files"-->';
    } else {
        template += `
            No files to show.            
        </div>
        </div>
        `;
    }
    
    document.getElementById("daccDecision").innerHTML = template;
    if (filesInfo.length !== 0) {
        await viewFinalDecisionFiles(filesInfo);
        for (const file of filesInfo) {
            showCommentsDCEG(file.id, false)
            // console.log(file.id);
            // document
            //   .getElementById(`study${file.id}`)
            //   .addEventListener("click", showCommentsDCEG(file.id));
        }
        
        let btns = Array.from(document.querySelectorAll(".preview-file"));
        btns.forEach((btn) => {
            btn.addEventListener("click", (e) => {
                btn.dataset.target = "#confluencePreviewerModal";
                const header = document.getElementById("confluencePreviewerModalHeader");
                const body = document.getElementById("confluencePreviewerModalBody");
                header.innerHTML = `
                    <h5 class="modal-title">File preview</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                `;
                const fileId = btn.dataset.fileId;
                $("#confluencePreviewerModal").modal("show");
                showPreview(fileId, "confluencePreviewerModalBody");
            });
        });
        
        //Filtering and Sorting
        const table = document.getElementById("decidedFiles");
        const headers = table.querySelector(`.div-sticky`);
        Array.from(headers.children).forEach((header, index) => {
            header.addEventListener("click", (e) => {
                const sortDirection = header.classList.contains("header-sort-asc");
                sortTableByColumn(table, index, !sortDirection);
            });
        });
        
        // filterSection(filesInfo);
        Array.from(document.getElementsByClassName("filter-var")).forEach((el) => {
            el.addEventListener("click", () => {
                const headerCell = document.getElementsByClassName("header-sortable")[0];
                const tableElement = headerCell.parentElement.parentElement.parentElement;
                filterCheckBox(tableElement, filesInfo);
            });
        });
        // const input = document.getElementById("searchDataDictionary");
        // input.addEventListener("input", () => {
        //   const headerCell = document.getElementsByClassName("header-sortable")[0];
        //   const tableElement = headerCell.parentElement.parentElement.parentElement;
        //   filterCheckBox(tableElement, filesInfo);
        // });
    }
};

export async function viewFinalDecisionFiles(files) {
  let template = `
    <div class="row m-0 align-left allow-overflow w-100">
      <div class="accordion accordion-flush col-md-12 px-0" id="daccAccordian">
  `;
  
  // Process all files in parallel
  const filePromises = files.map(async (fileInfo) => {
    const fileId = fileInfo.id;
    const [docContent, completion_date] = await Promise.all([
      readDocFile(fileId),
      getChairApprovalDate(fileId)
    ]);
    
    const contacts = extractContactInvestigators(docContent);
    const filename = fileInfo.name;
    const lastUnderscoreIndex = filename.lastIndexOf('_');
    const titlename = lastUnderscoreIndex > 0 ? filename.substring(0, lastUnderscoreIndex) : filename;
    const shorttitlename = titlename.length > 40 ? titlename.substring(0, 39) + "..." : titlename;
    
    return { fileInfo, fileId, contacts, filename, titlename, shorttitlename, completion_date };
  });
  
  const processedFiles = await Promise.all(filePromises);
  
  // Build template with processed data
  for (const { fileInfo, fileId, contacts, filename, titlename, shorttitlename, completion_date } of processedFiles) {
    
    template += `
  <div class="accordian-item mb-2 border-bottom pb-2">
    <!-- File info row with accordion button and dropdowns side by side -->
    <div class="row-24 align-items-center position-relative">
      <!-- File Name (col-3) -->
      <div class="col-24-5 text-left">
        <span class="responsive-text" title="${titlename}">${shorttitlename}</span>
      </div>
      
      <!-- Date (col-1) -->
      <div class="col-24-4 text-left">
        <span class="responsive-text">${new Date(fileInfo.created_at).toDateString().substring(4)}</span>
      </div>
      
      <!-- Status (col-1) -->
      <div class="col-24-2 text-left">
            ${
              fileInfo.parent.id == completedFolder
                ? '<h6 class="badge badge-pill bg-success">Complete</h6>'
                : fileInfo.parent.id == deniedFolder
                ? '<h6 class="badge badge-pill bg-danger">Denied</h6>'
                : '<h6 class="badge badge-pill bg-warning">Ongoing</h6>'
            }
      </div>
      
      <!-- AABCG (col-1) -->
      <div class="col-24-2 text-center" id="AABCG${fileId}" data-value="AABCG">
        <select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="AABCG Decision">
          <option value="--" selected>--</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="777">777</option>
          <option value="NA">NA</option>
        </select>
      </div>
      
      <!-- BCAC (col-1) -->
      <div class="col-24-2 text-center" id="BCAC${fileId}" data-value="BCAC">
        <select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="BCAC Decision">
          <option value="--" selected>--</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="777">777</option>
          <option value="NA">NA</option>
        </select>
      </div>
      
      <!-- C-NCI (col-1) -->
      <div class="col-24-2 text-center" id="C-NCI${fileId}" data-value="C-NCI">
        <select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="C-NCI Decision">
          <option value="--" selected>--</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="777">777</option>
          <option value="NA">NA</option>
        </select>
      </div>
      
      <!-- CIMBA (col-1) -->
      <div class="col-24-2 text-center" id="CIMBA${fileId}" data-value="CIMBA">
        <select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="CIMBA Decision">
          <option value="--" selected>--</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="777">777</option>
          <option value="NA">NA</option>
        </select>
      </div>
      
      <!-- LAGENO (col-1) -->
      <div class="col-24-2 text-center" id="LAGENO${fileId}" data-value="LAGENO">
        <select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="LAGENO Decision">
          <option value="--" selected>--</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="777">777</option>
          <option value="NA">NA</option>
        </select>
      </div>
      
      <!-- MERGE (col-1) -->
      <div class="col-24-2 text-center" id="MERGE${fileId}" data-value="MERGE">
        <select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="MERGE Decision">
          <option value="--" selected>--</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="777">777</option>
          <option value="NA">NA</option>
        </select>
      </div>
      
      <!-- TEST (col-1, hidden) -->
      <div class="col-24-2 text-center" id="TEST${fileId}" data-value="TEST" hidden>
        <select class="form-select form-select-sm decision-dropdown disabled" disabled="true" aria-label="TEST Decision">
          <option value="--" selected>--</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="777">777</option>
          <option value="NA">NA</option>
        </select>
      </div>
      
      <!-- Accordion toggle button (positioned absolutely) -->
      <div class="col-24-1 text-right">
        <button class="accordion-toggle-btn" type="button" data-bs-toggle="collapse" data-bs-target="#file${fileId}" aria-expanded="false" aria-controls="file${fileId}">
          <i class="fas fa-chevron-down"></i>
        </button>
      </div>
    </div>
    
    <!-- Hidden accordion header for Bootstrap's accordion functionality -->
    <h2 class="accordion-header d-none" id="flush-heading${fileId}">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#file${fileId}" aria-expanded="false" aria-controls="file${fileId}"></button>
    </h2>
    
    <!-- Accordion content -->
    <div id="file${fileId}" class="accordion-collapse collapse" aria-labelledby="flush-heading${fileId}">
      <div class="accordion-body">
        <div class="row mb-1 m-0">
          <div class="col-md-2 pl-2 font-bold">Concept</div>
          <div class="col">
            ${filename} 
            <button class="btn btn-lg custom-btn preview-file preview-file-inline" title='Preview File' data-file-id="${fileId}" aria-label="Preview File" data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#bcrppPreviewerModal" style="vertical-align: baseline; padding: 2px 6px; margin-left: 8px; line-height: 1;">
              <i class="fas fa-external-link-alt" style="font-size: 0.8em;"></i>
            </button>
          </div>
        </div>
        <div class="row mb-1 m-0">
            <div class="col-md-2 pl-2 font-bold">Investigator(s)</div>
            <div class="col">${contacts}}</div>
        </div>
        <div class="row mb-1 m-0">
          <div class="col-md-2 pl-2 font-bold">Comments</div>
          <div class="col" id='file${fileId}Comments'></div>
        </div>
      </div>
    </div>
  </div>`;
  }
  
  template += `</div></div>`;
  
  if (document.getElementById("files") != null) {
    document.getElementById("files").innerHTML = template;
    
    // Add event listeners for the dropdowns
    // document.querySelectorAll('.decision-dropdown').forEach(dropdown => {
    //   dropdown.addEventListener('change', function() {
    //     const selectedValue = this.value;
    //     const parentElement = this.closest('[data-value]');
    //     const consortium = parentElement.getAttribute('data-value');
    //     const fileId = parentElement.id.replace(consortium, '');
        
    //     console.log(`Selected ${selectedValue} for ${consortium} on file ${fileId}`);
        
    //     // Remove any existing badge classes
    //     this.className = 'form-select form-select-sm decision-dropdown disabled';
    //     dropdown.setAttribute('disabled', true);
        
    //     // Add styling based on selection
    //     if (selectedValue !== '--') {
    //       this.classList.add(`badge-${selectedValue}`);
    //     }
    //   });
    // });
    
    // Add event listeners for the custom accordion toggle buttons
    document.querySelectorAll('.accordion-toggle-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const targetId = this.getAttribute('data-bs-target');
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        
        // Toggle the icon
        if (isExpanded) {
          this.querySelector('i').classList.replace('fa-chevron-down', 'fa-chevron-up');
          this.setAttribute('aria-expanded', 'false');
        } else {
          this.querySelector('i').classList.replace('fa-chevron-up', 'fa-chevron-down');
          this.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }
}

export const authTableTemplate = () => {
    // const userInfo = JSON.parse(localStorage.getItem('parms'));
    // console.log('user info: ', userInfo, localStorage.getItem('parms'));
    // if (!userInfo) return;
    
    const userEmail = JSON.parse(localStorage.parms).login;
    const userForAuth = emailsAllowedToUpdateData.includes(userEmail);
    if (!userForAuth) return;
    
    let template = `
        <div class="general-bg padding-bottom-1rem">
            <div class="container body-min-height">
              <div class="main-summary-row" style="display: flex; justify-content: space-between; align-items: center;">
                  <div class="align-left">
                      <h1 class="page-header">Admin Table View</h1>
                  </div>
                  <div class="align-right">
                      <button type="submit" id="submitID" class="buttonsubmit button-glow-red" onclick="this.classList.toggle('buttonsubmit--loading')"> 
                        <span class="buttonsubmit__text"> Update Users </span>
                      </button>
                      <button type="button" id="renameFilesBtn" class="buttonsubmit button-glow-red" style="margin-left: 10px;"> 
                        <span class="buttonsubmit__text"> Rename Files </span>
                      </button>
                  </div>
              </div>
                <div class="data-submission div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem;">
                    <div class="tab-content" id="selectedTab">
                        <div class="tab-pane fade show active" id="daccDecision" role="tabpanel" aria-labeledby="daccDecisionTab">
                            <div id="authTableView" class="align-left"></div>
                                <button type="submit" class="buttonsubmit button-glow-red" id="returnSubmitter" onclick="this.classList.toggle('buttonsubmit--loading')">
                                    <span class="buttonsubmit__text"> Return to Submitter </span>
                                </button>
                                <button type="submit" class="buttonsubmit button-glow-red" id="returnChairs" onclick="this.classList.toggle('buttonsubmit--loading')">
                                    <span class="buttonsubmit__text"> Return to Chairs </span>
                                </button>
                                <a href="mailto:mkh39@medschl.cam.ac.uk; xjahuang@ucdavis.edu; vzavala@ucdavis.edu; r.santos@qub.ac.uk; guochong.jia@vumc.org; thomas.ahearn@nih.gov?subject=Confluence Data Coordinating Centers" id='email' class='btn btn-dark'>
                                    Send Email to DACC
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    `;

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
                    const files = await getAllFilesRecursive(subfolder.id);
                    requiringInputFiles.push(...files);
                }
            }
        }
    }
    
    return requiringInputFiles;
};

export const generateAuthTableFiles = async () => {
    let filearrayAllFilesSub = await getAllFilesRecursive(submitterFolder);
    let filearrayAllFilesCom = await getAllFilesRecursive(completedFolder);
    let filearrayAllFilesRes = await getRequiringInputFiles(returnToSubmitterFolder);
    //let filearrayAllFilesSub = allFilessub.entries;
    //let filearrayAllFilesCom = allFilescom.entries;
    //console.log(filearrayAllFilesSub);

    // document.getElementById("authTableView").innerHTML = template;
    await viewAuthFinalDecisionFilesTemplate(filearrayAllFilesSub, filearrayAllFilesCom, filearrayAllFilesRes);
    
    // commentSubmit();
    returnToChairs();
    returnToSubmitter();
    addRenameFilesEvent(filearrayAllFilesSub);
    hideAnimation();
};

export async function viewAuthFinalDecisionFilesTemplate(filesSub, filesCom, filesRes) {
    let template = "";
    let filesInfoSub = [];
    let filesInfoCom = [];
    let filesInfoRes = [];
    
    for (const file of filesSub) {
        const fileInfo = await getFileInfo(file.id);
        filesInfoSub.push(fileInfo);
    }
    
    for (const file of filesCom) {
        const fileInfo = await getFileInfo(file.id);
        filesInfoCom.push(fileInfo);
    }

    for (const file of filesRes) {
        const fileInfo = await getFileInfo(file.id);
        filesInfoRes.push(fileInfo);
    }

    // Remove files from filesInfoSub that match names in filesInfoRes
    const resFileNames = filesInfoRes.map(file => file.name);
    filesInfoSub = filesInfoSub.filter(file => !resFileNames.includes(file.name));
    
    if (filesInfoSub.length > 0 || filesInfoCom.length > 0 || filesInfoRes.length > 0) {
        template += `
            <div id='decidedFiles'>
                <div class='row'>
                <div class="col-xl-12 filter-column" id="summaryFilterSiderBar">
                    <div class="div-border white-bg align-left p-2">
                        <div class="main-summary-row">
                            <div class="col-xl-12 pl-1 pr-0">
                                <span class="font-size-10">
                                    <h6 class="badge badge-pill badge-1">1</h6>: Approved as submitted
                                    <h6 class="badge badge-pill badge-2">2</h6>: Approved, pending conditions 
                                    <h6 class="badge badge-pill badge-3">3</h6>: Approved, but data release delayed 
                                    <h6 class="badge badge-pill badge-4">4</h6>: Not Approved 
                                    <h6 class="badge badge-pill badge-5">5</h6>: Decision requires clarification 
                                    <h6 class="badge badge-pill badge-777">777</h6>: Duplicate
                                    <h6 class="badge badge-pill badge-NA">NA</h6>: Not Applicable
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class='col-xl-12 pr-0'>
        `;
        
        template += viewFinalDecisionFilesColumns();
        template += '<div id="files"> </div>';
        template += '<!--tbody id="files"-->';
    } else {
        template += `
            No files to show.            
        </div>
        </div>
        `;
    }
    
    document.getElementById("authTableView").innerHTML = template;
    
    if (filesInfoSub.length !== 0 || filesInfoCom.length !== 0 || filesInfoRes.length !== 0) {
        await viewAuthFinalDecisionFiles(filesInfoSub, filesInfoCom, filesInfoRes);
        
        // Add checkbox change listeners to enable/disable buttons
        const updateButtonStates = () => {
            const anyChecked = document.querySelectorAll('.pl:checked').length > 0;
            const returnSubmitterBtn = document.getElementById('returnSubmitter');
            const returnChairsBtn = document.getElementById('returnChairs');
            
            if (returnSubmitterBtn) {
                returnSubmitterBtn.disabled = !anyChecked;
                returnSubmitterBtn.style.opacity = anyChecked ? '1' : '0.5';
            }
            if (returnChairsBtn) {
                returnChairsBtn.disabled = !anyChecked;
                returnChairsBtn.style.opacity = anyChecked ? '1' : '0.5';
            }
        };
        
        // Initial state - disable buttons
        updateButtonStates();
        
        // Add event listeners to all checkboxes
        document.querySelectorAll('.pl').forEach(checkbox => {
            checkbox.addEventListener('change', updateButtonStates);
        });
        
        for (const file of filesInfoSub) {
            showCommentsDCEG(file.id, true)
        }
        
        for (const file of filesInfoCom) {
            showCommentsDCEG(file.id, true)
        }

        for (const file of filesInfoRes) {
            showCommentsDCEG(file.id, true)
        }
        
        let btns = Array.from(document.querySelectorAll(".preview-file"));
        btns.forEach((btn) => {
            btn.addEventListener("click", (e) => {
                btn.dataset.target = "#confluencePreviewerModal";
                const header = document.getElementById("confluencePreviewerModalHeader");
                const body = document.getElementById("confluencePreviewerModalBody");
                header.innerHTML = `
                    <h5 class="modal-title">File preview</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                `;
                
                const fileId = btn.dataset.fileId;
                $("#confluencePreviewerModal").modal("show");
                showPreview(fileId, "confluencePreviewerModalBody");
            });
        });
        
        //Filtering and Sorting
        const table = document.getElementById("decidedFiles");
        const headers = table.querySelector(`.div-sticky`);
        Array.from(headers.children).forEach((header, index) => {
            header.addEventListener("click", (e) => {
                const sortDirection = header.classList.contains("header-sort-asc");
                sortTableByColumn(table, index, !sortDirection);
            });
        });
        
        // filterSection(filesInfo);
        Array.from(document.getElementsByClassName("filter-var")).forEach((el) => {
            el.addEventListener("click", () => {
                const headerCell =
                document.getElementsByClassName("header-sortable")[0];
                const tableElement =
                headerCell.parentElement.parentElement.parentElement;
                filterCheckBox(tableElement, filesInfo);
            });
        });
        // const input = document.getElementById("searchDataDictionary");
        // input.addEventListener("input", () => {
        //     const headerCell = document.getElementsByClassName("header-sortable")[0];
        //     const tableElement = headerCell.parentElement.parentElement.parentElement;
        //     filterCheckBox(tableElement, filesInfo);
        // });
    }
};

export async function viewAuthFinalDecisionFiles(filesInfoSub, filesInfoCom, filesInfoRes) {
  
  let template = `
    <div class="row m-0 align-left allow-overflow w-100">
      <div class="accordion accordion-flush col-md-12" id="adminAccordian">
  `;
  
  // Process filesInfoSub in parallel
  const subFilePromises = filesInfoSub.map(async (fileInfo) => {
    const fileId = fileInfo.id;
    const [docContent, completion_date] = await Promise.all([
      readDocFile(fileId),
      getChairApprovalDate(fileId)
    ]);
    
    const contacts = extractContactInvestigators(docContent);
    const filename = fileInfo.name;
    const lastUnderscoreIndex = filename.lastIndexOf('_');
    const titlename = lastUnderscoreIndex > 0 ? filename.substring(0, lastUnderscoreIndex) : filename;
    const shorttitlename = titlename.length > 40 ? titlename.substring(0, 39) + "..." : titlename;
    
    return { fileInfo, fileId, contacts, filename, titlename, shorttitlename, completion_date, isSubmitted: true };
  });
  
  // Process filesInfoCom in parallel
  const comFilePromises = filesInfoCom.map(async (fileInfo) => {
    const fileId = fileInfo.id;
    const completion_date = await getChairApprovalDate(fileId);
    
    const filename = fileInfo.name;
    const lastUnderscoreIndex = filename.lastIndexOf('_');
    const titlename = lastUnderscoreIndex > 0 ? filename.substring(0, lastUnderscoreIndex) : filename.slice(0,-5);
    const shorttitlename = titlename.length > 40 ? titlename.substring(0, 39) + "..." : titlename;
    
    return { fileInfo, fileId, filename, titlename, shorttitlename, completion_date, isSubmitted: false };
  });
  
  // Process filesInfoRes in parallel
  const resFilePromises = filesInfoRes.map(async (fileInfo) => {
    const fileId = fileInfo.id;
    const [docContent, completion_date] = await Promise.all([
      readDocFile(fileId),
      getChairApprovalDate(fileId)
    ]);
    
    const contacts = extractContactInvestigators(docContent);
    const filename = fileInfo.name;
    const lastUnderscoreIndex = filename.lastIndexOf('_');
    const titlename = lastUnderscoreIndex > 0 ? filename.substring(0, lastUnderscoreIndex) : filename;
    const shorttitlename = titlename.length > 40 ? titlename.substring(0, 39) + "..." : titlename;
    
    return { fileInfo, fileId, contacts, filename, titlename, shorttitlename, completion_date, isRequiringInput: true };
  });
  
  const [processedSubFiles, processedComFiles, processedResFiles] = await Promise.all([
    Promise.all(subFilePromises),
    Promise.all(comFilePromises),
    Promise.all(resFilePromises)
  ]);
  
  // Build template with processed data
  for (const { fileInfo, fileId, contacts, filename, titlename, shorttitlename, completion_date, isSubmitted } of processedSubFiles) {

    template += `
      <div class="accordian-item mb-2 border-bottom pb-2">
        <!-- File info row with accordion button and dropdowns side by side -->
        <div class="row-24 align-items-center position-relative">

          <!-- Selection checkbox -->
          <div class="col-24-1 text-left">
            <input type="checkbox" class="pl admin-checkbox" id="${fileId}" value="${fileInfo.name}" aria-label="Select file">
          </div>


          <!-- File Name (col-3) -->
          <div class="col-24-5 text-left">
            <span class="responsive-text" title="${titlename}">${shorttitlename}</span>
          </div>
          
          <!-- Date (col-1) -->
          <div class="col-24-3 text-left">
            <span class="responsive-text">${new Date(fileInfo.created_at).toDateString().substring(4)}</span>
          </div>
          
          <!-- Status (col-1) -->
          <div class="col-24-2 text-left">
            ${
              fileInfo.parent.id == completedFolder
                ? '<h6 class="badge badge-pill bg-success">Complete</h6>'
                : fileInfo.parent.id == deniedFolder
                ? '<h6 class="badge badge-pill bg-danger">Denied</h6>'
                : '<h6 class="badge badge-pill bg-warning">Ongoing</h6>'
            }
          </div>
          
          <!-- AABCG (col-1) -->
          <div class="col-24-2 text-center" id="AABCG${fileId}" data-value="AABCG">
            <select class="form-select form-select-sm decision-dropdown" aria-label="AABCG Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          
          <!-- BCAC (col-1) -->
          <div class="col-24-2 text-center" id="BCAC${fileId}" data-value="BCAC">
            <select class="form-select form-select-sm decision-dropdown" aria-label="BCAC Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          
          <!-- C-NCI (col-1) -->
          <div class="col-24-2 text-center" id="C-NCI${fileId}" data-value="C-NCI">
            <select class="form-select form-select-sm decision-dropdown" aria-label="C-NCI Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          
          <!-- CIMBA (col-1) -->
          <div class="col-24-2 text-center" id="CIMBA${fileId}" data-value="CIMBA">
            <select class="form-select form-select-sm decision-dropdown" aria-label="CIMBA Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          
          <!-- LAGENO (col-1) -->
          <div class="col-24-2 text-center" id="LAGENO${fileId}" data-value="LAGENO">
            <select class="form-select form-select-sm decision-dropdown" aria-label="LAGENO Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          
          <!-- MERGE (col-1) -->
          <div class="col-24-2 text-center" id="MERGE${fileId}" data-value="MERGE">
            <select class="form-select form-select-sm decision-dropdown" aria-label="MERGE Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          
          <!-- TEST (col-1, hidden) -->
          <div class="col-24-2 text-center" id="TEST${fileId}" data-value="TEST" hidden>
            <select class="form-select form-select-sm decision-dropdown" aria-label="TEST Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          
          <!-- Accordion toggle button (positioned absolutely) -->
          <div class="col-24-1 text-right">
            <button class="accordion-toggle-btn" type="button" data-bs-toggle="collapse" data-bs-target="#file${fileId}" aria-expanded="false" aria-controls="file${fileId}">
              <i class="fas fa-chevron-down"></i>
            </button>
          </div>
        </div>
        
        <!-- Hidden accordion header for Bootstrap's accordion functionality -->
        <h2 class="accordion-header d-none" id="flush-heading${fileId}">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#file${fileId}" aria-expanded="false" aria-controls="file${fileId}"></button>
        </h2>
        
        <!-- Accordion content -->
        <div id="file${fileId}" class="accordion-collapse collapse" aria-labelledby="flush-heading${fileId}">
          <div class="accordion-body">
            <div class="row mb-1 m-0">
              <div class="col-md-2 pl-2 font-bold">Concept</div>
              <div class="col">
                ${filename} 
                <button class="btn btn-lg custom-btn preview-file" title='Preview File' data-file-id="${fileId}" aria-label="Preview File" data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#bcrppPreviewerModal" style="vertical-align: baseline; padding: 2px 6px; margin-left: 8px; line-height: 1;">
                  <i class="fas fa-external-link-alt" style="font-size: 0.8em;"></i>
                </button>
              </div>
            </div>
            <div class="row mb-1 m-0">
                <div class="col-md-2 pl-2 font-bold">Investigator(s)</div>
                <div class="col">${contacts}</div>
            </div>
            <div class="row mb-1 m-0">
              <div class="col-md-2 pl-2 font-bold">Comments</div>
              <div class="col" id='file${fileId}Comments'></div>
            </div>
          </div>
        </div>
      </div>`;
      }

  for (const { fileInfo, fileId, filename, titlename, shorttitlename, completion_date } of processedComFiles) {
    //console.log(fileInfo.parent.id);

    template += `
      <div class="accordian-item mb-2 border-bottom pb-2">
        <!-- File info row with accordion button and dropdowns side by side -->
        <div class="row-24 align-items-center position-relative">
          <!-- File Name (col-3) -->
          <div class="col-24-5 text-left">
            <p title="${titlename}">${shorttitlename}</p>
          </div>
          
          <!-- Date (col-1) -->
          <div class="col-24-4 text-left">
            ${new Date(fileInfo.created_at).toDateString().substring(4)}
          </div>
          
          <!-- Status (col-1) -->
          <div class="col-24-2 text-left">
            ${
              fileInfo.parent.id == completedFolder
                ? '<h6 class="badge badge-pill bg-success">Complete</h6>'
                : fileInfo.parent.id == deniedFolder
                ? '<h6 class="badge badge-pill bg-danger">Denied</h6>'
                : '<h6 class="badge badge-pill bg-warning">Ongoing</h6>'
            }
          </div>
          
          <!-- AABCG (col-1) -->
          <div class="col-24-2 text-center" id="AABCG${fileId}" data-value="AABCG">
            <select class="form-select form-select-sm decision-dropdown" aria-label="AABCG Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          
          <!-- BCAC (col-1) -->
          <div class="col-24-2 text-center" id="BCAC${fileId}" data-value="BCAC">
            <select class="form-select form-select-sm decision-dropdown" aria-label="BCAC Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          
          <!-- C-NCI (col-1) -->
          <div class="col-24-2 text-center" id="C-NCI${fileId}" data-value="C-NCI">
            <select class="form-select form-select-sm decision-dropdown" aria-label="C-NCI Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          
          <!-- CIMBA (col-1) -->
          <div class="col-24-2 text-center" id="CIMBA${fileId}" data-value="CIMBA">
            <select class="form-select form-select-sm decision-dropdown" aria-label="CIMBA Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          
          <!-- LAGENO (col-1) -->
          <div class="col-24-2 text-center" id="LAGENO${fileId}" data-value="LAGENO">
            <select class="form-select form-select-sm decision-dropdown" aria-label="LAGENO Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          
          <!-- MERGE (col-1) -->
          <div class="col-24-2 text-center" id="MERGE${fileId}" data-value="MERGE">
            <select class="form-select form-select-sm decision-dropdown" aria-label="MERGE Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          
          <!-- TEST (col-1, hidden) -->
          <div class="col-24-2 text-center" id="TEST${fileId}" data-value="TEST" hidden>
            <select class="form-select form-select-sm decision-dropdown" aria-label="TEST Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          
          <!-- Accordion toggle button (positioned absolutely) -->
          <div class="col-24-1 text-right">
            <button class="accordion-toggle-btn" type="button" data-bs-toggle="collapse" data-bs-target="#file${fileId}" aria-expanded="false" aria-controls="file${fileId}">
              <i class="fas fa-chevron-down"></i>
            </button>
          </div>
        </div>
        
        <!-- Hidden accordion header for Bootstrap's accordion functionality -->
        <h2 class="accordion-header d-none" id="flush-heading${fileId}">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#file${fileId}" aria-expanded="false" aria-controls="file${fileId}"></button>
        </h2>
        
        <!-- Accordion content -->
        <div id="file${fileId}" class="accordion-collapse collapse" aria-labelledby="flush-heading${fileId}">
          <div class="accordion-body">
            <div class="row mb-1 m-0">
              <div class="col-md-2 pl-2 font-bold">Concept</div>
              <div class="col">
                ${filename} 
                <button class="btn btn-lg custom-btn preview-file" title='Preview File' data-file-id="${fileId}" aria-label="Preview File" data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#bcrppPreviewerModal" style="vertical-align: baseline; padding: 2px 6px; margin-left: 8px; line-height: 1;">
                  <i class="fas fa-external-link-alt" style="font-size: 0.8em;"></i>
                </button>
              </div>
            </div>
            <div class="row mb-1 m-0">
              <div class="col-md-2 pl-2 font-bold">Comments</div>
              <div class="col" id='file${fileId}Comments'></div>
            </div>
          </div>
        </div>
      </div>`;
      }

  for (const { fileInfo, fileId, contacts, filename, titlename, shorttitlename, completion_date, isRequiringInput } of processedResFiles) {
    template += `
      <div class="accordian-item mb-2 border-bottom pb-2">
        <div class="row-24 align-items-center position-relative">
          <div class="col-24-1 text-left">
            <input type="checkbox" class="pl admin-checkbox" id="${fileId}" value="${fileInfo.name}" aria-label="Select file">
          </div>
          <div class="col-24-5 text-left">
            <span class="responsive-text" title="${titlename}">${shorttitlename}</span>
          </div>
          <div class="col-24-3 text-left">
            <span class="responsive-text">${new Date(fileInfo.created_at).toDateString().substring(4)}</span>
          </div>
          <div class="col-24-2 text-left">
            <h6 class="badge badge-pill bg-info">Returned</h6>
          </div>
          <div class="col-24-2 text-center" id="AABCG${fileId}" data-value="AABCG">
            <select class="form-select form-select-sm decision-dropdown" aria-label="AABCG Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          <div class="col-24-2 text-center" id="BCAC${fileId}" data-value="BCAC">
            <select class="form-select form-select-sm decision-dropdown" aria-label="BCAC Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          <div class="col-24-2 text-center" id="C-NCI${fileId}" data-value="C-NCI">
            <select class="form-select form-select-sm decision-dropdown" aria-label="C-NCI Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          <div class="col-24-2 text-center" id="CIMBA${fileId}" data-value="CIMBA">
            <select class="form-select form-select-sm decision-dropdown" aria-label="CIMBA Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          <div class="col-24-2 text-center" id="LAGENO${fileId}" data-value="LAGENO">
            <select class="form-select form-select-sm decision-dropdown" aria-label="LAGENO Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          <div class="col-24-2 text-center" id="MERGE${fileId}" data-value="MERGE">
            <select class="form-select form-select-sm decision-dropdown" aria-label="MERGE Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          <div class="col-24-2 text-center" id="TEST${fileId}" data-value="TEST" hidden>
            <select class="form-select form-select-sm decision-dropdown" aria-label="TEST Decision">
              <option value="--" selected>--</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="777">777</option>
              <option value="NA">NA</option>
            </select>
          </div>
          <div class="col-24-1 text-right">
            <button class="accordion-toggle-btn" type="button" data-bs-toggle="collapse" data-bs-target="#file${fileId}" aria-expanded="false" aria-controls="file${fileId}">
              <i class="fas fa-chevron-down"></i>
            </button>
          </div>
        </div>
        <h2 class="accordion-header d-none" id="flush-heading${fileId}">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#file${fileId}" aria-expanded="false" aria-controls="file${fileId}"></button>
        </h2>
        <div id="file${fileId}" class="accordion-collapse collapse" aria-labelledby="flush-heading${fileId}">
          <div class="accordion-body">
            <div class="row mb-1 m-0">
              <div class="col-md-2 pl-2 font-bold">Concept</div>
              <div class="col">
                ${filename} 
                <button class="btn btn-lg custom-btn preview-file" title='Preview File' data-file-id="${fileId}" aria-label="Preview File" data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#bcrppPreviewerModal" style="vertical-align: baseline; padding: 2px 6px; margin-left: 8px; line-height: 1;">
                  <i class="fas fa-external-link-alt" style="font-size: 0.8em;"></i>
                </button>
              </div>
            </div>
            <div class="row mb-1 m-0">
              <div class="col-md-2 pl-2 font-bold">Investigator(s)</div>
              <div class="col">${contacts}</div>
            </div>
            <div class="row mb-1 m-0">
              <div class="col-md-2 pl-2 font-bold">Comments</div>
              <div class="col" id='file${fileId}Comments'></div>
            </div>
          </div>
        </div>
      </div>`;
  }

    template += `</div></div></div></div>`;
    if (document.getElementById("files") != null) {
        document.getElementById("files").innerHTML = template;

        document.querySelectorAll('.decision-dropdown').forEach(dropdown => {
            
            dropdown.addEventListener('change', async function() {
                const selectedValue = this.value;
                const previousValue = this.getAttribute('data-previous-value') || '--';
                const parentElement = this.closest('[data-value]');
                const consortium = parentElement.getAttribute('data-value');
                const fileId = parentElement.id.replace(consortium, '');
                
                // Show confirmation dialog
                if (!confirm(`Are you sure you want to change the ${consortium} score from ${previousValue} to ${selectedValue}?`)) {
                    // If user cancels, revert to previous value
                    this.value = previousValue;
                    return;
                }

                const header = document.getElementById('confluenceModalHeader');
                const body = document.getElementById('confluenceModalBody');
                    
                header.innerHTML = `
                    <h5 class="modal-title">Changing Score for ${fileId}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                `;

                let template = '<form id="changeScore">';
                template += `
                    <div class="form-group">
                        <label for="scoreMessage">Comment</label>
                        <textarea class="form-control" id="scoreMessage" rows="3">Changed by admin</textarea>
                    </div>
                `
                    
                template += '<div class="modal-footer"><button type="submit" class="btn btn-outline-primary">Update score</button></div>'
                template += '</form>';
                body.innerHTML = template;
                document.getElementById('confluenceMainModal').style.display = "block";
                $("#confluenceMainModal").modal("show");
                addEventUpdateScore(fileId, selectedValue, consortium);

                // await createComment(fileId, submitMessage);
                
                // Store the new value as previous for next change
                this.setAttribute('data-previous-value', selectedValue);
                
                //console.log(`Selected ${selectedValue} for ${consortium} on file ${fileId}`);
                
                // Remove any existing badge classes
                this.className = 'form-select form-select-sm decision-dropdown';
                
                // Add styling based on selection
                if (selectedValue !== '--') {
                    this.classList.add(`badge-${selectedValue}`);
                }
            });
        });
        
        // Add event listeners for the custom accordion toggle buttons
        document.querySelectorAll('.accordion-toggle-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const targetId = this.getAttribute('data-bs-target');
                const isExpanded = this.getAttribute('aria-expanded') === 'true';
                
                // Toggle the icon
                if (isExpanded) {
                    this.querySelector('i').classList.replace('fa-chevron-down', 'fa-chevron-up');
                    this.setAttribute('aria-expanded', 'false');
                } else {
                    this.querySelector('i').classList.replace('fa-chevron-up', 'fa-chevron-down');
                    this.setAttribute('aria-expanded', 'true');
                }
            });
        });
    }
};

export const returnToChairs = () => {
    const returnChairs = async (e) => {
        e.preventDefault();
        const btn = document.activeElement;
        //console.log("return to chairs selected");
        var inputsChecked = document.querySelectorAll('.pl');
        
        if (inputsChecked.length === 0 || !Array.from(inputsChecked).some(cb => cb.checked)) {
            alert('Please select at least one file to return.');
            return;
        }
        
        // Show chair selection popup
        const header = document.getElementById("confluenceModalHeader");
        const body = document.getElementById("confluenceModalBody");
        
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
                    <input class="form-check-input" type="checkbox" value="${chair.consortium}" id="chair_${chair.consortium}">
                    <label class="form-check-label" for="chair_${chair.consortium}">
                        ${chair.consortium}
                    </label>
                </div>
            `;
        });
        
        template += `
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Return to Selected Chairs</button>
                </div>
            </form>
        `;
        
        body.innerHTML = template;
        $("#confluenceMainModal").modal("show");
        
        // Handle form submission
        document.getElementById('chairSelectionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const selectedChairs = Array.from(document.querySelectorAll('#chairSelectionForm input[type="checkbox"]:checked'))
                .map(cb => cb.value);
            
            if (selectedChairs.length === 0) {
                alert('Please select at least one chair.');
                return;
            }
            
            $("#confluenceMainModal").modal("hide");
            
            // Process the return for selected chairs
            for (var checkbox of inputsChecked) {
                if (checkbox.checked) {
                    for (const selectedConsortium of selectedChairs) {
                        const info = chairsInfo.find(object => object.consortium === selectedConsortium);
                        
                        let newBoxFiles = await getAllFilesRecursive(info.boxIdNew);
                        var itemFound = false;
                        
                        for (let item of newBoxFiles) {
                            if (item.name === checkbox.value) {
                                let createTask = await createCompleteTask(item.id, "Returning to complete your review");
                                let assignedTask = await assignTask(createTask.id, info.email);
                                //console.log("Found " + item.name + " in " + selectedConsortium);
                                itemFound = true;
                                break;
                            }
                        }
                        
                        if (!itemFound) {
                            let claraBoxFiles = await getAllFilesRecursive(info.boxIdClara);
                            for (let item of claraBoxFiles) {
                                if (item.name === checkbox.value) {
                                    let createTask = await createCompleteTask(item.id, "Returning to complete your review");
                                    let assignedTask = await assignTask(createTask.id, info.email);
                                    //console.log("Found " + item.name + " in " + selectedConsortium + " Clara folder");
                                    itemFound = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            
            btn.classList.toggle("buttonsubmit--loading");
            document.location.reload(true);
        });
    }
    
    const returnChairsButton = document.querySelector(`#returnChairs`);
    if (returnChairsButton) {
        returnChairsButton.addEventListener("click", returnChairs);
    }
};

// Returning submission to submitter
export const returnToSubmitter = () => {
    const returnSubmitter = async (e) => {
        e.preventDefault();
        const btn = document.activeElement;
        var inputsChecked = document.querySelectorAll('.pl');
        
        if (inputsChecked.length === 0 || !Array.from(inputsChecked).some(cb => cb.checked)) {
            alert('Please select at least one file to return.');
            return;
        }
        
        const header = document.getElementById("confluenceModalHeader");
        const body = document.getElementById("confluenceModalBody");
        
        // Get checked files
        const checkedFiles = Array.from(inputsChecked).filter(cb => cb.checked);
        
        header.innerHTML = `
            <h5 class="modal-title">Select Decision for File Return</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        `;
        
        let template = `
            <form id="decisionSelectionForm">
                <div class="form-group mb-3">
                    <h6>File to be returned:</h6>
                    <p><strong>${checkedFiles[0].value}</strong></p>
                    <h6>Select decision:</h6>
                    <div class="d-grid gap-2">
                        <button type="button" class="btn btn-success decision-btn" data-decision="Accepted">Accept: No comments from DACC</button>
                        <button type="button" class="btn btn-danger decision-btn" data-decision="Denied">Deny</button>
                        <button type="button" class="btn btn-warning decision-btn" data-decision="Requiring Input">Require Input</button>
                    </div>
                </div>
            </form>
        `;
        
        body.innerHTML = template;
        $("#confluenceMainModal").modal("show");
        
        // Handle decision button clicks
        document.querySelectorAll('.decision-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const decision = btn.dataset.decision;
                // Don't hide modal, just update it
                await processFileReturn(checkedFiles[0], decision);
            });
        });
    }
    
    const processFileReturn = async (checkbox, decision) => {
        const header = document.getElementById("confluenceModalHeader");
        const body = document.getElementById("confluenceModalBody");
        
        header.innerHTML = `
            <h5 class="modal-title">Processing File Return</h5>
        `;
        
        body.innerHTML = '<div id="returnToSubmitterInfo" style="max-height: 400px; overflow-y: auto;"></div>';
        
        const form = document.getElementById("returnToSubmitterInfo");
        const addStatus = (message) => {
            form.innerHTML += `<p>${message}</p>`;
            form.scrollTop = form.scrollHeight;
        };
        
        addStatus(`Starting process...`);
        addStatus(`Gathering data for Box file: ${checkbox.id}`);
        //console.log(checkbox.id);
        let fileSelected = await getFileInfo(checkbox.id);
        let fileName = fileSelected.name;
        let userFound = fileSelected.created_by.login;
        let submittedItems = await getFolderItems(returnToSubmitterFolder);
        let folderID = "none";
        let targetFolderId = "";

        // Check if user has a folder already
        for (let item of submittedItems.entries) {
            if (item.name === `The_Confluence_Project_Returned_Concepts-${userFound}`) {
                addStatus(`Folder already exists for: ${userFound}`);
                folderID = item.id;
                break;
            }
        }
        
        // Create parent folder and subfolders if needed
        if (folderID == "none") {
            addStatus(`Creating folder for user: ${userFound}`);
            const folderName = `The_Confluence_Project_Returned_Concepts-${userFound}`;
            const newFolder = await createFolder(returnToSubmitterFolder, folderName);
            folderID = newFolder.id;
            
            addStatus(`Creating subfolders...`);
            await createFolder(folderID, "Accepted");
            await createFolder(folderID, "Denied");
            await createFolder(folderID, "Requiring Input");
            
            addStatus(`Adding collaborator access...`);
            await addNewCollaborator(folderID, "folder", userFound, "viewer");
        }
        
        // Get the target subfolder
        addStatus(`Finding ${decision} folder...`);
        const subfolders = await getFolderItems(folderID);
        for (let subfolder of subfolders.entries) {
            if (subfolder.name === decision) {
                targetFolderId = subfolder.id;
                break;
            }
        }
        
        // If subfolder doesn't exist, create it
        if (!targetFolderId) {
            addStatus(`Creating ${decision} folder...`);
            const newSubfolder = await createFolder(folderID, decision);
            targetFolderId = newSubfolder.id;
        }
        
        addStatus(`Copying file to ${decision} folder...`);
        const cpFile = await copyFile(checkbox.id, targetFolderId, String(checkbox.id));
        console.log(cpFile);
        const cpFileId = cpFile.id;
        
        addStatus(`Copying comments...`);
        let returnComments = await listComments(checkbox.id);
        //console.log(returnComments);
        let commentsToCp = JSON.parse(returnComments).entries;
        //console.log(commentsToCp);
        await copyComments(commentsToCp, cpFileId);
        
        // Only search chair folders if decision is Accepted or Denied
        if (decision === "Accepted" || decision === "Denied") {
            for (let info of chairsInfo) {
                addStatus(`Searching chair folders for same file: ${info.consortium}`);
                let fileFound = false;
                
                let files = await getAllFilesRecursive(info.boxIdNew);
                for (let file of files.entries) {
                    if (file.name === fileName) {
                        fileFound = true;
                        addStatus(`Moving file to completed folder: ${info.consortium}`);
                        await moveFile(file.id, info.boxIdComplete);
                        break;
                    }
                }
                if (!fileFound) {
                    files = await getAllFilesRecursive(info.boxIdClara);
                    for (let file of files.entries) {
                        if (file.name === fileName) {
                            addStatus(`Moving file to completed folder: ${info.consortium}`);
                            fileFound = true;
                            await moveFile(file.id, info.boxIdComplete);
                            break;
                        }
                    }
                }
            }
            
            addStatus(`Moving file to completed folder...`);
            await moveFile(checkbox.id, completedFolder);
        }
        
        addStatus(`Preparing email for submitter: ${userFound}`);
        addStatus(`<strong style="color: green;">Complete!</strong>`);
        
        // Update header to show completion and add close button
        header.innerHTML = `
            <h5 class="modal-title">File Return Complete</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        `;
        
        body.innerHTML += `
            <div class="mt-3 text-center">
                <button type="button" class="btn btn-primary" id="sendEmailAndRefresh">Send Email & Refresh</button>
            </div>
        `;
        
        document.getElementById('sendEmailAndRefresh').addEventListener('click', () => {
            window.location.href = `mailto:${userFound}?subject=Confluence Submission Returned: ${fileName}&body=Your Confluence data access submission has been returned. Please review the comments at https://epidataplatforms.cancer.gov/confluence/#data_submissions`;
            setTimeout(() => {
                $("#confluenceMainModal").modal("hide");
                location.reload();
            }, 500);
        });
    };
    
    const returnSubmitterButton = document.querySelector(`#returnSubmitter`);
    if (returnSubmitterButton) {
        returnSubmitterButton.addEventListener("click", returnSubmitter);
    }
};



export const copyComments = async (comments, fileId) => {
    for (let chairs of chairsInfo) {
        let consortiumName = chairs.consortium;
        let chairComments = comments.filter(dt => dt.message.includes(`Consortium: ${consortiumName}`));
        
        for (let comment of chairComments) {
            let submitMessage = comment.message + ` Box Comment ID: ${comment.id}`;
            //console.log(submitMessage);
            await createComment(fileId, submitMessage);
        }
    }
};

export const testingDataGov = async () => {
  //console.log("testingDataLoaded")
  const testform = document.getElementById("submitID");
  testform.addEventListener("click", function(e) {
    e.preventDefault();
    dataGovTest();
  });
};

export const dataGovTest = async () => {
  //console.log("testing data gov test function");
  ///
  const responseData = csv2Json(await getFile(1932355916952)); // Get summary level data
  const lastModified = (await getFileInfo(1932355916952)).modified_at;

  const getCollaborators_Metadata = await getCollaboration(Confluence_Data_Platform_Metadata_Shared_with_Investigators, 'folders', 1000);
  const getCollaborators_Events = await getCollaboration(Confluence_Data_Platform_Events_Page_Shared_with_Investigators, 'folders', 1000);
  const getCollaborators_Upload = await getCollaboration(submitterFolder, 'folders', 1000);

  const pendingMetadataCollaborators = getCollaborators_Metadata.entries.filter(collab => collab.status === 'pending');
  //console.log('Pending Metadata Collaborators:', pendingMetadataCollaborators);
  //console.log(pendingMetadataCollaborators);

  // Check for specific email
  const targetEmail = 'wkc15@columbia.edu';
  const foundCollab = getCollaborators_Metadata.entries.find((collab, index) => {
    const email = collab.invite_email || (collab.accessible_by && collab.accessible_by.login);
    if (email === targetEmail) {
      //console.log(`Found ${targetEmail} at position ${index}:`, collab);
      return true;
    }
    return false;
  });
  
  if (!foundCollab) {
    //console.log(`${targetEmail} not found in getCollaborators_Metadata`);
  }

  const emailsInMetadata = getCollaborators_Metadata.entries.map(collab => {
    if (collab.accessible_by) return collab.accessible_by.login.toLowerCase();
    if (collab.invite_email) return collab.invite_email.toLowerCase();
    console.error('Error: Both accessible_by and invite_email are null for:', collab);
    return null;
  }).filter(email => email !== null);
  
  const emailsInEventsdata = getCollaborators_Events.entries.map(collab => {
    if (collab.accessible_by) return collab.accessible_by.login.toLowerCase();
    if (collab.invite_email) return collab.invite_email.toLowerCase();
    console.error('Error: Both accessible_by and invite_email are null for:', collab);
    return null;
  }).filter(email => email !== null);
  
  const emailsInUploaddata = getCollaborators_Upload.entries.map(collab => {
    if (collab.accessible_by) return collab.accessible_by.login.toLowerCase();
    if (collab.invite_email) return collab.invite_email.toLowerCase();
    console.error('Error: Both accessible_by and invite_email are null for:', collab);
    return null;
  }).filter(email => email !== null);

  const allEmails = responseData.data.map(user => user.Email.toLowerCase());
  //console.log(allEmails);

  // Metadata
  const includedEmailsMetadata = allEmails.filter(email => emailsInMetadata.includes(email));
  const notIncludedEmailsMetadata = allEmails.filter(email => !emailsInMetadata.includes(email));

  // Events
  const includedEmailsEvents = allEmails.filter(email => emailsInEventsdata.includes(email));
  const notIncludedEmailsEvents = allEmails.filter(email => !emailsInEventsdata.includes(email));

  // Upload
  const includedEmailsUpload = allEmails.filter(email => emailsInUploaddata.includes(email));
  const notIncludedEmailsUpload = allEmails.filter(email => !emailsInUploaddata.includes(email));

  // console.log('Metadata - Included:', includedEmailsMetadata);
  // console.log('Metadata - Not included:', notIncludedEmailsMetadata);
  // console.log('Events - Included:', includedEmailsEvents);
  // console.log('Events - Not included:', notIncludedEmailsEvents);
  // console.log('Upload - Included:', includedEmailsUpload);
  // console.log('Upload - Not included:', notIncludedEmailsUpload);

  // Show modal and add missing collaborators
  let successfulUpdate = '';
  let issueCount = 0;
  const header = document.getElementById("confluenceModalHeader");
  const body = document.getElementById("confluenceModalBody");
  header.innerHTML = `
      <h5 class="modal-title">Confirm Adding Collaborators</h5>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
  `;

  const hasUsersToAdd = notIncludedEmailsMetadata.length > 0 || notIncludedEmailsEvents.length > 0 || notIncludedEmailsUpload.length > 0;
  
  let confirmationList;
  if (hasUsersToAdd) {
    confirmationList = '<p><strong>The following users will be added:</strong></p>';
    for (const email of notIncludedEmailsMetadata) {
      confirmationList += `<p>User: ${email}, Folder: Metadata, Permission: viewer</p>`;
    }
    for (const email of notIncludedEmailsEvents) {
      confirmationList += `<p>User: ${email}, Folder: Events, Permission: viewer</p>`;
    }
    for (const email of notIncludedEmailsUpload) {
      confirmationList += `<p>User: ${email}, Folder: Upload, Permission: uploader</p>`;
    }
  } else {
    confirmationList = '<p>No users to be added</p>';
  }

  body.innerHTML = `
    <div style="height: ${Math.floor(window.innerHeight * 2/3)}px; overflow-y: auto; padding-right: 15px;">
      ${confirmationList}
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
      <button type="button" class="btn btn-primary" id="confirmAddCollaborators" ${!hasUsersToAdd ? 'disabled' : ''}>OK - Add Collaborators</button>
    </div>
  `;

  $("#confluenceMainModal").modal("show");

// Add event listener for confirmation
if (hasUsersToAdd) {
  document.getElementById("confirmAddCollaborators").addEventListener("click", async () => {
  body.innerHTML = '<div id="collaboratorList"><p>Adding collaborators...</p></div>';
  const listElement = document.getElementById("collaboratorList");
  
  // Add delay function and rate limiting
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  let requestCount = 0;
  
  // Add missing collaborators with rate limiting
  for (const email of notIncludedEmailsMetadata) {
    if (requestCount >= 50) {
      listElement.innerHTML += `<p>Rate limit reached, waiting 60 seconds...</p>`;
      await delay(60000);
      requestCount = 0;
    }
    listElement.innerHTML += `<p>Adding User: ${email}, Folder: Metadata, Permission: viewer</p>`;
    successfulUpdate = await addNewCollaborator(Confluence_Data_Platform_Metadata_Shared_with_Investigators, 'folder', email, 'viewer');
    requestCount++;
    if (successfulUpdate.status == '200') {
      listElement.innerHTML += `<p><span style="color: green;">Successful</span>: ${email}, Folder: Metadata, Permission: viewer</p>`;
    } else {
      listElement.innerHTML += `<p><span style="color: red;">Failed</span>: ${email}, Folder: Metadata, Permission: viewer</p>`;
      issueCount += 1;
    }
  }
  
  for (const email of notIncludedEmailsEvents) {
    if (requestCount >= 50) {
      listElement.innerHTML += `<p>Rate limit reached, waiting 60 seconds...</p>`;
      await delay(60000);
      requestCount = 0;
    }
    listElement.innerHTML += `<p>Adding User: ${email}, Folder: Events, Permission: previewer</p>`;
    successfulUpdate = await addNewCollaborator(Confluence_Data_Platform_Events_Page_Shared_with_Investigators, 'folder', email, 'previewer');
    requestCount++;
    if (successfulUpdate.status == '200') {
      listElement.innerHTML += `<p><span style="color: green;">Successful</span>: ${email}, Folder: Events, Permission: previewer</p>`;
    } else {
      listElement.innerHTML += `<p><span style="color: red;">Failed</span>: ${email}, Folder: Events, Permission: previewer</p>`;
      issueCount += 1;
    }
  }
  
  for (const email of notIncludedEmailsUpload) {
    if (requestCount >= 50) {
      listElement.innerHTML += `<p>Rate limit reached, waiting 60 seconds...</p>`;
      await delay(60000);
      requestCount = 0;
    }
    listElement.innerHTML += `<p>Adding User: ${email}, Folder: Upload, Permission: uploader</p>`;
    successfulUpdate = await addNewCollaborator(submitterFolder, 'folder', email, 'uploader');
    requestCount++;
    if (successfulUpdate.status == '200') {
      listElement.innerHTML += `<p><span style="color: green;">Successful</span>: ${email}, Folder: Upload, Permission: uploader</p>`;
    } else {
      listElement.innerHTML += `<p><span style="color: red;">Failed</span>: ${email}, Folder: Upload, Permission: uploader</p>`;
      issueCount += 1;
    }
  }
  
  //console.log(issueCount);
  if (issueCount > 0) {
    listElement.innerHTML += `<p><strong>${issueCount} issues detected. Please review list or try again.</strong></p>`;
  } else {
    listElement.innerHTML += '<p><strong>All collaborators added successfully!</strong></p>';
  }
  });
}



  ///
  document.getElementById("submitID").classList.toggle('buttonsubmit--loading');
  // let val = '0';
  // if(document.getElementById('folderID')) {
  //   val = document.getElementById('folderID').value
  // } else {
  //   val = dataPlatformDataFolder;
  // }
  // console.log(val);
  // const array = await getFolderInfo(val); //DCEG: 196554876811 BCRP: 145995765326, Confluence: 137304373658
  // if (!array) {
  //   document.getElementById("submitID").classList.toggle('buttonsubmit--loading');
  //   alert("Error: Please input a valid folder ID and check that you have the necessary permissions to access it.");
  //   return false;
  // }

  // let template =
  //   '<div class="card-body data-governance"><ul class="ul-list-style first-list-item collapsible-items p-0 m-0">';
  // const ID = array.id;
  // const consortiaName = array.name;
  // let type = array.type;
  // let liClass = type === "folder" ? "collapsible consortia-folder" : "";
  // let title = type === "folder" ? "Expand / Collapse" : "";
  // template += `<li class="collapsible-items">
  //           <button class="${liClass}" data-toggle="collapse" href="#toggle${ID}">
  //               <i title="${title}" data-type="${type}" data-id="${ID}" data-folder-name="${consortiaName}" data-status="pending" class="lazy-loading-spinner"></i>
  //           </button> ${consortiaName}
  //       </li>
  //       `;
  // template += `</ul></div></div>`;
  // document.getElementById("folderInput").innerHTML = template;
  // dataGovernanceLazyLoad();
  // dataGovernanceCollaboration();
  // document.getElementById("submitID").classList.toggle('buttonsubmit--loading');
  // return false;
}

export const dataGovernanceProjects = async () => {
  console.log("Event Clicked");
  const response = await getFolderItems(0);
  console.log(response);
  const projectArray = filterProjects(response.entries);
  console.log(projectArray);
  const div = document.getElementById("dataGovernanceProjects");
  let template = "";
  let checker = false;
  for (let obj = 0; obj < projectArray.length; obj++) {
    if (checker === false) {
      const bool = checkMyPermissionLevel(
        await getCollaboration(
          projectArray[obj].id,
          `${projectArray[obj].type}s`
        ),
        JSON.parse(localStorage.parms).login
      );
      if (bool === true) checker = true;
    }
  }
  if (checker === true) {
    for (let obj = 0; obj < projectArray.length; obj++) {
      const bool = checkMyPermissionLevel(
        await getCollaboration(
          projectArray[obj].id,
          `${projectArray[obj].type}s`
        ),
        JSON.parse(localStorage.parms).login
      );
      if (obj === 0)
        template += `<div class="card" style="border: 0px;"><div class="card-header">
                                            <label class="dataSummary-label">Project(s)</label>
                                        </div> 
                                        <div class="card-body data-governance">
                                            <ul class="ul-list-style first-list-item">`;
      if (bool === true) {
        const projectName = projectArray[obj].name;
        let type = projectArray[obj].type;
        let liClass = type === "folder" ? "collapsible consortia-folder" : "";
        let title = type === "folder" ? "Expand / Collapse" : "";
        template += `
                <li class="collapsible-items">
                    <button class="${liClass}" data-toggle="collapse" href="#toggle${projectArray[obj].id}">
                        <i title="${title}" data-folder-name="${projectName}" data-type="${type}" data-id="${projectArray[obj].id}" data-folder-name="${projectName}" data-status="pending" class="lazy-loading-spinner"></i>
                    </button> ${projectName}
                </li>
                `;
      }
      if (obj === projectArray.length - 1) template += `</ul></div></div>`;
    }
  }
  div.innerHTML = template;

  dataGovernanceLazyLoad();
};
export const dataGovernanceLazyLoad = (element) => {
  let spinners = document.getElementsByClassName("lazy-loading-spinner");
  if (element)
    spinners = element.parentNode.querySelectorAll(".lazy-loading-spinner");
  console.log(spinners);
  Array.from(spinners).forEach(async (element) => {
    const id = element.dataset.id;
    const status = element.dataset.status;
    const folderName = element.dataset.folderName;
    const type = element.dataset.type;
    if (type && JSON.parse(localStorage.parms).login && id !== "0") {
      const bool = await checkMyPermissionLevel(await getCollaboration(id, `${type}s`), JSON.parse(localStorage.parms).login, id, type);
      if (bool === true) {
        const button = document.createElement("button");
        button.dataset.dismiss = "modal";
        button.dataset.toggle = "modal";
        button.dataset.target = "#modalShareFolder";
        button.classList = ["share-folder"];
        button.dataset.permissionType = "restrict";
        button.dataset.folderId = id;
        button.title = "Manage collaboration";
        button.dataset.folderName = folderName;
        button.dataset.objectType = type;
        button.innerHTML = `<i class="fas fa-share"></i>`;
        element.parentNode.parentNode.appendChild(button);
        shareData(button);
      } else {
        element.dataset.sharable = "no";
      }
    }
    if (status !== "pending") return;
    let allEntries = (await getAllFilesRecursive(id)).entries;
    if (allEntries.length === 0) {
      element.classList = ["fas fa-exclamation-circle"];
      element.title = "Empty folder";
    }
    allEntries = allEntries.filter((dt) => dt.name !== "Study Documents");
    element.dataset.status = "complete";
    const entries = filterStudiesDataTypes(allEntries);
    const fileEntries = allEntries.filter((obj) => obj.type === "file");

    if (entries.length > 0) {
      const ul = document.createElement("ul");
      ul.classList = ["ul-list-style collapse"];
      ul.id = `toggle${id}`;

      for (const obj of entries) {
        const li = document.createElement("li");
        li.classList = ["collapsible-items"];
        let type = obj.type;
        let liClass = type === "folder" ? "collapsible consortia-folder" : "";
        let title = type === "folder" ? "Expand / Collapse" : "";
        li.innerHTML = `<button class="${liClass}" data-toggle="collapse" href="#toggle${
          obj.id
        }">
                    <i title="${title}" data-folder-name="${
          obj.name
        }" data-id="${obj.id}" ${
          element.dataset.sharable && element.dataset.sharable === "no"
            ? `data-sharable = "no"`
            : ``
        } data-status="pending" class="lazy-loading-spinner"></i>
                </button> ${obj.name}`;

        if (!element.dataset.sharable) {
          const button = document.createElement("button");
          button.dataset.dismiss = "modal";
          button.dataset.toggle = "modal";
          button.dataset.target = "#modalShareFolder";
          button.classList = ["share-folder"];
          button.dataset.folderId = obj.id;
          button.dataset.folderName = obj.name;
          button.dataset.objectType = type;
          button.title = "Manage collaboration";
          button.innerHTML = `<i class="fas fa-share"></i>`;
          li.appendChild(button);
          shareData(button);
        }
        ul.appendChild(li);
      }

      element.classList.remove("lazy-loading-spinner");
      element.classList.add("fas");
      element.classList.add("fa-folder-plus");
      element.parentNode.parentNode.appendChild(ul);
      eventsDataSubmissions(element.parentNode);
    } else if (fileEntries.length > 0) {
      const ul = document.createElement("ul");
      ul.classList = ["ul-list-style collapse"];
      ul.id = `toggle${id}`;

      for (const obj of fileEntries) {
        const li = document.createElement("li");
        li.classList = ["collapsible-items"];
        li.innerHTML = `<a>
                        <i title="file" data-folder-name="${
                          obj.name
                        }" data-id="${obj.id}" data-status="pending"${
          element.dataset.sharable && element.dataset.sharable === "no"
            ? `data-sharable = "no"`
            : ``
        } class="fas fa-file-alt"></i>
                        </a> <span title="${obj.name}">${
          obj.name.length > 20 ? `${obj.name.slice(0, 20)}...` : `${obj.name}`
        }</span>
                    `;

        if (!element.dataset.sharable) {
          const button1 = document.createElement("button");
          button1.dataset.toggle = "modal";
          button1.dataset.target = "#modalShareFolder";
          button1.classList = ["share-folder"];
          button1.dataset.folderId = obj.id;
          button1.dataset.folderName = obj.name;
          button1.dataset.objectType = obj.type;
          button1.title = "Manage collaboration";
          button1.innerHTML = `<i class="fas fa-share"></i>`;
          li.appendChild(button1);
          shareData(button1);

          const button2 = document.createElement("button");
          button2.dataset.toggle = "modal";
          button2.dataset.target = "#modalFileAccessStats";
          button2.classList = ["file-access-stats"];
          button2.dataset.fileId = obj.id;
          button2.dataset.fileName = obj.name;
          button2.dataset.objectType = obj.type;
          button2.title = "File access stats";
          button2.innerHTML = `<i class="fas fa-info-circle"></i>`;
          li.appendChild(button2);
          addEventFileStats(button2);
        }
        ul.appendChild(li);
      }

      element.classList.remove("lazy-loading-spinner");
      element.classList.add("fas");
      element.classList.add("fa-folder-plus");
      element.parentNode.parentNode.appendChild(ul);
      eventsDataSubmissions(element.parentNode);
    }
  });
};
export const eventsDataSubmissions = (element) => {
  element.addEventListener("click", (e) => {
    e.preventDefault();
    if (
      element.getElementsByClassName("fa-folder-minus").length > 0 &&
      element
        .getElementsByClassName("fa-folder-minus")[0]
        .classList.contains("fa-folder-minus")
    ) {
      element
        .getElementsByClassName("fa-folder-minus")[0]
        .classList.add("fa-folder-plus");
      element
        .getElementsByClassName("fa-folder-minus")[0]
        .classList.remove("fa-folder-minus");
    } else {
      element
        .getElementsByClassName("fa-folder-plus")[0]
        .classList.add("fa-folder-minus");
      element
        .getElementsByClassName("fa-folder-plus")[0]
        .classList.remove("fa-folder-plus");
      if (
        document.getElementsByClassName("lazy-loading-spinner").length !== 0
      ) {
        dataGovernanceLazyLoad(element);
      }
    }
  });
};

export const dataGovernanceCollaboration = () => {
  let consortiaFolder = document.getElementsByClassName("consortia-folder");
  Array.from(consortiaFolder).forEach((element) => {
    element.dispatchEvent(new Event("click"));
  });
};

export const shareData = (element) => {
  const btn1 = document.getElementById("addNewCollaborators");
  const folderToShare = document.getElementById("folderToShare");
  addEventAddNewCollaborator();
  addEventShowAllCollaborator();
  addEventShowExtCollaborator();
  element.addEventListener("click", () => {
    folderToShare.dataset.folderId = element.dataset.folderId;
    folderToShare.dataset.folderName = element.dataset.folderName;
    folderToShare.dataset.objectType = element.dataset.objectType;
    btn1.dispatchEvent(new Event("click"));
  });
};

export const addRenameFilesEvent = (files) => {
    const renameBtn = document.getElementById('renameFilesBtn');
    if (renameBtn) {
        renameBtn.addEventListener('click', () => {
            showRenameFilesPopup(files);
        });
    }
};

export const showRenameFilesPopup = (files) => {
    const header = document.getElementById("confluenceModalHeader");
    const body = document.getElementById("confluenceModalBody");
    
    header.innerHTML = `
        <h5 class="modal-title">Rename Files with Round Number</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    `;
    
    // Sort files by ID number
    const sortedFiles = [...files].sort((a, b) => {
        const idA = parseInt(a.id) || 0;
        const idB = parseInt(b.id) || 0;
        return idA - idB;
    });
    
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
        const currentTitle = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        const extension = file.name.split('.').pop(); // Get extension
        const newTitle = `${currentTitle}_RX_${String(index + 1).padStart(3, '0')}.${extension}`;
        template += `
            <div class="mb-2">
                <strong>Current:</strong> ${file.name}<br>
                <strong>New:</strong> <span id="preview${index}">${newTitle}</span>
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
    
    // Update preview when round number changes
    const roundInput = document.getElementById('roundNumber');
    roundInput.addEventListener('input', (e) => {
        const roundValue = e.target.value || 'X';
        sortedFiles.forEach((file, index) => {
            const currentTitle = file.name.replace(/\.[^/.]+$/, "");
            const extension = file.name.split('.').pop();
            const newTitle = `${currentTitle}_R${roundValue}_${String(index + 1).padStart(3, '0')}.${extension}`;
            document.getElementById(`preview${index}`).textContent = newTitle;
        });
    });
    
    // Handle form submission
    document.getElementById('renameFilesForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const roundNumber = document.getElementById('roundNumber').value;
        if (!roundNumber) {
            alert('Please enter a round number');
            return;
        }
        await renameFilesWithRound(sortedFiles, roundNumber);
        $("#confluenceMainModal").modal("hide");
    });
};

export const renameFilesWithRound = async (files, roundNumber) => {
    const header = document.getElementById("confluenceModalHeader");
    const body = document.getElementById("confluenceModalBody");
    
    header.innerHTML = `
        <h5 class="modal-title">Renaming Files...</h5>
    `;
    
    body.innerHTML = '<div id="renameProgress"><p>Starting file rename process...</p></div>';
    $("#confluenceMainModal").modal("show");
    
    const progressDiv = document.getElementById('renameProgress');
    
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const currentTitle = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
            const extension = file.name.split('.').pop(); // Get extension
            const newFileName = `${currentTitle}_R${roundNumber}_${String(i + 1).padStart(3, '0')}.${extension}`;
            
            progressDiv.innerHTML += `<p>Renaming: ${file.name} → ${newFileName}</p>`;
            
            // Rename file in submitter folder
            await boxUpdateFile(file.id, { name: newFileName });
            progressDiv.innerHTML += `<p style="color: green;">✓ Renamed in submitter folder: ${newFileName}</p>`;
            
            // Search and rename in each chair's folders
            for (const chair of chairsInfo) {
                const chairFolders = [chair.boxIdNew, chair.boxIdClara, chair.boxIdComplete];
                
                for (const folderId of chairFolders) {
                    const chairFiles = await getAllFilesRecursive(folderId);
                    const matchingFile = chairFiles.find(chairFile => chairFile.name === file.name);
                    
                    if (matchingFile) {
                        await boxUpdateFile(matchingFile.id, { name: newFileName });
                        progressDiv.innerHTML += `<p style="color: blue;">✓ Renamed in ${chair.consortium} folder: ${newFileName}</p>`;
                    }
                }
            }
        }
        
        progressDiv.innerHTML += '<p><strong>All files renamed successfully!</strong></p>';
        progressDiv.innerHTML += '<div class="modal-footer"><button type="button" class="btn btn-primary" data-bs-dismiss="modal" onclick="location.reload()">Close & Refresh</button></div>';
        
    } catch (error) {
        progressDiv.innerHTML += `<p style="color: red;">Error: ${error.message}</p>`;
        progressDiv.innerHTML += '<div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button></div>';
    }
};

export const addFields = (id, bool) => {
  let template = "";
  template += `
    <div class="form-group col-lg-9">
        <textarea id="shareFolderEmail${id}" required class="form-control" placeholder="Enter comma separated email addresses" require  rows="2"></textarea>
    </div>
    <div class="form-group col-lg-3">
    <select class="form-control" required id="folderRole${id}">
        <option value=""> -- Select role -- </option>
    `;

  if (bool) template += `<option value="viewer">Viewer</option>`;
  else {
    for (let key in boxRoles) {
      template += `<option value="${key}">${key}</option>`;
    }
  }

  template += `</select></div>`;
  return template;
};
