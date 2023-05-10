const user = require('../models/users.model');


exports.create = async function(req, res) {
    const email = req.body.email;
    const id = await user.getId( email );
    const name = req.body.name;
    const password  = req.body.password;
    try {
        if (!(email.includes('@')) || password === undefined || id.length >= 1 || name === undefined || password === "") {
            res.statusMessage = 'Bad request';
            res.status(400)
                .send();
        } else {
           const userId = await user.insert(req.body);
           const id = userId[0].insertId;
           let idJson = {
                "userId": id
            };
            res.statusMessage = 'Created';
            res.status(201)
                .send(idJson);
        }
    } catch( err ) {
        console.log(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send();
    }
};

exports.login = async function(req, res) {
    const email = req.body.email;
    const password = req.body.password;
    const result = await user.getPassword( email );
    const id = await user.getId( email );
    try {
        if  (result[0] === undefined) {
            res.statusMessage = 'Bad Request';
            res.status(400)
                .send();
        }
        else if (password != result[0].password) {
            res.statusMessage = 'Bad Request';
            res.status(400)
                .send();
        } else {
            let token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            await user.assignToken( email, token );
            let response = {"userId": id[0].user_id, "token": token};
            res.statusMessage = `Successful login!`;
            res.status ( 200 )
                .send(response);
        }
    } catch( err ) {
        res.statusMessage = 'Internal Server Error';
        res.status( 500 )
            .send();
    }
};

exports.logout = async function(req, res) {
    let userId = req.authenicatedUserId;
    try {
        await user.removeToken(userId);
        res.statusMessage = 'OK';
        res.status(200)
            .send();
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send();
    }

};

exports.view = async function(req, res) {
    let userId = req.authenicatedUserId;
    let requestingUserId = req.params.id;
    try {
        const result = await user.getUser(userId, requestingUserId);
        if (result === null) {
            res.statusMessage = "Not Found";
            res.status(404)
                .send();
        } else {
            res.statusMessage = "OK";
            res.status(200)
                .send(result);
        }
    } catch(err) {
        console.log(err);
        res.status(500)
            .send(`Internal Server Error`);
    }
};


exports.update = async function(req, res){

    let userId = req.authenicatedUserId;
    let requestingUserId = req.params.id;
    const email = req.body.email;
    let values = {
        'name': req.body.name,
        'email': req.body.email,
        'city': req.body.city,
        'country': req.body.country
    };

    if (values.name === undefined) {
        delete values['name'];
    }
    if (values.email === undefined) {
        delete values['email'];
    }
    if (values.city === undefined) {
        delete values['city'];
    }
    if (values.country === undefined) {
        delete values['country'];
    }

    try {
        if ( Object.keys(req.body).length === 0 || (email !== undefined && !email.includes('@')) || req.body.password === undefined) {
            res.statusMessage = 'Bad Request';
            res.status(400)
                .send();
        }
        else if (userId != requestingUserId) {
            res.statusMessage= 'Forbidden';
            res.status(403)
                .send();
        }
        else if (req.body.currentPassword !== undefined) {
            await user.updatePassword(userId, req.body.password);
            await user.updateDetails(userId, values);
        } else {
            await user.updateDetails(userId, values);
        }

        res.statusMessage = 'OK';
        res.status(200)
            .send();
    } catch (err) {
        res.statusMessage= 'Internal Server Error';
        res.status(500)
            .send();
    }
};

exports.viewPhotos = async function(req, res) {
    const userId = req.params.id;
    try {
           let imageDetails = await user.getPhotos(userId);
           let currentUser = await user.getUser(userId, userId);
           if (currentUser == null || imageDetails === null || imageDetails === undefined) {
               console.log(currentUser);
               res.statusMessage = 'Not Found';
               res.status(404)
                   .send();
           } else {
               res.statusMessage = 'OK';
               res.status(200).contentType(imageDetails.mimeType).send(imageDetails.image);
           }
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send();
    }
};

exports.addPhotos = async function(req, res) {
    let userId = req.authenicatedUserId;
    let requestingUserId = req.params.id;
    try {
        let currentUser = await user.getUser(requestingUserId, requestingUserId);
        if (currentUser == null) {
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
        }
        if (userId != requestingUserId) {
            console.log(currentUser);
            res.statusMessage= 'Forbidden';
            res.status(403)
                .send();
        }
        if (req.headers["content-type"] !== 'image/jpeg' && req.headers["content-type"] !== 'image/png' && req.headers["content-type"] !== 'image/gif') {
            res.statusMessage = 'Bad Request';
            res.status(400)
                .send();
        }
        let photoCheck = await user.getPhotoName(requestingUserId);
        if (photoCheck[0].photo_filename !== null) {
            await user.insertPhotos(userId, req);
            res.statusMessage = 'OK';
            res.status(200)
                .send();
        } else {
            await user.insertPhotos(userId, req);
            res.statusMessage = 'Created';
            res.status(201)
                .send();
        }
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send();
    }
};

exports.deletePhotos = async function(req, res) {
    let userId = req.authenicatedUserId;
    let requestingUserId = req.params.id;
    try {
        let currentUser = await user.getUser(requestingUserId, requestingUserId);
        let photoName = await user.getPhotoName(requestingUserId);
        if (currentUser == null) {
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
        }
        if (photoName === undefined) {
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
        }
        if (userId != requestingUserId) {
            res.statusMessage= 'Forbidden';
            res.status(403)
                .send();
        }else {
            let filename = photoName[0].photo_filename;
            await user.deleteUserPhotos(userId, filename, req);
            res.statusMessage = 'OK';
            res.status(200)
                .send();
        }
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send();
    }
};
