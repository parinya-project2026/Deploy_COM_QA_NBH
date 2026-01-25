'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LayoutDashboard,
  Download,
  Settings,
  Database,
  ChevronRight,
  RefreshCw,
  Calendar,
  Building2,
  Activity,
  Shield,
  TrendingUp,
  Users,
  Bell,
  Search,
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
  User,
  HelpCircle,
  FileText,
  BarChart3,
  PieChart,
  Clock,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Hospital,
  Stethoscope,
  Bed,
  Syringe,
  Filter,
  Loader2
} from 'lucide-react';

// Import admin modules
import AdminDashboard from './AdminDashboard';
import ExportModule from './ExportModule';
import SettingsModule from './SettingsModule';
import DataManagement from './DataManagement';

// ================= Types =================
interface DepartmentData {
  id: string;
  departmentId: string;
  departmentName: string;
  fiscalYear: string;
  month: string;
  data: Record<string, string>;
  updatedAt: string;
}

interface AdminPanelProps {
  // These can be passed in OR loaded via API
  initialData?: DepartmentData[];
  fieldLabels: Record<string, string>;
  computedFields: Set<string>;
  computeFields: (fields: Record<string, string>, fiscalYear: string, month: string) => Record<string, string>;
  currentUser?: {
    name: string;
    email?: string;
    role: string;
    department?: string;
    avatar?: string;
  };
  initialFiscalYear?: string;
  onLogout?: () => void;
}

type AdminView = 'dashboard' | 'export' | 'settings' | 'data';
type DepartmentGroup = 'all' | 'ipd' | 'opd' | 'special';

// Generate fiscal years: 30 years starting from 2569 (2026)
const FISCAL_YEARS = Array.from({ length: 30 }, (_, i) => String(2569 + i));

// Department Groups Configuration
const DEPARTMENT_GROUPS = {
  ipd: {
    id: 'ipd',
    name: 'IPD',
    nameTh: 'ผู้ป่วยใน',
    description: 'หอผู้ป่วยในทั้งหมด',
    icon: Bed,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    departmentIds: [
      'DEPT001', 'DEPT002', 'DEPT003', 'DEPT004', 'DEPT005', 'DEPT006',
      'DEPT007', 'DEPT008', 'DEPT009', 'DEPT010', 'DEPT011', 'DEPT012',
      'DEPT013', 'DEPT014', 'DEPT015', 'DEPT016', 'DEPT017', 'DEPT018',
      'DEPT019', 'DEPT020', 'DEPT021'
    ]
  },
  special: {
    id: 'special',
    name: 'Special Units',
    nameTh: 'หน่วยงานพิเศษ',
    description: 'OR, ER, วิสัญญี, ห้องคลอด',
    icon: Syringe,
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-200',
    departmentIds: ['SPECIAL001', 'SPECIAL002', 'SPECIAL003', 'SPECIAL004']
  },
  opd: {
    id: 'opd',
    name: 'OPD',
    nameTh: 'ผู้ป่วยนอก',
    description: 'คลินิกผู้ป่วยนอกทั้งหมด',
    icon: Stethoscope,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    departmentIds: [
      'OPD_GP', 'OPD_PED', 'OPD_ANC', 'OPD_DMHT', 'OPD_HEART',
      'OPD_ASTHMA', 'OPD_CKD', 'OPD_NEURO', 'OPD_HIV', 'OPD_TB',
      'OPD_SURG', 'OPD_ORTHO', 'OPD_URO', 'OPD_EYE', 'OPD_ENT',
      'OPD_AFTERHOUR', 'OPD_ELDER'
    ]
  }
};

// ================= Main Component =================
export default function AdminPanel({
  initialData = [],
  fieldLabels,
  computedFields,
  computeFields,
  currentUser = { name: 'Admin', email: 'admin@hospital.go.th', role: 'Administrator' },
  initialFiscalYear = '2569',
  onLogout
}: AdminPanelProps) {
  // ================= State =================
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [activeGroup, setActiveGroup] = useState<DepartmentGroup>('ipd');
  const [fiscalYear, setFiscalYear] = useState(initialFiscalYear);
  const [allDepartmentsData, setAllDepartmentsData] = useState<DepartmentData[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: 'info' | 'warning' | 'success' | 'error' }>>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ================= API Functions =================

  // Load all data from API
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/all-data?fiscalYear=${fiscalYear}`);
      const json = await res.json();

      if (!json.success) {
        addNotification('โหลดข้อมูลไม่สำเร็จ: ' + (json.message || 'Unknown error'), 'error');
        return;
      }

      setAllDepartmentsData(json.data || []);
      addNotification('โหลดข้อมูลสำเร็จ', 'success');
    } catch (error) {
      console.error('Load data error:', error);
      addNotification('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
    } finally {
      setLoading(false);
    }
  }, [fiscalYear]);

  // Save data to API
  const saveData = useCallback(async (record: DepartmentData): Promise<boolean> => {
    try {
      const res = await fetch('/api/qa/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: record.departmentId,
          departmentName: record.departmentName,
          fiscalYear: record.fiscalYear,
          month: record.month,
          fields: record.data
        })
      });

      const json = await res.json();

      if (!json.success) {
        addNotification('บันทึกข้อมูลไม่สำเร็จ: ' + (json.message || 'Unknown error'), 'error');
        return false;
      }

      addNotification('บันทึกข้อมูลสำเร็จ', 'success');

      // Reload data
      await loadAllData();
      return true;
    } catch (error) {
      console.error('Save error:', error);
      addNotification('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
      return false;
    }
  }, [loadAllData]);

  // Delete data from API
  const deleteData = useCallback(async (record: DepartmentData): Promise<boolean> => {
    try {
      const res = await fetch('/api/qa/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: record.departmentId,
          fiscalYear: record.fiscalYear,
          month: record.month
        })
      });

      const json = await res.json();

      if (!json.success) {
        addNotification('ลบข้อมูลไม่สำเร็จ: ' + (json.message || 'Unknown error'), 'error');
        return false;
      }

      addNotification('ลบข้อมูลสำเร็จ', 'success');

      // Reload data
      await loadAllData();
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      addNotification('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
      return false;
    }
  }, [loadAllData]);

  // ================= Helper Functions =================

  const addNotification = (message: string, type: 'info' | 'warning' | 'success' | 'error') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
  }, [loadAllData]);

  // ================= Effects =================

  // Load data on mount and when fiscal year changes
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Auto-dismiss notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // ================= Derived State =================

  // Filter data by selected group
  const filteredData = useMemo(() => {
    if (activeGroup === 'all') {
      return allDepartmentsData;
    }
    const groupConfig = DEPARTMENT_GROUPS[activeGroup as keyof typeof DEPARTMENT_GROUPS];
    if (!groupConfig) return allDepartmentsData;

    return allDepartmentsData.filter(d =>
      groupConfig.departmentIds.includes(d.departmentId)
    );
  }, [allDepartmentsData, activeGroup]);

  // Navigation items
  const navItems = [
    {
      id: 'dashboard' as AdminView,
      label: 'Dashboard',
      labelTh: 'แดชบอร์ด',
      icon: LayoutDashboard,
      description: 'ภาพรวมข้อมูลและสถิติ',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'data' as AdminView,
      label: 'Data Management',
      labelTh: 'จัดการข้อมูล',
      icon: Database,
      description: 'เพิ่ม แก้ไข ลบข้อมูล',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'export' as AdminView,
      label: 'Export',
      labelTh: 'ส่งออกข้อมูล',
      icon: Download,
      description: 'ส่งออก Excel/CSV',
      color: 'from-purple-500 to-violet-600'
    },
    {
      id: 'settings' as AdminView,
      label: 'Settings',
      labelTh: 'ตั้งค่า',
      icon: Settings,
      description: 'ตั้งค่าระบบ',
      color: 'from-amber-500 to-orange-600'
    }
  ];

  // Department group items
  const groupItems = [
    { id: 'ipd' as DepartmentGroup, ...DEPARTMENT_GROUPS.ipd },
    { id: 'special' as DepartmentGroup, ...DEPARTMENT_GROUPS.special },
    { id: 'opd' as DepartmentGroup, ...DEPARTMENT_GROUPS.opd }
  ];

  // Quick stats
  const quickStats = useMemo(() => {
    const totalRecords = filteredData.length;
    const uniqueDepts = new Set(filteredData.map(d => d.departmentId)).size;
    return { totalRecords, uniqueDepts };
  }, [filteredData]);

  // Stats per group
  const groupStats = useMemo(() => {
    const stats: Record<string, { count: number; depts: number }> = {};

    Object.entries(DEPARTMENT_GROUPS).forEach(([key, group]) => {
      const groupData = allDepartmentsData.filter(d =>
        group.departmentIds.includes(d.departmentId)
      );
      stats[key] = {
        count: groupData.length,
        depts: new Set(groupData.map(d => d.departmentId)).size
      };
    });

    return stats;
  }, [allDepartmentsData]);

  // Get current group config
  const currentGroupConfig = activeGroup !== 'all'
    ? DEPARTMENT_GROUPS[activeGroup as keyof typeof DEPARTMENT_GROUPS]
    : null;

  // ================= Render Functions =================

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <AdminDashboard
            allDepartmentsData={filteredData}
            fiscalYear={fiscalYear}
            onYearChange={setFiscalYear}
            onRefresh={handleRefresh}
            loading={loading || isRefreshing}
            departmentGroup={activeGroup}
            groupConfig={currentGroupConfig}
          />
        );
      case 'export':
        return (
          <ExportModule
            allDepartmentsData={filteredData}
            fiscalYear={fiscalYear}
            fieldLabels={fieldLabels}
            departmentGroup={activeGroup}
            groupConfig={currentGroupConfig}
            onExportStart={() => addNotification('กำลังเตรียมไฟล์...', 'info')}
            onExportComplete={() => addNotification('ส่งออกข้อมูลสำเร็จ', 'success')}
          />
        );
      case 'settings':
        return (
          <SettingsModule
            currentUser={currentUser}
            onSaveSettings={(settings) => {
              console.log('Settings saved:', settings);
              addNotification('บันทึกการตั้งค่าสำเร็จ', 'success');
            }}
            onResetData={async () => {
              console.log('Reset data requested');
            }}
          />
        );
      case 'data':
        return (
          <DataManagement
            allDepartmentsData={filteredData}
            fieldLabels={fieldLabels}
            computedFields={computedFields}
            computeFields={computeFields}
            departmentGroup={activeGroup}
            groupConfig={currentGroupConfig}
            onSave={saveData}
            onDelete={deleteData}
            onRefresh={handleRefresh}
            loading={loading || isRefreshing}
          />
        );
      default:
        return null;
    }
  };

  // ================= Main Render =================
  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'}`}>
      {/* Notifications Toast */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-in ${notification.type === 'success' ? 'bg-emerald-500 text-white' :
              notification.type === 'warning' ? 'bg-amber-500 text-white' :
                notification.type === 'error' ? 'bg-rose-500 text-white' :
                  'bg-blue-500 text-white'
              }`}
          >
            {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {notification.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
            {notification.type === 'error' && <X className="w-5 h-5" />}
            {notification.type === 'info' && <Bell className="w-5 h-5" />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        ))}
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-20' : 'w-72'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
      >
        {/* Logo */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1">
                <h1 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>QA Admin</h1>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>โรงพยาบาลหนองบัวลำภู</p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hidden lg:flex ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              <ChevronRight className={`w-5 h-5 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Department Group Selector */}
        {!sidebarCollapsed && (
          <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <p className={`px-2 mb-2 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <Filter className="w-3 h-3 inline mr-1" />
              เลือกกลุ่มแผนก
            </p>
            <div className="space-y-1">
              {groupItems.map((group) => {
                const Icon = group.icon;
                const isActive = activeGroup === group.id;
                const stats = groupStats[group.id];
                return (
                  <button
                    key={group.id}
                    onClick={() => setActiveGroup(group.id as DepartmentGroup)}
                    className={`w-full flex items-center gap-2 p-2.5 rounded-xl transition-all duration-200
                      ${isActive
                        ? `bg-gradient-to-r ${group.color} text-white shadow-md`
                        : `${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${darkMode ? 'text-gray-300' : 'text-gray-600'}`
                      }`}
                  >
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : group.bgColor}`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : group.textColor}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>{group.nameTh}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : `${group.bgColor} ${group.textColor}`
                      }`}>
                      {stats?.count || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Collapsed Group Icons */}
        {sidebarCollapsed && (
          <div className="p-2 space-y-1 border-b border-gray-100 dark:border-gray-700">
            {groupItems.map((group) => {
              const Icon = group.icon;
              const isActive = activeGroup === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => setActiveGroup(group.id as DepartmentGroup)}
                  className={`w-full p-2.5 rounded-xl transition-all duration-200 flex justify-center
                    ${isActive
                      ? `bg-gradient-to-r ${group.color} text-white shadow-md`
                      : `${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`
                    }`}
                  title={group.nameTh}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : group.textColor}`} />
                </button>
              );
            })}
          </div>
        )}

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {!sidebarCollapsed && (
            <p className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              เมนูหลัก
            </p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group
                  ${isActive
                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                    : `${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-600'}`
                  }
                  ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.labelTh : undefined}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : darkMode ? 'bg-gray-700' : 'bg-gray-100'} group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${isActive ? 'text-white' : ''}`}>{item.labelTh}</p>
                    <p className={`text-xs ${isActive ? 'text-white/70' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{item.description}</p>
                  </div>
                )}
                {!sidebarCollapsed && isActive && (
                  <ChevronRight className="w-5 h-5 text-white/70" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            {/* Fiscal Year Selector - Enhanced Visibility */}
            <div className="mb-4">
              <label className={`block text-sm font-bold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                📅 ปีงบประมาณ
              </label>
              <select
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border-2 text-base font-semibold shadow-lg transition-all ${darkMode
                  ? 'bg-gradient-to-r from-gray-700 to-gray-800 border-purple-500 text-white hover:border-purple-400'
                  : 'bg-gradient-to-r from-white to-indigo-50 border-indigo-400 text-indigo-900 hover:border-indigo-500'
                  } focus:ring-4 focus:ring-indigo-300 focus:border-indigo-600`}
                style={{ fontSize: '16px', fontWeight: '600' }}
              >
                {FISCAL_YEARS.map(year => (
                  <option key={year} value={year}>พ.ศ. {year} (ค.ศ. {Number(year) - 543})</option>
                ))}
              </select>
            </div>

            {/* User Info */}
            <div className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>{currentUser.name}</p>
                <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{currentUser.role}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        {/* Top Header */}
        <header className={`sticky top-0 z-30 ${darkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-md shadow-sm`}>
          <div className="px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`p-2 rounded-lg lg:hidden ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100'}`}
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Page Title with Group Badge */}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className={`text-xl lg:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {navItems.find(n => n.id === activeView)?.labelTh}
                  </h2>
                  {currentGroupConfig && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentGroupConfig.bgColor} ${currentGroupConfig.textColor} border ${currentGroupConfig.borderColor}`}>
                      {currentGroupConfig.nameTh}
                    </span>
                  )}
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} hidden sm:block`}>
                  {navItems.find(n => n.id === activeView)?.description}
                  {currentGroupConfig && ` • ${currentGroupConfig.description}`}
                </p>
              </div>

              {/* Quick Stats Pills */}
              <div className="hidden md:flex items-center gap-3">
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${darkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}>
                  <FileText className={`w-4 h-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <span className={`text-sm font-medium ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    {quickStats.totalRecords} รายการ
                  </span>
                </div>
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${darkMode ? 'bg-gray-700' : 'bg-emerald-50'}`}>
                  <Building2 className={`w-4 h-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span className={`text-sm font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {quickStats.uniqueDepts} แผนก
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing || loading}
                  className={`p-2.5 rounded-xl transition-all ${darkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                    } ${(isRefreshing || loading) ? 'animate-pulse' : ''}`}
                  title="รีเฟรชข้อมูล"
                >
                  <RefreshCw className={`w-5 h-5 ${(isRefreshing || loading) ? 'animate-spin' : ''}`} />
                </button>

                {/* Dark Mode Toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2.5 rounded-xl transition-all ${darkMode
                    ? 'hover:bg-gray-700 text-yellow-400'
                    : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  title={darkMode ? 'โหมดสว่าง' : 'โหมดมืด'}
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center gap-2 p-2 rounded-xl transition-all ${darkMode
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-100'
                      }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                      {currentUser.name.charAt(0)}
                    </div>
                  </button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
                      } py-2 z-50`}>
                      <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{currentUser.name}</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{currentUser.email}</p>
                      </div>
                      <button className={`w-full px-4 py-2 flex items-center gap-3 text-left ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                        }`}>
                        <User className="w-4 h-4" />
                        <span className="text-sm">โปรไฟล์</span>
                      </button>
                      <div className={`my-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />
                      <button
                        onClick={onLogout}
                        className={`w-full px-4 py-2 flex items-center gap-3 text-left text-red-500 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                          }`}
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">ออกจากระบบ</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Breadcrumb with Group */}
          <div className={`px-4 lg:px-6 py-2 border-t ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'}`}>
            <div className="flex items-center gap-2 text-sm">
              <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Admin</span>
              <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              {currentGroupConfig && (
                <>
                  <span className={currentGroupConfig.textColor}>{currentGroupConfig.nameTh}</span>
                  <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                </>
              )}
              <span className={`font-medium ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                {navItems.find(n => n.id === activeView)?.labelTh}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          {loading && allDepartmentsData.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-4" />
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>กำลังโหลดข้อมูล...</p>
              </div>
            </div>
          ) : (
            renderActiveView()
          )}
        </div>

        {/* Footer */}
        <footer className={`px-4 lg:px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <p className={darkMode ? 'text-gray-500' : 'text-gray-400'}>
              © 2568 ระบบ QA โรงพยาบาลหนองบัวลำภู - Admin Panel
            </p>
            <div className="flex items-center gap-4">
              <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <Clock className="w-4 h-4" />
                อัพเดทล่าสุด: {new Date().toLocaleString('th-TH')}
              </span>
              <span className={`flex items-center gap-1 text-emerald-500`}>
                <Sparkles className="w-4 h-4" />
                v3.0
              </span>
            </div>
          </div>
        </footer>
      </main>

      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
