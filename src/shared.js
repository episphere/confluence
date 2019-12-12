import { config } from "./config.js";
import { variables } from "./variables.js";

export const getFolderItems = async (id) => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    let r = await fetch('https://api.box.com/2.0/folders/'+id+'/items',{
        method:'GET',
        headers:{
            Authorization:"Bearer "+access_token
        }
    })
    if(r.statusText=="Unauthorized"){
        sessionExpired();
    }else{
        return r.json()
    }
}

export const getFolderInfo = async (id) => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    let r = await fetch('https://api.box.com/2.0/folders/'+id,{
        method:'GET',
        headers:{
            Authorization:"Bearer "+access_token
        }
    })
    if(r.statusText=="Unauthorized"){
        sessionExpired();
    }else{
        return r.json()
    }
}

export const getFile = async (id) => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    let r = await fetch(`https://api.box.com/2.0/files/${id}/content`,{
        method:'GET',
        headers:{
            Authorization:"Bearer "+access_token
        }
    });
    if(r.statusText=="Unauthorized"){
        sessionExpired();
    }else{
        return r.text()
    }
};

export const getFileJSON = async (id, access_token) => {
    let r = await fetch(`https://api.box.com/2.0/files/${id}/content`,{
        method:'GET',
        headers:{
            Authorization:"Bearer "+access_token
        }
    });
    if(r.statusText=="Unauthorized"){
        return false;
    }else{
        return r.json();
    }
};

export const getFileInfo = async (id) => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    let r = await fetch('https://api.box.com/2.0/files/'+id,{
        method:'GET',
        headers:{
            Authorization:"Bearer "+access_token
        }
    })
    if(r.statusText=="Unauthorized"){
        sessionExpired();
    }else{
        return r.json()
    }
}

export const getFileVersions = async (id) => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    let r = await fetch(`https://api.box.com/2.0/files/${id}/versions`,{
        method:'GET',
        headers:{
            Authorization:"Bearer "+access_token
        }
    })
    if(r.statusText=="Unauthorized"){
        sessionExpired();
    }else{
        return r.json()
    }
}

export const storeAccessToken = async () => {
    let parms = searchParms();
    if(parms.code){
        //exchange code for authorization token
        let clt={}
        if(location.origin.indexOf('localhost') !== -1){
            clt = config.iniAppDev;
        }else if(location.origin.indexOf('episphere') !== -1){
            clt = config.iniAppProd
        }else if(location.origin.indexOf('observablehq') !== -1){
            clt = config.iniObs
        }
        document.getElementById('confluenceDiv').innerHTML = '';
        let url = `https://api.box.com/oauth2/token/`;
        
        const response = await fetch(url, {
            method:'POST',
            body: `grant_type=authorization_code&code=${parms.code}&client_id=${clt.client_id}&client_secret=${clt.server_id}`
        });
        localStorage.parms = JSON.stringify(await response.json());
        location.search = '';
    }else{
        if(localStorage.parms){
            confluence.parms=JSON.parse(localStorage.parms)
            if(confluence.parms.access_token === undefined){
                localStorage.clear();
                alert('access token not found, please contact system administrator')
            }
        }else{
            console.log('not logged in yet')
        }
    }
}

export const permissionLevel = async (array) => {
    for(let element of array){
        const ID = element.id;
        const type = element.type;
    };
}

const searchParms = () => {
    let parms={}
    if(location.search.length>3){
        location.search.slice(1).split('&').forEach(pp => {
            pp=pp.split('=')
            parms[pp[0]]=pp[1]
        })
    }
    return parms
};

export const downloadFileTxt = async (fileId, fileName) => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    let fileData = await getFile(fileId, access_token);
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileData));
    element.setAttribute('download', fileName);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
};

export const createFolder = async (folderId, folderName) => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    let obj = {
        "name": folderName,
        "parent": {
            "id": folderId
        }
    };
    let response = await fetch("https://api.box.com/2.0/folders", {
        method: "POST",
        headers:{
            Authorization:"Bearer "+access_token
        },
        body: JSON.stringify(obj)
    });
    if(response.statusText=="Unauthorized"){
        sessionExpired();
    }
    else if(response.status === 201){
        return response;
    }
    else{
        return {status: response.status, statusText: response.statusText};
    };
};

export const copyFile = async (fileId, parentId) => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    let obj = {
        "parent": {
            "id": parentId
        }
    };
    let response = await fetch(`https://api.box.com/2.0/files/${fileId}/copy`, {
        method: "POST",
        headers:{
            Authorization:"Bearer "+access_token
        },
        body: JSON.stringify(obj)
    });
    if(response.statusText=="Unauthorized"){
        sessionExpired();
    }
    else if(response.status === 201){
        return response;
    }
    else{
        return {status: response.status, statusText: response.statusText};
    };
};

export const uploadFileBox = async (folderId, fileName, file) => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const form = new FormData();
    form.append('file', file);
    form.append('name', fileName);
    form.append('parent_id', folderId);

    let response = await fetch("https://upload.box.com/api/2.0/files/content", {
        method: "POST",
        headers:{
            Authorization:"Bearer "+access_token
        },
        body: form,
        contentType: false
    });
    if(response.statusText=="Unauthorized"){
        sessionExpired();
    }
    else if(response.status === 201){
        return response.json();
    }
    else{
        return {status: response.status, statusText: response.statusText};
    };
};

export const uploadFile = async (data, fileName, folderId) => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const form = new FormData();
    const blobData = new Blob([JSON.stringify(data)], { type: 'application/json'});
    form.append('file', blobData);
    form.append('attributes', `{"name": "${fileName}", "parent": {"id": "${folderId}"}}`);

    let response = await fetch("https://upload.box.com/api/2.0/files/content", {
        method: "POST",
        headers:{
            Authorization:"Bearer "+access_token
        },
        body: form,
        contentType: false
    });
    if(response.statusText=="Unauthorized"){
        sessionExpired();
    }
    else if(response.status === 201){
        return response.json();
    }
    else{
        return {status: response.status, statusText: response.statusText};
    };
}

export const getCollaboration = async (id, type) => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(`https://api.box.com/2.0/${type}/${id}/collaborations`, {
        headers:{
            Authorization:"Bearer "+access_token
        }
    });
    if(response.statusText=="Unauthorized"){
        sessionExpired();
    }
    if(response.status === 200){
        return response.json();
    }
    else{
        return null;
    }
}

export const getCurrentUser = async () => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(`https://api.box.com/2.0/users/me`, {
        headers: {
            Authorization: "Bearer "+access_token
        }
    });
    if(response.statusText=="Unauthorized"){
        sessionExpired();
    }
    if(response.status === 200){
        return response.json();
    }
    else{
        return null;
    }
}

export const addNewCollaborator = async (id, type, login, role) => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const obj = {
        item: {
            type: type,
            id: id
        },
        accessible_by: {
            type: "user",
            login: login
        },
        role: role
    }
    const response = await fetch(`https://api.box.com/2.0/collaborations`, {
        method: 'POST',
        headers: {
            Authorization: "Bearer "+access_token
        },
        body: JSON.stringify(obj)
    });
    if(response.statusText=="Unauthorized"){
        sessionExpired();
    }
    else{
        return response;
    }
}

export const removeBoxCollaborator = async (id) => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(`https://api.box.com/2.0/collaborations/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: "Bearer "+access_token
        }
    });
    if(response.statusText=="Unauthorized"){
        sessionExpired();
    }
    else{
        return response;
    }
}

export const updateBoxCollaborator = async (id, role) => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(`https://api.box.com/2.0/collaborations/${id}`, {
        method: 'PUT',
        headers: {
            Authorization: "Bearer "+access_token
        },
        body: JSON.stringify({role: role})
    });
    if(response.statusText=="Unauthorized"){
        sessionExpired();
    }
    else{
        return response;
    }
}

export const revokeAccessToken = async () => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(`https://api.box.com/oauth2/revoke`, {
        method: 'POST',
        headers: {
            Authorization: "Bearer "+access_token
        },
        body: JSON.stringify({token: access_token})
    });
    if(response.statusText=="Unauthorized"){
        sessionExpired();
    }
    else{
        return response;
    }
}

export const getAllWebHooks = async () => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(`https://api.box.com/2.0/webhooks`, {
        method: 'GET',
        headers: {
            Authorization: "Bearer "+access_token
        }
    });
    if(response.statusText=="Unauthorized"){
        sessionExpired();
    }
    else{
        console.log(await response.json());
        return response;
    }
}

export const createWebHook = async () => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const obj = {
        address: 'https://us-central1-nih-nci-dceg-episphere-dev.cloudfunctions.net/boxWebHook', 
        target: {id: '90879959998', type: "folder"}, 
        triggers: ["FILE.UPLOADED", "FILE.PREVIEWED", "FILE.DOWNLOADED", "FILE.TRASHED", "FILE.DELETED", "FILE.RESTORED", "FILE.COPIED", "FILE.MOVED", "FILE.LOCKED", "FILE.UNLOCKED", "FILE.RENAMED", "COMMENT.CREATED", "COMMENT.UPDATED", "COMMENT.DELETED", "TASK_ASSIGNMENT.CREATED", "TASK_ASSIGNMENT.UPDATED", "METADATA_INSTANCE.CREATED", "METADATA_INSTANCE.UPDATED", "METADATA_INSTANCE.DELETED", "FOLDER.CREATED", "FOLDER.RENAMED", "FOLDER.DOWNLOADED", "FOLDER.RESTORED", "FOLDER.DELETED", "FOLDER.COPIED", "FOLDER.MOVED", "FOLDER.TRASHED", "WEBHOOK.DELETED", "COLLABORATION.CREATED", "COLLABORATION.ACCEPTED", "COLLABORATION.REJECTED", "COLLABORATION.REMOVED", "COLLABORATION.UPDATED", "SHARED_LINK.DELETED", "SHARED_LINK.CREATED", "SHARED_LINK.UPDATED"]
    }
    const response = await fetch(`https://api.box.com/2.0/webhooks`, {
        method: 'POST',
        headers: {
            Authorization: "Bearer "+access_token
        },
        body: JSON.stringify(obj)
    });
    if(response.statusText=="Unauthorized"){
        sessionExpired();
    }
    else{
        console.log(response);
        return response;
    }
}

export const updateWebHook = async () => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const obj = {
        address: 'https://us-central1-nih-nci-dceg-episphere-dev.cloudfunctions.net/boxWebHook', 
        target: {id: '90879959998', type: "folder"}, 
        triggers: ["FILE.UPLOADED", "FILE.PREVIEWED", "FILE.DOWNLOADED", "FILE.TRASHED", "FILE.DELETED", "FILE.RESTORED", "FILE.COPIED", "FILE.MOVED", "FILE.LOCKED", "FILE.UNLOCKED", "FILE.RENAMED", "COMMENT.CREATED", "COMMENT.UPDATED", "COMMENT.DELETED", "TASK_ASSIGNMENT.CREATED", "TASK_ASSIGNMENT.UPDATED", "METADATA_INSTANCE.CREATED", "METADATA_INSTANCE.UPDATED", "METADATA_INSTANCE.DELETED", "FOLDER.CREATED", "FOLDER.RENAMED", "FOLDER.DOWNLOADED", "FOLDER.RESTORED", "FOLDER.DELETED", "FOLDER.COPIED", "FOLDER.MOVED", "FOLDER.TRASHED", "WEBHOOK.DELETED", "COLLABORATION.CREATED", "COLLABORATION.ACCEPTED", "COLLABORATION.REJECTED", "COLLABORATION.REMOVED", "COLLABORATION.UPDATED", "SHARED_LINK.DELETED", "SHARED_LINK.CREATED", "SHARED_LINK.UPDATED"]
    }
    const response = await fetch(`https://api.box.com/2.0/webhooks/249492740`, {
        method: 'PUT',
        headers: {
            Authorization: "Bearer "+access_token
        },
        body: JSON.stringify(obj)
    });
    if(response.statusText=="Unauthorized"){
        sessionExpired();
    }
    else{
        console.log(response);
        return response;
    }
}

export const updateLocalStorage = async (parentId, newFolderId, newFolderName, newFolderType) => {
    let data_summary = JSON.parse(localStorage.data_summary);
    for(let consortia in data_summary){
        const consortiaId = parseInt(consortia);
        let studyEntries = data_summary[consortiaId].studyEntries;
        if(consortiaId === parentId){
            studyEntries[newFolderId] = {};
            studyEntries[newFolderId].name = newFolderName;
            studyEntries[newFolderId].type = newFolderType;
            studyEntries[newFolderId].dataEntries = {};
        }
        else{
            for(let study in studyEntries){
                const studyId = parseInt(study);
                let dataEntries = studyEntries[studyId].dataEntries;
                if(studyId === parentId){
                    dataEntries[newFolderId] = {};
                    dataEntries[newFolderId].name = newFolderName;
                    dataEntries[newFolderId].type = newFolderType;
                    dataEntries[newFolderId].fileEntries = {};
                }
                else{
                    for(let data in dataEntries){
                        const dataId = parseInt(data);
                        let fileEntries = dataEntries[dataId].fileEntries;
                        if(dataId === parentId){
                            fileEntries[newFolderId] = {};
                            fileEntries[newFolderId].name = newFolderName;
                            fileEntries[newFolderId].type = newFolderType;
                        }
                    }
                }
            }
        }
    }
    localStorage.data_summary = JSON.stringify(data_summary);
}

export const removeActiveClass = (className, activeClass) => {
    let fileIconElement = document.getElementsByClassName(className);
    Array.from(fileIconElement).forEach(elm => {
        elm.classList.remove(activeClass);
    });
}

export const convertTextToJson = async (fileIds) => {
    let allObjs = [];
    for(const id in fileIds){
        if(fileIds[id].name.slice(fileIds[id].name.lastIndexOf('.')+1, fileIds[id].name.length) === 'json'){
            const intId = parseInt(id);
            let rawData = await getFile(intId);
            let obj = JSON.parse(rawData);
            allObjs = allObjs.concat(obj);
        }
        else if(fileIds[id].name.slice(fileIds[id].name.lastIndexOf('.')+1, fileIds[id].name.length) === 'txt'){
            const intId = parseInt(id);
            let rawData = await getFile(intId);
            let rows = rawData.split(/\n/g).map(tx=>tx.split(/\t/g))
            if((rawData.split(/\n+/).slice(-1).length==1) && (rawData.slice(-1)[0].length)){
                rows.pop()
            };
            const headings = rows[0];
            rows.splice(0, 1);
            let obj = rows.map(function (el) {
                let obj = {};
                for (let i = 0; i < el.length; i++) {
                obj[headings[i].trim()] = el[i];
                }
                return obj;
            });
            allObjs = allObjs.concat(obj);
        }
    };
    let jsonData = {};
    
    for(let data of allObjs){
        for(const key in data){
            const value = data[key];
            if(value !== "" && variables.BCAC[key] && variables.BCAC[key][value]){
                data[key] = variables.BCAC[key][value];
            }
        }
        if(jsonData[data.BCAC_ID]){
            jsonData[data.BCAC_ID] = {...jsonData[data.BCAC_ID], ...data}
        }else{
            jsonData[data.BCAC_ID] = {};
            jsonData[data.BCAC_ID] = data;
        }
    }
    return Object.values(jsonData);
}

export const sessionExpired = () => {
    localStorage.clear();
    alert('session expired, reloading');
    location.reload();
}

export const showAnimation = () => {
    document.getElementById('loadingAnimation').hidden = false;
}

export const hideAnimation = () => {
    document.getElementById('loadingAnimation').hidden = true;
}

export const showError = (errorMessage) => {
    document.getElementById('error').innerHTML = errorMessage;
}
export const disableCheckBox = (value) => {
    const studiesCheckBox = document.getElementsByName('studiesCheckBox');
    Array.from(studiesCheckBox).forEach(element => {
        element.disabled = value;
    });

    const dataTypeCheckBox = document.getElementsByName('dataTypeCheckBox');
    Array.from(dataTypeCheckBox).forEach(element => {
        element.disabled = value;
    });

//     document.getElementById('studySelectAll').disabled = value;
//     document.getElementById('dataTypeSelectAll').disabled = value;
//     document.getElementById('searchStudies').disabled = value;
//     document.getElementById('searchdataTypes').disabled = value;
}

export const getparameters = (query) => {
    const array = query.split('&');
    let obj = {};
    array.forEach(value => {
        obj[value.split('=')[0]] = value.split('=')[1];
    });
    return obj;
}

export const getAllFileStructure = async (array) => {
    let obj = {};
    for(let i = 0; i < array.length; i++){
        const ID = array[i].id;
        obj[ID] = {};
        obj[ID].name = array[i].name;
        obj[ID].type = array[i].type;
        obj[ID].studyEntries = {};
        obj[ID].count = 0;
        const studies = await getFolderItems(ID);
        
        if(studies.total_count && studies.total_count > 0){
            const allStudies = studies.entries.filter(dt => dt.name !== "Confluence - CPSIII" && dt.name !== "Confluence - Documents for NCI Participating Studies");
            for(let j = 0; j < allStudies.length; j++){
                if(allStudies[j].type === 'folder'){
                    const studyId = allStudies[j].id;
                    obj[ID].studyEntries[studyId] = {};
                    obj[ID].studyEntries[studyId].name = allStudies[j].name;
                    obj[ID].studyEntries[studyId].type = allStudies[j].type;
                    obj[ID].studyEntries[studyId].dataEntries = {};
                    obj[ID].count++;
                    obj[ID].studyEntries[studyId].count = 0;
                    const dataTypes = await getFolderItems(studyId);
                    if(dataTypes.total_count && dataTypes.total_count === 0) return;
                    const allDataTypes = dataTypes.entries;
                    for(let k = 0; k < allDataTypes.length; k++){
                        if(allDataTypes[k].type === 'folder' && allDataTypes[k].name.trim().toLowerCase() !== 'samples'){
                            const dataId = allDataTypes[k].id;
                            obj[ID].studyEntries[studyId].dataEntries[dataId] = {}
                            obj[ID].studyEntries[studyId].dataEntries[dataId].name = allDataTypes[k].name;
                            obj[ID].studyEntries[studyId].dataEntries[dataId].type = allDataTypes[k].type;
                            obj[ID].studyEntries[studyId].dataEntries[dataId].fileEntries = {};
                            obj[ID].studyEntries[studyId].count++;
                            obj[ID].studyEntries[studyId].dataEntries[dataId].count = 0
                            const files = await getFolderItems(dataId);
                            if(files.total_count && files.total_count === 0) return;
                            const allFiles = files.entries;
                            for(let l = 0; l < allFiles.length ; l++){
                                if(allFiles[l].type !== 'file') return;
                                const fileId = allFiles[l].id;
                                obj[ID].studyEntries[studyId].dataEntries[dataId].fileEntries[fileId] = {};
                                obj[ID].studyEntries[studyId].dataEntries[dataId].fileEntries[fileId].name = allFiles[l].name;
                                obj[ID].studyEntries[studyId].dataEntries[dataId].fileEntries[fileId].type = allFiles[l].type;
                                obj[ID].studyEntries[studyId].dataEntries[dataId].count++;
                            }
                        }
                    }
                }
            }
        }
    }
    return obj;
}

export const notificationTemplate = (top, header, body) => {
    return `
        <div style="position: absolute; top: ${top}rem; right: 2rem; z-index: 9;">
            <div class="toast fade show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="mr-auto">${header}</strong>
                    <button type="button" class="ml-2 mb-1 close hideNotification" data-dismiss="toast" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="toast-body">
                    ${body}
                </div>
            </div>
        </div>
        `;
}

export const consortiumSelection = async () => {
    let template = '';
    let array = await getValidConsortium();
    if(array.length === 0) return '';
    template += '<strong>Select consortium</strong><select id="CPCSelect" class="form-control" required>'
    array.forEach((obj, index) => {
        if(index === 0) template += '<option value=""> -- Select consortium -- </option>'
        template += `<option value="${obj.id}">${obj.name}</option>`;
    });
    template += '</select>';
    return template;
}

export const getValidConsortium = async () => {
    const response = await getFolderItems(0);
    const array = response.entries.filter(obj => obj.type === 'folder' && ( obj.name === 'Confluence_NCI' || obj.name === 'Confluence_BCAC'));
    return array;
}

export const filterStudies = (array) => {
    return array.filter(obj => obj.type === 'folder' && obj.name !== 'Confluence - CPSIII' && obj.name !== 'Confluence - Dikshit' && obj.name !== 'Confluence - Documents for NCI Participating Studies');
}

export const filterDataTypes = (array) => {
    return array.filter(obj => obj.type === 'folder' && obj.name.toLowerCase().trim() !== 'samples');
}

export const filterFiles = (array) => {
    return array.filter(obj => obj.type === 'file');
}