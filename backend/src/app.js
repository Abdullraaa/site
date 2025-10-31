const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('un533n API is running...');
});

// Define routes
app.use('/api/products', require('./api/routes/products'));
app.use('/api/orders', require('./api/routes/orders'));
app.use('/api/users', require('./api/routes/users'));

module.exports = app;