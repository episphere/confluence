export const getNavBarTemplate = async () => {
    return await import('./components/navBarMenuItems.js')
}

export const getHomePageFunctions = async () => {
    return await import('./pages/homePage.js')
}

export const dataSubmissionFunctions = async () => {
    return await import('./pages/dataSubmission.js')
}

export const dataExplorationFunctions = async () => {
    return await import('./pages/dataExploration.js')
}

export const dataRequestFunctions = async () => {
    return await import('./pages/dataRequest.js')
}

export const getFooterTemplate = async () => {
    return await import('./components/footer.js')
}

export const manageAuthenticationFunctions = async () => {
    return await import('./manageAuthentication/index.js')
}

export const shardFunctions = async () => {
    return await import('./shared.js')
}

export const attachEvents = async () => {
    return await import('./event.js')
}

export const dataAnalysisFunctions = async () => {
    return await import('./pages/dataAnalysis.js')
}
