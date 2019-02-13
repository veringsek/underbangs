// debug
let log = console.log;

// Node Dependencies
const IP = require("ip");
const express = require("express");

// Imports
const { common } = require("./common.js");

// Constants
const PORT_SERVER = 9487;
const PORT_CLIENT = 9488;

// Methods
let post = (ip, port, content, listener) => {
    log(`http://${ip}:${port}`);
    return common.http.post(`http://${ip}:${port}`, content, listener);
};
let serve = function (port, listens) {
    handler = express();
    if (typeof listens === "function") {
        listens = { "/": listens };
    }
    for (let route in listens) {
        handler.all(route, listens[route]);
    }
    handler.listen(port);
    return handler;
};
let join = (ip, port = PORT_SERVER) => {
    post(ip, port, "ggg", function () {
        log(this.status);
        log(this.responseText);
    })

    lobby.ip = ip;
    lobby.port = port;
};
let hostgame = (port = PORT_SERVER) => {
    game = {
        ip: IP.address(),
        port: port,
        host: me.ip,
        stage: "wait"
    };
    server = serve(game.port, {
        "/": (req, res) => {
            console.log(req);
            res.send(`kkk`);
        }
    });

    join(game.ip, game.port);
};

// Variables
let me = {
    ip: IP.address(),
    port: PORT_CLIENT,
    name: "unknown-player"
};
let client = serve(me.port, (req, res) => {
    res.send(`im player ${me.name}`);
});
let lobby = {}; // info about the game we joined