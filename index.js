// debug
let log = console.log;

// Imports
const { common } = require("./common.js");
const { GameServer, GameClient } = require("./game.js");

// Constants
const PORT_SERVER = 9487;
const PORT_CLIENT = 9488;

// Methods
let init = function () {
    vm = new Vue({
        el: "#ribody",
        data: {
            loadingStage: "spawn-client",
            client: undefined
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
    }
};