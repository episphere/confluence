import { getFolderItems, getFile } from "../shared.js";
import { config } from "../config.js";
import { studyDropDownTemplate, dataDropDownTemplate } from "../components/elements.js";
import { txt2dt } from "../visulization.js";
const nonStudyFolder = ['users', 'protocols', 'consents'];

export function template() {
    return `
        <div class="row main-summary-row">
            <div class="col main-summary-col">
                <div class="row summary-inner-row">
                    <div class="col">
                        <span class="data-summary-label">Consortia</span></br>
                        <span><i class="fas fa-3x fa-layer-group"></i></span>
                        <span class="data-summary-count" id="consortiaCount">1</span></br>
                        <select class="select" id="consortiaOption">
                            <option disabled selected> -- select a consortia -- </option>
                            <option value="${config.BCACFolderId}">BCAC</option>
                        </select>
                    </div>
                    <div class="col">
                        <span class="data-summary-label">Studies</span></br>
                        <span><i class="fas fa-3x fa-university"></i></span>
                        <span class="data-summary-count" id="studyCount">0</span></br>
                        <div id="studyDropDown"></div>
                        
                    </div>
                </div>
                </br>
                <div class="row summary-inner-row">
                    <div class="col">
                        <span class="data-summary-label">Data</span></br>
                        <span><i class="fas fa-3x fa-database"></i></span>
                        <span class="data-summary-count" id="dataCount">0</span></br>
                        <div id="dataDropDown"></div>
                    </div>
                    <div class="col">
                        <span class="data-summary-label">Cases</span></br>
                        <span><i class="fas fa-3x fa-users"></i></span>
                        <span class="data-summary-count" id="caseCount">0</span>
                    </div>
                </div>
            </div>
            <div class="col main-summary-col">
            </div>
        </div>
    `;  
}

export async function getSummary(access_token) {
    await getFolderItems(config.BCACFolderId, access_token).then(consortia => {
        let dataObject = {}
        dataObject['BACA'] = {};
        dataObject['BACA'].studyEntries = {};
        dataObject['BACA'].id = {};
        dataObject['BACA'].id = config.BCACFolderId;
        let studyEntries = consortia.entries;
        studyEntries = studyEntries.filter(data => nonStudyFolder.indexOf(data.name.toLowerCase().trim()) === -1)
        document.getElementById('studyCount').textContent = studyEntries.length;
//         debugger;
        studyEntries.forEach(async study => {
            const studyName = study.name;
            const studyId = study.id;

            dataObject['BACA'].studyEntries[studyName] = {};
            dataObject['BACA'].studyEntries[studyName].id = {};
            dataObject['BACA'].studyEntries[studyName].id = studyId;
            dataObject['BACA'].studyEntries[studyName].dataEntries = {};
            
            await getFolderItems(studyId, access_token).then(data => {
                let dataEntries = data.entries;
                dataEntries = dataEntries.filter(dt => dt.name.toLowerCase().trim() !== 'samples');
                
                let dataCountElement = document.getElementById('dataCount')
                dataCountElement.textContent = parseInt(dataCountElement.textContent) + dataEntries.length;

                dataEntries.forEach(async dt => {
                    const dataName = dt.name;
                    const dataId = dt.id;
                    dataObject['BACA'].studyEntries[studyName].dataEntries[dataName] = {};
                    dataObject['BACA'].studyEntries[studyName].dataEntries[dataName].id = {};
                    dataObject['BACA'].studyEntries[studyName].dataEntries[dataName].id = dataId;
                    dataObject['BACA'].studyEntries[studyName].dataEntries[dataName].fileEntries = {};

                    await getFolderItems(dataId, access_token).then(files => {
                        let fileEntries = files.entries;
                        fileEntries = fileEntries.filter(file => file.type === 'file' && file.name.slice(file.name.lastIndexOf('.')+1, file.name.length) === 'txt');
                        fileEntries.forEach(async dataFile => {
                            const fileName = dataFile.name;
                            const fileId = dataFile.id;

                            let txt = await getFile(fileId, access_token);
                            let dt=txt2dt(txt);
                            console.log(dt);
                        })
                    });
                });
            });
        });
        console.log(dataObject);
    });
}

export const countSpecificStudy = async (folderId, access_token) => {
    await getFolderItems(folderId, access_token).then(data => {
        let entries = data.entries;
        entries = entries.filter(dt => nonStudyFolder.indexOf(dt.name.toLowerCase().trim()) === -1)
        let studyDropDown = document.getElementById('studyDropDown');
        studyDropDown.innerHTML = studyDropDownTemplate(entries);
        let studyOptions = document.getElementById('studyOptions');
        studyOptions.addEventListener('change', () => {
            if(studyOptions.value === "") return;
            countSpecificData(studyOptions.value, access_token)
        });
    });
};

export const countSpecificData = async (folderId, access_token) => {
    await getFolderItems(folderId, access_token).then(data => {
        let entries = data.entries;
        entries = entries.filter(dt => 'samples' !== dt.name.toLowerCase().trim());
        document.getElementById('dataCount').textContent = entries.length;
        let dataDropDown = document.getElementById('dataDropDown');
        dataDropDown.innerHTML = dataDropDownTemplate(entries);
    });
};
