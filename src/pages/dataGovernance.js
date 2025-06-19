import { addEventShowAllCollaborator, addEventAddNewCollaborator, addEventFileStats } from "../event.js";
import { boxRoles } from "../config.js";
import { getFolderItems, filterConsortiums, filterStudiesDataTypes, filterProjects, getCollaboration, checkMyPermissionLevel, getFolderInfo, getFile, tsv2Json } from "../shared.js";

export const template = async () => {
    // const response = await getFolderItems(0);
    // const array = response.entries.filter(obj => obj.type === 'folder' && obj.id === '137304373658');
    // const array = filterConsortiums(response.entries);
    let AllFolders = [];
    const array = await getFolderInfo('156698557621'); //137304373658, 156698557621
    // const events = await getFolderInfo('155546882525');
    console.log(array);
    
    if (array) AllFolders.push(array);
    // if (events) AllFolders.push(events);
    // if (array.length <= 0) return;
    if (!array) return;
    
    let template = `<div class="card" style="border: 0px;"><div class="card-header"></div>`;
    template += '<div class="card-body data-governance"><ul class="ul-list-style first-list-item collapsible-items p-0 m-0">';

    for (let obj of AllFolders) {
        const ID = obj.id;
        const consortiaName = obj.name;
        
        let type = obj.type;
        let liClass = type === 'folder' ? 'collapsible consortia-folder' : '';
        let title = type === 'folder' ? 'Expand / Collapse' : '';
        
        template += `
            <li class="collapsible-items">
                <button class="${liClass}" data-toggle="collapse" href="#toggle${ID}">
                    <i title="${title}" data-type="${type}" data-id="${ID}" data-folder-name="${consortiaName}" data-status="pending" class="lazy-loading-spinner"></i>
                </button> ${consortiaName}
            </li>
        `;
    }
    
    template += `</ul></div></div>`;
    return template;
};

export const dataGovernanceProjects = async () => {
    const response = await getFolderItems(0);
    const projectArray = filterProjects(response.entries);
    const div = document.getElementById('dataGovernanceProjects');
    
    let template = '';
    let checker = false;
    
    for (let obj = 0; obj < projectArray.length; obj++) {
        if (checker === false) {
            const bool = checkMyPermissionLevel(await getCollaboration(projectArray[obj].id, `${projectArray[obj].type}s`), JSON.parse(localStorage.parms).login);
            if (bool === true) checker = true;
        }
    }
    
    if (checker === true) {
        for (let obj = 0; obj < projectArray.length; obj++) {
            const bool = checkMyPermissionLevel(await getCollaboration(projectArray[obj].id, `${projectArray[obj].type}s`), JSON.parse(localStorage.parms).login);
            
            if (obj === 0) template += `
                <div class="card" style="border: 0px;"><div class="card-header">
                    <label class="dataSummary-label">Project(s)</label>
                </div> 
                <div class="card-body data-governance">
                    <ul class="ul-list-style first-list-item">
            `;
            
            if (bool === true) {
                const projectName = projectArray[obj].name;
                let type = projectArray[obj].type;
                let liClass = type === 'folder' ? 'collapsible consortia-folder' : '';
                let title = type === 'folder' ? 'Expand / Collapse' : '';
                
                template += `
                    <li class="collapsible-items">
                        <button class="${liClass}" data-toggle="collapse" href="#toggle${projectArray[obj].id}">
                            <i title="${title}" data-folder-name="${projectName}" data-type="${type}" data-id="${projectArray[obj].id}" data-folder-name="${projectName}" data-status="pending" class="lazy-loading-spinner"></i>
                        </button> ${projectName}
                    </li>
                `;
            }
            
            if (obj === projectArray.length - 1 ) template += `</ul></div></div>`;
        }
    }
    
    div.innerHTML = template;
    dataGovernanceLazyLoad();
};

export const dataGovernanceLazyLoad = (element) => {
    let spinners = document.getElementsByClassName('lazy-loading-spinner');
    if (element) spinners = element.parentNode.querySelectorAll('.lazy-loading-spinner');
    
    Array.from(spinners).forEach(async element => {
        const id = element.dataset.id;
        const status = element.dataset.status;
        const folderName = element.dataset.folderName;
        const type = element.dataset.type;
        
        if (type && JSON.parse(localStorage.parms).login) {
            const bool = await checkMyPermissionLevel(await getCollaboration(id, `${type}s`), JSON.parse(localStorage.parms).login, id, type);
            
            if (bool === true) {
                const button = document.createElement('button');
                button.dataset.toggle = 'modal';
                button.dataset.target = '#modalShareFolder'
                button.classList = ['share-folder'];
                button.dataset.permissionType = 'restrict';
                button.dataset.folderId = id;
                button.title = 'Manage collaboration';
                button.dataset.folderName = folderName;
                button.dataset.objectType = type;
                button.innerHTML = `<i class="fas fa-share"></i>`
                element.parentNode.parentNode.appendChild(button);
                shareData(button);
            }
            else {
                element.dataset.sharable = 'no';
            }
        } 
        
        if (status !== 'pending') return;
        
        let allEntries = (await getFolderItems(id)).entries;
        if (allEntries.length === 0) {
            element.classList = ['fas fa-exclamation-circle'];
            element.title = 'Empty folder'
        }
        allEntries = allEntries.filter(dt => dt.name !== 'Study Documents')
        
        element.dataset.status = 'complete';
        
        const entries = filterStudiesDataTypes(allEntries);
        const fileEntries = allEntries.filter(obj => obj.type === 'file');
        
        if (entries.length > 0) {
            const ul = document.createElement('ul');
            ul.classList = ['ul-list-style collapse'];
            ul.id = `toggle${id}`

            for (const obj of entries) {
                const li = document.createElement('li');
                li.classList = ['collapsible-items'];
                
                let type = obj.type;
                let liClass = type === 'folder' ? 'collapsible consortia-folder' : '';
                let title = type === 'folder' ? 'Expand / Collapse' : '';
                
                li.innerHTML = `
                    <button class="${liClass}" data-toggle="collapse" href="#toggle${obj.id}">
                        <i title="${title}" data-folder-name="${obj.name}" data-id="${obj.id}" ${element.dataset.sharable && element.dataset.sharable === 'no' ? `data-sharable = "no"` : ``} data-status="pending" class="lazy-loading-spinner"></i>
                    </button> ${obj.name}
                `;

                if (!element.dataset.sharable) {
                    const button = document.createElement('button');
                    button.dataset.toggle = 'modal';
                    button.dataset.target = '#modalShareFolder';
                    button.classList = ['share-folder'];
                    button.dataset.folderId = obj.id;
                    button.dataset.folderName = obj.name;
                    button.dataset.objectType = type;
                    button.title = 'Manage collaboration';
                    button.innerHTML = `<i class="fas fa-share"></i>`;
                    li.appendChild(button);
                    shareData(button);
                }
                
                ul.appendChild(li);
            }

            element.classList.remove('lazy-loading-spinner');
            element.classList.add('fas');
            element.classList.add('fa-folder-plus');
            element.parentNode.parentNode.appendChild(ul);
            eventsDataSubmissions(element.parentNode);
        }
        else if (fileEntries.length > 0) {
            const ul = document.createElement('ul');
            ul.classList = ['ul-list-style collapse'];
            ul.id = `toggle${id}`

            for (const obj of fileEntries) {
                const li = document.createElement('li');
                li.classList = ['collapsible-items'];
                li.innerHTML = `
                    <a>
                        <i title="file" data-folder-name="${obj.name}" data-id="${obj.id}" data-status="pending"${element.dataset.sharable && element.dataset.sharable === 'no' ? `data-sharable = "no"` : ``} class="fas fa-file-alt"></i>
                    </a> <span title="${obj.name}">${obj.name.length > 20 ? `${obj.name.slice(0, 20)}...` : `${obj.name}`}</span>
                `;

                if (!element.dataset.sharable) {
                    const button1 = document.createElement('button');
                    button1.dataset.toggle = 'modal';
                    button1.dataset.target = '#modalShareFolder';
                    button1.classList = ['share-folder'];
                    button1.dataset.folderId = obj.id;
                    button1.dataset.folderName = obj.name;
                    button1.dataset.objectType = obj.type;
                    button1.title = 'Manage collaboration';
                    button1.innerHTML = `<i class="fas fa-share"></i>`;
                    li.appendChild(button1);
                    shareData(button1);

                    const button2 = document.createElement('button');
                    button2.dataset.toggle = 'modal';
                    button2.dataset.target = '#modalFileAccessStats';
                    button2.classList = ['file-access-stats'];
                    button2.dataset.fileId = obj.id;
                    button2.dataset.fileName = obj.name;
                    button2.dataset.objectType = obj.type;
                    button2.title = 'File access stats';
                    button2.innerHTML = `<i class="fas fa-info-circle"></i>`;
                    li.appendChild(button2);
                    addEventFileStats(button2);
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
};

export const eventsDataSubmissions = (element) => {
    element.addEventListener('click', e => {
        e.preventDefault();
        if (element.getElementsByClassName('fa-folder-minus').length > 0 && element.getElementsByClassName('fa-folder-minus')[0].classList.contains('fa-folder-minus')) {
            element.getElementsByClassName('fa-folder-minus')[0].classList.add('fa-folder-plus');
            element.getElementsByClassName('fa-folder-minus')[0].classList.remove('fa-folder-minus');
        } else {
            element.getElementsByClassName('fa-folder-plus')[0].classList.add('fa-folder-minus');
            element.getElementsByClassName('fa-folder-plus')[0].classList.remove('fa-folder-plus');
            if (document.getElementsByClassName('lazy-loading-spinner').length !== 0) {
                dataGovernanceLazyLoad(element);
            }
        } 
    });
};

export const dataGovernanceCollaboration = () => {
    let consortiaFolder = document.getElementsByClassName('consortia-folder');
    Array.from(consortiaFolder).forEach(element => {
        element.dispatchEvent(new Event('click'));
    });
};

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
};

export const addFields = (id, bool) => {
    let template = '';
    template += `
        <div class="form-group col-lg-9">
            <textarea id="shareFolderEmail${id}" required class="form-control" placeholder="Enter comma separated email addresses" require  rows="2"></textarea>
        </div>
        <div class="form-group col-lg-3">
            <select class="form-control" required id="folderRole${id}">
                <option value=""> -- Select role -- </option>
    `;

    if (bool) template += `<option value="viewer">Viewer</option>`
    else {
        for (let key in boxRoles) {
            template += `<option value="${key}">${key}</option>`;
        }
    }
        
    template +=`</select></div>`;
    return template;
};