import { config } from "./config.js";
import { logOut } from "./manageAuthentication.js";
import { confluence } from '../confluence.js';
export const emailsAllowedToUpdateData = ['patelbhp@nih.gov', 'ahearntu@nih.gov', 'ajayiat@nih.gov']
export const publicDataFileId = 697309514903;
export const summaryStatsFileId = 691143057533;
// export const summaryStatsFileId = 795642281498;
export const missingnessStatsFileId = 653087731560;
export const acceptedFolder = 196011761030;
export const deniedFolder = 196012663822;
export const submitterFolder = 196013436057;
export const emailforChair = [
    {id: 'user_1', email:"ssbehpour@deloitte.com", boxId:195155906608, consortium:'AABCG'}, 
    {id: 'user_2', email:"ben.kopchick@nih.gov", boxId:195153060784, consortium:'MERGE'}, 
    {id: 'user_3', email:"behpours2@nih.gov", boxId:195156183284, consortium:'LAGENO'}, 
    {id: 'user_4', email:"ahearntu@nih.gov", boxId:195151351417, consortium:'CIMBA'}, 
    {id: 'user_5', email:"garciacm@nih.gov", boxId:195156038705, consortium:'C-NCI'}, 
    {id: 'user_6', email:"sbehpour@deloitte.com", boxId:195155330962, consortium:'BCAC'}
];
export const messagesForChair = {
    user_1: 'AABCG DACC Chair',
    user_2: 'MERGE DACC Chair',
    user_3: 'LAGENO DACC Chair',
    user_4: 'CIMBA DACC Chair',
    user_5: 'C-NCI DACC Chair',
    user_6: 'BCAC DACC Chair'
}
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
export const getFileRange = async (id, start, end) => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(`https://api.box.com/2.0/files/${id}/content`, {
        headers: {
            "Authorization": `Bearer ${access_token}`,
            'range': `bytes=${start}-${end}`
        },
    });
    return response.text();
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
            return false;
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

export const createComment = async (id, msg = "") => {
    try {
        const access_token = JSON.parse(localStorage.parms).access_token;
        const response = await fetch(`https://api.box.com/2.0/comments`, {
        method: "POST",
        headers: {
            Authorization: "Bearer " + access_token,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: msg,
            item: {
            type: "file",
            id: id,
            },
        }),
        });
        if (response.status === 401) {
        if ((await refreshToken()) === true) return await createComment(id, msg);
        } else {
        return response;
        }
    } catch (err) {
        if ((await refreshToken()) === true) return await createComment(id, msg);
    }
};

export const updateTaskAssignment = async (id, res_state, msg = "") => {
    try {
      let body = msg.length
        ? JSON.stringify({
            resolution_state: res_state,
            message: msg,
          })
        : JSON.stringify({
            resolution_state: res_state,
          });
      const access_token = JSON.parse(localStorage.parms).access_token;
      const response = await fetch(
        `https://api.box.com/2.0/task_assignments/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: "Bearer " + access_token,
          },
          body,
        }
      );
      if (response.status === 401) {
        if ((await refreshToken()) === true)
          return await updateTaskAssignment(id, res_state, msg);
      } else {
        return response;
      }
    } catch (err) {
      if ((await refreshToken()) === true)
        return await updateTaskAssignment(id, res_state, msg);
    }
};

export const getTaskList = async (id) => {
    try {
      const access_token = JSON.parse(localStorage.parms).access_token;
      const response = await fetch(`https://api.box.com/2.0/files/${id}/tasks`, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + access_token,
        },
      });
      if (response.status === 401) {
        if ((await refreshToken()) === true) return await getTaskList(id);
      }
      if (response.status === 200) {
        return response.json();
      } else {
        return null;
      }
    } catch (err) {
      if ((await refreshToken()) === true) return await getTaskList(id);
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
            return false;
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
        if(location.origin.indexOf('localhost') !== -1) clt = config.iniAppLocal;
        else if(location.origin.indexOf('episphere') !== -1) clt = config.iniAppDev
        else if(location.origin.indexOf(applicationURLs.stage) !== -1) clt = config.iniAppStage
        else if(location.origin.indexOf(applicationURLs.prod) !== -1) clt = config.iniAppProd;
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
            window.history.replaceState({},'', './#home');
            confluence();
            document.getElementById('loginBoxAppDev').hidden = true;
            document.getElementById('loginBoxAppStage').hidden = true;
            document.getElementById('loginBoxAppEpisphere').hidden = true;
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
    if(location.origin.indexOf('localhost') !== -1) clt = config.iniAppLocal;
    else if(location.origin.indexOf('episphere') !== -1) clt = config.iniAppDev
    else if(location.origin.indexOf(applicationURLs.stage) !== -1) clt = config.iniAppStage
    else if(location.origin.indexOf(applicationURLs.prod) !== -1) clt = config.iniAppProd;
    const response = await fetch(`https://api.box.com/oauth2/token/`, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method:'POST',
        body: `grant_type=refresh_token&refresh_token=${parms.refresh_token}&client_id=${clt.client_id}&client_secret=${clt.server_id}`
    });
    if(response.status === 200){
        const newToken = await response.json();
        const newParms = {...parms, ...newToken};
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
export const moveFile = async (fileId, parentId) => {
    try {
      const access_token = JSON.parse(localStorage.parms).access_token;
      let obj = {
        parent: {
          id: parentId,
        },
      };
      let response = await fetch(`https://api.box.com/2.0/files/${fileId}`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + access_token,
        },
        body: JSON.stringify(obj),
      });
      if (response.status === 401) {
        if ((await refreshToken()) === true)
          return await moveFile(fileId, parentId);
      } else if (response.status === 201) {
        return response;
      } else {
        return {
          status: response.status,
          statusText: response.statusText,
        };
      }
    } catch (err) {
      if ((await refreshToken()) === true)
        return await moveFile(fileId, parentId);
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
            return {status: response.status, statusText: response.statusText}
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
            if((await refreshToken()) === true) return await getFileAccessStats(id, type);
        }
        if(response.status === 200){
            return response.json();
        }
        else{
            return null;
        }
    }
    catch(err) {
        if((await refreshToken()) === true) return await getFileAccessStats(id, type);
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
export const removeActiveClass = (className, activeClass) => {
    let fileIconElement = document.getElementsByClassName(className);
    Array.from(fileIconElement).forEach(elm => {
        elm.classList.remove(activeClass);
    });
}
export const sessionExpired = () => {
    delete localStorage.parms;
    location.reload();
}
export const showAnimation = () => {
    if(document.getElementById('loadingAnimation')) document.getElementById('loadingAnimation').style.display = 'block';
}
export const hideAnimation = () => {
    if(document.getElementById('loadingAnimation')) document.getElementById('loadingAnimation').style.display = 'none';
}
export const getparameters = (query) => {
    const array = query.split('&');
    let obj = {};
    array.forEach(value => {
        obj[value.split('=')[0]] = value.split('=')[1];
    });
    return obj;
}
export const notificationTemplate = (top, header, body) => {
    return `
        <div style="position: absolute; top: ${top}rem; right: 2rem; z-index: 10;">
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
const consortiums = ['Confluence_NCI', 'Confluence_BCAC', 'Confluence_LAGENO', 'Confluence_OCPL', 'Confluence_CIMBA'];
export const filterConsortiums = (array, folders = consortiums) => {
    return array.filter(obj => obj.type === 'folder' && folders.includes(obj.name));
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
export const checkMyPermissionLevel = async (data, login, id, type) => {
    if(id){
        let info;
        if(type === 'folder') info = await getFolderInfo(id);
        else info = await getFileInfo(id);
        if(info.created_by.login === login) return true;
    }
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
            const resposeTimeout = setTimeout(() => {
                // log out user if they don't respond to warning after 5 mins.
                logOut();
            }, 300000);
            const button = document.createElement('button');
            button.dataset.toggle = 'modal';
            button.dataset.target = '#confluenceMainModal'
            document.body.appendChild(button);
            button.click();
            const header = document.getElementById('confluenceModalHeader');
            const body = document.getElementById('confluenceModalBody');
            header.innerHTML = `<h5 class="modal-title">Inactive</h5>`;
            body.innerHTML = `You were inactive for 20 minutes, would you like to extend your session?
                            <div class="modal-footer">
                                <button type="button" title="Close" class="btn btn-dark log-out-user" data-dismiss="modal">Log Out</button>

                                <button type="button" title="Continue" class="btn btn-primary extend-user-session" data-dismiss="modal">Continue</button>
                            </div>`
            document.body.removeChild(button);
            Array.from(document.getElementsByClassName('log-out-user')).forEach(e => {
                e.addEventListener('click', () => {
                    logOut();
                })
            })
            Array.from(document.getElementsByClassName('extend-user-session')).forEach(e => {
                e.addEventListener('click', () => {
                    clearTimeout(resposeTimeout);
                    resetTimer;
                })
            });
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
        //currentline.replace("Asian", "Asian Subcontinent");
        // for(let j=0; j<currentline.length; j++){
        //     let value = currentline[j];
        //     if(value === 'Asian') value = 'Asian Subcontinent';
        //     obj[value] = currentline[j];
        //     console.log(obj);
        // }
        for(let j = 0; j<headers.length; j++){
            let value = headers[j];
            //console.log(value);
            if(value === 'age10.19') value = '10-19';
            if(value === 'age20.29') value = '20-29';
            if(value === 'age30.39') value = '30-39';
            if(value === 'age40.49') value = '40-49';
            if(value === 'age50.59') value = '50-59';
            if(value === 'age60.69') value = '60-69';
            if(value === 'age70.79') value = '70-79';
            if(value === 'age80.89') value = '80-89';
            if(value === 'age90.99') value = '90-99';
            if(value === 'age100.109') value = '100-109';
            //if(value === 'Asian') value = 'Asian Subcontinent';
            obj[value] = currentline[j];
          //console.log(obj);
        }
        if(obj.study !== undefined) {
           //console.log(obj);
            result.push(obj);
        }
    }
    for(let obj of result){
        obj.total = parseInt(obj['statusTotal']);
    }
    for(var k=0; k<result.length; k++){
        if(result[k].ethnicityClass === 'Asian') {
            result[k].ethnicityClass = 'Asian Subcontinent';
        }
        if(result[k].ethnicityClass === 'South East Asian') {
            result[k].ethnicityClass = 'South-East Asian';
        }
    }
    return {jsonData:result, headers};
}
export const tsv2Json = (tsv) => {
    const lines = tsv.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g,'').replace(/\n/g, '').split(/[\r]+/g);
    const result = [];
    const headers = lines[0].replace(/"/g,'').split(/[\t]/g);
    for(let i=1; i < lines.length; i++){
        const obj = {};
        const currentline = lines[i].split(/[\t]/g);
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
export const json2csv = (json, fields) => {
    if(!fields.includes('study')) fields.push('study');
    const replacer = (key, value) => { return value === null ? '' : value }
    let csv = json.map((row) => {
        return fields.map((fieldName) => {
            return JSON.stringify(row[fieldName], replacer)
        }).join(',') // \t for tsv
    })
    csv.unshift(fields.join(',')) // add header column  \t for tsv
    csv = csv.join('\r\n');
    return csv;
}
export const json2other = (json, fields, tsv) => {
    const replacer = (key, value) => { return value === null ? '' : value }
    let csv = json.map((row) => {
        return fields.map((fieldName) => {
            return JSON.stringify(row[fieldName], replacer)
        }).join(`${tsv? '\t': ','}`) // \t for tsv
    })
    csv.unshift(fields.join(`${tsv? '\t': ','}`)) // add header column  \t for tsv
    csv = csv.join('\r\n');
    return csv;
}
export const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",").trim();
}
export const mapReduce = (data, variable) => {
    const filteredData = data.map(dt => parseInt(dt[variable])).filter(dt => isNaN(dt) === false);
    if(filteredData.length > 0) return filteredData.reduce((a,b) => a+b);
    else return 0;
}
export const assignNavbarActive = (element, parent) => {
    removeActiveClass('nav-menu-links', 'navbar-active');
    removeActiveClass('grid-elements', 'navbar-active');
    element.classList.add('navbar-active');
    if(parent && parent === 1) element.parentElement.previousElementSibling.classList.add('navbar-active');
    if(parent && parent === 2) element.parentElement.parentElement.previousElementSibling.classList.add('navbar-active');
}
export const reSizePlots = () => {
    document.querySelectorAll('.js-plotly-plot').forEach(e => Plotly.Plots.resize(e))
}
export const shortenText = (str, size) => {
    return str.length > size ? `${str.substr(0,size)}...`: str;
}
export const defaultPageSize = 40;
export const handleRangeRequests = async () => {
    const fileInfo = await getFileInfo('751586322923');
    const fileSize = fileInfo.size;
    console.log(`File size ${fileSize/1000000} MB`)
    const rangeStart = 0;
    const rangeEnd = 10000000;
    console.time('Downloading 10 MB of data')
    const rangeData = await getFileRange('751586322923', rangeStart, rangeEnd);
    console.timeEnd('Downloading 10 MB of data')
    console.time('Parsing')
    const lines = rangeData.trim().split(/[\n]/g);
    const header = lines[0];
    const headerArray = header.split(/[\s]/g);
    console.log(headerArray)
    const dataArray = [];
    lines.forEach((l,i) => {
        if(rangeStart === 0 && i === 0) return;
        if(i === lines.length - 1) return;
        dataArray.push(l.split(/[\s]/g));
    })
    console.timeEnd('Parsing')
    console.log(dataArray)
}
export const applicationURLs = {
    'dev': 'https://episphere.github.io',
    'stage': 'https://confluence-stage.cancer.gov',
    'prod': 'https://confluence.cancer.gov',
    'local': 'http://localhost'
}
export const filePreviewer = (fileId, divId) => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const preview = new Box.Preview();
    preview.show(fileId, access_token, {
        container: divId
    });

}

export async function showComments(id) {
    const commentSection = document.getElementById("fileComments");
    const response = await listComments(id);
  
    let comments = JSON.parse(response).entries;
    if (comments.length === 0) {
      const dropdownSection = document.getElementById(`fileComments`);
      dropdownSection.innerHTML = ` <div class='comments'>
          Comments
          <div class='text-left'>
              No comments to show.
          </div>
          </div>`;
  
      return;
    }
    let template = `
      <div class='comments'>
      Comments
      <div class='container-fluid'>`;
    const user = JSON.parse(localStorage.parms).login;
  
    if (emailforChair.includes(user)) {
      for (const comment of comments) {
        const comment_date = new Date(comment.created_at);
        const date = comment_date.toLocaleDateString();
        const time = comment_date.toLocaleTimeString();
        template += `
          <div>
              <div class='row'>
                  <div class='col-8 p-0'>
                      <p class='text-primary small mb-0 align-left'>${comment.created_by.name}</p>
                  </div>
              `;
        if (document.getElementById("finalChairDecision") !== null) {
          if (
            document.getElementById("finalChairDecision").style.display ===
            "block"
          ) {
            template += `
                  <div class='col-4'>
                      <input type='checkbox' name='comments' id='${comment.id}' class='mb-0'>
                  </div>   
                  `;
          }
        }
        template += `    
              </div>
              <div class='row'>
                      <p class='my-0' id='comment${comment.id}'>${comment.message}</p>
              </div>
  
              <div class='row'>
                  <p class='small mb-0 font-weight-light'>${date} at ${time}</p>
              </div>
              <hr class='my-1'>
          </div>
          `;
      }
    } else {
      for (const comment of comments) {
        const comment_user = comment.created_by;
  
        if (
          comment_user.login === user ||
          emailforChair.includes(comment_user.login)
        ) {
          const comment_date = new Date(comment.created_at);
          const date = comment_date.toLocaleDateString();
          const time = comment_date.toLocaleTimeString();
          template += `
          <div>
              <div class='row'>
                  <div class='col-8 p-0'>
                      <p class='text-primary small mb-0 align-left'>${comment.created_by.name}</p>
                  </div>
              `;
          if (document.getElementById("finalChairDecision") !== null) {
            if (
              document.getElementById("finalChairDecision").style.display ===
              "block"
            ) {
              template += `
                  <div class='col-4'>
                      <input type='checkbox' name='comments' id='${comment.id}' class='mb-0'>
                  </div>   
                  `;
            }
          }
          template += `    
              </div>
              <div class='row'>
                      <p class='my-0' id='comment${comment.id}'>${comment.message}</p>
              </div>
  
              <div class='row'>
                  <p class='small mb-0 font-weight-light'>${date} at ${time}</p>
              </div>
              <hr class='my-1'>
          </div>
          `;
        }
      }
    }
    template += "</div>";
    if (comments.length >= 0 && document.getElementById("finalChairDecision")) {
      if (
        document.getElementById("finalChairDecision").style.display === "block"
      ) {
        template += `
          <input type='button' class='btn-secondary' value='Copy'  id='copyBtn' onclick="
          const comments = Array.from(document.getElementsByName('comments'));
    
       let copiedComments = [];
       for(const comment of comments){
        
  
           if (comment.checked){
               let commentText = document.getElementById('comment' + comment.id).innerText;
               if(commentText.includes('Rating:')){
                  copiedComments.push(commentText.split(':')[2]);
               }
              else {
                  copiedComments.push(commentText);
              }
           }
       }
      
       navigator.clipboard.writeText(copiedComments.join('\\n'));
          "/>
          <div class='text-muted small'>Select comments to copy to clipboard. Paste comments in text box below.</div>
          `;
      }
    }
    commentSection.innerHTML = template;
  
    return;
  }
  