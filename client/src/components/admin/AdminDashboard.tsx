import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import MenuManagement from './MenuManagement';
import InventoryManagement from './InventoryManagement';
import StaffManagement from './StaffManagement';
import FeedbackView from './FeedbackView';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('menu');

  return (
    <Box sx={{ display: 'flex' }}>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_: React.SyntheticEvent, newValue: string) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="Menu" value="menu" />
          <Tab label="Inventory" value="inventory" />
          <Tab label="Staff" value="staff" />
          <Tab label="Feedback" value="feedback" />
        </Tabs>

        {activeTab === 'menu' && <MenuManagement />}
        {activeTab === 'inventory' && <InventoryManagement />}
        {activeTab === 'staff' && <StaffManagement />}
        {activeTab === 'feedback' && <FeedbackView />}
      </Box>
    </Box>
  );
};

export default AdminDashboard; 