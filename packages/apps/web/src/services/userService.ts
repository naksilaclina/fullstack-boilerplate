const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
}

interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

interface UserServiceResponse<T> {
  data: T;
  message: string;
}

/**
 * Get all users
 */
export async function getUsers(accessToken: string): Promise<UserServiceResponse<User[]>> {
  const response = await fetch(`${API_BASE_URL}/dashboard/users`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    // Provide more descriptive error messages
    if (response.status === 401) {
      throw new Error("Authentication required. Please login first.");
    } else if (response.status === 403) {
      throw new Error("Access denied. You don't have permission to view users.");
    } else if (response.status === 429) {
      throw new Error("Too many requests. Please try again later.");
    }
    throw new Error(error.error || "Failed to fetch users. Please try again later.");
  }

  return await response.json();
}

/**
 * Get a specific user by ID
 */
export async function getUser(id: string, accessToken: string): Promise<UserServiceResponse<User>> {
  const response = await fetch(`${API_BASE_URL}/dashboard/users/${id}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    // Provide more descriptive error messages
    if (response.status === 401) {
      throw new Error("Authentication required. Please login first.");
    } else if (response.status === 403) {
      throw new Error("Access denied. You don't have permission to view this user.");
    } else if (response.status === 404) {
      throw new Error("User not found.");
    } else if (response.status === 429) {
      throw new Error("Too many requests. Please try again later.");
    }
    throw new Error(error.error || "Failed to fetch user. Please try again later.");
  }

  return await response.json();
}

/**
 * Create a new user
 */
export async function createUser(userData: CreateUserRequest, accessToken: string): Promise<UserServiceResponse<User>> {
  const response = await fetch(`${API_BASE_URL}/dashboard/users`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    // Provide more descriptive error messages
    if (response.status === 400) {
      throw new Error("Please fill in all required fields correctly.");
    } else if (response.status === 401) {
      throw new Error("Authentication required. Please login first.");
    } else if (response.status === 403) {
      throw new Error("Access denied. You don't have permission to create users.");
    } else if (response.status === 409) {
      throw new Error("A user with this email already exists.");
    } else if (response.status === 429) {
      throw new Error("Too many requests. Please try again later.");
    }
    throw new Error(error.error || "Failed to create user. Please try again later.");
  }

  return await response.json();
}

/**
 * Update an existing user
 */
export async function updateUser(id: string, userData: UpdateUserRequest, accessToken: string): Promise<UserServiceResponse<User>> {
  const response = await fetch(`${API_BASE_URL}/dashboard/users/${id}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    // Provide more descriptive error messages
    if (response.status === 400) {
      throw new Error("Please fill in all required fields correctly.");
    } else if (response.status === 401) {
      throw new Error("Authentication required. Please login first.");
    } else if (response.status === 403) {
      throw new Error("Access denied. You don't have permission to update this user.");
    } else if (response.status === 404) {
      throw new Error("User not found.");
    } else if (response.status === 409) {
      throw new Error("A user with this email already exists.");
    } else if (response.status === 429) {
      throw new Error("Too many requests. Please try again later.");
    }
    throw new Error(error.error || "Failed to update user. Please try again later.");
  }

  return await response.json();
}

/**
 * Delete a user
 */
export async function deleteUser(id: string, accessToken: string): Promise<UserServiceResponse<null>> {
  const response = await fetch(`${API_BASE_URL}/dashboard/users/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    // Provide more descriptive error messages
    if (response.status === 401) {
      throw new Error("Authentication required. Please login first.");
    } else if (response.status === 403) {
      throw new Error("Access denied. You don't have permission to delete this user.");
    } else if (response.status === 404) {
      throw new Error("User not found.");
    } else if (response.status === 409) {
      throw new Error("Cannot delete this user. This user has associated data.");
    } else if (response.status === 429) {
      throw new Error("Too many requests. Please try again later.");
    }
    throw new Error(error.error || "Failed to delete user. Please try again later.");
  }

  return await response.json();
}