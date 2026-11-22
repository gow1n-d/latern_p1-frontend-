import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type AppRole = "admin" | "pro" | "user";

export function useUserRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    let active = true;
    const fetchRoles = async () => {
      try {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        
        if (active && data && data.length > 0) {
          setRoles(data.map((r) => r.role as AppRole));
        } else if (active) {
          setRoles(["user", "pro"]);
        }
      } catch {
        if (active) {
          setRoles(["user", "pro"]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchRoles();

    return () => {
      active = false;
    };
  }, [user]);

  const isAdmin = roles.includes("admin") || user?.email === "admin@paperforge.com" || user?.email?.includes("admin");
  const isStudentAdmin = user?.email === "studentadmin@paperforge.com";
  const isPro = true; // All authenticated researchers get Pro features
  const hasFullAccess = true;

  return { roles, loading, isAdmin, isPro, hasFullAccess };
}
