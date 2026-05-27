function parseUrl(str) {
    const tempUrl = str.split('?')[1];
    const resObj = {}
    for (const str of tempUrl.split('&')) {
        let [key, value] = str.split('=');
        value = decodeURIComponent(value);
        if (resObj.hasOwnProperty(key)) {
            resObj[key] = [].concat(resObj[key], value);
        }
        else if (value == "undefined") { // !!!
            resObj[key] = true;
        } else {
            resObj[key] = value;
        }
    }   
    return resObj;
}
console.log(parseUrl("https://www.example.com:8080/a/b/index.html?name=tom&age=18#top"))