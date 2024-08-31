// must added first before app
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// for sync like console.log(something i don't have)
// we put it her cause we wanna listion to error in app
process.on('uncaughtException', (err) => {
  console.log('unhandle Exception 🔥');
  console.log(err.name, err.message);
  process.exit(1);
});
dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose.connect(DB).then(() => console.log('Database connection successful'));

// express
// console.log(app.get('env'));
// console.log(process.env);
const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log('listening to port');
});
// unhandeled rejection
process.on('unhandledRejection', (err) => {
  console.log('unhandle Rejection 🔥');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
