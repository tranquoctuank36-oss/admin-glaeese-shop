import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import { Routes } from "@/lib/routes";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://backend.kltn.lol/api/v1";

export type DecodedToken = { exp: number; [k: string]: any };


export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  paramsSerializer: {
    serialize: (params) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Send array as comma-separated string: roles=admin,customer
          if (value.length > 0) {
            searchParams.append(key, value.join(','));
          }
        } else if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      return searchParams.toString();
    },
  },
});


let isRefreshing = false;
let subscribers: Array<(token: string) => void> = [];

const onTokenRefreshed = (token: string) => {
  subscribers.forEach((cb) => cb(token));
  subscribers = [];
};
const addSubscriber = (cb: (token: string) => void) => {
  subscribers.push(cb);
};


const hardLogout = () => {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.setItem("__app:logout", String(Date.now()));
  } catch {}

  delete api.defaults.headers.common.Authorization;

  toast.error("Your session expired, please log in again!", {
    duration: 2000,
    position: "top-center",
  });

  setTimeout(() => {
    window.location.href = Routes.root;
  }, 1500);
};

const isTokenExpired = (token: string, bufferSeconds = 30) => {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    if (!decoded.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now + bufferSeconds;
  } catch {
    return true;
  }
};


// api.interceptors.request.use(async (config) => {
//   let token = localStorage.getItem("token");
//   // const refreshToken = localStorage.getItem("refreshToken");

//   if (!token) return config;

//   if (!isTokenExpired(token)) {
//     if (config.headers) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   }

//   // if (!refreshToken) {
//   //   hardLogout();
//   //   return config;
//   // }

//   if (!isRefreshing) {
//     isRefreshing = true;
//     try {
//       const res = await axios.post(
//         `${API_BASE_URL}/auth/refresh-token`,
//         {},
//         { withCredentials: true }
//       );

//       const newAccessToken =
//         res.data?.accessToken || res.data?.data?.accessToken;
//       const newRefreshToken =
//         res.data?.refreshToken || res.data?.data?.refreshToken;

//       if (!newAccessToken) throw new Error("No new accessToken received");

//       localStorage.setItem("token", newAccessToken);
//       if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);
//       api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
//       token = newAccessToken;

//       onTokenRefreshed(newAccessToken);
//       console.log("Refreshed accessToken successfully!");
//     } catch (err) {
//       hardLogout();
//     } finally {
//       isRefreshing = false;
//     }
//   }

//   return new Promise((resolve) => {
//     addSubscriber((newToken) => {
//       if (config.headers) config.headers.Authorization = `Bearer ${newToken}`;
//       resolve(config);
//     });
//   });
// });


api.interceptors.request.use(async (config) => {
  let token = localStorage.getItem("token");
  if (!token) return config;

  // if token still valid, attach and go
  if (!isTokenExpired(token)) {
    if (config.headers) config.headers.Authorization = `Bearer ${token}`;
    return config;
  }

  // token expired
  if (!isRefreshing) {
    // This request will perform the refresh
    isRefreshing = true;
    try {
      const res = await axios.post(
        `${API_BASE_URL}/auth/refresh-token`,
        {},
        { withCredentials: true }
      );

      const newAccessToken =
        res.data?.accessToken || res.data?.data?.accessToken;
      const newRefreshToken =
        res.data?.refreshToken || res.data?.data?.refreshToken;

      if (!newAccessToken) throw new Error("No new accessToken received");

      localStorage.setItem("token", newAccessToken);
      if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);

      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
      token = newAccessToken;

      // resolve all waiting subscribers
      onTokenRefreshed(newAccessToken);
      console.log("Refreshed accessToken successfully!");
    } catch (err) {
      hardLogout();
      // rethrow or return config without auth so request fails gracefully
      return config;
    } finally {
      isRefreshing = false;
    }

    // IMPORTANT: this is the original request that performed the refresh,
    // attach the new token and continue immediately (don't subscribe).
    if (config.headers) config.headers.Authorization = `Bearer ${token}`;
    return config;
  }

  // If refresh is already in progress, subscribe and wait to be notified
  return new Promise((resolve) => {
    addSubscriber((newToken) => {
      if (config.headers) config.headers.Authorization = `Bearer ${newToken}`;
      resolve(config);
    });
  });
});
