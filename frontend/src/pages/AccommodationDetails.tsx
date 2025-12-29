import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { accommodationAPI, roomAPI, deskAPI } from '../api';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';

// Custom OTP Input Component
const OtpInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  numInputs: number;
}> = ({ value, onChange, numInputs }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return; // Only allow digits

    const newValue = value.split('');
    newValue[index] = val;
    const updatedValue = newValue.join('').slice(0, numInputs);
    onChange(updatedValue);

    // Auto-focus next input
    if (val && index < numInputs - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex space-x-2">
      {Array.from({ length: numInputs }, (_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="w-16 h-16 text-center text-2xl font-bold border-2 border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800/50 text-white"
        />
      ))}
    </div>
  );
};

interface Accommodation {
  _id: string;
  name: string;
  email: string;
  uniqueId: string;
  college: string;
  residentialAddress: string;
  city: string;
  phone: string;
  gender: string;
  breakfast1: boolean;
  breakfast2: boolean;
  dinner1: boolean;
  dinner2: boolean;
  amenities: string;
  amount: number;
  payment: boolean;
  vacated: boolean;
  optin: boolean;
}

interface Room {
  _id: string;
  RoomName: string;
  Capacity: number;
  members: Array<{
    uniqueId: string;
    email: string;
    accommodation: Accommodation | null;
  }>;
}

const AccommodationDetails: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'uniqueId' | 'email'>('uniqueId');
  const [uniqueIdValue, setUniqueIdValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [accommodationData, setAccommodationData] = useState<{
    accommodation: Accommodation;
    room: Room | null;
  } | null>(null);
  const [roomData, setRoomData] = useState<{
    room: {
      _id: string;
      RoomName: string;
      Capacity: number;
      currentOccupancy: number;
    };
    member: any;
  } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showChangeRoomModal, setShowChangeRoomModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [allocatingRoom, setAllocatingRoom] = useState(false);
  const [changingRoom, setChangingRoom] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Scanner mode state
  const [scannerMode, setScannerMode] = useState(false);
  const [deskSession, setDeskSession] = useState<{ deskId: string; signature: string } | null>(null);
  const [scannerConnected, setScannerConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Fetch accommodation by unique ID
  const fetchByUniqueId = async (uniqueId: string) => {
    if (uniqueId.length !== 4) return;

    setLoading(true);
    try {
      const response = await accommodationAPI.getByUniqueId(`INF${uniqueId}`);
      setAccommodationData(response.data);
      toast.success('Accommodation details loaded successfully');
    } catch (error: any) {
      console.error('Error fetching accommodation:', error);
      toast.error(error.message || 'Failed to fetch accommodation details');
      setAccommodationData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch accommodation by email
  const fetchByEmail = async () => {
    if (!emailValue.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const response = await accommodationAPI.getByEmail(emailValue.trim());
      setAccommodationData(response.data);
      toast.success('Accommodation details loaded successfully');
    } catch (error: any) {
      console.error('Error fetching accommodation:', error);
      toast.error(error.message || 'Failed to fetch accommodation details');
      setAccommodationData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch room data for the current member
  const fetchRoomData = async (identifier: string) => {
    try {
      const response = await roomAPI.findRoomByMember(identifier);
      setRoomData(response.data);
    } catch (error: any) {
      console.error('Error fetching room data:', error);
      setRoomData(null);
    }
  };

  // Fetch available rooms for allocation
  const fetchAvailableRooms = async () => {
    try {
      const response = await roomAPI.getAllRooms();
      setAvailableRooms(response.data);
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to load available rooms');
    }
  };

  // Allocate room to member
  const allocateRoom = async () => {
    if (!selectedRoom || !accommodationData) return;

    setAllocatingRoom(true);
    try {
      await roomAPI.addMember({
        uniqueId: accommodationData.accommodation.uniqueId,
        email: accommodationData.accommodation.email,
        roomName: selectedRoom.RoomName
      });

      toast.success('Room allocated successfully');
      setShowAllocateModal(false);
      setSelectedRoom(null);
      setRoomSearchTerm('');

      // Refresh room data
      await fetchRoomData(accommodationData.accommodation.uniqueId);
    } catch (error: any) {
      console.error('Error allocating room:', error);
      toast.error(error.message || 'Failed to allocate room');
    } finally {
      setAllocatingRoom(false);
    }
  };

  // Change member's room
  const changeRoom = async () => {
    if (!selectedRoom || !accommodationData || !roomData) return;

    setChangingRoom(true);
    try {
      await roomAPI.changeRoom({
        uniqueId: accommodationData.accommodation.uniqueId,
        email: accommodationData.accommodation.email,
        fromRoom: roomData.room.RoomName,
        toRoom: selectedRoom.RoomName
      });

      toast.success('Room changed successfully');
      setShowChangeRoomModal(false);
      setSelectedRoom(null);
      setRoomSearchTerm('');

      // Refresh room data
      const identifier = activeTab === 'uniqueId'
        ? accommodationData.accommodation.uniqueId
        : accommodationData.accommodation.email;
      await fetchRoomData(identifier);
    } catch (error: any) {
      console.error('Error changing room:', error);
      toast.error(error.message || 'Failed to change room');
    } finally {
      setChangingRoom(false);
    }
  };

  // Enable scanner mode
  const enableScannerMode = async () => {
    try {
      // Create desk session
      const response = await deskAPI.createSession();
      const { deskId, signature } = response.data;

      setDeskSession({ deskId, signature });
      setScannerMode(true);

      // Connect to socket
      const socket = io(import.meta.env.VITE_API_BASE?.replace('/api/acc', '') || `${window.location.protocol}//${window.location.hostname}:3000`, { path: '/api/accommodationsocket' });
      socketRef.current = socket;

      // Join desk session
      socket.emit('join-desk', { deskId, signature });

      // Listen for desk joined confirmation
      socket.on('desk-joined', () => {
        toast.success('Scanner mode enabled');
      });

      // Listen for scanner connection
      socket.on('scanner-connected', () => {
        setScannerConnected(true);
        toast.success('Mobile scanner connected');
      });

      // Listen for scanner disconnection
      socket.on('scanner-disconnected', () => {
        setScannerConnected(false);
        toast('Mobile scanner disconnected', { icon: '⚠️' });
      });

      // Listen for scanned participant IDs
      socket.on('participant-scanned', ({ uniqueId }: { uniqueId: string }) => {
        // Extract 4-digit ID from full unique ID (e.g., "INF1234" -> "1234")
        const fourDigit = uniqueId.replace('INF', '');
        setUniqueIdValue(fourDigit);
        toast.success(`Scanned: ${uniqueId}`);
      });

      // Handle errors
      socket.on('error', ({ message }: { message: string }) => {
        toast.error(message);
      });

    } catch (error: any) {
      console.error('Error enabling scanner mode:', error);
      toast.error('Failed to enable scanner mode');
    }
  };

  // Disable scanner mode
  const disableScannerMode = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setScannerMode(false);
    setDeskSession(null);
    setScannerConnected(false);
    toast.success('Scanner mode disabled');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Auto-fetch when unique ID is complete
  useEffect(() => {
    if (uniqueIdValue.length === 4 && activeTab === 'uniqueId') {
      fetchByUniqueId(uniqueIdValue);
    }
  }, [uniqueIdValue]);

  // Fetch room data when accommodation data changes
  useEffect(() => {
    if (accommodationData) {
      const identifier = activeTab === 'uniqueId'
        ? accommodationData.accommodation.uniqueId
        : accommodationData.accommodation.email;
      fetchRoomData(identifier);
    } else {
      setRoomData(null);
    }
  }, [accommodationData, activeTab]);

  // Fetch available rooms when allocate modal opens
  useEffect(() => {
    if (showAllocateModal) {
      fetchAvailableRooms();
    }
  }, [showAllocateModal]);

  // Fetch available rooms when change room modal opens
  useEffect(() => {
    if (showChangeRoomModal) {
      fetchAvailableRooms();
    }
  }, [showChangeRoomModal]);

  // Update payment status
  const updatePayment = async () => {
    if (!accommodationData) return;

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setUpdatingPayment(true);
    try {
      await accommodationAPI.updatePayment(accommodationData.accommodation.uniqueId, amount);

      // Update local state
      setAccommodationData({
        ...accommodationData,
        accommodation: {
          ...accommodationData.accommodation,
          payment: true,
          amount: amount
        }
      });

      toast.success('Payment status updated successfully');
      setShowPaymentModal(false);
      setPaymentAmount('');
    } catch (error: any) {
      console.error('Error updating payment:', error);
      toast.error(error.message || 'Failed to update payment status');
    } finally {
      setUpdatingPayment(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-black relative overflow-hidden p-6 tomorrow-regular">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute w-64 h-64 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <div className="relative z-10">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f0e6ff] via-[#ff6b9d] to-[#8b5cf6] tomorrow-bold">Accommodation Details</h1>
            <p className="text-gray-300">View and manage guest accommodation information</p>
          </div>

          {/* Scanner Mode Toggle */}
          <div className="flex items-center space-x-3">
            <button
              onClick={scannerMode ? disableScannerMode : enableScannerMode}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 relative overflow-hidden group ${scannerMode
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg hover:shadow-red-500/50 text-white'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/50 text-white'
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {scannerMode ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                )}
              </svg>
              <span>{scannerMode ? 'Disable' : 'Enable'} Scanner Mode</span>
            </button>
            {scannerMode && (
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${scannerConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className={scannerConnected ? 'text-green-400' : 'text-gray-400'}>
                  {scannerConnected ? 'Connected' : 'Waiting...'}
                </span>
              </div>
            )}
          </div>
        </div>



        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-purple-500/30">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('uniqueId')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'uniqueId'
                  ? 'border-pink-500 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300'
                  : 'border-transparent text-gray-400 hover:text-purple-300'
                  }`}
              >
                Search by Unique ID
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'email'
                  ? 'border-pink-500 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300'
                  : 'border-transparent text-gray-400 hover:text-purple-300'
                  }`}
              >
                Search by Email
              </button>
            </nav>
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          {activeTab === 'uniqueId' ? (
            <div className="bg-gray-900/60 backdrop-blur-xl rounded-xl p-6 shadow-2xl border border-purple-500/30 relative">
              {uniqueIdValue && (
                <button
                  onClick={() => {
                    setUniqueIdValue('');
                    setAccommodationData(null);
                    setRoomData(null);
                    // Signal scanner to resume
                    if (socketRef.current && scannerMode) {
                      socketRef.current.emit('resume-scanning');
                      toast.success('Ready for next scan');
                    }
                  }}
                  className="absolute top-4 right-4 px-4 py-2 overflow-hidden rounded-xl text-white font-medium transition-all duration-200 flex items-center group z-10"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 transition-all duration-300 group-hover:scale-105"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
                  <div className="relative flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm">Clear & Scan Next</span>
                  </div>
                </button>
              )}
              <div className="flex items-center space-x-6">
                {scannerMode && deskSession && (
                  <div className="flex-shrink-0">
                    <div className="bg-white p-3 rounded-lg shadow-lg">
                      <QRCodeSVG
                        value={`${window.location.origin}/scanner?deskId=${deskSession.deskId}&signature=${deskSession.signature}`}
                        size={100}
                      />
                    </div>
                    <p className="text-xs text-center text-gray-400 mt-2">Scan with mobile</p>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-col items-center space-y-4">
                    <p className="text-lg font-semibold text-white">
                      Enter 4-digit Unique ID
                    </p>
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f0e6ff] to-[#ff6b9d]">INF</span>
                      <OtpInput
                        value={uniqueIdValue}
                        onChange={setUniqueIdValue}
                        numInputs={4}
                      />
                    </div>
                    {loading && (
                      <div className="flex items-center space-x-2 text-purple-400">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Loading accommodation details...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900/60 backdrop-blur-xl rounded-xl p-6 shadow-2xl border border-purple-500/30">
              <div className="flex flex-col space-y-4">
                <label className="block text-sm font-medium text-white">
                  Email Address
                </label>
                <div className="flex space-x-4">
                  <input
                    type="email"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-3 py-3 border border-purple-500/30 rounded-xl placeholder-gray-500 bg-gray-800/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-500/50"
                  />
                  <button
                    onClick={fetchByEmail}
                    disabled={loading}
                    className="relative px-6 py-3 overflow-hidden rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300 group-hover:scale-105"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
                    <div className="relative flex items-center"
                    >
                      {loading && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      Search
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accommodation Details Display */}
        {accommodationData && (
          <div className="bg-gray-900/60 backdrop-blur-xl rounded-xl shadow-2xl border border-purple-500/30 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600/40 to-pink-600/40 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{accommodationData.accommodation.name}</h2>
                  <p className="text-purple-100">ID: {accommodationData.accommodation.uniqueId}</p>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${accommodationData.accommodation.payment
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                  {accommodationData.accommodation.payment ? 'Paid' : 'Unpaid'}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - User Details */}
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                      Personal Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-400">Email</label>
                        <p className="text-white">{accommodationData.accommodation.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400">Phone</label>
                        <p className="text-white">{accommodationData.accommodation.phone}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400">Gender</label>
                        <p className="text-white capitalize">{accommodationData.accommodation.gender}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400">College</label>
                        <p className="text-white">{accommodationData.accommodation.college}</p>
                      </div>
                    </div>
                  </div>

                  {/* Meal Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#f0e6ff] to-[#ff6b9d] border-b border-[rgba(67,2,105,0.3)] pb-2">
                      Meal Preferences
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={accommodationData.accommodation.breakfast1}
                          readOnly
                          className="rounded border-purple-500/30 text-purple-500 focus:ring-purple-500"
                        />
                        <label className="text-sm text-gray-300">Breakfast (Day 1)</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={accommodationData.accommodation.breakfast2}
                          readOnly
                          className="rounded border-purple-500/30 text-purple-500 focus:ring-purple-500"
                        />
                        <label className="text-sm text-gray-300">Breakfast (Day 2)</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={accommodationData.accommodation.dinner1}
                          readOnly
                          className="rounded border-purple-500/30 text-purple-500 focus:ring-purple-500"
                        />
                        <label className="text-sm text-gray-300">Dinner (Day 1)</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={accommodationData.accommodation.dinner2}
                          readOnly
                          className="rounded border-purple-500/30 text-purple-500 focus:ring-purple-500"
                        />
                        <label className="text-sm text-gray-300">Dinner (Day 2)</label>
                      </div>
                    </div>
                  </div>

                  {/* Amenities & Status */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 border-b border-purple-500/20 pb-2">
                      Amenities & Status
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-400">Amenities</label>
                        <p className="text-white">{accommodationData.accommodation.amenities}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={accommodationData.accommodation.optin}
                          readOnly
                          className="rounded border-purple-500/30 text-purple-500 focus:ring-purple-500"
                        />
                        <label className="text-sm text-gray-300">Opt-in for additional services</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={!accommodationData.accommodation.vacated}
                          readOnly
                          className="rounded border-purple-500/30 text-purple-500 focus:ring-purple-500"
                        />
                        <label className="text-sm text-gray-300">Currently Occupying</label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Payment Section */}
                <div className="space-y-6">
                  {/* Payment Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 border-b border-purple-500/20 pb-2">
                      Payment Information
                    </h3>
                    <div className="space-y-4">
                      {accommodationData.accommodation.payment ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-400">Payment Status</label>
                            <div className="flex items-center space-x-3">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                                Paid
                              </span>
                              <button
                                onClick={() => setShowPaymentModal(true)}
                                className="text-purple-400 hover:text-pink-400 text-sm font-medium underline transition-colors"
                              >
                                Edit Amount
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400">Amount Paid</label>
                            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-300">
                              {formatCurrency(accommodationData.accommodation.amount)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-400">Payment Status</label>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                              Unpaid
                            </span>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              Enter Payment Amount (₹)
                            </label>
                            <div className="flex space-x-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="flex-1 px-3 py-3 border border-[rgba(67,2,105,0.4)] rounded-xl placeholder-gray-500 bg-gray-800/50 text-white focus:outline-none focus:ring-2 focus:ring-[#430269] focus:border-transparent transition-all duration-200 hover:border-[rgba(67,2,105,0.6)]"
                                placeholder="Enter amount"
                              />
                              <button
                                onClick={updatePayment}
                                disabled={updatingPayment || !paymentAmount}
                                className="relative px-4 py-3 overflow-hidden rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center group"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 transition-all duration-300 group-hover:scale-105"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
                                <div className="relative flex items-center">{updatingPayment && (
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                )}
                                  {updatingPayment ? 'Updating...' : 'Pay Now'}</div>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Room Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#f0e6ff] to-[#ff6b9d] border-b border-[rgba(67,2,105,0.3)] pb-2">
                      Room Information
                    </h3>
                    <div className="space-y-3">
                      {roomData ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-400">Room Name</label>
                            <p className="text-white">{roomData.room.RoomName}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400">Capacity</label>
                            <p className="text-white">{roomData.room.Capacity}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400">Current Occupancy</label>
                            <p className="text-white">{roomData.room.currentOccupancy}/{roomData.room.Capacity}</p>
                          </div>
                          <div className="pt-2 flex items-center justify-between">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                              Room Allocated
                            </span>
                            <button
                              onClick={() => setShowChangeRoomModal(true)}
                              className="text-purple-400 hover:text-pink-400 text-sm font-medium underline transition-colors"
                            >
                              Change Room
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-gray-400">No room allocated</p>
                          <button
                            onClick={() => setShowAllocateModal(true)}
                            className="relative w-full overflow-hidden rounded-xl text-white px-4 py-3 font-medium transition-all duration-200 group"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#430269] to-[#F21961] transition-all duration-300 group-hover:scale-105"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#5c0388] to-[#ff2a72] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
                            <span className="relative">Allocate Room</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section - Address Information */}
              <div className="mt-8 pt-6 border-t border-[rgba(67,2,105,0.3)]">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#f0e6ff] to-[#ff6b9d] border-b border-[rgba(67,2,105,0.3)] pb-2">
                    Address Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Residential Address</label>
                      <p className="text-white">{accommodationData.accommodation.residentialAddress}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">City</label>
                      <p className="text-white">{accommodationData.accommodation.city}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Update Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900/90 backdrop-blur-xl rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-[rgba(67,2,105,0.3)]">
              <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#f0e6ff] to-[#ff6b9d] mb-4">
                {accommodationData?.accommodation.payment ? 'Edit Payment Amount' : 'Update Payment Status'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Payment Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-3 border border-[rgba(67,2,105,0.4)] rounded-xl placeholder-gray-500 bg-gray-800/50 text-white focus:outline-none focus:ring-2 focus:ring-[#430269] focus:border-transparent transition-all duration-200 hover:border-[rgba(67,2,105,0.6)]"
                    placeholder="Enter payment amount"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentAmount('');
                  }}
                  className="px-4 py-2 text-gray-300 border border-[rgba(67,2,105,0.4)] rounded-xl hover:bg-gray-800/50 transition-all duration-200"
                  disabled={updatingPayment}
                >
                  Cancel
                </button>
                <button
                  onClick={updatePayment}
                  disabled={updatingPayment}
                  className="relative px-4 py-2 overflow-hidden rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 transition-all duration-300 group-hover:scale-105"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
                  <div className="relative flex items-center">{updatingPayment && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                    {updatingPayment ? 'Updating...' : (accommodationData?.accommodation.payment ? 'Update Amount' : 'Mark as Paid')}</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Room Modal */}
        {showChangeRoomModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900/90 backdrop-blur-xl rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-[rgba(67,2,105,0.3)]">
              <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#f0e6ff] to-[#ff6b9d] mb-4">Change Room</h2>

              <div className="space-y-4">
                {/* Room Search */}
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Search Rooms
                  </label>
                  <input
                    type="text"
                    value={roomSearchTerm}
                    onChange={(e) => setRoomSearchTerm(e.target.value)}
                    placeholder="Search by room name..."
                    className="w-full px-3 py-3 border border-[rgba(67,2,105,0.4)] rounded-xl placeholder-gray-500 bg-gray-800/50 text-white focus:outline-none focus:ring-2 focus:ring-[#430269] focus:border-transparent transition-all duration-200 hover:border-[rgba(67,2,105,0.6)]"
                  />
                </div>

                {/* Room Selection */}
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Select New Room
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-[rgba(67,2,105,0.4)] rounded-xl bg-gray-800/30">
                    {availableRooms
                      .filter(room =>
                        room.RoomName.toLowerCase().includes(roomSearchTerm.toLowerCase()) &&
                        room._id !== roomData?.room._id // Exclude current room
                      )
                      .map((room) => (
                        <div
                          key={room._id}
                          onClick={() => setSelectedRoom(room)}
                          className={`p-3 cursor-pointer border-b border-[rgba(67,2,105,0.2)] last:border-b-0 hover:bg-purple-500/10 transition-colors ${selectedRoom?._id === room._id ? 'bg-purple-500/20 border-purple-500/50' : ''
                            }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-white">{room.RoomName}</p>
                              <p className="text-sm text-gray-400">
                                Capacity: {room.Capacity} | Occupied: {room.members.length}
                              </p>
                            </div>
                            {room.members.length >= room.Capacity && (
                              <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded border border-red-500/30">
                                Full
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    {availableRooms.filter(room =>
                      room.RoomName.toLowerCase().includes(roomSearchTerm.toLowerCase()) &&
                      room._id !== roomData?.room._id
                    ).length === 0 && (
                        <div className="p-3 text-center text-gray-400">
                          No other rooms available
                        </div>
                      )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowChangeRoomModal(false);
                    setSelectedRoom(null);
                    setRoomSearchTerm('');
                  }}
                  className="px-4 py-2 text-gray-300 border border-[rgba(67,2,105,0.4)] rounded-xl hover:bg-gray-800/50 transition-all duration-200"
                  disabled={changingRoom}
                >
                  Cancel
                </button>
                <button
                  onClick={changeRoom}
                  disabled={changingRoom || !selectedRoom}
                  className="relative px-4 py-2 overflow-hidden rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 transition-all duration-300 group-hover:scale-105"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-700 to-orange-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
                  <div className="relative flex items-center">{changingRoom && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                    {changingRoom ? 'Changing...' : 'Change Room'}</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Allocate Room Modal */}
        {showAllocateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900/90 backdrop-blur-xl rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-[rgba(67,2,105,0.3)]">
              <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#f0e6ff] to-[#ff6b9d] mb-4">Allocate Room</h2>

              <div className="space-y-4">
                {/* Room Search */}
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Search Rooms
                  </label>
                  <input
                    type="text"
                    value={roomSearchTerm}
                    onChange={(e) => setRoomSearchTerm(e.target.value)}
                    placeholder="Search by room name..."
                    className="w-full px-3 py-3 border border-[rgba(67,2,105,0.4)] rounded-xl placeholder-gray-500 bg-gray-800/50 text-white focus:outline-none focus:ring-2 focus:ring-[#430269] focus:border-transparent transition-all duration-200 hover:border-[rgba(67,2,105,0.6)]"
                  />
                </div>

                {/* Room Selection */}
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Select Room
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-[rgba(67,2,105,0.4)] rounded-xl bg-gray-800/30">
                    {availableRooms
                      .filter(room =>
                        room.RoomName.toLowerCase().includes(roomSearchTerm.toLowerCase())
                      )
                      .map((room) => (
                        <div
                          key={room._id}
                          onClick={() => setSelectedRoom(room)}
                          className={`p-3 cursor-pointer border-b border-[rgba(67,2,105,0.2)] last:border-b-0 hover:bg-purple-500/10 transition-colors ${selectedRoom?._id === room._id ? 'bg-purple-500/20 border-purple-500/50' : ''
                            }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-white">{room.RoomName}</p>
                              <p className="text-sm text-gray-400">
                                Capacity: {room.Capacity} | Occupied: {room.members.length}
                              </p>
                            </div>
                            {room.members.length >= room.Capacity && (
                              <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded border border-red-500/30">
                                Full
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    {availableRooms.filter(room =>
                      room.RoomName.toLowerCase().includes(roomSearchTerm.toLowerCase())
                    ).length === 0 && (
                        <div className="p-3 text-center text-gray-400">
                          No rooms found
                        </div>
                      )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAllocateModal(false);
                    setSelectedRoom(null);
                    setRoomSearchTerm('');
                  }}
                  className="px-4 py-2 text-gray-300 border border-[rgba(67,2,105,0.4)] rounded-xl hover:bg-gray-800/50 transition-all duration-200"
                  disabled={allocatingRoom}
                >
                  Cancel
                </button>
                <button
                  onClick={allocateRoom}
                  disabled={allocatingRoom || !selectedRoom}
                  className="relative px-4 py-2 overflow-hidden rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 transition-all duration-300 group-hover:scale-105"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
                  <div className="relative flex items-center">{allocatingRoom && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                    {allocatingRoom ? 'Allocating...' : 'Allocate Room'}</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!accommodationData && !loading && (
          <div className="bg-gray-900/60 backdrop-blur-xl rounded-xl shadow-2xl border border-[rgba(67,2,105,0.3)] p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[rgba(67,2,105,0.3)]">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {activeTab === 'uniqueId' ? 'Enter a Unique ID' : 'Search for Accommodation'}
              </h3>
              <p className="text-gray-400">
                {activeTab === 'uniqueId'
                  ? 'Enter the 4-digit unique ID to view accommodation details'
                  : 'Enter an email address and click search to view accommodation details'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccommodationDetails;