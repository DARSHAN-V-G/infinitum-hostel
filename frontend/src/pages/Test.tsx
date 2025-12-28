import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const Test: React.FC = () => {
  const [uniqueId, setUniqueId] = useState('INF1234');
  
  const qrData = JSON.stringify({
    type: "PARTICIPANT",
    uniqueId: uniqueId
  });

  const testUsers = [
    { uniqueId: 'INF0001', name: 'Darshan V G' },
    { uniqueId: 'INF5678', name: 'Jane Smith' },
    { uniqueId: 'INF9012', name: 'Bob Johnson' },
    { uniqueId: 'INF3456', name: 'Alice Williams' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[rgba(67,2,105,0.3)] to-gray-900 p-6 tomorrow-regular">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f0e6ff] via-[#ff6b9d] to-[#8b5cf6] tomorrow-bold">
            QR Code Scanner Test Page
          </h1>
          <p className="text-gray-300 mt-2">Generate QR codes to test the scanner functionality</p>
        </div>

        {/* Custom QR Generator */}
        <div className="bg-gray-900/60 backdrop-blur-xl rounded-xl p-6 shadow-2xl border border-[rgba(67,2,105,0.3)] mb-6">
          <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#f0e6ff] to-[#ff6b9d] mb-4">
            Custom QR Code Generator
          </h2>
          
          <div className="mb-4">
            <label className="block text-white text-sm font-medium mb-2">
              Enter Unique ID:
            </label>
            <input
              type="text"
              value={uniqueId}
              onChange={(e) => setUniqueId(e.target.value)}
              placeholder="e.g., INF1234"
              className="w-full px-4 py-3 border border-[rgba(67,2,105,0.4)] rounded-xl placeholder-gray-500 bg-gray-800/50 text-white focus:outline-none focus:ring-2 focus:ring-[#430269] focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-xl">
            <QRCodeSVG value={qrData} size={200} />
            <div className="text-center">
              <p className="text-sm text-gray-600 font-semibold">Unique ID: {uniqueId}</p>
              <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 p-2 rounded">
                {qrData}
              </p>
            </div>
          </div>
        </div>

        {/* Pre-generated Test Users */}
        <div className="bg-gray-900/60 backdrop-blur-xl rounded-xl p-6 shadow-2xl border border-[rgba(67,2,105,0.3)]">
          <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#f0e6ff] to-[#ff6b9d] mb-4">
            Sample Participant QR Codes
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testUsers.map((user) => {
              const userQrData = JSON.stringify({
                type: "PARTICIPANT",
                uniqueId: user.uniqueId
              });

              return (
                <div 
                  key={user.uniqueId}
                  className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow duration-200"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <QRCodeSVG value={userQrData} size={150} />
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">ID: {user.uniqueId}</p>
                      <p className="text-xs text-gray-400 mt-1 font-mono bg-gray-50 p-2 rounded break-all">
                        {userQrData}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-gray-900/60 backdrop-blur-xl rounded-xl p-6 shadow-2xl border border-[rgba(67,2,105,0.3)]">
          <h3 className="text-lg font-semibold text-white mb-3">Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Open the AccommodationDetails page and enable Scanner Mode</li>
            <li>Scan the QR code displayed on your mobile device</li>
            <li>Open the Scanner page from the QR code generated</li>
            <li>Point the scanner at any QR code on this page</li>
            <li>Verify that the Unique ID appears in the AccommodationDetails search field</li>
          </ol>
          
          <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <p className="text-sm text-blue-300">
              <strong>Note:</strong> All QR codes on this page contain JSON data in the format:
              <code className="bg-gray-800 px-2 py-1 rounded ml-1">{'{type: "PARTICIPANT", uniqueId: "..."}'}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;
