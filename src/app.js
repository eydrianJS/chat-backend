const express = require('express');
const http = require('http');
const path = require('path');
const app = express();
const server = http.createServer(app);
const router = express.Router();
const bodyParser = require('body-parser');

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/', router);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  next();
});

exports.app = app;
exports.server = server;
exports.router = router;
