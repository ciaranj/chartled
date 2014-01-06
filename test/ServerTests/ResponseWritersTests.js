var assert= require("assert")
  , sinon = require( "sinon" );

describe('ResponseWriters', function(){
    var sandbox, request, response;
    beforeEach(function () {
        sandbox = sinon.sandbox.create();
        var myResponse = { end: function() {}, set: function () {}, send: function(){}, write: function(){} };
        response= sandbox.mock(myResponse);
        request= { query: {}};
    });
    afterEach(function () {
        sandbox.restore();
    });
    describe('CSV', function() {
        var ResponseWriter= require('../../lib/response_renderers/csv')
        it('should respond with an text/csv mimetype', function(done) {
            response.expects("set").once().withArgs({'Content-Type': 'text/csv' });
            ResponseWriter.renderResults( request, response.object, [], function(err) {
                assert.equal(err, null);
                response.verify();
                done();
            });
        });
        it('should write an empty string for a null result set', function(done) {
            response.expects("send").never();
            response.expects("write").never();
            response.expects("end").once();
            ResponseWriter.renderResults( request, response.object, null, function(err) {
                assert.equal(err, null);
                response.verify();
                done();
            });
        });
        it('should write an empty string for an empty result set', function(done) {
            response.expects("send").never();
            response.expects("write").never();
            response.expects("end").once();
            ResponseWriter.renderResults( request, response.object, [], function(err) {
                assert.equal(err, null);
                response.verify();
                done();
            });
        });
    });
    describe('JSON', function() {
        var ResponseWriter= require('../../lib/response_renderers/json')
        it('should respond with an application/json mimetype', function(done) {
            response.expects("set").once().withArgs({'Content-Type': 'application/json' });
            ResponseWriter.renderResults( request, response.object, [], function(err) {
                assert.equal(err, null);
                response.verify();
                done();
            });
        });
        it('should respond with an JSON-P style result when requested.', function(done) {
            request.query.jsonp = "myJSONPCallback";
            response.expects("set").once().withArgs({'Content-Type': 'application/javascript' });
            ResponseWriter.renderResults( request, response.object, [], function(err) {
                assert.equal(err, null);
                response.verify();
                done();
            });
        });
        it('should write an empty array for a null result set', function(done) {
            response.expects("send").once().withArgs("[]");
            ResponseWriter.renderResults( request, response.object, null, function(err) {
                assert.equal(err, null);
                response.verify();
                done();
            });
        });
        it('should write an empty array for an empty result set', function(done) {
            response.expects("send").once().withArgs("[]");
            ResponseWriter.renderResults( request, response.object, [], function(err) {
                assert.equal(err, null);
                response.verify();
                done();
            });
        });
    });
    describe('RAW', function() {
        var ResponseWriter= require('../../lib/response_renderers/raw')
        it('should respond with an text/plain mimetype', function(done) {
            response.expects("set").once().withArgs({'Content-Type': 'text/plain' });
            ResponseWriter.renderResults( request, response.object, [], function(err) {
                assert.equal(err, null);
                response.verify();
                done();
            });
        });
        it('should write an empty string for a null result set', function(done) {
            response.expects("send").never();
            response.expects("write").never();
            response.expects("end").once();
            ResponseWriter.renderResults( request, response.object, null, function(err) {
                assert.equal(err, null);
                response.verify();
                done();
            });
        });
        it('should write an empty string for an empty result set', function(done) {
            response.expects("send").never();
            response.expects("write").never();
            response.expects("end").once();
            ResponseWriter.renderResults( request, response.object, [], function(err) {
                assert.equal(err, null);
                response.verify();
                done();
            });
        });
    });    
})
