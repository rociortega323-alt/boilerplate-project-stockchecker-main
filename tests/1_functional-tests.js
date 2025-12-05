const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  
  test('Viewing one stock: GET /api/stock-prices/', function(done) {
    chai.request(server)
      .get('/api/stock-prices?stock=AAPL')
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.property(res.body.stockData, 'stock');
        assert.property(res.body.stockData, 'price');
        assert.property(res.body.stockData, 'likes');
        done();
      });
  });

  test('Viewing one stock and liking it: GET /api/stock-prices/', function(done) {
    chai.request(server)
      .get('/api/stock-prices?stock=AAPL&like=true')
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.property(res.body.stockData, 'likes');
        assert.isAtLeast(res.body.stockData.likes, 1);
        done();
      });
  });

  test('Viewing the same stock and liking it again: GET /api/stock-prices/', function(done) {
    chai.request(server)
      .get('/api/stock-prices?stock=AAPL&like=true')
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.property(res.body.stockData, 'likes');
        // The likes should not increase because the same IP can't like twice
        assert.isAtMost(res.body.stockData.likes, 1);
        done();
      });
  });

  test('Viewing two stocks: GET /api/stock-prices/', function(done) {
    chai.request(server)
      .get('/api/stock-prices?stock=AAPL&stock=GOOGL')
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);
        assert.property(res.body.stockData[0], 'rel_likes');
        assert.property(res.body.stockData[1], 'rel_likes');
        done();
      });
  });

  test('Viewing two stocks and liking them: GET /api/stock-prices/', function(done) {
    chai.request(server)
      .get('/api/stock-prices?stock=AAPL&stock=GOOGL&like=true')
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);
        assert.property(res.body.stockData[0], 'rel_likes');
        assert.property(res.body.stockData[1], 'rel_likes');
        done();
      });
  });

});
