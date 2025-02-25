import { AdminDashboard } from "../components/admin/dashboard.js";

// Check if user is admin and load admin dashboard if they are
export async function checkAdminAndLoadDashboard(container) {
  try {
    // Get user info from API
    const response = await fetch("/api/auth/user/profile", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    const userData = await response.json();

    // Check if user is admin
    if (userData.profile && userData.profile.role === "admin") {
      // User is admin, load the admin dashboard
      const adminDashboard = new AdminDashboard(container);
      await adminDashboard.initialize();
      return true;
    }

    // User is not admin
    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}
