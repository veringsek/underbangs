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
        }
    });
};
let spawnclient = (port = PORT_CLIENT) => {
    gameclient = new GameClient(port);
    vm.client = gameclient; 
    vm.loadingStage = "join-game"; 
};
let hostgame = (port = PORT_SERVER) => {
    gameserver = new GameServer(port, gameclient.url);
    joingame(gameserver.url); 
};
let joingame = (url) => {
    gameclient.join(url, () => {
        vm.loadingStage = "in-game"; 
    });
}