const http = require('http');
const parseUrl = require('parseurl');
const Orchestrator = require('orchestrator');
const rp = require('request-promise');
const _ = require('lodash');

const orchestrator = new Orchestrator();

let entityUrls = [
    { entityType: 'action', url: 'http://localhost:8081/yeti/ActionBatch', appended: false, payload: null },
    { entityType: 'campaign', url: 'http://localhost:8081/yeti/CampaignBatch', appended: false, payload: null },
    { entityType: 'company', url: 'http://localhost:8081/yeti/CompanyBatch', appended: false, payload: null },
    { entityType: 'contact', url: 'http://localhost:8081/yeti/ContactBatch', appended: false, payload: null }
];

const distill = (file) => {
    console.log( `xxxxxxxx dfm xxxxxxxx in distill with ${file.entityType}:${file.entityId}`);
    const currentO = entityUrls.filter( e => e.entityType === file.entityType, 1)[0];
    let currentURL = currentO.url;
    let starter = '?id=';
    if (currentO.appended) {
        starter = '&id=';
    }
    currentO.appended = true;
    currentO.url = currentURL + starter + file.entityId;
};

const getUploaderUrl = (uploaders) => {
    let traversed = false;
    let uploaderUrl = 'http://localhost:8081/yeti/ContactBatch';
    uploaders.map( e => {
        const appendage = (traversed ? '&id=' : '?id=' ) + e;
        uploaderUrl = uploaderUrl + appendage;
        traversed = true;
    });
    return uploaderUrl;
};

const marryResults = (fd) => {
    console.log('entityUrls --> ')
    console.log('entityUrls --> fd ' + fd);
    console.log('entityUrls --> entityUrls ' + entityUrls);
    console.log('entityUrls --> ')
    const wholePayload = entityUrls.filter( e => e.entityType === fd.entityType, 1)[0].payload;
    if( wholePayload ) {
        const relevantRecordAsArray = wholePayload.filter( rr => rr.entityId === fd.entityId );
        if( relevantRecordAsArray && relevantRecordAsArray.length > 0 ) {
            const relevantRecord = relevantRecordAsArray[0].entityData;
            fd.entityData = relevantRecord;
        }
    }
    return fd;
};

const marryUploader = (filesData, contact) => {
    const subsetForContact = filesData.filter( e => e.uploaderId === contact.contactId );

    console.log('---> about to marry contact ' + contact.contactId + ' to ' + subsetForContact.length + ' records.');
    subsetForContact.map( e => e.uploaderData = contact );
};

const keyedUpData = (entityType, entity) => {
    let entityId;
    if( entityType === 'action' ) {
        entityId = entity.actionId;
    } else if( entityType === 'campaign' ) {
        entityId = entity.campaignId;
    } else if( entityType === 'company' ) {
        entityId = entity.companyId;
    } else if( entityType === 'contact' ) {
        entityId = entity.contactId;
    }
    return {
        entityId: entityId,
        entityData: entity
    };
};


const getAllFiles = (req, res) => {
    const url = 'http://localhost:5001/yetix/files';
    const options = {
        method: 'GET',
        uri: url,
        encoding: null,
        headers: req.headers,
        resolveWithFullResponse: true
    };

    rp(options).then( result => {
        let filesData = JSON.parse(result.body); // convert string to ojbect

        let entityData = filesData.map( e => {
            return {
                entityType: e.entityType,
                entityId: e.entityId
            }
        } );
        entityData = _.uniqWith(entityData, _.isEqual);

        entityData  = _.orderBy(entityData, ['entityType', 'entityId'], ['asc', 'asc']);
        entityData.map( e => console.log( 'dfm ====> ' + JSON.stringify(e) ) );
        entityData.map( e => distill(e) );

        const readyUrls = entityUrls.filter( e => e.appended );
        const readyTasks = readyUrls.map( e => e.entityType );
        orchestrator.add( 'allCalls', readyTasks, () => {
            console.log('calling all calls ' + readyTasks);
        });

        const uploaderMap = filesData.map( e => e.uploaderId ).filter((el, i, a) => i === a.indexOf(el));
        const uploaderUrl = getUploaderUrl(uploaderMap);
        orchestrator.add( 'uploaderCall', readyTasks, () => {
            console.log('want to identify the uploader ===> ' + uploaderUrl);

            const lOptions = {
                method: 'GET',
                uri: uploaderUrl,
                encoding: null,
                headers: req.headers,
                resolveWithFullResponse: true
            };
            return rp(lOptions).then( eResult => {
                JSON.parse(eResult.body).map( contact => marryUploader(filesData, contact) );
            });

        });

        readyUrls.map( e => {
            console.log( '=-=-=-=-=-=-=->>>>> ' + JSON.stringify(e) );
            orchestrator.add( e.entityType, () => {
                console.log('making call for ' + e.entityType);
                console.log('making call for ' + e.url);
                const lOptions = {
                    method: 'GET',
                    uri: e.url,
                    encoding: null,
                    headers: req.headers,
                    resolveWithFullResponse: true
                };
                console.log( 'loptions');
                console.log(  JSON.stringify(lOptions) );
                console.log( 'loptions');
                return rp(lOptions).then( eResult => {
                    e.payload = JSON.parse(eResult.body).map( entity => keyedUpData(e.entityType, entity) );
                    console.log( 'entity data ==> for ' + JSON.stringify(e.payload) );
                }).catch( err => {
                    console.log('what went wrong???'  + err);
                });
            });
        });
        orchestrator.start('allCalls', 'uploaderCall', (err) => {
            if(!err) {
                console.log('we are done: No err!');
                const marriedData = filesData.map( fd => marryResults(fd) ).filter( ud => (ud.entityData !== undefined) );


                marriedData.map( md => console.log('married data ' + md.entityId + ':' + md.entityType ));

                res.end( JSON.stringify(marriedData) );
                return res;
            } else {console.log( 'err occurred ' + JSON.stringify(err) );
            }
        });


    }, error => {
        console.log('ERROR::: ' + JSON.stringify(error));
    });
};

module.exports = {
    getAllFiles
};






