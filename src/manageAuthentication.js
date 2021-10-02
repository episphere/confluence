import { config } from './config.js'
import { applicationURLs, refreshToken } from './shared.js';

export const checkAccessTokenValidity = async () => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    try{
        const response = await fetch('https://api.box.com/2.0/users/me',{
           method:'GET',
            headers:{
                Authorization:"Bearer "+access_token
            }
        });
        if(response.status === 401){
            if((await refreshToken()) === true) return await checkAccessTokenValidity();
        } if(response.status === 200){
            return response.json();
        }
        else{
            return null;
        }
    }
    catch(error){
        if((await refreshToken()) === true) return await checkAccessTokenValidity();
    }
}

export const loginObs = () => {
    location.href=`https://account.box.com/api/oauth2/authorize?response_type=code&client_id=${config.iniAppStage.client_id}&redirect_uri=${applicationURLs.stage}&state=${config.iniAppStage.stateIni}`
}

export const loginAppDev = () => {
    location.href=`https://account.box.com/api/oauth2/authorize?response_type=code&client_id=${config.iniAppLocal.client_id}&redirect_uri=${location.origin+location.pathname}?state=${config.iniAppLocal.stateIni}`
}

export const loginAppProd = () => {
    location.href=`https://account.box.com/api/oauth2/authorize?response_type=code&client_id=${config.iniAppDev.client_id}&redirect_uri=${applicationURLs.dev}&state=${config.iniAppDev.stateIni}`
}

export const logOut = async () => {
    if(!localStorage.parms) return;
    const access_token = JSON.parse(localStorage.parms).access_token;
    let clt={}
    if(location.origin.indexOf('localhost') !== -1){
        clt = config.iniAppLocal;
    }else if(location.origin.indexOf('episphere') !== -1){
        clt = config.iniAppDev
    }else if(location.origin.indexOf('confluence-stage.cancer.gov') !== -1){
        clt = config.iniAppStage
    }

    const response = await fetch(`https://api.box.com/oauth2/revoke`, {
        method: 'POST',
        mode: 'no-cors',
        body: `token=${access_token}&client_id=${clt.client_id}&client_secret=${clt.server_id}`
    });
    delete localStorage.parms;
    location.reload();
}
