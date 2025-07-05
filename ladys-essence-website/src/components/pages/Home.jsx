import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, BookOpen, Heart, Shield, Smartphone, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

// Import images
import heroImage from '../../assets/women-empowerment.jpg';
import educationImage from '../../assets/girls-education.jpg';
import healthImage from '../../assets/women-health-africa.jpg';
import schoolImage from '../../assets/rwanda-school.jpg';

const Home = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [stats, setStats] = useState({
    girls: 0,
    women: 0,
    workshops: 0,
    waitingList: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  // Animate statistics on mount
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          animateStats();
        }
      },
      { threshold: 0.1 }
    );
    
    const statsElement = document.getElementById('impact-stats');
    if (statsElement) {
      observer.observe(statsElement);
    }
    
    return () => {
      if (statsElement) observer.unobserve(statsElement);
    };
  }, []);

  const animateStats = () => {
    const targets = { girls: 1200, women: 800, workshops: 15, waitingList: 600 };
    const duration = 2000;
    const steps = 60;
    const stepTime = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setStats({
        girls: Math.floor(targets.girls * progress),
        women: Math.floor(targets.women * progress),
        workshops: Math.floor(targets.workshops * progress),
        waitingList: Math.floor(targets.waitingList * progress)
      });

      if (step >= steps) {
        clearInterval(timer);
        setStats(targets);
      }
    }, stepTime);
  };

  const testimonials = [
    {
      text: "Before Lady's Essence came to our village, I missed school every month. Now I have the knowledge and supplies I need, and I haven't missed a single class. My grades have improved, and I can focus on my dream of becoming a doctor.",
      author: "Claudine, 15",
      location: "Student from Nyamagabe District"
    },
    {
      text: "The pregnancy care guidance helped me understand proper nutrition and vaccination schedules. My baby was born healthy, and I felt supported throughout the entire journey.",
      author: "Marie, 28",
      location: "Mother from Huye District"
    },
    {
      text: "The community workshops opened our eyes to important health topics we never discussed before. Now our daughters are better prepared and more confident.",
      author: "Agnes, 45",
      location: "Community Leader from Ruhango District"
    }
  ];

  const services = [
    {
      icon: Globe,
      title: "Web Platform",
      description: "Comprehensive digital platform with health tracking and educational resources",
      link: "https://ladys-essenced.vercel.app",
      external: true
    },
    {
      icon: Smartphone,
      title: "USSD Service",
      description: "Accessible health information for basic phones via USSD codes",
      link: "/ussd-simulator",
      external: false
    },
    {
      icon: BookOpen,
      title: "Educational Resources",
      description: "Culturally sensitive materials on menstrual health and pregnancy care",
      link: "/resources",
      external: false
    },
    {
      icon: Shield,
      title: "GBV Prevention",
      description: "Violence recognition, reporting, and support pathways",
      link: "/resources",
      external: false
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen">
      {/* Enhanced Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-purple-900/80 opacity-95"></div>
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Women empowerment in Africa" 
            className="w-full h-full object-cover object-center"
          />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight tracking-tight"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-100">
                Lady's Essence
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="text-xl md:text-2xl mb-4 font-light max-w-2xl mx-auto"
            >
              Empowering women, enhancing lives
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto"
            >
              Transforming lives through comprehensive health education, tangible support, 
              and accessible technology for women and girls in rural Rwanda.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg">
                <Link to="/get-involved">
                  Support Our Mission <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                <Link to="/about">Learn Our Story</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Enhanced scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex flex-col items-center">
            <span className="text-white text-sm mb-2">Scroll to explore</span>
            <div className="w-8 h-12 border-2 border-white/80 rounded-full flex justify-center relative">
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-1.5 h-1.5 bg-white rounded-full mt-3"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Enhanced Amina's Story Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="mb-4">
                <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-medium">
                  Our Inspiration
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                The Story of <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Amina</span>
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Amina, a bright young girl in rural Rwanda, dreams of becoming a doctor. 
                  Every month, she misses school for days. Without knowledge about her body 
                  or access to sanitary pads, she falls behind in class.
                </p>
                <p>
                  Her mother, pregnant again, relies on fragmented advice passed through 
                  generations. Their shared family phone makes private health information 
                  inaccessible.
                </p>
                <p className="font-semibold text-primary">
                  Amina represents millions caught in a cycle of silence, stigma, and missed opportunities.
                </p>
                <p className="text-lg font-medium text-foreground">
                  This isn't just about periods or pregnancy; it's about dignity, education, 
                  and futures we are allowing to slip away.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative rounded-xl overflow-hidden shadow-2xl"
            >
              <img 
                src={educationImage} 
                alt="Girls education in Africa" 
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-sm">Education is the most powerful weapon to change the world</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Impact Statistics */}
      <section id="impact-stats" className="py-16 bg-gradient-to-br from-primary/5 to-purple-900/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="mb-4">
              <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-medium">
                Making a Difference
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Impact</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transforming lives across 30 districts in Rwanda
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              { 
                icon: Users, 
                value: stats.girls, 
                label: "Girls received menstrual health education",
                color: "text-primary",
                bg: "bg-primary/10"
              },
              { 
                icon: Heart, 
                value: stats.women, 
                label: "Women supported during pregnancy",
                color: "text-purple-600",
                bg: "bg-purple-600/10"
              },
              { 
                icon: BookOpen, 
                value: stats.workshops, 
                label: "Community workshops on violence prevention",
                color: "text-secondary",
                bg: "bg-secondary/10"
              },
              { 
                icon: Users, 
                value: stats.waitingList, 
                label: "Individuals on our waiting list",
                color: "text-orange-500",
                bg: "bg-orange-500/10"
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <Card className="h-full border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className={`${stat.bg} p-5 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center`}>
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                    <div className={`text-3xl font-bold ${stat.color} mb-2`}>
                      {stat.value.toLocaleString()}{stat.value === 15 ? '' : '+'}
                    </div>
                    <p className="text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Services Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="mb-4">
              <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-medium">
                Our Offerings
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Comprehensive <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Services</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Supporting women through education, technology, and resources
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-0 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                  <CardHeader className="text-center">
                    <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <service.icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="mb-4">
                      {service.description}
                    </CardDescription>
                    {service.external ? (
                      <Button asChild variant="outline" size="sm" className="border-primary/30 hover:bg-primary/5">
                        <a href={service.link} target="_blank" rel="noopener noreferrer">
                          Access Platform <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button asChild variant="outline" size="sm" className="border-primary/30 hover:bg-primary/5">
                        <Link to={service.link}>
                          Learn More <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section className="py-16 bg-gradient-to-br from-muted to-white dark:from-gray-900/20 dark:to-black/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="mb-4">
              <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-medium">
                Real Stories
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Voices</span> of Change
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stories from the women and girls whose lives have been transformed
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <Card className="relative border-0 shadow-lg bg-gradient-to-br from-white to-muted dark:from-gray-900 dark:to-gray-800">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={prevTestimonial}
                    className="p-3 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextTestimonial}
                    className="p-3 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTestimonial}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    <blockquote className="text-lg md:text-xl text-muted-foreground mb-6 italic">
                      "{testimonials[currentTestimonial].text}"
                    </blockquote>
                    <div>
                      <p className="font-semibold text-primary text-lg">
                        — {testimonials[currentTestimonial].author}
                      </p>
                      <p className="text-muted-foreground">
                        {testimonials[currentTestimonial].location}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-center mt-8 space-x-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentTestimonial ? 'bg-primary' : 'bg-primary/30'
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Enhanced Call to Action */}
      <section className="py-16 bg-gradient-to-r from-primary to-purple-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Join Us in <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-100">Empowering Her Future</span>
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Every donation, partnership, and shared story brings us closer to a world 
              where no woman or girl is held back by her biology.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex flex-col sm:flex-row gap-4"
            >
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg">
                <Link to="/get-involved">
                  Donate Now <Heart className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                <Link to="/contact">Become a Partner</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;