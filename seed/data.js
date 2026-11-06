// Sample data. All stall names, prices, students and orders are invented.
// Never put real student names, TP numbers or photos here.

export const APP_CONFIG = {
  // Pin the time of day so the demo works at any hour. Set to null for real time.
  demoTime: '13:15',
  // 'sample' = generated timetable (always a 14:30 class today).
  // 'apu'    = APU's public timetable feed for `intake`.
  timetableSource: 'sample',
  intake: 'APD2F2609SE',
  slotMinutes: 10,
  slotTimes: ['13:30', '13:40', '13:50', '14:00'],
  qrValidMinutesAfterSlot: 30,
};

export const SAMPLE_STUDENT = {
  id: 'TP000000',
  name: 'SAMPLE STUDENT',
  intake: 'APD2F2609SE',
  apcardBalance: 50.0,
};

export const STALLS = [
  { id: 'hana', name: 'Hana Japanese Kitchen', cuisine: 'Japanese', location: 'Centrepoint', prepMinPerOrder: 4 },
  { id: 'grill', name: 'Grill Station', cuisine: 'Western', location: 'Centrepoint', prepMinPerOrder: 5 },
  { id: 'dapur', name: 'Dapur Kampung', cuisine: 'Malay', location: 'Centrepoint', prepMinPerOrder: 3 },
  { id: 'wok', name: 'Wok Express', cuisine: 'Chinese', location: 'Centrepoint', prepMinPerOrder: 3 },
].map((s, i) => ({ ...s, rank: i + 1, openHours: '08:00-18:00', slotCapacity: 5, isOpen: true }));

// tags: halal, spicy, vegetarian, bestseller. Dietary tags are preferences
// shown to students, never guarantees.
export const MENU = {
  hana: [
    { id: 'katsu', name: 'Chicken Katsu Don', description: 'Crispy chicken cutlet, egg, onion, rice', priceRM: 11.9, tags: ['halal', 'bestseller'] },
    { id: 'salmon', name: 'Salmon Teriyaki Bento', description: 'Grilled salmon, rice, salad, tamago', priceRM: 14.9, tags: ['halal'] },
    { id: 'gyudon', name: 'Beef Gyudon', description: 'Sliced beef and onion over rice', priceRM: 12.9, tags: ['halal'] },
    { id: 'ramen', name: 'Chicken Shoyu Ramen', description: 'Soy broth, noodles, egg, spring onion', priceRM: 13.5, tags: ['halal'] },
    { id: 'gyoza', name: 'Gyoza (6 pcs)', description: 'Pan-fried chicken dumplings', priceRM: 7.5, tags: ['halal'] },
    { id: 'ocha', name: 'Iced Green Tea', description: 'Unsweetened', priceRM: 2.5, tags: ['halal', 'vegetarian'] },
  ],
  grill: [
    { id: 'chop', name: 'Chicken Chop', description: 'Black pepper sauce, fries, coleslaw', priceRM: 12.9, tags: ['halal', 'bestseller'] },
    { id: 'spag', name: 'Spaghetti Bolognese', description: 'Beef ragu, parmesan', priceRM: 10.9, tags: ['halal'] },
    { id: 'fish', name: 'Fish and Chips', description: 'Battered dory, fries, tartar', priceRM: 13.9, tags: ['halal'] },
  ],
  dapur: [
    { id: 'lemak', name: 'Nasi Lemak Ayam', description: 'Fried chicken, sambal, egg, peanuts', priceRM: 8.5, tags: ['halal', 'spicy', 'bestseller'] },
    { id: 'mee', name: 'Mee Goreng Mamak', description: 'Spicy fried noodles', priceRM: 7.5, tags: ['halal', 'spicy'] },
    { id: 'teh', name: 'Teh Tarik', description: 'Pulled milk tea', priceRM: 2.8, tags: ['halal', 'vegetarian'] },
  ],
  wok: [
    { id: 'crice', name: 'Roasted Chicken Rice', description: 'Fragrant rice, chilli on the side, soup', priceRM: 8.9, tags: ['halal', 'bestseller'] },
    { id: 'frice', name: 'Egg Fried Rice', description: 'Wok-fried with vegetables', priceRM: 8.5, tags: ['halal', 'vegetarian'] },
    { id: 'wantan', name: 'Wantan Mee', description: 'Dry noodles, char siew chicken', priceRM: 8.9, tags: ['halal'] },
  ],
};

// Other (invented) students who already pre-ordered today.
// Hana's 13:30 slot is seeded full (5/5) for the demo.
export const TODAY_ORDERS = [
  { orderNo: 91, stallId: 'hana', studentId: 'TP000101', studentName: 'Aisyah', items: [['katsu', 1], ['ocha', 1]], pickupSlot: '13:30', status: 'preparing', payMethod: 'apcard', dining: 'eatIn' },
  { orderNo: 92, stallId: 'hana', studentId: 'TP000102', studentName: 'Jun Wei', items: [['ramen', 1]], pickupSlot: '13:30', status: 'preparing', payMethod: 'fpx', dining: 'takeaway' },
  { orderNo: 93, stallId: 'hana', studentId: 'TP000103', studentName: 'Priya', items: [['gyudon', 2]], pickupSlot: '13:30', status: 'new', payMethod: 'apcard', dining: 'eatIn' },
  { orderNo: 94, stallId: 'hana', studentId: 'TP000104', studentName: 'Daniel', items: [['salmon', 1]], pickupSlot: '13:30', status: 'new', payMethod: 'apcard', dining: 'takeaway' },
  { orderNo: 95, stallId: 'hana', studentId: 'TP000105', studentName: 'Mei Ling', items: [['katsu', 1], ['gyoza', 1]], pickupSlot: '13:30', status: 'new', payMethod: 'fpx', dining: 'eatIn' },
  { orderNo: 96, stallId: 'hana', studentId: 'TP000106', studentName: 'Arjun', items: [['katsu', 2]], pickupSlot: '13:40', status: 'new', payMethod: 'apcard', dining: 'eatIn' },
  { orderNo: 97, stallId: 'hana', studentId: 'TP000107', studentName: 'Sofia', items: [['ramen', 1], ['ocha', 1]], pickupSlot: '13:50', status: 'new', payMethod: 'apcard', dining: 'takeaway' },
  { orderNo: 98, stallId: 'dapur', studentId: 'TP000108', studentName: 'Omar', items: [['lemak', 1], ['teh', 1]], pickupSlot: '13:30', status: 'preparing', payMethod: 'apcard', dining: 'eatIn' },
  { orderNo: 99, stallId: 'dapur', studentId: 'TP000109', studentName: 'Farah', items: [['mee', 1]], pickupSlot: '13:40', status: 'new', payMethod: 'fpx', dining: 'takeaway' },
  { orderNo: 100, stallId: 'grill', studentId: 'TP000110', studentName: 'Hiro', items: [['chop', 1]], pickupSlot: '13:30', status: 'new', payMethod: 'apcard', dining: 'eatIn' },
];

// The sample student's past orders, so "Order my usual" has history.
// daysAgo is relative to the seed date. Usual = Chicken Katsu Don (Hana).
export const PAST_ORDERS = [
  { daysAgo: 1, stallId: 'hana', items: [['katsu', 1], ['ocha', 1]], pickupSlot: '13:40' },
  { daysAgo: 2, stallId: 'dapur', items: [['lemak', 1]], pickupSlot: '13:30' },
  { daysAgo: 3, stallId: 'hana', items: [['katsu', 1]], pickupSlot: '13:50' },
  { daysAgo: 6, stallId: 'hana', items: [['katsu', 1], ['gyoza', 1]], pickupSlot: '13:40' },
];
