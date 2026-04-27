# 💊 PharmaDesk — DRHMS Integrated Pharmacy Management System

A full-stack web application for end-to-end pharmacy operations — sales, prescriptions, billing, inventory replenishment, and performance tracking. Built with **React + Vite** on the frontend and **Java** on the backend.

---

## 📋 Table of Contents

- [About the Project](#about-the-project)
- [Modules](#modules)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
- [User Roles & Access Control](#user-roles--access-control)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

---

## 📌 About the Project

**PharmaDesk** is a DRHMS-integrated Pharmacy Management System designed to handle the complete lifecycle of pharmacy operations — from direct sales and prescription dispensing to medicine returns, replenishment, billing, and sales performance analytics. It provides a clean, responsive sidebar-based UI and a robust Java backend API.

---

## 🗂 Modules

PharmaDesk includes **18 functional modules**:

| # | Module | Description |
|---|---|---|
| 1 | 🛒 **Direct Pharmacy Sales** | Process walk-in and counter sales directly |
| 2 | ↩️ **Direct Medicine Returns** | Handle over-the-counter medicine return requests |
| 3 | 📋 **Return Worklists** | View and process pending medicine return tasks |
| 4 | 💉 **Dispense Worklists** | Manage queued medicine dispensing tasks |
| 5 | 📄 **Pending Prescriptions** | Review and fulfill doctor-issued prescriptions |
| 6 | 📑 **Pending Indent Pres.** | Process pending indent-based prescription orders |
| 7 | 🔁 **Pending Pharmacy Rep.** | Track pending pharmacy replenishment requests |
| 8 | 📦 **Pending Rep. Returns** | Manage returns from replenishment orders |
| 9 | 💵 **Consolidated Bills** | View and manage grouped/consolidated patient bills |
| 10 | 💳 **Pharmacy Advances** | Track advance payments made by patients |
| 11 | ✅ **Pharmacy Clearance** | Process pharmacy clearance before patient discharge |
| 12 | 🔄 **Medicine Credit Returns** | Manage credit-based medicine return transactions |
| 13 | 📊 **Product Sales Perf.** | Analyse product-level sales performance reports |
| 14 | 🔐 **Role-Based Access Control** | Admin, Medicine User, and Billing User roles |
| 15 | 💊 **Medicine Inventory** | Add, edit, and track medicines with stock levels |
| 16 | ⚠️ **Low Stock Alerts** | Notifies when medicine quantity falls below threshold |
| 17 | 📅 **Expiry Tracking** | Flag medicines nearing or past their expiry date |
| 18 | 👥 **User Management** | Admin can create and manage staff accounts |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Styling |
| ESLint | Code linting |

### Backend
| Technology | Purpose |
|---|---|
| Java | Core backend language |
| REST API | Client-server communication |

---

## 📁 Project Structure

```
PMS/
├── backend/               # Java backend (REST API)
│   └── ...
├── public/                # Static assets
├── src/                   # React frontend source
│   ├── components/        # Reusable UI components
│   ├── pages/             # Page-level components
│   ├── assets/            # Images, icons
│   └── main.jsx           # App entry point
├── index.html             # HTML entry point
├── package.json           # Frontend dependencies
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
├── eslint.config.js       # ESLint configuration
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18 or above
- [npm](https://www.npmjs.com/) v9 or above
- [Java JDK](https://www.oracle.com/java/technologies/downloads/) 17 or above
- [Git](https://git-scm.com/)

---

### Frontend Setup

```bash
# 1. Clone the repository
git clone https://github.com/Eakhalaivan/PMS.git

# 2. Navigate to the project directory
cd PMS

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Build and run the Java backend
# (Update this section based on your build tool: Maven or Gradle)

# If using Maven:
mvn clean install
mvn spring-boot:run

# If using Gradle:
./gradlew build
./gradlew bootRun
```

The backend API will run at `http://localhost:8080` (update port if different).

---

## 👥 User Roles & Access Control

| Role | Description | Permissions |
|---|---|---|
| **Admin** | Full system access | Manage users, medicines, billing, reports, settings |
| **Medicine User** | Pharmacy/stock staff | Add medicines to inventory only |
| **Billing User** | Billing/cashier staff | Create and view billing records only |

> Any unauthorized access attempt will show: `"Access Denied: You do not have permission to access this module."`

---

## 🔐 Environment Variables

Create a `.env` file in the root of the project and add the following:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

---

## 📦 Scripts

Run these commands from the root directory:

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "Add your message"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Eakhalaivan**
- GitHub: [@Eakhalaivan](https://github.com/Eakhalaivan)

---

> Built with ❤️ for better pharmacy operations.
