"use strict";
// need map global to perform updates
var map;
function initMap() {
    $.ajax({
        url: "http://localhost:3000/getTurbineLocations",
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
                // settings
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
function displayTurbineInfo(id) {
    $.ajax({
        url: "http://localhost:3000/getTurbineDataFromdayById/" + id + "/2016/1/1",
        type: 'GET',
        crossDomain: true,
        dataType: 'jsonp',
        success: function(jsonp) {
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
    $("#turbineInfoModal").modal("show");
}
*/

