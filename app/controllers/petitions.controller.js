const petitions = require('../models/petitions.model');

exports.view = async function(req, res) {

    let count = req.query.count;
    let q = req.query.q;
    let categoryId = req.query.categoryId;
    let authorId = req.query.authorId;
    let sortBy = req.query.sortBy;
    let startIndex = 0;
    if (req.query.startIndex !== undefined) {
        startIndex = req.query.startIndex;
    }

    try {
        const rows = await petitions.getPetitions(q, authorId, categoryId, sortBy);
        if (count === undefined) {
            count = rows.length
        }
        if (rows === null) {
            res.statusMessage = 'Bad Request';
            res.status(400)
                .send();
        }
        else {
            var i;
            let result = [];
            for (i = 0; i < count; i++) {
                if (startIndex > rows.length) {
                    break;
                }
                if (rows[startIndex] !== undefined) {
                    result.push(rows[startIndex]);
                    startIndex++;
                }
            }
            res.statusMessage = 'OK';
            res.status(200)
                .send(result);
        }
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send();
    }
};

exports.add = async function(req, res) {

    let authorId = req.authenicatedUserId;
    var createdDate = new Date();
    var closingDate = new Date(req.body.closingDate);

    let newPetition = {
        'title': req.body.title,
        'description': req.body.description,
        'author_id': authorId,
        'category_id': req.body.categoryId,
        'created_date': createdDate,
        'closing_date': closingDate
    };
    try {
        if (newPetition.created_date.getTime() >= newPetition.closing_date.getTime() || newPetition.category_id < 1 && newPetition.category_id > 7 || newPetition.title === undefined) {
            res.statusMessage = 'Bad Request';
            res.status(400)
                .send();
        } else {
           const rows = await petitions.addPetition(newPetition);
           const petitionId = {
               'petitionId': rows[0].insertId
           };
           res.statusMessage = 'Created';
           res.status(201)
               .send(petitionId);
        }
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send();
    }
};

exports.viewOnePetition = async function(req, res) {
    let petitionId = req.params.id;
    if (petitionId === 'categories') {
        await viewCategories(req, res);
        return;
    }

    try {
        const petition = await petitions.getOnePetition(petitionId);
        if (petition[0].petitionId == null) {
            res.statusMessage = 'Not found';
            res.status(404)
                .send();
        } else {
            res.statusMessage = 'OK';
            res.status(200)
                .send(petition[0]);
        }
    } catch (err) {

        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send();
    }
};

exports.update = async function(req, res) {

    let authorId = req.authenicatedUserId;
    let reqPetitionId = req.params.id;
    let categoryId = req.body.categoryId;
    let values = {
        'title': req.body.title,
        'description': req.body.description,
        'category_id': req.body.categoryId,
        'closing_date': req.body.closingDate
    };

    if (values.title === undefined) {
        delete values['title'];
    }
    if (values.description === undefined) {
        delete values['description'];
    }
    if (values.category_id === undefined) {
        delete values['category_id'];
    }
    if (values.closing_date === undefined) {
        delete values['closing_date'];
    }

    try {

        const petition = await petitions.getOnePetition(reqPetitionId);
        if (petition[0].petitionId === null) {
            res.statusMessage = 'Not found';
            res.status(404)
                .send();
        }

        if (petition[0].authorId !== authorId) {
            res.statusMessage = 'Forbidden';
            res.status(403)
                .send();
        }

        var createdDate = new Date(petition[0].createdDate);
        var closingDate = new Date(req.body.closingDate);

        if (createdDate.getTime() >= closingDate.getTime() || categoryId < 1 && categoryId > 7) {
            res.statusMessage = 'Bad Request';
            res.status(400)
                .send();
        } else {
            await petitions.updateDetails(values, req.params.id);
            res.statusMessage = 'OK';
            res.status(200)
                .send();
        }

    } catch (err) {
        console.log(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send();
    }
};

exports.remove = async function(req, res) {
    let reqPetitionId = req.params.id;
    let authorId = req.authenicatedUserId;
    try {
        const petition = await petitions.getOnePetition(reqPetitionId);
        if (petition[0].petitionId == null) {
            res.statusMessage = 'Not found';
            res.status(404)
                .send();
        }
        if (petition[0].authorId !== authorId) {
            res.statusMessage = 'Forbidden';
            res.status(403)
                .send();
        } else {
            await petitions.removePetition(reqPetitionId);
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

async function viewCategories(req, res) {
    try {
        const categories = await petitions.getCategories();
        res.statusMessage = 'OK';
        res.status(200)
            .send(categories);
    } catch (err) {
        console.log(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send();
    }
}

exports.viewSignatures = async function(req, res) {
    const petitionId = req.params.id;
    try {
        const petition = await petitions.getOnePetition(petitionId);
        if (petition[0].petitionId == null) {
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
        } else {
            const signatures = await petitions.getSignatures(petitionId);
            res.statusMessage = 'OK';
            res.status(200)
                .send(signatures);
        }
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send();
    }
};

exports.createSignature = async function(req, res) {
    const petitionId = req.params.id;
    const userId = req.authenicatedUserId;
    try {
        const petition = await petitions.getOnePetition(petitionId);
        if (petition[0].petitionId === null) {
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
        }
        let signatureCheck = await petitions.checkSignature(petitionId, userId);
        var closingDate = petition[0].closingDate;
        var signedDate = new Date();
        if (closingDate === null) {
            closingDate = new Date('3020-04-19T10:27:43.715Z')
        }
        if (signatureCheck.length === 1 || signedDate.getTime() >= closingDate.getTime()) {
            res.statusMessage = 'Forbidden';
            res.status(403)
                .send();
        }
        else {
            await petitions.addSignature(userId, petitionId, signedDate);
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

exports.removeSignature = async function(req, res) {
    const petitionId = req.params.id;
    const userId = req.authenicatedUserId;
    try {
        const petition = await petitions.getOnePetition(petitionId);
        if (petition[0].petitionId == null) {
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
        }
        let signatureCheck = await petitions.checkSignature(petitionId, userId);
        var closingDate = petition[0].closingDate;
        var signedDate = new Date();
        if (signatureCheck.length === 0 || signedDate.getTime() > closingDate.getTime() || petition[0].authorId == userId) {
            res.statusMessage = 'Forbidden';
            res.status(403)
                .send();
        } else {
            await petitions.deleteSignature(petitionId, userId);
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

exports.viewPhotos = async function(req, res) {
    const petitionId = req.params.id;
    try {
        const imageDetails = await petitions.getPhotos(petitionId);
        const petition = await petitions.getOnePetition(petitionId);
        if (petition[0].petitionId == null || imageDetails === null || imageDetails === undefined) {
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
    const petitionId = req.params.id;
    const userId = req.authenicatedUserId;
    try {
        const petition = await petitions.getOnePetition(petitionId);
        const photoCheck = await petitions.getPhotoName(petitionId);
        if (petition[0].petitionId == null) {
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
        }
        if (petition[0].authorId != userId) {
            res.statusMessage = 'Forbidden';
            res.status(403)
                .send();
        }
        if (req.headers["content-type"] !== 'image/jpeg' && req.headers["content-type"] !== 'image/png' && req.headers["content-type"] !== 'image/gif') {
            res.statusMessage = 'Bad Request';
            res.status(400)
                .send();
        }
        if (photoCheck[0].photo_filename !== null) {
            await petitions.insertPhotos(petitionId, req);
            res.statusMessage = 'OK';
            res.status(200)
                .send();
        }
        else {
            await petitions.insertPhotos(petitionId, req);
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


