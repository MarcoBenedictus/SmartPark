import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const Dashboard = () => {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);

  // analytics state
  const [stats, setStats] = useState(null);
  const [viewMode, setViewMode] = useState('GRID'); 

  // create form state
  const [newLotName, setNewLotName] = useState('');
  const [newLotCapacity, setNewLotCapacity] = useState('');

  // edit form state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCapacity, setEditCapacity] = useState('');

  // Custom modal State
  const [showModal, setShowModal] = useState(false);
  const [slotToOverride, setSlotToOverride] = useState(null);

  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const isAdmin = role === 'ADMIN';
  const token = localStorage.getItem('token');

  // Get current User ID for booking and etc
  const getMyId = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch (e) { return null; }
  };
  const myId = getMyId();

  const inputStyle = "px-4 py-2 rounded-xl bg-[#1A233A] border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 text-white placeholder-gray-500 outline-none transition-all";

  // Fetch data
  const fetchParkingData = async () => {
    try {
      // Grid Data
      const res = await axios.get('http://localhost:5000/api/parking/lots');
      setLots(res.data);

      // Stats Data (Admin)
      if (isAdmin) {
        try {
            const resStats = await axios.get('http://localhost:5000/api/parking/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(resStats.data);
        } catch (e) { console.error("Stats fetch failed", e); }
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchParkingData();
    const interval = setInterval(fetchParkingData, 2000);
    return () => clearInterval(interval);
  }, [navigate, token]);

  // Helper function to actually do the update 
  const toggleSlotStatus = async (slot) => {
    const newStatus = slot.status === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE';
    try {
      await axios.put(
        `http://localhost:5000/api/parking/slots/${slot.id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchParkingData();
    } catch (err) { alert("Failed to update slot."); }
  };

  // Function called when Admin confirms in the modal
  const confirmOverride = async () => {
    if (slotToOverride) {
      await toggleSlotStatus(slotToOverride);
    }
    setShowModal(false);
    setSlotToOverride(null);
  };

  // Handle Action (Admin for iot, User for booking)
  const handleSlotAction = async (slot) => {
    // Admin logic
    if (isAdmin) {
      if (slot.status === 'RESERVED') {
        setSlotToOverride(slot);
        setShowModal(true); // Show custom popup
        return;
      }

      // If not reserved, update immediately
      await toggleSlotStatus(slot);
      return;
    }

    // User logic (Booking System)
    try {
      if (slot.status === 'AVAILABLE') {
        await axios.post(`http://localhost:5000/api/parking/slots/${slot.id}/book`, {},
          { headers: { Authorization: `Bearer ${token}` } });
      } else if (slot.status === 'RESERVED' && slot.reservedBy === myId) {
        await axios.post(`http://localhost:5000/api/parking/slots/${slot.id}/checkin`, {},
          { headers: { Authorization: `Bearer ${token}` } });
      } else if (slot.status === 'OCCUPIED' && slot.reservedBy === myId) {
        await axios.post(`http://localhost:5000/api/parking/slots/${slot.id}/checkout`, {},
          { headers: { Authorization: `Bearer ${token}` } });
      } else {
        alert("This slot is taken by someone else.");
      }
      fetchParkingData();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    }
  };

  const handleCreateLot = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/parking/lots',
        { name: newLotName, capacity: newLotCapacity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewLotName(''); setNewLotCapacity(''); fetchParkingData();
    } catch (err) { alert("Failed to create lot."); }
  };

  const handleDeleteLot = async (id) => {
    if (!window.confirm("Delete this lot?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/parking/lots/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchParkingData();
    } catch (err) { alert("Failed to delete lot."); }
  };

  const startEditing = (lot) => {
    setEditingId(lot.id);
    setEditName(lot.name);
    setEditCapacity(lot.capacity);
  };

  const saveEdit = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/parking/lots/${id}`,
        { name: editName, capacity: editCapacity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingId(null);
      fetchParkingData();
    } catch (err) { alert("Failed to update lot."); }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  // Styles for slots
  const getSlotStyles = (slot) => {
    if (slot.status === 'AVAILABLE') {
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
    }
    if (slot.status === 'RESERVED') {
      return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-500/60 shadow-[0_0_15px_rgba(234,179,8,0.1)]';
    }
    return 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
  };

  const getSlotIcon = (slot) => {
    if (slot.status === 'AVAILABLE') return '🇵';
    if (slot.status === 'RESERVED') return '⏳';
    return '🚘';
  };

  const getSlotLabel = (slot) => {
    if (isAdmin) return slot.status;
    if (slot.reservedBy === myId) {
      if (slot.status === 'RESERVED') return 'CHECK IN';
      if (slot.status === 'OCCUPIED') return 'CHECK OUT';
    }
    return slot.status;
  };

  // BONUS : PIE DATA PREP
  const pieData = stats ? [
    { name: 'Available', value: stats.systemStats.totalAvailable, color: '#10B981' }, 
    { name: 'Occupied', value: stats.systemStats.totalOccupied, color: '#EF4444' }, 
  ] : [];

  if (loading) return <div className="min-h-screen bg-[#050914] flex items-center justify-center text-white">Loading</div>;

  return (
    <div className="min-h-screen bg-[#050914] font-sans pb-20 relative">

      {/* Custom Warning Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1629] border border-gray-700 rounded-[2rem] shadow-2xl p-8 max-w-md w-full transform transition-all scale-100">
            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                <span className="text-3xl">❗</span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">Override Reservation?</h3>

              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                This slot is currently <strong className="text-yellow-400">RESERVED</strong> by a customer.
                <br />
                Forcing this action will cancel their reservation and make the slot Available immediately.
              </p>

              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl bg-[#1A233A] text-gray-300 font-medium hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmOverride}
                  className="flex-1 px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400 font-bold hover:bg-red-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all"
                >
                  Yes, Override
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOPBAR */}
      <nav className="bg-[#0F1629] border-b border-gray-800 shadow-lg mb-8">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img
              src="/smartparklogo.png"
              alt="SmartPark Logo"
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-2xl font-bold text-white tracking-wide hidden sm:block">
              SmartPark <span className="text-[#564DEA]">Manager</span>
            </h1>
          </div>

          {/* VIEW SWITCHER (ADMIN) */}
          {isAdmin && (
            <div className="flex bg-[#1A233A] p-1 rounded-xl border border-gray-700">
                <button 
                    onClick={() => setViewMode('GRID')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'GRID' ? 'bg-[#564DEA] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    🅿️ Parking Lots
                </button>
                <button 
                    onClick={() => setViewMode('ANALYTICS')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'ANALYTICS' ? 'bg-[#564DEA] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    📊 Analytics
                </button>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-5 py-2 rounded-xl text-sm transition-all"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4">

        {/* LIVE GRID */}
        {viewMode === 'GRID' && (
        <>
            {/* CREATE FORM */}
            {isAdmin && (
            <div className="bg-[#0F1629] p-6 rounded-[2rem] shadow-xl border border-gray-800 mb-8">
                <h3 className="font-bold text-white mb-4 text-lg">✚ Add New Parking Lot</h3>
                <form onSubmit={handleCreateLot} className="flex flex-col sm:flex-row gap-4">
                <input
                    className={`w-full ${inputStyle}`}
                    placeholder="Lot Name"
                    value={newLotName}
                    onChange={e => setNewLotName(e.target.value)}
                />
                <input
                    className={`w-full sm:w-32 ${inputStyle}`}
                    type="number"
                    placeholder="Slots"
                    value={newLotCapacity}
                    onChange={e => setNewLotCapacity(e.target.value)}
                />
                <button className="bg-[#564DEA] hover:bg-[#463DCA] text-white px-8 py-2 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 transition-all">
                    ✚ Add
                </button>
                </form>
            </div>
            )}

            {/* LOTS LOOP */}
            <div className="space-y-8">
            {lots.map((lot) => (
                <div key={lot.id} className="bg-[#0F1629] rounded-[2rem] shadow-2xl border border-gray-800 overflow-hidden">

                {/* HEADER */}
                <div className="bg-[#131b31] px-6 py-5 border-b border-gray-800 flex justify-between items-center">

                    {editingId === lot.id ? (
                    // EDIT MODE
                    <div className="flex gap-2 items-center w-full">
                        <input
                        className={inputStyle}
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        />
                        <input
                        className={`w-24 ${inputStyle}`}
                        type="number"
                        value={editCapacity}
                        onChange={e => setEditCapacity(e.target.value)}
                        />
                        <button onClick={() => saveEdit(lot.id)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-emerald-600 transition-colors">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-white text-sm px-2">Cancel</button>
                    </div>
                    ) : (
                    // VIEW MODE
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        🏬 {lot.name}
                        <span className="text-xs font-normal text-gray-400 bg-[#1A233A] border border-gray-700 px-3 py-1 rounded-full">
                        Capacity: {lot.capacity}
                        </span>
                    </h2>
                    )}

                    {/* ACTION BUTTONS */}
                    {isAdmin && editingId !== lot.id && (
                    <div className="flex gap-2">
                        <button
                        onClick={() => startEditing(lot)}
                        className="text-[#564DEA] hover:bg-[#564DEA]/10 px-3 py-2 rounded-lg border border-[#564DEA]/30 text-sm transition-all"
                        >
                        ✏️ Edit
                        </button>
                        <button
                        onClick={() => handleDeleteLot(lot.id)}
                        className="text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/30 text-sm transition-all"
                        >
                        🗑️ Delete
                        </button>
                    </div>
                    )}
                </div>

                {/* SLOTS CONTAINER */}
                <div className="p-8">
                    <div className="flex flex-wrap justify-center gap-3">
                    {lot.slots && lot.slots.map((slot) => {
                        const isMySlot = slot.reservedBy === myId;
                        const canInteract = isAdmin || slot.status === 'AVAILABLE' || isMySlot;

                        return (
                        <button
                            key={slot.id}
                            onClick={() => handleSlotAction(slot)}
                            disabled={!canInteract}

                            className={`
                            h-24 
                            w-[calc(20%-0.75rem)] lg:w-[calc(10%-0.75rem)]
                            rounded-xl flex flex-col items-center justify-center border transition-all duration-300 relative overflow-hidden
                            ${getSlotStyles(slot)}
                            ${canInteract ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed opacity-40'}
                            `}
                        >
                            <span className="text-sm font-bold tracking-widest opacity-80">{slot.slot_number}</span>

                            <div className="mt-2 text-4xl">
                            {getSlotIcon(slot)}
                            </div>

                            <span className="text-[10px] uppercase font-bold mt-1 tracking-wider opacity-90">
                            {getSlotLabel(slot)}
                            </span>
                        </button>
                        );
                    })}
                    </div>
                </div>
                </div>
            ))}
            </div>
        </>
        )}

        {/* BONUS : ANALYTICS */}
        {viewMode === 'ANALYTICS' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
                
                {/* PIE CHART */}
                <div className="bg-[#0F1629] p-8 rounded-[2rem] shadow-2xl border border-gray-800 flex flex-col items-center">
                    <h3 className="text-xl font-bold text-white mb-2">Overall Occupancy</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={pieData} 
                                    cx="50%" cy="50%" 
                                    innerRadius={60} 
                                    outerRadius={80} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1A233A', border: '1px solid #374151', borderRadius: '10px', color: '#ffff' }} 
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-4xl font-bold text-white">{stats.systemStats.occupancyRate}%</p>
                        <p className="text-gray-400 text-sm">Total Usage</p>
                    </div>
                </div>

                {/* BAR CHART */}
                <div className="bg-[#0F1629] p-8 rounded-[2rem] shadow-2xl border border-gray-800">
                    <h3 className="text-xl font-bold text-white mb-6">Occupancy per Mall</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.lotStats}>
                                <XAxis dataKey="name" stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1A233A', border: '1px solid #374151', borderRadius: '10px', color: '#fff' }}
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                />
                                <Bar dataKey="occupied" name="Occupied" fill="#564DEA" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="capacity" name="Total Capacity" fill="#1F2937" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* SUMMARY */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-4">
                    <div className="bg-[#1A233A] p-6 rounded-2xl border border-gray-700">
                        <p className="text-gray-400 text-sm uppercase font-bold">Total Capacity</p>
                        <p className="text-3xl font-bold text-white">{stats.systemStats.totalSlots}</p>
                    </div>
                    <div className="bg-[#1A233A] p-6 rounded-2xl border border-gray-700">
                        <p className="text-emerald-400 text-sm uppercase font-bold">Total Available</p>
                        <p className="text-3xl font-bold text-emerald-400">{stats.systemStats.totalAvailable}</p>
                    </div>
                    <div className="bg-[#1A233A] p-6 rounded-2xl border border-gray-700">
                        <p className="text-red-400 text-sm uppercase font-bold">Total Occupied</p>
                        <p className="text-3xl font-bold text-red-400">{stats.systemStats.totalOccupied}</p>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;