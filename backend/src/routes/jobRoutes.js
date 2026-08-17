const router = require('express').Router();
const ctrl   = require('../controllers/jobController');

router.get('/',                      ctrl.searchJobs);
router.get('/:id',                   ctrl.getJob);
router.get('/:id/match/:candidateId', ctrl.getJobMatch);
router.get('/:id/related',           ctrl.getRelatedJobs);

module.exports = router;
