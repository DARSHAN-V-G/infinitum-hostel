import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import AddRooms from './pages/AddRooms'
import AccommodationDetails from './pages/AccommodationDetails'
import AllAccommodations from './pages/AllAccommodations'
import Scanner from './pages/Scanner'
import ProtectedRoute from './components/ProtectedRoute'
import Test from './pages/Test'
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/scanner" element={<Scanner />} />
      <Route path="/test" element={<Test />} />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="add-rooms" element={<AddRooms />} />
        <Route path="accommodation-details" element={<AccommodationDetails />} />
        <Route path="all-accommodations" element={<AllAccommodations />} />
      </Route>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
