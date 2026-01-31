/**
 * App Context Provider
 * Manages global state: user role, cart, current user
 */

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { User, UserRole, CartItem, Product, Pledge, Mission } from '@/types';
import { currentUser, currentRunner } from '@/services/mockData';

// ============================================
// STATE TYPES
// ============================================

interface AppState {
  user: User;
  role: UserRole;
  cart: CartItem[];
  pledges: Pledge[];
  activeMission: Mission | null;
  isLoading: boolean;
}

type AppAction =
  | { type: 'SET_ROLE'; payload: UserRole }
  | { type: 'ADD_TO_CART'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_PLEDGES'; payload: Pledge[] }
  | { type: 'ADD_PLEDGE'; payload: Pledge }
  | { type: 'UPDATE_PLEDGE'; payload: Pledge }
  | { type: 'SET_ACTIVE_MISSION'; payload: Mission | null }
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
  isLoading: false,
};

// ============================================
// REDUCER
// ============================================

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ROLE':
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
  // Role actions
  switchRole: (role: UserRole) => void;
  
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

  // Role actions
  const switchRole = useCallback((role: UserRole) => {
    dispatch({ type: 'SET_ROLE', payload: role });
  }, []);

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

  // Loading
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const value: AppContextValue = {
    ...state,
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
  const { role, switchRole } = useApp();
  return { role, switchRole };
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
  const { activeMission, setActiveMission } = useApp();
  return { activeMission, setActiveMission };
}

