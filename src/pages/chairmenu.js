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
  completedFolder
} from "../shared.js";

export function renderFilePreviewDropdown(files, tab) {
    let template = "";
    if (!Array.isArray(files)) {
      return template;
    }
    if (files.length != 0) {
        template += `
        <button style="margin-right: 10px; float: right" id='${tab}-download-all' class='btn btn-dark'>Download All</button>
        <div class='card-body p-0'>
          <div class='card-title'>
            <label for='${tab}selectedDoc'>
                <b>Select Concept Form:</b>
            </label>
            <br>
            <select id='${tab}selectedDoc'>`;
      for (const file of files) {
        template += `
            <option value='${file.id}'>
            ${file.name.slice(0,-19)}</option>`;
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

// export function switchFiles(tab, div_id = '') {
//    console.log('switchFile:', tab,document.getElementById(`${tab}selectedDoc`) )
//     document
//       .getElementById(`${tab}selectedDoc`)
//       .addEventListener("change", (e) => {
//         const file_id = e.target.value;
//         showPreview(file_id, div_id);
//       });
//   }

const getCurrentUserAuth = () => {
    const userEmail = JSON.parse(localStorage.parms).login;
    let authChair = chairsInfo.find(({ email }) => email === userEmail);
    return authChair ? authChair : null;
  }

export const generateChairMenuFiles = async () => {
    const userChairItem = getCurrentUserAuth();
    console.log(userChairItem);
    if (!userChairItem) return null;
    const responseChair = await getFolderItems(userChairItem.boxIdNew);
    const responseClara = await getFolderItems(userChairItem.boxIdClara);
    const allFiles = await getFolderItems(submitterFolder);
    let filearrayChair = responseChair.entries;
    let filearrayClara = responseClara.entries;
    let filearrayAllFiles = allFiles.entries;

    // let fileinfo = await getFileInfo(1169802034671);
    // let filename = fileinfo.name;
    // //let allFiles = await getFolderItems(submitterFolder);
    // //let entries = allFiles.entries;
    // console.log(filename);
    // let test = allFiles.entries.find(element => element.name === filename);
    // console.log(test.id);


    const filesIncompleted = [];
    for (let obj of filearrayChair) {
      let tasks = await getTaskList(obj.id);
      if (tasks.entries.length != 0) {
        for (let items of tasks.entries) {
          for (let itemtasks of items.task_assignment_collection.entries) {
            if (itemtasks.status === 'incomplete') {
              if (filesIncompleted.findIndex(element => element.id === itemtasks.item.id) === -1){
                filesIncompleted.push(itemtasks.item);
              }
            }
          }
        }
      }
    }

    const filesClaraIncompleted = []
    for (let obj of filearrayClara) {
      let tasks = await getTaskList(obj.id);
      if (tasks.entries.length != 0) {
        for (let items of tasks.entries) {
          for (let itemtasks of items.task_assignment_collection.entries) {
            if (itemtasks.status === 'incomplete') {
              if (filesClaraIncompleted.findIndex(element => element.id === itemtasks.item.id) === -1){
                filesClaraIncompleted.push(itemtasks.item);
              }
            }
          }
        }
      }
    }
    console.log(filesIncompleted);

  const message = messagesForChair[userChairItem.id];
  console.log(message);
  //   let template = `
  //                   <div class="general-bg padding-bottom-1rem">
  //                       <div class="container body-min-height">
  //                           <div class="main-summary-row">
  //                               <div class="align-left">
  //                                   <h1 class="page-header">${message}</h1>
  //                               </div>
  //                           </div>
  //                           <div class="data-submission div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem;">
  //                               <ul class='nav nav-tabs mb-3' role='tablist'>
  //                                    <li class='nav-item active' role='presentation'>
  //                                        <a class='nav-link' id='recommendationTab' href='#recommendation' data-mdb-toggle="tab" role='tab' aria-controls='recommendation' aria-selected='true'> Submit concept recommendation</a>
  //                                    </li>
  //                                    <li class='nav-item' role='presentation'>
  //                                        <a class='nav-link' id='conceptNeedingClarificationTab' href='#conceptNeedingClarification' data-mdb-toggle="tab" role='tab' aria-controls='conceptNeedingClarification' aria-selected='true'>Concept Needing Clarification</a>
  //                                    </li>
  //                                   <li class='nav-item' role='presentation'>
  //                                     <a class='nav-link' id='daccDecisionTab' href='#daccDecision' data-mdb-toggle="tab" role='tab' aria-controls='daccDecision' aria-selected='true'> DACC Decision </a>
  //                                   </li>
  //                               </ul>
  //                               <div class="tab-content" id="selectedTab"></div>  
  //                           </div>
  //                       </div>
  //                   </div>
  //               `;

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
                            <a class='nav-link' id='recommendationTab' href='#recommendation' data-mdb-toggle="tab" role='tab' aria-controls='recommendation' aria-selected='true'> New Concepts for Review</a>
                        </li>
                        <li class='nav-item' role='presentation'>
                            <a class='nav-link' id='conceptNeedingClarificationTab' href='#conceptNeedingClarification' data-mdb-toggle="tab" role='tab' aria-controls='conceptNeedingClarification' aria-selected='true'>Concepts Requiring Clarifications</a>
                        </li>
                      <li class='nav-item' role='presentation'>
                        <a class='nav-link' id='daccDecisionTab' href='#daccDecision' data-mdb-toggle="tab" role='tab' aria-controls='daccDecision' aria-selected='true'> DACC Decision </a>
                      </li>
                  </ul>
                  <div class="tab-content" id="selectedTab">`;

    template += `<div class='tab-pane fade show active'
                  id='recommendation' role='tabpanel'
                  aria-labeledby='recommendationTab'>
                  <a href="mailto:${chairsInfo.find(element => element.email === JSON.parse(localStorage.getItem('parms')).login).dacc.join("; ")}" id='email' class='btn btn-dark'>Send Email to DACC</a>`;
    template += renderFilePreviewDropdown(filesIncompleted, "recommendation");

    template += `<div class='tab-pane fade' 
                  id='conceptNeedingClarification' role='tabpanel' 
                  aria-labeledby='conceptNeedingClarificationTab'>
                  <a href="mailto:${chairsInfo.find(element => element.email === JSON.parse(localStorage.getItem('parms')).login).dacc.join("; ")}" id='email' class='btn btn-dark'>Send Email to DACC</a>`;
    template += renderFilePreviewDropdown(filesClaraIncompleted, "conceptNeedingClarification");

    template += `<div class='tab-pane fade'
                  id='daccDecision' role='tabpanel'
                  aria-labeledby='daccDecisionTab'>
                  daccDecisionTab tab  content 
                  </div>`
                  //<a href="mailto:${chairsInfo.find(element => element.email === JSON.parse(localStorage.getItem('parms')).login).dacc.join("; ")}" id='email' class='btn btn-dark'>Send Email to DACC</a>`;
    template += `<div id='filePreview'>`;
    //template += `<div id='filePreview'>`;
    if (filesIncompleted.length !== 0 ||
        filesClaraIncompleted.length !== 0) {
        template += `
            <div class='row'>
              <div id='boxFilePreview' class="col-8 preview-container"></div>
              <div id='fileComments' class='col-4 mt-2'></div>
            </div>

            <div id='finalChairDecision' class="card-body submit-comment-recommendation" style="background-color:#f6f6f6; display:none">
              <form>
                <label for="message">Enter Message for submitter</label>
                <div class='text-muted small'>Submitter will only see the below comment after final decision is made. </div>
                <label for="grade">Select recommendation: </label>
              <select name="grade" id="grade2"></option>
                <option value = "1"> 1 - Approved as submitted</option>
                <option value = "2"> 2 - Approved, pending conditions/clarification of some issues </option>
                <option value = "3"> 3 - Approved, but data release will be delayed </option>
                <option value = "4"> 4 - Not approved </option>
                <option value = "5"> 5 - Decision requires clarification</option>
                <option value = "777"> 777 - Duplicate Proposal</option>
                </select>
              <br>
                <div class="input-group">
                    <textarea id="message" name="message" rows="6" cols="65"></textarea>
                </div>
                <button type="submit" class="buttonsubmit" value="submitted" onclick="this.classList.toggle('buttonsubmit--loading')">
                  <span class="buttonsubmit__text"> Submit </span></button>
              </form>
            </div>
            `;
      }
    template += `
        </div>
      </div>
    `;
    // template += `<div class='tab-pane fade'
    // id='daccDecision' role='tabpanel'
    // aria-labeledby='daccDecision'>daccDecisionTab tab  content </div>
    // <a href="mailto:${chairsInfo.find(element => element.email === JSON.parse(localStorage.getItem('parms')).login).dacc.join("; ")}" id='email' class='btn btn-dark'>Send Email to DACC</a>`;
    // // TODO: For Concept Needing Clarification Tab
    // template += `<div class='tab-pane fade' id='conceptNeedingClarification' role='tabpanel' aria-labeledby='conceptNeedingClarification'>`;
    // template += renderFilePreviewDropdown(filesClaraIncompleted, "conceptNeedingClarification");
    // template += `<div id='filePreview'>`;
    // if (filesClaraIncompleted.length !== 0) {
    //     template += `
    //         <div class='row'>
    //           <div id='boxFileClaraPreview' class="col-12 preview-container"></div>
    //         </div>
    //         <div id='finalClaraDecision' class="card-body submit-comment-conceptNeedingClarification" style="background-color:#f6f6f6;">
    //           <form>
    //             <label for="message">Enter Message for submitter or the DACC</label>
    //             <div class='text-muted small'>Submitter will only see the below comment after approve or deny. </div>
    //             <label for="grade">Select recommendation: </label>
    //           <select name="grade" id="grade2"></option>
    //             <option value = "1"> 1 - Approved as submitted</option>
    //             <option value = "2"> 2 - Approved, pending conditions/clarification of some issues </option>
    //             <option value = "3"> 3 - Approved, but data release will be delayed </option>
    //             <option value = "4"> 4 - Not approved </option>
    //             <option value = "5"> 5 - Decision pending clarification of several issues</option>
    //             <option value = "777"> 777 - Duplicate Proposal</option>
    //             </select>
    //           <br>
    //             <div class="input-group">
    //                 <textarea id="message" name="message" rows="6" cols="65"></textarea>
    //             </div>
    //             <button type="submit" class="buttonsubmit" value="submitted" onclick="this.classList.toggle('buttonsubmit--loading')">
    //               <span class="buttonsubmit__text"> Submit </span></button>
    //           </form>
    //         </div>
    //         `;
    //   }
    // template += `
    //     </div></div>
    // `;
    //document.getElementById("selectedTab").innerHTML = template;
    document.getElementById("chairFileView").innerHTML = template;
    viewFinalDecisionFilesTemplate(filearrayAllFiles);
    commentSubmit();
    downloadAll('recommendation', filesIncompleted)
    downloadAll('conceptNeedingClarification', filesClaraIncompleted)
    if (!!filesIncompleted.length) {
      showPreview(filesIncompleted[0].id);
      switchFiles("recommendation");
      document.getElementById(
        "recommendationselectedDoc"
      ).children[0].selected = true;
    } else {
      document.getElementById("filePreview").classList.remove("d-block");
      document.getElementById("filePreview").classList.add("d-None");
    }

    // if (!!filesClaraIncompleted.length) {
    //   console.log({filesClaraIncompleted})
    //   showPreview(filesClaraIncompleted[0].id, 'boxFileClaraPreview');
    //   switchFiles("conceptNeedingClarification", 'boxFileClaraPreview');
    //   document.getElementById(
    //     "conceptNeedingClarification"
    //   ).children[0].selected = true;
    //   commentSubmit('conceptNeedingClarification');
    // } else {
    //   document.getElementById("filePreview").classList.remove("d-block");
    //   document.getElementById("filePreview").classList.add("d-none");
    // }
    //Switch Tabs
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
    if (localStorage.getItem("currentTab")) {
      const currTab = localStorage.getItem("currentTab");
      if (document.getElementById(currTab) != null) {
        document.getElementById(currTab).click();
      }
    }
    //return template;
  hideAnimation();
}

export const chairMenuTemplate = () => {
  //const userInfo = JSON.parse(localStorage.getItem('parms'))
  //console.log('user info: ', userInfo, localStorage.getItem('parms'))
  //if (!userInfo) return;
  const userEmail = JSON.parse(localStorage.parms).login;
  const userForChair = chairsInfo.find(item => item.email === userEmail)
  if (userForChair === -1) return;
  let template = `
  <div class="general-bg body-min-height padding-bottom-1rem">
    <div id="chairFileView" class="align-left"></div>
  </div>
  `;

  return template;
  // const message = messagesForChair[userForChair.id]
  //   let template = `
  //                   <div class="general-bg padding-bottom-1rem">
  //                       <div class="container body-min-height">
  //                           <div class="main-summary-row">
  //                               <div class="align-left">
  //                                   <h1 class="page-header">${message}</h1>
  //                               </div>
  //                           </div>
  //                           <div class="data-submission div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem;">
  //                               <ul class='nav nav-tabs mb-3' role='tablist'>
  //                                    <li class='nav-item active' role='presentation'>
  //                                        <a class='nav-link' id='recommendationTab' href='#recommendation' data-mdb-toggle="tab" role='tab' aria-controls='recommendation' aria-selected='true'> Submit concept recommendation</a>
  //                                    </li>
  //                                    <li class='nav-item' role='presentation'>
  //                                        <a class='nav-link' id='conceptNeedingClarificationTab' href='#conceptNeedingClarification' data-mdb-toggle="tab" role='tab' aria-controls='conceptNeedingClarification' aria-selected='true'>Concept Needing Clarification</a>
  //                                    </li>
  //                                   <li class='nav-item' role='presentation'>
  //                                     <a class='nav-link' id='daccDecisionTab' href='#daccDecision' data-mdb-toggle="tab" role='tab' aria-controls='daccDecision' aria-selected='true'> DACC Decision </a>
  //                                   </li>
  //                               </ul>
  //                               <div class="tab-content" id="selectedTab"></div>  
  //                           </div>
  //                       </div>
  //                   </div>
  //               `;
  //   return template;

}

export const commentSubmit = async () => {
  let submitComment = async (e) => {
    e.preventDefault();
    const btn = document.activeElement;
    btn.disabled = true;
    const filesToSend = [];
    const elements = document.querySelectorAll(
      `.tab-content .active option`
    );
    console.log({elements})
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].selected) {
        filesToSend.push(elements[i].value);
      }
    }
    for (const fileId of filesToSend) {
      console.log(fileId);
      let fileinfo = await getFileInfo(fileId);
      let filename = fileinfo.name;
      let allFiles = await getFolderItems(submitterFolder);
      let entries = allFiles.entries;
      console.log(filename);
      console.log(entries);
      let allFileMatch = entries.find(element => element.name === filename);
      let tasklist = await getTaskList(fileId);
      console.log(tasklist);
      let grade = e.target[0].value;
      let comment = e.target[1].value;
      let message = "Rating: " + grade + "\nComment: " + comment;
      console.log(message)
      await createComment(fileId, message);
      await createComment(allFileMatch.id, message);
      if (grade === "5"){
        let clariFolder = chairsInfo.find(element => element.email === JSON.parse(localStorage.getItem('parms')).login).boxIdClara
        await moveFile(fileId, clariFolder)
      } else {
          const taskEntries = tasklist.entries;
          if (taskEntries.length !== 0) {
            for (let entry of taskEntries) {
              for (let item of entry.task_assignment_collection.entries) {
                if (item.status === 'incomplete') {
                  await updateTaskAssignment(item.id, 'completed', 'You have completed your task')
                }
              }
            }
          }
        }
    }
    document.location.reload(true);
  };
  isElementLoaded('.nav-link.active').then((selector) => {
    console.log(selector);
    //console.log(document.querySelector('.nav-link.active'));
    const tab = document.querySelector('.nav-link.active').id.slice(0, -3);
    const form = document.querySelector(".submit-comment-" + tab);
    if (form) {
      form.addEventListener("submit", submitComment);
    }
  })
};

export const downloadAll = (tab, files) => {
  const downloadFile = async (e) => {
    console.log(files);
    files.forEach(async ({id}, index) => {
      console.log(id);
      let response = await getFileURL(id)
      let a = document.createElement('a');
      a.href = response;
      a.download = files[index].name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
  }

  isElementLoaded(`#${tab}-download-all`).then(() => {
    const downloadButton = document.querySelector(`#${tab}-download-all`);
    console.log({downloadButton});
    if (downloadButton) {
      downloadButton.addEventListener("click", downloadFile);
    }
  })
}

const isElementLoaded = async selector => {
  while ( document.querySelector(selector) === null) {
    await new Promise ( resolve => requestAnimationFrame(resolve))
  }
  return document.querySelector(selector);
}



export function viewFinalDecisionFilesColumns() {
  return `<div class="row m-0 pt-2 pb-2 align-left div-sticky" style="border-bottom: 1px solid rgb(0,0,0, 0.1); font-size: .8em">
    <div class="col-lg-3 text-left font-bold ws-nowrap header-sortable">Concept Name <button class="transparent-btn sort-column" data-column-name="Concept Name"><i class="fas fa-sort"></i></button></div>
    <div class="col-lg-1 text-left font-bold ws-nowrap header-sortable">Submission Date <button class="transparent-btn sort-column" data-column-name="Submission Date"><i class="fas fa-sort"></i></button></div>
    <div class="col-lg-1 text-center font-bold ws-nowrap header-sortable">Status <button class="transparent-btn sort-column" data-column-name="Status"><i class="fas fa-sort"></i></button></div>
    <div class="col-lg-1 text-center font-bold ws-nowrap header-sortable">AABCG<button class="transparent-btn sort-column" data-column-name="AABCGDecision"><i class="fas fa-sort"></i></button></div>
    <div class="col-lg-1 text-center font-bold ws-nowrap header-sortable">BCAC<button class="transparent-btn sort-column" data-column-name="BCACDecision"><i class="fas fa-sort"></i></button></div>
    <div class="col-lg-1 text-center font-bold ws-nowrap header-sortable">C-NCI<button class="transparent-btn sort-column" data-column-name="C-NCIDecision"><i class="fas fa-sort"></i></button></div>
    <div class="col-lg-1 text-center font-bold ws-nowrap header-sortable">CIMBA<button class="transparent-btn sort-column" data-column-name="CIMBADecision"><i class="fas fa-sort"></i></button></div>
    <div class="col-lg-1 text-center font-bold ws-nowrap header-sortable">LAGENO<button class="transparent-btn sort-column" data-column-name="LAGENODecision"><i class="fas fa-sort"></i></button></div>
    <div class="col-lg-1 text-center font-bold ws-nowrap header-sortable">MERGE<button class="transparent-btn sort-column" data-column-name="MERGEDecision"><i class="fas fa-sort"></i></button></div>
    <div class="col-lg-1 text-right font-bold ws-nowrap header-sortable"></div>
  </div>`;
}

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
                      <span class="font-size-10"> <h6 class="badge badge-pill badge-1">1</h6>: Approved as submitted 
                                                  <h6 class="badge badge-pill badge-2">2</h6>: Approved, pending conditions 
                                                  <h6 class="badge badge-pill badge-3">3</h6>: Approved, but data release delayed 
                                                  <h6 class="badge badge-pill badge-4">4</h6>: Not Approved 
                                                  <h6 class="badge badge-pill badge-5">5</h6>: Decision requires clarification 
                                                  <h6 class="badge badge-pill badge-777">777</h6>: Duplicate </span>
                      <div id="filterData" class="align-left"></div>
                  </div>
              </div>
          </div>
      </div>
      </div>
      <!--div class='table-responsive'>
      <table class='table'-->
      <div class='col-xl-12 pr-0'>`;
    template += viewFinalDecisionFilesColumns();
    template += '<div id="files"> </div>';
    template += '<!--tbody id="files"-->';
  } else {
    template += `
              No files to show.            
    </div>
    </div>`;
  }
  document.getElementById("daccDecision").innerHTML = template;
  if (filesInfo.length !== 0) {
    await viewFinalDecisionFiles(filesInfo);
    for (const file of filesInfo) {
      document
        .getElementById(`study${file.id}`)
        .addEventListener("click", showCommentsDCEG(file.id));
    }
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

export async function viewFinalDecisionFiles(files) {
  let template = "";
  for (const fileInfo of files) {
    const fileId = fileInfo.id;
    //console.log(fileInfo);
    let filename = fileInfo.name.slice(0,-19);
    const shortfilename = filename.length > 25 ? filename.substring(0, 24) + "..." : filename;
    let completion_date = await getChairApprovalDate(fileId);
    template += `
  <div class="card mt-1 mb-1 align-left" >
    <div style="padding: 10px" aria-expanded="false" id="file${fileId}" class='filedata'>
        <div class="row">
            <div class="col-lg-3 text-left">${shortfilename}<button class="btn btn-lg custom-btn preview-file" title='Preview File' data-file-id="${fileId}" aria-label="Preview File"  data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#bcrppPreviewerModal"><i class="fas fa-external-link-alt"></i></button></div>
            <div class="col-lg-1 text-left">${new Date(fileInfo.created_at).toDateString().substring(4)}</div>
            <div class="col-lg-1 text-center">Ongoing</div>
            <div class="col-lg-1 text-center" id="AABCG${fileId}" data-value="AABCG">--</div>
            <div class="col-lg-1 text-center" id="BCAC${fileId}" data-value="BCAC">--</div>
            <div class="col-lg-1 text-center" id="C-NCI${fileId}" data-value="C-NCI">--</div>
            <div class="col-lg-1 text-center" id="CIMBA${fileId}" data-value="CIMBA">--</div>
            <div class="col-lg-1 text-center" id="LAGENO${fileId}" data-value="LAGENO">--</div>
            <div class="col-lg-1 text-center" id="MERGE${fileId}" data-value="MERGE">--</div>
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
            <div class="row mb-1 m-0">
              <div id='file${fileId}Comments' class='col-12'></div>
            </div>
        </div>
        </div>
      </div>
    </div>`;
  }
  template += `</div></div></div></div>`;
  if (document.getElementById("files") != null)
    document.getElementById("files").innerHTML = template;
}

export const authTableTemplate = () => {
  //const userInfo = JSON.parse(localStorage.getItem('parms'))
  //console.log('user info: ', userInfo, localStorage.getItem('parms'))
  //if (!userInfo) return;
  const userEmail = JSON.parse(localStorage.parms).login;
  const userForAuth = emailsAllowedToUpdateData.includes(userEmail);
  if (!userForAuth) return;
  let template = `
  <div class="general-bg padding-bottom-1rem">
          <div class="container body-min-height">
              <div class="main-summary-row">
                  <div class="align-left">
                      <h1 class="page-header">Admin Table View</h1>
                  </div>  
              </div>
              <div class="data-submission div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem;">
                  <div class="tab-content" id="selectedTab">
                    <div class="tab-pane fade show active" id="daccDecision" role="tabpanel" aria-labeledby="daccDecisionTab">
                      <div id="authTableView" class="align-left"></div>
                        <button type="submit" class="buttonsubmit" id="returnSubmitter" onclick="this.classList.toggle('buttonsubmit--loading')">
                          <span class="buttonsubmit__text"> Return to Submitter </span></button>
                        <button type="submit" class="buttonsubmit" id="returnChairs" onclick="this.classList.toggle('buttonsubmit--loading')">
                          <span class="buttonsubmit__text"> Return to Chairs </span></button>
                        <a href="mailto:mkh39@medschl.cam.ac.uk; xjahuang@ucdavis.edu; vzavala@ucdavis.edu; r.santos@qub.ac.uk; guochong.jia@vumc.org; thomas.ahearn@nih.gov?subject=Confluence Data Coordinating Centers" id='email' class='btn btn-dark'>Send Email to DACC</a>
                    </div>
                  </div>
              </div>
          </div>
  </div>
  `;

  return template;
}

export const generateAuthTableFiles = async () => {
  const allFilessub = await getFolderItems(submitterFolder);
  const allFilescom = await getFolderItems(completedFolder);
  let filearrayAllFilesSub = allFilessub.entries;
  let filearrayAllFilesCom = allFilescom.entries;

  //document.getElementById("authTableView").innerHTML = template;
  viewAuthFinalDecisionFilesTemplate(filearrayAllFilesSub, filearrayAllFilesCom);
  commentSubmit();
  returnToChairs();
  returnToSubmitter();
  hideAnimation();
}

export async function viewAuthFinalDecisionFilesTemplate(filesSub, filesCom) {
  let template = "";
  let filesInfoSub = [];
  let filesInfoCom = [];
  for (const file of filesSub) {
    const fileInfo = await getFileInfo(file.id);
    filesInfoSub.push(fileInfo);
  }
  for (const file of filesCom) {
    const fileInfo = await getFileInfo(file.id);
    filesInfoCom.push(fileInfo);
  }
  if (filesInfoSub.length > 0 || filesInfoCom.length > 0) {
    template += `
    <div id='decidedFiles'>
    <div class='row'>
      <div class="col-xl-12 filter-column" id="summaryFilterSiderBar">
          <div class="div-border white-bg align-left p-2">
              <div class="main-summary-row">
                  <div class="col-xl-12 pl-1 pr-0">
                      <span class="font-size-10"> <h6 class="badge badge-pill badge-1">1</h6>: Approved as submitted 
                                                  <h6 class="badge badge-pill badge-2">2</h6>: Approved, pending conditions 
                                                  <h6 class="badge badge-pill badge-3">3</h6>: Approved, but data release delayed 
                                                  <h6 class="badge badge-pill badge-4">4</h6>: Not Approved 
                                                  <h6 class="badge badge-pill badge-5">5</h6>: Decision requires clarification 
                                                  <h6 class="badge badge-pill badge-777">777</h6>: Duplicate </span>
                      <div id="filterData" class="align-left"></div>
                  </div>
              </div>
          </div>
      </div>
      </div>
      <!--div class='table-responsive'>
      <table class='table'-->
      <div class='col-xl-12 pr-0'>`;
    template += viewFinalDecisionFilesColumns();
    template += '<div id="files"> </div>';
    template += '<!--tbody id="files"-->';
  } else {
    template += `
              No files to show.            
    </div>
    </div>`;
  }
  document.getElementById("authTableView").innerHTML = template;
  if (filesInfoSub.length !== 0 || filesInfoCom.length !== 0) {
    await viewAuthFinalDecisionFiles(filesInfoSub, filesInfoCom);
    for (const file of filesInfoSub) {
      document
        .getElementById(`study${file.id}`)
        .addEventListener("click", showCommentsDCEG(file.id));
    }
    for (const file of filesInfoCom) {
      document
        .getElementById(`study${file.id}`)
        .addEventListener("click", showCommentsDCEG(file.id));
    }
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

export async function viewAuthFinalDecisionFiles(filesInfoSub, filesInfoCom) {
  let template = "";
  for (const fileInfo of filesInfoSub) {
    const fileId = fileInfo.id;
    //console.log(fileInfo);
    let filename = fileInfo.name.slice(0,-19);
    const shortfilename = filename.length > 25 ? filename.substring(0, 24) + "..." : filename;
    let completion_date = await getChairApprovalDate(fileId);
    template += `
  <div class="card mt-1 mb-1 align-left" >
    <div style="padding: 10px" aria-expanded="false" id="file${fileId}" class='filedata'>
        <div class="row authTable">
            <div class="col-lg-3 text-left"><input type="checkbox" class = "pl" id="${fileId}" name="${fileId}" value="${fileInfo.name}"><label for="${fileId}">${shortfilename}</label><button class="btn btn-lg custom-btn preview-file" title='Preview File' data-file-id="${fileId}" aria-label="Preview File"  data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#bcrppPreviewerModal"><i class="fas fa-external-link-alt"></i></button></div>
            <div class="col-lg-1 text-left">${new Date(fileInfo.created_at).toDateString().substring(4)}</div>
            <div class="col-lg-1 text-center">Ongoing</div>
            <div class="col-lg-1 text-center consTable" id="AABCG${fileId}" data-value="AABCG">--</div>
            <div class="col-lg-1 text-center consTable" id="BCAC${fileId}" data-value="BCAC">--</div>
            <div class="col-lg-1 text-center consTable" id="C-NCI${fileId}" data-value="C-NCI">--</div>
            <div class="col-lg-1 text-center consTable" id="CIMBA${fileId}" data-value="CIMBA">--</div>
            <div class="col-lg-1 text-center consTable" id="LAGENO${fileId}" data-value="LAGENO">--</div>
            <div class="col-lg-1 text-center consTable" id="MERGE${fileId}" data-value="MERGE">--</div>
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
            <div class="row mb-1 m-0">
              <div id='file${fileId}Comments' class='col-12'></div>
            </div>
        </div>
        </div>
      </div>
    </div>`;
  }
  for (const fileInfo of filesInfoCom) {
    const fileId = fileInfo.id;
    //console.log(fileInfo);
    let filename = fileInfo.name.slice(0,-19);
    const shortfilename = filename.length > 25 ? filename.substring(0, 24) + "..." : filename;
    let completion_date = await getChairApprovalDate(fileId);
    template += `
  <div class="card mt-1 mb-1 align-left" >
    <div style="padding: 10px" aria-expanded="false" id="file${fileId}" class='filedata'>
        <div class="row authTable">
            <div class="col-lg-3 text-left"><label for="${fileId}">${shortfilename}</label><button class="btn btn-lg custom-btn preview-file" title='Preview File' data-file-id="${fileId}" aria-label="Preview File"  data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#bcrppPreviewerModal"><i class="fas fa-external-link-alt"></i></button></div>
            <div class="col-lg-1 text-left">${new Date(fileInfo.created_at).toDateString().substring(4)}</div>
            <div class="col-lg-1 text-center">Returned</div>
            <div class="col-lg-1 text-center consTable" id="AABCG${fileId}" data-value="AABCG">--</div>
            <div class="col-lg-1 text-center consTable" id="BCAC${fileId}" data-value="BCAC">--</div>
            <div class="col-lg-1 text-center consTable" id="C-NCI${fileId}" data-value="C-NCI">--</div>
            <div class="col-lg-1 text-center consTable" id="CIMBA${fileId}" data-value="CIMBA">--</div>
            <div class="col-lg-1 text-center consTable" id="LAGENO${fileId}" data-value="LAGENO">--</div>
            <div class="col-lg-1 text-center consTable" id="MERGE${fileId}" data-value="MERGE">--</div>
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
            <div class="row mb-1 m-0">
              <div id='file${fileId}Comments' class='col-12'></div>
            </div>
        </div>
        </div>
      </div>
    </div>`;
  }
  template += `</div></div></div></div>`;
  if (document.getElementById("files") != null)
    document.getElementById("files").innerHTML = template;
}

export const returnToChairs = () => {
  const returnChairs = async (e) => {
    e.preventDefault();
    const btn = document.activeElement;
    console.log("return to chairs selected");
    var inputsChecked = document.querySelectorAll('.pl');
    for (var checkbox of inputsChecked){
      if (checkbox.checked){
        for (var checkedCons of checkbox.parentElement.parentElement.getElementsByClassName("consTable")){
          if (checkedCons.innerHTML != '--') {
            let cons = checkedCons.getAttribute('data-value');
            const info = chairsInfo.find(object => {
              return object.consortium === cons;
            });
            let newBoxFiles = await getFolderItems(info.boxIdNew);
            console.log(newBoxFiles);
            var itemFound = false;
            for (let item of newBoxFiles.entries){
              if(item.name === checkbox.value){
                let createTask = await createCompleteTask(item.id, "Returning to complete your review");
                console.log(createTask);
                let assignedTask = await assignTask(createTask.id, info.email);
                console.log(assignedTask);
                console.log("Found " + item.name);
                itemFound = true;
              }
            }
            if (!itemFound){
              let claraBoxFiles = await getFolderItems(info.boxIdClara);
              console.log(claraBoxFiles);
              for (let item of claraBoxFiles.entries){
                if(item.name === checkbox.value){
                  let createTask = await createCompleteTask(item.id, "Returning to complete your review");
                  console.log(createTask);
                  let assignedTask = await assignTask(createTask.id, info.email);
                  console.log(assignedTask);
                  console.log("Found " + item.name);
                  itemFound = true;
                }
              }
            } else {
              console.log("item not found");
            }
          }
        }
      }
    }
    btn.classList.toggle("buttonsubmit--loading");
  }
  
  const returnChairsButton = document.querySelector(`#returnChairs`);
    if (returnChairsButton) {
      returnChairsButton.addEventListener("click", returnChairs);
    }
}
//Returning submission to submitter
export const returnToSubmitter = () => {
  const returnSubmitter = async (e) => {
    e.preventDefault();
    const btn = document.activeElement;
    var inputsChecked = document.querySelectorAll('.pl');
    for (var checkbox of inputsChecked){
      if (checkbox.checked){
        console.log(checkbox.id);
        let fileSelected = await getFileInfo(checkbox.id);
        let fileName = fileSelected.name;
        let userFound = fileSelected.created_by.login;
        let submittedItems = await getFolderItems(returnToSubmitterFolder);
        let folderID = "none";
        for (let item of submittedItems.entries){
          if(item.name === userFound){
            folderID = item.id
          }
        }
        let cpFileId = "";
        if (folderID == "none") {
          const newFolder = await createFolder(returnToSubmitterFolder, userFound);
          await addNewCollaborator(
            newFolder.id,
            "folder",
            userFound,
            "viewer"
          );
          const cpFile = await copyFile(checkbox.id, newFolder.id);
          cpFileId = cpFile.id;
        } else {
          const cpFile = await copyFile(checkbox.id, folderID);
          cpFileId = cpFile.id;
        }
        for (let info of chairsInfo){
          let fileFound = false;
          console.log(info.boxIdNew);
          let files = await getFolderItems(info.boxIdNew);
          for (let file of files.entries) {
            console.log(file);
            if (file.name === fileName) {
              fileFound = true;
              console.log(fileName);
              await moveFile(file.id, info.boxIdComplete);
              break;
            }
          }
          if (!fileFound){
            files = await getFolderItems(info.boxIdClara);
            for (let file of files.entries) {
              console.log(file);
              if (file.name === fileName) {
                fileFound = true;
                console.log(fileName);
                await moveFile(file.id, info.boxIdComplete);
                break;
              }
            }
          }
        }
        await moveFile(checkbox.id, completedFolder);
      }
    }
    btn.classList.toggle("buttonsubmit--loading");
  }
  
  const returnSubmitterButton = document.querySelector(`#returnSubmitter`);
    if (returnSubmitterButton) {
      returnSubmitterButton.addEventListener("click", returnSubmitter);
    }
}