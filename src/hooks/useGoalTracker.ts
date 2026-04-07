import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, format, subMonths } from "date-fns";

interface MonthlyGoal {
  id?: string;
  month: string;
  sales_target: number;
  orders_target: number;
  customers_target: number;
  sales_actual: number;
  orders_actual: number;
  customers_actual: number;
}

export function useGoalTracker(currentSales: number, currentOrders: number, currentCustomers: number) {
  const [currentGoal, setCurrentGoal] = useState<MonthlyGoal | null>(null);
  const [history, setHistory] = useState<MonthlyGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const fetchCurrentGoal = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("monthly_goals" as any)
        .select("*")
        .eq("month", currentMonth)
        .maybeSingle();

      if (data) {
        setCurrentGoal(data as any);
      } else {
        // Create default goal for current month
        const { data: newGoal, error } = await supabase
          .from("monthly_goals" as any)
          .insert({ month: currentMonth } as any)
          .select()
          .single();
        if (newGoal) {
          setCurrentGoal(newGoal as any);
        } else {
          // If insert fails (e.g. RLS), use defaults
          console.warn("Could not create monthly goal:", error?.message);
          setCurrentGoal({
            month: currentMonth,
            sales_target: 100000,
            orders_target: 50,
            customers_target: 20,
            sales_actual: 0,
            orders_actual: 0,
            customers_actual: 0,
          });
        }
      }
    } catch (e) {
      // Fallback to defaults
      setCurrentGoal({
        month: currentMonth,
        sales_target: 100000,
        orders_target: 50,
        customers_target: 20,
        sales_actual: 0,
        orders_actual: 0,
        customers_actual: 0,
      });
    }
  }, [currentMonth]);

  const fetchHistory = useCallback(async () => {
    const twelveMonthsAgo = format(startOfMonth(subMonths(new Date(), 12)), "yyyy-MM-dd");
    const { data } = await supabase
      .from("monthly_goals" as any)
      .select("*")
      .gte("month", twelveMonthsAgo)
      .lt("month", currentMonth)
      .order("month", { ascending: false });
    if (data) setHistory(data as any);
  }, [currentMonth]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchCurrentGoal(), fetchHistory()]);
      setLoading(false);
    }
    init();
  }, [fetchCurrentGoal, fetchHistory]);

  // Update actual values when dashboard data changes
  useEffect(() => {
    if (!currentGoal?.id) return;
    supabase
      .from("monthly_goals" as any)
      .update({
        sales_actual: currentSales,
        orders_actual: currentOrders,
        customers_actual: currentCustomers,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", currentGoal.id)
      .then();
  }, [currentSales, currentOrders, currentCustomers, currentGoal?.id]);

  const updateTarget = useCallback(async (field: "sales_target" | "orders_target" | "customers_target", value: number) => {
    if (!currentGoal?.id) return;
    const { data } = await supabase
      .from("monthly_goals" as any)
      .update({ [field]: value, updated_at: new Date().toISOString() } as any)
      .eq("id", currentGoal.id)
      .select()
      .single();
    if (data) setCurrentGoal(data as any);
  }, [currentGoal?.id]);

  return {
    currentGoal,
    history,
    loading,
    updateTarget,
    refetch: () => Promise.all([fetchCurrentGoal(), fetchHistory()]),
  };
}
