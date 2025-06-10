import { submitterFolder, uploadWordFile, addMetaData} from "../shared.js"
// import * as docx from "docx";

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
                        <p>
                            Please fill out the form to request access to Confluence Project data. This form 
                            should only be used to request access to data from two or more consortia 
                            participating in the Confluence Project.  If you want to request access to data 
                            from only one consortium, do not use this form and directly contact that specific 
                            consortium.
                            </br></br>

                            Following submission of this form it will be reviewed by the Data Access Coordination 
                            Committees (DACC) of the consortia participating in Confluence. For more information 
                            about the data access request process please see this description of the
                            <a href="#data_access" target="_blank" rel="noopener noreferrer">data access request 
                            process </a> and the <a href="#join/description" target="_blank" rel="noopener noreferrer">
                            individual consortia DACC guidelines</a>. Access to data for 
                            approved concepts will only be given to investigators listed on this form below, 
                            each of whose Institutions will need to sign data transfer agreements with the 
                            data coordinating centers that are governing the requested data.
                            </br></br>

                            Access to data will be provided on a secure, cloud-based, trusted research environment (TRE). 
                            Approved researchers granted access to data will be responsible for paying their 
                            costs incurred using resources on the TRE (e.g., compute costs analyzing the data). 
                        </p>
                        <form id="analysisConceptForm" novalidate>
                            <div class="input-group">
                                <label for="date" id="date-label"><b>Date</b><span class='required-label' aria-hidden="true">*</span></label>
                                <input id="date" name="date" type="date" value='${today}' class="form-text-input" required aria-required="true" aria-describedby="date-error" />
                                <div id="date-error" class="error-message" aria-live="polite"></div>
                            </div>
                            <div class="input-group">
                                <label for="projname" id="projname-label"><b>Title of Proposed Project</b><span class='required-label' aria-hidden="true">*</span></label>
                                <input id="projname" name="projname" type="text" class="form-text-input" required aria-required="true" aria-describedby="projname-error" />
                                <div id="projname-error" class="error-message" aria-live="polite"></div>
                            </div>
                            <div class="input-group form-check">
                                <label for="amendment"><b>Is this an amendment?</b><span class='required-label'>*</span></label>
                                <div class="radio-group d-flex align-items-center" style="margin-top: -5px;">
                                    <div class="form-check form-check-inline">
                                        <input id="amendmentyes" name="amendment" type="radio" value="Yes" class="form-check-input" style="position: relative; top: -2px;" required/>
                                        <label class="form-check-label" for="amendmentyes">Yes</label>
                                    </div>
                                    <div class="form-check form-check-inline">
                                        <input id="amendmentno" name="amendment" type="radio" value="No" class="form-check-input" style="position: relative; top: -2px;" required/>
                                        <label class="form-check-label" for="amendmentno">No</label>
                                    </div>
                                </div>
                                <label for="ifamendmentyes"><i>If yes, provide Concept Number of original form</i></label>
                                <input type="text" class="form-text-input" id="conNum" name="conNum" />
                            </div>
                            <div class="input-group">
                                <label for="investigators"><b>Contact Investigator(s)</b><span class='required-label'>*</span></label>
                                <input id="investigators" name="investigators" class="form-text-input" type="text" required/>
                            </div>
                            <div class="input-group">
                                <label for="institution"><b>Institution</b><span class='required-label'>*</span></label>
                                <input id="institution" name="institution" class="form-text-input" type="text" required/>
                            </div>
                            <div class="input-group">
                                <label for="email"><b>Contact E-mail</b><span class='required-label'>*</span></label>
                                <input id="email" name="email" class="form-text-input" type="text" required/>
                            </div>
                            <div class="input-group">
                                <label for="mem-con"><b>Member of Consortia or Study / Trial Group?</b><span class='required-label'>*</span></label>
                            </div>
                            <div class="input-group">
                                <div class="container-lg">
                                    <div class="row">
                                        <div class="col-12 col-md-2 col-sm-12">
                                            <div class="form-check">
                                                <input class="form-check-input" id="mem-aabcg" name="mem-con" type="checkbox" value="AABCG" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="mem-aabcg"> AABCG</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="mem-bcac" name="mem-con" type="checkbox" value="BCAC" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="mem-bcac"> BCAC</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="mem-cimba" name="mem-con" type="checkbox" value="CIMBA" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="mem-cimba"> CIMBA</label>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-2 col-sm-12">                                    
                                            <div class="form-check">
                                                <input class="form-check-input" id="mem-nci-dceg" name="mem-con" type="checkbox" value="C-NCI" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="mem-nci-dceg"> C-NCI</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="mem-lageno" name="mem-con" type="checkbox" value="LAGENO" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="mem-lageno"> LAGENO</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="mem-merge" name="mem-con" type="checkbox" value="MERGE" style="position: relative; top: -2px;"/> 
                                                <label class="form-check-label" for="mem-merge"> MERGE</label>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-2 col-sm-12">
                                            <div class="form-check">
                                                <input class="form-check-input" id="mem-trial" name="mem-trial" type="checkbox" value="Trial" style="position: relative; top: -2px;"/> 
                                                <label class="form-check-label" for="mem-trial"> Clinical Trial Group</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="mem-none" name="mem-con" type="checkbox" value="None" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="mem-none"> None</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="input-group">
                                <label for="acro"><b>Confluence Study Acronym(s) for the Contact Investigator</b><span class='required-label'>*</span></label>
                                <textarea id="acro" name="acro" rows="2" cols="65" class="form-text-input" required></textarea>
                            </div>
                            <div class="input-group">
                                <label for="otherinvest"><b>OTHER Investigators and their institutions</b><span class='required-label'>*</span></label>
                                <textarea id="otherinvest" name="otherinvest" rows="2" cols="65" class="form-text-input" required></textarea>
                            </div>
                            <div class="input-group">
                                <label for="allinvest"><b>ALL Investigators (and their institutions) who will require access to the data requested</b><span class='required-label'>*</span></label>
                                <textarea id="allinvest" name="allinvest" rows="2" cols="65" class="form-text-input" required></textarea>
                                <p><b>Note:</b> Datasets cannot be exchanged between institutions. See the data access request procedures for more information.</p>
                            </div>
                            <div class="input-group">
                                <div class="form-check">
                                    <input id="confirmation" name="confirmation" type="checkbox" value="Yes" class="form-check-input" style="position: relative; top: -2px;" required/>
                                    <label class="form-check-label" for="confirmation"><b>Please confirm that ALL the named investigators have read AND agreed to be named on this proposal?</b><span class='required-label'>*</span></label>
                                </div>
                            </div>
                            <div class="input-group">
                                <label for="data-con"><b>Consortia or Study / Trial Group data being requested</b><span class='required-label'>*</span> <i>(please check all boxes that apply)</i></label>
                            </div>
                            <div class="input-group">
                                <div class="container-lg">
                                    <div class="row">
                                        <div class="col-12 col-md-2 col-sm-12">
                                            <div class="form-check">
                                                <input class="form-check-input" id="consortia-aabcg" name="data-con" type="checkbox" value="AABCG" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="consortia-aabcg"> AABCG</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="consortia-BCAC" name="data-con" type="checkbox" value="BCAC" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="consortia-BCAC"> BCAC</label>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-2 col-sm-12">   
                                            <div class="form-check">
                                                <input class="form-check-input" id="consortia-cimba" name="data-con" type="checkbox" value="CIMBA" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="consortia-cimba"> CIMBA</label>
                                            </div>                                  
                                            <div class="form-check">
                                                <input class="form-check-input" id="consortia-c-nci" name="data-con" type="checkbox" value="C-NCI" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="consortia-c-nci"> C-NCI</label>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-2 col-sm-12">   
                                            <div class="form-check">
                                                <input class="form-check-input" id="consortia-lageno" name="data-con" type="checkbox" value="LAGENO" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="consortia-lageno"> LAGENO</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="consortia-merge" name="data-con" type="checkbox" value="MERGE" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="consortia-merge"> MERGE</label>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-2 col-sm-12">   
                                            <div class="form-check">
                                                <input class="form-check-input" id="consortia-trial" name="data-con" type="checkbox" value="Trial" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="consortia-trial"> Clinical Trial Group</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="input-group">
                                <label for="condesc"><b>Background</b> <i> Please provide a concise description of Background</i><span class='required-label'>*</span></label>
                                <textarea id="condesc" name="condesc" rows="6" cols="65" class="form-text-input" required></textarea>
                            </div>
                            <div class="input-group">
                                <label for="condescAims"><b>Aims</b> <i> Please provide a concise description of Aims</i><span class='required-label'>*</span></label>
                                <textarea id="condescAims" name="condescAims" rows="6" cols="65" class="form-text-input" required></textarea>
                            </div>
                            <div class="input-group">
                                <label for="analdesc"><b>Description of Analysis Plan</b> <i> Please provide a concise description of your Analysis Plan</i><span class='required-label'>*</span></label>
                                <textarea id="analdesc" name="analdesc" rows="6" cols="65" class="form-text-input" required></textarea>
                            </div>
                            <div class="input-group">
                                <label for="prim-end"><b>Primary Endpoint</b><span class='required-label'>*</span><i> (please check box)</i> </label>
                            </div>
                            <div class="input-group">
                                <div class="container-lg">
                                    <div class="row">
                                        <div class="col-12 col-md-12 col-sm-12">
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" id="consortia-bcr" name="prim-end" type="checkbox" value="Breast Cancer Risk" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="consortia-bcr"> Breast Cancer Risk</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-12 col-md-12 col-sm-12">
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" id="sbc" name="prim-end" type="checkbox" value="Subtype of Breast Cancer" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="sbc"> Subtype of Breast Cancer</label>
                                                <input type="text" class="form-control form-text-input" id="sbcin" name="sbcin" placeholder="Subtype"/>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-12 col-md-12 col-sm-12">
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" id="sur" name="prim-end" type="checkbox" value="Survival" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="sur"> Survival</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-12 col-md-12 col-sm-12">
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" id="other" name="prim-end" type="checkbox" value="Other" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="other"> Other</label>
                                                <input id="otherinput" name="otherinput" class="form-control form-text-input" type="text" placeholder="Other primary endpoint" />
                                            </div>
                                        </div>
                                    </div>  
                                </div>
                            </div>
                            <br>
                            <p><u>1. GENETIC DATA REQUESTED</u></p>
                            <div class="input-group">
                                <label for="genotyping"><b>Genotyping</b></label>
                            </div>
                            <div class="input-group">
                                <div class="container-lg">
                                    <div class="row">
                                        <div class="col-12 col-md-12 col-sm-12">
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" id="genotyped" name="genotyping" type="checkbox" value="Individual-level genotyped data" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="genotyped"> Individual-level genotyped data</label>
                                            </div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" id="imputed" name="genotyping" type="checkbox" value="Individual-level imputed data" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="imputed"> Individual-level imputed data</label>
                                            </div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" id="concept1" name="genotyping" type="checkbox" value="Concept 1 GWAS summary results" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="concept1"> Concept 1 GWAS Summary Results*</label>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-12 col-sm-12">
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" id="preconfluence" name="genotyping" type="checkbox" value="Data generated pre-Confluence" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="preconfluence"> Data generated pre-Confluence</label>
                                            </div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" id="postconfluence" name="genotyping" type="checkbox" value="Confluence generated data" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="postconfluence"> Confluence generated data</label>
                                            </div>
                                            <p> If specific variants are being requested, please complete and attach the following manifest (download the manifest template here). Please use build 38 to denote variants.</p>
                                            <p> *Access to concept 1 GWAS summary results will require an approved concept form until the summary results are made publicly accessible.</p>
                                            <input id="fileVar" name="fileVar" type="file">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="input-group">
                                <label for="sex"><b>Data Requested From</b></label>
                            </div>
                            <div class="input-group">
                                <div class="container-lg">
                                    <div class="row">
                                        <div class="col-12 col-md-12 col-sm-12">
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" id="females" name="sex" type="checkbox" value="females" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="females"> Females </label>
                                            </div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" id="males" name="sex" type="checkbox" value="males" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="males"> Males</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="input-group">
                                <label for="carStatus"><b>Carrier Status</b></label>
                            </div>
                            <div class="input-group">
                                <div class="container-lg">
                                    <div class="row">
                                        <div class="col-12 col-md-12 col-sm-12">
                                            <p>Request for data on <i>BRCA1</i> and <i>BRCA2</i> carrier status can be made only from CIMBA and from some MERGE participants. Carrier 
                                                status information is not routinely collected from studies participating in AABCG, BCAC, C-NCI, or LAGENO.</p>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" id="BRCA1Yes" name="carStatus" type="checkbox" value="BRCA1" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="BRCA1Yes">BRCA1</label>
                                            </div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" id="BRCA2Yes" name="carStatus" type="checkbox" value="BRCA2" style="position: relative; top: -2px;"/>
                                                <label class="form-check-label" for="BRCA2Yes">BRCA2</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <br>
                            <p style="margin-bottom: 0;"><u>2. PHENOTYPE DATA REQUESTED</u></p>
                            <div class="input-group">
                                <p style="margin-bottom: 0;">All approved data requests to BCAC, C-NCI, CIMBA, LAGENO, and MERGE will be provided access to the Confluence core variables
                                (<a href="#data_exploration/dictionary" target="_blank" rel="noopener noreferrer">Confluence Data Dictionary</a>), 
                                and all approved requests to AABCG will be provided the variables: status, studyType, ageint, AgeDiagIndex, famHist, ER_status (<a href="https://nih.app.box.com/file/1876071731218" target="_blank" rel="noopener noreferrer">AABCG Data Dictionary</a>). Select 
                                additional categories of variables that are required to accomplish the aims of the concept. The data analysis description <i>must</i> describe 
                                why the variables are being requested otherwise the application will not be approved.
                            </div>
                            <div class="input-group">
                                <label for="riskfactvar"><b>Risk Factor</b></label>
                                <label> 
                                    <input id="riskfactvarv" name="riskfactvarv" type="checkbox" class="form-check-input" value="riskfactvarv" style="position: relative; top: -2px;"/>
                                </label>
                            </div>
                            <!--<div class="input-group">
                                <div class="container-lg">
                                    <div class="row" id='riskfactlist'>
                                        <div class="col-12 col-md-3 col-sm-12">
                                            <div class="form-check">
                                                <input class="form-check-input" id="c1" name="riskfactvar" type="checkbox" value="Education"/>
                                                <label class="form-check-label" for="c1"> Education </label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="c2" name="riskfactvar" type="checkbox" value="Menstrual Cycle"/>
                                                <label class="form-check-label" for="c2"> Menstrual Cycle</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="c3" name="riskfactvar" type="checkbox" value="Children"/>
                                                <label class="form-check-label" for="c3"> Children</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="c4" name="riskfactvar" type="checkbox" value="Breastfeeding"/>
                                                <label class="form-check-label" for="c4"> Breastfeeding</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="c5" name="riskfactvar" type="checkbox" value="BMI"/>
                                                <label class="form-check-label" for="c5"> BMI</label>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-3 col-sm-12">
                                            <div class="form-check">
                                                <input class="form-check-input" id="c6" name="riskfactvar" type="checkbox" value="OC"/>
                                                <label class="form-check-label" for="c6"> Oral Contraceptive</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="c7" name="riskfactvar" type="checkbox" value="HRT"/>
                                                <label class="form-check-label" for="c7"> HRT</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="c8" name="riskfactvar" type="checkbox" value="Alcohol"/>
                                                <label class="form-check-label" for="c8"> Alcohol</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="c9" name="riskfactvar" type="checkbox" value="Smoking"/>
                                                <label class="form-check-label" for="c9"> Smoking</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="c10" name="criskfactvar10" type="checkbox" value="Family history"/>
                                                <label class="form-check-label" for="c10"> Family history</label>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-3 col-sm-12">
                                            <div class="form-check">
                                                <input class="form-check-input" id="c11" name="riskfactvar" type="checkbox" value="Biopsies"/>
                                                <label class="form-check-label" for="c11"> Biopsies</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="c12" name="riskfactvar" type="checkbox" value="Benign breast disease"/>
                                                <label class="form-check-label" for="c12"> Benign breast disease</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="c13" name="riskfactvar" type="checkbox" value="Screening"/>
                                                <label class="form-check-label" for="c13"> Screening</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>-->
                            <div class="input-group">
                                <label for="pathvar"><b>Pathology</b></label>
                                <label>
                                    <input id="pathvarv" name="pathvarv" type="checkbox" class="form-check-input" value="Yes" style="position: relative; top: -2px;"/> 
                                </label>
                            </div>
                            <!---<div class="input-group">
                                <div class="container-lg">
                                    <div class="row" id='pathlist'>
                                        <div class="col-12 col-md-3 col-sm-12">
                                            <div class="form-check">
                                                <input class="form-check-input" id="p1" name="pathvar" type="checkbox" value="Tumor Characteristics"/>
                                                <label class="form-check-label" for="p1"> Tumor Characteristics</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="p2" name="pathvar" type="checkbox" value="ER"/>
                                                <label class="form-check-label" for="p2"> ER</label>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-3 col-sm-12">
                                            <div class="form-check">
                                                <input class="form-check-input" id="p3" name="pathvar" type="checkbox" value="PR"/>
                                                <label class="form-check-label" for="p3"> PR</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="p4" name="pathvar" type="checkbox" value="HER2"/>
                                                <label class="form-check-label" for="p4"> HER2</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>--->
                            <div class="input-group">
                                <label for="surtrevar"><b>Survival and Treatment</b></label>
                                <label> 
                                    <input id="surtrevarv" name="surtrevarv" type="checkbox" class="form-check-input" value="Yes" style="position: relative; top: -2px;"/>
                                    (Not availale from AABCG)
                                </label>
                            </div>
                            <!---<div class="input-group">
                                <div class="container-lg">
                                    <div class="row" id='surtrelist'>
                                        <div class="col-12 col-md-3 col-sm-12">
                                            <div class="form-check">
                                                <input class="form-check-input" id="s1" name="surtrevar" type="checkbox" value="Survival"/>
                                                <label class="form-check-label" for="s1"> Survival </label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="s2" name="surtrevar" type="checkbox" value="Relapse"/>
                                                <label class="form-check-label" for="s2"> Relapse </label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="s3" name="surtrevar" type="checkbox" value="Adjuvant chemotherapy"/>
                                                <label class="form-check-label" for="s3"> Adjuvant Chemotherapy </label>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-3 col-sm-12">
                                            <div class="form-check">
                                                <input class="form-check-input" id="s4" name="surtrevar" type="checkbox" value="Adjuvant anti-hormone"/>
                                                <label class="form-check-label" for="s4"> Adjuvant anti-hormone </label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="s5" name="surtrevar" type="checkbox" value="Adjuvant trastuzumab"/>
                                                <label class="form-check-label" for="s5"> Adjuvant trastuzumab </label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="s6" name="surtrevar" type="checkbox" value="Surgery"/>
                                                <label class="form-check-label" for="s6"> Surgery </label>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-3 col-sm-12">
                                            <div class="form-check">
                                                <input class="form-check-input" id="s7" name="surtrevar" type="checkbox" value="Radiation therapy"/>
                                                <label class="form-check-label" for="s7"> Radiation therapy </label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" id="s8" name="surtrevar" type="checkbox" value="Neoadjuvant chemotherapy"/>
                                                <label class="form-check-label" for="s8"> Neoadjuvant chemotherapy</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>--->
                            <div class="input-group">
                                <label for="mammvar"><b>Mammographic Density</b></label>
                                <label> 
                                    <input id="mammvarv" name="mammvarv" type="checkbox" class="form-check-input" value="Yes" style="position: relative; top: -2px;"/>
                                    (Not availale from AABCG)
                                </label>
                            </div>
                            <br>
                            <p><u>3. ADDITIONAL INFORMATION</u></p>
                            <div class="input-group">
                                <label for="time"><b>Time Plan</b></label>
                                <textarea id="time" name="time" rows="4" cols="65" class="form-text-input"></textarea>
                            </div>
                            <div class="input-group">
                                <label for="anyoth"><b>Any other considerations you would like the DACCs to be aware of</b></label>
                                <textarea id="anyoth" name="anyoth" rows="4" cols="65" class="form-text-input"></textarea>
                            </div>
                            <div class="input-group">
                                <u id="tooltip1">
                                    <a>
                                        <label>
                                            <input id="confirmationAuth" name="confirmationAuth" class="form-check-input" type="checkbox" value="Yes" style="position: relative; top: -2px;" required/> 
                                            <b>Please confirm that you agree to comply with Confluence authorship requirements.</b>
                                            <span>
                                                It is expected that manuscripts will be co-led across multiple contributing groups and consortia. 
                                                Authorship for cross-consortia manuscripts using individual-level data or unpublished summary data will be proposed by 
                                                lead investigators at the time of concept submission to the DACCs, who will need to approve the proposed authorship. 
                                                It is anticipated that Recipient will propose authorships in the form of one of these alternatives:
                                                <ul>
                                                    <li>
                                                        Group(s) authorship with each group/consortium listed in the authorship byline. Contributions of the writing group 
                                                        and other authors will be noted in the contributions section of the manuscript. Authors will be PubMed searchable.
                                                    </li>
                                                </ul>
                                                <p class="indent"> or </p>
                                                <ul>
                                                    <li>
                                                        Named authors including co-first and co-last positions when appropriate. It is expected that manuscripts with named 
                                                        authors will include 2-4 authors per study, plus other contributors to data generation and analyses.
                                                    </li>
                                                </ul>
                                                A “hybrid authorship model” that includes some named authors in the author byline that are PubMed searchable, 
                                                while other authors are not listed in the author byline and are not PubMed searchable will not be acceptable. 
                                                The corresponding author of the manuscript is responsible for contacting journals of interest to learn about their 
                                                authorship guidelines early in the process of writing the manuscript to confirm the journal's guidelines are 
                                                compatible with the preferred authorship of the Confluence writing group.
                                            </span>
                                    </a>
                                </u>
                                <span class='required-label'>*</span></label>
                            </div>
                            <button type="submit" id="submitFormButton" class="buttonsubmit"> 
                                <span class="buttonsubmit__text"> Send Form & Download</span>
                            </button>
                            <!---<button type="button" id="downloadWord" class="buttonsubmit"> 
                                <span class="buttonsubmit__text"> Download Word </span>
                            </button>--->
                        </form>
                    </section>
                    <div id='popUpModal' class="modal" tabindex="-1" role="dialog">
                        <div class="modal-dialog" role="document">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body" id='modalBody'></div>
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
    
    // document.addEventListener('DOMContentLoaded', () => setupFormValidation('analysisConceptForm'));
    return template;
};

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
};

export const dataForm = async () => {
    async function handleFormSubmit(eventtest) {
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
        jsondata.carStatus = data.getAll("carStatus");
        jsondata.sex = data.getAll("sex");
        jsondata.condescsplit = jsondata.condesc.split('\n');
        jsondata.aimssplit = jsondata.condescAims.split('\n');
        jsondata.descsplit = jsondata.analdesc.split('\n');
        jsondata.timesplit = jsondata.time.split('\n');
        jsondata.anyothsplit = jsondata.anyoth.split('\n');

        // Added for testing
        // console.log(jsondata);
        // const downloadJSON = document.getElementById("downloadJSON");
        // let blob = new Blob([JSON.stringify(jsondata)], {type: "application/json",});
        // const downloadLink = URL.createObjectURL(blob);
        // let filename = jsondata.projname;
        // let a = document.createElement("a");
        // a.href = downloadLink;
        // a.download = filename;
        // a.click();
        
        await generateWord(jsondata);
        btn.classList.toggle("buttonsubmit--loading");
        btn.disabled = false;
    }

    async function generateWord(jsondata) {
        const condescRun = jsondata.condescsplit.map(line=>new docx.TextRun({break:1,text:line}));
        const aimsRun = jsondata.aimssplit.map(line=>new docx.TextRun({break:1,text:line}));
        const descRun = jsondata.descsplit.map(line=>new docx.TextRun({break:1,text:line}));
        const timeRun = jsondata.timesplit.map(line=>new docx.TextRun({break:1,text:line}));
        const anyothRun = jsondata.anyothsplit.map(line=>new docx.TextRun({break:1,text:line}));

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
                paragraphStyles: [{
                    id: "longinput",
                    name: "Long Input",
                    basedOn: "Normal",
                    paragraph: {
                        font: "Verdana",
                        size: 18,
                    },
                    run: {
                        font: "Verdana",
                        size: 18,
                    },
                }],
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
                                    alignment: docx.AlignmentType.CENTER
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
                                    text: "Date: "
                                }),
                                new docx.TextRun({
                                    text: jsondata.date,
                                    bold: false
                                })
                            ],
                            spacing: {
                                after: 150,
                            }
                        }),
                        
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Project Title: "
                                }),
                                new docx.TextRun({
                                    text: jsondata.projname,
                                    bold: false
                                }),
                            ],
                            spacing: {
                                after: 150
                            }
                        }),
                        
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Is this an amendment: "
                                }),
                                new docx.TextRun({
                                    text: jsondata.amendment,
                                    bold: false
                                }),
                            ],
                            spacing: {
                                after: 150
                            }
                        }),
                        
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Amendment: "
                                }),
                                new docx.TextRun({
                                    text: jsondata.conNum,
                                    bold: false
                                })
                            ],
                            spacing: {
                                after: 150
                            },
                        }),
                        
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Contact Investigator(s): "
                                }),
                                new docx.TextRun({
                                    text: jsondata.investigators,
                                    bold: false
                                })
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
                                    text: "Institution(s): "
                                }),
                                new docx.TextRun({
                                    text: jsondata.institution,
                                    bold: false
                                })
                            ],
                            spacing: {
                                after: 150
                            },
                        }),
                        
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Contact Email: "
                                }),
                                new docx.TextRun({
                                    text: jsondata.email,
                                    bold: false,
                                })
                            ],
                            spacing: {
                                after: 150
                            }
                        }),
                        
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Member of Consortia or Study / Trial Group? "
                                }),
                                new docx.TextRun({
                                    text: JSON.stringify(jsondata.memcon, null, 1).replace("[", "").replace("]", "").replace(/"/g, ''),
                                    bold: false
                                })
                            ],
                            spacing: {
                                after: 150
                            }
                        }),
                        
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Confluence Study Acronym(s) for the Contact Investigator: "
                                }),
                                new docx.TextRun({
                                    text: jsondata.acro,
                                    bold: false
                                })
                            ],
                            spacing: {
                                after: 150
                            }
                        }),
                        
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "OTHER Investigators and their institutions: "
                                }),
                                new docx.TextRun({
                                    text: jsondata.otherinvest,
                                    bold: false
                                })
                            ],
                            spacing: {
                                after: 150
                            }
                        }),
                        
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "ALL Investigators (and Institutions) who require access: "
                                }),
                                new docx.TextRun({
                                    text: jsondata.allinvest,
                                    bold: false
                                })
                            ],
                            spacing: {
                                after: 150
                            }
                        }),
                        
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Consortia data being requested: "
                                }),
                                new docx.TextRun({
                                    text: JSON.stringify(jsondata.datacon, null, 1).replace("[", "").replace("]", "").replace(/"/g, ''),
                                    bold: false
                                })
                            ],
                            spacing: {
                                after: 150
                            }
                        }),
                        
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Concept Background: "
                                }),
                            ],
                            spacing: {
                                after: 0
                            }
                        }),
                        
                        new docx.Paragraph({
                            style: "longinput",
                            children: condescRun,
                            spacing: {
                                after: 150
                            }
                        }),

                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Concept Aims: "
                                })
                            ],
                            spacing: {
                                after: 0
                            }
                        }),

                        new docx.Paragraph({
                            children: aimsRun,
                            spacing: {
                                after: 150
                            }, 
                            style: "longinput"
                        }),

                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Description of Analysis Plan: "
                                })
                            ],
                            spacing: {
                                after: 0
                            }
                        }),

                        new docx.Paragraph({
                            children: descRun,
                            spacing: {
                                after: 150
                            },
                            style: "longinput"
                        }),

                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Primary Endpoint: "
                                }),
                                new docx.TextRun({
                                    text: JSON.stringify(jsondata.primend, null, 1)
                                        .replace("[", "")
                                        .replace("]", "")
                                        .replace(/"/g, ''),
                                    bold: false
                                })
                            ],
                            spacing: {
                                after: 150
                            }
                        }),
            
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Subtype of Breast Cancer: "
                                }),
                                new docx.TextRun({
                                    text: jsondata.sbcin,
                                    bold: false
                                })
                            ],
                            spacing: {
                                after: 150
                            }
                        }),
            
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Other Primary Endpoint: "
                                }),
                                new docx.TextRun({
                                    text: jsondata.otherinput,
                                    bold: false
                                })
                            ],
                            spacing: {
                                after: 150
                            }
                        }),
            
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Genotyping: "
                                }),
                                new docx.TextRun({
                                    text: JSON.stringify(jsondata.genotyping, null, 1)
                                        .replace("[", "")
                                        .replace("]", "")
                                        .replace(/"/g, ''),
                                    bold: false
                                })
                            ],
                            spacing: {
                                after: 150
                            }
                        }),
            
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Data Requested From: "
                                }),
                                new docx.TextRun({
                                    text: JSON.stringify(jsondata.sex, null, 1)
                                        .replace("[", "")
                                        .replace("]", "")
                                        .replace(/"/g, ''),
                                    bold: false
                                })
                            ],
                            spacing: {
                                after: 150
                            }
                        }),
            
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Carrier Status requested: "
                                }),
                                new docx.TextRun({
                                    text: JSON.stringify(jsondata.carStatus, null, 1)
                                        .replace("[", "")
                                        .replace("]", "")
                                        .replace(/"/g, ''),
                                    bold: false
                                })
                            ],
                            spacing: {
                                after: 150
                            }
                        }),
            
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Risk Factor Variables: "
                                }),
                                new docx.TextRun({
                                    text: JSON.stringify(jsondata.riskfactvar, null, 1)
                                        .replace("[", "")
                                        .replace("]", "")
                                        .replace(/"/g, ''),
                                    bold: false
                                })
                            ],
                            spacing: {
                                after: 150
                            }
                        }),
            
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Pathology Variables: "
                                }),
                                new docx.TextRun({
                                    text: jsondata.pathvarv,
                                    bold: false
                                }),
                            ],
                            spacing: {
                                after: 150
                            }
                        }),
            
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Survival and Treatment Variables: "
                                }),
                                new docx.TextRun({
                                    text: jsondata.surtrevarv,
                                    bold: false
                                })
                            ],
                            spacing: {
                                after: 150
                            }
                        }),
            
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Mammographic Density Variable: "
                                }),
                                new docx.TextRun({
                                    text: jsondata.mammvarv,
                                    bold: false
                                })
                            ],
                            spacing: {
                                after: 150
                            }
                        }),
            
                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Time Plan: "
                                })
                            ],
                            spacing: {
                                after: 0
                            }
                        }),

                        new docx.Paragraph({
                            children: timeRun,
                            spacing: {
                                after: 150
                            },
                            style: "longinput"
                        }),

                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Any other considerations you would like the DACC to be aware of: "
                                })
                            ],
                            spacing: {
                                after: 0
                            }
                        }),

                        new docx.Paragraph({
                            children: anyothRun,
                            spacing: {
                                after: 150
                            },
                            style: "longinput"
                        }),

                        new docx.Paragraph({
                            heading: docx.HeadingLevel.HEADING_2,
                            alignment: docx.AlignmentType.START,
                            children: [
                                new docx.TextRun({
                                    text: "Confluence authorship requirements: "
                                }),
                                new docx.TextRun({
                                    text: jsondata.confirmationAuth,
                                    bold: false
                                })
                            ],
                            spacing: {
                                after: 150
                            }
                        }),
                    ],
                },
            ],
        });
    
        let user = JSON.parse(localStorage.parms).login.split('@')[0];
        const date = new Date();
        const today = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
        let filename = jsondata.projname + '_' + user + '_' + today + '_' + Date.now() + '.docx';
        
        await docx.Packer.toBlob(doc).then(async (blob, btn) => {
            // let response = await uploadWordFile(blob, filename, submitterFolder);
            let response = {'status': 201};
            console.log(response);
            
            if (response.status === 401) {
                document.getElementById("modalBody").innerHTML = `<p>Error detected, please upload again.</p>`;
                $("#popUpModal").modal("show");
                btn.classList.toggle("buttonsubmit--loading");
                btn.disabled = false;
            } else if (response.status === 409) {
                document.getElementById("modalBody").innerHTML = `<p>Conflict detected, please upload again.</p>`;
                $("#popUpModal").modal("show");
                btn.classList.toggle("buttonsubmit--loading");
                btn.disabled = false;
            } else {
                // let fileid = response.entries[0].id;
                let fileid = "testing";
                // let metaData = addMetaData(fileid, jsondata.datacon);
                const downloadLink = URL.createObjectURL(blob);
                
                let a = document.createElement("a");
                a.href = downloadLink;
                a.download = filename;
                
                document.getElementById("modalBody").innerHTML = `
                    <p>File was successfully uploaded.</p>
                    <p>Document ID: ${fileid}</p>
                `;
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
    }

    const form = document.querySelector(".contact-form");
    form.addEventListener("submit", handleFormSubmit);
};

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
                    <h5> If you continue experiencing issues, you may also 
                        <a href="https://nih.app.box.com/f/818f3ca628ec4c12a2d5d2ed40029840" target="_blank" rel="noopener noreferrer">submit your file here</a>. 
                    </h5>
                    <div class="uploadContainer">
                        <iframe src="https://nih.app.box.com/f/818f3ca628ec4c12a2d5d2ed40029840" height="1000" width="1000"></iframe>
                    </div>
                </div>
            </div>
        </div>
    `
    
    return template;
};

export const createPar = (text) => {
    return new docx.Paragraph({
        text: text,
        bullet: {
            level: 0
        }
    })
};

export const createHeading = (text) => {
    return new docx.Paragraph({
        text: text,
        heading: docx.HeadingLevel.HEADING_1,
        thematicBreak: true
    });
};

// Add this function to your file
// export const setupFormValidation = (formId) => {
//     const form = document.getElementById(formId);
//     if (!form) return;
  
//     form.addEventListener('submit', function(event) {
//         let hasErrors = false;
//         const requiredFields = this.querySelectorAll('[required]');
    
//         // Clear previous errors
//         document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
//         document.querySelectorAll('.form-text-input').forEach(el => el.classList.remove('input-error'));
    
//         requiredFields.forEach(field => {
//             if (!field.value.trim()) {
//                 event.preventDefault();
//                 hasErrors = true;
//                 field.classList.add('input-error');
//                 const errorId = field.id + '-error';
//                 const errorElement = document.getElementById(errorId);
//                 
//                 if (errorElement) {
//                     errorElement.textContent = 'This field is required';
//                 }
//                 
//                 field.setAttribute('aria-invalid', 'true');
//             } else {
//                 field.setAttribute('aria-invalid', 'false');
//             }
//         });
    
//         if (hasErrors) {
//             event.preventDefault();
//             
//             // Focus the first field with an error
//             document.querySelector('.input-error').focus();
//         }
//     });
// };