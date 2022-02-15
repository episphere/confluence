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
    const fileData = await getFile(898401838283);
    const jsonData = csv2Json(fileData).data;
    let requiredFormat = {};
    
    let previousId = '';
    jsonData.forEach(obj => {
        if(obj.Id && requiredFormat[obj.Id] === undefined) {
            requiredFormat[obj.Id] = {};
            previousId = obj.Id
        }
        let eventObj = {}
        if(requiredFormat[previousId].events === undefined) requiredFormat[previousId].events = [];
        requiredFormat[previousId].id = previousId;
        if(obj.meetingTitle) requiredFormat[previousId].meetingTitle = obj.meetingTitle;
        if(obj.meetingDate) requiredFormat[previousId].meetingDate = obj.meetingDate;
        if(obj.meetingTime) requiredFormat[previousId].meetingTime = obj.meetingTime;
        if(obj.event) eventObj.title = obj.event;
        if(obj.presenter) eventObj.presenter = obj.presenter;
        if(obj.eventTime) eventObj.time = obj.eventTime;
        if(obj.fileIdVideos) eventObj.fileId1 = obj.fileIdVideos;
        if(obj.fileIdSlides) eventObj.fileId2 = obj.fileIdSlides;
        if(obj.fileIdChats) eventObj.fileId3 = obj.fileIdChats;
        if(obj.affiliation) eventObj.affiliation = obj.affiliation;
        if(obj.fileName) eventObj.fileName = obj.fileName;
        requiredFormat[previousId].events.push(eventObj)
    })
    requiredFormat = Object.values(requiredFormat);
    // const array = folderItems.entries;
    let template = `
        <div class="row pt-md-3 pb-md-3 m-0 align-left div-sticky">
            <div class="col-md-11">
                <div class="row">
                    <div class="col-md-4 font-bold">Meeting title</div>
                    <div class="col-md-2 font-bold">Meeting date</div>
                    <div class="col-md-6 font-bold">Meeting Purpose</div>
                </div>
            </div>
            <div class="ml-auto"></div>
        </div>
        <div class="row m-0 align-left allow-overflow w-100">
        `
        requiredFormat.forEach((meetings, index) => {
            template += `
                        <div class="card border-0 mt-1 mb-1 align-left w-100 pt-md-1">
                            <div class="pl-3 pt-1 pr-3 pb-1" aria-expanded="false" id="heading${meetings['id']}">
                                <div class="row">
                                    <div class="col-md-11">
                                        <div class="row">
                                            <div class="col-md-4">${meetings['meetingTitle'] ? meetings['meetingTitle'] : ''}</div>
                                            <div class="col-md-2">${meetings['meetingDate'] ? meetings['meetingDate'] : ''}</div>
                                            <div class="col-md-6">${meetings['meetingTime'] ? meetings['meetingTime'] : ''}</div>
                                        </div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="col-md-12"><button title="Expand/Collapse" class="transparent-btn collapse-panel-btn" data-toggle="collapse" data-target="#study${meetings['id']}"><i class="fas fa-caret-down fa-2x"></i></button></div>
                                        </div>
                                    </div>
                                </div>
                            <div id="study${meetings['id']}" class="collapse" aria-labelledby="heading${meetings['id']}">
                            `
                            template +=`<div class="card-body pl-3 pr-3" style="padding-left: 10px;background-color:#f6f6f6;">
                                <div class="row mb-3">
                                    <div class="col-md-5 font-bold"></div>
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
                        <div class="col-md-1 p-0 align-center">${event['fileId1'] ? `<button class="btn btn-sm custom-btn preview-file" data-file-id="${event['fileId1']}" aria-label="Preview File"  data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluencePreviewerModal"><i class="fas fa-external-link-alt"></i> Preview</button></br>`: ``}</div>
                        <div class="col-md-1 p-0 align-center">${event['fileId2'] ? `<button class="btn btn-sm custom-btn preview-file" data-file-id="${event['fileId2']}" aria-label="Preview File"  data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluencePreviewerModal"><i class="fas fa-external-link-alt"></i> Preview</button></br>`: ``}</div>
                        <div class="col-md-1 p-0 align-center">${event['fileId3'] ? `<button class="btn btn-sm custom-btn preview-file" data-file-id="${event['fileId3']}" aria-label="Preview File"  data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#confluencePreviewerModal"><i class="fas fa-external-link-alt"></i> Preview</button></br>`: ``}</div>
                    </div>`
            })
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