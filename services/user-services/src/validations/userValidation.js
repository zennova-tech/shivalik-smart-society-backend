const { check, param } = require('express-validator');

exports.testUserApi = [
    check('firstName').not().isEmpty().withMessage('First Name is requied'),
];

exports.sendPhoneOtp = [
    check('countryCode').not().isEmpty().withMessage('Country code is requied'),
    check('phoneNumber').not().isEmpty().withMessage('Phone Number is requied'),
];
