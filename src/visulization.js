import { getFile, downloadFileTxt, convertTextToJson } from './shared.js';
import { parametersDropDownTemplate, dataExplorationTable } from './components/elements.js';
let oldParameter = '';

const unique=function(arr){
    let u={}
    arr.forEach(v=>{
        if(v=='888'||v=='777'||v==""){v=undefined} // 888 undefined code
        if(!u[v]){u[v]=0}
        u[v]++
    })
    return u
}

export const txt2dt=function(txt){
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
};

export const getData = (studyEntries, studyIds, values, status) => {
    let allIds = {};
    studyIds.forEach(id => {
        const intId = parseInt(id);
        allIds[intId] = {};
        allIds[intId].fileData = {};
        const dataEntries = studyEntries[intId].dataEntries;
        let selectedDataIds = [];
        values.forEach(value => {
            const selectedDataEntries = Object.keys(dataEntries).filter(key => dataEntries[key].name === value);
            if(selectedDataEntries.length > 0) selectedDataIds.push(parseInt(selectedDataEntries[0]));
        });

        selectedDataIds.forEach(dataId => {
            let fileEntries = dataEntries[dataId].fileEntries;
            allIds[intId].fileData = {...allIds[intId].fileData, ...fileEntries};
        });
    });
    getFileContent(allIds, studyEntries, status);
}

const getFileContent = async (allIds, studyEntries, status) => {
    let finalData = {};
    for(const studyId in allIds){
        finalData[studyId] = {};
        finalData[studyId].allData = {};
        let fileData = allIds[studyId].fileData;
        let fileIds = Object.keys(fileData);
        for(const id of fileIds){
            const intId = parseInt(id);
            let rawData = await getFile(intId);
            let jsonData = convertTextToJson(rawData, status);
            finalData[studyId].allData = {...finalData[studyId].allData, ...jsonData};
            let dataSummaryParameter = document.getElementById('dataSummaryParameter');
            dataSummaryParameter.innerHTML = parametersDropDownTemplate(finalData);
            const parametersDropDown = document.getElementById('parametersDropDown');
            parametersDropDown.addEventListener('change', () => {
                generatCharts(finalData, studyEntries, parametersDropDown.value);
            });
        };
    };
    generatCharts(finalData, studyEntries);
};

const generatCharts = (data, studyEntries, parameter) => {
    document.getElementById('dataSummaryVizBarChart').innerHTML = '';
    // document.getElementById('dataSummaryVizLineChart').innerHTML = '';
    oldParameter = parameter ? parameter : oldParameter;
    let parm = parameter ? parameter : oldParameter !== '' ? oldParameter : 'ageInt';
    document.getElementById('parametersDropDown').value = parm;
    let allTraces1 = [];
    // let allTraces2 = [];
    for(const studyId in data){
        let trace = {
            type: 'bar',
            x:Object.keys(data[studyId].allData[parm]),
            y:Object.keys(data[studyId].allData[parm]).map(k=>data[studyId].allData[parm][k]),
            name: studyEntries[studyId].name
        }
        if(trace.x.length>1){
            if(trace.x.slice(-1)[0]=="undefined" || trace.x.slice(-1)[0]==""){
                trace.x.pop()
                trace.y.pop()
            }
        }
        allTraces1.push(trace);

        // let trace2 = {
        //     mode:'lines+markers',
        //     x:Object.keys(data[studyId].allData[parm]),
        //     y:Object.keys(data[studyId].allData[parm]).map(k=>data[studyId].allData[parm][k]),
        //     name: studyEntries[studyId].name
        // }
        // if(trace2.x.length>1){
        //     if(trace.x.slice(-1)[0]=="undefined" || trace.x.slice(-1)[0]==""){
        //         trace.x.pop()
        //         trace.y.pop()
        //     }
        // }
        // allTraces2.push(trace2);
    };

    var layout = {
        xaxis: {title:`${parm}`},
        yaxis: {title:`Count`},
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };
    Plotly.newPlot('dataSummaryVizBarChart', allTraces1, layout, {responsive: true, displayModeBar: false});
    // Plotly.newPlot('dataSummaryVizLineChart', allTraces2, layout, {responsive: true, displayModeBar: false});
    document.getElementById('loadingAnimation').hidden = true;
    // document.getElementById('toggleCharts').hidden = false;
};

export const exploreData = async (fileId, fileName) => {
    let dataExplorationParameter = document.getElementById('dataExplorationParameter');
    dataExplorationParameter.innerHTML = `${fileName} <a title="Download File" id="dataExplorationFileDownload" data-file-id="${fileId}" data-file-name="${fileName}" href="#"><i class="fas fa-file-download"></i></a>`;
    document.getElementById('dataExplorationFileDownload').addEventListener('click', () => {
        downloadFileTxt(fileId, fileName);
    });
    let fileData = await getFile(fileId);

    let dt=fileData.split(/\n/g).map(tx=>tx.split(/\t/g));
    if((fileData.split(/\n+/).slice(-1).length==1)&&(fileData.slice(-1)[0].length)){
        dt.pop()
    };
    
    $('#pagination-container').pagination({
        dataSource: dt,
        pageSize: 20,
        callback: function(data, pagination) {
            document.getElementById('dataExplorationTable').innerHTML = dataExplorationTable(data, dt);
        }
    });
    let pageSizeSelector = document.getElementById('pageSizeSelector');
    pageSizeSelector.hidden = false;
    pageSizeSelector.addEventListener('change', () => {
        updatePageSize(pageSizeSelector.value, dt);
    });
}

const updatePageSize = (pageSize, dt) => {
    document.getElementById('pagination-container').innerHTML = '';
    document.getElementById('dataExplorationTable').innerHTML = '';
    $('#pagination-container').pagination({
        dataSource: dt,
        pageSize: pageSize,
        callback: function(data, pagination) {
            document.getElementById('dataExplorationTable').innerHTML = dataExplorationTable(data, dt);
        }
    });
}