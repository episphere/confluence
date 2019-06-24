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
    // const fileData = await fetch('/data.json');
    // fileData.json().then(dt => {
        let data = {
            "age": {
                "24": 2,
                "25": 2,
                "26": 4,
                "27": 5,
                "28": 6,
                "29": 9,
                "30": 26,
                "31": 14,
                "32": 22,
                "33": 27,
                "34": 29,
                "35": 38,
                "36": 59,
                "37": 66,
                "38": 62,
                "39": 91,
                "40": 99,
                "41": 148,
                "42": 160,
                "43": 159,
                "44": 179,
                "45": 242,
                "46": 271,
                "47": 318,
                "48": 336,
                "49": 328,
                "50": 333,
                "51": 332,
                "52": 410,
                "53": 332,
                "54": 367,
                "55": 590,
                "56": 605,
                "57": 530,
                "58": 478,
                "59": 460,
                "60": 528,
                "61": 521,
                "62": 509,
                "63": 494,
                "64": 530,
                "65": 470,
                "66": 485,
                "67": 442,
                "68": 453,
                "69": 422,
                "70": 372,
                "71": 355,
                "72": 302,
                "73": 272,
                "74": 232,
                "75": 114,
                "76": 123,
                "77": 71,
                "78": 74,
                "79": 53,
                "80": 42,
                "81": 35,
                "82": 35,
                "83": 19,
                "84": 18,
                "85": 14,
                "86": 11,
                "87": 4,
                "88": 3,
                "90": 1,
                "92": 1,
                "93": 1,
                "94": 1,
                "95": 1
            },
            "ethnicity": {
                "European" : 10509,
                "Hispanic": 58,
                "African": 94,
                "Other": 7
            },
            "cases": 5488,
            "controls": 7623
        }
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
    // });
}