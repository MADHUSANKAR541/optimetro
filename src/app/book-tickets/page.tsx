'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  FaTrain, 
  FaClock, 
  FaMapMarkerAlt, 
  FaTicketAlt,
  FaArrowRight,
  FaWifi,
  FaUsers,
  FaExclamationTriangle,
  FaSearch,
  FaCalendarAlt,
  FaUser,
  FaLeaf,
  FaQrcode,
  FaDownload,
  FaCreditCard,
  FaMobile,
  FaWallet,
  FaCheckCircle,
  FaArrowLeft,
  FaExchangeAlt
} from 'react-icons/fa';
import styles from './book-tickets.module.scss';

interface Station {
  id: string;
  name: string;
  code: string;
}

interface TrainResult {
  id: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  status: 'on-time' | 'delayed' | 'boarding';
  platform: string;
  occupancy: 'low' | 'medium' | 'high';
  fare: number;
  seats: {
    available: number;
    total: number;
  };
}

interface JourneyForm {
  fromStation: string;
  toStation: string;
  date: string;
  time: string;
  passengers: number;
}

const stations: Station[] = [
  { id: '1', name: 'Aluva', code: 'ALU' },
  { id: '2', name: 'Pulinchodu', code: 'PUL' },
  { id: '3', name: 'Companypady', code: 'COM' },
  { id: '4', name: 'Ambattukavu', code: 'AMB' },
  { id: '5', name: 'Muttom', code: 'MUT' },
  { id: '6', name: 'Kalamassery', code: 'KAL' },
  { id: '7', name: 'Cochin University', code: 'CUS' },
  { id: '8', name: 'Pathadipalam', code: 'PAT' },
  { id: '9', name: 'Edapally', code: 'EDA' },
  { id: '10', name: 'Changampuzha Park', code: 'CHP' },
  { id: '11', name: 'Palarivattom', code: 'PAL' },
  { id: '12', name: 'JLN Stadium', code: 'JLN' },
  { id: '13', name: 'Kaloor', code: 'KAL' },
  { id: '14', name: 'Town Hall', code: 'THL' },
  { id: '15', name: 'M.G. Road', code: 'MGR' },
  { id: '16', name: 'Maharaja\'s College', code: 'MJC' },
  { id: '17', name: 'Ernakulam South', code: 'ERS' },
  { id: '18', name: 'Kadavanthra', code: 'KAD' },
  { id: '19', name: 'Elamkulam', code: 'ELM' },
  { id: '20', name: 'Vyttila', code: 'VYT' },
  { id: '21', name: 'Thykoodam', code: 'THY' }
];

const mockTrainResults: TrainResult[] = [
  {
    id: 'KM001',
    from: 'Aluva',
    to: 'Thykoodam',
    departure: '06:30',
    arrival: '07:15',
    duration: '45 min',
    status: 'on-time',
    platform: 'Platform 1',
    occupancy: 'low',
    fare: 25,
    seats: { available: 45, total: 50 }
  },
  {
    id: 'KM002',
    from: 'Aluva',
    to: 'Thykoodam',
    departure: '07:00',
    arrival: '07:45',
    duration: '45 min',
    status: 'boarding',
    platform: 'Platform 1',
    occupancy: 'high',
    fare: 25,
    seats: { available: 8, total: 50 }
  },
  {
    id: 'KM003',
    from: 'Aluva',
    to: 'Thykoodam',
    departure: '07:30',
    arrival: '08:15',
    duration: '45 min',
    status: 'on-time',
    platform: 'Platform 1',
    occupancy: 'medium',
    fare: 30,
    seats: { available: 25, total: 50 }
  },
  {
    id: 'KM004',
    from: 'Aluva',
    to: 'Thykoodam',
    departure: '08:00',
    arrival: '08:45',
    duration: '45 min',
    status: 'on-time',
    platform: 'Platform 1',
    occupancy: 'low',
    fare: 25,
    seats: { available: 42, total: 50 }
  }
];

export default function BookTicketsPage() {
  const [currentStep, setCurrentStep] = useState<'search' | 'results' | 'summary' | 'payment' | 'confirmation'>('search');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [journeyForm, setJourneyForm] = useState<JourneyForm>({
    fromStation: '',
    toStation: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    passengers: 1
  });
  const [selectedTrain, setSelectedTrain] = useState<TrainResult | null>(null);
  const [fromSearch, setFromSearch] = useState<string>('');
  const [toSearch, setToSearch] = useState<string>('');
  const [showFromDropdown, setShowFromDropdown] = useState<boolean>(false);
  const [showToDropdown, setShowToDropdown] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredFromStations = stations.filter(station => 
    station.name.toLowerCase().includes(fromSearch.toLowerCase()) ||
    station.code.toLowerCase().includes(fromSearch.toLowerCase())
  );

  const filteredToStations = stations.filter(station => 
    station.name.toLowerCase().includes(toSearch.toLowerCase()) ||
    station.code.toLowerCase().includes(toSearch.toLowerCase())
  );

  const getOccupancyColor = (occupancy: string) => {
    switch (occupancy) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-time': return '#10B981';
      case 'delayed': return '#F59E0B';
      case 'boarding': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const calculateCO2Saved = (distance: number, passengers: number) => {
    // Approximate CO2 savings: 0.2kg per km per person compared to car
    return (distance * 0.2 * passengers).toFixed(1);
  };

  const handleSwapStations = () => {
    const temp = journeyForm.fromStation;
    setJourneyForm(prev => ({
      ...prev,
      fromStation: prev.toStation,
      toStation: temp
    }));
  };

  const handleFindTrains = () => {
    if (journeyForm.fromStation && journeyForm.toStation) {
      setCurrentStep('results');
    }
  };

  const handleSelectTrain = (train: TrainResult) => {
    setSelectedTrain(train);
    setCurrentStep('summary');
  };

  const handleProceedToPayment = () => {
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = () => {
    setCurrentStep('confirmation');
  };

  const handlePlanAnotherJourney = () => {
    setCurrentStep('search');
    setJourneyForm({
      fromStation: '',
      toStation: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      passengers: 1
    });
    setSelectedTrain(null);
  };

  // Journey Selection Form
  if (currentStep === 'search') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={styles.headerContent}
          >
            <h1 className={styles.title}>Plan Your Journey</h1>
            <p className={styles.subtitle}>
              Find the best metro routes and book your tickets instantly
            </p>
            <div className={styles.liveIndicator}>
              <FaWifi className={styles.liveIcon} />
              <span>Live Updates</span>
              <span className={styles.currentTime}>{currentTime}</span>
            </div>
          </motion.div>
        </div>

        <div className={styles.content}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={styles.section}
          >
            <Card variant="elevated" className={styles.journeyFormCard}>
              <h3 className={styles.sectionTitle}>Journey Details</h3>
              
              <div className={styles.stationSelection}>
                <div className={styles.stationInput}>
                  <label className={styles.label}>From Station</label>
                  <div className={styles.dropdownContainer}>
                    <input
                      type="text"
                      placeholder="Search station..."
                      value={fromSearch}
                      onChange={(e) => {
                        setFromSearch(e.target.value);
                        setShowFromDropdown(true);
                      }}
                      onFocus={() => setShowFromDropdown(true)}
                      className={styles.stationInputField}
                    />
                    {showFromDropdown && (
                      <div className={styles.dropdown}>
                        {filteredFromStations.map((station) => (
                          <div
                            key={station.id}
                            className={styles.dropdownItem}
                            onClick={() => {
                              setJourneyForm(prev => ({ ...prev, fromStation: station.name }));
                              setFromSearch(station.name);
                              setShowFromDropdown(false);
                            }}
                          >
                            <span className={styles.stationName}>{station.name}</span>
                            <span className={styles.stationCode}>{station.code}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button className={styles.swapButton} onClick={handleSwapStations}>
                  <FaExchangeAlt />
                </button>

                <div className={styles.stationInput}>
                  <label className={styles.label}>To Station</label>
                  <div className={styles.dropdownContainer}>
                    <input
                      type="text"
                      placeholder="Search station..."
                      value={toSearch}
                      onChange={(e) => {
                        setToSearch(e.target.value);
                        setShowToDropdown(true);
                      }}
                      onFocus={() => setShowToDropdown(true)}
                      className={styles.stationInputField}
                    />
                    {showToDropdown && (
                      <div className={styles.dropdown}>
                        {filteredToStations.map((station) => (
                          <div
                            key={station.id}
                            className={styles.dropdownItem}
                            onClick={() => {
                              setJourneyForm(prev => ({ ...prev, toStation: station.name }));
                              setToSearch(station.name);
                              setShowToDropdown(false);
                            }}
                          >
                            <span className={styles.stationName}>{station.name}</span>
                            <span className={styles.stationCode}>{station.code}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.dateTimeSelection}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Travel Date</label>
                  <div className={styles.dateTimeInput}>
                    <FaCalendarAlt className={styles.inputIcon} />
                    <input
                      type="date"
                      value={journeyForm.date}
                      onChange={(e) => setJourneyForm(prev => ({ ...prev, date: e.target.value }))}
                      className={styles.dateInput}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Preferred Time</label>
                  <div className={styles.dateTimeInput}>
                    <FaClock className={styles.inputIcon} />
                    <input
                      type="time"
                      value={journeyForm.time}
                      onChange={(e) => setJourneyForm(prev => ({ ...prev, time: e.target.value }))}
                      className={styles.timeInput}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Passengers</label>
                  <div className={styles.passengerSelector}>
                    <FaUser className={styles.inputIcon} />
                    <select
                      value={journeyForm.passengers}
                      onChange={(e) => setJourneyForm(prev => ({ ...prev, passengers: parseInt(e.target.value) }))}
                      className={styles.passengerSelect}
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleFindTrains}
                disabled={!journeyForm.fromStation || !journeyForm.toStation}
                className={styles.findTrainsButton}
              >
                <FaSearch className={styles.buttonIcon} />
                Find Trains
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Train Results
  if (currentStep === 'results') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={styles.headerContent}
          >
            <Button
              variant="ghost"
              onClick={() => setCurrentStep('search')}
              className={styles.backButton}
            >
              <FaArrowLeft />
              Back to Search
            </Button>
            <h1 className={styles.title}>Available Trains</h1>
            <p className={styles.subtitle}>
              {journeyForm.fromStation} → {journeyForm.toStation} • {new Date(journeyForm.date).toLocaleDateString()}
            </p>
          </motion.div>
        </div>

        <div className={styles.content}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={styles.section}
          >
            <div className={styles.trainResults}>
              {mockTrainResults.map((train, index) => (
                <motion.div
                  key={train.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={styles.trainCard}
                  onClick={() => handleSelectTrain(train)}
                >
                  <Card variant="elevated" className={styles.trainResultCard}>
                    <div className={styles.trainHeader}>
                      <div className={styles.trainInfo}>
                        <FaTrain className={styles.trainIcon} />
                        <span className={styles.trainId}>{train.id}</span>
                        <div 
                          className={styles.status}
                          style={{ color: getStatusColor(train.status) }}
                        >
                          {train.status.replace('-', ' ').toUpperCase()}
                        </div>
                      </div>
                      <div className={styles.fare}>
                        ₹{train.fare}
                        <span className={styles.fareLabel}>per person</span>
                      </div>
                    </div>

                    <div className={styles.routeInfo}>
                      <div className={styles.station}>
                        <FaMapMarkerAlt className={styles.stationIcon} />
                        <span className={styles.stationName}>{train.from}</span>
                        <span className={styles.departureTime}>{train.departure}</span>
                      </div>
                      <div className={styles.duration}>
                        <FaClock className={styles.clockIcon} />
                        <span>{train.duration}</span>
                      </div>
                      <div className={styles.station}>
                        <FaMapMarkerAlt className={styles.stationIcon} />
                        <span className={styles.stationName}>{train.to}</span>
                        <span className={styles.arrivalTime}>{train.arrival}</span>
                      </div>
                    </div>

                    <div className={styles.trainDetails}>
                      <div className={styles.occupancy}>
                        <FaUsers className={styles.occupancyIcon} />
                        <span 
                          className={styles.occupancyStatus}
                          style={{ color: getOccupancyColor(train.occupancy) }}
                        >
                          {train.occupancy.toUpperCase()} OCCUPANCY
                        </span>
                        <span className={styles.seatsAvailable}>
                          {train.seats.available} seats available
                        </span>
                      </div>
                      <div className={styles.platform}>
                        Platform {train.platform.split(' ')[1]}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Ticket Summary
  if (currentStep === 'summary' && selectedTrain) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={styles.headerContent}
          >
            <Button
              variant="ghost"
              onClick={() => setCurrentStep('results')}
              className={styles.backButton}
            >
              <FaArrowLeft />
              Back to Results
            </Button>
            <h1 className={styles.title}>Ticket Summary</h1>
            <p className={styles.subtitle}>Review your journey details before payment</p>
          </motion.div>
        </div>

        <div className={styles.content}>
          <div className={styles.summaryGrid}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={styles.summaryCard}
            >
              <Card variant="elevated" className={styles.ticketSummaryCard}>
                <h3 className={styles.sectionTitle}>Journey Details</h3>
                
                <div className={styles.journeySummary}>
                  <div className={styles.routeSummary}>
                    <div className={styles.station}>
                      <FaMapMarkerAlt className={styles.stationIcon} />
                      <span>{selectedTrain.from}</span>
                      <span className={styles.time}>{selectedTrain.departure}</span>
                    </div>
                    <div className={styles.duration}>
                      <FaClock className={styles.clockIcon} />
                      <span>{selectedTrain.duration}</span>
                    </div>
                    <div className={styles.station}>
                      <FaMapMarkerAlt className={styles.stationIcon} />
                      <span>{selectedTrain.to}</span>
                      <span className={styles.time}>{selectedTrain.arrival}</span>
                    </div>
                  </div>

                  <div className={styles.trainDetails}>
                    <div className={styles.detailRow}>
                      <span>Train ID:</span>
                      <span>{selectedTrain.id}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Date:</span>
                      <span>{new Date(journeyForm.date).toLocaleDateString()}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Platform:</span>
                      <span>{selectedTrain.platform}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Passengers:</span>
                      <span>{journeyForm.passengers}</span>
                    </div>
                  </div>

                  <div className={styles.fareBreakdown}>
                    <div className={styles.fareRow}>
                      <span>Base Fare (×{journeyForm.passengers}):</span>
                      <span>₹{selectedTrain.fare * journeyForm.passengers}</span>
                    </div>
                    <div className={styles.fareRow}>
                      <span>Service Fee:</span>
                      <span>₹5</span>
                    </div>
                    <div className={styles.fareRowTotal}>
                      <span>Total Amount:</span>
                      <span>₹{(selectedTrain.fare * journeyForm.passengers) + 5}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className={styles.ecoCard}
            >
              <Card variant="elevated" className={styles.ecoMeterCard}>
                <h3 className={styles.sectionTitle}>
                  <FaLeaf className={styles.ecoIcon} />
                  Eco Impact
                </h3>
                
                <div className={styles.ecoStats}>
                  <div className={styles.co2Saved}>
                    <span className={styles.co2Amount}>
                      {calculateCO2Saved(25, journeyForm.passengers)} kg
                    </span>
                    <span className={styles.co2Label}>CO₂ Saved</span>
                  </div>
                  
                  <div className={styles.ecoBenefits}>
                    <div className={styles.benefit}>
                      <FaLeaf className={styles.benefitIcon} />
                      <span>Reduced carbon footprint</span>
                    </div>
                    <div className={styles.benefit}>
                      <FaUsers className={styles.benefitIcon} />
                      <span>Less traffic congestion</span>
                    </div>
                    <div className={styles.benefit}>
                      <FaClock className={styles.benefitIcon} />
                      <span>Faster commute time</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={styles.proceedSection}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={handleProceedToPayment}
              className={styles.proceedButton}
            >
              <FaCreditCard className={styles.buttonIcon} />
              Proceed to Payment
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Payment Section
  if (currentStep === 'payment') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={styles.headerContent}
          >
            <Button
              variant="ghost"
              onClick={() => setCurrentStep('summary')}
              className={styles.backButton}
            >
              <FaArrowLeft />
              Back to Summary
            </Button>
            <h1 className={styles.title}>Payment</h1>
            <p className={styles.subtitle}>Choose your preferred payment method</p>
          </motion.div>
        </div>

        <div className={styles.content}>
          <div className={styles.paymentGrid}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={styles.paymentMethods}
            >
              <Card variant="elevated" className={styles.paymentCard}>
                <h3 className={styles.sectionTitle}>Payment Methods</h3>
                
                <div className={styles.paymentOptions}>
                  <div className={styles.paymentOption}>
                    <FaMobile className={styles.paymentIcon} />
                    <div className={styles.paymentInfo}>
                      <span className={styles.paymentName}>UPI</span>
                      <span className={styles.paymentDesc}>Pay with UPI apps</span>
                    </div>
                  </div>
                  
                  <div className={styles.paymentOption}>
                    <FaCreditCard className={styles.paymentIcon} />
                    <div className={styles.paymentInfo}>
                      <span className={styles.paymentName}>Credit/Debit Card</span>
                      <span className={styles.paymentDesc}>Visa, Mastercard, RuPay</span>
                    </div>
                  </div>
                  
                  <div className={styles.paymentOption}>
                    <FaWallet className={styles.paymentIcon} />
                    <div className={styles.paymentInfo}>
                      <span className={styles.paymentName}>Digital Wallets</span>
                      <span className={styles.paymentDesc}>Paytm, PhonePe, Google Pay</span>
                    </div>
                  </div>
                  
                  <div className={styles.paymentOption}>
                    <FaTicketAlt className={styles.paymentIcon} />
                    <div className={styles.paymentInfo}>
                      <span className={styles.paymentName}>Metro Smart Card</span>
                      <span className={styles.paymentDesc}>Recharge your card</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className={styles.paymentSummary}
            >
              <Card variant="elevated" className={styles.paymentSummaryCard}>
                <h3 className={styles.sectionTitle}>Payment Summary</h3>
                
                <div className={styles.paymentDetails}>
                  <div className={styles.paymentRow}>
                    <span>Ticket Amount:</span>
                    <span>₹{selectedTrain ? selectedTrain.fare * journeyForm.passengers : 0}</span>
                  </div>
                  <div className={styles.paymentRow}>
                    <span>Service Fee:</span>
                    <span>₹5</span>
                  </div>
                  <div className={styles.paymentRowTotal}>
                    <span>Total Amount:</span>
                    <span>₹{selectedTrain ? (selectedTrain.fare * journeyForm.passengers) + 5 : 0}</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handlePaymentSuccess}
                  className={styles.payButton}
                >
                  <FaCheckCircle className={styles.buttonIcon} />
                  Pay Now
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Ticket Confirmation
  if (currentStep === 'confirmation' && selectedTrain) {
    return (
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={styles.confirmationContainer}
        >
          <Card variant="elevated" className={styles.confirmationCard}>
            <div className={styles.confirmationHeader}>
              <div className={styles.successIcon}>
                <FaCheckCircle />
              </div>
              <h2 className={styles.confirmationTitle}>Booking Confirmed!</h2>
              <p className={styles.confirmationMessage}>
                Your metro ticket has been booked successfully. Show this QR code at the station.
              </p>
            </div>

            <div className={styles.qrTicket}>
              <div className={styles.qrCode}>
                <FaQrcode className={styles.qrIcon} />
                <div className={styles.qrText}>QR Code</div>
              </div>
              
              <div className={styles.ticketDetails}>
                <div className={styles.ticketHeader}>
                  <span className={styles.ticketId}>Ticket #KM{Date.now().toString().slice(-6)}</span>
                  <span className={styles.ticketDate}>{new Date().toLocaleDateString()}</span>
                </div>
                
                <div className={styles.ticketRoute}>
                  <div className={styles.routeStation}>
                    <span className={styles.stationName}>{selectedTrain.from}</span>
                    <span className={styles.stationTime}>{selectedTrain.departure}</span>
                  </div>
                  <div className={styles.routeArrow}>
                    <FaArrowRight />
                  </div>
                  <div className={styles.routeStation}>
                    <span className={styles.stationName}>{selectedTrain.to}</span>
                    <span className={styles.stationTime}>{selectedTrain.arrival}</span>
                  </div>
                </div>
                
                <div className={styles.ticketInfo}>
                  <div className={styles.infoRow}>
                    <span>Train:</span>
                    <span>{selectedTrain.id}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Passengers:</span>
                    <span>{journeyForm.passengers}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Platform:</span>
                    <span>{selectedTrain.platform}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Amount:</span>
                    <span>₹{(selectedTrain.fare * journeyForm.passengers) + 5}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.confirmationActions}>
              <Button
                variant="outline"
                size="lg"
                className={styles.downloadButton}
              >
                <FaDownload className={styles.buttonIcon} />
                Download Ticket
              </Button>
              
              <Button
                variant="primary"
                size="lg"
                onClick={handlePlanAnotherJourney}
                className={styles.planAnotherButton}
              >
                <FaTicketAlt className={styles.buttonIcon} />
                Plan Another Journey
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return null;
}