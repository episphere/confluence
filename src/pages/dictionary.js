import { addEventFilterBarToggle } from "../event.js";
import { getFile, hideAnimation, shortenText, tsv2Json } from "./../shared.js"
import { addEventToggleCollapsePanelBtn } from "./description.js"

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
                <span class="font-bold">Gender:</span> All<span class="vertical-line"></span>
                <span class="font-bold">Genotyping chip:</span> All Arrays
            </div>
        </div>
        <div class="main-summary-row pl-3">
            <div class="col-xl-12 pb-2 pr-0 white-bg div-border">
                <div class="p-2 allow-overflow" style="height: calc(100vh - 190px) !important;min-height: 500px;" id="dataDictionaryBody"></div>
            </div>
        </div>
    </div>
    `;
    document.getElementById('dataSummaryStatistics').innerHTML = template;
    renderDataDictionaryFilters(dictionary);
    renderDataDictionary(dictionary, 20);
    addEventFilterBarToggle();
    addEventSortColumn(dictionary, 20);
    hideAnimation();
}

const renderDataDictionaryFilters = (dictionary) => {
    const allVariableType = Object.values(dictionary).map(dt => dt['Variable type']);
    const uniqueType = allVariableType.filter((d,i) => allVariableType.indexOf(d) === i).sort();
    
    let template = '';
    template += `
    <div class="main-summary-row">
        <div style="width: 100%;">
            <div class="form-group" margin:0px>
                <label class="filter-label font-size-13" for="variableTypeList">Variable type</label>
                <ul class="remove-padding-left font-size-15 filter-sub-div allow-overflow" id="variableTypeList">
                `
                uniqueType.forEach(vt => {
                    template += `
                        <li class="filter-list-item">
                            <input type="checkbox" data-variable-type="${vt}" id="label${vt}" class="select-variable-type" style="margin-left: 1px !important;">
                            <label for="label${vt}" class="country-name" title="${vt}">${shortenText(vt, 20)}</label>
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
            <div class="col-md-4 font-bold">Variable type <button class="transparent-btn sort-column" data-column-name="Variable type"><i class="fas fa-sort"></i></button></div>
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
                    <div class="col-md-4">${desc['Variable type'] ? desc['Variable type'] : ''}</div>
                    <div class="col-md-1"><button title="Expand/Collapse" class="transparent-btn collapse-panel-btn" data-toggle="collapse" data-target="#study${desc['Variable']}"><i class="fas fa-caret-down fa-2x"></i></button></div>
                </div>
            </div>
            <div id="study${desc['Variable']}" class="collapse" aria-labelledby="heading${desc['Variable']}">
                <div class="card-body" style="padding-left: 10px;background-color:#f6f6f6;">
                    ${desc['Confluence Variable'] ? `<div class="row mb-1"><div class="col-md-2 font-bold">Confluence Variable</div><div class="col">${desc['Confluence Variable']}</div></div>`: ``}
                    ${desc['Category'] ? `<div class="row mb-1"><div class="col-md-2 font-bold">Category</div><div class="col">${desc['Category']}</div></div>`: ``}
                    ${desc['Coding'] ? `<div class="row mb-1"><div class="col-md-2 font-bold">Coding</div><div class="col">${desc['Coding']}</div></div>`: ``}
                    ${desc['Comment'] ? `<div class="row mb-1"><div class="col-md-2 font-bold">Comment</div><div class="col">${desc['Comment']}</div></div>`: ``}
                `;
                template +=`
                </div>
            </div>
        </div>`
    });
    document.getElementById('dataDictionaryBody').innerHTML = template;
    addEventToggleCollapsePanelBtn();
}