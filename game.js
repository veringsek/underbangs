// debug
let log = console.log;

const express = require("express");
const bodyParser = require("body-parser");

const { common } = require("./common.js");

// JSON.from = function (text, init = {}, reviver) {
//     try {
//         return JSON.parse(text, reviver);
//     } catch (ex) {
//         return init;
//     }
// };

let IPv4 = function (ip) {
    return ip.replace(/^(.+:)?(\d{1,3}(\.\d{1,3}){3})$/, "$2");
};

let GameServer = function (ip, port, host) {
    // this.game = { ip, port, host, players: [], stage: "wait" };
    this.ip = ip;
    this.port = port;
    this.host = host;
    this.players = [];
    this.stage = "wait";

    let server = express();
    server.use(bodyParser.text());
    server.use(bodyParser.urlencoded({ extended: true }));
    server.all("/", (req, res) => {
        let respond = content => res.send(JSON.stringify(content));
        let request = common.json.parse(req.body, { action: "" });
        switch (request.action) {
            case "join": {
                let success = this.addPlayer(new Player(IPv4(req.ip), request.port));
                if (!success) {
                    respond({ result: "rejected" });
                    break;
                }
                respond({ result: "joined" });
                break;
            }
        }
    });
    server.listen(this.port);
    this.server = server;
};
GameServer.prototype.addPlayer = function (player) {
    if (!(player instanceof Player)) return false;
    for (let any of this.players) {
        if (player.equals(any)) {
            return false;
        }
    }
    this.players.push(player);
    this.updatePlayers();
    return true;
};
GameServer.prototype.updatePlayers = function () {
    for (let player of this.players) {
        player.send({ action: "update", data: { players: this.players } });
    }
};
exports.GameServer = GameServer;

let GameClient = function (ip, port) {
    this.ip = ip;
    this.port = port;
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
                for (let datum in request.data) {
                    switch (datum) {
                        case "players": {
                            this.game.players = [];
                            for (let player of request.data.players) {
                                this.game.players.push(new Player(player.ip, player.port));
                            }
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
GameClient.prototype.join = function (ip, port) {
    let content = { action: "join", port: this.port };
    common.http.post(`http://${ip}:${port}`, content, function () {
        if (common.http.ready(this)) {
            let response = common.json.parse(this.responseText, {});
            if (response.result === "rejected") {
                //
            }
        }
    });
};
exports.GameClient = GameClient;

let Player = function (ip, port = "80") {
    this.ip = ip;
    this.port = port;
    this.url = `http://${this.ip}:${this.port}`;
};
Player.prototype.equals = function (player) {
    if (!(player instanceof Player)) {
        return false;
    }
    return this.ip === player.ip && this.port === player.port;
};
Player.prototype.send = function (content, listener) {
    common.http.post(this.url, JSON.stringify(content), listener);
};
exports.Player = Player;