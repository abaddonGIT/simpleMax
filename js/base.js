/******************************************************
 * Copyright 2013 by Abaddon <abaddongit@gmail.com>
 * @author Abaddon <abaddongit@gmail.com>
 * @version 1.0.0
 * ***************************************************/
var d = document, D = $(d), w = window, W = $(w), T = chrome.tabs;

var Kino = function () {

  this.config = {
      'dateField': $('#date'),
      'form': $('#timetableForm'),
      'host': 'http://kinomax.ru',
      'timetableBlock': $('#timetable'),
      'timetableUrl': 'http://kinomax.ru/index2.php',
      'bronLink': '/schedule/hallplan.php?type=book&',
      'host': 'http://kinomax.ru',
      'orderLink': '/schedule/booking.php?',
      'places': [],
      'orderPlace': null,
      'placeDesc': null,
      'sessionID': null,
      'orderLimit': 2,
      'orderLevel': null,
      'anonimus': 'true',
      'orderType': 'book'
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
              c.dateField.val(K.dateReplaced(date)); 
              K.actions.getTimetable(); 
          },
      });

      //Записывает текущую дату после подгрузки
      var date = new Date();
      c.dateField.val(date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate());
  };

  /*
  * Устанавливает обработчики событий
  */
  this.addEvents = function () {
      D.on('change', '#city', K.actions.getTimetable);
      //перехватываем клики по ссылкам
      D.on('click', '#timetable a:not(.time), #logo', K.actions.clickTableLink);
      //Всплывающее окно при наведении на время сеанса
      D.on('mouseover','.time', K.actions.over);
      //Удаление инфы о сеансе при сведении
      D.on('mouseleave', '.time', K.actions.out);
      //Откритие плана зала по клику на ссылку со временем сеанса
      D.on('click', '.time', K.actions.openFade);
      //Окончание анимации окна
      D.on('transitionend', '#fade, .close', K.actions.animEnd);
      //Закрытие окна
      D.on('click', '.close', K.actions.closeFade);
      //Выбор места
      D.on('click', '#fade_content .hall-place:not(.reserved-2):not(.reserved-3)', K.actions.selectPlace);
      //Делает бронь
      D.on('click', '#fade_content .get-order', K.actions.getOrder);
  };

  //Действия
  this.actions = {
      getTimetable: function () {
          //формируем строку для запроса
          var data = c.form.serializeArray();
          c.timetableBlock.removeClass('visible');

          K.ajax(function (data) {
              K.parceTimeTable(data);
              //c.timetableBlock.html(data);    
          },{'url': data, 'cont': c.timetableBlock});
      },
      clickTableLink: function () {
          var el = $(this), href = el.attr('href');
          if (!el.hasClass('time')) {
            T.create({"url":c.host + href});
          }
          return false;  
      },
      over: function () {
          var el = $(this), ar = el.data('content').split(','), e = event || window.event, mX = e.pageX, mY = e.pageY, popup = '';
          popup = '<div class="pop" style="position: absolute; top: ' + (mY - 30) + 'px; left: ' + (mX + 30) + 'px;"><b>' + ar[1] + '</b>' + ar[0] + '</div>';
          c.timetableBlock.append(popup);
      },
      out: function () {
          c.timetableBlock.find('.pop').remove();
      },
      openFade: function () {
          var el = $(this), link;
          $('#fade').addClass('visible');
          //запоминаем идентификатор
          c.sessionID = K.getIdentify(el.attr('href'));
          link = c.host + c.bronLink + 'sessionID=' + c.sessionID;
          K.ajax(function (data) {
              K.parceBron(data);
          },{'url': link, 'cont': '#fade_content'});

          return false;
      },
      closeFade: function () {
          var el = $(this);
          el.addClass('hidden');
          $('#fade').removeClass('visible');
          $('#fade_content').html('');
          //очищаем выбранные места
          c.places = [];
          return false;
      },
      animEnd: function () {
          $(this).find('.close').removeClass('hidden');
      },
      selectPlace: function () {
          var el = $(this);
          
          if (el.hasClass('your-reserved')) {
              el.removeClass('your-reserved');
              c.places = K.updateArray(c.places, el.attr('id'));
              K.updateOrder(c.places);
          } else {
              if (Object.keys(c.places).length < 2) {
                  el.addClass('your-reserved');
                  var id = el.attr('id'), type = el.attr('rel');

                  c.places[id] = {
                    'el': el,
                    'place': id.split('-'),
                    'type': type
                  };

                  K.updateOrder(c.places);
              } else {
                  alert('Нельзя забронировать больше двух билетов за раз !!!');
              }
          }
      },
      getOrder: function () {
          var el = $(this),
              name = encodeURIComponent(c.credentials.find('input[name=user-name]').val()),
              phone = encodeURIComponent(c.credentials.find('input[name=user-phone]').val()),
              placesList = '';

              if (!name || name === undefined || name === null) {
                  alert('Необходимо указать ФИО на которые будет поставлена бронь!');
              } else {//отправляем заказ
                
                  for (i in c.places) {
                      var loc = c.places[i]['place'];
                      placesList += loc[1] + ':' + loc[2] + ';';
                  }

                  link = c.host + c.orderLink + 'sessionID=' + c.sessionID + '&act=' + c.orderType + '&placesList=' + placesList + '&customerName=' + name + '&levelID=' + c.orderLevel + '&anonymous=' + c.anonimus + '&phone=' + phone;
                  //Отсылаем запрос
                  K.ajax(function (data) {
                      var res = $('<div>' + data + '</div>').find('.film-col');
                      res.find('ul').remove();
                      $('#fade_content').html(res[0]);
                  },{'url': link, 'cont': '#fade_content'});
              }
          return false;
      }
  };

  /*
  * Вытаскивает то что нужно из ответа
  */

  this.parceTimeTable = function (res) {
      var conteiner = $(res).find('.user-sessions-container');

      //console.log(conteiner);
      //Удаляем лишние события
      conteiner.find('span').removeAttr('onmouseout').removeAttr('onmouseover');

      var timeLinks = conteiner.find('a'), ln = timeLinks.length;

      while(ln--) {
        var loc = $(timeLinks[ln]), over = loc.attr('onmouseover');
        if (over !== undefined) {
          var ov = over.substr(4, (over.length - 2))
            .replace("')","")
            .replace("', TITLE","")
            .replace("'","")
            .replace(" '","")
            .replace("</a>","");

          loc.removeAttr('onmouseover').data('content', ov).addClass('time');
        }
        
        
        loc.removeAttr('onmouseout');
      }

      if (conteiner[0] === undefined) {
          c.timetableBlock.html('<b class="noresults">Сеансов в данном городе на это число не обнаруженно!</b>');
      } else {
          c.timetableBlock.html(conteiner); 
      }

      c.timetableBlock.addClass('visible');
  };

  this.parceBron = function (data) {
      var cont = '<div>' + data + '</div>';

      var br = $(cont).find('.booking');

      var css = $(cont).find('style');

      $('#fade_content').html(br[0]).append(css[0]).append(br[1]);

      c.orderPlace = $('#fade_content').find('#order-place #your-order');
      c.placeDesc = $('#fade_content').find('.place-desc');
      c.credentials = $('#fade_content').find('#credentials');
      c.orderLevel = $('#fade_content').find('#mp-level-id').val();

      c.credentials.find('.get-order').removeAttr('onclick');
  }

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
              $(options.cont).append('<div class="loading">Идет подключение к кинотеатру...</div>');            
          },
          success: function(data) {
              callback(data);   
              $(options.cont).find('.loading').remove();       
          }    
      });
  };

	var K = this;
};
/*
* Обновление заказа
*/
Kino.prototype.updateOrder = function (array) {
    var order = this.config.orderPlace, desc = this.config.placeDesc, credentials = this.config.credentials, orderPrice = 0, hallList = '<b>Вами выбраны следующие места:</b>';

    for (i in array) {
        var prItem = desc.find('.' + array[i]['type']).next().find('.price-sum');
        orderPrice += parseInt(prItem.attr('id'));
        hallList += '<div class="orderPlace">' + array[i]['place'][1] + ' ряд, ' + array[i]['place'][2] + ' место.' + prItem.text() + '</div>';
    }

    orderPrice = orderPrice/100;
    hallList += '<b>Сумма: ' + orderPrice + ' руб.</b>';

    if (orderPrice === 0) {
        order.css('display', 'none');
        credentials.css('display', 'none');
        order.html('');
    } else {
        order.css('display', 'block');
        credentials.css('display','block');
        order.html(hallList);
    }

    //console.log(orderPrice);

};

/*
* Удаление выбранных мест
*/
Kino.prototype.updateArray = function (array, remove) {
    var newA = [];

    for (i in array) {
        if (i !== remove) {
           newA[i] = array[i]; 
        }
    }

    return newA;
}

/*
* Получает идентификатор для запроса схемы зала
*/
Kino.prototype.getIdentify = function (link) {
    var ar = link.split('/'), ses = ar[3].split('.');
    return ses[0];
}

/*
* Получает текущий день
*/
Kino.prototype.getDay = function () {
    var data = new Date();
    return data.getDate();
};

/*
*переставлят строку с датой
*/ 
Kino.prototype.dateReplaced = function (date) {
  var array = date.split('.'), ln = array.length, newAr = [], i = 0;
          
  while (ln--) {
    newAr[i] = array[ln];
    i++;
  }    
  return newAr.join('-');
};

/*
* Перегоняет объект в url-ловое представление
*/
Kino.prototype.parceObjectToUrl = function (start, data) {
    var url = '?', ln = data.length;

    for (var i = 0; i < ln; i++) {
        url += data[i]['name'] + '=' + data[i]['value'] + '&';    
    }
    return start + url.substr(0, url.length - 1);
};



w.onload = function () {
 	var kino = new Kino();
 	kino.init();
}
