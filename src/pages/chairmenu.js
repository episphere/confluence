import { showPreview } from "../components/boxPreview.js";
import {
  getFolderItems,
  emailtoChair,
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
  submitterFolder
} from "../shared.js";
export function renderFilePreviewDropdown(files, tab) {
    let template = "";
    if (!Array.isArray(files)) {
      return template;
    }
    template += `<a href="mailto:${emailtoChair.join(
      "; "
    )}" id='email' class='btn btn-dark'>Send Email to Chair</a>`

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
                  <select id='${tab}selectedDoc' size='3'>
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
      template += "<div class='tab-content' id='selectedTab'>";
      const responseChair = await getFolderItems(userChairItem.boxId);
    console.log({responseChair});
    let filearrayChair = responseChair.entries;
    const filescompleted = [];
    for (let obj of filearrayChair) {
        filescompleted.push(obj);
    }
    template += `<div class='tab-pane fade show active'
                  id='toBeCompleted' role='tabpanel'
                  aria-labeledby='toBeCompletedTab'> `;
    template += renderFilePreviewDropdown(filescompleted, "toBeCompleted");
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
    template += "</div>";
    document.getElementById("chairFileView").innerHTML = template;
    showPreview(filearrayChair[0].id);
    switchFiles("toBeCompleted");
    document.getElementById(
      "toBeCompletedselectedDoc"
    ).children[0].selected = true;
    commentApproveReject();
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
                                         <a class='nav-link' id='daccCompletedTab' href='#chair_menu' data-mdb-toggle="tab" role='tab' aria-controls='chair_menu' aria-selected='true'> Submit concept recommendation</a>
                                     </li>
                                     </li>
                                    <li class='nav-item' role='presentation'>
                                      <a class='nav-link' id='daccCompletedTab' href='#chair_menu' data-mdb-toggle="tab" role='tab' aria-controls='chair_menu' aria-selected='true'> DACC Decision </a>
                                    </li>
                                </ul> 
                                <div id="chairFileView" class="align-left"></div>  
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
      ".tab-content .active #toBeCompletedselectedDoc"
    ).value; //document.getElementById('selectedDoc').value;
    // Send multiple files
    const filesToSend = [];
    const elements = document.querySelectorAll(
      ".tab-content .active #toBeCompletedselectedDoc option"
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

