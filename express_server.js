const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

// Constants
const app = express();
const PORT = 8080; // default port 8080


// Databases
const urlDatabase = {};

const userDatabase = {};


// View Engine
app.set('view engine', 'ejs'); // set ejs as view engine


// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan('dev'));


// FUNCTIONS

/**
 * Function generates a random URL ID
 *
 * @returns {string} - the random ID string
 */
const generateRandomID = () => {
  return Math.random().toString(36).substring(6);
};

/**
 * Function finds a user in the database from a given email
 *
 * @param {string} userEmail - The email of the user to lookup
 * @returns
 *       - User object if the user exists
 *       - Null if user doesn't exist
 */
const userLookup = (userEmail) => {
  // Check if user already exists
  for (const user in userDatabase) {
    // Return user object once found
    if (userDatabase[user].email === userEmail) return userDatabase[user];
  }
  return null;
};

/**
 * Function
 *
 * @param {string} id - The user ID used to retrieve associated URLs
 * @returns {Array} userURLS - the array that contains the URLs that belong to the user
 */
const urlsForUser = (id) => {
  let userURLS = {};

  // Loop through the URL database keys (URL IDs)
  for (let urlId in urlDatabase) {

    // Check if current user has created any urls in the database
    if (urlDatabase[urlId].userID === id) userURLS[urlId] = urlDatabase[urlId];

  }
  return userURLS;
};


// HTTP METHOD HANDLERS


// Root route, redirects to /urls page
app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  res.render('login');
});

// Route to post user_id cookie to login page then redirect to /urls
app.post('/login', (req, res) => {
  // Check if the fields are filled out properly
  if (!req.body.email || !req.body.password) return res.status(400).send("Email and/or password fields cannot be empty");

  // Check if the user doesn't exist
  else if (userLookup(req.body.email) === null) return res.status(404).send(`That user with email ${req.body.email} doesn't exist`);

  // Check password match if user exists
  else if (userLookup(req.body.email).password !== req.body.password) return res.status(403).send("Incorrect Password");

  // Else find the user ID and add it as a cookie
  const userId = userLookup(req.body.email).id;
  res.cookie('user_id', userId);
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
  if (userLookup(req.body.email) !== null) return res.status(400).send(`A user with email ${req.body.email} already exists.`);

  // Add user information to the database
  userDatabase[randomUserId] = { id: randomUserId, email: req.body.email, password: req.body.password };

  // Set cookie to remember user ID
  res.cookie('user_id', randomUserId);

  res.redirect('/urls');
});

// Route to post a logout by clearing the user_id cookie and redirecting to /urls
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

// Route to return the urlDatabase as a JSON object
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase); // converts to JSON
});

// Route to display a list of URLs, renders an HTML template with url data
app.get('/urls', (req, res) => {
  // Store current user information
  const currentUserId = req.cookies.user_id;
  const currentUser = userDatabase[currentUserId];

  // Check if current user is logged in
  if (!currentUser) {
    // If not logged in, render a message
    return res.render('urls_index', { urls: null, currentUser: null, userURLS: null });
  }

  // If user is logged in, show the URLs
  const userURLS = urlsForUser(currentUserId);

  // Pass only the user's urls to the template
  const templateVars = { urls: userURLS, currentUser };
  res.render('urls_index', templateVars);
});

// Route to create a new URL, renders an HTML template form to submit a new URL
app.get('/urls/new', (req, res) => {
  // Store current user information
  const currentUserId = req.cookies.user_id;
  const currentUser = userDatabase[currentUserId];

  const templateVars = { currentUser };

  // If current user doesn't exist in the DB, redirect to /login path
  if (!currentUser) return res.redirect('/login');

  res.render('urls_new', templateVars);
});

// Route to post a new URL and store the data in the database, then redirect to the specific URL for the ID
app.post('/urls', (req, res) => {
  // Store current user information
  const currentUserId = req.cookies.user_id;

  // Handle case where user is not logged in
  if (!currentUserId) return res.status(403).send('Must be registered and logged in to manipulate URLs.');

  // Store post data
  const newId = generateRandomID();
  const newLongURL = req.body.longURL;

  // Update urls Database
  urlDatabase[newId] = {longURL: newLongURL, userID: currentUserId };
  console.log(urlDatabase);
  res.redirect(`/urls/${newId}`);
});

// Route to redirect any shortURl (/u/:id) to its longURL
app.get('/u/:id', (req, res) => {
  // Lookup URLs for current user
  const currentUserURLS = urlsForUser(req.cookies.user_id);

  // Check if the URL exists
  if (!urlDatabase[req.params.id]) return res.status(404).send('URL does not exist!');

  // Check if current user owns the URL
  if (!currentUserURLS[req.params.id]) return res.status(403).send('You do not have access to that URL');

  // Redirect user to URL if they own it
  res.redirect(`${currentUserURLS[req.params.id].longURL}`);
});

// Dynamic route to update a URL and redirect to the URLs page
app.post('/urls/:id', (req, res) => {
  // Store current user information
  const currentUserId = req.cookies.user_id;
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
  const currentUserId = req.cookies.user_id;
  const currentUser = userDatabase[currentUserId];

  // Store request body information
  const currentUrlID = req.params.id;

  // Handle case where user is not logged in
  if (!currentUser) return res.status(403).send('Must be registered and logged in to manipulate URLs.');

  // Check if current user owns the URL they are trying to access
  if (urlDatabase[currentUrlID].userID !== currentUserId) return res.status(403).send('You do not have permission to view this URL');

  // Pass information to template
  const templateVars = { id: currentUrlID, longURL: urlDatabase[currentUrlID].longURL, currentUser };
  res.render('urls_show', templateVars);
});

// Dynamic route to delete a URL from the database and redirect to the /urls page
app.post('/urls/:id/delete', (req, res) => {
  // Store current user information
  const currentUserId = req.cookies.user_id;

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