import { getPublicFile, numberWithCommas, publicDataFileId } from "./../shared.js";

export const aboutConfluence = async () => {
    let template = `
        <div class="general-bg body-min-height padding-bottom-1rem">
            <div class="container">
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">Learn about Confluence</h1>
                    </div>
                </div>
                <div class="home-page-stats">
                    <div class="main-summary-row">
                        <div class="col font-size-18 align-left">
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
                    </div>`
    const response = await getPublicFile('27jmuhandgz9qnc3tz81cx4v3rb87rrc', publicDataFileId);
    const data = response.data;
    if(data){
        template += `
        </br>
        <div class="font-size-28 font-weight-bold">Confluence Data Summary</div>
        <div class="main-summary-row">
            <div class="col font-size-18 align-center">
                <table class="table table-bordered allow-overflow">
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
            template += `<tr>
                            <td>${data[key].name}</td>
                            <td>${numberWithCommas(data[key].studies)}</td>
                            <td>${numberWithCommas(data[key].cases)}</td>
                            <td>${numberWithCommas(data[key].controls)}</td>
                        </tr>`
        }
        if(totalStudies !== 0 && totalCases !== 0 && totalControls !== 0 ) template += `<tr><td>Total #</td><td>${numberWithCommas(totalStudies)}</td><td>${numberWithCommas(totalCases)}</td><td>${numberWithCommas(totalControls)}</td></tr>`
        template +=
                    `</tbody>
                </table>
                <div class="data-last-modified align-left">${new Date(data['dataModifiedAt']).toLocaleString()}</div>
                <div class="align-left">
                    For more information:</br>
                    Visit: <a href="https://dceg.cancer.gov/research/cancer-types/breast-cancer/confluence-project" target="__blank">https://dceg.cancer.gov/research/cancer-types/breast-cancer/confluence-project</a></br>
                    Email: <a href="mailto:ConfluenceProject@nih.gov">ConfluenceProject@nih.gov</a>
                </div>
            </div>
        </div>
        `
    }
    template += `
                </div>
            </div>
        </div>
    `;
    document.getElementById('confluenceDiv').innerHTML = template;
}