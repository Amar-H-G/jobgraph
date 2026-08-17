const router = require('express').Router();
const ctrl   = require('../controllers/candidateController');

router.get('/:id',               ctrl.getCandidate);
router.get('/:id/jobs/direct',   ctrl.getDirectJobs);
router.get('/:id/jobs/extended', ctrl.getExtendedJobs);
router.get('/:id/companies',     ctrl.getCompanies);

module.exports = router;
