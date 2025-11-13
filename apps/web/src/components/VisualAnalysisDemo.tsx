import { useState, useEffect } from 'react';
import { motion, useMotionValue, animate, AnimatePresence, useTransform } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { motionDurations } from '@/effects/framer-motion/variants';
import { Sparkle, Eye, ArrowRight } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const DEMO_PETS = [
  {
    photo: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
    breed: 'Golden Retriever',
    age: 3,
    size: 'large',
    personality: ['Friendly', 'Playful', 'Energetic', 'Social'],
    confidence: 92,
  },
  {
    photo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
    breed: 'Tabby Cat',
    age: 2,
    size: 'small',
    personality: ['Curious', 'Independent', 'Calm', 'Affectionate'],
    confidence: 88,
  },
  {
    photo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80',
    breed: 'German Shepherd',
    age: 4,
    size: 'large',
    personality: ['Loyal', 'Protective', 'Energetic', 'Social'],
    confidence: 95,
  },
];

export default function VisualAnalysisDemo(): JSX.Element | null {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const reducedMotion = useReducedMotion();

  // Animated values
  const iconRotate = useMotionValue(0);
  const iconBoxShadow = useMotionValue(0);
  const photoOpacity = useMotionValue(0);
  const photoScale = useMotionValue(0.95);
  const sparkleRotate = useMotionValue(0);
  const dotScale = useMotionValue(1);

  const iconBoxShadowValue = useTransform(iconBoxShadow, (value) => {
    const radius = 20 + value * 10;
    const opacity = 0.3 + value * 0.2;
    return `0 0 ${radius}px rgba(245,158,11,${opacity})`;
  });

  useEffect(() => {
    if (reducedMotion) {
      iconRotate.set(0);
      iconBoxShadow.set(0);
      photoOpacity.set(1);
      photoScale.set(1);
      return;
    }

    void animate(iconRotate, 360, {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    });
    void animate(iconBoxShadow, [1, 0], {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    void animate(photoOpacity, 1, { duration: 0.3 });
    void animate(photoScale, 1, { duration: 0.3 });
  }, [selectedIndex, iconRotate, iconBoxShadow, photoOpacity, photoScale, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      sparkleRotate.set(0);
      dotScale.set(1);
      return;
    }

    if (analyzing) {
      void animate(sparkleRotate, 360, {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      });
      void animate(dotScale, [1, 1.5, 1], {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      });
    } else {
      sparkleRotate.set(0);
      dotScale.set(1);
    }
  }, [analyzing, sparkleRotate, dotScale, reducedMotion]);

  const currentPet = DEMO_PETS[selectedIndex];
  if (!currentPet) return null;

  const runDemo = (): void => {
    setShowResult(false);
    setAnalyzing(true);

    setTimeout(() => {
      setAnalyzing(false);
      setShowResult(true);
    }, 2000);
  };

  const nextPet = (): void => {
    setSelectedIndex((prev) => (prev + 1) % DEMO_PETS.length);
    setShowResult(false);
    setAnalyzing(false);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      <div className="flex items-start gap-4 mb-6">
        <motion.div
          style={{
            rotate: iconRotate,
            boxShadow: iconBoxShadowValue,
          }}
          className="w-12 h-12 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center shrink-0"
        >
          <Eye size={24} weight="fill" className="text-white" />
        </motion.div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1">AI Visual Analysis Demo</h3>
          <p className="text-sm text-muted-foreground">
            See how our AI reads pet photos to extract breed, age, size, and personality traits
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <motion.div
            key={selectedIndex}
            style={{
              opacity: photoOpacity,
              scale: photoScale,
            }}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-4"
          >
            <img src={currentPet.photo} alt="Demo pet" className="w-full h-full object-cover" />
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                Sample {selectedIndex + 1}/{DEMO_PETS.length}
              </Badge>
            </div>
          </motion.div>

          <div className="flex gap-2">
            <Button
              onClick={runDemo}
              disabled={analyzing}
              className="flex-1 bg-gradient-to-r from-primary to-accent"
            >
              {analyzing ? (
                <>
                  <motion.div
                    style={{
                      rotate: sparkleRotate,
                    }}
                  >
                    <Sparkle size={18} weight="fill" />
                  </motion.div>
                  <span className="ml-2">Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkle size={18} weight="fill" />
                  <span className="ml-2">Analyze This Photo</span>
                </>
              )}
            </Button>
            <Button variant="outline" onClick={nextPet} disabled={analyzing}>
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>

        <div>
          <AnimatePresence mode="wait">
            {!showResult && !analyzing && (
              <motion.div
                key="prompt"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-center h-full text-center p-8"
              >
                <div>
                  <Eye size={48} className="text-muted-foreground/30 mx-auto mb-4" weight="duotone" />
                  <p className="text-muted-foreground">
                    Click "Analyze This Photo" to see AI in action
                  </p>
                </div>
              </motion.div>
            )}

            {analyzing && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <Card className="p-4 bg-background/50">
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div
                      style={{
                        rotate: sparkleRotate,
                      }}
                    >
                      <Sparkle size={24} weight="fill" className="text-primary" />
                    </motion.div>
                    <div>
                      <h4 className="font-semibold">Analyzing photo...</h4>
                      <p className="text-xs text-muted-foreground">Processing visual features</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      'Detecting breed...',
                      'Estimating age...',
                      'Analyzing personality...',
                      'Calculating confidence...',
                    ].map((text, idx) => (
                      <div
                        key={text}
                        className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-left duration-300"
                        style={{ animationDelay: `${idx * 400}ms` }}
                      >
                        <motion.div
                          style={{
                            scale: dotScale,
                          }}
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                        />
                        {text}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {showResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="h-full"
              >
              <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg">Analysis Results</h4>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                  >
                    {currentPet.confidence}% confidence
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="animate-in fade-in slide-in-from-left duration-300 delay-100">
                    <div className="text-xs text-muted-foreground mb-1">Breed</div>
                    <div className="font-semibold text-lg">{currentPet.breed}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="animate-in fade-in slide-in-from-left duration-300 delay-150">
                      <div className="text-xs text-muted-foreground mb-1">Age</div>
                      <div className="font-semibold">{currentPet.age} years</div>
                    </div>

                    <div className="animate-in fade-in slide-in-from-left duration-300 delay-200">
                      <div className="text-xs text-muted-foreground mb-1">Size</div>
                      <div className="font-semibold capitalize">
                        {currentPet.size.replace('-', ' ')}
                      </div>
                    </div>
                  </div>

                  <div className="animate-in fade-in slide-in-from-bottom duration-300 delay-250">
                    <div className="text-xs text-muted-foreground mb-2">Personality Traits</div>
                    <div className="flex flex-wrap gap-2">
                      {currentPet.personality.map((trait, idx) => (
                        <Badge
                          key={trait}
                          className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 animate-in zoom-in duration-300"
                          style={{ animationDelay: `${250 + idx * 50}ms` }}
                        >
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-bottom duration-300 delay-400">
                    <p className="text-xs text-muted-foreground">
                      💡 This information would be automatically filled in when creating a pet
                      profile
                    </p>
                  </div>
                </div>
              </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}
