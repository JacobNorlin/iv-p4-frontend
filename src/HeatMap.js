"use strict";

import d3 from 'd3';
import _ from 'lodash';

/**
Class for generating a d3 heatmap based on wind turbine data
*/
class HeatMap{
	
	/**
	Takes a config object containing
		Data
		DivId for heatmap
		Width
		Heigh
	@param {Object} cfg
	*/
	constructor(cfg){

		this.svg = d3.select(cfg.svg).append("svg")
		.attr("width", cfg.width)
		.attr("height", cfg.height);

		this._drawHeatMap(cfg.data, cfg.parameter);
	}

	/**
	Updates the coloring of the heatmap based on input parameter
	@param {Object} newVar - Object containing key to data object and a color scale
	*/
	changeParameter(newVar){
		this.svg.selectAll(".box")
		.attr("fill", d => {
			return newVar.scale(d[newVar.parameter]);
		});
	}

	/**
	Draw all rectangles
	@param data
	@param parameter - initial coloring parameter
	*/
	_drawHeatMap(data, parameter){
		let row = 0;
		let col = 0;
		let i = 0;
		while(i < data.length){
			if(col > 40){
				col = 0;
				row += 1;
			}
			this._drawRect(col*20,row*20);
			col += 1;
			i += 1;	
		}
		this.svg.selectAll(".box")
		.data(data)
		.on("click", (e) => {//TODO, have this actually do something useful
			console.log(e);
		})
		this.changeParameter(parameter);
	}

	/**
	Draw a single rectangle
	*/
	_drawRect(x, y){
		let h = 15;
		let w = 15
		this.svg.append("rect")
		.attr("class", "box")
		.attr("x", x)
		.attr("y", y)
		.attr("height", h)
		.attr("width", w);
	}


}

/**
Scales for the different parameters. Blue is assumed to be good, and red bad. This might not actually be correct
TODO: Add more scales? At least make the parameters not be all one color if they have a very short range.
*/
let zThScale = d3.scale.linear()
.domain([0,100])
.range(["red", "blue"]);
let percentageScale = d3.scale.linear()
.domain([0,1])
.range(["blue", "red"]);
var parameters = {
	primaryLoad:  {parameter: "avg(ac_primary_load)", scale: percentageScale},
	primaryServed: {parameter: "avg(ac_primary_served)", scale: percentageScale},
	energyCost: {parameter: "avg(battery_energy_cost)", scale: percentageScale},
	batteryInput: {parameter: "avg(battery_input_power)", scale: percentageScale},
	batteryCharge: {parameter: "avg(battery_state_of_charge)", scale: zThScale},
	capacityShorage:{parameter: "avg(capacity_shortage)", scale: percentageScale},
	excessElectricity: {parameter: "avg(excess_electricity)", scale: percentageScale},
	hughPigott: {parameter: "avg(hugh_piggott)", scale: percentageScale},
	inverterInput: {parameter: "avg(inverter_input_power)", scale: percentageScale},
	inverterOutput: {parameter: "avg(inverter_output_power)", scale: percentageScale},
	rectifierInput: {parameter: "avg(recitifier_input_power)", scale: percentageScale},
	rectifierOutput: {parameter: "avg(rectifier_output_power)", scale: percentageScale},
	unmetLoad: {parameter: "avg(unmet_load)", scale: percentageScale},
	windSpeed: {parameter: "avg(wind_speed)", scale: zThScale}
}

export {parameters, HeatMap}