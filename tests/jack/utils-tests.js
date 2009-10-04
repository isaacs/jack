var assert = require("test/assert"),
    Utils = require("jack/utils"),
    MockRequest = require("jack/mock").MockRequest,
    File = require("file"),
    ByteIO = require("io").ByteIO;


// specify "should return nil if content type is not multipart" do
exports.testNotMultipart = function() {
    var env = MockRequest.envFor(null, "/", { "CONTENT_TYPE" : "application/x-www-form-urlencoded" });
    assert.isNull(Utils.parseMultipart(env));
}

// specify "should parse multipart upload with text file" do
exports.testMultipart = function() {
    var env = MockRequest.envFor(null, "/", multipartFixture("text"));
    var params = Utils.parseMultipart(env);
    
    assert.isEqual("Larry", params["submit-name"]);
    assert.isEqual("text/plain", params["files"]["type"]);
    assert.isEqual("file1.txt", params["files"]["filename"]);
    assert.isEqual(
        "Content-Disposition: form-data; " +
        "name=\"files\"; filename=\"file1.txt\"\r\n" +
        "Content-Type: text/plain\r\n",
        params["files"]["head"]);
    assert.isEqual("files", params["files"]["name"]);
    //assert.isEqual("contents", params["files"]["tempfile"]);
}

//specify "should parse multipart upload with nested parameters" do

exports.testMultipartNested = function() {
    var env = MockRequest.envFor(null, "/", multipartFixture("nested"))
    var params = Utils.parseMultipart(env);
    
    assert.isEqual("Larry", params["foo"]["submit-name"]);
    assert.isEqual("text/plain", params["foo"]["files"]["type"]);
    assert.isEqual("file1.txt", params["foo"]["files"]["filename"]);
    assert.isEqual(
        "Content-Disposition: form-data; " +
        "name=\"foo[files]\"; filename=\"file1.txt\"\r\n" +
        "Content-Type: text/plain\r\n",
        params["foo"]["files"]["head"]);
    assert.isEqual("foo[files]", params["foo"]["files"]["name"]);
    assert.isEqual("contents\n", File.read(params["foo"]["files"]["tempfile"]));
    // TODO updated this test to add "\n" -- this is probably not the best behavior
}

// specify "should parse multipart upload with binary file" do
exports.testMultipartBinaryFile = function() {
    var env = MockRequest.envFor(null, "/", multipartFixture("binary"));
    var params = Utils.parseMultipart(env);
    
    assert.isEqual("Larry", params["submit-name"]);
    assert.isEqual("image/png", params["files"]["type"]);
    assert.isEqual("rack-logo.png", params["files"]["filename"]);
    assert.isEqual(
        "Content-Disposition: form-data; " +
        "name=\"files\"; filename=\"rack-logo.png\"\r\n" +
        "Content-Type: image/png\r\n",
        params["files"]["head"]);
    assert.isEqual("files", params["files"]["name"]);
    assert.isEqual(26473, File.read(params["files"]["tempfile"], "b").length);
}

// specify "should parse multipart upload with empty file" do
exports.testMultipartEmptyFile = function() {
    var env = MockRequest.envFor(null, "/", multipartFixture("empty"));
    var params = Utils.parseMultipart(env);
    
    assert.isEqual("Larry", params["submit-name"]);
    assert.isEqual("text/plain", params["files"]["type"]);
    assert.isEqual("file1.txt", params["files"]["filename"]);
    assert.isEqual(
        "Content-Disposition: form-data; " +
        "name=\"files\"; filename=\"file1.txt\"\r\n" +
        "Content-Type: text/plain\r\n",
        params["files"]["head"]);
    assert.isEqual("files", params["files"]["name"]);
    assert.isEqual("", File.read(params["files"]["tempfile"]));
}

// specify "should not include file params if no file was selected" do
exports.testMultipartNoFile = function() {
    var env = MockRequest.envFor(null, "/", multipartFixture("none"));
    var params = Utils.parseMultipart(env);
    
    assert.isEqual("Larry", params["submit-name"]);
    assert.isEqual(params["files"], ""); // this behavior changes with the new parser
    //params.keys.should.not.include "files"
}

// specify "should parse IE multipart upload and clean up filename" do
exports.testMultipartIEFile = function() {
    var env = MockRequest.envFor(null, "/", multipartFixture("ie"));
    var params = Utils.parseMultipart(env);
    
    assert.isEqual("text/plain", params["files"]["type"]);
    assert.isEqual("file1.txt", params["files"]["filename"]);
    assert.isEqual(
        "Content-Disposition: form-data; " +
        "name=\"files\"; " +
        'filename="C:\\Documents and Settings\\Administrator\\Desktop\\file1.txt"' +
        "\r\nContent-Type: text/plain\r\n",
        params["files"]["head"]);
    assert.isEqual("files", params["files"]["name"]);
    assert.isEqual("contents", File.read(params["files"]["tempfile"], "b").decodeToString());
}

function multipartFixture(name) {
    var file = multipartFile(name);
    var data = File.read(file, 'rb');
    
    var type = "multipart/form-data; boundary=AaB03x";
    var length = data.length;

    return {
        "CONTENT_TYPE" : type,
        "CONTENT_LENGTH" : length.toString(10),
        "jsgi.input" : new ByteIO(data)
    }
}

function multipartFile(name) {
    return File.join(File.dirname(module.path), "multipart", name);
}

if (require.main === module.id)
    require("test/runner").run(exports);