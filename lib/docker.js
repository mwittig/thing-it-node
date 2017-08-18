module.exports = {
    container: container,
    getImage: getImage,
    download: download,
    update: update
};

var Docker = require('dockerode');
var docker = new Docker({socketPath: '/var/run/docker.sock'});
var q = require('q');
var request = require('request');

const os = require('os');

function container(){
    if (docker) {
        return docker.getContainer("tin");
    }else{
        return null;
    }
}

function getImage(version){

    var deferred = q.defer();

    docker.listImages(function (error, images){

        var imageName = "thingit/thing-it-node:" + getImageTag(version);

        for (var i=0; i<images.length; i++) {
            if (images[i].RepoTags && images[i].RepoTags[0] == imageName) {
                console.info("Image " + imageName + " already available on host.");
                return deferred.resolve(images[i]);
            }
        }

        console.info("Image " + imageName + " ist not available on host.");
        return deferred.resolve();

    }.bind(this));

    return deferred.promise;
}

function download(url, version, state){

    var deferred = q.defer();

    var get = request.get(url + "/tin/images/" + getImageTag(version), function (error, response, body) {

    }.bind(this));

    get.on('data', function(data) {
        var json = data.toString('utf8');
        state.progress = json;
        console.info(json);
    }.bind(this));

    get.on('error', function(error) {
        console.error(error);
    }.bind(this));

    get.on('end', function() {
        console.info("Download completed.");
        return deferred.resolve();
    }.bind(this));


    return deferred.promise;
}

function update(url, version){

    console.info("TIN Image " + getImageTag(version) + " available. Upgrading TIN container ...");

    var updateTinUrl = url + "/tin/container/" + getImageTag(version);

    request.put(updateTinUrl, function (error, response, body) {

        if (error) {
            console.error('error:', error);
        }else{
            console.log('statusCode:', response && response.statusCode);
            console.log('body:', body);
        }

    }.bind(this));

}

function getImageTag(version){

    if (os.arch() == "arm"){
        return version + "-armv7-boron";
    }else{
        return version + "-x86-jessie";
    }
}