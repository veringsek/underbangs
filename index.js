// debug
let log = console.log;

// Node Dependencies
const IP = require("ip");
const express = require("express");
const bodyParser = require("body-parser");

// Imports
const { common } = require("./common.js");
const { GameServer, GameClient } = require("./game.js");

// Constants
const PORT_SERVER = 9487;
const PORT_CLIENT = 9488;

// Methods
// let post = (ip, port, content, listener) => {
//     return common.http.post(`http://${ip}:${port}`, JSON.stringify(content), listener);
// };
// let serve = function (port, listens) {
//     let server = express();
//     server.use(bodyParser.text());
//     server.use(bodyParser.urlencoded({ extended: true }));
//     if (typeof listens === "function") {
//         listens = { "/": listens };
//     }
//     for (let route in listens) {
//         server.all(route, listens[route]);
//     }
//     server.listen(port);
//     return server;
// };
let hostgame = (port = PORT_SERVER) => {
    gameserver = new GameServer(IP.address(), port, gameclient.ip);
    gameclient.join(gameserver.ip, gameserver.port);
};
// let join = (ip, port = PORT_SERVER) => {
//     post(ip, port, { action: "join" }, function () {
//         if (common.http.ready(this)) {
//             let response = common.json.parse(this.responseText, {});
//             lobby.players = response.players;
//         }
//     });
// };
let ingame = (ip, port) => {
    lobby.ip = ip;
    lobby.port = port;
};

// Variables
let gameclient = new GameClient(IP.address(), PORT_CLIENT);

// debug
hostgame();