const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync('src/pages/studyopt.js', 'utf8');
const catalog = JSON.parse(fs.readFileSync('src/data/studyDescriptions (2).json', 'utf8'));
const groups = ['AABCG', 'BCAC', 'C-NCI', 'CIMBA', 'LAGENO', 'MERGE'];
const slice = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));
function setup(overrides = {}) {
    const context = {
        console, dataManagersInfo: [{email: 'manager@example.org', consortium: 'BCAC'}],
        emailsAllowedToUpdateData: ['admin@example.org'],
        localStorage: {parms: JSON.stringify({login: 'manager@example.org'})},
        loadOptInOutWorkbookRows: async () => [{Name: 'Existing user', Study_1: 'Existing study', 'Study_1 Acronym': 'EXISTING'}],
        getFile: async () => JSON.stringify(catalog), studyDescriptions: 1,
        fetch: async () => ({ok: true, text: async () => ''}),
        csv2Json: () => ({data: groups.map((group, i) => ({Concept: 'Example', 'Concept Box ID': String(i + 1), 'Requested Consortia/Study': group}))}),
        getRoundNumberFromFileName: () => null,
        extractContactInvestigators: value => value,
        readDocFile: async () => '',
        ...overrides
    };
    vm.createContext(context);
    vm.runInContext('const OPT_IN_OUT_CONCEPTS_CSV_PATH = "unused";\n'
        + slice('const escapeHtml', 'const getConceptDisplayName')
        + slice('const normalizeHeaderValue', 'const isTruthyCellValue')
        + slice('const normalizeStudyFilterValue', 'const loadOptInOutWorkbookRows')
        + slice('const getWorkbookStudyEntries', 'const loadLegacyOptInOutTable')
        + slice('export const studyAccessAdminTemplate', 'const getCnciWorkbookStudies').replace('export ', '')
        + '\nthis.api = {loadStudyAccessAdminRows, loadStudyAccessDecisions, confirmStudyAccessChange, studyAccessAdminTemplate};', context);
    return context;
}

test('manager data is limited to their consortium before concept documents are read', async () => {
    const reads = [];
    const context = setup({readDocFile: async id => { reads.push(id); return ''; }});
    const rows = await context.api.loadStudyAccessAdminRows(['BCAC']);
    assert.deepEqual(Array.from(rows, row => row.label), ['BCAC']);
    assert.deepEqual(reads, ['2']);
    assert.equal(rows[0].studies.length, 124);
    assert(rows[0].studies.every(study => study.consortium === 'BCAC'));
    assert.equal((await context.api.loadStudyAccessAdminRows([])).length, 0);
});

test('admin retains all consortia and existing C-NCI workbook studies', async () => {
    const rows = await setup().api.loadStudyAccessAdminRows();
    assert.equal(rows.length, 6);
    assert(rows.find(row => row.label === 'C-NCI').studies.some(study => study.acronym === 'EXISTING'));
    const markup = setup().api.studyAccessAdminTemplate(true);
    assert(markup.includes('Consortium Study Access'));
    assert(!markup.includes('initiateOptInOutRoundBtn'));
    assert(!markup.includes('syncDataManagerStatusBtn'));
});

test('saved decisions paginate, ignore unrelated comments, and use the latest change', async () => {
    const offsets = [];
    const comment = (decision, time) => ({created_at: time, message: 'Study Opt-In/Out change: ' + JSON.stringify({consortium: 'BCAC', study: 'ABC', decision})});
    const context = setup({listComments: async (id, offset) => {
        offsets.push(offset);
        return JSON.stringify({total_count: 3, entries: offset === 0
            ? [comment('out', '2026-01-01'), {message: 'DACC comment'}]
            : [comment('in', '2026-01-02')]});
    }});
    assert.equal((await context.api.loadStudyAccessDecisions('2')).get('bcac|abc'), 'in');
    assert.deepEqual(offsets, [0, 2]);
    await assert.rejects(setup({listComments: async () => '{}'}).api.loadStudyAccessDecisions('2'));
});

test('reason is required, cancellation preserves value, and Box success commits the change', async () => {
    let submit;
    let posts = 0;
    let hidden = false;
    const reason = {value: '', reportValidity() {}};
    const status = {};
    const modal = {querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}};
    const body = {querySelector: selector => selector === 'form' ? {addEventListener: (_, handler) => { submit = handler; }} : selector === 'textarea' ? reason : status};
    const select = {value: 'out', dataset: {previousValue: 'in'}, closest: selector => selector === 'tr' ? null : ({dataset: {consortium: 'BCAC', study: 'ABC', conceptBoxId: '2'}}), classList: {toggle() {}}, style: {}};
    const context = setup({
        document: {getElementById: id => id === 'confluenceMainModal' ? modal : id === 'confluenceModalBody' ? body : {}},
        bootstrap: {Modal: {getOrCreateInstance: () => ({show() {}, hide() { hidden = true; }})}},
        listComments: async () => ({entries: [], total_count: 0}),
        createComment: async (id, message) => { posts++; assert(message.includes('Required reason')); return {status: posts === 1 ? 403 : 201}; }
    });
    context.api.confirmStudyAccessChange(select, {querySelectorAll: () => [select]}, true);
    assert.equal(select.value, 'in');
    await submit({preventDefault() {}});
    assert.equal(posts, 0);
    reason.value = 'Required reason';
    await submit({preventDefault() {}});
    assert.equal(posts, 1);
    assert.equal(select.value, 'in');
    assert.equal(select.dataset.previousValue, 'in');
    assert(!hidden);
    assert(status.textContent.includes('Box did not confirm'));
    await submit({preventDefault() {}});
    assert.equal(posts, 2);
    assert.equal(select.value, 'out');
    assert.equal(select.dataset.previousValue, 'out');
    assert(hidden);
});

test('manager cannot open a change dialog for another consortium', () => {
    const context = setup({document: {getElementById() { throw new Error('Unauthorized dialog opened'); }}});
    const select = {value: 'out', dataset: {previousValue: 'in'}, closest: () => ({dataset: {consortium: 'MERGE'}})};
    context.api.confirmStudyAccessChange(select, {}, true);
    assert.equal(select.value, 'in');
});
