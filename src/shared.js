import { config } from "./config.js";
import { txt2dt } from "./visulization.js";
import { variables } from "./variables.js";

export const getFolderItems = async function(id){
    const access_token = JSON.parse(localStorage.parms).access_token;
    let r = (await fetch('https://api.box.com/2.0/folders/'+id+'/items',{
        method:'GET',
        headers:{
            Authorization:"Bearer "+access_token
        }
    }))
    if(r.statusText=="Unauthorized"){
        sessionExpired();
    }else{
        return r.json()
    }
}

export const getFile = async function(id){
    const access_token = JSON.parse(localStorage.parms).access_token;
    let r = (await fetch(`https://api.box.com/2.0/files/${id}/content`,{
        method:'GET',
        headers:{
            Authorization:"Bearer "+access_token
        }
    }))
    if(r.statusText=="Unauthorized"){
        sessionExpired();
    }else{
        return r.text()
    }
};

export const getFileInfo = async function(id){
    const access_token = JSON.parse(localStorage.parms).access_token;
    let r = (await fetch('https://api.box.com/2.0/files/'+id,{
        method:'GET',
        headers:{
            Authorization:"Bearer "+access_token
        }
    }))
    if(r.statusText=="Unauthorized"){
        sessionExpired();
    }else{
        return r.json()
    }
}

export const storeAccessToken = async function(){
    let parms = searchParms()
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
        
        let data = `grant_type=authorization_code&code=${parms.code}&client_id=${clt.client_id}&client_secret=${clt.server_id}`;
        let xhr = new XMLHttpRequest();
        document.getElementById('confluenceDiv').innerHTML = '';
        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                localStorage.parms=this.responseText;
                location.search = '';
            }
        });
        xhr.open("POST", "https://api.box.com/oauth2/token");
        xhr.setRequestHeader("cache-control", "no-cache");
        xhr.setRequestHeader("credentials", "same-origin");
        xhr.send(data);
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

const searchParms=function(){
    let parms={}
    if(location.search.length>3){
        location.search.slice(1).split('&').forEach(function(pp){
            pp=pp.split('=')
            parms[pp[0]]=pp[1]
        })
    }
    return parms
};

export const downloadFileTxt = async (fileId, fileName) => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    let fileData = await getFile(fileId, access_token);
    var element = document.createElement('a');
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
        return response.json();
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
        contentType: false,
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
                            fileEntries[newFolderId].cases = 0;
                            fileEntries[newFolderId].controls = 0;
                            if(newFolderType === 'file'){
                                const access_token = JSON.parse(localStorage.parms).access_token;
                                let txt = await getFile(newFolderId, access_token);
                                let dt = txt2dt(txt);

                                if(dt.tab && dt.tab.status){
                                    const numberOfCases = dt.tab.status.filter(value => value === "1").length;
                                    const numberOfControls = dt.tab.status.filter(value => value === "0").length;
                                    fileEntries[newFolderId].cases = numberOfCases;
                                    fileEntries[newFolderId].controls = numberOfControls;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    localStorage.data_summary = JSON.stringify(data_summary);
}

export const removeActiveClass = (className) => {
    let fileIconElement = document.getElementsByClassName(className);
    Array.from(fileIconElement).forEach(elm => {
        elm.classList.remove('navbar-active');
    });
}

export const convertTextToJson = async (fileIds, status) => {
    let allObjs = [];
    for(const id of fileIds){
        const intId = parseInt(id);
        let rawData = await getFile(intId);
        let rows = rawData.split(/\n/g).map(tx=>tx.split(/\t/g))
        if((rawData.split(/\n+/).slice(-1).length==1) && (rawData.slice(-1)[0].length)){
            rows.pop()
        };
        const headings = rows[0];
        rows.splice(0, 1);
        var obj = rows.map(function (el) {
            var obj = {};
            for (var i = 0; i < el.length; i++) {
              obj[headings[i].trim()] = el[i];
            }
            return obj;
        });
        allObjs = allObjs.concat(obj);
    };
    let jsonData = {};
    
    allObjs.forEach(data => {
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
    });
    return Object.values(jsonData);
}

const sessionExpired = () => {
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

export const disableEnableCheckBox = (value) => {
    const studiesCheckBox = document.getElementsByName('studiesCheckBox');
    Array.from(studiesCheckBox).forEach(element => {
        element.disabled = value;
    });

    const dataTypeCheckBox = document.getElementsByName('dataTypeCheckBox');
    Array.from(dataTypeCheckBox).forEach(element => {
        element.disabled = value;
    });

    document.getElementById('studySelectAll').disabled = value;
    document.getElementById('dataTypeSelectAll').disabled = value;
}