const Bootcamp = require('../models/Bootcamp')

// DESC   Get all of the bootcamps
// ROUTE  GET /api/v1/bootcamps
// ACCESS Public
exports.getBootcamps =  async (req, res, next) => {
    try {
        const bootcamps = await Bootcamp.find();

        res.status(200).json({ success: true, data: bootcamps})
    } catch (error) {
        res.status(400).json({ success: false})
        
    }

    res.status(200).json({success: true, msg: 'Show all the bootcamps' });
};


// DESC   Get single bootcamp
// ROUTE  GET /api/v1/bootcamps/:id
// ACCESS Public
exports.getBootcamp = (req, res, next) => {
    res.status(200).json({success: true, msg: `Display bootcamp ${req.params.id}` });
};


// DESC   Create new bootcamp
// ROUTE  POST /api/v1/bootcamps
// ACCESS Private
exports.createBootcamp = async (req, res, next) => {
    try {
        const bootcamp = await Bootcamp.create(req.body)
    res.status(201).json({success: true, data: bootcamp });

    } catch (error) {
        res.status(400).json({success: false, error: error})
    }



   
};


// DESC   Update bootcamp
// ROUTE  PUT /api/v1/bootcamps/id
// ACCESS Private
exports.updateBootcamp = (req, res, next) => {
    res.status(200).json({success: true, msg: `Update bootcamp ${req.params.id}` });
};


// DESC   Delete bootcamp
// ROUTE  DELETE /api/v1/bootcamps/id
// ACCESS Private
exports.deleteBootcamp = (req, res, next) => {
    res.status(200).json({success: true, msg: `Delete bootcamp ${req.params.id}` });
};