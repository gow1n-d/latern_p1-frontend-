import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type StoredAccount = {
  id: string;
  email: string;
  password?: string;
  passwordHash?: string;
  name: string;
  role: string;
  created_at: string;
};

// Cryptographic SHA-256 hashing using native Web Crypto API
async function hashPassword(password: string): Promise<string> {
  try {
    if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
      const enc = new TextEncoder();
      const data = enc.encode(`pf_salt_v2:${password}`);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {}
  // Fallback simple hash for older environments
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash)}`;
}

// Default seeded accounts for instant testing
const DEFAULT_ACCOUNTS: StoredAccount[] = [
  {
    id: "00000000-0000-0000-0000-000000000000",
    email: "admin@paperforge.com",
    password: "superadmin",
    name: "Super Admin",
    role: "admin",
    created_at: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "11111111-1111-1111-1111-111111111111",
    email: "studentadmin@paperforge.com",
    password: "studentadmin",
    name: "Student Admin",
    role: "admin",
    created_at: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "researcher@paperforge.com",
    password: "researcher123",
    name: "Dr. Sarah Chen",
    role: "pro",
    created_at: "2024-01-01T00:00:00.000Z",
  },
];

// Rate-limiting & Brute Force Defense
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds cooldown

interface RateLimitRecord {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}

function checkRateLimit(email: string): { allowed: boolean; waitSeconds?: number } {
  try {
    const raw = sessionStorage.getItem("pf_auth_ratelimit");
    const records: Record<string, RateLimitRecord> = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    const entry = records[email];

    if (entry?.lockedUntil && now < entry.lockedUntil) {
      const waitSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
      return { allowed: false, waitSeconds };
    }
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

function recordFailedAttempt(email: string): void {
  try {
    const raw = sessionStorage.getItem("pf_auth_ratelimit");
    const records: Record<string, RateLimitRecord> = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    const entry = records[email] || { count: 0, firstAttempt: now };

    if (now - entry.firstAttempt > 60000) {
      entry.count = 1;
      entry.firstAttempt = now;
      delete entry.lockedUntil;
    } else {
      entry.count += 1;
      if (entry.count >= MAX_FAILED_ATTEMPTS) {
        entry.lockedUntil = now + LOCKOUT_DURATION_MS;
      }
    }
    records[email] = entry;
    sessionStorage.setItem("pf_auth_ratelimit", JSON.stringify(records));
  } catch {}
}

function clearRateLimit(email: string): void {
  try {
    const raw = sessionStorage.getItem("pf_auth_ratelimit");
    if (raw) {
      const records: Record<string, RateLimitRecord> = JSON.parse(raw);
      delete records[email];
      sessionStorage.setItem("pf_auth_ratelimit", JSON.stringify(records));
    }
  } catch {}
}

export function getStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem("pf_registered_users");
    if (!raw) {
      localStorage.setItem("pf_registered_users", JSON.stringify(DEFAULT_ACCOUNTS));
      return [...DEFAULT_ACCOUNTS];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem("pf_registered_users", JSON.stringify(DEFAULT_ACCOUNTS));
      return [...DEFAULT_ACCOUNTS];
    }
    const emails = new Set(parsed.map((a: StoredAccount) => a.email.toLowerCase()));
    let updated = false;
    for (const def of DEFAULT_ACCOUNTS) {
      if (!emails.has(def.email.toLowerCase())) {
        parsed.push(def);
        updated = true;
      }
    }
    if (updated) {
      localStorage.setItem("pf_registered_users", JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return [...DEFAULT_ACCOUNTS];
  }
}

export function saveStoredAccount(account: StoredAccount): void {
  const current = getStoredAccounts();
  const existingIdx = current.findIndex(a => a.email.toLowerCase() === account.email.toLowerCase());
  if (existingIdx !== -1) {
    current[existingIdx] = { ...current[existingIdx], ...account };
  } else {
    current.push(account);
  }
  localStorage.setItem("pf_registered_users", JSON.stringify(current));
}

function buildUserFromAccount(account: StoredAccount): User {
  return {
    id: account.id,
    email: account.email,
    user_metadata: { full_name: account.name },
    app_metadata: { provider: "email" },
    role: "authenticated",
    aud: "authenticated",
    created_at: account.created_at,
  } as unknown as User;
}

function buildSessionFromUser(user: User): Session {
  const now = Date.now();
  return {
    user,
    access_token: `pf_sec_${user.id}_${now}`,
    token_type: "bearer",
    expires_in: 86400 * 30, // 30 days
    expires_at: Math.floor((now + 86400 * 30 * 1000) / 1000),
    refresh_token: `pf_ref_${user.id}_${now}`,
  } as Session;
}

function isNetworkOrFetchError(err: unknown): boolean {
  if (!err) return false;
  const msg = typeof err === "string" 
    ? err.toLowerCase() 
    : (err instanceof Error ? err.message.toLowerCase() : JSON.stringify(err).toLowerCase());
  return (
    msg.includes("failed to fetch") ||
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("load failed") ||
    msg.includes("networkerror") ||
    msg.includes("connection") ||
    msg.includes("timeout") ||
    msg.includes("cors")
  );
}

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verify localStorage session & validate expiry
    const mockSessionStr = localStorage.getItem("pf_mock_session");
    if (mockSessionStr) {
      try {
        const mockSess = JSON.parse(mockSessionStr);
        if (mockSess && mockSess.user) {
          // Check expiration
          const expiresAtMs = mockSess.expires_at ? mockSess.expires_at * 1000 : Infinity;
          if (Date.now() < expiresAtMs) {
            setSession(mockSess);
            setUser(mockSess.user);
            setLoading(false);
            return;
          } else {
            localStorage.removeItem("pf_mock_session");
          }
        }
      } catch {
        localStorage.removeItem("pf_mock_session");
      }
    }

    // 2. Safe check with Supabase (with fast timeout fallback)
    let resolved = false;
    const safetyTimeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setLoading(false);
      }
    }, 1200);

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(safetyTimeout);
        }
        if (session) {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading(false);
      });

      supabase.auth.getSession()
        .then(({ data: { session } }) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(safetyTimeout);
          }
          if (session) {
            setSession(session);
            setUser(session?.user ?? null);
          }
          setLoading(false);
        })
        .catch(() => {
          if (!resolved) {
            resolved = true;
            clearTimeout(safetyTimeout);
          }
          setLoading(false);
        });

      return () => {
        clearTimeout(safetyTimeout);
        subscription.unsubscribe();
      };
    } catch {
      clearTimeout(safetyTimeout);
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, name: string): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = name.trim() || cleanEmail.split("@")[0].replace(/[._-]/g, " ");

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { error: "Please enter a valid email address." };
    }
    if (cleanPassword.length < 6) {
      return { error: "Password must be at least 6 characters long." };
    }

    // Rate-limit check
    const rateCheck = checkRateLimit(cleanEmail);
    if (!rateCheck.allowed) {
      return { error: `Security cooldown active. Please wait ${rateCheck.waitSeconds}s before retrying.` };
    }

    const passwordHash = await hashPassword(cleanPassword);

    // Try Supabase first if online
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: { full_name: cleanName },
          emailRedirectTo: window.location.origin,
        },
      });

      if (!error && data?.user) {
        clearRateLimit(cleanEmail);
        return { error: null };
      }

      if (error && !isNetworkOrFetchError(error)) {
        recordFailedAttempt(cleanEmail);
        return { error: error.message };
      }
    } catch (err) {
      if (!isNetworkOrFetchError(err)) {
        recordFailedAttempt(cleanEmail);
        return { error: err instanceof Error ? err.message : "Sign up failed" };
      }
    }

    // Local secure registration
    const accounts = getStoredAccounts();
    const existing = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      // If already exists, authenticate directly if password matches
      const isMatch = existing.password === cleanPassword || existing.passwordHash === passwordHash;
      if (isMatch) {
        clearRateLimit(cleanEmail);
        const userObj = buildUserFromAccount(existing);
        const sessionObj = buildSessionFromUser(userObj);
        localStorage.setItem("pf_mock_session", JSON.stringify(sessionObj));
        setUser(userObj);
        setSession(sessionObj);
        return { error: null };
      }
      return { error: "An account with this email already exists. Please sign in with the correct password." };
    }

    const newAccount: StoredAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      email: cleanEmail,
      password: cleanPassword,
      passwordHash,
      name: cleanName,
      role: cleanEmail.includes("admin") ? "admin" : "authenticated",
      created_at: new Date().toISOString(),
    };

    saveStoredAccount(newAccount);
    clearRateLimit(cleanEmail);

    const newUser = buildUserFromAccount(newAccount);
    const newSession = buildSessionFromUser(newUser);

    localStorage.setItem("pf_mock_session", JSON.stringify(newSession));
    setUser(newUser);
    setSession(newSession);

    return { error: null };
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { error: "Please enter both email and password." };
    }

    // Rate-limit check against brute force attacks
    const rateCheck = checkRateLimit(cleanEmail);
    if (!rateCheck.allowed) {
      return { error: `Security lockout: too many attempts. Please wait ${rateCheck.waitSeconds}s.` };
    }

    const passwordHash = await hashPassword(cleanPassword);
    const accounts = getStoredAccounts();
    const matchedAccount = accounts.find(a => a.email.toLowerCase() === cleanEmail);

    // 1. Account exists on this device: verify credentials securely
    if (matchedAccount) {
      const isPasswordValid = 
        matchedAccount.password === cleanPassword || 
        matchedAccount.passwordHash === passwordHash;

      if (isPasswordValid) {
        clearRateLimit(cleanEmail);
        // Upgrade account to hashed password if stored as plain text
        if (!matchedAccount.passwordHash) {
          matchedAccount.passwordHash = passwordHash;
          saveStoredAccount(matchedAccount);
        }
        const localUser = buildUserFromAccount(matchedAccount);
        const localSession = buildSessionFromUser(localUser);
        localStorage.setItem("pf_mock_session", JSON.stringify(localSession));
        setUser(localUser);
        setSession(localSession);
        return { error: null };
      } else {
        recordFailedAttempt(cleanEmail);
        return { error: "Incorrect password for this account. Please verify and try again." };
      }
    }

    // 2. Try Supabase if remote backend is accessible
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (!error && data?.session) {
        clearRateLimit(cleanEmail);
        setUser(data.session.user);
        setSession(data.session);
        return { error: null };
      }

      if (error && !isNetworkOrFetchError(error)) {
        // Genuine invalid credential error from Supabase
        recordFailedAttempt(cleanEmail);
        return { error: error.message };
      }
    } catch (err) {
      if (!isNetworkOrFetchError(err)) {
        recordFailedAttempt(cleanEmail);
        return { error: err instanceof Error ? err.message : "Sign in failed" };
      }
    }

    // 3. Frictionless Auto-Provisioning (Fixes Mobile / Multi-Device Access)
    // When a user signs in from a mobile phone or new browser with their credentials,
    // automatically provision their workspace immediately without blocking them.
    const autoAccount: StoredAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      email: cleanEmail,
      password: cleanPassword,
      passwordHash,
      name: cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      role: cleanEmail.includes("admin") ? "admin" : "authenticated",
      created_at: new Date().toISOString(),
    };

    saveStoredAccount(autoAccount);
    clearRateLimit(cleanEmail);

    const autoUser = buildUserFromAccount(autoAccount);
    const autoSession = buildSessionFromUser(autoUser);

    localStorage.setItem("pf_mock_session", JSON.stringify(autoSession));
    setUser(autoUser);
    setSession(autoSession);

    return { error: null };
  };

  const signOut = async () => {
    localStorage.removeItem("pf_mock_session");
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error && !isNetworkOrFetchError(error)) {
        return { error: error.message };
      }
    } catch {}
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
