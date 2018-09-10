// Change this to listen to a different port
var httpPort = 3000;

// Start development web server
var ejs = require("ejs");
var express = require("express");
var fs = require("fs");
var path = require("path");

// Globals
var pkgJson = require("../package.json");
pkgJson = Object.assign({}, pkgJson, {
  id: pkgJson.name + "@" + pkgJson.version,
  main: (pkgJson.main || "index.js").replace(/.js$/, "")
});

var portlet = {
  displayName: pkgJson.portlet["javax.portlet.display-name"] || pkgJson.name,
  instance: "Yb5oWE2lPWni",
  name: pkgJson.name,
  css: pkgJson.portlet["com.liferay.portlet.header-portlet-css"]
};

var params = {
  portletElementId: "js-portlet-" + portlet.namespace,
  contextPath: "/o/" + pkgJson.name + "-" + pkgJson.version,
  portletNamespace: "_" + pkgJson.name + "_INSTANCE_" + portlet.instance + "_"
};

// Start web server
var app = express();
app.listen(httpPort);

// Map web server routes
app.get("/", function(req, res) {
  render(res, "text/html", "index.html");
});

app.get("/styles.css", function(req, res) {
  render(res, "text/css", "styles.css");
});

app.get("/liferay.js", function(req, res) {
  render(res, "text/javascript", "liferay.js");
});

app.get("/js_loader_modules.js", function(req, res) {
  render(res, "text/javascript", "js_loader_modules.js");
});

app.get("/loader.js", function(req, res) {
  res.sendFile(
    path.join(
      __dirname,
      "..",
      "node_modules",
      "liferay-amd-loader",
      "build",
      "loader",
      "loader.js"
    )
  );
});

app.get("/config.js", function(req, res) {
  render(res, "text/javascript", "config.js");
});

app.get(params.contextPath + "/*", function(req, res) {
  var file = req.url.substring(params.contextPath.length + 1);
  var fileParts = [__dirname, "..", "build"].concat(file.split("/"));

  // if (file.endsWith(".css")) {
  //   res.type("text/css");
  // } else if (file.endsWith(".html")) {
  //   res.type("text/html");
  // } else if (file.endsWith(".js")) {
  //   res.type("text/javascript");
  // }

  res.sendFile(path.join.apply(path.join, fileParts));
});

// Helpers
function render(res, type, file, data) {
  if (!data) {
    data = {};
  }

  data = Object.assign(
    {},
    {
      pkgJson: pkgJson,
      portlet: portlet,
      params: params
    },
    data
  );

  ejs.renderFile(path.join(__dirname, "start", file), data, {}, function(
    err,
    html
  ) {
    if (err) {
      console.error(err);

      res.status(500);
      res.type("text/plain");
      res.send(err.toString());
    } else {
      res.status(200);
      res.type(type);
      res.send(html);
    }
  });
}
