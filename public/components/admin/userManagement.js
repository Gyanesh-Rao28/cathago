import { api } from "../../js/api-service.js";

export class UserManagement {
  constructor(container) {
    this.container = container;
    this.isLoading = false;
    this.users = [];
  }

  async render() {
    this.container.innerHTML = `
            <div class="bg-white shadow rounded-lg overflow-hidden">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h2 class="text-xl font-bold">User Management</h2>
                        <button id="refreshUsersBtn" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                            Refresh
                        </button>
                    </div>
                </div>
                
                <div id="usersLoadingIndicator" class="text-center py-8">
                    <div class="inline-block loading"></div>
                    <p class="mt-2 text-gray-500">Loading users...</p>
                </div>
                
                <div id="usersContent" class="hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="usersTableBody" class="bg-white divide-y divide-gray-200">
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div id="usersError" class="hidden text-center py-8 text-red-500">
                    <p>Failed to load users. <button id="retryUsersBtn" class="text-indigo-600 hover:underline">Retry</button></p>
                </div>
                
                <div id="noUsersMessage" class="hidden text-center py-8 text-gray-500">
                    <p>No users found.</p>
                </div>
            </div>
            
            <!-- User Actions Modal -->
            <div id="userActionsModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <div class="bg-white rounded-lg max-w-md w-full p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-medium" id="modalTitle">User Actions</h3>
                        <button class="close-modal text-gray-400 hover:text-gray-500">
                            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div id="modalContent" class="mb-4">
                        <!-- Content will be dynamically added -->
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button class="close-modal px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            Cancel
                        </button>
                        <button id="confirmActionBtn" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        `;

    this.attachEventListeners();
    await this.loadUsers();
  }

  attachEventListeners() {
    // Refresh button
    this.container
      .querySelector("#refreshUsersBtn")
      .addEventListener("click", () => this.loadUsers());

    // Retry button
    this.container
      .querySelector("#retryUsersBtn")
      .addEventListener("click", () => this.loadUsers());

    // User actions (delegation)
    this.container
      .querySelector("#usersTableBody")
      .addEventListener("click", (e) => {
        const target = e.target.closest("button");
        if (!target) return;

        const userId = target.dataset.userId;
        if (!userId) return;

        if (target.classList.contains("promote-btn")) {
          this.showPromoteModal(userId);
        } else if (target.classList.contains("delete-btn")) {
          this.showDeleteModal(userId);
        } else if (target.classList.contains("reset-credits-btn")) {
          this.showResetCreditsModal(userId);
        }
      });

    // Modal close buttons
    this.container.querySelectorAll(".close-modal").forEach((btn) => {
      btn.addEventListener("click", () => this.closeModal());
    });

    // Confirm action button
    this.container
      .querySelector("#confirmActionBtn")
      .addEventListener("click", () => {
        const action =
          this.container.querySelector("#confirmActionBtn").dataset.action;
        const userId =
          this.container.querySelector("#confirmActionBtn").dataset.userId;

        if (action === "promote") {
          this.promoteUser(userId);
        } else if (action === "delete") {
          this.deleteUser(userId);
        } else if (action === "reset-credits") {
          this.resetUserCredits(userId);
        }
      });
  }

  async loadUsers() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.container
      .querySelector("#usersLoadingIndicator")
      .classList.remove("hidden");
    this.container.querySelector("#usersContent").classList.add("hidden");
    this.container.querySelector("#usersError").classList.add("hidden");
    this.container.querySelector("#noUsersMessage").classList.add("hidden");

    try {
      // Try to fetch from API
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Check if API request was successful
      if (response.ok) {
        const data = await response.json();
        this.users = data.users || [];
      } else {
        // Use mock data if API endpoint doesn't exist yet
        console.warn(
          "API endpoint not found. Using mock data for development."
        );
        this.users = [
          {
            id: 1,
            username: "admin",
            role: "admin",
            credits: 20,
            documentCount: 2,
          },
          {
            id: 2,
            username: "testuser",
            role: "user",
            credits: 15,
            documentCount: 3,
          },
          {
            id: 3,
            username: "newuser",
            role: "user",
            credits: 20,
            documentCount: 0,
          },
        ];
      }

      this.container
        .querySelector("#usersLoadingIndicator")
        .classList.add("hidden");

      if (!Array.isArray(this.users) || this.users.length === 0) {
        this.users = []; // Ensure users is always an array
        this.container
          .querySelector("#noUsersMessage")
          .classList.remove("hidden");
        return;
      }

      this.renderUsers();
      this.container.querySelector("#usersContent").classList.remove("hidden");
    } catch (error) {
      console.error("Error loading users:", error);

      // Fallback to mock data on error
      this.users = [
        {
          id: 1,
          username: "admin",
          role: "admin",
          credits: 20,
          documentCount: 2,
        },
        {
          id: 2,
          username: "testuser",
          role: "user",
          credits: 15,
          documentCount: 3,
        },
        {
          id: 3,
          username: "newuser",
          role: "user",
          credits: 20,
          documentCount: 0,
        },
      ];

      this.renderUsers();
      this.container.querySelector("#usersContent").classList.remove("hidden");
      this.container
        .querySelector("#usersLoadingIndicator")
        .classList.add("hidden");
    } finally {
      this.isLoading = false;
    }
  }

  renderUsers() {
    const tbody = this.container.querySelector("#usersTableBody");

    tbody.innerHTML = this.users
      .map((user) => {
        const isAdmin = user.role === "admin";

        return `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${user.username}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          isAdmin
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-gray-100 text-gray-800"
                        }">
                            ${user.role}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${user.credits}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${user.documentCount || 0}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex space-x-2">
                            ${
                              !isAdmin
                                ? `<button data-user-id="${user.id}" class="promote-btn text-indigo-600 hover:text-indigo-900">
                                    Promote
                                </button>`
                                : ""
                            }
                            <button data-user-id="${
                              user.id
                            }" class="reset-credits-btn text-green-600 hover:text-green-900">
                                Reset Credits
                            </button>
                            ${
                              !isAdmin
                                ? `<button data-user-id="${user.id}" class="delete-btn text-red-600 hover:text-red-900">
                                    Delete
                                </button>`
                                : ""
                            }
                        </div>
                    </td>
                </tr>
            `;
      })
      .join("");
  }

  showPromoteModal(userId) {
    const user = this.users.find((u) => u.id.toString() === userId);
    if (!user) return;

    const modal = this.container.querySelector("#userActionsModal");
    const modalTitle = this.container.querySelector("#modalTitle");
    const modalContent = this.container.querySelector("#modalContent");
    const confirmBtn = this.container.querySelector("#confirmActionBtn");

    modalTitle.textContent = "Promote User";
    modalContent.innerHTML = `
            <p>Are you sure you want to promote <strong>${user.username}</strong> to admin?</p>
            <p class="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
        `;

    confirmBtn.textContent = "Promote";
    confirmBtn.dataset.action = "promote";
    confirmBtn.dataset.userId = userId;

    modal.classList.remove("hidden");
  }

  showDeleteModal(userId) {
    const user = this.users.find((u) => u.id.toString() === userId);
    if (!user) return;

    const modal = this.container.querySelector("#userActionsModal");
    const modalTitle = this.container.querySelector("#modalTitle");
    const modalContent = this.container.querySelector("#modalContent");
    const confirmBtn = this.container.querySelector("#confirmActionBtn");

    modalTitle.textContent = "Delete User";
    modalContent.innerHTML = `
            <p>Are you sure you want to delete <strong>${user.username}</strong>?</p>
            <p class="text-sm text-red-500 mt-2">This action cannot be undone and will delete all user data including documents and scan history.</p>
        `;

    confirmBtn.textContent = "Delete";
    confirmBtn.classList.remove("bg-indigo-600", "hover:bg-indigo-700");
    confirmBtn.classList.add("bg-red-600", "hover:bg-red-700");
    confirmBtn.dataset.action = "delete";
    confirmBtn.dataset.userId = userId;

    modal.classList.remove("hidden");
  }

  showResetCreditsModal(userId) {
    const user = this.users.find((u) => u.id.toString() === userId);
    if (!user) return;

    const modal = this.container.querySelector("#userActionsModal");
    const modalTitle = this.container.querySelector("#modalTitle");
    const modalContent = this.container.querySelector("#modalContent");
    const confirmBtn = this.container.querySelector("#confirmActionBtn");

    modalTitle.textContent = "Reset Credits";
    modalContent.innerHTML = `
            <p>Are you sure you want to reset <strong>${user.username}</strong>'s credits to 20?</p>
            <p class="text-sm text-gray-500 mt-2">Current credits: ${user.credits}</p>
        `;

    confirmBtn.textContent = "Reset Credits";
    confirmBtn.classList.remove("bg-red-600", "hover:bg-red-700");
    confirmBtn.classList.add("bg-indigo-600", "hover:bg-indigo-700");
    confirmBtn.dataset.action = "reset-credits";
    confirmBtn.dataset.userId = userId;

    modal.classList.remove("hidden");
  }

  closeModal() {
    const modal = this.container.querySelector("#userActionsModal");
    modal.classList.add("hidden");
  }

  async promoteUser(userId) {
    try {
      const response = await fetch(`/api/admin/users/${userId}/promote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to promote user");
      }

      // Update local data and UI
      await this.loadUsers();
      this.closeModal();
      this.showToast("User promoted to admin successfully");
    } catch (error) {
      console.error("Error promoting user:", error);
      this.showToast("Failed to promote user: " + error.message, "error");
    }
  }

  async deleteUser(userId) {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      // Update local data and UI
      await this.loadUsers();
      this.closeModal();
      this.showToast("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      this.showToast("Failed to delete user: " + error.message, "error");
    }
  }

  async resetUserCredits(userId) {
    console.log(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-credits`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to reset credits");
      }

      // Update local data and UI
      await this.loadUsers();
      this.closeModal();
      this.showToast("User credits reset successfully");
    } catch (error) {
      console.error("Error resetting credits:", error);
      this.showToast("Failed to reset credits: " + error.message, "error");
    }
  }

  showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg ${
      type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"
    }`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  refresh() {
    this.loadUsers();
  }
}
