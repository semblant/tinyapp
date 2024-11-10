const { genSaltSync } = require('bcrypt');

// Constants
const PORT = 8080; // default port 8080
const SALT_ROUNDS = 5;
const salt = genSaltSync(SALT_ROUNDS);

module.exports = {
  PORT,
  SALT_ROUNDS,
  salt,
}