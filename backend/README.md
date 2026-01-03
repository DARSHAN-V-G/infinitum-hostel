# API Documentation

## Base URL
`http://localhost:3000/api/acc`

## Rooms API

### Create Room
- **Method**: POST
- **Endpoint**: `/rooms/`
- **Description**: Create a new room with specified name and capacity
- **Request Body**:
  ```json
  {
    "RoomName": "string (required)",
    "Capacity": "number (required, positive integer)"
  }
  ```
- **Responses**:
  - **201 Created**: Room created successfully
    ```json
    {
      "success": true,
      "message": "Room created successfully",
      "data": {
        "_id": "room_id",
        "RoomName": "Room Name",
        "members": [],
        "Capacity": 4
      }
    }
    ```
  - **400 Bad Request**: Validation error or room already exists
    ```json
    {
      "success": false,
      "message": "Room with this name already exists" | "Validation error",
      "errors": [
        {
          "code": "invalid_type",
          "expected": "string",
          "received": "undefined",
          "path": ["RoomName"],
          "message": "Room name is required"
        }
      ]
    }
    ```
  - **500 Internal Server Error**: Server error
    ```json
    {
      "success": false,
      "message": "Error creating room",
      "error": "error message"
    }
    ```

### Add Member to Room
- **Method**: POST
- **Endpoint**: `/rooms/add-member`
- **Description**: Add a member to an existing room
- **Request Body**:
  ```json
  {
    "uniqueId": "string (required)",
    "email": "string (required, valid email)",
    "roomName": "string (required)"
  }
  ```
- **Responses**:
  - **200 OK**: Member added successfully
    ```json
    {
      "success": true,
      "message": "Member added successfully",
      "data": { room object },
      "currentOccupancy": 3,
      "capacity": 4,
      "isOverCapacity": false
    }
    ```
  - **400 Bad Request**: Validation error or member already exists
    ```json
    {
      "success": false,
      "message": "Member already exists in this room" | "Validation error",
      "errors": [validation errors]
    }
    ```
  - **404 Not Found**: Room not found
    ```json
    {
      "success": false,
      "message": "Room not found"
    }
    ```
  - **500 Internal Server Error**: Server error

### Get All Rooms
- **Method**: GET
- **Endpoint**: `/rooms/`
- **Description**: Retrieve all rooms
- **Request Body**: None
- **Responses**:
  - **200 OK**: Rooms retrieved successfully
    ```json
    {
      "success": true,
      "count": 5,
      "data": [
        {
          "_id": "room_id",
          "RoomName": "Room 101",
          "members": [
            {
              "uniqueId": "user123",
              "email": "user@example.com"
            }
          ],
          "Capacity": 4
        }
      ]
    }
    ```
  - **500 Internal Server Error**: Server error

### Get Room by ID
- **Method**: GET
- **Endpoint**: `/rooms/:id`
- **Description**: Retrieve a specific room by its MongoDB ID
- **Request Body**: None
- **Parameters**:
  - `id` (path): Room's MongoDB ObjectId
- **Responses**:
  - **200 OK**: Room retrieved successfully
    ```json
    {
      "success": true,
      "data": {
        "_id": "room_id",
        "RoomName": "Room 101",
        "members": [...],
        "Capacity": 4
      }
    }
    ```
  - **404 Not Found**: Room not found
    ```json
    {
      "success": false,
      "message": "Room not found"
    }
    ```
  - **500 Internal Server Error**: Server error

### Update Room
- **Method**: PUT
- **Endpoint**: `/rooms/:id`
- **Description**: Update an existing room's details
- **Request Body**:
  ```json
  {
    "RoomName": "string (optional)",
    "members": [
      {
        "uniqueId": "string",
        "email": "string"
      }
    ] (optional),
    "Capacity": "number (optional, positive integer)"
  }
  ```
- **Parameters**:
  - `id` (path): Room's MongoDB ObjectId
- **Responses**:
  - **200 OK**: Room updated successfully
    ```json
    {
      "success": true,
      "message": "Room updated successfully",
      "data": { updated room object }
    }
    ```
  - **400 Bad Request**: Validation error
    ```json
    {
      "success": false,
      "message": "Validation error",
      "errors": [validation errors]
    }
    ```
  - **404 Not Found**: Room not found
    ```json
    {
      "success": false,
      "message": "Room not found"
    }
    ```
  - **500 Internal Server Error**: Server error

### Delete Room
- **Method**: DELETE
- **Endpoint**: `/rooms/:id`
- **Description**: Delete a room by its ID
- **Request Body**: None
- **Parameters**:
  - `id` (path): Room's MongoDB ObjectId
- **Responses**:
  - **200 OK**: Room deleted successfully
    ```json
    {
      "success": true,
      "message": "Room deleted successfully",
      "data": { deleted room object }
    }
    ```
  - **404 Not Found**: Room not found
    ```json
    {
      "success": false,
      "message": "Room not found"
    }
    ```
  - **500 Internal Server Error**: Server error

## Accommodation API

### Register Accommodation
- **Method**: POST
- **Endpoint**: `/accommodation/register`
- **Description**: Register a new accommodation booking
- **Request Body**:
  ```json
  {
    "name": "string (required)",
    "email": "string (required, valid email)",
    "uniqueId": "string (required)",
    "college": "string (required)",
    "residentialAddress": "string (required)",
    "city": "string (required)",
    "phone": "string (required)",
    "gender": "male | female | other (required)",
    "roomType": "string (required)",
    "from": "string (required, date)",
    "to": "string (required, date)",
    "breakfast1": "boolean (optional)",
    "breakfast2": "boolean (optional)",
    "dinner1": "boolean (optional)",
    "dinner2": "boolean (optional)",
    "amenities": "string (required)",
    "amount": "number (required, positive)",
    "optin": "boolean (optional)"
  }
  ```
- **Responses**:
  - **201 Created**: Accommodation registered successfully
    ```json
    {
      "success": true,
      "message": "Accommodation registered successfully",
      "data": { accommodation object }
    }
    ```
  - **400 Bad Request**: Validation error
    ```json
    {
      "success": false,
      "message": "Validation error",
      "errors": [validation errors]
    }
    ```
  - **409 Conflict**: Accommodation with uniqueId already exists
    ```json
    {
      "success": false,
      "message": "Accommodation with this unique ID already exists"
    }
    ```
  - **500 Internal Server Error**: Server error

### Get Accommodation by Unique ID
- **Method**: GET
- **Endpoint**: `/accommodation/uniqueId/:uniqueId`
- **Description**: Retrieve accommodation details and associated room by unique ID
- **Request Body**: None
- **Parameters**:
  - `uniqueId` (path): User's unique identifier
- **Responses**:
  - **200 OK**: Accommodation retrieved successfully
    ```json
    {
      "success": true,
      "data": {
        "accommodation": { accommodation object },
        "room": { room object } | null
      }
    }
    ```
  - **400 Bad Request**: Missing uniqueId
    ```json
    {
      "success": false,
      "message": "Unique ID is required"
    }
    ```
  - **404 Not Found**: Accommodation not found
    ```json
    {
      "success": false,
      "message": "Accommodation not found"
    }
    ```
  - **500 Internal Server Error**: Server error

### Get Accommodation by Email
- **Method**: GET
- **Endpoint**: `/accommodation/email/:email`
- **Description**: Retrieve accommodation details and associated room by email
- **Request Body**: None
- **Parameters**:
  - `email` (path): User's email address
- **Responses**:
  - **200 OK**: Accommodation retrieved successfully
    ```json
    {
      "success": true,
      "data": {
        "accommodation": { accommodation object },
        "room": { room object } | null
      }
    }
    ```
  - **400 Bad Request**: Missing email
    ```json
    {
      "success": false,
      "message": "Email is required"
    }
    ```
  - **404 Not Found**: Accommodation not found
    ```json
    {
      "success": false,
      "message": "Accommodation not found"
    }
    ```
  - **500 Internal Server Error**: Server error

## Error Response Format
All error responses follow this general structure:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (for 500 errors)",
  "errors": [array of validation errors (for Zod validation errors)]
}
```

## Success Response Format
All success responses include:
```json
{
  "success": true,
  "message": "Success message",
  "data": { response data },
  // Additional fields may be present depending on endpoint
}
```
