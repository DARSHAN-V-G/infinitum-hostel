import { Request, Response } from 'express';
import { z } from 'zod';
import { Accommodation } from '../models/Accommodation';
import { Room } from '../models/Room';
import logger from '../utils/logger';

// Zod schema for accommodation registration
const registerAccommodationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  uniqueId: z.string().min(1, 'Unique ID is required'),
  college: z.string().min(1, 'College is required'),
  residentialAddress: z.string().min(1, 'Residential address is required'),
  city: z.string().min(1, 'City is required'),
  phone: z.string().min(1, 'Phone number is required'),
  gender: z.enum(['male', 'female', 'other'], 'Invalid gender'),
  breakfast1: z.boolean().optional(),
  breakfast2: z.boolean().optional(),
  dinner1: z.boolean().optional(),
  dinner2: z.boolean().optional(),
  amenities: z.string().min(1, 'Amenities are required'),
  amount: z.number(),
  optin: z.boolean().optional(),
});

// Zod schema for updating payment status
const updatePaymentSchema = z.object({
  amount: z.number(),
});

export const registerAccommodation = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = registerAccommodationSchema.parse(req.body);

    logger.info('Attempting to register accommodation', {
      uniqueId: validatedData.uniqueId,
      email: validatedData.email,
      particular: 'register_accommodation'
    });

    // Check if accommodation with same uniqueId already exists
    const existingAccommodation = await Accommodation.findOne({ uniqueId: validatedData.uniqueId });
    if (existingAccommodation) {
      logger.warn('Accommodation registration failed - duplicate uniqueId', {
        uniqueId: validatedData.uniqueId,
        email: validatedData.email,
        particular: 'register_accommodation_duplicate'
      });
      return res.status(409).json({
        success: false,
        message: 'Accommodation with this unique ID already exists'
      });
    }

    // Create new accommodation
    const newAccommodation = new Accommodation({
      ...validatedData,
      payment: false, // Default to unpaid
      vacated: false, // Default to not vacated
    });

    await newAccommodation.save();

    logger.info('Accommodation registered successfully', {
      uniqueId: validatedData.uniqueId,
      email: validatedData.email,
      particular: 'register_accommodation_success',
      accommodationId: newAccommodation._id
    });

    res.status(201).json({
      success: true,
      message: 'Accommodation registered successfully',
      data: newAccommodation
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Accommodation registration validation error', {
        particular: 'register_accommodation_validation_error',
        errors: error.issues
      });
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues
      });
    }

    logger.error('Error registering accommodation', {
      particular: 'register_accommodation_error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getAccommodationByUniqueId = async (req: Request, res: Response) => {
  try {
    const { uniqueId } = req.params;

    if (!uniqueId) {
      logger.warn('Get accommodation by uniqueId failed - missing uniqueId', {
        particular: 'get_accommodation_uniqueid_missing'
      });
      return res.status(400).json({
        success: false,
        message: 'Unique ID is required'
      });
    }

    logger.info('Fetching accommodation by uniqueId', {
      uniqueId,
      particular: 'get_accommodation_uniqueid'
    });

    // Find accommodation
    const accommodation = await Accommodation.findOne({ uniqueId });
    if (!accommodation) {
      logger.warn('Accommodation not found by uniqueId', {
        uniqueId,
        particular: 'get_accommodation_uniqueid_not_found'
      });
      return res.status(404).json({
        success: false,
        message: 'Accommodation not found'
      });
    }

    // Find room where this uniqueId is in members
    const room = await Room.findOne({ 'members.uniqueId': uniqueId });

    logger.info('Accommodation fetched successfully by uniqueId', {
      uniqueId,
      email: accommodation.email,
      particular: 'get_accommodation_uniqueid_success',
      hasRoom: !!room
    });

    res.status(200).json({
      success: true,
      data: {
        accommodation,
        room: room || null
      }
    });
  } catch (error) {
    logger.error('Error fetching accommodation by uniqueId', {
      uniqueId: req.params.uniqueId,
      particular: 'get_accommodation_uniqueid_error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getAccommodationByEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    if (!email) {
      logger.warn('Get accommodation by email failed - missing email', {
        particular: 'get_accommodation_email_missing'
      });
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    logger.info('Fetching accommodation by email', {
      email,
      particular: 'get_accommodation_email'
    });

    // Find accommodation
    const accommodation = await Accommodation.findOne({ email });
    if (!accommodation) {
      logger.warn('Accommodation not found by email', {
        email,
        particular: 'get_accommodation_email_not_found'
      });
      return res.status(404).json({
        success: false,
        message: 'Accommodation not found'
      });
    }

    // Find room where this email is in members
    const room = await Room.findOne({ 'members.email': email });

    logger.info('Accommodation fetched successfully by email', {
      uniqueId: accommodation.uniqueId,
      email,
      particular: 'get_accommodation_email_success',
      hasRoom: !!room
    });

    res.status(200).json({
      success: true,
      data: {
        accommodation,
        room: room || null
      }
    });
  } catch (error) {
    logger.error('Error fetching accommodation by email', {
      email: req.params.email,
      particular: 'get_accommodation_email_error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update payment status
export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { uniqueId } = req.params;

    if (!uniqueId) {
      logger.warn('Update payment status failed - missing uniqueId', {
        particular: 'update_payment_status_missing'
      });
      return res.status(400).json({
        success: false,
        message: 'Unique ID is required'
      });
    }

    // Validate request body
    const validatedData = updatePaymentSchema.parse(req.body);

    logger.info('Updating payment status', {
      uniqueId,
      particular: 'update_payment_status',
      amount: validatedData.amount
    });

    // Find and update accommodation
    const updatedAccommodation = await Accommodation.findOneAndUpdate(
      { uniqueId },
      {
        payment: true,
        amount: validatedData.amount
      },
      { new: true }
    );

    if (!updatedAccommodation) {
      logger.warn('Update payment status failed - accommodation not found', {
        uniqueId,
        particular: 'update_payment_status_not_found'
      });
      return res.status(404).json({
        success: false,
        message: 'Accommodation not found'
      });
    }

    logger.info('Payment status updated successfully', {
      uniqueId,
      email: updatedAccommodation.email,
      particular: 'update_payment_status_success',
      amount: validatedData.amount
    });

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: updatedAccommodation
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Update payment status validation error', {
        uniqueId: req.params.uniqueId,
        particular: 'update_payment_status_validation_error',
        errors: error.issues
      });
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues
      });
    }

    logger.error('Error updating payment status', {
      uniqueId: req.params.uniqueId,
      particular: 'update_payment_status_error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get accommodation statistics
export const getAccommodationStats = async (req: Request, res: Response) => {
  try {
    logger.info('Fetching accommodation statistics', {
      particular: 'get_accommodation_stats'
    });

    // 1. Gender Statistics
    const maleStats = await Accommodation.countDocuments({ gender: 'male' });
    const femaleStats = await Accommodation.countDocuments({ gender: 'female' });

    // 2. Meal Statistics - Breakfast
    const breakfast1 = await Accommodation.aggregate([
      { $match: { breakfast1: true } },
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    const breakfast2 = await Accommodation.aggregate([
      { $match: { breakfast2: true } },
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    // 3. Meal Statistics - Dinner
    const dinner1 = await Accommodation.aggregate([
      { $match: { dinner1: true } },
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    const dinner2 = await Accommodation.aggregate([
      { $match: { dinner2: true } },
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    // 4. Amenities Statistics
    const amenities = await Accommodation.aggregate([
      { $match: { amenities: { $ne: '' } } },
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    // 5. Total Count
    const totalRooms = await Accommodation.countDocuments();

    logger.info('Accommodation statistics fetched successfully', {
      particular: 'get_accommodation_stats_success',
      totalRooms,
      maleStats,
      femaleStats
    });

    res.status(200).json({
      success: true,
      data: {
        genderStats: {
          maleStats,
          femaleStats
        },
        mealStats: {
          breakfast: {
            breakfast1,
            breakfast2
          },
          dinner: {
            dinner1,
            dinner2
          }
        },
        amenitiesStats: {
          amenities
        },
        totalRooms
      }
    });
  } catch (error) {
    logger.error('Error fetching accommodation stats', {
      particular: 'get_accommodation_stats_error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all accommodations with room details
export const getAllAccommodations = async (req: Request, res: Response) => {
  try {
    logger.info('Fetching all accommodations', {
      particular: 'get_all_accommodations'
    });

    // Fetch all accommodations
    const accommodations = await Accommodation.find();

    // Enhance accommodations with room data
    const enhancedAccommodations = await Promise.all(
      accommodations.map(async (accommodation) => {
        // Find room where this accommodation's member exists
        const room = await Room.findOne({
          $or: [
            { 'members.uniqueId': accommodation.uniqueId },
            { 'members.email': accommodation.email }
          ]
        });

        return {
          ...accommodation.toObject(),
          room: room ? {
            _id: room._id,
            RoomName: room.RoomName,
            roomtype: room.roomtype,
            gender: room.gender,
            Capacity: room.Capacity,
            currentOccupancy: room.members.length
          } : null
        };
      })
    );

    logger.info('All accommodations fetched successfully', {
      particular: 'get_all_accommodations_success',
      count: enhancedAccommodations.length
    });

    res.status(200).json({
      success: true,
      count: enhancedAccommodations.length,
      data: enhancedAccommodations
    });
  } catch (error) {
    logger.error('Error fetching all accommodations', {
      particular: 'get_all_accommodations_error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
