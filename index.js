const IP = require("ip");
const express = require("express");

const PORT_SERVER = 9487;
const PORT_CLIENT = 9488;

let serve = function (port, gets) {
    handler = express();
    if (typeof gets === "function") {
        gets = { "/": gets };
    }
    for (let route in gets) {
        handler.get(route, gets[route]);
    }
    handler.listen(port);
    return handler;
};

let me = {
    ip: IP.address(),
    port: PORT_CLIENT,
    name: "unknown-player"
};
let client = serve(me.port, (req, res) => {
    res.send(`im player ${me.name}`);
});
let lobby = {}; // info about the game we joined

let join = (ip, port = PORT_SERVER) => {
    lobby.ip = ip;
    lobby.port = port;
};

let host = (port = PORT_SERVER) => {
    game = {
        ip: IP.address(),
        port: port,
        host: me.ip,
        stage: "wait"
    };
    server = serve(game.port, {
        "/": (req, res) => {
            res.send(`kkk`);
        }
    });

    join(game.ip, game.port);
};