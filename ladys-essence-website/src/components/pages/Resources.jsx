import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Download, Video, FileText, Shield, Heart, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

const Resources = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const resourceCategories = [
    {
      title: "Menstrual Health",
      icon: Heart,
      color: "bg-pink-500",
      resources: [
        {
          title: "Understanding Your Menstrual Cycle",
          type: "PDF Guide",
          description: "Comprehensive guide to menstrual health and cycle tracking",
          language: "English/Kinyarwanda",
          size: "2.5 MB"
        },
        {
          title: "Menstrual Hygiene Best Practices",
          type: "Video Series",
          description: "Step-by-step videos on proper menstrual hygiene",
          language: "Kinyarwanda",
          duration: "15 minutes"
        },
        {
          title: "Myth-Busting: Menstruation Facts",
          type: "Infographic",
          description: "Visual guide debunking common menstruation myths",
          language: "English/Kinyarwanda",
          size: "1.2 MB"
        }
      ]
    },
    {
      title: "Pregnancy Care",
      icon: Heart,
      color: "bg-green-500",
      resources: [
        {
          title: "Nutrition During Pregnancy",
          type: "PDF Guide",
          description: "Essential nutrition information for healthy pregnancy",
          language: "English/Kinyarwanda",
          size: "3.1 MB"
        },
        {
          title: "Vaccination Schedule",
          type: "Chart",
          description: "Complete vaccination timeline for pregnant women",
          language: "Kinyarwanda",
          size: "800 KB"
        },
        {
          title: "Warning Signs During Pregnancy",
          type: "Quick Reference",
          description: "When to seek immediate medical attention",
          language: "English/Kinyarwanda",
          size: "1.5 MB"
        }
      ]
    },
    {
      title: "Violence Prevention",
      icon: Shield,
      color: "bg-red-500",
      resources: [
        {
          title: "Recognizing Gender-Based Violence",
          type: "Educational Material",
          description: "Understanding different forms of GBV and warning signs",
          language: "English/Kinyarwanda",
          size: "2.8 MB"
        },
        {
          title: "Support Resources Directory",
          type: "Contact List",
          description: "Emergency contacts and support organizations",
          language: "Kinyarwanda",
          size: "500 KB"
        },
        {
          title: "Safety Planning Guide",
          type: "Interactive Tool",
          description: "Step-by-step safety planning for at-risk individuals",
          language: "English/Kinyarwanda",
          size: "1.8 MB"
        }
      ]
    },
    {
      title: "Community Health",
      icon: BookOpen,
      color: "bg-blue-500",
      resources: [
        {
          title: "Community Health Worker Training",
          type: "Training Manual",
          description: "Comprehensive training materials for CHWs",
          language: "English/Kinyarwanda",
          size: "5.2 MB"
        },
        {
          title: "Health Education Toolkit",
          type: "Resource Pack",
          description: "Materials for conducting community health sessions",
          language: "Kinyarwanda",
          size: "4.1 MB"
        },
        {
          title: "Cultural Sensitivity Guidelines",
          type: "Best Practices",
          description: "Guidelines for culturally appropriate health education",
          language: "English/Kinyarwanda",
          size: "1.9 MB"
        }
      ]
    }
  ];

  const faqs = [
    {
      question: "How do I access the USSD service?",
      answer: "Simply dial *384*70975# from any mobile phone in Rwanda. The service works on all networks and doesn't require internet connection. Follow the menu prompts to access health information and resources."
    },
    {
      question: "Is the service free to use?",
      answer: "Our educational content and basic services are free. Standard USSD charges from your mobile network operator may apply. We're working with partners to make the service completely free in the future."
    },
    {
      question: "What languages are available?",
      answer: "Our services are available in English and Kinyarwanda. We're working to add more local languages based on community needs and feedback."
    },
    {
      question: "How can I get physical supplies like sanitary pads?",
      answer: "Contact your local community health worker or visit one of our partner health centers. You can also reach out to us directly at contact@laddyseccense.org to find the nearest distribution point."
    },
    {
      question: "Is my personal information kept private?",
      answer: "Yes, we take privacy very seriously. All personal health information is encrypted and stored securely. We never share individual data without explicit consent."
    },
    {
      question: "Can men and boys access these resources?",
      answer: "Absolutely! We encourage men and boys to learn about women's health to become better supporters and advocates. Many of our educational materials are designed for the whole family."
    },
    {
      question: "How do I become a community health worker?",
      answer: "Contact us through our website or phone number to learn about CHW training opportunities in your area. We provide comprehensive training and ongoing support."
    },
    {
      question: "What should I do in a health emergency?",
      answer: "For immediate medical emergencies, contact your nearest health center or call emergency services. Our platform includes emergency contact information for each district."
    },
    {
      question: "How can my school partner with Lady's Essence?",
      answer: "We'd love to partner with your school! Contact us at contact@laddyseccense.org to discuss how we can integrate health education into your curriculum and support your students."
    },
    {
      question: "Are there resources for parents and guardians?",
      answer: "Yes, we have specific resources to help parents and guardians support their daughters through puberty and beyond. These include conversation guides and educational materials."
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
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
              Educational <span className="text-gradient">Resources</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Access comprehensive, culturally sensitive educational materials on women's health, 
              pregnancy care, and violence prevention.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Resource Categories */}
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
              Resource <span className="text-gradient">Categories</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our comprehensive collection of educational materials organized by topic
            </p>
          </motion.div>

          <div className="space-y-12">
            {resourceCategories.map((category, categoryIndex) => (
              <motion.div
                key={categoryIndex}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`${category.color} p-3 rounded-full`}>
                    <category.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{category.title}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {category.resources.map((resource, resourceIndex) => (
                    <Card key={resourceIndex} className="card-hover">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">{resource.type}</Badge>
                          <div className="flex items-center gap-1">
                            {resource.type.includes('Video') ? (
                              <Video className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-lg">{resource.title}</CardTitle>
                        <CardDescription>{resource.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Language:</span>
                            <span className="font-medium">{resource.language}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {resource.size ? 'Size:' : 'Duration:'}
                            </span>
                            <span className="font-medium">
                              {resource.size || resource.duration}
                            </span>
                          </div>
                        </div>
                        <Button className="w-full" variant="outline">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Access Tools */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Quick <span className="text-gradient">Access</span> Tools
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Essential tools and resources for immediate access to health information
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="text-center card-hover">
                <CardContent className="p-8">
                  <div className="bg-primary p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Emergency Contacts</h3>
                  <p className="text-muted-foreground mb-4">
                    Quick access to emergency health services and support hotlines
                  </p>
                  <Button variant="outline" className="w-full">
                    View Contacts
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="text-center card-hover">
                <CardContent className="p-8">
                  <div className="bg-secondary p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Health Calculator</h3>
                  <p className="text-muted-foreground mb-4">
                    Calculate due dates, track cycles, and monitor health metrics
                  </p>
                  <Button variant="outline" className="w-full">
                    Use Calculator
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="text-center card-hover">
                <CardContent className="p-8">
                  <div className="bg-accent p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Support Directory</h3>
                  <p className="text-muted-foreground mb-4">
                    Find local support services and community health workers
                  </p>
                  <Button variant="outline" className="w-full">
                    Find Support
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
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
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Find answers to common questions about our services and women's health
            </p>
            
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-4">
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className="cursor-pointer" onClick={() => toggleFaq(index)}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground pr-4">{faq.question}</h3>
                      {expandedFaq === index ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    {expandedFaq === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t border-border"
                      >
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No FAQs found matching your search.</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact for More Resources */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Need More <span className="text-gradient">Information</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Can't find what you're looking for? Our team is here to help you access 
              the resources and information you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                Contact Our Team
              </Button>
              <Button size="lg" variant="outline">
                Request Resources
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Resources;

