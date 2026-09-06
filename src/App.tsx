import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/Auth/LoginScreen';
import { EmailVerificationModal } from './components/Auth/EmailVerificationModal';
import { AdminDashboard } from './components/Dashboard/AdminDashboard';
import { POSScreen } from './components/POS/POSScreen';
import { ProductManagement } from './components/Products/ProductManagement';
import { CreditManagement } from './components/Credit/CreditManagement';
import { CashManagement } from './components/CashRegister/CashManagement';
import { CashierManagement } from './components/Cashiers/CashierManagement';
import { SupplierManagement } from './components/Suppliers/SupplierManagement';
import { BackupManagement } from './components/Backup/BackupManagement';
import { CashMovementModal } from './components/CashRegister/CashMovementModal';
import { CashClosingModal } from './components/CashRegister/CashClosingModal';
import { DeviceManagerModal } from './components/Devices/DeviceManagerModal';
import { AuditLogModal } from './components/Audit/AuditLogModal';
import { MultiDeviceSimulator } from './components/Simulator/MultiDeviceSimulator';
import { AndroidUSBInstallModal } from './components/PWA/AndroidUSBInstallModal';
import { AndroidInstallBanner } from './components/PWA/AndroidInstallBanner';
import { ErrorBoundary } from './components/Common/ErrorBoundary';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user, needsEmailVerification, refreshProfile } = useAuth();
  const { activeTab, setActiveTab } = useApp();

  // Modals state
  const [movementModal, setMovementModal] = useState<'withdrawal' | 'injection' | null>(null);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-300 font-medium">Connexion à Firebase & BoutiquePro...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col">
      {/* Email Verification Gate Modal */}
      {needsEmailVerification && user?.email && (
        <EmailVerificationModal
          email={user.email}
          onVerified={() => refreshProfile()}
        />
      )}

      <AndroidInstallBanner onOpenModal={() => setIsPwaModalOpen(true)} />
      <Navbar
        onOpenDevices={() => setIsDeviceModalOpen(true)}
        onOpenPWA={() => setIsPwaModalOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenAudit={() => setIsAuditModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Render Tab View */}
        {activeTab === 'dashboard' && user?.role === 'admin' && (
          <AdminDashboard
            onOpenWithdrawal={() => setMovementModal('withdrawal')}
            onOpenInjection={() => setMovementModal('injection')}
            onOpenClosing={() => setIsClosingModalOpen(true)}
            onOpenProductModal={() => setActiveTab('products')}
          />
        )}

        {activeTab === 'pos' && <POSScreen />}

        {activeTab === 'products' && <ProductManagement />}

        {activeTab === 'clients' && <CreditManagement />}

        {activeTab === 'suppliers' && user?.role === 'admin' && <SupplierManagement />}

        {activeTab === 'cash' && user?.role === 'admin' && (
          <CashManagement
            onOpenWithdrawal={() => setMovementModal('withdrawal')}
            onOpenInjection={() => setMovementModal('injection')}
            onOpenClosing={() => setIsClosingModalOpen(true)}
          />
        )}

        {activeTab === 'cashiers' && user?.role === 'admin' && <CashierManagement />}

        {activeTab === 'backup' && user?.role === 'admin' && <BackupManagement />}
      </main>

      {/* Global Modals */}
      {movementModal && (
        <CashMovementModal
          type={movementModal}
          onClose={() => setMovementModal(null)}
        />
      )}

      {isClosingModalOpen && (
        <CashClosingModal onClose={() => setIsClosingModalOpen(false)} />
      )}

      {isDeviceModalOpen && (
        <DeviceManagerModal onClose={() => setIsDeviceModalOpen(false)} />
      )}

      {isAuditModalOpen && (
        <AuditLogModal onClose={() => setIsAuditModalOpen(false)} />
      )}

      {isSimulatorOpen && (
        <MultiDeviceSimulator onClose={() => setIsSimulatorOpen(false)} />
      )}

      {isPwaModalOpen && (
        <AndroidUSBInstallModal onClose={() => setIsPwaModalOpen(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <MainLayout />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
