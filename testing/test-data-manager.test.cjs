const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {test} = require('node:test');
const store = fs.readFileSync('src/optInOutStore.js', 'utf8').replace(/^import\s*\{[\s\S]*?\}\s*from\s*"\.\/shared.js";/, '').replace(/export /g, '');
const root = '432318158314';
const email = 'kopchickbp@nih.gov';
const testManager = {email, name: 'Benjamin Kopchick', consortium: 'TEST', isTest: true, collectionFolderId: root};
const studies = ['TEST_ST1', 'TEST_ST2', 'TEST_ST3'].map(acronym => ({acronym, name: acronym, consortium: 'TEST'}));
const rounds = [{id: 'test_round1', name: 'TEST_Round_1', concepts: [{fileId: 'production-concept', title: 'Current concept', fileName: 'Current_concept_R1_1.docx'}]}];
function setup() {
    const files = new Map(), folders = new Map(), writes = [], reads = [], comments = [];
    const context = vm.createContext({ console, localStorage: {parms: JSON.stringify({login: email, name: 'Ben'})},
        Confluence_Opt_In_Out: 'production-root', emailsAllowedToUpdateData: [email],
        dataManagersInfo: [testManager, {email: 'real-manager@example.org', consortium: 'C-NCI', collectionFolderId: 'production-collection'}],
        getFolderItems: async id => { reads.push(id); if (!String(id).startsWith(root)) throw new Error('Production folder access is forbidden in this test'); return {entries: folders.get(id) || []}; },
        getFile: async id => {reads.push(id); return files.get(id);},
        createFolder: async (parent, name) => { const id = parent + '/' + name; assert.ok(id.startsWith(root + '/')); writes.push(id); const item = {id, name, type: 'folder'}; folders.set(parent, [...(folders.get(parent) || []), item]); return item; },
        uploadFile: async (data, name, parent) => {const id = parent + '/' + name; assert.ok(id.startsWith(root + '/')); writes.push(id); files.set(id, data); folders.set(parent, [...(folders.get(parent) || []), {id, name, type: 'file'}]); return {entries: [{id}]};},
        uploadFileVersion: async (data, id) => {assert.ok(id.startsWith(root + '/')); writes.push(id); files.set(id, data); return {entries: [{id}]};},
        createComment: async (id, text) => { comments.push({id, text}); throw new Error('Source concept comments are forbidden'); }
    });
    vm.runInContext(store + '\nthis.api = {seedTestDataManagerRequests, provisionOptInOutRound, loadStudyAccessAssignments, loadDataManagerRequests, saveStudyAccessSelection, saveOptInOutSelections, saveDataManagerAccessDetails, saveDataManagerStage, loadOptInOutAssignments, parseTsv, serializeTsv};', context);
    return {api: context.api, context, files, folders, writes, reads, comments};
}
const provision = () => ({round: rounds[0], concepts: rounds[0].concepts, studies, consortiumId: 'TEST', opensAt: '2020-01-01T00:00:00Z', closesAt: '2099-01-01T00:00:00Z', managerView: true});

test('the real account retains admin access and has only the TEST manager and TEST study assignments', () => {
    const source = fs.readFileSync('src/shared.js', 'utf8');
    const roles = source.slice(source.indexOf('export const studyManagersInfo'), source.indexOf('export const getCollaboration'));
    const adminLine = source.match(/export const emailsAllowedToUpdateData = .*/)[0];
    const c = vm.createContext({});
    // Evaluate just the role configuration, without importing the application.
    const end = roles.indexOf('\nexport ', roles.indexOf('export const studiesInfo') + 1);
    vm.runInContext((adminLine + '\n' + (end < 0 ? roles : roles.slice(0, end))).replace(/export /g, '') + '\nthis.roles = {emailsAllowedToUpdateData, dataManagersInfo, studyManagersInfo, studiesInfo};', c);
    assert.ok(c.roles.emailsAllowedToUpdateData.includes(email));
    const matches = c.roles.dataManagersInfo.filter(manager => manager.email === email);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].consortium, 'TEST');
    assert.equal(matches[0].collectionFolderId, root);
    assert.equal(matches[0].isTest, true);
    assert.equal(c.roles.studyManagersInfo.find(manager => manager.email === email).consortium, 'TEST');
    assert.equal(c.roles.studiesInfo.filter(study => study.consortium === 'TEST').length, 3);
    assert.ok(c.roles.dataManagersInfo.some(manager => manager.email === 'ahearntu@nih.gov' && manager.consortium === 'C-NCI'));
});

test('initialization and round initiation write exclusively beneath the dedicated test folder', async () => {
    const app = setup();
    await app.api.seedTestDataManagerRequests({rounds, studies});
    const requests = await app.api.loadDataManagerRequests(testManager);
    assert.equal(requests[0].concept_box_id, 'production-concept');
    assert.equal(requests[0].workflow_stage, 'admin_accepted');
    assert.equal((await app.api.provisionOptInOutRound(provision())).createdAssignments, 3);
    const rows = await app.api.loadStudyAccessAssignments(true);
    assert.equal(rows.length, 3);
    assert.ok(rows.every(row => row.consortium_id === 'TEST' && row.selection_file_id.startsWith(root + '/studies/')));
    assert.ok(app.writes.every(id => id.startsWith(root + '/')));
    assert.equal(app.reads.some(id => id === 'production-root' || id === 'production-collection'), false);
});

test('current concepts are included for TEST without changing their form requests or documents', async () => {
    const page = fs.readFileSync('src/pages/chairmenu.js', 'utf8');
    const source = page.slice(page.indexOf('let testDataManagerPreparation ='), page.indexOf('export const syncCurrentDataManagerChairRequests =')).replace(/export /g, '');
    const file = {roundId:'r1',roundName:'Round_1',fileId:'original',filename:'Concept.docx',titlename:'Concept',assignedConceptId:'R1_1',requestedConsortia:['C-NCI']};
    const another = {...file,fileId:'another',filename:'Another.docx',assignedConceptId:'R1_2',requestedConsortia:['BCAC']};
    let seeded;
    const context = vm.createContext({localStorage:{parms:JSON.stringify({login:email})},dataManagersInfo:[testManager],studiesInfo:studies,
        loadAdminDataCache:async()=>({sub:[file, another],com:[],res:[]}),getConceptId:entry=>entry.assignedConceptId,getConceptTitleFromFileName:value=>value,
        seedTestDataManagerRequests:async value=>{seeded=value;}
    });
    vm.runInContext(source + '\nthis.prepare = prepareTestDataManagerWorkspace;', context);
    await context.prepare();
    assert.equal(seeded.rounds[0].id, 'test_r1');
    assert.equal(seeded.rounds[0].concepts.length, 2);
    assert.ok(seeded.rounds[0].concepts.every(concept => concept.requestedConsortia.join() === 'TEST'));
    assert.equal(file.requestedConsortia.join(), 'C-NCI');
    assert.equal(another.requestedConsortia.join(), 'BCAC');
    assert.equal(file.fileId, 'original');
});

test('admin membership does not bypass manager scope when initiating from test mode', async () => {
    const app = setup();
    await assert.rejects(app.api.provisionOptInOutRound({...provision(), consortiumId: 'C-NCI'}), /access/);
    await assert.rejects(app.api.saveDataManagerStage({roundId: 'r1', conceptBoxId: 'x', consortiumId: 'C-NCI', stage: 'scheduled'}), /access/);
    await assert.rejects(app.api.saveDataManagerAccessDetails({roundId: 'r1', conceptBoxId: 'x', consortiumId: 'C-NCI', dataManagerConsortium: 'C-NCI', dataManagerFolderId: 'production-collection'}), /TEST workspace/);
    assert.equal(app.writes.length, 0);
});

test('test decisions, notes, stages and refreshes preserve production sources and keep test audit history', async () => {
    const app = setup();
    await app.api.seedTestDataManagerRequests({rounds, studies});
    await app.api.provisionOptInOutRound(provision());
    const [assignment] = await app.api.loadStudyAccessAssignments(true);
    const result = await app.api.saveStudyAccessSelection({assignment, decision: 'opt_out', reason: 'Testing', managerView: true});
    assert.equal(result.warning, '');
    assert.equal(result.updated.decision, 'opt_out');
    assert.equal(app.comments.length, 0);
    assert.equal(JSON.parse(result.updated.decision_history)[0].reason, 'Testing');
    await app.api.saveDataManagerAccessDetails({roundId: rounds[0].id, conceptBoxId: 'production-concept', consortiumId: 'TEST', notes: 'Test access only', dtaAssignments: [], updatedBy: email, dataManagerConsortium: 'TEST', dataManagerFolderId: root});
    await app.api.saveDataManagerStage({roundId: rounds[0].id, conceptBoxId: 'production-concept', consortiumId: 'TEST', stage: 'ready_for_data_collection'});
    await app.api.seedTestDataManagerRequests({rounds, studies});
    const [request] = await app.api.loadDataManagerRequests(testManager);
    assert.equal(request.access_notes, 'Test access only');
    assert.equal(request.manager_stage, 'ready_for_data_collection');
    assert.equal((await app.api.loadStudyAccessAssignments(true))[0].decision, 'opt_out');
    assert.equal((await app.api.loadOptInOutAssignments(studies)).length, 3);
    assert.ok(app.writes.every(id => id.startsWith(root + '/')));
    assert.equal(app.files.has('production-concept'), false);
});

test('raw selection saves reject a production record in test mode', async () => {
    const app = setup();
    await app.api.seedTestDataManagerRequests({rounds, studies});
    const prod = {round_id:'r1', consortium_id:'C-NCI', study_id:'REAL', concept_box_id:'production-concept', decision:'pending'};
    app.files.set('production-selection', app.api.serializeTsv(Object.keys(prod), [prod]));
    const writesBefore = app.writes.length;
    const result = await app.api.saveOptInOutSelections([{selectionFileId:'production-selection', decision:'opt_out'}], {email, testMode:true});
    assert.equal(result.saved.length, 0);
    assert.match(result.failed[0].error, /TEST workspace/);
    assert.equal(app.writes.length, writesBefore);
});

test('TEST email drafts address only the tester and exclude production summaries', () => {
    const source = fs.readFileSync('src/components/optInOutProgress.js', 'utf8').replace(/^import .*$/gm, '').replace(/export /g, '');
    const c = vm.createContext({dataManagersInfo: [testManager, {email:'real-manager@example.org', consortium:'C-NCI'}], emailsAllowedToUpdateData:[email, 'other-admin@example.org']});
    vm.runInContext(source + '\nthis.draft = buildOptInOutEmailDraft;', c);
    const summary = {roundId:'test_round1',roundName:'TEST_Round_1',consortium:'TEST',status:'In progress',total:3,optedIn:1,optedOut:0,pending:2,unavailable:0,responseRate:33};
    const draft = decodeURIComponent(c.draft(summary, [summary, {...summary, consortium:'C-NCI',status:'PRODUCTION ONLY'}]));
    assert.ok(draft.startsWith(`mailto:${email}?`));
    assert.equal(draft.includes('real-manager@example.org'), false);
    assert.equal(draft.includes('other-admin@example.org'), false);
    assert.equal(draft.includes('PRODUCTION ONLY'), false);
    assert.match(draft, /TEST/);
});

test('test agreement uploads reject an external folder before creating or uploading anything', async () => {
    const page = fs.readFileSync('src/pages/dataManagers.js', 'utf8');
    const start = page.indexOf('const openDtaUploadModal =');
    const end = page.indexOf('const getCollectionStatus =', start);
    assert.ok(end > start);
    let submitted, creations = 0, uploads = 0;
    const status = {};
    const button = {};
    const nodes = new Map();
    const form = {
        elements: {dtaFolderMode: {value:'existing'}},
        querySelectorAll: () => [], querySelector: () => button,
        addEventListener: (event, handler) => {if (event === 'submit') submitted = handler;}
    };
    for (const id of ['confluenceMainModal', 'confluenceModalHeader', 'confluenceModalBody']) nodes.set(id, {});
    for (const id of ['dtaExistingFolderFields', 'dtaCreateFolderFields']) nodes.set(id, {classList:{toggle(){}}});
    nodes.set('dataManagerDtaUploadForm', form);
    nodes.set('dataManagerDtaUploadStatus', status);
    nodes.set('dataManagerDtaFile', {files:[{name:'Test.pdf'}]});
    nodes.set('dtaNewFolderName', {value:'Test agreements'});
    nodes.set('dtaExistingFolderId', {value:'production-folder'});
    nodes.set('dtaExistingFolder', {value:root});
    nodes.set('dtaParentFolderId', {value:'production-folder'});
    nodes.set('dtaParentFolder', {value:root});
    const c = vm.createContext({console:{error(){}}, document:{getElementById:id=>nodes.get(id)}, bootstrap:{Modal:{getOrCreateInstance:()=>({show(){}})}},
        escapeHtml:value=>String(value), getUploadFolderOptions:async()=>[{id:root,name:'TEST'}],
        createFolder:async()=>{creations++;}, uploadBinaryFile:async()=>{uploads++;}
    });
    vm.runInContext(page.slice(start, end) + '\nthis.open = openDtaUploadModal;', c);
    await c.open({assignmentElement:{}, uploadedBy:email, collectionFolderId:root, isTest:true, onUploaded(){}});
    await submitted({preventDefault(){}});
    assert.match(status.textContent, /TEST workspace/);
    form.elements.dtaFolderMode.value = 'create';
    await submitted({preventDefault(){}});
    assert.match(status.textContent, /TEST workspace/);
    assert.equal(creations, 0);
    assert.equal(uploads, 0);
});
