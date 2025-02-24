export class AuthManager {
  static isAuthenticated() {
    return !!localStorage.getItem("token");
  }

  static getToken() {
    return localStorage.getItem("token");
  }

  static getUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  static logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  }

  static updateUser(userData) {
    localStorage.setItem("user", JSON.stringify(userData));
  }

  static isAdmin() {
    const user = this.getUser();
    return user && user.role === "admin";
  }
}
