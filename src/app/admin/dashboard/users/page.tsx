'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  FaUsers, 
  FaUserShield, 
  FaUser, 
  FaToggleOn, 
  FaToggleOff,
  FaSync,
  FaSearch
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import styles from './users.module.scss';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'commuter';
  avatar?: string;
  created_at: string;
  last_sign_in?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users || []);
      setCurrentUser(data.currentUser || null);
    } catch (error) {
      toast.error('Failed to load users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle user admin role
  const toggleAdminRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'commuter' : 'admin';
      const response = await fetch('/api/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });

      if (!response.ok) throw new Error('Failed to update user role');
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, role: newRole as 'admin' | 'commuter' }
          : user
      ));
      
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      toast.error('Failed to update user role');
      console.error('Error updating user role:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const adminUsers = filteredUsers.filter(user => user.role === 'admin');
  const commuterUsers = filteredUsers.filter(user => user.role === 'commuter');

  return (
    <div className={styles.users}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.header}
      >
        <h1 className={styles.title}>User Management</h1>
        <p className={styles.subtitle}>
          Manage user accounts and administrative privileges
        </p>
      </motion.div>

      <div className={styles.content}>
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={styles.statsGrid}
        >
          <Card variant="elevated" className={styles.statCard}>
            <CardContent>
              <div className={styles.statContent}>
                <FaUsers className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <h3 className={styles.statNumber}>{users.length}</h3>
                  <p className={styles.statLabel}>Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className={styles.statCard}>
            <CardContent>
              <div className={styles.statContent}>
                <FaUserShield className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <h3 className={styles.statNumber}>{adminUsers.length}</h3>
                  <p className={styles.statLabel}>Administrators</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className={styles.statCard}>
            <CardContent>
              <div className={styles.statContent}>
                <FaUser className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <h3 className={styles.statNumber}>{commuterUsers.length}</h3>
                  <p className={styles.statLabel}>Commuters</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={styles.actions}
        >
          <div className={styles.searchContainer}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <Button
            variant="outline"
            onClick={fetchUsers}
            icon={<FaSync />}
            disabled={loading}
          >
            Refresh
          </Button>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card variant="elevated" className={styles.usersCard}>
            <CardHeader>
              <h2 className={styles.cardTitle}>
                <FaUsers className={styles.cardIcon} />
                Registered Users ({filteredUsers.length})
              </h2>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className={styles.skeleton}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className={styles.skeletonItem} />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className={styles.emptyState}>
                  <FaUsers className={styles.emptyIcon} />
                  <h3 className={styles.emptyTitle}>No Users Found</h3>
                  <p className={styles.emptyDescription}>
                    {searchTerm ? 'No users match your search criteria.' : 'No users have registered yet.'}
                  </p>
                </div>
              ) : (
                <div className={styles.usersTable}>
                  <div className={styles.tableHeader}>
                    <div className={styles.tableCell}>User</div>
                    <div className={styles.tableCell}>Email</div>
                    <div className={styles.tableCell}>Role</div>
                    <div className={styles.tableCell}>Joined</div>
                    <div className={styles.tableCell}>Actions</div>
                  </div>
                  {filteredUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className={styles.tableRow}
                    >
                      <div className={styles.tableCell}>
                        <div className={styles.userInfo}>
                          <div className={styles.avatar}>
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} />
                            ) : (
                              <FaUser />
                            )}
                          </div>
                          <div className={styles.userDetails}>
                            <h4 className={styles.userName}>{user.name}</h4>
                            <p className={styles.userId}>ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </div>
                      <div className={styles.tableCell}>
                        <span className={styles.email}>{user.email}</span>
                      </div>
                      <div className={styles.tableCell}>
                        <span className={`${styles.roleBadge} ${user.role === 'admin' ? styles.admin : styles.commuter}`}>
                          {user.role.toUpperCase()}
                        </span>
                      </div>
                      <div className={styles.tableCell}>
                        <span className={styles.date}>
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={styles.tableCell}>
                        {currentUser?.role === 'admin' && currentUser?.id !== user.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAdminRole(user.id, user.role)}
                            icon={user.role === 'admin' ? <FaToggleOn /> : <FaToggleOff />}
                            className={styles.toggleButton}
                          >
                            {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          </Button>
                        )}
                        {currentUser?.id === user.id && (
                          <span className={styles.currentUser}>You</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
