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
    return `<div class="row m-0 pt-2 pb-2 align-left div-sticky" style="border-bottom: 1px solid rgb(0,0,0, 0.1); font-size: .8em">
      <div class="col-lg-5 text-left font-bold ws-nowrap header-sortable">Concept Name <button class="transparent-btn sort-column" data-column-name="Concept Name"><i class="fas fa-sort"></i></button></div>
      <div class="col-lg-2 text-left font-bold ws-nowrap header-sortable">Submission Date <button class="transparent-btn sort-column" data-column-name="Submission Date"><i class="fas fa-sort"></i></button></div>
      <div class="col-lg-2 text-left font-bold ws-nowrap header-sortable">Accepted Date <button class="transparent-btn sort-column" data-column-name="Accepted Date"><i class="fas fa-sort"></i></button></div>
      <div class="col-lg-2 text-center font-bold ws-nowrap header-sortable">Author <button class="transparent-btn sort-column" data-column-name="Author"><i class="fas fa-sort"></i></button></div>
      <div class="col-lg-1 text-right font-bold ws-nowrap header-sortable"></div>
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
      template += '<div id="files"> </div>';
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
                                      <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                          <span aria-hidden="true">&times;</span>
                                      </button>`;
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
    let template = "";
    for (const fileInfo of files) {
      const fileId = fileInfo.id;
      const comments = await listComments(fileInfo.id);
      let commentsjson = JSON.parse(comments).entries;
      let author = commentsjson[0].message.slice(7);
      //console.log(fileInfo);
      let filename = fileInfo.name.slice(0,-19);
      const shortfilename = filename.length > 25 ? filename.substring(0, 24) + "..." : filename;
      //let completion_date = await getChairApprovalDate(fileId);
      template += `
    <div class="card mt-1 mb-1 align-left" >
      <div style="padding: 10px" aria-expanded="false" id="file${fileId}" class='filedata'>
          <div class="row">
              <div class="col-lg-5 text-left">${shortfilename}<button class="btn btn-lg custom-btn preview-file" title='Preview File' data-file-id="${fileId}" aria-label="Preview File"  data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#bcrppPreviewerModal"><i class="fas fa-external-link-alt"></i></button></div>
              <div class="col-lg-2 text-left">${new Date(fileInfo.content_created_at).toDateString().substring(4)}</div>
              <div class="col-lg-2 text-left">${new Date(fileInfo.modified_at).toDateString().substring(4)}</div>
              <div class="col-lg-2 text-center" id="author${fileId}">${author}</div>
              <div class="col-lg-1 text-right">
                  <button title="Expand/Collapse" class="transparent-btn collapse-panel-btn" data-toggle="collapse" data-target="#study${fileId}">
                      <i class="fas fa-caret-down fa-2x"></i>
                  </button>
              </div>
          </div>
          <div id="study${fileId}" class="collapse" aria-labelledby="file${fileId}">
            <div class="card-body" style="padding-left: 10px;background-color:#f6f6f6;">
              <div class="row mb-1 m-0">
                <div class="col-12 font-bold">
                    Concept: ${filename}
                </div>
              </div>
              <!--<div class="row mb-1 m-0">
                <div id='file${fileId}Comments' class='col-12'></div>
              </div>-->
          </div>
          </div>
        </div>
      </div>`;
    }
    template += `</div></div></div></div>`;
    if (document.getElementById("files") != null)
      document.getElementById("files").innerHTML = template;
}