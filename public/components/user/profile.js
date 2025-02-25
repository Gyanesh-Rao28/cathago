export class UserProfile {
  constructor(container) {
    this.container = container;
  }

  async render() {
    const userData = await this.fetchUserData();

    // console.log(userData.profile.scans.length);

    this.container.innerHTML = `
            <div class="bg-white shadow rounded-lg p-6 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold">User Profile</h2>
                    <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        Credits: ${userData.profile.credits}
                    </span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-gray-600">Username</p>
                        <p class="font-semibold">${
                          userData.profile.username
                        }</p>
                    </div>
                    <div>
                        <p class="text-gray-600">Total Scans</p>
                        <p class="font-semibold">${
                          userData.profile.scans.length || 0
                        }</p>
                    </div>
                </div>
            </div>
        `;
  }

  async fetchUserData() {
    try {
      const response = await fetch("/api/auth/user/profile", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error("Error fetching user data:", error);
      return {};
    }
  }
}
