import { useState } from "react";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Lock, Loader2, Eye, EyeOff, FileText, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

const passwordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Must contain uppercase").regex(/[a-z]/, "Must contain lowercase").regex(/[0-9]/, "Must contain number"),
  confirm_password: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.new_password === data.confirm_password, { message: "Passwords don't match", path: ["confirm_password"] });

export default function AccountPassword() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordForm = useForm({ resolver: zodResolver(passwordSchema), defaultValues: { current_password: "", new_password: "", confirm_password: "" } });

  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    if (!user) return;
    setSavingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email!, password: values.current_password });
      if (signInError) throw new Error("Current password is incorrect");
      const { error: updateError } = await supabase.auth.updateUser({ password: values.new_password });
      if (updateError) throw updateError;
      toast({ title: "Success", description: "Password updated successfully" });
      passwordForm.reset();
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    finally { setSavingPassword(false); }
  };

  return (
    <>
      <SEOHead title="Change Password" noIndex />
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <motion.div variants={itemVariants} className="rounded-xl border border-border/50 bg-card p-5 hover:shadow-md transition-all border-l-[3px] border-l-primary">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-primary/10 p-2"><Lock className="h-5 w-5 text-primary" /></div>
                <div>
                  <h3 className="font-semibold">{t('account.changePassword')}</h3>
                  <p className="text-xs text-muted-foreground">{t('account.updatePassword')}</p>
                </div>
              </div>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField control={passwordForm.control} name="current_password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('account.currentPassword')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-10 pr-10" type={showCurrentPassword ? "text" : "password"} placeholder={t('account.currentPassword')} {...field} />
                          <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                            {showCurrentPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={passwordForm.control} name="new_password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('account.newPassword')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-10 pr-10" type={showNewPassword ? "text" : "password"} placeholder={t('account.newPassword')} {...field} />
                          <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowNewPassword(!showNewPassword)}>
                            {showNewPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                          </Button>
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground">{t('account.passwordHint')}</p>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={passwordForm.control} name="confirm_password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('account.confirmPassword')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-10 pr-10" type={showConfirmPassword ? "text" : "password"} placeholder={t('account.confirmPassword')} {...field} />
                          <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={savingPassword}>
                    {savingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Update Password
                  </Button>
                </form>
              </Form>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div variants={itemVariants} className="rounded-xl border border-border/50 bg-card p-5 hover:shadow-md transition-all border-l-[3px] border-l-accent">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-accent/10 p-2"><ShieldCheck className="h-5 w-5 text-accent" /></div>
                <div>
                  <h3 className="font-semibold">Password Requirements</h3>
                  <p className="text-xs text-muted-foreground">Your password must meet these criteria</p>
                </div>
              </div>
              <ul className="space-y-3 text-sm">
                {["At least 8 characters long", "Contains at least one uppercase letter (A-Z)", "Contains at least one lowercase letter (a-z)", "Contains at least one number (0-9)"].map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />{tip}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={itemVariants} className="rounded-xl border border-border/50 bg-card p-5 hover:shadow-md transition-all border-l-[3px] border-l-muted">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-muted p-2"><FileText className="h-5 w-5 text-muted-foreground" /></div>
                <div>
                  <h3 className="font-semibold">Security Tips</h3>
                  <p className="text-xs text-muted-foreground">Keep your account secure</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["Never share your password with anyone", "Change your password regularly for added security", "Don't reuse passwords across different websites"].map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />{tip}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
