const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');


const httpServer = http.createServer(app);

const io = new Server(httpServer, {cors: {origin: '*'}});

let players = [];
let game = [[-1, -1, -1], [-1, -1, -1], [-1, -1, -1]];

function check(){
    let draw = 0;
    for(let i=0; i<3; i++){
        let s = '', k = '', f = '', l = '';
        for(let j=0; j<3; j++){
            console.log('ll: ===================='+game[2][j]);
            // console.log('l')
            s = s + game[i][j];
            k = k + game[j][i];
            f = f + game[j][j];
            let p = game.length - 1 - j;
            l = l + game[j][p];
            if(game[i][j] == -1) draw = 1;
        }
        console.log(k);
        if(s == "111" || k == "111" || f == "111" || l == "111") return 1;
        else if(s == "000" || k == "000" || f == "000" || l == "000") return 0;
    }
    if(draw == 0) return -1;
}

let turn = true;
io.on('connection', (socket) => {
    console.log(socket.id);
    players.push(socket.id);
    socket.emit('mark', game);
    socket.on('reset', () => {
        game = [[-1, -1, -1], [-1, -1, -1], [-1, -1, -1]];
        io.emit('mark', game);
    })
    socket.on('mark', (id, i, j) => {
        console.log('mark event');
        if(players[0] == id && turn && game[i][j] == -1){
            console.log('-------------------------------------------')
            game[i][j] = 0;
            turn = false;
            // io.emit('turn', 'Player 2 turn');
        }
        else if(players[1] == id && !turn && game[i][j] == -1){
            console.log('-------------------------------------------')
            game[i][j] = 1;
            turn = true;
            // io.emit('turn', 'Player 1 turn');
        }
        console.log(game);
        io.emit('mark', game);
        if(check() == 1){
            console.log('1 wins---------');
            io.emit('winner', 1);
        }
        else if(check() == 0){
            console.log('0 wins---------');
            io.emit('winner', 0);
        }
        else if(check() == -1){
            io.emit('draw');
        }
    })
})

httpServer.listen(3001, (err) => console.log('server running...'));
