const  functions = require('firebase-functions');
const  express = require('express');


// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//

const app = express();

app.get('/timestamp', (request, response) => {
    response.send("Hello from Firebasssse!");
   });

exports.app = functions.https.onRequest(app);
