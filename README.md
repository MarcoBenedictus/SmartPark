# SmartPark - Fullstack Intern Case Study

## 1. Overview
SmartPark is a web app designed to manage parking availability in real time. It solves the problem of parking by providing a dashboard consisting real time view of available slots and the ability to reserve a specific spot. And an Admin Dashboard to manage parking lots, visualize occupancy analytics, and simulate IoT sensor data (by the admin clicking on the grids).

## 2. Architecture & Database Design

### Why Relational (PostgreSQL)?
I chose a relational database (PostgreSQL) because the data structure is strictly hierarchical and requires referential integrity for the interaction between tables.
* A **Parking Slot** cannot exist without a **Parking Lot**. AND is strictly connected to it. 
* This is a **One to Many** relationship and best enforced by SQL foreign keys, ensuring that if a Lot is deleted, then it's Slots are to be cascaded correctly too.

### Database Schema
* **Users:** Stores authentication data and Roles (`ADMIN`, `USER`).
* **parkinglots:** Stores the physical location data (`name`, `capacity`).
* **ParkingSlots:** Stores the individual unit state (`status`, `slot_number`, `reservedBy`).
    * I added the `reservedBy` column to the ParkingSlots table to link bookings directly to users by id, I think it would be a nice touch to not allow a user to reserve more than one slot.

### Database Diagram (ASCII)
       +---------------+             +----------------------+             +-----------------+
       |     Users     |             |     ParkingSlots     |             |   ParkingLots   |
       +---------------+             +----------------------+             +-----------------+
       | id (PK)       | <--------+  | id (PK)              |  +--------> | id (PK)         |
       | email         |          |  | slot_number          |  |          | name            |
       | password      |          |  | status               |  |          | capacity        |
       | role          |          +--| reservedBy (FK)      |  |          +-----------------+
       +---------------+             | parkingLotId (FK)    |--+
                                     +----------------------+
              ^                                 ^
              I                                 I
       (One User can reserve            (One Lot contains
        max One Slot)                    Many Slots)

## 3. Development / Technology Choices (PERN STACK)

### Backend: Node.js + Express + Sequelize
* **Node.js:** It allows flexibility, a non-blocking I/O system which is ideal for handling multiple concurrent API requests (in this case : the dashboard).
* **Express:** Supporting Node.js with Utilities (Jwt Authentication and RBAC) and API Routing 
* **Sequelize ORM:** Used as a substitute to the traditional SQL Queries, turning it to js codes, ensuring the Code is Reproducible in other Machines too.

### Frontend: React + Tailwind CSS + Recharts + Vite
* **React:** The component-based architecture allowed me to reuse components, in this case, the `Slot` component across the Grid View.
For the states, I chose Local State (useState) over global state libraries like Redux. Primarily because The application state (list of slots) is frequently refreshed from the server (polling). Using something like Redux would introduce unnecessary complexity for data that renews every 2 seconds.
* **Tailwind CSS:** Enabled rapid UI development, and avoids clumping up the CSS file mainly because of it's "Built in" nature.
* **Recharts:** Mainly used for the Analytics Dashboard.
* **Vite:** To help with development process, simply because it allows real time updates to the Frontend UI without refreshing the page multiple times.

Overall, PERN (Postgre, Express, React, Node.js) is a good choice for this Project, having the advantage in Strong, Consistent Relational Database, and being able to use the SQL Database Query inside a Javascript Environment.

## 4. Features Implemented

### Core MVP Features
* **Authentication:** Register/Login system using **JWT (JSON Web Tokens)** for authentication.
* **Role-Based Access Control (RBAC):** Middleware protects Admin routes, mainly to not allow users to guess the link and able to change the status of slots.
* **CRUD Operations:** Admins can Create, Read, Update (add or reduce slots to existing lots), and Delete parking lots.
* **Real-Time IoT Simulation:** Admins can manually toggle slots (Available to Occupied, vice versa) to simulate sensor updates (The Iot).
* **User Grid View:** Users see a live grid of slots updated via short polling.

### Optional Features
**A. Booking System**
Implemented a reservation lifecycle consisting of:
1.  **Book:** User reserves a slot (Status: `RESERVED`).
2.  **Check-In:** User arrives at the lot (Status: `OCCUPIED`).
3.  **Check-Out:** User leaves (Status: `AVAILABLE`).
* Also Implemented a **One Slot Policy** in the backend. A user cannot book more than one slot.

**B. Admin Analytics Dashboard**
Implemented a visualization tab for Admins using `Recharts`:
* **Pie Chart:** Shows overall system occupancy and availability.
* **Bar Chart:** Breaks down occupancy rates per Lot.

## 5. Results & Error Handling Analysis
How Errors are Handled
I implemented an error handling strategy as such:

* Backend: All Controllers use try/catch blocks. If an operation fails (e.g., DB connection lost), the server responds with a standard error format: res.status(500).json({ message: "Error description" }).

* Auth Errors: Middleware intercepts unauthenticated requests, returning 401 Unauthorized before they reach the logic layer.

* Frontend: Axios interceptors and try/catch blocks capture API errors. For example, if a user tries to book a second slot, the backend returns 400 Bad Request, and the frontend displays a warning that: "You already have an active slot."

## Challenges & Solutions
### Challenge 1: Real-Time Updates without WebSockets

1. **Problem:** The MVP required users to see updates "in real-time," but setting up a full WebSocket (Socket.io) server adds significant complexity for a prototype.

2. **Solution:** I implemented Short Polling System using setInterval (2000ms or 2 seconds) in the React useEffect hook. This is so the dashboard stays synced with the database with minimum server overhead.

### Challenge 2: Data Consistency & Sorting

1. **Problem:** PostgreSQL does not guarantee the order of returned rows. Slots appeared randomly (e.g., A-10, A-1, A-5).

2. **Solution:** Thus, a strict ordering is to be implemented in the Sequelize query: order: [['id', 'ASC'], [{ model: db.ParkingSlot, as: 'slots' }, 'id', 'ASC']].

### Challenge 3: Preventing Administrative Overwrites

1. **Problem:** An Admin simulating IoT data might accidentally kick out a User who reserved a spot, unable to give it back.

2. **Solution:** To avoid having to contact the Customer, wasting resources, I implemented a Custom Modal Interceptor in the Frontend. If an Admin tries to toggle a RESERVED slot, the app interrupts the action and asks for explicit confirmation before overriding said slot.

### Future Improvements / Refactoring
If given another week, I would:

1. **Replace Polling with Socket.io:** To make the app more foolproof and truly event-driven and reduce HTTP request load.

2. **Unit Testing:** Implement Jest and Supertest to automate API testing instead of the manual Postman checks.

3. **Payment Gateway:** Integrate Stripe in the checkOut controller to calculate fees based on duration.

4. **Better Identification:** Perhaps a better Identification System than a mere Email Address, this would ensure that a User cannot mass create Accounts to Clog Up the Slots.

5. **Custom Warning UIs:** Currently the only UI that is Custom is the Warning for the Admin to avoid Overriding Reserved Data, while the rest of the Warnings on the Frontend uses the built-in Alert Warning.

6. **A more Advanced Slot Deleting System:** Currently, Slot Deleting deletes the slots from the very end (e.g 1-20 slots, delete 5, then slot 20-16 will be deleted) without checking the Reservation or Occupancy Status.

## 6. API Design (RESTful)

The API follows standard REST architectural styles. It uses HTTP verbs (GET, POST, PUT, DELETE) to perform CRUD operations and returns data in JSON format.

| Method | Endpoint | Access | Description | Example JSON Payload |
| :--- | :--- | :--- | :--- | :--- |
| `POST`   | `/api/auth/register`             | Public | Register new User/Admin        | `{"email": "user@test.com", "password": "123"}` |
| `POST`   | `/api/auth/login`                | Public | Login & Get Token              | `{"email": "user@test.com", "password": "123"}` |
| `GET`    | `/api/parking/lots`              | Public | Fetch all lots & slots         | *empty* |
| `POST`   | `/api/parking/lots`              | Admin  | Create new Lot                 | `{"name": "test", "capacity": 20}` |
| `PUT`    | `/api/parking/lots/:id`          | Admin  | Update Lot Name/Capacity       | `{"name": "test", "capacity": 25}` |
| `DELETE` | `/api/parking/lots/:id`          | Admin  | Delete Lot                     | *empty* |
| `PUT`    | `/api/parking/slots/:id`         | Admin  | Force Status Change            | `{"status": "OCCUPIED"}` |
| `GET`    | `/api/parking/stats`             | Admin  | Fetch Analytics                | *empty* |
| `POST`   | `/api/parking/slots/:id/book`    | User   | Reserve a slot                 | *empty - User ID extracted from Token* |
| `POST`   | `/api/parking/slots/:id/checkin` | User   | Check-in (Arrive)              | *empty* |
| `POST`   | `/api/parking/slots/:id/checkout`| User   | Check-out (Leave)              | *empty* |

## 7. How to Run (Reproducibility)

I have created a script allowing you to initialize and run the entire web without going to individual folders.

### Prerequisites
* Node.js installed.
* PostgreSQL installed and running.

### Quick Start
1.  **Configure Environment:**
    * Go to `/backend` and rename `.env.example` to `.env`.
    * Enter your PostgreSQL username and password in the field.

2.  **Install Dependencies (Root, Backend, & Frontend):**
    ```
    npm run install-all
    ```
    *if it doesn't work, run the following commands and redo the install-all command*
    ```
    npm init -y
    ```
    ```
    npm install concurrently --save-dev 
    ```

3.  **Initialize Database (Seed Data):**
    ```
    npm run seed
    ```

4.  **Launch Application:**
    ```
    npm start
    ```
    * *This will run both Backend (Port 5000) and Frontend (Port 5173) using concurrently.*

5.  **Access the App:**
    * Open `http://localhost:5173`
    * **Admin Credentials:** `admin@smartpark.com` / `secretpass99`
    * **User Credentials:** `user@smartpark.com` / `secretpass99`

## 8. Functional Testing & Demo Vid

### API Test Collection
We have provided a Postman collection to test all API endpoints (Auth, CRUD, Booking, Analytics).
* **[Download Postman Collection](./SmartPark_API.postman_collection.json)**
* *Instructions:* Import this file into Postman to see all pre-configured requests.

### Functional Demo
[Soon]