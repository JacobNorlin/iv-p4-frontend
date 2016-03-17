"use strict";

import d3 from 'd3';
import _ from 'lodash';
import $ from 'jquery';		
require('bootstrap-webpack');


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

		this.legendWidth = cfg.legendWidth;
		this.legendHeight = cfg.legendHeight;

		this.legendSvg = d3.select(cfg.legendSvg).append("svg")
		.attr("width", cfg.width)
		.attr("height", 40);
		this.data = cfg.data;
		this._drawHeatMap(cfg.data, cfg.parameter, cfg.boxSize);
		this._drawLegend(cfg.parameter, cfg.legendWidth, cfg.legendHeight);
	}

	/**
	Updates the coloring of the heatmap based on input parameter
	@param {Object} newVar - Object containing key to data object and a color scale
	*/
	changeParameter(newVar){
		this.currentParameter = newVar;
		this.svg.selectAll(".box")
		.attr("fill", d => {
			return newVar.scale(d[newVar.parameter]);
		});
		this._drawLegend(newVar, this.legendWidth, this.legendHeight)
	}

	_drawLegend(parameter, w, h){
		let domain = parameter.scale.domain();
		this.legendSvg.html("");
		let colors = _.map(domain, x => {
			return parameter.scale(x);
		})

		var gradient = this.legendSvg.append("defs")
		.append("linearGradient")
		.attr("id", "gradient")

		//add stop points
		for(let i = 1; i<=colors.length; i++){
			let stopPercent = (100-(100/i));
			gradient.append("stop")
				.attr("offset", stopPercent+"%")
				.attr("stop-color", colors[i-1])
				.attr("stop-opacity", 1);

			this.legendSvg.append("text")
			.attr("x", w*(stopPercent/100))
			.attr("y", 60)
			.attr("font-size", 20)
			.attr("fill", "black")
			.text("TEEST");

		}


		let rect = this.legendSvg.append("rect")
		.attr("width", w)
		.attr("height", h)
		.style("fill", "url(#gradient)");

		// let a = rect.

		// console.log(a);
	}

	/**
	Draw all rectangles
	@param data
	@param parameter - initial coloring parameter
	*/
	_drawHeatMap(data, parameter, boxSize){
		let row = 0;
		let col = 0;
		let i = 0;
		let d = boxSize+6;
		while(i < data.length){
			if(col > 40){
				col = 0;
				row += 1;
			}
			this._drawRect(col*d,row*d, boxSize);
			col += 1;
			i += 1;	
		}
		this.svg.selectAll(".box")
		.data(data)
		.on("click", (e) => {//TODO, have this actually do something useful
			let heatMapModal = $("#heatMapModal");
			let content = $("#heatMapModalContent");
			let info = _.reduce(e, (result, value, key) => {
				return result+"<b>"+key+"</b>: "+value+"\n";
			},"")
			content.empty();
			content.append(info);
			heatMapModal.modal("show");

		})
		.on('mouseover', function(e){
			d3.select(this.parentNode.appendChild(this)).transition().duration(300)
			.style({'stroke-opacity':1,'stroke':'#00000'});
		})
		.on('mouseout', function(e){
			d3.select(this.parentNode.appendChild(this)).transition().duration(300)
			.style({'stroke-opacity':0,'stroke':'#00000'});
		})
		this.changeParameter(parameter);
	}

	/**
	Draw a single rectangle
	*/
	_drawRect(x, y, boxSize){
		let h = boxSize;
		let w = boxSize;
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
.range(["#CD5959", "#6baed6"]);
let percentageScale = d3.scale.linear()
.domain([0,0.5])
.range(["#6baed6", "#CD5959"]);
let windScale = d3.scale.linear()
.domain([0,8,25])
.range(["black", "#BBED79", "#CD5959"])
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
	windSpeed: {parameter: "avg(windSpeed)", scale: windScale}
}

export {parameters, HeatMap}