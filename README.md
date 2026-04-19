# FreelanceConnect

Hi!, welcome to my repository. The **FreelanceConnect** system is developed to transform the process of finding and booking local freelancers into a smart, online platform. It connects customers with nearby freelancers based on skills, availability, and location.

The system includes all essential functionalities such as user authentication, profile management, booking workflows, and review systems. It also ensures security using password encryption and JWT-based authentication. This is a complete freelancer management and booking platform with scalable architecture and efficient database handling.

---

## Getting Started

These instructions will help you set up and run the project on your local machine for development and testing purposes.

---

## Prerequisites

It is recommended to have basic knowledge of:

* HTML, CSS, JavaScript
* React.js
* Node.js & Express.js
* MySQL

Make sure you have the following installed:

* Node.js
* MySQL / XAMPP / phpMyAdmin
* Git

---

## Project Structure

```
FreelanceConnect/
│── backend/
│   ├── scripts/
│   ├── sql/
│   ├── src/
│   ├── package.json
│
│── frontend/
│   ├── src/
│   ├── dist/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│
│── README.md
```

---

## Features

* Role-based authentication system (Customer & Freelancer)
* Localized freelancer discovery using location-based filtering
* Profile management for freelancers (skills, pricing, availability)
* Booking request workflow (request → accept/reject → completion)
* Availability validation to prevent overlapping bookings
* Rating and review system for trust and credibility
* Secure authentication using JWT and encrypted passwords
* Scalable 3-tier architecture (Frontend + Backend + Database)

---

## Technical Stack

### Frontend

* React.js
* HTML, CSS, JavaScript
* Tailwind CSS
* Vite

### Backend

* Node.js
* Express.js

### Database

* MySQL

---

## Setting up the Environment

### 1. Clone the Repository

```
git clone https://github.com/<your-username>/FreelanceConnect.git
cd FreelanceConnect
```

---

### 2. Backend Setup

```
cd backend
npm install
```

Run the backend server:

```
<ADD_BACKEND_RUN_COMMAND_HERE>
```

---

### 3. Frontend Setup

```
cd frontend
npm install
```

Run the frontend:

```
<ADD_FRONTEND_RUN_COMMAND_HERE>
```

---

## Application URLs

* Frontend: `http://localhost:<FRONTEND_PORT>`
* Backend: `http://localhost:<BACKEND_PORT>`

---

## Database Setup

1. Open MySQL / phpMyAdmin
2. Create a new database:

```
<ADD_DATABASE_NAME>
```

3. Import the SQL file from:

```
backend/sql/<YOUR_SQL_FILE>.sql
```

4. Make sure your database credentials are correctly configured in backend.

---

## Environment Configuration

Create a `.env` file in the backend directory and add:

```
DB_HOST=<YOUR_DB_HOST>
DB_USER=<YOUR_DB_USER>
DB_PASSWORD=<YOUR_DB_PASSWORD>
DB_NAME=<YOUR_DB_NAME>
JWT_SECRET=<YOUR_SECRET_KEY>
```

---

## Default Login Credentials

Use the following credentials to login:

* Customer:

  * Username: `<ADD_USERNAME>`
  * Password: `<ADD_PASSWORD>`

* Freelancer:

  * Username: `<ADD_USERNAME>`
  * Password: `<ADD_PASSWORD>`

---

## Key Functionalities

### User Authentication

Secure login and registration system with role-based access control.

### Freelancer Profile Management

Freelancers can manage their skills, pricing, and availability.

### Smart Matching System

Filters freelancers based on:

* Location
* Skills
* Availability

### Booking Workflow

Customers can send booking requests which freelancers can accept or reject.

### Availability Management

Ensures no overlapping bookings by validating time slots.

### Reviews & Ratings

Customers can rate freelancers after successful booking completion.

---

## Challenges & Solutions

| Challenge            | Solution                                   |
| -------------------- | ------------------------------------------ |
| Overlapping bookings | Implemented availability validation system |
| Data security        | Used encryption and JWT authentication     |
| Location accuracy    | Implemented location-based filtering       |
| System scalability   | Designed 3-tier architecture               |

---

## Future Enhancements

* Real-time chat between customer and freelancer
* Payment gateway integration (Razorpay/Stripe)
* Mobile application (React Native)
* AI-based freelancer recommendation system
* Portfolio uploads for freelancers

---

## Screenshots

(Add screenshots here)

---

## Conclusion

The **FreelanceConnect** project demonstrates a scalable and efficient platform for connecting local freelancers with customers. By integrating modern frontend technologies with a robust backend and structured database, the system ensures reliability, security, and ease of use in real-world scenarios.

---
