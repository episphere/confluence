import { showPreview } from "../components/boxPreview.js";
import { switchTabs } from "../event.js";
import {
  getFolderItems,
  chairsInfo,
  messagesForChair,
  getTaskList,
  updateTaskAssignment,
  createComment,
  getFileInfo,
  moveFile,
  createFolder,
  addNewCollaborator,
  copyFile,
  acceptedFolder,
  deniedFolder,
  submitterFolder, 
  sendEmail
} from "../shared.js";
export function renderFilePreviewDropdown(files, tab) {
    let template = "";
    if (!Array.isArray(files)) {
      return template;
    }
    // template += `<a href="mailto:${chairsInfo.find(element => element.email === JSON.parse(localStorage.getItem('parms')).login).dacc.join(
    //   "; "
    // )}" id='email' class='btn btn-dark'>Send Email to Chair</a>`
    template += `<a href="mailto:${sendEmail.join(

      "; "

    )}" id='email' class='btn btn-dark'>Send Email to Chiar</a>`

    if (files.length != 0) {
      if (
        tab !== "daccReview" &&
        tab !== "dacctoBeCompleted" &&
        tab !== "completed" &&
        tab !== "decided"
      ) {
        template += `<div class='card-body p-0'>
                  <div class='card-title'>
                 <label for='${tab}selectedDoc'>
                      <b>Select Concept Form:</b>
                      <!---<div class='text-muted small'>Hold Ctrl to select multiple concept forms 
                            </div>-->
                  </label>
                  <br>
                  <select id='${tab}selectedDoc' size='1'>
              `;
      } else {
        template += `<div class='card-body p-0'>
                  <div class='card-title'>
                  <label for='${tab}selectedDoc'>
                      <b>Select Concept Form:</b>
                  </label>
                  <br>
                  <select id='${tab}selectedDoc'>`;
      }
      for (const file of files) {
        template += `
                  <option value='${file.id}'>
                  ${file.name}</option>`;
      }
      template += `
                  </select>
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
}
export function switchFiles(tab) {
   console.log('switchFile:', tab,document.getElementById(`${tab}selectedDoc`) )
    document
      .getElementById(`${tab}selectedDoc`)
      .addEventListener("change", (e) => {
        const file_id = e.target.value;
        showPreview(file_id);
      });
  }
  const getCurrentUserAuth = () => {
    const userEmail = JSON.parse(localStorage.parms).login;
    let authChair = chairsInfo
      .find(({ email }) => email === userEmail);
    return authChair ? authChair : null;
  }
    export const generateChairMenuFiles = async () => {
      const userChairItem = getCurrentUserAuth();
      if (!userChairItem) return null;
      let template = '';
      //template += "<div class='tab-content' id='selectedTab'>";
      const responseChair = await getFolderItems(userChairItem.boxId);
      let filearrayChair = responseChair.entries;
      const filescompleted = [];
      for (let obj of filearrayChair) {
        filescompleted.push(obj);
    }
    template += `<div class='tab-pane fade show active'
                  id='recommendation' role='tabpanel'
                  aria-labeledby='recommendationTab'>`;
    console.log({template})
    template += renderFilePreviewDropdown(filescompleted, "recommendation");
    if (filescompleted.length !== 0) {
        template += `
            <div class='row'>
              <div id='boxFilePreview' class="col-12 preview-container"></div>
            </div>
            <div id='finalChairDecision' class="card-body approvedeny" style="background-color:#f6f6f6;">
              <form>
                <label for="message">Enter Message for submitter or the DACC</label>
                <div class='text-muted small'>Submitter will only see the below comment after approve or deny. </div>
                <label for="grade">Select recommendation: </label>
              <select name="grade" id="grade2"></option>
                <option value = "1"> 1 - Approved as submitted</option>
                <option value = "2"> 2 - Approved, pending conditions/clarification of some issues </option>
                <option value = "3"> 3 - Approved, but data release will be delayed </option>
                <option value = "4"> 4 - Not approved </option>
                <option value = "5"> 5 - Decision pending clarification of several issues</option>
                <option value = "777"> 777 - Duplicate Proposal</option>
                </select>
              <br>
                <div class="input-group">
                    <textarea id="message" name="message" rows="6" cols="65"></textarea>
                </div>
                <button type="submit" class="buttonsubmit" value="approved" onclick="this.classList.toggle('buttonsubmit--loading')">
                  <span class="buttonsubmit__text"> Approve </span></button>
                <button type="submit" class="buttonsubmit" value="rejected" onclick="this.classList.toggle('buttonsubmit--loading')">
                  <span class="buttonsubmit__text"> Deny </span></button>
              </form>
            </div>
            `;
      }
    template += "</div>";
    //template += "</div>";
    //document.getElementById("chairFileView").innerHTML = template;
    template += `<div class='tab-pane fade'
    id='daccDecision' role='tabpanel'
    aria-labeledby='daccDecision'>daccDecisionTab tab  content </div>`;

    document.getElementById("selectedTab").innerHTML = template;
    showPreview(filearrayChair[0].id);
    switchFiles("recommendation");
    document.getElementById(
      "recommendationselectedDoc"
    ).children[0].selected = true;
    commentApproveReject();
    //Switch Tabs
    switchTabs(
      "recommendation",
      ["daccDecision"]
    );
    
    switchTabs(
      "daccDecision",
      ["recommendation"]
    );
    return template;
}
export const chairMenuTemplate = () => {
  const userInfo = JSON.parse(localStorage.getItem('parms'))
  console.log('user info: ', userInfo, localStorage.getItem('parms'))
  if (!userInfo) return;
  const userEmail = userInfo.login;
  const userForChair = chairsInfo.find(item => item.email === userEmail)
  if (userForChair === -1) return;
  const message = messagesForChair[userForChair.id]
    let template = `
                    <div class="general-bg padding-bottom-1rem">
                        <div class="container body-min-height">
                            <div class="main-summary-row">
                                <div class="align-left">
                                    <h1 class="page-header">${message}</h1>
                                </div>
                            </div>
                            <div class="data-submission div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem;">
                                <ul class='nav nav-tabs mb-3' role='tablist'>
                                     <li class='nav-item' role='presentation'>
                                         <a class='nav-link' id='recommendationTab' href='#recommendation' data-mdb-toggle="tab" role='tab' aria-controls='recommendation' aria-selected='true'> Submit concept recommendation</a>
                                     </li>
                                     </li>
                                    <li class='nav-item' role='presentation'>
                                      <a class='nav-link' id='daccDecisionTab' href='#daccDecision' data-mdb-toggle="tab" role='tab' aria-controls='daccDecision' aria-selected='true'> DACC Decision </a>
                                    </li>
                                </ul> 
                                <div class="tab-content" id="selectedTab"></div>  
                            </div>
                        </div>
                    </div>
                `;
    return template;
}
export const commentApproveReject = () => {
  let approveComment = async (e) => {
    console.log('comment approve: ', e)
    e.preventDefault();
    const btn = document.activeElement;
    btn.disabled = true;
    // let taskId = btn.name;
    let fileId = document.querySelector(
      ".tab-content .active #recommendationselectedDoc"
    ).value; //document.getElementById('selectedDoc').value;
    // Send multiple files
    const filesToSend = [];
    const elements = document.querySelectorAll(
      ".tab-content .active #recommendationselectedDoc option"
    );
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].selected) {
        filesToSend.push(elements[i].value);
      }
    }
    for (const fileId of filesToSend) {
      let tasklist = await getTaskList(fileId);
      let entries = tasklist.entries;
      if (entries.length !== 0) {
        for (let item of entries) {
          if (item.is_completed == false && item.action == "review") {
            for (let taskassignment of item.task_assignment_collection
              .entries) {
              if (
                taskassignment.assigned_to.login ==
                JSON.parse(localStorage.parms).login
              ) {
                var taskId = taskassignment.id;
              }
            }
          }
        }
      }
      let decision = e.submitter.value;
      let grade = e.target[0].value;
      let comment = e.target[1].value;
      let message = "Rating: " + grade + "\nComment: " + comment;
      if (decision !== "daccReview") {
        await updateTaskAssignment(taskId, decision, message);
      }
      await createComment(fileId, message);
      let fileInfo = await getFileInfo(fileId);
      let uploaderName = fileInfo.created_by.login;
      if (decision == "approved") {
        await moveFile(fileId, acceptedFolder);
      } else if (decision == "rejected") {
        await moveFile(fileId, deniedFolder);
      }
      if (decision != "daccReview") {
        let folderItems = await getFolderItems(submitterFolder);
        let folderEntries = folderItems.entries;
        let folderID = "none";
        for (let obj of folderEntries) {
          if (obj.name == uploaderName) {
            folderID = obj.id;
          }
        }
        let cpFileId = "";
        if (folderID == "none") {
          const newFolder = await createFolder(submitterFolder, uploaderName);
          await addNewCollaborator(
            newFolder.id,
            "folder",
            uploaderName,
            "viewer"
          );
          const cpFile = await copyFile(fileId, newFolder.id);
          cpFileId = cpFile.id;
        } else {
          const cpFile = await copyFile(fileId, folderID);
          cpFileId = cpFile.id;
        }
        await createComment(cpFileId, "This file was " + decision);
        await createComment(cpFileId, message);
      }
    }
    document.location.reload(true);
  };
  const form = document.querySelector(".approvedeny");
  if (form) {
    form.addEventListener("submit", approveComment);
  }
};

// export function viewFinalDecisionFilesColumns() {
//   return `<div class="row m-0 pt-2 pb-2 align-left div-sticky" style="border-bottom: 1px solid rgb(0,0,0, 0.1);">
//     <div class="col-lg-3 text-left font-bold ws-nowrap header-sortable">Concept Name <button class="transparent-btn sort-column" data-column-name="Concept Name"><i class="fas fa-sort"></i></button></div>
//     <div class="col-lg-2 text-left font-bold ws-nowrap header-sortable">Submitted By <button class="transparent-btn sort-column" data-column-name="Submitted By"><i class="fas fa-sort"></i></button></div>
//     <div class="col-lg-3 text-left font-bold ws-nowrap header-sortable">Submission Date <button class="transparent-btn sort-column" data-column-name="Submission Date"><i class="fas fa-sort"></i></button></div>
//     <div class="col-lg-2 text-left font-bold ws-nowrap header-sortable">Decision<button class="transparent-btn sort-column" data-column-name="Decision"><i class="fas fa-sort"></i></button></div>
//     <div class="col-lg-2 text-left font-bold ws-nowrap header-sortable">Decided On<button class="transparent-btn sort-column" data-column-name="Decision Date"><i class="fas fa-sort"></i></button></div>
//   </div>`;
// }
// export async function viewFinalDecisionFilesTemplate(files) {
//   let template = "";
//   let filesInfo = [];
//   for (const file of files) {
//     const fileInfo = await getFileInfo(file.id);
//     filesInfo.push(fileInfo);
//   }
//   if (filesInfo.length > 0) {
//     template += `
//     <div id='decidedFiles'>
//     <div class='row'>
//       <div class="col-xl-12 filter-column" id="summaryFilterSiderBar">
//           <div class="div-border white-bg align-left p-2">
//               <div class="main-summary-row">
//                   <div class="col-xl-12 pl-1 pr-0">
//                       <span class="font-size-17 font-bold">Filter</span>
//                       <div id="filterData" class="align-left"></div>
//                   </div>
//               </div>
//           </div>
//       </div>
//       </div>
//       <!--div class='table-responsive'>
//       <table class='table'-->
      
//       <div class='col-xl-12 pr-0'>`;

//     template += viewFinalDecisionFilesColumns();

//     template += '<div id="files"> </div>';

//     template += '<!--tbody id="files"-->';
//   } else {
//     template += `
//               No files to show.            
//     </div>
//     </div>`;
//   }

//   document.getElementById("decided").innerHTML = template;

//   if (filesInfo.length !== 0) {
//     await viewFinalDecisionFiles(filesInfo);
//     for (const file of filesInfo) {
//       document
//         .getElementById(`study${file.id}`)
//         .addEventListener("click", showCommentsDropDown(file.id));
//     }

//     let btns = Array.from(document.querySelectorAll(".preview-file"));
//     btns.forEach((btn) => {
//       btn.addEventListener("click", (e) => {
//         btn.dataset.target = "#bcrppPreviewerModal";
//         const header = document.getElementById("bcrppPreviewerModalHeader");
//         const body = document.getElementById("bcrppPreviewerModalBody");
//         header.innerHTML = `<h5 class="modal-title">File preview</h5>
//                                     <button type="button" class="close" data-dismiss="modal" aria-label="Close">
//                                         <span aria-hidden="true">&times;</span>
//                                     </button>`;
//         const fileId = btn.dataset.fileId;
//         $("#bcrppPreviewerModal").modal("show");
//         showPreview(fileId, "bcrppPreviewerModalBody");
//       });
//     });
//     //Filtering and Sorting
//     const table = document.getElementById("decidedFiles");
//     const headers = table.querySelector(`.div-sticky`);
//     Array.from(headers.children).forEach((header, index) => {
//       header.addEventListener("click", (e) => {
//         const sortDirection = header.classList.contains("header-sort-asc");
//         sortTableByColumn(table, index, !sortDirection);
//       });
//     });

//     filterSection(filesInfo);
//     Array.from(document.getElementsByClassName("filter-var")).forEach((el) => {
//       el.addEventListener("click", () => {
//         const headerCell =
//           document.getElementsByClassName("header-sortable")[0];
//         const tableElement =
//           headerCell.parentElement.parentElement.parentElement;
//         filterCheckBox(tableElement, filesInfo);
//       });
//     });
//     const input = document.getElementById("searchDataDictionary");
//     input.addEventListener("input", () => {
//       const headerCell = document.getElementsByClassName("header-sortable")[0];
//       const tableElement = headerCell.parentElement.parentElement.parentElement;
//       filterCheckBox(tableElement, filesInfo);
//     });
//   }
// }