import { downloadFileTxt } from "../shared.js";

export function template() {

    const data_summary = JSON.parse(localStorage.data_summary);
    let template = '';
    template += '<div class="row data-submission"><ul class="ul-list-style">';
    for(let consortia in data_summary){
        let type = data_summary[consortia].type;
        const studyEntries = data_summary[consortia].studyEntries;
        let liClass = type === 'folder' ? 'collapsible' : '';
        let faClass = type === 'folder' ? 'fas fa-folder' : 'far fa-file';
        let expandClass = type === 'folder' ? 'fas fa-plus' : '';
        let title = type === 'folder' ? 'Expand / Collapse' : 'Download File';
        template += `<li class="${liClass}"><i class="${faClass}"></i> ${consortia} <i title="${title}" class="${expandClass}"></i></li>`
        if(type === 'folder'){
            template += '<ul class="ul-list-style content">'
            for(let study in studyEntries){
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
                            template += '</ul>'
                        }
                    }
                    template += '</ul>'
                }
            }
            template += '</ul>'
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
                this.getElementsByClassName('fa-minus')[0].classList.add('fa-plus');
                this.getElementsByClassName('fa-minus')[0].classList.remove('fa-minus');
            } else {
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
}
