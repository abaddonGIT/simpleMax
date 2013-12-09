/******************************************************
 * Copyright 2013 by Abaddon <abaddongit@gmail.com>
 * @author Abaddon <abaddongit@gmail.com>
 * @version 1.0.0
 * ***************************************************/
 //Тут смотрим если на сайте был переход по ссылке выхода то сносим куку
 chrome.webNavigation.onBeforeNavigate.addListener(function (details) {
 	if (details.url.indexOf('http://kinomax.ru/index2.php?r=lk/logout') !== -1) {
 		//сносим куку
 		chrome.cookies.remove({'url':'http://kinomax.ru','name':'extUser'});
 	}
 });
 //отлавливаем операции по записи в storage
 chrome.storage.onChanged.addListener(function (changes, areaName) {
  //chrome.storage.local.remove('kino');
    chrome.storage.local.getBytesInUse('kino', function (bytesInUse) {
        //Если максимальный размер превышен то чистим хранилище
        if (bytesInUse > 600) {
            chrome.storage.local.remove('kino');
        } 
    });
 });

 //Оповещения
 window.onload = function () {
     var options,
         machineDate = new Date(), //Текущая дата
         seanceUrl = 'http://kinomax.ru/index2.php?r=schedule/lk',
         config = {},
         timer = null,
         frequency = 1800,
     createElement = function (html) {
         var div = document.createElement('div');
         div.innerHTML = '<div>' + html + '</div>';
         var el = div.childNodes[0];
         div.removeChild(el);
         return el;
     },
        checkSeance = function () {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', seanceUrl + '&date=' + date + '&city=' + city, true);
            xhr.onload = function (e) {
                if (this.status == 200) {
                    var response = createElement(this.response),
                        blocks = response.querySelectorAll('.user-sessions-container'),
                        ln = blocks.length,
                        kino = '';

                    if (ln) {
                        while (ln--) {
                            kino += ', ' + blocks[ln].querySelector('a').innerHTML;
                        }
                        kino = kino.substr(1, kino.length);
                        var config = {
                            type: "basic",
                            title: 'Бронирование билетов!!!',
                            message: 'На ' + date + ' число стало доступно бронирование билетов в кинотеатрах: ' + kino,
                            iconUrl: "../img/icon_128.png"
                        };

                        chrome.notifications.getAll(function (notifications) {
                            if (notifications['seance']) {
                                chrome.notifications.clear('seance', function (wasCleared) {
                                    chrome.notifications.create('seance', config, function () { });
                                });
                            } else {
                                chrome.notifications.create('seance', config, function () { });
                            }
                        });
                    }
                }
            }
            xhr.send();
        };

     if (localStorage['options']) {
         options = JSON.parse(localStorage['options']),
         date = options['date'],
         city = options['city'];
         //Если задано дата сеанса для проверки то запускаем
         if (date) {
             var locDay = machineDate.getDate(),
                 locMonth = machineDate.getMonth() + 1,
                 locYear = machineDate.getFullYear(),
                 storageDate = date.split('-');

             //Проверяем актуален ли еще выбранный сеанс

             if (storageDate[0] >= locYear && storageDate[1] >= locMonth && storageDate[2] >= locDay) {
                 //Если город не задан то ставим Тамбов
                 if (!city) {
                     city = 13;
                 }
                 //Делаем запрос для проверки возможности брони
                 checkSeance();
                 timer = setInterval(checkSeance, frequency * 1000);
             } else {
                 clearInterval(timer);
             }
         }
     }
 };