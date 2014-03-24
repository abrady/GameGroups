// This is an example of hooking up a request handler with a specific request
// path and HTTP verb using the Express routing API.
var fbconfig = require('cloud/fbconfig.js');

fbconfig.app_id || console.error("must set app_id in fbconfig.js");
fbconfig.app_secret || console.error("must set app_secret in fbconfig.js")

exports.graphRequest = function (path, res_cb, error_cb) {
    if (path && path[0] != '/') {
        path = '/' + path;
    }
    Parse.Cloud.httpRequest({
        url: 'https://graph.facebook.com'+path,
        success: function(httpResponse) {
            console.log(httpResponse.text);
            res_cb(httpResponse.text);
        },
        error: error_cb || function(e) {
            console.error(e);
        }
    });
}

exports.appAccessTokenRequest = function(res_cb, error_cb) {
    // app access token is cached until developer changes
    // their app secret
    if (fbconfig.app_access_token) {
        res_cb(fbconfig.app_access_token);
        return;
    }
    exports.graphRequest(
        '/oauth/access_token'
            +'?client_id='+fbconfig.app_id
            +'&client_secret='+fbconfig.app_secret
            +'&grant_type=client_credentials',
        function(res_buf) {
            res_data = res_buf.toString();
            var res_access_token = null;
            // if a well formed response this data is of the form:
            // access_token=<rest of access token>
            var s = res_data.split('=');
            if (s.length == 2 && s[0] === 'access_token' ) {
                res_access_token = s[1];
            }

            fbconfig.app_access_token = res_access_token;
            res_cb(res_access_token);
        },
        error_cb || function(error) {
            console.log("appAccessToken: default error callback invoked"+error);
            res_cb(null);
        }
    );
}


