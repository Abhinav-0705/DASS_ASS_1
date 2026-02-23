# API Documentation - New Features

## Overview
This document covers the new features added to the Felicity Event Management System:
- User onboarding with preferences (Section 5)
- Extended user data models (Section 6)
- Event types and management (Sections 7 & 8)
- Event registration system

---

## 📝 Table of Contents
1. [Participant Preferences](#participant-preferences)
2. [Participant Profile](#participant-profile)
3. [Events API](#events-api)
4. [Registrations API](#registrations-api)
5. [Updated Models](#updated-models)

---

## Participant Preferences

### Update Preferences
**Endpoint:** `PUT /api/participant/preferences`  
**Auth Required:** Yes (Participant only)  
**Description:** Update areas of interest and followed organizers

**Request Body:**
```json
{
  "areasOfInterest": ["technology", "sports", "music", "cultural"],
  "followedOrganizers": ["organizer_id_1", "organizer_id_2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "preferences": {
    "areasOfInterest": ["technology", "sports"],
    "followedOrganizers": ["..."],
    "onboardingCompleted": true
  }
}
```

### Get Preferences
**Endpoint:** `GET /api/participant/preferences`  
**Auth Required:** Yes (Participant only)

### Skip Onboarding
**Endpoint:** `POST /api/participant/skip-onboarding`  
**Auth Required:** Yes (Participant only)  
**Description:** Mark onboarding as completed without setting preferences

### Get Available Organizers
**Endpoint:** `GET /api/participant/organizers`  
**Auth Required:** Yes (Participant only)  
**Description:** Get list of organizers to follow

---

## Participant Profile

### Get Profile
**Endpoint:** `GET /api/participant/profile`  
**Auth Required:** Yes (Participant only)

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@iiit.ac.in",
    "participantType": "iiit",
    "collegeOrOrgName": "IIIT Hyderabad",
    "contactNumber": "9876543210",
    "preferences": {...}
  }
}
```

### Update Profile
**Endpoint:** `PUT /api/participant/profile`  
**Auth Required:** Yes (Participant only)

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "collegeOrOrgName": "IIIT Hyderabad",
  "contactNumber": "9876543210"
}
```

---

## Events API

### Create Event
**Endpoint:** `POST /api/events`  
**Auth Required:** Yes (Organizer only)

**Request Body (Normal Event):**
```json
{
  "eventName": "Web Development Workshop",
  "eventDescription": "Learn React and Node.js",
  "eventType": "normal",
  "eligibility": "all",
  "registrationDeadline": "2026-03-01T23:59:59.000Z",
  "eventStartDate": "2026-03-05T10:00:00.000Z",
  "eventEndDate": "2026-03-05T17:00:00.000Z",
  "registrationLimit": 100,
  "registrationFee": 0,
  "eventTags": ["technology", "workshop", "web"],
  "venue": "Lecture Hall 1",
  "venueType": "offline",
  "customRegistrationForm": [
    {
      "fieldName": "github_username",
      "fieldType": "text",
      "fieldLabel": "GitHub Username",
      "placeholder": "Enter your GitHub username",
      "required": true,
      "order": 1
    },
    {
      "fieldName": "experience_level",
      "fieldType": "select",
      "fieldLabel": "Experience Level",
      "required": true,
      "options": ["Beginner", "Intermediate", "Advanced"],
      "order": 2
    }
  ]
}
```

**Request Body (Merchandise Event):**
```json
{
  "eventName": "Felicity 2026 T-Shirt",
  "eventDescription": "Official event merchandise",
  "eventType": "merchandise",
  "eligibility": "all",
  "registrationDeadline": "2026-02-28T23:59:59.000Z",
  "eventStartDate": "2026-03-01T00:00:00.000Z",
  "eventEndDate": "2026-03-15T23:59:59.000Z",
  "registrationLimit": 500,
  "registrationFee": 0,
  "eventTags": ["merchandise", "tshirt"],
  "merchandiseDetails": {
    "itemName": "Felicity 2026 T-Shirt",
    "variants": [
      {
        "size": "M",
        "color": "Black",
        "stockQuantity": 50,
        "price": 499
      },
      {
        "size": "L",
        "color": "Black",
        "stockQuantity": 75,
        "price": 499
      },
      {
        "size": "XL",
        "color": "White",
        "stockQuantity": 30,
        "price": 499
      }
    ],
    "purchaseLimitPerParticipant": 2
  }
}
```

### Get All Events
**Endpoint:** `GET /api/events`  
**Auth Required:** No

**Query Parameters:**
- `eventType` - Filter by type (normal/merchandise)
- `status` - Filter by status (draft/published/ongoing/completed/cancelled)
- `organizerId` - Filter by organizer
- `tags` - Comma-separated tags
- `search` - Text search in name and description
- `sortBy` - Sort field (default: eventStartDate)
- `order` - Sort order (asc/desc)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Example:** `GET /api/events?status=published&tags=technology,workshop&page=1&limit=20`

### Get Personalized Recommendations
**Endpoint:** `GET /api/events/recommendations/for-me`  
**Auth Required:** Yes (Participant only)  
**Description:** Get event recommendations based on preferences

### Get Single Event
**Endpoint:** `GET /api/events/:id`  
**Auth Required:** No

### Update Event
**Endpoint:** `PUT /api/events/:id`  
**Auth Required:** Yes (Organizer - owner only)

### Delete Event
**Endpoint:** `DELETE /api/events/:id`  
**Auth Required:** Yes (Organizer - owner only)  
**Note:** Cannot delete events with existing registrations

### Publish Event
**Endpoint:** `PATCH /api/events/:id/publish`  
**Auth Required:** Yes (Organizer - owner only)  
**Description:** Change event status from draft to published

### Get Events by Organizer
**Endpoint:** `GET /api/events/organizer/:organizerId`  
**Auth Required:** No

---

## Registrations API

### Register for Event
**Endpoint:** `POST /api/registrations`  
**Auth Required:** Yes (Participant only)

**Request Body (Normal Event):**
```json
{
  "eventId": "event_id_here",
  "formResponses": {
    "github_username": "johndoe",
    "experience_level": "Intermediate"
  }
}
```

**Request Body (Merchandise Event):**
```json
{
  "eventId": "event_id_here",
  "merchandiseOrder": {
    "size": "L",
    "color": "Black",
    "quantity": 1
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "registration": {
    "id": "...",
    "eventId": {...},
    "participantId": {...},
    "status": "confirmed",
    "paymentStatus": "pending",
    "paymentAmount": 499
  }
}
```

### Get My Registrations
**Endpoint:** `GET /api/registrations/my-registrations`  
**Auth Required:** Yes (Participant only)

**Query Parameters:**
- `status` - Filter by status (pending/confirmed/cancelled/waitlisted)

### Get Event Registrations (Organizer)
**Endpoint:** `GET /api/registrations/event/:eventId`  
**Auth Required:** Yes (Organizer - owner only)

**Query Parameters:**
- `status` - Filter by registration status
- `paymentStatus` - Filter by payment status

### Cancel Registration
**Endpoint:** `DELETE /api/registrations/:id`  
**Auth Required:** Yes (Participant - owner only)

### Check-in Participant
**Endpoint:** `PATCH /api/registrations/:id/checkin`  
**Auth Required:** Yes (Organizer)

---

## Updated Models

### User Model (Participant - Section 6.1)
```javascript
{
  firstName: String,          // Required
  lastName: String,           // Required
  email: String,              // Required, unique
  password: String,           // Required, hashed
  participantType: String,    // 'iiit' or 'non-iiit'
  collegeOrOrgName: String,   // Required
  contactNumber: String,      // Required, 10 digits
  preferences: {
    areasOfInterest: [String],
    followedOrganizers: [ObjectId],
    onboardingCompleted: Boolean
  }
}
```

### User Model (Organizer - Section 6.2)
```javascript
{
  organizerName: String,      // Required
  email: String,              // Required, unique
  password: String,           // Required, hashed
  category: String,           // 'club', 'council', 'fest_team', 'department', 'other'
  description: String,        // Required
  contactEmail: String,       // Required
  createdBy: ObjectId         // Admin who created
}
```

### Event Model (Sections 7 & 8)
```javascript
{
  eventName: String,
  eventDescription: String,
  eventType: String,          // 'normal' or 'merchandise'
  eligibility: String,        // 'iiit_only', 'all', 'external_only'
  registrationDeadline: Date,
  eventStartDate: Date,
  eventEndDate: Date,
  registrationLimit: Number,
  registrationFee: Number,
  organizerId: ObjectId,
  eventTags: [String],
  status: String,             // 'draft', 'published', 'ongoing', 'completed', 'cancelled'
  currentRegistrations: Number,
  
  // For normal events
  customRegistrationForm: [{
    fieldName, fieldType, fieldLabel, placeholder,
    required, options, validation, order
  }],
  
  // For merchandise events
  merchandiseDetails: {
    itemName: String,
    variants: [{
      size, color, additionalInfo,
      stockQuantity, price
    }],
    purchaseLimitPerParticipant: Number,
    totalStock: Number
  },
  
  venue: String,
  venueType: String,          // 'online', 'offline', 'hybrid'
  venueLink: String,
  eventImage: String,
  viewCount: Number
}
```

### Registration Model
```javascript
{
  eventId: ObjectId,
  participantId: ObjectId,
  status: String,             // 'pending', 'confirmed', 'cancelled', 'waitlisted'
  formResponses: Map,         // Custom form responses
  merchandiseOrder: {         // For merchandise events
    variantId: ObjectId,
    quantity: Number,
    size: String,
    color: String,
    totalPrice: Number
  },
  paymentStatus: String,      // 'pending', 'completed', 'failed', 'refunded'
  paymentAmount: Number,
  checkedIn: Boolean,
  checkInTime: Date
}
```

---

## Updated Registration Flow

### For Participants:
1. Register with all required fields (firstName, lastName, email, etc.)
2. Set preferences during onboarding OR skip onboarding
3. Browse events (get personalized recommendations)
4. Register for events
5. View and manage registrations
6. Update profile and preferences anytime

### For Organizers:
1. Admin creates organizer account with new fields
2. Organizer logs in
3. Create events (normal or merchandise)
4. Publish events
5. View registrations
6. Check-in participants

---

## Testing Examples

### Register a Participant
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@iiit.ac.in",
    "password": "password123",
    "participantType": "iiit",
    "collegeOrOrgName": "IIIT Hyderabad",
    "contactNumber": "9876543210",
    "areasOfInterest": ["technology", "sports"]
  }'
```

### Create an Event
```bash
curl -X POST http://localhost:5001/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ORGANIZER_TOKEN" \
  -d '{
    "eventName": "Tech Workshop",
    "eventDescription": "Learn new technologies",
    "eventType": "normal",
    "eligibility": "all",
    "registrationDeadline": "2026-03-01T23:59:59.000Z",
    "eventStartDate": "2026-03-05T10:00:00.000Z",
    "eventEndDate": "2026-03-05T17:00:00.000Z",
    "registrationLimit": 50,
    "registrationFee": 0,
    "eventTags": ["technology"],
    "customRegistrationForm": [
      {
        "fieldName": "skill_level",
        "fieldType": "select",
        "fieldLabel": "Skill Level",
        "required": true,
        "options": ["Beginner", "Intermediate", "Advanced"],
        "order": 1
      }
    ]
  }'
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

Error response format:
```json
{
  "message": "Error description here"
}
```
