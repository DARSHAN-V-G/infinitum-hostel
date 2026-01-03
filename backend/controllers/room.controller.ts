import { Request, Response } from 'express';
import { z } from 'zod';
import { Room } from '../models/Room';
import { Accommodation } from '../models/Accommodation';
import logger from '../utils/logger';

// Zod schemas
const createRoomSchema = z.object({
  RoomName: z.string().min(1, 'Room name is required'),
  roomtype: z.string().min(1, 'Room type is required'),
  gender: z.enum(['male', 'female', 'mixed']),
  Capacity: z.number().int().positive('Capacity must be a positive integer')
});

const addMemberSchema = z.object({
  uniqueId: z.string().min(1, 'Unique ID is required'),
  email: z.string().email('Invalid email format'),
  roomName: z.string().min(1, 'Room name is required')
});

const updateRoomSchema = z.object({
  RoomName: z.string().min(1, 'Room name is required').optional(),
  roomtype: z.string().min(1, 'Room type is required').optional(),
  gender: z.enum(['male', 'female', 'mixed']).optional(),
  members: z.array(z.object({
    uniqueId: z.string().min(1, 'Unique ID is required'),
    email: z.string().email('Invalid email format')
  })).optional(),
  Capacity: z.number().int().positive('Capacity must be a positive integer').optional()
});

const changeRoomSchema = z.object({
  uniqueId: z.string().min(1, 'Unique ID is required'),
  email: z.string().email('Invalid email format'),
  fromRoom: z.string().min(1, 'From room name is required'),
  toRoom: z.string().min(1, 'To room name is required')
});

// Create a new room
export const createRoom = async (req: Request, res: Response) => {
    try {
        // Validate request body
        const validatedData = createRoomSchema.parse(req.body);
        const { RoomName, roomtype, gender, Capacity } = validatedData;

        logger.info('Attempting to create new room', {
            particular: 'create_room',
            RoomName,
            roomtype,
            gender,
            Capacity
        });

        // Check if room with same name already exists
        const existingRoom = await Room.findOne({ RoomName });
        if (existingRoom) {
            logger.warn('Room creation failed - duplicate room name', {
                particular: 'create_room_duplicate',
                RoomName
            });
            return res.status(400).json({
                success: false,
                message: 'Room with this name already exists'
            });
        }

        const newRoom = new Room({
            RoomName,
            roomtype,
            gender,
            members: [],
            Capacity
        });

        await newRoom.save();

        logger.info('Room created successfully', {
            particular: 'create_room_success',
            RoomName,
            roomId: newRoom._id
        });

        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: newRoom
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            logger.warn('Room creation validation error', {
                particular: 'create_room_validation_error',
                errors: error.issues
            });
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.issues
            });
        }
        logger.error('Error creating room', {
            particular: 'create_room_error',
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Error creating room',
            error: error.message
        });
    }
};

// Add a member to a room
export const addMember = async (req: Request, res: Response) => {
    try {
        // Validate request body
        const validatedData = addMemberSchema.parse(req.body);
        const { uniqueId, email, roomName } = validatedData;

        logger.info('Attempting to add member to room', {
            uniqueId,
            email,
            particular: 'add_member',
            roomName
        });

        // Find the room by RoomName
        const room = await Room.findOne({ RoomName: roomName });

        if (!room) {
            logger.warn('Add member failed - room not found', {
                uniqueId,
                email,
                particular: 'add_member_room_not_found',
                roomName
            });
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Check if member already exists in the room
        const memberExists = room.members.some(
            (member: any) => member.uniqueId === uniqueId || member.email === email
        );

        if (memberExists) {
            logger.warn('Add member failed - member already exists in room', {
                uniqueId,
                email,
                particular: 'add_member_already_exists',
                roomName
            });
            return res.status(400).json({
                success: false,
                message: 'Member already exists in this room'
            });
        }

        // Add the new member (capacity can be exceeded)
        room.members.push({ uniqueId, email });
        await room.save();

        const isOverCapacity = room.members.length > room.Capacity;

        logger.info('Member added successfully to room', {
            uniqueId,
            email,
            particular: 'add_member_success',
            roomName,
            currentOccupancy: room.members.length,
            capacity: room.Capacity,
            isOverCapacity
        });

        res.status(200).json({
            success: true,
            message: 'Member added successfully',
            data: room,
            currentOccupancy: room.members.length,
            capacity: room.Capacity,
            isOverCapacity
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            logger.warn('Add member validation error', {
                particular: 'add_member_validation_error',
                errors: error.issues
            });
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.issues
            });
        }
        logger.error('Error adding member to room', {
            particular: 'add_member_error',
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Error adding member to room',
            error: error.message
        });
    }
};

// Get all rooms
export const getAllRooms = async (req: Request, res: Response) => {
    try {
        logger.info('Fetching all rooms', {
            particular: 'get_all_rooms'
        });

        const rooms = await Room.find();

        // Enhance rooms with accommodation data for each member
        const enhancedRooms = await Promise.all(
            rooms.map(async (room) => {
                const enhancedMembers = await Promise.all(
                    room.members.map(async (member: any) => {
                        // Try to find accommodation by uniqueId first, then by email
                        let accommodation = await Accommodation.findOne({ uniqueId: member.uniqueId });

                        if (!accommodation) {
                            accommodation = await Accommodation.findOne({ email: member.email });
                        }

                        return {
                            ...member.toObject(),
                            accommodation: accommodation || null
                        };
                    })
                );

                return {
                    ...room.toObject(),
                    members: enhancedMembers
                };
            })
        );

        logger.info('All rooms fetched successfully', {
            particular: 'get_all_rooms_success',
            count: rooms.length
        });

        res.status(200).json({
            success: true,
            count: rooms.length,
            data: enhancedRooms
        });
    } catch (error: any) {
        logger.error('Error fetching rooms', {
            particular: 'get_all_rooms_error',
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Error fetching rooms',
            error: error.message
        });
    }
};

// Get a single room by ID
export const getRoomById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        logger.info('Fetching room by ID', {
            particular: 'get_room_by_id',
            roomId: id
        });

        const room = await Room.findById(id);

        if (!room) {
            logger.warn('Room not found by ID', {
                particular: 'get_room_by_id_not_found',
                roomId: id
            });
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        logger.info('Room fetched successfully by ID', {
            particular: 'get_room_by_id_success',
            roomId: id,
            RoomName: room.RoomName
        });

        res.status(200).json({
            success: true,
            data: room
        });
    } catch (error: any) {
        logger.error('Error fetching room', {
            particular: 'get_room_by_id_error',
            roomId: req.params.id,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Error fetching room',
            error: error.message
        });
    }
};

// Update a room
export const updateRoom = async (req: Request, res: Response) => {
    try {
        // Validate request body
        const validatedData = updateRoomSchema.parse(req.body);
        const { RoomName, roomtype, gender, members, Capacity } = validatedData;

        const { id } = req.params;

        logger.info('Attempting to update room', {
            particular: 'update_room',
            roomId: id,
            updates: validatedData
        });

        const updatedRoom = await Room.findByIdAndUpdate(
            id,
            { ...(RoomName && { RoomName }), ...(roomtype && { roomtype }), ...(gender && { gender }), ...(members && { members }), ...(Capacity && { Capacity }) },
            { new: true, runValidators: true }
        );

        if (!updatedRoom) {
            logger.warn('Room update failed - room not found', {
                particular: 'update_room_not_found',
                roomId: id
            });
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        logger.info('Room updated successfully', {
            particular: 'update_room_success',
            roomId: id,
            RoomName: updatedRoom.RoomName
        });

        res.status(200).json({
            success: true,
            message: 'Room updated successfully',
            data: updatedRoom
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            logger.warn('Room update validation error', {
                particular: 'update_room_validation_error',
                roomId: req.params.id,
                errors: error.issues
            });
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.issues
            });
        }
        logger.error('Error updating room', {
            particular: 'update_room_error',
            roomId: req.params.id,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Error updating room',
            error: error.message
        });
    }
};

// Delete a room
export const deleteRoom = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        logger.info('Attempting to delete room', {
            particular: 'delete_room',
            roomId: id
        });

        const deletedRoom = await Room.findByIdAndDelete(id);

        if (!deletedRoom) {
            logger.warn('Room deletion failed - room not found', {
                particular: 'delete_room_not_found',
                roomId: id
            });
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        logger.info('Room deleted successfully', {
            particular: 'delete_room_success',
            roomId: id,
            RoomName: deletedRoom.RoomName
        });

        res.status(200).json({
            success: true,
            message: 'Room deleted successfully',
            data: deletedRoom
        });
    } catch (error: any) {
        logger.error('Error deleting room', {
            particular: 'delete_room_error',
            roomId: req.params.id,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Error deleting room',
            error: error.message
        });
    }
};

// Find room by member email or unique ID
export const findRoomByMember = async (req: Request, res: Response) => {
    try {
        const { identifier } = req.params; // This can be either email or uniqueId

        if (!identifier) {
            logger.warn('Find room by member failed - missing identifier', {
                particular: 'find_room_by_member_missing'
            });
            return res.status(400).json({
                success: false,
                message: 'Member identifier (email or unique ID) is required'
            });
        }

        logger.info('Finding room by member identifier', {
            particular: 'find_room_by_member',
            identifier
        });

        // Find room where the member exists (check both uniqueId and email)
        const room = await Room.findOne({
            $or: [
                { 'members.uniqueId': identifier },
                { 'members.email': identifier }
            ]
        });

        if (!room) {
            logger.warn('No room found for member', {
                particular: 'find_room_by_member_not_found',
                identifier
            });
            return res.status(404).json({
                success: false,
                message: 'No room found for this member'
            });
        }

        // Find the specific member in the room
        const member = room.members.find((m: any) =>
            m.uniqueId === identifier || m.email === identifier
        );

        // Get accommodation data for the member
        let accommodation = await Accommodation.findOne({ uniqueId: member?.uniqueId });

        if (!accommodation && member?.email) {
            accommodation = await Accommodation.findOne({ email: member.email });
        }

        logger.info('Room found successfully for member', {
            particular: 'find_room_by_member_success',
            identifier,
            RoomName: room.RoomName,
            uniqueId: member?.uniqueId,
            email: member?.email
        });

        res.status(200).json({
            success: true,
            data: {
                room: {
                    _id: room._id,
                    RoomName: room.RoomName,
                    Capacity: room.Capacity,
                    currentOccupancy: room.members.length
                },
                member: {
                    ...member,
                    accommodation: accommodation || null
                }
            }
        });
    } catch (error: any) {
        logger.error('Error finding room for member', {
            particular: 'find_room_by_member_error',
            identifier: req.params.identifier,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Error finding room for member',
            error: error.message
        });
    }
};

// Change member's room
export const changeMemberRoom = async (req: Request, res: Response) => {
    try {
        // Validate request body
        const validatedData = changeRoomSchema.parse(req.body);
        const { uniqueId, email, fromRoom, toRoom } = validatedData;

        logger.info('Attempting to change member room', {
            uniqueId,
            email,
            particular: 'change_member_room',
            fromRoom,
            toRoom
        });

        // Check if fromRoom and toRoom are different
        if (fromRoom === toRoom) {
            logger.warn('Change member room failed - same room', {
                uniqueId,
                email,
                particular: 'change_member_room_same_room',
                fromRoom,
                toRoom
            });
            return res.status(400).json({
                success: false,
                message: 'From room and to room cannot be the same'
            });
        }

        // Find the fromRoom
        const fromRoomDoc = await Room.findOne({ RoomName: fromRoom });
        if (!fromRoomDoc) {
            logger.warn('Change member room failed - from room not found', {
                uniqueId,
                email,
                particular: 'change_member_room_from_not_found',
                fromRoom
            });
            return res.status(404).json({
                success: false,
                message: 'From room not found'
            });
        }

        // Find the toRoom
        const toRoomDoc = await Room.findOne({ RoomName: toRoom });
        if (!toRoomDoc) {
            logger.warn('Change member room failed - to room not found', {
                uniqueId,
                email,
                particular: 'change_member_room_to_not_found',
                toRoom
            });
            return res.status(404).json({
                success: false,
                message: 'To room not found'
            });
        }

        // Check if member exists in fromRoom
        const memberIndex = fromRoomDoc.members.findIndex((member: any) =>
            member.uniqueId === uniqueId && member.email === email
        );

        if (memberIndex === -1) {
            logger.warn('Change member room failed - member not in from room', {
                uniqueId,
                email,
                particular: 'change_member_room_member_not_found',
                fromRoom
            });
            return res.status(404).json({
                success: false,
                message: 'Member not found in the specified from room'
            });
        }

        // Check if member already exists in toRoom
        const memberExistsInToRoom = toRoomDoc.members.some((member: any) =>
            member.uniqueId === uniqueId && member.email === email
        );

        if (memberExistsInToRoom) {
            logger.warn('Change member room failed - member already in to room', {
                uniqueId,
                email,
                particular: 'change_member_room_already_exists',
                toRoom
            });
            return res.status(400).json({
                success: false,
                message: 'Member already exists in the to room'
            });
        }

        // Remove member from fromRoom
        const memberToMove = fromRoomDoc.members.splice(memberIndex, 1)[0];

        // Add member to toRoom
        toRoomDoc.members.push(memberToMove);

        // Save both rooms
        await fromRoomDoc.save();
        await toRoomDoc.save();

        logger.info('Member room changed successfully', {
            uniqueId,
            email,
            particular: 'change_member_room_success',
            fromRoom,
            toRoom,
            fromRoomOccupancy: fromRoomDoc.members.length,
            toRoomOccupancy: toRoomDoc.members.length
        });

        res.status(200).json({
            success: true,
            message: 'Member room changed successfully',
            data: {
                member: memberToMove,
                fromRoom: {
                    RoomName: fromRoomDoc.RoomName,
                    previousOccupancy: fromRoomDoc.members.length + 1,
                    currentOccupancy: fromRoomDoc.members.length
                },
                toRoom: {
                    RoomName: toRoomDoc.RoomName,
                    previousOccupancy: toRoomDoc.members.length - 1,
                    currentOccupancy: toRoomDoc.members.length
                }
            }
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            logger.warn('Change member room validation error', {
                particular: 'change_member_room_validation_error',
                errors: error.issues
            });
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.issues
            });
        }
        logger.error('Error changing member room', {
            particular: 'change_member_room_error',
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Error changing member room',
            error: error.message
        });
    }
};
