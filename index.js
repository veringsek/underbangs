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
let post = (ip, port, content, listener) => {
    return common.http.post(`http://${ip}:${port}`, JSON.stringify(content), listener);
};
let serve = function (port, listens) {
    let server = express();
    server.use(bodyParser.text());
    server.use(bodyParser.urlencoded({ extended: true }));
    if (typeof listens === "function") {
        listens = { "/": listens };
    }
    for (let route in listens) {
        server.all(route, listens[route]);
    }
    server.listen(port);
    return server;
};
let hostgame = (port = PORT_SERVER) => {
    gameserver = new GameServer(IP.address(), port, gameclient.ip);
    // game = {
    //     ip: IP.address(),
    //     port: port,
    //     host: me.ip,
    //     players: [],
    //     stage: "wait"
    // };
    // server = serve(game.port, {
    //     "/": (req, res) => {
    //         log(req);
    //         res.send(game.stage);
    //     }
    // });

    gameclient.join(gameserver.ip, gameserver.port);
    // join(game.ip, game.port);
};
let join = (ip, port = PORT_SERVER) => {
    post(ip, port, { action: "join" }, function () {
        if (common.http.ready(this)) {
            let response = common.json.parse(this.responseText, {});
            lobby.players = response.players;
        }
    });
};
let ingame = (ip, port) => {
    lobby.ip = ip;
    lobby.port = port;
};

// Variables
let gameclient = new GameClient(IP.address(), PORT_CLIENT);
// let me = {
//     ip: IP.address(),
//     port: PORT_CLIENT,
//     name: "unknown-player"
// };
// let client = serve(me.port, (req, res) => {
//     // res.send(`im player ${me.name}`);
//     let request = common.json.parse(req.body, { action: "" });
//     switch (request.action) {
//         case "update": {
//             for (let key in request.data) {
//                 lobby[key] = request.data[key];
//             }
//             break;
//         }
//     }
// });
// let lobby = {}; // info about the game we joined

// debug
hostgame();