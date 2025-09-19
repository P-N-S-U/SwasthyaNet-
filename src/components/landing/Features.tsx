import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Bot, Video, FileText, Lock } from 'lucide-react';

const features = [
  {
    icon: <Bot className="h-8 w-8 text-accent" />,
    title: 'AI Symptom Checker',
    description:
      'Get a preliminary analysis of your symptoms with our intelligent AI chatbot.',
  },
  {
    icon: <Video className="h-8 w-8 text-accent" />,
    title: 'Video Consultations',
    description:
      'Connect with doctors face-to-face through secure, high-quality video calls.',
  },
  {
    icon: <FileText className="h-8 w-8 text-accent" />,
    title: 'E-Prescriptions',
    description:
      'Receive and download your prescriptions digitally, right after your consultation.',
  },
  {
    icon: <Lock className="h-8 w-8 text-accent" />,
    title: 'Secure Data',
    description:
      'Your health data is end-to-end encrypted and stored with utmost security.',
  },
];

export const Features = () => {
  return (
    <section id="features" className="bg-background py-20 md:py-24">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold font-headline md:text-4xl">
            Features Built For You
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-lg text-foreground/70">
            Everything you need for a modern healthcare experience.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="transform border-border/30 bg-secondary/50 transition-all hover:-translate-y-1 hover:border-accent/50 hover:bg-secondary"
            >
              <CardHeader>
                <div className="mb-4 inline-block rounded-lg bg-primary/10 p-3">
                  {feature.icon}
                </div>
                <CardTitle className="font-headline">{feature.title}</CardTitle>
                <CardDescription className="text-foreground/60">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
