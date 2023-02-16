const express = require("express");
const https = require("https");
const { Server } = require("socket.io");
var fs = require('fs');
var { exec, sql, transaction } = require("./connect-db");

const app = express();

var privateCrt = fs.readFileSync('./certificate/private.pem', 'utf8');
var privateKey = fs.readFileSync('./certificate/server.key', 'utf8');
const HTTPS_OPTOIN = {
  key: privateKey,
  cert: privateCrt
};
let httpsServer = https.createServer(HTTPS_OPTOIN, app);

const io = new Server(httpsServer, {
    cors: {
        origin: '*'
    }
});
var rooms = [];
fetchRoom();
async function fetchRoom() {
    try {
        let data = await exec(sql.table('speciality').select());
        rooms = data.map((item) => (`${item.id}`));
    } catch (e) {
        console.log(e);
    }
}
io.on("connection", (socket) => {
    socket.on('login', (obj) => {
        socket.join(`${obj.specialityId}`);
    });
    socket.on('message', async (obj, callback) => {
        let date = new Date().getTime(); 
        try {
            let data = await exec(sql.table('chat').data({ userId: obj.userId, specialityId: obj.specialityId, time: date, profile: obj.profile, userName: obj.userName, content: obj.content, imageUrl: obj.image }).insert());
            if (data) {
                io.to(`${obj.specialityId}`).emit('data', {id:data.insertId, userId: obj.userId, time: date, profile: obj.profile, userName: obj.userName, content: obj.content, imageUrl: obj.image });
                callback("success");
            }
        } catch (e) {
            console.log(e);
        }
    });
});


httpsServer.listen(3000, () => {
    console.log(`socket listening on port 3000`)
});