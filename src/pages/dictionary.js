import { addEventFilterBarToggle } from "../event.js";
import { getFile, hideAnimation, shortenText, tsv2JsonDict, json2other, emailsAllowedToUpdateData, getFileXLSX, showAnimation, array2Json, array2Json2, getFileURL } from "./../shared.js";
import { addEventToggleCollapsePanelBtn, pageSizeTemplate, dataPagination, paginationTemplate } from "./description.js";
let previousValue = '';
/**
 * Checks if a row appears to be a merged header row rather than a data row
 * @param {Object} row - The row object from the Excel sheet
 * @returns {boolean} - True if the row appears to be a merged header row
 */
const isMergedRow = (row) => {
    // Get all keys in the row
    const keys = Object.keys(row);
    
    // If the row has very few columns compared to what we expect, it might be a merged row
    if (keys.length < 3) {
        return true;
    }
    
    // Check if the row is missing essential columns that data rows should have
    const essentialColumns = ['Variable', 'Label'];
    const missingEssentials = essentialColumns.some(col => 
        !keys.includes(col) || !row[col] || row[col].toString().trim() === ''
    );
    
    // If missing essential columns, likely a merged header row
    if (missingEssentials) {
        return true;
    }
    
    // Check if the first column value is very long, which often indicates a merged header
    const firstColValue = row[keys[0]];
    if (firstColValue && typeof firstColValue === 'string' && firstColValue.length > 50) {
        return true;
    }
    
    return false;
};

export const dataDictionaryTemplate = async () => {
    //const data = await (await fetch('https://raw.githubusercontent.com/episphere/confluence/master/Confluence_Data_Dictionary.txt')).text();
    //const data = await (await fetch('https://raw.githubusercontent.com/episphere/confluence/master/BCAC_Confluence_Extended_Dictionary_v2_replace2.txt')).text();
    //const data = await (await fetch('./BCAC_Confluence_Extended_Dictionary_v2_replace.txt')).text();
    const data = await (await fetch('./Confluence_Data_Dictionary.txt')).text();
    const tsvData = tsv2JsonDict(data);
    //const dictionary = tsvData.data;
    const headers = tsvData.headers;
    // console.log(dictionary);
    // console.log(headers);

    const dataxlsx = await fetch('./src/data/Confluence_Extended_Dictionary.xlsx');
    let file = await dataxlsx.arrayBuffer();
    let workbook = XLSX.read(file);
    console.log(workbook);
    
    // Process all sheets in the workbook
    const allSheetData = [];
    let lastCategory = '';
    
    // Process each sheet in the workbook
    for (const sheetName of workbook.SheetNames) {
        // Skip any sheet that contains "T_TNM" in its name
        if (sheetName.includes("T_TNM")) {
            continue;
        }
        
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet, {range:3});
        
        // Process each row in the sheet and handle Category inheritance
        sheetData.forEach(row => {
            // Check if this row appears to have merged columns (header rows)
            // This typically happens when a row has a long text spanning multiple columns
            // and is missing most of the expected column values
            const isMergedHeaderRow = isMergedRow(row);
            
            // Skip rows that appear to be merged header rows
            if (isMergedHeaderRow) {
                return;
            }
            
            // If Category is empty, use the last non-empty Category
            if (!row.Category || row.Category.trim() === '') {
                row.Category = lastCategory;
            } else {
                lastCategory = row.Category;
            }
            
            // Add Data Type column based on sheet name with title case formatting
            row['Data Type'] = sheetName.split(/\s+/).map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
            
            allSheetData.push(row);
        });
    }
    
    const dictionary = allSheetData;
    console.log(dictionary);
    
    if(localStorage.parms){
        let authAdmin = emailsAllowedToUpdateData.includes(JSON.parse(localStorage.parms).login)
        if (emailsAllowedToUpdateData.includes(JSON.parse(localStorage.parms).login)){
            let updateButton = `${authAdmin ? (`<button type="button" class="col-auto btn btn-primary mt-3 mb-3 button-glow" title="Update Dictionary Based on File in Box to be uploaded to GitHub" id="updateDict">Update Dictionary</button>`) :''}`
            const pageHeader = document.getElementById("pageHeader");
            pageHeader.insertAdjacentHTML("afterend", updateButton);
            updateDict();
        }
    };
    let template = `
    <div class="col-xl-2 filter-column black-font" id="summaryFilterSiderBar">
        <div class="div-border white-bg align-left p-2">
            <div class="main-summary-row">
                <div class="col-xl-12 pl-1 pr-0">
                    <span class="font-size-17 font-bold">Filter</span>
                    <div id="filterDataDictionary" class="align-left"></div>
                </div>
            </div>
        </div>
    </div>
    <!--<button id="filterBarToggle"><i class="fas fa-lg fa-caret-left"></i></button>-->
    <div class="col-xl-10 padding-right-zero padding-left-1 position-relative" id="summaryStatsCharts">
        <button id="filterBarToggle"><i class="position-absolute fas fa-2x fa-caret-left"></i></button>
        <div class="main-summary-row pl-2" style="min-height: 10px;margin-bottom: 1rem;">
            <div class="col white-bg div-border align-left font-size-17" style="padding: 0.5rem;" id="listFilters">
                <span class="font-bold black-font">Data Type:</span> All
            </div>
        </div>
        <div class="main-summary-row">
            <div class="col-xl-12 pb-2 pe-0 ps-0 white-bg div-border">
                <div class="allow-overflow" style="height: calc(100vh - 190px) !important;min-height: 500px;" id="dataDictionaryBody"></div>
            </div>
        </div>
    </div>
    `;
    document.getElementById('dataSummaryStatistics').innerHTML = template;
    renderDataDictionaryFilters(dictionary, headers);
    renderDataDictionary(dictionary, dictionary.length, headers);
    paginationHandler(dictionary, dictionary.length, headers);
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
    const allDataTypes = Object.values(dictionary).filter(dt => dt['Data Type']).map(dt => dt['Data Type']);
    const uniqueTypes = allDataTypes.filter((d,i) => allDataTypes.indexOf(d) === i);
    let template = '';
    template += `
    <div class="main-summary-row">
        <div style="width: 100%;">
            <div class="form-group" margin:0px>
                <div class="input-group">
                    <input type="search" class="form-control rounded" autocomplete="off" placeholder="Search min. 3 characters" aria-label="Search" id="searchDataDictionary" aria-describedby="search-addon" />
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
                uniqueTypes.forEach(dt => {
                    template += `
                        <li class="filter-list-item form-check">
                            <input type="checkbox" data-variable-type="${dt}" id="label${dt}" class="form-check-input select-variable-type" style="margin-left: 1px !important;">
                            <label for="label${dt}" class="form-check-label" title="${dt}">${shortenText(dt, 60)}</label>
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
        // Update to filter by Data Type instead of Variable type
        filteredData = filteredData.filter(dt => variableTypeSelection.indexOf(dt['Data Type']) !== -1);
    }
    if(variableTypeSelection.length === 0) filteredData = dictionary;
    
    document.getElementById('listFilters').innerHTML = `
    ${variableTypeSelection.length > 0 ? `
        <span class="font-bold black-font">Data Type: </span>${variableTypeSelection[0]} ${variableTypeSelection.length > 1 ? `and <span class="other-variable-count">${variableTypeSelection.length-1} other</span>`:``}
    `:`
        <span class="font-bold black-font">Data Type:</span> All`}
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
        if (dt['Variable']){ 
                if(dt['Variable'].toLowerCase().includes(currentValue)) found = true
            };
        if (dt['Label']){
                if(dt['Label'].toLowerCase().includes(currentValue)) found = true;
            };
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
            <div class="col-md-12">
                <div class="row ps-3 pe-5">
                    <div class="col-md-3 font-bold">Variable <button class="transparent-btn sort-column" data-column-name="Variable"><i class="fas fa-sort"></i></button></div>
                    <div class="col-md-5 font-bold">Label <button class="transparent-btn sort-column" data-column-name="Label"><i class="fas fa-sort"></i></button></div>
                    <div class="col-md-2 font-bold">Category <button class="transparent-btn sort-column" data-column-name="Category"><i class="fas fa-sort"></i></button></div>
                    <div class="col-md-2 font-bold">Data Type <button class="transparent-btn sort-column" data-column-name="Data Type"><i class="fas fa-sort"></i></button></div>
                </div>
            </div>
        </div>
        <div class="row m-0 align-left allow-overflow w-100">
            <div class="accordion accordion-flush col-md-12" id="dictionaryAccordian">
        `
    dictionary.forEach((desc, index) => {
        if(index > pageSize) return
        template += `
            <div class="accordion-item">
                <h2 class="accordion-header" id="flush-headingOne">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#study${desc['Variable'] ? desc['Variable'].replace(/(<b>)|(<\/b>)/g, '') : ''}" aria-expanded="false" aria-controls="study${desc['Variable'] ? desc['Variable'].replace(/(<b>)|(<\/b>)/g, '') : ''}">
                        <div class="col-md-3">${desc['Variable'] ? desc['Variable'] : ''}</div>
                        <div class="col-md-5">${desc['Label'] ? desc['Label'] : ''}</div>
                        <div class="col-md-2">${desc['Category'] ? desc['Category'] : ''}</div>
                        <div class="col-md-2">${desc['Data Type'] ? desc['Data Type'] : ''}</div>
                    </button>
                </h2>
                <div id="study${desc['Variable'] ? desc['Variable'].replace(/(<b>)|(<\/b>)/g, '') : ''}" class="accordion-collapse collapse" aria-labelledby="flush-headingOne">
                    <div class="accordion-body">
                        ${desc['Coding'] ? `<div class="row mb-1 m-0 white-space"><div class="col-md-2 pl-2 font-bold">Coding</div><div class="col">${desc['Coding']}</div></div>`: ``}
                        ${desc['Variable type'] ? `<div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Variable type</div><div class="col">${desc['Variable type']}</div></div>`: ``}
                        ${desc['Data Type'] ? `<div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Data Type</div><div class="col">${desc['Data Type']}</div></div>`: ``}
                        ${desc['Comment'] ? `<div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold white-space">Comment</div><div class="col">${desc['Comment']}</div></div>`: ``}
                        ${desc['Confluence Variable'] ? `<div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Confluence Variable</div><div class="col">${desc['Confluence Variable']}</div></div>`: ``}
                    </div>
                </div>
            </div>`
    });
    template += `</div></div>`;
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

        const filteredDictionary = filterDataHandler(data);
        prepareDictionaryForCSVDownload(filteredDictionary, 'Confluence_Dictionary');

    })
    const downloadDictionaryTSV = document.getElementById('downloadDictionaryTSV');
    downloadDictionaryTSV.addEventListener('click', e => {
        const filteredDictionary = filterDataHandler(data);
        prepareDictionaryForTSVDownload(filteredDictionary, 'Confluence_Dictionary');
    })
    const downloadExcelBtn = document.getElementById('downloadOriginalExcel');
    downloadExcelBtn.addEventListener('click', e => {
        downloadOriginalDictionary();
    })
}

export const updateDict = () => {
    const updateDictButton = document.getElementById('updateDict');
        updateDictButton.addEventListener('click', async e => {
            // let data = await getFileURL(1834994253194);
            // // let file = await data.arrayBuffer();
            // // let workbook = XLSX.read(file);

            // // let worksheet = workbook.Sheets[workbook.SheetNames[0]];
            // // let raw_data = XLSX.utils.sheet_to_json(worksheet, {header: 1});
            // // let json_input = array2Json(raw_data);
            // // JSONToFile(json_input, 'testing');
            // const a = document.createElement('a');
            // a.href = data;
            // //a.download = `test`;
            // a.click();
            const header = document.getElementById("confluenceModalHeader");
            const body = document.getElementById("confluenceModalBody");

            header.innerHTML = `<h5 class="modal-title">New Dictionary Download</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`;
            let template = '<form id="updateDictionaryForm">';
            template += `<p>The Download Dictionary button will download from Box a copy of the dictionary. It should be uploaded to: <a href="https://github.com/episphere/confluence/tree/master/src/data" target="__blank">Confluence GitHub Data Folder</a> for the dictionary to be updated.</p>`;
            template += '<div class="modal-footer"><button type="submit" class="btn btn-outline-primary">Download Dictionary</button></div>'
            template += "</form>";
            body.innerHTML = template;
            $("#confluenceMainModal").modal("show");
            //URL.revokeObjectURL(url);
            const form = document.getElementById('updateDictionaryForm');
            form.addEventListener('submit', async e => {
                showAnimation();
                let data = await getFileURL(1834994253194);
                const a = document.createElement('a');
                a.href = data;
                a.click();
                hideAnimation();
            })
        })
}

const JSONToFile = (obj, filename) => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
    //uploadFileVersion2(blob, studyDescriptions, 'application/json')
  };

/**
 * Downloads the original Excel dictionary file
 * @returns {Promise<void>} - Triggers a file download
 */
const downloadOriginalDictionary = async () => {
  try {
    showAnimation();
    
    // Fetch the Excel file
    const response = await fetch('./src/data/Confluence_Extended_Dictionary.xlsx');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dictionary file: ${response.status} ${response.statusText}`);
    }
    
    // Get the file as a blob
    const blob = await response.blob();
    
    // Create a download link and trigger the download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Confluence_Extended_Dictionary.xlsx');
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    hideAnimation();
  } catch (error) {
    console.error('Error downloading dictionary file:', error);
    hideAnimation();
    alert('Failed to download the dictionary file. Please try again later.');
  }
};

/**
 * Prepares dictionary data for download in CSV format
 * @param {Array} dictionaryData - The dictionary data as an array of objects
 * @param {string} filename - The name of the file to be downloaded (without extension)
 * @returns {void} - Triggers a file download
 */
const prepareDictionaryForCSVDownload = (dictionaryData, filename = 'dictionary_export') => {
  // Clone the data to avoid modifying the original
  const cleanData = JSON.parse(JSON.stringify(dictionaryData));
  
  // Remove HTML tags from any fields (like <b> tags from search highlighting)
  cleanData.forEach(item => {
    Object.keys(item).forEach(key => {
      if (typeof item[key] === 'string') {
        item[key] = item[key].replace(/(<([^>]+)>)/gi, '');
      }
    });
  });
  
  // Get all unique headers from the data
  const allHeaders = new Set();
  cleanData.forEach(item => {
    Object.keys(item).forEach(key => {
      allHeaders.add(key);
    });
  });
  const headers = Array.from(allHeaders);
  
  // Create CSV header row
  let csvContent = headers.join(',') + '\r\n';
  
  // Add data rows
  cleanData.forEach(item => {
    const row = headers.map(header => {
      // Handle fields that might contain commas or quotes
      const value = item[header] !== undefined ? item[header] : '';
      const valueStr = String(value);
      
      // Escape quotes and wrap in quotes if needed
      if (valueStr.includes(',') || valueStr.includes('"') || valueStr.includes('\n')) {
        return '"' + valueStr.replace(/"/g, '""') + '"';
      }
      return valueStr;
    });
    csvContent += row.join(',') + '\r\n';
  });
  
  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a download link and trigger the download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Prepares dictionary data for download in TSV format
 * @param {Array} dictionaryData - The dictionary data as an array of objects
 * @param {string} filename - The name of the file to be downloaded (without extension)
 * @returns {void} - Triggers a file download
 */
const prepareDictionaryForTSVDownload = (dictionaryData, filename = 'dictionary_export') => {
  // Clone the data to avoid modifying the original
  const cleanData = JSON.parse(JSON.stringify(dictionaryData));
  
  // Remove HTML tags from any fields (like <b> tags from search highlighting)
  cleanData.forEach(item => {
    Object.keys(item).forEach(key => {
      if (typeof item[key] === 'string') {
        item[key] = item[key].replace(/(<([^>]+)>)/gi, '');
      }
    });
  });
  
  // Get all unique headers from the data
  const allHeaders = new Set();
  cleanData.forEach(item => {
    Object.keys(item).forEach(key => {
      allHeaders.add(key);
    });
  });
  const headers = Array.from(allHeaders);
  
  // Create TSV header row
  let tsvContent = headers.join('\t') + '\r\n';
  
  // Add data rows
  cleanData.forEach(item => {
    const row = headers.map(header => {
      // Handle fields that might contain tabs or newlines
      const value = item[header] !== undefined ? item[header] : '';
      const valueStr = String(value);
      
      // Replace tabs with spaces to maintain TSV structure
      return valueStr.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
    });
    tsvContent += row.join('\t') + '\r\n';
  });
  
  // Create a Blob with the TSV content
  const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
  
  // Create a download link and trigger the download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.tsv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};