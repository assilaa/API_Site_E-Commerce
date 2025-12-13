const xss = require("xss");

const sanitizeUserInput = (input) => {
  if (typeof input !== "string") return "";
  return xss(input).trim();
};

module.exports = { sanitizeUserInput };
