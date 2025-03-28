# TrustBridge Backend Setup Guide

This document provides a step-by-step guide for initializing the backend project, ensuring consistency and a smooth development workflow.

## Prerequisites

Ensure you have the following installed on your system:

- Node.js (v16 or higher)
- npm (comes with Node.js)
- PostgreSQL (v12 or higher)
- Git

## Project Setup

### 1. Clone the Repository

Clone the project to your local machine:

```bash
git clone https://github.com/TrustBridgeCR/backend-TrustBridgeCR.git
cd backend-TrustBridgeCR
```

### 2. Install Dependencies

Install all required dependencies by running the following command:

```bash
npm install
```

### 3. Environment Configuration

#### 3.1 Create a `.env` File

Create a `.env` file in the root directory based on the provided `.env.example` file:

```bash
cp .env.example .env
```

#### 3.2 Define Environment Variables

Open the `.env` file and configure the following variables:

```env
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/<database_name>
PORT=4000
JWT_SECRET=your_secret_key
```

- Replace `<username>` with your PostgreSQL username.
- Replace `<password>` with your PostgreSQL password.
- Replace `<database_name>` with the name of your database.

### 4. Database Setup

#### 4.1 Start PostgreSQL

Ensure your PostgreSQL server is running. For macOS users with Homebrew, you can start it using:

```bash
brew services start postgresql
```

#### 4.2 Create the Database

If the database specified in `DATABASE_URL` does not exist, create it using the following command:

```bash
createdb -h localhost -U <username> <database_name>
```
- Replace `<username>` with your PostgreSQL username.
- Replace `<database_name>` with the name of your database.
Install all required dependencies:

npm install
#### 4.3 Run Database Migrations

Apply the database migrations to set up the necessary tables and schema:

```bash
npm run migrate
```

#### 4.4 Initialize Prisma
Run the following command to initialize Prisma in your project:
```bash
npx prisma init
```
#### 4.5 Run Migrations

Apply the initial database schema to your database:

```bash
npx prisma migrate dev --name init
```

#### 4.6 Generate Prisma Client

Generate the Prisma Client to interact with your database:

```bash
npx prisma generate
```


### 5. Start the Development Server

Start the backend development server using the following command:

```bash
npm run dev
```

The server should now be running at `http://localhost:4000`.

### 6. Testing the Setup

#### 6.1 API Health Check

Verify the server is running by accessing the health check endpoint:

```bash
http://localhost:4000/api/health
```

You should receive a response indicating the server is operational.

#### 6.2 Running Tests

Run the test suite to ensure everything is working as expected:

```bash
npm test
```

### 7. Additional Notes

- For production deployment, ensure you configure environment variables securely.
- Use a process manager like PM2 or Docker for managing the application in production environments.
- Regularly update dependencies to avoid security vulnerabilities.

### Troubleshooting

If you encounter any issues during setup, refer to the following:

- Check the logs for detailed error messages.
- Ensure all prerequisites are installed and properly configured.
- Verify the `.env` file contains the correct values.

For further assistance, consult the project documentation or reach out to the development team.
