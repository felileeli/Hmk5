// This script demonstrates some simple things one can do with leaflet.js


var map = L.map('map').setView([40.71,-73.93], 11);

// set a tile layer to be CartoDB tiles 
var CartoDBTiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{
  attribution: 'Map Data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> Contributors, Map Tiles &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
});

// add these tiles to our map
map.addLayer(CartoDBTiles);


var neighborhoodstwoGeoJSON;

// use jQuery get geoJSON to grab geoJson layer, parse it, then plot it on the map using the plotDataset function
$.getJSON( "geojson/NYC_neighborhood_data.geojson", function( data ) {
    var dataset = data;
    // draw the dataset on the map
    plotDataset(dataset);
    //create the sidebar with links to fire polygons on the map
    createListForClick(dataset);
});

// function to plot the dataset passed to it
function plotDataset(dataset) {
    acsGeoJSON = L.geoJson(dataset, {
        style: acsStyle,
        onEachFeature: acsOnEachFeature
    }).addTo(map);
}

// function that sets the style of the geojson layer
var acsStyle = function (feature, latlng) {

    var calc = calculatePercentage(feature);

    var style = {
        weight: 1,
        opacity: .25,
        color: 'grey',
        fillOpacity: fillOpacity(calc[1]),
        fillColor: fillColorPercentage(calc[1])

    };

    return style;

}

function calculatePercentage(feature) {
    var output = [];
    var numerator = parseFloat(feature.properties.Employed);
    var denominator = parseFloat(feature.properties.Unemployed);
    var percentage = (feature.properties.UnempRate) * 100;
    output.push(numerator);
    output.push(denominator);
    output.push(percentage);
    return output;    
}

// function that fills polygons with color based on the data
function fillColorPercentage(d) {
    return d > 4000 ?'#006d2c' :
           d > 1000 ?'#31a354' :
           d > 500 ? '#74c476' :
           d > 200 ? '#a1d99b' :
           d > 100 ? '#c7e9c0' :
                    '#edf8e9';
}

// function that sets the fillOpacity of layers -- if % is 0 then make polygons transparent
function fillOpacity(d) {
    return d == 0 ? 0.0 :
                    0.75;
}


// empty L.popup so we can fire it outside of the map
var popup = new L.Popup();

// set up a counter so we can assign an ID to each layer
var count = 0;

// on each feature function that loops through the dataset, binds popups, and creates a count
var acsOnEachFeature = function(feature,layer){
    var calc = calculatePercentage(feature);

    // let's bind some feature properties to a pop up with an .on("click", ...) command. We do this so we can fire it both on and off the map
    layer.on("mouseover", function (e) {
        var bounds = layer.getBounds();
        var popupContent = "<strong>Neighbourhood:</strong>"+ (feature.properties.NYC_NEIG)+"<br><strong>Unemployment Rate:</strong>" + Math.round((feature.properties.UnempRate)*100)+ "%";
        popup.setLatLng(bounds.getCenter());
        popup.setContent(popupContent);
        map.openPopup(popup);
    });

    // we'll now add an ID to each layer so we can fire the popup outside of the map
    layer._leaflet_id = 'LayerID' + count;
    count++;
    //console.log(layer._leaflet_id);

}


// add in a legend to make sense of it all
// create a container for the legend and set the location

var legend = L.control({position: 'bottomright'});

// using a function, create a div element for the legend and return that div
legend.onAdd = function (map) {

    // a method in Leaflet for creating new divs and setting classes
    var div = L.DomUtil.create('div', 'legend'),
        amounts = [0,100, 200, 500, 1000, 4000];

        div.innerHTML += '<p>Unemployment Level in NYC Neighbourhood</p>';

        for (var i = 0; i < amounts.length; i++) {
            div.innerHTML +=
                '<i style="background:' + fillColorPercentage(amounts[i] + 1) + '"></i> ' +
                amounts[i] + (amounts[i + 1] ? '&ndash;' + amounts[i + 1] + '<br />' : '<br />');
        }

    return div;
};


// add the legend to the map
legend.addTo(map);



// function to create a list in the right hand column with links that will launch the pop-ups on the map
function createListForClick(dataset) {
    // use d3 to select the div and then iterate over the dataset appending a list element with a link for clicking and firing
    // first we'll create an unordered list ul elelemnt inside the <div id='list'></div>. The result will be <div id='list'><ul></ul></div>
    var ULs = d3.select("#list")
                .append("ul");


    // now that we have a selection and something appended to the selection, let's create all of the list elements (li) with the dataset we have 
    
    ULs.selectAll("li")
        .data(dataset.features)
        .enter()
        .append("li")
        .html(function(d) { 
            return '<a href="#">' + d.properties.NYC_NEIG+ '</a>'; 
        })

        .on('mouseover', function(d, i) {
            console.log(d.properties.NYC_NEIG);
            console.log(i);
            var leafletId = 'LayerID' + i;
            map._layers[leafletId].fire('mouseover');
        });


}

// use jQuery get geoJSON to grab geoJson layer, parse it, then plot it on the map using the plotDataset function
// let's add the subway lines
$.getJSON( "geojson/MTA_subway_lines.geojson", function( data ) {
    // ensure jQuery has pulled all data out of the geojson file
    var subwayLines = data;


    // style for subway lines
    var subwayStyle = {
        "color": "#a5a5a5",
        "weight": 1,
        "opacity": 0.80
    };

    // function that binds popup data to subway lines
    var subwayClick = function (feature, layer) {
        // let's bind some feature properties to a pop up
        layer.bindPopup(feature.properties.Line);
    }

    // using L.geojson add subway lines to map
    subwayLinesGeoJSON = L.geoJson(subwayLines, {
        style: subwayStyle,
        onEachFeature: subwayClick
    }).addTo(map);

});


// lets add data from the API now
// set a global variable to use in the D3 scale below
// use jQuery geoJSON to grab data from API
$.getJSON( "https://data.cityofnewyork.us/resource/erm2-nwe9.json?$$app_token=rQIMJbYqnCnhVM9XNPHE9tj0g&borough=BROOKLYN&complaint_type=Noise&status=Open", function( data ) {
    var dataset = data;
    // draw the dataset on the map
    plotAPIData(dataset);

});

// create a leaflet layer group to add your API dots to so we can add these to the map
var apiLayerGroup = L.layerGroup();

// since these data are not geoJson, we have to build our dots from the data by hand
function plotAPIData(dataset) {
    // set up D3 ordinal scle for coloring the dots just once
    var ordinalScale = setUpD3Scale(dataset);
    //console.log(ordinalScale("Noise, Barking Dog (NR5)"));


    // loop through each object in the dataset and create a circle marker for each one using a jQuery for each loop
    $.each(dataset, function( index, value ) {

        // check to see if lat or lon is undefined or null
        if ((typeof value.latitude !== "undefined" || typeof value.longitude !== "undefined") || (value.latitude && value.longitude)) {
            // create a leaflet lat lon object to use in L.circleMarker
            var latlng = L.latLng(value.latitude, value.longitude);
     
            var apiMarker = L.circleMarker(latlng, {
                stroke: false,
                fillColor: ordinalScale(value.descriptor),
                fillOpacity: 1,
                radius: 5
            });

            // bind a simple popup so we know what the noise complaint is
            apiMarker.bindPopup(value.descriptor);

            // add dots to the layer group
            apiLayerGroup.addLayer(apiMarker);

        }

    });

    apiLayerGroup.addTo(map);

}

function setUpD3Scale(dataset) {
    //console.log(dataset);
    // create unique list of descriptors
    // first we need to create an array of descriptors
    var descriptors = [];

    // loop through descriptors and add to descriptor array
    $.each(dataset, function( index, value ) {
        descriptors.push(value.descriptor);
    });

    // use underscore to create a unique array
    var descriptorsUnique = _.uniq(descriptors);

    // create a D3 ordinal scale based on that unique array as a domain
    var ordinalScale = d3.scale.category20()
        .domain(descriptorsUnique);

    return ordinalScale;

}



