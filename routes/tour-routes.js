const express = require('express');
const multer = require('multer');
const router = express.Router();
const tourController = require('../controller/tours-controller');
const validation = require('../middleware/tour-validation');
const authController = require('../controller/authController');
// for parsing form data
const upload = multer();

// param middleware
// router.param('id', tourController.checkId);
// I will use middleware to help me to filter before working with query in gerTours
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(upload.none(), tourController.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect, tourController.getTours)
  .post(upload.none(), validation.validation, tourController.addNewTour);

router
  .route('/:id')
  .get(tourController.getTourDetails)
  .patch(upload.none(), tourController.updateTour)
  .delete(tourController.deleteTour);
module.exports = router;
