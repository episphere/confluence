import { createFolder, uploadFileBox, updateLocalStorage } from "../shared.js";
import { alertTemplate } from "../components/elements.js";
import { createStudyModal, uploadInStudy } from "../components/modal.js";

export const template = () => {
    const data_summary = JSON.parse(localStorage.data_summary);
    let template = '';

    template += `<div class="row create-study">
                <div class="new-study-btn"><button data-toggle="modal" data-target="#createStudy" class="btn btn-light"><i class="fas fa-plus"></i> Create new study</button></div>
                <div class="upload-in-study"><button data-toggle="modal" data-target="#uploadInStudy" class="btn btn-light"><i class="fas fa-upload"></i> Upload in existing study</button></div>
            </div>`;

    template += createStudyModal('createStudy', data_summary);
    template += uploadInStudy('uploadInStudy', data_summary);
    
    template += '<div class="data-submission"><ul class="ul-list-style first-list-item">';
    for(let consortiaId in data_summary){
        const consortiaName = data_summary[consortiaId].name;
        const studyEntries = data_summary[consortiaId].studyEntries;
        let type = data_summary[consortiaId].type;
        let liClass = type === 'folder' ? 'collapsible' : '';
        let faClass = type === 'folder' ? 'fas fa-folder' : 'far fa-file';
        let expandClass = type === 'folder' ? 'fas fa-plus' : '';
        let title = type === 'folder' ? 'Expand / Collapse' : '';
        template += `<li class="${liClass}"><i class="${faClass}"></i> ${consortiaName} <a href="#"><i title="${title}" class="${expandClass}"></i></a></li>`
        if(type === 'folder'){
            template += '<ul class="ul-list-style content">'
            for(let studyId in studyEntries){
                const studyName = studyEntries[studyId].name;
                type = studyEntries[studyId].type;
                liClass = type === 'folder' ? 'collapsible' : '';
                faClass = type === 'folder' ? 'fas fa-folder' : 'far fa-file';
                expandClass = type === 'folder' ? 'fas fa-plus' : '';
                title = type === 'folder' ? 'Expand / Collapse' : '';
                template += `<li class="${liClass}"><i class="${faClass}"></i> ${studyName} <a href="#"><i title="${title}" class="${expandClass}"></i></a></li>`
                if(type === 'folder'){
                    const dataEntries = studyEntries[studyId].dataEntries;
                    template += '<ul class="ul-list-style content">'
                    for(let dataId in dataEntries){
                        const dataName = dataEntries[dataId].name;
                        type = dataEntries[dataId].type;
                        liClass = type === 'folder' ? 'collapsible' : '';
                        faClass = type === 'folder' ? 'fas fa-folder' : 'far fa-file';
                        expandClass = type === 'folder' ? 'fas fa-plus' : '';
                        title = type === 'folder' ? 'Expand / Collapse' : '';
                        template += `<li class="${liClass}"><i class="${faClass}"></i> ${dataName} <a href="#"><i title="${title}" class="${expandClass}"></i></a></li>`
                        if(type === 'folder'){
                            const fileEntries = dataEntries[dataId].fileEntries;
                            template += '<ul class="ul-list-style content">'
                            for(let fileId in fileEntries){
                                type = fileEntries[fileId].type;
                                const fileName = fileEntries[fileId].name;
                                liClass = type === 'folder' ? 'collapsible' : '';
                                faClass = type === 'folder' ? 'fas fa-folder' : 'far fa-file';
                                expandClass = type === 'folder' ? 'fas fa-plus' : '';
                                title = type === 'folder' ? 'Expand / Collapse' : '';
                                template += `<li class="${liClass}"><i class="${faClass}"></i> ${fileName} <a href="#"><i title="${title}" data-file-id="${fileId}" data-file-name="${fileName}" class="${expandClass}"></i></a></li>`
                            }
                            template += `</ul>`
                        }
                    }
                    template += `</ul>`
                }
            }
            template += `</ul>`
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
    collapsible[0].dispatchEvent(new Event('click'));
    // let fileDownload = document.getElementsByClassName('fa-file-download');
    // Array.from(fileDownload).forEach(element => {
    //     element.addEventListener('click', function() {
    //         const fileId = this.dataset.fileId;
    //         const fileName = this.dataset.fileName;
    //         downloadFileTxt(fileId, fileName);
    //     });
    // });

    // Create new folder
    let creatFolderElement = document.getElementsByClassName('createFolder');
    Array.from(creatFolderElement).forEach(element => {
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
    let uploadFile = document.getElementsByClassName('uploadFile');
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
