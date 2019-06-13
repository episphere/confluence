import { getFolderItems } from "../shared.js";
import { config } from "../config.js";

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
                            <option disabled selected value> -- select a consortia -- </option>
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
    let nonStudyFolder = ['users', 'protocols', 'consents'];
    await getFolderItems(config.BCACFolderId, access_token).then(consortia => {
        let studyEntries = consortia.entries;
        studyEntries = studyEntries.filter(data => nonStudyFolder.indexOf(data.name.toLowerCase().trim()) === -1)
        document.getElementById('studyCount').textContent = studyEntries.length;
        studyEntries.forEach(async study => {
            let studyId = study.id;
            await getFolderItems(studyId, access_token).then(data => {
                let dataEntries = data.entries;
                dataEntries = dataEntries.filter(dt => dt.name.toLowerCase().trim() !== 'samples');
                let dataCountElement = document.getElementById('dataCount')
                dataCountElement.textContent = parseInt(dataCountElement.textContent) + dataEntries.length;
            })
        });
    });
}

export const countSpecificStudy = (folderId) => {
    console.log(folderId);
}
