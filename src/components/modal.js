import { getFolderItems, filterConsortiums, getCollaboration, checkDataSubmissionPermissionLevel } from "../shared.js"

export const uploadInStudy = async (id) => {
    return `<div class="modal fade" id="${id}" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" data-backdrop="static" aria-labelledby="${id}" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header allow-overflow">
                <h5 class="modal-title">Upload data</h5>
                    <button type="button" title="Close" class="close modal-close-btn" title="Close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form id="uploadStudyForm" method="POST">
                    <div class="modal-body allow-overflow">
                        <div class="form-group">
                            <label for="selectConsortiaUIS">Select consortia</label> <span class="required">*</span>
                            <select class="form-control" name="selectedConsortia" id="selectConsortiaUIS" required>
                                <option value="">-- Select consortia --</option>
                                ${await createConsortiaOptions()}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Create new study? <span class="required">*</span>
                                <div class="form-check form-check-inline">
                                    <label class="form-check-label">
                                        <input class="form-check-input" type="radio" required name="createStudyRadio" value="yes">Yes
                                    </label>
                                </div>
                                <div class="form-check form-check-inline">
                                    <label class="form-check-label">
                                        <input class="form-check-input" type="radio" required name="createStudyRadio" value="no">No
                                    </label>
                                </div>
                            </label>
                        </div>
                        <div id="studyFormElements"></div>
                        <div id="uploadErrorReport"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" title="Submit" class="btn btn-light" id="submitBtn">run QAQC</button>
                        <button type="button" title="Close" class="btn btn-dark" data-dismiss="modal">Close</button>
                    </div>
                </form>
            </div>
        </div>
    </div>`
}


export const createProjectModal = () => {
    return `<div class="modal fade" id="createProjectModal" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" data-backdrop="static" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header allow-overflow">
                    <strong><i class="fas fa-project-diagram"></i> Create project</strong>
                    <button type="button" title="Close" class="close modal-close-btn" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body allow-overflow" id="createProjectModalBody"></div>
            </div>
        </div>
    </div>`
}


export const fileVersionsModal = () => {
    return `<div class="modal fade" id="modalFileVersions" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" data-backdrop="static" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header allow-overflow" id="modalFVHeader"></div>
                <div class="modal-body allow-overflow" id="modalFVBody"></div>
                <div class="modal-footer">
                    <button type="button" title="Close" class="btn btn-dark" data-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>`
}


const createConsortiaOptions = async () => {
    let template = ``;
    const response = await getFolderItems(0);
    const array = filterConsortiums(response.entries);
    for(let consortia of array){
        const bool = checkDataSubmissionPermissionLevel(await getCollaboration(consortia.id, `${consortia.type}s`), JSON.parse(localStorage.parms).login);
        if(bool === true) template += `<option value="${consortia.id}">${consortia.name}</option>`
    }
    return template;
}