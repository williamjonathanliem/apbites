import { Link, Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './student/Dashboard.jsx';
import Stalls from './student/Stalls.jsx';
import StallMenu from './student/StallMenu.jsx';
import Search from './student/Search.jsx';
import Checkout from './student/Checkout.jsx';
import OrderStatus from './student/OrderStatus.jsx';

function Landing() {
  return (
    <main className="landing">
      <div className="card landing-card">
        <h1>APBites</h1>
        <p>Open the student app on a phone and the stall screen on a tablet.</p>
        <Link className="btn block" to="/student">Student app (APSpace)</Link>
        <Link className="btn ghost block" to="/stall">Stall screen</Link>
      </div>
    </main>
  );
}

function StallPlaceholder() {
  return (
    <main className="landing">
      <div className="card landing-card">
        <h1>Stall screen</h1>
        <p>Live orders, status buttons and the QR scanner arrive in build step 4.</p>
        <Link className="btn ghost block" to="/">Back</Link>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/student" element={<Dashboard />} />
      <Route path="/student/bites" element={<Stalls />} />
      <Route path="/student/bites/stall/:stallId" element={<StallMenu />} />
      <Route path="/student/bites/search" element={<Search />} />
      <Route path="/student/bites/checkout" element={<Checkout />} />
      <Route path="/student/bites/order/:orderId" element={<OrderStatus />} />
      <Route path="/stall/*" element={<StallPlaceholder />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
