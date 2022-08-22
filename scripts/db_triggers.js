const { Client } = require('pg')
var fs = require('fs');
var sql = fs.readFileSync('scripts/db_triggers.sql').toString();
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres',
    port: 5432,
})
client.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
    client.query(sql, function (err, result) {
        if (err) {
            console.log('error: ', err);
            process.exit(1);
        }
        process.exit(0);
    });
});