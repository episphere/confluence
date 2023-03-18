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

  deleteTask

} from "../shared.js";

export function renderFilePreviewDropdown(files, tab) {

  console.log({files})

    let template = "";

    if (!Array.isArray(files)) {

      return template;

    }

    template += `<a href="mailto:${chairsInfo.find(element => element.email === JSON.parse(localStorage.getItem('parms')).login).dacc.join(

      "; "

    )}" id='email' class='btn btn-dark'>Send Email to DACC</a>`

 

    if (files.length != 0) {

      if (

        //tab !== "daccReview" &&

        //tab !== "dacctoBeCompleted" &&

        //tab !== "completed" &&

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

export function switchFiles(tab, div_id = '') {

   console.log('switchFile:', tab,document.getElementById(`${tab}selectedDoc`) )

    document

      .getElementById(`${tab}selectedDoc`)

      .addEventListener("change", (e) => {

        const file_id = e.target.value;

        showPreview(file_id, div_id);

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

    const responseChair = await getFolderItems(userChairItem.boxIdNew);

    const responseClara = await getFolderItems(userChairItem.boxIdClara);

    let filearrayChair = responseChair.entries;

    let filearrayClara = responseClara.entries;

    const filesIncompleted = [];

    for (let obj of filearrayChair) {

      let tasks = await getTaskList(obj.id);

      if (tasks.entries.length != 0) {

        for (let items of tasks.entries) {

          for (let itemtasks of items.task_assignment_collection.entries) {

            if (itemtasks.status === 'incomplete') {

              filesIncompleted.push(itemtasks.item);

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

              filesClaraIncompleted.push(itemtasks.item);

            }

          }

        }

      }

    }

    template += `<div class='tab-pane fade show active'

                  id='recommendation' role='tabpanel'

                  aria-labeledby='recommendationTab'>`;

    template += renderFilePreviewDropdown(filesIncompleted, "recommendation");

    template += `<div id='filePreview'>`;

    if (filesIncompleted.length !== 0) {

        template += `

            <div class='row'>

              <div id='boxFilePreview' class="col-12 preview-container"></div>

            </div>

            <div id='finalChairDecision' class="card-body submit-comment-recommendation" style="background-color:#f6f6f6;">

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

    template += `<div class='tab-pane fade'

    id='daccDecision' role='tabpanel'

    aria-labeledby='daccDecision'>daccDecisionTab tab  content </div>`;




    // TODO: For Concept Needing Clarification Tab

    template += `<div class='tab-pane fade' id='conceptNeedingClarification' role='tabpanel'

    aria-labeledby='conceptNeedingClarification'>`;




    template += renderFilePreviewDropdown(filesClaraIncompleted, "conceptNeedingClarification");

    template += `<div id='filePreview'>`;

    if (filesClaraIncompleted.length !== 0) {

        template += `

            <div class='row'>

              <div id='boxFileClaraPreview' class="col-12 preview-container"></div>

            </div>

            <div id='finalClaraDecision' class="card-body submit-comment-conceptNeedingClarification" style="background-color:#f6f6f6;">

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

                <button type="submit" class="buttonsubmit" value="submitted" onclick="this.classList.toggle('buttonsubmit--loading')">

                  <span class="buttonsubmit__text"> Submit </span></button>

              </form>

            </div>

            `;

      }




    template += `

        </div></div>

    `;




    document.getElementById("selectedTab").innerHTML = template;

    if (!!filesIncompleted.length) {

      showPreview(filesIncompleted[0].id);

      switchFiles("recommendation");

      document.getElementById(

        "recommendationselectedDoc"

      ).children[0].selected = true;

      commentSubmit('recommendation');

    } else {

      document.getElementById("filePreview").classList.remove("d-block");

      document.getElementById("filePreview").classList.add("d-none");

    }




    if (!!filesClaraIncompleted.length) {

      console.log({filesClaraIncompleted})

      showPreview(filesClaraIncompleted[0].id, 'boxFileClaraPreview');

      switchFiles("conceptNeedingClarification", 'boxFileClaraPreview');

      document.getElementById(

        "conceptNeedingClarification"

      ).children[0].selected = true;

      commentSubmit('conceptNeedingClarification');

    } else {

      document.getElementById("filePreview").classList.remove("d-block");

      document.getElementById("filePreview").classList.add("d-none");

    }

    //Switch Tabs

    switchTabs(

      "recommendation",

      ["daccDecision", 'conceptNeedingClarification']

    );

    switchTabs(

      "conceptNeedingClarification",

      ["recommendation", 'daccDecision']

    );

    switchTabs(

      "daccDecision",

      ["recommendation", 'conceptNeedingClarification']

    );




    if (localStorage.getItem("currentTab")) {

      const currTab = localStorage.getItem("currentTab");

      if (document.getElementById(currTab) != null) {

        document.getElementById(currTab).click();

      }

    }

   

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

                                     <li class='nav-item active' role='presentation'>

                                         <a class='nav-link' id='recommendationTab' href='#recommendation' data-mdb-toggle="tab" role='tab' aria-controls='recommendation' aria-selected='true'> Submit concept recommendation</a>

                                     </li>

                                     <li class='nav-item' role='presentation'>

                                         <a class='nav-link' id='conceptNeedingClarificationTab' href='#conceptNeedingClarification' data-mdb-toggle="tab" role='tab' aria-controls='conceptNeedingClarification' aria-selected='true'>Concept Needing Clarification</a>

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

export const commentSubmit = (tab = 'recommendation') => {

  let submitComment = async (e) => {

    e.preventDefault();

    const btn = document.activeElement;

    btn.disabled = true;

    // let fileId = document.querySelector(

    //   ".tab-content .active #recommendationselectedDoc"

    // ).value; //document.getElementById('selectedDoc').value;

    // Send multiple files

    const filesToSend = [];

    const elements = document.querySelectorAll(

      `.tab-content .active #${tab}selectedDoc option`

    );

    console.log({elements})

    for (let i = 0; i < elements.length; i++) {

      if (elements[i].selected) {

        filesToSend.push(elements[i].value);

      }

    }

    for (const fileId of filesToSend) {

      let tasklist = await getTaskList(fileId);

      // if (tasklist.entries.length !== 0) {

      //   for (let item of tasklist.entries) {

      //     console.log({item})

       

      //     if (item.is_completed == false && item.action == "review") {

      //       for (let taskassignment of item.task_assignment_collection

      //         .entries) {

      //         if (

      //           taskassignment.assigned_to.login ==

      //           JSON.parse(localStorage.parms).login

      //         ) {

      //           var taskId = taskassignment.id;

      //         }

      //       }

      //     }

      //   }

      // }

      // let decision = e.submitter.value;

      let grade = e.target[0].value;

      let comment = e.target[1].value;

      let message = "Rating: " + grade + "\nComment: " + comment;

      // if (decision !== "daccReview") {

        // await updateTaskAssignment(taskId, decision, message);




      // }




      // TODO: this is require

      await createComment(fileId, message);




      // let fileInfo = await getFileInfo(fileId);

      // let uploaderName = fileInfo.created_by.login;

      // if (decision == "submitted") {

      // await copyFile(fileId, archivedFolder);

      // }




      // if (decision != "daccReview") {

        // let folderItems = await getFolderItems(submitterFolder);

        // let folderEntries = folderItems.entries;

        // let folderID = "none";

        // for (let obj of folderEntries) {

        //   if (obj.name == uploaderName) {

        //     folderID = obj.id;

        //   }

        // }

        // let cpFileId = "";

        // if (folderID == "none") {

        //   const newFolder = await createFolder(submitterFolder, uploaderName);

        //   await addNewCollaborator(

        //     newFolder.id,

        //     "folder",

        //     uploaderName,

        //     "viewer"

        //   );

        //   const cpFile = await copyFile(fileId, newFolder.id);

        //   cpFileId = cpFile.id;

        // } else {

        //   const cpFile = await copyFile(fileId, folderID);

        //   cpFileId = cpFile.id;

        // }

        // await createComment(cpFileId, "This file was " + decision);

        // await createComment(cpFileId, message);

        const taskEntries = tasklist.entries;

        if (taskEntries.length !== 0) {

          for (let entry of taskEntries) {

            for (let item of entry.task_assignment_collection.entries) {

              if (item.status === 'incomplete') {

                // TODO: this is required

                await updateTaskAssignment(item.id, 'completed', 'You have completed your task')

              }

            }

            // if (entry.is_completed == false) {

            //   await deleteTask(entry.id);

            // }

          }

        }

      // }

    }

    document.location.reload(true);

  };

  const form = document.querySelector(".submit-comment-" + tab);

  if (form) {

    form.addEventListener("submit", submitComment);

  }

};

export function viewFinalDecisionFilesColumns() {

  return `<div class="row m-0 pt-2 pb-2 align-left div-sticky" style="border-bottom: 1px solid rgb(0,0,0, 0.1);">

    <div class="col-lg-3 text-left font-bold ws-nowrap header-sortable">Concept Name <button class="transparent-btn sort-column" data-column-name="Concept Name"><i class="fas fa-sort"></i></button></div>

    <div class="col-lg-2 text-left font-bold ws-nowrap header-sortable">Submitted By <button class="transparent-btn sort-column" data-column-name="Submitted By"><i class="fas fa-sort"></i></button></div>

    <div class="col-lg-3 text-left font-bold ws-nowrap header-sortable">Submission Date <button class="transparent-btn sort-column" data-column-name="Submission Date"><i class="fas fa-sort"></i></button></div>

    <div class="col-lg-2 text-left font-bold ws-nowrap header-sortable">Decision<button class="transparent-btn sort-column" data-column-name="Decision"><i class="fas fa-sort"></i></button></div>

    <div class="col-lg-2 text-left font-bold ws-nowrap header-sortable">Decided On<button class="transparent-btn sort-column" data-column-name="Decision Date"><i class="fas fa-sort"></i></button></div>

  </div>`;

}

export async function viewFinalDecisionFilesTemplate(files) {

  let template = "";

  let filesInfo = [];

  for (const file of files) {

    const fileInfo = await getFileInfo(file.id);

    console.log({fileInfo})

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

                      <span class="font-size-17 font-bold">Filter</span>

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

        .addEventListener("click", showCommentsDropDown(file.id));

    }

    let btns = Array.from(document.querySelectorAll(".preview-file"));

    btns.forEach((btn) => {

      btn.addEventListener("click", (e) => {

        btn.dataset.target = "#bcrppPreviewerModal";

        const header = document.getElementById("bcrppPreviewerModalHeader");

        const body = document.getElementById("bcrppPreviewerModalBody");

        header.innerHTML = `<h5 class="modal-title">File preview</h5>

                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">

                                        <span aria-hidden="true">&times;</span>

                                    </button>`;

        const fileId = btn.dataset.fileId;

        $("#bcrppPreviewerModal").modal("show");

        showPreview(fileId, "bcrppPreviewerModalBody");

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

    let filename = fileInfo.name.split("_").slice(0, -4).join(" ");

    const shortfilename =

      filename.length > 21 ? filename.substring(0, 20) + "..." : filename;

    let completion_date = await getChairApprovalDate(fileId);

    template += `

<div class="card mt-1 mb-1 align-left" >

    <div style="padding: 10px" aria-expanded="false" id="file${fileId}" class='filedata'>

        <div class="row">

            <div class="col-lg-3 text-left">${shortfilename}<button class="btn btn-lg custom-btn preview-file" title='Preview File' data-file-id="${fileId}" aria-label="Preview File"  data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#bcrppPreviewerModal"><i class="fas fa-external-link-alt"></i></button></div>

            <div class="col-lg-2 text-left">${fileInfo.created_by.name}</div>

            <div class="col-lg-2 text-center">${new Date(fileInfo.created_at)

              .toDateString()

              .substring(4)}</div>

            <div class="col-lg-2 pl-6 text-right">${

              fileInfo.parent.name === "approved"

                ? '<h6 class="badge badge-pill badge-success">Approved</h6>'

                : fileInfo.parent.name === "denied"

                ? '<h6 class="badge badge-pill badge-danger">Denied</h6>'

                : '<h6 class="badge badge-pill badge-warning">Under Review</h6>'

            }</div>

            <div class="col-lg-2 pl-6 text-right">${completion_date}</div>

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