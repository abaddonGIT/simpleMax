/******************************************************
 * Copyright 2013 by Abaddon <abaddongit@gmail.com>
 * @author Abaddon <abaddongit@gmail.com>
 * @version 1.0.0
 * ***************************************************/
var d = document, D = $(d), w = window, W = $(w);

var Kino = function () {

	this.init = function () {
		//Подрубам календарь
		$( "#datepicker" ).datepicker({
     		showWeek: true,
      		firstDay: 1,
      		beforeShowDay: function(date) {
      			if (date.getDate() < K.getDay()) {
      				return [false,, 'Сеасы уже прошли(-:'];
      			} else {
      				return [true,, ''];
      			}
    		},
    		onSelect: function () {
    			console.log(this);
    		}
    	});
	};

	/*
	* Получает текущий день
	*/
	this.getDay = function () {
		var data = new Date();
		return data.getDate();
	};

	var K = this;
};

w.onload = function () {
 	var kino = new Kino();

 	kino.init();
}