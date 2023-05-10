const petitions = require( '../controllers/petitions.controller' );
const authenticate = require('../middleware/cors.middleware');

module.exports = function ( app ) {

    app.route( app.rootUrl + '/petitions' )
        .get( petitions.view )
        .post( authenticate.loginRequired, petitions.add );

    // app.route( app.rootUrl + '/petitions/categories')
    //     .get( petitions.viewCategories );

    app.route( app.rootUrl + '/petitions/:id' )
        .get( petitions.viewOnePetition )
        .patch( authenticate.loginRequired, petitions.update )
        .delete( authenticate.loginRequired, petitions.remove );

    app.route( app.rootUrl + '/petitions/:id/signatures')
        .get( petitions.viewSignatures )
        .post( authenticate.loginRequired, petitions.createSignature )
        .delete( authenticate.loginRequired, petitions.removeSignature );

    app.route( app.rootUrl + '/petitions/:id/photo')
        .get( petitions.viewPhotos )
        .put( authenticate.loginRequired, petitions.addPhotos );

};




