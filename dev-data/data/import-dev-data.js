const mongoose = require('mongoose');
const fs = require('node:fs');
const dotenv = require('dotenv');

const Tour = require('./../../models/tours-model');
const asyncWrapper = require('../../middleware/asyncWrapper');
dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB work');
  });
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'),
);

// import data to db
const importData = asyncWrapper(async () => {
  await Tour.create(tours);
  console.log('data successfully loaded ');
  process.exit();
});

// Delete all data from collection
const deleteAll = asyncWrapper(async () => {
  await Tour.deleteMany();
  console.log('Delete all data successfully');
  process.exit();
});
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteAll();
}
