/** @jsx React.DOM */
"use strict";

// ============================================================
// View
// ============================================================

var MessageGroup = React.createClass({
  sendMessage: function() {
    FB.ui(
      {
        method: 'send',
        link: 'https://developers.facebook.com/docs/'
      }, 
      function(response){ 
        console.log('MessageGroup response:'+JSON.stringify(response));
      }
    );
  },
  render: function() {
    return (
      <button onClick={this.sendMessage}>Send Message</button>
    );
  }
});  

var CreateGroup = React.createClass({
  getInitialState: function() {
    return { name: 'group name', description: 'group description' };
  },
  
  onSubmit: function(event) {
    // action="groupcreate" method="post"
    console.log('on submit');
    submitForm(ge('groupcreate'), 'post', function(res) { console.log("res: "+JSON.stringify(res)); });
    return true;
  },

  onNameChange: function(e) {
    this.setState({name: e.target.value});
  },

  onDescriptionChange: function(e) {
    this.setState({description: e.target.value});
  },

  render: function() {
    return (
      <div>
        <h3>Make New Group</h3>
        <form name="input" id="groupcreate" onSubmit={this.onSubmit} method="/groupcreate">
          Name: <input type="text" name="name" onChange={this.onNameChange} value={this.state.name}></input>
          <input type="text" name="description" onChange={this.onDescriptionChange} value={this.state.description}></input>
          <input type="submit" value="Submit"></input>
        </form>
      </div>
    );
  }
});

var GroupListItem = React.createClass({
  deleteGroup: function() {
    deleteElement($(li.id));
    sendServerReq('delete', '/appGroups', {group_ids: [group.id]}, function() {
      console.log('deleted group'+group.id);
    }); 
  },

  render: function() {
    return (
      <li id={'group_'+this.props.id}>
        {this.props.name+' '+this.props.id}
        <button onClick={this.deleteGroup}>Delete</button>
      </li>
    );
  }
});

var GroupList = React.createClass({
  render: function() {
    if (!this.props.groups) {
      return(<div/>);
    }
    var list_items = this.props.groups.map(
      function(group_data) {
        return <GroupListItem id={group_data.id} name={group_data.name} />;
      }
    );
    return (
      <ul>
        {list_items}
      </ul>
    );
  }
});

var GroupArea = React.createClass({
  getInitialState: function() {
    return { 
      playerGroups: [], 
      appGroups: [] 
    };
  },

  getPlayerGroups: function(res_cb) {
    var self = this;
    fbGraphGet(
      'me/groups?access_token='+FB.getAccessToken()+'&parent='+fbconfig.app_id,
      function(groups_res) {
        self.setState({playerGroups: groups_res.data});
      }
    );
  },

  getAppGroups: function() {
    console.log('getting app groups');
    var self = this;
    sendServerReq('get', '/appGroups', {}, function(app_groups) {
      self.setState({appGroups: app_groups});
    });
  },

  getAllGroups: function() {
    this.getPlayerGroups();
    this.getAppGroups();
  },

  componentWillMount: function() {
    this.getAllGroups()
  },
  
  render: function() {
    return (
      <div>
        <CreateGroup/>
        <MessageGroup/>
        <h4>Player Groups</h4>
        <GroupList groups={this.state.playerGroups} />
        <h4>App Groups</h4>
        <GroupList groups={this.state.appGroups} />
      </div>
    );
  }
});

// ============================================================
// Data
// ============================================================
 
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
  group_area.getAllGroups();
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

function submitForm(form_elt, action, res)
{
  form_elt.method || console.error("must set form.method");
  //    xhr.send(new FormData (form_elt)); <= screw this. sends as multipart/form-data
  //http://www.w3.org/TR/2010/WD-XMLHttpRequest2-20100907/#dom-xmlhttprequest-send
  var form_fields = {};
  for(var i=0; i<form_elt.elements.length; i++)
  {
    if (form_elt.elements[i].name) {
      form_fields[form_elt.elements[i].name] = form_elt.elements[i].value;
    }
  }
  sendServerReq(form_elt.method, action, form_fields, res);
  return false; // signal that the submit was handled
}

// log the user in/ask permissions
// note: on_logged_in() takes further actions
var group_area = <GroupArea/>;
function onGroupsFBInit() {
  React.renderComponent(group_area, $('group_area') );
}
