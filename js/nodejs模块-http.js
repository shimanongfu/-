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
