"use strict";

import $ from 'jquery';
import _ from 'lodash';

let ajax = $.ajax;

export default class RequestHandler{
	constructor(){
		this.baseUrl = "http://jnorlin.me:3001";
		this.baseCfg = {
			type: "GET",
			dataType: "jsonp"
		}
	}

	constructUrl(url, params){
		return _.reduce(params, (acc, x, i, source) => {
			return acc+("/"+x);
		}, url)
	}

	constructQuery(route, params){
		let cfg = this.baseCfg;
		let r = this.baseUrl+"/"+route;
		let url = this.constructUrl(r, params);
		console.log(url);
		cfg.url = url;
		return ajax(cfg);
	}

	sendText(to, msg){
		let params = {
			from: "WM",
			to: to,
			msg: msg
		}
		let route = "sendText";

		return this.constructQuery(route, params);
	}

	getTurbines(){
		let route = "getTurbineIds";
		return this.constructQuery(route)
	}

	// getTurbineData(id, date, )
}