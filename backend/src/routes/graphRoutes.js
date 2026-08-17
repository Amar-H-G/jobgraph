const router = require('express').Router();
const ctrl   = require('../controllers/graphController');

router.get('/:candidateId', ctrl.getGraphData);

module.exports = router;
