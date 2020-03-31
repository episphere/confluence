import { hideAnimation, getFileJSON, getFile, csvJSON } from './shared.js';
import { variables } from './variables.js';

const unique = arr => {
    let u={}
    arr.forEach(v => {
        if (v=='888' || v=='777' || v=="" ) v = undefined // 888 undefined code
        if (!u[v]) u[v] = 0
        u[v]++
    })
    return u
}

export const txt2dt = txt => {
    let dt = txt.split(/\n/g).map(tx => tx.split(/\t/g))
    // trailing blank
    if((txt.split(/\n+/).slice(-1).length == 1) && (txt.slice(-1)[0].length)){
        dt.pop()
    }
    let tab = {}
    let hh = dt[0].forEach((h,j)=>{ // headers
        tab[h] = []
        dt.slice(1).forEach((vv,i)=>{
            tab[h][i] = vv[j]
        })
    });

    let uni = {}
    Object.keys(tab).forEach(k => {
        uni[k] = unique(tab[k])
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
            // allIds = {...allIds, ...fileEntries};
        });
    });
    // getFileContent(allIds);
}

export const getFileContent = async () => {
    // const jsonData = await getFileJSON(558252350024); // Get summary level data
    const jsonData = csvJSON(await getFile(631427327364)); // Get summary level data
    
    hideAnimation();
    if(!jsonData) {
        document.getElementById('confluenceDiv').innerHTML = `You don't have access to summary level data, please contact NCI for the access.`
        return;
    }
    const cf = getCrossFilter(jsonData);
    generateAllCharts(cf, jsonData);
    // reSizeCharts(cf, jsonData);
};

// const dataBinning = (data, binSize) => {
//     const ageArray = [];
//     const ageBinned = [];
//     for(let obj of data){
//         ageArray.push(parseInt(obj.ageInt));
//     }
//     ageArray.sort();
//     for(let i = 0; i <ageArray.length; i=i+binSize ){
//         let avg = 0;
//         let counter = 0;
//         while(counter < binSize){
//             avg = avg+ageArray[i+counter];
//             counter++;
//         }
//         avg = avg/binSize;
//         ageBinned.push(Math.floor(avg));
//     }
//     console.log(ageBinned)
// }

export const generateAllCharts = (cf, jsonData) => {
    // generateBarChart(cf, jsonData, 'ageInt', 'dataSummaryVizChart3', 'dataSummaryVizLabel3', 'selectedRange3', 'chartDiv3');
    // generateSelectionMenu(cf, 'consortium', 'select1');
    // generateSelectionMenu(cf, 'study', 'select2');
    // generateSelectionMenu(cf, 'status', 'select3');
    // generateSelectionMenu(cf, 'consortium', 'select1');

    generateBarChart('ageInt', 'dataSummaryVizChart3', 'dataSummaryVizLabel3', 'selectedRange3', 'chartDiv3', jsonData);
    // dc.config.defaultColors(d3.schemePaired);
    // renderPieChart(cf, jsonData, 'consortium', 'dataSummaryVizChart7', 'dataSummaryVizLabel7', 'selectedRange7', 'chartDiv7');
    
    generateBarSingleSelect('famHist', 'dataSummaryVizChart6', 'dataSummaryVizLabel6', 'selectedRange6', 'chartDiv6', jsonData)
    // dc.config.defaultColors(d3.schemePastel1);
    // renderPieChart(cf, jsonData, 'study', 'dataSummaryVizChart1', 'dataSummaryVizLabel1', 'selectedRange1', 'chartDiv1');
    // dc.config.defaultColors(d3.schemeSet2);
    // renderPieChart(cf, jsonData, 'status', 'dataSummaryVizChart2', 'dataSummaryVizLabel2', 'selectedRange2', 'chartDiv2');
    // dc.config.defaultColors(d3.schemeBrBG[8]);
    // renderPieChart(cf, jsonData, 'ER_statusIndex', 'dataSummaryVizChart4', 'dataSummaryVizLabel4', 'selectedRange4', 'chartDiv4');
    // dc.config.defaultColors(d3.schemeSet3);
    // renderPieChart(cf, jsonData, 'ethnicityClass', 'dataSummaryVizChart5', 'dataSummaryVizLabel5', 'selectedRange5', 'chartDiv5');
    renderEthnicityBarChart(jsonData, 'ethnicityClass', 'dataSummaryVizChart5', 'dataSummaryVizLabel5', 'selectedRange5', 'chartDiv5');
    renderPlotlyPieChart(jsonData, 'ER_statusIndex', 'dataSummaryVizChart4', 'dataSummaryVizLabel4', 'selectedRange4', 'chartDiv4');
    renderStatusPieChart(jsonData, 'status', 'dataSummaryVizChart2', 'dataSummaryVizLabel2', 'selectedRange2', 'chartDiv2');
    renderConsortiumPieChart(jsonData, 'studyDesign', 'dataSummaryVizChart7', 'dataSummaryVizLabel7', 'selectedRange7', 'chartDiv7');
    getSelectionOptions(jsonData);
}

const getSelectionOptions = (jsonData) => {
    let obj = {};
    for(let value of jsonData){
        if(obj[value.consortium] === undefined) obj[value.consortium] = {};
        if(obj[value.consortium]){
            obj[value.consortium]['consortiumTotal'] = jsonData.filter(dt => {if(dt.consortium === value.consortium) return dt}).map(dt => dt.total).reduce((a,b) => a+b)
            if(obj[value.consortium][value.study] === undefined) obj[value.consortium][value.study] = { total : jsonData.filter(dt => {if(dt.study === value.study) return dt}).map(dt => dt.total).reduce((a,b) => a+b)};
        }
    }
    let template = '<div class="align-left">';
    for(let consortium in obj){
        template += `<ul class="remove-padding-left">
                        <li class="row consortium-selection custom-borders"><div>${consortium}</div>
                        <div class="ml-auto"><div class="filter-btn custom-margin consortia-total">${obj[consortium].consortiumTotal}</div> <i class="fas fa-caret-down"></i></div></li>
                        <ul class="ul-list-style content custom-padding">`;
        for(let study in obj[consortium]){
            if(study !== 'consortiumTotal') {
                const total = obj[consortium][study].total;
                template += `<li class="row collapsible-items filter-studies" data-consortium=${consortium} data-study=${study}><div>${study}</div>
                    <div class="ml-auto"><div class="filter-btn custom-margin">${total}</div></div></li>`;
            }
        }   
        template += `</ul></ul>`;
    }
    template += '</div>'
    document.getElementById('cardContent').innerHTML = template;

    addEventConsortiumSelect();
    addEventFilterCharts(jsonData);
    document.getElementsByClassName('consortium-selection')[0].click();
}

const addEventConsortiumSelect = () => {
    const elements = document.getElementsByClassName('consortium-selection');
    Array.from(elements).forEach(element => {
        element.addEventListener('click', () => {
            
            let content = element.nextElementSibling;
            if (content.style.maxHeight){
                content.style.maxHeight = null;
                element.lastElementChild.lastElementChild.classList.add('fa-caret-down');
                element.lastElementChild.lastElementChild.classList.remove('fa-caret-up');

            } else {
                content.style.maxHeight = "1000px";
                element.lastElementChild.lastElementChild.classList.add('fa-caret-up');
                element.lastElementChild.lastElementChild.classList.remove('fa-caret-down');
            }
        })
        
    });
}

const addEventFilterCharts = (jsonData) => {
    const elements = document.getElementsByClassName('filter-studies');
    Array.from(elements).forEach(element => {
        element.addEventListener('click', () => {
            let array = []
            if(element.classList.contains('active-filter')){
                element.classList.remove('active-filter');
                array = getSelectedStudies();
            }
            else{
                element.classList.add('active-filter');
                array = getSelectedStudies();
            }
            let finalData = [];
            if(array.length === 0){
                finalData = jsonData;
            }
            else {
                for(let value of array){
                    const filteredData = jsonData.filter(dt => { if(dt.consortium === value.split('@#$')[0] && dt.study === value.split('@#$')[1]) return dt})
                    finalData = finalData.concat(filteredData);
                }
            }
            
            generateBarChart('ageInt', 'dataSummaryVizChart3', 'dataSummaryVizLabel3', 'selectedRange3', 'chartDiv3', finalData);
            generateBarSingleSelect('famHist', 'dataSummaryVizChart6', 'dataSummaryVizLabel6', 'selectedRange6', 'chartDiv6', finalData)
            renderEthnicityBarChart(finalData, 'ethnicityClass', 'dataSummaryVizChart5', 'dataSummaryVizLabel5', 'selectedRange5', 'chartDiv5');
            renderPlotlyPieChart(finalData, 'ER_statusIndex', 'dataSummaryVizChart4', 'dataSummaryVizLabel4', 'selectedRange4', 'chartDiv4');
            renderStatusPieChart(finalData, 'status', 'dataSummaryVizChart2', 'dataSummaryVizLabel2', 'selectedRange2', 'chartDiv2');
            renderConsortiumPieChart(finalData, 'studyDesign', 'dataSummaryVizChart7', 'dataSummaryVizLabel7', 'selectedRange7', 'chartDiv7');
        });
    });
}

const getSelectedStudies = () => {
    const elements = document.querySelectorAll(`[class="row collapsible-items filter-studies active-filter"]`);
    const array = [];
    Array.from(elements).forEach(element => {
        const consortium = element.dataset.consortium;
        const study = element.dataset.study;
        const value = `${consortium}@#$${study}`
        if(array.indexOf(value) === -1) array.push(value);
    })
    return array;
};

const generateSelectionMenu = (cf, parameter, id) => {
    let dimension = cf.dimension(function(d) {return d[parameter] ? d[parameter] : ""});
    const selection = dc.selectMenu(`#${id}`)
    selection.dimension(dimension)
        .multiple(true)
        .group(dimension.group())
        .controlsUseVisibility(true)
        .title(function (d){ return `${d.key}`})
        .render();
}

export const generateBarChart = (parameter, id, labelID, rangeLabelID, chartDiv, jsonData) => {
    document.getElementById(chartDiv).classList = ['background-white'];
    const data = [
        {
            x: ['20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-99'],
            y: [jsonData.map(dt => parseInt(dt['20-29'])).reduce((a,b) => a+b),
                    jsonData.map(dt => parseInt(dt['30-39'])).reduce((a,b) => a+b),
                    jsonData.map(dt => parseInt(dt['40-49'])).reduce((a,b) => a+b),
                    jsonData.map(dt => parseInt(dt['50-59'])).reduce((a,b) => a+b),
                    jsonData.map(dt => parseInt(dt['60-69'])).reduce((a,b) => a+b),
                    jsonData.map(dt => parseInt(dt['70-79'])).reduce((a,b) => a+b),
                    jsonData.map(dt => parseInt(dt['80-89'])).reduce((a,b) => a+b),
                    jsonData.map(dt => parseInt(dt['90-99'])).reduce((a,b) => a+b)
            ],
            marker:{
                color: ['#BF1B61', '#BF1B61','#BF1B61', '#BF1B61','#BF1B61', '#BF1B61','#BF1B61', '#BF1B61']
            },
          type: 'bar'
        }
    ];
    const layout = {
        xaxis: {title:`Age`, font: {size: 16}, fixedrange: true},
        yaxis: {title:`Count`, font: {size: 16}, fixedrange: true},
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };
    Plotly.newPlot(`${id}`, data, layout, {responsive: true, displayModeBar: false});
    document.getElementById(labelID).innerHTML = `${variables.BCAC[parameter]['label']} <i class="fas fa-question-circle cursor-pointer" id="infoBarChart" data-toggle="modal" data-target="#"></i>`;
}

const generateBarSingleSelect = (parameter, id, labelID, rangeLabelID, chartDiv, jsonData) => {
    document.getElementById(chartDiv).classList = ['background-white'];
    const data = [
        {
            x: ['Yes', 'No', 'Don\'t know'],
            y: [jsonData.map(dt => parseInt(dt['famHist_yes'])).reduce((a,b) => a+b),
                    jsonData.map(dt => parseInt(dt['famHist_no'])).reduce((a,b) => a+b),
                    jsonData.map(dt => parseInt(dt['famHist_DK\r'])).reduce((a,b) => a+b)
                    
            ],
            marker:{
                color: ['#BF1B61', '#7F7F7F','#BF1B61']
            },
          type: 'bar'
        }
    ];
    const layout = {
        xaxis: {fixedrange: true},
        yaxis: {title:`Count`, font: {size: 16}, fixedrange: true},
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };
    Plotly.newPlot(`${id}`, data, layout, {responsive: true, displayModeBar: false});

    document.getElementById(labelID).innerHTML = `${variables.BCAC[parameter]['label']} <i class="fas fa-question-circle cursor-pointer" id="infoBarChartSingle" data-toggle="modal" data-target="#"></i>`;
}

const renderPlotlyPieChart = (jsonData, parameter, id, labelID, rangeLabelID, chartDiv) => {
    document.getElementById(chartDiv).classList = ['background-white'];
    let pieLabel = ''
    if(variables.BCAC[parameter] && variables.BCAC[parameter]['label']){
        pieLabel = variables.BCAC[parameter]['label'];
    }else{
        pieLabel = parameter;
    }
    document.getElementById(labelID).innerHTML = `${pieLabel} <i class="fas fa-question-circle cursor-pointer" id="infoPieChart" data-toggle="modal" data-target="#"></i>`;

    const data = [
        {
            labels: ['Positive', 'Negative', 'Don\'t know'],
            values: [jsonData.map(dt => parseInt(dt['ER_statusIndex_pos'])).reduce((a,b) => a+b),
                    jsonData.map(dt => parseInt(dt['ER_statusIndex_neg'])).reduce((a,b) => a+b),
                    jsonData.map(dt => parseInt(dt['ER_statusIndex_DK'])).reduce((a,b) => a+b)
            ],
            type: 'pie',
            textinfo: 'label+value',
            showlegend: false,
            marker:{
                colors: ['#BF1B61', '#cb4880', '#d876a0', '#e5a3bf']
            },
            hole: .4
        }
    ];
    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };
    Plotly.newPlot(`${id}`, data, layout, {responsive: true, displayModeBar: false});
}

const countStatus = (value, jsonData) => {
    return jsonData.filter(dt => {if(dt.status === value) return dt}).map(dt => dt['total']).reduce((a,b) => a+b);
}

const countEthnicity = (value, jsonData) => {
    const array = jsonData.filter(dt => {if(dt.ethnicityClass === value) return dt}).map(dt => dt['total']);
    if(array.length > 0) return array.reduce((a,b) => a+b);
}

const renderStatusPieChart = (jsonData, parameter, id, labelID, rangeLabelID, chartDiv) => {
    document.getElementById(chartDiv).classList = ['background-white'];
    let pieLabel = ''
    if(variables.BCAC[parameter] && variables.BCAC[parameter]['label']){
        pieLabel = variables.BCAC[parameter]['label'];
    }else{
        pieLabel = parameter;
    }
    document.getElementById(labelID).innerHTML = `${pieLabel} <i class="fas fa-question-circle cursor-pointer" id="infoStatusPieChart" data-toggle="modal" data-target="#"></i>`;
    const data = [
        {
            x: ['Case', 'Control'],
            y: [countStatus('case', jsonData), countStatus('control', jsonData)],
            type: 'bar',
            marker:{
                color: ['#BF1B61', '#7F7F7F']
            }
        }
    ];
    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };
    Plotly.newPlot(`${id}`, data, layout, {responsive: true, displayModeBar: false});
}

const renderConsortiumPieChart = (jsonData, parameter, id, labelID, rangeLabelID, chartDiv) => {
    document.getElementById(chartDiv).classList = ['background-white'];
    let pieLabel = ''
    if(variables.BCAC[parameter] && variables.BCAC[parameter]['label']){
        pieLabel = variables.BCAC[parameter]['label'];
    }else{
        pieLabel = parameter;
    }
    document.getElementById(labelID).innerHTML = `${pieLabel} <i class="fas fa-question-circle cursor-pointer" id="infoConsortiumPieChart" data-toggle="modal" data-target="#"></i>`;
    
    const allLabels = getUniqueConsortium(jsonData, parameter);
    const valueCount = [];
    for(let studyDesign of allLabels){
        valueCount.push(jsonData.filter(dt => {if(dt['studyDesign'] === studyDesign) return dt}).map(dt => dt['total']).reduce((a,b) => a+b));
    }
    
    const data = [
        {
            labels: allLabels,
            values: valueCount,
            type: 'pie',
            hole: .4,
            textinfo: 'label+value',
            showlegend: false,
            marker:{
                colors: ['#BF1B61', '#7F7F7F','#BF1B61', '#7F7F7F','#BF1B61', '#7F7F7F','#BF1B61']
            },
        }
    ];
    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };
    Plotly.newPlot(`${id}`, data, layout, {responsive: true, displayModeBar: false});
}

const getUniqueConsortium = (jsonData, parameter) => {
    let array = [];
    for(let obj of jsonData){
        if(array.indexOf(obj[parameter]) === -1) array.push(obj[parameter]);
    }
    return array;
}

const renderEthnicityBarChart = (jsonData, parameter, id, labelID, rangeLabelID, chartDiv) => {
    document.getElementById(chartDiv).classList = ['background-white'];
    let pieLabel = ''
    if(variables.BCAC[parameter] && variables.BCAC[parameter]['label']){
        pieLabel = variables.BCAC[parameter]['label'];
    }else{
        pieLabel = parameter;
    }
    document.getElementById(labelID).innerHTML = `${pieLabel} <i class="fas fa-question-circle cursor-pointer" id="infoEthnicityBarChart" data-toggle="modal" data-target="#"></i>`;
    const data = [
        {
            x: ['European', 'Hispanic', 'African', 'Asian', 'South East Asian', 'Other', 'DK'],
            y: [countEthnicity('European', jsonData), countEthnicity('Hispanic', jsonData), countEthnicity('African', jsonData), countEthnicity('Asian', jsonData), countEthnicity('South East Asian', jsonData), countEthnicity('Other', jsonData), countEthnicity('DK', jsonData)],
            type: 'bar',
            marker:{
                color: ['#BF1B61', '#7F7F7F','#BF1B61', '#7F7F7F','#BF1B61', '#7F7F7F','#BF1B61']
            },
        }
    ];
    const layout = {
        xaxis: {fixedrange: true},
        yaxis: {title:`Count`, font: {size: 16}, fixedrange: true},
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };
    Plotly.newPlot(`${id}`, data, layout, {responsive: true, displayModeBar: false});
}

const getCrossFilter = (jsonData) => crossfilter(jsonData);
