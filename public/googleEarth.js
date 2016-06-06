var ipcRenderer = require('electron').ipcRenderer;
console.log(ipcRenderer);


var allBSSID = "all";
var map, heatmap, data;
var centerCoord = { lat: 46.773456, lng: -71.275436 };

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 17,
    center: centerCoord,
    mapTypeId: google.maps.MapTypeId.SATELLITE
  });

  heatmap = new google.maps.visualization.HeatmapLayer({
    data: getPoints("all"),
    map: map,
    radius: 60,
    opacity: 0.6
  });
}

function toggleHeatmap() {
  heatmap.setMap(heatmap.getMap() ? null : map);
}

function changeGradient() {
  var gradient = [
    'rgba(0, 255, 255, 0)',
    'rgba(0, 255, 255, 1)',
    'rgba(0, 191, 255, 1)',
    'rgba(0, 127, 255, 1)',
    'rgba(0, 63, 255, 1)',
    'rgba(0, 0, 255, 1)',
    'rgba(0, 0, 223, 1)',
    'rgba(0, 0, 191, 1)',
    'rgba(0, 0, 159, 1)',
    'rgba(0, 0, 127, 1)',
    'rgba(63, 0, 91, 1)',
    'rgba(127, 0, 63, 1)',
    'rgba(191, 0, 31, 1)',
    'rgba(255, 0, 0, 1)'
  ]
  heatmap.set('gradient', heatmap.get('gradient') ? null : gradient);
}

function changeRadius() {
  heatmap.set('radius', heatmap.get('radius') ? null : 20);
}

function changeOpacity() {
  heatmap.set('opacity', heatmap.get('opacity') ? null : 0.2);
}


function getPoints(bssid) {
  //Query data
  data = ipcRenderer.sendSync('getCoord');

  var googleList = [];

  data.forEach(function (gpsEntry) {

    if ((bssid === "all" || bssid === gpsEntry.BSSID) && typeof gpsEntry.Lat != 'undefined' && typeof gpsEntry.Lon != 'undefined' ) {
      var signalStrenght = 10;
      signalStrenght = signalStrenght * gpsEntry.Signal;
      googleList.push({ location: new google.maps.LatLng(gpsEntry.Lat, gpsEntry.Lon), weight: signalStrenght });
      console.log("Lat: " + gpsEntry.Lat + " Lon: " + gpsEntry.Lon);
    }

  }, this);

  return googleList;
}

function filterBSSID() {
  var bssid = document.getElementById("bssidTextBox").value;
  heatmap.set('data', getPoints(bssid));
};

function getPointsPolygonStyle() {
  var bssid = document.getElementById("bssidTextBox").value;
  var lowSignal = [];
  var mediumSignal = [];
  var hightSignal = [];


  data.forEach(function (wgEntry) {
    if (wgEntry.BSSID === bssid || bssid === allBSSID) {
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