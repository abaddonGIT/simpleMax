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
      'checkUserUrl': '/index2.php?r=lk/index',
      'authUrl': '/index2.php?r=lk/login',
      'userBlock': $('#authBlock'),
      'places': [],
      'checkString': 'Данный функционал доступен только зарегистрированным пользователям.',
      'orderPlace': null,
      'placeDesc': null,
      'sessionID': null,
      'orderLimit': 2,
      'orderLevel': null,
      'anonimus': 'true',
      'orderType': 'book',
      'userSess': null
  }

  var c = this.config;

	this.init = function () {
		//Пытаемся проверить авторизован ли пользователь на сайте
    chrome.cookies.get({'url':c.host, 'name':'extUser'}, function (cookie) {
        if (cookie) {
            c.orderLimit = 20;
            c.anonimus = 'false';
            //Внешний вид
            K.ui();
            K.addEvents();
            c.userBlock.html('<b>Вы авторизованы на сайте киномакс!</b> У вас есть возможность бронировать до 20 - ти билетов.');
        } else {
            //Если наша кукка пуста то делаем запрос
            K.ajax(function (data) {
                var logForm = $(data).find('#yw0'); 
                
                if(data.indexOf(c.checkString) === -1 && logForm[0] === undefined) {
                    c.orderLimit = 20;
                    c.anonimus = 'false';    
                    //устанавливаем кукку
                    chrome.cookies.set({'url':c.host, 'name':'extUser', 'value': 'true'});
                    c.userBlock.html('<b>Вы авторизованы на сайте киномакс!</b> У вас есть возможность бронировать до 20 - ти билетов.');
                }
                //Внешний вид
                K.ui();
                K.addEvents();
            },{'url': c.host + c.checkUserUrl, 'cont': '#content'});
        }
        
    });
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
          }
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
      //Авторизация пользователя
      D.on('click', '#getUser', K.actions.auth);
  };

  //Действия
  this.actions = {
      //Получаеи расписание сеансов
      getTimetable: function () {
          console.log(this);
          //формируем строку для запроса
          var data = c.form.serializeArray();
          c.timetableBlock.removeClass('visible');

          K.ajax(function (data) {
              K.parceTimeTable(data);   
          },{'url': data, 'cont': c.timetableBlock});
      },
      //Обработка кликов по ссылкам из таблицы расписания
      clickTableLink: function () {
          var el = $(this), href = el.attr('href');
          if (!el.hasClass('time')) {
            T.create({"url":c.host + href});
          }
          return false;  
      },
      //Показывает информацию о сеансе при наведении
      over: function () {
          var el = $(this), ar = el.data('content').split(','), e = event || window.event, mX = e.pageX, mY = e.pageY, popup = '';
          popup = '<div class="pop" style="position: absolute; top: ' + (mY - 30) + 'px; left: ' + (mX + 30) + 'px;"><b>' + ar[1] + '</b>' + ar[0] + '</div>';
          c.timetableBlock.append(popup);
      },
      //Скрывает ин-ю о сеансе при сведении
      out: function () {
          c.timetableBlock.find('.pop').remove();
      },
      //Открывает окно со схемой зала
      openFade: function () {
          var el = $(this), link;
          $('#fade').addClass('visible');
          //запоминаем идентификатор
          c.sessionID = K.getIdentify(el.attr('href'));
          link = c.host + c.bronLink + 'sessionID=' + c.sessionID;
          K.ajax(function (data) {
              K.parceBron(data);
          },{'url': link, 'cont': '#fade_content','delay': 1800});
          return false;
      },
      //Закрывает окно со схемой
      closeFade: function () {
          var el = $(this);
          el.addClass('hidden');
          $('#fade').removeClass('visible');
          $('#fade_content').html('');
          //очищаем выбранные места
          c.places = [];
          return false;
      },
      //Конец анимации закрытия окна
      animEnd: function () {
          $(this).find('.close').removeClass('hidden');
      },
      //Выбор мест на схеме зала и построение заказа
      selectPlace: function () {
          var el = $(this);
          
          if (el.hasClass('your-reserved')) {
              el.removeClass('your-reserved');
              c.places = K.updateArray(c.places, el.attr('id'));
              K.updateOrder(c.places);
          } else {
              if (Object.keys(c.places).length < c.orderLimit) {
                  el.addClass('your-reserved');
                  var id = el.attr('id'), type = el.attr('rel');

                  c.places[id] = {
                    'el': el,
                    'place': id.split('-'),
                    'type': type
                  };

                  K.updateOrder(c.places);
              } else {
                  alert('Нельзя забронировать больше ' + c.orderLimit + ' билетов за раз !!!');
              }
          }
      },
      //Создание брони
      getOrder: function () {
          var el = $(this),
              name = encodeURIComponent(c.credentials.find('input[name=user-name]').val()),
              phone = encodeURIComponent(c.credentials.find('input[name=user-phone]').val()),
              placesList = '';

              if (!name || name === undefined || name === null || name === "undefined" && c.anonimus === 'true') {
                  alert('Необходимо указать ФИО на которые будет поставлена бронь!');
              } else {//отправляем заказ
                
                  for (i in c.places) {
                      var loc = c.places[i]['place'];
                      placesList += loc[1] + ':' + loc[2] + ';';
                  }

                  if (c.anonimus === 'false') {
                      name = '';
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
      },
      //Авторизация пользователя
      auth: function () {
          var el = $(this), 
              parent = c.userBlock,  
              data = parent.serializeArray(),
              link = c.host + c.authUrl;

          K.ajax(function (data) {
              var logForm = $(data).find('#yw0'); 
              if(data.indexOf(c.checkString) === -1 && logForm[0] === undefined) {
                  $('#authBlock').html('Вы успешно авторизованы на сайте киномакс. Приятного просмотра:-)');
                  c.orderLimit = 20;
                  c.anonimus = 'false'; 
                  chrome.cookies.set({'url':c.host, 'name':'extUser', 'value': 'true'});
              } else {
                  $('#authBlock #messages').html('Вы ввели неправильные данные, или произошла трагическая случайность. Попробуйте еще раз.');
                  c.orderLimit = 2;
                  c.anonimus = 'true';
                  chrome.cookies.remove({'url':c.host, 'name':'extUser'});
              }
          },{'url': link, 'cont': '#authBlock','data': data});
          return false;
      }
  };

  /*
  * Чистить ответ для вывода расписания сеансов
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
  /*
  * Вывод схемы зала
  */
  this.parceBron = function (data) {
      var cont = '<div>' + data + '</div>';

      var br = $(cont).find('.booking');

      var css = $(cont).find('style');

      if (br[0] !== undefined) {
          $('#fade_content').html(br[0]).append(css[0]).append(br[1]);

          c.orderPlace = $('#fade_content').find('#order-place #your-order');
          c.placeDesc = $('#fade_content').find('.place-desc');
          c.credentials = $('#fade_content').find('#credentials');
          c.orderLevel = $('#fade_content').find('#mp-level-id').val();

          c.credentials.find('.get-order').remove();
          c.credentials.append('<a class="get-order" href="#">Забронировать</a>');
      } else {
          $('#fade_content').html('<h2>Ошибка выполнения запроса</h2>Извините, произошла ошибка при подключении к кинотеатру, возможно кинотеатр недоступен в данный момент, попробуйте еще раз чуть позже. Спасибо.');
      }
  }

	var K = this;
};

/*
* Делает запрос
*/
Kino.prototype.ajax = function (callback, options) {
    if (options === undefined) {
        return false;
    } else {
        if (typeof options.url === "object") {
            options.url = this.parceObjectToUrl(this.config.timetableUrl, options.url);  
        }
    }

    $.ajax({
        type: 'POST',
        dataType: options.type || "html",
        processData: true,
        url: options.url || this.config.timetableUrl,
        data: options.data,
        cache: false,
        beforeSend: function() {
            $(options.cont).append('<div class="loading">Идет подключение к кинотеатру...</div>');            
        },
        success: function(data) {
            if (options.delay !==  undefined) {
                setTimeout(function () {
                    callback(data);   
                    $(options.cont).find('.loading').remove();  
                }, options.delay);  
            } else {
                callback(data);   
                $(options.cont).find('.loading').remove();  
            }     
        }    
    });
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
