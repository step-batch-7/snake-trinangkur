const { Server } = require('net');
const fs = require('fs');

const collectHeadersAndContent = (result, line) => {
  if (line === '') {
    result.body = '';
    return result;
  }
  if ('body' in result) {
    result.body += line;
    return result;
  }
  const [key, value] = line.split(': ');
  result.headers[key] = value;
  return result;
};

class Request {
  constructor(method, url, headers, body) {
    this.method = method;
    this.url = url;
    this.headers = headers;
    this.body = body;
  }
  static parse(requestText) {
    const [requestLine, ...headersAndBody] = requestText.split('\r\n');
    const [method, url, protocol] = requestLine.split(' ');
    const { headers, body } = headersAndBody.reduce(collectHeadersAndContent, {
      headers: {}
    });
    const req = new Request(method, url, headers, body);
    console.warn(req);
    return req;
  }
}

const CONTENT_TYPES = {
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  json: 'application/json',
  gif: 'image/gif'
};

class Response {
  constructor() {
    this.statusCode = 404;
    this.headers = [
      { key: 'Content-Length', value: 0 },
      { key: 'Content-Type', value: 'text/html' }
    ];
  }
  setHeader(key, value) {
    let header = this.headers.find(h => h.key === key);
    if (header) {
      header.value = value;
      return;
    }
    this.headers.push({ key, value });
  }
  generateHeadersText() {
    const lines = this.headers.map(header => `${header.key}: ${header.value}`);
    return lines.join('\r\n');
  }
  writeTo(writable) {
    writable.write(`HTTP/1.1 ${this.statusCode}\r\n`);
    writable.write(this.generateHeadersText());
    writable.write('\r\n\r\n');
    this.body && writable.write(this.body);
  }
}

const getPath = function(url) {
  if (url === '/') return './index.html';
  return `.${url}`;
};

const getNoFoundResponse = function() {
  return `<html>
  <head><title>Not Found</title></head>
  <body>
    <h1>404 FILE NOT FOUND</h1>
  </body>
</html>`;
};

const getContentAndType = function(path) {
  const stat = fs.existsSync(path) && fs.statSync(path);
  if (!stat || !stat.isFile()) return ['text/html', getNoFoundResponse()];
  const [, extension] = path.match(/.*\.(.*)$/) || [];
  const contentType = CONTENT_TYPES[extension];
  const content = fs.readFileSync(path);
  return [contentType, content];
};

const servePage = function(req) {
  const path = getPath(req.url);
  const [contentType, content] = getContentAndType(path);
  const res = new Response();
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', content.length);
  res.statusCode = 200;
  res.body = content;
  return res;
};

const findHandler = req => {
  if (req.method === 'GET' || req.method === 'POST') return servePage;
  return () => new Response();
};

const handleRequest = function(socket, cookieId) {
  const remote = { addr: socket.remoteAddress, port: socket.remotePort };
  console.log('connected with', remote);
  socket.setEncoding('utf8');
  socket.on('data', text => {
    console.log(text);
    const req = Request.parse(text);
    const handler = findHandler(req);
    const res = handler(req);
    res.writeTo(socket);
  });
};

const main = () => {
  let cookieId = 1;
  const server = new Server();
  server.on('listening', () => console.log('server started', server.address()));
  server.on('connection', socket => handleRequest(socket, cookieId++));
  server.listen(4000);
};

main();
