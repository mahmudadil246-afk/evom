import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MessageCircleQuestion, ChevronDown, ChevronUp, ThumbsUp, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface QAItem {
  id: string;
  question: string;
  answer: string | null;
  asked_by_name: string;
  helpful_count: number;
  created_at: string;
  answered_at: string | null;
}

interface ProductQAProps {
  productId: string;
}

export function ProductQA({ productId }: ProductQAProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [askerName, setAskerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, [productId]);

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from('product_questions' as any)
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    setQuestions((data as any[]) || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!newQuestion.trim()) { toast.error('Please enter your question'); return; }
    if (!user && !askerName.trim()) { toast.error('Please enter your name'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('product_questions' as any).insert({
      product_id: productId,
      question: newQuestion.trim(),
      asked_by_name: user ? (user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer') : askerName.trim(),
      user_id: user?.id || null,
    });

    if (error) {
      toast.error('Failed to submit question');
    } else {
      toast.success('Question submitted! We\'ll answer it soon.');
      setNewQuestion('');
      setAskerName('');
      setShowForm(false);
      fetchQuestions();
    }
    setSubmitting(false);
  };

  const handleHelpful = async (id: string) => {
    const key = `qa_helpful_${id}`;
    if (localStorage.getItem(key)) { toast.info('You already marked this as helpful'); return; }
    
    const q = questions.find(q => q.id === id);
    if (!q) return;
    
    await supabase.from('product_questions' as any)
      .update({ helpful_count: (q.helpful_count || 0) + 1 })
      .eq('id', id);
    localStorage.setItem(key, '1');
    fetchQuestions();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircleQuestion className="h-5 w-5 text-store-primary" />
          <h3 className="text-lg font-semibold text-foreground">Questions & Answers</h3>
          {questions.length > 0 && (
            <span className="text-sm text-muted-foreground">({questions.length})</span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="border-store-primary text-store-primary hover:bg-store-primary/10"
        >
          Ask a Question
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3 animate-fade-in">
          {!user && (
            <Input
              placeholder="Your name"
              value={askerName}
              onChange={e => setAskerName(e.target.value)}
              className="bg-background"
            />
          )}
          <Textarea
            placeholder="What would you like to know about this product?"
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            rows={3}
            className="bg-background resize-none"
          />
          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              size="sm"
              className="bg-store-primary hover:bg-store-primary/90"
              onClick={handleSubmit}
              disabled={submitting}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {submitting ? 'Submitting...' : 'Submit Question'}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircleQuestion className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">No questions yet. Be the first to ask!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => (
            <div
              key={q.id}
              className="rounded-xl border border-border bg-card hover:border-border/80 transition-colors"
            >
              <button
                className="w-full text-left p-4 flex items-start gap-3"
                onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
              >
                <span className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-store-primary/10 text-store-primary flex items-center justify-center text-xs font-bold">Q</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{q.question}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {q.asked_by_name} · {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                  </p>
                </div>
                {q.answer ? (
                  expandedId === q.id ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                ) : (
                  <span className="text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full shrink-0">Awaiting answer</span>
                )}
              </button>
              {q.answer && expandedId === q.id && (
                <div className="px-4 pb-4 animate-fade-in">
                  <div className="flex items-start gap-3 pl-9">
                    <span className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold">A</span>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{q.answer}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleHelpful(q.id); }}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-store-primary transition-colors"
                        >
                          <ThumbsUp className="h-3 w-3" />
                          Helpful ({q.helpful_count || 0})
                        </button>
                        {q.answered_at && (
                          <span className="text-xs text-muted-foreground">
                            Answered {formatDistanceToNow(new Date(q.answered_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
