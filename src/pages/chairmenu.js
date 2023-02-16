import { showPreview } from "../components/boxPreview.js";
import { getFolderItems } from "../shared.js";
export function renderFilePreviewDropdown(files, tab) {
    let template = "";
    if (!Array.isArray(files)) {

      return template;

    }
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

                      <div class='text-muted small'>Hold Ctrl to select multiple concept forms </div>

                  </label>
                  <br>
                  <select id='${tab}selectedDoc' multiple size='3'>
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
export const generateChairMenuFiles = async () => {

    let template = '';

    template += "<div class='tab-content' id='selectedTab'>";

    const responseChair = await getFolderItems(194173772220);

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

                <option value = "6"> 6 - Decision pending clarification of several issues</option>

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
    return template;
}
export const chairMenuTemplate = () => {

    let template = `
                    <div class="general-bg padding-bottom-1rem">

                        <div class="container body-min-height">
                            <div class="main-summary-row">
                                <div class="align-left">
                                    <h1 class="page-header">DACC Chair – Submit concept recommendation</h1>
                                </div>
                            </div>
                            <div class="data-submission div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem;">

                                <!-- <ul class='nav nav-tabs mb-3' role='tablist'>

                                     <li class='nav-item' role='presentation'>

                                         <a class='nav-link' id='daccCompletedTab' href='#chair_menu' data-mdb-toggle="tab" role='tab' aria-controls='chair_menu' aria-selected='true'> Review Completed </a>
                                     </li>
                                 </ul> -->
                                <div id="chairFileView" class="align-left"></div>  
                            </div>
                        </div>
                    </div>
                `;

    return template;

}