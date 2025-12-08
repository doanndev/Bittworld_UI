import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

// Kiểm tra token có hợp lệ không
const isValidToken = (token: string | null) => {
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token) as any;
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Kiểm tra expiration time
    // if (decoded.exp && decoded.exp < currentTime) {
    //   return false;
    // }
    
    return true;
  } catch (error) {
    return false;
  }
};

const useAuthStore = create((set: any) => {
  const savedToken =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  
  // Kiểm tra token có hợp lệ không
  const validToken = isValidToken(savedToken);
  const payloadToken = validToken && savedToken ? jwtDecode(savedToken) : null;

  return {
    token: validToken ? savedToken : null,
    payloadToken,
    isAuthenticated: validToken,

    login: (token: string) => {
      if (!isValidToken(token)) {
        throw new Error('Invalid token');
      }
      const decoded = jwtDecode(token);
      localStorage.setItem("auth_token", token);
      set({ token, payloadToken: decoded, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem("auth_token");
      set({ token: null, payloadToken: null, isAuthenticated: false });
    },

    updateToken: (newToken: string) => {
      if (!isValidToken(newToken)) {
        throw new Error('Invalid token');
      }
      const decoded = jwtDecode(newToken);
      localStorage.setItem("auth_token", newToken);
      set({ token: newToken, payloadToken: decoded });
    },
  };
});

export const useAuth = () => {
  const { token, payloadToken, isAuthenticated, login, logout, updateToken } =
    useAuthStore();

  return { token, payloadToken, isAuthenticated, login, logout, updateToken };
};
