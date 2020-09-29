"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginComponent = void 0;
const core_1 = require("@angular/core");
const credentials_1 = require("src/app/models/credentials");
let LoginComponent = /** @class */ (() => {
    let LoginComponent = class LoginComponent {
        constructor() {
            this.login = new core_1.EventEmitter();
            this.toRegistration = new core_1.EventEmitter();
            this.forgotPass = new core_1.EventEmitter();
            this.openInfo = new core_1.EventEmitter();
            this.rememberMe = false;
            this.regExpValidations = [
                { error: 'hasNumeric', regExp: '(?=.*[0-9])' },
                { error: 'minLength', regExp: '(?=.{8,})' }
            ];
        }
        ngOnInit() {
            this.checkRememberMe();
        }
        checkRememberMe() {
            this.email = localStorage.getItem("email") || "";
            if (this.email.length > 0) {
                this.rememberMe = true;
            }
        }
        doLogin() {
            let credentials = new credentials_1.Credentials(this.email, this.password);
            this.login.emit(credentials);
        }
        navigateToRegistration() {
            this.toRegistration.emit();
        }
        recoverPassword() {
            this.forgotPass.emit();
        }
        setRememberMe(rememberMe = this.rememberMe, email = this.email) {
            if (rememberMe) {
                localStorage.setItem("email", email);
            }
            else {
                localStorage.removeItem("email");
            }
        }
        showInfo(param) {
            this.openInfo.emit(param);
        }
    };
    __decorate([
        core_1.Output()
    ], LoginComponent.prototype, "login", void 0);
    __decorate([
        core_1.Output()
    ], LoginComponent.prototype, "toRegistration", void 0);
    __decorate([
        core_1.Output()
    ], LoginComponent.prototype, "forgotPass", void 0);
    __decorate([
        core_1.Output()
    ], LoginComponent.prototype, "openInfo", void 0);
    LoginComponent = __decorate([
        core_1.Component({
            selector: "app-login",
            templateUrl: "./login.component.html",
            styleUrls: ["./login.component.css"]
        })
    ], LoginComponent);
    return LoginComponent;
})();
exports.LoginComponent = LoginComponent;
