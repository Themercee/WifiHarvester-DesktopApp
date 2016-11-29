# WifiHarvester-DesktopApp
The visualization tool to use after you have collected the data with the android app.

<img src="gui.png" title="WifiHarvester HeatMap" />

## How to use it
When you launch the app, you will be prompt to choose the file with the data from the android's application.
Once you choose it, you will see a heat of the place you walk. Each heat point represents Wi-Fi data.

Features:
- You can filter by SSID
- You can add heat points by switching the "informations" label to "Add data".Then click on the location to add points (to fill space between two points)
- You can delete heat points, by switching the mode like to delete (same as add)
- Get Coordinate of a specific data by click on it


## TODO

- Add false data for test
- Add number of AP

## Development
### Installation
You need to have node js and bower installed.

```
git clone https://github.com/COSIG/WifiHarvester-DesktopApp
cd WifiHarvester-DesktopApp
npm install
bower install
npm start
```

### DEBUG
To use the debug option on Windows: set DEBUG=*,-not_this