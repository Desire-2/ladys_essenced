import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, Facebook, Twitter, Instagram, Linkedin, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  });

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      details: "contact@laddyseccense.org",
      description: "Send us an email and we'll respond within 24 hours",
      action: "mailto:contact@laddyseccense.org"
    },
    {
      icon: Phone,
      title: "Call Us",
      details: "+250 780 784 924",
      description: "Available Monday to Friday, 8 AM - 6 PM EAT",
      action: "tel:+250780784924"
    },
    {
      icon: MapPin,
      title: "Visit Us",
      details: "Kigali, Rwanda",
      description: "Schedule an appointment to visit our office",
      action: "#"
    },
    {
      icon: Clock,
      title: "Office Hours",
      details: "Mon - Fri: 8 AM - 6 PM",
      description: "East Africa Time (EAT)",
      action: "#"
    }
  ];

  const inquiryTypes = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'partnership', label: 'Partnership Opportunity' },
    { value: 'volunteer', label: 'Volunteer Application' },
    { value: 'donation', label: 'Donation Information' },
    { value: 'media', label: 'Media Inquiry' },
    { value: 'support', label: 'Technical Support' }
  ];

  const socialLinks = [
    { icon: Facebook, name: 'Facebook', url: '#' },
    { icon: Twitter, name: 'Twitter', url: '#' },
    { icon: Instagram, name: 'Instagram', url: '#' },
    { icon: Linkedin, name: 'LinkedIn', url: '#' }
  ];

  const officeLocations = [
    {
      name: "Main Office",
      address: "Kigali, Rwanda",
      description: "Our headquarters and main coordination center"
    },
    {
      name: "Community Centers",
      address: "30 Districts across Rwanda",
      description: "Local presence through partner community centers"
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    // Reset form or show success message
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Get in <span className="text-gradient">Touch</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              We'd love to hear from you. Whether you have questions, want to partner with us, 
              or need support, we're here to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Contact <span className="text-gradient">Information</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Multiple ways to reach us - choose what works best for you
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="text-center card-hover h-full">
                  <CardHeader>
                    <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <info.icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{info.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold text-foreground mb-2">{info.details}</p>
                    <CardDescription className="mb-4">{info.description}</CardDescription>
                    {info.action !== '#' && (
                      <Button asChild variant="outline" size="sm">
                        <a href={info.action}>
                          Contact
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form and Map */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Send Us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your.email@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Inquiry Type</Label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-border rounded-md bg-background"
                      >
                        {inquiryTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Brief subject of your message"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Tell us more about your inquiry..."
                        rows={5}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Office Locations and Social */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              {/* Office Locations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Our Locations</CardTitle>
                  <CardDescription>
                    Find us across Rwanda through our main office and community partners
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {officeLocations.map((location, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{location.name}</h4>
                        <p className="text-muted-foreground text-sm">{location.address}</p>
                        <p className="text-muted-foreground text-xs mt-1">{location.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Follow Us</CardTitle>
                  <CardDescription>
                    Stay connected with our latest updates and stories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {socialLinks.map((social, index) => (
                      <a
                        key={index}
                        href={social.url}
                        className="bg-primary/10 p-3 rounded-full hover:bg-primary/20 transition-colors"
                        aria-label={social.name}
                      >
                        <social.icon className="h-5 w-5 text-primary" />
                      </a>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-foreground">Quick Response</h4>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      We typically respond to all inquiries within 24 hours during business days. 
                      For urgent matters, please call us directly.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-red-500 p-2 rounded-full">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-red-800">Emergency Support</h4>
                  </div>
                  <p className="text-red-700 text-sm mb-3">
                    If you're experiencing a health emergency or need immediate support, 
                    please contact your local health center or emergency services.
                  </p>
                  <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                    Emergency Contacts
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Quick Links */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Before You <span className="text-gradient">Contact Us</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              You might find the answer to your question in our frequently asked questions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="outline">
                <a href="/resources#faq">
                  View FAQ
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="/resources">
                  Browse Resources
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 hero-gradient text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Let's Work Together
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Whether you're looking to partner with us, volunteer, or simply learn more 
              about our work, we're excited to connect with you.
            </p>
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              <Mail className="mr-2 h-5 w-5" />
              Start the Conversation
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Contact;

