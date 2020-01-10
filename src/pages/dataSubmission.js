import { getFolderItems, filterStudiesDataTypes, filterConsortiums, hideAnimation } from "../shared.js";
import { uploadInStudy } from "../components/modal.js";

export const template = async () => {
    const response = await getFolderItems(0);
    const array = filterConsortiums(response.entries);
    if(array.length <= 0) {
        hideAnimation();
        return 'No folder found for Data Submission';
    };
    
    let template = '';
    
    template += `<div class="row create-study">
                <div class="upload-in-study">
                    <button data-toggle="modal" title="Upload data" data-target="#uploadInStudy" class="btn btn-light sub-div-shadow">
                        <i class="fas fa-upload"></i> Upload data
                    </button>
                </div>
            </div>`;

    template += await uploadInStudy('uploadInStudy');
    
    template += '<div class="data-submission sub-div-shadow"><ul class="ul-list-style first-list-item">';

    for(let obj of array){
        const consortiaName = obj.name;
        let type = obj.type;
        let liClass = type === 'folder' ? 'collapsible consortia-folder' : '';
        let title = type === 'folder' ? 'Expand / Collapse' : '';
        template += `<li><a class="${liClass}"><i title="${title}" data-id="${obj.id}" data-status="pending" class="lazy-loading-spinner"></i></a> ${consortiaName}</li>`
    }

    template += '</ul></div>';
    return template;
};

export const lazyload = (element) => {
    let spinners = document.getElementsByClassName('lazy-loading-spinner');
    if(element) spinners = element.parentNode.querySelectorAll('.lazy-loading-spinner');
    Array.from(spinners).forEach(async element => {
        const id = element.dataset.id;
        const status = element.dataset.status;
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
                li.innerHTML = `<a class="${liClass}"><i title="${title}" data-id="${obj.id}" data-status="pending" class="lazy-loading-spinner"></i></a> ${obj.name}`;
                ul.appendChild(li);
            }

            element.classList.remove('lazy-loading-spinner');
            element.classList.add('fas');
            element.classList.add('fa-folder-plus');
            element.parentNode.parentNode.appendChild(ul);
            dataSubmission(element.parentNode);
        }
        else if(fileEntries.length > 0) {
            const ul = document.createElement('ul');
            ul.classList.add('ul-list-style');
            ul.classList.add('content');

            for(const obj of fileEntries){
                const li = document.createElement('li');
                li.innerHTML = `<a><i title="files" data-id="${obj.id}" data-status="pending" class="fas fa-file-alt"></i></a> ${obj.name}`;
                ul.appendChild(li);
            }

            element.classList.remove('lazy-loading-spinner');
            element.classList.add('fas');
            element.classList.add('fa-folder-plus');
            element.parentNode.parentNode.appendChild(ul);
            dataSubmission(element.parentNode);
        }
    });
}

export const dataSubmission = (element) => {
    element.addEventListener('click', e => {
        e.preventDefault();
        element.classList.toggle('.active');
        let content = element.nextElementSibling;
        if (content.style.maxHeight){
            content.style.maxHeight = null;
            element.getElementsByClassName('fa-folder-minus')[0].classList.add('fa-folder-plus');
            element.getElementsByClassName('fa-folder-minus')[0].classList.remove('fa-folder-minus');
        } else {
            element.getElementsByClassName('fa-folder-plus')[0].classList.add('fa-folder-minus');
            element.getElementsByClassName('fa-folder-plus')[0].classList.remove('fa-folder-plus');
            content.style.maxHeight = "1000px";
            if(document.getElementsByClassName('lazy-loading-spinner').length !== 0){
                lazyload(element);
            }
        }
    });
    
    // let consortiaFolder = document.getElementsByClassName('consortia-folder');
    // Array.from(consortiaFolder).forEach(element => {
    //     element.dispatchEvent(new Event('click'));
    // });
};
