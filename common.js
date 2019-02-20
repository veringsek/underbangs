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
http.ready = function (response) {
    return response.readyState === 4 && response.status === 200;
};
http.post = function (url, content, listener) {
    if (typeof content === "object") {
        content = JSON.stringify(content);
    }
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = listener;
    xhttp.open("POST", url, true);
    xhttp.send(content);
};
http.head = function (ip, port, protocol = "http") {
    let m = ip.includes("://") ? "" : `${protocol}://`;
    let p = port ? `:${port}` : "";
    return `${m}${ip}${p}`;
};
http.url = function (head, path, params) {
    return `${head}${http.route(path, params)}`;
};
http.route = function (path = [], params) {
    if (typeof path === "string") {
        path = [path];
    }
    return `/${path.join("/")}${http.query(params)}`;
};
http.query = function (params = {}) {
    let keys = Object.keys(params);
    if (keys.length < 1) return "";
    return `?${keys.map(key => `${key}=${params[key]}`).join("&")}`;
};
common.http = http;

exports.common = common;