import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const Reports: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/')} className="p-2 bg-white rounded-lg shadow">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Health Reports</h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No reports generated yet</p>
            <button onClick={() => navigate('/')} className="mt-4 text-blue-600 hover:underline">
              Generate your first report from dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;