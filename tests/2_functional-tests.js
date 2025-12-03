const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {

  // Timeout ampliado para evitar fallos en FCC
  this.timeout(5000);

  suite('GET /api/stock-prices => stockData object', function () {

    test('1 stock', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: 'GOOG' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.property(res.body.stockData, 'price');
          assert.property(res.body.stockData, 'likes');
          done();
        });
    });

    test('1 stock with like', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: 'AAPL', like: true })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.equal(res.body.stockData.stock, 'AAPL');
          assert.property(res.body.stockData, 'likes');
          assert.isAtLeast(res.body.stockData.likes, 1); // like debería sumar
          done();
        });
    });

    test('1 stock with like again (IP should not double count)', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: 'AAPL', like: true })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.equal(res.body.stockData.stock, 'AAPL');
          assert.property(res.body.stockData, 'likes');
          // el like NO debe incrementarse
          assert.equal(res.body.stockData.likes, 1);
          done();
        });
    });

    test('2 stocks', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: ['GOOG', 'MSFT'] })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.isArray(res.body.stockData);

          const [stock1, stock2] = res.body.stockData;
          assert.property(stock1, 'stock');
          assert.property(stock1, 'price');
          assert.property(stock1, 'rel_likes');
          assert.property(stock2, 'stock');
          assert.property(stock2, 'price');
          assert.property(stock2, 'rel_likes');

          done();
        });
    });

    test('2 stocks with like', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: ['GOOG', 'MSFT'], like: true })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.isArray(res.body.stockData);

          const [s1, s2] = res.body.stockData;

          assert.property(s1, 'rel_likes');
          assert.property(s2, 'rel_likes');

          // rel_likes debe ser numérico
          assert.isNumber(s1.rel_likes);
          assert.isNumber(s2.rel_likes);

          done();
        });
    });

  });
});
