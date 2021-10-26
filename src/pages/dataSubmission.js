import { getFolderItems, filterStudiesDataTypes, filterConsortiums, hideAnimation, checkDataSubmissionPermissionLevel, getCollaboration, getFile, tsv2Json } from "../shared.js";
import { uploadInStudy } from "../components/modal.js";

export const dataSubmissionTemplate = async () => {
    const response = await getFolderItems(0);
    const studiesList = await getFile('850171303009')
    let studyIDs = [];
    if(studiesList) studyIDs = tsv2Json(studiesList).data.map(dt => dt['Folder ID'].trim());
    const studies = response.entries.filter(obj => studyIDs.includes(obj.id));
    const consortias = filterConsortiums(response.entries);
    const array = [...studies, ...consortias];
    let bool = false;
    for(let consortia of array){
        if(bool) continue;
        const permitted = checkDataSubmissionPermissionLevel(await getCollaboration(consortia.id, `${consortia.type}s`), JSON.parse(localStorage.parms).login);
        if(permitted) bool = true;
    }
    if(array.length <= 0) {
        hideAnimation();
        return `<div class="general-bg padding-bottom-1rem">
                    <div class="container body-min-height">
                        <div class="main-summary-row">
                            <div class="align-left">
                                <h1 class="page-header">Data Submitted</h1>
                            </div>
                        </div>
                        <div class="data-submission div-border font-size-18" style="padding-left: 1rem;">
                            No folder found for Data Submission
                        </div>
                    </div>
                </div>`;
    };
    
    let template = '';
    
    template += `
        <div class="general-bg padding-bottom-1rem">
            <div class="container body-min-height font-size-18">
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">Data Submitted</h1>
                    </div>
                </div>
                ${bool ? `
                <div class="row create-study">
                    <div class="upload-in-study">
                        <button data-toggle="modal" id="uploadDataBtn" title="Submit data" data-target="#uploadInStudy" class="btn btn-light div-border">
                            <i class="fas fa-upload"></i> Submit data
                        </button>
                    </div>
                </div>
                `:``}`;

    template += await uploadInStudy('uploadInStudy');
    
    template += '<div class="data-submission div-border white-bg"><ul class="ul-list-style first-list-item collapsible-items mb-0">';

    for(let obj of array){
        const consortiaName = obj.name;
        let type = obj.type;
        let liClass = type === 'folder' ? 'collapsible consortia-folder' : '';
        let title = type === 'folder' ? 'Expand / Collapse' : '';
        template += `<li class="collapsible-items">
                        <button class="${liClass}" data-toggle="collapse" href="#toggle${obj.id}">
                            <i title="${title}" data-id="${obj.id}" data-folder-name="${consortiaName}" data-status="pending" class="lazy-loading-spinner"></i>
                        </button> 
                        ${consortiaName}
                        <a href="https://nih.app.box.com/${type === 'folder' ? 'folder' : 'file'}/${obj.id}" target="_blank" title="Open ${obj.type}"><i class="fas fa-external-link-alt"></i></a>
                    </li>`
    }

    template += '</ul></div></div></div>';
    return template;
};

export const lazyload = (element) => {
    let spinners = document.getElementsByClassName('lazy-loading-spinner');
    if(element) spinners = element.parentNode.querySelectorAll('.lazy-loading-spinner');
    Array.from(spinners).forEach(async element => {
        const id = element.dataset.id;
        const status = element.dataset.status;
        if(status !== 'pending') return;
        let allEntries = (await getFolderItems(id)).entries;
        if(allEntries.length === 0){
            element.classList = ['fas fa-exclamation-circle'];
            element.title = 'Empty folder'
        }
        allEntries = allEntries.filter(dt => dt.name !== 'Study Documents');
        element.dataset.status = 'complete';
        const entries = filterStudiesDataTypes(allEntries);
        const fileEntries = allEntries.filter(obj => obj.type === 'file');
        if (entries.length > 0){
            const ul = document.createElement('ul');
            ul.classList = ['ul-list-style collapse'];
            ul.id = `toggle${id}`

            for(const obj of entries){
                const li = document.createElement('li');
                li.classList = ['collapsible-items'];
                let type = obj.type;
                let liClass = type === 'folder' ? 'collapsible consortia-folder' : '';
                let title = type === 'folder' ? 'Expand / Collapse' : '';
                li.innerHTML = `<button class="${liClass}" data-toggle="collapse" href="#toggle${obj.id}">
                                    <i title="${title}" data-id="${obj.id}" data-folder-name="${obj.name}" data-status="pending" class="lazy-loading-spinner"></i>
                                </button> 
                                ${obj.name}
                                <a href="https://nih.app.box.com/${type === 'folder' ? 'folder' : 'file'}/${obj.id}" target="_blank" title="Open ${obj.type}"><i class="fas fa-external-link-alt"></i></a>`;
                ul.appendChild(li);
            }

            element.classList.remove('lazy-loading-spinner');
            element.classList.add('fas');
            element.classList.add('fa-folder-plus');
            element.parentNode.parentNode.appendChild(ul);
            dataSubmission(element.parentNode);
        }
        else if(fileEntries.length > 0) {
            const ul = document.createElement('ul');
            ul.classList = ['ul-list-style collapse'];
            ul.id = `toggle${id}`

            for(const obj of fileEntries){
                const li = document.createElement('li');
                li.classList = ['collapsible-items'];
                li.innerHTML = `<a><i title="files" data-id="${obj.id}" data-status="pending" class="fas fa-file-alt"></i></a> 
                                ${obj.name}
                                <a href="https://nih.app.box.com/${obj.type === 'folder' ? 'folder' : 'file'}/${obj.id}" target="_blank" title="Open ${obj.type}"><i class="fas fa-external-link-alt"></i></a>
                                `;
                ul.appendChild(li);
            }

            element.classList.remove('lazy-loading-spinner');
            element.classList.add('fas');
            element.classList.add('fa-folder-plus');
            element.parentNode.parentNode.appendChild(ul);
            dataSubmission(element.parentNode);
        }
    });
}

export const dataSubmission = (element) => {
    element.addEventListener('click', e => {
        e.preventDefault();
        if (element.getElementsByClassName('fa-folder-minus').length > 0 && element.getElementsByClassName('fa-folder-minus')[0].classList.contains('fa-folder-minus')){
            element.getElementsByClassName('fa-folder-minus')[0].classList.add('fa-folder-plus');
            element.getElementsByClassName('fa-folder-minus')[0].classList.remove('fa-folder-minus');
        } else {
            element.getElementsByClassName('fa-folder-plus')[0].classList.add('fa-folder-minus');
            element.getElementsByClassName('fa-folder-plus')[0].classList.remove('fa-folder-plus');
            if(document.getElementsByClassName('lazy-loading-spinner').length !== 0){
                lazyload(element);
            }
        }
    });
    
    // let consortiaFolder = document.getElementsByClassName('consortia-folder');
    // Array.from(consortiaFolder).forEach(element => {
    //     element.dispatchEvent(new Event('click'));
    // });
};
