// Require express
const express = require('express');

// Require middleware
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');

// Require Helper Functions
const { userLookup, urlsForUser, generateRandomID } = require('./helpers');

// Requre Constants
const { PORT, salt } = require('./constants');

// Require Databases
const { urlDatabase, userDatabase } = require('./databases');

// Constants
const app = express();

// Global Variables
let frequencyTracker = 0; // Tracks number of visits to /urls/:id
let uniqueFreqTracker = 0; // Tracks number of UNIQUE visits to /urls/:id

// View Engine
app.set('view engine', 'ejs'); // set ejs as view engine

// Middleware
app.use(express.urlencoded({ extended: true })); // set to false and you don't need body-parser
app.use(bodyParser.json()); // parse request bodies to JSON
app.use(morgan('dev')); // Shows client connection details in server
app.use(methodOverride('_method')); // Allows use of HTTP methods PUT and DELETE
app.use(cookieSession({
  name: 'session',
  keys: ['keys1'],
}));

// HTTP METHOD HANDLERS
// Root route, redirects to /urls page
app.get('/', (req, res) => {
  res.redirect('/urls');
});

// Route to get login path and render login.ejs template
app.get('/login', (req, res) => {
  res.render('login');
});

// Route to post user_id cookie to login page then redirect to /urls
app.post('/login', (req, res) => {
  // Store current user information
  const currentUser = userLookup(req.body.email, userDatabase);

  // Check if the fields are filled out properly
  if (!req.body.email || !req.body.password) return res.status(400).send("Email and/or password fields cannot be empty");

  // Check if the user doesn't exist
  else if (currentUser === null) return res.status(404).send(`That user with email ${req.body.email} doesn't exist`);

  // Check if existing hashed password matches current inputted password
  else if (!bcrypt.compareSync(req.body.password, currentUser.password)) return res.status(403).send("Incorrect Password");

  // Else find the user ID and add it as a cookie
  const userId = currentUser.id;
  req.session.user_id = userId; // set existing userID as cookie

  res.redirect('/urls');
});

// Route to prompt user registration
app.get('/register', (req, res) => {
  res.render('register');
});

// Route to post registration info of user into database and redirect to /urls
app.post('/register', (req, res) => {
  // Generate UserID
  const randomUserId = generateRandomID();

  // Check if any form field is empty
  if (!req.body.email || !req.body.password) return res.status(400).send("Email and/or password fields cannot be blank.");

  // Check if user already exists
  if (userLookup(req.body.email, userDatabase) !== null) return res.status(400).send(`A user with email ${req.body.email} already exists.`);

  // Add user information to the database
  userDatabase[randomUserId] = {
    id: randomUserId,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, salt) // hash the password before storing
  };

  // Set cookie to remember user ID
  req.session.user_id = randomUserId; // set encrypted cookie
  res.redirect('/urls');
});

// Route to post a logout by clearing the user_id cookie and redirecting to /urls
app.post('/logout', (req, res) => {
  req.session = null; // Clears current user's encrypted cookie
  res.redirect('/login');
});

// Route to return the urlDatabase as a JSON object
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase); // converts to JSON
});

// Route to display a list of URLs, renders an HTML template with url data
app.get('/urls', (req, res) => {
  // Store current user information
  const currentUserId = req.session.user_id;
  const currentUser = userDatabase[currentUserId];

  // Check if current user is logged in
  if (!currentUser) {
    // If not logged in, render a message
    return res.render('urls_index', { urls: null, currentUser: null, userURLS: null });
  }

  // If user is logged in, show the URLs
  const userURLS = urlsForUser(currentUserId, urlDatabase);

  // Pass only the user's urls to the template
  const templateVars = { urls: userURLS, currentUser };
  res.render('urls_index', templateVars);
});

// Route to create a new URL, renders an HTML template form to submit a new URL
app.get('/urls/new', (req, res) => {
  // Store current user information
  const currentUserId = req.session.user_id;
  const currentUser = userDatabase[currentUserId];

  const templateVars = { currentUser };

  // If current user doesn't exist in the DB, redirect to /login path
  if (!currentUser) return res.redirect('/login');

  res.render('urls_new', templateVars);
});

// Route to post a new URL and store the data in the database, then redirect to the specific URL for the ID
app.post('/urls', (req, res) => {
  // Store current user information
  const currentUserId = req.session.user_id;

  // Handle case where user is not logged in
  if (!currentUserId) return res.status(403).send('Must be registered and logged in to manipulate URLs.');

  // Store post data
  const newId = generateRandomID();
  const newLongURL = req.body.longURL;

  // Update urls Database
  urlDatabase[newId] = {longURL: newLongURL, userID: currentUserId };
  res.redirect(`/urls/${newId}`);
});

// Route to redirect any shortURl (/u/:id) to its longURL
app.get('/u/:id', (req, res) => {
  // Lookup URLs for current user
  const currentUserURLS = urlsForUser(req.session.user_id, urlDatabase);

  // Check if the URL exists
  if (!urlDatabase[req.params.id]) return res.status(404).send('URL does not exist!');

  // Check if current user owns the URL
  if (!currentUserURLS[req.params.id]) return res.status(403).send('You do not have access to that URL');

  // Redirect user to URL if they own it
  res.redirect(`${currentUserURLS[req.params.id].longURL}`);
});

// Dynamic route to update a URL and redirect to the URLs page
app.put('/urls/:id', (req, res) => {
  // Store current user information
  const currentUserId = req.session.user_id;
  const currentUser = userDatabase[currentUserId];

  // Store current /urls/:id information
  const currentUrlID = req.body.currentUrlId; // Grab data from hidden form named 'currentUrlId'
  const updatedURL = req.body.newURL; // Grab data from form named 'newURL'

  // Check if user is logged in
  if (!currentUserId) return res.status(403).send('Please login before requesting any changes');

  // Check if URL exists
  if (!urlDatabase[currentUrlID]) return res.status(404).send('That URL does not exist');

  // Check if current user owns URL
  if (urlDatabase[currentUrlID].userID !== currentUserId) return res.status(403).send('You do not have permission to edit this URL');

  // Update database
  urlDatabase[currentUrlID].longURL = updatedURL;
  urlDatabase[currentUrlID].userID = currentUserId;

  // Pass new data into template
  const templateVars = { id: currentUrlID, longURL: updatedURL, currentUser };
  res.render('urls_show', templateVars);
});

// Dynamic route to display a specific URL's details based on the id provided
app.get('/urls/:id', (req, res) => {
  // Store current user information
  const currentUserId = req.session.user_id;
  const currentUser = userDatabase[currentUserId];

  // Store request body information
  const currentUrlID = req.params.id;

  // Handle case where user is not logged in
  if (!currentUser) return res.status(403).send('Must be registered and logged in to manipulate URLs.');

  // Check if URL exists
  if (!urlDatabase[currentUrlID]) return res.status(404).send('URL not found');

  // Check if current user owns the URL they are trying to access
  if (urlDatabase[currentUrlID].userID !== currentUserId) return res.status(403).send('You do not have permission to view this URL');

  // Increment the frequency tracker - number of time link has been visited
  frequencyTracker += 1;

  // Check if current user has visited the path before
  if (!req.session.vistitedPath) {
    req.session.vistitedPath = generateRandomID(); // Create unique ID for cookie to indiciate the site has been visited before
    uniqueFreqTracker += 1;
  };

  // Pass information to template
  const templateVars = {
    id: currentUrlID, // the URL id
    longURL: urlDatabase[currentUrlID].longURL, // long URL associated with URL id
    totalVisits: frequencyTracker, // cookieTracker array
    uniqueVisits: uniqueFreqTracker, // store number of unique visitors
    currentUser
  };
  console.log('templateVars.uniqueVisits: ', templateVars.uniqueVisits)
  res.render('urls_show', templateVars);
});

// Dynamic route to delete a URL from the database and redirect to the /urls page
app.delete('/urls/:id/delete', (req, res) => {
  // Store current user information
  const currentUserId = req.session.user_id;

  // Handle case where user is not logged in
  if (!currentUserId) return res.status(403).send('Must be registered and logged in to manipulate URLs.');

  // Store delete request parameters
  const urlToDelete = req.params.id;

  // Check if URL exists
  if (!urlDatabase[urlToDelete]) return res.status(404).send('URL cannot be found');

  // Check if current user owns the URL
  if (urlDatabase[urlToDelete].userID !== currentUserId) return res.status(403).send('You do not have permission to delete that URL');

  // Delete the URL
  delete urlDatabase[urlToDelete];
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});