
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const OAuth2 = require('oauth').OAuth2;
const session = require('express-session');
const crypto = require('crypto');
const axios = require('axios');
const app = express();
const port = 3000;
// 


var nodemailer = require('nodemailer');
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redURI = process.env.RED_URI;
const baseSite = process.env.BASE_SITE;
const authorizePath = process.env.AUTHORIZE_PATH;
const accessTokenPath = process.env.ACCESS_TOKEN_PATH;

const oauth2 = new OAuth2(
    clientId,
    clientSecret,
    baseSite,
    authorizePath,
    accessTokenPath,
    null // Custom headers, if needed
);

app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: true,
}));


app.set('view engine', 'ejs');
app.use(express.static('public'));

// ------------------------------------------------------------------------------------------------------
// / route
app.get('/', (req, res) => {
    res.render('index');
});





// /me route
app.get('/me', async (req, res) => {
    const accessToken = req.session.accessToken;
    try {
        // Use the access token to make a request to the API
        const { data } = await axios.get(`${baseSite}/v2/me`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        // Respond with the API data
        res.render('me', { data: data });
    } catch (error) {
        console.error('Error fetching data from the API:', error.message);
        res.redirect('/');
    }
});

// /42 route
app.get('/42', (req, res) => {
    let oauthURI = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${redURI}&response_type=code`;
    res.redirect(oauthURI);
});

app.get('/RedirectURI', (req, res) => {
    const { code } = req.query;
    if (code == undefined) {
        res.redirect('/');
        return;
    }
    // Exchange the code for an access token
    oauth2.getOAuthAccessToken(
        code,
        { grant_type: 'authorization_code', redirect_uri: redURI },
        (err, accessToken, refreshToken, params) => {
            if (err) {
                return res.status(500).json({ error: 'Error getting access token', details: err });
            }
            req.session.accessToken = accessToken;
            res.redirect('/me');
        }
    );
});
// ------------------------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------------------------
// rest of routes
app.get('/*', (req, res) => {
    res.redirect('/');
});
// ------------------------------------------------------------------------------------------------------


// Start the server
try {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
} catch (error) {
    console.log(`App: ${error}`);
}    


