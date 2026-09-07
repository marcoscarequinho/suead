// Controle de acesso por materia.
//
// So entra em jogo para quem tem assinatura ativa do plano "Por Materia"
// (ou isencao de escopo 'materia'): essas contas so acessam a materia
// escolhida no checkout (ou liberada por isencao), nao o catalogo inteiro.
// Visitante, aluno sem plano e assinantes de combo/completo continuam
// exatamente como hoje — isto nao e um paywall geral do site.

import { assinaturaAtiva } from '../repositories/assinaturas.js';
import { isencaoAtiva } from '../repositories/isencoes.js';

/**
 * true quando o aluno logado NAO pode acessar esta materia.
 * alunoId ausente (visitante) nunca bloqueia.
 */
export async function materiaBloqueada(alunoId, materiaSlug) {
  if (!alunoId) return false;

  const isencao = await isencaoAtiva(alunoId);
  if (isencao) {
    if (isencao.escopo === 'total') return false;
    // Isencao de materia especifica: libera so aquela, bloqueia as outras
    // exatamente como uma assinatura "Por Materia" faria.
    return isencao.materia_slug !== materiaSlug;
  }

  const assinatura = await assinaturaAtiva(alunoId);
  if (!assinatura || assinatura.plano_codigo !== 'materia') return false;

  return assinatura.materia_escolhida && assinatura.materia_escolhida !== materiaSlug;
}
