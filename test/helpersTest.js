const { assert } = require('chai');
const { userLookup } = require('../helpers');

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

describe('#userLookup', () => {
  it('should return a user with a valid email', () => {
    const user = userLookup('user@example.com', testUsers);
    const expectedUserID = 'userRandomID';
    assert.equal(user.id, expectedUserID)
  });

  it('should return null when the email does not exist in the database', () => {
    const user = userLookup('example@example.com', testUsers);
    const expectedUserID = null;
    assert.equal(user, expectedUserID)
  });
});