'use strict';
require('dotenv').config();
const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
const helmet      = require('helmet');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch(err => console.error("Error de conexión MongoDB:", err));


const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');

const app = express();

// === Helmet CSP EXACTA para FreeCodeCamp ===
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
    },
  })
);

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); // FCC testing only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Index page
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

// FCC testing routes
fccTestingRoutes(app);

// API routes
apiRoutes(app);

// 404
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

// Start server + tests
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        console.log('Tests are not valid:');
        console.error(e);
      }
    }, 3500);
  }
});

module.exports = app; //for testing
