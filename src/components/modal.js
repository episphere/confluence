export const createStudyModal = (id, data) => {
    return `<div class="modal fade" data-keyboard="false" data-backdrop="static" id="${id}" tabindex="-1" role="dialog" aria-labelledby="${id}" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header">
                <h5 class="modal-title">Add new study</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form id="creatStudyForm">
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="selectConsortia">Select consortia</label>
                            <select class="form-control" id="selectConsortia" required>
                                <option value="">-- Select consortia --</option>
                                ${createConsortiaOptions(data)}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="studyName">Study name</label>
                            <input type="text" class="form-control" id="studyName" placeholder="Enter study name" required>
                        </div>
                        <div class="form-group">
                            <label for="uploadData">Upload data</label>
                            <input type="file" class="form-control-file" id="uploadFile" required>
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

const createConsortiaOptions = (data) => {
    let template = ``;
    for(let consortia in data){
        template += `<option value="${consortia}">${data[consortia].name}</option>`
    }
    return template;
}