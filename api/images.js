var cv = require('opencv');
var request = require('request');
var q = require('q');

module.exports = {
    countCrop: function (image) {
        var crop = {};

        if (image.width / image.height > config.photoCropFactor) {
            crop.width = image.height * config.photoCropFactor | 0;
            crop.x = (image.width - crop.width) / 2;
            crop.height = image.height;
            crop.y = 0;
        } else {
            crop.width = image.width;
            crop.x = 0;
            crop.height = image.width / config.photoCropFactor | 0;
            crop.y = (image.height - crop.height) / 2;
        }

        return this.loadMatrix(image.src)
            .then(this.findFace)
            .then(function (face) {
                if (face) {
                    var faceCenter = { x: face.x + face.width/2, y: face.y + face.height/2 };
                    var cropCenter = { x: crop.x + crop.width/2, y: crop.y + crop.height/2 };
                    var centersDiff = { x: cropCenter.x - faceCenter.x, y: cropCenter.y - faceCenter.y };

                    if (crop.y === 0) {
                        var newCropX = crop.x - centersDiff.x;

                        if (newCropX < 0) {
                            newCropX = 0
                        } else if (newCropX + crop.width > image.width) {
                            newCropX = image.width - crop.width;
                        }

                        crop.x = newCropX;
                    } else if (crop.x === 0) {
                        var newCropY = crop.y - centersDiff.y;

                        if (newCropY < 0) {
                            newCropY = 0
                        } else if (newCropY + crop.height > image.height) {
                            newCropY = image.height - crop.height;
                        }

                        crop.y = newCropY;
                    }
                }
                image.crop = crop;
                return image;
            });
    },

    findFace: function (img) {
        var deferred = q.defer();

        img.detectObject(cv.FACE_CASCADE, {}, function(err, faces){
            if (err) {
                logger.info('Could not find faces on image', err);
                deferred.reject(err);
            }
            deferred.resolve(faces[0]);
        });

        return deferred.promise;
    },

    loadMatrix: function (url) {
        var deferred = q.defer();
        var imgStream = new cv.ImageDataStream();

        request.get(url).pipe(imgStream);

        imgStream.on('load', function(matrix){
           deferred.resolve(matrix);
        });

        return deferred.promise;
    }
};

