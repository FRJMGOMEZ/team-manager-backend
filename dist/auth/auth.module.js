"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const core_1 = require("@angular/core");
const common_1 = require("@angular/common");
const login_component_1 = require("./login/login.component");
const router_1 = require("@angular/router");
const password_validator_directive_1 = require("./password-validator.directive");
const forms_1 = require("@angular/forms");
const http_1 = require("@angular/common/http");
const login_smart_component_1 = require("./login/login-smart.component");
const registration_smart_component_1 = require("./registration/registration-smart.component");
const registration_component_1 = require("./registration/registration.component");
const pipes_module_1 = require("../pipes/pipes.module");
let authRoutes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login', component: login_smart_component_1.LoginSmartComponent,
    },
    {
        path: 'registration', component: registration_smart_component_1.RegistrationSmartComponent
    }
];
let AuthModule = /** @class */ (() => {
    let AuthModule = class AuthModule {
    };
    AuthModule = __decorate([
        core_1.NgModule({
            declarations: [
                login_component_1.LoginComponent,
                login_smart_component_1.LoginSmartComponent,
                password_validator_directive_1.PasswordDirective,
                registration_smart_component_1.RegistrationSmartComponent,
                registration_component_1.RegistrationComponent
            ],
            imports: [
                common_1.CommonModule,
                router_1.RouterModule.forChild(authRoutes),
                forms_1.FormsModule,
                http_1.HttpClientModule,
                forms_1.ReactiveFormsModule,
                pipes_module_1.PipesModule
            ]
        })
    ], AuthModule);
    return AuthModule;
})();
exports.AuthModule = AuthModule;
