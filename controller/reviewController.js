// utils
const httpStatusText = require('../utils/httpStatusText');
const asyncWrapper = require('../middleware/asyncWrapper');

// model
const Review = require('../models/review-model');

exports.getAllReviews = asyncWrapper(async (req, res, next) => {
  const reviews = await Review.find();
  res.status(200).json({ status: httpStatusText.SUCCESS, reviews });
});

// create review
exports.createReview = asyncWrapper(async (req, res, next) => {
  const newReview = await Review.create(req.body);
  res.status(201).json({ status: httpStatusText.SUCCESS, review: newReview });
});
