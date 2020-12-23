const sqlite3 = require("sqlite3");
const appRoot = require("app-root-path");
const path = require("path");

const DB_PATH = path.join(appRoot.path, "database/strangler.db");
let _db; 

function getDatabase() {
    if(_db) {
        return _db;
    } else {
        _db = new sqlite3.Database(DB_PATH);
        return _db;
    }
}

function closeDatabase(callback) {
    if(_db) {
        _db.close(callback);
    }
}

module.exports = {
    getDatabase,
    closeDatabase
};