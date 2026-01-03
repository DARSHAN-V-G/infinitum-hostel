import React, { useState } from 'react';
import { Edit2, Users, Mail, Hash, User, Maximize2, Minimize2 } from 'lucide-react';

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
  roomtype: string;
  gender: string;
  Capacity: number;
  members: Member[];
}

interface RoomCardProps {
  rooms: Room[];
  onEdit?: (roomId: string) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ rooms, onEdit }) => {

  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  const handleEdit = (roomId: string) => {
    if (onEdit) {
      onEdit(roomId);
    }
  };

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden tomorrow-regular">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute w-64 h-64 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
        {rooms.map((room) => (
          <div
            key={room._id}
            className="relative group"
          >
            {/* Glowing border effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
            
            {/* Main card - Horizontal Layout */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden border border-purple-500/30 flex flex-col md:flex-row">
              
              {/* Left Side - Room Info */}
              <div className="md:w-80 bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-blue-900/40 p-6 border-b md:border-b-0 md:border-r border-purple-500/30 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 mb-2">
                      {room.RoomName}
                    </h2>
                    <span className="inline-block px-3 py-1 text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/50 rounded-full">
                      {room.roomtype}
                    </span>
                  </div>
                  
                  {/* Edit Button */}
                  <button
                    onClick={() => handleEdit(room._id)}
                    className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-pink-500/50 hover:scale-105"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
                
                {/* Capacity Section */}
                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users size={16} className="text-purple-400" />
                      <span className="text-sm font-medium">Capacity</span>
                    </div>
                    <span className="text-sm font-mono">
                      <span className="text-pink-400 font-bold">{room.members.length}</span>
                      <span className="text-gray-500"> / </span>
                      <span className="text-blue-400">{room.Capacity}</span>
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-purple-500/30">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 transition-all duration-500 shadow-lg shadow-purple-500/50"
                      style={{ width: `${(room.members.length / room.Capacity) * 100}%` }}
                    ></div>
                  </div>
                  
                  {/* Member Count */}
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-sm font-semibold text-purple-300">MEMBERS</span>
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                      {room.members.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side - Members Grid */}
              <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                    <Users size={16} />
                    MEMBER DETAILS
                  </h3>
                  <button
                    onClick={() => setExpandedRoom(expandedRoom === room._id ? null : room._id)}
                    className="text-xs text-gray-500 hover:text-purple-400 transition-colors flex items-center gap-2"
                  >
                    {expandedRoom === room._id ? (
                      <>
                        <Minimize2 size={14} />
                        COMPACT
                      </>
                    ) : (
                      <>
                        <Maximize2 size={14} />
                        EXPAND
                      </>
                    )}
                  </button>
                </div>

                <div className={`grid gap-3 ${
                  expandedRoom === room._id 
                    ? 'grid-cols-1 lg:grid-cols-2' 
                    : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }`}>
                  {room.members.map((member, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-purple-500/20 hover:border-pink-500/50 transition-all duration-300 hover:scale-105"
                    >
                      {expandedRoom === room._id ? (
                        // Expanded View
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                              <User size={18} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-white truncate">{member.accommodation?.name || 'Unknown'}</h4>
                              <div className="flex items-center gap-1 text-xs text-blue-400 mt-1">
                                <Hash size={12} />
                                <span className="font-mono">{member.uniqueId}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-900/50 rounded p-2 border border-gray-700">
                            <Mail size={12} className="text-pink-400 flex-shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </div>
                        </div>
                      ) : (
                        // Compact View
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                              <User size={14} className="text-white" />
                            </div>
                            <h4 className="font-semibold text-white text-sm truncate">{member.accommodation?.name || 'Unknown'}</h4>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-blue-400">
                            <Hash size={10} />
                            <span className="font-mono">{member.uniqueId}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom glow effect */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

export default RoomCard;