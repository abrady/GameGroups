var express = require('express');
var fb = require('cloud/fb.js')
var fbconfig = require('cloud/fbconfig.js');

// Global app configuration section
var app = express();
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine

// add support for handling multipart/form-data posts
// ab: not needed unless we want to support file uploads via xmlhttpreqs
// req is type http.IncomingMessage
// app.use(function(req, res, next){
//     if (req.is('multipart/form-data')) {
//         req.text = '';
//         req.on('data', function(chunk){ 
//             //console.log('!!!!!! data chunk: '+chunk);
//             req.text += chunk
//         });
//         req.on('end', function() {
//             var boundary = req.headers['content-type'];
//             var delim = boundary.match('boundary=([^;]*);?')[1]
//             req.body = {}
//             // each param is bookended by the boundary above, and
//             // takes the form: 
//             // <delim>\r\nContent-Disposition: form-data; name:"param_name"\r\n\r\nparam_value\r\n<delim>
//             // this is just some hacky regexes to take care of that
//             req.text.split(delim).forEach(function(node,i,a) {           
//                 m = node.match("name=\"(.*)\"\r\n\r\n(.*)\r\n"); 
//                 if(m) { 
//                     req.body[m[1]] = m[2];
//                 }
//             });
//             //console.log('!!!! post:'+JSON.stringify(req.body));
//             next();
//         });
//     } else {
//         next();
//     }
// });
// 
app.use(express.bodyParser());    // Middleware for reading request body

// This is an example of hooking up a request handler with a specific request
// path and HTTP verb using the Express routing API.
app.get('/hello', function(req, res) {
  res.render('hello', { message: 'Congrats, you just set up your app!' });
});

index = function(req, res) {
  console.log('index');
  fb.groups.getAll(function(app_groups) {
    console.log('got groups'+JSON.stringify(app_groups));
    res.render('index', { app_id: fbconfig.app_id, app_groups: app_groups })
  });
}
app.post('/', index);
app.get('/', index);

app.post('/groupcreate', function(req, res) {
    console.log('groupcreate request body:'+JSON.stringify(req.body));
    fb.groupCreate(
        req.body.name, 
        req.body.description, 
        req.body.privacy, 
        null, 
        function (create_res) {
            res.end(JSON.stringify({"result":create_res}));
        },
        function (err) {
            res.end(JSON.stringify({"error":err}));
        }
    );             
});

// Attach the Express app to Cloud Code.
app.listen();
