"use strict";
// need map global to perform updates
var $ = require('jquery');
var cubism = require('cubism');
require('tablesorter');
require('d3');
require('jquery-ui');
require('bootstrap-webpack');
require('../css/index.css');

import {HeatMap, parameters} from './HeatMap.js';


var GoogleMapsLoader = require('google-maps'); // only for common js environments
GoogleMapsLoader.KEY = 'AIzaSyAGe-_v3CJKidJo4RJEXAfVRrhVNnEebpU';
GoogleMapsLoader.load(function(google) {
    initMap();
});




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
    $.ajax({
        url: restBaseUrl+"/getTurbineDataFromdayById/" + id + "/2016/1/1",
        type: 'GET',
        crossDomain: true,
        dataType: 'jsonp',
        success: function(jsonp) {
            console.log(jsonp);
            $.each(jsonp, function(rowIndex) {
                var rowTuple = jsonp[rowIndex];
                var tr = $("<tr/>");
                tr.append("<td>" + rowTuple["date"] + "</td>");
                tr.append("<td>" + rowTuple["endTime"] + "</td>");
                tr.append("<td>" + rowTuple["windSpeed"] + "</td>");
                tr.append("<td>" + rowTuple["ac_primary_load"] + "</td>");
                tr.append("<td>" + rowTuple["hugh_piggott"] + "</td>");
                tr.append("<td>" + rowTuple["ac_primary_served"] + "</td>");
                tr.append("<td>" + rowTuple["excess_electricity"] + "</td>");
                tr.append("<td>" + rowTuple["unmet_load"] + "</td>");
                tr.append("<td>" + rowTuple["capacity_shortage"] + "</td>");
                tr.append("<td>" + rowTuple["inverter_input_power"] + "</td>");
                tr.append("<td>" + rowTuple["inverter_output_power"] + "</td>");
                tr.append("<td>" + rowTuple["recitifier_input_power"] + "</td>");
                tr.append("<td>" + rowTuple["rectifier_output_power"] + "</td>");
                tr.append("<td>" + rowTuple["battery_input_power"] + "</td>");
                tr.append("<td>" + rowTuple["battery_state_of_charge"] + "</td>");
                tr.append("<td>" + rowTuple["battery_energy_cost"] + "</td>");
                $("#turbineTable").append(tr);
            });
            $("#turbineTable").tablesorter();
        },
        error: function(err) {
            console.log(err);
        }
    });

    //ADD HEATMAP
    $.ajax({
        url: restBaseUrl+"/getAverageValuesById/1",
        type: 'GET',
        crossDomain: true,
        dataType: 'jsonp',
        success: (data) => {
            document.getElementById("heatmap").innerHTML = "" //TODO: FIX THIS
            let hm = new HeatMap({data: data, 
                svg:"#heatmap",
                width: 600,
                height: 300,
                parameter: parameters.excessElectricity,
                boxSize: 15})
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

function showCubism() {
    var context = cubism.context()
        .step(1e4)
        .size(1440);

    d3.select("#graph").selectAll(".axis")
        .data(["top", "bottom"])
        .enter().append("div")
        .attr("class", function(d) { return d + " axis"; })
        .each(function(d) { d3.select(this).call(context.axis().ticks(12).orient(d)); });

    d3.select("#graph").append("div")
        .attr("class", "rule")
        .call(context.rule());

    d3.select("#graph").selectAll(".horizon")
        .data(d3.range(1, 50).map(random))
        .enter().insert("div", ".bottom")
        .attr("class", "horizon")
        .call(context.horizon().extent([-10, 10]));

    context.on("focus", function(i) {
        d3.selectAll(".value").style("right", i == null ? null : context.size() - i + "px");
    });

    // Replace this with context.graphite and graphite.metric!
    function random(x) {
        var value = 0,
            values = [],
            i = 0,
            last;
        return context.metric(function(start, stop, step, callback) {
            start = +start, stop = +stop;
            if (isNaN(last)) last = start;
            while (last < stop) {
                last += step;
                value = Math.max(-10, Math.min(10, value + .8 * Math.random() - .4 + .2 * Math.cos(i += x * .02)));
                values.push(value);
            }
            callback(null, values = values.slice((start - stop) / step));
        }, x);
    }
}

