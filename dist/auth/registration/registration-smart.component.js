"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationSmartComponent = void 0;
const core_1 = require("@angular/core");
let RegistrationSmartComponent = /** @class */ (() => {
    let RegistrationSmartComponent = class RegistrationSmartComponent {
        constructor(userService, router, ar) {
            this.userService = userService;
            this.router = router;
            this.ar = ar;
        }
        registration(user) {
            this.userService.postUser(user).subscribe(() => {
                this.router.navigate(['login'], { relativeTo: this.ar.parent });
            });
        }
        navigateToLogin() {
            this.router.navigate(['login'], { relativeTo: this.ar.parent });
        }
    };
    RegistrationSmartComponent = __decorate([
        core_1.Component({
            selector: 'app-registration-smart',
            template: `
      
    <app-registration  (toLogin)="navigateToLogin()" (registration)="registration($event)" > </app-registration>
    
    `
        })
    ], RegistrationSmartComponent);
    return RegistrationSmartComponent;
})();
exports.RegistrationSmartComponent = RegistrationSmartComponent;
