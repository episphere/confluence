import { createFolder, uploadFileBox, updateLocalStorage } from "../shared.js";
import { alertTemplate } from "../components/elements.js";
import { uploadInStudy } from "../components/modal.js";

export const template = () => {
    const data_summary = JSON.parse(localStorage.data_summary);
    let template = '';
    
    template += `<div class="row create-study">
                <div class="upload-in-study"><button data-toggle="modal" data-target="#uploadInStudy" class="btn btn-light"><i class="fas fa-upload"></i> Upload in existing study</button></div>
            </div>`;

    template += uploadInStudy('uploadInStudy', data_summary);
    
    template += '<div class="data-submission"><ul class="ul-list-style first-list-item">';
    for(let consortiaId in data_summary){
        const consortiaName = data_summary[consortiaId].name;
        const studyEntries = data_summary[consortiaId].studyEntries;
        let type = data_summary[consortiaId].type;
        let liClass = type === 'folder' ? 'collapsible consortia-folder' : '';
        let expandClass = type === 'folder' ? 'fas fa-folder-plus' : 'fas fa-file-alt';
        let title = type === 'folder' ? 'Expand / Collapse' : '';
        template += `<li><a class="${liClass}" href="#"><i title="${title}" class="${expandClass}"></i></a> ${consortiaName}</li>`
        if(type === 'folder'){
            template += '<ul class="ul-list-style content">'
            for(let studyId in studyEntries){
                const studyName = studyEntries[studyId].name;
                type = studyEntries[studyId].type;
                liClass = type === 'folder' ? 'collapsible' : '';
                expandClass = type === 'folder' ? 'fas fa-folder-plus' : 'fas fa-file-alt';
                title = type === 'folder' ? 'Expand / Collapse' : '';
                template += `<li><a class="${liClass}" href="#"><i title="${title}" class="${expandClass}"></i></a> ${studyName}</li>`
                if(type === 'folder'){
                    const dataEntries = studyEntries[studyId].dataEntries;
                    template += '<ul class="ul-list-style content">'
                    for(let dataId in dataEntries){
                        const dataName = dataEntries[dataId].name;
                        type = dataEntries[dataId].type;
                        liClass = type === 'folder' ? 'collapsible' : '';
                        expandClass = type === 'folder' ? 'fas fa-folder-plus' : 'fas fa-file-alt';
                        title = type === 'folder' ? 'Expand / Collapse' : '';
                        template += `<li><a class="${liClass}" href="#"><i title="${title}" class="${expandClass}"></i></a> ${dataName}</li>`
                        if(type === 'folder'){
                            const fileEntries = dataEntries[dataId].fileEntries;
                            template += '<ul class="ul-list-style content">'
                            for(let fileId in fileEntries){
                                type = fileEntries[fileId].type;
                                const fileName = fileEntries[fileId].name;
                                liClass = type === 'folder' ? 'collapsible' : '';
                                expandClass = type === 'folder' ? 'fas fa-folder-plus' : 'fas fa-file-alt';
                                title = type === 'folder' ? 'Expand / Collapse' : '';
                                template += `<li><a class="${liClass}" href="#"><i title="${title}" class="${expandClass}"></i></a> ${fileName}</li>`
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
        element.addEventListener('click', () => {
            element.classList.toggle('.active');
            var content = element.parentNode.nextElementSibling;
            if (content.style.maxHeight){
                content.style.maxHeight = null;
                element.getElementsByClassName('fa-folder-minus')[0].classList.add('fa-folder-plus');
                element.getElementsByClassName('fa-folder-minus')[0].classList.remove('fa-folder-minus');
            } else {
                element.getElementsByClassName('fa-folder-plus')[0].classList.add('fa-folder-minus');
                element.getElementsByClassName('fa-folder-plus')[0].classList.remove('fa-folder-plus');
                content.style.maxHeight = "1000px";
            } 
        })
    });
    
    let consortiaFolder = document.getElementsByClassName('consortia-folder');
    Array.from(consortiaFolder).forEach(element => {
        element.dispatchEvent(new Event('click'));
    });
};
