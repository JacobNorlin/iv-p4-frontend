"use strict";
// need map global to perform updates
var $ = require('jquery');
require('cubism');
require('tablesorter');
require('d3');
require('jquery-ui');
require('bootstrap-webpack');
//css
require('../css/index.css');

alert("hi");
var GoogleMapsLoader = require('google-maps'); // only for common js environments
GoogleMapsLoader.KEY = 'AIzaSyAGe-_v3CJKidJo4RJEXAfVRrhVNnEebpU';
//GoogleMapsLoader.onLoad(function(google) {
//    alert("hey2");
//    initMap();
//});
GoogleMapsLoader.load(function(google) {
    initMap();
});
var map;
function initMap() {
    $.ajax({
        url: "http://ec2-54-88-180-198.compute-1.amazonaws.com:3000/getTurbineLocations",
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
            $.notify({
                // options
                message: 'GET Request failed!'
            },{
                type: 'danger'
            }); }
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
        url: "http://ec2-54-88-180-198.compute-1.amazonaws.com:3000/getTurbineDataFromdayById/" + id + "/2016/1/1",
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
            $.notify({
                message: 'GET Request failed!'
            },{
                type: 'danger'
            }); }
    });


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

