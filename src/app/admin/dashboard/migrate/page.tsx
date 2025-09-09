'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { 
  FaPlay, 
  FaCopy, 
  FaCheck, 
  FaCode, 
  FaGlobe, 
  FaDatabase,
  FaCog,
  FaUser,
  FaMap,
  FaTrain,
  FaChartLine,
  FaExclamationTriangle,
  FaWrench,
  FaTicketAlt,
  FaRoute,
  FaBell
} from 'react-icons/fa';
import { FiSend, FiRefreshCw, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import styles from './migrate.module.scss';

interface ApiEndpoint {
  id: string;
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  category: string;
  icon: React.ReactNode;
  requestBody?: any;
  responseExample?: any;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
}

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  const apiEndpoints: ApiEndpoint[] = [
    // Migration APIs
    {
      id: 'migrate',
      name: 'Database Migration',
      description: 'Migrate core data to Supabase database',
      method: 'POST',
      path: '/api/migrate',
      category: 'Migration',
      icon: <FaDatabase />,
      requestBody: { action: 'migrate' },
      responseExample: { success: true, message: 'Migration completed successfully' }
    },
    {
      id: 'generate-sample',
      name: 'Generate Sample Data',
      description: 'Create sample operational data',
      method: 'POST',
      path: '/api/migrate',
      category: 'Migration',
      icon: <FaDatabase />,
      requestBody: { action: 'generate-sample' },
      responseExample: { success: true, message: 'Sample data generated successfully' }
    },
    {
      id: 'migrate-all',
      name: 'Full Migration',
      description: 'Run complete migration with sample data',
      method: 'POST',
      path: '/api/migrate',
      category: 'Migration',
      icon: <FaDatabase />,
      requestBody: { action: 'migrate-all' },
      responseExample: { success: true, message: 'Full migration completed successfully' }
    },
    // Auth APIs
    {
      id: 'signup',
      name: 'User Signup',
      description: 'Register a new user account',
      method: 'POST',
      path: '/api/auth/signup',
      category: 'Authentication',
      icon: <FaUser />,
      requestBody: { email: 'user@example.com', password: 'password123', name: 'John Doe' },
      responseExample: { success: true, user: { id: '1', email: 'user@example.com', name: 'John Doe' } }
    },
    {
      id: 'create-admin',
      name: 'Create Admin',
      description: 'Create an admin user account',
      method: 'POST',
      path: '/api/auth/create-admin',
      category: 'Authentication',
      icon: <FaUser />,
      requestBody: { email: 'admin@example.com', password: 'admin123', name: 'Admin User' },
      responseExample: { success: true, user: { id: '1', email: 'admin@example.com', name: 'Admin User', role: 'admin' } }
    },
    // Metro Data APIs
    {
      id: 'stations',
      name: 'Get Stations',
      description: 'Retrieve all metro stations',
      method: 'GET',
      path: '/api/stations',
      category: 'Metro Data',
      icon: <FaMap />,
      responseExample: [
        { id: 'ALUVA', name: 'Aluva', lat: 10.1089, lng: 76.3515, lineId: 'LINE_1' },
        { id: 'EDAPALLY', name: 'Edapally', lat: 10.0258, lng: 76.3071, lineId: 'LINE_1' }
      ]
    },
    {
      id: 'lines',
      name: 'Get Metro Lines',
      description: 'Retrieve all metro lines',
      method: 'GET',
      path: '/api/lines',
      category: 'Metro Data',
      icon: <FaRoute />,
      responseExample: [
        { id: 'LINE_1', name: 'Line 1', color: '#059669', stations: ['ALUVA', 'EDAPALLY'] },
        { id: 'LINE_2', name: 'Line 2', color: '#2563eb', stations: ['THYKOODAM', 'VYTILLA'] }
      ]
    },
    {
      id: 'routes',
      name: 'Get Routes',
      description: 'Retrieve route information',
      method: 'GET',
      path: '/api/routes',
      category: 'Metro Data',
      icon: <FaRoute />,
      responseExample: [
        { id: 'ROUTE_001', from: 'ALUVA', to: 'THYKOODAM', totalTime: 25, totalFare: 25 }
      ]
    },
    {
      id: 'trains',
      name: 'Get Trains',
      description: 'Retrieve train information',
      method: 'GET',
      path: '/api/trains',
      category: 'Metro Data',
      icon: <FaTrain />,
      responseExample: [
        { id: 'KMRL-001', trainNumber: 'KMRL-001', status: 'revenue', mileage: 15420 },
        { id: 'KMRL-002', trainNumber: 'KMRL-002', status: 'standby', mileage: 12850 }
      ]
    },
    {
      id: 'depot',
      name: 'Get Depot',
      description: 'Retrieve depot schematic data',
      method: 'GET',
      path: '/api/depot',
      category: 'Metro Data',
      icon: <FaTrain />,
      responseExample: {
        id: 'DEPOT_001',
        name: 'Kochi Metro Depot',
        bays: [
          { id: 'BAY_001', bayNumber: 'Bay 1', capacity: 2, occupied: 1 }
        ]
      }
    },
    // Operational APIs
    {
      id: 'jobcards',
      name: 'Get Job Cards',
      description: 'Retrieve maintenance job cards',
      method: 'GET',
      path: '/api/jobcards',
      category: 'Operations',
      icon: <FaWrench />,
      responseExample: [
        { id: 'JC-001', trainId: 'KMRL-001', title: 'Brake Inspection', status: 'open' },
        { id: 'JC-002', trainId: 'KMRL-002', title: 'Door Mechanism Check', status: 'in_progress' }
      ]
    },
    {
      id: 'branding',
      name: 'Get Branding Contracts',
      description: 'Retrieve advertising contracts',
      method: 'GET',
      path: '/api/branding',
      category: 'Operations',
      icon: <FaGlobe />,
      responseExample: [
        { id: 'BC-001', advertiser: 'Tech Corp', contractValue: 50000, status: 'active' },
        { id: 'BC-002', advertiser: 'Fashion Brand', contractValue: 75000, status: 'active' }
      ]
    },
    {
      id: 'stabling',
      name: 'Get Stabling Bays',
      description: 'Retrieve stabling bay information',
      method: 'GET',
      path: '/api/stabling',
      category: 'Operations',
      icon: <FaTrain />,
      responseExample: [
        { id: 'BAY-01', bayNumber: 'Bay 1', capacity: 2, occupied: 1 },
        { id: 'BAY-02', bayNumber: 'Bay 2', capacity: 2, occupied: 2 }
      ]
    },
    {
      id: 'alerts',
      name: 'Get Alerts',
      description: 'Retrieve system alerts',
      method: 'GET',
      path: '/api/alerts',
      category: 'Operations',
      icon: <FaBell />,
      responseExample: [
        { id: 'ALERT-001', title: 'Signal Failure', severity: 'warning', status: 'active' },
        { id: 'ALERT-002', title: 'Platform Maintenance', severity: 'info', status: 'active' }
      ]
    },
    {
      id: 'kpi',
      name: 'Get KPIs',
      description: 'Retrieve key performance indicators',
      method: 'GET',
      path: '/api/kpi',
      category: 'Analytics',
      icon: <FaChartLine />,
      responseExample: [
        { date: '2024-01-15', punctuality: 95.2, energyUsage: 1200, slaBreaches: 0 },
        { date: '2024-01-14', punctuality: 94.8, energyUsage: 1180, slaBreaches: 1 }
      ]
    },
    {
      id: 'conflicts',
      name: 'Get Conflicts',
      description: 'Retrieve operational conflicts',
      method: 'GET',
      path: '/api/conflicts',
      category: 'Operations',
      icon: <FaExclamationTriangle />,
      responseExample: [
        { id: 'CONFLICT-001', type: 'fitness', severity: 'medium', status: 'open' },
        { id: 'CONFLICT-002', type: 'jobcard', severity: 'high', status: 'resolved' }
      ]
    },
    {
      id: 'maintenance',
      name: 'Get Maintenance Records',
      description: 'Retrieve maintenance history',
      method: 'GET',
      path: '/api/maintenance',
      category: 'Operations',
      icon: <FaWrench />,
      responseExample: [
        { id: 'MAINT-001', trainId: 'KMRL-001', type: 'preventive', status: 'completed' },
        { id: 'MAINT-002', trainId: 'KMRL-002', type: 'corrective', status: 'in_progress' }
      ]
    },
    // Commuter APIs
    {
      id: 'trips',
      name: 'Get Trips',
      description: 'Retrieve commuter trip history',
      method: 'GET',
      path: '/api/trips',
      category: 'Commuter',
      icon: <FaRoute />,
      responseExample: [
        { id: 'TRIP-001', from: 'Aluva', to: 'Thykoodam', fare: 25, status: 'completed' },
        { id: 'TRIP-002', from: 'Edapally', to: 'MG Road', fare: 20, status: 'completed' }
      ]
    },
    {
      id: 'tickets',
      name: 'Get Tickets',
      description: 'Retrieve active tickets',
      method: 'GET',
      path: '/api/tickets',
      category: 'Commuter',
      icon: <FaTicketAlt />,
      responseExample: [
        { id: 'TICKET-001', type: 'single', fare: 25, status: 'active' },
        { id: 'TICKET-002', type: 'daily', fare: 50, status: 'active' }
      ]
    },
    // AI APIs
    {
      id: 'ai-optimize',
      name: 'AI Optimization',
      description: 'Get AI-powered train optimization recommendations',
      method: 'GET',
      path: '/api/ai/optimize',
      category: 'AI',
      icon: <FaCog />,
      responseExample: {
        results: [
          { trainId: 'KMRL-001', action: 'revenue', score: 95, reason: 'High passenger demand' },
          { trainId: 'KMRL-002', action: 'standby', score: 78, reason: 'Backup for maintenance' }
        ]
      }
    },
    {
      id: 'journey-plan',
      name: 'Journey Planning',
      description: 'Plan optimal journey routes',
      method: 'GET',
      path: '/api/journeys/plan',
      category: 'AI',
      icon: <FaRoute />,
      parameters: [
        { name: 'from', type: 'string', required: true, description: 'Starting station' },
        { name: 'to', type: 'string', required: true, description: 'Destination station' }
      ],
      responseExample: {
        from: 'Aluva',
        to: 'Thykoodam',
        steps: [{ type: 'metro', from: 'Aluva', to: 'Thykoodam', duration: 25, fare: 25 }],
        totalTime: 25,
        totalFare: 25
      }
    }
  ];

  const categories = Array.from(new Set(apiEndpoints.map(ep => ep.category)));

  const handleEndpointSelect = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint);
    setRequestBody(endpoint.requestBody ? JSON.stringify(endpoint.requestBody, null, 2) : '');
    setResponse(null);
    setShowResponse(false);
  };

  const handleApiCall = async () => {
    if (!selectedEndpoint) return;

    setLoading(true);
    setResponse(null);

    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (selectedEndpoint.method !== 'GET' && requestBody) {
        options.body = requestBody;
      }

      const response = await fetch(selectedEndpoint.path, options);
      const data = await response.json();

      setResponse({
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      setShowResponse(true);
      
      toast.success('API call completed successfully!');
    } catch (error) {
      setResponse({
        status: 'Error',
        statusText: 'Network Error',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      setShowResponse(true);
      toast.error('API call failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className={styles.apiDocsPage}>
      <div className={styles.header}>
        <h1>API Documentation & Testing</h1>
        <p>Explore and test all available API endpoints for the Kochi Metro system</p>
      </div>

      <div className={styles.layout}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>API Endpoints</h3>
          </div>
          
          {categories.map(category => (
            <div key={category} className={styles.category}>
              <h4 className={styles.categoryTitle}>{category}</h4>
              <div className={styles.endpoints}>
                {apiEndpoints
                  .filter(ep => ep.category === category)
                  .map(endpoint => (
                    <button
                      key={endpoint.id}
                      className={`${styles.endpointButton} ${
                        selectedEndpoint?.id === endpoint.id ? styles.active : ''
                      }`}
                      onClick={() => handleEndpointSelect(endpoint)}
                    >
                      <span className={styles.method}>{endpoint.method}</span>
                      <span className={styles.endpointName}>{endpoint.name}</span>
                      <span className={styles.endpointIcon}>{endpoint.icon}</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {selectedEndpoint ? (
            <>
              {/* Endpoint Details */}
              <Card className={styles.endpointCard}>
                <CardHeader>
                  <div className={styles.endpointHeader}>
                    <div className={styles.endpointInfo}>
                      <span className={`${styles.method} ${styles[selectedEndpoint.method.toLowerCase()]}`}>
                        {selectedEndpoint.method}
                      </span>
                      <code className={styles.path}>{selectedEndpoint.path}</code>
                    </div>
                    <div className={styles.endpointActions}>
                      <Button
                        variant="primary"
                        onClick={handleApiCall}
                        disabled={loading}
                        className={styles.testButton}
                        style={{
                          backgroundColor: '#2563eb',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          minHeight: '40px',
                          zIndex: 1000,
                          position: 'relative'
                        }}
                      >
                        {loading ? <Loading size="sm" /> : <FiSend />}
                        Test API
                      </Button>
                    </div>
                  </div>
                  <h3 className={styles.endpointTitle}>{selectedEndpoint.name}</h3>
                  <p className={styles.endpointDescription}>{selectedEndpoint.description}</p>
                </CardHeader>
              </Card>

              {/* Fallback Test Button */}
              <div style={{ 
                marginBottom: '1rem', 
                display: 'flex', 
                justifyContent: 'center',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.5rem',
                border: '2px dashed #e2e8f0'
              }}>
                <button
                  onClick={handleApiCall}
                  disabled={loading}
                  style={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    minHeight: '48px',
                    zIndex: 1000,
                    position: 'relative',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                >
                  {loading ? <Loading size="sm" /> : <FiSend />}
                  🚀 Test API Endpoint
                </button>
              </div>

              {/* Request/Response Section */}
              <div className={styles.requestResponseSection}>
                {/* Request Body */}
                {selectedEndpoint.method !== 'GET' && (
                  <Card className={styles.requestCard}>
                    <CardHeader>
                      <h4>Request Body</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(requestBody)}
                      >
                        {copied ? <FaCheck /> : <FaCopy />}
                        Copy
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <pre className={styles.codeBlock}>
                        <code>{requestBody}</code>
                      </pre>
                    </CardContent>
                  </Card>
                )}

                {/* Parameters */}
                {selectedEndpoint.parameters && (
                  <Card className={styles.parametersCard}>
                    <CardHeader>
                      <h4>Parameters</h4>
                    </CardHeader>
                    <CardContent>
                      <div className={styles.parametersTable}>
                        <div className={styles.parameterHeader}>
                          <span>Name</span>
                          <span>Type</span>
                          <span>Required</span>
                          <span>Description</span>
                        </div>
                        {selectedEndpoint.parameters.map((param, index) => (
                          <div key={index} className={styles.parameterRow}>
                            <code>{param.name}</code>
                            <span>{param.type}</span>
                            <span className={param.required ? styles.required : styles.optional}>
                              {param.required ? 'Yes' : 'No'}
                            </span>
                            <span>{param.description}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Response */}
                {response && (
                  <Card className={styles.responseCard}>
                    <CardHeader>
                      <div className={styles.responseHeader}>
                        <h4>Response</h4>
                        <div className={styles.responseActions}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowResponse(!showResponse)}
                          >
                            {showResponse ? <FiEyeOff /> : <FiEye />}
                            {showResponse ? 'Hide' : 'Show'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(formatJson(response))}
                          >
                            {copied ? <FaCheck /> : <FaCopy />}
                            Copy
                          </Button>
                        </div>
                      </div>
                      <div className={styles.responseStatus}>
                        <span className={`${styles.statusCode} ${styles[response.status >= 200 && response.status < 300 ? 'success' : 'error']}`}>
                          {response.status}
                        </span>
                        <span className={styles.statusText}>{response.statusText}</span>
                      </div>
                    </CardHeader>
                    {showResponse && (
                      <CardContent>
                        <pre className={styles.codeBlock}>
                          <code>{formatJson(response.data)}</code>
                        </pre>
                      </CardContent>
                    )}
                  </Card>
                )}

                {/* Example Response */}
                {selectedEndpoint.responseExample && !response && (
                  <Card className={styles.exampleCard}>
                    <CardHeader>
                      <h4>Example Response</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(formatJson(selectedEndpoint.responseExample))}
                      >
                        {copied ? <FaCheck /> : <FaCopy />}
                        Copy
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <pre className={styles.codeBlock}>
                        <code>{formatJson(selectedEndpoint.responseExample)}</code>
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <Card className={styles.welcomeCard}>
              <CardContent>
                <div className={styles.welcomeContent}>
                  <FaCode className={styles.welcomeIcon} />
                  <h3>Welcome to API Documentation</h3>
                  <p>Select an API endpoint from the sidebar to view its documentation and test it interactively.</p>
                  <div className={styles.features}>
                    <div className={styles.feature}>
                      <FaPlay className={styles.featureIcon} />
                      <span>Test APIs in real-time</span>
                    </div>
                    <div className={styles.feature}>
                      <FaCopy className={styles.featureIcon} />
                      <span>Copy requests and responses</span>
                    </div>
                    <div className={styles.feature}>
                      <FaCode className={styles.featureIcon} />
                      <span>View detailed documentation</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
