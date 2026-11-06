import { adminDb } from '../server/firebaseAdmin.js';
import { handler } from '../server/http.js';
import { placeOrder } from '../server/orders.js';

// POST /api/place-order
// { studentId, stallId, items: [{ itemId, qty }], pickupSlot, dining, payMethod }
// -> { orderId, orderNo, totalRM }
export default handler((body) => placeOrder(adminDb(), body));
