import { showPreview } from "../components/boxPreview.js";
import { switchTabs, switchFiles } from "../event.js";
import { getFolderItems, chairsInfo, messagesForChair, getTaskList, createCompleteTask, assignTask, updateTaskAssignment, createComment, getConceptIdFromFileName, getFileInfo, moveFile, /*createFolder,*/ addNewCollaborator, copyFile, acceptedFolder, deniedFolder, submitterFolder, /*sendEmail,*/ getChairApprovalDate, showCommentsDropDown, archivedFolder, deleteTask, showCommentsDCEG, hideAnimation, getFileURL, emailsAllowedToUpdateData, returnToSubmitterFolder, createFolder, completedFolder, listComments } from "../shared.js";

const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

// Function to read Excel file
async function readExcelFile() {
    try {
        if (typeof XLSX === 'undefined') {
            throw new Error('XLSX library not loaded');
        }
        
        const response = await fetch('./src/data/accepted_requests.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        return {
            name: "Accepted Data Requests",
            last_update: new Date().toLocaleDateString(),
            files: jsonData.map(row => ({
                title: row.title || row.Title || '',
                contact: row.contact || row.Contact || '',
                box_id: row.box_id || row['Box ID'] || '',
                concept_id: row.concept_id || row['Concept ID'] || '',
                accepted_group: row.accepted_group || row['Accepted Group'] || ''
            }))
        };
    } catch (error) {
        console.error('Error reading Excel file:', error);
        return { name: "Accepted Data Requests", last_update: "", files: [] };
    }
}

export const acceptedDocs = () => {
    // const userInfo = JSON.parse(localStorage.getItem('parms'))
    // console.log('user info: ', userInfo, localStorage.getItem('parms'))
    // if (!userInfo) return;
    // const userEmail = JSON.parse(localStorage.parms).login;
    // const userForAuth = emailsAllowedToUpdateData.includes(userEmail);
    // if (!userForAuth) return;
    
    let template = `
        <div class="general-bg padding-bottom-1rem">
            <div class="container body-min-height">
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">Accepted Data Requests</h1>
                    </div>  
                </div>
                <div class="data-submission div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem;">
                    <div class="tab-pane fade show active" id="daccDecision" role="tabpanel" aria-labeledby="daccDecisionTab">
                        <div id="authTableView" class="align-left"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    hideAnimation();
    return template;
};

export const acceptedDocsView = async () => {
    const accepted_data = await readExcelFile();
    //console.log(accepted_data.files);
    //const allFiles = await getFolderItems(acceptedFolder);
    let canReadBox = false;
    try { canReadBox = !!JSON.parse(localStorage.parms || "{}").access_token; } catch (error) { canReadBox = false; }
    let filearrayAllFiles = await Promise.all(accepted_data.files.map(async file => {
        const boxFile = canReadBox && file.box_id ? await getFileInfo(file.box_id).catch(() => null) : null;
        return { ...file, concept_id: file.concept_id || getConceptIdFromFileName(boxFile?.name || file.title) || "--" };
    }));
    viewAcceptedFilesTemplate(filearrayAllFiles);
    hideAnimation();
};

export function viewAcceptedFilesColumns() {
    return `
        <div class="row pt-md-3 pb-md-3 m-0 align-left div-sticky" style="border-bottom: 1px solid rgb(0,0,0, 0.1); font-size: .8em">
            <div class="col-md-12">
                <div class="row ps-3 pe-5">
                    <div class="col-lg-5 text-left font-bold header-sortable">Concept Name <button class="transparent-btn sort-column" data-column-name="Concept Name"><i class="fas fa-sort"></i></button></div>
                    <div class="col-lg-2 text-left font-bold header-sortable">ID <button class="transparent-btn sort-column" data-column-name="ID"><i class="fas fa-sort"></i></button></div>
                    <div class="col-lg-3 text-left font-bold header-sortable">Contact <button class="transparent-btn sort-column" data-column-name="Contact"><i class="fas fa-sort"></i></button></div>
                    <div class="col-lg-2 text-left font-bold header-sortable">Group <button class="transparent-btn sort-column" data-column-name="Group"><i class="fas fa-sort"></i></button></div>
                </div>
            </div>
        </div>
    `;
};

export async function viewAcceptedFilesTemplate(filesInfo) {
    let template = "";
    // let filesInfo = [];
    // for (const file of files) {
    //     const fileInfo = await getFileInfo(file.id);
    //     filesInfo.push(fileInfo);
    // }
    
    if (filesInfo.length > 0) {
        template += `
            <div id='decidedFiles'>
                <div class='col-xl-12 pr-0'>
        `;
        template += viewAcceptedFilesColumns();
        template += `
                <div id="files"> 
            </div>
        `;
    } else {
        template += `
                    No files to show.            
                </div>
            </div>
        `;
    }
    
    document.getElementById("daccDecision").innerHTML = template;
    
    if (filesInfo.length !== 0) {
        await viewAcceptedFiles(filesInfo);
        
        //   for (const file of filesInfo) {
        //       document.getElementById(`study${file.id}`).addEventListener("click", showCommentsDCEG(file.id));
        //   }
        
        let btns = Array.from(document.querySelectorAll(".preview-file"));
        btns.forEach((btn) => {
            btn.addEventListener("click", (e) => {
                btn.dataset.bsTarget = "#confluencePreviewerModal";
                const header = document.getElementById("confluencePreviewerModalHeader");
                const body = document.getElementById("confluencePreviewerModalBody");
                
                header.innerHTML = `
                    <h5 class="modal-title">File preview</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                `;
                
                const fileId = btn.dataset.fileId;
                bootstrap.Modal.getOrCreateInstance(document.getElementById("confluencePreviewerModal")).show();
                showPreview(fileId, "confluencePreviewerModalBody");
            });
        });

        //Filtering and Sorting
        const table = document.getElementById("decidedFiles");
        const headerRow = table.querySelector(".div-sticky .row.ps-3");
        Array.from(headerRow?.children || []).forEach((header, index) => {
            header.addEventListener("click", () => {
                const ascending = !header.classList.contains("header-sort-asc");
                const rowsContainer = table.querySelector("#acceptedAccordian");
                const rows = Array.from(rowsContainer?.querySelectorAll(":scope > .accordion-item") || []);
                const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
                rows.sort((left, right) => {
                    const leftValue = left.querySelector(".accordion-button")?.children[index]?.textContent?.trim() || "";
                    const rightValue = right.querySelector(".accordion-button")?.children[index]?.textContent?.trim() || "";
                    return collator.compare(leftValue, rightValue) * (ascending ? 1 : -1);
                }).forEach(row => rowsContainer.appendChild(row));
                Array.from(headerRow.children).forEach(item => {
                    item.classList.remove("header-sort-asc", "header-sort-desc");
                    const icon = item.querySelector("i");
                    if (icon) icon.className = "fas fa-sort";
                });
                header.classList.add(ascending ? "header-sort-asc" : "header-sort-desc");
                const icon = header.querySelector("i");
                if (icon) icon.className = ascending ? "fas fa-sort-up" : "fas fa-sort-down";
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
        //     const headerCell = document.getElementsByClassName("header-sortable")[0];
        //     const tableElement = headerCell.parentElement.parentElement.parentElement;
        //     filterCheckBox(tableElement, filesInfo);
        // });
    }
};

export async function viewAcceptedFiles(files) {
    let template = `
        <div class="row m-0 align-left allow-overflow w-100">
            <div class="accordion accordion-flush col-md-12" id="acceptedAccordian">
    `;
    
    for (const fileInfo of files) {
        const fileId = fileInfo.box_id;
        // const comments = await listComments(fileId);
        // let commentsjson = JSON.parse(comments).entries;
        // let author = commentsjson[0].message.slice(7);
        let filename = fileInfo.title;
        const shortfilename = filename.length > 105 ? filename.substring(0, 104) + "..." : filename;
        // let completion_date = await getChairApprovalDate(fileId);
        
        template += `
            <div class="accordion-item">
                <h2 class="accordion-header" id="flush-headingOne">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#file${fileId}" aria-expanded="false" aria-controls="file${fileId}">
                    <div class="col-lg-5">${shortfilename}</div>
                    <div class="col-lg-2">${fileInfo.concept_id || "--"}</div>
                    <div class="col-lg-3">${fileInfo.contact}</div>
                    <div class="col-lg-2">${fileInfo.accepted_group}</div>
                    </button>
                </h2>
                <div id="file${fileId}" class="accordion-collapse collapse" aria-labelledby="flush-headingOne">
                    <div class="accordion-body">
                    <div class="col-12">
                        <b>Concept:</b> ${filename} <button class="btn btn-lg custom-btn preview-file" title='Preview File' data-file-id="${fileId}" aria-label="Preview File" data-bs-keyboard="false" data-bs-backdrop="static" data-bs-toggle="modal" data-bs-target="#bcrppPreviewerModal"><i class="fas fa-external-link-alt"></i></button>
                    </div>
                    <div class="col-12"><b>Box ID:</b> ${escapeHtml(fileInfo.box_id || "Not available")}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    template += `</div></div></div></div></div></div>`;
    if (document.getElementById("files") != null) document.getElementById("files").innerHTML = template;
};
