
import React, { useState, useEffect, useCallback } from 'react';
import { User, Batch, BatchStatus, LabResult } from '../../types';
import { api } from '../../services/mockApi';
import Modal from '../../components/Modal';
import { CheckCircleIcon, XCircleIcon, ExclamationIcon, UploadIcon, LeafIcon } from '../../components/Icons';

interface LabDashboardProps {
  user: User;
}

const getStatusPill = (status: BatchStatus) => {
  switch (status) {
    case BatchStatus.PENDING:
      return <span className="px-3 py-1 text-sm font-medium text-yellow-800 bg-yellow-100 rounded-full">Pending</span>;
    case BatchStatus.APPROVED:
      return <span className="px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">Approved</span>;
    case BatchStatus.REJECTED:
      return <span className="px-3 py-1 text-sm font-medium text-red-800 bg-red-100 rounded-full">Rejected</span>;
    case BatchStatus.RECALLED:
      return <span className="px-3 py-1 text-sm font-medium text-purple-800 bg-purple-100 rounded-full">Recalled</span>;
    default:
      return <span className="px-3 py-1 text-sm font-medium text-gray-800 bg-gray-100 rounded-full">Unknown</span>;
  }
};

const LabDashboard: React.FC<LabDashboardProps> = ({ user }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBatches = useCallback(async () => {
    setIsLoading(true);
    const allBatches = await api.getAllBatches();
    setBatches(allBatches.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleViewDetails = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsModalOpen(true);
  };
  
  const handleUpdateStatus = async (status: BatchStatus, labResult?: LabResult) => {
    if (!selectedBatch) return;
    
    await api.updateBatchStatus(selectedBatch.id, status, labResult);
    setIsModalOpen(false);
    setSelectedBatch(null);
    fetchBatches(); // Refresh list
  };
  
  const handleLabFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedBatch) return;
    
    const newLabResult: LabResult = {
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      result: Math.random() > 0.2 ? 'Pass' : 'Fail', // 80% pass rate
    };
    
    const newStatus = newLabResult.result === 'Pass' ? BatchStatus.APPROVED : BatchStatus.REJECTED;
    handleUpdateStatus(newStatus, newLabResult);
  };
  
  const handleReject = () => {
      handleUpdateStatus(BatchStatus.REJECTED);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Lab Testing Queue</h2>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plant</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-4">Loading batches...</td></tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{batch.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.plantName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(batch.timestamp).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getStatusPill(batch.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleViewDetails(batch)} className="text-green-600 hover:text-green-900">
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Batch Details: ${selectedBatch?.id}`}>
        {selectedBatch && (
          <div className="space-y-4">
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <LeafIcon className="w-24 h-24 text-gray-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Plant Name:</strong> {selectedBatch.plantName} ({selectedBatch.confidence.toFixed(1)}%)</div>
                <div><strong>Status:</strong> {getStatusPill(selectedBatch.status)}</div>
                <div><strong>Farmer ID:</strong> {selectedBatch.farmerId}</div>
                <div><strong>Submitted:</strong> {new Date(selectedBatch.timestamp).toLocaleString()}</div>
                <div className="md:col-span-2"><strong>Location:</strong> {selectedBatch.location.latitude.toFixed(4)}, {selectedBatch.location.longitude.toFixed(4)}</div>
                <div className="md:col-span-2"><strong>Blockchain ID:</strong> <code className="text-xs break-all">{selectedBatch.blockchainId}</code></div>
            </div>

            {selectedBatch.labResult && (
                <div className={`p-4 rounded-md mt-4 ${selectedBatch.labResult.result === 'Pass' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <h4 className="font-semibold mb-2">Lab Result</h4>
                    <p><strong>File:</strong> {selectedBatch.labResult.fileName}</p>
                    <p><strong>Result:</strong> {selectedBatch.labResult.result}</p>
                    <p><strong>Date:</strong> {new Date(selectedBatch.labResult.uploadedAt).toLocaleString()}</p>
                </div>
            )}
            
            {selectedBatch.status === BatchStatus.PENDING && (
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <input type="file" id="lab-file-upload" className="hidden" onChange={handleLabFileUpload} />
                  <label htmlFor="lab-file-upload" className="w-full text-center cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <UploadIcon className="mr-2 h-5 w-5" />
                    Upload Report & Approve/Reject
                  </label>
                 <button onClick={handleReject} className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <XCircleIcon className="mr-2 h-5 w-5 text-red-500" />
                    Reject without report
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default LabDashboard;
