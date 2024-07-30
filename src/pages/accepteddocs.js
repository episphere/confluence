import { showPreview } from "../components/boxPreview.js";
import { switchTabs, switchFiles, sortTableByColumn } from "../event.js";
import {
  getFolderItems,
  chairsInfo,
  messagesForChair,
  getTaskList,
  createCompleteTask,
  assignTask,
  updateTaskAssignment,
  createComment,
  getFileInfo,
  moveFile,
 //createFolder,
  addNewCollaborator,
  copyFile,
  acceptedFolder,
  deniedFolder,
  submitterFolder,
  //sendEmail,
  getChairApprovalDate,
  showCommentsDropDown,
  archivedFolder,
  deleteTask,
  showCommentsDCEG,
  hideAnimation,
  getFileURL,
  emailsAllowedToUpdateData,
  returnToSubmitterFolder,
  createFolder,
  completedFolder,
  listComments
} from "../shared.js";

export const acceptedDocs = () => {
   //const userInfo = JSON.parse(localStorage.getItem('parms'))
  //console.log('user info: ', userInfo, localStorage.getItem('parms'))
  //if (!userInfo) return;
//   const userEmail = JSON.parse(localStorage.parms).login;
//   const userForAuth = emailsAllowedToUpdateData.includes(userEmail);
//   if (!userForAuth) return;
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
}

export const acceptedDocsView = async () => {
    const allFiles = await getFolderItems(acceptedFolder);
    let filearrayAllFiles = allFiles.entries;
    viewAcceptedFilesTemplate(filearrayAllFiles);
    hideAnimation();
}

export function viewAcceptedFilesColumns() {
    return `<div class="row pt-md-3 pb-md-3 m-0 align-left div-sticky" style="border-bottom: 1px solid rgb(0,0,0, 0.1); font-size: .8em">
      <div class="col-md-12">
        <div class="row ps-3 pe-5">
          <div class="col-lg-8 text-left font-bold">Concept Name <button class="transparent-btn sort-column" data-column-name="Concept Name"><i class="fas fa-sort"></i></button></div>
          <div class="col-lg-2 text-left font-bold">Submission Date <button class="transparent-btn sort-column" data-column-name="Submission Date"><i class="fas fa-sort"></i></button></div>
          <div class="col-lg-2 text-left font-bold">Accepted Date <button class="transparent-btn sort-column" data-column-name="Accepted Date"><i class="fas fa-sort"></i></button></div>
        </div>
      </div>
    </div>`;
  }

export async function viewAcceptedFilesTemplate(files) {
    let template = "";
    let filesInfo = [];
    for (const file of files) {
      const fileInfo = await getFileInfo(file.id);
      filesInfo.push(fileInfo);
    }
    if (filesInfo.length > 0) {
      template += `
      <div id='decidedFiles'>
        <div class='col-xl-12 pr-0'>`;
      template += viewAcceptedFilesColumns();
      template += `<div id="files"> 
      </div>`;
    } else {
      template += `
                No files to show.            
      </div>
      </div>`;
    }
    document.getElementById("daccDecision").innerHTML = template;
    if (filesInfo.length !== 0) {
      await viewAcceptedFiles(filesInfo);
    //   for (const file of filesInfo) {
    //     document
    //       .getElementById(`study${file.id}`)
    //       .addEventListener("click", showCommentsDCEG(file.id));
    //   }
      let btns = Array.from(document.querySelectorAll(".preview-file"));
      btns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          btn.dataset.target = "#confluencePreviewerModal";
          const header = document.getElementById("confluencePreviewerModalHeader");
          const body = document.getElementById("confluencePreviewerModalBody");
          header.innerHTML = `<h5 class="modal-title">File preview</h5>
                                      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`;
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
      //   const headerCell = document.getElementsByClassName("header-sortable")[0];
      //   const tableElement = headerCell.parentElement.parentElement.parentElement;
      //   filterCheckBox(tableElement, filesInfo);
      // });
    }
  }

  export async function viewAcceptedFiles(files) {
    let template = `<div class="row m-0 align-left allow-overflow w-100">
          <div class="accordion accordion-flush col-md-12" id="acceptedAccordian">`;
    for (const fileInfo of files) {
      const fileId = fileInfo.id;
      console.log(fileInfo);
      const comments = await listComments(fileInfo.id);
      let commentsjson = JSON.parse(comments).entries;
      console.log(commentsjson);
      //let author = commentsjson[0].message.slice(7);
      let filename = fileInfo.name.slice(0,-19);
      const shortfilename = filename.length > 55 ? filename.substring(0, 54) + "..." : filename;
      //let completion_date = await getChairApprovalDate(fileId);
      template += `
        <div class="accordion-item">
          <h2 class="accordion-header" id="flush-headingOne">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#file${fileId}" aria-expanded="false" aria-controls="file${fileId}">
              <div class="col-lg-8">${shortfilename}</div>
              <div class="col-lg-2">${new Date(fileInfo.content_created_at).toDateString().substring(4)}</div>
              <div class="col-lg-2">${new Date(fileInfo.modified_at).toDateString().substring(4)}</div>
            </button>
          </h2>
          <div id="file${fileId}" class="accordion-collapse collapse" aria-labelledby="flush-headingOne">
            <div class="accordion-body">
              <div class="col-12">
                  Concept: ${filename} <button class="btn btn-lg custom-btn preview-file" title='Preview File' data-file-id="${fileId}" aria-label="Preview File"  data-keyboard="false" data-backdrop="static" data-bs-toggle="modal" data-bs-target="#bcrppPreviewerModal"><i class="fas fa-external-link-alt"></i></button>
              </div>
            </div>
          </div>
        </div>`;
    }
    template += `</div></div></div></div></div></div>`;
    if (document.getElementById("files") != null)
      document.getElementById("files").innerHTML = template;
}