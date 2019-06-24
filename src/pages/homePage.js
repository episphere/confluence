export const template = () => {
    return `
    <div class="main-summary-row home-page-stats">
        <div class="summary-inner-col">
            <span class="data-summary-label">Consortia</span></br>
            <span><i class="fas fa-4x fa-layer-group"></i></span>
            <span class="data-summary-count">1</span></br>
        </div></br>
        <div class="summary-inner-col">
            <span class="data-summary-label">Studies</span></br>
            <span><i class="fas fa-4x fa-university"></i></span>
            <span class="data-summary-count">4</span></br>
        </div></br>
        <div class="summary-inner-col">
            <span class="data-summary-label">Cases</span></br>
            <span><i class="fas fa-4x fa-user"></i></span>
            <span class="data-summary-count" id="publicCaseCount">0</span>
        </div></br>
        <div class="summary-inner-col">
            <span class="data-summary-label">Controls</span></br>
            <span><i class="fas fa-4x fa-user"></i></span>
            <span class="data-summary-count" id="publicControlCount">0</span>
        </div>
    </div>
    <div class="main-summary-row">
        <div class="summary-inner-col" id="barChart"></div>
        <div class="summary-inner-col" id="pieChart"></div>
    </div>
    `;
}

export const homePageVisualization = async () => {
    const fileData = await fetch('/src/data.json');
    fileData.json().then(data => {
        document.getElementById('publicCaseCount').textContent = data.cases;
        document.getElementById('publicControlCount').textContent = data.controls;

        const ageData = data.age;        
        var trace = {
            mode:'lines+markers',
            type: "scatter",
            // type: "bar",
            x:Object.keys(ageData),
            y:Object.keys(ageData).map(keys => ageData[keys]),
            // marker: {
            //     color: '#c0236a'
            // },
            marker: {
                color: '#c0236a',
                size: 6
            },
            line: {
            color: '#000',
            width: 1
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