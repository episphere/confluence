# confluence

[![Join the chat at https://gitter.im/episphere/confluence](https://badges.gitter.im/episphere/confluence.svg)](https://gitter.im/episphere/confluence?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


Confluence project, live at  https://episphere.github.io/confluence

## Study manager rosters

Use `outputs/study-manager-rosters/study-manager-roster-template.xlsx` to create
one workbook per consortium. Fill in the `Roster` sheet with one row per
manager/study pair. Keep the header row: `Consortium`, `Name`, `Email`,
`Study Acronym`, `Study Name`, `Active`. Repeat rows for additional studies or
contacts; there is no three-study limit. `Active` may be `Yes`, `No`, or blank
(blank means active). Blank rows are ignored. The `Instructions` tab contains
examples and field guidance.

Upload each completed workbook to Box and set its numeric **file ID**, as a
string, in `src/studyRosterConfig.js`. Placeholders are provided for C-NCI,
AABCG, BCAC, CIMBA, LAGENO, and MERGE. Keep existing study acronyms when migrating
so studies continue to match their existing Opt-In/Out assignments. The workbook
consortium must match its configuration entry.

A configured roster supplies PI study assignments, administrator/Data Manager
study contacts, round initiation, and chair-status publishing. Active rows replace
that consortium's roster; an empty roster has no active contacts or studies.
Users loading the rosters need permission to read the Box files. PI lookup reads
all configured production rosters, so those users need read access to each of
them. These rosters do not assign consortium Data Manager or administrator roles.

Until IDs are provided, C-NCI retains the bundled
`src/data/DataPlatform-Out-in-out.xlsx`; other production consortia have no
roster contacts and retain their study-catalog fallback for round setup. TEST
continues to use its isolated local roster. A configured file that cannot be read
or validated produces an error rather than restoring old contacts. Rosters are
cached in memory for one minute; refresh the page to load changes immediately.
Upload a new Box version to the same file ID for future roster updates.
