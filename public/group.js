"use strict";

var ge = function(e) {
  return typeof e == 'string' ? document.getElementById(e) : e;
};
var $ = function(args) {
  var e = ge.apply(this, arguments);
  if (!e) {
    throw new Error('Tried to get element '+args+'but it is not present in the page. Use ge() instead.');
  }
  return e;
}

// generic command sender, response is logged
// res is of form([true,false],response text)
function server_send_cmd(cmd,args, res) {
  xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange=function()
  {
    if (xmlhttp.readyState==4)
    {
      console.log(xmlhttp.status +', '+ xmlhttp.responseText);
      if (res) {
        res(xmlhttp.status==200, xmlhttp.responseText)
      }
    }
  }

  xmlhttp.open("GET",cmd+'?res='+escape(args),true);
  xmlhttp.send();
}

function permissions_validate(perms_string, response) {
  var missing = '';
  var perms = perms_string.split(',');
  for(var i = 0; i < perms.length; ++i) {
    var k = perms[i];
    if (-1 == response.perms.indexOf(k))
      missing += (missing?', ':'')+k;
  }
  if(missing) {
    console.log('missing permissions: ' + missing);
    return false;
  }
  return true;
}

// log the user in/ask permissions
// note: on_logged_in() takes further actions
function onFBInit() {
  var permissions = ''; // 'publish_stream,publish_actions,user_games_activity';
  FB.login(
      function(response) {
          if(response.authResponse) {
              // logged in
              onLogin();
            }},
      {scope: permissions}
    );
}

function onLogin() {
  // console.log('access_token: ' + FB.getAccessToken());
  //  FB.api('/me', user_recv);
  getUserGroups(printUserGroups);
}

function printUserGroups(groups) {
  var node = $('player_groups');
  console.log('groups res'+JSON.stringify(groups));
}

function getUserGroups(res_cb) {
  fbGraphGet(
    '/me/groups?parent='+fbconfig.app_id+'&access_token='+FB.getAccessToken(), 
    res_cb
  );
}

function fbGraphGet(path, res_cb, err_cb) {
  if (path && path[0] != '/') {
    path = '/' + path;
  }
  var xhr = new XMLHttpRequest();
  console.log("get user groups");
  xhr.open(
    'get', 
    'https://graph.facebook.com'+path,
    true
  );
  xhr.onreadystatechange=function()
  {
    if (xhr.readyState==4)
    {
      if(xhr.status==200) {
        if (res_cb) {
          res_cb(JSON.parse(xhr.responseText))
        }
      } else {
        if (err_cb) {
          err_cb(xhr.status, xhr.responseText);
        } else {
          console.error('request failed: ' +path);
        }         
      }
    }
  }
  xhr.send();
}

function onGroupCreateRes(res_str) {
  // {"result":"{\"id\":\"1488155834741485\"}"}
  res_json = JSON.parse(res_str);
  console.log("result: "+res_json.result);
}

function submitForm(form_elt, res)
{
  var xhr = new XMLHttpRequest();
  console.log("submitting, method: "+form_elt.method+" action: "+form_elt.action);
  xhr.onload = res;
  xhr.open(form_elt.method, form_elt.action, true);
  xhr.setRequestHeader("Content-type", "application/json");
  //    xhr.send(new FormData (form_elt)); <= screw this. sends as multipart/form-data
  //http://www.w3.org/TR/2010/WD-XMLHttpRequest2-20100907/#dom-xmlhttprequest-send
  form_fields = {};
  for(i=0; i<form_elt.elements.length; i++)
  {
    if (form_elt.elements[i].name) {
      form_fields[form_elt.elements[i].name] = form_elt.elements[i].value;
    }
  }
  xhr.send(JSON.stringify(form_fields));
  return false; // signal that the submit was handled
}
