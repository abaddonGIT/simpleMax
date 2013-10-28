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