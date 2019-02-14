const express = require("express");
const bodyParser = require("body-parser");

const { common } = require("./common.js");

let GameServer = function (ip, port, host) {
    this.game = { ip, port, host, players: [], stage: "wait" };
    let server = express();
    server.use(bodyParser.text());
    server.use(bodyParser.urlencoded({ extended: true }));
    server.all("/", (req, res) => {
        let request = common.json.parse(req.body, { action: "" });
        switch (request.action) {
            case "join": {
                // join
                break;
            }
        }
    });
    server.listen(this.game.port);
    this.server = server;
};
GameServer.prototype.addPlayer = function (player) {
    if (!(player instanceof Player)) return;
    this.game.players.push(player);
    this.updatePlayers();
};
GameServer.prototype.updatePlayers = function () {
    for (let player of this.players) {
        player.send({ action: "update", data: { players: this.players } });
    }
};
exports.GameServer = GameServer;

let Player = function (ip, port) {
    this.ip = ip;
    this.port = port;
};
Player.prototype.url = function () {
    return `http://${this.ip}:${this.port}`;
};
Player.prototype.send = function (content, listener) {
    common.http.post(this.url(), JSON.stringify(content), listener);
};