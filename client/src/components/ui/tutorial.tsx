import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, X, ChevronRight, ChevronLeft, Lightbulb, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface TutorialStep {
  title: string;
  description: string;
  image?: string;
  tip?: string;
}

interface TutorialProps {
  title: string;
  description?: string;
  steps: TutorialStep[];
  className?: string;
}

export function Tutorial({ title, description, steps, className }: TutorialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const toggleTutorial = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setCurrentStep(0);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const closeTutorial = () => {
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 rounded-full h-10 w-10 p-0 shadow-md bg-white hover:bg-gray-100"
        onClick={toggleTutorial}
      >
        {isOpen ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-16 right-4 z-50 w-80 md:w-96"
          >
            <Card className="shadow-lg border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={closeTutorial}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {description && (
                  <CardDescription>{description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Étape {currentStep + 1} sur {steps.length}</span>
                  <div className="flex space-x-1">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1.5 w-5 rounded-full ${
                          index === currentStep ? "bg-primary" : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="min-h-[200px]">
                  <h3 className="font-medium text-lg mb-2">{steps[currentStep].title}</h3>
                  <p className="text-gray-600 mb-4">{steps[currentStep].description}</p>
                  
                  {steps[currentStep].image && (
                    <div className="rounded-md overflow-hidden border border-gray-200 mb-4">
                      <img
                        src={steps[currentStep].image}
                        alt={steps[currentStep].title}
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                  
                  {steps[currentStep].tip && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start">
                      <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-amber-800 ml-2">{steps[currentStep].tip}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </Button>
                
                {currentStep < steps.length - 1 ? (
                  <Button size="sm" onClick={nextStep}>
                    Suivant
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={closeTutorial}>
                    Terminer
                  </Button>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
