/******************************************************
 * Copyright 2013 by Abaddon <abaddongit@gmail.com>
 * @author Abaddon <abaddongit@gmail.com>
 * @version 1.0.0
 * ***************************************************/
var d = document, D = $(d), w = window, W = $(w), T = chrome.tabs, fade = d.querySelector('#fade_content'), user = false;

var Kino = function () {

    this.config = {
        'dateField': $('#date'),
        'form': $('#timetableForm'),
        'host': 'http://kinomax.ru',
        'kinopoisk': 'http://www.kinopoisk.ru/search/chrometoolbar.php?v=1&query=',
        'timetableBlock': $('#timetable'),
        'timetableUrl': 'http://kinomax.ru/index2.php',
        'bronLink': '/order/hallplan/',
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
        'userSess': null,
        'videoCount': 3
    }

    var c = this.config;

    this.init = function () {
        //Иинициализируем прагин для работы с youtube
        woolYoutube.init({
            'max-results': c.videoCount,
            'category': 'trailer'
        });
        //Пытаемся проверить авторизован ли пользователь на сайте
        K.ajax(function (data) {
            var logForm = $(data).find('#yw0');

            if (data.indexOf(c.checkString) === -1 && logForm[0] === undefined) {
                c.orderLimit = 20;
                c.anonimus = 'false';
                user = true;
                c.userBlock.html('<b>Вы авторизованы на сайте киномакс!</b> У вас есть возможность бронировать до 20 - ти билетов.');
            }
            //Внешний вид
            K.ui();
            K.addEvents();
            //Установка города из хранилища
            K.actions.setCity();
        }, { 'url': c.host + c.checkUserUrl, 'cont': '#content' });
    };

    /*
     * Инерфейс
     */
    this.ui = function () {
        $("#datepicker").datepicker({
            showWeek: true,
            firstDay: 1,
            beforeShowDay: function (date) {
                var month = date.getMonth() + 1;

                if (date.getFullYear() > K.getDate('year')) {
                    return [true, , ''];
                } else {
                    if (month < K.getDate('month')) {
                        return [false, , 'Сеасы уже прошли(-:'];
                    } else if (month > K.getDate('month')) {
                        return [true, , ''];
                    } else {
                        if (date.getDate() < K.getDate()) {
                            return [false, , 'Сеасы уже прошли(-:'];
                        } else {
                            return [true, , ''];
                        }
                    }
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
        D.on('click', '#timetable a:not(.time, .kinopoisk, .youtube), #logo', K.actions.clickTableLink);
        //Всплывающее окно при наведении на время сеанса
        D.on('mouseover', '.time', K.actions.over);
        //Удаление инфы о сеансе при сведении
        D.on('mouseleave', '.time, .kinopoisk', K.actions.out);
        //Откритие плана зала по клику на ссылку со временем сеанса
        D.on('click', '.time', K.actions.openFade);
        //Окончание анимации окна
        D.on('transitionend', '#fade, .close', K.actions.animEnd);
        //Закрытие окна
        D.on('click', '.close', K.actions.closeFade);
        //Делает бронь
        D.on('click', '#fade_content .get-order', K.actions.getOrder);
        //Авторизация пользователя
        D.on('click', '#getUser', K.actions.auth);
        //Запрос рейтинга фильма по его названию с кинопоиска
        D.on('click', '.kinopoisk', K.actions.kinopoisk);
        //Тест для получения видео с youtube
        D.on('click', '.youtube', K.actions.viewTrailer);
        //Поиск видео из строки поиска
        D.on('click', '#searchButton', K.actions.getVideoFromString);
    };

    //Действия
    this.actions = {
        getVideoFromString: function () {
            var el = $(this),
                string = fade.querySelector('input[name=searchVideo]').value;

            if (string) {
                woolYoutube.search(string, function (videos) {
                    //Если есть хоть одно видео то погнали
                    K.putVideoInPage(videos, string);
                });
            }

            return false;
        },
        //Открывает окно для просмотра трейлера к фильму
        viewTrailer: function () {
            var el = this,
                string = $(el).data('film'),
                storage,
                arr = {};
            //Проверяем нет ли такого контента в хранилище

            $('#fade').addClass('visible');

            chrome.storage.local.get('videos', function (items) {
                if (items.videos && items.videos !== undefined) {
                    storage = JSON.parse(items.videos);

                    if (storage[string]) {
                        K.putVideoInPage(storage[string]);
                    } else {
                        woolYoutube.search(string, function (videos) {
                            $('#fade').addClass('visible');
                            //Если есть хоть одно видео то погнали
                            K.putVideoInPage(videos);
                            if (videos[0]) {
                                //Сохраняем данные в хранилище
                                storage[string] = videos;
                                chrome.storage.local.set({ 'videos': JSON.stringify(storage) });
                            }
                        });
                    }
                } else {
                    woolYoutube.search(string, function (videos) {
                        $('#fade').addClass('visible');
                        //Если есть хоть одно видео то погнали
                        K.putVideoInPage(videos);
                        if (videos[0]) {
                            //Сохраняем данные в хранилище
                            arr[string] = videos;
                            chrome.storage.local.set({ 'videos': JSON.stringify(arr) });
                        }
                    });
                }
            });
            return false;
        },
        //Получаеи расписание сеансов
        getTimetable: function () {
            var e = event || window.event;
            //При выборе города сохраняем его id-шник в storange
            if (e.type === 'change') {
                //console.log(chrome);
                var val = this.value;
                chrome.storage.local.set({ 'city': val });
            }
            //формируем строку для запроса
            var data = c.form.serializeArray();
            c.timetableBlock.removeClass('visible');

            K.ajax(function (data) {
                K.parceTimeTable(data);
            }, { 'url': data, 'cont': c.timetableBlock });
        },
        //Обработка кликов по ссылкам из таблицы расписания
        clickTableLink: function () {
            var el = $(this), href = el.attr('href');
            if (!el.hasClass('time')) {
                T.create({ "url": c.host + href });
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
            link = c.host + c.bronLink + c.sessionID;
            K.ajax(function (data) {
                K.parceBron(data);
            }, { 'url': link, 'cont': '#fade_content', 'delay': 1800 });
            return false;
        },
        //Закрывает окно со схемой
        closeFade: function () {
            var el = $(this);
            el.addClass('hidden');
            $('#fade').removeClass('visible');
            fade.innerHTML = '';
            //очищаем выбранные места
            c.places = [];
            return false;
        },
        //Конец анимации закрытия окна
        animEnd: function () {
            $(this).find('.close').removeClass('hidden');
        },
        //Авторизация пользователя
        auth: function () {
            var el = $(this),
                parent = c.userBlock,
                data = parent.serializeArray(),
                link = c.host + c.authUrl;

            K.ajax(function (data) {
                var logForm = $(data).find('#yw0');
                if (data.indexOf(c.checkString) === -1 && logForm[0] === undefined) {
                    $('#authBlock').html('Вы успешно авторизованы на сайте киномакс. Приятного просмотра:-)');
                    c.orderLimit = 20;
                    c.anonimus = 'false';
                    user = true;
                    chrome.cookies.set({ 'url': c.host, 'name': 'extUser', 'value': 'true' });
                } else {
                    $('#authBlock #messages').html('Вы ввели неправильные данные, или произошла трагическая случайность. Попробуйте еще раз.');
                    c.orderLimit = 2;
                    c.anonimus = 'true';
                    user = false;
                    chrome.cookies.remove({ 'url': c.host, 'name': 'extUser' });
                }
            }, { 'url': link, 'cont': '#authBlock', 'data': data });
            return false;
        },
        //Подставляет город который пользователь выбрал последним
        setCity: function () {
            chrome.storage.local.get('city', function (items) {
                var options = $('#city option'), ln = options.length;
                while (ln--) {
                    var loc = $(options[ln]).val();
                    if (items.city === loc) {
                        $(options[ln]).attr('selected', 'selected');
                        break;
                    }
                }
                //Если город был заполнен то сразу выводим сеансы
                if (items.city && items.city !== undefined) {
                    //формируем строку для запроса
                    var data = c.form.serializeArray();
                    c.timetableBlock.removeClass('visible');

                    K.ajax(function (data) {
                        K.parceTimeTable(data);
                    }, { 'url': data, 'cont': c.timetableBlock });
                }
            });
        },
        //Запрос рейтинга фильма
        kinopoisk: function () {
            var el = $(this), film = el.data('film'),
                link = c.kinopoisk + encodeURIComponent(film),
                e = event || window.event;

            //Пытаемся получить оценку фильма из хранилища
            chrome.storage.local.get('kino', function (items) {
                if (items.kino && items.kino !== undefined) {

                    var obj = JSON.parse(items.kino);
                    //console.log(obj[film]);

                    if (obj[film] !== undefined) {
                        //Если такие данные у нас есть, то проверяем не истек ли срок годности
                        var save = obj[film]['time'] + (24 * 60 * 60), now = Math.round(new Date().getTime() / 1000.0);

                        K.showWindow({ 'text': obj[film]['rating'], 'x': e.pageX, 'y': e.pageY }); //Показывает окошко

                        if (now > save) {
                            //если время хранения истекло то сносим её
                            delete obj[film];
                            chrome.storage.local.set({ 'kino': JSON.stringify(obj) });
                        }
                    } else {//Если такого фильма нет в хранилище то делаем запрос
                        K.ajax(function (data) {
                            obj[film] = { 'rating': data.rating, 'time': Math.round(new Date().getTime() / 1000.0) };
                            chrome.storage.local.set({ 'kino': JSON.stringify(obj) });
                            K.showWindow({ 'text': obj[film]['rating'], 'x': e.pageX, 'y': e.pageY }); //Показывает окошко
                        }, { 'url': link, 'reqType': 'get', 'type': 'json' });
                    }
                } else {
                    K.ajax(function (data) {//Тут пишем полученные данные в хранилище
                        if (data.type !== undefined) {
                            var stOb = {};

                            stOb[film] = { 'rating': data.rating, 'time': Math.round(new Date().getTime() / 1000.0) };

                            chrome.storage.local.set({ 'kino': JSON.stringify(stOb) });
                            K.showWindow({ 'text': stOb[film]['rating'], 'x': e.pageX, 'y': e.pageY }); //Показывает окошко
                        }
                    }, { 'url': link, 'reqType': 'get', 'type': 'json' });
                }
            });
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

        while (ln--) {
            var loc = $(timeLinks[ln]), over = loc.attr('onmouseover');
            if (over !== undefined) {
                var ov = over.substr(4, (over.length - 2))
                    .replace("')", "")
                    .replace("', TITLE", "")
                    .replace("'", "")
                    .replace(" '", "")
                    .replace("</a>", "");

                loc.removeAttr('onmouseover').data('content', ov).addClass('time');
            }
            loc.removeAttr('onmouseout');
        }

        //Тут вставляем иконку кинопоиска и ссылку для просмотра трайлера
        var trS = $(conteiner).find('tr'), trLen = trS.length;

        for (var i = 0; i < trLen; i++) {
            var loc = $(trS[i]).find('td').first(), locA = loc.children();

            var fl = $(locA).is('span');

            if (locA[0] !== undefined && !fl) {
                locA.after('<div class="dop-inform"><a href="#" title="Узнать рейтинг фильма на кинопоиске" class="kinopoisk" data-film="' + locA.text() + '"></a><a href="#" title="Посмотреть трейлер к фильму" data-film="' + locA.text() + '" class="youtube"></a></div>');
            }
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
        var br = $(cont).find('#activity-indicator-container');
        var css = $(cont).find('style');
        if (br[0] !== undefined) {
            var indeficator = br.data('seq'), link = c.host + '/order/checkstatus?screen=700&seqID=' + indeficator;
            K.ajax(function (data) {
                var newHtml = $(data['html']);
                newHtml.find("img").remove();
                newHtml.find(".close-link").find("a")[0].removeAttribute("onclick");
                newHtml.find("#charity")[0].removeAttribute("onchange");
                $('#fade_content').append(newHtml);
            }, { 'url': link, 'cont': '#fade_content', 'delay': 1800, 'type': 'json' });
        } else {
            $('#fade_content').html('<h2>Ошибка выполнения запроса</h2>Извините, произошла ошибка при подключении к кинотеатру, возможно кинотеатр недоступен в данный момент, попробуйте еще раз чуть позже. Спасибо.');
        }
    }

    var K = this;
};

/*
 * Формирует html код для вставки видео
 */

Kino.prototype.putVideoInPage = function (videos, searchString) {
    var ln = videos.length,
        result = '';

    if (searchString === undefined) {
        searchString = '';
    }

    if (ln > 0) {
        setTimeout(function () {
            for (var i = 0; i < ln; i++) {
                result += '<div class="trailer">' +
                    '<iframe width="640" height="360" src="http://www.youtube.com/embed/' + videos[i].id + '" frameborder="0" allowfullscreen></iframe>' +
                    '</div>';
            }
            fade.innerHTML = '<div id="searchForm"><label><b>Найти другое видео:</b><input type="text" name="searchVideo" value="' + searchString + '" /></label><button id="searchButton">Найти</button></div><div id="videoResult">' + result + '</div>';
        }, 1200);
    } else {
        fade.innerHTML = '<div id="searchForm"><label><b>Найти другое видео:</b><input type="text" name="searchVideo" value="' + searchString + '" /></label><button id="searchButton">Найти</button></div><div id="videoResult"><p>Видео по этому запросу найдено не было!</p></div>';
    }
};

/*
 * Показывает всплывающее окно
 */
Kino.prototype.showWindow = function (data) {
    var popup = '<div class="pop" style="position: absolute; top: ' + (data.y - 20) + 'px; left: ' + (data.x - 50) + 'px;">' + data.text + '</div>';
    this.config.timetableBlock.append(popup);
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

        if (options.reqType === undefined) {
            options.reqType = 'post';
        }
    }

    $.ajax({
        type: options.reqType,
        dataType: options.type || "html",
        processData: true,
        url: options.url || this.config.timetableUrl,
        data: options.data,
        cache: false,
        beforeSend: function () {
            $(options.cont).append('<div class="loading">Идет подключение к кинотеатру...</div>');
        },
        success: function (data) {
            if (options.delay !== undefined) {
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

    orderPrice = orderPrice / 100;
    hallList += '<b>Сумма: ' + orderPrice + ' руб.</b>';

    if (orderPrice === 0) {
        order.css('display', 'none');
        credentials.css('display', 'none');
        order.html('');
    } else {
        order.css('display', 'block');
        credentials.css('display', 'block');
        order.html(hallList);
    }
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
 * Возвращает нужную часть даты
 */
Kino.prototype.getDate = function (what) {
    var date = new Date();

    switch (what) {
        case 'day':
            return date.getDate();
            break;
        case 'month':
            return date.getMonth() + 1;
            break;
        case 'year':
            return date.getFullYear();
            break;
        default:
            return date.getDate();
    }
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
