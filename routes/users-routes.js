const express = require('express');
const multer = require('multer');
const router = express.Router();
// for parsing form data

const userController = require('../controller/users-controller');
const authController = require('../controller/authController');
const upload = multer();

router.route('/register').post(upload.none(), authController.signup);
router.route('/login').post(upload.none(), authController.login);

router.post('/forgotPassword', upload.none(), authController.forgotPassword);
router.patch(
  '/resetPassword/:token',
  upload.none(),
  authController.resetPassword,
);
router.patch(
  '/change-password',
  upload.none(),
  authController.protect,
  authController.updatePassword,
);
router
  .route('/')
  .get(
    authController.protect,
    authController.restricTo('admin'),
    userController.getAllUsers,
  )
  .post(
    authController.protect,
    authController.restricTo('admin'),
    userController.createUser,
  );

router.patch('/updateMe', authController.protect, userController.updateMe);
router.delete('/deleteMe', authController.protect, userController.deleteMe);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(
    authController.protect,
    authController.restricTo('admin'),
    userController.deleteUser,
  );
module.exports = router;
