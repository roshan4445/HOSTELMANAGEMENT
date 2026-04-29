# StayFlow - PG Rental Management CRM

StayFlow is a comprehensive, full-stack CRM designed for PG (Paying Guest) and Hostel owners to manage their properties, tenants, rent collections, and complaints seamlessly.

## 🚀 Tech Stack
- **Frontend**: React.js (Vite), Tailwind CSS, Framer Motion, Recharts
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT (JSON Web Tokens)
- **Background Jobs**: Node-cron

---

## 🔄 Core Application Flow

### 1. Authentication & Onboarding
- **Registration**: Owners register with their details and PG/Hostel Name.
- **Admin Approval**: For security, newly registered accounts require manual approval before they can log in.
- **Login**: Upon logging in, a secure JWT token is generated and stored on the client. The User's PG name is dynamically loaded into the sidebar.

### 2. Room & Tenant Management
- **Rooms**: Owners create rooms with specific capacities, floors, and base rent amounts.
- **Tenants**: During onboarding, owners input tenant details, assign them to an available room, and upload their Aadhaar Card (as a PNG). The system automatically tracks room capacity and prevents overbooking.
- **Move-out**: When a tenant moves out, their status is updated, and the room capacity is freed up.

### 3. Automated Rent & Payment Collection
The system utilizes automated `cron` jobs to eliminate manual data entry:
- **Rent Generation**: On the **1st of every month at midnight**, a cron job automatically generates a `Pending` rent payment record for every active tenant.
- **Overdue Tracking**: Every day at 1 AM, a cron job checks for unpaid rents and marks them as `Overdue` if they exceed the grace period.
- **Payment Processing**: Owners can mark these pending payments as `Paid` via UPI or Cash. 

### 4. Complaints & Google Sheets Sync
- Tenants/Owners can log complaints (e.g., maintenance issues).
- **Auto-Sync**: A background cron job runs **every minute** to automatically sync all complaint data directly to a connected Google Sheet for external tracking and backup.

### 5. Smart Dashboard Analytics
The dashboard is entirely driven by real-time database metrics:
- **Collection Progress**: Calculates the percentage of rent collected vs. expected for the current month.
- **Revenue Trends**: Generates a 6-month historical area chart of actual collected revenue.
- **Room Occupancy**: A donut chart illustrating vacant, partially filled, and full rooms.
- **Key Insights**: Provides actionable, conditional alerts (e.g., "List your 2 vacant rooms", "Follow up on 5 unpaid rents").

---

## 🗄️ Database Schemas

Here are the core MongoDB schemas powering the application:

### 1. User Schema (Owners & Admins)
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  role: { type: String, enum: ['owner', 'tenant'], default: 'owner' },
  pgName: { type: String, required: true }, // Displayed in the UI
  isApproved: { type: Boolean, default: false }, // Requires admin approval
  pgDetails: { name: String, address: String, upiId: String }
}
```

### 2. Tenant Schema
```javascript
{
  owner: { type: ObjectId, ref: 'User' },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  aadhaar: { type: String },
  aadhaarImage: { type: String }, // Base64 encoded PNG
  moveInDate: { type: Date, required: true },
  moveOutDate: { type: Date },
  room: { type: ObjectId, ref: 'Room' },
  paymentMethod: { type: String, enum: ['UPI', 'Cash'], default: 'UPI' },
  status: { type: String, enum: ['Active', 'MovedOut'], default: 'Active' },
  rentAmount: { type: Number, required: true },
  deposit: { type: Number, default: 0 }
}
```

### 3. Room Schema
```javascript
{
  owner: { type: ObjectId, ref: 'User' },
  roomNumber: { type: String, required: true },
  capacity: { type: Number, required: true },
  occupants: [{ type: ObjectId, ref: 'Tenant' }], // Tracks current tenants
  floor: { type: Number, default: 1 },
  rentAmount: { type: Number, required: true },
  status: { type: String, enum: ['Vacant', 'Partial', 'Occupied'] }
}
```

### 4. Payment Schema
```javascript
{
  owner: { type: ObjectId, ref: 'User' },
  tenant: { type: ObjectId, ref: 'Tenant' },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  amount: { type: Number },
  total: { type: Number, required: true }, // Rent + late fees
  status: { type: String, enum: ['Pending', 'Paid', 'Overdue'], default: 'Pending' },
  paymentDate: { type: Date },
  paymentMethod: { type: String, enum: ['UPI', 'Cash'] }
}
```

### 5. Complaint Schema
```javascript
{
  owner: { type: ObjectId, ref: 'User' },
  tenant: { type: ObjectId, ref: 'Tenant' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'InProgress', 'Resolved'], default: 'Pending' },
  type: { type: String, enum: ['Maintenance', 'Cleanliness', 'Food', 'Other'] },
  createdAt: { type: Date, default: Date.now }
}
```

### 6. Announcement Schema
```javascript
{
  owner: { type: ObjectId, ref: 'User' },
  title: { type: String, required: true },
  content: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Normal', 'High'], default: 'Normal' },
  date: { type: Date, default: Date.now }
}
```

---

## 🛠️ How to Run Locally

1. Clone the repository
2. Navigate to the `server` directory and run `npm install`
3. Navigate to the `client` directory and run `npm install`
4. Set up your `.env` variables in the `server` folder (MongoDB URI, JWT Secret).
5. Start the backend: `npm run dev` (in the `server` folder)
6. Start the frontend: `npm run dev` (in the `client` folder)
