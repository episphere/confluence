const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync('src/pages/chairmenu.js', 'utf8');

function helpers(overrides = {}) {
    const context = vm.createContext({
        Blob, Date, console,
        deniedFolder: 'denied', completedFolder: 'completed',
        escapeHtml: value => String(value),
        getConceptId: file => file.assignedConceptId || '',
        getConceptBoxId: file => file.conceptId || file.fileId,
        getConceptRoundLabel: () => 'R2',
        getConceptTitleFromFileName: name => name.replace(/\.docx$/, ''),
        getChairCommentSourceId: file => file.commentsFileId || file.id,
        getCommentTime: comment => Date.parse(comment.created_at),
        getCommentConsortium: () => 'BCAC',
        extractRequestedConsortia: () => '',
        readDocFile: async () => '', listComments: async () => ({ entries: [] }),
        ...overrides
    });
    vm.runInContext(fs.readFileSync('src/pages/adminRequestedData.js', 'utf8').replace(/export /g, '')
        + source.slice(source.indexOf('const escapeRegExp ='), source.indexOf('const responseMatchesComment ='))
        + source.slice(source.indexOf('const CONSORTIUM_EXPORT_VALUES ='), source.indexOf('const getRecordedAdminReturn ='))
        + '\nthis.api = { getVisibleAdminExportFiles, setupAdminTableDownload, getDaccExportConceptData, getDaccExportValue, exportDaccDecisionTable, showDaccExportFieldSelection, ADMIN_EXPORT_OPTIONS };', context);
    return context.api;
}

test('Admin downloads capture visible rows in table order and current decisions/actions', () => {
    const rows = ['returned', 'accepted'].map(id => ({
        querySelector(selector) {
            if (selector === '.admin-checkbox') return { id };
            if (selector === '.badge') return { textContent: id === 'accepted' ? 'Accepted' : 'Ongoing' };
            if (selector === '.action-required-dropdown') return { value: 'Needs Resending' };
            if (selector.includes('BCAC')) return { value: '3', hasAttribute: () => false };
            return null;
        }
    }));
    const api = helpers({ document: { querySelectorAll(selector) {
        assert.equal(selector, '#adminAccordian > .admin-table-row:not(.d-none)');
        return rows;
    } } });
    const files = ['accepted', 'hidden', 'returned'].map(fileId => ({
        fileId, fileInfo: { id: fileId, name: `${fileId}.docx` },
        assignedConceptId: 'R2_01', conceptId: 'original', titlename: `${fileId} title`,
        submissionDate: '2026-10-01', returnedDate: '2026-10-10',
        commentsFileId: 'original', responseFileId: fileId, documentDataLoaded: true,
        requestedData: { carrier: ['BRCA1'] }, contacts: 'Investigator'
    }));
    const visible = api.getVisibleAdminExportFiles(files);
    assert.deepEqual(Array.from(visible, file => file.id), ['returned', 'accepted']);
    assert.equal(visible[0].commentsFileId, 'original');
    assert.equal(visible[0].responseFileId, 'returned');
    assert.equal(api.getDaccExportValue('score-BCAC', visible[0], {}), '3');
    assert.equal(api.getDaccExportValue('actionRequired', visible[0], {}), 'Needs Resending');
    assert.equal(api.getDaccExportValue('state', visible[1], {}), 'Accepted');
    assert.equal(api.getDaccExportValue('requestedData-carrier', visible[0], {}), 'BRCA1');
    assert.equal(api.getDaccExportValue('investigators', visible[0], {}), 'Investigator');
});

test('requested-data columns read unhydrated forms and report failures explicitly', async () => {
    const api = helpers({ readDocFile: async () => 'Genotyping: Individual-level imputed data Data Requested From: Females, Males Carrier Status requested: BRCA2 Risk Factor Variables: Yes Pathology Variables: No Survival and Treatment Variables: Yes Mammographic Density Variable: No Time Plan: soon' });
    const keys = ['requestedData-genotyping', 'requestedData-sex', 'requestedData-carrier', 'requestedData-phenotype'];
    const detail = await api.getDaccExportConceptData({ id: '1' }, keys);
    assert.deepEqual(keys.map(key => api.getDaccExportValue(key, {}, detail)),
        ['Individual-level imputed data', 'Females, Males', 'BRCA2', 'Risk Factor, Survival and Treatment']);
    const failed = helpers({ readDocFile: async () => { throw Error('unavailable'); }, console: { warn() {} } });
    const failure = await failed.getDaccExportConceptData({ id: '1' }, keys);
    assert.equal(failed.getDaccExportValue(keys[0], {}, failure), 'Unable to load');
    assert.equal(failed.getDaccExportValue(keys[0], { documentDataLoaded: true, requestedData: {} }, failure), 'Not selected / not provided');
});

test('cached Admin selections and scores do not require more Box requests', async () => {
    const api = helpers({
        readDocFile: async () => assert.fail('unexpected document request'),
        listComments: async () => assert.fail('unexpected comments request')
    });
    const file = { id: '1', documentDataLoaded: true, requestedData: { sex: ['Females'] },
        exportValues: { investigators: 'Investigator', 'score-BCAC': '2' } };
    const detail = await api.getDaccExportConceptData(file, ['requestedData-sex', 'investigators', 'score-BCAC']);
    assert.equal(api.getDaccExportValue('requestedData-sex', file, detail), 'Females');
});

test('Admin uses the Chair field dialog with selectable requested-data columns', () => {
    let submit, hidden = false;
    const body = { innerHTML: '', querySelectorAll: () => [] };
    const error = {};
    const elements = { confluenceMainModal: {}, confluenceModalHeader: {}, confluenceModalBody: body,
        daccExportFieldError: error, daccExportFieldForm: { addEventListener: (name, handler) => { submit = handler; } } };
    const api = helpers({ document: { getElementById: id => elements[id] },
        bootstrap: { Modal: { getOrCreateInstance: () => ({ show() {}, hide() { hidden = true; } }) } } });
    api.showDaccExportFieldSelection([{ id: '1' }], {}, api.ADMIN_EXPORT_OPTIONS);
    for (const key of ['genotyping', 'sex', 'carrier', 'phenotype']) assert.ok(body.innerHTML.includes(`value="requestedData-${key}"`));
    assert.ok(body.innerHTML.includes('value="actionRequired"'));
    assert.ok(body.innerHTML.includes('value="returnedDate"'));
    submit({ preventDefault() {} });
    assert.equal(hidden, false);
    assert.match(error.textContent, /Select at least one/);
});

test('Admin CSV uses chosen columns, escapes values, and restores the download button', async () => {
    let blob, filename;
    const status = {};
    const button = { innerHTML: 'Download Current Table', setAttribute() {}, removeAttribute() {} };
    const api = helpers({
        URL: { createObjectURL: value => { blob = value; return 'blob:test'; }, revokeObjectURL() {} },
        document: { getElementById: () => status, body: { appendChild() {}, removeChild() {} },
            createElement: () => ({ click() { filename = this.download; } }) }
    });
    await api.exportDaccDecisionTable([{ id: '1', documentDataLoaded: true,
        requestedData: { sex: ['Females', 'Males'] }, exportValues: { actionRequired: 'Needs "Resending", soon' } }],
        button, ['actionRequired', 'requestedData-sex'], api.ADMIN_EXPORT_OPTIONS);
    assert.equal(await blob.text(), '"Action Required","Data Requested From (sex)"\n"Needs ""Resending"", soon","Females, Males"');
    assert.match(filename, /^dacc_admin_table_\d{4}-\d{2}-\d{2}\.csv$/);
    assert.equal(button.disabled, false);
    assert.equal(button.innerHTML, 'Download Current Table');
    assert.match(status.textContent, /Downloaded 1 concept/);
});

test('empty filtered Admin tables show feedback without opening a download dialog', () => {
    let click;
    const status = {};
    const api = helpers({ document: { querySelectorAll: () => [], getElementById: id =>
        id === 'downloadAdminDecisionTable' ? { addEventListener: (event, handler) => { click = handler; } } : status } });
    api.setupAdminTableDownload([]);
    click();
    assert.match(status.textContent, /no visible concepts/);
});

test('Chair CSV retains its original columns, document values, and filename without Admin options', async () => {
    let blob, filename, statusId;
    const api = helpers({
        readDocFile: async () => 'Project Title: Chair concept Is this an amendment: No',
        URL: { createObjectURL: value => { blob = value; return 'blob:test'; }, revokeObjectURL() {} },
        document: { getElementById: id => { statusId = id; return {}; },
            body: { appendChild() {}, removeChild() {} },
            createElement: () => ({ click() { filename = this.download; } }) }
    });
    await api.exportDaccDecisionTable([{ id: '1', name: 'chair.docx' }],
        { innerHTML: 'Download', setAttribute() {}, removeAttribute() {} }, ['title', 'filename']);
    assert.equal(await blob.text(), '"Title","Filename"\n"Chair concept","chair.docx"');
    assert.match(filename, /^dacc_menu_table_/);
    assert.equal(statusId, 'daccDecisionDownloadStatus');
});
