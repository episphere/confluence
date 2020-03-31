export const template = () => {
    return `
    <div class="main-summary-row home-page-stats sub-div-shadow">
        <div class="col-sm-7">
            <div class="align-left info-confluence">
                <span style="color:#74103A;font-weight:bold">Confluence</span> is an international research project - a consortium of consortia-that aims to build a large collaborative platform for germline genetic studies of breast cancer through the confluence of existing and new
                genome-wide genotyping data.
            </div>
            
            <div class="card border sub-div-shadow">
                <div class="card-header confluence-color white-font"><strong>Confluence Data Summary</strong> 
                    <i class="fas fa-question-circle cursor-pointer" id="confluenceQuestion" data-toggle="modal" data-target="#confluenceMainModal"></i>
                </div>
                <div id="cardContent" class="card-body">
                    <div class="row" style="margin-bottom:1rem">
                        <div class="col">Consortia</br><h3>1</h3></div>
                        <div class="col">Studies</br><h3>4</h3></div>
                    </div>
                    <div class="row">
                        <div class="col">Cases</br><span id="publicCaseCount"></span></div>
                        <div class="col">Controls</br><span id="publicControlCount"></span></div>
                    </div>
                </div>
            </div>
            <div class="align-left info-confluence-bottom">
                <span style="color:#74103A;font-weight:bold">Confluence</span> is funded by the U.S. National Cancer Institute (NCI), and coordinated by the Division of Cancer Epidemiology and Genetics (DCEG) at NCI.
            </div>
        </div>
        <div class="col-sm-5" id="confluenceInfo">
            <img id="consortiaCircle" src="./static/images/home_page_circle.png" alt="List of consortiums displayed in circle format" height="95%" width="95%" usemap="#consortiamap">
            <map name="consortiamap">
                <area shape="circle" data-image="consortia_1.png" class="consortia-circle" coords="275,45,40" alt="BCAC" title="Breast Cancer Association Consortium" id="map1">
                <area shape="circle" data-image="consortia_2.png" class="consortia-circle" coords="385,110,40" alt="NCI-DCEG" title="NCI-DCEG" id="map2">
                <area shape="circle" data-image="consortia_3.png" class="consortia-circle" coords="385,240,40" alt="AABCGS" title="African Ancestry Breast Cancer Genetic Study" id="map3">
                <area shape="circle" data-image="consortia_4.png" class="consortia-circle" coords="275,305,40" alt="LAGENO-BC" title="Latin America Genomics Breast Cancer Consortium" id="map4">
                <area shape="circle" data-image="consortia_5.png" class="consortia-circle" coords="162,240,40" alt="CIMBA" title="Consortium of Investigators of Modifers of BRCA1/2" id="map5">
                <area shape="circle" data-image="consortia_6.png" class="consortia-circle" coords="162,110,40" alt="MALE-BC" title="Male Breast Cancer GWAS Consortium" id="map6">
            </map>
        </div>
    </div>
    <div class="main-summary-row">
        <div class="col-md-8" id="barChart"></div>
        <div class="col-md-4" id="pieChart"></div>
    </div>
    `;
}

window.onresize = () => {
    if(!document.getElementById('consortiaCircle')) return;
    const height = document.getElementById('consortiaCircle').height;
    const width = document.getElementById('consortiaCircle').width;
    const radius = (height * width) / 5450;
    const map1 = document.getElementById('map1');
    map1.coords = `${width/1.99},${height/8.22},${radius}`;
    const map2 = document.getElementById('map2');
    map2.coords = `${width/1.42},${height/3.36},${radius}`;
    const map3 = document.getElementById('map3');
    map3.coords = `${width/1.42},${height/1.54},${radius}`;
    const map4 = document.getElementById('map4');
    map4.coords = `${width/1.99},${height/1.21},${radius}`;
    const map5 = document.getElementById('map5');
    map5.coords = `${width/3.39},${height/1.54},${radius}`;
    const map6 = document.getElementById('map6');
    map6.coords = `${width/3.39},${height/3.36},${radius}`;
}

export const addEventAboutConfluence = () => {
    const element = document.getElementById('confluenceQuestion');
    element.addEventListener('click', () => {
        const header = document.getElementById('confluenceModalHeader');
        const body = document.getElementById('confluenceModalBody');
        header.innerHTML = `<h5 class="modal-title">Definitions</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>`;
        body.innerHTML = `
            <span><strong>Consortia:</strong> total number of breast cancer consortia contributing data to Confluence.</span></br>
            <span><strong>Studies:</strong> total number of breast cancer studies contributing data to Confluence.</span></br>
            <span><strong>Ancestries:</strong> total number of breast cancer ancestries contributing to Confluence.</span></br>
            <span><strong>Cases:</strong> total number of breast cancer cases.</span></br>
            <span><strong>Controls:</strong> total number of breast cancer controls.</span></br>
            <span><strong>Carriers:</strong> total number of breast cancer carriers contributing to Confluence.</span></br>
        `;
    });
};

export const homePageVisualization = async () => {
    const elements = document.getElementsByClassName('consortia-circle');
    const mainImage = document.getElementById('consortiaCircle');
    Array.from(elements).forEach(element => {
        element.addEventListener('mouseover', () => {
            const imageName = element.dataset.image;
            mainImage.src = `./static/images/${imageName}`;
        });
        element.addEventListener('mouseout', () => {
            mainImage.src = `./static/images/home_page_circle.png`;
        })
    });
    // const config = {
    //     "avatar_size": 110 //define the size of teh circle radius
    // }
    
    // const body = d3.select(document.getElementById('confluenceInfo'));
    
    // const svg = body.append("svg")
    // .attr("viewBox", `0 0 500 500`);
    
    // const defs = svg.append('svg:defs');
    
    // const data = [
    //     {
    //         posx: 110,
    //         posy: 170,
    //         img: "./static/images/mutation_carriers.png",
    //     },
    //     {
    //         posx: 215,
    //         posy: 120,
    //         img: "./static/images/african_gwas.png",
    //     },
    //     {
    //         posx: 320,
    //         posy: 170,
    //         img: "./static/images/european_gwas.png",
    //     }, 
    //     {
    //         posx: 215,
    //         posy: 225,    
    //         img: "./static/images/confluence.png"
    //     },
    //     {
    //         posx: 315,
    //         posy: 280,    
    //         img: "./static/images/latina_gwas.png"
    //     }, 
    //     {
    //         posx: 220,
    //         posy: 330,    
    //         img: "./static/images/asian_gwas.png"
    //     }, 
    //     {
    //         posx: 115,
    //         posy: 285,    
    //         img: "./static/images/male_bc_gwas.png"
    //     }
    // ]
    // data.forEach(function(d, i) {
    //     defs.append("svg:pattern")
    //         .attr("id", "grump_avatar" + i)
    //         .attr("width", config.avatar_size)
    //         .attr("height", config.avatar_size)
    //         .attr("patternUnits", "userSpaceOnUse")
    //         .append("svg:image")
    //         .attr("xlink:href", d.img)
    //         .attr("width", config.avatar_size)
    //         .attr("height", config.avatar_size)
    //         .attr("x", 0)
    //         .attr("y", 0);

    //     const circle = svg.append("circle")
    //         .attr("transform", "translate(" + d.posx + "," + d.posy + ")")
    //         .attr("cx", config.avatar_size / 2)
    //         .attr("cy", config.avatar_size / 2)
    //         .attr("r", config.avatar_size / 2)
    //         .style("fill", "#fff")
    //         .style("fill", "url(#grump_avatar" + i + ")");
    // });

    

    const fileData = await fetch('./data.json');
    fileData.json().then(data => {
        document.getElementById('publicCaseCount').innerHTML = `<h3>${data.cases}</h3>`;
        document.getElementById('publicControlCount').innerHTML = `<h3>${data.controls}</h3>`;

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