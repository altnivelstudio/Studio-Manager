import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, 
  Users, 
  Briefcase, 
  ArrowRightLeft, 
  Receipt, 
  Calculator, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  Camera,
  Video,
  Megaphone,
  Lightbulb,
  Wrench,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit2,
  X,
  Settings,
  RefreshCw,
  Share2,
  Database,
  Download,
  Upload,
  LogOut,
  Shield,
  Loader2,
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';
import { Auth } from './Auth';
import { 
  Freelancer, 
  ExternalProject, 
  InternalTransaction, 
  FixedCost, 
  ServiceType,
  ProjectShare,
  AppSettings,
  UserProfile,
  UserRole
} from './types';

// Initial Mock Data
const INITIAL_FREELANCERS: Freelancer[] = [
  { id: 'hub', name: 'Fotosfera Studio', role: 'HUB' },
  { id: '1', name: 'Marius Tudose', role: 'Photographer' },
  { id: '2', name: 'Filip Gabriel', role: 'Videographer' },
  { id: '3', name: 'Marina Sarmaniuc', role: 'Marketing Specialist' },
  { id: '4', name: 'Gianina Corondan', role: 'MC & TV Host' },
  { id: '5', name: 'Andrei Ivan', role: 'Photographer' },
  { id: '6', name: 'Lavinia Falcan', role: 'Pictor' },
  { id: '7', name: 'Livia Craescu', role: 'Asistent & Editor' },
  { id: '8', name: 'Claudia Morosanu', role: 'Actress' },
];

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
const getToday = () => new Date().toISOString().slice(0, 10);

const INITIAL_FIXED_COSTS: FixedCost[] = [];

const UserManagement: React.FC<{ freelancers: Freelancer[] }> = ({ freelancers }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('app_users').select('*');
    if (!error && data) setProfiles(data);
    setLoading(false);
  };

  const updateRole = async (userId: string, role: UserRole) => {
    const { error } = await supabase.from('app_users').update({ role }).eq('id', userId);
    if (!error) fetchProfiles();
  };

  const updateFreelancerLink = async (userId: string, freelancerId: string) => {
    const { error } = await supabase.from('app_users').update({ freelancer_id: freelancerId === 'none' ? null : freelancerId }).eq('id', userId);
    if (!error) fetchProfiles();
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="py-3 px-4 text-[10px] font-bold uppercase text-zinc-500">Email</th>
            <th className="py-3 px-4 text-[10px] font-bold uppercase text-zinc-500">Rol</th>
            <th className="py-3 px-4 text-[10px] font-bold uppercase text-zinc-500">Asociere Freelancer</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {profiles.map(p => (
            <tr key={p.id} className="text-sm">
              <td className="py-3 px-4 text-zinc-300">{p.freelancer_id}</td>
              <td className="py-3 px-4">
                <select 
                  value={p.role} 
                  onChange={(e) => updateRole(p.id, e.target.value as UserRole)}
                  className="bg-zinc-800 border-none rounded px-2 py-1 text-xs text-white"
                >
                  <option value="SUPERADMIN">Superadmin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="COLLABORATOR">Colaborator</option>
                </select>
              </td>
              <td className="py-3 px-4">
                <select 
                  value={p.freelancer_id || 'none'} 
                  onChange={(e) => updateFreelancerLink(p.id, e.target.value)}
                  className="bg-zinc-800 border-none rounded px-2 py-1 text-xs text-white"
                >
                  <option value="none">Nicio asociere</option>
                  {freelancers.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [freelancers, setFreelancers] = useState<Freelancer[]>(INITIAL_FREELANCERS);
  const [projects, setProjects] = useState<ExternalProject[]>([]);
  const [transactions, setTransactions] = useState<InternalTransaction[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>(INITIAL_FIXED_COSTS);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'internal' | 'costs' | 'team' | 'settings'>('dashboard');
  
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)
  });
  
  const [editingFreelancer, setEditingFreelancer] = useState<Freelancer | null>(null);
  const [isAddingFreelancer, setIsAddingFreelancer] = useState(false);

  const [txFilters, setTxFilters] = useState({ debtor: 'all', creditor: 'all', type: 'all' });
  const [projectFilters, setProjectFilters] = useState({ type: 'all', client: 'all', lead: 'all' });
  const [costFilters, setCostFilters] = useState({ category: 'all' });
  const [settlementFilters, setSettlementFilters] = useState({ member: 'all' });

  const [settings, setSettings] = useState<AppSettings>({ lastImportUrl: '' });
  const [isImporting, setIsImporting] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importTarget, setImportTarget] = useState<'projects' | 'internal' | 'costs' | null>(null);

  // Edit states
  const [editingProject, setEditingProject] = useState<ExternalProject | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<InternalTransaction | null>(null);
  const [editingFixedCost, setEditingFixedCost] = useState<FixedCost | null>(null);

  // State for project form real-time calculation
  const [projectFormValue, setProjectFormValue] = useState<number>(0);
  const [projectFormShares, setProjectFormShares] = useState<Record<string, number>>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Filter data by date range and filters
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const dateMatch = p.date >= dateRange.start && p.date <= dateRange.end;
      const typeMatch = projectFilters.type === 'all' || p.serviceType === projectFilters.type;
      const clientMatch = projectFilters.client === 'all' || p.client === projectFilters.client;
      const leadMatch = projectFilters.lead === 'all' || p.leadId === projectFilters.lead;
      return dateMatch && typeMatch && clientMatch && leadMatch;
    });
  }, [projects, dateRange, projectFilters]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const dateMatch = t.date >= dateRange.start && t.date <= dateRange.end;
      const debtorMatch = txFilters.debtor === 'all' || t.fromId === txFilters.debtor;
      const creditorMatch = txFilters.creditor === 'all' || t.toId === txFilters.creditor;
      const typeMatch = txFilters.type === 'all' || t.type === txFilters.type;
      return dateMatch && debtorMatch && creditorMatch && typeMatch;
    });
  }, [transactions, dateRange, txFilters]);

  const filteredFixedCosts = useMemo(() => {
    return fixedCosts.filter(c => {
      const dateMatch = c.date >= dateRange.start && c.date <= dateRange.end;
      const categoryMatch = costFilters.category === 'all' || c.category === costFilters.category;
      return dateMatch && categoryMatch;
    });
  }, [fixedCosts, dateRange, costFilters]);

  // Auth state listener
  useEffect(() => {
    const savedUser = localStorage.getItem('hub_user_session');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setSession(user);
      setProfile(user);
    }
    setIsAuthLoading(false);
  }, []);

  const handleLogin = (userData: any) => {
    const user = {
      id: userData.id,
      email: userData.freelancer_id,
      role: userData.role,
      freelancer_id: userData.freelancer_id,
      name: userData.freelancers?.name || userData.freelancer_id
    };
    setSession(user);
    setProfile(user);
    localStorage.setItem('hub_user_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setSession(null);
    setProfile(null);
    localStorage.removeItem('hub_user_session');
  };

  // Load from Supabase
  const fetchData = async () => {
    if (!session) return;
    setDbStatus('syncing');
    try {
      const [
        fRes,
        pRes,
        tRes,
        cRes,
        sRes
      ] = await Promise.all([
        supabase.from('freelancers').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('fixed_costs').select('*'),
        supabase.from('settings').select('*').eq('id', 'default').maybeSingle()
      ]);

      // Check for errors in individual requests
      const errors = [fRes, pRes, tRes, cRes].filter(r => r.error).map(r => r.error?.message);
      if (errors.length > 0) {
        throw new Error(`Eroare tabele: ${errors.join(', ')}`);
      }

      if (fRes.data && fRes.data.length > 0) {
        setFreelancers(fRes.data);
      } else if (fRes.data) {
        // Seed initial freelancers if empty
        await supabase.from('freelancers').insert(INITIAL_FREELANCERS);
        setFreelancers(INITIAL_FREELANCERS);
      }

      if (pRes.data) setProjects(pRes.data);
      if (tRes.data) setTransactions(tRes.data);
      if (cRes.data) setFixedCosts(cRes.data);
      if (sRes.data) setSettings(sRes.data);
      
      setDbStatus('success');
      setIsInitialLoad(false);
    } catch (error: any) {
      console.error('Error fetching data from Supabase:', error);
      setDbStatus('error');
      setLastSyncError(error.message || 'Eroare la incarcarea datelor');
      
      // Fallback to localStorage
      const saved = localStorage.getItem('hub_finance_data_v3');
      if (saved) {
        const data = JSON.parse(saved);
        setFreelancers(data.freelancers || INITIAL_FREELANCERS);
        setProjects(data.projects || []);
        setTransactions(data.transactions || []);
        setFixedCosts(data.fixedCosts || INITIAL_FIXED_COSTS);
        setSettings(data.settings || { lastImportUrl: '' });
      }
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  // Sync to Supabase on changes
  useEffect(() => {
    if (isInitialLoad || !session || profile?.role === 'COLLABORATOR') return; // Prevent overwriting DB with empty state on mount or if collaborator

    const syncData = async () => {
      setDbStatus('syncing');
      try {
        const results = await Promise.all([
          supabase.from('freelancers').upsert(freelancers),
          supabase.from('projects').upsert(projects),
          supabase.from('transactions').upsert(transactions),
          supabase.from('fixed_costs').upsert(fixedCosts),
          supabase.from('settings').upsert({ id: 'default', ...settings })
        ]);

        const errors = results.filter(r => r.error).map(r => r.error?.message);
        
        if (errors.length > 0) {
          console.error('Supabase Sync Errors:', errors);
          setDbStatus('error');
          setLastSyncError(errors.join(', '));
        } else {
          setDbStatus('success');
          setLastSyncError(null);
        }
        
        // Also keep localStorage as backup
        localStorage.setItem('hub_finance_data_v3', JSON.stringify({
          freelancers,
          projects,
          transactions,
          fixedCosts,
          settings
        }));
      } catch (error: any) {
        console.error('Error syncing data to Supabase:', error);
        setDbStatus('error');
        setLastSyncError(error.message || 'Unknown error');
      }
    };

    const timeoutId = setTimeout(syncData, 2000);
    return () => clearTimeout(timeoutId);
  }, [freelancers, projects, transactions, fixedCosts, settings, isInitialLoad]);

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Dashboard Sheet (Summary)
    const dashboardData = [
      ['Dashboard Financiar', `${dateRange.start} - ${dateRange.end}`],
      [],
      ['Indicator', 'Valoare (RON)'],
      ['Venituri Externe Totale', stats.totalExternalIncome],
      ['Contributii HUB Totale', stats.totalHubContributions],
      ['Cheltuieli Fixe Totale', stats.totalFixedCosts],
      ['Profit/Deficit HUB', stats.hubBalance],
      [],
      ['Echipa - Balante'],
      ['Nume', 'Rol', 'Venit Extern', 'Incasari Interne', 'Plati Interne', 'Balanta Neta'],
      ...freelancers.map(f => {
        const s = stats.freelancerStats[f.id];
        return [f.name, f.role, s.externalIncome, s.internalReceivable, s.internalPayable, s.netPosition];
      })
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dashboardData), 'Dashboard');

    // Projects Sheet
    const projectsData = projects.filter(p => p.date >= dateRange.start && p.date <= dateRange.end).map(p => ({
      'Contract': p.contractNumber,
      'Data': p.date,
      'Titlu': p.title,
      'Client': p.client,
      'Valoare Totala': p.totalValue,
      'Lead': freelancers.find(f => f.id === p.leadId)?.name,
      'Tip': p.serviceType,
      'Cota HUB %': p.hubContributionPercent
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projectsData), 'Proiecte Externe');

    // Transactions Sheet
    const txData = transactions.filter(t => t.date >= dateRange.start && t.date <= dateRange.end).map(t => ({
      'Contract': t.contractNumber,
      'Data': t.date,
      'De la': freelancers.find(f => f.id === t.fromId)?.name,
      'Catre': freelancers.find(f => f.id === t.toId)?.name,
      'Suma': t.amount,
      'Descriere': t.description,
      'Tip': t.type
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txData), 'Tranzactii Interne');

    // Fixed Costs Sheet
    const costsData = fixedCosts.filter(c => c.date >= dateRange.start && c.date <= dateRange.end).map(c => ({
      'Nume': c.name,
      'Suma': c.amount,
      'Categorie': c.category,
      'Data': c.date,
      'Contract': c.contractNumber
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(costsData), 'Cheltuieli Fixe');

    // Team Sheet
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(freelancers), 'Echipa');

    XLSX.writeFile(wb, `AltNivel_Export_${dateRange.start}_${dateRange.end}.xlsx`);
  };

  const importExcelFromURL = async (url: string) => {
    if (!url) return;
    setIsImporting(true);
    try {
      const res = await fetch(`/api/proxy-csv?url=${encodeURIComponent(url)}`);
      const arrayBuffer = await res.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Process sheets
      const teamSheet = wb.Sheets['Echipa'];
      if (teamSheet) {
        const teamData = XLSX.utils.sheet_to_json(teamSheet) as Freelancer[];
        if (teamData.length > 0) setFreelancers(teamData);
      }

      const projectsSheet = wb.Sheets['Proiecte Externe'];
      if (projectsSheet) {
        const pData = XLSX.utils.sheet_to_json(projectsSheet) as any[];
        const mappedProjects: ExternalProject[] = pData.map(p => ({
          id: crypto.randomUUID(),
          contractNumber: p['Contract'],
          date: p['Data'],
          title: p['Titlu'],
          client: p['Client'],
          totalValue: p['Valoare Totala'],
          leadId: freelancers.find(f => f.name === p['Lead'])?.id || 'hub',
          serviceType: p['Tip'],
          hubContributionPercent: p['Cota HUB %'],
          month: p['Data']?.slice(0, 7),
          shares: [] // Shares are not easily exported/imported this way without a sub-table
        }));
        setProjects(prev => [...prev, ...mappedProjects]);
      }

      const txSheet = wb.Sheets['Tranzactii Interne'];
      if (txSheet) {
        const tData = XLSX.utils.sheet_to_json(txSheet) as any[];
        const mappedTxs: InternalTransaction[] = tData.map(t => ({
          id: crypto.randomUUID(),
          contractNumber: t['Contract'],
          date: t['Data'],
          fromId: freelancers.find(f => f.name === t['De la'])?.id || 'hub',
          toId: freelancers.find(f => f.name === t['Catre'])?.id || 'hub',
          amount: t['Suma'],
          description: t['Descriere'],
          type: t['Tip'],
          month: t['Data']?.slice(0, 7)
        }));
        setTransactions(prev => [...prev, ...mappedTxs]);
      }

      const costsSheet = wb.Sheets['Cheltuieli Fixe'];
      if (costsSheet) {
        const cData = XLSX.utils.sheet_to_json(costsSheet) as any[];
        const mappedCosts: FixedCost[] = cData.map(c => ({
          id: crypto.randomUUID(),
          name: c['Nume'],
          amount: c['Suma'],
          category: c['Categorie'],
          date: c['Data'],
          contractNumber: c['Contract'],
          month: c['Data']?.slice(0, 7)
        }));
        setFixedCosts(prev => [...prev, ...mappedCosts]);
      }

      setSettings(s => ({ ...s, lastImportUrl: url }));
      alert("Import Excel reusit!");
    } catch (e) {
      console.error(e);
      alert("Eroare la importul Excel din URL");
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'projects' | 'internal' | 'costs') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      processCSV(csvText, target);
    };
    reader.readAsText(file);
  };

  const processCSV = (csvText: string, target: 'projects' | 'internal' | 'costs') => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        if (target === 'projects') {
          const newProjects: ExternalProject[] = data.map(row => ({
            id: row.id || crypto.randomUUID(),
            contractNumber: row.contractNumber || row.contract || '',
            title: row.title || row.nume || '',
            client: row.client || '',
            totalValue: Number(row.totalValue || row.valoare || 0),
            leadId: row.leadId || freelancers[0]?.id,
            shares: [], // Shares are complex to import via simple CSV without a strict format
            serviceType: (row.serviceType || ServiceType.PHOTO) as ServiceType,
            date: row.date || getToday(),
            month: (row.date || getToday()).slice(0, 7),
            hubContributionPercent: Number(row.hubContributionPercent || 20),
          }));
          setProjects(prev => [...prev, ...newProjects]);
        } else if (target === 'internal') {
          const newTxs: InternalTransaction[] = data.map(row => ({
            id: row.id || crypto.randomUUID(),
            contractNumber: row.contractNumber || row.contract || '',
            fromId: row.fromId || freelancers[0]?.id,
            toId: row.toId || freelancers[1]?.id,
            amount: Number(row.amount || row.suma || 0),
            description: row.description || row.descriere || '',
            type: (row.type || 'SUBCONTRACT') as any,
            date: row.date || getToday(),
            month: (row.date || getToday()).slice(0, 7),
          }));
          setTransactions(prev => [...prev, ...newTxs]);
        } else if (target === 'costs') {
          const newCosts: FixedCost[] = data.map(row => ({
            id: row.id || crypto.randomUUID(),
            contractNumber: row.contractNumber || row.contract || '',
            name: row.name || row.nume || '',
            amount: Number(row.amount || row.suma || 0),
            category: (row.category || 'OTHER') as any,
            date: row.date || getToday(),
            month: (row.date || getToday()).slice(0, 7),
          }));
          setFixedCosts(prev => [...prev, ...newCosts]);
        }
        alert(`Importat cu succes ${data.length} inregistrari.`);
      }
    });
  };

  const exportToCSV = (target: 'projects' | 'internal' | 'costs') => {
    let dataToExport: any[] = [];
    let filename = '';

    if (target === 'projects') {
      dataToExport = filteredProjects;
      filename = `proiecte_${dateRange.start}_${dateRange.end}.csv`;
    } else if (target === 'internal') {
      dataToExport = filteredTransactions;
      filename = `tranzactii_${dateRange.start}_${dateRange.end}.csv`;
    } else if (target === 'costs') {
      dataToExport = filteredFixedCosts;
      filename = `cheltuieli_${dateRange.start}_${dateRange.end}.csv`;
    }

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculations
  const stats = useMemo(() => {
    const totalExternalIncome = filteredProjects.reduce((sum, p) => sum + p.totalValue, 0);
    const totalFixedCosts = filteredFixedCosts.reduce((sum, c) => sum + c.amount, 0);

    const freelancerStats: Record<string, {
      externalIncome: number;
      internalReceivable: number;
      internalPayable: number;
      externalPayable: number;
      netPosition: number;
    }> = {};

    // Initialize
    freelancers.forEach(f => {
      freelancerStats[f.id] = {
        externalIncome: 0,
        internalReceivable: 0,
        internalPayable: 0,
        externalPayable: 0,
        netPosition: 0
      };
    });

    // 1. External Project Income (Leads receive money from clients)
    filteredProjects.forEach(p => {
      if (freelancerStats[p.leadId]) {
        freelancerStats[p.leadId].externalIncome += p.totalValue;
      }
    });

    // 2. Internal Transactions
    filteredTransactions.forEach(t => {
      if (freelancerStats[t.fromId]) freelancerStats[t.fromId].internalPayable += t.amount;
      if (freelancerStats[t.toId]) freelancerStats[t.toId].internalReceivable += t.amount;
    });

    // 3. HUB External Expenses (Fixed Costs)
    if (freelancerStats['hub']) {
      freelancerStats['hub'].externalPayable += totalFixedCosts;
    }

    // 4. HUB Operational Balance (to determine deficit)
    const hub = freelancerStats['hub'];
    const hubBalance = hub ? (hub.externalIncome + hub.internalReceivable - hub.internalPayable - hub.externalPayable) : 0;
    
    // Calculate total hub contributions for display
    const totalHubContributions = filteredTransactions
      .filter(t => t.toId === 'hub' && t.description.includes('Contributie HUB'))
      .reduce((sum, t) => sum + t.amount, 0);

    // 5. Net Positions (Simple sum, no automatic deficit distribution)
    freelancers.forEach(f => {
      const s = freelancerStats[f.id];
      s.netPosition = Math.round(s.externalIncome + s.internalReceivable - s.internalPayable - s.externalPayable);
    });

    // 6. Calculate settlement plan (Who pays whom) based on internal transactions only
    const pairBalances: Record<string, { balance: number, details: { description: string, amount: number, date: string }[] }> = {}; 

    filteredTransactions.forEach(t => {
      const id1 = t.fromId;
      const id2 = t.toId;
      if (id1 === id2) return;
      
      const key = id1 < id2 ? `${id1}:${id2}` : `${id2}:${id1}`;
      const direction = id1 < id2 ? 1 : -1;
      
      if (!pairBalances[key]) {
        pairBalances[key] = { balance: 0, details: [] };
      }
      
      pairBalances[key].balance += (t.amount * direction);
      pairBalances[key].details.push({
        description: t.description,
        amount: t.amount,
        date: t.date
      });
    });

    const settlements: { from: string; to: string; amount: number; details: any[] }[] = [];
    Object.entries(pairBalances).forEach(([key, data]) => {
      if (Math.abs(data.balance) < 0.5) return;
      const [id1, id2] = key.split(':');
      const f1 = freelancers.find(f => f.id === id1);
      const f2 = freelancers.find(f => f.id === id2);
      if (!f1 || !f2) return;

      if (data.balance > 0) {
        settlements.push({ from: f1.name, to: f2.name, amount: Math.round(data.balance), details: data.details });
      } else {
        settlements.push({ from: f2.name, to: f1.name, amount: Math.round(Math.abs(data.balance)), details: data.details });
      }
    });

    // 6. Filter for collaborator view
    let finalSettlements = settlements;
    if (profile?.role === 'COLLABORATOR' && profile.freelancer_id) {
      const myName = freelancers.find(f => f.id === profile.freelancer_id)?.name;
      finalSettlements = settlements.filter(s => s.from === myName || s.to === myName);
    }

    return {
      totalExternalIncome: Math.round(totalExternalIncome),
      totalHubContributions: Math.round(totalHubContributions),
      totalFixedCosts: Math.round(totalFixedCosts),
      hubBalance: Math.round(hubBalance),
      freelancerStats,
      settlements: finalSettlements
    };
  }, [filteredProjects, filteredFixedCosts, freelancers, filteredTransactions, dateRange, profile]);

  const setPresetRange = (type: 'week' | 'month' | 'year' | 'lastYear') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
      end = new Date(now.setDate(diff + 6));
    } else if (type === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (type === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    } else if (type === 'lastYear') {
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear() - 1, 11, 31);
    }

    setDateRange({
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10)
    });
  };

  const addProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const totalValue = Number(formData.get('value'));
    const hubPercent = Number(formData.get('contribution'));
    const hubAmount = totalValue * (hubPercent / 100);
    const date = formData.get('date') as string || new Date().toISOString().split('T')[0];
    const contractNumber = formData.get('contract') as string;
    const leadId = formData.get('lead') as string;
    const title = formData.get('title') as string;

    // Distribute shares
    const shares: ProjectShare[] = [];
    const newInternalTxs: InternalTransaction[] = [];

    // HUB contribution transaction
    if (hubAmount > 0) {
      newInternalTxs.push({
        id: crypto.randomUUID(),
        contractNumber,
        fromId: leadId,
        toId: 'hub',
        amount: Math.round(hubAmount),
        description: `Contributie HUB (${hubPercent}%): ${title}`,
        type: 'SUBCONTRACT',
        date,
        month: date.slice(0, 7),
      });
    }

    freelancers.forEach(f => {
      if (f.id === 'hub') return; // HUB doesn't get a "share" this way, it gets the contribution above
      const shareAmount = Number(formData.get(`share_${f.id}`) || 0);
      if (shareAmount > 0) {
        shares.push({ freelancerId: f.id, amount: Math.round(shareAmount) });
        
        // If the freelancer is NOT the lead, create an internal transaction from lead to them
        if (f.id !== leadId) {
          newInternalTxs.push({
            id: crypto.randomUUID(),
            contractNumber,
            fromId: leadId,
            toId: f.id,
            amount: Math.round(shareAmount),
            description: `Subcontractare: ${title}`,
            type: 'SUBCONTRACT',
            date,
            month: date.slice(0, 7),
          });
        }
      }
    });

    const newProject: ExternalProject = {
      id: crypto.randomUUID(),
      contractNumber,
      title,
      client: formData.get('client') as string,
      totalValue,
      leadId,
      shares,
      serviceType: formData.get('type') as ServiceType,
      date,
      month: date.slice(0, 7),
      hubContributionPercent: hubPercent,
    };

    setProjects([...projects, newProject]);
    if (newInternalTxs.length > 0) {
      setTransactions([...transactions, ...newInternalTxs]);
    }
    e.currentTarget.reset();
  };

  const addTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTx: InternalTransaction = {
      id: crypto.randomUUID(),
      contractNumber: formData.get('contract') as string,
      fromId: formData.get('from') as string,
      toId: formData.get('to') as string,
      amount: Number(formData.get('amount')),
      description: formData.get('description') as string,
      type: formData.get('type') as 'SUBCONTRACT' | 'EQUIPMENT',
      date: formData.get('date') as string || new Date().toISOString().split('T')[0],
      month: (formData.get('date') as string || new Date().toISOString().split('T')[0]).slice(0, 7),
    };
    setTransactions([...transactions, newTx]);
    e.currentTarget.reset();
  };

  const deleteProject = async (id: string) => {
    if (profile?.role !== 'SUPERADMIN') {
      setErrorToast('Doar un SUPERADMIN poate șterge proiecte.');
      return;
    }
    
    const projectToDelete = projects.find(p => p.id === id);
    if (!projectToDelete) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Șterge Proiect',
      message: `Sigur vrei să ștergi proiectul "${projectToDelete.title}"? Această acțiune va șterge și toate tranzacțiile interne asociate.`,
      onConfirm: async () => {
        try {
          const { error: pError } = await supabase.from('projects').delete().eq('id', id);
          if (pError) throw pError;

          if (projectToDelete.contractNumber) {
            await supabase.from('transactions').delete().eq('contractNumber', projectToDelete.contractNumber);
          }

          setProjects(prev => prev.filter(p => p.id !== id));
          setTransactions(prev => prev.filter(t => t.contractNumber !== projectToDelete.contractNumber));
          setDbStatus('success');
        } catch (error: any) {
          console.error('Error deleting project:', error);
          setErrorToast('Eroare la ștergerea proiectului: ' + error.message);
          setDbStatus('error');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const deleteTransaction = async (id: string) => {
    if (profile?.role !== 'SUPERADMIN') {
      setErrorToast('Doar un SUPERADMIN poate șterge tranzacții.');
      return;
    }
    
    setConfirmDialog({
      isOpen: true,
      title: 'Șterge Tranzacție',
      message: 'Sigur vrei să ștergi această tranzacție?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('transactions').delete().eq('id', id);
          if (error) throw error;
          setTransactions(prev => prev.filter(t => t.id !== id));
        } catch (error: any) {
          setErrorToast('Eroare la ștergere: ' + error.message);
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const deleteFixedCost = async (id: string) => {
    if (profile?.role !== 'SUPERADMIN') {
      setErrorToast('Doar un SUPERADMIN poate șterge cheltuieli.');
      return;
    }
    
    setConfirmDialog({
      isOpen: true,
      title: 'Șterge Cheltuială',
      message: 'Sigur vrei să ștergi această cheltuială?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('fixed_costs').delete().eq('id', id);
          if (error) throw error;
          setFixedCosts(prev => prev.filter(c => c.id !== id));
        } catch (error: any) {
          console.error('Error deleting fixed cost:', error);
          setErrorToast('Eroare la ștergere: ' + error.message);
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const deleteFreelancer = async (id: string) => {
    if (profile?.role !== 'SUPERADMIN') {
      setErrorToast('Doar un SUPERADMIN poate șterge membri.');
      return;
    }
    
    setConfirmDialog({
      isOpen: true,
      title: 'Șterge Membru',
      message: 'Sigur vrei să ștergi acest membru?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('freelancers').delete().eq('id', id);
          if (error) throw error;
          setFreelancers(prev => prev.filter(f => f.id !== id));
        } catch (error: any) {
          setErrorToast('Eroare la ștergere: ' + error.message);
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const updateProject = (id: string, updated: Partial<ExternalProject>) => {
    setProjects(projects.map(p => p.id === id ? { ...p, ...updated } as ExternalProject : p));
  };

  const updateTransaction = (id: string, updated: Partial<InternalTransaction>) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, ...updated } as InternalTransaction : t));
  };

  const updateFixedCost = (id: string, updated: Partial<FixedCost>) => {
    setFixedCosts(fixedCosts.map(c => c.id === id ? { ...c, ...updated } as FixedCost : c));
  };

  const getServiceIcon = (type: ServiceType) => {
    switch (type) {
      case ServiceType.PHOTO: return <Camera size={16} />;
      case ServiceType.VIDEO: return <Video size={16} />;
      case ServiceType.MARKETING: return <Megaphone size={16} />;
      case ServiceType.CONSULTANCY: return <Lightbulb size={16} />;
      case ServiceType.EQUIPMENT_RENTAL: return <Wrench size={16} />;
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="text-indigo-600 animate-spin" size={48} />
      </div>
    );
  }

  if (!session) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Custom Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <div className="w-10 h-10 bg-rose-500/10 rounded-full flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">{confirmDialog.title}</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-colors"
              >
                Anulează
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-colors"
              >
                Confirmă
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Error Toast */}
      {errorToast && (
        <div className="fixed bottom-8 right-8 z-[100]">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-rose-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3"
          >
            <span className="text-sm font-bold">{errorToast}</span>
            <button onClick={() => setErrorToast(null)} className="p-1 hover:bg-white/10 rounded">
              <X size={16} />
            </button>
          </motion.div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-zinc-900 text-zinc-400 p-6 flex flex-col gap-8 border-r border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Calculator className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">Alt Nivel</h1>
              <p className="text-[10px] uppercase tracking-widest opacity-50">Studio Manager</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-white"
            title="Deconectare"
          >
            <LogOut size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="px-4 py-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={12} className="text-indigo-400" />
              <span className="text-[9px] uppercase font-bold text-zinc-500">Contul tau</span>
            </div>
            <p className="text-xs text-white font-medium truncate">{(profile as any)?.name || profile?.email}</p>
            <p className="text-[9px] uppercase font-bold text-indigo-400 mt-1">{profile?.role}</p>
          </div>

          <div className="px-4 py-2 flex items-center gap-2 border-b border-zinc-800/50 mb-2">
            <div className={`w-2 h-2 rounded-full ${
              dbStatus === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
              dbStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 
              dbStatus === 'error' ? 'bg-rose-500' : 'bg-zinc-600'
            }`} />
            <span className="text-[10px] uppercase font-bold tracking-wider">
              {dbStatus === 'success' ? 'Baza de date conectata' : 
               dbStatus === 'syncing' ? 'Sincronizare...' : 
               dbStatus === 'error' ? 'Eroare conexiune' : 'Asteptare...'}
            </span>
            {profile?.role !== 'COLLABORATOR' && (
              <button 
                onClick={() => fetchData()} 
                className="ml-auto p-1 hover:bg-zinc-800 rounded transition-colors"
                title="Reincarca datele din Supabase"
              >
                <RefreshCw size={10} className={dbStatus === 'syncing' ? 'animate-spin' : ''} />
              </button>
            )}
          </div>

          {profile?.role !== 'COLLABORATOR' && (
            <div className="p-4 bg-indigo-600/10 rounded-xl border border-indigo-500/20">
              <p className="text-[10px] uppercase font-bold text-indigo-400 mb-1">Status Hub</p>
              <p className={`text-lg font-mono font-bold ${stats.hubBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.hubBalance.toLocaleString()} RON
              </p>
              <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
                {freelancers.filter(f => f.id !== 'hub').map(f => {
                  const balance = stats.freelancerStats[f.id]?.netPosition || 0;
                  if (Math.abs(balance) < 1) return null;
                  return (
                    <div key={f.id} className="flex justify-between items-center text-[10px]">
                      <span className="truncate max-w-[100px]">{f.name}</span>
                      <span className={`font-mono font-bold ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {balance > 0 ? '+' : ''}{balance.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {profile?.role === 'COLLABORATOR' && profile.freelancer_id && (
            <div className="p-4 bg-emerald-600/10 rounded-xl border border-emerald-500/20">
              <p className="text-[10px] uppercase font-bold text-emerald-400 mb-1">Balanța Ta</p>
              <p className={`text-lg font-mono font-bold ${stats.freelancerStats[profile.freelancer_id]?.netPosition >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.freelancerStats[profile.freelancer_id]?.netPosition.toLocaleString()} RON
              </p>
            </div>
          )}

          <p className="text-[10px] uppercase font-bold text-zinc-600 px-4">Filtreaza Perioada</p>
          <div className="px-4 space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase">De la</label>
              <input 
                type="date" 
                value={dateRange.start} 
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full bg-zinc-800 border-none rounded-md px-3 py-2 text-xs text-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase">Pana la</label>
              <input 
                type="date" 
                value={dateRange.end} 
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full bg-zinc-800 border-none rounded-md px-3 py-2 text-xs text-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={() => setPresetRange('week')} className="text-[9px] font-bold bg-zinc-800 hover:bg-zinc-700 py-1 rounded uppercase">Saptamana</button>
              <button onClick={() => setPresetRange('month')} className="text-[9px] font-bold bg-zinc-800 hover:bg-zinc-700 py-1 rounded uppercase">Luna aceasta</button>
              <button onClick={() => setPresetRange('year')} className="text-[9px] font-bold bg-zinc-800 hover:bg-zinc-700 py-1 rounded uppercase">Anul acesta</button>
              <button onClick={() => setPresetRange('lastYear')} className="text-[9px] font-bold bg-zinc-800 hover:bg-zinc-700 py-1 rounded uppercase">Anul trecut</button>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-zinc-800 text-white shadow-lg' : 'hover:bg-zinc-800/50 hover:text-zinc-200'}`}
          >
            <TrendingUp size={18} />
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          
          {profile?.role !== 'COLLABORATOR' && (
            <button 
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${activeTab === 'projects' ? 'bg-zinc-800 text-white shadow-lg' : 'hover:bg-zinc-800/50 hover:text-zinc-200'}`}
            >
              <Briefcase size={18} />
              <span className="text-sm font-medium">Proiecte Externe</span>
            </button>
          )}

          <button 
            onClick={() => setActiveTab('internal')}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${activeTab === 'internal' ? 'bg-zinc-800 text-white shadow-lg' : 'hover:bg-zinc-800/50 hover:text-zinc-200'}`}
          >
            <ArrowRightLeft size={18} />
            <span className="text-sm font-medium">Tranzactii Interne</span>
          </button>

          {profile?.role !== 'COLLABORATOR' && (
            <button 
              onClick={() => setActiveTab('costs')}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${activeTab === 'costs' ? 'bg-zinc-800 text-white shadow-lg' : 'hover:bg-zinc-800/50 hover:text-zinc-200'}`}
            >
              <Receipt size={18} />
              <span className="text-sm font-medium">Cheltuieli Fixe</span>
            </button>
          )}

          {profile?.role !== 'COLLABORATOR' && (
            <button 
              onClick={() => setActiveTab('team')}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${activeTab === 'team' ? 'bg-zinc-800 text-white shadow-lg' : 'hover:bg-zinc-800/50 hover:text-zinc-200'}`}
            >
              <Users size={18} />
              <span className="text-sm font-medium">Echipa</span>
            </button>
          )}

          {profile?.role === 'SUPERADMIN' && (
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${activeTab === 'settings' ? 'bg-zinc-800 text-white shadow-lg' : 'hover:bg-zinc-800/50 hover:text-zinc-200'}`}
            >
              <Settings size={18} />
              <span className="text-sm font-medium">Setari</span>
            </button>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto bg-zinc-50">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <header>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard Financiar</h2>
                <p className="text-zinc-500">Sumar al activitatii hub-ului pentru perioada {dateRange.start} - {dateRange.end}.</p>
              </header>

              {/* Fixed Costs Section at Top - Hidden for Collaborators */}
              {profile?.role !== 'COLLABORATOR' && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Receipt size={20} className="text-indigo-600" />
                      Cheltuieli Fixe & Balanta Hub
                    </h3>
                    <div className={`px-4 py-1 rounded-full text-sm font-bold font-mono ${stats.hubBalance >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      Balanta: {stats.hubBalance.toLocaleString()} RON
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="card p-4 bg-zinc-50 border-zinc-200">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Total Cheltuieli</p>
                      <p className="text-xl font-bold font-mono text-rose-600">{stats.totalFixedCosts.toLocaleString()} RON</p>
                    </div>
                    <div className="card p-4 bg-zinc-50 border-zinc-200">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Contributii Proiecte</p>
                      <p className="text-xl font-bold font-mono text-indigo-600">{stats.totalHubContributions.toLocaleString()} RON</p>
                    </div>
                    <div className="lg:col-span-2 card p-4 flex flex-wrap gap-x-6 gap-y-2">
                      {filteredFixedCosts.map(c => (
                        <div key={c.id} className="flex items-center gap-2 text-xs">
                          <span className="w-2 h-2 rounded-full bg-zinc-300"></span>
                          <span className="text-zinc-500">{c.name}:</span>
                          <span className="font-mono font-bold">{c.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {stats.hubBalance < 0 && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingDown size={16} />
                        <span><strong>Deficit Hub:</strong> Hub-ul are un deficit de <strong>{Math.abs(stats.hubBalance).toLocaleString()} RON</strong> pentru perioada selectata.</span>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {profile?.role !== 'COLLABORATOR' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card p-6">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Venituri Totale Proiecte</p>
                    <p className="text-2xl font-bold font-mono">{stats.totalExternalIncome.toLocaleString()} RON</p>
                    <div className="mt-2 flex items-center gap-1 text-emerald-600 text-xs font-medium">
                      <TrendingUp size={14} />
                      <span>Valoare bruta contractata</span>
                    </div>
                  </div>
                  <div className="card p-6 bg-zinc-900 text-white border-none">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Status General</p>
                    <p className="text-2xl font-bold font-mono text-indigo-400">
                      {filteredProjects.length} Proiecte / {filteredTransactions.length} Tranzactii
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">Activitate in perioada selectata</p>
                  </div>
                </div>
              )}

              <section className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Users size={20} className="text-indigo-600" />
                  Situatie Detaliata Freelanceri & Decontari
                </h3>
                <div className="card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-100">
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Membru</th>
                          {profile?.role !== 'COLLABORATOR' && (
                            <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-right">Venituri Externe (Lead)</th>
                          )}
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-right">De incasat (Intern)</th>
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-right">De platit (Intern)</th>
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-right">Net Final</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {freelancers
                          .filter(f => {
                            if (profile?.role === 'COLLABORATOR' && profile.freelancer_id) {
                              return f.id === profile.freelancer_id;
                            }
                            return true;
                          })
                          .map(f => {
                            const fStats = stats.freelancerStats[f.id];
                            return (
                              <tr key={f.id} className="hover:bg-zinc-50 transition-colors text-sm">
                                <td className="p-4">
                                  <p className="font-semibold">{f.name}</p>
                                  <p className="text-[10px] text-zinc-500 uppercase">{f.role}</p>
                                </td>
                                {profile?.role !== 'COLLABORATOR' && (
                                  <td className="p-4 font-mono text-emerald-600 text-right">
                                    {fStats.externalIncome > 0 ? `+${fStats.externalIncome.toLocaleString()}` : '-'}
                                  </td>
                                )}
                                <td className="p-4 font-mono text-emerald-600 text-right">
                                  {fStats.internalReceivable > 0 ? `+${fStats.internalReceivable.toLocaleString()}` : '-'}
                                </td>
                                <td className="p-4 font-mono text-rose-600 text-right">
                                  {fStats.internalPayable > 0 ? `-${fStats.internalPayable.toLocaleString()}` : '-'}
                                </td>
                                <td className="p-4 font-mono font-bold text-right">
                                  <span className={fStats.netPosition >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                                    {fStats.netPosition.toLocaleString()} RON
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp size={20} className="text-indigo-600" />
                    Plan de Decontare (Sume Directe)
                  </h3>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Filtru Membru</label>
                    <select 
                      value={settlementFilters.member} 
                      onChange={(e) => setSettlementFilters({ ...settlementFilters, member: e.target.value })}
                      className="input-field py-1 text-xs w-40"
                    >
                      <option value="all">Toti</option>
                      {freelancers.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-100">
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">De la (Plateste)</th>
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Catre (Incaseaza)</th>
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-right">Suma Totala</th>
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Compozitie Sume</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {stats.settlements
                          .filter(s => settlementFilters.member === 'all' || s.from === settlementFilters.member || s.to === settlementFilters.member)
                          .length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-10 text-center text-zinc-400 italic text-sm">Nu sunt decontari necesare pentru selectia curenta.</td>
                          </tr>
                        ) : (
                          stats.settlements
                            .filter(s => settlementFilters.member === 'all' || s.from === settlementFilters.member || s.to === settlementFilters.member)
                            .map((s, i) => (
                            <tr key={i} className="hover:bg-zinc-50 transition-colors align-top">
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-[10px]">
                                    {s.from[0]}
                                  </div>
                                  <span className="font-bold text-sm">{s.from}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-[10px]">
                                    {s.to[0]}
                                  </div>
                                  <span className="font-bold text-sm">{s.to}</span>
                                </div>
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-indigo-600 text-lg">
                                {s.amount.toLocaleString()} RON
                              </td>
                              <td className="p-4">
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {s.details.map((d, di) => (
                                    <div key={di} className="text-[10px] flex justify-between gap-4 border-b border-zinc-50 pb-1 last:border-0">
                                      <span className="text-zinc-500 truncate max-w-[150px]">{d.description}</span>
                                      <span className="font-mono font-bold text-zinc-700 whitespace-nowrap">{d.amount.toLocaleString()} RON</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div 
              key="projects"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Proiecte Externe</h2>
                  <p className="text-zinc-500">Perioada: {dateRange.start} - {dateRange.end}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setImportTarget('projects'); fileInputRef.current?.click(); }}
                    className="btn-secondary flex items-center gap-2 text-xs"
                  >
                    <Upload size={14} />
                    Import CSV
                  </button>
                  <button 
                    onClick={() => exportToCSV('projects')}
                    className="btn-secondary flex items-center gap-2 text-xs"
                  >
                    <Download size={14} />
                    Export CSV
                  </button>
                </div>
              </header>

              <div className="card p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Plus size={18} className="text-indigo-600" />
                  Adauga Proiect
                </h3>
                <form onSubmit={(e) => {
                  addProject(e);
                  setProjectFormValue(0);
                  setProjectFormShares({});
                }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-zinc-500">Nr. Contract</label>
                          <input name="contract" required className="input-field" placeholder="Ex: 123/2024" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-zinc-500">Data</label>
                          <input name="date" type="date" defaultValue={getToday()} required className="input-field" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Titlu Proiect</label>
                        <input name="title" required className="input-field" placeholder="Ex: Sedinta Foto Fashion" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Client</label>
                        <input name="client" required className="input-field" placeholder="Ex: Brand X" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Valoare Proiect (RON)</label>
                        <input 
                          name="value" 
                          type="number" 
                          required 
                          className="input-field text-lg font-bold" 
                          placeholder="0" 
                          value={projectFormValue || ''}
                          onChange={(e) => setProjectFormValue(Number(e.target.value))}
                        />
                      </div>
                      
                      {(() => {
                        const sharesArray = Object.values(projectFormShares) as number[];
                        const totalShares = sharesArray.reduce((a, b) => a + b, 0);
                        const hubAmount = Math.max(0, projectFormValue - totalShares);
                        const hubPercent = projectFormValue > 0 ? Math.round((hubAmount / projectFormValue) * 100) : 100;
                        
                        return (
                          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-bold uppercase text-indigo-600">Cota HUB ({hubPercent}%)</label>
                              <span className="text-xs font-bold text-indigo-700">Ramas de distribuit</span>
                            </div>
                            <div className="text-2xl font-mono font-bold text-indigo-900">
                              {hubAmount.toLocaleString()} RON
                            </div>
                            <input type="hidden" name="contribution" value={hubPercent} />
                          </div>
                        );
                      })()}
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Lead Freelancer</label>
                        <select name="lead" required className="input-field">
                          {freelancers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Tip Serviciu</label>
                        <select name="type" required className="input-field">
                          <option value={ServiceType.PHOTO}>Foto</option>
                          <option value={ServiceType.VIDEO}>Video</option>
                          <option value={ServiceType.MARKETING}>Marketing</option>
                          <option value={ServiceType.CONSULTANCY}>Consultanta</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-zinc-100">
                    <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                      <p className="text-[10px] font-bold uppercase text-zinc-500 border-b border-zinc-200 pb-2 mb-4">Repartizare Colaboratori (RON)</p>
                      <div className="grid grid-cols-1 gap-y-3 max-w-md">
                        {freelancers.filter(f => f.id !== 'hub').map(f => (
                          <div key={f.id} className="flex items-center justify-between gap-4 py-1 border-b border-zinc-100 last:border-0">
                            <span className="text-xs font-medium text-zinc-600">{f.name}</span>
                            <div className="relative w-40">
                              <input 
                                name={`share_${f.id}`} 
                                type="number" 
                                className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                                placeholder="0"
                                value={projectFormShares[f.id] || ''}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setProjectFormShares(prev => ({ ...prev, [f.id]: val }));
                                }}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-bold">RON</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button type="submit" className="btn-primary w-full py-4 text-lg shadow-lg shadow-indigo-200">
                      Inregistreaza Proiect & Distribuie Sume
                    </button>
                  </div>
                </form>
              </div>

              <div className="space-y-4">
                <div className="card p-4 flex flex-wrap gap-4 bg-zinc-50 border-zinc-200">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Tip Proiect</label>
                    <select 
                      value={projectFilters.type} 
                      onChange={(e) => setProjectFilters({ ...projectFilters, type: e.target.value })}
                      className="input-field py-1 text-xs"
                    >
                      <option value="all">Toti</option>
                      <option value={ServiceType.PHOTO}>Foto</option>
                      <option value={ServiceType.VIDEO}>Video</option>
                      <option value={ServiceType.MARKETING}>Marketing</option>
                      <option value={ServiceType.CONSULTANCY}>Consultanta</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Client</label>
                    <select 
                      value={projectFilters.client} 
                      onChange={(e) => setProjectFilters({ ...projectFilters, client: e.target.value })}
                      className="input-field py-1 text-xs"
                    >
                      <option value="all">Toti</option>
                      {Array.from(new Set(projects.map(p => p.client))).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Lead Freelancer</label>
                    <select 
                      value={projectFilters.lead} 
                      onChange={(e) => setProjectFilters({ ...projectFilters, lead: e.target.value })}
                      className="input-field py-1 text-xs"
                    >
                      <option value="all">Toti</option>
                      {freelancers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-100">
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Proiect / Client</th>
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Lead</th>
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-right">Valoare Totala</th>
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-right">Valoare Hub</th>
                          {freelancers.map(f => (
                            <th key={f.id} className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-right min-w-[100px]">
                              {f.name.split(' ')[0]}
                            </th>
                          ))}
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-center">Actiuni</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredProjects.length === 0 ? (
                          <tr>
                            <td colSpan={5 + freelancers.length} className="p-10 text-center text-zinc-400 italic text-sm">
                              Nu exista proiecte inregistrate pentru aceasta perioada.
                            </td>
                          </tr>
                        ) : (
                          <>
                            {filteredProjects.map(p => {
                              const hubVal = p.totalValue * (p.hubContributionPercent / 100);
                              return (
                                <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-zinc-100 rounded flex items-center justify-center text-zinc-500">
                                        {getServiceIcon(p.serviceType)}
                                      </div>
                                      <div>
                                        <p className="font-semibold text-sm">{p.title}</p>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-bold text-indigo-600">#{p.contractNumber}</span>
                                          <span className="text-xs text-zinc-500">{p.client}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4 text-sm text-zinc-600">
                                    {freelancers.find(f => f.id === p.leadId)?.name}
                                  </td>
                                  <td className="p-4 font-mono text-sm font-bold text-right">
                                    {Math.round(p.totalValue).toLocaleString()}
                                  </td>
                                  <td className="p-4 font-mono text-sm text-indigo-600 font-medium text-right">
                                    {Math.round(hubVal).toLocaleString()}
                                  </td>
                                  {freelancers.map(f => {
                                    const share = p.shares?.find(s => s.freelancerId === f.id);
                                    return (
                                      <td key={f.id} className="p-4 font-mono text-sm text-right text-zinc-600">
                                        {share ? Math.round(share.amount).toLocaleString() : '-'}
                                      </td>
                                    );
                                  })}
                                  <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button 
                                        onClick={() => setEditingProject(p)}
                                        className="p-2 text-zinc-400 hover:text-indigo-600 transition-colors"
                                      >
                                        <Edit2 size={16} />
                                      </button>
                                      {profile?.role === 'SUPERADMIN' && (
                                        <button 
                                          onClick={() => deleteProject(p.id)}
                                          className="p-2 text-zinc-400 hover:text-rose-600 transition-colors"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            <tr className="bg-zinc-900 text-white font-bold">
                              <td colSpan={2} className="p-4 text-right uppercase text-[10px] tracking-widest">Total Perioada</td>
                              <td className="p-4 font-mono text-sm text-right">
                                {Math.round(filteredProjects.reduce((sum, p) => sum + p.totalValue, 0)).toLocaleString()}
                              </td>
                              <td className="p-4 font-mono text-sm text-right text-indigo-400">
                                {Math.round(filteredProjects.reduce((sum, p) => sum + (p.totalValue * p.hubContributionPercent / 100), 0)).toLocaleString()}
                              </td>
                              {freelancers.map(f => (
                                <td key={f.id} className="p-4 font-mono text-sm text-right">
                                  {Math.round(filteredProjects.reduce((sum, p) => {
                                    const share = p.shares?.find(s => s.freelancerId === f.id);
                                    return sum + (share ? share.amount : 0);
                                  }, 0)).toLocaleString()}
                                </td>
                              ))}
                              <td></td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'internal' && (
            <motion.div 
              key="internal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Tranzactii Interne</h2>
                  <p className="text-zinc-500">Perioada: {dateRange.start} - {dateRange.end}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setImportTarget('internal'); fileInputRef.current?.click(); }}
                    className="btn-secondary flex items-center gap-2 text-xs"
                  >
                    <Upload size={14} />
                    Import CSV
                  </button>
                  <button 
                    onClick={() => exportToCSV('internal')}
                    className="btn-secondary flex items-center gap-2 text-xs"
                  >
                    <Download size={14} />
                    Export CSV
                  </button>
                </div>
              </header>

              <div className="card p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Plus size={18} className="text-indigo-600" />
                  Noua Tranzactie
                </h3>
                <form onSubmit={addTransaction} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Nr. Contract</label>
                        <input name="contract" className="input-field" placeholder="Optional" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Data</label>
                        <input name="date" type="date" defaultValue={getToday()} required className="input-field" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">Descriere</label>
                      <input name="description" required className="input-field" placeholder="Ex: Editare video proiect X" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">Cine Plateste (Debitor)</label>
                      <select name="from" required className="input-field">
                        {freelancers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">Cine Primeste (Creditor)</label>
                      <select name="to" required className="input-field">
                        {freelancers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Suma (RON)</label>
                        <input name="amount" type="number" required className="input-field" placeholder="0" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Tip</label>
                        <select name="type" required className="input-field">
                          <option value="SUBCONTRACT">Subcontractare</option>
                          <option value="EQUIPMENT">Inchiriere Echipament</option>
                          <option value="STUDIO_RENTAL">Inchiriere Studio</option>
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="btn-primary w-full py-3">Inregistreaza Tranzactie</button>
                  </div>
                </form>
              </div>

              <div className="space-y-4">
                <div className="card p-4 flex flex-wrap gap-4 bg-zinc-50 border-zinc-200">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Filtru Debitor</label>
                    <select 
                      value={txFilters.debtor} 
                      onChange={(e) => setTxFilters({ ...txFilters, debtor: e.target.value })}
                      className="input-field py-1 text-xs"
                    >
                      <option value="all">Toti</option>
                      {freelancers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Filtru Creditor</label>
                    <select 
                      value={txFilters.creditor} 
                      onChange={(e) => setTxFilters({ ...txFilters, creditor: e.target.value })}
                      className="input-field py-1 text-xs"
                    >
                      <option value="all">Toti</option>
                      {freelancers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Filtru Tip</label>
                    <select 
                      value={txFilters.type} 
                      onChange={(e) => setTxFilters({ ...txFilters, type: e.target.value })}
                      className="input-field py-1 text-xs"
                    >
                      <option value="all">Toate</option>
                      <option value="SUBCONTRACT">Subcontractare</option>
                      <option value="EQUIPMENT">Inchiriere Echipament</option>
                      <option value="STUDIO_RENTAL">Inchiriere Studio</option>
                    </select>
                  </div>
                </div>

                <div className="card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-100">
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Descriere</th>
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">De la</th>
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Catre</th>
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-right">Suma</th>
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-center">Tip</th>
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-center">Actiuni</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-10 text-center text-zinc-400 italic text-sm">
                              Nu exista tranzactii interne inregistrate pentru aceasta perioada.
                            </td>
                          </tr>
                        ) : (
                          <>
                            {filteredTransactions.map(t => (
                              <tr key={t.id} className="hover:bg-zinc-50 transition-colors">
                                <td className="p-4">
                                  <p className="text-sm font-medium">{t.description}</p>
                                  <p className="text-[10px] text-zinc-400">Contract: {t.contractNumber || "-"}</p>
                                </td>
                                <td className="p-4 text-sm text-zinc-600">
                                  {freelancers.find(f => f.id === t.fromId)?.name}
                                </td>
                                <td className="p-4 text-sm text-zinc-600">
                                  {freelancers.find(f => f.id === t.toId)?.name}
                                </td>
                                <td className="p-4 font-mono text-sm font-bold text-right">
                                  {Math.round(t.amount).toLocaleString()}
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                                    t.type === 'SUBCONTRACT' ? 'bg-blue-100 text-blue-700' : 
                                    t.type === 'EQUIPMENT' ? 'bg-amber-100 text-amber-700' :
                                    t.type === 'STUDIO_RENTAL' ? 'bg-purple-100 text-purple-700' :
                                    'bg-zinc-100 text-zinc-700'
                                  }`}>
                                    {t.type === 'SUBCONTRACT' ? 'Subcontract' : 
                                     t.type === 'EQUIPMENT' ? 'Echipament' :
                                     t.type === 'STUDIO_RENTAL' ? 'Chirie Studio' : 'Altele'}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button 
                                      onClick={() => setEditingTransaction(t)}
                                      className="p-2 text-zinc-400 hover:text-indigo-600 transition-colors"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    {profile?.role === 'SUPERADMIN' && (
                                      <button 
                                        onClick={() => deleteTransaction(t.id)}
                                        className="p-2 text-zinc-400 hover:text-rose-600 transition-colors"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-zinc-900 text-white font-bold">
                              <td colSpan={3} className="p-4 text-right uppercase text-[10px] tracking-widest">Total Tranzactii</td>
                              <td className="p-4 font-mono text-sm text-right">
                                {Math.round(filteredTransactions.reduce((sum, t) => sum + t.amount, 0)).toLocaleString()}
                              </td>
                              <td colSpan={2}></td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'costs' && (
            <motion.div 
              key="costs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Cheltuieli Fixe</h2>
                  <p className="text-zinc-500">Costurile operationale ale studioului care trebuie acoperite lunar.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setImportTarget('costs'); fileInputRef.current?.click(); }}
                    className="btn-secondary flex items-center gap-2 text-xs"
                  >
                    <Upload size={14} />
                    Import CSV
                  </button>
                  <button 
                    onClick={() => exportToCSV('costs')}
                    className="btn-secondary flex items-center gap-2 text-xs"
                  >
                    <Download size={14} />
                    Export CSV
                  </button>
                </div>
              </header>

              <div className="card p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Plus size={18} className="text-indigo-600" />
                  Adauga Cheltuiala
                </h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const newCost: FixedCost = {
                    id: crypto.randomUUID(),
                    name: formData.get('name') as string,
                    amount: Number(formData.get('amount')),
                    category: formData.get('category') as any,
                    date: formData.get('date') as string || getToday(),
                    month: (formData.get('date') as string || getToday()).slice(0, 7),
                  };
                  setFixedCosts([...fixedCosts, newCost]);
                  e.currentTarget.reset();
                }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Nume Cheltuiala</label>
                    <input name="name" required className="input-field" placeholder="Ex: Curent Electric" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Data</label>
                    <input name="date" type="date" defaultValue={getToday()} required className="input-field" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Suma (RON)</label>
                    <input name="amount" type="number" required className="input-field" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Categorie</label>
                    <select name="category" required className="input-field">
                      <option value="RENT">Chirie</option>
                      <option value="UTILITIES">Utilitati</option>
                      <option value="OTHER">Altele</option>
                    </select>
                  </div>
                  <div className="lg:col-span-4">
                    <button type="submit" className="btn-primary w-full py-2">Adauga Cheltuiala</button>
                  </div>
                </form>
              </div>

              <div className="space-y-4">
                <div className="card p-4 flex flex-wrap gap-4 bg-zinc-50 border-zinc-200">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Categorie</label>
                    <select 
                      value={costFilters.category} 
                      onChange={(e) => setCostFilters({ ...costFilters, category: e.target.value })}
                      className="input-field py-1 text-xs"
                    >
                      <option value="all">Toate</option>
                      <option value="RENT">Chirie</option>
                      <option value="UTILITIES">Utilitati</option>
                      <option value="OTHER">Altele</option>
                    </select>
                  </div>
                </div>

                <div className="card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-100">
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Nume Cheltuiala</th>
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Categorie</th>
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Data</th>
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-right">Suma</th>
                          <th className="p-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-center">Actiuni</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredFixedCosts.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-10 text-center text-zinc-400 italic text-sm">Nu exista cheltuieli fixe inregistrate.</td>
                          </tr>
                        ) : (
                          <>
                            {filteredFixedCosts.map(c => (
                              <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                                <td className="p-4">
                                  <p className="text-sm font-medium">{c.name}</p>
                                </td>
                                <td className="p-4">
                                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${c.category === 'RENT' ? 'bg-indigo-100 text-indigo-700' : 'bg-zinc-100 text-zinc-700'}`}>
                                    {c.category === 'RENT' ? 'Chirie' : c.category === 'UTILITIES' ? 'Utilitati' : 'Altele'}
                                  </span>
                                </td>
                                <td className="p-4 text-sm text-zinc-600">{c.date}</td>
                                <td className="p-4 font-mono text-sm font-bold text-right text-rose-600">
                                  {c.amount.toLocaleString()} RON
                                </td>
                                <td className="p-4 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button 
                                      onClick={() => setEditingFixedCost(c)}
                                      className="p-2 text-zinc-400 hover:text-indigo-600 transition-colors"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    {profile?.role === 'SUPERADMIN' && (
                                      <button 
                                        onClick={() => deleteFixedCost(c.id)}
                                        className="p-2 text-zinc-400 hover:text-rose-600 transition-colors"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-zinc-900 text-white font-bold">
                              <td colSpan={3} className="p-4 text-right uppercase text-[10px] tracking-widest">Total Cheltuieli</td>
                              <td className="p-4 font-mono text-sm text-right">
                                {Math.round(filteredFixedCosts.reduce((sum, c) => sum + c.amount, 0)).toLocaleString()}
                              </td>
                              <td></td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'team' && (
            <motion.div 
              key="team"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Echipa Hub-ului</h2>
                  <p className="text-zinc-500">Freelancerii care fac parte din acest studio.</p>
                </div>
                <button 
                  onClick={() => setIsAddingFreelancer(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={16} />
                  Adauga Membru
                </button>
              </header>

              {(isAddingFreelancer || editingFreelancer) && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold">{editingFreelancer ? 'Editeaza Membru' : 'Adauga Membru'}</h3>
                      <button onClick={() => { setIsAddingFreelancer(false); setEditingFreelancer(null); }} className="text-zinc-400 hover:text-zinc-600">
                        <X size={24} />
                      </button>
                    </div>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const name = formData.get('name') as string;
                      const role = formData.get('role') as string;
                      
                      if (editingFreelancer) {
                        setFreelancers(freelancers.map(f => f.id === editingFreelancer.id ? { ...f, name, role } : f));
                      } else {
                        setFreelancers([...freelancers, { id: crypto.randomUUID(), name, role }]);
                      }
                      setIsAddingFreelancer(false);
                      setEditingFreelancer(null);
                    }} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Nume Complet</label>
                        <input name="name" defaultValue={editingFreelancer?.name} required className="input-field" placeholder="Ex: Ion Popescu" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Rol / Specializare</label>
                        <input name="role" defaultValue={editingFreelancer?.role} required className="input-field" placeholder="Ex: Videographer" />
                      </div>
                      <button type="submit" className="btn-primary w-full py-3 text-base">
                        {editingFreelancer ? 'Salveaza Modificarile' : 'Adauga Membru'}
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {freelancers.map(f => (
                  <div key={f.id} className="card p-6 flex flex-col items-center text-center gap-4 group relative">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button onClick={() => setEditingFreelancer(f)} className="p-2 bg-zinc-100 rounded-lg text-zinc-600 hover:bg-zinc-200">
                        <Edit2 size={14} />
                      </button>
                      {profile?.role === 'SUPERADMIN' && (
                        <button 
                          onClick={() => deleteFreelancer(f.id)} 
                          className="p-2 bg-rose-50 rounded-lg text-rose-600 hover:bg-rose-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                      <Users size={40} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{f.name}</h3>
                      <p className="text-sm text-zinc-500">{f.role}</p>
                    </div>
                    <div className="w-full pt-4 border-t border-zinc-100">
                      <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Balanta Curenta</p>
                      <p className={`text-lg font-mono font-bold ${stats.freelancerStats[f.id].netPosition >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {stats.freelancerStats[f.id].netPosition.toLocaleString()} RON
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header>
                <h2 className="text-3xl font-bold tracking-tight">Setari Aplicatie</h2>
                <p className="text-zinc-500">Configurari si importuri de date.</p>
              </header>

              <div className="card p-8 space-y-6">
                <h3 className="font-bold flex items-center gap-2">
                  <Shield className="text-indigo-600" size={20} />
                  Management Utilizatori (RBAC)
                </h3>
                
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-xs">
                    <p className="font-bold mb-1">Nota pentru Superadmin:</p>
                    <p>Utilizatorii noi apar aici dupa ce isi creeaza cont. Poti sa le schimbi rolul si sa ii asociezi cu un membru din echipa pentru a le filtra datele.</p>
                  </div>

                  <UserManagement freelancers={freelancers} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card p-8 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                      <Download size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Export Date (Excel)</h3>
                      <p className="text-sm text-zinc-500">Descarca toate datele din perioada selectata intr-un fisier Excel multi-sheet.</p>
                    </div>
                  </div>
                  <button 
                    onClick={exportToExcel}
                    className="btn-primary flex items-center gap-2 px-6"
                  >
                    <Download size={16} />
                    Exporta XLS
                  </button>
                </div>

                <div className="card p-8 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                      <Upload size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Import Date (Excel URL)</h3>
                      <p className="text-sm text-zinc-500">Importa date dintr-un URL public care pointeaza catre un fisier Excel (.xlsx).</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">URL Excel Public</label>
                      <input 
                        value={settings.lastImportUrl} 
                        onChange={(e) => setSettings({ ...settings, lastImportUrl: e.target.value })}
                        className="input-field" 
                        placeholder="https://example.com/data.xlsx" 
                      />
                    </div>
                    <button 
                      onClick={() => importExcelFromURL(settings.lastImportUrl || '')}
                      disabled={isImporting}
                      className="btn-primary py-2 text-xs px-6"
                    >
                      {isImporting ? 'Se importa...' : 'Importa Excel'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {editingProject && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Edit2 size={18} className="text-indigo-600" />
                  Editeaza Proiect
                </h3>
                <button onClick={() => setEditingProject(null)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateProject(editingProject.id, {
                  contractNumber: formData.get('contract') as string,
                  title: formData.get('title') as string,
                  client: formData.get('client') as string,
                  totalValue: Number(formData.get('value')),
                  leadId: formData.get('lead') as string,
                  serviceType: formData.get('type') as ServiceType,
                  date: formData.get('date') as string,
                  month: (formData.get('date') as string).slice(0, 7)
                });
                setEditingProject(null);
              }} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Nr. Contract</label>
                    <input name="contract" defaultValue={editingProject.contractNumber} required className="input-field" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Data</label>
                    <input name="date" type="date" defaultValue={editingProject.date} required className="input-field" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">Titlu Proiect</label>
                  <input name="title" defaultValue={editingProject.title} required className="input-field" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">Client</label>
                  <input name="client" defaultValue={editingProject.client} required className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Valoare (RON)</label>
                    <input name="value" type="number" defaultValue={editingProject.totalValue} required className="input-field" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Lead</label>
                    <select name="lead" defaultValue={editingProject.leadId} required className="input-field">
                      {freelancers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">Tip Serviciu</label>
                  <select name="type" defaultValue={editingProject.serviceType} required className="input-field">
                    <option value={ServiceType.PHOTO}>Foto</option>
                    <option value={ServiceType.VIDEO}>Video</option>
                    <option value={ServiceType.MARKETING}>Marketing</option>
                    <option value={ServiceType.CONSULTANCY}>Consultanta</option>
                  </select>
                </div>
                <div className="pt-4">
                  <button type="submit" className="btn-primary w-full py-3">Salveaza Modificarile</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingTransaction && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Edit2 size={18} className="text-indigo-600" />
                  Editeaza Tranzactie
                </h3>
                <button onClick={() => setEditingTransaction(null)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateTransaction(editingTransaction.id, {
                  contractNumber: formData.get('contract') as string,
                  fromId: formData.get('from') as string,
                  toId: formData.get('to') as string,
                  amount: Number(formData.get('amount')),
                  description: formData.get('description') as string,
                  type: formData.get('type') as any,
                  date: formData.get('date') as string,
                  month: (formData.get('date') as string).slice(0, 7)
                });
                setEditingTransaction(null);
              }} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Nr. Contract</label>
                    <input name="contract" defaultValue={editingTransaction.contractNumber} required className="input-field" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Data</label>
                    <input name="date" type="date" defaultValue={editingTransaction.date} required className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">De la</label>
                    <select name="from" defaultValue={editingTransaction.fromId} required className="input-field">
                      {freelancers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Catre</label>
                    <select name="to" defaultValue={editingTransaction.toId} required className="input-field">
                      {freelancers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">Suma (RON)</label>
                  <input name="amount" type="number" defaultValue={editingTransaction.amount} required className="input-field" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">Descriere</label>
                  <input name="description" defaultValue={editingTransaction.description} required className="input-field" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">Tip</label>
                  <select name="type" defaultValue={editingTransaction.type} required className="input-field">
                    <option value="SUBCONTRACT">Subcontractare</option>
                    <option value="EQUIPMENT">Inchiriere Echipament</option>
                    <option value="STUDIO_RENTAL">Inchiriere Studio</option>
                  </select>
                </div>
                <div className="pt-4">
                  <button type="submit" className="btn-primary w-full py-3">Salveaza Modificarile</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingFixedCost && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Edit2 size={18} className="text-indigo-600" />
                  Editeaza Cheltuiala Fixa
                </h3>
                <button onClick={() => setEditingFixedCost(null)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateFixedCost(editingFixedCost.id, {
                  name: formData.get('name') as string,
                  amount: Number(formData.get('amount')),
                  category: formData.get('category') as any,
                  date: formData.get('date') as string,
                  month: (formData.get('date') as string).slice(0, 7)
                });
                setEditingFixedCost(null);
              }} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">Nume Cheltuiala</label>
                  <input name="name" defaultValue={editingFixedCost.name} required className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Suma (RON)</label>
                    <input name="amount" type="number" defaultValue={editingFixedCost.amount} required className="input-field" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Data</label>
                    <input name="date" type="date" defaultValue={editingFixedCost.date} required className="input-field" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">Categorie</label>
                  <select name="category" defaultValue={editingFixedCost.category} required className="input-field">
                    <option value="RENT">Chirie</option>
                    <option value="UTILITIES">Utilitati</option>
                    <option value="OTHER">Altele</option>
                  </select>
                </div>
                <div className="pt-4">
                  <button type="submit" className="btn-primary w-full py-3">Salveaza Modificarile</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".csv"
        onChange={(e) => {
          if (importTarget) {
            handleFileUpload(e, importTarget);
            setImportTarget(null);
          }
        }}
      />
    </div>
  );
}
