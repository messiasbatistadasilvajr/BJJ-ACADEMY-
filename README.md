# 🥋 BJJ-Enterprise v1.0 — Enterprise SaaS Platform for Brazilian Jiu-Jitsu Academies & Franchises

> **Plataforma Enterprise de Gestão Inteligente, Billing Recorrente com Split Asaas, Chamada por Visão Computacional (Gemini Vision) e Prevenção de Churn por IA para Academias e Redes de Jiu-Jitsu.**

---

## 📑 Sumário

- [1. Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
- [2. Arquitetura Multi-Tenant & Governança](#2-arquitetura-multi-tenant--governança)
- [3. Módulo Financeiro & Integração Asaas (Split de Pagamentos)](#3-módulo-financeiro--integração-asaas-split-de-pagamentos)
- [4. Capacidades da Plataforma](#4-capacidades-da-plataforma)
  - [4.1 Gestão de Unidades & Academias](#41-gestão-de-unidades--academias)
  - [4.2 Chamada por Foto com Gemini Vision AI](#42-chamada-por-foto-com-gemini-vision-ai)
  - [4.3 AI Coach & Prevenção Inteligente de Evasão (Churn)](#43-ai-coach--prevenção-inteligente-de-evasão-churn)
  - [4.4 CRM & Funil de Aulas Experimentais](#44-crm--funil-de-aulas-experimentais)
  - [4.5 Gestão de Treinos & Sistema de Graduação](#45-gestão-de-treinos--sistema-de-graduação)
  - [4.6 Aplicativo Mobile do Aluno](#46-aplicativo-mobile-do-aluno)
  - [4.7 Portal dos Pais (Kids & Juvenil)](#47-portal-dos-pais-kids--juvenil)
- [5. Tecnologias Utilizadas](#5-tecnologias-utilizadas)
- [6. Configuração do Ambiente & Execução](#6-configuração-do-ambiente--execução)
- [7. Endpoints da API Backend (`server.ts`)](#7-endpoints-da-api-backend-serverts)
- [8. Exportação & Sincronização com o GitHub](#8-exportação--sincronização-com-o-github)

---

## 1. Visão Geral da Arquitetura

O **BJJ-Enterprise v1.0** foi projetado para atender tanto academias individuais quanto grandes redes e franquias de artes marciais. O sistema desacopla a camada de apresentação, a lógica de negócios e os serviços de inteligência artificial através de microsserviços e rotas de backend dedicadas.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BJJ-ENTERPRISE v1.0                           │
│     (React 19 + TypeScript + Tailwind CSS v4 + Motion + Lucide)         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   Multi-Tenant   │       │ Módulo Financeiro│       │  Motor Gemini AI │
│   & Unidades     │       │ (Asaas / Split)  │       │ (Vision & Coach) │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

---

## 2. Arquitetura Multi-Tenant & Governança

A estrutura do BJJ-Enterprise garante o **isolamento lógico completo** entre diferentes unidades ou franquias:

- **Identificadores de Tenant:** Todos os registros de alunos, instrutores, turmas, cobranças e históricos possuem indexação por `tenantId` / `academyId`.
- **Controle de Acesso RBAC (Role-Based Access Control):**
  - **Super Admin (Master):** Acesso consolidado a todas as unidades, métricas globais de faturamento, retenção e taxas de conversão.
  - **Gestor de Unidade (Filial):** Visualização restrita aos alunos, despesas, turmas e fluxo financeiro da sua própria academia.
  - **Instrutores & Professores:** Acesso à lista de chamada, graduações, currículo técnico e portal kids.
  - **Alunos:** Interface mobile dedicada com carteirinha, histórico de treinos e pagamento de mensalidades.

---

## 3. Módulo Financeiro & Integração Asaas (Split de Pagamentos)

O BJJ-Enterprise opera como um hub financeiro completo, projetado no modelo de **Subcontas e Split de Pagamentos**:

```
                         BJJ ENTERPRISE SAAS
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
            Academia A                      Academia B
          (Subconta A)                    (Subconta B)
                 │                               │
            Alunos A                        Alunos B
                 │                               │
           Cobranças PIX/Cartão            Cobranças PIX/Cartão
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
                     Gateway Asaas / PSP
                                 │
                   Processamento & Validação
                                 │
                    Repasse Automático Líquido
```

### Principais Características Financeiras:
1. **Métodos de Cobrança:**
   - **PIX Dinâmico:** Geração de QR Code dinâmico e código Pix Copia e Cola instantâneo com conciliação automática.
   - **Boleto Bancário:** Registro e compensação bancária automática.
   - **Cartão de Crédito:** Tokenização segura via gateway (sem armazenamento de dados sensíveis de cartão no banco local).
2. **Split de Pagamentos & Repasses:**
   - Cálculo no backend da taxa da plataforma e repasse líquido direto para a subconta da academia.
3. **Gestão de Inadimplência Automatizada:**
   - Cálculo de multas percentuais e juros diários por dia de atraso.
   - Disparo de notificações de lembrete e cobrança com links de pagamento via WhatsApp.
4. **Webhooks Idempotentes:**
   - Tratamento com identificador único (`eventId` + `provider`) para evitar processamento duplicado de pagamentos ou estornos.
5. **Extrato Financeiro & Conciliação:**
   - Filtros por período, aluno, unidade, forma de pagamento e exportação de relatórios em CSV/PDF.

---

## 4. Capacidades da Plataforma

### 4.1 Gestão de Unidades & Academias
- Painel para cadastrar matrizes e filiais com capacidade de tatame, quadro de professores e métricas de desempenho.
- Configuração de planos (Mensal, Trimestral, Semestral, Anual) específicos por unidade.

### 4.2 Chamada por Foto com Gemini Vision AI
- **Chamada Automatizada:** O professor faz uma foto da turma no tatame ao final da aula.
- O modelo **Gemini Vision** analisa a imagem, detecta os atletas presentes e identifica as cores das faixas.
- Confirmação de presença em lote com 1 clique, atualizando o histórico do aluno e os requisitos de graduação.

### 4.3 AI Coach & Prevenção Inteligente de Evasão (Churn)
- **Prevenção de Evasão:** Algoritmo preditivo que monitora o declínio de presenças nos últimos 30 dias e sugere ações imediatas de reengajamento.
- **Plano de Estudos Personalizado:** IA analisa pontos fracos do atleta (ex: guarda, passagens, defesa) e cria rotinas técnicas sob medida.

### 4.4 CRM & Funil de Aulas Experimentais
- Pipeline visual no estilo Kanban para acompanhar potenciais alunos (Leads) desde o primeiro contato até a matrícula.
- Automação de lembretes para agendamento de aulas experimentais.

### 4.5 Gestão de Treinos & Sistema de Graduação
- Registro de turmas por nível (Iniciante, Avançado, No-Gi, Competição, Kids).
- Algoritmo que calcula automaticamente a elegibilidade para novas faixas e graus com base em dias de treino e tempo de prática.
- Currículo técnico com biblioteca de posições catalogadas.

### 4.6 Aplicativo Mobile do Aluno
- Carteirinha digital com QR Code para acesso e check-in.
- Linha do tempo de frequência e contagem de presenças para o próximo grau.
- Pagamento de mensalidades pendentes diretamente pelo celular.

### 4.7 Portal dos Pais (Kids & Juvenil)
- Canal dedicado para pais e responsáveis acompanharem o desenvolvimento, pontualidade, disciplina e evolução marcial dos filhos.

---

## 5. Tecnologias Utilizadas

| Camada | Tecnologia | Descrição |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript | Interface reativa e fortemente tipada |
| **Estilos & UI** | Tailwind CSS v4 | Estilização utilitária de alta performance |
| **Animações** | Motion (`motion/react`) | Transições fluidas e microinterações |
| **Ícones** | Lucide React | Conjunto moderno de ícones vetoriais |
| **Backend & Servidor** | Node.js + Express + TSX | Servidor de desenvolvimento e API em tempo real |
| **Inteligência Artificial** | `@google/genai` (Gemini 3.6 Flash / Vision) | Visão computacional e AI Coach |
| **Build & Bundling** | Vite 6 + ESBuild | Compilação otimizada para containers |

---

## 6. Configuração do Ambiente & Execução

### Pré-requisitos
- **Node.js** 18 ou superior instalado.
- **NPM** instalado.

### 1. Clonar e Instalar
```bash
git clone https://github.com/seu-usuario/bjj-enterprise.git
cd bjj-enterprise
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:
```env
# Chave da API Gemini (Google AI Studio)
GEMINI_API_KEY=sua_chave_gemini_aqui

# Porta do servidor (padrão 3000)
PORT=3000
```

### 3. Iniciar em Desenvolvimento
```bash
npm run dev
```
Acesse a aplicação em `http://localhost:3000`.

### 4. Build de Produção
```bash
npm run build
npm start
```

---

## 7. Endpoints da API Backend (`server.ts`)

- `POST /api/ai/coach` — Análise técnica e plano de estudos personalizado via Gemini.
- `POST /api/ai/photo-attendance` — Reconhecimento visual em lote de atletas no tatame.
- `GET /api/health` — Verificação de status e integridade do servidor.

---

## 8. Exportação & Sincronização com o GitHub

Para sincronizar este projeto com seu repositório no **GitHub**:

1. No painel superior do **Google AI Studio**, clique no menu de opções (ícone de engrenagem ou botão **Export**).
2. Selecione **Export to GitHub** (ou baixe como **ZIP** caso queira subir manualmente).
3. Autorize sua conta do GitHub para criar o repositório e sincronizar todos os commits e arquivos (`README.md`, `server.ts`, `src/`, `AGENTS.md`, etc.).

---

## 📄 Licença
Projeto distribuído sob a licença **MIT**.
