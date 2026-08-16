# 🥋 BJJ Academy SaaS — Gestão Inteligente para Academias e Escolas de Jiu-Jitsu

Plataforma completa de gestão de academias de Brazilian Jiu-Jitsu e artes marciais com arquitetura **Multi-Tenant**, integração financeira com **Split de Pagamentos / Asaas (PIX, Boleto e Cartão)**, **Chamada por Foto do Tatame com IA (Gemini Vision)**, **AI Coach & Prevenção de Churn**, **CRM de Captação** e **Aplicativo Mobile do Aluno**.

---

## 🌟 Funcionalidades Principais

### 1. 🏢 Arquitetura Multi-Tenant & Gestão Multi-Unidades
- **Isolamento Completo:** Alterne instantaneamente entre a visão Master (Super Admin) e filiais/unidades individuais.
- **Gestão de Unidades:** Cadastro de academias, dados cadastrais, endereço, instrutores responsáveis, capacidade e métricas financeiras segregadas por unidade.
- **Cadastro Centralizado de Alunos e Professores:** Perfis completos com foto, faixa atual, graus, categoria (Kids, Adulto, Master), plano contratado e histórico de treinos.

### 2. 📸 Chamada por Foto com Gemini Vision AI
- **Reconhecimento em Lote no Tatame:** Faça o upload ou capture a foto da turma reunida no tatame após o treino.
- **Identificação Visual Inteligente:** O modelo **Gemini Vision AI** escaneia feições e faixas dos praticantes, cruzando com o cadastro da academia.
- **Confirmação Instantânea:** Check-in em lote com 1 clique, atualizando a contagem de presenças e o histórico de frequência dos atletas.

### 3. 💳 Módulo Financeiro Completo & Split de Pagamentos (Asaas)
- **Subcontas por Academia:** Arquitetura preparada para repasse automático e Split de pagamentos direto para a conta de cada unidade.
- **Formas de Pagamento:**
  - **PIX:** Geração instantânea de QR Code dinâmico e código Pix Copia e Cola.
  - **Boleto Bancário:** Emissão e controle de compensação.
  - **Cartão de Crédito:** Checkout e tokenização segura.
- **Gestão de Inadimplência:** Cálculo automático de juros e multas por dia de atraso, com disparo de alertas de cobrança e renegociação via WhatsApp.
- **Extrato & Relatórios:** Filtros por período, aluno, unidade, forma de pagamento e exportação de relatórios.

### 4. 🥋 Gestão de Treinos, Grade Horária & Graduações
- **Controle de Presença Diário:** Lista de presença por turma e horário com marcação rápida.
- **Quadro de Graduação Automático:** Algoritmo calcula os atletas aptos para graduação de faixa e graus com base no tempo de prática e número de presenças no tatame.
- **Currículo Técnico:** Biblioteca de posições (Passagens, Raspagens, Finalizações, Quedas) catalogadas por nível e faixa.

### 5. 🤖 AI Coach & Prevenção Inteligente de Evasão (Churn)
- **Algoritmo de Risco de Churn:** Identifica alunos com queda drástica de frequência nos últimos 30 dias.
- **Plano de Estudos Personalizado:** IA analisa pontos fortes e vulnerabilidades do jogo do atleta e gera cronogramas de treino focados.
- **Mensagens de Reengajamento:** Geração de mensagens humanizadas prontas para envio no WhatsApp do atleta.

### 6. 🎯 CRM de Vendas & Funil de Aulas Experimentais
- **Pipeline de Matrículas:** Acompanhamento de leads desde o primeiro contato, agendamento de aula experimental até a assinatura do plano.
- **Métricas de Conversão:** Taxa de fechamento por canal de aquisição (Instagram, Indicação, Google, Parcerias).

### 7. 📱 Simulador do Aplicativo Mobile do Aluno
- **Carteirinha Digital:** QR Code de identificação do aluno com foto, faixa e validade do plano.
- **Histórico de Treinos:** Linha do tempo de frequência e contagem regressiva para a próxima graduação.
- **Pagamento Direto no App:** Aluno visualiza mensalidades abertas e paga na hora via PIX ou Cartão.

### 8. 👨‍👩‍👧 Portal dos Pais (Turmas Kids)
- **Acompanhamento Infantil:** Feedback sobre disciplina, foco, frequência e conquistas dos pequenos guerreiros.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Motion, Lucide React |
| **Backend** | Node.js, Express, TSX, ESBuild |
| **Inteligência Artificial** | Google GenAI SDK (`@google/genai`), Gemini 3.6 Flash & Vision |
| **Bundler & Build** | Vite 6 |
| **Estilos & UI** | Tailwind CSS v4 com design dark-mode esportivo moderno |

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- **Node.js** 18 ou superior instalado.
- **NPM** ou gerenciador de pacotes equivalente.

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/bjj-academy-saas.git
cd bjj-academy-saas
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie ou edite o arquivo `.env` na raiz do projeto:
```env
# Chave da API do Google Gemini (para recursos de IA e Visão Computacional)
GEMINI_API_KEY=sua_chave_gemini_aqui

# Porta padrão de execução
PORT=3000
```

### 4. Executar em Modo de Desenvolvimento
```bash
npm run dev
```
O servidor iniciará em `http://localhost:3000`.

### 5. Compilar para Produção
```bash
npm run build
npm start
```

---

## 📁 Estrutura de Pastas

```
├── .env.example                 # Exemplo de variáveis de ambiente
├── AGENTS.md                    # Diretrizes do sistema e roadmap de inovação
├── metadata.json                # Metadados e permissões da aplicação
├── package.json                 # Dependências e scripts
├── server.ts                    # Backend Express & Rotas de API Gemini
├── src/
│   ├── main.tsx                 # Ponto de entrada React
│   ├── App.tsx                  # Estrutura principal e gerenciador de estado global
│   ├── index.css                # Estilos globais e Tailwind CSS
│   ├── types.ts                 # Tipagens e interfaces TypeScript
│   ├── data.ts                  # Mock data inicial para testes multi-tenant
│   └── components/
│       ├── AcademyManager.tsx       # Gestão de Academias e Unidades
│       ├── AiCoachView.tsx          # AI Coach & Análise Preditiva de Churn
│       ├── CrmMarketingView.tsx     # Funil de Vendas de Aulas Experimentais
│       ├── DashboardView.tsx        # Dashboard Executivo com KPIs
│       ├── FinanceView.tsx          # Gestão Financeira, PIX, Asaas & Split
│       ├── MobileSimulator.tsx      # App Mobile do Aluno
│       ├── ParentsPortal.tsx        # Portal dos Pais e Turma Kids
│       ├── PhotoAttendanceModal.tsx # Modal de Chamada por Foto com Gemini Vision
│       ├── StudentRegistrationModal.tsx # Cadastro de Alunos
│       └── TrainingManager.tsx      # Treinos, Chamada e Graduações
```

---

## 🔌 Principais Endpoints da API Backend (`server.ts`)

- `POST /api/ai/coach` — Análise de treino, sugestão de currículo e estudo personalizado via Gemini.
- `POST /api/ai/photo-attendance` — Processamento de fotos do tatame para reconhecimento de alunos e faixas.
- `GET /api/health` — Verificação de saúde da aplicação.

---

## 🔮 Roadmap de Inovações Futuras

- [ ] **Integração de Catraca & Câmera IP:** Check-in por reconhecimento facial em tempo real na recepção.
- [ ] **WhatsApp Bot Automatizado:** Atendimento inteligente para agendamento de aulas experimentais 24/7.
- [ ] **Passaporte BJJ:** Check-in via QR Code para alunos treinarem em academias conveniadas e filiais durante viagens.
- [ ] **Gamificação & Badges:** Conquistas por consistência ("100 Treinos no Ano", "Mestre da Guarda").

---

## 📄 Licença
Distribuído sob a licença **MIT**. Consulte `LICENSE` para mais informações.
