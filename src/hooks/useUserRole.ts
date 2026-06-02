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

    const fetchRoles = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      if (data) {
        setRoles(data.map((r) => r.role as AppRole));
      }
      setLoading(false);
    };

    fetchRoles();
  }, [user]);

  const isAdmin = roles.includes("admin") || user?.email === "admin@paperforge.com";
  const isStudentAdmin = user?.email === "studentadmin@paperforge.com";
  const isPro = roles.includes("pro") || isAdmin || isStudentAdmin; // Admin and StudentAdmin get pro access
  const hasFullAccess = isAdmin || isStudentAdmin;

  return { roles, loading, isAdmin, isPro, hasFullAccess };
}
