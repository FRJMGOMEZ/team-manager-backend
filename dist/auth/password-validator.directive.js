"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordDirective = void 0;
const core_1 = require("@angular/core");
const forms_1 = require("@angular/forms");
let PasswordDirective = /** @class */ (() => {
    var PasswordDirective_1;
    let PasswordDirective = PasswordDirective_1 = class PasswordDirective {
        constructor() {
            this.regExps = [];
        }
        validate(c) {
            return this.checkRegExp(c.value);
        }
        checkRegExp(passwordValue) {
            let passError = null;
            this.regExps.forEach(({ error, regExp }) => {
                let regularExpression = new RegExp(regExp);
                if (!regularExpression.test(passwordValue)) {
                    passError = { [error]: true };
                }
            });
            return passError;
        }
    };
    __decorate([
        core_1.Input()
    ], PasswordDirective.prototype, "regExps", void 0);
    PasswordDirective = PasswordDirective_1 = __decorate([
        core_1.Directive({
            selector: '[appPassword]',
            providers: [
                { provide: forms_1.NG_VALIDATORS, useExisting: core_1.forwardRef(() => PasswordDirective_1), multi: true }
            ]
        })
    ], PasswordDirective);
    return PasswordDirective;
})();
exports.PasswordDirective = PasswordDirective;
