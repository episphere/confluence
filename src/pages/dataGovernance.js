import { shareFolderModal } from "../components/modal.js";
import { addEventShowAllCollaborator, addEventAddNewCollaborator } from "../event.js";
import { boxRoles } from "../config.js";
import { getFolderItems } from "../shared.js";

export const template = async () => {
    const response = await getFolderItems(0);
    const array = response.entries.filter(obj => obj.type === 'folder' && (obj.name === 'BCAC' || obj.name === 'Confluence_NCI'));
    if(array.length <= 0) return;

    let template = `
        <div aria-live="polite" aria-atomic="true" style="position: relative;">
            <div id="showNotification"></div>
        </div>
    `;
    
    template += '<div class="data-governance"><ul class="ul-list-style first-list-item">';

    for(let obj of array){
        const consortiaName = obj.name;
        let type = obj.type;
        let liClass = type === 'folder' ? 'collapsible consortia-folder' : '';
        let title = type === 'folder' ? 'Expand / Collapse' : '';
        template += `<li><a class="${liClass}" href="#"><i title="${title}" data-id="${obj.id}" data-status="pending" class="lazy-loading-spinner"></i></a> ${consortiaName}
            <a data-toggle="modal" data-target="#modalShareFolder" class="share-folder" data-folder-id=${obj.id} data-folder-name="${consortiaName}" data-object-type=${type} href="#"><i class="fas fa-share"></i> Share</a>
        </li>
        `
    }
    // for(let consortiaId in data_summary){
    //     const consortiaName = data_summary[consortiaId].name;
    //     const studyEntries = data_summary[consortiaId].studyEntries;
    //     let type = data_summary[consortiaId].type;
    //     let liClass = type === 'folder' ? 'collapsible consortia-folder' : '';
    //     let expandClass = type === 'folder' ? 'fas fa-folder-plus' : 'fas fa-file-alt';
    //     let title = type === 'folder' ? 'Expand / Collapse' : '';
    //     template += `<li><a class="${liClass}" href="#"><i title="${title}" class="${expandClass}"></i></a> ${consortiaName} 
    //                     <a data-toggle="modal" data-target="#modalShareFolder" class="share-folder" data-folder-id=${consortiaId} data-folder-name="${consortiaName}" data-object-type=${type} href="#"><i class="fas fa-share"></i> Share</a></li>`
    //     if(type === 'folder'){
    //         template += '<ul class="ul-list-style content">'
    //         for(let studyId in studyEntries){
    //             const studyName = studyEntries[studyId].name;
    //             type = studyEntries[studyId].type;
    //             liClass = type === 'folder' ? 'collapsible' : '';
    //             expandClass = type === 'folder' ? 'fas fa-folder-plus' : 'fas fa-file-alt';
    //             title = type === 'folder' ? 'Expand / Collapse' : '';
    //             template += `<li><a class="${liClass}" href="#"><i title="${title}" class="${expandClass}"></i></a> ${studyName} 
    //                             <a data-toggle="modal" data-target="#modalShareFolder" class="share-folder" data-folder-id=${studyId} data-folder-name="${studyName}" data-object-type=${type} href="#"><i class="fas fa-share"></i> Share</a></li>`
    //             if(type === 'folder'){
    //                 const dataEntries = studyEntries[studyId].dataEntries;
    //                 template += '<ul class="ul-list-style content">'
    //                 for(let dataId in dataEntries){
    //                     const dataName = dataEntries[dataId].name;
    //                     type = dataEntries[dataId].type;
    //                     liClass = type === 'folder' ? 'collapsible' : '';
    //                     expandClass = type === 'folder' ? 'fas fa-folder-plus' : 'fas fa-file-alt';
    //                     title = type === 'folder' ? 'Expand / Collapse' : '';
    //                     template += `<li><a class="${liClass}" href="#"><i title="${title}" class="${expandClass}"></i></a> ${dataName} 
    //                                     <a data-toggle="modal" data-target="#modalShareFolder" class="share-folder" data-folder-id=${dataId} data-folder-name="${dataName}" data-object-type=${type} href="#"><i class="fas fa-share"></i> Share</a></li>`
    //                     if(type === 'folder'){
    //                         const fileEntries = dataEntries[dataId].fileEntries;
    //                         template += '<ul class="ul-list-style content">'
    //                         for(let fileId in fileEntries){
    //                             type = fileEntries[fileId].type;
    //                             const fileName = fileEntries[fileId].name;
    //                             liClass = type === 'folder' ? 'collapsible' : '';
    //                             expandClass = type === 'folder' ? 'fas fa-folder-plus' : 'fas fa-file-alt';
    //                             title = type === 'folder' ? 'Expand / Collapse' : '';
    //                             template += `<li><a class="${liClass}" href="#"><i title="${title}" data-file-id="${fileId}" class="${expandClass}"></i></a> ${fileName} 
    //                                             <a data-toggle="modal" data-target="#modalShareFolder" class="share-folder" data-folder-id=${fileId} data-folder-name="${fileName}" data-object-type=${type} href="#"><i class="fas fa-share"></i> Share</a></li>`
    //                         }
    //                         template += `</ul>`
    //                     }
    //                 }
    //                 template += `</ul>`
    //             }
    //         }
    //         template += `</ul>`
    //     }
    // }
    template += `</ul>${shareFolderModal()}</div>`
    return template;
}

export const dataGovernanceLazyLoad = () => {
    const spinners = document.getElementsByClassName('lazy-loading-spinner');
    Array.from(spinners).forEach(async element => {
        const id = element.dataset.id;
        const status = element.dataset.status;
        if(status !== 'pending') return;
        const allEntries = (await getFolderItems(id)).entries;
        element.dataset.status = 'complete';
        const entries = allEntries.filter(obj => obj.type === 'folder' && obj.name !== 'Confluence - CPSIII' && obj.name !== 'Confluence - Documents for NCI Participating Studies' && obj.name !== 'Samples');
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
                li.innerHTML = `<a class="${liClass}" href="#"><i title="${title}" data-id="${obj.id}" data-status="pending" class="lazy-loading-spinner"></i></a> ${obj.name}`;
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
                li.innerHTML = `<a  href="#"><i title="files" data-id="${obj.id}" data-status="pending" class="fas fa-file-alt"></i></a> ${obj.name}`;
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

export const addFields = (id) => {
    let template = '';
    template += `
    <div class="form-group col-sm-9">
        <textarea id="shareFolderEmail${id}" class="form-control" placeholder="Enter comma separated email addresses" require  rows="2"></textarea>
    </div>
    <div class="form-group col-sm-3">
    <select class="form-control" required id="folderRole${id}">
        <option value=""> -- Select role -- </option>
    `;
    for(let key in boxRoles){
        template += `<option value="${key}">${key}</option>`
    }
        
    template +=`</select></div>`;
    return template;
}