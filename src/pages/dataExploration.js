import { getFolderItems, getFile, hideAnimation, showError, disableCheckBox, convertTextToJson, uploadFile, getFileJSON, csv2Json, numberWithCommas, emailsAllowedToUpdateData, getFileInfo, missingnessStatsFileId } from '../shared.js';
import { studyDropDownTemplate } from '../components/elements.js';
import { txt2dt, addEventConsortiumSelect, getSelectedStudies } from '../visualization.js';
import { addEventStudiesCheckBox, addEventDataTypeCheckBox, addEventSearchDataType, addEventSearchStudies, addEventSelectAllStudies, addEventSelectAllDataType, addEventVariableDefinitions, addEventFilterBarToggle, addEventMissingnessFilterBarToggle } from '../event.js';

export const template = (pageHeader) => {
    return `
        <div class="general-bg">
            <div class="container body-min-height">
                <div class="main-summary-row white-bg div-border">
                    <button class="sub-menu-btn"><a class="nav-link active black-font" href="#data_exploration/summary"><strong>Summary statistics</strong></a></button>
                    <button class="sub-menu-btn"><a class="nav-link black-font" href="#data_exploration/subset"> <strong>Subset statistics</strong></a></button>
                </div>
                <div class="main-summary-row">
                    <div class="offset-xl-2 col-xl-10 align-left padding-left-30">
                        <h1 class="page-header">${pageHeader}</h1>
                    </div>
                </div>
                
                ${localStorage.parms && JSON.parse(localStorage.parms).login && emailsAllowedToUpdateData.indexOf(JSON.parse(localStorage.parms).login) !== -1 ? `
                    <div class="main-summary-row"><button id="updateSummaryStatsData" class="btn btn-outline-dark" aria-label="Update summary stats data" data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluenceMainModal">Update data</button></div>
                `:``}
                <div class="main-summary-row" id="dataSummaryStatistics"></div>
                <div class="main-summary-row">
                    <div class="col">
                        <div class="offset-xl-2 padding-left-30 align-left" id="dataLastModified"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

const dataVisulizationCards = (obj) => `
        <div class="col-xl-4 padding-right-zero" style="margin-bottom: 1rem;">
            <div id="${obj.divId}">
                <div class="card">
                    <div class="card-header">
                        <span class="data-summary-label-wrap"><label class="dataSummary-label" id="${obj.cardHeaderId}"></label></span>
                    </div>
                    <div class="card-body viz-card-body">
                        <div class="dataSummary-chart" id="${obj.cardBodyId}"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

export const dataSummaryStatisticsTemplate = () => {
    let template = '';
    // <button class="info-btn" aria-label="More info" data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluenceMainModal" id="dataSummaryFilter"><i class="fas fa-question-circle cursor-pointer"></i></button>
    template = `
    <div class="col-xl-2 filter-column" id="summaryFilterSiderBar">
        <div class="card">
            <div class="card-header align-left card-filter-header">
                <strong class="side-panel-header font-size-17">Filter</strong>
            </div>
            <div id="cardContent" class="card-body">
                <div id="allFilters" class="align-left"></div>
            </div>
        </div>
    </div>
    <div class="col-xl-10 padding-right-zero" id="summaryStatsCharts">
        <button id="filterBarToggle"><i class="fas fa-lg fa-caret-left"></i></button>
        <div class="main-summary-row" style="min-height: 10px;padding-left: 15px;margin-bottom: 1rem;">
            <div class="col white-bg div-border align-left font-size-17" style="padding: 0.5rem;" id="listFilters">
                <span class="font-weight-bold">Gender:</span> All<span class="vertical-line"></span>
                <span class="font-weight-bold">Genotyping chip:</span> All Arrays
            </div>
        </div>
        <div class="main-summary-row">
        `
        template += dataVisulizationCards({divId: 'chartDiv7', cardHeaderId: 'dataSummaryVizLabel7', cardBodyId: 'dataSummaryVizChart7'})
        template += dataVisulizationCards({divId: 'chartDiv2', cardHeaderId: 'dataSummaryVizLabel2', cardBodyId: 'dataSummaryVizChart2'})
        template += dataVisulizationCards({divId: 'chartDiv5', cardHeaderId: 'dataSummaryVizLabel5', cardBodyId: 'dataSummaryVizChart5'})
        template += `</div><div class="main-summary-row">`

        template += dataVisulizationCards({divId: 'chartDiv3', cardHeaderId: 'dataSummaryVizLabel3', cardBodyId: 'dataSummaryVizChart3'})
        template += dataVisulizationCards({divId: 'chartDiv6', cardHeaderId: 'dataSummaryVizLabel6', cardBodyId: 'dataSummaryVizChart6'})
        template += dataVisulizationCards({divId: 'chartDiv4', cardHeaderId: 'dataSummaryVizLabel4', cardBodyId: 'dataSummaryVizChart4'})
        
        template += `</div></div>
    `;
    document.getElementById('dataSummaryStatistics').innerHTML = template;
    addEventFilterBarToggle();
}


export const dataSummaryMissingTemplate = async () => {
    const response = await getFile(missingnessStatsFileId);
    const lastModified = (await getFileInfo(missingnessStatsFileId)).modified_at;
    document.getElementById('dataLastModified').innerHTML = `Data last modified at - ${new Date(lastModified).toLocaleString()}`;
    const {data, headers} = csv2Json(response);
    const variables = headers.filter(dt => /status_/i.test(dt) === false && /study/i.test(dt) === false && /consortia/i.test(dt) === false && /ethnicityClass_/i.test(dt) === false  && /bcac_id/i.test(dt) === false);
    const status = headers.filter(dt => /status_/i.test(dt) === true);
    const initialSelection = variables.length > 5 ? variables.slice(0, 5) : variables;
    // const studies = data.map(dt => dt['study']).filter((item, i, ar) => ar.indexOf(item) === i);
    const studies = {};
    data.forEach(dt => {
        if(studies[dt['Consortia']] === undefined) studies[dt['Consortia']] = {};
        if(dt['study'] && studies[dt['Consortia']][dt['study']] === undefined) studies[dt['Consortia']][dt['study']] = {};
    });
    const ancestory = headers.filter(dt => /ethnicityClass_/i.test(dt) === true);
    
    const div1 = document.createElement('div');
    div1.classList = ['col-xl-2 filter-column'];
    div1.id = 'missingnessFilter';


    const div2 = document.createElement('div');
    div2.classList = ['col-xl-10'];
    div2.innerHTML = `
        <button id="filterBarToggle">
            <i class="fas fa-lg fa-caret-left"></i>
        </button>
        <div class="main-summary-row" style="min-height: 10px;margin-bottom: 1rem;margin-left: 1rem;">
            <div class="col white-bg div-border align-left font-size-17" style="padding: 0.5rem;" id="listFilters">
                <span class="font-weight-bold">Status:</span> All<span class="vertical-line"></span>
                <span class="font-weight-bold">Ancestry:</span> All
                ${initialSelection.length > 0 ? `
                    <span class="vertical-line"></span><span class="font-weight-bold">Variable: </span>${initialSelection[0]} ${initialSelection.length > 1 ? `and <span class="other-variable-count">${initialSelection.length-1} others</span>`:``}
                `:``}
            </div>
        </div>
        `;

    const row = document.createElement('div');
    row.classList = ['main-summary-row div-border allow-overflow'];
    row.id = 'missingnessTable'

    div2.appendChild(row);
    document.getElementById('dataSummaryStatistics').appendChild(div1);
    document.getElementById('dataSummaryStatistics').appendChild(div2);

    renderFilter(data, initialSelection, variables, status, studies, ancestory);
    midset(data, initialSelection);
    addEventMissingnessFilterBarToggle()
}

const sortArray = (array) => {
    array.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
    return array
}

const renderFilter = (data, acceptedVariables, headers, status, studies, ancestory) => {
    let template = '';
    template += `
    <div class="card midset-card">
        <div class="card-header align-left card-filter-header">
            <strong class="side-panel-header">Filter</strong>
        </div>
        <div class="card-body" id="cardContent">
            <div id="midsetFilterData" class="row gender-select align-left"></div>
        </div>
    </div>
    `
    document.getElementById('missingnessFilter').innerHTML = template;
    renderMidsetFilterData(data, acceptedVariables, headers, status, studies, ancestory);
}

const renderMidsetFilterData = (data, acceptedVariables, headers, status, studies, ancestory) => {
    let template = '';
    ancestory.splice(ancestory.indexOf('ethnicityClass_Other'), 1);
    ancestory.sort();
    ancestory.push('ethnicityClass_Other');
    ancestory.push('All');
    template += `
        <form id="midsetFilterForm" method="POST">
            <div class="form-group" id="statusList">
                <label class="filter-label font-size-13" for="statusSelection">Status</label>
                <select class="form-control font-size-15" id="statusSelection">
                    <option selected value='All'>All</option>
                    <option value='status_case'>case</option>
                    <option value='status_control'>control</option>
                </select>
            </div>
            <div class="form-group" id="ancestryList">
                <label class="filter-label font-size-13" for="ancestrySelection">Ancestry</label>
                <select class="form-control font-size-15" id="ancestrySelection">`
    ancestory.forEach(anc => {
        template += `<option value="${anc}" ${anc === 'All' ? 'selected':''}>${anc.replace(new RegExp('ethnicityClass_', 'i'), '')}</option>`
    }) 
                
    template += `</select>
            </div>
            <div class="form-group">
                <label class="filter-label font-size-13" for="studiesList">Studies</label>
                <div id="studiesList" class="font-size-15">`
    for(let consortium in studies){
        let innerTemplate = `
            <ul class="remove-padding-left">
                <li class="custom-borders filter-list-item consortia-study-list" data-consortia="${consortium}">
                    <input type="checkbox" data-consortia="${consortium}" id="label${consortium}" class="select-consortium"/>
                    <label for="label${consortium}" class="consortia-name">${consortium}</label>
                    <div class="ml-auto">
                        <button type="button" ${Object.keys(studies[consortium]).length !== 0 ? ``:`disabled title="Doesn't have any study data."`} class="consortium-selection consortium-selection-btn" data-toggle="collapse" href="#toggle${consortium.replace(/ /g, '')}">
                            <i class="fas fa-caret-down"></i>
                        </button>
                    </div>
                </li>
        `;
        if(Object.keys(studies[consortium]).length !== 0) {
            innerTemplate += `<ul class="collapse no-list-style custom-padding allow-overflow max-height-study-list" id="toggle${consortium.replace(/ /g, '')}">`;

            for(let study in studies[consortium]){
                innerTemplate += `
                    <li class="filter-list-item">
                        <input type="checkbox" data-study="${study}" data-consortium="${consortium}" id="label${study}" class="select-study"/>
                        <label for="label${study}" class="study-name" title="${study}">${study.length > 10 ? `${study.substr(0,10)}...`:study}</label>
                    </li>`;
            }
            innerTemplate += `</ul>`;
        }
        innerTemplate += '</ul>'
        template += innerTemplate
    }
    template +=`
                </div>
            </div>
            <div class="form-group" id="midsetVariables">
                <label class="filter-label font-size-13" for="variableSelectionList">Variable Selection</label>
                <ul class="remove-padding-left font-size-15" id="variableSelectionList">
            `
    headers.forEach(variable => {
        template += `<li class="filter-list-item">
                        <input type="checkbox" ${acceptedVariables.indexOf(variable) !== -1 ? 'checked': ''} data-variable="${variable}" id="label${variable}" class="select-variable"/>
                        <label for="label${variable}" class="variable-name" title="${variable}">${variable.replace('_Data available', '').length > 20 ? `${variable.replace('_Data available', '').slice(0,20)}...`: `${variable.replace('_Data available', '')}`}</label>
                    </li>`;
    });
    template += `</ul></div></br>
            <button type="submit" class="btn btn-light">Submit</button>
            <button type="reset" class="btn btn-light">Reset</button>
        </form>
    `
    document.getElementById('midsetFilterData').innerHTML = template;
    addEventConsortiumSelect();
    addEventMidsetFilterForm(data);
}

const addEventMidsetFilterForm = (data) => {
    const form = document.getElementById('midsetFilterForm');
    form.addEventListener('submit', e => {
        e.preventDefault();
        const status = document.getElementById('statusSelection').value;
        const ancestry = document.getElementById('ancestrySelection').value;
        const selectedVariables = getSelectedVariables('midsetVariables');
        const studiesSelection = getSelectedStudies().map(dt => dt.split('@#$')[1]);
        const consortiaSelection = Array.from(document.querySelectorAll(`input:checked.select-consortium`)).map(dt => dt.dataset.consortia);

        let newData = data;
        if(studiesSelection.length > 0 || consortiaSelection.length > 0) newData = newData.filter(dt => (studiesSelection.indexOf(dt['study']) !== -1 || consortiaSelection.indexOf(dt['Consortia']) !== -1 ));
        
        if(status !== 'All') {
            newData = newData.filter(dt => dt[status] === '1');
        }
        
        if(ancestry !== 'All') {
            newData = newData.filter(dt => dt[ancestry] === '1');
        }
        document.getElementById('listFilters').innerHTML = `
        <span class="font-weight-bold">Status: </span>${status.replace('status_', '')}<span class="vertical-line"></span>
        <span class="font-weight-bold">Ancestry: </span>${ancestry.replace('ethnicityClass_', '')}
        ${studiesSelection.length > 0 ? `
            <span class="vertical-line"></span><span class="font-weight-bold">Study: </span>${studiesSelection[0]} ${studiesSelection.length > 1 ? `and <span class="other-variable-count">${studiesSelection.length-1} others</span>`:``}
        `:``}
        ${selectedVariables.length > 0 ? `
            <span class="vertical-line"></span><span class="font-weight-bold">Variable: </span>${selectedVariables[0]} ${selectedVariables.length > 1 ? `and <span class="other-variable-count">${selectedVariables.length-1} others</span>`:``}
        `:``}
        `
        midset(newData, selectedVariables);
    });
};

const getSelectedVariables = (parentId) => {
    const selections = [];
    let cardBody = document.getElementById(parentId);
    const variables = cardBody.querySelectorAll('input:checked');
    Array.from(variables).forEach(el => selections.push(el.dataset.variable));
    return selections;
}

const midset = (data, acceptedVariables) => {
    let template = '';
    let plotData = [];
    let headerData = '';

    if(acceptedVariables.length === 0){
        template += 'No variable selected.';
        hideAnimation();
        document.getElementById('missingnessTable').innerHTML = template;
        return;
    }
    if(data.length > 0){
        template += '<table class="table table-hover table-borderless missingness-table table-striped"><thead class="midset-table-header">';
        const headerCount = computeHeader(data, acceptedVariables);
        headerData = headerCount;
        const result = computeSets(data, acceptedVariables);
        template += `<tr class="midset-header"><th class="missing-column"><button class="info-btn variable-definition" aria-label="More info" data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluenceMainModal"  data-variable='midsetTopBars'><i class="fas fa-question-circle cursor-pointer"></i></button></th><th class='bar-chart-cell' colspan="${Object.keys(headerCount).length}"><div id="midsetHeader"></div></th><th class="missing-column"></th></tr>`
        
        template += `<tr><th class="missing-column"></th>`
        for(let variable in headerCount) {
            template += `<th class="missing-column cell-equal-width">${numberWithCommas(headerCount[variable])}</th>`
        }
        template += `<th class="missing-column"></th></tr><tr><td class="missing-column"></td>`;
        for(let variable in headerCount) {
            template += `<th class="missing-column cell-equal-width">${variable.replace('_Data available', '')}</th>`
        }
        template += `<th class="missing-column"></th>
                    <th class="missing-column"><button class="info-btn variable-definition" aria-label="More info" data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluenceMainModal"  data-variable='midsetSideBars'><i class="fas fa-question-circle cursor-pointer"></i></button></th>
                    </tr></thead><tbody>
                    <tr>
                        <td class="missing-column set-label">
                            All subjects 
                            <button class="info-btn variable-definition" aria-label="More info" data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluenceMainModal"  data-variable='allSubjects'><i class="fas fa-question-circle cursor-pointer"></i></button>
                        </td>`;
        
        const set0 = data.length;
        acceptedVariables.forEach((variable, index) => {
            template += `<td class="missing-column">&#9898</td>`;
            if(index === acceptedVariables.length - 1) template += `<td class="missing-column">${numberWithCommas(set0)}</td><td id="midsetChart" rowspan="${Object.keys(result).length + 2}"></td>`;
        });
        template += `</tr>
                    <tr>
                        <td class="missing-column set-label">
                            Complete set 
                            <button class="info-btn variable-definition" aria-label="More info" data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluenceMainModal"  data-variable='completeSet'><i class="fas fa-question-circle cursor-pointer"></i></button>
                        </td>`;
        const set1 = setLengths(data, acceptedVariables);
        acceptedVariables.forEach((variable, index) => {
            template += `<td class="missing-column">&#9899</td>`;
            if(index === acceptedVariables.length - 1) template += `<td class="missing-column">${numberWithCommas(set1)}</td>`;
        });
        template += '</tr>';
        let ignore = '';
        acceptedVariables.forEach((v,i) => {
            if(i===0) ignore += v;
            else ignore += `@#$${v}`;
            delete result[v];
        });
        delete result[ignore];
        plotData = Object.values(result);
        plotData.unshift(set1);
        plotData.unshift(set0);

        let variableDisplayed = {};
        for(let key in result) {
            const allVariables = key.split('@#$');
            const firstVar = key.split('@#$')[0];
            template += '<tr>';
            if(variableDisplayed[firstVar] === undefined) {
                template += `<td class="missing-column set-label">${firstVar.replace('_Data available', '')}</td>`;
                variableDisplayed[firstVar] = '';
            }else {
                template += '<td class="missing-column"></td>'
            }
            acceptedVariables.forEach((variable, index) => {
                if(variable === firstVar) {
                    template += '<td class="missing-column">&#9899</td>'
                }
                else if(variable !== firstVar && allVariables.indexOf(variable) !== -1){
                    template += '<td class="missing-column">&#9899</td>'
                }
                else if(variable !== firstVar && allVariables.indexOf(variable) === -1){
                    template += '<td class="missing-column">&#9898</td>'
                }
                if(index === acceptedVariables.length - 1) {
                    template += `<td class="missing-column">${numberWithCommas(result[key])}</td>`
                }
            });
            template += '</tr>';
        }
        
        template += '<tbody></table>';
    }
    else template += 'Data not available.'
    hideAnimation();
    document.getElementById('missingnessTable').innerHTML = template;
    addEventVariableDefinitions();
    renderMidsetPlot(plotData.reverse(), 'midsetChart');
    renderMidsetHeader(acceptedVariables, Object.values(headerData), 'midsetHeader');
}

const computeNewData = (data) => {
    const [statusSelection] = getSelectedVariables('statusList');
    const studySelection = getSelectedVariables('studiesList');
    const [ancestorySelection] = getSelectedVariables('ancestoryList');
    const consortiaSelection = Array.from(document.getElementById('studiesList').querySelectorAll('[type="checkbox"]')).filter(element => element.checked === true).map(element => element.dataset.consortia);
    let newData = data;

    if(studySelection.length > 0 || consortiaSelection.length > 0) newData = newData.filter(dt => (studySelection.indexOf(dt['study']) !== -1 || consortiaSelection.indexOf(dt['Consortia']) !== -1 ));
    
    if(ancestorySelection === 'All') {
        newData = newData;
    }
    else if(ancestorySelection) newData = newData.filter(dt => dt[ancestorySelection] === '1');
    
    if(statusSelection === 'All') {
        newData = newData;
    }
    else if(statusSelection) newData = newData.filter(dt => dt[statusSelection] === '1');
    return newData;
}

const renderMidsetHeader = (x, y, id) => {
    x = x.map(dt => dt.replace('_Data available', ''))
    const data = [{
        type: 'bar',
        x,
        y,
        marker: {
            color: '#7F7F7F'
        }
    }];

    const layout = {
        xaxis: {
            autorange: true,
            showgrid: false,
            zeroline: false,
            showline: false,
            autotick: true,
            ticks: '',
            showticklabels: false,
            fixedrange: true
        },
        yaxis: {
            autorange: true,
            showgrid: false,
            showline: false,
            autotick: true,
            fixedrange: true,
            tickformat:',d'
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 0,
            pad: 0
        }
    }

    const options = {
        responsive: true, 
        displayModeBar: false,
        useResizeHandler: true,
        style: {width: "100%", height: "100%"}
    }
    Plotly.newPlot(id, data, layout, options);
}

const renderMidsetPlot = (x, id) => {
    const data = [{
        type: 'bar',
        x: x,
        hoverinfo: 'x',
        orientation: 'h',
        marker: {
            color: '#ef71a8'
        }
    }];

    const layout = {
        xaxis: {
            showgrid: false,
            zeroline: false,
            fixedrange: true,
            tickformat:',d'
        },
        yaxis: {
            autorange: true,
            showgrid: false,
            zeroline: false,
            showline: false,
            autotick: true,
            ticks: '',
            showticklabels: false,
            fixedrange: true
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 0
        }
    }

    const options = {
        responsive: true, 
        displayModeBar: false,
        useResizeHandler: true,
        style: {width: "100%", height: "100%"}
    }
    Plotly.newPlot(id, data, layout, options);
}

const computeSets = (data, acceptedVariables) => {
    let obj = {};
    const allCombinations = getCombinations(acceptedVariables);
    allCombinations.forEach(combination => {
        const setLength = setLengths(data, combination.split('@#$'));
        if(setLength > 0) {
            obj[combination] = setLength;
        }
    });
    return obj;
}

const setLengths = (data, arr) => {
    arr.forEach(variable => {
        if(variable) {
            data = data.filter(dt => dt[variable] === '1');
        }
    });
    return data.length
}

const getCombinations = (array) => {
    const result = [];
    const sets = (prefix, array) => {
        for (var i = 0; i < array.length; i++) {
            const str = `${prefix}${prefix ? '@#$': ''}${array[i]}`;
            result.push(str);
            sets(str, array.slice(i + 1));
        }
    }
    sets('', array);
    return result;
}

const computeHeader = (data, acceptedVariables) => {
    let obj = {};
    acceptedVariables.forEach(variable => {
        obj[variable] = data.filter(dt => dt[variable] === '1').length;
    });
    return obj;
}

const computeSet0 = (data, acceptedVariables) => {
    acceptedVariables.forEach(variable => {
        data = data.filter(dt => dt[variable] === '0');
    });
    return data.length
}

const dataBinning = async () => {
    const fileId = 558252350024;
    const response = await getFileJSON(fileId);
    const newArray = [];
    response.forEach(obj => {
        const age = parseInt(obj.ageInt)
        let range = '';
        if(age >= 0 && age <= 9) range = '0-9';
        if(age >= 10 && age <= 19) range = '10-19';
        if(age >= 20 && age <= 29) range = '20-29';
        if(age >= 30 && age <= 39) range = '30-39';
        if(age >= 40 && age <= 49) range = '40-49';
        if(age >= 50 && age <= 59) range = '50-59';
        if(age >= 60 && age <= 69) range = '60-69';
        if(age >= 70 && age <= 79) range = '70-79';
        if(age >= 80 && age <= 89) range = '80-89';
        if(age >= 90 && age <= 99) range = '90-99';
        if(age >= 100 && age <= 109) range = '100-109';
        if(age >= 110 && age <= 119) range = '110-119';
        newArray.push({
            consortium: obj.consortium,
            status: obj.status,
            ageInt: range,
            ethnicityClass: obj.ethnicityClass,
            famHist: obj.famHist,
            fhnumber: obj.fhnumber,
            study: obj.study,
            ER_statusIndex: obj.ER_statusIndex
        })
    })
    // uploadFile(newArray, 'summary_data.json', 100898103650);
}

const generateConfluenceSummaryLevelData = async () => {
    const fs = JSON.parse(localStorage.data_summary);
    const obj = {};
    const sentries = fs[89412660666].studyEntries;
    for(const data in sentries){
        const dentries = sentries[data].dataEntries;
        for(let ds in dentries){
            const fileEntries = dentries[ds].fileEntries;
            for(const id in fileEntries){
                obj[id] = {};
                obj[id].name = fileEntries[id].name;
                obj[id].type = 'file';
            }
        }
    }
    
    const jsonData = await convertTextToJson(obj);
    
    const summaryData = jsonData.map(data => { return { BCAC_ID: data.BCAC_ID, status: data.status, ageInt: data.ageInt, ethnicityClass: data.ethnicityClass, famHist: data.famHist, fhnumber: data.fhnumber, study: data.study, ER_statusIndex: data.ER_statusIndex}})
    uploadFile(summaryData, 'summary_data.json', 92639258921);
}

export const countSpecificStudy = (folderId) => {
    const studyOption = document.getElementById('studyOption');
    studyOption.hidden = false;
    let dataObject = JSON.parse(localStorage.data_summary);
    let studyEntries = '';
    if(dataObject[folderId]){
        studyEntries = dataObject[folderId].studyEntries;
        let studiesList = document.getElementById('studiesList');
        studiesList.innerHTML = studyDropDownTemplate(studyEntries, 'studyOptions');
        document.getElementById('studyCount').textContent = Object.keys(studyEntries).length
    };

    addEventStudiesCheckBox(dataObject, folderId);

    // Select first study by default and trigger event
    const studiesCheckBox = document.getElementsByName('studiesCheckBox');
    let index = 0;
    if(Object.keys(dataObject[folderId].studyEntries).length === 0 ) {
        hideAnimation();
        return;
    }
    if(dataObject[folderId].studyEntries && Object.keys(dataObject[folderId].studyEntries[studiesCheckBox[index].value].dataEntries).length > 0){
        studiesCheckBox[index].checked = true;
        studiesCheckBox[index].dispatchEvent(new Event('click'));
    }
    else{
        studiesCheckBox[index].checked = true;
        showError('No Data Found in this study!');
        hideAnimation();
    }
    addEventSearchStudies();

    addEventSelectAllStudies(studyEntries);
};

export const countSpecificData = async (selectedValues, studyEntries) => {
    const dataDropDown = document.getElementById('dataDropDown');
    dataDropDown.hidden = false;
    let template = '';
    let dataCounter = 0;
    let checker_obj = {};

    selectedValues.forEach(studyId => {
        const intStudyId = parseInt(studyId);
        if(studyEntries[intStudyId]){
            if(selectedValues.length === 1 && Object.keys(studyEntries[intStudyId].dataEntries).length === 0) {
                showError('No Data Found in this study!');
                hideAnimation();
                disableCheckBox(false); 
                return;
            }
            const dataEntries = studyEntries[intStudyId].dataEntries;
            dataCounter += Object.keys(dataEntries).length;
            for(let dataId in dataEntries){
                if(checker_obj[dataEntries[dataId].name.toLowerCase().trim()]) return;
                checker_obj[dataEntries[dataId].name.toLowerCase().trim()] = {};
                template += `<li>
                                <label><input type="checkbox" class="chk-box-margin" name="dataTypeCheckBox" data-study-id="${selectedValues.toString()}" value="${dataEntries[dataId].name}"/>${dataEntries[dataId].name}</label>
                            </li>`;
            }
        }
    });

    let dataTypeList = document.getElementById('dataTypeList');
    dataTypeList.innerHTML = template;

    // Add event listener to data type check box list
    addEventDataTypeCheckBox(studyEntries);
    addEventSelectAllDataType(studyEntries);
    
    // Select first data type by default and trigger event
    if(selectedValues.length > 0){
        const dataTypeCheckBox = document.getElementsByName('dataTypeCheckBox');
        dataTypeCheckBox[0] ? dataTypeCheckBox[0].checked = true : showError('No Data Found in this study!');
        dataTypeCheckBox[0] ? dataTypeCheckBox[0].dispatchEvent(new Event('click')) : '';
    }else{
        document.getElementById('dataDropDown').hidden = true;
    }
    
    document.getElementById('dataCount').textContent = dataCounter;
    
    // Data type search/filter Event
    addEventSearchDataType();
};

const getAgeDataForAllStudies = async (studyEntries) => {
    let obj = {
        age:[],
        ethnicity : []
    }
    for(const study of studyEntries){
        const studyId = study.id;
        const folderData = await getFolderItems(studyId);
        const folderEntries = folderData.entries;
        
        for(const data of folderEntries){
            if(data.name.toLowerCase().trim() === 'core data'){
                const dataId = data.id;
                const dataContent = await getFolderItems(dataId);
                const dataEntries = dataContent.entries;
                for(const fileData of dataEntries){
                    const fileId = fileData.id;
                    const fileContent = await getFile(fileId);
                    const fileDt = txt2dt(fileContent).tab;
                    obj.age = obj.age.concat(fileDt.ageInt);
                    obj.ethnicity = obj.ethnicity.concat(fileDt.ethnicityClass)
                };
            };
        };
    };
};

export const clearGraphAndParameters = () => {
    document.getElementById('dataSummaryVizBarChart').innerHTML = '';
    document.getElementById('dataSummaryVizPieChart').hidden = true;
    document.getElementById('dataSummaryVizChart2').innerHTML = '';
    document.getElementById('barChartLabel').innerHTML = '';
    document.getElementById('pieChartLabel').innerHTML = '';
    document.getElementById('statusPieChart').innerHTML = '';
}

export const unHideDivs = () => {
    document.getElementById('dataSummaryVizPieChart').hidden = false;
}
