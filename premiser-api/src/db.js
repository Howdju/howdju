const pg = require('pg')

const config = {
  user: 'tech', //env var: PGUSER
  database: 'premiser', //env var: PGDATABASE
  password: '', //env var: PGPASSWORD
  host: 'localhost', // Server hosting the postgres database
  port: 5432, //env var: PGPORT
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 3000, // how long a client is allowed to remain idle before being closed
}

const pool = new pg.Pool(config)

pool.on('error', (err, client) => console.error('idle client error', err.message, err.stack))

function test() {
  pool.connect().then(client => {
    client.query('select * from statements')
        .then(result => {
          debugger;
          console.log('statements: ', result.rows)
        })
        .then(() => {
          client.release()
          pool.end()
        })
  })
}

test()