const faker = require("faker")
const express = require("express")
const app = new express()
const PORT = 8080

const teams = {
  test: {
    name: "test",
    password: "test",
    score: 0,
    killedShips: [],
    firedBullets: 0,
    lastFiredBullet: 0
  }
}
const field = []
const ships = []

const W = process.argv[2] || 6
const H = process.argv[3] || 6
const S = process.argv[4] || 10

const gameStatus = {
  active: true,
  startTime: new Date().getTime(),
  endTime: null
}

for (let y = 0; y < H; y++) {
  const row = []
  for (let x = 0; x < W; x++) {
    row.push({
      team: null,
      x,
      y,
      ship: null,
      hit: false
    })
  }
  field.push(row)
}

let id = 1
for (let i = 0; i < S; i++) {
  const maxHp = faker.random.number({ min: 1, max: 6 })
  const vertical = faker.random.boolean()
  console.log({ vertical, maxHp })

  const ship = {
    id,
    name: faker.name.firstName(),
    x: faker.random.number({ min: 0, max: vertical ? W - 1 : W - maxHp }),
    y: faker.random.number({ min: 0, max: vertical ? H - maxHp : H - 1 }),
    vertical,
    maxHp,
    curHp: maxHp,
    killer: null
  }

  let found = false
  for (let e = 0; e < ship.maxHp; e++) {
    const x = ship.vertical ? ship.x : ship.x + e
    const y = ship.vertical ? ship.y + e : ship.y
    if (field[y][x].ship) {
      found = true
      break
    }
  }

  if (!found) {
    for (let e = 0; e < ship.maxHp; e++) {
      const x = ship.vertical ? ship.x : ship.x + e
      const y = ship.vertical ? ship.y + e : ship.y
      field[y][x].ship = ship
    }

    ships.push(ship)
    id ++
  }
}

app.get("/", ({ query: { format } }, res) => {
  const visibleField = field.map(row => row.map(cell => ({
    x: cell.x,
    y: cell.y,
    hit: cell.hit,
    team: cell.team,
    ship: cell.hit ?
      cell.ship ? {
        id: cell.ship.id,
        name: cell.ship.name,
        alive: cell.ship.curHp > 0,
        killer: cell.ship.killer
      } : null
      : null
  })))

  const visibleShipInfo = ships.map(ship => ({
    id: ship.id,
    name: ship.name,
    alive: ship.curHp > 0,
    killer: ship.killer
  }))

  if (format === "json") {
    res.json({
      field: visibleField,
      ships: visibleShipInfo
    })
  } else {
    // html format field
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>battaglia navale</title>
      <style>
        table, td, th {
          border: 1px solid black;
        }
        td {
          width: 40px;
          height: 40px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
      </style>
    </head>
    <body>
      <table>
        <tbody>
          ${visibleField.map(row => `<tr>${row.map(cell => `<td>${cell.ship ? cell.ship.name : cell.hit ? "X" : ""}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </body>
    </html>
    `)
  }
})

app.get("/score", (req, res) => {
  res.json(Object.values(teams).map(({
    name,
    score,
    killedShips,
    firedBullets,
    lastFiredBullet
  }) => ({
    name,
    score,
    killedShips,
    firedBullets,
    lastFiredBullet
  })))
})

app.get("/signup", ({ query: { name, password } }, res) => {
  if (!name || !password) {
    return res.sendStatus(400)
  }

  if (teams[name]) {
    return res.sendStatus(409)
  }

  teams[name] = {
    name,
    password,
    score: 0,
    killedShips: [],
    firedBullets: 0,
    lastFiredBullet: 0
  }

  res.sendStatus(200)
})
app.get("/fire", ({ query: { x, y, team: teamName, password } }, res) => {
  /*
    1. segnare la cella come colpita
    2. segnare eventualmente la nave come colpita (ridurre gli hp e verificare se e' morta)
    3. assegnare il team sia alla cella che alla nave (eventuale)
    4. assicurarsi che il team che chiama l'endpoint non possa chiamarlo per piu' di una volta al secondo (opzionale)
    5. definire un punteggio conseguente all'attacco:
      a. punteggio molto negativo se si spara fuori dal campo
      b. punteggio 0 se acqua
      c. punteggio negativo se spari su casella gia' colpita
      c. punteggio positivo se spari su nave ma non la uccidi
      d. punteggio molto positivo se spari su nave e la uccidi
  */

  if (!gameStatus.active) {
    return res.sendStatus(400)
  }

  const team = teams[teamName]
  if (!team) {
    return res.sendStatus(401)
  }
  if (team.password !== password) {
    return res.sendStatus(401)
  }
  const now = new Date().getTime()
  if (now - team.lastFiredBullet < 1000) {
    return res.sendStatus(408)
  }

  team.firedBullets ++
  team.lastFiredBullet = now

  let message, score
  if (x >= W || x < 0 || y >= H || y < 0) {
    message = "out of field"
    score = -10
  } else {
    const cell = field[y][x]

    if (cell.hit) {
      message = "already hit"
      score = -5
    } else {
      cell.hit = true
      cell.team = team

      if (!cell.ship) {
        message = "water"
        score = 0
      } else {
        cell.ship.curHp --
        if (cell.ship.curHp > 0) {
          message = "hit!"
          score = 10
        } else {
          cell.ship.killer = team
          message = "killer!"
          score = 50
          team.killedShips.push({
            name: cell.ship.name,
            id: cell.ship.id
          })

          if (ships.every(({ curHp }) => curHp === 0)) {
            gameStatus.active = false
            gameStatus.endTime = new Date().getTime()
          }
        }
      }
    }
  }

  res.json({
    message,
    score
  })

  team.score += score
})

app.all("*", (req, res) => {
  res.sendStatus(404)
})

app.listen(PORT, () => console.log("App listening on port %O", PORT))