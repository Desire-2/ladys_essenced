import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Phone, ArrowRight, CheckCircle, Info, ExternalLink, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';

const USSDSimulator = () => {
  const [showSimulator, setShowSimulator] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (showSimulator) {
      const timer = setTimeout(() => setProgress(100), 800);
      return () => clearTimeout(timer);
    } else {
      setProgress(0);
    }
  }, [showSimulator]);

  const steps = [
    {
      step: 1,
      title: "Enter Your Phone Number",
      description: "Input your mobile phone number in the simulator (format: +250XXXXXXXXX for Rwanda)"
    },
    {
      step: 2,
      title: "Dial the USSD Code",
      description: "Type *384*70975# in the USSD code field"
    },
    {
      step: 3,
      title: "Navigate the Menu",
      description: "Follow the on-screen prompts to access health information and services"
    },
    {
      step: 4,
      title: "Explore Features",
      description: "Try different menu options to see available health resources and tips"
    }
  ];

  const features = [
    "Menstrual health information and cycle tracking",
    "Pregnancy care tips and nutrition guidance",
    "Emergency health contacts and resources",
    "Community health worker information",
    "Educational content in local languages",
    "No internet connection required"
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Enhanced Hero Section */}
      <section className="py-16 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, -5, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="bg-gradient-to-r from-primary to-purple-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg"
            >
              <Smartphone className="h-10 w-10 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              USSD <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Simulator</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience our <span className="font-semibold text-primary">internet-free</span> health service that works on any mobile phone. 
              Try the interactive simulator to access vital health resources.
            </p>
            <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 p-4 rounded-lg inline-flex items-center gap-3 border border-primary/20">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <p className="text-lg font-semibold text-foreground">
                USSD Code: <span className="font-mono bg-foreground/5 px-3 py-1 rounded-md text-primary">*384*70975#</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Instructions with Progress */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <div className="inline-flex mb-4">
              <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-medium">
                Step-by-step Guide
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              How to Use the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Simulator</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Follow these simple steps to explore our USSD service
            </p>
          </motion.div>

          {/* Progress Stepper */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex justify-between relative mb-8">
              <div className="absolute top-4 left-0 right-0 h-1 bg-muted -z-10 mx-16">
                <motion.div 
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              {steps.map((step, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => setActiveStep(index)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                    index <= activeStep 
                      ? 'bg-primary text-white' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <span className={`text-sm font-medium text-center px-2 ${
                    index === activeStep ? 'text-foreground font-semibold' : 'text-muted-foreground'
                  }`}>
                    Step {index + 1}
                  </span>
                </div>
              ))}
            </div>

            {/* Active Step Card */}
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-primary/20 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">{steps[activeStep].title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{steps[activeStep].description}</CardDescription>
                  {activeStep === 0 && (
                    <div className="mt-4 bg-muted/30 p-4 rounded-lg text-sm">
                      <span className="font-mono bg-foreground/5 px-2 py-1 rounded">+250XXXXXXXXX</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4">
            <Button 
              variant="outline" 
              disabled={activeStep === 0}
              onClick={() => setActiveStep(prev => prev - 1)}
            >
              Previous
            </Button>
            <Button 
              onClick={() => {
                if (activeStep < steps.length - 1) {
                  setActiveStep(prev => prev + 1)
                } else {
                  setShowSimulator(true)
                }
              }}
            >
              {activeStep < steps.length - 1 ? 'Next Step' : 'Try Simulator'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Enhanced Simulator Section */}
      <section className="py-16 bg-gradient-to-b from-muted to-white dark:from-gray-900 dark:to-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Interactive <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">USSD Simulator</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Experience our health service in the simulator below
            </p>
            
            <AnimatePresence mode="wait">
              {!showSimulator ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Button 
                    onClick={() => setShowSimulator(true)}
                    size="lg"
                    className="mb-8 shadow-lg"
                  >
                    <Smartphone className="mr-2 h-5 w-5" />
                    Launch Simulator
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-block mb-8"
                >
                  <Button 
                    variant="outline"
                    onClick={() => setShowSimulator(false)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Close Simulator
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {showSimulator && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="max-w-6xl mx-auto"
              >
                {progress < 100 && (
                  <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg mb-4">
                    <div className="mb-4">
                      <Smartphone className="h-12 w-12 text-primary animate-pulse" />
                    </div>
                    <p className="mb-3 text-muted-foreground">Loading simulator...</p>
                    <Progress value={progress} className="w-[60%]" />
                  </div>
                )}

                <Card className="overflow-hidden shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-primary to-purple-600 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Phone className="h-6 w-6" />
                        <div>
                          <CardTitle>USSD Service Simulator</CardTitle>
                          <CardDescription className="text-primary-foreground/80">
                            Powered by Africa's Talking
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                          onClick={() => setIframeLoading(false)}
                        >
                          Refresh
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          asChild
                          className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                        >
                          <a 
                            href="https://developers.africastalking.com/simulator" 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            Full Screen <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                      {iframeLoading && (
                        <Skeleton className="absolute inset-0 w-full h-full" />
                      )}
                      <iframe
                        src="https://developers.africastalking.com/simulator"
                        className={`absolute top-0 left-0 w-full h-full border-0 ${iframeLoading ? 'hidden' : 'block'}`}
                        title="USSD Simulator"
                        allow="fullscreen"
                        onLoad={() => {
                          setIframeLoading(false)
                          setProgress(100)
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6"
                >
                  <Alert className="border-primary/30 bg-primary/5">
                    <Info className="h-5 w-5 text-primary" />
                    <AlertDescription>
                      <span className="font-medium">Pro Tip:</span> Enter your phone number in format <span className="font-mono bg-foreground/5 px-1.5 py-0.5 rounded">+250XXXXXXXXX</span> and dial <span className="font-mono bg-foreground/5 px-1.5 py-0.5 rounded">*384*70975#</span>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex mb-4">
                <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-medium">
                  Key Benefits
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">USSD</span> for Health Access?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our service ensures every woman can access vital health resources regardless of technology barriers
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative">
                <div className="absolute -top-6 -right-6 w-full h-full bg-purple-600/10 rounded-2xl rotate-3"></div>
                <Card className="relative bg-gradient-to-br from-primary/5 to-purple-600/5 border-primary/20 shadow-lg z-10">
                  <CardContent className="p-8">
                    <div className="bg-gradient-to-r from-primary to-purple-600 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-md">
                      <Smartphone className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-center text-foreground">Universal Access</h3>
                    <p className="text-muted-foreground mb-6 text-center">
                      Works on any mobile device - no app downloads or internet connection needed
                    </p>
                    <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 p-4 rounded-lg border border-primary/20 text-center">
                      <p className="text-sm text-muted-foreground mb-2">Dial this code on your phone:</p>
                      <p className="text-2xl font-bold text-primary font-mono">*384*70975#</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Real Usage Section */}
      <section className="py-16 bg-gradient-to-b from-muted to-white dark:from-gray-900 dark:to-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center max-w-4xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Use on Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Actual Phone</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              The simulator is just a preview - experience real service on your mobile device
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[1, 2, 3].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full text-center border-0 shadow-sm bg-gradient-to-b from-white to-muted dark:from-gray-800 dark:to-gray-900">
                    <CardContent className="p-6">
                      <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 text-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                        {step}
                      </div>
                      <h3 className="font-semibold mb-2 text-lg">Step {step}</h3>
                      {step === 1 && <p>Open your phone's dialer</p>}
                      {step === 2 && <p>Dial <span className="font-mono text-primary">*384*70975#</span></p>}
                      {step === 3 && <p>Access health information</p>}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Alert className="border-primary/30 bg-primary/5 max-w-2xl mx-auto">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <AlertTitle className="font-medium">Available 24/7 across Rwanda</AlertTitle>
                  <AlertDescription>
                    Service accessible on all major networks. Standard USSD charges apply.
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default USSDSimulator;