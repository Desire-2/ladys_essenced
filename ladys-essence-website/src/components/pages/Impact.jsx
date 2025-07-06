import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Heart, BookOpen, MapPin, TrendingUp, Award, CheckCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

// Import images
import impactImage from '../../assets/rwanda-school.jpg';
import communityImage from '../../assets/women-empowerment.jpg';

const Impact = () => {
  const [stats, setStats] = useState({
    girls: 0,
    women: 0,
    workshops: 0,
    waitingList: 0,
    districts: 0
  });

  // Animate statistics on mount
  useEffect(() => {
    const animateStats = () => {
      const targets = { girls: 1200, women: 800, workshops: 15, waitingList: 600, districts: 30 };
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
          waitingList: Math.floor(targets.waitingList * progress),
          districts: Math.floor(targets.districts * progress)
        });

        if (step >= steps) {
          clearInterval(timer);
          setStats(targets);
        }
      }, stepTime);
    };

    const timer = setTimeout(animateStats, 500);
    return () => clearTimeout(timer);
  }, []);

  const impactAreas = [
    {
      icon: Users,
      title: "Girls Educated",
      value: stats.girls,
      suffix: "+",
      description: "Girls received comprehensive menstrual health education",
      color: "text-primary"
    },
    {
      icon: Heart,
      title: "Women Supported",
      value: stats.women,
      suffix: "+", 
      description: "Women supported during pregnancy with nutrition guidance",
      color: "text-secondary"
    },
    {
      icon: BookOpen,
      title: "Community Workshops",
      value: stats.workshops,
      suffix: "",
      description: "Educational workshops on violence prevention conducted",
      color: "text-accent"
    },
    {
      icon: MapPin,
      title: "Districts Reached",
      value: stats.districts,
      suffix: "",
      description: "Districts across Rwanda where we have active presence",
      color: "text-orange-600"
    },
    {
      icon: TrendingUp,
      title: "Waiting List",
      value: stats.waitingList,
      suffix: "+",
      description: "Individuals waiting to access our services",
      color: "text-purple-600"
    }
  ];

  const successStories = [
    {
      name: "Claudine",
      age: 15,
      location: "Nyamagabe District",
      role: "Student",
      story: "Before Lady's Essence came to our village, I missed school every month. Now I have the knowledge and supplies I need, and I haven't missed a single class. My grades have improved, and I can focus on my dream of becoming a doctor.",
      impact: "Perfect school attendance for 6 months"
    },
    {
      name: "Marie",
      age: 28,
      location: "Huye District", 
      role: "Mother",
      story: "The pregnancy care guidance helped me understand proper nutrition and vaccination schedules. My baby was born healthy, and I felt supported throughout the entire journey.",
      impact: "Healthy pregnancy and delivery"
    },
    {
      name: "Agnes",
      age: 45,
      location: "Ruhango District",
      role: "Community Leader",
      story: "The community workshops opened our eyes to important health topics we never discussed before. Now our daughters are better prepared and more confident.",
      impact: "Led 3 community health discussions"
    }
  ];

  const achievements = [
    {
      title: "Zero School Dropouts",
      description: "In communities where we provide menstrual health education and supplies, we've achieved zero school dropouts due to menstruation.",
      icon: Award
    },
    {
      title: "95% Satisfaction Rate",
      description: "95% of women who received our pregnancy care guidance reported feeling more confident and prepared.",
      icon: CheckCircle
    },
    {
      title: "Community Adoption",
      description: "Local leaders in 30 districts have officially endorsed and integrated our programs into community health initiatives.",
      icon: Users
    }
  ];

  const futureGoals = [
    {
      goal: "Reach 50 Districts",
      timeline: "By 2025",
      description: "Expand our presence to cover all districts in Rwanda"
    },
    {
      goal: "Support 5,000 Girls",
      timeline: "By 2025", 
      description: "Provide menstrual health education and supplies to 5,000 girls"
    },
    {
      goal: "Train 100 CHWs",
      timeline: "By 2026",
      description: "Train 100 Community Health Workers as program ambassadors"
    },
    {
      goal: "Launch Mobile App",
      timeline: "Q2 2025",
      description: "Release our mobile application with offline capabilities"
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
              Our <span className="text-gradient">Impact</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Real change, real lives transformed. See how Lady's Essence is making a 
              measurable difference in communities across Rwanda.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Impact Statistics */}
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
              Impact by the <span className="text-gradient">Numbers</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Quantifiable results that demonstrate the real difference we're making
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {impactAreas.map((area, index) => (
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
                      <area.icon className={`h-8 w-8 ${area.color}`} />
                    </div>
                    <div className={`text-4xl font-bold ${area.color} mb-2`}>
                      {area.value.toLocaleString()}{area.suffix}
                    </div>
                    <CardTitle className="text-xl">{area.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{area.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
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
              <span className="text-gradient">Success</span> Stories
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real stories from the women and girls whose lives have been transformed by our programs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                        {story.name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{story.name}, {story.age}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{story.role}</Badge>
                          <Badge variant="outline">{story.location}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <blockquote className="text-muted-foreground italic mb-4">
                      "{story.story}"
                    </blockquote>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-green-700 font-medium text-sm">
                        <CheckCircle className="h-4 w-4 inline mr-2" />
                        Impact: {story.impact}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Achievements */}
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
              Key <span className="text-gradient">Achievements</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Milestones that showcase the effectiveness of our approach
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="text-center card-hover h-full">
                  <CardHeader>
                    <div className="bg-accent/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <achievement.icon className="h-8 w-8 text-accent" />
                    </div>
                    <CardTitle className="text-xl">{achievement.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{achievement.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Geographic Impact */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                <span className="text-gradient">Geographic</span> Reach
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Our programs are active across 30 districts in Rwanda, with a focus on 
                underserved rural communities where the need is greatest.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary w-4 h-4 rounded-full"></div>
                  <span className="text-foreground">Active Programs (30 districts)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-secondary w-4 h-4 rounded-full"></div>
                  <span className="text-foreground">Expansion Planned (20 districts)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-accent w-4 h-4 rounded-full"></div>
                  <span className="text-foreground">Community Partnerships</span>
                </div>
              </div>

              <div className="mt-8 bg-white p-6 rounded-lg">
                <h4 className="font-semibold text-foreground mb-3">Priority Areas</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Rural communities with limited healthcare access</li>
                  <li>• Schools with high female absenteeism rates</li>
                  <li>• Areas with cultural barriers to health education</li>
                  <li>• Communities with active local leadership support</li>
                </ul>
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
                src={communityImage} 
                alt="Community impact and empowerment" 
                className="rounded-lg shadow-2xl w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-lg"></div>
              <div className="absolute bottom-4 left-4 bg-white/90 p-4 rounded-lg">
                <p className="text-sm font-medium text-foreground">
                  Reaching the most remote communities
                </p>
                <p className="text-xs text-muted-foreground">
                  30 districts and growing
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Future Goals */}
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
              Future <span className="text-gradient">Goals</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our roadmap for expanding impact and reaching even more women and girls
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {futureGoals.map((goal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="text-center card-hover h-full">
                  <CardContent className="p-6">
                    <Badge className="mb-4">{goal.timeline}</Badge>
                    <h3 className="font-bold text-lg mb-3 text-foreground">{goal.goal}</h3>
                    <p className="text-muted-foreground text-sm">{goal.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
              Be Part of Our Growing Impact
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Every name on our waiting list represents a potential ignited, a future waiting to be unlocked. 
              Help us reach more women and girls who need our support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <a href="/get-involved">
                  Support Our Mission <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                <a href="/contact">Partner With Us</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Impact;

