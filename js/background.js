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