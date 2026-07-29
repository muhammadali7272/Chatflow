import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from 'react-hot-toast';
import { store, persistor } from './store/store';
import AppRoutes from './routes/AppRoutes';
import SocketProvider from './components/UI/SocketProvider';
import ThemeProvider from './components/UI/ThemeProvider';
import ErrorBoundary from './pages/ErrorBoundary/ErrorBoundary';
import Loader from './components/Loader/Loader';
import { I18nProvider } from './i18n/I18nContext';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<Loader fullScreen text="Loading..." />} persistor={persistor}>
        <I18nProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <SocketProvider />
            <ThemeProvider />
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'var(--c-surface-2)',
                  color: 'var(--c-text)',
                  fontSize: '14px',
                  border: '1px solid var(--c-border)',
                },
                success: {
                  iconTheme: {
                    primary: 'var(--c-primary)',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: 'var(--c-danger)',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </ErrorBoundary>
        </BrowserRouter>
        </I18nProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
