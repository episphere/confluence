import { submitterFolder, uploadWordFile } from "../shared.js"

export const formtemplate = () => {
  const date = new Date();
  const today = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
  let template = ` 
                <div class="general-bg padding-bottom-1rem">
                        <div class="container body-min-height">

                            <div class="main-summary-row">
                                <div class="align-left">
                                    <h1 class="page-header">Analysis Concept Form</h1>
                                </div>
                            </div>

                        <div class="data-submission div-border font-size-18" style="padding-left: 1rem;">             
                          <section class="contact-form">
                            <p> Please fill out the form below. This will be reviewed by the Data Access Coordination Committees (DACC) 
                            of the consortia participating in Confluence. For more information about the data access request process 
                            please see this description of the <a href="#data_access" target="_blank" rel="noopener noreferrer">data access request process </a> 
                            and the <a href="#join/description" target="_blank" rel="noopener noreferrer">individual consortia DACC guidelines</a>. 
                            Access to data for approved concepts will only be given to investigators listed below, each of whose Institutions 
                            will need to sign data transfer agreements with the data coordinating centers that are governing the requested data.
                            <form>

                            <div class="input-group">
                              <label for="date"><b>Date</b><span class='required-label'>*</span></label>
                              <input id="date" name="date" type="date" value='${today}' required/>
                            </div>

                            <div class="input-group">
                              <label for="projname"><b>Title of Proposed Project</b><span class='required-label'>*</span></label>
                              <input id="projname" name="projname" type="text" required/>
                            </div>
                            
                            <div class="input-group">
                                <label for="amendment"> <b>Is this an amendment?</b><span class='required-label'>*</span> </label>
                                    
                                    <input id="amendmentyes" name="amendment" type="radio" value="Yes" required/>
                                        <label class="ul-container" for="amendmentyes"> Yes </label>
                                    <input id="amendmentno" name="amendment" type="radio" value="No" required/>
                                        <label class="ul-container" for="amendmentno"> No </label>

                                <label for="ifamendmentyes"> <i> If yes, provide Concept Number of original form </i></label>
                                    <input type="text" id="conNum" name="conNum" />
                            </div>

                            <div class="input-group">
                              <label for="investigators"><b>Contact Investigator(s)</b><span class='required-label'>*</span></label>
                              <input id="investigators" name="investigators" type="text" required/>
                            </div>

                            <div class="input-group">
                              <label for="institution"><b>Institution</b><span class='required-label'>*</span></label>
                              <input id="institution" name="institution" type="text" required/>
                            </div>
                            
                            <div class="input-group">
                              <label for="email"><b>Contact E-mail</b><span class='required-label'>*</span></label>
                              <input id="email" name="email" type="email" required/>
                            </div>

                            <div class="input-group">
                                <label for="mem-con"><b>Member of Consortia?</b><span class='required-label'>*</span></label>
                            </div>
                            
                            <div class="input-group">
                              <div class="col-8">
                                <ul class="form" id='mem-conlist'>
                                  <div class="inline-field">
                                    <input id="mem-aabcg" name="mem-con" type="checkbox" value="AABCG"/>
                                    <label class="container-ul" for="mem-aabcg"> AABCG</label>
                                  </div>
                                  <div class="inline-field">
                                    <input id="mem-bcac" name="mem-con" type="checkbox" value="BCAC"/>
                                    <label class="container-ul" for="mem-bcac"> BCAC</label>
                                  </div>
                                  <div class="inline-field">
                                    <input id="mem-cimba" name="mem-con" type="checkbox" value="CIMBA"/>
                                    <label class="container-ul" for="mem-cimba"> CIMBA</label>
                                  </div>                                    
                                  <div class="inline-field">
                                    <input id="mem-nci-dceg" name="mem-con" type="checkbox" value="C-NCI"/>
                                    <label class="container-ul" for="mem-nci-dceg"> C-NCI</label>
                                  </div>
                                  <div class="inline-field">
                                    <input id="mem-lageno" name="mem-con" type="checkbox" value="LAGENO"/>
                                    <label class="container-ul" for="mem-lageno"> LAGENO</label>
                                  </div>
                                  <div class="inline-field">
                                    <input id="mem-merge" name="mem-con" type="checkbox" value="MERGE"> 
                                    <label class="container-ul" for="mem-merge"> MERGE</label>
                                  </div>
                                  <div class="inline-field">
                                    <input id="mem-none" name="mem-con" type="checkbox" value="None"/>
                                    <label class="container-ul" for="mem-none"> None</label>
                                  </div>
                                </ul>
                                <p><b>Note:</b> A fee is required to access BCAC data if you are not a BCAC member.</p>
                              </div>
                            </div>
                            
                            <div class="input-group">
                              <label for="acro"><b>Confluence Study Acronym(s) for the Contact Investigator</b><span class='required-label'>*</span></label>
                              <textarea id="acro" name="acro" rows="2" cols="65" required></textarea>
                            </div>

                            <div class="input-group">
                              <label for="otherinvest"><b>OTHER Investigators and their institutions</b><span class='required-label'>*</span></label>
                              <textarea id="otherinvest" name="otherinvest" rows="2" cols="65" required></textarea>
                            </div>

                            <div class="input-group">
                                <label for="allinvest"><b>ALL Investigators (and their institutions) who will require access to the data requested</b><span class='required-label'>*</span></label>
                                <textarea id="allinvest" name="allinvest" rows="2" cols="65" required></textarea>
                                <p><b>Note:</b> Datasets cannot be exchanged between institutions. See the data access request procedures for more information.</p>
                            </div>

                            <div class="input-group">
                                <label><input id="confirmation" name="confirmation" type="checkbox" value="Yes" required/><b> Please confirm that ALL the named investigators have read AND agreed to be named on this proposal?</b><span class='required-label'>*</span></label>
                            </div>

                            <div class="input-group">
                                <label for="data-con"><b>Consortia data being requested</b><span class='required-label'>*</span> <i>(please check all boxes that apply)</i></label>
                            </div>

                            <div class="input-group">
                              <div class="col-8">
                                <ul class="form">
                                  <div class="inline-field">
                                    <input id="consortia-aabcg" name="data-con" type="checkbox" value="AABCG"/>
                                    <label class="container-ul" for="consortia-aabcg"> AABCG</label>
                                  </div>
                                  <div class="inline-field">
                                    <input id="consortia-BCAC" name="data-con" type="checkbox" value="BCAC"/>
                                    <label class="container-ul" for="consortia-BCAC"> BCAC</label>
                                  </div>
                                  <div class="inline-field">
                                    <input id="consortia-cimba" name="data-con" type="checkbox" value="CIMBA"/>
                                    <label class="container-ul" for="consortia-cimba"> CIMBA</label>
                                  </div>                                  
                                  <div class="inline-field">
                                    <input id="consortia-c-nci" name="data-con" type="checkbox" value="C-NCI"/>
                                    <label class="container-ul" for="consortia-c-nci"> C-NCI</label>
                                  </div>
                                  <div class="inline-field">
                                    <input id="consortia-lageno" name="data-con" type="checkbox" value="LAGENO"/>
                                    <label class="container-ul" for="consortia-lageno"> LAGENO</label>
                                  </div>
                                  <div class="inline-field">
                                    <input id="consortia-merge" name="data-con" type="checkbox" value="MERGE"/>
                                    <label class="container-ul" for="consortia-merge"> MERGE</label>
                                  </div>
                                </ul>
                              </div>
                            </div>

                            <div class="input-group">
                              <label for="condesc"><b>Concept Description</b> <i> Please provide a concise description of Background/Aims</i><span class='required-label'>*</span></label>
                              <textarea id="condesc" name="condesc" rows="6" cols="65" required></textarea>
                            </div>

                            <div class="input-group">
                              <label for="prim-end"><b>Primary Endpoint</b><span class='required-label'>*</span><i> (please check box)</i> </label>
                            </div>

                            <div class="input-group">
                              <div class="inline-field">
                                <input id="consortia-bcr" name="prim-end" type="checkbox" value="Breast Cancer Risk"/>
                                <label class="container-ul" for="consortia-bcr"> Breast Cancer Risk</label>

                                <input id="sbc" name="prim-end" type="checkbox" value="Subtype of Breast Cancer"/>
                                <label class="container-ul" for="sbc"> Subtype of Breast Cancer</label>

                                <input id="sur" name="prim-end" type="checkbox" value="Survival"/>
                                <label class="container-ul" for="sur"> Survival</label>

                                <input id="other" name="prim-end" type="checkbox" value="Other"/>
                                <label class="container-ul" for="other"> Other</label>

                                <label for="otherinput"></label>
                                <input id="otherinput" name="otherinput" type="text" placeholder="Other primary endpoint" />
                              </div>
                            </div>

                            <br>
                            <p><u>1. GENETIC DATA REQUESTED</u></p>

                            <div class="input-group">
                              <label for="genotyping"><b>Genotyping</b></label>
                            </div>
                            <div class="input-group">
                              <div class="inline-field">
                                <input id="genotyped" name="genotyping" type="checkbox" value="Individual-level genotyped data"/>
                                <label class="container-ul" for="genotyped"> Individual-level genotyped data</label>

                                <input id="imputed" name="genotyping" type="checkbox" value="Individual-level imputed data"/>
                                <label class="container-ul" for="imputed"> Individual-level imputed data</label>

                                <p> <br>If specific variants are being requested, please complete and attach the following manifest (download the manifest template here). Please use build 38 to denote variants.</p>
                                <input id="fileVar" name="fileVar" type="file">
                              </div>
                            </div>

                            <div class="input-group">
                              <label for="sex"><b>Data Requested From</b></label>
                            </div>
                            <div class="input-group">
                              <div class="inline-field">
                                <input id="females" name="sex" type="checkbox" value="females"/>
                                <label class="container-ul" for="females"> Females </label>

                                <input id="males" name="sex" type="checkbox" value="males"/>
                                <label class="container-ul" for="males"> Males</label>
                              </div>
                            </div>

                            <div class="input-group">
                              <label for="carStatus"><b>Carrier Status</b></label>
                            </div>
                            <div class="input-group">
                              <div class="inline-field">
                              <p>Request for data on <i>BRCA1 and BRCA2</i> carrier status can be made only from CIMBA and MERGE. Carrier 
                              status information is not routinely collected from studies participating in AABCG, BCAC, C-NCI, or LAGENO.</p>
                                <input id="carStatusYes" name="carStatus" type="checkbox" value="yes"/>
                                <label class="container-ul" for="carStatusYes"> Request <i>BRCA1 and BRCA2</i> carrier status </label>
                              </div>
                            </div>

                            <br>
                            <p><u>2. PHENOTYPE DATA REQUESTED (<a href="#data_exploration/dictionary" target="_blank" rel="noopener noreferrer">see data dictionary</a>)</u></p>

                            <div class="input-group">
                                <p>All data requests will be provided access to the Confluence core variables. Please select the category of variables being requested. All variables within the category will be provided.</p>
                            </div>
                            <div class="input-group">
                                <label for="riskfactvar"><b>Risk Factor Variables</b></label>
                                
                                <label> 
                                  <input id="riskfactvarv" name="riskfactvarv" type="checkbox" value="riskfactvarv"/>
                                  Check all 
                                </label>
                            </div>

                              <div class="input-group">
                                <div class="col-8">
                                  <ul class="form" id='riskfactlist'>
                                    <div class="inline-field">
                                      <input id="c1" name="riskfactvar" type="checkbox" value="Education"/>
                                      <label class="container-ul" for="c1"> Education </label>
                                    </div>
                                    <div class="inline-field">
                                      <input id="c2" name="riskfactvar" type="checkbox" value="Menstrual Cycle"/>
                                      <label class="container-ul" for="c2"> Menstrual Cycle</label>
                                    </div>
                                    <div class="inline-field">
                                      <input id="c3" name="riskfactvar" type="checkbox" value="Children"/>
                                      <label class="container-ul" for="c3"> Children</label>
                                    </div>
                                    <div class="inline-field">
                                      <input id="c4" name="riskfactvar" type="checkbox" value="Breastfeeding"/>
                                      <label class="container-ul" for="c4"> Breastfeeding</label>
                                    </div>
                                    <div class="inline-field">
                                      <input id="c5" name="riskfactvar" type="checkbox" value="BMI"/>
                                      <label class="container-ul" for="c5"> BMI</label>
                                    </div>
                                    <div class="inline-field">
                                      <input id="c6" name="riskfactvar" type="checkbox" value="OC"/>
                                      <label class="container-ul" for="c6"> OC</label>
                                    </div>
                                    <div class="inline-field">
                                      <input id="c7" name="riskfactvar" type="checkbox" value="HRT"/>
                                      <label class="container-ul" for="c7"> HRT</label>
                                    </div>
                                    <div class="inline-field">
                                      <input id="c8" name="riskfactvar" type="checkbox" value="Alcohol"/>
                                      <label class="container-ul" for="c8"> Alcohol</label>
                                    </div>
                                    <div class="inline-field">
                                      <input id="c9" name="riskfactvar" type="checkbox" value="Smoking"/>
                                      <label class="container-ul" for="c9"> Smoking</label>
                                    </div>
                                    <div class="inline-field">
                                      <input id="c10" name="criskfactvar10" type="checkbox" value="Family history"/>
                                      <label class="container-ul" for="c10"> Family history</label>
                                    </div>
                                    <div class="inline-field">
                                      <input id="c11" name="riskfactvar" type="checkbox" value="Biopsies"/>
                                      <label class="container-ul" for="c11"> Biopsies</label>
                                    </div>
                                    <div class="inline-field">
                                      <input id="c12" name="riskfactvar" type="checkbox" value="Benign breast disease"/>
                                      <label class="container-ul" for="c12"> Benign breast disease</label>
                                    </div>
                                    <div class="inline-field">
                                      <input id="c13" name="riskfactvar" type="checkbox" value="Detection"/>
                                      <label class="container-ul" for="c13"> Detection</label>
                                    </div>
                                  </ul>
                                </div>
                              </div>

                            <div class="input-group">
                                <label for="pathvar"><b>Pathology Variables</b></label>
                                <label>
                                  <input id="pathvarv" name="pathvarv" type="checkbox" value="pathvarv"/> 
                                  Check all 
                                </label>
                            </div>

                                <div class="input-group">
                                  <div class="col-8">
                                    <ul class="form" id='pathlist'>
                                        <div class="inline-field">
                                          <input id="p1" name="pathvar" type="checkbox" value="Tumor Characteristics"/>
                                          <label class="container-ul" for="p1"> Tumor Characteristics</label>
                                        </div>
                                        <div class="inline-field">
                                          <input id="p2" name="pathvar" type="checkbox" value="ER"/>
                                          <label class="container-ul" for="p2"> ER</label>
                                        </div>
                                        <div class="inline-field">
                                          <input id="p3" name="pathvar" type="checkbox" value="PR"/>
                                          <label class="container-ul" for="p3"> PR</label>
                                        </div>
                                        <div class="inline-field">
                                          <input id="p4" name="pathvar" type="checkbox" value="HER2"/>
                                          <label class="container-ul" for="p4"> HER2</label>
                                        </div>
                                    </ul>
                                  </div>
                                </div>

                          <div class="input-group">
                            <label for="surtrevar"><b>Survival and Treatment Variables</b></label>
                            <label> 
                              <input id="surtrevarv" name="surtrevarv" type="checkbox" value="surtrevarv"/>
                              Check all 
                            </label>
                          </div>

                              <div class="input-group">
                                <div class="col-8">
                                  <ul class="form" id='surtrelist'>
                                    <div class="inline-field">
                                      <input id="s1" name="surtrevar" type="checkbox" value="Survival"/>
                                      <label class="container-ul" for="s1"> Survival </label>
                                    </div>
                                    <div class="inline-field">
                                      <input id="s2" name="surtrevar" type="checkbox" value="Relapse"/>
                                      <label class="container-ul" for="s2"> Relapse </label>
                                    </div>
                                    <div class="inline-field">
                                      <input id="s3" name="surtrevar" type="checkbox" value="Adjuvant chemotherapy"/>
                                      <label class="container-ul" for="s3"> Adjuvant Chemotherapy </label>
                                    </div>
                                    <div class="inline-field">
                                      <input id="s4" name="surtrevar" type="checkbox" value="Adjuvant anti-hormone"/>
                                      <label class="container-ul" for="s4"> Adjuvant anti-hormone </label>
                                    </div>
                                    <div class="inline-field">
                                      <input id="s5" name="surtrevar" type="checkbox" value="Adjuvant trastuzumab"/>
                                      <label class="container-ul" for="s5"> Adjuvant trastuzumab </label>
                                    </div>
                                    <div class="inline-field">
                                      <input id="s6" name="surtrevar" type="checkbox" value="Surgery"/>
                                      <label class="container-ul" for="s6"> Surgery </label>
                                    </div>
                                    <div class="inline-field">
                                      <input id="s7" name="surtrevar" type="checkbox" value="Radiation therapy"/>
                                      <label class="container-ul" for="s7"> Radiation therapy </label>
                                    </div>
                                    <div class="inline-field">
                                      <input id="s8" name="surtrevar" type="checkbox" value="Neoadjuvant chemotherapy"/>
                                      <label class="container-ul" for="s8"> Neoadjuvant chemotherapy</label>
                                    </div>
                                  </ul>
                                </div>
                              </div>

                            <div class="input-group">
                              <label for="mammvar"><b>Mammographic Density Variable</b></label>
                              <label> 
                              <input id="mammvarv" name="mammvarv" type="checkbox" value="Yes"/> Select
                              </label>
                            </div>

                            <br>
                            <p><u>3. ADDITIONAL INFORMATION</u></p>

                            <div class="input-group">
                              <label for="analdesc"><b>Description of Analysis Plan</b><span class='required-label'>*</span></label>
                              <textarea id="analdesc" name="analdesc" rows="6" cols="65" required></textarea>
                            </div>

                            <div class="input-group">
                              <label for="budget"><b>Budgetary considerations, if applicable</b></label>
                              <textarea id="budget" name="budget" rows="2" cols="65"></textarea>
                            </div>

                            <div class="input-group">
                              <label for="time"><b>Time Plan</b></label>
                              <textarea id="time" name="time" rows="4" cols="65"></textarea>
                            </div>

                            <div class="input-group">
                              <label><input id="confirmationAuth" name="confirmationAuth" type="checkbox" value="Yes" required/><b> Please confirm that you agree to comply with Confluence authorship requirements.</b><span class='required-label'>*</span></label>
                          </div>

                            <div class="input-group">
                              <label for="anyoth"><b>Any other considerations you would like the DACCs to be aware of</b></label>
                              <textarea id="anyoth" name="anyoth" rows="4" cols="65"></textarea>
                            </div>
                            
                            <button type="submit" id="submitFormButton" class="buttonsubmit"> 
                              <span class="buttonsubmit__text"> Send Form & Download</span>
                            </button>
                            <!---<button type="button" id="downloadWord" class="buttonsubmit"> 
                              <span class="buttonsubmit__text"> Download Word </span>--->
                            </button>
                          </form>
                        </section>

                        <div id='popUpModal' class="modal" tabindex="-1" role="dialog">
                        <div class="modal-dialog" role="document">
                          <div class="modal-content">
                            <div class="modal-header">
                              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                              </button>
                            </div>
                            <div class="modal-body" id='modalBody'>
                              
                            </div>
                            <div class="modal-footer">
                          
                              <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            </div>
                          </div>
                        </div>
                      </div>
                        <!---<div class="results">
                        <h2>Form Data</h2>
                        <pre></pre>
                        </div>--->
                      </div>
                    </div>
                  </div>
                  `;

  return template;
}

export const formFunctions = () => {
  document.getElementById('riskfactvarv').addEventListener('click', (e) => {
    const inputList = document.getElementById('riskfactlist').getElementsByTagName('input');

    if (e.target.checked) {
      for (const element of inputList) {
        element.checked = true;
      }
    }
    else{
      for (const element of inputList) {
        element.checked = false;
      }
    }
  });
  document.getElementById('pathvarv').addEventListener('click', (e) => {
    const inputList = document.getElementById('pathlist').getElementsByTagName('input');

    if (e.target.checked) {
      for (const element of inputList) {
        element.checked = true;
      }
    }
    else{
      for (const element of inputList) {
        element.checked = false;
      }
    }
  });
  document.getElementById('surtrevarv').addEventListener('click', (e) => {
    const inputList = document.getElementById('surtrelist').getElementsByTagName('input');
    
    if (e.target.checked) {
      for (const element of inputList) {
        element.checked = true;
      }
    }
    else{
      for (const element of inputList) {
        element.checked = false;
      }
    }
  });
}

export const dataForm = async () => {
  //let files = await getFolderItems(uploadFormFolder);
  const d = new Date();
  let filename =
    JSON.parse(localStorage.parms).login.split("@")[0] +
    "_" +
    d.getDate() +
    "_" +
    (d.getMonth() + 1) +
    "_" +
    d.getFullYear() +
    ".docx";

  // Find unique name
  // let entries = files.entries;
  // let i = 1;
  // while (entries.includes(filename)) {
  //   let indexOfExtension = filename.indexOf(".");
  //   filename =
  //     filename.substring(0, indexOfExtension) +
  //     `(${i})` +
  //     filename.substring(indexOfExtension);
  //   i++;
  // }
  // const filesinfoldernames = [];
  // const filesinfolderids = [];
  // for (let i = 0; i < files.entries.length; i++) {
  //   filesinfoldernames.push(files.entries[i].name);
  //   filesinfolderids.push(files.entries[i].id);
  // }

  async function handleFormDownload(eventtest) {
    const btn = document.activeElement;
    btn.classList.toggle("buttonsubmit--loading");
    btn.disabled = true;
    eventtest.preventDefault();
    const form = document.querySelector(".contact-form form");
    const data = new FormData(form);
    const jsondata = Object.fromEntries(data.entries());
    jsondata.memcon = data.getAll("mem-con");
    jsondata.datacon = data.getAll("data-con");
    jsondata.primend = data.getAll("prim-end");
    jsondata.genotyping = data.getAll("genotyping");
    jsondata.sex = data.getAll("sex");
    jsondata.riskfactvar = data.getAll("riskfactvar");
    jsondata.pathvar = data.getAll("pathvar");
    jsondata.surtrevar = data.getAll("surtrevar");

    let parentEl = eventtest.target.parentElement;
    let blob;
    if (parentEl.id === "downloadWord") {
      const doc = new docx.Document({
        styles: {
          default: {
            heading1: {
              run: {
                size: 22,
                bold: true,
                color: "#000000",
                font: "Verdana",
              },
            },
            heading2: {
              run: {
                size: 18,
                bold: true,
                color: "#000000",
                font: "Verdana",
              },
            },
          },
        },
        sections: [
          {
            properties: {},
            headers: {
              default: new docx.Header({
                children: [
                  new docx.Paragraph({
                    text: "Confluence Project Analysis Proposal",
                    heading: docx.HeadingLevel.HEADING_1,
                    alignment: docx.AlignmentType.CENTER,
                  }),
                ],
              }),
            },
            children: [
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Date: ",
                  }),
                  new docx.TextRun({
                    text: jsondata.date,
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Project Title: ",
                  }),
                  new docx.TextRun({
                    text: jsondata.projname,
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Is this an amendment: ",
                  }),
                  new docx.TextRun({
                    text: jsondata.amendment,
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Amendment: ",
                  }),
                  new docx.TextRun({
                    text: jsondata.conNum,
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Contact Investigator(s): ",
                  }),
                  new docx.TextRun({
                    text: jsondata.investigators,
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Institution(s): ",
                  }),
                  new docx.TextRun({
                    text: jsondata.institution,
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Contact Email: ",
                  }),
                  new docx.TextRun({
                    text: jsondata.email,
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Member of Consortia? ",
                  }),
                  new docx.TextRun({
                    text: JSON.stringify(jsondata.memcon, null, 1)
                      .replace("[", "")
                      .replace("]", "")
                      .replace(/"/g, ''),
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Confluence Study Acronym(s) for the Contact Investigator: ",
                  }),
                  new docx.TextRun({
                    text: jsondata.acro,
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "OTHER Investigators and their institutions: ",
                  }),
                  new docx.TextRun({
                    text: jsondata.otherinvest,
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "ALL Investigators (and Institutions) who require access: ",
                  }),
                  new docx.TextRun({
                    text: jsondata.allinvest,
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Consortia data being requested: ",
                  }),
                  new docx.TextRun({
                    text: JSON.stringify(jsondata.datacon, null, 1)
                      .replace("[", "")
                      .replace("]", "")
                      .replace(/"/g, ''),
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Concept Description: ",
                  }),
                  new docx.TextRun({
                    text: jsondata.condesc,
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Primary Endpoint: ",
                  }),
                  new docx.TextRun({
                    text: JSON.stringify(jsondata.primend, null, 1)
                      .replace("[", "")
                      .replace("]", "")
                      .replace(/"/g, ''),
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Other Primary Endpoint: ",
                  }),
                  new docx.TextRun({
                    text: jsondata.otherinput,
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Genotyping: ",
                  }),
                  new docx.TextRun({
                    text: JSON.stringify(jsondata.genotyping, null, 1)
                      .replace("[", "")
                      .replace("]", "")
                      .replace(/"/g, ''),
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Risk Factor Variables: ",
                  }),
                  new docx.TextRun({
                    text: JSON.stringify(jsondata.riskfactvar, null, 1)
                      .replace("[", "")
                      .replace("]", "")
                      .replace(/"/g, ''),
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Pathology Variables: ",
                  }),
                  new docx.TextRun({
                    text: JSON.stringify(jsondata.pathvar, null, 1)
                      .replace("[", "")
                      .replace("]", "")
                      .replace(/"/g, ''),
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Survival and Treatment Variables: ",
                  }),
                  new docx.TextRun({
                    text: JSON.stringify(jsondata.surtrevar, null, 1)
                      .replace("[", "")
                      .replace("]", "")
                      .replace(/"/g, ''),
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Mammographic Density Variable: ",
                  }),
                  new docx.TextRun({
                    text: jsondata.mammvarv,
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Description of Analysis Plan: ",
                  }),
                  new docx.TextRun({
                    text: jsondata.analdesc,
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Budgetary consideratsion, if applicable: ",
                  }),
                  new docx.TextRun({
                    text: jsondata.budget,
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Time Plan: ",
                  }),
                  new docx.TextRun({
                    text: jsondata.time,
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
              new docx.Paragraph({
                heading: docx.HeadingLevel.HEADING_2,
                alignment: docx.AlignmentType.START,
                children: [
                  new docx.TextRun({
                    text: "Any other considerations you would like the DACC to be aware of: ",
                  }),
                  new docx.TextRun({
                    text: jsondata.anyoth,
                    bold: false,
                  }),
                ],
                spacing: {
                  after: 150,
                },
              }),
            ],
          },
        ],
      });

      blob = await docx.Packer.toBlob(doc);
    }

    if (parentEl.id === "downloadJSON") {
      blob = new Blob([JSON.stringify(jsondata)], {
        type: "application/json",
      });
    }
    const downloadLink = await URL.createObjectURL(blob);
    //let UID = Date.now()
    let filename = jsondata.projname + '_' + Date.now() + '.docx';

    let a = document.createElement("a");

    a.href = downloadLink;
    a.download = filename;

    a.click();
    btn.classList.toggle("buttonsubmit--loading");
    btn.disabled = false;
    location.href = "#upload_data_form";
  }

  async function handleFormSubmit(eventtest) {
    // const btn = document.activeElement;
    // btn.classList.toggle("buttonsubmit--loading");
    // btn.disabled = true;
    // eventtest.preventDefault();
    // const data = new FormData(eventtest.target);

    // const formJSON = Object.fromEntries(data.entries());
    // formJSON.basevar = data.getAll("basevar");
    // formJSON.ibcvar = data.getAll("ibcvar");
    // formJSON.reqcoh = data.getAll("reqcoh");
    // // const results = document.querySelector(".results pre");
    // // results.innerText = JSON.stringify(formJSON, null, 2);
    // // fs.wrtieFile('test.json', formJSON);
    // await generateWord(formJSON);
    // btn.classList.toggle("buttonsubmit--loading");
    // btn.disabled = false;
    const btn = document.activeElement;
    btn.classList.toggle("buttonsubmit--loading");
    btn.disabled = true;
    eventtest.preventDefault();
    const form = document.querySelector(".contact-form form");
    const data = new FormData(form);
    const jsondata = Object.fromEntries(data.entries());
    jsondata.memcon = data.getAll("mem-con");
    jsondata.datacon = data.getAll("data-con");
    jsondata.primend = data.getAll("prim-end");
    jsondata.genotyping = data.getAll("genotyping");
    jsondata.riskfactvar = data.getAll("riskfactvar");
    jsondata.pathvar = data.getAll("pathvar");
    jsondata.sex = data.getAll("sex");
    jsondata.surtrevar = data.getAll("surtrevar");
    console.log(jsondata);
    await generateWord(jsondata);
    btn.classList.toggle("buttonsubmit--loading");
    btn.disabled = false;
  }

  async function generateWord(jsondata) {
    const doc = new docx.Document({
      styles: {
        default: {
          heading1: {
            run: {
              size: 22,
              bold: true,
              color: "#000000",
              font: "Verdana",
            },
          },
          heading2: {
            run: {
              size: 18,
              bold: true,
              color: "#000000",
              font: "Verdana",
            },
          },
        },
      },
      sections: [
        {
          properties: {},
          headers: {
            default: new docx.Header({
              children: [
                new docx.Paragraph({
                  text: "Confluence Project Analysis Proposal",
                  heading: docx.HeadingLevel.HEADING_1,
                  alignment: docx.AlignmentType.CENTER,
                }),
              ],
            }),
          },
          children: [
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Date: ",
                }),
                new docx.TextRun({
                  text: jsondata.date,
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Project Title: ",
                }),
                new docx.TextRun({
                  text: jsondata.projname,
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Is this an amendment: ",
                }),
                new docx.TextRun({
                  text: jsondata.amendment,
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Amendment: ",
                }),
                new docx.TextRun({
                  text: jsondata.conNum,
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Contact Investigator(s): ",
                }),
                new docx.TextRun({
                  text: jsondata.investigators,
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Institution(s): ",
                }),
                new docx.TextRun({
                  text: jsondata.institution,
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Contact Email: ",
                }),
                new docx.TextRun({
                  text: jsondata.email,
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Member of Consortia? ",
                }),
                new docx.TextRun({
                  text: JSON.stringify(jsondata.memcon, null, 1)
                    .replace("[", "")
                    .replace("]", "")
                    .replace(/"/g, ''),
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Confluence Study Acronym(s) for the Contact Investigator: ",
                }),
                new docx.TextRun({
                  text: jsondata.acro,
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "OTHER Investigators and their institutions: ",
                }),
                new docx.TextRun({
                  text: jsondata.otherinvest,
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "ALL Investigators (and Institutions) who require access: ",
                }),
                new docx.TextRun({
                  text: jsondata.allinvest,
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Consortia data being requested: ",
                }),
                new docx.TextRun({
                  text: JSON.stringify(jsondata.datacon, null, 1)
                    .replace("[", "")
                    .replace("]", "")
                    .replace(/"/g, ''),
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Concept Description: ",
                }),
                new docx.TextRun({
                  text: jsondata.condesc,
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Primary Endpoint: ",
                }),
                new docx.TextRun({
                  text: JSON.stringify(jsondata.primend, null, 1)
                    .replace("[", "")
                    .replace("]", "")
                    .replace(/"/g, ''),
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Other Primary Endpoint: ",
                }),
                new docx.TextRun({
                  text: jsondata.otherinput,
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Genotyping: ",
                }),
                new docx.TextRun({
                  text: JSON.stringify(jsondata.genotyping, null, 1)
                    .replace("[", "")
                    .replace("]", "")
                    .replace(/"/g, ''),
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Data Requested From: ",
                }),
                new docx.TextRun({
                  text: JSON.stringify(jsondata.sex, null, 1)
                    .replace("[", "")
                    .replace("]", "")
                    .replace(/"/g, ''),
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "BRCA1 and BRCA2 carrier status requested: ",
                }),
                new docx.TextRun({
                  text: jsondata.carStatus,
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Genotyping: ",
                }),
                new docx.TextRun({
                  text: JSON.stringify(jsondata.genotyping, null, 1)
                    .replace("[", "")
                    .replace("]", "")
                    .replace(/"/g, ''),
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Risk Factor Variables: ",
                }),
                new docx.TextRun({
                  text: JSON.stringify(jsondata.riskfactvar, null, 1)
                    .replace("[", "")
                    .replace("]", "")
                    .replace(/"/g, ''),
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Pathology Variables: ",
                }),
                new docx.TextRun({
                  text: JSON.stringify(jsondata.pathvar, null, 1)
                    .replace("[", "")
                    .replace("]", "")
                    .replace(/"/g, ''),
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Survival and Treatment Variables: ",
                }),
                new docx.TextRun({
                  text: JSON.stringify(jsondata.surtrevar, null, 1)
                    .replace("[", "")
                    .replace("]", "")
                    .replace(/"/g, ''),
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Mammographic Density Variable: ",
                }),
                new docx.TextRun({
                  text: jsondata.mammvarv,
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Description of Analysis Plan: ",
                }),
                new docx.TextRun({
                  text: jsondata.analdesc,
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Budgetary consideratsion, if applicable: ",
                }),
                new docx.TextRun({
                  text: jsondata.budget,
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Confluence authorship requirements: ",
                }),
                new docx.TextRun({
                  text: jsondata.confirmationAuth,
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Time Plan: ",
                }),
                new docx.TextRun({
                  text: jsondata.time,
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
            new docx.Paragraph({
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.START,
              children: [
                new docx.TextRun({
                  text: "Any other considerations you would like the DACC to be aware of: ",
                }),
                new docx.TextRun({
                  text: jsondata.anyoth,
                  bold: false,
                }),
              ],
              spacing: {
                after: 150,
              },
            }),
          ],
        },
      ],
    });

    //filename = jsondata.projname.substring(0, 10) + "_" + filename;
    // let files = await getFolderItems(uploadFormFolder);
    // const filesinfoldernames = [];
    // const filesinfolderids = [];
    // for (let i = 0; i < files.entries.length; i++) {
    //   filesinfoldernames.push(files.entries[i].name);
    //   filesinfolderids.push(files.entries[i].id);
    // }
    let filename = jsondata.projname + '_' + Date.now() + '.docx';
    await docx.Packer.toBlob(doc).then(async (blob, btn) => {
      let response = await uploadWordFile(blob, filename, submitterFolder);
      console.log(response);
      if (response.status === 401) {
        document.getElementById("modalBody").innerHTML = `
            <p>Error detected, please upload again.</p>`;
        $("#popUpModal").modal("show");
        btn.classList.toggle("buttonsubmit--loading");
        btn.disabled = false;
      } else if (response.status === 409){
        document.getElementById("modalBody").innerHTML = `
        <p>Conflict detected, please upload again.</p>`;
        $("#popUpModal").modal("show");
        btn.classList.toggle("buttonsubmit--loading");
        btn.disabled = false;
      } else {
      let fileid = response.entries[0].id;
      console.log(fileid);
      const downloadLink = URL.createObjectURL(blob);
      let a = document.createElement("a");
      a.href = downloadLink;
      a.download = filename;
      document.getElementById("modalBody").innerHTML = `
           <p>File was successfully uploaded.</p>
           <p>Document ID: ${fileid}</p>`;
      $("#popUpModal").modal("show");
      a.click();
      let popup = document.getElementById('popUpModal');
      let btns = popup.querySelectorAll('button');
      for (let button of btns) {
        button.addEventListener('click', function () {
          location.reload();
         })
        }
      }
    })
    //document.location.reload(true);

    // await docx.Packer.toBlob(doc).then(async (blob) => {
    //   if (filesinfoldernames.includes(filename)) {
    //     const [name, extension] = filename.split(".");
    //     let i = 1;
    //     while (filesinfoldernames.includes(filename)) {
    //       if (filename.includes(")")) {
    //         const [name, version] = filename.split("(");
    //         filename = name + `(${i})` + version.substring(2);
    //       } else {
    //         filename = name + `(${i}).` + extension;
    //       }
    //       i++;
    //     }
    //     let response = await uploadWordFile(blob, filename, uploadFormFolder);
    //     await assigntasktochair();
    //     let fileid = response.entries[0].id;
    //     //Modal code here
    //     document.getElementById("modalBody").innerHTML = `
    //       <p>File was successfully uploaded.</p>
    //       <p>Document ID: ${fileid}</p>`;
    //     $("#popUpModal").modal("show");
    //   } else {
    //     // Adding keywords
    //     let response = await uploadWordFile(blob, filename, uploadFormFolder);
    //     if (response.status === 201) {
    //       await assigntasktochair();
    //       let fileid = response.entries[0].id;
    //       //Modal code here
    //       document.getElementById("modalBody").innerHTML = `
    //     <p>File was successfully uploaded.</p>
    //     <p>Document ID: ${fileid}</p>`;
    //       $("#popUpModal").modal("show");
    //     } else {
    //     }
    //   }
    // });
  }

  const form = await document.querySelector(".contact-form");
  form.addEventListener("submit", handleFormSubmit);

  // const downloadJSON = document.getElementById("downloadJSON");
  // downloadJSON.addEventListener("click", handleFormDownload);

  // const downloadWord = document.getElementById("downloadWord");
  // downloadWord.addEventListener("click", handleFormDownload);
}

export const uploaddataFormTemplate = () => {
  let template = ` 
                <div class="general-bg padding-bottom-1rem">
                  <div class="container body-min-height">
                    <div class="main-summary-row">
                      <div class="align-left">
                        <h1 class="page-header">Analysis Concept Form Upload</h1>
                      </div>
                    </div>
                    <div class="data-submission div-border font-size-18" style="padding-left: 1rem;">  
                      <h5> Do not change name of file from previous step, if file name is changed it may not be processed. </h5>
                      <h5> Please upload form below. If window shows an error or takes long to load, please refresh the cache using Ctrl + F5. </h5>
                      <h5> If you continue experiencing issues, you may also <a href="https://nih.app.box.com/f/818f3ca628ec4c12a2d5d2ed40029840" target="_blank" rel="noopener noreferrer">submit your file here</a>. </h5>
                      <div class="uploadContainer">
                        <iframe src="https://nih.app.box.com/f/818f3ca628ec4c12a2d5d2ed40029840" height="1000" width="1000"></iframe>
                      </div>
                    </div>
                  </div>
                </div>`
  return template;
}
{/* <div class="general-bg padding-bottom-1rem">
<div class="container body-min-height">

    <div class="main-summary-row">
        <div class="align-left">
            <h1 class="page-header">Analysis Concept Form</h1>
        </div>
    </div> */}