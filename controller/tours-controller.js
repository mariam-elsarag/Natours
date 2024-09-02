const express = require('express');

const app = express();
app.use(express.json());
const Tour = require('../models/tours-model');

const httpStatusText = require('../utils/httpStatusText');
const asynWrapper = require('../middleware/asyncWrapper');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingAverage,price';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};
exports.getTours = asynWrapper(async (req, res, next) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    page: +req.query.page,
    data: { tours },
  });
});
exports.getTourDetails = asynWrapper(async (req, res, next) => {
  const { id } = req.params;
  // const tour = await Tour.findOne({__id:tourId});
  const tour = await Tour.findById(id);
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  res.status(200).json({ status: 'sucess', data: { tour } });
});
exports.addNewTour = asynWrapper(async (req, res) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({ status: httpStatusText.SUCCESS, data: newTour });
});
exports.updateTour = asynWrapper(async (req, res, next) => {
  const tourId = req.params.id;
  const tour = await Tour.findById(tourId);
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  // const updatedTour = await Tour.updateOne(tour, req.body);
  const updatedTour = await Tour.findByIdAndUpdate(
    tourId,
    { ...req.body },
    { new: true, runValidators: true },
  );
  res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { tour: updatedTour } });
});
exports.deleteTour = asynWrapper(async (req, res, next) => {
  const tourId = req.params.id;
  const tour = await Tour.findByIdAndDelete(tourId);
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  res.status(204).json({ status: httpStatusText.SUCCESS, data: null });
});

exports.getTourStats = asynWrapper(async (req, res, next) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    { $sort: { avgPrice: 1 } },
  ]);
  // for refrence
  // { $match: { _id: { $ne: 'EASY' } } },
  res.status(200).json({ status: httpStatusText.SUCCESS, data: stats });
});
exports.getMonthlyPlan = asynWrapper(async (req, res, next) => {
  const year = +req.params.year;
  const plan = await Tour.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numToursStart: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    { $project: { _id: 0 } },
    { $sort: { numToursStart: -1 } },
    { $limit: 12 },
  ]);
  res.status(200).json({ status: httpStatusText.SUCCESS, data: plan });
});
