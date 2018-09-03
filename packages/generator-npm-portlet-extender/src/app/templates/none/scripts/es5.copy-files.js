var fs = require("fs");
var ncp = require("ncp").ncp;

fs.mkdirSync("build");
fs.mkdirSync("build/src");

ncp("src", "build/src", err => {
    if (err) {
        console.error(err);
        process.exit(1);
    } else {
        console.log("Project files copied OK");
    }
});
