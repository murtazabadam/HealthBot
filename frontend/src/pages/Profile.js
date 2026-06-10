import React, { useState } from "react";
import {
  User,
  Shield,
  Bell,
  BarChart2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const Profile = () => {
  // Only the state actually used by the component
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: true,
    notifications: true,
    analytics: false,
  });

  const toggleSetting = (key) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const SettingItem = ({ icon: Icon, title, description, active, onClick }) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0">
      <div className="flex items-center space-x-3">
        <div className="text-gray-500">
          <Icon size={20} />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button onClick={onClick} className="text-blue-600">
        {active ? (
          <ToggleRight size={28} />
        ) : (
          <ToggleLeft size={28} className="text-gray-300" />
        )}
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Profile Settings
      </h2>

      {/* Profile Summary Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-100 p-4 rounded-full">
            <User className="text-blue-600" size={32} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">User Account</h3>
            <p className="text-sm text-gray-500">
              Manage your personal information and privacy.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Settings Card */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold flex items-center">
            <Shield className="mr-2 text-gray-700" size={20} />
            Privacy & Preferences
          </h3>
        </div>
        <SettingItem
          icon={User}
          title="Profile Visibility"
          description="Allow others to see your profile information"
          active={privacySettings.profileVisibility}
          onClick={() => toggleSetting("profileVisibility")}
        />
        <SettingItem
          icon={Bell}
          title="Notifications"
          description="Receive health alerts and updates"
          active={privacySettings.notifications}
          onClick={() => toggleSetting("notifications")}
        />
        <SettingItem
          icon={BarChart2}
          title="Analytics"
          description="Share usage data to improve health insights"
          active={privacySettings.analytics}
          onClick={() => toggleSetting("analytics")}
        />
      </div>
    </div>
  );
};

export default Profile;
