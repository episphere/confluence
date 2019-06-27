import { getFile, getFileInfo, downloadFileTxt } from './shared.js';
import { parametersDropDownTemplate, dataExplorationTable } from './components/elements.js';

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

export const getData = (studyEntries, studyIds, values) => {
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
    getFileContent(allIds, studyEntries);
}

const getFileContent = async (allIds, studyEntries) => {
    let finalData = {};
    for(const studyId in allIds){
        finalData[studyId] = {};
        finalData[studyId].allData = {};
        let fileData = allIds[studyId].fileData;
        let fileIds = Object.keys(fileData);
        for(const id of fileIds){
            const intId = parseInt(id);
            let rawData = await getFile(intId);
            let jsonData = txt2dt(rawData);
            finalData[studyId].allData = {...finalData[studyId].allData, ...jsonData.uni};
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
    document.getElementById('dataSummaryViz').innerHTML = '';
    let parm = parameter ? parameter : 'ageInt';
    let allTraces = [];
    for(const studyId in data){
        let trace = {
            // mode:'lines+markers',
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
        allTraces.push(trace);
    };

    var layout = {
        xaxis: {title:`${parm}`},
        yaxis: {title:`Count`},
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        barmode: 'group'
    };
    Plotly.newPlot('dataSummaryViz', allTraces, layout, {responsive: true, displayModeBar: false});
    document.getElementById('loadingAnimation').hidden = true;
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