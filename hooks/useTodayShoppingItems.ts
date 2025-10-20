import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { withTimeout } from '@/utils/loadingOptimization';

export interface TodayShoppingItem {
  id: string;
  family_id: string;
  name: string;
  category: string;
  quantity?: string;
  completed: boolean;
  added_by: string;
  created_at: string;
  updated_at: string;
  creator_profile?: {
    name: string;
    avatar_url?: string;
  };
}

interface UseTodayShoppingItemsReturn {
  items: TodayShoppingItem[];
  loading: boolean;
  error: string | null;
  refreshItems: () => Promise<void>;
}

export const useTodayShoppingItems = (): UseTodayShoppingItemsReturn => {
  const [items, setItems] = useState<TodayShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { currentFamily } = useFamily();

  // Helper function to check if a date is today
  const isToday = (dateString: string): boolean => {
    const itemDate = new Date(dateString);
    const today = new Date();
    
    return (
      itemDate.getDate() === today.getDate() &&
      itemDate.getMonth() === today.getMonth() &&
      itemDate.getFullYear() === today.getFullYear()
    );
  };

  // Load today's shopping items from database
  const loadItems = useCallback(async () => {
    if (!currentFamily || !user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const { data, error: itemsError } = await withTimeout(
        supabase
          .from('shopping_items')
          .select(`
            *,
            creator_profile:profiles!added_by (
              name,
              avatar_url
            )
          `)
          .eq('family_id', currentFamily.id)
          .order('created_at', { ascending: false }),
        10000,
        'Failed to load today\'s shopping items'
      );

      if (itemsError) throw itemsError;

      // Filter items that were created today
      const todayItems = (data || []).filter(item => isToday(item.created_at));
      setItems(todayItems);
    } catch (error: any) {
      console.error('Error loading today\'s shopping items:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [currentFamily, user]);

  // Refresh items
  const refreshItems = useCallback(async () => {
    await loadItems();
  }, [loadItems]);

  // Load items on mount and when dependencies change
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    items,
    loading,
    error,
    refreshItems,
  };
};
