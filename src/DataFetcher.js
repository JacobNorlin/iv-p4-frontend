"use strict";

import $ from 'jquery';
import _ from 'lodash';

let ajax = $.ajax;

export default class DataFetcher{
	constructor(){
		this.baseUrl = "jnorlin.me:3001";
		this.baseCfg = {
			type: "GET",
			dataType: "jsonp"
		}
	}

	constructUrl(url, params){
		return _.reduce(params, (acc, x, i, source) => {
			acc+="/"+x;
		}, url)
	}

	constructQuery(route, params){
		let cfg = this.baseCfg;
		let url = this.baseUrl+"/"+route;
		cfg.url = url;
		if(params){
			cfg.params = params;
		}
		return ajax(cfg);
	}

	getTurbines(){
		let route = "getTurbineIds";
		return this.constructQuery(route)
	}

	// getTurbineData(id, date, )
}