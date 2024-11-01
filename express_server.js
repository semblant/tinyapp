const express = require('express');
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs'); // set ejs as templating engine

app.use(express.urlencoded({ extended: true }));

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

app.post('/urls', (req, res) => {
  const newId = generateRandomID();
  const newLongURL = req.body.longURL;
  urlDatabase[newId] = newLongURL;
  res.redirect(`/urls/${newId}`)
});

// Dynamic route to display a specific URL's details based on the id provided
app.get('/urls/:id', (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render('urls_show', templateVars);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})