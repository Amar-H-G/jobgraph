const graphService = require('../services/graphService');

async function getGraphData(req, res, next) {
  try {
    const data = await graphService.getGraphData(req.params.candidateId);
    res.json(data);
  } catch (err) { next(err); }
}

module.exports = { getGraphData };
