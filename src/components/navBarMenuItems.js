const template = () => {
    return `
        
        <div class="nav-item  grid-elements">
            <a class="nav-link nav-menu-links" href="#" title="Data Exploration" id="dataSummary"><i class="fas fa-chart-bar"></i> Data Exploration</a>
        </div>
        
        <div class="nav-item  grid-elements">
            <a class="nav-link nav-menu-links" href="#" title="Data Submission" id="dataSubmission"><i class="fas fa-upload"></i> Data Submission</a>
        </div>
        <div id="governanceNav"></div>
        <div id="myProjectsNav"></div>
        
        <div class="nav-item  pages-coming-soon grid-elements">
            <a class="nav-link nav-menu-links" href="#" title="Data Request" id="dataRequest"><i class="fas fa-database"></i> Data Request</a>
        </div>
        
        <div class="nav-item  pages-coming-soon grid-elements">
            <a class="nav-link nav-menu-links" href="#" title="Data Analysis" id="dataAnalysis"><i class="fas fa-database"></i> Data Analysis</a>
        </div>
        
        <div class="navbar-nav ml-auto">
            
            ${localStorage.parms && JSON.parse(localStorage.parms).name ? `
                <div class="nav-item  grid-elements dropdown">
                    <a class="nav-link nav-menu-links dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <i class="fas fa-user"></i> ${JSON.parse(localStorage.parms).name}
                    </a>
                    <div class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                        <a class="dropdown-item nav-link nav-menu-links" href="#" id="logOutBtn"><i class="fas fa-sign-out-alt"></i> Log Out</a>
                    </div>
                </div>
            ` : `
                <div class="nav-item grid-elements">
                    <a class="nav-link nav-menu-links" href="#" id="logOutBtn"><i class="fas fa-sign-out-alt"></i> Log Out</a>
                </div>
            `}
            
        </div>
    `;
}

export default template;