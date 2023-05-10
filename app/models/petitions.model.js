const db = require('../../config/db');
const photosDirectory = 'storage/photos/';
const fs = require('mz/fs');
const mime = require('mime-types');

exports.getPetitions = async function(q, authorId, categoryId, sortBy) {
    const conn = await db.getPool().getConnection();


    let sort_by;
    let qString = 1;
    let authorIdString = 1;
    let CategoryIdString = 1;


    if (q !== undefined) {
         qString = `title LIKE "%${q}%"`;
    }
    if (authorId !== undefined) {
        authorIdString = `author_id = ${authorId}`;
    }
    if (categoryId !== undefined) {
        CategoryIdString = `C.category_id = ${categoryId}`;
    }

    let query = 'SELECT P.petition_id AS petitionId, title , C.name AS category, U.name AS authorName, count(*) AS signatureCount FROM Petition P JOIN Category C ' +
        'ON P.category_id = C.category_id ' +
        'JOIN User U ON P.author_id = U.user_id ' +
        'Join Signature S ON P.petition_id = S.petition_id ' +
        `WHERE ${qString} AND ${authorIdString} AND ${CategoryIdString} ` +
        'GROUP BY P.petition_id ';

    if (sortBy === 'ALPHABETICAL_ASC') {
        sort_by = 'ORDER BY title ASC';
    }
    else if (sortBy === 'ALPHABETICAL_DESC') {
        sort_by = 'ORDER BY title DESC';
    }
    else if (sortBy === 'SIGNATURES_ASC') {
        sort_by = 'ORDER BY signatureCount ASC'
    }
    else if (sortBy === 'SIGNATURES_DESC') {
        sort_by = 'ORDER BY signatureCount DESC'
    }
    else if (sortBy === undefined) {
        sort_by = 'ORDER BY signatureCount DESC'
    } else {
        return null;
    }
    query += sort_by;
    const [result] = await conn.query(query);
    conn.release();
    return result;
};

exports.addPetition = async function(newPetition) {
    const conn = await db.getPool().getConnection();
    let query = 'INSERT INTO Petition (title, description, author_id, category_id, created_date, closing_date) VALUES ' +
        '(?, ?, ?, ?, ?, ?)';
    const result = await conn.query(query, [newPetition.title, newPetition.description, newPetition.author_id, newPetition.category_id, newPetition.created_date, newPetition.closing_date]);
    conn.release();
    return result;
};

exports.getOnePetition = async function(petition) {
    const conn = await db.getPool().getConnection();
    let query = 'SELECT P.petition_id AS petitionId, title, C.name AS category, U.name AS authorName, count(*) AS signatureCount, ' +
        'description, author_id AS authorId, city AS authorCity, country AS authorCountry, created_date AS createdDate, closing_date AS closingDate ' +
        'FROM Petition P JOIN Category C ON P.category_id = C.category_id ' +
        'JOIN User U ON P.author_id = U.user_id ' +
        'Join Signature S ON P.petition_id = S.petition_id ' +
        'WHERE P.petition_id = ?';
    const [result] = await conn.query(query, [petition]);
    conn.release();
    return result;
};

exports.getPetitionId = async function(authorId, reqPetitionId) {
    const conn = await db.getPool().getConnection();
    let query = 'SELECT petition_id FROM Petition WHERE author_id = ? AND petition_id = ?';
    const [result] = await conn.query(query, [authorId, reqPetitionId]);
    conn.release();
    return result;
};

exports.updateDetails = async function(values, petitionId) {
    const conn = await db.getPool().getConnection();
    let query = 'UPDATE Petition SET ? WHERE petition_id = ?';
    await conn.query(query, [values, petitionId]);
    conn.release();
};

exports.removePetition = async function(reqPetitionId) {
    const conn = await db.getPool().getConnection();
    let query = 'DELETE FROM Petition WHERE petition_id = ?';
    let query2 = 'DELETE FROM Signature WHERE petition_id = ?';
    await conn.query(query, [reqPetitionId]);
    await conn.query(query2, [reqPetitionId]);
    conn.release();
};

exports.getCategories = async function() {
    const conn = await db.getPool().getConnection();
    let query = 'SELECT category_id AS categoryId, name FROM Category';
    const [result] = await conn.query(query);
    conn.release();
    return result;
};

exports.getSignatures = async function(petitionId) {
    const conn = await db.getPool().getConnection();
    let query = 'SELECT signatory_id AS signatoryId, name, city, country, signed_date AS signedDate ' +
        'FROM Signature S JOIN User U ON S.signatory_id = U.user_id ' +
        'WHERE petition_id = ? ' +
        'ORDER BY signed_date ASC';
    const [result] = await conn.query(query, [petitionId]);
    conn.release();
    return result;
};

exports.checkSignature = async function(petitionId, userId) {
    const conn = await db.getPool().getConnection();
    let query = 'SELECT signatory_id, petition_id FROM Signature WHERE petition_id = ? AND signatory_id = ?';
    const [result] = await conn.query(query, [petitionId, userId]);
    conn.release();
    return result;
};

exports.addSignature = async function(signatureId, petitionId, signedDate) {
    const conn = await db.getPool().getConnection();
    let query = 'INSERT INTO Signature (signatory_id, petition_id, signed_date) VALUES (?, ?, ?)';
    await conn.query(query, [signatureId, petitionId, signedDate]);
    conn.release();
};

exports.deleteSignature = async function(petitionId, userId) {
    const conn = await db.getPool().getConnection();
    let query = 'DELETE FROM Signature WHERE petition_id = ? AND signatory_id = ?';
    await conn.query(query, [petitionId, userId]);
    conn.release();
};

exports.getPhotos = async function(petitionId) {
    const conn = await db.getPool().getConnection();
    let query = 'SELECT photo_filename FROM Petition WHERE petition_id = ?';
    const [result] = await conn.query(query, [petitionId]);
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

exports.getPhotoName = async function (petitionId) {
    const conn = await db.getPool().getConnection();
    let query = 'SELECT photo_filename FROM Petition WHERE petition_id = ?';
    const [result] = await conn.query(query, [petitionId]);
    conn.release();
    return result;
};

exports.insertPhotos = async function (petitionId, req) {
    let filename = 'petition_' + petitionId.toString();
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
    let query = 'UPDATE Petition SET photo_filename = ? WHERE petition_id = ?';
    await conn.query(query, [filename, parseInt(petitionId)]);
    conn.release();
};