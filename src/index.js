import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = join(__dirname, '..', '.gcp-saved-tokens.json');
const CREDENTIALS_PATH = join(__dirname, '..', 'gcp-oauth.keys.json');

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  
  const oAuth2Client = new OAuth2Client(
    key.client_id,
    key.client_secret,
    key.redirect_uris[0]
  );

  // Generate the url that will be used for authorization
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url:', authorizeUrl);
  
  // Wait for the authorization code
  const code = await new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.on('data', (data) => {
      resolve(data.toString().trim());
    });
  });

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  
  await saveCredentials(oAuth2Client);
  return oAuth2Client;
}

async function listEvents(auth) {
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });
  
  return res.data.items;
}

export { authorize, listEvents }; 