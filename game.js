// debug
let log = console.log;

const IP = require("ip");
const express = require("express");
const bodyParser = require("body-parser");

const { common } = require("./common.js");

let IPPort = function (ip, port) {
    return `http://${ip}:${port}`;
};

let GameServer = function (port, host) {
    this.port = port;
    this.url = IPPort(IP.address(), this.port);
    this.host = host;
    this.players = [];
    this.stage = "wait";

    let server = express();
    server.use(bodyParser.text());
    server.use(bodyParser.urlencoded({ extended: true }));
    server.all("/", (req, res) => {
        let respond = content => res.send(JSON.stringify(content));
        let request = common.json.parse(req.body, { action: "" });
        respond(this.serve(request));
    });
    server.listen(this.port);
    this.server = server;
};
GameServer.prototype.addPlayer = function (player) {
    for (let any of this.players) {
        if (player.url === any.url) {
            return false;
        }
    }
    player.number = this.players.length;
    this.players.push(player);
    this.updatePlayers();
    return true;
};
GameServer.prototype.updatePlayers = function () {
    for (let player of this.players) {
        let content = { action: "update", data: { players: this.players } };
        common.http.post(player.url, JSON.stringify(content));
    }
};
GameServer.prototype.serve = function (request) {
    switch (request.action) {
        case "join":
            return this.serveJoin(request);
    }
};
GameServer.prototype.serveJoin = function (request) {
    let success = this.addPlayer({ url: request.url });
    if (!success) {
        return { result: "rejected" };
    }
    return {
        result: "joined",
        url: this.url
    };
};
exports.GameServer = GameServer;

let GameClient = function (port) {
    this.url = IPPort(IP.address(), port);
    this.name = "Jack";
    this.game = {
        players: []
    };

    let client = express();
    client.use(bodyParser.text());
    client.use(bodyParser.urlencoded({ extended: true }));
    client.all("/", (req, res) => {
        let respond = content => res.send(JSON.stringify(content));
        let request = common.json.parse(req.body, { action: "" });
        switch (request.action) {
            case "update": {
                let data = request.data;
                for (let datum in data) {
                    switch (datum) {
                        case "players": {
                            this.game.players = data.players;
                            break;
                        }
                    }
                }
                break;
            }
        }
    });
    client.listen(port);
    this.client = client;
};
GameClient.prototype.join = function (url) {
    let content = { action: "join", url: this.url };
    let client = this;
    common.http.post(url, content, function () {
        if (common.http.ready(this)) {
            let response = common.json.parse(this.responseText, {});
            if (response.result === "rejected") {
                //
            } else if (response.result === "joined") {
                client.game.url = response.url;
            }
        }
    });
};
exports.GameClient = GameClient;