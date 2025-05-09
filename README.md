<div align="center">
    <h3 align="center">🌍Map Quest</h3>
</div>

# About The Project

MapQuest is a game in which the player has to guess the country by its outline. The game is designed for several rounds, each of which gradually reveals clues.

## 🔧 Technologies

* Node.js (server side)
* Fastify (request processing)

## How to up
1. Use the .env.template example for creating .env 

2. Start the server with the command:
```
npm start
```

## 🕹 How to play
1. The player sees the outline of the country.
2. Choose the country from a list.
3. If the answer is correct, the player gets points and moves on to the next round.
4. If the answer is incorrect, the game gives a hint.
5. After 3 hints, the name of the correct country is revealed.
6. Points are calculated and the game continues.

## 📂 Project structure
```
/mapquest
├── src
│ ├── routes
│ ├── utils.js
├── public
│ ├── index.html
│ ├── app.js
│ ├── assets
├── server.js
├── package.json
├── README.md
```

## 📅 TODO
- [ ] Hints
- [ ] Score system
