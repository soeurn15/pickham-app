// Never send the password hash to the browser.
function publicUser(user) {
  const { password, ...rest } = user;
  return rest;
}

module.exports = { publicUser };