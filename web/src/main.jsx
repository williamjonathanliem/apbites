import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppDataProvider } from './shared/appData.jsx';
import { CartProvider } from './shared/cart.jsx';
import App from './App.jsx';
import './shared/styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppDataProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AppDataProvider>
    </BrowserRouter>
  </StrictMode>,
);
