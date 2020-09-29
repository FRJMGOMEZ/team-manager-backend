"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalsAuthResolverService = void 0;
const core_1 = require("@angular/core");
const rxjs_1 = require("rxjs");
let ModalsAuthResolverService = /** @class */ (() => {
    let ModalsAuthResolverService = class ModalsAuthResolverService {
        constructor(router, routesBreadcrumbs) {
            this.router = router;
            this.routesBreadcrumbs = routesBreadcrumbs;
        }
        resolve(route, state) {
            const { previousUrl } = this.routesBreadcrumbs.getNavStart();
            if (state.url.includes("modals:forgotPass)")) {
                if (previousUrl === "/auth/login" || previousUrl === "/auth") {
                    return rxjs_1.of(undefined);
                }
                else {
                    this.router.navigate([{ outlets: { modals: null, primary: "**" } }]);
                    return rxjs_1.EMPTY;
                }
            }
            else if (state.url.includes("(modals:resetPass)")) {
                if (previousUrl === "/auth/login(modals:forgotPass)") {
                    return rxjs_1.of(undefined);
                }
                else {
                    this.router.navigate([{ outlets: { modals: null, primary: "**" } }]);
                    return rxjs_1.EMPTY;
                }
            }
            else {
                this.router.navigate([{ outlets: { modals: null, primary: "**" } }]);
                return rxjs_1.EMPTY;
            }
        }
    };
    ModalsAuthResolverService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], ModalsAuthResolverService);
    return ModalsAuthResolverService;
})();
exports.ModalsAuthResolverService = ModalsAuthResolverService;
