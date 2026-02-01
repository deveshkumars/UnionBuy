/**
 * App Context Provider
 * Manages global state: user role, cart, current user
 * Integrates with DynamoDB UserProfile when backend is configured
 */

import { getOrCreateUserProfile, updateUserProfile as updateUserProfileApi } from '@/services/api';
import { isBackendConfigured } from '@/services/backend';
import { currentRunner, currentUser } from '@/services/mockData';
import { CartItem, Mission, Pledge, Product, User, UserRole } from '@/types';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useReducer } from 'react';

// ============================================
// STATE TYPES
// ============================================

interface AppState {
  user: User;
  role: UserRole;
  cart: CartItem[];
  pledges: Pledge[];
  activeMission: Mission | null;
  distributionsComplete: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  authInitialized: boolean;
}

type AppAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_ROLE'; payload: UserRole }
  | { type: 'SET_AUTH_STATE'; payload: { isAuthenticated: boolean; authInitialized: boolean } }
  | { type: 'ADD_TO_CART'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_PLEDGES'; payload: Pledge[] }
  | { type: 'ADD_PLEDGE'; payload: Pledge }
  | { type: 'UPDATE_PLEDGE'; payload: Pledge }
  | { type: 'SET_ACTIVE_MISSION'; payload: Mission | null }
  | { type: 'SET_DISTRIBUTIONS_COMPLETE'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean };

// ============================================
// INITIAL STATE
// ============================================

const initialState: AppState = {
  user: currentUser,
  role: 'customer',
  cart: [],
  pledges: [],
  activeMission: null,
  distributionsComplete: false,
  isLoading: false,
  isAuthenticated: false,
  authInitialized: false,
};

// ============================================
// REDUCER
// ============================================

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        role: action.payload.role,
      };

    case 'SET_AUTH_STATE':
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        authInitialized: action.payload.authInitialized,
      };

    case 'SET_ROLE':
      // When backend is configured, we just update the role without changing user object
      // The user object will be updated separately via updateUserProfile
      if (state.isAuthenticated) {
        return {
          ...state,
          role: action.payload,
          user: { ...state.user, role: action.payload },
          cart: [], // Clear cart when switching roles
        };
      }
      // Fallback to mock data when not authenticated
      return {
        ...state,
        role: action.payload,
        user: action.payload === 'runner' ? currentRunner : currentUser,
        cart: [], // Clear cart when switching roles
      };

    case 'ADD_TO_CART': {
      const existingIndex = state.cart.findIndex(
        (item) => item.product.id === action.payload.product.id
      );

      if (existingIndex >= 0) {
        const updatedCart = [...state.cart];
        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity: updatedCart[existingIndex].quantity + action.payload.quantity,
        };
        return { ...state, cart: updatedCart };
      }

      return {
        ...state,
        cart: [...state.cart, action.payload],
      };
    }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter((item) => item.product.id !== action.payload),
      };

    case 'UPDATE_CART_QUANTITY': {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          cart: state.cart.filter((item) => item.product.id !== productId),
        };
      }

      return {
        ...state,
        cart: state.cart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        ),
      };
    }

    case 'CLEAR_CART':
      return { ...state, cart: [] };

    case 'SET_PLEDGES':
      return { ...state, pledges: action.payload };

    case 'ADD_PLEDGE':
      return { ...state, pledges: [...state.pledges, action.payload] };

    case 'UPDATE_PLEDGE':
      return {
        ...state,
        pledges: state.pledges.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };

    case 'SET_ACTIVE_MISSION':
      return { ...state, activeMission: action.payload };

    case 'SET_DISTRIBUTIONS_COMPLETE':
      return { ...state, distributionsComplete: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    default:
      return state;
  }
}

// ============================================
// CONTEXT
// ============================================

interface AppContextValue extends AppState {
  // User actions
  setUser: (user: User) => void;
  updateUser: (updates: Partial<Omit<User, 'id'>>) => Promise<{ success: boolean; error?: string }>;
  initializeAuth: () => Promise<void>;
  
  // Role actions
  switchRole: (role: UserRole) => Promise<void>;
  
  // Cart actions
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => { items: number; estimate: number; savings: number };
  
  // Pledge actions
  setPledges: (pledges: Pledge[]) => void;
  addPledge: (pledge: Pledge) => void;
  updatePledge: (pledge: Pledge) => void;
  
  // Mission actions
  setActiveMission: (mission: Mission | null) => void;
  setDistributionsComplete: (complete: boolean) => void;
  
  // Loading
  setLoading: (loading: boolean) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize auth on mount - fetch or create UserProfile from DynamoDB
  const initializeAuth = useCallback(async () => {
    if (!isBackendConfigured()) {
      // No backend - use mock data
      dispatch({ type: 'SET_AUTH_STATE', payload: { isAuthenticated: false, authInitialized: true } });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { user, created, error } = await getOrCreateUserProfile();
      if (user) {
        dispatch({ type: 'SET_USER', payload: user });
        dispatch({ type: 'SET_AUTH_STATE', payload: { isAuthenticated: true, authInitialized: true } });
        if (created) {
          console.log('[AppContext] Created new UserProfile in DynamoDB');
        }
      } else {
        // No authenticated user - fall back to mock
        console.log('[AppContext] No authenticated user:', error);
        dispatch({ type: 'SET_AUTH_STATE', payload: { isAuthenticated: false, authInitialized: true } });
      }
    } catch (e) {
      console.error('[AppContext] Auth initialization error:', e);
      dispatch({ type: 'SET_AUTH_STATE', payload: { isAuthenticated: false, authInitialized: true } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // User actions
  const setUser = useCallback((user: User) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  const updateUser = useCallback(async (updates: Partial<Omit<User, 'id'>>): Promise<{ success: boolean; error?: string }> => {
    if (!state.isAuthenticated || !isBackendConfigured()) {
      // Update local state only when not authenticated
      dispatch({ type: 'SET_USER', payload: { ...state.user, ...updates } });
      return { success: true };
    }

    const result = await updateUserProfileApi(state.user.id, updates);
    if (result.success && result.user) {
      dispatch({ type: 'SET_USER', payload: result.user });
    }
    return result;
  }, [state.isAuthenticated, state.user]);

  // Role actions - now async to persist to DynamoDB
  const switchRole = useCallback(async (role: UserRole) => {
    dispatch({ type: 'SET_ROLE', payload: role });
    
    // Persist role change to DynamoDB if authenticated
    if (state.isAuthenticated && isBackendConfigured()) {
      try {
        await updateUserProfileApi(state.user.id, { role });
      } catch (e) {
        console.error('[AppContext] Failed to persist role change:', e);
      }
    }
  }, [state.isAuthenticated, state.user.id]);

  // Cart actions
  const addToCart = useCallback((product: Product, quantity: number) => {
    dispatch({ type: 'ADD_TO_CART', payload: { product, quantity } });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { productId, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const getCartTotal = useCallback(() => {
    let estimate = 0;
    let savings = 0;
    let items = 0;

    state.cart.forEach((item) => {
      const bulkTotal = item.product.bulkPrice * item.quantity;
      const retailTotal = item.product.retailPrice * item.quantity;
      estimate += bulkTotal * 1.1; // 10% overhead
      savings += retailTotal - bulkTotal;
      items += item.quantity;
    });

    return { items, estimate, savings };
  }, [state.cart]);

  // Pledge actions
  const setPledges = useCallback((pledges: Pledge[]) => {
    dispatch({ type: 'SET_PLEDGES', payload: pledges });
  }, []);

  const addPledge = useCallback((pledge: Pledge) => {
    dispatch({ type: 'ADD_PLEDGE', payload: pledge });
  }, []);

  const updatePledge = useCallback((pledge: Pledge) => {
    dispatch({ type: 'UPDATE_PLEDGE', payload: pledge });
  }, []);

  // Mission actions
  const setActiveMission = useCallback((mission: Mission | null) => {
    dispatch({ type: 'SET_ACTIVE_MISSION', payload: mission });
  }, []);

  const setDistributionsComplete = useCallback((complete: boolean) => {
    dispatch({ type: 'SET_DISTRIBUTIONS_COMPLETE', payload: complete });
  }, []);

  // Loading
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const value: AppContextValue = {
    ...state,
    setUser,
    updateUser,
    initializeAuth,
    switchRole,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartTotal,
    setPledges,
    addPledge,
    updatePledge,
    setActiveMission,
    setDistributionsComplete,
    setLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ============================================
// HOOK
// ============================================

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Convenience hooks
export function useRole() {
  const { role, switchRole, isAuthenticated, authInitialized } = useApp();
  return { role, switchRole, isAuthenticated, authInitialized };
}

export function useUser() {
  const { user, setUser, updateUser, isAuthenticated, authInitialized, initializeAuth } = useApp();
  return { user, setUser, updateUser, isAuthenticated, authInitialized, initializeAuth };
}

export function useCart() {
  const { cart, addToCart, removeFromCart, updateCartQuantity, clearCart, getCartTotal } = useApp();
  return { cart, addToCart, removeFromCart, updateCartQuantity, clearCart, getCartTotal };
}

export function usePledges() {
  const { pledges, setPledges, addPledge, updatePledge } = useApp();
  return { pledges, setPledges, addPledge, updatePledge };
}

export function useMission() {
  const { activeMission, setActiveMission, distributionsComplete, setDistributionsComplete } = useApp();
  return { activeMission, setActiveMission, distributionsComplete, setDistributionsComplete };
}
