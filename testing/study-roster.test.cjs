const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {test} = require('node:test');
const source = fs.readFileSync('src/studyRoster.js', 'utf8').replace(/^import .*$/gm, '').replace(/export /g, '');
const header = ['Consortium','Name','Email','Study Acronym','Study Name','Active'];
const row = (consortium='BCAC', email='jane@example.org', acronym='ST1', active='Yes') => [consortium,'Jane Doe',email,acronym,`Study ${acronym}`,active];
function setup() {
    const requests = [];
    const config = {'C-NCI':null,BCAC:'123',CIMBA:null,AABCG:null,LAGENO:null,MERGE:null};
    let responseStatus = 200, refreshes = 0;
    const sheets = {Roster:[header,row()]};
    const context = vm.createContext({console, Date,
        studyManagerRosterFiles:config,
        studyManagersInfo:[{name:'Tester',email:'tester@example.org',consortium:'TEST',studies:[{acronym:'TEST_ST1',name:'Test study'}]}],
        localStorage:{parms:JSON.stringify({login:'user@example.org',access_token:'test-token'})},
        refreshToken: async () => {refreshes++; responseStatus=200; return true;},
        fetch:async (url, options) => {requests.push({url,options}); return {ok:responseStatus===200,status:responseStatus,arrayBuffer:async()=>({Sheets:sheets,SheetNames:Object.keys(sheets)})};},
        XLSX:{read:value=>value, utils:{sheet_to_json:sheet=>sheet}}
    });
    vm.runInContext(source+'\nthis.api={parseStudyManagerRoster,buildStudyRoster,loadStudyRoster,loadStudyRosters};',context);
    return {api:context.api,context,requests,config,sheets,setStatus:status=>{responseStatus=status;},refreshes:()=>refreshes};
}

test('one row per manager/study pair supports many studies, shared studies, and inactive entries', () => {
    const app=setup();
    const data=[header,...[1,2,3,4,5].map(index=>row('BCAC',' Jane@Example.org ',`ST${index}`)),row(),
        ['BCAC','John Smith','john@example.org','ST1','Study ST1',''],['','','','','','No'],[]];
    const result=app.api.parseStudyManagerRoster(data,'bcac');
    assert.equal(result.managers.length,2);
    assert.equal(result.managers[0].studies.length,5);
    assert.equal(result.managers[0].email,'jane@example.org');
    assert.equal(result.studies.length,5);
    assert.equal(result.studies[0].studyManagerEmails.length,2);
});

test('validation reports the consortium and Excel row instead of accepting malformed assignments', () => {
    const {api}=setup();
    assert.throws(()=>api.parseStudyManagerRoster([header.slice(1)],'BCAC'),/missing columns: Consortium/);
    for (const [bad,pattern] of [[row('CIMBA'),/Consortium must be BCAC/],
        [row('BCAC','not-an-email'),/valid Email/],[row('BCAC','jane@example.org','ST1','Maybe'),/Active must be/],
        [['BCAC','Jane Doe','jane@example.org','','Study','Yes'],/Study Acronym/]]) {
        assert.throws(()=>api.parseStudyManagerRoster([header,bad],'BCAC'),error=>/BCAC roster, row 2/.test(error.message)&&pattern.test(error.message));
    }
    assert.throws(()=>api.parseStudyManagerRoster([header,row(),['BCAC','Jane Doe','jane@example.org','ST1','Different study','Yes']],'BCAC'),/Conflicting names for study/);
});

test('Box workbooks use authenticated downloads, deduplicate simultaneous loads, and replace a consortium roster', async () => {
    const app=setup();
    const [first,second]=await Promise.all([app.api.loadStudyRoster('BCAC'),app.api.loadStudyRoster('BCAC')]);
    assert.equal(app.requests.length,1);
    assert.equal(first,second);
    assert.match(app.requests[0].url,/files\/123\/content$/);
    assert.equal(app.requests[0].options.headers.Authorization,'Bearer test-token');
    assert.equal(first.managers.length,1);
    app.config.BCAC='456';
    app.sheets.Roster=[header];
    assert.equal((await app.api.loadStudyRoster('BCAC')).managers.length,0);
    assert.equal(app.requests.length,2);
});

test('consortia keep distinct studies even when acronyms and manager emails are identical', async () => {
    const app=setup();
    app.config.CIMBA='456';
    app.context.fetch=async url=>({ok:true,status:200,arrayBuffer:async()=>({Sheets:{Roster:[header,row(url.includes('/456/')?'CIMBA':'BCAC')]}})});
    const result=await app.api.loadStudyRosters(['BCAC','CIMBA','BCAC']);
    assert.equal(result.managers.length,2);
    assert.equal(result.studies.length,2);
    assert.deepEqual(Array.from(result.studies,study=>study.consortium),['BCAC','CIMBA']);
});

test('configured roster failures remain errors, can be retried, and do not fall back to old contacts', async () => {
    const app=setup();
    app.config['C-NCI']='789';
    app.setStatus(403);
    await assert.rejects(app.api.loadStudyRoster('C-NCI'),/C-NCI.*Box \(403\)/);
    assert.equal(app.requests.length,1);
    app.setStatus(200);
    app.sheets.Roster=[header,row('C-NCI')];
    assert.equal((await app.api.loadStudyRoster('C-NCI')).managers.length,1);
    assert.equal(app.requests.length,2);
    app.config.BCAC='not-a-box-id';
    await assert.rejects(app.api.loadStudyRoster('BCAC'),/numeric Box file ID/);
});

test('expired Box authentication refreshes once before retrying', async () => {
    const app=setup();
    app.setStatus(401);
    await app.api.loadStudyRoster('BCAC');
    assert.equal(app.refreshes(),1);
    assert.equal(app.requests.length,2);
});

test('unconfigured consortia are empty, TEST stays local, and C-NCI retains its existing workbook', async () => {
    const app=setup();
    assert.equal((await app.api.loadStudyRoster('CIMBA')).studies.length,0);
    assert.equal((await app.api.loadStudyRoster('TEST')).studies[0].acronym,'TEST_ST1');
    assert.equal(app.requests.length,0);
    delete app.sheets.Roster;
    app.sheets.Legacy=[{Name:'Jane Doe',Email:'jane@example.org',Study_1:'Existing study','Study_1 Acronym':'EXISTING'}];
    const cnci=await app.api.loadStudyRoster('C-NCI');
    assert.equal(cnci.studies[0].consortium,'C-NCI');
    assert.equal(cnci.studies[0].acronym,'EXISTING');
    assert.equal(app.requests[0].url,'./src/data/DataPlatform-Out-in-out.xlsx');
});

test('missing Roster sheet is rejected with an actionable error', async () => {
    const app=setup();
    delete app.sheets.Roster;
    app.sheets.Instructions=[];
    await assert.rejects(app.api.loadStudyRoster('BCAC'),/must contain a Roster sheet/);
});
