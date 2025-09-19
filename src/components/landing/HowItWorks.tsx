import { ScanSearch, UserPlus, MessageSquareHeart } from 'lucide-react';

const steps = [
  {
    icon: <ScanSearch className="h-10 w-10 text-primary" />,
    title: '1. Check & Book',
    description:
      'Use our AI to check your symptoms and find the right specialist. Book an appointment in seconds.',
  },
  {
    icon: <UserPlus className="h-10 w-10 text-primary" />,
    title: '2. Consult a Doctor',
    description:
      'Connect with your doctor via secure chat or video call. Discuss your health concerns privately.',
  },
  {
    icon: <MessageSquareHeart className="h-10 w-10 text-primary" />,
    title: '3. Get Your Plan',
    description:
      'Receive your diagnosis, prescription, and a personalized health plan from your doctor.',
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-secondary/30 py-20 md:py-24">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold font-headline md:text-4xl">
            How It Works
          </h2>
          <p className="mt-2 text-lg text-foreground/70">
            A simple 3-step process to get you the care you need.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center p-6">
              <div className="mb-6 rounded-full bg-primary/10 p-4">
                {step.icon}
              </div>
              <h3 className="mb-2 text-xl font-bold font-headline">
                {step.title}
              </h3>
              <p className="text-foreground/60">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
