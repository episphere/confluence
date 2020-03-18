export const template = () => {
    return `
    <div class="main-summary-row home-page-stats sub-div-shadow">
        <div class="col-sm-7">
            <div class="align-left info-confluence">
                <span style="color:#74103A;font-weight:bold">Confluence</span> is an international research project funded by the Division of Cancer Epidemiology 
                and Genetics at the National  Cancer Institute (U.S.) focused on explaining  breast cancer genetics 
                through the confluence of existing and new genome-wide genotyping data.
            </div>
            <div class="card border sub-div-shadow">
                <div class="card-header confluence-color white-font"><strong>Confluence Data Summary</strong> 
                    <i class="fas fa-question-circle cursor-pointer" id="confluenceQuestion" data-toggle="modal" data-target="#confluenceMainModal"></i>
                </div>
                <div id="cardContent" class="card-body">
                    <div class="row" style="margin-bottom:1rem">
                        <div class="col"><strong>Consortia</strong></br>1</div>
                        <div class="col"><strong>Study</strong></br>4</div>
                        <div class="col"><strong>Ancestory</strong></br>3</div>
                    </div>
                    <div class="row">
                        <div class="col"><strong>Cases</strong></br><span id="publicCaseCount"></span></div>
                        <div class="col"><strong>Controls</strong></br><span id="publicControlCount"></span></div>
                        <div class="col"><strong>Carriers</strong></br>-</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-sm-5" id="confluenceInfo">
        
        </div>
    </div>
    <div class="main-summary-row">
        <div class="col-md-8" id="barChart"></div>
        <div class="col-md-4" id="pieChart"></div>
    </div>
    `;
}

export const addEventAboutConfluence = () => {
    const element = document.getElementById('confluenceQuestion');
    element.addEventListener('click', () => {
        const header = document.getElementById('confluenceModalHeader');
        const body = document.getElementById('confluenceModalBody');
        header.innerHTML = `<h5 class="modal-title">European Data Summary Variable Definitions</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>`;
        body.innerHTML = `
            <span><strong>Consortia:</strong> total number of breast cancer consortia contributing European GWAS data to Confluence.</span></br>
            <span><strong>Studies:</strong> total number of breast cancer studies contributing European GWAS data to Confluence.</span></br>
            <span><strong>Ancestries:</strong> total number of breast cancer ancestries contributing European GWAS to Confluence.</span></br>
            <span><strong>Cases:</strong> total number of breast cancer cases from European GWAS.</span></br>
            <span><strong>Controls:</strong> total number of breast cancer controls from European GWAS.</span></br>
            <span><strong>Carriers:</strong> total number of breast cancer carriers contributing European GWAS to Confluence.</span></br>
        `;
    });
};

export const homePageVisualization = async () => {
    const config = {
        "avatar_size": 110 //define the size of teh circle radius
    }
    
    const body = d3.select(document.getElementById('confluenceInfo'));
    
    const svg = body.append("svg")
    .attr("width", 500)
    .attr("height", 500);
    
    const defs = svg.append('svg:defs');
    
    const data = [
        {
            posx: 110,
            posy: 170,
            img: "./../../static/images/mutation_carriers.png",
        },
        {
            posx: 215,
            posy: 120,
            img: "./../../static/images/african_gwas.png",
        },
        {
            posx: 320,
            posy: 170,
            img: "./../../static/images/european_gwas.png",
        }, 
        {
            posx: 215,
            posy: 225,    
            img: "./../../static/images/confluence.png"
        },
        {
            posx: 315,
            posy: 280,    
            img: "./../../static/images/latina_gwas.png"
        }, 
        {
            posx: 220,
            posy: 330,    
            img: "./../../static/images/asian_gwas.png"
        }, 
        {
            posx: 115,
            posy: 285,    
            img: "./../../static/images/male_bc_gwas.png"
        }
    ]
    data.forEach(function(d, i) {
        defs.append("svg:pattern")
            .attr("id", "grump_avatar" + i)
            .attr("width", config.avatar_size)
            .attr("height", config.avatar_size)
            .attr("patternUnits", "userSpaceOnUse")
            .append("svg:image")
            .attr("xlink:href", d.img)
            .attr("width", config.avatar_size)
            .attr("height", config.avatar_size)
            .attr("x", 0)
            .attr("y", 0);

        const circle = svg.append("circle")
            .attr("transform", "translate(" + d.posx + "," + d.posy + ")")
            .attr("cx", config.avatar_size / 2)
            .attr("cy", config.avatar_size / 2)
            .attr("r", config.avatar_size / 2)
            .style("fill", "#fff")
            .style("fill", "url(#grump_avatar" + i + ")");
    });

    

    const fileData = await fetch('./data.json');
    fileData.json().then(data => {
        document.getElementById('publicCaseCount').textContent = data.cases;
        document.getElementById('publicControlCount').textContent = data.controls;

    //     const ageData = data.age;        
    //     var trace = {
    //         type: "bar",
    //         x:Object.keys(ageData),
    //         y:Object.keys(ageData).map(keys => ageData[keys]),
    //         marker: {
    //             color: '#c0236a'
    //         }
    //     }
    //     if(trace.x.length>1){
    //         if(trace.x.slice(-1)[0]=="undefined" || trace.x.slice(-1)[0]==""){
    //             trace.x.pop();
    //             trace.y.pop();
    //         }
    //     }
    //     var layout = {
    //         xaxis: {title:`Age`, font: {size: 16}, fixedrange: true},
    //         yaxis: {title:`Count`, font: {size: 16}, fixedrange: true},
    //         paper_bgcolor: 'rgba(0,0,0,0)',
    //         plot_bgcolor: 'rgba(0,0,0,0)',
    //         hovermode: false,
    //         title: {
    //             text: "Age Distribution Chart",
    //             font: {
    //                 size: 18
    //             }
    //         }
    //     };
    //     Plotly.newPlot('barChart', [trace], layout, {responsive: true, displayModeBar: false});

    //     const ethnicity = data.ethnicity;

    //     var pieData = [{
    //         values: Object.keys(ethnicity).map(key => ethnicity[key]),
    //         labels: Object.keys(ethnicity),
    //         type: 'pie',
    //         hole: .5,
    //         textinfo: "none"
    //     }];

    //     var pieLayout = {
    //         xaxis: {title:`Age`, font: {size: 16}},
    //         yaxis: {title:`Count`, font: {size: 16}},
    //         paper_bgcolor: 'rgba(0,0,0,0)',
    //         plot_bgcolor: 'rgba(0,0,0,0)',
    //         title: {
    //             text: "Ethnicity Chart",
    //             font: {
    //                 size: 18
    //             }
    //         }
    //     };
        
    //     Plotly.newPlot('pieChart', pieData, pieLayout, {responsive: true, displayModeBar: false});
    });
}