import { hideAnimation, getFileJSON, getFile, csvJSON, removeActiveClass } from './shared.js';
import { variables } from './variables.js';
import { addEventVariableDefinitions } from './event.js';

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
}

export const getFileContent = async () => {
    // const jsonData = await getFileJSON(558252350024); // Get summary level data
    const jsonData = csvJSON(await getFile(631427327364)); // Get summary level data
    
    hideAnimation();
    if(!jsonData) {
        document.getElementById('confluenceDiv').innerHTML = `You don't have access to summary level data, please contact NCI for the access.`
        return;
    }
    renderAllCharts(jsonData, true);
};

const chipFilter = (jsonData) => {
    
    let template = '';
    template += `<div class="row genotype-select">
                    Genotyping chip &nbsp; <button class="info-btn" data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluenceMainModal"><i class="fas fa-question-circle cursor-pointer variable-definition" data-variable='chip'></i></button>
                </div>
                <div class="row genotype-select">
                    <button class="filter-btn sub-div-shadow genotype-selection-btn" data-genotyped="Yes">Confluence array</button>
                </div>
                <div class="row genotype-select">
                    <button class="filter-btn sub-div-shadow genotype-selection-btn" data-genotyped="No">Other arrays</button>
                </div>
                <div class="row genotype-select">
                    <button class="filter-btn sub-div-shadow genotype-selection-btn genotype-active-btn" data-genotyped="Both">All arrays</button>
                </div>
                <div class="custom-hr row"></div>`
    
    document.getElementById('chipContent').innerHTML = template;
    addEventGenotypeBtnSelection(jsonData);
}

const aggegrateData = (jsonData) => {
    let obj = {};
    for(let value of jsonData){
        if(obj[value.consortium] === undefined) obj[value.consortium] = {};
        if(obj[value.consortium]){
            obj[value.consortium]['consortiumTotal'] = jsonData.filter(dt => {if(dt.consortium === value.consortium) return dt}).map(dt => dt.total).reduce((a,b) => a+b)
            if(obj[value.consortium][value.study] === undefined) obj[value.consortium][value.study] = { total : jsonData.filter(dt => {if(dt.study === value.study) return dt}).map(dt => dt.total).reduce((a,b) => a+b)};
        }
    }
    return obj;
}

const filterByStudy = (jsonData) => {
    const obj = aggegrateData(jsonData);
    let template = '';
    for(let consortium in obj){
        template += `<ul class="remove-padding-left">
                        <li class="custom-borders">
                            <button class="row consortium-selection consortium-selection-btn" data-toggle="collapse" href="#toggle${consortium.replace(/ /g, '')}">
                                <div class="consortia-name">${consortium}</div>
                                <div class="ml-auto">
                                    <div class="filter-btn custom-margin consortia-total sub-div-shadow" data-consortia='${consortium}'>
                                        ${obj[consortium].consortiumTotal}
                                    </div> <i class="fas fa-caret-down"></i>
                                </div>
                            </button>
                        </li>
                        <ul class="collapse no-list-style custom-padding" id="toggle${consortium.replace(/ /g, '')}">`;
        for(let study in obj[consortium]){
            if(study !== 'consortiumTotal') {
                const total = obj[consortium][study].total;
                template += `<li class="filter-list-item">
                                <button class="row collapsible-items filter-studies filter-studies-btn" data-consortium=${consortium} data-study=${study}>
                                    <div class="study-name">${study}</div>
                                    <div class="ml-auto">
                                        <div class="filter-btn custom-margin study-total sub-div-shadow" data-consortia-study='${consortium}@#$${study}'>
                                            ${total}
                                        </div>
                                    </div>
                                </button>
                            </li>`;
            }
        }   
        template += `</ul></ul>`;
    }
    document.getElementById('studyFilter').innerHTML = template;
    addEventConsortiumSelect();
    addEventFilterCharts(jsonData);
    document.getElementsByClassName('consortium-selection')[0].click();
}

const addEventGenotypeBtnSelection = (jsonData) => {
    const elements = document.getElementsByClassName('genotype-selection-btn');
    Array.from(elements).forEach(element => {
        element.addEventListener('click', () => {
            if(element.classList.contains('genotype-active-btn')) return
            removeActiveClass('genotype-selection-btn', 'genotype-active-btn');
            element.classList.add('genotype-active-btn');
            let array = getSelectedStudies();
            const genotyped = element.dataset.genotyped;
            if(array.length === 0){
                if(genotyped === 'Yes') {
                    const filteredData = jsonData.filter(dt => dt.chip === 'Confluence chip');
                    updateCounts(filteredData);
                    renderAllCharts(filteredData);
                }
                else if(genotyped === 'No') {
                    const filteredData = jsonData.filter(dt => dt.chip === 'Other chip');
                    updateCounts(filteredData)
                    renderAllCharts(filteredData);
                } 
                else {
                    updateCounts(jsonData)
                    renderAllCharts(jsonData)
                }
            }
            else{
                let finalData = [];
                let dataUpdateCount = [];
                if(genotyped === 'Yes'){
                    dataUpdateCount = jsonData.filter(dt => dt.chip === 'Confluence chip');
                    for(let value of array){
                        const filteredData = jsonData.filter(dt => dt.consortium === value.split('@#$')[0] && dt.study === value.split('@#$')[1] && dt.chip === 'Confluence chip')
                        finalData = finalData.concat(filteredData);
                    }
                }
                else if (genotyped === 'No') {
                    dataUpdateCount = jsonData.filter(dt => dt.chip === 'Other chip');
                    for(let value of array){
                        const filteredData = jsonData.filter(dt => dt.consortium === value.split('@#$')[0] && dt.study === value.split('@#$')[1] && dt.chip === 'Other chip')
                        finalData = finalData.concat(filteredData);
                    }
                }
                else {
                    dataUpdateCount = jsonData;
                    for(let value of array){
                        const filteredData = jsonData.filter(dt => dt.consortium === value.split('@#$')[0] && dt.study === value.split('@#$')[1])
                        finalData = finalData.concat(filteredData);
                    }
                }
                updateCounts(dataUpdateCount);
                renderAllCharts(finalData);
            }
        });
    })
}

const addEventConsortiumSelect = () => {
    const elements = document.getElementsByClassName('consortium-selection');
    Array.from(elements).forEach(element => {
        element.addEventListener('click', () => {
            if (element.lastElementChild.lastElementChild.classList.contains('fa-caret-up')){
                element.lastElementChild.lastElementChild.classList.add('fa-caret-down');
                element.lastElementChild.lastElementChild.classList.remove('fa-caret-up');

            } else {
                element.lastElementChild.lastElementChild.classList.add('fa-caret-up');
                element.lastElementChild.lastElementChild.classList.remove('fa-caret-down');
            }
        });
    });
}

const addEventFilterCharts = (jsonData) => {
    const elements = document.getElementsByClassName('filter-studies');
    Array.from(elements).forEach(element => {
        element.addEventListener('click', () => {
            let array = []
            const genotypeSelected = document.getElementsByClassName('genotype-active-btn');
            const genotyped = genotypeSelected[0].dataset.genotyped;
            
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
                if(genotyped === 'Yes') finalData = jsonData.filter(dt => dt.chip === 'Confluence chip');
                else if(genotyped === 'No') finalData = jsonData.filter(dt => dt.chip === 'Other chip');
                else finalData = jsonData;
            }
            else {
                if(genotyped === 'Yes'){
                    for(let value of array){
                        const filteredData = jsonData.filter(dt => dt.consortium === value.split('@#$')[0] && dt.study === value.split('@#$')[1] && dt.chip === 'Confluence chip')
                        finalData = finalData.concat(filteredData);
                    }
                }
                else if (genotyped === 'No') {
                    for(let value of array){
                        const filteredData = jsonData.filter(dt => dt.consortium === value.split('@#$')[0] && dt.study === value.split('@#$')[1] && dt.chip === 'Other chip')
                        finalData = finalData.concat(filteredData);
                    }
                }
                else {
                    for(let value of array){
                        const filteredData = jsonData.filter(dt => dt.consortium === value.split('@#$')[0] && dt.study === value.split('@#$')[1])
                        finalData = finalData.concat(filteredData);
                    }
                }
            }
            renderAllCharts(finalData, false);
        });
    });
}

const renderAllCharts = (finalData, showFilter) => {
    generateBarChart('ageInt', 'dataSummaryVizChart3', 'dataSummaryVizLabel3', 'selectedRange3', 'chartDiv3', finalData);
    generateBarSingleSelect('famHist', 'dataSummaryVizChart6', 'dataSummaryVizLabel6', 'selectedRange6', 'chartDiv6', finalData)
    renderEthnicityBarChart(finalData, 'ethnicityClass', 'dataSummaryVizChart5', 'dataSummaryVizLabel5', 'selectedRange5', 'chartDiv5');
    renderPlotlyPieChart(finalData, 'ER_statusIndex', 'dataSummaryVizChart4', 'dataSummaryVizLabel4', 'selectedRange4', 'chartDiv4');
    renderStatusPieChart(finalData, 'status', 'dataSummaryVizChart2', 'dataSummaryVizLabel2', 'selectedRange2', 'chartDiv2');
    renderConsortiumPieChart(finalData, 'studyDesign', 'dataSummaryVizChart7', 'dataSummaryVizLabel7', 'selectedRange7', 'chartDiv7');
    if(showFilter) chipFilter(finalData);
    if(showFilter) filterByStudy(finalData)
    addEventVariableDefinitions();
}

const updateCounts = (data) => {
    const obj = aggegrateData(data);
    for(let consortia in obj){
        const elements = document.querySelectorAll(`[data-consortia="${consortia}"]`);
        Array.from(elements).forEach(element => {
            element.innerHTML = obj[consortia].consortiumTotal;
        });
        for(let study in obj[consortia]){
            const studyElements = document.querySelectorAll(`[data-consortia-study="${consortia}@#$${study}"]`);
            Array.from(studyElements).forEach(element => {
                element.innerHTML = obj[consortia][study].total;
            });
        };
    };
}

const getSelectedStudies = () => {
    const elements = document.querySelectorAll(`[class="row collapsible-items filter-studies filter-studies-btn active-filter"]`);
    const array = [];
    Array.from(elements).forEach(element => {
        const consortium = element.dataset.consortium;
        const study = element.dataset.study;
        const value = `${consortium}@#$${study}`
        if(array.indexOf(value) === -1) array.push(value);
    })
    return array;
};

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
        xaxis: {fixedrange: true, automargin: true},
        yaxis: {title:`Count`, fixedrange: true},
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };
    Plotly.newPlot(`${id}`, data, layout, {responsive: true, displayModeBar: false});
    document.getElementById(labelID).innerHTML = `${variables.BCAC[parameter]['label']} <button class="info-btn" data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluenceMainModal"><i class="fas fa-question-circle cursor-pointer variable-definition" data-variable='${parameter}'></i></button>`;
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
                color: ['#BF1B61', '#f7b6d2', '#7F7F7F']
            },
          type: 'bar'
        }
    ];
    const layout = {
        xaxis: {fixedrange: true, automargin: true},
        yaxis: {title:`Count`, fixedrange: true},
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };
    Plotly.newPlot(`${id}`, data, layout, {responsive: true, displayModeBar: false});

    document.getElementById(labelID).innerHTML = `${variables.BCAC[parameter]['label']} <button class="info-btn" data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluenceMainModal"><i class="fas fa-question-circle cursor-pointer variable-definition" data-variable='${parameter}'></i></button>`;
}

const renderPlotlyPieChart = (jsonData, parameter, id, labelID, rangeLabelID, chartDiv) => {
    document.getElementById(chartDiv).classList = ['background-white'];
    let pieLabel = ''
    if(variables.BCAC[parameter] && variables.BCAC[parameter]['label']){
        pieLabel = variables.BCAC[parameter]['label'];
    }else{
        pieLabel = parameter;
    }
    document.getElementById(labelID).innerHTML = `${pieLabel} <button class="info-btn" data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluenceMainModal"><i class="fas fa-question-circle cursor-pointer variable-definition" data-variable='${parameter}'></i></button>`;

    const data = [
        {
            labels: ['Positive', 'Negative', 'Don\'t know'],
            values: [jsonData.map(dt => parseInt(dt['ER_statusIndex_pos'])).reduce((a,b) => a+b),
                    jsonData.map(dt => parseInt(dt['ER_statusIndex_neg'])).reduce((a,b) => a+b),
                    jsonData.map(dt => parseInt(dt['ER_statusIndex_DK'])).reduce((a,b) => a+b)
                ],
            type: 'pie',
            textinfo: 'label+percent',
            hoverinfo: 'label+value+percent',
            textposition: 'inside',
            automargin: true,
            showlegend: false,
            marker:{
                colors: ['#BF1B61', '#f7b6d2', '#7F7F7F']
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
    document.getElementById(labelID).innerHTML = `${pieLabel} <button class="info-btn" data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluenceMainModal"><i class="fas fa-question-circle cursor-pointer variable-definition" data-variable='${parameter}'></i></button>`;
    const data = [
        {
            x: ['Case', 'Control'],
            y: [countStatus('case', jsonData), countStatus('control', jsonData)],
            type: 'bar',
            marker:{
                color: ['#BF1B61', '#f7b6d2']
            }
        }
    ];
    const layout = {
        xaxis: {fixedrange: true, automargin: true},
        yaxis: {title:`Count`, fixedrange: true},
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
    document.getElementById(labelID).innerHTML = `${pieLabel} <button class="info-btn" data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluenceMainModal"><i class="fas fa-question-circle cursor-pointer variable-definition" data-variable='${parameter}'></i></button>`;
    
    const allLabels = getUniqueConsortium(jsonData, parameter);
    const valueCount = [];
    for(let studyDesign of allLabels){
        valueCount.push(jsonData.filter(dt => {if(dt[parameter] === studyDesign) return dt}).map(dt => dt['total']).reduce((a,b) => a+b));
    }
    
    const data = [
        {
            labels: allLabels,
            values: valueCount,
            type: 'pie',
            hole: .4,
            textinfo: 'label+value',
            textposition: 'inside',
            text: {
                font: '10px'
            },
            showlegend: false,
            automargin: true,
            marker:{
                colors: ['#BF1B61', '#f7b6d2','#BF1B61', '#f7b6d2','#BF1B61', '#f7b6d2','#BF1B61']
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
    document.getElementById(labelID).innerHTML = `${pieLabel} <button class="info-btn" data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluenceMainModal"><i class="fas fa-question-circle cursor-pointer variable-definition" data-variable='${parameter}'></i></button>`;
    const allLabels = getUniqueConsortium(jsonData, parameter);
    const valueCount = [];
    for(let studyDesign of allLabels){
        valueCount.push(jsonData.filter(dt => {if(dt[parameter] === studyDesign) return dt}).map(dt => dt['total']).reduce((a,b) => a+b));
    }
    const data = [
        {
            x: allLabels,
            y: valueCount,
            type: 'bar',
            marker:{
                color: ['#BF1B61', '#cb4880', '#d876a0','#e5a3bf', '#BF1B61', '#cb4880', '#7F7F7F']
            },
        }
    ];
    const layout = {
        xaxis: {fixedrange: true, automargin: true},
        yaxis: {title:`Count`, fixedrange: true},
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };
    Plotly.newPlot(`${id}`, data, layout, {responsive: true, displayModeBar: false});
}
