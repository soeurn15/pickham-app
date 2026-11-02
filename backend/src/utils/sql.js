// Escapes LIKE wildcards (using | as the escape character) so user input is matched literally.
const escapeLike = value => String(value).replace(/[|%_]/g, '|$&');

module.exports = { escapeLike };
