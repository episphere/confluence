import { addEventFilterBarToggle } from "../event.js";
import { csv2Json, defaultPageSize, getFile, shortenText, tsv2Json, emailsAllowedToUpdateData, getFileXLSX, array2Json, getFolderItems, hideAnimation, uploadFileVersion,uploadFileVersion2, showAnimation } from "./../shared.js";
import { downloadFiles } from "./dictionary.js";
let previousValue = '';

export const renderDescription = (modified_at) => {
    let authAdmin = emailsAllowedToUpdateData.includes(JSON.parse(localStorage.parms).login);
    let template = `
    <div class="main-summary-row">
            <div class="row align-left w-100 m-0">
                <h1 class="col page-header pl-0 pt-2">Learn about Confluence</h1>
                ${authAdmin ? (`<button type="button" class="col-auto btn btn-primary mt-3 mb-3" title="Update Study Descriptions Based on Files in Box" id="updateDesc">Update Descriptions</button>`) :''}
                <div class="col-auto allow-overflow mr-2" style="margin:1rem 0" id="pagesContainer"></div>
                <div class="col-auto mt-3 mb-3 mr-2" id="pageSizeContainer"></div>
                <div class="col-auto mt-3 mb-3" id="downloadContainer">
                    <div class="col-md-12 p-0 dropdown">
                        <div class="grid-elements">
                            <button title="Download" class="form-control dropdown-toggle download-btn" type="button" data-bs-toggle="dropdown" id="downloadDictionary" aria-expanded="false">
                                Download <i class="fas fa-download" style="color:#000000 !important"></i>
                            </button>
                            <ul class="dropdown-menu navbar-dropdown" aria-labelledby="downloadDictionary">
                                <li><button class="transparent-btn dropdown-item dropdown-menu-links" title="Download dictionary as csv" id="downloadDictionaryCSV">CSV</button></li>
                                <li><button class="transparent-btn dropdown-item dropdown-menu-links" title="Download dictionary as tsv" id="downloadDictionaryTSV">TSV</button></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="main-summary-row">
            <div class="col-xl-2 filter-column black-font" id="summaryFilterSiderBar">
                <div class="div-border white-bg align-left p-2">
                    <div class="main-summary-row">
                        <div class="col-xl-12 pl-1 pr-0">
                            <span class="font-size-17 font-bold">Filter</span>
                            <div id="filterDataCatalogue" class="align-left"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-10 padding-right-zero padding-left-1 position-relative" id="summaryStatsCharts">
                <button id="filterBarToggle"><i class="position-absolute fas fa-2x fa-caret-left"></i></button>
                <div class="main-summary-row pl-2" style="min-height: 10px;margin-bottom: 1rem;">
                    <div class="col white-bg div-border align-left font-size-17" style="padding: 0.5rem;" id="listFilters">
                        <span class="font-bold">Consortium:</span> All
                        <span class="vertical-line"></span>
                        <span class="font-bold">Study design:</span> All
                        <span class="vertical-line"></span>
                        <span class="font-bold">Country:</span> All
                    </div>
                </div>
                <div class="main-summary-row pl-2">
                    <div class="col-xl-12 pb-2 ps-0 pe-0 white-bg div-border">
                        <div class="allow-overflow" style="height: calc(100vh - 190px) !important;min-height: 500px;" id="descriptionBody"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="main-summary-row">
            <div class="offset-xl-2 col data-last-modified align-left mt-3 mb-0 pl-4" id="dataLastModified">
                Data last modified at - ${new Date(modified_at).toLocaleString()}
            </div>
        </div>
    `;
    document.getElementById('overview').innerHTML = template;
    getDescription();
    updateDesc();
}

const getDescription = async () => {
    const data = await getFile(1673495829037);//1072836692276);//761599566277)//1077912734937;1673495829037
    //const datatest = await getFile(1673495829037);
   // const tsv2json = tsv2Json(data);
    //console.log(tsv2json);
    const json = JSON.parse(data);
    const headers = getAllKeys(json);
    console.log(json);
    console.log(headers);
    //console.log(tsv2json);
    //const tsv2json = csv2Json(data);
    //const json = tsv2json.data;
    //console.log(json);
    //console.log(json);
    //const headers = tsv2json.headers;
    let newJsons = {};
    let prevAcronym = '';
    json.forEach(obj => {
        if(obj['Consortium']) obj['Consortium'] = obj['Consortium'].trim();
        if(obj['Study Acronym']) obj['Study Acronym'] = obj['Study Acronym'].trim();
        const consortium = obj['Consortium'] ? obj['Consortium'] : undefined;
        const studyAcronym = obj['Study Acronym'] ? obj['Study Acronym'] : undefined;
        if(studyAcronym && newJsons[`${consortium}${studyAcronym}`] === undefined) newJsons[`${consortium}${studyAcronym}`] = {}
        if(studyAcronym) {
            prevAcronym = `${consortium}${studyAcronym}`;
            newJsons[`${consortium}${studyAcronym}`] = obj;
            if(newJsons[`${consortium}${studyAcronym}`].pis === undefined) newJsons[`${consortium}${studyAcronym}`].pis = [];
            newJsons[`${consortium}${studyAcronym}`].pis.push({PI: obj['PI'], PI_Email: obj['PI_Email']})
            delete newJsons[`${consortium}${studyAcronym}`]['PI']
            delete newJsons[`${consortium}${studyAcronym}`]['PI_Email']
        }
        else {
            newJsons[prevAcronym].pis.push({PI: obj['PI'], PI_Email: obj['PI_Email']})
        }
    });
    
    const allCountries = [];
    Object.values(newJsons).forEach(dt => {
        if(dt['Country'] === undefined) return;
        dt['Country'].split(/,|;/).forEach(ctr => {
            ctr.split(' and ').forEach(c => {
                if(c.trim()) allCountries.push(c.trim())
            });
        })
    });
    const allStudyDesigns = Object.values(newJsons).filter(dt => dt['Study design'] !== undefined).map(dt => dt['Study design']);
    const allConsortium = Object.values(newJsons).map(dt => dt['Consortium']);
    
    const countries = allCountries.filter((d,i) => allCountries.indexOf(d) === i).sort();
    const uniqueConsortium = allConsortium.filter((d,i) => d && allConsortium.indexOf(d.trim()) === i).sort();
    const uniqueStudyDesign = allStudyDesigns.filter((d,i) => allStudyDesigns.indexOf(d) === i).sort();
    
    let filterTemplate = `
        <div class="main-summary-row">
            <div style="width: 100%;">
                <div class="form-group" margin:0px>
                    <div id="searchContainer"></div>
                </div>
            </div>
        </div>
        <div class="main-summary-row">
            <div style="width: 100%;">
                <div class="form-group" margin:0px>
                    <label class="filter-label font-size-13" for="consortiumList">Consortium</label>
                    <ul class="remove-padding-left font-size-15 filter-sub-div allow-overflow" id="consortiumList">
                    `
                    uniqueConsortium.forEach(consortium => {
                        filterTemplate += `
                            <li class="filter-list-item">
                                <input type="checkbox" data-consortium="${consortium}" id="label${consortium}" class="select-consortium" style="margin-left: 1px !important;">
                                <label for="label${consortium}" class="country-name" title="${consortium}">${consortium === 'NCI' ? 'C-NCI':shortenText(consortium, 15)}</label>
                            </li>
                        `
                    })
        filterTemplate +=`
                    </ul>
                </div>
            </div>
        </div>
        <div class="main-summary-row">
            <div style="width: 100%;">
                <div class="form-group" margin:0px>
                    <label class="filter-label font-size-13" for="studyDesignList">Study Design</label>
                    <ul class="remove-padding-left font-size-15 filter-sub-div allow-overflow" id="studyDesignList">
                    `
                    uniqueStudyDesign.forEach(sd => {
                        filterTemplate += `
                            <li class="filter-list-item">
                                <input type="checkbox" data-study-design="${sd}" id="label${sd}" class="select-study-design" style="margin-left: 1px !important;">
                                <label for="label${sd}" class="country-name" title="${sd}">${shortenText(sd, 25)}</label>
                            </li>
                        `
                    })
        filterTemplate +=`
                    </ul>
                </div>
            </div>
        </div>
        <div class="main-summary-row">
            <div style="width: 100%;">
                <div class="form-group" margin:0px>
                    <label class="filter-label font-size-13" for="countriesList">Country</label>
                    <ul class="remove-padding-left font-size-15 filter-sub-div allow-overflow" id="countriesList">
                        `
        countries.forEach(country => {
            filterTemplate += `
                <li class="filter-list-item">
                    <input type="checkbox" data-country="${country}" id="label${country}" class="select-country" style="margin-left: 1px !important;">
                    <label for="label${country}" class="country-name" title="${country}">${shortenText(country, 15)}</label>
                </li>
            `
        })
        filterTemplate +=`
                    </ul>
                </div>
            </div>
        </div>
    `;
    document.getElementById('filterDataCatalogue').innerHTML = filterTemplate;
    const descriptions = Object.values(newJsons);
    document.getElementById('searchContainer').innerHTML = `
    <div class="input-group">
        <input type="search" class="form-control rounded" autocomplete="off" placeholder="Search min. 3 characters" aria-label="Search" id="searchDataCatalog" aria-describedby="search-addon" />
    </div>
    `;
    addEventFilterDataCatalogue(descriptions, headers);
    downloadFiles(descriptions, headers, 'study_description', true);
    renderStudyDescription(descriptions, defaultPageSize, headers);
    paginationHandler(descriptions, defaultPageSize, headers);
    document.getElementById('pageSizeContainer').innerHTML = pageSizeTemplate(descriptions, defaultPageSize);
    addEventPageSizeSelection(descriptions, headers);
    addEventFilterBarToggle();
};

const renderStudyDescription = (descriptions, pageSize, headers) => {
    let template = '';
    //console.log(descriptions);
    if(descriptions.length > 0) {
        template = `
        <div class="row pt-md-3 pb-md-3 m-0 align-left div-sticky">
            <div class="col-md-12">
                <div class="row ps-3 pe-5">
                    <div class="col-md-2 font-bold ws-nowrap">Consortium <button class="transparent-btn sort-column" data-column-name="Consortium"><i class="fas fa-sort"></i></button></div>
                    <div class="col-md-4 font-bold ws-nowrap">Study <button class="transparent-btn sort-column" data-column-name="Study Name"><i class="fas fa-sort"></i></button></div>
                    <div class="col-md-2 font-bold ws-nowrap">Study Acronym <button class="transparent-btn sort-column" data-column-name="Study Acronym"><i class="fas fa-sort"></i></button></div>
                    <div class="col-md-2 font-bold ws-nowrap">Study Design <button class="transparent-btn sort-column" data-column-name="Study design"><i class="fas fa-sort"></i></button></div>
                    <div class="col-md-2 font-bold ws-nowrap">Country <button class="transparent-btn sort-column" data-column-name="Country"><i class="fas fa-sort"></i></button></div>
                </div>
            </div>
        </div>
        <div class="row m-0 align-left allow-overflow w-100">
            <div class="accordion accordion-flush col-md-12" id="dictionaryAccordian">`
        descriptions.forEach((desc, index) => {
            //console.log(desc);
            if(index > pageSize ) return
            template += `
            <div class="accordion-item">
                <h2 class="accordion-header" id="flush-headingOne">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#heading${desc['Study Acronym'].replace(/(<b>)|(<\/b>)/g, '')}" aria-expanded="false" aria-controls="heading${desc['Study Acronym'].replace(/(<b>)|(<\/b>)/g, '')}">
                        <div class="col-md-2">${desc['Consortium']==='NCI' ? 'C-NCI':desc['Consortium'] ? desc['Consortium'] : ''}</div>
                        <div class="col-md-4">${desc['Study Name'] ? desc['Study Name'] : ''}</div>
                        <div class="col-md-2">${desc['Study Acronym'] ? desc['Study Acronym'] : ''}</div>
                        <div class="col-md-2">${desc['Study design'] ? desc['Study design'] : ''}</div>
                        <div class="col-md-2">${desc['Country'] ? desc['Country'] : ''}</div>
                    </button>
                </h2>
                <div id="heading${desc['Study Acronym'].replace(/(<b>)|(<\/b>)/g, '')}" class="accordion-collapse collapse" aria-labelledby="flush-headingOne">
                    <div class="accordion-body">
                        ${desc['Case definition'] ? `<div class="row mb-1"><div class="col-md-2 font-bold">Case Definition</div><div class="col">${desc['Case definition']}</div></div>`: ``}
                        ${desc['Control definition'] ? `<div class="row mb-1"><div class="col-md-2 font-bold">Control Definition</div><div class="col">${desc['Control definition']}</div></div>`: ``}
                        ${desc['References'] ? `<div class="row mb-1"><div class="col-md-2 font-bold">References</div><div class="col">${desc['References']}</div></div>`: ``}
                        ${desc['Male Case definition'] ? `<div class="row mb-1"><div class="col-md-2 font-bold">Male Case definition</div><div class="col">${desc['Male Case definition']}</div></div>`: ``}
                        ${desc['Male Control definition'] ? `<div class="row mb-1"><div class="col-md-2 font-bold">Male Control definition</div><div class="col">${desc['Male Control definition']}</div></div>`: ``}
                        ${desc['Description of Ascertainment Process or details of study design male participants'] ? `<div class="row mb-1"><div class="col-md-2 font-bold">Ascertainment Process for Male Participants</div><div class="col">${desc['Description of Ascertainment Process or details of study design male participants']}</div></div>`: ``}
                        ${desc['Female Case definition'] ? `<div class="row mb-1"><div class="col-md-2 font-bold">Female Case definition</div><div class="col">${desc['Female Case definition']}</div></div>`: ``}
                        ${desc['Female Control definition'] ? `<div class="row mb-1"><div class="col-md-2 font-bold">Female Control definition</div><div class="col">${desc['Female Control definition']}</div></div>`: ``}
                        ${desc['Description of Ascertainment Process or details of study design female participants'] ? `<div class="row mb-1"><div class="col-md-2 font-bold">Ascertainment Process for Female Participants</div><div class="col">${desc['Description of Ascertainment Process or details of study design female participants']}</div></div>`: ``}
                    `
                    if(desc['pis'].length > 0) {
                        desc['pis'].forEach(info => {
                            template += `<div class="row"><div class="col-md-2 font-bold">PI</div><div class="col">${info['PI']} (<a href="mailto:${info['PI_Email']}">${info['PI_Email']}</a>)</div></div>`
                        })
                    }
                    template +=`
                    </div>
                </div>
            </div>`
        });
    }
    else {
        template += 'Data not found!'
    }
    document.getElementById('descriptionBody').innerHTML = template;
    addEventToggleCollapsePanelBtn();
    addEventSortColumn(descriptions, pageSize, headers);
}

const addEventSortColumn = (descriptions, pageSize, headers) => {
    const btns = document.getElementsByClassName('sort-column');
    Array.from(btns).forEach(btn => {
        btn.addEventListener('click', () => {
            const columnName = btn.dataset.columnName;
            descriptions = descriptions.sort((a, b) => (a[columnName] > b[columnName]) ? 1 : ((b[columnName] > a[columnName]) ? -1 : 0))
            renderStudyDescription(descriptions, pageSize, headers)
        })
    })
}

const addEventFilterDataCatalogue = (descriptions, headers) => {
    const consortiumTypeSelection = document.getElementsByClassName('select-consortium');
    Array.from(consortiumTypeSelection).forEach(ele => {
        ele.addEventListener('click', () => {
            filterDataBasedOnSelection(descriptions, headers)
        });
    });

    const studyDesignSelection = document.getElementsByClassName('select-study-design');
    Array.from(studyDesignSelection).forEach(ele => {
        ele.addEventListener('click', () => {
            filterDataBasedOnSelection(descriptions, headers)
        });
    });

    const countrySelection = document.getElementsByClassName('select-country');
    Array.from(countrySelection).forEach(ele => {
        ele.addEventListener('click', () => {
            filterDataBasedOnSelection(descriptions, headers);
        });
    });
    const input = document.getElementById('searchDataCatalog');
    input.addEventListener('input', () => {
        filterDataBasedOnSelection(descriptions, headers);
    })
}

export const addEventToggleCollapsePanelBtn = () => {
    const btns = document.getElementsByClassName('collapse-panel-btn');
    Array.from(btns).forEach(btn => {
        btn.addEventListener('click', () => {
            if(btn.querySelector('.fas.fa-2x').classList.contains('fa-caret-down')) {
                btn.querySelector('.fas.fa-2x').classList.remove('fa-caret-down')
                btn.querySelector('.fas.fa-2x').classList.add('fa-caret-up')
            }
            else {
                btn.querySelector('.fas.fa-2x').classList.remove('fa-caret-up')
                btn.querySelector('.fas.fa-2x').classList.add('fa-caret-down')
            }
        })
    })
}

const filterDataBasedOnSelection = (descriptions, headers) => {
    const consortiumSelected = Array.from(document.getElementsByClassName('select-consortium')).filter(dt => dt.checked).map(dt => dt.dataset.consortium);
    const studyDesignSelected = Array.from(document.getElementsByClassName('select-study-design')).filter(dt => dt.checked).map(dt => dt.dataset.studyDesign);
    const countrySelected = Array.from(document.getElementsByClassName('select-country')).filter(dt => dt.checked).map(dt => dt.dataset.country);
    
    let filteredData = descriptions

    if(consortiumSelected.length > 0) {
        filteredData = filteredData.filter(dt => consortiumSelected.indexOf(dt['Consortium']) !== -1);
    }

    if(studyDesignSelected.length > 0) {
        filteredData = filteredData.filter(dt => studyDesignSelected.indexOf(dt['Study design']) !== -1);
    }
    if(countrySelected.length > 0) {
        filteredData = filteredData.filter(dt => {
            let found = false
            countrySelected.forEach(ctr => {
                if(dt['Country'] === undefined) return;
                if(found) return
                if(dt['Country'].match(new RegExp(ctr, 'ig'))) found = true;
            })
            if(found) return dt;
        });
    }

    document.getElementById('listFilters').innerHTML = `
        ${consortiumSelected.length > 0 ? `
            <span class="font-bold">Consortium: </span>${consortiumSelected[0] === 'NCI' ? 'C-NCI':consortiumSelected[0]} ${consortiumSelected.length > 1 ? `and <span class="other-variable-count">${consortiumSelected.length-1} other</span>`: ``}
        `: `
            <span class="font-bold">Consortium:</span> All
        `}
        <span class="vertical-line"></span>
        ${studyDesignSelected.length > 0 ? `
            <span class="font-bold">Study design: </span>${studyDesignSelected[0]} ${studyDesignSelected.length > 1 ? `and <span class="other-variable-count">${studyDesignSelected.length-1} other</span>`: ``}
        `: `
            <span class="font-bold">Study design:</span> All
        `}
        <span class="vertical-line"></span>
        ${countrySelected.length > 0 ? `
            <span class="font-bold">Country: </span>${countrySelected[0]} ${countrySelected.length > 1 ? `and <span class="other-variable-count">${countrySelected.length-1} other</span>`: ``}
        `: `
            <span class="font-bold">Country:</span> All
        `}
    `
    
    if(countrySelected.length === 0 && consortiumSelected.length === 0 && studyDesignSelected.length === 0) filteredData = descriptions
    
    const input = document.getElementById('searchDataCatalog');
    const currentValue = input.value.trim().toLowerCase();
    
    if(currentValue.length <= 2 && (previousValue.length > 2 || previousValue.length === 0)) {
        document.getElementById('pageSizeContainer').innerHTML = pageSizeTemplate(filteredData, defaultPageSize);
        renderStudyDescription(filteredData, document.getElementById('pageSizeSelector').value, headers);
        paginationHandler(filteredData, document.getElementById('pageSizeSelector').value, headers);
        addEventPageSizeSelection(filteredData, headers);
        return;
    }
    previousValue = currentValue;
    let searchedData = JSON.parse(JSON.stringify(filteredData));
    searchedData = searchedData.filter(dt => {
        let found = false;
        if(dt['Country'] && dt['Country'].toLowerCase().includes(currentValue)) found = true;
        if(dt['Study Acronym'].toLowerCase().includes(currentValue)) found = true;
        if(dt['Study'].toLowerCase().includes(currentValue)) found = true;
        if(dt['Study design'] && dt['Study design'].toLowerCase().includes(currentValue)) found = true;
        dt['pis'].forEach(element => {
            if(element['PI'] && element['PI'].toLowerCase().includes(currentValue)) found = true;
        });
        if(found) return dt;
    })
    searchedData = searchedData.map(dt => {
        dt['Country'] = dt['Country'].replace(new RegExp(currentValue, 'gi'), '<b>$&</b>');
        dt['Study Acronym'] = dt['Study Acronym'].replace(new RegExp(currentValue, 'gi'), '<b>$&</b>');
        dt['Study design'] = dt['Study design'].replace(new RegExp(currentValue, 'gi'), '<b>$&</b>');
        dt['Study'] = dt['Study'].replace(new RegExp(currentValue, 'gi'), '<b>$&</b>');
        dt['pis'].forEach(element => {
            element['PI'] = element['PI'].replace(new RegExp(currentValue, 'gi'), '<b>$&</b>');
        });
        return dt;
    })

    document.getElementById('pageSizeContainer').innerHTML = pageSizeTemplate(searchedData, defaultPageSize);
    renderStudyDescription(searchedData, document.getElementById('pageSizeSelector').value, headers);
    paginationHandler(searchedData, document.getElementById('pageSizeSelector').value, headers);
    addEventPageSizeSelection(searchedData, headers);
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

export const pageSizeTemplate = (array, startPageSize) => {
    const contentSize = Math.ceil(array.length / defaultPageSize) * defaultPageSize;
    let pageSizes = [];
    for(let i = startPageSize; i <= contentSize; i += defaultPageSize) {
        pageSizes.push(i);
    }
    let template = `
    <select class="form-select" id="pageSizeSelector">`
    pageSizes.forEach(size => {
        template += `<option value="${size}">${size}</option>`
    })
    template += `</select>
    `;
    return template;
};

const addEventPageSizeSelection = (data, headers) => {
    const select = document.getElementById('pageSizeSelector');
    select.addEventListener('change', () => {
        const value = select.value;
        renderStudyDescription(data, value, headers)
        paginationHandler(data, value, headers)
    })
}

export const paginationTemplate = (array) => {
    let template = `
        <nav aria-label="Page navigation example">
            <ul class="pagination m-0">`
    
    array.forEach((a,i) => {
        if(i === 0){
            template += `<li class="page-item">
                            <button class="page-link" id="previousPage" data-previous="1" aria-label="Previous">
                            <span aria-hidden="true">&laquo;</span>
                            <span class="sr-only">Previous</span>
                            </button>
                        </li>`
        }
        template += `<li class="page-item"><button class="page-link ${i === 0 ? 'active-page':''}" data-page=${a}>${a}</button></li>`;

        if(i === (array.length - 1)){
            template += `
            <li class="page-item">
                <button class="page-link" id="nextPage" data-next="1" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
                <span class="sr-only">Next</span>
                </button>
            </li>`
        }
    });
    template += `
            </ul>
        </nav>
    `;
    return template;
}

export const dataPagination = (start, end, data) => {
    const paginatedData = [];
    for(let i=start; i<end; i++){
        if(data[i]) paginatedData.push(data[i]);
    }
    return paginatedData;
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
                renderStudyDescription(dataPagination(start,end,data), document.getElementById('pageSizeSelector').value, headers);
                Array.from(elements).forEach(ele => ele.classList.remove('active-page'));
                document.querySelector(`button[data-page="${pageNumber}"]`).classList.add('active-page');
            }
        })
    });
}

export const updateDesc = () => {
    const updateDescButton = document.getElementById('updateDesc');
    updateDescButton.addEventListener('click', async e => {
        showAnimation();
        const descFolders = await getFolderItems(276763770481);
        let filearrayDesc = descFolders.entries;
        let json_list = [];
        for (let obj of filearrayDesc) {
            let data = await getFileXLSX(obj.id);
            let file = await data.arrayBuffer();
            let workbook = XLSX.read(file);
            console.log(workbook);
            let worksheet = workbook.Sheets[workbook.SheetNames[0]];
            let raw_data = XLSX.utils.sheet_to_json(worksheet, {header: 1});
            let json_input = array2Json(raw_data);
            console.log(json_input);
            let json_input_noempty = json_input.filter(obj => Object.keys(obj).length !== 0);
            json_list = json_list.concat(json_input_noempty);
            console.log(json_list);
        }
        JSONToFile(json_list, 'studyDescriptions');
        hideAnimation();
    })
}

const JSONToFile = (obj, filename) => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], {
      type: 'application/json',
    });
    //const url = URL.createObjectURL(blob);
    //const a = document.createElement('a');
    //a.href = url;
    //a.download = `${filename}.json`;
    //a.click();
    //URL.revokeObjectURL(url);
    uploadFileVersion2(blob,'1673495829037','application/json')
  };

  const getAllKeys = (arr) => {
    const allKeys = new Set();
  
    arr.forEach((obj) => {
      Object.keys(obj).forEach((key) => allKeys.add(key));
    });
  
    return Array.from(allKeys);
  };