import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface GeneralLedgerEntry {
  id: number;
  date: string;
  account: number;
  account_name: string;
  account_code: string;
  journal_entry: number;
  journal_entry_number: string;
  debit: number;
  credit: number;
  reference: string;
  description: string;
  running_balance: number;
  created_by_name?: string;
  created_at: string;
}

interface AccountSummary {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  account_type_display: string;
  debit_balance: number;
  credit_balance: number;
  balance: number;
  opening_balance: number;
  is_active: boolean;
}

const GeneralLedger: React.FC = () => {
  const [viewMode, setViewMode] = useState<'summary' | 'entries'>('summary');
  const [accountSummaries, setAccountSummaries] = useState<AccountSummary[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<GeneralLedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [filteredEntries, setFilteredEntries] = useState<GeneralLedgerEntry[]>([]);

  useEffect(() => {
    fetchData();
  }, [viewMode, dateFrom, dateTo, selectedAccount]);

  useEffect(() => {
    filterEntries();
  }, [ledgerEntries, searchTerm, selectedAccount]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (viewMode === 'summary') {
        // Fetch account summaries
        const params = new URLSearchParams();
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        
        const response = await api.get(`/general-ledger/account_summary/?${params.toString()}`);
        const data = response.data?.results || response.data || [];
        setAccountSummaries(Array.isArray(data) ? data : []);
      } else {
        // Fetch ledger entries
        const params = new URLSearchParams();
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        if (selectedAccount) params.append('account', selectedAccount.toString());
        if (searchTerm) params.append('search', searchTerm);
        
        const response = await api.get(`/general-ledger/?${params.toString()}`);
        const data = response.data?.results || response.data || [];
        setLedgerEntries(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      console.error('Error fetching general ledger:', error);
      toast.error('Failed to load general ledger data');
      if (viewMode === 'summary') {
        setAccountSummaries([]);
      } else {
        setLedgerEntries([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = [...ledgerEntries];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.account_name?.toLowerCase().includes(searchLower) ||
        entry.account_code?.toLowerCase().includes(searchLower) ||
        entry.reference?.toLowerCase().includes(searchLower) ||
        entry.description?.toLowerCase().includes(searchLower) ||
        entry.journal_entry_number?.toLowerCase().includes(searchLower)
      );
    }
    
    if (selectedAccount) {
      filtered = filtered.filter(entry => entry.account === selectedAccount);
    }
    
    setFilteredEntries(filtered);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setSelectedAccount(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-700">General Ledger</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('summary')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'summary'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Account Summary
          </button>
          <button
            onClick={() => setViewMode('entries')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'entries'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Ledger Entries
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {viewMode === 'entries' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search entries..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                <select
                  value={selectedAccount || ''}
                  onChange={(e) => setSelectedAccount(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Accounts</option>
                  {accountSummaries.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.account_code} - {account.account_name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Clear Filters
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      ) : viewMode === 'summary' ? (
        /* Account Summary View */
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Account Code</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Account Name</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Debit Balance</th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Credit Balance</th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Net Balance</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
              {accountSummaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No account summaries found
                  </td>
                </tr>
              ) : (
                accountSummaries.map(account => (
                  <tr key={account.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{account.account_code}</td>
                    <td className="py-3 px-4 text-gray-700">{account.account_name}</td>
                    <td className="py-3 px-4 text-gray-600">{account.account_type_display}</td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {formatCurrency(account.debit_balance)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {formatCurrency(account.credit_balance)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      <span className={account.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(Math.abs(account.balance))}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        account.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Ledger Entries View */
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Account</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Journal Entry</th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Debit</th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Credit</th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Running Balance</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Reference</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No ledger entries found
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => (
                  <tr key={entry.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-700">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-gray-900">{entry.account_code}</div>
                      <div className="text-xs text-gray-500">{entry.account_name}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{entry.journal_entry_number}</td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      {formatCurrency(entry.running_balance)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{entry.reference}</td>
                    <td className="py-3 px-4 text-gray-600">{entry.description}</td>
                  </tr>
                ))
              )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
};

export default GeneralLedger; 