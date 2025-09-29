import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Batch, BatchStatus } from '../../types';
import { api } from '../../services/mockApi';
import Modal from '../../components/Modal';
import { LeafIcon, UploadIcon, CheckCircleIcon, XCircleIcon, ExclamationIcon, ShieldCheckIcon, PhoneIcon, RupeeIcon, RibbonIcon, TrendUpIcon, LocationMarkerIcon } from '../../components/Icons';

interface FarmerDashboardProps {
  user: User;
}

// --- Helper Components ---

const getStatusPill = (status: BatchStatus) => {
  const baseClasses = "px-2 py-0.5 text-xs font-medium rounded-full inline-flex items-center space-x-1";
  switch (status) {
    case BatchStatus.APPROVED:
      return <span className={`${baseClasses} text-green-800 bg-green-100`}><CheckCircleIcon className="w-3 h-3" /><span>Approved</span></span>;
    default:
       return <span className={`${baseClasses} text-yellow-800 bg-yellow-100`}><ExclamationIcon className="w-3 h-3" /><span>Pending</span></span>;
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
            className="rounded-lg border border-gray-300"
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
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
        <div className="flex justify-between items-start">
            <div className="p-3 bg-green-100 rounded-lg">
                {icon}
            </div>
            <div className="flex items-center space-x-1 text-sm text-green-600 font-semibold">
                <TrendUpIcon className="w-4 h-4" />
                <span>{change}</span>
            </div>
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-800 mt-4">{value}</p>
            <p className="text-sm text-gray-500">{title}</p>
        </div>
    </div>
);

const HarvestCard: React.FC<{batch: Batch, onClick: () => void}> = ({ batch, onClick }) => (
    <div onClick={onClick} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-4">
            <img src={batch.imageUrl} alt={batch.plantName} className="w-20 h-20 rounded-lg object-cover" />
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">{batch.plantName}</h3>
                    {getStatusPill(batch.status)}
                </div>
                <div className="text-sm text-gray-500 space-y-1 mt-1">
                    <p>{new Date(batch.timestamp).toLocaleDateString()}</p>
                    <p className="flex items-center space-x-1"><LocationMarkerIcon className="w-4 h-4" /> <span>{batch.address?.split(',')[0] || 'Unknown location'}</span></p>
                </div>
            </div>
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
            <div className="text-gray-600"><span className="font-bold">{batch.ivrData?.quantity || 'N/A'}</span></div>
            <div className="text-gray-600">Quality: <span className="font-bold">{batch.qualityScore.toFixed(1)}%</span></div>
            <div className="text-green-700 font-bold text-base">₹{batch.earnings.toLocaleString('en-IN')}</div>
        </div>
    </div>
);

// --- Main Component ---

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

  const stats = useMemo(() => {
    const totalHarvests = batches.length;
    const totalEarnings = batches.reduce((sum, b) => sum + b.earnings, 0);
    const avgQuality = totalHarvests > 0 ? batches.reduce((sum, b) => sum + b.qualityScore, 0) / totalHarvests : 0;
    const approved = batches.filter(b => b.status === BatchStatus.APPROVED).length;
    return { totalHarvests, totalEarnings, avgQuality, approved };
  }, [batches]);

  const resetNewBatchForm = () => {
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
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      resetNewBatchForm();
      setPlantImage(file);
      setImagePreview(URL.createObjectURL(file));

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
  };
  
  const handleInitiateSubmit = () => {
      if (!plantName || !location || !user) return;
      setIsIvrModalOpen(true);
  };

  const handleConfirmIvrAndSubmit = async (e: React.FormEvent) => {
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
  };

  const handleViewDetails = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-green-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold">Welcome, {user.name.split(' ')[0]} 👋</h2>
                    <p className="text-green-100 mt-1">Track your harvests and earnings with blockchain transparency</p>
                    <div className="flex items-center space-x-4 text-sm mt-4 text-green-200">
                        <span className="flex items-center"><LocationMarkerIcon className="w-4 h-4 mr-1" /> {user.country}</span>
                        <span>Member since {new Date(user.memberSince).getFullYear()}</span>
                    </div>
                </div>
                <button
                  onClick={() => setIsNewBatchModalOpen(true)}
                  className="hidden sm:inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-green-700 bg-white hover:bg-green-50"
                >
                  + New Harvest
                </button>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<LeafIcon className="w-6 h-6 text-green-600" />} title="Total Harvests" value={stats.totalHarvests.toString()} change="+12%" />
            <StatCard icon={<RupeeIcon className="w-6 h-6 text-green-600" />} title="Total Earnings" value={`₹${stats.totalEarnings.toLocaleString('en-IN')}`} change="+23%" />
            <StatCard icon={<RibbonIcon className="w-6 h-6 text-green-600" />} title="Avg. Quality" value={`${stats.avgQuality.toFixed(1)}%`} change="+5%" />
            <StatCard icon={<CheckCircleIcon className="w-6 h-6 text-green-600" />} title="Approved" value={stats.approved.toString()} change="+8%" />
        </div>

        {/* Recent Harvests */}
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Recent Harvests</h3>
                <a href="#" className="text-sm font-medium text-green-600 hover:text-green-800">View All</a>
            </div>
            {isLoading ? (
                <div className="text-center py-8">Loading harvests...</div>
            ) : batches.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-200">You haven't submitted any harvests yet.</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {batches.slice(0, 3).map(batch => (
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
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {imagePreview ? (
                    <img src={imagePreview} alt="Plant preview" className="mx-auto h-32 w-auto rounded-md"/>
                ) : (
                    <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                )}
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="plant-image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                    <span>Upload a file</span>
                    <input id="plant-image-upload" name="plant-image-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                  </label>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
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
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm space-y-1">
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
                    <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-md">
                        <p className="font-semibold text-green-800">Plant: <span className="text-lg">{plantName}</span></p>
                        <p className="text-sm text-green-700">Confidence: {confidence.toFixed(1)}%</p>
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
                    className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300"
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
            <div className="flex items-center justify-center text-center p-4 bg-blue-50 rounded-lg">
                <PhoneIcon className="w-8 h-8 text-blue-500 mr-4"/>
                <div>
                    <h3 className="font-semibold text-gray-800">Simulating IVR Call...</h3>
                    <p className="text-sm text-gray-600">Please confirm the details for this batch.</p>
                </div>
            </div>
            <div>
                <label htmlFor="farmerName" className="block text-sm font-medium text-gray-700">Farmer Name</label>
                <input type="text" id="farmerName" value={ivrData.farmerName} onChange={e => setIvrData({...ivrData, farmerName: e.target.value})} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" />
            </div>
             <div>
                <label htmlFor="plantType" className="block text-sm font-medium text-gray-700">Plant Type</label>
                <input type="text" id="plantType" value={ivrData.plantType} onChange={e => setIvrData({...ivrData, plantType: e.target.value})} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" />
            </div>
             <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity (e.g., 50kg)</label>
                <input type="text" id="quantity" value={ivrData.quantity} onChange={e => setIvrData({...ivrData, quantity: e.target.value})} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" />
            </div>
            <div className="pt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
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
                className="mx-auto border-4 border-gray-300 rounded-lg"
              />
              <div className="mt-4 p-2 bg-gray-100 rounded">
                <p className="text-xs text-gray-600">Blockchain ID:</p>
                <code className="text-xs break-all text-gray-800">{newBatchBlockchainId}</code>
              </div>
              <button onClick={() => setIsQrModalOpen(false)} className="mt-6 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  Done
              </button>
          </div>
      </Modal>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={`Batch Details: ${selectedBatch?.id}`}>
        {/* Detail Modal Content remains the same */}
        {selectedBatch && (
          <div className="space-y-4">
             <div className="w-full rounded-lg overflow-hidden border border-gray-300">
                <MapDisplay latitude={selectedBatch.location.latitude} longitude={selectedBatch.location.longitude} />
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-semibold mb-3 text-gray-700 text-center">Blockchain & Traceability</h4>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-shrink-0">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(selectedBatch.blockchainId)}`} 
                          alt="Batch QR Code"
                          className="border-2 border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="text-center sm:text-left">
                        <p className="text-xs text-gray-600 font-semibold">Blockchain ID:</p>
                        <code className="text-xs break-all text-gray-800">{selectedBatch.blockchainId}</code>
                        <p className="text-xs text-gray-500 mt-2">Scan the QR code to access this batch's traceability record on the blockchain.</p>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-semibold mb-2 text-gray-700">Farmer Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-800">
                    <div><strong>Name:</strong> {user.name}</div>
                    <div><strong>Farmer ID:</strong> {selectedBatch.farmerId}</div>
                </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border">
                 <h4 className="font-semibold mb-2 text-gray-700">Crop & Harvest Details</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-800">
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
                <div className={`p-4 rounded-md mt-4 ${selectedBatch.labResult.result === 'Pass' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
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