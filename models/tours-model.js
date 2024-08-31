const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourScehma = new mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must have less or equal 40 character'],
      minLength: [10, 'A tour name must have less or equal 10 character'],
      // validate: [
      //   validator.isAlpha,
      //   'A tour name must only container characters',
      // ],
    },
    slug: { type: String },
    duration: { type: Number, required: [true, 'A tour must have a duration'] },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a max group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, require: [true, 'A tour must have a price'] },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (value) {
          // this for current document not working with update
          return value < this.price; //100<200
        },
        message: 'Discount price ({VALUE}) should be less than regular price',
      },
    },
    discount: { type: Number },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: { type: String, trim: true },
    imgCover: {
      type: String,
      require: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: { type: Date, default: Date.now() },
    startDates: [Date],
    secretTour: { type: Boolean, default: false },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);
tourScehma.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
// // document middleware: run before .save() and .create() but not on insertMany() and findByIdAndUpdate()
tourScehma.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
// // document middleware:run after it has access to document and next
// tourScehma.post('save', function (doc, next) {
//   console.log(doc, 'finish doecumen');
//   next();
// });
// query middleware
// tourScehma.pre('find', function (next) {
//   this.find({ secretTour: { $ne: true } });
//   console.log('work');
//   next();
// });
// we use middleware cause i wanna find and findOne and all find to work with it
// this regular mean anything start with find
tourScehma.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  console.log('work');
  next();
});

tourScehma.post(/^find/, function (docs, next) {
  this.find({ secretTour: { $ne: true } });
  console.log(`query took ${Date.now() - this.start} millisecond`);
  next();
});
// Aggregation middleware
tourScehma.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline(), 'test');
  next();
});
const Tour = mongoose.model('tour', tourScehma, 'tours');
module.exports = Tour;
