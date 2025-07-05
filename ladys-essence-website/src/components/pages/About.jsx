import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Target, Award, BookOpen, Stethoscope, Code } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

// Import images
import teamImage from '../../assets/women-health-africa.jpg';
import missionImage from '../../assets/girls-education.jpg';

const About = () => {
  const teamMembers = [
    {
      name: "Desire Bikorimana",
      role: "Developer",
      initials: "DB",
      expertise: "Biology, conservation, and software engineering",
      icon: Code
    },
    {
      name: "Nina Joevanice Uwimpukwe",
      role: "Content Writer",
      initials: "NU",
      expertise: "Biology and health dietetics",
      icon: BookOpen
    },
    {
      name: "Delphine Iradukunda",
      role: "Content Writer", 
      initials: "DI",
      expertise: "Biology and health dietetics",
      icon: Stethoscope
    }
  ];

  const advisoryBoard = [
    {
      area: "Healthcare",
      description: "Medical professionals and public health experts"
    },
    {
      area: "Education",
      description: "Educational specialists and rural development experts"
    },
    {
      area: "Technology",
      description: "Digital development and accessibility specialists"
    }
  ];

  const values = [
    {
      icon: Heart,
      title: "Dignity",
      description: "Every woman and girl deserves to live with dignity, free from shame and stigma around natural biological processes."
    },
    {
      icon: Users,
      title: "Community",
      description: "We believe in the power of community support and culturally sensitive approaches to health education."
    },
    {
      icon: Target,
      title: "Accessibility",
      description: "Our solutions are designed to reach the most remote and underserved communities through multiple channels."
    },
    {
      icon: Award,
      title: "Empowerment",
      description: "We don't just provide information; we empower women and girls to take control of their health and futures."
    }
  ];

  const milestones = [
    {
      date: "April 2024",
      title: "Market Research",
      description: "Identified critical needs in rural Rwanda through community engagement"
    },
    {
      date: "July 2024", 
      title: "Team Assembly",
      description: "Built our core team of passionate experts in health, technology, and education"
    },
    {
      date: "August 2024",
      title: "MVP Launch",
      description: "Launched the first version of our platform and began community outreach"
    },
    {
      date: "November 2024",
      title: "600+ Waiting List",
      description: "Validated the need with over 600 individuals requesting our services"
    },
    {
      date: "Present",
      title: "30 Districts",
      description: "Expanded our presence across 30 districts in Rwanda"
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
              About <span className="text-gradient">Lady's Essence</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              We are a passionate team dedicated to breaking the cycle of silence, stigma, 
              and missed opportunities that affect millions of women and girls in rural Rwanda.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Our <span className="text-gradient">Mission</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                To empower women and girls in rural Rwanda through comprehensive health education, 
                tangible support, and accessible technology that breaks down barriers to information 
                and healthcare.
              </p>
              <h3 className="text-2xl font-bold mb-4 text-foreground">Our Vision</h3>
              <p className="text-lg text-muted-foreground mb-6">
                A world where no woman or girl is held back by her biology. Where every woman 
                has the knowledge, resources, and support she needs to thrive.
              </p>
              <div className="bg-primary/10 p-6 rounded-lg">
                <p className="text-primary font-semibold italic text-lg">
                  "When you empower a woman, you empower a generation."
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img 
                src={missionImage} 
                alt="Girls education and empowerment" 
                className="rounded-lg shadow-2xl w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-lg"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values */}
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
              Our <span className="text-gradient">Values</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do and every decision we make
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full text-center card-hover">
                  <CardHeader>
                    <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <value.icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{value.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team */}
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
              Meet Our <span className="text-gradient">Team</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Passionate experts driven by a shared commitment to women's health and empowerment
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="text-center card-hover">
                  <CardHeader>
                    <div className="bg-primary text-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                      {member.initials}
                    </div>
                    <CardTitle className="text-xl">{member.name}</CardTitle>
                    <Badge variant="secondary" className="mb-2">{member.role}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center mb-3">
                      <member.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardDescription>
                      Expertise in {member.expertise}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Advisory Board */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h3 className="text-2xl font-bold mb-6 text-foreground">Advisory Board</h3>
            <p className="text-muted-foreground mb-8">
              Expert support from professionals in healthcare, rural education, and digital development
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {advisoryBoard.map((board, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-lg mb-2 text-primary">{board.area}</h4>
                    <p className="text-muted-foreground text-sm">{board.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Journey */}
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
              Our <span className="text-gradient">Journey</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From identifying the need to building solutions that make a real difference
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-primary/20"></div>
              
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative flex items-center mb-8 ${
                    index % 2 === 0 ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8' : 'pl-8'}`}>
                    <Card className="card-hover">
                      <CardContent className="p-6">
                        <Badge className="mb-3">{milestone.date}</Badge>
                        <h3 className="font-semibold text-lg mb-2 text-foreground">
                          {milestone.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {milestone.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-4 border-white shadow-lg"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img 
                src={teamImage} 
                alt="Women health support in Africa" 
                className="rounded-lg shadow-2xl w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 to-transparent rounded-lg"></div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Our <span className="text-gradient">Approach</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                We believe in meeting women and girls where they are. Our strategy hinges on 
                deep community integration and culturally sensitive solutions.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Education First</h4>
                    <p className="text-muted-foreground text-sm">
                      Culturally sensitive education that respects local traditions while providing accurate information
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-secondary/10 p-2 rounded-full">
                    <Heart className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Tangible Support</h4>
                    <p className="text-muted-foreground text-sm">
                      Essential materials and supplies that make an immediate difference in daily lives
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-accent/10 p-2 rounded-full">
                    <Users className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Community Integration</h4>
                    <p className="text-muted-foreground text-sm">
                      Deep partnerships with local leaders, schools, and health organizations
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;

