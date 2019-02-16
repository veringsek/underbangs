// debug
let log = console.log;

// Node Dependencies
const IP = require("ip");
const express = require("express");
const bodyParser = require("body-parser");

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
            client: gameclient
        }
    });
};
let hostgame = (port = PORT_SERVER) => {
    gameserver = new GameServer(port, gameclient.url);
    gameclient.join(gameserver.url);
};

// Variables
let gameclient = new GameClient(PORT_CLIENT);

// debug
hostgame();