
window.onload = function () {
    var input = document.querySelector('#date'),
        city = document.querySelector('#city'),
        message = document.querySelector('#message'),
        storage;

    if (localStorage['options']) {
        storage = JSON.parse(localStorage['options']);
    } else {
        storage = {};
    }

    /*
    *переставлят строку с датой
    */
    var dateReplaced = function (date, subject, operand) {
        var array = date.split(subject), ln = array.length, newAr = [], i = 0;

        while (ln--) {
            newAr[i] = array[ln];
            i++;
        }
        return newAr.join(operand);
    };

    $("#datepicker").datepicker({
        showWeek: true,
        firstDay: 1,
        onSelect: function (date) {
            input.value = dateReplaced(date, '.', '-');
        }
    });
    //выставляем дату
    if (storage['date']) {
        var oric = dateReplaced(storage['date'], '-', '.');
        $("#datepicker").datepicker('setDate', oric);
        input.value = storage['date'];
    }
    //Выставляем город
    if (storage['city']) {
        var options = city.querySelectorAll('option'),
            ln = options.length;
        while (ln--) {
            var loc = options[ln];
            if (loc.value === storage['city']) {
                loc.selected = true;
            }
        }
    }

    document.querySelector('input[type=submit]').addEventListener('click', function () {
        var data = {
            'date': input.value,
            'city': city.value
        };
        //Пишем в хранилище
        localStorage['options'] = JSON.stringify(data);
        message.innerHTML = "Данные успешно обновленны!";
        event.preventDefault();
    });
}