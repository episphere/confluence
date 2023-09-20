import { csv2Json, filePreviewer, getFile, getFolderItems } from "../shared.js";
import { addEventToggleCollapsePanelBtn } from "./description.js";

export const confluenceEventsPage = () => {
    return `
        <div class="general-bg padding-bottom-1rem">
            <div class="container body-min-height">
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">Events</h1>
                    </div>
                </div>
                <div class="main-summary-row confluence-resources white-bg div-border font-size-18" id="eventsBody"></div>
                <div id="previewContainer" class="mt-3 h-100"></div>
            </div>
        </div>
    `;
}

export const eventsBody = async () => {
    // const folderItems = await getFolderItems(152649972823);
    const fileData = await getFile(1311693698300);
    const jsonData = csv2Json(fileData).data;
    let requiredFormat = {};
    
    let previousId = '';
    let previousMT = '';
    jsonData.forEach(obj => {

        if(obj.meetingType && requiredFormat[obj.meetingType] === undefined) {
            requiredFormat[obj.meetingType] = {};
            previousMT = obj.meetingType;
        }

        if(requiredFormat[previousMT].events === undefined) requiredFormat[previousMT].events = [];
        requiredFormat[previousMT].id = previousMT;

        if(obj.Id && requiredFormat[previousMT].events[obj.Id] === undefined) {
            requiredFormat[previousMT].events[obj.Id] = {};
            previousId = obj.Id;
        }
        
        let eventObj = {}
        // if(requiredFormat[previousMT].event === undefined) requiredFormat[previousMT].event = [];
        // requiredFormat[previousMT].id = previousMT;

        if(requiredFormat[previousMT].events[previousId].events === undefined) requiredFormat[previousMT].events[previousId].events = [];
        requiredFormat[previousMT].events[previousId].id = previousId;
        // if(requiredFormat[previousId].events === undefined) requiredFormat[previousId].events = [];
        // requiredFormat[previousId].id = previousId;

        if(obj.meetingTitle) requiredFormat[previousMT].events[previousId].meetingTitle = obj.meetingTitle;
        if(obj.meetingDate) requiredFormat[previousMT].events[previousId].meetingDate = obj.meetingDate;
        if(obj.meetingTime) requiredFormat[previousMT].events[previousId].meetingTime = obj.meetingTime;
        if(obj.event) eventObj.title = obj.event;
        if(obj.presenter) eventObj.presenter = obj.presenter;
        if(obj.eventTime) eventObj.time = obj.eventTime;
        if(obj.fileIdVideos) eventObj.fileId1 = obj.fileIdVideos;
        if(obj.fileIdSlides) eventObj.fileId2 = obj.fileIdSlides;
        if(obj.fileIdChats) eventObj.fileId3 = obj.fileIdChats;
        if(obj.affiliation) eventObj.affiliation = obj.affiliation;
        if(obj.fileName) eventObj.fileName = obj.fileName;
        requiredFormat[previousMT].events[previousId].events.push(eventObj)
    })
    requiredFormat = Object.values(requiredFormat);
    // const array = folderItems.entries;
    let template = `
        <div class="row pt-md-3 pb-md-3 m-0 align-left div-sticky">
            <div class="col-md-11">
                <div class="row">
                    <div class="col-md-10 font-bold">Meeting Type</div>
                </div>
            </div>
            <div class="ml-auto"></div>
        </div>
        <div class="row m-0 align-left allow-overflow w-100">
        `
        requiredFormat.forEach((type, index) => {
            template += `<div class="card border-0 mt-1 mb-1 align-left w-100 pt-md-1">
                <div class="pl-3 pt-1 pr-3 pb-1" aria-expanded="false" id="heading${type['id'].split(" ").join("")}">
                    <div class="row">
                        <div class="col-md-11">
                            <div class="row">
                                <div class="col-md-4">${type['id'] ? type['id'] : ''}</div>
                            </div>
                        </div>
                        <div class="ml-auto">
                            <div class="col-md-12"><button title="Expand/Collapse" class="transparent-btn collapse-panel-btn" data-toggle="collapse" data-target="#study${type['id'].split(" ").join("")}"><i class="fas fa-caret-down fa-2x"></i></button></div>
                            </div>
                        </div>
                    </div>
                    <div id="study${type['id'].split(" ").join("")}" class="collapse" aria-labelledby="heading${type['id'].split(" ").join("")}">
                        <div class="card-body pl-3 pr-3" style="padding-left: 10px;background-color:#F5F5F5;">
                            <div class="col-md-11">
                                <div class="row">
                                    <div class="col-md-4 font-bold">Meeting Title</div>
                                    <div class="col-md-2 font-bold">Meeting Date</div>
                                    <div class="col-md-6 font-bold">Meeting Purpose</div>
                                </div>
                            </div>
                `
        type.events.forEach((meetings, index) => {
            template += `
                        <div class="card-body border-0 mt-1 mb-1 align-left w-100 pt-md-1; background-color:#F5F5F5;">
                            <div class="pl-3 pt-1 pr-3 pb-1" aria-expanded="false" id="heading${meetings['id']}">
                                <div class="row">
                                    <div class="col-md-11">
                                        <div class="row">
                                            <div class="col-md-4 border-bottom">${meetings['meetingTitle'] ? meetings['meetingTitle'] : ''}</div>
                                            <div class="col-md-2 border-bottom">${meetings['meetingDate'] ? meetings['meetingDate'] : ''}</div>
                                            <div class="col-md-6 border-bottom">${meetings['meetingTime'] ? meetings['meetingTime'] : ''}</div>
                                        </div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="col-md-12"><button title="Expand/Collapse" class="transparent-btn collapse-panel-btn" data-toggle="collapse" data-target="#study${meetings['id']}"><i class="fas fa-caret-down fa-2x"></i></button></div>
                                        </div>
                                    </div>
                                </div>
                            <div id="study${meetings['id']}" class="collapse" aria-labelledby="heading${meetings['id']}">
                            `
                            template +=`
                            <div class="card-body pl-3 pr-3" style="padding-left: 10px;background-color:#E8E8E8;">
                                <div class="row mb-3">
                                    <div class="col-md-5 font-bold">Scientific Presentations</div>
                                    <div class="col-md-2 font-bold">Presenter</div>
                                    <div class="col-md-2 font-bold">Affiliation</div>
                                    <div class="col-md-1 font-bold p-0 align-center">Recording</div>
                                    <div class="col-md-1 font-bold p-0 align-center">Slides</div>
                                    <div class="col-md-1 font-bold p-0 align-center">Chat</div>
                                </div>`
            meetings.events.forEach(event => {
                template += `
                    <div class="row">
                        <div class="col-md-5 mt-1 border-bottom">${event['title'] ? `${event['title']}`: ``}</div>
                        <div class="col-md-2 border-bottom">${event['presenter'] ? `${event['presenter']}`: ``}</div>
                        <div class="col-md-2 border-bottom">${event['affiliation'] ? `${event['affiliation']}`: ``}</div>
                        <div class="col-md-1 p-0 align-center border-bottom">${event['fileId1'] ? `<button class="btn btn-sm custom-btn preview-file" data-file-id="${event['fileId1']}" aria-label="Preview File"  data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluencePreviewerModal"><i class="fas fa-external-link-alt"></i> Preview</button></br>`: ``}</div>
                        <div class="col-md-1 p-0 align-center border-bottom">${event['fileId2'] ? `<button class="btn btn-sm custom-btn preview-file" data-file-id="${event['fileId2']}" aria-label="Preview File"  data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluencePreviewerModal"><i class="fas fa-external-link-alt"></i> Preview</button></br>`: ``}</div>
                        <div class="col-md-1 p-0 align-center border-bottom">${event['fileId3'] ? `<button class="btn btn-sm custom-btn preview-file" data-file-id="${event['fileId3']}" aria-label="Preview File"  data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluencePreviewerModal"><i class="fas fa-external-link-alt"></i> Preview</button></br>`: ``}</div>
                    </div>`
            })
            template += `</div></div></div>`
            
        });
        template += `</div></div></div>`
    });
        template += `</div>`;
    
    document.getElementById('eventsBody').innerHTML = template;
    addEventPreviewFile();
    addEventToggleCollapsePanelBtn();
}

const addEventPreviewFile = () => {
    const btns = Array.from(document.querySelectorAll('.preview-file'));
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const header = document.getElementById('confluencePreviewerModalHeader');
            const body = document.getElementById('confluencePreviewerModalBody');
            header.innerHTML = `<h5 class="modal-title">File preview</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>`;
            const fileId = btn.dataset.fileId;
            filePreviewer(fileId, '#confluencePreviewerModalBody');
        })
    })
}