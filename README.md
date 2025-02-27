# Credit-Based Document Scanning System

A comprehensive document scanning and matching system with an integrated credit system. Users can upload text documents for scanning and matching against existing documents, with a daily limit of free scans.

## Features

- User authentication (login and registration)
- Document scanning and similarity matching
- Text-based similarity analysis with AI integration (Google Gemini)
- Credit-based usage system with daily limits
- Admin dashboard with analytics and user management
- Export functionality for scan history and analytics
- Activity logging and monitoring

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite
- **Frontend**: HTML, CSS, JavaScript (with Tailwind CSS)
- **Authentication**: JWT-based
- **AI Integration**: Google Gemini for enhanced document analysis

## Prerequisites

- Node.js (v16.x or later)
- npm or yarn
- Web browser (Chrome, Firefox, Safari, or Edge)

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/Gyanesh-Rao28/cathago-backend.git
   cd cathago-backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Environment Variables

   Create a `.env` file in the root directory with the following variables:

   ```env
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Run to create **mydata.db** file
   ```bash
   New-Item mydata.db -ItemType File
   ```

5. Start the server
   ```bash
   npm run dev
   ```

6. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## System Architecture

The application is organized into the following main components:

- **Authentication System**: Handles user registration, login, and JWT token management
- **Document Scanner**: Processes uploaded documents and performs similarity analysis
- **Credit System**: Manages user credits, daily limits, and credit requests
- **Admin Dashboard**: Provides analytics, user management, and system monitoring
- **Frontend Interface**: User-friendly interface for all system functionalities

## API Endpoints

### Authentication Endpoints

#### 1. Register User
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Content-Type**: `application/json`

**Request Body**
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**Success Response**
- **Code**: 201 CREATED
- **Content**:
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "testuser",
    "credits": 20,
    "role": "user"
  }
}
```

#### 2. User Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Content-Type**: `application/json`

**Request Body**
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**Success Response**
- **Code**: 200 OK
- **Content**:
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "testuser",
    "credits": 20,
    "role": "user"
  }
}
```

#### 3. Get User Profile
- **URL**: `/api/auth/user/profile`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer your_jwt_token`

**Success Response**
- **Code**: 200 OK
- **Content**:
```json
{
  "message": "User profile retrieved successfully",
  "profile": {
    "id": 1,
    "username": "testuser",
    "role": "user",
    "credits": 20,
    "last_reset": "2025-02-24T00:00:00.000Z",
    "scans": [
      {
        "id": 1,
        "scan_date": "2025-02-24T12:34:56.789Z",
        "filename": "document.txt"
      }
    ],
    "creditRequests": [
      {
        "id": 1,
        "request_date": "2025-02-24T12:34:56.789Z",
        "status": "pending",
        "amount": 10
      }
    ]
  }
}
```

### Document Scanning Endpoints

#### 1. Upload and Scan Document
- **URL**: `/api/scan/upload`
- **Method**: `POST`
- **Headers**: 
  - `Authorization: Bearer your_jwt_token`
- **Content-Type**: `multipart/form-data`

**Request**
- Form data with key `document` containing a text file

**Query Parameters**
- `useAI`: Set to `true` to enable AI-based scanning (optional)

**Success Response**
- **Code**: 200 OK
- **Content**:
```json
{
  "message": "Document scanned successfully",
  "scan": {
    "id": 1,
    "documentId": 1,
    "filename": "example.txt",
    "scanDate": "2025-02-24T12:34:56.789Z"
  },
  "matchResults": [
    {
      "id": 1,
      "matched_doc_id": 2,
      "similarity_score": 85.4,
      "matched_document_name": "similar_document.txt"
    }
  ],
  "userCredits": 19
}
```

#### 2. Get Document Matches
- **URL**: `/api/scan/matches/:docId`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer your_jwt_token`

**Success Response**
- **Code**: 200 OK
- **Content**:
```json
{
  "message": "Match results retrieved successfully",
  "document": {
    "id": 1,
    "filename": "example.txt",
    "uploadDate": "2025-02-24T12:34:56.789Z"
  },
  "scanId": 1,
  "matches": [
    {
      "id": 1,
      "matched_doc_id": 2,
      "similarity_score": 85.4,
      "matched_document_name": "similar_document.txt"
    }
  ]
}
```

#### 3. Get Scan History
- **URL**: `/api/scan/history`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer your_jwt_token`

**Success Response**
- **Code**: 200 OK
- **Content**:
```json
{
  "message": "User scans retrieved successfully",
  "scans": [
    {
      "id": 1,
      "scan_date": "2025-02-24T12:34:56.789Z",
      "document_id": 1,
      "filename": "example.txt"
    }
  ]
}
```

### Credit Management Endpoints

#### 1. Request Credits
- **URL**: `/api/credits/request`
- **Method**: `POST`
- **Headers**: 
  - `Authorization: Bearer your_jwt_token`
- **Content-Type**: `application/json`

**Request Body**
```json
{
  "amount": 10
}
```

**Success Response**
- **Code**: 201 CREATED
- **Content**:
```json
{
  "message": "Credit request submitted successfully",
  "request": {
    "id": 1,
    "userId": 1,
    "amount": 10,
    "status": "pending",
    "requestDate": "2025-02-24T12:34:56.789Z"
  }
}
```

#### 2. Get Pending Credit Requests (Admin)
- **URL**: `/api/credits/pending`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer admin_jwt_token`

**Success Response**
- **Code**: 200 OK
- **Content**:
```json
{
  "message": "Pending credit requests retrieved successfully",
  "requests": [
    {
      "id": 1,
      "user_id": 2,
      "request_date": "2025-02-24T12:34:56.789Z",
      "status": "pending",
      "amount": 10,
      "username": "testuser"
    }
  ]
}
```

#### 3. Approve Credit Request (Admin)
- **URL**: `/api/credits/approve/:requestId`
- **Method**: `POST`
- **Headers**: 
  - `Authorization: Bearer admin_jwt_token`

**Success Response**
- **Code**: 200 OK
- **Content**:
```json
{
  "message": "Credit request approved successfully",
  "result": {
    "requestId": 1,
    "userId": 2,
    "previousCredits": 5,
    "currentCredits": 15,
    "amountAdded": 10
  }
}
```

### Admin Endpoints

#### 1. Get Analytics Dashboard
- **URL**: `/api/admin/analytics`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer admin_jwt_token`

**Success Response**
- **Code**: 200 OK
- **Content**:
```json
{
  "message": "Analytics dashboard data retrieved successfully",
  "dashboard": {
    "systemStats": {
      "totalUsers": 10,
      "totalDocuments": 50,
      "totalScans": 120,
      "avgSimilarityScore": 65.4
    },
    "topUsersByScan": [
      {"id": 2, "username": "user1", "scanCount": 25}
    ],
    "topUsersByCredit": [
      {"id": 3, "username": "user2", "creditsUsed": 40}
    ],
    "dailyScanActivity": [
      {"date": "2025-02-24", "scanCount": 15}
    ],
    "documentTopics": [
      {"topic": "Technology", "confidence": 85}
    ]
  }
}
```

#### 2. Export Analytics
- **URL**: `/api/admin/export/analytics`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer admin_jwt_token`
- **Query Parameters**:
  - `format`: "json" or "csv" (default: "json")

**Success Response**
- **Code**: 200 OK
- **Content-Type**: `application/json` or `application/zip`
- Downloads a file with analytics data

#### 3. Get Users (Admin)
- **URL**: `/api/admin/users`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer admin_jwt_token`

**Success Response**
- **Code**: 200 OK
- **Content**:
```json
{
  "message": "Users retrieved successfully",
  "users": [
    {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "credits": 20,
      "documentCount": 5
    },
    {
      "id": 2,
      "username": "testuser",
      "role": "user",
      "credits": 15,
      "documentCount": 10
    }
  ]
}
```

## Usage Examples

### Regular User Workflow

1. **Register a new account**
2. **Login to the system**
3. **Upload a document for scanning**
   - System deducts 1 credit
   - System compares document with existing documents
   - System returns matching results
4. **View scan history**
   - See all previous scans and their results
5. **Request additional credits when needed**
   - Submit a request to admin
   - Wait for approval

### Admin Workflow

1. **Login with admin credentials**
2. **View analytics dashboard**
   - See system-wide statistics
   - Monitor top users and activity
3. **Manage credit requests**
   - Approve or deny user requests for additional credits
4. **View system activity logs**
   - Monitor all user actions
5. **Export reports**
   - Generate analytics reports or activity logs

## Development

### Adding New Features

1. Create backend route handlers in the appropriate controller files
2. Update the routes in the corresponding route files
3. Create frontend components in the `public/components` directory
4. Update the main app to include new components

### Database Schema

The system uses SQLite with the following tables:
- `users`: User accounts and credentials
- `documents`: Uploaded documents
- `scan_history`: Record of document scans
- `match_results`: Document similarity matches
- `credit_requests`: User requests for additional credits
- `activity_logs`: System activity logging

## Troubleshooting

### Common Issues

1. **JWT token expired or invalid**
   - Solution: Re-login to get a new token

2. **Insufficient credits for scanning**
   - Solution: Request additional credits or wait for daily reset

3. **Database errors**
   - Solution: Check database integrity or reset the database file

## License

This project is licensed under the MIT License - see the LICENSE file for details.
