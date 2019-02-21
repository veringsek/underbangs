// debug
let log = console.log;

// Node
const { shell } = require("electron");
const portfinder = require("portfinder");

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
            Q: function (number) {
                return vm.game.questions[number];
            },
            theater: {
                dialog: null,
                image: null,
                web: null
            },
            theaterDialog: {
                onYes: () => null,
                onNo: () => null
            },
            theaterClear: function () {
                for (let key in vm.theater) {
                    vm.theater[key] = null;
                }
            }
        },
        computed: {
            game: function () {
                if (!this.client) return undefined;
                return this.client.game;
            },
            spawned: function () {
                return this.client instanceof GameClient;
            },
            ingame: function () {
                return this.spawned && this.game.joined;
            },
            ishost: function () {
                return this.ingame && this.game.host === this.game.menumber;
            },
            myturn: function () {
                if (!this.spawned) return false;
                return this.game.round === this.game.menumber;
            },
            meapproved: function () {
                if (!this.spawned) return false;
                return this.game.rankings.includes(this.game.menumber);
            },
            theaterEmpty: function () {
                for (let key in this.theater) {
                    if (this.theater[key]) return false;
                }
                return true;
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
    gameserver = new GameServer(port, 0); //gameclient.me.url);
    joingame(gameserver.url);
};
let joingame = (url) => {
    gameclient.join(url, () => {
        vm.loadingStage = "in-game";
    });
};

// text
let textStage = (code) => {
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
let textAskorder = (askorder) => {
    switch (askorder) {
        case "+1":
            return "+1";
        case "random":
            return "Random";
    }
};

let setBGI = (element, url = "") => {
    element.style.backgroundImage = `url('${url}')`;
};
let openLink = (url) => {
    if (isURL(url)) {
        vm.theater.web = url;
    }
};
let openLinkExternal = (url) => {
    if (isURL(url)) {
        shell.openExternal(url);
    }
}
let toggleBigImage = (element) => {
    if (element.style.backgroundSize === "contain") {
        element.style.backgroundSize = "cover";
    } else {
        element.style.backgroundSize = "contain";
    }
};
let isURL = (string) => {
    try {
        new URL(string);
        return true;
    } catch (ex) {
        return false;
    }
};
let tryport = (port, onSuccess = () => null, onFailed) => {
    if (typeof port !== "object") {
        port = { port, stopPort: port };
    }
    if (!onFailed) {
        onFailed = error => {
            vm.theater.dialog = "This port is unavailable.<br>Try another one.";
        };
    }
    portfinder.getPort(port, (error, port) => {
        if (error) {
            onFailed(error);
        } else {
            onSuccess(port);
        }
    });
};

let ask = () => {
    vm.client.ask(txtAskQuestion.value, txtAskLink.value, txtAskImage.value, () => {
        if (btnAsk) {
            btnAsk.style.display = "none";
        }
    });
};
let tryspawnclient = () => {
    tryport(txtClientPort.value, () => spawnclient(txtClientPort.value, txtClientName.value));
};
let tryhostgame = () => {
    tryport(txtServerPort.value, () => hostgame(txtServerPort.value));
};

let confirm = (msg, onYes = () => null, onNo = () => null) => {
    vm.theaterDialog.onYes = onYes;
    vm.theaterDialog.onNo = onNo;
    vm.theater.dialog = msg;
};
let confirmApprove = () => {
    confirm("Are you sure to approve his answer?", () => vm.client.approve());
};
let confirmEnd = () => {
    if (vm.game.rankings.length < vm.game.players.length) {
        confirm(
            "It seems some players haven't reached their answer.<br>" +
            "Are you sure you want to end this session?",
            vm.client.controlServerEnd
        );
    }
};
let confirmRestart = () => {
    confirm(
        "The current session will be abandoned after restart.\n<br>" +
        "Are you sure you want to do this?",
        vm.client.controlServerRestart
    );
};