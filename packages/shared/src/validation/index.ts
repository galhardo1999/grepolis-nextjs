// ============================================================
// SHARED VALIDATION SCHEMAS - Zod schemas used across Backend and Frontend
// ============================================================

import { z } from 'zod';

// Auth Validation
export const LoginSchema = z.object({
  username: z.string().min(3).max(20),
  senha: z.string().min(6).max(100),
});

export const RegisterSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Apenas letras, números e underscore'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6).max(100),
});

// Game Actions Validation
export const ConstrucaoSchema = z.object({
  aldeiaId: z.string().uuid(),
  edificio: z.string(),
});

export const RecrutamentoSchema = z.object({
  aldeiaId: z.string().uuid(),
  unidade: z.string(),
  quantidade: z.number().int().positive().max(1000),
});

export const PesquisaSchema = z.object({
  aldeiaId: z.string().uuid(),
  pesquisa: z.string(),
});

export const AtaqueSchema = z.object({
  origemId: z.string().uuid(),
  destinoId: z.string().uuid(),
  unidades: z.record(z.string(), z.number().int().positive()),
});

// Alliance Validation
export const CriarAliancaSchema = z.object({
  nome: z.string().min(3).max(50),
  tag: z.string().min(2).max(5).regex(/^[A-Z0-9]+$/, 'Apenas letras maiúsculas e números'),
  descricao: z.string().max(500),
});

export const ConvidarMembroSchema = z.object({
  aliacaId: z.string().uuid(),
  username: z.string().min(3).max(20),
});

// Message Validation
export const EnviarMensagemSchema = z.object({
  destinatarioId: z.string().uuid(),
  titulo: z.string().min(1).max(100),
  conteudo: z.string().min(1).max(2000),
});

// Building Validation
export const EdificioSchema = z.object({
  nome: z.string(),
  nivel: z.number().int().min(0).max(40),
});

// Unit Validation
export const UnidadeSchema = z.object({
  nome: z.string(),
  quantidade: z.number().int().min(0).max(10000),
});

// Resource Trade Validation
export const TrocaSchema = z.object({
  recursoOferecido: z.string(),
  quantidadeOferecida: z.number().positive(),
  recursoDesejado: z.string(),
  quantidadeDesejada: z.number().positive(),
});

// Map Validation
export const CoordenadasSchema = z.object({
  x: z.number().int().min(-50).max(50),
  y: z.number().int().min(-50).max(50),
});

// Mission Validation
export const MissaoProgressoSchema = z.object({
  missaoId: z.string(),
  progresso: z.number().int().min(0),
});

// Event Validation
export const EventoSchema = z.object({
  titulo: z.string().min(1).max(100),
  descricao: z.string().max(500),
  tipo: z.enum(['bonus', 'especial', 'temporario']),
  inicio: z.number().positive(),
  fim: z.number().positive(),
});

// Export type inference helpers
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ConstrucaoInput = z.infer<typeof ConstrucaoSchema>;
export type RecrutamentoInput = z.infer<typeof RecrutamentoSchema>;
export type PesquisaInput = z.infer<typeof PesquisaSchema>;
export type AtaqueInput = z.infer<typeof AtaqueSchema>;
export type CriarAliancaInput = z.infer<typeof CriarAliancaSchema>;
export type EnviarMensagemInput = z.infer<typeof EnviarMensagemSchema>;
export type TrocaInput = z.infer<typeof TrocaSchema>;
export type CoordenadasInput = z.infer<typeof CoordenadasSchema>;
