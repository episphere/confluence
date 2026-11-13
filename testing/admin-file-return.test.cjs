const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {test} = require('node:test');
const source = fs.readFileSync('src/pages/chairmenu.js', 'utf8');
const slice = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));

function helpers(overrides = {}) {
    const context = vm.createContext({completedFolder:'completed', deniedFolder:'denied', returnToSubmitterFolder:'returns',
        getAllFilesRecursive:async()=>[], getRequiringInputFiles:async()=>[], ...overrides});
    vm.runInContext(slice('const getDaccExportState =', 'const formatDaccExportComments =')
        + slice('const getRecordedAdminReturn =', 'const getProcessedAdminFiles =')
        + slice('const moveAdminFileVerified =', 'export const returnToChairs =')
        + '\nthis.api = {getDaccExportState, moveAdminFileVerified, getOrCreateAdminReturnCopy, loadAdminReturnComments, recordAdminReturnDate};', context);
    return context.api;
}

test('nested completed rounds display Accepted while intake remains Ongoing', () => {
    const {getDaccExportState: state} = helpers();
    assert.equal(state({parent:{id:'round'}, path_collection:{entries:[{id:'completed'}]}}), 'Accepted');
    assert.equal(state({parent:{id:'completed'}}), 'Accepted');
    assert.equal(state({parent:{id:'round'}, path_collection:{entries:[{id:'denied'}]}}), 'Denied');
    assert.equal(state({parent:{id:'intake-round'}}), 'Ongoing');
});

test('moves propagate Box errors and require confirmation of the destination', async () => {
    const failed = helpers({updateBoxFile:async()=>{throw new Error('Box conflict');}});
    await assert.rejects(failed.moveAdminFileVerified('original','completed-round'), /Box conflict/);
    const wrong = helpers({updateBoxFile:async()=>({}),getFileInfo:async()=>({parent:{id:'intake'}})});
    await assert.rejects(wrong.moveAdminFileVerified('original','completed-round'), /not confirmed/);
    const moved = helpers({updateBoxFile:async(id, data)=>assert.equal(data.parent.id, 'completed-round'),
        getFileInfo:async()=>({id:'original',parent:{id:'completed-round'}})});
    assert.equal((await moved.moveAdminFileVerified('original','completed-round')).id, 'original');
});

test('retry reuses the linked return copy without copying again', async () => {
    const api = helpers({getAllFilesRecursive:async()=>[{id:'returned',description:'original'}],
        copyFile:async()=>{throw new Error('must not copy');}});
    assert.equal((await api.getOrCreateAdminReturnCopy('original','accepted')).id, 'returned');
});

test('finalizing clarification moves the same reply file and rejects ambiguous copies', async () => {
    const api = helpers({getRequiringInputFiles:async()=>[{id:'reply',description:'original'}],
        updateBoxFile:async(id)=>assert.equal(id,'reply'), getFileInfo:async()=>({id:'reply',parent:{id:'accepted'}})});
    assert.equal((await api.getOrCreateAdminReturnCopy('original','accepted')).id, 'reply');
    const ambiguous = helpers({getRequiringInputFiles:async()=>[{description:'original'},{description:'original'}]});
    await assert.rejects(ambiguous.getOrCreateAdminReturnCopy('original','accepted'), /Multiple clarification copies/);
    const failed = helpers({copyFile:async()=>({status:409,statusText:'Conflict'})});
    await assert.rejects(failed.getOrCreateAdminReturnCopy('original','accepted'), /Conflict/);
});

test('return comments paginate and retries skip already copied chair comments', async () => {
    const pages = [0,1];
    const api = helpers({listComments:async(id,offset)=>{assert.equal(offset,pages.shift());return JSON.stringify({entries:[{id:offset}],total_count:2});}});
    assert.equal((await api.loadAdminReturnComments('original')).length,2);
    const posted = [];
    const context = vm.createContext({chairsInfo:[{consortium:'TEST'}],
        loadAdminReturnComments:async()=>[{message:'Consortium: TEST, Rating: 1 Box Comment ID: old'}],
        createComment:async(id,message)=>{posted.push(message); return {status:201};}});
    vm.runInContext(slice('export const copyComments =', 'const DATA_GOV_USERS_FILE_ID').replace('export ', '') + '\nthis.copy = copyComments;',context);
    await context.copy([{id:'old',message:'Consortium: TEST, Rating: 1'},{id:'new',message:'Consortium: TEST, Rating: 2'}],'returned');
    assert.deepEqual(posted,['Consortium: TEST, Rating: 2 Box Comment ID: new']);
});

function returnFlow(moveFails = false, managerFails = false) {
    const calls = [];
    const elements = Object.fromEntries(['confluenceModalHeader','confluenceModalBody','returnToSubmitterInfo','sendEmailAndRefresh']
        .map(id=>[id,{innerHTML:'',addEventListener(){}}]));
    const context = vm.createContext({document:{getElementById:id=>elements[id]},
        escapeHtml:String, console:{error(){},warn(){}}, adminDataCache:{}, returnToSubmitterFolder:'returns', completedFolder:'completed', chairsInfo:[],
        getFileInfo:async id=>{calls.push(['read',id]);return {id,name:'Concept_R1_1.docx',created_by:{login:'tester@example.org'},parent:{name:'Round 1'}};},
        getOrCreateChildFolder:async(parent,name)=>({id:parent+'/'+name}), addNewCollaborator:async()=>{},
        getOrCreateAdminReturnCopy:async id=>{calls.push(['copy',id]);return {id:'copy'};},
        loadAdminReturnComments:async()=>[], copyComments:async()=>{}, getRequiringInputFiles:async()=>[],
        recordAdminReturnDate:async()=>{},
        moveAdminFileVerified:async(id,destination)=>{calls.push(['move',id,destination]);if(moveFails)throw new Error('Move denied');},
        updateDataManagerChairStatus:async details=>{calls.push(['status',details.conceptBoxId]);if(managerFails)throw new Error('Sync failed');},
        refreshAdminTable:()=>calls.push(['refresh'])});
    vm.runInContext(slice('    const processFileReturn =', '    const returnSubmitterButton =') + '\nthis.run = processFileReturn;',context);
    const checkbox = {id:'response-copy',closest:()=>({dataset:{conceptBoxId:'original',fileType:'res',roundId:'round'}})};
    return {context,checkbox,elements,calls};
}

test('accepting a returned row moves the original and refreshes before email', async () => {
    const flow = returnFlow();
    await flow.context.run(flow.checkbox,'Accepted');
    assert.deepEqual(flow.calls,[['read','original'],['copy','original'],['move','original','completed/Round 1'],['status','original'],['refresh']]);
    assert.match(flow.elements.confluenceModalHeader.innerHTML,/File Return Complete/);
});

test('failed master move never reports completion or publishes accepted status', async () => {
    const flow = returnFlow(true);
    await flow.context.run(flow.checkbox,'Accepted');
    assert.match(flow.elements.confluenceModalHeader.innerHTML,/File Return Incomplete/);
    assert.equal(flow.calls.some(call=>call[0]==='status'),false);
    assert.equal(flow.context.adminDataCache,null);
});

test('manager synchronization failure remains visible after successful file moves', async () => {
    const flow = returnFlow(false,true);
    await flow.context.run(flow.checkbox,'Accepted');
    assert.match(flow.elements.confluenceModalHeader.innerHTML,/Status Sync Incomplete/);
    assert.equal(flow.calls.some(call=>call[0]==='refresh'),true);
});

function processedFiles() {
    const context = vm.createContext({getConceptTitleFromFileName:String, findMatchingFileByName:()=>null,
        findRoundByConceptDate:()=>null});
    vm.runInContext(slice('const getRecordedAdminReturn =', 'const setAdminHydrationProgress =') + '\nthis.process = getProcessedAdminFiles;', context);
    return context.process;
}

test('accepted rows retain submission date and recover return date from the linked return copy', async () => {
    const file = {id:'original',name:'Concept.docx',created_at:'2026-01-01T00:00:00Z',modified_at:'2026-11-01T00:00:00Z'};
    const copies = [{description:'another-concept',created_at:'2026-10-01T00:00:00Z'},
        {description:'original',created_at:'2026-02-01T00:00:00Z'}];
    const [row] = await processedFiles()([file],'com',[],[],copies);
    assert.equal(row.submissionDate,file.created_at);
    assert.equal(row.returnedDate,'2026-02-01T00:00:00Z');
});

test('explicit final return timestamp takes precedence over an older clarification copy date', async () => {
    const [row] = await processedFiles()([{id:'original',name:'Concept.docx',
        description:'Existing notes\nConfluence admin return: Accepted 2026-03-01T00:00:00Z'}], 'com',[],[],
        [{description:'original',created_at:'2026-02-01T00:00:00Z'}]);
    assert.equal(row.returnedDate,'2026-03-01T00:00:00Z');
    const [unknown] = await processedFiles()([{id:'original',name:'Concept.docx',modified_at:'2026-11-01T00:00:00Z'}],'com');
    assert.equal(unknown.returnedDate,null);
});

test('recording a return preserves existing notes and retries keep the same timestamp', async () => {
    let saved;
    const api = helpers({updateBoxFile:async(id,data)=>{saved = {id,...data};}});
    await api.recordAdminReturnDate({id:'original',description:'Existing notes'},'Accepted');
    assert.equal(saved.id,'original');
    assert.match(saved.description,/^Existing notes\nConfluence admin return: Accepted /);
    const description = saved.description;
    saved = null;
    await api.recordAdminReturnDate({id:'original',description},'Accepted');
    assert.equal(saved,null);
    await api.recordAdminReturnDate({id:'original',description},'Denied');
    assert.match(saved.description,/Confluence admin return: Denied /);
    assert.equal(saved.description.includes('Confluence admin return: Accepted'),false);
});

test('a failed return date write prevents reporting the return as complete', async () => {
    const flow = returnFlow();
    flow.context.recordAdminReturnDate = async()=>{throw new Error('Unable to save return date');};
    await flow.context.run(flow.checkbox,'Accepted');
    assert.match(flow.elements.confluenceModalHeader.innerHTML,/File Return Incomplete/);
    assert.equal(flow.calls.some(call=>call[0]==='status'),false);
});
