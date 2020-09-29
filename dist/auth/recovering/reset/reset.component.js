"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetComponent = void 0;
const core_1 = require("@angular/core");
const forms_1 = require("@angular/forms");
const validations_1 = require("../../../validations");
let ResetComponent = /** @class */ (() => {
    let ResetComponent = class ResetComponent {
        constructor(fb) {
            this.fb = fb;
            this.regExpValidations = [
                { error: 'hasNumeric', regExp: '(?=.*[0-9])' },
                { error: 'minLength', regExp: '(?=.{8,})' }
            ];
            this.reset = new core_1.EventEmitter();
            this.hide = new core_1.EventEmitter();
            this.resetForm = this.fb.group({
                resetCode: ['', [forms_1.Validators.required]],
                password1: ['', [forms_1.Validators.required, validations_1.checkRegExp(this.regExpValidations)]],
                password2: ['', [forms_1.Validators.required, validations_1.checkRegExp(this.regExpValidations)]],
            }, { validators: validations_1.areTheyEqual('password1', 'password2') });
        }
        hideModal() {
            this.hide.emit();
        }
        displayPasswordError(resetForm) {
            if (resetForm.invalid && resetForm.touched && resetForm.value.password1.length && resetForm.value.password2.length && resetForm.errors) {
                if (resetForm.errors.areTheyEqual) {
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
        changePass() {
            console.log('To change pass');
            this.reset.emit({ password: this.resetForm.value.password2, resetCode: this.resetForm.value.resetCode });
        }
    };
    __decorate([
        core_1.Output()
    ], ResetComponent.prototype, "reset", void 0);
    __decorate([
        core_1.Output()
    ], ResetComponent.prototype, "hide", void 0);
    ResetComponent = __decorate([
        core_1.Component({
            selector: 'app-reset',
            templateUrl: './reset.component.html',
            styleUrls: ['./reset.component.scss']
        })
    ], ResetComponent);
    return ResetComponent;
})();
exports.ResetComponent = ResetComponent;
