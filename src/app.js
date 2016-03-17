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
import RequestHandler from './RequestHandler.js';


var GoogleMapsLoader = require('google-maps'); // only for common js environments
GoogleMapsLoader.KEY = 'AIzaSyAGe-_v3CJKidJo4RJEXAfVRrhVNnEebpU';
GoogleMapsLoader.load(function(google) {
    initMap();
});

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
                parameter: parameters.excessElectricity,
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
    .serverDelay(0)
    .clientDelay(0)
    .step(1e3)
    .size(700);

    let inverter = random("Inverter Output Power");
    let excess = random("Excess Electricity");
    let bar = random("Wind Speed");
    let battery = random("Battery Energy Cost");


    d3.select("#graph").call(function(div) {

      div.append("div")
      .attr("class", "axis")
      .call(context.axis().orient("top"));

      div.selectAll(".horizon")
      .data([inverter, bar, excess, battery]) //add inverter.subtract(bar) if you need to
      .enter().append("div")
      .attr("class", "horizon")
      .call(context.horizon().extent([-20, 20]));

      div.append("div")
      .attr("class", "rule")
      .call(context.rule());

    });

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
  context.on("focus", function(i) {
  d3.selectAll(".value").style("right", i == null ? null : context.size() - i + "px");
});
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
        requestHandler.sendText(to, msg).done(x => console.log(x))
        // console.log(requestHandler.sendText(to, msg));
    }
}

setUpTextingCheckboxes();
