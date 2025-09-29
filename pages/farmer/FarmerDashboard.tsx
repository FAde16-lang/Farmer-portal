import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Batch, BatchStatus } from '../../types';
import { api } from '../../services/mockApi';
import Modal from '../../components/Modal';
import { LeafIcon, UploadIcon, CheckCircleIcon, XCircleIcon, ExclamationIcon, ShieldCheckIcon, PhoneIcon, RupeeIcon, RibbonIcon, TrendUpIcon, LocationMarkerIcon } from '../../components/Icons';

// --- Helper Components ---

const getStatusPill = (status: BatchStatus) => {
  const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center space-x-1.5";
  switch (status) {
    case BatchStatus.APPROVED:
      return <span className={`${baseClasses} text-emerald-800 bg-emerald-100`}><CheckCircleIcon className="w-3.5 h-3.5" /><span>Approved</span></span>;
    case BatchStatus.REJECTED:
      return <span className={`${baseClasses} text-red-800 bg-red-100`}><XCircleIcon className="w-3.5 h-3.5" /><span>Rejected</span></span>;
    case BatchStatus.RECALLED:
      return <span className={`${baseClasses} text-indigo-800 bg-indigo-100`}><ShieldCheckIcon className="w-3.5 h-3.5" /><span>Recalled</span></span>;
    case BatchStatus.PENDING:
    default:
       return <span className={`${baseClasses} text-amber-800 bg-amber-100`}><ExclamationIcon className="w-3.5 h-3.5" /><span>Pending</span></span>;
  }
};

const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const MapDisplay = ({ latitude, longitude }: { latitude: number, longitude: number }) => {
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&layer=mapnik&marker=${latitude},${longitude}`;
    return (
        <iframe
            width="100%"
            height="200"
            frameBorder="0"
            scrolling="no"
            src={mapUrl}
            className="rounded-xl border border-stone-200"
            title="Harvest Location"
        ></iframe>
    );
};

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    change: string;
}
const StatCard: React.FC<StatCardProps> = ({icon, title, value, change}) => (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-stone-100 transition-shadow hover:shadow-xl">
        <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-100 rounded-xl">
                {icon}
            </div>
            <div className="flex items-center space-x-1 text-sm text-emerald-600 font-semibold">
                <TrendUpIcon className="w-4 h-4" />
                <span>{change}</span>
            </div>
        </div>
        <div>
            <p className="text-3xl font-bold text-gray-800 mt-5">{value}</p>
            <p className="text-sm text-stone-500">{title}</p>
        </div>
    </div>
);

const HarvestCard: React.FC<{batch: Batch, onClick: () => void}> = ({ batch, onClick }) => (
    <div onClick={onClick} className="bg-white p-5 rounded-2xl shadow-md border border-stone-100 cursor-pointer hover:shadow-xl hover:border-emerald-300 transition-all transform hover:-translate-y-1 space-y-3">
        <div className="flex justify-between items-start">
            <div>
                 <h3 className="font-bold text-lg text-gray-800">{batch.plantName}</h3>
                 <p className="text-sm text-stone-500">{new Date(batch.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
             {getStatusPill(batch.status)}
        </div>
        <div className="pt-3 border-t border-stone-100 space-y-3 text-sm">
            <div className="flex justify-between items-center">
                <span className="text-stone-500">Batch ID</span>
                <span className="font-semibold font-mono text-stone-700 bg-stone-100 px-2 py-0.5 rounded">{batch.id}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-stone-500">Earnings</span>
                <span className="font-bold text-emerald-600 text-base">₹{batch.earnings.toLocaleString('en-IN')}</span>
            </div>
        </div>
    </div>
);


// --- Main Component ---

// FIX: Define FarmerDashboardProps interface to specify the component's props.
interface FarmerDashboardProps {
  user: User;
}

const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ user }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isIvrModalOpen, setIsIvrModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [newBatchBlockchainId, setNewBatchBlockchainId] = useState('');


  // New Batch State
  const [plantImage, setPlantImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [plantName, setPlantName] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [address, setAddress] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // IVR State
  const [ivrData, setIvrData] = useState({ farmerName: user.name, plantType: '', quantity: '10' });


  const fetchBatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const farmerBatches = await api.getBatchesByFarmer(user.id);
      setBatches(farmerBatches.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (error) {
      console.error("Failed to fetch batches:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const resetNewBatchForm = useCallback(() => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setPlantImage(null);
    setImagePreview(null);
    setPlantName('');
    setConfidence(0);
    setLocation(null);
    setAddress('');
    setLocationError('');
    setIsRecognizing(false);
    setIsSubmitting(false);
    setIsGettingLocation(false);
    setIsFetchingAddress(false);
  }, [imagePreview]);
  
  const handleOpenNewHarvestModal = useCallback(() => {
      resetNewBatchForm();
      setIsNewBatchModalOpen(true);
  }, [resetNewBatchForm]);

  useEffect(() => {
    document.addEventListener('openNewHarvestModal', handleOpenNewHarvestModal);
    return () => {
      document.removeEventListener('openNewHarvestModal', handleOpenNewHarvestModal);
    };
  }, [handleOpenNewHarvestModal]);

  const stats = useMemo(() => {
    const totalHarvests = batches.length;
    const totalEarnings = batches.reduce((sum, b) => sum + b.earnings, 0);
    const avgQuality = totalHarvests > 0 ? batches.reduce((sum, b) => sum + b.qualityScore, 0) / totalHarvests : 0;
    const approved = batches.filter(b => b.status === BatchStatus.APPROVED).length;
    return { totalHarvests, totalEarnings, avgQuality, approved };
  }, [batches]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
      }
      setPlantImage(file);
      const newImagePreview = URL.createObjectURL(file);
      setImagePreview(newImagePreview);

      setIsGettingLocation(true);
      setLocationError('');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          setIsGettingLocation(false);
          setIsFetchingAddress(true);
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(response => response.json())
            .then(data => setAddress(data?.display_name || 'Address not found'))
            .catch(() => setAddress('Could not fetch address'))
            .finally(() => setIsFetchingAddress(false));
        },
        (error) => {
          setLocationError(`Location Error: ${error.message}.`);
          setIsGettingLocation(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );

      setIsRecognizing(true);
      api.recognizePlant(file)
        .then(result => {
          setPlantName(result.plantName);
          setConfidence(result.confidence);
          setIvrData(prev => ({ ...prev, plantType: result.plantName }));
        })
        .catch(error => alert("Could not recognize the plant."))
        .finally(() => setIsRecognizing(false));
    }
  }, [imagePreview]);
  
  const handleInitiateSubmit = useCallback(() => {
      if (!plantName || !location || !user) return;
      setIsIvrModalOpen(true);
  }, [plantName, location, user]);

  const handleConfirmIvrAndSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantName || !location || !user) return;
    
    setIsSubmitting(true);
    try {
      const result = await api.submitBatch({
        farmerId: user.id,
        plantName,
        confidence,
        timestamp: new Date().toISOString(),
        location,
        address,
        ivrData,
      });

      setNewBatchBlockchainId(result.blockchainId);
      setIsNewBatchModalOpen(false);
      setIsIvrModalOpen(false);
      alert("SMS Confirmation Sent! Batch submitted successfully.");
      setIsQrModalOpen(true);
      resetNewBatchForm();
      fetchBatches();
    } catch (error) {
      alert("An error occurred while submitting the batch.");
    } finally {
      setIsSubmitting(false);
    }
  }, [user, plantName, confidence, location, address, ivrData, fetchBatches, resetNewBatchForm]);

  const handleViewDetails = useCallback((batch: Batch) => {
    setSelectedBatch(batch);
    setIsDetailModalOpen(true);
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-emerald-700 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full"></div>
             <div className="absolute bottom-10 -left-20 w-60 h-60 bg-white/10 rounded-full"></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h2 className="text-3xl font-bold">Welcome, {user.name.split(' ')[0]} 👋</h2>
                    <p className="text-emerald-100 mt-2 max-w-lg">Here's your dashboard overview for today. Keep up the great work in bringing authentic Ayurvedic herbs to the world.</p>
                </div>
                <button
                  onClick={handleOpenNewHarvestModal}
                  className="hidden sm:inline-flex items-center justify-center px-5 py-3 border border-transparent text-sm font-semibold rounded-full shadow-sm text-emerald-700 bg-white hover:bg-emerald-50 transition-colors"
                >
                  + Add New Harvest
                </button>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<LeafIcon className="w-7 h-7 text-emerald-600" />} title="Total Harvests" value={stats.totalHarvests.toString()} change="+12%" />
            <StatCard icon={<RupeeIcon className="w-7 h-7 text-emerald-600" />} title="Total Earnings" value={`₹${stats.totalEarnings.toLocaleString('en-IN')}`} change="+23%" />
            <StatCard icon={<RibbonIcon className="w-7 h-7 text-emerald-600" />} title="Avg. Quality Score" value={`${stats.avgQuality.toFixed(1)}%`} change="+5%" />
            <StatCard icon={<CheckCircleIcon className="w-7 h-7 text-emerald-600" />} title="Approved Batches" value={stats.approved.toString()} change="+8%" />
        </div>

        {/* Recent Harvests */}
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800">Recent Harvests</h3>
                <a href="#" className="text-sm font-semibold text-emerald-600 hover:text-emerald-800">View All</a>
            </div>
            {isLoading ? (
                <div className="text-center py-12 text-stone-500">Loading harvests...</div>
            ) : batches.length === 0 ? (
                <div className="text-center py-12 text-stone-500 bg-white rounded-2xl border-2 border-dashed border-stone-200">
                    <p className="font-semibold">No harvests yet!</p>
                    <p className="text-sm">Click "+ Add New Harvest" to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {batches.slice(0, 6).map(batch => (
                        <HarvestCard key={batch.id} batch={batch} onClick={() => handleViewDetails(batch)} />
                    ))}
                </div>
            )}
        </div>

        {/* --- Modals --- */}
      <Modal isOpen={isNewBatchModalOpen} onClose={() => { setIsNewBatchModalOpen(false); resetNewBatchForm(); }} title="Submit a New Crop Batch">
        {/* New Batch Modal Content remains the same */}
        <div className="space-y-4">
          <div>
            <label htmlFor="plant-image-upload" className="block text-sm font-medium text-gray-700 mb-2">
              1. Upload Plant Image
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl">
              <div className="space-y-1 text-center">
                {imagePreview ? (
                    <img src={imagePreview} alt="Plant preview" className="mx-auto h-40 w-auto rounded-lg shadow-sm"/>
                ) : (
                    <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                )}
                <div className="flex text-sm text-gray-600 justify-center">
                  <label htmlFor="plant-image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500">
                    <span>{imagePreview ? 'Change image' : 'Upload a file'}</span>
                    <input id="plant-image-upload" name="plant-image-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                  </label>
                </div>
                {!imagePreview && <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>}
              </div>
            </div>
          </div>
          
           {plantImage && (
            <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">2. Geo-Location</h3>
                  {isGettingLocation ? (
                    <div className="mt-2 text-center text-gray-500">Getting location...</div>
                  ) : locationError ? (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{locationError}</div>
                  ) : location ? (
                    <div className="mt-2 space-y-2">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm space-y-1">
                            <p><strong>Coordinates:</strong> {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
                            {isFetchingAddress ? (
                                <p>Fetching address...</p>
                            ) : address ? (
                                <p><strong>Address:</strong> {address}</p>
                            ) : null}
                        </div>
                        <MapDisplay latitude={location.latitude} longitude={location.longitude} />
                    </div>
                  ) : null}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700">3. AI Recognition Result</h3>
                  {isRecognizing ? (
                     <div className="mt-2 text-center text-gray-500">Recognizing...</div>
                  ) : plantName ? (
                    <div className="mt-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <p className="font-semibold text-emerald-800">Plant: <span className="text-xl">{plantName}</span></p>
                        <p className="text-sm text-emerald-700">Confidence: {confidence.toFixed(1)}%</p>
                    </div>
                  ) : (
                    <div className="mt-2 text-center text-gray-500">Upload an image to see the result.</div>
                  )}
              </div>
          
              <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">4. Submit to Blockchain</h3>
                  <p className="text-xs text-gray-500 mb-2">This will initiate a confirmation call (IVR) to finalize batch details.</p>
                  <button
                    type="button"
                    onClick={handleInitiateSubmit}
                    disabled={!plantName || !location || isRecognizing || isSubmitting || isGettingLocation || isFetchingAddress}
                    className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Submit Batch
                  </button>
                  {(!plantName || !location || isFetchingAddress) && <p className="text-xs text-red-500 mt-1 text-center">Please wait for recognition and location capture before submitting.</p>}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={isIvrModalOpen} onClose={() => setIsIvrModalOpen(false)} title="IVR Confirmation">
        {/* IVR Modal Content remains the same */}
        <form onSubmit={handleConfirmIvrAndSubmit} className="space-y-4">
            <div className="flex items-center text-left p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <PhoneIcon className="w-8 h-8 text-emerald-600 mr-4 flex-shrink-0"/>
                <div>
                    <h3 className="font-semibold text-emerald-900">Confirm Harvest Details</h3>
                    <p className="text-sm text-emerald-800">An IVR call is simulated. Please verify the quantity before final submission.</p>
                </div>
            </div>
            <div>
                <label htmlFor="farmerName" className="block text-sm font-medium text-gray-700">Farmer Name</label>
                <input type="text" id="farmerName" value={ivrData.farmerName} onChange={e => setIvrData({...ivrData, farmerName: e.target.value})} required className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white text-gray-900" />
            </div>
             <div>
                <label htmlFor="plantType" className="block text-sm font-medium text-gray-700">Plant Type</label>
                <input type="text" id="plantType" value={ivrData.plantType} onChange={e => setIvrData({...ivrData, plantType: e.target.value})} required className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white text-gray-900" />
            </div>
             <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity (e.g., 50kg)</label>
                <input type="text" id="quantity" value={ivrData.quantity} onChange={e => setIvrData({...ivrData, quantity: e.target.value})} required className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white text-gray-900" />
            </div>
            <div className="pt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-gray-400"
                >
                    {isSubmitting && <LoadingSpinner />}
                    {isSubmitting ? 'Confirming...' : 'Confirm and Submit Batch'}
                </button>
            </div>
        </form>
      </Modal>

      <Modal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} title="Batch Submitted Successfully!">
          {/* QR Code Modal Content remains the same */}
          <div className="text-center">
              <h3 className="text-lg font-medium text-gray-800">Batch QR Code</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">Scan this code for batch traceability.</p>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(newBatchBlockchainId)}`} 
                alt="Batch QR Code"
                className="mx-auto border-4 border-stone-300 rounded-lg"
              />
              <div className="mt-4 p-2 bg-stone-100 rounded">
                <p className="text-xs text-stone-600">Blockchain ID:</p>
                <code className="text-xs break-all text-stone-800">{newBatchBlockchainId}</code>
              </div>
              <button onClick={() => setIsQrModalOpen(false)} className="mt-6 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                  Done
              </button>
          </div>
      </Modal>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={`Batch Details: ${selectedBatch?.id}`}>
        {/* Detail Modal Content remains the same */}
        {selectedBatch && (
          <div className="space-y-4">
             <div className="w-full rounded-lg overflow-hidden border border-stone-300">
                <MapDisplay latitude={selectedBatch.location.latitude} longitude={selectedBatch.location.longitude} />
            </div>
            <div className="p-4 bg-stone-50 rounded-lg border">
                <h4 className="font-semibold mb-3 text-stone-700 text-center">Blockchain & Traceability</h4>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-shrink-0">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(selectedBatch.blockchainId)}`} 
                          alt="Batch QR Code"
                          className="border-2 border-stone-300 rounded-md"
                        />
                    </div>
                    <div className="text-center sm:text-left">
                        <p className="text-xs text-stone-600 font-semibold">Blockchain ID:</p>
                        <code className="text-xs break-all text-stone-800">{selectedBatch.blockchainId}</code>
                        <p className="text-xs text-stone-500 mt-2">Scan the QR code to access this batch's traceability record on the blockchain.</p>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-lg border">
                <h4 className="font-semibold mb-2 text-stone-700">Farmer Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-stone-800">
                    <div><strong>Name:</strong> {user.name}</div>
                    <div><strong>Farmer ID:</strong> {selectedBatch.farmerId}</div>
                </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-lg border">
                 <h4 className="font-semibold mb-2 text-stone-700">Crop & Harvest Details</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-stone-800">
                    <div><strong>Plant Name:</strong> {selectedBatch.plantName}</div>
                    <div><strong>AI Confidence:</strong> {selectedBatch.confidence.toFixed(1)}%</div>
                    <div><strong>Status:</strong> {getStatusPill(selectedBatch.status)}</div>
                     {selectedBatch.ivrData?.quantity && (
                        <div><strong>Harvest Quantity:</strong> {selectedBatch.ivrData.quantity}</div>
                     )}
                    <div className="sm:col-span-2"><strong>Submitted At:</strong> {new Date(selectedBatch.timestamp).toLocaleString()}</div>
                    <div className="sm:col-span-2"><strong>Harvest Address:</strong> {selectedBatch.address || 'N/A'}</div>
                 </div>
            </div>
           
            {selectedBatch.labResult && (
                <div className={`p-4 rounded-md mt-4 ${selectedBatch.labResult.result === 'Pass' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                    <h4 className="font-semibold mb-2">Lab Result</h4>
                    <p><strong>File:</strong> {selectedBatch.labResult.fileName}</p>
                    <p><strong>Result:</strong> {selectedBatch.labResult.result}</p>
                    <p><strong>Date:</strong> {new Date(selectedBatch.labResult.uploadedAt).toLocaleString()}</p>
                </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FarmerDashboard;
