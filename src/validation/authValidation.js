import {check} from 'express-validator/check';
import {transValidation} from './../../lang/vi';
let register = [
    check('email',transValidation.EMAIL_INCORRECT).isEmail().trim(),
    check('gender',transValidation.GENDER_INCORRECT).isIn(['male','female']),
    check('password',transValidation.PASSWORD_INCORRECT).isLength({min:8})
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}$/),
    check('PASSWORD_CONFIRM_INCORRECT',transValidation.PASSWORD_CONFIRM_INCORRECT)
    .custom((value,{req})=>{
        return value === req.body.password
    })
]
export default {
    register
}