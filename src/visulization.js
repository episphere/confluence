import { convertTextToJson, hideAnimation, disableCheckBox, removeActiveClass } from './shared.js';
import { parameterListTemplate } from './components/elements.js';
import { variables } from './variables.js';
import { addEventShowAllVariables, addEventVariableItem, addEventShowPieChart } from './event.js';
import { unHideDivs } from './pages/dataExploration.js';
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

export const getData = (studyEntries, studyIds, values) => {
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
    getFileContent(allIds);
}

const getFileContent = async (allIds) => {
    const jsonData = await convertTextToJson(Object.keys(allIds));
    const cf = getCrossFilter(jsonData);
    
    let parameterList = document.getElementById('parameterList');
    parameterList.innerHTML = parameterListTemplate();
    addEventVariableItem(cf, jsonData);
    document.getElementById('showAllVariables').innerHTML = '<a href="#" id="toggleVariable">Show All <i class="fas fa-caret-down"></i></a>'
    addEventShowAllVariables(cf, jsonData);
    document.getElementById('showPieChart').innerHTML = '<input type="checkbox"> Show pie chart'
    addEventShowPieChart(cf, jsonData);
    generateDCChart(cf, jsonData);
};

export const generateDCChart = (cf, jsonData, selection) => {
    dc.config.defaultColors(d3.schemeSet2);
    
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
        .externalRadiusPadding(5)
        .label(function(c){
            return `${c.key} (${c.value})`
        });


    
    renderPieChart(cf, jsonData, selection);
    
    let barChart = dc.barChart('#dataSummaryVizBarChart');
    const { min, max } = getMinMax(jsonData, 'ageInt');
    let age = cf.dimension(function(d) {return d.ageInt;});
    let ageCount = age.group().reduceCount();
    barChart.dimension(age)
        .group(ageCount)
        .x(d3.scaleLinear().domain([min, max]))
        .xAxisLabel('Age')
        .yAxisLabel(function(){
            return `Count (${barChart.data()[0].domainValues.map(d=>d.y).reduce((a,b)=>a+b)})`
        })
        .elasticY(true);

    pieChart.render();
    barChart.render();
    document.getElementById('barChartLabel').innerHTML = `${variables.BCAC['ageInt']['label']}`;
    document.getElementById('statusPieChart').innerHTML = `${variables.BCAC['status']['label']}`;
    
    unHideDivs();
    hideAnimation();
    disableCheckBox(false);
}

export const renderPieChart = (cf, jsonData, selection, pieChart) => {
    oldParameter = selection ? selection : oldParameter;
    let parameter = selection ? selection : oldParameter !== '' ? oldParameter : 'ER_statusIndex';
    document.getElementById('dataSummaryVizChart2').setAttribute('data-selected-variable', parameter);
    let variableItem = document.getElementsByClassName('variableItem');
    Array.from(variableItem).forEach(element => {
        if(element.innerHTML === parameter) {
            removeActiveClass('variableItem', 'active');
            element.classList.add('active');
        }
    });

    let data_reduce = valUnique(parameter, 0, jsonData);

    // If there are less then 10 unique value render pie chart else render bar chart
    if(Object.keys(data_reduce).length < 10 || pieChart){
        document.getElementById('showPieChart').childNodes[0].checked = false;
        document.getElementById('showPieChart').style.display = 'none';
        document.getElementById('dataSummaryVizChart2').innerHTML = '';
        let pieChart2 = dc.pieChart("#dataSummaryVizChart2");
        let data = cf.dimension(function(d){return d[parameter]});
        
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
            .externalRadiusPadding(10)
            .label(function(c){
                return `${c.key} (${c.value})`
            });

        pieChart2.render();
    }
    else{
        document.getElementById('showPieChart').style.display = 'block';
        document.getElementById('dataSummaryVizChart2').innerHTML = '';
        const { min, max } = getMinMax(jsonData, parameter);
        let barChart = dc.barChart('#dataSummaryVizChart2');
        let age = cf.dimension(function(d) {return d[parameter];});
        let ageCount = age.group().reduceCount();
        barChart.dimension(age)
            .group(ageCount)
            .x(d3.scaleLinear().domain([min, max]))
            .xAxisLabel(parameter)
            .yAxisLabel(function(){
                return `Count (${barChart.data()[0].domainValues.map(d=>d.y).reduce((a,b)=>a+b)})`
            })
            .elasticY(true);
        barChart.render();
    };

    let pieLabel = ''
    if(variables.BCAC[parameter] && variables.BCAC[parameter]['label']){
        pieLabel = variables.BCAC[parameter]['label'];
    }else{
        pieLabel = parameter;
    }
    document.getElementById('pieChartLabel').innerHTML = `${pieLabel}`;
}

const getCrossFilter = (jsonData) => crossfilter(jsonData);

const valUnique=function(k,v, jsonData){
    var u={}
    jsonData.forEach(d=>{
        if(d[k] === "") return;
        u[d[k]]=v
    })
    return u
}

const getMinMax = (jsonData, parameter) => {
    let values = [];
    jsonData.forEach(data => {
        if(data[parameter] && data[parameter] !== "" && data[parameter] !== "Don't Know"){
            values.push(parseInt(data[parameter]));
        }
    });
    return {min: Math.min(...values), max: Math.max(...values)}
}