
import React, { useState, useEffect, useMemo } from 'react';
import { User, Batch, BatchStatus } from '../../types';
import { api } from '../../services/mockApi';
import Modal from '../../components/Modal';
import { LeafIcon, CheckCircleIcon, XCircleIcon, ExclamationIcon, ShieldCheckIcon } from '../../components/Icons';

interface RegulatorDashboardProps {
  user: User;
}

const getStatusPill = (status: BatchStatus) => {
  const baseClasses = "px-3 py-1 text-sm font-medium rounded-full inline-flex items-center space-x-1";
  switch (status) {
    case BatchStatus.PENDING: return <span className={`${baseClasses} text-yellow-800 bg-yellow-100`}><ExclamationIcon className="w-4 h-4" /><span>Pending</span></span>;
    case BatchStatus.APPROVED: return <span className={`${baseClasses} text-green-800 bg-green-100`}><CheckCircleIcon className="w-4 h-4" /><span>Approved</span></span>;
    case BatchStatus.REJECTED: return <span className={`${baseClasses} text-red-800 bg-red-100`}><XCircleIcon className="w-4 h-4" /><span>Rejected</span></span>;
    case BatchStatus.RECALLED: return <span className={`${baseClasses} text-purple-800 bg-purple-100`}><ShieldCheckIcon className="w-4 h-4" /><span>Recalled</span></span>;
    default: return <span className={`${baseClasses} text-gray-800 bg-gray-100`}>Unknown</span>;
  }
};

const RegulatorDashboard: React.FC<RegulatorDashboardProps> = ({ user }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BatchStatus | 'all'>('all');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFhirModalOpen, setIsFhirModalOpen] = useState(false);

  useEffect(() => {
    const fetchAllBatches = async () => {
      setIsLoading(true);
      const allBatches = await api.getAllBatches();
      setBatches(allBatches.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setIsLoading(false);
    };
    fetchAllBatches();
  }, []);

  const stats = useMemo(() => ({
    total: batches.length,
    approved: batches.filter(b => b.status === BatchStatus.APPROVED).length,
    rejected: batches.filter(b => b.status === BatchStatus.REJECTED).length,
    recalled: batches.filter(b => b.status === BatchStatus.RECALLED).length,
  }), [batches]);
  
  const filteredBatches = useMemo(() => {
    return batches.filter(batch => {
      const matchesSearch = batch.id.toLowerCase().includes(searchTerm.toLowerCase()) || batch.plantName.toLowerCase().includes(searchTerm.toLowerCase()) || batch.farmerId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = statusFilter === 'all' || batch.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [batches, searchTerm, statusFilter]);

  const handleRecall = async (batchId: string) => {
    if(window.confirm(`Are you sure you want to recall batch ${batchId}? This action cannot be undone.`)){
        await api.updateBatchStatus(batchId, BatchStatus.RECALLED);
        setBatches(batches.map(b => b.id === batchId ? {...b, status: BatchStatus.RECALLED} : b));
        setIsDetailModalOpen(false);
        setSelectedBatch(null);
        alert(`Batch ${batchId} has been recalled.`);
    }
  }

  const handleViewDetails = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsDetailModalOpen(true);
  }

  const handleExportFhir = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsDetailModalOpen(false);
    setIsFhirModalOpen(true);
  }

  const generateFhirResource = (batch: Batch) => {
    if (!batch.labResult) return { error: "No lab result available for this batch." };
    const fhirResource = {
        resourceType: "Observation",
        id: `batch-${batch.id}-lab-result`,
        status: "final",
        code: {
            coding: [{ system: "http://loinc.org", code: "29478-2", display: "Pesticide and Herb Analysis" }],
            text: `Lab test for ${batch.plantName}`
        },
        subject: { reference: `Patient/farmer-${batch.farmerId}`, display: `Farmer ${batch.farmerId}` },
        effectiveDateTime: batch.labResult.uploadedAt,
        valueString: `Result: ${batch.labResult.result}`,
        interpretation: [{
            coding: [{
                system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                code: batch.labResult.result === 'Pass' ? "N" : "A",
                display: batch.labResult.result === 'Pass' ? "Normal" : "Abnormal"
            }]
        }],
        note: [{ text: `Original report file: ${batch.labResult.fileName}` }],
        identifier: [{ system: "https://ayushtrace.example.com/blockchainId", value: batch.blockchainId }]
    };
    return fhirResource;
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Regulator Compliance Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500"><h3 className="text-sm font-medium text-gray-500">Total Batches</h3><p className="mt-1 text-3xl font-semibold text-gray-900">{stats.total}</p></div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500"><h3 className="text-sm font-medium text-gray-500">Approved</h3><p className="mt-1 text-3xl font-semibold text-gray-900">{stats.approved}</p></div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500"><h3 className="text-sm font-medium text-gray-500">Rejected</h3><p className="mt-1 text-3xl font-semibold text-gray-900">{stats.rejected}</p></div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500"><h3 className="text-sm font-medium text-gray-500">Active Recalls</h3><p className="mt-1 text-3xl font-semibold text-gray-900">{stats.recalled}</p></div>
      </div>
      
      {/* Traceability Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Supply Chain Traceability</h3>
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <input type="text" placeholder="Search by ID, plant, or farmer..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-1/2 p-2 border rounded-md"/>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-full sm:w-1/2 p-2 border rounded-md">
                <option value="all">All Statuses</option>
                {Object.values(BatchStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
          </div>
        </div>
         <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farmer ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBatches.map(batch => (
                        <tr key={batch.id} className={`${batch.status === BatchStatus.RECALLED ? 'bg-purple-50' : ''} ${batch.labResult?.result === 'Fail' && batch.status !== BatchStatus.RECALLED ? 'bg-red-50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{batch.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.plantName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.farmerId}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{getStatusPill(batch.status)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <button onClick={() => handleViewDetails(batch)} className="text-green-600 hover:text-green-900">View</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
      
      {/* Details Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={`Batch Details: ${selectedBatch?.id}`}>
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
                 <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedBatch.status !== BatchStatus.RECALLED && (
                        <button onClick={() => handleRecall(selectedBatch.id)} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                            Recall Batch
                        </button>
                    )}
                     <button 
                        onClick={() => handleExportFhir(selectedBatch)} 
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={!selectedBatch.labResult}
                        title={!selectedBatch.labResult ? "A lab result is required to generate a FHIR resource" : ""}
                     >
                         Export to FHIR
                     </button>
                 </div>
             </div>
        )}
      </Modal>

        {/* FHIR Modal */}
      <Modal isOpen={isFhirModalOpen} onClose={() => setIsFhirModalOpen(false)} title={`FHIR Observation: ${selectedBatch?.id}`}>
          {selectedBatch && (
              <div>
                  <h3 className="text-md font-medium text-gray-800 mb-2">FHIR-Compatible JSON Resource</h3>
                  <pre className="bg-gray-800 text-white p-4 rounded-md text-xs overflow-x-auto">
                      <code>
                          {JSON.stringify(generateFhirResource(selectedBatch), null, 2)}
                      </code>
                  </pre>
              </div>
          )}
      </Modal>

    </div>
  );
};

export default RegulatorDashboard;