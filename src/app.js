"use strict";
// need map global to perform updates
var $ = require('jquery');
var cubism = require('cubism');
require('tablesorter');
require('d3');
require('jquery-ui');
require('bootstrap-webpack');
require('../css/index.css');
import d3 from 'd3';
import {queue} from 'd3-queue';

import tzaJson from 'json!../resources/data/tza.json';
import weatherJson from 'json!../resources/data/weather.json';


import {HeatMap, parameters} from './HeatMap.js';
import RequestHandler from './RequestHandler.js';


// var GoogleMapsLoader = require('google-maps'); // only for common js environments
// GoogleMapsLoader.KEY = 'AIzaSyAGe-_v3CJKidJo4RJEXAfVRrhVNnEebpU';
// GoogleMapsLoader.load(function(google) {
//     initMap();
// });

$("#sendTextButton").on('click', sendText);
var requestHandler = new RequestHandler();
var currentDataState = null;

var restBaseUrl = "http://ec2-52-37-141-220.us-west-2.compute.amazonaws.com:3001";

function addHeatMapParameters(heatMap){
    //Feel free to do this intelligently
    document.getElementById("heatMapParameterSelector").innerHTML = ""
    for(let par in parameters){
        $("#heatMapParameterSelector").append("<li><a href='#'>"+par+"</a></li>");
    }
    $("#heatMapParameterSelector").on("click", (e) => {
        let newVar = parameters[e.target.innerText];
        heatMap.changeParameter(newVar);
        $("#dropdownMenu1").html(e.target.innerText+"<span class='caret'></span>");
        // $(this).parents(".btn-group").find('.selection').val($(this).text());

    });
}


var map;
function initMap() {
    $.ajax({
        url: restBaseUrl+"/getTurbineLocations",
        type: 'GET',
        crossDomain: true,
        dataType: 'jsonp',
        success: function(jsonp) {
            map = new google.maps.Map(document.getElementById('map'), {
                center: {lat: jsonp[0]["lat"], lng: jsonp[0]["lng"]},
                zoom: 8
            });
            $.each(jsonp, function(windmillTupleIndex) {
                var windmillTuple = jsonp[windmillTupleIndex];
                displayWindmill(windmillTuple["id"],
                    windmillTuple["lat"], windmillTuple["lng"]);
            });
        },
        error: function(err) {
            console.log(err);
        }
    });
}

function displayWindmill(id, lat, lng) {
    var myLatLng = {lat: lat, lng: lng};
    var marker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        title: "" + id
    });
    marker.addListener('click', function() {
        map.setCenter(marker.getPosition());
        displayTurbineInfo(id);
    });
}

var fake_logs = {11: "Just fixed main rotor", 38:"General maintenance", 86:"Added sensors to link with Arduino"};
function displayTurbineInfo(id) {
    $("#turbineId").text("Turbine: "+id);
    $("#batteryCharge").empty();
    $("#primaryLoad").empty();
    $("#windSpeed").empty();
    $("#message").empty();
    $("#batteryChargeCheckbox").checked = false;
    $("#primaryLoadCheckbox").checked = false;
    $("#windSpeedCheckbox").checked = false;

    //ADD HEATMAP
    $.ajax({
        url: restBaseUrl+"/getAverageValuesById/"+id,
        type: 'GET',
        crossDomain: true,
        dataType: 'jsonp',
        success: (data) => {
            document.getElementById("heatmap").innerHTML = "" //TODO: FIX THIS
            currentDataState = data;
            let hm = new HeatMap({data: data, 
                svg:"#heatmap",
                width: 900,
                height: 150,
                parameter: parameters.batteryCharge,
                boxSize: 10})
            addHeatMapParameters(hm);
        }});

    $("#modalHeader").text("Turbine: " + id);
    $( "#slider-range" ).slider({
        range: true,
        min: 1,
        max: 100,
        values: [ 75, 300 ],
        slide: function( event, ui ) {
            $( "#timeRangeSlider" ).val( "Day " + ui.values[ 0 ] + " - Day " + ui.values[ 1 ] );
            showMaintenanceLogs(ui.values[ 0 ], ui.values[ 1 ], id);
        }
    });
    $( "#timeRangeSlider" ).val( "Day " + $( "#slider-range" ).slider( "values", 0 ) +
        " - Day " + $( "#slider-range" ).slider( "values", 1 ) );
    showMaintenanceLogs($( "#slider-range" ).slider( "values", 0 ), $( "#slider-range" ).slider( "values", 1 ), id);
    // showCubism();
    $("#turbineInfoModal").modal("show");
}



function showMaintenanceLogs(start, end, id) {
    $("#maintenanceTable").empty();
    $.each(fake_logs, function (key) {
        if (key >= start && key <= end) {
            if (!$('#maintenanceTableBody').length) {
                $("#maintenanceTable").append('<tbody id="maintenanceTableBody">');
            }
            var tr = $('<tr/>');
            tr.append("<td>" + key + "</td>");
            tr.append("<td>" + fake_logs[key] + "</td>");
            $("#maintenanceTableBody").append(tr);
        }
    });
    if ($('#maintenanceTableBody').length){
        var thead = $("<thead>");
        var tr = $("<tr>");
        tr.append($("<th>Date</th>"));
        tr.append($("<th>Log Text</th>"));
        thead.append(tr);
        $('#maintenanceTable').prepend(thead);
        $("#maintenanceTable").tablesorter();
    } else {
        $("#maintenanceItems").append($('<h2>').text("No results found for this time range!"));
    }
}



function setUpTextingCheckboxes(){
    let bcCheck = $("#batteryChargeCheckbox");
    let plCheck = $("#primaryLoadCheckbox");
    let wsCheck = $("#windSpeedCheckbox");
    let sendTextComment = $("#sendTextComment");    


    function addP(e, id, param){
        let bc = $("#"+id);
        if(e.target.checked){
            bc.append(id+": "+currentDataState[364][param].toFixed(3));
        }else{
            bc.empty();
        }
    }

    sendTextComment.on('input', e => {
        console.log(e);
        $("#message").text(e.target.value);
    })
    bcCheck.on('change', (e) => {
        addP(e, "batteryCharge", parameters.batteryCharge.parameter);
    })
    plCheck.on('change', (e) => {
        addP(e, "primaryLoad", parameters.primaryLoad.parameter);
    })
    wsCheck.on('change', (e) => {
        addP(e, "windSpeed", parameters.windSpeed.parameter);
    })
}

function sendText(){
    let to = $("#sendTextPhoneNumber")[0].value;
    function constructMessage(){
        let bc = $("#batteryCharge").text();
        let pl = $("#primaryLoad").text();
        let ws = $("#windSpeed").text();
        let msg =$("#message").text();
        let turbine = $("#turbineId").text();

        return turbine+"   "+bc+"   "+pl+"   "+ws+"   "+msg;//this is dumb
    }

    let msg = constructMessage();
    console.log(msg);

    if(msg && to){
        $("#sendTextModal").modal("hide");
        requestHandler.sendText(to, msg).done(x => console.log(x))
        // console.log(requestHandler.sendText(to, msg));
    }
}

setUpTextingCheckboxes();





var width = $(window).width(),
    height = $(window).height(),
    centered;

var projection = d3.geo.mercator()
    .scale(3600)
    .center([33, -4.6]);

var path = d3.geo.path()
    .projection(projection)
    .pointRadius(10);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .style("stroke","black")
    .style("stroke-width", 3)
    .on("click", zoom);


var g = svg.append("g");

var piggott;
var lines = [];
$.ajax({
        url: "http://jnorlin.me:3001/getTurbineLocations",
        type: 'GET',
        crossDomain: true,
        dataType: 'jsonp',
        success: function(jsonp) {
          piggott = jsonp;
          // buildMap();
          initMap(null, tzaJson, weatherJson)
          addTurbines();
        },
        error: function(err) {
            console.log(err);
            $.notify({
                // options
                message: 'GET Request failed!'
            },{
                type: 'danger'
            }); }
    });


//initiates and builds the map
function buildMap() {
    queue()
      .defer(d3.json, tzaJson)
      .defer(d3.json, "../resources/data/weather.json")
      .await(initMap);
}

function initMap(error, tza, weather) {
  console.log(weather);
  g.append("g")
      .attr("id", "regions")
    .selectAll("path")
      .data(tza.features)
    .enter().append("path")
      .attr("d", path)
      .on("click", zoom);  
  g.selectAll("circle")
      .data(piggott)
      .enter()
      .append("circle")
      .attr("cx", function(d) {
          return projection([d.lng, d.lat])[0];
      })
      .attr("cy", function(d) {
          return projection([d.lng, d.lat])[1];
      })
      .attr("r", 8)
      .attr("id", function(d) {return "circle" + d.id;})
      .style("fill", function(d) {return d.turbineStatus ? "#60FF2D" : "red"})
      .on("click", function(d){turbineClick(d.id)})
      .on("mouseenter", mouseenterTurbine)
      .on("mouseleave", mouseleaveTurbine)

    initWind(weather);

    // Draw the lines
  g.selectAll('line')
    .data(lines)
    .enter()
    .append("line")
    .attr({
      x1: function(d) {return d.x0}, 
      y1: function(d) {return d.y0}
    })
    // .style('stroke', function(d) {return colourScale(d.f);})
    .call(lineAnimate);


}
function addTurbines() {
    //make the sidepanel
    var bar = g.selectAll("g")
      .data(piggott)
      .enter().append("g")
      .attr("transform", function(d, i) { return "translate(0," + i * 51 + ")"; });
    
    var barWidth = 150;
    var barHeight = 50;
    var barx = 10;
    var bary = 30;

    //add the rectangles
    bar.append("rect")
      .attr("class", "turbinerect")
      .attr("id", function(d) { return "rect"+d.id; })
      .attr("x", barx)
      .attr("y", bary)
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("width", barWidth)
      .attr("height", barHeight - 1)
      .on("mouseenter", mouseenterTurbine)
      .on("mouseleave", mouseleaveTurbine)
      .on('click', (d) => (turbineClick(d.id)));

    //add text
    bar.append("text")
      .attr("x", 15)
      .attr("y", (barHeight / 3) + bary)
      .attr("dy", ".35em")
      .style("fill", "white")
      .text(function(d) { return "TurbineID: " + d.id; })
      .on("mouseenter", mouseenterTurbine)
      .on("mouseleave", mouseleaveTurbine);

    //add status text
    bar.append("text")
      .attr("x", 15)
      .attr("y", (2*barHeight / 3) + bary)
      .attr("dy", ".35em")
      .style("fill", "white")
      .text(function(d) {return d.turbineStatus ? "Status: Working" : "Status: Not working" })
      .on("mouseenter", mouseenterTurbine)
      .on("mouseleave", mouseleaveTurbine);


}
//zooming function
function zoom(d) {
  console.log(d);
  var x, y, k;

  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  g.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  g.transition()
      .duration(750)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");
}


//function for handling click on a single turbine
function turbineClick(id) {
  //TODO Open modal for details dashboard
  displayTurbineInfo(id);

}

function mouseenterTurbine(d) {
  d3.select("#circle" + d.id)
    .attr("r", 12)
    .style("stroke", "yellow");

  d3.select("#rect" + d.id)
    .style("stroke", "yellow")
    .style("stroke-width", 5);  
}

function mouseleaveTurbine(d) {
  d3.select("#circle" + d.id)
    .attr("r", 8)
    .style("stroke", "none");

  d3.select("#rect" + d.id)
    .style("stroke", "none")
    .style("stroke-width", 0);   
}


function lineAnimate(selection) {
  selection
  .attr({
    x2: function(d) {return d.x0},
    y2: function(d) {return d.y0}
  })
  .style('opacity', 0)
  .transition()
    .ease('linear')
    .duration(function(d) {return d.duration;})
    .delay(function(d) {return d.delay;})
    .attr({
      x2: function(d) {return d.x1},
      y2: function(d) {return d.y1}
    })
    .style('opacity', 0.8)
  .transition()
    .duration(1000)
    .style('opacity', 0.1)
  .each('end', function() {d3.select(this).call(lineAnimate)});
}

function initWind(weather) {
  var windData = weather.list;
  for(let i = 0; i < windData.length; i++) {
    var d = windData[i];
    var speed = d.wind.speed;
    var feelsLikeTemperature = d.main.temp;
    var lonLat0 = [d.coord.lon, d.coord.lat];

    // Scale line length proportionally to speed
    var lonLat1 = lonLatFromLonLatDistanceAndBearing(lonLat0, 15 * speed, toRad(d.wind.deg));

    var x0y0 = projection(lonLat0);
    var x1y1 = projection(lonLat1);
    var line = {
      x0: x0y0[0],
      y0: x0y0[1],
      x1: x1y1[0],
      y1: x1y1[1],
      s: speed,
      f: feelsLikeTemperature,
      duration: 8000 / speed, /* pre-compute duration */
      delay: Math.random() * 1000 /* pre-compute delay */
    };
    // console.log(line);
    lines.push(line);
  }
}

//// MATH FUNCTIONS
function toRad(deg) {return deg * Math.PI / 180;}

function toDeg(rad) {return rad * 180 / Math.PI;}

function lonLatFromLonLatDistanceAndBearing(lonLat, d, brng) {
  // brg in radians, d in km
  var R = 6371; // Earth's radius in km
  var lon1 = toRad(lonLat[0]), lat1 = toRad(lonLat[1]);
  var lat2 = Math.asin( Math.sin(lat1)*Math.cos(d/R) + Math.cos(lat1)*Math.sin(d/R)*Math.cos(brng) );
  var lon2 = lon1 + Math.atan2(Math.sin(brng)*Math.sin(d/R)*Math.cos(lat1), Math.cos(d/R)-Math.sin(lat1)*Math.sin(lat2));
  return [toDeg(lon2), toDeg(lat2)];
}
