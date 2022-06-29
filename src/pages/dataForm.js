// export function yesnoCheck() {
//     if (document.getElementById('amendmentyes').checked) {
//         document.getElementById('ifamendmentyes').style.visibility = 'visible';
//     }
//     else document.getElementById('ifamendmentyes').style.visibility = 'hidden';
// };

export const formtemplate = () => {
  // function yesnoCheck() {
  //     if (document.getElementById('amendmentyes').checked) {
  //         document.getElementById('ifamendmentyes').style.visibility = 'visible';
  //     }
  //     else document.getElementById('ifamendmentyes').style.visibility = 'hidden';
  // };
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
                            <p>Please fill out the form below in order to get approval for access to data.</p>
                            <form>

                            <div class="input-group">
                              <label for="date"><b>Date</b></label>
                              <input id="date" name="date" type="date" value='${today}' required/>
                            </div>

                            <div class="input-group">
                              <label for="projname"><b>Title of Proposed Project</b></label>
                              <input id="projname" name="projname" type="text" required/>
                            </div>
                            
                            <div class="input-group">
                                <label for="amendment"> <b>Is this an amendment?</b> </label>
                                    
                                    <input id="amendmentyes" name="amendment" type="radio" value="Yes" required/>
                                        <label class="ul-container" for="amendmentyes"> Yes </label>
                                    <input id="amendmentno" name="amendment" type="radio" value="No" required/>
                                        <label class="ul-container" for="amendmentno"> No </label>

                                <label for="ifamendmentyes"> <i> If yes, provide Concept Number of original form </i></label>
                                    <input type="text" id="conNum" name="conNum" />
                            </div>

                            <div class="input-group">
                              <label for="investigators"><b>Contact Investigator(s)</b></label>
                              <input id="investigators" name="investigators" type="text" required/>
                            </div>

                            <div class="input-group">
                              <label for="institution"><b>Institution</b></label>
                              <input id="institution" name="institution" type="text" required/>
                            </div>
                            
                            <div class="input-group">
                              <label for="email"><b>Contact E-mail</b></label>
                              <input id="email" name="email" type="email" required/>
                            </div>

                            <div class="input-group">
                                <label for="consortia"><b>Member of Consortia?</b></label>
                            </div>
                            
                            <div class="row">
                                  <div class="col-12">
                                    <ul class="form">
                                        <li class="form">
                                          <div class="inline-field">
                                          <input id="mem-aabcg" name="mem-aabcg" type="checkbox" value="mem-aabcg"/>
                                          <label class="container-ul" for="mem-aabcg"> AABCG</label>
                                          </div>
                                        </li>

                                        <li class="form">
                                          <div class="inline-field">
                                            <input id="mem-bcac" name="mem-bcac" type="checkbox" value="mem-bcac"/>
                                            <label class="container-ul" for="mem-bcac"> BCAC</label>
                                          </div>
                                        </li>

                                        <li class="form">
                                          <div class="inline-field">
                                            <input id="mem-cimba" name="mem-cimba" type="checkbox" value="mem-cimba"/>
                                            <label class="container-ul" for="mem-cimba"> CIMBA</label>
                                          </div>
                                        </li>                                        

                                        <li class="form">
                                          <div class="inline-field">
                                            <input id="mem-nci-dceg" name="mem-nci-dceg" type="checkbox" value="mem-nci-dceg"/>
                                            <label class="container-ul" for="mem-nci-dceg"> C-NCI</label>
                                          </div>
                                        </li>

                                        <li class="form">
                                          <div class="inline-field">
                                            <input id="mem-lageno" name="mem-lageno" type="checkbox" value="mem-lageno"/>
                                            <label class="container-ul" for="mem-lageno"> LAGENO</label>
                                          </div>
                                        </li>
                                        
                                        <li class="form">
                                          <div class="inline-field">
                                            <input id="mem-merge" name="mem-merge" type="checkbox" value="mem-merge"> 
                                            <label class="container-ul" for="mem-merge"> MERGE</label>
                                          </div>
                                        </li>

                                        <li class="form">
                                          <div class="inline-field">
                                          <input id="mem-none" name="mem-none" type="checkbox" value="mem-none"/>
                                          <label class="container-ul" for="mem-none"> None</label>
                                          </div>
                                        </li>
                                        
                                      </ul>
                                    </div>
                            </div>
                            
                            <div class="input-group">
                              <label for="acro"><b>Confluence Study Acronym(s) for the Contact Investigator</b></label>
                              <textarea id="acro" name="acro" rows="2" cols="65" required></textarea>
                            </div>

                            <div class="input-group">
                              <label for="otherinvest"><b>OTHER Investigators and their institutions</b></label>
                              <textarea id="otherinvest" name="otherinvest" rows="2" cols="65" required></textarea>
                            </div>

                            <div class="input-group">
                                <label for="allinvest"><b>ALL Investigators (and their institutions) who will require access to the data requested</b></label>
                                <textarea id="allinvest" name="allinvest" rows="2" cols="65" required></textarea>
                            </div>

                            <div class="input-group">
                            
                                
                                <label><input id="confirmation" name="confirmation" type="checkbox" value="Yes" required/><b> Please confirm that ALL the named investigators have read AND agreed to be named on this proposal?</b></label>
                              
                            </div>

                            <div class="input-group">
                                <label for="consortia"><b>Consortia data being requested</b> <i>(please check all boxes that apply)</i></label>
                            </div>

                                <div class="row">
                                  <div class="col-12">
                                    <ul class="form">
                                        <li class="form">
                                          <div class="inline-field">
                                            <input id="consortia-aabcg" name="consortia-aabcg" type="checkbox" value="consortia-aabcg"/>
                                            <label class="container-ul" for="consortia-aabcg"> AABCG</label>
                                          </div>
                                        </li>

                                        <li class="form">
                                          <div class="inline-field">
                                            <input id="consortia-BCAC" name="consortia-BCAC" type="checkbox" value="consortia-BCAC"/>
                                            <label class="container-ul" for="consortia-BCAC"> BCAC</label>
                                          </div>
                                        </li>

                                        <li class="form">
                                          <div class="inline-field">
                                            <input id="consortia-cimba" name="consortia-cimba" type="checkbox" value="consortia-cimba"/>
                                            <label class="container-ul" for="consortia-cimba"> CIMBA</label>
                                          </div>
                                        </li>                                        

                                        <li class="form">
                                          <div class="inline-field">
                                            <input id="consortia-c-nci" name="consortia-c-nci" type="checkbox" value="consortia-c-nci"/>
                                            <label class="container-ul" for="consortia-c-nci"> C-NCI</label>
                                          </div>
                                        </li>

                                        <li class="form">
                                          <div class="inline-field">
                                            <input id="consortia-lageno" name="consortia-lageno" type="checkbox" value="consortia-lageno"/>
                                            <label class="container-ul" for="consortia-lageno"> LAGENO</label>
                                          </div>
                                        </li>
                                        
                                        <li class="form">
                                          <div class="inline-field">
                                            <input id="consortia-merge" name="consortia-merge" type="checkbox" value="consortia-merge"/>
                                            <label class="container-ul" for="consortia-merge"> MERGE</label>
                                          </div>
                                        </li>
                                        
                                      </ul>
                                    </div>
                                  </div>

                            <div class="input-group">
                              <label for="condesc"><b>Concept Description</b> <i> Please provide a concise description of Background/Aims</i></label>
                              <textarea id="condesc" name="condesc" rows="6" cols="65" required></textarea>
                            </div>

                            <div class="input-group">
                                <label for="consortia"><b>Primary Endpoint</b> <i> (please check box)</i> </label>

                                <div class="inline-field">
                                <input id="consortia-bcr" name="consortia-bcr" type="checkbox" value="consortia-bcr"/>
                                <label class="container-ul" for="consortia-bcr"> Breast Cancer Risk</label>

                                <input id="sbc" name="sbc" type="checkbox" value="sbc"/>
                                <label class="container-ul" for="sbc"> Subtype of Breast Cancer</label>

                                <input id="sur" name="sur" type="checkbox" value="sur"/>
                                <label class="container-ul" for="sur"> Survival</label>

                                <input id="other" name="other" type="checkbox" value="other"/>
                                <label class="container-ul" for="other"> Other</label>

                                <label for="otherinput"></label>
                                <input id="otherinput" name="otherinput" type="text" style="display:none" placeholder="Other primary endpoint" />
                                
                                </div>
                            </div>

                            <br>
                            <p><u>1. GENETIC DATA REQUESTED</u></p>

                            <div class="input-group">
                                <label for="genotyping"><b>Genotyping</b></label>
                                <div class="inline-field">
                                <input id="genotyped" name="genotyped" type="checkbox" value="genotyped"/>
                                <label class="container-ul" for="genotyped"> Individual-level genotyped data</label>

                                <input id="imputed" name="imputed" type="checkbox" value="imputed"/>
                                <label class="container-ul" for="imputed"> Individual-level imputed data</label>

                                <p> <br>If specific variants are being requested attach separate file(s) (.csv) with a list of either: (i) All SNPs (e.g. with their iCOGs/Onco SNP_name, see BCAC website) or (ii) ALL gene region(s) (with chromosome number and start and end positions [build 37]).</p>
                                <input id="fileVar" name="fileVar" type="file">
                                </div>
                            </div>

                            <br>
                            <p><u>2. PHENOTYPE DATA REQUESTED (<a href="#data_exploration/dictionary">see data dictionary</a>)</u></p>

                            <div class="input-group">
                                <p>All data requests will be provided access to the Confluence core variables. <br>
                                <i>No dates (e.g. intDate, DateDiagnosis, etc.) can be sent.</i></p>
                            </div>
                            <div class="input-group">
                                <label for="riskfactvar"><b>Risk Factor Variables</b></label>
                                
                                <label> 
                                  <input id="riskfactvarv" name="riskfactvarv" type="checkbox" value="riskfactvarv"/>
                                  Check all 
                                </label>
                            </div>

                              <div class="row">
                                <div class="col-12">
                                  <ul class="form" id='riskfactlist'>

                                      <li class="form">
                                        <div class="inline-field">
                                          <input id="c1" name="c1" type="checkbox" value="c1"/>
                                          <label class="container-ul" for="c1"> Education </label>
                                        </div>
                                      </li>
                                      <li>
                                        <div class="inline-field">
                                          <input id="c2" name="c2" type="checkbox" value="c2"/>
                                          <label class="container-ul" for="c2"> Menstrual Cycle</label>
                                        </div>
                                      </li>
                                      <li>
                                        <div class="inline-field">
                                          <input id="c3" name="c3" type="checkbox" value="c3"/>
                                          <label class="container-ul" for="c3"> Children</label>
                                        </div>
                                      </li>
                                      <li>
                                        <div class="inline-field">
                                          <input id="c4" name="c4" type="checkbox" value="c4"/>
                                          <label class="container-ul" for="c4"> Breastfeeding</label>
                                        </div>
                                      </li>
                                      <li>
                                        <div class="inline-field">
                                          <input id="c5" name="c5" type="checkbox" value="c5"/>
                                          <label class="container-ul" for="c5"> BMI</label>
                                        </div>
                                      </li>
                                      <li>
                                        <div class="inline-field">
                                          <input id="c6" name="c6" type="checkbox" value="c6"/>
                                          <label class="container-ul" for="c6"> OC</label>
                                        </div>
                                      </li>
                                      <li>
                                        <div class="inline-field">
                                          <input id="c7" name="c7" type="checkbox" value="c7"/>
                                          <label class="container-ul" for="c7"> HRT</label>
                                        </div>
                                      </li>
                                      <li>
                                        <div class="inline-field">
                                          <input id="c8" name="c8" type="checkbox" value="c8"/>
                                          <label class="container-ul" for="c8"> Alcohol</label>
                                        </div>
                                      </li>
                                      <li>
                                        <div class="inline-field">
                                          <input id="c9" name="c9" type="checkbox" value="c9"/>
                                          <label class="container-ul" for="c9"> Smoking</label>
                                        </div>
                                      </li>
                                      <li>
                                        <div class="inline-field">
                                          <input id="c10" name="c10" type="checkbox" value="c10"/>
                                          <label class="container-ul" for="c10"> Family history</label>
                                        </div>
                                      </li>
                                      <li>
                                        <div class="inline-field">
                                          <input id="c11" name="c11" type="checkbox" value="c11"/>
                                          <label class="container-ul" for="c11"> Biopsies</label>
                                        </div>
                                      </li>
                                      <li>
                                        <div class="inline-field">
                                          <input id="c12" name="c12" type="checkbox" value="c12"/>
                                          <label class="container-ul" for="c12"> Benign breast disease</label>
                                        </div>
                                      </li>
                                      <li>
                                        <div class="inline-field">
                                          <input id="c13" name="c13" type="checkbox" value="c13"/>
                                          <label class="container-ul" for="c13"> Detection</label>
                                        </div>
                                      </li>
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

                                <div class="row">
                                  <div class="col-12">
                                    <ul class="form" id='pathlist'>

                                      <li class="form">
                                        <div class="inline-field">
                                          <input id="p1" name="p1" type="checkbox" value="p1"/>
                                          <label class="container-ul" for="p1"> Tumor Characteristics </label>
                                        </div>
                                      </li>
                                      <li>
                                        <div class="inline-field">
                                          <input id="p2" name="p2" type="checkbox" value="p2"/>
                                          <label class="container-ul" for="p2"> ER</label>
                                        </div>
                                      </li>
                                      <li>
                                        <div class="inline-field">
                                          <input id="p3" name="p3" type="checkbox" value="p3"/>
                                          <label class="container-ul" for="p3"> PR</label>
                                        </div>
                                      </li>
                                      <li>
                                        <div class="inline-field">
                                          <input id="p4" name="p4" type="checkbox" value="p4"/>
                                          <label class="container-ul" for="p4"> HER2</label>
                                        </div>
                                      </li>
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

                              <div class="row">
                                <div class="col-12">
                                  <ul class="form" id='surtrelist'>

                                    <li class="form">
                                      <div class="inline-field">
                                        <input id="s1" name="s1" type="checkbox" value="s1"/>
                                        <label class="container-ul" for="s1"> Survival </label>
                                      </div>
                                    </li>
                                    <li>
                                      <div class="inline-field">
                                        <input id="s2" name="s2" type="checkbox" value="s2"/>
                                        <label class="container-ul" for="s2"> Relapse </label>
                                      </div>
                                    </li>
                                    <li>
                                      <div class="inline-field">
                                        <input id="s3" name="s3" type="checkbox" value="s3"/>
                                        <label class="container-ul" for="s3"> Adjuvant Chemotherapy </label>
                                      </div>
                                    </li>
                                    <li>
                                      <div class="inline-field">
                                        <input id="s4" name="s4" type="checkbox" value="s4"/>
                                        <label class="container-ul" for="s4"> Adjuvant anti-hormone </label>
                                      </div>
                                    </li>
                                    <li>
                                      <div class="inline-field">
                                        <input id="s5" name="s5" type="checkbox" value="s5"/>
                                        <label class="container-ul" for="s5"> Adjuvant trastuzumab </label>
                                      </div>
                                    </li>
                                    <li>
                                      <div class="inline-field">
                                        <input id="s6" name="s6" type="checkbox" value="s6"/>
                                        <label class="container-ul" for="s6"> Surgery </label>
                                      </div>
                                    </li>
                                    <li>
                                      <div class="inline-field">
                                        <input id="s7" name="s7" type="checkbox" value="s7"/>
                                        <label class="container-ul" for="s7"> Radiation therapy </label>
                                      </div>
                                    </li>
                                    <li>
                                      <div class="inline-field">
                                        <input id="s8" name="s8" type="checkbox" value="s8"/>
                                        <label class="container-ul" for="s8"> Neoadjuvant chemotherapy </label>
                                      </div>
                                    </li>
                                  </ul>
                                </div>
                              </div>

                            <div class="input-group">
                              <label for="mammvar"><b>Mammographic Density Variable</b></label>
                              <label> 
                              <input id="mammvarv" name="mammvarv" type="checkbox" value="mammvarv"/> Select
                              </label>
                            </div>

                            <br>
                            <p><u>3. ADDITIONAL INFORMATION</u></p>

                            <div class="input-group">
                              <label for="analdesc"><b>Description of Analysis Plan</b></label>
                              <textarea id="analdesc" name="analdesc" rows="6" cols="65" required></textarea>
                            </div>

                            <div class="input-group">
                              <label for="budget"><b>Budgetary considerations, if applicable</b></label>
                              <textarea id="budget" name="budget" rows="2" cols="65"></textarea>
                            </div>

                            <div class="input-group">
                              <label for="time"><b>Time Plan</b></label>
                              <textarea id="time" name="time" rows="4" cols="65" required></textarea>
                            </div>

                            <div class="input-group">
                              <label for="anyoth"><b>Any other considerations you would like the DACC to be aware of</b></label>
                              <textarea id="anyoth" name="anyoth" rows="4" cols="65" required></textarea>
                            </div>
                            
                            <button type="submit" id="submitFormButton" class="buttonsubmit" onclick="if validate(){this.classList.toggle('buttonsubmit--loading')}"> 
                              <span class="buttonsubmit__text"> Send Form </span>
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
                        <div class="results">
                        <h2>Form Data</h2>
                        <pre></pre>
                        </div>
                      </div>
                    </div>
                  </div>`;

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

  document.getElementById('other').addEventListener('click', (e) => {
    var inputBox = document.getElementById("otherinput");

    if (e.target.checked) {
      inputBox.style.display = "block";
    } else {
      inputBox.style.display = "none";
    }
  });

}