const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');


const httpServer = http.createServer(app);

const io = new Server(httpServer, {cors: {origin: '*'}});

let rooms = [];
// let game = [[-1, -1, -1], [-1, -1, -1], [-1, -1, -1]];
let thisRoom = '';

function check(game){
    let draw = 0;
    for(let i=0; i<3; i++){
        let s = '', k = '', f = '', l = '';
        for(let j=0; j<3; j++){
            // console.log('ll: ===================='+game[2][j]);
            // console.log('l')
            s = s + game[i][j];
            k = k + game[j][i];
            f = f + game[j][j];
            let p = game.length - 1 - j;
            l = l + game[j][p];
            if(game[i][j] == -1) draw = 1;
        }
        // console.log(k);
        if(s == "111" || k == "111" || f == "111" || l == "111") return 1;
        else if(s == "000" || k == "000" || f == "000" || l == "000") return 0;
    }
    if(draw == 0) return -1;
}

function include(players, id) {
    return players.some(e => e.id === id);
}

io.on('connection', (socket) => {
    console.log(socket.id);

    socket.on('details', (name, room) => {
        let flag = 0;
        socket.join(room);
        rooms = rooms.map((e, i) => {
            if(e.room == room){
                flag = 1;
                e.players.push({name: name, id: socket.id, score: 0});
                // e.names.push(name);
                // io.to(room).emit('name', name, socket.id);
                io.to(room).emit('names', e.players);
                io.to(room).emit('turn', e.players[1].id);
                // io.to(room).emit('mark', e.game);
            }
            return e;
        })
        if(flag == 0){
            thisRoom = room;
            let newRoom = {room: room, players: [{name: name, id: socket.id, score: 0}], game: [[-1, -1, -1], [-1, -1, -1], [-1, -1, -1]], turn: true, score: 0}
            rooms.push(newRoom);
            io.to(room).emit('names', [{name: name, id: socket.id, score: 0}]);
            // io.to(room).emit('turn', null);
        }
    })

    // let playAgain = 0;
    socket.on('reset', () => {
        console.log('play again or reset');
        rooms.forEach((e, i) => {
            if(include(e.players, socket.id)){
                e.score = e.score + 1;
                console.log('score: '+e.score);
                if(e.score%2 == 0){
                    console.log('game emitting==-');
                    e.game = [[-1, -1, -1], [-1, -1, -1], [-1, -1, -1]];
                    e.turn = !e.turn;
                    io.to(e.room).emit('mark', e.game);
                }
                else{
                    console.log('playagain event emitted from server--=');
                    io.to(e.room).emit('playagain', socket.id);
                }
            }
        })
    })

    socket.on('mark', (id, i, j) => {
        rooms = rooms.map((e) => {
            console.log("players: "+e.players);
            if(include(e.players, id)){
                if(e.players.length == 2 && e.players[0].id == id && e.turn && e.game[i][j] == -1){
                    console.log('-------------------------------------------')
                    e.game[i][j] = 0;
                    e.turn = false;
                    io.to(e.room).emit('turn',socket.id);
                    // io.emit('turn', 'Player 2 turn');
                }
                else if(e.players.length == 2 && e.players[1].id == id && !e.turn && e.game[i][j] == -1){
                    console.log('-------------------------------------------')
                    e.game[i][j] = 1;
                    e.turn = true;
                    io.to(e.room).emit('turn',socket.id);
                    // io.emit('turn', 'Player 1 turn');
                }
                console.log(rooms);
                console.log('game: '+e.game);
                console.log('room: '+e.room);
                console.log('players: '+e.players);
                io.to(e.room).emit('mark', e.game);
                if(check(e.game) == 1){
                    console.log('1 wins---------');
                    io.to(e.room).emit('winner', 1);
                }
                else if(check(e.game) == 0){
                    console.log('0 wins---------');
                    io.to(e.room).emit('winner', 0);
                }
                else if(check(e.game) == -1){
                    io.to(e.room).emit('draw');
                }
            }
            return e;
        })

    })
})

httpServer.listen(3001, (err) => console.log('server running...'));
