// review rating createa at ref to tour and user
const mongoose = require('mongoose');
const reviewScema = new mongoose.Schema({
  ratting: {
    type: [Number, 'Rate must be a number'],
    max: 5,
    min: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  review: {
    type: String,
    require: [true, "Review can't be empty"],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'user',
  },
  book: {
    type: mongoose.Schema.ObjectId,
    ref: 'tour',
  },
});

const Review = mongoose.model('Review', reviewScema, 'Reviews');
module.exports = Review;
