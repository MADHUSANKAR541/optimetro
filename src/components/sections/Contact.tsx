'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaClock,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube
} from 'react-icons/fa';
import styles from './Contact.module.scss';

const contactInfo = [
  {
    icon: <FaPhone />,
    title: 'Phone',
    details: ['+91 484 123 4567', '+91 484 123 4568'],
    description: '24/7 Customer Support'
  },
  {
    icon: <FaEnvelope />,
    title: 'Email',
    details: ['info@kochimetro.com', 'support@kochimetro.com'],
    description: 'We respond within 2 hours'
  },
  {
    icon: <FaMapMarkerAlt />,
    title: 'Address',
    details: ['Kochi Metro Rail Limited', 'Metro Bhavan, Kaloor', 'Kochi, Kerala 682017'],
    description: 'Visit our headquarters'
  },
  {
    icon: <FaClock />,
    title: 'Operating Hours',
    details: ['Monday - Sunday', '05:30 AM - 11:30 PM'],
    description: 'Metro services available'
  }
];

const socialLinks = [
  { icon: <FaFacebook />, name: 'Facebook', url: 'https://facebook.com/kochimetro' },
  { icon: <FaTwitter />, name: 'Twitter', url: 'https://twitter.com/kochimetro' },
  { icon: <FaInstagram />, name: 'Instagram', url: 'https://instagram.com/kochimetro' },
  { icon: <FaLinkedin />, name: 'LinkedIn', url: 'https://linkedin.com/company/kochimetro' },
  { icon: <FaYoutube />, name: 'YouTube', url: 'https://youtube.com/kochimetro' }
];

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  return (
    <section id="contact" className={styles.contact}>
      <div className={styles.container}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className={styles.header}
        >
          <h2 className={styles.title}>Get in Touch</h2>
          <p className={styles.subtitle}>
            Have questions, feedback, or need assistance? We're here to help you 
            with all your metro transportation needs.
          </p>
        </motion.div>

        <div className={styles.content}>
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className={styles.contactInfo}
          >
            <h3 className={styles.sectionTitle}>Contact Information</h3>
            <div className={styles.infoGrid}>
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={styles.infoCard}
                >
                  <div className={styles.infoIcon}>{info.icon}</div>
                  <h4 className={styles.infoTitle}>{info.title}</h4>
                  <div className={styles.infoDetails}>
                    {info.details.map((detail, idx) => (
                      <p key={idx} className={styles.infoDetail}>{detail}</p>
                    ))}
                  </div>
                  <p className={styles.infoDescription}>{info.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Social Links */}
            
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className={styles.contactForm}
          >
            <Card variant="elevated" className={styles.formCard}>
              <h3 className={styles.formTitle}>Send us a Message</h3>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.formLabel}>Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.formLabel}>Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="subject" className={styles.formLabel}>Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="message" className={styles.formLabel}>Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className={styles.formTextarea}
                    rows={5}
                    required
                  />
                </div>

                <Button type="submit" variant="primary" size="lg" className={styles.submitButton}>
                  Send Message
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className={styles.mapSection}
        >
        </motion.div>
      </div>
    </section>
  );
}
