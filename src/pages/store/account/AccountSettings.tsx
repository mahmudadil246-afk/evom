import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { User, Camera, Loader2, Mail, Phone, Calendar, Building2 } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional().nullable(),
  company_name: z.string().optional(),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
});

const emailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
});

export default function AccountSettings() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const profileForm = useForm({ resolver: zodResolver(profileSchema), defaultValues: { full_name: "", email: "", phone: "", date_of_birth: "", gender: null as any, company_name: "", bio: "" } });
  const emailForm = useForm<z.infer<typeof emailSchema>>({ resolver: zodResolver(emailSchema), defaultValues: { newEmail: "" } });

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
        if (data) {
          setAvatarUrl(data.avatar_url);
          profileForm.reset({ full_name: data.full_name || "", email: user.email || "", phone: data.phone || "", date_of_birth: data.date_of_birth || "", gender: data.gender || null, company_name: data.company_name || "", bio: data.bio || "" });
        }
      } catch (error) { console.error("Error:", error); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [user]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
      if (updateError) throw updateError;
      setAvatarUrl(publicUrl);
      toast({ title: "Success", description: "Avatar updated" });
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    finally { setUploadingAvatar(false); }
  };

  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase.from("profiles").update({ full_name: values.full_name, phone: values.phone || null, date_of_birth: values.date_of_birth || null, gender: values.gender || null, company_name: values.company_name || null, bio: values.bio || null }).eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Success", description: "Profile updated successfully" });
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    finally { setSavingProfile(false); }
  };

  const onEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    if (!user) return;
    setIsEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: values.newEmail });
      if (error) throw error;
      emailForm.reset();
      toast({ title: "Email Change Requested", description: "A confirmation link has been sent to your new email address." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Email Update Failed", description: error.message });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <>
      <SEOHead title="Account Settings" noIndex />
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Avatar Card */}
            <motion.div variants={itemVariants} className="rounded-xl border border-border/50 bg-card p-4 sm:p-5 hover:shadow-md transition-all border-l-[3px] border-l-primary">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-primary/10 p-2"><Camera className="h-5 w-5 text-primary" /></div>
                <div>
                  <h3 className="font-semibold">Avatar</h3>
                  <p className="text-xs text-muted-foreground">Upload a profile photo</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-28 w-28">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">{getInitials(profileForm.getValues("full_name") || user?.email || "U")}</AvatarFallback>
                  </Avatar>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <input type="file" id="customer-avatar" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  <Button asChild variant="outline" disabled={uploadingAvatar}>
                    <label htmlFor="customer-avatar" className="cursor-pointer">
                      {uploadingAvatar ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>) : (<><Camera className="mr-2 h-4 w-4" />Change Avatar</>)}
                    </label>
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Personal Info Card */}
            <motion.div variants={itemVariants} className="rounded-xl border border-border/50 bg-card p-4 sm:p-5 hover:shadow-md transition-all border-l-[3px] border-l-primary">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-primary/10 p-2"><User className="h-5 w-5 text-primary" /></div>
                <div>
                  <h3 className="font-semibold">Personal Information</h3>
                  <p className="text-xs text-muted-foreground">Update your personal details</p>
                </div>
              </div>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={profileForm.control} name="full_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('account.fullName')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-10" placeholder={t('account.fullName')} {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={profileForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('common.email')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-10 bg-muted" type="email" {...field} disabled />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={profileForm.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('common.phone')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-10" placeholder="01XXXXXXXXX" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={profileForm.control} name="date_of_birth" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('account.dateOfBirth')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-10" type="date" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={profileForm.control} name="gender" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('account.gender')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl><SelectTrigger><SelectValue placeholder={t('account.selectGender')} /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="male">{t('account.male')}</SelectItem>
                            <SelectItem value="female">{t('account.female')}</SelectItem>
                            <SelectItem value="other">{t('account.other')}</SelectItem>
                            <SelectItem value="prefer_not_to_say">{t('account.preferNotToSay')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={profileForm.control} name="company_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('account.companyName')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-10" placeholder={t('account.companyName')} {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={profileForm.control} name="bio" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('account.bio')}</FormLabel>
                      <FormControl>
                        <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" placeholder={t('account.tellAboutYourself')} maxLength={500} {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground text-right">{(field.value?.length || 0)}/500</p>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save Changes
                  </Button>
                </form>
              </Form>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Change Email Card */}
            <motion.div variants={itemVariants} className="rounded-xl border border-border/50 bg-card p-4 sm:p-5 hover:shadow-md transition-all border-l-[3px] border-l-accent">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-accent/10 p-2"><Mail className="h-5 w-5 text-accent" /></div>
                <div>
                  <h3 className="font-semibold">Change Email</h3>
                  <p className="text-xs text-muted-foreground">A confirmation link will be sent to the new email</p>
                </div>
              </div>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <FormLabel>Current Email</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10 bg-muted" disabled value={user?.email || ''} />
                    </div>
                  </div>
                  <FormField control={emailForm.control} name="newEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-10" placeholder="Enter new email address" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={isEmailLoading}>
                    {isEmailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update Email
                  </Button>
                </form>
              </Form>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
