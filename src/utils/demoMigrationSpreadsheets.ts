import * as XLSX from "xlsx";

export interface DemoSpreadsheet {
  id: string;
  name: string;
  filename: string;
  description: string;
  sourceSystem: string;
  rowsCount: number;
  data: Record<string, string>[];
}

export const DEMO_SPREADSHEETS: DemoSpreadsheet[] = [
  {
    id: "demo-alliance",
    name: "Exportação Completa de Alunos (Sistema Antigo)",
    filename: "Planilha_Alunos_Antigo_Sistema_2026.xlsx",
    description: "Planilha padrão com 20 alunos, faixas coloridas, dados cadastrais, mensalidades e observações de tatame.",
    sourceSystem: "NextFit / Tecnofit / Evo Export",
    rowsCount: 20,
    data: [
      { "Nome do Atleta": "Gabriel 'Mão de Pedra' Silva", "CPF": "129.847.291-09", "E-mail": "gabriel.pedra@gmail.com", "Celular WhatsApp": "(11) 98112-9901", "Faixa Atual": "Azul", "Graus": "2", "Categoria": "Adulto", "Data Nascimento": "14/05/1996", "Plano": "Mensal", "Valor Mensalidade": "260.00", "Dia Vencimento": "10", "Status Financeiro": "Pago", "Frequência Treinos": "14", "Observações": "Foco em passagem de guarda e competições estaduais" },
      { "Nome do Atleta": "Matheus 'Pitbull' Oliveira", "CPF": "381.992.110-44", "E-mail": "matheus.pitbull@hotmail.com", "Celular WhatsApp": "(11) 97654-3210", "Faixa Atual": "Roxa", "Graus": "3", "Categoria": "Adulto", "Data Nascimento": "20/09/1993", "Plano": "Anual", "Valor Mensalidade": "220.00", "Dia Vencimento": "05", "Status Financeiro": "Pago", "Frequência Treinos": "18", "Observações": "Auxilia nos treinos de iniciantes aos sábados" },
      { "Nome do Atleta": "Enzo Gabriel Silveira", "CPF": "512.441.982-15", "E-mail": "enzo.bjj@gmail.com", "Celular WhatsApp": "(11) 99123-4567", "Faixa Atual": "Amarela", "Graus": "1", "Categoria": "Kids / Infantil", "Data Nascimento": "10/03/2015", "Plano": "Mensal", "Valor Mensalidade": "230.00", "Dia Vencimento": "10", "Status Financeiro": "Pago", "Frequência Treinos": "8", "Nome Responsável": "Juliana Silveira (Mãe)", "Telefone Responsável": "(11) 99123-4560", "Observações": "Turma Infantil Kids 2. Alergia a poeira." },
      { "Nome do Atleta": "Beatriz 'Onça' Guimarães", "CPF": "449.102.839-82", "E-mail": "beatriz.onca@yahoo.com.br", "Celular WhatsApp": "(11) 98877-6655", "Faixa Atual": "Marrom", "Graus": "1", "Categoria": "Adulto", "Data Nascimento": "08/11/1991", "Plano": "Semestral", "Valor Mensalidade": "240.00", "Dia Vencimento": "15", "Status Financeiro": "Pago", "Frequência Treinos": "16", "Observações": "Treinos na turma feminina e no tatame principal" },
      { "Nome do Atleta": "Lucas Andrade Ferraz", "CPF": "291.884.739-11", "E-mail": "lucas.ferraz@outlook.com", "Celular WhatsApp": "(11) 97711-2233", "Faixa Atual": "Branca", "Graus": "4", "Categoria": "Adulto", "Data Nascimento": "22/01/2000", "Plano": "Mensal", "Valor Mensalidade": "250.00", "Dia Vencimento": "20", "Status Financeiro": "Atrasado", "Frequência Treinos": "6", "Observações": "Pronto para exame de graduação para Faixa Azul" },
      { "Nome do Atleta": "Bernardo Faria Junior", "CPF": "610.993.441-29", "E-mail": "bernardo.junior@gmail.com", "Celular WhatsApp": "(11) 98234-5678", "Faixa Atual": "Preta", "Graus": "2", "Categoria": "Adulto", "Data Nascimento": "19/07/1986", "Plano": "Anual", "Valor Mensalidade": "200.00", "Dia Vencimento": "10", "Status Financeiro": "Pago", "Frequência Treinos": "20", "Observações": "Professor faixa preta credenciado CBJJE" },
      { "Nome do Atleta": "Sophia Helena Prado", "CPF": "772.339.112-90", "E-mail": "sophia.prado@gmail.com", "Celular WhatsApp": "(11) 99881-2234", "Faixa Atual": "Cinza", "Graus": "2", "Categoria": "Kids / Infantil", "Data Nascimento": "04/06/2016", "Plano": "Mensal", "Valor Mensalidade": "230.00", "Dia Vencimento": "10", "Status Financeiro": "Pago", "Frequência Treinos": "10", "Nome Responsável": "Ricardo Prado (Pai)", "Telefone Responsável": "(11) 99881-2200", "Observações": "Kids 1. Irmã do Arthur Prado." },
      { "Nome do Atleta": "Arthur Prado", "CPF": "772.339.113-71", "E-mail": "arthur.prado@gmail.com", "Celular WhatsApp": "(11) 99881-2234", "Faixa Atual": "Branca", "Graus": "3", "Categoria": "Kids / Infantil", "Data Nascimento": "12/09/2018", "Plano": "Mensal", "Valor Mensalidade": "210.00", "Dia Vencimento": "10", "Status Financeiro": "Pago", "Frequência Treinos": "9", "Nome Responsável": "Ricardo Prado (Pai)", "Telefone Responsável": "(11) 99881-2200", "Observações": "Desconto família 10% irmão matriculado." },
      { "Nome do Atleta": "Diego 'Samurai' Rocha", "CPF": "104.992.839-49", "E-mail": "diego.samurai@bol.com.br", "Celular WhatsApp": "(11) 98455-1122", "Faixa Atual": "Azul", "Graus": "4", "Categoria": "Adulto", "Data Nascimento": "30/12/1997", "Plano": "Mensal", "Valor Mensalidade": "260.00", "Dia Vencimento": "05", "Status Financeiro": "Pago", "Frequência Treinos": "15", "Observações": "Excelente meia guarda profunda" },
      { "Nome do Atleta": "Mariana Souza Lima", "CPF": "392.119.840-77", "E-mail": "mariana.lima@terra.com.br", "Celular WhatsApp": "(11) 97123-8899", "Faixa Atual": "Branca", "Graus": "2", "Categoria": "Adulto", "Data Nascimento": "11/04/1999", "Plano": "Trimestral", "Valor Mensalidade": "250.00", "Dia Vencimento": "15", "Status Financeiro": "Pago", "Frequência Treinos": "11", "Observações": "Pratica defesa pessoal e jiu-jitsu fitness" },
      { "Nome do Atleta": "Rafael 'Tanque' Moreira", "CPF": "829.112.449-01", "E-mail": "rafa.tanque@gmail.com", "Celular WhatsApp": "(11) 99554-3321", "Faixa Atual": "Roxa", "Graus": "1", "Categoria": "Adulto", "Data Nascimento": "05/08/1990", "Plano": "Mensal", "Valor Mensalidade": "260.00", "Dia Vencimento": "10", "Status Financeiro": "Atrasado", "Frequência Treinos": "7", "Observações": "Categoria Pesadíssimo" },
      { "Nome do Atleta": "Thiago Alencar Santos", "CPF": "502.991.332-18", "E-mail": "thiago.alencar@uol.com.br", "Celular WhatsApp": "(11) 98661-4455", "Faixa Atual": "Branca", "Graus": "1", "Categoria": "Adulto", "Data Nascimento": "17/10/2001", "Plano": "Mensal", "Valor Mensalidade": "250.00", "Dia Vencimento": "25", "Status Financeiro": "Pago", "Frequência Treinos": "12", "Observações": "Iniciante dedicado, kimono A2" },
      { "Nome do Atleta": "Camila Nogueira Mendes", "CPF": "619.448.220-33", "E-mail": "camila.mendes@gmail.com", "Celular WhatsApp": "(11) 97332-1100", "Faixa Atual": "Azul", "Graus": "1", "Categoria": "Adulto", "Data Nascimento": "25/03/1994", "Plano": "Anual", "Valor Mensalidade": "220.00", "Dia Vencimento": "10", "Status Financeiro": "Pago", "Frequência Treinos": "13", "Observações": "Atleta de Jiu-Jitsu No-Gi e com Kimono" },
      { "Nome do Atleta": "Pedro Henrique Cavalcanti", "CPF": "401.882.771-55", "E-mail": "pedro.cavalcanti@hotmail.com", "Celular WhatsApp": "(11) 98229-8877", "Faixa Atual": "Laranja", "Graus": "3", "Categoria": "Kids / Infantil", "Data Nascimento": "18/02/2012", "Plano": "Mensal", "Valor Mensalidade": "230.00", "Dia Vencimento": "10", "Status Financeiro": "Pago", "Frequência Treinos": "12", "Nome Responsável": "Marcos Cavalcanti (Pai)", "Telefone Responsável": "(11) 98229-8800", "Observações": "Juvenil competidor, campeão regional" },
      { "Nome do Atleta": "Rodrigo 'Borracha' Paiva", "CPF": "910.223.441-99", "E-mail": "rodrigo.borracha@gmail.com", "Celular WhatsApp": "(11) 99114-5566", "Faixa Atual": "Preta", "Graus": "1", "Categoria": "Adulto", "Data Nascimento": "02/05/1988", "Plano": "Semestral", "Valor Mensalidade": "240.00", "Dia Vencimento": "05", "Status Financeiro": "Pago", "Frequência Treinos": "19", "Observações": "Especialista em guarda De La Riva e Berimbolo" },
      { "Nome do Atleta": "Lucas Gabriel 'Formiga' Costa", "CPF": "119.882.339-40", "E-mail": "lucas.formiga@gmail.com", "Celular WhatsApp": "(11) 98841-0022", "Faixa Atual": "Azul", "Graus": "3", "Categoria": "Adulto", "Data Nascimento": "29/08/1998", "Plano": "Mensal", "Valor Mensalidade": "250.00", "Dia Vencimento": "10", "Status Financeiro": "Pago", "Frequência Treinos": "15", "Observações": "Treina 5x por semana" },
      { "Nome do Atleta": "Larissa Barbosa Dias", "CPF": "330.119.448-61", "E-mail": "larissa.dias@yahoo.com", "Celular WhatsApp": "(11) 97755-4433", "Faixa Atual": "Branca", "Graus": "0", "Categoria": "Adulto", "Data Nascimento": "14/12/2002", "Plano": "Mensal", "Valor Mensalidade": "250.00", "Dia Vencimento": "15", "Status Financeiro": "Pago", "Frequência Treinos": "5", "Observações": "Primeiro mês de treino no tatame" },
      { "Nome do Atleta": "Felipe 'Trator' Brandão", "CPF": "720.449.112-88", "E-mail": "felipe.brandao@gmail.com", "Celular WhatsApp": "(11) 99332-6677", "Faixa Atual": "Roxa", "Graus": "4", "Categoria": "Adulto", "Data Nascimento": "09/06/1992", "Plano": "Anual", "Valor Mensalidade": "220.00", "Dia Vencimento": "10", "Status Financeiro": "Pago", "Frequência Treinos": "17", "Observações": "Próximo à graduação de Faixa Marrom" },
      { "Nome do Atleta": "Cauã Victor Martins", "CPF": "881.229.440-19", "E-mail": "caua.martins@gmail.com", "Celular WhatsApp": "(11) 98114-9988", "Faixa Atual": "Verde", "Graus": "2", "Categoria": "Kids / Infantil", "Data Nascimento": "21/11/2011", "Plano": "Mensal", "Valor Mensalidade": "230.00", "Dia Vencimento": "10", "Status Financeiro": "Pago", "Frequência Treinos": "10", "Nome Responsável": "Fernanda Martins (Mãe)", "Telefone Responsável": "(11) 98114-9900", "Observações": "Turma Juvenil BJJ" },
      { "Nome do Atleta": "Vinicius 'Gladiador' Ramos", "CPF": "550.991.228-34", "E-mail": "vini.gladiador@gmail.com", "Celular WhatsApp": "(11) 97665-4433", "Faixa Atual": "Marrom", "Graus": "3", "Categoria": "Adulto", "Data Nascimento": "03/09/1989", "Plano": "Mensal", "Valor Mensalidade": "260.00", "Dia Vencimento": "10", "Status Financeiro": "Pago", "Frequência Treinos": "18", "Observações": "Capitão da equipe de competição peso Pesado" }
    ]
  },
  {
    id: "demo-raw-csv",
    name: "Exportação CSV Genérica (Cabeçalhos Variados)",
    filename: "Export_Base_Praticantes_CSV.csv",
    description: "Exportação de software antigo com nomes de colunas abreviadas (ex: Praticante, Doc_CPF, Zap, Graduacao, Mensalidade_R$).",
    sourceSystem: "Sistema Legado Desktop / CSV",
    rowsCount: 10,
    data: [
      { "Praticante": "Marcelo Henrique Viana", "Doc_CPF": "11928374650", "Mail_Contato": "marcelo.viana@email.com", "Zap": "11988881122", "Graduacao": "Faixa Azul", "Qtd_Graus": "1", "Tipo_Aluno": "Adulto", "Dt_Nasc": "1994-08-12", "Modalidade": "Mensal", "Mensalidade_R$": "250.00", "Dia_Cobranca": "10", "Situacao_Fin": "Em Dia" },
      { "Praticante": "Julio Cesar 'Navalha'", "Doc_CPF": "22839401928", "Mail_Contato": "julio.navalha@email.com", "Zap": "11977772233", "Graduacao": "Faixa Roxa", "Qtd_Graus": "2", "Tipo_Aluno": "Adulto", "Dt_Nasc": "1991-03-22", "Modalidade": "Anual", "Mensalidade_R$": "220.00", "Dia_Cobranca": "05", "Situacao_Fin": "Em Dia" },
      { "Praticante": "Renan 'Tubarão' Castro", "Doc_CPF": "33940512039", "Mail_Contato": "renan.tubarao@email.com", "Zap": "11966663344", "Graduacao": "Faixa Marrom", "Qtd_Graus": "0", "Tipo_Aluno": "Adulto", "Dt_Nasc": "1988-11-05", "Modalidade": "Semestral", "Mensalidade_R$": "240.00", "Dia_Cobranca": "15", "Situacao_Fin": "Em Dia" },
      { "Praticante": "Alice Moreira Silva", "Doc_CPF": "44051623140", "Mail_Contato": "alice.moreira@email.com", "Zap": "11955554455", "Graduacao": "Faixa Branca", "Qtd_Graus": "3", "Tipo_Aluno": "Kids", "Dt_Nasc": "2016-05-19", "Modalidade": "Mensal", "Mensalidade_R$": "230.00", "Dia_Cobranca": "10", "Situacao_Fin": "Em Dia" },
      { "Praticante": "Leandro 'Cachorrão' Dantas", "Doc_CPF": "55162734251", "Mail_Contato": "leandro.dantas@email.com", "Zap": "11944445566", "Graduacao": "Faixa Preta", "Qtd_Graus": "3", "Tipo_Aluno": "Adulto", "Dt_Nasc": "1983-09-14", "Modalidade": "Anual", "Mensalidade_R$": "200.00", "Dia_Cobranca": "10", "Situacao_Fin": "Em Dia" },
      { "Praticante": "Bruno César Fontana", "Doc_CPF": "66273845362", "Mail_Contato": "bruno.fontana@email.com", "Zap": "11933336677", "Graduacao": "Faixa Branca", "Qtd_Graus": "1", "Tipo_Aluno": "Adulto", "Dt_Nasc": "1999-07-30", "Modalidade": "Mensal", "Mensalidade_R$": "250.00", "Dia_Cobranca": "20", "Situacao_Fin": "Atrasado" },
      { "Praticante": "Carla Roberta Peixoto", "Doc_CPF": "77384956473", "Mail_Contato": "carla.peixoto@email.com", "Zap": "11922227788", "Graduacao": "Faixa Azul", "Qtd_Graus": "0", "Tipo_Aluno": "Adulto", "Dt_Nasc": "1995-12-01", "Modalidade": "Mensal", "Mensalidade_R$": "250.00", "Dia_Cobranca": "10", "Situacao_Fin": "Em Dia" },
      { "Praticante": "Thiago 'Pé de Chumbo' Maia", "Doc_CPF": "88495067584", "Mail_Contato": "thiago.maia@email.com", "Zap": "11911118899", "Graduacao": "Faixa Roxa", "Qtd_Graus": "4", "Tipo_Aluno": "Adulto", "Dt_Nasc": "1990-04-18", "Modalidade": "Semestral", "Mensalidade_R$": "240.00", "Dia_Cobranca": "05", "Situacao_Fin": "Em Dia" },
      { "Praticante": "Otávio Augusto Teles", "Doc_CPF": "99506178695", "Mail_Contato": "otavio.teles@email.com", "Zap": "11900009900", "Graduacao": "Faixa Branca", "Qtd_Graus": "4", "Tipo_Aluno": "Adulto", "Dt_Nasc": "2000-02-14", "Modalidade": "Mensal", "Mensalidade_R$": "250.00", "Dia_Cobranca": "15", "Situacao_Fin": "Em Dia" },
      { "Praticante": "Guilherme 'Coringa' Neves", "Doc_CPF": "10617289706", "Mail_Contato": "gui.coringa@email.com", "Zap": "11989891234", "Graduacao": "Faixa Azul", "Qtd_Graus": "2", "Tipo_Aluno": "Adulto", "Dt_Nasc": "1997-10-25", "Modalidade": "Mensal", "Mensalidade_R$": "250.00", "Dia_Cobranca": "10", "Situacao_Fin": "Em Dia" }
    ]
  }
];

// Generate and trigger download of a clean demo Excel or CSV file
export function downloadDemoSpreadsheetFile(demo: DemoSpreadsheet, format: "xlsx" | "csv" = "xlsx") {
  const ws = XLSX.utils.json_to_sheet(demo.data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Alunos");

  if (format === "xlsx") {
    XLSX.writeFile(wb, demo.filename.endsWith(".xlsx") ? demo.filename : `${demo.id}.xlsx`);
  } else {
    XLSX.writeFile(wb, `${demo.id}.csv`, { bookType: "csv" });
  }
}
