"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OOUtils = void 0;
class OOUtils {
    static copyObject(object) {
        return JSON.parse(JSON.stringify(object));
    }
    static areEquals(obj1, obj2) {
        if (typeof obj1 !== typeof obj2) {
            return false;
        }
        if ((obj1 === undefined && obj2 !== undefined) ||
            (obj1 === undefined && obj1 !== undefined) ||
            (obj1 === null && obj2 !== null) ||
            (obj2 === null && obj1 !== null)) {
            return false;
        }
        if (typeof obj1 === 'object') {
            if (Array.isArray(obj1)) {
                if (!Array.isArray(obj2) || obj1.length !== obj2.length) {
                    return false;
                }
                for (let i = 0; i < obj1.length; i++) {
                    if (!this.areEquals(obj1[i], obj2[i])) {
                        return false;
                    }
                }
            }
            else {
                for (let prop in obj1) {
                    if (obj1.hasOwnProperty(prop)) {
                        if (!obj2.hasOwnProperty(prop)) {
                            return false;
                        }
                        //Endless loop fix for recursive properties
                        if (!this.areEquals(obj1[prop], obj2[prop])) {
                            return false;
                        }
                    }
                }
                for (let prop in obj2) {
                    if (obj2.hasOwnProperty(prop)) {
                        if (!obj1.hasOwnProperty(prop)) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }
        return obj1 === obj2;
    }
    static getObjectDifferences(obj1, obj2) {
        let differences = {};
        Object.keys(obj1).forEach((key1, index) => {
            Object.keys(obj2).forEach((key2) => {
                if (key1 === key2) {
                    if (typeof obj1[key1] === 'object') {
                        if (!OOUtils.areEquals(obj1[key1], obj2[key2])) {
                            differences[key2] = obj2[key2];
                        }
                    }
                    else {
                        if (obj1[key1] != obj2[key2]) {
                            differences[key2] = obj2[key2];
                        }
                    }
                }
            });
        });
        return differences;
    }
    static mergeObjects(initialObj, newObj) {
        initialObj = this.copyObject(initialObj);
        Object.keys(initialObj).forEach((iKey) => {
            Object.keys(newObj).forEach((nKey) => {
                if (iKey === nKey) {
                    initialObj[iKey] = newObj[nKey];
                }
            });
        });
        return initialObj;
    }
    static toQueryString(filters) {
        let queryString = '';
        Object.keys(filters).forEach((key) => {
            if (typeof filters[key] === 'object' && filters[key] !== null && !filters[key].length) {
                Object.keys(filters[key]).forEach((subKey) => {
                    queryString += filters[key][subKey] && filters[key][subKey] != null ? `${queryString ? '&' : '?'}${subKey}=${filters[key][subKey]}` : '';
                });
            }
            else if (filters[key] != null && Array.isArray(filters[key])) {
                queryString += `${queryString ? '&' : '?'}${key}[]=`;
                let arrayParams = '';
                filters[key].forEach((filter, i) => {
                    arrayParams += arrayParams ? `,${filter.toString()}` : `${filter.toString()}`;
                });
                queryString += `${arrayParams}`;
            }
            else {
                queryString += filters[key] && filters[key] != null ? `${queryString ? '&' : '?'}${key}=${filters[key]}` : '';
            }
        });
        return queryString;
    }
}
exports.OOUtils = OOUtils;
