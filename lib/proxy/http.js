
//var request = require( 'superagent' ).agent();
var request = require('request');
var version = require( '../../package' ).version;
var _ = require('lodash');

var isFunction = function(o) {
    return Object.prototype.toString.call(o) === '[object Function]';
};

function maybeCallback(callback) {
    return isFunction(callback) ? callback : function(err) { throw err; }
}


function Proxy( options ){
    if( !options ) options = {};
    if( !options.store ) options.store = ( require( '../storage/null' ) )();
    options.userAgent = options.userAgent || 'huntsman/' + version;
    this.options = options;
    this.stats = {
        completed:0,
        error:0,
        waiting:0
    };
    this.openRequests = {};
}

Proxy.prototype.getStats = function() {
    return this.stats;
};

Proxy.prototype.cancle = function(uri) {
    var self = this;
    try{
        self.openRequests[uri].abort();
        delete[self.openRequests[uri]];
    }
    return this.stats;
};

Proxy.prototype.request = function(uri, requestOptions, cb){
    var self = this;
    self.stats.waiting++;

    cb = maybeCallback(arguments[arguments.length-1]);
    if (!requestOptions || isFunction(requestOptions)) {
        requestOptions = this.options;
    }else{
        requestOptions = _.extend(this.options,requestOptions);
    }
    requestOptions.url = uri;
    console.log(requestOptions);
    var hit = self.options.store.get( uri );
    if( hit ) {
        self.stats.waiting--;
        return cb.apply( null, hit );
    }
    var req = request(requestOptions, function (err, response, body) {
        self.stats.waiting--;
        if( err ) {
            self.error++;
            return cb( err, { uri: uri } );
        }
        self.stats.completed++;
        var result = [ err, {
            uri: uri,
            statusCode: response.statusCode,
            headers: response.headers,
            body: body || ''
        } ];
        self.options.store.set( uri, result );
        return cb.apply( null, result );
    });
    //if(requestOptions.timeout){
    //    setTimeout(req.abort,requestOptions.timeout)
    //}
};

module.exports = Proxy;