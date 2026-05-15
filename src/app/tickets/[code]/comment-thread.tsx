'use client';

import { useRef, useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, MessageSquare, SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { addComment } from '@/actions/comments';
import { copy } from '@/lib/copy';
import { initials } from '@/lib/format';

interface Comment {
  id: string;
  body: string;
  createdAt: Date;
  authorId: string | null;
  authorName: string | null;
}

interface CommentThreadProps {
  ticketCode: string;
  comments: Comment[];
  currentUserId: string;
}

export function CommentThread({ ticketCode, comments }: CommentThreadProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const body = String(formData.get('body') ?? '').trim();
    if (!body) return;

    startTransition(async () => {
      const result = await addComment(ticketCode, formData);
      if (result && 'error' in result) {
        toast.error(result.error);
        return;
      }

      formRef.current?.reset();
      router.refresh();
    });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <MessageSquare className="size-3.5" />
        {comments.length === 0 ? copy.tickets.comments.title : copy.tickets.comments.count(comments.length)}
      </h2>

      {comments.length > 0 && (
        <div className="space-y-4">
          {comments.map((comment) => {
            const authorName = comment.authorName ?? copy.tickets.comments.anonymous;
            return (
              <article key={comment.id} className="flex gap-3">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                    {initials(authorName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium">{authorName}</span>
                    <time
                      dateTime={new Date(comment.createdAt).toISOString()}
                      className="text-xs text-muted-foreground"
                    >
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </time>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap rounded-lg bg-muted/40 border border-border/60 px-3.5 py-2.5">
                    {comment.body}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          name="body"
          placeholder={copy.tickets.comments.placeholder}
          className="min-h-[88px]"
          disabled={isPending}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground hidden sm:block">
            {copy.tickets.comments.shortcut}
          </p>
          <Button type="submit" size="sm" disabled={isPending} className="ml-auto gap-1.5">
            {isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <SendHorizontal className="size-3.5" />
            )}
            {copy.tickets.comments.submit}
          </Button>
        </div>
      </form>
    </section>
  );
}
