/**
 * Function finds a user in the database from a given email
 *
 * @param {string} userEmail - The email of the user to lookup
 * @returns
 *       - User object if the user exists
 *       - Null if user doesn't exist
 */
const userLookup = (userEmail, id, database) => {
  // Check if user already exists

  // Using UserEmail
  if (userEmail) {
    for (const user in database) {
      // Return user object once found
      if (database[user].email === userEmail) {
        return database[user];
      }
    }
  }
  // Using UserID
  if (id) {
    for (const user in database) {
      // Return user object once found
      console.log('inside userID userlookup:', user)
      if (database[user].userID === id) {
        return database[user];
      }
    }
  }
  return null;
};

/**
 * Function
 *
 * @param {string} id - The user ID used to retrieve associated URLs
 * @returns {Array} userURLS - the array that contains the URLs that belong to the user
 */
const urlsForUser = (id, database) => {
  let userURLS = {};

  // Loop through the URL database keys (URL IDs)
  for (let urlId in database) {

    // Check if current user has created any urls in the database
    if (database[urlId].userID === id) userURLS[urlId] = database[urlId];

  }
  return userURLS;
};

/**
 * Function generates a random URL ID
 *
 * @returns {string} - the random ID string
 */
const generateRandomID = () => {
  return Math.random().toString(36).substring(6);
};

const authenticateUser = (res, req, id) => {
  if (!id) return res.status(403).send('Must be registered and logged in to Manipulate URLS.')
  return
};

module.exports = {
  userLookup,
  urlsForUser,
  generateRandomID,
  authenticateUser,
};