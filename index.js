const IP = require("ip");
const express = require("express");

const PORT_DEFAULT = 9487;

lobby = {};

let join = (ip, port = PORT_DEFAULT) => {
    lobby.ip = ip;
    lobby.port = port;
};

let host = (port = PORT_DEFAULT) => {
    lobby.ip = IP.address();
    lobby.port = port;
    let server = express();
    server.get(`/`, (req, res) => {
        res.send(`kkk`);
    });
    server.listen(lobby.port);
};