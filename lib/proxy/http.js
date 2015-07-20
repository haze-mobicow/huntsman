
//var request = require( 'superagent' ).agent();
var request = require('request');
var version = require( '../../package' ).version;

module.exports = function( options ){
  if( !options ) options = {};
  if( !options.store ) options.store = ( require( '../storage/null' ) )();
  options.userAgent = options.userAgent || 'huntsman/' + version;
  return function( uri, cb ){
    var hit = options.store.get( uri );
    options.url = uri;
    if( hit ) return cb.apply( null, hit );
  request(options, function (err, response, body) {
      if( err ) return cb( err, { uri: uri } );
      var result = [ err, {
        uri: uri,
        statusCode: response.statusCode,
        headers: response.headers,
        body: body || ''
      } ];
      options.store.set( uri, result );
      return cb.apply( null, result );
    });
  };
};
