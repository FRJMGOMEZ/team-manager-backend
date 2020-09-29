"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetSmartComponent = void 0;
const core_1 = require("@angular/core");
const sweetalert2_1 = __importDefault(require("sweetalert2"));
let ResetSmartComponent = /** @class */ (() => {
    let ResetSmartComponent = class ResetSmartComponent {
        constructor(ar, router, authService) {
            this.ar = ar;
            this.router = router;
            this.authService = authService;
            this.ar.queryParamMap.subscribe((params) => {
                this.email = params.get('email');
            });
        }
        changePassword({ password, resetCode }) {
            this.authService.setNewPassword(resetCode, password, this.email).subscribe((message) => {
                if (message) {
                    sweetalert2_1.default.fire({
                        type: 'info',
                        text: message,
                        showCloseButton: true
                    }).then(() => {
                        this.router.navigate([{ outlets: { modals: null } }]);
                    });
                }
                else {
                    sweetalert2_1.default.fire({
                        type: 'success',
                        showCloseButton: true,
                        text: 'La contraseña se ha actualizado correctamente'
                    }).then(() => {
                        this.router.navigate([{ outlets: { modals: null } }]);
                    });
                }
            });
        }
        hideModal() {
            this.router.navigate([{ outlets: { modals: null } }]);
        }
    };
    ResetSmartComponent = __decorate([
        core_1.Component({
            selector: 'app-reset-smart',
            template: `
    
            <app-reset (hide)="hideModal()" (reset)="changePassword($event)"> </app-reset>
         
    `
        })
    ], ResetSmartComponent);
    return ResetSmartComponent;
})();
exports.ResetSmartComponent = ResetSmartComponent;
