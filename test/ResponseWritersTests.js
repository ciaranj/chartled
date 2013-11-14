var assert= require("assert")
  , sinon = require( "sinon" );

describe('ResponseWriters', function(){
    var that= this;
    beforeEach(function () {
        that.sandbox = sinon.sandbox.create();
        var myResponse = { end: function() {}, set: function () {}, send: function(){}, write: function(){} };
        that.response= that.sandbox.mock(myResponse);
    });
    afterEach(function () {
        that.sandbox.restore();
        delete that.response;
    });
    describe('CSV', function() {
        var ResponseWriter= require('../lib/response_renderers/csv')
        it('should respond with an text/csv mimetype', function(done) {
            that.response.expects("set").once().withArgs({'Content-Type': 'text/csv' });
            ResponseWriter.renderResults( that.response.object, [], function(err) {
                assert.equal(err, null);
                that.response.verify();
                done();
            });
        });
        it('should write an empty string for a null result set', function(done) {
            that.response.expects("send").never();
            that.response.expects("write").never();
            that.response.expects("end").once();
            ResponseWriter.renderResults( that.response.object, null, function(err) {
                assert.equal(err, null);
                that.response.verify();
                done();
            });
        });
        it('should write an empty string for an empty result set', function(done) {
            that.response.expects("send").never();
            that.response.expects("write").never();
            that.response.expects("end").once();
            ResponseWriter.renderResults( that.response.object, [], function(err) {
                assert.equal(err, null);
                that.response.verify();
                done();
            });
        });
    });
    describe('JSON', function() {
        var ResponseWriter= require('../lib/response_renderers/json')
        it('should respond with an application/json mimetype', function(done) {
            that.response.expects("set").once().withArgs({'Content-Type': 'application/json' });
            ResponseWriter.renderResults( that.response.object, [], function(err) {
                assert.equal(err, null);
                that.response.verify();
                done();
            });
        });
        it('should write an empty array for a null result set', function(done) {
            that.response.expects("send").once().withArgs([]);
            ResponseWriter.renderResults( that.response.object, null, function(err) {
                assert.equal(err, null);
                that.response.verify();
                done();
            });
        });
        it('should write an empty array for an empty result set', function(done) {
            that.response.expects("send").once().withArgs([]);
            ResponseWriter.renderResults( that.response.object, [], function(err) {
                assert.equal(err, null);
                that.response.verify();
                done();
            });
        });
    });
    describe('RAW', function() {
        var ResponseWriter= require('../lib/response_renderers/raw')
        it('should respond with an text/plain mimetype', function(done) {
            that.response.expects("set").once().withArgs({'Content-Type': 'text/plain' });
            ResponseWriter.renderResults( that.response.object, [], function(err) {
                assert.equal(err, null);
                that.response.verify();
                done();
            });
        });
        it('should write an empty string for a null result set', function(done) {
            that.response.expects("send").never();
            that.response.expects("write").never();
            that.response.expects("end").once();
            ResponseWriter.renderResults( that.response.object, null, function(err) {
                assert.equal(err, null);
                that.response.verify();
                done();
            });
        });
        it('should write an empty string for an empty result set', function(done) {
            that.response.expects("send").never();
            that.response.expects("write").never();
            that.response.expects("end").once();
            ResponseWriter.renderResults( that.response.object, [], function(err) {
                assert.equal(err, null);
                that.response.verify();
                done();
            });
        });
    });    
})
