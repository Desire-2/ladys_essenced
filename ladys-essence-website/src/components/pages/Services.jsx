import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ExternalLink, Smartphone, Globe, Download, Construction, ArrowRight, CheckCircle, Users, BookOpen, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

const Services = () => {
  const mainServices = [
    {
      title: "Web Platform",
      description: "Our comprehensive digital platform provides advanced health tracking, personalized insights, and educational resources for smartphones and computers.",
      icon: Globe,
      status: "Live",
      statusColor: "bg-green-500",
      link: "https://ladys-essenced.vercel.app",
      external: true,
      features: [
        "Advanced menstrual cycle tracking",
        "Pregnancy nutrition guidance", 
        "AI-driven health insights",
        "Family health dashboards",
        "Community resources",
        "Multilingual content"
      ]
    },
    {
      title: "USSD Service",
      description: "Accessible health information and services for basic phones through simple USSD codes. No internet required.",
      icon: Smartphone,
      status: "Live",
      statusColor: "bg-green-500",
      link: "/ussd-simulator",
      external: false,
      features: [
        "Works on any mobile phone",
        "No internet connection needed",
        "Simple menu navigation",
        "Health tips and reminders",
        "Emergency contact information",
        "Available in local languages"
      ]
    },
    {
      title: "Mobile App",
      description: "Native mobile application with offline capabilities, designed specifically for rural communities with limited connectivity.",
      icon: Download,
      status: "In Development",
      statusColor: "bg-orange-500",
      link: "#",
      external: false,
      features: [
        "Offline functionality",
        "Push notifications for health reminders",
        "Photo-based health tracking",
        "Community chat features",
        "Emergency SOS functionality",
        "Data synchronization when online"
      ]
    }
  ];

  const additionalServices = [
    {
      title: "Educational Resources",
      description: "Culturally sensitive educational materials on menstrual health, pregnancy care, and women's wellness.",
      icon: BookOpen,
      link: "/resources"
    },
    {
      title: "Community Support",
      description: "Local workshops, peer support groups, and community health worker training programs.",
      icon: Users,
      link: "/impact"
    },
    {
      title: "GBV Prevention",
      description: "Violence recognition, reporting mechanisms, and support pathways for survivors.",
      icon: Shield,
      link: "/resources"
    }
  ];

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
              Our <span className="text-gradient">Services</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Comprehensive digital and community-based solutions designed to empower women and girls 
              with accessible health information and support.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Services */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="space-y-12">
            {mainServices.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    <CardHeader className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-primary p-3 rounded-full">
                          <service.icon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl">{service.title}</CardTitle>
                          <Badge className={`${service.statusColor} text-white mt-2`}>
                            {service.status}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="text-base mb-6">
                        {service.description}
                      </CardDescription>
                      
                      {service.status === "In Development" ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-orange-600">
                            <Construction className="h-5 w-5" />
                            <span className="font-medium">Currently in Development</span>
                          </div>
                          <p className="text-muted-foreground">
                            Our mobile app is being developed with input from rural communities to ensure 
                            it meets their specific needs. Expected launch: Q2 2025.
                          </p>
                          <Button disabled className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Coming Soon
                          </Button>
                        </div>
                      ) : service.external ? (
                        <Button asChild className="w-full">
                          <a href={service.link} target="_blank" rel="noopener noreferrer">
                            Access Platform
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <Button asChild className="w-full">
                          <Link to={service.link}>
                            Try Service
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </CardHeader>

                    <CardContent className="p-8">
                      <h4 className="font-semibold text-lg mb-4 text-foreground">Key Features</h4>
                      <ul className="space-y-3">
                        {service.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Services */}
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
              Additional <span className="text-gradient">Support</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Beyond technology, we provide comprehensive community-based support and resources
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {additionalServices.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full card-hover">
                  <CardHeader className="text-center">
                    <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <service.icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="mb-6">
                      {service.description}
                    </CardDescription>
                    <Button asChild variant="outline" size="sm">
                      <Link to={service.link}>
                        Learn More <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Access */}
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
              How to <span className="text-gradient">Access</span> Our Services
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Multiple ways to access our services, designed for different technology levels and needs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-primary p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Web Platform</h3>
              <p className="text-muted-foreground mb-4">
                Visit our website on any smartphone or computer with internet access
              </p>
              <Button asChild variant="outline" size="sm">
                <a href="https://ladys-essenced.vercel.app" target="_blank" rel="noopener noreferrer">
                  Visit Platform
                </a>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-secondary p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">USSD Service</h3>
              <p className="text-muted-foreground mb-4">
                Dial *384*70975# on any mobile phone to access our services
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/ussd-simulator">
                  Try Simulator
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-accent p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community Centers</h3>
              <p className="text-muted-foreground mb-4">
                Visit local community centers and health posts for in-person support
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/contact">
                  Find Locations
                </Link>
              </Button>
            </motion.div>
          </div>
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
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Choose the service that works best for you and join thousands of women 
              already benefiting from our comprehensive health support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <a href="https://ladys-essenced.vercel.app" target="_blank" rel="noopener noreferrer">
                  Access Web Platform
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                <Link to="/ussd-simulator">Try USSD Service</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Services;

