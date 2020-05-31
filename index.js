const express = require('express');
const chalk = require('chalk');
const morgan = require('morgan');
const debug = require('debug')('Strangler');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');

const app = express();
// Set up middleware
app.use(morgan('tiny'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: 'jack the ripper' }));

app.set('view engine', 'ejs');
app.set('views', './src/views');
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/jquery/dist')));

const authRoutes = require('./src/routes/authRoutes');

const port = process.env.PORT || 3000;

// Set up routes
app.use('/', authRoutes());


app.listen(port, () => {
    debug(`Listening on port ${chalk.cyanBright(port)}`);
});