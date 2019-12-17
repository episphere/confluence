import { shareFolderModal } from "../components/modal.js";
import { addEventShowAllCollaborator, addEventAddNewCollaborator } from "../event.js";
import { boxRoles } from "../config.js";
import { getFolderItems, filterConsortiums, filterStudiesDataTypes, filterProjects, getCollaboration, checkMyPermissionLevel } from "../shared.js";

export const template = async () => {
    const response = await getFolderItems(0);
    const array = filterConsortiums(response.entries);
    if(array.length <= 0) return;

    let template = `
        <h4 class="h4-heading">Consortium(s)</h4>
    `;
    
    template += '<div class="data-governance"><ul class="ul-list-style first-list-item">';

    for(let obj of array){
        const consortiaName = obj.name;
        let type = obj.type;
        let liClass = type === 'folder' ? 'collapsible consortia-folder' : '';
        let title = type === 'folder' ? 'Expand / Collapse' : '';
        template += `<li>
            <a class="${liClass}" href="#">
                <i title="${title}" data-type="${type}" data-id="${obj.id}" data-folder-name="${consortiaName}" data-status="pending" class="lazy-loading-spinner"></i>
            </a> ${consortiaName}
            
        </li>
        `
    }
    template += `</ul>${shareFolderModal()}</div>`
    return template;
}

export const dataGovernanceProjects = async () => {
    const response = await getFolderItems(0);
    const projectArray = filterProjects(response.entries);
    const div = document.getElementById('dataGovernanceProjects');
    let template = '';
    
    for(let obj = 0; obj < projectArray.length; obj++){
        const bool = checkMyPermissionLevel(await getCollaboration(projectArray[obj].id, `${projectArray[obj].type}s`), JSON.parse(localStorage.parms).login);
        if(bool) {
            if(obj === 0) template += '<h4 class="h4-heading">Project(s)</h4><div class="data-governance"><ul class="ul-list-style first-list-item">';
            const projectName = projectArray[obj].name;
            let type = projectArray[obj].type;
            let liClass = type === 'folder' ? 'collapsible consortia-folder' : '';
            let title = type === 'folder' ? 'Expand / Collapse' : '';
            template += `
            <li>
                <a class="${liClass}" href="#">
                    <i title="${title}" data-type="${type}" data-id="${projectArray[obj].id}" data-folder-name="${projectName}" data-status="pending" class="lazy-loading-spinner"></i>
                </a> ${projectName}
            </li>
            `;
            if(obj === projectArray.length - 1 ) template += `</ul>${shareFolderModal()}</div>`
        }
    }
    div.innerHTML = template;
    dataGovernanceLazyLoad();
}

export const dataGovernanceLazyLoad = () => {
    const spinners = document.getElementsByClassName('lazy-loading-spinner');
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
                a.dataset.folderName = element.dataset.folderName;
                a.dataset.objectType = type;
                a.href = '#';
                a.innerHTML = `<i class="fas fa-share"></i> Share`
                element.parentNode.parentNode.appendChild(a);
            }
            else{
                element.dataset.sharable = 'no';
            }
        } 
        if(status !== 'pending') return;
        const allEntries = (await getFolderItems(id)).entries;
        element.dataset.status = 'complete';
        const entries = filterStudiesDataTypes(allEntries);
        const fileEntries = allEntries.filter(obj => obj.type === 'file');
        if (entries.length > 0){
            const ul = document.createElement('ul');
            ul.classList.add('ul-list-style');
            ul.classList.add('content');

            for(const obj of entries){
                const li = document.createElement('li');
                let type = obj.type;
                let liClass = type === 'folder' ? 'collapsible consortia-folder' : '';
                let title = type === 'folder' ? 'Expand / Collapse' : '';
                li.innerHTML = `<a class="${liClass}" href="#"><i title="${title}" data-id="${obj.id}" ${element.dataset.sharable && element.dataset.sharable === 'no' ? `data-sharable = "no"` : ``} data-status="pending" class="lazy-loading-spinner"></i></a> ${obj.name} 
                    ${element.dataset.sharable && element.dataset.sharable === 'no' ? `` : `<a data-toggle="modal" data-target="#modalShareFolder" class="share-folder" data-folder-id=${obj.id} data-folder-name="${obj.name}" data-object-type=${type} href="#"><i class="fas fa-share"></i> Share</a>`}`;
                ul.appendChild(li);
            }

            element.classList.remove('lazy-loading-spinner');
            element.classList.add('fas');
            element.classList.add('fa-folder-plus');
            element.parentNode.parentNode.appendChild(ul);
            eventsDataSubmissions(element.parentNode);
            shareData();
        }
        else if(fileEntries.length > 0) {
            const ul = document.createElement('ul');
            ul.classList.add('ul-list-style');
            ul.classList.add('content');

            for(const obj of fileEntries){
                const li = document.createElement('li');
                li.innerHTML = `<a href="#"><i title="files" data-id="${obj.id}" data-status="pending"${element.dataset.sharable && element.dataset.sharable === 'no' ? `data-sharable = "no"` : ``} class="fas fa-file-alt"></i></a> ${obj.name} 
                    ${element.dataset.sharable && element.dataset.sharable === 'no' ? `` : `<a data-toggle="modal" data-target="#modalShareFolder" class="share-folder" data-folder-id=${obj.id} data-folder-name="${obj.name}" data-object-type=${obj.type} href="#"><i class="fas fa-share"></i> Share</a>`}`;
                ul.appendChild(li);
            }

            element.classList.remove('lazy-loading-spinner');
            element.classList.add('fas');
            element.classList.add('fa-folder-plus');
            element.parentNode.parentNode.appendChild(ul);
            eventsDataSubmissions(element.parentNode);
            shareData();
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
                dataGovernanceLazyLoad();
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

export const shareData = () => {
    const shareFolder = document.getElementsByClassName('share-folder');
    const btn1 = document.getElementById('addNewCollaborators');
    
    const folderToShare = document.getElementById('folderToShare');
    
    addEventAddNewCollaborator();
    addEventShowAllCollaborator();
    
    Array.from(shareFolder).forEach(element => {
        element.addEventListener('click', () => {
            folderToShare.dataset.folderId = element.dataset.folderId;
            folderToShare.dataset.folderName = element.dataset.folderName;
            folderToShare.dataset.objectType = element.dataset.objectType;
            btn1.dispatchEvent(new Event('click'));
        });
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