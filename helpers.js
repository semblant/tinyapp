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


module.exports = { userLookup };