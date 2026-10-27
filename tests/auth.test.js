const test = require("node:test");
const assert = require("node:assert");

const { extractTokenFromHeader } = require("../middlewares/auth");

test("extractTokenFromHeader supports Bearer tokens", () => {
    assert.equal(extractTokenFromHeader("Bearer abc123"), "abc123");
    assert.equal(extractTokenFromHeader("abc123"), "abc123");
});
