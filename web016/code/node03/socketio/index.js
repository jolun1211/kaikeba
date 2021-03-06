/**
 * websocket的应用
 * 1.简易的聊天室
 * 2.浏览器模仿控制台
 */
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const db = require('./db');
const m = require('./module');
// console.log(uuid.v1());
app.set('trust proxy', true);
let userIP = '';

// 请求浏览器发起请求的时候 判断用户,是新用户还是已存在用户
function checkUser(ip) {
  userIP = ip.match(/\d+\.\d+\.\d+\.\d+/)[0];
  // 检索用户表,如果有就使用如果没有就新增用户
  db.get('user', data => {
    // console.log('db.get:', data);
    if (!data.hasOwnProperty(userIP)) {
      // 创建一个用户
      console.log('需要添加一个用户');
      data[userIP] = m.user(userIP);
      db.set('user', data)
    }
  });
  return userIP // 返回用户ID
}

function addMessage(msg, userIP) {
  db.get('message', data => {
    // 消息列表用数组存储
    if (Object.keys(data).length === 0) data = [];
    data.push(msg);
    db.set('message', data)
  });
  
}

// 请求根根路径
app.get('/', function (req, res) {
  checkUser(req.ip);
  // console.log('用户[', userIP, ']发起请求');
  res.sendFile(__dirname + '/index.html')
});
// 给前端一个IP的接口
app.get('/ip', function (req, res) {
  userIP = req.ip.match(/\d+\.\d+\.\d+\.\d+/)[0];
  res.send(`const userIP = '${userIP}'`)
});
// 请求消息列表接口
app.get('/message', (req, res) => {
  let list = [];
  db.get('message', data => {
      list = data;
      res.send(list)
    }
  )
});
// 所有请求--暂时全部显示为index.html
app.get('*', function (req, res) {
  checkUser(req.ip);
  // console.log('用户[', userIP, ']发起请求');
  res.sendFile(__dirname + '/index.html')
});

io.on('connection', function (socket) {
  // console.log('user connection userIP:', userIP);
  // io.emit('connection', userIP)
  // 响应用户发送的信息
  socket.on('chat message', function (msg) {
    console.log('前', msg);
    const msg2 = m.message({...msg, user: userIP});
    addMessage(msg2, userIP);
    console.log('后', msg2);
    // 广播给所有人
    io.emit('chat message', msg2)
  });
  socket.on('disconnect', function () {
    // console.log('user disconnect', userIP);
    io.emit('disconnect', userIP)
  })
});
http.listen(9000, function () {
  console.log('listen on http://localhost:9000');
});
/**
 * 使用单文件fs储存聊天记录
 * 储存所有用户,修改用户名
 * 创建用户表和聊天记录表(搭建结构)√
 * 更改在线状态
 * 广请求 *
 * */
