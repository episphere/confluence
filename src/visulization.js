import { getFile, downloadFileTxt, convertTextToJson } from './shared.js';
import { parametersDropDownTemplate, dataExplorationTable } from './components/elements.js';
import { coreVariables } from './variables.js';
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
        const dataEntries = studyEntries[parseInt(id)].dataEntries;
        let selectedDataIds = [];
        values.forEach(value => {
            const selectedDataEntries = Object.keys(dataEntries).filter(key => dataEntries[key].name === value);
            if(selectedDataEntries.length > 0) selectedDataIds.push(parseInt(selectedDataEntries[0]));
        });

        selectedDataIds.forEach(dataId => {
            let fileEntries = dataEntries[dataId].fileEntries;
            allIds = {...allIds, ...fileEntries};
        });
    });
    getFileContent(allIds, status);
}

const getFileContent = async (allIds, status) => {
    let fileIds = Object.keys(allIds);
    let jsonData = await convertTextToJson(fileIds, status);
    let dataSummaryParameter = document.getElementById('dataSummaryParameter');
    dataSummaryParameter.innerHTML = parametersDropDownTemplate(jsonData);
    const parametersDropDown = document.getElementById('parametersDropDown');
    parametersDropDown.addEventListener('change', () => {
        generateDCChart(jsonData, parametersDropDown.value);
    });
    generateDCChart(jsonData);
};

const generateDCChart = (jsonData, selection) => {
    let cf = crossfilter(jsonData);
    const ageInt = 'ageInt';
    dc.config.defaultColors(d3.schemeCategory10);
    
    let pieChart = dc.pieChart("#dataSummaryVizPieChart");
    let status = cf.dimension(function(d){return d.status});

    let status_reduce = valUnique('status',0, jsonData)
    let G_status = status.group().reduce(
        // reduce in
        function(p,v){
            status_reduce[v.status]+=1
            return status_reduce[v.status]
        },
        //reduce out
        function(p,v){
            status_reduce[v.status]-=1
            return status_reduce[v.status]
        },
        // ini
        function(p){return 0}
    )
    pieChart.innerRadius(60)
        .dimension(status)
        .group(G_status)
        .label(function(c){
            return `${c.key} (${c.value})`
        });

        
    oldParameter = selection ? selection : oldParameter;
    let parameter = selection ? selection : oldParameter !== '' ? oldParameter : 'ethnicityClass';
    document.getElementById('parametersDropDown').value = parameter;
    let pieChart2 = dc.pieChart("#dataSummaryVizPieChart2");
    let data = cf.dimension(function(d){return d[parameter]});

    let data_reduce = valUnique(parameter, 0, jsonData)
    let G_status2 = data.group().reduce(
        function(p,v){
            data_reduce[v[parameter]] += 1
            return data_reduce[v[parameter]]
        },
        function(p,v){
            data_reduce[v[parameter]] -= 1
            return data_reduce[v[parameter]]
        },
        function(p){return 0}
    )
    pieChart2.innerRadius(80)
        .dimension(data)
        .group(G_status2)
        .label(function(c){
            return `${c.key} (${c.value})`
        });

    
    let barChart = dc.barChart('#dataSummaryVizBarChart');
    
    let age = cf.dimension(function(d) {return d.ageInt;});
    let ageCount = age.group().reduceCount();
    barChart.dimension(age)
        .group(ageCount)
        .x(d3.scaleLinear().domain([20,100]))
        .xAxisLabel('Age')
        .yAxisLabel('Count');

    dc.renderAll();
    
    document.getElementById('loadingAnimation').hidden = true;
}

const valUnique=function(k,v, jsonData){
    var u={}
    jsonData.forEach(d=>{
        if(d[k] === "") return;
        u[d[k]]=v
    })
    return u
} 

const generatCharts = (data, parameter) => {
    document.getElementById('dataSummaryVizBarChart').innerHTML = '';
    oldParameter = parameter ? parameter : oldParameter;
    let parm = parameter ? parameter : oldParameter !== '' ? oldParameter : 'ageInt';
    document.getElementById('parametersDropDown').value = parm;
    let allTraces1 = [];
    let trace = {
        type: 'bar',
        x:Object.keys(data[parm]),
        y:Object.keys(data[parm]).map(k=>data[parm][k])
    }
    if(trace.x.length>1){
        if(trace.x.slice(-1)[0]=="undefined" || trace.x.slice(-1)[0]==""){
            trace.x.pop()
            trace.y.pop()
        }
    }
    allTraces1.push(trace);

    var layout = {
        xaxis: {title:`${parm}`},
        yaxis: {title:`Count`},
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };
    Plotly.newPlot('dataSummaryVizBarChart', allTraces1, layout, {responsive: true, displayModeBar: false});
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