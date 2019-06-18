import { config } from "./config.js";

export const getFolderItems = async function(id, access_token){
    let r = (await fetch('https://api.box.com/2.0/folders/'+id+'/items',{
        method:'GET',
        headers:{
            Authorization:"Bearer "+access_token
        }
    }))
    if(r.statusText=="Unauthorized"){
        localStorage.clear();
        alert('session expired, reloading')
        location.reload();
    }else{
        return r.json()
    }
}

export const getFile = async function(id, access_token){
    let r = (await fetch(`https://api.box.com/2.0/files/${id}/content`,{
        method:'GET',
        headers:{
            Authorization:"Bearer "+access_token
        }
    }))
    if(r.statusText=="Unauthorized"){
        localStorage.clear();
        alert('session expired, reloading')
        location.reload();
    }else{
        return r.text()
    }
};

export const getFileInfo = async function(id, access_token){
    let r = (await fetch('https://api.box.com/2.0/files/'+id,{
        method:'GET',
        headers:{
            Authorization:"Bearer "+access_token
        }
    }))
    if(r.statusText=="Unauthorized"){
        localStorage.clear();
        alert('session expired, reloading')
        location.reload();
    }else{
        return r.json()
    }
}

export const storeAccessToken = async function(){
    let parms=searchParms()
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
        xhr.addEventListener("readystatechange", function () {
          if (this.readyState === 4) {
            localStorage.parms=this.responseText
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
    })
    if(response.statusText=="Unauthorized"){
        localStorage.clear();
        alert('session expired, reloading')
        location.reload();
    }
    else if(response.status === 201){
        return response.json();
    }
}