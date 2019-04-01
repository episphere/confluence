console.log('confluence.js loaded')

confluence=function(){
    console.log(`ini at ${Date()}`)
    document.getElementById('loginBoxObs').onclick=confluence.loginObs
    document.getElementById('loginBoxAppDev').onclick=confluence.loginAppDev
    document.getElementById('loginBoxAppProd').onclick=confluence.loginAppProd
    confluence.div=document.getElementById('confluenceDiv')
    if(confluence.div){
        if(location.origin.match('localhost')){loginBoxAppDev.parentElement.hidden=false}
        if(location.origin.match('episphere')){loginBoxAppProd.parentElement.hidden=false}
        confluence.UI()
    }
    
}

confluence.iniObs={
    client_id:'rq2ab1uuvrzp86oa0yehgjibqf7arxy5',
    server_id:'NItekKKQEqQBgRsU0qnEBVY3zP0nvieh',
    stateIni:Math.random().toString().slice(2)
}

confluence.iniAppDev={
    client_id:'52zad6jrv5v52mn1hfy1vsjtr9jn5o1w',
    server_id:'2rHTqzJumz8s9bAjmKMV83WHX1ooN4kT',
    stateIni:Math.random().toString().slice(2)
}

confluence.iniAppProd={
    client_id:'1n44fu5yu1l547f2n2fgcw7vhps7kvuw',
    server_id:'2ZYzmHXGyzBcjZ9d1Ttsc1d258LiGGVd',
    stateIni:Math.random().toString().slice(2)
}

confluence.loginObs=function(){
    document.location.href=`https://account.box.com/api/oauth2/authorize?response_type=code&client_id=${confluence.iniObs.client_id}&redirect_uri=https://observablehq.com/@episphere/confluence&state=${confluence.iniObs.stateIni}`
    //debugger
}

confluence.loginAppDev=function(){
    document.location.href=`https://account.box.com/api/oauth2/authorize?response_type=code&client_id=${confluence.iniAppDev.client_id}&redirect_uri=http://localhost:8000/confluence&state=${confluence.iniAppDev.stateIni}`
    //debugger
}

confluence.loginAppProd=function(){
    document.location.href=`https://account.box.com/api/oauth2/authorize?response_type=code&client_id=${confluence.iniAppProd.client_id}&redirect_uri=https://episphere.github.io/confluence&state=${confluence.iniAppProd.stateIni}`
    //debugger
}


confluence.UI=function(){
    let parms=confluence.searchParms()
    if(parms.code){
        //exchange code for authorization token
        let clt={}
        if(location.origin.match('localhost')){
            clt = confluence.iniAppDev
        }else if(location.origin.match('episphere')){
            clt = confluence.iniAppProd
        }else if(location.origin.match('observablehq')){
            clt = confluence.iniObs
        }
        confluence.client=clt
        var data = `grant_type=authorization_code&code=${parms.code}&client_id=${clt.client_id}&client_secret=${clt.server_id}`;
        var xhr = new XMLHttpRequest();
        xhr.addEventListener("readystatechange", function () {
          if (this.readyState === 4) {
            console.log(this.responseText);
            localStorage.parms=this.responseText
            location.search='' // clear url, reload the page
          }
        });
        xhr.open("POST", "https://api.box.com/oauth2/token");
        xhr.setRequestHeader("cache-control", "no-cache");
        xhr.setRequestHeader("credentials", "same-origin");
        xhr.send(data);
    }else{
        if(localStorage.parms){
            confluence.parms=JSON.parse(localStorage.parms)
            if(confluence.parms.access_token){
                confluence.UIdo() // <---- ready to go with an authenticated token
            }else{
                alert('access token not found, please contact system administrator')
            }

        }else{
            // there is nothing to do yet
            console.log('not logged in yet')
        }
        
        //debugger

    }

}

confluence.UIdo=function(){
    confluence.div.innerHTML=' loadind ...'
    confluence.getFolderInfo(68819242325).then(x=>{ // BCAC root is 68819242325
        confluence.div.innerHTML=''
        // find subfolders:
        confluence.dir={};
        ['USRT','PLCO','PBCS','AHS'].forEach(function(fld,i){
            let y = x.item_collection.entries.filter(function(xi){
                return (xi.name==fld)
            })[0]
            confluence.dir[fld]={id:y.id}
            let div = document.createElement('div')
            div.innerHTML=` loading ${fld} ...`
            confluence.div.appendChild(div)
            confluence.dir[fld].div=div
            // find data folders
            confluence.getFolderInfo(confluence.dir[fld].id).then(x=>{
                confluence.dir[fld].dir={}
                div.innerHTML=`<h3>${i+1}. ${fld}</h3>`;
                ['Survival and Treatment Data',
                 'Risk Factor Data',
                 'Pathology Data',
                 'Core Data'].forEach(function(dtFld,j){
                     let y = x.item_collection.entries.filter(xi=>(xi.name==dtFld))[0]
                     let divDt = document.createElement('div')
                     divDt.innerHTML=` loading ${dtFld} ...`
                     div.appendChild(divDt)
                     confluence.dir[fld].dir[dtFld]={
                         id:y.id,
                         div:divDt
                     }
                     confluence.getFolderInfo(confluence.dir[fld].dir[dtFld].id).then(x=>{
                         divDt.innerHTML=`<h4>${i+1}.${j+1}. ${dtFld}`
                         let divDtFiles = document.createElement('div')
                         divDt.appendChild(divDtFiles)
                         let txtFiles=x.item_collection.entries.filter(xi=>(x.item_collection.entries[0].name.match('.txt')))
                         confluence.dir[fld].dir[dtFld].files={}
                         txtFiles.forEach(fl=>{
                             let li = document.createElement('li')
                             divDtFiles.appendChild(li)
                             li.innerHTML=`<span style="font-size:small">${fl.name} </span>`
                             let bt = document.createElement('button')
                             bt.textContent="display"
                             li.appendChild(bt)
                             let divFile = document.createElement('div')
                             li.appendChild(divFile)
                             fl.div=divFile
                             confluence.dir[fld].dir[dtFld].files[fl.name]=fl
                             bt.onclick=function(){
                                 confluence.plotFile(fl)
                             }
                         })
                         4
                     })
                 })
            })

        })
        //debugger
    })

    //debugger
}

confluence.plotFile=function(fl){
    4
}

confluence.searchParms=function(){
    //localStorage.parms='{}' // clear cached parms
    let parms={}
    if(location.search.length>3){
        location.search.slice(1).split('&').forEach(function(pp){
            pp=pp.split('=')
            parms[pp[0]]=pp[1]
        })
    }
    return parms
}

/*confluence.getFileInfo=function(id,fun){
    fun=fun||console.log
    fetch('https://api.box.com/2.0/files/'+id,{
        method:'GET',
        headers:{
            Authorization:"Bearer "+confluence.parms.access_token
        }
    }).then(x=>x.json().then(fun))
}
*/


confluence.getFileInfo=async function(id){
    return (await fetch('https://api.box.com/2.0/files/'+id,{
        method:'GET',
        headers:{
            Authorization:"Bearer "+confluence.parms.access_token
        }
    })).json()
}
confluence.getFile=async function(id){
    return (await fetch(`https://api.box.com/2.0/files/${id}/content`,{
        method:'GET',
        headers:{
            Authorization:"Bearer "+confluence.parms.access_token
        }
    })).text()
}

confluence.getFolderInfo=async function(id){
    return (await fetch('https://api.box.com/2.0/folders/'+id,{
        method:'GET',
        headers:{
            Authorization:"Bearer "+confluence.parms.access_token
        }
    })).json()
}

// https://account.box.com/api/oauth2/authorize?response_type=code&client_id=${confluence.ini.client_id}&redirect_uri=${location.origin}${location.pathname}&state=${cohort.parms.stateIni}`


window.onload=confluence
