const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.test(file.originalname)) {
    return cb(null, true);
  }
  const err = new Error('Only JPG, PNG or WEBP images are allowed.');
  err.code = 'INVALID_FILE_TYPE';
  cb(err);
}

// Multer instance that stores images in the given Cloudinary folder
function createUpload(folder) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: { folder, allowed_formats: ['jpeg', 'jpg', 'png', 'webp'] },
  });
  return multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });
}

// Turn multer errors into 400/413 instead of falling through to the 500 handler
function uploadErrorHandler(err, req, res, next) {
  if (err.code === 'INVALID_FILE_TYPE') return res.status(400).json({ error: err.message });
  if (!(err instanceof multer.MulterError)) return next(err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 5MB.' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Too many files or unexpected file field.' });
  }
  res.status(400).json({ error: err.message });
}

module.exports = { createUpload, uploadErrorHandler };
