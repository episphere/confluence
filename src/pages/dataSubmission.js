import { getFileInfo, returnToSubmitterFolder, showComments, showCommentsSub, getFolderItems, filterStudiesDataTypes, filterConsortiums, hideAnimation, checkDataSubmissionPermissionLevel, getCollaboration, getFile, tsv2Json, getFolderInfo, getAllFilesRecursive, listComments, downloadFile, createComment, emailsAllowedToUpdateData } from "../shared.js";
import { uploadInStudy } from "../components/modal.js";
import { renderFilePreviewDropdown, viewFinalDecisionFilesTemplate } from "../pages/chairmenu.js";
import { showPreview } from "../components/boxPreview.js";
import { switchTabsDataSubmission, switchFiles, sortTableByColumn, addEventUpdateScore } from "../event.js";

export const getReturnedConcepts = async () => {
    const userEmail = JSON.parse(localStorage.parms).login;
    
    try {
        // Check if user has access to returnToSubmitterFolder folder
        await getFolderInfo(returnToSubmitterFolder);
        
        // Look for folder ending with user's email
        const items = await getFolderItems(returnToSubmitterFolder);
        const userFolder = items.entries.find(item => 
            item.type === 'folder' && item.name.endsWith(userEmail)
        );
        
        if (userFolder) {
            return await categorizeFilesByFolderStructure(userFolder.id, userEmail);
        }
    } catch {
        // No access to returnToSubmitterFolder, check root folder
        const rootItems = await getFolderItems(0);
        const returnFolder = rootItems.entries.find(item => 
            item.type === 'folder' && item.name.startsWith('The_Confluence_Project_Returned_Concepts')
        );
        
        if (returnFolder) {
            return await categorizeFilesByFolderStructure(returnFolder.id, userEmail);
        }
    }
    
    return { needinput: [], accepted: [], declined: [] };
};

export const categorizeFilesByFolderStructure = async (rootFolderId, userEmail) => {
    const categorized = {
        needinput: [],
        accepted: [],
        declined: []
    };
    
    const rootItems = await getFolderItems(rootFolderId);
    // console.log('Root Items:', rootItems);
    for (const item of rootItems.entries) {
        // console.log(item);
        if (item.type === 'folder') {
            const folderName = item.name.toLowerCase();
            // console.log(folderName);
            const folderFiles = await getAllFilesRecursive(item.id);
            
            if (folderName.includes('requiring input')) {
                // console.log("requires input");
                categorized.needinput.push(...folderFiles);
            } else if (folderName.includes('accepted')) {
                // console.log("Accepted");
                categorized.accepted.push(...folderFiles);
            } else if (folderName.includes('denied') || folderName.includes('rejected')) {
                // console.log("Denied/Rejected");
                categorized.declined.push(...folderFiles);
            }
        }
    }
    
    // console.log(categorized);
    return categorized;
};

export const showCommentsInPane = (fileId, tabName = '') => {
    const commentsContainer = document.getElementById('fileComments');
    if (commentsContainer) {
        commentsContainer.innerHTML = '';
        showCommentsSub(fileId);
        // console.log("Comments shown");
        // Move comments from default location to our pane
        setTimeout(() => {
            const defaultComments = document.querySelector('[id*="Comments"]');
            if (defaultComments && defaultComments.id !== 'fileComments') {
                commentsContainer.innerHTML = defaultComments.innerHTML;
                defaultComments.innerHTML = '';
            }
            
            // Add input boxes for needinput tab only
            if (tabName === 'needinput') {
                // console.log('Adding response inputs');
                addResponseInputs();
            }
        }, 100);
    }
};

export const addResponseInputs = async () => {
    const commentsContainer = document.getElementById('fileComments');
    if (commentsContainer) {
        // Wait a bit more for comments to fully load
        setTimeout(async () => {
            const fileId = document.getElementById('needinputselectedDoc').value;
            const userEmail = JSON.parse(localStorage.parms).login;
            
            // Check if user has already commented
            const commentsResponse = await listComments(fileId);
            const comments = JSON.parse(commentsResponse).entries;
            const isAllowedUser = emailsAllowedToUpdateData.includes(userEmail);
            const userHasCommented = !isAllowedUser && comments.some(comment => comment.created_by.login === userEmail);
            
            // Find all comment divs and add one response input per comment
            const commentDivs = commentsContainer.querySelectorAll('.comment');
            let responsesAdded = 0;
            
            commentDivs.forEach((commentDiv) => {
                // Check if response input already exists
                if (!commentDiv.querySelector('.response-input-container')) {
                    // Get comment text to check rating
                    const commentText = commentDiv.textContent || commentDiv.innerText;
                    const ratingMatch = commentText.match(/Rating:\s*(\w+)/i);
                    const rating = ratingMatch ? ratingMatch[1] : null;
                    // console.log(commentText);
                    // Add response box unless rating is specifically "1" or "NA"
                    const shouldAddResponse = !rating || (rating !== '1' && rating.toUpperCase() !== 'NA');
                    
                    if (shouldAddResponse) {
                        const responseInput = document.createElement('div');
                        responseInput.className = 'response-input-container';
                        responseInput.innerHTML = `
                            <div class="mt-2 p-3 border rounded" style="background-color: #f1f3f4; border-left: 4px solid #007bff;">
                                <small class="text-muted font-weight-bold">Your Response to the above comment:</small>
                                <textarea class="form-control mt-2 comment-response" placeholder="Type your response..." rows="2" ${userHasCommented ? 'disabled' : ''}></textarea>
                            </div>
                            <hr class="mt-3">
                        `;
                        commentDiv.appendChild(responseInput);
                        responsesAdded++;
                    } else {
                        // Add separator line after comments without response boxes
                        const separator = document.createElement('hr');
                        separator.className = 'mt-3';
                        commentDiv.appendChild(separator);
                    }
                }
            });
            
            // Add single submit button at the bottom if there are response boxes
            if (responsesAdded > 0 && !document.getElementById('submitResponsesContainer').querySelector('.submit-all-responses')) {
                const submitButton = document.createElement('div');
                submitButton.className = 'submit-all-responses text-center';
                submitButton.innerHTML = `
                    ${userHasCommented ? '<p class="text-danger">Comments have already been responded to.</p>' : '<p class="text-danger" id="validationWarning" style="display: none;">Please respond to all required comments before continuing.</p>'}
                    <button class="buttonsubmit button-glow-red" id="submitAllResponsesBtn" ${userHasCommented ? 'disabled' : 'disabled'}><span class="buttonsubmit__text">Submit All Responses</span></button>
                `;
                document.getElementById('submitResponsesContainer').appendChild(submitButton);
                
                // Add validation function
                if (!userHasCommented) {
                    const validateResponses = () => {
                        const commentDivs = document.getElementById('fileComments').querySelectorAll('.comment');
                        const responseTextareas = Array.from(commentDivs).map(div => div.querySelector('.comment-response')).filter(textarea => textarea !== null);
                        const allFilled = responseTextareas.every(textarea => textarea.value.trim() !== '');
                        
                        const submitBtn = document.getElementById('submitAllResponsesBtn');
                        const warning = document.getElementById('validationWarning');
                        
                        if (allFilled) {
                            submitBtn.disabled = false;
                            submitBtn.style.opacity = '1';
                            warning.style.display = 'none';
                        } else {
                            submitBtn.disabled = true;
                            submitBtn.style.opacity = '0.5';
                            warning.style.display = 'block';
                        }
                    };
                    
                    // Add input listeners to all textareas
                    const commentDivs = document.getElementById('fileComments').querySelectorAll('.comment');
                    commentDivs.forEach(div => {
                        const textarea = div.querySelector('.comment-response');
                        if (textarea) {
                            textarea.addEventListener('input', validateResponses);
                        }
                    });
                    
                    // Initial validation
                    validateResponses();
                    
                    // Add click event listener
                    document.getElementById('submitAllResponsesBtn').addEventListener('click', async () => {
                        if (confirm('Are you ready to submit your responses?')) {
                            const commentDivs = document.getElementById('fileComments').querySelectorAll('.comment');
                            
                            for (const commentDiv of commentDivs) {
                                const responseTextarea = commentDiv.querySelector('.comment-response');
                                if (responseTextarea && responseTextarea.value.trim()) {
                                    const responseId = commentDiv.id;
                                    const message = `Response ID: ${responseId}, ${responseTextarea.value.trim()}`;
                                    await createComment(fileId, message);
                                }
                            }
                            
                            alert('All responses submitted successfully!');
                            location.reload();
                        }
                    });
                }
            }
            
            // Hide existing separator lines between comments and response boxes
            const style = document.createElement('style');
            style.textContent = '.comment hr:not(.mt-3) { display: none; }';
            document.head.appendChild(style);
            
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
            showCommentsSub(file_id);
            
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
    // console.log('Categorized Entries:', categorizedEntries);

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
                        <div class="row">
                            <div class="col-xl-12 filter-column" id="summaryFilterSiderBar">
                                <div class="div-border white-bg align-left p-2 mb-3">
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
                        <div class="tab-content" id="selectedTab">
        `;
    
        template += `
            <div class='tab-pane fade show active' id='needinput' role='tabpanel' aria-labeledby='needinputTab'>
                <button id='resubmitFormBtn' class='buttonsubmit button-glow-red' style='float: right; margin-right: 10px;' title='Use to resubmit a new form that is linked to your current response'><span class="buttonsubmit__text">Resubmit Form</span></button>
                <button id='downloadCommentsBtn' class='buttonsubmit button-glow-red' style='float: right; margin-right: 10px;'><span class="buttonsubmit__text">Download All Comments</span></button>
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
                    <div class='col-4 mt-2'>
                        <div id='fileComments' style='max-height: 990px; overflow-y: auto; border: 1px solid #dee2e6; padding: 15px;'></div>
                        <div id='submitResponsesContainer' class='mt-2'></div>
                    </div>
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
        showCommentsSub(categorizedEntries.needinput[0].id);
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
    
    // Clear preview and comments when switching to empty tabs
    document.getElementById('needinputTab').addEventListener('click', () => {
        if (categorizedEntries.needinput.length === 0) {
            document.getElementById('boxFilePreview').innerHTML = '';
            document.getElementById('fileComments').innerHTML = '';
            document.getElementById('submitResponsesContainer').innerHTML = '';
        }
    });
    document.getElementById('acceptedTab').addEventListener('click', () => {
        document.getElementById('submitResponsesContainer').innerHTML = '';
        if (categorizedEntries.accepted.length === 0) {
            document.getElementById('boxFilePreview').innerHTML = '';
            document.getElementById('fileComments').innerHTML = '';
        }
    });
    document.getElementById('declinedTab').addEventListener('click', () => {
        document.getElementById('submitResponsesContainer').innerHTML = '';
        if (categorizedEntries.declined.length === 0) {
            document.getElementById('boxFilePreview').innerHTML = '';
            document.getElementById('fileComments').innerHTML = '';
        }
    });
    
    // Set up file switching for all tabs
    switchFilesWithResponse("accepted");
    switchFilesWithResponse("declined");

    // Set up download comments functionality
    setupDownloadComments(categorizedEntries.needinput);
    
    // Set up resubmit form functionality
    setupResubmitForm(categorizedEntries.needinput);

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
            // console.warn('Could not parse as Word document:', docxError);
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

export const setupResubmitForm = (entries) => {
    const resubmitBtn = document.getElementById('resubmitFormBtn');
    if (resubmitBtn && entries.length > 0) {
        resubmitBtn.addEventListener('click', async () => {
            const selectedFileId = document.getElementById('needinputselectedDoc').value;
            if (selectedFileId) {
                await extractFormDataAndNavigate(selectedFileId);
            }
        });
    }
};

export const extractFormDataAndNavigate = async (fileId) => {
    try {
        const [originalFileResponse, fileInfo] = await Promise.all([
            downloadFile(fileId),
            getFileInfo(fileId)
        ]);
        const originalBlob = await originalFileResponse.blob();
        const arrayBuffer = await originalBlob.arrayBuffer();
        
        if (window.mammoth) {
            const result = await window.mammoth.convertToHtml({arrayBuffer: arrayBuffer});
            const htmlContent = result.value;
            // console.log('Raw HTML:', htmlContent);
            
            // Convert HTML to text while preserving paragraph breaks
            let text = htmlContent
                .replace(/<\/h2>/gi, '\n')
                .replace(/<h2[^>]*>/gi, '')
                .replace(/<\/p>/gi, '\n\n')
                .replace(/<p[^>]*>/gi, '')
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"');
            
            // console.log('Full extracted text:', text);
            
            const formData = parseWordDocument(text);
            formData.originalConceptId = fileInfo.description || '';
            formData.fileId = fileId;
            formData.originalFileName = fileInfo.name || '';
            localStorage.setItem('resubmitFormData', JSON.stringify(formData));
            window.location.hash = '#data_form_resubmit';
        } else {
            alert('Unable to parse document. Please try again.');
        }
    } catch (error) {
        console.error('Error extracting form data:', error);
        alert('Error processing document. Please try again.');
    }
};

export const parseWordDocument = (text) => {
    const formData = {};
    
    const extractField = (label, text) => {
        const regex = new RegExp(label + ':\\s*([^\\n]+)', 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : '';
    };
    
    const extractFieldNoColon = (label, text) => {
        const regex = new RegExp(label + '\\s+([^\\n]+)', 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : '';
    };
    
    const extractBetween = (startLabel, endLabel, text) => {
        const regex = new RegExp(startLabel + ':\\s*([\\s\\S]*?)(?=' + endLabel + ':|$)', 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : '';
    };
    formData.date = extractField('Date', text);
    // console.log('date:', formData.date);
    formData.projname = extractField('Project Title', text);
    // console.log('projname:', formData.projname);
    formData.amendment = extractField('Is this an amendment', text);
    // console.log('amendment:', formData.amendment);
    formData.conNum = extractField('Amendment', text);
    // console.log('conNum:', formData.conNum);
    formData.investigators = extractField('Contact Investigator\\(s\\)', text);
    // console.log('investigators:', formData.investigators);
    formData.institution = extractField('Institution\\(s\\)', text);
    // console.log('institution:', formData.institution);
    formData.email = extractField('Contact Email', text);
    // console.log('email:', formData.email);
    formData.memcon = extractFieldNoColon('Member of Consortia or Study \\/ Trial Group\\?', text);
    // console.log('memcon:', formData.memcon);
    formData.acro = extractField('Confluence Study Acronym\\(s\\) for the Contact Investigator', text);
    // console.log('acro:', formData.acro);
    formData.otherinvest = extractBetween('OTHER Investigators and their institutions', 'ALL Investigators \\(and Institutions\\) who require access', text);
    // console.log('otherinvest:', formData.otherinvest);
    formData.allinvest = extractBetween('ALL Investigators \\(and Institutions\\) who require access', 'Consortia or Study \\/ Trial Group data being requested', text);
    // console.log('allinvest:', formData.allinvest);
    formData.datacon = extractBetween('Consortia or Study \\/ Trial Group data being requested', 'Concept Background', text);
    // console.log('datacon:', formData.datacon);
    formData.condesc = extractBetween('Concept Background', 'Concept Aims', text);
    // console.log('condesc:', formData.condesc);
    formData.condescAims = extractBetween('Concept Aims', 'Description of Analysis Plan', text);
    // console.log('condescAims:', formData.condescAims);
    formData.analdesc = extractBetween('Description of Analysis Plan', 'Primary Endpoint', text);
    // console.log('analdesc:', formData.analdesc);
    formData.primend = extractBetween('Primary Endpoint', 'Subtype of Breast Cancer', text);
    // console.log('primend:', formData.primend);
    formData.sbcin = extractField('Subtype of Breast Cancer', text);
    // console.log('sbcin:', formData.sbcin);
    formData.otherinput = extractField('Other Primary Endpoint', text);
    // console.log('otherinput:', formData.otherinput);
    formData.genotyping = extractBetween('Genotyping', 'Data Requested From', text);
    // console.log('genotyping:', formData.genotyping);
    formData.sex = extractBetween('Data Requested From', 'Carrier Status requested', text);
    // console.log('sex:', formData.sex);
    formData.carStatus = extractBetween('Carrier Status requested', 'Risk Factor Variables', text);
    // console.log('carStatus:', formData.carStatus);
    formData.riskfactvarv = extractBetween('Risk Factor Variables', 'Pathology Variables', text);
    // console.log('riskfactvarv:', formData.riskfactvarv);
    formData.pathvarv = extractBetween('Pathology Variables', 'Survival and Treatment Variables', text);
    // console.log('pathvarv:', formData.pathvarv);
    formData.surtrevarv = extractBetween('Survival and Treatment Variables', 'Mammographic Density Variable', text);
    // console.log('surtrevarv:', formData.surtrevarv);
    formData.mammvarv = extractBetween('Mammographic Density Variable', 'Time Plan', text);
    // console.log('mammvarv:', formData.mammvarv);
    formData.time = extractBetween('Time Plan', 'Any other considerations you would like the DACC to be aware of', text);
    // console.log('time:', formData.time);
    formData.anyoth = extractBetween('Any other considerations you would like the DACC to be aware of', 'Confluence authorship requirements', text);
    // console.log('anyoth:', formData.anyoth);
    
    // console.log('Complete formData object:', formData);
    return formData;
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