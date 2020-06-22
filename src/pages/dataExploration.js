import { getFolderItems, getFile, hideAnimation, showError, disableCheckBox, convertTextToJson, uploadFile, getFileJSON, csvJSON, csv2Json, showAnimation, removeActiveClass } from '../shared.js';
import { studyDropDownTemplate } from '../components/elements.js';
import { txt2dt } from '../visualization.js';
import { addEventStudiesCheckBox, addEventDataTypeCheckBox, addEventSearchDataType, addEventSearchStudies, addEventSelectAllStudies, addEventSelectAllDataType } from '../event.js';
import { variables } from '../variables.js';

export const template = () => {
    return `
        <div class="main-summary-row data-exploration-div">
            <div class="main-summary-row statistics-row">
                <ul class="nav nav-tabs">
                    <li class="nav-item">
                        <a class="nav-link active" href="#data_exploration/summary"><strong>Summary statistics</strong></a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#data_exploration/missing"><strong>Missingness statistics</strong></a>
                    </li>
                </ul>
            </div>
        </div>
        <div class="main-summary-row" id="dataSummaryStatistics"></div>
    `;
}

export const dataSummaryStatisticsTemplate = () => `
    <div class="col-xl-2 margin-bottom">
        <div class="card sub-div-shadow">
            <div class="card-header">
                <strong class="side-panel-header">Filter 
                    <button class="info-btn" aria-label="More info" data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluenceMainModal" id="dataSummaryFilter"><i class="fas fa-question-circle cursor-pointer"></i></button>
                </strong>
            </div>
            <div id="cardContent" class="card-body">
                <div id="genderFilter" class="align-left"></div>
                <div id="chipContent" class="align-left"></div>
                <div id="studyFilter" class="align-left"></div>
            </div>
        </div>
    </div>
    <div class="col-xl-10">
        <div class="main-summary-row">
            <div class="data-exploration-charts col-xl-4">
                <div id="chartDiv7">
                    <div class="card sub-div-shadow">
                        <div class="card-header">
                            <span class="data-summary-label-wrap"><label class="dataSummary-label" id="dataSummaryVizLabel7"></label></span>
                        </div>
                        <div class="card-body viz-card-body">
                            <div class="dataSummary-chart" id="dataSummaryVizChart7"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="data-exploration-charts col-xl-4">
                <div id="chartDiv2">
                    <div class="card sub-div-shadow">
                        <div class="card-header">
                            <span class="data-summary-label-wrap"><label class="dataSummary-label" id="dataSummaryVizLabel2"></label></span>
                        </div>
                        <div class="card-body viz-card-body">
                            <div class="dataSummary-chart" id="dataSummaryVizChart2"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="data-exploration-charts col-xl-4">
                <div id="chartDiv5">
                    <div class="card sub-div-shadow">
                        <div class="card-header">
                            <span class="data-summary-label-wrap"><label class="dataSummary-label" id="dataSummaryVizLabel5"></label></span>
                        </div>
                        <div class="card-body viz-card-body">
                            <div class="dataSummary-chart" id="dataSummaryVizChart5"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="main-summary-row">
            <div class="data-exploration-charts col-xl-4">
                <div id="chartDiv3">
                    <div class="card sub-div-shadow">
                        <div class="card-header">
                            <span class="data-summary-label-wrap"><label class="dataSummary-label" id="dataSummaryVizLabel3"></label></span>
                        </div>
                        <div class="card-body viz-card-body">
                            <div class="dataSummary-chart" id="dataSummaryVizChart3"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="data-exploration-charts col-xl-4">
                <div id="chartDiv6">
                    <div class="card sub-div-shadow">
                        <div class="card-header">
                            <span class="data-summary-label-wrap"><label class="dataSummary-label" id="dataSummaryVizLabel6"></label></span>
                        </div>
                        <div class="card-body viz-card-body">
                            <div class="dataSummary-chart" id="dataSummaryVizChart6"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="data-exploration-charts col-xl-4">
                <div id="chartDiv4">
                    <div class="card sub-div-shadow">
                        <div class="card-header">
                            <span class="data-summary-label-wrap"><label class="dataSummary-label" id="dataSummaryVizLabel4"></label></span>
                        </div>
                        <div class="card-body viz-card-body">
                            <div class="dataSummary-chart" id="dataSummaryVizChart4"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`

export const dataSummaryMissingTemplate = async () => {
    const response = await getFile('653087731560');
    const {data, headers} = csv2Json(response);
    const variables = headers.filter(dt => /status_/i.test(dt) === false && /study_/i.test(dt) === false);
    const status = headers.filter(dt => /status_/i.test(dt) === true);
    const studies = headers.filter(dt => /study_/i.test(dt) === true);
    
    const div1 = document.createElement('div');
    div1.classList = ['col-lg-2'];
    div1.id = 'missingnessFilter';

    const div2 = document.createElement('div');
    div2.classList = ['col-lg-10'];
    div2.id = 'missingnessTable';

    document.getElementById('dataSummaryStatistics').appendChild(div1);
    document.getElementById('dataSummaryStatistics').appendChild(div2);

    const initialSelection = ['ER_statusIndex_Data available', 'ageInt_Data available', 'ethnicityClass_Data available', 'famHist_Data available', 'contrType_Data available']
    renderFilter(data, initialSelection.sort(), variables.sort(), status.sort(), studies.sort());
    midset(data, initialSelection.sort());
}

const renderFilter = (data, acceptedVariables, headers, status, studies) => {
    let template = '';
    template += `
    <div class="card sub-div-shadow midset-Card">
        <div class="card-header">
            <strong class="side-panel-header">Filter</strong>
        </div>
        <div class="card-body">
            <div id="midsetFilterData" class="align-left"></div>
        </div>
    </div>
    <div class="card sub-div-shadow midset-Card">
        <div class="card-header" style="white-space: nowrap;">
            <strong class="side-panel-header">Variable Selection</strong>
            <div class="filter-btn custom-margin variable-selection-total sub-div-shadow" id="selectedVariablesCount"></div>
        </div>
        <div class="card-body">
            <div id="midsetVariables" class="align-left"></div>
        </div>
    </div>
    `
    document.getElementById('missingnessFilter').innerHTML = template;
    renderMidsetVariables(data, acceptedVariables, headers);
    renderMidsetFilterData(data, acceptedVariables, headers, status, studies);
}

const renderMidsetFilterData = (data, acceptedVariables, headers, status, studies) => {
    let template = '';
    template += '<div class="row status-select">Status</div>'
    template += `<ul class="remove-padding-left" id="statusList">`;
    status.push('All');
    status.forEach(variable => {
        template += `<li class="filter-list-item">
                        <button class="${variable === 'All' ? 'active-filter ': ''}filter-btn sub-div-shadow collapsible-items filter-midset-data-status filter-midset-data-btn" data-variable="${variable}">
                            <div class="variable-name">${variable.replace(new RegExp('status_', 'i'), '')}</div>
                        </button>
                    </li>`;
    });
    template += `</ul><div class="custom-hr row"></div>`;

    template += '<div class="row study-select">Study</div>'
    template += `<ul class="remove-padding-left" id="studiesList">`;
    studies.forEach(study => {
        template += `<li class="filter-list-item">
                        <button class="filter-btn sub-div-shadow collapsible-items filter-midset-data-study filter-midset-data-btn" data-variable="${study}">
                            <div class="variable-name">${study.replace(new RegExp('study_', 'i'), '')}</div>
                        </button>
                    </li>`;
    });
    template += `</ul>`;
    document.getElementById('midsetFilterData').innerHTML = template;
    addEventFilterDataStatus(data, acceptedVariables, headers);
}

const addEventFilterDataStatus = (data) => {
    const elements = document.getElementsByClassName('filter-midset-data-status');
    Array.from(elements).forEach(element => {
        element.addEventListener('click', () => {
            if(element.classList.contains('active-filter')) return;
            removeActiveClass('filter-midset-data-status', 'active-filter')
            element.classList.add('active-filter');
            const newData = computeNewData(data);
            midset(newData, getSelectedVariables('midsetVariables'));
        })
    });

    const elements2 =  document.getElementsByClassName('filter-midset-data-study');
    Array.from(elements2).forEach(element => {
        element.addEventListener('click', () => {
            if(element.classList.contains('active-filter')) element.classList.remove('active-filter');
            else element.classList.add('active-filter');
            const newData = computeNewData(data);
            midset(newData, getSelectedVariables('midsetVariables'));
        })
    });
};

const getSelectedVariables = (parentId) => {
    const selections = [];
    const cardBody = document.getElementById(parentId);
    const variables = cardBody.querySelectorAll('.active-filter');
    Array.from(variables).forEach(el => selections.push(el.dataset.variable));
    return selections;
}

const renderMidsetVariables = (data, acceptedVariables, headers) => {
    let template = '';
    template += `<ul class="remove-padding-left">`;
    headers.forEach(variable => {
        template += `<li class="filter-list-item">
                        <button class="row collapsible-items filter-midset-variable filter-midset-variable-btn ${acceptedVariables.indexOf(variable) !== -1 ? 'active-filter' : ''}" data-variable="${variable}">
                            <div class="variable-name">${variable.replace('_Data available', '')}</div>
                        </button>
                    </li>`;
    });
    template += `</ul>`;
    document.getElementById('midsetVariables').innerHTML = template;
    addEventFilterMidset(data, headers);
}

const addEventFilterMidset = (data, headers) => {
    const elements = document.getElementsByClassName('filter-midset-variable');
    Array.from(elements).forEach(element => {
        element.addEventListener('click', () => {
            if(element.classList.contains('active-filter')) element.classList.remove('active-filter');
            else element.classList.add('active-filter');
            const newData = computeNewData(data);
            midset(newData, getSelectedVariables('midsetVariables'), headers);
        });
    });
}

const midset = (data, acceptedVariables) => {
    let template = '';
    let plotData = [];
    let headerData = '';
    document.getElementById('selectedVariablesCount').innerHTML = acceptedVariables.length;
    if(acceptedVariables.length === 0){
        template += 'No variable selected.';
        hideAnimation();
        document.getElementById('missingnessTable').innerHTML = template;
        return;
    }
    if(data.length > 0){
        template += '<table class="table table-hover table-borderless missingness-table table-striped sub-div-shadow"><thead class="midset-table-header">';
        const headerCount = computeHeader(data, acceptedVariables);
        headerData = headerCount;
        const result = computeSets(data, acceptedVariables);
        template += `<tr class="midset-header"><th class="missing-column"></th><th class='bar-chart-cell' colspan="${Object.keys(headerCount).length}"><div id="midsetHeader"></div></th><th class="missing-column"></th></tr>`
        
        template += `<tr><th class="missing-column"></th>`
        for(let variable in headerCount) {
            template += `<th class="missing-column cell-equal-width">${headerCount[variable]}</th>`
        }
        template += `<th class="missing-column"></th></tr><tr><td class="missing-column"></td>`;
        for(let variable in headerCount) {
            template += `<th class="missing-column cell-equal-width">${variable.replace('_Data available', '')}</th>`
        }
        template += '<th></th></tr></thead><tbody><tr><td class="missing-column set-label">No set</td>';
        
        const set0 = data.length;
        acceptedVariables.forEach((variable, index) => {
            template += `<td class="missing-column">&#9898</td>`;
            if(index === acceptedVariables.length - 1) template += `<td class="missing-column">${set0}</td><td id="midsetChart" rowspan="${Object.keys(result).length + 2}"></td>`;
        });
        template += '</tr><tr><td class="missing-column set-label">All set</td>';
        const set1 = setLengths(data, acceptedVariables);
        acceptedVariables.forEach((variable, index) => {
            template += `<td class="missing-column">&#9899</td>`;
            if(index === acceptedVariables.length - 1) template += `<td class="missing-column">${set1}</td>`;
        });
        template += '</tr>';
        let ignore = '';
        acceptedVariables.forEach((v,i) => {
            if(i===0) ignore += v;
            else ignore += `@#$${v}`;
        });
        delete result[ignore];
        plotData = Object.values(result);
        plotData.unshift(set1);
        plotData.unshift(set0);

        let variableDisplayed = {};
        for(let key in result) {
            const allVariables = key.split('@#$');
            const firstVar = key.split('@#$')[0];
            if(allVariables.length !== acceptedVariables.length) {
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
                        template += `<td class="missing-column">${result[key]}</td>`
                    }
                });
                template += '</tr>';
            }
        }
        
        template += '<tbody></table>';
    }
    hideAnimation();
    document.getElementById('missingnessTable').innerHTML = template;
    renderMidsetPlot(plotData.reverse(), 'midsetChart');
    renderMidsetHeader(acceptedVariables, Object.values(headerData), 'midsetHeader');
}

const computeNewData = (data) => {
    const [statusSelection] = getSelectedVariables('statusList');
    const studySelection = getSelectedVariables('studiesList');
    
    let newData = [];
    studySelection.forEach(variable => {
        newData = [...new Set([...newData , ...data.filter(dt => dt[variable] === '1')])]
    });
    if(newData.length === 0) newData = data;
    if(statusSelection === 'All') {
        newData = newData;
    }
    else if(statusSelection) newData = newData.filter(dt => dt[statusSelection] === '1');
    if(newData.length === 0) newData = data;
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
            fixedrange: true
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
