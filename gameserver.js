const express = require("express");
const bodyParser = require("body-parser");

const { common } = require("./common.js");

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
        let respond = (content) => res.send(JSON.stringify(content));
        let request = common.json.parse(req.body, { action: "" });
        switch (request.action) {
            case "join": {
                let success = this.addPlayer(new Player(req.ip, request.port));
                if (!success) {
                    respond({ result: "rejected" });
                    break;
                }
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