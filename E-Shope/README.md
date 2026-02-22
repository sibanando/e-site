# ShopVibe E-commerce Site

A complete e-commerce solution built with React (Vite), Node.js (Express), MySQL, and Docker.

## Features

- **Product Catalog**: View latest products with details.
- **Shopping Cart**: Manage your items, update quantities.
- **User Authentication**: Register and Login functionality.
- **Checkout**:
  - **PhonePe Integration** (Mock)
  - **Google Pay Integration** (Mock)
  - **UPI QR Code**: Dynamic QR code generation for payments.
- **Admin Panel**: Manage products and view orders.
- **Rich Aesthetics**: Modern, dark-themed UI with glassmorphism effects.

## Prerequisites

- Docker Desktop (must be running)
- Git (optional)

## How to Run

1.  **Start Docker Desktop** on your machine.
2.  Open a terminal in the project root (`E-Shope`).
3.  Run the following command:

    ```bash
    docker compose up --build
    ```

4.  Wait for the services to start. You can view logs to see when the backend connects to MySQL.
5.  Access the application:
    -   **Frontend**: [http://localhost:5173](http://localhost:5173)
    -   **Backend API**: [http://localhost:5000](http://localhost:5000)
    -   **MySQL**: Port 3307 (User: root, Pass: password)

## Project Structure

-   `frontend/`: React application (Vite).
-   `backend/`: Node.js Express server.
-   `docker-compose.yml`: Docker orchestration.

## Payment Features

-   Select **PhonePe** or **Google Pay** in checkout to simulate a transaction.
-   Select **UPI QR Code** to generate a QR code string (`upi://...`) and display it.

## Admin

-   Navigate to `/admin` to add products (requires login).

## Notes

-   The initial database is seeded with dummy products.
-   Authentication uses JWT stored in LocalStorage.
