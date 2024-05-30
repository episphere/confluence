import { addEventConsortiaFilter } from "../event.js";
import { getPublicFile, numberWithCommas, publicDataFileId } from "./../shared.js";

export const aboutConfluence = (activeTab, showDescripton) => {
    let template = `
        <div class="general-bg body-min-height padding-bottom-1rem">
            <div class="container">
                <div class="main-summary-row white-bg div-border">
                    <button class="sub-menu-btn"><a class="nav-link ${activeTab === 'overview' ? 'active': ''} black-font font-size-14" href="#about/overview"><strong>Overview</strong></a></button>
                    ${showDescripton ? `<button class="sub-menu-btn"><a class="nav-link ${activeTab === 'description' ? 'active': ''} black-font font-size-14" href="#about/description"> <strong>Description of Studies</strong></a></button>`:``}
                    <!--<button class="sub-menu-btn"><a class="nav-link ${activeTab === 'confluence' ? 'active': ''} black-font font-size-14" href="#about/confluence"> <strong>Description of Confluence</strong></a></button>-->
                </div>
                <div id="overview"></div>
            </div>
        </div>
    `;
    document.getElementById('confluenceDiv').innerHTML = template;
}

export const renderOverView = async () => {
    let template = `
        <div class="main-summary-row">
            <div class="align-left">
                <h1 class="page-header">Learn about Confluence</h1>
            </div>
        </div>
        <div class="home-page-stats font-size-18">
            <div class="main-summary-row">
                <div class="col align-left pt-2">
                    <div class="mb-3">
                        The Confluence project is developing a large research resource to uncover breast cancer genetics through genome-wide association studies (GWAS) in diverse populations.
                    </div>
                    <div class="mb-3">
                        Broad scientific aims include:
                    </div>
                    <div class="mb-3">
                        <ul>
                            <li>To discover susceptibility loci and advance knowledge of etiology of breast cancer overall and by subtypes.</li>
                            <li>To develop polygenic risk scores and integrate them with known risk factors for personalized risk assessment for breast cancer overall and by subtypes.</li>
                            <li>To discover loci for breast cancer prognosis, long-term survival, response to treatment, and second breast cancer.</li>
                        </ul>
                    </div>
                    
                    <div class="mb-3">
                        The Confluence project will harmonize existing genome-wide genotyping data from about 150,000 cases and 200,000 controls and double it by generating new genotypes from at least 150,000 additional breast cancer cases and 100,000 controls, for a total of at least 300,000 cases and 300,000 controls of different ancestries. Confluence will also harmonize risk factor, pathology, treatment, toxicities and survival data across studies. Genotyping and harmonization of data is expected to be completed in 2022.
                    </div>
                    <div>
                        The table below shows the current number of cases and controls from different participating consortia/studies. Numbers are updated regularly.
                    </div>
                </div>
            </div>
            <div class="align-left" id="confluenceDataSummary"></div>
            <div class="main-summary-row align-left">
                <div class="col">
                    <!---For more information:</br>
                    Visit: <a href="https://dceg.cancer.gov/research/cancer-types/breast-cancer/confluence-project" target="_blank" rel="noopener noreferrer">https://dceg.cancer.gov/research/cancer-types/breast-cancer/confluence-project</a></br>--->
                    Email: <a href="mailto:ConfluenceProject@nih.gov">ConfluenceProject@nih.gov</a>
                </div>
            </div>
        </div>
    `;
    document.getElementById('overview').innerHTML = template;
    const response = await fetch('https://raw.githubusercontent.com/episphere/confluence/master/publicDataSet.json');
    countPublicStatistics(await response.json(), true);
}

const countPublicStatistics = (d, caseControl) => {
    const data = JSON.parse(JSON.stringify(d));
    const element = document.getElementById('confluenceDataSummary');
    let totalConsortia = 0;
    let totalCases = 0;
    let totalControls = 0;
    let totalStudies = 0;
    let totalBRCA1 = 0;
    let totalBRCA2 = 0;
    let summary = 
    `
    </br>
        <div class="align-center">
            <div class="main-summary-row" style="margin: 0px 15px;margin-bottom:10px">
                <div class="col-md-2" style="padding: 0px">
                    <div class="custom-border allow-overflow align-left" style="height:100%; padding-left: 5px !important; margin-right: 15px;">
                    <span class="font-size-17 font-bold">Filter</span></br>
                    ${data['CIMBA'] ? `
                        <div class="form-group pr-1">
                            <label class="filter-label font-size-17" for="overviewConsortiumSelection">Consortium</label>
                            <select class="form-control font-size-15" id="overviewConsortiumSelection">
                                <option value='allOther'>Non-CIMBA</option>
                                <option ${!caseControl ? 'selected': ''} value='cimba'>CIMBA</option>
                            </select>
                        </div>
                    `:``}
    `
    if(caseControl) delete data['CIMBA'];
    for(let key in data) {
        if(!caseControl && key !== 'CIMBA') continue;
        if(key === 'dataModifiedAt') continue;
        ++totalConsortia;
        totalCases += data[key].cases;
        totalControls += data[key].controls;
        totalStudies += data[key].studies;
        if(data[key].BRCA1) totalBRCA1 += data[key].BRCA1
        if(data[key].BRCA2) totalBRCA2 += data[key].BRCA2
        summary += `<div class="row font-size-16" style="margin:2px 2px;">
            ${key !== 'CIMBA' ? `
                <input type="checkbox" data-consortia="${data[key].name}" id="label${data[key].name}" class="checkbox-consortia"/>
                    <label for="label${data[key].name}" class="study-name" title="${data[key].name}">${data[key].name === `NCI-DCEG` ? `C-NCI`:data[key].name.length > 8 ? `${data[key].name.substr(0,8)}...`:data[key].name}</label>
            `:``}
            </div>`
    }         
    summary += `</div></div>
                <div class="col-md-10 align-center" style="padding: 0px">
                    <div class="custom-border" style="margin-right: 15px; height: 100%;" id="renderDataSummaryCounts"></div>
                </div></div>
                <div class="col data-last-modified align-left">Data last modified at - ${new Date(data['dataModifiedAt']).toLocaleString()}</div></div>
                `
    element.innerHTML = summary;
    addEventOverviewConsortiumSelection(d);
    addEventConsortiaFilter(d)
    renderDataSummary({totalConsortia, totalStudies, totalCases, totalControls, totalBRCA1, totalBRCA2}, caseControl);
}

const addEventOverviewConsortiumSelection = (data) => {
    const select = document.getElementById('overviewConsortiumSelection');
    if(!select) return;
    select.addEventListener('change', () => {
        const selectedValue = select.value;
        if(selectedValue === 'cimba') countPublicStatistics(data, false);
        else countPublicStatistics(data, true);
    })
}

export const renderDataSummary = (obj, caseControl) => {
    document.getElementById('renderDataSummaryCounts').innerHTML = `
        <div class="row">
            <div class="col">
                <span class="font-size-22">Consortia</span></br>
                <span class="font-size-32">${numberWithCommas(obj.totalConsortia)}</span>
            </div>
            <div class="col">
                <span class="font-size-22">Studies</span></br>
                <span class="font-size-32">${numberWithCommas(obj.totalStudies)}</span>
            </div>
        </div>
        ${caseControl? `
            <div class="row mt-3">
                <div class="col">
                    <span class="font-size-22">Cases</span></br>
                    <span class="font-size-32">${numberWithCommas(obj.totalCases)}</span>
                </div>
                <div class="col">
                    <span class="font-size-22">Controls</span></br>
                    <span class="font-size-32">${numberWithCommas(obj.totalControls)}</span>
                </div>
            </div>
        `: `
        <div class="row mt-3">
                <div class="col">
                    <span class="font-size-22">BRCA1 Mutation Carriers</span></br>
                    <span class="font-size-32">${numberWithCommas(obj.totalBRCA1)}</span>
                </div>
                <div class="col">
                    <span class="font-size-22">BRCA2 Mutation Carriers</span></br>
                    <span class="font-size-32">${numberWithCommas(obj.totalBRCA2)}</span>
                </div>
            </div>
        `}
    `
}

export const renderDataDescription = async () => {
    /*   let template = `
    <article>
    <div class="article">
        <h1>
            Confluence Project Description
        </h1>
        
          <div class="blog-intro-text">
            <p>The Confluence project will develop a large research resource to uncover breast cancer genetics through genome-wide association studies (GWAS). The resource will include at least 300,000 breast cancer cases and 300,000 controls of different races/ethnicities. This will be accomplished by the confluence of existing GWAS and new genome-wide genotyping data to be generated through this project.</p></div>
              <div class="accordion">

            <button class="collapsible">Abstract</button>
            <div class="contentdropdown">
                <p>Genome wide association studies (GWAS) have been successful in identifying over 180 common susceptibility loci for breast cancer. However, heritability analyses indicate that breast cancer is a highly polygenic disease with thousands of common genetic variants of small effects, and that increasing sample sizes will generate new discoveries. The Confluence project aims to build a large research resource of over 300,000 cases and 300,000 controls of different ancestries—doubling current sample sizes to study the genetic architecture of breast cancer. This will be accomplished by the confluence of existing and new genome-wide genotyping data to be generated through this project.</p>
                <p>The specific aims of this project are: (1) to discover susceptibility loci and advance knowledge of etiology of breast cancer overall and by subtypes, (2) to develop polygenic risk scores and integrate them with known risk factors for personalized risk assessment for breast cancer overall and by subtypes, and (3) to discover loci for breast cancer prognosis, long-term survival, response to treatment, and second breast cancer. To be eligible to participate, studies with cases of <em>in situ</em> or invasive breast cancer (females or males) must have genome-wide genotyping data and/or germline DNA for genotyping, core phenotype data, and appropriate ethics approval for genetic studies and data sharing. During September-December 2018, we reached out to potential studies through existing GWAS consortia and other means to request interest in participating in this project. We received an excellent response demonstrating the feasibility of reaching the target number of cases and controls. This large increase in sample size and diversity of populations will enable discoveries that will lead to a better understanding of the etiology of distinct breast cancer subtypes and the role of genetic variation in prognosis and treatment response, thus improving risk stratification, prevention, and clinical care of breast cancer across ancestry groups.</p>
            </div>
        
            <button class="collapsible">Background</button>
            <div class="contentdropdown">
                <p>Genome wide association studies (GWAS) have been successful in identifying over 180 common susceptibility loci for breast cancer through large consortia currently including ~150,000 cases (plus controls), mostly of European and East Asian ancestry[1-3]. These important discoveries, coupled with follow-up functional studies, are providing unprecedented insights into the biological mechanisms linking common genetic variation with breast cancer predisposition. These include understanding the impact of variation in regulatory regions across the genome, enrichment of specific transcription factor binding sites and the overlap between candidate target genes and somatic driver mutations in breast tumors [1, 2]. These studies have provided strong evidence for heterogeneity of breast cancer etiology, with many loci being differentially associated with subtypes of breast cancer [2, 4-8]. Recent analyses show that ER status is a major determinant for heterogeneity of genotype risk associations, followed by grade of differentiation [6]. In addition, this research has shown that most loci predisposing to breast cancer in the general population are associated with risk in high-risk populations, such as <em>BRCA1</em> and <em>BRCA2</em> mutation carriers [9, 10]. Finally, clinical studies suggest a contribution of germline variants to breast cancer prognosis [11-13], response to treatment and toxicities [14-31].</p>

                <p>Most GWAS discoveries to date have been derived from analyses of populations of European ancestry in two highly successful multi-consortia efforts, the Collaborative Oncological Gene-environmental Study (COGS; PIs: <em>Per Hall</em> and <em>Doug Easton</em>) and the Oncoarray project (PIs: <em>Jacques Simard</em> and <em>Doug Easton</em>) in collaboration with the NCI-funded “Discovery, Biology and Risk of Inherited Variants in Breast Cancer Consortium” (DRIVE; PI: <em>Pete Kraft</em>). Studies have participated in these efforts through the well-established <a href="http://bcac.ccge.medschl.cam.ac.uk/">Breast Cancer Association Consortium (BCAC)</a><a class="icon-exit-notification" title="Exit Disclaimer" href="https://www.cancer.gov/policies/linking"><span class="show-for-sr">Exit Disclaimer</span></a> led by Doug Easton, and the <a href="http://cimba.ccge.medschl.cam.ac.uk/">Consortium of Investigators of Modifiers of <em>BRCA1</em>/<em>2</em> (CIMBA)</a><a class="icon-exit-notification" title="Exit Disclaimer" href="https://www.cancer.gov/policies/linking"><span class="show-for-sr">Exit Disclaimer</span></a> led by <em>Georgia Chenevix-Trench</em> and <em>Antonis Antoniou</em> [1, 2]. GWAS analyses in women of East Asian ancestry in BCAC and the <a href="https://projectreporter.nih.gov/project_info_description.cfm?aid=8433229&amp;icde=18237786&amp;ddparam=&amp;ddvalue=&amp;ddsub=&amp;cr=5&amp;csb=default&amp;cs=ASC">Asia Breast Cancer Consortium (ABCC)</a> led by <em>Wei Zheng</em> have identified additional loci, and shown associations with most loci identified in women of European ancestry [3, 32, 33]. GWAS in women of African ancestry have been substantially smaller and they have confirmed many associations found in other populations. However, few loci have been specifically identified in women of African ancestry [34-36]. This gap in knowledge is being addressed in an NCI-funded effort by the <a href="https://projectreporter.nih.gov/project_info_description.cfm?aid=9040408&amp;icde=30184576&amp;ddparam=&amp;ddvalue=&amp;ddsub=&amp;cr=1&amp;csb=default&amp;cs=ASC">African-Ancestry Breast Cancer Genetic Study (AABCGS)</a>, a multi-consortia GWAS of over 6,000 cases and similar number of controls (PIs: <em>Wei Zheng</em>; <em>Chris Haiman</em>; <em>Julie Palmer</em>). GWAS in women of Latin American or U.S. Latina women have been even smaller and thus, new efforts are needed to understand genetic predisposition in highly admixed Latina populations [37-39]. The Latin America Genomics Breast Cancer Consortium (LAGENO-BC) led by <em>Laura Fejerman</em> has recently been formed to address this question. GWAS of male breast cancer led by <em>Nick Orr</em>, although small in size due to the rarity of this disease in males, have shown differences in associations compared to females, with larger effect sizes for select known breast cancer loci [40]. Multi-ancestry analyses leveraging similarities across populations while accounting for differences, will be critical for discovery of new loci, as well as for fine-mapping and functional follow-up studies.</p>

                <p>Previous investigations have provided evidence for the possible roles of germline variation in determining prognosis [11-13], differential responses to adjuvant therapies [14-18]; and for determining therapeutic toxicities associated with treatments such as aromatase inhibitors [18-21], taxanes [22-26], and radiotherapy [27-31]. However, additional clinical studies are needed to further investigate the contribution of germline variants to these clinical outcomes. The Confluence Project will provide an unprecedented opportunity to address these clinical questions by bringing together resources and expertise from international clinical trials and population-based studies.</p>

                <p>Individual variants identified by GWAS are associated with small changes in risk; however, combining information on many common variants through the development of polygenic risk scores (PRS) can identify women, both with and without family history of breast cancer, at substantially different levels of genetic risk [41, 42]. Similar arguments apply for women with <em>BRCA</em> mutations [9]. For instance, a recently published PRS using information on 313 genetic variants (SNP: single nucleotide polymorphisms) can identify 1% of women of European ancestry with the highest PRS who are three times more likely of developing breast cancer than women at average risk [41]. The 313-SNP PRS alone can provide levels of risk stratification in the population that are larger than those provided by classical risk factors (i.e. menstrual, reproductive, hormonal and lifestyle factors) or mammographic breast density (Choudhury et al. Under Review). An integrated model with classical risk factors, breast density and PRS would provide the highest level of risk stratification. An extension of the BOADICEA risk model to include the 313-variant PRS can also provide substantial information on risk among carriers of <em>BRCA1/2</em>, <em>PALB2</em>, <em>CHEK2</em>, and <em>ATM</em> [43]. Furthermore, PRSs for female breast cancer have been shown to be predictive of male breast cancer risk for <em>BRCA1</em> and <em>BRCA2</em> mutation carriers [44]. Thus, newly developed PRSs based on GWAS discoveries can substantially improve identification of women at different levels of risk in the population that could translate into improvements in stratified prevention and screening strategies for breast cancer [42, 45-47].</p>

                <p>Analyses of the estimated underlying genetic architecture and effect size distribution of breast cancer susceptibility based on existing GWAS data indicate that this is a highly polygenic disease involving thousands of small risk variants, and that larger efforts should result in new discoveries. However, to make substantial gains in our understanding of breast cancer genetics, a major effort through strong collaborations across consortia and many studies is required. The Confluence project will function as a consortium of consortia to bring together existing GWAS data from about 150,000 cases and 200,000 controls and double it by generating new genotypes in female and male populations of different ancestry backgrounds from at least 150,000 new breast cancer cases and 100,000 controls (total of at least 300,000 cases and 300,000 controls).</p>

                <p>The large increase in sample size and diversity of populations that will be attained through the Confluence Project will enable more powerful modeling of the underlying polygenic risk of breast cancer, which along with information on linkage disequilibrium and genomic annotations, can better inform our understanding of the etiology of distinct breast cancer subtypes. In addition, extension of clinical studies with survival data, treatments, toxicities and second breast cancers will substantially improve the power for analyses of the role of genetic variation for these outcomes. Overall, this work will result in improvements in risk stratification, prevention, and clinical care of breast cancer across ancestry groups.</p>
            </div>

            <button class="collapsible">Objectives</button>
            <div class="contentdropdown">
                <p>The Confluence project aims to build a large research resource of at least 300,000 breast cancer cases and 300,000 controls to conduct multi-ancestry genome-wide association studies (GWAS) of breast cancer risk and prognosis.</p>

                <p><strong>Specific aims</strong>:</p>

                <p><strong>Aim 1</strong>: To discover susceptibility loci and advance knowledge of etiology of breast cancer overall and by subtypes.<br><strong>Aim 2</strong>: To develop polygenic risk scores and integrate them with known risk factors for personalized risk assessment for breast cancer overall and by subtypes.<br><strong>Aim 3</strong>: To discover loci for breast cancer prognosis, long-term survival, response to treatment, and second breast cancer.</p>

                <p>In addition to the specific aims listed above, this resource will allow us to address a broad range of scientific questions in breast cancer genetics, and will serve as the basis for further studies that will require collection of additional data or materials, for instance:</p>

                <ul><li>Discovery of new insights into biological mechanisms underlying genetic associations through follow-up functional laboratory-based studies.</li>
                    <li>Integration with genomic characterization of tumors to understand germline-somatic relationships.</li>
                    <li>Integration of validated prognostic loci or PRS in prognostication tools.</li>
                    <li>Genetic predisposition to second cancers (other than breast cancer).</li>
                    <li>Identification of genetic determinants for known or suspected risk factors and assessment of “causal” relationships through Mendelian randomization analyses.</li>
                    <li>Mosaicism/clonal hematopoiesis analyses.</li>
                </ul><p>Ongoing studies by collaborators in the Confluence project are aimed to identify and characterize rare variants and highly penetrant mutations through targeted, exome and whole genome sequencing strategies, e.g. CARRIERS (PIs: <em>Fergus Couch, Pete Kraft</em>), BRIDGES (PIs <em>Peter Devilee, Doug Easton</em>), PERSPECTIVE I&amp;I (PI: <em>Jacques Simard</em>), and BRA-STRAP (PI: <em>Melissa Southery</em>). These projects (and CIMBA) are estimating the combined effect of common variants and rare variants (e.g. in <em>BRCA/PALB2/ATM/CHEK2</em> carriers). Addition of high-risk variants to the Confluence genotyping array chip, informed by these other ongoing efforts, will allow for a comprehensive assessment of the underlying architecture of breast cancer along the continuum from high to low risk variants.</p>

                <p>Findings from the Confluence project will be highly relevant for science, public health, and clinical practice by advancing our understanding of the underlying genetic architecture of breast cancer for different subtypes and ancestry groups; improving breast cancer risk stratification in the general population and for moderate-high risk mutation carriers. Moreover, these results will establish the foundation for translational studies in stratified prevention through comprehensive breast cancer risk models.</p>
            </div>

            <button class="collapsible">Preliminary Data</button>
            <div class="contentdropdown">
                <p>After receiving a funding commitment from the NCI Director in September 2018, we approached studies through existing GWAS consortia (BCAC, CIMBA, AABCGS, ABCC), the extramural Division of Cancer Control and Prevention/NCI, leaders of previous GWAS in males and Latina women, leaders of clinical trials and other large breast cancer studies, as well as posted an invitation of participation in the Confluence project on the <a href="https://dceg.cancer.gov/research/cancer-types/breast-cancer/confluence-project">DCEG website</a>. For planning purposes, we used an online study inventory to collect information from studies interested in participating in the Confluence project. As of the 10th of December 2018, we received expressions of interest from 136 studies with over 150,000 breast cancer cases requiring new genotyping (<strong>Table 1</strong>). Approximately one-half of these cases have DNA already extracted and one-half require new extractions. The female non-<em>BRCA</em> mutation carrier breast cancer cases are from 98 studies, of which 53 belong to BCAC, 40 are not part of any existing consortia, and 4 are part of other consortia. Most female and male <em>BRCA</em> mutation carrier studies are already part of CIMBA.</p>

                <div style="height: 1px;"></div><figure class="table"><figcaption id="ui-id-2">Table 1: Number of breast cancer cases and controls requiring new genotyping</figcaption><div class=""><div><table class="table-default complex-table" style="width: 100%;" aria-labelledby="ui-id-2">
                    <thead><tr><th scope="col" style="text-align: center; vertical-align: middle;">Group</th>
                            <th scope="col" style="text-align: center; vertical-align: middle;">Breast Cancer Cases</th>
                            <th scope="col" style="text-align: center; vertical-align: middle;">Controls</th>
                        </tr></thead><tbody><tr><td>Female non-carriers</td>
                            <td class="text-right">125,352</td>
                            <td class="text-right">302,310</td>
                        </tr><tr><td>Female <em>BRCA1/2</em></td>
                            <td class="text-right">21,493</td>
                            <td class="text-right">17,897</td>
                        </tr><tr><td>Males (carrier and non-carriers)</td>
                            <td class="text-right">4,372</td>
                            <td class="text-right">9,034</td>
                        </tr><tr><td><strong>Total</strong></td>
                            <td class="text-right">151,217</td>
                            <td class="text-right">329,241</td>
                        </tr></tbody></table></div></div></figure><p>In addition, we have started to contact leaders of clinical trial studies and presented this project at the NCI Breast Cancer Steering Committee during the San Antonio Breast Cancer Symposium in December 2018. This exercise demonstrated that the goal of more than doubling the size of current GWAS studies by genotyping 150,000 new cases and 100,000 new controls through Confluence is feasible. It is also plausible that we could surpass this goal, which will add additional power to the discovery arm of this study. <strong>Table 2</strong> shows that a substantial proportion of female cases from non-carrier studies are of non-European (White) ancestry, and that new genotyping will substantially increase the numbers of diverse populations. Efforts to identify studies will continue until reaching the desired numbers, with particular emphasis on identifying understudied populations and tumor types.</p>

                <div style="height: 1px;"></div><figure class="table"><figcaption id="ui-id-3" style="padding-right: 0px;">Table 2: Race/ancestry distribution of non-carrier female breast cancer cases</figcaption><div class="scrollable has-scroll"><div><table class="table-default complex-table" style="width: 100%;" aria-labelledby="ui-id-3">
                    <thead><tr><th scope="col" style="text-align: center; vertical-align: middle;">Race/Ancestry Group</th>
                            <th scope="col" style="text-align: center; vertical-align: middle;">New Genotyping</th>
                            <th scope="col" style="text-align: center; vertical-align: middle;">%</th>
                            <th scope="col" style="text-align: center; vertical-align: middle;">Existing GWAS</th>
                            <th scope="col" style="text-align: center; vertical-align: middle;">%</th>
                            <th scope="col" style="text-align: center; vertical-align: middle;">Total</th>
                            <th scope="col" style="text-align: center; vertical-align: middle;">%</th>
                        </tr></thead><tbody><tr><td>White</td>
                            <td class="text-right">91,834</td>
                            <td class="text-right">73.3%</td>
                            <td class="text-right">144,195</td>
                            <td class="text-right">79.1%</td>
                            <td class="text-right">236,029</td>
                            <td class="text-right">76.7%</td>
                        </tr><tr><td>Asian</td>
                            <td class="text-right">9,803</td>
                            <td class="text-right">7.8%</td>
                            <td class="text-right">14,068</td>
                            <td class="text-right">7.7%</td>
                            <td class="text-right">23,871</td>
                            <td class="text-right">7.8%</td>
                        </tr><tr><td>Black or African American</td>
                            <td class="text-right">6,670</td>
                            <td class="text-right">5.3%</td>
                            <td class="text-right">16,508</td>
                            <td class="text-right">9.1%</td>
                            <td class="text-right">23,178</td>
                            <td class="text-right">7.5%</td>
                        </tr><tr><td>Hispanic or Latina</td>
                            <td class="text-right">11,781</td>
                            <td class="text-right">9.4%</td>
                            <td class="text-right">7,488</td>
                            <td class="text-right">4.1%</td>
                            <td class="text-right">19,269</td>
                            <td class="text-right">6.3%</td>
                        </tr><tr><td>Unknown</td>
                            <td class="text-right">4,324</td>
                            <td class="text-right">3.4%</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td class="text-right">4,324</td>
                            <td class="text-right">1.4%</td>
                        </tr><tr><td>Other</td>
                            <td class="text-right">813</td>
                            <td class="text-right">0.6%</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td class="text-right">813</td>
                            <td class="text-right">0.3%</td>
                        </tr><tr><td>American Indian or Alaska Native</td>
                            <td class="text-right">109</td>
                            <td class="text-right">0.1%</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td class="text-right">109</td>
                            <td class="text-right">&lt;0.1%</td>
                        </tr><tr><td>Native Hawaiian/Pacific Islander</td>
                            <td class="text-right">18</td>
                            <td class="text-right">&lt;0.1%</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td class="text-right">18</td>
                            <td class="text-right">&lt;0.1%</td>
                        </tr><tr><td><strong>TOTAL</strong></td>
                            <td class="text-right"><strong>125,352</strong></td>
                            <td>&nbsp;</td>
                            <td class="text-right"><strong>182,259</strong></td>
                            <td>&nbsp;</td>
                            <td class="text-right"><strong>307,611</strong></td>
                            <td>&nbsp;</td>
                        </tr></tbody></table></div></div></figure><p>We did not collect information on pathology characteristics from the cases during this planning phase, but based on previous data, we expect about 70% of cases to be ER-positive and 30% ER-negative.</p>
            </div>

            <button class="collapsible">Approach</button>
            <div class="contentdropdown">
                <h3>Study Population</h3>

                <p>Studies must meet the following criteria to be eligible to participate:</p>

                <ul><li>Studies of <em>in situ</em> or invasive breast cancer

                    <ul><li>Female or Male</li>
                        <li>Any subtype of breast cancer</li>
                    </ul></li>
                    <li>Genome-wide genotyping data or germline DNA for genotyping, i.e.:
                    <ul><li>Existing genome-wide genotyping data, or</li>
                        <li>Germline DNA available for new genotyping, or</li>
                        <li>Blood/buccal samples for germline DNA isolation and genotyping.</li>
                    </ul></li>
                    <li>Core phenotype data (as defined below)</li>
                    <li>Ethics approval and consent for genetic studies</li>
                    <li>Data sharing plan</li>
                </ul><p>Studies can have a wide range of study designs, including case-control studies, prospective cohorts, clinical case series, clinical trials, or special cohorts such retrospective cohorts of <em>BRCA1/2</em> mutation carriers, or carriers of mutations in other established breast cancer susceptibility genes (e.g. <em>ATM</em>, <em>CHEK2</em>, <em>PALB2</em>). The design and data available will determine whether studies can participate in all or a subset of the study aims described below. If we identify more studies to be genotyped than required, priority will be given to studies based on study size, understudied populations, availability of extracted high-quality DNA, high-quality data on risk factors, tumor characteristics, treatment and clinical outcomes.</p>

                <p>For studies that are already participating in breast cancer GWAS consortia, they can participate in the Confluence project through an existing consortium (<strong>Figure 1</strong>). Studies not already in consortia can participate by joining an existing consortium, forming a new group/consortium, or through a direct collaboration with DCEG, NCI.</p>

                <div data-embed-button="cgov_image_button" data-entity-embed-display="view_mode:media.image_display_article_full" data-entity-type="media" data-entity-uuid="dfcb4cc4-b466-4c48-863b-54c38e58ff72" data-langcode="en" class="embedded-entity">



                        
                    
                <figure class="image-full centered-set"><div class="centered-element">
                            <img src="../static/images/Confluence-Project-Figure1.png" width="751" height="269" alt="&quot;&quot;" loading="lazy"></div>
                            <figcaption><div class="caption-container no-resize">
                                        <p>Figure 1: Study participation through consortia or direct collaboration with DCEG/NCI</p>
                                                </div>
                        </figcaption></figure></div>
                <h3>Genotyping</h3>

                <p>Participating studies will be able to provide: 1) existing individual-level germline genotype data from previously scanned samples, or 2) samples (extracted germline DNA or blood/buccal samples for extraction) not previously scanned to be genotyped through Confluence. Contribution of summary GWAS data from studies unable to provide individual-level data will also be considered.</p>

                <p>New genotyping will be performed at two centers, the Cancer Genomics Research Laboratory (CGR) at DCEG/NCI (Stephen Chanock), and Strangways Laboratory at Cambridge University (UCAM, Doug Easton). Contribution of existing genotype data from studies that have been genotyped as part of an existing consortia (e.g. BCAC, CIMBA, AABCGS) can be done through the consortia after approval from individual studies. For studies that require new genotyping, the Confluence Project will cover the costs of sample shipment and materials (plates/tubes), DNA extractions (if needed), DNA quantitation/QC, return of left-over DNA (if requested), and genotyping and return of genotype files to contributing studies. However, Confluence will not be able to cover the costs from sample retrieval, preparation and aliquoting by individual studies.</p>

                <h4>Existing genotyping data from scanned samples</h4>

                <p>We will accept existing genotype data generated from eligible study samples using Illumina or Affymetrix chips; however, other methodologies may be considered. The following files/information will be requested:</p>

                <ul><li>Genotyping chip and manifest files</li>
                    <li>Genotype files: We can accept a range of data formats, including called genotype files with documentation of clustering/QC process, or pre-QC raw genotyping files.</li>
                    <li>Sample sheet (ID mapping)</li>
                </ul><p>For studies contributing existing genotyping data through a consortium (e.g. BCAC, CIMBA), we anticipate requesting post-QC data along with the clustering/QC steps and metrics used. For studies willing to participate in genetic mosaicism studies, analysis will necessitate access to the B-allele frequency and Log R data from the scanned chips.</p>

                <h4>Genotyping chips for new genotyping</h4>

                <p>We will be using the Illumina Infinium Global Screening Array (GSA) with &gt;665,000 variants in populations of non-African ancestry, and the Multi-Ethnic Genotyping Array (MEGA) with &gt;1.3 million variants in populations of African ancestry because of its improved coverage and imputation accuracy in this population. A custom content of ~100,000 variants will be added to the arrays, and will include known pathogenic variants in breast cancer genes such as <em>BRCA1</em>, <em>BRCA2</em>, <em>ATM</em>, <em>PALB2</em> and <em>CHEK2</em>, as well as novel variants identified in ongoing efforts to identify and characterize rare variants and highly penetrant mutations through targeted, exome and whole genome sequencing (including CARRIERS, BRIDGES, PERSPECTIVE I&amp;I, BRA-STRAP, AABCGS and ENIGMA). In addition, we will add content to facilitate fine mapping studies, copy number variation calling, and other questions of interest.</p>

                <h4>Biological sample requirements</h4>

                <p>For germline isolation we anticipate requesting the following specimen types as a source of germline DNA:</p>

                <ul><li>300-400uL (150uL minimum) of whole blood or buffy coat</li>
                    <li>1mL of saliva, Oragene™ or mouthwash/oral rinses</li>
                </ul><p>Tumor or serum samples will not be accepted as a source of germline DNA.</p>

                <p>The anticipated DNA requirements for isolated germline DNA from blood or buccal sources are:</p>

                <ul><li>500-1000ng if dsDNA quantitation, e.g. PicoGreen</li>
                    <li>1.0-1.5ug if spectrophotometric quantitation, e.g. NanoDrop</li>
                </ul><p>The requested amounts are larger than the minimum input material for genotyping to ensure receiving adequate DNA for array work, anticipating large variation in quantification across different laboratories, and allowing for residual raw material to use in case of a failure. Reduction in total mass/volume can be requested by studies, with the understanding that the likelihood of sample failure will be higher and the ability for recovery efforts will be limited. Existing library preps from exome or whole genome sequencing might be accepted if native DNA is not available. Upon request, residual material will be returned to study sites at the completion of the work.</p>

                <h4>Quality Control, genotyping calling and imputation</h4>

                <p>Standard QC procedures will involve the following steps:&nbsp;</p>

                <ol><li>Sample and SNP level completion rate check;</li>
                    <li>Sample heterozygosity assessment;</li>
                    <li>Sample duplication/assay concordance check;</li>
                    <li>Sex verification;</li>
                    <li>Relatedness check (with allowances for study designs that include relatives by default, e.g. CIMBA);</li>
                    <li>Ancestry and population structure assessment;&nbsp;</li>
                    <li>Assessment on deviation from Hardy-Weinberg Proportions.</li>
                </ol><p>Both existing and newly generated genotyping data will be imputed by chip and ancestry group using the most appropriate reference panels available at the time of analyses.</p>

                <h4>Return of genotyping data</h4>

                <p>For studies contributing samples for genotyping, the genotyping files/information detailed above will be returned to each participating study after QC procedures (we will consider requests for specific file formats from studies).</p>

                <h3>Phenotype Data</h3>

                <p>The following <em>core phenotype data</em> will be required from all participating studies: subject and sample IDs, age, sex, race/ancestry, family history, and ER status (index tumor). Complete core data is not required, if it has not been collected by the study.</p>

                <p>In addition, we will request the following data from studies that have it available (<em>not mandatory</em>).</p>

                <h4>Risk factors</h4>

                <ul><li>Menstrual cycle: age menarche, menopausal status, age menopause</li>
                    <li>Pregnancy: number of full-term births, age at first and last full-term birth, breastfeeding</li>
                    <li>Height, weight, body mass index</li>
                    <li>Oral contraceptives and menopausal therapy</li>
                    <li>Alcohol consumption and cigarette smoking</li>
                    <li>Benign breast disease and mammographic breast density</li>
                </ul><h4>Pathology (first and second breast tumors)</h4>

                <ul><li>Behavior, morphology</li>
                    <li>Grade, nodes, size</li>
                    <li>ER (core variable), PR, HER2, KI67 status</li>
                </ul><h4>Treatment/clinical follow up</h4>

                <ul><li>Treatment and toxicity information (to the extent available)</li>
                    <li>Locoregional relapse, years to relapse, distant metastases</li>
                    <li>Diagnosis of second breast cancer/s.</li>
                    <li>Age at diagnosis, follow-up time, vital status, cause of death for survival analyses</li>
                </ul><h3>Data Management</h3>

                <p>For studies contributing to the Confluence project through a consortia of studies, questionnaire, pathology and survival/treatment data, the consortia data coordinating center will be the custodians of data, providing data management and harmonization: female breast cancer studies of European or East Asian ancestry will be managed by BCAC (Cambridge University, Netherlands Cancer Institute and German Cancer Research Center); female and male studies of <em>BRCA1/2</em> mutation carriers will be managed by CIMBA (Cambridge University); female studies of Hispanic/Latina ancestry will be managed by LAGENO-BC (UCSF); female studies of African ancestry (DCEG/NCI) and unselected male breast cancer studies will be managed by <em>Nick Orr</em> (Queens University). Data management and harmonization for studies contributing directly through NCI will be carried out by DCEG/NCI. The genotyping laboratories at DCEG/NCI and Cambridge University will be responsible for the management, QC and imputation of existing and new genome-wide genotyping data.</p>

                <p>The aggregation of individual participant data on patient characteristics, treatment and follow up data on clinical outcomes and events (including toxicities) from clinical trials is a critical component for combined analyses to identify novel genetic determinants of clinical outcomes. We plan to accomplish this by establishing collaborations with existing clinical trial collaborative groups.</p>

                <p>The Confluence project will cover the costs of study and data management by consortium data coordinating centers through contracts. Although the project will not cover costs from data preparation by individual studies according to the data dictionary, it will be able to assist studies and accept raw data for centralized data coding, if this work cannot be carried out by individual studies. Data management and stewardship will follow FAIR (Findability, Accessibility, Interoperability, and Reusability) principles [48].</p>
            </div>

            <button class="collapsible">Analytic Plan</button>
            <div class="contentdropdown">
                <p>Below is a description of the analytical plan to address the main aims of the Confluence project. However, it is anticipated that methodologies and functional annotations will continue to evolve, thus we will use the most appropriate methods available at the time of analyses.</p>

                <h3><strong>Aim 1.</strong> To discover susceptibility loci and advance knowledge of etiology of breast cancer overall and by subtypes</h3>

                <p>The primary discovery analysis will involve standard single-SNP association testing across genome-wide panel of SNPs. As we would expect heterogeneity in associations across ancestry groups and subtypes, we plan to run additional association tests to maximize power in the presence of heterogeneous association, while borrowing strength across groups when associations are homogeneous (e.g. [49-51]). The primary goal would be to identify novel loci through association analysis combining all the data and then characterizing subtype and ancestry-specific associations. Association analyses for <em>BRCA1/2</em> mutation carriers will be based on modeling the retrospective likelihood of the observed genotypes conditional on breast cancer phenotypes [52], using adjusted test statistic to allow for non-independence among related individuals and account for correlation in genotypes [53]. Analyses will be done by genotyping chip and combined using fixed-effects meta-analysis [54].</p>

                <p><em>Transcriptome-wide Association Study (TWAS)</em>: In addition to single-SNP association test, we plan to carry out TWAS [55] by exploiting information on quantitative trait loci associated with gene-expression and other genomic characteristics, such as methylation. TWAS can improve power of discovery of genetic loci where multiple underlying variants affect disease mediated through an underlying common mechanism such as regulation of gene-expression. Recent studies have suggested that combining information from multiple tissues can improve the power for discovery of association analysis even for diseases that are very tissue specific [56-58]. Thus, we will consider cross-tissue TWAS analysis using the latest version of the Genotype-Tissue Expression (GTEx) and other genomic datasets.</p>

                <p><em>Enrichment analyses</em>: Based on the association statistics generated from GWAS, we plan to conduct enrichment analysis of association signals in relationship to functional genomic and population genetic characteristics (e.g. LD) of the genome characterized by ENCODE and other databases that may be available in the future. We anticipate to use stratified LD-score regressions [59] and related extensions for characterizing enrichment of association in multivariate models that can adjust for correlated annotations for each other. We will carry out the analyses with respect to both broad and cell-type specific annotations.</p>

                <p><em>Fine mapping and functional analyses of identified signals using functional annotation data</em>: We will conduct fine mapping analysis, informed with external functional data, around each locus identified through discovery stage of the analysis. We anticipate using Bayesian methods[60] that can integrate information on associations, local linkage disequilibrium pattern, and external functional information, such as eQTL characteristics, to compute posterior probabilities for each SNP within a fine-mapping region to be a causal variant.</p>

                <p><em>Heritability analyses for breast cancer overall and by subtype across ancestry groups</em>: Availability of large GWAS across subtypes and multiple ancestry groups will provide us the opportunity to explore the variation in genetic architecture of breast cancer in a more powerful way than it has been possible before. We will use state-of-the-art methods [61] for estimation of GWAS heritability to characterize how much of breast cancer risk variation can be explained by common variants across the different subtypes/ancestry groups. We will estimate degree of polygenicity and underlying effect-size distribution across different groups using methods we have recently developed [62]. We also plan to conduct GWAS co-heritability analysis to explore the overlap in genetic architecture across the different subtypes/mutation carriers/ancestry groups. Characterization of global genetic architecture of breast cancer using heritability, effect-size distribution, and genetic correlations will provide insight into similarity and differences in the genetic basis of breast cancer by different subtypes/ancestry groups and will allow us to explore the potential for genetic risk prediction at our current and future studies.</p>

                <h3><strong>Aim 2</strong>: To develop polygenic risk scores and integrate them with known risk factors for personalized risk assessment for breast cancer overall and by subtypes</h3>

                <p>We plan to develop optimal PRS for predicting breast cancer across different ancestry groups and subtypes. Similar to association testing, our general strategy would be to utilize state of the art methods that can borrow strength across the different groups while allowing for potential heterogeneity in associations. Based on the experience of developing subtype-specific PRS for European ancestry GWAS data, we have found that a strategy of selecting SNPs based on global association analysis across groups and then estimating association coefficients of selected SNPs in group-specific manner leads to a robust strategy for building PRS. We will also explore alternative, more advanced, methods, such as Bayes/Empirical-Bayes techniques, that allows estimation of association coefficient for SNPs across different groups under a “prior” model that will account for suitable degree of heterogeneity. We will develop PRS for the general population and also assess whether PRS specific to mutation carriers (e.g. <em>BRCA1</em>, <em>BRCA2</em>, <em>ATM</em>, <em>CHEK2</em> or <em>PALB2</em>) are required for optimal risk prediction in these high-risk populations.</p>

                <p>Genotypes will be aggregated with data on risk factors (reproductive and hormonal factors, anthropometry, alcohol consumption and other lifestyle factors, family history and breast features including benign breast disease and mammographic density). This will enable evaluations of gene-environment interactions, and development of population-specific risk models for overall and subtype risk predictions. We will use the iCARE and BOADICEA risk models [43, 63] to combine information on PRS, classical risk factors/family history and population incidence rates to develop integrated models for predicting absolute risk of breast cancer by subtypes and ancestry groups. Data from a parallel collaboration with the NCI Cohort Consortium to build risk prediction models will be used to obtain precise risk estimates of associations for classical risk factors by breast cancer subtypes and ancestry groups.</p>

                <h3><strong>Aim 3</strong>: To discover loci for breast cancer prognosis, long-term survival, response to treatment, and second breast cancer</h3>

                <p>Analyses for aim 3 will be limited to cases with information on clinical prognosis, treatment, toxicities and second breast cancers. We plan to conduct standard genome-wide survival analysis using a Cox proportional hazard model framework for breast cancer outcomes (e.g. breast cancer specific mortality, total mortality, and diagnosis of a second breast cancer following the index breast cancer). Time-to-event will be calculated from the date of diagnosis with left truncation to account for cases enrolled into studies after diagnosis (prevalent cases). Analyses will be stratified by tumor characteristics and treatment to evaluate treatment response. We will also evaluate heterogeneity in associations by factors such as tumor characteristics, ancestry group and treatment using standard interaction analyses, as well as newer methods for combined association analysis (see Aim 1). For studies with information on treatment-related toxicities (primarily clinical trials), we will conduct candidate and genome-wide survival analyses to identify genetic determinants of toxicities that could range from radiation exposure (e.g. fibrosis), aromatase inhibitors (e.g. musculoskeletal adverse events) and chemotherapy (e.g. anemia, febrile neutropenia, peripheral neuropathy).</p>

                <p>The lead statisticians for the Confluence SSC are <em>Nilanjan Chatterjee</em>, <em>Doug Easton</em>, <em>Antonis Antoniou</em> and <em>Pete Kraft</em>. They will provide oversight and expertise for the statistical analyses plans to address the main aims of the project as outlined above. However, they will not bear sole reasonability for data analyses. It is anticipated that primary statistical analyses will be performed in collaboration across analytical teams led by different members of the SSC. Other investigators will be able to propose and lead additional analyses through the submission of study concepts via the Confluence Data Platform (see below).</p>
            </div>

            <button class="collapsible">Projected Discoveries and Improvement in Risk Stratification</button>
            <div class="contentdropdown">
                <p>Using GENESIS, a novel method to characterize the effect size distribution of common variants based on existing summary-level GWAS data [62], we estimated that there are over 5,000 common susceptibility variants for breast cancer (MAF&gt;5%), most of them with very small (OR&lt;1.01) effect sizes [50]. The proposed sample size of at least 300,000 cases and 300,000 controls was chosen to increase the percentage polygenic variance for overall breast cancer explained by genome-wide significant variants from about 40% to nearly 60% [1], (Zhang et al. In preparation). This effort should identify virtually all variants with OR&gt;=1.02, and about half of variants with OR ~1.01. Identification of additional variants will require much large sample sizes due to their very small effect sizes. Substantial improvements in risk stratification are also expected by the addition of improved polygenic risk scores to breast cancer risk models [64].</p>
            </div>

            <button class="collapsible">Governance, Scientific Review, and Data Sharing</button>
            <div class="contentdropdown">
                <h3>Governance</h3>

                <p>The organizational structure has been designed to ensure close involvement of participating studies and consortia in the governance, oversight and operations of the Confluence Project:</p>

                <ul><li><em>Scientific Steering Committee (SSC)</em> co-chaired by the DCEG Deputy Director (Montse Garcia-Closas) and the BCAC lead (Doug Easton) includes representatives from all participating consortia (see full membership on cover page), and other large contributing studies or groups of studies. The mission of this committee is to bring together representatives of different collaborative groups, provide scientific expertise, contribute to the development of the research plan and provide oversight of the research resource for use by the wider scientific community. The SSC reports to the director of DCEG (Stephen Chanock), source of funding for Confluence.</li>
                    <li><em>External Advisory Group</em> will be formed by international experts in GWAS and advocates to provide logistical and scientific advice to the Confluence Project.</li>
                </ul><p>DCEG will be responsible for the overall coordination of the Confluence project, including management, integration and analyses by participating groups and consortia. However, each consortium will be responsible of the management and governance of data from their member studies, according to their rules and regulations.</p>

                <h3>Scientific Review of the Confluence Project</h3>

                <p>The Confluence Project has been reviewed by the NCI intramural review process used by all projects funded by the NCI Intramural Research Program. This involves an initial internal review by the DCEG Senior Advisory Group (SAG) that includes DCEG senior leadership and two or more ad hoc expert reviewers. DCEG SAG is advisory to the DCEG Director. The <a href="https://deainfo.nci.nih.gov/advisory/bsc/cse/cse.htm">NCI Board of Scientific Counselors for Clinical Sciences and Epidemiology</a> will provide external review of the progress and scientific output of the Confluence Project.</p>

                <h3>Data Sharing Plan</h3>

                <p>Summary-level data from analyses performed under the Confluence project will be broadly available to the scientific community at the time of manuscript publication reporting the main findings from the project. In addition, individual-level data will be accessible through two mechanisms:</p>

                <h4>A. Controlled data access through the Confluence Data Platform by eligible researchers:</h4>

                <p>Eligible researchers will be able to request access to individual-level data for specific analyses through the <em>Confluence Data Platform</em> that will be securely hosted in a Cloud environment (Figure 2). This platform will be designed to manage and facilitate data intake, access, governance, visualization and analyses of data following FAIR principles [48], compatible with individual study IRB’s and consortia policies. This approach will greatly facilitate collaborative analyses across multiple groups in a shared analytical space. Data will only be shared for academic research, not for commercial use.</p>

                <div data-embed-button="cgov_image_button" data-entity-embed-display="view_mode:media.image_display_article_full" data-entity-type="media" data-entity-uuid="e45fb462-e981-4812-a940-ba098d4e1415" data-langcode="en" class="embedded-entity">



                        
                    
                <figure class="image-full centered-set"><div class="centered-element">
                            <img src="../static/images/Confluence-Project-Figure2.png" width="782" height="317" alt="&quot;&quot;" loading="lazy"></div>
                            <figcaption><div class="caption-container no-resize">
                                        <p>Figure 2: Anticipated steps to gain access to Confluence Data</p>
                                                </div>
                        </figcaption></figure></div>
                <p>The ownership of the data will stay with the individual studies (i.e. the data/sample provider). For studies contributing data to the Confluence project through consortia, the custodian of the data will be the consortium data coordinating center (DCC; e.g. Cambridge University for BCAC or CIMBA), and data access will be governed by the consortium Data Access Coordinating Committee (DACC). A Letter of Understanding (LoU) and Material/Data Transfer Agreement (M/DTA) between the Data/Sample Provider and the Consortia DCC establish the terms and conditions under which data/samples will be transferred from individual studies to the Consortia DCC and describes the Confluence DTA. The Confluence DTA establishes the terms and conditions by which access to Confluence data will be provided to a researcher whose Study Concept has been approved by the Consortia DACCs. Researchers will then be able to visualize and analyze the data in the Cloud without data downloads (i.e. <em>code travels to the data</em>). Exceptions might be possible depending on analytical requirements.</p>

                <p>The anticipated process to get access to Confluence Data by eligible researchers is:</p>

                <ul><li>
                    <p>Researcher submits a study concept describing the project, including variables of interest, via the Confluence Data Platform to the consortia DACCs that govern the requested data.</p>
                    </li>
                    <li>
                    <p>After approval by the relevant consortia DACCs, individual studies contributing data are notified and given a time period to opt-out their study from the approved project.</p>
                    </li>
                    <li>
                    <p>After the opt-out period has elapsed, the researcher’s institution signs a DTA for the study concept with the consortium data coordinating center(s) governing the data.</p>
                    </li>
                    <li>
                    <p>Upon DTA signature, the data coordinating center(s) will be able to provide access of the approved data to researchers through the Confluence Data Platform. Requests will be digitally linked to specific variables so that following all required approvals access to the requested data from studies that do not opt-out will be “automatically” provided.</p>
                    </li>
                </ul><p>DCEG will work with the consortia DACCs to develop procedures/policies that facilitate data access/sharing across multiple consortia that are consistent with individual consortium data sharing policies and the <a href="https://osp.od.nih.gov/scientific-sharing/genomic-data-sharing/">NIH Genomic Data Sharing policy</a> (see below), and to develop authorship guidelines for Confluence publications. To improve data traceability and reproducibility of analyses/results, the data access policy for the Confluence project will be to provide data access for analyses through the Confluence Data Platform without downloading the data. Special requests for downloading the data will be considered if required analysis tools are not available on the data platform, and if data cannot be read remotely by the analysis tools.</p>

                <h4>B. Public data access through an NCI-approved data archive (e.g. dbGAP, EGA):</h4>

                <p>In accordance to the <a href="https://osp.od.nih.gov/scientific-sharing/genomic-data-sharing/">NIH Genomic Data Sharing policy</a>, individual–level genotyping data generated using funds from the Confluence Project must be submitted for public access to an NCI-approved data archive such as the <a href="https://www.ncbi.nlm.nih.gov/sra/docs/submitdbgap/">NIH database of Genotypes and Phenotypes (dbGaP)</a>, or the <a href="https://www.ebi.ac.uk/ega/home">European Genome-phenome Archive (EGA)</a><a class="icon-exit-notification" title="Exit Disclaimer" href="https://www.cancer.gov/policies/linking"><span class="show-for-sr">Exit Disclaimer</span></a>, along with associated core phenotype data. To ensure institutional commitment to this policy, an NCI/NIH Genomics Data Sharing Plan Form detailing the required level of commitment on data sharing will need to be signed by studies prior to genotyping of samples.</p>

                <p>This requirement <strong><em>does not apply</em></strong> to genotyping data generated using non-NIH funding.</p>

                <h3>Approximate Timeline</h3>

                <div data-embed-button="cgov_image_button" data-entity-embed-display="view_mode:media.image_display_article_full" data-entity-type="media" data-entity-uuid="b24a0d92-5c73-445f-8cd2-52b7360b92de" data-langcode="en" class="embedded-entity">


                        
                    
                <figure class="image-full centered-set"><div class="centered-element">
                            <img src="../static/images/timeline.png" height="200" alt="Approximate Timeline: Study Recruitment: 2018 to 2021 Sample Collection: mid 2019 – 2022 Genotyping: 2021 – 2023 Statistical Analysis &amp; Data Sharing: mid 2022 and beyond Publications: mid 2023 and beyond." loading="lazy"></div>
                <div class="callout-box">
                <h3>Interested in participating or have questions?</h3>

                <p>Contact <a href="mailto:ConfluenceProject@mail.nih.gov">ConfluenceProject@mail.nih.gov</a>.</p>
                </div>
            </div>

            <button class="collapsible">Appendix</button>
            <div class="contentdropdown">
                <p><a data-entity-substitution="canonical" data-entity-type="node" data-entity-uuid="e98708d1-59c4-4295-979f-fdfd5fa3fee6" href="/research/cancer-types/breast-cancer/confluence-steering-committee">Confluence Scientific Steering Committee</a></p>

                <p><a data-entity-substitution="canonical" data-entity-type="node" data-entity-uuid="b8c0731b-8aad-4d1e-8177-f392b133852a" href="/research/cancer-types/breast-cancer/confluence-abbreviations">Abbreviations</a></p>

                <p><a data-entity-substitution="canonical" data-entity-type="node" data-entity-uuid="a5e059e6-03bc-4774-b34a-f61d41b6f182" href="/research/cancer-types/breast-cancer/references-confluence">References</a></p>

                <p>&nbsp;</p>
            </div>
        </div>
    </div>
</div>`;*/
    let template = `
    <div class="main-summary-row">
            <div class="align-left">
                <h1 class="page-header">Confluence Project Description</h1>
            </div>
        </div>
        <div class="home-page-stats font-size-18">
            <div class="main-summary-row">
                <div class="col align-left pt-2">
                <hr>
                    <div class="row">
                        <div class="col-3">
                            <ul class="nav nav-pills flex-column">
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link active" id="abstractTab" data-toggle="tab" href="#abstract" role="tab"
                                        aria-controls="abstract" aria-selected="true">Abstract</a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link" id="backgroundTab" data-toggle="tab" href="#background" role="tab"
                                        aria-controls="background" aria-selected="false">Background</a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link" id="objectivesTab" data-toggle="tab" href="#objectives" role="tab"
                                        aria-controls="objectives" aria-selected="false">Objectives</a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link" id="preliminaryTab" data-toggle="tab" href="#preliminary" role="tab"
                                        aria-controls="preliminary" aria-selected="false">Preliminary Data</a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link" id="approachTab" data-toggle="tab" href="#approach" role="tab"
                                        aria-controls="approach" aria-selected="false">Approach</a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link" id="analyticTab" data-toggle="tab" href="#analytic" role="tab"
                                        aria-controls="analytic" aria-selected="false">Analytic Plan</a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link" id="projectedTab" data-toggle="tab" href="#projectedDiscoveries" role="tab"
                                        aria-controls="projected" aria-selected="false">Projected Discoveries and Improvement in Risk
                                        Stratification</a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link" id="governanceTab" data-toggle="tab" href="#governance" role="tab"
                                        aria-controls="governance" aria-selected="false">Governance, Scientific Review, and Data
                                        Sharing</a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link" id="appendixTab" data-toggle="tab" href="#appendix" role="tab"
                                        aria-controls="appendix" aria-selected="false">Appendix</a>
                                </li>
                            </ul>
                        </div>
                        <div class="col-9">
                            <div class='tab-content'>
                                <div class="tab-pane fade show active" id="abstract" role="tabpanel" aria-labelledby="abstractTab">
                                    <p>Genome wide association studies (GWAS) have been successful in identifying over 180 common
                                        susceptibility
                                        loci for breast cancer. However, heritability analyses indicate that breast cancer is a highly
                                        polygenic
                                        disease with thousands of common genetic variants of small effects, and that increasing sample
                                        sizes
                                        will generate new discoveries. The Confluence project aims to build a large research resource of
                                        over
                                        300,000 cases and 300,000 controls of different ancestries—doubling current sample sizes to
                                        study
                                        the
                                        genetic architecture of breast cancer. This will be accomplished by the confluence of existing
                                        and
                                        new
                                        genome-wide genotyping data to be generated through this project.</p>
                                    <p>The specific aims of this project are: (1) to discover susceptibility loci and advance knowledge
                                        of
                                        etiology of breast cancer overall and by subtypes, (2) to develop polygenic risk scores and
                                        integrate
                                        them with known risk factors for personalized risk assessment for breast cancer overall and by
                                        subtypes,
                                        and (3) to discover loci for breast cancer prognosis, long-term survival, response to treatment,
                                        and
                                        second breast cancer. To be eligible to participate, studies with cases of <em>in situ</em> or
                                        invasive
                                        breast cancer (females or males) must have genome-wide genotyping data and/or germline DNA for
                                        genotyping, core phenotype data, and appropriate ethics approval for genetic studies and data
                                        sharing.
                                        During September-December 2018, we reached out to potential studies through existing GWAS
                                        consortia
                                        and
                                        other means to request interest in participating in this project. We received an excellent
                                        response
                                        demonstrating the feasibility of reaching the target number of cases and controls. This large
                                        increase
                                        in sample size and diversity of populations will enable discoveries that will lead to a better
                                        understanding of the etiology of distinct breast cancer subtypes and the role of genetic
                                        variation
                                        in
                                        prognosis and treatment response, thus improving risk stratification, prevention, and clinical
                                        care
                                        of
                                        breast cancer across ancestry groups.</p>
                                </div>
                                <div class="tab-pane fade" id="background" role="tabpanel" aria-labelledby="backgroundTab">
                                    <p>Genome wide association studies (GWAS) have been successful in identifying over 180 common
                                        susceptibility
                                        loci for breast cancer through large consortia currently including ~150,000 cases (plus
                                        controls),
                                        mostly of European and East Asian ancestry[1-3]. These important discoveries, coupled with
                                        follow-up
                                        functional studies, are providing unprecedented insights into the biological mechanisms linking
                                        common
                                        genetic variation with breast cancer predisposition. These include understanding the impact of
                                        variation
                                        in regulatory regions across the genome, enrichment of specific transcription factor binding
                                        sites
                                        and
                                        the overlap between candidate target genes and somatic driver mutations in breast tumors [1, 2].
                                        These
                                        studies have provided strong evidence for heterogeneity of breast cancer etiology, with many
                                        loci
                                        being
                                        differentially associated with subtypes of breast cancer [2, 4-8]. Recent analyses show that ER
                                        status
                                        is a major determinant for heterogeneity of genotype risk associations, followed by grade of
                                        differentiation [6]. In addition, this research has shown that most loci predisposing to breast
                                        cancer
                                        in the general population are associated with risk in high-risk populations, such as
                                        <em>BRCA1</em>
                                        and
                                        <em>BRCA2</em> mutation carriers [9, 10]. Finally, clinical studies suggest a contribution of
                                        germline
                                        variants to breast cancer prognosis [11-13], response to treatment and toxicities [14-31].</p>
                
                                    <p>Most GWAS discoveries to date have been derived from analyses of populations of European ancestry
                                        in
                                        two
                                        highly successful multi-consortia efforts, the Collaborative Oncological Gene-environmental
                                        Study
                                        (COGS;
                                        PIs: <em>Per Hall</em> and <em>Doug Easton</em>) and the Oncoarray project (PIs: <em>Jacques
                                            Simard</em>
                                        and <em>Doug Easton</em>) in collaboration with the NCI-funded “Discovery, Biology and Risk of
                                        Inherited
                                        Variants in Breast Cancer Consortium” (DRIVE; PI: <em>Pete Kraft</em>). Studies have
                                        participated in
                                        these efforts through the well-established <a href="http://bcac.ccge.medschl.cam.ac.uk/">Breast
                                            Cancer
                                            Association Consortium (BCAC)</a><a class="icon-exit-notification" title="Exit Disclaimer"
                                            href="https://www.cancer.gov/policies/linking"><span class="show-for-sr">Exit
                                                Disclaimer</span></a>
                                        led by Doug Easton, and the <a href="http://cimba.ccge.medschl.cam.ac.uk/">Consortium of
                                            Investigators
                                            of Modifiers of <em>BRCA1</em>/<em>2</em> (CIMBA)</a><a class="icon-exit-notification"
                                            title="Exit Disclaimer" href="https://www.cancer.gov/policies/linking"><span
                                                class="show-for-sr">Exit Disclaimer</span></a> led by <em>Georgia Chenevix-Trench</em>
                                        and
                                        <em>Antonis Antoniou</em> [1, 2]. GWAS analyses in women of East Asian ancestry in BCAC and the
                                        <a
                                            href="https://projectreporter.nih.gov/project_info_description.cfm?aid=8433229&amp;icde=18237786&amp;ddparam=&amp;ddvalue=&amp;ddsub=&amp;cr=5&amp;csb=default&amp;cs=ASC">Asia
                                            Breast Cancer Consortium (ABCC)</a> led by <em>Wei Zheng</em> have identified additional
                                        loci,
                                        and
                                        shown associations with most loci identified in women of European ancestry [3, 32, 33]. GWAS in
                                        women of
                                        African ancestry have been substantially smaller and they have confirmed many associations found
                                        in
                                        other populations. However, few loci have been specifically identified in women of African
                                        ancestry
                                        [34-36]. This gap in knowledge is being addressed in an NCI-funded effort by the <a
                                            href="https://projectreporter.nih.gov/project_info_description.cfm?aid=9040408&amp;icde=30184576&amp;ddparam=&amp;ddvalue=&amp;ddsub=&amp;cr=1&amp;csb=default&amp;cs=ASC">African-Ancestry
                                            Breast Cancer Genetic Study (AABCGS)</a>, a multi-consortia GWAS of over 6,000 cases and
                                        similar
                                        number of controls (PIs: <em>Wei Zheng</em>; <em>Chris Haiman</em>; <em>Julie Palmer</em>). GWAS
                                        in
                                        women of Latin American or U.S. Latina women have been even smaller and thus, new efforts are
                                        needed
                                        to
                                        understand genetic predisposition in highly admixed Latina populations [37-39]. The Latin
                                        America
                                        Genomics Breast Cancer Consortium (LAGENO-BC) led by <em>Laura Fejerman</em> has recently been
                                        formed to
                                        address this question. GWAS of male breast cancer led by <em>Nick Orr</em>, although small in
                                        size
                                        due
                                        to the rarity of this disease in males, have shown differences in associations compared to
                                        females,
                                        with
                                        larger effect sizes for select known breast cancer loci [40]. Multi-ancestry analyses leveraging
                                        similarities across populations while accounting for differences, will be critical for discovery
                                        of
                                        new
                                        loci, as well as for fine-mapping and functional follow-up studies.</p>
                
                                    <p>Previous investigations have provided evidence for the possible roles of germline variation in
                                        determining prognosis [11-13], differential responses to adjuvant therapies [14-18]; and for
                                        determining
                                        therapeutic toxicities associated with treatments such as aromatase inhibitors [18-21], taxanes
                                        [22-26],
                                        and radiotherapy [27-31]. However, additional clinical studies are needed to further investigate
                                        the
                                        contribution of germline variants to these clinical outcomes. The Confluence Project will
                                        provide an
                                        unprecedented opportunity to address these clinical questions by bringing together resources and
                                        expertise from international clinical trials and population-based studies.</p>
                
                                    <p>Individual variants identified by GWAS are associated with small changes in risk; however,
                                        combining
                                        information on many common variants through the development of polygenic risk scores (PRS) can
                                        identify
                                        women, both with and without family history of breast cancer, at substantially different levels
                                        of
                                        genetic risk [41, 42]. Similar arguments apply for women with <em>BRCA</em> mutations [9]. For
                                        instance,
                                        a recently published PRS using information on 313 genetic variants (SNP: single nucleotide
                                        polymorphisms) can identify 1% of women of European ancestry with the highest PRS who are three
                                        times
                                        more likely of developing breast cancer than women at average risk [41]. The 313-SNP PRS alone
                                        can
                                        provide levels of risk stratification in the population that are larger than those provided by
                                        classical
                                        risk factors (i.e. menstrual, reproductive, hormonal and lifestyle factors) or mammographic
                                        breast
                                        density (Choudhury et al. Under Review). An integrated model with classical risk factors, breast
                                        density
                                        and PRS would provide the highest level of risk stratification. An extension of the BOADICEA
                                        risk
                                        model
                                        to include the 313-variant PRS can also provide substantial information on risk among carriers
                                        of
                                        <em>BRCA1/2</em>, <em>PALB2</em>, <em>CHEK2</em>, and <em>ATM</em> [43]. Furthermore, PRSs for
                                        female
                                        breast cancer have been shown to be predictive of male breast cancer risk for <em>BRCA1</em> and
                                        <em>BRCA2</em> mutation carriers [44]. Thus, newly developed PRSs based on GWAS discoveries can
                                        substantially improve identification of women at different levels of risk in the population that
                                        could
                                        translate into improvements in stratified prevention and screening strategies for breast cancer
                                        [42,
                                        45-47].</p>
                
                                    <p>Analyses of the estimated underlying genetic architecture and effect size distribution of breast
                                        cancer
                                        susceptibility based on existing GWAS data indicate that this is a highly polygenic disease
                                        involving
                                        thousands of small risk variants, and that larger efforts should result in new discoveries.
                                        However,
                                        to
                                        make substantial gains in our understanding of breast cancer genetics, a major effort through
                                        strong
                                        collaborations across consortia and many studies is required. The Confluence project will
                                        function
                                        as a
                                        consortium of consortia to bring together existing GWAS data from about 150,000 cases and
                                        200,000
                                        controls and double it by generating new genotypes in female and male populations of different
                                        ancestry
                                        backgrounds from at least 150,000 new breast cancer cases and 100,000 controls (total of at
                                        least
                                        300,000 cases and 300,000 controls).</p>
                
                                    <p>The large increase in sample size and diversity of populations that will be attained through the
                                        Confluence Project will enable more powerful modeling of the underlying polygenic risk of breast
                                        cancer,
                                        which along with information on linkage disequilibrium and genomic annotations, can better
                                        inform
                                        our
                                        understanding of the etiology of distinct breast cancer subtypes. In addition, extension of
                                        clinical
                                        studies with survival data, treatments, toxicities and second breast cancers will substantially
                                        improve
                                        the power for analyses of the role of genetic variation for these outcomes. Overall, this work
                                        will
                                        result in improvements in risk stratification, prevention, and clinical care of breast cancer
                                        across
                                        ancestry groups.</p>
                                </div>
                                <div class="tab-pane fade" id="objectives" role="tabpanel" aria-labelledby="objectivesTab">
                                    <p>The Confluence project aims to build a large research resource of at least 300,000 breast cancer
                                        cases
                                        and 300,000 controls to conduct multi-ancestry genome-wide association studies (GWAS) of breast
                                        cancer
                                        risk and prognosis.</p>
                
                                    <p><strong>Specific aims</strong>:</p>
                
                                    <p><strong>Aim 1</strong>: To discover susceptibility loci and advance knowledge of etiology of
                                        breast
                                        cancer overall and by subtypes.<br><strong>Aim 2</strong>: To develop polygenic risk scores and
                                        integrate them with known risk factors for personalized risk assessment for breast cancer
                                        overall
                                        and by
                                        subtypes.<br><strong>Aim 3</strong>: To discover loci for breast cancer prognosis, long-term
                                        survival,
                                        response to treatment, and second breast cancer.</p>
                
                                    <p>In addition to the specific aims listed above, this resource will allow us to address a broad
                                        range
                                        of
                                        scientific questions in breast cancer genetics, and will serve as the basis for further studies
                                        that
                                        will require collection of additional data or materials, for instance:</p>
                
                                    <ul>
                                        <li>Discovery of new insights into biological mechanisms underlying genetic associations through
                                            follow-up functional laboratory-based studies.</li>
                                        <li>Integration with genomic characterization of tumors to understand germline-somatic
                                            relationships.
                                        </li>
                                        <li>Integration of validated prognostic loci or PRS in prognostication tools.</li>
                                        <li>Genetic predisposition to second cancers (other than breast cancer).</li>
                                        <li>Identification of genetic determinants for known or suspected risk factors and assessment of
                                            “causal” relationships through Mendelian randomization analyses.</li>
                                        <li>Mosaicism/clonal hematopoiesis analyses.</li>
                                    </ul>
                                    <p>Ongoing studies by collaborators in the Confluence project are aimed to identify and characterize
                                        rare
                                        variants and highly penetrant mutations through targeted, exome and whole genome sequencing
                                        strategies,
                                        e.g. CARRIERS (PIs: <em>Fergus Couch, Pete Kraft</em>), BRIDGES (PIs <em>Peter Devilee, Doug
                                            Easton</em>), PERSPECTIVE I&amp;I (PI: <em>Jacques Simard</em>), and BRA-STRAP (PI:
                                        <em>Melissa
                                            Southery</em>). These projects (and CIMBA) are estimating the combined effect of common
                                        variants
                                        and
                                        rare variants (e.g. in <em>BRCA/PALB2/ATM/CHEK2</em> carriers). Addition of high-risk variants
                                        to
                                        the
                                        Confluence genotyping array chip, informed by these other ongoing efforts, will allow for a
                                        comprehensive assessment of the underlying architecture of breast cancer along the continuum
                                        from
                                        high
                                        to low risk variants.</p>
                
                                    <p>Findings from the Confluence project will be highly relevant for science, public health, and
                                        clinical
                                        practice by advancing our understanding of the underlying genetic architecture of breast cancer
                                        for
                                        different subtypes and ancestry groups; improving breast cancer risk stratification in the
                                        general
                                        population and for moderate-high risk mutation carriers. Moreover, these results will establish
                                        the
                                        foundation for translational studies in stratified prevention through comprehensive breast
                                        cancer
                                        risk
                                        models.</p>
                
                                </div>
                                <div class="tab-pane fade" id="preliminary" role="tabpanel" aria-labelledby="preliminaryTab">
                                    <p>After receiving a funding commitment from the NCI Director in September 2018, we approached
                                        studies
                                        through existing GWAS consortia (BCAC, CIMBA, AABCGS, ABCC), the extramural Division of Cancer
                                        Control
                                        and Prevention/NCI, leaders of previous GWAS in males and Latina women, leaders of clinical
                                        trials
                                        and
                                        other large breast cancer studies, as well as posted an invitation of participation in the
                                        Confluence
                                        project on the <a
                                            href="https://dceg.cancer.gov/research/cancer-types/breast-cancer/confluence-project">DCEG
                                            website</a>. For planning purposes, we used an online study inventory to collect information
                                        from
                                        studies interested in participating in the Confluence project. As of the 10th of December 2018,
                                        we
                                        received expressions of interest from 136 studies with over 150,000 breast cancer cases
                                        requiring
                                        new
                                        genotyping (<strong>Table 1</strong>). Approximately one-half of these cases have DNA already
                                        extracted
                                        and one-half require new extractions. The female non-<em>BRCA</em> mutation carrier breast
                                        cancer
                                        cases
                                        are from 98 studies, of which 53 belong to BCAC, 40 are not part of any existing consortia, and
                                        4
                                        are
                                        part of other consortia. Most female and male <em>BRCA</em> mutation carrier studies are already
                                        part of
                                        CIMBA.</p>
                
                                    <div style="height: 1px;"></div>
                                    <figure class="table">
                                        <figcaption id="ui-id-2">Table 1: Number of breast cancer cases and controls requiring new
                                            genotyping
                                        </figcaption>
                                        <div class="">
                                            <div>
                                                <table class="table-default complex-table" style="width: 100%;"
                                                    aria-labelledby="ui-id-2">
                                                    <thead>
                                                        <tr>
                                                            <th scope="col" style="text-align: center; vertical-align: middle;">Group
                                                            </th>
                                                            <th scope="col" style="text-align: center; vertical-align: middle;">Breast
                                                                Cancer
                                                                Cases</th>
                                                            <th scope="col" style="text-align: center; vertical-align: middle;">Controls
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>Female non-carriers</td>
                                                            <td class="text-right">125,352</td>
                                                            <td class="text-right">302,310</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Female <em>BRCA1/2</em></td>
                                                            <td class="text-right">21,493</td>
                                                            <td class="text-right">17,897</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Males (carrier and non-carriers)</td>
                                                            <td class="text-right">4,372</td>
                                                            <td class="text-right">9,034</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Total</strong></td>
                                                            <td class="text-right">151,217</td>
                                                            <td class="text-right">329,241</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </figure>
                                    <p>In addition, we have started to contact leaders of clinical trial studies and presented this
                                        project
                                        at
                                        the NCI Breast Cancer Steering Committee during the San Antonio Breast Cancer Symposium in
                                        December
                                        2018. This exercise demonstrated that the goal of more than doubling the size of current GWAS
                                        studies by
                                        genotyping 150,000 new cases and 100,000 new controls through Confluence is feasible. It is also
                                        plausible that we could surpass this goal, which will add additional power to the discovery arm
                                        of
                                        this
                                        study. <strong>Table 2</strong> shows that a substantial proportion of female cases from
                                        non-carrier
                                        studies are of non-European (White) ancestry, and that new genotyping will substantially
                                        increase
                                        the
                                        numbers of diverse populations. Efforts to identify studies will continue until reaching the
                                        desired
                                        numbers, with particular emphasis on identifying understudied populations and tumor types.</p>
                
                                    <div style="height: 1px;"></div>
                                    <figure class="table">
                                        <figcaption id="ui-id-3" style="padding-right: 0px;">Table 2: Race/ancestry distribution of
                                            non-carrier
                                            female breast cancer cases</figcaption>
                                        <div class="scrollable has-scroll">
                                            <div>
                                                <table class="table-default complex-table" style="width: 100%;"
                                                    aria-labelledby="ui-id-3">
                                                    <thead>
                                                        <tr>
                                                            <th scope="col" style="text-align: center; vertical-align: middle;">
                                                                Race/Ancestry
                                                                Group</th>
                                                            <th scope="col" style="text-align: center; vertical-align: middle;">New
                                                                Genotyping
                                                            </th>
                                                            <th scope="col" style="text-align: center; vertical-align: middle;">%</th>
                                                            <th scope="col" style="text-align: center; vertical-align: middle;">Existing
                                                                GWAS
                                                            </th>
                                                            <th scope="col" style="text-align: center; vertical-align: middle;">%</th>
                                                            <th scope="col" style="text-align: center; vertical-align: middle;">Total
                                                            </th>
                                                            <th scope="col" style="text-align: center; vertical-align: middle;">%</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>White</td>
                                                            <td class="text-right">91,834</td>
                                                            <td class="text-right">73.3%</td>
                                                            <td class="text-right">144,195</td>
                                                            <td class="text-right">79.1%</td>
                                                            <td class="text-right">236,029</td>
                                                            <td class="text-right">76.7%</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Asian</td>
                                                            <td class="text-right">9,803</td>
                                                            <td class="text-right">7.8%</td>
                                                            <td class="text-right">14,068</td>
                                                            <td class="text-right">7.7%</td>
                                                            <td class="text-right">23,871</td>
                                                            <td class="text-right">7.8%</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Black or African American</td>
                                                            <td class="text-right">6,670</td>
                                                            <td class="text-right">5.3%</td>
                                                            <td class="text-right">16,508</td>
                                                            <td class="text-right">9.1%</td>
                                                            <td class="text-right">23,178</td>
                                                            <td class="text-right">7.5%</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Hispanic or Latina</td>
                                                            <td class="text-right">11,781</td>
                                                            <td class="text-right">9.4%</td>
                                                            <td class="text-right">7,488</td>
                                                            <td class="text-right">4.1%</td>
                                                            <td class="text-right">19,269</td>
                                                            <td class="text-right">6.3%</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Unknown</td>
                                                            <td class="text-right">4,324</td>
                                                            <td class="text-right">3.4%</td>
                                                            <td>&nbsp;</td>
                                                            <td>&nbsp;</td>
                                                            <td class="text-right">4,324</td>
                                                            <td class="text-right">1.4%</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Other</td>
                                                            <td class="text-right">813</td>
                                                            <td class="text-right">0.6%</td>
                                                            <td>&nbsp;</td>
                                                            <td>&nbsp;</td>
                                                            <td class="text-right">813</td>
                                                            <td class="text-right">0.3%</td>
                                                        </tr>
                                                        <tr>
                                                            <td>American Indian or Alaska Native</td>
                                                            <td class="text-right">109</td>
                                                            <td class="text-right">0.1%</td>
                                                            <td>&nbsp;</td>
                                                            <td>&nbsp;</td>
                                                            <td class="text-right">109</td>
                                                            <td class="text-right">&lt;0.1%</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Native Hawaiian/Pacific Islander</td>
                                                            <td class="text-right">18</td>
                                                            <td class="text-right">&lt;0.1%</td>
                                                            <td>&nbsp;</td>
                                                            <td>&nbsp;</td>
                                                            <td class="text-right">18</td>
                                                            <td class="text-right">&lt;0.1%</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>TOTAL</strong></td>
                                                            <td class="text-right"><strong>125,352</strong></td>
                                                            <td>&nbsp;</td>
                                                            <td class="text-right"><strong>182,259</strong></td>
                                                            <td>&nbsp;</td>
                                                            <td class="text-right"><strong>307,611</strong></td>
                                                            <td>&nbsp;</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </figure>
                                    <p>We did not collect information on pathology characteristics from the cases during this planning
                                        phase,
                                        but based on previous data, we expect about 70% of cases to be ER-positive and 30% ER-negative.
                                    </p>
                
                                </div>
                                <div class="tab-pane fade" id="approach" role="tabpanel" aria-labelledby="approachTab">
                                    <h3>Study Population</h3>
                
                                    <p>Studies must meet the following criteria to be eligible to participate:</p>
                
                                    <ul>
                                        <li>Studies of <em>in situ</em> or invasive breast cancer
                
                                            <ul>
                                                <li>Female or Male</li>
                                                <li>Any subtype of breast cancer</li>
                                            </ul>
                                        </li>
                                        <li>Genome-wide genotyping data or germline DNA for genotyping, i.e.:
                                            <ul>
                                                <li>Existing genome-wide genotyping data, or</li>
                                                <li>Germline DNA available for new genotyping, or</li>
                                                <li>Blood/buccal samples for germline DNA isolation and genotyping.</li>
                                            </ul>
                                        </li>
                                        <li>Core phenotype data (as defined below)</li>
                                        <li>Ethics approval and consent for genetic studies</li>
                                        <li>Data sharing plan</li>
                                    </ul>
                                    <p>Studies can have a wide range of study designs, including case-control studies, prospective
                                        cohorts,
                                        clinical case series, clinical trials, or special cohorts such retrospective cohorts of
                                        <em>BRCA1/2</em>
                                        mutation carriers, or carriers of mutations in other established breast cancer susceptibility
                                        genes
                                        (e.g. <em>ATM</em>, <em>CHEK2</em>, <em>PALB2</em>). The design and data available will
                                        determine
                                        whether studies can participate in all or a subset of the study aims described below. If we
                                        identify
                                        more studies to be genotyped than required, priority will be given to studies based on study
                                        size,
                                        understudied populations, availability of extracted high-quality DNA, high-quality data on risk
                                        factors,
                                        tumor characteristics, treatment and clinical outcomes.</p>
                
                                    <p>For studies that are already participating in breast cancer GWAS consortia, they can participate
                                        in
                                        the
                                        Confluence project through an existing consortium (<strong>Figure 1</strong>). Studies not
                                        already
                                        in
                                        consortia can participate by joining an existing consortium, forming a new group/consortium, or
                                        through
                                        a direct collaboration with DCEG, NCI.</p>
                
                                    <div data-embed-button="cgov_image_button"
                                        data-entity-embed-display="view_mode:media.image_display_article_full" data-entity-type="media"
                                        data-entity-uuid="dfcb4cc4-b466-4c48-863b-54c38e58ff72" data-langcode="en"
                                        class="embedded-entity">
                
                
                
                
                
                                        <figure class="image-full centered-set">
                                            <div class="centered-element">
                                                <img src="../../static/images/Confluence-Project-Figure1.png" width="751" height="269"
                                                    alt="&quot;&quot;" loading="lazy"></div>
                                            <figcaption>
                                                <div class="caption-container no-resize">
                                                    <p>Figure 1: Study participation through consortia or direct collaboration with
                                                        DCEG/NCI
                                                    </p>
                                                </div>
                                            </figcaption>
                                        </figure>
                                    </div>
                                    <h3>Genotyping</h3>
                
                                    <p>Participating studies will be able to provide: 1) existing individual-level germline genotype
                                        data
                                        from
                                        previously scanned samples, or 2) samples (extracted germline DNA or blood/buccal samples for
                                        extraction) not previously scanned to be genotyped through Confluence. Contribution of summary
                                        GWAS
                                        data
                                        from studies unable to provide individual-level data will also be considered.</p>
                
                                    <p>New genotyping will be performed at two centers, the Cancer Genomics Research Laboratory (CGR) at
                                        DCEG/NCI (Stephen Chanock), and Strangways Laboratory at Cambridge University (UCAM, Doug
                                        Easton).
                                        Contribution of existing genotype data from studies that have been genotyped as part of an
                                        existing
                                        consortia (e.g. BCAC, CIMBA, AABCGS) can be done through the consortia after approval from
                                        individual
                                        studies. For studies that require new genotyping, the Confluence Project will cover the costs of
                                        sample
                                        shipment and materials (plates/tubes), DNA extractions (if needed), DNA quantitation/QC, return
                                        of
                                        left-over DNA (if requested), and genotyping and return of genotype files to contributing
                                        studies.
                                        However, Confluence will not be able to cover the costs from sample retrieval, preparation and
                                        aliquoting by individual studies.</p>
                
                                    <h4>Existing genotyping data from scanned samples</h4>
                
                                    <p>We will accept existing genotype data generated from eligible study samples using Illumina or
                                        Affymetrix
                                        chips; however, other methodologies may be considered. The following files/information will be
                                        requested:</p>
                
                                    <ul>
                                        <li>Genotyping chip and manifest files</li>
                                        <li>Genotype files: We can accept a range of data formats, including called genotype files with
                                            documentation of clustering/QC process, or pre-QC raw genotyping files.</li>
                                        <li>Sample sheet (ID mapping)</li>
                                    </ul>
                                    <p>For studies contributing existing genotyping data through a consortium (e.g. BCAC, CIMBA), we
                                        anticipate
                                        requesting post-QC data along with the clustering/QC steps and metrics used. For studies willing
                                        to
                                        participate in genetic mosaicism studies, analysis will necessitate access to the B-allele
                                        frequency
                                        and
                                        Log R data from the scanned chips.</p>
                
                                    <h4>Genotyping chips for new genotyping</h4>
                
                                    <p>We will be using the Illumina Infinium Global Screening Array (GSA) with &gt;665,000 variants in
                                        populations of non-African ancestry, and the Multi-Ethnic Genotyping Array (MEGA) with &gt;1.3
                                        million
                                        variants in populations of African ancestry because of its improved coverage and imputation
                                        accuracy
                                        in
                                        this population. A custom content of ~100,000 variants will be added to the arrays, and will
                                        include
                                        known pathogenic variants in breast cancer genes such as <em>BRCA1</em>, <em>BRCA2</em>,
                                        <em>ATM</em>,
                                        <em>PALB2</em> and <em>CHEK2</em>, as well as novel variants identified in ongoing efforts to
                                        identify
                                        and characterize rare variants and highly penetrant mutations through targeted, exome and whole
                                        genome
                                        sequencing (including CARRIERS, BRIDGES, PERSPECTIVE I&amp;I, BRA-STRAP, AABCGS and ENIGMA). In
                                        addition, we will add content to facilitate fine mapping studies, copy number variation calling,
                                        and
                                        other questions of interest.</p>
                
                                    <h4>Biological sample requirements</h4>
                
                                    <p>For germline isolation we anticipate requesting the following specimen types as a source of
                                        germline
                                        DNA:
                                    </p>
                
                                    <ul>
                                        <li>300-400uL (150uL minimum) of whole blood or buffy coat</li>
                                        <li>1mL of saliva, Oragene™ or mouthwash/oral rinses</li>
                                    </ul>
                                    <p>Tumor or serum samples will not be accepted as a source of germline DNA.</p>
                
                                    <p>The anticipated DNA requirements for isolated germline DNA from blood or buccal sources are:</p>
                
                                    <ul>
                                        <li>500-1000ng if dsDNA quantitation, e.g. PicoGreen</li>
                                        <li>1.0-1.5ug if spectrophotometric quantitation, e.g. NanoDrop</li>
                                    </ul>
                                    <p>The requested amounts are larger than the minimum input material for genotyping to ensure
                                        receiving
                                        adequate DNA for array work, anticipating large variation in quantification across different
                                        laboratories, and allowing for residual raw material to use in case of a failure. Reduction in
                                        total
                                        mass/volume can be requested by studies, with the understanding that the likelihood of sample
                                        failure
                                        will be higher and the ability for recovery efforts will be limited. Existing library preps from
                                        exome
                                        or whole genome sequencing might be accepted if native DNA is not available. Upon request,
                                        residual
                                        material will be returned to study sites at the completion of the work.</p>
                
                                    <h4>Quality Control, genotyping calling and imputation</h4>
                
                                    <p>Standard QC procedures will involve the following steps:&nbsp;</p>
                
                                    <ol>
                                        <li>Sample and SNP level completion rate check;</li>
                                        <li>Sample heterozygosity assessment;</li>
                                        <li>Sample duplication/assay concordance check;</li>
                                        <li>Sex verification;</li>
                                        <li>Relatedness check (with allowances for study designs that include relatives by default, e.g.
                                            CIMBA);
                                        </li>
                                        <li>Ancestry and population structure assessment;&nbsp;</li>
                                        <li>Assessment on deviation from Hardy-Weinberg Proportions.</li>
                                    </ol>
                                    <p>Both existing and newly generated genotyping data will be imputed by chip and ancestry group
                                        using
                                        the
                                        most appropriate reference panels available at the time of analyses.</p>
                
                                    <h4>Return of genotyping data</h4>
                
                                    <p>For studies contributing samples for genotyping, the genotyping files/information detailed above
                                        will
                                        be
                                        returned to each participating study after QC procedures (we will consider requests for specific
                                        file
                                        formats from studies).</p>
                
                                    <h3>Phenotype Data</h3>
                
                                    <p>The following <em>core phenotype data</em> will be required from all participating studies:
                                        subject
                                        and
                                        sample IDs, age, sex, race/ancestry, family history, and ER status (index tumor). Complete core
                                        data
                                        is
                                        not required, if it has not been collected by the study.</p>
                
                                    <p>In addition, we will request the following data from studies that have it available (<em>not
                                            mandatory</em>).</p>
                
                                    <h4>Risk factors</h4>
                
                                    <ul>
                                        <li>Menstrual cycle: age menarche, menopausal status, age menopause</li>
                                        <li>Pregnancy: number of full-term births, age at first and last full-term birth, breastfeeding
                                        </li>
                                        <li>Height, weight, body mass index</li>
                                        <li>Oral contraceptives and menopausal therapy</li>
                                        <li>Alcohol consumption and cigarette smoking</li>
                                        <li>Benign breast disease and mammographic breast density</li>
                                    </ul>
                                    <h4>Pathology (first and second breast tumors)</h4>
                
                                    <ul>
                                        <li>Behavior, morphology</li>
                                        <li>Grade, nodes, size</li>
                                        <li>ER (core variable), PR, HER2, KI67 status</li>
                                    </ul>
                                    <h4>Treatment/clinical follow up</h4>
                
                                    <ul>
                                        <li>Treatment and toxicity information (to the extent available)</li>
                                        <li>Locoregional relapse, years to relapse, distant metastases</li>
                                        <li>Diagnosis of second breast cancer/s.</li>
                                        <li>Age at diagnosis, follow-up time, vital status, cause of death for survival analyses</li>
                                    </ul>
                                    <h3>Data Management</h3>
                
                                    <p>For studies contributing to the Confluence project through a consortia of studies, questionnaire,
                                        pathology and survival/treatment data, the consortia data coordinating center will be the
                                        custodians
                                        of
                                        data, providing data management and harmonization: female breast cancer studies of European or
                                        East
                                        Asian ancestry will be managed by BCAC (Cambridge University, Netherlands Cancer Institute and
                                        German
                                        Cancer Research Center); female and male studies of <em>BRCA1/2</em> mutation carriers will be
                                        managed
                                        by CIMBA (Cambridge University); female studies of Hispanic/Latina ancestry will be managed by
                                        LAGENO-BC
                                        (UCSF); female studies of African ancestry (DCEG/NCI) and unselected male breast cancer studies
                                        will
                                        be
                                        managed by <em>Nick Orr</em> (Queens University). Data management and harmonization for studies
                                        contributing directly through NCI will be carried out by DCEG/NCI. The genotyping laboratories
                                        at
                                        DCEG/NCI and Cambridge University will be responsible for the management, QC and imputation of
                                        existing
                                        and new genome-wide genotyping data.</p>
                
                                    <p>The aggregation of individual participant data on patient characteristics, treatment and follow
                                        up
                                        data
                                        on clinical outcomes and events (including toxicities) from clinical trials is a critical
                                        component
                                        for
                                        combined analyses to identify novel genetic determinants of clinical outcomes. We plan to
                                        accomplish
                                        this by establishing collaborations with existing clinical trial collaborative groups.</p>
                
                                    <p>The Confluence project will cover the costs of study and data management by consortium data
                                        coordinating
                                        centers through contracts. Although the project will not cover costs from data preparation by
                                        individual
                                        studies according to the data dictionary, it will be able to assist studies and accept raw data
                                        for
                                        centralized data coding, if this work cannot be carried out by individual studies. Data
                                        management
                                        and
                                        stewardship will follow FAIR (Findability, Accessibility, Interoperability, and Reusability)
                                        principles
                                        [48].</p>
                
                                </div>
                                <div class="tab-pane fade" id="analytic" role="tabpanel" aria-labelledby="analyticTab">
                                    <p>Below is a description of the analytical plan to address the main aims of the Confluence project.
                                        However, it is anticipated that methodologies and functional annotations will continue to
                                        evolve,
                                        thus
                                        we will use the most appropriate methods available at the time of analyses.</p>
                
                                    <h3><strong>Aim 1.</strong> To discover susceptibility loci and advance knowledge of etiology of
                                        breast
                                        cancer overall and by subtypes</h3>
                
                                    <p>The primary discovery analysis will involve standard single-SNP association testing across
                                        genome-wide
                                        panel of SNPs. As we would expect heterogeneity in associations across ancestry groups and
                                        subtypes,
                                        we
                                        plan to run additional association tests to maximize power in the presence of heterogeneous
                                        association,
                                        while borrowing strength across groups when associations are homogeneous (e.g. [49-51]). The
                                        primary
                                        goal would be to identify novel loci through association analysis combining all the data and
                                        then
                                        characterizing subtype and ancestry-specific associations. Association analyses for
                                        <em>BRCA1/2</em>
                                        mutation carriers will be based on modeling the retrospective likelihood of the observed
                                        genotypes
                                        conditional on breast cancer phenotypes [52], using adjusted test statistic to allow for
                                        non-independence among related individuals and account for correlation in genotypes [53].
                                        Analyses
                                        will
                                        be done by genotyping chip and combined using fixed-effects meta-analysis [54].</p>
                
                                    <p><em>Transcriptome-wide Association Study (TWAS)</em>: In addition to single-SNP association test,
                                        we
                                        plan
                                        to carry out TWAS [55] by exploiting information on quantitative trait loci associated with
                                        gene-expression and other genomic characteristics, such as methylation. TWAS can improve power
                                        of
                                        discovery of genetic loci where multiple underlying variants affect disease mediated through an
                                        underlying common mechanism such as regulation of gene-expression. Recent studies have suggested
                                        that
                                        combining information from multiple tissues can improve the power for discovery of association
                                        analysis
                                        even for diseases that are very tissue specific [56-58]. Thus, we will consider cross-tissue
                                        TWAS
                                        analysis using the latest version of the Genotype-Tissue Expression (GTEx) and other genomic
                                        datasets.
                                    </p>
                
                                    <p><em>Enrichment analyses</em>: Based on the association statistics generated from GWAS, we plan to
                                        conduct
                                        enrichment analysis of association signals in relationship to functional genomic and population
                                        genetic
                                        characteristics (e.g. LD) of the genome characterized by ENCODE and other databases that may be
                                        available in the future. We anticipate to use stratified LD-score regressions [59] and related
                                        extensions for characterizing enrichment of association in multivariate models that can adjust
                                        for
                                        correlated annotations for each other. We will carry out the analyses with respect to both broad
                                        and
                                        cell-type specific annotations.</p>
                
                                    <p><em>Fine mapping and functional analyses of identified signals using functional annotation
                                            data</em>:
                                        We
                                        will conduct fine mapping analysis, informed with external functional data, around each locus
                                        identified
                                        through discovery stage of the analysis. We anticipate using Bayesian methods[60] that can
                                        integrate
                                        information on associations, local linkage disequilibrium pattern, and external functional
                                        information,
                                        such as eQTL characteristics, to compute posterior probabilities for each SNP within a
                                        fine-mapping
                                        region to be a causal variant.</p>
                
                                    <p><em>Heritability analyses for breast cancer overall and by subtype across ancestry groups</em>:
                                        Availability of large GWAS across subtypes and multiple ancestry groups will provide us the
                                        opportunity
                                        to explore the variation in genetic architecture of breast cancer in a more powerful way than it
                                        has
                                        been possible before. We will use state-of-the-art methods [61] for estimation of GWAS
                                        heritability
                                        to
                                        characterize how much of breast cancer risk variation can be explained by common variants across
                                        the
                                        different subtypes/ancestry groups. We will estimate degree of polygenicity and underlying
                                        effect-size
                                        distribution across different groups using methods we have recently developed [62]. We also plan
                                        to
                                        conduct GWAS co-heritability analysis to explore the overlap in genetic architecture across the
                                        different subtypes/mutation carriers/ancestry groups. Characterization of global genetic
                                        architecture of
                                        breast cancer using heritability, effect-size distribution, and genetic correlations will
                                        provide
                                        insight into similarity and differences in the genetic basis of breast cancer by different
                                        subtypes/ancestry groups and will allow us to explore the potential for genetic risk prediction
                                        at
                                        our
                                        current and future studies.</p>
                
                                    <h3><strong>Aim 2</strong>: To develop polygenic risk scores and integrate them with known risk
                                        factors
                                        for
                                        personalized risk assessment for breast cancer overall and by subtypes</h3>
                
                                    <p>We plan to develop optimal PRS for predicting breast cancer across different ancestry groups and
                                        subtypes. Similar to association testing, our general strategy would be to utilize state of the
                                        art
                                        methods that can borrow strength across the different groups while allowing for potential
                                        heterogeneity
                                        in associations. Based on the experience of developing subtype-specific PRS for European
                                        ancestry
                                        GWAS
                                        data, we have found that a strategy of selecting SNPs based on global association analysis
                                        across
                                        groups
                                        and then estimating association coefficients of selected SNPs in group-specific manner leads to
                                        a
                                        robust
                                        strategy for building PRS. We will also explore alternative, more advanced, methods, such as
                                        Bayes/Empirical-Bayes techniques, that allows estimation of association coefficient for SNPs
                                        across
                                        different groups under a “prior” model that will account for suitable degree of heterogeneity.
                                        We
                                        will
                                        develop PRS for the general population and also assess whether PRS specific to mutation carriers
                                        (e.g.
                                        <em>BRCA1</em>, <em>BRCA2</em>, <em>ATM</em>, <em>CHEK2</em> or <em>PALB2</em>) are required for
                                        optimal
                                        risk prediction in these high-risk populations.</p>
                
                                    <p>Genotypes will be aggregated with data on risk factors (reproductive and hormonal factors,
                                        anthropometry,
                                        alcohol consumption and other lifestyle factors, family history and breast features including
                                        benign
                                        breast disease and mammographic density). This will enable evaluations of gene-environment
                                        interactions,
                                        and development of population-specific risk models for overall and subtype risk predictions. We
                                        will
                                        use
                                        the iCARE and BOADICEA risk models [43, 63] to combine information on PRS, classical risk
                                        factors/family
                                        history and population incidence rates to develop integrated models for predicting absolute risk
                                        of
                                        breast cancer by subtypes and ancestry groups. Data from a parallel collaboration with the NCI
                                        Cohort
                                        Consortium to build risk prediction models will be used to obtain precise risk estimates of
                                        associations
                                        for classical risk factors by breast cancer subtypes and ancestry groups.</p>
                
                                    <h3><strong>Aim 3</strong>: To discover loci for breast cancer prognosis, long-term survival,
                                        response
                                        to
                                        treatment, and second breast cancer</h3>
                
                                    <p>Analyses for aim 3 will be limited to cases with information on clinical prognosis, treatment,
                                        toxicities
                                        and second breast cancers. We plan to conduct standard genome-wide survival analysis using a Cox
                                        proportional hazard model framework for breast cancer outcomes (e.g. breast cancer specific
                                        mortality,
                                        total mortality, and diagnosis of a second breast cancer following the index breast cancer).
                                        Time-to-event will be calculated from the date of diagnosis with left truncation to account for
                                        cases
                                        enrolled into studies after diagnosis (prevalent cases). Analyses will be stratified by tumor
                                        characteristics and treatment to evaluate treatment response. We will also evaluate
                                        heterogeneity in
                                        associations by factors such as tumor characteristics, ancestry group and treatment using
                                        standard
                                        interaction analyses, as well as newer methods for combined association analysis (see Aim 1).
                                        For
                                        studies with information on treatment-related toxicities (primarily clinical trials), we will
                                        conduct
                                        candidate and genome-wide survival analyses to identify genetic determinants of toxicities that
                                        could
                                        range from radiation exposure (e.g. fibrosis), aromatase inhibitors (e.g. musculoskeletal
                                        adverse
                                        events) and chemotherapy (e.g. anemia, febrile neutropenia, peripheral neuropathy).</p>
                
                                    <p>The lead statisticians for the Confluence SSC are <em>Nilanjan Chatterjee</em>, <em>Doug
                                            Easton</em>,
                                        <em>Antonis Antoniou</em> and <em>Pete Kraft</em>. They will provide oversight and expertise for
                                        the
                                        statistical analyses plans to address the main aims of the project as outlined above. However,
                                        they
                                        will
                                        not bear sole reasonability for data analyses. It is anticipated that primary statistical
                                        analyses
                                        will
                                        be performed in collaboration across analytical teams led by different members of the SSC. Other
                                        investigators will be able to propose and lead additional analyses through the submission of
                                        study
                                        concepts via the Confluence Data Platform (see below).</p>
                                </div>
                
                                <div class="tab-pane fade" id="projectedDiscoveries" role="tabpanel" aria-labeledby="projectedTab">
                                    <p>Using GENESIS, a novel method to characterize the effect size distribution of common variants
                                        based
                                        on
                                        existing summary-level GWAS data [62], we estimated that there are over 5,000 common
                                        susceptibility
                                        variants for breast cancer (MAF&gt;5%), most of them with very small (OR&lt;1.01) effect sizes
                                        [50].
                                        The
                                        proposed sample size of at least 300,000 cases and 300,000 controls was chosen to increase the
                                        percentage polygenic variance for overall breast cancer explained by genome-wide significant
                                        variants
                                        from about 40% to nearly 60% [1], (Zhang et al. In preparation). This effort should identify
                                        virtually
                                        all variants with OR&gt;=1.02, and about half of variants with OR ~1.01. Identification of
                                        additional
                                        variants will require much large sample sizes due to their very small effect sizes. Substantial
                                        improvements in risk stratification are also expected by the addition of improved polygenic risk
                                        scores
                                        to breast cancer risk models [64].</p>
                
                                </div>
                                <div class="tab-pane fade" id="governance" role="tabpanel" aria-labelledby="governanceTab">
                                    <h3>Governance</h3>
                
                                    <p>The organizational structure has been designed to ensure close involvement of participating
                                        studies
                                        and
                                        consortia in the governance, oversight and operations of the Confluence Project:</p>
                
                                    <ul>
                                        <li><em>Scientific Steering Committee (SSC)</em> co-chaired by the DCEG Deputy Director (Montse
                                            Garcia-Closas) and the BCAC lead (Doug Easton) includes representatives from all
                                            participating
                                            consortia (see full membership on cover page), and other large contributing studies or
                                            groups of
                                            studies. The mission of this committee is to bring together representatives of different
                                            collaborative groups, provide scientific expertise, contribute to the development of the
                                            research
                                            plan and provide oversight of the research resource for use by the wider scientific
                                            community.
                                            The
                                            SSC reports to the director of DCEG (Stephen Chanock), source of funding for Confluence.
                                        </li>
                                        <li><em>External Advisory Group</em> will be formed by international experts in GWAS and
                                            advocates
                                            to
                                            provide logistical and scientific advice to the Confluence Project.</li>
                                    </ul>
                                    <p>DCEG will be responsible for the overall coordination of the Confluence project, including
                                        management,
                                        integration and analyses by participating groups and consortia. However, each consortium will be
                                        responsible of the management and governance of data from their member studies, according to
                                        their
                                        rules
                                        and regulations.</p>
                
                                    <h3>Scientific Review of the Confluence Project</h3>
                
                                    <p>The Confluence Project has been reviewed by the NCI intramural review process used by all
                                        projects
                                        funded
                                        by the NCI Intramural Research Program. This involves an initial internal review by the DCEG
                                        Senior
                                        Advisory Group (SAG) that includes DCEG senior leadership and two or more ad hoc expert
                                        reviewers.
                                        DCEG
                                        SAG is advisory to the DCEG Director. The <a
                                            href="https://deainfo.nci.nih.gov/advisory/bsc/cse/cse.htm">NCI Board of Scientific
                                            Counselors
                                            for
                                            Clinical Sciences and Epidemiology</a> will provide external review of the progress and
                                        scientific
                                        output of the Confluence Project.</p>
                
                                    <h3>Data Sharing Plan</h3>
                
                                    <p>Summary-level data from analyses performed under the Confluence project will be broadly available
                                        to
                                        the
                                        scientific community at the time of manuscript publication reporting the main findings from the
                                        project.
                                        In addition, individual-level data will be accessible through two mechanisms:</p>
                
                                    <h4>A. Controlled data access through the Confluence Data Platform by eligible researchers:</h4>
                
                                    <p>Eligible researchers will be able to request access to individual-level data for specific
                                        analyses
                                        through the <em>Confluence Data Platform</em> that will be securely hosted in a Cloud
                                        environment
                                        (Figure 2). This platform will be designed to manage and facilitate data intake, access,
                                        governance,
                                        visualization and analyses of data following FAIR principles [48], compatible with individual
                                        study
                                        IRB’s and consortia policies. This approach will greatly facilitate collaborative analyses
                                        across
                                        multiple groups in a shared analytical space. Data will only be shared for academic research,
                                        not
                                        for
                                        commercial use.</p>
                
                                    <div data-embed-button="cgov_image_button"
                                        data-entity-embed-display="view_mode:media.image_display_article_full" data-entity-type="media"
                                        data-entity-uuid="e45fb462-e981-4812-a940-ba098d4e1415" data-langcode="en"
                                        class="embedded-entity">
                
                
                
                
                
                                        <figure class="image-full centered-set">
                                            <div class="centered-element">
                                                <img src="../../static/images/Confluence-Project-Figure2.png" width="782" height="317"
                                                    alt="&quot;&quot;" loading="lazy"></div>
                                            <figcaption>
                                                <div class="caption-container no-resize">
                                                    <p>Figure 2: Anticipated steps to gain access to Confluence Data</p>
                                                </div>
                                            </figcaption>
                                        </figure>
                                    </div>
                                    <p>The ownership of the data will stay with the individual studies (i.e. the data/sample provider).
                                        For
                                        studies contributing data to the Confluence project through consortia, the custodian of the data
                                        will be
                                        the consortium data coordinating center (DCC; e.g. Cambridge University for BCAC or CIMBA), and
                                        data
                                        access will be governed by the consortium Data Access Coordinating Committee (DACC). A Letter of
                                        Understanding (LoU) and Material/Data Transfer Agreement (M/DTA) between the Data/Sample
                                        Provider
                                        and
                                        the Consortia DCC establish the terms and conditions under which data/samples will be
                                        transferred
                                        from
                                        individual studies to the Consortia DCC and describes the Confluence DTA. The Confluence DTA
                                        establishes
                                        the terms and conditions by which access to Confluence data will be provided to a researcher
                                        whose
                                        Study
                                        Concept has been approved by the Consortia DACCs. Researchers will then be able to visualize and
                                        analyze
                                        the data in the Cloud without data downloads (i.e. <em>code travels to the data</em>).
                                        Exceptions
                                        might
                                        be possible depending on analytical requirements.</p>
                
                                    <p>The anticipated process to get access to Confluence Data by eligible researchers is:</p>
                
                                    <ul>
                                        <li>
                                            <p>Researcher submits a study concept describing the project, including variables of
                                                interest,
                                                via
                                                the Confluence Data Platform to the consortia DACCs that govern the requested data.</p>
                                        </li>
                                        <li>
                                            <p>After approval by the relevant consortia DACCs, individual studies contributing data are
                                                notified
                                                and given a time period to opt-out their study from the approved project.</p>
                                        </li>
                                        <li>
                                            <p>After the opt-out period has elapsed, the researcher’s institution signs a DTA for the
                                                study
                                                concept with the consortium data coordinating center(s) governing the data.</p>
                                        </li>
                                        <li>
                                            <p>Upon DTA signature, the data coordinating center(s) will be able to provide access of the
                                                approved data to researchers through the Confluence Data Platform. Requests will be
                                                digitally
                                                linked to specific variables so that following all required approvals access to the
                                                requested
                                                data from studies that do not opt-out will be “automatically” provided.</p>
                                        </li>
                                    </ul>
                                    <p>DCEG will work with the consortia DACCs to develop procedures/policies that facilitate data
                                        access/sharing across multiple consortia that are consistent with individual consortium data
                                        sharing
                                        policies and the <a href="https://osp.od.nih.gov/scientific-sharing/genomic-data-sharing/">NIH
                                            Genomic
                                            Data Sharing policy</a> (see below), and to develop authorship guidelines for Confluence
                                        publications. To improve data traceability and reproducibility of analyses/results, the data
                                        access
                                        policy for the Confluence project will be to provide data access for analyses through the
                                        Confluence
                                        Data Platform without downloading the data. Special requests for downloading the data will be
                                        considered
                                        if required analysis tools are not available on the data platform, and if data cannot be read
                                        remotely
                                        by the analysis tools.</p>
                
                                    <h4>B. Public data access through an NCI-approved data archive (e.g. dbGAP, EGA):</h4>
                
                                    <p>In accordance to the <a
                                            href="https://osp.od.nih.gov/scientific-sharing/genomic-data-sharing/">NIH
                                            Genomic Data Sharing policy</a>, individual–level genotyping data generated using funds from
                                        the
                                        Confluence Project must be submitted for public access to an NCI-approved data archive such as
                                        the
                                        <a href="https://www.ncbi.nlm.nih.gov/sra/docs/submitdbgap/">NIH database of Genotypes and
                                            Phenotypes
                                            (dbGaP)</a>, or the <a href="https://www.ebi.ac.uk/ega/home">European Genome-phenome Archive
                                            (EGA)</a><a class="icon-exit-notification" title="Exit Disclaimer"
                                            href="https://www.cancer.gov/policies/linking"><span class="show-for-sr">Exit
                                                Disclaimer</span></a>,
                                        along with associated core phenotype data. To ensure institutional commitment to this policy, an
                                        NCI/NIH
                                        Genomics Data Sharing Plan Form detailing the required level of commitment on data sharing will
                                        need
                                        to
                                        be signed by studies prior to genotyping of samples.</p>
                
                                    <p>This requirement <strong><em>does not apply</em></strong> to genotyping data generated using
                                        non-NIH
                                        funding.</p>
                
                                    <h3>Approximate Timeline</h3>
                
                                    <div data-embed-button="cgov_image_button"
                                        data-entity-embed-display="view_mode:media.image_display_article_full" data-entity-type="media"
                                        data-entity-uuid="b24a0d92-5c73-445f-8cd2-52b7360b92de" data-langcode="en"
                                        class="embedded-entity">
                
                
                
                
                                        <figure class="image-full centered-set">
                                            <div class="centered-element">
                                                <img src="../../static/images/timeline.png" height="200"
                                                    alt="Approximate Timeline: Study Recruitment: 2018 to 2021 Sample Collection: mid 2019 – 2022 Genotyping: 2021 – 2023 Statistical Analysis &amp; Data Sharing: mid 2022 and beyond Publications: mid 2023 and beyond."
                                                    loading="lazy"></div>
                                            <div class="callout-box">
                                                <h3>Interested in participating or have questions?</h3>
                
                                                <p>Contact <a
                                                        href="mailto:ConfluenceProject@mail.nih.gov">ConfluenceProject@mail.nih.gov</a>.
                                                </p>
                                            </div>
                
                                    </div>
                                </div>
                                <div class="tab-pane fade" id="appendix" role="tabpanel" aria-labelledby="appendixTab">
                                    <p><a data-entity-substitution="canonical" data-entity-type="node"
                                            data-entity-uuid="e98708d1-59c4-4295-979f-fdfd5fa3fee6"
                                            href="/research/cancer-types/breast-cancer/confluence-steering-committee">Confluence
                                            Scientific
                                            Steering Committee</a></p>
                
                                    <p><a data-entity-substitution="canonical" data-entity-type="node"
                                            data-entity-uuid="b8c0731b-8aad-4d1e-8177-f392b133852a"
                                            href="/research/cancer-types/breast-cancer/confluence-abbreviations">Abbreviations</a></p>
                
                                    <p><a data-entity-substitution="canonical" data-entity-type="node"
                                            data-entity-uuid="a5e059e6-03bc-4774-b34a-f61d41b6f182"
                                            href="/research/cancer-types/breast-cancer/references-confluence">References</a></p>
                
                                    <p>&nbsp;</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
  
  `

    document.getElementById('overview').innerHTML = template;

    var coll = document.getElementsByClassName("collapsible");
    var i;

    for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function () {
            this.classList.toggle("activeCollapse");
            var content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }
};