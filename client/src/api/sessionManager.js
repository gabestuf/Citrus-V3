// API Imports
import { signOutUser } from "./firebase";
import { RouteManager } from "./routeManager";
import { DBManager } from "./db/dbManager";
import { Debugger } from "./debugger";

const sessionManagerDebugger = new Debugger(Debugger.controllerObjects.SESSIONMANAGER);

/**
 * SessionManager is a tool for interfacing with the browser's localStorage.
 * Keeps page data consistent even after a redirect
 * Allows us to limit DB calls
 */
export class SessionManager {

    /**
     * Get user object saved in localStorage
     * @returns user object or null
     */
    static getUser() {
        return JSON.parse(localStorage.getItem("citrus:user"));
    }

    /**
     * Set user object saved in localStorage
     */
    static setUser(user) {
        localStorage.setItem("citrus:user", JSON.stringify(user));
    }

    /**
     * Get UserManager for current user
     * @returns UserManager for current user in LocalStorage
     */
    static getCurrentUserManager() {
        const id = this.getUserId(); // Get user ID from LS
        if (id) {
            return DBManager.getUserManager(id);
        }
        sessionManagerDebugger.logWithPrefix("Couldn't find a current user Id. Redirecting to /login!'");
        return null;
    }

    /**
     * Get user id from user in localstorage
     * @returns user id or null
     */
    static getUserId() {
        const user = JSON.parse(localStorage.getItem("citrus:user"));
        return user ? user.uid : null;
    }

    /**
     * Get profile picture URL saved in localStorage
     * @returns profile picture URL or empty string
     */
    static getPfpUrl() {
        return localStorage.getItem("citrus:pfpUrl") ? localStorage.getItem("citrus:pfpUrl") : "";
    }

    /**
     * Set profile picture URL saved in localStorage
     */
    static setPfpUrl(pfpUrl) {
        localStorage.setItem("citrus:pfpUrl", pfpUrl);
    }

    /**
     * Get display name saved in localStorage
     * @returns display name or empty string
     */
    static getDisplayName() {
        return localStorage.getItem("citrus:displayName") ? localStorage.getItem("citrus:displayName") : "";
    }

    /**
     * Set display name saved in localStorage
     */
    static setDisplayName(displayName) {
        localStorage.setItem("citrus:displayName", displayName);
    }

    /**
     * Get phone number saved in localStorage
     * @returns phone number or empty string
     */
    static getPhoneNumber() {
        return localStorage.getItem("citrus:phoneNumber") ? localStorage.getItem("citrus:phoneNumber") : "";
    }

    /**
     * Set phone number saved in localStorage
     */
    static setPhoneNumber(phoneNumber) {
        localStorage.setItem("citrus:phoneNumber", phoneNumber);
    }

    /**
    * Get debug mode setting saved in localStorage
    * @returns debug mode setting
    */
    static getDebugMode() {
        return JSON.parse(localStorage.getItem("citrus:debug"));
    }

    /**
    * Set debug mode setting saved in localStorage
    */
    static setDebugMode(debugMode) {
        localStorage.setItem("citrus:debug", JSON.stringify(debugMode));
    }

    /**
     * Check whether or not a user is saved in LS
     * @returns whether or not there is a user stored in LS
     */
    static userInLS() {
        return localStorage.getItem("citrus:user") ? true : false;
    }



    /**
     * Checks whether a user is completely signed in based on whether or not they have a display name
     * @returns whether or not the user has completed signin process
     */
    static userFullySignedIn() {
        const user = SessionManager.getUser();
        if (user) {
            if (user.displayName === null) {
              return false;
            } else {
              return true;
            }
          } else {
            return false;
        }
    }

    /**
     * Clear all citrus related localstorage keys
     */
    static clearLS() {
        localStorage.removeItem("citrus:user");
        localStorage.removeItem("citrus:debug");
        localStorage.removeItem("citrus:pfpUrl");
        localStorage.removeItem("citrus:displayName");
        localStorage.removeItem("citrus:currentUserManager");
    }

    /**
     * Get a JSON representation of current citrus localStorage.
     * This is for debugging
     * @returns JSON representation of localStorage
     */
    static getJSON() {
        return {
            user: this.getUser(),
            pfpUrl: this.getPfpUrl(),
            displayName: this.getDisplayName(),
            debugMode: this.getDebugMode(),
            userId: this.getUserId(),
            currentUserManager: this.getCurrentUserManager()
        }
    }

    /**
     * Completely sign out user with firebase and redirect to /home
     */
    static signOut() {
        signOutUser().then(() => {
            RouteManager.redirect("/home");
        });
    }

    static async reloadUser() {
        return new Promise(async (resolve, reject) => {
            const newUserManager = DBManager.getUserManager(this.getUserId());
            await newUserManager.fetchData();
            this.setCurrentUserManager(newUserManager);
            resolve(newUserManager);
        })
    }
}