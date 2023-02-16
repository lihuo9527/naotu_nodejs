const history = require("connect-history-api-fallback");
const express = require('express');
const https = require('https');
const http = require('http');
const app = express();
var fs = require('fs');
app.use('/', history());
app.use(express.static("./www"));
const port = 666;
var privateCrt = fs.readFileSync('./certificate/private.pem', 'utf8');
var privateKey = fs.readFileSync('./certificate/server.key', 'utf8');
const HTTPS_OPTOIN = {
  key: privateKey,
  cert: privateCrt
};
let server2 = http.createServer(app);
let server = https.createServer(HTTPS_OPTOIN, app);
server2.listen(80, () => {
  console.log(`app listening on port ${80}`)
})
server.listen(port, () => {
  console.log(`app listening on port ${port}`)
})