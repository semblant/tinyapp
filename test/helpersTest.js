const { assert } = require('chai');
const { userLookup, urlsForUser } = require('../helpers');


describe('#userLookup', () => {
  // Define Test DataBase
  const testUsers = {
    'userRandomID': {
      id: 'userRandomID',
      email: 'user@example.com',
      password: 'purple-monkey-dinosaur'
    },
    'user2RandomID': {
      id: 'user2RandomID',
      email: 'user2@example.com',
      password: 'purple-monkey-disco'
    },
  };

  it('should return a user with a valid email', () => {
    const user = userLookup('user@example.com', null, testUsers);
    const expectedUserID = 'userRandomID';
    assert.equal(user.id, expectedUserID);
  });

  it('should return null when the email does not exist in the database', () => {
    const user = userLookup('example@example.com', null,  testUsers);
    const expectedUserID = null;
    assert.equal(user, expectedUserID);
  });
});


describe('#urlsForUser', () => {
  // Define Test Database
  const urlDatabase = {
    "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "user1" },
    "9sm5xK": { longURL: "http://www.google.com", userID: "user2" },
    "a1b2c3": { longURL: "http://www.example.com", userID: "user1" }
  };


  it('should return urls that belong to the specified user', () => {
    // Define expected output
    const expectedOutput = {
      "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "user1" },
      "a1b2c3": { longURL: "http://www.example.com", userID: "user1" }
    };

    // Call the function with userId 'user1'
    const result = urlsForUser('user1', urlDatabase);

    // Assert that the result matches the expected output
    assert.deepEqual(result, expectedOutput);
  });

  it('should return an empty object if the urlDatabase does not contain any urls that belong to the specified user', () => {
    // Define user that doesn't exist in DB
    const userId = 'user4';
    const result = urlsForUser(userId, urlDatabase);

    // Perform assertion to check if the result is an empty object
    assert.isObject(result, 'Result should be an object');
    assert.isEmpty(result, 'Result should be an empty object when no urls belong to the user');
  });

  it('should return an empty object if the urlDatabase is empty', () => {
    // Define user and empty DB
    const userId = 'user1';
    const urlDatabase = {};

    const result = urlsForUser(userId, urlDatabase);

    // Perform assertion to check if the result is an empty object
    assert.isObject(result, 'Result should be an object');
    assert.isEmpty(result, 'Result should be an empty object when urlDatabase is empty');
  });

  it('should not return any urls that do not belong to the specified user', () => {
    const userId = 'user1';
    const result = urlsForUser(userId, urlDatabase);

    // Perform assertions to check the returned urls
    assert.property(result, 'b2xVn2', 'Result should contain the shortURL b2xVn2');
    assert.property(result, 'a1b2c3', 'Result should contain the shortURL a1b2c3');
    assert.notProperty(result, '9sm5xK', 'Result should not contain the shortURL 9sm5xK, as it belongs to a different user');
  });

});
