'use strict';
const http = require('http');
const process = require('process');

const PORT = '3000';
const URL = '127.0.0.1';

process.env.TIME_INTERVAL = process.argv[2] || 1000; // кол-во мсек
process.env.TIME_PERIOD = process.argv[3] || 5000;
const interval = process.env.TIME_INTERVAL;
const timePeriod = process.env.TIME_PERIOD;

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
}).listen(PORT, URL);
console.log(`Server running at http://${URL}:${PORT}/ \n ...`);

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


