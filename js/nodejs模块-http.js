// http请求报文
// GET / HTTP/1.1  --> 请求行：请求方法 请求路径 协议版本  GET、POST、PUT、DELETE、HEAD、OPTIONS、TRACE、CONNECT
// Host: 127.0.0.1:3000  --> 请求头：主机名
// Accept：text/html, application/json --> 请求头：可接受的内容类型 */*、text/html、application/json、image/jpeg、application/octet-stream、multipart/form-data等
// Connection: keep-alive  --> 请求头：连接方式 keep-alive、close
// Content-Length: 0  --> 请求头：请求体长度
// content-type: application/x-www-form-urlencoded  --> 请求头：请求体类型 application/json、text/plain、text/html、image/jpeg、application/octet-stream、multipart/form-data等

// 请求体

// http响应报文
// HTTP/1.1 200 OK  --> 状态行：协议版本 状态码 状态码描述 --> 200、301、302、400、401、404、500、502等
// Content-Type: text/plain; charset=utf-8  --> 响应头：内容类型
// Content-Length: 12  --> 响应头：内容长度
// Date: Thu, 01 Dec 2022 08:00:00 GMT  --> 响应头：日期
// Connection: keep-alive  --> 响应头：连接方式
// Set-Cookie --> 响应头：设置cookie
// Access-Control-Allow-Origin --> 响应头：跨域资源共享 *、http://localhost:3000

// 响应体

const http = require('http');

var server = http.createServer(function (req, res) {
  console.log(req.method, req.url);
  // res.writeHead(200, 'Yes', { 'Content-Type': 'text/html; charset=utf-8' });
  if (req.method === 'GET') {
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('您访问的地址是：' + req.url);
    }
  }
  if (req.method === 'POST') {
    if (req.url === '/user') {
      let body = '';

      // 监听 `data` 事件，逐步获取请求体数据
      req.on('data', (chunk) => {
        console.log('chunk', chunk);
        body += chunk; // 将每一段数据追加到 body 中
      });

      req.on('end', () => {
        console.log('body', body);
      });

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ name: '张三' }));
    }
  }
});

server.listen(3000);

//http client 例子
// var client = http.get('http://127.0.0.1:3000', function (clientRes) {
//   clientRes.pipe(process.stdout);
// });
