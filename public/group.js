/** @jsx React.DOM */
"use strict";

// ============================================================
// View
// ============================================================

// var HelloWorld = React.createClass({
//   render: function() {
//     return (
//       <p>
//         Hello, <input type="text" placeholder="Your name here" />!
//         It is {this.props.date.toTimeString()}
//       </p>
//     );
//   }
// });

// React.renderComponent(<HelloWorld date={new Date()} />);

var CreateGroup = React.createClass({
  getInitialState: function() {
    return { name: 'group name', description: 'group description' };
  },
  
  onSubmit: function(event) {
    // action="groupcreate" method="post"
    console.log('on submit');
  },

  onNameChange: function(e) {
    this.setState({name: e.target.value});
  },

  render: function() {
    return (
      <div>
        <h3>Make New Group</h3>
        <form name="input" id="groupcreate" onSubmit={this.onSubmit}>
          Name: <input type="text" name="name" onChange={this.onNameChange} value={this.state.name}></input>
          <input type="text" name="description" value={this.state.description}></input>
          <input type="submit" value="Submit"></input>
        </form>
      </div>
    );
  }
});


React.renderComponent(<CreateGroup/>, $('create_group') );

// ============================================================
// Data
// ============================================================

var GroupsTable = React.createClass({
    render: function() {
      var rows = [];
      this.props.products.forEach(function(product) {
        if (product.category !== lastCategory) {
          rows.push(<ProductCategoryRow category={product.category} key={product.category} />);
        }
        rows.push(<ProductRow product={product} key={product.name} />);
        lastCategory = product.category;
      });
    }
});
 
function ge(e) {
  return typeof e == 'string' ? document.getElementById(e) : e;
};
function $(args) {
  var e = ge.apply(this, arguments);
  if (!e) {
    throw new Error('Tried to get element '+args+'but it is not present in the page. Use ge() instead.');
  }
  return e;
}

var createElement = function(elt) { return document.createElement(elt); }

var makeButton = function(label, onclick) {
  var button = createElement('button');
  button.className = 'groupDelete';
  button.innerHTML = label;
  button.onclick = onclick;
  return button;
}

function deleteElement(elt) {
 elt.parentElement.removeChild(elt);
}

function getGroupInfo(group_name, group_id) {
  fbGraphGet(group_id, function(group_info) {
    console.log('groupInfo '+JSON.stringify(group_info));
    var info = $('group_info');
    info.innerHTML = '<h3>Group '+group_name+'</h3>';    
  });
}

function makeGroupsList(list_root) {
  return function(group) {
    var li = createElement('li');
    var div = createElement('div');
    div.className='groupName';
    div.innerHTML = group.name+'  '+group.id;
    li.appendChild(div);
    li.id = group.id;
    li.onclick = function() {
      getGroupInfo(group.name, group.id);
    };
    var btn_del = makeButton(
      'X', 
      function() {
        deleteElement($(li.id));
        sendServerReq('delete', '/appGroups', {group_ids: [group.id]}, function() {
          console.log('deleted group'+group.id);
        })
      }
    );
    li.appendChild(btn_del);
    list_root.appendChild(li);
  }
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
  getPlayerGroups();
  getAppGroups();
}

function getPlayerGroups(res_cb) {
  fbGraphGet(
    'me/groups?access_token='+FB.getAccessToken()+'&parent='+fbconfig.app_id,
    function(groups_res) {
      var node = $('player_groups');
      var ul = createElement('ul');

      node.innerHTML = '<h3>Player Groups</h3>';
      node.appendChild(ul);
      groups_res.data.forEach(makeGroupsList(ul));
      if (!groups_res.data.length) {
        ul.innerHTML = '<li><i>No Player Groups</i></li>';
      }
    }
  );
}

function fbGraphGet(path, res_cb, err_cb) {
  if (path && path[0] != '/') {
    path = '/' + path;
  }
  var xhr = new XMLHttpRequest();
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
  console.log("created group: "+res_json.result);
  
}

/**
 * Submit a json structured request to the server for handling
 * @param method: post, get, etc.
 * @param path: the path to hit on the server
 * @param json_payload: what to send, must be JSON.stringify-able
 */
function sendServerReq(method, path, json_payload, res) {
  console.log("submitting, method: "+method+" path: "+path);
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange=function()
  {
    if (xhr.readyState==4)
    {
      if(xhr.status==200) {
        console.log('sendServerReq('+method+'):'+xhr.responseText);
        if (res) {
          res(JSON.parse(xhr.responseText));
        }
      } else {
        console.error('sendServerReq('+method+') failed');
      }
    }
  }
  xhr.open(method, path, true);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.send(JSON.stringify(json_payload));
}

function submitForm(form_elt, res)
{
  //    xhr.send(new FormData (form_elt)); <= screw this. sends as multipart/form-data
  //http://www.w3.org/TR/2010/WD-XMLHttpRequest2-20100907/#dom-xmlhttprequest-send
  var form_fields = {};
  for(var i=0; i<form_elt.elements.length; i++)
  {
    if (form_elt.elements[i].name) {
      form_fields[form_elt.elements[i].name] = form_elt.elements[i].value;
    }
  }
  sendServerReq(form_elt.method, form_elt.action, form_fields, res);
  return false; // signal that the submit was handled
}

function getAppGroups() {
  console.log('getting app groups');
  sendServerReq('get', '/appGroups', {}, function(app_groups) {
    var root = $('app_groups');
    var header = createElement('h3');
    header.innerHTML = 'Groups Owned By App';

    var ul = createElement('ul');
    app_groups.forEach(makeGroupsList(ul));
    
    root.innerHTML = '';
    root.appendChild(header);
    root.appendChild(ul);
    
  });
}
