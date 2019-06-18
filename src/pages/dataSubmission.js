import { downloadFileTxt, createFolder, uploadFileBox } from "../shared.js";
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
        template += `<li class="${liClass}"><i class="${faClass}"></i> ${consortia} <i title="${title}" class="${expandClass}"></i></li>`
        if(type === 'folder'){
            template += '<ul class="ul-list-style content">'
            for(let study in studyEntries){
                const studyId = studyEntries[study].id;
                type = studyEntries[study].type;
                liClass = type === 'folder' ? 'collapsible' : '';
                faClass = type === 'folder' ? 'fas fa-folder' : 'far fa-file';
                expandClass = type === 'folder' ? 'fas fa-plus' : '';
                title = type === 'folder' ? 'Expand / Collapse' : 'Download File';
                template += `<li class="${liClass}"><i class="${faClass}"></i> ${study} <i title="${title}" class="${expandClass}"></i></li>`
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
                        template += `<li class="${liClass}"><i class="${faClass}"></i> ${data} <i title="${title}" class="${expandClass}"></i></li>`
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
                                template += `<li class="${liClass}"><i class="${faClass}"></i> ${file} <i title="${title}" data-file-id="${fileId}" data-file-name="${file}" class="${expandClass}"></i></li>`
                            }
                            template += `<li><i data-folder-id="${dataId}" title="Upload new file" class="fas fa-file-upload"></i> <input type="file" class="input-create-folder"/></li></ul>`
                        }
                    }
                    template += `<li><i data-folder-id="${studyId}" title="Create new folder" class="fas fa-folder-plus"></i> <input type="text" placeholder="Enter folder name" class="input-create-folder"/></li></ul>`
                }
            }
            template += `<li><i data-folder-id="${consortiaId}" title="Create new folder" class="fas fa-folder-plus"></i> <input type="text" placeholder="Enter folder name" class="input-create-folder"/></li></ul>`
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

    let creatFolder = document.getElementsByClassName('fa-folder-plus');
    Array.from(creatFolder).forEach(element => {
        element.addEventListener('click', async function() {
            if(this.nextElementSibling.value && this.nextElementSibling.value !== ""){
                const folderId = this.dataset.folderId;
                const folderName = this.nextElementSibling.value;

                var r = confirm('Create a new folder - '+folderName +' ?');
                if(r == true){
                    const response = await createFolder(folderId, folderName);
                    if(response){
                        const message = `<strong>Success!</strong> Folder - ${folderName} created, please reload page to see it!`;
                        document.getElementById('alertMessage').innerHTML = alertTemplate('alert-success', message);
                    };
                };
            };
        });
    });

    let uploadFile = document.getElementsByClassName('fa-file-upload');
    Array.from(uploadFile).forEach(element => {
        element.addEventListener('click', async function() {
            if(this.nextElementSibling.files.length > 0){
                const folderId = this.dataset.folderId;
                const file = this.nextElementSibling.files[0];
                const fileName = file.name;
                const fileType = fileName.slice(fileName.lastIndexOf('.')+1, fileName.length);
                if(fileType !== 'txt'){
                    const message = `<strong>Info!</strong> Uploaded file type not supported, please upload txt file!`;
                    document.getElementById('alertMessage').innerHTML = alertTemplate('alert-info', message);
                }else {
                    var r = confirm('Upload a new file - '+fileName +' ?');
                    if(r == true){
                        const response = await uploadFileBox(folderId, fileName, file);
                        if(response){
                            const message = `<strong>Success!</strong> File - ${fileName} uploaded, please reload page to see it!`;
                            document.getElementById('alertMessage').innerHTML = alertTemplate('alert-success', message);
                        };
                    };
                };
            };
        });
    });
};
