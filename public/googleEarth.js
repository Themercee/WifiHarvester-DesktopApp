var ipcRenderer = require('electron').ipcRenderer;
console.log(ipcRenderer);


var allSSID = "all";
var map, heatmap, data, wifiGCList, originalWifiGCList;
var lowWifiPoly, mediumWifiPoly, highWifiPoly;

var centerCoord = { lat: 46.81568063, lng: -71.20222946 };

var ssidArray = [];

var radius = 40;
var maxDistance = 15;


function initMap() {
  initOverlay();
  wifiGCList = initData();

  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 17,
    center: centerCoord,
    mapTypeId: google.maps.MapTypeId.SATELLITE
  });

  heatmap = new google.maps.visualization.HeatmapLayer({
    data: wifiGCList,
    map: map,
    radius: radius,
    opacity: 0.6,
  });

  // Manage add/delete points
  map.addListener('click', function (e) {
    //Get Click Action
    var action = getClickAction();

    //if we want to add coord in the map
    if (action === "add") {
      addDataOnClick(e);
    } else if (action === "del") {  //want to delete coord
      delDataOnClick(e);
    } else if (action === "info") {
      getDataInfoOnClick(e);
    }

  });

  map.setCenter(wifiGCList[0].location);
}

function getDataInfoOnClick(e) {
  var pointToSeeInfo = getNearestPoint(e);

  customTxt = "<div>Lat: " + pointToSeeInfo.location.lat() + "<br />Lon: " + pointToSeeInfo.location.lng() + " </div>"
  txt = new TxtOverlay(pointToSeeInfo.location, customTxt, "customBox", map);
}

// Event from google maps
function addDataOnClick(e) {
  var signalStrenght = document.getElementById("signalStrenght").value;
  wifiGCList.push(new WifiGooCoord(e.latLng.lat(), e.latLng.lng(), signalStrenght, getSSIDFilter()));
  heatmap.setData(wifiGCList);
}

/**
 * The way of deleting coordinates is to add every data to an array,
 * except all the points that have the same coordinates of the coordinates
 * we want to delete. After set this array as new data in the heatmap.
 */
function delDataOnClick(e) {
  var pointToDelete = getNearestPoint(e);
  var googleCoordUpdated = [];

  if (!pointToDelete) return;

  for (var i = 0; i < wifiGCList.length; i++) {

    var sameLat = (wifiGCList[i].location.lat() == pointToDelete.location.lat());
    var sameLng = (wifiGCList[i].location.lng() == pointToDelete.location.lng());

    var doNotAdd = (sameLat && sameLng) // sameLat && sameLng is the point to delete

    if (!doNotAdd) {
      googleCoordUpdated.push(wifiGCList[i]);
    }
  }

  wifiGCList = googleCoordUpdated;
  heatmap.setData(wifiGCList);

}

function compareData(e){
  ipcRenderer.sendSync('compareData');
}

function mergeScan(e){
  var wifiArray = ipcRenderer.sendSync('getResultFromMergingMultipleScan');
  console.log("WifiArray length: " + wifiArray.length);
  initData(wifiArray);
}

function getNearestPoint(e) {
  var index = -1;
  var minDistance;
  var lat, lnt;

  //Get filterSSID
  var ssidFilter = getSSIDFilter();

  // Search the nearest points from the click
  for (i = 0; i < wifiGCList.length; i++) {
    if (ssidFilter !== allSSID && wifiGCList[i].ssid !== ssidFilter) { continue; }

    var gCoor = { location: new google.maps.LatLng(wifiGCList[i].lat, wifiGCList[i].lon) };

    var distBetweenPoints = google.maps.geometry.spherical.computeDistanceBetween(e.latLng, gCoor.location);

    if (distBetweenPoints < minDistance || typeof minDistance === 'undefined') {
      minDistance = distBetweenPoints;
      index = i;
    }
  }

  return wifiGCList[index];
}

function getSSIDFilter() {
  var ssid = document.getElementById("ssidTextBox").value;

  return (ssid === "" ? allSSID : ssid);
}

function getClickAction() {
  return $("#clickAction").val();
}

function changeGradient() {
  /*var gradient = [
    'rgba(255, 0, 0, 0)',
    'rgba(255, 20, 0, 1)',
    'rgba(255, 40, 0, 1)',
    'rgba(255, 60, 0, 1)',
    'rgba(255, 80, 0, 1)',
    'rgba(255, 100, 0, 1)',
    'rgba(255, 120, 0, 1)',
    'rgba(255, 140, 0, 1)',
    'rgba(255, 160, 0, 1)',
    'rgba(255, 180, 0, 1)',
    'rgba(255, 200, 0, 1)',
    'rgba(255, 220, 0, 1)',
    'rgba(255, 255, 0, 1)',
    'rgba(240, 255, 0, 1)',
    'rgba(220, 255, 0, 1)',
    'rgba(200, 255, 0, 1)',
    'rgba(180, 255, 0, 1)',
    'rgba(160, 255, 0, 1)',
    'rgba(140, 255, 0, 1)',
    'rgba(120, 255, 0, 1)',
    'rgba(100, 255, 0, 1)',
    'rgba(80, 255, 0, 1)',
    'rgba(60, 255, 0, 1)',
    'rgba(40, 255, 0, 1)',
    'rgba(20, 255, 0, 1)',
    'rgba(0, 255, 0, 1)'
  ]*/

  var gradient = ['rgba(255, 0, 0, 0)'];
  var opacity = 0.10;

  for (var i = 0; i <= 255; i++) {
    if (i % 10 == 0 && opacity != 1) {
      opacity += 0.10;
    }


    var color = 'rgba(255,' + i + ',0,' + opacity + ')';
    gradient.push(color);
  }

  for (var i = 255; i >= 0; i--) {
    var color = 'rgba(' + i + ',255,0,1)';
    gradient.push(color);
  }

  heatmap.set('gradient', heatmap.get('gradient') ? null : gradient);
}

function changeRadius() {
  heatmap.set('radius', heatmap.get('radius') ? null : 20);
}

function changeOpacity() {
  heatmap.set('opacity', heatmap.get('opacity') ? null : 0.2);
}

function toggleHeatmap() {
  heatmap.setMap(heatmap.getMap() ? null : map);
}

function getSignalAreaLow() {
  if (!lowWifiPoly) {
    getPointsPolygonStyle();
  }

  lowWifiPoly.setMap(map);
}

function getSignalAreaMedium() {
  if (!mediumWifiPoly) {
    getPointsPolygonStyle();
  }

  mediumWifiPoly.setMap(map);
}

function getSignalAreaHigh() {
  if (!highWifiPoly) {
    getPointsPolygonStyle();
  }

  highWifiPoly.setMap(map);
}

function clearPolygon() {
  if (lowWifiPoly) {
    lowWifiPoly.setMap(null);
  }

  if (mediumWifiPoly) {
    mediumWifiPoly.setMap(null);
  }

  if (highWifiPoly) {
    highWifiPoly.setMap(null);
  }

  lowWifiPoly = null;
  mediumWifiPoly = null;
  highWifiPoly = null;
}

/*************************************
 * FUNCTION RELATED TO LOADING OF DATA
 ************************************/

function WifiGooCoord(lat, lon, signal, ssid) {
  this.lat = lat;
  this.lon = lon;
  this.signal = signal;
  this.ssid = ssid;
  this.location = new google.maps.LatLng(lat, lon);
  this.setWeight = function (factor) { return (this.signal * factor); };
  this.weight = this.setWeight(1);



}

function initData(wifiArray) {
  //Query data
  var data;
  if(wifiArray){
    data = wifiArray;
    console.log("Data already acquire.");
  }else{
    data = ipcRenderer.sendSync('getCoord');
  }

  wifiGCList = [];

  data.forEach(function (gpsEntry) {
    if (typeof gpsEntry.Lat != 'undefined' && typeof gpsEntry.Lon != 'undefined' && gpsEntry.Signal > 0) {
      wifiGCList.push(new WifiGooCoord(gpsEntry.Lat, gpsEntry.Lon, gpsEntry.Signal, gpsEntry.SSID));

      addSSID(gpsEntry.SSID);
    }

  }, this);

  fillTable(ssidArray);

  originalWifiGCList = wifiGCList;

  return wifiGCList;
}

function getPointsBySSID(ssidToFilter) {
  var googleCoorFiltered = [];

  if (ssidToFilter === allSSID) return originalWifiGCList;

  originalWifiGCList.forEach(function (wifiGC) {
    if ((ssidToFilter === allSSID || ssidToFilter === wifiGC.ssid) && typeof wifiGC.lat != 'undefined' && typeof wifiGC.lon != 'undefined' && wifiGC.signal > 0) {
      googleCoorFiltered.push(new WifiGooCoord(wifiGC.lat, wifiGC.lon, wifiGC.signal, wifiGC.ssid));
    }
  }, this);

  wifiGCList = googleCoorFiltered;
  console.log(wifiGCList);
  return wifiGCList;
}

function getPointsByMacAdress(macToFilter){
  //TODO
}

function filterSSID() {
  //var re = /^(([A-Fa-f0-9]{2}[:]){5}[A-Fa-f0-9]{2}[,]?)+$/
  var ssid = getSSIDFilter();
  heatmap.setData(getPointsBySSID(ssid));
};

function rad(x) {
  return x * Math.PI / 180;
};

function getDistance(p1, p2) {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(p2.lat() - p1.lat());
  var dLong = rad(p2.lng() - p1.lng());
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
};

function getPointsPolygonStyle() {
  var ssidFilter = getSSIDFilter();
  var lowSignal = [];
  var mediumSignal = [];
  var highSignal = [];

  wifiGCList.forEach(function (wgEntry, index) {
    if (wgEntry.ssid === ssidFilter || ssidFilter === allSSID) {
      if (wgEntry.signal >= 1 && wgEntry.signal < 3 && typeof wgEntry.lat != 'undefined' && typeof wgEntry.lon != 'undefined') {
        //set Low signal
        lowSignal.push({ lat: wgEntry.lat, lng: wgEntry.lon });

      } else if (wgEntry.signal == 3 && typeof wgEntry.lat != 'undefined' && typeof wgEntry.lon != 'undefined') {
        //set medium signal
        mediumSignal.push({ lat: wgEntry.lat, lng: wgEntry.lon });

      } else if (wgEntry.signal >= 4 && typeof wgEntry.lat != 'undefined' && typeof wgEntry.lon != 'undefined') {
        //set high signal
        highSignal.push({ lat: wgEntry.lat, lng: wgEntry.lon });
      }
    }
  }, this);

  clearPolygon();

  lowWifiPoly = new google.maps.Polygon({
    paths: lowSignal,
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#FF0000',
    fillOpacity: 0.35
  });

  mediumWifiPoly = new google.maps.Polygon({
    paths: mediumSignal,
    strokeColor: '#0000FF',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#0000FF',
    fillOpacity: 0.35
  });

  highWifiPoly = new google.maps.Polygon({
    paths: highSignal,
    strokeColor: '#00FF00',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#00FF00',
    fillOpacity: 0.35
  });

}

function clearMap() {
  initMap();
  /*map = new google.maps.Map(document.getElementById('map'), {
    zoom: 17,
    center: centerCoord,
    mapTypeId: google.maps.MapTypeId.SATELLITE
  });*/
}

/**
 * @param ssid The SSID to add to the list
 * @description This method increments the number of location by one from the SSID if it exists. 
 */
function addSSID(newSSID) {
  var isInArray = false;

  for (i = 0; i < ssidArray.length; i++) {
    if (ssidArray[i].ssid === newSSID) {
      isInArray = true;
      ssidArray[i].numOfLocation++;
      break;
    }
  }

  if (!isInArray) {
    ssidArray.push({ ssid: newSSID, numOfLocation: 1 });
  }
}


function fillTable(ssidArray) {
  var htmlTable = document.getElementById("ssidArray");

  ssidArray.forEach(function (entry) {
    var newRow = htmlTable.insertRow(htmlTable.rows.length);
    newRow.insertCell(0).appendChild(document.createTextNode(entry.ssid));
    newRow.insertCell(1).appendChild(document.createTextNode(entry.numOfLocation));

  }, this);
}


//************************************
// TEXT OVERLAY TO SHOW INFORMATION
//************************************
function TxtOverlay(pos, txt, cls, map) {

  // Now initialize all properties.
  this.pos = pos;
  this.txt_ = txt;
  this.cls_ = cls;
  this.map_ = map;

  // We define a property to hold the image's
  // div. We'll actually create this div
  // upon receipt of the add() method so we'll
  // leave it null for now.
  this.div_ = null;

  // Explicitly call setMap() on this overlay
  this.setMap(map);
}

function initOverlay() {
  TxtOverlay.prototype = new google.maps.OverlayView();

  TxtOverlay.prototype.onAdd = function () {

    // Note: an overlay's receipt of onAdd() indicates that
    // the map's panes are now available for attaching
    // the overlay to the map via the DOM.

    // Create the DIV and set some basic attributes.
    var div = document.createElement('DIV');
    div.className = this.cls_;

    div.innerHTML = this.txt_;

    // Set the overlay's div_ property to this DIV
    this.div_ = div;
    var overlayProjection = this.getProjection();
    var position = overlayProjection.fromLatLngToDivPixel(this.pos);
    div.style.left = position.x + 'px';
    div.style.top = position.y + 'px';
    // We add an overlay to a map via one of the map's panes.

    var panes = this.getPanes();
    panes.floatPane.appendChild(div);
  }

  TxtOverlay.prototype.draw = function () {


    var overlayProjection = this.getProjection();

    // Retrieve the southwest and northeast coordinates of this overlay
    // in latlngs and convert them to pixels coordinates.
    // We'll use these coordinates to resize the DIV.
    var position = overlayProjection.fromLatLngToDivPixel(this.pos);


    var div = this.div_;
    div.style.left = position.x + 'px';
    div.style.top = position.y + 'px';



  }

  //Optional: helper methods for removing and toggling the text overlay.  
  TxtOverlay.prototype.onRemove = function () {
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
  }
  TxtOverlay.prototype.hide = function () {
    if (this.div_) {
      this.div_.style.visibility = "hidden";
    }
  }

  TxtOverlay.prototype.show = function () {
    if (this.div_) {
      this.div_.style.visibility = "visible";
    }
  }

  TxtOverlay.prototype.toggle = function () {
    if (this.div_) {
      if (this.div_.style.visibility == "hidden") {
        this.show();
      } else {
        this.hide();
      }
    }
  }

  TxtOverlay.prototype.toggleDOM = function () {
    if (this.getMap()) {
      this.setMap(null);
    } else {
      this.setMap(this.map_);
    }
  }
}
