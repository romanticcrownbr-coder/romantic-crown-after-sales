const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8083;

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Normalize path and remove leading slashes/backslashes to ensure relative path
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  
  // Ensure we are working with a relative path inside current directory
  // Remove leading root indicators if present after normalization
  if (safePath.startsWith('\\') || safePath.startsWith('/')) {
      safePath = safePath.substring(1);
  }
  
  let filePath = path.join('.', safePath);

  fs.stat(filePath, (err, stats) => {
      if (err) {
          if (err.code === 'ENOENT') {
              // Try adding .html extension if not found (for clean URLs)
               if (path.extname(filePath) === '') {
                  const htmlPath = filePath + '.html';
                  fs.stat(htmlPath, (err2, stats2) => {
                      if (!err2 && stats2.isFile()) {
                          readFile(htmlPath, res);
                      } else {
                          send404(res);
                      }
                  });
              } else {
                  send404(res);
              }
          } else {
              send500(res, err);
          }
          return;
      }

      if (stats.isDirectory()) {
          filePath = path.join(filePath, 'index.html');
          fs.stat(filePath, (err2, stats2) => {
             if (!err2 && stats2.isFile()) {
                 readFile(filePath, res);
             } else {
                 send404(res); // Directory exists but no index.html
             }
          });
      } else {
          readFile(filePath, res);
      }
  });

}).listen(PORT);

function readFile(filePath, res) {
    const extname = path.extname(filePath);
    let contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            send500(res, error);
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}

function send404(res) {
    fs.readFile('./404.html', (error, content) => {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(content || '404 Not Found', 'utf-8');
    });
}

function send500(res, err) {
    console.error(err);
    res.writeHead(500);
    res.end('Sorry, check with the site admin for error: ' + err.code + ' ..\n');
}

console.log(`Server running at http://localhost:${PORT}/`);
