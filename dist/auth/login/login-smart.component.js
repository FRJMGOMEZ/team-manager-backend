"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginSmartComponent = void 0;
const core_1 = require("@angular/core");
let LoginSmartComponent = /** @class */ (() => {
    let LoginSmartComponent = class LoginSmartComponent {
        constructor(demoService, authService, router, ar) {
            this.demoService = demoService;
            this.authService = authService;
            this.router = router;
            this.ar = ar;
            this.rememberMe = false;
        }
        ngOnInit() {
            this.showInfo();
            if (this.authService.userOnline) {
                this.authService.cleanStorage();
            }
        }
        login(credentials) {
            this.authService.login(credentials, this.rememberMe).subscribe((res) => {
                this.router.navigate([""]);
            });
        }
        navigateToRegistration() {
            this.router.navigate(['registration'], { relativeTo: this.ar.parent });
        }
        navigateToForgotModal() {
            this.router.navigate([{ outlets: { modals: ['forgotPass'] } }]);
        }
        showInfo(param) {
            this.demoService.loginPopup(param);
        }
    };
    LoginSmartComponent = __decorate([
        core_1.Component({
            selector: "app-login-smart",
            template: `
   <app-login (login)="login($event)" (toRegistration)="navigateToRegistration()" (forgotPass)="navigateToForgotModal()" (openInfo)="showInfo($event)" > </app-login>
  
  `
        })
    ], LoginSmartComponent);
    return LoginSmartComponent;
})();
exports.LoginSmartComponent = LoginSmartComponent;
