import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Dépenses
  { id: 'cat-alimentation', name: 'Alimentation', type: 'expense', color: '#ef4444', icon: '🛒' },
  { id: 'cat-transport', name: 'Transport', type: 'expense', color: '#f97316', icon: '🚗' },
  { id: 'cat-logement', name: 'Logement', type: 'expense', color: '#eab308', icon: '🏠' },
  { id: 'cat-sante', name: 'Santé', type: 'expense', color: '#84cc16', icon: '💊' },
  { id: 'cat-loisirs', name: 'Loisirs', type: 'expense', color: '#3b82f6', icon: '🎮' },
  { id: 'cat-shopping', name: 'Shopping', type: 'expense', color: '#8b5cf6', icon: '👗' },
  { id: 'cat-restaurants', name: 'Restaurants', type: 'expense', color: '#ec4899', icon: '🍽️' },
  { id: 'cat-voyages', name: 'Voyages', type: 'expense', color: '#06b6d4', icon: '✈️' },
  { id: 'cat-education', name: 'Éducation', type: 'expense', color: '#a855f7', icon: '📚' },
  { id: 'cat-abonnements', name: 'Abonnements', type: 'expense', color: '#14b8a6', icon: '📱' },
  { id: 'cat-autres-dep', name: 'Autres dépenses', type: 'expense', color: '#6b7280', icon: '💸' },
  // Revenus
  { id: 'cat-salaire', name: 'Salaire', type: 'income', color: '#22c55e', icon: '💰' },
  { id: 'cat-freelance', name: 'Freelance', type: 'income', color: '#3b82f6', icon: '💻' },
  { id: 'cat-investissements', name: 'Investissements', type: 'income', color: '#f59e0b', icon: '📈' },
  { id: 'cat-aides', name: 'Aides & allocations', type: 'income', color: '#10b981', icon: '🏛️' },
  { id: 'cat-autres-rev', name: 'Autres revenus', type: 'income', color: '#8b5cf6', icon: '🎁' },
];
