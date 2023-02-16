let { init, exec, sql, transaction } = require('mysqls');

init({
    host: 'localhost',
    user: 'root',
    password:'aaaA9527-+',
    database: 'class_db',
    port: 3306,
    connectionLimit: 20,
});

module.exports = {
    sql, exec, transaction
}