console.log('confluence.js loaded')

confluence=function(){
    console.log(`ini at ${Date()}`)
    document.getElementById('loginBox').onclick=confluence.login
}

confluence.ini={
    client_id:'1n44fu5yu1l547f2n2fgcw7vhps7kvuw',
    server_id:'2ZYzmHXGyzBcjZ9d1Ttsc1d258LiGGVd',
    stateIni:Math.random().toString().slice(2)
}

confluence.login=function(){
    document.location.href=`https://account.box.com/api/oauth2/authorize?response_type=code&client_id=${confluence.ini.client_id}&redirect_uri=https://observablehq.com/@episphere/confluence&state=${confluence.ini.stateIni}`
    //debugger
}


// https://account.box.com/api/oauth2/authorize?response_type=code&client_id=${confluence.ini.client_id}&redirect_uri=${location.origin}${location.pathname}&state=${cohort.parms.stateIni}`


window.onload=confluence