"use strict";
// need map global to perform updates
var $ = require('jquery');
var cubism = require('cubism');
require('tablesorter');
require('d3');
require('jquery-ui');
require('bootstrap-webpack');
require('../css/index.css');
var workingImg = require('../resources/img/working.png');
var notWorkingImg = require('../resources/img/not_working.png');
var workingImgHighlighted = require('../resources/img/working_highlighted.png');
var notWorkingImgHighlighted = require('../resources/img/not_working_highlighted.png');
import d3 from 'd3';
import {queue} from 'd3-queue';
import tzaJson from 'json!../resources/data/tza.json';
import weatherJson from 'json!../resources/data/weather.json';


import {HeatMap, parameters} from './HeatMap.js';
import RequestHandler from './RequestHandler.js';
$("#sendTextButton").on('click', sendText);
var requestHandler = new RequestHandler();
var currentDataState = null;

var restBaseUrl = "http://ec2-52-37-141-220.us-west-2.compute.amazonaws.com:3001";

function addHeatMapParameters(heatMap){
    //Feel free to do this intelligently
    document.getElementById("heatMapParameterSelector").innerHTML = ""
    let valid_pars = new Set(["batteryCharge", "primaryLoad", "windSpeed"]);
    for(let par in parameters){
        if (valid_pars.has(par)) {
          $("#heatMapParameterSelector").append("<li><a href='#'>"+par+"</a></li>");
        }
    }
    $("#heatMapParameterSelector").on("click", (e) => {
        let newVar = parameters[e.target.innerText];
        heatMap.changeParameter(newVar);
        $("#dropdownMenu1").html(e.target.innerText+"<span class='caret'></span>");
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
            $("#heatmapLegend").empty();
            currentDataState = data;
            console.log(data);
            let firstValidDayIndex = 0;
            while (data[firstValidDayIndex].date.startsWith("00")) {
              firstValidDayIndex++;
            }
            let startDate = new Date(data[firstValidDayIndex].date);
            let endDate = new Date(data[data.length-1].date);

            $("#logStartDate").text(startDate.getDate().toString() + "/" + (startDate.getMonth()+1).toString() + "/" + (startDate.getYear()%100).toString());
            $("#logEndDate").text(endDate.getDate().toString() + "/" + (endDate.getMonth()+1).toString() + "/" + (endDate.getYear()%100).toString());
            let hm = new HeatMap({data: data,
                svg:"#heatmap",
                width: 900,
                height: 200,
                parameter: parameters.batteryCharge,
                boxSize: 14,
                legendSvg: "#heatmapLegend",
                legendWidth: 800,
                legendHeight: 15})
            addHeatMapParameters(hm);
            }});

    $("#modalHeader").text("Wind Turbine: " + id);
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
    showCubism();
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

function showCubism(){
  function random(name) {
  var value = 0,
      values = [],
      i = 0,
      last;
  return context.metric(function(start, stop, step, callback) {
    start = +start, stop = +stop;
    if (isNaN(last)) last = start;
    while (last < stop) {
      last += step;
      value = Math.max(-10, Math.min(10, value + .8 * Math.random() - .4 + .2 * Math.cos(i += .2)));
      values.push(value);
    }
    callback(null, values = values.slice((start - stop) / step));
  }, name);
}

var context = cubism.context()
    .serverDelay(0)
    .clientDelay(0)
    .step(1e3)
    .size(800);

// ADD THE TURBINES HERE
var batteryCharge = random("Battery Charge");
var windSpeed = random("Wind Speed");
var primaryLoad = random("Primary Load");

$("#graph").empty();

// CHANGE THE ID HERE
d3.select("#graph").call(function(div) {

  div.append("div")
      .attr("class", "axis")
      .call(context.axis().orient("top"));

  div.selectAll(".horizon")
      .data([batteryCharge, windSpeed, primaryLoad])
    .enter().append("div")
      .attr("class", "horizon")
      .call(context.horizon().extent([-20, 20]));

  div.append("div")
      .attr("class", "rule")
      .call(context.rule());

});
}

setUpTextingCheckboxes();





var width = $(window).width(),
    height = $(window).height()-100,
    centered;

var barWidth = width/4,
    barHeight = 70,
    barx = 0,
    bary = 0;

var projection = d3.geo.mercator()
    .scale(3600)
    .center([33, -4.6]);

var path = d3.geo.path()
    .projection(projection)
    .pointRadius(10);

var map = d3.select("#mapDiv").append("svg")
    .attr("width", width-barWidth)
    .attr("height", height);

var panel = d3.select("#panelDiv").append("svg")
    .attr("width", barWidth)
    .attr("height", height);

map.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", zoom);


var lines = [];
$.ajax({
        url: "http://jnorlin.me:3001/getTurbineLocations",
        type: 'GET',
        crossDomain: true,
        dataType: 'jsonp',
        success: function(jsonp) {
          // buildMap();
          initMap(null, tzaJson, weatherJson)
          addTurbines(jsonp);
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

initCheckBoxes();
//initiates and builds the map
function buildMap() {
    queue()
      .defer(d3.json, tzaJson)
      .defer(d3.json, "../resources/data/weather.json")
      .await(initMap);
}

function initMap(error, tza, weather) {
  console.log(weather);
  map.append("g")
      .attr("id", "regions")
    .selectAll("path")
      .data(tza.features)
    .enter().append("path")
      .attr("d", path)
      .on("click", zoom);  


    initWind(weather);

    // Draw the lines
  map.selectAll('line')
    .data(lines)
    .enter()
    .append("line")
    .attr({
      x1: function(d) {return d.x0}, 
      y1: function(d) {return d.y0}
    })
    .attr("visibility", "hidden")
    // .style('stroke', function(d) {return colourScale(d.f);})
    .call(lineAnimate);


}
function addTurbines(piggott) {
    //make the sidepanel
    piggott[1]["status"] = 1;
    console.log(piggott);
    map.selectAll(".image")
      .data(piggott)
      .enter()
      .append("image")
      .attr("x", function(d) {
          return projection([d.lng, d.lat])[0];
      })
      .attr("y", function(d) {
          return projection([d.lng, d.lat])[1];
      })
      .attr("id", function(d) {return "circle" + d.id;})
      .attr("xlink:href",function(d) {return d.status ? notWorkingImg : workingImg;})
      .attr("width", 30)
      .attr("height",30)
      .on("click", function(d){turbineClick(d.id)})
      .on("mouseenter", mouseenterTurbine)
      .on("mouseleave", mouseleaveTurbine);

  var bar = panel.selectAll("rect")
      .data(piggott)
      .enter().append("g")
      .attr("transform", function(d, i) {
       return "translate(0," + i * barHeight + ")"; });

    //add the rectangles
    bar.append("rect")
      .attr("class", "turbinerect")
      .attr("id", function(d) {return "rect"+d.id; })
      .attr("x", barx)
      .attr("y", bary)
      .attr("width", barWidth)
      .attr("height", barHeight - 1)
      .style("stroke", "white")
      .style("stroke-width", 3)
      .on("mouseenter", mouseenterTurbine)
      .on("mouseleave", mouseleaveTurbine)
      .on('click', (d) => (turbineClick(d.id)));

    $("body").attr("min-height", piggott.length * barHeight);

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
      .attr("x", barWidth - 80)
      .attr("y", (barHeight / 3) + bary)
      .attr("dy", ".38em")
      .style("fill", "white")
      .text("Status:")
      .on("mouseenter", mouseenterTurbine)
      .on("mouseleave", mouseleaveTurbine);
     

    bar.append("circle")
      .attr("cx", barWidth - 20)
      .attr("cy", (barHeight / 3) + bary)
      .attr("r",8)
      .style("fill", function(d) {return d.status ? "red" : "#43e106"});

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
    .attr("xlink:href",function(d) {return d.status ? notWorkingImgHighlighted : workingImgHighlighted;})

  d3.select("#rect" + d.id)
    .style("stroke", "#43e106")
    .style("stroke-width", 3);  
}

function mouseleaveTurbine(d) {
  d3.select("#circle" + d.id)
    .attr("xlink:href",function(d) {return d.status ? notWorkingImg : workingImg;});

  d3.select("#rect" + d.id)
    .style("stroke", "white")
    .style("stroke-width", 3);   
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

function initCheckBoxes() {

  $('#windCheckbox').click(function() {
    var $this = $(this);
    // $this will contain a reference to the checkbox   
    if ($this.is(':checked')) {
      map.selectAll("line")
        .attr("visibility","visible");
    } else {
      map.selectAll("line")
        .attr("visibility","hidden");      
    }
});
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