const debug = require('debug')('Strangler:authController');

const users = [{ name: 'Vijay', password: 'Password' },
{ name: 'Ramya', password: 'Elephants'},
{ name: 'Sanjay', password: 'Arreyee' }]

function authController() {
    function get(req, res) {        
        res.render('login');
    }

    return { get };
}

module.exports = authController;