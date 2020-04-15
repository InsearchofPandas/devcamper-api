const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors')
const connectDB = require('./config/db')


// Load env vars
dotenv.config({ path: './config/config.env'});

// Connect to database
connectDB();

// Route files
const bootcamps = require('./routes/bootcamps');

const app = express();

// Body Parser
app.use(express.json())


// Dev logging middleware
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'))
}


// Mount routers
app.use('/api/v1/bootcamps', bootcamps);



const PORT = process.env.PORT || 5000;


const server = app.listen(PORT, console.log(`Server up and running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold));

// Handle unhandled promise rejections

process.on('unhandledRejection', (error, promise) => {
    console.log(`Error: ${error.message}`.red);  
    // Close server & exit process
    server.close(() => process.exit(1));
});
