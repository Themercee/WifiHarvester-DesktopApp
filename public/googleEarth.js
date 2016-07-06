var ipcRenderer = require('electron').ipcRenderer;
console.log(ipcRenderer);


var allSSID = "all";
var map, heatmap, data;
var centerCoord = { lat: 46.81568063, lng: -71.20222946 };
var ssidArray = [];

var radius = 40;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 17,
    center: centerCoord,
    mapTypeId: google.maps.MapTypeId.SATELLITE
  });

  heatmap = new google.maps.visualization.HeatmapLayer({
    data: initData(),
    map: map,
    radius: radius,
    opacity: 0.6,
  });
}

function toggleHeatmap() {
  heatmap.setMap(heatmap.getMap() ? null : map);
}

function changeGradient() {
  var gradient = [
    'rgba(255, 0, 0, 0)',
    'rgba(245, 10, 0, 1)',
    'rgba(235, 20, 0, 1)',
    'rgba(225, 30, 0, 1)',
    'rgba(215, 40, 0, 1)',
    'rgba(195, 60, 0, 1)',
    'rgba(175, 80, 0, 1)',
    'rgba(155, 100, 0, 1)',
    'rgba(135, 120, 0, 1)',
    'rgba(115, 140, 0, 1)',
    'rgba(95, 160, 0, 1)',
    'rgba(75, 180, 0, 1)',
    'rgba(64, 191, 0, 1)',
    'rgba(0, 255, 0, 1)'
  ]
  heatmap.set('gradient', heatmap.get('gradient') ? null : gradient);
}

function changeRadius() {
  heatmap.set('radius', heatmap.get('radius') ? null : 20);
}

function changeOpacity() {
  heatmap.set('opacity', heatmap.get('opacity') ? null : 0.2);
}


function initData() {
  //Query data
  data = ipcRenderer.sendSync('getCoord');

  var googleList = [];

  data.forEach(function (gpsEntry) {

    if (typeof gpsEntry.Lat != 'undefined' && typeof gpsEntry.Lon != 'undefined') {
      // SIGNAL STRENGHT NOT WORKING
      var signalStrenght = 1;
      signalStrenght = signalStrenght * gpsEntry.Signal;
      googleList.push({ location: new google.maps.LatLng(gpsEntry.Lat, gpsEntry.Lon), weight: signalStrenght });

      addSSID(gpsEntry.SSID);

    }

  }, this);

  fillTable(ssidArray);

  return googleList;
}

function getPointsBySSID(ssid) {
  //Query data
  if (typeof data === 'undefined') data = ipcRenderer.sendSync('getCoord');

  var googleList = [];

  data.forEach(function (gpsEntry) {

    if ((ssid === allSSID || ssid === gpsEntry.SSID) && typeof gpsEntry.Lat != 'undefined' && typeof gpsEntry.Lon != 'undefined' && gpsEntry.Signal > 0) {
      var signalStrenght = 10;
      signalStrenght = signalStrenght * gpsEntry.Signal;
      googleList.push({ location: new google.maps.LatLng(gpsEntry.Lat, gpsEntry.Lon), weight: signalStrenght });

      var marker = new google.maps.Marker({
        position: new google.maps.LatLng(gpsEntry.Lat, gpsEntry.Lon),
        label: "Test",
        map: map
      });

      //console.log("Lat: " + gpsEntry.Lat + " Lon: " + gpsEntry.Lon);
    }

  }, this);

  console.log(googleList);
  return googleList;
}

function filterSSID() {
  var ssid = document.getElementById("ssidTextBox").value;
  heatmap.setData(getPointsBySSID(ssid));
};

function getPointsPolygonStyle() {
  var ssid = document.getElementById("ssidTextBox").value;
  var lowSignal = [];
  var mediumSignal = [];
  var hightSignal = [];


  data.forEach(function (wgEntry) {
    if (wgEntry.SSID === ssid || ssid === allSSID) {
      if (wgEntry.Signal >= 1 && wgEntry.Signal < 3 && typeof wgEntry.Lat != 'undefined' && typeof wgEntry.Lon != 'undefined') {
        //set Low signal
        lowSignal.push({ lat: wgEntry.Lat, lng: wgEntry.Lon });

      } else if (wgEntry.Signal === 3 && typeof wgEntry.Lat != 'undefined' && typeof wgEntry.Lon != 'undefined') {
        //set medium signal
        mediumSignal.push({ lat: wgEntry.Lat, lng: wgEntry.Lon });

      } else if (wgEntry.Signal <= 5 && typeof wgEntry.Lat != 'undefined' && typeof wgEntry.Lon != 'undefined') {
        //set hight signal
        hightSignal.push({ lat: wgEntry.Lat, lng: wgEntry.Lon });
      }
    }

  }, this);



  var lowWifiPoly = new google.maps.Polygon({
    paths: lowSignal,
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#FF0000',
    fillOpacity: 0.35
  });

  var mediumWifiPoly = new google.maps.Polygon({
    paths: mediumSignal,
    strokeColor: '#0000FF',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#0000FF',
    fillOpacity: 0.35
  });

  var hightWifiPoly = new google.maps.Polygon({
    paths: hightSignal,
    strokeColor: '#00FF00',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#00FF00',
    fillOpacity: 0.35
  });

  lowWifiPoly.setMap(map);
  mediumWifiPoly.setMap(map);
  hightWifiPoly.setMap(map);

}

function clearMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 17,
    center: centerCoord,
    mapTypeId: google.maps.MapTypeId.SATELLITE
  });
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