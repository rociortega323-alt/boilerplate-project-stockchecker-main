'use strict';

require('dotenv').config();
const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
const helmet      = require('helmet');
const mongoose    = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("❌ Error de conexión MongoDB:", err));

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');

const app = express();

/*
  🚨 IMPORTANTE PARA FCC
  Debe permitirse SOLO 'self' para scripts y estilos,
  pero se debe permitir data: para imágenes inline del frontend
  y 'unsafe-inline' para estilos dentro del index.html de FCC.
*/
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"]
      },
    },
    // Evitar conflictos típicos en FCC
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false
  })
);

// Archivos estáticos
app.use('/public', express.static(process.cwd() + '/public'));

// CORS solo para las pruebas de FCC
app.use(cors({ origin: '*' }));

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Página principal
app.route('/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Rutas de pruebas FCC
fccTestingRoutes(app);

// Rutas de la API
apiRoutes(app);

// 404
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

// Servidor
let listener;
if (process.env.NODE_ENV !== 'test') {
  listener = app.listen(process.env.PORT || 3000, () => {
    console.log(
      'Servidor escuchando en puerto ' +
        (listener.address().port || process.env.PORT)
    );
  });
}

// Ejecutar pruebas
if (process.env.NODE_ENV === 'test') {
  console.log('Running Tests...');
  setTimeout(() => {
    try {
      runner.run();
    } catch (e) {
      console.log('Tests are not valid:');
      console.error(e);
    }
  }, 3500);
}

module.exports = app;
