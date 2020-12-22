import { getPublicFile, numberWithCommas, publicDataFileId } from "./../shared.js";

export const aboutConfluence = () => {
    let template = `
        <div class="general-bg body-min-height padding-bottom-1rem">
            <div class="container">
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">Learn about Confluence</h1>
                    </div>
                </div>
                <div class="home-page-stats font-size-18">
                    <div class="main-summary-row">
                        <div class="col align-left">
                            </br>
                            <span>
                                Confluence includes breast cancer case-control studies, case series or clinical trials of female or male breast cancer (invasive or in situ) with the following:
                            </span>
                            </br>
                            <ul>
                                <li>Genome-wide genotyping data</li>
                                <li>Risk factor, pathology, treatment, toxicities and survival data</li>
                                <li>Ethics approval and consent for germline genetic</li>
                            </ul>
                            </br>
                            <span>
                                The Confluence project will harmonize existing genome-wide genotyping data from about 150,000 
                                cases and 200,000 controls and double it by generating new genotypes from at least 150,000 
                                additional breast cancer cases and 100,000 controls, for a total of at least 300,000 cases and 
                                300,000 controls of different ancestries.
                            </span>
                            </br></br>
                            <span>
                                Confluence will also harmonize risk factor, pathology, treatment, toxicities and survival data across studies.
                            </span>
                            </br></br>
                            <span>
                                Genotyping and harmonization of data is expected to be completed in 2022.
                            </span>
                        </div>
                    </div>
                    <div class="align-left" id="confluenceDataSummary">

                    </div>
                    <div class="main-summary-row align-left">
                        <div class="col">
                            For more information:</br>
                            Visit: <a href="https://dceg.cancer.gov/research/cancer-types/breast-cancer/confluence-project" target="__blank">https://dceg.cancer.gov/research/cancer-types/breast-cancer/confluence-project</a></br>
                            Email: <a href="mailto:ConfluenceProject@nih.gov">ConfluenceProject@nih.gov</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('confluenceDiv').innerHTML = template;
    getPublicFile('27jmuhandgz9qnc3tz81cx4v3rb87rrc', publicDataFileId).then(response => {
        const data = response.data;
        if(!data) return;
        const element = document.getElementById('confluenceDataSummary');
        let summary = '';
        summary += `
        </br>
        <div class="align-center">
            <div class="font-size-28 font-bold">Confluence Data Summary</div>
            <div class="main-summary-row">
                <div class="col font-size-18 align-center">
                    <table class="table table-bordered table-responsive w-100 d-block d-md-table">
                        <thead>
                            <th>Consortia</th>
                            <th>Studies</th>
                            <th>Cases</th>
                            <th>Controls</th>
                        </thead>
                        <tbody>`;
        let totalCases = 0;
        let totalControls = 0;
        let totalStudies = 0;
        for(let key in data) {
            if(key === 'dataModifiedAt') continue;
            totalCases += data[key].cases;
            totalControls += data[key].controls;
            totalStudies += data[key].studies;
            summary += `<tr>
                            <td>${data[key].name}</td>
                            <td>${numberWithCommas(data[key].studies)}</td>
                            <td>${numberWithCommas(data[key].cases)}</td>
                            <td>${numberWithCommas(data[key].controls)}</td>
                        </tr>`
        }
        summary += `<tr><td>Total #</td><td>${numberWithCommas(totalStudies)}</td><td>${numberWithCommas(totalCases)}</td><td>${numberWithCommas(totalControls)}</td></tr>`
        summary +=
                    `</tbody>
                </table>
                <div class="data-last-modified align-left">${new Date(data['dataModifiedAt']).toLocaleString()}</div></div></div></div>`
        element.innerHTML = summary;
    })
}