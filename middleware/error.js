  const ErrorResponse = require('../utils/errorResponse')
  
  const errorHandler =  (err, req, res, next) => {
    let error = {...err}

    error.message = err.message
    
    // Log to console for dev
    console.log(err)
    
    // Mongoose bad ObjectId
    if(err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`
        error = new ErrorResponse(message, 404);
    }

    // Mongoose duplicate key
    if(err.code === 11000) {
        const message  = `Duplicate input field value. Please check field ${Object.keys(err.keyValue)} with a value of ${Object.values(err.keyValue)}.`;
        error = new  ErrorResponse(message, 400)
    }

    // Mongoose  empty required field
    if(err.name === 'ValidatorError' ) {
        const message = err.message
        error = new ErrorResponse(message, 400)
    }

    res.status(error.statusCode || 500 ).json({
        sucess: false,
        error: error.message ||  'Server Error'
    })
  }

  module.exports = errorHandler