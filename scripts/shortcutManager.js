const {app, globalShortcut, BrowserWindow } = require('electron');
const path = require('path');
const http = require('https');
const fs = require('fs');
const fetch = require('node-fetch');
const URL = require("url").URL;
var sanitize = require("sanitize-filename");
const pngToIco = require('png-to-ico');
const createDesktopShortcut = require('create-desktop-shortcuts');

function createShortcutFile(appId) {
  fetch('https://games.geforce.com/graphql?query=%7Bapps(appIds:%22' + appId + '%22)%7Bitems%7Btitle%20sortName%20variants%7BappStore%20id%20appStore%7D%7D%7D%7D&variables=%7B%7D')
    .then(res => res.json())
    .then(json => {
      for (var i = 0; i < json["data"]["apps"]["items"][0]["variants"].length; i++) {
        var data = json["data"]["apps"]["items"][0]["variants"][i];
        createDesktopShortcut({
          onlyCurrentOS: true,
          windows: {
            filePath: process.argv[0],
            name: sanitize(json["data"]["apps"]["items"][0]["title"]) + " - " + data["appStore"],
            icon: path.join(app.getPath('userData'), "icons", json["data"]["apps"]["items"][0]["sortName"] + ".ico").toString(),
            arguments: '--direct-start ' + data["id"]
          },
          linux: {
            filePath: process.argv[0],
            name: sanitize(json["data"]["apps"]["items"][0]["title"]) + " - " + data["appStore"],
            icon: path.join(app.getPath('userData'), "icons", json["data"]["apps"]["items"][0]["sortName"] + ".png").toString(),
            arguments: '--direct-start ' + data["id"]
          }
        });
      }

      console.log("All shortcuts successfully created at Desktop...");
    });
}

function createShortcut(appId) {
  if (!fs.existsSync(path.join(app.getPath('userData'), "icons"))) {
    fs.mkdirSync(path.join(app.getPath('userData'), "icons"));
  }

  fetch('https://games.geforce.com/graphql?query=%7Bapps(appIds:%22' + appId + '%22)%7Bitems%7BsortName%20images%7BGAME_ICON%7D%7D%7D%7D&variables=%7B%7D')
    .then(res => res.json())
    .then(json => {
      if (!fs.existsSync(path.join(app.getPath('userData'), "icons", json["data"]["apps"]["items"][0]["sortName"] + ".png"))) {
        var request = http.get(json["data"]["apps"]["items"][0]["images"]["GAME_ICON"], function(response) {
          response.pipe(fs.createWriteStream(path.join(app.getPath('userData'), "icons", json["data"]["apps"]["items"][0]["sortName"] + ".png"), {
            flags: "wx"
          })).on('close', () => {
            pngToIco(path.join(app.getPath('userData'), "icons", json["data"]["apps"]["items"][0]["sortName"] + ".png"))
              .then(buf => {
                fs.writeFileSync(path.join(app.getPath('userData'), "icons", json["data"]["apps"]["items"][0]["sortName"] + ".ico"), buf);
                createShortcutFile(appId);
              });
          });
        });
      } else {
        createShortcutFile(appId);
      }
    });
}

module.exports = {
  createShortcut
};