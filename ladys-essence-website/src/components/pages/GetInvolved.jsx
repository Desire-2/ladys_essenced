import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Handshake, Gift, DollarSign, ArrowRight, CheckCircle, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const GetInvolved = () => {
  const donationImpacts = [
    {
      amount: 25,
      title: "Hygiene Essentials",
      description: "Provides essential hygiene kits (soap, cleaning materials) for 5 families.",
      icon: Gift,
      color: "bg-blue-500"
    },
    {
      amount: 50,
      title: "Keep Girls in School", 
      description: "Supplies reusable sanitary pads for 10 girls, keeping them in school for months.",
      icon: Users,
      color: "bg-green-500"
    },
    {
      amount: 100,
      title: "Community Education",
      description: "Supports educational workshops on menstrual health and GBV prevention for a whole village group.",
      icon: Heart,
      color: "bg-purple-500"
    },
    {
      amount: 250,
      title: "Digital Access",
      description: "Contributes to the development and accessibility of our USSD platform for women without smartphones.",
      icon: DollarSign,
      color: "bg-orange-500"
    },
    {
      amount: 500,
      title: "Comprehensive Support Package",
      description: "Provides comprehensive support (education, materials, platform access) for a small community cohort.",
      icon: Handshake,
      color: "bg-red-500"
    },
    {
      amount: 1000,
      title: "Complete Support Package",
      description: "Provides digital tools (smartphone and non-smartphone) to 20 poor families and comprehensive support for a community cohort.",
      icon: Users,
      color: "bg-indigo-500"
    }
  ];

  const partnershipTypes = [
    {
      title: "Healthcare Organizations",
      description: "Partner with us to expand health education and integrate our programs into existing healthcare systems.",
      benefits: [
        "Joint program development",
        "Shared resources and expertise",
        "Expanded community reach",
        "Professional development opportunities"
      ]
    },
    {
      title: "Educational Institutions",
      description: "Collaborate with schools and universities to integrate menstrual health education into curricula.",
      benefits: [
        "Curriculum development support",
        "Teacher training programs",
        "Student health improvement",
        "Research collaboration opportunities"
      ]
    },
    {
      title: "Technology Companies",
      description: "Help us develop and improve our digital platforms to reach more women and girls.",
      benefits: [
        "Technical expertise sharing",
        "Platform development support",
        "Innovation opportunities",
        "Social impact visibility"
      ]
    },
    {
      title: "Community Organizations",
      description: "Work with local NGOs and community groups to implement grassroots programs.",
      benefits: [
        "Local knowledge integration",
        "Community trust building",
        "Sustainable program implementation",
        "Cultural sensitivity enhancement"
      ]
    }
  ];

  const volunteerOpportunities = [
    {
      role: "Community Health Educator",
      description: "Lead workshops and educational sessions in rural communities",
      commitment: "4-6 hours per week",
      skills: "Health background preferred, strong communication skills"
    },
    {
      role: "Content Creator",
      description: "Develop educational materials and social media content",
      commitment: "2-4 hours per week",
      skills: "Writing, design, or multimedia skills"
    },
    {
      role: "Technology Volunteer",
      description: "Support platform development and technical improvements",
      commitment: "Flexible",
      skills: "Programming, web development, or mobile app development"
    },
    {
      role: "Program Coordinator",
      description: "Help coordinate community programs and partnerships",
      commitment: "6-8 hours per week",
      skills: "Project management, organizational skills"
    }
  ];

  const waysToDonate = [
    {
      method: "One-time Donation",
      description: "Make a single donation to support our immediate needs",
      action: "Donate Now"
    },
    {
      method: "Monthly Giving",
      description: "Become a monthly supporter for sustained impact",
      action: "Set Up Monthly"
    },
    {
      method: "Corporate Sponsorship",
      description: "Partner with us as a corporate sponsor",
      action: "Contact Us"
    },
    {
      method: "In-Kind Donations",
      description: "Donate supplies, equipment, or services",
      action: "Learn More"
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
              Get <span className="text-gradient">Involved</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Join us in empowering women and girls across Rwanda. Every donation, partnership, 
              and shared story brings us closer to a world where no woman is held back by her biology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <Heart className="mr-2 h-5 w-5" />
                Donate Now
              </Button>
              <Button size="lg" variant="outline">
                <Handshake className="mr-2 h-5 w-5" />
                Become a Partner
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Donation Impact */}
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
              Your Donation's <span className="text-gradient">Impact</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See exactly how your contribution makes a difference in the lives of women and girls
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donationImpacts.map((impact, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full card-hover">
                  <CardHeader className="text-center">
                    <div className={`${impact.color} p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center`}>
                      <impact.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-primary mb-2">${impact.amount}</div>
                    <CardTitle className="text-xl">{impact.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="mb-4">
                      {impact.description}
                    </CardDescription>
                    <Button className="w-full">
                      Donate ${impact.amount}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-muted-foreground mb-6">
              Your support fuels our ability to reach the growing waiting list and expand our vital services.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {waysToDonate.map((way, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">{way.method}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{way.description}</p>
                    <Button variant="outline" size="sm">
                      {way.action}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Partnership Opportunities */}
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
              Partnership <span className="text-gradient">Opportunities</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Collaborate with us to amplify our impact and create sustainable change
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {partnershipTypes.map((partnership, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-xl">{partnership.title}</CardTitle>
                    <CardDescription>{partnership.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold mb-3 text-foreground">Partnership Benefits:</h4>
                    <ul className="space-y-2">
                      {partnership.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                          <span className="text-muted-foreground text-sm">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full mt-4" variant="outline">
                      Learn More <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Volunteer Opportunities */}
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
              Volunteer <span className="text-gradient">Opportunities</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Use your skills and passion to directly impact women's lives in Rwanda
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {volunteerOpportunities.map((opportunity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-xl">{opportunity.role}</CardTitle>
                    <CardDescription>{opportunity.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Badge variant="secondary" className="mb-2">Time Commitment</Badge>
                        <p className="text-sm text-muted-foreground">{opportunity.commitment}</p>
                      </div>
                      <div>
                        <Badge variant="outline" className="mb-2">Required Skills</Badge>
                        <p className="text-sm text-muted-foreground">{opportunity.skills}</p>
                      </div>
                    </div>
                    <Button className="w-full mt-4">
                      Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact for Involvement */}
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
              Ready to <span className="text-gradient">Get Started</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Contact us to discuss how you can contribute to our mission
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="text-center card-hover">
                <CardContent className="p-6">
                  <div className="bg-primary p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Donate</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Make a financial contribution to support our programs
                  </p>
                  <Button className="w-full">
                    Donate Now
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
                <CardContent className="p-6">
                  <div className="bg-secondary p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Handshake className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Partner</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Collaborate with us as an organizational partner
                  </p>
                  <Button variant="outline" className="w-full">
                    Contact Us
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
                <CardContent className="p-6">
                  <div className="bg-accent p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Volunteer</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Contribute your time and skills to our mission
                  </p>
                  <Button variant="outline" className="w-full">
                    Apply Now
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4 text-foreground">Get in Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <a 
                      href="mailto:contact@laddyseccense.org" 
                      className="text-primary hover:underline"
                    >
                      contact@laddyseccense.org
                    </a>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <a 
                      href="tel:+250780784924" 
                      className="text-primary hover:underline"
                    >
                      +250 780 784 924
                    </a>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mt-4">
                  We'll respond within 24 hours to discuss how you can contribute to our mission.
                </p>
              </CardContent>
            </Card>
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
              Together, We Can Change Lives
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Every contribution, no matter the size, brings us closer to a world where 
              every woman and girl can reach her full potential.
            </p>
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              <Heart className="mr-2 h-5 w-5" />
              Start Making a Difference Today
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default GetInvolved;

