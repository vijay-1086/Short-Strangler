const express = require('express');
const authController = require('../controllers/authController');

function router() {
    const authRouter = express.Router();
    const { get } = authController();

    authRouter.route('/').get(get);
    
    return authRouter;
}


module.exports = router;