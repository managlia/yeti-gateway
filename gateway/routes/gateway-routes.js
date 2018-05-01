const Router = require('router');
const fileOrchestrator = require('../file-orchestration/file-orchestrator');
const commsOrchestrator = require('../comms-orchestration/comms-orchestrator');

const opts = {mergeParams: true};
const router = new Router(opts);

const yetio = new Router(opts);
router.use(`/yetio/`, yetio);

yetio.get(`/files`, (req, res) => fileOrchestrator.getAllFiles(req, res));

yetio.get(`/comms`, (req, res) => commsOrchestrator.getAllComms(req, res));

module.exports = router;

