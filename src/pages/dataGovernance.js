import { shareFolderModal } from "../components/modal.js";
import { addEventShowAllCollaborator, addEventAddNewCollaborator } from "../event.js";
import { boxRoles } from "../config.js";
import { getFolderItems } from "../shared.js";

export const template = async () => {
    const response = await getFolderItems(0);
    const array = response.entries.filter(obj => obj.type === 'folder' && (obj.name === 'Confluence_NCI' || obj.name === 'Confluence_BCAC'));
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
        template += `<li><a class="${liClass}" href="#"><i title="${title}" data-id="${obj.id}" data-status="pending" class="lazy-loading-spinner"></i></a> ${consortiaName}
            <a data-toggle="modal" data-target="#modalShareFolder" class="share-folder" data-folder-id=${obj.id} data-folder-name="${consortiaName}" data-object-type=${type} href="#">
            <i class="fas fa-share"></i> Share</a>
        </li>
        `
    }
    template += `</ul>${shareFolderModal()}</div>`
    return template;
}

export const dataGovernanceProjects = async () => {
    const response = await getFolderItems(0);
    const projectArray = response.entries.filter(obj => obj.type === 'folder' && obj.name.toLowerCase().indexOf('confluence_') !== -1 && obj.name.toLowerCase().indexOf('_project') !== -1);
    const div = document.getElementById('dataGovernanceProjects');
    let template = `
        <h4 class="h4-heading">Project(s)</h4>
    `;
    
    template += '<div class="data-governance"><ul class="ul-list-style first-list-item">';

    for(let obj of projectArray){
        const projectName = obj.name;
        let type = obj.type;
        let liClass = type === 'folder' ? 'collapsible consortia-folder' : '';
        let title = type === 'folder' ? 'Expand / Collapse' : '';
        template += `
        <li><a class="${liClass}" href="#"><i title="${title}" data-id="${obj.id}" data-status="pending" class="lazy-loading-spinner"></i></a> ${projectName}
            <a data-toggle="modal" data-target="#modalShareFolder" class="share-folder" data-permission-type="restrict" data-folder-id=${obj.id} data-folder-name="${projectName}" data-object-type=${type} href="#">
                <i class="fas fa-share"></i> Share
            </a>
        </li>
        `;
    }
    template += `</ul>${shareFolderModal()}</div>`
    div.innerHTML = template;
    dataGovernanceLazyLoad();
}

export const dataGovernanceLazyLoad = () => {
    const spinners = document.getElementsByClassName('lazy-loading-spinner');
    Array.from(spinners).forEach(async element => {
        const id = element.dataset.id;
        const status = element.dataset.status;
        if(status !== 'pending') return;
        const allEntries = (await getFolderItems(id)).entries;
        element.dataset.status = 'complete';
        const entries = allEntries.filter(obj => obj.type === 'folder' && obj.name !== 'Confluence - CPSIII' && obj.name !== 'Confluence - Dikshit' && obj.name !== 'Confluence - Documents for NCI Participating Studies' && obj.name !== 'Samples');
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
                li.innerHTML = `<a class="${liClass}" href="#"><i title="${title}" data-id="${obj.id}" data-status="pending" class="lazy-loading-spinner"></i></a> ${obj.name} 
                    <a data-toggle="modal" data-target="#modalShareFolder" class="share-folder" data-folder-id=${obj.id} data-folder-name="${obj.name}" data-object-type=${type} href="#"><i class="fas fa-share"></i> Share</a>`;
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
                li.innerHTML = `<a href="#"><i title="files" data-id="${obj.id}" data-status="pending" class="fas fa-file-alt"></i></a> ${obj.name} 
                    <a data-toggle="modal" data-target="#modalShareFolder" class="share-folder" data-folder-id=${obj.id} data-folder-name="${obj.name}" data-object-type=${obj.type} href="#"><i class="fas fa-share"></i> Share</a>`;
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
        <textarea id="shareFolderEmail${id}" class="form-control" placeholder="Enter comma separated email addresses" require  rows="2"></textarea>
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