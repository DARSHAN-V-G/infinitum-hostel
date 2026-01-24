import React, { useState, useEffect } from 'react';
import { accommodationAPI } from '../api';
import { toast } from 'react-hot-toast';

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
  amount: number;
  payment: boolean;
  vacated: boolean;
  optin: boolean;
  room: {
    _id: string;
    RoomName: string;
    gender: string;
    Capacity: number;
    currentOccupancy: number;
  } | null;
}

const AllAccommodations: React.FC = () => {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPayment, setFilterPayment] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [filterRoom, setFilterRoom] = useState<'all' | 'allocated' | 'unallocated'>('all');

  useEffect(() => {
    fetchAllAccommodations();
  }, []);

  const fetchAllAccommodations = async () => {
    try {
      const response = await accommodationAPI.getAll();
      setAccommodations(response.data);
    } catch (error: any) {
      console.error('Error fetching accommodations:', error);
      toast.error('Failed to load accommodations');
    } finally {
      setLoading(false);
    }
  };

  const filteredAccommodations = accommodations.filter((acc) => {
    const matchesSearch = 
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.uniqueId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPayment = 
      filterPayment === 'all' ||
      (filterPayment === 'paid' && acc.payment) ||
      (filterPayment === 'unpaid' && !acc.payment);

    const matchesRoom = 
      filterRoom === 'all' ||
      (filterRoom === 'allocated' && acc.room !== null) ||
      (filterRoom === 'unallocated' && acc.room === null);

    return matchesSearch && matchesPayment && matchesRoom;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-900 via-purple-900/20 to-black min-h-screen">
        <div className="flex items-center justify-center h-96">
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
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 tomorrow-bold">All Accommodations</h1>
          <p className="text-gray-400 mt-1">View all registered accommodation members</p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 bg-gray-900/60 backdrop-blur-xl rounded-xl p-4 shadow-2xl border border-purple-500/30">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search by name, email, or unique ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-purple-500/30 rounded-lg bg-gray-800/50 backdrop-blur-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Payment Filter */}
            <div>
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value as 'all' | 'paid' | 'unpaid')}
                className="w-full px-4 py-2 border border-purple-500/30 rounded-lg bg-gray-800/50 backdrop-blur-sm text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            {/* Room Filter */}
            <div>
              <select
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value as 'all' | 'allocated' | 'unallocated')}
                className="w-full px-4 py-2 border border-purple-500/30 rounded-lg bg-gray-800/50 backdrop-blur-sm text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Rooms</option>
                <option value="allocated">Allocated</option>
                <option value="unallocated">Unallocated</option>
              </select>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-400">
            Showing {filteredAccommodations.length} of {accommodations.length} accommodations
          </div>
        </div>

        {/* Accommodation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAccommodations.map((accommodation) => (
            <div
              key={accommodation._id}
              onClick={() => setSelectedAccommodation(accommodation)}
              className="bg-gray-900/60 backdrop-blur-xl rounded-xl p-4 shadow-2xl hover:shadow-purple-500/20 transition-all duration-200 cursor-pointer border border-purple-500/30 hover:border-pink-500/50 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 text-lg truncate">
                    {accommodation.name}
                  </h3>
                  <p className="text-sm text-gray-400">{accommodation.uniqueId}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${accommodation.payment ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'}`}></div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center text-sm text-gray-400">
                  <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="capitalize">{accommodation.gender}</span>
                </div>

                <div className="flex items-center text-sm text-gray-400">
                  <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="truncate">
                    {accommodation.room ? accommodation.room.RoomName : 'No Room'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-purple-500/20">
                <span className="text-xs font-medium text-gray-500">
                  {accommodation.payment ? 'Paid' : 'Unpaid'}
                </span>
                <span className="text-sm font-semibold text-purple-300">
                  {formatCurrency(accommodation.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredAccommodations.length === 0 && (
          <div className="bg-gray-900/60 backdrop-blur-xl rounded-xl shadow-2xl p-12 text-center border border-purple-500/30">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-2">No accommodations found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Detail Modal */}
        {selectedAccommodation && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-purple-500/30">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600/40 to-pink-600/40 p-6 flex items-center justify-between border-b border-purple-500/20">
                <div>
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">{selectedAccommodation.name}</h2>
                  <p className="text-purple-300">{selectedAccommodation.uniqueId}</p>
                </div>
                <button
                  onClick={() => setSelectedAccommodation(null)}
                  className="text-purple-300 hover:text-pink-300 hover:bg-purple-500/10 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Payment Status */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-purple-500/20">
                  <span className="font-medium text-gray-400">Payment Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedAccommodation.payment
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {selectedAccommodation.payment ? `Paid - ${formatCurrency(selectedAccommodation.amount)}` : 'Unpaid'}
                  </span>
                </div>

                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-3 border-b border-purple-500/20 pb-2">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-300">{selectedAccommodation.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-300">{selectedAccommodation.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Gender</label>
                      <p className="text-gray-300 capitalize">{selectedAccommodation.gender}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">College</label>
                      <p className="text-gray-300">{selectedAccommodation.college}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500">Residential Address</label>
                      <p className="text-gray-300">{selectedAccommodation.residentialAddress}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">City</label>
                      <p className="text-gray-300">{selectedAccommodation.city}</p>
                    </div>
                  </div>
                </div>

                {/* Room Information */}
                <div>
                  <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-3 border-b border-purple-500/20 pb-2">
                    Room Information
                  </h3>
                  {selectedAccommodation.room ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Room Name</label>
                        <p className="text-gray-300">{selectedAccommodation.room.RoomName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Gender</label>
                        <p className="text-gray-300">{selectedAccommodation.room.gender.charAt(0).toUpperCase() + selectedAccommodation.room.gender.slice(1)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Capacity</label>
                        <p className="text-gray-300">{selectedAccommodation.room.Capacity}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Current Occupancy</label>
                        <p className="text-gray-300">{selectedAccommodation.room.currentOccupancy}/{selectedAccommodation.room.Capacity}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No room allocated</p>
                  )}
                </div>

                {/* Additional Status */}
                <div className="flex items-center space-x-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${
                    selectedAccommodation.vacated
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}>
                    {selectedAccommodation.vacated ? 'Vacated' : 'Active'}
                  </div>
                  {selectedAccommodation.optin && (
                    <div className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Opted In
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-800/50 backdrop-blur-sm p-4 flex justify-end border-t border-purple-500/20">
                <button
                  onClick={() => setSelectedAccommodation(null)}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-200 shadow-lg shadow-purple-500/25"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllAccommodations;