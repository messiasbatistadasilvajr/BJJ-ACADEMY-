# BJJ SaaS Academy - Guia de Contexto & Roadmap do Projeto

Este arquivo contém as diretrizes do projeto e o backlog de melhorias e funcionalidades modernas planejadas para implementações futuras.

---

## 📌 Contexto Atual do Sistema
- **Plataforma:** BJJ Academy SaaS - Gestão Inteligente para Academias e Escolas de Jiu-Jitsu.
- **Arquitetura:** Multi-Tenant (Cada academia possui ambiente e cadastro de alunos isolados).
- **Recursos Chave Implementados:**
  1. **Cadastro Completo por Academia:** Relação de alunos com separação e filtro individual por unidade.
  2. **Chamada por Foto com Gemini Vision AI:** Processamento de imagens do tatame para reconhecimento e confirmação automática de presença de atletas em lote.
  3. **Integração de Pagamentos:** Gestão de mensalidades, faturas em atraso e cobranças automáticas via Asaas (PIX, Boleto e Cartão de Crédito).
  4. **Controle de Graduações:** Gestão de faixas, graus, exames de graduação e histórico de presenças.
  5. **Simulador Mobile:** Aplicativo nativo para o aluno acompanhar treinos, presenças, cobranças e carteirinha digital.

---

## 🚀 Roadmap de Funcionalidades Modernas (Backlog Salvo)

As seguintes ideias foram aprovadas para implementação em etapas futuras do sistema:

### 1. 🤖 AI Churn Prevention (Prevenção Inteligente de Evasão)
- **O que é:** Algoritmo preditivo de IA que analisa a queda de frequência dos alunos nos últimos 30 dias.
- **Ação Automática:** Alerta a recepção/mestre antes que o aluno cancele o plano e dispara mensagens no WhatsApp do aluno para reengajamento.

### 2. 📹 Catraca & CFTV Inteligente (Check-in por Reconhecimento Facial em Tempo Real)
- **O que é:** Integração da câmera IP da recepção/catraca para identificar o aluno ao entrar na academia.
- **Ação Automática:** Liberação automática da catraca/porta e registro imediato do check-in no sistema sem necessidade de carteirinha física.

### 3. 🥋 Prescrição de Treinos & Correção por IA
- **O que é:** Assistente técnico de Jiu-Jitsu que analisa pontos fracos do atleta (ex: passagem de guarda, defesa de finalizações).
- **Ação Automática:** Gera rotinas personalizadas de posições para cada atleta com base no seu nível e estilo de jogo.

### 4. 🏆 Gamificação, Conquistas & Ranking da Academia
- **O que é:** Sistema de experiência (XP), badges ("Guerreiro do Tatame", "100 Treinos no Ano", "Inabalável") e leaderboard mensal.
- **Ação Automática:** Aumenta a retenção de alunos transformando a consistência dos treinos em conquistas visuais no app do aluno.

### 5. 📲 WhatsApp CRM & Bot de Vendas de Aulas Experimentais
- **O que é:** Funil automático de captação de novos alunos (Leads) via WhatsApp.
- **Ação Automática:** Responde dúvidas sobre horários, planos e agenda aula experimental automaticamente.

### 6. 🌐 Passaporte BJJ (Intercâmbio Entre Academias)
- **O que é:** QR Code no app do aluno que permite treinar em unidades parceiras ou filiais do mesmo grupo quando estiver viajando.
- **Ação Automática:** Validação de adimplência em tempo real e check-in como visitante.

---

## 🛠️ Regras de Desenvolvimento
- Manter suporte a TypeScript e Tailwind CSS.
- Preservar integridade multi-tenant em todas as novas rotas/componentes.
- Garantir validação e tratamento de exceções em rotas de API do backend em `server.ts`.
