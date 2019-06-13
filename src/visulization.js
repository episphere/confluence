import { getFolderItems, getFile, getFileInfo } from './shared.js';

export const generateViz = async function(access_token){
    let confluenceDiv=document.getElementById('confluenceDiv');
    confluenceDiv.innerHTML=' loadind ...'
    await getFolderItems(68819242325, access_token).then(x=>{ // BCAC root is 68819242325
        const studyFolderEntries = x.entries;
        confluenceDiv.innerHTML=''
        // show what is hidden
        summaryHead.hidden=false
        confluenceStatistics.hidden=false
        summaryDiv.hidden=false
        individualReportsHeader.hidden=false
        // find subfolders:
        let directory={};
        studyFolderEntries.forEach(async function(fld,i){ // Loop through Study folder
            const studyFolderName = fld.name;
            const studyFolderId = fld.id;

            directory[studyFolderName]={id:studyFolderId}
            let div = document.createElement('div')
            div.innerHTML=` loading ${studyFolderName} ...`
            confluenceDiv.appendChild(div)
            directory[studyFolderName].div=div
            

            await getFolderItems(studyFolderId, access_token).then(x=>{
                const dataFolderEntries = x.entries;
                if (dataFolderEntries.length === 0) return; // No data exists
                directory[studyFolderName].dir={}
                div.innerHTML=`<h3>${i+1}. ${studyFolderName} <span>[-]</span></h3>`;

                dataFolderEntries.forEach(async function(dtFld,j){ // Loop through data folder
                    const dataFolderName = dtFld.name;
                    const dataFolderId = dtFld.id;
                    
                    let divDt = document.createElement('div')
                    divDt.innerHTML=` loading ${dataFolderName} ...`
                    div.appendChild(divDt)
                    directory[studyFolderName].dir[dataFolderName]={
                        id:dataFolderId,
                        div:divDt
                    }
                    //console.log(directory)
                    await getFolderItems(dataFolderId, access_token).then(x=>{
                        const fileEntries = x.entries;
                        divDt.innerHTML=`<h4>${i+1}.${j+1}. ${dataFolderName} <span>[-]</span></h4>`
                        let divDtFiles = document.createElement('div')
                        divDt.appendChild(divDtFiles)
                        
                        directory[studyFolderName].dir[dataFolderName].files={}

                        fileEntries.forEach(fl=>{ // Loop through file entries
                            if(fl.type !== "file") return;
                            if(fl.name.indexOf(".txt") === -1) return;
                            let li = document.createElement('li')
                            divDtFiles.appendChild(li)
                            li.innerHTML=`${fl.name} `
                            let btDisplay = document.createElement('button')
                            btDisplay.textContent="display"
                            btDisplay.className="btDisplay"
                            li.appendChild(btDisplay)
                            let btDelete = document.createElement('button')
                            btDelete.hidden=true
                            btDelete.textContent="delete plot"
                            li.appendChild(btDelete)
                            let divFile = document.createElement('div')
                            li.appendChild(divFile)
                            fl.div=divFile
                            fl.study=dataFolderName
                            fl.group=studyFolderName
                            directory[studyFolderName].dir[dataFolderName].files[fl.name]=fl
                            btDisplay.onclick=function(){
                                displayFile(fl, access_token)
                                btDelete.hidden=false
                                btDisplay.hidden=true
                            };
                            btDelete.onclick=function(){
                                divFile.innerHTML=''
                                btDelete.hidden=true
                                btDisplay.hidden=false
                            };
                            if(document.querySelectorAll('.btDisplay').length==16){
                                summary(directory, access_token)
                            };
                        }); 
                    });
                });
            });
        });
    });
};

const summary=async function(directory, access_token){ // summary plots 
    let dt={}
    
    let h = `<table id="statusStudyTable"><tr>
                <td id="summaryStatus" style="vertical-align:top">
                <h4>Study:</h4>
                <div id="study"></div>
                </td>
                <td id="summaryReports" style="vertical-align:top"><p>loading status ...</p></td>
            </hr>
            <table>`
    summaryDiv.innerHTML=h 

    Object.keys(directory).sort().forEach(async k=>{
        if(directory[k].dir === undefined || directory[k].dir["Core Data"] === undefined) return;
        let txt = await getFile(directory[k].dir["Core Data"].files[Object.keys(directory[k].dir["Core Data"].files)[0]].id, access_token)
        dt[k] = txt2dt(txt)
        summaryReports.innerHTML=`<p>loading ${k} Core Data ...</p>`
        caseCount.textContent=parseInt(caseCount.textContent)+dt[k].tab.study.length
        // add study to left side menu
        let divK = document.createElement('div')
        divK.id=`div${k}`
        divK.innerHTML=`<input type="radio" checked=true> ${k}`
        document.getElementById('study').appendChild(divK)
        let kk = Object.keys(dt)
        partnerCount.textContent=kk.length
        if(kk.length==4){
            
            summaryReports.innerHTML='<span style="color:red">... ploting under development ...</span>'
            
            let coreData=[]
            Object.keys(dt).forEach(k=>{
                kk=Object.keys(dt[k].tab)
                dt[k].tab.study.map((s,i)=>{
                    let r={} // row as an object
                    kk.forEach(ki=>{
                        r[ki]=dt[k].tab[ki][i]
                    })
                    r.ageInt=parseInt(r.ageInt)
                    coreData.push(r)
                })

            })
            let h =`<div id="dcPlot">
                        <table>
                            <tr>
                                <td>
                                    <h3>Status</h3>
                                    <div id="pieStatus"></div>
                                    <h3>Study</h3>
                                    <div id="rowStudy"></div>
                                </td>
                                <td>
                                    <h3>Age</h3>
                                    <div id="barAge"></div>
                                </td>
                            </tr>
                        </table>
                    </div>`;
            
            summaryDiv.innerHTML=h
            // DC starts here
            let dd = coreData
            let valUnique=function(k,v){
                var u={}
                dd.forEach(d=>{
                    u[d[k]]=v
                })
                return u
            } 

            dc.config.defaultColors(d3.schemeCategory10)
            let cf=crossfilter(dd)

            // Status Pie Chard
            let C_pieStatus = dc.pieChart("#pieStatus");
            let status = cf.dimension(function(d){return d.status});

            let status_reduce=valUnique('status',0)
            let count_study=valUnique('study',0)
            let G_status = status.group().reduce(
                // reduce in
                function(p,v){
                    count_study[v.study]+=1
                    status_reduce[v.status]+=1
                    return status_reduce[v.status]
                },
                //reduce out
                function(p,v){
                    count_study[v.study]-=1
                    status_reduce[v.status]-=1
                    return status_reduce[v.status]
                },
                // ini
                function(p){return 0}
            )


            //let G_status = status.group().reduceCount()

            C_pieStatus
                .width(350)
                .height(200)
                .radius(200)
                .innerRadius(60)
                .dimension(status)
                .group(G_status)
                .label(function(c){
                    return `status=${c.key} (${c.value})`
                 })
                .colors(d3.scaleOrdinal().domain(['0','1','2','3','4']).range(['#009688','orange','green','red','gray']))
                .colorAccessor(function(c,i){
                    if(count_status[c.key]>0){
                        return i
                    }else{
                        return 4
                    }
                })

            // Study braChard
            let C_rowStudy = dc.rowChart("#rowStudy");
            let study = cf.dimension(function(d){return d.study});
            //let G_study = study.group().reduceCount()

            let study_reduce=valUnique('study',0)
            let count_status=valUnique('status',0)
            let G_study = study.group().reduce(
                // reduce in
                function(p,v){
                    count_status[v.status]+=1
                    study_reduce[v.study]+=1
                    return study_reduce[v.study]
                },
                //reduce out
                function(p,v){
                    count_status[v.status]-=1
                    study_reduce[v.study]-=1
                    return study_reduce[v.study]
                },
                // ini
                function(p){return 0}
            )

            C_rowStudy
             .width(450)
             .height(200)
             .dimension(study)
             .group(G_study)
             .elasticX(true)
             .colors(d3.scaleLinear().domain([-4,3,4]).range(['blue','cyan','gray']))
             .colorAccessor(function(c,i){
                 //console.log(i)
                 if(count_study[c.key]>0){
                     return i
                 }else{
                     return 4
                 }
                 //debugger
             })
             .ordering(c=>-dt[c.key].tab.study.length)
             .label(function(c){
                    return `${c.key} (${c.value})`
                 })


             //.yAxisLabel('count')
             //

            let C_barAge = dc.barChart("#barAge");
            let age = cf.dimension(function(d){return d.ageInt});
            let G_age = age.group().reduceCount()

            C_barAge
             .width(500)
             .height(500)
             .dimension(age)
             .group(G_age)
             .x(d3.scaleLinear().domain([20,100]))
             .elasticY(true)
             .xAxisLabel('age')
             .yAxisLabel(function(){
                 return `count (${C_barAge.data()[0].domainValues.map(d=>d.y).reduce((a,b)=>a+b)})`
             })

            dc.renderAll();
            C_pieStatus.render()

            let CC={
                C_pieStatus:C_pieStatus,
                C_rowStudy:C_rowStudy,
                C_barAge:C_barAge
            }
        }
    })
}

const unique=function(arr){
    let u={}
    arr.forEach(v=>{
        if(v=='888'||v=='777'||v==""){v=undefined} // 888 undefined code
        if(!u[v]){u[v]=0}
        u[v]++
    })
    return u
}

const txt2dt=function(txt){
    let dt=txt.split(/\n/g).map(tx=>tx.split(/\t/g))
    // trailing blank
    if((txt.split(/\n+/).slice(-1).length==1)&&(txt.slice(-1)[0].length)){
        dt.pop()
    }
    let tab={}
    let hh=dt[0].forEach((h,j)=>{ // headers
        tab[h]=[]
        dt.slice(1).forEach((vv,i)=>{
            tab[h][i]=vv[j]
        })
    });

    let uni={}
    Object.keys(tab).forEach(k=>{
        uni[k]=unique(tab[k])
    })
    return {
        tab:tab,
        uni:uni
    }
}

const displayFile=async function(fl, access_token){
    fl.div.innerHTML='<span style="color:orange;font-size:small">processing ...</span>'
    let txt = await getFile(fl.id, access_token)
    let dt=txt.split(/\n/g).map(tx=>tx.split(/\t/g))
    // trailing blank
    if((txt.split(/\n+/).slice(-1).length==1)&&(txt.slice(-1)[0].length)){
        dt.pop()
    }
    let tab={}
    let hh=dt[0].forEach((h,j)=>{ // headers
        tab[h]=[]
        dt.slice(1).forEach((vv,i)=>{
            tab[h][i]=vv[j]
        })
    })
    fl.tab=tab
    fl.uni={}
    Object.keys(tab).forEach(k=>{
        fl.uni[k]=unique(tab[k])
    })
    fl.info = await getFileInfo(fl.id, access_token)
    fl.div.innerHTML='<span style="color:green;font-size:small">processing ... done</span>'
    plotFile(fl)
}

const plotFile=function(fl){
    let h=`<p style="font-size:x-small;color:gray">Using data from file #${fl.id}, version #${fl.file_version.id}, originally created by ${fl.info.created_by.name} at ${fl.info.created_at}, last modified by ${fl.info.modified_by.name} at ${fl.info.modified_at} (${fl.info.sequence_id} modifications).<p>`
    h +='<p><select id="distParm"></select></p>'
    h +='<div id="plotlyDiv"></div>'
    fl.div.innerHTML=h
    let sel1 = fl.div.querySelector('#distParm')
    Object.keys(fl.uni).sort().forEach(k=>{
        let op = document.createElement('option')
        op.value=op.textContent=k
        sel1.appendChild(op)  
    })
    sel1.onchange=function(){
        plotlyFile(fl,sel1.value,fl.div.querySelector('#plotlyDiv'))
    }
    plotlyFile(fl,sel1.value,fl.div.querySelector('#plotlyDiv'))
}

const plotlyFile=function(fl,parm,div){
    var trace = {
        type:'bar',
        x:Object.keys(fl.uni[parm]),
        y:Object.keys(fl.uni[parm]).map(k=>fl.uni[parm][k])
    }
    var unCount=` (${trace.y.reduce((a,b)=>a+b)} total)`
    if(trace.x.indexOf('undefined')>-1){
        let total = trace.y.reduce((a,b)=>a+b)
        let ud = trace.y[trace.x.indexOf('undefined')]
        unCount = `(${total-ud}) (${ud} undefined)`
    }
    if(trace.x.length>1){
        if(trace.x.slice(-1)[0]=="undefined"||trace.x.slice(-1)[0]==""){
            trace.x.pop()
            trace.y.pop()
        }
    }
    //debugger
    var layout = {
        title: `${fl.group}/${fl.study}`,
        xaxis: {title:`${parm}`},
        yaxis: {title:`count ${unCount}`}
    };
    Plotly.newPlot(div, [trace], layout, {responsive: true});
}