import { countSpecificData, clearGraphAndParameters } from './pages/dataExploration.js';
import { getData } from './visulization.js'
import { showAnimation, disableCheckBox, removeActiveClass, uploadFile, createFolder, getCollaboration, getCurrentUser, addNewCollaborator, removeBoxCollaborator, notificationTemplate, updateBoxCollaborator, getFolderItems, getFileVersions } from './shared.js';
import { parameterListTemplate } from './components/elements.js';
import { variables } from './variables.js';
import { template as dataGovernanceTemplate, addFields, eventsDataSubmissions, dataGovernanceLazyLoad, dataGovernanceCollaboration } from './pages/dataGovernance.js';
import { myProjectsTemplate, expandProjects } from './pages/myProjects.js';
let top = 0;
export const addEventStudiesCheckBox = (dataObject, folderId) => {
    const studiesCheckBox = document.getElementsByName('studiesCheckBox');
    Array.from(studiesCheckBox).forEach(element => {
        element.addEventListener('click', () => {
            clearGraphAndParameters();
            const selectedValues = getAllSelectedStudies();
            if(selectedValues.length > 0){
                showAnimation();
                disableCheckBox(true);
                countSpecificData(selectedValues, dataObject[folderId].studyEntries);
            }
            else{
                document.getElementById('dataDropDown').hidden = true;
                document.getElementById('dataCount').textContent = '0';
            }
        });
    });
};

const getAllSelectedStudies = () => {
    let selectedValues = [];
    const studiesCheckBox = document.getElementsByName('studiesCheckBox');
    Array.from(studiesCheckBox).forEach(element => {
        if(element.checked) selectedValues.push(element.value);
    });
    return selectedValues;
}

const triggerEventStudies = (studyEntries) => {
    let studyIds = [];
    let values = [];
    const dataTypeCheckBox = document.getElementsByName('dataTypeCheckBox');
    const studiesCheckBox = document.getElementsByName('studiesCheckBox');
    
    studiesCheckBox.forEach(element => {
        if(element.checked) studyIds.push(element.value);
    });
    dataTypeCheckBox.forEach(element => {
        if(element.checked) values.push(element.value);
    });

    document.getElementById('dataDropDown').hidden = false;
    if(studyIds.length === 0) document.getElementById('dataDropDown').hidden = true;
    if(studyIds.length === 0 || values.length === 0) {
        clearGraphAndParameters();
    }
    else{
        clearGraphAndParameters();
        showAnimation();
        disableCheckBox(true);
        let dataCount = 0;
        studyIds.forEach(id => {
            dataCount += Object.keys(studyEntries[id].dataEntries).length;
        });
        document.getElementById('dataCount').textContent = dataCount;
        // getData(studyEntries, studyIds, values);
    }
}

export const addEventSearchStudies = () => {
    const studiesCheckBox = document.getElementsByName('studiesCheckBox');
    const searchStudies = document.getElementById('searchStudies');
    searchStudies.addEventListener('keyup', () => {
        const keyword = searchStudies.value.toLowerCase().trim();
        if(keyword === "") {
            Array.from(studiesCheckBox).forEach(element => {
                element.parentNode.style.display = "";
            });
        }
        else{
            Array.from(studiesCheckBox).forEach(element => {
                const elementValue = element.dataset.studyName;
                if(elementValue.toLowerCase().trim().indexOf(keyword) === -1){
                    element.parentNode.style.display = "none";
                }
            });
        };
    });
};

export const addEventSelectAllStudies = (studyEntries) => {
    const studySelectAll = document.getElementById('studySelectAll');
    studySelectAll.addEventListener('click', () => {
        const studiesCheckBox = document.getElementsByName('studiesCheckBox');
        if(studySelectAll.checked === true){
            Array.from(studiesCheckBox).forEach(element => {
                if(element.checked === false && element.parentNode.style.display !== "none"){
                    element.checked = true;
                }
            });
        }
        else{
            Array.from(studiesCheckBox).forEach(element => {
                if(element.checked === true && element.parentNode.style.display !== "none"){
                    element.checked = false;
                }
            });
            document.getElementById('dataCount').textContent = '0';
        };
        triggerEventStudies(studyEntries);
    });
};

export const addEventDataTypeCheckBox = (studyEntries) => {
    let values = [];
    const dataTypeCheckBox = document.getElementsByName('dataTypeCheckBox');
    Array.from(dataTypeCheckBox).forEach(element => {
        element.addEventListener('click', () => {
            clearGraphAndParameters();
            const value = element.value;
            const studyIds = element.dataset.studyId.split(',');

            if(element.checked){
                values.push(value);
                showAnimation();
                disableCheckBox(true);
                clearGraphAndParameters();
                // getData(studyEntries, studyIds, values);
            }
            else{
                values.splice(values.indexOf(value), 1);
                if(checkBoxchecker(dataTypeCheckBox) === true) {
                    showAnimation();
                    disableCheckBox(true);
                    clearGraphAndParameters();
                    // getData(studyEntries, studyIds, values);
                }
            }
        });
    });
};

export const addEventSearchDataType = () => {
    const dataTypeCheckBox = document.getElementsByName('dataTypeCheckBox');
    const searchdataTypes = document.getElementById('searchdataTypes');
    searchdataTypes.addEventListener('keyup', () => {
        const keyword = searchdataTypes.value.toLowerCase().trim();
        if(keyword === "") {
            Array.from(dataTypeCheckBox).forEach(element => {
                element.parentNode.style.display = "";
            });
        }
        else{
            Array.from(dataTypeCheckBox).forEach(element => {
                const elementValue = element.value;
                if(elementValue.toLowerCase().trim().indexOf(keyword) === -1){
                    element.parentNode.style.display = "none";
                }
            });
        };
    });
};

export const addEventSelectAllDataType = (studyEntries) => {
    const dataTypeSelectAll = document.getElementById('dataTypeSelectAll');
    dataTypeSelectAll.addEventListener('click', () => {
        const dataTypeCheckBox = document.getElementsByName('dataTypeCheckBox');
        if(dataTypeSelectAll.checked === true){
            Array.from(dataTypeCheckBox).forEach(element => {
                if(element.checked === false && element.parentNode.style.display !== "none"){
                    element.checked = true;
                }
            });
        }
        else{
            Array.from(dataTypeCheckBox).forEach(element => {
                if(element.checked === true && element.parentNode.style.display !== "none"){
                    element.checked = false;
                }
            });
        }
        dispatchEventDataTypeSelectAll(studyEntries);
    });
};

const dispatchEventDataTypeSelectAll = (studyEntries) => {
    let studyIds = [];
    let values = [];
    const dataTypeCheckBox = document.getElementsByName('dataTypeCheckBox');
    const studiesCheckBox = document.getElementsByName('studiesCheckBox');
    
    studiesCheckBox.forEach(element => {
        if(element.checked) studyIds.push(element.value);
    });
    dataTypeCheckBox.forEach(element => {
        if(element.checked) values.push(element.value);
    });
    if(studyIds.length === 0 || values.length === 0) {
        clearGraphAndParameters();
    }
    else{
        clearGraphAndParameters();
        showAnimation();
        disableCheckBox(true);
        // getData(studyEntries, studyIds, values, null);
    }
};

export const addEventVariableItem = (cf, jsonData) => {
    let variableItem = document.getElementsByClassName('variableItem');
    Array.from(variableItem).forEach(element => {
        element.addEventListener('click', () => {
            if(element.classList.contains('active')) return;
            removeActiveClass('variableItem', 'active');
            element.classList.add('active');
            const variable = element.innerHTML;
            // renderPieChart(cf, jsonData, variable);
        });
    });
}

export const addEventShowAllVariables = (cf, jsonData) => {
    let showAllVariablesElement = document.getElementById('toggleVariable');
    showAllVariablesElement.addEventListener('click', () => {
        if(showAllVariablesElement.innerHTML === 'Show All <i class="fas fa-caret-down"></i>'){
            let parameterList = document.getElementById('parameterList');
            parameterList.innerHTML = parameterListTemplate(jsonData);
        }
        else {
            let parameterList = document.getElementById('parameterList');
            parameterList.innerHTML = parameterListTemplate();
        }
        addEventVariableItem(cf, jsonData);
    });
}

export const addEventShowPieChart = (cf, jsonData) => {
    let variable = '';
    const showPieChart = document.getElementById('showPieChart');
    showPieChart.childNodes[0].addEventListener('click', () => {
        let variableItem = document.getElementsByClassName('variableItem');
        Array.from(variableItem).forEach(element => {
            if(element.classList.contains('active')) variable = element.innerHTML;
        })
        if(showPieChart.childNodes[0].checked){
            // renderPieChart(cf, jsonData, variable, true);
        }
        else{
            // renderPieChart(cf, jsonData, variable, false);
        }
    });
}

const checkBoxchecker = (chkbox) => {
    let checkElements = false;
    Array.from(chkbox).forEach(element => {
        if(checkElements === true) return;
        checkElements = element.checked;
    });
    return checkElements;
};

export const addEventStudyRadioBtn = () => {
    const createStudyRadio = document.getElementsByName('createStudyRadio');
    Array.from(createStudyRadio).forEach(element => {
        element.addEventListener('click', () => {
            if(element.checked){
                if(element.value === 'no'){
                    const studyFormElements = document.getElementById('studyFormElements');
                    const selectConsortiaUIS = document.getElementById('selectConsortiaUIS');
                    studyFormElements.innerHTML = `
                        <div class="form-group">
                            <label for="selectStudyUIS">Select study</label>
                            <select class="form-control" id="selectStudyUIS" name="selectedStudy" required></select>
                        </div>
                        <div class="form-group">
                            <label for="uploadDataUIS">Upload data</label>
                            <input type="file" class="form-control-file" id="uploadDataUIS" name="dataFile" required>
                        </div>
                    `;
                    if(selectConsortiaUIS.value) selectConsortiaUIS.dispatchEvent(new Event('change'));
                }
                else{
                    const studyFormElements = document.getElementById('studyFormElements');
                    studyFormElements.innerHTML = `
                        <div class="form-group">
                            <label for="newStudyName">Study Name</label>
                            <input type="text" id="newStudyName" autocomplete="off" required class="form-control" placeholder="Enter study name">
                        </div>
                        <div class="form-group">
                            <label for="uploadDataUIS">Upload data</label>
                            <input type="file" class="form-control-file" id="uploadDataUIS" name="dataFile" required>
                        </div>
                    `;
                }
            }
        });
    });
}

export const addEventConsortiaSelect = () => {
    const element = document.getElementById('selectConsortiaUIS');
    element.addEventListener('change', async () => {
        const selectStudyUIS = document.getElementById('selectStudyUIS');
        if(!selectStudyUIS) return;
        const value = element.value;
        if(!value) {
            Array.from(selectStudyUIS.options).forEach(option => {
                selectStudyUIS.remove(option);
            })
            return;
        }
        let entries = (await getFolderItems(value)).entries;
        
        selectStudyUIS.innerHTML = '';
        const firstOption = document.createElement('option');
        firstOption.value = '';
        firstOption.text = '-- Select study --'
        selectStudyUIS.appendChild(firstOption);
        entries = entries.filter(obj => obj.type === 'folder' && obj.name !== 'Confluence - CPSIII' && obj.name !== 'Confluence - Documents for NCI Participating Studies');
        for(let obj of entries){
            const option = document.createElement('option');
            option.value = obj.id;
            option.text = obj.name;
            selectStudyUIS.appendChild(option);
        };
    });
}

export const addEventCreateStudyForm = () => {
    
}

export const addEventUploadStudyForm = () => {
    const form = document.getElementById('uploadStudyForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const consortia = document.getElementById('selectConsortiaUIS');
        const consortiaId = consortia.value;
        const consortiaText = consortia.options[consortia.selectedIndex].text;
        const study = document.getElementById('selectStudyUIS');
        const newStudyName = document.getElementById('newStudyName');
        let studyId;
        let studyName = '';
        if(study){
            studyId = study.value;
            studyName = study.options[study.selectedIndex].text;
        }
        else if (newStudyName) {
            const response = await createFolder(consortiaId, newStudyName.value);
            studyId = response.id;
            studyName = newStudyName.value;
        }

        const file = document.getElementById('uploadDataUIS').files[0]; 
        const fileName = file.name;
        const fileType = fileName.slice(fileName.lastIndexOf('.')+1, fileName.length);
        if(fileType !== 'txt') {
            alert('File type not supported!');
            return;
        }
        const r = confirm(`Upload ${fileName} in ${consortiaText} >> ${studyName}?`);
        if(r){
            document.getElementById('submitBtn').innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading...`;
            const dataEntries = (await getFolderItems(studyId)).entries;
            if(dataEntries.length === 0) {
                await createFolder(studyId, 'Core Data');
                await createFolder(studyId, 'Pathology Data');
                await createFolder(studyId, 'Risk Factor Data');
                await createFolder(studyId, 'Survival and Treatment Data');
            }
            

            let fileReader = new FileReader();
            fileReader.onload = function(fileLoadedEvent){
                const textFromFileLoaded = fileLoadedEvent.target.result;
                // TO DO: QC
                separateData(textFromFileLoaded, studyId, fileName);
            };

            fileReader.readAsText(file, "UTF-8");
        }
    })
}

const separateData = async (textFromFileLoaded, studyId, fileName) => {
    let rows = textFromFileLoaded.split(/\n/g).map(tx=>tx.split(/\t/g));
    const headings = rows[0];
    rows.splice(0, 1);
    let obj = rows.map(el => {
        let obj = {};
        for (let i = 0; i < el.length; i++) {
        obj[headings[i].trim()] = el[i];
        }
        return obj;
    });
    
    const masterFile = variables.masterFile;
    const core = masterFile.core.map(att => att.toLowerCase());
    const pathology = masterFile.pathology.map(att => att.toLowerCase());
    const riskFactor = masterFile.riskFactor.map(att => att.toLowerCase());
    const survivalTreatment = masterFile.survivalAndTreatment.map(att => att.toLowerCase());
    
    let coreData = [];
    let pathologyData = [];
    let rfData = [];
    let stData = [];
    
    obj.forEach(data => {
        let cObj = {};
        let pObj = {};
        let rfObj = {};
        let stObj = {};

        for(const key in data){

            if(core.indexOf(key.toLowerCase()) !== -1){
                cObj[key] = data[key];
            }

            if(pathology.indexOf(key.toLowerCase()) !== -1){
                pObj[key] = data[key];
            }
            
            if(riskFactor.indexOf(key.toLowerCase()) !== -1){
                rfObj[key] = data[key];
            }

            if(survivalTreatment.indexOf(key.toLowerCase()) !== -1){
                stObj[key] = data[key];
            }
        }

        if(Object.keys(cObj).length > 0) coreData.push(cObj);
        if(Object.keys(pObj).length > 0) pathologyData.push(pObj);
        if(Object.keys(rfObj).length > 0) rfData.push(rfObj);
        if(Object.keys(stObj).length > 0) stData.push(stObj);
    });

    const dataFolders = (await getFolderItems(studyId)).entries;
    for(const obj of dataFolders){
        if(obj.name === 'Core Data'){
            await uploadFile(coreData, `${fileName.slice(0, fileName.lastIndexOf('.'))}_Core_Data.json`, obj.id);
        }

        if(obj.name === 'Pathology Data'){
            await uploadFile(pathologyData, `${fileName.slice(0, fileName.lastIndexOf('.'))}_Pathology_Data.json`, obj.id);
        }

        if(obj.name === 'Risk Factor Data'){
            await uploadFile(rfData, `${fileName.slice(0, fileName.lastIndexOf('.'))}_Risk_Factor_Data.json`, obj.id);
        }

        if(obj.name === 'Survival and Treatment Data'){
            await uploadFile(stData, `${fileName.slice(0, fileName.lastIndexOf('.'))}_Survival_and_Treatment_Data.json`, obj.id);
        }
    }
    location.reload();
}

export const formSubmit = () => {
    const form = document.getElementById('consortiaIdForm');
    form.addEventListener('submit', e => {
        e.preventDefault();
        const boxFolderId = document.getElementById('boxFolderId').value;
        localStorage.boxFolderId = JSON.stringify({folderId: boxFolderId});
        location.reload();
    });
}

export const addEventShowAllCollaborator = () => {
    const btn1 = document.getElementById('addNewCollaborators');
    const btn2 = document.getElementById('listCollaborators');
    const folderToShare = document.getElementById('folderToShare');
    btn2.addEventListener('click', async () => {
        const ID = folderToShare.dataset.folderId;
        const name = folderToShare.dataset.folderName;
        const type = folderToShare.dataset.objectType;
        btn2.classList.add('active');
        btn1.classList.remove('active');
        const collaboratorModalBody = document.getElementById('collaboratorModalBody');
        collaboratorModalBody.innerHTML = ``;
        const response = await getCollaboration(ID,`${type}s`);
        const userPermission = checkPermissionLevel(response);
        let table = '';
        if(response && response.entries.length > 0){
            let entries = response.entries;
            let allEntries = [];
            
            entries.forEach(entry => {
                const name = !entry.invite_email ? entry.accessible_by.name : '';
                const email = !entry.invite_email ? entry.accessible_by.login : entry.invite_email;
                const role = entry.role;
                const status = entry.status;
                const id = entry.id;
                const folderName = entry.item.name;
                const addedBy = `${entry.created_by.name}`;
                const addedAt = (new Date(entry.created_at)).toLocaleString();
                allEntries.push({name, email, role, status, addedBy, addedAt, id, folderName});
            });
            allEntries = allEntries.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0));

            table += `<strong>${name}</strong><br><br>
                <table class="table table-borderless table-striped collaborator-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Added by</th>
                            <th>Added at</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            allEntries.forEach(entry => {
                const { name, email, role, status, addedBy, addedAt, id, folderName} = entry;
                table += `<tr><td>${name}</td><td>${email}</td><td>${email !== JSON.parse(localStorage.parms).login && userPermission && updatePermissionsOptions(userPermission, role) ? `
                        <select data-collaborator-id="${id}" data-previous-permission="${role}" data-collaborator-name="${name}" data-collaborator-login="${email}" class="form-control updateCollaboratorRole">${updatePermissionsOptions(userPermission, role)}</select>
                    ` : `${role}`}</td><td>${status}</td><td>${addedBy}</td><td>${addedAt}</td><td>${userPermission && (userPermission === 'editor' || userPermission === 'owner' || userPermission === 'co-owner') && (role === 'editor' || role === 'viewer' || role === 'uploader') && email !== JSON.parse(localStorage.parms).login ? `<a class="removeCollaborator" title="Remove collaborator" href="#" data-collaborator-id="${id}" data-email="${email}" data-collaborator-name="${name}" data-folder-name="${folderName}"><i class="fas fa-user-minus"></i></a>` : ``}</td></tr>`
            });
            table += `</tbody></table>`
        }
        else{
            table = 'Collaborators not found!'
        }
        collaboratorModalBody.innerHTML = `
            <div class="modal-body">${table}</div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
        `;
        addEventRemoveCollaborator();
        addEventUpdateCollaborator();
    });
};

const updatePermissionsOptions = (userPermission, role) => {
    if ( userPermission === 'owner') return `<option ${role === 'co-owner' ? `selected` : ``} value="co-owner">co-owner</option><option ${role === 'editor' ? `selected` : ``} value="editor">editor</option><option ${role === 'viewer' ? `selected` : ``} value="viewer">viewer</option><option ${role === 'uploader' ? `selected` : ``} value="uploader">uploader</option>`
    else if ( userPermission === 'co-owner') return `<option ${role === 'co-owner' ? `selected` : ``} value="co-owner">co-owner</option><option ${role === 'editor' ? `selected` : ``} value="editor">editor</option><option ${role === 'viewer' ? `selected` : ``} value="viewer">viewer</option><option ${role === 'uploader' ? `selected` : ``} value="uploader">uploader</option>`
    else if ( userPermission === 'editor' && role !== 'co-owner' && role !== 'owner') return `<option ${role === 'editor' ? `selected` : ``} value="editor">editor</option><option ${role === 'viewer' ? `selected` : ``} value="viewer">viewer</option><option ${role === 'uploader' ? `selected` : ``} value="uploader">uploader</option>`;
    else return null;
}

const addEventUpdateCollaborator = () => {
    const updateCollaboratorRole = document.getElementsByClassName('updateCollaboratorRole');
    const showNotification = document.getElementById('showNotification');
    Array.from(updateCollaboratorRole).forEach(element => {
        element.addEventListener('change', async () => {
            const newRole = element.value;
            const prevRole = element.dataset.previousPermission;
            const id = element.dataset.collaboratorId;
            const name = element.dataset.collaboratorName;
            const login = element.dataset.collaboratorLogin;
            const r = confirm(`Update Collaborator ${name || login} Role as ${newRole}?`);
            if(r){
                const response = await updateBoxCollaborator(id, newRole);
                if(response.status === 200) {
                    top = top+2;
                    let template = notificationTemplate(top, `<span class="successMsg">Collaborator Updated</span>`, `Collaborator ${ name || login} role updated as ${newRole} successfully!`);
                    showNotification.innerHTML = template;
                    addEventHideNotification();
                }
                else{
                    element.value = prevRole;    
                }
            }
            else{
                element.value = prevRole;
            }
        })
    })
}

const addEventRemoveCollaborator = () => {
    const removeCollaborator = document.getElementsByClassName('removeCollaborator');
    const showNotification = document.getElementById('showNotification');
    Array.from(removeCollaborator).forEach(element => {
        element.addEventListener('click', async () => {
            const id = element.dataset.collaboratorId;
            const folderName = element.dataset.folderName;
            const email = element.dataset.email;
            const name = element.dataset.collaboratorName;
            const r = confirm(`Remove Collaborator ${ name || email} from ${folderName}?`);
            if(r){
                const response = await removeBoxCollaborator(id);
                if(response.status === 204){
                    top = top+2;
                    let template = notificationTemplate(top, `<span class="successMsg">Collaborator Removed</span>`, `Collaborator ${ name || email} removed from ${folderName} successfully!`);
                    element.parentNode.parentNode.parentNode.removeChild(element.parentNode.parentNode);
                    showNotification.innerHTML = template;
                    addEventHideNotification();
                }
            }
        });
    });
}

const checkPermissionLevel = (data) => {
    if(data.entries.length === 0) return null;
    const login = localStorage.parms && JSON.parse(localStorage.parms).login ? JSON.parse(localStorage.parms).login : undefined;
    const array = data.entries.filter(d => d.accessible_by && d.accessible_by.login === login);
    if(array.length === 0){
        const newArray = data.entries.filter(d => d.created_by && d.created_by.login === login);
        if(newArray.length > 0) return 'owner';
    }
    else {
        return array[0].role;
    }
    return null;
}

export const addEventAddNewCollaborator = () => {
    const btn1 = document.getElementById('addNewCollaborators');
    const btn2 = document.getElementById('listCollaborators');
    const folderToShare = document.getElementById('folderToShare');
    btn1.addEventListener('click', () => {
        const ID = folderToShare.dataset.folderId;
        const name = folderToShare.dataset.folderName;
        const type = folderToShare.dataset.objectType;
        btn1.classList.add('active');
        btn2.classList.remove('active');
        const collaboratorModalBody = document.getElementById('collaboratorModalBody');
        collaboratorModalBody.innerHTML = `
            <form id="addCollaborationForm" method="POST">
                <div class="modal-body">
                    <div><h5 class="modal-title">Share <strong>${name}</strong></h5></div>
                    <br>
                    <div class="row" id="collaboratorEmails">
                        ${addFields(1)}
                    </div>
                    <div class="row">
                        <div class="col"><button class="btn btn-light" id="addMoreEmail" data-counter=1><i class="fas fa-plus"></i> Add</button></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    <button type="submit" class="btn btn-primary">Submit</button>
                </div>
            </form>
        `;

        const addMoreEmail = document.getElementById('addMoreEmail');
        addMoreEmail.addEventListener('click', () => {
            const counter = parseInt(addMoreEmail.dataset.counter)+1;
            addMoreEmail.dataset.counter = counter;
            document.getElementById('collaboratorEmails').innerHTML += addFields(counter);
            if(counter === 5) addMoreEmail.disabled = true;
        });

        addEventCollaboratorForm(ID, type, name);
    });
}

const addEventCollaboratorForm = (ID, type, name) => {
    const form = document.getElementById('addCollaborationForm');
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const showNotification = document.getElementById('showNotification');
        let template = '';
        for(let i = 1; i <= 5; i++){
            const email = document.getElementById(`shareFolderEmail${i}`);
            const role = document.getElementById(`folderRole${i}`);
            if(email && role){
                const emails = email.value.split(',');
                for(let index = 0; index < emails.length; index++){
                    const login = emails[index].trim();
                    const response = await addNewCollaborator(ID, type, login, role.value.toLowerCase());
                    top = top+2;
                    if(response.status === 200 || response.status === 201) {
                        template += notificationTemplate(top, `<span class="successMsg">Added new collaborator</span>`, `${login} added to ${name} as ${role.value} successfully!`)
                    }else{
                        template += notificationTemplate(top, `<span class="errorMsg">Error!</span>`, `Could not add ${login} to ${name} as ${role.value}, <span class="errorMsg">${response.statusText}(${response.status})</span>!!`);
                    }
                }
            }
        }
        showNotification.innerHTML = template;
        addEventHideNotification();
    });
}

const addEventHideNotification = () => {
    const hideNotification = document.getElementsByClassName('hideNotification');
    Array.from(hideNotification).forEach(btn => {
        btn.addEventListener('click', () => {
            btn.parentNode.parentNode.parentNode.removeChild(btn.parentNode.parentNode);
            if(top >= 2) top = top-2;
        });
        setTimeout(() => { btn.dispatchEvent(new Event('click')) }, 5000);
    });
}

export const addEventDataGovernanceNavBar = () => {
    const dataGovernanceElement = document.getElementById('dataGovernance');
    dataGovernanceElement.addEventListener('click', async () => {
        if(dataGovernanceElement.classList.contains('navbar-active')) return;
        removeActiveClass('nav-menu-links', 'navbar-active');
        dataGovernanceElement.classList.add('navbar-active');
        confluenceDiv.innerHTML = await dataGovernanceTemplate();
        dataGovernanceLazyLoad();
        dataGovernanceCollaboration();
    });
};

export const addEventMyProjects = (data) => {
    const myProjects = document.getElementById('myProjects');
    myProjects.addEventListener('click', async () => {
        if(myProjects.classList.contains('navbar-active')) return;
        removeActiveClass('nav-menu-links', 'navbar-active');
        myProjects.classList.add('navbar-active');
        confluenceDiv.innerHTML = await myProjectsTemplate(data);

        const elements = document.getElementsByClassName('getAllFileversions');
        Array.from(elements).forEach(element => {
            element.addEventListener('click', async () => {
                const ID = element.dataset.fileId;
                const versions = await getFileVersions(ID);
                document.getElementById('modalFVHeader').innerHTML = `
                    <h5 class="modal-title">${element.dataset.fileName}</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                `;
                let template = '';
                versions.entries.forEach(dt => {
                    template += `
                    <tr>
                        <td>${dt.modified_by.name || dt.modified_by.login}</td>
                        <td>${new Date(dt.modified_at).toLocaleString()}</td>
                        <td>${dt.id}</td>
                        <td><a href="#" class="copy-file-api" title="Copy API" data-file-id="${ID}" data-version-id="${dt.id}"><button class="btn btn-dark btn-copy"><i class="far fa-copy"> Copy</button></a></td>
                    </tr>
                    `
                })
                document.getElementById('modalFVBody').innerHTML = `
                    <table class="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th>Modified by</th>
                                <th>Modified at</th>
                                <th>Version id</th>
                                <th>API</th>
                            </tr>
                        </thead>
                        <tbody>${template}</tbody>
                    </table>
                `;
                addEventCopyToClipboard();
            })
        });

        addEventCopyToClipboard();
        expandProjects();
    });
}

const addEventCopyToClipboard = () => {
    const copyFileApi = document.getElementsByClassName('copy-file-api');
    Array.from(copyFileApi).forEach(elem => {
        elem.addEventListener('click', () => {
            const fileId = elem.dataset.fileId;
            const versionId = elem.dataset.versionId;
            const api = `https://api.box.com/2.0/files/${fileId}/versions/${versionId}`;
            if (!navigator.clipboard) {
                const textArea = document.createElement("textarea");
                textArea.value = api;
                textArea.style.position="fixed";  //avoid scrolling to bottom
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const copied = document.execCommand('copy');
                if(copied){
                    elem.innerHTML = `<button class="btn btn-success btn-copy"><i class="fas fa-check"> Copied!</button></i>`;
                    setTimeout(()=> {elem.innerHTML = `<button class="btn btn-dark btn-copy"><i class="far fa-copy"> Copy</button>`}, 5000);
                }
                document.body.removeChild(textArea);
            }
            navigator.clipboard.writeText(api).then(function() {
                elem.innerHTML = `<button class="btn btn-success btn-copy"><i class="fas fa-check"> Copied!</button></i>`;
                setTimeout(()=> {elem.innerHTML = `<button class="btn btn-dark btn-copy"><i class="far fa-copy"> Copy</button>`}, 5000);
            }, function(err) {
                console.error('Async: Could not copy text: ', err);
            });
            
        });
    });

}