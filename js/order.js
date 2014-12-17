/**
 * Created on 13.09.2014.
 * description
 * Киномаксовский говнокод, руки бы им оторвать
 */
$(document).ready(function () {
    activateOrdering();
});

function displayError(msg) {
    $('#activity-indicator-container').remove();
    $('#message-text').html(msg);
    $('#error-message').show();
}

function loadResult(code) {
    $('#activity-indicator-container').remove();
    $('#error-message').remove();
    $('#full').html(code);

    if ($('#plan-container').length > 0)
        activateOrdering();

    if ($('#gw-redirector').length > 0)
        redirect();
}

function redirect() {
    location.href = $('#activity-indicator-container').data('redirect');
}

function getSelectionLimits() {
    var container = $('#plan-container');
    return {book: container.data('booklimit'), buy: container.data('buylimit')};
}

function checkIfUserReachedSeatsLimits(add) {
    var selectedSeatsCount = $('#fade_content div.selected').length;

    var selectionLimit = getSelectionLimits();
    var selectedAction = $('#action-type').val();

    if (add != undefined)
        selectedSeatsCount++;

    if (selectedAction == 'book' && selectionLimit.book < selectedSeatsCount) {
        alert('Нельзя выбрать более ' + selectionLimit.book + " мест для брони.\nПожалуйста, отмените лишние места на схеме зала.");
        return true;
    }

    if (selectedAction == 'presale' && selectionLimit.buy < selectedSeatsCount) {
        alert('Нельзя выбрать более ' + selectionLimit.buy + " мест для покупки.\nПожалуйста, отмените лишние места на схеме зала.");
        return true;
    }

    return false;
}

function activateOrdering() {
    $('<div/>', {
        id: 'ordering_overlay',
        class: 'overlay'
    }).css({
        'height': $(document).height(),
        'width': $(document).width()
    }).appendTo('body');

    $('#order-form').appendTo('body');

    $(document).on('click', '#fade_content div.plan-canvas > div.status-1', function () {
        if (checkIfUserReachedSeatsLimits(true))
            return;

        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
        }
        else {
            $(this).addClass('selected');
        }
        var currentPrice = $('#total-price').html() == '' ? 0 : parseInt($('#total-price').html());
        var type = $(this).data('type');
        var typeObj = $('div.legend-entry > span.type-' + type);
        var newPrice = $(this).hasClass('selected') ? currentPrice + parseInt(typeObj.data('price')) : currentPrice - parseInt(typeObj.data('price'));
        if (newPrice > 0) $('#total-price').html(newPrice); else $('#total-price').html('0');
        $('#total-price2').html('Итого: ' + $('#total-price').html() + '<span class="rouble">Р</span>');

        var allSelected = $('.selected');
        var places = $('#places-list');

        places.html('');
        if (allSelected.length > 0) {
            allSelected.each(function (ind) {
                place = $(this).data('place').split('-');
                $('<div>').addClass('place-entry').append($('<span>').addClass('nums').html('Ряд ' + place[0] + ', место: ' + place[1]))
                    .append($('<span>').addClass('price').html($('div.legend-entry > span.type-' + $(this).data('type')).data('price') + '<span class="rouble">Р</span>'))
                    .appendTo(places);
            });
        }
        else {
            places.html('');
        }

    });

    $(document).on('click', '#fade_content #order-continue', function (e) {
        e.preventDefault();
        if (checkIfUserReachedSeatsLimits())
            return false;

        if ($('div.selected').length == 0) {
            alert('Пожалуйста, выберите места');
            return false;
        }

        $('body').css('overflow', 'hidden');

        var orderForm = $('#order-form');
        var kmWrapper = $('#wrapper');

        var wwPos = parseInt(kmWrapper.offset().left + kmWrapper.width() / 2 - (orderForm.width() / 2));
        var whPos = parseInt($(window).scrollTop() + (orderForm.height() / 2));

        orderForm.removeClass('hidden')
            .css({'left': wwPos + 'px', 'top': whPos + 'px', 'border': '0'});

        //$('#ordering_overlay').toggle();

        var action = $('#action-type').val();
        if (action == 'presale')
            changeTypeToSale();
        else
            changeTypeToBook();

        return false;
    });

    $(d).on("click", "#finalize-order", function (e) {
        e.preventDefault();

        var isBookLimited = $('#plan-container').data('booklimited');
        var action = $('#action-type').val();
        if (action == 'book' && isBookLimited == 'Y') {
            $('#form-error').html('Лимит броней на сеанс исчерпан. Доступна покупка.');
            return false;
        }

        if (checkIfUserReachedSeatsLimits())
            return false;

        makeOrder(action);
    });

    $('#action-type').change(function () {
        if ($('#action-type').val() == 'presale')
            changeTypeToSale();
        else
            changeTypeToBook();
    });
}

function changeTypeToSale() {
    $('#surname-field').hide();
    $('#finalize-order').html('Оплатить банковской картой').val('Оплатить банковской картой');
    $('#phone-field').show();
    $('#card-field').show();

    checkIfUserReachedSeatsLimits();
}

function changeTypeToBook() {
    $('#surname-field').show();
    $('#finalize-order').html('Забронировать билеты').val('Забронировать билеты');
    $('#phone-field').hide();
    $('#card-field').hide();

    checkIfUserReachedSeatsLimits();
}

function closeOrderForm() {
    $('body').css('overflow', 'auto');
    //$('#ordering_overlay').toggle();
    $('#order-form').addClass('hidden');

    return false;
}
$(d).on("click", ".close-link a", function () {
    closeOrderForm();
    return false;
});

function makeOrder(action) {
    var selectedSeats = $('div.selected');
    var seqID = $('#plan-container').data('seq');
    var levelID = $('#plan-container').data('level');
    var seatsList = '';

    hideValidationError();

    selectedSeats.each(function () {
        var placeData = $(this).data('place').split('-');
        var dcode = $(this).data('dcode');

        seatsList = seatsList + '[r=' + placeData[0] + ';p=' + placeData[1] + ';f=0;l=' + levelID;
        if (dcode !== undefined && dcode != '0')
            seatsList += ';d=' + dcode + ']';
        else
            seatsList += ']';
    });

    if (!$('#iagree').prop('checked')) {
        showValidationError('Пожалуйста, примите условия договора-оферты');
        return false;
    }

    if ($('#email').val() == '') {
        showValidationError('Пожалуйста, укажите адрес email');
        return false;
    }

    if (action == 'book' && $('#surname').val() == '') {
        showValidationError('Пожалуйста, укажите фамилию');
        return false;
    }

    var formData = $('#ordering-form').serializeAll();

    var str = "";
    for (var i in formData) {
        if (i == 0) {
            str += "?" + formData[i].name + "=" + formData[i].value;
        } else {
            str += "&" + formData[i].name + "=" + formData[i].value;
        }
    }

    str += "&seqID=" + seqID + "&places=" + seatsList;
    chrome.tabs.create({"url": 'http://kinomax.ru/order/' + action + '/' + str}, function (tab) {
        console.log(tab);
    });

    return false;
}

function showValidationError(errMessage) {
    $('#form-error').html(errMessage).toggle();
}

function hideValidationError() {
    $('#form-error').toggle();
}

(function ($) {
    $.fn.serializeAll = function () {
        var data = $(this).serializeArray();

        $(':disabled[name]', this).each(function () {
            data.push({ name: this.name, value: $(this).val() });
        });

        return data;
    }
})(jQuery);