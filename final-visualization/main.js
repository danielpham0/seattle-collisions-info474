function dataPreprocessor(row) {
    return {
        X: row.X,
        Y: row.Y,
        LOC: row.LOCATION,
        SEVCODE: row.SEVERITYCODE,
        SEVDESC: row.SEVERITYDESC,
        COLTYPE: row.COLLISIONTYPE,
        PCOUNT: row.PERSONCOUNT,
        VCOUNT: row.VEHCOUNT,
        INJURY: row.INJURIES,
        SINJURY: row.SERIOUSINJURIES,
        DEAD: row.FATALITIES,
        DATETIME: row.INCDTTM,
        WEATHER: row.WEATHER,
        ROADCOND: row.ROADCOND,
        LIGHTCOND: row.LIGHTCOND
    };
}

var map = L.map('map').setView([47.6062, -122.3321], 11);
var tileLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png')
tileLayer.addTo(map)

var svg = d3.select(map.getPanes().overlayPane).append("svg"),
g = svg.append("g").attr("class", "leaflet-zoom-hide");

d3.json("neighborhoods.geojson")
  .then(function(neighborhoods){
    // Used to draw SVG paths alongside Leaflet
    const projectPoint = function(x, y) {
        const point = map.latLngToLayerPoint(new L.LatLng(y, x))
        this.stream.point(point.x, point.y)
    }
    // Creates the projections and paths using that initial function
    const projection = d3.geoTransform({point: projectPoint})
    const pathCreator= d3.geoPath().projection(projection);
    
    
    // Creates a path for each feature in the geoJson
    const areaPaths = g.selectAll('path')
        .data(neighborhoods.features)
        .join('path')
    
    const labels = g.selectAll("text")
        .data(neighborhoods.features)
        .enter()
        .append("svg:text")

    
    // Listends to changes in map and calls a reset when necessary
    map.on("viewreset", reset);

    // Init for the map
    reset();

    // Function that recreates the paths properly
    function reset() {
        // Bounds based on the neighborhood geojson and map
        bounds = pathCreator.bounds(neighborhoods);
        var topLeft = bounds[0],
        bottomRight = bounds[1];
        console.log(bounds)
        //Adjusts width and height for the svg
        svg.attr("width", bottomRight[0] - topLeft[0])
            .attr("height", bottomRight[1] - topLeft[1])
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px");
        g.attr("transform", "translate(" + -topLeft[0] + "," 
            + -topLeft[1] + ")");
        
        // Initialize each path with its attributes
        areaPaths.attr("d", pathCreator)
            .attr('fill-opacity', 0.3)
            .attr('stroke', 'black')
            .attr("z-index", 3000)
            .attr('stroke-width', 1)
            .on("mouseover", function(d){
                    d3.select(this).attr("fill", "red")
                    if (d.properties.nhood) {
                        d3.selectAll('.' + d.properties.nhood.replaceAll(' ', '_'))
                            .style("display", "block")
                    }
            })
            .on("mouseout", function(d){
                    d3.select(this).attr("fill", "black")
                    if (d.properties.nhood) {
                        d3.selectAll('.' + d.properties.nhood.replaceAll(' ', '_'))
                            .style("display", "none")
                    }
            });
        
        // add text scale for sizing up based on boundaries of the svg
        let textScale = d3.scaleLinear()
            .domain([0, 15000])
            .range([6, 22]);
        labels.text(function(d){
                return d.properties.nhood;
            })
            .attr("x", function(d){
                return pathCreator.centroid(d)[0];
            })
            .attr("y", function(d){
                return  pathCreator.centroid(d)[1];
            })
            .attr("class", function(d) {
                if (d.properties.nhood) {
                    return d.properties.nhood.replaceAll(' ', '_')
                }
            })
            .style("display", "none")
            .attr("font-size", Math.round(textScale(bottomRight[1])) + "pt")
            .attr("text-anchor","middle");
    }
  }).catch(function(error) {
    console.log(error)
  });;

d3.csv('../Collisions.csv', dataPreprocessor).then(function(dataset) {
    collisions = dataset;
    console.log(collisions)
});