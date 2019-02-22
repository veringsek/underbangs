// debug
let log = console.log;

// Node
const IP = require("ip");
const IPAddress = require("ip-address");
const DEVICE_IP = IP.address();
const express = require("express");
const bodyParser = require("body-parser");

// Imports
const { common } = require("./common.js");
const HTTP = common.http;

let parseRequest = function (req, init = {}) {
    return common.json.parse(req.body, init);
};
let respond = function (res, content = {}) {
    res.send(JSON.stringify(content));
};
let IPv4 = function (string) {
    return new IPAddress.Address6(string).to4().address;
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
    this.tokens = [];
    this.stage = "wait";
    this.round = -1;
    this.askorder = "random";
    this.asktos = [];
    this.rankings = [];

    let server = express();
    server.use(bodyParser.text());
    server.use(bodyParser.urlencoded({ extended: true }));
    server.post("/control", (req, res) => {
        let request = parseRequest(req);
        if (request.token !== this.tokens[this.host]) {
            return respond(res, { error: "no-permission" });
        }
        switch (req.query.command) {
            case "askorder": {
                let orders = ["+1", "random"];
                let o = common.num.track(orders.indexOf(this.askorder) + 1, orders.length);
                this.setAskorder(orders[o]);
                break;
            }
            case "end": {
                this.stageEnd();
                break;
            }
            case "restart": {
                this.stageStart();
                break;
            }
        }
        respond(res);
    });
    server.post("/next", (req, res) => {
        let request = parseRequest(req);
        let success = this.nextStage(request.token);
        if (!success) {
            respond(res, { error: "rejected" });
        }
    });
    server.post("/join", (req, res) => {
        let request = parseRequest(req);
        respond(res, this.serveJoin(request, IPv4(req.ip)));
    });
    server.post("/ask", (req, res) => {
        let request = parseRequest(req);
        this.confirmAsked(request.number);
        respond(res);
    });
    server.post("/approve", (req, res) => {
        let request = parseRequest(req);
        let askto = request.askto;
        if (this.rankings.includes(askto)) {
            return respond(res, { error: "approved-already" });
        }
        let asker = this.asktos.indexOf(askto);
        if (this.tokens[asker] !== request.token) {
            return respond(res, { error: "no-permission" });
        }
        this.setRankings(this.rankings.concat(askto));
        respond(res, { result: "approved" });
    })
    server.listen(this.port);
    this.server = server;
};
GameServer.prototype.send = function (url, content, listener) {
    HTTP.post(url, content, listener);
};
GameServer.prototype.sendPlayer = function (player, path, params, content, listener) {
    this.send(HTTP.url(player.url, path, params), content, listener);
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
GameServer.prototype.setRound = function (round) {
    this.round = round;
    this.broadcast({ round }, "update", { target: "round" });
};
GameServer.prototype.setAskorder = function (askorder) {
    this.askorder = askorder;
    this.broadcast({ askorder }, "update", { target: "askorder" });
};
GameServer.prototype.setAsktos = function (asktos) {
    this.asktos = asktos;
    this.broadcast({ asktos }, "update", { target: "asktos" });
};
GameServer.prototype.setRankings = function (rankings) {
    this.rankings = rankings;
    this.broadcast({ rankings }, "update", { target: "rankings" });
};
GameServer.prototype.nextStage = function (token) {
    let nothost = token !== this.tokens[this.host];
    switch (this.stage) {
        case "wait": {
            if (nothost) return false;
            this.stageStart();
            break;
        }
        case "start": {
            if (nothost) return false;
            this.stageAsk();
            break;
        }
        case "round": {
            if (nothost && token !== this.tokens[this.round]) return false;
            let round = this.round += 1;
            if (this.round >= this.players.length) {
                round = 0;
            }
            this.setRound(round);
            break;
        }
        case "end": {
            if (nothost) return false;
            this.stageStart("start");
            break;
        }
    }
    return true;
};
GameServer.prototype.stageWait = function () {
    this.setStage("wait");
};
GameServer.prototype.stageStart = function () {
    this.setRound(-1);
    this.setAsktos([]);
    this.setRankings([]);
    for (let toplayer of this.players) {
        for (let player of this.players) {
            this.sendPlayer(player, "ask", {}, {
                to: toplayer.number,
                question: "???",
                link: "",
                image: ""
            });
        }
    }
    this.setStage("start");
};
GameServer.prototype.stageAsk = function () {
    let asktos = [];
    switch (this.askorder) {
        case "+1": {
            for (let player of this.players) {
                asktos.push(player.number);
            }
            asktos.push(asktos.splice(0, 1)[0]);
            break;
        }
        case "random": {
            if (this.players.length < 2) {
                asktos = [0];
                break;
            }
            let someoneAskSelf = () => {
                for (let q in asktos) {
                    if (parseInt(q) === parseInt(asktos[q])) return true;
                }
                return false;
            };
            let temp;
            for (let player of this.players) {
                asktos.push(player.number);
            }
            do {
                temp = asktos;
                asktos = [];
                while (temp.length > 0) {
                    let r = common.num.random(temp.length);
                    asktos.push(temp.splice(r, 1)[0]);
                }
            } while (someoneAskSelf());
            break;
        }
    }
    this.asked = this.players.map(() => false);
    this.setAsktos(asktos);
    this.setStage("ask");
};
GameServer.prototype.confirmAsked = function (number) {
    this.asked[number] = true;
    let done = true;
    for (let asked of this.asked) {
        if (!asked) {
            done = false;
            break;
        }
    }
    if (done) {
        this.stageRound(0);
    }
};
GameServer.prototype.stageRound = function (round) {
    this.setRound(round);
    if (this.stage !== "round") {
        this.setRankings([]);
        this.setStage("round");
    }
};
GameServer.prototype.stageEnd = function () {
    this.setRound(-1);
    this.setRankings(this.rankings);
    this.setStage("end");
};
GameServer.prototype.serveJoin = function (request, ip) {
    let player = request.player;
    player.ip = ip;
    player.url = HTTP.head(player.ip, player.port);
    let newjoin = true;
    let menumber = -1;
    for (let any of this.players) {
        if (player.url === any.url) {
            newjoin = false;
            menumber = any.number;
            // re-join is not ok 'cuz not all data are on server side (like questions)
        }
    }
    if (newjoin) {
        if (this.stage !== "wait") {
            return { joined: "rejected" };
        }
        this.tokens.push(common.num.random(1000, 9999));
        player.number = this.players.length;
        this.players.push(player);
        this.broadcast({ players: this.players }, "update", { target: "players" });
        menumber = player.number;
    }
    let joined = newjoin ? "joined" : "rejoined";
    let game = common.json.transcribe({ token: this.tokens[menumber], menumber }, this, [
        "url", "host", "stage", "round", "askorder"
    ]);
    return { joined, game };
};
exports.GameServer = GameServer;

/**
 * GameClient
 * @param {int} port the port for game client to listen
 * @param {string} name player's name
 */
let GameClient = function (port, name = "Noname") {
    this.me = { port, name };
    this.game = {
        token: null,
        url: "",
        host: "",
        stage: "",
        round: -1,
        askorder: "",
        asktos: [],
        askto: -1,
        rankings: [],
        joined: false,
        players: [],
        questions: []
    };

    let client = express();
    client.use(bodyParser.text());
    client.use(bodyParser.urlencoded({ extended: true }));
    client.post("/update", (req, res) => {
        let request = parseRequest(req, {});
        let target = req.query.target;
        switch (target) {
            case "players": {
                // temp method
                this.game.questions = [];
                for (let player of request.players) {
                    this.game.questions.push({
                        question: "???",
                        link: "",
                        image: "",
                        note: ""
                    });
                }
                this.game.players = request.players;
                break;
            }
            case "stage": {
                this.game.stage = request.stage;
                break;
            }
            case "round": {
                this.game.round = request.round;
                break;
            }
            case "askorder": {
                this.game.askorder = request.askorder;
                break;
            }
            case "asktos": {
                this.setAsktos(request.asktos);
                break;
            }
            case "rankings": {
                this.setRankings(request.rankings);
                break;
            }
            case "note": {
                let question = this.game.questions[req.query.playernumber];
                question.note = request.note;
                break;
            }
        }
        respond(res);
    });
    client.post("/ask", (req, res) => {
        let request = parseRequest(req);
        this.setQuestion(request.to, {
            question: request.question,
            link: request.link,
            image: request.image
        });
        respond(res);
    });
    client.listen(port);
    this.client = client;
};
GameClient.prototype.setAsktos = function (asktos) {
    this.game.asktos = asktos;
    this.game.askto = this.game.asktos[this.game.menumber];
};
GameClient.prototype.setRankings = function (rankings) {
    this.game.rankings = rankings;
};
GameClient.prototype.setQuestion = function (number, question) {
    let q = this.game.questions[number];
    q.question = question.question;
    q.link = question.link;
    q.image = question.image;
};
GameClient.prototype.send = function (url, content, listener) {
    return HTTP.post(url, content, listener);
};
GameClient.prototype.sendServer = function (path, params, content = {}, listener) {
    content.token = this.game.token;
    let url = HTTP.url(this.game.url, path, params);
    return this.send(url, content, listener);
};
GameClient.prototype.sendPlayer = function (player, path, params, content, listener) {
    let url = HTTP.url(player.url, path, params);
    return this.send(url, content, listener);
};
GameClient.prototype.join = function (url, onJoined = () => null, onRejected = () => null) {
    let client = this;
    this.send(HTTP.url(url, "join"), { player: this.me }, function () {
        if (HTTP.ready(this)) {
            let response = common.json.parse(this.responseText, {});
            if (response.joined === "joined" || response.joined === "rejoined") {
                common.json.transcribe(client.game, response.game);
                client.game.joined = true;
                onJoined();
            } else if (response.joined === "rejected") {
                onRejected();
            }
        }
    });
};
GameClient.prototype.ask = function (question, link, image, onFinished) {
    let to = this.game.askto;
    for (let player of this.game.players) {
        if (player.number === to) continue;
        this.sendPlayer(player, "ask", {}, { to, question, link, image });
    }
    this.sendServer("ask", {}, { number: this.game.menumber }, function () {
        if (HTTP.ready(this)) {
            let request = common.json.parse(this.responseText);
            if (!request.error) {
                if (onFinished) onFinished();
            }
        }
    });
};
GameClient.prototype.approve = function () {
    let client = this;
    this.sendServer("approve", {}, { askto: this.game.askto }, function () {
        if (HTTP.ready(this)) {
            let response = common.json.parse(this.responseText, {});
            if (response.result === "approved") {
                let askto = client.game.askto;
                let question = client.game.questions[askto];
                client.sendPlayer(client.game.players[askto], "ask", {}, {
                    to: askto,
                    question: question.question,
                    link: question.link,
                    image: question.image
                });
            }
        }
    });
};
GameClient.prototype.controlServerAskorder = function () {
    this.sendServer("control", { command: "askorder" });
};
GameClient.prototype.controlServerNext = function () {
    if (!this.game.joined) return false;
    this.sendServer("next");
};
GameClient.prototype.controlServerEnd = function () {
    if (!this.game.joined) return false;
    this.sendServer("control", { command: "end" });
};
GameClient.prototype.controlServerRestart = function () {
    if (!this.game.joined) return false;
    this.sendServer("control", { command: "restart" });
};
GameClient.prototype.updateNote = function (note) {
    let content = { note };
    for (let player of this.game.players) {
        if (player.number === this.game.menumber) continue;
        this.sendPlayer(player, "update", {
            target: "note", playernumber: this.game.menumber
        }, content);
    }
};
exports.GameClient = GameClient;