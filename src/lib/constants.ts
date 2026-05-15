export const TI_SUBCATEGORIES = [
  'Rede',
  'Computador',
  'Impressora',
  'Projetor',
  'Som',
  'Software',
  'Acesso',
  'Outro',
] as const;

export const MKT_SUBCATEGORIES = [
  'Post Instagram',
  'Comunicado pais',
  'Arte impressa',
  'Vídeo',
  'Evento',
  'Fotografia',
  'Site',
  'Outro',
] as const;

export const STATUS_LABELS = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  aguardando: 'Aguardando',
  resolvido: 'Resolvido',
  arquivado: 'Arquivado',
} as const;

export const PRIORITY_LABELS = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
} as const;

export const AREA_LABELS = {
  TI: 'TI',
  MKT: 'Marketing',
} as const;

export const STATUS_ORDER = [
  'aberto',
  'em_andamento',
  'aguardando',
  'resolvido',
  'arquivado',
] as const;

export const PRIORITY_ORDER = ['urgente', 'alta', 'media', 'baixa'] as const;
