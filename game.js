// debug
let log = console.log;

const IP = require("ip");
const IPAddress = require("ip-address");
const DEVICE_IP = IP.address();
const express = require("express");
const bodyParser = require("body-parser");

const { common } = require("./common.js");
const HTTP = common.http;

// let IPv4 = function (ip) {
//     return ip.replace(/^(.+:)?(\d{1,3}(\.\d{1,3}){3})$/, "$2");
// };
// let IPPort = function (ip, port) {
//     return `http://${ip}:${port}`;
// };
// let sameIP = function (a, b) {
//     let p = /^(\w+:\/\/)?(::ffff:)?(\d{1,3}(\.\d{1,3}){3})(:\d{1,4})?(\/.+$)?/;
//     let r = "$3";
//     return a.replace(p, r) === b.replace(p, r);
// };

let GameServer = function (port, host) {
    this.port = port;
    this.url = HTTP.head(DEVICE_IP, this.port);
    this.host = host;
    this.players = [];
    this.stage = "wait";

    let server = express();
    server.use(bodyParser.text());
    server.use(bodyParser.urlencoded({ extended: true }));
    server.post("/join/", (req, res) => {
        let respond = content => res.send(JSON.stringify(content));
        let request = common.json.parse(req.body, { action: "" });
        log("kkk");
        respond(this.serveJoin(request));
    });
    server.all("/", (req, res) => {
        let respond = content => res.send(JSON.stringify(content));
        let request = common.json.parse(req.body, { action: "" });
        // let ip = new IPAdress.Address6(req.ip).to4().address;
        // log(ip);
        // respond(this.serve(request));
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
        HTTP.post(player.url, JSON.stringify(content));
    }
};
// GameServer.prototype.serve = function (request) {
//     switch (request.action) {
//         case "join":
//             return this.serveJoin(request);
//     }
// };
GameServer.prototype.serveJoin = function (request) {
    let success = this.addPlayer(request.player);
    if (!success) {
        return { result: "rejected" };
    }
    return {
        result: "joined",
        game: {
            url: this.url,
            host: this.host,
            stage: this.stage,
            players: this.players
        }
    };
};
exports.GameServer = GameServer;

let GameClient = function (port, name = "Noname") {
    this.me = { url: HTTP.head(DEVICE_IP, port), name };
    this.game = {
        joined: false,
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
GameClient.prototype.join = function (url, onJoined = () => null, onRejected = () => null) {
    let content = { player: this.me };
    let client = this;
    HTTP.post(HTTP.url(url, "join"), content, function () {
        if (HTTP.ready(this)) {
            let response = common.json.parse(this.responseText, {});
            if (response.result === "rejected") {
                onRejected();
            } else if (response.result === "joined") {
                for (let key in response.game) {
                    client.game[key] = response.game[key];
                }
                client.game.joined = true;
                onJoined();
            }
        }
    });
};
GameClient.prototype.updateNote = function (note) {
    let content = { action: "update", data: { note } };
    for (let player of this.game.players) {
        if (player.url === this.me.url) continue;
        HTTP.post(player.url, content);
    }
};
exports.GameClient = GameClient;