/******************************************************
 * Copyright 2013 by Abaddon <abaddongit@gmail.com>
 * @author Abaddon <abaddongit@gmail.com>
 * @version 1.0.0
 * ***************************************************/
 //Старемся отследить выход пользователя
chrome.webNavigation.onBeforeNavigate.addListener(function (result) {
  if (result.url.indexOf('http://kinomax.ru/index2.php?r=lk/logout') !== -1) {
      
  } 
});