const users = require( '../controllers/users.controller' );
const authenticate = require('../middleware/cors.middleware');

module.exports = function ( app ) {

    app.route( app.rootUrl + '/users/register' )
        .post( users.create );

    app.route( app.rootUrl + '/users/login' )
        .post( users.login );

    app.route( app.rootUrl + '/users/logout' )
        .post( authenticate.loginRequired, users.logout );

    app.route( app.rootUrl + '/users/:id' )
        .get( authenticate.loginNotRequired, users.view )
        .patch( authenticate.loginRequired, users.update );

    app.route( app.rootUrl + '/users/:id/photo' )
        .get( users.viewPhotos )
        .put( authenticate.loginRequired, users.addPhotos )
        .delete( authenticate.loginRequired, users.deletePhotos );

};