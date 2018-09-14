'use strict';

const http = require('http');
const process = require('process');

const port = '3000';
const url = '127.0.0.1';

const interval = process.argv[2] || 1000; // кол-во мсек
const timePeriod = process.argv[3] || 5000;

http.createServer(function (request, response) {

    response.writeHead(200, {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*' // implementation of CORS
    });

    if(request.method==='GET'){
            getData( (data)=>{
                // response.write(data);
                response.end(data);
            });
    }
}).listen(port, url);

console.log(`Server running at http://${url}:${port}/`);
console.log('...');

function getData(callback) {
    let timerId = setInterval(function() { // начать повторы с интервалом = interval
        let data = new Date();
        console.log('data: ', data.toUTCString());
    }, interval);

    setTimeout(function() { // через timePeriod мсек остановить повторы
        clearInterval(timerId);
        console.log('_________________________________________');
        let data = new Date();
        callback(data.toUTCString());
    }, timePeriod);
}


