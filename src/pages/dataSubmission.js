import { downloadFileTxt, createFolder, uploadFileBox, updateLocalStorage } from "../shared.js";
import { alertTemplate } from "../components/elements.js";

export function template() {
    const data_summary = JSON.parse(localStorage.data_summary);
    let template = '';
    template += '<div class="row data-submission"><ul class="ul-list-style">';
    for(let consortia in data_summary){
        const consortiaId = data_summary[consortia].id;
        const studyEntries = data_summary[consortia].studyEntries;
        let type = data_summary[consortia].type;
        let liClass = type === 'folder' ? 'collapsible' : '';
        let faClass = type === 'folder' ? 'fas fa-folder' : 'far fa-file';
        let expandClass = type === 'folder' ? 'fas fa-plus' : '';
        let title = type === 'folder' ? 'Expand / Collapse' : 'Download File';
        template += `<li class="${liClass}"><i class="${faClass}"></i> ${consortia} <a href="#"><i title="${title}" class="${expandClass}"></i></a></li>`
        if(type === 'folder'){
            template += '<ul class="ul-list-style content">'
            for(let study in studyEntries){
                const studyId = studyEntries[study].id;
                type = studyEntries[study].type;
                liClass = type === 'folder' ? 'collapsible' : '';
                faClass = type === 'folder' ? 'fas fa-folder' : 'far fa-file';
                expandClass = type === 'folder' ? 'fas fa-plus' : '';
                title = type === 'folder' ? 'Expand / Collapse' : 'Download File';
                template += `<li class="${liClass}"><i class="${faClass}"></i> ${study} <a href="#"><i title="${title}" class="${expandClass}"></i></a></li>`
                if(type === 'folder'){
                    const dataEntries = studyEntries[study].dataEntries;
                    template += '<ul class="ul-list-style content">'
                    for(let data in dataEntries){
                        const dataId = dataEntries[data].id;
                        type = dataEntries[data].type;
                        liClass = type === 'folder' ? 'collapsible' : '';
                        faClass = type === 'folder' ? 'fas fa-folder' : 'far fa-file';
                        expandClass = type === 'folder' ? 'fas fa-plus' : '';
                        title = type === 'folder' ? 'Expand / Collapse' : 'Download File';
                        template += `<li class="${liClass}"><i class="${faClass}"></i> ${data} <a href="#"><i title="${title}" class="${expandClass}"></i></a></li>`
                        if(type === 'folder'){
                            const fileEntries = dataEntries[data].fileEntries;
                            template += '<ul class="ul-list-style content">'
                            for(let file in fileEntries){
                                type = fileEntries[file].type;
                                const fileId = fileEntries[file].id;
                                liClass = type === 'folder' ? 'collapsible' : '';
                                faClass = type === 'folder' ? 'fas fa-folder' : 'far fa-file';
                                expandClass = type === 'folder' ? 'fas fa-plus' : 'fas fa-file-download';
                                title = type === 'folder' ? 'Expand / Collapse' : 'Download File';
                                template += `<li class="${liClass}"><i class="${faClass}"></i> ${file} <a href="#"><i title="${title}" data-file-id="${fileId}" data-file-name="${file}" class="${expandClass}"></i></a></li>`
                            }
                            template += `<li>
                                        <i class="fas fa-file-upload"></i> 
                                        <input type="file" class="input-file-upload"/> 
                                        <a class="upload-file" data-folder-id="${dataId}" href="#"><i title="Upload new file" class="fas fa-arrow-up"></i></a>
                                    </li>
                                </ul>`
                        }
                    }
                    template += `<li>
                                <i class="fas fa-folder-plus"></i> 
                                <input type="text" placeholder="Enter folder name" class="input-create-folder"/> 
                                <a class="create-folder" data-folder-id="${studyId}" href="#"><i title="Create new folder" class="fas fa-arrow-up"></i></a>
                            </li>
                        </ul>`
                }
            }
            template += `<li>
                        <i class="fas fa-folder-plus"></i> 
                        <input type="text" placeholder="Enter folder name" class="input-create-folder"/> 
                        <a class="create-folder" data-folder-id="${consortiaId}" href="#"><i title="Create new folder" class="fas fa-arrow-up"></i></a>
                    </li>
                </ul>`
        }
    }
    template += '</ul></div>'
    return template;
};

export const dataSubmission = () => {
    let collapsible = document.getElementsByClassName('collapsible');
    Array.from(collapsible).forEach(element => {
        element.addEventListener('click', function() {
            this.classList.toggle('.active');
            var content = this.nextElementSibling;
            if (content.style.maxHeight){
                content.style.maxHeight = null;
                this.getElementsByClassName('fa-folder-open')[0].classList.add('fa-folder');
                this.getElementsByClassName('fa-folder-open')[0].classList.remove('fa-folder-open');
                this.getElementsByClassName('fa-minus')[0].classList.add('fa-plus');
                this.getElementsByClassName('fa-minus')[0].classList.remove('fa-minus');
            } else {
                this.getElementsByClassName('fa-folder')[0].classList.add('fa-folder-open');
                this.getElementsByClassName('fa-folder')[0].classList.remove('fa-folder');
                this.getElementsByClassName('fa-plus')[0].classList.add('fa-minus');
                this.getElementsByClassName('fa-plus')[0].classList.remove('fa-plus');
                content.style.maxHeight = "1000px";
            } 
        })
    });

    let fileDownload = document.getElementsByClassName('fa-file-download');
    Array.from(fileDownload).forEach(element => {
        element.addEventListener('click', function() {
            const fileId = this.dataset.fileId;
            const fileName = this.dataset.fileName;
            downloadFileTxt(fileId, fileName);
        });
    });

    // Create new folder
    let creatFolder = document.getElementsByClassName('create-folder');
    Array.from(creatFolder).forEach(element => {
        element.addEventListener('click', async function() {
            if(this.previousElementSibling.value && this.previousElementSibling.value !== ""){
                const folderId = this.dataset.folderId;
                const folderName = this.previousElementSibling.value;

                var r = confirm('Create a new folder - '+folderName +' ?');
                if(r == true){
                    const response = await createFolder(folderId, folderName);
                    if(!response.status){
                        const message = `<strong>Success!</strong> Folder - ${folderName} created!`;
                        document.getElementById('alertMessage').innerHTML = alertTemplate('alert-success', message);
                        const parentId = parseInt(response.parent.id);
                        const newFolderId = parseInt(response.id);
                        const newFolderName = response.name;
                        const newFolderEntries = response.item_collection.entries;
                        const newFolderType = response.type;
                        await updateLocalStorage(parentId, newFolderId, newFolderName, newFolderType);
                        document.getElementById('confluenceDiv').innerHTML = template(); 
                        dataSubmission();
                    };
                    if(response.status && response.statusText){
                        const message = `<strong>Error!</strong> (${response.status}) ${response.statusText}`;
                        document.getElementById('alertMessage').innerHTML = alertTemplate('alert-danger', message);
                    }
                };
            };
        });
    });

    // file upload
    let uploadFile = document.getElementsByClassName('upload-file');
    Array.from(uploadFile).forEach(async element => {
        element.addEventListener('click', async function() {
            if(this.previousElementSibling.files.length > 0){
                const folderId = this.dataset.folderId;
                const file = this.previousElementSibling.files[0];
                const fileName = file.name;
                const fileType = fileName.slice(fileName.lastIndexOf('.')+1, fileName.length);
                if(fileType !== 'txt'){
                    const message = `<strong>Info!</strong> File type not supported, please upload txt file!`;
                    document.getElementById('alertMessage').innerHTML = alertTemplate('alert-info', message);
                }else {
                    var r = confirm('Upload a new file - '+fileName +' ?');
                    if(r == true){
                        const response = await uploadFileBox(folderId, fileName, file);
                        if(!response.status){
                            const message = `<strong>Success!</strong> File - ${fileName} uploaded!`;
                            document.getElementById('alertMessage').innerHTML = alertTemplate('alert-success', message);
                            const parentId = parseInt(response.entries[0].parent.id);
                            const newFolderId = parseInt(response.entries[0].id);
                            const newFolderName = response.entries[0].name;
                            const newFolderType = response.entries[0].type;
                            await updateLocalStorage(parentId, newFolderId, newFolderName, newFolderType);
                            document.getElementById('confluenceDiv').innerHTML = template(); 
                            dataSubmission();
                        };
                        if(response.status && response.statusText){
                            const message = `<strong>Error!</strong> (${response.status}) ${response.statusText}`;
                            document.getElementById('alertMessage').innerHTML = alertTemplate('alert-danger', message);
                        };
                    };
                };
            };
        });
    });
};
