import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { testimonials } from '@/lib/data';

export const Testimonials = () => {
  return (
    <section id="testimonials" className="bg-background py-20 md:py-24">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold font-headline md:text-4xl">
            Trusted by Patients & Doctors
          </h2>
          <p className="mt-2 text-lg text-foreground/70">
            Hear what our users have to say.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <Card
              key={index}
              className="flex flex-col border-border/30 bg-secondary/50"
            >
              <CardContent className="flex flex-grow flex-col p-6">
                <p className="flex-grow text-foreground/80">
                  "{item.testimonial}"
                </p>
                <div className="mt-6 flex items-center">
                  <Avatar>
                    {item.image && (
                      <AvatarImage
                        src={item.image.imageUrl}
                        alt={item.name}
                        data-ai-hint={item.image.imageHint}
                      />
                    )}
                    <AvatarFallback>{item.avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <p className="font-bold font-headline">{item.name}</p>
                    <p className="text-sm text-foreground/60">{item.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
