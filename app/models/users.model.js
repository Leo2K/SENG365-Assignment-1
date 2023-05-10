const db = require('../../config/db');
const photosDirectory = 'storage/photos/';
const fs = require('mz/fs');
const mime = require('mime-types');

exports.getId = async function( email ) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT user_id from User WHERE email = (?)';
    const [rows] = await conn.query(query, [email]);
    conn.release();
    return rows;

};

exports.getPassword = async function ( email ) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT password from User WHERE email = (?)';
    const [ result ] = await conn.query( query, [ email ] );
    conn.release();
    return result;

};

exports.insert = async function( values ) {
    const conn = await db.getPool().getConnection();
    if (values.country === undefined && values.city === undefined) {
        const query = 'INSERT INTO User (name, email, password) VALUES (?, ?, ?)';
        const result = await conn.query( query, [ values.name, values.email, values.password ] );
        conn.release();
        return result;
    }
    else if (values.city === undefined) {
        const query = 'INSERT INTO User (name, email, password, country) VALUES (?, ?, ?, ?)';
        const result = await conn.query( query, [ values.name, values.email, values.password, values.country ] );
        conn.release();
        return result;
    }
    else if (values.country === undefined) {
        const query = 'INSERT INTO User (name, email, password, city) VALUES (?, ?, ?, ?)';
        const result = await conn.query( query, [ values.name, values.email, values.password, values.city ] );
        conn.release();
        return result;
    } else {
        const query = 'INSERT INTO User (name, email, password, city, country) VALUES (?, ?, ?, ?, ?)';
        const result = await conn.query( query, [ values.name, values.email, values.password, values.city, values.country ] );
        conn.release();
        return result;
    }
};

exports.assignToken = async function( email, token ) {
    const conn = await db.getPool().getConnection();
    const query = 'UPDATE User SET auth_token = ? WHERE email = ?';
    await conn.query( query, [ token, email ] );
    conn.release();
};

exports.removeToken = async function( userId ) {
    const conn = await db.getPool().getConnection();
    const query = 'UPDATE User SET auth_token = NULL WHERE user_id = ?';
    await conn.query(query, [userId]);
    conn.release();
};

exports.getUser = async function(userId, requestingUserId) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT name, city, country, email FROM User WHERE user_id = ?';
    const [result] = await conn.query(query, [requestingUserId]);
    conn.release();
    if (userId == requestingUserId && result.length >= 1) {
        return {
            'name': result[0].name,
            'city': result[0].city,
            'country': result[0].country,
            'email': result[0].email
        };
    } else if (result.length >= 1) {
        return {
            'name': result[0].name,
            'city': result[0].city,
            'country': result[0].country
        };
    } else {
        return null;
    }
};

exports.updatePassword = async function(userId, password) {
    const conn = await db.getPool().getConnection();
    const query = 'UPDATE User SET password = ? WHERE user_id = ?';
    await conn.query(query, [password, userId]);
    conn.release();
};

exports.updateDetails = async function(userId, values) {
    const conn = await db.getPool().getConnection();
    const query = 'UPDATE User SET ? WHERE user_id = ?';
    await conn.query(query, [values, userId]);
    conn.release();
};

exports.getPhotos = async function(userId) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT photo_filename FROM User WHERE user_id = ?';
    const [result] = await conn.query(query, [userId]);
    conn.release();
    if (result[0] === undefined) {
        return undefined;
    }
    let filename = result[0].photo_filename;
    if (filename === null) {
        return null;
    } else {
        if (await fs.exists(photosDirectory + filename)) {
            const image = await fs.readFile(photosDirectory + filename);
            const mimeType = mime.lookup(filename);
            return {image, mimeType};
        }
    }
};

exports.getPhotoName = async function(userId) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT photo_filename FROM User WHERE user_id = ?';
    const [result] = await conn.query(query, [userId]);
    conn.release();
    return result;
};

exports.insertPhotos = async function(userId, req) {
    let filename = 'user_' + userId.toString();
    if (req.headers["content-type"] === 'image/jpeg') {
        filename += '.jpg';
    }
    if (req.headers["content-type"] === 'image/png' ) {
        filename += '.png';
    }
    if (req.headers["content-type"] === 'image/gif') {
        filename += '.gif';
    }
    req.pipe(fs.createWriteStream(photosDirectory + filename));
    const conn = await db.getPool().getConnection();
    const query = 'UPDATE User SET photo_filename = ? WHERE user_id = ?';
    await conn.query(query, [filename, parseInt(userId)]);
    conn.release();
};

exports.deleteUserPhotos = async function(userId, filename, req) {
    fs.unlinkSync(photosDirectory + filename);
    const conn = await db.getPool().getConnection();
    const query = 'UPDATE User SET photo_filename = null WHERE user_id = ?';
    await conn.query(query, [userId]);
    conn.release();
};







