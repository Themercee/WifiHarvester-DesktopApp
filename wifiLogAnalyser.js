'use strict';

const fs = require('fs');
var path = require('path');

var debug = require('Debug')('wifiLogAnalyser');
var debugFileInfo = path.basename(__filename);

module.exports = {
    getPoints: function (dataPath) {
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


// Filter the gps points list to get only unique value
function uniqueList(gpsPointsArray) {
    var pointsList = [];

    gpsPointsArray.forEach(function (originEntry) {
        var elementFind = false;

        pointsList.forEach(function (uniqEntry, index) {
            //Check for hidden network
            if(originEntry.SSID == "" && originEntry.BSSID == uniqEntry.BSSID){
                elementFind = true;
                pointsList[index].number += 1;
                pointsList[index].Signal += originEntry.Signal;
            }
            else if(uniqEntry.SSID === originEntry.SSID &&
                uniqEntry.Lat === originEntry.Lat &&
                uniqEntry.Lon === originEntry.Lon) {
                elementFind = true;
                pointsList[index].number += 1;
                pointsList[index].Signal += originEntry.Signal;
            }
        }, this);

        if (!elementFind) {
            originEntry.number = 1;
            pointsList.push(originEntry);
        }

    }, this);

    //Ajust the Signal
    setAverageSignal(pointsList);

    return pointsList;
}

function setAverageSignal(pointsList){
    for(var i=0; i < pointsList.length; i++){
        pointsList[i].Signal = Math.round( pointsList[i].Signal / pointsList[i].number );
    }
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