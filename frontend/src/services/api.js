const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const STORAGE_KEY = "fc_auth";

const getToken = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw).token || null;
  } catch {
    return null;
  }
};

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const value = query.toString();
  return value ? `?${value}` : "";
};

const request = async (path, options = {}) => {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.auth ? { Authorization: `Bearer ${getToken()}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || data.error || "Request failed");
  }

  return data;
};

export const authApi = {
  signup(payload) {
    return request("/auth/signup", {
      method: "POST",
      body: payload,
    });
  },

  login(payload) {
    return request("/auth/login", {
      method: "POST",
      body: payload,
    });
  },
};

export const freelancerApi = {
  createProfile(payload) {
    return request("/freelancer/profile", {
      method: "POST",
      auth: true,
      body: payload,
    });
  },

  search(params) {
    return request(`/freelancer/search${buildQuery(params)}`, {
      auth: true,
    });
  },

  getProfile(id) {
    return request(`/freelancer/profile/${id}`, {
      auth: true,
    });
  },

  updateProfile(id, payload) {
    return request(`/freelancer/profile/${id}`, {
      method: "PUT",
      auth: true,
      body: payload,
    });
  },

  deleteProfile(id) {
    return request(`/freelancer/profile/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },

  getSchedule(id, params) {
    return request(`/freelancer/${id}/schedule${buildQuery(params)}`, {
      auth: true,
    });
  },

  setAvailability(payload) {
    return request("/freelancer/availability", {
      method: "POST",
      auth: true,
      body: payload,
    });
  },

  getAvailability(id, params) {
    return request(`/freelancer/${id}/availability${buildQuery(params)}`, {
      auth: true,
    });
  },
};

export const bookingApi = {
  requestBooking(payload) {
    return request("/bookings/request", {
      method: "POST",
      auth: true,
      body: payload,
    });
  },

  getAll() {
    return request("/bookings", {
      auth: true,
    });
  },

  getByCustomer(customerId) {
    return request(`/bookings/customer/${customerId}`, {
      auth: true,
    });
  },

  getById(id) {
    return request(`/bookings/${id}`, {
      auth: true,
    });
  },

  accept(id, payload) {
    return request(`/bookings/${id}/accept`, {
      method: "PATCH",
      auth: true,
      body: payload,
    });
  },

  updateCustomerPrice(id, payload) {
    return request(`/bookings/${id}/customer-price`, {
      method: "PATCH",
      auth: true,
      body: payload,
    });
  },

  updateFreelancerPrice(id, payload) {
    return request(`/bookings/${id}/freelancer-price`, {
      method: "PATCH",
      auth: true,
      body: payload,
    });
  },

  reject(id) {
    return request(`/bookings/${id}/reject`, {
      method: "PATCH",
      auth: true,
    });
  },

  complete(id) {
    return request(`/bookings/${id}/complete`, {
      method: "PATCH",
      auth: true,
    });
  },

  cancel(id) {
    return request(`/bookings/${id}/cancel`, {
      method: "PATCH",
      auth: true,
    });
  },
};

export const reviewApi = {
  create(payload) {
    return request("/reviews", {
      method: "POST",
      auth: true,
      body: payload,
    });
  },

  getByFreelancer(freelancerId) {
    return request(`/reviews/freelancer/${freelancerId}`, {
      auth: true,
    });
  },

  getAverage(freelancerId) {
    return request(`/reviews/freelancer/${freelancerId}/average`, {
      auth: true,
    });
  },
};

export const optionsApi = {
  locations() {
    return request("/options/locations");
  },

  skills() {
    return request("/options/skills");
  },

  availability() {
    return request("/options/availability");
  },
};
