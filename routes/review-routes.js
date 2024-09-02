const express = require('express');
const multer = require('multer');

// controllers
const authController = require('../controller/authController');
const reviewController = require('../controller/reviewController');

const router = express.Router();

const upload = multer();

router
  .route('/')
  .get(authController.protect, reviewController.getAllReviews)
  .post(upload.none(), authController.protect, reviewController.createReview);

module.exports = router;
