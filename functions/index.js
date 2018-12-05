const  functions = require('firebase-functions');
const  express = require('express');
const admin = require('firebase-admin');
const https = require('https');
const FCM = require('fcm-node');


// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//

const app = express();

var serviceAccount = require("groupy-79fd4-firebase-adminsdk-yd7ka-92d0e7a874.json");

var conversationParams; 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://groupy-79fd4.firebaseio.com"
});

var fcm = new FCM(serviceAccount)

var db = admin.database();
/*
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://groupy-nanorep.firebaseio.com"
  });*/

  
function getUsers() {

    const ref = db.ref('users');
    return ref.once('value').then(snap => snap.val());
}

function getUserByName(name) {

    const ref = db.ref('users');
    return ref.orderByChild("name").equalTo(name).once('value').then(snap => snap.val());
}

app.get('/users', (request, response) => {
    var db = admin.database();
    var ref = db.ref("users");
    ref.on("value", function (snapshot) {
        console.log(snapshot.val());
        response.send(snapshot.val());
      }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
      });
});

app.get('/groupEvent', (request, response) => {
     let type =request.query.type;
     let message = {
        isInnerMessage : false,
        messageFrom : 'groupEvent'
    }
     switch (type){
         case "online":
         {
            message.body = 'Asaf ping 1'
            break;
         }
         case "approved":
         {
            message.body = 'final approval'
            break;
         }
         case "payment":
         {
            message.body = 'Asaf ping 3'
            break;
         }
     }

     onAddNewMessage(message);

     response.send('get approve request')
});




app.get('/timestamp', (request, response) => {
    response.send("Hello from Firebass dasdasdsdsse!");
   });


function listenToConversationParams()
{
    var db = admin.database();
    var ref = db.ref("conversationParams");
    ref.on("value",  (snapshot) => {
        conversationParams = snapshot.val();}
      , function (errorObject) {
        console.log("The read failed: " + errorObject.code);
      });
}



function listenToMessageChange()
{
    var db = admin.database();
    var ref = db.ref("messages");
   ref.on("child_added", onAddNewMessage);
}

function onAddNewMessage(messageIncoming) {
    var message;
    if (typeof messageIncoming.val !== 'undefined'){
        message = messageIncoming.val();
    }
    else{
        message = messageIncoming;
    }

    if (!message.isInnerMessage  && message.messageFrom !== 'bot') {
        console.log("bbbbbbbbb")
        https.get(`https://qa07.nanorep.com/~jio/api/conversation/v1/statement?statement=${message.body}&id=${conversationParams.conversationId}`, (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
              
                let ans = JSON.parse(data);
                console.log(ans.text)
                let db = admin.database();
                let ref = db.ref();
                let messageRef = ref.child("messages");
                messageRef.push({
                    body: ans.text,
                    isInnerMessage: false,
                    messageFrom: "bot"
                });



            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    }
}


function listenToInvitationMessageChange()
{
    var db = admin.database();
    var ref = db.ref("invitationMessages");
   ref.on("child_added", onAddNewInvitation);
}

function onAddNewInvitation(invitaitonIncoming)
{
    var invitaiton = invitaitonIncoming.val();
    //call api to send push notifiaction

    getUserByName(invitaiton.toUserName).then(user => {
            var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                to: user[1].token,
                
                notification: {
                    title: 'Title of your push notification', 
                    body: invitaiton.body
                }
            }
            fcm.send(message, function(err, response){
                if (err) {
                    console.log("Something has gone wrong!")
                } else {
                    console.log("Successfully sent with response: ", response)
                }
            })
        });


}




listenToConversationParams();
listenToMessageChange();
listenToInvitationMessageChange();

/*
let message = {
    isInnerMessage : false,
    messageFrom : 'groupEvent',
    body : "Asaf ping 1"
}
onAddNewMessage(message);
*/

exports.app = functions.https.onRequest(app);



