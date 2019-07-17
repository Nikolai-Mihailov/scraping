if (!global.__base) {
    /* FOR TESTING PURPOSE ONLY */
    global.__base = require('path').join(__dirname, '../');
}

const mysql = require('mysql');
const utils = require(`${__base}/utils`);
const C = require(`${__base}/constants`);
const config = {
    databases: {
        default: {
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'mydatabase1',
            timezone: 'utc'
        },
        users: {
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'users_database',
            timezone: 'utc'
        }
    },
    settings: {
        timeout: 30000
    }
};

const Db = (function() {

    let errors = [];

    /**
     * By database name, create connection and return promise which: 
     * resolve: return the establish connection which one we are going to use to work with database
     * reject: return the error object
     * @param {string} name 
     * @returns {Promise} 
     */
    function _getConnection(name) {


        let defer = utils.async.defer();

        let configuration = typeof name === 'string' && config.databases[name] ? config.databases[name] : name;

        if (!configuration) {
            defer.reject({
                type: C.errors.CONFIG_MISSING,
                error: {
                    message: `Configuration with name "${name}" not found!`
                }
            });
            return defer;
        }

        let connection = mysql.createConnection(configuration);
        connection.connect(err => {

            if (err) {
                return defer.reject({
                    type: C.errors.CONNECTION,
                    error: err
                });
            }

            defer.resolve(connection);
        });

        return defer;
    }

    /**
     * Return database credential object by the connection name
     * @param {string} connectionName 
     */
    function _getCredentials(connectionName) {
        return config.databases[connectionName] ? config.databases[connectionName] : null;
    }

    /**
     * Start transaction connection 
     *  Grouping and running multiple queries that change the state of the database
     * @param {*} connection 
     */
    function _startT(connection) {

        let defer = utils.async.defer();

        connection.beginTransaction(err => {
            if (err) {
                return defer.reject({
                    type: C.errors.BEGIN_TRANSACTION,
                    error: err
                });
            }
            return defer.resolve(true);
        });

        return defer;
    }

    /**
     * Close connection when transaction complete.
     * @param {*} connection 
     * @param {commit|rollback} flag commit -  push the queries , rollback - transaction fails to revert. 
     */
    function _endT(connection, flag) {

        let defer = utils.async.defer();
        let transactionMethod = flag ? 'commit' : 'rollback';

        if (!connection) {
            defer.resolve(true);
        } else {
            connection[transactionMethod](err => {
                if (err) {
                    return defer.reject({
                        type: C.errors.END_TRANSACTION,
                        error: err
                    });
                }
                return defer.resolve(true);
            });
        }

        return defer;
    }

    /**
     * Use to create query to the database
     * @param {*} conn 
     * @param {string} sql  Query
     * @param {string} params Query parameters 
     * @param {number} timeout timeout option
     */
    function _query(conn, sql, params, timeout) {

        let defer = utils.async.defer();

        conn.query({
            sql: sql,
            values: params,
            timeout: timeout || config.settings.timeout
        }, function(err2, results, fields) {

            if (err2) {
                return defer.reject({
                    type: C.errors.QUERY,
                    error: err2
                });
            }

            defer.resolve({ data: results, fields: fields });
        });

        return defer;
    }

    /**
     * Return massive of errors
     */
    function _getErrors() {
        return errors;
    }

    /** 
     * Return the last error 
     */
    function _getLastError() {
        return errors[errors.length] || null;
    }

    /**
     * Clear errors
     */
    function _clearErros() {
        errors = [];
        return this;
    }

    /**
     * Disconnect from database
     * @param {*} conn 
     */
    function _disconnect(conn) {

        let defer = utils.async.defer();

        if (!conn) {
            defer.resolve(true);
        } else {
            conn.end(err => err ? defer.reject(err) : defer.resolve(true));
        }

        return defer;
    }

    /**
     * Return connection status
     * @param {*} connection 
     */
    function _isConnected(connection) {
        return connection && connection.state && ['connected', 'authenticated'].indexOf(connection.state) !== -1;
    }

    return {
        isConnected: _isConnected,
        getConnection: _getConnection,
        getCredentials: _getCredentials,
        startT: _startT,
        endT: _endT,
        getErrors: _getErrors,
        getLastError: _getLastError,
        clearErros: _clearErros,
        query: _query,
        disconnect: _disconnect
    }

})();


exports = module.exports = Db;