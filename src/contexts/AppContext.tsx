import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { format } from 'date-fns';
import { Transaction, Budget, Category, User } from '../types';
import {
  initGoogleAuth,
  requestAccessToken,
  fetchUserInfo,
  revokeToken,
  getSavedSpreadsheetId,
  createSpreadsheet,
  loadAllData,
  addTransaction as apiAddTransaction,
  updateTransaction as apiUpdateTransaction,
  deleteTransaction as apiDeleteTransaction,
  saveBudget as apiSaveBudget,
  deleteBudget as apiDeleteBudget,
} from '../lib/googleApi';

// ── State ────────────────────────────────────────────────────────────────────

interface AppState {
  user: User | null;
  spreadsheetId: string | null;
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  selectedMonth: string; // "YYYY-MM"
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; spreadsheetId: string; transactions: Transaction[]; budgets: Budget[]; categories: Category[] } }
  | { type: 'LOGOUT' }
  | { type: 'SET_MONTH'; payload: string }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'UPSERT_BUDGET'; payload: Budget }
  | { type: 'DELETE_BUDGET'; payload: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload, loading: false };
    case 'LOGIN_SUCCESS': return {
      ...state,
      user: action.payload.user,
      spreadsheetId: action.payload.spreadsheetId,
      transactions: action.payload.transactions,
      budgets: action.payload.budgets,
      categories: action.payload.categories,
      loading: false,
      error: null,
    };
    case 'LOGOUT': return {
      ...initialState,
      selectedMonth: state.selectedMonth,
    };
    case 'SET_MONTH': return { ...state, selectedMonth: action.payload };
    case 'ADD_TRANSACTION': return { ...state, transactions: [...state.transactions, action.payload] };
    case 'UPDATE_TRANSACTION': return {
      ...state,
      transactions: state.transactions.map((t) => t.id === action.payload.id ? action.payload : t),
    };
    case 'DELETE_TRANSACTION': return {
      ...state,
      transactions: state.transactions.filter((t) => t.id !== action.payload),
    };
    case 'UPSERT_BUDGET': return {
      ...state,
      budgets: state.budgets.some((b) => b.id === action.payload.id)
        ? state.budgets.map((b) => b.id === action.payload.id ? action.payload : b)
        : [...state.budgets, action.payload],
    };
    case 'DELETE_BUDGET': return {
      ...state,
      budgets: state.budgets.filter((b) => b.id !== action.payload),
    };
    default: return state;
  }
}

const initialState: AppState = {
  user: null,
  spreadsheetId: null,
  transactions: [],
  budgets: [],
  categories: [],
  selectedMonth: format(new Date(), 'yyyy-MM'),
  loading: false,
  error: null,
};

// ── Context ───────────────────────────────────────────────────────────────────

interface AppContextValue extends AppState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setSelectedMonth: (m: string) => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (t: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  saveBudget: (b: Omit<Budget, 'id'>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const login = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
      await initGoogleAuth(clientId);
      const token = await requestAccessToken('select_account');
      const user = await fetchUserInfo(token);

      let spreadsheetId = getSavedSpreadsheetId(user.email);
      if (!spreadsheetId) {
        spreadsheetId = await createSpreadsheet(user.email);
      }

      const { transactions, budgets, categories } = await loadAllData(spreadsheetId);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, spreadsheetId, transactions, budgets, categories } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, []);

  const logout = useCallback(async () => {
    await revokeToken();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const setSelectedMonth = useCallback((m: string) => {
    dispatch({ type: 'SET_MONTH', payload: m });
  }, []);

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id'>) => {
    if (!state.spreadsheetId) return;
    const newT = await apiAddTransaction(state.spreadsheetId, t);
    dispatch({ type: 'ADD_TRANSACTION', payload: newT });
  }, [state.spreadsheetId]);

  const updateTransaction = useCallback(async (t: Transaction) => {
    if (!state.spreadsheetId) return;
    await apiUpdateTransaction(state.spreadsheetId, t, state.transactions);
    dispatch({ type: 'UPDATE_TRANSACTION', payload: t });
  }, [state.spreadsheetId, state.transactions]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!state.spreadsheetId) return;
    await apiDeleteTransaction(state.spreadsheetId, id, state.transactions);
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
  }, [state.spreadsheetId, state.transactions]);

  const saveBudget = useCallback(async (b: Omit<Budget, 'id'>) => {
    if (!state.spreadsheetId) return;
    const saved = await apiSaveBudget(state.spreadsheetId, b, state.budgets);
    dispatch({ type: 'UPSERT_BUDGET', payload: saved });
  }, [state.spreadsheetId, state.budgets]);

  const deleteBudget = useCallback(async (id: string) => {
    if (!state.spreadsheetId) return;
    await apiDeleteBudget(state.spreadsheetId, id, state.budgets);
    dispatch({ type: 'DELETE_BUDGET', payload: id });
  }, [state.spreadsheetId, state.budgets]);

  return (
    <AppContext.Provider value={{
      ...state,
      login,
      logout,
      setSelectedMonth,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      saveBudget,
      deleteBudget,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
