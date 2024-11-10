/**
 * Function finds a user in the database from a given email
 *
 * @param {string} userEmail - The email of the user to lookup
 * @returns
 *       - User object if the user exists
 *       - Null if user doesn't exist
 */
const userLookup = (userEmail, database) => {
  // Check if user already exists
  for (const user in database) {
    // Return user object once found
    if (database[user].email === userEmail) {
      return database[user];
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


module.exports = {
  userLookup,
  urlsForUser,
};