const faker = require("faker")
const express = require("express")
const app = new express()
const PORT = 8080

const teams = {
  pippo: {
    name: "pippo",
    password: "pluto",
    score: 100,
    killedShips: [],
    firedBullets: 0
    // lastFiredBullet: new Date().getTime()
  }
}
const teamsUpdate = (team, points, killedShip) => {
  teams[team].score += points
  teams[team].firedBullets++
  if (killedShip.length !== 0)  {
    teams[team].killedShips.push({
      id: killedShip[0],
      name: killedShip[1]
    })
  }
}
const field = []
const ships = []

const W = process.argv[2] || 6
const H = process.argv[3] || 6
const S = process.argv[4] || 10

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
    alive: true,
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
      cell.ship ? { id: cell.ship.id, name: cell.ship.name, alive: cell.ship.alive, killer: cell.ship.killer } : null
      : null
  })))

  const visibleShipInfo = ships.map(ship => ({
    id: ship.id,
    name: ship.name,
    alive: ship.alive,
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
  res.json([])
})

/* app.signup("/signup", (req, res) => {
  // team password
})*/
app.get("/fire", ({ query: { x, y, team, password } }, res) => {
  let msg = ""
  let points = 0
  const killedShip = []
  if (password === teams[team].password) {
    if (x - 1 < W  && y - 1  < H && x - 1 >= 0 && y - 1 >= 0) {
      const cell = field[x - 1][y - 1]
      if (!cell.hit) {
        cell.hit = true
        cell.team = team
        const ship = cell.ship
        if (ship) {
          ship.curHp--
          if (ship.curHp === 0) {
            points = 3
            msg = `hai affondato la nave ${ship.name} con id ${ship.id}`
            ship.killer = team
            killedShip.push(ship.id, ship.name)
          } else {
            points = 1
            msg = `hai colpito la nave ${ship.name} con id ${ship.id}`
          }
        } else {
          msg = "acqua"
        }
      } else {
        msg = `hai colpito una cella che era già stata colpita da ${cell.team}`
        points = -1
      }
    } else {
      points = -3
      msg = "sei uscito dal campo"
    }
    teamsUpdate(team, points, killedShip)
    res.status(200).json({
      msg,
      points,
      status: { score: teams[team].score,
        killedShips: teams[team].killedShips,
        firedBullets: teams[team].firedBullets
      }
    })
  } else {
    res.sendStatus(401)
  }/* TODO
    4. assicurarsi che il team che chiama l'endpoint non possa chiamarlo per piu' di una volta al secondo (opzionale)
    controllare bene x e y perché forse sono gitate
  */

})

app.all("*", (req, res) => {
  res.sendStatus(404)
})

app.listen(PORT, () => console.log("App listening on port %O", PORT))