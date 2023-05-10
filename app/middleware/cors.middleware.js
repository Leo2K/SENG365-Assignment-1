const db = require('../../config/db');
exports.allowCrossOriginRequestsMiddleware = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE');
    next();
};

getIdFromToken = async function( token ) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT user_id FROM User WHERE auth_token = ?';
    const [result] = await conn.query(query, [token]);
    conn.release();
    return result[0];
};

exports.loginRequired = async function (req, res, next) {
    const token = req.header('X-Authorization');
    const result = await getIdFromToken(token);
    if (result === undefined) {
        res.statusMessage = 'Unauthorized';
        res.status(401)
            .send();
    } else {
        req.authenicatedUserId = result.user_id;
        next();
    }
};

exports.loginNotRequired = async function (req, res, next) {
    const token = req.header('X-Authorization');
    const result = await getIdFromToken(token);
    if (result === undefined) {
        req.authenicatedUserId = null;
        next();
    } else {
        req.authenicatedUserId = result.user_id;
        next();
    }
};
