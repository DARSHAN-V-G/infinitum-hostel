import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { roomAPI } from '../api';

interface Member {
  uniqueId: string;
  email: string;
  accommodation: {
    name: string;
    uniqueId: string;
    email: string;
  } | null;
}

interface Room {
  _id: string;
  RoomName: string;
  gender: string;
  Capacity: number;
  members: Member[];
}

const AddRooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    RoomName: '',
    gender: 'mixed' as 'male' | 'female' | 'mixed',
    Capacity: 1
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchRooms = async () => {
    try {
      const data = await roomAPI.getAllRooms();
      setRooms(data.data);
      setFilteredRooms(data.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Error fetching rooms');
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!formData.RoomName.trim()) {
      toast.error('Room name is required');
      return;
    }

    if (formData.Capacity < 1) {
      toast.error('Capacity must be at least 1');
      return;
    }

    setSubmitting(true);
    try {
      await roomAPI.createRoom({
        RoomName: formData.RoomName.trim(),
        gender: formData.gender,
        Capacity: formData.Capacity
      });

      toast.success('Room created successfully');
      setIsAddModalOpen(false);
      setFormData({ RoomName: '', gender: 'mixed', Capacity: 1 });
      fetchRooms();
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast.error(error.message || 'Error creating room');
    } finally {
      setSubmitting(false);
    }
  };

  const updateRoom = async () => {
    if (!editingRoom) return;

    if (!formData.RoomName.trim()) {
      toast.error('Room name is required');
      return;
    }

    if (formData.Capacity < 1) {
      toast.error('Capacity must be at least 1');
      return;
    }

    setSubmitting(true);
    try {
      await roomAPI.updateRoom(editingRoom._id, {
        RoomName: formData.RoomName.trim(),
        gender: formData.gender,
        Capacity: formData.Capacity
      });

      toast.success('Room updated successfully');
      setIsEditModalOpen(false);
      setEditingRoom(null);
      setFormData({ RoomName: '', gender: 'mixed', Capacity: 1 });
      fetchRooms();
    } catch (error: any) {
      console.error('Error updating room:', error);
      toast.error(error.message || 'Error updating room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredRooms(rooms);
      return;
    }

    const filtered = rooms.filter(room => {
      const roomNameMatch = room.RoomName.toLowerCase().includes(term.toLowerCase());

      const memberMatch = room.members.some(member => {
        const nameMatch = member.accommodation?.name?.toLowerCase().includes(term.toLowerCase());
        const uniqueIdMatch = member.uniqueId.toLowerCase().includes(term.toLowerCase());
        const emailMatch = member.email.toLowerCase().includes(term.toLowerCase());

        return nameMatch || uniqueIdMatch || emailMatch;
      });

      return roomNameMatch || memberMatch;
    });

    setFilteredRooms(filtered);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      RoomName: room.RoomName,
      gender: room.gender as 'male' | 'female' | 'mixed',
      Capacity: room.Capacity
    });
    setIsEditModalOpen(true);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingRoom(null);
    setFormData({ RoomName: '', gender: 'mixed', Capacity: 1 });
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-900 via-purple-900/20 to-black min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-purple-500"></div>
            <div className="absolute inset-0 rounded-full bg-pink-500/20 blur-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 via-purple-900/20 to-black min-h-screen relative overflow-hidden tomorrow-regular">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute w-64 h-64 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <div className="relative z-10">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 tomorrow-bold">Room Management</h1>
              <p className="text-gray-400 mt-1">Manage and add new rooms to the system</p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-purple-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Room</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by room name, member name, unique ID, or email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-purple-500/30 rounded-xl bg-gray-900/60 backdrop-blur-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <div key={room._id} className="bg-gray-900/60 backdrop-blur-xl rounded-xl shadow-2xl border border-purple-500/30 overflow-hidden hover:border-pink-500/50 transition-all duration-300 group">
              {/* Room Header */}
              <div className="bg-gradient-to-r from-purple-600/40 to-pink-600/40 p-4 relative border-b border-purple-500/20">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">{room.RoomName}</h3>
                    <p className="text-purple-300 text-sm">Gender: {room.gender.charAt(0).toUpperCase() + room.gender.slice(1)}</p>
                    <p className="text-purple-300 text-sm">Capacity: {room.Capacity}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-gray-900/80 backdrop-blur-sm text-purple-300 px-2 py-1 rounded text-sm font-medium border border-purple-500/30">
                      {room.members.length}/{room.Capacity}
                    </div>
                    <button
                      onClick={() => openEditModal(room)}
                      className="text-purple-300 hover:text-pink-300 transition-colors duration-200 p-1"
                      title="Edit Room"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div className="p-4">
                {room.members.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No members assigned</p>
                ) : (
                  <div className="space-y-3">
                    {room.members.map((member, index) => (
                      <div key={index} className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-purple-300">
                              {member.accommodation?.name || 'Unknown'}
                            </h4>
                            <p className="text-sm text-gray-400">
                              ID: {member.uniqueId}
                            </p>
                            <p className="text-sm text-gray-400">
                              Email: {member.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredRooms.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800/50 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-2">No rooms found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first room'}
            </p>
          </div>
        )}

        {/* Add Room Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900/90 backdrop-blur-xl rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-purple-500/30">
              <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-4">Add New Room</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={formData.RoomName}
                    onChange={(e) => setFormData({ ...formData, RoomName: e.target.value })}
                    className="w-full px-3 py-2 border border-purple-500/30 rounded-lg bg-gray-800/50 backdrop-blur-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter room name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'mixed' })}
                    className="w-full px-3 py-2 border border-purple-500/30 rounded-lg bg-gray-800/50 backdrop-blur-sm text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.Capacity}
                    onChange={(e) => setFormData({ ...formData, Capacity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-purple-500/30 rounded-lg bg-gray-800/50 backdrop-blur-sm text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-400 border border-purple-500/30 rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={createRoom}
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center shadow-lg shadow-purple-500/25"
                >
                  {submitting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {submitting ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Room Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900/90 backdrop-blur-xl rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-purple-500/30">
              <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-4">Edit Room</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={formData.RoomName}
                    onChange={(e) => setFormData({ ...formData, RoomName: e.target.value })}
                    className="w-full px-3 py-2 border border-purple-500/30 rounded-lg bg-gray-800/50 backdrop-blur-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter room name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'mixed' })}
                    className="w-full px-3 py-2 border border-purple-500/30 rounded-lg bg-gray-800/50 backdrop-blur-sm text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.Capacity}
                    onChange={(e) => setFormData({ ...formData, Capacity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-purple-500/30 rounded-lg bg-gray-800/50 backdrop-blur-sm text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-400 border border-purple-500/30 rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={updateRoom}
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center shadow-lg shadow-purple-500/25"
                >
                  {submitting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {submitting ? 'Updating...' : 'Update Room'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddRooms;