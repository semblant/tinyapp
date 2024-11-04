const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs'); // set ejs as templating engine

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const userDatabase = {};

let loggedInFlag = false;

/**
 * Function generates a random URL ID
 *
 * @returns {string} - the random ID string
 */
const generateRandomID = () => {
  return Math.random().toString(36).substring(6);
};

// Root route, redirects to /urls page
app.get('/', (req, res) => {
  res.redirect('/urls');
});

// Route to post username to login page then redirect to /urls
app.post('/login', (req, res) => {
  const userId = req.body.user_id;
  res.cookie('user_id', userId);
  res.redirect('/urls');
});

// Route to prompt user registration
app.get('/register', (req, res) => {
  res.render('register');
});

// Route to post registration info of user into database and redirect to /urls
app.post('/register', (req, res) => {
  // Store user information
  const email = req.body.email;
  const password = req.body.password;
  const randomUserId = generateRandomID();

  // Set login flag as true
  loggedInFlag = true;

  // Add user information to the database
  userDatabase[randomUserId] = { id: randomUserId, email: email, password: password };


  // Set cookie to remember user ID
  res.cookie('user_id', randomUserId);

  res.redirect('/urls');
});

// Route to post a logout by clearing the username cookie and redirecting to /urls
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// Route to return the urlDatabase as a JSON object
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase); // converts to JSON
});

// Route to display a list of URLs, renders an HTML template with url data
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase, users: userDatabase };
  res.render('urls_index', templateVars);
});

// Route to create a new URL, renders an HTML template form to submit a new URL
app.get('/urls/new', (req, res) => {
  const templateVars = { users: userDatabase };
  res.render('urls_new', templateVars);
});

// Route to post a new URL and store the data in the database, then redirect to the specific URL for the ID
app.post('/urls', (req, res) => {
  const newId = generateRandomID();
  const newLongURL = req.body.longURL;
  urlDatabase[newId] = newLongURL;
  res.redirect(`/urls/${newId}`);
});


// Route to redirect any shortURl (/u/:id) to its longURL
app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(`${longURL}`);
});

// Dynamic route to display a specific URL's details based on the id provided
app.get('/urls/:id', (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], users: userDatabase };
  res.render('urls_show', templateVars);
});

// Dynamic route to delete a URL from the database and redirect to the /urls page
app.post('/urls/:id/delete', (req, res) => {
  const urlToDelete = req.params.id;
  delete urlDatabase[urlToDelete];
  res.redirect('/urls');
});

// Dynamic route to update a URL and redirect to the URLs page
app.post('/urls/:id', (req, res) => {
  const currentID = req.body.currentID; // Grab data from hidden form named 'currentID'
  const updatedURL = req.body.newURL; // Grab data from form named 'newURL'
  urlDatabase[currentID] = updatedURL; // update db
  const templateVars = { id: currentID, longURL: updatedURL, users: userDatabase };
  res.render('urls_show', templateVars);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});