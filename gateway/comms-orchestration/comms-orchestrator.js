const http = require('http');
const parseUrl = require('parseurl');
const Orchestrator = require('orchestrator');
const rp = require('request-promise');
const _ = require('lodash');


const getAllComms = (req, res) => {
    let memoData = [];
    console.log('orchestration started');
    const murl = 'http://localhost:5001/yetix/memos';
    const aurl = 'http://localhost:5001/yetix/announcements';
    const moptions = {
        method: 'GET',
        uri: murl,
        encoding: null,
        headers: req.headers,
        resolveWithFullResponse: true
    };
    const p1 = rp(moptions);
    // p1.then(e => {
    //     console.log('p1 e.body: ' + e.body);
    //     _.union(JSON.parse(e.body), memoData);
    // });

    const aoptions = {
        method: 'GET',
        uri: aurl,
        encoding: null,
        headers: req.headers,
        resolveWithFullResponse: true
    };
    const p2 = rp(aoptions);
    // p2.then(e => {
    //     console.log('p2 e.body: ' + e.body);
    //     _.union(JSON.parse(e.body), memoData);
    // });

    Promise.all([p1, p2]).then( values => {

        memoData = _.union(
            JSON.parse(values[0].body),
            JSON.parse(values[1].body)
        );

        console.log('memoData ');
        console.log('memoData ');
        console.log('memoData md ' + JSON.stringify(memoData));
        console.log('memoData ');
        console.log('memoData ');



        let allIds = [];
        memoData.map( e => {
            if (e.recipients) {
                allIds = _.concat(e.recipients, allIds);
            }
        });
        memoData.map( e => allIds.push(e.creatorId) );
        allIds = _.uniqWith(allIds, _.isEqual);
        allIds = _.orderBy(allIds);

        if( allIds && allIds.length > 0 ) {
            console.log('all ids: ' + allIds);
            const contactsUrl = getContactsUrl(allIds);
            console.log('contactsUrl ' + contactsUrl);

            const lOptions = {
                method: 'GET',
                uri: contactsUrl,
                encoding: null,
                headers: req.headers,
                resolveWithFullResponse: true
            };
            let recipientData = [];
            rp(lOptions).then( eResult => {
                console.log(' contacts::: ' + eResult.body);
                recipientData = JSON.parse(eResult.body);
                memoData = memoData.map( e => {
                    if(e.recipients) {
                        const filteredRecipients = recipientData.filter( j => e.recipients.includes(j.contactId) );
                        e.recipientDetails = filteredRecipients;
                    }
                    e.creatorDetails = recipientData.filter( j => j.contactId === e.creatorId, 1)[0];
                    console.log('e ---------> ' +  JSON.stringify(e));
                    return e;
                });
                console.log('memoData -----> ' + JSON.stringify(memoData));
                res.end( JSON.stringify(memoData) );
                return res;
            });
        } else {
            console.log('memoData -----> ' + JSON.stringify(memoData));
            res.end( JSON.stringify(memoData) );
            return res;
        }
    });
};

const getContactsUrl = (ids) => {
    let traversed = false;
    let uploaderUrl = 'http://localhost:8081/yeti/ContactBatch';
    ids.map( e => {
        const appendage = (traversed ? '&id=' : '?id=' ) + e;
        uploaderUrl = uploaderUrl + appendage;
        traversed = true;
    });
    return uploaderUrl;
};








module.exports = {
    getAllComms
};