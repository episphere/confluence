import { config } from './config.js'
import { refreshToken } from './shared.js';

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
    document.location.href=`https://account.box.com/api/oauth2/authorize?response_type=code&client_id=${config.iniObs.client_id}&redirect_uri=https://observablehq.com/@episphere/confluence&state=${config.iniObs.stateIni}`
}

export const loginAppDev = () => {
    document.location.href=`https://account.box.com/api/oauth2/authorize?response_type=code&client_id=${config.iniAppDev.client_id}&redirect_uri=${location.origin+location.pathname}?state=${config.iniAppDev.stateIni}`
}

export const loginAppProd = () => {
    document.location.href=`https://account.box.com/api/oauth2/authorize?response_type=code&client_id=${config.iniAppProd.client_id}&redirect_uri=https://episphere.github.io/confluence&state=${config.iniAppProd.stateIni}`
}

export const logOut = async () => {
    if(!localStorage.parms) return;
    const access_token = JSON.parse(localStorage.parms).access_token;
    let clt={}
    if(location.origin.indexOf('localhost') !== -1){
        clt = config.iniAppDev;
    }else if(location.origin.indexOf('episphere') !== -1){
        clt = config.iniAppProd
    }else if(location.origin.indexOf('observablehq') !== -1){
        clt = config.iniObs
    }

    const response = await fetch(`https://api.box.com/oauth2/revoke`, {
        method:'POST',
        body: `token=${access_token}&client_id=${clt.client_id}&client_secret=${clt.server_id}`
    });
    delete localStorage.parms;
    location.reload();
}
