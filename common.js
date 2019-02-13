let common = {};

let json = {};
json.parse = function (string, init = {}) {
    try {
        return JSON.parse(string);
    } catch (ex) {
        return init; 
    }
};
common.json = json;

let http = {};
http.post = function (url, content, listener) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = listener;
    xhttp.open("POST", url, true);
    xhttp.send(content);
};
common.http = http;

exports.common = common;