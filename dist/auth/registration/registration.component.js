"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationComponent = void 0;
const core_1 = require("@angular/core");
const forms_1 = require("@angular/forms");
const validations_1 = require("../../validations");
const user_model_1 = require("src/app/models/user.model");
let RegistrationComponent = /** @class */ (() => {
    let RegistrationComponent = class RegistrationComponent {
        constructor(fb) {
            this.fb = fb;
            this.regExpValidations = [
                { error: 'hasNumeric', regExp: '(?=.*[0-9])' },
                { error: 'minLength', regExp: '(?=.{8,})' }
            ];
            this.toLogin = new core_1.EventEmitter();
            this.registration = new core_1.EventEmitter();
            this.userForm = this.fb.group({
                name: ['', [forms_1.Validators.required, forms_1.Validators.minLength(5)]],
                email: ['', [forms_1.Validators.required, forms_1.Validators.email]],
                password1: ['', [forms_1.Validators.required, validations_1.checkRegExp(this.regExpValidations)]],
                password2: ['', [forms_1.Validators.required, validations_1.checkRegExp(this.regExpValidations)]]
            }, { validators: validations_1.areTheyEqual('password1', 'password2') });
        }
        ngOnInit() { }
        navigateToLogin() {
            this.toLogin.emit();
        }
        doRegistration() {
            let user = new user_model_1.User(this.userForm.value.name, this.userForm.value.email, this.userForm.value.password2);
            this.registration.emit(user);
        }
        displayPasswordError(userForm) {
            if (userForm.invalid && userForm.touched && userForm.value.password1.length && userForm.value.password2.length && userForm.errors) {
                if (userForm.errors.areTheyEqual) {
                    return true;
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }
        }
    };
    __decorate([
        core_1.Output()
    ], RegistrationComponent.prototype, "toLogin", void 0);
    __decorate([
        core_1.Output()
    ], RegistrationComponent.prototype, "registration", void 0);
    RegistrationComponent = __decorate([
        core_1.Component({
            selector: 'app-registration',
            templateUrl: './registration.component.html',
            styleUrls: ["./registration.component.css"]
        })
    ], RegistrationComponent);
    return RegistrationComponent;
})();
exports.RegistrationComponent = RegistrationComponent;
