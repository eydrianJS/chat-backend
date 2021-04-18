const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const app = express();
const server = http.createServer(app);

const bodyParser = require('body-parser');

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(cors());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  next();
});

exports.app = app;
exports.server = server;
