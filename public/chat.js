// prevent user scroll on mobile phone
document.addEventListener('touchmove', function (e) {
    e.preventDefault()
}, false)

function handleSubmit(form) {
    const action = $(form).attr('action')
    const params = $(form).serialize()
    const url = `${action}?${params}`

    $.get(url)
        .fail(function () {
            alert('failed to send message.')
        });
}

function like(type) {
    const url = `/like?image=${type}`

    $.get(url)
        .fail(function () {
            alert('failed to like.')
        })
}

$(function () {
    FastClick.attach(document.body)
})

$(function () {
    let socket = io.connect('http://localhost:80');

    socket.on('connect', function () {
        socket.emit('msg update');
    });

    $('#comment-btn').click(function () {
        let message = $('#comment-input');
        if (message.val().length == 0){
            return;
        } else {
            socket.emit('msg send', message.val());
        }
    });
    socket.on('msg push', function (msg) {
        let format_date = moment().format("YYYY年MM月DD日 hh時mm分ss秒"); // 第一引数：日時、第二引数：フォーマット形式
        $('#list').prepend($('<div class="row"><div class="col-sm-4">' + format_date + '</div><div class="col-sm-8" style="padding-left: 0;">' + msg + '</div></div>'));
    });
    //接続されたらDBにあるメッセージを表示
    socket.on('msg open', function (msg) {
        //DBが空っぽだったら
        if (msg.length == 0) {
            return;
        } else {
            $('#list').empty();
            $.each(msg, function (key, value) {
                $('#list').prepend($('<div class="row"><div class="col-sm-4">' + value.date + '</div><div class="col-sm-8" style="padding-left: 0;">' + value.message + '</div></div>'));
            });
        }
    });

});
