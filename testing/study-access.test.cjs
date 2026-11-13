const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync('src/optInOutStore.js', 'utf8').replace(/^import\s*\{[\s\S]*?\}\s*from\s*"\.\/shared.js";/, '').replace(/^import .*adminRequestedData.*$/m, '').replace(/export /g, '') + '\n' + fs.readFileSync('src/pages/adminRequestedData.js', 'utf8').replace(/export /g, '');
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
        readDocFile: async () => '',
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
    vm.runInContext(source + '\nthis.api = {saveDataManagerStage, loadStudyAccessAssignments, saveStudyAccessSelection, saveOptInOutSelections, loadDataManagerRequests, publishDataManagerChairRequests, updateDataManagerChairStatus, publishRowsToDataManagerFiles, serializeTsv, parseTsv};', context);
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
test('existing summary-only assignments load as N/A and reject PI decisions', async () => {
    const app = setup();
    app.context.readDocFile = async () => 'Genotyping: Concept 1 GWAS Summary Results\nData Requested From: Females';
    const rows = await app.api.loadStudyAccessAssignments();
    assert.ok(rows.length);
    assert.ok(rows.every(row => row.decision === 'not_applicable'));
    assert.equal(rows[0].decision_reason, 'Summary Results Requested Only');
    const original = app.files.get('s1');
    const result = await app.api.saveOptInOutSelections([{selectionFileId:'s1', decision:'opt_in'}], {email:'admin@example.org'});
    assert.equal(result.saved.length, 0);
    assert.match(result.failed[0].error, /Summary Results Requested Only/);
    assert.equal(app.files.get('s1'), original);
});

test('mixed selections and unreadable concepts never become summary-only exemptions', async () => {
    for (const text of ['', 'Genotyping: Concept 1 GWAS Summary Results, Individual-level imputed data\nData Requested From: Females', null]) {
        const app = setup();
        app.context.readDocFile = async () => { if (text === null) throw new Error('Box unavailable'); return text; };
        const rows = await app.api.loadStudyAccessAssignments();
        assert.ok(rows.every(row => row.decision === 'pending'));
    }
});

test('PI open-assignment loader applies the rule to older selection files', async () => {
    const app = setup();
    app.context.readDocFile = async () => 'Genotyping: Concept 1 GWAS Summary Results\nData Requested From: Females';
    app.folders.set('root', [...app.folders.get('root'), {id:'consortium', name:'C-NCI', type:'folder'}]);
    app.folders.set('consortium', [{id:'study-folder', name:'4-CBCS', type:'folder'}]);
    app.addFile('study-folder', 'pi-manifest', '_study_manifest.tsv', [{...app.rows[0], round_status:'open'}]);
    const updates = [];
    app.context.reportProgress = (fraction, message) => updates.push({fraction, message});
    const rows = await vm.runInContext('loadOptInOutAssignments([{acronym:"4-CBCS"}], reportProgress)', app.context);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].decision, 'not_applicable');
    assert.equal(rows[0].selectionFileId, 's1');
    assert.ok(updates.some(update => update.message.includes('Loading saved decisions (1/1)')));
    assert.ok(updates.some(update => update.message.includes('Checking Genotyping selections (1/1)')));
    assert.equal(updates.at(-1).fraction, 1);
    assert.ok(updates.every((update, index) => index === 0 || update.fraction + 1e-10 >= updates[index - 1].fraction));
});

test('data managers automatically see the summary-only condition as N/A', () => {
    const page = fs.readFileSync('src/pages/dataManagers.js', 'utf8');
    const ctx = vm.createContext({DATA_MANAGER_STAGES:{}});
    vm.runInContext(page.slice(page.indexOf('const getCollectionStatus ='), page.indexOf('export const dataManagersTemplate ='))
        + '\nthis.status = getCollectionStatus;', ctx);
    const status = ctx.status({decision:'not_applicable', submitted:'false'});
    assert.equal(status.label, 'Summary Results Requested Only');
    assert.match(status.detail, /N\/A/);
});

test('PI assignment loading selects the requested consortium when study acronyms overlap', async () => {
    const app = setup();
    app.folders.set('root', [...app.folders.get('root'),
        {id:'cnci-consortium',name:'C-NCI',type:'folder'}, {id:'bcac-consortium',name:'BCAC',type:'folder'}]);
    app.folders.set('cnci-consortium',[{id:'cnci-study',name:'SAME',type:'folder'}]);
    app.folders.set('bcac-consortium',[{id:'bcac-study',name:'SAME',type:'folder'}]);
    const bcac = {...selection('bcac-selection','SAME','BCAC'),round_status:'open'};
    app.addFile('selections','bcac-selection','bcac-selection.tsv',[bcac]);
    app.addFile('bcac-study','bcac-manifest','_study_manifest.tsv',[bcac]);
    app.addFile('cnci-study','cnci-manifest','_study_manifest.tsv',[{...app.rows[0],round_status:'open'}]);
    const rows = await vm.runInContext('loadOptInOutAssignments([{acronym:"SAME",consortium:"BCAC"}])',app.context);
    assert.equal(rows.length,1);
    assert.equal(rows[0].consortium_id,'BCAC');
    assert.equal(rows[0].selectionFileId,'bcac-selection');
});

test('PI and manager selectors render N/A without editable controls for summary-only requests', () => {
    const page = fs.readFileSync('src/pages/studyopt.js', 'utf8');
    const ctx = vm.createContext({});
    vm.runInContext(page.slice(page.indexOf('const getStudyAccessStatusSelect ='), page.indexOf('const confirmStudyAccessChange ='))
        + page.slice(page.indexOf('const getSavedStudyStatusSelect ='), page.indexOf('const updateStudyStatusStyle ='))
        + '\nthis.render = [getStudyAccessStatusSelect, getSavedStudyStatusSelect];', ctx);
    for (const render of ctx.render) {
        const html = render({decision:'not_applicable'});
        assert.match(html, /N\/A/);
        assert.match(html, /Summary Results Requested Only/);
        assert.doesNotMatch(html, /<select/);
    }
});

test('reply sources and published discussion remain readable from the consortium manager index', async () => {
    const app = setup();
    const snapshot = {comments:[{id:'r1',message:'Response ID: q1, Submitter explanation'}],response_lookup_complete:true,checked_at_utc:'2026-11-03T12:00:00Z'};
    await app.api.publishDataManagerChairRequests({round:{id:'r1',name:'Round_1'},reviews:[{sourceFileId:'concept1',chairFileId:'chair1',responseFileId:'returned1',discussionSnapshot:snapshot,consortium:'C-NCI',fileName:'Concept.docx'}],studies:[{acronym:'4-CBCS',name:'Study',consortium:'C-NCI'}],initiatedBy:'admin@example.org'});
    await app.api.updateDataManagerChairStatus({conceptBoxId:'concept1',consortium:'C-NCI',score:'2'});
    app.context.localStorage.parms = JSON.stringify({login:'manager@example.org'});
    const manager = app.context.dataManagersInfo[0];
    const requests = await app.api.loadDataManagerRequests(manager);
    const request = requests.find(row=>row.round_id==='r1');
    assert.equal(request.response_file_id,'returned1');
    assert.equal(request.chair_file_id,'chair1');
    assert.equal(JSON.parse(request.discussion_snapshot).comments[0].message,'Response ID: q1, Submitter explanation');
    app.context.localStorage.parms = JSON.stringify({login:'admin@example.org'});
    snapshot.comments.push({id:'r2',message:'Response ID: q1, Updated reply'});
    await app.api.updateDataManagerChairStatus({conceptBoxId:'concept1',consortium:'C-NCI',discussionSnapshot:snapshot,responseFileId:'returned2'});
    const updated = app.api.parseTsv(app.files.get('cnci-config/C-NCI.tsv')).find(row=>row.round_id==='r1');
    assert.equal(updated.response_file_id,'returned2');
    assert.equal(JSON.parse(updated.discussion_snapshot).comments.length,2);
});

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
        loadStudyRosters: async () => ({managers:[
            {name:'C-NCI contact',email:'contact@example.org',consortium:'C-NCI',studies:[{acronym:'4-CBCS'}]},
            {name:'BCAC contact',email:'other@example.org',consortium:'BCAC',studies:[{acronym:'4-CBCS'}]}
        ]}), getRoundNumberFromFileName: () => null, readDocFile: async () => '', extractContactInvestigators: () => ''};
    vm.createContext(context);
    vm.runInContext(slice('const escapeHtml', 'const getConceptDisplayName') + slice('const normalizeStudyFilterValue', 'const getSavedStudyStatusSelect')
        + '\nthis.api = {loadStudyAccessAdminRows, getStudyAccessStatusSelect};', context);
    const groups = await context.api.loadStudyAccessAdminRows(true);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].concepts.length, 2);
    assert.equal(groups[0].studies.length, 2);
    assert.equal(groups[0].users.length, 1);
    assert.equal(groups[0].users[0].email, 'contact@example.org');
    assert(context.api.getStudyAccessStatusSelect(selection('s1', '4-CBCS')).includes('value="pending" selected'));
    assert(context.api.getStudyAccessStatusSelect(null).includes('Not assigned'));
    assert(context.api.getStudyAccessStatusSelect({load_error: 'Denied'}).includes('Unavailable'));
});
