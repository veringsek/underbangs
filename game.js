// debug
let log = console.log;

const IP = require("ip");
const IPAddress = require("ip-address");
const DEVICE_IP = IP.address();
const express = require("express");
const bodyParser = require("body-parser");

const { common } = require("./common.js");
const HTTP = common.http;

let parseRequest = function (req, init = {}) {
    return common.json.parse(req.body, init);
};
let respond = function (res, content) {
    res.send(JSON.stringify(content));
};

/**
 * GameServer
 * @param {Number} port the port for game server to listen
 * @param {string} host the game host's url
 */
let GameServer = function (port, host) {
    this.port = port;
    this.url = HTTP.head(DEVICE_IP, this.port);
    this.host = host;
    this.players = [];
    this.stage = "wait";

    let server = express();
    server.use(bodyParser.text());
    server.use(bodyParser.urlencoded({ extended: true }));
    server.post("/control", (req, res) => {
        let request = parseRequest(req, {});
        log(request)
        switch (request.command) {
            case "next": {
                this.setStage("start");
                break;
            }
        }
    });
    server.post("/join", (req, res) => {
        let request = parseRequest(req, {});
        respond(res, this.serveJoin(request));
    });
    server.all("/", (req, res) => {
        // let ip = new IPAdress.Address6(req.ip).to4().address;
        // log(ip);
        // respond(this.serve(request));
    });
    server.listen(this.port);
    this.server = server;
};
GameServer.prototype.broadcast = function (content = "", path = [], params = {}) {
    for (let player of this.players) {
        HTTP.post(HTTP.url(player.url, path, params), content);
    }
};
GameServer.prototype.setStage = function (stage) {
    this.stage = stage;
    this.broadcast({ stage }, "update", { target: "stage" });
};
GameServer.prototype.addPlayer = function (player) {
    log(player);
    for (let any of this.players) {
        if (player.url === any.url) {
            return -1;// or rejoin?
        }
    }
    player.number = this.players.length;
    this.players.push(player);
    this.updatePlayers();
    return player.number;
};
GameServer.prototype.updatePlayers = function () {
    for (let player of this.players) {
        let content = { players: this.players };
        HTTP.post(HTTP.url(player.url, "update", { target: "players" }), content);
    }
};
GameServer.prototype.serveJoin = function (request) {
    let menumber = this.addPlayer(request.player);
    if (menumber < 0) {
        return { result: "rejected" };
    }
    return {
        result: "joined",
        url: this.url,
        host: this.host,
        stage: this.stage,
        menumber
    };
};
exports.GameServer = GameServer;

/**
 * GameClient
 * @param {int} port the port for game client to listen
 * @param {string} name player's name
 */
let GameClient = function (port, name = "Noname") {
    this.me = { url: HTTP.head(DEVICE_IP, port), name };
    this.game = {
        url: "",
        host: "",
        stage: "",
        joined: false,
        players: [],
        questions: []
    };

    let client = express();
    client.use(bodyParser.text());
    client.use(bodyParser.urlencoded({ extended: true }));
    client.post("/update", (req, res) => {
        let respond = content => res.send(JSON.stringify(content));
        let request = common.json.parse(req.body, {});
        let target = req.query.target;
        switch (target) {
            case "players": {
                // temp method
                this.game.questions = [];
                for (let player of request.players) {
                    this.game.questions.push({ note: "" });
                }
                this.game.players = request.players;
                break;
            }
            case "stage": {
                this.game.stage = request.stage;
                break;
            }
            case "note": {
                let question = this.game.questions[req.query.playernumber];
                question.note = request.note;
                break;
            }
        }
    });
    client.all("/", (req, res) => {
        let respond = content => res.send(JSON.stringify(content));
        let request = common.json.parse(req.body, {});
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
                // for (let key in response.game) {
                //     client.game[key] = response.game[key];
                // }
                client.game.url = response.url;
                client.game.host = response.host;
                client.game.stage = response.stage;
                client.game.menumber = response.menumber;
                client.game.joined = true;
                onJoined();
            }
        }
    });
};
GameClient.prototype.controlServerNext = function () {
    if (!this.game.joined) return false;
    HTTP.post(HTTP.url(this.game.url, "control"), { command: "next" });
};
GameClient.prototype.updateNote = function (note) {
    let content = { note };
    for (let player of this.game.players) {
        if (player.url === this.me.url) continue;
        HTTP.post(HTTP.url(player.url, "update", {
            target: "note", playernumber: this.game.menumber
        }), content);
    }
};
exports.GameClient = GameClient;