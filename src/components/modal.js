import { getFolderItems, filterConsortiums, checkMyPermissionLevel, getCollaboration } from "../shared.js"

export const uploadInStudy = async (id) => {
    return `<div class="modal fade" id="${id}" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" data-backdrop="static" aria-labelledby="${id}" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content sub-div-shadow">
                <div class="modal-header allow-overflow">
                <h5 class="modal-title">Upload in existing study</h5>
                    <button type="button" title="Close" class="close" title="Close" data-dismiss="modal" aria-label="Close">
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
                    </div>
                    <div class="modal-footer">
                        <button type="submit" title="Submit" class="btn btn-light sub-div-shadow" id="submitBtn">Submit</button>
                        <button type="button" title="Close" class="btn btn-dark sub-div-shadow" data-dismiss="modal">Close</button>
                    </div>
                </form>
            </div>
        </div>
    </div>`
}

export const shareFolderModal = () => {
    return `<div class="modal fade" id="modalShareFolder" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" data-backdrop="static" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div class="modal-content sub-div-shadow">
                <div class="modal-header allow-overflow">
                    <div id="folderToShare"></div>
                    <ul class="nav nav-tabs">
                        <li class="nav-item">
                            <button title="Add collaborator(s)" class="nav-link sub-div-shadow" id="addNewCollaborators">Add collaborator(s)</button>
                        </li>
                        
                        <li class="nav-item">
                            <button title="All collaborator(s)" class="nav-link sub-div-shadow" id="listCollaborators">All collaborator(s)</button>
                        </li>
                    </ul>
                    
                    <button type="button" title="Close" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <div id="collaboratorModalBody"></div>
            </div>
        </div>
    </div>`
}

export const createProjectModal = () => {
    return `<div class="modal fade" id="createProjectModal" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" data-backdrop="static" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div class="modal-content sub-div-shadow">
                <div class="modal-header allow-overflow">
                    <strong><i class="fas fa-project-diagram"></i> Create project</strong>
                    <button type="button" title="Close" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body allow-overflow" id="createProjectModalBody"></div>
            </div>
        </div>
    </div>`
}

export const fileAccessStatsModal = () => {
    return `<div class="modal fade" id="modalFileAccessStats" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" data-backdrop="static" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div class="modal-content sub-div-shadow">
                <div class="modal-header allow-overflow" id="modalFileStatsHeader"></div>
                <div class="modal-body allow-overflow" id="modalFileStatsBody"></div>
                <div class="modal-footer">
                    <button type="button" title="Close" class="btn btn-dark sub-div-shadow" data-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>`
}

export const fileVersionsModal = () => {
    return `<div class="modal fade" id="modalFileVersions" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" data-backdrop="static" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div class="modal-content sub-div-shadow">
                <div class="modal-header allow-overflow" id="modalFVHeader"></div>
                <div class="modal-body allow-overflow" id="modalFVBody"></div>
                <div class="modal-footer">
                    <button type="button" title="Close" class="btn btn-dark sub-div-shadow" data-dismiss="modal">Close</button>
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
        const bool = checkMyPermissionLevel(await getCollaboration(consortia.id, `${consortia.type}s`), JSON.parse(localStorage.parms).login);
        if(bool === true) template += `<option value="${consortia.id}">${consortia.name}</option>`
    }
    return template;
}