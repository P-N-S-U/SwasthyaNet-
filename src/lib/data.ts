import data from '@/lib/placeholder-images.json';

const { placeholderImages } = data;

const findImage = (id: string) => placeholderImages.find(img => img.id === id);

export const testimonials = [
  {
    name: 'Sarah L.',
    role: 'Patient',
    testimonial:
      'SwasthyaNet made it so easy to find a specialist and get a consultation without leaving my home. The AI symptom checker was surprisingly accurate!',
    image: findImage('testimonial-1'),
    avatarFallback: 'SL',
  },
  {
    name: 'Dr. Mark R.',
    role: 'Cardiologist',
    testimonial:
      'As a doctor, this platform has streamlined my workflow. I can manage appointments, consult with patients, and issue prescriptions all in one place.',
    image: findImage('testimonial-2'),
    avatarFallback: 'MR',
  },
  {
    name: 'David C.',
    role: 'Patient',
    testimonial:
      'The video call quality was excellent, and the doctor was very attentive. I received my prescription immediately after. Highly recommended!',
    image: findImage('testimonial-3'),
    avatarFallback: 'DC',
  },
];
