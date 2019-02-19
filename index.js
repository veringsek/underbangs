// debug
let log = console.log;

// Node
const { shell } = require("electron");

// Imports
const { common } = require("./common.js");
const { GameServer, GameClient } = require("./game.js");

// Constants
const PORT_CLIENT = 9487;
const PORT_SERVER = 9488;

// Methods
let init = function () {
    vm = new Vue({
        el: "#ribody",
        data: {
            loadingStage: "spawn-client",
            client: undefined, 
            questionOf: function (number) {
                return vm.client.game.questions[number];
            }
        },
        computed: {
            spawned: function () {
                return this.client instanceof GameClient;
            },
            ingame: function () {
                return this.spawned && this.client.game.joined;
            },
            ishost: function () {
                return this.ingame && this.client.game.host === this.client.me.url;
            }
        }
    });
};
let spawnclient = (port = PORT_CLIENT, name) => {
    gameclient = new GameClient(port, name);
    vm.client = gameclient;
    vm.loadingStage = "join-game";
};
let hostgame = (port = PORT_SERVER) => {
    gameserver = new GameServer(port, gameclient.me.url);
    joingame(gameserver.url);
};
let joingame = (url) => {
    gameclient.join(url, () => {
        vm.loadingStage = "in-game";
    });
};

let stage = (code) => {
    switch (code) {
        case "wait":
            return "Waiting for players...";
        case "start":
            return "Game Start";
        case "ask":
            return "Ask";
        case "round":
            return "Guess It!";
        case "end": 
            return "Game Over";
        default:
            return code;
    }
};
let setBGI = (element, url = "") => {
    element.style.backgroundImage = `url('${url}')`;
};
let ask = () => {
    vm.client.ask(txtAskQuestion.value, txtAskLink.value, txtAskImage.value);
};
let openLinkInBrowser = (url) => {
    log(url);
    shell.openExternal(url);
};
let toggleBigImage = (element) => {
    if (element.style.backgroundSize === "contain") {
        element.style.backgroundSize = "cover"; 
    } else {
        element.style.backgroundSize = "contain";
    }
};