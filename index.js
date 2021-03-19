const faker = require("faker")
const express = require("express")
const app = new express()
const PORT = 8080

const Team = (name, password) => {
  return ({
    name,
    password,
    score: 0,
    killedShips: [],
    firedBullets: 0,
    lastFiredBullet: new Date().getTime() })
}


const teams = {}

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
const shipsAlive = ships.length
app.get("/", (req, res) => {
  res.send (`
  <h1>REGOLE </h1>
  <ol>
    <li>fare una chiamata in get all'endpoint /signup e passare una query string contenete due variabili
      <ul>
        <li>name a cui assegnare il nome del team</li>
        <li>password a cui assegnare la password per poter fare fuoco</li>
      </ul>
    </li>
    <li>All'endpoint /field si può visualizzare il campo di gioco. Per ricevere i dati in formato json aggiungere
    una query string contente la chiave format=json
    </li>
    <li>per fare fuoco fare una chiamata all'endpoint /fire con le seguenti query string
      <ul>
        <li>team = nome del team</li>
        <li>password= password del team</li>
        <li>x= coordinata x della cella </li>
        <li>y= coordinata y della cella</li>
      </ul>
      le coordinate sono 1-based
    </li>
    <li>PUNTI:
      <ul>
        <li>0 punti se si fa acqua</li>
        <li>+1 se si colpisce la nave</li>
        <li>+3 se si affonda la nave</li>
        <li>+5 se si affonda l'ultima nave</li>
        <li>-1 se si colpisce una cella già colpita da un'altro giocatore</li>
        <li>-3 se si esce dal campo di gioco</li>
      </ul>
    </li>
  </ol>
  `)
})
app.get("/field", ({ query: { format } }, res) => {
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
app.get("/signup", ({ query: { name, password } }, res) => {
  if (!name || !password) {
    return res.sendStatus(400)// bad request

  } else if (!teams[name]) {
    return res.status(409).json({ msg: "username già in uso" }) // conflinct (username already in use)
  } else {
    teams[name] = new Team(name, password)
    res.status(200).json({ msg: "utente registrato " })
  }
})



  if (!Object.keys(teams).includes(team)) {
    res.status(400).json({ msg: "utente non trovato" })
    return
  }

  if (password === teams[team].password) {
    if (shipsAlive !== 0) {
      if (alreadyFired.includes(team)) {
        res.sendStatus(408) // timeout
        return
      } else {
        alreadyFired.push(team)
      }
      if (x - 1 < W  && y - 1  < H && x - 1 >= 0 && y - 1 >= 0) {
        const cell = field[y - 1][x - 1]
        if (!cell.hit) {
          cell.hit = true
          cell.team = team
          const ship = cell.ship
          if (ship) {
            ship.curHp--
            if (ship.curHp === 0) {
              shipsAlive--
              ship.killer = team
              killedShip.push(ship.id, ship.name)
              if (shipsAlive !== 0) {
                points = 3
                msg = `hai affondato la nave ${ship.name} con id ${ship.id}`
                ship.alive = false
              } else {
                points = 5
                ship.alive = false
                msg = `hai affondato l'ULTIMA nave ${ship.name} con id ${ship.id}! GIOCO FINITO`
              }
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
    } else {
      msg = "TUTTE LE NAVI SONO GIA' STATE AFFONDATE!! GIOCO FINITO"
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
    res.sendStatus(401) // unauthorized
  }/* TODO
    4. assicurarsi che il team che chiama l'endpoint non possa chiamarlo per piu' di una volta al secondo (opzionale)
  */

})

app.all("*", (req, res) => {
  res.sendStatus(404)
})

app.listen(PORT, () => console.log("App listening on port %O", PORT))