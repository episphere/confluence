import { config } from "./config.js";
import { variables } from "./variables.js";
import { logOut } from "./manageAuthentication.js";
import { confluence } from '../confluence.js';

export const getFolderItems = async (id) => {
    try{
        const access_token = JSON.parse(localStorage.parms).access_token;
        let r = await fetch('https://api.box.com/2.0/folders/'+id+'/items',{
            method:'GET',
            headers:{
                Authorization:"Bearer "+access_token
            }
        })
        if(r.status === 401){
            if((await refreshToken()) === true) return await getFolderItems(id);
        }
        else if(r.status === 200){
            return r.json()
        }
        else{
            hideAnimation();
            console.error(r);
        }
    }
    catch(err) {
        if((await refreshToken()) === true) return await getFolderItems(id);
    }
}

export const getFolderInfo = async (id) => {
    try{
        const access_token = JSON.parse(localStorage.parms).access_token;
        let r = await fetch('https://api.box.com/2.0/folders/'+id,{
            method:'GET',
            headers:{
                Authorization:"Bearer "+access_token
            }
        })
        if(r.status === 401){
            if((await refreshToken()) === true) return await getFolderInfo(id);
        }
        else if(r.status === 200){
            return r.json()
        }
        else{
            hideAnimation();
            console.error(r);
        }
    }
    catch(err) {
        if((await refreshToken()) === true) return await getFolderInfo(id);
    }
}

export const getPublicFile = async (sharedName, id) => {
    let r = await fetch(`https://us-central1-nih-nci-dceg-episphere-dev.cloudfunctions.net/confluencePublicData?fileId=${id}&sharedName=${sharedName}`,{
        method:'GET'
    });
    if(r.status === 200) {
        return r.json();
    }
    else{
        hideAnimation();
        console.error(r);
    }
};

export const getFile = async (id) => {
    try{
        const access_token = JSON.parse(localStorage.parms).access_token;
        let r = await fetch(`https://api.box.com/2.0/files/${id}/content`,{
            method:'GET',
            headers:{
                Authorization:"Bearer "+access_token
            }
        });
        if(r.status === 401) {
            if((await refreshToken()) === true) return await getFile(id);
        }
        else if(r.status === 200) {
            return r.text();
        }
        else{
            hideAnimation();
            console.error(r);
        }
    }
    catch(err) {
        if((await refreshToken()) === true) return await getFile(id);
    }
};

export const getFileJSON = async (id) => {
    try{
        const access_token = JSON.parse(localStorage.parms).access_token;
        let r = await fetch(`https://api.box.com/2.0/files/${id}/content`,{
        headers:{
            Authorization:"Bearer "+access_token
            }
        });
        if(r.status === 401){
            if((await refreshToken()) === true) return await getFileJSON(id);
        }
        else if(r.status === 200){
            return r.json()
        }
        else if(r.status === 404){
            hideAnimation();
            console.error(r);
            return null;
        }
        else{
            hideAnimation();
            console.error(r);
        }
    }
    catch(err) {
        if(err.message !== 'Failed to fetch'){
            if((await refreshToken()) === true) return await getFileJSON(id);
        }
    }
};

export const getFileInfo = async (id) => {
    try{
        const access_token = JSON.parse(localStorage.parms).access_token;
        let r = await fetch('https://api.box.com/2.0/files/'+id,{
            method:'GET',
            headers:{
                Authorization:"Bearer "+access_token
            }
        })
        if(r.status === 401){
            if((await refreshToken()) === true) return await getFileInfo(id);
        }
        else if(r.status === 200){
            return r.json()
        }
        else{
            hideAnimation();
            console.error(r);
        }
    }
    catch(err) {
        if((await refreshToken()) === true) return await getFileInfo(id);
    }
}

export const getFileVersions = async (id) => {
    try {
        const access_token = JSON.parse(localStorage.parms).access_token;
        let r = await fetch(`https://api.box.com/2.0/files/${id}/versions`,{
            method:'GET',
            headers:{
                Authorization:"Bearer "+access_token
            }
        })
        if(r.status === 401){
            if((await refreshToken()) === true) return await getFileVersions(id);
        }
        else if(r.status === 200){
            return r.json()
        }
        else{
            hideAnimation();
            console.error(r);
        }
    }
    catch(err) {
        if((await refreshToken()) === true) return await getFileVersions(id);
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
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method:'POST',
            body: `grant_type=authorization_code&code=${parms.code}&client_id=${clt.client_id}&client_secret=${clt.server_id}`
        });
        if(response.status && response.status === 200) {
            localStorage.parms = JSON.stringify(await response.json());
            window.history.replaceState({},'', './#data_exploration/summary');
            confluence();
            document.getElementById('loginBoxAppDev').hidden = true;
            document.getElementById('loginBoxAppProd').hidden = true;
        }
    }else{
        if(localStorage.parms){
            confluence.parms=JSON.parse(localStorage.parms)
            if(confluence.parms.access_token === undefined){
                localStorage.clear();
                alert('access token not found, please contact system administrator')
            }
        }
    }
}


export const refreshToken = async () => {
    if(!localStorage.parms) return;
    const parms = JSON.parse(localStorage.parms);
    let clt={}
    if(location.origin.indexOf('localhost') !== -1){
        clt = config.iniAppDev;
    }else if(location.origin.indexOf('episphere') !== -1){
        clt = config.iniAppProd
    }else if(location.origin.indexOf('observablehq') !== -1){
        clt = config.iniObs
    }

    const response = await fetch(`https://api.box.com/oauth2/token/`, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method:'POST',
        body: `grant_type=refresh_token&refresh_token=${parms.refresh_token}&client_id=${clt.client_id}&client_secret=${clt.server_id}`
    });
    if(response.status === 200){
        const newToken = await response.json();
        const newParms = Object.assign(parms, newToken);
        localStorage.parms = JSON.stringify(newParms);
        return true;
    }
    else{
        hideAnimation();
        sessionExpired();
    }
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
    try {
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
        if(response.status === 401){
            if((await refreshToken()) === true) return await createFolder(folderId, foldername);
        }
        else if(response.status === 201){
            return response;
        }
        else{
            return {status: response.status, statusText: response.statusText};
        };
    }
    catch(err) {
        if((await refreshToken()) === true) return await createFolder(folderId, foldername);
    }
};

export const copyFile = async (fileId, parentId) => {
    try {
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
        if(response.status === 401){
            if((await refreshToken()) === true) return await copyFile(fileId, parentId);
        }
        else if(response.status === 201){
            return response;
        }
        else{
            return {status: response.status, statusText: response.statusText};
        };
    }
    catch(err) {
        if((await refreshToken()) === true) return await copyFile(fileId, parentId);
    }
};

export const uploadFileBox = async (folderId, fileName, file) => {
    try {
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
        if(response.status === 401){
            if((await refreshToken()) === true) return await uploadFileBox(folderId, fileName, file);
        }
        else if(response.status === 201){
            return response.json();
        }
        else{
            return {status: response.status, statusText: response.statusText};
        };
    }
    catch(err) {
        if((await refreshToken()) === true) return await uploadFileBox(folderId, fileName, file);
    }
};

export const uploadFile = async (data, fileName, folderId, html) => {
    try {
        const access_token = JSON.parse(localStorage.parms).access_token;
        const form = new FormData();
        let blobData = '';
        if(html) blobData = new Blob([data], { type: 'text/html'});
        else blobData = new Blob([JSON.stringify(data)], { type: 'application/json'});
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
        if(response.status === 401){
            if((await refreshToken()) === true) return await uploadFile(data, fileName, folderId, html);
        }
        else if(response.status === 201){
            return response.json();
        }
        else if(response.status === 409) {
            return {status: response.status, json: await response.json()}
        }
        else{
            return {status: response.status, statusText: response.statusText};
        };
    }
    catch(err) {
        if((await refreshToken()) === true) return await uploadFile(data, fileName, folderId, html);
    }
}

export const uploadFileVersion = async (data, fileId, type) => {
    try {
        const access_token = JSON.parse(localStorage.parms).access_token;
        const form = new FormData();
        let blobData = '';
        if(type === 'text/html' || type === 'text/csv') blobData = new Blob([data], { type: type});
        else blobData = new Blob([JSON.stringify(data)], { type: type});
        
        form.append('file', blobData);
    
        let response = await fetch(`https://upload.box.com/api/2.0/files/${fileId}/content`, {
            method: "POST",
            headers:{
                Authorization:"Bearer "+access_token
            },
            body: form,
            contentType: false
        });
        if(response.status === 401){
            if((await refreshToken()) === true) return await uploadFileVersion(data, fileId, type);
        }
        else if(response.status === 201){
            return response.json();
        }
        else{
            return {status: response.status, statusText: response.statusText};
        };
    }
    catch(err) {
        if((await refreshToken()) === true) return await uploadFileVersion(data, fileId, 'text/html');
    }
}

export const getCollaboration = async (id, type) => {
    try {
        const access_token = JSON.parse(localStorage.parms).access_token;
        const response = await fetch(`https://api.box.com/2.0/${type}/${id}/collaborations`, {
            headers:{
                Authorization:"Bearer "+access_token
            }
        });
        if(response.status === 401){
            if((await refreshToken()) === true) return await getCollaboration(id, type);
        }
        if(response.status === 200){
            return response.json();
        }
        else{
            return null;
        }
    }
    catch(err) {
        if((await refreshToken()) === true) return await getCollaboration(id, type);
    }
}

export const getFileAccessStats = async (id) => {
    try {
        const access_token = JSON.parse(localStorage.parms).access_token;
        const response = await fetch(`https://api.box.com/2.0/file_access_stats/${id}`, {
            headers:{
                Authorization:"Bearer "+access_token
            }
        });
        if(response.status === 401){
            if((await refreshToken()) === true) return await getCollaboration(id, type);
        }
        if(response.status === 200){
            return response.json();
        }
        else{
            return null;
        }
    }
    catch(err) {
        if((await refreshToken()) === true) return await getCollaboration(id, type);
    }
}

export const getCurrentUser = async () => {
    try {
        const access_token = JSON.parse(localStorage.parms).access_token;
        const response = await fetch(`https://api.box.com/2.0/users/me`, {
            headers: {
                Authorization: "Bearer "+access_token
            }
        });
        if(response.status === 401){
            if((await refreshToken()) === true) return await getCurrentUser();
        }
        if(response.status === 200){
            return response.json();
        }
        else{
            return null;
        }
    }
    catch(err) {
        if((await refreshToken()) === true) return await getCurrentUser();
    }
}

export const addNewCollaborator = async (id, type, login, role) => {
    try {
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
        if(response.status === 401){
            if((await refreshToken()) === true) return await addNewCollaborator(id, type, login, role);
        }
        else {
            return response;
        }
    }
    catch(err) {
        if((await refreshToken()) === true) return await addNewCollaborator(id, type, login, role);
    }
}

export const removeBoxCollaborator = async (id) => {
    try {
        const access_token = JSON.parse(localStorage.parms).access_token;
        const response = await fetch(`https://api.box.com/2.0/collaborations/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: "Bearer "+access_token
            }
        });
        if(response.status === 401){
            if((await refreshToken()) === true) return removeBoxCollaborator(id);
        }
        else{
            return response;
        }
    }
    catch(err) {
        if((await refreshToken()) === true) return removeBoxCollaborator(id);
    }
}

export const updateBoxCollaborator = async (id, role) => {
    try {
        const access_token = JSON.parse(localStorage.parms).access_token;
        const response = await fetch(`https://api.box.com/2.0/collaborations/${id}`, {
            method: 'PUT',
            headers: {
                Authorization: "Bearer "+access_token
            },
            body: JSON.stringify({role: role})
        });
        if(response.status === 401){
            if((await refreshToken()) === true) return await updateBoxCollaborator(id, role);
        }
        else {
            return response;
        }
    }
    catch(err) {
        if((await refreshToken()) === true) return await updateBoxCollaborator(id, role);
    }
}

export const getAllWebHooks = async () => {
    try {
        const access_token = JSON.parse(localStorage.parms).access_token;
        const response = await fetch(`https://api.box.com/2.0/webhooks`, {
            method: 'GET',
            headers: {
                Authorization: "Bearer "+access_token
            }
        });
        if(response.status === 401){
            if((await refreshToken()) === true) return await getAllWebHooks();
        }
        else{
            return response;
        }
    }
    catch(err) {
        if((await refreshToken()) === true) return await getAllWebHooks();
    }    
}

export const createWebHook = async () => {
    try {
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
        if(response.status === 401){
            if((await refreshToken()) === true) return await createWebHook();
        }
        else{
            return response;
        }
    }
    catch(err) {
        if((await refreshToken()) === true) return await createWebHook();
    }
}

export const updateWebHook = async () => {
    try {
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
        if(response.status === 401){
            if((await refreshToken()) === true) return await updateWebHook();
        }
        else{
            return response;
        }
    }
    catch(err) {
        if((await refreshToken()) === true) return await updateWebHook();
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
            // jsonData[data.BCAC_ID] = {...jsonData[data.BCAC_ID], ...data}
            jsonData[data.BCAC_ID] = Object.assign(jsonData[data.BCAC_ID], data);
        }else{
            jsonData[data.BCAC_ID] = {};
            jsonData[data.BCAC_ID] = data;
        }
    }
    return Object.values(jsonData);
}

export const sessionExpired = () => {
    delete localStorage.parms;
    location.reload();
}

export const showAnimation = () => {
    document.getElementById('loadingAnimation').style.display = '';
}

export const hideAnimation = () => {
    document.getElementById('loadingAnimation').style.display = 'none';
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
            const allStudies = filterStudies(studies.entries);
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
                    <button title="Close" type="button" class="ml-2 mb-1 close hideNotification" data-dismiss="toast" aria-label="Close">
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
    template += '<strong>Select consortium</strong> <span class="required">*</span><select id="CPCSelect" class="form-control" required>'
    for(let obj = 0; obj < array.length; obj++){
        const bool = checkMyPermissionLevel(await getCollaboration(array[obj].id, `${array[obj].type}s`), JSON.parse(localStorage.parms).login);
        if(bool === true){
            if(obj === 0) template += '<option value=""> -- Select consortium -- </option>'
            template += `<option value="${array[obj].id}">${array[obj].name}</option>`;
        }
    };
    template += '</select>';
    return template;
}

export const getValidConsortium = async () => {
    const response = await getFolderItems(0);
    return filterConsortiums(response.entries);
}

export const filterConsortiums = (array) => {
    return array.filter(obj => obj.type === 'folder' && ( obj.name === 'Confluence_NCI' || obj.name === 'Confluence_BCAC' || obj.name === 'Confluence_LAGENO'));
}

export const filterStudies = (array) => {
    return array.filter(obj => obj.type === 'folder' && obj.name !== 'Confluence - CPSIII' && obj.name !== 'Confluence - Dikshit' && obj.name !== 'Confluence - Documents for NCI Participating Studies');
}

export const filterDataTypes = (array) => {
    return array.filter(obj => obj.type === 'folder' && obj.name.toLowerCase().trim() !== 'samples');
}

export const filterStudiesDataTypes = (array) => {
    return array.filter(obj => obj.type === 'folder' && obj.name !== 'Confluence - CPSIII' && obj.name !== 'Confluence - Dikshit' && obj.name !== 'Confluence - Documents for NCI Participating Studies' && obj.name !== 'Samples');
}

export const filterFiles = (array) => {
    return array.filter(obj => obj.type === 'file');
}

export const filterProjects = (array) => {
    return array.filter(obj => obj.type === 'folder' && obj.name.toLowerCase().indexOf('confluence_') !== -1 && obj.name.toLowerCase().indexOf('_project') !== -1);
}

export const checkMyPermissionLevel = (data, login) => {
    if(data.entries.length === 0) return true;
    const array = data.entries.filter(d => d.accessible_by && d.accessible_by.login === login);
    if(array.length === 0){
        const newArray = data.entries.filter(d => d.created_by && d.created_by.login === login);
        if(newArray.length > 0) return true;
    }
    else if(array[0].role === 'editor' || array[0].role === 'co-owner'){
        return true;
    }
    return false;
}

export const checkDataSubmissionPermissionLevel = (data, login) => {
    if(data.entries.length === 0) return true;
    const array = data.entries.filter(d => d.accessible_by && d.accessible_by.login === login);
    if(array.length === 0){
        const newArray = data.entries.filter(d => d.created_by && d.created_by.login === login);
        if(newArray.length > 0) return true;
    }
    else if(array[0].role === 'editor' || array[0].role === 'co-owner' || array[0].role === 'uploader'){
        return true;
    }
    return false;
}

export const amIViewer = (data, login) => {
    if(data.entries.length === 0) return true;
    const array = data.entries.filter(d => d.accessible_by && d.accessible_by.login === login);
    if(array.length === 1 && array[0].role === 'viewer'){
        return true;
    }
    return false;
}

export const inactivityTime = () => {
    let time;
    const resetTimer = () => {
        clearTimeout(time);
        time = setTimeout(() => {
            const r = confirm('You were inactive for more than 20 minutes, would you like to extend your session?');
            if(r) {
                
            }
            else {
                logOut();
            }
        }, 1200000);
    }

    window.onload = resetTimer;
    document.onmousemove = resetTimer;
    document.onkeypress = resetTimer;
};

export const csvJSON = (csv) => {
    const lines = csv.replace(/"/g,'').split(/[\r\n]+/g);
    const result = [];
    const headers = lines[0].replace(/"/g,'').split(/[,\t]/g);
    for(let i=1; i < lines.length; i++){
        const obj = {};
        const currentline = lines[i].split(/[,\t]/g);
        for(let j = 0; j<headers.length; j++){
            let value = headers[j];
            if(value === 'age10.19') value = '10-19';
            if(value === 'age20.29') value = '20-29';
            if(value === 'age30.39') value = '30-39';
            if(value === 'age40.49') value = '40-49';
            if(value === 'age50.59') value = '50-59';
            if(value === 'age60.69') value = '60-69';
            if(value === 'age70.79') value = '70-79';
            if(value === 'age80.89') value = '80-89';
            if(value === 'age90.99') value = '90-99';
            obj[value] = currentline[j];
        }
        if(obj.study !== undefined) {
            result.push(obj);
        }
    }
    for(let obj of result){
        obj.total = parseInt(obj['statusTotal']);
    }
    return result;
}

export const csv2Json = (csv) => {
    const lines = csv.replace(/"/g,'').split(/[\r\n]+/g);
    const result = [];
    const headers = lines[0].replace(/"/g,'').split(/[,\t]/g);
    for(let i=1; i < lines.length; i++){
        const obj = {};
        const currentline = lines[i].split(/[,\t]/g);
        for(let j = 0; j<headers.length; j++){
            if(currentline[j]){
                let value = headers[j];
                obj[value] = currentline[j];
            }
        }
        if(Object.keys(obj).length > 0) result.push(obj);
    }
    return {data:result, headers};
}

export const jsonToTSVTxt = (json) => {
    const fields = Object.keys(json[0])
    const replacer = (key, value) => { return value === null ? '' : value } 
    let tsv = json.map((row) => {
        return fields.map((fieldName) => {
            return JSON.stringify(row[fieldName], replacer)
        }).join('\t')
    })
    tsv.unshift(fields.join('\t')) // add header column
    tsv = tsv.join('\r\n');
    return tsv;
}

export const json2csv = (json) => {
    const fields = Object.keys(json[0])
    const replacer = (key, value) => { return value === null ? '' : value } 
    let csv = json.map((row) => {
        return fields.map((fieldName) => {
            return JSON.stringify(row[fieldName], replacer)
        }).join(',')
    })
    csv.unshift(fields.join(',')) // add header column
    csv = csv.join('\r\n');
    return csv;
}

export const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export const emailsAllowedToUpdateData = ['patelbhp@nih.gov', 'ahearntu@nih.gov']

export const publicDataFileId = 697309514903;

export const summaryStatsFileId = 691143057533;

export const missingnessStatsFileId = 653087731560;
