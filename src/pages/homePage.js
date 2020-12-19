import { numberWithCommas, getPublicFile, publicDataFileId } from "./../shared.js";

export const template = () => {
    return `
    <div class="main-summary-row home-page-stats">
        <div class="col-lg-7">
            <div class="align-left info-confluence">
                <span style="color:#74103A;font-weight:bold">
                    Confluence
                </span> is a large international project to study breast cancer genetic susceptibility in women
                 and men of multiple ancestries, by integrating existing and new genome-wide genetic data.
            </div>
            
            <div class="card border">
                <div class="card-header confluence-color white-font"><strong>Confluence Data Summary</strong> 
                    <button class="info-btn" data-toggle="modal" data-target="#confluenceMainModal"  aria-label="More info"><i class="fas fa-question-circle cursor-pointer" id="confluenceQuestion"></i></button>
                </div>
                <div id="cardContent" class="card-body">
                    <div class="row" style="margin-bottom:0.5rem;text-align:center">
                        <div class="col" id="displayConsortiaName"></br></div>
                    </div>
                    <div class="row" style="margin-bottom:1rem">
                        <div class="col">Consortia</br><span id="publicConsortiaCount"><h2>0</h2></span></div>
                        <div class="col">Studies</br><span id="publicStudiesCount"><h2>0</h2></span></div>
                    </div>
                    <div class="row">
                        <div class="col">Cases</br><span id="publicCaseCount"><h2>0</h2></span></div>
                        <div class="col">Controls</br><span id="publicControlCount"><h2>0</h2></span></div>
                    </div>
                    <div class="row modified-at" id="publicDataModifiedAt"></div>
                </div>
            </div>
            <div class="align-left info-confluence-bottom">
                <span style="color:#74103A;font-weight:bold">Confluence</span> is funded by the U.S. National Cancer Institute (NCI), and coordinated by the Division of Cancer Epidemiology and Genetics (DCEG) at NCI.
            </div>
        </div>
        <div class="col-lg-5" id="confluenceInfo">
            <img usemap="#consortiamap" id="consortiaCircle" src="./static/images/home_page_circle.webp" alt="List of consortiums displayed in circle format" height="95%" width="95%">
            <map name="consortiamap">
                <area shape="circle" data-image="consortia_1.webp" data-consortia-name="BCAC" class="consortia-circle" coords="275,45,40" alt="BCAC" title="Breast Cancer Association Consortium" id="map1">
                <area shape="circle" data-image="consortia_2.webp" data-consortia-name="NCI-DCEG" class="consortia-circle" coords="385,110,40" alt="NCI-DCEG" title="NCI-DCEG" id="map2">
                <area shape="circle" data-image="consortia_3.webp" data-consortia-name="AABCGS" class="consortia-circle" coords="385,240,40" alt="AABCGS" title="African Ancestry Breast Cancer Genetic Study" id="map3">
                <area shape="circle" data-image="consortia_4.webp" data-consortia-name="LAGENO-BC" class="consortia-circle" coords="275,305,40" alt="LAGENO-BC" title="Latin America Genomics Breast Cancer Consortium" id="map4">
                <area shape="circle" data-image="consortia_5.webp" data-consortia-name="CIMBA" class="consortia-circle" coords="162,240,40" alt="CIMBA" title="Consortium of Investigators of Modifers of BRCA1/2" id="map5">
                <area shape="circle" data-image="consortia_6.webp" data-consortia-name="MALE-BC" class="consortia-circle" coords="162,110,40" alt="MALE-BC" title="Male Breast Cancer GWAS Consortium" id="map6">
            </map>
        </div>
    </div>
    `;
}

window.onresize = () => {
    // if(!document.getElementById('consortiaCircle')) return;
    // const height = document.getElementById('consortiaCircle').height;
    // const width = document.getElementById('consortiaCircle').width;
    // const radius = (height * width) / 5450;
    // const map1 = document.getElementById('map1');
    // map1.coords = `${width/1.99},${height/8.22},${radius}`;
    // const map2 = document.getElementById('map2');
    // map2.coords = `${width/1.42},${height/3.36},${radius}`;
    // const map3 = document.getElementById('map3');
    // map3.coords = `${width/1.42},${height/1.54},${radius}`;
    // const map4 = document.getElementById('map4');
    // map4.coords = `${width/1.99},${height/1.21},${radius}`;
    // const map5 = document.getElementById('map5');
    // map5.coords = `${width/3.39},${height/1.54},${radius}`;
    // const map6 = document.getElementById('map6');
    // map6.coords = `${width/3.39},${height/3.36},${radius}`;
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
            <span><strong>Cases:</strong> total number of subjects with breast cancer.</span></br>
            <span><strong>Controls:</strong> total number of subjects without breast cancer.</span></br>
        `;
    });
};

export const homePageVisualization = async () => {
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

    // const response = await fetch('./data.json');
    const response = await getPublicFile('27jmuhandgz9qnc3tz81cx4v3rb87rrc', publicDataFileId);
    const data = response.data;
    const dataModifiedAt = data.dataModifiedAt;
    document.getElementById('publicDataModifiedAt').innerHTML = `Data last modified at - ${new Date(dataModifiedAt).toLocaleString()}`;
    delete data.dataModifiedAt;
    
    const elements = document.getElementsByClassName('consortia-circle');
    const mainImage = document.getElementById('consortiaCircle');
    Array.from(elements).forEach(element => {
        element.addEventListener('mouseover', () => {
            const imageName = element.dataset.image;
            const consortiaName = element.dataset.consortiaName;
            mainImage.src = `./static/images/${imageName}`;
            document.getElementById('displayConsortiaName').innerHTML = `<strong>${element.title}</strong>`;
            document.getElementById('publicConsortiaCount').innerHTML = `<h2>1</h2>`;
            document.getElementById('publicStudiesCount').innerHTML = `<h2>${data[consortiaName] ? numberWithCommas(Object.values(data).filter(dt => dt.name === consortiaName).map(dt => dt.studies).reduce((a,b) => a+b)) : 0}</h2>`;
            document.getElementById('publicCaseCount').innerHTML = `<h2>${data[consortiaName] ? numberWithCommas(Object.values(data).filter(dt => dt.name === consortiaName).map(dt => dt.cases).reduce((a,b) => a+b)) : 0}</h2>`;
            document.getElementById('publicControlCount').innerHTML = `<h2>${data[consortiaName] ? numberWithCommas(Object.values(data).filter(dt => dt.name === consortiaName).map(dt => dt.controls).reduce((a,b) => a+b)) : 0}</h2>`;
        });
        element.addEventListener('mouseout', () => {
            mainImage.src = `./static/images/home_page_circle.webp`;
            document.getElementById('displayConsortiaName').innerHTML = '</br>';
            document.getElementById('publicConsortiaCount').innerHTML = `<h2>${numberWithCommas(Object.keys(data).length)}</h2>`;
            document.getElementById('publicStudiesCount').innerHTML = `<h2>${numberWithCommas(Object.values(data).map(dt => dt.studies).reduce((a,b) => a+b))}</h2>`;
            document.getElementById('publicCaseCount').innerHTML = `<h2>${numberWithCommas(Object.values(data).map(dt => dt.cases).reduce((a,b) => a+b))}</h2>`;
            document.getElementById('publicControlCount').innerHTML = `<h2>${numberWithCommas(Object.values(data).map(dt => dt.controls).reduce((a,b) => a+b))}</h2>`;
        })
    });
    document.getElementById('publicConsortiaCount').innerHTML = `<h2>${numberWithCommas(Object.keys(data).length)}</h2>`;
    document.getElementById('publicStudiesCount').innerHTML = `<h2>${numberWithCommas(Object.values(data).map(dt => dt.studies).reduce((a,b) => a+b))}</h2>`;
    document.getElementById('publicCaseCount').innerHTML = `<h2>${numberWithCommas(Object.values(data).map(dt => dt.cases).reduce((a,b) => a+b))}</h2>`;
    document.getElementById('publicControlCount').innerHTML = `<h2>${numberWithCommas(Object.values(data).map(dt => dt.controls).reduce((a,b) => a+b))}</h2>`;
}

export const infoDeck = () => {
    let template = '';
    template += `
        <div class="secondary-bg" style="padding-bottom: 1rem;">
            <div class="confluence-banner">
                <img src="./static/images/hero-banner.jpg" class="banner-logo" alt="Confluence logo">
                <div class="banner-overlay-text row justify-content-center text-center">
                    <div class="col-xl-12">
                        <h1 class="banner-overlay-h1">CONFLUENCE DATA PLATFORM</h1>
                        <div class="banner-overlay-line"></div>
                        <h3 class="banner-overlay-h3" style="font-size:1.7vw;">Uncovering breast cancer genetic susceptibility</h3>
                    </div>
                </div>
            </div>
            <div class="container align-middle text-center" style="margin-top: 70px;">
                <div class="card-deck" id="infoDeck" style="min-height: 200px;">`
                    template += cardContents({header: 'Learn about Confluence', button: 'Learn about Confluence', href: '#home', icon: 'fa-download', explanation: 'Confluence is a large international project to study breast cancer genetic susceptibility in women and men of multiple ancestries, by integrating existing and new genome-wide genetic data.'})
                    template += cardContents({header: 'Join a Participating Consortia', button: 'Join a Consortia', href: '#home', icon: 'fa-chart-bar', explanation: 'You can participate in Confluence by joining a breast cancer consortia.'})
                    template += cardContents({header: 'Request Data Access', button: 'Request Data Access', href: '#home', icon: 'fa-handshake', explanation: 'The Confluence Project is currently generating new genotyping data and harmonizing existing data across participating studies.'})
                template += `</div>
            </div>
        </div>
        <div class="secondary-bg inverse-triangle"></div>
        <div class="container align-center">
            <div class="font-size-28 font-weight-bold font-family-helvetica our-goals">OUR GOALS</div>
            <div class="row">
                <div class="col-lg-3"></div>
                <div class="col-lg-6 font-size-18 align-left">To build a large research data resource of at least 300,000 breast cancer cases and 300,000 controls for multi-ancestry genome wide association studies (GWAS) to:</div>
                <div class="col-lg-3"></div>
            </div>
            <br>
            <div class="row">
                <div class="col-lg-3"></div>
                <div class="col-lg-auto font-size-18 align-left">
                    <ul>
                        <li>Discover variants for breast cancer risk overall and by subtype</li>
                        <li>Develop multi-ancestry polygenic risk scores for personalized risk assessment</li>
                        <li>Discover variants for breast cancer survival, pharmacogenomics, and second cancers</li>
                    </ul>
                </div>
                <div class="col-lg-2"></div>
            </div>
        </div>
        <div class="ternary-bg">
            <div class="container align-left confluence-info font-family-helvetica">
                <div>Confluence is a large international project to study breast cancer genetic susceptibility in women and men of multiple ancestries, by integrating existing and new genome-wide genetic data, across several breast cancer consortia. Confluence is funded by the US National Cancer Institute (NCI), and coordinated by the Division of Cancer Epidemiology and Genetics (DCEG) of NCI.</div>
            </div>
        </div>
    `
    document.getElementById('confluenceDiv').innerHTML = template;
}

export const infoDeckAfterLoggedIn = () => {
    let template = '';
    template += `
        <div class="secondary-bg">
            <div class="confluence-banner">
                <img src="./static/images/hero-banner.jpg" class="banner-logo" alt="Confluence logo">
                <div class="banner-overlay-text row justify-content-center text-center">
                    <div class="col-md-12">
                        <h1 class="banner-overlay-h1">CONFLUENCE DATA PLATFORM</h1>
                        <div class="banner-overlay-line"></div>
                        <h3 class="banner-overlay-h3" style="font-size:1.7vw;">Uncovering breast cancer genetic susceptibility</h3>
                    </div>
                </div>
            </div>
            <div class="container align-middle text-center" style="margin-top: 70px;">
                <div class="card-deck" id="infoDeck" style="min-height: 200px;">`
                template += cardContents({header: 'Submit Data', button: 'Submit Data', href: '#data_submission', icon: 'fa-upload', explanation: 'Submit data from your study or consortium. </br></br>You can always view, modify or download any data you submit.'})
                template += cardContents({header: 'Explore Data', button: 'Explore Data', href: '#data_exploration/summary', icon: 'fa-chart-bar', explanation: 'Explore summary-level data to plan analyses. </br></br>Does not require DACC review.'})
                template += cardContents({header: 'Submit a Proposal', button: 'Submit a Proposal', href: '#home', icon: 'fa-file-upload', explanation: 'Submit a proposal to access data for analyses. </br></br>Proposals will be reviewed by DACCs from all relevant consortia.'})
                template += cardContents({header: 'My Projects', button: 'My Projects', href: '#my_projects', icon: 'fa-database', explanation: 'Analyze data for projects approved by all relevant DACCs. </br></br>Requires data agreements.'})
                template += `</div>
            </div>
        </div>
        <div class="secondary-bg inverse-triangle"></div>
        <div class="container align-center">
            <div class="font-size-28 font-weight-bold font-family-helvetica our-goals">OUR GOALS</div>
            <div class="row">
                <div class="col-lg-3"></div>
                <div class="col-lg-6 font-size-18 align-left">To build a large research data resource of at least 300,000 breast cancer cases and 300,000 controls for multi-ancestry genome wide association studies (GWAS) to:</div>
                <div class="col-lg-3"></div>
            </div>
            <br>
            <div class="row">
                <div class="col-lg-3"></div>
                <div class="col-lg-auto font-size-18 align-left">
                    <ul>
                        <li>Discover variants for breast cancer risk overall and by subtype</li>
                        <li>Develop multi-ancestry polygenic risk scores for personalized risk assessment</li>
                        <li>Discover variants for breast cancer survival, pharmacogenomics, and second cancers</li>
                    </ul>
                </div>
                <div class="col-lg-2"></div>
            </div>
        </div>
        <div class="ternary-bg">
            <div class="container align-left confluence-info font-family-helvetica">
                <div>Confluence is a large international project to study breast cancer genetic susceptibility in women and men of multiple ancestries, by integrating existing and new genome-wide genetic data, across several breast cancer consortia. Confluence is funded by the US National Cancer Institute (NCI), and coordinated by the Division of Cancer Epidemiology and Genetics (DCEG) of NCI.</div>
            </div>
        </div>
    `
    document.getElementById('confluenceDiv').innerHTML = template;
}

const cardContents = (obj) => {
    return `
        <div class="col-xl card confluence-cards">
            <div class="primary-bg rounded-circle" style="margin-top: -40px; padding: 10px;">
                <i class="fas ${obj.icon} fa-2x icon-padding font-white"></i>
            </div>
            <div class="card-body">
                <div class="card-title" style="color: #333B4D">
                    <div class="font-size-28"><b>${obj.header}</b></div>
                </div>
                <p class="text-secondary card-text font-size-14">
                    ${obj.explanation}
                </p>
            </div>

            <div class="white-bg border-top-0 card-footer" style="width: 100%;">
                <button type="button" class="my-2 border border-0 font-weight-bold btn primary-bg" style="width: 90%;">
                    <a class="stretched-link font-white" href="${obj.href}" style="text-decoration: none;">${obj.button}</a>
                </button>
            </div>
        </div>
        `;
}