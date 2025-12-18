'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  savePrescription,
  generatePrescription,
} from '@/app/doctor/prescriptions/actions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Loader2,
  PlusCircle,
  Save,
  Sparkles,
  Trash2,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const medicationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  notes: z.string().optional(),
});

const prescriptionFormSchema = z.object({
  diagnosis: z.string().min(3, 'Diagnosis is required'),
  notes: z.string().optional(),
  medications: z.array(medicationSchema).min(1, 'At least one medication is required'),
  advice: z.string().optional(),
  followUp: z.string().optional(),
});

type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>;

function GenerateButton() {
    const { pending } = useFormStatus();
    const diagnosis = useForm().watch('diagnosis');

    return (
        <Button type="submit" variant="outline" disabled={pending || !diagnosis} size="sm">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Suggestions with AI
        </Button>
    )
}

export function PrescriptionForm({ appointment, existingPrescription }) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: {
      diagnosis: existingPrescription?.diagnosis || '',
      notes: '',
      medications: existingPrescription?.medications || [],
      advice: existingPrescription?.advice || '',
      followUp: existingPrescription?.followUp || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'medications',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiState, generateAction, isGenerating] = useActionState(generatePrescription, { data: null, error: null });

  useEffect(() => {
      if (aiState.data) {
          const { medications, advice, followUp } = aiState.data;
          form.setValue('medications', medications, { shouldValidate: true });
          form.setValue('advice', advice, { shouldValidate: true });
          form.setValue('followUp', followUp, { shouldValidate: true });
          toast({ title: "AI suggestions applied."});
      }
      if (aiState.error) {
          toast({ title: "AI Error", description: aiState.error, variant: 'destructive' });
      }
  }, [aiState, form, toast]);


  const onSubmit = async (values: PrescriptionFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('appointmentId', appointment.id);
    formData.append('patientId', appointment.patientId);
    formData.append('patientName', appointment.patientName);
    formData.append('diagnosis', values.diagnosis);
    formData.append('medications', JSON.stringify(values.medications));
    if (values.advice) formData.append('advice', values.advice);
    if (values.followUp) formData.append('followUp', values.followUp);

    const result = await savePrescription(null, formData);
    
    if (result.success) {
      toast({
        title: 'Success!',
        description: result.message,
      });
      router.push(`/doctor/dashboard`);
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Diagnosis & Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chief Complaint / Diagnosis</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Viral Fever, Common Cold" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient Notes (for AI context)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional notes for generating suggestions, e.g., Patient has a history of allergies to penicillin."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
                type="submit"
                formAction={generateAction}
                variant="outline"
                disabled={isGenerating || !form.watch('diagnosis')}
                size="sm"
            >
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Suggestions with AI
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name={`medications.${index}.name`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl><Input placeholder="e.g., Paracetamol" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`medications.${index}.dosage`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Dosage</FormLabel>
                            <FormControl><Input placeholder="e.g., 500mg" {...field} /></FormControl>
                             <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name={`medications.${index}.frequency`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Frequency</FormLabel>
                            <FormControl><Input placeholder="e.g., 1-1-1 (after food)" {...field} /></FormControl>
                             <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`medications.${index}.duration`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <FormControl><Input placeholder="e.g., 5 days" {...field} /></FormControl>
                             <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name={`medications.${index}.notes`}
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl><Input placeholder="Optional - e.g., Take with food" {...field} /></FormControl>
                         <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
            ))}
             <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: '', dosage: '', frequency: '', duration: '', notes: '' })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Medication
            </Button>
            {form.formState.errors.medications && <p className="text-sm font-medium text-destructive">{form.formState.errors.medications.message}</p>}
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle>Advice & Follow-up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <FormField
              control={form.control}
              name="advice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>General Advice</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Take plenty of rest and fluids." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="followUp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up Instructions</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Revisit after 3 days if symptoms persist." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
          {existingPrescription ? 'Update Prescription' : 'Save Prescription'}
        </Button>
      </form>
    </Form>
  );
}
