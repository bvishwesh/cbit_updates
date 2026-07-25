import React, { useState, useEffect } from 'react';
import { Search, Mail, ExternalLink, Clock, Bell, Settings, RefreshCw, Sun, Moon, AlertCircle, Calendar, GraduationCap, Users, Inbox, MailOpen, Star, Archive, Trash2, Tag, Loader2, Menu, X, ArrowLeft } from 'lucide-react';

// Types
interface Notification {
  id: string;
  title: string;
  content: string;
  link: string;
  date: Date;
  read: boolean;
  category: 'announcement' | 'academic' | 'events' | 'admissions' | 'general';
  priority: 'high' | 'medium' | 'low';
}

interface FlashMessage {
  category: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

// API URL - use relative path to leverage Vite proxy in dev, full URL in production
const API_URL = import.meta.env.VITE_API_URL || '';



// Mock Data
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Mid-Term Examination Schedule Released',
    content: 'The mid-term examination schedule for all departments has been released. Students are advised to check their respective department notice boards for detailed timetables. Exam dates are from March 15-25, 2024.',
    link: 'https://cbit.ac.in/examinations/midterm-schedule',
    date: new Date('2024-03-01'),
    read: false,
    category: 'academic',
    priority: 'high'
  },
  {
    id: '2',
    title: 'Annual Tech Fest - TechnoVanza 2024 Registration Open',
    content: 'Registration for the annual technical festival TechnoVanza 2024 is now open. Various competitions including coding, robotics, and project exhibitions are available. Last date for registration is March 20, 2024.',
    link: 'https://cbit.ac.in/events/technovanza-2024',
    date: new Date('2024-02-28'),
    read: false,
    category: 'events',
    priority: 'medium'
  },
  {
    id: '3',
    title: 'Library Timings Extended for Examination Period',
    content: 'The central library will remain open until 11 PM during the examination period to facilitate student preparation. Additional study halls have been made available on the second floor.',
    link: 'https://cbit.ac.in/library/extended-hours',
    date: new Date('2024-02-26'),
    read: true,
    category: 'announcement',
    priority: 'low'
  },
  {
    id: '4',
    title: 'Scholarship Applications for Merit Students',
    content: 'Merit-based scholarship applications are now available for eligible students. Students with CGPA above 8.5 are encouraged to apply. Deadline for submission is March 30, 2024.',
    link: 'https://cbit.ac.in/scholarships/merit-based',
    date: new Date('2024-02-25'),
    read: false,
    category: 'admissions',
    priority: 'high'
  },
  {
    id: '5',
    title: 'Campus Placement Drive by TCS scheduled',
    content: 'Tata Consultancy Services will be conducting a campus placement drive on March 12, 2024. Eligible students from CSE, IT, and ECE departments can register through the placement portal.',
    link: 'https://cbit.ac.in/placements/tcs-drive-2024',
    date: new Date('2024-02-24'),
    read: true,
    category: 'academic',
    priority: 'high'
  },
  {
    id: '6',
    title: 'Hostel Room Allocation for Next Semester',
    content: 'Room allocation for the upcoming semester will begin on March 5, 2024. Current hostel residents need to confirm their accommodation requirements through the hostel portal.',
    link: 'https://cbit.ac.in/hostel/room-allocation',
    date: new Date('2024-02-23'),
    read: true,
    category: 'general',
    priority: 'medium'
  },
  {
    id: '7',
    title: 'Workshop on Machine Learning and AI',
    content: 'A two-day workshop on Machine Learning and Artificial Intelligence will be conducted by industry experts from Microsoft on March 8-9, 2024. Limited seats available.',
    link: 'https://cbit.ac.in/workshops/ml-ai-2024',
    date: new Date('2024-02-22'),
    read: false,
    category: 'events',
    priority: 'medium'
  },
  {
    id: '8',
    title: 'Fee Payment Deadline Extended',
    content: 'Due to technical issues with the payment gateway, the semester fee payment deadline has been extended to March 18, 2024. Students can pay through multiple modes including online and bank challan.',
    link: 'https://cbit.ac.in/fees/deadline-extension',
    date: new Date('2024-02-21'),
    read: true,
    category: 'announcement',
    priority: 'high'
  }
];

// Header Component
interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  unreadCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleSidebar: () => void;
  showBackButton: boolean;
  onBack: () => void;
  onSubscribeClick: () => void;
}

const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  isLoading,
  unreadCount,
  darkMode,
  onToggleDarkMode,
  onToggleSidebar,
  showBackButton,
  onBack,
  onSubscribeClick
}) => {
  return (
    <header className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 sm:px-6 py-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={showBackButton ? onBack : onToggleSidebar}
            className={`md:hidden p-2 rounded-lg transition-colors duration-200 ${
              darkMode 
                ? 'text-gray-400 hover:text-orange-400 hover:bg-gray-800' 
                : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
            }`}
          >
            {showBackButton ? <ArrowLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <h1 className={`text-lg sm:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <span className="hidden sm:inline">CBIT Updates</span>
              <span className="sm:hidden">CBIT</span>
            </h1>
          </div>
          
          {unreadCount > 0 && (
            <span className="hidden sm:inline bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative hidden sm:block">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} w-4 h-4`} />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`pl-10 pr-4 py-2 w-64 lg:w-80 border rounded-lg outline-none transition-colors ${
                darkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
              }`}
            />
          </div>
          
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              darkMode 
                ? 'text-gray-400 hover:text-orange-400 hover:bg-gray-800' 
                : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button 
            onClick={onToggleDarkMode}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              darkMode 
                ? 'text-gray-400 hover:text-orange-400 hover:bg-gray-800' 
                : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
            }`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={onSubscribeClick}
            className={`hidden sm:block p-2 rounded-lg transition-colors duration-200 ${
              darkMode 
                ? 'text-gray-400 hover:text-orange-400 hover:bg-gray-800' 
                : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
            }`}
          >
            <Mail className="w-4 h-4" />
          </button>
          
          <button className={`hidden sm:block p-2 rounded-lg transition-colors duration-200 ${
            darkMode 
              ? 'text-gray-400 hover:text-orange-400 hover:bg-gray-800' 
              : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
          }`}>
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

// Sidebar Component
interface SidebarProps {
  filter: 'all' | 'unread' | 'read';
  onFilterChange: (filter: 'all' | 'unread' | 'read') => void;
  unreadCount: number;
  totalCount: number;
  darkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSubscribeClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  filter,
  onFilterChange,
  unreadCount,
  totalCount,
  darkMode,
  isOpen,
  onClose,
  onSubscribeClick
}) => {
  const menuItems = [
    { id: 'all', label: 'All Notifications', icon: Inbox, count: totalCount },
    { id: 'unread', label: 'Unread', icon: Mail, count: unreadCount },
    { id: 'read', label: 'Read', icon: MailOpen, count: totalCount - unreadCount },
  ] as const;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 fixed md:relative z-50 md:z-auto
        w-64 h-full ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} 
        border-r flex flex-col transition-transform duration-300 ease-in-out
      `}>
        {/* Mobile close button */}
        <div className="md:hidden flex justify-end p-4">
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              darkMode 
                ? 'text-gray-400 hover:text-orange-400 hover:bg-gray-800' 
                : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Mobile search */}
        <div className="md:hidden px-4 pb-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} w-4 h-4`} />
            <input
              type="text"
              placeholder="Search notifications..."
              className={`pl-10 pr-4 py-2 w-full border rounded-lg outline-none transition-colors ${
                darkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
              }`}
            />
          </div>
        </div>
        
      <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button onClick={onSubscribeClick} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg">
          <Mail className="w-4 h-4" />
          <span>Subscribe to Updates</span>
        </button>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onFilterChange(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                  filter === item.id
                    ? darkMode
                      ? 'bg-orange-900/30 text-orange-400 border border-orange-700'
                      : 'bg-orange-50 text-orange-700 border border-orange-200'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`w-4 h-4 ${
                    filter === item.id 
                      ? darkMode ? 'text-orange-400' : 'text-orange-600'
                      : darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.count > 0 && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    filter === item.id 
                      ? darkMode ? 'bg-orange-800 text-orange-200' : 'bg-orange-200 text-orange-800'
                      : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
          <p>Updates checked every 30 minutes</p>
          <p className="mt-1">Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
      </div>
    </>
  );
};

// NotificationList Component
interface NotificationListProps {
  notifications: Notification[];
  selectedId?: string;
  onNotificationSelect: (notification: Notification) => void;
  darkMode: boolean;
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  selectedId,
  onNotificationSelect,
  darkMode,
  onNotificationClick
}) => {
  const getCategoryIcon = (category: Notification['category']) => {
    const iconMap = {
      announcement: AlertCircle,
      academic: GraduationCap,
      events: Calendar,
      admissions: Users,
      general: AlertCircle,
    };
    return iconMap[category];
  };

  const getCategoryColor = (category: Notification['category']) => {
    const colorMap = {
      announcement: 'text-red-500',
      academic: 'text-blue-500',
      events: 'text-green-500',
      admissions: 'text-purple-500',
      general: 'text-gray-500',
    };
    return colorMap[category];
  };

  const getPriorityIndicator = (priority: Notification['priority']) => {
    if (priority === 'high') {
      return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
    }
    if (priority === 'medium') {
      return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
    }
    return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className={`p-4 sm:p-6 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
        </h2>
      </div>
      
      <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
        {notifications.map((notification) => {
          const CategoryIcon = getCategoryIcon(notification.category);
          const isSelected = selectedId === notification.id;
          
          return (
            <div
              key={notification.id}
              onClick={() => {
                onNotificationSelect(notification);
                onNotificationClick?.(notification);
              }}
              className={`p-4 sm:p-6 cursor-pointer transition-colors duration-200 ${
                isSelected
                  ? darkMode
                    ? 'bg-orange-900/20 border-r-2 border-orange-500'
                    : 'bg-orange-50 border-r-2 border-orange-600'
                  : notification.read
                  ? darkMode
                    ? 'bg-gray-900 hover:bg-gray-800'
                    : 'bg-white hover:bg-gray-50'
                  : darkMode
                    ? 'bg-gray-800 hover:bg-gray-700 border-l-4 border-orange-500'
                    : 'bg-orange-25 hover:bg-orange-50 border-l-4 border-orange-500'
              }`}
            >
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="flex items-center space-x-2 mt-1">
                  {getPriorityIndicator(notification.priority)}
                  <CategoryIcon className={`w-4 h-4 ${getCategoryColor(notification.category)}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className={`font-medium text-sm sm:text-base leading-5 ${
                      notification.read 
                        ? darkMode ? 'text-gray-300' : 'text-gray-900'
                        : darkMode ? 'text-white font-semibold' : 'text-gray-900 font-semibold'
                    }`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                      <ExternalLink className={`w-3 h-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                  </div>
                  
                  <p className={`text-xs sm:text-sm mt-1 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {notification.content.substring(0, 120)}...
                  </p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        notification.category === 'announcement' ? 'bg-red-100 text-red-700' :
                        notification.category === 'academic' ? 'bg-blue-100 text-blue-700' :
                        notification.category === 'events' ? 'bg-green-100 text-green-700' :
                        notification.category === 'admissions' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {notification.category.charAt(0).toUpperCase() + notification.category.slice(1)}
                      </span>
                    </div>
                    
                    <div className={`flex items-center space-x-1 text-xs sm:text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      <Clock className="w-3 h-3" />
                      <span>{notification.date.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Subscribe Modal
interface SubscribeModalProps {
  open: boolean;
  onClose: () => void;
  darkMode: boolean;
}

const SubscribeModal: React.FC<SubscribeModalProps> = ({ open, onClose, darkMode }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to subscribe');
      } else {
        setMessage(data.message || 'Subscribed');
        try { localStorage.setItem('isSubscribed', '1'); localStorage.setItem('subscribedEmail', email); } catch {}
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} />
      <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} relative z-10 w-11/12 max-w-md rounded-xl shadow-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`p-5 border-b flex items-center justify-between ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="text-lg font-semibold">Subscribe to Updates</h3>
          <button onClick={onClose} className={`${darkMode ? 'text-gray-400 hover:text-orange-400 hover:bg-gray-800' : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'} p-2 rounded-lg`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Enter your email to receive notifications whenever a new update is posted.</p>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`w-full px-4 py-2 rounded-lg border outline-none ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-orange-500'}`}
          />
          {message && <div className="text-green-600 text-sm">{message}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button type="submit" disabled={isSubmitting} className={`w-full flex items-center justify-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
          </button>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>We’ll only use your email to send update notifications. You can unsubscribe anytime by contacting support.</p>
        </form>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  // Fetch updates from backend
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchUpdates = async () => {
    setApiError(null);
    try {
      setIsLoading(true);
      console.log('Fetching from:', `${API_URL}/api/updates`);
      const res = await fetch(`${API_URL}/api/updates`);
      console.log('Response status:', res.status);
      if (!res.ok) {
        throw new Error(`Failed to load updates: ${res.status}`);
      }
      const data: Array<{ title: string; link: string } | string> = await res.json();
      console.log('API Response:', data);
      if (!Array.isArray(data)) {
        setApiError('Invalid data format from server');
        setIsLoading(false);
        return;
      }
      if (data.length === 0) {
        setApiError('No updates found');
        setIsLoading(false);
        return;
      }
      const mapped: Notification[] = data.map((item, idx) => {
        if (typeof item === 'string') {
          return {
            id: String(idx + 1),
            title: item,
            content: item,
            link: '#',
            date: new Date(),
            read: false,
            category: 'general',
            priority: 'low',
          };
        }
        return {
          id: String(idx + 1),
          title: item.title || 'Update',
          content: item.title || 'Update',
          link: item.link || '#',
          date: new Date(),
          read: false,
          category: 'general',
          priority: 'low',
        };
      });
      setNotifications(mapped);
      setApiError(null);
    } catch (e) {
      console.error('Fetch error:', e);
      setApiError(e instanceof Error ? e.message : 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  // Show subscribe modal on first visit (if not already subscribed)
  useEffect(() => {
    try {
      const isSubscribed = localStorage.getItem('isSubscribed') === '1';
      const hasVisited = localStorage.getItem('hasVisited') === '1';
      if (!isSubscribed && !hasVisited) {
        setShowSubscribeModal(true);
      }
      localStorage.setItem('hasVisited', '1');
    } catch {}
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !notification.read) ||
                         (filter === 'read' && notification.read);
    
    return matchesSearch && matchesFilter;
  });

  const handleNotificationSelect = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }
    
    // Directly open the official notification link
    if (notification.link && notification.link !== '#') {
      window.open(notification.link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchUpdates();
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Directly open the official notification link
    if (notification.link && notification.link !== '#') {
      window.open(notification.link, '_blank', 'noopener,noreferrer');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} relative`}>
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        unreadCount={unreadCount}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        showBackButton={false}
        onBack={() => {}}
        onSubscribeClick={() => setShowSubscribeModal(true)}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          filter={filter}
          onFilterChange={setFilter}
          unreadCount={unreadCount}
          totalCount={notifications.length}
          darkMode={darkMode}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
          onSubscribeClick={() => setShowSubscribeModal(true)}
        />
        
        <div className="flex-1 flex">
          {apiError ? (
            <div className={`flex-1 flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <div className="text-center p-8">
                <div className={`text-red-500 text-lg mb-2`}>Failed to load updates</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{apiError}</div>
                <button
                  onClick={handleRefresh}
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
          <NotificationList
            notifications={filteredNotifications}
            selectedId={selectedNotification?.id}
            onNotificationSelect={handleNotificationSelect}
            darkMode={darkMode}
            onNotificationClick={handleNotificationClick}
          />
          )}
        </div>
      </div>

      <SubscribeModal open={showSubscribeModal} onClose={() => setShowSubscribeModal(false)} darkMode={darkMode} />
    </div>
  );
}

export default App;