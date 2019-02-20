let common = {};

let json = {};
json.parse = function (string, init = {}) {
    try {
        return JSON.parse(string);
    } catch (ex) {
        return init;
    }
};
json.transcribe = function (destination, source, keys) {
    if (!Array.isArray(keys)) {
        keys = Object.keys(source);
    }
    for (let key of keys) {
        destination[key] = source[key];
    }
    return destination;
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

let num = {};
num.track = function (n, lowest, highest) {
    if (!highest && highest !== 0) {
        highest = lowest - 1;
        lowest = 0;
    }
    let range = highest - lowest + 1;
    while (n < lowest) {
        n += range;
    }
    while (n > highest) {
        n -= range;
    }
    return n;
};
num.random = (start, end, base = 1) => {
    if (!end && end !== 0) {
        end = start - 1;
        start = 0;
    }
    if (Array.isArray(start)) {
        return start[random(0, start.length - 1)];
    } else {
        return Math.floor(Math.random() * ((end - start) / base + 1)) * base + start;
    }
};
common.num = num;

exports.common = common;