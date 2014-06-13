/** @jsx React.DOM */
"use strict";

// ============================================================
// View
// ============================================================

var SendMessageButton = React.createClass({
  getDefaultProps: function() {
    return { 'key': 'SendMessageButton'+this.props.group.id };
  },

  sendMessage: function() {
    FB.ui(
      {
        method: 'send',
        to: this.props.group.id,
        link: 'https://developers.facebook.com/docs/'
      }, 
      function(response){ 
        console.log('SendMessageButton response:'+JSON.stringify(response));
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

var GroupFacebookLink = React.createClass({
  render: function() {
    return this.transferPropsTo(
      <a 
        href={'//facebook.com/groups/'+this.props.group.id} 
        target="_newtab">
        {this.props.children}
      </a>
    );
  }
});

/**
 * get info about the group, e.g. members associated with the
 * group. 
 * passes back to top level group_area component
 */
var GetGroupInfoButton = React.createClass({
  getInfo: function() {
    FB.api(
      this.props.group.id+'/members',
      'get',
      {},
      function(members) {
        if (members.error) {
          console.log("GetGroupInfoButton error:"+members.error.message);
          return;
        }
        this.props.onMemberInfo({
          id: this.props.group.id, 
          members: members.data
        });
      }.bind(this)
    );
  },
  
  render: function() {
    return (
      <button onClick={this.getInfo}>Info</button>
    );
  }
});

var GroupListItem = React.createClass({
  deleteGroup: function() {
    sendServerReq('delete', '/appGroups', {group_ids: [this.props.group.id]}, function() {
      console.log('deleted group'+this.props.group.group.id);
    }); 
  },

  joinGroup: function() {
    FB.ui({
      method: 'game_group_join',
      id: this.props.group.id,
      display: 'async'
    }, function(response) {
      console.log(response);
      if (response.added == true) {
        console.log("you've joined the group.");
      } else {
        console.log("error: " + response.error_message);
      }
    });    
  },

  render: function() {
    var buttons = [];
    buttons.push(
      <GetGroupInfoButton 
        group={this.props.group} 
        onMemberInfo={this.props.onMemberInfo}
      />
    );
    if (this.props.canJoin) {
      buttons.push(
        <button 
          key={"joingroup_"+this.props.group.id} 
          onClick={this.joinGroup}>
          Join
        </button>);
    }
    if (this.props.canMessage) {
      buttons.push(<SendMessageButton group={this.props.group} />);
    }
    return (
      <li key={'group_'+this.props.key}>
        <GroupFacebookLink group={this.props.group}>
          {this.props.group.name+' '+this.props.key}
        </GroupFacebookLink>
        {buttons}
        <button onClick={this.deleteGroup}>Delete</button> 
      </li>
    );
  }
});

/**
 * standard graph user object. 
 * @see https://developers.intern.facebook.com/docs/graph-api/reference/v2.0/group/members
 */
var FBGroupMemberObject = React.createClass({
  getInitialState: function() {
    return { profilePictureURL: "" };
  },

  componentWillMount: function() {
    FB.api(
      this.props.user.id+'/picture',
      'get',
      function(res) {
        this.setState({ profilePictureURL: res.data.url});
      }.bind(this)
    );
  },

  render: function() {
    return (
      <div display="inline-block">
        <img src={this.state.profilePictureURL} alt="profile picture"/>
        {this.props.user.name}
        {this.props.user.id}
      </div>
    );
  }
});

var GroupInfo = React.createClass({
  render: function() {
    if (!Object.keys(this.props.info).length) {
      return <div/>;
    }
    var members = [];
    this.props.info.members.map(
      function(member) {
        members.push(<FBGroupMemberObject key={member.id} user={member} />);
      }
    );
    return (
      <div>
        {members}
      </div>
    );
  }
});

var GroupArea = React.createClass({
  getInitialState: function() {
    return { 
      playerGroups: {}, 
      appGroups: {},
      groupInfo: {}
    };
  },

  processFetchedGroups: function(groups) {
    var res = {};
    groups.forEach(
      function(group) {
        res[group.id] = group;
      }
    );
    return res;
  },

  getPlayerGroups: function() {
    FB.api(
      '/me/groups', 
      'get', 
      {},
      function(groups_res) {
        this.setState({playerGroups: this.processFetchedGroups(groups_res.data)});
      }.bind(this)
    );
  },

  getAppGroups: function() {
    console.log('getting app groups');
    sendServerReq(
      'get', 
      '/appGroups', 
      {}, 
      function(app_groups) {
        this.setState({appGroups: this.processFetchedGroups(app_groups)});
      }.bind(this)
    );
  },

  getAllGroups: function() {
    this.getPlayerGroups();
    this.getAppGroups();
  },

  componentWillMount: function() {
    this.getAllGroups();
  },

  /**
   * called when a child component gets info about a particular group
   */
  onMemberInfo: function(info) {
    this.setState({groupInfo: info });
  },

  renderPlayerGroups: function() {
    if (!this.state.playerGroups) {
      return [];
    }
    return Object.keys(this.state.playerGroups).map(
      function(group_key) {
        var group = this.state.playerGroups[group_key];
        return <GroupListItem 
          key={group.id} 
          group={group} 
          canMessage={true} 
          onMemberInfo={this.onMemberInfo} 
        />;
      }.bind(this)
    );
  },

  renderAppGroups: function() {
    if (!this.state.appGroups) {
      return [];
    }
    return Object.keys(this.state.appGroups).map(
      function(group_key) {
        var group = this.state.appGroups[group_key];
        return <GroupListItem 
          key={group.id} 
          group={group} 
          canJoin={!(group.id in this.state.playerGroups)} 
          onMemberInfo={this.onMemberInfo} 
        />;
      }.bind(this)
    );
  },

  render: function() {    
    return (
      <div>
        <CreateGroup/>
        <h4>Player Groups</h4>
        <ul>
          {this.renderPlayerGroups()}
        </ul>
        <h4>App Groups</h4>
        <ul>
          {this.renderAppGroups()}
        </ul>
        <GroupInfo info={this.state.groupInfo} />
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
  xhr.onreadystatechange=function() {
    if (xhr.readyState==4)
    {
      if(xhr.status==200) {
        if (res_cb) {
          res_cb(JSON.parse(xhr.responseText));
        }
      } else {
        if (err_cb) {
          err_cb(xhr.status, xhr.responseText);
        } else {
          console.error('request failed: ' +path);
        }         
      }
    }
  };
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
  };
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
