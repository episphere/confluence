import { showComments, getFolderItems, filterStudiesDataTypes, filterConsortiums, hideAnimation, checkDataSubmissionPermissionLevel, getCollaboration, getFile, tsv2Json, getFolderInfo, getAllFilesRecursive, listComments } from "../shared.js";
import { uploadInStudy } from "../components/modal.js";
import { renderFilePreviewDropdown, viewFinalDecisionFilesTemplate } from "../pages/chairmenu.js";
import { showPreview } from "../components/boxPreview.js";
import { switchTabsDataSubmission, switchFiles, sortTableByColumn, addEventUpdateScore } from "../event.js";

const Return_to_Submitter = 200908340220;

export const getReturnedConcepts = async () => {
    const userEmail = JSON.parse(localStorage.parms).login;
    
    try {
        // Check if user has access to Return_to_Submitter folder
        await getFolderInfo(Return_to_Submitter);
        
        // Look for folder ending with user's email
        const items = await getFolderItems(Return_to_Submitter);
        const userFolder = items.entries.find(item => 
            item.type === 'folder' && item.name.endsWith(userEmail)
        );
        
        if (userFolder) {
            return await getAllFilesRecursive(userFolder.id);
        }
    } catch {
        // No access to Return_to_Submitter, check root folder
        const rootItems = await getFolderItems(0);
        const returnFolder = rootItems.entries.find(item => 
            item.type === 'folder' && item.name.startsWith('The_Confluence_Project_Returned_Concepts')
        );
        
        if (returnFolder) {
            return await getAllFilesRecursive(returnFolder.id);
        }
    }
    
    return { entries: [] };
};

export const showCommentsInPane = (fileId, tabName = '') => {
    const commentsContainer = document.getElementById('fileComments');
    if (commentsContainer) {
        commentsContainer.innerHTML = '';
        showComments(fileId);
        console.log("Comments shown");
        // Move comments from default location to our pane
        setTimeout(() => {
            const defaultComments = document.querySelector('[id*="Comments"]');
            if (defaultComments && defaultComments.id !== 'fileComments') {
                commentsContainer.innerHTML = defaultComments.innerHTML;
                defaultComments.innerHTML = '';
            }
            
            // Add input boxes for needinput tab only
            if (tabName === 'needinput') {
                console.log('Adding response inputs');
                addResponseInputs();
            }
        }, 100);
    }
};

export const addResponseInputs = () => {
    const commentsContainer = document.getElementById('fileComments');
    if (commentsContainer) {
        // Wait a bit more for comments to fully load
        setTimeout(() => {
            // Find all comment divs and add one response input per comment
            const commentDivs = commentsContainer.querySelectorAll('.comment');
            
            commentDivs.forEach((commentDiv) => {
                // Check if response input already exists
                if (!commentDiv.querySelector('.response-input-container')) {
                    const responseInput = document.createElement('div');
                    responseInput.className = 'response-input-container';
                    responseInput.innerHTML = `
                        <div class="mt-2 p-2 border-top">
                            <small class="text-muted">Response:</small>
                            <textarea class="form-control mt-1" placeholder="Type your response..." rows="2"></textarea>
                            <button class="btn btn-sm btn-primary mt-1">Submit Response</button>
                        </div>
                    `;
                    commentDiv.appendChild(responseInput);
                }
            });
            
            // If no comments found, add a general response area
            if (commentDivs.length === 0) {
                commentsContainer.innerHTML += `
                    <div class="mt-3 p-2 border">
                        <h6>Add Response</h6>
                        <textarea class="form-control" placeholder="Type your response..." rows="3"></textarea>
                        <button class="btn btn-primary mt-2">Submit Response</button>
                    </div>
                `;
            }
        }, 500);
    }
};

export const showPreviewInPane = (fileId) => {
    showPreview(fileId, 'boxFilePreview');
    // Force the preview container to respect Bootstrap grid
    setTimeout(() => {
        const previewContainer = document.getElementById('boxFilePreview');
        if (previewContainer) {
            previewContainer.style.maxWidth = '66.666667%'; // col-8 width
            previewContainer.style.flex = '0 0 66.666667%';
        }
    }, 100);
};

export const switchFilesWithResponse = (tab) => {
    document.getElementById(`${tab}selectedDoc`).addEventListener("change", (e) => {
        const file_id = e.target.value;
        showPreviewInPane(file_id);
        showComments(file_id);
        
        // Add response inputs if on needinput tab
        if (tab === 'needinput') {
            setTimeout(() => {
                addResponseInputs();
            }, 300);
        }
    });
};

export const dataSubmissionForm = async () => {
    const response = await getReturnedConcepts();
    console.log('Returned Concepts:', response);

    let entries = response//.entries.map(item => item.id);

    let message = JSON.parse(localStorage.parms).name + "'s Concepts Returned";
    
    if (response.length <= 0) {
        hideAnimation();
        return `
            <div class="general-bg padding-bottom-1rem">
                <div class="container body-min-height">
                    <div class="main-summary-row">
                        <div class="align-left">
                            <h1 class="page-header">Data Submitted</h1>
                        </div>
                    </div>
                    <div class="data-submission div-border font-size-18" style="padding-left: 1rem;">
                        No folder found for Returned Concepts
                    </div>
                </div>
            </div>
        `;
    };
    
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
                                <a class='nav-link' id='needinputTab' href='#needinput' data-mdb-toggle="tab" role='tab' aria-controls='needinput' aria-selected='true'>
                                    Concepts Requiring Input
                                </a>
                            </li>
                            <li class='nav-item' role='presentation'>
                                <a class='nav-link' id='acceptedTab' href='#accepted' data-mdb-toggle="tab" role='tab' aria-controls='accepted' aria-selected='true'>
                                    Concepts Accepted
                                </a>
                            </li>
                            <li class='nav-item' role='presentation'>
                                <a class='nav-link' id='declinedTab' href='#declined' data-mdb-toggle="tab" role='tab' aria-controls='declined' aria-selected='true'>
                                    Concepts Rejected
                                </a>
                            </li>
                        </ul>
                        <div class="tab-content" id="selectedTab">
        `;
    
        template += `
            <div class='tab-pane fade show active' id='needinput' role='tabpanel' aria-labeledby='needinputTab'>
                <button id='downloadCommentsBtn' class='btn btn-secondary mb-3' style='float: right; margin-right: 10px;'>Download Comments for Offline Response</button>
        `;
        
        template += renderFilePreviewDropdown(entries, "needinput", true);
    
        template += `
            <div class='tab-pane fade' id='accepted' role='tabpanel' aria-labeledby='acceptedTab'>
        `;
        
        template += renderFilePreviewDropdown(entries, "accepted", true);
    
        template += `
            <div class='tab-pane fade' id='declined' role='tabpanel' aria-labeledby='declinedTab'>
        `;

        template += renderFilePreviewDropdown(entries, "declined", true);
        
        template += `<div id='filePreview'>`;

        if (entries.length !== 0) {
            template += `
                <div class='row'>
                    <div id='boxFilePreview' class="col-8 preview-container"></div>
                    <div id='fileComments' class='col-4 mt-2'></div>
                </div>
            `;
        }
        
        template += `
            </div>
        </div>
        `;
    document.getElementById("dataSubmissionFileView").innerHTML = template;
    //viewFinalDecisionFilesTemplate(entries);

    // commentSubmit();
    
    // downloadAll('recommendation', entries)
    // downloadAll('conceptNeedingClarification', entries)
    console.log(entries);
    if (!!entries.length) {
        showPreviewInPane(entries[0].id);
        showComments(entries[0].id);
        setTimeout(() => {
            addResponseInputs(); // Add response inputs for initial load
        }, 300);
        switchFilesWithResponse("needinput");
        document.getElementById("needinputselectedDoc").children[0].selected = true;
    } else {
        document.getElementById("filePreview").classList.remove("d-block");
        document.getElementById("filePreview").classList.add("d-None");
    }

    switchTabsDataSubmission(
        "needinput",
        ["accepted", 'declined'],
        entries
    );
    switchTabsDataSubmission(
        "accepted",
        ["needinput", 'declined'],
        entries
    );
    switchTabsDataSubmission(
        "declined",
        ["needinput", 'accepted'],
        entries
    );
    
    // Set up file switching for all tabs
    switchFilesWithResponse("accepted");
    switchFilesWithResponse("declined");

    // Set up download comments functionality
    setupDownloadComments(entries);

    document.getElementById("needinputTab").click();
};

export const setupDownloadComments = (entries) => {
    const downloadBtn = document.getElementById('downloadCommentsBtn');
    if (downloadBtn && entries.length > 0) {
        downloadBtn.addEventListener('click', async () => {
            const selectedFileId = document.getElementById('needinputselectedDoc').value;
            if (selectedFileId) {
                await downloadCommentsAsWord(selectedFileId);
            }
        });
    }
};

export const downloadCommentsAsWord = async (fileId) => {
    try {
        const response = await listComments(fileId);
        const comments = JSON.parse(response).entries;
        
        let docContent = `<html><head><meta charset="utf-8"><title>Comments for Response</title></head><body>`;
        docContent += `<h1>Comments Requiring Response</h1>`;
        docContent += `<p><strong>File ID:</strong> ${fileId}</p>`;
        docContent += `<hr>`;
        
        if (comments.length === 0) {
            docContent += `<p>No comments found.</p>`;
        } else {
            comments.forEach((comment, index) => {
                const commentDate = new Date(comment.created_at);
                const date = commentDate.toLocaleDateString();
                const time = commentDate.toLocaleTimeString();
                
                docContent += `<div style="margin-bottom: 30px; border: 1px solid #ccc; padding: 15px;">`;
                docContent += `<h3>Comment ${index + 1}</h3>`;
                docContent += `<p><strong>From:</strong> ${comment.created_by.name}</p>`;
                docContent += `<p><strong>Date:</strong> ${date} at ${time}</p>`;
                docContent += `<p><strong>Comment:</strong></p>`;
                docContent += `<div style="background-color: #f5f5f5; padding: 10px; margin: 10px 0;">${comment.message}</div>`;
                docContent += `<p><strong>Your Response:</strong></p>`;
                docContent += `<div style="border: 1px solid #ddd; min-height: 100px; padding: 10px; background-color: white;"></div>`;
                docContent += `</div>`;
            });
        }
        
        docContent += `</body></html>`;
        
        const blob = new Blob([docContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comments-response-${fileId}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Error downloading comments:', error);
        alert('Error downloading comments. Please try again.');
    }
};

export const dataSubmissionTemplate = () => {
    const userEmail = JSON.parse(localStorage.parms).login;
    
    let template = `
        <div class="general-bg body-min-height padding-bottom-1rem">
            <div id="dataSubmissionFileView" class="align-left"></div>
        </div>
    `;

    return template;
};

// export const lazyload = (element) => {
//     let spinners = document.getElementsByClassName('lazy-loading-spinner');
//     if (element) spinners = element.parentNode.querySelectorAll('.lazy-loading-spinner');
//     Array.from(spinners).forEach(async element => {
//         const id = element.dataset.id;
//         const status = element.dataset.status;
//         if (status !== 'pending') return;
        
//         let allEntries = (await getFolderItems(id)).entries;
//         if (allEntries.length === 0) {
//             element.classList = ['fas fa-exclamation-circle'];
//             element.title = 'Empty folder'
//         }
//         allEntries = allEntries.filter(dt => dt.name !== 'Study Documents');
        
//         element.dataset.status = 'complete';
        
//         const entries = filterStudiesDataTypes(allEntries);
//         const fileEntries = allEntries.filter(obj => obj.type === 'file');
        
//         if (entries.length > 0) {
//             const ul = document.createElement('ul');
//             ul.classList = ['ul-list-style collapse'];
//             ul.id = `toggle${id}`

//             for (const obj of entries) {
//                 const li = document.createElement('li');
//                 li.classList = ['collapsible-items'];
//                 let type = obj.type;
//                 let liClass = type === 'folder' ? 'collapsible consortia-folder' : '';
//                 let title = type === 'folder' ? 'Expand / Collapse' : '';
                
//                 li.innerHTML = `
//                     <button class="${liClass}" data-toggle="collapse" href="#toggle${obj.id}">
//                         <i title="${title}" data-id="${obj.id}" data-folder-name="${obj.name}" data-status="pending" class="lazy-loading-spinner"></i>
//                     </button> 
//                     ${obj.name}
//                     <a href="https://nih.app.box.com/${type === 'folder' ? 'folder' : 'file'}/${obj.id}" target="_blank" rel="noopener noreferrer" title="Open ${obj.type}">
//                         <i class="fas fa-external-link-alt"></i>
//                     </a>
//                 `;
                
//                 ul.appendChild(li);
//             }

//             element.classList.remove('lazy-loading-spinner');
//             element.classList.add('fas');
//             element.classList.add('fa-folder-plus');
//             element.parentNode.parentNode.appendChild(ul);
//             dataSubmission(element.parentNode);
//         }
//         else if (fileEntries.length > 0) {
//             const ul = document.createElement('ul');
//             ul.classList = ['ul-list-style collapse'];
//             ul.id = `toggle${id}`

//             for (const obj of fileEntries) {
//                 const li = document.createElement('li');
//                 li.classList = ['collapsible-items'];
                
//                 li.innerHTML = `
//                     <a>
//                         <i title="files" data-id="${obj.id}" data-status="pending" class="fas fa-file-alt"></i>
//                     </a> 
//                     ${obj.name}
//                     <a href="https://nih.app.box.com/${obj.type === 'folder' ? 'folder' : 'file'}/${obj.id}" target="_blank" rel="noopener noreferrer" title="Open ${obj.type}">
//                         <i class="fas fa-external-link-alt"></i>
//                     </a>
//                 `;
                
//                 ul.appendChild(li);
//             }

//             element.classList.remove('lazy-loading-spinner');
//             element.classList.add('fas');
//             element.classList.add('fa-folder-plus');
//             element.parentNode.parentNode.appendChild(ul);
//             dataSubmission(element.parentNode);
//         }
//     });
// };

// export const dataSubmission = (element) => {
//     element.addEventListener('click', e => {
//         e.preventDefault();
        
//         if (element.getElementsByClassName('fa-folder-minus').length > 0 && element.getElementsByClassName('fa-folder-minus')[0].classList.contains('fa-folder-minus')) {
//             element.getElementsByClassName('fa-folder-minus')[0].classList.add('fa-folder-plus');
//             element.getElementsByClassName('fa-folder-minus')[0].classList.remove('fa-folder-minus');
//         } else {
//             element.getElementsByClassName('fa-folder-plus')[0].classList.add('fa-folder-minus');
//             element.getElementsByClassName('fa-folder-plus')[0].classList.remove('fa-folder-plus');
            
//             if (document.getElementsByClassName('lazy-loading-spinner').length !== 0) {
//                 lazyload(element);
//             }
//         }
//     });
// };