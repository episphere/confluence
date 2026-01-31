import { showComments, getFolderItems, filterStudiesDataTypes, filterConsortiums, hideAnimation, checkDataSubmissionPermissionLevel, getCollaboration, getFile, tsv2Json, getFolderInfo, getAllFilesRecursive, listComments, downloadFile } from "../shared.js";
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
            return await categorizeFilesByFolderStructure(userFolder.id);
        }
    } catch {
        // No access to Return_to_Submitter, check root folder
        const rootItems = await getFolderItems(0);
        const returnFolder = rootItems.entries.find(item => 
            item.type === 'folder' && item.name.startsWith('The_Confluence_Project_Returned_Concepts')
        );
        
        if (returnFolder) {
            return await categorizeFilesByFolderStructure(returnFolder.id);
        }
    }
    
    return { needinput: [], accepted: [], declined: [] };
};

export const categorizeFilesByFolderStructure = async (rootFolderId) => {
    const categorized = {
        needinput: [],
        accepted: [],
        declined: []
    };
    
    const rootItems = await getFolderItems(rootFolderId);
    console.log('Root Items:', rootItems);
    for (const item of rootItems.entries) {
        console.log(item);
        if (item.type === 'folder') {
            const folderName = item.name.toLowerCase();
            console.log(folderName);
            const folderFiles = await getAllFilesRecursive(item.id);
            
            if (folderName.includes('requiring input')) {
                console.log("requires input");
                categorized.needinput.push(...folderFiles);
            } else if (folderName.includes('accepted')) {
                console.log("Accepted");
                categorized.accepted.push(...folderFiles);
            } else if (folderName.includes('denied') || folderName.includes('rejected')) {
                console.log("Denied/Rejected");
                categorized.declined.push(...folderFiles);
            }
        }
    }
    
    console.log(categorized);
    return categorized;
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
    const element = document.getElementById(`${tab}selectedDoc`);
    if (element) {
        element.addEventListener("change", (e) => {
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
    }
};

export const dataSubmissionForm = async () => {
    const categorizedEntries = await getReturnedConcepts();
    console.log('Categorized Entries:', categorizedEntries);

    const totalFiles = categorizedEntries.needinput.length + categorizedEntries.accepted.length + categorizedEntries.declined.length;
    let message = JSON.parse(localStorage.parms).name + "'s Concepts Returned";
    
    if (totalFiles <= 0) {
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
                                    Concepts Requiring Input (${categorizedEntries.needinput.length})
                                </a>
                            </li>
                            <li class='nav-item' role='presentation'>
                                <a class='nav-link' id='acceptedTab' href='#accepted' data-mdb-toggle="tab" role='tab' aria-controls='accepted' aria-selected='true'>
                                    Concepts Accepted (${categorizedEntries.accepted.length})
                                </a>
                            </li>
                            <li class='nav-item' role='presentation'>
                                <a class='nav-link' id='declinedTab' href='#declined' data-mdb-toggle="tab" role='tab' aria-controls='declined' aria-selected='true'>
                                    Concepts Rejected (${categorizedEntries.declined.length})
                                </a>
                            </li>
                        </ul>
                        <div class="tab-content" id="selectedTab">
        `;
    
        template += `
            <div class='tab-pane fade show active' id='needinput' role='tabpanel' aria-labeledby='needinputTab'>
                <button id='downloadCommentsBtn' class='btn btn-secondary mb-3' style='float: right; margin-right: 10px;'>Download Comments for Offline Response</button>
        `;
        
        template += renderFilePreviewDropdown(categorizedEntries.needinput, "needinput", true);
    
        template += `
            <div class='tab-pane fade' id='accepted' role='tabpanel' aria-labeledby='acceptedTab'>
        `;
        
        template += renderFilePreviewDropdown(categorizedEntries.accepted, "accepted", true);
    
        template += `
            <div class='tab-pane fade' id='declined' role='tabpanel' aria-labeledby='declinedTab'>
        `;

        template += renderFilePreviewDropdown(categorizedEntries.declined, "declined", true);
        
        template += `<div id='filePreview'>`;

        if (totalFiles !== 0) {
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

    if (categorizedEntries.needinput.length > 0) {
        showPreviewInPane(categorizedEntries.needinput[0].id);
        showComments(categorizedEntries.needinput[0].id);
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
        categorizedEntries.needinput
    );
    switchTabsDataSubmission(
        "accepted",
        ["needinput", 'declined'],
        categorizedEntries.accepted
    );
    switchTabsDataSubmission(
        "declined",
        ["needinput", 'accepted'],
        categorizedEntries.declined
    );
    
    // Set up file switching for all tabs
    switchFilesWithResponse("accepted");
    switchFilesWithResponse("declined");

    // Set up download comments functionality
    setupDownloadComments(categorizedEntries.needinput);

    document.getElementById("needinputTab").click();
    document.getElementById("needinputselectedDoc").children[0].selected = true;
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
        const [commentsResponse, originalFileResponse] = await Promise.all([
            listComments(fileId),
            downloadFile(fileId)
        ]);
        
        const comments = JSON.parse(commentsResponse).entries;
        const originalBlob = await originalFileResponse.blob();
        
        // Read Word document using docx library
        const arrayBuffer = await originalBlob.arrayBuffer();
        let originalContent = '';
        
        try {
            if (window.mammoth) {
                const result = await window.mammoth.convertToHtml({arrayBuffer: arrayBuffer});
                originalContent = result.value;
            } else {
                throw new Error('Mammoth.js not available');
            }
        } catch (docxError) {
            console.warn('Could not parse as Word document:', docxError);
            originalContent = '<p>Could not extract Word document content. Please refer to the original file.</p>';
        }
        
        // Create merged document
        let mergedContent = `<html><head><meta charset="utf-8"><title>Document with Comments</title>
        <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; }
        h1 { font-size: 14pt; }
        h2 { font-size: 13pt; }
        h3 { font-size: 12pt; }
        p, div { font-size: 12pt; }
        </style>
        </head><body>`;
        
        // Add original document content
        mergedContent += `<div style="border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px;">`;
        mergedContent += `<h1>Original Document</h1>`;
        mergedContent += `<div style="line-height: 1.6;">${originalContent}</div>`;
        mergedContent += `</div>`;
        
        // Add comments section
        mergedContent += `<div>`;
        mergedContent += `<h1>Comments Requiring Response</h1>`;
        mergedContent += `<p><strong>File ID:</strong> ${fileId}</p>`;
        
        if (comments.length === 0) {
            mergedContent += `<p>No comments found.</p>`;
        } else {
            comments.forEach((comment, index) => {
                const commentDate = new Date(comment.created_at);
                const date = commentDate.toLocaleDateString();
                const time = commentDate.toLocaleTimeString();
                
                mergedContent += `<div style="margin-bottom: 30px; border: 1px solid #ccc; padding: 15px; page-break-inside: avoid;">`;
                mergedContent += `<h3>Comment ${index + 1}</h3>`;
                mergedContent += `<p><strong>From:</strong> ${comment.created_by.name}</p>`;
                mergedContent += `<p><strong>Date:</strong> ${date} at ${time}</p>`;
                mergedContent += `<p><strong>Comment:</strong></p>`;
                mergedContent += `<div style="background-color: #f5f5f5; padding: 10px; margin: 10px 0;">${comment.message}</div>`;
                mergedContent += `<p><strong>Your Response:</strong></p>`;
                mergedContent += `<div style="border: 1px solid #ddd; min-height: 100px; padding: 10px; background-color: white;"></div>`;
                mergedContent += `</div>`;
            });
        }
        
        mergedContent += `</div></body></html>`;
        
        // Download single merged file
        const mergedBlob = new Blob([mergedContent], { type: 'application/msword' });
        const mergedUrl = URL.createObjectURL(mergedBlob);
        const mergedLink = document.createElement('a');
        mergedLink.href = mergedUrl;
        mergedLink.download = `document-with-comments-${fileId}.doc`;
        document.body.appendChild(mergedLink);
        mergedLink.click();
        document.body.removeChild(mergedLink);
        URL.revokeObjectURL(mergedUrl);
        
        alert('Single document with original content and comments has been downloaded.');
        
    } catch (error) {
        console.error('Error downloading merged document:', error);
        alert('Error downloading document. Please try again.');
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