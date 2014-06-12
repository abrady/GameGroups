/** @jsx React.DOM */
"use strict";

// ============================================================
// View
// ============================================================

var FriendsOnline = React.createClass({
  getAreFriendsOnline: function() { 
    console.log('getAreFriendsOnline!!!');
    FB.Canvas.areFriendsOnline(
      // Returns a bool
      function (result) {
        friends_online.setProps({online: result});
      }
  );
 },
  render: function() {
    var msg;
    if(this.props.online) {
        msg = <p>
          You have friends online, yaay!
        </p>;
    } else {
      msg = <p>
        You have no friends online
      </p>;
    }
    return (
        <div>
          {msg}
          <button onClick={this.getAreFriendsOnline}>Get Are Friends Online</button>
          <div>
            <FriendsInviteButton/>
          </div>
        </div>
    );
  }
});

var FriendsInviteButton = React.createClass({
  onDialogResponse: function(res) {
    console.log("dialog res:"+JSON.stringify(res));
  },

  dialog: function() {
    FB.ui(
      {
        method: 'sync_app_invite',
        timeout: 60,
      },
      this.onDialogResponse
    );
  },

  render: function() {
    return (
        <button onClick={this.dialog}>Invite Friends</button>
    );
  }
});

function onSyncReqFBInit() {
  friends_online.getAreFriendsOnline();
  FB.Event.subscribe(
    'canvas.friendsOnlineUpdated',
    function(data) { 
      console.log(data); 
    }
  );
  var friends_online = <FriendsOnline online={false} date={new Date()} />;
  React.renderComponent(friends_online, document.getElementById('syncinvites'));
}
