import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import axios from "axios";
import {
  Save,
  Mail,
  Bell,
  Clock,
  Phone,
  Settings as SettingsIcon,
  User,
  ChevronRight,
  CheckCircle,
  XCircle,
  Info,
  Loader2,
} from "lucide-react";
import LayoutWrapper from "../components/LayoutWrapper";
import { Button } from "../components/ui/Button";
import { Switch } from "../components/ui/Switch";

interface NotificationSettings {
  dailySummaryEnabled: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  emailRecipients: string;
  whatsappRecipients: string;
  scheduledTime: string;
}

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("notifications");
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    dailySummaryEnabled: true,
    emailEnabled: true,
    whatsappEnabled: false,
    emailRecipients: "",
    whatsappRecipients: "",
    scheduledTime: "20:00",
  });

  // Check if user is admin
  const isAdmin = user?.role === "admin";
  
  // Fetch current notification settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!isAdmin) return;
      
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const BASE_URL = import.meta.env.VITE_API_URL || "";
        
        const response = await axios.get(`${BASE_URL}/api/settings/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.data.success) {
          setNotificationSettings(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch notification settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [isAdmin]);
  
  // Save notification settings
  const saveNotificationSettings = async () => {
    if (!isAdmin) {
      toast.error("Only administrators can change these settings");
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const BASE_URL = import.meta.env.VITE_API_URL || "";
      
      const response = await axios.post(
        `${BASE_URL}/api/settings/notifications`,
        notificationSettings,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (response.data.success) {
        toast.success("Settings saved successfully");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNotificationSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  return (
    <LayoutWrapper title="Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ⚙️ Settings
          </h1>
        </div>
        
        {/* Settings Navigation */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("account")}
                className={`w-full flex items-center px-4 py-2 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  activeTab === "account" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : ""
                }`}
              >
                <User size={18} className="mr-2" />
                <span>Account</span>
                <ChevronRight size={16} className="ml-auto" />
              </button>
              
              <button
                onClick={() => setActiveTab("notifications")}
                className={`w-full flex items-center px-4 py-2 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  activeTab === "notifications" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : ""
                }`}
              >
                <Bell size={18} className="mr-2" />
                <span>Notifications</span>
                <ChevronRight size={16} className="ml-auto" />
              </button>
              
              <button
                onClick={() => setActiveTab("general")}
                className={`w-full flex items-center px-4 py-2 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  activeTab === "general" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : ""
                }`}
              >
                <SettingsIcon size={18} className="mr-2" />
                <span>General</span>
                <ChevronRight size={16} className="ml-auto" />
              </button>
            </nav>
          </div>
          
          {/* Settings Content */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm md:col-span-3 dark:bg-gray-800 dark:border-gray-700">
            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Notification Settings
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Configure how and when you receive notifications and reports
                </p>
                
                <div className="mt-6 divide-y divide-gray-200 dark:divide-gray-700">
                  {/* Daily Summary Reports Section */}
                  <div className="py-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Daily Summary Reports
                    </h3>
                    
                    {!isAdmin && (
                      <div className="flex items-center p-4 mt-2 space-x-3 text-sm text-amber-800 bg-amber-50 rounded-md dark:bg-amber-900/20 dark:text-amber-300">
                        <Info size={18} />
                        <p>Only administrators can change these settings</p>
                      </div>
                    )}
                    
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 mr-2 text-blue-500 animate-spin" />
                        <span>Loading settings...</span>
                      </div>
                    ) : (
                      <>
                        <div className="mt-4 space-y-4">
                          {/* Enable/Disable Daily Summary */}
                          <div className="flex items-center justify-between">
                            <div>
                              <label htmlFor="dailySummaryEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Enable Daily Summary Reports
                              </label>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Receive daily reports on production, job completion, and machine performance
                              </p>
                            </div>
                            <Switch
                              id="dailySummaryEnabled"
                              checked={notificationSettings.dailySummaryEnabled}
                              onCheckedChange={(checked) => 
                                handleSwitchChange("dailySummaryEnabled", checked)
                              }
                              disabled={!isAdmin}
                            />
                          </div>
                          
                          {notificationSettings.dailySummaryEnabled && (
                            <>
                              {/* Scheduled Time */}
                              <div className="flex flex-col space-y-1.5">
                                <label htmlFor="scheduledTime" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Scheduled Time
                                </label>
                                <div className="flex items-center">
                                  <Clock size={18} className="mr-2 text-gray-400" />
                                  <select
                                    id="scheduledTime"
                                    name="scheduledTime"
                                    value={notificationSettings.scheduledTime}
                                    onChange={handleInputChange}
                                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                                    disabled={!isAdmin}
                                  >
                                    <option value="08:00">08:00 AM</option>
                                    <option value="12:00">12:00 PM</option>
                                    <option value="16:00">04:00 PM</option>
                                    <option value="18:00">06:00 PM</option>
                                    <option value="20:00">08:00 PM</option>
                                    <option value="22:00">10:00 PM</option>
                                  </select>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  The time when daily summary reports will be sent
                                </p>
                              </div>
                              
                              {/* Notification Channels */}
                              <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Notification Channels
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Select how you want to receive the daily summary reports
                                </p>
                                
                                <div className="mt-3 space-y-3">
                                  {/* Email Channel */}
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <Mail size={18} className="mr-2 text-gray-500 dark:text-gray-400" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
                                      </div>
                                      <Switch
                                        id="emailEnabled"
                                        checked={notificationSettings.emailEnabled}
                                        onCheckedChange={(checked) => 
                                          handleSwitchChange("emailEnabled", checked)
                                        }
                                        disabled={!isAdmin}
                                      />
                                    </div>
                                    
                                    {notificationSettings.emailEnabled && (
                                      <div>
                                        <label htmlFor="emailRecipients" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                          Email Recipients
                                        </label>
                                        <input
                                          type="text"
                                          id="emailRecipients"
                                          name="emailRecipients"
                                          value={notificationSettings.emailRecipients}
                                          onChange={handleInputChange}
                                          placeholder="email1@example.com, email2@example.com"
                                          className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                                          disabled={!isAdmin}
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                          Separate multiple email addresses with commas
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* WhatsApp Channel */}
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <Phone size={18} className="mr-2 text-gray-500 dark:text-gray-400" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">WhatsApp</span>
                                      </div>
                                      <Switch
                                        id="whatsappEnabled"
                                        checked={notificationSettings.whatsappEnabled}
                                        onCheckedChange={(checked) => 
                                          handleSwitchChange("whatsappEnabled", checked)
                                        }
                                        disabled={!isAdmin}
                                      />
                                    </div>
                                    
                                    {notificationSettings.whatsappEnabled && (
                                      <div>
                                        <label htmlFor="whatsappRecipients" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                          WhatsApp Recipients
                                        </label>
                                        <input
                                          type="text"
                                          id="whatsappRecipients"
                                          name="whatsappRecipients"
                                          value={notificationSettings.whatsappRecipients}
                                          onChange={handleInputChange}
                                          placeholder="+910000000000, +910000000001"
                                          className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                                          disabled={!isAdmin}
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                          Enter phone numbers with country code (e.g., +910000000000)
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        
                        {isAdmin && (
                          <div className="flex justify-end mt-6">
                            <Button
                              type="button"
                              variant="default"
                              onClick={saveNotificationSettings}
                              disabled={saving}
                              className="flex items-center"
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4 mr-2" />
                                  Save Settings
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Account Settings */}
            {activeTab === "account" && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Account Settings
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Manage your account information and preferences
                </p>
                
                <div className="p-4 mt-4 text-center bg-gray-50 dark:bg-gray-700 rounded-md">
                  <p>Account settings coming soon</p>
                </div>
              </div>
            )}
            
            {/* General Settings */}
            {activeTab === "general" && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  General Settings
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Configure general application preferences
                </p>
                
                <div className="p-4 mt-4 text-center bg-gray-50 dark:bg-gray-700 rounded-md">
                  <p>General settings coming soon</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default Settings;
