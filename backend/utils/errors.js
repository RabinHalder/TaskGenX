// Creates an error whose message is safe to show to the user.
function fail(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { fail };
