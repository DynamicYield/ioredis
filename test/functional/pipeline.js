'use strict';

describe('pipeline', function () {
  it('should return correct result', function (done) {
    var redis = new Redis();
    redis.pipeline().setString('foo', '1').getString('foo').setString('foo', '2').incr('foo').getString('foo').exec(function (err, results) {
      expect(err).to.eql(null);
      expect(results).to.eql([
        [null, 'OK'],
        [null, '1'],
        [null, 'OK'],
        [null, 3],
        [null, '3']
      ]);
      done();
    });
  });

  it('should return an empty array on empty pipeline', function(done) {
    var redis = new Redis();
    redis.pipeline().exec(function(err, results) {
      expect(err).to.eql(null);
      expect(results).to.eql([]);
      done();
    });
  });

  it('should support mix string command and buffer command', function (done) {
    var redis = new Redis();
    redis.pipeline().setString('foo', 'bar').setString('foo', new Buffer('bar')).get('foo').getString(new Buffer('foo')).exec(function (err, results) {
      expect(err).to.eql(null);
      expect(results).to.eql([
        [null, 'OK'],
        [null, 'OK'],
        [null, new Buffer('bar')],
        [null, 'bar']
      ]);
      done();
    });
  });

  it('should handle error correctly', function (done) {
    var redis = new Redis();
    redis.pipeline().set('foo').exec(function (err, results) {
      expect(err).to.eql(null);
      expect(results.length).to.eql(1);
      expect(results[0].length).to.eql(1);
      expect(results[0][0].toString()).to.match(/wrong number of arguments/);
      done();
    });
  });

  it('should also invoke the command\'s callback', function (done) {
    var redis = new Redis();
    var pending = 1;
    redis.pipeline().setString('foo', 'bar').getString('foo', function (err, result) {
      expect(result).to.eql('bar');
      pending -= 1;
    }).exec(function (err, results) {
      expect(pending).to.eql(0);
      expect(results[1][1]).to.eql('bar');
      done();
    });
  });

  it('should support inline transaction', function (done) {
    var redis = new Redis();

    redis.pipeline().multiString().setString('foo', 'bar').getString('foo').execString().exec(function (err, result) {
      expect(result[0][1]).to.eql('OK');
      expect(result[1][1]).to.eql('QUEUED');
      expect(result[2][1]).to.eql('QUEUED');
      expect(result[3][1]).to.eql(['OK', 'bar']);
      done();
    });
  });

  it('should have the same options as its container', function () {
    var redis = new Redis({ showFriendlyErrorStack: true });
    var pipeline = redis.pipeline();
    expect(pipeline.options).to.have.property('showFriendlyErrorStack', true);
  });

  it('should support key prefixing', function (done) {
    var redis = new Redis({ keyPrefix: 'foo:' });
    redis.pipeline().setString('bar', 'baz').getString('bar').lpushString('app1', 'test1').lpopString('app1').keysString('*').exec(function (err, results) {
      expect(err).to.eql(null);
      expect(results).to.eql([
        [null, 'OK'],
        [null, 'baz'],
        [null, 1],
        [null, 'test1'],
        [null, ['foo:bar']]
      ]);
      done();
    });
  });

  describe('custom commands', function() {
    var redis;

    before(function() {
      redis = new Redis();
      redis.defineCommand('echo', {
        numberOfKeys: 2,
        lua: 'return {KEYS[1],KEYS[2],ARGV[1],ARGV[2]}'
      });
    });

    it('should work', function(done) {
      redis.pipeline().echoString('foo', 'bar', '123', 'abc').exec(function(err, results) {
        expect(err).to.eql(null);
        expect(results).to.eql([
          [null, ['foo', 'bar', '123', 'abc']]
        ]);
        done();
      });
    });

    it('should support callbacks', function(done) {
      var pending = 1;
      redis.pipeline()
        .echoString('foo', 'bar', '123', 'abc', function(err, result) {
          pending -= 1;
          expect(err).to.eql(null);
          expect(result).to.eql(['foo', 'bar', '123', 'abc']);
        })
        .exec(function(err, results) {
          expect(err).to.eql(null);
          expect(results).to.eql([
            [null, ['foo', 'bar', '123', 'abc']]
          ]);
          expect(pending).to.eql(0);
          done();
        });
    });

    it('should be supported in transaction blocks', function(done) {
      redis.pipeline()
        .multi()
        .set('foo', 'asdf')
        .echo('bar', 'baz', '123', 'abc')
        .get('foo')
        .exec()
        .exec(function(err, results) {
          expect(err).to.eql(null);
          expect(results[4][1][1]).to.eql([new Buffer('bar'), new Buffer('baz'), new Buffer('123'), new Buffer('abc')]);
          expect(results[4][1][2]).to.eql(new Buffer('asdf'));
          done();
        });
    });
  });

  describe('#addBatch', function () {
    it('should accept commands in constructor', function (done) {
      var redis = new Redis();
      var pending = 1;
      redis.pipeline([
        ['setString', 'foo', 'bar'],
        ['getString', 'foo', function (err, result) {
          expect(result).to.eql('bar');
          pending -= 1;
        }]
      ]).exec(function (err, results) {
        expect(pending).to.eql(0);
        expect(results[1][1]).to.eql('bar');
        done();
      });
    });
  });

  describe('exec', function () {
    it('should group results', function (done) {
      var redis = new Redis();
      redis.multi({ pipeline: false });
      redis.set('foo', 'bar');
      redis.get('foo');
      redis.exec().then(function (res) {
        done();
      });
    });

    it('should allow omitting callback', function (done) {
      var redis = new Redis();
      redis.exec().catch(function (err) {
        expect(err.message).to.eql('ERR EXEC without MULTI');
        done();
      });
    });
  });
});
