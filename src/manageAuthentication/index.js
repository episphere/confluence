import { config } from '../config.js'
import { sessionExpired } from '../shared.js';

export const checkAccessTokenValidity = async () => {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch('https://api.box.com/2.0/folders/0/items',{
        method:'GET',
        headers:{
            Authorization:"Bearer "+access_token
        }
    });
    if(response.status === 401){
        sessionExpired();
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

export const logOut = () => {
    localStorage.clear();
    location.reload();
}
