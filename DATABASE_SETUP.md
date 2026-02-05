# Database Setup Guide

You're getting a database connection error because PostgreSQL isn't running locally. Here are your options:

## Option 1: Use Neon (Free Cloud PostgreSQL) - RECOMMENDED ⭐

This is the easiest and fastest way to get started:

1. **Go to [Neon](https://neon.tech)** and sign up (free tier available)
2. **Create a new project**:
   - Click "Create a project"
   - Choose a name (e.g., "airtable-clone")
   - Select a region close to you
   - Click "Create project"
3. **Copy the connection string**:
   - After creating the project, you'll see a connection string that looks like:
     ```
     postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   - Click "Copy" to copy the full connection string
4. **Update your .env file**:
   - Replace the `DATABASE_URL` in your `.env` file with the Neon connection string
   - It should look like:
     ```
     DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
     ```

## Option 2: Install PostgreSQL Locally

If you prefer to run PostgreSQL on your machine:

### Windows:
1. **Download PostgreSQL**:
   - Go to https://www.postgresql.org/download/windows/
   - Download the installer
   - Run the installer and follow the setup wizard
   - Remember the password you set for the `postgres` user
   - Default port is 5432

2. **Update your .env file**:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/airtable_clone"
   ```

3. **Create the database**:
   - Open pgAdmin (comes with PostgreSQL) or use psql
   - Create a new database called `airtable_clone`

### Using Docker (Alternative):
If you have Docker installed:
```bash
docker run --name postgres-airtable -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=airtable_clone -p 5432:5432 -d postgres
```

Then update .env:
```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/airtable_clone"
```

## After Setting Up Database

Once you have your `DATABASE_URL` configured in `.env`, run:

```bash
npm run db:push
```

This will create all the necessary tables in your database.

## Verify Connection

You can test the connection by running:
```bash
npm run db:studio
```

This opens Prisma Studio where you can view your database tables.
