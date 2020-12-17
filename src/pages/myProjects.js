import { getFolderItems, getFileInfo, filterProjects, amIViewer, getCollaboration, hideAnimation, getFileVersions } from "../shared.js";
import { fileVersionsModal } from "../components/modal.js";
import { addEventCopyToClipboard } from "../event.js"

export const myProjectsTemplate = async () => {
    const response = await getFolderItems(0);
    const data = filterProjects(response.entries);
    if(data.length <= 0) confluenceDiv.innerHTML = `No projects found!`;
    confluenceDiv.innerHTML = `<div class="general-bg padding-bottom-1rem">
        <div class="container body-min-height">
            <div class="main-summary-row">
                <div class="align-left">
                    <h1 class="page-header">My Projects</h1>
                </div>
            </div>
            <div class="my-projects-div white-bg div-border" id="myProjectsList">${fileVersionsModal()}</div>
        </div></div>`
    const ul =  document.createElement('ul');
    ul.classList = ['ul-list-style first-list-item'];
    for(let i = 0 ; i < data.length; i++) {
        const bool = amIViewer(await getCollaboration(data[i].id, `${data[i].type}s`), JSON.parse(localStorage.parms).login);
        if(bool === true) {
            let name = data[i].name;
            let type = data[i].type;
            let expandClass = type === 'folder' ? 'fas fa-folder-plus' : 'fas fa-file-alt';
            let title = type === 'folder' ? 'Expand / Collapse' : '';
            const li = document.createElement('li');
            li.innerHTML = `<button class="${type === 'folder' ? 'collapsible consortia-folder' : ''} allow-overflow" data-toggle="collapse" href="#toggle${data[i].id}">
                                <i title="${title}" data-folder-name="${name}" class="${expandClass}"></i>
                            </button> ${name}`
            

            if(type === 'folder'){
                const response = await getFolderItems(data[i].id);
                const files = response.entries;

                const ulSub = document.createElement('ul');
                ulSub.classList = ['ul-list-style collapsible-items collapse'];
                ulSub.id = `toggle${data[i].id}`
                
                const liSub = document.createElement('li');
                liSub.classList = ['my-prjects-list-item allow-overflow'];

                const table = document.createElement('table');
                table.classList = ['table table-borderless table-striped my-projects-table'];

                const thead = document.createElement('thead');

                const theadTR = document.createElement('tr');
                theadTR.classList = ['table-no-wrap'];
                theadTR.innerHTML = `
                                        <th>Name</th>
                                        <th>File id</th>
                                        <th>Created by</th>
                                        <th>Created at</th>
                                        <th>Last modified by</th>
                                        <th>Last modified at</th>
                                        <th>Latest version id</th>
                                        <th>Older versions</th>
                                    `
                thead.appendChild(theadTR);

                const tbody = document.createElement('tbody');
                                    
                for(let obj of files){
                    const fileInfo = await getFileInfo(obj.id);
                    type = obj.type;
                    if(obj.type !== 'file') return;
                    name = obj.name.slice(0, obj.name.lastIndexOf('.'));
                    expandClass = type === 'folder' ? 'fas fa-folder-plus' : 'fas fa-file-alt';
                    title = type === 'folder' ? 'Expand / Collapse' : '';
                    const tbodyTR = document.createElement('tr');
                    tbodyTR.innerHTML = `
                            <td title=${name}>${name.length > 20 ? `${name.slice(0, 17)}...` : `${name}` }</td>
                            <td>${fileInfo.id} <button class="copy-file-api" title="Copy file id" data-file-id="${obj.id}"><i class="far fa-copy"></i></button></td>
                            <td>${fileInfo.created_by.name || fileInfo.created_by.login}</td>
                            <td>${new Date(fileInfo.created_at).toLocaleString()}</td>
                            <td>${fileInfo.modified_by.name || fileInfo.modified_by.login}</td>
                            <td>${new Date(fileInfo.modified_at).toLocaleString()}</td>
                            <td>${fileInfo.file_version.id} <button class="copy-file-api" title="Copy version id" data-version-id="${fileInfo.file_version.id}"><i class="far fa-copy"></i></button></td>
                            <td><button data-toggle="modal" data-target="#modalFileVersions" class="getAllFileversions" data-file-id="${obj.id}" data-file-name="${name}">See old versions</button></td>
                        `;
                    tbody.appendChild(tbodyTR);
                }
                table.appendChild(thead);
                table.appendChild(tbody);
                liSub.appendChild(table);
                ulSub.appendChild(liSub);
                hideAnimation();
                li.appendChild(ulSub);
            }
            ul.appendChild(li);
            document.getElementById('myProjectsList').appendChild(ul);
        }
    }
    
    const elements = document.getElementsByClassName('getAllFileversions');
    for(let element of Array.from(elements)){
        element.addEventListener('click', async () => {
            const ID = element.dataset.fileId;
            document.getElementById('modalFVBody').innerHTML = '';
            const versions = await getFileVersions(ID);
            document.getElementById('modalFVHeader').innerHTML = `
                <h5 class="modal-title">${element.dataset.fileName}</h5>
                <button type="button" title="Close" class="close modal-close-btn" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            `;
            let template = '';
            if(versions.entries.length !== 0) {
                for(let dt of versions.entries){
                    template += `
                    <tr>
                        <td>${ID} <button class="copy-file-api" title="Copy file id" data-file-id="${ID}"><i class="far fa-copy"></i></button></td>
                        <td>${dt.modified_by.name || dt.modified_by.login}</td>
                        <td>${new Date(dt.modified_at).toLocaleString()}</td>
                        <td>${dt.id} <button class="copy-file-api" title="Copy version id" data-version-id="${dt.id}"><i class="far fa-copy"></i></button></td>
                    </tr>
                    `
                }
                document.getElementById('modalFVBody').innerHTML = `
                <table class="table table-borderless table-striped">
                    <thead>
                        <tr class="table-no-wrap">
                            <th>File id</th>
                            <th>Modified by</th>
                            <th>Modified at</th>
                            <th>Version id</th>
                        </tr>
                    </thead>
                    <tbody>${template}</tbody>
                </table>
                `;
            }
            else{
                document.getElementById('modalFVBody').innerHTML = 'No older version found!';
            }
            addEventCopyToClipboard();
        });
        addEventCopyToClipboard();
    }
    expandProjects();
}

export const expandProjects = () => {
    let collapsible = document.getElementsByClassName('collapsible');
    Array.from(collapsible).forEach(element => {
        element.addEventListener('click', () => {
            if (element.getElementsByClassName('fa-folder-minus').length > 0 && element.getElementsByClassName('fa-folder-minus')[0].classList.contains('fa-folder-minus')){
                element.getElementsByClassName('fa-folder-minus')[0].classList.add('fa-folder-plus');
                element.getElementsByClassName('fa-folder-minus')[0].classList.remove('fa-folder-minus');
            }
            else {
                element.getElementsByClassName('fa-folder-plus')[0].classList.add('fa-folder-minus');
                element.getElementsByClassName('fa-folder-plus')[0].classList.remove('fa-folder-plus');
            }
        })
    });
    
    let consortiaFolder = document.getElementsByClassName('collapsible');
    consortiaFolder[0].click();
}