// Replace each null with the numeric Box FILE ID (as a string) for that
// consortium's completed study-manager-roster-template.xlsx workbook.
// Null keeps the current C-NCI roster until migration; other consortia have
// no roster contacts until configured. TEST uses its isolated local roster.
export const studyManagerRosterFiles = {
    'C-NCI': null, // TODO: Box file ID
    'AABCG': null, // TODO: Box file ID
    'BCAC': null, // TODO: Box file ID
    'CIMBA': null, // TODO: Box file ID
    'LAGENO': null, // TODO: Box file ID
    'MERGE': null // TODO: Box file ID
};
