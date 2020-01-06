export const template = () => {
    return `
    <div class="main-summary-row home-page-stats sub-div-shadow">
        <div class="summary-inner-col">
            <span class="data-summary-label">Consortia</span></br>
            <span><i class="fas fa-3x fa-layer-group"></i></span>
            <span class="data-summary-count">1</span></br>
        </div></br>
        <div class="summary-inner-col">
            <span class="data-summary-label">Studies</span></br>
            <span><i class="fas fa-3x fa-university"></i></span>
            <span class="data-summary-count">4</span></br>
        </div></br>
        <div class="summary-inner-col">
            <span class="data-summary-label">Cases</span></br>
            <span><i class="fas fa-3x fa-user"></i></span>
            <span class="data-summary-count" id="publicCaseCount">0</span>
        </div></br>
        <div class="summary-inner-col">
            <span class="data-summary-label">Controls</span></br>
            <span><i class="fas fa-3x fa-user"></i></span>
            <span class="data-summary-count" id="publicControlCount">0</span>
        </div>
    </div>
    <div class="main-summary-row">
        <div class="summary-inner-col col-md-8" id="barChart"></div>
        <div class="summary-inner-col col-md-4" id="pieChart"></div>
    </div>
    <div class="main-summary-row about-confluence sub-div-shadow">
        <div class="col-md-3"><img height="100px" width="180px" src="https://dceg.cancer.gov/sites/g/files/xnrzdm236/files/styles/cgov_article/public/cgov_contextual_image/100/300/5/files/Confluence_Logo.png?itok=9FBxTnpk" alt="Confluence Logo"></div>
        <div class="col-md-9 align-left">The Confluence project will develop a large research resource by 2020 to uncover breast cancer genetics through genome-wide association studies (GWAS). The resource will include at least 300,000 breast cancer cases and 300,000 controls of different races/ethnicities. This will be accomplished by the confluence of existing GWAS and new genome-wide genotyping data to be generated through this project.</div>
        
        <div class="col-md-12 align-left">
            Broad scientific aims that can be addressed through this resource include:<br>
            <ol>
                <li>To discover susceptibility loci and advance knowledge of etiology of breast cancer overall and by subtypes.</li>
                <li>To develop polygenic risk scores and integrate them with known risk factors for personalized risk assessment for breast cancer overall and by subtypes. </li>
                <li>To discover loci for breast cancer prognosis, long-term survival, response to treatment, and second breast cancer. </li>
            </ol>
        </div>
    </div>
    `;
}

export const homePageVisualization = async () => {
    const fileData = await fetch('./data.json');
    fileData.json().then(data => {
        document.getElementById('publicCaseCount').textContent = data.cases;
        document.getElementById('publicControlCount').textContent = data.controls;

        const ageData = data.age;        
        var trace = {
            type: "bar",
            x:Object.keys(ageData),
            y:Object.keys(ageData).map(keys => ageData[keys]),
            marker: {
                color: '#c0236a'
            }
        }
        if(trace.x.length>1){
            if(trace.x.slice(-1)[0]=="undefined" || trace.x.slice(-1)[0]==""){
                trace.x.pop();
                trace.y.pop();
            }
        }
        var layout = {
            xaxis: {title:`Age`, font: {size: 16}},
            yaxis: {title:`Count`, font: {size: 16}},
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            title: {
                text: "Age Distribution Chart",
                font: {
                    size: 18
                }
            }
        };
        Plotly.newPlot('barChart', [trace], layout, {responsive: true, displayModeBar: false});

        const ethnicity = data.ethnicity;

        var pieData = [{
            values: Object.keys(ethnicity).map(key => ethnicity[key]),
            labels: Object.keys(ethnicity),
            type: 'pie',
            hole: .5,
            textinfo: "none"
        }];

        var pieLayout = {
            xaxis: {title:`Age`, font: {size: 16}},
            yaxis: {title:`Count`, font: {size: 16}},
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            title: {
                text: "Ethnicity Chart",
                font: {
                    size: 18
                }
            }
        };
        
        Plotly.newPlot('pieChart', pieData, pieLayout, {responsive: true, displayModeBar: false});
    });
}