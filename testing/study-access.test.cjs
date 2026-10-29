const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync('src/optInOutStore.js', 'utf8').replace(/^import\s*\{[\s\S]*?\}\s*from\s*"\.\/shared.js";/, '').replace(/export /g, '');
const selection = (id, study, consortium = 'C-NCI', round = 'r1') => ({
    round_id: round, round_name: round, consortium_id: consortium, study_id: study, study_acronym: study, study_name: study,
    concept_box_id: 'concept1', concept_title: 'Same title', concept_file_name: 'Same title.docx',
    selection_file_id: id, workflow_stage: 'opt_in_out', decision: 'pending', submitted: 'false', updated_at_utc: '2026-01-01'
});
function setup({login = 'admin@example.org', failUpload = false, failComment = false} = {}) {
    const files = new Map();
    const folders = new Map([['root', [{id: 'config', name: '_config', type: 'folder'}]], ['cnci', [{id: 'cnci-config', name: '_config', type: 'folder'}]], ['bcac', [{id: 'bcac-config', name: '_config', type: 'folder'}]]]);
    const reads = [], comments = [];
    const context = {
        console: {warn() {}}, Confluence_Opt_In_Out: 'root', emailsAllowedToUpdateData: ['admin@example.org'],
        dataManagersInfo: [{email: 'manager@example.org', consortium: 'C-NCI', collectionFolderId: 'cnci'}, {email: 'other@example.org', consortium: 'BCAC', collectionFolderId: 'bcac'}],
        localStorage: {parms: JSON.stringify({login, name: 'Reviewer'})},
        getFolderItems: async id => { reads.push(id); return {entries: folders.get(id) || []}; },
        getFile: async id => { reads.push(id); return files.get(id); },
        uploadFileVersion: async (data, id) => { if (failUpload) return {status: 403}; files.set(id, data); return {entries: [{id}]}; },
        uploadFile: async (data, name, folder) => {
            const id = folder + '/' + name; files.set(id, data);
            folders.set(folder, [...(folders.get(folder) || []), {id, name, type: 'file'}]);
            return {entries: [{id}]};
        },
        createComment: async (id, message) => { comments.push({id, message}); return {status: failComment ? 403 : 201}; },
        createFolder: async () => { throw new Error('Unexpected folder creation'); }
    };
    vm.createContext(context);
    vm.runInContext(source + '\nthis.api = {saveDataManagerStage, loadStudyAccessAssignments, saveStudyAccessSelection, saveOptInOutSelections, loadDataManagerRequests, publishDataManagerChairRequests, publishRowsToDataManagerFiles, serializeTsv, parseTsv};', context);
    function addFile(folder, id, name, rows) {
        files.set(id, context.api.serializeTsv([...new Set(rows.flatMap(row => Object.keys(row)))], rows));
        folders.set(folder, [...(folders.get(folder) || []), {id, name, type: 'file'}]);
    }
    const rows = [selection('s1', '4-CBCS'), selection('s2', 'OTHER'), selection('s3', '4-CBCS', 'C-NCI', 'r2'), selection('s4', 'BCAC-STUDY', 'BCAC')];
    addFile('config', 'requests', 'data_manager_requests.tsv', rows);
    addFile('config', 'manifest', 'r1_manifest.tsv', rows);
    rows.forEach(row => addFile('selections', row.selection_file_id, row.selection_file_id + '.tsv', [row]));
    return {context, api: context.api, files, folders, reads, comments, rows, addFile};
}
test('manager stage persists across publishing and can return to automatic', async () => {
    const app = setup({login: 'manager@example.org'});
    await app.api.publishRowsToDataManagerFiles(app.rows);
    const input = {roundId: 'r1', conceptBoxId: 'concept1', consortiumId: 'C-NCI', stage: 'chair_complete'};
    await app.api.saveDataManagerStage(input);
    await app.api.publishRowsToDataManagerFiles(app.rows);
    const manager = app.context.dataManagersInfo[0];
    let rows = await app.api.loadDataManagerRequests(manager);
    assert.equal(rows.find(row => row.round_id === 'r1').manager_stage, 'chair_complete');
    assert.equal(rows.find(row => row.round_id === 'r1').stage_updated_by, 'manager@example.org');
    assert.equal(rows.find(row => row.round_id === 'r2').manager_stage, '');
    await assert.rejects(app.api.saveDataManagerStage({...input, consortiumId: 'BCAC'}), /access/);
    await assert.rejects(app.api.saveDataManagerStage({...input, stage: 'invalid'}), /Invalid/);
    await app.api.saveDataManagerStage({...input, stage: ''});
    rows = await app.api.loadDataManagerRequests(manager);
    assert.equal(rows.find(row => row.round_id === 'r1').manager_stage, '');
    assert.equal(rows.find(row => row.round_id === 'r1').decision, 'pending');
});
test('failed stage save leaves stored value unchanged', async () => {
    const app = setup({login: 'manager@example.org', failUpload: true});
    await app.api.publishRowsToDataManagerFiles(app.rows);
    await assert.rejects(app.api.saveDataManagerStage({roundId: 'r1', conceptBoxId: 'concept1', consortiumId: 'C-NCI', stage: 'chair_complete'}));
    const rows = await app.api.loadDataManagerRequests(app.context.dataManagersInfo[0]);
    assert.equal(rows[0].manager_stage, '');
});
test('admin loads every study/round and publishes complete consortium indexes', async () => {
    const app = setup();
    const rows = await app.api.loadStudyAccessAssignments();
    assert.equal(rows.length, 4);
    assert(rows.every(row => row.decision === 'pending'));
    const index = app.api.parseTsv(app.files.get('cnci-config/study_access_assignments.tsv'));
    assert.equal(index.length, 3);
    assert(index.every(row => row.consortium_id === 'C-NCI'));
    assert.equal(new Set(index.map(row => row.selection_file_id)).size, 3);
});
test('manager reads only their consortium, without central access', async () => {
    const app = setup({login: 'manager@example.org'});
    app.addFile('cnci-config', 'manager-index', 'study_access_assignments.tsv', app.rows);
    assert.equal((await app.api.loadStudyAccessAssignments(true)).length, 3);
    for (const id of ['root', 's4', 'bcac']) assert(!app.reads.includes(id));
});
test('save updates the original TSV; manager and admin reload the same decision', async () => {
    const app = setup();
    const before = await app.api.loadStudyAccessAssignments();
    app.context.localStorage.parms = JSON.stringify({login: 'manager@example.org'});
    const saved = await app.api.saveStudyAccessSelection({assignment: before[0], decision: 'opt_out', reason: 'Not participating', managerView: true});
    assert.equal(saved.updated.decision, 'opt_out');
    const record = app.api.parseTsv(app.files.get('s1'))[0];
    assert.equal(record.decision_reason, 'Not participating');
    assert.equal(JSON.parse(record.decision_history)[0].changed_by, 'manager@example.org');
    for (const id of ['s2', 's3']) assert.equal(app.api.parseTsv(app.files.get(id))[0].decision, 'pending');
    assert.equal((await app.api.loadStudyAccessAssignments(true))[0].decision, 'opt_out');
    app.context.localStorage.parms = JSON.stringify({login: 'admin@example.org'});
    assert.equal((await app.api.loadStudyAccessAssignments())[0].decision, 'opt_out');
    assert.equal(app.comments.length, 1);
});
test('blank reasons, cross-consortium writes, and stale edits are rejected', async () => {
    const app = setup();
    const rows = await app.api.loadStudyAccessAssignments();
    await assert.rejects(app.api.saveStudyAccessSelection({assignment: rows[0], decision: 'opt_out', reason: '  '}), /reason/);
    app.context.localStorage.parms = JSON.stringify({login: 'manager@example.org'});
    await assert.rejects(app.api.saveStudyAccessSelection({assignment: rows[3], decision: 'opt_out', reason: 'No', managerView: true}), /access/);
    await app.api.saveStudyAccessSelection({assignment: rows[0], decision: 'opt_out', reason: 'No', managerView: true});
    await assert.rejects(app.api.saveStudyAccessSelection({assignment: rows[0], decision: 'opt_in', reason: 'Stale', managerView: true}), /changed/);
});
test('missing files stay unavailable and denied saves leave decisions unchanged', async () => {
    const app = setup({failUpload: true});
    const rows = await app.api.loadStudyAccessAssignments();
    await assert.rejects(app.api.saveStudyAccessSelection({assignment: rows[0], decision: 'opt_out', reason: 'No'}));
    assert.equal(app.api.parseTsv(app.files.get('s1'))[0].decision, 'pending');
    app.files.delete('s2');
    assert.equal((await app.api.loadStudyAccessAssignments()).find(row => row.selection_file_id === 's2').decision, 'unavailable');
});
test('comment failure preserves the selection and reason with a warning', async () => {
    const app = setup({failComment: true});
    const rows = await app.api.loadStudyAccessAssignments();
    const result = await app.api.saveStudyAccessSelection({assignment: rows[0], decision: 'opt_out', reason: 'Reason'});
    assert(result.warning);
    assert.equal(app.api.parseTsv(app.files.get('s1'))[0].decision_reason, 'Reason');
});
test('missing manager index fails explicitly without a CSV fallback', async () => {
    await assert.rejects(setup({login: 'manager@example.org'}).api.loadStudyAccessAssignments(true), /not been published/);
});
test('round manifests recover assignments missing from the request index', async () => {
    const app = setup();
    app.files.set('requests', app.api.serializeTsv(Object.keys(app.rows[0]), [app.rows[0]]));
    assert.equal((await app.api.loadStudyAccessAssignments()).length, 4);
});
test('manager saves survive lack of central-index access and ordinary study saves retain audit history', async () => {
    const app = setup();
    const rows = await app.api.loadStudyAccessAssignments();
    app.context.localStorage.parms = JSON.stringify({login: 'manager@example.org'});
    const original = app.context.getFolderItems;
    app.context.getFolderItems = async id => { if (id === 'root') throw new Error('Forbidden'); return original(id); };
    await app.api.saveStudyAccessSelection({assignment: rows[0], decision: 'opt_out', reason: 'Reason', managerView: true});
    assert.equal((await app.api.loadStudyAccessAssignments(true))[0].decision, 'opt_out');
    const result = await app.api.saveOptInOutSelections([{selectionFileId: 's1', decision: 'opt_in'}], {email: 'study@example.org'});
    assert.equal(result.saved.length, 1);
    assert.equal(JSON.parse(app.api.parseTsv(app.files.get('s1'))[0].decision_history)[0].reason, 'Reason');
});
test('chair publishing preserves initiated study links', async () => {
    const app = setup();
    await app.api.publishDataManagerChairRequests({round: {id: 'r1', name: 'r1'}, reviews: [{sourceFileId: 'concept1', consortium: 'C-NCI', requestedStudy: 'C-NCI', title: 'Same title', chairScore: '1'}],
        studies: [{acronym: '4-CBCS', name: '4-CBCS', consortium: 'C-NCI'}], initiatedBy: 'admin@example.org'});
    const row = app.api.parseTsv(app.files.get('requests')).find(row => row.study_id === '4-CBCS' && row.round_id === 'r1');
    assert.equal(row.selection_file_id, 's1');
    assert.equal(row.workflow_stage, 'opt_in_out');
});
test('table keeps same-title rounds separate and renders pending and missing assignments honestly', async () => {
    const page = fs.readFileSync('src/pages/studyopt.js', 'utf8');
    const slice = (start, end) => page.slice(page.indexOf(start), page.indexOf(end));
    const context = {console, dataManagersInfo: [], getTestDataManager: () => null, loadStudyAccessAssignments: async () => [selection('s1', '4-CBCS'), selection('s2', 'OTHER'), selection('s3', '4-CBCS', 'C-NCI', 'r2')],
        loadOptInOutWorkbookRows: async () => [], getRoundNumberFromFileName: () => null, readDocFile: async () => '', extractContactInvestigators: () => ''};
    vm.createContext(context);
    vm.runInContext(slice('const escapeHtml', 'const getConceptDisplayName') + slice('const normalizeStudyFilterValue', 'const loadOptInOutWorkbookRows')
        + '\nthis.api = {loadStudyAccessAdminRows, getStudyAccessStatusSelect};', context);
    const groups = await context.api.loadStudyAccessAdminRows(true);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].concepts.length, 2);
    assert.equal(groups[0].studies.length, 2);
    assert(context.api.getStudyAccessStatusSelect(selection('s1', '4-CBCS')).includes('value="pending" selected'));
    assert(context.api.getStudyAccessStatusSelect(null).includes('Not assigned'));
    assert(context.api.getStudyAccessStatusSelect({load_error: 'Denied'}).includes('Unavailable'));
});
