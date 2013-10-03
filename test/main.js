var should   = require('should');
var assert   = require('assert');
var async    = require('async');
var request  = require('supertest');
var fs       = require('fs');
var sha1     = require('sha1');
var _        = require('underscore');
var jpgp     = require('../app/lib/jpgp');
var server   = require('../app/lib/server');
var mongoose = require('mongoose');

var config = {
  server: {
    port: 8001,
    pgp: {
      key: __dirname + "/data/lolcat.priv",
      password: "lolcat"
    }
  },
  db: {
    database : "beta_brousouf",
    host: "localhost"
  }
};

// Update conf
if(config.server.pgp.key) config.server.pgp.key = fs.readFileSync(config.server.pgp.key, 'utf8');
var conf = {
  ipv4: config.server.ipv4address,
  port: config.server.port,
  pgpkey: config.server.pgp.key,
  pgppasswd: config.server.pgp.password
};

function testGET(url, expect) {
  describe('GET on ' + url, function(){
    it(' expect answer ' + expect, function(done){
      request(app)
        .get(url)
        .expect(expect, done);
    });
  });
}

function testPOST(url, expect) {
  describe('POST on ' + url, function(){
    it(' expect answer ' + expect, function(done){
      request(app)
        .post(url)
        .expect(expect, done);
    });
  });
}

console.log("Reading files...");
var pubkeySnow    = fs.readFileSync(__dirname + '/data/snow.pub', 'utf8');
var pubkeySnowSig = fs.readFileSync(__dirname + '/data/snow.pub.asc', 'utf8');
var pubkeyCat     = fs.readFileSync(__dirname + '/data/lolcat.pub', 'utf8');
var pubkeyCatSig  = fs.readFileSync(__dirname + '/data/lolcat.pub.asc', 'utf8');
var pubkeyTobi    = fs.readFileSync(__dirname + '/data/uchiha.pub', 'utf8');
var pubkeyTobiSig = fs.readFileSync(__dirname + '/data/uchiha.pub.asc', 'utf8');
var pubkeyWhite    = fs.readFileSync(__dirname + '/data/white.pub', 'utf8');
var pubkeyWhiteSig = fs.readFileSync(__dirname + '/data/white.pub.asc', 'utf8');

var voteCatAM0    = fs.readFileSync(__dirname + '/data/amendments/BB-AM0-OK', 'utf8') + fs.readFileSync(__dirname + '/data/votes/BB-AM0/cat.asc', 'utf8');
var voteTobiAM0   = fs.readFileSync(__dirname + '/data/amendments/BB-AM0-OK', 'utf8') + fs.readFileSync(__dirname + '/data/votes/BB-AM0/tobi.asc', 'utf8');
var voteSnowAM0   = fs.readFileSync(__dirname + '/data/amendments/BB-AM0-OK', 'utf8') + fs.readFileSync(__dirname + '/data/votes/BB-AM0/snow.asc', 'utf8');
var voteSnowAM0_2 = fs.readFileSync(__dirname + '/data/votes/BB-AM0/OK-snow.dissident.vote', 'utf8');
var voteSnowAM1   = fs.readFileSync(__dirname + '/data/amendments/BB-AM1-OK', 'utf8') + fs.readFileSync(__dirname + '/data/votes/BB-AM1/snow.asc', 'utf8');
var voteTobiAM1   = fs.readFileSync(__dirname + '/data/amendments/BB-AM1-OK', 'utf8') + fs.readFileSync(__dirname + '/data/votes/BB-AM1/tobi.asc', 'utf8');
var voteCatAM1    = fs.readFileSync(__dirname + '/data/amendments/BB-AM1-OK', 'utf8') + fs.readFileSync(__dirname + '/data/votes/BB-AM1/cat.asc', 'utf8');
var voteWhiteAM1  = fs.readFileSync(__dirname + '/data/amendments/BB-AM1-OK', 'utf8') + fs.readFileSync(__dirname + '/data/votes/BB-AM1/white.asc', 'utf8');
var voteSnowAM2   = fs.readFileSync(__dirname + '/data/amendments/BB-AM2-OK', 'utf8') + fs.readFileSync(__dirname + '/data/votes/BB-AM2/snow.asc', 'utf8');
var voteTobiAM2   = fs.readFileSync(__dirname + '/data/amendments/BB-AM2-OK', 'utf8') + fs.readFileSync(__dirname + '/data/votes/BB-AM2/tobi.asc', 'utf8');
var voteCatAM2    = fs.readFileSync(__dirname + '/data/amendments/BB-AM2-OK', 'utf8') + fs.readFileSync(__dirname + '/data/votes/BB-AM2/cat.asc', 'utf8');

var txTobi          = fs.readFileSync(__dirname + '/data/tx/tobi.issuance', 'utf8') + fs.readFileSync(__dirname + '/data/tx/tobi.issuance.asc', 'utf8');
var txTobiToSnow    = fs.readFileSync(__dirname + '/data/tx/tobi.transfert.snow', 'utf8') + fs.readFileSync(__dirname + '/data/tx/tobi.transfert.snow.asc', 'utf8');
var txTobiToCat     = fs.readFileSync(__dirname + '/data/tx/tobi.transfert.cat', 'utf8') + fs.readFileSync(__dirname + '/data/tx/tobi.transfert.cat.asc', 'utf8');
var txTobiFusion    = fs.readFileSync(__dirname + '/data/tx/tobi.fusion.7', 'utf8') + fs.readFileSync(__dirname + '/data/tx/tobi.fusion.7.asc', 'utf8');
var txCat           = fs.readFileSync(__dirname + '/data/tx/cat.issuance', 'utf8') + fs.readFileSync(__dirname + '/data/tx/cat.issuance.asc', 'utf8');

var peeringCat      = fs.readFileSync(__dirname + '/data/peering/cat.peering', 'utf8');
var peeringCatSig   = fs.readFileSync(__dirname + '/data/peering/cat.peering.asc', 'utf8');

var forwardCat      = fs.readFileSync(__dirname + '/data/peering/cat.all', 'utf8');
var forwardCatSig   = fs.readFileSync(__dirname + '/data/peering/cat.all.asc', 'utf8');
var forwardUbot1    = fs.readFileSync(__dirname + '/data/peering/ubot1.keys', 'utf8');
var forwardUbot1Sig = fs.readFileSync(__dirname + '/data/peering/ubot1.keys.asc', 'utf8');

var thtCat = fs.readFileSync(__dirname + '/data/tht/cat.entry', 'utf8') + fs.readFileSync(__dirname + '/data/tht/cat.entry.asc', 'utf8');

var app;

function ResultAPI () {
  
  this.apiRes = {};
  this.apiStack = [];

  this.pksAllIndex = 0;
  this.pksAddIndex = 0;
  this.pksLookupIndex = 0;
  this.joinIndex = 0;
  this.keysIndex = 0;

  this.push = function (url, res) {
    if(!this.apiRes[url]) this.apiRes[url] = [];
    this.apiRes[url].push({ res: res });
    this.apiStack.push(url);
  };

  this.last = function () {
    return this.apiRes[this.apiStack[this.apiStack.length - 1]][_(this.apiRes).size() - 1].res;
  };

  this.pksAll = function(status, expectCount, expectHash) {
    var index = this.pksAllIndex++;
    var obj = this;
    it('expect to see ' + expectCount + ' keys with root hash ' + expectHash, function () {
      var res = obj.apiRes['/pks/all'][index].res;
      var json = JSON.parse(res.text);
      res.should.have.status(status);
      isMerkleNodesResult(json);
      json.leavesCount.should.equal(expectCount);
      if(expectCount == 0){
        json.levels.should.have.property("0");
        json.levels["0"].should.have.length(0);
        json.levels["0"].should.have.length(0);
      }
      else{
        json.levels.should.have.property("0");
        json.levels["0"].should.have.length(1);
        json.levels["0"][0].should.equal(expectHash);
      }
    })
  };

  this.pksAdd = function(status) {
    var index = this.pksAddIndex++;
    var obj = this;
    it('expect to have status ' + status + ' for pks/add', function () {
      var res = obj.apiRes['/pks/add'][index].res;
      res.should.have.status(status);
      if(status == 200){
        var json = JSON.parse(res.text);
        isPubKey(json);
      }
    })
  };

  this.pksLookup = function(status, keyCount) {
    var index = this.pksLookupIndex++;
    var obj = this;
    it('expect to have status ' + status + ' and ' + keyCount + ' keys for pks/lookup', function () {
      var res = obj.apiRes['/pks/lookup?op=index&search='][index].res;
      var json = JSON.parse(res.text);
      res.should.have.status(status);
      json.should.have.property('keys');
      json.keys.length.should.equal(keyCount);
    })
  };

  this.coinsList = function(type, owner, coinsCount, issuersCount) {
    issuersCount = issuersCount || 1;
    if(!this['indexOf' + owner])
      this['indexOf' + owner] = 0;
    var index = this['indexOf' + owner]++;
    var obj = this;
    it(type + ' of owner ' + owner + ' should respond 200 with ' + coinsCount + ' coins', function () {
      var url = '/hdc/coins/'+owner+'/list';
      var res = obj.apiRes[url][index].res;
      var json = JSON.parse(res.text);
      res.should.have.status(200);
      json.owner.should.equal(owner);
      if(coinsCount > 0){
        json.coins.should.have.length(issuersCount);
        var count = 0;
        json.coins.forEach(function (coins) {
          count += coins.ids.length;
        });
        count.should.equal(coinsCount);
      }
      else{
        json.coins.should.have.length(0);
      }
    });
  };

  this.txAllMerkle = function(type, root, txCount) {
    if(!this['indexTxAll'])
      this['indexTxAll'] = 0;
    var index = this['indexTxAll']++;
    var obj = this;
    it('after ' + type + ' tx/all should respond 200 with ' + txCount + ' transactions', function () {
      var url = '/hdc/transactions/all';
      checkTxMerkle(obj, url, index, txCount, root);
    });
  };

  this.txSenderMerkle = function(type, owner, root, txCount) {
    checkTxMerklePath(this, '/sender', '', 'sender', type, owner, root, txCount);
  };

  this.txIssuerMerkle = function(type, owner, root, txCount) {
    checkTxMerklePath(this, '/sender', '/issuance', 'issuance', type, owner, root, txCount);
  };

  this.txIssuerDividendMerkle = function(type, owner, root, txCount) {
    checkTxMerklePath(this, '/sender', '/issuance/dividend', 'dividend', type, owner, root, txCount);
  };

  this.txIssuerDividen2dMerkle = function(type, owner, root, txCount) {
    checkTxMerklePath(this, '/sender', '/issuance/dividend/2', 'dividend2', type, owner, root, txCount);
  };

  this.txIssuerTransfertMerkle = function(type, owner, root, txCount) {
    checkTxMerklePath(this, '/sender', '/transfert', 'transfert', type, owner, root, txCount);
  };

  this.txIssuerFusionMerkle = function(type, owner, root, txCount) {
    checkTxMerklePath(this, '/sender', '/issuance/fusion', 'fusion', type, owner, root, txCount);
  };

  this.txRecipientMerkle = function(type, owner, root, txCount) {
    checkTxMerklePath(this, '/recipient', '', 'recipient', type, owner, root, txCount);
  };

  function checkTxMerklePath(obj, pathRoot, path, name, type, owner, root, txCount) {
    if(!obj['specialIndex'+name+owner])
      obj['specialIndex'+name+owner] = 0;
    var index = obj['specialIndex'+name+owner]++;
    it('after ' + type + ' tx of owner '+owner+' should respond 200 with ' + txCount + ' transactions', function () {
      var url = '/hdc/transactions'+pathRoot+'/'+owner+path;
      checkTxMerkle(obj, url, index, txCount, root);
    });
  }

  function checkTxMerkle(obj, url, index, txCount, root){
    var res = obj.apiRes[url][index].res;
    var json = JSON.parse(res.text);
    res.should.have.status(200);
    isMerkleNodesResult(json);
    json.leavesCount.should.equal(txCount);
    if(txCount > 0)
      json.levels[0][0].should.equal(root);
    else
      should.not.exist(json.levels[0][0]);
  }

  this.keys = function(comment, leavesCount, root) {
    var index = this.keysIndex++;
    var obj = this;
    it('expect ' + comment, function () {
      var res = obj.apiRes['/hdc/transactions/keys'][index].res;
      var json = JSON.parse(res.text);
      res.should.have.status(200);
      isMerkleNodesResult(json);
      if(root)
        json.levels[0][0].should.equal(root);
      else
        _(json.levels[0]).size().should.equal(0);
    });
  };

  this.downstream = function(comment, streamsCount, fingerprint) {
    testStreams(this, 'down', comment, streamsCount, fingerprint);
  };

  this.upstream = function(comment, streamsCount, fingerprint) {
    testStreams(this, 'up', comment, streamsCount, fingerprint);
  };

  function testStreams(obj, type, comment, streamsCount, fingerprint) {
    if(!obj[type+'streamIndex'+fingerprint])
      obj[type+'streamIndex'+fingerprint] = 0;
    var index = obj[type+'streamIndex'+fingerprint]++;
    var obj = obj;
    it((fingerprint ? 'for fingerprint '+fingerprint+' ' : '')+'expect '+ comment, function () {
      var res = obj.apiRes['/ucg/peering/peers/'+type+'stream' + (fingerprint ? '/'+fingerprint : '')][index].res;
      var json = JSON.parse(res.text);
      res.should.have.status(200);
      json.should.have.property('peers');
      json.peers.should.have.length(streamsCount);
    });
  };

  this.checkPromoted = function(number, statusCode, hash) {
    if(!this['promoted'+number])
      this['promoted'+number] = 0;
    var index = this['promoted'+number]++;
    var obj = this;
    it('- #'+number+' should '+(statusCode == 200 ? '' : 'not ')+'exist', function () {
      var res = obj.apiRes['/hdc/amendments/promoted' + (number != null ? '/'+number : '')][index].res;
      res.should.have.status(statusCode);
      if(statusCode == 200){
        var json = JSON.parse(res.text);
        json.should.have.property('version');
        json.should.have.property('currency');
        json.should.have.property('number');
        json.should.have.property('generated');
        json.should.have.property('dividend');
        json.should.have.property('coinMinPower');
        json.should.have.property('previousHash');
        json.should.have.property('previousVotesRoot');
        json.should.have.property('previousVotesCount');
        json.should.have.property('membersRoot');
        json.should.have.property('membersCount');
        json.should.have.property('membersChanges');
        json.should.have.property('votersRoot');
        json.should.have.property('votersCount');
        json.should.have.property('votersChanges');
        json.should.have.property('raw');
        var mHash = sha1(json.raw).toUpperCase();
        mHash.should.equal(hash);
      }
    });
  };

  this.checkProcessedTX = function(comment, statusCode) {
    if(!this['transaction'])
      this['transaction'] = 0;
    var index = this['transaction']++;
    var obj = this;
    it(comment+' should '+(statusCode == 200 ? '' : 'not ')+'exist', function () {
      var res = obj.apiRes['/hdc/transactions/process'][index].res;
      res.should.have.status(statusCode);
      if(statusCode == 200){
        var json = JSON.parse(res.text);
        json.should.have.property('signature');
        json.should.have.property('raw');
        json.should.have.property('transaction');
        json.transaction.should.have.property('version');
        json.transaction.should.have.property('currency');
        json.transaction.should.have.property('sender');
        json.transaction.should.have.property('number');
        if(json.transaction.number > 0)
          json.transaction.should.have.property('previousHash');
        json.transaction.should.have.property('recipient');
        json.transaction.should.have.property('type');
        json.transaction.should.have.property('coins');
        json.transaction.should.have.property('comment');
        // var mHash = sha1(json.raw).toUpperCase();
        // mHash.should.equal(hash);
      }
    });
  };

  this.postTHT = function(comment, statusCode, issuer) {
    if(!this['tht'])
      this['tht'] = 0;
    var index = this['tht']++;
    var obj = this;
    it(comment+' should '+(statusCode == 200 ? '' : 'not ')+'exist', function () {
      var res = obj.apiRes['/ucg/tht'][index].res;
      res.should.have.status(statusCode);
      if(statusCode == 200){
        var json = JSON.parse(res.text);
        json.should.have.property('signature');
        json.should.have.property('entry');
        json.entry.should.have.property('version');
        json.entry.should.have.property('currency');
        json.entry.should.have.property('fingerprint');
        json.entry.should.have.property('hosters');
        json.entry.should.have.property('trusts');
        json.entry.fingerprint.should.equal(issuer);
      }
    });
  };

  this.getTHT = function(comment, leavesCount, root) {
    if(!this['tht'])
      this['tht'] = 0;
    var index = this['tht']++;
    var obj = this;
    it('expect ' + comment, function () {
      var res = obj.apiRes['/ucg/tht'][index].res;
      var json = JSON.parse(res.text);
      res.should.have.status(200);
      isMerkleNodesResult(json);
      json.leavesCount.should.equal(leavesCount);
      if(root)
        json.levels[0][0].should.equal(root);
      else
        _(json.levels[0]).size().should.equal(0);
    });
  };

  this.fprTHT = function(comment, fpr, statusCode, issuer) {
    if(!this['fprTHT'+fpr])
      this['fprTHT'+fpr] = 0;
    var index = this['fprTHT'+fpr]++;
    var obj = this;
    it(comment+' should '+(statusCode == 200 ? '' : 'not ')+'exist', function () {
      var res = obj.apiRes['/ucg/tht/'+fpr][index].res;
      res.should.have.status(statusCode);
      if(statusCode == 200){
        var json = JSON.parse(res.text);
        json.should.have.property('signature');
        json.should.have.property('entry');
        json.entry.should.have.property('version');
        json.entry.should.have.property('currency');
        json.entry.should.have.property('fingerprint');
        json.entry.should.have.property('hosters');
        json.entry.should.have.property('trusts');
        json.entry.fingerprint.should.equal(issuer);
      }
    });
  };

  this.postPeering = function(comment, statusCode, issuer) {
    if(!this['peeringPeers'])
      this['peeringPeers'] = 0;
    var index = this['peeringPeers']++;
    var obj = this;
    it(comment+' should '+(statusCode == 200 ? '' : 'not ')+'exist', function () {
      var res = obj.apiRes['/ucg/peering/peers'][index].res;
      res.should.have.status(statusCode);
      if(statusCode == 200){
        var json = JSON.parse(res.text);
        json.should.have.property('version');
        json.should.have.property('currency');
        json.should.have.property('fingerprint');
        json.should.have.property('dns');
        json.should.have.property('ipv4');
        json.should.have.property('ipv6');
        json.should.have.property('port');
        json.fingerprint.should.equal(issuer);
      }
    });
  };

  this.getPeering = function(comment, leavesCount, root) {
    if(!this['peeringPeers'])
      this['peeringPeers'] = 0;
    var index = this['peeringPeers']++;
    var obj = this;
    it('expect ' + comment, function () {
      var res = obj.apiRes['/ucg/peering/peers'][index].res;
      var json = JSON.parse(res.text);
      res.should.have.status(200);
      isMerkleNodesResult(json);
      json.leavesCount.should.equal(leavesCount);
      if(root)
        json.levels[0][0].should.equal(root);
      else
        _(json.levels[0]).size().should.equal(0);
    });
  };
}

var api = new ResultAPI();
var apiRes = {};

function post (url, data, done) {
  request(app)
    .post(url)
    .send(data)
    .end(onHttpResult(url, done));
}

function get (url, done) {
  request(app)
    .get(url)
    .end(onHttpResult(url, done));
}

function onHttpResult (url, done) {
  if(!apiRes[url]) apiRes[url] = [];
  return function (err, res) {
    api.push(url, res);
    apiRes[url].push({ res: res });
    done();
  }
}

function pksAdd (keytext, keysign, done) {
  post('/pks/add', {
    "keytext": keytext,
    "keysign": keysign
  }, done);
}

function vote (voteFile, done) {
  post('/hdc/amendments/votes', {
    "amendment": voteFile.substr(0, voteFile.indexOf('-----BEGIN')),
    "signature": voteFile.substr(voteFile.indexOf('-----BEGIN'))
  }, done);
}

function issue (txFile, done) {
  post('/hdc/transactions/process', {
    "transaction": txFile.substr(0, txFile.indexOf('-----BEGIN')),
    "signature": txFile.substr(txFile.indexOf('-----BEGIN'))
  }, done);
}

function transfert (txFile, done) {
  post('/hdc/transactions/process', {
    "transaction": txFile.substr(0, txFile.indexOf('-----BEGIN')),
    "signature": txFile.substr(txFile.indexOf('-----BEGIN'))
  }, done);
}

function fusion (txFile, done) {
  post('/hdc/transactions/process', {
    "transaction": txFile.substr(0, txFile.indexOf('-----BEGIN')),
    "signature": txFile.substr(txFile.indexOf('-----BEGIN'))
  }, done);
}

function peer (peering, signature, done) {
  post('/ucg/peering/peers', {
    "entry": peering,
    "signature": signature
  }, done);
}

function forward (forward, signature, done) {
  post('/ucg/peering/forward', {
    "forward": forward,
    "signature": signature
  }, done);
}

function trust (txFile, done) {
  post('/ucg/tht', {
    "entry": txFile.substr(0, txFile.indexOf('-----BEGIN')),
    "signature": txFile.substr(txFile.indexOf('-----BEGIN'))
  }, done);
}

before(function (done) {
  this.timeout(10000);
  async.waterfall([
    function (next){
      server.database.connect(config.db.database, config.db.host, config.db.port, next);
    },
    function (dbconf, next){
      server.express.app(config.db.database, conf, next);
    },
    function (appReady, next){
      app = appReady;
      server.database.reset(next);
    },
    function (next){
      var Key = mongoose.model('Key');
      async.parallel({
        snow: function(callback){
          new Key({ fingerprint: "33BBFC0C67078D72AF128B5BA296CC530126F372", managed: true }).save(callback);
        },
        tobi: function(callback){
          new Key({ fingerprint: "2E69197FAB029D8669EF85E82457A1587CA0ED9C", managed: true }).save(callback);
        },
        cat: function(callback){
          new Key({ fingerprint: "C73882B64B7E72237A2F460CE9CAB76D19A8651E", managed: true }).save(callback);
        },
      },
      function(err, results) {
        next(err);
      });
    },
    function (next) { get('/pks/all', next); },
    function (next) { pksAdd(pubkeySnow, pubkeySnowSig, next); },
    function (next) { get('/pks/lookup?op=index&search=', next); },
    function (next) { get('/pks/all', next); },
    function (next) { pksAdd(pubkeyCat, pubkeyCatSig, next); },
    function (next) { get('/pks/lookup?op=index&search=', next); },
    function (next) { get('/pks/all', next); },
    function (next) { pksAdd(pubkeyTobi, pubkeyTobiSig, next); },
    function (next) { get('/pks/lookup?op=index&search=', next); },
    function (next) { get('/pks/all', next); },
    function (next) { pksAdd(pubkeyTobi, pubkeySnowSig, next); },
    function (next) { get('/pks/lookup?op=index&search=', next); },
    function (next) { get('/pks/all', next); },
    function (next) { pksAdd(pubkeyWhite, pubkeyWhiteSig, next); },
    function (next) { get('/pks/lookup?op=index&search=', next); },
    function (next) { get('/pks/all', next); },
    function (next) { get('/hdc/amendments/promoted', next); },
    function (next) { get('/hdc/amendments/promoted/0', next); },
    function (next) { get('/hdc/amendments/promoted/1', next); },
    function (next) { get('/hdc/amendments/promoted/2', next); },
    function (next) { get('/hdc/amendments/promoted/3', next); },
    function (next) { get('/hdc/amendments/current/votes', next); },
    function (next) { console.log("Sending Cat's AM0..."); vote(voteCatAM0, next); },
    function (next) { get('/hdc/amendments/current/votes', next); },
    function (next) { get('/hdc/amendments/promoted', next); },
    function (next) { get('/hdc/amendments/promoted/0', next); },
    function (next) { get('/hdc/amendments/promoted/1', next); },
    function (next) { get('/hdc/amendments/promoted/2', next); },
    function (next) { get('/hdc/amendments/promoted/3', next); },
    function (next) { console.log("Sending Tobi's AM0..."); vote(voteTobiAM0, next); },
    function (next) { get('/hdc/amendments/current/votes', next); },
    function (next) { get('/hdc/amendments/promoted', next); },
    function (next) { get('/hdc/amendments/promoted/0', next); },
    function (next) { get('/hdc/amendments/promoted/1', next); },
    function (next) { get('/hdc/amendments/promoted/2', next); },
    function (next) { get('/hdc/amendments/promoted/3', next); },
    function (next) { console.log("Sending Snow's AM0..."); vote(voteSnowAM0, next); },
    function (next) { get('/hdc/amendments/current/votes', next); },
    function (next) { get('/hdc/amendments/promoted', next); },
    function (next) { get('/hdc/amendments/promoted/0', next); },
    function (next) { get('/hdc/amendments/promoted/1', next); },
    function (next) { get('/hdc/amendments/promoted/2', next); },
    function (next) { get('/hdc/amendments/promoted/3', next); },
    function (next) { get('/hdc/amendments/votes', next); },
    function (next) { console.log("Sending Snow's AM0 dissident..."); vote(voteSnowAM0_2, next); },
    function (next) { get('/hdc/amendments/current/votes', next); },
    function (next) { get('/hdc/amendments/promoted', next); },
    function (next) { get('/hdc/amendments/promoted/0', next); },
    function (next) { get('/hdc/amendments/promoted/1', next); },
    function (next) { get('/hdc/amendments/promoted/2', next); },
    function (next) { get('/hdc/amendments/promoted/3', next); },
    function (next) { console.log("Sending Snow's AM1..."); vote(voteSnowAM1, next); },
    function (next) { get('/hdc/amendments/current/votes', next); },
    function (next) { get('/hdc/amendments/promoted', next); },
    function (next) { get('/hdc/amendments/promoted/0', next); },
    function (next) { get('/hdc/amendments/promoted/1', next); },
    function (next) { get('/hdc/amendments/promoted/2', next); },
    function (next) { get('/hdc/amendments/promoted/3', next); },
    function (next) { console.log("Sending Tobi's AM1..."); vote(voteTobiAM1, next); },
    function (next) { get('/hdc/amendments/current/votes', next); },
    function (next) { get('/hdc/amendments/promoted', next); },
    function (next) { get('/hdc/amendments/promoted/0', next); },
    function (next) { get('/hdc/amendments/promoted/1', next); },
    function (next) { get('/hdc/amendments/promoted/2', next); },
    function (next) { get('/hdc/amendments/promoted/3', next); },
    function (next) { console.log("Sending Cat's AM1..."); vote(voteCatAM1, next); },
    function (next) { get('/hdc/amendments/promoted', next); },
    function (next) { get('/hdc/amendments/promoted/0', next); },
    function (next) { get('/hdc/amendments/promoted/1', next); },
    function (next) { get('/hdc/amendments/promoted/2', next); },
    function (next) { get('/hdc/amendments/promoted/3', next); },
    function (next) { console.log("Sending White's AM1..."); vote(voteWhiteAM1, next); },
    function (next) { get('/hdc/amendments/current/votes', next); },
    function (next) { get('/hdc/amendments/votes', next); },
    function (next) { get('/hdc/amendments/promoted', next); },
    function (next) { get('/hdc/amendments/promoted/0', next); },
    function (next) { get('/hdc/amendments/promoted/1', next); },
    function (next) { get('/hdc/amendments/promoted/2', next); },
    function (next) { get('/hdc/amendments/promoted/3', next); },
    function (next) { get('/hdc/amendments/votes/0-58A2700B6CE56E112238FDCD81C8DACE2F2D06DC', next); },
    function (next) { get('/hdc/amendments/votes/1-5A6434BCD09400625CEA75BFE6F786829018BAD1', next); },
    function (next) { get('/hdc/amendments/view/0-58A2700B6CE56E112238FDCD81C8DACE2F2D06DC/self', next); },
    function (next) { get('/hdc/amendments/view/0-58A2700B6CE56E112238FDCD81C8DACE2F2D06DC/members', next); },
    function (next) { get('/hdc/amendments/view/0-58A2700B6CE56E112238FDCD81C8DACE2F2D06DC/signatures', next); },
    function (next) { get('/hdc/amendments/view/0-58A2700B6CE56E112238FDCD81C8DACE2F2D06DC/voters', next); },
    function (next) { get('/hdc/amendments/view/1-5A6434BCD09400625CEA75BFE6F786829018BAD1/self', next); },
    function (next) { get('/hdc/amendments/view/1-5A6434BCD09400625CEA75BFE6F786829018BAD1/members', next); },
    function (next) { get('/hdc/amendments/view/1-5A6434BCD09400625CEA75BFE6F786829018BAD1/signatures', next); },
    function (next) { get('/hdc/amendments/view/1-5A6434BCD09400625CEA75BFE6F786829018BAD1/voters', next); },
    function (next) { console.log("Sending Snow's AM2..."); vote(voteSnowAM2, next); },
    function (next) { get('/hdc/amendments/promoted', next); },
    function (next) { get('/hdc/amendments/promoted/0', next); },
    function (next) { get('/hdc/amendments/promoted/1', next); },
    function (next) { get('/hdc/amendments/promoted/2', next); },
    function (next) { get('/hdc/amendments/promoted/3', next); },
    function (next) { console.log("Sending Tobi's AM2..."); vote(voteTobiAM2, next); },
    function (next) { get('/hdc/amendments/promoted', next); },
    function (next) { get('/hdc/amendments/promoted/0', next); },
    function (next) { get('/hdc/amendments/promoted/1', next); },
    function (next) { get('/hdc/amendments/promoted/2', next); },
    function (next) { get('/hdc/amendments/promoted/3', next); },
    function (next) { console.log("Sending Cat's AM2..."); vote(voteCatAM2, next); },
    function (next) { get('/hdc/amendments/promoted', next); },
    function (next) { get('/hdc/amendments/promoted/0', next); },
    function (next) { get('/hdc/amendments/promoted/1', next); },
    function (next) { get('/hdc/amendments/promoted/2', next); },
    function (next) { get('/hdc/amendments/promoted/3', next); },
    function (next) { get('/hdc/coins/33BBFC0C67078D72AF128B5BA296CC530126F372/list', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/list', next); },
    function (next) { get('/hdc/coins/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/list', next); },
    function (next) { get('/hdc/coins/C73882B64B7E72237A2F460CE9CAB76D19A8651E/list', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/view/0', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/view/1', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/view/8', next); },
    function (next) { get('/hdc/transactions/keys', next); },
    function (next) { get('/hdc/transactions/recipient/2E69197FAB029D8669EF85E82457A1587CA0ED9C', next); },
    function (next) { get('/hdc/transactions/recipient/33BBFC0C67078D72AF128B5BA296CC530126F372', next); },
    function (next) { get('/hdc/transactions/recipient/C73882B64B7E72237A2F460CE9CAB76D19A8651E', next); },
    function (next) { issue(txTobi, next); },
    function (next) { get('/hdc/transactions/all', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance/dividend', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance/dividend/2', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance/fusion', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/transfert', next); },
    function (next) { get('/hdc/coins/33BBFC0C67078D72AF128B5BA296CC530126F372/list', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/list', next); },
    function (next) { get('/hdc/coins/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/list', next); },
    function (next) { get('/hdc/coins/C73882B64B7E72237A2F460CE9CAB76D19A8651E/list', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/view/0', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/view/1', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/view/8', next); },
    function (next) { get('/hdc/transactions/keys', next); },
    function (next) { get('/hdc/transactions/recipient/2E69197FAB029D8669EF85E82457A1587CA0ED9C', next); },
    function (next) { get('/hdc/transactions/recipient/33BBFC0C67078D72AF128B5BA296CC530126F372', next); },
    function (next) { get('/hdc/transactions/recipient/C73882B64B7E72237A2F460CE9CAB76D19A8651E', next); },
    function (next) { transfert(txTobiToSnow, next); },
    function (next) { get('/hdc/transactions/all', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance/dividend', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance/dividend/2', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance/fusion', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/transfert', next); },
    function (next) { get('/hdc/coins/33BBFC0C67078D72AF128B5BA296CC530126F372/list', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/list', next); },
    function (next) { get('/hdc/coins/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/list', next); },
    function (next) { get('/hdc/coins/C73882B64B7E72237A2F460CE9CAB76D19A8651E/list', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/view/0', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/view/1', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/view/8', next); },
    function (next) { get('/hdc/transactions/keys', next); },
    function (next) { get('/hdc/transactions/recipient/2E69197FAB029D8669EF85E82457A1587CA0ED9C', next); },
    function (next) { get('/hdc/transactions/recipient/33BBFC0C67078D72AF128B5BA296CC530126F372', next); },
    function (next) { get('/hdc/transactions/recipient/C73882B64B7E72237A2F460CE9CAB76D19A8651E', next); },
    function (next) { fusion(txTobiFusion, next); },
    function (next) { get('/hdc/transactions/all', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance/dividend', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance/dividend/2', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance/fusion', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/transfert', next); },
    function (next) { get('/hdc/coins/33BBFC0C67078D72AF128B5BA296CC530126F372/list', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/list', next); },
    function (next) { get('/hdc/coins/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/list', next); },
    function (next) { get('/hdc/coins/C73882B64B7E72237A2F460CE9CAB76D19A8651E/list', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/view/0', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/view/1', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/view/8', next); },
    function (next) { get('/hdc/transactions/keys', next); },
    function (next) { get('/hdc/transactions/recipient/2E69197FAB029D8669EF85E82457A1587CA0ED9C', next); },
    function (next) { get('/hdc/transactions/recipient/33BBFC0C67078D72AF128B5BA296CC530126F372', next); },
    function (next) { get('/hdc/transactions/recipient/C73882B64B7E72237A2F460CE9CAB76D19A8651E', next); },
    function (next) { transfert(txTobiToCat, next); },
    function (next) { get('/hdc/transactions/all', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance/dividend', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance/dividend/2', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance/fusion', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/transfert', next); },
    function (next) { get('/hdc/coins/33BBFC0C67078D72AF128B5BA296CC530126F372/list', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/list', next); },
    function (next) { get('/hdc/coins/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/list', next); },
    function (next) { get('/hdc/coins/C73882B64B7E72237A2F460CE9CAB76D19A8651E/list', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/view/0', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/view/1', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/view/8', next); },
    function (next) { get('/hdc/transactions/keys', next); },
    function (next) { get('/hdc/transactions/recipient/2E69197FAB029D8669EF85E82457A1587CA0ED9C', next); },
    function (next) { get('/hdc/transactions/recipient/33BBFC0C67078D72AF128B5BA296CC530126F372', next); },
    function (next) { get('/hdc/transactions/recipient/C73882B64B7E72237A2F460CE9CAB76D19A8651E', next); },
    function (next) { issue(txCat, next); },
    function (next) { get('/hdc/transactions/all', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance/dividend', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance/dividend/2', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/issuance/fusion', next); },
    function (next) { get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C/transfert', next); },
    function (next) { get('/hdc/coins/33BBFC0C67078D72AF128B5BA296CC530126F372/list', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/list', next); },
    function (next) { get('/hdc/coins/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/list', next); },
    function (next) { get('/hdc/coins/C73882B64B7E72237A2F460CE9CAB76D19A8651E/list', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/view/0', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/view/1', next); },
    function (next) { get('/hdc/coins/2E69197FAB029D8669EF85E82457A1587CA0ED9C/view/8', next); },
    function (next) { get('/hdc/transactions/keys', next); },
    function (next) { get('/hdc/transactions/recipient/2E69197FAB029D8669EF85E82457A1587CA0ED9C', next); },
    function (next) { get('/hdc/transactions/recipient/33BBFC0C67078D72AF128B5BA296CC530126F372', next); },
    function (next) { get('/hdc/transactions/recipient/C73882B64B7E72237A2F460CE9CAB76D19A8651E', next); },
    // function (next) { trust(thtCat, next); },
    // function (next) { get('/ucg/tht', next); },
    // function (next) { get('/ucg/tht/SOME_WRONG_FPR', next); },
    // function (next) { get('/ucg/tht/33BBFC0C67078D72AF128B5BA296CC530126F372', next); },
    // function (next) { get('/ucg/tht/C73882B64B7E72237A2F460CE9CAB76D19A8651E', next); },
  ], function (err) {
    console.log("API fed.");
    done(err);
  });
});

//----------- PKS -----------

describe('Sending public key', function(){

  api.pksAll(200, 0, '');
  api.pksAll(200, 1, '33BBFC0C67078D72AF128B5BA296CC530126F372'); // Added 33BBFC0C67078D72AF128B5BA296CC530126F372
  api.pksAll(200, 2, '5DB500A285BD380A68890D09232475A8CA003DC8'); // Added C73882B64B7E72237A2F460CE9CAB76D19A8651E
  api.pksAll(200, 3, 'F5ACFD67FC908D28C0CFDAD886249AC260515C90'); // Added 2E69197FAB029D8669EF85E82457A1587CA0ED9C
  api.pksAll(200, 3, 'F5ACFD67FC908D28C0CFDAD886249AC260515C90'); // Added nothing (wrong signature)
  api.pksAll(200, 4, '7B66992FD748579B0774EDFAD7AB84143357F7BC'); // Added B6AE93DDE390B1E11FA97EEF78B494F99025C77E
  api.pksAdd(200); // Added 33BBFC0C67078D72AF128B5BA296CC530126F372 Snow
  api.pksAdd(200); // Added C73882B64B7E72237A2F460CE9CAB76D19A8651E Cat 
  api.pksAdd(200); // Added 2E69197FAB029D8669EF85E82457A1587CA0ED9C Tobi
  api.pksAdd(400); // Added 2E69197FAB029D8669EF85E82457A1587CA0ED9C Tobi with Sig of Snow
  api.pksAdd(200); // Added B6AE93DDE390B1E11FA97EEF78B494F99025C77E White
  api.pksLookup(200, 1); // Added Snow
  api.pksLookup(200, 2); // Added Cat
  api.pksLookup(200, 3); // Added Tobi
  api.pksLookup(200, 3); // Added nothing
  api.pksLookup(200, 4); // Added Walter
});

//----------- Votes -----------

function checkVote (index, statusCode) {
  return function(){
    // console.log(apiRes['/hdc/amendments/votes'][index].res.text);
    var status = apiRes['/hdc/amendments/votes'][index].res.status;
    if(!statusCode && status != 200){
      console.log('HTTP ' + status + ': ' + apiRes['/hdc/amendments/votes'][index].res.text);
    }
    apiRes['/hdc/amendments/votes'][index].res.should.have.status(statusCode);
    if(statusCode == 200){
      var json = JSON.parse(apiRes['/hdc/amendments/votes'][index].res.text);
      json.should.have.property('amendment');
      json.should.have.property('signature');
    }
  }
}

function checkIndex1 (index) {
  return function () {
    var json = JSON.parse(apiRes['/hdc/amendments/votes'][index].res.text);
    json.should.have.property('amendments');
    _(json.amendments).size().should.equal(1);
    _(json.amendments[0]).size().should.equal(1);
    json.amendments[0].should.have.property('58A2700B6CE56E112238FDCD81C8DACE2F2D06DC');
    json.amendments[0]['58A2700B6CE56E112238FDCD81C8DACE2F2D06DC'].should.equal(3);
  };
}

function checkIndex2 (index) {
  return function () {
    var json = JSON.parse(apiRes['/hdc/amendments/votes'][index].res.text);
    json.should.have.property('amendments');
    _(json.amendments).size().should.equal(2);
    _(json.amendments[0]).size().should.equal(2);
    json.amendments[0].should.have.property('58A2700B6CE56E112238FDCD81C8DACE2F2D06DC');
    json.amendments[0].should.have.property('A5C998BD0B47B64E727FFC5EDA652CCAC7C86DF5');
    json.amendments[1].should.have.property('5A6434BCD09400625CEA75BFE6F786829018BAD1');
    json.amendments[0]['58A2700B6CE56E112238FDCD81C8DACE2F2D06DC'].should.equal(3);
    json.amendments[0]['A5C998BD0B47B64E727FFC5EDA652CCAC7C86DF5'].should.equal(1);
    json.amendments[1]['5A6434BCD09400625CEA75BFE6F786829018BAD1'].should.equal(3);
  };
}

function checkVotes (index, votersCount, hash) {
  return function(){
    apiRes['/hdc/amendments/current/votes'][index].res.should.have.status(200);
    var json = JSON.parse(apiRes['/hdc/amendments/current/votes'][index].res.text);
    isMerkleNodesResult(json);
    json.levelsCount.should.equal(votersCount);
    _(json.levels).size().should.equal(1);
    _(json.levels[0]).size().should.equal(1);
    json.levels[0][0].should.equal(hash);
  }
}

describe('Sending vote', function(){
  var index = -1;
  it('AM0 of LoL Cat should respond 200', checkVote(++index, 200));
  it('AM0 of Tobi Uchiha should respond 200', checkVote(++index, 200));
  it('AM0 of John Snow should respond 200', checkVote(++index, 200));
  it('- index should have ', checkIndex1(++index));
  it('AM0 (dissident) of John Snow should respond 200', checkVote(++index, 200));
  it('AM1 of John Snow should respond 200', checkVote(++index, 200));
  it('AM1 of Tobi should respond 200', checkVote(++index, 200));
  it('AM1 of Cat should respond 200', checkVote(++index, 200));
  it('AM1 of Walter White should respond 400', checkVote(++index, 400));
  it('- index should have ', checkIndex2(++index));
});

describe('Checking votes', function(){
  var index = 0;
  it('should respond 200 and have some votes', function () {
    apiRes['/hdc/amendments/current/votes'][0].res.should.have.status(404);
  });
  it('should respond 200 and have some votes', checkVotes(++index, 1, 'C375AD6F94E0D2E57301E5AE522E64E5EA696139'));
  it('should respond 200 and have some votes', checkVotes(++index, 2, '9C1292795D434AB938EA2509E85C1E2726875D7E'));
  it('should respond 200 and have some votes', checkVotes(++index, 3, 'C8239FF2434490AFE28BA339F53C7237B7C14B19'));
  // Vote for a dissident AM0
  it('should respond 200 and have some votes', checkVotes(++index, 3, 'C8239FF2434490AFE28BA339F53C7237B7C14B19'));
  // Fist vote for AM1 (not enough)
  it('should respond 200 and have some votes', checkVotes(++index, 3, 'C8239FF2434490AFE28BA339F53C7237B7C14B19'));
  // Second vote for AM1 (promoted)
  it('should respond 200 and have some votes', checkVotes(++index, 2, '096BCADFFBAB6FE9CA2E44265FCCAD7ADE0E33CA'));
  it('should respond 200 and have some votes', checkVotes(++index, 3, '21DDC685FB54AB0520B091E3762845F0AA97C257'));
});

//----------- Amendments -----------

describe('Checking current amendment', function(){
  var index = -1;
  api.checkPromoted(null, 404);
  api.checkPromoted(0   , 404);
  api.checkPromoted(1   , 404);
  api.checkPromoted(2   , 404);
  api.checkPromoted(3   , 404);
  // 1 vote for AM0 (enough)
  api.checkPromoted(null, 200, '58A2700B6CE56E112238FDCD81C8DACE2F2D06DC');
  api.checkPromoted(0   , 200, '58A2700B6CE56E112238FDCD81C8DACE2F2D06DC');
  api.checkPromoted(1   , 404);
  api.checkPromoted(2   , 404);
  api.checkPromoted(3   , 404);

  api.checkPromoted(null, 200, '58A2700B6CE56E112238FDCD81C8DACE2F2D06DC');
  api.checkPromoted(0   , 200, '58A2700B6CE56E112238FDCD81C8DACE2F2D06DC');
  api.checkPromoted(1   , 404);
  api.checkPromoted(2   , 404);
  api.checkPromoted(3   , 404);

  api.checkPromoted(null, 200, '58A2700B6CE56E112238FDCD81C8DACE2F2D06DC');
  api.checkPromoted(0   , 200, '58A2700B6CE56E112238FDCD81C8DACE2F2D06DC');
  api.checkPromoted(1   , 404);
  api.checkPromoted(2   , 404);
  api.checkPromoted(3   , 404);

  api.checkPromoted(null, 200, '58A2700B6CE56E112238FDCD81C8DACE2F2D06DC');
  api.checkPromoted(0   , 200, '58A2700B6CE56E112238FDCD81C8DACE2F2D06DC');
  api.checkPromoted(1   , 404);
  api.checkPromoted(2   , 404);
  api.checkPromoted(3   , 404);

  // 1 vote for AM1 (not enough)
  api.checkPromoted(null, 200, '58A2700B6CE56E112238FDCD81C8DACE2F2D06DC');
  api.checkPromoted(0   , 200, '58A2700B6CE56E112238FDCD81C8DACE2F2D06DC');
  api.checkPromoted(1   , 404);
  api.checkPromoted(2   , 404);
  api.checkPromoted(3   , 404);

  // 2 votes for AM1 (enough)
  api.checkPromoted(null, 200, '5A6434BCD09400625CEA75BFE6F786829018BAD1');
  api.checkPromoted(0   , 200, '58A2700B6CE56E112238FDCD81C8DACE2F2D06DC');
  api.checkPromoted(1   , 200, '5A6434BCD09400625CEA75BFE6F786829018BAD1');
  api.checkPromoted(2   , 404);
  api.checkPromoted(3   , 404);

  api.checkPromoted(null, 200, '5A6434BCD09400625CEA75BFE6F786829018BAD1');
  api.checkPromoted(0   , 200, '58A2700B6CE56E112238FDCD81C8DACE2F2D06DC');
  api.checkPromoted(1   , 200, '5A6434BCD09400625CEA75BFE6F786829018BAD1');
  api.checkPromoted(2   , 404);
  api.checkPromoted(3   , 404);

  api.checkPromoted(null, 200, '5A6434BCD09400625CEA75BFE6F786829018BAD1');
  api.checkPromoted(0   , 200, '58A2700B6CE56E112238FDCD81C8DACE2F2D06DC');
  api.checkPromoted(1   , 200, '5A6434BCD09400625CEA75BFE6F786829018BAD1');
  api.checkPromoted(2   , 404);
  api.checkPromoted(3   , 404);

  // 1 vote for AM2 (not enough)
  api.checkPromoted(null, 200, '5A6434BCD09400625CEA75BFE6F786829018BAD1');
  api.checkPromoted(0   , 200, '58A2700B6CE56E112238FDCD81C8DACE2F2D06DC');
  api.checkPromoted(1   , 200, '5A6434BCD09400625CEA75BFE6F786829018BAD1');
  api.checkPromoted(2   , 404);
  api.checkPromoted(3   , 404);

  // 2 votes for AM2 (enough)
  api.checkPromoted(null, 200, 'F5372B1A5505DB5FBFDD146E5B391C6252B7D174');
  api.checkPromoted(0   , 200, '58A2700B6CE56E112238FDCD81C8DACE2F2D06DC');
  api.checkPromoted(1   , 200, '5A6434BCD09400625CEA75BFE6F786829018BAD1');
  api.checkPromoted(2   , 200, 'F5372B1A5505DB5FBFDD146E5B391C6252B7D174');
  api.checkPromoted(3   , 404);

  api.checkPromoted(null, 200, 'F5372B1A5505DB5FBFDD146E5B391C6252B7D174');
  api.checkPromoted(0   , 200, '58A2700B6CE56E112238FDCD81C8DACE2F2D06DC');
  api.checkPromoted(1   , 200, '5A6434BCD09400625CEA75BFE6F786829018BAD1');
  api.checkPromoted(2   , 200, 'F5372B1A5505DB5FBFDD146E5B391C6252B7D174');
  api.checkPromoted(3   , 404);
});

describe('Checking amendments', function(){
  it('0 should respond 200 and have self infos', function(){
    var json = JSON.parse(apiRes['/hdc/amendments/view/0-58A2700B6CE56E112238FDCD81C8DACE2F2D06DC/self'][0].res.text);
    json.should.have.property('version');
    json.should.have.property('currency');
    json.should.have.property('number');
    json.should.have.property('generated');
    json.should.have.property('dividend');
    json.should.have.property('coinMinPower');
    json.should.have.property('previousHash');
    json.should.have.property('previousVotesRoot');
    json.should.have.property('previousVotesCount');
    json.should.have.property('membersRoot');
    json.should.have.property('membersCount');
    json.should.have.property('membersChanges');
    json.should.have.property('votersRoot');
    json.should.have.property('votersCount');
    json.should.have.property('votersChanges');
    json.should.have.property('raw');
    sha1(json.raw).toUpperCase().should.equal('58A2700B6CE56E112238FDCD81C8DACE2F2D06DC');
  });
  it('0 should respond 200 and be legitimated by 3 signatures', function(){
    var json = JSON.parse(apiRes['/hdc/amendments/votes/0-58A2700B6CE56E112238FDCD81C8DACE2F2D06DC'][0].res.text);
    isMerkleNodesResult(json);
    json.levelsCount.should.equal(3);
    _(json.levels).size().should.equal(1);
    _(json.levels[0]).size().should.equal(1);
    json.levels[0][0].should.equal('C8239FF2434490AFE28BA339F53C7237B7C14B19');
  });
  it('0 should respond 200 and have some members', function(){
    var json = JSON.parse(apiRes['/hdc/amendments/view/0-58A2700B6CE56E112238FDCD81C8DACE2F2D06DC/members'][0].res.text);
    isMerkleNodesResult(json);
    json.levelsCount.should.equal(3);
    _(json.levels).size().should.equal(1);
    _(json.levels[0]).size().should.equal(1);
    json.levels[0][0].should.equal('F5ACFD67FC908D28C0CFDAD886249AC260515C90');
  });
  it('0 should respond 200 and have 0 signatures', function(){
    var json = JSON.parse(apiRes['/hdc/amendments/view/0-58A2700B6CE56E112238FDCD81C8DACE2F2D06DC/signatures'][0].res.text);
    isMerkleNodesResult(json);
    json.levelsCount.should.equal(1);
    _(json.levels).size().should.equal(1);
    _(json.levels[0]).size().should.equal(0);
  });
  it('0 should respond 200 and have 3 voters', function(){
    var json = JSON.parse(apiRes['/hdc/amendments/view/0-58A2700B6CE56E112238FDCD81C8DACE2F2D06DC/voters'][0].res.text);
    isMerkleNodesResult(json);
    json.levelsCount.should.equal(3);
    _(json.levels).size().should.equal(1);
    _(json.levels[0]).size().should.equal(1);
    json.levels[0][0].should.equal('F5ACFD67FC908D28C0CFDAD886249AC260515C90');
  });
  it('1 should respond 200 and have self infos', function(){
    var json = JSON.parse(apiRes['/hdc/amendments/view/1-5A6434BCD09400625CEA75BFE6F786829018BAD1/self'][0].res.text);
    json.should.have.property('version');
    json.should.have.property('currency');
    json.should.have.property('number');
    json.should.have.property('generated');
    json.should.have.property('dividend');
    json.should.have.property('coinMinPower');
    json.should.have.property('previousHash');
    json.should.have.property('previousVotesRoot');
    json.should.have.property('previousVotesCount');
    json.should.have.property('membersRoot');
    json.should.have.property('membersCount');
    json.should.have.property('membersChanges');
    json.should.have.property('votersRoot');
    json.should.have.property('votersCount');
    json.should.have.property('votersChanges');
    json.should.have.property('raw');
    sha1(json.raw).toUpperCase().should.equal('5A6434BCD09400625CEA75BFE6F786829018BAD1');
  });
  it('1 should respond 200 and be legitimated by 3 signatures', function(){
    var json = JSON.parse(apiRes['/hdc/amendments/votes/1-5A6434BCD09400625CEA75BFE6F786829018BAD1'][0].res.text);
    isMerkleNodesResult(json);
    json.levelsCount.should.equal(3);
    _(json.levels).size().should.equal(1);
    _(json.levels[0]).size().should.equal(1);
    json.levels[0][0].should.equal('21DDC685FB54AB0520B091E3762845F0AA97C257');
  });
  it('1 should respond 200 and have some members', function(){
    var json = JSON.parse(apiRes['/hdc/amendments/view/1-5A6434BCD09400625CEA75BFE6F786829018BAD1/members'][0].res.text);
    isMerkleNodesResult(json);
    json.levelsCount.should.equal(3);
    _(json.levels).size().should.equal(1);
    _(json.levels[0]).size().should.equal(1);
    json.levels[0][0].should.equal('F5ACFD67FC908D28C0CFDAD886249AC260515C90');
  });
  it('1 should respond 200 and have some signatures', function(){
    var json = JSON.parse(apiRes['/hdc/amendments/view/1-5A6434BCD09400625CEA75BFE6F786829018BAD1/signatures'][0].res.text);
    isMerkleNodesResult(json);
    json.levelsCount.should.equal(3);
    _(json.levels).size().should.equal(1);
    _(json.levels[0]).size().should.equal(1);
    json.levels[0][0].should.equal('C8239FF2434490AFE28BA339F53C7237B7C14B19');
  });
  it('1 should respond 200 and have some voters', function(){
    var json = JSON.parse(apiRes['/hdc/amendments/view/1-5A6434BCD09400625CEA75BFE6F786829018BAD1/voters'][0].res.text);
    isMerkleNodesResult(json);
    json.levelsCount.should.equal(3);
    _(json.levels).size().should.equal(1);
    _(json.levels[0]).size().should.equal(1);
    json.levels[0][0].should.equal('F5ACFD67FC908D28C0CFDAD886249AC260515C90');
  });
});



describe('Checking TX processed -', function(){
  api.checkProcessedTX('Issuance of Tobi (80)', 200);
  api.checkProcessedTX('Transfert of Tobi (20)', 200);
  api.checkProcessedTX('Fusion of Tobi (20)', 200);
  api.checkProcessedTX('Transfert of Tobi (10)', 200);
  api.checkProcessedTX('Issuance of Cat (110)', 200);
});

describe('Checking TX', function(){
  api.txAllMerkle('ISSUANCE',   '5D2AB118FA861D73B66400DA06015EA2D2158E34', 1);
  api.txAllMerkle('TRANSFERT',  'C36FDC25290C5833852AA015A2FD5A56AF6C9A65', 2);
  api.txAllMerkle('FUSION',     '20320F8857EB6834C78E7CD1A088641DF45FDB2C', 3);

  api.txSenderMerkle('ISSUANCE',  '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '5D2AB118FA861D73B66400DA06015EA2D2158E34', 1);
  api.txSenderMerkle('TRANSFERT', '2E69197FAB029D8669EF85E82457A1587CA0ED9C', 'C36FDC25290C5833852AA015A2FD5A56AF6C9A65', 2);
  api.txSenderMerkle('FUSION',    '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '20320F8857EB6834C78E7CD1A088641DF45FDB2C', 3);

  api.txIssuerMerkle('ISSUANCE',  '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '5D2AB118FA861D73B66400DA06015EA2D2158E34', 1);
  api.txIssuerMerkle('TRANSFERT', '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '5D2AB118FA861D73B66400DA06015EA2D2158E34', 1);
  api.txIssuerMerkle('FUSION',    '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '4B855F4F75E3655690384E2B07EF775F4D0A7827', 2);
  api.txIssuerMerkle('TRANSFERT to Cat',    '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '4B855F4F75E3655690384E2B07EF775F4D0A7827', 2);

  api.txIssuerDividendMerkle('ISSUANCE',  '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '5D2AB118FA861D73B66400DA06015EA2D2158E34', 1);
  api.txIssuerDividendMerkle('TRANSFERT', '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '5D2AB118FA861D73B66400DA06015EA2D2158E34', 1);
  api.txIssuerDividendMerkle('FUSION',    '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '5D2AB118FA861D73B66400DA06015EA2D2158E34', 1);
  api.txIssuerDividendMerkle('TRANSFERT to Cat',    '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '5D2AB118FA861D73B66400DA06015EA2D2158E34', 1);

  api.txIssuerDividen2dMerkle('ISSUANCE',  '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '5D2AB118FA861D73B66400DA06015EA2D2158E34', 1);
  api.txIssuerDividen2dMerkle('TRANSFERT', '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '5D2AB118FA861D73B66400DA06015EA2D2158E34', 1);
  api.txIssuerDividen2dMerkle('FUSION',    '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '5D2AB118FA861D73B66400DA06015EA2D2158E34', 1);
  api.txIssuerDividen2dMerkle('TRANSFERT to Cat',    '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '5D2AB118FA861D73B66400DA06015EA2D2158E34', 1);

  api.txIssuerTransfertMerkle('ISSUANCE',  '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '', 0);
  api.txIssuerTransfertMerkle('TRANSFERT', '2E69197FAB029D8669EF85E82457A1587CA0ED9C', 'DCF968F061CAE208F4089392FA09BE3AEA8CD324', 1);
  api.txIssuerTransfertMerkle('FUSION',    '2E69197FAB029D8669EF85E82457A1587CA0ED9C', 'DCF968F061CAE208F4089392FA09BE3AEA8CD324', 1);

  api.txIssuerFusionMerkle('ISSUANCE',  '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '', 0);
  api.txIssuerFusionMerkle('TRANSFERT',  '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '', 0);
  api.txIssuerFusionMerkle('FUSION',  '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '902159D7F080ECA289E0A2A7B61DA507DAC67E4F', 1);
  api.txIssuerFusionMerkle('TRANSFERT to Cat',  '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '902159D7F080ECA289E0A2A7B61DA507DAC67E4F', 1);

  // Recipients API
  api.txRecipientMerkle('NONE',             '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '', 0);
  api.txRecipientMerkle('ISSUANCE',         '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '5D2AB118FA861D73B66400DA06015EA2D2158E34', 1);
  api.txRecipientMerkle('TRANSFERT',        '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '5D2AB118FA861D73B66400DA06015EA2D2158E34', 1);
  api.txRecipientMerkle('FUSION',           '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '4B855F4F75E3655690384E2B07EF775F4D0A7827', 2);
  api.txRecipientMerkle('TRANSFERT to Cat', '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '4B855F4F75E3655690384E2B07EF775F4D0A7827', 2);
  api.txRecipientMerkle('ISSUANCE to Cat',  '2E69197FAB029D8669EF85E82457A1587CA0ED9C', '4B855F4F75E3655690384E2B07EF775F4D0A7827', 2);

  api.txRecipientMerkle('NONE',             '33BBFC0C67078D72AF128B5BA296CC530126F372', '', 0);
  api.txRecipientMerkle('ISSUANCE',         '33BBFC0C67078D72AF128B5BA296CC530126F372', '', 0);
  api.txRecipientMerkle('TRANSFERT',        '33BBFC0C67078D72AF128B5BA296CC530126F372', 'DCF968F061CAE208F4089392FA09BE3AEA8CD324', 1);
  api.txRecipientMerkle('FUSION',           '33BBFC0C67078D72AF128B5BA296CC530126F372', 'DCF968F061CAE208F4089392FA09BE3AEA8CD324', 1);
  api.txRecipientMerkle('TRANSFERT to Cat', '33BBFC0C67078D72AF128B5BA296CC530126F372', 'DCF968F061CAE208F4089392FA09BE3AEA8CD324', 1);
  api.txRecipientMerkle('ISSUANCE to Cat',  '33BBFC0C67078D72AF128B5BA296CC530126F372', 'DCF968F061CAE208F4089392FA09BE3AEA8CD324', 1);

  api.txRecipientMerkle('NONE',             'C73882B64B7E72237A2F460CE9CAB76D19A8651E', '', 0);
  api.txRecipientMerkle('ISSUANCE',         'C73882B64B7E72237A2F460CE9CAB76D19A8651E', '', 0);
  api.txRecipientMerkle('TRANSFERT',        'C73882B64B7E72237A2F460CE9CAB76D19A8651E', '', 0);
  api.txRecipientMerkle('FUSION',           'C73882B64B7E72237A2F460CE9CAB76D19A8651E', '', 0);
  api.txRecipientMerkle('TRANSFERT to Cat', 'C73882B64B7E72237A2F460CE9CAB76D19A8651E', 'ABFC931A5995371FB7E9E1D4DD66BF43BAB947E2', 1);
  api.txRecipientMerkle('ISSUANCE of Cat',  'C73882B64B7E72237A2F460CE9CAB76D19A8651E', '3B287C8B4BBB92D408D6041B2CFDA414E9A54BE8', 2);
});

describe('Checking COINS', function(){
  api.coinsList('INITIALLY', '33BBFC0C67078D72AF128B5BA296CC530126F372', 0); // Snow
  api.coinsList('INITIALLY', '2E69197FAB029D8669EF85E82457A1587CA0ED9C', 0); // Tobi
  api.coinsList('INITIALLY', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 0); // Non-existing
  api.coinsList('INITIALLY', 'C73882B64B7E72237A2F460CE9CAB76D19A8651E', 0); // Cat

  api.coinsList('ISSUANCE of Tobi', '33BBFC0C67078D72AF128B5BA296CC530126F372', 0);
  api.coinsList('ISSUANCE of Tobi', '2E69197FAB029D8669EF85E82457A1587CA0ED9C', 7);
  api.coinsList('ISSUANCE of Tobi', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 0);
  api.coinsList('ISSUANCE of Tobi', 'C73882B64B7E72237A2F460CE9CAB76D19A8651E', 0);

  api.coinsList('TRANSFERT of Tobi', '33BBFC0C67078D72AF128B5BA296CC530126F372', 1);
  api.coinsList('TRANSFERT of Tobi', '2E69197FAB029D8669EF85E82457A1587CA0ED9C', 6);
  api.coinsList('TRANSFERT of Tobi', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 0);
  api.coinsList('TRANSFERT of Tobi', 'C73882B64B7E72237A2F460CE9CAB76D19A8651E', 0);

  api.coinsList('FUSION of Tobi', '33BBFC0C67078D72AF128B5BA296CC530126F372', 1);
  api.coinsList('FUSION of Tobi', '2E69197FAB029D8669EF85E82457A1587CA0ED9C', 5);
  api.coinsList('FUSION of Tobi', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 0);
  api.coinsList('FUSION of Tobi', 'C73882B64B7E72237A2F460CE9CAB76D19A8651E', 0);

  api.coinsList('TRANSFERT to Cat', '33BBFC0C67078D72AF128B5BA296CC530126F372', 1);
  api.coinsList('TRANSFERT to Cat', '2E69197FAB029D8669EF85E82457A1587CA0ED9C', 4);
  api.coinsList('TRANSFERT to Cat', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 0);
  api.coinsList('TRANSFERT to Cat', 'C73882B64B7E72237A2F460CE9CAB76D19A8651E', 1);

  api.coinsList('ISSUANCE of Cat', '33BBFC0C67078D72AF128B5BA296CC530126F372', 1);
  api.coinsList('ISSUANCE of Cat', '2E69197FAB029D8669EF85E82457A1587CA0ED9C', 4);
  api.coinsList('ISSUANCE of Cat', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 0);
  api.coinsList('ISSUANCE of Cat', 'C73882B64B7E72237A2F460CE9CAB76D19A8651E', 5, 2);
});

describe('Received keys for transactions', function(){
  api.keys('with NO transactions should be 0', 0, '');
  api.keys('with NO transactions should be 1', 1, '2E69197FAB029D8669EF85E82457A1587CA0ED9C');
  api.keys('with NO transactions should be 2', 2, 'DC7A9229DFDABFB9769789B7BFAE08048BCB856F');
  api.keys('with NO transactions should be 2', 2, 'DC7A9229DFDABFB9769789B7BFAE08048BCB856F');
  api.keys('with NO transactions should be 2', 3, 'F5ACFD67FC908D28C0CFDAD886249AC260515C90');
  api.keys('with NO transactions should be 2', 3, 'F5ACFD67FC908D28C0CFDAD886249AC260515C90');
});

// describe('THT', function(){
//   api.postTHT('POST for Cat should be ok', 200, 'C73882B64B7E72237A2F460CE9CAB76D19A8651E');
//   api.getTHT('GET for Merkle', 1, 'ACFCBC2327524C8363418D49E50169BB558641B3');
//   api.fprTHT('GET for FPR', 'SOME_WRONG_FPR', 400);
//   api.fprTHT('GET for FPR', '33BBFC0C67078D72AF128B5BA296CC530126F372', 404);
//   api.fprTHT('GET for FPR', 'C73882B64B7E72237A2F460CE9CAB76D19A8651E', 200, 'C73882B64B7E72237A2F460CE9CAB76D19A8651E');
// });

// describe('Peering', function(){
//   api.postPeering('POST for Cat should be ok', 200, 'C73882B64B7E72237A2F460CE9CAB76D19A8651E');
//   api.getPeering('GET for Merkle', 1, 'ACFCBC2327524C8363418D49E50169BB558641B3');
// });

function isMerkleNodesResult (json) {
  isMerkleResult(json);
  json.should.have.property('levels');
}

function isMerkleLeavesResult (json) {
  isMerkleResult(json);
  json.should.have.property('leaves');
  _(json.leaves).each(function (leaf) {
    leaf.should.have.property('hash');
    leaf.should.have.property('value');
  });
}

function isMerkleResult (json) {
  json.should.have.property('depth');
  json.should.have.property('nodesCount');
  json.should.have.property('levelsCount');
}

function isPubKey (json) {
  json.should.have.property('signature');
  json.should.have.property('key');
  json.key.should.have.property('email');
  json.key.should.have.property('name');
  json.key.should.have.property('fingerprint');
  json.key.should.have.property('raw');
  json.key.should.not.have.property('_id');
  json.key.raw.should.not.match(/-----/g);
}

//----------- PKS -----------
describe('Request on /pks/lookup', function(){
  it('GET should respond 200 with search=a&op=get', function(done){
    request(app)
      .get('/pks/lookup?search=a&op=get')
      .expect(200, done);
  });
  it('GET should respond 500 without search parameter', function(done){
    request(app)
      .get('/pks/lookup')
      .expect(500, done);
  });
  it('GET should respond 500 with search=a without op', function(done){
    request(app)
      .get('/pks/lookup')
      .expect(500, done);
  });
  it('POST should respond 404', function(done){
    request(app)
      .post('/pks/lookup')
      .expect(404, done);
  });
});


describe('Request on /pks/add', function(){
  it('POST should respond 400 BAD REQUEST', function(done){
    request(app)
      .post('/pks/add')
      .expect(400, done);
  });
});



//----------- UCG -----------
describe('GET', function(){
  it('/ucg/pubkey should respond 200 and serve valid pubkey of LoL Cat', function(done){
    request(app)
      .get('/ucg/pubkey')
      .expect(200)
      .end(function (err, res) {
       jpgp().certificate(res.text).fingerprint.should.equal("C73882B64B7E72237A2F460CE9CAB76D19A8651E");
        done();
      });
  });
  it('/ucg/peering should respond 200 and serve valid peering info', function(done){
    request(app)
      .get('/ucg/peering')
      .expect(200)
      .end(function (err, res) {
        var json = JSON.parse(res.text);
        json.currency.should.equal("beta_brousouf");
        json.key.should.equal("C73882B64B7E72237A2F460CE9CAB76D19A8651E");
        json.remote.port.should.equal("");
        json.remote.port.should.equal("");
        json.remote.should.have.property("ipv4");
        json.remote.should.have.property("ipv6");
        json.should.have.property("contract");
        json.contract.should.have.property("currentNumber");
        json.contract.should.have.property("hash");
        json.should.have.property("pks/all");
        json.should.have.property("hdc/amendments/current/votes");
        should.not.exist(json.peers);
        done();
      });
  });
});

//----------- AMENDMENTS -----------
describe('Request on /hdc/amendments/init', function(){
  it('GET should respond 404', function(done){
    request(app)
      .get('/hdc/amendments/init')
      .expect(404, done);
  });
});

describe('Request on /hdc/amendments/submit', function(){
  it('GET should respond 404', function(done){
    request(app)
      .post('/hdc/amendments/submit')
      .expect(404, done);
  });
});

describe('Request on /hdc/amendments/votes', function(){
  it('GET should respond 200', function(done){
    request(app)
      .get('/hdc/amendments/votes')
      .expect(200, done);
  });
  it('POST should respond 400', function(done){
    request(app)
      .post('/hdc/amendments/votes')
      .expect(400, done);
  });
});

describe('Request on /hdc/amendments/promoted', function(){
  it('GET should respond 200', function(done){
    request(app)
      .get('/hdc/amendments/promoted')
      .expect(200, done);
  });
});

describe('Request on /hdc/amendments/view/SOME_ID', function(){
  it('/self GET should respond 400', function(done){
    request(app)
      .get('/hdc/amendments/view/SOME_ID/self')
      .expect(400, done);
  });
  it('/members GET should respond 400', function(done){
    request(app)
      .get('/hdc/amendments/view/SOME_ID/members')
      .expect(400, done);
  });
  it('/voters GET should respond 400', function(done){
    request(app)
      .get('/hdc/amendments/view/SOME_ID/voters')
      .expect(400, done);
  });
  it('/signatures GET should respond 400', function(done){
    request(app)
      .get('/hdc/amendments/view/SOME_ID/signatures')
      .expect(400, done);
  });
  // Good param
  it('/self GET should respond 404', function(done){
    request(app)
      .get('/hdc/amendments/view/0-875F8DCCF2E24B5DEADF4410558E77D5ED2EC40A/self')
      .expect(404, done);
  });
  it('/members GET should respond 404', function(done){
    request(app)
      .get('/hdc/amendments/view/0-875F8DCCF2E24B5DEADF4410558E77D5ED2EC40A/members')
      .expect(404, done);
  });
  it('/voters GET should respond 404', function(done){
    request(app)
      .get('/hdc/amendments/view/0-875F8DCCF2E24B5DEADF4410558E77D5ED2EC40A/voters')
      .expect(404, done);
  });
  it('/signatures GET should respond 404', function(done){
    request(app)
      .get('/hdc/amendments/view/0-875F8DCCF2E24B5DEADF4410558E77D5ED2EC40A/signatures')
      .expect(404, done);
  });

  // Better param
  it('/self GET should respond 200', function(done){
    request(app)
      .get('/hdc/amendments/view/0-58A2700B6CE56E112238FDCD81C8DACE2F2D06DC/self')
      .expect(200, done);
  });
  it('/members GET should respond 200', function(done){
    request(app)
      .get('/hdc/amendments/view/0-58A2700B6CE56E112238FDCD81C8DACE2F2D06DC/members')
      .expect(200, done);
  });
  it('/voters GET should respond 200', function(done){
    request(app)
      .get('/hdc/amendments/view/0-58A2700B6CE56E112238FDCD81C8DACE2F2D06DC/voters')
      .expect(200, done);
  });
  it('/signatures GET should respond 200', function(done){
    request(app)
      .get('/hdc/amendments/view/0-58A2700B6CE56E112238FDCD81C8DACE2F2D06DC/signatures')
      .expect(200, done);
  });
});

describe('Request on /hdc/amendments/votes/:amendment_id', function(){
  it('GET with good URL param should respond 200', function(done){
    request(app)
      .get('/hdc/amendments/votes/0-875F8DCCF2E24B5DEADF4410558E77D5ED2EC40A')
      .expect(200, done);
  });
  it('POST should respond 404', function(done){
    request(app)
      .post('/hdc/amendments/votes/SOME_AM_ID')
      .expect(404, done);
  });
  it('GET with wrong URL param should respond 400', function(done){
    request(app)
      .get('/hdc/amendments/votes/SOME_AM_ID')
      .expect(400, done);
  });
});


describe('Request on /hdc/transactions/all', function(){
  it('GET with good URL param should respond 200', function(done){
    request(app)
      .get('/hdc/transactions/all')
      .expect(200, done);
  });
});

describe('Request on /hdc/transactions/all', function(){
  it('GET with good URL param should respond 200', function(done){
    request(app)
      .get('/hdc/transactions/sender/2E69197FAB029D8669EF85E82457A1587CA0ED9C')
      .expect(200, done);
  });
});

describe('Request on /hdc/coins/SOME_PGP_FPR/list', function(){
  it('GET with bad fingerprint format should respond 400', function(done){
    request(app)
      .get('/hdc/coins/SOME_PGP_FPR/list')
      .expect(400, done);
  });
});

describe('Request on /hdc/coins/SOME_PGP_FPR/view/COIN_ID', function(){
  it('GET with bad fingerprint format should respond 400', function(done){
    request(app)
      .get('/hdc/coins/SOME_PGP_FPR/view/COIN_ID')
      .expect(400, done);
  });
});
