import { addEventFilterBarToggle } from "../event.js";
import { getFile, hideAnimation, shortenText, tsv2Json, json2other } from "./../shared.js";
import { addEventToggleCollapsePanelBtn, pageSizeTemplate, dataPagination, paginationTemplate } from "./description.js";
let previousValue = '';

export const dataDictionaryTemplate = async () => {
    const data = await (await fetch('https://raw.githubusercontent.com/episphere/confluence/master/BCAC_Confluence_Extended_Dictionary_v2%2040_Oct8_2019.txt')).text();
    const tsvData = tsv2Json(data);
    const dictionary = tsvData.data;
    const headers = tsvData.headers;
    let template = `
    <div class="col-xl-2 filter-column" id="summaryFilterSiderBar">
        <div class="div-border white-bg align-left p-2">
            <div class="main-summary-row">
                <div class="col-xl-12 pl-1 pr-0">
                    <span class="font-size-17 font-bold">Filter</span>
                    <div id="filterDataDictionary" class="align-left"></div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-xl-10 padding-right-zero" id="summaryStatsCharts">
        <button id="filterBarToggle"><i class="fas fa-lg fa-caret-left"></i></button>
        <div class="main-summary-row pl-2" style="min-height: 10px;margin-bottom: 1rem;">
            <div class="col white-bg div-border align-left font-size-17" style="padding: 0.5rem;" id="listFilters">
                <span class="font-bold">Data Type:</span> All
            </div>
        </div>
        <div class="main-summary-row pl-2">
            <div class="col-xl-12 pb-2 pr-0 pl-0 white-bg div-border">
                <div class="allow-overflow" style="height: calc(100vh - 190px) !important;min-height: 500px;" id="dataDictionaryBody"></div>
            </div>
        </div>
    </div>
    `;
    document.getElementById('dataSummaryStatistics').innerHTML = template;
    renderDataDictionaryFilters(dictionary, headers);
    renderDataDictionary(dictionary, 60, headers);
    paginationHandler(dictionary, 60, headers);
    addEventFilterBarToggle();
    hideAnimation();
}

const paginationHandler = (data, pageSize, headers) => {
    const dataLength = data.length;
    const pages = Math.ceil(dataLength/pageSize);
    const array = [];

    for(let i = 0; i< pages; i++){
        array.push(i+1);
    }
    document.getElementById('pagesContainer').innerHTML = paginationTemplate(array);
    addEventPageBtns(pageSize, data, headers);
}

const addEventPageBtns = (pageSize, data, headers) => {
    const elements = document.getElementsByClassName('page-link');
    Array.from(elements).forEach(element => {
        element.addEventListener('click', () => {
            let previous = parseInt(element.dataset.previous);
            let next = parseInt(element.dataset.next);
            if(previous && !isNaN(previous) && previous === 1) previous = document.querySelectorAll('[data-page]').length + 1;
            if(next && !isNaN(next) && next === document.querySelectorAll('[data-page]').length) next = 0;
            const pageNumber = !isNaN(previous) ? previous - 1 : !isNaN(next) ? next + 1 : element.dataset.page;
            
            if(pageNumber < 1 || pageNumber > Math.ceil(data.length/pageSize)) return;
            
            if(!element.classList.contains('active-page')){
                let start = (pageNumber - 1) * pageSize;
                let end = pageNumber * pageSize;
                document.getElementById('previousPage').dataset.previous = pageNumber;
                document.getElementById('nextPage').dataset.next = pageNumber;
                renderDataDictionary(dataPagination(start,end,data), document.getElementById('pageSizeSelector').value, headers);
                Array.from(elements).forEach(ele => ele.classList.remove('active-page'));
                document.querySelector(`button[data-page="${pageNumber}"]`).classList.add('active-page');
            }
        })
    });
}

const renderDataDictionaryFilters = (dictionary, headers) => {
    const allVariableType = Object.values(dictionary).filter(dt => dt['Data Type']).map(dt => dt['Data Type']);
    const uniqueType = allVariableType.filter((d,i) => allVariableType.indexOf(d) === i);
    let template = '';
    template += `
    <div class="main-summary-row">
        <div style="width: 100%;">
            <div class="form-group" margin:0px>
                <div class="input-group">
                    <input type="search" class="form-control rounded" autocomplete="off" placeholder="Search min. 3 characters" aria-label="Search" id="searchDataDictionary" aria-describedby="search-addon" />
                    <span class="input-group-text border-0 search-input">
                        <i class="fas fa-search"></i>
                    </span>
                </div>
            </div>
        </div>
    </div>
    <div class="main-summary-row">
        <div style="width: 100%;">
            <div class="form-group" margin:0px>
                <label class="filter-label font-size-13" for="variableTypeList">Data Type</label>
                <ul class="remove-padding-left font-size-15 filter-sub-div allow-overflow" id="variableTypeList">
                `
                uniqueType.forEach(vt => {
                    template += `
                        <li class="filter-list-item">
                            <input type="checkbox" data-variable-type="${vt}" id="label${vt}" class="select-variable-type" style="margin-left: 1px !important;">
                            <label for="label${vt}" class="country-name" title="${vt}">${shortenText(vt, 60)}</label>
                        </li>
                    `
                })
                template +=`
                </ul>
            </div>
        </div>
    </div>
    `
    document.getElementById('filterDataDictionary').innerHTML = template;
    addEventFilterDataDictionary(dictionary, headers);
    downloadFiles(dictionary, headers, 'dictionary');
    document.getElementById('pageSizeContainer').innerHTML = pageSizeTemplate(dictionary, 60);
    addEventPageSizeSelection(dictionary, headers);
};

const addEventPageSizeSelection = (data, headers) => {
    const select = document.getElementById('pageSizeSelector');
    select.addEventListener('change', () => {
        const value = select.value;
        renderDataDictionary(data, value, headers)
        paginationHandler(data, value, headers)
    })
}

const addEventFilterDataDictionary = (dictionary, headers) => {
    const variableTypeSelection = document.getElementsByClassName('select-variable-type');
    Array.from(variableTypeSelection).forEach(ele => {
        ele.addEventListener('click', () => {
            filterDataBasedOnSelection(dictionary, headers)
        });
    });

    const input = document.getElementById('searchDataDictionary');
    input.addEventListener('input', () => {
        filterDataBasedOnSelection(dictionary, headers);
    })
}

const filterDataBasedOnSelection = (dictionary, headers) => {
    const highlightData = filterDataHandler(dictionary)
    const pageSize = highlightData.length < 60 ? Math.floor(highlightData.length / 10) * 10 === 0 ? 10 : Math.floor(highlightData.length / 10) * 10 : 60;
    paginationHandler(highlightData, pageSize);
    document.getElementById('pageSizeContainer').innerHTML = pageSizeTemplate(highlightData, pageSize);
    addEventPageSizeSelection(highlightData);
    renderDataDictionary(highlightData, document.getElementById('pageSizeSelector').value, headers);
}

const filterDataHandler = (dictionary) => {
    const variableTypeSelection = Array.from(document.getElementsByClassName('select-variable-type')).filter(dt => dt.checked).map(dt => dt.dataset.variableType);
    
    let filteredData = dictionary;
    if(variableTypeSelection.length > 0) {
        filteredData = filteredData.filter(dt => variableTypeSelection.indexOf(dt['Data Type']) !== -1);
    }
    if(variableTypeSelection.length === 0) filteredData = dictionary;
    
    document.getElementById('listFilters').innerHTML = `
    ${variableTypeSelection.length > 0 ? `
        <span class="font-bold">Data Type: </span>${variableTypeSelection[0]} ${variableTypeSelection.length > 1 ? `and <span class="other-variable-count">${variableTypeSelection.length-1} other</span>`:``}
    `:`
        <span class="font-bold">Data Type:</span> All`}
    `;

    const input = document.getElementById('searchDataDictionary');
    const currentValue = input.value.trim().toLowerCase();
    if(currentValue.length <= 2 && (previousValue.length > 2 || previousValue.length === 0)) {
        return filteredData;
    }
    previousValue = currentValue;
    let searchedData = JSON.parse(JSON.stringify(filteredData));
    searchedData = searchedData.filter(dt => {
        let found = false;
        if(dt['Variable'].toLowerCase().includes(currentValue)) found = true;
        if(dt['Label'].toLowerCase().includes(currentValue)) found = true;
        if(found) return dt;
    });
    let highlightData = JSON.parse(JSON.stringify(searchedData));
    highlightData.map(dt => {
        dt['Variable'] = dt['Variable'].replace(new RegExp(currentValue, 'gi'), '<b>$&</b>');
        dt['Label'] = dt['Label'].replace(new RegExp(currentValue, 'gi'), '<b>$&</b>');
        return dt;
    })
    return highlightData;
}

const addEventSortColumn = (dictionary, pageSize, headers) => {
    const btns = document.getElementsByClassName('sort-column');
    Array.from(btns).forEach(btn => {
        btn.addEventListener('click', () => {
            const columnName = btn.dataset.columnName;
            dictionary = dictionary.sort((a, b) => (a[columnName] > b[columnName]) ? 1 : ((b[columnName] > a[columnName]) ? -1 : 0))
            renderDataDictionary(dictionary, pageSize, headers)
        })
    })
}

const renderDataDictionary = (dictionary, pageSize, headers) => {
    let template = `
        <div class="row pt-md-3 pb-md-3 m-0 align-left div-sticky">
            <div class="col-md-11">
                <div class="row">
                    <div class="col-md-4 font-bold">Variable <button class="transparent-btn sort-column" data-column-name="Variable"><i class="fas fa-sort"></i></button></div>
                    <div class="col-md-5 font-bold">Label <button class="transparent-btn sort-column" data-column-name="Label"><i class="fas fa-sort"></i></button></div>
                    <div class="col-md-3 font-bold">Data Type <button class="transparent-btn sort-column" data-column-name="Data Type"><i class="fas fa-sort"></i></button></div>
                </div>
            </div>
            <div class="ml-auto"></div>
        </div>
        <div class="row m-0 align-left allow-overflow w-100">
        `
    dictionary.forEach((desc, index) => {
        if(index > pageSize ) return
        template += `
        <div class="card border-0 mt-1 mb-1 align-left w-100 pt-md-1">
            <div class="pl-3 pt-1 pr-3 pb-1" aria-expanded="false" id="heading${desc['Variable']}">
                <div class="row">
                    <div class="col-md-11">
                        <div class="row">
                            <div class="col-md-4">${desc['Variable'] ? desc['Variable'] : ''}</div>
                            <div class="col-md-5">${desc['Label'] ? desc['Label'] : ''}</div>
                            <div class="col-md-3">${desc['Data Type'] ? desc['Data Type'] : ''}</div>
                        </div>
                    </div>
                    <div class="ml-auto">
                        <div class="col-md-12"><button title="Expand/Collapse" class="transparent-btn collapse-panel-btn" data-toggle="collapse" data-target="#study${desc['Variable'].replace(/(<b>)|(<\/b>)/g, '')}"><i class="fas fa-caret-down fa-2x"></i></button></div>
                    </div>
                </div>
            </div>
            <div id="study${desc['Variable'].replace(/(<b>)|(<\/b>)/g, '')}" class="collapse" aria-labelledby="heading${desc['Variable']}">
                <div class="card-body" style="padding-left: 10px;background-color:#f6f6f6;">
                    ${desc['Category'] ? `<div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Category</div><div class="col">${desc['Category']}</div></div>`: ``}
                    ${desc['Coding'] ? `<div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Coding</div><div class="col">${desc['Coding']}</div></div>`: ``}
                    ${desc['Variable type'] ? `<div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Variable type</div><div class="col">${desc['Variable type']}</div></div>`: ``}
                    ${desc['Comment'] ? `<div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Comment</div><div class="col">${desc['Comment']}</div></div>`: ``}
                    ${desc['Confluence Variable'] ? `<div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Confluence Variable</div><div class="col">${desc['Confluence Variable']}</div></div>`: ``}
                `;
                template +=`
                </div>
            </div>
        </div>`
    });
    template += `</div>`;
    document.getElementById('dataDictionaryBody').innerHTML = template;
    addEventToggleCollapsePanelBtn();
    addEventSortColumn(dictionary, pageSize, headers);
}

export const downloadFiles = (data, headers, fileName, studyDescription) => {
    if(studyDescription) {
        let flatArray = [];
        headers.splice(headers.indexOf('PI'), 1)
        headers.splice(headers.indexOf('PI_Email'), 1)
        data.forEach(dt => {
            if(dt.pis) {
                const flatObj = {...dt};
                dt.pis.forEach((obj, index) => {
                    const piColumnName = `PI_${index+1}`;
                    const piEmailColumnName = `PI_Email_${index+1}`;
                    flatObj[piColumnName] = obj.PI;
                    flatObj[piEmailColumnName] = obj.PI_Email;
                    if(headers.indexOf(piColumnName) === -1) headers.push(piColumnName);
                    if(headers.indexOf(piEmailColumnName) === -1) headers.push(piEmailColumnName);
                });
                flatArray.push(flatObj);
            }
            else flatArray.push(dt);
        });
        data = flatArray;
    }
    const downloadDictionaryCSV = document.getElementById('downloadDictionaryCSV');
    downloadDictionaryCSV.addEventListener('click', e => {
        e.stopPropagation();
        const csvContent = "data:text/csv;charset=utf-8," + json2other(data, headers).replace(/(<b>)|(<\/b>)/g, '');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${fileName}.csv`);
        document.body.appendChild(link);
        link.click(); 
        document.body.removeChild(link);
    })

    const downloadDictionaryTSV = document.getElementById('downloadDictionaryTSV');
    downloadDictionaryTSV.addEventListener('click', e => {
        e.stopPropagation();
        let tsvContent = "data:text/tsv;charset=utf-8," + json2other(data, headers, true).replace(/(<b>)|(<\/b>)/g, '');
        const encodedUri = encodeURI(tsvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${fileName}.tsv`);
        document.body.appendChild(link);
        link.click(); 
        document.body.removeChild(link);
    })
}