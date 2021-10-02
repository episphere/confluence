export const config = {
    iniAppLocal: {
        client_id: '52zad6jrv5v52mn1hfy1vsjtr9jn5o1w',
        server_id: '2rHTqzJumz8s9bAjmKMV83WHX1ooN4kT',
        stateIni: Math.random().toString().slice(2)
    },
    iniAppStage: {
        client_id: 'zf023du1nwsm6h8pmqs6oyn9c72kk9kf',
        server_id: '8V6DoKy8yZTuh942CKyyQawSvh8NC19y',
        stateIni: Math.random().toString().slice(2)
    },
    iniAppProd: {
        client_id: '1n44fu5yu1l547f2n2fgcw7vhps7kvuw',
        server_id: '2ZYzmHXGyzBcjZ9d1Ttsc1d258LiGGVd',
        stateIni: Math.random().toString().slice(2)
    },
    EpiBoxFolderId: 6454654365,
    invalidVariables: ['bcac_id', 'bcac_db_version', 'onc_id', 'dataset_created_by', 'date_bcac_db_version_created', 'date_dataset_created', 'icogs_id']
}

export const boxRoles = {
    'Editor': 'Upload, download, preview, share, edit, and delete',
    'Viewer': 'Download, preview and share',
    'Uploader': 'Upload only'
}