const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs'); // set ejs as templating engine

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

/**
 * Function generates a random URL ID
 *
 * @returns {string} - the random ID string
 */
const generateRandomID = () => {
  return Math.random().toString(36).substring(6);
};

// Root route, sends a plain text response "Hello World!" to the client
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Route that responds with HTML-formatted "Hello World!" content
app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Route to return the urlDatabase as a JSON object
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase); // converts to JSON
});

// Route to display a list of URLs, renders an HTML template with url data
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

// Route to create a new URL, renders an HTML template form to submit a new URL
app.get('/urls/new', (req, res) => {
  res.render('urls_new')
});

// Route to post a new URL and store the data in the database, then redirect to the specific URL for the ID
app.post('/urls', (req, res) => {
  const newId = generateRandomID();
  const newLongURL = req.body.longURL;
  urlDatabase[newId] = newLongURL;
  res.redirect(`/urls/${newId}`)
});

// Route to redirect any shortURl (/u/:id) to its longURL
app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(`${longURL}`);
});

// Dynamic route to display a specific URL's details based on the id provided
app.get('/urls/:id', (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render('urls_show', templateVars);
});

// Dynamic route to delete a URL from the database and redirect to the /urls page
app.post('/urls/:id/delete', (req, res) => {
  const urlToDelete = req.params.id;
  delete urlDatabase[urlToDelete];
  res.redirect('/urls')
});

// Dynamic route to update a URL and redirect to the URLs page
app.post('/update', (req, res) => {
  const currentID = req.body.currentID; // Grab data from hidden form named 'currentID'
  const updatedURL = req.body.newURL; // Grab data from form named 'newURL'
  urlDatabase[currentID] = updatedURL; // update db
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})