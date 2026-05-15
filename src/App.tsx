import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import BudgetPage from './pages/BudgetPage';
import BillsPage from './pages/BillsPage';
import GoalsPage from './pages/GoalsPage';
import ReportsPage from './pages/ReportsPage';

function Guard({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  return user ? <Layout>{children}</Layout> : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"             element={<LoginPage />} />
      <Route path="/dashboard"    element={<Guard><DashboardPage /></Guard>} />
      <Route path="/transactions" element={<Guard><TransactionsPage /></Guard>} />
      <Route path="/budget"       element={<Guard><BudgetPage /></Guard>} />
      <Route path="/factures"     element={<Guard><BillsPage /></Guard>} />
      <Route path="/objectifs"    element={<Guard><GoalsPage /></Guard>} />
      <Route path="/rapports"     element={<Guard><ReportsPage /></Guard>} />
      <Route path="*"             element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
