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
let respond = function (res, content = {}) {
    res.send(JSON.stringify(content));
};
let IPv4 = function (string) {
    return new IPAddress.Address6(string).to4().address;
};
let sameIP = function (a, b) {

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
    this.round = -1;
    this.askorder = "+1";
    this.asktos = [];

    let server = express();
    server.use(bodyParser.text());
    server.use(bodyParser.urlencoded({ extended: true }));
    server.post("/control", (req, res) => {
        let request = parseRequest(req);
        let ip = IPv4(req.ip);
        if (ip !== this.players[this.host].ip) {
            respond(res, { error: "no-permission" });
        }
        switch (req.query.command) {
            case "next": {
                switch (this.stage) {
                    case "wait": {
                        this.stageStart();
                        break;
                    }
                    case "start": {
                        this.stageAsk();
                        break;
                    }
                    case "round": {
                        let round = this.round += 1;
                        if (this.round >= this.players.length) {
                            round = 0;
                        }
                        this.setRound(round);
                        break;
                    }
                    case "end": {
                        this.setStage("start");
                        break;
                    }
                }
                break;
            }
            case "askorder": {
                let orders = ["+1", "random"];
                let o = orders.indexOf(this.askorder);
                o = common.num.track(o + 1, orders.length);
                this.setAskorder(orders[o]);
                break;
            }
        }
        respond(res);
    });
    server.post("/join", (req, res) => {
        let request = parseRequest(req);
        let ip = IPv4(req.ip);
        respond(res, this.serveJoin(request, ip));
    });
    server.post("/ask", (req, res) => {
        let request = parseRequest(req);
        this.confirmAsked(request.number);
        respond(res);
    })
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
GameServer.prototype.stageStart = function () {
    this.setStage("start");
};
GameServer.prototype.stageAsk = function () {
    // this.asked = [];
    this.asked = this.players.map(() => false);
    // for (let player of this.players) {
    //     this.asked.push(false);
    // }
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
            let someoneAskSelf = () => {
                let r = false;
                log(asktos)
                for (let q in asktos) {
                    if (parseInt(q) === parseInt(asktos[q])) r = true;// return true;
                }
                log(r);
                return r
                // return false;
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
        this.setStage("round");
    }
};
GameServer.prototype.addPlayer = function (player) {
    for (let any of this.players) {
        if (player.url === any.url) {
            return -1;// or rejoin?
        }
    }
    player.number = this.players.length;
    this.players.push(player);
    this.broadcast({ players: this.players }, "update", { target: "players" });
    return player.number;
};
GameServer.prototype.serveJoin = function (request, ip) {
    let player = request.player;
    player.ip = ip;
    player.url = HTTP.head(player.ip, player.port);
    let menumber = this.addPlayer(player);
    if (menumber < 0) {
        return { result: "rejected" };
    }
    return {
        result: "joined",
        url: this.url,
        host: this.host,
        stage: this.stage,
        round: this.round,
        askorder: this.askorder,
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
    this.me = { port, name };
    this.game = {
        url: "",
        host: "",
        stage: "",
        round: -1,
        askorder: "",
        asktos: [],
        askto: -1,
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
GameClient.prototype.setQuestion = function (number, question) {
    let q = this.game.questions[number];
    q.question = question.question;
    q.link = question.link;
    q.image = question.image;
};
GameClient.prototype.join = function (url, onJoined = () => null, onRejected = () => null) {
    let client = this;
    HTTP.post(HTTP.url(url, "join"), { player: this.me }, function () {
        if (HTTP.ready(this)) {
            let response = common.json.parse(this.responseText, {});
            if (response.result === "rejected") {
                onRejected();
            } else if (response.result === "joined") {
                client.game.url = response.url;
                client.game.host = response.host;
                client.game.stage = response.stage;
                client.game.round = response.round;
                client.game.askorder = response.askorder;
                client.game.menumber = response.menumber;
                client.game.joined = true;
                onJoined();
            }
        }
    });
};
GameClient.prototype.ask = function (question, link, image) {
    let to = this.game.askto;
    for (let player of this.game.players) {
        if (player.number === to) continue;
        HTTP.post(HTTP.url(player.url, "ask"), { to, question, link, image });
    }
    HTTP.post(HTTP.url(this.game.url, "ask"), { number: this.game.menumber });
};
GameClient.prototype.controlServerNext = function () {
    if (!this.game.joined) return false;
    HTTP.post(HTTP.url(this.game.url, "control", { command: "next" }));
};
GameClient.prototype.controlServerAskorder = function () {
    HTTP.post(HTTP.url(this.game.url, "control", { command: "askorder" }));
};
GameClient.prototype.updateNote = function (note) {
    let content = { note };
    for (let player of this.game.players) {
        if (player.number === this.game.menumber) continue;
        HTTP.post(HTTP.url(player.url, "update", {
            target: "note", playernumber: this.game.menumber
        }), content);
    }
};
exports.GameClient = GameClient;