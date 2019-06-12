export const checkAccessTokenValidity = async access_token => {
    const response = (await fetch('https://api.box.com/2.0/folders/0/items',{
        method:'GET',
        headers:{
            Authorization:"Bearer "+access_token
        }
    }))
    if(response.statusText=="Unauthorized"){
        delete localStorage.parms
        return false;
    }else{
        return true;
    }
}

