export const uploadInStudy = (id, data) => {
    return `<div class="modal fade" id="${id}" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" data-backdrop="static" aria-labelledby="${id}" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header">
                <h5 class="modal-title">Upload in existing study</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form id="uploadStudyForm" method="POST">
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="selectConsortiaUIS">Select consortia</label>
                            <select class="form-control" name="selectedConsortia" id="selectConsortiaUIS" required>
                                <option value="">-- Select consortia --</option>
                                ${createConsortiaOptions(data)}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="selectStudyUIS">Select study</label>
                            <select class="form-control" id="selectStudyUIS" name="selectedStudy" required></select>
                        </div>
                        <div class="form-group">
                            <label for="uploadDataUIS">Upload data</label>
                            <input type="file" class="form-control-file" id="uploadDataUIS" name="dataFile" required>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        <button type="submit" class="btn btn-primary">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    </div>`
}

export const shareFolderModal = () => {
    return `<div class="modal fade" id="modalShareFolder" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" data-backdrop="static" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <div id="folderToShare"></div>
                    <ul class="nav nav-tabs">
                        <li class="nav-item">
                            <button class="nav-link active" id="addNewCollaborators" href="#">Add collaborator</button>
                        </li>
                        
                        <li class="nav-item">
                            <button class="nav-link" id="listCollaborators" href="#">All collaborators</button>
                        </li>
                    </ul>
                    
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <div id="collaboratorModalBody"></div>
            </div>
        </div>
    </div>`
}

const createConsortiaOptions = (data) => {
    let template = ``;
    for(let consortia in data){
        template += `<option value="${consortia}">${data[consortia].name}</option>`
    }
    return template;
}