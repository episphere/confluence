const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {test} = require('node:test');

const source = fs.readFileSync('src/pages/dataManagers.js', 'utf8');
const context = vm.createContext({});
vm.runInContext(source.slice(source.indexOf('const escapeRegExp ='), source.indexOf('const parseDtaAssignments ='))
    .replace(/export /g, '') + '\nthis.extract = extractDataManagerInvestigatorDetails;', context);
const extract = context.extract;
const form = `Contact Investigator(s): Jane Doe
Institution(s): Test University
Contact Email: jane@example.org
Member of Consortia or Study / Trial Group? Yes
ALL Investigators (and Institutions) who require access: Jane Doe, Test University
Consortia or Study / Trial Group data being requested: TEST`;

test('preferred form retains investigator fields with flexible whitespace and case', () => {
    const details = extract(form.toUpperCase().replace(/ /g, '  '));
    assert.equal(details.readableFormat, true);
    assert.equal(details.contactInvestigator, 'JANE DOE');
    assert.equal(details.institution, 'TEST UNIVERSITY');
    assert.equal(details.email, 'JANE@EXAMPLE.ORG');
    assert.equal(details.allInvestigators, 'JANE DOE, TEST UNIVERSITY');
});

test('nonstandard documents and failed reads do not expose guessed investigator fields', () => {
    for (const text of ['', null, 'PI: Jane Doe. Email: jane@example.org',
        form.replace('Institution(s):', 'Organization:'),
        form.replace('Consortia or Study / Trial Group data being requested:', 'Requested data:')]) {
        const details = extract(text);
        assert.equal(details.readableFormat, false);
        assert.equal(details.contactInvestigator, undefined);
        assert.equal(details.allInvestigators, undefined);
    }
});

test('out-of-order form sections are treated as unreadable rather than borrowing other sections', () => {
    const lines = form.split('\n');
    [lines[0], lines[1]] = [lines[1], lines[0]];
    assert.equal(extract(lines.join('\n')).readableFormat, false);
});

test('blank answers in a recognized form remain valid empty fields', () => {
    const details = extract(form.replace('Jane Doe', '').replace('jane@example.org', ''));
    assert.equal(details.readableFormat, true);
    assert.equal(details.contactInvestigator, '');
    assert.equal(details.email, '');
});
