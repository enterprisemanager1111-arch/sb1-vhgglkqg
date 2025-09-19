import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { withTimeout, withRetry } from '@/utils/loadingOptimization';
import { PointsService } from '@/services/pointsService';

export interface ShoppingItem {
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

interface UseFamilyShoppingItemsReturn {
  items: ShoppingItem[];
  loading: boolean;
  error: string | null;
  createItem: (item: Omit<ShoppingItem, 'id' | 'family_id' | 'added_by' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<ShoppingItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleItemCompletion: (id: string) => Promise<void>;
  refreshItems: () => Promise<void>;
  getItemsByCategory: (category: string) => ShoppingItem[];
  getCompletedItems: () => ShoppingItem[];
  getPendingItems: () => ShoppingItem[];
}

export const useFamilyShoppingItems = (): UseFamilyShoppingItemsReturn => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { currentFamily } = useFamily();

  // Load shopping items from database
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
        5000,
        'Failed to load shopping items'
      );

      if (itemsError) throw itemsError;

      setItems(data || []);
    } catch (error: any) {
      console.error('Error loading shopping items:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [currentFamily, user]);

  // Create new shopping item
  const createItem = useCallback(async (itemData: Omit<ShoppingItem, 'id' | 'family_id' | 'added_by' | 'created_at' | 'updated_at'>) => {
    if (!currentFamily || !user) {
      throw new Error('User must be in a family to create shopping items');
    }

    try {
      const { error } = await withRetry(
        () => supabase
          .from('shopping_items')
          .insert([{
            ...itemData,
            family_id: currentFamily.id,
            added_by: user.id,
          }]),
        3,
        1000
      );

      if (error) throw error;

      // Refresh items list
      await loadItems();
    } catch (error: any) {
      console.error('Error creating shopping item:', error);
      throw error;
    }
  }, [currentFamily, user, loadItems]);

  // Update shopping item
  const updateItem = useCallback(async (id: string, updates: Partial<ShoppingItem>) => {
    if (!currentFamily) {
      throw new Error('No active family');
    }

    try {
      const { error } = await supabase
        .from('shopping_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('family_id', currentFamily.id);

      if (error) throw error;

      // Refresh items list
      await loadItems();
    } catch (error: any) {
      console.error('Error updating shopping item:', error);
      throw error;
    }
  }, [currentFamily, loadItems]);

  // Delete shopping item
  const deleteItem = useCallback(async (id: string) => {
    if (!currentFamily) {
      throw new Error('No active family');
    }

    try {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', id)
        .eq('family_id', currentFamily.id);

      if (error) throw error;

      // Refresh items list
      await loadItems();
    } catch (error: any) {
      console.error('Error deleting shopping item:', error);
      throw error;
    }
  }, [currentFamily, loadItems]);

  // Toggle item completion
  const toggleItemCompletion = useCallback(async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item || !user) return;

    const wasCompleted = item.completed;
    
    // Only allow marking as completed, not uncompleting
    if (wasCompleted) {
      console.log('Shopping item is already completed, cannot undo');
      return;
    }
    
    const newCompletedState = true;
    
    await updateItem(id, { completed: newCompletedState });
    
    // Award points when item is completed
    if (currentFamily && user) {
      try {
        await PointsService.awardShoppingCompletion(
          currentFamily.id,
          user.id,
          item.id,
          item.name,
          item.category
        );
      } catch (error) {
        console.error('Error awarding points for shopping item completion:', error);
      }
    }
  }, [items, updateItem, currentFamily, user]);

  // Auto-cleanup completed items after 24 hours
  const cleanupCompletedItems = useCallback(async () => {
    if (!currentFamily) return;

    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('family_id', currentFamily.id)
        .eq('completed', true)
        .lt('updated_at', twentyFourHoursAgo.toISOString());

      if (error) {
        console.error('Error cleaning up completed shopping items:', error);
      } else {
        console.log('Cleaned up shopping items older than 24 hours');
        // Don't call loadItems here to avoid infinite loop
        // The real-time subscription will handle refreshing the data
      }
    } catch (error) {
      console.error('Error in cleanup process:', error);
    }
  }, [currentFamily]);

  // Run cleanup on mount and every hour
  useEffect(() => {
    cleanupCompletedItems();
    
    const cleanupInterval = setInterval(() => {
      cleanupCompletedItems();
    }, 60 * 60 * 1000); // Every hour
    
    return () => clearInterval(cleanupInterval);
  }, [cleanupCompletedItems]);
  // Refresh items
  const refreshItems = useCallback(async () => {
    await loadItems();
  }, [loadItems]);

  // Filter functions
  const getItemsByCategory = useCallback((category: string) => {
    return items.filter(item => item.category === category);
  }, [items]);

  const getCompletedItems = useCallback(() => {
    return items.filter(item => item.completed);
  }, [items]);

  const getPendingItems = useCallback(() => {
    return items.filter(item => !item.completed);
  }, [items]);

  // Load items on mount and family change
  useEffect(() => {
    loadItems();
  }, [currentFamily?.id, user?.id]); // Use stable dependencies instead of loadItems

  // Setup real-time subscription with debouncing
  useEffect(() => {
    if (!currentFamily) return;

    console.log('Setting up real-time subscription for shopping items:', currentFamily.id);

    let debounceTimeout: NodeJS.Timeout;

    const debouncedLoadItems = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        loadItems();
      }, 500); // 500ms debounce
    };

    const channel = supabase
      .channel(`shopping_items_${currentFamily.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
          filter: `family_id=eq.${currentFamily.id}`,
        },
        (payload) => {
          console.log('Real-time shopping item change:', payload);
          debouncedLoadItems();
        }
      )
      .subscribe((status) => {
        console.log('Shopping items subscription status:', status);
      });

    return () => {
      console.log('Cleaning up shopping items subscription');
      clearTimeout(debounceTimeout);
      channel.unsubscribe();
    };
  }, [currentFamily?.id]); // Remove loadItems dependency

  return {
    items,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    toggleItemCompletion,
    refreshItems,
    getItemsByCategory,
    getCompletedItems,
    getPendingItems,
  };
};