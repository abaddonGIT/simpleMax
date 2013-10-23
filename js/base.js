/******************************************************
 * Copyright 2013 by Abaddon <abaddongit@gmail.com>
 * @author Abaddon <abaddongit@gmail.com>
 * @version 1.0.0
 * ***************************************************/
var d = document, D = $(d), w = window, W = $(w);

var Kino = function () {

  this.config = {
      'dateField': $('#date'),
      'form': $('#timetableForm'),
      'timetableBlock': $('#timetable'),
      'timetableUrl': 'http://kinomax.ru/index2.php'
  }

  var c = this.config;

	this.init = function () {
		//Внешний вид
    this.ui();
    this.addEvents();
	};

  /*
  * Инерфейс
  */
  this.ui = function () {
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
          onSelect: function (date) {
              c.dateField.val(dateReplaced(date)); 
              K.actions.getTimetable(); 
          },
      });
      //переставлят строку с датой
      var dateReplaced = function (date) {
          var array = date.split('.'), ln = array.length, newAr = [], i = 0;
          
          while (ln--) {
              newAr[i] = array[ln];
              i++;
          }    

          return newAr.join('-');
      };

      //Записывает текущую дату после подгрузки
      var date = new Date();
      c.dateField.val(date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate());
  };

  /*
  * Устанавливает обработчики событий
  */

  this.addEvents = function () {
      D.on('change', '#city', K.actions.getTimetable);
  };

  //Действия
  this.actions = {
      getTimetable: function () {
          //формируем строку для запроса
          var data = c.form.serializeArray();

          K.ajax(function (data) {
              K.parceTimeTable(data);

              c.timetableBlock.html(data);    
          },{'url': data});
      }
  };

	/*
	* Получает текущий день
	*/
	this.getDay = function () {
		var data = new Date();
		return data.getDate();
	};

  /*
  * Вытаскивает то что нужно из ответа
  */

  this.parceTimeTable = function (res) {
      console.log($(res).find('table'));
  };

  /*
  * Перегоняет объект в url-ловое представление
  */
  this.parceObjectToUrl = function (start, data) {
      var url = '?', ln = data.length;

      for (var i = 0; i < ln; i++) {
              url += data[i]['name'] + '=' + data[i]['value'] + '&';    
      }

      return start + url.substr(0, url.length - 1);
  };

  /*
  * Делает запрос
  */

  this.ajax = function (callback, options) {
      if (options === undefined) {
          return false;
      } else {
          if (typeof options.url === "object") {
              options.url = this.parceObjectToUrl(c.timetableUrl, options.url);  
          }
      }

      $.ajax({
          type: 'POST',
          dataType: options.type || "html",
          processData: true,
          url: options.url || c.timetableUrl,
          data: options.data,
          cache: false,
          beforeSend: function() {
                    
          },
          success: function(data) {
              callback(data);          
          }    
      });
  };

	var K = this;
};

w.onload = function () {
 	var kino = new Kino();

 	kino.init();
}