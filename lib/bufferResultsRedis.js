/** TODO
    Support pipelines
    Support cluster
    Support multi/exec
*/

var util = require('util');

module.exports = function(Redis) {
  function BufferResultsRedis() {
    Redis.apply(this, arguments);

    var member;
    var match;
    for (member in this) {
      match = member.match(/(.+)Buffer(.*)/);
      if (match && typeof this[member] === 'function') {
        this[match[1] + 'String' + match[2]] = this[match[1] + match[2]];
        this[match[1] + match[2]] = this[member];
        this[member] = undefined;
      }
    }
  }

  util.inherits(BufferResultsRedis, Redis);

  return BufferResultsRedis;
};
