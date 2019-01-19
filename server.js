const path = require('path');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const extend = require('util')._extend;
const mongoose = require('mongoose');
const dateformat = require('dateformat');
const basicAuth = require('basic-auth-connect');
require('console-stamp')(console, '[HH:MM:ss.l]');

const refererCheck = (req, res, next) => {
    if (req.get('Referer')) {
        next()
    } else {
        res.status(404).end()
    }
};

const autoLink = (str) => {
    let regexp_url = /((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))/g; // ']))/;
    let regexp_makeLink = function(all, url, h, href) {
        return '<a href="h' + href + '"target="_blank">' + url + '</a>';
    };

    return str.replace(regexp_url, regexp_makeLink);
};
app.use(basicAuth('sumilab', 'sumino012'));

app.get('/comment/:comment', refererCheck, (req, res) => {
    const msg = extend({body: req.param('comment')}, req.query);
    console.log('comment: ' + JSON.stringify(msg));
    io.emit('comment', msg);
    res.end()
});

app.get('/comment', refererCheck, (req, res) => {
    const msg = extend({}, req.query);
    console.log('comment: ' + JSON.stringify(msg));
    io.emit('comment', msg);
    res.end()
});

app.get('/like', refererCheck, (req, res) => {
    const msg = extend({}, req.query);
    msg.duration = 1500;
    console.log('like: ' + JSON.stringify(msg));
    io.emit('like', msg);
    res.end()
});

app.use(express.static(path.join(__dirname, 'public')));

//mongoose
let Schema = mongoose.Schema;
let messageSchema = new Schema({
    message: String,
    color: String,
    date: String
});

mongoose.model('message', messageSchema);
mongoose.connect('mongodb://localhost:27017/chat_app');
let Message = mongoose.model('message');

io.on('connection', (socket) => {
    console.log('connected: ' + socket.request.connection.remoteAddress);
    socket.on('msg update', () => {
        //接続したらDBのメッセージを表示
        Message.find().limit(500).then((docs) => {
            socket.emit('msg open', docs);
        })
            .catch((err) => {
                console.log(err);
            })
    });
    socket.on('msg send', (msg) => {
        msg.message = autoLink(msg.message);
        socket.emit('msg push', msg);
        socket.broadcast.emit('msg push', msg);
        //DBに登録
        let message = new Message();
        let date = new Date();
        message.message = msg.message;
        message.color = msg.color;
        message.date = dateformat(date.getTime() + 1000*60*60*9,'yyyy年mm月dd日 HH時MM分ss秒');
        message.save((err) => {
            if (err) {
                console.log(err);
            }
        });
    });
    socket.on('disconnect', () => {
        console.log('disconnected: ' + socket.request.connection.remoteAddress)
    })
});

http.listen(process.env.PORT || 3000);