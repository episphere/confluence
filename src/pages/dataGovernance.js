import { addEventShowAllCollaborator, addEventAddNewCollaborator, addEventFileStats } from "../event.js";
import { boxRoles } from "../config.js";
import { getFolderItems, filterConsortiums, filterStudiesDataTypes, filterProjects, getCollaboration, checkMyPermissionLevel } from "../shared.js";

export const template = async () => {
    const response = await getFolderItems(0);
    const array = filterConsortiums(response.entries);
    if(array.length <= 0) return;
    
    let template = `<div class="card border sub-div-shadow"><div class="card-header"><strong>Consortium(s)</strong></div>`;
    
    template += '<div class="card-body data-governance"><ul class="ul-list-style first-list-item collapsible-items">';

    for(let obj of array){
        const consortiaName = obj.name;
        let type = obj.type;
        let liClass = type === 'folder' ? 'collapsible consortia-folder' : '';
        let title = type === 'folder' ? 'Expand / Collapse' : '';
        template += `<li class="collapsible-items">
            <a class="${liClass}">
                <i title="${title}" data-type="${type}" data-id="${obj.id}" data-folder-name="${consortiaName}" data-status="pending" class="lazy-loading-spinner"></i>
            </a> ${consortiaName}
        </li>
        `
    }
    template += `</ul></div></div>`
    return template;
}

export const dataGovernanceProjects = async () => {
    const response = await getFolderItems(0);
    const projectArray = filterProjects(response.entries);
    const div = document.getElementById('dataGovernanceProjects');
    let template = '';
    let checker = false;
    for(let obj = 0; obj < projectArray.length; obj++){
        if(checker === false) {
            const bool = checkMyPermissionLevel(await getCollaboration(projectArray[obj].id, `${projectArray[obj].type}s`), JSON.parse(localStorage.parms).login);
            if(bool === true) checker = true;
        }
    }
    if(checker === true) {
        for(let obj = 0; obj < projectArray.length; obj++){
            const bool = checkMyPermissionLevel(await getCollaboration(projectArray[obj].id, `${projectArray[obj].type}s`), JSON.parse(localStorage.parms).login);
            if(obj === 0) template += `<div class="card border sub-div-shadow"><div class="card-header">
                                            <strong>Project(s)</strong>
                                        </div> 
                                        <div class="card-body data-governance">
                                            <ul class="ul-list-style first-list-item">`;
            if(bool === true) {
                const projectName = projectArray[obj].name;
                let type = projectArray[obj].type;
                let liClass = type === 'folder' ? 'collapsible consortia-folder' : '';
                let title = type === 'folder' ? 'Expand / Collapse' : '';
                template += `
                <li class="collapsible-items">
                    <a class="${liClass}">
                        <i title="${title}" data-type="${type}" data-id="${projectArray[obj].id}" data-folder-name="${projectName}" data-status="pending" class="lazy-loading-spinner"></i>
                    </a> ${projectName}
                </li>
                `;
            }
            if(obj === projectArray.length - 1 ) template += `</ul></div></div>`
        }
    }
    
    div.innerHTML = template;
    
    dataGovernanceLazyLoad();
}

export const dataGovernanceLazyLoad = (element) => {
    let spinners = document.getElementsByClassName('lazy-loading-spinner');
    if(element) spinners = element.parentNode.querySelectorAll('.lazy-loading-spinner');
    Array.from(spinners).forEach(async element => {
        const id = element.dataset.id;
        const status = element.dataset.status;
        const type = element.dataset.type;
        if(type && JSON.parse(localStorage.parms).login){
            const bool = checkMyPermissionLevel(await getCollaboration(id, `${type}s`), JSON.parse(localStorage.parms).login);
            if(bool === true){
                const a = document.createElement('a');
                a.dataset.toggle = 'modal';
                a.dataset.target = '#modalShareFolder'
                a.classList = ['share-folder'];
                a.dataset.permissionType = 'restrict';
                a.dataset.folderId = id;
                a.title = 'Manage collaboration';
                a.dataset.folderName = element.dataset.folderName;
                a.dataset.objectType = type;
                a.innerHTML = `<i class="fas fa-share"></i>`
                element.parentNode.parentNode.appendChild(a);
                shareData(a);
            }
            else{
                element.dataset.sharable = 'no';
            }
        } 
        if(status !== 'pending') return;
        let allEntries = (await getFolderItems(id)).entries;
        if(allEntries.length === 0){
            element.classList = ['fas fa-exclamation-circle'];
            element.title = 'Empty folder'
        }
        allEntries = allEntries.filter(dt => dt.name !== 'Study Documents')
        element.dataset.status = 'complete';
        const entries = filterStudiesDataTypes(allEntries);
        const fileEntries = allEntries.filter(obj => obj.type === 'file');
        if (entries.length > 0){
            const ul = document.createElement('ul');
            ul.classList.add('ul-list-style');
            ul.classList.add('content');

            for(const obj of entries){
                const li = document.createElement('li');
                li.classList = ['collapsible-items'];
                let type = obj.type;
                let liClass = type === 'folder' ? 'collapsible consortia-folder' : '';
                let title = type === 'folder' ? 'Expand / Collapse' : '';
                li.innerHTML = `<a class="${liClass}"><i title="${title}" data-id="${obj.id}" ${element.dataset.sharable && element.dataset.sharable === 'no' ? `data-sharable = "no"` : ``} data-status="pending" class="lazy-loading-spinner"></i></a> ${obj.name}`;

                if(!element.dataset.sharable){
                    const a = document.createElement('a');
                    a.dataset.toggle = 'modal';
                    a.dataset.target = '#modalShareFolder';
                    a.classList = ['share-folder'];
                    a.dataset.folderId = obj.id;
                    a.dataset.folderName = obj.name;
                    a.dataset.objectType = type;
                    a.title = 'Manage collaboration';
                    a.innerHTML = `<i class="fas fa-share"></i>`;
                    li.appendChild(a);
                    shareData(a);
                }
                ul.appendChild(li);
            }

            element.classList.remove('lazy-loading-spinner');
            element.classList.add('fas');
            element.classList.add('fa-folder-plus');
            element.parentNode.parentNode.appendChild(ul);
            eventsDataSubmissions(element.parentNode);
        }
        else if(fileEntries.length > 0) {
            const ul = document.createElement('ul');
            ul.classList.add('ul-list-style');
            ul.classList.add('content');

            for(const obj of fileEntries){
                const li = document.createElement('li');
                li.classList = ['collapsible-items'];
                li.innerHTML = `<a>
                        <i title="file" data-id="${obj.id}" data-status="pending"${element.dataset.sharable && element.dataset.sharable === 'no' ? `data-sharable = "no"` : ``} class="fas fa-file-alt"></i>
                        </a> <span title="${obj.name}">${obj.name.length > 20 ? `${obj.name.slice(0, 20)}...` : `${obj.name}`}</span>
                    `;

                if(!element.dataset.sharable){
                    const a1 = document.createElement('a');
                    a1.dataset.toggle = 'modal';
                    a1.dataset.target = '#modalShareFolder';
                    a1.classList = ['share-folder'];
                    a1.dataset.folderId = obj.id;
                    a1.dataset.folderName = obj.name;
                    a1.dataset.objectType = obj.type;
                    a1.title = 'Manage collaboration';
                    a1.innerHTML = `<i class="fas fa-share"></i>`;
                    li.appendChild(a1);
                    shareData(a1);

                    const a2 = document.createElement('a');
                    a2.dataset.toggle = 'modal';
                    a2.dataset.target = '#modalFileAccessStats';
                    a2.classList = ['file-access-stats'];
                    a2.dataset.fileId = obj.id;
                    a2.dataset.fileName = obj.name;
                    a2.dataset.objectType = obj.type;
                    a2.title = 'File access stats';
                    a2.innerHTML = `<i class="fas fa-info-circle"></i>`;
                    li.appendChild(a2);
                    addEventFileStats(a2);
                }
                ul.appendChild(li);
            }

            element.classList.remove('lazy-loading-spinner');
            element.classList.add('fas');
            element.classList.add('fa-folder-plus');
            element.parentNode.parentNode.appendChild(ul);
            eventsDataSubmissions(element.parentNode);
        }
    });
}

export const eventsDataSubmissions = (element) => {
    element.addEventListener('click', e => {
        e.preventDefault();
        element.classList.toggle('.active');
        let content = element.parentNode.lastElementChild;
        if (content.style.maxHeight){
            content.style.maxHeight = null;
            element.getElementsByClassName('fa-folder-minus')[0].classList.add('fa-folder-plus');
            element.getElementsByClassName('fa-folder-minus')[0].classList.remove('fa-folder-minus');
        } else {
            element.getElementsByClassName('fa-folder-plus')[0].classList.add('fa-folder-minus');
            element.getElementsByClassName('fa-folder-plus')[0].classList.remove('fa-folder-plus');
            content.style.maxHeight = "1000px";
            if(document.getElementsByClassName('lazy-loading-spinner').length !== 0){
                dataGovernanceLazyLoad(element);
            }
        } 
    });
}

export const dataGovernanceCollaboration = () => {
    let consortiaFolder = document.getElementsByClassName('consortia-folder');
    Array.from(consortiaFolder).forEach(element => {
        element.dispatchEvent(new Event('click'));
    });
}

export const shareData = (element) => {
    const btn1 = document.getElementById('addNewCollaborators');
    const folderToShare = document.getElementById('folderToShare');
    addEventAddNewCollaborator();
    addEventShowAllCollaborator();
    element.addEventListener('click', () => {
        folderToShare.dataset.folderId = element.dataset.folderId;
        folderToShare.dataset.folderName = element.dataset.folderName;
        folderToShare.dataset.objectType = element.dataset.objectType;
        btn1.dispatchEvent(new Event('click'));
    });
}

export const addFields = (id, bool) => {
    let template = '';
    template += `
    <div class="form-group col-sm-9">
        <textarea id="shareFolderEmail${id}" required class="form-control" placeholder="Enter comma separated email addresses" require  rows="2"></textarea>
    </div>
    <div class="form-group col-sm-3">
    <select class="form-control" required id="folderRole${id}">
        <option value=""> -- Select role -- </option>
    `;

    if(bool) template += `<option value="viewer">Viewer</option>`
    else{
        for(let key in boxRoles){
            template += `<option value="${key}">${key}</option>`
        }
    }
        
    template +=`</select></div>`;
    return template;
}