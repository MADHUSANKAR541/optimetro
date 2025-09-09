'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Ticket } from '@/lib/types';
import { 
  FaQrcode, 
  FaTicketAlt, 
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaDownload
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import styles from './tickets.module.scss';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await api<Ticket[]>('/tickets');
      setTickets(response.data);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleShowQR = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    toast.success('QR Code displayed!');
  };

  const handleDownloadTicket = (ticket: Ticket) => {
    toast.success('Ticket downloaded!');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <FaCheckCircle className={styles.activeIcon} />;
      case 'expired': return <FaTimesCircle className={styles.expiredIcon} />;
      case 'used': return <FaCheckCircle className={styles.usedIcon} />;
      default: return <FaTicketAlt className={styles.defaultIcon} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return styles.active;
      case 'expired': return styles.expired;
      case 'used': return styles.used;
      default: return styles.default;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTicketTypeIcon = (type: string) => {
    switch (type) {
      case 'single': return '🎫';
      case 'daily': return '📅';
      case 'monthly': return '📆';
      default: return '🎫';
    }
  };

  return (
    <div className={styles.tickets}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.header}
      >
        <h1 className={styles.title}>My Tickets</h1>
        <p className={styles.subtitle}>
          Manage your metro tickets and passes
        </p>
      </motion.div>

      {/* QR Code Modal */}
      {selectedTicket && (
        <div className={styles.modalOverlay} onClick={() => setSelectedTicket(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>QR Code</h3>
              <button
                className={styles.closeButton}
                onClick={() => setSelectedTicket(null)}
              >
                ×
              </button>
            </div>
            <div className={styles.qrCode}>
              <div className={styles.qrPlaceholder}>
                <FaQrcode className={styles.qrIcon} />
                <span className={styles.qrText}>{selectedTicket.qrCode}</span>
              </div>
            </div>
            <div className={styles.ticketInfo}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Ticket ID:</span>
                <span className={styles.infoValue}>{selectedTicket.id}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Type:</span>
                <span className={styles.infoValue}>{selectedTicket.type.toUpperCase()}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Valid Until:</span>
                <span className={styles.infoValue}>{formatDate(selectedTicket.validTo)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tickets Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card variant="elevated" className={styles.ticketsCard}>
          <CardHeader>
            <h2 className={styles.cardTitle}>
              <FaTicketAlt className={styles.cardIcon} />
              Your Tickets ({tickets.length})
            </h2>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className={styles.skeleton}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className={styles.skeletonItem} />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className={styles.emptyState}>
                <FaTicketAlt className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>No tickets found</h3>
                <p className={styles.emptyDescription}>
                  You don't have any tickets yet. Purchase a ticket to get started!
                </p>
                <Button variant="primary" size="lg">
                  Buy Ticket
                </Button>
              </div>
            ) : (
              <div className={styles.ticketsGrid}>
                {tickets.map((ticket, index) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={`${styles.ticketCard} ${getStatusColor(ticket.status)}`}
                  >
                    <div className={styles.ticketHeader}>
                      <div className={styles.ticketType}>
                        <span className={styles.typeIcon}>
                          {getTicketTypeIcon(ticket.type)}
                        </span>
                        <span className={styles.typeText}>{ticket.type.toUpperCase()}</span>
                      </div>
                      <div className={styles.ticketStatus}>
                        {getStatusIcon(ticket.status)}
                        <span className={styles.statusText}>{ticket.status.toUpperCase()}</span>
                      </div>
                    </div>

                    <div className={styles.ticketBody}>
                      <div className={styles.ticketId}>
                        <span className={styles.idLabel}>Ticket ID</span>
                        <span className={styles.idValue}>{ticket.id}</span>
                      </div>

                      <div className={styles.ticketValidity}>
                        <div className={styles.validityItem}>
                          <FaClock className={styles.validityIcon} />
                          <div className={styles.validityContent}>
                            <span className={styles.validityLabel}>Valid From</span>
                            <span className={styles.validityValue}>{formatDate(ticket.validFrom)}</span>
                          </div>
                        </div>
                        <div className={styles.validityItem}>
                          <FaClock className={styles.validityIcon} />
                          <div className={styles.validityContent}>
                            <span className={styles.validityLabel}>Valid Until</span>
                            <span className={styles.validityValue}>{formatDate(ticket.validTo)}</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.ticketFare}>
                        <span className={styles.fareLabel}>Fare</span>
                        <span className={styles.fareValue}>₹{ticket.fare}</span>
                      </div>
                    </div>

                    <div className={styles.ticketActions}>
                      {ticket.status === 'active' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleShowQR(ticket)}
                          icon={<FaEye />}
                        >
                          Show QR
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadTicket(ticket)}
                        icon={<FaDownload />}
                      >
                        Download
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
