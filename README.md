# Identity Reconciliation

A TypeScript-based REST API service that performs contact identity reconciliation by linking and consolidating contact information across email addresses and phone numbers.

## Overview

This service helps identify and link contacts who may have provided different combinations of email addresses and phone numbers across multiple interactions. It maintains a primary-secondary contact hierarchy to consolidate all known contact information for a person.

## Features

- **Contact Identification**: Links contacts based on shared email addresses or phone numbers
- **Primary-Secondary Hierarchy**: Maintains a hierarchical structure with one primary contact and multiple secondary contacts
- **Data Consolidation**: Automatically merges contact networks when connections are discovered
- **Input Validation**: Validates and normalizes email addresses and phone numbers
- **Database Transactions**: Ensures data consistency with atomic database operations

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite with Prisma ORM
- **Validation**: Custom email and phone number validation
- **Architecture**: Clean architecture with controllers, services, and data layers

## Project Structure

```
src/
├── controllers/
│   └── identifyController.ts    # HTTP request handling and validation
├── services/
│   └── contactService.ts        # Core business logic for contact reconciliation
├── utils/
│   └── prismaClient.ts         # Database client configuration
├── generated/
│   └── prisma/                 # Generated Prisma client
├── types.ts                    # TypeScript type definitions
└── server.ts                   # Express server setup and configuration

prisma/
├── schema.prisma               # Database schema definition
├── migrations/                 # Database migration files
└── dev.db                     # SQLite database file
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   PORT=3000
   ```

4. **Generate Prisma client**
   ```bash
   npm run prisma:generate
   ```

5. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

## Usage

### Development

Start the development server with hot reload:
```bash
npm run dev
```

### Production

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

The server will be available at `http://localhost:3000`

## API Endpoints

### POST /identify

Identifies and reconciles contact information.

**Request Body:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "1234567890"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["user@example.com", "user.alt@example.com"],
    "phoneNumbers": ["1234567890", "0987654321"],
    "secondaryContactIds": [2, 3]
  }
}
```

**Validation Rules:**
- At least one of `email` or `phoneNumber` must be provided
- Email must be in valid format (regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`)
- Phone number must be 6-15 digits (spaces, hyphens, parentheses, and plus signs are stripped)

### GET /

Health check endpoint that returns service status.

## How It Works

### Contact Reconciliation Logic

1. **Input Validation**: Validates and normalizes email and phone number inputs
2. **Direct Matching**: Finds existing contacts with matching email or phone number
3. **Network Discovery**: Identifies all contacts linked to the matched contacts
4. **Primary Contact Resolution**: Determines the primary contact (oldest in the network)
5. **Secondary Contact Creation**: Creates new secondary contacts for new information
6. **Network Consolidation**: Merges multiple primary contacts into a single network
7. **Response Building**: Returns consolidated contact information

### Database Schema

The `Contact` model includes:
- `id`: Unique identifier
- `email`: Contact's email address (optional)
- `phoneNumber`: Contact's phone number (optional)
- `linkedId`: Reference to primary contact (null for primary contacts)
- `linkPrecedence`: Either "primary" or "secondary"
- `createdAt`, `updatedAt`, `deletedAt`: Timestamps for lifecycle management

### Example Scenarios

1. **New Contact**: Creates a new primary contact
2. **Existing Contact**: Returns existing contact network
3. **Network Merge**: Links two separate networks when a connection is discovered
4. **Additional Information**: Creates secondary contacts for new email/phone combinations

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations

## Error Handling

The service includes comprehensive error handling:
- **400 Bad Request**: Invalid input format or missing required fields
- **500 Internal Server Error**: Server-side errors
- **503 Service Unavailable**: Database connection issues
