export const dataAnalysisTemplate = () => {
    return `
        <div class="data-submission sub-div-shadow">
            <div class="row data-analysis">
                <div class="col-lg-6 allow-overflow">
                    <h4>Video explaining how to connect Box backend for Confluence researchers</h4>
                    <iframe class="sub-div-shadow" width="100%" height="400px" src="https://www.youtube.com/embed/YtmpNfkvjdI" frameborder="0" 
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
                <div class="col-lg-6 allow-overflow">
                    <h4>Steps to connect Box backend for Confluence researchers</h4>
                    <ol>
                        <li>Copy the File ID. This will be used in the R boxr package</li>
                        <li>In Rstudio, run the following commands:</li>
                        <li>install.packages(c("boxr", "base", "usethis"))</li>
                        <li>library(boxr)</li>
                        <li>box_auth()</li>
                        <li>The console will then ask for credentials as shown below</li>
                        <li>enter the following information:<ul>
                            <li>Client ID: <strong>627lww8un9twnoa8f9rjvldf7kb56q1m</strong></li>
                            <li>Client Secret: <strong>gSKdYKLd65aQpZGrq9x4QVUNnn5C8qqm</strong></li>
                        </ul></li>
                        <li>Copy the file ID from <strong>My Projects</strong> tab</li>
                        <li>x = box_read(<strong>"file ID from previous step"</strong>)</li>
                        <li>Run analysis on the file</li>
                        <li>hist(x$bYear)</li>
                    </ol>
                </div>
            </div>
        </div>
    `;
}