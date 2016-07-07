'use strict';

const fs = require('fs');
var path = require('path');

var debug = require('Debug')('wifiLogAnalyser');
var debugFileInfo = path.basename(__filename);

var parseString = require('xml2js').parseString;

module.exports = {
    getPoints: function (dataPath) {
        //cleanXMLFromInvalidCharacter before!!
        debug("getPoints is called");

        var dataFile;

        dataFile = fs.readFileSync(dataPath);

        debug("dataFile is " + typeof (dataFile) + " after reading json file");

        var gpsJs = JSON.parse(dataFile);
        //var gpsJs = dataFile;
        debug("gpsJs is " + typeof (gpsJs) + " after parsing to json");

        if (gpsJs === null) {
            debug("Error: Data to null from parseData() in ", __fiename);
        }

        var gpsPoints = gpsJs.wifiNetworks;

        gpsPoints = removeLatLonAtZero(gpsPoints)

        return uniqueList(gpsPoints);

    }
};


function cleanXMLFromInvalidCharacter(pathToFile) {

};

function parseXMLtoJS(pathToData) {
    debug("parseData is called");

    var gpsData = fs.readFileSync(__dirname + pathToData, 'utf8');
    var data;

    parseString(gpsData, function (err, result) {
        debug("Data parse to js");
        data = JSON.parse(JSON.stringify(result));
    });

    if (data === null) {
        console.log("ERROR READING GPSXML FILE!! : " + err);
        return null;
    } else {
        return data;
    }
};

// Filter the gps points list to get only unique value
function uniqueList(gpsPointsArray) {
    var pointsList = [];

    gpsPointsArray.forEach(function (originEntry) {
        var elementFind = false;

        pointsList.forEach(function (uniqEntry) {
            if (uniqEntry.SSID === originEntry.SSID &&
                uniqEntry.Lat === originEntry.Lat &&
                uniqEntry.Lon === originEntry.Lon) {
                elementFind = true;
            }
        }, this);

        if (!elementFind) {
            pointsList.push(originEntry);
        }

    }, this);

    return pointsList;
}

/**
 * @description This function do an average of the gps location to bypass
 *              the accuracy fault.
 */
function getAveragePoints(gpsPointsArray) {
    var pointsList = [];
}

function removeLatLonAtZero(gpsPointsArray) {
    var pointsList = [];

    gpsPointsArray.forEach(function (gpsEntry) {
        var elementFind = false;
        if (gpsEntry.Lat != 0 && gpsEntry.Lon != 0) {
            pointsList.push(gpsEntry);
        }

    }, this);

    return pointsList;
}