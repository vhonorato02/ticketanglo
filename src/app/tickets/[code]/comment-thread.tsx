'use client';

import { useRef, useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { addComment } from '@/actions/comments';

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

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function CommentThread({ ticketCode, comments }: CommentThreadProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = fd.get('body') as string;
    if (!body.trim()) return;

    startTransition(async () => {
      const res = await addComment(ticketCode, fd);
      if (res && 'error' in res) {
        toast.error(res.error);
      } else {
        toast.success('Comentário adicionado.');
        formRef.current?.reset();
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <MessageSquare className="size-3.5" />
        Comentários ({comments.length})
      </h2>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum comentário ainda. Registre uma atualização abaixo.
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="size-7 shrink-0 mt-0.5">
                <AvatarFallback className="text-xs">
                  {initials(comment.authorName ?? '?')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium">{comment.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap rounded-lg bg-muted/30 border px-3 py-2">
                  {comment.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Novo comentário */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          ref={textareaRef}
          name="body"
          placeholder="Atualização, dúvida ou observação... (Cmd+Enter para enviar)"
          className="min-h-[80px]"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            Comentar
          </Button>
        </div>
      </form>
    </div>
  );
}
