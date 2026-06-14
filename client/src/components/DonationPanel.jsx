import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Heart, Landmark, Check, AlertCircle, Sparkles } from 'lucide-react';

const DonationPanel = () => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const [campaignStats, setCampaignStats] = useState({
    flood_relief_mumbai: { raised: 4500, donors: 18 },
    cyclone_medical_kits: { raised: 2100, donors: 9 }
  });
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [amount, setAmount] = useState('25');
  const [donorName, setDonorName] = useState(user?.name || 'Anonymous');
  const [email, setEmail] = useState(user?.email || 'donor@example.com');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Campaign config definitions
  const campaigns = [
    {
      id: 'flood_relief_mumbai',
      title: 'Mumbai Urban Flood Relief',
      desc: 'Sourcing clean water, inflatable rescue boats, and hot meals for stranded families in flood-hit sectors.',
      goal: 25000,
      imageColor: 'bg-blue-500 text-white'
    },
    {
      id: 'cyclone_medical_kits',
      title: 'Cyclone Medical Aid Depot',
      desc: 'Deploying mobile medicine kits, sterile dressings, and antibiotics to field clinics and volunteers.',
      goal: 10000,
      imageColor: 'bg-amber-500 text-white'
    }
  ];

  // Fetch campaign statistics on load
  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/donations/stats');
      if (response.data.success) {
        // Merge fetched stats with initial defaults
        setCampaignStats(prev => ({
          ...prev,
          ...response.data.stats
        }));
      }
    } catch (error) {
      console.error('Error fetching donation statistics:', error);
    }
  };

  useEffect(() => {
    fetchStats();

    // Listen for real-time donations via Socket.IO
    if (socket) {
      socket.on('donation-received', (data) => {
        // Play notification sound or show toast
        setToastMessage(`${data.donorName} just donated $${data.amount} to the ${data.campaignId.replace(/_/g, ' ').toUpperCase()} campaign!`);
        setTimeout(() => setToastMessage(null), 5000);
        // Refresh statistics
        fetchStats();
      });
    }

    return () => {
      if (socket) {
        socket.off('donation-received');
      }
    };
  }, [socket]);

  const handleDonateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/donations/create-checkout-session', {
        amount: parseFloat(amount),
        campaignId: selectedCampaign,
        donorName,
      });

      if (response.data.success) {
        // Redirect to Stripe checkout page (or mock success URL)
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error initiating donation session:', error);
      alert('Failed to initiate donation. Try again.');
    } finally {
      setLoading(false);
      setModalOpen(false);
    }
  };

  const openDonateModal = (id) => {
    setSelectedCampaign(id);
    setModalOpen(true);
  };

  return (
    <div class="space-y-6 relative">
      {/* Real-time celebration toast */}
      {toastMessage && (
        <div class="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white px-5 py-4 rounded-2xl shadow-xl shadow-emerald-100 border border-emerald-400 flex items-center gap-3 animate-bounce max-w-sm">
          <Sparkles class="h-6 w-6 text-yellow-200 animate-spin" />
          <div class="text-left">
            <h5 class="font-extrabold text-sm">Donation Milestone!</h5>
            <p class="text-[11px] text-emerald-50 leading-snug">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Campaigns Listing */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        {campaigns.map((camp) => {
          const stats = campaignStats[camp.id] || { raised: 0, donors: 0 };
          const percent = Math.min(100, Math.round((stats.raised / camp.goal) * 100));
          return (
            <div key={camp.id} class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between text-left">
              <div>
                <div class="flex items-center gap-3 mb-3">
                  <div class={`p-3 rounded-xl shadow-inner ${camp.imageColor}`}>
                    <Landmark class="h-5 w-5" />
                  </div>
                  <div>
                    <h3 class="font-extrabold text-brand-navy text-base leading-tight">{camp.title}</h3>
                    <span class="text-[10px] text-slate-400 font-bold uppercase">{stats.donors} Donors Active</span>
                  </div>
                </div>
                <p class="text-xs text-slate-500 leading-relaxed mb-4">{camp.desc}</p>
              </div>

              <div>
                {/* Progress bar */}
                <div class="mb-4">
                  <div class="flex items-center justify-between text-xs font-extrabold text-slate-700 mb-1.5">
                    <span>${stats.raised.toLocaleString()} raised</span>
                    <span class="text-amber-500">{percent}% of ${camp.goal.toLocaleString()}</span>
                  </div>
                  <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      class="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>

                <button
                  onClick={() => openDonateModal(camp.id)}
                  class="w-full bg-brand-navy hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Heart class="h-4 w-4 fill-current text-rose-400" />
                  Fund Relief Campaign
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Donation Modal overlay */}
      {modalOpen && (
        <div class="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl max-w-md w-full text-left animate-in fade-in zoom-in-95 duration-200">
            <h3 class="font-extrabold text-lg text-brand-navy mb-1.5">Support Relief Effort</h3>
            <p class="text-xs text-slate-400 mb-4">Your donations directly procure critical assets for disaster coordinators.</p>

            <form onSubmit={handleDonateSubmit} class="space-y-4">
              <div>
                <label class="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">Select Donation Amount ($)</label>
                <div class="grid grid-cols-4 gap-2 mb-2">
                  {['10', '25', '50', '100'].map(val => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setAmount(val)}
                      class={`py-2 rounded-xl text-xs font-bold border transition ${
                        amount === val
                          ? 'bg-amber-500 text-white border-amber-600'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  required
                  min="5"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-amber-400"
                  placeholder="Custom amount in USD"
                />
              </div>

              <div>
                <label class="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">Donor Name</label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label class="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-3 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  class="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-3 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {loading ? 'Initializing Stripe...' : 'Proceed to Checkout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationPanel;
