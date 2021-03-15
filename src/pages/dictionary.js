import { addEventFilterBarToggle } from "../event.js";
import { getFile, hideAnimation, shortenText, tsv2Json } from "./../shared.js";
import { addEventToggleCollapsePanelBtn, pageSizeTemplate, dataPagination, paginationTemplate } from "./description.js";
let previousValue = '';

export const dataDictionaryTemplate = async () => {
    const data = await getFile(774486143425);
    const dictionary = tsv2Json(data).data;
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
        <div class="main-summary-row" style="min-height: 10px;padding-left: 15px;margin-bottom: 1rem;">
            <div class="col white-bg div-border align-left font-size-17" style="padding: 0.5rem;" id="listFilters">
                <span class="font-bold">Data Type:</span> All
            </div>
        </div>
        <div class="main-summary-row pl-3">
            <div class="col-xl-12 pb-2 pr-0 pl-0 white-bg div-border">
                <div class="p-2 allow-overflow" style="height: calc(100vh - 190px) !important;min-height: 500px;" id="dataDictionaryBody"></div>
            </div>
        </div>
    </div>
    `;
    document.getElementById('dataSummaryStatistics').innerHTML = template;
    renderDataDictionaryFilters(dictionary);
    renderDataDictionary(dictionary, 60);
    paginationHandler(dictionary, 60);
    addEventFilterBarToggle();
    hideAnimation();
}

const paginationHandler = (data, pageSize) => {
    const dataLength = data.length;
    const pages = Math.ceil(dataLength/pageSize);
    const array = [];

    for(let i = 0; i< pages; i++){
        array.push(i+1);
    }
    document.getElementById('pagesContainer').innerHTML = paginationTemplate(array);
    addEventPageBtns(pageSize, data);
}

const addEventPageBtns = (pageSize, data) => {
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
                renderDataDictionary(dataPagination(start,end,data), document.getElementById('pageSizeSelector').value);
                Array.from(elements).forEach(ele => ele.classList.remove('active-page'));
                document.querySelector(`button[data-page="${pageNumber}"]`).classList.add('active-page');
            }
        })
    });
}

const renderDataDictionaryFilters = (dictionary) => {
    const allVariableType = Object.values(dictionary).map(dt => dt['Data Type']);
    const uniqueType = allVariableType.filter((d,i) => allVariableType.indexOf(d) === i).sort();

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

    addEventFilterDataDictionary(dictionary);
    document.getElementById('pageSizeContainer').innerHTML = pageSizeTemplate(dictionary, 60);
    addEventPageSizeSelection(dictionary);
};

const addEventPageSizeSelection = (data) => {
    const select = document.getElementById('pageSizeSelector');
    select.addEventListener('change', () => {
        const value = select.value;
        renderDataDictionary(data, value)
        paginationHandler(data, value)
    })
}

const addEventFilterDataDictionary = (dictionary) => {
    const variableTypeSelection = document.getElementsByClassName('select-variable-type');
    Array.from(variableTypeSelection).forEach(ele => {
        ele.addEventListener('click', () => {
            filterDataBasedOnSelection(dictionary)
        });
    });

    const input = document.getElementById('searchDataDictionary');
    input.addEventListener('input', () => {
        filterDataBasedOnSelection(dictionary);
    })
}

const filterDataBasedOnSelection = (dictionary) => {
    const variableTypeSelection = Array.from(document.getElementsByClassName('select-variable-type')).filter(dt => dt.checked).map(dt => dt.dataset.variableType);
    
    let filteredData = dictionary;
    if(variableTypeSelection.length > 0) {
        filteredData = filteredData.filter(dt => variableTypeSelection.indexOf(dt['Data Type']) !== -1);
    }

    if(variableTypeSelection.length === 0) filteredData = dictionary;
    
    document.getElementById('listFilters').innerHTML = `
    ${variableTypeSelection.length > 0 ? `
        <span class="font-bold">Data Type: </span>${variableTypeSelection[0]} ${variableTypeSelection.length > 1 ? `and <span class="other-variable-count">${variableTypeSelection.length-1} other</span>`:``}
    `:`<span class="font-bold">Data Type:</span> All`}
    `;

    const input = document.getElementById('searchDataDictionary');
    const currentValue = input.value.trim().toLowerCase();
    if(currentValue.length <= 2 && (previousValue.length > 2 || previousValue.length === 0)) {
        renderDataDictionary(filteredData, document.getElementById('pageSizeSelector').value);
        paginationHandler(filteredData, document.getElementById('pageSizeSelector').value);
        document.getElementById('pageSizeContainer').innerHTML = pageSizeTemplate(filteredData, 60);
        addEventPageSizeSelection(filteredData);
        return;
    }
    previousValue = currentValue;
    let searchedData = JSON.parse(JSON.stringify(filteredData));
    searchedData = searchedData.filter(dt => {
        let found = false;
        if(dt['Variable'].toLowerCase().includes(currentValue)) found = true;
        if(dt['Label'].toLowerCase().includes(currentValue)) found = true;
        if(found) return dt;
    })
    searchedData = searchedData.map(dt => {
        dt['Variable'] = dt['Variable'].replace(new RegExp(currentValue, 'gi'), '<b>$&</b>');
        dt['Label'] = dt['Label'].replace(new RegExp(currentValue, 'gi'), '<b>$&</b>');
        return dt;
    })

    renderDataDictionary(searchedData, document.getElementById('pageSizeSelector').value);
    paginationHandler(searchedData, document.getElementById('pageSizeSelector').value);
    document.getElementById('pageSizeContainer').innerHTML = pageSizeTemplate(searchedData, 60);
    addEventPageSizeSelection(searchedData);
}

const addEventSortColumn = (dictionary, pageSize) => {
    const btns = document.getElementsByClassName('sort-column');
    Array.from(btns).forEach(btn => {
        btn.addEventListener('click', () => {
            const columnName = btn.dataset.columnName;
            dictionary = dictionary.sort((a, b) => (a[columnName] > b[columnName]) ? 1 : ((b[columnName] > a[columnName]) ? -1 : 0))
            renderDataDictionary(dictionary, pageSize)
        })
    })
}

const renderDataDictionary = (dictionary, pageSize) => {
    let template = `
        <div class="row m-0 pt-md-1 align-left">
            <div class="col-md-3 font-bold">Variable <button class="transparent-btn sort-column" data-column-name="Variable"><i class="fas fa-sort"></i></button></div>
            <div class="col-md-4 font-bold">Label <button class="transparent-btn sort-column" data-column-name="Label"><i class="fas fa-sort"></i></button></div>
            <div class="col-md-4 font-bold">Data Type <button class="transparent-btn sort-column" data-column-name="Data Type"><i class="fas fa-sort"></i></button></div>
            <div class="col-md-1"></div>
        </div>`

    dictionary.forEach((desc, index) => {
        if(index > pageSize ) return
        template += `
        <div class="card mt-1 mb-1 align-left">
            <div style="padding: 10px" aria-expanded="false" id="heading${desc['Variable']}">
                <div class="row">
                    <div class="col-md-3">${desc['Variable'] ? desc['Variable'] : ''}</div>
                    <div class="col-md-4">${desc['Label'] ? desc['Label'] : ''}</div>
                    <div class="col-md-4">${desc['Data Type'] ? desc['Data Type'] : ''}</div>
                    <div class="col-md-1"><button title="Expand/Collapse" class="transparent-btn collapse-panel-btn" data-toggle="collapse" data-target="#study${desc['Variable']}"><i class="fas fa-caret-down fa-2x"></i></button></div>
                </div>
            </div>
            <div id="study${desc['Variable']}" class="collapse" aria-labelledby="heading${desc['Variable']}">
                <div class="card-body" style="padding-left: 10px;background-color:#f6f6f6;">
                    ${desc['Category'] ? `<div class="row mb-1"><div class="col-md-2 font-bold">Category</div><div class="col">${desc['Category']}</div></div>`: ``}
                    ${desc['Coding'] ? `<div class="row mb-1"><div class="col-md-2 font-bold">Coding</div><div class="col">${desc['Coding']}</div></div>`: ``}
                    ${desc['Variable type'] ? `<div class="row mb-1"><div class="col-md-2 font-bold">Variable type</div><div class="col">${desc['Variable type']}</div></div>`: ``}
                    ${desc['Comment'] ? `<div class="row mb-1"><div class="col-md-2 font-bold">Comment</div><div class="col">${desc['Comment']}</div></div>`: ``}
                    ${desc['Confluence Variable'] ? `<div class="row mb-1"><div class="col-md-2 font-bold">Confluence Variable</div><div class="col">${desc['Confluence Variable']}</div></div>`: ``}
                `;
                template +=`
                </div>
            </div>
        </div>`
    });
    document.getElementById('dataDictionaryBody').innerHTML = template;
    addEventToggleCollapsePanelBtn();
    addEventSortColumn(dictionary, pageSize);
}