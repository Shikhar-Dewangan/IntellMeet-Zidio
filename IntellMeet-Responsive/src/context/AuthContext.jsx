import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("intellmeet_user")) || null; }
    catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem("intellmeet_user", JSON.stringify(user));
    else localStorage.removeItem("intellmeet_user");
  }, [user]);

  const login = async (email, password) => {
    if (!email || !password) throw new Error("Email and password are required.");
    const nextUser = { id: "demo-user", name: email.split("@")[0], email, role: "Member" };
    setUser(nextUser);
    return nextUser;
  };

  const signup = async (name, email, password) => {
    if (!name || !email || !password) throw new Error("All fields are required.");
    const nextUser = { id: crypto.randomUUID(), name, email, role: "Member" };
    setUser(nextUser);
    return nextUser;
  };

  const logout = () => setUser(null);

  return <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
    {children}
  </AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
